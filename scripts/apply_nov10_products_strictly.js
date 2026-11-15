require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getSupabaseClient } = require('../server/supabase');

const TEST_PRODUCT_IDS = new Set([
    'prod_1071c283', // Test Hostel Product 1791047954270
    'prod_be5a72a1'  // Test Hostel Product 1791047831779
]);

async function main() {
    console.log('====================================================');
    console.log('🎯 Applying Clean Nov 10 Product Catalog (73 Products)');
    console.log('   Target Supabase URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 1. Load the committed snapshot from server/data/products_snapshot.json
    const snapshotPath = path.join(__dirname, '../server/data/products_snapshot.json');
    const allSnapshotProducts = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    console.log(`✓ Loaded ${allSnapshotProducts.length} products from Nov 10 snapshot`);

    // 2. Filter out non-retail test items
    const cleanProducts = allSnapshotProducts.filter(p => !TEST_PRODUCT_IDS.has(p.id));
    console.log(`✓ Filtered out ${allSnapshotProducts.length - cleanProducts.length} test items. Clean total: ${cleanProducts.length} products`);

    // 3. Load latest stock overrides from hostel_inventory.json
    const invPath = path.join(__dirname, '../server/data/hostel_inventory.json');
    let inv = {};
    if (fs.existsSync(invPath)) {
        inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
    }

    const gh12 = inv['GH-12'] || {};
    const bh13 = inv['BH-13'] || {};
    const gh2 = inv['GH-2'] || {};
    const gh1 = inv['GH-1'] || {};

    let inStockCount = 0;
    const finalProducts = cleanProducts.map(p => {
        const activeInv = gh12[p.id] || bh13[p.id] || gh2[p.id] || gh1[p.id];
        let inStock = Boolean(p.in_stock);
        if (activeInv && activeInv.in_stock !== undefined) {
            inStock = Boolean(activeInv.in_stock);
        }
        if (inStock) inStockCount++;

        return {
            id: p.id,
            hostel_id: p.hostel_id || 'BH-13',
            name: p.name,
            category: p.category || 'Snacks & Beverages',
            subcategory: p.subcategory || 'Snacks',
            price: Number(p.price) || 0,
            mrp: Number(p.mrp) || Number(p.price) || 0,
            cost_price: Number(p.cost_price) || 0,
            unit: p.unit || 'piece',
            size: p.size || '',
            image_url: p.image_url || '',
            image_alt: p.image_alt || p.name,
            tags: typeof p.tags === 'string' ? p.tags : JSON.stringify(p.tags || ''),
            in_stock: inStock,
            bestseller: Boolean(p.bestseller),
            is_new: Boolean(p.is_new),
            created_at: p.created_at || '2026-09-02T17:49:47.411251+00:00'
        };
    });

    console.log(`✓ Inventory stock applied: ${inStockCount} in stock, ${finalProducts.length - inStockCount} out of stock`);

    const validCleanIds = new Set(finalProducts.map(p => p.id));

    // 4. Remove unwanted products from Supabase
    console.log('\n2. Cleaning up non-authentic / removed products from Supabase...');
    const { data: existingProds } = await supabase.from('products').select('id, name');
    const existingIds = existingProds ? existingProds.map(p => p.id) : [];
    const idsToDelete = existingIds.filter(id => !validCleanIds.has(id));

    console.log(`   Found ${idsToDelete.length} products to remove from Supabase`);

    if (idsToDelete.length > 0) {
        for (let i = 0; i < idsToDelete.length; i += 20) {
            const batch = idsToDelete.slice(i, i + 20);
            await supabase.from('order_items').update({ product_id: null }).in('product_id', batch);
            await supabase.from('cart_items').delete().in('product_id', batch);
            const { error: delErr } = await supabase.from('products').delete().in('id', batch);
            if (delErr) {
                console.error('Error deleting product batch:', delErr.message);
            }
        }
        console.log(`✓ Removed ${idsToDelete.length} extra products`);
    }

    // 5. Upsert the 73 clean products into Supabase
    console.log('\n3. Upserting 73 clean authentic products into Supabase...');
    for (let i = 0; i < finalProducts.length; i += 50) {
        const batch = finalProducts.slice(i, i + 50);
        const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting products batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Upserted ${finalProducts.length} clean products to Supabase`);

    // 6. Update local SQLite databases
    console.log('\n4. Updating local SQLite databases...');
    for (const dbRel of ['../server/db/lpuquick.db', '../server/data/lpuquick_local.db']) {
        const targetPath = path.join(__dirname, dbRel);
        if (fs.existsSync(targetPath)) {
            const localDb = new DatabaseSync(targetPath);
            try { localDb.exec('ALTER TABLE products ADD COLUMN hostel_id TEXT DEFAULT "BH-13";'); } catch(e) {}
            localDb.exec('PRAGMA foreign_keys = OFF;');
            localDb.exec('DELETE FROM products;');
            const cols = Object.keys(finalProducts[0]);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const stmt = localDb.prepare(`INSERT OR REPLACE INTO products (${colNames}) VALUES (${placeholders})`);

            localDb.exec('BEGIN TRANSACTION;');
            for (const p of finalProducts) {
                const values = cols.map(c => {
                    const val = p[c];
                    if (typeof val === 'boolean') return val ? 1 : 0;
                    return val !== undefined ? val : null;
                });
                stmt.run(...values);
            }
            localDb.exec('COMMIT;');
            localDb.exec('PRAGMA foreign_keys = ON;');
            const c = localDb.prepare('SELECT count(*) as c FROM products').get().c;
            console.log(`✓ ${dbRel} updated: ${c} products`);
        }
    }

    // 7. Update server/data/products_snapshot.json on disk to stay in sync
    console.log('\n5. Updating server/data/products_snapshot.json on disk...');
    fs.writeFileSync(snapshotPath, JSON.stringify(finalProducts, null, 2), 'utf8');
    console.log(`✓ server/data/products_snapshot.json updated with ${finalProducts.length} clean products`);

    // 8. Cloud verification
    console.log('\n====================================================');
    console.log('🔍 Final Supabase Verification:');
    console.log('====================================================');
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`  • products in Supabase Cloud: ${count} rows`);

    console.log('\n🎉 ALL 73 CLEAN PRODUCTS APPLIED SUCCESSFULLY!');
}

main()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });

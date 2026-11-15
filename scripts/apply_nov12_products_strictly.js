require('dotenv').config();
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { DatabaseSync } = require('node:sqlite');
const { getSupabaseClient } = require('../server/supabase');

const VALID_COLUMNS = new Set([
    'id',
    'hostel_id',
    'name',
    'category',
    'subcategory',
    'price',
    'mrp',
    'cost_price',
    'unit',
    'size',
    'image_url',
    'image_alt',
    'tags',
    'in_stock',
    'bestseller',
    'is_new',
    'created_at'
]);

async function main() {
    console.log('====================================================');
    console.log('🎯 Strictly Applying Latest Nov 12 Products to New Database');
    console.log('   Target URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    // 1. Load authentic products from backup
    const backupZipPath = 'C:/Users/Digvi/Downloads/LPUQuick_Full_Backup_2026-11-04T18-14-19-863Z.zip';
    const data = fs.readFileSync(backupZipPath);
    const zip = await JSZip.loadAsync(data);
    const prodStr = await zip.file('database/products.json').async('string');
    const backupProducts = JSON.parse(prodStr);
    console.log(`✓ Loaded ${backupProducts.length} real campus products from catalog`);

    // 2. Load latest Nov 12 stock overrides from hostel_inventory.json
    const invPath = path.join(__dirname, '../server/data/hostel_inventory.json');
    let inv = {};
    if (fs.existsSync(invPath)) {
        inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));
    }

    // Merge hostel stock overrides (e.g. GH-12, BH-13, GH-2, GH-1)
    const gh12 = inv['GH-12'] || {};
    const bh13 = inv['BH-13'] || {};
    const gh2 = inv['GH-2'] || {};
    const gh1 = inv['GH-1'] || {};

    let stockUpdatedCount = 0;
    const nov12Products = backupProducts.map(p => {
        const activeInv = gh12[p.id] || bh13[p.id] || gh2[p.id] || gh1[p.id];
        let inStock = Boolean(p.in_stock);
        if (activeInv && activeInv.in_stock !== undefined) {
            inStock = Boolean(activeInv.in_stock);
            stockUpdatedCount++;
        }

        const cleaned = {
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
            created_at: p.created_at || new Date().toISOString()
        };

        return cleaned;
    });

    console.log(`✓ Applied Nov 12 real-time stock overrides to ${stockUpdatedCount} products`);

    const validNov12Ids = new Set(nov12Products.map(p => p.id));

    // 3. Remove non-authentic/demo products from new Supabase
    console.log('\n2. Cleaning up non-authentic / seed demo products from Supabase...');
    const { data: existingProds } = await supabase.from('products').select('id, name');
    const existingIds = existingProds ? existingProds.map(p => p.id) : [];
    const idsToDelete = existingIds.filter(id => !validNov12Ids.has(id));

    console.log(`   Found ${idsToDelete.length} demo/seed products to remove`);

    if (idsToDelete.length > 0) {
        // Set product_id = null in order_items for these deleted demo products to satisfy foreign key
        for (let i = 0; i < idsToDelete.length; i += 20) {
            const batch = idsToDelete.slice(i, i + 20);
            await supabase.from('order_items').update({ product_id: null }).in('product_id', batch);
            await supabase.from('cart_items').delete().in('product_id', batch);
            const { error: delErr } = await supabase.from('products').delete().in('id', batch);
            if (delErr) {
                console.error('Error deleting product batch:', delErr.message);
            }
        }
        console.log(`✓ Removed ${idsToDelete.length} demo/seed products`);
    }

    // 4. Upsert strictly the 82 authentic Nov 12 products
    console.log('\n3. Upserting strictly authentic Nov 12 products into Supabase...');
    for (let i = 0; i < nov12Products.length; i += 50) {
        const batch = nov12Products.slice(i, i + 50);
        const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting products batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Uploaded all ${nov12Products.length} authentic Nov 12 products`);

    // 5. Also sync strictly to local SQLite dbs
    console.log('\n4. Updating local SQLite databases with strict Nov 12 catalog...');
    for (const dbRel of ['../server/db/lpuquick.db', '../server/data/lpuquick_local.db']) {
        const targetPath = path.join(__dirname, dbRel);
        if (fs.existsSync(targetPath)) {
            const localDb = new DatabaseSync(targetPath);
            try { localDb.exec('ALTER TABLE products ADD COLUMN hostel_id TEXT DEFAULT "BH-13";'); } catch(e) {}
            localDb.exec('PRAGMA foreign_keys = OFF;');
            localDb.exec('DELETE FROM products;');
            const cols = Object.keys(nov12Products[0]);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const stmt = localDb.prepare(`INSERT OR REPLACE INTO products (${colNames}) VALUES (${placeholders})`);

            localDb.exec('BEGIN TRANSACTION;');
            for (const p of nov12Products) {
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

    // 6. Final Cloud Verification
    console.log('\n====================================================');
    console.log('🔍 Final Verification of Supabase Cloud Products:');
    console.log('====================================================');
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`  • products in Supabase Cloud: ${count} rows`);

    // Sample real products
    const { data: sample } = await supabase.from('products').select('id, name, price, in_stock').limit(6);
    console.log('\nSample Live Products:');
    sample.forEach(p => console.log(`  - ${p.name} | ₹${p.price} | ${p.in_stock ? 'IN STOCK' : 'OUT OF STOCK'}`));

    console.log('\n🎉 COMPLETED STRICT PRODUCT UPDATE FOR NOV 12!');
}

main()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });

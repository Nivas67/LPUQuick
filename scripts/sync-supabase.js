require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { getSupabaseClient } = require('../server/supabase');

async function syncToSupabase() {
    console.log('--- Syncing LPUQuick Data to Supabase Cloud ---');

    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Error: Supabase client could not be initialized. Check .env credentials.');
        process.exit(1);
    }

    // 1. Connect to local SQLite database
    const dbPath = path.join(__dirname, '..', 'server', 'db', 'lpuquick.db');
    const localDb = new DatabaseSync(dbPath);

    // 2. Sync Users
    console.log('1. Syncing Users...');
    const users = localDb.prepare('SELECT * FROM users').all();
    if (users.length > 0) {
        const { error: userError } = await supabase.from('users').upsert(users);
        if (userError) console.error('Users sync error:', userError);
        else console.log(`✓ Synced ${users.length} users to Supabase.`);
    }

    // 3. Sync Products
    console.log('2. Syncing Products & Campus Catalog...');
    const products = localDb.prepare('SELECT * FROM products').all();
    if (products.length > 0) {
        const formattedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            subcategory: p.subcategory || '',
            price: Number(p.price),
            mrp: Number(p.mrp || p.price),
            unit: p.unit || 'piece',
            size: p.size || '',
            image_url: p.image_url || '',
            image_alt: p.image_alt || '',
            tags: p.tags || '',
            in_stock: Boolean(p.in_stock),
            bestseller: Boolean(p.bestseller),
            is_new: Boolean(p.is_new)
        }));

        const { error: prodError } = await supabase.from('products').upsert(formattedProducts);
        if (prodError) console.error('Products sync error:', prodError);
        else console.log(`✓ Synced ${formattedProducts.length} products to Supabase.`);
    }

    // 4. Verify count from Supabase
    console.log('3. Verifying live count from Supabase Cloud...');
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Count verification error:', countError);
    } else {
        console.log(`✓ Supabase now has ${count} live products in cloud database!`);
    }

    console.log('\n--- Supabase Database Seeded & Verified Successfully! ---');
}

syncToSupabase().catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
});

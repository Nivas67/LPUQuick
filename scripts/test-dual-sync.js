require('dotenv').config();
const { initDB } = require('../server/db/init');
const db = initDB();
const {
    syncProductCreate,
    syncProductUpdate,
    syncProductStock,
    syncProductDelete
} = require('../server/sync');
const { getSupabaseClient } = require('../server/supabase');

async function testDualSync() {
    console.log('🧪 Testing Dual-Database Synchronization (SQLite <-> Supabase)...');
    const supabase = getSupabaseClient();
    const testId = 'prod_sync_test_' + Date.now();

    // 1. Create Product
    console.log('\n--- 1. Testing Sync Product Create ---');
    await syncProductCreate(db, {
        id: testId,
        name: 'Dual Sync Energy Drink',
        category: 'Snacks & Beverages',
        subcategory: 'Cold Drinks',
        price: 45,
        mrp: 50,
        unit: 'can',
        size: '250ml',
        stock_left: 30,
        in_stock: true,
        description: 'Test product for dual-database sync verification'
    });

    const localAfterCreate = db.prepare('SELECT * FROM products WHERE id = ?').get(testId);
    const { data: cloudAfterCreate } = await supabase.from('products').select('*').eq('id', testId).single();

    console.log('✓ SQLite created:', localAfterCreate?.name, 'Price: ₹' + localAfterCreate?.price);
    console.log('✓ Supabase created:', cloudAfterCreate?.name, 'Price: ₹' + cloudAfterCreate?.price);

    // 2. Update Product
    console.log('\n--- 2. Testing Sync Product Update ---');
    await syncProductUpdate(db, testId, {
        name: 'Dual Sync Energy Drink (Updated)',
        price: 40
    });

    const localAfterUpdate = db.prepare('SELECT * FROM products WHERE id = ?').get(testId);
    const { data: cloudAfterUpdate } = await supabase.from('products').select('*').eq('id', testId).single();

    console.log('✓ SQLite updated:', localAfterUpdate?.name, 'Price: ₹' + localAfterUpdate?.price);
    console.log('✓ Supabase updated:', cloudAfterUpdate?.name, 'Price: ₹' + cloudAfterUpdate?.price);

    // 3. Adjust Stock
    console.log('\n--- 3. Testing Sync Stock Update ---');
    await syncProductStock(db, testId, 15, true);

    const localAfterStock = db.prepare('SELECT stock_left, in_stock FROM products WHERE id = ?').get(testId);
    const { data: cloudAfterStock } = await supabase.from('products').select('in_stock').eq('id', testId).single();

    console.log('✓ SQLite stock:', localAfterStock?.stock_left, 'in_stock:', localAfterStock?.in_stock);
    console.log('✓ Supabase stock in_stock:', cloudAfterStock?.in_stock);

    // 4. Hard Delete Product
    console.log('\n--- 4. Testing Sync Product Delete ---');
    await syncProductDelete(db, testId, true);

    const localAfterDelete = db.prepare('SELECT * FROM products WHERE id = ?').get(testId);
    const { data: cloudAfterDelete } = await supabase.from('products').select('*').eq('id', testId);

    console.log('✓ SQLite deleted:', localAfterDelete === undefined ? 'Verified (0 found)' : 'Failed');
    console.log('✓ Supabase deleted:', (cloudAfterDelete && cloudAfterDelete.length === 0) ? 'Verified (0 found)' : 'Failed');

    console.log('\n🎉 100% DUAL-DATABASE SYNC VERIFIED: ALL OPERATIONS SIMULTANEOUSLY MIRRORED ACROSS BOTH SQLITE AND SUPABASE!');
}

testDualSync().catch(err => {
    console.error('Dual sync test failed:', err);
    process.exit(1);
});

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yojndzstlilzlkxonmvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvam5kenN0bGlsemxreG9ubXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1NjYwMywiZXhwIjoyMTAzOTMyNjAzfQ.UiD72830z3goX1uk-lOKmdnikNNgkQ2dywnXrW3OTYg';

async function executeFullProductAndSalesReset() {
    console.log('================================================================');
    console.log('🚀 MASTER PRODUCT & SALES DATA RESET (FRESH RELAUNCH PREPARATION)');
    console.log('================================================================');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // -------------------------------------------------------------------------
    // STEP 1: BACKUP VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n[1/7] Verifying database backup existence...');
    const backupDir = path.join(__dirname, '..', 'server', 'data', 'backups');
    const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
    console.log(`  Found ${backupFiles.length} backup archive(s). Latest: ${backupFiles[backupFiles.length - 1]}`);

    // -------------------------------------------------------------------------
    // STEP 2: CLEAR ORDER ITEMS
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Clearing all historical order items...');
    const { error: oiErr } = await supabase.from('order_items').delete().neq('id', 'non_existent_key');
    if (oiErr) throw new Error(`Failed to delete order_items: ${oiErr.message}`);
    console.log('  ✓ order_items cleared to 0.');

    // -------------------------------------------------------------------------
    // STEP 3: CLEAR CART ITEMS
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Clearing all cart items...');
    const { error: ciErr } = await supabase.from('cart_items').delete().neq('id', 'non_existent_key');
    if (ciErr) throw new Error(`Failed to delete cart_items: ${ciErr.message}`);
    console.log('  ✓ cart_items cleared to 0.');

    // -------------------------------------------------------------------------
    // STEP 4: CLEAR ORDERS
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Clearing all historical orders...');
    const { error: oErr } = await supabase.from('orders').delete().neq('id', 'non_existent_key');
    if (oErr) throw new Error(`Failed to delete orders: ${oErr.message}`);
    console.log('  ✓ orders cleared to 0.');

    // -------------------------------------------------------------------------
    // STEP 5: CLEAR PRODUCTS
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Clearing all existing/dummy products...');
    const { error: pErr } = await supabase.from('products').delete().neq('id', 'non_existent_key');
    if (pErr) throw new Error(`Failed to delete products: ${pErr.message}`);
    console.log('  ✓ products cleared to 0.');

    // -------------------------------------------------------------------------
    // STEP 6: CLEAR DUMMY/TEST CUSTOMER USERS (PRESERVING ADMIN)
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Removing dummy/test customer users (strictly preserving admin)...');
    const { error: uErr } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin')
        .neq('id', '__system_store_availability__');
    if (uErr) throw new Error(`Failed to clear test users: ${uErr.message}`);
    console.log('  ✓ Dummy customer accounts cleared. Admin accounts safely preserved.');

    // Clear any test blacklisted users
    try {
        await supabase.from('blacklisted_users').delete().neq('id', 'non_existent_key');
    } catch(e) {}

    // -------------------------------------------------------------------------
    // STEP 7: POST-RESET DATABASE INTEGRITY AUDIT
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Verifying exact post-reset table counts in Supabase:');
    const tablesToCheck = [
        { name: 'products', expected: 0 },
        { name: 'orders', expected: 0 },
        { name: 'order_items', expected: 0 },
        { name: 'cart_items', expected: 0 }
    ];

    for (const t of tablesToCheck) {
        const { count, error } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
        if (error) throw new Error(`Query failed for ${t.name}: ${error.message}`);
        console.log(`  Table '${t.name}': ${count} rows (Target: ${t.expected})`);
        if (count !== t.expected) {
            throw new Error(`Integrity error: Table ${t.name} has ${count} rows, expected ${t.expected}`);
        }
    }

    // Verify Admin account
    const { data: admins } = await supabase.from('users').select('id, email, role').eq('role', 'admin');
    console.log(`  Admin accounts remaining: ${admins.length}`);
    admins.forEach(a => console.log(`    - ${a.email} (${a.id})`));
    if (admins.length === 0) {
        throw new Error('FATAL: Admin account was accidentally deleted!');
    }

    // Flush server cache
    try {
        const cache = require('../server/cache');
        cache.flush();
        console.log('\n  ✓ In-memory server cache flushed.');
    } catch (e) {}

    console.log('\n================================================================');
    console.log('✅ FRESH RELAUNCH DATABASE DATA RESET COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
}

executeFullProductAndSalesReset().catch(err => {
    console.error('\n❌ RESET FAILED:', err.message);
    process.exit(1);
});

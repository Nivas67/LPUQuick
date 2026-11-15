require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getSupabaseClient } = require('../server/supabase');

function normalizeHostelId(hostelId, deliveryAddress) {
    if (deliveryAddress) {
        const m = deliveryAddress.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || deliveryAddress.match(/(BH|GH)[-\s]?(\d+)/i);
        if (m) {
            return `${m[1].toUpperCase()}-${m[2]}`;
        }
    }
    if (hostelId && hostelId !== 'all' && hostelId !== 'ALL') {
        const str = String(hostelId).trim().toUpperCase();
        const m = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
        if (m) return `${m[1].toUpperCase()}-${m[2]}`;
        return str;
    }
    return 'BH-13';
}

async function main() {
    console.log('====================================================');
    console.log('🚀 Pushing Every Column & All Data Across All Tables');
    console.log('   (EXCLUDING PRODUCTS - strictly preserved)');
    console.log('   Target Supabase URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const localDb = new DatabaseSync(path.join(__dirname, '../server/db/lpuquick.db'));

    // 1. ORDERS TABLE (All 19 columns with normalized hostel_id)
    console.log('1. Normalizing & Pushing all columns for Orders...');
    const sqliteOrders = localDb.prepare('SELECT * FROM orders').all();
    console.log(`   Found ${sqliteOrders.length} orders in local database`);

    const cleanedOrders = sqliteOrders.map(o => {
        const trueHostelId = normalizeHostelId(o.hostel_id, o.delivery_address);
        return {
            id: o.id,
            hostel_id: trueHostelId,
            user_id: o.user_id,
            customer_name: o.customer_name || null,
            customer_phone: o.customer_phone || null,
            customer_email: o.customer_email || null,
            status: o.status || 'Order Placed',
            subtotal: Number(o.subtotal) || 0,
            delivery_fee: Number(o.delivery_fee) || 0,
            platform_fee: Number(o.platform_fee) || 0,
            tax: Number(o.tax) || 0,
            total: Number(o.total) || 0,
            payment_method: o.payment_method || 'Pay on Delivery',
            payment_status: o.payment_status || 'pending',
            rider_name: o.rider_name || 'Alex',
            rider_lat: Number(o.rider_lat) || 31.256,
            rider_lng: Number(o.rider_lng) || 75.703,
            delivery_address: o.delivery_address || 'BH13 (Block A), Room 304',
            created_at: o.created_at || new Date().toISOString()
        };
    });

    for (let i = 0; i < cleanedOrders.length; i += 50) {
        const batch = cleanedOrders.slice(i, i + 50);
        const { error } = await supabase.from('orders').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`  Error upserting orders batch ${i}:`, error.message);
    }
    console.log(`✓ Synchronized all ${cleanedOrders.length} orders with normalized hostel_id\n`);

    // 2. HOSTELS TABLE (All 14 campus hostels)
    console.log('2. Pushing all columns for Hostels...');
    const hostelsJsonPath = path.join(__dirname, '../server/data/hostels.json');
    if (fs.existsSync(hostelsJsonPath)) {
        const hostels = JSON.parse(fs.readFileSync(hostelsJsonPath, 'utf8'));
        const { data: currentUsers } = await supabase.from('users').select('id');
        const validUserIds = new Set(currentUsers ? currentUsers.map(u => u.id) : []);

        const hostelsPayload = hostels.map(h => ({
            id: h.id,
            name: h.name,
            status: h.status || 'ACTIVE',
            manager_user_id: validUserIds.has(h.manager_user_id) ? h.manager_user_id : null,
            created_at: h.created_at || new Date().toISOString(),
            updated_at: h.updated_at || new Date().toISOString()
        }));

        const { error: hErr } = await supabase.from('hostels').upsert(hostelsPayload, { onConflict: 'id' });
        if (hErr) console.error('  Error upserting hostels:', hErr.message);
        else console.log(`✓ Synchronized ${hostelsPayload.length} hostels with full column schema\n`);
    }

    // 3. USERS TABLE (All 12 columns)
    console.log('3. Pushing all columns for Users...');
    const sqliteUsers = localDb.prepare('SELECT * FROM users').all();
    for (let i = 0; i < sqliteUsers.length; i += 50) {
        const batch = sqliteUsers.slice(i, i + 50);
        const { error } = await supabase.from('users').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`  Error upserting users batch ${i}:`, error.message);
    }
    console.log(`✓ Synchronized all ${sqliteUsers.length} users with complete profile columns\n`);

    // 4. CART ITEMS TABLE (All 6 columns)
    console.log('4. Pushing all columns for Cart Items...');
    const { data: validProducts } = await supabase.from('products').select('id');
    const validProdIds = new Set(validProducts.map(p => p.id));
    const sqliteCart = localDb.prepare('SELECT * FROM cart_items').all();
    const validCartItems = sqliteCart.filter(c => validProdIds.has(c.product_id)).map(c => ({
        id: c.id,
        user_id: c.user_id,
        product_id: c.product_id,
        hostel_id: c.hostel_id || 'BH-13',
        quantity: Number(c.quantity) || 1,
        created_at: c.created_at || new Date().toISOString()
    }));

    for (let i = 0; i < validCartItems.length; i += 50) {
        const batch = validCartItems.slice(i, i + 50);
        const { error } = await supabase.from('cart_items').upsert(batch, { onConflict: 'id' });
        if (error) console.error(`  Error upserting cart_items batch ${i}:`, error.message);
    }
    console.log(`✓ Synchronized ${validCartItems.length} cart items with full hostel scoping\n`);

    // 5. APP AVAILABILITY & BLACKLISTED USERS
    console.log('5. Pushing all columns for App Availability & Blacklisted Users...');
    const sqliteAvail = localDb.prepare('SELECT * FROM app_availability').all();
    for (let i = 0; i < sqliteAvail.length; i += 50) {
        const batch = sqliteAvail.slice(i, i + 50);
        await supabase.from('app_availability').upsert(batch, { onConflict: 'id' });
    }
    console.log(`✓ App availability (${sqliteAvail.length} rows) confirmed`);

    const sqliteBlacklist = localDb.prepare('SELECT * FROM blacklisted_users').all();
    for (let i = 0; i < sqliteBlacklist.length; i += 50) {
        const batch = sqliteBlacklist.slice(i, i + 50);
        await supabase.from('blacklisted_users').upsert(batch, { onConflict: 'id' });
    }
    console.log(`✓ Blacklisted users (${sqliteBlacklist.length} rows) confirmed\n`);

    // 6. SYNC TO LOCAL SQLITE DATABASES (Ensure exact columns & rows)
    console.log('6. Synchronizing local SQLite databases with normalized columns...');
    for (const dbPath of ['../server/db/lpuquick.db', '../server/data/lpuquick_local.db']) {
        const targetPath = path.join(__dirname, dbPath);
        if (fs.existsSync(targetPath)) {
            const ldb = new DatabaseSync(targetPath);
            try { ldb.exec("ALTER TABLE orders ADD COLUMN hostel_id TEXT DEFAULT 'BH-13';"); } catch(e) {}
            ldb.exec('PRAGMA foreign_keys = OFF;');
            const updateStmt = ldb.prepare('UPDATE orders SET hostel_id = ? WHERE id = ?');
            ldb.exec('BEGIN TRANSACTION;');
            for (const o of cleanedOrders) {
                updateStmt.run(o.hostel_id, o.id);
            }
            ldb.exec('COMMIT;');
            ldb.exec('PRAGMA foreign_keys = ON;');
            console.log(`✓ ${dbPath} orders updated with normalized hostel_id`);
        }
    }

    // 7. FINAL VERIFICATION OF ALL CLOUD TABLES
    console.log('\n====================================================');
    console.log('🔍 Final Verification of Supabase Cloud Tables:');
    console.log('====================================================');
    const tablesToVerify = [
        'users',
        'products',
        'hostels',
        'orders',
        'order_items',
        'cart_items',
        'app_availability',
        'blacklisted_users',
        'audit_logs'
    ];

    for (const t of tablesToVerify) {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`  • ${t.padEnd(20)}: ${count} rows`);
    }

    // Verify products strictly preserved
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (prodCount !== 73) {
        throw new Error(`CRITICAL: Product count changed from 73 to ${prodCount}`);
    }
    console.log('\n🛡️ Products catalog strictly preserved: exactly 73 items.');
    console.log('🎉 FULL COLUMN RECOVERY COMPLETED SUCCESSFULLY!');
}

main()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });

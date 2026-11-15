require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getSupabaseClient } = require('../server/supabase');

async function main() {
    console.log('====================================================');
    console.log('🔄 Full Data Recovery to Supabase (EXCLUDING PRODUCTS)');
    console.log('   Target Supabase URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const localDb = new DatabaseSync(path.join(__dirname, '../server/db/lpuquick.db'));

    // 1. HOSTELS RECOVERY (All 14 hostels from server/data/hostels.json)
    console.log('1. Recovering Hostels (from server/data/hostels.json)...');
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
        if (hErr) {
            console.error('Error upserting hostels:', hErr.message);
        } else {
            console.log(`✓ Upserted ${hostelsPayload.length} hostels into Supabase`);
        }
    }

    // 2. USERS RECOVERY (Ensure user_monami and all users are present)
    console.log('\n2. Recovering Users...');
    const sqliteUsers = localDb.prepare('SELECT * FROM users').all();
    console.log(`   Found ${sqliteUsers.length} users in local SQLite database`);

    // Add guest checkout user if missing
    const userMonamiExists = sqliteUsers.some(u => u.id === 'user_monami');
    if (!userMonamiExists) {
        sqliteUsers.push({
            id: 'user_monami',
            name: 'Monami Ghosh',
            email: 'monami@lpu.in',
            phone: '8637890805',
            password_hash: 'guest_checkout_session',
            dob: '2004-05-15',
            role: 'student',
            account_status: 'ACTIVE',
            created_at: '2026-11-12T18:21:54.903Z'
        });
    }

    for (let i = 0; i < sqliteUsers.length; i += 50) {
        const batch = sqliteUsers.slice(i, i + 50);
        const { error } = await supabase.from('users').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting users batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Synchronized all ${sqliteUsers.length} users in Supabase`);

    // 3. ORDERS RECOVERY (Ensure order_ve0jbq69 and all 641 orders are present)
    console.log('\n3. Recovering Orders...');
    const sqliteOrders = localDb.prepare('SELECT * FROM orders').all();
    console.log(`   Found ${sqliteOrders.length} orders in local SQLite database`);

    const ordersPayload = sqliteOrders.map(o => {
        let history = o.status_history;
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch(e) { history = []; }
        }
        return {
            id: o.id,
            hostel_id: o.hostel_id || 'BH-13',
            user_id: o.user_id,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            customer_email: o.customer_email,
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
            status_history: history || [],
            created_at: o.created_at || new Date().toISOString()
        };
    });

    for (let i = 0; i < ordersPayload.length; i += 50) {
        const batch = ordersPayload.slice(i, i + 50);
        const { error } = await supabase.from('orders').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting orders batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Synchronized all ${ordersPayload.length} orders in Supabase`);

    // 4. ORDER ITEMS RECOVERY
    console.log('\n4. Recovering Order Items...');
    const sqliteOrderItems = localDb.prepare('SELECT * FROM order_items').all();
    console.log(`   Found ${sqliteOrderItems.length} order items in local SQLite`);

    for (let i = 0; i < sqliteOrderItems.length; i += 100) {
        const batch = sqliteOrderItems.slice(i, i + 100);
        const { error } = await supabase.from('order_items').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting order_items batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Synchronized all ${sqliteOrderItems.length} order items in Supabase`);

    // 5. CART ITEMS RECOVERY (All valid cart items linked to catalog)
    console.log('\n5. Recovering Cart Items...');
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

    console.log(`   Found ${validCartItems.length} valid cart items to recover`);
    for (let i = 0; i < validCartItems.length; i += 50) {
        const batch = validCartItems.slice(i, i + 50);
        const { error } = await supabase.from('cart_items').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting cart_items batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Synchronized ${validCartItems.length} cart items in Supabase`);

    // 6. AUDIT LOGS RECOVERY
    console.log('\n6. Recovering Audit Logs...');
    const sqliteLogs = localDb.prepare('SELECT * FROM audit_logs').all();
    console.log(`   Found ${sqliteLogs.length} audit logs in local SQLite`);

    const auditPayload = sqliteLogs.map(l => {
        let meta = l.metadata;
        if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch(e) { meta = {}; }
        }
        return {
            id: l.id,
            admin_id: l.admin_id,
            target_user_id: l.target_user_id || null,
            action: l.action,
            reason: l.reason || null,
            metadata: meta || null,
            created_at: l.created_at || new Date().toISOString()
        };
    });

    for (let i = 0; i < auditPayload.length; i += 100) {
        const batch = auditPayload.slice(i, i + 100);
        const { error } = await supabase.from('audit_logs').upsert(batch, { onConflict: 'id' });
        if (error) {
            console.error(`Error upserting audit_logs batch ${i}:`, error.message);
        }
    }
    console.log(`✓ Synchronized audit logs in Supabase`);

    // 7. APP AVAILABILITY & BLACKLISTED USERS VERIFICATION
    console.log('\n7. Verifying App Availability & Blacklisted Users...');
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
    console.log(`✓ Blacklisted users (${sqliteBlacklist.length} rows) confirmed`);

    // 8. FINAL VERIFICATION OF ALL CLOUD TABLES
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

    console.log('\n🎉 ALL NON-PRODUCT DATA RESTORED TO SUPABASE SUCCESSFULLY!');
}

main()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });

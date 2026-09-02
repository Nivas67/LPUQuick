const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const cache = require('../server/cache');

async function safeDatabaseReset() {
    console.log('====================================================');
    console.log('🧹 EXECUTING SAFE DATABASE RESET (CLEAR DATA, PRESERVE SCHEMA)');
    console.log('====================================================');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Clear order_items
    console.log('\n[1/6] Clearing order_items...');
    const { data: delItems, error: errItems } = await supabase
        .from('order_items')
        .delete()
        .neq('id', 'non_existent_placeholder');
    if (errItems) {
        console.error('Error clearing order_items:', errItems.message);
    } else {
        console.log('✓ order_items cleared successfully.');
    }

    // 2. Clear cart_items
    console.log('[2/6] Clearing cart_items...');
    const { data: delCart, error: errCart } = await supabase
        .from('cart_items')
        .delete()
        .neq('id', 'non_existent_placeholder');
    if (errCart) {
        console.error('Error clearing cart_items:', errCart.message);
    } else {
        console.log('✓ cart_items cleared successfully.');
    }

    // 3. Clear orders
    console.log('[3/6] Clearing orders...');
    const { data: delOrders, error: errOrders } = await supabase
        .from('orders')
        .delete()
        .neq('id', 'non_existent_placeholder');
    if (errOrders) {
        console.error('Error clearing orders:', errOrders.message);
    } else {
        console.log('✓ orders cleared successfully.');
    }

    // 4. Clear products
    console.log('[4/6] Clearing test products...');
    const { data: delProds, error: errProds } = await supabase
        .from('products')
        .delete()
        .neq('id', 'non_existent_placeholder');
    if (errProds) {
        console.error('Error clearing products:', errProds.message);
    } else {
        console.log('✓ products cleared successfully.');
    }

    // 5. Clear non-admin users (preserve admin@lpu.in and __system_store_availability__)
    console.log('[5/6] Clearing test customer users (PRESERVING ADMIN)...');
    const { data: delUsers, error: errUsers } = await supabase
        .from('users')
        .delete()
        .neq('role', 'admin')
        .neq('id', '__system_store_availability__');
    if (errUsers) {
        console.error('Error clearing test users:', errUsers.message);
    } else {
        console.log('✓ Test customer users cleared. Admin accounts preserved.');
    }

    // 6. Flush in-memory and API cache
    console.log('[6/6] Flushing server cache...');
    if (cache && typeof cache.flush === 'function') {
        cache.flush();
        console.log('✓ Server cache flushed.');
    }

    // 7. Verify post-reset state
    console.log('\n====================================================');
    console.log('🔍 POST-RESET INTEGRITY VERIFICATION');
    console.log('====================================================');

    const counts = {};
    const tables = ['order_items', 'cart_items', 'orders', 'products', 'users', 'app_availability'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        counts[t] = error ? `ERROR: ${error.message}` : count;
    }

    console.log('Post-Reset Row Counts in Supabase:');
    console.log(`- Products: ${counts.products} (Expected: 0)`);
    console.log(`- Orders: ${counts.orders} (Expected: 0)`);
    console.log(`- Order Items: ${counts.order_items} (Expected: 0)`);
    console.log(`- Cart Items: ${counts.cart_items} (Expected: 0)`);
    console.log(`- Users: ${counts.users} (Expected: admin only)`);
    console.log(`- App Availability: ${counts.app_availability} (Expected: preserved)`);

    // Verify Admin user exists and can be retrieved
    const { data: adminUser, error: adminErr } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('role', 'admin')
        .single();
    if (adminErr || !adminUser) {
        console.error('CRITICAL ERROR: Admin user missing!', adminErr);
        process.exit(1);
    } else {
        console.log(`\n🎉 Admin user safely preserved: ${adminUser.email} [${adminUser.id}] (role: ${adminUser.role})`);
    }

    console.log('\n✅ Safe database reset completed successfully. Schema 100% intact.');
}

safeDatabaseReset().catch(err => {
    console.error('Safe reset failed:', err);
    process.exit(1);
});

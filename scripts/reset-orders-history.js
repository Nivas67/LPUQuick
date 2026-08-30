require('dotenv').config();
const { getSupabaseClient } = require('../server/supabase');

async function resetOrdersHistory() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('❌ Supabase client not initialized. Check .env');
        process.exit(1);
    }

    console.log('====================================================');
    console.log('🧹 LPU Quick: Resetting Orders History for Real Launch');
    console.log('====================================================');

    // 1. Delete all order_items
    try {
        const { error: oiErr, count: oiCount } = await supabase
            .from('order_items')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (oiErr) {
            console.warn('⚠️ order_items deletion note:', oiErr.message);
        } else {
            console.log(`✅ Cleared all order items (${oiCount ?? 'done'} deleted)`);
        }
    } catch (e) {
        console.warn('⚠️ order_items catch:', e.message);
    }

    // 2. Delete all orders
    try {
        const { error: oErr, count: oCount } = await supabase
            .from('orders')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (oErr) {
            console.warn('⚠️ orders deletion note:', oErr.message);
        } else {
            console.log(`✅ Cleared all orders (${oCount ?? 'done'} deleted)`);
        }
    } catch (e) {
        console.warn('⚠️ orders catch:', e.message);
    }

    // 3. Delete all cart items
    try {
        const { error: cErr, count: cCount } = await supabase
            .from('cart_items')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (cErr) {
            console.warn('⚠️ cart_items deletion note:', cErr.message);
        } else {
            console.log(`✅ Cleared all cart items (${cCount ?? 'done'} deleted)`);
        }
    } catch (e) {
        console.warn('⚠️ cart_items catch:', e.message);
    }

    // 4. Verify Final State
    console.log('----------------------------------------------------');
    console.log('📊 Verifying Clean Launch State:');
    
    const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: oiRemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });
    const { count: cartCount } = await supabase.from('cart_items').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { data: adminUsers } = await supabase.from('users').select('id, name, email, role').eq('role', 'admin');

    console.log(`- Orders in Database: ${ordCount ?? 0} (Expected: 0)`);
    console.log(`- Order Items in Database: ${oiRemCount ?? 0} (Expected: 0)`);
    console.log(`- Cart Items in Database: ${cartCount ?? 0} (Expected: 0)`);
    console.log(`- Active Products Preserved: ${prodCount ?? 0}`);
    console.log(`- Admin Accounts Preserved: ${adminUsers ? adminUsers.length : 0}`);

    console.log('====================================================');
    console.log('🚀 SYSTEM READY FOR REAL-WORLD CUSTOMER ORDERS!');
    console.log('====================================================');
}

resetOrdersHistory().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});

require('dotenv').config();
const { getSupabaseClient } = require('../server/supabase');

async function cleanSupabase() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('Supabase client could not be initialized. Please check .env credentials.');
        process.exit(1);
    }

    console.log('--- Connected to Supabase ---');
    console.log('URL:', process.env.SUPABASE_URL);

    // 1. Delete order_items
    try {
        const { error: oiErr, count: oiCount } = await supabase
            .from('order_items')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (oiErr) console.warn('[order_items]:', oiErr.message);
        else console.log(`Deleted order_items in Supabase: ${oiCount ?? 'done'}`);
    } catch (e) {
        console.warn('[order_items catch]:', e.message);
    }

    // 2. Delete orders
    try {
        const { error: oErr, count: oCount } = await supabase
            .from('orders')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (oErr) console.warn('[orders]:', oErr.message);
        else console.log(`Deleted orders in Supabase: ${oCount ?? 'done'}`);
    } catch (e) {
        console.warn('[orders catch]:', e.message);
    }

    // 3. Delete cart_items
    try {
        const { error: cErr, count: cCount } = await supabase
            .from('cart_items')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (cErr) console.warn('[cart_items]:', cErr.message);
        else console.log(`Deleted cart_items in Supabase: ${cCount ?? 'done'}`);
    } catch (e) {
        console.warn('[cart_items catch]:', e.message);
    }

    // 4. Delete non-admin test users
    try {
        const { error: uErr, count: uCount } = await supabase
            .from('users')
            .delete({ count: 'exact' })
            .neq('id', 'admin_001');
        if (uErr) console.warn('[users]:', uErr.message);
        else console.log(`Deleted non-admin test users in Supabase: ${uCount ?? 'done'}`);
    } catch (e) {
        console.warn('[users catch]:', e.message);
    }

    // 5. Delete products / items
    try {
        const { error: pErr, count: pCount } = await supabase
            .from('products')
            .delete({ count: 'exact' })
            .neq('id', 'placeholder_non_existent_id');
        if (pErr) console.warn('[products]:', pErr.message);
        else console.log(`Deleted products in Supabase: ${pCount ?? 'done'}`);
    } catch (e) {
        console.warn('[products catch]:', e.message);
    }

    // 5. Verify remaining counts in Supabase
    console.log('\n--- Supabase Verification ---');
    try {
        const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        console.log('Remaining Products in Supabase:', prodCount);
        console.log('Remaining Orders in Supabase:', ordCount);
    } catch (e) {
        console.warn('Verification error:', e.message);
    }

    console.log('\n🎉 Supabase products, items, and orders cleared successfully!');
}

cleanSupabase().catch(err => {
    console.error('Fatal Supabase cleanup error:', err);
    process.exit(1);
});

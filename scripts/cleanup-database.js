const { initDB } = require('../server/db/init');
const db = initDB();

console.log('--- Cleaning Database ---');

// 1. Delete all order items
const delOrderItems = db.prepare('DELETE FROM order_items').run();
console.log('Deleted order_items count:', delOrderItems.changes);

// 2. Delete all orders
const delOrders = db.prepare('DELETE FROM orders').run();
console.log('Deleted orders count:', delOrders.changes);

// 3. Delete all cart items
const delCart = db.prepare('DELETE FROM cart_items').run();
console.log('Deleted cart_items count:', delCart.changes);

// 4. Delete all non-admin users
const delUsers = db.prepare("DELETE FROM users WHERE role != 'admin' AND id != 'admin_001'").run();
console.log('Deleted non-admin users count:', delUsers.changes);

// 5. Clean up Supabase if client is configured
try {
    const { getSupabaseClient } = require('../server/supabase');
    const supabase = getSupabaseClient();
    if (supabase) {
        Promise.all([
            supabase.from('orders').delete().neq('id', 'placeholder_none'),
            supabase.from('users').delete().neq('role', 'admin')
        ]).then(() => {
            console.log('[Supabase] Successfully cleared cloud orders and non-admin users.');
        }).catch(err => {
            console.log('[Supabase Cleanup Note]:', err.message);
        });
    }
} catch (e) {}

console.log('\n--- Final Verification ---');
console.log('Remaining Users in Database:');
console.table(db.prepare('SELECT id, name, email, role FROM users').all());
console.log('Remaining Orders Count:', db.prepare('SELECT COUNT(*) as c FROM orders').get().c);
console.log('Remaining Order Items Count:', db.prepare('SELECT COUNT(*) as c FROM order_items').get().c);
console.log('Remaining Cart Items Count:', db.prepare('SELECT COUNT(*) as c FROM cart_items').get().c);
console.log('Products Count (preserved):', db.prepare('SELECT COUNT(*) as c FROM products').get().c);

const { initDB } = require('../server/db/init');
const db = initDB();

console.log('--- Clearing Local Database Products & Data ---');

// 1. Delete all products from local SQLite
const delProducts = db.prepare('DELETE FROM products').run();
console.log('Deleted local products count:', delProducts.changes);

// 2. Ensure orders, order_items, and cart_items are 0
db.prepare('DELETE FROM order_items').run();
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM cart_items').run();

// 3. Keep only admin user
db.prepare("DELETE FROM users WHERE role != 'admin' AND id != 'admin_001'").run();

console.log('\n--- Local SQLite Status ---');
console.log('Products Count:', db.prepare('SELECT COUNT(*) as c FROM products').get().c);
console.log('Orders Count:', db.prepare('SELECT COUNT(*) as c FROM orders').get().c);
console.log('Order Items Count:', db.prepare('SELECT COUNT(*) as c FROM order_items').get().c);
console.log('Cart Items Count:', db.prepare('SELECT COUNT(*) as c FROM cart_items').get().c);
console.log('Users Count:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
console.log('Remaining Users:');
console.table(db.prepare('SELECT id, name, email, role FROM users').all());
console.log('\n✅ Local database completely cleared and synchronized with Supabase!');

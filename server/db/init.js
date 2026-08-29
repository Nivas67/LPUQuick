const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'lpuquick.db');

function initDB() {
    const db = new DatabaseSync(DB_PATH);

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);

    // Check if data already seeded
    const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
    if (!count || count.c === 0) {
        const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8');
        db.exec(seed);
        console.log('[DB] Database seeded with initial data.');
    } else {
        console.log('[DB] Database already contains data, skipping seed.');
    }

    // Safe migrations for helper columns
    try { db.exec("ALTER TABLE products ADD COLUMN stock_left INTEGER DEFAULT 35;"); } catch (e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1;"); } catch (e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN description TEXT DEFAULT '';"); } catch (e) {}
    try { db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';"); } catch (e) {}
    try { db.exec("ALTER TABLE orders ADD COLUMN status_history TEXT DEFAULT '[]';"); } catch (e) {}

    // Ensure default admin exists
    const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@lpu.in' OR role = 'admin'").get();
    if (!adminExists) {
        db.prepare(`
            INSERT INTO users (id, name, email, phone, password_hash, dob, role)
            VALUES ('admin_001', 'LPU Quick Admin', 'admin@lpu.in', '9999999999', 'admin123', '2000-01-01', 'admin')
        `).run();
        console.log('[DB] Default admin user initialized: admin@lpu.in');
    }

    // Fix any zero stock on in-stock products
    db.prepare("UPDATE products SET stock_left = 40 WHERE stock_left = 0 AND in_stock = 1").run();
    db.prepare("UPDATE products SET is_active = 1 WHERE is_active IS NULL").run();

    console.log(`[DB] Connected to SQLite at ${DB_PATH}`);
    return db;
}

module.exports = { initDB, DB_PATH };

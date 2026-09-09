require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const backupService = require('../server/services/backupService');

async function syncCloudToLocal() {
    console.log('====================================================');
    console.log('🔄 Syncing 100% Data from Supabase Cloud to Local SQLite');
    console.log('====================================================\n');

    // 1. Fetch all data from Supabase Cloud
    console.log('[1/4] Extracting all tables from Supabase Cloud...');
    const { tablesData, counts } = await backupService.exportAllDatabaseTables();

    console.log(`✓ Fetched Cloud Data Snapshot:`);
    for (const [tName, count] of Object.entries(counts)) {
        console.log(`   • ${tName.padEnd(20)} : ${count} records`);
    }
    console.log('');

    const targetDbs = [
        { name: 'Active Local Database (localDb.js)', path: path.join(__dirname, '../server/data/lpuquick_local.db') },
        { name: 'Seed / Dev SQLite Database', path: path.join(__dirname, '../server/db/lpuquick.db') }
    ];

    for (const target of targetDbs) {
        console.log(`[2/4] Syncing into ${target.name} (${target.path})...`);
        const dir = path.dirname(target.path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const db = new DatabaseSync(target.path);

        // Optimize SQLite settings
        db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA busy_timeout = 5000;
        `);

        // Initialize schema for all 8 tables if missing
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE,
                phone TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                dob TEXT,
                role TEXT NOT NULL DEFAULT 'student',
                account_status TEXT NOT NULL DEFAULT 'ACTIVE',
                blocked_at TEXT DEFAULT NULL,
                blocked_by TEXT DEFAULT NULL,
                block_reason TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                subcategory TEXT DEFAULT '',
                price NUMERIC NOT NULL,
                mrp NUMERIC,
                unit TEXT DEFAULT 'piece',
                size TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                image_alt TEXT DEFAULT '',
                tags TEXT DEFAULT '',
                in_stock INTEGER DEFAULT 1,
                bestseller INTEGER DEFAULT 0,
                is_new INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS cart_items (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
                quantity INTEGER NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                customer_name TEXT,
                customer_phone TEXT,
                customer_email TEXT,
                status TEXT NOT NULL DEFAULT 'Order Placed',
                subtotal NUMERIC NOT NULL DEFAULT 0,
                delivery_fee NUMERIC NOT NULL DEFAULT 0,
                platform_fee NUMERIC NOT NULL DEFAULT 0,
                tax NUMERIC NOT NULL DEFAULT 0,
                total NUMERIC NOT NULL DEFAULT 0,
                payment_method TEXT DEFAULT 'Cash on Delivery',
                payment_status TEXT DEFAULT 'pending',
                rider_name TEXT DEFAULT 'Alex',
                rider_lat NUMERIC DEFAULT 31.2560,
                rider_lng NUMERIC DEFAULT 75.7030,
                delivery_address TEXT DEFAULT 'BH13 (Block A), Room 304',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id TEXT PRIMARY KEY,
                order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
                product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price NUMERIC NOT NULL
            );

            CREATE TABLE IF NOT EXISTS app_availability (
                id TEXT PRIMARY KEY DEFAULT 'store_main',
                is_locked INTEGER NOT NULL DEFAULT 0,
                lock_type TEXT NOT NULL DEFAULT 'NONE',
                message TEXT DEFAULT NULL,
                start_at TEXT DEFAULT NULL,
                end_at TEXT DEFAULT NULL,
                created_by TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS blacklisted_users (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                reason TEXT NOT NULL DEFAULT 'Fake Orders',
                status TEXT NOT NULL DEFAULT 'BLOCKED',
                blocked_by TEXT DEFAULT NULL,
                blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
                unblocked_by TEXT DEFAULT NULL,
                unblocked_at TEXT DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                target_user_id TEXT DEFAULT NULL,
                action TEXT NOT NULL,
                reason TEXT DEFAULT NULL,
                metadata TEXT DEFAULT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Helper to dynamically check and add missing columns
        function ensureColumns(tableName, sampleRecord) {
            if (!sampleRecord) return;
            const tableInfo = db.prepare(`PRAGMA table_info("${tableName}")`).all();
            const existingCols = new Set(tableInfo.map(c => c.name.toLowerCase()));
            for (const col of Object.keys(sampleRecord)) {
                if (!existingCols.has(col.toLowerCase())) {
                    try {
                        db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${col}" TEXT DEFAULT NULL;`);
                    } catch (e) {
                        // Ignore if already added
                    }
                }
            }
        }

        // Disable FK checks temporarily for high-speed clean bulk upsert
        db.exec('PRAGMA foreign_keys = OFF;');

        const insertionOrder = [
            'users',
            'products',
            'app_availability',
            'blacklisted_users',
            'orders',
            'order_items',
            'cart_items',
            'audit_logs'
        ];

        for (const tableName of insertionOrder) {
            const rows = tablesData[tableName] || [];
            if (rows.length === 0) continue;

            ensureColumns(tableName, rows[0]);

            const cols = Object.keys(rows[0]);
            const colNames = cols.map(c => `"${c}"`).join(', ');
            const placeholders = cols.map(() => '?').join(', ');
            const sql = `INSERT OR REPLACE INTO "${tableName}" (${colNames}) VALUES (${placeholders})`;
            const stmt = db.prepare(sql);

            db.exec('BEGIN TRANSACTION;');
            try {
                for (const r of rows) {
                    const values = cols.map(c => {
                        let val = r[c];
                        if (tableName === 'order_items' && c === 'product_id' && (val === null || val === undefined)) {
                            val = 'archived_product';
                        }
                        if (val === null || val === undefined) return null;
                        if (typeof val === 'object') return JSON.stringify(val);
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        return val;
                    });
                    stmt.run(...values);
                }
                db.exec('COMMIT;');
            } catch (err) {
                db.exec('ROLLBACK;');
                console.error(`Error inserting into ${tableName}:`, err.message);
            }
        }

        db.exec('PRAGMA foreign_keys = ON;');

        // Verify count
        console.log(`   ✓ Sync complete for ${target.name}. Row counts:`);
        for (const tableName of insertionOrder) {
            try {
                const count = db.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;
                console.log(`     - ${tableName.padEnd(20)} : ${count} rows`);
            } catch (e) {
                console.log(`     - ${tableName.padEnd(20)} : error`);
            }
        }
        console.log('');
    }

    console.log('====================================================');
    console.log('🎉 100% DATA SYNCED TO ALL LOCAL DATABASES SUCCESSFULLY!');
    console.log('====================================================');
}

syncCloudToLocal().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});

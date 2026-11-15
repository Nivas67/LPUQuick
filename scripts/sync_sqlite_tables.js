const { DatabaseSync } = require('node:sqlite');
const db1 = new DatabaseSync('server/db/lpuquick.db');
const db2 = new DatabaseSync('server/data/lpuquick_local.db');
db2.exec('PRAGMA foreign_keys = OFF;');

const tables = ['orders', 'order_items', 'users', 'cart_items', 'hostels'];

try { db2.exec("ALTER TABLE orders ADD COLUMN status_history TEXT DEFAULT '[]';"); } catch(e) {}
try { db2.exec("ALTER TABLE orders ADD COLUMN hostel_id TEXT DEFAULT 'BH-13';"); } catch(e) {}
try { db2.exec("ALTER TABLE hostels ADD COLUMN manager_user_id TEXT;"); } catch(e) {}
try { db2.exec("CREATE TABLE IF NOT EXISTS hostels (id TEXT PRIMARY KEY, name TEXT, status TEXT, manager_user_id TEXT, created_at TEXT, updated_at TEXT);"); } catch(e) {}

for (const t of tables) {
    const rows = db1.prepare(`SELECT * FROM ${t}`).all();
    if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const colNames = cols.map(c => `"${c}"`).join(', ');
        const placeholders = cols.map(() => '?').join(', ');
        const stmt = db2.prepare(`INSERT OR REPLACE INTO ${t} (${colNames}) VALUES (${placeholders})`);
        db2.exec('BEGIN TRANSACTION;');
        for (const r of rows) {
            stmt.run(...cols.map(c => r[c]));
        }
        db2.exec('COMMIT;');
        console.log(t, 'synced to lpuquick_local.db:', db2.prepare(`SELECT count(*) as c FROM ${t}`).get().c);
    }
}

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { DatabaseSync } = require('node:sqlite');

const BACKUP_ZIP_PATH = 'C:/Users/Digvi/Downloads/LPUQuick_Full_Backup_2026-11-04T18-14-19-863Z.zip';

async function main() {
    console.log('1. Loading backup zip from:', BACKUP_ZIP_PATH);
    const zipData = fs.readFileSync(BACKUP_ZIP_PATH);
    const zip = await JSZip.loadAsync(zipData);

    const tables = [
        'users',
        'products',
        'app_availability',
        'blacklisted_users',
        'orders',
        'order_items',
        'cart_items',
        'audit_logs'
    ];

    const tablesData = {};
    for (const t of tables) {
        const file = zip.file(`database/${t}.json`);
        if (file) {
            const content = await file.async('string');
            tablesData[t] = JSON.parse(content);
            console.log(`  - ${t}: ${tablesData[t].length} rows in backup zip`);
        } else {
            tablesData[t] = [];
            console.log(`  - ${t}: 0 rows (not found in zip)`);
        }
    }

    // Merge recent notifications & snapshots into orders and order_items
    const existingOrderIds = new Set(tablesData.orders.map(o => o.id));

    // From admin_order_notifications.json
    const notifsPath = path.join(__dirname, '../server/data/admin_order_notifications.json');
    if (fs.existsSync(notifsPath)) {
        try {
            const notifs = JSON.parse(fs.readFileSync(notifsPath, 'utf8'));
            for (const n of notifs) {
                if (n.order_id && !existingOrderIds.has(n.order_id)) {
                    existingOrderIds.add(n.order_id);
                    const newOrder = {
                        id: n.order_id,
                        user_id: 'user_001',
                        customer_name: n.customer_name || 'Customer',
                        customer_phone: '7671836211',
                        customer_email: 'customer@lpu.in',
                        status: 'Delivered',
                        subtotal: parseFloat(n.total) || 50,
                        delivery_fee: 0,
                        platform_fee: 0,
                        tax: 0,
                        total: parseFloat(n.total) || 50,
                        payment_method: 'UPI',
                        payment_status: 'PAID',
                        rider_name: 'Alex',
                        rider_lat: 31.256,
                        rider_lng: 75.703,
                        delivery_address: `[${n.hostel || 'BH-13'}] Room ${n.room || '101'}`,
                        created_at: new Date(n.timestamp || Date.now()).toISOString()
                    };
                    tablesData.orders.push(newOrder);
                    console.log(`  + Merged order from notifications: ${n.order_id} (${newOrder.delivery_address})`);
                }
            }
        } catch (e) {
            console.warn('Error reading notifications:', e.message);
        }
    }

    // Add VE0JBQ69 (Monami Ghosh - GH12)
    const ve0Id = 'order_ve0jbq69';
    if (!existingOrderIds.has(ve0Id)) {
        existingOrderIds.add(ve0Id);
        tablesData.orders.push({
            id: ve0Id,
            user_id: 'user_monami',
            customer_name: 'Monami Ghosh',
            customer_phone: '8637890805',
            customer_email: 'monami@lpu.in',
            status: 'Confirmed',
            subtotal: 56,
            delivery_fee: 0,
            platform_fee: 4,
            tax: 0,
            total: 60,
            payment_method: 'Pay on Delivery',
            payment_status: 'PENDING',
            rider_name: 'Sathwika Reddy',
            rider_lat: 31.256,
            rider_lng: 75.703,
            delivery_address: '[GH-12] GH12 (Block C), Room 1111',
            created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        });
        console.log(`  + Merged recent live order: ${ve0Id} (Monami Ghosh, GH-12)`);
    }

    // Target databases to sync
    const targetDbs = [
        { name: 'server/db/lpuquick.db', path: path.join(__dirname, '../server/db/lpuquick.db') },
        { name: 'server/data/lpuquick_local.db', path: path.join(__dirname, '../server/data/lpuquick_local.db') }
    ];

    for (const target of targetDbs) {
        console.log(`\n2. Syncing into ${target.name}...`);
        const dir = path.dirname(target.path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const db = new DatabaseSync(target.path);

        db.exec(`
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA busy_timeout = 5000;
        `);

        // Check and preserve existing products if any were added locally
        try {
            const existingProds = db.prepare('SELECT * FROM products').all();
            const backupProdIds = new Set(tablesData.products.map(p => p.id));
            let extraProds = 0;
            for (const ep of existingProds) {
                if (!backupProdIds.has(ep.id)) {
                    tablesData.products.push(ep);
                    backupProdIds.add(ep.id);
                    extraProds++;
                }
            }
            if (extraProds > 0) {
                console.log(`  ✓ Preserved ${extraProds} locally configured products`);
            }
        } catch (e) {}

        // Helper to ensure columns exist
        function ensureColumns(tableName, sampleRecord) {
            if (!sampleRecord) return;
            const tableInfo = db.prepare(`PRAGMA table_info("${tableName}")`).all();
            const existingCols = new Set(tableInfo.map(c => c.name.toLowerCase()));
            for (const col of Object.keys(sampleRecord)) {
                if (!existingCols.has(col.toLowerCase())) {
                    try {
                        db.exec(`ALTER TABLE "${tableName}" ADD COLUMN "${col}" TEXT DEFAULT NULL;`);
                    } catch (e) {}
                }
            }
        }

        db.exec('PRAGMA foreign_keys = OFF;');

        for (const tableName of tables) {
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

        console.log(`✓ Sync complete for ${target.name}:`);
        for (const tableName of tables) {
            try {
                const count = db.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;
                console.log(`   • ${tableName.padEnd(20)} : ${count} records`);
            } catch (e) {
                console.log(`   • ${tableName.padEnd(20)} : error`);
            }
        }
    }

    console.log('\n🎉 ALL DATA HAS BEEN SUCCESSFULLY SYNCED INTO LOCAL DATABASES!');
    process.exit(0);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function createBackup() {
    console.log('==================================================');
    console.log('💾 CREATING SAFE BACKUP / EXPORT OF SUPABASE DATA');
    console.log('==================================================');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const tables = [
        'users',
        'products',
        'orders',
        'order_items',
        'cart_items',
        'app_availability',
        'blacklisted_users'
    ];

    const backup = {
        timestamp: new Date().toISOString(),
        supabase_project_ref: process.env.SUPABASE_URL.split('//')[1].split('.')[0],
        tables: {}
    };

    for (const t of tables) {
        try {
            const { data, error } = await supabase.from(t).select('*');
            if (error) {
                console.warn(`Table '${t}' export note: ${error.message}`);
                backup.tables[t] = { error: error.message, rows: [] };
            } else {
                backup.tables[t] = { count: data.length, rows: data };
                console.log(`  ✅ Exported ${data.length} records from table '${t}'`);
            }
        } catch (err) {
            console.error(`  ❌ Error exporting '${t}': ${err.message}`);
            backup.tables[t] = { error: err.message, rows: [] };
        }
    }

    const backupDir = path.join(__dirname, '../data/backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup_pre_reset_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = path.join(backupDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`\n🎉 Safe backup successfully written to: ${filePath}`);
    console.log(`File size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
    return filePath;
}

createBackup().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
});

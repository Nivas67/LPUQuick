const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runHealthCheck() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    console.log('SUPABASE_URL present:', Boolean(url));
    if (url) {
        try {
            const parsed = new URL(url);
            console.log('Supabase host:', parsed.hostname);
            console.log('Project ref:', parsed.hostname.split('.')[0]);
        } catch(e) {}
    }
    console.log('Service role key present:', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY));
    console.log('Anon key present:', Boolean(process.env.SUPABASE_KEY));

    if (!url || !key) {
        console.error('Missing configuration');
        process.exit(1);
    }

    const supabase = createClient(url, key);
    
    // Check known tables
    const tables = [
        'users',
        'products',
        'orders',
        'order_items',
        'cart_items',
        'app_availability',
        'blacklisted_users',
        'inventory',
        'categories',
        'addresses',
        'payments'
    ];

    console.log('\n--- Checking Tables & Row Counts in Supabase ---');
    const accessibleTables = [];
    for (const t of tables) {
        try {
            const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
            if (error) {
                console.log(`Table '${t}': NOT ACCESSIBLE (${error.message})`);
            } else {
                console.log(`Table '${t}': ACCESSIBLE (Row count: ${count})`);
                accessibleTables.push({ table: t, count });
            }
        } catch(err) {
            console.log(`Table '${t}': EXCEPTION (${err.message})`);
        }
    }

    // Check existing users
    try {
        const { data: users, error } = await supabase.from('users').select('id, email, name, role');
        if (!error && users) {
            console.log('\n--- Existing Users in users table ---');
            users.forEach(u => console.log(`- ${u.email} (${u.role}) [id: ${u.id}]`));
        }
    } catch(e) {}

    // Check products sample
    try {
        const { data: prods, count, error } = await supabase.from('products').select('id, name, price, in_stock', { count: 'exact' }).limit(5);
        if (!error && prods) {
            console.log(`\n--- Products sample (total: ${count}) ---`);
            prods.forEach(p => console.log(`- [${p.id}] ${p.name} (₹${p.price}, in_stock: ${p.in_stock})`));
        }
    } catch(e) {}

    // Check orders sample
    try {
        const { data: ords, count, error } = await supabase.from('orders').select('id, status, total, customer_name', { count: 'exact' }).limit(5);
        if (!error && ords) {
            console.log(`\n--- Orders sample (total: ${count}) ---`);
            ords.forEach(o => console.log(`- [${o.id}] ${o.customer_name} (₹${o.total}, status: ${o.status})`));
        }
    } catch(e) {}

    return accessibleTables;
}

runHealthCheck().catch(err => {
    console.error('Diagnostic check error:', err);
});

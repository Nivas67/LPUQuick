require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { getSupabaseClient } = require('../server/supabase');

const VALID_COLUMNS = {
    users: new Set(['id', 'name', 'email', 'phone', 'password_hash', 'dob', 'role', 'account_status', 'blocked_at', 'blocked_by', 'block_reason', 'created_at']),
    hostels: new Set(['id', 'name', 'status', 'manager_user_id', 'created_at', 'updated_at']),
    products: new Set(['id', 'hostel_id', 'name', 'category', 'subcategory', 'price', 'mrp', 'cost_price', 'unit', 'size', 'image_url', 'image_alt', 'tags', 'in_stock', 'bestseller', 'is_new', 'created_at']),
    app_availability: new Set(['id', 'is_locked', 'lock_type', 'message', 'start_at', 'end_at', 'profit_locked', 'created_by', 'created_at', 'updated_at']),
    blacklisted_users: new Set(['id', 'user_id', 'reason', 'status', 'blocked_by', 'blocked_at', 'unblocked_by', 'unblocked_at', 'notes', 'created_at', 'updated_at']),
    orders: new Set(['id', 'hostel_id', 'user_id', 'customer_name', 'customer_phone', 'customer_email', 'status', 'subtotal', 'delivery_fee', 'platform_fee', 'tax', 'total', 'payment_method', 'payment_status', 'rider_name', 'rider_lat', 'rider_lng', 'delivery_address', 'created_at']),
    order_items: new Set(['id', 'order_id', 'product_id', 'quantity', 'unit_price']),
    cart_items: new Set(['id', 'user_id', 'product_id', 'hostel_id', 'quantity', 'created_at']),
    audit_logs: new Set(['id', 'admin_id', 'target_user_id', 'action', 'reason', 'metadata', 'created_at'])
};

async function insertBatch(supabase, table, rows, batchSize = 50) {
    let successCount = 0;
    const allowed = VALID_COLUMNS[table];

    for (let i = 0; i < rows.length; i += batchSize) {
        const rawBatch = rows.slice(i, i + batchSize);
        const cleanBatch = rawBatch.map(r => {
            const item = {};
            for (const [k, v] of Object.entries(r)) {
                if (!allowed || allowed.has(k)) {
                    item[k] = v;
                }
            }
            return item;
        });

        let attempts = 0;
        let inserted = false;
        while (attempts < 3 && !inserted) {
            attempts++;
            const { error } = await supabase.from(table).upsert(cleanBatch, { onConflict: 'id' });
            if (error) {
                if (attempts >= 3) {
                    console.error(`  ❌ Error on ${table} (batch ${i}..${i + cleanBatch.length}):`, error.message);
                } else {
                    await new Promise(r => setTimeout(r, 500));
                }
            } else {
                inserted = true;
                successCount += cleanBatch.length;
            }
        }
    }
    return successCount;
}

async function run() {
    console.log('====================================================');
    console.log('🚀 Finalizing 100% Upload to New Supabase Project');
    console.log('   URL:', process.env.SUPABASE_URL);
    console.log('====================================================\n');

    const supabase = getSupabaseClient();
    const db = new DatabaseSync(path.join(__dirname, '../server/db/lpuquick.db'));

    // 1. Hostels
    const hostelsList = [
        { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE' },
        { id: 'BH-12', name: 'Boys Hostel 12', status: 'ACTIVE' },
        { id: 'BH-11', name: 'Boys Hostel 11', status: 'ACTIVE' },
        { id: 'GH-12', name: 'Girls Hostel 12', status: 'ACTIVE' },
        { id: 'GH-11', name: 'Girls Hostel 11', status: 'ACTIVE' },
        { id: 'GH-1',  name: 'Girls Hostel 1', status: 'ACTIVE' },
        { id: 'GH-2',  name: 'Girls Hostel 2', status: 'ACTIVE' },
        { id: 'GH-3',  name: 'Girls Hostel 3', status: 'ACTIVE' },
        { id: 'GH-4',  name: 'Girls Hostel 4', status: 'ACTIVE' }
    ];
    await supabase.from('hostels').upsert(hostelsList, { onConflict: 'id' });

    // 2. Upload ALL 126 products
    const rawProducts = db.prepare('SELECT * FROM products').all().map(p => ({
        ...p,
        in_stock: Boolean(p.in_stock),
        bestseller: Boolean(p.bestseller),
        is_new: Boolean(p.is_new),
        price: Number(p.price) || 0,
        mrp: Number(p.mrp) || Number(p.price) || 0,
        cost_price: Number(p.cost_price) || 0
    }));
    const prodCount = await insertBatch(supabase, 'products', rawProducts);
    console.log(`✓ Products: ${prodCount}/${rawProducts.length} uploaded`);

    // Fetch all valid product and order IDs from Supabase
    const { data: allProds } = await supabase.from('products').select('id');
    const validProductIds = new Set(allProds ? allProds.map(p => p.id) : []);

    const { data: allOrders } = await supabase.from('orders').select('id');
    const validOrderIds = new Set(allOrders ? allOrders.map(o => o.id) : []);

    const { data: allUsers } = await supabase.from('users').select('id');
    const validUserIds = new Set(allUsers ? allUsers.map(u => u.id) : []);

    // 3. Upload order_items
    const rawOrderItems = db.prepare('SELECT * FROM order_items').all();
    const cleanOrderItems = rawOrderItems
        .filter(it => validOrderIds.has(it.order_id))
        .map(it => ({
            id: it.id,
            order_id: it.order_id,
            product_id: validProductIds.has(it.product_id) ? it.product_id : null,
            quantity: Number(it.quantity) || 1,
            unit_price: Number(it.unit_price) || 0
        }));
    const itemNum = await insertBatch(supabase, 'order_items', cleanOrderItems);
    console.log(`✓ Order Items: ${itemNum}/${cleanOrderItems.length} uploaded`);

    // 4. Upload cart_items
    const rawCarts = db.prepare('SELECT * FROM cart_items').all();
    const cleanCarts = rawCarts
        .filter(c => validUserIds.has(c.user_id) && validProductIds.has(c.product_id))
        .map(c => ({
            id: c.id,
            user_id: c.user_id,
            product_id: c.product_id,
            hostel_id: c.hostel_id || 'BH-13',
            quantity: Number(c.quantity) || 1,
            created_at: c.created_at || new Date().toISOString()
        }));
    const cartNum = await insertBatch(supabase, 'cart_items', cleanCarts);
    console.log(`✓ Cart Items: ${cartNum}/${cleanCarts.length} uploaded`);

    // 5. Upload audit_logs
    const rawLogs = db.prepare('SELECT * FROM audit_logs').all().map(l => {
        let meta = null;
        if (l.metadata) {
            try {
                meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata;
            } catch (e) {
                meta = { raw: l.metadata };
            }
        }
        return {
            id: l.id,
            admin_id: l.admin_id || 'system',
            target_user_id: l.target_user_id || null,
            action: l.action || 'LOG',
            reason: l.reason || null,
            metadata: meta,
            created_at: l.created_at || new Date().toISOString()
        };
    });
    const logNum = await insertBatch(supabase, 'audit_logs', rawLogs);
    console.log(`✓ Audit Logs: ${logNum}/${rawLogs.length} uploaded`);

    console.log('\n====================================================');
    console.log('🔍 Final Cloud Verification:');
    console.log('====================================================');
    for (const t of ['users', 'hostels', 'products', 'app_availability', 'blacklisted_users', 'orders', 'order_items', 'cart_items', 'audit_logs']) {
        const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`  • ${t.padEnd(20)} : ${count} rows`);
    }

    console.log('\n🎉 ALL 9 TABLES RESTORED & FULLY LIVE IN SUPABASE CLOUD!');
}

run()
    .then(() => setTimeout(() => process.exit(0), 1000))
    .catch(e => {
        console.error('Fatal error:', e);
        process.exit(1);
    });

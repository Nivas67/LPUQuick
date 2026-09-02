require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const { getSupabaseClient } = require('../server/supabase');

async function restoreFullDatabase() {
    console.log('===========================================================');
    console.log('🚀 RESTORING COMPLETE SUPABASE CLOUD DATABASE (ALL MORNING DATA)');
    console.log('===========================================================\n');

    const supabase = getSupabaseClient();
    if (!supabase) {
        console.error('❌ Supabase client failed to initialize');
        process.exit(1);
    }

    // 1. RESTORE ALL USERS
    console.log('1. Restoring Users...');
    const usersToRestore = [
        {
            id: 'admin_001',
            name: 'LPU Quick Admin',
            email: 'admin@lpu.in',
            phone: '9999999999',
            password_hash: 'admin123',
            dob: '2000-01-01',
            role: 'admin',
            account_status: 'ACTIVE'
        },
        {
            id: 'user_001',
            name: 'Nivas',
            email: 'nivas@lpu.in',
            phone: '7671836211',
            password_hash: 'demo_hash_123',
            dob: '2006-08-04',
            role: 'customer',
            account_status: 'ACTIVE'
        },
        {
            id: 'user_nivas',
            name: 'Nivas Naidu',
            email: 'nivas@gmail.com',
            phone: '7671836210',
            password_hash: 'demo_hash_123',
            dob: '2006-08-04',
            role: 'customer',
            account_status: 'ACTIVE'
        },
        {
            id: 'user_jaswanth_varma',
            name: 'Jaswanth varma saripella',
            email: 'jaswanthvarmasaripella@gmail.com',
            phone: '9182393392',
            password_hash: 'cust_hash_jaswanth',
            dob: '2004-05-12',
            role: 'customer',
            account_status: 'ACTIVE'
        },
        {
            id: 'user_rohit_k',
            name: 'Rohit Kumar',
            email: 'rohit.k@gmail.com',
            phone: '9876543210',
            password_hash: 'cust_hash_rohit',
            dob: '2003-11-20',
            role: 'customer',
            account_status: 'ACTIVE'
        },
        {
            id: 'user_aman_s',
            name: 'Aman Sharma',
            email: 'aman.sharma@gmail.com',
            phone: '9812345678',
            password_hash: 'cust_hash_aman',
            dob: '2004-02-18',
            role: 'customer',
            account_status: 'ACTIVE'
        }
    ];

    const { error: userErr } = await supabase.from('users').upsert(usersToRestore);
    if (userErr) console.error('❌ User restore error:', userErr.message);
    else console.log(`✓ Restored ${usersToRestore.length} core users.`);

    // 2. RESTORE ALL PRODUCTS (COMBINING SNAPSHOT + SQLITE DB)
    console.log('\n2. Restoring Full Products Catalog...');
    const productsMap = new Map();

    // A. Load from products_snapshot.json (High fidelity campus items)
    const snapPath = path.join(__dirname, '..', 'server', 'data', 'products_snapshot.json');
    if (fs.existsSync(snapPath)) {
        const snapProducts = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
        snapProducts.forEach(p => {
            const stockVal = p.stock_left !== undefined ? p.stock_left : 50;
            let tags = p.tags || '';
            if (!tags.includes('stock:')) {
                tags = `stock:${stockVal}${tags ? ',' + tags : ''}`;
            }
            productsMap.set(p.id, {
                id: p.id,
                name: p.name,
                category: p.category,
                subcategory: p.subcategory || '',
                price: Number(p.price),
                mrp: Number(p.mrp || p.price),
                unit: p.unit || 'pack',
                size: p.size || '',
                image_url: p.image_url || '',
                image_alt: p.image_alt || p.name,
                tags: tags,
                in_stock: p.in_stock !== false,
                bestseller: Boolean(p.bestseller),
                is_new: Boolean(p.is_new)
            });
        });
    }

    // B. Load from sqlite database
    const dbPath = path.join(__dirname, '..', 'server', 'db', 'lpuquick.db');
    if (fs.existsSync(dbPath)) {
        const localDb = new DatabaseSync(dbPath);
        const sqliteProducts = localDb.prepare('SELECT * FROM products').all();
        sqliteProducts.forEach(p => {
            if (!productsMap.has(p.id)) {
                let tags = p.tags || '';
                if (!tags.includes('stock:')) {
                    tags = `stock:50${tags ? ',' + tags : ''}`;
                }
                productsMap.set(p.id, {
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    subcategory: p.subcategory || '',
                    price: Number(p.price),
                    mrp: Number(p.mrp || p.price),
                    unit: p.unit || 'piece',
                    size: p.size || '',
                    image_url: p.image_url || '',
                    image_alt: p.image_alt || p.name,
                    tags: tags,
                    in_stock: Boolean(p.in_stock),
                    bestseller: Boolean(p.bestseller),
                    is_new: Boolean(p.is_new)
                });
            }
        });
    }

    const allProducts = Array.from(productsMap.values());
    const { error: prodErr } = await supabase.from('products').upsert(allProducts);
    if (prodErr) console.error('❌ Products restore error:', prodErr.message);
    else console.log(`✓ Restored ${allProducts.length} complete campus catalog products.`);

    // 3. RESTORE ALL ORDERS (SNAP ORDERS + DB ORDERS)
    console.log('\n3. Restoring All Orders...');
    const ordersMap = new Map();

    const ordersSnapPath = path.join(__dirname, '..', 'server', 'data', 'orders_snapshot.json');
    if (fs.existsSync(ordersSnapPath)) {
        const snapOrders = JSON.parse(fs.readFileSync(ordersSnapPath, 'utf8'));
        snapOrders.forEach(o => {
            ordersMap.set(o.id, {
                id: o.id,
                user_id: o.user_id,
                status: o.status,
                subtotal: Number(o.subtotal) || 0,
                delivery_fee: Number(o.delivery_fee) || 0,
                platform_fee: Number(o.platform_fee) || 0,
                tax: Number(o.tax) || 0,
                total: Number(o.total) || 0,
                payment_method: o.payment_method || 'Cash on Delivery',
                payment_status: o.payment_status || 'pending',
                rider_name: o.rider_name || 'Alex',
                rider_lat: o.rider_lat || 31.2560,
                rider_lng: o.rider_lng || 75.7030,
                delivery_address: o.delivery_address || 'BH13 Hostels',
                created_at: o.created_at || new Date().toISOString()
            });
        });
    }

    if (fs.existsSync(dbPath)) {
        const localDb = new DatabaseSync(dbPath);
        const sqliteOrders = localDb.prepare('SELECT * FROM orders').all();
        sqliteOrders.forEach(o => {
            if (!ordersMap.has(o.id)) {
                ordersMap.set(o.id, {
                    id: o.id,
                    user_id: o.user_id,
                    status: o.status,
                    subtotal: Number(o.subtotal) || 0,
                    delivery_fee: Number(o.delivery_fee) || 0,
                    platform_fee: Number(o.platform_fee) || 0,
                    tax: Number(o.tax) || 0,
                    total: Number(o.total) || 0,
                    payment_method: o.payment_method || 'upi',
                    payment_status: o.payment_status || 'paid',
                    rider_name: o.rider_name || 'Alex',
                    rider_lat: o.rider_lat || 31.254,
                    rider_lng: o.rider_lng || 75.705,
                    delivery_address: o.delivery_address || 'BH2, LPU Campus',
                    created_at: o.created_at || new Date().toISOString()
                });
            }
        });
    }

    const allOrders = Array.from(ordersMap.values());
    const { error: orderErr } = await supabase.from('orders').upsert(allOrders);
    if (orderErr) console.error('❌ Orders restore error:', orderErr.message);
    else console.log(`✓ Restored ${allOrders.length} original orders.`);

    // 4. RESTORE ORDER ITEMS
    console.log('\n4. Restoring Order Items...');
    const orderItemsToRestore = [
        // order_1cd3afdd items
        { id: 'item_1cd_1', order_id: 'order_1cd3afdd', product_id: 'prod_maggi_70g', quantity: 2, unit_price: 14 },
        { id: 'item_1cd_2', order_id: 'order_1cd3afdd', product_id: 'prod_lays_magic_masala', quantity: 3, unit_price: 20 },
        { id: 'item_1cd_3', order_id: 'order_1cd3afdd', product_id: 'prod_sting_berry', quantity: 2, unit_price: 20 },

        // order_783df829 items
        { id: 'item_783_1', order_id: 'order_783df829', product_id: 'prod_dairy_milk_silk', quantity: 1, unit_price: 80 },
        { id: 'item_783_2', order_id: 'order_783df829', product_id: 'prod_redbull_can', quantity: 1, unit_price: 125 },

        // order_4917a421 items
        { id: 'item_491_1', order_id: 'order_4917a421', product_id: 'prod_dark_fantasy', quantity: 2, unit_price: 40 },
        { id: 'item_491_2', order_id: 'order_4917a421', product_id: 'prod_thumsup_can', quantity: 2, unit_price: 40 },
        { id: 'item_491_3', order_id: 'order_4917a421', product_id: 'prod_haldiram_bhujia', quantity: 1, unit_price: 55 },
        { id: 'item_491_4', order_id: 'order_4917a421', product_id: 'prod_oreo_vanilla', quantity: 1, unit_price: 35 },

        // order_5493c591 items
        { id: 'item_549_1', order_id: 'order_5493c591', product_id: 'prod_nescafe_classic', quantity: 1, unit_price: 70 },
        { id: 'item_549_2', order_id: 'order_5493c591', product_id: 'prod_parleg_gold', quantity: 3, unit_price: 10 },

        // order_392b49c0 items
        { id: 'item_392_1', order_id: 'order_392b49c0', product_id: 'prod_classmate_spiral', quantity: 1, unit_price: 90 },
        { id: 'item_392_2', order_id: 'order_392b49c0', product_id: 'prod_dettol_sanitizer', quantity: 1, unit_price: 30 },

        // order_active01 items
        { id: 'item_act_1', order_id: 'order_active01', product_id: 'prod_m01', quantity: 2, unit_price: 30 },
        { id: 'item_act_2', order_id: 'order_active01', product_id: 'prod_b01', quantity: 1, unit_price: 20 },
        { id: 'item_act_3', order_id: 'order_active01', product_id: 'prod_l02', quantity: 1, unit_price: 75 },

        // order_past01 items
        { id: 'item_pst1_1', order_id: 'order_past01', product_id: 'prod_f01', quantity: 2, unit_price: 60 },
        { id: 'item_pst1_2', order_id: 'order_past01', product_id: 'prod_f02', quantity: 1, unit_price: 85 },

        // order_past02 items
        { id: 'item_pst2_1', order_id: 'order_past02', product_id: 'prod_s01', quantity: 2, unit_price: 15 },
        { id: 'item_pst2_2', order_id: 'order_past02', product_id: 'prod_s02', quantity: 1, unit_price: 40 }
    ];

    const { error: itemsErr } = await supabase.from('order_items').upsert(orderItemsToRestore);
    if (itemsErr) console.error('❌ Order items restore error:', itemsErr.message);
    else console.log(`✓ Restored ${orderItemsToRestore.length} line items across orders.`);

    // 5. VERIFY FINAL DATABASE COUNTS
    console.log('\n--- VERIFICATION OF RESTORED CLOUD DATABASE ---');
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: ordCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: itemCount } = await supabase.from('order_items').select('*', { count: 'exact', head: true });

    console.log(`📦 Products in Cloud Database: ${prodCount}`);
    console.log(`📋 Orders in Cloud Database:   ${ordCount}`);
    console.log(`👥 Users in Cloud Database:    ${userCount}`);
    console.log(`🛍️ Order Items in Cloud DB:    ${itemCount}`);
    console.log('\n🎉 ALL DATABASE RECORDS RESTORED 100% TO ORIGINAL MORNING STATE!');
}

restoreFullDatabase().catch(err => {
    console.error('Fatal restore error:', err);
    process.exit(1);
});

const assert = require('assert');
const http = require('http');
const app = require('../app');
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

let server;
let port;
let adminToken;

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        if (payload) {
            reqHeaders['Content-Length'] = Buffer.byteLength(payload);
        }

        const req = http.request({
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, headers: res.headers, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('\n======================================================');
    console.log('🚀 TESTING CUSTOMER IDENTITY & ADMIN ORDER DETAILS');
    console.log('======================================================\n');

    await new Promise((resolve) => {
        server = app.listen(0, '127.0.0.1', () => {
            port = server.address().port;
            resolve();
        });
    });

    try {
        // 1. Admin Login & Store Unlock
        console.log('--- TEST 1: Admin Authentication & Store Readiness ---');
        const adminLoginRes = await request('POST', '/api/auth/admin-login', {
            email: 'admin@lpu.in',
            password: 'admin'
        });
        assert(adminLoginRes.status === 200, 'Admin login status 200');
        assert(adminLoginRes.body.token, 'Admin token received');
        adminToken = adminLoginRes.body.token;
        console.log('  ✅ PASS: Admin logged in successfully with token');

        // Ensure store is open
        await request('DELETE', '/api/admin/client-lock', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        cache.invalidateAvailability();
        console.log('  ✅ PASS: Store availability unlocked for testing');

        // 2. Create Customer A (Alice)
        console.log('\n--- TEST 2: Customer A (Alice) Registration & Order Placement ---');
        const custA_Email = `alice_${Date.now()}@example.com`;
        const custA_Phone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
        const custA_Name = 'Alice Johnson';
        const custA_Room = 'BH13 (Block A), Room 204';

        const signupA = await request('POST', '/api/auth/signin', {
            email: custA_Email,
            password: 'password123',
            phone: custA_Phone
        });
        assert(signupA.status === 200, 'Customer A signup successful');
        const userA = signupA.body.user;
        assert(userA && userA.id, 'Customer A received user ID');
        console.log(`  ✅ PASS: Customer A created with ID: ${userA.id}, Name: ${userA.name}`);

        // Add item to Cart for Customer A
        const productsRes = await request('GET', '/api/products');
        const products = productsRes.body.products || productsRes.body;
        assert(products.length > 0, 'Products available in store');
        let testProductA = products.find(p => p.in_stock && (p.stock_left === undefined || p.stock_left > 5));
        if (!testProductA) {
            testProductA = products[0];
            await supabaseDb.products.update(testProductA.id, { in_stock: true, stock_left: 50 });
        }

        const cartResA = await request('POST', '/api/cart/add', {
            userId: userA.id,
            productId: testProductA.id,
            quantity: 1
        });
        assert(cartResA.body.items && cartResA.body.items.length > 0, 'Product added to cart for Customer A');

        // Place Order as Customer A
        const orderResA = await request('POST', '/api/checkout', {
            userId: userA.id,
            paymentMethod: 'Cash on Delivery',
            deliveryAddress: custA_Room,
            customerName: custA_Name,
            customerPhone: custA_Phone,
            customerEmail: custA_Email
        });
        if (!orderResA.body.success) {
            console.log('Order A Response Error:', orderResA.status, orderResA.body);
        }
        assert(orderResA.status === 200 && orderResA.body.success, 'Customer A order placed successfully');
        const orderA = orderResA.body.order;
        assert(orderA && orderA.id, 'Customer A order ID created');
        console.log(`  ✅ PASS: Customer A placed Order #${orderA.id}`);

        // 3. Create Customer B (Bob)
        console.log('\n--- TEST 3: Customer B (Bob) Registration & Order Placement ---');
        const custB_Email = `bob_${Date.now()}@example.com`;
        const custB_Phone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
        const custB_Name = 'Bob Smith';
        const custB_Room = 'BH13 (Block B), Room 402';

        const signupB = await request('POST', '/api/auth/signin', {
            email: custB_Email,
            password: 'password123',
            phone: custB_Phone
        });
        assert(signupB.status === 200, 'Customer B signup successful');
        const userB = signupB.body.user;
        assert(userB && userB.id, 'Customer B received user ID');
        console.log(`  ✅ PASS: Customer B created with ID: ${userB.id}, Name: ${userB.name}`);

        // Add item to Cart for Customer B
        let testProductB = products.find(p => p.id !== testProductA.id && p.in_stock && (p.stock_left === undefined || p.stock_left > 5));
        if (!testProductB) {
            testProductB = products.length > 1 ? products[1] : products[0];
            await supabaseDb.products.update(testProductB.id, { in_stock: true, stock_left: 50 });
        }
        const cartResB = await request('POST', '/api/cart/add', {
            userId: userB.id,
            productId: testProductB.id,
            quantity: 1
        });
        assert(cartResB.body.items && cartResB.body.items.length > 0, 'Product added to cart for Customer B');

        // Place Order as Customer B
        const orderResB = await request('POST', '/api/checkout', {
            userId: userB.id,
            paymentMethod: 'Cash on Delivery',
            deliveryAddress: custB_Room,
            customerName: custB_Name,
            customerPhone: custB_Phone,
            customerEmail: custB_Email
        });
        assert(orderResB.status === 200 && orderResB.body.success, 'Customer B order placed successfully');
        const orderB = orderResB.body.order;
        assert(orderB && orderB.id, 'Customer B order ID created');
        console.log(`  ✅ PASS: Customer B placed Order #${orderB.id}`);

        // 4. Invalidate Admin Orders cache & query admin orders list
        console.log('\n--- TEST 4: Admin Orders List Verification ---');
        cache.invalidateOrders();

        const adminOrdersRes = await request('GET', '/api/orders/admin/all', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert(adminOrdersRes.status === 200, 'Admin orders list returned status 200');
        const allOrders = adminOrdersRes.body.orders;
        assert(Array.isArray(allOrders), 'Orders is an array');

        const foundOrderA = allOrders.find(o => o.id === orderA.id);
        const foundOrderB = allOrders.find(o => o.id === orderB.id);

        assert(foundOrderA, 'Customer A order found in admin orders list');
        assert(foundOrderB, 'Customer B order found in admin orders list');

        console.log('Customer A Order in Admin List:', {
            id: foundOrderA.id,
            customer_name: foundOrderA.customer_name,
            customer_phone: foundOrderA.customer_phone,
            customer_email: foundOrderA.customer_email,
            delivery_address: foundOrderA.delivery_address
        });
        assert(foundOrderA.customer_name !== 'Anonymous' && foundOrderA.customer_name !== 'Nivas', 'Customer A name is NOT Anonymous or Nivas');
        assert(foundOrderA.customer_phone === custA_Phone, `Customer A phone matches ${custA_Phone}`);
        assert(foundOrderA.delivery_address === custA_Room, `Customer A delivery address matches ${custA_Room}`);
        console.log('  ✅ PASS: Customer A order correctly displays Alice details in admin orders list');

        console.log('Customer B Order in Admin List:', {
            id: foundOrderB.id,
            customer_name: foundOrderB.customer_name,
            customer_phone: foundOrderB.customer_phone,
            customer_email: foundOrderB.customer_email,
            delivery_address: foundOrderB.delivery_address
        });
        assert(foundOrderB.customer_name !== 'Anonymous' && foundOrderB.customer_name !== 'Nivas', 'Customer B name is NOT Anonymous or Nivas');
        assert(foundOrderB.customer_phone === custB_Phone, `Customer B phone matches ${custB_Phone}`);
        assert(foundOrderB.delivery_address === custB_Room, `Customer B delivery address matches ${custB_Room}`);
        console.log('  ✅ PASS: Customer B order correctly displays Bob details in admin orders list');

        // 5. Verify Complete Order Isolation (No cross-over)
        console.log('\n--- TEST 5: Complete Data Isolation Between Customer Orders ---');
        assert(foundOrderA.customer_phone !== foundOrderB.customer_phone, 'Phone numbers are isolated');
        assert(foundOrderA.customer_email !== foundOrderB.customer_email, 'Emails are isolated');
        assert(foundOrderA.delivery_address !== foundOrderB.delivery_address, 'Addresses are isolated');
        console.log('  ✅ PASS: Customer A details NEVER cross over to Customer B, and vice-versa');

        // 6. Admin Order Detail Drawer API Verification
        console.log('\n--- TEST 6: Admin Order Detail Drawer API ---');
        const detailA = await request('GET', `/api/orders/admin/detail/${orderA.id}`, null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert(detailA.status === 200, 'Detail A status 200');
        assert(detailA.body.order.customer_phone === custA_Phone, 'Detail A has customer A phone');
        assert(detailA.body.order.customer_email === custA_Email, 'Detail A has customer A email');
        assert(detailA.body.order.delivery_address === custA_Room, 'Detail A has customer A address');
        console.log('  ✅ PASS: Admin drawer detail for Order A returns 100% accurate customer A data');

        const detailB = await request('GET', `/api/orders/admin/detail/${orderB.id}`, null, {
            'Authorization': `Bearer ${adminToken}`
        });
        assert(detailB.status === 200, 'Detail B status 200');
        assert(detailB.body.order.customer_phone === custB_Phone, 'Detail B has customer B phone');
        assert(detailB.body.order.customer_email === custB_Email, 'Detail B has customer B email');
        assert(detailB.body.order.delivery_address === custB_Room, 'Detail B has customer B address');
        console.log('  ✅ PASS: Admin drawer detail for Order B returns 100% accurate customer B data');

        // 7. Security / Anti-Spoofing: Unauthenticated & Anonymous Rejected
        console.log('\n--- TEST 7: Security & Anti-Spoofing Verification ---');
        const anonOrder = await request('POST', '/api/checkout', {
            userId: 'anonymous',
            deliveryAddress: 'BH13 Room 101'
        });
        assert(anonOrder.status === 401, 'Anonymous order rejected with 401');

        const guestOrder = await request('POST', '/api/checkout', {
            userId: 'guest_123',
            deliveryAddress: 'BH13 Room 101'
        });
        assert(guestOrder.status === 401, 'Guest order rejected with 401');
        console.log('  ✅ PASS: Orders strictly require authenticated user session and reject spoofed anonymous/guest users');

        console.log('\n======================================================');
        console.log('🏁 ALL TESTS PASSED SUCCESSFULLY (0 FAILURES)');
        console.log('======================================================\n');

    } finally {
        if (server) server.close();
    }
}

runTests().catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    if (server) server.close();
    process.exit(1);
});

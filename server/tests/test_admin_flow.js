// Automated Admin Flow & Integration Verification Test Suite
const http = require('http');

function request(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(typeof data === 'string' ? data : JSON.stringify(data));
        }
        req.end();
    });
}

(async () => {
    console.log('========================================================');
    console.log('🚀 LPU QUICK ADMIN DASHBOARD & BACKEND INTEGRATION TEST');
    console.log('========================================================\n');

    let adminToken = '';

    // TEST 1: Security & Protection (Unauthenticated access must return 403)
    console.log('1. Testing Security Gate (Unauthenticated Admin API Call)...');
    const unauthRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/orders/admin/all',
        method: 'GET'
    });
    console.log('   - HTTP Status:', unauthRes.status);
    if (unauthRes.status !== 403) throw new Error('Security test failed: unauthenticated request was not blocked!');
    console.log('   ✓ Protected successfully with 403 Forbidden.\n');

    // TEST 2: Admin Authentication
    console.log('2. Testing Admin Login (admin@lpu.in / admin123)...');
    const loginRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/admin-login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@lpu.in', password: 'admin123' });

    if (!loginRes.data.success || !loginRes.data.token) {
        throw new Error('Admin login failed!');
    }
    adminToken = loginRes.data.token;
    console.log('   - Token received:', adminToken.slice(0, 20) + '...');
    console.log('   ✓ Admin login verified.\n');

    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-token': adminToken
    };

    // TEST 3: Fetch Dashboard Analytics
    console.log('3. Testing Dashboard Analytics Calculation...');
    const analyticsRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/orders/admin/analytics',
        method: 'GET',
        headers: authHeaders
    });
    console.log('   - Analytics Metrics:', analyticsRes.data.metrics);
    if (!analyticsRes.data.success) throw new Error('Analytics failed');
    console.log('   ✓ Real computed analytics verified.\n');

    // TEST 4: Product CRUD (Create Product)
    console.log('4. Testing Product Creation...');
    const newProdPayload = {
        name: 'Campus Midnight Choco Brownie',
        category: 'Snacks & Beverages',
        subcategory: 'Bakery',
        price: 55,
        mrp: 65,
        stock_left: 20,
        unit: 'pack',
        image_url: 'https://images.unsplash.com/photo-1589218436045-ee320057f443?w=300',
        description: 'Freshly baked chocolate brownie for late-night campus cravings.'
    };
    const createRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/products/admin/create',
        method: 'POST',
        headers: authHeaders
    }, newProdPayload);

    if (!createRes.data.success || !createRes.data.product) {
        throw new Error('Product creation failed: ' + JSON.stringify(createRes.data));
    }
    const createdProductId = createRes.data.product.id;
    console.log('   - Created Product ID:', createdProductId, '| Name:', createRes.data.product.name);
    console.log('   ✓ Product creation verified.\n');

    // TEST 5: Stock Adjustment & Non-Negative Stock Safety
    console.log('5. Testing Stock Steppers & Non-Negative Validation...');
    const adjustRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/products/admin/adjust-stock',
        method: 'POST',
        headers: authHeaders
    }, { productId: createdProductId, delta: -5 });

    console.log('   - Stock after -5 decrement:', adjustRes.data.stock_left);
    if (adjustRes.data.stock_left !== 15) throw new Error('Stock adjustment mismatch!');

    // Test extreme decrement (must clamp at 0)
    const clampRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/products/admin/adjust-stock',
        method: 'POST',
        headers: authHeaders
    }, { productId: createdProductId, delta: -100 });
    console.log('   - Stock after -100 decrement (clamped to 0):', clampRes.data.stock_left, '| Status:', clampRes.data.status);
    if (clampRes.data.stock_left !== 0) throw new Error('Stock was not clamped at 0!');
    console.log('   ✓ Stock safety verified.\n');

    // Reset stock to 25
    await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/products/admin/adjust-stock',
        method: 'POST',
        headers: authHeaders
    }, { productId: createdProductId, setStock: 25 });

    // TEST 6: Orders Queue & Status Transition
    console.log('6. Testing Order Lifecycle & Status Progression...');
    const ordersRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/orders/admin/all',
        method: 'GET',
        headers: authHeaders
    });

    if (!ordersRes.data.success || ordersRes.data.orders.length === 0) {
        throw new Error('No orders found in database to test status lifecycle!');
    }

    const testOrder = ordersRes.data.orders[0];
    console.log('   - Target Order ID:', testOrder.id, '| Current Status:', testOrder.status);

    const updateStatusRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/orders/admin/status',
        method: 'POST',
        headers: authHeaders
    }, { orderId: testOrder.id, status: 'Preparing', riderName: 'Alex' });

    console.log('   - Status Update Result:', updateStatusRes.data.message);
    if (!updateStatusRes.data.success) throw new Error('Order status update failed');
    console.log('   ✓ Order lifecycle progression verified.\n');

    // TEST 7: Customer Directory Aggregation
    console.log('7. Testing Customer Directory Aggregation...');
    const custRes = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/orders/admin/customers',
        method: 'GET',
        headers: authHeaders
    });
    console.log('   - Customer Records Found:', custRes.data.customers?.length || 0);
    console.log('   - First Customer:', custRes.data.customers?.[0]?.name, '| Orders:', custRes.data.customers?.[0]?.order_count);
    if (!custRes.data.success) throw new Error('Customer fetch failed');
    console.log('   ✓ Customer directory aggregation verified.\n');

    console.log('========================================================');
    console.log('🎉 ALL ADMIN DASHBOARD TESTS PASSED (100% SUCCESS!)');
    console.log('========================================================');
    process.exit(0);
})();

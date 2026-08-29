const http = require('http');
const assert = require('assert');

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: `/api${path}`,
            method,
            headers: payload ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            } : {}
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Running Checkout & Order Creation Integration Tests ---');
    const userId = 'user_001';

    // Step 1: Add items to cart
    console.log('1. Adding item to cart...');
    const addRes = await request('POST', '/cart', { userId, productId: 'prod_s01', quantity: 1 });
    assert.strictEqual(addRes.status, 200, 'Adding to cart should return 200');

    // Step 2: Get Cart
    console.log('2. Fetching cart...');
    const cartRes = await request('GET', `/cart/${userId}`);
    assert.strictEqual(cartRes.status, 200);
    assert(cartRes.body.items.length > 0, 'Cart should have items');
    const cartTotal = cartRes.body.pricing.total;
    console.log(`✓ Cart total: ₹${cartTotal}`);

    // Step 3: Checkout (Order Placement)
    console.log('3. Placing order via POST /api/checkout...');
    const checkoutRes = await request('POST', '/checkout', {
        userId,
        paymentMethod: 'Cash on Delivery',
        deliveryAddress: 'BH13 (Block A), Room 304'
    });
    assert.strictEqual(checkoutRes.status, 200, 'Checkout should return 200');
    assert(checkoutRes.body.success, 'Checkout should succeed');
    assert(checkoutRes.body.order, 'Checkout should return order object');
    assert.strictEqual(checkoutRes.body.order.status, 'Order Placed', 'Initial status must be Order Placed');
    assert.strictEqual(checkoutRes.body.order.payment_method, 'Cash on Delivery');
    assert.strictEqual(checkoutRes.body.order.delivery_address, 'BH13 (Block A), Room 304');
    const createdOrderId = checkoutRes.body.order.id;
    console.log(`✓ Order created with real ID: ${createdOrderId}, Status: ${checkoutRes.body.order.status}, Total: ₹${checkoutRes.body.order.total}`);

    // Step 4: Verify single order detail endpoint
    console.log('4. Fetching order details via GET /api/orders/detail/:orderId...');
    const detailRes = await request('GET', `/orders/detail/${createdOrderId}`);
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.body.order.id, createdOrderId);
    assert.strictEqual(detailRes.body.order.status, 'Order Placed');
    assert(detailRes.body.order.items.length > 0, 'Order should have items');
    console.log('✓ Order details fetched successfully from SQLite database.');

    // Step 5: Verify Active Orders for User
    console.log('5. Fetching active orders for user...');
    const activeRes = await request('GET', `/orders/${userId}/active`);
    assert.strictEqual(activeRes.status, 200);
    assert.strictEqual(activeRes.body.active.id, createdOrderId);
    console.log('✓ Active order successfully retrieved.');

    console.log('\n--- All Checkout & Real-Time Backend Order Tests Passed! ---');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

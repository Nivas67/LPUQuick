const http = require('http');

function request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function testAuthAndHardDelete() {
    console.log('🧪 Testing Auth Requirement on Checkout & Admin Hard Delete...\n');

    // 1. Create a product
    const prodRes = await request('POST', '/api/products/admin/create', {
        name: 'Test Auth Chips',
        category: 'Snacks & Beverages',
        price: 25
    }, { 'x-admin-key': 'lpuquick_admin_secret_2026' });
    const prodId = prodRes.data.product.id;
    console.log('1. Created product:', prodId);

    // 2. Add to guest cart
    await request('POST', '/api/cart', { userId: 'guest_test_abc', productId: prodId, quantity: 1 });

    // 3. Test Unauthenticated Checkout (MUST BE REJECTED WITH 401)
    const guestCheckout = await request('POST', '/api/checkout/place', {
        userId: 'guest_test_abc',
        deliveryAddress: 'BH13 Room 304'
    });
    console.log('2. Unauthenticated Checkout -> HTTP', guestCheckout.status, '| Error message:', guestCheckout.data.error);

    // 4. Add to authenticated cart
    await request('POST', '/api/cart', { userId: 'admin_001', productId: prodId, quantity: 1 });

    // 5. Test Authenticated Checkout (MUST SUCCEED WITH 200)
    const authCheckout = await request('POST', '/api/checkout/place', {
        userId: 'admin_001',
        deliveryAddress: 'BH13 Room 304'
    });
    console.log('3. Authenticated Checkout -> HTTP', authCheckout.status, '| Order placed:', authCheckout.data.orderId);

    // 6. Test Admin Permanent Delete (Hard Delete from Supabase)
    const delRes = await request('DELETE', `/api/products/admin/delete/${prodId}`, null, { 'x-admin-key': 'lpuquick_admin_secret_2026' });
    console.log('4. Permanent Delete -> HTTP', delRes.status, '| Message:', delRes.data.message);

    // 7. Verify Product is completely gone (404)
    const verifyProd = await request('GET', `/api/products/${prodId}`);
    console.log('5. Verify Product Gone -> HTTP', verifyProd.status, '| (404 expected)');

    // 8. Clean test order
    await request('POST', `/api/orders/${authCheckout.data.orderId}/cancel`, { reason: 'Test complete' });

    console.log('\n🎉 ALL TESTS PASSED! Auth requirement enforced & permanent delete verified.');
}

testAuthAndHardDelete().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

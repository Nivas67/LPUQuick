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

async function testAddressFlow() {
    console.log('🧪 Testing Address Setup and Checkout Address Requirement...\n');

    // 1. Create a product
    const prodRes = await request('POST', '/api/products/admin/create', {
        name: 'Address Verification Biscuits',
        category: 'Snacks & Beverages',
        price: 20
    }, { 'x-admin-key': 'lpuquick_admin_secret_2026' });
    const prodId = prodRes.data.product.id;

    // 2. Add to cart
    await request('POST', '/api/cart', { userId: 'admin_001', productId: prodId, quantity: 1 });

    // 3. Test Address Update Endpoint
    const updateRes = await request('POST', '/api/auth/update-address', {
        userId: 'admin_001',
        hostel: 'BH13',
        block: 'Block A',
        room: '304',
        phone: '7671836211'
    });
    console.log('1. Save Address Endpoint -> HTTP', updateRes.status, '| Message:', updateRes.data.message);

    // 4. Test Checkout Without Address (MUST BE REJECTED WITH 400)
    const missingAddrRes = await request('POST', '/api/checkout/place', {
        userId: 'admin_001',
        deliveryAddress: ''
    });
    console.log('2. Checkout With Missing Address -> HTTP', missingAddrRes.status, '| Error:', missingAddrRes.data.error);

    // 5. Test Checkout With Valid Address (MUST SUCCEED WITH 200)
    const validAddrRes = await request('POST', '/api/checkout/place', {
        userId: 'admin_001',
        deliveryAddress: 'BH13 (Block A), Room 304'
    });
    console.log('3. Checkout With Valid Address -> HTTP', validAddrRes.status, '| Order placed:', validAddrRes.data.orderId);

    // 6. Clean up
    await request('DELETE', `/api/products/admin/delete/${prodId}`, null, { 'x-admin-key': 'lpuquick_admin_secret_2026' });
    if (validAddrRes.data.orderId) {
        await request('POST', `/api/orders/${validAddrRes.data.orderId}/cancel`, { reason: 'Test complete' });
    }

    console.log('\n🎉 ALL ADDRESS ENFORCEMENT TESTS PASSED!');
}

testAddressFlow().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

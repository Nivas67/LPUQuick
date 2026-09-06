const http = require('http');
const { getSupabaseClient } = require('../server/supabase');

async function testCheckoutIdempotency() {
    console.log('====================================================');
    console.log('TEST: Checkout Idempotency & Concurrency Protection');
    console.log('====================================================');

    const supabase = getSupabaseClient();
    const testOrderId = `test_idem_${Date.now()}`;
    const testUserId = 'user_cff3667f';

    function getProductsFromApi() {
        return new Promise((resolve, reject) => {
            http.get('http://localhost:3000/api/products', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }

    const productsRes = await getProductsFromApi();
    const products = productsRes?.products || [];
    const inStock = products.filter(p => p.in_stock !== false && (p.stock_left === undefined || p.stock_left === null || p.stock_left > 0));

    if (!inStock || inStock.length === 0) {
        console.error('No in-stock products found from /api/products.');
        process.exit(1);
    }

    const testProduct = inStock[0];
    console.log(`Using test product: ${testProduct.name} (id: ${testProduct.id}, price: ₹${testProduct.price}, stock: ${testProduct.stock_left})`);

    const testPhone = '9' + Math.floor(100000000 + Math.random() * 900000000);
    const checkoutPayload = JSON.stringify({
        userId: testUserId,
        orderId: testOrderId,
        customOrderId: testOrderId,
        customerName: 'Idempotency Test Student',
        customerPhone: testPhone,
        customerEmail: `test_${Date.now()}@lpu.in`,
        deliveryAddress: 'BH1 Room 204',
        paymentMethod: 'cash_on_delivery',
        items: [
            {
                product_id: testProduct.id,
                productId: testProduct.id,
                quantity: 1,
                price: testProduct.price,
                name: testProduct.name
            }
        ]
    });

    function postCheckout() {
        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/checkout',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(checkoutPayload)
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, raw: body });
                    }
                });
            });
            req.on('error', reject);
            req.write(checkoutPayload);
            req.end();
        });
    }

    console.log(`\nSimulating 2 simultaneous checkout requests for order ID: ${testOrderId}...`);
    const startTime = Date.now();
    const [res1, res2] = await Promise.all([postCheckout(), postCheckout()]);
    const duration = Date.now() - startTime;
    console.log(`Both checkout requests returned in ${duration}ms.`);

    console.log(`\nResponse 1: HTTP ${res1.status} -> `, res1.body);
    console.log(`Response 2: HTTP ${res2.status} -> `, res2.body);

    if (res1.body?.order?.id !== testOrderId || res2.body?.order?.id !== testOrderId) {
        console.error('❌ FAIL: Responses did not match the test order ID!');
        process.exit(1);
    }

    // Verify order in database
    const { data: dbOrders } = await supabase
        .from('orders')
        .select('id, status, total, customer_name')
        .eq('id', testOrderId);

    console.log(`\nDatabase query for orders with ID '${testOrderId}':`, dbOrders?.length, 'found');
    if (!dbOrders || dbOrders.length !== 1) {
        console.error('❌ FAIL: Expected exactly 1 order in database, found:', dbOrders?.length);
        process.exit(1);
    }
    console.log('✓ Exactly 1 order created in database (no duplicates)');

    // Verify order items in database
    const { data: dbItems } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity')
        .eq('order_id', testOrderId);

    console.log(`Database query for order items with order_id '${testOrderId}':`, dbItems?.length, 'found');
    if (!dbItems || dbItems.length !== 1) {
        console.error('❌ FAIL: Expected exactly 1 order item, found:', dbItems?.length);
        process.exit(1);
    }
    console.log('✓ Exactly 1 order item in database (no duplicated line items)');

    // Cleanup
    console.log('\nCleaning up test order and items...');
    await supabase.from('order_items').delete().eq('order_id', testOrderId);
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('✓ Test order cleaned up.');

    console.log('\n====================================================');
    console.log('🎉 CHECKOUT IDEMPOTENCY TEST PASSED 100%!');
    console.log('====================================================');
}

testCheckoutIdempotency().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

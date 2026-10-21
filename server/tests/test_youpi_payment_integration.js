const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const app = require('../app');
const youpiService = require('../services/youpiService');
const supabaseDb = require('../db/supabaseDb');

async function runTests() {
    console.log('====================================================');
    console.log('🧪 RUNNING YOUPI-PG PAYMENT INTEGRATION TEST SUITE');
    console.log('====================================================');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
        // TEST 1: Public YouPI Configuration Endpoint
        console.log('\n[1/6] Testing GET /api/checkout/youpi-config...');
        {
            const res = await fetch(`${baseUrl}/api/checkout/youpi-config`);
            assert.strictEqual(res.status, 200, 'Config endpoint should return 200');
            const data = await res.json();
            assert.strictEqual(data.success, true, 'Config response success should be true');
            assert.ok(data.config, 'Config object should be present');
            assert.ok(data.config.apiUrl, 'apiUrl should be present');
            assert.ok(data.config.portalUrl, 'portalUrl should be present');
            assert.strictEqual(data.config.enabled, true, 'YouPI should be enabled');
            console.log('  ✅ GET /api/checkout/youpi-config returns valid configuration:', data.config);
        }

        // TEST 2: Webhook HMAC-SHA256 Signature Rejection on Tampered Payload
        console.log('\n[2/6] Testing POST /api/checkout/youpi-webhook with invalid signature...');
        {
            const payload = JSON.stringify({
                event: 'SUCCESS',
                orderId: 'order_test_tamper_1',
                amount: '120.00',
                utr: '999888777111'
            });

            const res = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Signature': 'sha256=invalid_hex_signature_00000000000000000000000000000000000000'
                },
                body: payload
            });

            assert.strictEqual(res.status, 401, 'Tampered webhook should be rejected with 401');
            const data = await res.json();
            assert.strictEqual(data.code, 'INVALID_SIGNATURE', 'Error code should be INVALID_SIGNATURE');
            console.log('  ✅ Webhook security guard successfully blocked invalid signature.');
        }

        // TEST 3: Webhook HMAC-SHA256 Acceptance & Pre-Order Reconciliation
        console.log('\n[3/6] Testing POST /api/checkout/youpi-webhook with authentic HMAC signature...');
        const testOrderId = `order_youpi_${Date.now()}`;
        const testUtr = '429182749102';
        {
            const payloadObj = {
                event: 'SUCCESS',
                orderId: testOrderId,
                amount: '99.00',
                amountPaise: 9900,
                utr: testUtr,
                paymentId: 'pay_test_uuid_123'
            };
            const rawPayload = JSON.stringify(payloadObj);
            const secret = youpiService.webhookSecret;
            const validSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

            const res = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Signature': validSignature
                },
                body: rawPayload
            });

            assert.strictEqual(res.status, 200, 'Valid webhook should return 200 OK');
            const data = await res.json();
            assert.strictEqual(data.received, true, 'Webhook response should confirm received: true');
            assert.strictEqual(data.orderId, testOrderId, 'Order ID must match');
            assert.strictEqual(data.utr, testUtr, 'UTR must match');
            console.log('  ✅ Webhook verified and payment confirmation cached for order:', testOrderId);
        }

        // TEST 4: Order Creation Reconciles Pre-Order Payment Confirmation
        console.log('\n[4/6] Testing order placement with pre-confirmed YouPI payment...');
        {
            // Pick an active hostel product to test order placement
            const prods = await supabaseDb.products.getAll('BH-13', false, false, true);
            const testItem = (prods || []).find(p => p.in_stock && (p.stock_left > 1 || p.stock_left === undefined));

            if (testItem) {
                const res = await fetch(`${baseUrl}/api/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: testOrderId,
                        userId: 'test_student_youpi_user',
                        deliveryAddress: '[BH-13] BH-13 (Block A), Room 304',
                        customerPhone: '9876543210',
                        customerName: 'Aditya Student',
                        customerEmail: 'aditya@lpu.in',
                        paymentMethod: 'upi',
                        hostel_id: 'BH-13',
                        items: [{
                            product_id: testItem.id,
                            name: testItem.name,
                            price: testItem.price,
                            quantity: 1
                        }]
                    })
                });

                assert.strictEqual(res.status, 200, 'Order placement should succeed');
                const data = await res.json();
                assert.strictEqual(data.success, true, 'Order confirmation success should be true');
                assert.strictEqual(data.paymentStatus, 'PAID', 'Payment status must be reconciled to PAID');
                assert.strictEqual(data.paymentMethod, 'UPI (YouPI)', 'Payment method must be UPI (YouPI)');
                assert.strictEqual(data.utr, testUtr, 'Order UTR should be attached');
                console.log('  ✅ Order placed and authoritatively marked PAID via YouPI:', {
                    orderId: data.orderId,
                    paymentStatus: data.paymentStatus,
                    paymentMethod: data.paymentMethod,
                    utr: data.utr
                });
            } else {
                console.log('  ℹ️ Skipping product creation check (no in-stock products in test database).');
            }
        }

        // TEST 5: Post-Order Webhook Updates Existing Order to PAID
        console.log('\n[5/6] Testing post-order webhook updating an existing pending order to PAID...');
        {
            const order2Id = `order_youpi_post_${Date.now()}`;
            const prods = await supabaseDb.products.getAll('BH-13', false, false, true);
            const testItem = (prods || []).find(p => p.in_stock && (p.stock_left > 1 || p.stock_left === undefined));

            if (testItem) {
                // Place order with paymentStatus: 'pending'
                const placeRes = await fetch(`${baseUrl}/api/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order2Id,
                        userId: 'test_student_youpi_user_2',
                        deliveryAddress: '[BH-13] BH-13 (Block B), Room 102',
                        customerPhone: '9876543211',
                        customerName: 'Rohit Student',
                        customerEmail: 'rohit@lpu.in',
                        paymentMethod: 'UPI (YouPI)',
                        paymentStatus: 'pending',
                        hostel_id: 'BH-13',
                        items: [{
                            product_id: testItem.id,
                            name: testItem.name,
                            price: testItem.price,
                            quantity: 1
                        }]
                    })
                });

                assert.strictEqual(placeRes.status, 200);
                const placeData = await placeRes.json();
                assert.strictEqual(placeData.orderId, order2Id);

                // Now simulate YouPI Bank Observer Webhook arrival
                const utr2 = '789123456000';
                const webhookPayload = JSON.stringify({
                    event: 'SUCCESS',
                    orderId: order2Id,
                    amount: String(placeData.order?.total || 50),
                    utr: utr2,
                    paymentId: 'pay_post_order_session'
                });
                const sig2 = 'sha256=' + crypto.createHmac('sha256', youpiService.webhookSecret).update(webhookPayload).digest('hex');

                const whRes = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Gateway-Signature': sig2
                    },
                    body: webhookPayload
                });

                assert.strictEqual(whRes.status, 200);

                // Fetch order and verify it is now PAID
                const updatedOrder = await supabaseDb.orders.getOrderById(order2Id);
                assert.strictEqual(updatedOrder.payment_status, 'PAID', 'Order payment_status should be updated to PAID');
                console.log('  ✅ Existing order successfully reconciled to PAID on observer webhook arrival.');
            }
        }

        // TEST 6: YouPI Init Endpoint Input & Availability Guard
        console.log('\n[6/6] Testing POST /api/checkout/youpi-init validation...');
        {
            // Empty items should fail with 400
            const res = await fetch(`${baseUrl}/api/checkout/youpi-init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: []
                })
            });

            assert.strictEqual(res.status, 400, 'Empty items should return 400');
            const data = await res.json();
            assert.strictEqual(data.success, false);
            assert.ok(data.error.includes('empty'), 'Error should mention empty cart');
            console.log('  ✅ /api/checkout/youpi-init validates empty carts properly.');
        }

        console.log('\n====================================================');
        console.log('🎉 ALL YOUPI PAYMENT INTEGRATION TESTS PASSED CLEANLY');
        console.log('====================================================');
        process.exit(0);
    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
});

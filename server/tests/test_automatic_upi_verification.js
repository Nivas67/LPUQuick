const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const app = require('../app');
const youpiService = require('../services/youpiService');
const supabaseDb = require('../db/supabaseDb');

async function runTestSuite() {
    console.log('========================================================================');
    console.log('🧪 TESTING AUTOMATIC UPI VERIFICATION & PROOF-OF-PAYMENT BYPASS REMOVAL');
    console.log('========================================================================\n');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
        const testOrderId = `order_autoverify_${Date.now()}`;
        const phone = '9876543210';

        // Find or create in-stock product
        let prods = [];
        try {
            prods = await supabaseDb.products.getAll('BH-13', false, false, true);
        } catch (e) {}

        let testItem = (prods || []).find(p => p.in_stock && (p.stock_left > 1 || p.stock_left === undefined));
        
        // If no products in DB, create mock inventory override in memory
        if (!testItem) {
            testItem = {
                id: 'prod_test_auto_verify',
                name: 'Test Campus Snack',
                price: 50,
                cost_price: 30,
                mrp: 60,
                in_stock: true,
                stock_left: 10
            };
            if (supabaseDb.inventory && supabaseDb.inventory.setHostelInventory) {
                await supabaseDb.inventory.setHostelInventory('BH-13', {
                    [testItem.id]: { in_stock: true, stock_left: 10 }
                }).catch(() => {});
            }
        }

        const testItems = [{
            product_id: testItem.id || 'prod_test_upi_item',
            name: testItem.name || 'Campus Snack Test Item',
            price: Number(testItem.price) || 50,
            quantity: 1
        }];

        // TEST 1: Placing order with unverified paymentStatus: 'PAID' must NOT be marked PAID
        console.log('[1/4] Placing order with client-supplied paymentStatus: "PAID" without webhook...');
        const orderRes1 = await fetch(`${baseUrl}/api/checkout/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: testOrderId,
                userId: 'student_tester_auto',
                customerPhone: phone,
                customerName: 'Test Student',
                deliveryAddress: '[BH-13] BH-13 (Block A), Room 204',
                hostel_id: 'BH-13',
                paymentMethod: 'upi',
                paymentStatus: 'PAID', // Client claiming PAID!
                utr: 'FAKED_UTR_12345',
                items: testItems
            })
        });

        const orderData1 = await orderRes1.json();
        if (orderRes1.status === 200) {
            assert.strictEqual(orderData1.success, true);
            assert.strictEqual(
                orderData1.paymentStatus,
                'pending',
                'Security violation: Unverified client paymentStatus: "PAID" MUST be downgraded to "pending"'
            );
            console.log('  ✅ Server successfully prevented client proof-of-payment spoofing. Order payment_status is strictly: pending');
        } else {
            console.log('  ℹ️ Order placement returned client notice (e.g. stock constraint):', orderData1.error);
        }

        // TEST 2: Polling order-payment-status while pending returns 'Payment Verification in Progress'
        console.log('\n[2/4] Testing GET /api/checkout/order-payment-status/:orderId while pending...');
        const pollRes1 = await fetch(`${baseUrl}/api/checkout/order-payment-status/${testOrderId}`);
        assert.strictEqual(pollRes1.status, 200);
        const pollData1 = await pollRes1.json();
        assert.strictEqual(pollData1.success, true);
        assert.strictEqual(pollData1.paid, false);
        assert.strictEqual(pollData1.status, 'PROCESSING');
        assert.strictEqual(pollData1.message, 'Payment Verification in Progress');
        console.log('  ✅ Polling endpoint correctly returns status: PROCESSING ("Payment Verification in Progress")');

        // TEST 3: Authoritative YouPI PG Webhook Arrival
        console.log('\n[3/4] Simulating incoming authentic HMAC-SHA256 webhook from YouPI PG...');
        const authenticUtr = `429182${Date.now().toString().slice(-6)}`;
        const webhookPayload = JSON.stringify({
            event: 'SUCCESS',
            orderId: testOrderId,
            paymentId: `pay_${Date.now()}`,
            amount: '50.00',
            utr: authenticUtr,
            verificationLevel: 2
        });

        const sig = 'sha256=' + crypto.createHmac('sha256', youpiService.webhookSecret).update(webhookPayload).digest('hex');
        const webhookRes = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Signature': sig
            },
            body: webhookPayload
        });

        assert.strictEqual(webhookRes.status, 200);
        const webhookData = await webhookRes.json();
        assert.strictEqual(webhookData.received, true);
        console.log('  ✅ Authoritative YouPI webhook accepted and signed HMAC validated.');

        // TEST 4: Polling order-payment-status after webhook confirmation returns PAID
        console.log('\n[4/4] Polling order-payment-status after bank confirmation...');
        const pollRes2 = await fetch(`${baseUrl}/api/checkout/order-payment-status/${testOrderId}`);
        assert.strictEqual(pollRes2.status, 200);
        const pollData2 = await pollRes2.json();
        assert.strictEqual(pollData2.success, true);
        assert.strictEqual(pollData2.paid, true);
        assert.strictEqual(pollData2.status, 'PAID');
        assert.strictEqual(pollData2.utr, authenticUtr);
        console.log('  ✅ Polling endpoint now authoritatively returns paid: true, status: PAID, UTR:', pollData2.utr);

        console.log('\n========================================================================');
        console.log('🎉 ALL AUTOMATIC UPI VERIFICATION TESTS PASSED SUCCESSFULLY!');
        console.log('========================================================================\n');
    } finally {
        server.close();
    }
}

runTestSuite().catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});

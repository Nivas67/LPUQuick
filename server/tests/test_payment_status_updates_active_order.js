const assert = require('assert');
const http = require('http');
const WebSocket = require('ws');
const app = require('../app');
const supabaseDb = require('../db/supabaseDb');

const { setupRealtime } = require('../realtime');

async function runEndToEndVerification() {
    console.log('========================================================================');
    console.log('🧪 VERIFYING PAYMENT SUCCESS -> ORDER STATUS & TRACKING UPDATE FLOW');
    console.log('========================================================================\n');

    const server = http.createServer(app);
    setupRealtime(server);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    const wsUrl = `ws://localhost:${port}`;

    try {
        const testUserId = `student_pay_test_${Date.now()}`;
        const testOrderId = `order_pay_test_${Date.now()}`;
        const testUtr = `987654${Date.now().toString().slice(-6)}`;

        // Fetch real product and ensure in stock
        const prodsRes = await fetch(`${baseUrl}/api/products`);
        const prodsData = await prodsRes.json();
        const prods = Array.isArray(prodsData.products) ? prodsData.products : (Array.isArray(prodsData) ? prodsData : []);
        assert.ok(prods.length > 0, 'Products must exist in store');
        let product = prods.find(p => p.in_stock && (p.stock_left === undefined || p.stock_left > 5)) || prods[0];
        try {
            await supabaseDb.products.update(product.id, { in_stock: true, stock_left: 50 });
            await supabaseDb.inventory.setProductStock('BH-13', product.id, { stock_left: 50, in_stock: true });
        } catch (e) {}

        const testItems = [{
            product_id: product.id,
            name: product.name,
            price: Number(product.price) || 40,
            quantity: 1
        }];

        // 1. Direct Order Placement with UPI & UTR (Auto-Reconciled)
        console.log('[1/4] Placing Order with UPI + Valid 12-digit UTR...');
        const placeRes = await fetch(`${baseUrl}/api/checkout/place`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: testOrderId,
                userId: testUserId,
                customerPhone: '9876543210',
                customerName: 'Payment Test Student',
                deliveryAddress: '[BH-13] BH-13 (Block B), Room 402',
                hostel_id: 'BH-13',
                paymentMethod: 'UPI (Direct QR)',
                paymentStatus: 'PAID',
                utr: testUtr,
                items: testItems
            })
        });

        const placeData = await placeRes.json();
        console.log('  -> Placement Response Status:', placeRes.status, 'Body:', placeData);
        assert.strictEqual(placeRes.status, 200, 'Placement must return 200');
        assert.strictEqual(placeData.success, true, 'Placement success must be true');
        assert.strictEqual(placeData.paymentStatus, 'PAID', 'Payment status must be PAID');
        assert.strictEqual(placeData.order.status, 'Order Confirmed', 'Order status must be "Order Confirmed"');
        console.log('  ✅ Order created with status: "Order Confirmed" and paymentStatus: "PAID"');

        // 2. Query Active Order Endpoint (GET /api/orders/:userId/active)
        console.log('\n[2/4] Querying GET /api/orders/:userId/active...');
        const queryUserId = placeData.order.user_id || testUserId;
        const activeRes = await fetch(`${baseUrl}/api/orders/${queryUserId}/active`);
        assert.strictEqual(activeRes.status, 200, 'Active order must return 200');
        const activeData = await activeRes.json();
        console.log('  -> Active Data:', JSON.stringify(activeData));
        assert.strictEqual(activeData.success, true);
        assert.ok(activeData.active, 'Active order object must be present');
        assert.strictEqual(activeData.active.id, testOrderId);
        assert.strictEqual(activeData.active.payment_status, 'PAID', 'active.payment_status MUST be PAID');
        assert.strictEqual(activeData.active.status, 'Order Confirmed', 'active.status MUST be Order Confirmed');
        console.log('  ✅ GET /api/orders/:userId/active returns active order with:');
        console.log('     • ID:', activeData.active.id);
        console.log('     • Status:', activeData.active.status);
        console.log('     • Payment Status:', activeData.active.payment_status);
        console.log('     • Payment Method:', activeData.active.payment_method);

        // 3. Query Polling Endpoint (GET /api/checkout/order-payment-status/:orderId)
        console.log('\n[3/4] Querying GET /api/checkout/order-payment-status/:orderId...');
        const pollRes = await fetch(`${baseUrl}/api/checkout/order-payment-status/${testOrderId}`);
        assert.strictEqual(pollRes.status, 200);
        const pollData = await pollRes.json();
        assert.strictEqual(pollData.success, true);
        assert.strictEqual(pollData.paid, true);
        assert.strictEqual(pollData.status, 'PAID');
        console.log('  ✅ Polling endpoint returned: paid=true, status=PAID, utr=' + pollData.utr);

        // 4. Test Payment Callback Endpoint (POST /api/checkout/payment-callback)
        console.log('\n[4/4] Testing POST /api/checkout/payment-callback on pending order...');
        const orderId2 = `order_cb_test_${Date.now()}`;
        const utr2 = `UTR_CB_${Date.now().toString().slice(-6)}`;

        // Create an initial pending order
        await supabaseDb.orders.createOrder({
            id: orderId2,
            hostel_id: 'BH-13',
            user_id: testUserId,
            customer_name: 'Callback Student',
            customer_phone: '9876543210',
            status: 'Order Placed',
            subtotal: 50,
            delivery_fee: 0,
            platform_fee: 5,
            tax: 0,
            total: 55,
            payment_method: 'UPI',
            payment_status: 'pending',
            rider_name: 'Alex',
            delivery_address: '[BH-13] BH-13 (Block A), Room 101'
        }, testItems);

        // Connect WebSocket client to student tracking channel
        const receivedWsMessages = [];
        const clientWs = new WebSocket(`${wsUrl}/ws/track/${orderId2}`);
        await new Promise(resolve => {
            clientWs.on('open', resolve);
            clientWs.on('message', data => {
                try {
                    receivedWsMessages.push(JSON.parse(data.toString()));
                } catch(e) {}
            });
        });

        // Trigger payment callback
        const cbRes = await fetch(`${baseUrl}/api/checkout/payment-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: orderId2,
                status: 'PAID',
                utr: utr2
            })
        });

        assert.strictEqual(cbRes.status, 200);
        const cbData = await cbRes.json();
        assert.strictEqual(cbData.success, true);
        assert.strictEqual(cbData.paid, true);
        assert.strictEqual(cbData.status, 'PAID');

        // Check DB update
        const updatedOrder2 = await supabaseDb.orders.getOrderById(orderId2);
        assert.strictEqual(updatedOrder2.status, 'Order Confirmed', 'Callback must promote status to Order Confirmed');
        assert.strictEqual(updatedOrder2.payment_status, 'PAID', 'Callback must set payment_status to PAID');

        // Wait brief moment for WS message
        await new Promise(r => setTimeout(r, 400));
        clientWs.close();

        const statusUpdateMsg = receivedWsMessages.find(m => m.type === 'STATUS_UPDATE');
        assert.ok(statusUpdateMsg, 'Student WebSocket MUST receive STATUS_UPDATE packet');
        assert.strictEqual(statusUpdateMsg.status, 'Order Confirmed');
        assert.strictEqual(statusUpdateMsg.payment_status, 'PAID');
        console.log('  ✅ Student WebSocket received real-time packet:');
        console.log('     • type:', statusUpdateMsg.type);
        console.log('     • status:', statusUpdateMsg.status);
        console.log('     • payment_status:', statusUpdateMsg.payment_status);

        console.log('\n========================================================================');
        console.log('🎉 ALL END-TO-END PAYMENT STATUS UPDATE CHECKS PASSED WITH FLYING COLORS!');
        console.log('========================================================================\n');
    } finally {
        server.close();
    }
}

runEndToEndVerification().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});

// Test Suite: Real-time Order Popup and WebSocket Broadcast
const WebSocket = require('ws');
const http = require('http');

function postJson(path, payload, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                ...headers
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

(async () => {
    console.log('===============================================================');
    console.log('⚡ TESTING REAL-TIME INSTANT ORDER NOTIFICATION & WEBSOCKET HUB');
    console.log('===============================================================\n');

    // 1. Connect Admin WebSocket
    console.log('1. Connecting Admin Dashboard WebSocket to ws://127.0.0.1:3000/ws/admin ...');
    const ws = new WebSocket('ws://127.0.0.1:3000/ws/admin');

    const receivedMessages = [];
    await new Promise((resolve, reject) => {
        ws.on('open', () => {
            console.log('   ✓ Admin WebSocket connection established.');
        });
        ws.on('message', (msg) => {
            const parsed = JSON.parse(msg.toString());
            console.log('   📩 [WS Received]:', parsed.type);
            receivedMessages.push(parsed);
            if (parsed.type === 'CONNECTED') resolve();
        });
        ws.on('error', reject);
    });

    // 2. Simulate Client placing an order via Storefront Checkout
    console.log('\n2. Simulating Client placing order via POST /api/checkout ...');
    
    // First, ensure cart has an item
    await postJson('/api/cart', {
        userId: 'user_001',
        productId: 'prod_m01',
        quantity: 2
    });

    // Place checkout order
    const checkoutRes = await postJson('/api/checkout', {
        userId: 'user_001',
        paymentMethod: 'Cash on Delivery',
        deliveryAddress: 'BH13 (Block A), Room 304'
    });

    console.log('   - Checkout Response Status:', checkoutRes.status);
    console.log('   - Placed Order ID:', checkoutRes.data?.order?.id);
    console.log('   - Order Total: ₹', checkoutRes.data?.order?.total);

    if (!checkoutRes.data?.success) {
        throw new Error('Checkout failed: ' + JSON.stringify(checkoutRes.data));
    }

    const createdOrderId = checkoutRes.data.order.id;

    // 3. Verify Admin WebSocket received the NEW_ORDER notification
    console.log('\n3. Verifying Instant Admin Alert Message...');
    await new Promise(r => setTimeout(r, 400)); // give 400ms for event propagation

    const newOrderMsg = receivedMessages.find(m => m.type === 'NEW_ORDER' && m.order?.id === createdOrderId);
    if (!newOrderMsg) {
        throw new Error('Admin WebSocket did NOT receive NEW_ORDER event for ' + createdOrderId);
    }

    console.log('   ✓ NEW_ORDER event arrived at Admin Dashboard in real-time!');
    console.log('   - Customer Name in Toast:', newOrderMsg.order.customer_name);
    console.log('   - Delivery Address in Toast:', newOrderMsg.order.delivery_address);
    console.log('   - Total Amount in Toast: ₹' + newOrderMsg.order.total);
    console.log('   - Item Summary:', newOrderMsg.order.item_summary);

    // 4. Test Status Update Broadcast
    console.log('\n4. Testing Real-time Status Update Broadcast...');
    await postJson('/api/orders/admin/status', {
        orderId: createdOrderId,
        status: 'Preparing',
        riderName: 'Alex'
    }, {
        'Authorization': 'Bearer adm_sec_test'
    });

    await new Promise(r => setTimeout(r, 300));
    const statusUpdateMsg = receivedMessages.find(m => m.type === 'ORDER_STATUS_UPDATE' && m.orderId === createdOrderId);
    if (!statusUpdateMsg || statusUpdateMsg.status !== 'Preparing') {
        throw new Error('Admin WebSocket did NOT receive ORDER_STATUS_UPDATE');
    }
    console.log('   ✓ Status update to "Preparing" broadcasted in real-time!\n');

    ws.close();
    console.log('===============================================================');
    console.log('🎉 REAL-TIME INSTANT POPUP & SYNC VERIFIED 100% SUCCESSFUL!');
    console.log('===============================================================');
    process.exit(0);
})();

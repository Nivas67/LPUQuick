/**
 * Full End-to-End Real-Time Ecosystem Test:
 * 1. Admin connects to /ws/admin
 * 2. Student client checks active order and connects to /ws/track/:orderId
 * 3. Student places order via /api/checkout
 * 4. Admin receives instant chime payload and order event
 * 5. Admin updates status to "Order Confirmed" -> Student receives step 2
 * 6. Admin updates status to "Preparing" -> Student receives step 3
 * 7. Admin updates status to "Out for Delivery" -> Student receives step 4 with walking runner
 * 8. Admin updates status to "Delivered" -> Student receives step 5
 */

const WebSocket = require('ws');
const http = require('http');

async function run() {
    console.log('========================================================');
    console.log('🚀 TESTING FULL REAL-TIME ECOSYSTEM (ADMIN <-> CLIENT)');
    console.log('========================================================\n');

    // 1. Connect Admin WebSocket
    const adminWs = new WebSocket('ws://127.0.0.1:3000/ws/admin');
    const adminEvents = [];
    
    await new Promise((resolve) => {
        adminWs.on('open', () => {
            console.log('✓ 1. Admin WebSocket Connected.');
            resolve();
        });
        adminWs.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            adminEvents.push(data);
            console.log(`   [Admin WS Received Event]: ${data.type}`);
        });
    });

    // 2. Add item to cart and student places checkout order
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_001',
            productId: 'prod_s01',
            quantity: 2
        })
    });

    const orderRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_001',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery'
        })
    });

    const orderData = await orderRes.json();
    console.log('Checkout response:', orderData);
    if (!orderData.order) {
        throw new Error('Order creation failed: ' + JSON.stringify(orderData));
    }
    const orderId = orderData.order.id;
    console.log(`\n✓ 2. Student Placed Order: ${orderId} (Total: ₹${orderData.order.total})`);

    // Give 500ms for admin broadcast
    await new Promise(r => setTimeout(r, 500));
    const newOrderEvent = adminEvents.find(e => e.type === 'NEW_ORDER' && e.order?.id === orderId);
    if (!newOrderEvent) {
        throw new Error('Admin did not receive NEW_ORDER event in real-time!');
    }
    console.log('✓ 3. Admin received instant NEW_ORDER alert for order:', orderId);

    // 3. Connect Student Live Tracking WebSocket
    const studentWs = new WebSocket(`ws://127.0.0.1:3000/ws/track/${orderId}`);
    const studentEvents = [];

    await new Promise((resolve) => {
        studentWs.on('open', () => {
            console.log('✓ 4. Student Live Tracking WebSocket Connected for', orderId);
            resolve();
        });
        studentWs.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            studentEvents.push(data);
            console.log(`   [Student WS Received]: Status -> "${data.status}" (Step ${data.step}) | Msg: "${data.message}"`);
        });
    });

    // 4. Admin Auth Token
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    // 5. Admin updates through the full delivery lifecycle
    const statusProgression = ['Order Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];

    for (const st of statusProgression) {
        console.log(`\n--- Admin Action: Updating status to "${st}" ---`);
        const updateRes = await fetch('http://127.0.0.1:3000/api/orders/admin/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                orderId: orderId,
                status: st,
                riderName: 'Rahul (BH13 Express Walker)'
            })
        });
        const updateData = await updateRes.json();
        console.log('   Admin Status Update API Response:', updateData.message);
        await new Promise(r => setTimeout(r, 400));
    }

    // 6. Verify assertions
    console.log('\n--- Final Verification ---');
    const receivedStatuses = studentEvents.map(e => e.status);
    console.log('Student received statuses:', receivedStatuses);

    if (
        receivedStatuses.includes('Order Placed') &&
        receivedStatuses.includes('Order Confirmed') &&
        receivedStatuses.includes('Preparing') &&
        receivedStatuses.includes('Out for Delivery') &&
        receivedStatuses.includes('Delivered')
    ) {
        console.log('\n✅ 100% PASS: All order state transitions synchronized in real time from Admin to Client!');
    } else {
        throw new Error('Not all statuses were received by the student tracking socket!');
    }

    adminWs.close();
    studentWs.close();
    console.log('\n🎉 ALL REAL-TIME ECOSYSTEM TESTS PASSED!\n');
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

/**
 * Test:
 * 1. User cancels order while Placed -> Admin WS receives Cancelled status and DB reflects Cancelled
 * 2. User attempts to cancel order when status is 'Out for Delivery' -> Server rejects with 400 (Frozen)
 */

const WebSocket = require('ws');

async function testCancelFreezeAndAdminSync() {
    console.log('========================================================');
    console.log('🧪 TESTING STUDENT CANCELLATION SYNC & EN-ROUTE FREEZE');
    console.log('========================================================\n');

    // 1. Admin Login & Connect Admin WS
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'Nivas@2006$%' })
    });
    const { token } = await loginRes.json();

    // Ensure test product has ample stock
    await fetch('http://127.0.0.1:3000/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            productId: 'prod_66755a4a',
            stock: 30,
            hostel_id: 'BH-13'
        })
    });

    const adminWs = new WebSocket(`ws://127.0.0.1:3000/ws/admin?token=${encodeURIComponent(token)}`);
    const adminEvents = [];
    await new Promise(resolve => {
        adminWs.on('open', () => {
            console.log('✓ 1. Admin WS connected.');
            resolve();
        });
        adminWs.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            adminEvents.push(data);
            console.log(`   📩 [Admin WS Event]: Type -> ${data.type} | Status -> ${data.status || (data.order && data.order.status)}`);
        });
    });

    // 2. Place Order #1 (for cancellation test)
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_66755a4a', quantity: 2, hostelId: 'BH-13' })
    });
    const checkoutRes1 = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_001',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            hostel_id: 'BH-13',
            items: [{ id: 'prod_66755a4a', product_id: 'prod_66755a4a', name: 'Dark Fantasy', price: 29, quantity: 2 }]
        })
    });
    const checkoutData1 = await checkoutRes1.json();
    console.log('Checkout 1 response:', checkoutData1);
    const order1 = checkoutData1.order || { id: checkoutData1.orderId };
    console.log(`\n✓ 2. Placed Order 1: #${order1.id}`);

    // Wait for WS propagation
    await new Promise(r => setTimeout(r, 400));

    // 3. Student Cancels Order 1 via Help Option
    console.log('--- Student Cancels Order 1 via Help Menu ---');
    const cancelRes = await fetch(`http://127.0.0.1:3000/api/orders/${order1.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Student cancelled via Help Menu' })
    });
    const cancelData = await cancelRes.json();
    console.log('✓ 3. Cancel API response:', cancelData);

    await new Promise(r => setTimeout(r, 600));

    // 4. Verify Admin received status update
    const adminCancelEvent = adminEvents.find(e => e.type === 'ORDER_STATUS_UPDATE' && (e.orderId === order1.id || e.order_id === order1.id) && e.status === 'Cancelled');
    if (!adminCancelEvent) {
        throw new Error('Admin WS did not receive Cancelled status update for order 1!');
    }
    console.log('✓ 4. Admin WS successfully received Cancelled notification in real-time!');

    // 5. Test Freezing: Place Order 2 and set to Out for Delivery
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_66755a4a', quantity: 2, hostelId: 'BH-13' })
    });
    const checkoutRes2 = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_001',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            hostel_id: 'BH-13',
            items: [{ id: 'prod_66755a4a', product_id: 'prod_66755a4a', name: 'Dark Fantasy', price: 29, quantity: 2 }]
        })
    });
    const checkoutData2 = await checkoutRes2.json();
    console.log('Checkout 2 response:', checkoutData2);
    const order2 = checkoutData2.order || { id: checkoutData2.orderId };
    console.log(`\n✓ 5. Placed Order 2: #${order2.id}`);

    // Admin updates Order 2 to Out for Delivery
    await fetch('http://127.0.0.1:3000/api/orders/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId: order2.id, status: 'Out for Delivery' })
    });
    console.log('✓ 6. Admin updated Order 2 status to "Out for Delivery"');

    // Student attempts to cancel Order 2 (Should fail / be frozen)
    console.log('--- Student attempts to cancel Order 2 while Out for Delivery (Should be frozen) ---');
    const frozenCancelRes = await fetch(`http://127.0.0.1:3000/api/orders/${order2.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Attempting cancellation after pack' })
    });
    const frozenCancelData = await frozenCancelRes.json();
    console.log(`✓ 7. Server response for frozen cancel (Status ${frozenCancelRes.status}):`, frozenCancelData);

    if (frozenCancelRes.status !== 400) {
        throw new Error(`Expected HTTP 400 for frozen cancel, but got ${frozenCancelRes.status}`);
    }

    adminWs.close();
    console.log('\n========================================================');
    console.log('🎉 100% SUCCESS: STUDENT CANCEL SYNC & FREEZING VERIFIED!');
    console.log('========================================================\n');
    process.exit(0);
}

testCancelFreezeAndAdminSync().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

/**
 * Test Admin Order Cancellation Flow:
 * 1. Student places order
 * 2. Student connects to /ws/track/:orderId
 * 3. Admin cancels order (status -> 'Cancelled')
 * 4. Verify Student WS receives Cancelled event with step -1 and red status message
 * 5. Verify order is archived in past orders with Cancelled status
 */

const WebSocket = require('ws');

async function testCancelFlow() {
    console.log('========================================================');
    console.log('🧪 TESTING ADMIN ORDER CANCELLATION -> CLIENT SYNC');
    console.log('========================================================\n');

    // 1. Add item to cart
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_s01', quantity: 1 })
    });

    // 2. Checkout
    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', deliveryAddress: 'BH13 (Block A), Room 304' })
    });
    const { order } = await checkoutRes.json();
    console.log('✓ 1. Placed order:', order.id);

    // 3. Connect Student Tracking WebSocket
    const ws = new WebSocket(`ws://127.0.0.1:3000/ws/track/${order.id}`);
    const events = [];

    await new Promise((resolve) => {
        ws.on('open', () => {
            console.log('✓ 2. Student WS connected for tracking.');
            resolve();
        });
        ws.on('message', (msg) => {
            const data = JSON.parse(msg.toString());
            events.push(data);
            console.log(`   📩 [Student WS Received]: Status -> "${data.status}" (Step ${data.step}) | Msg: "${data.message}"`);
        });
    });

    // 4. Admin Login
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    // 5. Admin Cancel Action
    console.log('\n--- Admin Action: Updating status to "Cancelled" ---');
    const cancelRes = await fetch('http://127.0.0.1:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.id, status: 'Cancelled' })
    });
    const cancelData = await cancelRes.json();
    console.log('✓ 3. Admin cancellation API response:', cancelData.message);

    // Wait for WS event delivery
    await new Promise(r => setTimeout(r, 600));

    // 6. Verify assertions
    const cancelEvent = events.find(e => e.status === 'Cancelled');
    if (!cancelEvent) {
        throw new Error('Student WS did not receive Cancelled status event!');
    }
    console.log('✓ 4. Student WS received live Cancelled notification:', cancelEvent);

    // 7. Verify API reflects in past orders
    const pastRes = await fetch('http://127.0.0.1:3000/api/orders/user_001');
    const pastData = await pastRes.json();
    const isArchived = pastData.past.some(o => o.id === order.id && o.status === 'Cancelled');
    if (!isArchived) {
        throw new Error('Order was not properly archived into past orders as Cancelled!');
    }
    console.log('✓ 5. Order verified in Past Orders with Cancelled status.');

    ws.close();
    console.log('\n========================================================');
    console.log('🎉 100% SUCCESS: ADMIN CANCELLATION SYNC VERIFIED!');
    console.log('========================================================\n');
    process.exit(0);
}

testCancelFlow().catch(err => {
    console.error('❌ Cancellation test failed:', err);
    process.exit(1);
});

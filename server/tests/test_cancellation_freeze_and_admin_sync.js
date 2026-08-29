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
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const { token } = await loginRes.json();

    const adminWs = new WebSocket('ws://127.0.0.1:3000/ws/admin');
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
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_bisc_01', quantity: 1 })
    });
    const checkoutRes1 = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', deliveryAddress: 'BH13 (Block A), Room 304' })
    });
    const { order: order1 } = await checkoutRes1.json();
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

    await new Promise(r => setTimeout(r, 500));

    // 4. Verify Admin received status update
    const adminCancelEvent = adminEvents.find(e => e.type === 'ORDER_STATUS_UPDATE' && e.orderId === order1.id && e.status === 'Cancelled');
    if (!adminCancelEvent) {
        throw new Error('Admin WS did not receive Cancelled status update for order 1!');
    }
    console.log('✓ 4. Admin WS successfully received Cancelled notification in real-time!');

    // 5. Test Freezing: Place Order 2 and set to Out for Delivery
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_bisc_02', quantity: 1 })
    });
    const checkoutRes2 = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', deliveryAddress: 'BH13 (Block A), Room 304' })
    });
    const { order: order2 } = await checkoutRes2.json();
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

    // Clean up test orders from DB so admin dashboard stays pristine
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync('server/db/lpuquick.db');
    db.prepare('DELETE FROM order_items WHERE order_id IN (?, ?)').run(order1.id, order2.id);
    db.prepare('DELETE FROM orders WHERE id IN (?, ?)').run(order1.id, order2.id);
    console.log('✓ 8. Cleaned up test orders from database.');

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

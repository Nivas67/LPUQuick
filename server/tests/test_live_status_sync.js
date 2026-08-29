const WebSocket = require('ws');
const { initDB } = require('../db/init');

async function runLiveStatusSyncTest() {
    console.log('========================================================');
    console.log('🧪 TESTING ADMIN STATUS UPDATE -> CLIENT LIVE SYNC');
    console.log('========================================================\n');

    const db = initDB();
    const port = 3000;

    // 1. Create a test order
    const testOrderId = `order_test_${Date.now()}`;
    db.prepare(`
        INSERT INTO orders (id, user_id, total, status, delivery_address, created_at, status_history)
        VALUES (?, 'user_001', 195, 'Order Placed', 'BH13 (Block A), Room 304', datetime('now'), '[]')
    `).run(testOrderId);
    console.log(`✓ Created test order: ${testOrderId} with status "Order Placed"`);

    // 2. Connect Student WebSocket for tracking
    const studentWsUrl = `ws://localhost:${port}/ws/track/${testOrderId}`;
    const receivedEvents = [];

    const studentWs = new WebSocket(studentWsUrl);

    await new Promise((resolve, reject) => {
        studentWs.on('open', () => {
            console.log('✓ Student WebSocket connected to tracking endpoint');
            resolve();
        });
        studentWs.on('message', (data) => {
            const parsed = JSON.parse(data.toString());
            console.log(`  📩 [Student WS Received]: Type: ${parsed.type} | Status: "${parsed.status}" | Step: ${parsed.step} | Msg: "${parsed.message}"`);
            receivedEvents.push(parsed);
        });
        studentWs.on('error', reject);
    });

    // Wait for INITIAL_STATE
    await new Promise(r => setTimeout(r, 100));

    // 3. Admin updates status to "Preparing"
    console.log('\n--- Admin Action: Updating status to "Preparing" ---');
    const updateRes1 = await fetch(`http://localhost:${port}/api/orders/admin/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'adm_sec_auto_auth'
        },
        body: JSON.stringify({
            orderId: testOrderId,
            status: 'Preparing'
        })
    });
    const updateData1 = await updateRes1.json();
    console.log(`✓ Admin API Response:`, updateData1);

    // Wait for WS propagation
    await new Promise(r => setTimeout(r, 200));

    // 4. Admin updates status to "Out for Delivery"
    console.log('\n--- Admin Action: Updating status to "Out for Delivery" (Rider Alex) ---');
    const updateRes2 = await fetch(`http://localhost:${port}/api/orders/admin/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'adm_sec_auto_auth'
        },
        body: JSON.stringify({
            orderId: testOrderId,
            status: 'Out for Delivery',
            riderName: 'Alex'
        })
    });
    const updateData2 = await updateRes2.json();
    console.log(`✓ Admin API Response:`, updateData2);

    // Wait for WS propagation
    await new Promise(r => setTimeout(r, 200));

    // 5. Admin updates status to "Delivered"
    console.log('\n--- Admin Action: Updating status to "Delivered" ---');
    const updateRes3 = await fetch(`http://localhost:${port}/api/orders/admin/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'adm_sec_auto_auth'
        },
        body: JSON.stringify({
            orderId: testOrderId,
            status: 'Delivered'
        })
    });
    const updateData3 = await updateRes3.json();
    console.log(`✓ Admin API Response:`, updateData3);

    // Wait for WS propagation
    await new Promise(r => setTimeout(r, 200));

    // 6. Assertions
    console.log('\n--- Verifying Results ---');
    console.log(`Total events received by Student: ${receivedEvents.length}`);

    const statusesReceived = receivedEvents.map(e => e.status);
    console.log('Statuses received in order:', statusesReceived);

    const hasPreparing = receivedEvents.some(e => e.status === 'Preparing' && e.step === 3);
    const hasOutForDelivery = receivedEvents.some(e => e.status === 'Out for Delivery' && e.step === 4);
    const hasDelivered = receivedEvents.some(e => e.status === 'Delivered' && e.step === 5);

    if (hasPreparing && hasOutForDelivery && hasDelivered) {
        console.log('✅ PASS: All status updates reached the student client in real-time with correct steps!');
    } else {
        console.error('❌ FAIL: Some status updates did not propagate correctly.');
        process.exit(1);
    }

    // Check DB
    const finalOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(testOrderId);
    console.log(`✓ Database final status: "${finalOrder.status}"`);

    studentWs.close();
    console.log('\n========================================================');
    console.log('🎉 100% SUCCESS: CLIENT-SIDE LIVE SYNC VERIFIED!');
    console.log('========================================================');
    process.exit(0);
}

runLiveStatusSyncTest().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});

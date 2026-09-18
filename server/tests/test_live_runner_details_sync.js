const WebSocket = require('ws');
const { generateAdminToken } = require('../middleware/adminAuth');
const { setRiderStatus } = require('../services/riderAvailability');
const supabaseDb = require('../db/supabaseDb');

async function testLiveRunnerSync() {
    console.log('--- Starting Live Runner Details Sync Test ---');
    const port = 3000;
    const adminToken = generateAdminToken('user_admin_bh13', 'owner');
    setRiderStatus('user_admin_bh13', true);

    // 1. Connect Client WebSocket
    const clientWs = new WebSocket(`ws://localhost:${port}/ws/client`);
    const receivedClientEvents = [];

    await new Promise((resolve, reject) => {
        clientWs.on('open', resolve);
        clientWs.on('error', reject);
    });
    console.log('✓ Student /ws/client WebSocket connected');

    clientWs.on('message', (msg) => {
        try {
            const data = JSON.parse(msg.toString());
            receivedClientEvents.push(data);
        } catch(e) {}
    });

    // 2. Connect Admin WebSocket
    const adminWs = new WebSocket(`ws://localhost:${port}/ws/admin?token=${encodeURIComponent(adminToken)}`);
    await new Promise((resolve, reject) => {
        adminWs.on('open', resolve);
        adminWs.on('error', reject);
    });
    console.log('✓ Admin /ws/admin WebSocket connected');

    // 3. Create a temporary test order
    const testOrderId = `order_test_${Date.now()}`;
    const { getSupabaseClient } = require('../supabase');
    const supabase = getSupabaseClient();
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const testUserId = users[0].id;
    const { error: insertErr } = await supabase.from('orders').insert({
        id: testOrderId,
        user_id: testUserId,
        status: 'Order Placed',
        total: 20,
        subtotal: 20,
        delivery_fee: 0,
        delivery_address: 'BH13 (Block A), Room 204',
        payment_method: 'Cash on Delivery',
        rider_name: 'unassigned',
        created_at: new Date().toISOString()
    });
    console.log(`✓ Test order ${testOrderId} created`);

    // 4. Admin claims the order
    console.log('--- Simulating Admin / Delivery Boy Claim ---');
    const claimRes = await fetch(`http://localhost:${port}/api/orders/${testOrderId}/claim`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            adminName: 'Rohith'
        })
    });
    const claimJson = await claimRes.json();
    console.log('Claim API response success:', claimJson.success);

    // Wait 300ms for WebSocket event
    await new Promise(r => setTimeout(r, 300));

    const claimEvent = receivedClientEvents.find(e => e.type === 'ORDER_CLAIMED' && (e.orderId === testOrderId || e.order_id === testOrderId));
    if (!claimEvent) {
        throw new Error('FAIL: Student WebSocket did not receive ORDER_CLAIMED event!');
    }
    console.log('✓ Student WebSocket received ORDER_CLAIMED:', {
        type: claimEvent.type,
        riderName: claimEvent.riderName,
        riderPhone: claimEvent.riderPhone
    });
    if (claimEvent.riderName !== 'Rohith') {
        throw new Error(`Expected riderName to be Rohith, got ${claimEvent.riderName}`);
    }

    // 5. Test /api/orders/:userId/active
    const activeRes = await fetch(`http://localhost:${port}/api/orders/${testUserId}/active`);
    const activeJson = await activeRes.json();
    console.log('✓ Active order fetched:', {
        id: activeJson.active?.id,
        status: activeJson.active?.status,
        rider_name: activeJson.active?.rider_name,
        rider_phone: activeJson.active?.rider_phone
    });
    if (activeJson.active?.rider_name !== 'Rohith') {
        throw new Error(`Expected active order rider_name to be Rohith, got ${activeJson.active?.rider_name}`);
    }

    // 6. Admin updates status to "Out for Delivery"
    console.log('--- Admin updating status to "Out for Delivery" ---');
    const statusRes = await fetch(`http://localhost:${port}/api/orders/${testOrderId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            status: 'Out for Delivery'
        })
    });
    const statusJson = await statusRes.json();
    console.log('Status update API response success:', statusJson.success);

    await new Promise(r => setTimeout(r, 300));

    const statusEvent = receivedClientEvents.find(e => (e.type === 'STATUS_UPDATE' || e.type === 'ORDER_STATUS_UPDATE') && (e.order_id === testOrderId || e.orderId === testOrderId) && e.status === 'Out for Delivery');
    if (!statusEvent) {
        throw new Error('FAIL: Student WebSocket did not receive STATUS_UPDATE event!');
    }
    console.log('✓ Student WebSocket received status update with rider preserved:', {
        status: statusEvent.status,
        rider_name: statusEvent.rider_name || statusEvent.riderName
    });
    if ((statusEvent.rider_name || statusEvent.riderName) !== 'Rohith') {
        throw new Error(`Expected rider_name to remain Rohith, got ${statusEvent.rider_name || statusEvent.riderName}`);
    }

    // Clean up
    clientWs.close();
    adminWs.close();

    if (supabase) {
        await supabase.from('orders').delete().eq('id', testOrderId);
    }
    console.log('✓ Cleaned up test order');
    console.log('\n✅ ALL LIVE RUNNER DETAILS SYNC TESTS PASSED SUCCESSFULLY!');
}

testLiveRunnerSync().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

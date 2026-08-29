const WebSocket = require('ws');
const http = require('http');

async function testDualPortalCoordination() {
    console.log('=== Testing Dual Portal Real-Time Coordination (Admin <-> Client) ===');

    const adminEvents = [];
    const clientEvents = [];

    // 1. Connect Admin Portal WS
    const adminWs = new WebSocket('ws://localhost:3000/ws/admin');
    adminWs.on('open', () => console.log('1. [Admin WS] Connected to /ws/admin'));
    adminWs.on('message', d => {
        const msg = JSON.parse(d.toString());
        adminEvents.push(msg);
        console.log('   🛡️ [Admin WS Event]:', msg.type, msg.order?.id || msg.orderId || msg.productId || msg.message || '');
    });

    // 2. Connect Client Storefront WS
    const clientWs = new WebSocket('ws://localhost:3000/ws/client');
    clientWs.on('open', () => console.log('2. [Client WS] Connected to /ws/client'));
    clientWs.on('message', d => {
        const msg = JSON.parse(d.toString());
        clientEvents.push(msg);
        console.log('   🛍️ [Client WS Event]:', msg.type, msg.order?.id || msg.orderId || msg.productId || msg.message || '');
    });

    await new Promise(r => setTimeout(r, 1000));

    const post = (url, body) => new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request('http://localhost:3000' + url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Authorization': 'Bearer adm_sec_master_2026'
            }
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });

    // 3. Test Action 1: Admin adjusts product stock in Dark Store
    console.log('\n--- Action 1: Admin adjusts stock (e.g. +3 units) ---');
    await post('/api/products/admin/adjust-stock', { productId: 'prod_cust_mteqnecv_my0p', delta: 3 });

    await new Promise(r => setTimeout(r, 500));

    // 4. Test Action 2: Admin updates order status to Out for Delivery
    console.log('\n--- Action 2: Admin sets order status to Out for Delivery ---');
    await post('/api/orders/admin/status', { orderId: 'order_ac902d62', status: 'Out for Delivery' });

    await new Promise(r => setTimeout(r, 500));

    // 5. Test Action 3: Admin sets order status to Delivered
    console.log('\n--- Action 3: Admin sets order status to Delivered ---');
    await post('/api/orders/admin/status', { orderId: 'order_ac902d62', status: 'Delivered' });

    await new Promise(r => setTimeout(r, 1500));

    adminWs.close();
    clientWs.close();

    console.log('\n=== Coordination Summary ===');
    const adminTypes = adminEvents.map(e => e.type);
    const clientTypes = clientEvents.map(e => e.type);

    console.log('Admin Received:', adminTypes);
    console.log('Client Received:', clientTypes);

    const adminOk = adminTypes.includes('INVENTORY_UPDATE') && adminTypes.includes('ORDER_STATUS_UPDATE');
    const clientOk = clientTypes.includes('INVENTORY_UPDATE') && clientTypes.includes('STATUS_UPDATE');

    console.log('Admin real-time sync status:', adminOk ? '✅ PERFECT' : '❌ FAILED');
    console.log('Client real-time sync status:', clientOk ? '✅ PERFECT' : '❌ FAILED');
    console.log('Both portals in live coordination:', (adminOk && clientOk) ? '⚡ 100% OPERATIONAL' : '❌ FAILED');
}

testDualPortalCoordination().catch(console.error);

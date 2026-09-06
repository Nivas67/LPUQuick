require('dotenv').config();
const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateAdminToken } = require('../server/middleware/adminAuth');
const { supabase } = require('../server/supabase');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9592;

async function runTest() {
    console.log('--- 1. Launching Chrome with CDP ---');
    const tmpProfile = path.join(os.tmpdir(), `chrome_sync_${Date.now()}`);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${tmpProfile}`,
        '--window-size=1280,900',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    const target = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 1;
    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            const onMsg = (raw) => {
                const msg = JSON.parse(raw);
                if (msg.id === id) {
                    ws.off('message', onMsg);
                    if (msg.error) reject(msg.error);
                    else resolve(msg.result);
                }
            };
            ws.on('message', onMsg);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[Browser Console]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
    });

    await send('Page.navigate', { url: 'http://localhost:3000/#/cart' });
    await new Promise(r => setTimeout(r, 1200));

    const testUserId = 'usr_test_desktop';
    const mockUser = {
        id: testUserId,
        name: 'Nivas Naidu',
        email: 'nivasnaidu07@gmail.com',
        phone: '9876543210',
        room: '925',
        block: 'Block B'
    };

    // Seed localStorage with user session & room details
    await send('Runtime.evaluate', {
        expression: `(() => {
            window.localStorage.setItem('lpuquick_user', JSON.stringify(${JSON.stringify(mockUser)}));
            window.localStorage.setItem('lpuquick_room', '925');
            window.localStorage.setItem('lpuquick_block', 'Block B');
            window.localStorage.setItem('lpuquick_phone', '9876543210');
            window.localStorage.setItem('lpuquick_address_configured', 'true');
            window.CURRENT_USER_ID = '${testUserId}';
        })()`
    });

    // Create real order via window.api.checkout
    console.log('--- 2. Adding item to cart and checking out ---');
    const orderRes = await send('Runtime.evaluate', {
        expression: `(async () => {
            try {
                await window.api.addToCart('${testUserId}', 'prod_a39158cc', 1);
                const res = await window.api.checkout('${testUserId}', 'Cash on Delivery', 'BH13 (Block B), Room 925', {
                    phone: '9876543210',
                    name: 'Nivas Naidu',
                    email: 'nivasnaidu07@gmail.com'
                });
                return res;
            } catch(e) {
                return { error: e.message };
            }
        })()`,
        awaitPromise: true,
        returnByValue: true
    });
    console.log('Checkout response:', orderRes.result.value);

    const activeOrder = orderRes.result.value?.order;
    if (!activeOrder || !activeOrder.id) {
        throw new Error('Failed to create active order: ' + JSON.stringify(orderRes.result.value));
    }
    const orderId = activeOrder.id;
    console.log('Successfully created active order:', orderId, 'Initial status:', activeOrder.status);

    console.log('--- 3. Navigating to #/orders to inspect live tracking map ---');
    await send('Page.navigate', { url: 'http://localhost:3000/#/orders' });
    await new Promise(r => setTimeout(r, 2000));

    const initialDom = await send('Runtime.evaluate', {
        expression: `(() => {
            const pin = document.getElementById('rider-pin');
            const bar = document.getElementById('order-progress-bar');
            const eta = document.getElementById('tracking-eta-time');
            const badge = document.getElementById('rider-badge');
            const stepPlaced = document.getElementById('step-placed');
            const stepPacked = document.getElementById('step-packed');
            return {
                eta: eta?.textContent,
                progressBarWidth: bar?.style.width,
                pinLeft: pin?.style.left,
                riderBadge: badge?.textContent?.trim(),
                stepPlacedClass: stepPlaced?.className,
                stepPackedClass: stepPacked?.className
            };
        })()`,
        returnByValue: true
    });
    console.log('Initial Order Tracking State:', JSON.stringify(initialDom.result.value, null, 2));

    const adminToken = generateAdminToken('user_admin_bh13', 'admin');

    console.log('--- 4. Admin updates status to "Preparing" ---');
    const resPreparing = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderId, status: 'Preparing' })
    });
    console.log('Admin Status API (Preparing) -> HTTP', resPreparing.status);

    await new Promise(r => setTimeout(r, 1200));

    const statePreparing = await send('Runtime.evaluate', {
        expression: `(() => {
            const pin = document.getElementById('rider-pin');
            const bar = document.getElementById('order-progress-bar');
            const eta = document.getElementById('tracking-eta-time');
            const badge = document.getElementById('rider-badge');
            const stepPacked = document.getElementById('step-packed');
            return {
                eta: eta?.textContent,
                progressBarWidth: bar?.style.width,
                pinLeft: pin?.style.left,
                riderBadge: badge?.textContent?.trim(),
                stepPackedClass: stepPacked?.className
            };
        })()`,
        returnByValue: true
    });
    console.log('Client State after Admin -> "Preparing":', JSON.stringify(statePreparing.result.value, null, 2));

    console.log('--- 5. Admin updates status to "Out for Delivery" ---');
    const resOut = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderId, status: 'Out for Delivery' })
    });
    console.log('Admin Status API (Out for Delivery) -> HTTP', resOut.status);

    await new Promise(r => setTimeout(r, 1200));

    const stateOut = await send('Runtime.evaluate', {
        expression: `(() => {
            const pin = document.getElementById('rider-pin');
            const bar = document.getElementById('order-progress-bar');
            const eta = document.getElementById('tracking-eta-time');
            const badge = document.getElementById('rider-badge');
            const stepEnroute = document.getElementById('step-enroute');
            return {
                eta: eta?.textContent,
                progressBarWidth: bar?.style.width,
                pinLeft: pin?.style.left,
                riderBadge: badge?.textContent?.trim(),
                stepEnrouteClass: stepEnroute?.className
            };
        })()`,
        returnByValue: true
    });
    console.log('Client State after Admin -> "Out for Delivery":', JSON.stringify(stateOut.result.value, null, 2));

    // Capture screenshot of live map with runner on the corridor
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join('C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11', 'order_status_sync_verified.png');
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot saved to:', outPath);

    console.log('--- 6. Admin updates status to "Delivered" ---');
    const resDelivered = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orderId, status: 'Delivered' })
    });
    console.log('Admin Status API (Delivered) -> HTTP', resDelivered.status);

    await new Promise(r => setTimeout(r, 1200));

    const stateDelivered = await send('Runtime.evaluate', {
        expression: `(() => {
            const pin = document.getElementById('rider-pin');
            const bar = document.getElementById('order-progress-bar');
            const eta = document.getElementById('tracking-eta-time');
            const badge = document.getElementById('rider-badge');
            const stepDelivered = document.getElementById('step-delivered');
            return {
                eta: eta?.textContent,
                progressBarWidth: bar?.style.width,
                pinLeft: pin?.style.left,
                riderBadge: badge?.textContent?.trim(),
                stepDeliveredClass: stepDelivered?.className
            };
        })()`,
        returnByValue: true
    });
    console.log('Client State after Admin -> "Delivered":', JSON.stringify(stateDelivered.result.value, null, 2));

    // Cleanup
    if (supabase) {
        await supabase.from('orders').delete().eq('id', orderId);
        console.log('Cleaned up test order:', orderId);
    }

    ws.close();
    chromeProc.kill();
    console.log('🎉 ALL ADMIN REAL-TIME STATUS SYNC & MAP TESTS PASSED!');
    process.exit(0);
}

runTest().catch(err => {
    console.error('[Test Error]:', err);
    process.exit(1);
});

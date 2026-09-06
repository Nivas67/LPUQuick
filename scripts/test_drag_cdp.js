const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const os = require('os');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9588;

async function testDrag() {
    const tmpProfile = path.join(os.tmpdir(), `chrome_drag_${Date.now()}`);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${tmpProfile}`,
        '--window-size=1280,1000',
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

    if (!targets || targets.length === 0) {
        console.error('Failed to connect to Chrome CDP targets.');
        chromeProc.kill();
        process.exit(1);
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

    // Ensure mock user and address in localStorage
    await send('Runtime.evaluate', {
        expression: `(() => {
            const mockUser = {
                id: 'usr_test_desktop_laptop',
                name: 'Nivas Naidu',
                email: 'nivasnaidu07@gmail.com',
                phone: '9876543210',
                room: '925',
                block: 'Block B'
            };
            window.localStorage.setItem('lpuquick_user', JSON.stringify(mockUser));
            window.localStorage.setItem('lpuquick_room', '925');
            window.localStorage.setItem('lpuquick_block', 'Block B');
            window.localStorage.setItem('lpuquick_phone', '9876543210');
            window.localStorage.setItem('lpuquick_address_configured', 'true');
        })()`
    });

    // Add 1 item to cart
    await send('Runtime.evaluate', {
        expression: `(async () => {
            if (window.api && window.api.addToCart) {
                await window.api.addToCart('usr_test_desktop_laptop', 'prod_a39158cc', 1);
            }
        })()`,
        awaitPromise: true
    });

    // Navigate to checkout
    await send('Page.navigate', { url: 'http://localhost:3000/#/checkout' });
    await new Promise(r => setTimeout(r, 1500));

    // Scroll slider into center view
    await send('Runtime.evaluate', {
        expression: `(() => {
            const track = document.getElementById('pay-slider-track');
            if (track) {
                track.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // Inspect slider geometry
    const geom = await send('Runtime.evaluate', {
        expression: `(() => {
            const thumb = document.getElementById('pay-slider-thumb');
            const track = document.getElementById('pay-slider-track');
            const th = thumb.getBoundingClientRect();
            const tr = track.getBoundingClientRect();
            return {
                thumb: { x: Math.round(th.x + th.width / 2), y: Math.round(th.y + th.height / 2) },
                track: { left: Math.round(tr.left), right: Math.round(tr.right), y: Math.round(tr.y + tr.height / 2), width: Math.round(tr.width) }
            };
        })()`,
        returnByValue: true
    });

    console.log('Target coords:', geom.result.value);
    const startPos = geom.result.value.thumb;
    const endX = geom.result.value.track.right - 25;
    const dragY = startPos.y;

    console.log(`Dragging from (${startPos.x}, ${dragY}) to (${endX}, ${dragY})...`);

    // Mouse Press on Thumb
    await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: startPos.x,
        y: dragY,
        button: 'left',
        clickCount: 1
    });

    // Move in increments simulating laptop mouse/trackpad swipe
    const steps = 15;
    const stepSize = (endX - startPos.x) / steps;
    for (let i = 1; i <= steps; i++) {
        const curX = Math.round(startPos.x + stepSize * i);
        await send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: curX,
            y: dragY,
            button: 'left'
        });
        await new Promise(r => setTimeout(r, 25));
    }

    // Release mouse
    await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: endX,
        y: dragY,
        button: 'left'
    });

    console.log('Mouse released. Waiting for order confirmation response...');
    await new Promise(r => setTimeout(r, 3500));

    const finalState = await send('Runtime.evaluate', {
        expression: `(() => {
            return {
                orderSuccessHidden: document.getElementById('order-success-section')?.classList.contains('hidden'),
                orderId: document.getElementById('success-order-id')?.textContent,
                orderTotal: document.getElementById('success-order-total')?.textContent,
                sliderText: document.getElementById('pay-slider-text')?.textContent,
                errorVisible: !document.getElementById('checkout-error-banner')?.classList.contains('hidden'),
                errorText: document.getElementById('checkout-error-msg')?.textContent
            };
        })()`,
        returnByValue: true
    });
    console.log('Final state after slider swipe:', finalState.result.value);

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(__dirname, '..', 'admin_and_slider_verified.png');
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot saved to:', outPath);

    ws.close();
    chromeProc.kill();
    process.exit(0);
}

testDrag().catch(err => {
    console.error(err);
    process.exit(1);
});

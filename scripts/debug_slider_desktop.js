const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9561;

async function test() {
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,800',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
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
    await send('Page.navigate', { url: 'http://localhost:3000/#/cart' });
    await new Promise(r => setTimeout(r, 1200));

    // Ensure mock user and an item in cart
    await send('Runtime.evaluate', {
        expression: `(() => {
            const mockUser = {
                id: 'usr_test_desktop',
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
                await window.api.addToCart('usr_test_desktop', 'prod_a39158cc', 1);
            }
        })()`,
        awaitPromise: true
    });

    // Navigate to checkout
    await send('Page.navigate', { url: 'http://localhost:3000/#/checkout' });
    await new Promise(r => setTimeout(r, 1500));

    // Check slider elements and coordinates
    const info = await send('Runtime.evaluate', {
        expression: `(() => {
            const track = document.getElementById('pay-slider-track');
            const thumb = document.getElementById('pay-slider-thumb');
            if (!track || !thumb) return { error: 'Slider elements not found' };
            const tRect = track.getBoundingClientRect();
            const thRect = thumb.getBoundingClientRect();
            return {
                track: { x: tRect.x, y: tRect.y, width: tRect.width, height: tRect.height },
                thumb: { x: thRect.x, y: thRect.y, width: thRect.width, height: thRect.height },
                offsetLeft: thumb.offsetLeft,
                computedStyleLeft: window.getComputedStyle(thumb).left,
                transform: window.getComputedStyle(thumb).transform
            };
        })()`,
        returnByValue: true
    });
    console.log('Slider geometry:', JSON.stringify(info.result.value, null, 2));

    ws.close();
    chromeProc.kill();
    process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});

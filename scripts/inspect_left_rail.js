const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;

async function inspect() {
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,1000',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
    ]);

    // Wait for CDP
    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        console.error('CDP failed');
        chromeProc.kill();
        process.exit(1);
    }

    const target = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
    });

    let msgId = 1;
    const callbacks = new Map();
    ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
        }
    });

    function send(method, params = {}) {
        const id = msgId++;
        return new Promise((resolve, reject) => {
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('CSS.enable');

    // Wait 2 seconds for app to load products
    await new Promise(r => setTimeout(r, 2500));

    // Scroll down to shop catalog section so it is visible in view
    await send('Runtime.evaluate', {
        expression: `(() => {
            const el = document.getElementById('shop-catalog-section');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    // Inspect elements
    const info = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const nav = document.getElementById('vertical-category-rail');
            const catalogSec = document.getElementById('shop-catalog-section');
            const productsGrid = document.getElementById('home-main-products-grid');
            const asideRect = aside ? aside.getBoundingClientRect() : null;
            const navRect = nav ? nav.getBoundingClientRect() : null;
            const gridRect = productsGrid ? productsGrid.getBoundingClientRect() : null;
            const asideStyle = aside ? window.getComputedStyle(aside) : null;
            const navStyle = nav ? window.getComputedStyle(nav) : null;

            return {
                asideClasses: aside ? aside.className : null,
                asideRect,
                asideBg: asideStyle ? asideStyle.backgroundColor : null,
                asideBorder: asideStyle ? asideStyle.border : null,
                asideRadius: asideStyle ? asideStyle.borderRadius : null,
                navClasses: nav ? nav.className : null,
                navRect,
                navBg: navStyle ? navStyle.backgroundColor : null,
                navBorder: navStyle ? navStyle.border : null,
                navRadius: navStyle ? navStyle.borderRadius : null,
                gridRect,
                parentOfAsideClasses: aside && aside.parentElement ? aside.parentElement.className : null,
                parentOfAsideStyle: aside && aside.parentElement ? aside.parentElement.getAttribute('style') : null
            };
        })()`,
        returnByValue: true
    });

    console.log('DOM Info:', JSON.stringify(info.result.value, null, 2));

    // Screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(__dirname, '..', 'left_rail_debug.png');
    fs.writeFileSync(outPath, buffer);
    console.log('Screenshot saved to', outPath);

    ws.close();
    chromeProc.kill();
}

inspect().catch(console.error);

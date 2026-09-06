const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9345;

async function verify() {
    const cp = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,850',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
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
        const id = msgId++;
        return new Promise((resolve, reject) => {
            const handler = (raw) => {
                const d = JSON.parse(raw);
                if (d.id === id) {
                    ws.off('message', handler);
                    if (d.error) reject(d.error);
                    else resolve(d.result);
                }
            };
            ws.on('message', handler);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // Wait for page to render
    await send('Runtime.evaluate', {
        awaitPromise: true,
        expression: `new Promise(resolve => {
            const check = () => {
                if (document.getElementById('vertical-category-rail') && document.querySelectorAll('.product-card-item').length > 5) {
                    resolve();
                } else {
                    setTimeout(check, 250);
                }
            };
            check();
        })`
    });

    // Dark Mode
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Measure live geometry
    const measurements = await send('Runtime.evaluate', {
        expression: `(() => {
            const container = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const nav = document.getElementById('vertical-category-rail');
            const cRect = container.getBoundingClientRect();
            const gRect = grid.getBoundingClientRect();

            return {
                containerHeight: container.offsetHeight,
                gridHeight: grid.offsetHeight,
                containerStyleHeight: window.getComputedStyle(container).height,
                parentAlignItems: window.getComputedStyle(container.parentElement).alignItems,
                containerBorder: window.getComputedStyle(container).borderRight,
                containerBg: window.getComputedStyle(container).backgroundColor,
                navBorderRadius: window.getComputedStyle(nav).borderRadius,
                navBg: window.getComputedStyle(nav).backgroundColor,
                navBorder: window.getComputedStyle(nav).border
            };
        })()`,
        returnByValue: true
    });

    console.log('Live Measurements:', measurements.result.value);

    // Scroll to catalog start
    await send('Runtime.evaluate', {
        expression: `document.getElementById('shop-catalog-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    const topPath = path.join('C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11', 'left_rail_full_top.png');
    fs.writeFileSync(topPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved top screenshot to', topPath);

    // Scroll down halfway through products
    await send('Runtime.evaluate', {
        expression: `window.scrollBy({ top: 800, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    const midPath = path.join('C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11', 'left_rail_full_middle.png');
    fs.writeFileSync(midPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved middle screenshot to', midPath);

    // Scroll down to the end of products
    await send('Runtime.evaluate', {
        expression: `document.getElementById('home-main-products-grid').scrollIntoView({ behavior: 'instant', block: 'end' });`
    });
    await new Promise(r => setTimeout(r, 600));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    const botPath = path.join('C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11', 'left_rail_full_bottom.png');
    fs.writeFileSync(botPath, Buffer.from(shot.data, 'base64'));
    console.log('Saved bottom screenshot to', botPath);

    ws.close();
    cp.kill();
}

verify().catch(console.error);

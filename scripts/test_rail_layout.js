const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9337;

async function testLayout() {
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,900',
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

    await new Promise(r => setTimeout(r, 2000));

    // Turn on Dark Mode
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        })()`
    });

    // Apply test styles to simulate full-length rail
    await send('Runtime.evaluate', {
        expression: `(() => {
            const style = document.createElement('style');
            style.id = 'test-rail-fix';
            style.innerHTML = \`
                /* Fix generic nav issue */
                nav:not(.liquid-dock-pill) {
                    border-radius: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }

                #shop-catalog-section > div {
                    align-items: stretch !important;
                }

                #category-rail-container {
                    align-self: stretch !important;
                    height: 100% !important;
                    min-height: 100% !important;
                    position: relative !important;
                    top: auto !important;
                    background: rgba(15, 23, 42, 0.6) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 1.5rem !important;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
                    padding: 0.5rem 0.25rem !important;
                    display: flex !important;
                    flex-direction: column !important;
                }

                #vertical-category-rail {
                    position: sticky !important;
                    top: 5rem !important;
                    max-height: calc(100vh - 6rem) !important;
                    overflow-y: auto !important;
                    width: 100% !important;
                }
            \`;
            document.head.appendChild(style);
        })()`
    });

    await new Promise(r => setTimeout(r, 1000));

    // Scroll to catalog section top
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.getElementById('shop-catalog-section').scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'test_rail_top.png'), Buffer.from(shot.data, 'base64'));

    // Scroll halfway down products
    await send('Runtime.evaluate', {
        expression: `(() => {
            window.scrollBy({ top: 600, behavior: 'instant' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'test_rail_middle.png'), Buffer.from(shot.data, 'base64'));

    // Scroll to bottom of products
    await send('Runtime.evaluate', {
        expression: `(() => {
            const grid = document.getElementById('home-main-products-grid');
            if (grid) grid.scrollIntoView({ behavior: 'instant', block: 'end' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'test_rail_bottom.png'), Buffer.from(shot.data, 'base64'));

    // Check dimensions
    const res = await send('Runtime.evaluate', {
        expression: `(() => {
            const container = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const catalog = document.getElementById('shop-catalog-section');
            return {
                containerHeight: container?.offsetHeight,
                gridHeight: grid?.offsetHeight,
                catalogHeight: catalog?.offsetHeight,
                containerBottom: container?.getBoundingClientRect().bottom,
                gridBottom: grid?.getBoundingClientRect().bottom
            };
        })()`,
        returnByValue: true
    });

    console.log('Result dimensions:', res.result.value);

    ws.close();
    chromeProc.kill();
}

testLayout().catch(console.error);

const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9339;

async function testFullScroll() {
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

    // Turn on Dark Mode like in user screenshot
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        })()`
    });

    // Apply the full-height stretching setup
    await send('Runtime.evaluate', {
        expression: `(() => {
            // Fix generic nav CSS
            const fixStyle = document.createElement('style');
            fixStyle.innerHTML = \`
                nav:not(.liquid-dock-pill) {
                    border-radius: 0 !important;
                    background: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                }
            \`;
            document.head.appendChild(fixStyle);

            const container = document.getElementById('category-rail-container');
            const parent = container.parentElement;

            parent.classList.remove('items-start');
            parent.classList.add('items-stretch');

            // Style container as a sleek, continuous left rail column
            container.classList.remove('sticky', 'top-16', 'md:top-20');
            container.classList.add('self-stretch', 'flex', 'flex-col');
            container.style.background = 'rgba(15, 23, 42, 0.45)';
            container.style.border = '1px solid rgba(255, 255, 255, 0.08)';
            container.style.borderRadius = '1.5rem';
            container.style.backdropFilter = 'blur(16px)';
            container.style.webkitBackdropFilter = 'blur(16px)';
            container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.25)';
            container.style.padding = '0.5rem 0.25rem';

            // Nav is sticky inside container
            const nav = document.getElementById('vertical-category-rail');
            nav.classList.add('sticky', 'top-20');
            nav.style.position = 'sticky';
            nav.style.top = '5rem';
            nav.style.maxHeight = 'calc(100vh - 6rem)';
            nav.style.overflowY = 'auto';
            nav.style.width = '100%';
        })()`
    });

    await new Promise(r => setTimeout(r, 500));

    // 1. Scroll to top of catalog
    await send('Runtime.evaluate', {
        expression: `document.getElementById('shop-catalog-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
    });
    await new Promise(r => setTimeout(r, 500));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'rail_scroll_top.png'), Buffer.from(shot.data, 'base64'));

    // 2. Scroll middle (down 1200px)
    await send('Runtime.evaluate', {
        expression: `window.scrollBy({ top: 1200, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'rail_scroll_middle.png'), Buffer.from(shot.data, 'base64'));

    // 3. Scroll to bottom of products grid
    await send('Runtime.evaluate', {
        expression: `(() => {
            const grid = document.getElementById('home-main-products-grid');
            grid.scrollIntoView({ behavior: 'instant', block: 'end' });
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'rail_scroll_bottom.png'), Buffer.from(shot.data, 'base64'));

    const state = await send('Runtime.evaluate', {
        expression: `(() => {
            const container = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const nav = document.getElementById('vertical-category-rail');
            const cRect = container.getBoundingClientRect();
            const gRect = grid.getBoundingClientRect();
            const nRect = nav.getBoundingClientRect();

            return {
                containerHeight: container.offsetHeight,
                gridHeight: grid.offsetHeight,
                containerBottomOffsetFromGridBottom: Math.abs(cRect.bottom - gRect.bottom),
                navTop: nRect.top,
                navHeight: nRect.height
            };
        })()`,
        returnByValue: true
    });

    console.log('Scroll State:', state.result.value);

    ws.close();
    chromeProc.kill();
}

testFullScroll().catch(console.error);

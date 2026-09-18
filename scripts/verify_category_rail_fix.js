const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9555;

async function runVerification() {
    console.log('1. Launching Headless Chrome for Category Rail Verification...');
    const cp = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,1000',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
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

    if (!targets || targets.length === 0) {
        cp.kill();
        throw new Error('Could not connect to Chrome CDP');
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
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    try {
        await send('Page.enable');
        await send('DOM.enable');
        await send('Runtime.enable');

        console.log('2. Waiting for catalog page to render...');
        await new Promise(r => setTimeout(r, 3000));

        // Enable Dark Mode (as in user screenshot)
        await send('Runtime.evaluate', {
            expression: `(() => {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            })()`
        });

        // Scroll to catalog split row
        await send('Runtime.evaluate', {
            expression: `(() => {
                const el = document.getElementById('shop-catalog-split-row');
                if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
            })()`
        });
        await new Promise(r => setTimeout(r, 1000));

        // Measure metrics at top of catalog
        const topMetrics = await send('Runtime.evaluate', {
            expression: `(() => {
                const aside = document.getElementById('category-rail-container');
                const splitRow = document.getElementById('shop-catalog-split-row');
                const grid = document.getElementById('home-main-products-grid');
                const firstCard = grid ? grid.querySelector('.product-card-item') : null;

                const aR = aside ? aside.getBoundingClientRect() : null;
                const cR = firstCard ? firstCard.getBoundingClientRect() : null;
                const sR = splitRow ? splitRow.getBoundingClientRect() : null;

                return {
                    asideWidth: aR ? Math.round(aR.width) : null,
                    asideRight: aR ? Math.round(aR.right) : null,
                    cardLeft: cR ? Math.round(cR.left) : null,
                    gapBetweenRailAndCard: (cR && aR) ? Math.round(cR.left - aR.right) : null,
                    computedSplitRowGap: splitRow ? window.getComputedStyle(splitRow).gap : null,
                    asidePosition: aside ? window.getComputedStyle(aside).position : null,
                    asideTop: aR ? Math.round(aR.top) : null
                };
            })()`,
            returnByValue: true
        });

        console.log('\n--- Metrics at Top of Catalog ---');
        console.log(JSON.stringify(topMetrics.result.value, null, 2));

        const artifactDir = 'C:/Users/Digvi/.gemini/antigravity-ide/brain/f44538b1-8f9c-4ec9-b80d-e7de701fec79';
        const shotTopPath = path.join(artifactDir, 'category_rail_top_verified.png');
        const shotTop = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(shotTopPath, Buffer.from(shotTop.data, 'base64'));
        console.log('Saved top screenshot to:', shotTopPath);

        // 3. Scroll down 1800px into products
        console.log('\n3. Scrolling down 1800px into products catalog...');
        await send('Runtime.evaluate', {
            expression: `window.scrollBy(0, 1800);`
        });
        await new Promise(r => setTimeout(r, 1000));

        const scrolledMetrics = await send('Runtime.evaluate', {
            expression: `(() => {
                const aside = document.getElementById('category-rail-container');
                const grid = document.getElementById('home-main-products-grid');
                const visibleCards = Array.from(grid.querySelectorAll('.product-card-item')).filter(c => {
                    const r = c.getBoundingClientRect();
                    return r.top >= 0 && r.top < window.innerHeight;
                });
                const card = visibleCards[0];

                const aR = aside ? aside.getBoundingClientRect() : null;
                const cR = card ? card.getBoundingClientRect() : null;

                return {
                    scrollY: Math.round(window.scrollY),
                    asideTop: aR ? Math.round(aR.top) : null,
                    asideBottom: aR ? Math.round(aR.bottom) : null,
                    asideIsVisible: aR ? (aR.bottom > 0 && aR.top < window.innerHeight) : false,
                    asideIsSticky: aR ? (aR.top >= 50 && aR.top <= 95) : false,
                    cardLeft: cR ? Math.round(cR.left) : null,
                    asideRight: aR ? Math.round(aR.right) : null,
                    gapBetweenRailAndCard: (cR && aR) ? Math.round(cR.left - aR.right) : null
                };
            })()`,
            returnByValue: true
        });

        console.log('\n--- Metrics When Scrolled 1800px ---');
        console.log(JSON.stringify(scrolledMetrics.result.value, null, 2));

        const shotScrolledPath = path.join(artifactDir, 'category_rail_scrolled_sticky_verified.png');
        const shotScrolled = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(shotScrolledPath, Buffer.from(shotScrolled.data, 'base64'));
        console.log('Saved scrolled screenshot to:', shotScrolledPath);

        console.log('\nAll tests and screenshots completed successfully!');
    } finally {
        ws.close();
        cp.kill();
    }
}

runVerification().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

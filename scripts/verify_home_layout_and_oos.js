const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9568;
const tempUserDataDir = path.join(os.tmpdir(), 'chrome_cdp_verify_' + Date.now());

async function run() {
    console.log('1. Starting isolated Chrome CDP session (Mobile Viewport: 390x844)...');
    const cp = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${tempUserDataDir}`,
        '--window-size=390,844',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        cp.kill();
        throw new Error('Chrome remote debugging did not respond');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
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

        // Emulate mobile device metrics
        await send('Emulation.setDeviceMetricsOverride', {
            width: 390,
            height: 844,
            deviceScaleFactor: 2,
            mobile: true
        });

        console.log('2. Navigating to http://127.0.0.1:3000/#/ ...');
        await send('Page.navigate', { url: 'http://127.0.0.1:3000/#/' });

        // Wait until products and both grids render
        let ready = false;
        for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 300));
            const check = await send('Runtime.evaluate', {
                expression: `(() => {
                    const rail = document.getElementById('category-rail-container');
                    const mainGrid = document.getElementById('home-main-products-grid');
                    const remGrid = document.getElementById('home-remaining-products-grid');
                    const mainCards = mainGrid ? mainGrid.querySelectorAll('.product-card-item').length : 0;
                    const remCards = remGrid ? remGrid.querySelectorAll('.product-card-item').length : 0;
                    return {
                        hasRail: Boolean(rail),
                        hasMainGrid: Boolean(mainGrid),
                        hasRemGrid: Boolean(remGrid),
                        mainCards,
                        remCards
                    };
                })()`,
                returnByValue: true
            });
            const v = check.result?.value;
            if (v && v.mainCards > 0 && v.remCards > 0) {
                console.log('Page ready! Beside-rail cards:', v.mainCards, '| Remaining full-width cards:', v.remCards);
                ready = true;
                break;
            }
        }

        if (!ready) {
            throw new Error('Page did not load product grids in time');
        }

        // Set dark mode for visual parity with user's phone screenshot
        await send('Runtime.evaluate', {
            expression: `document.documentElement.classList.add('dark'); document.body.classList.add('dark');`
        });

        // 3. Inspect Grid Dimensions & verify zero empty space below rail
        console.log('\n3. Measuring layout dimensions on mobile...');
        const layoutMetrics = await send('Runtime.evaluate', {
            expression: `(() => {
                const rail = document.getElementById('category-rail-container');
                const mainGrid = document.getElementById('home-main-products-grid');
                const remGrid = document.getElementById('home-remaining-products-grid');
                const firstRemCard = remGrid ? remGrid.querySelector('.product-card-item') : null;
                const secondRemCard = remGrid ? remGrid.querySelectorAll('.product-card-item')[1] : null;

                const railRect = rail ? rail.getBoundingClientRect() : null;
                const remGridRect = remGrid ? remGrid.getBoundingClientRect() : null;
                const firstRemCardRect = firstRemCard ? firstRemCard.getBoundingClientRect() : null;
                const secondRemCardRect = secondRemCard ? secondRemCard.getBoundingClientRect() : null;

                return {
                    railWidth: railRect ? Math.round(railRect.width) : null,
                    railPosition: rail ? window.getComputedStyle(rail).position : null,
                    remGridWidth: remGridRect ? Math.round(remGridRect.width) : null,
                    remGridLeft: remGridRect ? Math.round(remGridRect.left) : null,
                    firstCardWidth: firstRemCardRect ? Math.round(firstRemCardRect.width) : null,
                    firstCardLeft: firstRemCardRect ? Math.round(firstRemCardRect.left) : null,
                    secondCardLeft: secondRemCardRect ? Math.round(secondRemCardRect.left) : null,
                    windowWidth: window.innerWidth
                };
            })()`,
            returnByValue: true
        });

        const m = layoutMetrics.result.value;
        console.log('Layout Metrics:', JSON.stringify(m, null, 2));

        // Assert that full-width remaining grid spans almost entire mobile window (~370px out of 390px)
        if (m.remGridWidth < 350) {
            throw new Error(`Remaining grid width (${m.remGridWidth}px) is too narrow! Should span full mobile width.`);
        }
        if (m.firstCardLeft > 30) {
            throw new Error(`First remaining card left offset (${m.firstCardLeft}px) shows empty space on left! Should be ~10px-16px.`);
        }
        console.log('SUCCESS: Full-width remaining grid spans', m.remGridWidth, 'px with no empty space on left!');

        // 4. Verify Out-of-Stock Ordering (In-Stock First, Out-of-Stock Last)
        console.log('\n4. Verifying Out-of-Stock ordering across sort options...');

        async function verifyOOSOrdering(sortName) {
            const res = await send('Runtime.evaluate', {
                expression: `(() => {
                    const allCards = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item, #home-remaining-products-grid .product-card-item'))
                        .filter(c => !c.classList.contains('hidden'));
                    
                    let sawOutOfStock = false;
                    let violation = null;

                    for (let i = 0; i < allCards.length; i++) {
                        const isOOS = allCards[i].dataset.outOfStock === 'true';
                        if (isOOS) {
                            sawOutOfStock = true;
                        } else if (sawOutOfStock) {
                            // Violation: in-stock item appeared after out-of-stock item!
                            const name = allCards[i].querySelector('h3')?.textContent?.trim();
                            violation = { index: i, name, prevWasOOS: true };
                            break;
                        }
                    }

                    return {
                        totalVisible: allCards.length,
                        hasOOS: sawOutOfStock,
                        violation
                    };
                })()`,
                returnByValue: true
            });

            const v = res.result.value;
            if (v.violation) {
                throw new Error(`OOS ordering violated under ${sortName}: In-stock item "${v.violation.name}" appeared at index ${v.violation.index} after out-of-stock items!`);
            }
            console.log(`PASS [${sortName}]: ${v.totalVisible} items ordered correctly with Out-of-Stock strictly last.`);
        }

        // Test default relevance
        await verifyOOSOrdering('relevance (default)');

        // Test price_asc
        await send('Runtime.evaluate', {
            expression: `(() => {
                const sel = document.getElementById('catalog-sort-select');
                if (sel) { sel.value = 'price_asc'; sel.dispatchEvent(new Event('change')); }
            })()`
        });
        await new Promise(r => setTimeout(r, 400));
        await verifyOOSOrdering('price_asc');

        // Test price_desc
        await send('Runtime.evaluate', {
            expression: `(() => {
                const sel = document.getElementById('catalog-sort-select');
                if (sel) { sel.value = 'price_desc'; sel.dispatchEvent(new Event('change')); }
            })()`
        });
        await new Promise(r => setTimeout(r, 400));
        await verifyOOSOrdering('price_desc');

        // Test name
        await send('Runtime.evaluate', {
            expression: `(() => {
                const sel = document.getElementById('catalog-sort-select');
                if (sel) { sel.value = 'name'; sel.dispatchEvent(new Event('change')); }
            })()`
        });
        await new Promise(r => setTimeout(r, 400));
        await verifyOOSOrdering('name');

        // Reset to relevance
        await send('Runtime.evaluate', {
            expression: `(() => {
                const sel = document.getElementById('catalog-sort-select');
                if (sel) { sel.value = 'relevance'; sel.dispatchEvent(new Event('change')); }
            })()`
        });
        await new Promise(r => setTimeout(r, 400));

        // 5. Capture mobile screenshots for visual validation
        const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\53bd2cac-411c-493f-91d4-b604f04fafff';

        // Top of catalog screenshot
        await send('Runtime.evaluate', {
            expression: `document.getElementById('shop-catalog-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
        });
        await new Promise(r => setTimeout(r, 400));
        const shotTop = await send('Page.captureScreenshot', { format: 'png' });
        const shotTopPath = path.join(artifactDir, 'verified_home_rail_top.png');
        fs.writeFileSync(shotTopPath, Buffer.from(shotTop.data, 'base64'));
        console.log('\nSaved top screenshot to:', shotTopPath);

        // Remaining full-width products screenshot (matching Image 2)
        await send('Runtime.evaluate', {
            expression: `document.getElementById('home-remaining-products-section').scrollIntoView({ behavior: 'instant', block: 'start' });`
        });
        await new Promise(r => setTimeout(r, 400));
        const shotRemaining = await send('Page.captureScreenshot', { format: 'png' });
        const shotRemainingPath = path.join(artifactDir, 'verified_home_remaining_fullwidth.png');
        fs.writeFileSync(shotRemainingPath, Buffer.from(shotRemaining.data, 'base64'));
        console.log('Saved remaining full-width screenshot to:', shotRemainingPath);

        console.log('\nALL TESTS PASSED SUCCESSFULLY!');
    } finally {
        ws.close();
        cp.kill();
    }
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9460;

async function run() {
    console.log('🚀 Launching Chrome CDP for Client Categories Mobile View Audit...');
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=412,915',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            const targets = await res.json();
            const target = targets.find(t => t.type === 'page') || targets[0];
            if (target) {
                const ws = new WebSocket(target.webSocketDebuggerUrl);
                await new Promise(resolve => ws.on('open', resolve));

                let id = 1;
                function send(method, params = {}) {
                    return new Promise((resolve, reject) => {
                        const curId = id++;
                        const onMsg = (data) => {
                            const parsed = JSON.parse(data);
                            if (parsed.id === curId) {
                                ws.off('message', onMsg);
                                if (parsed.error) reject(parsed.error);
                                else resolve(parsed.result);
                            }
                        };
                        ws.on('message', onMsg);
                        ws.send(JSON.stringify({ id: curId, method, params }));
                    });
                }

                await send('Page.enable');
                await send('Runtime.enable');
                await send('Network.enable');

                await send('Emulation.setDeviceMetricsOverride', {
                    width: 412,
                    height: 915,
                    deviceScaleFactor: 2.5,
                    mobile: true
                });

                await send('Page.addScriptToEvaluateOnNewDocument', {
                    source: `
                        localStorage.setItem('lpuquick_user', JSON.stringify({ id: 'test_student', name: 'Nivas Student' }));
                        localStorage.setItem('lpuquick_room', '304');
                        localStorage.setItem('lpuquick_phone', '9876543210');
                        localStorage.setItem('lpuquick_address_configured', 'true');
                        localStorage.setItem('lpuquick_theme', 'dark');
                    `
                });

                // Navigate directly to the client Categories page
                await send('Page.navigate', { url: 'http://localhost:3000/#/categories' });

                // Wait for the categories rail to mount
                for (let w = 0; w < 40; w++) {
                    const check = await send('Runtime.evaluate', {
                        expression: `Boolean(document.querySelector('#category-sidebar-rail .category-rail-item[data-cat-id="biscuits"]'))`
                    });
                    if (check.result?.value) break;
                    await new Promise(r => setTimeout(r, 250));
                }

                // Await font ready and image settling
                await send('Runtime.evaluate', {
                    awaitPromise: true,
                    expression: `document.fonts.ready`
                });
                await new Promise(r => setTimeout(r, 2500));

                // 1. Audit Dark Mode State
                const auditDark = await send('Runtime.evaluate', {
                    expression: `
                        (() => {
                            const rail = document.getElementById('category-sidebar-rail');
                            const railItems = document.querySelectorAll('#category-sidebar-rail .category-rail-item');
                            const activeBtn = document.querySelector('#category-sidebar-rail .category-rail-item.active');
                            const indicator = activeBtn ? activeBtn.querySelector('.category-rail-indicator') : null;
                            const promoBanner = document.getElementById('cat-promo-banner');
                            const filtersBar = document.getElementById('cat-filters-bar');
                            const products = document.querySelectorAll('#cat-products-grid .product-card-item');
                            const comingSoonItems = document.querySelectorAll('#category-sidebar-rail .category-rail-item.coming-soon');

                            return {
                                url: document.location.href,
                                railExists: Boolean(rail),
                                railItemCount: railItems.length,
                                activeCatId: activeBtn ? activeBtn.dataset.catId : null,
                                activeCatName: activeBtn ? activeBtn.dataset.name : null,
                                hasIndicator: Boolean(indicator),
                                indicatorDisplay: indicator ? getComputedStyle(indicator).display : null,
                                comingSoonCount: comingSoonItems.length,
                                hasPromoBanner: Boolean(promoBanner),
                                hasFiltersBar: Boolean(filtersBar),
                                productsCount: products.length
                            };
                        })()
                    `,
                    returnByValue: true
                });

                console.log('--- MOBILE CATEGORIES AUDIT (DARK MODE) ---');
                console.log(JSON.stringify(auditDark.result.value, null, 2));

                // Capture Dark Mode Screenshot
                const darkScreenshot = await send('Page.captureScreenshot', { format: 'png' });
                const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';
                fs.writeFileSync(path.join(artifactDir, 'category_mobile_blinkit_view.png'), Buffer.from(darkScreenshot.data, 'base64'));
                fs.writeFileSync(path.join(__dirname, 'category_mobile_page_dark.png'), Buffer.from(darkScreenshot.data, 'base64'));
                console.log('✓ Captured category_mobile_blinkit_view.png (Dark Mode)');

                // 2. Test Blocked / Coming Soon Category Click (Drinks & Juices)
                console.log('Testing Drinks & Juices (Blocked / Coming Soon category)...');
                const testBlocked = await send('Runtime.evaluate', {
                    expression: `
                        (() => {
                            const drinksBtn = document.querySelector('.category-rail-item[data-cat-id="drinks"]');
                            if (drinksBtn) drinksBtn.click();
                            const liveHidden = document.getElementById('live-cat-container')?.classList.contains('hidden');
                            const blockedShown = !document.getElementById('blocked-cat-container')?.classList.contains('hidden');
                            const title = document.getElementById('blocked-cat-title')?.textContent;
                            return { liveHidden, blockedShown, title };
                        })()
                    `,
                    returnByValue: true
                });
                console.log('Blocked category click result:', testBlocked.result.value);

                // 3. Switch back to Cookies / Biscuits
                await send('Runtime.evaluate', {
                    expression: `
                        const btn = document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
                        if (btn) btn.click();
                    `
                });
                await new Promise(r => setTimeout(r, 600));

                // 4. Toggle Light Mode & Glassmorphism
                console.log('Toggling to Light Mode & Glassmorphism...');
                await send('Runtime.evaluate', {
                    expression: `
                        document.documentElement.classList.remove('dark');
                        document.body.classList.remove('dark');
                        localStorage.setItem('lpuquick_theme', 'light');
                    `
                });
                await new Promise(r => setTimeout(r, 1500));

                const lightScreenshot = await send('Page.captureScreenshot', { format: 'png' });
                fs.writeFileSync(path.join(artifactDir, 'light_screen_glassmorphism.png'), Buffer.from(lightScreenshot.data, 'base64'));
                fs.writeFileSync(path.join(__dirname, 'category_mobile_page_light.png'), Buffer.from(lightScreenshot.data, 'base64'));
                console.log('✓ Captured light_screen_glassmorphism.png (Light Mode Glassmorphism)');

                chromeProc.kill();
                process.exit(0);
            }
        } catch(err) {
            // retry
        }
    }
    console.error('Timed out connecting to Chrome');
    chromeProc.kill();
    process.exit(1);
}

run();

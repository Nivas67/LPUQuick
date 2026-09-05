const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9455;

async function run() {
    console.log('🚀 Launching Chrome CDP for Mobile Category Screen Audit...');
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
                ws.on('message', (data) => {
                    try {
                        const m = JSON.parse(data);
                        if (m.method === 'Network.loadingFailed') {
                            console.log('CDP Network Failure:', m.params.errorText, m.params.type);
                        }
                    } catch(e) {}
                });
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
                await send('Page.navigate', { url: 'http://localhost:3000/#/' });
                
                // Wait for vertical category rail to mount in DOM
                for (let w = 0; w < 40; w++) {
                    const check = await send('Runtime.evaluate', {
                        expression: `Boolean(document.querySelector('.category-rail-item[data-cat-id="biscuits"]'))`
                    });
                    if (check.result?.value) break;
                    await new Promise(r => setTimeout(r, 250));
                }

                // Click Biscuits category to show the exact screen matching the reference
                await send('Runtime.evaluate', {
                    expression: `
                        const biscuitBtn = document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
                        if (biscuitBtn) biscuitBtn.click();
                        const catalog = document.getElementById('shop-catalog-section');
                        if (catalog) catalog.scrollIntoView({ behavior: 'instant', block: 'start' });
                    `
                });

                await new Promise(r => setTimeout(r, 1500));

                // Inspect DOM elements
                const audit = await send('Runtime.evaluate', {
                    expression: `
                        (() => {
                            const activeBtn = document.querySelector('.category-rail-item.active');
                            const indicator = activeBtn ? activeBtn.querySelector('.category-rail-indicator') : null;
                            const iconBox = activeBtn ? activeBtn.querySelector('.category-rail-icon-box') : null;
                            const img = activeBtn ? activeBtn.querySelector('.category-rail-img') : null;
                            const promoTitle = document.getElementById('promo-title');
                            const promoBanner = document.getElementById('category-promo-banner');
                            const filterBar = document.getElementById('catalog-filters-bar');
                            const visibleProducts = document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)');

                            return {
                                url: document.location.href,
                                htmlLen: document.body ? document.body.innerHTML.length : 0,
                                railCount: document.querySelectorAll('.category-rail-item').length,
                                activeCatId: activeBtn ? activeBtn.dataset.catId : null,
                                activeCatLabel: activeBtn ? activeBtn.querySelector('.category-rail-label')?.textContent.trim() : null,
                                hasIndicator: Boolean(indicator),
                                indicatorDisplay: indicator ? getComputedStyle(indicator).display : null,
                                indicatorBg: indicator ? getComputedStyle(indicator).backgroundColor : null,
                                imgLoaded: img ? img.naturalWidth > 0 : false,
                                imgSrc: img ? img.src : null,
                                promoTitle: promoTitle ? promoTitle.textContent : null,
                                hasFilterBar: Boolean(filterBar),
                                visibleProductsCount: visibleProducts.length
                            };
                        })()
                    `,
                    returnByValue: true
                });

                console.log('--- MOBILE CATEGORY AUDIT RESULT ---');
                console.log(JSON.stringify(audit.result.value, null, 2));

                const screenshot = await send('Page.captureScreenshot', { format: 'png' });
                const artifactDir = path.join(__dirname, '../../.gemini/antigravity-ide/brain/d5b40e4b-477d-4c15-bf71-c202ca6b4a11');
                const targetPath = fs.existsSync(artifactDir) 
                    ? path.join(artifactDir, 'category_mobile_blinkit_view.png')
                    : path.join(__dirname, 'category_mobile_blinkit_view.png');
                fs.writeFileSync(targetPath, Buffer.from(screenshot.data, 'base64'));
                console.log('✓ Saved category_mobile_blinkit_view.png to:', targetPath);

                chromeProc.kill();
                process.exit(0);
            }
        } catch (err) {
            // retry
        }
    }
    console.error('Timed out connecting to Chrome');
    chromeProc.kill();
    process.exit(1);
}

run();

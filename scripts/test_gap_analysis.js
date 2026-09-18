const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9339;

async function analyze() {
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

    await new Promise(r => setTimeout(r, 2000));

    // Turn on dark mode and inject test CSS
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');

            const style = document.createElement('style');
            style.id = 'sticky-gap-test-style';
            style.innerHTML = \`
                #shop-catalog-split-row {
                    gap: 0.75rem !important;
                }
                @media (max-width: 639px) {
                    #shop-catalog-split-row {
                        gap: 0.5rem !important;
                    }
                }
                #category-rail-container {
                    position: sticky !important;
                    top: 4.25rem !important;
                    align-self: flex-start !important;
                    max-height: calc(100vh - 5rem) !important;
                    overflow-y: auto !important;
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                    width: 80px !important;
                    padding: 0.5rem 0.25rem !important;
                }
                #category-rail-container::-webkit-scrollbar {
                    display: none !important;
                }
                @media (max-width: 639px) {
                    #category-rail-container {
                        width: 70px !important;
                    }
                }
            \`;
            document.head.appendChild(style);
        })()`
    });

    await new Promise(r => setTimeout(r, 400));

    // Scroll into view
    await send('Runtime.evaluate', {
        expression: `document.getElementById('shop-catalog-section').scrollIntoView({ behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 300));

    const checkState = async (label) => {
        const evalRes = await send('Runtime.evaluate', {
            expression: `(() => {
                const aside = document.getElementById('category-rail-container');
                const parent = document.getElementById('shop-catalog-split-row');
                const rightPane = parent ? parent.children[1] : null;
                const grid = document.getElementById('home-main-products-grid');
                const visibleCards = Array.from(grid.querySelectorAll('.product-card-item')).filter(c => {
                    const r = c.getBoundingClientRect();
                    return r.top >= 0 && r.top < window.innerHeight;
                });
                const card = visibleCards[0] || grid.querySelector('.product-card-item');

                const aR = aside.getBoundingClientRect();
                const cR = card ? card.getBoundingClientRect() : null;

                return {
                    scrollY: Math.round(window.scrollY),
                    asideTop: Math.round(aR.top),
                    asideBottom: Math.round(aR.bottom),
                    asideWidth: Math.round(aR.width),
                    asideVisible: aR.bottom > 0 && aR.top < window.innerHeight,
                    asideStickyActive: aR.top <= 80,
                    cardLeft: cR ? Math.round(cR.left) : null,
                    asideRight: Math.round(aR.right),
                    horizontalGap: cR ? Math.round(cR.left - aR.right) : null
                };
            })()`,
            returnByValue: true
        });
        console.log(label + ':', evalRes.result.value);
    };

    await checkState('At Catalog Top');

    await send('Runtime.evaluate', { expression: `window.scrollBy(0, 1500);` });
    await new Promise(r => setTimeout(r, 300));
    await checkState('Scrolled +1500px');

    await send('Runtime.evaluate', { expression: `window.scrollBy(0, 2000);` });
    await new Promise(r => setTimeout(r, 300));
    await checkState('Scrolled +3500px');

    // Take screenshot at +1500px
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 2000);` });
    await new Promise(r => setTimeout(r, 300));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    fs.writeFileSync('C:/Users/Digvi/.gemini/antigravity-ide/brain/f44538b1-8f9c-4ec9-b80d-e7de701fec79/sticky_and_tight_gap_verified.png', buffer);
    console.log('Saved screenshot to sticky_and_tight_gap_verified.png');

    ws.close();
    chromeProc.kill();
}

analyze().catch(console.error);

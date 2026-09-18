const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9346;

async function test() {
    const cp = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,900',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
    ]);

    let targets = null;
    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 1;
    function send(method, params = {}) {
        const id = msgId++;
        return new Promise(resolve => {
            const h = (raw) => {
                const d = JSON.parse(raw);
                if (d.id === id) {
                    ws.off('message', h);
                    resolve(d.result);
                }
            };
            ws.on('message', h);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('DOM.enable');

    await new Promise(r => setTimeout(r, 2500));

    // Dark mode
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        })()`
    });

    // Apply the proposed CSS:
    await send('Runtime.evaluate', {
        expression: `(() => {
            const style = document.createElement('style');
            style.id = 'test-sticky-and-gap-style';
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

    // Scroll to catalog
    await send('Runtime.evaluate', {
        expression: `(() => {
            const el = document.getElementById('shop-catalog-section');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        })()`
    });
    await new Promise(r => setTimeout(r, 300));

    // Check measurements
    const beforeScroll = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const card = grid.querySelector('.product-card-item');
            const aR = aside.getBoundingClientRect();
            const cR = card.getBoundingClientRect();
            return {
                scrollY: window.scrollY,
                asideTop: aR.top,
                asideBottom: aR.bottom,
                asideWidth: aR.width,
                cardLeft: cR.left,
                asideRight: aR.right,
                horizontalGap: cR.left - aR.right
            };
        })()`,
        returnByValue: true
    });
    console.log('Before scroll:', beforeScroll.result.value);

    // Now scroll down 1500px (where previously the rail had ended and left an empty void)
    await send('Runtime.evaluate', {
        expression: `window.scrollBy(0, 1500);`
    });
    await new Promise(r => setTimeout(r, 300));

    const afterScroll1500 = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const visibleCards = Array.from(grid.querySelectorAll('.product-card-item')).filter(c => {
                const r = c.getBoundingClientRect();
                return r.top >= 0 && r.top < window.innerHeight;
            });
            const firstVis = visibleCards[0];
            const aR = aside.getBoundingClientRect();
            const cR = firstVis ? firstVis.getBoundingClientRect() : null;
            return {
                scrollY: window.scrollY,
                asideTop: aR.top,
                asideBottom: aR.bottom,
                asideIsVisible: aR.bottom > 0 && aR.top < window.innerHeight,
                firstVisibleCardTop: cR ? cR.top : null,
                cardLeft: cR ? cR.left : null,
                asideRight: aR.right,
                horizontalGap: cR ? (cR.left - aR.right) : null
            };
        })()`,
        returnByValue: true
    });
    console.log('After scroll 1500px:', afterScroll1500.result.value);

    // Scroll down another 2000px (to 3500px)
    await send('Runtime.evaluate', {
        expression: `window.scrollBy(0, 2000);`
    });
    await new Promise(r => setTimeout(r, 300));

    const afterScroll3500 = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const grid = document.getElementById('home-main-products-grid');
            const visibleCards = Array.from(grid.querySelectorAll('.product-card-item')).filter(c => {
                const r = c.getBoundingClientRect();
                return r.top >= 0 && r.top < window.innerHeight;
            });
            const firstVis = visibleCards[0];
            const aR = aside.getBoundingClientRect();
            const cR = firstVis ? firstVis.getBoundingClientRect() : null;
            return {
                scrollY: window.scrollY,
                asideTop: aR.top,
                asideBottom: aR.bottom,
                asideIsVisible: aR.bottom > 0 && aR.top < window.innerHeight,
                cardLeft: cR ? cR.left : null,
                horizontalGap: cR ? (cR.left - aR.right) : null
            };
        })()`,
        returnByValue: true
    });
    console.log('After scroll 3500px:', afterScroll3500.result.value);

    // Capture screenshot at 1500px scroll to verify visually
    await send('Runtime.evaluate', {
        expression: `window.scrollTo(0, 1500);`
    });
    await new Promise(r => setTimeout(r, 300));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/Digvi/.gemini/antigravity-ide/brain/f44538b1-8f9c-4ec9-b80d-e7de701fec79/sticky_and_tight_gap_scrolled.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved screenshot to sticky_and_tight_gap_scrolled.png');

    ws.close();
    cp.kill();
}

test().catch(console.error);

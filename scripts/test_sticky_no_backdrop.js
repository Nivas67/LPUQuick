const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9340;

async function testSticky() {
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

    // Dark Mode
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        })()`
    });

    // Fix styles:
    // Container stretches to 100% height of products (self-stretch)
    // No backdrop-filter on container so sticky works smoothly
    await send('Runtime.evaluate', {
        expression: `(() => {
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

                #category-rail-container {
                    align-self: stretch !important;
                    height: 100% !important;
                    min-height: 100% !important;
                    background: rgba(15, 23, 42, 0.5) !important;
                    border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
                    border-radius: 1.5rem 0 0 1.5rem !important;
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
            document.head.appendChild(fixStyle);

            const container = document.getElementById('category-rail-container');
            const parent = container.parentElement;
            parent.classList.remove('items-start');
            parent.classList.add('items-stretch');
            container.classList.remove('sticky', 'top-16', 'md:top-20');
        })()`
    });

    await new Promise(r => setTimeout(r, 500));

    // Scroll down 1200px (middle of product catalog)
    await send('Runtime.evaluate', {
        expression: `window.scrollBy({ top: 1200, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 500));

    const check = await send('Runtime.evaluate', {
        expression: `(() => {
            const nav = document.getElementById('vertical-category-rail');
            const container = document.getElementById('category-rail-container');
            const navRect = nav.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            return {
                navTop: navRect.top,
                navBottom: navRect.bottom,
                containerTop: containerRect.top,
                containerBottom: containerRect.bottom,
                containerHeight: container.offsetHeight
            };
        })()`,
        returnByValue: true
    });

    console.log('Middle scroll check:', check.result.value);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(__dirname, '..', 'rail_sticky_verified.png'), Buffer.from(shot.data, 'base64'));

    ws.close();
    chromeProc.kill();
}

testSticky().catch(console.error);

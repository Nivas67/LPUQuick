const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9343;

async function testStickyDebug() {
    const cp = spawn(CHROME_PATH, ['--headless=new', `--remote-debugging-port=${PORT}`, '--window-size=1280,900', 'http://localhost:3000/#/']);
    await new Promise(r => setTimeout(r, 2000));
    const res = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const ws = new WebSocket(res[0].webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 1;
    function send(method, params = {}) {
        const id = msgId++;
        return new Promise((resolve) => {
            const handler = (raw) => {
                const d = JSON.parse(raw);
                if (d.id === id) {
                    ws.off('message', handler);
                    resolve(d.result);
                }
            };
            ws.on('message', handler);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    // Wait for element to exist
    await send('Runtime.evaluate', {
        awaitPromise: true,
        expression: `new Promise(resolve => {
            const check = () => {
                if (document.getElementById('vertical-category-rail')) resolve();
                else setTimeout(check, 200);
            };
            check();
        })`
    });

    // Check why sticky fails
    const result = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const nav = document.getElementById('vertical-category-rail');

            // Find all ancestors of nav and check their overflow, transform, filter, contain, etc.
            const badProps = [];
            let curr = nav.parentElement;
            while (curr && curr !== document.documentElement) {
                const s = window.getComputedStyle(curr);
                const hasOverflow = s.overflow !== 'visible' || s.overflowX !== 'visible' || s.overflowY !== 'visible';
                const hasTransform = s.transform !== 'none';
                const hasFilter = s.filter !== 'none' || s.backdropFilter !== 'none';
                const hasContain = s.contain !== 'none';

                if (hasOverflow || hasTransform || hasFilter || hasContain) {
                    badProps.push({
                        el: curr.tagName + (curr.id ? '#' + curr.id : '') + (curr.className ? '.' + curr.className.split(' ').join('.') : ''),
                        overflow: s.overflow,
                        overflowX: s.overflowX,
                        overflowY: s.overflowY,
                        transform: s.transform,
                        filter: s.filter,
                        backdropFilter: s.backdropFilter,
                        contain: s.contain
                    });
                }
                curr = curr.parentElement;
            }
            return badProps;
        })()`,
        returnByValue: true
    });

    console.log('Ancestors breaking sticky:');
    console.log(JSON.stringify(result.result.value, null, 2));

    ws.close();
    cp.kill();
}

testStickyDebug().catch(console.error);

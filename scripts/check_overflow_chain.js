const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9342;

async function check() {
    const cp = spawn(CHROME_PATH, ['--headless=new', `--remote-debugging-port=${PORT}`, 'http://localhost:3000/#/']);
    await new Promise(r => setTimeout(r, 2000));
    const res = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    const ws = new WebSocket(res[0].webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
            expression: `(() => {
                let el = document.getElementById('category-rail-container');
                const chain = [];
                while (el) {
                    const s = window.getComputedStyle(el);
                    chain.push({
                        tag: el.tagName,
                        id: el.id,
                        overflow: s.overflow,
                        overflowX: s.overflowX,
                        overflowY: s.overflowY,
                        position: s.position
                    });
                    el = el.parentElement;
                }
                return chain;
            })()`,
            returnByValue: true
        }
    }));

    ws.on('message', raw => {
        const d = JSON.parse(raw);
        if (d.id === 1) {
            console.log('Ancestor Chain:');
            console.log(JSON.stringify(d.result.result.value, null, 2));
            cp.kill();
            process.exit(0);
        }
    });
}

check().catch(console.error);

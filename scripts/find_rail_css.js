const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9336;

async function check() {
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,1000',
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

    const rules = await send('Runtime.evaluate', {
        expression: `(() => {
            const el = document.getElementById('vertical-category-rail');
            const matched = [];
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.selectorText && el.matches(rule.selectorText)) {
                            matched.push({ selector: rule.selectorText, css: rule.cssText });
                        }
                    }
                } catch(e) {}
            }
            return {
                inlineStyle: el.getAttribute('style'),
                className: el.className,
                matched
            };
        })()`,
        returnByValue: true
    });

    console.log('Matched CSS rules for #vertical-category-rail:');
    console.log(JSON.stringify(rules.result.value, null, 2));

    ws.close();
    chromeProc.kill();
}

check().catch(console.error);

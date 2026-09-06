const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9338;

async function diagnose() {
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

    const evalResult = await send('Runtime.evaluate', {
        expression: `(() => {
            const container = document.getElementById('category-rail-container');
            const parent = container.parentElement;

            // Remove items-start from parent
            parent.classList.remove('items-start');
            parent.classList.add('items-stretch');
            parent.style.alignItems = 'stretch';

            // Configure container
            container.classList.remove('sticky');
            container.style.alignSelf = 'stretch';
            container.style.height = 'auto';
            container.style.minHeight = '100%';

            // Check heights
            return {
                parentHeight: parent.offsetHeight,
                containerHeight: container.offsetHeight,
                containerComputedHeight: window.getComputedStyle(container).height,
                siblingHeight: parent.children[1].offsetHeight
            };
        })()`,
        returnByValue: true
    });

    console.log('Diagnosis:', evalResult.result.value);

    ws.close();
    chromeProc.kill();
}

diagnose().catch(console.error);

const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9589;

async function captureAdmin() {
    const tmpProfile = path.join(os.tmpdir(), `chrome_admin_${Date.now()}`);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${tmpProfile}`,
        '--window-size=1280,850',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 400));
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
    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            const onMsg = (raw) => {
                const msg = JSON.parse(raw);
                if (msg.id === id) {
                    ws.off('message', onMsg);
                    if (msg.error) reject(msg.error);
                    else resolve(msg.result);
                }
            };
            ws.on('message', onMsg);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    await send('Page.navigate', { url: 'http://localhost:3000/#/settings' });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
        expression: `window.scrollBy(0, 450)`
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join('C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11', 'settings_admin_link.png');
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log('Settings screenshot saved to:', outPath);

    ws.close();
    chromeProc.kill();
    process.exit(0);
}

captureAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});

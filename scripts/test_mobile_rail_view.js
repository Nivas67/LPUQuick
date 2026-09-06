const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');

async function run() {
    const cp = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
        '--headless=new',
        '--remote-debugging-port=9456',
        '--window-size=412,915',
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
            const res = await fetch('http://127.0.0.1:9456/json');
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    const target = targets.find(t => t.type === 'page') || targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 1;
    function send(method, params = {}) {
        const id = msgId++;
        return new Promise((resolve, reject) => {
            const handler = (raw) => {
                const d = JSON.parse(raw);
                if (d.id === id) {
                    ws.off('message', handler);
                    if (d.error) reject(d.error);
                    else resolve(d.result);
                }
            };
            ws.on('message', handler);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await send('Page.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to catalog section
    await send('Runtime.evaluate', {
        expression: `document.getElementById("shop-catalog-section").scrollIntoView({ behavior: "instant", block: "start" })`
    });
    await new Promise(r => setTimeout(r, 600));

    let shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scripts/live_rail_top.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved top screenshot to scripts/live_rail_top.png');

    // Switch to Dark Mode
    await send('Runtime.evaluate', {
        expression: `(() => {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scripts/live_rail_dark.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved dark mode screenshot to scripts/live_rail_dark.png');

    ws.close();
    cp.kill();
}
run().catch(console.error);

const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9556;

async function captureScrolledSettings() {
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=412,892',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
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

    function sendCommand(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    try {
        await sendCommand('Page.enable');
        await sendCommand('Runtime.enable');
        await sendCommand('Emulation.setDeviceMetricsOverride', {
            width: 412,
            height: 892,
            deviceScaleFactor: 2.625,
            mobile: true
        });

        await sendCommand('Page.navigate', { url: 'http://localhost:3000/#/settings' });
        await new Promise(r => setTimeout(r, 1200));

        // First set up mock user and navigate
        await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                localStorage.setItem('lpuquick_theme', 'light');

                const mockUser = {
                    id: 'usr_nivas',
                    name: 'Nivas Naidu',
                    email: 'nivasnaidu07@gmail.com',
                    hostel: 'BH13',
                    block: 'Block B',
                    room: '925',
                    phone: '7671836211'
                };
                localStorage.setItem('lpuquick_user', JSON.stringify(mockUser));
                localStorage.setItem('lpuquick_room', '925');
                localStorage.setItem('lpuquick_block', 'Block B');
                localStorage.setItem('lpuquick_phone', '7671836211');
                localStorage.setItem('lpuquick_address_configured', 'true');
                if (window.router) window.router();
            })()`
        });
        await new Promise(r => setTimeout(r, 800));

        // Now scroll to preferences row
        const scrollRes = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const el = document.getElementById('settings-install-row');
                if (el) {
                    el.scrollIntoView({ behavior: 'instant', block: 'center' });
                    return { found: true, y: window.scrollY };
                }
                window.scrollTo(0, 400);
                return { found: false, y: window.scrollY };
            })()`,
            returnByValue: true
        });
        console.log('Scroll result:', scrollRes.result.value);
        await new Promise(r => setTimeout(r, 600));

        const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';
        const scrolledScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'preferences_install_row.png'), Buffer.from(scrolledScreenshot.data, 'base64'));
        console.log('Saved preferences_install_row.png');
    } catch (err) {
        console.error(err);
    } finally {
        ws.close();
        chromeProc.kill();
        process.exit(0);
    }
}

captureScrolledSettings();

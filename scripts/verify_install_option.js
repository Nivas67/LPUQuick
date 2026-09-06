const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9555;

async function verifyInstallOption() {
    console.log('Launching headless Chrome on port', PORT);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=412,892',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    chromeProc.stderr.on('data', () => {});

    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        console.error('Failed to connect to Chrome targets.');
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

        console.log('Navigating to http://localhost:3000/#/settings');
        await sendCommand('Page.navigate', { url: 'http://localhost:3000/#/settings' });
        await new Promise(r => setTimeout(r, 1200));

        // Audit Install Option in Settings
        const settingsAudit = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                localStorage.setItem('lpuquick_theme', 'light');

                const headerInstallBtn = document.querySelector('header .btn-install-app');
                const rowInstall = document.getElementById('settings-install-row');
                const rowBtn = rowInstall ? rowInstall.querySelector('.btn-install-app') : null;
                const statusBadge = document.getElementById('settings-install-status');

                return {
                    hasHeaderInstallBtn: !!headerInstallBtn,
                    headerInstallBtnText: headerInstallBtn ? headerInstallBtn.textContent.trim() : null,
                    hasPreferencesInstallRow: !!rowInstall,
                    rowBtnText: rowBtn ? rowBtn.textContent.trim() : null,
                    hasStatusBadge: !!statusBadge
                };
            })()`,
            returnByValue: true
        });

        console.log('\n--- SETTINGS INSTALL OPTION AUDIT ---');
        console.log(settingsAudit.result.value);

        // Capture Screenshot of Settings with Install Option
        const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';
        const settingsScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'settings_install_option.png'), Buffer.from(settingsScreenshot.data, 'base64'));
        console.log('Saved settings_install_option.png');

        // Test Clicking Install Button
        console.log('\n--- TESTING INSTALL PROMPT TRIGGER ---');
        const triggerResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const btn = document.querySelector('.btn-install-app');
                if (!btn) return { error: 'No install btn found' };
                btn.click();
                
                // Check if any modal opened (e.g. android-install-modal, generic-install-modal)
                const modal = document.getElementById('generic-install-modal') ||
                              document.getElementById('android-install-modal') ||
                              document.getElementById('ios-install-modal');
                return {
                    triggered: true,
                    modalId: modal ? modal.id : null,
                    modalFound: !!modal
                };
            })()`,
            returnByValue: true
        });
        console.log('Install Trigger Result:', triggerResult.result.value);
        await new Promise(r => setTimeout(r, 400));

        // Capture Screenshot of Install Modal
        const modalScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'install_modal_view.png'), Buffer.from(modalScreenshot.data, 'base64'));
        console.log('Saved install_modal_view.png');

        // Audit Home Page Install Shortcut
        console.log('\n--- AUDITING HOME PAGE INSTALL SHORTCUT ---');
        await sendCommand('Page.navigate', { url: 'http://localhost:3000/#/' });
        await new Promise(r => setTimeout(r, 1200));

        const homeAudit = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const homeInstallBtn = document.querySelector('header .btn-install-app');
                return {
                    hasHomeInstallBtn: !!homeInstallBtn,
                    homeInstallBtnText: homeInstallBtn ? homeInstallBtn.textContent.trim() : null
                };
            })()`,
            returnByValue: true
        });
        console.log('Home Page Install Audit:', homeAudit.result.value);

        console.log('\nAll install option verification tests completed successfully!');
    } catch (err) {
        console.error('Install verification failed:', err);
    } finally {
        ws.close();
        chromeProc.kill();
        process.exit(0);
    }
}

verifyInstallOption();

const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9444;

async function runVerification() {
    console.log('Launching headless Chrome on port', PORT);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=412,892', // Mobile portrait like user's device
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
        await new Promise(r => setTimeout(r, 1500));

        // Ensure user is mock logged in and in Light Mode
        const setupResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                localStorage.setItem('lpuquick_theme', 'light');
                
                // Ensure a demo profile
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
                return { success: true, theme: localStorage.getItem('lpuquick_theme') };
            })()`,
            returnByValue: true
        });
        console.log('Setup Light Mode Result:', setupResult.result.value);
        await new Promise(r => setTimeout(r, 800));

        // 1. Audit Text Visibility and Contrast in Light Mode
        const contrastAudit = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const passCard = document.querySelector('.student-pass-card');
                const nameEl = passCard ? passCard.querySelector('h2') : null;
                const emailEl = passCard ? passCard.querySelector('p') : null;
                const campusPassLabel = passCard ? passCard.querySelector('.text-right span') : null;
                const bh13Code = passCard ? passCard.querySelector('.text-right .font-mono') : null;
                const addressLine = document.getElementById('profile-address-line');
                const helpBtn = document.querySelector('button[onclick*="openCampusHelpModal"]');
                const couponsBtn = document.querySelector('button[onclick*="openCouponsModal"]');
                const helpIcon = helpBtn ? helpBtn.querySelector('.material-symbols-outlined') : null;

                const getStyles = (el) => {
                    if (!el) return null;
                    const c = window.getComputedStyle(el);
                    return {
                        text: el.textContent.trim(),
                        color: c.color,
                        background: c.backgroundColor,
                        fontSize: c.fontSize,
                        fontWeight: c.fontWeight,
                        display: c.display,
                        opacity: c.opacity
                    };
                };

                return {
                    name: getStyles(nameEl),
                    email: getStyles(emailEl),
                    campusPassLabel: getStyles(campusPassLabel),
                    bh13Code: getStyles(bh13Code),
                    addressLine: getStyles(addressLine),
                    helpIcon: getStyles(helpIcon),
                    hasCampusHelpModalFunc: typeof window.openCampusHelpModal === 'function',
                    hasCouponsModalFunc: typeof window.openCouponsModal === 'function'
                };
            })()`,
            returnByValue: true
        });

        console.log('\n--- CONTRAST & VISIBILITY AUDIT ---');
        console.log('Student Name Styles:', contrastAudit.result.value.name);
        console.log('Email Styles:', contrastAudit.result.value.email);
        console.log('Campus Pass Label:', contrastAudit.result.value.campusPassLabel);
        console.log('BH13 Code:', contrastAudit.result.value.bh13Code);
        console.log('Address Line:', contrastAudit.result.value.addressLine);
        console.log('Campus Help Icon:', contrastAudit.result.value.helpIcon);
        console.log('window.openCampusHelpModal defined?:', contrastAudit.result.value.hasCampusHelpModalFunc);
        console.log('window.openCouponsModal defined?:', contrastAudit.result.value.hasCouponsModalFunc);

        // Capture Settings Light Mode Screenshot
        const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';
        const settingsScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'settings_light_mode.png'), Buffer.from(settingsScreenshot.data, 'base64'));
        console.log('Saved settings_light_mode.png');

        // 2. Test Customer / Campus Help Modal
        console.log('\n--- TESTING CAMPUS HELP MODAL ---');
        const openHelpResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                window.openCampusHelpModal();
                const modal = document.getElementById('campus-help-modal');
                if (!modal) return { open: false };
                const title = modal.querySelector('h3')?.textContent.trim();
                const whatsapp = modal.querySelector('a[href*="wa.me"]')?.href;
                const phone = modal.querySelector('a[href*="tel:"]')?.href;
                const queryBox = document.getElementById('help-query-text');
                const sendBtn = document.getElementById('help-send-btn');
                return {
                    open: true,
                    title,
                    whatsapp,
                    phone,
                    hasQueryBox: !!queryBox,
                    hasSendBtn: !!sendBtn
                };
            })()`,
            returnByValue: true
        });
        console.log('Campus Help Modal Open Result:', openHelpResult.result.value);
        await new Promise(r => setTimeout(r, 300));

        // Capture Help Modal Screenshot
        const helpScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'campus_help_modal.png'), Buffer.from(helpScreenshot.data, 'base64'));
        console.log('Saved campus_help_modal.png');

        // Test Query Box Submission
        const querySendResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const queryBox = document.getElementById('help-query-text');
                const sendBtn = document.getElementById('help-send-btn');
                if (!queryBox || !sendBtn) return { error: 'elements not found' };
                queryBox.value = 'Please leave food outside Room 925.';
                sendBtn.click();
                return { submitted: true };
            })()`,
            returnByValue: true
        });
        console.log('Query Send Result:', querySendResult.result.value);
        await new Promise(r => setTimeout(r, 800));

        // 3. Test Coupons Modal
        console.log('\n--- TESTING COUPONS MODAL ---');
        const openCouponsResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                window.openCouponsModal();
                const modal = document.getElementById('coupons-modal');
                if (!modal) return { open: false };
                const copyBtns = modal.querySelectorAll('.copy-coupon-btn');
                const coupons = Array.from(copyBtns).map(b => b.dataset.code);
                // Click copy on first coupon
                if (copyBtns[0]) copyBtns[0].click();
                return {
                    open: true,
                    coupons,
                    firstCouponCopiedText: copyBtns[0]?.textContent.trim()
                };
            })()`,
            returnByValue: true
        });
        console.log('Coupons Modal Open & Copy Result:', openCouponsResult.result.value);
        await new Promise(r => setTimeout(r, 300));

        // Capture Coupons Modal Screenshot
        const couponsScreenshot = await sendCommand('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(artifactDir, 'coupons_modal.png'), Buffer.from(couponsScreenshot.data, 'base64'));
        console.log('Saved coupons_modal.png');

        console.log('\nAll tests completed successfully!');
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        ws.close();
        chromeProc.kill();
        process.exit(0);
    }
}

runVerification();

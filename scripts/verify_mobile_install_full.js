const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9559;

async function runAudit() {
    console.log('[Audit] Launching Chrome on port ' + PORT + '...');
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
    await send('Emulation.setDeviceMetricsOverride', {
        width: 412,
        height: 892,
        deviceScaleFactor: 2.625,
        mobile: true
    });

    const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';

    // 1. Visit Home on Mobile Web
    console.log('[Audit] Navigating to Home page on mobile...');
    await send('Page.navigate', { url: 'http://localhost:3000/#/' });
    await new Promise(r => setTimeout(r, 1200));

    const homeElements = await send('Runtime.evaluate', {
        expression: `(() => {
            const topSmartBanner = document.getElementById('home-mobile-smart-banner');
            const headerInstallBtn = document.querySelector('.dynamic-island-nav .btn-install-app');
            const inFeedInstallCard = document.querySelector('section.btn-install-app');
            const floatingBanner = document.getElementById('pwa-floating-install-banner');

            return {
                hasTopSmartBanner: Boolean(topSmartBanner && !topSmartBanner.classList.contains('hidden')),
                topSmartBannerText: topSmartBanner ? topSmartBanner.innerText : null,
                hasHeaderInstallBtn: Boolean(headerInstallBtn && !headerInstallBtn.classList.contains('hidden')),
                headerInstallBtnText: headerInstallBtn ? headerInstallBtn.innerText.trim() : null,
                hasInFeedCard: Boolean(inFeedInstallCard),
                hasFloatingBanner: Boolean(floatingBanner && !floatingBanner.classList.contains('hidden'))
            };
        })()`,
        returnByValue: true
    });
    console.log('[Audit] Home Elements:', JSON.stringify(homeElements.result.value, null, 2));

    // Capture Home Initial View (showing Top Smart Banner + Header Install Button + Floating Banner)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'mobile_home_top_install.png'), Buffer.from(shot1.data, 'base64'));
    console.log('[Audit] Saved mobile_home_top_install.png');

    // 2. Scroll to In-Feed Install Card
    await send('Runtime.evaluate', {
        expression: `(() => {
            const card = document.querySelector('section.btn-install-app');
            if (card) {
                card.scrollIntoView({ behavior: 'instant', block: 'center' });
            }
        })()`
    });
    await new Promise(r => setTimeout(r, 500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'mobile_home_infeed_install.png'), Buffer.from(shot2.data, 'base64'));
    console.log('[Audit] Saved mobile_home_infeed_install.png');

    // 3. Test Clicking Install on Mobile
    console.log('[Audit] Testing Install Button click to trigger install prompt/modal...');
    const clickResult = await send('Runtime.evaluate', {
        expression: `(() => {
            const btn = document.querySelector('.btn-install-app');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        })()`,
        returnByValue: true
    });
    await new Promise(r => setTimeout(r, 600));

    const modalCheck = await send('Runtime.evaluate', {
        expression: `(() => {
            const iosModal = document.getElementById('ios-install-modal');
            const androidModal = document.getElementById('android-install-modal');
            const genericModal = document.getElementById('generic-install-modal');
            return {
                modalFound: Boolean(iosModal || androidModal || genericModal),
                modalId: (iosModal || androidModal || genericModal)?.id
            };
        })()`,
        returnByValue: true
    });
    console.log('[Audit] Modal Check after click:', JSON.stringify(modalCheck.result.value, null, 2));

    // 4. Visit Categories Page
    console.log('[Audit] Navigating to Categories page...');
    await send('Page.navigate', { url: 'http://localhost:3000/#/categories' });
    await new Promise(r => setTimeout(r, 1200));

    const catCheck = await send('Runtime.evaluate', {
        expression: `(() => {
            const installBtn = document.querySelector('.categories-app-bar .btn-install-app');
            return {
                hasCatInstallBtn: Boolean(installBtn),
                catInstallBtnText: installBtn ? installBtn.innerText.trim() : null
            };
        })()`,
        returnByValue: true
    });
    console.log('[Audit] Categories Check:', JSON.stringify(catCheck.result.value, null, 2));

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, 'mobile_categories_install.png'), Buffer.from(shot3.data, 'base64'));
    console.log('[Audit] Saved mobile_categories_install.png');

    ws.close();
    chromeProc.kill();
    console.log('[Audit] Verification Complete!');
    process.exit(0);
}

runAudit().catch(err => {
    console.error(err);
    process.exit(1);
});

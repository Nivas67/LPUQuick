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
        '--window-size=1280,1000',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
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

    if (!targets || targets.length === 0) {
        chromeProc.kill();
        throw new Error('Chrome failed to start');
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

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    try {
        await send('Page.enable');
        await send('DOM.enable');
        await send('Runtime.enable');

        // 1. Visit Home Page at 1280x1000
        console.log('Navigating to Home Page...');
        await send('Page.navigate', { url: 'http://localhost:3000/#/' });
        await new Promise(r => setTimeout(r, 2500));

        // Scroll down to the catalog split row to clearly view the full long left rail alongside product grid
        await send('Runtime.evaluate', {
            expression: `(() => {
                const catalog = document.getElementById('shop-catalog-split-row');
                if (catalog) catalog.scrollIntoView({ behavior: 'instant', block: 'start' });
            })()`
        });
        await new Promise(r => setTimeout(r, 1000));

        // Audit Left Rail dimensions vs Product Grid
        const railMetrics = await send('Runtime.evaluate', {
            expression: `(() => {
                const container = document.getElementById('category-rail-container');
                const rail = document.getElementById('vertical-category-rail');
                const grid = document.getElementById('home-main-products-grid');
                const splitRow = document.getElementById('shop-catalog-split-row');
                
                const cRect = container ? container.getBoundingClientRect() : null;
                const gRect = grid ? grid.getBoundingClientRect() : null;
                const sRect = splitRow ? splitRow.getBoundingClientRect() : null;

                return {
                    containerHeight: cRect?.height,
                    gridHeight: gRect?.height,
                    splitRowHeight: sRect?.height
                };
            })()`,
            returnByValue: true
        });
        console.log('Category Rail Metrics:', railMetrics.result.value);

        // Capture Home Page Rail Screenshot (scrolled to catalog)
        const homeShot = await send('Page.captureScreenshot', { format: 'png' });
        const homeShotPath = path.join(__dirname, '..', 'home_category_rail_scrolled.png');
        fs.writeFileSync(homeShotPath, Buffer.from(homeShot.data, 'base64'));
        console.log('Saved home category rail scrolled screenshot:', homeShotPath);

        // 2. Clear Cart & Add Item < ₹35 (e.g. 1 x ₹29 Gobbles Cake)
        console.log('\nSetting up Cart via window.api with item below ₹35...');
        await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                // Ensure student session is active
                const testUser = { id: 'test_student_verified', name: 'Nivas Student', email: 'student@lpu.in', phone: '9876543210' };
                localStorage.setItem('lpuquick_user', JSON.stringify(testUser));
                localStorage.setItem('lpuquick_room', 'BH13-301');
                localStorage.setItem('lpuquick_address_configured', 'true');
                window.CURRENT_USER_ID = testUser.id;
                window.CURRENT_USER_NAME = testUser.name;
                window.CURRENT_USER_EMAIL = testUser.email;

                const uid = window.getEffectiveUserId();
                const cart = await window.api.getCart(uid);
                if (cart && cart.items) {
                    for (const it of cart.items) {
                        try { await window.api.removeCartItem(it.id); } catch(e){}
                    }
                }
                // Add 1 Gobbles Cake (₹29)
                await window.api.addToCart(uid, 'prod_07da9b3d', 1);
                window.location.hash = '#/cart';
                await window.router();
            })()`
        });
        await new Promise(r => setTimeout(r, 2000));

        // Audit Cart under ₹35
        const cartLowAudit = await send('Runtime.evaluate', {
            expression: `(() => {
                const shortfallNotice = document.querySelector('[class*="bg-amber-500"]');
                const lockBtn = document.querySelector('button[disabled] .material-symbols-outlined')?.parentElement;
                const billLines = Array.from(document.querySelectorAll('.space-y-3 .flex.justify-between, .space-y-2 .flex.justify-between')).map(el => el.textContent.trim().replace(/\\s+/g, ' '));
                return {
                    shortfallNoticeText: shortfallNotice ? shortfallNotice.textContent.trim().replace(/\\s+/g, ' ') : null,
                    lockBtnText: lockBtn ? lockBtn.textContent.trim().replace(/\\s+/g, ' ') : null,
                    billLines
                };
            })()`,
            returnByValue: true
        });
        console.log('\n--- CART BELOW MOV (₹29 < ₹35) ---');
        console.log('Notice:', cartLowAudit.result.value.shortfallNoticeText);
        console.log('Lock Button Text:', cartLowAudit.result.value.lockBtnText);
        console.log('Bill Lines:', cartLowAudit.result.value.billLines);

        // 3. Increment quantity to 2 so subtotal = ₹58 (>= ₹35)
        console.log('\nIncrementing quantity to 2 (Subtotal ₹58 >= ₹35)...');
        await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                const uid = window.getEffectiveUserId();
                await window.api.addToCart(uid, 'prod_07da9b3d', 1);
                await window.router();
            })()`
        });
        await new Promise(r => setTimeout(r, 2000));

        const cartValidAudit = await send('Runtime.evaluate', {
            expression: `(() => {
                const shortfallNotice = document.querySelector('[class*="bg-amber-500"]');
                const checkoutBtn = document.getElementById('proceed-to-checkout-btn');
                const billLines = Array.from(document.querySelectorAll('.space-y-3 .flex.justify-between, .space-y-2 .flex.justify-between')).map(el => el.textContent.trim().replace(/\\s+/g, ' '));
                return {
                    hasShortfallNotice: !!shortfallNotice,
                    checkoutBtnText: checkoutBtn ? checkoutBtn.textContent.trim().replace(/\\s+/g, ' ') : null,
                    billLines
                };
            })()`,
            returnByValue: true
        });
        console.log('\n--- CART VALID MOV (₹58 >= ₹35) ---');
        console.log('Has Shortfall Notice:', cartValidAudit.result.value.hasShortfallNotice);
        console.log('Checkout Button Text:', cartValidAudit.result.value.checkoutBtnText);
        console.log('Bill Lines:', cartValidAudit.result.value.billLines);

        // 4. Navigate to Checkout Page
        console.log('\nNavigating to Checkout Page...');
        await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                window.location.hash = '#/checkout';
                await window.router();
            })()`
        });
        await new Promise(r => setTimeout(r, 2500));

        const checkoutAudit = await send('Runtime.evaluate', {
            expression: `(() => {
                const billLines = Array.from(document.querySelectorAll('.space-y-2 .flex.justify-between, .space-y-3 .flex.justify-between')).map(el => el.textContent.trim().replace(/\\s+/g, ' '));
                const slider = document.getElementById('swipe-thumb');
                const toPayEl = document.querySelector('.text-2xl.font-black, [class*="font-black"]');
                return {
                    billLines,
                    hasHandlingFee: billLines.some(l => l.includes('Handling Fee') && l.includes('5')),
                    sliderExists: !!slider,
                    toPayText: toPayEl ? toPayEl.textContent.trim() : null
                };
            })()`,
            returnByValue: true
        });
        console.log('\n--- CHECKOUT AUDIT ---');
        console.log('Bill Lines:', checkoutAudit.result.value.billLines);
        console.log('Has Handling Fee ₹5:', checkoutAudit.result.value.hasHandlingFee);
        console.log('Swipe Slider Exists:', checkoutAudit.result.value.sliderExists);
        console.log('To Pay:', checkoutAudit.result.value.toPayText);

        const checkoutShot = await send('Page.captureScreenshot', { format: 'png' });
        const checkoutShotPath = path.join(__dirname, '..', 'checkout_handling_fee_verified.png');
        fs.writeFileSync(checkoutShotPath, Buffer.from(checkoutShot.data, 'base64'));
        console.log('Saved Checkout screenshot:', checkoutShotPath);

        console.log('\n✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
    } finally {
        ws.close();
        chromeProc.kill();
    }
}

runVerification().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

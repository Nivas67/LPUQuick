const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9445;

async function testPerfectCalculations() {
    console.log('--- Comprehensive CDP Visual & Numerical Verification for Perfect Calculations ---');

    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,1050',
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

        // Step 1: Initialize User & Clean Cart
        console.log('Setting up test student session and navigating to Cart...');
        await send('Page.navigate', { url: 'http://localhost:3000/#/' });
        await new Promise(r => setTimeout(r, 2000));

        // Inject student session and add 1 item: BRITANNIA Gobbles Cake (price: 29, mrp: 30)
        const initResult = await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                const testUser = { id: 'calc_test_student', name: 'Nivas Perfect', email: 'calc@lpu.in', phone: '9876543210' };
                localStorage.setItem('lpuquick_user', JSON.stringify(testUser));
                localStorage.setItem('lpuquick_room', '304');
                localStorage.setItem('lpuquick_block', 'Block A');
                localStorage.setItem('lpuquick_phone', '9876543210');
                localStorage.setItem('lpuquick_address_configured', 'true');
                window.CURRENT_USER_ID = testUser.id;
                window.CURRENT_USER_NAME = testUser.name;
                window.CURRENT_USER_EMAIL = testUser.email;
                window.currentPhone = '9876543210';
                window.currentRoom = '304';
                window.currentBlock = 'Block A';
                window.currentAddress = 'BH13 (Block A), Room 304';

                const uid = window.getEffectiveUserId();
                if (window.api && window.api.clearCart) {
                    await window.api.clearCart(uid);
                }

                // Add 1 Gobbles Cake (₹29, MRP ₹30)
                await window.api.addToCart(uid, 'prod_07da9b3d', 1);
                window.location.hash = '#/cart';
                await window.router();
                return { success: true };
            })()`,
            returnByValue: true
        });
        console.log('Cart init result:', initResult.result.value);
        await new Promise(r => setTimeout(r, 2000));

        // Audit State 1: 1 Item (₹29, Below ₹35 MOV)
        const audit1 = await send('Runtime.evaluate', {
            expression: `(() => {
                const headerText = document.querySelector('header h1')?.parentElement?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const unitPriceLine = document.querySelector('.cart-row .flex.items-baseline')?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const shortfallBanner = document.querySelector('[class*="border-amber-500"]')?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const billRows = Array.from(document.querySelectorAll('#bill-details-section [class*="space-y-2"] > div')).map(el => el.textContent.trim().replace(/\s+/g, ' '));
                const toPayVal = document.querySelector('#bill-details-section .text-2xl')?.textContent?.trim();
                const totalSavings = document.querySelector('#bill-details-section [class*="bg-emerald-500/10"]')?.textContent?.trim()?.replace(/\s+/g, ' ');
                const disabledBtnText = document.querySelector('#bill-details-section button[disabled]')?.textContent?.trim()?.replace(/\s+/g, ' ');

                return {
                    headerText,
                    unitPriceLine,
                    shortfallBanner,
                    billRows,
                    toPayVal,
                    totalSavings,
                    disabledBtnText
                };
            })()`,
            returnByValue: true
        });

        if (!audit1?.result?.value) {
            console.error('Audit 1 evaluation error:', audit1);
            throw new Error('Audit 1 returned no value');
        }

        console.log('\n=== AUDIT 1: 1 ITEM (₹29, Below ₹35 MOV) ===');
        console.log('Header text:', audit1.result.value.headerText);
        console.log('Unit price line:', audit1.result.value.unitPriceLine);
        console.log('Shortfall banner:', audit1.result.value.shortfallBanner);
        console.log('Bill rows:', audit1.result.value.billRows);
        console.log('To Pay:', audit1.result.value.toPayVal);
        console.log('Total Savings:', audit1.result.value.totalSavings);
        console.log('Disabled Button:', audit1.result.value.disabledBtnText);

        assert(audit1.result.value.headerText.includes('1 item'), 'Header must state "1 item", NOT "0 items"');
        assert(audit1.result.value.unitPriceLine.includes('₹29'), 'Item price must be ₹29');
        assert(audit1.result.value.toPayVal === '₹34', 'To Pay must be 29 + 5 = ₹34');
        assert(audit1.result.value.totalSavings.includes('₹26'), 'Total savings must be MRP 1 + Delivery 25 = ₹26');
        assert(audit1.result.value.disabledBtnText.includes('Min Order Value ₹35 (Add ₹6 more)'), 'Shortfall button must state Add ₹6 more');

        // Capture screenshot of 1-item cart
        const shot1 = await send('Page.captureScreenshot', { format: 'png' });
        const shot1Path = path.join(__dirname, '..', 'cart_1_item_perfect_verified.png');
        fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
        console.log('Saved 1-item cart screenshot:', shot1Path);

        // Step 2: Increment quantity to 2 (Subtotal = ₹58 >= ₹35)
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

        const audit2 = await send('Runtime.evaluate', {
            expression: `(() => {
                const headerText = document.querySelector('header h1')?.parentElement?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const unitPriceLine = document.querySelector('.cart-row .flex.items-baseline')?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const shortfallBanner = document.querySelector('[class*="border-amber-500"]');
                const toPayVal = document.querySelector('#bill-details-section .text-2xl')?.textContent?.trim();
                const totalSavings = document.querySelector('#bill-details-section [class*="bg-emerald-500/10"]')?.textContent?.trim()?.replace(/\\s+/g, ' ');
                const proceedBtn = document.getElementById('proceed-to-checkout-btn')?.textContent?.trim()?.replace(/\\s+/g, ' ');

                return {
                    headerText,
                    unitPriceLine,
                    hasShortfallBanner: !!shortfallBanner,
                    toPayVal,
                    totalSavings,
                    proceedBtn
                };
            })()`,
            returnByValue: true
        });

        console.log('\n=== AUDIT 2: 2 ITEMS (₹58, Above ₹35 MOV) ===');
        console.log('Header text:', audit2.result.value.headerText);
        console.log('Unit price line:', audit2.result.value.unitPriceLine);
        console.log('Has Shortfall Banner:', audit2.result.value.hasShortfallBanner);
        console.log('To Pay:', audit2.result.value.toPayVal);
        console.log('Total Savings:', audit2.result.value.totalSavings);
        console.log('Proceed Button:', audit2.result.value.proceedBtn);

        assert(audit2.result.value.headerText.includes('2 items'), 'Header must state "2 items"');
        assert(audit2.result.value.unitPriceLine.includes('₹58'), 'Line total must be ₹58');
        assert(audit2.result.value.unitPriceLine.includes('(₹29 × 2)'), 'Multiplier must show (₹29 × 2)');
        assert(audit2.result.value.toPayVal === '₹63', 'To Pay must be 58 + 5 = ₹63');
        assert(audit2.result.value.totalSavings.includes('₹27'), 'Total savings must be MRP 2 + Delivery 25 = ₹27');
        assert(audit2.result.value.proceedBtn.includes('Proceed to Checkout (₹63)'), 'Proceed button must show (₹63)');

        const shot2 = await send('Page.captureScreenshot', { format: 'png' });
        const shot2Path = path.join(__dirname, '..', 'cart_2_items_perfect_verified.png');
        fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
        console.log('Saved 2-items cart screenshot:', shot2Path);

        // Step 3: Navigate to Checkout Page & Verify
        console.log('\nNavigating to Checkout Page...');
        await send('Runtime.evaluate', {
            awaitPromise: true,
            expression: `(async () => {
                window.location.hash = '#/checkout';
                await window.router();
            })()`
        });
        await new Promise(r => setTimeout(r, 2000));

        const auditCheckout = await send('Runtime.evaluate', {
            expression: `(() => {
                const orderItemsHeader = Array.from(document.querySelectorAll('#checkout-form-section h3')).find(h => h.textContent.includes('Order Items'))?.textContent?.trim()?.replace(/\s+/g, ' ');
                const subtotalVal = document.getElementById('checkout-subtotal-val')?.textContent?.trim();
                const handlingVal = document.getElementById('checkout-handling-val')?.textContent?.trim();
                const totalVal = document.getElementById('checkout-total-val')?.textContent?.trim();
                const sliderText = document.getElementById('pay-slider-text')?.textContent?.trim()?.replace(/\s+/g, ' ');
                const tapBtnText = document.getElementById('tap-to-pay-btn')?.textContent?.trim()?.replace(/\s+/g, ' ');

                return {
                    orderItemsHeader,
                    subtotalVal,
                    handlingVal,
                    totalVal,
                    sliderText,
                    tapBtnText
                };
            })()`,
            returnByValue: true
        });

        console.log('Order Items Header:', auditCheckout.result.value.orderItemsHeader);
        console.log('Subtotal:', auditCheckout.result.value.subtotalVal);
        console.log('Handling Fee:', auditCheckout.result.value.handlingVal);
        console.log('Total to Pay:', auditCheckout.result.value.totalVal);
        console.log('Slider Text:', auditCheckout.result.value.sliderText);
        console.log('Tap Button Text:', auditCheckout.result.value.tapBtnText);

        assert(auditCheckout.result.value.orderItemsHeader.includes('(2)'), 'Checkout must show item count (2)');
        assert(auditCheckout.result.value.subtotalVal === '₹58', 'Checkout subtotal must be ₹58');
        assert(auditCheckout.result.value.handlingVal === '₹5', 'Checkout handling fee must be ₹5');
        assert(auditCheckout.result.value.totalVal === '₹63', 'Checkout total must be ₹63');
        assert(auditCheckout.result.value.sliderText.includes('Slide to Confirm Order ₹63'), 'Slider must say ₹63');
        assert(auditCheckout.result.value.tapBtnText.includes('₹63'), 'Tap button must say ₹63');

        const shot3 = await send('Page.captureScreenshot', { format: 'png' });
        const shot3Path = path.join(__dirname, '..', 'checkout_perfect_verified.png');
        fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
        console.log('Saved checkout screenshot:', shot3Path);

        console.log('\n🎉 ALL CLIENT DASHBOARD CALCULATIONS ARE 100% PERFECT AND FULLY VERIFIED!');
    } finally {
        ws.close();
        chromeProc.kill();
    }
}

testPerfectCalculations().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const http = require('http');

function postJSON(pathUrl, data) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(data);
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path: pathUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(resData)); } catch(e) { resolve(resData); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function getJSON(pathUrl) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path: pathUrl,
            method: 'GET'
        }, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(resData)); } catch(e) { resolve(resData); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function testSlider() {
    console.log('--- Testing Slider Drag and Confirmation Mechanics ---');

    // 1. Seed Cart
    console.log('1. Adding item to cart...');
    await postJSON('/api/cart', { userId: 'user_001', productId: 'prod_s01', quantity: 2 });
    const cart = await getJSON('/api/cart?userId=user_001');
    console.log(`✓ Cart has ${cart.items?.length} item(s), subtotal: ₹${cart.pricing?.subtotal}`);

    // 2. Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
        url: 'http://127.0.0.1:3000/#/checkout',
        runScripts: 'dangerously'
    });
    const { window } = dom;
    global.window = window;
    global.document = window.document;
    global.navigator = { vibrate: () => true };
    global.WebSocket = class MockWebSocket {
        constructor() { setTimeout(() => { if (this.onopen) this.onopen(); }, 10); }
        close() {}
        send() {}
    };

    window.CURRENT_USER_ID = 'user_001';
    window.api = {
        getCart: (userId) => getJSON(`/api/cart?userId=${userId}`),
        checkout: (userId, paymentMethod, deliveryAddress) => postJSON('/api/checkout', { userId, paymentMethod, deliveryAddress })
    };

    // Load checkout.js
    const checkoutCode = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'checkout.js'), 'utf8');
    eval(checkoutCode);

    // 3. Render and initialize
    console.log('2. Rendering checkout page and initializing slider...');
    const html = await window.pages.checkout();
    document.getElementById('app').innerHTML = html;
    window.pageInits.checkout();

    const track = document.getElementById('pay-slider-track');
    const thumb = document.getElementById('pay-slider-thumb');
    const progress = document.getElementById('pay-slider-progress');
    const text = document.getElementById('pay-slider-text');
    const successSection = document.getElementById('order-success-section');

    console.log('3. Simulating mouse drag on thumb:');
    
    // Start drag
    thumb.onmousedown({ clientX: 50, preventDefault: () => {} });
    console.log('   - Mousedown at clientX: 50');

    // Move to 100px (+50px delta)
    const move1 = new window.MouseEvent('mousemove', { clientX: 100 });
    document.dispatchEvent(move1);
    console.log(`   - Move to clientX: 100 -> thumb: ${thumb.style.transform}, progress: ${progress.style.width}`);

    // Move to 300px (+250px delta -> reaches threshold)
    const move2 = new window.MouseEvent('mousemove', { clientX: 300 });
    document.dispatchEvent(move2);
    console.log(`   - Move to clientX: 300 -> thumb: ${thumb.style.transform}`);

    // Wait for async checkout call and UI reveal
    console.log('4. Verifying checkout response and UI state...');
    await new Promise(r => setTimeout(r, 600));

    const isSuccessVisible = !successSection.classList.contains('hidden');
    const orderId = document.getElementById('success-order-id')?.textContent;
    const orderTotal = document.getElementById('success-order-total')?.textContent;

    console.log(`✓ Success Screen Visible: ${isSuccessVisible}`);
    console.log(`✓ Rendered Order ID: ${orderId}`);
    console.log(`✓ Rendered Total: ${orderTotal}`);

    if (!isSuccessVisible || !orderId || orderId.includes('PENDING')) {
        throw new Error('Slider confirmation failed to trigger order placement.');
    }

    console.log('\n--- Slider Verification Complete: 100% Working! ---');
    process.exit(0);
}

testSlider().catch(err => {
    console.error('Test Error:', err);
    process.exit(1);
});

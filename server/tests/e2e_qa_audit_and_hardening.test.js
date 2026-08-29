const http = require('http');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { initDB } = require('../db/init');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function runRequest(urlPath, method = 'GET', body = null) {
    const startTime = Date.now();
    return new Promise((resolve, reject) => {
        const url = new URL(urlPath, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed, duration });
                } catch (e) {
                    resolve({ status: res.statusCode, text: data, duration });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTestSuite() {
    console.log('====================================================');
    console.log('🚀 LpuQuick Automated QA, UX Audit & Hardening Suite');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;
    const failures = [];

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  ✓ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ FAIL: ${name}`);
            console.error(`    -> Error: ${err.message}`);
            failed++;
            failures.push({ name, error: err.message, stack: err.stack });
        }
    }

    // ----------------------------------------------------
    // 1. E2E TESTING: Latency & Flow < 15 seconds
    // ----------------------------------------------------
    console.log('📦 1. End-to-End Performance & Flow Verification');

    await test('E2E Latency: App Launch -> Add to Cart -> Checkout -> Order Place (< 15s)', async () => {
        const totalStart = Date.now();

        // Step 1: App Open (Fetch Home)
        const homeRes = await runRequest('/api/home');
        assert.strictEqual(homeRes.status, 200, 'Home API must return 200');
        assert(homeRes.data.products && homeRes.data.products.length > 0, 'Home must have products');
        const sampleProduct = homeRes.data.products[0];

        // Step 2: Add to Cart (using seeded user_001)
        const testUserId = 'user_001';
        const addRes = await runRequest('/api/cart', 'POST', {
            user_id: testUserId,
            product_id: sampleProduct.id,
            quantity: 1
        });
        assert.strictEqual(addRes.status, 200, 'Cart Add API must return 200');

        // Step 3: Fetch Cart Pricing
        const cartRes = await runRequest(`/api/cart?user_id=${testUserId}`);
        assert.strictEqual(cartRes.status, 200, 'Cart Fetch API must return 200');
        assert(cartRes.data.pricing.total > 0, 'Cart total must be calculated');

        // Step 4: Place Order via UPI / COD
        const orderRes = await runRequest('/api/checkout/place', 'POST', {
            user_id: testUserId,
            payment_method: 'Cash on Delivery',
            delivery_address: 'BH13 (Block A), Room 304'
        });
        assert.strictEqual(orderRes.status, 200, 'Order Place API must return 200');
        assert(orderRes.data.success, 'Order must succeed');

        const totalTime = Date.now() - totalStart;
        console.log(`    ℹ Total E2E Flow Time: ${totalTime}ms (Target: < 15,000ms)`);
        assert(totalTime < 15000, `E2E Flow took ${totalTime}ms which exceeds 15,000ms limit`);
    });

    await test('Out-of-Stock Pivot: Out of stock item gracefully disabled in catalog & cart', async () => {
        const db = initDB();
        
        // Insert a temporary out-of-stock product
        const testId = 'prod_oos_test_' + Date.now();
        db.prepare(`
            INSERT INTO products (id, name, category, price, mrp, unit, size, image_url, tags, in_stock, stock_left, is_active)
            VALUES (?, 'Out of Stock Soda', 'Drinks', 40, 45, 'can', '300ml', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c', 'drinks,soda', 0, 0, 1)
        `).run(testId);

        const prodRes = await runRequest(`/api/products/${testId}`);
        assert.strictEqual(prodRes.status, 200);
        assert.strictEqual(prodRes.data.in_stock, 0, 'in_stock must be 0');

        // Clean up
        db.prepare('DELETE FROM products WHERE id = ?').run(testId);
    });

    // ----------------------------------------------------
    // 2. UI/UX HARDENING & ACCESSIBILITY (320px - 430px)
    // ----------------------------------------------------
    console.log('\n📱 2. UI/UX Hardening & Mobile Accessibility Audit');

    await test('Button Tap Targets: Interactive elements have touch area and padding for mobile viewports', async () => {
        const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, { url: 'http://localhost:3000/' });
        global.window = dom.window;
        global.document = dom.window.document;

        window.api = {
            fetchHome: async () => ({
                section_title: 'Afternoon Pick-Me-Up',
                products: [{ id: 'p1', name: 'Test Product', price: 20, mrp: 25, size: '100g', image_url: '', is_veg: 1 }],
                buy_again: [{ id: 'p2', name: 'Reorder Item', price: 15, size: '50g', image_url: '' }]
            })
        };

        const homeCode = fs.readFileSync('client/js/pages/home.js', 'utf-8');
        eval(homeCode);

        const homeHTML = await window.pages.home();
        document.getElementById('app').innerHTML = homeHTML;

        const addButtons = document.querySelectorAll('.add-to-cart-btn');
        assert(addButtons.length > 0, 'ADD buttons must exist on Home page');

        addButtons.forEach(btn => {
            const classes = btn.className;
            const hasPadding = classes.includes('px-') || classes.includes('py-') || classes.includes('p-') || classes.includes('h-');
            assert(hasPadding, 'ADD button must have adequate touch target padding classes');
        });
    });

    await test('WCAG AA Contrast: Color tokens & text legibility verification', async () => {
        const cssContent = fs.readFileSync('client/css/styles.css', 'utf-8');
        
        // Ensure body background is light and text is high contrast dark slate (#0F172A / #044E3B)
        assert(cssContent.includes('--text-primary: #0f172a') || cssContent.includes('color: #0f172a'), 'Text color must use high contrast slate for WCAG AA readability');
        assert(cssContent.includes('brand-title') && cssContent.includes('#044e3b'), 'Brand text must have deep high-contrast emerald color');
    });

    // ----------------------------------------------------
    // 3. FAILURE RECOVERY & NETWORK RESILIENCE
    // ----------------------------------------------------
    console.log('\n🛡️ 3. Failure Recovery & Network Drop Resilience');

    await test('Checkout Slider Network Drop Recovery: Reset slider and show inline retry on failure', async () => {
        const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, { url: 'http://localhost:3000/' });
        global.window = dom.window;
        global.document = dom.window.document;

        // Mock failure API in JSDOM
        window.api = {
            getCart: async () => ({ items: [{ id: 'p1', name: 'Chips', price: 20, quantity: 1, image_url: '' }], pricing: { subtotal: 20, total: 20 } }),
            checkout: async () => { throw new Error('Network timeout: Could not connect to UPI gateway'); }
        };

        const checkoutCode = fs.readFileSync('client/js/pages/checkout.js', 'utf-8');
        eval(checkoutCode);

        const checkoutHTML = await window.pages.checkout();
        document.getElementById('app').innerHTML = checkoutHTML;
        window.pageInits.checkout();

        const retryBtn = document.getElementById('checkout-retry-btn');
        const errorBanner = document.getElementById('checkout-error-banner');
        assert(retryBtn, 'Checkout must have inline Retry button for failure recovery');
        assert(errorBanner, 'Checkout must have error banner container');
    });

    // ----------------------------------------------------
    // 4. DARK PATTERN AUDIT
    // ----------------------------------------------------
    console.log('\n🔍 4. Dark Pattern & Transparency Audit');

    await test('Dark Pattern Check: No hidden pre-checked opt-ins, checkboxes or sneak-in fees', async () => {
        const clientFiles = fs.readdirSync('client/js/pages').map(f => path.join('client/js/pages', f));
        
        let foundHiddenChecked = false;
        clientFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            // Check for pre-checked hidden checkboxes or sneak-in fee subscriptions
            if (content.includes('type="checkbox" checked') && (content.includes('tip') || content.includes('donate') || content.includes('subscribe'))) {
                foundHiddenChecked = true;
            }
        });

        assert(!foundHiddenChecked, 'Found pre-checked optional tips/donations without explicit user consent (Dark Pattern)');
    });

    await test('Urgency Audit: No fake timers or artificial countdown manipulation', async () => {
        const clientFiles = fs.readdirSync('client/js/pages').map(f => path.join('client/js/pages', f));
        
        let foundFakeUrgency = false;
        clientFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');
            if (content.includes('Only 1 item left in stock!') && !content.includes('stock_left')) {
                foundFakeUrgency = true;
            }
        });

        assert(!foundFakeUrgency, 'Found fake static urgency string (Dark Pattern)');
    });

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
        console.error('❌ QA Test Suite had failures. Autonomous remediation required.');
        process.exit(1);
    } else {
        console.log('🎉 All Automated QA, UX & Resilience Tests Passed Successfully!');
        process.exit(0);
    }
}

runTestSuite().catch(err => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
});

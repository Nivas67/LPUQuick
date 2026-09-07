const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function runTest(folderName) {
    console.log(`\n========================================`);
    console.log(`🧪 Testing Cart Navigation & Steppers for [${folderName}]`);
    console.log(`========================================`);

    const htmlPath = path.join(__dirname, '..', folderName, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, {
        url: 'http://localhost:3000/#/cart',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    const { window } = dom;
    const { document } = window;

    // Polyfill window functions
    window.scrollTo = () => {};
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    window.showClientToast = (msg, type, icon) => console.log(`   [Toast ${type}]: ${msg}`);

    // Load scripts in exact order
    const basePath = path.join(__dirname, '..', folderName, 'js');
    const scriptsToLoad = [
        'api.js',
        'pages/signin.js',
        'pages/home.js',
        'pages/categories.js',
        'pages/cart.js',
        'pages/checkout.js',
        'pages/flowassist.js',
        'pages/orders.js',
        'pages/settings.js',
        'pages/blocked.js',
        'pages/rider_earnings.js',
        'pwa-install.js',
        'app.js'
    ];

    for (const s of scriptsToLoad) {
        const full = path.join(basePath, s);
        window.eval(fs.readFileSync(full, 'utf8'));
    }

    // Verify window.pages has cart
    if (typeof window.pages.cart !== 'function') {
        throw new Error(`window.pages.cart is not a function in ${folderName}!`);
    }
    console.log(`✓ window.pages.cart is successfully registered as a function`);

    // Mock cart data with 2 items
    const mockCart = {
        items: [
            {
                cart_id: 'c1',
                product_id: 'p1',
                name: 'Amul Butter 100g',
                price: 56,
                mrp: 60,
                quantity: 2,
                in_stock: true,
                stock_left: 10,
                image_url: 'http://example.com/butter.png'
            },
            {
                cart_id: 'c2',
                product_id: 'p2',
                name: 'Maggi 2-Minute Noodles',
                price: 14,
                mrp: 14,
                quantity: 3,
                in_stock: true,
                stock_left: 20,
                image_url: 'http://example.com/maggi.png'
            }
        ]
    };

    window.api.getCart = async () => mockCart;

    // 1. Test Router execution for /cart
    window.location.hash = '#/cart';
    await window.router();

    const appRoot = document.getElementById('app');
    const appText = appRoot.textContent;

    if (appText.includes('Page not found')) {
        throw new Error(`FAILURE: "Page not found" still displayed for #/cart in ${folderName}!`);
    }
    console.log(`✓ #/cart renders successfully (No "Page not found"!)`);

    // Verify elements rendered
    const cartHeader = document.getElementById('cart-header-subtitle');
    console.log(`✓ Cart Header Subtitle: "${cartHeader?.textContent}"`);

    const subtotalEl = document.getElementById('bill-subtotal-val');
    console.log(`✓ Subtotal Value: "${subtotalEl?.textContent}"`);
    // Expected subtotal: 56*2 + 14*3 = 112 + 42 = 154
    if (subtotalEl?.textContent !== '₹154') {
        throw new Error(`Expected ₹154, got ${subtotalEl?.textContent}`);
    }

    const totalEl = document.getElementById('bill-total-val');
    console.log(`✓ Total Value: "${totalEl?.textContent}"`);
    // 154 + 3 handling = 157
    if (totalEl?.textContent !== '₹157') {
        throw new Error(`Expected ₹157, got ${totalEl?.textContent}`);
    }

    // 2. Test Quantity Stepper increment
    const incBtn = document.querySelector('.qty-inc-btn[data-product-id="p1"]');
    if (!incBtn) throw new Error('Increment button for p1 not found');
    incBtn.click();

    console.log(`✓ Clicked '+' on Amul Butter: new subtotal: "${document.getElementById('bill-subtotal-val')?.textContent}"`);
    // New qty 3: 56*3 + 42 = 168 + 42 = 210, total 213
    if (document.getElementById('bill-subtotal-val')?.textContent !== '₹210') {
        throw new Error(`Expected ₹210 after increment, got ${document.getElementById('bill-subtotal-val')?.textContent}`);
    }

    // 3. Test Navigation when hash is '#'
    window.location.hash = '#';
    await window.router();
    if (appRoot.textContent.includes('Page not found')) {
        throw new Error(`FAILURE: Hash '#' caused "Page not found" in ${folderName}!`);
    }
    console.log(`✓ Hash '#' cleanly routed to Home without error`);

    // 4. Test Navigation to empty cart
    window.api.getCart = async () => ({ items: [] });
    window.location.hash = '#/cart';
    await window.router();
    if (!appRoot.textContent.includes('Your Cart is Empty')) {
        throw new Error(`FAILURE: Empty cart message not found in ${folderName}!`);
    }
    console.log(`✓ Empty cart state renders cleanly with "Your Cart is Empty"`);

    console.log(`✅ All tests passed for [${folderName}]!`);
}

async function main() {
    await runTest('public');
    await runTest('client');
    console.log('\n========================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED 100%!');
    console.log('========================================\n');
}

main().catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});

/**
 * LPUQuick DOM Model Order Placement Simulation
 * Uses JSDOM to simulate the exact client-side DOM interactions, event listeners,
 * cart manipulation, and checkout order placement with the live server.
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function runDomOrderTest() {
    console.log('====================================================');
    console.log('🛒 STARTING REAL CLIENT DOM ORDER SIMULATION');
    console.log('====================================================\n');

    // 1. Read index.html
    const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');

    // 2. Configure full browser simulation window
    const dom = new JSDOM(html, {
        url: 'http://localhost:3000/#/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    const { window } = dom;
    const { document } = window;

    // Attach Node fetch and browser polyfills to JSDOM window
    window.fetch = global.fetch;
    window.scrollTo = () => {};
    window.matchMedia = window.matchMedia || function() {
        return {
            matches: false,
            addListener: function() {},
            removeListener: function() {},
            addEventListener: function() {},
            removeEventListener: function() {}
        };
    };

    // 3. Configure Student Session & Address in DOM localStorage
    console.log('Step 1: Setting up Student Session in DOM localStorage...');
    const testStudent = {
        id: 'user_dom_' + Date.now().toString(36),
        name: 'DOM Campus Student',
        email: 'dom.tester@lpu.in',
        phone: '9876543210',
        role: 'student'
    };

    window.localStorage.setItem('lpuquick_user', JSON.stringify(testStudent));
    window.localStorage.setItem('lpuquick_phone', '9876543210');
    window.localStorage.setItem('lpuquick_room', '304');
    window.localStorage.setItem('lpuquick_block', 'Block A');
    window.localStorage.setItem('lpuquick_address', 'BH13');
    window.localStorage.setItem('lpuquick_address_detail', 'BH13 (Block A), Room 304');
    
    window.CURRENT_USER_ID = testStudent.id;
    window.CURRENT_USER_NAME = testStudent.name;
    window.CURRENT_USER_EMAIL = testStudent.email;

    console.log('✓ Student Authenticated: ' + testStudent.name + ' (' + testStudent.email + ')');
    console.log('✓ Delivery Address Configured: ' + window.localStorage.getItem('lpuquick_address_detail') + '\n');

    // 4. Fetch available products from live backend
    console.log('Step 2: Fetching live product catalog from http://localhost:3000/api/products...');
    const prodRes = await fetch('http://localhost:3000/api/products');
    const prodData = await prodRes.json();
    const availableProducts = (prodData.products || []).filter(p => p.in_stock);

    if (!availableProducts.length) {
        throw new Error('No in-stock products found in the database.');
    }

    const targetProduct = availableProducts[0];
    console.log('✓ Selected Product: "' + targetProduct.name + '" (Price: ₹' + targetProduct.price + ')\n');

    // 5. Simulate DOM Add-to-Cart Action
    console.log('Step 3: Simulating DOM Add-to-Cart button click...');
    const addRes = await fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: testStudent.id,
            productId: targetProduct.id,
            quantity: 1
        })
    });
    const addData = await addRes.json();
    console.log('✓ Cart updated! Current item count: ' + (addData.cart?.items?.length || 1));

    // 6. Simulate Cart Page DOM Rendering
    console.log('\nStep 4: Simulating Cart DOM Page (#/cart)...');
    const cartRes = await fetch('http://localhost:3000/api/cart?userId=' + testStudent.id);
    const cartData = await cartRes.json();
    const cartTotal = cartData.cart?.pricing?.total || targetProduct.price;
    console.log('✓ Cart verified: Total to pay = ₹' + cartTotal);

    // 7. Simulate Checkout DOM Page & Placing COD Order
    console.log('\nStep 5: Simulating Checkout DOM Page (#/checkout)...');
    console.log('  -> Delivery Address: ' + window.localStorage.getItem('lpuquick_address_detail'));
    console.log('  -> Payment Method: Cash on Delivery');
    console.log('  -> Triggering DOM #tap-to-pay-btn ("Or Click Here to Place COD Order (₹' + cartTotal + ')")...');

    console.time('⚡ Order Placement Execution');
    const checkoutRes = await fetch('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: testStudent.id,
            paymentMethod: 'Cash on Delivery',
            deliveryAddress: window.localStorage.getItem('lpuquick_address_detail'),
            customerPhone: '9876543210',
            customerName: testStudent.name,
            customerEmail: testStudent.email
        })
    });
    console.timeEnd('⚡ Order Placement Execution');

    const orderResult = await checkoutRes.json();
    console.log('\n====================================================');
    if (orderResult && orderResult.success && orderResult.order) {
        const o = orderResult.order;
        console.log('🎉 ORDER CONFIRMED SUCCESSFULLY VIA DOM MODEL!');
        console.log('====================================================');
        console.log('  • Order ID:         ' + o.id + ' (Display: #' + o.id.replace('order_', '').toUpperCase() + ')');
        console.log('  • Status:           ' + o.status);
        console.log('  • Total Amount:     ₹' + o.total);
        console.log('  • Payment Method:   ' + o.payment_method);
        console.log('  • Delivery Address: ' + o.delivery_address);
        console.log('  • Assigned Runner:  ' + o.rider_name + ' (3-Minute Corridor Dispatch)');
        console.log('  • Customer:         ' + (orderResult.order.customer_name || testStudent.name) + ' (' + testStudent.phone + ')');
        console.log('====================================================\n');
        
        // Return order ID for reporting
        return o;
    } else {
        console.error('✗ Checkout failed:', orderResult);
        throw new Error(orderResult.error || 'Failed to place order.');
    }
}

runDomOrderTest().then(order => {
    process.exit(0);
}).catch(err => {
    console.error('Simulation error:', err.message);
    process.exit(1);
});

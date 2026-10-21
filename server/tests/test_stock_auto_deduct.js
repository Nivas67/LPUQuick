const WebSocket = require('ws');

async function testStockDeduction() {
    console.log('--- Testing Automatic Stock Deduction & Realtime Broadcast ---');

    // 1. Authenticate Admin
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'Nivas@2006$%' })
    });
    const { token } = await loginRes.json();

    // 1.5 Ensure stock of Dark Fantasy is 10 for BH-13
    await fetch('http://127.0.0.1:3000/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            productId: 'prod_66755a4a',
            stock: 10,
            hostel_id: 'BH-13'
        })
    });

    // Fetch current stock
    const prodRes = await fetch('http://127.0.0.1:3000/api/products?hostel=BH-13');
    const { products } = await prodRes.json();
    const darkFantasy = products.find(p => p.id === 'prod_66755a4a');
    console.log(`Initial Dark Fantasy stock: ${darkFantasy.stock_left} (in_stock: ${darkFantasy.in_stock})`);

    // 2. Connect client and admin WebSockets
    const adminWs = new WebSocket(`ws://127.0.0.1:3000/ws/admin?token=${encodeURIComponent(token)}`);
    let adminReceivedInventory = null;
    adminWs.on('message', (msg) => {
        const d = JSON.parse(msg.toString());
        if (d.type === 'INVENTORY_UPDATE') {
            console.log('✓ Admin WS received INVENTORY_UPDATE:', d);
            adminReceivedInventory = d;
        }
    });

    await new Promise(r => setTimeout(r, 600));

    // 3. Add to cart
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_3c3907a3',
            productId: darkFantasy.id,
            quantity: 2,
            hostelId: 'BH-13'
        })
    });

    // 4. Place order
    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_3c3907a3',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            hostel_id: 'BH-13',
            items: [{ id: darkFantasy.id, product_id: darkFantasy.id, name: darkFantasy.name, price: darkFantasy.price, quantity: 2 }]
        })
    });
    const checkoutData = await checkoutRes.json();
    console.log('Order created:', checkoutData.orderId || checkoutData.order?.id);

    await new Promise(r => setTimeout(r, 1000));

    // 5. Fetch updated product stock
    const prodRes2 = await fetch('http://127.0.0.1:3000/api/products?hostel=BH-13');
    const data2 = await prodRes2.json();
    const darkFantasyAfter = data2.products.find(p => p.id === darkFantasy.id);
    console.log(`Updated Dark Fantasy stock: ${darkFantasyAfter.stock_left} (Expected: ${darkFantasy.stock_left - 2})`);

    adminWs.close();
    if (darkFantasyAfter.stock_left === darkFantasy.stock_left - 2) {
        console.log('✅ TEST PASSED: Stock was automatically deducted and updated!');
    } else {
        console.log('❌ TEST FAILED: Stock mismatch');
    }
}

testStockDeduction().catch(console.error);

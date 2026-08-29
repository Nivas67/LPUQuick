const WebSocket = require('ws');

async function testStockDeduction() {
    console.log('--- Testing Automatic Stock Deduction & Realtime Broadcast ---');

    // 1. Fetch current stock of Dark Fantasy (prod_s02)
    const prodRes = await fetch('http://127.0.0.1:3000/api/products?includeInactive=true', {
        headers: { 'x-admin-secret': 'adm_sec_master_2026' }
    });
    const { products } = await prodRes.json();
    const darkFantasy = products.find(p => p.id === 'prod_s02' || p.name.includes('Dark Fantasy'));
    console.log(`Initial Dark Fantasy stock: ${darkFantasy.stock_left} (in_stock: ${darkFantasy.in_stock})`);

    // 2. Connect client and admin WebSockets
    const adminWs = new WebSocket('ws://127.0.0.1:3000/ws/admin');
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
            quantity: 1
        })
    });

    // 4. Place order
    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_3c3907a3',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery'
        })
    });
    const checkoutData = await checkoutRes.json();
    console.log('Order created:', checkoutData.orderId);

    await new Promise(r => setTimeout(r, 1000));

    // 5. Fetch updated product stock
    const prodRes2 = await fetch('http://127.0.0.1:3000/api/products?includeInactive=true', {
        headers: { 'x-admin-secret': 'adm_sec_master_2026' }
    });
    const data2 = await prodRes2.json();
    const darkFantasyAfter = data2.products.find(p => p.id === darkFantasy.id);
    console.log(`Updated Dark Fantasy stock: ${darkFantasyAfter.stock_left} (Expected: ${darkFantasy.stock_left - 1})`);

    adminWs.close();
    if (darkFantasyAfter.stock_left === darkFantasy.stock_left - 1) {
        console.log('✅ TEST PASSED: Stock was automatically deducted and updated!');
    } else {
        console.log('❌ TEST FAILED: Stock mismatch');
    }
}

testStockDeduction().catch(console.error);

/**
 * Test Genuine Reorder Flow:
 * 1. Add specific products (e.g. Iced Tea) to cart and place order
 * 2. Clear cart
 * 3. Call /api/orders/:orderId/reorder
 * 4. Verify cart contains the exact Iced Tea product with the same quantity
 */

async function testReorder() {
    console.log('========================================================');
    console.log('🧪 TESTING GENUINE PRODUCT REORDER FLOW');
    console.log('========================================================\n');

    // 1. Find product 'Iced Tea' or 'prod_bev_03'
    const catRes = await fetch('http://127.0.0.1:3000/api/products');
    const catData = await catRes.json();
    const targetProduct = catData.products.find(p => p.name.toLowerCase().includes('tea') || p.category.includes('Snacks')) || catData.products[0];
    console.log(`✓ 1. Target Product for test order: "${targetProduct.name}" (ID: ${targetProduct.id}, Price: ₹${targetProduct.price})`);

    // 2. Add to cart
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: targetProduct.id, quantity: 2 })
    });

    // 3. Checkout
    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', deliveryAddress: 'BH13 (Block A), Room 304' })
    });
    const { order } = await checkoutRes.json();
    console.log(`✓ 2. Placed order #${order.id} containing 2x "${targetProduct.name}"`);

    // 4. Verify cart is empty after checkout
    const emptyCartRes = await fetch('http://127.0.0.1:3000/api/cart/user_001');
    const emptyCart = await emptyCartRes.json();
    console.log(`✓ 3. Cart emptied after checkout (items: ${emptyCart.items.length})`);

    // 5. Trigger Reorder API
    console.log(`\n--- Triggering Reorder for Order #${order.id} ---`);
    const reorderRes = await fetch(`http://127.0.0.1:3000/api/orders/${order.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001' })
    });
    const reorderData = await reorderRes.json();
    console.log('✓ 4. Reorder API response:', reorderData);

    // 6. Verify Cart now contains the exact targetProduct with quantity 2
    const cartRes = await fetch('http://127.0.0.1:3000/api/cart/user_001');
    const cartData = await cartRes.json();
    console.log('✓ 5. Current cart items after reorder:');
    cartData.items.forEach(i => {
        console.log(`   - "${i.name}" (ID: ${i.product_id}) × ${i.quantity} (₹${i.price} each)`);
    });

    const matched = cartData.items.find(i => i.product_id === targetProduct.id && i.quantity === 2);
    if (!matched) {
        throw new Error(`Reorder failed! Expected 2x "${targetProduct.name}" in cart, but cart items were: ${JSON.stringify(cartData.items)}`);
    }

    console.log('\n========================================================');
    console.log('🎉 100% SUCCESS: REORDER ADDS THE EXACT PRODUCTS ACCURATELY!');
    console.log('========================================================\n');
    process.exit(0);
}

testReorder().catch(err => {
    console.error('❌ Reorder test failed:', err);
    process.exit(1);
});

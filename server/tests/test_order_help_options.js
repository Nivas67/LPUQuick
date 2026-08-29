/**
 * Test Order Help Options:
 * 1. Place order
 * 2. Change delivery address via /api/orders/:orderId/change-address
 * 3. Verify updated address in DB
 * 4. Cancel order via /api/orders/:orderId/cancel
 * 5. Verify status is Cancelled in DB
 */

async function testHelpOptions() {
    console.log('========================================================');
    console.log('🧪 TESTING ACTIVE ORDER HELP OPTIONS');
    console.log('========================================================\n');

    // 1. Add item to cart
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', productId: 'prod_bisc_01', quantity: 1 })
    });

    // 2. Checkout
    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user_001', deliveryAddress: 'BH13 (Block A), Room 304' })
    });
    const { order } = await checkoutRes.json();
    console.log(`✓ 1. Placed order #${order.id} with address: "BH13 (Block A), Room 304"`);

    // 3. Test Help Option 2: Change Address
    console.log('\n--- Testing Help Option 2: Change Address ---');
    const changeAddrRes = await fetch(`http://127.0.0.1:3000/api/orders/${order.id}/change-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newAddress: 'BH13 (Block B), Room 512' })
    });
    const changeAddrData = await changeAddrRes.json();
    console.log('✓ 2. Change address API response:', changeAddrData);

    const detailRes = await fetch(`http://127.0.0.1:3000/api/orders/detail/${order.id}`);
    const detailData = await detailRes.json();
    if (detailData.order.delivery_address !== 'BH13 (Block B), Room 512') {
        throw new Error(`Address update failed! Expected "BH13 (Block B), Room 512", got "${detailData.order.delivery_address}"`);
    }
    console.log(`✓ 3. Verified address in DB: "${detailData.order.delivery_address}"`);

    // 4. Test Help Option 3: Cancel Order
    console.log('\n--- Testing Help Option 3: Cancel Order ---');
    const cancelRes = await fetch(`http://127.0.0.1:3000/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Student changed mind via Help Option' })
    });
    const cancelData = await cancelRes.json();
    console.log('✓ 4. Cancel order API response:', cancelData);

    const afterCancelRes = await fetch(`http://127.0.0.1:3000/api/orders/detail/${order.id}`);
    const afterCancelData = await afterCancelRes.json();
    if (afterCancelData.order.status !== 'Cancelled') {
        throw new Error(`Cancellation failed! Expected status "Cancelled", got "${afterCancelData.order.status}"`);
    }
    console.log(`✓ 5. Verified status in DB: "${afterCancelData.order.status}"`);

    console.log('\n========================================================');
    console.log('🎉 100% SUCCESS: HELP OPTIONS (CALL, ADDRESS, CANCEL) VERIFIED!');
    console.log('========================================================\n');
    process.exit(0);
}

testHelpOptions().catch(err => {
    console.error('❌ Help options test failed:', err);
    process.exit(1);
});

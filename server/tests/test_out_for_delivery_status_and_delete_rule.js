const assert = require('assert');
const fs = require('fs');

async function testOutForDeliveryStatusAndNoDelete() {
    console.log('================================================================');
    console.log('🧪 TESTING OUT FOR DELIVERY STATUS UPDATE & DELETE RESTRICTION');
    console.log('================================================================\n');

    // 1. Authenticate Admin
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'Nivas@2006$%' })
    });
    const loginData = await loginRes.json();
    assert(loginData.token, 'Admin login failed');
    const token = loginData.token;
    console.log('✓ 1. Admin login successful');

    // Ensure store is open for testing
    await fetch('http://127.0.0.1:3000/api/admin/client-lock', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    // Adjust stock for BH-13 to ensure item is available
    await fetch('http://127.0.0.1:3000/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            productId: 'prod_66755a4a',
            stock: 20,
            hostel_id: 'BH-13'
        })
    });

    // 2. Student places order
    await fetch('http://127.0.0.1:3000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'test_student_user_1',
            productId: 'prod_66755a4a',
            quantity: 2,
            hostelId: 'BH-13'
        })
    });

    const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'test_student_user_1',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            hostel_id: 'BH-13',
            items: [{ id: 'prod_66755a4a', product_id: 'prod_66755a4a', name: 'Dark Fantasy', price: 29, quantity: 2 }]
        })
    });
    const checkoutData = await checkoutRes.json();
    assert(checkoutData.success, 'Checkout failed: ' + JSON.stringify(checkoutData));
    const orderId = checkoutData.order.id;
    console.log(`✓ 2. Placed order #${orderId}`);

    // 3. Admin updates status to "Out for Delivery"
    const outForDeliveryRes = await fetch('http://127.0.0.1:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            orderId: orderId,
            status: 'Out for Delivery'
        })
    });
    const outData = await outForDeliveryRes.json();
    assert(outForDeliveryRes.ok && outData.success, 'Admin setting status to Out for Delivery failed: ' + JSON.stringify(outData));
    console.log('✓ 3. Admin successfully set status to "Out for Delivery"');

    // 4. Student attempts to cancel Out for Delivery order -> Must be REJECTED (HTTP 400)
    console.log('--- Testing Student Cancellation (Should be rejected) ---');
    const studentCancelRes = await fetch(`http://127.0.0.1:3000/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Student trying to cancel while en-route' })
    });
    const studentCancelData = await studentCancelRes.json();
    assert(studentCancelRes.status === 400, `Expected HTTP 400 for student cancel, got ${studentCancelRes.status}`);
    assert(studentCancelData.error && studentCancelData.error.includes('already out for delivery'), 'Expected already out for delivery error message');
    console.log('✓ 4. Student cancellation correctly REJECTED with 400:', studentCancelData.error);

    // 5. Admin updates Out for Delivery order to "Cancelled" -> Must SUCCEED (HTTP 200)
    console.log('--- Testing Admin Status Change to Cancelled (Should succeed) ---');
    const adminCancelRes = await fetch('http://127.0.0.1:3000/api/orders/admin/status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            orderId: orderId,
            status: 'Cancelled'
        })
    });
    const adminCancelData = await adminCancelRes.json();
    assert(adminCancelRes.ok && adminCancelData.success, 'Admin setting status to Cancelled failed: ' + JSON.stringify(adminCancelData));
    console.log('✓ 5. Admin successfully updated Out for Delivery order to "Cancelled" without error!');

    // 6. Verify client orders page does not contain any delete buttons
    console.log('--- Verifying Client Orders Page has no delete buttons ---');
    const clientOrdersCode = fs.readFileSync('client/js/pages/orders.js', 'utf8');
    const publicOrdersCode = fs.readFileSync('public/js/pages/orders.js', 'utf8');

    assert(!clientOrdersCode.includes('btn-delete-active-order'), 'client/js/pages/orders.js must not contain btn-delete-active-order');
    assert(!publicOrdersCode.includes('btn-delete-active-order'), 'public/js/pages/orders.js must not contain btn-delete-active-order');
    assert(!clientOrdersCode.includes("title=\"Delete Order"), 'client/js/pages/orders.js must not contain Delete Order title');
    assert(!publicOrdersCode.includes("title=\"Delete Order"), 'public/js/pages/orders.js must not contain Delete Order title');
    console.log('✓ 6. Verified: Delete order options are completely absent from user/client files!');

    // 7. Verify admin dashboard still has the delete button for owner only
    const adminCode = fs.readFileSync('admin/js/admin.js', 'utf8');
    assert(adminCode.includes('deleteOrderPermanently'), 'admin/js/admin.js must retain deleteOrderPermanently for owner');
    assert(adminCode.includes('isPlatformOwner'), 'admin/js/admin.js must retain isPlatformOwner check');
    console.log('✓ 7. Verified: Admin dashboard retains delete order capability strictly for owner account.');

    console.log('\n================================================================');
    console.log('🎉 100% SUCCESS: ALL BEHAVIOR VERIFIED!');
    console.log('================================================================\n');
}

testOutForDeliveryStatusAndNoDelete().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

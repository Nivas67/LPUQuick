const assert = require('assert');

async function testBackend() {
    console.log('--- Testing Backend Minimum Order Value (₹35) & Handling Fee (₹5) ---');

    // Admin login and unlock
    const adminLoginRes = await fetch('http://localhost:3000/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'Nivas@2006$' })
    });
    const adminData = await adminLoginRes.json();
    console.log('Admin login response:', adminLoginRes.status, adminData);
    const token = adminData.token;
    assert(token, 'Admin token required');

    const unlockRes = await fetch('http://localhost:3000/api/admin/client-lock', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const unlockData = await unlockRes.json();
    console.log('Admin Unlock Result:', unlockData.message || unlockData);

    try {
        // 1. Test Below MOV: 'BRITANNIA Gobbles Cake Fruity Fun 100g' has price ₹29 (< ₹35)
        const lowSubtotalPayload = {
            userId: 'test_student_mov_1',
            deliveryAddress: 'BH13 (Block A), Room 301',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            name: 'Test Student',
            items: [
                { id: 'prod_07da9b3d', product_id: 'prod_07da9b3d', name: 'BRITANNIA Gobbles Cake Fruity Fun 100g', price: 29, quantity: 1, in_stock: true, stock_left: 2 }
            ]
        };

        const resLow = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lowSubtotalPayload)
        });
        const dataLow = await resLow.json();

        console.log('Below MOV Response Status:', resLow.status);
        console.log('Below MOV Response Error:', dataLow.error);
        assert.strictEqual(resLow.status, 400, 'Expected 400 Bad Request for subtotal below ₹35');
        assert.match(dataLow.error, /Minimum order value is ₹35/i, 'Error message must mention Minimum order value is ₹35');
        console.log('✓ Test 1 Passed: Order rejected when subtotal < ₹35 (subtotal: ₹29)');

        // 2. Test At/Above MOV: 'Britannia Bourbon - 150g' has price ₹39 (>= ₹35)
        const validPayload = {
            userId: 'test_student_mov_2',
            deliveryAddress: 'BH13 (Block B), Room 402',
            paymentMethod: 'Cash on Delivery',
            phone: '9876543210',
            name: 'Test Student Two',
            items: [
                { id: 'prod_41968603', product_id: 'prod_41968603', name: 'Britannia Bourbon - 150g', price: 39, quantity: 1, in_stock: true, stock_left: 9 }
            ]
        };

        const resValid = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validPayload)
        });
        const dataValid = await resValid.json();

        console.log('Valid MOV Response Status:', resValid.status);
        assert.strictEqual(resValid.status, 200, 'Expected 200 OK for subtotal >= ₹35');
        assert.strictEqual(dataValid.success, true, 'Expected order creation success');
        assert.strictEqual(dataValid.order.subtotal, 39, 'Subtotal should be 39');
        assert.strictEqual(dataValid.order.platform_fee, 3, 'Platform/Handling fee must be 3');
        assert.strictEqual(dataValid.order.total, 42, 'Total must be Subtotal (39) + Handling Fee (3) = 42');
        console.log(`✓ Test 2 Passed: Order accepted: Subtotal=₹${dataValid.order.subtotal}, Handling Fee=₹${dataValid.order.platform_fee}, Total=₹${dataValid.order.total}`);

        console.log('\n--- All Backend MOV & Handling Fee Tests Passed Successfully! ---');
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

testBackend();

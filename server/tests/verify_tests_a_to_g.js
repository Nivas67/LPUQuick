require('dotenv').config();
const { generateAdminToken } = require('../middleware/adminAuth');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const ownerToken = generateAdminToken('user_admin_bh13', 'owner');
const storeManagerToken = generateAdminToken('user_2dae5b56', 'admin');

async function api(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    const res = await fetch(url, {
        ...options,
        headers
    });
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        data = text;
    }
    return { status: res.status, ok: res.ok, data };
}

async function getStock(productId, hostelId) {
    const res = await api(`/api/products/${productId}?hostel_id=${hostelId}&force=true&_t=${Date.now()}`);
    return res.data;
}

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        throw new Error(message);
    }
    console.log(`  ✓ ${message}`);
}

async function runTests() {
    console.log('====================================================');
    console.log('STARTING VERIFICATION OF TESTS A THROUGH G');
    console.log('====================================================\n');

    // ----------------------------------------------------
    // TEST A: Main Admin Deletes a Product
    // ----------------------------------------------------
    console.log('--- TEST A: Main Admin Deletes a Product ---');
    const testProdName = `Snack Delete Test ${Date.now()}`;
    const createRes = await api('/api/products/admin/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({
            name: testProdName,
            category: 'Snacks & Drinks',
            price: 50,
            stock_left: 10,
            hostel_id: 'BH-13'
        })
    });
    assert(createRes.status === 200 && createRes.data.success, 'Main Admin created test product successfully');
    const actualProdId = createRes.data.product?.id || createRes.data.productId;
    assert(Boolean(actualProdId), `Test product assigned ID: ${actualProdId}`);

    // Verify it exists in API
    const createdInApi = await getStock(actualProdId, 'BH-13');
    assert(createdInApi && createdInApi.id === actualProdId, 'Test product verified present in database');

    // Main Admin deletes the product
    const deleteRes = await api(`/api/products/admin/delete/${actualProdId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    assert(deleteRes.status === 200 && deleteRes.data.success, 'Main Admin deletion request succeeded with 200 OK');

    // Verify database confirms deletion (404 Not Found)
    const afterDeleteInApi = await api(`/api/products/${actualProdId}`);
    assert(afterDeleteInApi.status === 404, 'Database confirms test product is permanently removed (404 Not Found)');
    console.log('✅ Test A Passed: Main Admin successfully deleted product and database confirmed deletion.\n');

    // ----------------------------------------------------
    // TEST B: Store Manager Attempts Deletion
    // ----------------------------------------------------
    console.log('--- TEST B: Store Manager Attempts Deletion ---');
    const protectProdId = 'prod_a51d3f4b'; // Kurkure Masala Munch-84.9G
    const beforeStoreMgrDel = await getStock(protectProdId, 'BH-13');
    assert(beforeStoreMgrDel && beforeStoreMgrDel.id === protectProdId, 'Existing catalog product exists before test');

    const smDeleteRes = await api(`/api/products/admin/delete/${protectProdId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${storeManagerToken}` }
    });
    assert(smDeleteRes.status === 403, `Store manager deletion rejected with HTTP 403 (Got ${smDeleteRes.status})`);
    assert(smDeleteRes.data.code === 'FORBIDDEN' || (smDeleteRes.data.error && smDeleteRes.data.error.includes('Only the Main Admin')), 'Response explains forbidden reason');

    const afterSmDelInApi = await getStock(protectProdId, 'BH-13');
    assert(afterSmDelInApi && afterSmDelInApi.id === protectProdId, 'Catalog product remains completely unchanged in database');
    console.log('✅ Test B Passed: Store Manager deletion was rejected with 403 Forbidden and product remains intact.\n');

    // ----------------------------------------------------
    // TEST C: Update BH-5 Stock
    // ----------------------------------------------------
    console.log('--- TEST C: Update BH-5 Stock (Main Admin) ---');
    const targetProd = 'prod_a51d3f4b';

    // Step 1: Set initial stock BH-5 = 10, BH-13 = 25
    await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ productId: targetProd, stock: 10, hostel_id: 'BH-5' })
    });
    await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({ productId: targetProd, stock: 25, hostel_id: 'BH-13' })
    });

    let pBh5Init = await getStock(targetProd, 'BH-5');
    let pBh13Init = await getStock(targetProd, 'BH-13');
    assert(pBh5Init.stock_left === 10, `Initial BH-5 stock is 10 (Got ${pBh5Init.stock_left})`);
    assert(pBh13Init.stock_left === 25, `Initial BH-13 stock is 25 (Got ${pBh13Init.stock_left})`);

    // Step 2: Main Admin changes BH-5 stock to 15
    const adminUpdateRes = await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({
            productId: targetProd,
            stock: 15,
            hostel_id: 'BH-5'
        })
    });
    assert(adminUpdateRes.status === 200 && adminUpdateRes.data.success, 'Main Admin adjusted BH-5 stock to 15');

    // Step 3: Verify BH-5 is 15, BH-13 is strictly 25
    const pBh5AfterAdmin = await getStock(targetProd, 'BH-5');
    const pBh13AfterAdmin = await getStock(targetProd, 'BH-13');
    assert(pBh5AfterAdmin.stock_left === 15, `BH-5 stock is now 15 (Got ${pBh5AfterAdmin.stock_left})`);
    assert(pBh13AfterAdmin.stock_left === 25, `BH-13 stock remained completely unchanged at 25 (Got ${pBh13AfterAdmin.stock_left})`);
    console.log('✅ Test C Passed: Main Admin updated BH-5 stock to 15 while BH-13 remained strictly 25.\n');

    // ----------------------------------------------------
    // TEST D: Store Manager Updates Assigned Hostel
    // ----------------------------------------------------
    console.log('--- TEST D: Store Manager Updates Assigned Hostel (BH-5) ---');
    const smUpdateRes = await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${storeManagerToken}` },
        body: JSON.stringify({
            productId: targetProd,
            stock: 18,
            hostel_id: 'BH-5'
        })
    });
    assert(smUpdateRes.status === 200 && smUpdateRes.data.success, 'BH-5 Store Manager adjusted BH-5 stock to 18');

    const pBh5AfterSm = await getStock(targetProd, 'BH-5');
    const pBh13AfterSm = await getStock(targetProd, 'BH-13');
    assert(pBh5AfterSm.stock_left === 18, `BH-5 stock is now 18 (Got ${pBh5AfterSm.stock_left})`);
    assert(pBh13AfterSm.stock_left === 25, `BH-13 stock remained completely unchanged at 25 (Got ${pBh13AfterSm.stock_left})`);
    console.log('✅ Test D Passed: Store Manager successfully updated BH-5 to 18 without affecting BH-13.\n');

    // ----------------------------------------------------
    // TEST E: Unauthorized Hostel Update
    // ----------------------------------------------------
    console.log('--- TEST E: Unauthorized Hostel Update ---');
    const unauthorizedRes = await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${storeManagerToken}` },
        body: JSON.stringify({
            productId: targetProd,
            stock: 99,
            hostel_id: 'BH-13' // BH-5 Store Manager attempts to modify BH-13!
        })
    });
    assert(unauthorizedRes.status === 403, `Cross-hostel stock update rejected with 403 Forbidden (Got ${unauthorizedRes.status})`);

    const pBh13AfterUnauth = await getStock(targetProd, 'BH-13');
    const pBh5AfterUnauth = await getStock(targetProd, 'BH-5');
    assert(pBh13AfterUnauth.stock_left === 25, `BH-13 stock is completely unmodified at 25 (Got ${pBh13AfterUnauth.stock_left})`);
    assert(pBh5AfterUnauth.stock_left === 18, `BH-5 stock is completely unmodified at 18 (Got ${pBh5AfterUnauth.stock_left})`);
    console.log('✅ Test E Passed: Unauthorized hostel update was rejected with 403 and no inventory was modified.\n');

    // ----------------------------------------------------
    // TEST F: Cancellation Isolation
    // ----------------------------------------------------
    console.log('--- TEST F: Cancellation Isolation ---');
    // Fetch initial store lock state
    const lockCheck = await api('/api/admin/client-lock', {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const origLock = lockCheck.data?.availability;

    // Check BH-5 hostel status and activate if OFF
    const hostelsRes = await api('/api/admin/hostels', {
        headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const bh5Hostel = (hostelsRes.data?.hostels || []).find(h => h.id === 'BH-5');
    const wasBh5Off = bh5Hostel?.status === 'OFF';
    if (wasBh5Off) {
        await api('/api/admin/hostels/BH-5/activate', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
    }

    // Temporarily unlock store if locked so test checkout succeeds
    if (origLock?.is_locked) {
        await api('/api/admin/client-lock', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
    }

    try {
        // Stock before order: BH-5 = 18, BH-13 = 25
        const checkoutRes = await api('/api/checkout/place', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({
                userId: 'user_admin_bh13',
                customerName: 'Test Student',
                customerPhone: '9876543210',
                customerEmail: 'student@lpu.in',
                hostel_id: 'BH-5',
                deliveryAddress: '[BH-5] Room 202',
                paymentMethod: 'Cash on Delivery',
                items: [{
                    id: targetProd,
                    product_id: targetProd,
                    name: 'Kurkure Masala Munch-84.9G',
                    quantity: 2,
                    price: 50
                }]
            })
        });
        if (checkoutRes.status !== 200 || !checkoutRes.data.success) {
            console.error('Checkout error response:', checkoutRes.status, checkoutRes.data);
        }
        assert(checkoutRes.status === 200 && checkoutRes.data.success, 'Checkout placed successfully for BH-5 with 2 units');
        const createdOrderId = checkoutRes.data.order?.id || checkoutRes.data.orderId;
        assert(Boolean(createdOrderId), `Order created with ID: ${createdOrderId}`);

        // Check BH-5 stock decreased by 2 (18 - 2 = 16), and BH-13 remained 25
        const pBh5AfterOrder = await getStock(targetProd, 'BH-5');
        const pBh13AfterOrder = await getStock(targetProd, 'BH-13');
        assert(pBh5AfterOrder.stock_left === 16, `BH-5 stock decreased by 2 to 16 (Got ${pBh5AfterOrder.stock_left})`);
        assert(pBh13AfterOrder.stock_left === 25, `BH-13 stock remained unchanged at 25 (Got ${pBh13AfterOrder.stock_left})`);

        // Cancel the BH-5 order
        const cancelRes = await api(`/api/orders/${createdOrderId}/cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ reason: 'Customer test cancellation' })
        });
        assert(cancelRes.status === 200 && cancelRes.data.success, 'Cancellation request succeeded with 200 OK');

        // Verify stock restored to BH-5 only (16 + 2 = 18), and BH-13 still 25
        const pBh5AfterCancel = await getStock(targetProd, 'BH-5');
        const pBh13AfterCancel = await getStock(targetProd, 'BH-13');
        assert(pBh5AfterCancel.stock_left === 18, `BH-5 stock restored to 18 (Got ${pBh5AfterCancel.stock_left})`);
        assert(pBh13AfterCancel.stock_left === 25, `BH-13 stock strictly unaffected at 25 (Got ${pBh13AfterCancel.stock_left})`);

        // Repeated cancellation request (Idempotency check)
        const repeatCancelRes = await api(`/api/orders/${createdOrderId}/cancel`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${ownerToken}` },
            body: JSON.stringify({ reason: 'Customer repeated cancellation' })
        });
        assert(repeatCancelRes.status === 200, 'Repeated cancellation returned gracefully');

        const pBh5AfterRepeat = await getStock(targetProd, 'BH-5');
        assert(pBh5AfterRepeat.stock_left === 18, `Repeated cancellation DID NOT restore stock twice! BH-5 stock remains 18 (Got ${pBh5AfterRepeat.stock_left})`);
        console.log('✅ Test F Passed: Order cancellation restored stock to BH-5 only, without affecting BH-13, and repeated cancellations were idempotent.\n');
    } finally {
        if (origLock?.is_locked) {
            await api('/api/admin/client-lock', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${ownerToken}` },
                body: JSON.stringify({
                    lock_type: origLock.lock_type,
                    message: origLock.message,
                    start_at: origLock.start_at,
                    end_at: origLock.end_at,
                    hostel_id: 'ALL'
                })
            });
        }
        if (wasBh5Off) {
            await api('/api/admin/hostels/BH-5/deactivate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${ownerToken}` }
            });
        }
    }

    // ----------------------------------------------------
    // TEST G: Delayed Updates
    // ----------------------------------------------------
    console.log('--- TEST G: Delayed Updates (>10 seconds) ---');
    // Update BH-5 stock to 20
    const delayUpdateRes = await api('/api/products/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ownerToken}` },
        body: JSON.stringify({
            productId: targetProd,
            stock: 20,
            hostel_id: 'BH-5'
        })
    });
    assert(delayUpdateRes.status === 200 && delayUpdateRes.data.success, 'BH-5 stock updated to 20');

    console.log('  Waiting 11 seconds to verify no stale query or background process overwrites quantity...');
    await new Promise(r => setTimeout(r, 11000));

    // Fetch fresh from API
    const freshBh5 = await getStock(targetProd, 'BH-5');
    const freshBh13 = await getStock(targetProd, 'BH-13');

    assert(freshBh5 && freshBh5.stock_left === 20, `After delay, BH-5 stock remains 20 (Got ${freshBh5?.stock_left})`);
    assert(freshBh13 && freshBh13.stock_left === 25, `After delay, BH-13 stock remains 25 (Got ${freshBh13?.stock_left})`);
    console.log('✅ Test G Passed: Stock quantity remained correct and stable after 11 seconds.\n');

    console.log('====================================================');
    console.log('🎉 ALL TESTS A THROUGH G PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
}

runTests().then(() => {
    process.exit(0);
}).catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});

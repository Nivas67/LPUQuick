const { getSupabaseClient } = require('../server/supabase');

const BASE_URL = 'http://127.0.0.1:3000';

function isOrderCancellable(status) {
    if (!status) return false;
    const s = String(status).toLowerCase().trim();
    if (s.includes('out') || s.includes('route') || s.includes('dispatch') || s.includes('transit') || s.includes('deliver') || s.includes('cancel')) {
        return false;
    }
    return true;
}

async function runTests() {
    console.log('=== TEST 1: Client isOrderCancellable Helper Logic ===');
    const tests = [
        { status: 'Order Placed', expected: true },
        { status: 'Order Confirmed', expected: true },
        { status: 'Accepted', expected: true },
        { status: 'Preparing', expected: true },
        { status: 'Packing', expected: true },
        { status: 'Packed', expected: true },
        { status: 'Out for Delivery', expected: false },
        { status: 'Out For Delivery', expected: false },
        { status: 'In Transit', expected: false },
        { status: 'En Route', expected: false },
        { status: 'Dispatched', expected: false },
        { status: 'Delivered', expected: false },
        { status: 'Cancelled', expected: false }
    ];

    let clientPass = true;
    for (const t of tests) {
        const res = isOrderCancellable(t.status);
        if (res !== t.expected) {
            console.error(`❌ Failed: isOrderCancellable('${t.status}') returned ${res}, expected ${t.expected}`);
            clientPass = false;
        }
    }
    if (clientPass) {
        console.log('✅ PASS: All 13 client status cancellation checks passed!');
    }

    console.log('\n=== TEST 2: Backend Rejection When Order Is Out For Delivery ===');
    // Create a temporary test order with status 'Out for Delivery' in Supabase
    const supabase = getSupabaseClient();
    const testOrderId = `test_order_ofd_${Date.now()}`;
    
    await supabase.from('orders').insert({
        id: testOrderId,
        user_id: 'user_admin_bh13',
        status: 'Out for Delivery',
        total: 100,
        subtotal: 100,
        delivery_fee: 0,
        payment_method: 'COD',
        delivery_address: 'BH13 Room 101',
        created_at: new Date().toISOString()
    });

    const ofdCancelRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Student cancelled' })
    });
    const ofdCancelData = await ofdCancelRes.json();
    console.log('Out for Delivery cancel response status:', ofdCancelRes.status);
    console.log('Response body:', ofdCancelData);

    if (ofdCancelRes.status === 400 && ofdCancelData.error?.includes('already out for delivery')) {
        console.log('✅ PASS: Backend successfully blocked cancellation of Out for Delivery order!');
    } else {
        console.error('❌ FAIL: Backend should return 400 rejection for Out for Delivery order');
    }

    console.log('\n=== TEST 3: Backend Rejection When Order Is Delivered ===');
    await supabase.from('orders').update({ status: 'Delivered' }).eq('id', testOrderId);

    const delCancelRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Student cancelled' })
    });
    const delCancelData = await delCancelRes.json();
    console.log('Delivered cancel response status:', delCancelRes.status);
    console.log('Response body:', delCancelData);

    if (delCancelRes.status === 400 && delCancelData.error?.includes('already been delivered')) {
        console.log('✅ PASS: Backend successfully blocked cancellation of Delivered order!');
    } else {
        console.error('❌ FAIL: Backend should return 400 rejection for Delivered order');
    }

    console.log('\n=== TEST 4: Backend Allows Cancellation Before Out For Delivery ===');
    await supabase.from('orders').update({ status: 'Order Confirmed' }).eq('id', testOrderId);

    const confCancelRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Need to change items' })
    });
    const confCancelData = await confCancelRes.json();
    console.log('Confirmed order cancel response status:', confCancelRes.status);
    console.log('Response body:', confCancelData);

    if (confCancelRes.status === 200 && confCancelData.success === true) {
        console.log('✅ PASS: Order before Out for Delivery cancelled successfully!');
    } else {
        console.error('❌ FAIL: Order before Out for Delivery should be cancellable');
    }

    // Cleanup test order
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('\nCleaned up test order:', testOrderId);
}

runTests().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});

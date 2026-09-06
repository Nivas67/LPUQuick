const { generateAdminToken } = require('../server/middleware/adminAuth');
const supabaseDb = require('../server/db/supabaseDb');

async function runTests() {
    console.log('=== RUNNING MANDATORY DELIVERY PAYMENT OPTIONS VERIFICATION ===');
    
    // 1. Get an existing order from DB or cache
    const orders = await supabaseDb.orders.getAllOrders();
    if (!orders || orders.length === 0) {
        console.error('❌ No orders found in database to test.');
        process.exit(1);
    }

    const testOrder = orders[0];
    console.log(`Using test order ID: ${testOrder.id}, current status: ${testOrder.status}, total: ₹${testOrder.total}`);

    const adminToken = generateAdminToken('user_admin_bh13', 'owner');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-token': adminToken
    };

    // TEST 1: Mark as 'Delivered' WITHOUT paymentMethod -> Must return 400 Bad Request
    console.log('\n--- TEST 1: Status=Delivered WITHOUT paymentMethod (Expect 400 Validation Error) ---');
    const res1 = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            orderId: testOrder.id,
            status: 'Delivered'
            // paymentMethod omitted on purpose
        })
    });

    const body1 = await res1.json();
    console.log(`Response status: ${res1.status}, body:`, body1);
    if (res1.status === 400 && body1.error && body1.error.includes('mandatory')) {
        console.log('✅ TEST 1 PASSED: Correctly blocked marking as Delivered without mandatory payment option!');
    } else {
        console.error('❌ TEST 1 FAILED: Expected 400 with mandatory error message, got:', res1.status, body1);
        process.exit(1);
    }

    // TEST 2: Mark as 'Delivered' with paymentMethod: 'Cash' -> Must return 200 OK
    console.log('\n--- TEST 2: Status=Delivered with paymentMethod="Cash" (Expect 200 OK) ---');
    const res2 = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            orderId: testOrder.id,
            status: 'Delivered',
            paymentMethod: 'Cash',
            paymentStatus: 'PAID',
            paymentCollection: { mode: 'Cash', cash_amount: Number(testOrder.total), upi_amount: 0, total: Number(testOrder.total) }
        })
    });

    const body2 = await res2.json();
    console.log(`Response status: ${res2.status}, body:`, body2);
    if (res2.status === 200 && body2.success === true && body2.order && body2.order.payment_method === 'Cash' && body2.order.payment_status === 'PAID') {
        console.log('✅ TEST 2 PASSED: Successfully delivered with Cash option recorded!');
    } else {
        console.error('❌ TEST 2 FAILED: Expected 200 with payment_method=Cash and payment_status=PAID, got:', res2.status, body2);
        process.exit(1);
    }

    // TEST 3: Mark as 'Delivered' with paymentMethod: 'Both (Cash: ₹X, UPI: ₹Y)' -> Must return 200 OK
    console.log('\n--- TEST 3: Status=Delivered with paymentMethod="Both (Split)" (Expect 200 OK) ---');
    const total = Number(testOrder.total || 39);
    const cashPart = Math.floor(total / 2);
    const upiPart = total - cashPart;
    const splitMethod = `Both (Cash: ₹${cashPart}, UPI: ₹${upiPart})`;

    const res3 = await fetch('http://localhost:3000/api/orders/admin/status', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            orderId: testOrder.id,
            status: 'Delivered',
            paymentMethod: splitMethod,
            paymentStatus: 'PAID',
            paymentCollection: { mode: 'Both', cash_amount: cashPart, upi_amount: upiPart, total: total }
        })
    });

    const body3 = await res3.json();
    console.log(`Response status: ${res3.status}, body:`, body3);
    if (res3.status === 200 && body3.success === true && body3.order && body3.order.payment_method === splitMethod) {
        console.log('✅ TEST 3 PASSED: Successfully delivered with Both (Split) payment option recorded!');
    } else {
        console.error('❌ TEST 3 FAILED: Expected 200 with payment_method=' + splitMethod + ', got:', res3.status, body3);
        process.exit(1);
    }

    // TEST 4: Fetch order from DB to verify persistence in PostgreSQL
    console.log('\n--- TEST 4: PostgreSQL Persistence Check ---');
    const freshOrders = await supabaseDb.orders.getAllOrders();
    const freshOrder = freshOrders.find(x => x.id === testOrder.id);
    console.log(`DB Record -> status: ${freshOrder?.status}, payment_method: ${freshOrder?.payment_method}, payment_status: ${freshOrder?.payment_status}`);
    if (freshOrder && freshOrder.status === 'Delivered' && freshOrder.payment_method === splitMethod && freshOrder.payment_status?.toUpperCase() === 'PAID') {
        console.log('✅ TEST 4 PASSED: Database record matches payment options and status in PostgreSQL!');
    } else {
        console.error('❌ TEST 4 FAILED: DB values mismatch!');
        process.exit(1);
    }

    console.log('\n🎉 ALL 4 TESTS PASSED FLAWLESSLY! Mandatory payment options work end-to-end.');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Unhandled error running test suite:', err);
    process.exit(1);
});

const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yojndzstlilzlkxonmvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvam5kenN0bGlsemxreG9ubXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1NjYwMywiZXhwIjoyMTAzOTMyNjAzfQ.UiD72830z3goX1uk-lOKmdnikNNgkQ2dywnXrW3OTYg';

async function runMasterVerification() {
    console.log('================================================================');
    console.log('🧪 MASTER PERFORMANCE, STOCK & FINANCIAL ACCURACY VERIFICATION');
    console.log('================================================================');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Make sure store_main is unlocked
    await supabase.from('app_availability').update({ is_locked: false }).eq('id', 'store_main');

    // -------------------------------------------------------------
    // TEST 1: STOCK DECREMENT CYCLE (11 -> 10 -> 8)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Stock Decrement Cycle (11 -> 10 -> 8) ---');
    const testProdId = `prod_cycle_${Date.now()}`;
    await supabase.from('products').insert([{
        id: testProdId,
        name: 'Choco Delite Bar',
        category: 'Snacks & Drinks',
        subcategory: 'Chocolates',
        price: 20,
        cost_price: 12,
        tags: 'stock:11',
        in_stock: true
    }]);

    console.log(`  Created test product "${testProdId}" with initial stock = 11.`);

    // Order 1: qty = 1
    const order1Res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_test_cust_01',
            phone: '9876543210',
            deliveryAddress: 'BH13 (Block A), Room 304',
            paymentMethod: 'Cash on Delivery',
            items: [{ product_id: testProdId, quantity: 1 }]
        })
    });
    const order1Data = await order1Res.json();
    assert.strictEqual(order1Res.status, 200, `Order 1 failed: ${order1Data.error}`);
    console.log(`  ✓ Order 1 placed: ${order1Data.orderId}`);

    // Check stock after Order 1
    const { data: pAfter1 } = await supabase.from('products').select('*').eq('id', testProdId).single();
    const match1 = (pAfter1.tags || '').match(/stock:(\d+)/);
    const stock1 = match1 ? parseInt(match1[1], 10) : 0;
    console.log(`  Stock in DB after 1 order: ${stock1} (Expected: 10)`);
    assert.strictEqual(stock1, 10, 'Stock must decrement from 11 to 10');

    // Order 2: qty = 2
    const order2Res = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_test_cust_02',
            phone: '9876543211',
            deliveryAddress: 'BH13 (Block B), Room 402',
            paymentMethod: 'Cash on Delivery',
            items: [{ product_id: testProdId, quantity: 2 }]
        })
    });
    const order2Data = await order2Res.json();
    assert.strictEqual(order2Res.status, 200, `Order 2 failed: ${order2Data.error}`);
    console.log(`  ✓ Order 2 placed: ${order2Data.orderId}`);

    // Check stock after Order 2
    const { data: pAfter2 } = await supabase.from('products').select('*').eq('id', testProdId).single();
    const match2 = (pAfter2.tags || '').match(/stock:(\d+)/);
    const stock2 = match2 ? parseInt(match2[1], 10) : 0;
    console.log(`  Stock in DB after 2nd order: ${stock2} (Expected: 8)`);
    assert.strictEqual(stock2, 8, 'Stock must decrement from 10 to 8');

    // -------------------------------------------------------------
    // TEST 2: CONCURRENT OVERSELL GUARD (Stock = 1, 2 concurrent orders)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Concurrent Oversell Guard (Stock = 1, 2 Concurrent Orders) ---');
    const scarceProdId = `prod_scarce_${Date.now()}`;
    await supabase.from('products').insert([{
        id: scarceProdId,
        name: 'Scarce Energy Drink',
        category: 'Snacks & Drinks',
        subcategory: 'Drinks',
        price: 50,
        cost_price: 30,
        tags: 'stock:1',
        in_stock: true
    }]);
    console.log(`  Created scarce product with initial stock = 1.`);

    // Fire 2 concurrent checkout requests for qty = 1
    const [resA, resB] = await Promise.all([
        fetch(`${API_BASE}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_concurrent_A',
                phone: '9876543212',
                deliveryAddress: 'BH13 (Block A), Room 101',
                paymentMethod: 'Cash on Delivery',
                items: [{ product_id: scarceProdId, quantity: 1 }]
            })
        }),
        fetch(`${API_BASE}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_concurrent_B',
                phone: '9876543213',
                deliveryAddress: 'BH13 (Block A), Room 102',
                paymentMethod: 'Cash on Delivery',
                items: [{ product_id: scarceProdId, quantity: 1 }]
            })
        })
    ]);

    const dataA = await resA.json();
    const dataB = await resB.json();

    const successCount = (resA.status === 200 ? 1 : 0) + (resB.status === 200 ? 1 : 0);
    const rejectCount = (resA.status === 400 ? 1 : 0) + (resB.status === 400 ? 1 : 0);

    console.log(`  Concurrent Result: Successes = ${successCount}, Rejections = ${rejectCount}`);
    assert.strictEqual(successCount, 1, 'Exactly ONE concurrent order must succeed');
    assert.strictEqual(rejectCount, 1, 'Exactly ONE concurrent order must be rejected');

    const { data: pScarceAfter } = await supabase.from('products').select('*').eq('id', scarceProdId).single();
    const matchScarce = (pScarceAfter.tags || '').match(/stock:(\d+)/);
    const stockScarce = matchScarce ? parseInt(matchScarce[1], 10) : 0;
    console.log(`  Final stock in DB: ${stockScarce} (Expected: 0, NEVER -1)`);
    assert.strictEqual(stockScarce, 0, 'Final stock must be 0, never negative');
    assert.strictEqual(pScarceAfter.in_stock, false, 'Product must now be marked out of stock (in_stock = false)');

    // -------------------------------------------------------------
    // TEST 3: FINANCIAL REVENUE & PROFIT ACCURACY
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Authoritative Financial Calculations ---');
    // Login as Admin
    const loginRes = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const { token: adminToken } = await loginRes.json();

    // Unlock PIN 7788
    const unlockRes = await fetch(`${API_BASE}/admin/financial/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ pin: '7788' })
    });
    const { financial_token } = await unlockRes.json();

    // Mark Order 1 as Delivered (1 Choco Delite: selling ₹20, cost ₹12)
    await supabase.from('orders').update({ status: 'Delivered' }).eq('id', order1Data.orderId);

    // Mark Order 2 as Cancelled (must be excluded from revenue and profit)
    await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', order2Data.orderId);

    const finRes = await fetch(`${API_BASE}/admin/financial/data`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Financial-Token': financial_token }
    });
    const finData = await finRes.json();
    console.log('  Financial Metrics (Delivered Order 1: Selling ₹20, Cost ₹12):', finData.metrics);

    // Expected: Revenue = ₹20, Cost = ₹12, Profit = ₹8, Margin = 40.0%
    assert.strictEqual(finData.metrics.total_revenue, 20, 'Revenue must be ₹20');
    assert.strictEqual(finData.metrics.total_cost, 12, 'Cost must be ₹12');
    assert.strictEqual(finData.metrics.total_profit, 8, 'Profit must be ₹8');
    assert.strictEqual(finData.metrics.profit_margin, 40, 'Profit margin must be 40.0%');

    // -------------------------------------------------------------
    // TEST 4: CHECKOUT LATENCY BENCHMARK (AFTER)
    // -------------------------------------------------------------
    console.log('\n--- 4. Benchmarking Latency (AFTER) ---');
    const latStart = performance.now();
    const benchOrderRes = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_bench_cust',
            phone: '9876543215',
            deliveryAddress: 'BH13 (Block A), Room 204',
            paymentMethod: 'Cash on Delivery',
            items: [{ product_id: testProdId, quantity: 1 }]
        })
    });
    const benchLatency = performance.now() - latStart;
    const benchData = await benchOrderRes.json();
    console.log(`  Checkout Latency: ${benchLatency.toFixed(1)} ms (Baseline was 2757.2 ms)`);

    // Clean up all test orders, order items, and test products
    console.log('\n--- 5. Cleaning Up Test Fixtures ---');
    const testOrderIds = [order1Data.orderId, order2Data.orderId, benchData.orderId, dataA.orderId, dataB.orderId].filter(Boolean);
    for (const oid of testOrderIds) {
        await supabase.from('order_items').delete().eq('order_id', oid);
        await supabase.from('orders').delete().eq('id', oid);
    }
    await supabase.from('products').delete().in('id', [testProdId, scarceProdId]);
    await supabase.from('users').delete().in('id', ['user_test_cust_01', 'user_test_cust_02', 'user_concurrent_A', 'user_concurrent_B', 'user_bench_cust']);

    console.log('  ✓ Cleaned up all test orders and products.');

    console.log('\n================================================================');
    console.log('🎉 ALL TESTS PASSED! ATOMIC STOCK & FINANCIAL PRECISION VERIFIED!');
    console.log('================================================================\n');
}

runMasterVerification().catch(err => {
    console.error('\n❌ TEST SUITE FAILURE:', err);
    process.exit(1);
});

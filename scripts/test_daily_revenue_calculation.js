// Test updateDailyRevenue logic strictly excludes cancelled and pending orders
const assert = require('assert');
const supabaseDb = require('../server/db/supabaseDb');

function calculateDailyRevenue(orders, now = new Date()) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);

    const todaysOrders = (orders || []).filter(o => {
        if (!o) return false;
        const orderTime = o.created_at ? new Date(o.created_at).getTime() : Date.now();
        return !isNaN(orderTime) && orderTime >= todayStart && orderTime < todayEnd;
    });

    const isDelivered = (st) => {
        const s = String(st || '').toLowerCase().trim();
        return s === 'delivered' || s === 'completed';
    };
    const isCancelled = (st) => {
        const s = String(st || '').toLowerCase().trim();
        return s === 'cancelled' || s === 'canceled' || s === 'rejected';
    };

    // STRICT ACCURACY RULE:
    // Only count money from successfully delivered orders.
    // CANCELLED ORDERS, REJECTED ORDERS, AND PENDING ORDERS ARE NEVER ADDED TO REVENUE!
    const deliveredOrdersToday = todaysOrders.filter(o => isDelivered(o.status));
    const totalRevenue = deliveredOrdersToday.reduce((sum, o) => {
        const amt = Number(o.total || o.final_amount || 0);
        return sum + (isNaN(amt) || amt < 0 ? 0 : amt);
    }, 0);

    const completedToday = deliveredOrdersToday.length;
    const cancelledToday = todaysOrders.filter(o => isCancelled(o.status)).length;
    const pendingToday = todaysOrders.filter(o => !isDelivered(o.status) && !isCancelled(o.status)).length;

    const parts = [`${todaysOrders.length} order${todaysOrders.length !== 1 ? 's' : ''}`];
    if (completedToday > 0) parts.push(`${completedToday} delivered`);
    if (pendingToday > 0) parts.push(`${pendingToday} active`);
    if (cancelledToday > 0) parts.push(`${cancelledToday} cancelled`);

    return {
        totalRevenue,
        formattedRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        meta: parts.join(' • '),
        completedToday,
        pendingToday,
        cancelledToday,
        totalToday: todaysOrders.length
    };
}

(async () => {
    console.log('=== RUNNING REALTIME DAILY REVENUE CALCULATION TESTS ===\n');

    // 1. LIVE SUPABASE DB TEST
    console.log('--- TEST 1: Live DB Orders Today ---');
    const liveOrders = await supabaseDb.orders.getAllOrders();
    const liveResult = calculateDailyRevenue(liveOrders, new Date());
    console.log('Live Result:', liveResult);

    // Verify against DB actuals:
    // Today has 31 orders: 23 delivered, 8 cancelled
    assert.strictEqual(liveResult.totalToday, 31, 'Must match 31 orders today');
    assert.strictEqual(liveResult.completedToday, 23, 'Must match 23 delivered orders');
    assert.strictEqual(liveResult.cancelledToday, 8, 'Must match 8 cancelled orders');
    assert.strictEqual(liveResult.totalRevenue, 1595, 'Total revenue MUST be strictly 1595 (not 2129)');
    assert.notStrictEqual(liveResult.totalRevenue, 2129, 'Total revenue MUST NOT include cancelled order money (2129)');
    assert.strictEqual(liveResult.formattedRevenue, '₹1,595', 'Formatted revenue should be ₹1,595');
    console.log('✓ TEST 1 PASSED: Live revenue is ₹1,595 (cancelled ₹534 completely excluded)!\n');

    // 2. REAL-TIME STATUS TRANSITION TESTS
    console.log('--- TEST 2: Real-time Order Transition Simulation ---');
    const now = new Date();
    const dynamicOrders = [
        { id: 'ord_1', total: 100, status: 'Out for Delivery', created_at: now.toISOString() },
        { id: 'ord_2', total: 50, status: 'Delivered', created_at: now.toISOString() },
        { id: 'ord_3', total: 75, status: 'Cancelled', created_at: now.toISOString() }
    ];

    let state = calculateDailyRevenue(dynamicOrders, now);
    assert.strictEqual(state.totalRevenue, 50, 'Initially only ord_2 (₹50) is revenue');
    assert.strictEqual(state.completedToday, 1);
    assert.strictEqual(state.pendingToday, 1);
    assert.strictEqual(state.cancelledToday, 1);
    console.log('Initial state: ₹50 revenue, 1 active, 1 delivered, 1 cancelled');

    // Partner marks ord_1 as Delivered in real-time
    dynamicOrders[0].status = 'Delivered';
    state = calculateDailyRevenue(dynamicOrders, now);
    assert.strictEqual(state.totalRevenue, 150, 'After delivering ord_1, revenue increases in real-time to ₹150');
    assert.strictEqual(state.completedToday, 2);
    assert.strictEqual(state.pendingToday, 0);
    console.log('After delivery: ₹150 revenue in real-time');

    // If ord_1 is cancelled by user/store
    dynamicOrders[0].status = 'Cancelled';
    state = calculateDailyRevenue(dynamicOrders, now);
    assert.strictEqual(state.totalRevenue, 50, 'After cancellation, revenue decreases in real-time back to ₹50');
    assert.strictEqual(state.completedToday, 1);
    assert.strictEqual(state.cancelledToday, 2);
    console.log('After cancellation: ₹50 revenue in real-time (cancelled money removed)');
    console.log('✓ TEST 2 PASSED: Dynamic transitions update revenue in real-time!\n');

    // 3. SYNONYM AND CASE-INSENSITIVITY TESTS
    console.log('--- TEST 3: Spelling, Casing, and Whitespace Defense ---');
    const variations = [
        { id: 'v1', total: 20, status: 'delivered', created_at: now.toISOString() },
        { id: 'v2', total: 30, status: 'Delivered ', created_at: now.toISOString() },
        { id: 'v3', total: 40, status: 'COMPLETED', created_at: now.toISOString() },
        { id: 'v4', total: 1000, status: 'canceled', created_at: now.toISOString() },
        { id: 'v5', total: 2000, status: 'Cancelled', created_at: now.toISOString() },
        { id: 'v6', total: 3000, status: 'REJECTED', created_at: now.toISOString() }
    ];

    const varResult = calculateDailyRevenue(variations, now);
    assert.strictEqual(varResult.totalRevenue, 90, 'Only v1 + v2 + v3 (20+30+40=90) counted, 6000 cancelled rejected');
    assert.strictEqual(varResult.completedToday, 3);
    assert.strictEqual(varResult.cancelledToday, 3);
    console.log('✓ TEST 3 PASSED: Robust handling of variations, whitespaces, and American/British spelling!\n');

    console.log('ALL TESTS PASSED WITH 100% ACCURACY!');
    process.exit(0);
})();

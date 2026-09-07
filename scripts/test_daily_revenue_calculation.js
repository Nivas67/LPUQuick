// Test updateDailyRevenue logic strictly excludes cancelled and pending orders
const assert = require('assert');

function calculateDailyRevenue(orders, now = new Date()) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaysOrders = (orders || []).filter(o => {
        if (!o.created_at) return false;
        const orderTime = new Date(o.created_at).getTime();
        return orderTime >= todayStart;
    });

    const isDelivered = (st) => ['Delivered', 'delivered', 'completed', 'Completed'].includes(st);
    const isCancelled = (st) => ['Cancelled', 'cancelled', 'Rejected', 'rejected'].includes(st);

    // STRICT RULE: Only add money from successfully delivered orders; do not add cancelled or pending orders
    const deliveredOrdersToday = todaysOrders.filter(o => isDelivered(o.status));
    const totalRevenue = deliveredOrdersToday.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const completedToday = deliveredOrdersToday.length;
    const pendingToday = todaysOrders.filter(o => !isDelivered(o.status) && !isCancelled(o.status)).length;
    const cancelledToday = todaysOrders.filter(o => isCancelled(o.status)).length;

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

// Test case mimicking user screenshot:
// 28 orders today: 21 delivered (₹50 each = ₹1,050), 6 cancelled (₹150 each = ₹900), 1 pending (₹30)
const now = new Date();
const mockOrders = [];

for (let i = 1; i <= 21; i++) {
    mockOrders.push({
        id: `order_del_${i}`,
        total: 50,
        status: 'Delivered',
        created_at: new Date(now.getTime() - i * 60000).toISOString()
    });
}

for (let i = 1; i <= 6; i++) {
    mockOrders.push({
        id: `order_can_${i}`,
        total: 150,
        status: 'Cancelled',
        created_at: new Date(now.getTime() - i * 120000).toISOString()
    });
}

mockOrders.push({
    id: 'order_pend_1',
    total: 30,
    status: 'Order Placed',
    created_at: new Date(now.getTime() - 10000).toISOString()
});

const result = calculateDailyRevenue(mockOrders, now);

console.log('Test Result:', result);

// Verify revenue equals strictly delivered orders: 21 * 50 = 1050
assert.strictEqual(result.totalRevenue, 1050, 'Total revenue must be strictly 1050 (from delivered orders)');
assert.strictEqual(result.formattedRevenue, '₹1,050', 'Formatted revenue should be ₹1,050');
assert.strictEqual(result.completedToday, 21, 'Must have 21 delivered');
assert.strictEqual(result.cancelledToday, 6, 'Must have 6 cancelled');
assert.strictEqual(result.pendingToday, 1, 'Must have 1 pending');
assert.strictEqual(result.totalToday, 28, 'Must have 28 total orders');

console.log('✓ All assertions passed: Cancelled orders and pending orders are strictly excluded from Today\'s Revenue!');

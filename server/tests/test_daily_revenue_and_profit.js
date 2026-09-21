const assert = require('assert');
const http = require('http');
const financialEngine = require('../utils/financialEngine');
const app = require('../app');

async function runTests() {
    console.log('====================================================');
    console.log('🧪 TESTING DEDICATED DAILY REVENUE & PROFIT SYSTEM');
    console.log('====================================================');

    // TEST 1: STRICT CALCULATION RULES (DELIVERED ONLY, CANCELLED = ₹0)
    console.log('\n[1/4] Testing Unit Engine: Strict Delivered-Only Calculation...');
    const mockOrders = [
        {
            id: 'ord_deliv_1',
            total: 100,
            status: 'Delivered',
            created_at: '2026-09-22T08:00:00Z',
            customer_name: 'Student 1',
            delivery_address: 'BH13 101'
        },
        {
            id: 'ord_canc_1',
            total: 250,
            status: 'Cancelled',
            created_at: '2026-09-22T09:00:00Z',
            customer_name: 'Student 2',
            delivery_address: 'BH13 102'
        },
        {
            id: 'ord_rej_1',
            total: 180,
            status: 'Rejected',
            created_at: '2026-09-22T09:30:00Z',
            customer_name: 'Student 3',
            delivery_address: 'BH13 103'
        },
        {
            id: 'ord_pend_1',
            total: 500,
            status: 'Preparing',
            created_at: '2026-09-22T10:00:00Z',
            customer_name: 'Student 4',
            delivery_address: 'BH13 104'
        },
        {
            id: 'ord_deliv_2',
            total: 150,
            status: 'Completed',
            created_at: '2026-09-21T14:00:00Z',
            customer_name: 'Student 5',
            delivery_address: 'BH13 105'
        }
    ];

    const mockItems = [
        { order_id: 'ord_deliv_1', product_id: 'p1', quantity: 2, unit_price: 50, products: { cost_price: 30, name: 'Snack A' } },
        { order_id: 'ord_canc_1', product_id: 'p2', quantity: 5, unit_price: 50, products: { cost_price: 25, name: 'Snack B' } },
        { order_id: 'ord_deliv_2', product_id: 'p3', quantity: 3, unit_price: 50, products: { cost_price: 35, name: 'Snack C' } }
    ];

    const result = financialEngine.calculateDayWiseFinancials(mockOrders, mockItems, {});
    
    // Assert summary totals
    assert.strictEqual(result.summary.total_delivered_orders, 2, 'Only 2 delivered orders should count');
    assert.strictEqual(result.summary.total_cancelled_orders, 2, '2 cancelled/rejected orders should be tracked');
    assert.strictEqual(result.summary.total_pending_orders, 1, '1 pending order should be tracked');
    // Revenue should be only ord_deliv_1 (100) + ord_deliv_2 (150) = 250
    assert.strictEqual(result.summary.total_revenue, 250, 'Total revenue must be strictly from delivered orders (₹250)');
    // Cost: (2 * 30) + (3 * 35) = 60 + 105 = 165
    assert.strictEqual(result.summary.total_cost, 165, 'Total cost must be 60 + 105 = 165');
    // Profit: 250 - 165 = 85
    assert.strictEqual(result.summary.total_profit, 85, 'Total profit must be 250 - 165 = 85');
    // Profit margin: (85 / 250) * 100 = 34%
    assert.strictEqual(result.summary.overall_profit_margin, 34, 'Profit margin should be 34%');

    // Assert day-level breakdown
    const day22 = result.days.find(d => d.date === '2026-09-22');
    assert(day22, 'Day 2026-09-22 must exist');
    assert.strictEqual(day22.delivered_count, 1, 'Day 22 must have exactly 1 delivered order');
    assert.strictEqual(day22.cancelled_count, 2, 'Day 22 must have 2 cancelled/rejected orders');
    assert.strictEqual(day22.pending_count, 1, 'Day 22 must have 1 pending order');
    assert.strictEqual(day22.revenue, 100, 'Day 22 revenue must be ₹100');
    assert.strictEqual(day22.cost, 60, 'Day 22 cost must be ₹60');
    assert.strictEqual(day22.profit, 40, 'Day 22 profit must be ₹40');

    const day21 = result.days.find(d => d.date === '2026-09-21');
    assert(day21, 'Day 2026-09-21 must exist');
    assert.strictEqual(day21.delivered_count, 1, 'Day 21 must have 1 delivered order');
    assert.strictEqual(day21.revenue, 150, 'Day 21 revenue must be ₹150');
    assert.strictEqual(day21.cost, 105, 'Day 21 cost must be ₹105');
    assert.strictEqual(day21.profit, 45, 'Day 21 profit must be ₹45');

    console.log('✓ Strict delivered-only revenue and profit calculation verified 100%!');

    // TEST 2: DATE RANGE FILTERING
    console.log('\n[2/4] Testing Range Filters (today, yesterday, date bounds)...');
    const filterToday = financialEngine.calculateDayWiseFinancials(mockOrders, mockItems, {}, { range: 'today' });
    assert.strictEqual(filterToday.days.length, 1, 'Should return only 1 day for range=today');
    assert.strictEqual(filterToday.days[0].date, financialEngine.getISTDateString(new Date()), 'Date must match today IST');

    const filterRange = financialEngine.calculateDayWiseFinancials(mockOrders, mockItems, {}, {
        startDate: '2026-09-21',
        endDate: '2026-09-21'
    });
    assert.strictEqual(filterRange.days.length, 1, 'Custom range should return only 2026-09-21');
    assert.strictEqual(filterRange.days[0].date, '2026-09-21');
    console.log('✓ Date range filtering verified 100%!');

    // Start local express test server
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const BASE_URL = `http://localhost:${port}/api`;
    console.log(`\n(Test server running on port ${port})`);

    try {
        // TEST 3: OWNER-ONLY ACCESS CONTROL
        console.log('\n[3/4] Testing Owner-Only Security Guard...');
        const { generateAdminToken } = require('../middleware/adminAuth');
        const ownerToken = generateAdminToken('user_admin_bh13', 'owner');
        const staffToken = generateAdminToken('admin_5dcb05eba7', 'admin');

        // Non-Owner attempts to access daily-breakdown -> MUST GET 403 FORBIDDEN
        const staffAttemptRes = await fetch(`${BASE_URL}/admin/financial/daily-breakdown`, {
            headers: { 'Authorization': `Bearer ${staffToken}` }
        });
        const staffAttemptData = await staffAttemptRes.json();
        assert.strictEqual(staffAttemptRes.status, 403, 'Non-owner must be blocked with 403 Forbidden');
        assert.strictEqual(staffAttemptData.code, 'FORBIDDEN_OWNER_ONLY', 'Error code must be FORBIDDEN_OWNER_ONLY');
        console.log('✓ Non-owner staff access safely blocked with 403 FORBIDDEN_OWNER_ONLY.');

        // TEST 4: OWNER ACCESS & LIVE DATABASE ENDPOINT VERIFICATION
        console.log('\n[4/4] Testing Owner Unlocked Daily Breakdown against Live DB...');
        // First check with owner token (when locked)
        const ownerLockedRes = await fetch(`${BASE_URL}/admin/financial/daily-breakdown`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const ownerLockedData = await ownerLockedRes.json();
        assert.strictEqual(ownerLockedRes.status, 403, 'Should require PIN when locked');
        assert.strictEqual(ownerLockedData.locked, true, 'Must return locked: true');

        // Issue authorized financial token for owner session
        const financialRouter = require('../routes/financial');
        const tokenData = financialRouter.issueFinancialToken('user_admin_bh13');
        const finToken = tokenData.token;
        assert(finToken, 'Must receive financial session token');

        // Fetch daily breakdown with valid financial token
        const dailyRes = await fetch(`${BASE_URL}/admin/financial/daily-breakdown`, {
            headers: {
                'Authorization': `Bearer ${ownerToken}`,
                'X-Financial-Token': finToken
            }
        });
        const dailyData = await dailyRes.json();
        assert.strictEqual(dailyRes.status, 200, 'Daily breakdown request should succeed');
        assert.strictEqual(dailyData.success, true);
        assert.strictEqual(dailyData.locked, false);
        assert(dailyData.summary, 'Must contain summary');
        assert(Array.isArray(dailyData.days), 'Must contain days array');
        assert(dailyData.days.length > 0, 'Must have recorded days from Supabase');

        console.log(`✓ Live Daily Breakdown:`);
        console.log(`  - Total Days: ${dailyData.summary.days_count}`);
        console.log(`  - Total Delivered Orders: ${dailyData.summary.total_delivered_orders}`);
        console.log(`  - Total Excluded (Cancelled/Non-delivered): ${dailyData.summary.total_cancelled_orders}`);
        console.log(`  - Total Realized Revenue: ${dailyData.summary.formatted_total_revenue}`);
        console.log(`  - Total Realized Profit: ${dailyData.summary.formatted_total_profit}`);
        console.log(`  - Overall Net Margin: ${dailyData.summary.overall_profit_margin}%`);
        console.log(`  - Most Recent Day: ${dailyData.days[0].display_date} (Delivered: ${dailyData.days[0].delivered_count}, Rev: ${dailyData.days[0].formatted_revenue}, Profit: ${dailyData.days[0].formatted_profit})`);

        console.log('\n====================================================');
        console.log('🎉 ALL DAILY REVENUE & PROFIT TESTS PASSED 100%!');
        console.log('====================================================');
    } finally {
        server.close();
    }
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

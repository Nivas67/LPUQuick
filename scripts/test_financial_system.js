/**
 * Automated Verification Test Suite for LPUQuick Financial & Revenue Calculation System
 * Verifies all 17 requirements, Test Cases 1-4, DB figures, and Security.
 */

const assert = require('assert');
const {
    isDelivered,
    isCancelled,
    isPending,
    getISTDateString,
    calculateProductProfit,
    calculateItemFinancials,
    calculateOrderFinancials,
    calculateDailySummary,
    calculateTotalFinancials,
    formatINR
} = require('../server/utils/financialEngine');

const { products, orders } = require('../server/db/supabaseDb');

async function runTests() {
    console.log('\n======================================================');
    console.log('🚀 LPUQUICK FINANCIAL SYSTEM AUTOMATED VERIFICATION 🚀');
    console.log('======================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    async function testAsync(name, fn) {
        try {
            await fn();
            console.log(`  ✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ FAIL: ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    // -------------------------------------------------------------
    // Requirement 1 & 7: Product-Level Profit Calculation
    // -------------------------------------------------------------
    console.log('--- 1. Product-Level Profit Formulas ---');

    test('Formula: Profit = Selling Price - Admin Cost (MRP never used)', () => {
        const p1 = calculateProductProfit({ cost_price: 20, mrp: 30, price: 25 });
        assert.strictEqual(p1.profit_per_unit, 5, 'Profit should be 25 - 20 = 5');
        assert.strictEqual(p1.profit_margin_pct, 20, 'Margin should be (5/25)*100 = 20%');

        // Test with different MRP: MRP change must NOT change profit
        const p2 = calculateProductProfit({ cost_price: 20, mrp: 100, price: 25 });
        assert.strictEqual(p2.profit_per_unit, 5, 'MRP 100 should not affect profit');
        assert.strictEqual(p2.profit_margin_pct, 20, 'MRP 100 should not affect margin');
    });

    test('Safe Zero Price Handling: No Division by Zero', () => {
        const pZero = calculateProductProfit({ cost_price: 10, mrp: 0, price: 0 });
        assert.strictEqual(pZero.profit_per_unit, 0);
        assert.strictEqual(pZero.profit_margin_pct, 0);
        assert.strictEqual(isFinite(pZero.profit_margin_pct), true);
    });

    // -------------------------------------------------------------
    // Requirement 15: Mandated Test Cases 1 - 4
    // -------------------------------------------------------------
    console.log('\n--- 2. Mandated Test Cases (Cases 1 - 4) ---');

    test('CASE 1: Delivered Order (Cost 20, MRP 30, Selling 25, Qty 2)', () => {
        const item = { admin_cost: 20, mrp: 30, selling_price: 25, quantity: 2 };
        const order = { status: 'Delivered', items: [item] };
        const result = calculateOrderFinancials(order);

        assert.strictEqual(result.revenue, 50, 'Revenue must be 25 * 2 = 50');
        assert.strictEqual(result.cost, 40, 'Cost must be 20 * 2 = 40');
        assert.strictEqual(result.profit, 10, 'Profit must be 50 - 40 = 10');
        assert.strictEqual(result.isDelivered, true);
    });

    test('CASE 2: Cancelled Order (Cost 20, MRP 30, Selling 25, Qty 2)', () => {
        const item = { admin_cost: 20, mrp: 30, selling_price: 25, quantity: 2 };
        const order = { status: 'Cancelled', items: [item] };
        const result = calculateOrderFinancials(order);

        assert.strictEqual(result.revenue, 0, 'Cancelled order revenue MUST be 0');
        assert.strictEqual(result.cost, 0, 'Cancelled order cost MUST be 0');
        assert.strictEqual(result.profit, 0, 'Cancelled order profit MUST be 0');
        assert.strictEqual(result.isCancelled, true);
        assert.strictEqual(result.isDelivered, false);
    });

    test('CASE 3: Multi-Status Today Orders (Delivered 100, Cancelled 200, Pending 150)', () => {
        const ordersList = [
            { id: '1', status: 'Delivered', total: 100, items: [{ selling_price: 100, quantity: 1 }] },
            { id: '2', status: 'Cancelled', total: 200, items: [{ selling_price: 200, quantity: 1 }] },
            { id: '3', status: 'Order Placed', total: 150, items: [{ selling_price: 150, quantity: 1 }] }
        ];
        const summary = calculateDailySummary(ordersList);

        assert.strictEqual(summary.revenue, 100, 'Today Revenue MUST be 100, NOT 450');
        assert.strictEqual(summary.delivered_count, 1);
        assert.strictEqual(summary.cancelled_count, 1);
        assert.strictEqual(summary.pending_count, 1);
        assert.strictEqual(summary.total_count, 3);
    });

    test('CASE 4: Higher Margin Product (Cost 50, MRP 80, Selling 70, Qty 5, Delivered)', () => {
        const item = { admin_cost: 50, mrp: 80, selling_price: 70, quantity: 5 };
        const order = { status: 'Completed', items: [item] };
        const result = calculateOrderFinancials(order);

        assert.strictEqual(result.revenue, 350, 'Revenue must be 70 * 5 = 350');
        assert.strictEqual(result.cost, 250, 'Cost must be 50 * 5 = 250');
        assert.strictEqual(result.profit, 100, 'Profit must be 350 - 250 = 100');
        assert.strictEqual(result.margin_pct, 28.57, 'Profit Margin must be 28.57%');
    });

    // -------------------------------------------------------------
    // Requirement 3 & 4: Status Filtering & IST Timezone
    // -------------------------------------------------------------
    console.log('\n--- 3. Delivery Status Recognition & IST Timezone ---');

    test('Status filtering: Only Delivered/Completed are recognized', () => {
        assert.strictEqual(isDelivered('Delivered'), true);
        assert.strictEqual(isDelivered('completed'), true);
        assert.strictEqual(isDelivered('DELIVERED'), true);
        assert.strictEqual(isDelivered('Cancelled'), false);
        assert.strictEqual(isDelivered('Rejected'), false);
        assert.strictEqual(isDelivered('Order Placed'), false);
        assert.strictEqual(isDelivered('Preparing'), false);
        assert.strictEqual(isDelivered('Out for Delivery'), false);
    });

    test('IST Timezone Safety: Indian Standard Time format', () => {
        const dateStr = getISTDateString(new Date('2026-09-19T04:22:57Z'));
        assert.strictEqual(dateStr, '2026-09-19', 'UTC 04:22 on 2026-09-19 is 09:52 AM in IST');
    });

    // -------------------------------------------------------------
    // Requirement 11: INR Currency Formatting
    // -------------------------------------------------------------
    console.log('\n--- 4. Currency Formatting (INR) ---');

    test('Indian Rupee Formatting', () => {
        assert.strictEqual(formatINR(100), '₹100');
        assert.strictEqual(formatINR(656), '₹656');
        assert.strictEqual(formatINR(1250.5), '₹1,250.50');
    });

    // -------------------------------------------------------------
    // Requirement 16: Live Database Verification (Screenshot Match)
    // -------------------------------------------------------------
    console.log('\n--- 5. Live Supabase Database Verification ---');

    await testAsync('Live DB Audit: Total Orders = 391, Delivered = 314, Cancelled = 77', async () => {
        const allOrders = await orders.getAllOrders();
        assert.strictEqual(allOrders.length, 391, 'Total orders must be 391');

        const delivered = allOrders.filter(o => isDelivered(o.status));
        const cancelled = allOrders.filter(o => isCancelled(o.status));
        assert.strictEqual(delivered.length, 314, 'Delivered orders must be 314');
        assert.strictEqual(cancelled.length, 77, 'Cancelled orders must be 77');
    });

    await testAsync('Live DB Today Orders: Exactly 13 orders, 11 delivered, 2 cancelled', async () => {
        const allOrders = await orders.getAllOrders();
        const todayIST = getISTDateString(new Date());
        const todaysOrders = allOrders.filter(o => getISTDateString(o.created_at) === todayIST);

        assert.strictEqual(todaysOrders.length, 13, 'Today orders must be exactly 13');
        const deliveredToday = todaysOrders.filter(o => isDelivered(o.status));
        const cancelledToday = todaysOrders.filter(o => isCancelled(o.status));
        assert.strictEqual(deliveredToday.length, 11, 'Today delivered must be 11');
        assert.strictEqual(cancelledToday.length, 2, 'Today cancelled must be 2');

        const todaySummary = calculateDailySummary(todaysOrders);
        assert.strictEqual(todaySummary.revenue, 656, "Today Revenue MUST be exactly ₹656 from 11 delivered orders!");
        console.log(`     Confirmed: ₹656 calculated ONLY from 11 delivered orders. 2 cancelled orders contributed ₹0.`);
    });

    // -------------------------------------------------------------
    // Requirement 13 & 14: Strict Role-Based Access Control (RBAC) Verification
    // -------------------------------------------------------------
    console.log('\n--- 6. Role-Based Privacy & Security Verification ---');

    await testAsync('Strict RBAC: Only Owner has owner privileges; Store Managers & Delivery Partners are blocked', async () => {
        const { generateAdminToken, verifyAdminToken } = require('../server/middleware/adminAuth');
        const { isPlatformOwnerToken } = require('../server/routes/products');

        const ownerToken = generateAdminToken('user_admin_bh13', 'owner');
        const storeManagerToken = generateAdminToken('user_sm_01', 'admin');
        const deliveryPartnerToken = generateAdminToken('user_del_01', 'delivery_person');
        const customerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid';

        assert.strictEqual(isPlatformOwnerToken(ownerToken), true, 'Owner token must be recognized as platform owner');
        assert.strictEqual(isPlatformOwnerToken(`Bearer ${ownerToken}`), true, 'Owner Bearer token must be recognized');
        assert.strictEqual(isPlatformOwnerToken(storeManagerToken), false, 'Store manager MUST NOT be recognized as owner');
        assert.strictEqual(isPlatformOwnerToken(deliveryPartnerToken), false, 'Delivery partner MUST NOT be recognized as owner');
        assert.strictEqual(isPlatformOwnerToken(customerToken), false, 'Customer token MUST NOT be recognized as owner');
        assert.strictEqual(isPlatformOwnerToken(null), false, 'Null token MUST NOT be recognized as owner');
        assert.strictEqual(isPlatformOwnerToken(''), false, 'Empty token MUST NOT be recognized as owner');

        console.log('     Confirmed: Platform Owner is granted access; Store Manager and Delivery Partner are strictly blocked.');
    });

    // -------------------------------------------------------------
    // Requirement 17: Accurate All-Time Historical Intelligence Calculations
    // -------------------------------------------------------------
    console.log('\n--- 7. Accurate All-Time Historical Intelligence Calculations ---');

    await testAsync('Historical Intelligence: Accurate Profit & Delivered Orders Count', async () => {
        const { getSupabaseClient } = require('../server/supabase');
        const supabase = getSupabaseClient();

        const { data: rawOrders } = await supabase
            .from('orders')
            .select('id, total, status, created_at')
            .order('created_at', { ascending: false });

        const deliveredOrders = (rawOrders || []).filter(o => isDelivered(o.status));
        const deliveredOrderIds = deliveredOrders.map(o => o.id);

        assert.strictEqual(deliveredOrders.length, 314, 'Delivered orders count must be 314');

        const { data: dbItems } = await supabase
            .from('order_items')
            .select('order_id, product_id, quantity, unit_price, products(id, name, price, cost_price, mrp)')
            .in('order_id', deliveredOrderIds);

        const totals = calculateTotalFinancials(deliveredOrders, dbItems || [], {});

        assert.strictEqual(totals.delivered_orders_count, 314, 'Delivered orders count must be 314, NOT 0');
        assert.strictEqual(totals.total_revenue, 19673, 'Total Revenue must be ₹19,673');
        assert.strictEqual(totals.total_cost, 13926, 'Total Cost must be ₹13,926');
        assert.strictEqual(totals.total_profit, 5747, 'Total Profit must be ₹5,747');
        assert.strictEqual(totals.profit_margin, 29.21, 'Net margin must be 29.21%');

        console.log(`     Confirmed: Gross Revenue = ₹${totals.total_revenue}, Net Profit = ₹${totals.total_profit} (${totals.profit_margin}%), Delivered Orders = ${totals.delivered_orders_count}.`);
    });

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
});

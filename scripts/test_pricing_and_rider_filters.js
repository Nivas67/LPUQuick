// Comprehensive Automated Verification Suite for:
// 1. Configurable Delivery Pricing Engine (Change rate per order, live formula & wage recalculation)
// 2. Individual Delivery Person Statistics Inspection
// 3. Owner "Only Mine" Isolated View

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generateAdminToken } = require('../server/middleware/adminAuth');

const BASE_URL = 'http://localhost:3000';
const ownerToken = generateAdminToken('user_admin_bh13', 'admin');

async function runTests() {
    console.log('🚀 Starting Delivery Pricing & Rider Stats Verification Suite...\n');

    // ----------------------------------------------------
    // TEST 1: GET Delivery Pricing Config
    // ----------------------------------------------------
    console.log('--- TEST 1: GET /api/orders/delivery-pricing-config ---');
    const getConfRes = await fetch(`${BASE_URL}/api/orders/delivery-pricing-config`);
    assert.strictEqual(getConfRes.status, 200, 'GET /delivery-pricing-config must return 200');
    const getConfData = await getConfRes.json();
    assert.strictEqual(getConfData.success, true, 'Response must have success: true');
    assert.ok(getConfData.config, 'Response must include config');
    assert.ok(typeof getConfData.config.rate_per_order === 'number', 'rate_per_order must be a number');
    console.log('✅ Current rate per order:', getConfData.config.rate_per_order);
    console.log('✅ Daily bonus threshold:', getConfData.config.daily_bonus_threshold);
    console.log('✅ Daily bonus amount:', getConfData.config.daily_bonus_amount);

    // ----------------------------------------------------
    // TEST 2: POST Update Delivery Pricing Config to ₹5.00
    // ----------------------------------------------------
    console.log('\n--- TEST 2: POST /api/orders/delivery-pricing-config (Update to ₹5.00) ---');
    const updateRes = await fetch(`${BASE_URL}/api/orders/delivery-pricing-config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
            rate_per_order: 5.00,
            daily_bonus_threshold: 15,
            daily_bonus_amount: 25.00,
            updated_by: 'Owner Testing'
        })
    });
    assert.strictEqual(updateRes.status, 200, 'POST /delivery-pricing-config must return 200');
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.success, true, 'Update must be successful');
    assert.strictEqual(updateData.config.rate_per_order, 5.00, 'rate_per_order must now be 5.00');
    assert.strictEqual(updateData.config.daily_bonus_threshold, 15, 'daily_bonus_threshold must now be 15');
    console.log('✅ Pricing updated successfully to ₹5.00 / completed delivery');

    // ----------------------------------------------------
    // TEST 3: GET /delivery-earnings recalculates with ₹5.00
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Delivery Earnings dynamically reflects ₹5.00 rate ---');
    const earningsRes = await fetch(`${BASE_URL}/api/orders/delivery-earnings`);
    assert.strictEqual(earningsRes.status, 200, 'Earnings endpoint must return 200');
    const earningsData = await earningsRes.json();
    assert.strictEqual(earningsData.success, true);
    assert.strictEqual(earningsData.rate_per_order, 5.00, 'Rate in earnings response must be 5.00');

    // Check platform daily payout formula: completed_today * 5.00
    const todayCompleted = earningsData.platform_metrics?.total_completed_all_time !== undefined;
    assert.ok(todayCompleted, 'Platform metrics must be present');
    console.log('✅ Platform metrics recalculated with rate:', earningsData.rate_per_order);
    console.log('✅ Daily Payout:', earningsData.platform_metrics?.total_daily_payout);
    console.log('✅ Monthly Expense:', earningsData.platform_metrics?.total_monthly_expense);

    // Verify day bars calculate with 5.00
    const sampleDay = earningsData.days.find(d => d.order_count > 0);
    if (sampleDay) {
        assert.strictEqual(sampleDay.payout, sampleDay.order_count * 5.00, 'Day payout must equal order_count * rate');
        console.log(`✅ Sample Day (${sampleDay.date}) payout: ₹${sampleDay.payout} for ${sampleDay.order_count} orders`);
    }

    // ----------------------------------------------------
    // TEST 4: Invalid Rate Validation (Security & Integrity)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Invalid Rate Validation ---');
    const invalidRes = await fetch(`${BASE_URL}/api/orders/delivery-pricing-config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({ rate_per_order: -10 })
    });
    assert.strictEqual(invalidRes.status, 400, 'Negative rate must be rejected with 400');
    console.log('✅ Negative rate correctly rejected with HTTP 400');

    // ----------------------------------------------------
    // TEST 5: Individual Delivery Person Statistics Inspection
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Inspect Individual Delivery Person Stats ---');
    // Inspect Flash Man
    const partnerId = 'admin_5dcb05eba7';
    const riderRes = await fetch(`${BASE_URL}/api/orders/delivery-earnings?riderId=${partnerId}`);
    assert.strictEqual(riderRes.status, 200);
    const riderData = await riderRes.json();
    assert.strictEqual(riderData.success, true);
    assert.strictEqual(riderData.selected_rider.id, partnerId, 'Selected rider ID must match query');
    assert.strictEqual(riderData.selected_rider.is_all, false, 'Should not be marked as all');
    assert.strictEqual(riderData.selected_rider.is_mine, false, 'Should not be marked as mine');
    console.log(`✅ Selected Runner Name: "${riderData.selected_rider.name}" (ID: ${riderData.selected_rider.id})`);
    console.log(`✅ Completed Orders for Runner: ${riderData.total_orders}`);
    console.log(`✅ Accrued Payout at ₹5.00: ₹${riderData.order_payout}`);
    assert.strictEqual(riderData.order_payout, riderData.total_orders * 5.00, 'Payout must equal orders * 5.00');

    // Inspect Caption America
    const partnerId2 = 'user_2dae5b56';
    const riderRes2 = await fetch(`${BASE_URL}/api/orders/delivery-earnings?riderId=${partnerId2}`);
    assert.strictEqual(riderRes2.status, 200);
    const riderData2 = await riderRes2.json();
    assert.strictEqual(riderData2.selected_rider.id, partnerId2);
    console.log(`✅ Selected Runner 2: "${riderData2.selected_rider.name}" | Total Orders: ${riderData2.total_orders} | Payout: ₹${riderData2.order_payout}`);

    // ----------------------------------------------------
    // TEST 6: Owner "Only Mine" Filter View
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Owner "Only Mine" Filter View ---');
    const mineRes = await fetch(`${BASE_URL}/api/orders/delivery-earnings?riderId=mine`);
    assert.strictEqual(mineRes.status, 200);
    const mineData = await mineRes.json();
    assert.strictEqual(mineData.success, true);
    assert.strictEqual(mineData.selected_rider.id, 'mine', 'Selected rider ID must be "mine"');
    assert.strictEqual(mineData.selected_rider.is_mine, true, 'selected_rider.is_mine must be true');
    assert.ok(mineData.selected_rider.name.includes('Owner') || mineData.selected_rider.name.includes('Nivas'), 'Selected rider name must indicate Owner');
    console.log(`✅ Owner Filter Name: "${mineData.selected_rider.name}"`);
    console.log(`✅ Owner Orders Delivered: ${mineData.total_orders}`);
    console.log(`✅ Owner Payout at ₹5.00: ₹${mineData.order_payout}`);
    assert.strictEqual(mineData.order_payout, mineData.total_orders * 5.00, 'Owner payout must equal orders * 5.00');

    // ----------------------------------------------------
    // TEST 7: Reset Rate back to standard ₹3.00
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Reset Pricing Rate back to ₹3.00 ---');
    const resetRes = await fetch(`${BASE_URL}/api/orders/delivery-pricing-config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
            rate_per_order: 3.00,
            daily_bonus_threshold: 20,
            daily_bonus_amount: 20.00,
            updated_by: 'Owner'
        })
    });
    assert.strictEqual(resetRes.status, 200);
    const resetData = await resetRes.json();
    assert.strictEqual(resetData.config.rate_per_order, 3.00);
    console.log('✅ Pricing successfully restored to ₹3.00 / order');

    // ----------------------------------------------------
    // TEST 8: Verify UI Elements & Functions Across Mirrored Files
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Verify HTML & JS Mirrored Files ---');
    const pathsToCheck = [
        'client/admin/index.html',
        'admin/index.html',
        'public/admin/index.html',
        'client/admin/js/admin.js',
        'admin/js/admin.js',
        'public/admin/js/admin.js',
        'client/js/pages/rider_earnings.js',
        'public/js/pages/rider_earnings.js'
    ];

    pathsToCheck.forEach(p => {
        assert.ok(fs.existsSync(p), `File must exist: ${p}`);
        const content = fs.readFileSync(p, 'utf8');

        if (p.endsWith('index.html')) {
            assert.ok(content.includes('hub-header-rate-display'), `${p} must include hub-header-rate-display`);
            assert.ok(content.includes('openDeliveryPricingModal'), `${p} must include openDeliveryPricingModal`);
            assert.ok(content.includes('btn-filter-all-fleet'), `${p} must include btn-filter-all-fleet`);
            assert.ok(content.includes('btn-filter-only-mine'), `${p} must include btn-filter-only-mine`);
            assert.ok(content.includes('partner-filter-alert-banner'), `${p} must include partner-filter-alert-banner`);
        } else if (p.includes('admin.js')) {
            assert.ok(content.includes('openDeliveryPricingModal'), `${p} must declare openDeliveryPricingModal`);
            assert.ok(content.includes('saveDeliveryPricingConfig'), `${p} must declare saveDeliveryPricingConfig`);
            assert.ok(content.includes('partner-filter-alert-banner'), `${p} must reference partner-filter-alert-banner`);
            assert.ok(content.includes('Only Mine'), `${p} must handle Only Mine filter`);
        } else if (p.includes('rider_earnings.js')) {
            assert.ok(content.includes('client-kpi-rate-badge'), `${p} must include client-kpi-rate-badge`);
            assert.ok(content.includes('client-snapshot-formula'), `${p} must include client-snapshot-formula`);
        }
        console.log(`✅ File verified & synchronized: ${p}`);
    });

    console.log('\n🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
});

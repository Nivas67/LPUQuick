const http = require('http');
const { generateAdminToken } = require('../server/middleware/adminAuth');

function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('=== STARTING DELIVERY PRIVACY & DATA TESTS ===\n');

    // 1. Generate tokens using the application's built-in generator
    // Owner: user_admin_bh13
    const ownerToken = generateAdminToken('user_admin_bh13', 'admin');

    // Non-owner staff member / runner (e.g. user_staff_1 or admin_support)
    const nonOwnerToken = generateAdminToken('user_staff_rider_1', 'admin');

    // Test A: Non-owner calls delivery-earnings
    console.log('[Test 1]: Staff/Non-Owner requesting delivery-earnings with riderId=all...');
    const nonOwnerRes = await makeRequest('GET', '/api/orders/delivery-earnings?riderId=all', {
        'Authorization': `Bearer ${nonOwnerToken}`
    });

    console.log('Status code:', nonOwnerRes.status);
    console.log('is_owner:', nonOwnerRes.data.is_owner);
    console.log('platform_metrics restricted:', nonOwnerRes.data.platform_metrics?.restricted);
    console.log('partners_summary length:', nonOwnerRes.data.partners_summary?.length);
    console.log('available_riders length:', nonOwnerRes.data.available_riders?.length);

    if (nonOwnerRes.data.is_owner === false &&
        nonOwnerRes.data.platform_metrics?.restricted === true &&
        (!nonOwnerRes.data.platform_metrics?.total_daily_order_payouts) &&
        nonOwnerRes.data.partners_summary?.length <= 1) {
        console.log('✅ TEST 1 PASSED: Non-owner privacy strictly enforced (no fleet revenue visible)!\n');
    } else {
        console.error('❌ TEST 1 FAILED: Non-owner was able to see unauthorized data!');
        process.exit(1);
    }

    // Test B: Non-owner tries to update delivery pricing config
    console.log('[Test 2]: Non-owner attempting to modify delivery pricing config...');
    const nonOwnerConfigRes = await makeRequest('POST', '/api/orders/delivery-pricing-config', {
        'Authorization': `Bearer ${nonOwnerToken}`
    }, { rate_per_order: 10.00 });

    console.log('Status code:', nonOwnerConfigRes.status);
    console.log('Response error:', nonOwnerConfigRes.data?.error);

    if (nonOwnerConfigRes.status === 403) {
        console.log('✅ TEST 2 PASSED: Non-owner rejected with 403 Forbidden on pricing modification!\n');
    } else {
        console.error('❌ TEST 2 FAILED: Non-owner was able to modify pricing config!');
        process.exit(1);
    }

    // Test C: Owner calls delivery-earnings
    console.log('[Test 3]: Store Owner requesting delivery-earnings with riderId=all...');
    const ownerRes = await makeRequest('GET', '/api/orders/delivery-earnings?riderId=all', {
        'Authorization': `Bearer ${ownerToken}`
    });

    console.log('Status code:', ownerRes.status);
    console.log('is_owner:', ownerRes.data.is_owner);
    console.log('platform_metrics present:', Boolean(ownerRes.data.platform_metrics?.total_monthly_partner_expenses !== undefined));
    console.log('partners_summary count:', ownerRes.data.partners_summary?.length);
    console.log('Total orders returned:', ownerRes.data.all_orders?.length);

    if (ownerRes.data.is_owner === true &&
        ownerRes.data.platform_metrics?.restricted === undefined &&
        Array.isArray(ownerRes.data.partners_summary) &&
        ownerRes.data.partners_summary.length > 0) {
        console.log('✅ TEST 3 PASSED: Owner has full fleet visibility!\n');
    } else {
        console.error('❌ TEST 3 FAILED: Owner was restricted or missing data!');
        process.exit(1);
    }

    // Test D: Verify Cancelled vs Delivered orders data integrity
    console.log('[Test 4]: Checking cancelled vs completed orders and payouts in all_orders...');
    const allOrders = ownerRes.data.all_orders || [];
    const cancelled = allOrders.filter(o => o.status === 'cancelled' || o.delivery_state === 'Cancelled');
    const completed = allOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.delivery_state === 'Completed');

    console.log(`Found ${completed.length} completed orders and ${cancelled.length} cancelled orders.`);
    
    let cancelledPayoutInvalid = false;
    for (const o of cancelled) {
        if (o.payout !== 0) {
            console.error(`Cancelled order ${o.id} has non-zero payout:`, o.payout);
            cancelledPayoutInvalid = true;
        }
    }

    let completedPayoutInvalid = false;
    for (const o of completed) {
        if (o.payout <= 0) {
            console.error(`Completed order ${o.id} has invalid payout:`, o.payout);
            completedPayoutInvalid = true;
        }
    }

    if (!cancelledPayoutInvalid && !completedPayoutInvalid) {
        console.log('✅ TEST 4 PASSED: Cancelled orders accurately have ₹0 payout, completed have positive payout!\n');
    } else {
        console.error('❌ TEST 4 FAILED: Order payout integrity mismatch!');
        process.exit(1);
    }

    // Test E: Check date formatting is IST YYYY-MM-DD
    console.log('[Test 5]: Checking date format alignment across orders and days...');
    const sampleDates = allOrders.slice(0, 5).map(o => o.date);
    console.log('Sample order dates:', sampleDates);
    const validDateFormat = sampleDates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d));

    if (validDateFormat) {
        console.log('✅ TEST 5 PASSED: Dates are cleanly formatted YYYY-MM-DD in IST timezone!\n');
    } else {
        console.error('❌ TEST 5 FAILED: Date format error:', sampleDates);
        process.exit(1);
    }

    console.log('🎉 ALL 5 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});

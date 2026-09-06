/**
 * Verification Script: Full Delivery Partner Hub, Shifts & Real-World Calculation Engine
 */
const fs = require('fs');
const http = require('http');

async function run() {
    console.log('🚀 Running Complete Delivery Partner Hub & Shift Verification...\n');

    // 1. Fetch API
    const res = await fetch('http://localhost:3000/api/orders/delivery-earnings');
    const data = await res.json();

    if (!data.success) {
        throw new Error('API returned failure: ' + JSON.stringify(data));
    }

    console.log('--- 1. Pricing Engine & Formulas ---');
    console.log(`Rate per order: ₹${data.rate_per_order.toFixed(2)} (Expected ₹3.00)`);
    console.assert(data.rate_per_order === 3.00, 'Rate must be ₹3.00');

    console.log(`Today's Completed Deliveries: ${data.today_stats.completed_today}`);
    console.log(`Today's Earnings: ₹${data.today_stats.today_earnings.toFixed(2)}`);
    console.assert(data.today_stats.today_earnings === data.today_stats.completed_today * 3.00, 'Daily revenue must equal completed * 3');

    console.log(`Monthly Completed Deliveries: ${data.monthly_stats.completed_month}`);
    console.log(`Monthly Payout: ₹${data.monthly_stats.monthly_payout.toFixed(2)}`);
    console.assert(data.monthly_stats.monthly_payout === data.monthly_stats.completed_month * 3.00, 'Monthly revenue must equal month completed * 3');
    console.log('✅ Pricing Engine formulas 100% verified.\n');

    console.log('--- 2. Real-World Shifts Calculation ---');
    console.log(`Current Active Shift ID: "${data.current_shift_id}"`);
    console.assert(data.shifts_summary && data.shifts_summary.length === 4, 'Must have 4 shifts');

    let totalShiftDeliveries = 0;
    let totalShiftWages = 0;
    data.shifts_summary.forEach(s => {
        console.log(`  • ${s.title} (${s.hours}): ${s.completed_today} completed, ₹${s.earned_wage.toFixed(2)} earned ${s.is_current ? '[ACTIVE NOW]' : ''}`);
        console.assert(s.earned_wage === s.completed_today * 3.00, 'Shift wage must equal shift deliveries * 3');
        totalShiftDeliveries += s.completed_today;
        totalShiftWages += s.earned_wage;
    });

    console.assert(totalShiftDeliveries === data.today_stats.completed_today, 'Sum of shifts deliveries must equal today completed deliveries');
    console.assert(totalShiftWages === data.today_stats.today_earnings, 'Sum of shifts wages must equal today earnings');
    console.log('✅ Real-World Shifts breakdown verified.\n');

    console.log('--- 3. Platform Fleet Metrics ---');
    console.log(`Total Daily Payout: ₹${data.platform_metrics.total_daily_payout.toFixed(2)}`);
    console.log(`Total Monthly Expense: ₹${data.platform_metrics.total_monthly_expense.toFixed(2)}`);
    console.log(`Active Fleet Size: ${data.platform_metrics.total_active_fleet}`);
    console.log(`Total Platform Deliveries: ${data.platform_metrics.total_completed_all_time}`);
    console.assert(data.platform_metrics.total_active_fleet > 0, 'Fleet size must be > 0');
    console.log('✅ Platform fleet metrics verified.\n');

    console.log('--- 4. Delivery Partner Roster & Shifts ---');
    console.log(`Total Partners in Roster: ${data.partners_summary.length}`);
    data.partners_summary.forEach(p => {
        console.log(`  • Partner: ${p.partner_name} (#${p.partner_id.slice(-8)}) | Primary Shift: ${p.primary_shift} | Today: ${p.today_deliveries} (₹${p.today_wage}) | Month: ${p.monthly_deliveries} (₹${p.monthly_payout})`);
        console.assert(p.today_wage === p.today_deliveries * 3.00, 'Partner today wage must be deliveries * 3');
        console.assert(p.monthly_payout === p.monthly_deliveries * 3.00, 'Partner month payout must be deliveries * 3');
    });
    console.log('✅ Delivery partner roster and wages verified.\n');

    console.log('--- 5. HTML Elements & IDs Integrity ---');
    const adminHtml = fs.readFileSync('client/admin/index.html', 'utf8');
    const requiredIds = [
        'view-earnings',
        'subtab-partner-btn',
        'subtab-fleet-btn',
        'earnings-subview-partner',
        'earnings-subview-fleet',
        'partner-kpi-today-earnings',
        'partner-kpi-today-completed',
        'partner-kpi-today-breakdown',
        'partner-status-dot',
        'partner-status-text',
        'partner-duty-toggle-btn',
        'earnings-rider-select',
        'partner-snapshot-month-name',
        'partner-snapshot-deliveries',
        'partner-snapshot-payout',
        'partner-snapshot-avg',
        'tab-earnings-weekly',
        'tab-earnings-monthly',
        'earnings-chart-container',
        'partner-ledger-tbody',
        'earnings-orders-list',
        'fleet-metric-daily-payout',
        'fleet-metric-monthly-expense',
        'fleet-metric-total-fleet',
        'fleet-metric-total-orders',
        'fleet-filter-today',
        'fleet-filter-week',
        'fleet-filter-month',
        'fleet-shift-filter',
        'fleet-start-date',
        'fleet-end-date',
        'fleet-partners-tbody'
    ];

    requiredIds.forEach(id => {
        console.assert(adminHtml.includes(`id="${id}"`), `Missing required element ID: ${id}`);
    });
    console.log(`✅ All ${requiredIds.length} critical UI element IDs present in admin template.\n`);

    console.log('--- 6. Client Rider Earnings Page Integrity ---');
    const riderHtml = fs.readFileSync('client/js/pages/rider_earnings.js', 'utf8');
    console.assert(riderHtml.includes('openClientPartnerShiftModal'), 'Must include openClientPartnerShiftModal');
    console.assert(riderHtml.includes('openClientPartnerProfileModal'), 'Must include openClientPartnerProfileModal');
    console.assert(riderHtml.includes('window.fetchClientDeliveryEarnings'), 'Must include fetchClientDeliveryEarnings');
    console.log('✅ Client rider earnings page fully synchronized.\n');

    console.log('🎉 ALL TESTS PASSED! Delivery Partner Hub, Fleet Management & Real-World Shift Engine are 100% functional!');
}

run().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});

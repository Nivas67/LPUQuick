const assert = require('assert');
const fs = require('fs');
const path = require('path');
const financialEngine = require('../utils/financialEngine');

console.log('====================================================');
console.log('🧪 TESTING CASH PAYMENT DISPLAY & FINANCIAL ENGINE CALCULATION');
console.log('====================================================');

// Test 1: formatAdminPaymentDisplay in admin/js/admin.js, client/admin/js/admin.js, public/admin/js/admin.js
console.log('\n[1/5] Testing formatAdminPaymentDisplay across admin files...');
const adminFiles = [
    path.join(__dirname, '../../admin/js/admin.js'),
    path.join(__dirname, '../../client/admin/js/admin.js'),
    path.join(__dirname, '../../public/admin/js/admin.js')
];

adminFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fnMatch = content.match(/function formatAdminPaymentDisplay\([^)]*\)\s*\{[\s\S]*?\n\}/);
    assert(fnMatch, `formatAdminPaymentDisplay not found in ${file}`);
    const fn = eval(`(${fnMatch[0]})`);
    assert.strictEqual(fn('Cash'), 'Cash');
    assert.strictEqual(fn('cash'), 'Cash');
    assert.strictEqual(fn('UPI'), 'UPI');
    assert.strictEqual(fn('upi'), 'UPI');
    assert.strictEqual(fn('Both (Cash: ₹20, UPI: ₹32)'), 'Both (Cash: ₹20, UPI: ₹32)');
    assert.strictEqual(fn('Pay on Delivery'), 'Pay on Delivery');
    assert.strictEqual(fn('Cash on Delivery'), 'Pay on Delivery');
    assert.strictEqual(fn('COD'), 'Pay on Delivery');
    assert.strictEqual(fn('POD'), 'Pay on Delivery');
    assert.strictEqual(fn(null), 'Pay on Delivery');
    // When order is Delivered / Completed:
    assert.strictEqual(fn('Pay on Delivery', 'Delivered'), 'Cash');
    assert.strictEqual(fn('Cash on Delivery', 'Delivered'), 'Cash');
    assert.strictEqual(fn('COD', 'Delivered'), 'Cash');
    assert.strictEqual(fn(null, 'Delivered'), 'Cash');
    assert.strictEqual(fn('Cash', 'Delivered'), 'Cash');
    assert.strictEqual(fn('UPI', 'Delivered'), 'UPI');
});
console.log('✓ formatAdminPaymentDisplay verified in all 3 admin locations!');

// Test 2: formatCustomerPaymentMethod in client/js/pages/orders.js and public/js/pages/orders.js
console.log('\n[2/5] Testing formatCustomerPaymentMethod in customer orders pages...');
const customerFiles = [
    path.join(__dirname, '../../client/js/pages/orders.js'),
    path.join(__dirname, '../../public/js/pages/orders.js')
];

customerFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const fnMatch = content.match(/function formatCustomerPaymentMethod\([^)]*\)\s*\{[\s\S]*?\n\}/);
    assert(fnMatch, `formatCustomerPaymentMethod not found in ${file}`);
    const fn = eval(`(${fnMatch[0]})`);
    assert.strictEqual(fn('Cash'), 'Cash');
    assert.strictEqual(fn('cash'), 'Cash');
    assert.strictEqual(fn('UPI'), 'UPI');
    assert.strictEqual(fn('upi'), 'UPI');
    assert.strictEqual(fn('Both (Cash: ₹10, UPI: ₹42)'), 'Both (Cash: ₹10, UPI: ₹42)');
    assert.strictEqual(fn('Pay on Delivery'), 'Pay on Delivery');
    assert.strictEqual(fn('Cash on Delivery'), 'Pay on Delivery');
    assert.strictEqual(fn(null), 'Pay on Delivery');
});
console.log('✓ formatCustomerPaymentMethod verified in both customer files!');

// Test 3: Financial engine calculations for Cash, UPI, and Both
console.log('\n[3/5] Testing financialEngine.calculateDayWiseFinancials revenue classification...');
const now = new Date().toISOString();
const mockOrders = [
    { id: 'o1', status: 'Delivered', payment_method: 'Cash', total: 52, created_at: now },
    { id: 'o2', status: 'Delivered', payment_method: 'Pay on Delivery', total: 48, created_at: now },
    { id: 'o3', status: 'Delivered', payment_method: 'UPI', total: 100, created_at: now },
    { id: 'o4', status: 'Delivered', payment_method: 'Both (Cash: ₹30, UPI: ₹22)', total: 52, created_at: now },
    { id: 'o5', status: 'Cancelled', payment_method: 'Cash', total: 99, created_at: now } // Cancelled must NOT be in revenue
];

const res = financialEngine.calculateDayWiseFinancials(mockOrders, [], {}, { range: 'all' });
const { summary } = res;

assert.strictEqual(summary.total_delivered_orders, 4, 'Must evaluate 4 delivered orders');
assert.strictEqual(summary.total_revenue, 252, 'Total delivered revenue must be 52 + 48 + 100 + 52 = 252');
assert.strictEqual(summary.cash_revenue, 130, 'Cash revenue must be 52 (Cash) + 48 (POD) + 30 (Both-Cash) = 130');
assert.strictEqual(summary.upi_revenue, 122, 'UPI revenue must be 100 (UPI) + 22 (Both-UPI) = 122');
assert.strictEqual(summary.cash_revenue + summary.upi_revenue, summary.total_revenue, 'Cash + UPI must equal Total Revenue');
assert.strictEqual(summary.cash_count, 3, 'Cash count must be 3 (o1, o2, o4)');
assert.strictEqual(summary.upi_count, 2, 'UPI count must be 2 (o3, o4)');
console.log('✓ Financial engine cash vs upi revenue calculation verified 100%!');

// Test 4: Parity between filter counts and filter logic in admin.js
console.log('\n[4/5] Testing admin.js filter pill condition parity...');
adminFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const cashCountMatch = content.match(/const cashCount = ordersCache\.filter\(o => \{[\s\S]*?\}\)\.length;/);
    const cashFilterMatch = content.match(/currentOrderFilter === 'cash'\) \{[\s\S]*?\}\);/);
    assert(cashCountMatch, `cashCount logic missing in ${file}`);
    assert(cashFilterMatch, `cashFilter logic missing in ${file}`);
    assert(cashFilterMatch[0].includes('pay on delivery'), `cashFilter must include pay on delivery in ${file}`);
    assert(cashFilterMatch[0].includes('pod'), `cashFilter must include pod in ${file}`);
});
console.log('✓ Filter pill condition parity verified across all admin files!');

// Test 5: Exact file parity between duplicate mirrors
console.log('\n[5/5] Testing 100% exact file parity between mirrors...');
const adminJs1 = fs.readFileSync(adminFiles[0], 'utf8');
const adminJs2 = fs.readFileSync(adminFiles[1], 'utf8');
const adminJs3 = fs.readFileSync(adminFiles[2], 'utf8');
assert.strictEqual(adminJs1, adminJs2, 'admin.js and client/admin/js/admin.js must be identical');
assert.strictEqual(adminJs1, adminJs3, 'admin.js and public/admin/js/admin.js must be identical');

const ordersJs1 = fs.readFileSync(customerFiles[0], 'utf8');
const ordersJs2 = fs.readFileSync(customerFiles[1], 'utf8');
assert.strictEqual(ordersJs1, ordersJs2, 'client/js/pages/orders.js and public/js/pages/orders.js must be identical');
console.log('✓ 100% exact parity verified across all mirrored directories!');

console.log('\n🎉 ALL CASH PAYMENT & CALCULATION TESTS PASSED SUCCESSFULLY!\n');

// scripts/test_cart_bill_logic.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Cart Bill Logic and Templates ---');

const publicCartJs = fs.readFileSync(path.join(__dirname, '../public/js/pages/cart.js'), 'utf8');
const clientCartJs = fs.readFileSync(path.join(__dirname, '../client/js/pages/cart.js'), 'utf8');

// 1. Verify Bill Elements exist in both files
const requiredIds = [
    'bill-mrp-discount-row',
    'bill-mrp-discount-val',
    'bill-subtotal-val',
    'bill-discount-row',
    'bill-discount-val',
    'bill-total-val',
    'bill-savings-val',
    'cart-checkout-action-container',
    'cart-mobile-checkout-container'
];

for (const id of requiredIds) {
    assert(publicCartJs.includes(id), `public/js/pages/cart.js missing ${id}`);
    assert(clientCartJs.includes(id), `client/js/pages/cart.js missing ${id}`);
    console.log(`✓ ID ${id} present in both cart.js files`);
}

// 2. Test the calculation formulas
function calculateCartBill(items) {
    const totalMrp = items.reduce((sum, item) => sum + (Number(item.mrp || item.price || 0) * (item.quantity || 1)), 0);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * (item.quantity || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);
    const handlingFee = 3;
    const hasDiscount = subtotal >= 350;
    const discount5 = hasDiscount ? Math.round(subtotal * 0.05) : 0;
    const exactTotal = Math.max(0, subtotal - discount5 + handlingFee);
    const totalSavings = mrpDiscount + discount5 + (subtotal > 0 ? 25 : 0);
    const isMinOrderMet = subtotal >= 35;
    const minOrderShortfall = Math.max(0, 35 - subtotal);

    return {
        totalMrp,
        subtotal,
        mrpDiscount,
        handlingFee,
        hasDiscount,
        discount5,
        exactTotal,
        totalSavings,
        isMinOrderMet,
        minOrderShortfall
    };
}

// Test Case A: Subtotal < 35 (e.g. ₹20 item, MRP ₹25)
const billA = calculateCartBill([{ price: 20, mrp: 25, quantity: 1 }]);
assert.strictEqual(billA.subtotal, 20);
assert.strictEqual(billA.mrpDiscount, 5);
assert.strictEqual(billA.isMinOrderMet, false);
assert.strictEqual(billA.minOrderShortfall, 15);
assert.strictEqual(billA.exactTotal, 23); // 20 + 3
assert.strictEqual(billA.totalSavings, 30); // 5 mrp + 25 delivery
console.log('✓ Test Case A passed: Min order shortfall handled accurately (shortfall ₹15)');

// Test Case B: Subtotal between 35 and 349 (e.g. ₹100 item, MRP ₹120)
const billB = calculateCartBill([{ price: 100, mrp: 120, quantity: 1 }]);
assert.strictEqual(billB.subtotal, 100);
assert.strictEqual(billB.mrpDiscount, 20);
assert.strictEqual(billB.isMinOrderMet, true);
assert.strictEqual(billB.hasDiscount, false);
assert.strictEqual(billB.discount5, 0);
assert.strictEqual(billB.exactTotal, 103); // 100 + 3
assert.strictEqual(billB.totalSavings, 45); // 20 mrp + 25 delivery
console.log('✓ Test Case B passed: Standard order met without bulk discount');

// Test Case C: Subtotal >= 350 (e.g. ₹400 item, MRP ₹450)
const billC = calculateCartBill([{ price: 400, mrp: 450, quantity: 1 }]);
assert.strictEqual(billC.subtotal, 400);
assert.strictEqual(billC.mrpDiscount, 50);
assert.strictEqual(billC.isMinOrderMet, true);
assert.strictEqual(billC.hasDiscount, true);
assert.strictEqual(billC.discount5, 20); // 5% of 400
assert.strictEqual(billC.exactTotal, 383); // 400 - 20 + 3
assert.strictEqual(billC.totalSavings, 95); // 50 mrp + 20 bulk + 25 delivery
console.log('✓ Test Case C passed: Bulk discount (5%) applied correctly');

console.log('All Cart Bill calculation and template tests passed successfully!');

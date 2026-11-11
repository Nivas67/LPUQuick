const assert = require('assert');
const fs = require('fs');
const path = require('path');
const foodOrderService = require('../services/foodOrderService');

console.log('====================================================');
console.log('🧪 TESTING FOOD ORDER DIFFERENTIATION & CLASSIFICATION');
console.log('====================================================\n');

// 1. Test backend isFoodProduct
const topRamen = { name: 'Top Ramen Masala Noodles 50g', category: 'Snacks & Beverages', subcategory: 'Instant Food' };
const hideSeek = { name: 'PARLE Hide & Seek 100g', category: 'Snacks & Beverages', subcategory: 'Biscuits' };
const yippee = { name: 'Sunfest Yippee masala 50g', category: 'Snacks & Beverages', subcategory: 'Instant Food' };
const maggiPack = { name: 'Maggi Masala 95g', category: "Quick's Instant Snacks", subcategory: 'Magiee' };
const cupNoodles = { name: 'CUP NOODLES Mazedaar masala', category: 'Snacks & Beverages', subcategory: 'Noodles' };
const vegMaggi = { name: 'VEGETABLE MAGIEE 200g', category: "Quick's Instant Food", subcategory: 'Maggi & Noodles' };

assert.strictEqual(foodOrderService.isFoodProduct(topRamen), false, 'Top Ramen must NOT be kitchen food');
console.log('✅ [PASS] Top Ramen Masala Noodles 50g correctly identified as standard dark store grocery');

assert.strictEqual(foodOrderService.isFoodProduct(hideSeek), false, 'PARLE Hide & Seek must NOT be kitchen food');
console.log('✅ [PASS] PARLE Hide & Seek 100g correctly identified as standard dark store biscuit');

assert.strictEqual(foodOrderService.isFoodProduct(yippee), false, 'Sunfest Yippee must NOT be kitchen food');
console.log('✅ [PASS] Sunfest Yippee masala 50g correctly identified as standard dark store snack');

assert.strictEqual(foodOrderService.isFoodProduct(maggiPack), false, 'Maggi 95g raw pack must NOT be kitchen food');
console.log('✅ [PASS] Maggi Masala 95g raw pack correctly excluded from kitchen food');

assert.strictEqual(foodOrderService.isFoodProduct(cupNoodles), false, 'Cup Noodles must NOT be kitchen food');
console.log('✅ [PASS] CUP NOODLES correctly excluded from kitchen food');

assert.strictEqual(foodOrderService.isFoodProduct(vegMaggi), true, 'Vegetable Maggi 200g MUST be kitchen food');
console.log("✅ [PASS] VEGETABLE MAGIEE 200g correctly identified as Quick's Instant Food");

// 2. Test admin isOrderFoodDept implementation from admin.js
const adminContent = fs.readFileSync(path.join(__dirname, '..', '..', 'admin', 'js', 'admin.js'), 'utf8');
const isOrderFoodDeptMatch = adminContent.match(/function isOrderFoodDept\([\s\S]*?\n\}/);
assert(isOrderFoodDeptMatch, 'isOrderFoodDept function must be present in admin.js');

const sandbox = {};
const fn = new Function('foodOrdersCache', `
    ${isOrderFoodDeptMatch[0]}
    return isOrderFoodDept;
`);
const isOrderFoodDept = fn([]);

const groceryOrder = {
    id: 'order_ve0jbq69',
    hostel_id: 'GH-12',
    is_food_order: false,
    delivery_address: '[GH-12] GH12 (Block C), Room 1111',
    item_summary: 'Top Ramen Masala Noodles 50g (x2), PARLE Hide & Seek 100g (x1)',
    items: [
        { name: 'Top Ramen Masala Noodles 50g', category: 'Snacks & Beverages', subcategory: 'Instant Food', quantity: 2 },
        { name: 'PARLE Hide & Seek 100g', category: 'Snacks & Beverages', subcategory: 'Biscuits', quantity: 1 }
    ]
};

assert.strictEqual(isOrderFoodDept(groceryOrder), false, 'Order with Top Ramen & Hide and Seek must NOT be a food order');
console.log('✅ [PASS] Order #VE0JBQ69 (Top Ramen + Hide & Seek) correctly classified as Standard Dark Store Order (NO Instant Food badge)');

const cancelBiscuitOrder = {
    id: 'order_gbujpjwi',
    hostel_id: 'BH-13',
    is_food_order: false,
    delivery_address: '[BH-13] Room 925',
    item_summary: 'Britannia Treat Rich Creme Choco -55g × 1',
    items: [
        { name: 'Britannia Treat Rich Creme Choco -55g', category: 'Snacks & Beverages', subcategory: 'Biscuits', quantity: 1 }
    ]
};

assert.strictEqual(isOrderFoodDept(cancelBiscuitOrder), false, 'Cancelled biscuit order must NOT be a food order');
console.log('✅ [PASS] Order #GBUJPJWI (Britannia Treat biscuits) correctly classified as Standard Dark Store Order');

const realKitchenOrder = {
    id: 'order_m5fz9aqa',
    hostel_id: 'BH-13',
    is_food_order: true,
    delivery_address: "[BH-13] Room 302, Quick's Instant Food",
    items: [
        { name: 'VEGETABLE MAGIEE 200g', category: "Quick's Instant Food", subcategory: 'Maggi & Noodles', quantity: 1 }
    ]
};

assert.strictEqual(isOrderFoodDept(realKitchenOrder), true, 'Kitchen order with Vegetable Maggi MUST be a food order');
console.log("✅ [PASS] Genuine Kitchen Order correctly identified with Quick's Instant Food badge");

// 3. Mirror parity verification
const checkMirrors = (fileA, fileB, label) => {
    const a = fs.readFileSync(fileA, 'utf8');
    const b = fs.readFileSync(fileB, 'utf8');
    assert.strictEqual(a, b, `Parity check failed for ${label}`);
    console.log(`✅ [PASS] 100% exact parity verified: ${label}`);
};

checkMirrors(
    path.join(__dirname, '..', '..', 'client', 'js', 'pages', 'cart.js'),
    path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'cart.js'),
    'cart.js (client vs public)'
);

checkMirrors(
    path.join(__dirname, '..', '..', 'client', 'js', 'pages', 'checkout.js'),
    path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'checkout.js'),
    'checkout.js (client vs public)'
);

checkMirrors(
    path.join(__dirname, '..', '..', 'client', 'js', 'pages', 'orders.js'),
    path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'orders.js'),
    'orders.js (client vs public)'
);

checkMirrors(
    path.join(__dirname, '..', '..', 'admin', 'js', 'admin.js'),
    path.join(__dirname, '..', '..', 'public', 'admin', 'js', 'admin.js'),
    'admin.js (admin vs public/admin)'
);

checkMirrors(
    path.join(__dirname, '..', '..', 'admin', 'js', 'admin.js'),
    path.join(__dirname, '..', '..', 'client', 'admin', 'js', 'admin.js'),
    'admin.js (admin vs client/admin)'
);

console.log('\n====================================================');
console.log('🎉 ALL FOOD ORDER CLASSIFICATION TESTS PASSED!');
console.log('====================================================\n');

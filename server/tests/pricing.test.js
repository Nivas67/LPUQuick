// Unit tests for LPUQuick Pricing Calculator (Zero GST, Free Delivery Offer -₹25, ₹5 Handling Fee for Every Order, Min Order ₹35)
const assert = require('assert');
const { calculatePricing } = require('../routes/cart');

console.log('--- Running Pricing Calculator Unit Tests ---');

// Test 1: Subtotal with items (135) + ₹5 handling fee = 140
{
    const items = [
        { price: 40, quantity: 2 }, // 80
        { price: 55, quantity: 1 }  // 55
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 135, 'Subtotal should be 135');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free Campus Delivery)');
    assert.strictEqual(result.platform_fee, 5, 'Handling fee should be 5 for every order');
    assert.strictEqual(result.tax, 0, 'GST should be 0 (No GST)');
    assert.strictEqual(result.total, 140, 'Total should be subtotal (135) + handling fee (5) = 140');
    assert.strictEqual(result.total_savings, 25, 'Total savings should be 25 (Free Delivery Offer)');
    assert.strictEqual(result.min_order_value, 35, 'Min order value should be 35');
    assert.strictEqual(result.is_min_order_met, true, 'is_min_order_met should be true');
    console.log('✓ Test 1: Standard items pricing passed (Total = Subtotal + 5 handling fee, Min order met)');
}

// Test 2: Subtotal below minimum order value (20)
{
    const items = [
        { price: 20, quantity: 1 }
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 20, 'Subtotal should be 20');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 5, 'Handling fee should be 5');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 25, 'Total should be 25');
    assert.strictEqual(result.min_order_value, 35, 'Min order value should be 35');
    assert.strictEqual(result.is_min_order_met, false, 'is_min_order_met should be false');
    console.log('✓ Test 2: Subtotal below minimum order value correctly identified');
}

// Test 3: Empty cart
{
    const items = [];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 0, 'Subtotal should be 0');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 0, 'Handling fee should be 0 for empty cart');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 0, 'Total should be 0');
    assert.strictEqual(result.item_count, 0, 'item_count should be 0');
    assert.strictEqual(result.is_min_order_met, false, 'is_min_order_met should be false for empty cart');
    console.log('✓ Test 3: Empty cart passed');
}

// Test 4: 5% Bulk Discount (orders >= ₹350) + Accurate Item Count & MRP Discount
{
    const items = [
        { name: 'Snack A', price: 100, mrp: 120, quantity: 2 }, // price: 200, mrp: 240
        { name: 'Snack B', price: 200, mrp: 220, quantity: 1 }  // price: 200, mrp: 220
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.item_count, 3, 'Total items should be 2 + 1 = 3');
    assert.strictEqual(result.total_mrp, 460, 'Total MRP should be 240 + 220 = 460');
    assert.strictEqual(result.subtotal, 400, 'Subtotal should be 200 + 200 = 400');
    assert.strictEqual(result.mrp_discount, 60, 'MRP discount should be 460 - 400 = 60');
    assert.strictEqual(result.discount5, 20, '5% bulk offer should be 400 * 0.05 = 20');
    assert.strictEqual(result.platform_fee, 5, 'Handling fee should be 5');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free)');
    assert.strictEqual(result.total, 385, 'Total should be Subtotal (400) - Discount (20) + Handling Fee (5) = 385');
    assert.strictEqual(result.total_savings, 105, 'Total savings should be MRP Discount (60) + 5% Offer (20) + Delivery (25) = 105');
    assert.strictEqual(result.is_min_order_met, true, 'is_min_order_met should be true');
    console.log('✓ Test 4: 5% Bulk Discount and item quantity calculation passed');
}

console.log('\n--- All Pricing Calculator Tests Passed Successfully! ---');

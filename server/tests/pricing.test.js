// Unit tests for LPUQuick Pricing Calculator (Zero GST, Free Delivery Offer -₹25, ₹3 Handling Fee for Every Order, Min Order ₹35)
const assert = require('assert');
const { calculatePricing } = require('../routes/cart');

console.log('--- Running Pricing Calculator Unit Tests ---');

// Test 1: Subtotal with items (135) + ₹3 handling fee = 138
{
    const items = [
        { price: 40, quantity: 2 }, // 80
        { price: 55, quantity: 1 }  // 55
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 135, 'Subtotal should be 135');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free Campus Delivery)');
    assert.strictEqual(result.platform_fee, 3, 'Handling fee should be 3 for every order');
    assert.strictEqual(result.tax, 0, 'GST should be 0 (No GST)');
    assert.strictEqual(result.total, 138, 'Total should be subtotal (135) + handling fee (3) = 138');
    assert.strictEqual(result.total_savings, 25, 'Total savings should be 25 (Free Delivery Offer)');
    assert.strictEqual(result.min_order_value, 35, 'Min order value should be 35');
    assert.strictEqual(result.is_min_order_met, true, 'is_min_order_met should be true');
    console.log('✓ Test 1: Standard items pricing passed (Total = Subtotal + 3 handling fee, Min order met)');
}

// Test 2: Subtotal below minimum order value (20)
{
    const items = [
        { price: 20, quantity: 1 }
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 20, 'Subtotal should be 20');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 3, 'Handling fee should be 3');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 23, 'Total should be 23');
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
    assert.strictEqual(result.platform_fee, 3, 'Handling fee should be 3');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free)');
    assert.strictEqual(result.total, 383, 'Total should be Subtotal (400) - Discount (20) + Handling Fee (3) = 383');
    assert.strictEqual(result.total_savings, 105, 'Total savings should be MRP Discount (60) + 5% Offer (20) + Delivery (25) = 105');
    assert.strictEqual(result.is_min_order_met, true, 'is_min_order_met should be true');
    console.log('✓ Test 4: 5% Bulk Discount and item quantity calculation passed');
}

// Test 5: Section 9 Specification Example: Subtotal ₹250, 10% offer, max discount 50, free delivery, ₹3 handling fee = ₹228
{
    const items = [
        { price: 250, quantity: 1 }
    ];
    const customSettings = {
        offers_enabled: true,
        offer_type: 'percentage',
        offer_value: 10,
        minimum_order_value: 100,
        maximum_discount: 50,
        free_delivery_enabled: true,
        free_delivery_threshold: 199,
        delivery_fee: 25,
        handling_fee: 3,
        handling_fee_enabled: true
    };
    const result = calculatePricing(items, customSettings);
    assert.strictEqual(result.subtotal, 250, 'Subtotal should be 250');
    assert.strictEqual(result.global_discount, 25, '10% discount on 250 should be 25');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free Delivery above 199)');
    assert.strictEqual(result.platform_fee, 3, 'Handling fee should be 3');
    assert.strictEqual(result.total, 228, 'Total should be 250 - 25 + 0 + 3 = 228');
    console.log('✓ Test 5: Section 9 Specification Example passed (Subtotal ₹250 -> Total ₹228)');
}

// Test 6: Delivery Fee ₹25 with Free Delivery threshold ₹199
{
    const settings = {
        offers_enabled: false,
        delivery_fee: 25,
        free_delivery_enabled: true,
        free_delivery_threshold: 199,
        handling_fee: 3,
        handling_fee_enabled: true
    };
    // 6a: Subtotal 150 -> delivery 25
    const res150 = calculatePricing([{ price: 150, quantity: 1 }], settings);
    assert.strictEqual(res150.delivery_fee, 25, 'Delivery should be 25 for order 150');
    assert.strictEqual(res150.total, 178, 'Total should be 150 + 25 + 3 = 178');

    // 6b: Subtotal 199 -> FREE delivery
    const res199 = calculatePricing([{ price: 199, quantity: 1 }], settings);
    assert.strictEqual(res199.delivery_fee, 0, 'Delivery should be FREE for order 199');
    assert.strictEqual(res199.total, 202, 'Total should be 199 + 0 + 3 = 202');

    // 6c: Subtotal 300 -> FREE delivery
    const res300 = calculatePricing([{ price: 300, quantity: 1 }], settings);
    assert.strictEqual(res300.delivery_fee, 0, 'Delivery should be FREE for order 300');
    console.log('✓ Test 6: Delivery Fee ₹25 and Free Delivery Threshold ₹199 passed');
}

// Test 7: Handling Fee update ₹3 -> ₹5
{
    const settings = {
        offers_enabled: false,
        delivery_fee: 0,
        handling_fee: 5,
        handling_fee_enabled: true
    };
    const res = calculatePricing([{ price: 100, quantity: 1 }], settings);
    assert.strictEqual(res.platform_fee, 5, 'Handling fee should be 5');
    assert.strictEqual(res.total, 105, 'Total should be 100 + 5 = 105');
    console.log('✓ Test 7: Handling Fee update ₹3 -> ₹5 passed');
}

// Test 8: Fixed Discount Offer (₹20 OFF on orders >= ₹199)
{
    const settings = {
        offers_enabled: true,
        offer_type: 'fixed',
        offer_value: 20,
        minimum_order_value: 199,
        delivery_fee: 0,
        handling_fee: 3,
        handling_fee_enabled: true
    };
    // 8a: Meets threshold
    const resAbove = calculatePricing([{ price: 200, quantity: 1 }], settings);
    assert.strictEqual(resAbove.global_discount, 20, 'Fixed discount should be 20');
    assert.strictEqual(resAbove.total, 183, 'Total should be 200 - 20 + 3 = 183');

    // 8b: Below threshold
    const resBelow = calculatePricing([{ price: 150, quantity: 1 }], settings);
    assert.strictEqual(resBelow.global_discount, 0, 'Discount should be 0 below min order');
    assert.strictEqual(resBelow.total, 153, 'Total should be 150 + 3 = 153');
    console.log('✓ Test 8: Fixed Discount Offer (₹20 OFF >= ₹199) passed');
}

// Test 9: Master Switch OFF: No global offers applied
{
    const settings = {
        offers_enabled: false,
        offer_type: 'percentage',
        offer_value: 20,
        minimum_order_value: 50,
        delivery_fee: 0,
        handling_fee: 3,
        handling_fee_enabled: true
    };
    const res = calculatePricing([{ price: 200, quantity: 1 }], settings);
    assert.strictEqual(res.global_discount, 0, 'Discount must be 0 when offers are disabled');
    assert.strictEqual(res.total, 203, 'Total should be 200 + 3 = 203');
    console.log('✓ Test 9: Global Offers Master Switch OFF passed');
}

console.log('\n--- All Pricing Calculator Tests Passed Successfully! ---');

// Unit tests for LPUQuick Pricing Calculator (Zero GST, Free Delivery Offer -₹25, Free Handling Offer -₹5, Total = Subtotal)
const assert = require('assert');
const { calculatePricing } = require('../routes/cart');

console.log('--- Running Pricing Calculator Unit Tests ---');

// Test 1: Subtotal with items (135)
{
    const items = [
        { price: 40, quantity: 2 }, // 80
        { price: 55, quantity: 1 }  // 55
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 135, 'Subtotal should be 135');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free Campus Delivery)');
    assert.strictEqual(result.platform_fee, 0, 'Handling fee should be 0 (Waived with Campus Offer)');
    assert.strictEqual(result.tax, 0, 'GST should be 0 (No GST)');
    assert.strictEqual(result.total, 135, 'Total should be exactly 135 (No hidden charges)');
    assert.strictEqual(result.total_savings, 30, 'Total savings should be 25 + 5 = 30');
    console.log('✓ Test 1: Standard items pricing passed (Total = Subtotal)');
}

// Test 2: Single item pricing (20)
{
    const items = [
        { price: 20, quantity: 1 }
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 20, 'Subtotal should be 20');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 0, 'Handling fee should be 0');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 20, 'Total should be exactly 20');
    console.log('✓ Test 2: Single item pricing passed (Total = Subtotal)');
}

// Test 3: Empty cart
{
    const items = [];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 0, 'Subtotal should be 0');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 0, 'Handling fee should be 0');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 0, 'Total should be 0');
    console.log('✓ Test 3: Empty cart passed');
}

console.log('\n--- All Pricing Calculator Tests Passed Successfully! ---');

// Unit tests for LPUQuick Pricing Calculator (Zero GST, Free Delivery Offer, Only ₹5 Handling Fee)
const assert = require('assert');
const { calculatePricing } = require('../routes/cart');

console.log('--- Running Pricing Calculator Unit Tests ---');

// Test 1: Subtotal with items
{
    const items = [
        { price: 40, quantity: 2 }, // 80
        { price: 55, quantity: 1 }  // 55
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 135, 'Subtotal should be 135');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 (Free Campus Delivery)');
    assert.strictEqual(result.platform_fee, 5, 'Handling fee should be ₹5');
    assert.strictEqual(result.tax, 0, 'GST should be 0 (No GST)');
    assert.strictEqual(result.total, 140, 'Total should be 135 + 5 = 140');
    console.log('✓ Test 1: Standard items pricing passed');
}

// Test 2: Single item pricing
{
    const items = [
        { price: 20, quantity: 1 }
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 20, 'Subtotal should be 20');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0');
    assert.strictEqual(result.platform_fee, 5, 'Handling fee should be ₹5');
    assert.strictEqual(result.tax, 0, 'GST should be 0');
    assert.strictEqual(result.total, 25, 'Total should be 20 + 5 = 25');
    console.log('✓ Test 2: Single item pricing passed');
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
    console.log('✓ Test 3: Empty cart passed');
}

console.log('\n--- All Pricing Calculator Tests Passed Successfully! ---');

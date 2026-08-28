// Unit tests for LPUQuick Pricing Calculator
const assert = require('assert');
const { calculatePricing } = require('../routes/cart');

console.log('--- Running Pricing Calculator Unit Tests ---');

// Test 1: Subtotal calculation
{
    const items = [
        { price: 40, quantity: 2 }, // 80
        { price: 55, quantity: 1 }  // 55
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 135, 'Subtotal should be 135');
    assert.strictEqual(result.delivery_fee, 30, 'Delivery fee should be 30 for subtotal < 199');
    assert.strictEqual(result.platform_fee, 5, 'Platform fee should be 5');
    assert.strictEqual(result.tax, 6.75, 'Tax should be 5% of 135 = 6.75');
    assert.strictEqual(result.total, 176.75, 'Total should be 135 + 30 + 5 + 6.75 = 176.75');
    assert.strictEqual(result.free_delivery_remaining, 64, 'Free delivery remaining should be 199 - 135 = 64');
    console.log('✓ Test 1: Below free delivery threshold passed');
}

// Test 2: Free delivery threshold (>= 199)
{
    const items = [
        { price: 120, quantity: 1 },
        { price: 85, quantity: 1 }
    ];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 205, 'Subtotal should be 205');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 for subtotal >= 199');
    assert.strictEqual(result.platform_fee, 5, 'Platform fee should be 5');
    assert.strictEqual(result.tax, 10.25, 'Tax should be 5% of 205 = 10.25');
    assert.strictEqual(result.total, 220.25, 'Total should be 205 + 0 + 5 + 10.25 = 220.25');
    assert.strictEqual(result.free_delivery_remaining, 0, 'Free delivery remaining should be 0 when unlocked');
    console.log('✓ Test 2: Above free delivery threshold passed');
}

// Test 3: Empty cart
{
    const items = [];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 0, 'Subtotal should be 0');
    assert.strictEqual(result.delivery_fee, 30, 'Delivery fee should be 30');
    assert.strictEqual(result.platform_fee, 5, 'Platform fee should be 5');
    assert.strictEqual(result.tax, 0, 'Tax should be 0');
    assert.strictEqual(result.free_delivery_remaining, 199, 'Free delivery remaining should be 199');
    console.log('✓ Test 3: Empty cart passed');
}

// Test 4: Exactly ₹199 threshold
{
    const items = [{ price: 199, quantity: 1 }];
    const result = calculatePricing(items);
    assert.strictEqual(result.subtotal, 199, 'Subtotal should be 199');
    assert.strictEqual(result.delivery_fee, 0, 'Delivery fee should be 0 exactly at 199');
    assert.strictEqual(result.free_delivery_remaining, 0, 'Free delivery remaining should be 0');
    console.log('✓ Test 4: Exact ₹199 threshold passed');
}

console.log('\n--- All Pricing Calculator Tests Passed Successfully! ---');

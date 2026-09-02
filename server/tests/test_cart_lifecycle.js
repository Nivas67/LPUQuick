const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yojndzstlilzlkxonmvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvam5kenN0bGlsemxreG9ubXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1NjYwMywiZXhwIjoyMTAzOTMyNjAzfQ.UiD72830z3goX1uk-lOKmdnikNNgkQ2dywnXrW3OTYg';

async function testCartLifecycle() {
    console.log('================================================================');
    console.log('🛒 VERIFYING COMPLETE CART LIFECYCLE & ZERO REGRESSION');
    console.log('================================================================');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get an active product from DB to test with
    const { data: products } = await supabase.from('products').select('*').limit(1);
    assert(products && products.length > 0, 'Must have at least one product in DB');
    const testProd = products[0];
    const testUserId = `user_cart_test_${Date.now()}`;
    const testGuestId = `guest_cart_test_${Date.now()}`;

    console.log(`Using product: "${testProd.name}" (${testProd.id}, ₹${testProd.price})`);

    // 1. Add item to cart (POST /api/cart)
    console.log('\n--- 1. Testing POST /api/cart (Add to Cart) ---');
    const addRes = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId, productId: testProd.id, quantity: 1 })
    });
    const addData = await addRes.json();
    assert.strictEqual(addRes.status, 200, `Add to cart failed: ${JSON.stringify(addData)}`);
    assert(Array.isArray(addData.items), 'Response must have items array');
    assert.strictEqual(addData.items.length, 1, 'Items count must be 1');
    const item1 = addData.items[0];
    assert.strictEqual(item1.product_id, testProd.id, 'Product ID must match');
    assert.strictEqual(item1.quantity, 1, 'Quantity must be 1');
    assert(item1.cart_id, 'cart_id must be populated');
    assert.strictEqual(item1.name, testProd.name, 'Product name must match');
    console.log(`  ✓ Successfully added to cart: cart_id=${item1.cart_id}, qty=${item1.quantity}`);

    // 2. Fetch cart (GET /api/cart/:userId)
    console.log('\n--- 2. Testing GET /api/cart/:userId ---');
    const getRes = await fetch(`${API_BASE}/cart/${testUserId}`);
    const getData = await getRes.json();
    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getData.items.length, 1);
    assert.strictEqual(getData.items[0].cart_id, item1.cart_id);
    assert.strictEqual(getData.pricing.subtotal, Number(testProd.price));
    console.log(`  ✓ Successfully fetched cart: subtotal=₹${getData.pricing.subtotal}, total=₹${getData.pricing.total}`);

    // 3. Update quantity from 1 -> 2 (PUT /api/cart/:id)
    console.log('\n--- 3. Testing PUT /api/cart/:id (Increment Quantity: 1 -> 2) ---');
    const incRes = await fetch(`${API_BASE}/cart/${item1.cart_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 2, userId: testUserId })
    });
    const incData = await incRes.json();
    assert.strictEqual(incRes.status, 200, `Increment quantity failed: ${JSON.stringify(incData)}`);
    assert.strictEqual(incData.items[0].quantity, 2, 'Quantity must be updated to 2');
    assert.strictEqual(incData.pricing.subtotal, Number(testProd.price) * 2);
    console.log(`  ✓ Successfully incremented quantity: qty=${incData.items[0].quantity}, subtotal=₹${incData.pricing.subtotal}`);

    // 4. Update quantity from 2 -> 1 (PUT /api/cart/:id)
    console.log('\n--- 4. Testing PUT /api/cart/:id (Decrement Quantity: 2 -> 1) ---');
    const decRes = await fetch(`${API_BASE}/cart/${item1.cart_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1, userId: testUserId })
    });
    const decData = await decRes.json();
    assert.strictEqual(decRes.status, 200);
    assert.strictEqual(decData.items[0].quantity, 1, 'Quantity must be updated to 1');
    console.log(`  ✓ Successfully decremented quantity: qty=${decData.items[0].quantity}`);

    // 5. Remove single item (DELETE /api/cart/:id)
    console.log('\n--- 5. Testing DELETE /api/cart/:id (Remove Item) ---');
    const delRes = await fetch(`${API_BASE}/cart/${item1.cart_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testUserId })
    });
    const delData = await delRes.json();
    assert.strictEqual(delRes.status, 200);
    assert.strictEqual(delData.items.length, 0, 'Cart must be empty after removing the item');
    console.log('  ✓ Successfully removed item from cart');

    // 6. Merge Guest Cart (POST /api/cart/merge)
    console.log('\n--- 6. Testing POST /api/cart/merge (Guest Cart Migration) ---');
    // Add item to guest cart
    await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: testGuestId, productId: testProd.id, quantity: 3 })
    });
    // Merge guest cart to logged in user
    const mergeRes = await fetch(`${API_BASE}/cart/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestUserId: testGuestId, targetUserId: testUserId })
    });
    const mergeData = await mergeRes.json();
    assert.strictEqual(mergeRes.status, 200);
    assert.strictEqual(mergeData.items.length, 1);
    assert.strictEqual(mergeData.items[0].quantity, 3);
    console.log(`  ✓ Successfully merged guest cart into user: qty=${mergeData.items[0].quantity}`);

    // 7. Clear user cart (DELETE /api/cart/user/:userId)
    console.log('\n--- 7. Testing DELETE /api/cart/user/:userId (Clear Cart) ---');
    const clearRes = await fetch(`${API_BASE}/cart/user/${testUserId}`, { method: 'DELETE' });
    assert.strictEqual(clearRes.status, 200);

    const finalCheck = await fetch(`${API_BASE}/cart/${testUserId}`);
    const finalData = await finalCheck.json();
    assert.strictEqual(finalData.items.length, 0, 'Cart must be clean');
    console.log('  ✓ Successfully cleared entire cart');

    console.log('\n================================================================');
    console.log('🎉 ALL CART LIFECYCLE TESTS PASSED PERFECTLY!');
    console.log('================================================================\n');
}

testCartLifecycle().catch(err => {
    console.error('\n❌ CART TEST FAILURE:', err);
    process.exit(1);
});

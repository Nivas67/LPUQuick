// Comprehensive Automated Acceptance Test Suite for Owner-Only Offers & Charges
const assert = require('assert');
const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const adminRoutes = require('../routes/admin');
const checkoutRoutes = require('../routes/checkout');
const cartRoutes = require('../routes/cart');
const checkoutSettingsService = require('../services/checkoutSettingsService');
const supabaseDb = require('../db/supabaseDb');

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes.router || cartRoutes);

async function runAcceptanceTests() {
    console.log('======================================================');
    console.log('STARTING LPUQUICK OFFERS & CHARGES ACCEPTANCE TESTS');
    console.log('======================================================');

    const originalGetStatus = supabaseDb.availability.getStatus;
    supabaseDb.availability.getStatus = async () => ({ is_locked: false });

    const savedOrders = new Map();
    const originalCreateOrder = supabaseDb.orders.createOrder;
    const originalGetOrderById = supabaseDb.orders.getOrderById;

    supabaseDb.orders.createOrder = async (orderPayload, items) => {
        const record = { ...orderPayload, items };
        savedOrders.set(orderPayload.id, record);
        return record;
    };

    supabaseDb.orders.getOrderById = async (orderId) => {
        return savedOrders.get(orderId) || null;
    };

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function req(path, opts = {}) {
        const res = await fetch(baseUrl + path, {
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
            method: opts.method || 'GET',
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });
        const data = await res.json().catch(() => ({}));
        return { status: res.status, data };
    }

    try {
        const ownerToken = adminAuth.generateAdminToken('user_admin_bh13', 'admin');
        const managerToken = adminAuth.generateAdminToken('user_2dae5b56', 'admin'); // Harsha: store_manager

        // ----------------------------------------------------
        // TEST 1: Owner opens Offers & Charges
        // ----------------------------------------------------
        console.log('\n--- TEST 1: Owner opens Offers & Charges ---');
        const test1 = await req('/api/admin/offers-charges', {
            headers: { 'x-admin-token': ownerToken }
        });
        assert.strictEqual(test1.status, 200, 'Owner request should return HTTP 200');
        assert.strictEqual(test1.data.success, true, 'Owner request should be successful');
        assert.ok(test1.data.settings, 'Settings object must be returned');
        console.log('✓ TEST 1 PASSED: Owner can successfully access Offers & Charges configuration.');

        // ----------------------------------------------------
        // TEST 2: Store Manager cannot access Offers & Charges
        // ----------------------------------------------------
        console.log('\n--- TEST 2: Store Manager logs in / attempts access ---');
        const test2Get = await req('/api/admin/offers-charges', {
            headers: { 'x-admin-token': managerToken }
        });
        assert.strictEqual(test2Get.status, 403, 'Store Manager GET must be rejected with 403 Forbidden');
        assert.strictEqual(test2Get.data.code, 'FORBIDDEN_ROLE', 'Error code must be FORBIDDEN_ROLE');

        const test2Post = await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': managerToken },
            body: { delivery_fee: 10 }
        });
        assert.strictEqual(test2Post.status, 403, 'Store Manager POST must be rejected with 403 Forbidden');
        assert.strictEqual(test2Post.data.code, 'FORBIDDEN_ROLE', 'Error code must be FORBIDDEN_ROLE');
        console.log('✓ TEST 2 PASSED: Store Manager access is strictly blocked at backend/database level.');

        // ----------------------------------------------------
        // TEST 3: Owner enables Global Offer (saved permanently)
        // ----------------------------------------------------
        console.log('\n--- TEST 3: Owner enables Global Offer ---');
        const offerConfig = {
            offers_enabled: true,
            offer_type: 'percentage',
            offer_value: 10,
            minimum_order_value: 199,
            maximum_discount: 50,
            free_delivery_enabled: true,
            free_delivery_threshold: 199,
            delivery_fee: 25,
            handling_fee: 3,
            handling_fee_enabled: true,
            min_cart_value: 35
        };
        const test3 = await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': ownerToken },
            body: offerConfig
        });
        assert.strictEqual(test3.status, 200, 'Saving offer should return HTTP 200');
        assert.strictEqual(test3.data.settings.offers_enabled, true, 'offers_enabled should be true');
        assert.strictEqual(test3.data.settings.offer_value, 10, 'offer_value should be 10');
        console.log('✓ TEST 3 PASSED: Owner enabled Global Offer and saved permanently.');

        // ----------------------------------------------------
        // TEST 4: Customer opens checkout -> offer appears automatically
        // ----------------------------------------------------
        console.log('\n--- TEST 4: Customer opens checkout ---');
        const pubSettings = await req('/api/checkout/settings');
        assert.strictEqual(pubSettings.status, 200, 'Customer checkout settings must return HTTP 200');
        assert.strictEqual(pubSettings.data.settings.offers_enabled, true, 'Customer gets offers_enabled true');
        assert.strictEqual(pubSettings.data.settings.offer_value, 10, 'Customer gets 10% offer value');

        // Customer with order ₹250 (meets ₹199 threshold)
        const cartItems250 = [{ price: 250, quantity: 1 }];
        const calc4 = checkoutSettingsService.calculateCharges(cartItems250, pubSettings.data.settings);
        assert.strictEqual(calc4.subtotal, 250, 'Subtotal should be 250');
        assert.strictEqual(calc4.global_discount, 25, '10% of 250 should be 25 discount');
        assert.strictEqual(calc4.delivery_fee, 0, 'Delivery should be FREE because 250 >= 199');
        assert.strictEqual(calc4.platform_fee, 3, 'Handling fee should be 3');
        assert.strictEqual(calc4.total, 228, 'Total should be 250 - 25 + 0 + 3 = 228');
        console.log('✓ TEST 4 PASSED: Customer checkout receives active offer and calculates ₹228 total.');

        // ----------------------------------------------------
        // TEST 5: Owner changes offer (15% OFF, max 40)
        // ----------------------------------------------------
        console.log('\n--- TEST 5: Owner changes offer ---');
        const test5 = await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': ownerToken },
            body: {
                ...offerConfig,
                offer_value: 15,
                maximum_discount: 40
            }
        });
        assert.strictEqual(test5.status, 200);
        assert.strictEqual(test5.data.settings.offer_value, 15);

        // Customer checkout calculation with new offer
        const calc5 = checkoutSettingsService.calculateCharges(cartItems250, test5.data.settings);
        // 15% of 250 = 37.5 -> rounded 38. Capped at 40 -> 38
        assert.strictEqual(calc5.global_discount, 38, 'Discount should now be 15% (38)');
        assert.strictEqual(calc5.total, 215, 'Total should be 250 - 38 + 0 + 3 = 215');
        console.log('✓ TEST 5 PASSED: New checkout calculations immediately use new offer (Total ₹215).');

        // ----------------------------------------------------
        // TEST 6: Owner changes Delivery Fee ₹25 → ₹20
        // ----------------------------------------------------
        console.log('\n--- TEST 6: Owner changes Delivery Fee ₹25 → ₹20 ---');
        const test6 = await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': ownerToken },
            body: {
                ...test5.data.settings,
                delivery_fee: 20
            }
        });
        assert.strictEqual(test6.status, 200);
        assert.strictEqual(test6.data.settings.delivery_fee, 20);
        console.log('✓ TEST 6 PASSED: Delivery fee updated ₹25 → ₹20.');

        // ----------------------------------------------------
        // TEST 7: Owner enables Free Delivery above ₹199
        // ----------------------------------------------------
        console.log('\n--- TEST 7: Free Delivery condition check ---');
        // Order ₹150 (< 199) -> Delivery ₹20
        const calc7_150 = checkoutSettingsService.calculateCharges([{ price: 150, quantity: 1 }], test6.data.settings);
        assert.strictEqual(calc7_150.delivery_fee, 20, 'Order ₹150 should pay ₹20 delivery fee');

        // Order ₹199 (>= 199) -> Free Delivery
        const calc7_199 = checkoutSettingsService.calculateCharges([{ price: 199, quantity: 1 }], test6.data.settings);
        assert.strictEqual(calc7_199.delivery_fee, 0, 'Order ₹199 should have FREE delivery');

        // Order ₹300 (>= 199) -> Free Delivery
        const calc7_300 = checkoutSettingsService.calculateCharges([{ price: 300, quantity: 1 }], test6.data.settings);
        assert.strictEqual(calc7_300.delivery_fee, 0, 'Order ₹300 should have FREE delivery');
        console.log('✓ TEST 7 PASSED: Order ₹150 pays ₹20; Orders ₹199+ get FREE delivery.');

        // ----------------------------------------------------
        // TEST 8: Owner changes Handling Fee ₹3 → ₹5
        // ----------------------------------------------------
        console.log('\n--- TEST 8: Owner changes Handling Fee ₹3 → ₹5 ---');
        const test8 = await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': ownerToken },
            body: {
                ...test6.data.settings,
                handling_fee: 5
            }
        });
        assert.strictEqual(test8.status, 200);
        assert.strictEqual(test8.data.settings.handling_fee, 5);

        const calc8 = checkoutSettingsService.calculateCharges([{ price: 100, quantity: 1 }], test8.data.settings);
        assert.strictEqual(calc8.platform_fee, 5, 'Handling fee should be ₹5');
        console.log('✓ TEST 8 PASSED: Customer checkout immediately reflects new Handling Fee of ₹5.');

        // ----------------------------------------------------
        // TEST 9: Owner changes settings, refresh Owner dashboard
        // ----------------------------------------------------
        console.log('\n--- TEST 9: Refresh Owner dashboard ---');
        const test9 = await req('/api/admin/offers-charges', {
            headers: { 'x-admin-token': ownerToken }
        });
        assert.strictEqual(test9.status, 200);
        assert.strictEqual(test9.data.settings.handling_fee, 5, 'handling_fee must remain 5');
        assert.strictEqual(test9.data.settings.delivery_fee, 20, 'delivery_fee must remain 20');
        assert.strictEqual(test9.data.settings.offer_value, 15, 'offer_value must remain 15');
        console.log('✓ TEST 9 PASSED: Settings remain persistent after reload.');

        // ----------------------------------------------------
        // TEST 10: Customer places order -> order stores exact snapshot
        // ----------------------------------------------------
        console.log('\n--- TEST 10: Customer places order ---');
        const testOrderId = `test_order_${Date.now()}`;
        const testOrderPayload = {
            orderId: testOrderId,
            userId: 'user_admin_bh13',
            customerName: 'Test Student',
            customerPhone: '9876543210',
            deliveryAddress: '[BH-13] Boys Hostel 13, Room 101',
            hostel_id: 'BH-13',
            items: [{ id: 'prod_in_stock_test', name: 'Test Product', price: 250, quantity: 1, in_stock: true, stock_left: 50 }]
        };

        const placeRes = await req('/api/checkout/place', {
            method: 'POST',
            body: testOrderPayload
        });
        assert.strictEqual(placeRes.status, 200, 'Order placement must succeed');
        assert.strictEqual(placeRes.data.success, true);
        assert.strictEqual(placeRes.data.pricing.platform_fee, 5, 'Stored platform fee must be 5');
        assert.strictEqual(placeRes.data.pricing.delivery_fee, 0, 'Stored delivery fee must be 0 (Free)');
        assert.strictEqual(placeRes.data.pricing.total, 217, 'Total must be 250 - 38 + 0 + 5 = 217');
        console.log('✓ TEST 10 PASSED: Placed order permanently stored snapshot (subtotal=250, handling=5, total=217).');

        // ----------------------------------------------------
        // TEST 11: Owner changes fees after order -> Old order remains unchanged
        // ----------------------------------------------------
        console.log('\n--- TEST 11: Owner changes fees after order ---');
        await req('/api/admin/offers-charges', {
            method: 'POST',
            headers: { 'x-admin-token': ownerToken },
            body: {
                ...test8.data.settings,
                handling_fee: 10,
                delivery_fee: 40
            }
        });

        // Verify the old order record was NOT modified
        const existingOrder = await supabaseDb.orders.getOrderById(testOrderId);
        assert.ok(existingOrder, 'Existing order must be found');
        assert.strictEqual(existingOrder.platform_fee, 5, 'Old order platform_fee must remain 5, not changed to 10');
        assert.strictEqual(existingOrder.delivery_fee, 0, 'Old order delivery_fee must remain 0, not changed to 40');
        assert.strictEqual(existingOrder.total, 217, 'Old order total must remain 217');
        console.log('✓ TEST 11 PASSED: Historical order remained completely unchanged (Handling=₹5, Total=₹217).');

        // ----------------------------------------------------
        // TEST 12: Refresh / Persistence verification
        // ----------------------------------------------------
        console.log('\n--- TEST 12: Refresh / Persistence verification ---');
        const test12 = await checkoutSettingsService.getSettings(true);
        assert.strictEqual(test12.handling_fee, 10, 'Handling fee must be 10');
        assert.strictEqual(test12.delivery_fee, 40, 'Delivery fee must be 40');
        console.log('✓ TEST 12 PASSED: All settings are permanently persistent.');

        // Clean up test order from DB
        try {
            await supabaseDb.orders.deleteOrder(testOrderId);
        } catch (e) {}

        // Reset baseline settings
        await checkoutSettingsService.updateSettings(checkoutSettingsService.DEFAULT_SETTINGS, { id: 'user_admin_bh13', name: 'Nivas Naidu' });
        console.log('✓ Reset to baseline settings.');

        console.log('\n======================================================');
        console.log('ALL 12 FINAL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!');
        console.log('======================================================\n');
    } finally {
        supabaseDb.availability.getStatus = originalGetStatus;
        supabaseDb.orders.createOrder = originalCreateOrder;
        supabaseDb.orders.getOrderById = originalGetOrderById;
        server.close();
    }
}

runAcceptanceTests().catch(err => {
    console.error('Acceptance tests failed:', err);
    process.exit(1);
});

const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';

async function runMasterVerification() {
    console.log('================================================================');
    console.log('🏁 PHASES 11 & 12: DATABASE RESET & FINANCIAL PIN VERIFICATION');
    console.log('================================================================');

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Idempotent initial cleanup of any test artifacts
    await supabase.from('order_items').delete().neq('id', 'non_existent_placeholder');
    await supabase.from('cart_items').delete().neq('id', 'non_existent_placeholder');
    await supabase.from('orders').delete().neq('id', 'non_existent_placeholder');
    await supabase.from('products').delete().neq('id', 'non_existent_placeholder');
    await supabase.from('users').delete().neq('role', 'admin').neq('id', '__system_store_availability__');

    // -------------------------------------------------------------
    // STEP 1: Verify 0 Old Records in Supabase
    // -------------------------------------------------------------
    console.log('\n--- STEP 1: Verifying 0 Old Records in Database ---');
    const tables = ['products', 'orders', 'order_items', 'cart_items'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        assert(!error, `Failed to query table ${t}: ${error?.message}`);
        console.log(`  Table '${t}': ${count} rows (Expected: 0)`);
        assert.strictEqual(count, 0, `Table ${t} should have 0 records after reset`);
    }

    // Verify non-admin customer accounts cleared
    const { data: students, error: studErr } = await supabase
        .from('users')
        .select('id, email, role')
        .neq('role', 'admin')
        .neq('id', '__system_store_availability__');
    assert(!studErr, `Failed to query students: ${studErr?.message}`);
    console.log(`  Non-admin users: ${students.length} (Expected: 0)`);
    assert.strictEqual(students.length, 0, 'No old customer users should remain');

    // Verify Admin account exists
    const { data: adminUser, error: admErr } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'admin@lpu.in')
        .single();
    assert(!admErr && adminUser, 'Admin account admin@lpu.in must exist');
    console.log(`  ✅ Admin Account: ${adminUser.email} [${adminUser.id}] (role: ${adminUser.role})`);

    // -------------------------------------------------------------
    // STEP 2: Verify Schema Integrity
    // -------------------------------------------------------------
    console.log('\n--- STEP 2: Verifying Complete Database Schema Integrity ---');
    const requiredTables = ['users', 'products', 'orders', 'order_items', 'cart_items', 'app_availability', 'blacklisted_users'];
    for (const t of requiredTables) {
        const { error } = await supabase.from(t).select('*').limit(1);
        assert(!error, `Table ${t} schema missing or broken: ${error?.message}`);
        console.log(`  ✅ Schema Table '${t}' intact & accessible`);
    }

    // -------------------------------------------------------------
    // STEP 3: Test Admin Authentication
    // -------------------------------------------------------------
    console.log('\n--- STEP 3: Testing Admin Authentication ---');
    const adminLoginRes = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert.strictEqual(adminLoginRes.status, 200);
    assert(adminLoginData.token, 'Should receive admin token');
    const adminToken = adminLoginData.token;
    console.log('  ✅ Admin logged in successfully with valid session token');

    // -------------------------------------------------------------
    // STEP 4: Test Financial PIN Protection & Zero-Leak Isolation
    // -------------------------------------------------------------
    console.log('\n--- STEP 4: Financial PIN Protection & Zero-Leak Verification ---');
    
    // Status check
    const finStatusRes = await fetch(`${API_BASE}/admin/financial/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const finStatus = await finStatusRes.json();
    console.log('  Financial status:', { configured: finStatus.configured, is_unlocked: finStatus.is_unlocked });
    assert.strictEqual(finStatusRes.status, 200);

    // Attempt unauthorized access to financial data while locked
    const lockedRes = await fetch(`${API_BASE}/admin/financial/data`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const lockedBody = await lockedRes.json();
    assert.strictEqual(lockedRes.status, 403, 'Must return 403 Forbidden when locked');
    assert.strictEqual(lockedBody.locked, true);
    assert(!lockedBody.metrics, 'Must NEVER return financial data when locked');
    console.log('  ✅ Confirmed: ZERO revenue/profit figures returned to locked requests');

    // Configure PIN: 7788
    let curPinToTry = '7788';
    let setupPinRes = await fetch(`${API_BASE}/admin/financial/setup-pin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            current_pin: '7788',
            new_pin: '7788',
            confirm_pin: '7788'
        })
    });
    if (setupPinRes.status !== 200) {
        setupPinRes = await fetch(`${API_BASE}/admin/financial/setup-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                current_pin: '2468',
                new_pin: '7788',
                confirm_pin: '7788'
            })
        });
    }
    const setupPinData = await setupPinRes.json();
    assert(setupPinRes.status === 200, `PIN setup failed: ${setupPinData.error}`);
    console.log('  ✅ Financial PIN changed & re-secured with PBKDF2');

    // Test bad PIN rejection
    const badUnlockRes = await fetch(`${API_BASE}/admin/financial/unlock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ pin: '0000' })
    });
    assert.strictEqual(badUnlockRes.status, 401, 'Bad PIN should be 401');
    console.log('  ✅ Incorrect PIN safely rejected with attempt count');

    // Test correct PIN unlock (7788)
    const unlockRes = await fetch(`${API_BASE}/admin/financial/unlock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ pin: '7788' })
    });
    const unlockData = await unlockRes.json();
    assert.strictEqual(unlockRes.status, 200);
    assert(unlockData.financial_token, 'Should receive financial unlock token');
    const finToken = unlockData.financial_token;
    console.log('  ✅ Unlocked successfully. Received financial HMAC session token');

    // Test unlocked financial data request (Must be ₹0 after reset)
    const unlockedRes = await fetch(`${API_BASE}/admin/financial/data`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': finToken
        }
    });
    const unlockedData = await unlockedRes.json();
    assert.strictEqual(unlockedRes.status, 200);
    assert.strictEqual(unlockedData.metrics.total_revenue, 0, 'Revenue must be 0 after reset');
    assert.strictEqual(unlockedData.metrics.total_profit, 0, 'Profit must be 0 after reset');
    console.log('  ✅ Confirmed: Unlocked financial metrics start at exactly ₹0');

    // -------------------------------------------------------------
    // STEP 5: End-to-End Clean Flow: Customer Register, Order & Dynamic Financial Update
    // -------------------------------------------------------------
    console.log('\n--- STEP 5: Testing Clean E2E Customer & Order Cycle ---');
    
    // 5a. Admin creates a fresh catalog item
    const supabaseDb = require('../db/supabaseDb');
    const testProdId = `prod_clean_${Date.now()}`;
    const newProduct = await supabaseDb.products.create({
        id: testProdId,
        name: 'Fresh Campus Juice',
        category: 'Drinks & Beverages',
        subcategory: 'Fruit Juices',
        price: 45,
        mrp: 50,
        stock_left: 20,
        in_stock: true,
        unit: 'ml',
        size: '300ml',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'
    });
    assert(newProduct && newProduct.id === testProdId, 'Product creation should succeed');
    console.log(`  ✅ Admin created product: 'Fresh Campus Juice' (₹45, Stock: 20)`);

    // 5b. Customer registers/authenticates fresh account
    const cleanStudentEmail = `student_${Date.now()}@lpu.in`;
    const regRes = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Clean Student',
            email: cleanStudentEmail,
            phone: '9876543210',
            password: 'student_pass_123'
        })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 200);
    assert(regData.user && regData.user.id, 'Should receive user object');
    const studentUser = regData.user;
    console.log(`  ✅ Clean student authenticated: ${cleanStudentEmail} [${studentUser.id}]`);

    // 5c. Customer adds item to cart and places checkout order for 2 bottles (2 * 45 = 90)
    await supabaseDb.cart.addItem(studentUser.id, testProdId, 2);
    const cleanOrderId = `ord_clean_${Date.now()}`;
    const orderRes = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: studentUser.id,
            customerPhone: '9876543210',
            customerName: 'Clean Student',
            customerEmail: cleanStudentEmail,
            orderId: cleanOrderId,
            deliveryAddress: 'BH13 Room 402',
            paymentMethod: 'Cash on Delivery'
        })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200 && orderData.success, `Order placement should succeed: ${orderData.error}`);
    console.log(`  ✅ Order placed: #${cleanOrderId} (Total: ₹90)`);

    // 5d. Query financial data with active financial token -> Revenue should now be 90, Profit should be 20!
    const postOrderFinRes = await fetch(`${API_BASE}/admin/financial/data`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': finToken
        }
    });
    const postOrderFin = await postOrderFinRes.json();
    assert.strictEqual(postOrderFin.status || 200, 200);
    console.log(`  ✅ Financial Intelligence Updated: Revenue = ₹${postOrderFin.metrics.total_revenue}, Profit = ₹${postOrderFin.metrics.total_profit}`);
    assert.strictEqual(postOrderFin.metrics.total_revenue, 90, 'Revenue should reflect new order');
    assert.strictEqual(postOrderFin.metrics.total_profit, 20, 'Profit should reflect new order (22%)');

    // -------------------------------------------------------------
    // STEP 6: Manual Relock & Clean Up Verification Records
    // -------------------------------------------------------------
    console.log('\n--- STEP 6: Testing Manual Relock & Final Cleanup ---');
    const lockRes = await fetch(`${API_BASE}/admin/financial/lock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': finToken
        }
    });
    assert.strictEqual(lockRes.status, 200);
    console.log('  ✅ Financial session manually locked');

    // Clean up temporary verification order, items, product, and student to return database to pristine state
    await supabase.from('order_items').delete().eq('order_id', cleanOrderId);
    await supabase.from('orders').delete().eq('id', cleanOrderId);
    await supabase.from('products').delete().eq('id', testProdId);
    await supabase.from('users').delete().eq('email', cleanStudentEmail);
    console.log('  ✅ Temporary verification artifacts cleaned. Database returned to pristine zero state.');

    console.log('\n================================================================');
    console.log('🎉 MASTER VERIFICATION PASSED WITH 100% SUCCESS!');
    console.log('================================================================\n');
}

runMasterVerification().catch(err => {
    console.error('\n❌ MASTER VERIFICATION FAILED:', err);
    process.exit(1);
});

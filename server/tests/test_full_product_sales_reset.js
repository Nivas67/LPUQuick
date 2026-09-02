const assert = require('assert');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const API_BASE = 'http://localhost:3000/api';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yojndzstlilzlkxonmvd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvam5kenN0bGlsemxreG9ubXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1NjYwMywiZXhwIjoyMTAzOTMyNjAzfQ.UiD72830z3goX1uk-lOKmdnikNNgkQ2dywnXrW3OTYg';

async function runEndToEndVerification() {
    console.log('================================================================');
    console.log('🧪 VERIFYING FULL PRODUCT & SALES DATA RESET (END-TO-END)');
    console.log('================================================================');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // 1. DATABASE AUDIT
    console.log('\n--- 1. Checking Database Row Counts in PostgreSQL ---');
    const tableChecks = ['products', 'orders', 'order_items', 'cart_items'];
    for (const t of tableChecks) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        assert(!error, `Failed to query ${t}: ${error?.message}`);
        console.log(`  Table '${t}': ${count} rows`);
        assert.strictEqual(count, 0, `Table '${t}' must have 0 rows`);
    }

    const { data: users } = await supabase.from('users').select('id, email, role');
    const nonAdmins = users.filter(u => u.role !== 'admin' && u.id !== '__system_store_availability__');
    console.log(`  Non-admin customer accounts: ${nonAdmins.length} (Expected: 0)`);
    assert.strictEqual(nonAdmins.length, 0, 'Must have 0 dummy customer records');

    const admin = users.find(u => u.role === 'admin' && u.email === 'admin@lpu.in');
    assert(admin, 'Admin account admin@lpu.in must exist');
    console.log(`  ✅ Admin Account verified: ${admin.email} (${admin.id})`);

    // 2. CLIENT-FACING APIS
    console.log('\n--- 2. Checking Client-Facing APIs (Must be 100% Empty) ---');
    const prodRes = await fetch(`${API_BASE}/products?fresh=true`);
    const prodData = await prodRes.json();
    console.log(`  Client /api/products count: ${prodData.products?.length || 0}`);
    assert.strictEqual(prodData.products?.length || 0, 0, 'Client products must be 0');

    const homeRes = await fetch(`${API_BASE}/home`);
    const homeData = await homeRes.json();
    console.log(`  Client /api/home products count: ${homeData.all_products?.length || 0}`);
    assert.strictEqual(homeData.all_products?.length || 0, 0, 'Home products must be 0');

    const searchRes = await fetch(`${API_BASE}/products/search?q=maggi`);
    const searchData = await searchRes.json();
    console.log(`  Search 'maggi' results: ${searchData.results?.length || 0}`);
    assert.strictEqual(searchData.results?.length || 0, 0, 'Search results must be empty');

    // 3. ADMIN LOGIN & AUTHENTICATION
    console.log('\n--- 3. Testing Admin Login & Authorization ---');
    const loginRes = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert(loginData.token, 'Must receive admin token');
    const adminToken = loginData.token;
    console.log('  ✅ Admin logged in successfully with JWT');

    // 4. ADMIN DASHBOARD & ANALYTICS ZERO METRICS
    console.log('\n--- 4. Checking Admin Dashboard Metrics (All Must Be 0) ---');
    const analyticsRes = await fetch(`${API_BASE}/orders/admin/analytics?fresh=true`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    const m = analyticsData.metrics || {};
    console.log('  Dashboard metrics:', m);
    assert.strictEqual(m.totalProducts, 0, 'totalProducts must be 0');
    assert.strictEqual(m.totalStock, 0, 'totalStock must be 0');
    assert.strictEqual(m.totalOrdersCount, 0, 'totalOrdersCount must be 0');
    assert.strictEqual(m.pendingOrdersCount, 0, 'pendingOrdersCount must be 0');
    assert.strictEqual(m.deliveredOrdersCount, 0, 'deliveredOrdersCount must be 0');
    assert.strictEqual(analyticsData.topProducts?.length || 0, 0, 'topProducts must be empty');

    const ordersRes = await fetch(`${API_BASE}/orders/admin/all?fresh=true`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const ordersData = await ordersRes.json();
    console.log(`  Admin /api/orders/admin/all count: ${ordersData.orders?.length || 0}`);
    assert.strictEqual(ordersData.orders?.length || 0, 0, 'Admin orders list must be 0');

    // 5. FINANCIAL INTELLIGENCE ZERO LEAK & ZERO METRICS
    console.log('\n--- 5. Checking Financial Intelligence PIN Lock & Zero Metrics ---');
    const finStatusRes = await fetch(`${API_BASE}/admin/financial/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const finStatus = await finStatusRes.json();
    console.log('  Financial status:', { configured: finStatus.configured, is_unlocked: finStatus.is_unlocked });

    // Unlock using current configured PIN (7788)
    const unlockRes = await fetch(`${API_BASE}/admin/financial/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ pin: '7788' })
    });
    const unlockData = await unlockRes.json();
    assert(unlockData.financial_token, 'Should unlock with PIN 7788');

    const finDataRes = await fetch(`${API_BASE}/admin/financial/data`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Financial-Token': unlockData.financial_token }
    });
    const finData = await finDataRes.json();
    console.log('  Financial metrics (Post-Reset):', finData.metrics);
    assert.strictEqual(finData.metrics.total_revenue, 0, 'total_revenue must be 0');
    assert.strictEqual(finData.metrics.total_profit, 0, 'total_profit must be 0');
    assert.strictEqual(finData.metrics.average_order_value, 0, 'average_order_value must be 0');

    // Relock
    await fetch(`${API_BASE}/admin/financial/lock`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'X-Financial-Token': unlockData.financial_token }
    });

    // 6. FUNCTIONALITY TEST: CREATE 1 TEMPORARY PRODUCT, VERIFY COUNT 0 -> 1, THEN DELETE
    console.log('\n--- 6. Testing Functionality: Temporary Product Cycle (0 -> 1 -> 0) ---');
    
    // Create product through official admin API
    const createRes = await fetch(`${API_BASE}/products/admin/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: 'Temporary Verification Item',
            category: 'Snacks & Drinks',
            subcategory: 'Trending Snacks',
            price: 20,
            mrp: 25,
            stock_left: 10,
            unit: 'pack',
            size: '50g',
            image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300'
        })
    });
    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success, 'Admin create product should succeed');
    const createdId = createData.product.id;
    console.log(`  Created temporary test product: ${createdId}`);

    // Verify it appears in client catalog (count = 1)
    const postAddRes = await fetch(`${API_BASE}/products?fresh=true`);
    const postAddData = await postAddRes.json();
    console.log(`  Product count after adding: ${postAddData.products.length} (Expected: 1)`);
    assert.strictEqual(postAddData.products.length, 1);
    assert.strictEqual(postAddData.products[0].id, createdId);

    // Delete temporary product through official admin API
    const delRes = await fetch(`${API_BASE}/products/admin/delete/${createdId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    const delData = await delRes.json();
    assert(delRes.status === 200 && delData.success, 'Admin delete product should succeed');
    console.log('  Deleted temporary test product.');

    // Verify product count returns to 0
    const finalRes = await fetch(`${API_BASE}/products?fresh=true`);
    const finalData = await finalRes.json();
    console.log(`  Final product count after deletion: ${finalData.products.length} (Expected: 0)`);
    assert.strictEqual(finalData.products.length, 0);

    console.log('\n================================================================');
    console.log('🎉 100% END-TO-END VERIFICATION PASSED!');
    console.log('   All products, orders, sales, metrics and mock data are at 0.');
    console.log('   The system is in pristine state ready for real product additions.');
    console.log('================================================================\n');
}

runEndToEndVerification().catch(err => {
    console.error('\n❌ VERIFICATION ERROR:', err);
    process.exit(1);
});

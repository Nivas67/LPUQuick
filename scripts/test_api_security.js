const http = require('http');
const app = require('../server/app');
const { generateAdminToken } = require('../server/middleware/adminAuth');

async function testApiSecurity() {
    console.log('\n--- VERIFYING LIVE ENDPOINT RBAC & PRIVACY ---\n');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const ownerToken = generateAdminToken('user_admin_bh13', 'owner');
        const storeMgrToken = generateAdminToken('user_sm_01', 'admin');
        const deliveryToken = generateAdminToken('user_del_01', 'delivery_person');

        // 1. Owner should succeed on financial status
        const resOwnerFin = await fetch(`${baseUrl}/api/admin/financial/status`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const dataOwnerFin = await resOwnerFin.json();
        console.log('1. Owner /financial/status:', resOwnerFin.status, dataOwnerFin.success ? '✅ ALLOWED (Configured: ' + dataOwnerFin.configured + ')' : dataOwnerFin);
        if (resOwnerFin.status !== 200) throw new Error('Owner should get 200 on financial status');

        // 2. Store manager should get 403 on financial status
        const resSmFin = await fetch(`${baseUrl}/api/admin/financial/status`, {
            headers: { 'Authorization': `Bearer ${storeMgrToken}` }
        });
        const dataSmFin = await resSmFin.json();
        console.log('2. Store Manager /financial/status:', resSmFin.status, dataSmFin.code === 'FORBIDDEN_OWNER_ONLY' ? '✅ FORBIDDEN (403)' : dataSmFin);
        if (resSmFin.status !== 403) throw new Error('Store Manager should get 403 on financial status');

        // 3. Delivery partner should get 403 on financial status
        const resDelFin = await fetch(`${baseUrl}/api/admin/financial/status`, {
            headers: { 'Authorization': `Bearer ${deliveryToken}` }
        });
        const dataDelFin = await resDelFin.json();
        console.log('3. Delivery Partner /financial/status:', resDelFin.status, dataDelFin.code === 'FORBIDDEN_OWNER_ONLY' ? '✅ FORBIDDEN (403)' : dataDelFin);
        if (resDelFin.status !== 403) throw new Error('Delivery Partner should get 403 on financial status');

        // 4. Owner gets cost_price in products
        const resOwnerProd = await fetch(`${baseUrl}/api/products`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const dataOwnerProd = await resOwnerProd.json();
        const ownerFirstProd = dataOwnerProd.products[0];
        const ownerHasCost = ownerFirstProd && ownerFirstProd.cost_price !== undefined;
        console.log('4. Owner /products has cost_price:', ownerHasCost ? '✅ VISIBLE (₹' + ownerFirstProd.cost_price + ')' : '❌ MISSING');
        if (!ownerHasCost) throw new Error('Owner must see cost_price');

        // 5. Store manager has cost_price stripped
        const resSmProd = await fetch(`${baseUrl}/api/products`, {
            headers: { 'Authorization': `Bearer ${storeMgrToken}` }
        });
        const dataSmProd = await resSmProd.json();
        const smFirstProd = dataSmProd.products[0];
        const smHasCost = smFirstProd && (smFirstProd.cost_price !== undefined || smFirstProd.cost !== undefined);
        console.log('5. Store Manager /products cost_price stripped:', !smHasCost ? '✅ STRIPPED (Hidden)' : '❌ LEAKED');
        if (smHasCost) throw new Error('Store Manager must NOT see cost_price');

        // 6. Delivery partner has cost_price stripped
        const resDelProd = await fetch(`${baseUrl}/api/products`, {
            headers: { 'Authorization': `Bearer ${deliveryToken}` }
        });
        const dataDelProd = await resDelProd.json();
        const delFirstProd = dataDelProd.products[0];
        const delHasCost = delFirstProd && (delFirstProd.cost_price !== undefined || delFirstProd.cost !== undefined);
        console.log('6. Delivery Partner /products cost_price stripped:', !delHasCost ? '✅ STRIPPED (Hidden)' : '❌ LEAKED');
        if (delHasCost) throw new Error('Delivery Partner must NOT see cost_price');

        // 7. Public / Customer Storefront has cost_price stripped
        const resPubProd = await fetch(`${baseUrl}/api/products`);
        const dataPubProd = await resPubProd.json();
        const pubFirstProd = dataPubProd.products[0];
        const pubHasCost = pubFirstProd && (pubFirstProd.cost_price !== undefined || pubFirstProd.cost !== undefined);
        console.log('7. Public Storefront /products cost_price stripped:', !pubHasCost ? '✅ STRIPPED (Hidden)' : '❌ LEAKED');
        if (pubHasCost) throw new Error('Public storefront must NOT see cost_price');

        console.log('\n🎉 ALL LIVE ENDPOINT RBAC & PRIVACY CHECKS PASSED!\n');
    } finally {
        server.close();
    }
}

testApiSecurity()
    .then(() => process.exit(0))
    .catch(e => {
        console.error('Fatal API Security Error:', e.message);
        process.exit(1);
    });

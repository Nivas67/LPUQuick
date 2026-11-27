const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

async function runFailClosedUnitChecks() {
    console.log('1. Verifying fail-closed secret handling in clean zero-secret environment...');
    const cleanScript = `
        const assert = require('assert');
        const { getSupabaseClient } = require('./server/supabase');
        const adminAuth = require('./server/middleware/adminAuth');
        const partnerAuth = require('./server/middleware/partnerAuth');
        const customerAuth = require('./server/services/customerAuth');
        const pushService = require('./server/notifications/pushService');

        assert.strictEqual(getSupabaseClient(), null, 'Supabase client must fail closed when URL/key are unset');
        assert.throws(() => adminAuth.generateAdminToken('nivas_naidu_ad', 'owner'), /secret/i);
        assert.strictEqual(adminAuth.verifyAdminToken('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJuaXZhc19uYWlkdV9hZCIsImV4cCI6OTk5OTk5OTk5OTk5OX0.invalid'), null);
        assert.throws(() => partnerAuth.generatePartnerToken('partner_1'), /secret/i);
        assert.strictEqual(partnerAuth.verifyPartnerToken('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwYXJ0bmVyXzEiLCJleHAiOjk5OTk5OTk5OTk5OTl9.invalid'), null);
        assert.strictEqual(customerAuth.issueCustomerSessionToken({ id: 'user_1', role: 'student' }), null, 'Customer token issuance must fail closed when secret is unset');
        assert.strictEqual(customerAuth.verifyCustomerToken('abc.def'), null);
        assert.strictEqual(pushService.getPublicKey(), null, 'Push service must not expose hardcoded VAPID key in production when unset');
        console.log('FAIL_CLOSED_OK');
    `;

    const cleanEnv = {
        ...process.env,
        NODE_ENV: 'production',
        SUPABASE_URL: '',
        SUPABASE_ANON_KEY: '',
        SUPABASE_SERVICE_ROLE_KEY: '',
        JWT_SECRET: '',
        ADMIN_SESSION_SECRET: '',
        PARTNER_SESSION_SECRET: '',
        CUSTOMER_SESSION_SECRET: '',
        SANDBOX_SUPABASE_URL: '',
        SANDBOX_SUPABASE_SERVICE_ROLE_KEY: '',
        TURNSTILE_SITE_KEY: '',
        TURNSTILE_SECRET_KEY: '',
        VAPID_PUBLIC_KEY: '',
        VAPID_PRIVATE_KEY: ''
    };

    const out = execFileSync(process.execPath, ['-e', cleanScript], {
        cwd: path.join(__dirname, '..', '..'),
        env: cleanEnv,
        encoding: 'utf8'
    });
    assert.ok(out.includes('FAIL_CLOSED_OK'), `Unexpected clean-env check output: ${out}`);
    console.log('   [PASS] Fail-closed checks passed without any hardcoded secret fallbacks');
}

function buildIsolatedSupabaseDbFixture() {
    const fixtureProducts = new Map([
        ['fix_prod_chips', {
            id: 'fix_prod_chips',
            name: 'Fixture Masala Chips',
            price: 40,
            mrp: 50,
            category: 'Snacks',
            subcategory: 'Chips',
            unit: '50g',
            size: '50g',
            image_url: '/favicon.png',
            in_stock: true,
            stock_left: 25,
            is_active: true,
            deleted: false
        }],
        ['fix_prod_cola', {
            id: 'fix_prod_cola',
            name: 'Fixture Lime Soda',
            price: 35,
            mrp: 40,
            category: 'Beverages',
            subcategory: 'Soda',
            unit: '250ml',
            size: '250ml',
            image_url: '/favicon.png',
            in_stock: true,
            stock_left: 20,
            is_active: true,
            deleted: false
        }]
    ]);

    const usersById = new Map();
    const cartsByUser = new Map();
    const ordersById = new Map();
    const auditLog = [];

    function computeCart(userId, hostelId = 'BH-13') {
        const userCart = cartsByUser.get(userId) || new Map();
        const items = [];
        for (const [productId, row] of userCart.entries()) {
            const prod = fixtureProducts.get(productId);
            if (!prod || row.quantity <= 0) continue;
            items.push({
                id: row.id,
                cart_id: row.id,
                user_id: userId,
                product_id: productId,
                quantity: row.quantity,
                name: prod.name,
                price: prod.price,
                mrp: prod.mrp,
                image_url: prod.image_url,
                in_stock: prod.in_stock,
                stock_left: prod.stock_left,
                unit: prod.unit,
                size: prod.size,
                category: prod.category,
                hostel_id: hostelId || 'BH-13'
            });
        }

        const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
        const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const totalMrp = items.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
        const platform_fee = items.length > 0 ? 3 : 0;
        const delivery_fee = 0;
        const tax = 0;
        const discount5 = subtotal >= 350 ? Math.round(subtotal * 0.05) : 0;
        const total = Math.max(0, subtotal - discount5 + platform_fee + delivery_fee + tax);

        return {
            items,
            item_count: totalQuantity,
            total_items: totalQuantity,
            pricing: {
                subtotal,
                total_mrp: totalMrp,
                mrp_discount: Math.max(0, totalMrp - subtotal),
                discount5,
                bulk_discount: discount5,
                delivery_fee,
                platform_fee,
                tax,
                total,
                total_savings: Math.max(0, totalMrp - subtotal) + discount5,
                deliveryFee: delivery_fee,
                platformFee: platform_fee,
                min_order_value: 35,
                is_min_order_met: subtotal >= 35,
                min_order_shortfall: Math.max(0, 35 - subtotal),
                item_count: totalQuantity,
                total_items: totalQuantity
            }
        };
    }

    return {
        fixtureProducts,
        usersById,
        cartsByUser,
        ordersById,
        auditLog,
        patch(supabaseDb) {
            supabaseDb.hostels.getAll = async () => ([
                { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE', blocks: ['Block A', 'Block B'] }
            ]);
            supabaseDb.hostels.getById = async (id) => ({
                id: id || 'BH-13',
                name: 'Boys Hostel 13',
                status: 'ACTIVE',
                blocks: ['Block A', 'Block B']
            });

            supabaseDb.inventory.getHostelInventory = async () => {
                const map = {};
                for (const [pid, prod] of fixtureProducts.entries()) {
                    map[pid] = { in_stock: prod.in_stock, stock_left: prod.stock_left, deleted: false };
                }
                return map;
            };

            supabaseDb.products.getAll = async () => Array.from(fixtureProducts.values());
            supabaseDb.products.getById = async (id) => fixtureProducts.get(id) || null;
            supabaseDb.products.getByIds = async (ids) => (ids || []).map((id) => fixtureProducts.get(id)).filter(Boolean);

            supabaseDb.users.getById = async (id) => usersById.get(id) || null;
            supabaseDb.users.getUserById = async (id) => usersById.get(id) || null;
            supabaseDb.users.getByIdentifier = async (identifier) => {
                const target = String(identifier || '').trim().toLowerCase();
                for (const u of usersById.values()) {
                    if ((u.email || '').toLowerCase() === target || (u.phone || '') === target) {
                        return u;
                    }
                }
                return null;
            };
            supabaseDb.users.createUser = async (userData) => {
                const record = {
                    role: 'student',
                    dob: 'Not set',
                    ...userData
                };
                usersById.set(record.id, record);
                return record;
            };
            supabaseDb.users.recordCustomerLogin = async () => {};
            supabaseDb.users.updatePhone = async (id, phone) => {
                const u = usersById.get(id);
                if (!u) return null;
                u.phone = String(phone || '').trim();
                return u;
            };

            supabaseDb.blacklist.isUserBlacklisted = async () => false;
            supabaseDb.availability.getStatus = async () => ({
                is_locked: false,
                lock_type: 'NONE',
                message: null,
                start_at: null,
                end_at: null,
                is_global_lock: false,
                is_hostel_lock: false
            });

            supabaseDb.cart.getCart = async (userId, hostelId = 'BH-13') => computeCart(userId, hostelId);
            supabaseDb.cart.setQuantity = async (userId, productId, quantity, hostelId = 'BH-13') => {
                if (!cartsByUser.has(userId)) cartsByUser.set(userId, new Map());
                const userCart = cartsByUser.get(userId);
                const qty = Math.max(0, Number(quantity) || 0);
                if (qty === 0) {
                    userCart.delete(productId);
                } else {
                    userCart.set(productId, { id: `cart_${userId}_${productId}`, quantity: qty });
                }
                return computeCart(userId, hostelId);
            };
            supabaseDb.cart.addItem = async (userId, productId, quantity = 1, hostelId = 'BH-13') => {
                const userCart = cartsByUser.get(userId) || new Map();
                const current = userCart.get(productId)?.quantity || 0;
                return await supabaseDb.cart.setQuantity(userId, productId, current + (Number(quantity) || 1), hostelId);
            };
            supabaseDb.cart.clearCart = async (userId) => {
                cartsByUser.delete(userId);
            };
            supabaseDb.cart.mergeCart = async (guestUserId, targetUserId) => {
                const guestCart = cartsByUser.get(guestUserId);
                if (guestCart) {
                    for (const [pid, row] of guestCart.entries()) {
                        await supabaseDb.cart.addItem(targetUserId, pid, row.quantity);
                    }
                    cartsByUser.delete(guestUserId);
                }
                return computeCart(targetUserId);
            };

            supabaseDb.orders.createOrder = async (orderPayload, items) => {
                const order = {
                    ...orderPayload,
                    items: (items || []).map((i) => ({ ...i })),
                    created_at: orderPayload.created_at || new Date().toISOString()
                };
                ordersById.set(order.id, order);
                return order;
            };
            supabaseDb.orders.getOrderById = async (orderId) => {
                const o = ordersById.get(orderId);
                return o ? { ...o, items: o.items ? o.items.map((i) => ({ ...i })) : [] } : null;
            };
            supabaseDb.orders.getOrdersByUser = async (userId) => {
                const list = Array.from(ordersById.values())
                    .filter((o) => o.user_id === userId)
                    .map((o) => ({ ...o, items: o.items ? o.items.map((i) => ({ ...i })) : [] }));
                return {
                    active: list.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)),
                    past: list.filter((o) => ['Delivered', 'Cancelled'].includes(o.status))
                };
            };
            supabaseDb.orders.isOrderRestocked = () => false;
            supabaseDb.orders.getAllOrders = async () => Array.from(ordersById.values());
            supabaseDb.orders.cancelOrder = async (orderId, reason = 'Cancelled', actor = 'customer') => {
                const o = ordersById.get(orderId);
                if (!o) throw new Error('Order not found');
                o.status = 'Cancelled';
                o.cancellation_reason = reason;
                o.cancelled_by = actor;
                return { success: true, order: { ...o } };
            };
            supabaseDb.orders.updateDeliveryAddress = async (orderId, newAddress) => {
                const o = ordersById.get(orderId);
                if (!o) return null;
                o.delivery_address = newAddress;
                return { ...o };
            };

            supabaseDb.audit.logAction = async (entry) => {
                auditLog.push(entry);
            };
        }
    };
}

function parseSetCookie(setCookieHeader, cookieName) {
    const raw = Array.isArray(setCookieHeader) ? setCookieHeader : (setCookieHeader ? [setCookieHeader] : []);
    for (const line of raw) {
        if (String(line).startsWith(`${cookieName}=`)) {
            const pair = String(line).split(';')[0];
            return { raw: line, pair };
        }
    }
    return null;
}

async function runTests() {
    console.log('====================================================');
    console.log('LPUQUICK PRODUCTION READINESS & SECURITY TEST SUITE');
    console.log('====================================================\n');

    await runFailClosedUnitChecks();

    // Configure clean isolated Vercel production environment (NO live DB credentials!)
    process.env.NODE_ENV = 'production';
    delete process.env.CLOUDFLARE_WORKERS;
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.PAYMENT_ENVIRONMENT = 'production';
    process.env.ONLINE_PAYMENTS_ENABLED = 'false';
    process.env.PUBLIC_APP_URL = 'https://lpuquick.vercel.app';
    process.env.APP_URL = 'https://lpuquick.vercel.app';
    process.env.TURNSTILE_SITE_KEY = '';
    process.env.TURNSTILE_SECRET_KEY = '';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_ANON_KEY = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.SANDBOX_SUPABASE_URL = '';
    process.env.SANDBOX_SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.VAPID_PUBLIC_KEY = '';
    process.env.VAPID_PRIVATE_KEY = '';
    process.env.ADMIN_SESSION_SECRET = 'test_prod_admin_secret_at_least_32_bytes_long';
    process.env.PARTNER_SESSION_SECRET = 'test_prod_partner_secret_at_least_32_bytes_long';
    process.env.CUSTOMER_SESSION_SECRET = 'test_prod_customer_secret_at_least_32_bytes_long';
    process.env.JWT_SECRET = 'test_prod_jwt_secret_at_least_32_bytes_long';

    const supabaseDb = require('../db/supabaseDb');
    const orderModeService = require('../services/orderModeService');
    const checkoutSettingsService = require('../services/checkoutSettingsService');
    const adminNotificationService = require('../services/adminNotificationService');
    const pushService = require('../notifications/pushService');
    const fixture = buildIsolatedSupabaseDbFixture();
    fixture.patch(supabaseDb);

    adminNotificationService.saveOrderNotification = () => {};
    pushService.notifyNewOrder = async () => ({ delivered: 0, total: 0 });

    orderModeService.getStoreSettings = async (hostelId = 'BH-13') => ({
        hostel_id: hostelId || 'BH-13',
        name: `LPUQuick ${hostelId || 'BH-13'} Express Store`,
        store_name: `LPUQuick ${hostelId || 'BH-13'} Express Store`,
        address: `Ground Floor, ${hostelId || 'BH-13'} Commercial Block`,
        pickup_address: `Ground Floor, ${hostelId || 'BH-13'} Commercial Block`,
        phone: '+91 98765 43210',
        pickup_contact: '+91 98765 43210',
        maps_url: 'https://maps.google.com/?q=LPU+Phagwara',
        pickup_maps_url: 'https://maps.google.com/?q=LPU+Phagwara',
        hours: 'Open Daily',
        pickup_hours: 'Open Daily',
        delivery_enabled: true,
        takeaway_enabled: true,
        maintenance_fee_enabled: true,
        maintenance_fee_amount: 2,
        maintenance_fee_type: 'fixed',
        global_delivery_enabled: true,
        global_takeaway_enabled: true
    });
    checkoutSettingsService.getSettings = async () => ({ ...checkoutSettingsService.DEFAULT_SETTINGS });

    const app = require('../app');
    const { generateAdminToken } = require('../middleware/adminAuth');
    const { generatePartnerToken } = require('../middleware/partnerAuth');

    const server = await new Promise((resolve) => {
        const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    try {
        console.log('2. Testing health, realtime secret safety, and VAPID fail-closed...');
        const healthRes = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(healthRes.status, 200);
        const healthBody = await healthRes.json();
        assert.strictEqual(healthBody.environment, 'production');
        assert.strictEqual(healthBody.onlinePaymentsEnabled, false);

        const rtRes = await fetch(`${baseUrl}/api/realtime/config`);
        const rtText = await rtRes.text();
        assert.strictEqual(rtText.includes('sb_secret_'), false, '/api/realtime/config must never leak secret keys');

        const vapidRes = await fetch(`${baseUrl}/api/notifications/vapid-public-key`);
        assert.strictEqual(vapidRes.status, 503, 'VAPID public key endpoint must fail closed when keys unset');
        console.log('   [PASS] Health, realtime config, and VAPID fail-closed checks passed');

        console.log('3. Testing customer signup, signin, HttpOnly cookie session, logout & anti-forgery...');
        const signupAliceRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-Proto': 'https'
            },
            body: JSON.stringify({
                name: 'Alice Fixture',
                email: 'alice.fixture@lpu.in',
                password: 'StrongPassword#2026',
                phone: '9876543210'
            })
        });
        assert.strictEqual(signupAliceRes.status, 200);
        const aliceCookieInfo = parseSetCookie(signupAliceRes.headers.getSetCookie(), 'lpuquick_customer_session');
        assert.ok(aliceCookieInfo, 'Signup must set lpuquick_customer_session HttpOnly cookie');
        assert.ok(aliceCookieInfo.raw.includes('HttpOnly'), 'Customer session cookie must include HttpOnly');
        assert.ok(aliceCookieInfo.raw.includes('SameSite=Lax'), 'Customer session cookie must include SameSite=Lax');
        assert.ok(aliceCookieInfo.raw.includes('Secure'), 'Customer session cookie must include Secure over HTTPS');

        const signupAliceData = await signupAliceRes.json();
        assert.strictEqual(signupAliceData.success, true);
        assert.ok(signupAliceData.token, 'Signup should return signed customer token');
        const aliceId = signupAliceData.user.id;
        const aliceToken = signupAliceData.token;

        const dupSignupRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Alice Dup',
                email: 'alice.fixture@lpu.in',
                password: 'AnotherPassword#2026'
            })
        });
        assert.strictEqual(dupSignupRes.status, 409, 'Duplicate email signup must fail with 409');

        const badPassRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alice.fixture@lpu.in', password: 'WrongPassword!' })
        });
        assert.strictEqual(badPassRes.status, 401);

        const unknownSigninRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'nobody.fixture@lpu.in', password: 'SomePassword#1' })
        });
        assert.strictEqual(unknownSigninRes.status, 401, 'Signin must NOT auto-register unregistered emails');

        const spoofGoogleRes = await fetch(`${baseUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'alice.fixture@lpu.in', name: 'Spoofed Alice' })
        });
        assert.ok([400, 401].includes(spoofGoogleRes.status), `Unverified Google profile body must be rejected (got ${spoofGoogleRes.status})`);

        const signinAliceRes = await fetch(`${baseUrl}/api/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https' },
            body: JSON.stringify({ email: 'alice.fixture@lpu.in', password: 'StrongPassword#2026' })
        });
        assert.strictEqual(signinAliceRes.status, 200);
        const aliceSessionCookie = parseSetCookie(signinAliceRes.headers.getSetCookie(), 'lpuquick_customer_session').pair;

        const anonSessionRes = await fetch(`${baseUrl}/api/auth/session`);
        const anonSessionData = await anonSessionRes.json();
        assert.strictEqual(anonSessionData.authenticated, false);

        const authSessionRes = await fetch(`${baseUrl}/api/auth/session`, {
            headers: { Cookie: aliceSessionCookie }
        });
        const authSessionData = await authSessionRes.json();
        assert.strictEqual(authSessionData.authenticated, true);
        assert.strictEqual(authSessionData.user.id, aliceId);

        const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: { Cookie: aliceSessionCookie }
        });
        assert.strictEqual(logoutRes.status, 200);
        const clearedCookie = parseSetCookie(logoutRes.headers.getSetCookie(), 'lpuquick_customer_session');
        assert.ok(clearedCookie && (clearedCookie.raw.includes('Max-Age=0') || clearedCookie.raw.includes('Expires=')), 'Logout must expire cookie');

        // Signup Bob for cross-tenant ownership checks
        const signupBobRes = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Bob Fixture',
                email: 'bob.fixture@lpu.in',
                password: 'StrongPassword#2026',
                phone: '9876543211'
            })
        });
        assert.strictEqual(signupBobRes.status, 200);
        const bobCookie = parseSetCookie(signupBobRes.headers.getSetCookie(), 'lpuquick_customer_session').pair;
        console.log('   [PASS] Customer auth lifecycle & cookie verification passed');

        console.log('4. Testing isolated catalog, cart, Pay-on-Delivery checkout & order lifecycle...');
        const productsRes = await fetch(`${baseUrl}/api/products?hostel_id=BH-13`);
        assert.strictEqual(productsRes.status, 200);
        const productsBody = await productsRes.json();
        assert.strictEqual(productsBody.products.length, 2);

        const homeRes = await fetch(`${baseUrl}/api/home?hostel_id=BH-13`);
        assert.strictEqual(homeRes.status, 200);
        const homeBody = await homeRes.json();
        assert.strictEqual(homeBody.is_personalized_buy_again, false);

        // Add to Alice cart using her verified session cookie
        const addCartRes = await fetch(`${baseUrl}/api/cart/set-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({ userId: aliceId, productId: 'fix_prod_chips', quantity: 2, hostel_id: 'BH-13' })
        });
        assert.strictEqual(addCartRes.status, 200);
        const addCartBody = await addCartRes.json();
        assert.strictEqual(addCartBody.pricing.subtotal, 80);

        // Online payment routes & online checkout methods MUST be blocked in production (ONLINE_PAYMENTS_ENABLED=false)
        const sbxCreateRes = await fetch(`${baseUrl}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({ userId: aliceId })
        });
        assert.strictEqual(sbxCreateRes.status, 403);
        assert.strictEqual((await sbxCreateRes.json()).code, 'ONLINE_PAYMENTS_DISABLED');

        const sbxWebhookRes = await fetch(`${baseUrl}/api/payments/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'order.paid' })
        });
        assert.strictEqual(sbxWebhookRes.status, 403);

        const onlineCheckoutRes = await fetch(`${baseUrl}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({
                userId: aliceId,
                customerName: 'Alice Fixture',
                customerPhone: '9876543210',
                customerEmail: 'alice.fixture@lpu.in',
                hostel_id: 'BH-13',
                order_mode: 'DELIVERY',
                deliveryAddress: 'BH-13 (Block A), Room 101',
                paymentMethod: 'upi'
            })
        });
        assert.strictEqual(onlineCheckoutRes.status, 400);
        assert.strictEqual((await onlineCheckoutRes.json()).code, 'PAYMENT_METHOD_DISABLED');

        // Valid Pay on Delivery checkout for Alice
        const codCheckoutRes = await fetch(`${baseUrl}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({
                userId: aliceId,
                customerName: 'Alice Fixture',
                customerPhone: '9876543210',
                customerEmail: 'alice.fixture@lpu.in',
                hostel_id: 'BH-13',
                order_mode: 'DELIVERY',
                deliveryAddress: 'BH-13 (Block A), Room 101',
                paymentMethod: 'Pay on Delivery'
            })
        });
        assert.strictEqual(codCheckoutRes.status, 200, await codCheckoutRes.clone().text());
        const codCheckoutData = await codCheckoutRes.json();
        assert.strictEqual(codCheckoutData.success, true);
        assert.strictEqual(codCheckoutData.order.user_id, aliceId);
        assert.strictEqual(codCheckoutData.order.payment_method, 'Pay on Delivery');
        const aliceOrderId = codCheckoutData.order.id;

        const aliceOrdersRes = await fetch(`${baseUrl}/api/orders/${aliceId}`, {
            headers: { Cookie: aliceSessionCookie }
        });
        assert.strictEqual(aliceOrdersRes.status, 200);
        const aliceOrders = await aliceOrdersRes.json();
        assert.strictEqual((aliceOrders.active || []).length + (aliceOrders.past || []).length, 1);

        const aliceDetailRes = await fetch(`${baseUrl}/api/orders/detail/${aliceOrderId}`, {
            headers: { Cookie: aliceSessionCookie }
        });
        assert.strictEqual(aliceDetailRes.status, 200);

        const aliceReorderRes = await fetch(`${baseUrl}/api/orders/${aliceOrderId}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({ userId: aliceId })
        });
        assert.strictEqual(aliceReorderRes.status, 200);

        const aliceCancelRes = await fetch(`${baseUrl}/api/orders/${aliceOrderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: aliceSessionCookie },
            body: JSON.stringify({ userId: aliceId, reason: 'Fixture test cancel' })
        });
        assert.strictEqual(aliceCancelRes.status, 200);
        console.log('   [PASS] Catalog, cart, COD checkout, online payment guard & order lifecycle passed');

        console.log('5. Testing cross-tenant customer data isolation & signed guest cookie binding...');
        // Spoofed x-user-id without valid session must return 401
        for (const reqSpec of [
            { url: `${baseUrl}/api/auth/profile/${aliceId}`, opts: { headers: { 'x-user-id': aliceId } } },
            { url: `${baseUrl}/api/cart/${aliceId}`, opts: { headers: { 'x-user-id': aliceId } } },
            { url: `${baseUrl}/api/orders/${aliceId}`, opts: { headers: { 'x-user-id': aliceId } } },
            { url: `${baseUrl}/api/orders/detail/${aliceOrderId}`, opts: { headers: { 'x-user-id': aliceId } } },
            { url: `${baseUrl}/api/home/user-buy-again?userId=${aliceId}`, opts: { headers: { 'x-user-id': aliceId } } }
        ]) {
            const unauthRes = await fetch(reqSpec.url, reqSpec.opts);
            assert.strictEqual(unauthRes.status, 401, `Spoofed unauth ${reqSpec.url} must return 401 (got ${unauthRes.status})`);
        }

        // Bob trying to access/mutate Alice's resources must return 403
        for (const reqSpec of [
            { url: `${baseUrl}/api/auth/profile/${aliceId}`, opts: { headers: { Cookie: bobCookie } } },
            { url: `${baseUrl}/api/auth/update-address`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ userId: aliceId, hostel: 'BH-13', block: 'A', room: '999' }) } },
            { url: `${baseUrl}/api/cart/${aliceId}`, opts: { headers: { Cookie: bobCookie } } },
            { url: `${baseUrl}/api/cart/set-quantity`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ userId: aliceId, productId: 'fix_prod_chips', quantity: 5 }) } },
            { url: `${baseUrl}/api/checkout`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ userId: aliceId, paymentMethod: 'Pay on Delivery', phone: '9876543210' }) } },
            { url: `${baseUrl}/api/orders/${aliceId}`, opts: { headers: { Cookie: bobCookie } } },
            { url: `${baseUrl}/api/orders/detail/${aliceOrderId}`, opts: { headers: { Cookie: bobCookie } } },
            { url: `${baseUrl}/api/orders/${aliceOrderId}/cancel`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ reason: 'hijack' }) } },
            { url: `${baseUrl}/api/orders/${aliceOrderId}/reorder`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ userId: aliceId }) } },
            { url: `${baseUrl}/api/orders/${aliceOrderId}/change-address`, opts: { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: bobCookie }, body: JSON.stringify({ newAddress: 'Attacker Hostel' }) } },
            { url: `${baseUrl}/api/home/user-buy-again?userId=${aliceId}`, opts: { headers: { Cookie: bobCookie } } }
        ]) {
            const crossRes = await fetch(reqSpec.url, reqSpec.opts);
            assert.strictEqual(crossRes.status, 403, `Cross-tenant ${reqSpec.url} must return 403 (got ${crossRes.status})`);
        }

        // Home feed personalization isolation check
        const snoopedHomeRes = await fetch(`${baseUrl}/api/home?hostel_id=BH-13&userId=${aliceId}`);
        const snoopedHomeBody = await snoopedHomeRes.json();
        assert.strictEqual(snoopedHomeBody.is_personalized_buy_again, false, 'Unauthenticated ?userId= snooping must never return personalized order history');

        // Bound guest cart cookie verification
        const guestWrite1 = await fetch(`${baseUrl}/api/cart/set-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'guest_fix_one', productId: 'fix_prod_cola', quantity: 1, hostel_id: 'BH-13' })
        });
        assert.strictEqual(guestWrite1.status, 200);
        const guestCookie = parseSetCookie(guestWrite1.headers.getSetCookie(), 'lpuquick_guest_session')?.pair;
        assert.ok(guestCookie, 'Initial guest cart creation must mint signed lpuquick_guest_session cookie');

        const guestReadWrong = await fetch(`${baseUrl}/api/cart/guest_fix_other`, {
            headers: { Cookie: guestCookie }
        });
        assert.strictEqual(guestReadWrong.status, 403, 'Guest session cookie for one guest ID must NOT read another guest ID cart');

        const guestReadValid = await fetch(`${baseUrl}/api/cart/guest_fix_one`, {
            headers: { Cookie: guestCookie }
        });
        assert.strictEqual(guestReadValid.status, 200);
        console.log('   [PASS] Customer isolation & guest HMAC cart binding passed');

        console.log('6. Testing admin & partner RBAC route enforcement...');
        const adminUnauth = await fetch(`${baseUrl}/api/orders/admin/all`);
        assert.strictEqual(adminUnauth.status, 401);

        const adminWithCustomerTok = await fetch(`${baseUrl}/api/orders/admin/all`, {
            headers: { 'x-admin-token': aliceToken }
        });
        assert.strictEqual(adminWithCustomerTok.status, 401, 'Customer HMAC token must NEVER authenticate as admin');

        const adminPushTestUnauth = await fetch(`${baseUrl}/api/notifications/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminName: 'Attacker' })
        });
        assert.strictEqual(adminPushTestUnauth.status, 401);

        const ownerToken = generateAdminToken('nivas_naidu_ad', 'owner');
        const adminWithOwnerTok = await fetch(`${baseUrl}/api/orders/admin/all`, {
            headers: { 'x-admin-token': ownerToken }
        });
        assert.strictEqual(adminWithOwnerTok.status, 200);

        const partnerToken = generatePartnerToken('partner_fixture_1');
        const adminWithPartnerTok = await fetch(`${baseUrl}/api/orders/admin/all`, {
            headers: { 'x-admin-token': partnerToken }
        });
        assert.strictEqual(adminWithPartnerTok.status, 401, 'Partner token must NEVER grant admin access');

        const partnerUnauth = await fetch(`${baseUrl}/api/partner/profile`);
        assert.strictEqual(partnerUnauth.status, 401);
        const partnerWithCustomer = await fetch(`${baseUrl}/api/partner/profile`, {
            headers: { 'x-partner-token': aliceToken }
        });
        assert.strictEqual(partnerWithCustomer.status, 401, 'Customer token must NEVER grant partner access');
        console.log('   [PASS] Admin & partner authorization boundaries verified');

        console.log('7. Testing direct Vercel deployment manifests, dzygsmgdzvroxepwyjyz RLS SQL, and portal JS sync...');
        const vercelCfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'vercel.json'), 'utf8'));
        assert.strictEqual(vercelCfg.functions?.['api/index.js']?.memory, undefined, 'vercel.json must not hardcode deprecated memory under Fluid Compute');
        assert.strictEqual(vercelCfg.functions?.['api/index.js']?.maxDuration, 30);
        const rawVercelJson = JSON.stringify(vercelCfg);
        assert.strictEqual(rawVercelJson.includes('workers.dev'), false, 'Active Vercel config must never reference workers.dev');
        assert.ok(rawVercelJson.includes('https://challenges.cloudflare.com'), 'CSP in vercel.json must allow Cloudflare Turnstile scripts/frames');
        const apiRewrite = (vercelCfg.rewrites || []).find((r) => r.source === '/api/(.*)');
        assert.ok(apiRewrite && apiRewrite.destination === '/api/index.js');
        assert.ok((vercelCfg.rewrites || []).some((r) => r.source === '/admin/(.*)' && r.destination === '/admin/index.html'));
        assert.ok((vercelCfg.rewrites || []).some((r) => r.source === '/partner/(.*)' && r.destination === '/public/partner/index.html'));

        const vercelIgnore = fs.readFileSync(path.join(__dirname, '..', '..', '.vercelignore'), 'utf8');
        for (const ignored of ['vercel-proxy', 'wrangler.jsonc', '.wrangler', '.env']) {
            assert.ok(vercelIgnore.includes(ignored), `.vercelignore must exclude ${ignored}`);
        }

        const rlsSql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '20261127_dzygsmgdzvroxepwyjyz_full_schema_and_rls.sql'), 'utf8');
        for (const table of ['users', 'hostels', 'products', 'cart_items', 'orders', 'order_items', 'app_availability', 'blacklisted_users', 'audit_logs', 'turnstile_used_tokens']) {
            assert.ok(rlsSql.includes(`public.${table}`), `Migration must include public.${table}`);
            assert.ok(rlsSql.includes(`'${table}'`), `Migration RLS block must cover public.${table}`);
        }
        assert.strictEqual(rlsSql.includes('vltnqvktdlpcltndmmwl'), false);
        assert.strictEqual(rlsSql.includes('mgsxeguulxumfgehpphb'), false);
        assert.ok(fs.existsSync(path.join(__dirname, '..', 'db', 'migrations', '20261127_dzygsmgdzvroxepwyjyz_rollback.sql')));

        const seedSqlPath = path.join(__dirname, '..', 'db', 'migrations', '20261127_dzygsmgdzvroxepwyjyz_seed_catalog_and_config.sql');
        assert.ok(fs.existsSync(seedSqlPath), 'Non-PII catalog & config seed SQL must exist');
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
        const hostelInsertCount = (seedSql.match(/INSERT INTO public\.hostels /g) || []).length;
        const productInsertCount = (seedSql.match(/INSERT INTO public\.products /g) || []).length;
        assert.strictEqual(hostelInsertCount, 14, 'Seed SQL must preserve all 14 hostels');
        assert.strictEqual(productInsertCount, 73, 'Seed SQL must preserve all 73 products');
        assert.strictEqual(/7671836211|sathwik@lpuquick\.com|yojndzstlilzlkxonmvd|vltnqvktdlpcltndmmwl|mgsxeguulxumfgehpphb|workers\.dev|pages\.dev|password_hash/i.test(seedSql), false, 'Seed SQL must contain zero PII, legacy DB refs, or Cloudflare domains');

        for (const rel of ['js/turnstile-client.js', 'js/api.js', 'js/app.js', 'js/pages/signin.js', 'js/pages/checkout.js']) {
            const clientContent = fs.readFileSync(path.join(__dirname, '..', '..', 'client', rel), 'utf8').replace(/\r\n/g, '\n');
            const publicContent = fs.readFileSync(path.join(__dirname, '..', '..', 'public', rel), 'utf8').replace(/\r\n/g, '\n');
            assert.strictEqual(clientContent, publicContent, `public/${rel} must stay identical to client/${rel}`);
        }
        for (const rel of ['index.html', 'js/admin.js']) {
            const rootAdmin = fs.readFileSync(path.join(__dirname, '..', '..', 'admin', rel), 'utf8').replace(/\r\n/g, '\n');
            const pubAdmin = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'admin', rel), 'utf8').replace(/\r\n/g, '\n');
            assert.strictEqual(rootAdmin, pubAdmin, `public/admin/${rel} must stay identical to admin/${rel}`);
        }
        assert.strictEqual(fs.existsSync(path.join(__dirname, '..', 'config', 'vapid.json')), false, 'Committed VAPID private key file must be removed');
        console.log('   [PASS] Direct Vercel manifest, dzygsmgdzvroxepwyjyz SQL migration & mirror sync verified');

        console.log('\n====================================================');
        console.log('ALL PRODUCTION READINESS TESTS PASSED');
        console.log('====================================================');
    } finally {
        server.close();
    }
}

runTests().catch((err) => {
    console.error('\n[FAIL] Production readiness test failed:', err);
    process.exit(1);
});

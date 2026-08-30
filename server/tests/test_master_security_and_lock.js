// Comprehensive Automated Verification Suite for:
// 1. Client Lock + Reopen Schedule
// 2. Blacklist & Fraud Prevention
// 3. Profit Security
// 4. Admin HMAC-SHA256 Authentication
// 5. Checkout Server-Side Enforcement

const http = require('http');
const app = require('../app');
const supabaseDb = require('../db/supabaseDb');
const { generateAdminSessionToken } = require('../middleware/adminAuth');

let server;
let port = 3899;
let baseUrl;

function request(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: parsed
                });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        testPassed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        testFailed++;
    }
}

async function runTests() {
    console.log('\n======================================================');
    console.log('🚀 RUNNING MASTER SECURITY, LOCK & BLACKLIST TEST SUITE');
    console.log('======================================================\n');

    await new Promise((resolve) => {
        server = app.listen(port, () => {
            baseUrl = `http://localhost:${port}`;
            resolve();
        });
    });

    try {
        // ----------------------------------------------------
        // TEST SUITE 1: ADMIN AUTHENTICATION & SECURITY
        // ----------------------------------------------------
        console.log('--- TEST SUITE 1: Admin HMAC Session Authentication ---');

        // 1.1: Reject unauthenticated requests to /api/admin/client-lock
        const unauthRes = await request('GET', '/api/admin/client-lock');
        assert(unauthRes.status === 401 || unauthRes.status === 403, 'Rejects unauthenticated admin request with 401/403');

        // 1.2: Reject fake/forged Bearer token
        const forgedRes = await request('GET', '/api/admin/client-lock', {
            'Authorization': 'Bearer fake_admin_token_12345'
        });
        assert(forgedRes.status === 401 || forgedRes.status === 403, 'Rejects forged token with 401/403');

        // 1.3: Reject spoofed Referer header (ensure legacy referer bypass is eliminated)
        const refererRes = await request('GET', '/api/admin/client-lock', {
            'Referer': 'http://localhost:3000/admin/'
        });
        assert(refererRes.status === 401 || refererRes.status === 403, 'Strictly eliminates Referer header bypass');

        // 1.4: Login with valid credentials and receive HMAC session token
        const loginRes = await request('POST', '/api/auth/admin-login', {}, {
            email: 'admin@lpu.in',
            password: process.env.ADMIN_PASSWORD || 'admin123'
        });
        assert(loginRes.status === 200 && loginRes.body.success && loginRes.body.token, 'Admin login succeeds and issues signed token');
        const adminToken = loginRes.body.token;

        const authHeaders = { 'Authorization': `Bearer ${adminToken}` };

        // ----------------------------------------------------
        // TEST SUITE 2: PROFIT SECURITY & SENSITIVITY GUARD
        // ----------------------------------------------------
        console.log('\n--- TEST SUITE 2: Profit Security & Masking ---');

        // 2.1: Lock profit visibility
        await request('POST', '/api/admin/profit-visibility', authHeaders, { locked: true });

        // 2.2: Verify GET /api/admin/profits returns ONLY { locked: true } and masks metrics
        const lockedProfitRes = await request('GET', '/api/admin/profits', authHeaders);
        assert(lockedProfitRes.body.locked === true, 'Profit endpoint returns locked=true');
        assert(lockedProfitRes.body.net_profit === undefined, 'Profit endpoint does NOT leak net_profit when locked');
        assert(lockedProfitRes.body.total_costs === undefined, 'Profit endpoint does NOT leak total_costs when locked');

        // 2.3: Unlock profit visibility and verify metrics are returned
        const unlockProfitRes = await request('POST', '/api/admin/profit-visibility', authHeaders, { locked: false });
        assert(unlockProfitRes.body.success === true, 'Admin can toggle profit visibility to unlocked');

        const activeProfitRes = await request('GET', '/api/admin/profits', authHeaders);
        assert(activeProfitRes.body.locked === false, 'Profit endpoint returns unlocked data');
        assert(activeProfitRes.body.revenue !== undefined, 'Profit endpoint calculates revenue');
        assert(activeProfitRes.body.net_profit !== undefined, 'Profit endpoint calculates net profit');

        // Re-lock profits to maintain default secure state
        await request('POST', '/api/admin/profit-visibility', authHeaders, { locked: true });

        // ----------------------------------------------------
        // TEST SUITE 3: STORE AVAILABILITY & LOCK CONTROLS
        // ----------------------------------------------------
        console.log('\n--- TEST SUITE 3: Storefront Availability & Lock Control ---');

        // 3.1: Unlock store first
        const initUnlock = await request('DELETE', '/api/admin/client-lock', authHeaders);
        assert(initUnlock.body.success === true, 'Store reset to unlocked');

        const pubStatusOpen = await request('GET', '/api/client/status');
        assert(pubStatusOpen.body.is_locked === false, 'Public client status returns is_locked=false');

        // 3.2: Apply Immediate Lock
        const lockRes = await request('POST', '/api/admin/client-lock', authHeaders, {
            lock_type: 'IMMEDIATE',
            message: 'Dark store BH13 is temporarily restocking'
        });
        assert(lockRes.body.success === true, 'Admin applied Immediate Store Lock');

        const pubStatusLocked = await request('GET', '/api/client/status');
        assert(pubStatusLocked.body.is_locked === true, 'Public status shows store is LOCKED');
        assert(pubStatusLocked.body.lock_status === 'LOCKED', 'Public lock_status is LOCKED');
        assert(pubStatusLocked.body.message === 'Dark store BH13 is temporarily restocking', 'Public custom message is preserved');

        // 3.3: Apply Duration Lock (e.g. 45 minutes)
        const durLockRes = await request('POST', '/api/admin/client-lock', authHeaders, {
            lock_type: 'DURATION',
            duration_minutes: 45
        });
        assert(durLockRes.body.success === true, 'Admin applied 45-minute Duration Lock');
        assert(durLockRes.body.availability.remaining_seconds > 0, 'Duration lock includes positive remaining_seconds');
        assert(durLockRes.body.availability.display_reopen !== undefined, 'Duration lock includes display_reopen natural language');

        // 3.4: Unlock Storefront
        const unlockRes = await request('DELETE', '/api/admin/client-lock', authHeaders);
        assert(unlockRes.body.success === true, 'Admin unlocked store');
        assert(unlockRes.body.availability.is_locked === false, 'Store status is restored to open');

        // ----------------------------------------------------
        // TEST SUITE 4: CHECKOUT PREVENTION UNDER LOCK
        // ----------------------------------------------------
        console.log('\n--- TEST SUITE 4: Checkout Enforcement Under Lock ---');

        // Lock store again
        await request('POST', '/api/admin/client-lock', authHeaders, {
            lock_type: 'IMMEDIATE',
            message: 'Closed for testing'
        });

        // Attempt checkout as student
        const checkoutLockedRes = await request('POST', '/api/checkout', {}, {
            userId: 'test_student_user_1',
            paymentMethod: 'Cash on Delivery',
            deliveryAddress: 'BH13 (Block A), Room 204'
        });
        assert(checkoutLockedRes.status === 400, 'Checkout fails with 400 when store is locked');
        assert(checkoutLockedRes.body.error === 'STORE_CLOSED', 'Checkout error code is STORE_CLOSED');
        assert(checkoutLockedRes.body.availability !== undefined, 'Checkout response includes availability info');

        // Re-open store for subsequent tests
        await request('DELETE', '/api/admin/client-lock', authHeaders);

        // ----------------------------------------------------
        // TEST SUITE 5: FRAUD PREVENTION & BLACKLIST SYSTEM
        // ----------------------------------------------------
        console.log('\n--- TEST SUITE 5: Fraud Prevention & Blacklist System ---');

        const testUserId = 'test_fraud_student_99';
        const testUserEmail = 'fraud.student@lpu.in';
        const testUserPhone = '9876543210';

        // 5.1: Block user with "Fake Orders" reason
        const blockRes = await request('PATCH', `/api/admin/users/${testUserId}/block`, authHeaders, {
            reason: 'Fake Orders',
            notes: 'Repeatedly submitted fake hostel room orders and cancelled upon arrival.'
        });
        assert(blockRes.body.success === true, 'Admin successfully blocked fraudulent student');
        assert(blockRes.body.user.account_status === 'BLOCKED', 'User account_status set to BLOCKED');
        assert(blockRes.body.user.block_reason === 'Fake Orders', 'User block_reason set to Fake Orders');

        // 5.2: Verify user status check endpoint
        const checkStatusRes = await request('GET', `/api/auth/check-status/${testUserId}`);
        assert(checkStatusRes.body.isBlocked === true, 'check-status confirms user isBlocked=true');
        assert(checkStatusRes.body.reason === 'Fake Orders', 'check-status returns reason');

        // 5.3: Verify Blacklist Directory endpoint includes the blocked user
        const blListRes = await request('GET', '/api/admin/blacklist', authHeaders);
        assert(blListRes.body.success === true, 'Admin blacklist directory returned');
        const foundBlocked = (blListRes.body.blacklist || []).find(b => b.user_id === testUserId);
        assert(Boolean(foundBlocked), 'Blocked student appears in blacklist table');
        assert(foundBlocked?.reason === 'Fake Orders', 'Blacklist record has reason "Fake Orders"');

        // 5.4: Verify Blocked User is REJECTED from checkout
        const checkoutBlockedRes = await request('POST', '/api/checkout', {}, {
            userId: testUserId,
            paymentMethod: 'Cash on Delivery',
            deliveryAddress: 'BH13 (Block A), Room 999'
        });
        assert(checkoutBlockedRes.status === 403, 'Blocked user checkout rejected with 403 Forbidden');
        assert(checkoutBlockedRes.body.error === 'ACCOUNT_BLOCKED', 'Checkout error code is ACCOUNT_BLOCKED');
        assert(checkoutBlockedRes.body.message.includes('fake orders'), 'Checkout error message states fake orders reason');

        // 5.5: Unblock user
        const unblockRes = await request('PATCH', `/api/admin/users/${testUserId}/unblock`, authHeaders);
        assert(unblockRes.body.success === true, 'Admin unblocked user');
        assert(unblockRes.body.user.account_status === 'ACTIVE', 'User status restored to ACTIVE');

        const checkStatusUnblocked = await request('GET', `/api/auth/check-status/${testUserId}`);
        assert(checkStatusUnblocked.body.isBlocked === false, 'User is no longer blocked');

        // ----------------------------------------------------
        // TEST SUITE 6: AUDIT TRAIL LOGGING
        // ----------------------------------------------------
        console.log('\n--- TEST SUITE 6: Security Audit Trail Logging ---');
        const auditRes = await request('GET', '/api/admin/audit-logs', authHeaders);
        assert(auditRes.body.success === true, 'Admin audit logs retrieved');
        assert(Array.isArray(auditRes.body.logs), 'Audit logs is an array');
        assert(auditRes.body.logs.length > 0, 'Audit logs contain recorded security actions');

    } catch (err) {
        console.error('\n🚨 TEST SUITE RUNTIME ERROR:', err);
        testFailed++;
    } finally {
        if (server) {
            server.close();
        }

        console.log('\n======================================================');
        console.log(`🏁 TEST SUITE FINISHED: ${testPassed} Passed, ${testFailed} Failed`);
        console.log('======================================================\n');

        if (testFailed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

runTests();

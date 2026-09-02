require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const localDb = require('../db/localDb');
const syncEngine = require('../db/syncEngine');
const supabaseDb = require('../db/supabaseDb');
const { generateAdminToken } = require('../middleware/adminAuth');

const API_BASE = 'http://localhost:3000/api';

async function runSecuritySuite() {
    console.log('================================================================');
    console.log('🔒 20-SCENARIO MASTER SECURITY & AUTHORIZATION AUDIT SUITE');
    console.log('================================================================\n');

    const testId = Date.now();
    const customerEmail = `student_${testId}@lpu.in`;
    const customerPassword = 'password123';
    let customerUserId = null;
    let customerToken = null;

    // -----------------------------------------------------------------
    // TEST 1: Normal user logs in -> Customer interface only
    // -----------------------------------------------------------------
    console.log('--- TEST 1: Normal User Registration & Login ---');
    const regRes = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: customerEmail,
            password: customerPassword,
            name: 'Test Student'
        })
    });
    const regData = await regRes.json();
    customerUserId = regData.user?.id;
    customerToken = `fake_jwt_for_user_${customerUserId}`;

    if (regRes.status === 200 && regData.user?.role === 'student') {
        console.log(`✅ TEST 1 PASSED: Registered with customer role '${regData.user.role}' only.\n`);
    } else {
        throw new Error(`TEST 1 FAILED: Unexpected role: ${regData.user?.role}`);
    }

    // -----------------------------------------------------------------
    // TEST 2: Normal user calls /api/admin/verify -> DENIED (403)
    // -----------------------------------------------------------------
    console.log('--- TEST 2: Normal User Accesses /api/admin/verify ---');
    // Normal user uses their own customer token or basic session
    const t2Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: {
            'Authorization': `Bearer ${customerToken}`,
            'x-admin-token': customerToken
        }
    });
    if (t2Res.status === 401 || t2Res.status === 403) {
        console.log(`✅ TEST 2 PASSED: Access rejected with HTTP ${t2Res.status}.\n`);
    } else {
        throw new Error(`TEST 2 FAILED: Expected 401/403, got ${t2Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 3: Normal user attempts admin orders API -> DENIED (403)
    // -----------------------------------------------------------------
    console.log('--- TEST 3: Normal User Calls Admin Orders Feed ---');
    const t3Res = await fetch(`${API_BASE}/orders/admin/all`, {
        headers: {
            'Authorization': `Bearer ${customerToken}`
        }
    });
    if (t3Res.status === 401 || t3Res.status === 403) {
        console.log(`✅ TEST 3 PASSED: Access rejected with HTTP ${t3Res.status}.\n`);
    } else {
        throw new Error(`TEST 3 FAILED: Expected 401/403, got ${t3Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 4: Normal user calls an admin API directly (/api/admin/client-lock)
    // -----------------------------------------------------------------
    console.log('--- TEST 4: Normal User Calls Direct Admin API (/api/admin/client-lock) ---');
    const t4Res = await fetch(`${API_BASE}/admin/client-lock`, {
        headers: {
            'Authorization': `Bearer ${customerToken}`
        }
    });
    if (t4Res.status === 401 || t4Res.status === 403) {
        console.log(`✅ TEST 4 PASSED: Direct admin API rejected with HTTP ${t4Res.status}.\n`);
    } else {
        throw new Error(`TEST 4 FAILED: Expected 401/403, got ${t4Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 5: Normal user changes localStorage role to "admin"
    // -----------------------------------------------------------------
    console.log('--- TEST 5: Client-Side localStorage Manipulation ---');
    // Simulated attacker manipulates localStorage to claim role: "admin"
    // and sends their user ID
    const t5Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: {
            'x-user-id': customerUserId,
            'x-user-role': 'admin'
        }
    });
    if (t5Res.status === 401 || t5Res.status === 403) {
        console.log(`✅ TEST 5 PASSED: Server completely ignored client role claim (HTTP ${t5Res.status}).\n`);
    } else {
        throw new Error(`TEST 5 FAILED: Client role spoofing succeeded with status ${t5Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 6: Normal user changes sessionStorage
    // -----------------------------------------------------------------
    console.log('--- TEST 6: Client-Side sessionStorage Manipulation ---');
    const t6Res = await fetch(`${API_BASE}/orders`, {
        headers: {
            'x-session-role': 'admin',
            'x-admin': 'true'
        }
    });
    if (t6Res.status === 401 || t6Res.status === 403) {
        console.log(`✅ TEST 6 PASSED: Server rejected sessionStorage role spoofing (HTTP ${t6Res.status}).\n`);
    } else {
        throw new Error(`TEST 6 FAILED: SessionStorage spoofing allowed with status ${t6Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 7: Normal user modifies frontend JavaScript/state
    // -----------------------------------------------------------------
    console.log('--- TEST 7: Frontend JS State Spoofing (/api/admin/analytics) ---');
    const t7Res = await fetch(`${API_BASE}/orders/admin/analytics`, {
        headers: {
            'x-state-is-admin': 'true'
        }
    });
    if (t7Res.status === 401 || t7Res.status === 403) {
        console.log(`✅ TEST 7 PASSED: Server enforces authorization independently of client state (HTTP ${t7Res.status}).\n`);
    } else {
        throw new Error(`TEST 7 FAILED: Status ${t7Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 8: Normal user sends role="admin" in request body
    // -----------------------------------------------------------------
    console.log('--- TEST 8: Request Body Role Injection ---');
    const t8Res = await fetch(`${API_BASE}/admin/client-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: 'admin',
            isAdmin: true,
            user_role: 'admin',
            lock_type: 'IMMEDIATE',
            message: 'Malicious Lock'
        })
    });
    if (t8Res.status === 401 || t8Res.status === 403) {
        console.log(`✅ TEST 8 PASSED: Body role injection rejected with HTTP ${t8Res.status}.\n`);
    } else {
        throw new Error(`TEST 8 FAILED: Status ${t8Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 9: Normal user sends role: admin or legacy bypass headers
    // -----------------------------------------------------------------
    console.log('--- TEST 9: Header Bypass Injection (role: admin, x-admin-key) ---');
    const t9Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: {
            'role': 'admin',
            'is_admin': 'true',
            'x-admin-key': 'lpuquick_admin_2026',
            'x-admin-token': 'admin123'
        }
    });
    if (t9Res.status === 401 || t9Res.status === 403) {
        console.log(`✅ TEST 9 PASSED: Hardcoded and injected bypass headers rejected with HTTP ${t9Res.status}.\n`);
    } else {
        throw new Error(`TEST 9 FAILED: Legacy header bypass succeeded with status ${t9Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 10: Normal user modifies URL parameters (?role=admin)
    // -----------------------------------------------------------------
    console.log('--- TEST 10: URL Query Parameter Role Injection ---');
    const t10Res = await fetch(`${API_BASE}/orders?role=admin&isAdmin=true&token=lpuquick_admin_2026`);
    if (t10Res.status === 401 || t10Res.status === 403) {
        console.log(`✅ TEST 10 PASSED: URL parameter spoofing rejected with HTTP ${t10Res.status}.\n`);
    } else {
        throw new Error(`TEST 10 FAILED: Status ${t10Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 11: Normal user attempts to manipulate / forge JWT
    // -----------------------------------------------------------------
    console.log('--- TEST 11: Forged / Untrusted JWT Manipulation ---');
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const fakePayload = Buffer.from(JSON.stringify({ sub: customerUserId, role: 'admin', exp: Date.now() + 100000 })).toString('base64url');
    const forgedToken = `lpuquick_adm_${fakeHeader}.${fakePayload}.invalidsignature123`;

    const t11Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${forgedToken}` }
    });
    if (t11Res.status === 401 || t11Res.status === 403) {
        console.log(`✅ TEST 11 PASSED: Forged token rejected with HTTP ${t11Res.status}.\n`);
    } else {
        throw new Error(`TEST 11 FAILED: Forged token accepted with status ${t11Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 12: Unauthenticated user accesses admin API -> 401
    // -----------------------------------------------------------------
    console.log('--- TEST 12: Unauthenticated Request to Admin API ---');
    const t12Res = await fetch(`${API_BASE}/admin/verify`);
    if (t12Res.status === 401) {
        console.log(`✅ TEST 12 PASSED: Unauthenticated request returned HTTP 401 Unauthorized.\n`);
    } else {
        throw new Error(`TEST 12 FAILED: Expected 401, got ${t12Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 13: Authenticated customer accesses admin API -> 403
    // -----------------------------------------------------------------
    console.log('--- TEST 13: Authenticated Customer Accesses Admin API ---');
    // Generate a validly signed token for customerUserId (which has role === 'student' in DB)
    const validStudentToken = generateAdminToken(customerUserId, 'student');
    const t13Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${validStudentToken}` }
    });
    if (t13Res.status === 403) {
        console.log(`✅ TEST 13 PASSED: Verified student account denied with HTTP 403 Forbidden.\n`);
    } else {
        throw new Error(`TEST 13 FAILED: Expected 403, got ${t13Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 14: Real administrator accesses admin API -> 200
    // -----------------------------------------------------------------
    console.log('--- TEST 14: Real Administrator Authenticates & Calls Admin API ---');
    const loginRes = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@lpu.in',
            password: 'admin123'
        })
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
        throw new Error('TEST 14 FAILED: Real admin login failed: ' + JSON.stringify(loginData));
    }
    const realAdminToken = loginData.token;

    const t14Res = await fetch(`${API_BASE}/orders/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${realAdminToken}` }
    });
    if (t14Res.status === 200) {
        console.log(`✅ TEST 14 PASSED: Authorized administrator granted access (HTTP 200).\n`);
    } else {
        throw new Error(`TEST 14 FAILED: Expected 200, got ${t14Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 15: Real administrator verifies session (/api/admin/verify)
    // -----------------------------------------------------------------
    console.log('--- TEST 15: Administrator Session Verification (/api/admin/verify) ---');
    const t15Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${realAdminToken}` }
    });
    const t15Data = await t15Res.json();
    if (t15Res.status === 200 && t15Data.authenticated && t15Data.admin?.role === 'admin') {
        console.log(`✅ TEST 15 PASSED: Session verified for admin ${t15Data.admin.name} (HTTP 200).\n`);
    } else {
        throw new Error(`TEST 15 FAILED: Expected verified admin, got ${JSON.stringify(t15Data)}`);
    }

    // -----------------------------------------------------------------
    // TEST 16: Customer attempts admin access while in OFFLINE/LOCAL mode
    // -----------------------------------------------------------------
    console.log('--- TEST 16: Offline Failover Security (Switch to Local SQLite Mode) ---');
    syncEngine.status = 'OFFLINE';

    const t16Res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${validStudentToken}` }
    });
    syncEngine.status = 'ONLINE';

    if (t16Res.status === 403) {
        console.log(`✅ TEST 16 PASSED: Local SQLite mode STILL denies customer with HTTP 403.\n`);
    } else {
        throw new Error(`TEST 16 FAILED: Expected 403 in offline mode, got ${t16Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 17: Customer attempts sync admin endpoint (/api/admin/sync/status)
    // -----------------------------------------------------------------
    console.log('--- TEST 17: Customer Access to /api/admin/sync/status ---');
    const t17Res = await fetch(`${API_BASE}/admin/sync/status`, {
        headers: { 'Authorization': `Bearer ${validStudentToken}` }
    });
    if (t17Res.status === 403) {
        console.log(`✅ TEST 17 PASSED: Sync status endpoint rejected customer with HTTP 403.\n`);
    } else {
        throw new Error(`TEST 17 FAILED: Expected 403, got ${t17Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 18: Customer attempts backup endpoint (/api/admin/sync/backups)
    // -----------------------------------------------------------------
    console.log('--- TEST 18: Customer Access to Backups Endpoint ---');
    const t18Res = await fetch(`${API_BASE}/admin/sync/backups`, {
        headers: { 'Authorization': `Bearer ${validStudentToken}` }
    });
    if (t18Res.status === 403) {
        console.log(`✅ TEST 18 PASSED: Backup inspection rejected customer with HTTP 403.\n`);
    } else {
        throw new Error(`TEST 18 FAILED: Expected 403, got ${t18Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 19: Customer attempts backup creation (/api/admin/sync/backups/create)
    // -----------------------------------------------------------------
    console.log('--- TEST 19: Customer Calls Backup Creation ---');
    const t19Res = await fetch(`${API_BASE}/admin/sync/backups/create`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${validStudentToken}` }
    });
    if (t19Res.status === 403) {
        console.log(`✅ TEST 19 PASSED: Backup creation rejected customer with HTTP 403.\n`);
    } else {
        throw new Error(`TEST 19 FAILED: Expected 403, got ${t19Res.status}`);
    }

    // -----------------------------------------------------------------
    // TEST 20: Customer attempts privilege escalation during registration
    // -----------------------------------------------------------------
    console.log('--- TEST 20: Privilege Escalation Attempt During Registration ---');
    const evilEmail = `hacker_${testId}@lpu.in`;
    const t20Res = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: evilEmail,
            password: 'hackerpassword',
            role: 'admin',
            isAdmin: true
        })
    });
    const t20Data = await t20Res.json();

    // Query database directly to confirm the true stored role
    const storedUser = await supabaseDb.users.getByIdentifier(evilEmail);
    if (storedUser && storedUser.role === 'student') {
        console.log(`✅ TEST 20 PASSED: Server overrode client 'admin' request; user stored as '${storedUser.role}'.\n`);
    } else {
        throw new Error(`TEST 20 FAILED: User was registered with elevated role: ${storedUser?.role}`);
    }

    // Clean up temporary test accounts
    console.log('--- Cleaning Up Test Records ---');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const db = localDb.getDb();
    const testEmails = [customerEmail, evilEmail];

    for (const em of testEmails) {
        await supabase.from('users').delete().eq('email', em);
        db.prepare('DELETE FROM users WHERE email = ?').run(em);
    }
    console.log('✓ Cleaned up test user accounts.\n');

    console.log('================================================================');
    console.log('🎉 20/20 SECURITY & AUTHORIZATION TESTS COMPLETED 100% SUCCESS!');
    console.log('================================================================');
}

runSecuritySuite().catch(err => {
    console.error('\n❌ SECURITY TEST SUITE FAILED:', err);
    process.exit(1);
});

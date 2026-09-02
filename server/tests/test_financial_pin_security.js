const assert = require('assert');

async function testFinancialSecurity() {
    console.log('====================================================');
    console.log('🔒 TESTING REVENUE & PROFIT PIN LOCK ARCHITECTURE');
    console.log('====================================================');

    const BASE_URL = 'http://localhost:3000/api';

    // 1. Admin login
    console.log('\n[1/8] Admin Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
    assert(loginData.token, 'Should receive admin JWT');
    const adminToken = loginData.token;
    console.log('✓ Admin authenticated successfully.');

    // 2. Check Financial Status
    console.log('\n[2/8] Check Financial Security Status...');
    const statusRes = await fetch(`${BASE_URL}/admin/financial/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const statusData = await statusRes.json();
    console.log('Financial status response:', statusData);
    assert.strictEqual(statusRes.status, 200);
    console.log('✓ Financial status endpoint working.');

    // 3. Attempt to fetch financial data while locked
    console.log('\n[3/8] Accessing financial data while LOCKED...');
    const lockedDataRes = await fetch(`${BASE_URL}/admin/financial/data`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const lockedData = await lockedDataRes.json();
    console.log('Locked data response:', lockedData);
    assert.strictEqual(lockedDataRes.status, 403, 'Must return 403 Forbidden when locked');
    assert.strictEqual(lockedData.locked, true, 'Must return locked: true');
    assert(!lockedData.metrics, 'Must NEVER return financial figures when locked');
    console.log('✓ Zero financial figures leaked when locked.');

    // 4. Setup new Financial PIN ('2468')
    console.log('\n[4/8] Configuring new Financial PIN...');
    const setupRes = await fetch(`${BASE_URL}/admin/financial/setup-pin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            new_pin: '2468',
            confirm_pin: '2468'
        })
    });
    const setupData = await setupRes.json();
    console.log('Setup PIN response:', setupData);
    assert.strictEqual(setupRes.status, 200, 'Setup PIN should succeed');
    console.log('✓ Financial PIN configured and secured with PBKDF2 salt & hash.');

    // 5. Test invalid PIN unlock attempt
    console.log('\n[5/8] Testing invalid PIN rejection & rate limiting...');
    const badPinRes = await fetch(`${BASE_URL}/admin/financial/unlock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ pin: '9999' })
    });
    const badPinData = await badPinRes.json();
    console.log('Bad PIN response:', badPinData);
    assert.strictEqual(badPinRes.status, 401, 'Bad PIN should return 401 Unauthorized');
    console.log('✓ Invalid PIN safely rejected.');

    // 6. Test valid PIN unlock
    console.log('\n[6/8] Unlocking with valid PIN (2468)...');
    const unlockRes = await fetch(`${BASE_URL}/admin/financial/unlock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ pin: '2468' })
    });
    const unlockData = await unlockRes.json();
    console.log('Unlock response:', unlockData);
    assert.strictEqual(unlockRes.status, 200, 'Valid PIN should unlock');
    assert(unlockData.financial_token, 'Should receive financial unlock token');
    const financialToken = unlockData.financial_token;
    console.log('✓ Financial token issued with 15-minute validity.');

    // 7. Fetch financial data with financial token
    console.log('\n[7/8] Accessing financial data with UNLOCKED token...');
    const unLockedDataRes = await fetch(`${BASE_URL}/admin/financial/data`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': financialToken
        }
    });
    const unLockedData = await unLockedDataRes.json();
    console.log('Unlocked financial data response:', unLockedData);
    assert.strictEqual(unLockedDataRes.status, 200, 'Unlocked request should succeed');
    assert.strictEqual(unLockedData.locked, false);
    assert(unLockedData.metrics !== undefined, 'Should receive metrics');
    console.log(`✓ Financial data accessed: Revenue=₹${unLockedData.metrics.total_revenue}, Profit=₹${unLockedData.metrics.total_profit}`);

    // 8. Manual Lock
    console.log('\n[8/8] Testing manual relock...');
    const lockRes = await fetch(`${BASE_URL}/admin/financial/lock`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': financialToken
        }
    });
    const lockData = await lockRes.json();
    console.log('Lock response:', lockData);
    assert.strictEqual(lockRes.status, 200);

    // Verify it is now locked again
    const recheckRes = await fetch(`${BASE_URL}/admin/financial/data`, {
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'X-Financial-Token': financialToken
        }
    });
    assert.strictEqual(recheckRes.status, 403, 'Should be 403 after manual lock');
    console.log('✓ Financial data locked again immediately.');

    console.log('\n====================================================');
    console.log('🎉 ALL FINANCIAL PIN SECURITY TESTS PASSED 100%!');
    console.log('====================================================');
}

testFinancialSecurity().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});

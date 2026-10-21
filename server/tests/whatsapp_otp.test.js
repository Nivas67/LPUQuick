const assert = require('assert');
const http = require('http');
process.env.NODE_ENV = 'test';
const express = require('express');
const app = express();
app.use(express.json());
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

const TEST_PORT = 3456;

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const req = http.request({
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function runWhatsAppOtpTests() {
    console.log('🧪 RUNNING WHATSAPP OTP INTEGRATION TEST SUITE\n');

    let server;
    await new Promise((resolve) => {
        server = app.listen(TEST_PORT, resolve);
    });

    try {
        const testPhone = '9876543210';

        // TEST 1: Request OTP without phone
        console.log('[1/7] Testing validation for missing phone...');
        const missingPhoneRes = await makeRequest('POST', '/api/auth/send-otp', {});
        assert.strictEqual(missingPhoneRes.status, 400, 'Should return 400 for missing phone');
        assert.strictEqual(missingPhoneRes.data.success, false);
        console.log('  ✓ Missing phone rejected correctly');

        // TEST 2: Request OTP with invalid phone (less than 10 digits)
        console.log('[2/7] Testing validation for invalid phone length...');
        const invalidPhoneRes = await makeRequest('POST', '/api/auth/send-otp', { phone: '123' });
        assert.strictEqual(invalidPhoneRes.status, 400, 'Should return 400 for short phone');
        assert.strictEqual(invalidPhoneRes.data.success, false);
        console.log('  ✓ Invalid phone length rejected correctly');

        // TEST 3: Generate and dispatch OTP (Node environment = test)
        console.log('[3/7] Testing successful OTP generation & dispatch...');
        const sendRes = await makeRequest('POST', '/api/auth/send-otp', { phone: testPhone });
        assert.strictEqual(sendRes.status, 200, 'Should return 200 for valid phone request');
        assert.strictEqual(sendRes.data.success, true);
        assert.strictEqual(sendRes.data.channel, 'whatsapp');
        assert.strictEqual(sendRes.data.expires_in, 300);
        console.log('  ✓ OTP generated and dispatched via WhatsApp channel');

        // TEST 4: Immediate resend triggers cooldown rate limit
        console.log('[4/7] Testing rate limiting cooldown (30s)...');
        const cooldownRes = await makeRequest('POST', '/api/auth/send-otp', { phone: testPhone });
        assert.strictEqual(cooldownRes.status, 429, 'Should return 429 for request within cooldown');
        assert.strictEqual(cooldownRes.data.success, false);
        assert.ok(cooldownRes.data.error.includes('wait'), 'Error message should indicate cooldown');
        console.log('  ✓ Cooldown rate limit enforced (HTTP 429)');

        // TEST 5: Verify with invalid OTP code
        console.log('[5/7] Testing rejection of incorrect OTP code...');
        const wrongVerifyRes = await makeRequest('POST', '/api/auth/verify-otp', {
            phone: testPhone,
            otp: '999999'
        });
        assert.strictEqual(wrongVerifyRes.status, 400, 'Should return 400 for incorrect OTP');
        assert.strictEqual(wrongVerifyRes.data.success, false);
        assert.strictEqual(wrongVerifyRes.data.code, 'INVALID_OTP');
        assert.strictEqual(wrongVerifyRes.data.remaining_attempts, 4);
        console.log('  ✓ Incorrect OTP code rejected with attempt countdown');

        // TEST 6: Verify with non-existent phone
        console.log('[6/7] Testing verification with unrequested phone...');
        const unknownPhoneRes = await makeRequest('POST', '/api/auth/verify-otp', {
            phone: '9999999999',
            otp: '123456'
        });
        assert.strictEqual(unknownPhoneRes.status, 400);
        assert.strictEqual(unknownPhoneRes.data.success, false);
        console.log('  ✓ Unrequested phone rejected safely');

        // TEST 7: Provider configuration check in production mode
        console.log('[7/7] Testing provider missing error in production mode...');
        process.env.NODE_ENV = 'production';
        const unconfiguredPhone = '9888877777';
        const prodSendRes = await makeRequest('POST', '/api/auth/send-otp', { phone: unconfiguredPhone });
        assert.strictEqual(prodSendRes.status, 503, 'Should return 503 when no WhatsApp credentials exist');
        assert.strictEqual(prodSendRes.data.code, 'WHATSAPP_PROVIDER_UNAVAILABLE');
        console.log('  ✓ Unconfigured provider returns descriptive 503 error');

        console.log('\n🎉 ALL 7 WHATSAPP OTP TESTS PASSED SUCCESSFULLY!\n');
    } finally {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    }
}

runWhatsAppOtpTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

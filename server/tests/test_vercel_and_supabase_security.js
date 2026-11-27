const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runTests() {
    console.log('====================================================');
    console.log('DIRECT VERCEL + ORIGINAL SUPABASE (vltnqvktdlpcltndmmwl) SECURITY TESTS');
    console.log('====================================================\n');

    delete process.env.CLOUDFLARE_WORKERS;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.PAYMENT_ENVIRONMENT = 'production';
    process.env.ONLINE_PAYMENTS_ENABLED = 'false';
    process.env.PUBLIC_APP_URL = 'https://lpuquick.vercel.app';
    process.env.APP_URL = 'https://lpuquick.vercel.app';
    process.env.ADMIN_SESSION_SECRET = 'test_vercel_admin_secret_at_least_32_chars';
    process.env.PARTNER_SESSION_SECRET = 'test_vercel_partner_secret_at_least_32_chars';
    process.env.CUSTOMER_SESSION_SECRET = 'test_vercel_customer_secret_at_least_32_chars';
    process.env.JWT_SECRET = 'test_vercel_jwt_secret_at_least_32_chars';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    // 1. Original Supabase project allowlist enforcement
    console.log('1. Testing exclusive vltnqvktdlpcltndmmwl Supabase guard & preview flag...');
    const supa = require('../supabase');
    assert.strictEqual(supa.PRODUCTION_PROJECT_REF, 'vltnqvktdlpcltndmmwl');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://vltnqvktdlpcltndmmwl.supabase.co'), true);
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://dzygsmgdzvroxepwyjyz.supabase.co'), false, 'Alternate DB ref must be rejected');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://yojndzstlilzlkxonmvd.supabase.co'), false, 'Legacy ref must be rejected');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://mgsxeguulxumfgehpphb.supabase.co'), false, 'Sandbox ref must be rejected in production mode');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('http://vltnqvktdlpcltndmmwl.supabase.co'), false);
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://vltnqvktdlpcltndmmwl.supabase.co:8443'), false);

    process.env.SUPABASE_URL = 'https://dzygsmgdzvroxepwyjyz.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dummy_wrong_project_12345';
    assert.strictEqual(supa.getSupabaseClient(), null, 'getSupabaseClient must fail closed when SUPABASE_URL points to unapproved project');
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    process.env.VERCEL_ENV = 'preview';
    assert.strictEqual(supa.isSandboxRuntime(), false, 'Vercel Preview with PAYMENT_ENVIRONMENT=production must not trigger sandbox mode');
    process.env.VERCEL_ENV = 'production';
    console.log('   [PASS] Original vltnqvktdlpcltndmmwl allowlist & preview isolation verified');

    // 2. Direct Vercel client IP resolution (Cloudflare removed)
    console.log('2. Testing direct Vercel client IP resolution against spoofed headers...');
    const ipBlockService = require('../services/ipBlockService');
    const shield = require('../middleware/securityShield');
    const spoofedReq = {
        headers: {
            'cf-connecting-ip': '198.51.100.200',
            'x-vercel-forwarded-for': '203.0.113.77',
            'x-real-ip': '10.0.0.1'
        },
        ip: '127.0.0.1'
    };
    assert.strictEqual(ipBlockService.extractClientIp(spoofedReq), '203.0.113.77', 'extractClientIp must trust x-vercel-forwarded-for over cf-connecting-ip');
    assert.strictEqual(shield.getClientIp(spoofedReq), '203.0.113.77', 'securityShield getClientIp must trust x-vercel-forwarded-for');
    assert.strictEqual(ipBlockService.extractClientIp({ headers: { 'cf-connecting-ip': '198.51.100.200', 'x-real-ip': '192.0.2.55' } }), '192.0.2.55');
    console.log('   [PASS] Direct Vercel IP resolution ignores Cloudflare headers');

    // 3. Express runtime, CSP, CORS, unauthenticated closure, CDN assets & partner password check
    console.log('3. Testing Express routes: zero Cloudflare CSP/routes, closed auth boundaries, rate limits & CDN paths...');
    const app = require('../app');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        const homeRes = await fetch(`${baseUrl}/api/health`);
        assert.strictEqual(homeRes.status, 200);
        const csp = homeRes.headers.get('content-security-policy') || '';
        assert.strictEqual(csp.includes('challenges.cloudflare.com'), false, 'CSP must contain zero Cloudflare origins');

        const removedTsCfg = await fetch(`${baseUrl}/api/security/turnstile-config`);
        assert.strictEqual(removedTsCfg.status, 404, 'Removed Turnstile config endpoint must return 404');

        // Unauthenticated routes closed with 401
        const adminOrdersUnauth = await fetch(`${baseUrl}/api/admin/orders`, {
            headers: { 'x-vercel-forwarded-for': '203.0.113.90' }
        });
        assert.strictEqual(adminOrdersUnauth.status, 401, 'GET /api/admin/orders must require admin auth');

        const dutyUnauth = await fetch(`${baseUrl}/api/orders/delivery-duty-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.90' },
            body: JSON.stringify({ status: 'Offline' })
        });
        assert.strictEqual(dutyUnauth.status, 401, 'POST /api/orders/delivery-duty-status must require admin auth');

        const unsubUnauth = await fetch(`${baseUrl}/api/notifications/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.90' },
            body: JSON.stringify({ endpoint: 'https://push.example/1' })
        });
        assert.strictEqual(unsubUnauth.status, 401, 'POST /api/notifications/unsubscribe must require admin auth');

        // Legacy Cloudflare and custom domains rejected in CORS; Vercel origin allowed
        for (const legacyOrigin of ['https://lpuquick.nivasnaidu07.workers.dev', 'https://lpuquick.pages.dev', 'https://lpuquick.com']) {
            const legacyCors = await fetch(`${baseUrl}/api/health`, {
                method: 'OPTIONS',
                headers: { Origin: legacyOrigin, 'Access-Control-Request-Method': 'GET' }
            });
            assert.strictEqual(legacyCors.headers.get('access-control-allow-origin'), null, `${legacyOrigin} must not be CORS allowlisted`);
        }
        const vercelCors = await fetch(`${baseUrl}/api/health`, {
            method: 'OPTIONS',
            headers: { Origin: 'https://lpuquick.vercel.app', 'Access-Control-Request-Method': 'GET' }
        });
        assert.strictEqual(vercelCors.headers.get('access-control-allow-origin'), 'https://lpuquick.vercel.app');

        // Local bundled uploads stay on Vercel CDN under VERCEL=1
        const prevSupaUrl = process.env.SUPABASE_URL;
        process.env.SUPABASE_URL = 'https://vltnqvktdlpcltndmmwl.supabase.co';
        try {
            const db = require('../db/supabaseDb');
            const formattedLocal = db.products._formatProduct({
                id: 'prod_local_check',
                name: 'Test Local Img',
                category: 'Snacks & Beverages',
                price: 20,
                image_url: '/uploads/prod_prod_e581ce64_1788463600537.jpg'
            });
            assert.strictEqual(formattedLocal.image_url, '/uploads/prod_prod_e581ce64_1788463600537.jpg');
            const formattedRemote = db.products._formatProduct({
                id: 'prod_remote_check',
                name: 'Test Remote Img',
                category: 'Snacks & Beverages',
                price: 20,
                image_url: '/uploads/nonexistent_runtime_upload_12345.jpg'
            });
            assert.strictEqual(formattedRemote.image_url, 'https://vltnqvktdlpcltndmmwl.supabase.co/storage/v1/object/public/products/nonexistent_runtime_upload_12345.jpg');
        } finally {
            if (prevSupaUrl === undefined) delete process.env.SUPABASE_URL;
            else process.env.SUPABASE_URL = prevSupaUrl;
        }

        // OTP per-IP shield rate limit triggers 429 after 5 requests
        let got429 = false;
        for (let i = 0; i < 7; i++) {
            const otpRes = await fetch(`${baseUrl}/api/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-vercel-forwarded-for': '203.0.113.199'
                },
                body: JSON.stringify({ phone: `987650000${i}` })
            });
            if (otpRes.status === 429) {
                got429 = true;
                break;
            }
        }
        assert.strictEqual(got429, true, 'Rapid OTP spam from one IP must trigger 429 rate limit');

        // Portals serve 200 HTML cleanly
        for (const route of ['/', '/admin', '/admin/', '/partner', '/partner/', '/food', '/mobile-preview']) {
            const portalRes = await fetch(`${baseUrl}${route}`);
            assert.strictEqual(portalRes.status, 200, `${route} must return 200`);
            const html = await portalRes.text();
            assert.strictEqual(html.includes('turnstile-client.js'), false, `${route} must not embed Turnstile JS`);
        }

        // Partner wrong-password regression test
        const partnerService = require('../services/partnerService');
        const securityService = require('../services/securityService');
        const origGetPartner = partnerService.getPartnerByEmail;
        partnerService.getPartnerByEmail = async () => ({
            id: 'ptr_test_1',
            name: 'Fixture Partner',
            email: 'partner.fixture@lpu.in',
            status: 'ACTIVE',
            password_hash: securityService.hashPassword('CorrectPartnerPass!9')
        });
        try {
            const badPartnerRes = await fetch(`${baseUrl}/api/partner/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.91' },
                body: JSON.stringify({ email: 'partner.fixture@lpu.in', password: 'WrongPassword!123' })
            });
            assert.strictEqual(badPartnerRes.status, 401, 'Partner login MUST reject wrong password with 401');

            const okPartnerRes = await fetch(`${baseUrl}/api/partner/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.91' },
                body: JSON.stringify({ email: 'partner.fixture@lpu.in', password: 'CorrectPartnerPass!9' })
            });
            assert.strictEqual(okPartnerRes.status, 200, 'Correct partner password must return 200');
        } finally {
            partnerService.getPartnerByEmail = origGetPartner;
        }
        console.log('   [PASS] Express CSP, routing, auth boundaries, CDN paths & partner auth verified');
    } finally {
        if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
        server.close();
    }

    // 4. Cross-invocation serverless DB persistence & SQL verification
    console.log('4. Testing cross-invocation DB rate-limit/OTP persistence & vltnqvktdlpcltndmmwl SQL...');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '20261127_vltnqvktdlpcltndmmwl_rls_and_security_hardening.sql'), 'utf8');
    for (const tbl of ['security_rate_limits', 'auth_otp_challenges']) {
        assert.ok(sql.includes(`public.${tbl}`), `Migration must include public.${tbl}`);
        assert.ok(sql.includes(`'${tbl}'`), `Migration RLS block must cover public.${tbl}`);
    }
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit'));

    const rateStore = new Map();
    const otpDbStore = new Map();
    const origGetSupabase = supa.getSupabaseClient;
    const mockDbClient = {
        from(table) {
            if (table === 'security_rate_limits') {
                return {
                    select() {
                        let keys = [];
                        return {
                            in(_col, vals) { keys = vals; return this; },
                            eq(_col, val) { keys = [val]; return this; },
                            async maybeSingle() {
                                return { data: keys.length ? (rateStore.get(keys[0]) || null) : null, error: null };
                            },
                            then(resolve) {
                                return Promise.resolve({ data: keys.map((k) => rateStore.get(k)).filter(Boolean), error: null }).then(resolve);
                            }
                        };
                    },
                    delete() {
                        return {
                            in(_col, vals) {
                                vals.forEach((k) => rateStore.delete(k));
                                return Promise.resolve({ error: null });
                            }
                        };
                    }
                };
            }
            if (table === 'auth_otp_challenges') {
                return {
                    upsert(rows) {
                        rows.forEach((r) => otpDbStore.set(r.phone, { ...r }));
                        return Promise.resolve({ error: null });
                    },
                    select() {
                        let targetPhone = null;
                        return {
                            eq(_col, val) { targetPhone = val; return this; },
                            async maybeSingle() {
                                return { data: otpDbStore.get(targetPhone) || null, error: null };
                            }
                        };
                    },
                    update(patch) {
                        return {
                            eq(_col, val) {
                                const cur = otpDbStore.get(val);
                                if (cur) otpDbStore.set(val, { ...cur, ...patch });
                                return Promise.resolve({ error: null });
                            }
                        };
                    },
                    delete() {
                        return {
                            eq(_col, val) {
                                otpDbStore.delete(val);
                                return Promise.resolve({ error: null });
                            }
                        };
                    }
                };
            }
            return {
                select() { return { eq() { return { async maybeSingle() { return { data: null, error: null }; } }; } }; },
                upsert() { return Promise.resolve({ error: null }); }
            };
        },
        async rpc(fnName, args) {
            if (fnName === 'check_and_increment_rate_limit') {
                const cur = rateStore.get(args.p_key) || { rate_key: args.p_key, hits: 0, blocked_until: null };
                cur.hits += 1;
                let allowed = true;
                if (cur.hits >= args.p_max_hits && args.p_lock_seconds > 0) {
                    cur.blocked_until = new Date(Date.now() + args.p_lock_seconds * 1000).toISOString();
                    allowed = false;
                } else if (cur.hits > args.p_max_hits) {
                    allowed = false;
                }
                rateStore.set(args.p_key, cur);
                return { data: [{ allowed, hits: cur.hits, retry_after_seconds: allowed ? 0 : (args.p_lock_seconds || 60) }], error: null };
            }
            return { data: null, error: null };
        }
    };

    supa.getSupabaseClient = () => mockDbClient;
    try {
        const secMod = require('../services/securityService');
        for (let i = 0; i < 4; i++) {
            await secMod.recordFailedLoginPersistent('persist_user@lpu.in', '198.51.100.77');
        }
        const fifth = await secMod.recordFailedLoginPersistent('persist_user@lpu.in', '198.51.100.77');
        assert.strictEqual(fifth.locked, true);
        const checkPersist = await secMod.checkLoginRateLimitPersistent('other_email_same_ip@lpu.in', '198.51.100.77');
        assert.strictEqual(checkPersist.locked, true, 'IP lockout must persist in Supabase security_rate_limits');
        await secMod.recordSuccessfulLoginPersistent('persist_user@lpu.in', '198.51.100.77');

        const srv2 = http.createServer(app);
        await new Promise((resolve) => srv2.listen(0, '127.0.0.1', resolve));
        const { port: p2 } = srv2.address();
        try {
            const phone = '9812345678';
            const otpPlain = '654321';
            otpDbStore.set(phone, {
                phone,
                otp_hash: crypto.createHash('sha256').update(otpPlain).digest('hex'),
                user_id: null,
                attempts: 0,
                expires_at: new Date(Date.now() + 300000).toISOString(),
                locked_until: null
            });
            const verifyRes = await fetch(`http://127.0.0.1:${p2}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.155' },
                body: JSON.stringify({ phone, otp: otpPlain })
            });
            assert.strictEqual(verifyRes.status, 200, 'OTP stored in Postgres auth_otp_challenges must verify cleanly across cold starts');
            assert.strictEqual(otpDbStore.has(phone), false);
        } finally {
            if (typeof srv2.closeAllConnections === 'function') srv2.closeAllConnections();
            srv2.close();
        }
        console.log('   [PASS] Cross-invocation DB lockout & OTP persistence verified');
    } finally {
        supa.getSupabaseClient = origGetSupabase;
    }

    console.log('\n====================================================');
    console.log('ALL VERCEL + ORIGINAL SUPABASE SECURITY TESTS PASSED!');
    console.log('====================================================');
}

runTests().catch((err) => {
    console.error('\n[FAIL] Security test failed:', err);
    process.exit(1);
});

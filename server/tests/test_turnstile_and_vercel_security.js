const assert = require('assert');
const http = require('http');

async function runTests() {
    console.log('====================================================');
    console.log('VERCEL + SUPABASE (dzygsmgdzvroxepwyjyz) + TURNSTILE TESTS');
    console.log('====================================================\n');

    // Configure clean isolated Vercel production test environment
    delete process.env.CLOUDFLARE_WORKERS;
    process.env.NODE_ENV = 'production';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.PAYMENT_ENVIRONMENT = 'production';
    process.env.ONLINE_PAYMENTS_ENABLED = 'false';
    process.env.PUBLIC_APP_URL = 'https://lpuquick.vercel.app';
    process.env.APP_URL = 'https://lpuquick.vercel.app';
    process.env.TURNSTILE_SITE_KEY = '0x4AAAAAABtestSiteKeyForUnitVerification';
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAABtestSecretKeyForUnitVerification';
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'lpuquick.vercel.app';
    process.env.ADMIN_SESSION_SECRET = 'test_vercel_admin_secret_at_least_32_chars';
    process.env.PARTNER_SESSION_SECRET = 'test_vercel_partner_secret_at_least_32_chars';
    process.env.CUSTOMER_SESSION_SECRET = 'test_vercel_customer_secret_at_least_32_chars';
    process.env.JWT_SECRET = 'test_vercel_jwt_secret_at_least_32_chars';
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    // 1. Authorized Supabase project enforcement
    console.log('1. Testing exclusive dzygsmgdzvroxepwyjyz Supabase guard & preview flag...');
    const supa = require('../supabase');
    assert.strictEqual(supa.PRODUCTION_PROJECT_REF, 'dzygsmgdzvroxepwyjyz');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://dzygsmgdzvroxepwyjyz.supabase.co'), true);
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://vltnqvktdlpcltndmmwl.supabase.co'), false, 'Legacy production ref must be rejected');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://yojndzstlilzlkxonmvd.supabase.co'), false, 'Legacy ref must be rejected');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://mgsxeguulxumfgehpphb.supabase.co'), false, 'Sandbox ref must be rejected in production mode');
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('http://dzygsmgdzvroxepwyjyz.supabase.co'), false);
    assert.strictEqual(supa.isAuthorizedProductionSupabaseUrl('https://dzygsmgdzvroxepwyjyz.supabase.co:8443'), false);

    // Reject initializing legacy project even if env vars were mis-pointed
    process.env.SUPABASE_URL = 'https://vltnqvktdlpcltndmmwl.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dummy_legacy_key_value_12345';
    assert.strictEqual(supa.getSupabaseClient(), null, 'getSupabaseClient must fail closed when SUPABASE_URL points to legacy project');
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';

    // Preview deployment should not trigger UPI sandbox hijacking
    process.env.VERCEL_ENV = 'preview';
    assert.strictEqual(supa.isSandboxRuntime(), false, 'Vercel Preview with PAYMENT_ENVIRONMENT=production must not trigger sandbox mode');
    process.env.VERCEL_ENV = 'production';
    console.log('   [PASS] Authorized Supabase project ref & preview mode guards verified');

    // 2. Spoofable IP extraction on direct Vercel deployment
    console.log('2. Testing direct Vercel client IP resolution against header spoofing...');
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
    assert.strictEqual(ipBlockService.extractClientIp(spoofedReq), '203.0.113.77', 'extractClientIp must ignore spoofable cf-connecting-ip on direct Vercel');
    assert.strictEqual(shield.getClientIp(spoofedReq), '203.0.113.77', 'securityShield getClientIp must trust x-vercel-forwarded-for on Vercel');
    console.log('   [PASS] Vercel edge IP priority resists spoofed CF-Connecting-IP');

    // 3. Turnstile verification unit checks (missing, failed, wrong hostname, expired, replay, valid)
    console.log('3. Testing Turnstile token verification, hostname pinning & replay protection...');
    const turnstile = require('../services/turnstileService');
    const originalFetch = globalThis.fetch;

    try {
        // Patch global fetch temporarily to intercept Cloudflare Turnstile siteverify calls
        globalThis.fetch = async (url, init) => {
            const urlStr = String(url);
            if (urlStr.startsWith('https://challenges.cloudflare.com/turnstile/v0/siteverify')) {
                const bodyParams = new URLSearchParams(String(init?.body || ''));
                const tok = bodyParams.get('response');
                if (tok === 'valid_token_once') {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            success: true,
                            hostname: 'lpuquick.vercel.app',
                            action: 'customer_signin',
                            challenge_ts: new Date().toISOString()
                        })
                    };
                }
                if (tok === 'wrong_host_token') {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            success: true,
                            hostname: 'attacker-clone.workers.dev',
                            challenge_ts: new Date().toISOString()
                        })
                    };
                }
                if (tok === 'stale_token') {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            success: true,
                            hostname: 'lpuquick.vercel.app',
                            challenge_ts: new Date(Date.now() - 10 * 60 * 1000).toISOString()
                        })
                    };
                }
                return {
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: false,
                        'error-codes': ['invalid-input-response']
                    })
                };
            }
            return originalFetch(url, init);
        };

        turnstile.clearReplayCacheForTests();
        const missingRes = await turnstile.verifyTurnstileToken('', { headers: {} });
        assert.strictEqual(missingRes.ok, false);
        assert.strictEqual(missingRes.code, 'TURNSTILE_REQUIRED');

        const badHostRes = await turnstile.verifyTurnstileToken('wrong_host_token', { headers: {} });
        assert.strictEqual(badHostRes.ok, false);
        assert.strictEqual(badHostRes.code, 'TURNSTILE_HOSTNAME_MISMATCH');

        const staleRes = await turnstile.verifyTurnstileToken('stale_token', { headers: {} });
        assert.strictEqual(staleRes.ok, false);
        assert.strictEqual(staleRes.code, 'TURNSTILE_EXPIRED');

        const okFirst = await turnstile.verifyTurnstileToken('valid_token_once', { headers: { 'x-vercel-forwarded-for': '203.0.113.10' } });
        assert.strictEqual(okFirst.ok, true);

        const replaySecond = await turnstile.verifyTurnstileToken('valid_token_once', { headers: { 'x-vercel-forwarded-for': '203.0.113.10' } });
        assert.strictEqual(replaySecond.ok, false);
        assert.strictEqual(replaySecond.code, 'TURNSTILE_REPLAY_DETECTED');
        console.log('   [PASS] Turnstile missing/hostname/expired/valid/replay unit checks passed');

        // 4. End-to-end Express route enforcement checks
        console.log('4. Testing Express routes: Turnstile guards, closed unauth endpoints & rate limits...');
        const supabaseDb = require('../db/supabaseDb');
        supabaseDb.users.getByIdentifier = async () => null;

        const app = require('../app');
        const server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
        const { port } = server.address();
        const baseUrl = `http://127.0.0.1:${port}`;

        try {
            const cfgRes = await originalFetch(`${baseUrl}/api/security/turnstile-config`, {
                headers: { 'x-forwarded-host': 'lpuquick.vercel.app' }
            });
            assert.strictEqual(cfgRes.status, 200);
            assert.ok(String(cfgRes.headers.get('cache-control') || '').includes('no-store'));
            const cfgJson = await cfgRes.json();
            assert.strictEqual(cfgJson.enabled, true);
            assert.strictEqual(cfgJson.siteKey, '0x4AAAAAABtestSiteKeyForUnitVerification');

            // Preview host disables Turnstile unless explicitly enabled for preview
            process.env.VERCEL_ENV = 'preview';
            const prevCfgRes = await originalFetch(`${baseUrl}/api/security/turnstile-config`, {
                headers: { 'x-forwarded-host': 'lpuquick-git-feat-nivx.vercel.app' }
            });
            const prevCfgJson = await prevCfgRes.json();
            assert.strictEqual(prevCfgJson.enabled, false);
            assert.strictEqual(prevCfgJson.siteKey, '');
            process.env.VERCEL_ENV = 'production';

            // Missing Turnstile tokens rejected on all protected submission endpoints
            const protectedEndpoints = [
                { path: '/api/auth/signup', body: { email: 'bot@lpu.in', password: 'Password123!' } },
                { path: '/api/auth/signin', body: { email: 'bot@lpu.in', password: 'Password123!' } },
                { path: '/api/auth/google', body: { credential: 'fake.jwt.token' } },
                { path: '/api/auth/admin-login', body: { email: 'admin@lpu.in', password: 'wrong' } },
                { path: '/api/auth/send-otp', body: { phone: '9876543210' } },
                { path: '/api/partner/login', body: { email: 'partner@lpu.in', password: 'wrong' } },
                { path: '/api/checkout', body: { userId: 'user_bot', paymentMethod: 'Pay on Delivery' } },
                { path: '/api/notifications/customer-subscribe', body: { subscription: { endpoint: 'https://push.example/1' } } }
            ];

            for (const ep of protectedEndpoints) {
                const res = await originalFetch(`${baseUrl}${ep.path}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-vercel-forwarded-for': '203.0.113.88'
                    },
                    body: JSON.stringify(ep.body)
                });
                assert.strictEqual(res.status, 403, `${ep.path} without Turnstile token must return 403 (got ${res.status})`);
                const body = await res.json();
                assert.strictEqual(body.code, 'TURNSTILE_REQUIRED');
            }

            // Valid Turnstile token allows /api/auth/signin past middleware (reaches credential lookup -> 401), then replay returns 403
            turnstile.clearReplayCacheForTests();
            const firstSigninRes = await originalFetch(`${baseUrl}/api/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-vercel-forwarded-for': '203.0.113.89',
                    'x-turnstile-token': 'valid_token_once'
                },
                body: JSON.stringify({ email: 'missing@lpu.in', password: 'wrong' })
            });
            assert.strictEqual(firstSigninRes.status, 401, 'Valid Turnstile token must pass middleware to auth handler');

            const replaySigninRes = await originalFetch(`${baseUrl}/api/auth/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-vercel-forwarded-for': '203.0.113.89',
                    'x-turnstile-token': 'valid_token_once'
                },
                body: JSON.stringify({ email: 'missing@lpu.in', password: 'wrong' })
            });
            assert.strictEqual(replaySigninRes.status, 403, 'Replayed Turnstile token must be rejected');
            assert.strictEqual((await replaySigninRes.json()).code, 'TURNSTILE_REPLAY_DETECTED');

            // Unauthenticated delivery-duty-status & notifications/unsubscribe closed with 401
            const dutyUnauth = await originalFetch(`${baseUrl}/api/orders/delivery-duty-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.90' },
                body: JSON.stringify({ status: 'Offline' })
            });
            assert.strictEqual(dutyUnauth.status, 401, 'POST /api/orders/delivery-duty-status must require admin auth');

            const unsubUnauth = await originalFetch(`${baseUrl}/api/notifications/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.90' },
                body: JSON.stringify({ endpoint: 'https://push.example/1' })
            });
            assert.strictEqual(unsubUnauth.status, 401, 'POST /api/notifications/unsubscribe must require admin auth');

            // Deprecated workers.dev, pages.dev, and legacy custom domain CORS rejected
            for (const legacyOrigin of ['https://lpuquick.nivasnaidu07.workers.dev', 'https://lpuquick.pages.dev', 'https://lpuquick.com']) {
                const legacyCors = await originalFetch(`${baseUrl}/api/health`, {
                    method: 'OPTIONS',
                    headers: { Origin: legacyOrigin, 'Access-Control-Request-Method': 'GET' }
                });
                assert.strictEqual(legacyCors.headers.get('access-control-allow-origin'), null, `${legacyOrigin} must not be CORS allowlisted`);
            }
            const vercelCors = await originalFetch(`${baseUrl}/api/health`, {
                method: 'OPTIONS',
                headers: { Origin: 'https://lpuquick.vercel.app', 'Access-Control-Request-Method': 'GET' }
            });
            assert.strictEqual(vercelCors.headers.get('access-control-allow-origin'), 'https://lpuquick.vercel.app', 'https://lpuquick.vercel.app must be CORS allowlisted');

            // Local product images in public/uploads must stay on Vercel CDN even when VERCEL=1
            const prevVercelEnv = process.env.VERCEL;
            const prevSupaEnv = process.env.SUPABASE_URL;
            process.env.VERCEL = '1';
            process.env.SUPABASE_URL = 'https://dzygsmgdzvroxepwyjyz.supabase.co';
            try {
                const db = require('../db/supabaseDb');
                const formattedLocal = db.products._formatProduct({
                    id: 'prod_local_check',
                    name: 'Test Local Img',
                    category: 'Snacks & Beverages',
                    price: 20,
                    image_url: '/uploads/prod_prod_e581ce64_1788463600537.jpg'
                });
                assert.strictEqual(formattedLocal.image_url, '/uploads/prod_prod_e581ce64_1788463600537.jpg', 'Bundled public/uploads asset must keep /uploads path under VERCEL=1');
                const formattedRemote = db.products._formatProduct({
                    id: 'prod_remote_check',
                    name: 'Test Remote Img',
                    category: 'Snacks & Beverages',
                    price: 20,
                    image_url: '/uploads/nonexistent_runtime_upload_12345.jpg'
                });
                assert.strictEqual(formattedRemote.image_url, 'https://dzygsmgdzvroxepwyjyz.supabase.co/storage/v1/object/public/products/nonexistent_runtime_upload_12345.jpg');
            } finally {
                if (prevVercelEnv === undefined) delete process.env.VERCEL; else process.env.VERCEL = prevVercelEnv;
                if (prevSupaEnv === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = prevSupaEnv;
            }

            // OTP per-IP shield rate limit returns 429 after 5 attempts
            let got429 = false;
            for (let i = 0; i < 7; i++) {
                const otpRes = await originalFetch(`${baseUrl}/api/auth/send-otp`, {
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

            // Trailing slashes / portals serve 200 HTML
            for (const route of ['/admin', '/admin/', '/partner', '/partner/', '/food', '/mobile-preview']) {
                const portalRes = await originalFetch(`${baseUrl}${route}`);
                assert.strictEqual(portalRes.status, 200, `${route} must return 200`);
            }

            // Partner wrong-password regression test (verifyPassword returns object { isValid })
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
                turnstile.clearReplayCacheForTests();
                const badPartnerRes = await originalFetch(`${baseUrl}/api/partner/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-vercel-forwarded-for': '203.0.113.120',
                        'x-turnstile-token': 'valid_token_once'
                    },
                    body: JSON.stringify({ email: 'partner.fixture@lpu.in', password: 'WrongPassword!' })
                });
                assert.strictEqual(badPartnerRes.status, 401, 'Wrong partner password must ALWAYS return 401');

                turnstile.clearReplayCacheForTests();
                const okPartnerRes = await originalFetch(`${baseUrl}/api/partner/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-vercel-forwarded-for': '203.0.113.120',
                        'x-turnstile-token': 'valid_token_once'
                    },
                    body: JSON.stringify({ email: 'partner.fixture@lpu.in', password: 'CorrectPartnerPass!9' })
                });
                assert.strictEqual(okPartnerRes.status, 200, 'Correct partner password with valid Turnstile must return 200');
            } finally {
                partnerService.getPartnerByEmail = origGetPartner;
            }
            console.log('   [PASS] Route enforcement, replay rejection, IP shield, partner auth & portals verified');
        } finally {
            server.close();
        }
    } finally {
        globalThis.fetch = originalFetch;
    }

    // 5. Cross-invocation serverless persistence & SQL migration checks
    console.log('5. Testing cross-invocation replay/rate-limit/OTP DB persistence & SQL coverage...');
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');

    const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '20261127_dzygsmgdzvroxepwyjyz_full_schema_and_rls.sql'), 'utf8');
    for (const tbl of ['turnstile_used_tokens', 'security_rate_limits', 'auth_otp_challenges']) {
        assert.ok(sql.includes(`public.${tbl}`), `Migration must include public.${tbl}`);
        assert.ok(sql.includes(`'${tbl}'`), `Migration RLS block must cover public.${tbl}`);
    }
    assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit'), 'Migration must define persistent check_and_increment_rate_limit RPC');

    // Simulate separate Lambda instance catching replay via Postgres 23505 on turnstile_used_tokens & persistent rate limit RPC
    const rateStore = new Map();
    const otpDbStore = new Map();
    const tokenDbSet = new Set();
    const origGetSupabase = supa.getSupabaseClient;
    const mockDbClient = {
        from(table) {
            if (table === 'turnstile_used_tokens') {
                return {
                    async insert(rows) {
                        const row = rows[0];
                        if (tokenDbSet.has(row.token_hash)) {
                            return { error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
                        }
                        tokenDbSet.add(row.token_hash);
                        return { error: null };
                    }
                };
            }
            if (table === 'security_rate_limits') {
                return {
                    select() {
                        let keys = [];
                        return {
                            in(_col, vals) { keys = vals; return this; },
                            eq(_col, val) { keys = [val]; return this; },
                            async maybeSingle() {
                                const found = keys.length ? rateStore.get(keys[0]) : null;
                                return { data: found || null, error: null };
                            },
                            then(resolve) {
                                const rows = keys.map((k) => rateStore.get(k)).filter(Boolean);
                                return Promise.resolve({ data: rows, error: null }).then(resolve);
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

    // Monkeypatch module cache require('../supabase').getSupabaseClient temporarily to verify persistent helpers
    supa.getSupabaseClient = () => mockDbClient;
    try {
        const tsMod = require('../services/turnstileService');
        const secMod = require('../services/securityService');

        globalThis.fetch = async () => ({
            ok: true,
            status: 200,
            json: async () => ({ success: true, hostname: 'lpuquick.vercel.app', challenge_ts: new Date().toISOString() })
        });
        tsMod.clearReplayCacheForTests();
        const r1 = await tsMod.verifyTurnstileToken('cross_lambda_token', { headers: {} });
        assert.strictEqual(r1.ok, true);
        // Simulate cold start on second Lambda by wiping memory replay cache
        tsMod.clearReplayCacheForTests();
        const r2 = await tsMod.verifyTurnstileToken('cross_lambda_token', { headers: {} });
        assert.strictEqual(r2.ok, false);
        assert.strictEqual(r2.code, 'TURNSTILE_REPLAY_DETECTED', 'Postgres 23505 must block replay across separate Lambda invocations');

        // Persistent failed login lock across instances
        for (let i = 0; i < 4; i++) {
            await secMod.recordFailedLoginPersistent('persist_user@lpu.in', '198.51.100.77');
        }
        const fifth = await secMod.recordFailedLoginPersistent('persist_user@lpu.in', '198.51.100.77');
        assert.strictEqual(fifth.locked, true);
        const checkPersist = await secMod.checkLoginRateLimitPersistent('other_email_same_ip@lpu.in', '198.51.100.77');
        assert.strictEqual(checkPersist.locked, true, 'IP lockout must persist in Supabase security_rate_limits');
        await secMod.recordSuccessfulLoginPersistent('persist_user@lpu.in', '198.51.100.77');

        // Verify auth_otp_challenges fallback works across separate Lambda instances (pre-seed DB row as if Instance A sent OTP, verify via Instance B)
        const expressApp = require('../app');
        const srv2 = http.createServer(expressApp);
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
            const verifyRes = await originalFetch(`http://127.0.0.1:${p2}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-vercel-forwarded-for': '203.0.113.155' },
                body: JSON.stringify({ phone, otp: otpPlain })
            });
            assert.strictEqual(verifyRes.status, 200, 'OTP stored in Postgres auth_otp_challenges must verify cleanly across serverless cold starts');
            assert.strictEqual(otpDbStore.has(phone), false, 'Verified OTP must be deleted from DB to prevent replay');
        } finally {
            srv2.close();
        }
        console.log('   [PASS] Cross-invocation Turnstile replay, login lockout, and OTP DB persistence verified');
    } finally {
        supa.getSupabaseClient = origGetSupabase;
        globalThis.fetch = originalFetch;
    }

    console.log('\n====================================================');
    console.log('ALL VERCEL + SUPABASE + TURNSTILE TESTS PASSED!');
    console.log('====================================================');
}

runTests().catch((err) => {
    console.error('\n[FAIL] Turnstile/Vercel security test failed:', err);
    process.exit(1);
});

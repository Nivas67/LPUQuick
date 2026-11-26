const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function resolveWranglerSpawn() {
    if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
        const npxDir = path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx');
        if (fs.existsSync(npxDir)) {
            for (const sub of fs.readdirSync(npxDir)) {
                const candidate = path.join(npxDir, sub, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
                if (fs.existsSync(candidate)) {
                    return { cmd: process.execPath, prefixArgs: [candidate] };
                }
            }
        }
        return { cmd: 'cmd.exe', prefixArgs: ['/c', 'npx', '--yes', 'wrangler'] };
    }
    return { cmd: 'npx', prefixArgs: ['--yes', 'wrangler'] };
}

async function waitForServer(baseUrl, logs, child, timeoutMs = 45000) {
    const start = Date.now();
    let lastStatus = null;
    let lastBody = '';
    while (Date.now() - start < timeoutMs) {
        if (child.exitCode !== null) {
            throw new Error(`wrangler dev exited early with code ${child.exitCode}\n--- WRANGLER LOGS ---\n${logs.join('')}`);
        }
        try {
            const res = await fetch(`${baseUrl}/api/health`);
            lastStatus = res.status;
            lastBody = await res.text();
            if (res.ok) return;
        } catch (e) {
            lastBody = e.message;
        }
        await new Promise(r => setTimeout(r, 400));
    }
    throw new Error(`Timed out waiting for wrangler dev at ${baseUrl} (lastStatus=${lastStatus}, lastBody=${lastBody.slice(0, 300)})\n--- WRANGLER LOGS ---\n${logs.join('')}`);
}

async function runWranglerRouteTests() {
    const port = 8789;
    const baseUrl = `http://127.0.0.1:${port}`;
    const isWin = process.platform === 'win32';
    const { cmd, prefixArgs } = resolveWranglerSpawn();
    const args = [...prefixArgs, 'dev', '--port', String(port), '--ip', '127.0.0.1', '--show-interactive-dev-session=false'];

    const logs = [];
    const child = spawn(cmd, args, {
        cwd: path.resolve(__dirname, '../..'),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    child.stdout.on('data', d => logs.push(d.toString()));
    child.stderr.on('data', d => logs.push(d.toString()));

    const cleanup = () => {
        if (child.exitCode === null) {
            if (isWin && child.pid) {
                try {
                    require('child_process').execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
                } catch {}
            } else {
                child.kill('SIGTERM');
            }
        }
    };

    try {
        await waitForServer(baseUrl, logs, child);

        // 1. Customer storefront /
        const rootRes = await fetch(`${baseUrl}/`);
        const rootHtml = await rootRes.text();
        assert.strictEqual(rootRes.status, 200);
        assert.ok(rootRes.headers.get('content-type').includes('text/html'));
        assert.ok(rootHtml.includes('LPUQuick — Calm Commerce'), 'Root / must serve Customer Storefront');
        assert.ok(!rootHtml.includes('LPU Quick Admin Dashboard'), 'Root / must NOT serve Admin Dashboard');

        // 2. Storefront client scripts, CSS, manifest, SW, and sandbox scripts
        for (const [assetPath, expectedCt] of [
            ['/css/styles.css', 'text/css'],
            ['/js/api.js', 'javascript'],
            ['/js/app.js', 'javascript'],
            ['/js/pages/home.js', 'javascript'],
            ['/js/pages/checkout.js', 'javascript'],
            ['/js/pages/sandbox_payment.js', 'javascript'],
            ['/sw.js', 'javascript'],
            ['/manifest.json', 'json'],
            ['/favicon.png', 'image/png'],
            ['/logo.png', 'image/png']
        ]) {
            const r = await fetch(`${baseUrl}${assetPath}`);
            assert.strictEqual(r.status, 200, `${assetPath} should return 200`);
            const ct = (r.headers.get('content-type') || '').toLowerCase();
            assert.ok(ct.includes(expectedCt), `${assetPath} Content-Type ${ct} should include ${expectedCt}`);
        }

        // 3. Sandbox payment return SPA route
        const sbxReturnRes = await fetch(`${baseUrl}/sandbox-payment-return?client_order_id=LPUQ_TEST_123`);
        const sbxReturnHtml = await sbxReturnRes.text();
        assert.strictEqual(sbxReturnRes.status, 200);
        assert.ok(sbxReturnHtml.includes('LPUQuick — Calm Commerce'), '/sandbox-payment-return must serve Customer Storefront');
        assert.ok(sbxReturnHtml.includes('sandbox_payment.js'), '/sandbox-payment-return must include sandbox_payment.js');

        // 4. Admin dashboard (/admin/, /admin, /ad-new/, and Admin CSS/JS/favicon assets)
        for (const admUrl of [`${baseUrl}/admin/`, `${baseUrl}/admin`, `${baseUrl}/ad-new/`]) {
            const admRes = await fetch(admUrl);
            const admHtml = await admRes.text();
            assert.strictEqual(admRes.status, 200, `${admUrl} must return 200`);
            assert.ok(admHtml.includes('LPU Quick Admin Dashboard'), `${admUrl} must serve Admin Dashboard`);
        }
        for (const [admAsset, expectedCt] of [
            ['/ad-new/css/admin.css?v=20261101_fullscreen_v1', 'text/css'],
            ['/ad-new/js/admin.js?v=20261125_free_opt1', 'javascript'],
            ['/ad-new/favicon.png', 'image/png'],
            ['/admin/css/admin.css', 'text/css'],
            ['/admin/js/admin.js', 'javascript']
        ]) {
            const r = await fetch(`${baseUrl}${admAsset}`);
            assert.strictEqual(r.status, 200, `${admAsset} must return 200`);
            const ct = (r.headers.get('content-type') || '').toLowerCase();
            assert.ok(ct.includes(expectedCt), `${admAsset} Content-Type ${ct} should include ${expectedCt}`);
        }

        // 5. Partner dashboard (/partner/, /partner, and CSS/JS)
        for (const pUrl of [`${baseUrl}/partner/`, `${baseUrl}/partner`]) {
            const pRes = await fetch(pUrl);
            const pHtml = await pRes.text();
            assert.strictEqual(pRes.status, 200, `${pUrl} must return 200`);
            assert.ok(pHtml.includes('Partner Financial Portal'), `${pUrl} must serve Partner Dashboard`);
            assert.ok(!pHtml.includes('LPU Quick Admin Dashboard'), `${pUrl} must not serve Admin Dashboard`);
        }
        for (const [pAsset, expectedCt] of [
            ['/partner/css/partner.css', 'text/css'],
            ['/partner/js/partner.js', 'javascript']
        ]) {
            const r = await fetch(`${baseUrl}${pAsset}`);
            assert.strictEqual(r.status, 200, `${pAsset} must return 200`);
            const ct = (r.headers.get('content-type') || '').toLowerCase();
            assert.ok(ct.includes(expectedCt), `${pAsset} Content-Type ${ct} should include ${expectedCt}`);
        }

        // 6. Missing static files must NOT return HTML; unknown customer deep paths serve Customer Storefront (never Admin)
        const missingAdminJs = await fetch(`${baseUrl}/admin/js/missing_file_xyz.js`);
        assert.strictEqual(missingAdminJs.status, 404);
        const missingPartnerCss = await fetch(`${baseUrl}/partner/css/missing_xyz.css`);
        assert.strictEqual(missingPartnerCss.status, 404);
        const missingClientJs = await fetch(`${baseUrl}/js/missing_file_xyz.js`);
        assert.strictEqual(missingClientJs.status, 404);

        const unknownSpaRes = await fetch(`${baseUrl}/offers`);
        const unknownSpaHtml = await unknownSpaRes.text();
        assert.strictEqual(unknownSpaRes.status, 200);
        assert.ok(unknownSpaHtml.includes('LPUQuick — Calm Commerce'), 'Unknown storefront path must serve Customer Storefront');
        assert.ok(!unknownSpaHtml.includes('LPU Quick Admin Dashboard'), 'Unknown storefront path must NEVER serve Admin Dashboard');

        // 7. Mobile simulator, admin simulator & food portal routes
        const mobPrevRes = await fetch(`${baseUrl}/mobile-preview`);
        assert.strictEqual(mobPrevRes.status, 200);
        assert.ok((await mobPrevRes.text()).includes('Mobile Device Simulator'));

        const admPrevRes = await fetch(`${baseUrl}/admin-preview`);
        assert.strictEqual(admPrevRes.status, 200);
        assert.ok((await admPrevRes.text()).includes('Mobile Phone Simulator'));

        const foodRes = await fetch(`${baseUrl}/food`);
        assert.strictEqual(foodRes.status, 200);

        // 8. Express API routes under Cloudflare Workers (/api/* returns JSON, auth & sandbox isolation active)
        const healthRes = await fetch(`${baseUrl}/api/health`);
        const healthJson = await healthRes.json();
        assert.strictEqual(healthRes.status, 200);
        assert.strictEqual(healthJson.environment, 'sandbox-preview');

        const sbxCfgRes = await fetch(`${baseUrl}/api/payments/sandbox/config`);
        const sbxCfgJson = await sbxCfgRes.json();
        assert.strictEqual(sbxCfgRes.status, 200);
        assert.strictEqual(sbxCfgJson.sandbox, true);
        assert.strictEqual(sbxCfgJson.environment, 'sandbox');
        assert.strictEqual(sbxCfgJson.previewIsolation, true);

        // Verify workers.dev CORS allowlist & JSON body parsing + signature auth in Express Worker
        const corsRes = await fetch(`${baseUrl}/api/payments/sandbox/create-order`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://lpuquick.nivx1.workers.dev',
                'Access-Control-Request-Method': 'POST'
            }
        });
        assert.strictEqual(corsRes.headers.get('access-control-allow-origin'), 'https://lpuquick.nivx1.workers.dev');

        const unauthWebhookRes = await fetch(`${baseUrl}/api/payments/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'order.paid', event_id: 'e1' })
        });
        assert.ok([401, 503].includes(unauthWebhookRes.status), `Webhook should reject unauthenticated/unconfigured call with 401 or 503 JSON, got ${unauthWebhookRes.status}`);
        const unauthWebhookJson = await unauthWebhookRes.json();
        assert.ok(['MISSING_SIGNATURE', 'WEBHOOK_SECRET_NOT_CONFIGURED'].includes(unauthWebhookJson.code));

        const unauthOrdersRes = await fetch(`${baseUrl}/api/payments/sandbox/orders`);
        assert.strictEqual(unauthOrdersRes.status, 401);
        const unauthOrdersJson = await unauthOrdersRes.json();
        assert.strictEqual(unauthOrdersJson.code, 'UNAUTHORIZED_ORDERS_REQUEST');

        const unauthStatusRes = await fetch(`${baseUrl}/api/payments/sandbox/status/LPUQ_FAKE_1`);
        assert.ok([401, 503].includes(unauthStatusRes.status));
        const unauthStatusJson = await unauthStatusRes.json();
        assert.ok(['UNAUTHORIZED_STATUS_REQUEST', 'SANDBOX_DB_NOT_CONFIGURED'].includes(unauthStatusJson.code));

        const prodCheckoutBlocked = await fetch(`${baseUrl}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'u1' })
        });
        assert.strictEqual(prodCheckoutBlocked.status, 403);
        const prodCheckoutJson = await prodCheckoutBlocked.json();
        assert.strictEqual(prodCheckoutJson.code, 'LIVE_CHECKOUT_DISABLED_IN_SANDBOX');

        const adminApiBlocked = await fetch(`${baseUrl}/api/orders/admin/all`);
        assert.strictEqual(adminApiBlocked.status, 403);
        const adminApiBlockedJson = await adminApiBlocked.json();
        assert.strictEqual(adminApiBlockedJson.code, 'SANDBOX_ISOLATION_ACTIVE');

        const unknownApiRes = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
        assert.ok(unknownApiRes.status === 403 || unknownApiRes.status === 404);
        assert.ok((unknownApiRes.headers.get('content-type') || '').includes('application/json'), '/api/* must return JSON, never HTML');

        const productsIsoRes = await fetch(`${baseUrl}/api/products`);
        assert.strictEqual(productsIsoRes.status, 503, 'Without sandbox service_role secret in dev, products must fail closed with 503 SANDBOX_DB_NOT_CONFIGURED (never hit production)');
        const productsIsoJson = await productsIsoRes.json();
        assert.strictEqual(productsIsoJson.code, 'SANDBOX_DB_NOT_CONFIGURED');

        // 9. Vercel External Rewrite Proxy Compatibility & Security Checks
        const vercelProxyConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../vercel-proxy/vercel.json'), 'utf8'));
        assert.strictEqual(vercelProxyConfig.framework, null);
        assert.strictEqual(vercelProxyConfig.buildCommand, null);
        assert.strictEqual(vercelProxyConfig.outputDirectory, 'static');
        assert.ok(!vercelProxyConfig.functions, 'Minimal Vercel proxy config must not deploy Vercel Serverless Functions');
        assert.deepStrictEqual(vercelProxyConfig.rewrites, [
            { source: '/', destination: 'https://lpuquick.nivasnaidu07.workers.dev/' },
            { source: '/:path*', destination: 'https://lpuquick.nivasnaidu07.workers.dev/:path*' }
        ]);

        const swRes = await fetch(`${baseUrl}/sw.js`);
        assert.strictEqual(swRes.status, 200);
        assert.ok((swRes.headers.get('cache-control') || '').includes('no-store'), '/sw.js must emit no-store across proxy');

        assert.ok((healthRes.headers.get('cache-control') || '').includes('no-store'), '/api/health must emit no-store in sandbox');

        const cartNoStoreRes = await fetch(`${baseUrl}/api/cart/sbx_proxy_u1`);
        assert.ok((cartNoStoreRes.headers.get('cache-control') || '').includes('no-store'), '/api/cart/* must emit no-store');

        const vercelCorsRes = await fetch(`${baseUrl}/api/payments/sandbox/create-order`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'https://lpuquick.vercel.app',
                'Access-Control-Request-Method': 'POST'
            }
        });
        assert.strictEqual(vercelCorsRes.headers.get('access-control-allow-origin'), 'https://lpuquick.vercel.app');

        const vercelCsrfCheckRes = await fetch(`${baseUrl}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://lpuquick.vercel.app',
                'X-Forwarded-Host': 'lpuquick.vercel.app',
                'X-Forwarded-Proto': 'https'
            },
            body: JSON.stringify({ userId: 'sbx_u1' })
        });
        assert.notStrictEqual(vercelCsrfCheckRes.status, 403, 'Allowlisted lpuquick.vercel.app Origin must pass CSRF guard behind Worker host');
        assert.ok((vercelCsrfCheckRes.headers.get('cache-control') || '').includes('no-store'));

        const paymentsModule = require('../routes/payments');
        assert.strictEqual(
            paymentsModule.buildAllowedRedirectUrl({
                headers: {
                    host: 'lpuquick.nivasnaidu07.workers.dev',
                    'x-forwarded-host': 'lpuquick.vercel.app',
                    'x-forwarded-proto': 'https'
                }
            }),
            'https://lpuquick.vercel.app/sandbox-payment-return'
        );
        assert.strictEqual(
            paymentsModule.buildAllowedRedirectUrl({
                headers: {
                    host: 'lpuquick.nivasnaidu07.workers.dev',
                    origin: 'https://lpuquick.vercel.app'
                }
            }),
            'https://lpuquick.vercel.app/sandbox-payment-return'
        );
        assert.strictEqual(
            paymentsModule.resolveValidatedRedirectUrl({
                headers: {
                    host: 'lpuquick.nivasnaidu07.workers.dev',
                    origin: 'https://lpuquick.vercel.app'
                },
                body: { redirectUrl: 'https://evil.example/phish' }
            }),
            'https://lpuquick.vercel.app/sandbox-payment-return',
            'Untrusted redirectUrl body must be rejected in favor of allowlisted proxy host'
        );
        assert.strictEqual(
            paymentsModule.resolveValidatedRedirectUrl({
                headers: {
                    host: 'lpuquick.nivasnaidu07.workers.dev',
                    origin: 'https://lpuquick.vercel.app'
                },
                body: { redirectUrl: 'https://lpuquick.vercel.app/sandbox-payment-return' }
            }),
            'https://lpuquick.vercel.app/sandbox-payment-return'
        );

        // Confirm no global-scope runtime exceptions occurred in Worker logs
        const combinedLogs = logs.join('\n');
        assert.ok(!combinedLogs.includes('Disallowed operation called within global scope'), 'Worker must not call disallowed global-scope operations');

        console.log('✅ ALL CLOUDFLARE WRANGLER DEV ROUTE, ASSET & SANDBOX ISOLATION TESTS PASSED!');
    } finally {
        cleanup();
    }
}

runWranglerRouteTests().catch(err => {
    console.error('❌ Wrangler route test failed:', err);
    process.exit(1);
});

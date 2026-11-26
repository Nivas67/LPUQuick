import './cloudflare-shims/globals.mjs';
import { httpServerHandler } from 'cloudflare:node';
import http from 'node:http';
import app from './app.js';

const STATIC_EXT_RE = /\.(css|js|mjs|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|mp3|json|map|apk|txt|xml)$/i;

const WORKER_ENV_KEYS = [
    'NODE_ENV',
    'CLOUDFLARE_WORKERS',
    'PAYMENT_ENVIRONMENT',
    'UPI_GATEWAY_BASE_URL',
    'UPI_GATEWAY_API_KEY',
    'UPI_GATEWAY_API_SECRET',
    'PAYMENT_WEBHOOK_SECRET',
    'SANDBOX_SUPABASE_URL',
    'SANDBOX_SUPABASE_SERVICE_ROLE_KEY',
    'SANDBOX_SUPABASE_SCHEMA',
    'SANDBOX_ALLOWED_SUPABASE_REFS',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PUBLIC_APP_URL',
    'APP_URL',
    'JWT_SECRET',
    'ADMIN_SESSION_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

let cachedApiHandler = null;
let cachedServerPort = 3000;

function syncWorkerEnvToProcessEnv(env) {
    if (!env || typeof env !== 'object') return;
    process.env.CLOUDFLARE_WORKERS = '1';
    for (const key of WORKER_ENV_KEYS) {
        if (typeof env[key] === 'string' && env[key].length > 0) {
            process.env[key] = env[key];
        }
    }
}

function getExpressApiHandler(env) {
    syncWorkerEnvToProcessEnv(env);
    if (!cachedApiHandler) {
        const server = http.createServer(app);
        server.listen(cachedServerPort);
        cachedApiHandler = httpServerHandler(server);
    }
    return cachedApiHandler;
}

async function fetchStaticAsset(env, request, targetPathname, { noCacheHtml = false } = {}) {
    if (!env || !env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
        return new Response('Static assets binding unavailable.', { status: 500 });
    }
    const url = new URL(request.url);
    url.pathname = targetPathname;
    const assetRequest = new Request(url.toString(), request);
    const response = await env.ASSETS.fetch(assetRequest);
    if (!noCacheHtml) {
        return response;
    }
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

function jsonErrorResponse(status, code, error) {
    return new Response(JSON.stringify({ success: false, code, error }), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
        }
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const rawPathname = url.pathname || '/';
        const normalizedPath = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname;
        const lowerPath = normalizedPath.toLowerCase();

        // 1. Express API routes: always route to backend and always return JSON
        if (lowerPath === '/api' || lowerPath.startsWith('/api/')) {
            try {
                const handler = getExpressApiHandler(env);
                return await handler.fetch(request, env, ctx);
            } catch (err) {
                console.error('[Cloudflare Worker API Error]:', err && err.message ? err.message : err);
                return jsonErrorResponse(500, 'WORKER_API_ERROR', 'Unable to handle API request.');
            }
        }

        // 2. Mobile & Admin Preview simulator pages
        if (['/admin-preview', '/admin/preview', '/preview-admin', '/mobile-admin', '/ad-new-preview', '/ad-new/preview', '/ad-new_preview'].includes(lowerPath)) {
            return fetchStaticAsset(env, request, '/admin-preview.html', { noCacheHtml: true });
        }
        if (['/mobile', '/mobile-preview', '/phone', '/preview'].includes(lowerPath)) {
            return fetchStaticAsset(env, request, '/mobile-preview.html', { noCacheHtml: true });
        }

        // 3. Admin Dashboard (/admin/* and legacy /ad-new/* asset alias)
        if (lowerPath === '/admin' || lowerPath.startsWith('/admin/') || lowerPath === '/ad-new' || lowerPath.startsWith('/ad-new/')) {
            const subPath = lowerPath.startsWith('/ad-new')
                ? normalizedPath.slice('/ad-new'.length)
                : normalizedPath.slice('/admin'.length);

            if (subPath && STATIC_EXT_RE.test(subPath)) {
                return fetchStaticAsset(env, request, `/admin${subPath}`);
            }
            return fetchStaticAsset(env, request, '/admin/index.html', { noCacheHtml: true });
        }

        // 4. Partner Financial Portal (/partner/*)
        if (lowerPath === '/partner' || lowerPath.startsWith('/partner/')) {
            const subPath = normalizedPath.slice('/partner'.length);
            if (subPath && STATIC_EXT_RE.test(subPath)) {
                return fetchStaticAsset(env, request, `/partner${subPath}`);
            }
            return fetchStaticAsset(env, request, '/partner/index.html', { noCacheHtml: true });
        }

        // 5. Food portal page
        if (lowerPath === '/food' || lowerPath === '/cook') {
            return fetchStaticAsset(env, request, '/food.html', { noCacheHtml: true });
        }

        // 6. APK Download aliases
        if (['/download', '/downloads', '/download/apk', '/downloads/apk', '/download/lpuquick.apk', '/downloads/lpuquick.apk'].includes(lowerPath)) {
            return fetchStaticAsset(env, request, '/downloads/LPUQuick.apk');
        }
        if (lowerPath.startsWith('/download/')) {
            return fetchStaticAsset(env, request, `/downloads/${normalizedPath.slice('/download/'.length)}`);
        }

        // 7. Customer Storefront root & Sandbox Payment Return SPA page (never fall back to Admin HTML)
        if (lowerPath === '/' || lowerPath === '/index.html' || lowerPath === '/sandbox-payment-return' || lowerPath === '/sandbox-payment') {
            return fetchStaticAsset(env, request, '/index.html', { noCacheHtml: true });
        }

        // 8. Non-asset unknown paths fall back strictly to Customer Storefront (never Admin Dashboard); missing asset extensions return 404
        if (STATIC_EXT_RE.test(lowerPath)) {
            if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
                return env.ASSETS.fetch(request);
            }
            return new Response('Not Found', { status: 404 });
        }

        return fetchStaticAsset(env, request, '/index.html', { noCacheHtml: true });
    }
};

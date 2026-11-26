const express = require('express');
const {
    createSandboxPaymentService,
    GatewayError,
    WebhookSecurityError,
    SandboxStoreError,
    SandboxAuthError
} = require('../services/sandboxPaymentService');
const {
    extractCandidateTokens,
    issueSandboxSessionToken,
    issueOrderStatusToken,
    setSandboxSessionCookie
} = require('../services/sandboxAuth');

function isAllowedRedirectHostname(rawHost) {
    const cleanHost = String(rawHost || '').split(',')[0].trim();
    if (!cleanHost) return false;
    const hostnameOnly = cleanHost.split(':')[0].toLowerCase();

    const configuredAppHost = (() => {
        try {
            return process.env.APP_URL ? new URL(process.env.APP_URL).hostname.toLowerCase() : '';
        } catch {
            return '';
        }
    })();
    const publicAppHost = (() => {
        try {
            return process.env.PUBLIC_APP_URL ? new URL(process.env.PUBLIC_APP_URL).hostname.toLowerCase() : '';
        } catch {
            return '';
        }
    })();

    const vercelUrlHost = String(process.env.VERCEL_URL || '').trim().toLowerCase();
    const vercelBranchHost = String(process.env.VERCEL_BRANCH_URL || '').trim().toLowerCase();

    return Boolean(
        hostnameOnly === 'lpuquick.com' ||
        hostnameOnly.endsWith('.lpuquick.com') ||
        (configuredAppHost && hostnameOnly === configuredAppHost) ||
        (publicAppHost && hostnameOnly === publicAppHost) ||
        (vercelUrlHost && hostnameOnly === vercelUrlHost) ||
        (vercelBranchHost && hostnameOnly === vercelBranchHost) ||
        /^lpu-?quick(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(hostnameOnly) ||
        /^lpu-?quick(-[a-z0-9-]+)?\.[a-z0-9-]+\.workers\.dev$/.test(hostnameOnly) ||
        /^lpu-?quick(-[a-z0-9-]+)?\.pages\.dev$/.test(hostnameOnly)
    );
}

function extractUrlOriginHost(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:') return '';
        return parsed.host || '';
    } catch {
        return '';
    }
}

function buildAllowedRedirectUrl(req, clientOrderId = null) {
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '').split(',')[0].trim().toLowerCase();
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
    const directHost = String(req.headers.host || '').split(',')[0].trim();
    const browserOriginHost = extractUrlOriginHost(req.headers.origin) || extractUrlOriginHost(req.headers.referer);

    // Prefer forwarded proxy host, then allowlisted HTTPS Origin/Referer if proxy stripped X-Forwarded-Host
    let rawHost = '';
    if (forwardedHost && isAllowedRedirectHostname(forwardedHost)) {
        rawHost = forwardedHost;
    } else if (
        browserOriginHost &&
        isAllowedRedirectHostname(browserOriginHost) &&
        (!directHost || directHost.toLowerCase().endsWith('.workers.dev'))
    ) {
        rawHost = browserOriginHost;
    } else if (directHost && isAllowedRedirectHostname(directHost)) {
        rawHost = directHost;
    }

    const effectiveProto = proto === 'https' || browserOriginHost ? 'https' : '';
    if (!rawHost || effectiveProto !== 'https') {
        return undefined;
    }

    const base = `https://${rawHost}/sandbox-payment-return`;
    return clientOrderId ? `${base}?client_order_id=${encodeURIComponent(clientOrderId)}` : base;
}

function resolveValidatedRedirectUrl(req) {
    const requested = req?.body?.redirectUrl;
    if (requested && typeof requested === 'string') {
        try {
            const parsed = new URL(requested.trim());
            if (parsed.protocol === 'https:' && isAllowedRedirectHostname(parsed.host)) {
                return parsed.toString();
            }
        } catch {
            // Fall through to derived allowlisted redirect URL
        }
    }
    return buildAllowedRedirectUrl(req);
}

function sendKnownError(res, err) {
    if (
        err instanceof GatewayError ||
        err instanceof WebhookSecurityError ||
        err instanceof SandboxStoreError ||
        err instanceof SandboxAuthError
    ) {
        return res.status(err.statusCode || 400).json({
            success: false,
            code: err.code || 'PAYMENT_ERROR',
            retryable: Boolean(err.retryable),
            error: err.message
        });
    }
    console.error('[Sandbox Payments Error]:', err && err.message ? err.message : err);
    return res.status(500).json({
        success: false,
        code: 'INTERNAL_PAYMENT_ERROR',
        retryable: true,
        error: 'Unable to process sandbox payment request right now.'
    });
}

function createPaymentsRouter(serviceOverrides = null, routerOptions = {}) {
    const router = express.Router();
    const service = serviceOverrides || createSandboxPaymentService();
    const authOverrides = routerOptions.authOverrides || {};

    // Public non-sensitive sandbox config endpoint (never returns API keys or secrets)
    router.get('/sandbox/config', (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const cfg = service.getSafeSandboxConfig();
        return res.json({
            success: true,
            sandbox: true,
            ...cfg
        });
    });

    // POST /api/payments/sandbox/create-order
    // Creates an isolated sandbox test order on backend, binds HMAC ownership tokens, & returns /sandbox/pay/ URL
    router.post('/sandbox/create-order', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const requestedUserId = String(req.body.userId || req.body.user_id || '').trim();
            const { verifiedTokens } = extractCandidateTokens(req, authOverrides);
            const activeSession = verifiedTokens.find(t => t.typ === 'session');

            // Prevent session spoofing across different users when a session token is already bound
            if (activeSession && requestedUserId && activeSession.uid !== requestedUserId) {
                return res.status(403).json({
                    success: false,
                    code: 'USER_SESSION_MISMATCH',
                    error: 'Authenticated sandbox session does not match requested userId.'
                });
            }

            const safeRedirect = resolveValidatedRedirectUrl(req);

            const payload = {
                userId: activeSession ? activeSession.uid : (req.body.userId || req.body.user_id),
                guestUserId: req.body.guestUserId || req.body.guest_id,
                hostel_id: req.body.hostel_id || req.body.hostel,
                order_mode: req.body.order_mode || req.body.orderMode || 'DELIVERY',
                customerName: req.body.customerName || req.body.name,
                customerEmail: req.body.customerEmail || req.body.email,
                customerPhone: req.body.customerPhone || req.body.phone,
                idempotencyKey: req.body.idempotencyKey || req.body.checkoutAttemptId || req.headers['x-idempotency-key'],
                redirectUrl: safeRedirect,
                items: Array.isArray(req.body.items) ? req.body.items : undefined
            };

            const result = await service.createSandboxCheckoutOrder(payload);

            const ownerUserId = result.user_id || payload.userId || 'sandbox_guest';
            const sessionToken = issueSandboxSessionToken(ownerUserId, authOverrides);
            const statusToken = issueOrderStatusToken(result.client_order_id, ownerUserId, authOverrides);
            setSandboxSessionCookie(res, req, sessionToken);

            const safeResult = { ...result };
            delete safeResult.user_id;

            return res.status(200).json({
                ...safeResult,
                status_token: statusToken,
                session_token: sessionToken
            });
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    // GET /api/payments/sandbox/status/:orderId
    // Enforces ownership token/session + verifies server-to-server against Laravel UPI gateway
    router.get('/sandbox/status/:orderId', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const refresh = req.query.refresh !== '0';
            const result = await service.verifyAndSyncSandboxOrderStatus(req.params.orderId, {
                refresh,
                req
            });
            return res.json(result);
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    // GET /api/payments/sandbox/orders
    // Enforces authenticated session ownership for the requested user's sandbox test orders
    router.get('/sandbox/orders', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const { verifiedTokens } = extractCandidateTokens(req, authOverrides);
            const activeSession = verifiedTokens.find(t => t.typ === 'session');
            const userId = String(req.query.userId || req.headers['x-user-id'] || activeSession?.uid || '').trim();
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    code: 'UNAUTHORIZED_ORDERS_REQUEST',
                    error: 'Authentication required to list sandbox orders.'
                });
            }
            const orders = await service.listSandboxOrdersForUser(userId, { req });
            return res.json({ success: true, sandbox: true, orders });
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    // POST /api/payments/webhook
    // Signed webhook endpoint for Laravel UPI gateway callbacks
    router.post('/webhook', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            if (!req.rawBody || !Buffer.isBuffer(req.rawBody) || req.rawBody.length === 0) {
                return res.status(400).json({
                    success: false,
                    code: 'MISSING_RAW_BODY',
                    error: 'Webhook requires raw JSON request body.'
                });
            }

            const result = await service.handleWebhook({
                headers: req.headers,
                rawBody: req.rawBody,
                parsedBody: req.body
            });

            return res.status(result.statusCode || 200).json(result.body);
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    return router;
}

const defaultRouter = createPaymentsRouter();
defaultRouter.createPaymentsRouter = createPaymentsRouter;
defaultRouter.buildAllowedRedirectUrl = buildAllowedRedirectUrl;
defaultRouter.resolveValidatedRedirectUrl = resolveValidatedRedirectUrl;
defaultRouter.isAllowedRedirectHostname = isAllowedRedirectHostname;

module.exports = defaultRouter;

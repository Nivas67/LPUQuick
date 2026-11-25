const express = require('express');
const {
    createSandboxPaymentService,
    GatewayError,
    WebhookSecurityError,
    SandboxStoreError
} = require('../services/sandboxPaymentService');

function buildAllowedRedirectUrl(req, clientOrderId = null) {
    const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '').split(',')[0].trim().toLowerCase();
    if (!rawHost || proto !== 'https') {
        return undefined;
    }

    const hostnameOnly = rawHost.split(':')[0].toLowerCase();
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

    const isAllowedHost =
        hostnameOnly === 'lpuquick.com' ||
        hostnameOnly.endsWith('.lpuquick.com') ||
        (configuredAppHost && hostnameOnly === configuredAppHost) ||
        (publicAppHost && hostnameOnly === publicAppHost) ||
        (vercelUrlHost && hostnameOnly === vercelUrlHost) ||
        (vercelBranchHost && hostnameOnly === vercelBranchHost) ||
        /^lpuquick(-[a-zA-Z0-9-]+)?\.vercel\.app$/.test(hostnameOnly);

    if (!isAllowedHost) {
        return undefined;
    }

    const base = `https://${rawHost}/sandbox-payment-return`;
    return clientOrderId ? `${base}?client_order_id=${encodeURIComponent(clientOrderId)}` : base;
}

function sendKnownError(res, err) {
    if (err instanceof GatewayError || err instanceof WebhookSecurityError || err instanceof SandboxStoreError) {
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

function createPaymentsRouter(serviceOverrides = null) {
    const router = express.Router();
    const service = serviceOverrides || createSandboxPaymentService();

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
    // Creates an isolated sandbox test order on backend & returns validated /sandbox/pay/ URL
    router.post('/sandbox/create-order', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const safeRedirect = req.body.redirectUrl && typeof req.body.redirectUrl === 'string' && req.body.redirectUrl.startsWith('https://')
                ? req.body.redirectUrl
                : buildAllowedRedirectUrl(req);

            // Strip any client-supplied amount/price/total overrides — only forward safe identity + item quantities
            const payload = {
                userId: req.body.userId || req.body.user_id,
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
            return res.status(200).json(result);
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    // GET /api/payments/sandbox/status/:orderId
    // Server-to-server status verification against Laravel UPI gateway
    router.get('/sandbox/status/:orderId', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const refresh = req.query.refresh !== '0';
            const result = await service.verifyAndSyncSandboxOrderStatus(req.params.orderId, { refresh });
            return res.json(result);
        } catch (err) {
            return sendKnownError(res, err);
        }
    });

    // GET /api/payments/sandbox/orders
    // Recent isolated sandbox test orders for a given user
    router.get('/sandbox/orders', async (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        try {
            const userId = String(req.query.userId || req.headers['x-user-id'] || '').trim();
            if (!userId) {
                return res.status(400).json({ success: false, code: 'MISSING_USER_ID', error: 'userId is required.' });
            }
            const orders = await service.listSandboxOrdersForUser(userId);
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

module.exports = defaultRouter;

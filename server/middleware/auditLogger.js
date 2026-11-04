const supabaseDb = require('../db/supabaseDb');
const ipBlockService = require('../services/ipBlockService');

/**
 * Sanitize request body to prevent leaking sensitive passwords, tokens, or PINs into audit logs
 */
function sanitizePayload(body) {
    if (!body || typeof body !== 'object') return body;
    try {
        const copy = JSON.parse(JSON.stringify(body));
        const sensitiveKeys = ['password', 'admin_password', 'pin', 'financial_pin', 'token', 'secret', 'key'];

        function redact(obj) {
            if (!obj || typeof obj !== 'object') return;
            for (const key of Object.keys(obj)) {
                if (sensitiveKeys.includes(key.toLowerCase())) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    redact(obj[key]);
                }
            }
        }
        redact(copy);
        return copy;
    } catch (e) {
        return { error: 'Payload sanitization skipped' };
    }
}

/**
 * Infer human-readable administrative action tag from request method and route
 */
function inferActionTag(method, path) {
    const p = (path || '').toLowerCase();
    if (p.includes('/audit/page-view') || p.includes('/audit/page-open')) return 'PAGE_VIEW';
    if (p.includes('/admin-login')) return 'ADMIN_LOGIN';
    if (p.includes('/terminate-all-sessions')) return 'TERMINATE_ALL_SESSIONS';
    if (p.includes('/adjust-stock')) return 'STOCK_ADJUST';
    if (p.includes('/products') && p.includes('/create')) return 'PRODUCT_CREATE';
    if (p.includes('/products') && p.includes('/update')) return 'PRODUCT_UPDATE';
    if (p.includes('/products') && p.includes('/delete')) return 'PRODUCT_DELETE';
    if (p.includes('/products') && p.includes('/deactivate')) return 'PRODUCT_DEACTIVATE';
    if (p.includes('/orders') && p.includes('/status')) return 'ORDER_STATUS_CHANGE';
    if (p.includes('/orders') && p.includes('/edit')) return 'ORDER_EDIT';
    if (p.includes('/orders') && p.includes('/assign')) return 'ORDER_ASSIGNMENT';
    if (p.includes('/client-lock')) return 'STORE_LOCK_UPDATE';
    if (p.includes('/ip-block') && method === 'POST') return 'IP_BLOCKED';
    if (p.includes('/ip-block') && method === 'DELETE') return 'IP_UNBLOCKED';
    if (p.includes('/staff') && method === 'POST') return 'STAFF_CREATE';
    if (p.includes('/staff') && method === 'PUT') return 'STAFF_UPDATE';
    if (p.includes('/staff') && method === 'DELETE') return 'STAFF_DELETE';
    if (p.includes('/hostel-groups')) return 'HOSTEL_GROUPS_CHANGE';
    if (p.includes('/financial')) return 'FINANCIAL_OPERATION';
    if (p.includes('/backup')) return 'BACKUP_OPERATION';
    if (p.includes('/duty-status')) return 'STAFF_DUTY_CHANGE';
    if (p.includes('/offers-charges')) return 'SETTINGS_CHARGES_UPDATE';
    if (p.includes('/advertisements')) return 'ADVERTISEMENT_CHANGE';
    if (p.includes('/blacklist') || p.includes('/block')) return 'USER_BLACKLIST_CHANGE';

    return `${method}_API_CALL`;
}

/**
 * Core Audit Logging Middleware
 */
function auditMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalUrl = req.originalUrl || req.path || '';
    const method = req.method;

    // We strictly audit:
    // 1. All write operations: POST, PUT, PATCH, DELETE
    // 2. All admin route hits (/api/admin/*, /api/products/admin/*, /api/orders/admin/*)
    // 3. Explicit page-view beacons
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isAdminRoute = originalUrl.includes('/admin') || originalUrl.includes('/ad-new');
    const isPageView = originalUrl.includes('/audit/page-view');

    // Skip high-frequency read polling if it clutters logs (e.g. status polling every 2 sec unless requested)
    const isHighFrequencyPoll = method === 'GET' && (
        originalUrl.includes('/invalidate-cache') ||
        originalUrl.includes('/favicon') ||
        originalUrl.endsWith('.png') ||
        originalUrl.endsWith('.js') ||
        originalUrl.endsWith('.css')
    );

    if (!isMutation && !isPageView && (!isAdminRoute || isHighFrequencyPoll)) {
        return next();
    }

    const clientIp = ipBlockService.extractClientIp(req);
    const sanitizedBody = isMutation ? sanitizePayload(req.body) : null;

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Determine administrator identity
        const adminId = req.admin?.id || (req.body && req.body.email) || 'anonymous';
        const adminName = req.admin?.name || null;
        const adminEmail = req.admin?.email || (req.body && req.body.email) || null;
        const action = inferActionTag(method, originalUrl);

        const metadata = {
            ip: clientIp,
            method,
            path: originalUrl,
            status_code: statusCode,
            duration_ms: duration,
            admin_name: adminName,
            admin_email: adminEmail,
            user_agent: req.headers['user-agent'] || '',
            query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
            body: sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
        };

        const reason = `${method} ${originalUrl} -> ${statusCode} (${duration}ms)`;

        supabaseDb.audit.logAction({
            adminId,
            targetUserId: req.params?.id || req.body?.userId || req.body?.id || null,
            action,
            reason,
            metadata
        }).catch(err => {
            console.warn('[Audit Logger Warning]:', err.message);
        });
    });

    next();
}

module.exports = {
    auditMiddleware,
    sanitizePayload,
    inferActionTag
};


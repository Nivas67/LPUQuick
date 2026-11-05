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
 * Infer human-readable administrative action tag and descriptive details
 */
function inferActionDetails(req, method, originalUrl, statusCode, duration) {
    const p = (originalUrl || '').toLowerCase();
    const body = req.body || {};
    const query = req.query || {};
    const params = req.params || {};

    // 1. Hostel Lock & Availability Management
    if (p.includes('/client-lock')) {
        const hId = (body.hostel_id || query.hostel_id || body.target_hostel || 'ALL').toUpperCase();
        if (method === 'POST') {
            const isScheduled = body.lock_type === 'SCHEDULED';
            const action = isScheduled ? 'CLIENT_LOCK_SCHEDULED' : 'HOSTEL_CLOSED';
            const reason = isScheduled 
                ? `Scheduled store lock for hostel: ${hId}` 
                : `Closed hostel: ${hId} (${body.message || body.lock_type || 'Store Lock'})`;
            return { action, reason, targetHostel: hId };
        } else if (method === 'DELETE') {
            return {
                action: 'HOSTEL_OPENED',
                reason: `Opened hostel: ${hId}`,
                targetHostel: hId
            };
        }
    }

    // 2. Hostel Groups & Hostels
    if (p.includes('/hostel-groups') || p.includes('/hostels/')) {
        const hId = (body.hostel_id || query.hostel_id || params.id || '').toUpperCase();
        if (p.includes('toggle-status') || p.includes('toggle-mode')) {
            return {
                action: 'HOSTEL_GROUP_STATUS_TOGGLE',
                reason: `Toggled status for hostel group: ${params.id || hId || 'Group'}`,
                targetHostel: hId || null
            };
        }
    }

    // 3. Stock Adjustments
    if (p.includes('/adjust-stock')) {
        const name = body.name || body.product_name || body.productId || body.id || 'Product';
        const change = body.quantity_change !== undefined 
            ? (Number(body.quantity_change) > 0 ? `+${body.quantity_change}` : body.quantity_change) 
            : (body.stock ?? '');
        return {
            action: 'STOCK_ADJUST',
            reason: `Adjusted stock for ${name}: ${change}`,
            targetHostel: body.hostel_id || null
        };
    }

    // 4. Products Management
    if (p.includes('/products')) {
        const prodId = params.id || p.split('/update/')[1]?.split('?')[0] || p.split('/delete/')[1]?.split('?')[0] || body.id || '';
        if (p.includes('/create')) {
            return {
                action: 'PRODUCT_CREATE',
                reason: `Created product: ${body.name || prodId} (₹${body.price || ''})`
            };
        }
        if (p.includes('/update')) {
            const parts = [];
            if (body.stock_left !== undefined) parts.push(`Stock: ${body.stock_left}`);
            if (body.price) parts.push(`Price: ₹${body.price}`);
            return {
                action: 'PRODUCT_UPDATE',
                reason: `Updated product (${prodId || body.name}): ${body.name || ''} ${parts.length ? `[${parts.join(', ')}]` : ''}`.trim()
            };
        }
        if (p.includes('/delete')) {
            return {
                action: 'PRODUCT_DELETE',
                reason: `Deleted product: ${prodId}`
            };
        }
        if (p.includes('/deactivate')) {
            return {
                action: 'PRODUCT_DEACTIVATE',
                reason: `Deactivated product: ${prodId}`
            };
        }
    }

    // 5. Orders Management
    if (p.includes('/orders')) {
        const ordId = body.order_id || body.id || params.id || p.split('/detail/')[1]?.split('?')[0] || '';
        if (p.includes('/status')) {
            return {
                action: 'ORDER_STATUS_CHANGE',
                reason: `Order #${ordId} status changed to: ${body.status || ''}`
            };
        }
        if (p.includes('/edit')) {
            return {
                action: 'ORDER_EDIT',
                reason: `Edited order details for #${ordId}`
            };
        }
        if (p.includes('/assign')) {
            return {
                action: 'ORDER_ASSIGNMENT',
                reason: `Assigned order #${ordId} to rider: ${body.rider_name || body.rider_id || ''}`
            };
        }
    }

    // 6. IP Security
    if (p.includes('/ip-block')) {
        const targetIp = body.ip || params.ip || '';
        if (method === 'POST') {
            return {
                action: 'IP_BLOCKED',
                reason: `Blocked IP: ${targetIp} (${body.reason || 'Manual block'})`
            };
        }
        if (method === 'DELETE') {
            return {
                action: 'IP_UNBLOCKED',
                reason: `Unblocked IP: ${targetIp}`
            };
        }
    }

    // 7. Session Revocation & Logins
    if (p.includes('/terminate-all-sessions')) {
        return {
            action: 'TERMINATE_ALL_SESSIONS',
            reason: 'Terminated all active administrator sessions across all devices'
        };
    }
    if (p.includes('/admin-login')) {
        return {
            action: 'ADMIN_LOGIN',
            reason: `Admin signed in: ${body.email || ''}`
        };
    }
    if (p.includes('/audit/page-view') || p.includes('/audit/page-open')) {
        return {
            action: 'PAGE_VIEW',
            reason: `Admin opened view: ${body.view || 'Dashboard'}`
        };
    }
    if (p.includes('/staff')) {
        if (method === 'POST') return { action: 'STAFF_CREATE', reason: `Created staff member: ${body.name || ''} (${body.email || ''})` };
        if (method === 'PUT') return { action: 'STAFF_UPDATE', reason: `Updated staff permissions for: ${body.name || params.id || ''}` };
        if (method === 'DELETE') return { action: 'STAFF_DELETE', reason: `Deleted staff member: ${params.id || ''}` };
    }
    if (p.includes('/duty-status')) {
        return { action: 'STAFF_DUTY_CHANGE', reason: `Updated staff duty status for employee: ${params.empId || ''}` };
    }
    if (p.includes('/offers-charges')) {
        return { action: 'SETTINGS_CHARGES_UPDATE', reason: 'Updated checkout delivery charges and offer rules' };
    }
    if (p.includes('/advertisements')) {
        return { action: 'ADVERTISEMENT_CHANGE', reason: 'Updated promotional banners and posters' };
    }
    if (p.includes('/blacklist') || p.includes('/block')) {
        return { action: 'USER_BLACKLIST_CHANGE', reason: `Updated customer blacklist: ${params.userId || body.userId || ''}` };
    }

    return {
        action: `${method}_API_CALL`,
        reason: `${method} ${originalUrl} -> ${statusCode} (${duration}ms)`
    };
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

    // Skip high-frequency read polling if it clutters logs
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
        // If route already wrote an explicit custom audit log, avoid logging a second duplicate
        if (req._auditLogged) return;

        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Determine administrator identity
        const adminId = req.admin?.id || (req.body && req.body.email) || 'anonymous';
        const adminName = req.admin?.name || null;
        const adminEmail = req.admin?.email || (req.body && req.body.email) || null;

        const details = inferActionDetails(req, method, originalUrl, statusCode, duration);

        const metadata = {
            ip: clientIp,
            method,
            path: originalUrl,
            status_code: statusCode,
            duration_ms: duration,
            admin_name: adminName,
            admin_email: adminEmail,
            target_hostel: details.targetHostel || req.body?.hostel_id || req.query?.hostel_id || undefined,
            user_agent: req.headers['user-agent'] || '',
            query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
            body: sanitizedBody && Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined
        };

        supabaseDb.audit.logAction({
            adminId,
            targetUserId: req.params?.id || req.body?.userId || req.body?.id || null,
            action: details.action,
            reason: details.reason,
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
    inferActionDetails
};

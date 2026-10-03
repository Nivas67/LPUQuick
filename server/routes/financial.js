const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const requireAdmin = require('../middleware/adminAuth');
const { getSupabaseClient } = require('../supabase');
const financialEngine = require('../utils/financialEngine');
const supabaseDb = require('../db/supabaseDb');

const FINANCIAL_SECRET = process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'lpuquick_financial_pin_secure_secret_2026';
const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 minutes auto-lock timeout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout after 5 consecutive failures

// Set of manually revoked financial tokens
const revokedFinancialTokens = new Set();

/**
 * Helper: Hash a 4-6 digit numeric PIN using PBKDF2
 */
function hashPin(pin, salt = null) {
    if (!salt) {
        salt = crypto.randomBytes(16).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(pin.toString(), salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
}

/**
 * Helper: Verify a PIN against stored hash & salt
 */
function verifyPin(pin, storedHash, salt) {
    const { hash } = hashPin(pin, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

/**
 * Helper: Issue signed HMAC financial token
 */
function issueFinancialToken(adminId) {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const payload = `${adminId}:${expiresAt}:${crypto.randomBytes(8).toString('hex')}`;
    const signature = crypto.createHmac('sha256', FINANCIAL_SECRET).update(payload).digest('hex');
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
    
    return { token, expiresAt, expiresInSeconds: Math.floor(SESSION_DURATION_MS / 1000) };
}

/**
 * Helper: Verify financial token (Stateless HMAC verification)
 */
function verifyFinancialToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [b64Payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', FINANCIAL_SECRET).update(Buffer.from(b64Payload, 'base64url').toString('utf8')).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
        return null;
    }

    const payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const [adminId, expiresAtStr] = payload.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
        return null;
    }

    // Check if manually revoked
    if (revokedFinancialTokens.has(token)) {
        return null;
    }

    return { adminId, expiresAt, remainingSeconds: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) };
}

/**
 * Helper: Fetch financial PIN config from Supabase app_availability
 */
async function getPinConfig() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('app_availability')
            .select('message')
            .eq('id', 'financial_security')
            .maybeSingle();

        if (error || !data || !data.message) {
            return { configured: false, failed_attempts: 0, locked_until: null };
        }

        const parsed = JSON.parse(data.message);
        return parsed;
    } catch (e) {
        return { configured: false, failed_attempts: 0, locked_until: null };
    }
}

/**
 * Helper: Save financial PIN config to Supabase app_availability
 */
async function savePinConfig(configObj) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('app_availability')
        .upsert({
            id: 'financial_security',
            is_locked: true,
            lock_type: 'PIN_SECURED',
            profit_locked: true,
            message: JSON.stringify(configObj),
            updated_at: new Date().toISOString()
        });

    if (error) {
        throw new Error(`Failed to persist financial PIN config: ${error.message}`);
    }
}

/**
 * Strict Owner-Only Access Guard:
 * Only the verified platform owner can view or unlock Financial Intelligence.
 * Store Managers and Delivery Partners are strictly forbidden.
 */
function requireOwner(req, res, next) {
    const user = req.admin;
    const isOwner = Boolean(
        user?.is_owner || 
        user?.role === 'owner' || 
        user?.id === 'user_admin_bh13' || 
        user?.email === 'admin@lpu.in' || 
        (Array.isArray(user?.roles) && user.roles.includes('owner'))
    );
    if (!isOwner) {
        return res.status(403).json({
            success: false,
            code: 'FORBIDDEN_OWNER_ONLY',
            error: 'Access denied. Financial Intelligence and profit calculations are strictly restricted to the platform owner.'
        });
    }
    next();
}

// -------------------------------------------------------------
// GET /api/admin/financial/status
// Check if PIN is configured and whether current request has active unlock
// -------------------------------------------------------------
router.get('/status', requireAdmin, requireOwner, async (req, res) => {
    try {
        const config = await getPinConfig();
        const financialToken = req.headers['x-financial-token'];
        const session = verifyFinancialToken(financialToken);

        const isLockedOut = config.locked_until && Date.now() < config.locked_until;

        return res.json({
            success: true,
            configured: Boolean(config.configured && config.hash),
            is_unlocked: Boolean(session),
            expires_in_seconds: session ? session.remainingSeconds : 0,
            is_locked_out: isLockedOut,
            lockout_remaining_seconds: isLockedOut ? Math.ceil((config.locked_until - Date.now()) / 1000) : 0
        });
    } catch (err) {
        console.error('Financial status error:', err);
        return res.status(500).json({ success: false, error: 'Failed to retrieve financial security status' });
    }
});

// -------------------------------------------------------------
// POST /api/admin/financial/setup-pin
// Configure or change the financial PIN
// -------------------------------------------------------------
router.post('/setup-pin', requireAdmin, requireOwner, async (req, res) => {
    try {
        const { current_pin, new_pin, confirm_pin } = req.body;

        if (!new_pin || !confirm_pin) {
            return res.status(400).json({ success: false, error: 'New PIN and Confirm PIN are required.' });
        }

        const pinRegex = /^\d{4,6}$/;
        if (!pinRegex.test(new_pin)) {
            return res.status(400).json({ success: false, error: 'PIN must be between 4 and 6 numeric digits.' });
        }

        if (new_pin !== confirm_pin) {
            return res.status(400).json({ success: false, error: 'New PIN and Confirm PIN do not match.' });
        }

        const config = await getPinConfig();

        // If already configured, require valid current_pin or admin account password
        if (config.configured && config.hash) {
            const { admin_password } = req.body;
            let isCurrentValid = false;
            if (current_pin) {
                isCurrentValid = verifyPin(current_pin, config.hash, config.salt);
            }
            if (!isCurrentValid && admin_password) {
                const ownerUser = await supabaseDb.users.getByIdentifier(req.admin?.email || 'admin@lpu.in');
                if (ownerUser && (ownerUser.password_hash === admin_password || ownerUser.password_hash === `hash_${admin_password}` || (process.env.ADMIN_PASSWORD && admin_password === process.env.ADMIN_PASSWORD))) {
                    isCurrentValid = true;
                }
            }
            if (!isCurrentValid) {
                return res.status(401).json({ success: false, error: 'Current PIN or Admin Password is incorrect.' });
            }
        }

        const { hash, salt } = hashPin(new_pin);
        const newConfig = {
            configured: true,
            hash,
            salt,
            failed_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString(),
            updated_by: req.admin?.id || 'admin'
        };

        await savePinConfig(newConfig);

        // Invalidate any existing financial sessions on PIN change
        if (typeof revokedFinancialTokens !== 'undefined') {
            revokedFinancialTokens.clear();
        }

        return res.json({
            success: true,
            message: 'Financial PIN successfully configured and secured.'
        });
    } catch (err) {
        console.error('Setup PIN error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to configure financial PIN.' });
    }
});

// -------------------------------------------------------------
// POST /api/admin/financial/unlock
// Unlock financial data using PIN
// -------------------------------------------------------------
router.post('/unlock', requireAdmin, requireOwner, async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ success: false, error: 'PIN is required to unlock financial data.' });
        }

        const config = await getPinConfig();
        if (!config.configured || !config.hash) {
            return res.status(400).json({
                success: false,
                code: 'PIN_NOT_CONFIGURED',
                error: 'Financial PIN has not been configured yet. Please set up a PIN first.'
            });
        }

        // Check lockout
        if (config.locked_until && Date.now() < config.locked_until) {
            const waitSec = Math.ceil((config.locked_until - Date.now()) / 1000);
            return res.status(429).json({
                success: false,
                code: 'LOCKED_OUT',
                error: `Too many failed attempts. PIN entry locked for ${waitSec} more seconds.`
            });
        }

        const isValid = verifyPin(pin, config.hash, config.salt);
        if (!isValid) {
            const failedAttempts = (config.failed_attempts || 0) + 1;
            let lockedUntil = null;
            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            }

            await savePinConfig({
                ...config,
                failed_attempts: failedAttempts >= MAX_FAILED_ATTEMPTS ? 0 : failedAttempts,
                locked_until: lockedUntil
            });

            const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts);
            return res.status(401).json({
                success: false,
                error: lockedUntil
                    ? `Incorrect PIN. Maximum attempts exceeded. Locked for 15 minutes.`
                    : `Incorrect PIN. ${remainingAttempts} attempt(s) remaining.`
            });
        }

        // Reset failed attempts upon successful verification
        if (config.failed_attempts > 0 || config.locked_until) {
            await savePinConfig({
                ...config,
                failed_attempts: 0,
                locked_until: null
            });
        }

        const tokenData = issueFinancialToken(req.admin?.id || 'admin');

        return res.json({
            success: true,
            message: 'Financial data unlocked successfully.',
            financial_token: tokenData.token,
            expires_in_seconds: tokenData.expiresInSeconds,
            expires_at: tokenData.expiresAt
        });
    } catch (err) {
        console.error('Unlock error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to verify financial PIN.' });
    }
});

// -------------------------------------------------------------
// POST /api/admin/financial/lock
// Manually lock financial data immediately
// -------------------------------------------------------------
router.post('/lock', requireAdmin, requireOwner, async (req, res) => {
    const financialToken = req.headers['x-financial-token'];
    if (financialToken) {
        revokedFinancialTokens.add(financialToken);
    }
    return res.json({
        success: true,
        message: 'Financial metrics locked successfully.'
    });
});

// -------------------------------------------------------------
// GET /api/admin/financial/data
// PROTECTED: Returns real revenue & profit ONLY if financial PIN is unlocked
// -------------------------------------------------------------
router.get('/data', requireAdmin, requireOwner, async (req, res) => {
    try {
        const financialToken = req.headers['x-financial-token'];
        const session = verifyFinancialToken(financialToken);

        if (!session) {
            // ZERO financial figures are transmitted when locked
            return res.status(403).json({
                success: false,
                locked: true,
                code: 'FINANCIAL_LOCKED',
                error: 'Financial metrics are locked. Administrator PIN authentication required.'
            });
        }

        // Query all orders from Supabase PostgreSQL
        const supabase = getSupabaseClient();
        const { data: rawOrders, error: ordersErr } = await supabase
            .from('orders')
            .select('id, total, status, created_at')
            .order('created_at', { ascending: false });

        if (ordersErr) {
            console.error('Error querying financial orders:', ordersErr);
            return res.status(500).json({ success: false, error: 'Database inquiry failed.' });
        }

        // STRICT ACCURACY RULE:
        // Only count money from successfully delivered orders.
        // CANCELLED ORDERS, REJECTED ORDERS, AND PENDING ORDERS ARE NEVER ADDED TO REVENUE!
        const deliveredOrders = (rawOrders || []).filter(o => financialEngine.isDelivered(o.status));
        const deliveredOrderIds = deliveredOrders.map(o => o.id);

        let items = [];
        if (deliveredOrderIds.length > 0) {
            // Join order_items with products for selling price, cost price, and MRP
            const { data: dbItems, error: itemsErr } = await supabase
                .from('order_items')
                .select('order_id, product_id, quantity, unit_price, products(id, name, price, cost_price, mrp)')
                .in('order_id', deliveredOrderIds);

            if (!itemsErr && dbItems) {
                items = dbItems;
            }
        }

        // Retrieve snapshots for orders to guarantee historical accuracy
        let snapshotsMap = {};
        try {
            snapshotsMap = supabaseDb.orders.getAllOrderSnapshots() || {};
        } catch (sErr) {
            console.warn('[Financial Snapshots Read Note]:', sErr.message);
        }

        const financials = financialEngine.calculateTotalFinancials(deliveredOrders, items, snapshotsMap);

        return res.json({
            success: true,
            locked: false,
            expires_in_seconds: session.remainingSeconds,
            metrics: {
                total_revenue: financials.totalRevenue,
                total_cost: financials.totalCost,
                total_profit: financials.totalProfit,
                profit_margin: financials.profitMargin,
                average_order_value: financials.averageOrderValue,
                completed_orders_count: financials.completedOrdersCount,
                delivered_orders_count: financials.completedOrdersCount,
                formatted_revenue: financials.formattedRevenue,
                formatted_profit: financials.formattedProfit
            }
        });
    } catch (err) {
        console.error('Financial data error:', err);
        return res.status(500).json({ success: false, error: 'Failed to compute financial data.' });
    }
});

// -------------------------------------------------------------
// GET /api/admin/financial/daily-breakdown
// PROTECTED: Returns day-wise revenue, cost, profit, and order details
// STRICTLY OWNER-ONLY & CALCULATED EXCLUSIVELY FROM DELIVERED ORDERS
// -------------------------------------------------------------
router.get('/daily-breakdown', requireAdmin, requireOwner, async (req, res) => {
    try {
        const financialToken = req.headers['x-financial-token'];
        const session = verifyFinancialToken(financialToken);
        const config = await getPinConfig();

        // If financial PIN is configured, verify active financial token session
        if (config.configured && config.hash && !session) {
            return res.status(403).json({
                success: false,
                locked: true,
                code: 'FINANCIAL_LOCKED',
                error: 'Financial metrics are locked. Administrator PIN authentication required.'
            });
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
            return res.status(500).json({ success: false, error: 'Database client unavailable.' });
        }

        // Query all orders with customer details (with graceful schema fallback)
        let allOrders = [];
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, user_id, customer_name, customer_phone, status, subtotal, delivery_fee, platform_fee, total, payment_method, delivery_address, hostel_id, created_at')
                .order('created_at', { ascending: false });
            if (!error && data) {
                allOrders = data;
            } else {
                throw new Error(error?.message || 'Hostel column query fallback');
            }
        } catch (e) {
            const { data } = await supabase
                .from('orders')
                .select('id, user_id, customer_name, customer_phone, status, subtotal, delivery_fee, platform_fee, total, payment_method, delivery_address, created_at')
                .order('created_at', { ascending: false });
            allOrders = data || [];
        }

        // Normalize hostel_id on every order
        allOrders.forEach(o => {
            if (!o.hostel_id) {
                const match = o.delivery_address && (o.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || o.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i));
                o.hostel_id = match ? `${match[1].toUpperCase()}-${match[2]}` : 'BH-13';
            }
        });

        // Compute Multi-Hostel comparison statistics
        const hostelComparisonMap = {};
        try {
            const availableHostels = await supabaseDb.hostels.getAll({ includeInactive: true });
            availableHostels.forEach(h => {
                hostelComparisonMap[h.id] = {
                    hostel_id: h.id,
                    hostel_name: h.name || h.id,
                    status: h.status || 'ACTIVE',
                    orders_count: 0,
                    delivered_count: 0,
                    revenue: 0,
                    formatted_revenue: '₹0'
                };
            });
        } catch (hErr) {}

        allOrders.forEach(o => {
            const hid = (o.hostel_id || 'BH-13').toUpperCase();
            if (!hostelComparisonMap[hid]) {
                hostelComparisonMap[hid] = {
                    hostel_id: hid,
                    hostel_name: hid,
                    status: 'ACTIVE',
                    orders_count: 0,
                    delivered_count: 0,
                    revenue: 0,
                    formatted_revenue: '₹0'
                };
            }
            hostelComparisonMap[hid].orders_count++;
            if (financialEngine.isDelivered(o.status)) {
                hostelComparisonMap[hid].delivered_count++;
                hostelComparisonMap[hid].revenue += Number(o.total || 0);
            }
        });

        Object.values(hostelComparisonMap).forEach(hc => {
            hc.formatted_revenue = `₹${Math.round(hc.revenue).toLocaleString('en-IN')}`;
        });

        const deliveredOrders = allOrders.filter(o => financialEngine.isDelivered(o.status));
        const deliveredOrderIds = deliveredOrders.map(o => o.id);

        let items = [];
        if (deliveredOrderIds.length > 0) {
            // Query order_items in chunks of 150 to guarantee safety against query size limits
            const CHUNK_SIZE = 150;
            for (let i = 0; i < deliveredOrderIds.length; i += CHUNK_SIZE) {
                const chunk = deliveredOrderIds.slice(i, i + CHUNK_SIZE);
                const { data: chunkItems, error: itemsErr } = await supabase
                    .from('order_items')
                    .select('order_id, product_id, quantity, unit_price, products(id, name, price, cost_price, mrp)')
                    .in('order_id', chunk);

                if (!itemsErr && chunkItems) {
                    items.push(...chunkItems);
                }
            }
        }

        // Snapshots map for historical accuracy
        let snapshotsMap = {};
        try {
            snapshotsMap = supabaseDb.orders.getAllOrderSnapshots() || {};
        } catch (sErr) {
            console.warn('[Financial Snapshots Read Note]:', sErr.message);
        }

        const { range, startDate, endDate, hostel_id } = req.query;
        let targetOrders = allOrders;
        if (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') {
            const norm = hostel_id.toLowerCase().replace('-', '');
            targetOrders = allOrders.filter(o => (o.hostel_id || 'BH-13').toLowerCase().replace('-', '') === norm);
        }

        const breakdown = financialEngine.calculateDayWiseFinancials(targetOrders, items, snapshotsMap, {
            range: range || 'all',
            startDate,
            endDate
        });

        return res.json({
            success: true,
            locked: false,
            expires_in_seconds: session ? session.remainingSeconds : null,
            filter: {
                range: range || 'all',
                startDate: startDate || null,
                endDate: endDate || null,
                hostel_id: hostel_id || 'all'
            },
            summary: breakdown.summary,
            days: breakdown.days,
            hostel_comparison: Object.values(hostelComparisonMap)
        });
    } catch (err) {
        console.error('Daily breakdown error:', err);
        return res.status(500).json({ success: false, error: 'Failed to compute daily revenue and profit data.' });
    }
});

module.exports = router;
module.exports.issueFinancialToken = issueFinancialToken;
module.exports.verifyFinancialToken = verifyFinancialToken;

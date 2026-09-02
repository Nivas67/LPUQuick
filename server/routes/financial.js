const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const requireAdmin = require('../middleware/adminAuth');
const { getSupabaseClient } = require('../supabase');

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

// -------------------------------------------------------------
// GET /api/admin/financial/status
// Check if PIN is configured and whether current request has active unlock
// -------------------------------------------------------------
router.get('/status', requireAdmin, async (req, res) => {
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
router.post('/setup-pin', requireAdmin, async (req, res) => {
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

        // If already configured, require valid current_pin
        if (config.configured && config.hash) {
            if (!current_pin) {
                return res.status(400).json({ success: false, error: 'Current PIN is required to change financial PIN.' });
            }
            const isCurrentValid = verifyPin(current_pin, config.hash, config.salt);
            if (!isCurrentValid) {
                return res.status(401).json({ success: false, error: 'Current PIN is incorrect.' });
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
        activeFinancialSessions.clear();

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
router.post('/unlock', requireAdmin, async (req, res) => {
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
router.post('/lock', requireAdmin, async (req, res) => {
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
router.get('/data', requireAdmin, async (req, res) => {
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

        // Query completed orders from Supabase PostgreSQL
        const supabase = getSupabaseClient();
        const { data: orders, error: ordersErr } = await supabase
            .from('orders')
            .select('id, total, status, created_at')
            .in('status', ['Delivered', 'delivered', 'Completed']);

        if (ordersErr) {
            console.error('Error querying financial orders:', ordersErr);
            return res.status(500).json({ success: false, error: 'Database inquiry failed.' });
        }

        const completedOrders = orders || [];
        const completedOrderIds = completedOrders.map(o => o.id);

        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        let profitMargin = 0;

        if (completedOrderIds.length > 0) {
            // Join order_items with products to retrieve unit selling prices & authoritative purchase cost prices
            const { data: items, error: itemsErr } = await supabase
                .from('order_items')
                .select('order_id, product_id, quantity, unit_price, products(cost_price)')
                .in('order_id', completedOrderIds);

            if (!itemsErr && items && items.length > 0) {
                for (const it of items) {
                    const qty = Number(it.quantity) || 1;
                    const unitPrice = Number(it.unit_price) || 0;
                    const costPrice = Number(it.products?.cost_price) || 0;

                    const itemRev = Math.round(unitPrice * qty * 100) / 100;
                    const itemCost = Math.round(costPrice * qty * 100) / 100;

                    totalRevenue += itemRev;
                    totalCost += itemCost;
                }
            } else {
                totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            }

            totalRevenue = Math.round(totalRevenue * 100) / 100;
            totalCost = Math.round(totalCost * 100) / 100;
            totalProfit = Math.max(0, Math.round((totalRevenue - totalCost) * 100) / 100);
            profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0;
        }

        const aov = completedOrders.length > 0 ? Math.round((totalRevenue / completedOrders.length) * 100) / 100 : 0;

        return res.json({
            success: true,
            locked: false,
            expires_in_seconds: session.remainingSeconds,
            metrics: {
                total_revenue: totalRevenue,
                total_cost: totalCost,
                total_profit: totalProfit,
                profit_margin: profitMargin,
                average_order_value: aov,
                completed_orders_count: completedOrders.length
            }
        });
    } catch (err) {
        console.error('Financial data error:', err);
        return res.status(500).json({ success: false, error: 'Failed to compute financial data.' });
    }
});

module.exports = router;

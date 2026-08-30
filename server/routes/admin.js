const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const requireAdmin = require('../middleware/adminAuth');
const { broadcastClientLockUpdate, broadcastUserBlocked } = require('../realtime');
const cache = require('../cache');

// All routes in this file require Administrator Authorization
router.use(requireAdmin);

// ============================================================
// 1. CLIENT DASHBOARD LOCK / STORE AVAILABILITY CONTROLS
// ============================================================

// GET /api/admin/client-lock
router.get('/client-lock', async (req, res) => {
    try {
        const status = await supabaseDb.availability.getStatus();
        res.json({ success: true, availability: status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/client-lock
router.post('/client-lock', async (req, res) => {
    const { lock_type, message, start_at, end_at, duration_minutes } = req.body;
    const adminId = req.admin?.id || 'admin_001';

    try {
        let finalStart = start_at ? new Date(start_at).toISOString() : null;
        let finalEnd = end_at ? new Date(end_at).toISOString() : null;
        let finalType = lock_type || 'IMMEDIATE';
        let isLocked = true;

        if (finalType === 'DURATION') {
            const mins = parseInt(duration_minutes, 10) || 30;
            const startNow = new Date();
            finalStart = startNow.toISOString();
            finalEnd = new Date(startNow.getTime() + (mins * 60 * 1000)).toISOString();
            isLocked = true;
        } else if (finalType === 'SCHEDULED') {
            if (!finalStart || !finalEnd) {
                return res.status(400).json({ error: 'Start time and End time are required for scheduled lock.' });
            }
            if (new Date(finalEnd).getTime() <= new Date(finalStart).getTime()) {
                return res.status(400).json({ error: 'End time must be after Start time.' });
            }
            const now = Date.now();
            isLocked = (now >= new Date(finalStart).getTime() && now < new Date(finalEnd).getTime());
        } else if (finalType === 'MANUAL' || finalType === 'IMMEDIATE') {
            isLocked = true;
            if (!finalStart) finalStart = new Date().toISOString();
        }

        const updated = await supabaseDb.availability.setLock({
            is_locked: isLocked,
            lock_type: finalType,
            message: message || null,
            start_at: finalStart,
            end_at: finalEnd,
            created_by: adminId
        });

        // Audit Logging
        const auditAction = finalType === 'SCHEDULED' ? 'CLIENT_LOCK_SCHEDULED' : (isLocked ? 'CLIENT_LOCK_ENABLED' : 'CLIENT_LOCK_UPDATED');
        await supabaseDb.audit.logAction({
            adminId,
            action: auditAction,
            reason: message || 'Admin applied store lock',
            metadata: { lock_type: finalType, start_at: finalStart, end_at: finalEnd }
        });

        // Real-time broadcast to all storefront clients
        try {
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate(updated);
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            message: isLocked ? 'Client Storefront has been locked.' : 'Lock scheduled successfully.',
            availability: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/client-lock (Unlock store now)
router.delete('/client-lock', async (req, res) => {
    const adminId = req.admin?.id || 'admin_001';
    try {
        const updated = await supabaseDb.availability.unlock(adminId);

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            action: 'CLIENT_LOCK_DISABLED',
            reason: 'Admin manually unlocked store'
        });

        // Real-time broadcast to all storefront clients
        try {
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate(updated);
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            message: 'Client Storefront is now AVAILABLE.',
            availability: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 2. USER BLOCKING & BLACKLIST MANAGEMENT
// ============================================================

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const search = (req.query.search || '').trim().toLowerCase();
        const statusFilter = req.query.status || 'all';

        const customers = await supabaseDb.users.getAllCustomersWithMetrics();

        let filtered = customers;
        if (search) {
            filtered = filtered.filter(c => 
                (c.name || '').toLowerCase().includes(search) ||
                (c.email || '').toLowerCase().includes(search) ||
                (c.phone || '').includes(search) ||
                (c.id || '').toLowerCase().includes(search)
            );
        }

        if (statusFilter === 'blocked') {
            filtered = filtered.filter(c => c.account_status === 'BLOCKED');
        } else if (statusFilter === 'active') {
            filtered = filtered.filter(c => c.account_status === 'ACTIVE');
        }

        res.json({
            success: true,
            total: filtered.length,
            users: filtered
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await supabaseDb.users.getById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const blacklistCheck = await supabaseDb.blacklist.isUserBlacklisted(id);
        res.json({
            success: true,
            user: {
                ...user,
                account_status: (user.account_status === 'BLOCKED' || blacklistCheck.isBlacklisted) ? 'BLOCKED' : 'ACTIVE',
                block_reason: user.block_reason || blacklistCheck.reason || null
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/admin/users/:id/block
router.patch('/users/:id/block', async (req, res) => {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const adminId = req.admin?.id || 'admin_001';

    const cleanReason = reason ? reason.trim() : 'Fake Orders';

    try {
        let user = await supabaseDb.users.getById(id);
        if (!user) {
            user = { id, name: 'Student', email: '', phone: '', account_status: 'ACTIVE' };
        }

        const blRecord = await supabaseDb.blacklist.blockUser({
            userId: id,
            reason: cleanReason,
            notes: notes ? notes.trim() : '',
            blockedBy: adminId
        });

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            targetUserId: id,
            action: cleanReason.toLowerCase().includes('fake') ? 'USER_BLACKLISTED' : 'USER_BLOCKED',
            reason: cleanReason,
            metadata: { notes, targetUserName: user.name, targetEmail: user.email }
        });

        // Broadcast realtime disconnect / block signal
        try {
            if (typeof broadcastUserBlocked === 'function') {
                broadcastUserBlocked(id, cleanReason);
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            message: `User ${user.name || id} has been BLOCKED and added to blacklist.`,
            user: {
                ...user,
                account_status: 'BLOCKED',
                block_reason: cleanReason
            },
            user_id: id,
            account_status: 'BLOCKED',
            reason: cleanReason,
            blacklist_record: blRecord
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH /api/admin/users/:id/unblock
router.patch('/users/:id/unblock', async (req, res) => {
    const { id } = req.params;
    const adminId = req.admin?.id || 'admin_001';

    try {
        let user = await supabaseDb.users.getById(id);
        if (!user) {
            user = { id, name: 'Student', email: '', phone: '', account_status: 'BLOCKED' };
        }

        await supabaseDb.blacklist.unblockUser({
            userId: id,
            unblockedBy: adminId
        });

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            targetUserId: id,
            action: 'USER_UNBLOCKED',
            reason: 'Admin unblocked user'
        });

        res.json({
            success: true,
            message: `User ${user.name || id} has been unblocked.`,
            user: {
                ...user,
                account_status: 'ACTIVE',
                block_reason: null
            },
            user_id: id,
            account_status: 'ACTIVE'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/admin/blacklist
router.get('/blacklist', async (req, res) => {
    try {
        const list = await supabaseDb.blacklist.getAll();
        const search = (req.query.search || '').trim().toLowerCase();
        const reasonFilter = (req.query.reason || 'all').toLowerCase();

        let filtered = list;
        if (search) {
            filtered = filtered.filter(b => 
                (b.customer_name || '').toLowerCase().includes(search) ||
                (b.customer_email || '').toLowerCase().includes(search) ||
                (b.customer_phone || '').includes(search) ||
                (b.user_id || '').toLowerCase().includes(search)
            );
        }

        if (reasonFilter !== 'all') {
            filtered = filtered.filter(b => (b.reason || '').toLowerCase().includes(reasonFilter));
        }

        res.json({
            success: true,
            total: filtered.length,
            blacklist: filtered
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 3. PROFIT SECURITY & SENSITIVE FINANCIAL CONTROLS
// ============================================================

// GET /api/admin/profits
router.get('/profits', async (req, res) => {
    try {
        const isLocked = await supabaseDb.availability.getProfitVisibility();

        // STRICT FINANCIAL SECURITY: If locked, NEVER send profit numbers over the wire
        if (isLocked) {
            return res.json({
                locked: true,
                message: 'Profits visibility is currently LOCKED. Unlock from Admin Console to view.'
            });
        }

        // When UNLOCKED, calculate from delivered orders and products cost price
        const profitsData = await supabaseDb.profits.calculateDeliveredProfits();
        res.json({
            locked: false,
            ...profitsData
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/profit-visibility
router.post('/profit-visibility', async (req, res) => {
    const { locked } = req.body;
    const adminId = req.admin?.id || 'admin_001';

    if (locked === undefined) {
        return res.status(400).json({ error: 'locked boolean parameter is required' });
    }

    try {
        const isLocked = Boolean(locked);
        await supabaseDb.availability.setProfitVisibility(isLocked, adminId);

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            action: isLocked ? 'PROFIT_LOCKED' : 'PROFIT_UNLOCKED',
            reason: `Admin set profit visibility to ${isLocked ? 'LOCKED' : 'UNLOCKED'}`
        });

        res.json({
            success: true,
            profit_locked: isLocked,
            message: `Profit metrics are now ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 4. AUDIT LOGS
// ============================================================

// GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
    try {
        const logs = await supabaseDb.audit.getLogs(50);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

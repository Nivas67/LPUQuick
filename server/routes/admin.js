const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/adminAuth');
const { setSessionRevocationEpoch, staffUserCache } = require('../middleware/adminAuth');
const { broadcastClientLockUpdate, broadcastUserBlocked, broadcastUserUnblocked, broadcastAdvertisementsUpdate, broadcastHostelStatusChanged } = require('../realtime');
const { getRiderStatus, isRiderOnline, setRiderStatus } = require('../services/riderAvailability');
const cache = require('../cache');
const checkoutSettingsService = require('../services/checkoutSettingsService');
const financialEngine = require('../utils/financialEngine');

// All routes in this file require Administrator Authorization
router.use(requireAdmin);

// ============================================================
// OWNER-ONLY: OFFERS & CHARGES CONTROL
// ============================================================

// GET /api/admin/offers-charges (Owner Only)
router.get('/offers-charges', requireRole('owner'), async (req, res) => {
    try {
        const settings = await checkoutSettingsService.getSettings(true);
        res.json({
            success: true,
            settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/offers-charges (Owner Only)

// POST /api/admin/terminate-all-sessions (Owner Only: Terminate all active admin sessions across all devices)
router.post('/terminate-all-sessions', requireRole('owner'), async (req, res) => {
    try {
        const nowEpoch = Date.now();
        await setSessionRevocationEpoch(nowEpoch);

        // Generate fresh replacement token for the requesting Super Admin so their screen doesn't disconnect
        const newToken = generateAdminToken(req.admin.id, 'owner');

        try {
            if (supabaseDb.audit && typeof supabaseDb.audit.logAction === 'function') {
                await supabaseDb.audit.logAction({
                    adminId: req.admin.id,
                    action: 'TERMINATE_ALL_ADMIN_SESSIONS',
                    metadata: {
                        initiated_by: req.admin.email,
                        revocation_epoch: nowEpoch,
                        timestamp: new Date().toISOString()
                    }
                });

// ============================================================
// AUDIT LOGS & IP SECURITY CONTROL
// ============================================================

// GET /api/admin/audit-logs
router.get('/audit-logs', requireRole('owner', 'store_manager'), async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
        const actionFilter = req.query.action ? String(req.query.action).trim().toUpperCase() : null;
        const search = req.query.search ? String(req.query.search).trim().toLowerCase() : null;

        let logs = await supabaseDb.audit.getLogs(limit * 2);
        if (actionFilter && actionFilter !== 'ALL') {
            logs = logs.filter(l => (l.action || '').toUpperCase() === actionFilter);
        }
        if (search) {
            logs = logs.filter(l => {
                const act = (l.action || '').toLowerCase();
                const reason = (l.reason || '').toLowerCase();
                const admin = (l.admin_id || '').toLowerCase();
                const metaStr = l.metadata ? JSON.stringify(l.metadata).toLowerCase() : '';
                return act.includes(search) || reason.includes(search) || admin.includes(search) || metaStr.includes(search);
            });
        }

        res.json({
            success: true,
            count: logs.slice(0, limit).length,
            logs: logs.slice(0, limit)
        });
    } catch (err) {
        console.error('[Get Audit Logs Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/audit/page-view (Beacon for page/view loads)
router.post('/audit/page-view', async (req, res) => {
    try {
        const { view, title } = req.body || {};
        const clientIp = ipBlockService.extractClientIp(req);
        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'admin',
            action: 'PAGE_VIEW',
            reason: `Admin opened view: ${view || 'dashboard'}`,
            metadata: {
                ip: clientIp,
                view: view || 'dashboard',
                title: title || '',
                admin_name: req.admin?.name || null,
                admin_email: req.admin?.email || null,
                timestamp: new Date().toISOString()
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.json({ success: true, warning: err.message });
    }
});

// GET /api/admin/ip-blocks (List blocked IPs)
router.get('/ip-blocks', requireRole('owner', 'store_manager'), (req, res) => {
    try {
        const list = ipBlockService.getAllBlockedIps();
        res.json({
            success: true,
            count: list.length,
            blocked_ips: list
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/ip-block (Block an IP address)
router.post('/ip-block', requireRole('owner', 'store_manager'), async (req, res) => {
    try {
        const { ip, message = '', reason = 'Blocked by administrator' } = req.body || {};
        if (!ip || typeof ip !== 'string' || !ip.trim()) {
            return res.status(400).json({ success: false, error: 'Valid IP address is required' });
        }

        const entry = await ipBlockService.blockIp({
            ip: ip.trim(),
            message: message !== undefined ? String(message).trim() : '',
            reason: reason ? String(reason).trim() : 'Administrative Block',
            blocked_by: req.admin?.email || req.admin?.id || 'admin'
        });

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'admin',
            action: 'IP_BLOCKED',
            reason: `IP ${entry.ip} blocked: ${entry.reason}`,
            metadata: {
                ip: entry.ip,
                custom_message: entry.message,
                reason: entry.reason,
                blocked_by: entry.blocked_by,
                admin_name: req.admin?.name,
                admin_email: req.admin?.email
            }
        });

        res.json({
            success: true,
            message: `IP ${entry.ip} has been blocked successfully`,
            entry
        });
    } catch (err) {
        console.error('[Block IP Route Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/ip-block/:ip (Unblock an IP address)
router.delete('/ip-block/:ip', requireRole('owner', 'store_manager'), async (req, res) => {
    try {
        const { ip } = req.params;
        if (!ip) {
            return res.status(400).json({ success: false, error: 'Valid IP is required' });
        }

        const result = await ipBlockService.unblockIp(ip);

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'admin',
            action: 'IP_UNBLOCKED',
            reason: `IP ${ip} unblocked by administrator`,
            metadata: {
                unblocked_ip: ip,
                unblocked_by: req.admin?.email || req.admin?.id || 'admin',
                admin_name: req.admin?.name,
                admin_email: req.admin?.email
            }
        });

        res.json({
            success: true,
            message: `IP ${ip} has been unblocked`,
            result
        });
    } catch (err) {
        console.error('[Unblock IP Route Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

            }
        } catch (auditErr) {}

        res.json({
            success: true,
            message: 'All administrator sessions across all devices have been terminated.',
            revocation_epoch: nowEpoch,
            new_token: newToken
        });
    } catch (err) {
        console.error('[Terminate Sessions Route Error]:', err);
        res.status(500).json({ success: false, error: 'Failed to terminate administrator sessions.' });
    }
});

router.post('/offers-charges', requireRole('owner'), async (req, res) => {
    try {
        const updated = await checkoutSettingsService.updateSettings(req.body, req.admin);
        res.json({
            success: true,
            message: 'Offers & charges settings saved successfully',
            settings: updated
        });
    } catch (err) {
        const status = err.statusCode || 400;
        res.status(status).json({
            success: false,
            error: err.message,
            validationErrors: err.validationErrors || [err.message]
        });
    }
});

// GET /api/admin/verify (Cryptographic & Database-validated admin session verification)
router.get('/verify', (req, res) => {
    const { generateAdminToken } = require('../middleware/adminAuth');
    const freshToken = generateAdminToken(req.admin.id, req.admin.role);
    res.json({
        success: true,
        authenticated: true,
        token: freshToken,
        admin: {
            id: req.admin.id,
            name: req.admin.name,
            email: req.admin.email,
            role: req.admin.role,
            roles: req.admin.roles || [],
            is_owner: req.admin.is_owner || false,
            assigned_hostel_id: req.admin.assigned_hostel_id || null,
            assigned_hostels: req.admin.assigned_hostels || [],
            assigned_groups: req.admin.assigned_groups || []
        }
    });
});

// ============================================================
// 1. CLIENT DASHBOARD LOCK / STORE AVAILABILITY CONTROLS
// ============================================================

// GET /api/admin/client-lock
router.get('/client-lock', async (req, res) => {
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostel = req.admin?.assigned_hostel_id || null;

        let targetHostel = 'ALL';
        if (!isOwner && assignedHostel) {
            targetHostel = assignedHostel;
        } else if (req.query.hostel_id) {
            targetHostel = req.query.hostel_id;
        }

        const canonicalTarget = supabaseDb.availability._normalizeHostelId(targetHostel);
        const availability = await supabaseDb.availability.getStatus(canonicalTarget);
        
        // Multi-hostel overview is strictly for Platform Owner / Main Admin ("show for mee only")
        let allHostelLocks = null;
        if (isOwner) {
            allHostelLocks = await supabaseDb.availability.getAllHostelLocks();

            // Detect if any individual hostel was locked by a store manager
            if (canonicalTarget === 'ALL' && !availability.is_locked && allHostelLocks?.hostels) {
                const lockedHostels = allHostelLocks.hostels.filter(h => h.direct_lock && h.direct_lock.is_locked);
                if (lockedHostels.length > 0) {
                    availability.partial_locked = true;
                    availability.locked_hostels = lockedHostels.map(h => h.hostel_id);
                    availability.locked_hostel_names = lockedHostels.map(h => h.hostel_name || h.hostel_id);
                }
            }
        }

        res.json({
            success: true,
            is_owner: isOwner,
            assigned_hostel_id: assignedHostel,
            target_hostel: canonicalTarget,
            availability,
            all_hostel_locks: allHostelLocks
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/client-lock
router.post('/client-lock', async (req, res) => {
    const { lock_type, message, start_at, end_at, duration_minutes, hostel_id } = req.body;
    const adminId = req.admin?.id || 'admin_001';
    const isOwner = Boolean(req.admin && req.admin.is_owner);
    const assignedHostel = req.admin?.assigned_hostel_id || null;

    let targetHostel = 'ALL';
    if (!isOwner) {
        if (!assignedHostel) {
            return res.status(403).json({ success: false, error: 'Access denied: No hostel assigned to your account. Contact platform owner.' });
        }
        if (hostel_id && supabaseDb.availability._normalizeHostelId(hostel_id) !== supabaseDb.availability._normalizeHostelId(assignedHostel)) {
            return res.status(403).json({ success: false, error: `Access denied: You can only operate and change your assigned store (${assignedHostel}).` });
        }
        targetHostel = assignedHostel;
    } else {
        targetHostel = hostel_id || 'ALL';
    }

    const canonicalTarget = supabaseDb.availability._normalizeHostelId(targetHostel);

    try {
        let finalStart = start_at ? new Date(start_at).toISOString() : null;
        let finalEnd = end_at ? new Date(end_at).toISOString() : null;
        let finalType = lock_type || 'IMMEDIATE';
        let isLocked = true;

        if (finalType === 'DURATION' || (finalType === 'IMMEDIATE' && duration_minutes)) {
            const mins = parseInt(duration_minutes, 10) || (finalType === 'DURATION' ? 30 : null);
            if (mins && mins > 0) {
                const startNow = new Date();
                finalStart = startNow.toISOString();
                finalEnd = new Date(startNow.getTime() + (mins * 60 * 1000)).toISOString();
            }
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

        const adminName = req.admin?.name || (isOwner ? 'Nivas Naidu' : 'Store Manager');
        const adminRole = isOwner ? 'Main Admin' : (assignedHostel ? `${assignedHostel} Store Manager` : 'Store Manager');
        const adminDisplay = `${adminName} (${adminRole})`;

        const updated = await supabaseDb.availability.setLock({
            is_locked: isLocked,
            lock_type: finalType,
            message: message || null,
            start_at: finalStart,
            end_at: finalEnd,
            created_by: adminId,
            created_by_name: adminDisplay
        }, canonicalTarget);

        // Audit Logging
        const auditAction = finalType === 'SCHEDULED' ? 'CLIENT_LOCK_SCHEDULED' : (isLocked ? 'HOSTEL_CLOSED' : 'HOSTEL_LOCK_UPDATED');
        const reasonText = finalType === 'SCHEDULED'
            ? `Scheduled store lock for hostel: ${canonicalTarget}`
            : (isLocked ? `Closed hostel: ${canonicalTarget}${message ? ' (' + message + ')' : ''}` : `Updated lock for hostel: ${canonicalTarget}`);
        await supabaseDb.audit.logAction({
            adminId,
            action: auditAction,
            reason: reasonText,
            metadata: { target_hostel: canonicalTarget, lock_type: finalType, start_at: finalStart, end_at: finalEnd, locked_by: adminDisplay }
        });
        req._auditLogged = true;

        // Real-time broadcast to all storefront clients & admin dashboards
        let allHostelLocks = null;
        try {
            allHostelLocks = await supabaseDb.availability.getAllHostelLocks();
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate({ ...updated, target_hostel: canonicalTarget }, allHostelLocks);
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            target_hostel: canonicalTarget,
            message: isLocked ? `Storefront for ${canonicalTarget} has been locked.` : `Lock scheduled successfully for ${canonicalTarget}.`,
            availability: updated,
            all_hostel_locks: isOwner ? allHostelLocks : null
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/client-lock (Unlock store now)
router.delete('/client-lock', async (req, res) => {
    const adminId = req.admin?.id || 'admin_001';
    const isOwner = Boolean(req.admin && req.admin.is_owner);
    const assignedHostel = req.admin?.assigned_hostel_id || null;

    let targetHostel = 'ALL';
    if (!isOwner) {
        if (!assignedHostel) {
            return res.status(403).json({ success: false, error: 'Access denied: No hostel assigned to your account.' });
        }
        const requestedHostel = req.body?.hostel_id || req.query?.hostel_id;
        if (requestedHostel && supabaseDb.availability._normalizeHostelId(requestedHostel) !== supabaseDb.availability._normalizeHostelId(assignedHostel)) {
            return res.status(403).json({ success: false, error: `Access denied: You can only operate and change your assigned store (${assignedHostel}).` });
        }
        targetHostel = assignedHostel;
    } else {
        targetHostel = req.body?.hostel_id || req.query?.hostel_id || 'ALL';
    }

    try {
        const adminName = req.admin?.name || (isOwner ? 'Nivas Naidu' : 'Store Manager');
        const adminRole = isOwner ? 'Main Admin' : (assignedHostel ? `${assignedHostel} Store Manager` : 'Store Manager');
        const adminDisplay = `${adminName} (${adminRole})`;

        const canonicalTarget = supabaseDb.availability._normalizeHostelId(targetHostel);
        const updated = await supabaseDb.availability.unlock(adminId, canonicalTarget, adminDisplay);

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            action: 'HOSTEL_OPENED',
            reason: `Opened hostel: ${canonicalTarget} (${adminDisplay})`,
            metadata: { target_hostel: canonicalTarget, unlocked_by: adminDisplay }
        });
        req._auditLogged = true;

        // Real-time broadcast to all storefront clients & admin dashboards
        let allHostelLocks = null;
        try {
            allHostelLocks = await supabaseDb.availability.getAllHostelLocks();
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate({ ...updated, target_hostel: canonicalTarget }, allHostelLocks);
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            target_hostel: canonicalTarget,
            message: `Storefront for ${canonicalTarget} is now AVAILABLE.`,
            availability: updated,
            all_hostel_locks: isOwner ? allHostelLocks : null
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 2. USER BLOCKING & BLACKLIST MANAGEMENT
// ============================================================

// GET /api/admin/users (Customers list - Owner & Store Manager)
router.get('/users', requireRole('owner', 'store_manager'), async (req, res) => {
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

        // Broadcast realtime unblock signal to client storefronts
        try {
            if (typeof broadcastUserUnblocked === 'function') {
                broadcastUserUnblocked(id);
            }
        } catch (wsErr) {}


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
// 4. AUDIT LOGS
// ============================================================

// GET /api/admin/audit-logs
router.get('/audit-logs', requireRole('owner'), async (req, res) => {
    try {
        const logs = await supabaseDb.audit.getLogs(50);
        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 5. CUSTOMER PROFILE & COMPLETE ORDER HISTORY (OWNER & STORE MANAGER)
// ============================================================

// GET /api/admin/customers/:id/orders
router.get('/customers/:id/orders', async (req, res) => {
    const { id } = req.params;
    try {
        let user = await supabaseDb.users.getById(id);
        const orders = await supabaseDb.orders.getCustomerOrderHistory(id);

        if (!user) {
            if (orders.length > 0) {
                const latest = orders[0];
                user = {
                    id,
                    name: latest.customer_name || 'Campus Student',
                    email: latest.customer_email || '',
                    phone: latest.customer_phone || '',
                    dob: latest.delivery_address || 'Campus Hostels',
                    created_at: latest.created_at
                };
            } else {
                user = {
                    id,
                    name: 'Campus Student',
                    email: '',
                    phone: '',
                    dob: 'Campus Hostels',
                    created_at: new Date().toISOString()
                };
            }
        }

        const blacklistCheck = await supabaseDb.blacklist.isUserBlacklisted(id);

        let address = user.dob;
        let lastLogin = null;
        if (user.dob && typeof user.dob === 'string' && user.dob.startsWith('{')) {
            try {
                const meta = JSON.parse(user.dob);
                address = meta.address || null;
                lastLogin = meta.last_login || null;
            } catch (e) {}
        }

        const deliveredOrders = orders.filter(o => o.status === 'Delivered');
        const totalSpent = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const lastOrderDate = orders[0]?.created_at || null;

        res.json({
            success: true,
            customer: {
                id: user.id,
                name: user.name || 'Campus Student',
                email: user.email || '',
                phone: user.phone || 'Not provided',
                address: address || orders[0]?.delivery_address || 'Campus Resident',
                account_status: (user.account_status === 'BLOCKED' || blacklistCheck.isBlacklisted) ? 'BLOCKED' : 'ACTIVE',
                block_reason: user.block_reason || blacklistCheck.reason || null,
                created_at: user.created_at,
                last_login: lastLogin || lastOrderDate || user.created_at,
                last_order_date: lastOrderDate,
                total_orders: orders.length,
                order_count: orders.length,
                delivered_orders: deliveredOrders.length,
                total_spent: totalSpent
            },
            orders
        });
    } catch (err) {
        console.error('[Customer Orders Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 6. EMPLOYEES & STAFF OPERATIONS DIRECTORY
// ============================================================

// GET /api/admin/employees - Full employees directory with store hostels & delivery boy data (Owner Only)
router.get('/employees', requireRole('owner'), async (req, res) => {
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostelId = req.admin?.assigned_hostel_id || null;

        const staffList = await supabaseDb.staff.getAllStaff();
        const hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
        const orders = await supabaseDb.orders.getAllOrders();

        const todayStr = new Date().toISOString().slice(0, 10);
        const hostelMap = new Map();
        (hostels || []).forEach(h => hostelMap.set(h.id, h));

        const pricingConfig = typeof getDeliveryPricingSettings === 'function' ? getDeliveryPricingSettings() : { rate_per_order: 3.00 };
        const ratePerOrder = Number(pricingConfig?.rate_per_order) || 3.00;

        const employees = (Array.isArray(staffList) ? staffList : []).map(s => {
            const sNameLower = (s.name || '').toLowerCase().trim();

            const isDelivery = Boolean(
                (Array.isArray(s.roles) && s.roles.includes('delivery_person')) ||
                s.is_owner ||
                s.role === 'owner'
            );

            const managed = hostels.filter(h => h.manager_user_id === s.id);
            const assignedHostel = s.assigned_hostel_id ? hostelMap.get(s.assigned_hostel_id) : null;

            let completedDeliveries = 0;
            let todayDeliveries = 0;
            let activeDeliveries = 0;

            if (isDelivery) {
                orders.forEach(o => {
                    const meta = supabaseDb.orders.parseDeliveryMeta ? supabaseDb.orders.parseDeliveryMeta(o.rider_name) : {};
                    const oRiderLower = (o.rider_name || '').toLowerCase().trim();
                    const isMatched = (meta.assigned_to && meta.assigned_to === s.id) ||
                                     (sNameLower && oRiderLower && (oRiderLower === sNameLower || oRiderLower.includes(sNameLower)));
                    if (isMatched) {
                        const st = String(o.status || '').toLowerCase().trim();
                        if (['delivered', 'completed'].includes(st)) {
                            completedDeliveries++;
                            if ((o.created_at || '').slice(0, 10) === todayStr) {
                                todayDeliveries++;
                            }
                        } else if (['claimed', 'runner_assigned', 'picked_up', 'out_for_delivery'].includes(st)) {
                            activeDeliveries++;
                        }
                    }
                });
            }

            const riderDuty = getRiderStatus(s.id);
            const isDuty = riderDuty === 'Active' && s.account_status === 'ACTIVE';

            return {
                id: s.id,
                name: s.name,
                email: s.email,
                phone: s.phone || null,
                roles: Array.isArray(s.roles) ? s.roles : ['store_manager'],
                is_owner: Boolean(s.is_owner),
                account_status: s.account_status || 'ACTIVE',
                duty_status: isDuty ? 'ON_DUTY' : 'OFF_DUTY',
                is_on_duty: isDuty,
                assigned_hostel_id: s.assigned_hostel_id || null,
                assigned_hostels: Array.isArray(s.assigned_hostels) && s.assigned_hostels.length > 0 ? s.assigned_hostels : (s.assigned_hostel_id ? [s.assigned_hostel_id] : []),
                assigned_hostel_name: assignedHostel ? assignedHostel.name : (s.is_owner ? 'All Campus Hostels (Master)' : (s.assigned_hostel_id || 'General Operations')),
                managed_hostels: managed.map(h => ({ id: h.id, name: h.name, status: h.status })),
                last_login: s.last_login || null,
                created_at: s.created_at,
                is_delivery_boy: isDelivery,
                is_store_manager: Boolean((Array.isArray(s.roles) && s.roles.includes('store_manager')) || s.is_owner),
                is_inventory_manager: Boolean((Array.isArray(s.roles) && s.roles.includes('inventory_manager')) || s.is_owner),
                delivery_data: isDelivery ? {
                    total_deliveries: completedDeliveries,
                    total_earnings: completedDeliveries * ratePerOrder,
                    today_deliveries: todayDeliveries,
                    today_earnings: todayDeliveries * ratePerOrder,
                    active_deliveries: activeDeliveries,
                    duty_status: isDuty ? 'ON_DUTY' : 'OFF_DUTY',
                    rate_per_order: ratePerOrder
                } : null
            };
        });

        // ONLY registered staff managed by owner — no phantom order runners added
        const stats = {
            total_employees: employees.length,
            registered_staff: employees.length,
            store_managers: employees.filter(e => e.is_store_manager).length,
            delivery_boys: employees.filter(e => e.is_delivery_boy).length,
            inventory_managers: employees.filter(e => e.is_inventory_manager).length,
            hostels_covered: new Set(employees.flatMap(e => (Array.isArray(e.assigned_hostels) && e.assigned_hostels.length > 0) ? e.assigned_hostels : [e.assigned_hostel_id]).filter(Boolean)).size,
            active_on_duty: employees.filter(e => e.duty_status === 'ON_DUTY').length
        };

        res.json({
            success: true,
            employees: employees,
            registered_staff: employees,
            stats,
            is_owner: isOwner,
            assigned_hostel_id: assignedHostelId
        });
    } catch (err) {
        console.error('[Admin Employees Route Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/admin/staff (List all admin team members)
router.get('/staff', requireRole('owner'), async (req, res) => {
    try {
        const staff = await supabaseDb.staff.getAllStaff();
        const enrichedStaff = (staff || []).map(s => {
            const riderDuty = getRiderStatus(s.id);
            const isDuty = riderDuty === 'Active' && s.account_status === 'ACTIVE';
            return {
                ...s,
                duty_status: isDuty ? 'ON_DUTY' : 'OFF_DUTY',
                is_on_duty: isDuty
            };
        });
        res.json({ success: true, staff: enrichedStaff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/staff (Create a new admin team member)
router.post('/staff', requireRole('owner'), async (req, res) => {
    const { name, email, phone, password, roles, assigned_hostel_id, assigned_hostels, permissions, is_on_duty, duty_status, status } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const created = await supabaseDb.staff.createStaff({
            name,
            email,
            phone,
            password,
            roles: Array.isArray(roles) && roles.length > 0 ? roles : ['store_manager'],
            assigned_hostel_id: assigned_hostel_id || null,
            assigned_hostels: assigned_hostels || (assigned_hostel_id ? [assigned_hostel_id] : []),
            permissions: permissions || {}
        });

        if (created && created.id) {
            const shouldBeOnDuty = is_on_duty === true || duty_status === 'ON_DUTY' || status === 'Active';
            setRiderStatus(created.id, shouldBeOnDuty ? 'Active' : 'Offline');
        }

        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'STAFF_CREATED',
            metadata: { staffEmail: email, roles, assigned_hostel_id: assigned_hostel_id || null }
        });

        res.json({ success: true, message: 'Admin staff member created successfully', staff: created });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/admin/staff/:id (Update admin roles, status, or details)
router.put('/staff/:id', requireRole('owner'), async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await supabaseDb.staff.updateStaff(id, req.body);
        if (req.body.is_on_duty !== undefined || req.body.duty_status !== undefined || req.body.status !== undefined) {
            const shouldBeOnDuty = req.body.is_on_duty === true || req.body.duty_status === 'ON_DUTY' || req.body.status === 'Active';
            setRiderStatus(id, shouldBeOnDuty ? 'Active' : 'Offline');
        }
        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'STAFF_UPDATED',
            metadata: { targetId: id, updates: req.body }
        });
        res.json({ success: true, message: 'Staff member updated successfully', staff: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/admin/employees/:id/duty-status (Toggle On Duty / Off Duty for employee - Owner Only)
router.put('/employees/:id/duty-status', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const isOnDuty = req.body.is_on_duty === true || req.body.duty_status === 'ON_DUTY' || req.body.status === 'Active';
        const newStatus = isOnDuty ? 'Active' : 'Offline';
        setRiderStatus(id, newStatus);
        
        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'EMPLOYEE_DUTY_STATUS_CHANGED',
            metadata: { targetId: id, status: newStatus, is_on_duty: isOnDuty }
        });

        res.json({
            success: true,
            employee_id: id,
            duty_status: isOnDuty ? 'ON_DUTY' : 'OFF_DUTY',
            is_on_duty: isOnDuty,
            status: newStatus
        });
    } catch (err) {
        console.error('[Employee Duty Status Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/employees/:id/duty-status (Also accept POST)
router.post('/employees/:id/duty-status', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const isOnDuty = req.body.is_on_duty === true || req.body.duty_status === 'ON_DUTY' || req.body.status === 'Active';
        const newStatus = isOnDuty ? 'Active' : 'Offline';
        setRiderStatus(id, newStatus);

        res.json({
            success: true,
            employee_id: id,
            duty_status: isOnDuty ? 'ON_DUTY' : 'OFF_DUTY',
            is_on_duty: isOnDuty,
            status: newStatus
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/staff/:id (Deactivate / Remove admin)
router.delete('/staff/:id', requireRole('owner'), async (req, res) => {
    const { id } = req.params;
    try {
        await supabaseDb.staff.deleteStaff(id);
        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'STAFF_REMOVED',
            metadata: { targetId: id }
        });
        res.json({ success: true, message: 'Staff member removed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// ADVERTISEMENTS & PROMOTIONAL POSTERS (ADMIN PANEL)
// ============================================================
const BANNERS_DATA_FILE = path.join(__dirname, '..', 'data', 'banners.json');
let _bannersMemoryCache = null;
let _bannersLastFetch = 0;

async function savePosterImageIfBase64(imageUrl, posterId = 'poster') {
    if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
    if (!imageUrl.startsWith('data:image/')) return imageUrl;

    try {
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return imageUrl;

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';

        const fileName = `banner_${posterId}_${Date.now()}.${ext}`;

        // Save locally to public/uploads & client/uploads if available
        try {
            const pubUploads = path.join(__dirname, '..', '..', 'public', 'uploads');
            if (!fs.existsSync(pubUploads)) fs.mkdirSync(pubUploads, { recursive: true });
            fs.writeFileSync(path.join(pubUploads, fileName), buffer);

            const clientUploads = path.join(__dirname, '..', '..', 'client', 'uploads');
            if (fs.existsSync(clientUploads)) {
                fs.writeFileSync(path.join(clientUploads, fileName), buffer);
            }
        } catch (e) {}

        // Upload to Supabase Storage
        try {
            const { getSupabaseClient } = require('../supabase');
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.storage.createBucket('products', { public: true, fileSizeLimit: 5242880 }).catch(() => {});
                const { error: upErr } = await supabase.storage
                    .from('products')
                    .upload(fileName, buffer, { contentType: mimeType, upsert: true });

                if (!upErr) {
                    const { data: pubData } = supabase.storage.from('products').getPublicUrl(fileName);
                    if (pubData?.publicUrl) return pubData.publicUrl;
                }
            }
        } catch (sbErr) {}

        return `/uploads/${fileName}`;
    } catch (e) {
        return imageUrl;
    }
}

async function loadAdminBannersData(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _bannersMemoryCache && (now - _bannersLastFetch < 5000)) {
        return _bannersMemoryCache;
    }

    // 1. Authoritative persistence: Supabase app_availability table
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('app_availability')
                .select('message')
                .eq('id', 'banners_data')
                .maybeSingle();

            if (!error && data && data.message) {
                const parsed = JSON.parse(data.message);
                if (parsed && typeof parsed === 'object') {
                    if (!Array.isArray(parsed.banners)) parsed.banners = [];
                    if (!parsed.settings) parsed.settings = { autoplay_delay: 4500, autoplay_enabled: true };
                    _bannersMemoryCache = parsed;
                    _bannersLastFetch = now;
                    // Mirror to disk if possible
                    try {
                        fs.writeFileSync(BANNERS_DATA_FILE, JSON.stringify(parsed, null, 2), 'utf8');
                    } catch (e) {}
                    return parsed;
                }
            }
        }
    } catch (dbErr) {
        console.warn('[Admin Advertisements] Supabase read warning:', dbErr.message);
    }

    // 2. Fallback to local banners.json on disk
    try {
        if (fs.existsSync(BANNERS_DATA_FILE)) {
            const content = fs.readFileSync(BANNERS_DATA_FILE, 'utf8');
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed.banners)) parsed.banners = [];
            if (!parsed.settings) parsed.settings = { autoplay_delay: 4500, autoplay_enabled: true };
            _bannersMemoryCache = parsed;
            _bannersLastFetch = now;
            return parsed;
        }
    } catch (diskErr) {
        console.error('[Admin Advertisements] Error reading banners file:', diskErr);
    }

    const fallback = {
        banners: [],
        settings: { autoplay_delay: 4500, autoplay_enabled: true }
    };
    _bannersMemoryCache = fallback;
    _bannersLastFetch = now;
    return fallback;
}

async function saveAdminBannersData(data) {
    try {
        data.updated_at = new Date().toISOString();
        _bannersMemoryCache = data;
        _bannersLastFetch = Date.now();

        // 1. Authoritative: Supabase app_availability
        try {
            const { getSupabaseClient } = require('../supabase');
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase
                    .from('app_availability')
                    .upsert([{
                        id: 'banners_data',
                        is_locked: false,
                        lock_type: 'BANNERS_CONFIG',
                        message: JSON.stringify(data),
                        updated_at: data.updated_at
                    }]);
            }
        } catch (dbErr) {
            console.error('[Admin Advertisements] Supabase save error:', dbErr.message);
        }

        // 2. Local disk file persistence with /tmp resilience
        try {
            const dir = path.dirname(BANNERS_DATA_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(BANNERS_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (writeErr) {
            try {
                fs.writeFileSync(path.join('/tmp', 'banners.json'), JSON.stringify(data, null, 2), 'utf8');
            } catch (tmpErr) {}
        }

        return true;
    } catch (err) {
        console.error('[Admin Advertisements] Error saving banners data:', err);
        return false;
    }
}

// GET /api/admin/advertisements - Fetch all promotional posters & carousel settings (Owner Only)
router.get('/advertisements', requireRole('owner'), async (req, res) => {
    try {
        const data = await loadAdminBannersData();
        res.json({
            success: true,
            posters: data.banners || [],
            settings: data.settings || { autoplay_delay: 4500, autoplay_enabled: true }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/advertisements - Create or Update a promotional poster (Owner Only)
router.post('/advertisements', requireRole('owner'), async (req, res) => {
    try {
        let { id, type, poster_type, title, subtitle, badge, pill, link_url, link_text, image_url, is_full_poster, is_active, display_order, gradient, show_button } = req.body;
        
        const finalType = (type || poster_type) === 'store_announce' || is_full_poster || (image_url && !subtitle && !badge && !pill && (type !== 'campus_promotion'))
            ? 'store_announce'
            : 'campus_promotion';

        if (finalType === 'store_announce') {
            if (!image_url) {
                return res.status(400).json({ success: false, error: 'Poster graphic image is required for Store Announcement' });
            }
        } else {
            if (!title && !image_url) {
                return res.status(400).json({ success: false, error: 'Title is required for Campus Promotion' });
            }
        }

        // Convert base64 data URLs to permanent hosted image assets
        if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image/')) {
            image_url = await savePosterImageIfBase64(image_url, id || 'new');
        }

        const data = await loadAdminBannersData();
        const now = new Date().toISOString();

        const defaultTitle = finalType === 'store_announce' ? (title || 'Store Announcement') : (title || 'Campus Promotion');

        if (id) {
            // Update existing poster
            const index = data.banners.findIndex(b => b.id === id);
            if (index !== -1) {
                data.banners[index] = {
                    ...data.banners[index],
                    type: finalType,
                    poster_type: finalType,
                    title: title !== undefined ? title : (data.banners[index].title || defaultTitle),
                    subtitle: finalType === 'store_announce' ? '' : (subtitle !== undefined ? subtitle : (data.banners[index].subtitle || '')),
                    badge: finalType === 'store_announce' ? '' : (badge !== undefined ? badge : (data.banners[index].badge || '')),
                    pill: finalType === 'store_announce' ? '' : (pill !== undefined ? pill : (data.banners[index].pill || '')),
                    link_url: link_url !== undefined ? link_url : (data.banners[index].link_url || '#shop-catalog-section'),
                    link_text: link_text !== undefined ? link_text : (data.banners[index].link_text || 'Shop Now'),
                    show_button: show_button !== undefined ? Boolean(show_button) : (data.banners[index].show_button !== false),
                    image_url: image_url !== undefined ? image_url : (data.banners[index].image_url || ''),
                    is_full_poster: finalType === 'store_announce',
                    is_active: is_active !== undefined ? Boolean(is_active) : (data.banners[index].is_active !== false),
                    display_order: display_order !== undefined ? Number(display_order) : (data.banners[index].display_order || 1),
                    gradient: gradient || data.banners[index].gradient || 'emerald',
                    updated_at: now
                };
            } else {
                data.banners.push({
                    id,
                    type: finalType,
                    poster_type: finalType,
                    title: defaultTitle,
                    subtitle: finalType === 'store_announce' ? '' : (subtitle || ''),
                    badge: finalType === 'store_announce' ? '' : (badge || ''),
                    pill: finalType === 'store_announce' ? '' : (pill || ''),
                    link_url: link_url || '#shop-catalog-section',
                    link_text: link_text !== undefined ? link_text : 'Shop Now',
                    show_button: show_button !== undefined ? Boolean(show_button) : true,
                    image_url: image_url || '',
                    is_full_poster: finalType === 'store_announce',
                    is_active: is_active !== undefined ? Boolean(is_active) : true,
                    display_order: display_order !== undefined ? Number(display_order) : (data.banners.length + 1),
                    gradient: gradient || 'emerald',
                    created_at: now
                });
            }
        } else {
            // Create brand new poster
            const newId = `poster_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            data.banners.push({
                id: newId,
                type: finalType,
                poster_type: finalType,
                title: defaultTitle,
                subtitle: finalType === 'store_announce' ? '' : (subtitle || ''),
                badge: finalType === 'store_announce' ? '' : (badge || ''),
                pill: finalType === 'store_announce' ? '' : (pill || ''),
                link_url: link_url || '#shop-catalog-section',
                link_text: link_text !== undefined ? link_text : 'Shop Now',
                show_button: show_button !== undefined ? Boolean(show_button) : true,
                image_url: image_url || '',
                is_full_poster: finalType === 'store_announce',
                is_active: is_active !== undefined ? Boolean(is_active) : true,
                display_order: display_order !== undefined ? Number(display_order) : (data.banners.length + 1),
                gradient: gradient || 'emerald',
                created_at: now
            });
        }

        // Keep sorted by display order
        data.banners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        await saveAdminBannersData(data);
        try { broadcastAdvertisementsUpdate(data.banners, data.settings); } catch (e) {}

        res.json({
            success: true,
            message: 'Advertisement poster saved successfully',
            posters: data.banners,
            settings: data.settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/advertisements/reorder - Fast batch reorder of posters (Owner Only)
router.post('/advertisements/reorder', requireRole('owner'), async (req, res) => {
    try {
        const { ordered_ids } = req.body;
        if (!Array.isArray(ordered_ids)) {
            return res.status(400).json({ success: false, error: 'ordered_ids array required' });
        }

        const data = await loadAdminBannersData();
        const map = new Map(data.banners.map(b => [b.id, b]));

        const reordered = [];
        ordered_ids.forEach((id, index) => {
            if (map.has(id)) {
                const item = map.get(id);
                item.display_order = index + 1;
                reordered.push(item);
                map.delete(id);
            }
        });

        // Append any not explicitly listed
        for (const remaining of map.values()) {
            remaining.display_order = reordered.length + 1;
            reordered.push(remaining);
        }

        data.banners = reordered;
        await saveAdminBannersData(data);
        try { broadcastAdvertisementsUpdate(data.banners, data.settings); } catch (e) {}

        res.json({
            success: true,
            message: 'Posters reordered successfully',
            posters: data.banners,
            settings: data.settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/advertisements/:id - Remove a poster (Owner Only)
router.delete('/advertisements/:id', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const data = await loadAdminBannersData();
        const initialCount = data.banners.length;
        data.banners = data.banners.filter(b => b.id !== id);

        if (data.banners.length === initialCount) {
            return res.status(404).json({ success: false, error: 'Poster not found' });
        }

        await saveAdminBannersData(data);
        try { broadcastAdvertisementsUpdate(data.banners, data.settings); } catch (e) {}

        res.json({
            success: true,
            message: 'Advertisement poster removed successfully',
            posters: data.banners,
            settings: data.settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/advertisements/settings - Update carousel delay and autoplay (Owner Only)
router.post('/advertisements/settings', requireRole('owner'), async (req, res) => {
    try {
        const { autoplay_delay, autoplay_enabled } = req.body;
        const data = await loadAdminBannersData();

        if (autoplay_delay !== undefined) {
            const delayNum = Math.max(1000, Math.min(30000, Number(autoplay_delay) || 4500));
            data.settings.autoplay_delay = delayNum;
        }

        if (autoplay_enabled !== undefined) {
            data.settings.autoplay_enabled = Boolean(autoplay_enabled);
        }

        await saveAdminBannersData(data);
        try { broadcastAdvertisementsUpdate(data.banners, data.settings); } catch (e) {}

        res.json({
            success: true,
            message: 'Carousel sliding settings updated',
            settings: data.settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// 12. MULTI-HOSTEL MANAGEMENT SYSTEM (Main Admin & Store Managers)
// ============================================================

// GET /api/admin/hostels - List hostels (Owner sees all, Store Manager sees only assigned)
router.get('/hostels', async (req, res) => {
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostelId = req.admin?.assigned_hostel_id;

        let hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
        if (!isOwner) {
            if (assignedHostelId) {
                const normAssigned = assignedHostelId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                hostels = hostels.filter(h => h.id && h.id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === normAssigned);
            } else if (req.admin?.assigned_hostels && req.admin.assigned_hostels.length > 0) {
                const allowedSet = new Set(req.admin.assigned_hostels.map(x => x.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')));
                hostels = hostels.filter(h => h.id && allowedSet.has(h.id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')));
            } else {
                hostels = [];
            }
        }

        // Enrich with Manager profile info
        const enriched = await Promise.all(hostels.map(async (h) => {
            let managerName = 'Unassigned';
            let managerEmail = '';
            let managerPhone = '';

            if (h.manager_user_id) {
                try {
                    const u = await supabaseDb.users.getById(h.manager_user_id);
                    if (u) {
                        managerName = u.name || 'Store Manager';
                        managerEmail = u.email || '';
                        managerPhone = u.phone || '';
                    }
                } catch (e) {}
            }

            return {
                ...h,
                manager_name: managerName,
                manager_email: managerEmail,
                manager_phone: managerPhone
            };
        }));

        res.json({
            success: true,
            hostels: enriched,
            is_owner: isOwner,
            assigned_hostel_id: assignedHostelId || null
        });
    } catch (err) {
        console.error('[Admin Hostels Get Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});


// GET /api/admin/hostel-overview - Comprehensive 360° overview of selected hostel(s)

// POST /api/admin/revoke-all-sessions - Terminate all admin sessions immediately (Owner Only)
router.post('/revoke-all-sessions', requireRole('owner'), async (req, res) => {
    try {
        const newEpoch = Date.now();
        await setSessionRevocationEpoch(newEpoch);
        if (staffUserCache && typeof staffUserCache.clear === 'function') {
            staffUserCache.clear();
        }
        res.json({
            success: true,
            message: 'All administrator sessions have been successfully terminated. All admins must re-authenticate.',
            revocation_epoch: newEpoch
        });
    } catch (err) {
        console.error('[Revoke All Sessions Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/hostel-overview', requireRole('owner'), async (req, res) => {
    try {
        // Enforce Financial PIN unlock session (same PIN as Financial Intelligence)
        const financialToken = req.headers['x-financial-token'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
        const { verifyFinancialToken } = require('./financial');
        const finSession = verifyFinancialToken(financialToken);
        if (!finSession) {
            return res.json({
                success: true,
                locked: true,
                message: 'Selected Hostel Overview figures are protected by PIN security. Please unlock with your Financial PIN.'
            });
        }

        const isOwner = true;
        const assignedHostelId = null;

        let requestedHostelParam = req.query.hostel_id || req.query.hostel_ids || 'ALL';
        const range = (req.query.range || 'all').toLowerCase();
        const customStartDate = req.query.start_date || null;
        const customEndDate = req.query.end_date || null;

        // If not owner, strictly enforce assigned hostel
        if (!isOwner && assignedHostelId) {
            requestedHostelParam = assignedHostelId;
        }

        const allHostels = await supabaseDb.hostels.getAll({ includeInactive: true });
        const allOrders = await supabaseDb.orders.getAllOrders();
        const allProducts = await supabaseDb.products.getAll();
        const allStaff = await supabaseDb.staff.getAllStaff();
        const hostelLocks = await supabaseDb.availability.getAllHostelLocks();

        // Parse requested hostel IDs
        let selectedHostelIds = [];
        if (requestedHostelParam.toUpperCase() === 'ALL') {
            selectedHostelIds = allHostels.map(h => h.id);
        } else {
            selectedHostelIds = requestedHostelParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        }

        // Date range filtering helper
        const now = new Date();
        const isOrderInRange = (orderCreatedAt) => {
            if (!orderCreatedAt) return true;
            if (range === 'all') return true;
            const orderDate = new Date(orderCreatedAt);
            if (isNaN(orderDate.getTime())) return true;

            const orderDateIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(orderDate);
            const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);

            if (range === 'today') {
                return orderDateIST === todayIST;
            } else if (range === 'yesterday') {
                const yest = new Date(now.getTime() - 86400000);
                const yestIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yest);
                return orderDateIST === yestIST;
            } else if (range === '7days') {
                const diffTime = now.getTime() - orderDate.getTime();
                return diffTime <= 7 * 86400000;
            } else if (range === '30days') {
                const diffTime = now.getTime() - orderDate.getTime();
                return diffTime <= 30 * 86400000;
            } else if (range === 'custom') {
                if (customStartDate && orderDateIST < customStartDate) return false;
                if (customEndDate && orderDateIST > customEndDate) return false;
                return true;
            }
            return true;
        };

        // Normalize matching helper
        const isHostelMatch = (orderHostelId, targetHostelId) => {
            const h1 = supabaseDb.orders._normalizeHostelId(orderHostelId || '');
            const h2 = supabaseDb.orders._normalizeHostelId(targetHostelId || '');
            return h1 === h2;
        };

        // Filter orders for selected hostels and date range
        const matchedOrders = allOrders.filter(o => {
            if (!isOrderInRange(o.created_at)) return false;
            if (requestedHostelParam.toUpperCase() === 'ALL') return true;
            return selectedHostelIds.some(targetId => isHostelMatch(o.hostel_id, targetId));
        });

        // Split delivered vs non-delivered
        const deliveredOrders = matchedOrders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'delivered' || s === 'completed';
        });

        const activeOrders = matchedOrders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s !== 'delivered' && s !== 'completed' && s !== 'cancelled' && s !== 'canceled' && s !== 'rejected';
        });

        const cancelledOrders = matchedOrders.filter(o => {
            const s = (o.status || '').toLowerCase();
            return s === 'cancelled' || s === 'canceled' || s === 'rejected';
        });

        // Financial & profit computations
        const grossRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const subtotalSum = deliveredOrders.reduce((sum, o) => sum + Number(o.subtotal || o.total || 0), 0);
        const deliveryFeesSum = deliveredOrders.reduce((sum, o) => sum + Number(o.delivery_fee || 0), 0);
        const platformFeesSum = deliveredOrders.reduce((sum, o) => sum + Number(o.platform_fee || 0), 0);

        // Wholesale cost & profit calculations
        let totalCostOfGoods = 0;
        let foodRevenue = 0;
        let foodCost = 0;
        let foodOrdersCount = 0;
        const foodItemsSoldMap = {};
        const groceryItemsSoldMap = {};
        const roomFrequencyMap = {};
        const customerSet = new Set();
        const repeatCustomerSet = new Set();
        const customerOrderCounts = {};

        // Helper for identifying cooked food items (strictly items from food department / fresh kitchen)
        const isCookedFoodItem = (it) => {
            const name = (it.name || '').toLowerCase();
            const sub = (it.subcategory || '').toLowerCase();
            const cat = (it.category || '').toLowerCase();
            if (Boolean(it.is_food_product) || Boolean(it.is_cooked)) return true;
            if (cat === "quick's instant food" || cat === "quicks instant food" ||
                cat === "lpu quick food" || cat === "lpu food" || cat === "cooked food" ||
                (cat.includes('food') && !cat.includes('snack') && !cat.includes('beverage') && !cat.includes('baby'))) {
                return true;
            }
            if (sub === 'cooked meals' || sub === 'sandwiches & burgers' || 
                sub === 'hot snacks & fries' || sub === 'soups & bowls' || 
                (sub.includes('quick') && sub.includes('food'))) {
                return true;
            }
            if (name.includes('(cooked)') || name.includes('cooked fresh')) return true;
            return false;
        };

        deliveredOrders.forEach(o => {
            const items = o.items || o.order_items || [];
            let orderHasFood = false;

            if (o.customer_phone || o.user_id) {
                const custKey = o.customer_phone || o.user_id;
                customerSet.add(custKey);
                customerOrderCounts[custKey] = (customerOrderCounts[custKey] || 0) + 1;
                if (customerOrderCounts[custKey] > 1) {
                    repeatCustomerSet.add(custKey);
                }
            }

            // Extract room from address or room_number
            let room = o.room_number || null;
            if (!room && o.delivery_address) {
                const roomMatch = o.delivery_address.match(/room[:\s]*([A-Za-z0-9\-_]+)/i);
                if (roomMatch) room = roomMatch[1];
            }
            if (room) {
                const cleanRoom = room.trim().toUpperCase();
                roomFrequencyMap[cleanRoom] = (roomFrequencyMap[cleanRoom] || 0) + 1;
            }

            items.forEach(it => {
                const qty = Math.max(1, Number(it.quantity) || 1);
                const price = Number(it.price !== undefined ? it.price : (it.unit_price || 0)) || 0;
                const lineTotal = price * qty;

                // Lookup matching product in catalog for cost_price
                const prod = allProducts.find(p => p.id === it.product_id || p.id === it.id);
                const costPrice = Number(prod?.cost_price || prod?.cost || 0);
                const itemCost = costPrice > 0 ? (costPrice * qty) : Math.round(lineTotal * 0.72); // 28% estimated gross margin if cost not set
                totalCostOfGoods += itemCost;

                const isFood = isCookedFoodItem(it);
                if (isFood) {
                    orderHasFood = true;
                    foodRevenue += lineTotal;
                    foodCost += itemCost;
                    const itemName = it.name || prod?.name || 'Cooked Food';
                    if (!foodItemsSoldMap[itemName]) {
                        foodItemsSoldMap[itemName] = {
                            name: itemName,
                            quantity: 0,
                            revenue: 0,
                            image_url: it.image_url || prod?.image_url || null,
                            price: price,
                            is_veg: it.is_veg !== 0 && prod?.is_veg !== 0
                        };
                    }
                    foodItemsSoldMap[itemName].quantity += qty;
                    foodItemsSoldMap[itemName].revenue += lineTotal;
                } else {
                    const itemName = it.name || prod?.name || 'Supermarket Item';
                    if (!groceryItemsSoldMap[itemName]) {
                        groceryItemsSoldMap[itemName] = {
                            name: itemName,
                            quantity: 0,
                            revenue: 0,
                            image_url: it.image_url || prod?.image_url || null,
                            price: price
                        };
                    }
                    groceryItemsSoldMap[itemName].quantity += qty;
                    groceryItemsSoldMap[itemName].revenue += lineTotal;
                }
            });

            if (orderHasFood || o.cook_id || o.cook_name) {
                foodOrdersCount++;
            }
        });

        // In case an order had food tagged at root level but item details weren't parsed
        matchedOrders.forEach(o => {
            if (!financialEngine.isDelivered(o.status)) {
                const items = o.items || o.order_items || [];
                if (items.some(isCookedFoodItem) || o.cook_id) {
                    foodOrdersCount++;
                }
            }
        });

        const estimatedProfit = Math.max(0, grossRevenue - totalCostOfGoods);
        const profitMarginPct = grossRevenue > 0 ? Math.round((estimatedProfit / grossRevenue) * 1000) / 10 : 0;
        const foodProfit = Math.max(0, foodRevenue - foodCost);
        const foodProfitMarginPct = foodRevenue > 0 ? Math.round((foodProfit / foodRevenue) * 1000) / 10 : 0;
        const aov = deliveredOrders.length > 0 ? Math.round(grossRevenue / deliveredOrders.length) : 0;
        const deliverySuccessRate = matchedOrders.length > 0 ? Math.round((deliveredOrders.length / matchedOrders.length) * 1000) / 10 : 0;

        // Top food & grocery items
        const topFoodItems = Object.values(foodItemsSoldMap).sort((a, b) => b.quantity - a.quantity).slice(0, 8);
        const topGroceryItems = Object.values(groceryItemsSoldMap).sort((a, b) => b.quantity - a.quantity).slice(0, 8);

        // Top rooms
        const topRooms = Object.entries(roomFrequencyMap).map(([room, count]) => ({ room, count })).sort((a, b) => b.count - a.count).slice(0, 10);

        // Assigned cooks & duty status
        const cooks = allStaff.filter(s => {
            const roles = Array.isArray(s.roles) ? s.roles : [];
            const isCookRole = roles.includes('cook') || roles.includes('food_department') || roles.includes('food');
            if (!isCookRole && !s.is_owner) return false;
            if (requestedHostelParam.toUpperCase() === 'ALL') return true;
            return selectedHostelIds.some(targetId => isHostelMatch(s.assigned_hostel_id, targetId));
        }).map(c => {
            return {
                id: c.id,
                name: c.name || 'Cook',
                phone: c.phone || '',
                email: c.email || '',
                assigned_hostel_id: c.assigned_hostel_id,
                status: c.account_status || 'ACTIVE'
            };
        });

        // Inventory metrics for selected hostels
        let totalHostelProducts = 0;
        let inStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const criticalItems = [];

        // Aggregate dark store inventory
        for (const hId of selectedHostelIds) {
            try {
                const hostelInv = await supabaseDb.inventory.getHostelInventory(hId);
                allProducts.forEach(prod => {
                    const customStock = hostelInv[prod.id];
                    const stock = customStock !== undefined ? Number(customStock) : (Number(prod.stock_left) || 0);
                    totalHostelProducts++;
                    if (stock <= 0) {
                        outOfStockCount++;
                        if (criticalItems.length < 10) {
                            criticalItems.push({
                                id: prod.id,
                                name: prod.name,
                                stock: 0,
                                price: prod.price,
                                hostel_id: hId,
                                is_food: isCookedFoodItem(prod)
                            });
                        }
                    } else if (stock <= 4) {
                        lowStockCount++;
                        if (criticalItems.length < 10) {
                            criticalItems.push({
                                id: prod.id,
                                name: prod.name,
                                stock,
                                price: prod.price,
                                hostel_id: hId,
                                is_food: isCookedFoodItem(prod)
                            });
                        }
                    } else {
                        inStockCount++;
                    }
                });
            } catch (invErr) { }
        }

        // Store Lock status for the selected hostels
        const selectedHostelDetails = allHostels.filter(h => selectedHostelIds.includes(h.id)).map(h => {
            const lockRecord = hostelLocks?.[h.id] || hostelLocks?.[supabaseDb.orders._normalizeHostelId(h.id)] || null;
            const isLocked = lockRecord ? (lockRecord.lock_type === 'CLOSED' || lockRecord.lock_type === 'EMERGENCY_LOCK' || lockRecord.lock_type === 'SCHEDULED') : false;
            return {
                id: h.id,
                name: h.name,
                status: h.status,
                is_locked: isLocked,
                lock_type: lockRecord?.lock_type || 'OPEN',
                lock_message: lockRecord?.message || null,
                manager_user_id: h.manager_user_id
            };
        });

        // Per-hostel breakdown for comparison table
        const hostelsBreakdown = allHostels.map(h => {
            const hOrders = matchedOrders.filter(o => isHostelMatch(o.hostel_id, h.id));
            const hDelivered = hOrders.filter(o => {
                const s = (o.status || '').toLowerCase();
                return s === 'delivered' || s === 'completed';
            });
            const hRevenue = hDelivered.reduce((sum, o) => sum + Number(o.total || 0), 0);
            let hFoodOrders = 0;
            let hFoodRevenue = 0;
            hDelivered.forEach(o => {
                const itms = o.items || o.order_items || [];
                let hasF = false;
                itms.forEach(it => {
                    if (isCookedFoodItem(it)) {
                        hasF = true;
                        hFoodRevenue += (Number(it.price || it.unit_price || 0) * (Number(it.quantity) || 1));
                    }
                });
                if (hasF || o.cook_id) hFoodOrders++;
            });
            const hProfit = Math.round(hRevenue * 0.28);
            const lockRecord = hostelLocks?.[h.id] || hostelLocks?.[supabaseDb.orders._normalizeHostelId(h.id)] || null;
            const isLocked = lockRecord ? (lockRecord.lock_type === 'CLOSED' || lockRecord.lock_type === 'EMERGENCY_LOCK' || lockRecord.lock_type === 'SCHEDULED') : false;

            return {
                id: h.id,
                name: h.name,
                status: h.status,
                is_locked: isLocked,
                lock_type: lockRecord?.lock_type || 'OPEN',
                total_orders: hOrders.length,
                delivered_orders: hDelivered.length,
                revenue: hRevenue,
                formatted_revenue: `₹${Math.round(hRevenue).toLocaleString('en-IN')}`,
                estimated_profit: hProfit,
                formatted_profit: `₹${Math.round(hProfit).toLocaleString('en-IN')}`,
                food_orders: hFoodOrders,
                food_revenue: hFoodRevenue,
                formatted_food_revenue: `₹${Math.round(hFoodRevenue).toLocaleString('en-IN')}`,
                is_selected: selectedHostelIds.includes(h.id)
            };
        }).sort((a, b) => b.revenue - a.revenue);

        res.json({
            success: true,
            selected_hostels: selectedHostelIds,
            is_all_hostels: requestedHostelParam.toUpperCase() === 'ALL',
            range,
            summary: {
                total_revenue: grossRevenue,
                formatted_revenue: `₹${Math.round(grossRevenue).toLocaleString('en-IN')}`,
                subtotal: subtotalSum,
                delivery_fees: deliveryFeesSum,
                platform_fees: platformFeesSum,
                estimated_cost: totalCostOfGoods,
                estimated_profit: estimatedProfit,
                formatted_profit: `₹${Math.round(estimatedProfit).toLocaleString('en-IN')}`,
                profit_margin_pct: profitMarginPct,
                aov,
                formatted_aov: `₹${aov}`,
                total_orders: matchedOrders.length,
                delivered_orders: deliveredOrders.length,
                active_orders: activeOrders.length,
                cancelled_orders: cancelledOrders.length,
                delivery_success_rate: deliverySuccessRate,
                food: {
                    orders_count: foodOrdersCount,
                    revenue: foodRevenue,
                    formatted_revenue: `₹${Math.round(foodRevenue).toLocaleString('en-IN')}`,
                    estimated_profit: foodProfit,
                    formatted_profit: `₹${Math.round(foodProfit).toLocaleString('en-IN')}`,
                    profit_margin_pct: foodProfitMarginPct,
                    pct_of_total_revenue: grossRevenue > 0 ? Math.round((foodRevenue / grossRevenue) * 100) : 0,
                    top_items: topFoodItems,
                    assigned_cooks: cooks
                },
                grocery: {
                    top_items: topGroceryItems
                },
                inventory: {
                    total_products: totalHostelProducts,
                    in_stock_count: inStockCount,
                    low_stock_count: lowStockCount,
                    out_of_stock_count: outOfStockCount,
                    critical_items: criticalItems
                },
                customers: {
                    unique_customers_count: customerSet.size,
                    repeat_customers_count: repeatCustomerSet.size,
                    repeat_rate_pct: customerSet.size > 0 ? Math.round((repeatCustomerSet.size / customerSet.size) * 100) : 0,
                    top_rooms: topRooms
                },
                hostel_details: selectedHostelDetails,
                hostels_breakdown: hostelsBreakdown
            }
        });
    } catch (err) {
        console.error('[Admin Hostel Overview Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostels - Create new hostel (Owner Only)
router.post('/hostels', requireRole('owner'), async (req, res) => {
    try {
        const { id, name, status, blocks, manager_user_id } = req.body;
        if (!id || !name) {
            return res.status(400).json({ success: false, error: 'Hostel ID and Name are required (e.g. ID: BH-5, Name: BH-5 Boys Hostel)' });
        }

        const normalizedId = String(id).trim().toUpperCase();
        const created = await supabaseDb.hostels.create({
            id: normalizedId,
            name: String(name).trim(),
            status: status === 'OFF' ? 'OFF' : 'ACTIVE',
            blocks: blocks || undefined,
            manager_user_id: manager_user_id || null
        });

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_CREATED',
            reason: `Created hostel ${normalizedId}`,
            metadata: { id: normalizedId, name: created.name, status: created.status }
        });

        if (typeof broadcastHostelStatusChanged === 'function') {
            broadcastHostelStatusChanged(created);
        }

        res.json({ success: true, message: `Hostel ${normalizedId} created successfully`, hostel: created });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/admin/hostels/:id - Update hostel (Owner Only)
router.put('/hostels/:id', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, blocks } = req.body;

        const patch = {};
        if (name) patch.name = String(name).trim();
        if (status) patch.status = status === 'OFF' ? 'OFF' : 'ACTIVE';
        if (blocks !== undefined) patch.blocks = blocks;

        const updated = await supabaseDb.hostels.update(id, patch);

        if (typeof broadcastHostelStatusChanged === 'function') {
            broadcastHostelStatusChanged(updated);
        }

        res.json({ success: true, message: `Hostel ${id} updated`, hostel: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/hostels/:id - Remove hostel (Owner Only)
router.delete('/hostels/:id', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: 'Hostel ID is required' });
        }

        const existing = await supabaseDb.hostels.getById(id);
        const targetId = existing ? existing.id : id;

        await supabaseDb.hostels.delete(targetId);

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_DELETED',
            reason: `Removed hostel ${targetId}`,
            metadata: { id: targetId }
        });

        if (typeof broadcastHostelStatusChanged === 'function') {
            broadcastHostelStatusChanged({ id: targetId, status: 'DELETED', deleted: true });
        }

        res.json({ success: true, message: `Hostel ${targetId} removed successfully` });
    } catch (err) {
        console.error('[Admin Delete Hostel Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST or PUT /api/admin/hostels/:id/activate - Activate hostel (Owner Only)
const handleActivateHostel = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await supabaseDb.hostels.update(id, { status: 'ACTIVE' });
        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_OPENED',
            reason: `Opened hostel: ${id}`,
            metadata: { id, target_hostel: id }
        });
        req._auditLogged = true;
        if (typeof broadcastHostelStatusChanged === 'function') {
            broadcastHostelStatusChanged(updated);
        }
        res.json({ success: true, message: `Hostel ${id} is now ACTIVE`, hostel: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
router.post('/hostels/:id/activate', requireRole('owner'), handleActivateHostel);
router.put('/hostels/:id/activate', requireRole('owner'), handleActivateHostel);

// POST or PUT /api/admin/hostels/:id/deactivate - Turn hostel OFF (Owner Only)
// Customer orders will be blocked, but all data remains intact
const handleDeactivateHostel = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await supabaseDb.hostels.update(id, { status: 'OFF' });
        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_CLOSED',
            reason: `Closed hostel: ${id}`,
            metadata: { id, target_hostel: id }
        });
        req._auditLogged = true;
        if (typeof broadcastHostelStatusChanged === 'function') {
            broadcastHostelStatusChanged(updated);
        }
        res.json({ success: true, message: `Hostel ${id} turned OFF (orders disabled, all data preserved)`, hostel: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
router.post('/hostels/:id/deactivate', requireRole('owner'), handleDeactivateHostel);
router.put('/hostels/:id/deactivate', requireRole('owner'), handleDeactivateHostel);

// POST or PUT /api/admin/hostels/:id/assign-manager - Assign Store Manager to Hostel (Owner Only)
const handleAssignManager = async (req, res) => {
    try {
        const { id } = req.params;
        const manager_user_id = req.body.store_manager_id || req.body.manager_user_id;

        if (!manager_user_id) {
            return res.status(400).json({ success: false, error: 'manager_user_id is required' });
        }

        // Verify manager user exists
        const user = await supabaseDb.users.getById(manager_user_id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Manager user not found' });
        }

        const updated = await supabaseDb.hostels.assignManager(id, manager_user_id);

        // Synchronize in user metadata for fast multi-hostel authentication resolution
        try {
            let meta = {};
            if (user.dob && typeof user.dob === 'string' && user.dob.startsWith('{')) {
                meta = JSON.parse(user.dob);
            }
            meta.assigned_hostel_id = id;
            meta.assigned_hostels = [id];
            if (!meta.roles) meta.roles = ['store_manager'];
            else if (!meta.roles.includes('store_manager')) meta.roles.push('store_manager');

            const supabase = require('../supabase').getSupabaseClient();
            if (supabase) {
                await supabase.from('users').update({
                    dob: JSON.stringify(meta),
                    role: user.role === 'owner' ? 'owner' : 'admin'
                }).eq('id', manager_user_id);
            }
        } catch (mErr) {
            console.warn('[Manager Meta Sync Warning]:', mErr.message);
        }

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_MANAGER_ASSIGNED',
            reason: `Assigned manager ${user.name} (${manager_user_id}) to ${id}`,
            metadata: { hostel_id: id, manager_user_id }
        });

        res.json({
            success: true,
            message: `Assigned ${user.name} as Store Manager for ${id}`,
            hostel: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
router.post('/hostels/:id/assign-manager', requireRole('owner'), handleAssignManager);
router.put('/hostels/:id/assign-manager', requireRole('owner'), handleAssignManager);

// POST or PUT /api/admin/hostels/:id/remove-manager - Remove Store Manager from Hostel (Owner Only)
const handleRemoveManager = async (req, res) => {
    try {
        const { id } = req.params;
        const hostel = await supabaseDb.hostels.getById(id);
        const previousManagerId = hostel?.manager_user_id;

        const updated = await supabaseDb.hostels.removeManager(id);

        if (previousManagerId) {
            try {
                const u = await supabaseDb.users.getById(previousManagerId);
                if (u && u.dob && typeof u.dob === 'string' && u.dob.startsWith('{')) {
                    const meta = JSON.parse(u.dob);
                    if (Array.isArray(meta.assigned_hostels)) {
                        meta.assigned_hostels = meta.assigned_hostels.filter(h => h !== id);
                        meta.assigned_hostel_id = meta.assigned_hostels[0] || null;
                    } else if (meta.assigned_hostel_id === id) {
                        delete meta.assigned_hostel_id;
                    }
                    const supabase = require('../supabase').getSupabaseClient();
                    if (supabase) {
                        await supabase.from('users').update({ dob: JSON.stringify(meta) }).eq('id', previousManagerId);
                    }
                }
            } catch (e) {}
        }

        await supabaseDb.audit.logAction({
            adminId: req.admin?.id || 'owner',
            action: 'HOSTEL_MANAGER_REMOVED',
            reason: `Removed store manager from ${id}`,
            metadata: { hostel_id: id }
        });

        res.json({ success: true, message: `Removed store manager from ${id}`, hostel: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
router.post('/hostels/:id/remove-manager', requireRole('owner'), handleRemoveManager);
router.put('/hostels/:id/remove-manager', requireRole('owner'), handleRemoveManager);

module.exports = router;


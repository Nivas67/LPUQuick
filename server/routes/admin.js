const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/adminAuth');
const { broadcastClientLockUpdate, broadcastUserBlocked, broadcastUserUnblocked, broadcastAdvertisementsUpdate } = require('../realtime');
const cache = require('../cache');

// All routes in this file require Administrator Authorization
router.use(requireAdmin);

// GET /api/admin/verify (Cryptographic & Database-validated admin session verification)
router.get('/verify', (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        admin: {
            id: req.admin.id,
            name: req.admin.name,
            email: req.admin.email,
            role: req.admin.role,
            roles: req.admin.roles || [],
            is_owner: req.admin.is_owner || false
        }
    });
});

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

        if (finalType === 'DURATION' || (finalType === 'IMMEDIATE' && duration_minutes)) {
            const mins = parseInt(duration_minutes, 10) || (finalType === 'DURATION' ? 30 : null);
            if (mins && mins > 0) {
                const startNow = new Date();
                finalStart = startNow.toISOString();
                finalEnd = new Date(startNow.getTime() + (mins * 60 * 1000)).toISOString();
            }
            isLocked = true;
        }
 else if (finalType === 'SCHEDULED') {
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
// 6. STAFF & ADMIN TEAM MANAGEMENT (OWNER ONLY)
// ============================================================

// GET /api/admin/staff (List all admin team members)
router.get('/staff', requireRole('owner'), async (req, res) => {
    try {
        const staff = await supabaseDb.staff.getAllStaff();
        res.json({ success: true, staff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/staff (Create a new admin team member)
router.post('/staff', requireRole('owner'), async (req, res) => {
    const { name, email, phone, password, roles } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    try {
        const created = await supabaseDb.staff.createStaff({
            name,
            email,
            phone,
            password,
            roles: Array.isArray(roles) && roles.length > 0 ? roles : ['store_manager']
        });

        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'STAFF_CREATED',
            metadata: { staffEmail: email, roles }
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

function loadAdminBannersData() {
    try {
        if (!fs.existsSync(BANNERS_DATA_FILE)) {
            return {
                banners: [],
                settings: { autoplay_delay: 4500, autoplay_enabled: true }
            };
        }
        const content = fs.readFileSync(BANNERS_DATA_FILE, 'utf8');
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed.banners)) parsed.banners = [];
        if (!parsed.settings) parsed.settings = { autoplay_delay: 4500, autoplay_enabled: true };
        return parsed;
    } catch (err) {
        console.error('[Admin Advertisements] Error reading banners data:', err);
        return {
            banners: [],
            settings: { autoplay_delay: 4500, autoplay_enabled: true }
        };
    }
}

function saveAdminBannersData(data) {
    try {
        data.updated_at = new Date().toISOString();
        fs.writeFileSync(BANNERS_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('[Admin Advertisements] Error saving banners data:', err);
        return false;
    }
}

// GET /api/admin/advertisements - Fetch all promotional posters & carousel settings
router.get('/advertisements', (req, res) => {
    try {
        const data = loadAdminBannersData();
        res.json({
            success: true,
            posters: data.banners || [],
            settings: data.settings || { autoplay_delay: 4500, autoplay_enabled: true }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/advertisements - Create or Update a promotional poster
router.post('/advertisements', requireRole('owner,store_manager'), (req, res) => {
    try {
        const { id, title, subtitle, badge, pill, link_url, link_text, image_url, is_full_poster, is_active, display_order, gradient } = req.body;
        
        if (!image_url && !title) {
            return res.status(400).json({ success: false, error: 'Poster image or title is required' });
        }

        const data = loadAdminBannersData();
        const now = new Date().toISOString();

        if (id) {
            // Update existing poster
            const index = data.banners.findIndex(b => b.id === id);
            if (index !== -1) {
                data.banners[index] = {
                    ...data.banners[index],
                    title: title !== undefined ? title : data.banners[index].title || '',
                    subtitle: subtitle !== undefined ? subtitle : data.banners[index].subtitle || '',
                    badge: badge !== undefined ? badge : data.banners[index].badge || '',
                    pill: pill !== undefined ? pill : data.banners[index].pill || '',
                    link_url: link_url !== undefined ? link_url : data.banners[index].link_url || '#shop-catalog-section',
                    link_text: link_text !== undefined ? link_text : data.banners[index].link_text || 'Shop Now',
                    image_url: image_url !== undefined ? image_url : data.banners[index].image_url || '',
                    is_full_poster: is_full_poster !== undefined ? Boolean(is_full_poster) : (data.banners[index].is_full_poster || false),
                    is_active: is_active !== undefined ? Boolean(is_active) : (data.banners[index].is_active !== false),
                    display_order: display_order !== undefined ? Number(display_order) : (data.banners[index].display_order || 1),
                    gradient: gradient || data.banners[index].gradient || 'emerald',
                    updated_at: now
                };
            } else {
                data.banners.push({
                    id,
                    title: title || 'Campus Promotion',
                    subtitle: subtitle || '',
                    badge: badge || '⚡ SPECIAL PERK',
                    pill: pill || 'CAMPUS DEALS',
                    link_url: link_url || '#shop-catalog-section',
                    link_text: link_text || 'Shop Now',
                    image_url: image_url || '',
                    is_full_poster: Boolean(is_full_poster),
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
                title: title || 'Campus Promotion',
                subtitle: subtitle || '',
                badge: badge || '⚡ SPECIAL PERK',
                pill: pill || 'CAMPUS DEALS',
                link_url: link_url || '#shop-catalog-section',
                link_text: link_text || 'Shop Now',
                image_url: image_url || '',
                is_full_poster: Boolean(is_full_poster),
                is_active: is_active !== undefined ? Boolean(is_active) : true,
                display_order: display_order !== undefined ? Number(display_order) : (data.banners.length + 1),
                gradient: gradient || 'emerald',
                created_at: now
            });
        }

        // Keep sorted by display order
        data.banners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        saveAdminBannersData(data);
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

// POST /api/admin/advertisements/reorder - Fast batch reorder of posters
router.post('/advertisements/reorder', requireRole('owner,store_manager'), (req, res) => {
    try {
        const { ordered_ids } = req.body;
        if (!Array.isArray(ordered_ids)) {
            return res.status(400).json({ success: false, error: 'ordered_ids array required' });
        }

        const data = loadAdminBannersData();
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
        saveAdminBannersData(data);
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

// DELETE /api/admin/advertisements/:id - Remove a poster
router.delete('/advertisements/:id', requireRole('owner,store_manager'), (req, res) => {
    try {
        const { id } = req.params;
        const data = loadAdminBannersData();
        const initialCount = data.banners.length;
        data.banners = data.banners.filter(b => b.id !== id);

        if (data.banners.length === initialCount) {
            return res.status(404).json({ success: false, error: 'Poster not found' });
        }

        saveAdminBannersData(data);
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

// POST /api/admin/advertisements/settings - Update carousel delay and autoplay
router.post('/advertisements/settings', requireRole('owner,store_manager'), (req, res) => {
    try {
        const { autoplay_delay, autoplay_enabled } = req.body;
        const data = loadAdminBannersData();

        if (autoplay_delay !== undefined) {
            const delayNum = Math.max(1000, Math.min(30000, Number(autoplay_delay) || 4500));
            data.settings.autoplay_delay = delayNum;
        }

        if (autoplay_enabled !== undefined) {
            data.settings.autoplay_enabled = Boolean(autoplay_enabled);
        }

        saveAdminBannersData(data);
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

module.exports = router;

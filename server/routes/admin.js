const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/adminAuth');
const { broadcastClientLockUpdate, broadcastUserBlocked, broadcastUserUnblocked, broadcastAdvertisementsUpdate, broadcastHostelStatusChanged } = require('../realtime');
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
            is_owner: req.admin.is_owner || false,
            assigned_hostel_id: req.admin.assigned_hostel_id || null
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
        const availability = await supabaseDb.availability.getHostelStatusDirect(canonicalTarget);
        let allHostelLocks = null;
        if (isOwner) {
            allHostelLocks = await supabaseDb.availability.getAllHostelLocks();
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

        const updated = await supabaseDb.availability.setLock({
            is_locked: isLocked,
            lock_type: finalType,
            message: message || null,
            start_at: finalStart,
            end_at: finalEnd,
            created_by: adminId
        }, canonicalTarget);

        // Audit Logging
        const auditAction = finalType === 'SCHEDULED' ? 'CLIENT_LOCK_SCHEDULED' : (isLocked ? 'CLIENT_LOCK_ENABLED' : 'CLIENT_LOCK_UPDATED');
        await supabaseDb.audit.logAction({
            adminId,
            action: auditAction,
            reason: message || `Store lock applied for ${canonicalTarget}`,
            metadata: { target_hostel: canonicalTarget, lock_type: finalType, start_at: finalStart, end_at: finalEnd }
        });

        // Real-time broadcast to all storefront clients
        try {
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate({ ...updated, target_hostel: canonicalTarget });
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            target_hostel: canonicalTarget,
            message: isLocked ? `Storefront for ${canonicalTarget} has been locked.` : `Lock scheduled successfully for ${canonicalTarget}.`,
            availability: updated
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
        targetHostel = assignedHostel;
    } else {
        targetHostel = req.body?.hostel_id || req.query?.hostel_id || 'ALL';
    }

    try {
        const canonicalTarget = supabaseDb.availability._normalizeHostelId(targetHostel);
        const updated = await supabaseDb.availability.unlock(adminId, canonicalTarget);

        // Audit Logging
        await supabaseDb.audit.logAction({
            adminId,
            action: 'CLIENT_LOCK_DISABLED',
            reason: `Admin manually unlocked ${canonicalTarget}`
        });

        // Real-time broadcast to all storefront clients
        try {
            if (typeof broadcastClientLockUpdate === 'function') {
                broadcastClientLockUpdate({ ...updated, target_hostel: canonicalTarget });
            }
        } catch (wsErr) {}

        res.json({
            success: true,
            target_hostel: canonicalTarget,
            message: `Storefront for ${canonicalTarget} is now AVAILABLE.`,
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
                s.id === 'user_admin_bh13'
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

            return {
                id: s.id,
                name: s.name,
                email: s.email,
                phone: s.phone || null,
                roles: Array.isArray(s.roles) ? s.roles : ['store_manager'],
                is_owner: Boolean(s.is_owner),
                account_status: s.account_status || 'ACTIVE',
                assigned_hostel_id: s.assigned_hostel_id || null,
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
                    duty_status: s.account_status === 'ACTIVE' ? 'ON_DUTY' : 'OFF_DUTY',
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
            hostels_covered: new Set(employees.map(e => e.assigned_hostel_id).filter(Boolean)).size,
            active_on_duty: employees.filter(e => e.delivery_data?.duty_status === 'ON_DUTY').length
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
        res.json({ success: true, staff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/staff (Create a new admin team member)
router.post('/staff', requireRole('owner'), async (req, res) => {
    const { name, email, phone, password, roles, assigned_hostel_id } = req.body;
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
            assigned_hostel_id: assigned_hostel_id || null
        });

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

// ============================================================
// 12. MULTI-HOSTEL MANAGEMENT SYSTEM (Main Admin & Store Managers)
// ============================================================

// GET /api/admin/hostels - List hostels (Owner sees all, Store Manager sees only assigned)
router.get('/hostels', async (req, res) => {
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostelId = req.admin?.assigned_hostel_id;

        let hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
        if (!isOwner && assignedHostelId) {
            hostels = hostels.filter(h => h.id === assignedHostelId);
        } else if (!isOwner && !assignedHostelId) {
            hostels = [];
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

// POST /api/admin/hostels - Create new hostel (Owner Only)
router.post('/hostels', requireRole('owner'), async (req, res) => {
    try {
        const { id, name, status, manager_user_id } = req.body;
        if (!id || !name) {
            return res.status(400).json({ success: false, error: 'Hostel ID and Name are required (e.g. ID: BH-5, Name: BH-5 Boys Hostel)' });
        }

        const normalizedId = String(id).trim().toUpperCase();
        const created = await supabaseDb.hostels.create({
            id: normalizedId,
            name: String(name).trim(),
            status: status === 'OFF' ? 'OFF' : 'ACTIVE',
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
        const { name, status } = req.body;

        const patch = {};
        if (name) patch.name = String(name).trim();
        if (status) patch.status = status === 'OFF' ? 'OFF' : 'ACTIVE';

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
            action: 'HOSTEL_ACTIVATED',
            reason: `Activated hostel ${id}`,
            metadata: { id }
        });
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
            action: 'HOSTEL_DEACTIVATED',
            reason: `Turned hostel ${id} OFF`,
            metadata: { id }
        });
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
                    delete meta.assigned_hostel_id;
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


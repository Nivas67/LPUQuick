const express = require('express');
const router = express.Router();
const { requireAdmin, requireRole } = require('../middleware/adminAuth');
const hostelGroupService = require('../services/hostelGroupService');
const supabaseDb = require('../db/supabaseDb');

// Helper to get all hostels list with normalized key mapping
async function getHostelsMap() {
    try {
        const list = await supabaseDb.hostels.getAll({ includeInactive: true });
        const map = new Map();
        (list || []).forEach(h => {
            map.set(h.id, h);
            const clean = String(h.id).toUpperCase().replace(/[^A-Z0-9]/g, '');
            map.set(clean, h);
        });
        return map;
    } catch (e) {
        return new Map();
    }
}

// Helper to get staff map with normalized key mapping
async function getStaffMap() {
    try {
        const staff = await supabaseDb.staff.getAll();
        const map = new Map();
        (staff || []).forEach(s => {
            map.set(s.id, { id: s.id, name: s.name, email: s.email, phone: s.phone, roles: s.roles });
            const clean = String(s.id).toLowerCase();
            map.set(clean, { id: s.id, name: s.name, email: s.email, phone: s.phone, roles: s.roles });
        });
        return map;
    } catch (e) {
        return new Map();
    }
}

// GET /api/admin/hostel-groups/my-scope
// Returns the currently logged in admin's scope: assigned hostels & groups
router.get('/my-scope', requireAdmin, async (req, res) => {
    try {
        const user = req.admin;
        const isOwner = Boolean(user.is_owner || (Array.isArray(user.roles) && user.roles.includes('owner')) || user.role === 'owner');

        let assignedHostels = [];
        let assignedGroups = [];

        if (isOwner) {
            const allHostels = await supabaseDb.hostels.getAll({ includeInactive: true });
            assignedHostels = (allHostels || []).map(h => h.id);
            assignedGroups = await hostelGroupService.getGroups();
        } else {
            assignedHostels = user.assigned_hostels || [];
            assignedGroups = user.assigned_groups || [];
        }

        res.json({
            success: true,
            is_owner: isOwner,
            assigned_hostel_id: user.assigned_hostel_id || null,
            assigned_hostels: assignedHostels,
            assigned_groups: assignedGroups
        });
    } catch (err) {
        console.error('[Hostel Groups Scope Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to resolve admin scope' });
    }
});

// GET /api/admin/hostel-groups
// List all hostel groups (Super Admin sees all, Store Manager sees assigned)
router.get('/', requireAdmin, async (req, res) => {
    try {
        const user = req.admin;
        const isOwner = Boolean(user.is_owner || (Array.isArray(user.roles) && user.roles.includes('owner')) || user.role === 'owner');

        let groups = [];
        if (isOwner) {
            groups = await hostelGroupService.getGroups();
        } else {
            groups = hostelGroupService.getAdminAssignedGroups(user.id);
        }

        const [hostelsMap, staffMap] = await Promise.all([
            getHostelsMap(),
            getStaffMap()
        ]);

        // Enrich with member hostel details & staff details
        const enriched = groups.map(g => {
            const memberDetails = (g.hostel_ids || []).map(hId => {
                const clean = String(hId).toUpperCase().replace(/[^A-Z0-9]/g, '');
                const h = hostelsMap.get(hId) || hostelsMap.get(clean);
                return {
                    id: hId,
                    name: h ? (h.name || h.id) : hId,
                    status: h ? h.status : 'ACTIVE'
                };
            });

            const adminDetails = (g.admin_ids || []).map(aId => {
                const clean = String(aId).toLowerCase();
                const s = staffMap.get(aId) || staffMap.get(clean);
                return {
                    id: aId,
                    name: s ? (s.name || s.id) : aId,
                    email: s ? s.email : '',
                    roles: s ? s.roles : []
                };
            });

            return {
                ...g,
                member_hostels: memberDetails,
                assigned_admins: adminDetails
            };
        });

        res.json({ success: true, groups: enriched });
    } catch (err) {
        console.error('[Get Hostel Groups Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to fetch hostel groups' });
    }
});

// GET /api/admin/hostel-groups/:id
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const group = await hostelGroupService.getGroupById(req.params.id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const isOwner = Boolean(req.admin && req.admin.is_owner);
        if (!isOwner && !(group.admin_ids || []).includes(req.admin.id)) {
            return res.status(403).json({ success: false, error: 'Access denied to this hostel group' });
        }

        const [hostelsMap, staffMap] = await Promise.all([
            getHostelsMap(),
            getStaffMap()
        ]);

        const memberDetails = (group.hostel_ids || []).map(hId => {
            const clean = String(hId).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const h = hostelsMap.get(hId) || hostelsMap.get(clean);
            return { id: hId, name: h ? (h.name || h.id) : hId, status: h ? h.status : 'ACTIVE' };
        });

        const adminDetails = (group.admin_ids || []).map(aId => {
            const clean = String(aId).toLowerCase();
            const s = staffMap.get(aId) || staffMap.get(clean);
            return { id: aId, name: s ? (s.name || s.id) : aId, email: s ? s.email : '', roles: s ? s.roles : [] };
        });

        res.json({
            success: true,
            group: {
                ...group,
                member_hostels: memberDetails,
                assigned_admins: adminDetails
            }
        });
    } catch (err) {
        console.error('[Get Single Group Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostel-groups (Owner only)
// Create a new hostel group
router.post('/', requireRole('owner'), async (req, res) => {
    try {
        const { name, code, description, inventory_mode, status, hostel_ids, admin_ids } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Group name is required' });

        const created = await hostelGroupService.createGroup({
            name,
            code,
            description,
            inventory_mode: inventory_mode || 'shared',
            status: status || 'active',
            hostel_ids: Array.isArray(hostel_ids) ? hostel_ids : [],
            admin_ids: Array.isArray(admin_ids) ? admin_ids : []
        });

        res.status(201).json({
            success: true,
            message: `Hostel Group "${created.name}" created successfully.`,
            group: created
        });
    } catch (err) {
        console.error('[Create Hostel Group Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// PUT /api/admin/hostel-groups/:id (Owner only)
// Update group details, mode, or members
router.put('/:id', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updated = await hostelGroupService.updateGroup(id, updates);
        res.json({
            success: true,
            message: `Hostel Group "${updated.name}" updated successfully.`,
            group: updated
        });
    } catch (err) {
        console.error('[Update Hostel Group Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostel-groups/:id/toggle-mode (Owner only)
// 1-click toggle between Shared and Independent inventory mode
router.post('/:id/toggle-mode', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const group = await hostelGroupService.getGroupById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const newMode = group.inventory_mode === 'shared' ? 'independent' : 'shared';
        const updated = await hostelGroupService.updateGroup(id, { inventory_mode: newMode });

        res.json({
            success: true,
            message: `Inventory mode for "${updated.name}" changed to ${newMode === 'shared' ? 'Shared Inventory' : 'Independent Inventory'}.`,
            inventory_mode: updated.inventory_mode,
            group: updated
        });
    } catch (err) {
        console.error('[Toggle Group Mode Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostel-groups/:id/toggle-status (Owner only)
// 1-click toggle between Active and Inactive
router.post('/:id/toggle-status', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const group = await hostelGroupService.getGroupById(id);
        if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

        const newStatus = group.status === 'active' ? 'inactive' : 'active';
        const updated = await hostelGroupService.updateGroup(id, { status: newStatus, is_active: newStatus === 'active' });

        res.json({
            success: true,
            message: `Hostel group "${updated.name}" is now ${newStatus.toUpperCase()}.`,
            status: updated.status,
            group: updated
        });
    } catch (err) {
        console.error('[Toggle Group Status Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// DELETE /api/admin/hostel-groups/:id (Owner only)
// Delete a hostel group
router.delete('/:id', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await hostelGroupService.deleteGroup(id);
        res.json({
            success: true,
            message: `Hostel Group "${deleted.name}" deleted successfully. Hostels have reverted to independent mode.`,
            group: deleted
        });
    } catch (err) {
        console.error('[Delete Hostel Group Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostel-groups/:id/members (Owner only)
// Add or remove a hostel from a group
router.post('/:id/members', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { action, hostel_id } = req.body; // action: 'add' | 'remove'
        if (!hostel_id) return res.status(400).json({ success: false, error: 'hostel_id is required' });

        let group;
        if (action === 'remove') {
            group = await hostelGroupService.removeHostelFromGroup(id, hostel_id);
        } else {
            group = await hostelGroupService.addHostelToGroup(id, hostel_id);
        }

        res.json({
            success: true,
            message: `Hostel ${hostel_id} ${action === 'remove' ? 'removed from' : 'added to'} group.`,
            group
        });
    } catch (err) {
        console.error('[Group Members Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/admin/hostel-groups/:id/admins (Owner only)
// Assign or remove an admin from a group
router.post('/:id/admins', requireRole('owner'), async (req, res) => {
    try {
        const { id } = req.params;
        const { action, user_id } = req.body; // action: 'add' | 'remove'
        if (!user_id) return res.status(400).json({ success: false, error: 'user_id is required' });

        let group;
        if (action === 'remove') {
            group = await hostelGroupService.removeAdminFromGroup(id, user_id);
        } else {
            group = await hostelGroupService.assignAdminToGroup(id, user_id);
        }

        res.json({
            success: true,
            message: `Admin ${action === 'remove' ? 'removed from' : 'assigned to'} group.`,
            group
        });
    } catch (err) {
        console.error('[Group Admins Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;


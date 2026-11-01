const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');
const cache = require('../cache');

class HostelGroupService {
    constructor() {
        this._filePath = path.join(__dirname, '..', 'data', 'hostel_groups.json');
        this._groups = [];
        this._initialized = false;
    }

    _normalizeHostelId(hostelId) {
        if (!hostelId || hostelId === 'all' || hostelId === 'ALL') return null;
        let str = String(hostelId).trim().toUpperCase();
        const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
        if (match) {
            return `${match[1].toUpperCase()}-${match[2]}`;
        }
        return str.replace(/[^A-Z0-9]/g, '');
    }

    async init() {
        if (this._initialized) return;
        this._loadFromDisk();

        // Authoritative sync from Supabase app_availability
        const supabase = getSupabaseClient();
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'hostel_groups_registry')
                    .maybeSingle();

                if (!error && data && data.message) {
                    const parsed = JSON.parse(data.message);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        this._groups = parsed;
                        this._saveToDisk();
                    }
                } else if (!error && (!data || !data.message) && this._groups.length > 0) {
                    // Push local groups to Supabase if Supabase is empty
                    await this._saveToSupabase();
                }
            } catch (err) {
                console.warn('[HostelGroupService Supabase Init Note]:', err.message);
            }
        }
        this._initialized = true;
    }

    _loadFromDisk() {
        try {
            if (fs.existsSync(this._filePath)) {
                const raw = fs.readFileSync(this._filePath, 'utf8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this._groups = parsed;
                    return;
                }
            }
        } catch (e) {
            console.warn('[HostelGroupService Disk Read Note]:', e.message);
        }
        this._groups = [];
    }

    _saveToDisk() {
        try {
            const dir = path.dirname(this._filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this._filePath, JSON.stringify(this._groups, null, 2), 'utf8');
        } catch (e) {
            // Read-only filesystem on serverless environments
        }
    }

    async _saveToSupabase() {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('app_availability').upsert([{
                id: 'hostel_groups_registry',
                is_locked: false,
                lock_type: 'NONE',
                message: JSON.stringify(this._groups),
                updated_at: new Date().toISOString()
            }]);
        } catch (err) {
            console.warn('[HostelGroupService Supabase Save Note]:', err.message);
        }
    }

    async _persist() {
        this._saveToDisk();
        await this._saveToSupabase();
    }

    // ==========================================
    // QUERY METHODS
    // ==========================================

    async getGroups({ status = null, includeInactive = true } = {}) {
        await this.init();
        let list = [...this._groups];
        if (!includeInactive) {
            list = list.filter(g => g.status === 'active' || g.is_active === true);
        }
        if (status) {
            list = list.filter(g => String(g.status).toLowerCase() === String(status).toLowerCase());
        }
        return list;
    }

    async getGroupById(id) {
        await this.init();
        if (!id) return null;
        return this._groups.find(g => g.id === id) || null;
    }

    async getGroupByCode(code) {
        await this.init();
        if (!code) return null;
        const norm = String(code).trim().toUpperCase();
        return this._groups.find(g => String(g.code).trim().toUpperCase() === norm) || null;
    }

    /**
     * Resolves the active group for a given hostel ID.
     */
    getGroupByHostelSync(hostelId) {
        const clean = this._normalizeHostelId(hostelId);
        if (!clean) return null;
        return this._groups.find(g => {
            const isActive = g.status === 'active' || g.is_active === true;
            if (!isActive) return false;
            return (g.hostel_ids || []).some(h => this._normalizeHostelId(h) === clean);
        }) || null;
    }

    async getGroupByHostel(hostelId) {
        await this.init();
        return this.getGroupByHostelSync(hostelId);
    }

    /**
     * Resolves the canonical shared inventory pool key for a hostel.
     * If the hostel belongs to an active group with inventory_mode === 'shared',
     * returns `group_${group.id}`.
     * Otherwise returns cleanHostel.
     */
    getSharedPoolId(hostelId) {
        const clean = this._normalizeHostelId(hostelId) || 'BH-13';
        const group = this.getGroupByHostelSync(clean);
        if (group && group.inventory_mode === 'shared') {
            return `group_${group.id}`;
        }
        return clean;
    }

    isHostelInSharedGroup(hostelId) {
        const clean = this._normalizeHostelId(hostelId);
        if (!clean) return false;
        const poolId = this.getSharedPoolId(clean);
        return poolId !== clean;
    }

    /**
     * Returns all member hostels for the hostel's group, or [cleanHostel] if not shared.
     */
    getSiblingHostels(hostelId) {
        const clean = this._normalizeHostelId(hostelId) || 'BH-13';
        const group = this.getGroupByHostelSync(clean);
        if (group && group.inventory_mode === 'shared' && Array.isArray(group.hostel_ids)) {
            const list = group.hostel_ids.map(h => this._normalizeHostelId(h)).filter(Boolean);
            return Array.from(new Set(list));
        }
        return [clean];
    }

    /**
     * Returns all assigned hostels for an admin across all assigned groups.
     */
    getAdminAssignedHostels(userId) {
        if (!userId) return [];
        const hostels = new Set();
        for (const g of this._groups) {
            const isActive = g.status === 'active' || g.is_active === true;
            if (!isActive) continue;
            if (Array.isArray(g.admin_ids) && g.admin_ids.includes(userId)) {
                for (const h of (g.hostel_ids || [])) {
                    const clean = this._normalizeHostelId(h);
                    if (clean) hostels.add(clean);
                }
            }
        }
        return Array.from(hostels);
    }

    /**
     * Returns all groups assigned to an admin user ID.
     */
    getAdminAssignedGroups(userId) {
        if (!userId) return [];
        return this._groups.filter(g => {
            const isActive = g.status === 'active' || g.is_active === true;
            if (!isActive) return false;
            return Array.isArray(g.admin_ids) && g.admin_ids.includes(userId);
        });
    }

    // ==========================================
    // MUTATION METHODS
    // ==========================================

    async createGroup({ name, code, description = '', inventory_mode = 'shared', status = 'active', hostel_ids = [], admin_ids = [] }) {
        await this.init();

        if (!name || !name.trim()) throw new Error('Group name is required.');
        const cleanName = name.trim();
        const cleanCode = (code ? code.trim() : cleanName.replace(/[^a-zA-Z0-9]/g, '-')).toUpperCase();

        const existing = await this.getGroupByCode(cleanCode);
        if (existing) {
            throw new Error(`A hostel group with code "${cleanCode}" already exists.`);
        }

        const normHostels = Array.from(new Set((hostel_ids || []).map(h => this._normalizeHostelId(h)).filter(Boolean)));
        const cleanAdmins = Array.from(new Set((admin_ids || []).map(a => String(a).trim()).filter(Boolean)));

        // Validate that member hostels are not already part of another active shared group
        if (inventory_mode === 'shared') {
            for (const h of normHostels) {
                const existingGroup = this.getGroupByHostelSync(h);
                if (existingGroup) {
                    throw new Error(`Hostel "${h}" is already in active group "${existingGroup.name}". A hostel can only belong to one active shared inventory group.`);
                }
            }
        }

        const id = `hg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();

        const newGroup = {
            id,
            name: cleanName,
            code: cleanCode,
            description: description ? description.trim() : '',
            inventory_mode: inventory_mode === 'independent' ? 'independent' : 'shared',
            status: status === 'inactive' ? 'inactive' : 'active',
            is_active: status !== 'inactive',
            hostel_ids: normHostels,
            admin_ids: cleanAdmins,
            created_at: now,
            updated_at: now
        };

        this._groups.push(newGroup);
        await this._persist();

        // Seed shared inventory from first member hostel if shared mode
        if (newGroup.inventory_mode === 'shared' && normHostels.length > 0) {
            await this._seedSharedInventory(newGroup);
        }

        return newGroup;
    }

    async updateGroup(id, updates = {}) {
        await this.init();
        const groupIndex = this._groups.findIndex(g => g.id === id);
        if (groupIndex === -1) throw new Error(`Hostel group with ID "${id}" not found.`);

        const group = this._groups[groupIndex];

        if (updates.code) {
            const cleanCode = updates.code.trim().toUpperCase();
            const existingWithCode = this._groups.find(g => g.id !== id && String(g.code).trim().toUpperCase() === cleanCode);
            if (existingWithCode) throw new Error(`Code "${cleanCode}" is already in use by group "${existingWithCode.name}".`);
            group.code = cleanCode;
        }

        if (updates.name) group.name = updates.name.trim();
        if (updates.description !== undefined) group.description = updates.description.trim();
        if (updates.status !== undefined) {
            group.status = updates.status === 'inactive' ? 'inactive' : 'active';
            group.is_active = group.status === 'active';
        }
        if (updates.is_active !== undefined) {
            group.is_active = Boolean(updates.is_active);
            group.status = group.is_active ? 'active' : 'inactive';
        }

        const prevMode = group.inventory_mode;
        if (updates.inventory_mode !== undefined) {
            group.inventory_mode = updates.inventory_mode === 'independent' ? 'independent' : 'shared';
        }

        if (Array.isArray(updates.hostel_ids)) {
            const normHostels = Array.from(new Set(updates.hostel_ids.map(h => this._normalizeHostelId(h)).filter(Boolean)));
            // Check conflicts with other active groups
            if (group.inventory_mode === 'shared' && group.is_active) {
                for (const h of normHostels) {
                    const otherGroup = this._groups.find(g => g.id !== id && (g.status === 'active' || g.is_active) && (g.hostel_ids || []).some(x => this._normalizeHostelId(x) === h));
                    if (otherGroup) {
                        throw new Error(`Hostel "${h}" is already in active group "${otherGroup.name}".`);
                    }
                }
            }
            group.hostel_ids = normHostels;
        }

        if (Array.isArray(updates.admin_ids)) {
            group.admin_ids = Array.from(new Set(updates.admin_ids.map(a => String(a).trim()).filter(Boolean)));
        }

        group.updated_at = new Date().toISOString();
        this._groups[groupIndex] = group;
        await this._persist();

        // If mode changed to shared, hydrate & sync shared inventory
        if (prevMode !== 'shared' && group.inventory_mode === 'shared' && group.hostel_ids.length > 0) {
            await this._seedSharedInventory(group);
        }

        return group;
    }

    async deleteGroup(id) {
        await this.init();
        const groupIndex = this._groups.findIndex(g => g.id === id);
        if (groupIndex === -1) throw new Error(`Hostel group with ID "${id}" not found.`);

        const deleted = this._groups.splice(groupIndex, 1)[0];
        await this._persist();
        return deleted;
    }

    async addHostelToGroup(groupId, hostelId) {
        await this.init();
        const group = await this.getGroupById(groupId);
        if (!group) throw new Error('Group not found.');

        const clean = this._normalizeHostelId(hostelId);
        if (!clean) throw new Error('Invalid hostel ID.');

        if (!Array.isArray(group.hostel_ids)) group.hostel_ids = [];
        if (!group.hostel_ids.some(h => this._normalizeHostelId(h) === clean)) {
            group.hostel_ids.push(clean);
            group.updated_at = new Date().toISOString();
            await this._persist();

            if (group.inventory_mode === 'shared') {
                await this._syncHostelWithSharedInventory(group, clean);
            }
        }
        return group;
    }

    async removeHostelFromGroup(groupId, hostelId) {
        await this.init();
        const group = await this.getGroupById(groupId);
        if (!group) throw new Error('Group not found.');

        const clean = this._normalizeHostelId(hostelId);
        if (!clean) return group;

        group.hostel_ids = (group.hostel_ids || []).filter(h => this._normalizeHostelId(h) !== clean);
        group.updated_at = new Date().toISOString();
        await this._persist();
        return group;
    }

    async assignAdminToGroup(groupId, userId) {
        await this.init();
        const group = await this.getGroupById(groupId);
        if (!group) throw new Error('Group not found.');
        if (!userId) throw new Error('Invalid admin user ID.');

        if (!Array.isArray(group.admin_ids)) group.admin_ids = [];
        if (!group.admin_ids.includes(userId)) {
            group.admin_ids.push(userId);
            group.updated_at = new Date().toISOString();
            await this._persist();
        }
        return group;
    }

    async removeAdminFromGroup(groupId, userId) {
        await this.init();
        const group = await this.getGroupById(groupId);
        if (!group) throw new Error('Group not found.');

        group.admin_ids = (group.admin_ids || []).filter(a => a !== userId);
        group.updated_at = new Date().toISOString();
        await this._persist();
        return group;
    }

    // ==========================================
    // SHARED INVENTORY SYNC HELPERS
    // ==========================================

    async _seedSharedInventory(group) {
        try {
            const supabaseDb = require('../db/supabaseDb');
            if (!supabaseDb || !supabaseDb.inventory) return;

            const poolKey = `group_${group.id}`;
            const existingPoolInv = await supabaseDb.inventory.getHostelInventory(poolKey, true);

            // If pool is empty, copy from the first hostel with inventory
            if (!existingPoolInv || Object.keys(existingPoolInv).length === 0) {
                let donorInv = {};
                for (const h of group.hostel_ids) {
                    const inv = await supabaseDb.inventory.getHostelInventory(h, true);
                    if (inv && Object.keys(inv).length > 0) {
                        donorInv = inv;
                        break;
                    }
                }

                if (Object.keys(donorInv).length > 0) {
                    // Save donor inventory as the shared pool
                    for (const [prodId, data] of Object.entries(donorInv)) {
                        await supabaseDb.inventory.setProductStock(poolKey, prodId, {
                            stock_left: data.stock_left,
                            in_stock: data.in_stock,
                            deleted: data.deleted
                        });
                    }
                }
            }

            // Sync pool inventory into each member hostel
            const sharedInv = await supabaseDb.inventory.getHostelInventory(poolKey, true);
            for (const h of group.hostel_ids) {
                for (const [prodId, data] of Object.entries(sharedInv)) {
                    await supabaseDb.inventory.setProductStock(h, prodId, {
                        stock_left: data.stock_left,
                        in_stock: data.in_stock,
                        deleted: data.deleted
                    });
                }
            }
        } catch (e) {
            console.warn('[HostelGroupService _seedSharedInventory Note]:', e.message);
        }
    }

    async _syncHostelWithSharedInventory(group, hostelId) {
        try {
            const supabaseDb = require('../db/supabaseDb');
            if (!supabaseDb || !supabaseDb.inventory) return;

            const poolKey = `group_${group.id}`;
            const sharedInv = await supabaseDb.inventory.getHostelInventory(poolKey, true);
            if (sharedInv && Object.keys(sharedInv).length > 0) {
                for (const [prodId, data] of Object.entries(sharedInv)) {
                    await supabaseDb.inventory.setProductStock(hostelId, prodId, {
                        stock_left: data.stock_left,
                        in_stock: data.in_stock,
                        deleted: data.deleted
                    });
                }
            }
        } catch (e) {
            console.warn('[HostelGroupService _syncHostelWithSharedInventory Note]:', e.message);
        }
    }
}

const hostelGroupService = new HostelGroupService();
module.exports = hostelGroupService;

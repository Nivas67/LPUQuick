const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');

const SETTINGS_FILE_PATH = path.join(__dirname, '..', 'data', 'order_mode_settings.json');

const DEFAULT_GLOBAL = {
    delivery_enabled: true,
    takeaway_enabled: true,
    maintenance_fee_enabled: true,
    maintenance_fee_amount: 2,
    maintenance_fee_type: 'fixed', // 'fixed' | 'percentage'
    updated_at: new Date().toISOString(),
    updated_by: 'Owner'
};

let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10s memory TTL for ultra-fast response

function normalizeHostelId(input) {
    if (!input) return 'BH-13';
    const s = String(input).trim().toUpperCase();
    const m = s.match(/(BH|GH)[-\s]?(\d+)/i);
    if (m) return `${m[1].toUpperCase()}-${m[2]}`;
    return s.replace(/[^A-Z0-9]/g, '');
}

function loadFromDisk() {
    try {
        if (fs.existsSync(SETTINGS_FILE_PATH)) {
            const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[orderModeService] Failed to read disk backup:', e.message);
    }
    return { global: { ...DEFAULT_GLOBAL }, stores: {} };
}

function saveToDisk(data) {
    try {
        const dir = path.dirname(SETTINGS_FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('[orderModeService] Failed to save disk backup:', e.message);
    }
}

async function getSettings(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedSettings && (now - lastCacheTime < CACHE_TTL_MS)) {
        return cachedSettings;
    }

    let loaded = null;
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('app_availability')
                .select('message')
                .eq('id', 'order_mode_settings')
                .single();

            if (!error && data && data.message) {
                try {
                    const parsed = JSON.parse(data.message);
                    if (parsed && parsed.global) {
                        loaded = parsed;
                    }
                } catch (pe) {
                    console.warn('[orderModeService] Malformed payload in DB:', pe.message);
                }
            }
        }
    } catch (dbErr) {
        console.warn('[orderModeService] DB fetch failed, using local copy:', dbErr.message);
    }

    if (!loaded) {
        loaded = loadFromDisk();
    } else {
        // Keep disk backup synced
        saveToDisk(loaded);
    }

    if (!loaded.global) loaded.global = { ...DEFAULT_GLOBAL };
    if (!loaded.stores) loaded.stores = {};

    for (const [k, v] of Object.entries(loaded.stores)) {
        v.store_name = v.store_name || v.name || `LPUQuick ${k} Store`;
        v.name = v.store_name;
        v.pickup_address = v.pickup_address || v.address || `Ground Floor, ${k} Entrance, LPU Campus`;
        v.address = v.pickup_address;
        v.pickup_contact = v.pickup_contact || v.phone || '+91 98765 43210';
        v.phone = v.pickup_contact;
        v.pickup_maps_url = v.pickup_maps_url || v.maps_url || `https://maps.google.com/?q=${encodeURIComponent(k + ' LPU Phagwara')}`;
        v.maps_url = v.pickup_maps_url;
        v.pickup_hours = v.pickup_hours || v.hours || 'Open Daily: 8:00 PM – 3:30 AM';
        v.hours = v.pickup_hours;
    }

    cachedSettings = loaded;
    lastCacheTime = now;
    return loaded;
}

/**
 * Returns effective availability, store pickup info, and fee settings for a specific hostel.
 */
async function getStoreSettings(hostelId) {
    const all = await getSettings();
    const norm = normalizeHostelId(hostelId);
    const store = (all.stores && all.stores[norm]) || {};
    const glob = all.global || DEFAULT_GLOBAL;

    const delivery_enabled = store.delivery_enabled !== undefined && store.delivery_enabled !== null
        ? Boolean(store.delivery_enabled)
        : Boolean(glob.delivery_enabled);

    const takeaway_enabled = store.takeaway_enabled !== undefined && store.takeaway_enabled !== null
        ? Boolean(store.takeaway_enabled)
        : Boolean(glob.takeaway_enabled);

    const maintenance_fee_enabled = store.maintenance_fee_enabled !== undefined && store.maintenance_fee_enabled !== null
        ? Boolean(store.maintenance_fee_enabled)
        : Boolean(glob.maintenance_fee_enabled);

    const maintenance_fee_amount = store.maintenance_fee_amount !== undefined && store.maintenance_fee_amount !== null
        ? Number(store.maintenance_fee_amount)
        : Number(glob.maintenance_fee_amount || 2);

    const maintenance_fee_type = store.maintenance_fee_type
        ? String(store.maintenance_fee_type)
        : String(glob.maintenance_fee_type || 'fixed');

    const finalName = store.store_name || store.name || `LPUQuick ${norm} Express Store`;
    const finalAddress = store.pickup_address || store.address || `Ground Floor, ${norm} Commercial Block, LPU Campus, Phagwara, Punjab 144411`;
    const finalPhone = store.pickup_contact || store.phone || '+91 98765 43210';
    const finalMaps = store.pickup_maps_url || store.maps_url || `https://maps.google.com/?q=${encodeURIComponent(norm + ' LPU Phagwara')}`;
    const finalHours = store.pickup_hours || store.hours || 'Open Daily: 8:00 PM – 3:30 AM';

    return {
        hostel_id: norm,
        name: finalName,
        store_name: finalName,
        address: finalAddress,
        pickup_address: finalAddress,
        phone: finalPhone,
        pickup_contact: finalPhone,
        maps_url: finalMaps,
        pickup_maps_url: finalMaps,
        hours: finalHours,
        pickup_hours: finalHours,
        delivery_enabled,
        takeaway_enabled,
        maintenance_fee_enabled,
        maintenance_fee_amount,
        maintenance_fee_type,
        global_delivery_enabled: Boolean(glob.delivery_enabled),
        global_takeaway_enabled: Boolean(glob.takeaway_enabled)
    };
}

/**
 * Deterministically computes takeaway fee for an order.
 * Strictly 0 if takeaway fee is disabled or subtotal is 0.
 */
async function calculateTakeawayFee(subtotal = 0, hostelId = null) {
    const storeInfo = await getStoreSettings(hostelId);
    if (!storeInfo.maintenance_fee_enabled) return 0;

    const sub = Math.max(0, Number(subtotal) || 0);
    if (sub <= 0) return 0;

    if (storeInfo.maintenance_fee_type === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(storeInfo.maintenance_fee_amount) || 0));
        return Math.round(sub * (pct / 100));
    }

    // Default: Fixed fee
    return Math.max(0, Math.round(Number(storeInfo.maintenance_fee_amount) || 2));
}

/**
 * Update global order mode and maintenance fee settings
 */
async function updateGlobalSettings(adminUser, patch = {}) {
    const all = await getSettings(true);
    const glob = all.global || { ...DEFAULT_GLOBAL };

    if (patch.delivery_enabled !== undefined) {
        glob.delivery_enabled = Boolean(patch.delivery_enabled);
    }
    if (patch.takeaway_enabled !== undefined) {
        glob.takeaway_enabled = Boolean(patch.takeaway_enabled);
    }
    if (patch.maintenance_fee_enabled !== undefined) {
        glob.maintenance_fee_enabled = Boolean(patch.maintenance_fee_enabled);
    }
    if (patch.maintenance_fee_amount !== undefined) {
        const amt = Number(patch.maintenance_fee_amount);
        if (Number.isFinite(amt) && amt >= 0) glob.maintenance_fee_amount = amt;
    }
    if (patch.maintenance_fee_type !== undefined) {
        const valid = ['fixed', 'percentage'];
        if (valid.includes(patch.maintenance_fee_type)) glob.maintenance_fee_type = patch.maintenance_fee_type;
    }

    glob.updated_at = new Date().toISOString();
    glob.updated_by = (adminUser && (adminUser.name || adminUser.email)) || 'Owner';

    all.global = glob;

    // Persist to Supabase
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase
                .from('app_availability')
                .upsert({
                    id: 'order_mode_settings',
                    is_locked: false,
                    lock_type: 'ORDER_MODE_SETTINGS',
                    message: JSON.stringify(all),
                    created_by: adminUser?.id || 'owner',
                    updated_at: glob.updated_at
                });
        }
    } catch (e) {
        console.error('[orderModeService] Supabase global update error:', e.message);
    }

    cachedSettings = all;
    lastCacheTime = Date.now();
    saveToDisk(all);

    return all;
}

/**
 * Update store-level overrides (delivery/takeaway toggles, address, phone, hours, fee overrides)
 */
async function updateStoreSettings(adminUser, hostelId, patch = {}) {
    const all = await getSettings(true);
    const norm = normalizeHostelId(hostelId);
    if (!all.stores) all.stores = {};

    const existing = all.stores[norm] || {
        hostel_id: norm,
        name: `LPUQuick ${norm} Express Store`,
        address: `Ground Floor, ${norm} Commercial Block, LPU Campus, Phagwara, Punjab 144411`,
        phone: '+91 98765 43210',
        maps_url: `https://maps.google.com/?q=${encodeURIComponent(norm + ' LPU Phagwara')}`,
        hours: 'Open Daily: 8:00 PM – 3:30 AM',
        delivery_enabled: true,
        takeaway_enabled: true,
        maintenance_fee_enabled: null,
        maintenance_fee_amount: null,
        maintenance_fee_type: null
    };

    if (patch.store_name !== undefined) existing.name = String(patch.store_name).trim();
    if (patch.name !== undefined) existing.name = String(patch.name).trim();
    if (patch.pickup_address !== undefined) existing.address = String(patch.pickup_address).trim();
    if (patch.address !== undefined) existing.address = String(patch.address).trim();
    if (patch.pickup_contact !== undefined) existing.phone = String(patch.pickup_contact).trim();
    if (patch.phone !== undefined) existing.phone = String(patch.phone).trim();
    if (patch.pickup_maps_url !== undefined) existing.maps_url = String(patch.pickup_maps_url).trim();
    if (patch.maps_url !== undefined) existing.maps_url = String(patch.maps_url).trim();
    if (patch.pickup_hours !== undefined) existing.hours = String(patch.pickup_hours).trim();
    if (patch.hours !== undefined) existing.hours = String(patch.hours).trim();
    existing.store_name = existing.name;
    existing.pickup_address = existing.address;
    existing.pickup_contact = existing.phone;
    existing.pickup_maps_url = existing.maps_url;
    existing.pickup_hours = existing.hours;

    if (patch.delivery_enabled !== undefined) {
        existing.delivery_enabled = patch.delivery_enabled === null ? null : Boolean(patch.delivery_enabled);
    }
    if (patch.takeaway_enabled !== undefined) {
        existing.takeaway_enabled = patch.takeaway_enabled === null ? null : Boolean(patch.takeaway_enabled);
    }

    if (patch.maintenance_fee_enabled !== undefined) {
        existing.maintenance_fee_enabled = patch.maintenance_fee_enabled === null ? null : Boolean(patch.maintenance_fee_enabled);
    }
    if (patch.maintenance_fee_amount !== undefined) {
        if (patch.maintenance_fee_amount === null || patch.maintenance_fee_amount === '') {
            existing.maintenance_fee_amount = null;
        } else {
            const amt = Number(patch.maintenance_fee_amount);
            if (Number.isFinite(amt) && amt >= 0) existing.maintenance_fee_amount = amt;
        }
    }
    if (patch.maintenance_fee_type !== undefined) {
        if (!patch.maintenance_fee_type || patch.maintenance_fee_type === 'null') {
            existing.maintenance_fee_type = null;
        } else if (['fixed', 'percentage'].includes(patch.maintenance_fee_type)) {
            existing.maintenance_fee_type = patch.maintenance_fee_type;
        }
    }

    all.stores[norm] = existing;
    all.global.updated_at = new Date().toISOString();
    all.global.updated_by = (adminUser && (adminUser.name || adminUser.email)) || 'Owner';

    // Persist to Supabase
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase
                .from('app_availability')
                .upsert({
                    id: 'order_mode_settings',
                    is_locked: false,
                    lock_type: 'ORDER_MODE_SETTINGS',
                    message: JSON.stringify(all),
                    created_by: adminUser?.id || 'owner',
                    updated_at: all.global.updated_at
                });
        }
    } catch (e) {
        console.error('[orderModeService] Supabase store update error:', e.message);
    }

    cachedSettings = all;
    lastCacheTime = Date.now();
    saveToDisk(all);

    return existing;
}

module.exports = {
    DEFAULT_GLOBAL,
    normalizeHostelId,
    getSettings,
    getStoreSettings,
    calculateTakeawayFee,
    updateGlobalSettings,
    updateStoreSettings
};

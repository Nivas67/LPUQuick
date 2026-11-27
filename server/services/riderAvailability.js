const fs = require('fs');
const path = require('path');
const os = require('os');
const { getSupabaseClient } = require('../supabase');

const AVAILABILITY_FILE = path.join(__dirname, '../data/rider_availability.json');
const TMP_AVAILABILITY_FILE = path.join(os.tmpdir(), 'lpuquick_rider_availability.json');

// In-memory cache for speed + Supabase persistence across serverless invocations
let availabilityCache = null;

function syncCacheToCloud() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase || !availabilityCache) return;
        supabase.from('app_availability').upsert([{
            id: 'rider_availability_registry',
            is_locked: false,
            lock_type: 'RIDER_AVAILABILITY',
            message: JSON.stringify(availabilityCache),
            updated_at: new Date().toISOString()
        }]).then(() => {}).catch(() => {});
    } catch (e) {}
}

async function hydrateFromCloud() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        const { data, error } = await supabase
            .from('app_availability')
            .select('message')
            .eq('id', 'rider_availability_registry')
            .maybeSingle();
        if (!error && data && data.message) {
            const parsed = JSON.parse(data.message);
            if (parsed && typeof parsed === 'object') {
                availabilityCache = { ...(availabilityCache || {}), ...parsed };
            }
        }
    } catch (e) {}
}
hydrateFromCloud().catch(() => {});

function loadCache() {
    try {
        if (fs.existsSync(TMP_AVAILABILITY_FILE)) {
            const raw = fs.readFileSync(TMP_AVAILABILITY_FILE, 'utf8');
            availabilityCache = JSON.parse(raw);
            return;
        }
    } catch (e) {}

    try {
        if (fs.existsSync(AVAILABILITY_FILE)) {
            const raw = fs.readFileSync(AVAILABILITY_FILE, 'utf8');
            availabilityCache = JSON.parse(raw);
            return;
        }
    } catch (e) {
        console.warn('[Rider Availability Read Error]:', e.message);
    }
    availabilityCache = {};
}

function saveCache() {
    syncCacheToCloud();
    if (process.env.VERCEL || process.env.CLOUDFLARE_WORKERS) {
        try {
            fs.writeFileSync(TMP_AVAILABILITY_FILE, JSON.stringify(availabilityCache || {}, null, 2), 'utf8');
        } catch (tmpErr) {}
        return;
    }
    // 1. Try local project path
    try {
        const dir = path.dirname(AVAILABILITY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify(availabilityCache || {}, null, 2), 'utf8');
    } catch (e) {
        // 2. Serverless fallback: write to /tmp
        try {
            fs.writeFileSync(TMP_AVAILABILITY_FILE, JSON.stringify(availabilityCache || {}, null, 2), 'utf8');
        } catch (tmpErr) {
            console.error('[Rider Availability Write Error]:', tmpErr.message);
        }
    }
}

/**
 * Get current rider status. Defaults to 'Active' unless explicitly set to 'Offline'.
 * @param {string} riderId
 * @returns {'Active' | 'Offline'}
 */
function getRiderStatus(riderId) {
    if (!riderId) return 'Active';
    if (!availabilityCache) loadCache();
    const entry = availabilityCache[riderId];
    if (entry && entry.status === 'Offline') {
        return 'Offline';
    }
    return 'Active';
}

/**
 * Check if rider is currently online/on-duty.
 * @param {string} riderId
 * @returns {boolean}
 */
function isRiderOnline(riderId) {
    return getRiderStatus(riderId) === 'Active';
}

/**
 * Update rider availability status.
 * @param {string} riderId
 * @param {'Active' | 'Offline'} status
 * @returns {{ riderId: string, status: 'Active' | 'Offline', updated_at: string }}
 */
function setRiderStatus(riderId, status) {
    if (!riderId) return null;
    if (!availabilityCache) loadCache();
    const normalized = (status === 'Offline' || status === false) ? 'Offline' : 'Active';
    const entry = {
        status: normalized,
        updated_at: new Date().toISOString()
    };
    availabilityCache[riderId] = entry;
    saveCache();
    return { riderId, ...entry };
}

/**
 * Get all rider availability records
 * @returns {Record<string, { status: 'Active' | 'Offline', updated_at: string }>}
 */
function getAllRiderStatuses() {
    if (!availabilityCache) loadCache();
    return { ...availabilityCache };
}

module.exports = {
    getRiderStatus,
    isRiderOnline,
    setRiderStatus,
    getAllRiderStatuses
};

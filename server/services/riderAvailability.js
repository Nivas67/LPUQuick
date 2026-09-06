const fs = require('fs');
const path = require('path');

const AVAILABILITY_FILE = path.join(__dirname, '../data/rider_availability.json');

// In-memory cache for speed
let availabilityCache = null;

function loadCache() {
    try {
        if (fs.existsSync(AVAILABILITY_FILE)) {
            const raw = fs.readFileSync(AVAILABILITY_FILE, 'utf8');
            availabilityCache = JSON.parse(raw);
        } else {
            availabilityCache = {};
        }
    } catch (e) {
        console.warn('[Rider Availability Read Error]:', e.message);
        availabilityCache = {};
    }
}

function saveCache() {
    try {
        const dir = path.dirname(AVAILABILITY_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(AVAILABILITY_FILE, JSON.stringify(availabilityCache || {}, null, 2), 'utf8');
    } catch (e) {
        console.error('[Rider Availability Write Error]:', e.message);
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

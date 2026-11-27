const fs = require('fs');
const path = require('path');

// In-memory cache of blocked IPs
const _blockedIpsMap = new Map();
let _lastSyncTime = 0;
const SYNC_INTERVAL_MS = 15000; // 15 seconds cache sync

// Local fallback file in server/data
const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_BACKUP_FILE = path.join(DATA_DIR, 'blocked_ips.json');

function ensureDataDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
    } catch (e) {}
}

function loadLocalBackup() {
    try {
        if (fs.existsSync(LOCAL_BACKUP_FILE)) {
            const raw = fs.readFileSync(LOCAL_BACKUP_FILE, 'utf8');
            const data = JSON.parse(raw);
            if (data && typeof data === 'object') {
                Object.values(data).forEach(entry => {
                    if (entry && entry.ip) {
                        _blockedIpsMap.set(normalizeIp(entry.ip), entry);
                    }
                });
            }
        }
    } catch (e) {
        console.warn('[IP Block Local Backup Read Notice]:', e.message);
    }
}

function saveLocalBackup() {
    if (process.env.VERCEL) return;
    try {
        ensureDataDir();
        const obj = {};
        _blockedIpsMap.forEach((val, key) => {
            obj[key] = val;
        });
        fs.writeFileSync(LOCAL_BACKUP_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
        console.warn('[IP Block Local Backup Write Notice]:', e.message);
    }
}

/**
 * Standardize and clean IPv4 / IPv6 representations
 */
function normalizeIp(ip) {
    if (!ip || typeof ip !== 'string') return '';
    let clean = ip.trim();
    // Normalize IPv4-mapped IPv6 address (e.g. ::ffff:192.168.1.1)
    if (clean.startsWith('::ffff:')) {
        clean = clean.replace('::ffff:', '');
    }
    // Normalize localhost
    if (clean === '::1') {
        clean = '127.0.0.1';
    }
    return clean.toLowerCase();
}

/**
 * Extract client IP reliably across Vercel, Nginx, proxies, and local Express.
 */
function extractClientIp(req) {
    if (!req) return '';
    const headers = req.headers || {};

    // 1. Vercel Edge Forwarded IP
    const vercelIp = headers['x-vercel-forwarded-for'];
    if (vercelIp && typeof vercelIp === 'string' && vercelIp.trim()) {
        const first = vercelIp.split(',')[0].trim();
        if (first) return normalizeIp(first);
    }

    // 2. X-Real-IP set by trusted upstream Vercel / Nginx proxy
    const realIp = headers['x-real-ip'];
    if (realIp && typeof realIp === 'string' && realIp.trim()) {
        return normalizeIp(realIp.trim());
    }

    // 3. Fallback: X-Forwarded-For
    const forwarded = headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') {
        const client = forwarded.split(',')[0].trim();
        if (client) return normalizeIp(client);
    }

    // 5. Socket Remote Address / Express req.ip
    const remote = req.socket ? req.socket.remoteAddress : (req.connection ? req.connection.remoteAddress : req.ip);
    return normalizeIp(remote || '');
}

/**
 * Synchronize blocked IPs from Supabase app_availability table
 */
async function syncFromDatabase() {
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const { data, error } = await supabase
            .from('app_availability')
            .select('message')
            .eq('id', 'blocked_ips_registry')
            .maybeSingle();

        if (!error && data && data.message) {
            try {
                const parsed = JSON.parse(data.message);
                if (parsed && typeof parsed === 'object') {
                    _blockedIpsMap.clear();
                    Object.values(parsed).forEach(entry => {
                        if (entry && entry.ip) {
                            _blockedIpsMap.set(normalizeIp(entry.ip), entry);
                        }
                    });
                    saveLocalBackup();
                }
            } catch (pErr) {}
        }
        _lastSyncTime = Date.now();
    } catch (e) {
        console.warn('[IP Block Sync Notice]:', e.message);
    }
}

/**
 * Persist current blocked IPs map to Supabase and local backup
 */
async function persistToDatabase() {
    saveLocalBackup();
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (!supabase) return;

        const registry = {};
        _blockedIpsMap.forEach((val, key) => {
            registry[key] = val;
        });

        await supabase.from('app_availability').upsert([{
            id: 'blocked_ips_registry',
            is_locked: _blockedIpsMap.size > 0,
            lock_type: 'IP_BLOCK_REGISTRY',
            message: JSON.stringify(registry),
            updated_at: new Date().toISOString()
        }]);
    } catch (e) {
        console.warn('[IP Block Persist Notice]:', e.message);
    }
}

// Initial bootstrap
loadLocalBackup();
syncFromDatabase().catch(() => {});

const ipBlockService = {
    extractClientIp,
    normalizeIp,

    /**
     * Check if an IP address is blocked
     * @returns {{ blocked: boolean, message: string }}
     */
    isBlocked(ip) {
        const clean = normalizeIp(ip);
        if (!clean) return { blocked: false };

        // Periodically refresh cache in background
        if (Date.now() - _lastSyncTime > SYNC_INTERVAL_MS) {
            _lastSyncTime = Date.now();
            syncFromDatabase().catch(() => {});
        }

        const entry = _blockedIpsMap.get(clean);
        if (entry && entry.blocked !== false) {
            return {
                blocked: true,
                message: entry.message !== undefined && entry.message !== null ? String(entry.message) : '',
                reason: entry.reason || 'Blocked by administrator',
                blocked_at: entry.blocked_at
            };
        }
        return { blocked: false };
    },

    /**
     * Block an IP with an optional custom message and reason
     */
    async blockIp({ ip, message = '', reason = 'Security violation / Administrator Block', blocked_by = 'admin' }) {
        const clean = normalizeIp(ip);
        if (!clean) throw new Error('Valid IP address is required');

        const entry = {
            ip: clean,
            blocked: true,
            message: message ? String(message).trim() : '', // Can be empty string (blank response)
            reason: String(reason || 'Administrative Block').trim(),
            blocked_by: blocked_by || 'admin',
            blocked_at: new Date().toISOString()
        };

        _blockedIpsMap.set(clean, entry);
        await persistToDatabase();
        return entry;
    },

    /**
     * Unblock an IP address
     */
    async unblockIp(ip) {
        const clean = normalizeIp(ip);
        if (!clean) throw new Error('Valid IP address is required');

        const existed = _blockedIpsMap.delete(clean);
        if (existed) {
            await persistToDatabase();
        }
        return { success: true, ip: clean, unblocked: existed };
    },

    /**
     * Get all blocked IP entries
     */
    getAllBlockedIps() {
        if (Date.now() - _lastSyncTime > SYNC_INTERVAL_MS) {
            _lastSyncTime = Date.now();
            syncFromDatabase().catch(() => {});
        }
        return Array.from(_blockedIpsMap.values()).sort((a, b) => new Date(b.blocked_at || 0) - new Date(a.blocked_at || 0));
    }
};

module.exports = ipBlockService;


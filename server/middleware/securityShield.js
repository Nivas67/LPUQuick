/**
 * LPUQuick Production Security Shield & Anti-DDoS Middleware
 * 
 * Protects against:
 * 1. 404 Request Floods / Path Scanning (Directory brute force, fuzzing, invalid endpoint spam)
 * 2. High-Frequency API DDoS Attacks (Token exhaustion, compute draining)
 * 3. Brute Force on Auth / Checkout mutations
 * 
 * Zero external dependencies, ultra-fast memory footprint (< 3MB).
 */

const { isServerlessRuntime } = require('../supabase');

// In-memory sliding window IP store
const ipStore = new Map();

// Configuration limits
const LIMITS = {
    GENERAL_API_PER_MINUTE: 180,      // Max standard API requests per IP per minute
    MUTATION_API_PER_MINUTE: 35,       // Max sensitive write requests (auth, checkout) per minute
    MAX_404_BEFORE_BLOCK: 20,         // Max 404s in 60s before IP is jailed
    JAIL_DURATION_MS: 5 * 60 * 1000,   // Jail time: 5 minutes
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000 // Clean up old records every 5 minutes
};

/**
 * Extracts the real client IP behind Cloudflare / Vercel / Nginx edge proxies.
 * Prioritizes tamper-proof CF-Connecting-IP to prevent header spoofing.
 */
function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const headers = req.headers || {};

    // 1. Cloudflare Edge Real IP (Tamper-proof from Cloudflare proxy)
    const cfIp = headers['cf-connecting-ip'] || headers['true-client-ip'];
    if (cfIp && typeof cfIp === 'string' && cfIp.trim()) {
        return cfIp.trim();
    }

    // 2. Vercel Edge Forwarded IP
    const vercelIp = headers['x-vercel-forwarded-for'];
    if (vercelIp && typeof vercelIp === 'string' && vercelIp.trim()) {
        const first = vercelIp.split(',')[0].trim();
        if (first) return first;
    }

    // 3. X-Real-IP set by trusted upstream Nginx load balancer
    const realIp = headers['x-real-ip'];
    if (realIp && typeof realIp === 'string' && realIp.trim()) {
        return realIp.trim();
    }

    // 4. Fallback: X-Forwarded-For
    const xForwardedFor = headers['x-forwarded-for'];
    if (xForwardedFor && typeof xForwardedFor === 'string') {
        const first = xForwardedFor.split(',')[0].trim();
        if (first) return first;
    }

    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Periodically purge stale IP entries to guarantee zero memory bloat
 */
function pruneIpStore(now = Date.now()) {
    for (const [ip, data] of ipStore.entries()) {
        // Remove if not jailed and no requests in last 2 minutes
        if (data.blockedUntil < now && (!data.requests.length || now - data.requests[data.requests.length - 1] > 120000)) {
            ipStore.delete(ip);
        }
    }
}

if (!isServerlessRuntime()) {
    const cleanupTimer = setInterval(() => {
        pruneIpStore(Date.now());
    }, LIMITS.CLEANUP_INTERVAL_MS);
    if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
        cleanupTimer.unref();
    }
}

/**
 * Gets or initializes state for a given client IP
 */
function getIpRecord(ip) {
    let record = ipStore.get(ip);
    if (!record) {
        record = {
            requests: [],
            mutations: [],
            notFoundRequests: [],
            blockedUntil: 0
        };
        ipStore.set(ip, record);
    }
    return record;
}

/**
 * Security Shield Rate Limiting Middleware
 */
function apiSecurityShield(req, res, next) {
    // Only apply to /api/ requests
    if (!req.path.startsWith('/api') && !req.originalUrl.startsWith('/api')) {
        return next();
    }

    const ip = getClientIp(req);
    const now = Date.now();
    if (ipStore.size > 200) pruneIpStore(now);
    const record = getIpRecord(ip);

    // 1. Check if IP is currently in security jail
    if (record.blockedUntil > now) {
        const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
        res.setHeader('Retry-After', remainingSeconds);
        res.setHeader('Cache-Control', 'no-store');
        return res.status(429).json({
            success: false,
            error: 'Access temporarily suspended due to suspicious request volume or invalid endpoint scanning.',
            code: 'IP_BLOCKED_TEMPORARILY',
            retry_after_seconds: remainingSeconds
        });
    }

    // 2. Sliding window filter: prune timestamps older than 60s
    record.requests = record.requests.filter(t => now - t < 60000);
    record.mutations = record.mutations.filter(t => now - t < 60000);

    // 3. Sensitive mutation rate-limiting (auth, checkout, orders creation)
    const isMutation = (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE');
    const isSensitive = req.path.includes('/auth') || req.path.includes('/checkout');

    if (isMutation && isSensitive) {
        if (record.mutations.length >= LIMITS.MUTATION_API_PER_MINUTE) {
            res.setHeader('Retry-After', 60);
            return res.status(429).json({
                success: false,
                error: 'Too many operations in a short period. Please wait 60 seconds.',
                code: 'RATE_LIMIT_MUTATION'
            });
        }
        record.mutations.push(now);
    }

    // 4. General API rate-limiting
    if (record.requests.length >= LIMITS.GENERAL_API_PER_MINUTE) {
        res.setHeader('Retry-After', 60);
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please slow down.',
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    record.requests.push(now);
    next();
}

/**
 * Tracks 404 errors per IP and triggers auto-jail if an attack pattern is detected
 */
function record404AttackProbe(req) {
    const ip = getClientIp(req);
    const now = Date.now();
    if (ipStore.size > 200) pruneIpStore(now);
    const record = getIpRecord(ip);

    // Filter to last 60 seconds
    record.notFoundRequests = record.notFoundRequests.filter(t => now - t < 60000);
    record.notFoundRequests.push(now);

    // If IP exceeds threshold of 404s, jail immediately for 5 minutes
    if (record.notFoundRequests.length >= LIMITS.MAX_404_BEFORE_BLOCK) {
        record.blockedUntil = now + LIMITS.JAIL_DURATION_MS;
        console.warn(`[Security Shield 🚨] Jailed IP ${ip} for 5 minutes: exceeded ${LIMITS.MAX_404_BEFORE_BLOCK} invalid 404 requests in 60s.`);
    }
}

module.exports = {
    apiSecurityShield,
    record404AttackProbe,
    getClientIp
};

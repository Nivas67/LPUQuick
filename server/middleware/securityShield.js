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

const _supabaseMod = require('../supabase');
const { isServerlessRuntime } = _supabaseMod;
const getSupabaseClient = (...args) => _supabaseMod.getSupabaseClient(...args);

// In-memory sliding window IP store
const ipStore = new Map();

// Configuration limits
const LIMITS = {
    GENERAL_API_PER_MINUTE: 180,      // Max standard API requests per IP per minute
    MUTATION_API_PER_MINUTE: 35,      // Max sensitive write requests (auth, checkout) per minute
    LOGIN_API_PER_MINUTE: 12,         // Brute-force protection on login / signup routes
    OTP_API_PER_MINUTE: 5,            // Strict SMS/WhatsApp OTP burst limit per IP
    CHECKOUT_API_PER_MINUTE: 15,      // Order creation burst guard
    MAX_404_BEFORE_BLOCK: 20,         // Max 404s in 60s before IP is jailed
    JAIL_DURATION_MS: 5 * 60 * 1000,   // Jail time: 5 minutes
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000 // Clean up old records every 5 minutes
};

/**
 * Extracts the real client IP behind Vercel / Nginx edge proxies.
 */
function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const headers = req.headers || {};

    // 1. Vercel Edge Forwarded IP
    const vercelIp = headers['x-vercel-forwarded-for'];
    if (vercelIp && typeof vercelIp === 'string' && vercelIp.trim()) {
        const first = vercelIp.split(',')[0].trim();
        if (first) return first;
    }

    // 2. X-Real-IP set by Vercel / Nginx proxy
    const realIp = headers['x-real-ip'];
    if (realIp && typeof realIp === 'string' && realIp.trim()) {
        return realIp.trim();
    }

    // 3. Fallback: X-Forwarded-For
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
            otpRequests: [],
            loginRequests: [],
            checkoutRequests: [],
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
    record.otpRequests = (record.otpRequests || []).filter(t => now - t < 60000);
    record.loginRequests = (record.loginRequests || []).filter(t => now - t < 60000);
    record.checkoutRequests = (record.checkoutRequests || []).filter(t => now - t < 60000);

    // 3. Sensitive mutation rate-limiting (OTP, login, checkout, auth)
    const isMutation = (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE');
    const reqPath = (req.originalUrl || req.path || '').toLowerCase();

    if (isMutation && (reqPath.includes('/send-otp') || reqPath.includes('/verify-otp'))) {
        if (record.otpRequests.length >= LIMITS.OTP_API_PER_MINUTE) {
            res.setHeader('Retry-After', 60);
            res.setHeader('Cache-Control', 'no-store');
            return res.status(429).json({
                success: false,
                error: 'Too many verification attempts. Please wait 60 seconds.',
                code: 'RATE_LIMIT_OTP'
            });
        }
        record.otpRequests.push(now);
    }

    if (isMutation && (reqPath.includes('/admin-login') || reqPath.includes('/partner/login') || reqPath.includes('/auth/signin') || reqPath.includes('/auth/signup') || reqPath.includes('/auth/google'))) {
        if (record.loginRequests.length >= LIMITS.LOGIN_API_PER_MINUTE) {
            res.setHeader('Retry-After', 60);
            res.setHeader('Cache-Control', 'no-store');
            return res.status(429).json({
                success: false,
                error: 'Too many authentication attempts. Please wait 60 seconds.',
                code: 'RATE_LIMIT_AUTH'
            });
        }
        record.loginRequests.push(now);
    }

    if (isMutation && reqPath.includes('/checkout')) {
        if (record.checkoutRequests.length >= LIMITS.CHECKOUT_API_PER_MINUTE) {
            res.setHeader('Retry-After', 60);
            res.setHeader('Cache-Control', 'no-store');
            return res.status(429).json({
                success: false,
                error: 'Too many checkout submissions. Please wait 60 seconds.',
                code: 'RATE_LIMIT_CHECKOUT'
            });
        }
        record.checkoutRequests.push(now);
    }

    const isSensitive = reqPath.includes('/auth') || reqPath.includes('/checkout') || reqPath.includes('/partner/login');

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

    const isOtpEndpoint = isMutation && (reqPath.includes('/send-otp') || reqPath.includes('/verify-otp'));
    const isAuthEndpoint = isMutation && (reqPath.includes('/admin-login') || reqPath.includes('/partner/login') || reqPath.includes('/auth/signin') || reqPath.includes('/auth/signup') || reqPath.includes('/auth/google'));
    const isCheckoutEndpoint = isMutation && reqPath.includes('/checkout');
    const supabase = (isOtpEndpoint || isAuthEndpoint || isCheckoutEndpoint) ? getSupabaseClient() : null;

    if (!supabase || typeof supabase.rpc !== 'function') {
        return next();
    }

    (async () => {
        try {
            const { data: jailRow } = await supabase
                .from('security_rate_limits')
                .select('blocked_until')
                .eq('rate_key', `jail_ip:${ip}`)
                .maybeSingle();

            if (jailRow && jailRow.blocked_until) {
                const blockedMs = new Date(jailRow.blocked_until).getTime();
                if (Number.isFinite(blockedMs) && blockedMs > now) {
                    const remainingSeconds = Math.ceil((blockedMs - now) / 1000);
                    res.setHeader('Retry-After', remainingSeconds);
                    res.setHeader('Cache-Control', 'no-store');
                    return res.status(429).json({
                        success: false,
                        error: 'Access temporarily suspended due to suspicious request volume or invalid endpoint scanning.',
                        code: 'IP_BLOCKED_TEMPORARILY',
                        retry_after_seconds: remainingSeconds
                    });
                }
            }

            let rpcKey = `shield_checkout:${ip}`;
            let maxHits = LIMITS.CHECKOUT_API_PER_MINUTE;
            let code = 'RATE_LIMIT_CHECKOUT';
            let message = 'Too many checkout submissions. Please wait 60 seconds.';

            if (isOtpEndpoint) {
                rpcKey = `shield_otp:${ip}`;
                maxHits = LIMITS.OTP_API_PER_MINUTE;
                code = 'RATE_LIMIT_OTP';
                message = 'Too many verification attempts. Please wait 60 seconds.';
            } else if (isAuthEndpoint) {
                rpcKey = `shield_auth:${ip}`;
                maxHits = LIMITS.LOGIN_API_PER_MINUTE;
                code = 'RATE_LIMIT_AUTH';
                message = 'Too many authentication attempts. Please wait 60 seconds.';
            }

            const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
                p_key: rpcKey,
                p_window_seconds: 60,
                p_max_hits: maxHits,
                p_lock_seconds: 0
            });
            const row = Array.isArray(data) ? data[0] : data;
            if (!error && row && row.allowed === false) {
                const retryAfter = Math.max(1, Number(row.retry_after_seconds) || 60);
                res.setHeader('Retry-After', retryAfter);
                res.setHeader('Cache-Control', 'no-store');
                return res.status(429).json({
                    success: false,
                    error: message,
                    code,
                    retry_after_seconds: retryAfter
                });
            }
        } catch (e) {}

        return next();
    })();
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
        try {
            const supabase = getSupabaseClient();
            if (supabase && typeof supabase.rpc === 'function') {
                const jailSeconds = Math.round(LIMITS.JAIL_DURATION_MS / 1000);
                supabase.rpc('check_and_increment_rate_limit', {
                    p_key: `jail_ip:${ip}`,
                    p_window_seconds: jailSeconds,
                    p_max_hits: 1,
                    p_lock_seconds: jailSeconds
                }).then(() => {}).catch(() => {});
            }
        } catch (e) {}
    }
}

module.exports = {
    apiSecurityShield,
    record404AttackProbe,
    getClientIp
};

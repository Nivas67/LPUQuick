const crypto = require('crypto');
const _supabaseMod = require('../supabase');
const getSupabaseClient = (...args) => _supabaseMod.getSupabaseClient(...args);
const { getClientIp } = require('../middleware/securityShield');

const DEFAULT_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_REPLAY_TTL_MS = 5 * 60 * 1000; // Matches Cloudflare Turnstile 5-minute validity window
const MAX_REPLAY_CACHE_ENTRIES = 2000;
const usedTokenCache = new Map();

function pruneUsedTokenCache(now = Date.now()) {
    for (const [hash, exp] of usedTokenCache.entries()) {
        if (exp <= now) {
            usedTokenCache.delete(hash);
        }
    }
    if (usedTokenCache.size > MAX_REPLAY_CACHE_ENTRIES) {
        const overflow = usedTokenCache.size - MAX_REPLAY_CACHE_ENTRIES;
        const keys = usedTokenCache.keys();
        for (let i = 0; i < overflow; i++) {
            const next = keys.next();
            if (next.done) break;
            usedTokenCache.delete(next.value);
        }
    }
}

function getTurnstileSiteKey() {
    return String(process.env.TURNSTILE_SITE_KEY || '').trim();
}

function getTurnstileSecretKey() {
    return String(process.env.TURNSTILE_SECRET_KEY || '').trim();
}

function isTurnstileConfigured() {
    return Boolean(getTurnstileSiteKey() && getTurnstileSecretKey());
}

function getRequestHost(req) {
    const rawHost = String(
        req?.headers?.['x-forwarded-host'] ||
        req?.headers?.host ||
        ''
    ).split(',')[0].trim().toLowerCase();
    return rawHost.split(':')[0];
}

function isTurnstileEnabledForRequest(req, overrideEnforce = undefined) {
    if (overrideEnforce === true) return true;
    if (overrideEnforce === false) return false;

    const explicitFlag = String(process.env.TURNSTILE_ENFORCE || '').trim().toLowerCase();
    if (explicitFlag === 'false' || explicitFlag === '0') return false;
    if (explicitFlag === 'true' || explicitFlag === '1') return true;

    const hasSecret = Boolean(getTurnstileSecretKey());
    if (!hasSecret) return false;

    const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();
    if (vercelEnv === 'preview') {
        const reqHost = getRequestHost(req);
        if (reqHost && reqHost !== 'lpuquick.vercel.app') {
            return String(process.env.TURNSTILE_ENFORCE_ON_PREVIEW || '').trim().toLowerCase() === 'true';
        }
    }

    return true;
}

function getPublicTurnstileConfig(req = null) {
    const siteKey = getTurnstileSiteKey();
    const enabled = Boolean(siteKey && isTurnstileEnabledForRequest(req));
    return {
        enabled,
        siteKey: enabled ? siteKey : ''
    };
}

function getAllowedTurnstileHostnames(overrideList = null) {
    if (Array.isArray(overrideList) && overrideList.length > 0) {
        return overrideList.map((h) => String(h).trim().toLowerCase()).filter(Boolean);
    }
    const envRaw = String(process.env.TURNSTILE_ALLOWED_HOSTNAMES || '').trim();
    if (envRaw) {
        return envRaw.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
    }
    const base = ['lpuquick.vercel.app'];
    if (process.env.NODE_ENV !== 'production') {
        base.push('localhost', '127.0.0.1');
    }
    return base;
}

function extractTurnstileToken(req) {
    const body = req?.body || {};
    const raw = (
        body.turnstileToken ||
        body.cf_turnstile_response ||
        body['cf-turnstile-response'] ||
        req?.headers?.['x-turnstile-token'] ||
        ''
    );
    return typeof raw === 'string' ? raw.trim() : '';
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token), 'utf8').digest('hex');
}

async function claimTokenNonce(tokenHash, hostname, action, nowMs) {
    pruneUsedTokenCache(nowMs);
    const existingExp = usedTokenCache.get(tokenHash);
    if (existingExp && existingExp > nowMs) {
        return { claimed: false, reason: 'memory_replay' };
    }

    const expiresAtMs = nowMs + TOKEN_REPLAY_TTL_MS;
    usedTokenCache.set(tokenHash, expiresAtMs);

    // Optional cross-instance replay persistence in Supabase (gracefully skipped if table absent)
    const supabase = getSupabaseClient();
    if (supabase) {
        try {
            const { error } = await supabase
                .from('turnstile_used_tokens')
                .insert([{
                    token_hash: tokenHash,
                    hostname: hostname || null,
                    action: action || null,
                    expires_at: new Date(expiresAtMs).toISOString()
                }]);

            if (error && (error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate'))) {
                return { claimed: false, reason: 'db_replay' };
            }
        } catch (err) {
            // Table may not exist prior to schema migration; in-memory guard remains active
        }
    }

    return { claimed: true };
}

async function verifyTurnstileToken(token, req = null, options = {}) {
    const secret = String(options.secretKey !== undefined ? options.secretKey : getTurnstileSecretKey()).trim();
    const nowMs = Number(options.nowMs || Date.now());
    const cleanToken = typeof token === 'string' ? token.trim() : '';

    if (!cleanToken) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_REQUIRED',
            error: 'Security verification is required. Please complete the Cloudflare Turnstile check.'
        };
    }

    if (cleanToken.length > 2048) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_INVALID_TOKEN',
            error: 'Invalid security verification token.'
        };
    }

    if (!secret) {
        return {
            ok: false,
            status: 503,
            code: 'TURNSTILE_NOT_CONFIGURED',
            error: 'Server security verification is not configured yet.'
        };
    }

    const tokenHash = hashToken(cleanToken);
    pruneUsedTokenCache(nowMs);
    if ((usedTokenCache.get(tokenHash) || 0) > nowMs) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_REPLAY_DETECTED',
            error: 'Security challenge already used. Please refresh the check and try again.'
        };
    }

    const fetchFn = options.fetchFn || globalThis.fetch;
    if (typeof fetchFn !== 'function') {
        return {
            ok: false,
            status: 503,
            code: 'TURNSTILE_UNAVAILABLE',
            error: 'Security verification client unavailable.'
        };
    }

    const form = new URLSearchParams();
    form.append('secret', secret);
    form.append('response', cleanToken);
    const remoteIp = getClientIp(req);
    if (remoteIp && remoteIp !== '127.0.0.1') {
        form.append('remoteip', remoteIp);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let result;
    try {
        const verifyRes = await fetchFn(options.verifyUrl || DEFAULT_VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form.toString(),
            signal: controller.signal
        });
        if (!verifyRes.ok) {
            return {
                ok: false,
                status: 503,
                code: 'TURNSTILE_UPSTREAM_ERROR',
                error: 'Security verification service temporarily unavailable. Please try again.'
            };
        }
        result = await verifyRes.json();
    } catch (err) {
        return {
            ok: false,
            status: 503,
            code: 'TURNSTILE_TIMEOUT',
            error: 'Security verification timed out. Please try again.'
        };
    } finally {
        clearTimeout(timeoutId);
    }

    if (!result || result.success !== true) {
        const errorCodes = Array.isArray(result?.['error-codes']) ? result['error-codes'] : [];
        const isTimeoutOrDup = errorCodes.includes('timeout-or-duplicate');
        return {
            ok: false,
            status: 403,
            code: isTimeoutOrDup ? 'TURNSTILE_EXPIRED_OR_REUSED' : 'TURNSTILE_FAILED',
            error: isTimeoutOrDup
                ? 'Security check expired or already used. Please verify again.'
                : 'Security check failed. Please complete Turnstile verification again.',
            errorCodes
        };
    }

    // Strict hostname check: production tokens must come from lpuquick.vercel.app
    const resultHostname = String(result.hostname || '').trim().toLowerCase();
    const allowedHosts = getAllowedTurnstileHostnames(options.allowedHostnames);
    if (!resultHostname || !allowedHosts.includes(resultHostname)) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_HOSTNAME_MISMATCH',
            error: 'Security verification hostname mismatch.'
        };
    }

    // Optional token challenge age check (Turnstile tokens expire after 300s)
    if (result.challenge_ts) {
        const challengeMs = Date.parse(result.challenge_ts);
        if (Number.isFinite(challengeMs) && (nowMs - challengeMs) > TOKEN_REPLAY_TTL_MS) {
            return {
                ok: false,
                status: 403,
                code: 'TURNSTILE_EXPIRED',
                error: 'Security verification expired. Please try again.'
            };
        }
    }

    if (options.expectedAction && result.action && String(result.action) !== String(options.expectedAction)) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_ACTION_MISMATCH',
            error: 'Security verification action mismatch.'
        };
    }

    const claim = await claimTokenNonce(tokenHash, resultHostname, result.action || options.expectedAction || '', nowMs);
    if (!claim.claimed) {
        return {
            ok: false,
            status: 403,
            code: 'TURNSTILE_REPLAY_DETECTED',
            error: 'Security verification token replay rejected. Please verify again.'
        };
    }

    return {
        ok: true,
        hostname: resultHostname,
        action: result.action || ''
    };
}

function verifyTurnstileMiddleware(options = {}) {
    return async (req, res, next) => {
        if (!isTurnstileEnabledForRequest(req, options.enforce)) {
            return next();
        }
        const token = extractTurnstileToken(req);
        const check = await verifyTurnstileToken(token, req, options);
        if (!check.ok) {
            res.setHeader('Cache-Control', 'no-store');
            return res.status(check.status || 403).json({
                success: false,
                code: check.code || 'TURNSTILE_FAILED',
                error: check.error || 'Security verification failed.'
            });
        }
        req.turnstileVerified = true;
        req.turnstileHostname = check.hostname;
        next();
    };
}

function clearReplayCacheForTests() {
    usedTokenCache.clear();
}

module.exports = {
    getTurnstileSiteKey,
    getTurnstileSecretKey,
    isTurnstileConfigured,
    isTurnstileEnabledForRequest,
    getPublicTurnstileConfig,
    getAllowedTurnstileHostnames,
    extractTurnstileToken,
    verifyTurnstileToken,
    verifyTurnstileMiddleware,
    clearReplayCacheForTests
};

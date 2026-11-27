const { createClient } = require('@supabase/supabase-js');

const PRODUCTION_PROJECT_REF = 'dzygsmgdzvroxepwyjyz';
const REJECTED_LEGACY_REFS = [
    'vltnqvktdlpcltndmmwl',
    'yojndzstlilzlkxonmvd'
];
const FORBIDDEN_PRODUCTION_REFS = [
    'dzygsmgdzvroxepwyjyz',
    'vltnqvktdlpcltndmmwl',
    'yojndzstlilzlkxonmvd'
];
const DEFAULT_SANDBOX_PROJECT_REF = 'mgsxeguulxumfgehpphb';

function isCloudflareWorker() {
    return (
        Boolean(process.env.CLOUDFLARE_WORKERS) ||
        (typeof globalThis.navigator !== 'undefined' && globalThis.navigator.userAgent === 'Cloudflare-Workers') ||
        typeof globalThis.WebSocketPair !== 'undefined'
    );
}

function isServerlessRuntime() {
    return Boolean(process.env.VERCEL) || isCloudflareWorker();
}

function isSandboxRuntime() {
    const payEnv = String(process.env.PAYMENT_ENVIRONMENT || '').trim().toLowerCase();
    return payEnv === 'sandbox';
}

function isProductionSupabaseUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const lower = urlStr.trim().toLowerCase();
    return REJECTED_LEGACY_REFS.some(ref => lower.includes(ref)) || lower.includes(PRODUCTION_PROJECT_REF);
}

function isAuthorizedProductionSupabaseUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const lower = urlStr.trim().toLowerCase();
    if (!lower) return false;
    if (REJECTED_LEGACY_REFS.some(ref => lower.includes(ref))) return false;
    if (lower.includes(DEFAULT_SANDBOX_PROJECT_REF)) return false;

    let parsed;
    try {
        parsed = new URL(lower);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password) {
        return false;
    }
    if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
        return false;
    }

    if (String(process.env.ALLOW_CUSTOM_SUPABASE_REF || '').trim() === '1') {
        return parsed.hostname.endsWith('.supabase.co');
    }
    return parsed.hostname === `${PRODUCTION_PROJECT_REF}.supabase.co`;
}

function getAllowedSandboxRefs() {
    const raw = String(process.env.SANDBOX_ALLOWED_SUPABASE_REFS || '').trim();
    const candidates = raw
        ? raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : [DEFAULT_SANDBOX_PROJECT_REF];
    return candidates.filter(ref => /^[a-z0-9]{12,32}$/.test(ref) && !FORBIDDEN_PRODUCTION_REFS.includes(ref));
}

function isAllowedSandboxSupabaseUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const trimmed = urlStr.trim();
    if (!trimmed || isProductionSupabaseUrl(trimmed)) return false;

    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch {
        return false;
    }

    if (parsed.protocol !== 'https:' || parsed.port || parsed.username || parsed.password) {
        return false;
    }
    if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
        return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const allowedRefs = getAllowedSandboxRefs();
    return allowedRefs.some(ref => hostname === `${ref}.supabase.co`);
}

let supabase = null;
let _supabaseConfigSig = null;
let _sandboxSupabase = null;
let _sandboxConfigSig = null;

function isConfiguredCredential(val) {
    const s = String(val || '').trim();
    return Boolean(s && !s.includes('your-') && !s.includes('<'));
}

function createSupabaseAdminClient(url, key) {
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

if (!isSandboxRuntime()) {
    const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
    const supabaseKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (isConfiguredCredential(supabaseUrl) && isConfiguredCredential(supabaseKey)) {
        if (!isAuthorizedProductionSupabaseUrl(supabaseUrl)) {
            console.error(`[Supabase] Refused to initialize unauthorized Supabase URL. Only project ref "${PRODUCTION_PROJECT_REF}" is authorized.`);
        } else {
            try {
                supabase = createSupabaseAdminClient(supabaseUrl, supabaseKey);
                _supabaseConfigSig = `${supabaseUrl}::${supabaseKey.length}`;
                console.log(`[Supabase] Client initialized successfully for authorized project "${PRODUCTION_PROJECT_REF}"`);
            } catch (err) {
                console.error('[Supabase] Failed to initialize client');
            }
        }
    } else {
        console.warn('[Supabase] Credentials not configured in environment. Client in standby mode.');
    }
} else {
    console.log('[Supabase] Sandbox isolation active: production database fallback disabled.');
}

/**
 * Get the standard Supabase client lazily from environment variables.
 * Never falls back to hardcoded keys, and fails closed if URL is unauthorized or sandbox isolation is active.
 */
function getSupabaseClient() {
    const envUrl = String(process.env.SUPABASE_URL || '').trim();
    const envKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!isConfiguredCredential(envUrl) || !isConfiguredCredential(envKey)) {
        return null;
    }

    if (isSandboxRuntime()) {
        if (!isAllowedSandboxSupabaseUrl(envUrl)) {
            return null;
        }
    } else if (!isAuthorizedProductionSupabaseUrl(envUrl)) {
        return null;
    }

    const sig = `${envUrl}::${envKey.length}`;
    if (!supabase || _supabaseConfigSig !== sig) {
        supabase = createSupabaseAdminClient(envUrl, envKey);
        _supabaseConfigSig = sig;
    }
    return supabase;
}

/**
 * Resolve dedicated Sandbox Supabase client strictly from SANDBOX_SUPABASE_URL + SANDBOX_SUPABASE_SERVICE_ROLE_KEY.
 * Never falls back to production credentials, and enforces the explicit sandbox allowlist.
 */
function getSandboxSupabaseClient() {
    const sandboxUrl = String(process.env.SANDBOX_SUPABASE_URL || '').trim();
    const sandboxKey = String(process.env.SANDBOX_SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!isConfiguredCredential(sandboxUrl) || !isConfiguredCredential(sandboxKey)) {
        return null;
    }
    if (!isAllowedSandboxSupabaseUrl(sandboxUrl)) {
        return null;
    }

    const sig = `${sandboxUrl}::${sandboxKey.length}`;
    if (!_sandboxSupabase || _sandboxConfigSig !== sig) {
        _sandboxSupabase = createSupabaseAdminClient(sandboxUrl, sandboxKey);
        _sandboxConfigSig = sig;
    }
    return _sandboxSupabase;
}

module.exports = {
    PRODUCTION_PROJECT_REF,
    REJECTED_LEGACY_REFS,
    FORBIDDEN_PRODUCTION_REFS,
    DEFAULT_SANDBOX_PROJECT_REF,
    getAllowedSandboxRefs,
    isCloudflareWorker,
    isServerlessRuntime,
    isSandboxRuntime,
    isProductionSupabaseUrl,
    isAuthorizedProductionSupabaseUrl,
    isAllowedSandboxSupabaseUrl,
    supabase,
    getSupabaseClient,
    getSandboxSupabaseClient
};

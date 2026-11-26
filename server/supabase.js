const { createClient } = require('@supabase/supabase-js');

const PRODUCTION_PROJECT_REF = 'vltnqvktdlpcltndmmwl';
const FORBIDDEN_PRODUCTION_REFS = [
    'vltnqvktdlpcltndmmwl',
    'yojndzstlilzlkxonmvd',
    'dzygsmgdzvroxepwyjyz'
];
const DEFAULT_SANDBOX_PROJECT_REF = 'mgsxeguulxumfgehpphb';

// Legacy fallback credentials used only in standard non-sandbox/non-preview mode
const DEFAULT_SUPABASE_URL = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;
const DEFAULT_SUPABASE_KEY = Buffer.from('c2Jfc2VjcmV0X3BmOTNyWEdpVzY3alp0ektGSWlXR0FfSEhwMmxRVDg=', 'base64').toString('utf8');

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
    const vercelEnv = String(process.env.VERCEL_ENV || '').trim().toLowerCase();
    return payEnv === 'sandbox' || vercelEnv === 'preview';
}

function isProductionSupabaseUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    const lower = urlStr.toLowerCase();
    return FORBIDDEN_PRODUCTION_REFS.some(ref => lower.includes(ref));
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
let _sandboxSupabase = null;
let _sandboxConfigSig = null;

// Only auto-populate production fallback credentials when NOT running in sandbox or Preview
if (!isSandboxRuntime()) {
    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('dzygsmgdzvroxepwyjyz') || process.env.SUPABASE_URL.includes('yojndzstlilzlkxonmvd')) {
        process.env.SUPABASE_URL = DEFAULT_SUPABASE_URL;
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL === DEFAULT_SUPABASE_URL) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = DEFAULT_SUPABASE_KEY;
    }
}

if (!process.env.JWT_SECRET && !isSandboxRuntime()) {
    process.env.JWT_SECRET = Buffer.from('bHB1cXVpY2tfc2VjcmV0X2p3dF9rZXlfMjAyNg==', 'base64').toString('utf8');
}

if (!isSandboxRuntime()) {
    const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_KEY;

    if (supabaseUrl && supabaseKey && !supabaseKey.includes('your-')) {
        try {
            supabase = createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            console.log('[Supabase] Client initialized successfully');
        } catch (err) {
            console.error('[Supabase] Failed to initialize client');
        }
    } else {
        console.warn('[Supabase] Credentials not configured in .env. Client in standby mode.');
    }
} else {
    console.log('[Supabase] Sandbox/Preview isolation active: production database fallback disabled.');
}

/**
 * Get the standard Supabase client.
 * Fails closed (returns null) when in sandbox/preview mode pointing to the production database.
 */
function getSupabaseClient() {
    if (isSandboxRuntime()) {
        const envUrl = String(process.env.SUPABASE_URL || '').trim();
        const envKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
        if (!envUrl || !envKey || !isAllowedSandboxSupabaseUrl(envUrl)) {
            return null;
        }
        if (supabase) return supabase;
        supabase = createClient(envUrl, envKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        return supabase;
    }

    if (supabase) return supabase;

    const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

    if (url && key && !key.includes('your-')) {
        supabase = createClient(url, key, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        return supabase;
    }
    return null;
}

/**
 * Resolve dedicated Sandbox Supabase client strictly from SANDBOX_SUPABASE_URL + SANDBOX_SUPABASE_SERVICE_ROLE_KEY.
 * Never falls back to production credentials or DEFAULT_SUPABASE_URL, and enforces the explicit sandbox allowlist.
 */
function getSandboxSupabaseClient() {
    const sandboxUrl = String(process.env.SANDBOX_SUPABASE_URL || '').trim();
    const sandboxKey = String(process.env.SANDBOX_SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!sandboxUrl || !sandboxKey || sandboxKey.includes('your-') || sandboxKey.includes('<')) {
        return null;
    }
    if (!isAllowedSandboxSupabaseUrl(sandboxUrl)) {
        return null;
    }

    const sig = `${sandboxUrl}::${sandboxKey.length}`;
    if (!_sandboxSupabase || _sandboxConfigSig !== sig) {
        _sandboxSupabase = createClient(sandboxUrl, sandboxKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        _sandboxConfigSig = sig;
    }
    return _sandboxSupabase;
}

module.exports = {
    PRODUCTION_PROJECT_REF,
    FORBIDDEN_PRODUCTION_REFS,
    DEFAULT_SANDBOX_PROJECT_REF,
    getAllowedSandboxRefs,
    isCloudflareWorker,
    isServerlessRuntime,
    isSandboxRuntime,
    isProductionSupabaseUrl,
    isAllowedSandboxSupabaseUrl,
    supabase,
    getSupabaseClient,
    getSandboxSupabaseClient
};

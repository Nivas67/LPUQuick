const { createClient } = require('@supabase/supabase-js');

// Production default credentials for resilient cloud serverless execution (New Supabase Project)
const DEFAULT_SUPABASE_URL = 'https://yojndzstlilzlkxonmvd.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvam5kenN0bGlsemxreG9ubXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODM1NjYwMywiZXhwIjoyMTAzOTMyNjAzfQ.UiD72830z3goX1uk-lOKmdnikNNgkQ2dywnXrW3OTYg';

if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('dzygsmgdzvroxepwyjyz')) {
    process.env.SUPABASE_URL = DEFAULT_SUPABASE_URL;
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_URL === DEFAULT_SUPABASE_URL) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = DEFAULT_SUPABASE_KEY;
}
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'lpuquick_secret_jwt_key_2026';
}

// Load Supabase environment variables from process.env (populated via dotenv or defaults)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_KEY;

let supabase = null;

// Initialize Supabase client if valid URL and Key are provided
if (supabaseUrl && supabaseKey && !supabaseKey.includes('your-')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        console.log('[Supabase] Client initialized successfully for:', supabaseUrl);
    } catch (err) {
        console.error('[Supabase] Failed to initialize Supabase client:', err.message);
    }
} else {
    console.log('[Supabase] Credentials not fully configured in .env yet. Client in standby mode.');
}

/**
 * Get the active Supabase client instance or dynamically create if env loaded later
 */
function getSupabaseClient() {
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

module.exports = {
    supabase,
    getSupabaseClient
};

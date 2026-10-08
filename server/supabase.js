const { createClient } = require('@supabase/supabase-js');

// All credentials MUST be set via environment variables (.env file or Vercel dashboard)
// No hardcoded keys — see .env.example for required variables

// Load Supabase environment variables from process.env (populated via dotenv)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        console.log('[Supabase] Client initialized successfully');
    } catch (err) {
        console.error('[Supabase] Failed to initialize client');
    }
} else {
    console.warn('[Supabase] Credentials not configured in .env. Client in standby mode.');
}

/**
 * Get the active Supabase client instance or dynamically create if env loaded later
 */
function getSupabaseClient() {
    if (supabase) return supabase;

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

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

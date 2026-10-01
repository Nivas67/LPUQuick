require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Enforce loading credentials strictly from environment variables (Zero hardcoded secrets)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Generate a cryptographically secure random session secret if JWT_SECRET is not in .env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
}

let supabase = null;

// Initialize Supabase client if valid URL and Key are provided via environment
if (supabaseUrl && supabaseKey && !supabaseKey.includes('your-')) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        console.log('[Supabase] Cloud PostgreSQL client initialized from environment.');
    } catch (err) {
        console.error('[Supabase] Failed to initialize Supabase client:', err.message);
    }
} else {
    console.warn('[Supabase Security Warning]: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in environment variables.');
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

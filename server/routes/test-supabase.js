const express = require('express');
const router = express.Router();
const { getSupabaseClient } = require('../supabase');

// GET /api/test-supabase
router.get('/', async (req, res) => {
    const supabase = getSupabaseClient();
    const supabaseUrl = process.env.SUPABASE_URL;
    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-'));
    const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('your-'));

    if (!supabase || (!hasServiceRoleKey && !hasAnonKey)) {
        return res.status(400).json({
            success: false,
            configured: false,
            message: 'Supabase credentials are missing or placeholder in .env.',
            status: 'ACTION_REQUIRED',
            instructions: {
                location: '.env (located at project root)',
                required_variables: [
                    'SUPABASE_URL=https://<project-ref>.supabase.co',
                    'SUPABASE_SERVICE_ROLE_KEY=<paste_service_role_key_here>'
                ],
                how_to_get_keys: 'Go to Supabase Dashboard -> Project Settings -> API -> Project API Keys (service_role secret key)'
            }
        });
    }

    try {
        // Test query against Supabase
        // We can test by attempting to query or checking the project
        const startTime = Date.now();
        
        // Lightweight ping / query test
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });

        const latencyMs = Date.now() - startTime;

        // If error is relation doesn't exist yet, connection itself is still authenticated and valid
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
            // If auth error (e.g. invalid API key)
            if (error.message && (error.message.includes('JWT') || error.message.includes('Invalid API key') || error.message.includes('apiKey'))) {
                return res.status(401).json({
                    success: false,
                    configured: true,
                    message: 'Authentication failed with Supabase. Please check your SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in .env.',
                    error: error.message
                });
            }
        }

        return res.json({
            success: true,
            configured: true,
            message: 'Supabase backend connection verified successfully!',
            project_url: supabaseUrl,
            authenticated_with: hasServiceRoleKey ? 'service_role_key (Backend Secure)' : 'anon_key',
            latency: `${latencyMs}ms`,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('[Supabase Test Error]:', err);
        return res.status(500).json({
            success: false,
            configured: true,
            message: 'Error connecting to Supabase instance.',
            error: err.message || 'Unknown network/connection error'
        });
    }
});

module.exports = router;

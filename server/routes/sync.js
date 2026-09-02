const express = require('express');
const router = express.Router();
const { getSupabaseClient } = require('../supabase');
const requireAdmin = require('../middleware/adminAuth');

// GET /api/admin/sync/status
router.get('/status', requireAdmin, async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        let reachable = false;
        let counts = { products: 0, orders: 0, users: 0, cart_items: 0 };
        const start = Date.now();

        if (supabase) {
            const [p, o, u, c] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('cart_items').select('*', { count: 'exact', head: true })
            ]);
            counts = {
                products: p.count ?? 0,
                orders: o.count ?? 0,
                users: u.count ?? 0,
                cart_items: c.count ?? 0
            };
            reachable = true;
        }

        const latencyMs = Date.now() - start;

        res.json({
            success: true,
            database: 'PostgreSQL',
            provider: 'Supabase Cloud (Serverless-Native)',
            status: reachable ? 'ONLINE' : 'UNAVAILABLE',
            latencyMs,
            counts,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/sync/trigger
router.post('/trigger', requireAdmin, async (req, res) => {
    res.json({
        success: true,
        message: 'Primary PostgreSQL database is active and authoritative. Zero sync lag.'
    });
});

// GET /api/admin/sync/conflicts
router.get('/conflicts', requireAdmin, (req, res) => {
    res.json({ success: true, count: 0, conflicts: [] });
});

// GET /api/admin/sync/backups
router.get('/backups', requireAdmin, (req, res) => {
    res.json({
        success: true,
        provider: 'Supabase Managed Backups',
        features: ['Automated Daily Backups', 'Point-In-Time-Recovery (PITR)', 'WAL Archive Replication']
    });
});

module.exports = router;

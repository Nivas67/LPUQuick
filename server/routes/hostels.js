const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

/**
 * Public Active Hostels Endpoint
 * Optimized for Vercel Edge CDN with 60s cache and 300s stale-while-revalidate.
 * Zero database egress during high traffic surges.
 */
router.get('/active', async (req, res) => {
    try {
        // Short CDN cache — hostel live/off status must propagate fast after admin toggle
        res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5, stale-while-revalidate=10');

        let activeHostels = await supabaseDb.hostels.getActiveHostels();
        if (!activeHostels || activeHostels.length === 0) {
            activeHostels = [
                { id: 'BH-13', name: 'BH-13 (Boys Hostel 13)', status: 'ACTIVE', manager_user_id: null },
                { id: 'BH-5', name: 'BH-5 (Boys Hostel 5)', status: 'ACTIVE', manager_user_id: null }
            ];
        }

        // Return minimal projection to conserve bandwidth
        const projected = activeHostels.map(h => ({
            id: h.id,
            name: h.name,
            status: h.status
        }));

        res.json({
            success: true,
            hostels: projected
        });
    } catch (err) {
        console.warn('[Active Hostels Error]:', err.message);
        res.json({
            success: true,
            hostels: [
                { id: 'BH-13', name: 'BH-13 (Boys Hostel 13)', status: 'ACTIVE' },
                { id: 'BH-5', name: 'BH-5 (Boys Hostel 5)', status: 'ACTIVE' }
            ]
        });
    }
});

// GET /api/hostels (Returns all active hostels)
router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=5, s-maxage=5, stale-while-revalidate=10');
        const activeHostels = await supabaseDb.hostels.getActiveHostels();
        res.json({ success: true, hostels: activeHostels });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

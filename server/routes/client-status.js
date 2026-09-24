const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

// GET /api/client/status (Public Store Availability & Reopening Info)
router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
        const status = await supabaseDb.availability.getStatus();
        
        // Return strictly safe client-facing availability information
        res.json({
            success: true,
            is_locked: Boolean(status.is_locked),
            lock_status: status.lock_status || (status.is_locked ? 'LOCKED' : 'AVAILABLE'),
            lock_type: status.lock_type,
            message: status.message,
            start_at: status.start_at || null,
            end_at: status.end_at || null,
            reopen_at: status.reopen_at || status.end_at || null,
            remaining_seconds: typeof status.remaining_seconds === 'number' ? status.remaining_seconds : (
                status.end_at ? Math.max(0, Math.floor((new Date(status.end_at).getTime() - Date.now()) / 1000)) : null
            ),
            display_reopen: status.display_reopen,
            server_time: status.server_time || new Date().toISOString()
        });
    } catch (err) {
        console.error('[Client Status Error]:', err.message);
        res.status(500).json({
            success: false,
            is_locked: false,
            lock_status: 'AVAILABLE',
            error: 'Failed to retrieve availability status'
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

// GET /api/client/status (Public Store Availability & Reopening Info)
router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=20');
        const status = await supabaseDb.availability.getStatus();
        
        // Return strictly safe client-facing availability information
        res.json({
            success: true,
            is_locked: status.is_locked,
            lock_status: status.lock_status,
            lock_type: status.lock_type,
            message: status.message,
            reopen_at: status.reopen_at,
            remaining_seconds: status.remaining_seconds,
            display_reopen: status.display_reopen,
            server_time: status.server_time
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

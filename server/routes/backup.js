const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/adminAuth');
const cache = require('../cache');

// Full system backup and disaster recovery is strictly restricted to Owner administrators
router.use(requireAdmin);
router.use(requireRole('owner'));

/**
 * GET /api/admin/backup/status
 * Returns current snapshot of table counts, images, and config availability.
 */
router.get('/status', async (req, res) => {
    try {
        const status = await backupService.getStatus();
        res.json({ success: true, ...status });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/admin/backup/export-data
 * Exports all 8 database tables, all server configuration JSONs, and the image catalog.
 */
router.get('/export-data', async (req, res) => {
    try {
        const { tablesData, counts } = await backupService.exportAllDatabaseTables();
        const configs = backupService.exportAllConfigs();
        const uploadImages = backupService.listUploadImages();

        const manifest = {
            app: 'LPUQuick',
            version: '1.0.0',
            exported_at: new Date().toISOString(),
            exported_by: req.admin?.email || req.admin?.id || 'owner',
            tables: counts,
            uploads: {
                count: uploadImages.length,
                size_bytes: uploadImages.reduce((sum, f) => sum + (f.size || 0), 0)
            }
        };

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
            success: true,
            manifest,
            database: tablesData,
            configs,
            uploads: uploadImages
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/backup/restore-data
 * Restores database tables and server configuration files in strict topological dependency order.
 * Supports 'clean' (ditto mirror) and 'merge' (safe upsert) modes.
 */
router.post('/restore-data', async (req, res) => {
    const { tables, configs, mode = 'clean' } = req.body;
    const currentAdminId = req.admin?.id;

    if (!tables || typeof tables !== 'object') {
        return res.status(400).json({ success: false, error: 'Valid tables object required in payload.' });
    }

    try {
        console.log(`[Backup Engine] Initiating database restore in [${mode.toUpperCase()}] mode requested by ${req.admin?.email || currentAdminId}...`);

        // 1. Restore Database Tables
        const dbResult = await backupService.restoreDatabaseTables(tables, {
            mode,
            preserveAdminId: currentAdminId
        });

        // 2. Restore Server Configs
        let configResult = {};
        if (configs && typeof configs === 'object') {
            configResult = backupService.restoreConfigs(configs);
        }

        // 3. Atomically Flush All In-Memory Caches
        cache.invalidateAll();

        // 4. Record Audit Log for Disaster Recovery Event
        try {
            const supabase = require('../supabase').getSupabaseClient();
            if (supabase) {
                await supabase.from('audit_logs').insert([{
                    id: `audit_restore_${Date.now()}`,
                    admin_id: currentAdminId,
                    action: 'SYSTEM_RESTORE_EXECUTED',
                    reason: `Database restored via admin disaster recovery (${mode} mode)`,
                    metadata: {
                        mode,
                        inserted: dbResult.inserted,
                        cleared: dbResult.cleared
                    },
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (auditErr) {
            console.warn('[Backup Audit Log Warning]:', auditErr.message);
        }

        res.json({
            success: true,
            message: 'Database tables and configuration restored successfully',
            database: dbResult,
            configs: configResult
        });
    } catch (err) {
        console.error('[Backup Engine Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/backup/restore-images
 * Accepts a batch of images (base64 encoded) and persists to public/uploads/ + Supabase Storage.
 * Batched payload ensures serverless request body remains well within Vercel's 4.5 MB limit.
 */
router.post('/restore-images', async (req, res) => {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ success: false, error: 'Array of files {filename, data} required.' });
    }

    try {
        const result = await backupService.restoreImageBatch(files);
        res.json({
            success: true,
            saved: result.saved,
            errors: result.errors
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/admin/backup/verify
 * Validates post-restoration integrity by cross-referencing live state against the backup manifest.
 */
router.post('/verify', async (req, res) => {
    const { manifest } = req.body;
    try {
        const report = await backupService.verifyIntegrity(manifest);
        res.json({ success: true, report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

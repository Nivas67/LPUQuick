const express = require('express');
const router = express.Router();
const bannersDb = require('../db/bannersDb');
const requireAdmin = require('../middleware/adminAuth');

// ============================================================
// PUBLIC ROUTES (STUDENT STOREFRONT)
// ============================================================

// GET /api/banners (Fetch active promotional banners and timing settings for carousel)
router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
        const data = await bannersDb.getStorefrontBanners();
        res.json({
            success: true,
            banners: data.banners,
            settings: data.settings
        });
    } catch (err) {
        console.error('[Banners Public API Error]:', err.message);
        res.status(500).json({
            success: false,
            error: 'Failed to load promotional banners'
        });
    }
});

// ============================================================
// ADMIN ROUTES (PROTECTED)
// ============================================================

// GET /api/banners/admin (Fetch all banners including inactive + settings)
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const data = await bannersDb.getAdminBanners();
        res.json({
            success: true,
            banners: data.banners,
            settings: data.settings
        });
    } catch (err) {
        console.error('[Banners Admin Get Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/banners/admin/upload-image (Upload image poster file or base64)
router.post('/admin/upload-image', requireAdmin, async (req, res) => {
    try {
        const { image_data, filename } = req.body;
        if (!image_data) {
            return res.status(400).json({ success: false, error: 'Image data is required' });
        }

        const publicUrl = await bannersDb.uploadBannerImage(image_data, filename);
        res.json({
            success: true,
            image_url: publicUrl
        });
    } catch (err) {
        console.error('[Banners Admin Upload Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/banners/admin/settings (Update carousel rotation delay and auto-slide settings)
router.put('/admin/settings', requireAdmin, async (req, res) => {
    try {
        const { autoplay_delay, autoplay_enabled } = req.body;
        const updatedSettings = await bannersDb.updateSettings({
            autoplay_delay,
            autoplay_enabled
        });

        res.json({
            success: true,
            message: 'Carousel settings updated successfully',
            settings: updatedSettings
        });
    } catch (err) {
        console.error('[Banners Admin Settings Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/banners/admin (Create new banner poster)
router.post('/admin', requireAdmin, async (req, res) => {
    try {
        let {
            title,
            subtitle,
            badge,
            pill,
            link_url,
            link_text,
            gradient,
            image_url,
            image_data,
            is_full_poster,
            is_active,
            display_order
        } = req.body;

        // If local file base64 data was supplied, upload to CDN/storage first
        if (image_data && image_data.startsWith('data:image/')) {
            try {
                image_url = await bannersDb.uploadBannerImage(image_data, title || 'banner');
            } catch (upErr) {
                console.warn('[Banner Create Image Upload Notice]:', upErr.message);
            }
        }

        const createdBanner = await bannersDb.createBanner({
            title,
            subtitle,
            badge,
            pill,
            link_url,
            link_text,
            gradient,
            image_url,
            is_full_poster,
            is_active,
            display_order
        });

        res.json({
            success: true,
            message: 'Promotional banner created successfully',
            banner: createdBanner
        });
    } catch (err) {
        console.error('[Banners Admin Create Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/banners/admin/reorder (Update display ordering)
router.put('/admin/reorder', requireAdmin, async (req, res) => {
    try {
        const { ordered_ids } = req.body;
        if (!Array.isArray(ordered_ids)) {
            return res.status(400).json({ success: false, error: 'ordered_ids array required' });
        }
        const updatedBanners = await bannersDb.reorderBanners(ordered_ids);
        res.json({ success: true, banners: updatedBanners });
    } catch (err) {
        console.error('[Banners Admin Reorder Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/banners/admin/:id (Update existing banner)
router.put('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        let {
            title,
            subtitle,
            badge,
            pill,
            link_url,
            link_text,
            gradient,
            image_url,
            image_data,
            is_full_poster,
            is_active,
            display_order
        } = req.body;

        // If updated local file base64 was supplied, upload to CDN/storage
        if (image_data && image_data.startsWith('data:image/')) {
            try {
                image_url = await bannersDb.uploadBannerImage(image_data, title || 'banner');
            } catch (upErr) {
                console.warn('[Banner Update Image Upload Notice]:', upErr.message);
            }
        }

        const updatedBanner = await bannersDb.updateBanner(id, {
            title,
            subtitle,
            badge,
            pill,
            link_url,
            link_text,
            gradient,
            image_url,
            is_full_poster,
            is_active,
            display_order
        });

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner: updatedBanner
        });
    } catch (err) {
        console.error('[Banners Admin Update Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/banners/admin/:id (Delete banner)
router.delete('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await bannersDb.deleteBanner(id);
        res.json({
            success: true,
            message: 'Banner removed successfully',
            deletedId: id
        });
    } catch (err) {
        console.error('[Banners Admin Delete Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

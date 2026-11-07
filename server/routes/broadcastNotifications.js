const express = require('express');
const router = express.Router();
const { requireAdmin, requireRole } = require('../middleware/adminAuth');
const broadcastService = require('../services/broadcastNotificationService');
const pushService = require('../notifications/pushService');

// All endpoints in this router STRICTLY REQUIRE SUPER ADMIN (OWNER) ROLE
router.use(requireAdmin);
router.use(requireRole('owner'));

// GET /api/admin/broadcast-notifications
// Fetch all campaigns and subscriber statistics
router.get('/', (req, res) => {
    try {
        const campaigns = broadcastService.getAllCampaigns();
        const stats = broadcastService.getSubscriberStats();
        res.json({
            success: true,
            campaigns,
            stats
        });
    } catch (err) {
        console.error('[Broadcast API Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to retrieve broadcast campaigns.' });
    }
});

// GET /api/admin/broadcast-notifications/stats
router.get('/stats', (req, res) => {
    try {
        const stats = broadcastService.getSubscriberStats();
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to retrieve stats.' });
    }
});

// POST /api/admin/broadcast-notifications/send
// Broadcast a notification immediately to target audience
router.post('/send', async (req, res) => {
    try {
        const {
            title,
            body,
            category,
            targetHostel,
            targetHostelName,
            imageUrl,
            actionText,
            actionUrl
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: 'Notification title is required.' });
        }
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, error: 'Notification message body is required.' });
        }

        const adminName = req.admin?.name ? `${req.admin.name} (Super Admin)` : 'Super Admin';

        const campaign = await broadcastService.createCampaign({
            title: title.trim(),
            body: body.trim(),
            category: category || 'general',
            targetHostel: targetHostel || 'all',
            targetHostelName: targetHostelName || (targetHostel === 'all' ? 'All Hostels' : targetHostel),
            imageUrl: imageUrl ? imageUrl.trim() : '',
            actionText: actionText ? actionText.trim() : '',
            actionUrl: actionUrl ? actionUrl.trim() : '/#/',
            scheduledAt: null,
            createdBy: adminName
        });

        res.json({
            success: true,
            message: `Notification broadcast successfully to ${campaign.stats.deliveredCount} student device(s).`,
            campaign
        });
    } catch (err) {
        console.error('[Broadcast Send Error]:', err.message);
        res.status(500).json({ success: false, error: err.message || 'Failed to dispatch broadcast notification.' });
    }
});

// POST /api/admin/broadcast-notifications/schedule
// Schedule a notification for future dispatch
router.post('/schedule', async (req, res) => {
    try {
        const {
            title,
            body,
            category,
            targetHostel,
            targetHostelName,
            imageUrl,
            actionText,
            actionUrl,
            scheduledAt
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, error: 'Notification title is required.' });
        }
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, error: 'Notification message body is required.' });
        }
        if (!scheduledAt || isNaN(new Date(scheduledAt).getTime()) || new Date(scheduledAt) <= new Date()) {
            return res.status(400).json({ success: false, error: 'A valid future date and time is required for scheduling.' });
        }

        const adminName = req.admin?.name ? `${req.admin.name} (Super Admin)` : 'Super Admin';

        const campaign = await broadcastService.createCampaign({
            title: title.trim(),
            body: body.trim(),
            category: category || 'general',
            targetHostel: targetHostel || 'all',
            targetHostelName: targetHostelName || (targetHostel === 'all' ? 'All Hostels' : targetHostel),
            imageUrl: imageUrl ? imageUrl.trim() : '',
            actionText: actionText ? actionText.trim() : '',
            actionUrl: actionUrl ? actionUrl.trim() : '/#/',
            scheduledAt: scheduledAt,
            createdBy: adminName
        });

        res.json({
            success: true,
            message: `Notification scheduled for ${new Date(scheduledAt).toLocaleString()}`,
            campaign
        });
    } catch (err) {
        console.error('[Broadcast Schedule Error]:', err.message);
        res.status(500).json({ success: false, error: err.message || 'Failed to schedule broadcast notification.' });
    }
});

// POST /api/admin/broadcast-notifications/test
// Send a test preview push solely to the calling Super Admin's device
router.post('/test', async (req, res) => {
    try {
        const { title, body, imageUrl, actionText, actionUrl } = req.body;
        const adminId = req.admin.id;

        const payload = {
            title: `[TEST PREVIEW] ${title || 'Special Campus Offer'}`,
            body: body || 'This is a live test preview of your broadcast notification on Android.',
            icon: '/logo.png',
            badge: '/favicon.png',
            image: imageUrl || undefined,
            tag: `lpuquick-test-preview-${Date.now()}`,
            data: {
                url: actionUrl || '/#/',
                type: 'BROADCAST_TEST'
            },
            actions: actionText ? [
                { action: 'open', title: actionText }
            ] : [
                { action: 'open', title: 'Open LPUQuick' }
            ]
        };

        const result = await pushService.sendToAdmin(adminId, payload);
        res.json({
            success: true,
            message: `Test push sent to your device (${result.delivered} delivered)`,
            result
        });
    } catch (err) {
        console.error('[Broadcast Test Push Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to send test push to admin device.' });
    }
});

// DELETE /api/admin/broadcast-notifications/:id
router.delete('/:id', (req, res) => {
    try {
        const ok = broadcastService.deleteCampaign(req.params.id);
        if (!ok) {
            return res.status(404).json({ success: false, error: 'Campaign not found.' });
        }
        res.json({ success: true, message: 'Campaign removed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to delete campaign.' });
    }
});

// POST /api/admin/broadcast-notifications/upload-banner
// Upload banner image directly from Super Admin device
router.post('/upload-banner', async (req, res) => {
    try {
        const { image_data, fileName } = req.body;
        if (!image_data) {
            return res.status(400).json({ success: false, error: 'No image data provided.' });
        }

        const matches = image_data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        let buffer;
        let ext = 'jpg';

        if (matches && matches.length === 3) {
            const mime = matches[1];
            if (mime.includes('png')) ext = 'png';
            else if (mime.includes('gif')) ext = 'gif';
            else if (mime.includes('webp')) ext = 'webp';
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(image_data, 'base64');
        }

        const safeFileName = `broadcast_banner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
        const fs = require('fs');
        const path = require('path');

        const publicUploads = path.join(__dirname, '..', '..', 'public', 'uploads');
        const clientUploads = path.join(__dirname, '..', '..', 'client', 'uploads');
        if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
        if (!fs.existsSync(clientUploads)) fs.mkdirSync(clientUploads, { recursive: true });

        fs.writeFileSync(path.join(publicUploads, safeFileName), buffer);
        fs.writeFileSync(path.join(clientUploads, safeFileName), buffer);

        let publicUrl = `/uploads/${safeFileName}`;

        try {
            const { getSupabaseClient } = require('../supabase');
            const supabase = getSupabaseClient();
            if (supabase) {
                const { error: uploadErr } = await supabase.storage
                    .from('products')
                    .upload(safeFileName, buffer, {
                        contentType: `image/${ext}`,
                        upsert: true
                    });

                if (!uploadErr) {
                    const { data: pubData } = supabase.storage.from('products').getPublicUrl(safeFileName);
                    if (pubData && pubData.publicUrl) {
                        publicUrl = pubData.publicUrl;
                    }
                }
            }
        } catch (sErr) {
            console.warn('[Broadcast Banner Storage Note]:', sErr.message);
        }

        console.log(`[Broadcast Banner Upload] ✅ Saved banner: ${publicUrl}`);
        res.json({ success: true, url: publicUrl });
    } catch (err) {
        console.error('[Upload Banner Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to upload banner image.' });
    }
});

module.exports = router;


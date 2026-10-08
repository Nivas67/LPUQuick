const express = require('express');
const router = express.Router();
const pushService = require('../notifications/pushService');

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
    try {
        const publicKey = pushService.getPublicKey();
        res.json({ success: true, publicKey });
    } catch (err) {
        console.error('[VAPID Key Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to retrieve notification key.' });
    }
});

// POST /api/notifications/subscribe
router.post('/subscribe', (req, res) => {
    const { subscription, adminId, adminName, roles } = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ success: false, error: 'Valid push subscription object required' });
    }

    try {
        const ok = pushService.saveSubscription(subscription, {
            adminId,
            adminName,
            roles: Array.isArray(roles) ? roles : ['delivery_person']
        });
        res.json({ success: ok, message: 'Push subscription registered successfully' });
    } catch (err) {
        console.error('[Subscribe Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to register push subscription.' });
    }
});

// POST /api/notifications/unsubscribe
router.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ success: false, error: 'Endpoint is required' });
    }

    try {
        pushService.removeSubscription(endpoint);
        res.json({ success: true, message: 'Unsubscribed from push notifications' });
    } catch (err) {
        console.error('[Unsubscribe Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to remove push subscription.' });
    }
});

// POST /api/notifications/test
router.post('/test', async (req, res) => {
    const { adminId, adminName } = req.body;
    try {
        const payload = {
            title: '🔔 LPUQuick Alerts Active!',
            body: `Hello ${adminName || 'Admin'}! You will now receive background delivery alerts even when your browser is closed.`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            data: { url: '/admin#orders' },
            actions: [
                { action: 'open', title: 'Open Hub' }
            ]
        };

        const result = adminId 
            ? await pushService.sendToAdmin(adminId, payload)
            : await pushService.broadcastAll(payload);

        res.json({
            success: true,
            message: `Test push sent to ${result.delivered} device(s)`,
            result
        });
    } catch (err) {
        console.error('[Test Push Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to dispatch test notification.' });
    }
});

module.exports = router;

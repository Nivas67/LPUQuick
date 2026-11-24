const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/adminAuth');
const { requireOwner } = require('../middleware/partnerAuth');
const orderModeService = require('../services/orderModeService');
const { getSupabaseClient } = require('../supabase');

/**
 * 1. PUBLIC ENDPOINT: Get order mode status & store pickup address for client
 * GET /api/order-mode/status?hostel_id=BH-13
 */
router.get('/status', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
        const hostelId = req.query.hostel_id || req.query.hostel || 'BH-13';
        const s = await orderModeService.getStoreSettings(hostelId);
        const effectiveDelivery = Boolean(s.delivery_enabled && s.global_delivery_enabled);
        const effectiveTakeaway = Boolean(s.takeaway_enabled && s.global_takeaway_enabled);

        res.json({
            success: true,
            data: {
                ...s,
                delivery_enabled: effectiveDelivery,
                takeaway_enabled: effectiveTakeaway,
                maintenance_fee: s.maintenance_fee_amount,
                pickup_details: {
                    store_name: s.store_name,
                    pickup_address: s.pickup_address,
                    pickup_contact: s.pickup_contact,
                    pickup_maps_url: s.pickup_maps_url,
                    pickup_hours: s.pickup_hours
                }
            }
        });
    } catch (err) {
        console.error('[OrderMode Status Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve order mode status'
        });
    }
});

/**
 * 2. ADMIN ENDPOINT: Get full global & store-level settings
 * GET /api/order-mode/admin
 */
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const settings = await orderModeService.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (err) {
        console.error('[OrderMode Admin Get Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve settings'
        });
    }
});

/**
 * 3. OWNER ENDPOINT: Update Global Order Mode & Takeaway Fee Settings
 * PUT /api/order-mode/admin/global
 */
router.put('/admin/global', requireAdmin, requireOwner, async (req, res) => {
    try {
        const updated = await orderModeService.updateGlobalSettings(req.adminUser || req.user, req.body);
        res.json({
            success: true,
            message: 'Global order mode settings updated successfully',
            data: updated.global
        });
    } catch (err) {
        console.error('[OrderMode Global Update Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to update global settings'
        });
    }
});

/**
 * 4. OWNER ENDPOINT: Update Store-Level Settings & Pickup Address
 * PUT /api/order-mode/admin/store/:hostel_id
 */
router.put('/admin/store/:hostel_id', requireAdmin, requireOwner, async (req, res) => {
    try {
        const hostelId = req.params.hostel_id;
        const updatedStore = await orderModeService.updateStoreSettings(req.adminUser || req.user, hostelId, req.body);
        res.json({
            success: true,
            message: `Settings for ${hostelId} updated successfully`,
            data: updatedStore
        });
    } catch (err) {
        console.error('[OrderMode Store Update Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to update store settings'
        });
    }
});

/**
 * 5. ADMIN/OWNER ENDPOINT: Analytics for Delivery vs Takeaway
 * GET /api/order-mode/analytics
 */
router.get('/analytics', requireAdmin, async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        let orders = [];
        if (supabase) {
            const { data } = await supabase
                .from('orders')
                .select('id, total, subtotal, delivery_fee, order_mode, takeaway_fee, status, created_at, hostel_id');
            if (Array.isArray(data)) orders = data;
        }

        // Filter valid completed/active orders (excluding cancelled/failed)
        const validOrders = orders.filter(o => !/cancelled|failed|rejected/i.test(o.status || ''));

        let deliveryOrdersCount = 0;
        let takeawayOrdersCount = 0;
        let deliveryRevenue = 0;
        let takeawayRevenue = 0;
        let takeawayFeesCollected = 0;

        validOrders.forEach(o => {
            const isTakeaway = String(o.order_mode || '').toUpperCase() === 'TAKEAWAY';
            const total = Number(o.total) || 0;
            const fee = Number(o.takeaway_fee) || 0;

            if (isTakeaway) {
                takeawayOrdersCount++;
                takeawayRevenue += total;
                takeawayFeesCollected += fee;
            } else {
                deliveryOrdersCount++;
                deliveryRevenue += total;
            }
        });

        res.json({
            success: true,
            data: {
                total_orders: validOrders.length,
                delivery_orders: deliveryOrdersCount,
                takeaway_orders: takeawayOrdersCount,
                delivery_revenue: deliveryRevenue,
                takeaway_revenue: takeawayRevenue,
                takeaway_fees_collected: takeawayFeesCollected,
                combined_revenue: deliveryRevenue + takeawayRevenue
            }
        });
    } catch (err) {
        console.error('[OrderMode Analytics Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to calculate analytics'
        });
    }
});

module.exports = router;

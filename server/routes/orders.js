const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const { broadcastStatusUpdate } = require('../realtime');
const { getSupabaseClient } = require('../supabase');

const ACTIVE_STATUSES = ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route'];

// GET /api/orders (Fetch all orders for Admin)
router.get('/', async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/live (Live orders feed)
router.get('/admin/live', async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        const active = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
        res.json({ orders: active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/customers (Customers list for admin)
router.get('/admin/customers', async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        const { data: users, error } = await supabase.from('users').select('id, name, email, phone, created_at');
        if (error) throw error;
        res.json({ customers: users || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/metrics
router.get('/admin/metrics', async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
        const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

        res.json({
            metrics: {
                total_orders: orders.length,
                active_orders: activeOrders,
                delivered_orders: deliveredOrders,
                total_revenue: totalRevenue,
                avg_delivery_time_mins: 3.2
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:userId (Fetch all orders for user)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { active, past } = await supabaseDb.orders.getOrdersByUser(userId);
        res.json({ active, past });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:userId/active (Fetch latest active order)
router.get('/:userId/active', async (req, res) => {
    const { userId } = req.params;
    try {
        const { active } = await supabaseDb.orders.getOrdersByUser(userId);
        if (!active || active.length === 0) {
            return res.json({ active: null });
        }
        const detailed = await supabaseDb.orders.getOrderById(active[0].id);
        res.json({ active: detailed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/detail/:orderId
router.get('/detail/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await supabaseDb.orders.getOrderById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/orders/:orderId/status (Update order status)
router.post('/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    try {
        const updated = await supabaseDb.orders.updateStatus(orderId, status);
        broadcastStatusUpdate(orderId, status);
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/orders/:orderId/cancel (Cancel order in 2 clicks)
router.post('/:orderId/cancel', async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    try {
        const updated = await supabaseDb.orders.updateStatus(orderId, 'Cancelled');
        broadcastStatusUpdate(orderId, 'Cancelled');
        res.json({ success: true, message: 'Order cancelled successfully', reason: reason || 'User requested cancellation' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

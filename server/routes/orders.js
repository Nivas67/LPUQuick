const express = require('express');
const router = express.Router();

const ACTIVE_STATUSES = ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route'];
const PAST_STATUSES = ['Delivered', 'delivered', 'cancelled', 'Cancelled'];

// GET /api/orders/:userId
router.get('/:userId', (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Fetch all orders for user with items
    const orders = db.prepare(`
        SELECT o.*, 
               GROUP_CONCAT(p.name, ', ') as item_names,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `).all(userId);

    // Separate active vs past
    const active = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const past = orders.filter(o => PAST_STATUSES.includes(o.status));

    res.json({ active, past });
});

// GET /api/orders/:userId/active
router.get('/:userId/active', (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const order = db.prepare(`
        SELECT o.*
        FROM orders o
        WHERE o.user_id = ? AND o.status IN ('Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route')
        ORDER BY o.created_at DESC
        LIMIT 1
    `).get(userId);

    if (!order) {
        return res.json({ active: null });
    }

    // Get items for this order
    const items = db.prepare(`
        SELECT oi.*, p.name, p.image_url, p.image_alt
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ active: { ...order, items } });
});

// GET /api/orders/detail/:orderId
router.get('/detail/:orderId', (req, res) => {
    const db = req.app.locals.db;
    const { orderId } = req.params;

    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
        SELECT oi.*, p.name, p.image_url, p.image_alt
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `).all(orderId);

    res.json({ success: true, order: { ...order, items } });
});

// GET /api/orders/admin/all (Fetch all orders for Admin Dashboard)
router.get('/admin/all', (req, res) => {
    const db = req.app.locals.db;
    const orders = db.prepare(`
        SELECT o.*, 
               GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')', ', ') as item_summary,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `).all();

    res.json({ success: true, orders });
});

// POST /api/orders/admin/status (Update order status from Admin Dashboard)
router.post('/admin/status', async (req, res) => {
    const db = req.app.locals.db;
    const { orderId, status, riderName } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: 'orderId and status are required' });
    }

    // Update local SQLite DB
    if (riderName) {
        db.prepare('UPDATE orders SET status = ?, rider_name = ? WHERE id = ?').run(status, riderName, orderId);
    } else {
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    }

    // Sync with Supabase Cloud
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
            const updatePayload = { status };
            if (riderName) updatePayload.rider_name = riderName;
            await supabase.from('orders').update(updatePayload).eq('id', orderId);
        }
    } catch (e) {
        console.error('[Supabase Status Sync Error]:', e.message);
    }

    res.json({ success: true, message: `Order ${orderId} updated to ${status}` });
});

module.exports = router;

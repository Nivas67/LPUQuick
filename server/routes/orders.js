const express = require('express');
const router = express.Router();

// GET /api/orders/:userId
router.get('/:userId', (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;

    // Fetch all orders with items in batch (no N+1)
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
    const active = orders.filter(o => ['pending', 'confirmed', 'accepted', 'packed', 'en_route'].includes(o.status));
    const past = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    res.json({ active, past });
});

// GET /api/orders/:userId/active
router.get('/:userId/active', (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;

    const order = db.prepare(`
        SELECT o.*
        FROM orders o
        WHERE o.user_id = ? AND o.status IN ('pending', 'confirmed', 'accepted', 'packed', 'en_route')
        ORDER BY o.created_at DESC
        LIMIT 1
    `).get(userId);

    if (!order) {
        return res.json({ active: null });
    }

    // Get items for this order (batch)
    const items = db.prepare(`
        SELECT oi.*, p.name, p.image_url, p.image_alt
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ active: { ...order, items } });
});

module.exports = router;

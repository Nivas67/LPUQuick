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

// POST /api/orders/:orderId/reorder (Adds the exact items from this order into the cart)
router.post('/:orderId/reorder', (req, res) => {
    const db = req.app.locals.db;
    const { orderId } = req.params;
    const { userId } = req.body;

    if (!orderId || !userId) {
        return res.status(400).json({ error: 'orderId and userId are required' });
    }

    const items = db.prepare(`
        SELECT oi.product_id, oi.quantity, p.name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `).all(orderId);

    if (!items || items.length === 0) {
        return res.status(404).json({ error: 'No items found for this order to reorder.' });
    }

    const { v4: uuidv4 } = require('uuid');
    for (const item of items) {
        const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, item.product_id);
        if (existing) {
            db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(item.quantity, existing.id);
        } else {
            const id = `cart_${uuidv4().slice(0, 8)}`;
            db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)').run(id, userId, item.product_id, item.quantity);
        }
    }

    res.json({ success: true, message: 'Order items added to cart', count: items.length });
});

const requireAdmin = require('../middleware/adminAuth');

// GET /api/orders/admin/all (Fetch all orders for Admin Dashboard)
router.get('/admin/all', requireAdmin, (req, res) => {
    const db = req.app.locals.db;
    const orders = db.prepare(`
        SELECT o.*, 
               u.name as customer_name,
               u.phone as customer_phone,
               u.email as customer_email,
               GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')', ', ') as item_summary,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `).all();

    res.json({ success: true, orders });
});

// GET /api/orders/admin/detail/:orderId
router.get('/admin/detail/:orderId', requireAdmin, (req, res) => {
    const db = req.app.locals.db;
    const { orderId } = req.params;

    const order = db.prepare(`
        SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
    `).get(orderId);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const items = db.prepare(`
        SELECT oi.*, p.name, p.image_url, p.image_alt, p.category, p.unit
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    `).all(orderId);

    let history = [];
    try {
        history = JSON.parse(order.status_history || '[]');
    } catch (e) {
        history = [];
    }

    res.json({ success: true, order: { ...order, items, history } });
});

// POST /api/orders/admin/status (Update order status with status history and WebSocket broadcast)
router.post('/admin/status', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { orderId, status, riderName } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ error: 'orderId and status are required' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    // Append to status history
    let history = [];
    try {
        history = JSON.parse(order.status_history || '[]');
    } catch (e) {
        history = [];
    }
    history.push({
        status,
        timestamp: new Date().toISOString(),
        updated_by: 'Admin (Campus Hub)'
    });
    const historyJson = JSON.stringify(history);

    // Update local SQLite DB
    if (riderName) {
        db.prepare('UPDATE orders SET status = ?, rider_name = ?, status_history = ? WHERE id = ?')
            .run(status, riderName, historyJson, orderId);
    } else {
        db.prepare('UPDATE orders SET status = ?, status_history = ? WHERE id = ?')
            .run(status, historyJson, orderId);
    }

    // Sync with Supabase Cloud
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
            const updatePayload = { status };
            if (riderName) updatePayload.rider_name = riderName;
            supabase.from('orders').update(updatePayload).eq('id', orderId).catch(e => console.error('[Supabase Update Error]:', e.message));
        }
    } catch (e) {
        // Non-blocking
    }

    // Broadcast real-time status update to both Admin and Student tracking
    try {
        const { notifyOrderStatusUpdate } = require('../realtime');
        notifyOrderStatusUpdate(orderId, { status, riderName });
    } catch (e) {
        console.error('[Realtime Status Broadcast Error]:', e.message);
    }

    res.json({ success: true, message: `Order ${orderId} updated to ${status}`, status });
});

// GET /api/orders/admin/analytics (Real calculated KPI metrics & charts data)
router.get('/admin/analytics', requireAdmin, (req, res) => {
    const db = req.app.locals.db;

    const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1 OR is_active IS NULL').get()?.c || 0;
    const totalStock = db.prepare('SELECT SUM(stock_left) as s FROM products WHERE is_active = 1 OR is_active IS NULL').get()?.s || 0;
    const lowStockCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE (is_active = 1 OR is_active IS NULL) AND stock_left > 0 AND stock_left <= 10').get()?.c || 0;
    const outOfStockCount = db.prepare('SELECT COUNT(*) as c FROM products WHERE (is_active = 1 OR is_active IS NULL) AND (stock_left = 0 OR in_stock = 0)').get()?.c || 0;

    const allOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    const totalOrdersCount = allOrders.length;
    const activeOrders = allOrders.filter(o => ACTIVE_STATUSES.includes(o.status));
    const pendingOrdersCount = activeOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

    // Top selling products
    const topProducts = db.prepare(`
        SELECT p.id, p.name, p.category, p.price, p.image_url, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.unit_price) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_sold DESC
        LIMIT 5
    `).all();

    // Low stock items list
    const lowStockItems = db.prepare(`
        SELECT id, name, category, price, stock_left, in_stock, image_url
        FROM products
        WHERE (is_active = 1 OR is_active IS NULL) AND (stock_left <= 10 OR in_stock = 0)
        ORDER BY stock_left ASC
        LIMIT 6
    `).all();

    res.json({
        success: true,
        metrics: {
            totalProducts,
            totalStock,
            lowStockCount,
            outOfStockCount,
            totalOrdersCount,
            pendingOrdersCount,
            totalRevenue,
            avgOrderValue
        },
        topProducts,
        lowStockItems
    });
});

// GET /api/orders/admin/customers (Real customer directory aggregated with order counts)
router.get('/admin/customers', requireAdmin, (req, res) => {
    const db = req.app.locals.db;

    const customers = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
               COUNT(o.id) as order_count,
               COALESCE(SUM(o.total), 0) as total_spent,
               MAX(o.created_at) as last_order_date
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.role != 'admin' OR u.role IS NULL
        GROUP BY u.id
        ORDER BY total_spent DESC, order_count DESC
    `).all();

    res.json({ success: true, customers });
});

module.exports = router;

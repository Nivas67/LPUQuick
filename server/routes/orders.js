const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const { broadcastStatusUpdate } = require('../realtime');
const { getSupabaseClient } = require('../supabase');
const requireAdmin = require('../middleware/adminAuth');

const ACTIVE_STATUSES = ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route'];

// ===== ADMIN ROUTES (must be before /:userId catch-all) =====

// GET /api/orders/admin/all (All orders for admin dashboard)
router.get('/admin/all', requireAdmin, async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        // Enrich with item summaries
        const supabase = getSupabaseClient();
        const enriched = await Promise.all(orders.map(async (order) => {
            const { data: items } = await supabase
                .from('order_items')
                .select('quantity, unit_price, products(name)')
                .eq('order_id', order.id)
                .limit(5);
            
            const itemNames = (items || []).map(i => i.products?.name).filter(Boolean);
            const itemSummary = itemNames.length > 0 ? itemNames.join(', ') : 'Campus items';
            
            // Get customer info
            const { data: user } = await supabase
                .from('users')
                .select('name, phone, email')
                .eq('id', order.user_id)
                .single();
            
            return {
                ...order,
                customer_name: user?.name || 'Student',
                customer_phone: user?.phone || '',
                customer_email: user?.email || '',
                item_summary: itemSummary
            };
        }));
        
        res.json({ orders: enriched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/analytics (Dashboard KPIs & metrics)
router.get('/admin/analytics', requireAdmin, async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        const orders = await supabaseDb.orders.getAllOrders();
        const products = await supabaseDb.products.getAll({ includeInactive: true });
        
        const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const pendingOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
        const deliveredOrders = orders.filter(o => ['Delivered', 'delivered'].includes(o.status));
        
        const totalStock = products.reduce((sum, p) => sum + (p.stock_left || 0), 0);
        const lowStockProducts = products.filter(p => p.stock_left > 0 && p.stock_left <= 10);
        const outOfStockProducts = products.filter(p => !p.in_stock || p.stock_left === 0);
        
        // Top selling products from order_items
        const { data: topItems } = await supabase
            .from('order_items')
            .select('product_id, quantity, unit_price, products(id, name, category, image_url)');
        
        const productSales = {};
        (topItems || []).forEach(item => {
            const pid = item.product_id;
            if (!productSales[pid]) {
                productSales[pid] = {
                    name: item.products?.name || 'Unknown',
                    category: item.products?.category || '',
                    image_url: item.products?.image_url || '',
                    total_sold: 0,
                    revenue: 0
                };
            }
            productSales[pid].total_sold += item.quantity;
            productSales[pid].revenue += item.quantity * item.unit_price;
        });
        
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            metrics: {
                totalProducts: products.length,
                totalStock: totalStock,
                lowStockCount: lowStockProducts.length,
                outOfStockCount: outOfStockProducts.length,
                totalOrdersCount: orders.length,
                pendingOrdersCount: pendingOrders.length,
                deliveredOrdersCount: deliveredOrders.length,
                totalRevenue: Math.round(totalRevenue),
                avgOrderValue: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0
            },
            lowStockItems: lowStockProducts.slice(0, 10),
            topProducts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/customers (Customers list for admin)
router.get('/admin/customers', requireAdmin, async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        const { data: users, error } = await supabase.from('users').select('id, name, email, phone, created_at');
        if (error) throw error;
        
        // Enrich with order stats
        const orders = await supabaseDb.orders.getAllOrders();
        const customerStats = {};
        orders.forEach(o => {
            if (!customerStats[o.user_id]) {
                customerStats[o.user_id] = { order_count: 0, total_spent: 0, last_order_date: null };
            }
            customerStats[o.user_id].order_count++;
            customerStats[o.user_id].total_spent += Number(o.total) || 0;
            const orderDate = new Date(o.created_at);
            if (!customerStats[o.user_id].last_order_date || orderDate > new Date(customerStats[o.user_id].last_order_date)) {
                customerStats[o.user_id].last_order_date = o.created_at;
            }
        });
        
        const enrichedCustomers = (users || []).map(u => ({
            ...u,
            order_count: customerStats[u.id]?.order_count || 0,
            total_spent: Math.round(customerStats[u.id]?.total_spent || 0),
            last_order_date: customerStats[u.id]?.last_order_date || null
        }));
        
        res.json({ customers: enrichedCustomers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/detail/:orderId (Order detail for drawer)
router.get('/admin/detail/:orderId', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await supabaseDb.orders.getOrderById(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        
        // Enrich with customer info
        const supabase = getSupabaseClient();
        const { data: user } = await supabase
            .from('users')
            .select('name, phone, email')
            .eq('id', order.user_id)
            .single();
        
        // Map items with unit_price field that the drawer expects
        const enrichedItems = (order.items || []).map(i => ({
            ...i,
            unit_price: i.price || i.unit_price || 0
        }));
        
        res.json({
            order: {
                ...order,
                customer_name: user?.name || 'Student',
                customer_phone: user?.phone || '',
                customer_email: user?.email || '',
                items: enrichedItems
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/orders/admin/status (Update order status from admin drawer)
router.post('/admin/status', requireAdmin, async (req, res) => {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
        return res.status(400).json({ error: 'orderId and status are required' });
    }
    
    try {
        const updated = await supabaseDb.orders.updateStatus(orderId, status);
        broadcastStatusUpdate(orderId, status);
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/live (Live orders feed)
router.get('/admin/live', requireAdmin, async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        const active = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
        res.json({ orders: active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/metrics
router.get('/admin/metrics', requireAdmin, async (req, res) => {
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

// ===== USER ROUTES (after admin routes to avoid catch-all conflict) =====

// GET /api/orders (Fetch all orders)
router.get('/', async (req, res) => {
    try {
        const orders = await supabaseDb.orders.getAllOrders();
        res.json({ orders });
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

// POST /api/orders/:orderId/cancel (Cancel order)
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

// POST /api/orders/:orderId/reorder (Reorder all items from past order into user cart)
router.post('/:orderId/reorder', async (req, res) => {
    const { orderId } = req.params;
    const { userId } = req.body;
    const effectiveUserId = userId || 'user_guest';

    try {
        const order = await supabaseDb.orders.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = order.items || [];
        if (items.length === 0) {
            // Fallback: lookup items directly from order_items table
            const supabase = getSupabaseClient();
            const { data: dbItems } = await supabase
                .from('order_items')
                .select('product_id, quantity')
                .eq('order_id', orderId);
            
            if (dbItems && dbItems.length > 0) {
                for (const item of dbItems) {
                    if (item.product_id) {
                        await supabaseDb.cart.addItem(effectiveUserId, item.product_id, item.quantity || 1);
                    }
                }
            } else {
                return res.status(400).json({ error: 'No items found in this order to reorder' });
            }
        } else {
            for (const item of items) {
                const pid = item.product_id || item.id;
                const qty = item.quantity || 1;
                if (pid) {
                    await supabaseDb.cart.addItem(effectiveUserId, pid, qty);
                }
            }
        }

        const updatedCart = await supabaseDb.cart.getCart(effectiveUserId);
        res.json({
            success: true,
            message: 'All items from order successfully added to cart!',
            cart: updatedCart,
            reordered_count: (items.length || 1)
        });
    } catch (err) {
        console.error('[Reorder Route Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/orders/:orderId/change-address (Update active order delivery address)
router.post('/:orderId/change-address', async (req, res) => {
    const { orderId } = req.params;
    const { newAddress } = req.body;

    if (!newAddress) {
        return res.status(400).json({ error: 'newAddress is required' });
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('orders')
            .update({ delivery_address: newAddress })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, message: 'Delivery address updated successfully', order: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


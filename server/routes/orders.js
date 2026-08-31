const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const { broadcastStatusUpdate } = require('../realtime');
const { getSupabaseClient } = require('../supabase');
const requireAdmin = require('../middleware/adminAuth');
const cache = require('../cache');

const ACTIVE_STATUSES = ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route'];

// Resolve authentic customer display name (extracts email username or phone if full name is missing)
function resolveOrderCustomerName(order, user) {
    const rawName = order?.customer_name || user?.name;
    if (rawName && typeof rawName === 'string') {
        const trimmed = rawName.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed.length > 1 &&
            !lower.startsWith('user_') &&
            !lower.startsWith('order_') &&
            !lower.startsWith('guest_') &&
            lower !== 'customer' &&
            lower !== 'student' &&
            lower !== 'campus student' &&
            lower !== 'campus resident' &&
            lower !== 'lpu student' &&
            lower !== 'anonymous' &&
            lower !== 'legacy order') {
            return trimmed;
        }
    }

    const email = (order?.customer_email && !order.customer_email.endsWith('@lpu.in')) ? order.customer_email : (user?.email || order?.customer_email || '');
    if (email && typeof email === 'string' && email.includes('@')) {
        const emailPrefix = email.split('@')[0].trim();
        if (emailPrefix && !emailPrefix.toLowerCase().startsWith('user_')) {
            const formatted = emailPrefix.replace(/[._-]/g, ' ').split(' ')
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            if (formatted.length > 0) return formatted;
        }
    }

    const phone = order?.customer_phone || user?.phone;
    if (phone && typeof phone === 'string' && phone.replace(/\D/g, '').length >= 10) {
        return `Student (+91 ${phone.replace(/\D/g, '').slice(-10)})`;
    }

    if (email && typeof email === 'string' && email.includes('@')) {
        return email.split('@')[0];
    }

    const uid = order?.user_id || user?.id;
    if (uid && typeof uid === 'string') {
        return `Student (${uid.replace('user_', '').slice(0, 8).toUpperCase()})`;
    }

    return 'Student';
}

// ===== ADMIN ROUTES (must be before /:userId catch-all) =====

// POST /api/orders/admin/invalidate-cache (Admin manual refresh cache burst)
router.post('/admin/invalidate-cache', requireAdmin, (req, res) => {
    cache.invalidateOrders();
    res.json({ success: true, message: 'Orders and analytics cache invalidated.' });
});

// GET /api/orders/admin/all (All orders for admin dashboard - Optimized Single PostgREST Join + Batch Users)
router.get('/admin/all', requireAdmin, async (req, res) => {
    try {
        const isFresh = req.query.fresh === 'true' || req.query._t || req.headers['cache-control']?.includes('no-cache') || req.headers['pragma'] === 'no-cache';
        if (isFresh) {
            cache.delete('orders:admin:all');
        }

        const payload = await cache.wrap('orders:admin:all', async () => {
            const supabase = getSupabaseClient();
            
            // 1. Single database query with PostgREST join for order items and product names
            const { data: orders, error: ordersErr } = await supabase
                .from('orders')
                .select('*, order_items(quantity, unit_price, products(name))')
                .order('created_at', { ascending: false });

            if (ordersErr) throw ordersErr;
            if (!orders || orders.length === 0) return { orders: [] };

            // 2. Single batch lookup for all distinct customer IDs in parallel
            const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
            let userMap = new Map();

            if (userIds.length > 0) {
                const { data: users } = await supabase
                    .from('users')
                    .select('id, name, phone, email')
                    .in('id', userIds);
                if (users) {
                    users.forEach(u => userMap.set(u.id, u));
                }
            }

            // 3. Fast in-memory assembly (0 extra round trips)
            const enriched = orders.map(order => {
                const user = userMap.get(order.user_id);
                const itemNames = (order.order_items || []).map(i => i.products?.name).filter(Boolean);
                const itemSummary = itemNames.length > 0 ? itemNames.join(', ') : 'Campus items';

                const customerName = resolveOrderCustomerName(order, user);
                const customerPhone = order.customer_phone || user?.phone || '';
                const customerEmail = (order.customer_email && !order.customer_email.endsWith('@lpu.in')) ? order.customer_email : (user?.email || order.customer_email || '');

                return {
                    id: order.id,
                    user_id: order.user_id,
                    status: order.status,
                    subtotal: order.subtotal,
                    delivery_fee: order.delivery_fee,
                    platform_fee: order.platform_fee,
                    tax: order.tax,
                    total: order.total,
                    payment_method: order.payment_method,
                    payment_status: order.payment_status,
                    rider_name: order.rider_name,
                    rider_lat: order.rider_lat,
                    rider_lng: order.rider_lng,
                    delivery_address: order.delivery_address || 'Not provided',
                    created_at: order.created_at,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_email: customerEmail,
                    item_summary: itemSummary
                };
            });

            return { orders: enriched };
        }, isFresh ? 0 : 15000);

        res.json(payload);
    } catch (err) {
        console.error('[Admin Orders Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/analytics (Dashboard KPIs & metrics - Parallel Execution + Column Projection)
router.get('/admin/analytics', requireAdmin, async (req, res) => {
    try {
        const isFresh = req.query.fresh === 'true' || req.query._t || req.headers['cache-control']?.includes('no-cache') || req.headers['pragma'] === 'no-cache';
        if (isFresh) {
            cache.delete('analytics:admin:summary');
        }

        const payload = await cache.wrap('analytics:admin:summary', async () => {
            const supabase = getSupabaseClient();

            // Run independent queries concurrently via Promise.all
            const [ordersRes, productsRes, topItemsRes] = await Promise.all([
                supabase.from('orders').select('id, status, total'),
                supabase.from('products').select('id, name, category, image_url, in_stock, tags'),
                supabase.from('order_items').select('order_id, product_id, quantity, unit_price, products(id, name, category, image_url)')
            ]);

            const orders = ordersRes.data || [];
            const products = (productsRes.data || []).map(p => {
                const match = (p.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
                return { ...p, stock_left };
            });

            const deliveredOrders = orders.filter(o => ['Delivered', 'delivered'].includes(o.status));
            const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
            const pendingOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));

            const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const avgOrderValue = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;

            const totalStock = products.reduce((sum, p) => sum + (p.stock_left || 0), 0);
            const lowStockProducts = products.filter(p => p.stock_left > 0 && p.stock_left <= 4);
            const outOfStockProducts = products.filter(p => !p.in_stock || p.stock_left === 0);

            // Aggregate top selling items strictly from delivered orders
            const productSales = {};
            (topItemsRes.data || []).forEach(item => {
                if (!deliveredOrderIds.has(item.order_id)) return;

                const pid = item.product_id;
                if (!pid) return;

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

            return {
                metrics: {
                    totalProducts: products.length,
                    totalStock: totalStock,
                    lowStockCount: lowStockProducts.length,
                    outOfStockCount: outOfStockProducts.length,
                    totalOrdersCount: orders.length,
                    pendingOrdersCount: pendingOrders.length,
                    deliveredOrdersCount: deliveredOrders.length,
                    totalRevenue: Math.round(totalRevenue),
                    avgOrderValue: avgOrderValue
                },
                lowStockItems: lowStockProducts.slice(0, 10),
                topProducts
            };
        }, 15000);

        res.json(payload);
    } catch (err) {
        console.error('[Admin Analytics Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/admin/customers (Customers list with aggregated metrics)
router.get('/admin/customers', requireAdmin, async (req, res) => {
    try {
        const payload = await cache.wrap('orders:admin:customers', async () => {
            const enrichedCustomers = await supabaseDb.users.getAllCustomersWithMetrics();
            return { customers: enrichedCustomers };
        }, 10000);

        res.json(payload);
    } catch (err) {
        console.error('[Admin Customers Error]:', err.message);
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
        let user = null;
        if (order.user_id) {
            try {
                user = await supabaseDb.users.getById(order.user_id);
            } catch (uErr) {}
        }

        const customerName = resolveOrderCustomerName(order, user);
        const customerPhone = order.customer_phone || user?.phone || '';
        const customerEmail = (order.customer_email && !order.customer_email.endsWith('@lpu.in')) ? order.customer_email : (user?.email || order.customer_email || '');
        const deliveryAddress = order.delivery_address || 'Not provided';
        
        // Map items with unit_price field that the drawer expects
        const enrichedItems = (order.items || []).map(i => ({
            ...i,
            name: i.products?.name || i.name || 'Product',
            image_url: i.products?.image_url || i.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
            unit_price: i.price || i.unit_price || 0
        }));
        
        res.json({
            order: {
                ...order,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                delivery_address: deliveryAddress,
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
        cache.invalidateOrders();
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
        const payload = await cache.wrap('orders:admin:metrics', async () => {
            const orders = await supabaseDb.orders.getAllOrders();
            const deliveredOrders = orders.filter(o => ['Delivered', 'delivered'].includes(o.status));
            const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;

            return {
                metrics: {
                    total_orders: orders.length,
                    active_orders: activeOrders,
                    delivered_orders: deliveredOrders.length,
                    total_revenue: totalRevenue,
                    avg_delivery_time_mins: 3.2
                }
            };
        }, 10000);

        res.json(payload);
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
        cache.invalidateOrders();
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
        cache.invalidateOrders();
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


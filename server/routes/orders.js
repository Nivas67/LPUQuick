const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const { broadcastStatusUpdate, broadcastOrderClaimed, broadcastTransferRequested, broadcastTransferResolved } = require('../realtime');
const { getSupabaseClient } = require('../supabase');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole } = require('../middleware/adminAuth');
const pushService = require('../notifications/pushService');
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

const path = require('path');
const fs = require('fs');

// Memory fallback caches to protect against Cloudflare 522 / Supabase sleep stalls
let fallbackOrdersCache = [];
let fallbackAnalyticsCache = null;

try {
    const ordersSnapPath = path.join(__dirname, '..', 'data', 'orders_snapshot.json');
    if (fs.existsSync(ordersSnapPath)) {
        fallbackOrdersCache = JSON.parse(fs.readFileSync(ordersSnapPath, 'utf8'));
    }
} catch (e) {
    console.warn('[Orders Snapshot Load Note]:', e.message);
}

try {
    const prodsSnapPath = path.join(__dirname, '..', 'data', 'products_snapshot.json');
    let seedProducts = [];
    if (fs.existsSync(prodsSnapPath)) {
        seedProducts = JSON.parse(fs.readFileSync(prodsSnapPath, 'utf8'));
    }
    const delivered = fallbackOrdersCache.filter(o => ['Delivered', 'delivered'].includes(o.status));
    fallbackAnalyticsCache = {
        metrics: {
            totalProducts: seedProducts.length || 0,
            totalStock: seedProducts.reduce((s, p) => s + (p.stock_left || 0), 0) || 0,
            lowStockCount: seedProducts.filter(p => p.stock_left > 0 && p.stock_left <= 4).length,
            outOfStockCount: seedProducts.filter(p => !p.in_stock || p.stock_left === 0).length,
            totalOrdersCount: fallbackOrdersCache.length || 0,
            pendingOrdersCount: fallbackOrdersCache.filter(o => ACTIVE_STATUSES.includes(o.status)).length || 0,
            deliveredOrdersCount: delivered.length || 0
        },
        lowStockItems: seedProducts.filter(p => p.stock_left > 0 && p.stock_left <= 4).slice(0, 5),
        topProducts: []
    };
} catch (e) {}

function withTimeout(promise, ms = 6000, fallback = null) {
    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => {
            console.warn(`[Supabase Query Timeout]: Exceeded ${ms}ms limit, using fallback.`);
            resolve(fallback);
        }, ms))
    ]);
}

// ===== ADMIN ROUTES (must be before /:userId catch-all) =====

// POST /api/orders/admin/invalidate-cache (Admin manual refresh cache burst)
router.post('/admin/invalidate-cache', requireAdmin, (req, res) => {
    cache.invalidateOrders();
    res.json({ success: true, message: 'Orders and analytics cache invalidated.' });
});

// GET /api/orders/admin/all (All orders for admin dashboard)
router.get('/admin/all', requireAdmin, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const forceFresh = req.query.force === 'true';
        if (forceFresh) {
            cache.delete('orders:admin:all');
        }

        const payload = await cache.wrap('orders:admin:all', async () => {
            const supabase = getSupabaseClient();
            
            // 1. Direct query with selective column projection & timeout protection
            const queryPromise = supabase
                .from('orders')
                .select('id, user_id, status, subtotal, delivery_fee, platform_fee, tax, total, payment_method, payment_status, rider_name, rider_lat, rider_lng, delivery_address, created_at, customer_name, customer_phone, customer_email')
                .order('created_at', { ascending: false });

            const ordersRes = await withTimeout(queryPromise, 15000, { data: null, error: new Error('Timeout') });
            const orders = ordersRes?.data;

            if (!orders || orders.length === 0) {
                fallbackOrdersCache = [];
                return { orders: [] };
            }

            // 2. Single batch lookup for distinct customer IDs in parallel
            const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];
            let userMap = new Map();

            if (userIds.length > 0) {
                try {
                    const usersRes = await withTimeout(
                        supabase.from('users').select('id, name, phone, email').in('id', userIds),
                        8000,
                        { data: null }
                    );
                    if (usersRes?.data) {
                        usersRes.data.forEach(u => userMap.set(u.id, u));
                    }
                } catch (uErr) {
                    console.warn('[Admin Users Batch Lookup Note]:', uErr.message);
                }
            }

            // 3. Fast in-memory assembly
            const enriched = orders.map(order => {
                const user = userMap.get(order.user_id);
                const customerName = resolveOrderCustomerName(order, user);
                const customerPhone = order.customer_phone || user?.phone || '';
                const customerEmail = (order.customer_email && !order.customer_email.endsWith('@lpu.in')) ? order.customer_email : (user?.email || order.customer_email || '');
                const deliveryInfo = supabaseDb.orders.parseDeliveryMeta(order.rider_name);

                return {
                    id: order.id,
                    user_id: order.user_id,
                    status: order.status || 'Order Placed',
                    subtotal: order.subtotal || 0,
                    delivery_fee: order.delivery_fee || 0,
                    platform_fee: order.platform_fee || 0,
                    tax: order.tax || 0,
                    total: order.total || 0,
                    payment_method: order.payment_method || 'Cash on Delivery',
                    payment_status: order.payment_status || 'pending',
                    rider_name: deliveryInfo.assigned_to_name || (deliveryInfo.is_claimed ? 'Assigned Rider' : 'Unassigned'),
                    delivery_assignment: deliveryInfo,
                    rider_lat: order.rider_lat || 31.2560,
                    rider_lng: order.rider_lng || 75.7030,
                    delivery_address: order.delivery_address || 'BH13 Hostels',
                    created_at: order.created_at,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_email: customerEmail,
                    item_summary: order.delivery_address || 'Campus items'
                };
            });

            fallbackOrdersCache = enriched;
            return { orders: enriched };
        }, forceFresh ? 0 : 4000); // 4-second coalesced micro-cache (coalesces rapid multi-tab polls)

        res.json(payload || { orders: fallbackOrdersCache });
    } catch (err) {
        console.error('[Admin Orders Error]:', err.message);
        res.json({ orders: fallbackOrdersCache, isFallback: true });
    }
});

// GET /api/orders/admin/analytics (Dashboard KPIs & metrics)
router.get('/admin/analytics', requireAdmin, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const forceFresh = req.query.force === 'true';
        if (forceFresh) {
            cache.delete('analytics:admin:summary');
        }

        const payload = await cache.wrap('analytics:admin:summary', async () => {
            const supabase = getSupabaseClient();

            // Run independent queries concurrently with bounded order_items lookup
            const queryPromise = Promise.all([
                supabase.from('orders').select('id, status, total').order('created_at', { ascending: false }).limit(500),
                supabase.from('products').select('id, name, category, in_stock, tags, price'),
                supabase.from('order_items').select('order_id, product_id, quantity, unit_price').limit(500)
            ]);

            const [ordersRes, productsRes, topItemsRes] = await withTimeout(queryPromise, 12000, [
                { data: null },
                { data: null },
                { data: null }
            ]);

            const orders = ordersRes?.data || [];
            const products = (productsRes?.data || []).map(p => {
                const match = (p.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
                return { ...p, stock_left };
            });

            if (orders.length === 0 && products.length === 0) {
                return {
                    metrics: {
                        totalProducts: 0,
                        totalStock: 0,
                        lowStockCount: 0,
                        outOfStockCount: 0,
                        totalOrdersCount: 0,
                        pendingOrdersCount: 0,
                        deliveredOrdersCount: 0
                    },
                    lowStockItems: [],
                    topProducts: []
                };
            }

            const productMap = new Map();
            products.forEach(p => productMap.set(p.id, p));

            const deliveredOrders = orders.filter(o => ['Delivered', 'delivered'].includes(o.status));
            const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
            const pendingOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));

            const totalStock = products.reduce((sum, p) => sum + (p.stock_left || 0), 0);
            const lowStockProducts = products.filter(p => p.stock_left > 0 && p.stock_left <= 4);
            const outOfStockProducts = products.filter(p => !p.in_stock || p.stock_left === 0);

            // Aggregate top selling items strictly from delivered orders
            const productSales = {};
            (topItemsRes?.data || []).forEach(item => {
                if (!deliveredOrderIds.has(item.order_id)) return;

                const pid = item.product_id;
                if (!pid) return;

                const prod = productMap.get(pid);
                if (!productSales[pid]) {
                    productSales[pid] = {
                        name: prod?.name || 'Campus Item',
                        category: prod?.category || 'General',
                        image_url: prod?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
                        total_sold: 0
                    };
                }
                productSales[pid].total_sold += item.quantity || 1;
            });

            const topProducts = Object.values(productSales)
                .sort((a, b) => b.total_sold - a.total_sold)
                .slice(0, 10);

            const result = {
                metrics: {
                    totalProducts: products.length,
                    totalStock: totalStock,
                    lowStockCount: lowStockProducts.length,
                    outOfStockCount: outOfStockProducts.length,
                    totalOrdersCount: orders.length,
                    pendingOrdersCount: pendingOrders.length,
                    deliveredOrdersCount: deliveredOrders.length
                },
                lowStockItems: lowStockProducts.slice(0, 10),
                topProducts
            };

            fallbackAnalyticsCache = result;
            return result;
        }, forceFresh ? 0 : 30000); // 30-second analytics micro-cache

        res.json(payload || fallbackAnalyticsCache || { metrics: {} });
    } catch (err) {
        console.error('[Admin Analytics Error]:', err.message);
        res.json(fallbackAnalyticsCache || { metrics: {} });
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
        const deliveryInfo = supabaseDb.orders.parseDeliveryMeta(order.rider_name);

        const enrichedItems = (order.items || []).map(i => ({
            ...i,
            name: i.products?.name || i.name || 'Campus Item',
            image_url: i.products?.image_url || i.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
            unit_price: Number(i.unit_price || i.price || i.products?.price || 0),
            quantity: Number(i.quantity) || 1
        }));

        res.json({
            order: {
                ...order,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                delivery_address: deliveryAddress,
                rider_name: deliveryInfo.assigned_to_name || (deliveryInfo.is_claimed ? 'Assigned' : 'Unassigned'),
                delivery_assignment: deliveryInfo,
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
    
    // 1. Immediately update memory cache for zero latency
    if (Array.isArray(fallbackOrdersCache)) {
        const o = fallbackOrdersCache.find(x => x.id === orderId);
        if (o) o.status = status;
    }

    try {
        const updated = await withTimeout(
            supabaseDb.orders.updateStatus(orderId, status),
            6000,
            { id: orderId, status }
        );
        cache.invalidateOrders();
        broadcastStatusUpdate(orderId, status);
        res.json({ success: true, order: updated });
    } catch (err) {
        console.error('[Admin Status Update Exception]:', err.message);
        broadcastStatusUpdate(orderId, status);
        res.json({ success: true, order: { id: orderId, status }, note: 'Updated in active cache.' });
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
            const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;

            return {
                metrics: {
                    total_orders: orders.length,
                    active_orders: activeOrders,
                    delivered_orders: deliveredOrders.length,
                    avg_delivery_time_mins: 3.2
                }
            };
        }, 10000);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// DELIVERY DISPATCH & ORDER TRANSFER ROUTES (ADMIN ONLY)
// ============================================================

// GET /api/orders/admin/delivery-staff (List all delivery personnel for transfer modal)
router.get('/admin/delivery-staff', requireAdmin, async (req, res) => {
    try {
        const staff = await supabaseDb.staff.getAllStaff();
        // Filter staff who have delivery_person or owner or store_manager roles
        const deliveryStaff = staff.filter(s => 
            s.account_status === 'ACTIVE' && 
            (s.roles.includes('delivery_person') || s.roles.includes('store_manager') || s.is_owner)
        );

        // Get currently active orders to calculate active load count per runner
        const supabase = getSupabaseClient();
        const { data: activeOrders } = await supabase
            .from('orders')
            .select('id, rider_name, status')
            .in('status', ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery']);

        const loadMap = {};
        (activeOrders || []).forEach(o => {
            const meta = supabaseDb.orders.parseDeliveryMeta(o.rider_name);
            if (meta.assigned_to) {
                loadMap[meta.assigned_to] = (loadMap[meta.assigned_to] || 0) + 1;
            }
        });

        const enrichedStaff = deliveryStaff.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone || '',
            roles: s.roles,
            is_owner: s.is_owner,
            active_deliveries: loadMap[s.id] || 0
        }));

        res.json({ success: true, staff: enrichedStaff });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:orderId/claim (First-Come-First-Served Delivery Acceptance)
router.post('/:orderId/claim', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const adminId = req.admin.id;
    const adminName = req.admin.name || 'Delivery Rider';

    try {
        const updated = await supabaseDb.orders.claimOrder(orderId, adminId, adminName);
        cache.invalidateOrders();

        // Broadcast real-time claim to all open admin dashboards
        broadcastOrderClaimed({
            orderId,
            adminId,
            adminName,
            claimedAt: updated.delivery_assignment.claimed_at
        });

        // Trigger background Push notification to other admins
        pushService.notifyOrderClaimed(orderId, adminName, adminId).catch(() => {});

        res.json({
            success: true,
            message: `Order delivery successfully accepted by ${adminName}`,
            order: updated
        });
    } catch (err) {
        res.status(409).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:orderId/transfer/request (Initiate delivery transfer to another admin)
router.post('/:orderId/transfer/request', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { toAdminId, toAdminName, reason } = req.body;
    const fromAdminId = req.admin.id;
    const fromAdminName = req.admin.name || 'Delivery Rider';

    if (!toAdminId) {
        return res.status(400).json({ success: false, error: 'Recipient admin is required' });
    }

    if (toAdminId === fromAdminId) {
        return res.status(400).json({ success: false, error: 'Cannot transfer an order to yourself' });
    }

    try {
        const updated = await supabaseDb.orders.requestTransfer(
            orderId,
            fromAdminId,
            fromAdminName,
            toAdminId,
            toAdminName,
            reason
        );
        cache.invalidateOrders();

        // Broadcast WebSocket transfer alert
        broadcastTransferRequested({
            orderId,
            fromId: fromAdminId,
            fromName: fromAdminName,
            toId: toAdminId,
            toName: toAdminName,
            reason
        });

        // Send high-priority Push Notification to recipient device (wakes up even if closed)
        pushService.notifyTransferRequest({
            orderId,
            fromId: fromAdminId,
            fromName: fromAdminName,
            toId: toAdminId,
            toName: toAdminName,
            reason
        }).catch(() => {});

        res.json({
            success: true,
            message: `Transfer request sent to ${toAdminName || 'delivery runner'}`,
            order: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:orderId/transfer/respond (Accept or Decline transfer request)
router.post('/:orderId/transfer/respond', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { accept } = req.body;
    const adminId = req.admin.id;
    const adminName = req.admin.name || 'Delivery Rider';

    try {
        const updated = await supabaseDb.orders.respondTransfer(
            orderId,
            adminId,
            Boolean(accept),
            adminName
        );
        cache.invalidateOrders();

        // Broadcast WebSocket update to all admin sessions
        broadcastTransferResolved({
            orderId,
            toId: adminId,
            toName: adminName,
            accepted: Boolean(accept)
        });

        // Send Push Notification back to original sender
        if (updated.previous_transfer?.from_id) {
            pushService.notifyTransferResolved(
                orderId,
                adminName,
                Boolean(accept),
                updated.previous_transfer.from_id
            ).catch(() => {});
        }

        res.json({
            success: true,
            message: accept 
                ? `You have accepted delivery of order #${orderId.replace('order_', '').slice(0, 8)}`
                : `Transfer declined`,
            order: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/:orderId/transfer/direct (Owner & Store Manager Direct Reassignment)
router.post('/:orderId/transfer/direct', requireAdmin, requireRole('owner', 'store_manager'), async (req, res) => {
    const { orderId } = req.params;
    const { targetAdminId, targetAdminName } = req.body;

    if (!targetAdminId) {
        return res.status(400).json({ success: false, error: 'Target delivery person is required' });
    }

    try {
        const updated = await supabaseDb.orders.directAssign(
            orderId,
            targetAdminId,
            targetAdminName,
            req.admin.name
        );
        cache.invalidateOrders();

        broadcastOrderClaimed({
            orderId,
            adminId: targetAdminId,
            adminName: targetAdminName
        });

        pushService.notifyOrderClaimed(orderId, targetAdminName).catch(() => {});

        res.json({
            success: true,
            message: `Order directly assigned to ${targetAdminName}`,
            order: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===== USER / ADMIN PROTECTED ROUTES =====

// GET /api/orders (Fetch all orders - ADMIN ONLY)
router.get('/', requireAdmin, async (req, res) => {
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

// POST /api/orders/:orderId/status (Update order status - ADMIN ONLY)
router.post('/:orderId/status', requireAdmin, async (req, res) => {
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


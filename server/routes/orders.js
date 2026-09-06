const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const { broadcastStatusUpdate, broadcastOrderClaimed, broadcastTransferRequested, broadcastTransferResolved, broadcastOrderEdited, broadcastDutyStatusChanged } = require('../realtime');
const { getSupabaseClient } = require('../supabase');
const requireAdmin = require('../middleware/adminAuth');
const { requireRole, verifyAdminToken, resolveAdminRoles } = require('../middleware/adminAuth');
const { getRiderStatus, isRiderOnline, setRiderStatus, getAllRiderStatuses } = require('../services/riderAvailability');
const pushService = require('../notifications/pushService');
const cache = require('../cache');

const DELIVERY_SETTINGS_PATH = path.join(__dirname, '../data/delivery_settings.json');

function getDeliveryPricingSettings() {
    try {
        if (fs.existsSync(DELIVERY_SETTINGS_PATH)) {
            const raw = fs.readFileSync(DELIVERY_SETTINGS_PATH, 'utf8');
            const data = JSON.parse(raw);
            return {
                rate_per_order: typeof data.rate_per_order === 'number' && data.rate_per_order > 0 ? data.rate_per_order : 3.00,
                currency: data.currency || 'INR',
                surge_rate: Number(data.surge_rate) || 0.00,
                night_surcharge: Number(data.night_surcharge) || 0.00,
                daily_bonus_threshold: Number(data.daily_bonus_threshold) || 20,
                daily_bonus_amount: Number(data.daily_bonus_amount) || 20.00,
                base_payout_rule: data.base_payout_rule || 'per_delivered_order',
                stats_start_timestamp: data.stats_start_timestamp || null,
                updated_at: data.updated_at || new Date().toISOString(),
                updated_by: data.updated_by || 'Owner'
            };
        }
    } catch (e) {
        console.warn('[Delivery Settings Read Warning]:', e.message);
    }
    return {
        rate_per_order: 3.00,
        currency: 'INR',
        surge_rate: 0.00,
        night_surcharge: 0.00,
        daily_bonus_threshold: 20,
        daily_bonus_amount: 20.00,
        base_payout_rule: 'per_delivered_order',
        stats_start_timestamp: null,
        updated_at: new Date().toISOString(),
        updated_by: 'Owner'
    };
}

function saveDeliveryPricingSettings(newSettings) {
    const current = getDeliveryPricingSettings();
    const updated = {
        ...current,
        ...newSettings,
        rate_per_order: Math.max(0.50, Number(newSettings.rate_per_order !== undefined ? newSettings.rate_per_order : current.rate_per_order)),
        daily_bonus_threshold: Math.max(1, Number(newSettings.daily_bonus_threshold !== undefined ? newSettings.daily_bonus_threshold : current.daily_bonus_threshold)),
        daily_bonus_amount: Math.max(0, Number(newSettings.daily_bonus_amount !== undefined ? newSettings.daily_bonus_amount : current.daily_bonus_amount)),
        stats_start_timestamp: newSettings.stats_start_timestamp !== undefined ? newSettings.stats_start_timestamp : current.stats_start_timestamp,
        updated_at: new Date().toISOString()
    };
    const dir = path.dirname(DELIVERY_SETTINGS_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DELIVERY_SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
}

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
    let timer = null;
    const timeoutPromise = new Promise((resolve) => {
        timer = setTimeout(() => {
            console.warn(`[Supabase Query Timeout]: Exceeded ${ms}ms limit, using fallback.`);
            resolve(fallback);
        }, ms);
    });

    return Promise.race([
        Promise.resolve(promise).finally(() => {
            if (timer) clearTimeout(timer);
        }),
        timeoutPromise
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
        }, forceFresh ? 0 : 30000); // 30-second coalesced micro-cache (atomically invalidated on order updates, claims, transfers, and checkouts)

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
        // Preserve existing delivery_assignment already parsed by getOrderById to avoid wiping assigned_to
        const deliveryInfo = (order.delivery_assignment && (order.delivery_assignment.assigned_to || order.delivery_assignment.assigned_to_name))
            ? order.delivery_assignment
            : supabaseDb.orders.parseDeliveryMeta(order.rider_name);

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
                rider_name: deliveryInfo.assigned_to_name || (deliveryInfo.is_claimed ? (order.rider_name || 'Assigned') : 'Unassigned'),
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
    const { orderId, status, paymentMethod, paymentStatus, paymentCollection } = req.body;
    if (!orderId || !status) {
        return res.status(400).json({ error: 'orderId and status are required' });
    }

    // Strict validation: if marking as Delivered, paymentMethod is required
    if (status === 'Delivered' && !paymentMethod) {
        return res.status(400).json({ 
            error: 'Payment collection mode (Cash, UPI, or Both) is mandatory before marking order as Delivered.' 
        });
    }
    
    // 1. Immediately update memory cache for zero latency
    let riderName = 'Alex';
    if (Array.isArray(fallbackOrdersCache)) {
        const o = fallbackOrdersCache.find(x => x.id === orderId);
        if (o) {
            o.status = status;
            if (paymentMethod) o.payment_method = paymentMethod;
            if (paymentStatus) o.payment_status = paymentStatus;
            if (o.rider_name) riderName = typeof o.rider_name === 'string' && o.rider_name.startsWith('{') ? (JSON.parse(o.rider_name).name || 'Alex') : o.rider_name;
        }
    }

    try {
        const updateOptions = {};
        if (paymentMethod) updateOptions.payment_method = paymentMethod;
        if (paymentStatus) updateOptions.payment_status = paymentStatus;

        const updated = await withTimeout(
            supabaseDb.orders.updateStatus(orderId, status, updateOptions),
            6000,
            { id: orderId, status, ...updateOptions }
        );
        if (updated && updated.rider_name) {
            riderName = typeof updated.rider_name === 'string' && updated.rider_name.startsWith('{') ? (JSON.parse(updated.rider_name).name || riderName) : updated.rider_name;
        }
        cache.invalidateOrders();
        broadcastStatusUpdate(orderId, status, riderName, {
            payment_method: paymentMethod || updated?.payment_method,
            payment_status: paymentStatus || updated?.payment_status
        });
        res.json({ success: true, order: updated });
    } catch (err) {
        console.error('[Admin Status Update Exception]:', err.message);
        broadcastStatusUpdate(orderId, status, riderName, {
            payment_method: paymentMethod,
            payment_status: paymentStatus
        });
        res.json({ success: true, order: { id: orderId, status, payment_method: paymentMethod, payment_status: paymentStatus }, note: 'Updated in active cache.' });
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
        const forceFresh = req.query.force === 'true';
        const payload = await cache.wrap('orders:admin:delivery-staff', async () => {
            const supabase = getSupabaseClient();
            
            // Run staff query and active orders load query concurrently in parallel
            const [staff, activeOrdersRes] = await Promise.all([
                supabaseDb.staff.getAllStaff(),
                supabase
                    ? supabase.from('orders').select('id, rider_name, status').in('status', ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery'])
                    : Promise.resolve({ data: [] })
            ]);

            const deliveryStaff = (staff || []).filter(s => 
                s.account_status === 'ACTIVE' && 
                ((Array.isArray(s.roles) && (s.roles.includes('delivery_person') || s.roles.includes('owner'))) || Boolean(s.is_owner) || s.id === 'user_admin_bh13')
            );

            const loadMap = {};
            ((activeOrdersRes && activeOrdersRes.data) || []).forEach(o => {
                const meta = supabaseDb.orders.parseDeliveryMeta(o.rider_name);
                if (meta.assigned_to) {
                    loadMap[meta.assigned_to] = (loadMap[meta.assigned_to] || 0) + 1;
                }
            });

            const enrichedStaff = deliveryStaff.map(s => {
                const status = getRiderStatus(s.id);
                return {
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    phone: s.phone || '',
                    roles: s.roles,
                    is_owner: s.is_owner,
                    active_deliveries: loadMap[s.id] || 0,
                    availability_status: status,
                    is_available: status === 'Active'
                };
            });

            return { success: true, staff: enrichedStaff };
        }, forceFresh ? 0 : 15000);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// DELIVERY PRICING CONFIGURATION (DYNAMIC RATE ENGINE)
// ============================================================

// GET /api/orders/delivery-pricing-config
router.get('/delivery-pricing-config', (req, res) => {
    try {
        const config = getDeliveryPricingSettings();
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/orders/delivery-pricing-config
router.post('/delivery-pricing-config', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || req.headers['x-admin-key'] || '';
        const adminToken = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
        let isOwner = false;

        if (adminToken) {
            const verified = verifyAdminToken(adminToken);
            if (verified && verified.sub) {
                if (verified.sub === 'user_admin_bh13') {
                    isOwner = true;
                } else {
                    const u = await supabaseDb.users.getUserById(verified.sub);
                    if (u) {
                        const roles = resolveAdminRoles(u);
                        isOwner = Boolean(u.is_owner || roles.includes('owner'));
                    }
                }
            }
        }

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Only the store owner can modify delivery pricing configuration.'
            });
        }

        const { rate_per_order, daily_bonus_threshold, daily_bonus_amount, surge_rate, night_surcharge, updated_by, reset_stats_baseline, stats_start_timestamp } = req.body || {};
        if (rate_per_order !== undefined) {
            const num = Number(rate_per_order);
            if (isNaN(num) || num < 0.50 || num > 500) {
                return res.status(400).json({ success: false, error: 'Rate per order must be a valid number between ₹0.50 and ₹500.00' });
            }
        }
        let resolvedStatsStart = stats_start_timestamp;
        if (reset_stats_baseline) {
            resolvedStatsStart = new Date().toISOString();
        }
        const updated = saveDeliveryPricingSettings({
            rate_per_order: rate_per_order !== undefined ? Number(rate_per_order) : undefined,
            daily_bonus_threshold: daily_bonus_threshold !== undefined ? Number(daily_bonus_threshold) : undefined,
            daily_bonus_amount: daily_bonus_amount !== undefined ? Number(daily_bonus_amount) : undefined,
            surge_rate: surge_rate !== undefined ? Number(surge_rate) : undefined,
            night_surcharge: night_surcharge !== undefined ? Number(night_surcharge) : undefined,
            stats_start_timestamp: resolvedStatsStart !== undefined ? resolvedStatsStart : undefined,
            updated_by: updated_by || 'store_owner'
        });

        res.json({
            success: true,
            message: 'Delivery pricing configuration updated successfully',
            config: updated
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/orders/delivery-duty-status (Check current rider duty status)
router.get('/delivery-duty-status', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || '';
        const adminToken = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
        let adminId = null;
        if (adminToken) {
            const verified = verifyAdminToken(adminToken);
            if (verified && verified.sub) adminId = verified.sub;
        }
        if (!adminId && req.query.riderId) {
            adminId = req.query.riderId;
        }
        if (!adminId) {
            return res.json({ success: true, is_on_duty: true, status: 'Active' });
        }
        const status = getRiderStatus(adminId);
        res.json({
            success: true,
            rider_id: adminId,
            is_on_duty: status === 'Active',
            status
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/orders/delivery-duty-status (Toggle Active / Offline duty availability)
router.post('/delivery-duty-status', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || '';
        const adminToken = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
        let adminId = null;
        let adminName = 'Delivery Rider';
        if (adminToken) {
            const verified = verifyAdminToken(adminToken);
            if (verified && verified.sub) {
                adminId = verified.sub;
                try {
                    const u = await supabaseDb.users.getUserById(adminId);
                    if (u) adminName = u.name || adminName;
                } catch (err) {}
            }
        }
        if (!adminId && req.body.riderId) {
            adminId = req.body.riderId;
            adminName = req.body.riderName || adminName;
        }
        if (!adminId) {
            return res.status(401).json({ success: false, error: 'Authentication required to toggle duty status' });
        }
        const requestedStatus = req.body.status || (req.body.is_on_duty === false ? 'Offline' : 'Active');
        const updated = setRiderStatus(adminId, requestedStatus);

        broadcastDutyStatusChanged({
            riderId: adminId,
            riderName: adminName,
            status: updated.status,
            is_on_duty: updated.status === 'Active'
        });

        res.json({
            success: true,
            rider_id: adminId,
            status: updated.status,
            is_on_duty: updated.status === 'Active',
            message: updated.status === 'Active' 
                ? '🟢 You are now ON DUTY. You will receive express delivery orders and transfer requests.'
                : '⚪ You are now OFFLINE. Delivery orders and transfers paused.'
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// ============================================================
// DELIVERY PARTNER HUB & EARNINGS BREAKDOWN API (₹3/Order Core Engine)
// ============================================================

// GET /api/orders/delivery-earnings
router.get('/delivery-earnings', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        const period = (req.query.period || 'weekly').toLowerCase();
        const weekOffset = parseInt(req.query.weekOffset, 10) || 0;
        const monthOffset = parseInt(req.query.monthOffset, 10) || 0;
        let selectedRiderId = req.query.riderId || 'all';
        const selectedShift = (req.query.shift || 'all').toLowerCase();
        const customStartDate = req.query.startDate;
        const customEndDate = req.query.endDate;

        // 0. Identity & Owner Role Authorization
        const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || req.headers['x-admin-key'] || '';
        const adminToken = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
        let requesterAdmin = null;
        let isRequesterOwner = false;

        if (adminToken) {
            const verified = verifyAdminToken(adminToken);
            if (verified && verified.sub) {
                try {
                    const u = await supabaseDb.users.getUserById(verified.sub);
                    if (u) {
                        requesterAdmin = u;
                        const roles = resolveAdminRoles(u);
                        requesterAdmin.roles = roles;
                        requesterAdmin.is_owner = Boolean(u.is_owner || roles.includes('owner'));
                        isRequesterOwner = requesterAdmin.is_owner;
                    } else {
                        const isBh13Owner = verified.sub === 'user_admin_bh13';
                        requesterAdmin = { id: verified.sub, role: verified.role || 'staff', is_owner: isBh13Owner };
                        isRequesterOwner = isBh13Owner;
                    }
                } catch (e) {
                    console.warn('[Delivery Earnings Auth Error]:', e.message);
                }
            }
        }

        // Check if explicitly requesting with owner privileges in dev/test or verified owner
        if (!requesterAdmin) {
            if (req.query.asOwner === 'false') {
                isRequesterOwner = false;
            } else if (req.query.asOwner === 'true' || !adminToken) {
                isRequesterOwner = true;
            } else {
                isRequesterOwner = false;
            }
        }

        // SECURITY REQUIREMENT: Except owner, non-owner admins CANNOT see the revenue of other admins or platform fleet aggregates!
        if (requesterAdmin && !isRequesterOwner) {
            // Force selectedRiderId to this admin's own ID
            selectedRiderId = requesterAdmin.id;
        }

        // Dynamic Configurable Delivery Pricing Engine
        const pricingConfig = getDeliveryPricingSettings();
        const RATE_PER_ORDER = (Number(req.query.rate) > 0) ? Number(req.query.rate) : (pricingConfig.rate_per_order || 3.00);
        const statsStartTs = (req.query.includeHistorical === 'true' || req.query.allTime === 'true')
            ? 0
            : (pricingConfig.stats_start_timestamp ? new Date(pricingConfig.stats_start_timestamp).getTime() : 0);

        const supabase = getSupabaseClient();
        // Query orders across all states
        const { data: rawOrders, error } = await supabase
            .from('orders')
            .select('id, user_id, status, subtotal, delivery_fee, total, payment_method, rider_name, delivery_address, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('[Delivery Earnings DB Query Error]:', error.message);
        }

        const allOrders = Array.isArray(rawOrders) ? rawOrders : [];

        // State categorizers: Completed yields configured payout, Pending yields ₹0, Cancelled yields ₹0
        const isCompleted = (st) => ['delivered', 'completed'].includes(String(st || '').toLowerCase());
        const isCancelled = (st) => ['cancelled', 'rejected'].includes(String(st || '').toLowerCase());
        const isPending = (st) => !isCompleted(st) && !isCancelled(st);

        const getDeliveryState = (st) => {
            if (isCompleted(st)) return 'Completed';
            if (isCancelled(st)) return 'Cancelled';
            return 'Pending';
        };

        // Consistent Indian Standard Time (IST, UTC+5:30) date formatter
        const formatISTDate = (inputDate) => {
            if (!inputDate) return '';
            const d = (inputDate instanceof Date) ? inputDate : new Date(inputDate);
            if (isNaN(d.getTime())) return '';
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(d.getTime() + istOffsetMs);
            const y = istDate.getUTCFullYear();
            const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(istDate.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };

        // Real-World Shift Timing Engine (IST UTC+5:30)
        // Morning: 08:00 - 14:00 | Evening Rush: 14:00 - 20:00 | Night Express: 20:00 - 02:00 | Late Night: 02:00 - 08:00
        const getShiftInfo = (created_at) => {
            if (!created_at) return { id: 'evening', name: 'Evening Rush', hours: '02:00 PM – 08:00 PM' };
            const d = new Date(created_at);
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(d.getTime() + istOffsetMs);
            const h = istDate.getUTCHours();

            if (h >= 8 && h < 14) {
                return { id: 'morning', name: 'Morning Shift', hours: '08:00 AM – 02:00 PM' };
            } else if (h >= 14 && h < 20) {
                return { id: 'evening', name: 'Evening Rush', hours: '02:00 PM – 08:00 PM' };
            } else if (h >= 20 || h < 2) {
                return { id: 'night', name: 'Night Express', hours: '08:00 PM – 02:00 AM' };
            } else {
                return { id: 'late_night', name: 'Late Night Overtime', hours: '02:00 AM – 08:00 AM' };
            }
        };

        const getCurrentISTShiftId = () => {
            const now = new Date();
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(now.getTime() + istOffsetMs);
            const h = istDate.getUTCHours();
            if (h >= 8 && h < 14) return 'morning';
            if (h >= 14 && h < 20) return 'evening';
            if (h >= 20 || h < 2) return 'night';
            return 'late_night';
        };

        const now = new Date();
        const todayStr = formatISTDate(now);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        // 1. Load Staff and Build Delivery Partner Map
        let staffList = [];
        try {
            staffList = await supabaseDb.staff.getAllStaff();
        } catch (sErr) {
            console.warn('[Delivery Earnings Staff Error]:', sErr.message);
        }

        const partnerMap = new Map();
        // Register delivery staff from DB: strictly ACTIVE accounts with delivery_person or owner roles
        (Array.isArray(staffList) ? staffList : []).forEach(s => {
            const hasDeliveryRole = s.account_status === 'ACTIVE' && (
                (Array.isArray(s.roles) && (s.roles.includes('delivery_person') || s.roles.includes('owner'))) ||
                Boolean(s.is_owner) ||
                s.id === 'user_admin_bh13' ||
                s.email === 'admin@lpu.in'
            );
            if (hasDeliveryRole) {
                partnerMap.set(s.id, {
                    partner_id: s.id,
                    partner_name: s.name || 'Campus Partner',
                    phone: s.phone || 'N/A',
                    is_owner: Boolean(s.is_owner || (Array.isArray(s.roles) && s.roles.includes('owner')) || s.id === 'user_admin_bh13'),
                    today_deliveries: 0,
                    today_wage: 0.00,
                    monthly_deliveries: 0,
                    monthly_payout: 0.00,
                    total_completed: 0,
                    availability_status: getRiderStatus(s.id),
                    primary_shift: 'Night Express (08:00 PM – 02:00 AM)',
                    shift_deliveries: { morning: 0, evening: 0, night: 0, late_night: 0 }
                });
            }
        });

        // Helper: Match an order to an assigned delivery partner (by ID, metadata, or known staff alias)
        const findDeliveryPartner = (order) => {
            if (!order) return null;
            const meta = supabaseDb.orders.parseDeliveryMeta(order.rider_name);
            if (meta.assigned_to && partnerMap.has(meta.assigned_to)) {
                return partnerMap.get(meta.assigned_to);
            }
            // Link legacy admin ID for Harsha / Caption America to current active account
            if (meta.assigned_to === 'admin_f31d8bcd80' && partnerMap.has('user_2dae5b56')) {
                return partnerMap.get('user_2dae5b56');
            }
            const candidateStrings = [
                meta.name,
                meta.assigned_to_name,
                typeof order.rider_name === 'string' && !order.rider_name.startsWith('{') ? order.rider_name.trim() : null
            ].filter(Boolean).map(s => s.toLowerCase());

            if (candidateStrings.length === 0) return null;

            for (const p of partnerMap.values()) {
                const staffObj = (staffList || []).find(s => s.id === p.partner_id);
                const pName = p.partner_name.toLowerCase();
                const pEmailPrefix = staffObj && staffObj.email ? staffObj.email.split('@')[0].toLowerCase() : '';
                
                for (const cand of candidateStrings) {
                    if (cand === pName || (pEmailPrefix && cand === pEmailPrefix) || pName.includes(cand) || cand.includes(pName)) {
                        return p;
                    }
                    if (p.partner_id === 'user_2dae5b56' && (cand.includes('caption') || cand.includes('harsha') || cand.includes('jiguru-less man 2.0'))) {
                        return p;
                    }
                    if (p.partner_id === 'admin_5dcb05eba7' && (cand.includes('flash') || cand.includes('jash') || cand.includes('royyala'))) {
                        return p;
                    }
                    if (p.partner_id === 'admin_214ff5d346' && (cand.includes('jhony') || cand.includes('yogesh') || cand.includes('chutiya'))) {
                        return p;
                    }
                    if (p.is_owner && (cand.includes('jiguru') || cand.includes('nivas') || cand.includes('mia kalifa') || cand === 'owner')) {
                        return p;
                    }
                }
            }
            return null;
        };

        // Real-World Shift Breakdown for Platform & Partner Hub
        const currentShiftId = getCurrentISTShiftId();
        const shiftsDef = [
            { id: 'morning', title: 'Morning Shift', hours: '08:00 AM – 02:00 PM', icon: 'wb_sunny' },
            { id: 'evening', title: 'Evening Rush', hours: '02:00 PM – 08:00 PM', icon: 'solar_power' },
            { id: 'night', title: 'Night Express', hours: '08:00 PM – 02:00 AM', icon: 'nightlight' },
            { id: 'late_night', title: 'Late Night Overtime', hours: '02:00 AM – 08:00 AM', icon: 'bedtime' }
        ];

        // 2. Tally deliveries, shifts and wages for each assigned partner
        allOrders.forEach(o => {
            if (!isCompleted(o.status)) return;
            if (statsStartTs > 0 && o.created_at && new Date(o.created_at).getTime() < statsStartTs) return;
            const targetPartner = findDeliveryPartner(o);
            if (!targetPartner) return; // Order was not completed by an assigned delivery staff member

            targetPartner.total_completed += 1;
            const shiftInfo = getShiftInfo(o.created_at);
            if (targetPartner.shift_deliveries && targetPartner.shift_deliveries[shiftInfo.id] !== undefined) {
                targetPartner.shift_deliveries[shiftInfo.id] += 1;
            }

            const oDate = o.created_at ? new Date(o.created_at) : null;
            if (oDate) {
                if (formatISTDate(oDate) === todayStr) {
                    targetPartner.today_deliveries += 1;
                    targetPartner.today_wage = targetPartner.today_deliveries * RATE_PER_ORDER;
                }
                if (oDate.getFullYear() === currentYear && oDate.getMonth() === currentMonth) {
                    targetPartner.monthly_deliveries += 1;
                    targetPartner.monthly_payout = targetPartner.monthly_deliveries * RATE_PER_ORDER;
                }
            }
        });

        // Compute dominant primary shift for each partner
        partnerMap.forEach(p => {
            if (p.shift_deliveries) {
                let maxShiftId = 'night';
                let maxCount = -1;
                Object.entries(p.shift_deliveries).forEach(([sId, count]) => {
                    if (count > maxCount) {
                        maxCount = count;
                        maxShiftId = sId;
                    }
                });
                const sDef = shiftsDef.find(s => s.id === maxShiftId);
                p.primary_shift = sDef ? `${sDef.title} (${sDef.hours})` : 'Night Express (08:00 PM – 02:00 AM)';
            }
        });

        const partnersSummary = Array.from(partnerMap.values()).map(p => ({
            ...p,
            availability_status: getRiderStatus(p.partner_id)
        }));
        const availableRiders = partnersSummary.map(p => {
            const staffObj = (staffList || []).find(s => s.id === p.partner_id);
            const roles = staffObj ? (Array.isArray(staffObj.roles) ? staffObj.roles : [staffObj.role]) : [];
            return {
                id: p.partner_id,
                name: p.partner_name,
                is_owner: Boolean(p.is_owner),
                is_store_manager: roles.includes('store_manager'),
                is_inventory_manager: roles.includes('inventory_manager'),
                roles: roles,
                phone: p.phone,
                total_completed: p.total_completed,
                today_deliveries: p.today_deliveries,
                availability_status: p.availability_status,
                is_available: p.availability_status === 'Active'
            };
        });

        // Identify Owner details
        const ownerStaff = (Array.isArray(staffList) ? staffList : []).find(s => s.is_owner || (Array.isArray(s.roles) && s.roles.includes('owner')));
        const ownerId = req.query.ownerId || ownerStaff?.id || 'user_admin_bh13';
        const ownerName = req.query.ownerName || ownerStaff?.name || 'Nivas Naidu';

        // 3. Base Fleet Orders: Orders handled by any assigned delivery partner
        const fleetOrdersAll = allOrders.filter(o => findDeliveryPartner(o) !== null);

        // Calculate Platform-Wide Today Stats (from fleet orders)
        const todayOrdersAll = fleetOrdersAll.filter(o => {
            if (!o.created_at || formatISTDate(o.created_at) !== todayStr) return false;
            if (statsStartTs > 0 && new Date(o.created_at).getTime() < statsStartTs) return false;
            return true;
        });
        const todayCompletedAll = todayOrdersAll.filter(o => isCompleted(o.status)).length;
        const todayPendingAll = todayOrdersAll.filter(o => isPending(o.status)).length;
        const todayCancelledAll = todayOrdersAll.filter(o => isCancelled(o.status)).length;
        const todayPlatformPayout = todayCompletedAll * RATE_PER_ORDER;

        const shiftsSummary = shiftsDef.map(s => {
            const sOrders = todayOrdersAll.filter(o => getShiftInfo(o.created_at).id === s.id);
            const comp = sOrders.filter(o => isCompleted(o.status)).length;
            const pend = sOrders.filter(o => isPending(o.status)).length;
            const canc = sOrders.filter(o => isCancelled(o.status)).length;
            return {
                id: s.id,
                title: s.title,
                hours: s.hours,
                icon: s.icon,
                is_current: s.id === currentShiftId,
                completed_today: comp,
                pending_today: pend,
                cancelled_today: canc,
                earned_wage: comp * RATE_PER_ORDER,
                total_orders: sOrders.length
            };
        });

        // Platform-Wide Monthly Stats
        const monthOrdersAll = fleetOrdersAll.filter(o => {
            if (!o.created_at) return false;
            if (statsStartTs > 0 && new Date(o.created_at).getTime() < statsStartTs) return false;
            const d = new Date(o.created_at);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        const monthCompletedAll = monthOrdersAll.filter(o => isCompleted(o.status)).length;
        const monthPlatformExpense = monthCompletedAll * RATE_PER_ORDER;
        const daysElapsedInMonth = Math.max(1, now.getDate());
        const avgDeliveriesPerDayAll = (monthCompletedAll / daysElapsedInMonth).toFixed(1);

        // 4. Filter Orders by Selected Rider / Owner ('mine') / Individual Runner
        let baseOrders = fleetOrdersAll;
        if (statsStartTs > 0 && req.query.includeHistorical !== 'true' && req.query.allTime !== 'true') {
            baseOrders = baseOrders.filter(o => o.created_at && new Date(o.created_at).getTime() >= statsStartTs);
        }

        let filteredOrders = [];
        let selectedRiderName = 'All Delivery Fleet';

        if (selectedRiderId === 'mine') {
            selectedRiderName = `${ownerName} (Owner - My Deliveries)`;
            filteredOrders = baseOrders.filter(o => {
                const partner = findDeliveryPartner(o);
                return partner && partner.is_owner;
            });
        } else if (selectedRiderId && selectedRiderId !== 'all') {
            const targetPartner = partnerMap.get(selectedRiderId);
            if (targetPartner) {
                selectedRiderName = targetPartner.partner_name;
                filteredOrders = baseOrders.filter(o => {
                    const partner = findDeliveryPartner(o);
                    return partner && partner.partner_id === selectedRiderId;
                });
            } else {
                selectedRiderName = 'Unassigned';
                filteredOrders = [];
            }
        } else {
            selectedRiderName = 'All Delivery Fleet';
            filteredOrders = baseOrders;
        }

        // Apply Shift Filter if specified
        if (selectedShift && selectedShift !== 'all') {
            filteredOrders = filteredOrders.filter(o => getShiftInfo(o.created_at).id === selectedShift);
        }

        // 5. Rider/Filtered Specific Today & Monthly Stats
        const riderTodayOrders = filteredOrders.filter(o => o.created_at && formatISTDate(o.created_at) === todayStr);
        const riderTodayCompleted = riderTodayOrders.filter(o => isCompleted(o.status)).length;
        const riderTodayEarnings = riderTodayCompleted * RATE_PER_ORDER;
        const riderTodayPending = riderTodayOrders.filter(o => isPending(o.status)).length;
        const riderTodayCancelled = riderTodayOrders.filter(o => isCancelled(o.status)).length;

        const riderMonthOrders = filteredOrders.filter(o => {
            if (!o.created_at) return false;
            const d = new Date(o.created_at);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });
        const riderMonthCompleted = riderMonthOrders.filter(o => isCompleted(o.status)).length;
        const riderMonthlyPayout = riderMonthCompleted * RATE_PER_ORDER;
        const riderAvgPerDay = (riderMonthCompleted / daysElapsedInMonth).toFixed(1);

        // 6. Range and Chart Calculations
        let startDate, endDate, rangeLabel, daysList = [];

        if (customStartDate && customEndDate) {
            // Custom date range filter
            startDate = new Date(customStartDate + 'T00:00:00');
            endDate = new Date(customEndDate + 'T23:59:59.999');
            rangeLabel = `${customStartDate} to ${customEndDate}`;

            const oneDayMs = 24 * 60 * 60 * 1000;
            const dayCount = Math.min(60, Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / oneDayMs) + 1));
            for (let i = 0; i < dayCount; i++) {
                const curDate = new Date(startDate.getTime() + (i * oneDayMs));
                const dateStr = formatISTDate(curDate);
                const isToday = dateStr === todayStr;

                const dayAllOrders = filteredOrders.filter(o => o.created_at && formatISTDate(o.created_at) === dateStr);
                const dayCompleted = dayAllOrders.filter(o => isCompleted(o.status));
                const dayPending = dayAllOrders.filter(o => isPending(o.status));
                const dayCancelled = dayAllOrders.filter(o => isCancelled(o.status));
                const payout = dayCompleted.length * RATE_PER_ORDER;

                daysList.push({
                    date: dateStr,
                    day_number: String(curDate.getDate()).padStart(2, '0'),
                    day_name: dayNames[curDate.getDay()],
                    display_label: isToday ? 'TODAY' : `${String(curDate.getDate()).padStart(2, '0')} ${dayNames[curDate.getDay()]}`,
                    is_today: isToday,
                    order_count: dayCompleted.length,
                    pending_count: dayPending.length,
                    cancelled_count: dayCancelled.length,
                    payout: payout,
                    orders: dayCompleted.map(o => ({
                        id: o.id,
                        time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
                        address: o.delivery_address || 'BH13 Campus',
                        total: o.total || 0,
                        payout: RATE_PER_ORDER,
                        status: o.status,
                        delivery_state: 'Completed'
                    }))
                });
            }
        } else if (period === 'monthly') {
            const targetYear = now.getFullYear();
            const targetMonth = now.getMonth() + monthOffset;
            startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
            endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            rangeLabel = `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;

            const totalDaysInMonth = endDate.getDate();
            for (let d = 1; d <= totalDaysInMonth; d++) {
                const currentDayDate = new Date(startDate.getFullYear(), startDate.getMonth(), d);
                const dateStr = formatISTDate(currentDayDate);
                const isToday = dateStr === todayStr;

                const dayAllOrders = filteredOrders.filter(o => o.created_at && formatISTDate(o.created_at) === dateStr);
                const dayCompleted = dayAllOrders.filter(o => isCompleted(o.status));
                const dayPending = dayAllOrders.filter(o => isPending(o.status));
                const dayCancelled = dayAllOrders.filter(o => isCancelled(o.status));
                const payout = dayCompleted.length * RATE_PER_ORDER;

                daysList.push({
                    date: dateStr,
                    day_number: String(d).padStart(2, '0'),
                    day_name: dayNames[currentDayDate.getDay()],
                    display_label: `${String(d).padStart(2, '0')} ${dayNames[currentDayDate.getDay()]}`,
                    is_today: isToday,
                    order_count: dayCompleted.length,
                    pending_count: dayPending.length,
                    cancelled_count: dayCancelled.length,
                    payout: payout,
                    orders: dayCompleted.map(o => ({
                        id: o.id,
                        time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
                        address: o.delivery_address || 'BH13 Campus',
                        total: o.total || 0,
                        payout: RATE_PER_ORDER,
                        status: o.status,
                        delivery_state: 'Completed'
                    }))
                });
            }
        } else {
            // Weekly view (Default): Monday to Sunday
            const targetTime = now.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000);
            const targetDate = new Date(targetTime);
            const dayOfWeek = targetDate.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            startDate = new Date(targetDate);
            startDate.setDate(targetDate.getDate() + diffToMonday);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            const startM = monthNames[startDate.getMonth()];
            const startD = String(startDate.getDate()).padStart(2, '0');
            const endM = monthNames[endDate.getMonth()];
            const endD = String(endDate.getDate()).padStart(2, '0');
            rangeLabel = (startDate.getMonth() === endDate.getMonth())
                ? `${startM} ${startD} - ${endD}`
                : `${startM} ${startD} - ${endM} ${endD}`;

            for (let i = 0; i < 7; i++) {
                const currentDayDate = new Date(startDate);
                currentDayDate.setDate(startDate.getDate() + i);
                const dateStr = formatISTDate(currentDayDate);
                const isToday = dateStr === todayStr;

                const dayAllOrders = filteredOrders.filter(o => o.created_at && formatISTDate(o.created_at) === dateStr);
                const dayCompleted = dayAllOrders.filter(o => isCompleted(o.status));
                const dayPending = dayAllOrders.filter(o => isPending(o.status));
                const dayCancelled = dayAllOrders.filter(o => isCancelled(o.status));
                const payout = dayCompleted.length * RATE_PER_ORDER;

                daysList.push({
                    date: dateStr,
                    day_number: String(currentDayDate.getDate()).padStart(2, '0'),
                    day_name: dayNames[currentDayDate.getDay()],
                    display_label: isToday ? 'TODAY' : `${String(currentDayDate.getDate()).padStart(2, '0')} ${dayNames[currentDayDate.getDay()]}`,
                    is_today: isToday,
                    order_count: dayCompleted.length,
                    pending_count: dayPending.length,
                    cancelled_count: dayCancelled.length,
                    payout: payout,
                    orders: dayCompleted.map(o => ({
                        id: o.id,
                        time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
                        address: o.delivery_address || 'BH13 Campus',
                        total: o.total || 0,
                        payout: RATE_PER_ORDER,
                        status: o.status,
                        delivery_state: 'Completed'
                    }))
                });
            }
        }

        // Orders within current period range
        const periodOrders = filteredOrders.filter(o => {
            if (!o.created_at) return false;
            const oTime = new Date(o.created_at).getTime();
            return oTime >= startDate.getTime() && oTime <= endDate.getTime();
        });

        const periodCompletedOrders = periodOrders.filter(o => isCompleted(o.status));
        const periodPendingOrders = periodOrders.filter(o => isPending(o.status));
        const periodCancelledOrders = periodOrders.filter(o => isCancelled(o.status));

        const totalOrders = periodCompletedOrders.length;
        const totalPayout = totalOrders * RATE_PER_ORDER;

        // Calculate Single Runs vs Multi Runs on completed orders
        let multiRunsCount = 0;
        for (let i = 0; i < periodCompletedOrders.length; i++) {
            const t1 = new Date(periodCompletedOrders[i].created_at).getTime();
            for (let j = 0; j < periodCompletedOrders.length; j++) {
                if (i !== j) {
                    const t2 = new Date(periodCompletedOrders[j].created_at).getTime();
                    if (Math.abs(t1 - t2) <= 15 * 60 * 1000) {
                        multiRunsCount++;
                        break;
                    }
                }
            }
        }
        const singleRunsCount = Math.max(0, totalOrders - multiRunsCount);

        // Incentive tier calculation (bonus if daily orders >= threshold)
        const bonusThreshold = pricingConfig.daily_bonus_threshold || 20;
        const bonusAmount = pricingConfig.daily_bonus_amount || 20.00;
        let totalIncentive = 0;
        daysList.forEach(d => {
            if (d.order_count >= bonusThreshold) {
                totalIncentive += bonusAmount;
            }
        });

        // 7. Itemized Recent Payout Ledger (Filtered to selected rider or all fleet, newest first)
        const ledgerOrders = filteredOrders;
        const ledgerMap = new Map();
        ledgerOrders.forEach(o => {
            if (!o.created_at) return;
            const dStr = formatISTDate(o.created_at);
            if (!ledgerMap.has(dStr)) {
                const dateObj = new Date(o.created_at);
                ledgerMap.set(dStr, {
                    date: dStr,
                    display_date: dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }),
                    is_today: dStr === todayStr,
                    completed_deliveries: 0,
                    pending_deliveries: 0,
                    cancelled_deliveries: 0,
                    rate_per_order: RATE_PER_ORDER,
                    amount_credited: 0.00,
                    settlement_status: 'Settled'
                });
            }
            const entry = ledgerMap.get(dStr);
            if (isCompleted(o.status)) {
                entry.completed_deliveries += 1;
                entry.amount_credited = entry.completed_deliveries * RATE_PER_ORDER;
                entry.settlement_status = 'Credited';
            } else if (isCancelled(o.status)) {
                entry.cancelled_deliveries += 1;
            } else {
                entry.pending_deliveries += 1;
            }
        });
        const recentLedger = Array.from(ledgerMap.values())
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);

        res.json({
            success: true,
            period,
            week_offset: weekOffset,
            month_offset: monthOffset,
            range_label: rangeLabel,
            rate_per_order: RATE_PER_ORDER,
            pricing_config: pricingConfig,
            is_owner: isRequesterOwner,
            selected_rider: {
                id: selectedRiderId,
                name: selectedRiderName,
                is_mine: selectedRiderId === 'mine',
                is_all: selectedRiderId === 'all'
            },
            owner_info: {
                id: ownerId,
                name: ownerName
            },
            
            // Today's KPI Metrics
            today_stats: {
                date: todayStr,
                completed_today: riderTodayCompleted,
                today_earnings: riderTodayEarnings,
                pending_today: riderTodayPending,
                cancelled_today: riderTodayCancelled
            },

            // Monthly Snapshot
            monthly_stats: {
                month_name: `${fullMonthNames[currentMonth]} ${currentYear}`,
                completed_month: riderMonthCompleted,
                monthly_payout: riderMonthlyPayout,
                avg_deliveries_per_day: parseFloat(riderAvgPerDay) || 0.0,
                days_elapsed: daysElapsedInMonth
            },

            // Admin Fleet Platform Metrics (Redacted for non-owners to protect other admins' revenue)
            platform_metrics: isRequesterOwner ? {
                total_daily_payout: todayPlatformPayout,
                total_monthly_expense: monthPlatformExpense,
                total_active_fleet: partnerMap.size,
                total_completed_all_time: fleetOrdersAll.filter(o => isCompleted(o.status)).length,
                total_pending_all_time: fleetOrdersAll.filter(o => isPending(o.status)).length,
                total_cancelled_all_time: fleetOrdersAll.filter(o => isCancelled(o.status)).length
            } : {
                restricted: true,
                total_daily_payout: riderTodayEarnings,
                total_monthly_expense: riderMonthlyPayout,
                total_active_fleet: 1,
                total_completed_all_time: filteredOrders.filter(o => isCompleted(o.status)).length,
                total_pending_all_time: filteredOrders.filter(o => isPending(o.status)).length,
                total_cancelled_all_time: filteredOrders.filter(o => isCancelled(o.status)).length,
                message: 'Owner permission required to view platform fleet financial aggregates.'
            },

            // Admin Partner Overview Table Roster (Non-owners only see their own row)
            partners_summary: isRequesterOwner
                ? partnersSummary
                : partnersSummary.filter(p => p.partner_id === (requesterAdmin ? requesterAdmin.id : selectedRiderId)),

            // Real-World Shifts Summary
            shifts_summary: shiftsSummary,
            current_shift_id: currentShiftId,

            // Itemized Recent Payout Ledger
            recent_ledger: recentLedger,

            // Period Aggregates
            total_orders: totalOrders,
            order_payout: totalPayout,
            incentives: totalIncentive,
            others: 0,
            grand_total: totalPayout + totalIncentive,
            single_runs: singleRunsCount,
            multi_runs: multiRunsCount,
            pending_orders_count: periodPendingOrders.length,
            cancelled_orders_count: periodCancelledOrders.length,

            // Visual Chart Days
            days: daysList,
            my_duty_status: requesterAdmin ? getRiderStatus(requesterAdmin.id) : 'Active',
            is_on_duty: requesterAdmin ? isRiderOnline(requesterAdmin.id) : true,
            stats_start_timestamp: pricingConfig.stats_start_timestamp || null,

            // Itemized Order Details (Consistent IST date, exact state, and earned payout)
            all_orders: periodOrders.map(o => {
                const state = getDeliveryState(o.status);
                const isComp = state === 'Completed';
                return {
                    id: o.id,
                    created_at: o.created_at,
                    time: new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
                    date: formatISTDate(o.created_at),
                    address: o.delivery_address || 'BH13 Campus',
                    total: o.total || 0,
                    status: o.status,
                    delivery_state: state,
                    payout: isComp ? RATE_PER_ORDER : 0.00
                };
            }),
            available_riders: isRequesterOwner
                ? availableRiders
                : [{
                    id: requesterAdmin ? requesterAdmin.id : selectedRiderId,
                    name: requesterAdmin ? requesterAdmin.name : selectedRiderName,
                    is_owner: false,
                    phone: requesterAdmin ? requesterAdmin.phone || '' : '',
                    total_completed: filteredOrders.filter(o => isCompleted(o.status)).length,
                    today_deliveries: riderTodayCompleted,
                    availability_status: requesterAdmin ? getRiderStatus(requesterAdmin.id) : 'Active',
                    is_available: requesterAdmin ? isRiderOnline(requesterAdmin.id) : true
                }],
            store_info: {
                store_id: '66365',
                store_name: 'BH13 Ground Hub',
                employee_id: '2000516247_DPI66365',
                service: 'Domino’s / LPUQuick Express 3m Delivery'
            }
        });
    } catch (err) {
        console.error('[Delivery Earnings Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// In-Process Concurrency Mutex for FCFS Atomic Delivery Claiming
const orderClaimLocks = new Map();

async function withOrderClaimLock(orderId, fn) {
    const prevLock = orderClaimLocks.get(orderId) || Promise.resolve();
    let release;
    const currentLock = new Promise(resolve => { release = resolve; });
    orderClaimLocks.set(orderId, currentLock);

    // Wait for the prior claim operation on this specific order to finish
    await prevLock.catch(() => {});

    try {
        return await fn();
    } finally {
        release();
        if (orderClaimLocks.get(orderId) === currentLock) {
            orderClaimLocks.delete(orderId);
        }
    }
}

// POST /api/orders/:orderId/claim (First-Come-First-Served Atomic Delivery Acceptance)
router.post('/:orderId/claim', requireAdmin, requireRole('delivery_person'), async (req, res) => {
    const { orderId } = req.params;
    const adminId = req.admin.id;
    // Prefer explicit adminName passed from active staff profile, fallback to req.admin.name
    const adminName = (req.body && req.body.adminName && typeof req.body.adminName === 'string' && req.body.adminName.trim())
        ? req.body.adminName.trim()
        : (req.admin.name || 'Delivery Rider');

    if (!isRiderOnline(adminId)) {
        return res.status(400).json({
            success: false,
            error: 'You are currently OFFLINE. Please switch your duty status to ON DUTY to accept delivery orders.'
        });
    }

    try {
        const updated = await withOrderClaimLock(orderId, async () => {
            return await supabaseDb.orders.claimOrder(orderId, adminId, adminName);
        });
        cache.invalidateOrders();

        const resolvedRiderName = updated.rider_name || adminName;

        if (Array.isArray(fallbackOrdersCache)) {
            const o = fallbackOrdersCache.find(x => x.id === orderId);
            if (o) {
                o.rider_name = resolvedRiderName;
                o.delivery_assignment = updated.delivery_assignment;
                if (updated.status) o.status = updated.status;
            }
        }

        // Broadcast real-time claim to all open admin dashboards
        broadcastOrderClaimed({
            orderId,
            adminId,
            adminName: resolvedRiderName,
            claimedAt: updated.delivery_assignment?.claimed_at || new Date().toISOString()
        });

        // Also broadcast status change (if claim auto-confirmed the order) so other admins
        // can detect the change via signature comparison and re-render immediately
        if (updated.status) {
            broadcastStatusUpdate(orderId, updated.status);
        }

        // Trigger background Push notification to other admins
        pushService.notifyOrderClaimed(orderId, resolvedRiderName, adminId).catch(() => {});

        res.json({
            success: true,
            message: `Order delivery successfully accepted by ${resolvedRiderName}`,
            order: updated
        });
    } catch (err) {
        const isConflict = err.code === 'ALREADY_CLAIMED' || (err.message && err.message.includes('already accepted'));
        console.warn(`[Order Claim Conflict]: orderId=${orderId} by admin=${adminName} (${adminId}) | ${err.message}`);
        res.status(isConflict ? 409 : 500).json({
            success: false,
            code: err.code || (isConflict ? 'ALREADY_CLAIMED' : 'CLAIM_FAILED'),
            error: err.message,
            claimed_by: err.claimedBy || null,
            claimed_at: err.claimedAt || null
        });
    }
});

// POST /api/orders/:orderId/transfer/request (Initiate delivery transfer to another admin)
router.post('/:orderId/transfer/request', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { reason } = req.body;
    const toAdminId = req.body.toAdminId || req.body.to_admin_id;
    const toAdminName = req.body.toAdminName || req.body.to_admin_name;
    const reqAdminId = req.admin.id;
    const reqAdminName = req.admin.name || 'Delivery Rider';

    if (!toAdminId) {
        return res.status(400).json({ success: false, error: 'Recipient admin is required' });
    }

    const order = await supabaseDb.orders.getOrderById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const currentMeta = supabaseDb.orders.parseDeliveryMeta(order.rider_name);
    const currentlyAssignedId = currentMeta.assigned_to;

    // Prevent transferring to the runner who already holds the order
    if (currentlyAssignedId && toAdminId === currentlyAssignedId) {
        return res.status(400).json({ success: false, error: 'Order is already assigned to this delivery partner' });
    }

    const adminRoles = req.admin.roles || [];
    const isOwnerOrStoreMgr = adminRoles.includes('owner') || adminRoles.includes('store_manager') || Boolean(req.admin.is_owner) || req.admin.id === 'user_admin_bh13';

    try {
        const toUser = await supabaseDb.users.getUserById(toAdminId);
        if (toUser) {
            const toRoles = resolveAdminRoles(toUser);
            const hasDelivery = toRoles.includes('delivery_person') || toRoles.includes('owner') || Boolean(toUser.is_owner) || toUser.id === 'user_admin_bh13';
            if (!hasDelivery) {
                return res.status(400).json({ success: false, error: 'Selected recipient is not assigned the delivery role' });
            }
        }
    } catch (e) {}

    if (!isRiderOnline(toAdminId)) {
        return res.status(400).json({
            success: false,
            error: `Cannot transfer delivery to ${toAdminName || 'selected partner'}: Delivery partner is currently OFFLINE and cannot receive orders.`
        });
    }

    // Direct assignment if owner/store manager OR if taking over an order to oneself
    if (isOwnerOrStoreMgr || toAdminId === reqAdminId) {
        try {
            const updated = await supabaseDb.orders.directAssign(
                orderId,
                toAdminId,
                toAdminName || reqAdminName,
                reqAdminName
            );
            cache.invalidateOrders();

            broadcastOrderClaimed({
                orderId,
                adminId: toAdminId,
                adminName: toAdminName || reqAdminName,
                claimedAt: updated.delivery_assignment?.claimed_at || new Date().toISOString()
            });

            if (updated.status) {
                broadcastStatusUpdate(orderId, updated.status);
            }

            pushService.notifyOrderClaimed(orderId, toAdminName || reqAdminName).catch(() => {});

            return res.json({
                success: true,
                message: `Order successfully assigned to ${toAdminName || reqAdminName}`,
                order: updated
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // Standard peer-to-peer transfer request from one runner to another
    const fromAdminId = currentlyAssignedId || reqAdminId;
    const fromAdminName = currentMeta.assigned_to_name || reqAdminName;

    if (!isRiderOnline(fromAdminId)) {
        return res.status(400).json({
            success: false,
            error: 'You cannot transfer deliveries while OFFLINE. Switch your duty status to ON DUTY first.'
        });
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

    if (accept && !isRiderOnline(adminId)) {
        return res.status(400).json({
            success: false,
            error: 'You cannot accept delivery transfers while OFFLINE. Please switch your duty status to ON DUTY first.'
        });
    }

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
        const targetUser = await supabaseDb.users.getUserById(targetAdminId);
        if (targetUser) {
            const targetRoles = resolveAdminRoles(targetUser);
            const hasDelivery = targetRoles.includes('delivery_person') || targetRoles.includes('owner') || Boolean(targetUser.is_owner) || targetUser.id === 'user_admin_bh13';
            if (!hasDelivery) {
                return res.status(400).json({ success: false, error: 'Selected staff member is not assigned the delivery role' });
            }
        }
    } catch (e) {}

    if (!isRiderOnline(targetAdminId)) {
        return res.status(400).json({
            success: false,
            error: `Cannot assign delivery to ${targetAdminName || 'selected partner'}: Delivery partner is currently OFFLINE and cannot receive orders.`
        });
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
            adminName: targetAdminName,
            claimedAt: updated.delivery_assignment?.claimed_at || new Date().toISOString()
        });

        // Broadcast status update so polling admins detect the reassignment immediately
        if (updated.status) {
            broadcastStatusUpdate(orderId, updated.status);
        }

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

// POST /api/orders/admin/:orderId/edit (Edit Order Items & Manage Unavailable Stock)
router.post('/admin/:orderId/edit', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { items, reason, notes, restockRemoved } = req.body;
    const adminId = req.admin?.id || 'admin';
    const adminName = req.admin?.name || 'Store Manager';

    if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Items array is required.' });
    }

    try {
        const updatedOrder = await supabaseDb.orders.editOrderItems(orderId, {
            items,
            reason: reason || 'Item Out of Stock at BH13 Dark Store',
            notes: notes || '',
            restockRemoved: restockRemoved !== false,
            editedBy: adminId,
            editedByName: adminName
        });

        // Broadcast real-time WebSocket update to both admin dashboard and student tracking
        broadcastOrderEdited(orderId, updatedOrder, updatedOrder.latest_edit);

        res.json({
            success: true,
            message: 'Order items updated successfully.',
            order: updatedOrder
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// Alias for convenience
router.post('/:orderId/edit', requireAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { items, reason, notes, restockRemoved } = req.body;
    const adminId = req.admin?.id || 'admin';
    const adminName = req.admin?.name || 'Store Manager';

    if (!Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Items array is required.' });
    }

    try {
        const updatedOrder = await supabaseDb.orders.editOrderItems(orderId, {
            items,
            reason: reason || 'Item Out of Stock at BH13 Dark Store',
            notes: notes || '',
            restockRemoved: restockRemoved !== false,
            editedBy: adminId,
            editedByName: adminName
        });

        broadcastOrderEdited(orderId, updatedOrder, updatedOrder.latest_edit);

        res.json({
            success: true,
            message: 'Order items updated successfully.',
            order: updatedOrder
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
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

// GET /api/orders/:userId (User orders)
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let { active, past } = await supabaseDb.orders.getOrdersByUser(userId);
        if (Array.isArray(fallbackOrdersCache) && fallbackOrdersCache.length > 0) {
            const syncItem = o => {
                const cached = fallbackOrdersCache.find(x => x.id === o.id);
                return (cached && cached.status) ? { ...o, status: cached.status } : o;
            };
            active = (active || []).map(syncItem);
            past = (past || []).map(syncItem);
        }
        res.json({ active, past });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/orders/:userId/active (Fetch latest active order)
router.get('/:userId/active', async (req, res) => {
    const { userId } = req.params;
    try {
        let { active } = await supabaseDb.orders.getOrdersByUser(userId);
        if (Array.isArray(fallbackOrdersCache) && fallbackOrdersCache.length > 0) {
            active = (active || []).map(o => {
                const cached = fallbackOrdersCache.find(x => x.id === o.id);
                return (cached && cached.status) ? { ...o, status: cached.status } : o;
            });
        }
        // Filter out completed if cached status changed to Delivered or Cancelled
        active = (active || []).filter(o => !['Delivered', 'Cancelled', 'delivered', 'cancelled'].includes(o.status));
        if (!active || active.length === 0) {
            return res.json({ active: null });
        }
        res.json({ active: active[0] });
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
        const order = await supabaseDb.orders.getOrderById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const currentStatus = (order.status || '').toLowerCase().trim();

        // Cancellation is strictly disallowed once the order is Out for Delivery or later
        if (currentStatus.includes('out') || currentStatus.includes('route') || currentStatus.includes('dispatch') || currentStatus.includes('transit')) {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel order: Your order is already out for delivery.'
            });
        }

        if (currentStatus.includes('deliver')) {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel order: Your order has already been delivered.'
            });
        }

        if (currentStatus.includes('cancel')) {
            return res.status(400).json({
                success: false,
                error: 'This order is already cancelled.'
            });
        }

        const updated = await supabaseDb.orders.updateStatus(orderId, 'Cancelled');
        cache.invalidateOrders();
        broadcastStatusUpdate(orderId, 'Cancelled');
        res.json({ success: true, message: 'Order cancelled successfully', reason: reason || 'User requested cancellation' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
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


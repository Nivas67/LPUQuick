const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const supabaseDb = require('../db/supabaseDb');
const { getSupabaseClient } = require('../supabase');
const { requireAdmin } = require('../middleware/adminAuth');
const { getRiderDutyStatus } = require('../services/riderAvailability');
const foodOrderService = require('../services/foodOrderService');
const cache = require('../cache');
const { broadcastStatusUpdate } = require('../realtime');

// GET /api/food/config
router.get('/config', requireAdmin, (req, res) => {
    try {
        const config = foodOrderService.loadFoodConfig();
        res.json({ success: true, config });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/food/config
router.post('/config', requireAdmin, (req, res) => {
    try {
        const { assignment_method, specific_cook_id, prep_time_minutes } = req.body;
        const current = foodOrderService.loadFoodConfig();
        const updated = {
            ...current,
            assignment_method: assignment_method || current.assignment_method || 'least_loaded',
            specific_cook_id: specific_cook_id !== undefined ? specific_cook_id : current.specific_cook_id,
            prep_time_minutes: Number(prep_time_minutes) || current.prep_time_minutes || 15
        };
        foodOrderService.saveFoodConfig(updated);
        res.json({ success: true, config: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/food/cooks
router.get('/cooks', requireAdmin, async (req, res) => {
    try {
        const allStaff = await supabaseDb.staff.getAllStaff();
        const foodMeta = foodOrderService.loadFoodMeta();

        // Count active prep orders per cook
        const activeCounts = {};
        Object.values(foodMeta).forEach(meta => {
            if (meta.cook_id && meta.status !== 'Delivered' && meta.status !== 'Completed' && meta.status !== 'Rejected' && meta.status !== 'Cancelled') {
                activeCounts[meta.cook_id] = (activeCounts[meta.cook_id] || 0) + 1;
            }
        });

        const cooks = allStaff.filter(s => {
            const roles = Array.isArray(s.roles) ? s.roles : [];
            return roles.includes('cook') || roles.includes('food_department') || roles.includes('food') || s.is_owner;
        }).map(cook => {
            const duty = (typeof getRiderDutyStatus === 'function') ? getRiderDutyStatus(cook.id) : null;
            const isOnDuty = duty ? duty.duty_status === 'ON_DUTY' : (cook.account_status === 'ACTIVE');

            return {
                id: cook.id,
                name: cook.name,
                email: cook.email,
                phone: cook.phone,
                assigned_hostel_id: cook.assigned_hostel_id,
                roles: cook.roles,
                permissions: cook.permissions,
                duty_status: isOnDuty ? 'ON_DUTY' : 'OFF_DUTY',
                is_on_duty: isOnDuty,
                active_orders_count: activeCounts[cook.id] || 0
            };
        });

        res.json({ success: true, cooks });
    } catch (err) {
        console.error('[Food Cooks Fetch Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/food/products (Fetch all Quick's Instant Food items & stock)
router.get('/products', requireAdmin, async (req, res) => {
    try {
        const targetHostel = req.query.hostel_id || req.query.hostel || 'BH-13';
        const allProducts = await supabaseDb.products.getAll({ hostel_id: targetHostel, includeInactive: true });
        const foodProducts = (allProducts || []).filter(p => {
            if (p.deleted) return false;
            return foodOrderService.isFoodProduct(p);
        });
        res.json({ success: true, products: foodProducts });
    } catch (err) {
        console.error('[Food Products Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/food/products/:id/stock (Quick inline stock update for Food Department)
router.post('/products/:id/stock', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_left, delta, in_stock, hostel_id } = req.body;
        const targetHostel = hostel_id || 'BH-13';
        let newStock = 0;
        if (stock_left !== undefined) {
            newStock = Math.max(0, Number(stock_left) || 0);
        } else if (delta !== undefined) {
            const current = await supabaseDb.products.getById(id, targetHostel);
            newStock = Math.max(0, (Number(current?.stock_left) || 0) + Number(delta));
        }
        const newInStock = in_stock !== undefined ? Boolean(in_stock && newStock > 0) : newStock > 0;

        if (supabaseDb.inventory) {
            await supabaseDb.inventory.setProductStock(targetHostel, id, {
                stock_left: newStock,
                in_stock: newInStock,
                deleted: false
            });
        }
        await supabaseDb.products.update(id, {
            stock_left: newStock,
            in_stock: newInStock
        });

        const cache = require('../cache');
        cache.invalidateProducts();
        const { broadcastInventoryUpdate, broadcastCatalogUpdate } = require('../realtime');
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(id, newStock, newInStock, targetHostel);
        }
        if (typeof broadcastCatalogUpdate === 'function') {
            broadcastCatalogUpdate(id, targetHostel, 'update');
        }

        res.json({ success: true, productId: id, stock_left: newStock, in_stock: newInStock });
    } catch (err) {
        console.error('[Food Stock Update Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/food/orders (Complete order details for Admin & Cook Dashboard)
router.get('/orders', requireAdmin, async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        const foodMeta = foodOrderService.loadFoodMeta();
        const { filter, cook_id } = req.query;

        // 1. Fetch live orders from database to ensure fresh data
        let dbOrders = [];
        if (supabase) {
            const { data } = await supabase
                .from('orders')
                .select('id, user_id, status, total, delivery_address, created_at, customer_name, customer_phone, hostel_id, rider_name, payment_method, payment_status')
                .order('created_at', { ascending: false })
                .limit(100);
            if (data) dbOrders = data;
        }

        // 2. Load order item snapshots for historical itemized prices
        let snapshots = {};
        try {
            const snapshotsPath = path.join(__dirname, '..', 'data', 'order_snapshots.json');
            if (fs.existsSync(snapshotsPath)) {
                snapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
            }
        } catch (e) {}

        const allStaff = await supabaseDb.staff.getAllStaff();
        const cookMap = new Map();
        allStaff.forEach(s => cookMap.set(s.id, s.name));

        const orderMap = new Map();

        // Add all recorded food orders from meta
        Object.values(foodMeta).forEach(record => {
            orderMap.set(record.order_id, { ...record });
        });

        // Scan DB orders for any order containing Quick's Instant Food that might not be in meta yet
        dbOrders.forEach(order => {
            const snap = snapshots[order.id] || snapshots[`order_${order.id}`];
            const items = snap?.items || order.items || [];
            const foodItems = items.filter(foodOrderService.isFoodProduct);

            if (foodItems.length > 0 && !orderMap.has(order.id)) {
                const rawAddress = order.delivery_address || '';
                const roomMatch = rawAddress.match(/Room\s*([a-zA-Z0-9\-]+)/i);
                const roomNumber = roomMatch ? roomMatch[1] : '';

                const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                orderMap.set(order.id, {
                    order_id: order.id,
                    customer_name: order.customer_name || 'Hostel Student',
                    customer_phone: order.customer_phone || '',
                    customer_email: '',
                    delivery_address: rawAddress,
                    hostel_id: order.hostel_id || 'BH-13',
                    room_number: roomNumber || 'Not specified',
                    food_items: foodItems.map(i => ({
                        id: i.product_id || i.id,
                        name: i.name || i.product_name || "Quick's Instant Food",
                        quantity: Number(i.quantity) || 1,
                        price: Number(i.price || i.selling_price || 0),
                        line_total: (Number(i.quantity) || 1) * Number(i.price || i.selling_price || 0),
                        image_url: i.image_url || ''
                    })),
                    total_amount: order.total || foodItems.reduce((s, i) => s + (i.price * i.quantity), 0),
                    payment_status: order.payment_status || 'pending',
                    payment_method: order.payment_method || 'Pay on Delivery',
                    order_date: order.created_at || new Date().toISOString(),
                    order_time_formatted: formattedDate,
                    status: order.status || 'Order Placed',
                    cook_id: null,
                    cook_name: 'Kitchen Chef',
                    special_instructions: 'None',
                    order_type: rawAddress.toLowerCase().includes('takeaway') ? 'takeaway' : 'delivery',
                    created_at: order.created_at || new Date().toISOString()
                });
            }
        });

        let result = Array.from(orderMap.values());

        // Sort by created_at descending (newest first)
        result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        // Filter by cook_id if specified (for dedicated cook dashboard)
        if (cook_id && cook_id !== 'all') {
            result = result.filter(o => !o.cook_id || o.cook_id === cook_id || req.admin?.is_owner);
        }

        // Filter by status tab: active vs previous/completed
        if (filter === 'active') {
            result = result.filter(o => o.status !== 'Completed' && o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Rejected');
        } else if (filter === 'completed') {
            result = result.filter(o => o.status === 'Completed' || o.status === 'Delivered' || o.status === 'Cancelled' || o.status === 'Rejected');
        }

        res.json({ success: true, orders: result });
    } catch (err) {
        console.error('[Food Orders Fetch Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/food/orders/:id (Individual order details)
router.get('/orders/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const foodMeta = foodOrderService.loadFoodMeta();
        const order = foodMeta[id];
        if (order) {
            return res.json({ success: true, order });
        }
        res.status(404).json({ success: false, error: 'Food order not found' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/food/orders/:id/status (Accept, Reject, Preparing, Ready, Completed)
router.post('/orders/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
    }

    try {
        const updatedBy = req.admin?.name || 'Cook';
        const updated = await foodOrderService.updateFoodOrderStatus(id, status, updatedBy, reason);
        if (typeof cache?.invalidateOrders === 'function') cache.invalidateOrders();
        if (typeof broadcastStatusUpdate === 'function') {
            broadcastStatusUpdate(id, status, updated?.cook_name || 'Kitchen Express');
        }
        res.json({ success: true, orderId: id, status, order: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/food/orders/:id/reassign
router.post('/orders/:id/reassign', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { cook_id, reason } = req.body;

    if (!cook_id) {
        return res.status(400).json({ success: false, error: 'Target cook_id is required' });
    }

    try {
        const allStaff = await supabaseDb.staff.getAllStaff();
        const targetCook = allStaff.find(s => s.id === cook_id);
        const cookName = targetCook ? targetCook.name : 'Kitchen Chef';

        const foodMeta = foodOrderService.loadFoodMeta();
        foodMeta[id] = {
            ...(foodMeta[id] || {}),
            cook_id,
            cook_name: cookName,
            cook_phone: targetCook?.phone || '',
            reassigned_at: new Date().toISOString(),
            reassign_reason: reason || 'Reassigned by Admin'
        };
        foodOrderService.saveFoodMeta(foodMeta);

        await supabaseDb.audit.logAction({
            adminId: req.admin.id,
            action: 'FOOD_ORDER_REASSIGNED',
            metadata: { orderId: id, targetCookId: cook_id, targetCookName: cookName, reason }
        });

        res.json({ success: true, message: 'Order reassigned successfully', cook_name: cookName });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/food/metrics
router.get('/metrics', requireAdmin, async (req, res) => {
    try {
        const allStaff = await supabaseDb.staff.getAllStaff();
        const cooks = allStaff.filter(s => {
            const roles = Array.isArray(s.roles) ? s.roles : [];
            return roles.includes('cook') || roles.includes('food_department') || roles.includes('food') || s.is_owner;
        });

        const onDutyCooks = cooks.filter(c => {
            const duty = (typeof getRiderDutyStatus === 'function') ? getRiderDutyStatus(c.id) : null;
            return duty ? duty.duty_status === 'ON_DUTY' : (c.account_status === 'ACTIVE');
        }).length;

        const foodMeta = foodOrderService.loadFoodMeta();
        let total = 0;
        let pending = 0;
        let prep = 0;
        let ready = 0;
        let comp = 0;

        Object.values(foodMeta).forEach(m => {
            total++;
            const s = (m.status || '').toLowerCase();
            if (s === 'order placed' || s === 'new' || s === 'pending') pending++;
            else if (s.includes('prep') || s.includes('cook') || s === 'accepted') prep++;
            else if (s.includes('ready')) ready++;
            else if (s.includes('deliver') || s.includes('complete')) comp++;
        });

        res.json({
            success: true,
            metrics: {
                total_food_orders: total,
                pending_count: pending,
                preparing_count: prep,
                ready_count: ready,
                completed_count: comp,
                on_duty_cooks: onDutyCooks || cooks.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

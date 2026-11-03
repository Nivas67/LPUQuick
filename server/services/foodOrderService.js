const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const { getSupabaseClient } = require('../supabase');
const { getRiderDutyStatus } = require('./riderAvailability');
const { broadcastFoodOrderPlaced, broadcastFoodStatusUpdate } = require('../realtime');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'food_config.json');
const FOOD_META_FILE = path.join(__dirname, '..', 'data', 'food_orders_meta.json');

function loadFoodConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch (e) { }
    return {
        assignment_method: 'least_loaded',
        prep_time_minutes: 15,
        specific_cook_id: null
    };
}

function saveFoodConfig(cfg) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
    } catch (e) {
        console.warn('[Food Config Save Note]:', e.message);
    }
}

function loadFoodMeta() {
    try {
        if (fs.existsSync(FOOD_META_FILE)) {
            return JSON.parse(fs.readFileSync(FOOD_META_FILE, 'utf8'));
        }
    } catch (e) { }
    return {};
}

function saveFoodMeta(meta) {
    try {
        const dir = path.dirname(FOOD_META_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(FOOD_META_FILE, JSON.stringify(meta, null, 2), 'utf8');
    } catch (e) {
        console.warn('[Food Meta Save Note]:', e.message);
    }
}

/**
 * Strict Food Product Identifier:
 * Specifically for freshly prepared food items under "Quick's Instant Food".
 * Explicitly DOES NOT match packaged snacks or "Quick's Instant Snacks".
 */
function isFoodProduct(item) {
    if (!item) return false;
    const cat = (item.category || '').trim().toLowerCase();
    const sub = (item.subcategory || '').trim().toLowerCase();
    const name = (item.name || item.product_name || '').trim().toLowerCase();

    // STRICT EXCLUSION: Never mix Quick's Instant Snacks or packaged snack products
    if (cat.includes('instant snacks') || sub.includes('instant snacks') || cat.includes('snacks & munchies')) {
        return false;
    }
    if (/bhelpuri|namkeen|bhujia|chips|wafer|biscuit|cookie|kurkure|crisp|sev|mixture/i.test(name)) {
        return false;
    }
    if (cat === 'snacks & beverages' && !sub.includes('instant food') && !sub.includes('cook') && !sub.includes('magiee & noodles') && !sub.includes('cooked meals') && !sub.includes('sandwiches & burgers') && !sub.includes('pasta & macaroni') && !sub.includes('hot snacks & fries') && !sub.includes('soups & bowls')) {
        return false;
    }

    // Direct Category Match for Quick's Instant Food
    if (cat === "quick's instant food" || cat === "quicks instant food" || cat === "instant food") {
        return true;
    }
    if (sub === "quick's instant food" || sub === "quicks instant food" || sub === "instant food" || sub === "cook") {
        return true;
    }
    if (sub.includes('magiee & noodles') || sub.includes('cooked meals') || sub.includes('sandwiches & burgers') || sub.includes('pasta & macaroni') || sub.includes('hot snacks & fries') || sub.includes('soups & bowls')) {
        return true;
    }

    // Fresh Prepared Kitchen keywords
    if (/magiee|cooked meal|hot meal|thali|paratha|sandwich|fresh pasta|fresh burger|chai|coffee|soup|chowmein|macroni/i.test(name)) {
        return true;
    }

    return false;
}

/**
 * Automatically assign incoming food orders to on-duty food department cooks
 */
async function resolveAssignedCook(targetHostel = null) {
    try {
        const allStaff = await supabaseDb.staff.getAllStaff();
        const config = loadFoodConfig();

        // Filter cooks
        const cooks = allStaff.filter(s => {
            const roles = Array.isArray(s.roles) ? s.roles : [];
            return roles.includes('cook') || roles.includes('food_department') || roles.includes('food');
        });

        if (cooks.length === 0) {
            // Fallback to platform owner or general admin
            const owner = allStaff.find(s => s.is_owner) || allStaff[0];
            return {
                id: owner ? owner.id : 'cook_general',
                name: owner ? owner.name : 'Kitchen Chef',
                phone: owner ? owner.phone : '',
                email: owner ? owner.email : ''
            };
        }

        // 1. Specific cook strategy
        if (config.assignment_method === 'specific_cook' && config.specific_cook_id) {
            const matched = cooks.find(c => c.id === config.specific_cook_id);
            if (matched) return matched;
        }

        // 2. Filter on-duty cooks
        const onDutyCooks = cooks.filter(c => {
            const duty = (typeof getRiderDutyStatus === 'function') ? getRiderDutyStatus(c.id) : null;
            return duty ? duty.duty_status === 'ON_DUTY' : (c.account_status === 'ACTIVE');
        });

        const pool = onDutyCooks.length > 0 ? onDutyCooks : cooks;

        // 3. Least loaded strategy (count active orders)
        const foodMeta = loadFoodMeta();
        const activeCounts = {};
        Object.values(foodMeta).forEach(m => {
            if (m.cook_id && m.status !== 'Delivered' && m.status !== 'Completed' && m.status !== 'Rejected' && m.status !== 'Cancelled') {
                activeCounts[m.cook_id] = (activeCounts[m.cook_id] || 0) + 1;
            }
        });

        pool.sort((a, b) => (activeCounts[a.id] || 0) - (activeCounts[b.id] || 0));
        return pool[0];
    } catch (err) {
        console.error('[Food Order Assign Error]:', err.message);
        return { id: 'cook_default', name: 'Kitchen Chef', phone: '', email: '' };
    }
}

/**
 * Handle new order placement for Quick's Instant Food items
 */
async function handleNewFoodOrder({ orderId, orderPayload, foodItems, instructions = '' }) {
    if (!orderId || !Array.isArray(foodItems) || foodItems.length === 0) return null;

    // Filter strictly to freshly prepared Quick's Instant Food items
    const pureFoodItems = foodItems.filter(isFoodProduct).map(item => ({
        id: item.product_id || item.id,
        name: item.name || item.product_name || "Quick's Instant Food",
        quantity: Number(item.quantity) || 1,
        price: Number(item.price || item.selling_price || 0),
        line_total: (Number(item.quantity) || 1) * Number(item.price || item.selling_price || 0),
        image_url: item.image_url || ''
    }));

    if (pureFoodItems.length === 0) return null;

    const assignedCook = await resolveAssignedCook(orderPayload?.hostel_id);
    const nowIso = new Date().toISOString();

    const formattedDate = new Date().toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const rawAddress = orderPayload?.delivery_address || '';
    const roomMatch = rawAddress.match(/Room\s*([a-zA-Z0-9\-]+)/i);
    const roomNumber = roomMatch ? roomMatch[1] : '';

    const foodOrderRecord = {
        order_id: orderId,
        customer_name: orderPayload?.customer_name || 'Hostel Student',
        customer_phone: orderPayload?.customer_phone || '',
        customer_email: orderPayload?.customer_email || '',
        delivery_address: rawAddress,
        hostel_id: orderPayload?.hostel_id || 'BH-13',
        room_number: roomNumber || 'Not specified',
        food_items: pureFoodItems,
        total_amount: orderPayload?.total || pureFoodItems.reduce((s, i) => s + i.line_total, 0),
        payment_status: orderPayload?.payment_status || 'pending',
        payment_method: orderPayload?.payment_method || 'Cash on Delivery',
        order_date: nowIso,
        order_time_formatted: formattedDate,
        status: 'Order Placed',
        cook_id: assignedCook?.id || null,
        cook_name: assignedCook?.name || 'Kitchen Chef',
        cook_phone: assignedCook?.phone || '',
        special_instructions: instructions && instructions.trim() ? instructions.trim() : 'None',
        order_type: rawAddress.toLowerCase().includes('takeaway') ? 'takeaway' : 'delivery',
        created_at: nowIso,
        updated_at: nowIso
    };

    const foodMeta = loadFoodMeta();
    foodMeta[orderId] = foodOrderRecord;
    saveFoodMeta(foodMeta);

    // Broadcast Real-Time Notification to Admin & Assigned Cook WebSocket
    try {
        if (typeof broadcastFoodOrderPlaced === 'function') {
            broadcastFoodOrderPlaced({
                order: foodOrderRecord,
                target_cook_id: assignedCook?.id
            });
        }
    } catch (wsErr) {
        console.warn('[Food Order WS Broadcast Warning]:', wsErr.message);
    }

    // Trigger Push Notification to assigned cook
    try {
        const pushService = require('../notifications/pushService');
        if (pushService && typeof pushService.notifyNewOrder === 'function') {
            pushService.notifyNewOrder({
                id: orderId,
                total: foodOrderRecord.total_amount,
                delivery_address: rawAddress,
                customer_name: `${foodOrderRecord.customer_name} (🍳 Fresh Food Order)`
            }).catch(() => { });
        }
    } catch (e) { }

    return foodOrderRecord;
}

/**
 * Update food order status with real-time sync across Customer, Admin, and Cook
 */
async function updateFoodOrderStatus(orderId, status, updatedBy = 'Cook', reason = '') {
    const foodMeta = loadFoodMeta();
    const cleanId = String(orderId || '').replace(/^#/, '').trim();

    // Flexible key resolution (matches order_test_398956, test_398956, #TEST_398956)
    const foodKey = Object.keys(foodMeta).find(k =>
        k === cleanId ||
        k.toLowerCase() === cleanId.toLowerCase() ||
        k === `order_${cleanId}` ||
        k.toLowerCase() === `order_${cleanId}`.toLowerCase() ||
        cleanId === `order_${k}` ||
        cleanId.toLowerCase() === `order_${k}`.toLowerCase()
    ) || (cleanId.startsWith('order_') ? cleanId : `order_${cleanId}`);

    const current = foodMeta[foodKey] || {};
    const nowIso = new Date().toISOString();
    const normStatus = String(status || '').trim();
    const sLower = normStatus.toLowerCase();

    // Standardize status label
    let canonicalStatus = normStatus;
    if (sLower === 'placed' || sLower === 'order placed') canonicalStatus = 'Order Placed';
    else if (sLower === 'accepted') canonicalStatus = 'Accepted';
    else if (sLower === 'cooking' || sLower === 'preparing' || sLower === 'in progress') canonicalStatus = 'Preparing';
    else if (sLower === 'ready' || sLower === 'ready in kitchen') canonicalStatus = 'Ready';
    else if (sLower === 'completed' || sLower === 'delivered' || sLower === 'done') canonicalStatus = 'Completed';
    else if (sLower === 'cancelled' || sLower === 'canceled') canonicalStatus = 'Cancelled';
    else if (sLower === 'rejected') canonicalStatus = 'Rejected';

    const updated = {
        ...current,
        order_id: foodKey,
        status: canonicalStatus,
        updated_by: updatedBy,
        rejection_reason: reason || current.rejection_reason || '',
        updated_at: nowIso
    };

    if (canonicalStatus === 'Accepted') updated.accepted_at = nowIso;
    if (canonicalStatus === 'Preparing') updated.preparing_at = nowIso;
    if (canonicalStatus === 'Ready') updated.ready_at = nowIso;
    if (canonicalStatus === 'Completed') updated.completed_at = nowIso;
    if (canonicalStatus === 'Cancelled') updated.cancelled_at = nowIso;
    if (canonicalStatus === 'Rejected') updated.rejected_at = nowIso;

    foodMeta[foodKey] = updated;
    saveFoodMeta(foodMeta);

    // Synchronize overall order status in database if order exists in Supabase
    try {
        if (canonicalStatus === 'Preparing') {
            await supabaseDb.orders.updateOrderStatus(foodKey, 'Preparing', { adminName: updatedBy }).catch(() => { });
        } else if (canonicalStatus === 'Ready') {
            await supabaseDb.orders.updateOrderStatus(foodKey, 'Out for Delivery', { adminName: updatedBy }).catch(() => { });
        } else if (canonicalStatus === 'Completed') {
            await supabaseDb.orders.updateOrderStatus(foodKey, 'Delivered', { adminName: updatedBy }).catch(() => { });
        } else if (canonicalStatus === 'Cancelled' || canonicalStatus === 'Rejected') {
            await supabaseDb.orders.cancelOrder(foodKey, reason || `Order ${canonicalStatus} by ${updatedBy}`, 'admin').catch(() => { });
        }
    } catch (dbSyncErr) {
        console.warn('[Food Order DB Sync Notice]:', dbSyncErr.message);
    }

    // Real-Time WebSocket broadcast to Customer, Admin, and Cook dashboards
    try {
        if (typeof broadcastFoodStatusUpdate === 'function') {
            broadcastFoodStatusUpdate({
                orderId: foodKey,
                status: canonicalStatus,
                updatedBy: updatedBy,
                reason: reason,
                order: updated
            });
        }
    } catch (wsErr) {
        console.warn('[Food Order Status WS Broadcast Warning]:', wsErr.message);
    }

    return updated;
}

function cancelFoodOrder(orderId, reason = '') {
    return updateFoodOrderStatus(orderId, 'Cancelled', 'System', reason);
}

module.exports = {
    loadFoodConfig,
    saveFoodConfig,
    loadFoodMeta,
    saveFoodMeta,
    isFoodProduct,
    resolveAssignedCook,
    handleNewFoodOrder,
    updateFoodOrderStatus,
    cancelFoodOrder
};

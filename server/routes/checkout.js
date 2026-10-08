const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabaseDb = require('../db/supabaseDb');
const { broadcastOrderPlaced, broadcastInventoryUpdate } = require('../realtime');
const cache = require('../cache');
const checkoutSettingsService = require('../services/checkoutSettingsService');

// In-Process Concurrency Mutex for Checkout Idempotency & Duplicate Order Prevention
const checkoutLocks = new Map();

async function withCheckoutLock(lockKey, fn) {
    const prevLock = checkoutLocks.get(lockKey) || Promise.resolve();
    let release;
    const currentLock = new Promise(resolve => { release = resolve; });
    checkoutLocks.set(lockKey, currentLock);

    await prevLock.catch(() => {});

    try {
        return await fn();
    } finally {
        release();
        if (checkoutLocks.get(lockKey) === currentLock) {
            checkoutLocks.delete(lockKey);
        }
    }
}

// POST /api/checkout and /api/checkout/place
async function handlePlaceOrder(req, res) {
    let userId = req.body.userId || req.body.user_id;
    const guestUserId = req.body.guestUserId || req.body.guest_id;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const deliveryAddress = req.body.deliveryAddress || req.body.delivery_address;
    const customOrderId = req.body.orderId || req.body.order_id || req.body.customOrderId || req.body.custom_order_id;
    const clientItems = Array.isArray(req.body.items) && req.body.items.length > 0 ? req.body.items : null;

    // Fast Idempotency Check: If customOrderId is provided and already exists, return it immediately
    if (customOrderId) {
        try {
            const existingOrder = await supabaseDb.orders.getOrderById(customOrderId);
            if (existingOrder) {
                console.log(`[Checkout Idempotency]: Order ${customOrderId} already processed, returning existing order.`);
                return res.json({
                    success: true,
                    message: 'Order confirmed (idempotent)',
                    order: existingOrder,
                    idempotent: true
                });
            }
        } catch (e) {}
    }

    const lockKey = customOrderId ? `checkout:order:${customOrderId}` : `checkout:user:${userId || 'anon'}`;
    return withCheckoutLock(lockKey, async () => {
        // Re-check idempotency under lock to handle simultaneous dual-clicks
        if (customOrderId) {
            try {
                const existingOrder = await supabaseDb.orders.getOrderById(customOrderId);
                if (existingOrder) {
                    return res.json({
                        success: true,
                        message: 'Order confirmed (idempotent)',
                        order: existingOrder,
                        idempotent: true
                    });
                }
            } catch (e) {}
        }

        return await executeOrderPlacement(req, res, {
            userId,
            guestUserId,
            paymentMethod,
            deliveryAddress,
            customOrderId,
            clientItems
        });
    });
}

async function executeOrderPlacement(req, res, { userId, guestUserId, paymentMethod, deliveryAddress, customOrderId, clientItems }) {
    // Extract & validate mandatory 10-digit mobile number
    const checkPhone = (req.body.customerPhone || req.body.phone || '').replace(/\D/g, '');
    if (!checkPhone || checkPhone.length !== 10) {
        let existingUserPhone = '';
        if (userId && !userId.startsWith('guest_')) {
            try {
                const u = await supabaseDb.users.getById(userId);
                if (u && u.phone) existingUserPhone = u.phone.replace(/\D/g, '');
            } catch (e) {}
        }
        if (!existingUserPhone || existingUserPhone.length !== 10) {
            return res.status(400).json({ error: 'Valid 10-digit mobile number is mandatory so our runner can call your room on arrival.' });
        }
    }

    // Seamless Student Account Bridge: If guest or unassigned, auto-resolve user by 10-digit phone
    if (!userId || userId === 'null' || userId === 'undefined' || userId.startsWith('guest_') || userId === 'anonymous') {
        userId = `user_phone_${checkPhone}`;
    }

    // Multi-Hostel Candidate Resolution for Availability Guard
    const candidateHostel = req.body.hostel_id || req.body.hostel || (
        typeof deliveryAddress === 'string' ? deliveryAddress.match(/(BH-?\d+|GH-?\d+)/i)?.[1]?.replace(/^(BH|GH)(\d+)$/i, '$1-$2')?.toUpperCase() : null
    ) || 'BH-13';

    // 1 & 2. HIGH-PERFORMANCE CONCURRENT STORE AVAILABILITY & BLACKLIST VERIFICATION
    try {
        const [storeStatus, blacklistCheck] = await Promise.all([
            supabaseDb.availability.getStatus(candidateHostel).catch(() => null),
            supabaseDb.blacklist.isUserBlacklisted(userId).catch(() => null)
        ]);

        if (blacklistCheck && blacklistCheck.isBlacklisted) {
            const reason = blacklistCheck.reason || 'Fake Orders';
            return res.status(403).json({
                success: false,
                error: 'ACCOUNT_BLOCKED',
                code: 'ACCOUNT_BLOCKED',
                message: `You are blocked due to ${reason.toLowerCase()}.`,
                reason: reason
            });
        }

        if (storeStatus && storeStatus.is_locked) {
            return res.status(400).json({
                success: false,
                error: 'STORE_CLOSED',
                code: 'STORE_CLOSED',
                message: storeStatus.message || `Store for ${candidateHostel} is temporarily closed.`,
                reopen_at: storeStatus.reopen_at,
                display_reopen: storeStatus.display_reopen,
                availability: storeStatus
            });
        }
    } catch (guardErr) {
        console.warn('[Checkout Guard Warning]:', guardErr.message);
    }

    // Strict Address Check: Must be non-empty and explicitly contain a room number
    if (!deliveryAddress || typeof deliveryAddress !== 'string' || deliveryAddress.trim().length < 5 || 
        deliveryAddress.includes('Please set') || 
        deliveryAddress.includes('Room null') || 
        deliveryAddress.includes('Room undefined')) {
        return res.status(400).json({ error: 'Hostel delivery address is required. Please set your hostel room number before placing an order.' });
    }

    const hasRoomNumber = /Room\s*[a-zA-Z0-9\-]+/i.test(deliveryAddress) || /Flat\s*[a-zA-Z0-9\-]+/i.test(deliveryAddress);
    if (!hasRoomNumber) {
        return res.status(400).json({ error: 'Valid hostel room number is required (e.g., BH13 (Block A), Room 304).' });
    }

    try {
        // Prioritize explicit client items (e.g. Fast-Track Buy Now / Instant Checkout) to avoid unnecessary DB roundtrips
        let orderItems = clientItems;
        if (!orderItems || orderItems.length === 0) {
            let cart = await supabaseDb.cart.getCart(userId);
            if ((!cart.items || cart.items.length === 0) && guestUserId) {
                cart = await supabaseDb.cart.getCart(guestUserId);
            }
            orderItems = cart.items;
        }

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
        }

        // Normalize item fields (product_id, quantity, price)
        orderItems = orderItems.map(item => ({
            ...item,
            product_id: item.product_id || item.productId || item.id,
            quantity: Math.max(1, Number(item.quantity) || 1),
            price: Number(item.price) || 0
        }));

        // Multi-Hostel Validation & Resolution
        function normalizeCheckoutHostel(input) {
            if (!input || input === 'all' || input === 'ALL') return null;
            const str = String(input).trim().toUpperCase();
            const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i) || str.match(/(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
            if (match) {
                return `${match[1].toUpperCase()}-${match[2]}`;
            }
            return str.replace(/[^A-Z0-9]/g, '');
        }

        const rawHostel = req.body.hostel_id || (
            typeof deliveryAddress === 'string' ? deliveryAddress.match(/(BH-?\d+|GH-?\d+)/i)?.[0] : null
        ) || req.body.hostel || orderItems[0]?.hostel_id || 'BH-13';
        const targetHostelId = normalizeCheckoutHostel(rawHostel) || 'BH-13';

        // Authoritative Server-Side Price Verification: Re-fetch catalog prices from DB
        try {
            const productIds = orderItems.map(item => item.product_id).filter(Boolean);
            if (productIds.length > 0 && supabaseDb.products) {
                const dbProducts = await supabaseDb.products.getByIds(productIds, targetHostelId);
                if (dbProducts && dbProducts.length > 0) {
                    const dbProductMap = new Map(dbProducts.map(p => [p.id, p]));
                    for (const item of orderItems) {
                        const dbProd = dbProductMap.get(item.product_id);
                        if (dbProd) {
                            item.price = Number(dbProd.price);
                            item.name = dbProd.name || item.name;
                            if (dbProd.cost_price !== undefined) item.cost_price = Number(dbProd.cost_price) || 0;
                            if (dbProd.mrp !== undefined) item.mrp = Number(dbProd.mrp) || item.price;
                        }
                    }
                }
            }
        } catch (pvErr) {
            console.warn('[Checkout Price Verification Notice]:', pvErr.message);
        }

        // Load specific dark store inventory for this selected hostel
        let hostelInv = {};
        if (targetHostelId && supabaseDb.inventory) {
            try {
                hostelInv = await supabaseDb.inventory.getHostelInventory(targetHostelId);
            } catch (e) {}
        }

        // Validate stock limits against the selected hostel's inventory
        for (const item of orderItems) {
            const override = hostelInv[item.product_id];
            let availableStock = 0;
            let isInStock = false;
            if (override !== undefined && !override.deleted) {
                availableStock = Math.max(0, Number(override.stock_left) || 0);
                isInStock = Boolean(override.in_stock && availableStock > 0);
            }

            if (!isInStock || availableStock <= 0) {
                return res.status(400).json({ error: `"${item.name || 'Item'}" is currently out of stock in ${targetHostelId}. Please remove it from your cart to proceed.` });
            }
            if (item.quantity > availableStock) {
                return res.status(400).json({ error: `Only ${availableStock} units of "${item.name}" left in stock in ${targetHostelId} (you have ${item.quantity} in cart). Please adjust quantity.` });
            }
        }

        // 1. Prevent ordering from an inactive / OFF hostel
        try {
            const targetHostel = await supabaseDb.hostels.getById(targetHostelId);
            if (targetHostel && targetHostel.status !== 'ACTIVE') {
                return res.status(400).json({
                    success: false,
                    error: 'HOSTEL_OFF',
                    code: 'HOSTEL_OFF',
                    message: `${targetHostel.name || targetHostelId} is currently not accepting new orders (opening soon).`
                });
            }
        } catch (hErr) {
            console.warn('[Checkout Hostel Status Check Warning]:', hErr.message);
        }

        // 2. Prevent mixing items from different hostels in a single order
        const itemHostels = new Set(orderItems.map(it => it.hostel_id).filter(Boolean));
        if (itemHostels.size > 1) {
            return res.status(400).json({
                success: false,
                error: 'MIXED_HOSTELS',
                code: 'MIXED_HOSTELS',
                message: 'Your cart contains items from multiple hostels. An order can only contain items from one hostel at a time.'
            });
        }

        const checkoutSettings = await checkoutSettingsService.getSettings();
        const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        const MIN_ORDER_VALUE = Number(checkoutSettings.min_cart_value) || 35;
        if (subtotal < MIN_ORDER_VALUE) {
            return res.status(400).json({
                error: `Minimum order value is ₹${MIN_ORDER_VALUE}. Please add items worth ₹${MIN_ORDER_VALUE - subtotal} more to place your order.`
            });
        }

        const pricingBreakdown = checkoutSettingsService.calculateCharges(orderItems, checkoutSettings);
        const handlingFee = pricingBreakdown.platform_fee;
        const deliveryFee = pricingBreakdown.delivery_fee;
        const discountVal = pricingBreakdown.global_discount;
        const total = pricingBreakdown.total;

        const orderId = customOrderId || `order_${uuidv4().slice(0, 8)}`;
        const initialStatus = 'Order Placed';
        const rider = 'Alex';
        const method = paymentMethod || 'Cash on Delivery';
        let address = deliveryAddress.trim();
        if (!address.toUpperCase().startsWith(`[${targetHostelId}]`)) {
            address = `[${targetHostelId}] ${address.replace(/^\[(BH|GH)[-\s]?\d+\]\s*/i, '')}`;
        }

        // 3. SECURE FAST CUSTOMER PROFILE RESOLUTION & SNAPSHOT
        const submittedPhone = (req.body.customerPhone || req.body.phone || '').trim();
        const submittedName = (req.body.customerName || req.body.name || '').trim();
        const submittedEmail = (req.body.customerEmail || req.body.email || '').trim().toLowerCase();

        const customerName = (submittedName && submittedName.length > 1) ? submittedName : 'Campus Student';
        const customerPhone = submittedPhone || '';
        const customerEmail = submittedEmail || '';

        // Run non-critical user profile updates in the background without blocking the order confirmation
        (async () => {
            try {
                let user = await supabaseDb.users.getById(userId);
                if (!user && submittedEmail) user = await supabaseDb.users.getByIdentifier(submittedEmail);
                if (!user && submittedPhone && submittedPhone.length >= 10) user = await supabaseDb.users.getByIdentifier(submittedPhone);

                if (user) {
                    if (submittedName && (!user.name || user.name.toLowerCase().startsWith('user_') || user.name === 'Customer' || user.name === 'Student')) {
                        const supabase = getSupabaseClient();
                        if (supabase) await supabase.from('users').update({ name: submittedName }).eq('id', user.id);
                    }
                    if (submittedPhone && submittedPhone.length >= 10 && (!user.phone || user.phone !== submittedPhone)) {
                        await supabaseDb.users.updatePhone(user.id, submittedPhone);
                    }
                } else {
                    await supabaseDb.users.createUser({
                        id: userId,
                        name: submittedName || 'Student',
                        email: submittedEmail || `${userId}@lpu.in`,
                        phone: submittedPhone || null,
                        role: 'student'
                    });
                }
            } catch (bgUserErr) {
                console.warn('[Background User Profile Sync Note]:', bgUserErr.message);
            }
        })();

        let normalizedDeliveryAddress = address;
        if (targetHostelId && !normalizedDeliveryAddress.includes(`[${targetHostelId}]`)) {
            normalizedDeliveryAddress = `[${targetHostelId}] ${normalizedDeliveryAddress}`;
        }

        const orderPayload = {
            id: orderId,
            hostel_id: targetHostelId,
            user_id: userId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            status: initialStatus,
            subtotal,
            delivery_fee: deliveryFee,
            platform_fee: handlingFee,
            tax: 0,
            total,
            payment_method: method,
            payment_status: 'pending',
            rider_name: rider,
            delivery_address: normalizedDeliveryAddress
        };

        const createdOrder = await supabaseDb.orders.createOrder(orderPayload, orderItems);
        cache.invalidateOrders();
        cache.invalidateProducts();

        // Clear cart for ordering student in background
        supabaseDb.cart.clearCart(userId).catch(() => {});
        if (guestUserId && guestUserId !== userId) {
            supabaseDb.cart.clearCart(guestUserId).catch(() => {});
        }

        // 1. Broadcast Real-Time Stock Updates to ALL Connected Clients & Admin Dashboards
        if (Array.isArray(createdOrder.stockUpdates)) {
            for (const su of createdOrder.stockUpdates) {
                try {
                    broadcastInventoryUpdate(su.productId, su.newStock, su.newInStock, su.hostel_id);
                } catch (wsErr) {
                    console.warn('[WS Stock Broadcast Note]:', wsErr.message);
                }
            }
        }

        // 2. Broadcast to live Admin and Tracking WebSockets
        try {
            broadcastOrderPlaced({
                id: orderId,
                hostel_id: targetHostelId,
                user_id: userId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                status: initialStatus,
                total,
                item_summary: orderItems.map(i => `${i.name} (x${i.quantity})`).join(', '),
                delivery_address: normalizedDeliveryAddress,
                payment_method: method,
                created_at: new Date().toISOString()
            });
        } catch (e) {
            console.error('[WS Broadcast Warning]:', e.message);
        }

        // 3. Trigger background Web Push to all delivery runners & managers (wakes up closed devices)
        try {
            const pushService = require('../notifications/pushService');
            pushService.notifyNewOrder({
                id: orderId,
                total,
                delivery_address: address,
                customer_name: customerName
            }).catch(pErr => console.warn('[Push Service New Order Note]:', pErr.message));
        } catch (pushErr) {}

        res.json({
            success: true,
            orderId,
            order: createdOrder,
            pricing: {
                subtotal,
                global_discount: discountVal,
                discount_5_percent: discountVal,
                delivery_fee: deliveryFee,
                platform_fee: handlingFee,
                tax: 0,
                total
            },
            message: 'Order placed successfully! 3-minute delivery countdown initiated.'
        });
    } catch (err) {
        console.error('[Checkout Error]:', err.message);
        const isClientError = /out of stock|available|Cart is empty|no longer available|insufficient/i.test(err.message);
        res.status(isClientError ? 400 : 500).json({
            success: false,
            error: isClientError ? err.message : 'Unable to complete checkout at this time. Please try again.',
            code: isClientError ? 'STOCK_ERROR' : 'CHECKOUT_ERROR'
        });
    }
}

// GET /api/checkout/settings (Public - returns active offers & charges for checkout calculations)
router.get('/settings', async (req, res) => {
    try {
        const settings = await checkoutSettingsService.getSettings();
        res.json({
            success: true,
            settings
        });
    } catch (err) {
        console.error('[Checkout Settings Error]:', err.message);
        res.status(500).json({ success: false, error: 'Failed to load checkout settings.' });
    }
});

router.post('/', handlePlaceOrder);
router.post('/place', handlePlaceOrder);

module.exports = router;

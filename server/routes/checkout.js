const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabaseDb = require('../db/supabaseDb');
const { broadcastOrderPlaced } = require('../realtime');
const cache = require('../cache');

// POST /api/checkout and /api/checkout/place
async function handlePlaceOrder(req, res) {
    let userId = req.body.userId || req.body.user_id;
    const guestUserId = req.body.guestUserId || req.body.guest_id;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const deliveryAddress = req.body.deliveryAddress || req.body.delivery_address;
    const customOrderId = req.body.orderId || req.body.order_id;
    const clientItems = Array.isArray(req.body.items) && req.body.items.length > 0 ? req.body.items : null;

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

    // 1. SERVER-SIDE STORE AVAILABILITY CHECK (Client Lock Protection)
    try {
        const storeStatus = await supabaseDb.availability.getStatus();
        if (storeStatus && storeStatus.is_locked) {
            return res.status(400).json({
                success: false,
                error: 'STORE_CLOSED',
                code: 'STORE_CLOSED',
                message: 'Orders are currently unavailable. Please try again when the store reopens.',
                reopen_at: storeStatus.reopen_at,
                display_reopen: storeStatus.display_reopen,
                availability: storeStatus
            });
        }
    } catch (lockErr) {
        console.warn('[Checkout Availability Check Warning]:', lockErr.message);
    }

    // 2. SERVER-SIDE USER BLACKLIST & FRAUD CHECK
    try {
        const blacklistCheck = await supabaseDb.blacklist.isUserBlacklisted(userId);
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
    } catch (blErr) {
        console.warn('[Checkout Blacklist Check Warning]:', blErr.message);
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
        // Fetch cart items: check primary user cart, then guest cart, then fallback to submitted client items
        let cart = await supabaseDb.cart.getCart(userId);
        if ((!cart.items || cart.items.length === 0) && guestUserId) {
            cart = await supabaseDb.cart.getCart(guestUserId);
        }

        let orderItems = (cart.items && cart.items.length > 0) ? cart.items : clientItems;

        if (!orderItems || orderItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
        }

        // Validate stock limits directly from items without sequential DB roundtrips
        for (const item of orderItems) {
            const hasExplicitStock = item.stock_left !== undefined && item.stock_left !== null;
            const availableStock = hasExplicitStock ? Number(item.stock_left) : 50;
            if (item.in_stock === false || (hasExplicitStock && availableStock <= 0)) {
                return res.status(400).json({ error: `"${item.name || 'Item'}" is currently out of stock. Please remove it from your cart to proceed.` });
            }
            if (hasExplicitStock && item.quantity > availableStock) {
                return res.status(400).json({ error: `Only ${availableStock} units of "${item.name}" left in stock (you have ${item.quantity} in cart). Please adjust quantity.` });
            }
        }

        const subtotal = orderItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
        const discount5 = subtotal >= 350 ? Math.round(subtotal * 0.05) : 0;
        const total = Math.max(0, subtotal - discount5);

        const orderId = customOrderId || `order_${uuidv4().slice(0, 8)}`;
        const initialStatus = 'Order Placed';
        const rider = 'Alex';
        const method = paymentMethod || 'Cash on Delivery';
        const address = deliveryAddress.trim();

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

        const orderPayload = {
            id: orderId,
            user_id: userId,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            status: initialStatus,
            subtotal,
            delivery_fee: 0,
            platform_fee: 0,
            tax: 0,
            total,
            payment_method: method,
            payment_status: 'pending',
            rider_name: rider,
            delivery_address: address
        };

        const createdOrder = await supabaseDb.orders.createOrder(orderPayload, orderItems);
        cache.invalidateOrders();

        // Broadcast to live Admin and Tracking WebSockets
        try {
            broadcastOrderPlaced({
                id: orderId,
                user_id: userId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                status: initialStatus,
                total,
                item_summary: orderItems.map(i => `${i.name} (x${i.quantity})`).join(', '),
                delivery_address: address,
                payment_method: method,
                created_at: new Date().toISOString()
            });
        } catch (e) {
            console.error('[WS Broadcast Warning]:', e.message);
        }

        res.json({
            success: true,
            orderId,
            order: createdOrder,
            pricing: {
                subtotal,
                discount_5_percent: discount5,
                delivery_fee: 0,
                platform_fee: 0,
                tax: 0,
                total
            },
            message: 'Order placed successfully! 3-minute delivery countdown initiated.'
        });
    } catch (err) {
        console.error('[Checkout Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
}

router.post('/', handlePlaceOrder);
router.post('/place', handlePlaceOrder);

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabaseDb = require('../db/supabaseDb');
const { broadcastOrderPlaced } = require('../realtime');
const cache = require('../cache');

// POST /api/checkout and /api/checkout/place
async function handlePlaceOrder(req, res) {
    const userId = req.body.userId || req.body.user_id;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const deliveryAddress = req.body.deliveryAddress || req.body.delivery_address;
    const customOrderId = req.body.orderId || req.body.order_id;

    // Strict Auth Check: User MUST be signed in
    if (!userId || userId === 'null' || userId === 'undefined' || userId.startsWith('guest_') || userId === 'anonymous') {
        return res.status(401).json({ error: 'Authentication required. Please sign in with Google or Student Email to place your order.' });
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
        // Fetch cart items directly from Supabase
        const cart = await supabaseDb.cart.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
        }

        // Validate stock limits for every cart item before order placement
        for (const item of cart.items) {
            const prod = await supabaseDb.products.getById(item.product_id);
            if (prod) {
                const availableStock = prod.stock_left !== undefined && prod.stock_left !== null ? Number(prod.stock_left) : (prod.in_stock ? 50 : 0);
                if (!prod.in_stock || availableStock <= 0) {
                    return res.status(400).json({ error: `"${item.name}" is currently out of stock. Please remove it from your cart to proceed.` });
                }
                if (item.quantity > availableStock) {
                    return res.status(400).json({ error: `Only ${availableStock} units of "${item.name}" left in stock (you have ${item.quantity} in cart). Please adjust quantity.` });
                }
            }
        }

        const subtotal = cart.pricing.subtotal;
        const discount5 = subtotal >= 350 ? Math.round(subtotal * 0.05) : 0;
        const total = Math.max(0, subtotal - discount5);

        const orderId = customOrderId || `order_${uuidv4().slice(0, 8)}`;
        const initialStatus = 'Order Placed';
        const rider = 'Alex';
        const method = paymentMethod || 'Cash on Delivery';
        const address = deliveryAddress.trim();

        // 3. SECURE AUTHENTICATED CUSTOMER PROFILE RESOLUTION & SNAPSHOT
        const submittedPhone = (req.body.customerPhone || req.body.phone || '').trim();
        const submittedName = (req.body.customerName || req.body.name || '').trim();
        const submittedEmail = (req.body.customerEmail || req.body.email || '').trim().toLowerCase();

        let user = null;
        try {
            user = await supabaseDb.users.getById(userId);
            if (!user && submittedEmail) {
                user = await supabaseDb.users.getByIdentifier(submittedEmail);
            }
            if (!user && submittedPhone && submittedPhone.length >= 10) {
                user = await supabaseDb.users.getByIdentifier(submittedPhone);
            }
        } catch (uErr) {
            console.warn('[Checkout User Lookup Warning]:', uErr.message);
        }

        // Update customer name in database if user has placeholder or generic name
        if (user && submittedName && submittedName.length > 1) {
            const currentName = user.name || '';
            const isGenericName = !currentName || 
                                  currentName.toLowerCase().startsWith('user_') || 
                                  currentName === 'Customer' || 
                                  currentName === 'Student' || 
                                  currentName === 'LPU Student' ||
                                  currentName === 'Campus Resident';
            if (isGenericName) {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        await supabase.from('users').update({ name: submittedName }).eq('id', user.id);
                        user.name = submittedName;
                    }
                } catch (nErr) {}
            }
        }

        // Update customer phone in database if not previously set
        if (user && submittedPhone && submittedPhone.length >= 10 && (!user.phone || user.phone !== submittedPhone)) {
            try {
                await supabaseDb.users.updatePhone(user.id, submittedPhone);
                user.phone = submittedPhone;
            } catch (pErr) {}
        }

        // If user record does not yet exist in users table, persist now
        if (!user) {
            const userEmail = submittedEmail || `${userId}@lpu.in`;
            const rawName = submittedName || (submittedEmail ? submittedEmail.split('@')[0].replace(/[._]/g, ' ') : userId);
            const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            try {
                user = await supabaseDb.users.createUser({
                    id: userId,
                    name: cleanName,
                    email: userEmail,
                    phone: submittedPhone || null,
                    role: 'student'
                });
            } catch (createErr) {
                // If phone duplicate key error, fetch the user who owns this phone
                if (submittedPhone && submittedPhone.length >= 10) {
                    try {
                        user = await supabaseDb.users.getByIdentifier(submittedPhone);
                    } catch (e) {}
                }
                if (!user) {
                    user = {
                        id: userId,
                        name: cleanName,
                        email: userEmail,
                        phone: submittedPhone || ''
                    };
                }
            }
        }

        const customerName = (submittedName && submittedName.length > 1) 
            ? submittedName 
            : ((user && user.name && !user.name.toLowerCase().startsWith('user_')) ? user.name : (user?.name || 'Customer'));
        const customerPhone = (user && user.phone) ? user.phone : submittedPhone;
        const customerEmail = (user && user.email && !user.email.endsWith('@lpu.in')) ? user.email : (submittedEmail || user?.email || '');

        const orderPayload = {
            id: orderId,
            user_id: user ? user.id : userId,
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

        const createdOrder = await supabaseDb.orders.createOrder(orderPayload, cart.items);
        cache.invalidateOrders();

        // Broadcast to live Admin and Tracking WebSockets
        try {
            broadcastOrderPlaced({
                id: orderId,
                user_id: user ? user.id : userId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail,
                status: initialStatus,
                total,
                item_summary: cart.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
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

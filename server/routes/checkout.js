const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabaseDb = require('../db/supabaseDb');
const { broadcastOrderPlaced } = require('../realtime');

// POST /api/checkout and /api/checkout/place
async function handlePlaceOrder(req, res) {
    const userId = req.body.userId || req.body.user_id;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method;
    const deliveryAddress = req.body.deliveryAddress || req.body.delivery_address;
    const customOrderId = req.body.orderId || req.body.order_id;

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        // Fetch cart items directly from Supabase
        const cart = await supabaseDb.cart.getCart(userId);
        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
        }

        const subtotal = cart.pricing.subtotal;
        const discount5 = subtotal >= 350 ? Math.round(subtotal * 0.05) : 0;
        const total = Math.max(0, subtotal - discount5);

        const orderId = customOrderId || `order_${uuidv4().slice(0, 8)}`;
        const initialStatus = 'Order Placed';
        const rider = 'Alex';
        const method = paymentMethod || 'Cash on Delivery';
        const address = deliveryAddress || 'BH13 (Block A), Room 304';

        const orderPayload = {
            id: orderId,
            user_id: userId,
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

        // Broadcast to live Admin and Tracking WebSockets
        try {
            broadcastOrderPlaced({
                id: orderId,
                user_id: userId,
                customer_name: 'Campus Resident',
                customer_phone: '7671836211',
                customer_email: 'student@lpu.in',
                status: initialStatus,
                total,
                items_summary: cart.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
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

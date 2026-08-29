const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// POST /api/checkout
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { userId, paymentMethod } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Fetch cart items with product details (single JOIN, no N+1)
    const cartItems = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, ci.product_id,
               p.name, p.price, p.in_stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).all(userId);

    if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate stock
    const outOfStock = cartItems.filter(i => !i.in_stock);
    if (outOfStock.length > 0) {
        return res.status(409).json({
            error: 'Some items are out of stock',
            out_of_stock: outOfStock.map(i => ({ id: i.product_id, name: i.name }))
        });
    }

    // Calculate pricing: 0 GST, FREE delivery (-₹25 offer), FREE handling (-₹5 offer)
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery_fee = 0;
    const platform_fee = 0;
    const tax = 0;
    const total = subtotal;

    // Create order — direct synchronous path, no cross-selling microservice dependency
    const orderId = `order_${uuidv4().slice(0, 8)}`;
    const riderNames = ['Alex', 'Priya', 'Rahul', 'Meera', 'Karan'];
    const rider = riderNames[Math.floor(Math.random() * riderNames.length)];

    db.prepare(`
        INSERT INTO orders (id, user_id, status, subtotal, delivery_fee, platform_fee, tax, total, payment_method, payment_status, rider_name, rider_lat, rider_lng)
        VALUES (?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, 'pending', ?, 31.2560, 75.7030)
    `).run(orderId, userId, subtotal, delivery_fee, platform_fee, tax, total, paymentMethod || 'upi', rider);

    // Insert order items
    const insertItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)');
    for (const item of cartItems) {
        insertItem.run(`oi_${uuidv4().slice(0, 8)}`, orderId, item.product_id, item.quantity, item.price);
    }

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    // Generate UPI intent URL
    const upiUrl = `upi://pay?pa=lpuquick@upi&pn=LPUQuick&am=${total}&cu=INR&tn=Order ${orderId}`;

    res.json({
        success: true,
        order: {
            id: orderId,
            status: 'confirmed',
            total,
            rider_name: rider,
            eta_minutes: 7 + Math.floor(Math.random() * 8),
            upi_intent_url: upiUrl
        }
    });
});

// POST /api/checkout/payment-callback (webhook)
router.post('/payment-callback', (req, res) => {
    const db = req.app.locals.db;
    const { orderId, status, transactionId } = req.body;

    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    if (status === 'success') {
        db.prepare("UPDATE orders SET payment_status = 'paid', status = 'accepted' WHERE id = ?").run(orderId);
        res.json({ success: true, order_status: 'accepted' });
    } else {
        db.prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?").run(orderId);
        // Return error code that triggers frontend 200ms shake + alternative methods
        res.json({
            success: false,
            error_code: 'PAYMENT_FAILED',
            message: 'Payment could not be processed',
            alternative_methods: [
                { id: 'card', label: 'Credit/Debit Card', icon: 'credit_card' },
                { id: 'netbanking', label: 'Net Banking', icon: 'account_balance' },
                { id: 'cod', label: 'Cash on Delivery', icon: 'payments' }
            ]
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// POST /api/checkout
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { userId, paymentMethod, deliveryAddress } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Fetch cart items with product details and current stock
    const cartItems = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, ci.product_id,
               p.name, p.price, p.image_url, p.in_stock, p.stock_left
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).all(userId);

    if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty. Please add items to order.' });
    }

    // Validate stock and prevent overselling
    const outOfStock = cartItems.filter(i => !i.in_stock || (i.stock_left !== null && i.stock_left < i.quantity));
    if (outOfStock.length > 0) {
        return res.status(409).json({
            error: 'Some items are out of stock or exceed campus inventory',
            out_of_stock: outOfStock.map(i => ({ id: i.product_id, name: i.name, available: i.stock_left || 0 }))
        });
    }

    // Calculate pricing: 0 GST, FREE delivery (-₹25 offer), FREE handling (-₹5 offer)
    const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery_fee = 0;
    const platform_fee = 0;
    const tax = 0;
    const total = subtotal;

    // Create unique order ID and assign campus rider
    const orderId = `order_${uuidv4().slice(0, 8)}`;
    const riderNames = ['Alex', 'Priya', 'Rahul', 'Meera', 'Karan'];
    const rider = riderNames[Math.floor(Math.random() * riderNames.length)];
    const address = deliveryAddress || 'BH13 (Block A), Room 304';
    const method = paymentMethod === 'cod' ? 'Cash on Delivery' : (paymentMethod || 'Cash on Delivery');
    const initialStatus = 'Order Placed';
    const initialHistory = JSON.stringify([{
        status: initialStatus,
        timestamp: new Date().toISOString(),
        updated_by: 'Student (Checkout)'
    }]);

    // Insert order into SQLite DB
    db.prepare(`
        INSERT INTO orders (id, user_id, status, subtotal, delivery_fee, platform_fee, tax, total, payment_method, payment_status, rider_name, rider_lat, rider_lng, delivery_address, status_history, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 31.2560, 75.7030, ?, ?, datetime('now'))
    `).run(orderId, userId, initialStatus, subtotal, delivery_fee, platform_fee, tax, total, method, rider, address, initialHistory);

    // Insert order items and atomically decrement stock
    const insertItem = db.prepare('INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock_left = MAX(0, stock_left - ?), in_stock = CASE WHEN stock_left - ? > 0 THEN 1 ELSE 0 END WHERE id = ?');
    
    for (const item of cartItems) {
        insertItem.run(`oi_${uuidv4().slice(0, 8)}`, orderId, item.product_id, item.quantity, item.price);
        updateStock.run(item.quantity, item.quantity, item.product_id);
    }

    // Clear cart in DB
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

    // Sync to Supabase Cloud if configured
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
            supabase.from('orders').insert({
                id: orderId,
                user_id: userId,
                status: initialStatus,
                subtotal,
                delivery_fee,
                platform_fee,
                tax,
                total,
                payment_method: method,
                payment_status: 'pending',
                rider_name: rider,
                delivery_address: address
            }).then(() => {
                console.log(`[Supabase] Synced order ${orderId} to Cloud.`);
            }).catch(e => console.error('[Supabase Order Sync Error]:', e.message));
        }
    } catch (e) {
        // Non-blocking
    }

    // Fetch created order and customer details
    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const customer = db.prepare('SELECT name, phone, email FROM users WHERE id = ?').get(userId);

    const fullOrderPayload = {
        id: createdOrder.id,
        user_id: createdOrder.user_id,
        customer_name: customer ? customer.name : 'Nivas',
        customer_phone: customer ? customer.phone : '7671836211',
        customer_email: customer ? customer.email : 'nivas@lpu.in',
        status: createdOrder.status,
        total: createdOrder.total,
        subtotal: createdOrder.subtotal,
        delivery_fee: createdOrder.delivery_fee,
        platform_fee: createdOrder.platform_fee,
        tax: createdOrder.tax,
        payment_method: createdOrder.payment_method,
        payment_status: createdOrder.payment_status,
        rider_name: createdOrder.rider_name,
        delivery_address: createdOrder.delivery_address,
        created_at: createdOrder.created_at,
        item_summary: cartItems.map(i => `${i.name} (x${i.quantity})`).join(', '),
        item_count: cartItems.length,
        items: cartItems.map(item => ({
            id: item.product_id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url
        }))
    };

    // Broadcast instant real-time alert to all Admin Dashboards!
    try {
        const { notifyAdminNewOrder } = require('../realtime');
        notifyAdminNewOrder(fullOrderPayload);
    } catch (err) {
        console.error('[Realtime Broadcast Error]:', err.message);
    }

    res.json({
        success: true,
        order: {
            ...fullOrderPayload,
            estimated_minutes: 3
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

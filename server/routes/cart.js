const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Pricing calculator - Zero GST, 100% Free Delivery Offer (-₹25), 100% Free Handling Offer (-₹5)
// Total to Pay is EXACTLY the Item Subtotal with zero extra charges!
function calculatePricing(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const original_delivery_fee = subtotal > 0 ? 25 : 0;
    const delivery_discount = subtotal > 0 ? 25 : 0;
    const delivery_fee = 0; // Net Delivery Fee = ₹0 (FREE)

    const original_platform_fee = subtotal > 0 ? 5 : 0;
    const platform_discount = subtotal > 0 ? 5 : 0; // 100% Handling fee waiver offer
    const platform_fee = 0; // Net Handling Fee = ₹0 (FREE)

    const tax = 0; // 0% GST (no taxes)
    const total = subtotal; // Exact Item Subtotal!
    const total_savings = delivery_discount + platform_discount; // Total saved: ₹30

    return { 
        subtotal, 
        original_delivery_fee, 
        delivery_discount, 
        delivery_fee, 
        original_platform_fee, 
        platform_discount, 
        platform_fee, 
        tax, 
        total, 
        total_savings, 
        free_delivery_remaining: 0 
    };
}

function fetchUserCart(db, userId) {
    const items = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, 
               p.id as product_id, p.name, p.price, p.mrp, p.unit, p.size, 
               p.image_url, p.image_alt, p.category, p.in_stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
        ORDER BY ci.created_at DESC
    `).all(userId);

    const pricing = calculatePricing(items);

    return {
        items: items.map(i => ({
            cart_id: i.cart_id,
            product_id: i.product_id,
            name: i.name,
            price: i.price,
            mrp: i.mrp,
            unit: i.unit,
            size: i.size,
            image_url: i.image_url,
            image_alt: i.image_alt,
            category: i.category,
            quantity: i.quantity,
            in_stock: i.in_stock
        })),
        pricing,
        item_count: items.reduce((sum, i) => sum + i.quantity, 0)
    };
}

// GET /api/cart?userId=... or GET /api/cart?user_id=...
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const userId = req.query.userId || req.query.user_id || req.query.id;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    res.json(fetchUserCart(db, userId));
});

// GET /api/cart/:userId
router.get('/:userId', (req, res) => {
    const db = req.app.locals.db;
    const { userId } = req.params;
    res.json(fetchUserCart(db, userId));
});

// POST /api/cart
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const userId = req.body.userId || req.body.user_id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    const qty = quantity !== undefined ? Number(quantity) : 1;

    // Check if already in cart
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);

    if (existing) {
        db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(qty, existing.id);
    } else {
        const id = `cart_${uuidv4().slice(0, 8)}`;
        db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)').run(id, userId, productId, qty);
    }

    // Return updated cart with pricing
    const items = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, p.price
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).all(userId);

    const pricing = calculatePricing(items);

    res.json({ success: true, pricing, item_count: items.reduce((s, i) => s + i.quantity, 0) });
});

// PUT /api/cart/:cartId
router.put('/:cartId', (req, res) => {
    const db = req.app.locals.db;
    const { cartId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
        db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartId);
    } else {
        db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, cartId);
    }

    // Get userId from cart item for pricing update
    const item = db.prepare('SELECT user_id FROM cart_items WHERE id = ?').get(cartId);
    if (!item) {
        return res.json({ success: true, pricing: calculatePricing([]), item_count: 0 });
    }

    const items = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, p.price
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).all(item.user_id);

    const pricing = calculatePricing(items);
    res.json({ success: true, pricing, item_count: items.reduce((s, i) => s + i.quantity, 0) });
});

// DELETE /api/cart/:cartId
router.delete('/:cartId', (req, res) => {
    const db = req.app.locals.db;
    const { cartId } = req.params;
    
    // Get userId first
    const item = db.prepare('SELECT user_id FROM cart_items WHERE id = ?').get(cartId);
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartId);

    if (!item) {
        return res.json({ success: true, pricing: calculatePricing([]), item_count: 0 });
    }

    const items = db.prepare(`
        SELECT ci.id as cart_id, ci.quantity, p.price
        FROM cart_items ci JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).all(item.user_id);

    const pricing = calculatePricing(items);
    res.json({ success: true, pricing, item_count: items.reduce((s, i) => s + i.quantity, 0) });
});

module.exports = router;

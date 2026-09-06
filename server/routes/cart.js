const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

// Pricing Calculation Engine (Zero GST, Free Delivery Offer, 5% Bulk Discount >= ₹350, ₹3 Handling Fee, Min Order ₹35)
function calculatePricing(items = []) {
    const list = Array.isArray(items) ? items : [];
    const totalQuantity = list.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const totalMrp = list.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const subtotal = list.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);
    const hasDiscount = subtotal >= 350;
    const discount5 = hasDiscount ? Math.round(subtotal * 0.05) : 0;
    const delivery_fee = 0; // Free Campus Delivery
    const platform_fee = list.length > 0 ? 3 : 0; // ₹3 Handling Fee for every order
    const tax = 0; // Zero hidden taxes
    const total = Math.max(0, subtotal - discount5 + platform_fee + delivery_fee + tax);
    const deliverySavings = subtotal > 0 ? 25 : 0; // ₹25 free campus delivery offer
    const total_savings = mrpDiscount + discount5 + deliverySavings;
    const min_order_value = 35;
    const is_min_order_met = subtotal >= min_order_value;
    const min_order_shortfall = Math.max(0, min_order_value - subtotal);

    return {
        subtotal,
        total_mrp: totalMrp,
        mrp_discount: mrpDiscount,
        discount5,
        bulk_discount: discount5,
        delivery_fee,
        platform_fee,
        tax,
        total,
        total_savings,
        min_order_value,
        is_min_order_met,
        min_order_shortfall,
        item_count: totalQuantity,
        total_items: totalQuantity,
        deliveryFee: delivery_fee,
        platformFee: platform_fee
    };
}

function formatCartResponse(cart) {
    if (!cart) {
        return { items: [], item_count: 0, total_items: 0, pricing: calculatePricing([]) };
    }
    const items = Array.isArray(cart.items) ? cart.items : [];
    const pricing = calculatePricing(items);
    return {
        ...cart,
        items,
        item_count: pricing.item_count,
        total_items: pricing.total_items,
        pricing
    };
}

// GET /api/cart?userId=... or GET /api/cart?user_id=...
router.get('/', async (req, res) => {
    const userId = req.query.userId || req.query.user_id || req.query.id;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const cart = await supabaseDb.cart.getCart(userId);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cart/:userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const cart = await supabaseDb.cart.getCart(userId);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart/set-quantity (Authoritative atomic quantity setter - no duplication)
router.post('/set-quantity', async (req, res) => {
    const userId = req.body.userId || req.body.user_id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 0;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    try {
        const cart = await supabaseDb.cart.setQuantity(userId, productId, quantity);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/cart and POST /api/cart/add (Add item to cart)
async function handleAddToCart(req, res) {
    const userId = req.body.userId || req.body.user_id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    try {
        const cart = await supabaseDb.cart.addItem(userId, productId, quantity);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

router.post('/', handleAddToCart);
router.post('/add', handleAddToCart);

// PUT /api/cart/:id (Update quantity)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity, userId } = req.body;

    if (quantity === undefined) {
        return res.status(400).json({ error: 'quantity is required' });
    }

    try {
        const cart = await supabaseDb.cart.updateItem(id, Number(quantity), userId || 'guest_cart');
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/cart/:id (Remove single item by cartId or productId)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.body?.userId || req.query?.userId || 'guest_cart';

    try {
        if (id && id.startsWith('prod_')) {
            const cart = await supabaseDb.cart.setQuantity(userId, id, 0);
            return res.json(formatCartResponse(cart));
        }
        const cart = await supabaseDb.cart.updateItem(id, 0, userId);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/user/:userId (Clear entire cart)
router.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await supabaseDb.cart.clearCart(userId);
        res.json({ message: 'Cart cleared successfully', ...formatCartResponse({ items: [] }) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart/merge (Migrate guest cart items to logged in user)
router.post('/merge', async (req, res) => {
    const { guestUserId, targetUserId } = req.body;
    if (!guestUserId || !targetUserId) {
        return res.status(400).json({ error: 'guestUserId and targetUserId are required' });
    }
    try {
        const cart = await supabaseDb.cart.mergeCart(guestUserId, targetUserId);
        res.json(formatCartResponse(cart));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
module.exports.calculatePricing = calculatePricing;
module.exports.formatCartResponse = formatCartResponse;

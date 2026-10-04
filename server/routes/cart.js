const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const checkoutSettingsService = require('../services/checkoutSettingsService');

// Pricing Calculation Engine (Powered by checkoutSettingsService with fallback)
function calculatePricing(items = [], settings = null) {
    return checkoutSettingsService.calculateCharges(items, settings);
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

async function checkHostelConflict(userId, productId) {
    try {
        const [cart, product] = await Promise.all([
            supabaseDb.cart.getCart(userId),
            supabaseDb.products.getById(productId)
        ]);

        if (cart && Array.isArray(cart.items) && cart.items.length > 0 && product) {
            const productHostel = product.hostel_id || 'BH-13';
            const otherItems = cart.items.filter(it => (it.product_id || it.id) !== productId);
            if (otherItems.length > 0) {
                const existingHostel = otherItems[0]?.hostel_id || 'BH-13';
                if (existingHostel.toLowerCase().replace('-', '') !== productHostel.toLowerCase().replace('-', '')) {
                    return {
                        hasConflict: true,
                        cartHostel: existingHostel,
                        productHostel
                    };
                }
            }
        }
    } catch (e) {}
    return { hasConflict: false };
}

// POST /api/cart/check-conflict (Pre-flight conflict checker)
router.post('/check-conflict', async (req, res) => {
    const { userId, productId, incoming_hostel_id, existing_items } = req.body;
    if (userId && productId) {
        const conflict = await checkHostelConflict(userId, productId);
        return res.json({ conflict: conflict.hasConflict, ...conflict });
    }
    if (incoming_hostel_id && Array.isArray(existing_items) && existing_items.length > 0) {
        const existingHostel = existing_items[0]?.hostel_id || 'BH-13';
        const hasConflict = existingHostel.toLowerCase().replace('-', '') !== incoming_hostel_id.toLowerCase().replace('-', '');
        return res.json({ conflict: hasConflict, cartHostel: existingHostel, productHostel: incoming_hostel_id });
    }
    return res.json({ conflict: false });
});

// POST /api/cart/set-quantity (Authoritative atomic quantity setter - no duplication)
router.post('/set-quantity', async (req, res) => {
    const userId = req.body.userId || req.body.user_id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 0;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    if (quantity > 0) {
        const conflict = await checkHostelConflict(userId, productId);
        if (conflict.hasConflict) {
            return res.status(400).json({
                error: `Your cart contains items from ${conflict.cartHostel}. Clear your cart to add items from ${conflict.productHostel}.`,
                code: 'MIXED_HOSTELS',
                cart_hostel: conflict.cartHostel,
                product_hostel: conflict.productHostel
            });
        }
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

    const conflict = await checkHostelConflict(userId, productId);
    if (conflict.hasConflict) {
        return res.status(400).json({
            error: `Your cart contains items from ${conflict.cartHostel}. Clear your cart to add items from ${conflict.productHostel}.`,
            code: 'MIXED_HOSTELS',
            cart_hostel: conflict.cartHostel,
            product_hostel: conflict.productHostel
        });
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

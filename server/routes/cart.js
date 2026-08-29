const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

// GET /api/cart?userId=... or GET /api/cart?user_id=...
router.get('/', async (req, res) => {
    const userId = req.query.userId || req.query.user_id || req.query.id;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }
    try {
        const cart = await supabaseDb.cart.getCart(userId);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cart/:userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const cart = await supabaseDb.cart.getCart(userId);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cart (Add item to cart)
router.post('/', async (req, res) => {
    const userId = req.body.userId || req.body.user_id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity !== undefined ? Number(req.body.quantity) : 1;

    if (!userId || !productId) {
        return res.status(400).json({ error: 'userId and productId are required' });
    }

    try {
        const cart = await supabaseDb.cart.addItem(userId, productId, quantity);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/cart/:id (Update quantity)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity, userId } = req.body;

    if (quantity === undefined) {
        return res.status(400).json({ error: 'quantity is required' });
    }

    try {
        const cart = await supabaseDb.cart.updateItem(id, Number(quantity), userId || 'user_001');
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/:id (Remove single item)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.body?.userId || req.query?.userId || 'user_001';

    try {
        const cart = await supabaseDb.cart.updateItem(id, 0, userId);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/cart/user/:userId (Clear entire cart)
router.delete('/user/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        await supabaseDb.cart.clearCart(userId);
        res.json({ message: 'Cart cleared successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

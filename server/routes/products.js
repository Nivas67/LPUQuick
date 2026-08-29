const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/adminAuth');
const supabaseDb = require('../db/supabaseDb');

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await supabaseDb.products.getById(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const details = {
            ...product,
            discount_percent: product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0,
            description: product.description || `Fresh campus ${product.name} available at LPU Quick.`,
            shelf_life: '6 Months',
            highlights: [
                '100% Genuine & Sealed Packaging',
                'Direct Campus Delivery in 3 Minutes',
                'Available in Tamper-Proof Discreet Bags',
                'Easy Returns & Instant Replacement'
            ],
            storage: 'Store in a cool, dry place away from direct sunlight.',
            delivery_eta: '3 mins to BH13 (LPU Hostels)'
        };

        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products (Fetch all products from Supabase)
router.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const category = req.query.category;
        const subcategory = req.query.subcategory;
        const sort = req.query.sort;

        const products = await supabaseDb.products.getAll({ includeInactive, category, subcategory, sort });
        res.json({ products });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/admin/create (Add new product to Supabase)
router.post('/admin/create', requireAdmin, async (req, res) => {
    const { name, category, subcategory, price, mrp, unit, size, image_url, description, tags, bestseller, is_new, stock_left } = req.body;

    if (!name || !category || price === undefined) {
        return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    try {
        const created = await supabaseDb.products.create({
            name,
            category,
            subcategory,
            price: Number(price),
            mrp: mrp ? Number(mrp) : Number(price),
            stock_left: stock_left !== undefined ? Number(stock_left) : 50,
            unit,
            size,
            image_url,
            description,
            tags,
            bestseller,
            is_new,
            in_stock: stock_left !== undefined ? Number(stock_left) > 0 : true
        });

        res.json({ success: true, message: 'Product created in Supabase Cloud', product: created });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/admin/update/:id (Edit existing product in Supabase)
router.put('/admin/update/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await supabaseDb.products.update(id, req.body);
        res.json({ success: true, message: 'Product updated in Supabase Cloud', product: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/admin/deactivate/:id (Deactivate product in Supabase)
router.delete('/admin/deactivate/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const updated = await supabaseDb.products.update(id, { in_stock: false, stock_left: 0 });
        res.json({ success: true, message: `Product deactivated successfully`, product: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/admin/delete/:id (Hard delete from Supabase)
router.delete('/admin/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await supabaseDb.products.delete(id);
        res.json({ success: true, message: 'Product deleted from Supabase Cloud' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/admin/toggle-stock (Toggle stock in Supabase)
router.post('/admin/toggle-stock', requireAdmin, async (req, res) => {
    const { productId, inStock } = req.body;
    if (!productId || inStock === undefined) {
        return res.status(400).json({ error: 'productId and inStock are required' });
    }

    try {
        const updated = await supabaseDb.products.update(productId, { in_stock: Boolean(inStock) });
        res.json({ success: true, message: 'Stock updated in Supabase Cloud', in_stock: updated.in_stock });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/admin/adjust-stock (Adjust exact stock quantity in Supabase)
router.post('/admin/adjust-stock', requireAdmin, async (req, res) => {
    const { productId, delta, stock } = req.body;
    if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
    }

    try {
        const product = await supabaseDb.products.getById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let newStock = product.stock_left || 0;
        if (stock !== undefined) {
            newStock = Math.max(0, Number(stock));
        } else if (delta !== undefined) {
            newStock = Math.max(0, newStock + Number(delta));
        }

        const updated = await supabaseDb.products.update(productId, {
            stock_left: newStock,
            in_stock: newStock > 0
        });

        res.json({
            success: true,
            productId,
            stock_left: updated.stock_left,
            in_stock: updated.in_stock,
            status: updated.in_stock ? 'In Stock' : 'Out of Stock'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

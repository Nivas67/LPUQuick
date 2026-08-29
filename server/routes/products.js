const express = require('express');
const router = express.Router();

// GET /api/products/:id
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    // Enrich with product descriptions, nutritional facts, and campus stock information
    const details = {
        ...product,
        discount_percent: product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0,
        description: getProductDescription(product),
        shelf_life: getShelfLife(product),
        highlights: getHighlights(product),
        storage: 'Store in a cool, dry place away from direct sunlight.',
        delivery_eta: '3 mins to BH13 (LPU Hostels)'
    };

    res.json(details);
});

function getProductDescription(p) {
    if (p.category === 'Grocery') {
        return `Fresh, high-grade ${p.name.toLowerCase()} sourced daily for campus residents. Perfect for breakfast or quick hostel cooking.`;
    } else if (p.category === 'Snacks & Beverages') {
        return `Satisfying ${p.name.toLowerCase()} for late-night study sessions, gaming, or hostel get-togethers. Quick, tasty and convenient.`;
    } else if (p.category === 'Pharmacy') {
        return `Standard ${p.name.toLowerCase()} for immediate relief and first aid care on campus. Keep handy in your hostel room.`;
    } else if (p.category === 'Personal Care') {
        return `Essential ${p.name.toLowerCase()} designed for daily hygiene and skincare routines. Discreet tamper-proof packaging available.`;
    } else if (p.category === 'Stationery') {
        return `High-durability ${p.name.toLowerCase()} for classroom lectures, assignments, and exam preparation.`;
    } else {
        return `Genuine certified ${p.name.toLowerCase()} with fast campus delivery and warranty support.`;
    }
}

function getShelfLife(p) {
    if (p.category === 'Grocery' && p.subcategory === 'Dairy') return '2 Days (Refrigerate)';
    if (p.category === 'Grocery' && p.subcategory === 'Bakery') return '4 Days';
    if (p.category === 'Snacks & Beverages') return '6 Months';
    if (p.category === 'Pharmacy') return '24 Months';
    return '12 Months';
}

function getHighlights(p) {
    return [
        '100% Genuine & Sealed Packaging',
        'Direct Campus Delivery in 3 Minutes',
        'Available in Tamper-Proof Discreet Bags',
        'Easy Returns & Instant Replacement'
    ];
}

// GET /api/products (Fetch all products)
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
    res.json({ products });
});

// POST /api/products/admin/toggle-stock
router.post('/admin/toggle-stock', async (req, res) => {
    const db = req.app.locals.db;
    const { productId, inStock } = req.body;

    if (!productId || inStock === undefined) {
        return res.status(400).json({ error: 'productId and inStock are required' });
    }

    const numericStock = inStock ? 1 : 0;
    db.prepare('UPDATE products SET in_stock = ? WHERE id = ?').run(numericStock, productId);

    // Sync with Supabase Cloud
    try {
        const { getSupabaseClient } = require('../supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('products').update({ in_stock: Boolean(inStock) }).eq('id', productId);
        }
    } catch (e) {
        console.error('[Supabase Stock Sync Error]:', e.message);
    }

    res.json({ success: true, message: `Product ${productId} stock updated to ${inStock}` });
});

module.exports = router;

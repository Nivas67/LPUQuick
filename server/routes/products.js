const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/adminAuth');
const {
    syncProductCreate,
    syncProductUpdate,
    syncProductDelete,
    syncProductStock
} = require('../sync');

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
        description: product.description || getProductDescription(product),
        shelf_life: product.shelf_life || getShelfLife(product),
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
    const includeInactive = req.query.includeInactive === 'true';
    
    let query = 'SELECT * FROM products';
    if (!includeInactive) {
        query += ' WHERE is_active = 1 OR is_active IS NULL';
    }
    query += ' ORDER BY category, name';
    
    const products = db.prepare(query).all();
    res.json({ products });
});

// POST /api/products/admin/create (Add new product -> Dual Sync)
router.post('/admin/create', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { name, category, subcategory, price, mrp, unit, size, image_url, description, stock_left } = req.body;

    if (!name || !category || price === undefined) {
        return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    const id = `prod_cust_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const parsedPrice = Number(price);
    const parsedMrp = mrp ? Number(mrp) : parsedPrice;
    const parsedStock = stock_left !== undefined ? Math.max(0, parseInt(stock_left, 10)) : 40;
    const inStock = parsedStock > 0 ? 1 : 0;
    const finalUnit = unit || 'piece';
    const finalSize = size || 'Standard';
    const finalImage = image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300';
    const finalDesc = description || `Fresh campus ${name} available at LPU Quick.`;

    const productPayload = {
        id,
        name,
        category,
        subcategory: subcategory || '',
        price: parsedPrice,
        mrp: parsedMrp,
        unit: finalUnit,
        size: finalSize,
        image_url: finalImage,
        description: finalDesc,
        stock_left: parsedStock,
        in_stock: inStock
    };

    await syncProductCreate(db, productPayload);

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, message: 'Product created and synced to both databases', product: created });
});

// PUT /api/products/admin/update/:id (Edit existing product -> Dual Sync)
router.put('/admin/update/:id', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await syncProductUpdate(db, id, req.body);
    res.json({ success: true, message: 'Product updated and synced to both databases', product: updated });
});

// DELETE /api/products/admin/deactivate/:id (Soft deactivation -> Dual Sync)
router.delete('/admin/deactivate/:id', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
    }

    await syncProductDelete(db, id, false);
    res.json({ success: true, message: `Product ${existing.name} deactivated in both databases` });
});

// DELETE /api/products/admin/delete/:id (Hard delete -> Dual Sync)
router.delete('/admin/delete/:id', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ error: 'Product not found' });
    }

    await syncProductDelete(db, id, true);
    res.json({ success: true, message: `Product ${existing.name} deleted from both databases` });
});

// POST /api/products/admin/adjust-stock (Stock Stepper & Quantity Adjustment -> Dual Sync)
router.post('/admin/adjust-stock', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { productId, delta, setStock } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'productId is required' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    let newStock = product.stock_left || 0;
    if (setStock !== undefined) {
        newStock = Math.max(0, parseInt(setStock, 10));
    } else if (delta !== undefined) {
        newStock = Math.max(0, newStock + parseInt(delta, 10));
    }

    const inStock = newStock > 0 ? 1 : 0;
    await syncProductStock(db, productId, newStock, inStock);

    res.json({
        success: true,
        productId,
        stock_left: newStock,
        in_stock: inStock,
        status: newStock > 10 ? 'In Stock' : (newStock > 0 ? 'Low Stock' : 'Out of Stock')
    });
});

// POST /api/products/admin/toggle-stock (Stock toggle -> Dual Sync)
router.post('/admin/toggle-stock', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const { productId, inStock } = req.body;

    if (!productId || inStock === undefined) {
        return res.status(400).json({ error: 'productId and inStock are required' });
    }

    const numericStock = inStock ? 1 : 0;
    const current = db.prepare('SELECT stock_left FROM products WHERE id = ?').get(productId);
    const newStockLeft = inStock ? (current && current.stock_left > 0 ? current.stock_left : 25) : 0;

    await syncProductStock(db, productId, newStockLeft, numericStock);

    res.json({ success: true, message: `Product ${productId} stock updated in both databases`, in_stock: numericStock, stock_left: newStockLeft });
});

module.exports = router;

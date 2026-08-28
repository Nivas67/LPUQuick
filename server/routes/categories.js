const express = require('express');
const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    // Get all categories with product counts (single query)
    const categories = db.prepare(`
        SELECT category, COUNT(*) as product_count, 
               SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as in_stock_count
        FROM products
        GROUP BY category
        ORDER BY product_count DESC
    `).all();

    const categoryMeta = {
        'Grocery': { icon: 'shopping_cart', color: 'primary-container', description: 'Fresh produce & daily essentials' },
        'Snacks & Beverages': { icon: 'fastfood', color: 'secondary-container', description: 'Chips, drinks & more' },
        'Personal Care': { icon: 'clean_hands', color: 'tertiary-container', description: 'Skincare & hygiene' },
        'Pharmacy': { icon: 'medication', color: 'error-container', description: 'Medicines & first aid' },
        'Stationery': { icon: 'edit_document', color: 'surface-variant', description: 'Pens, notebooks & supplies' },
        'Electronics': { icon: 'devices', color: 'surface-container-high', description: 'Chargers, cables & accessories' }
    };

    const result = categories.map(c => ({
        name: c.category,
        product_count: c.product_count,
        in_stock_count: c.in_stock_count,
        ...(categoryMeta[c.category] || { icon: 'category', color: 'surface', description: '' })
    }));

    res.json({ categories: result });
});

// GET /api/categories/:name
router.get('/:name', (req, res) => {
    const db = req.app.locals.db;
    const { name } = req.params;

    const products = db.prepare('SELECT * FROM products WHERE category = ? AND in_stock = 1 ORDER BY bestseller DESC, name ASC').all(name);

    res.json({ category: name, products });
});

module.exports = router;

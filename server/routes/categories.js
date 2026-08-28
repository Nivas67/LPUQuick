const express = require('express');
const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    const categories = db.prepare(`
        SELECT category, COUNT(*) as product_count, 
               SUM(CASE WHEN in_stock = 1 THEN 1 ELSE 0 END) as in_stock_count
        FROM products
        GROUP BY category
        ORDER BY product_count DESC
    `).all();

    const categoryMeta = {
        'Bakery & Biscuits': { icon: 'cookie', color: 'primary-container', description: 'Cookies, Rusks, Cakes & Bread' },
        'Snacks & Beverages': { icon: 'fastfood', color: 'secondary-container', description: 'Chips, Drinks, Noodles & Instant' },
        'Grocery': { icon: 'shopping_cart', color: 'primary-container', description: 'Fresh Dairy, Fruits & Staples' },
        'Personal Care': { icon: 'clean_hands', color: 'tertiary-container', description: 'Skincare, Oral Care & Hygiene' },
        'Pharmacy': { icon: 'medication', color: 'error-container', description: 'Medicines & First Aid' },
        'Stationery': { icon: 'edit_document', color: 'surface-variant', description: 'Pens, Notebooks & Supplies' },
        'Electronics': { icon: 'devices', color: 'surface-container-high', description: 'Chargers, Cables & Earphones' }
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
    const { subcategory, sort, veg } = req.query;

    let query = 'SELECT * FROM products WHERE (category = ? OR category LIKE ?)';
    const params = [name, `%${name}%`];

    if (subcategory && subcategory !== 'all') {
        query += ' AND subcategory = ?';
        params.push(subcategory);
    }

    if (veg === '1' || veg === 'true') {
        query += ' AND is_veg = 1';
    }

    if (sort === 'price_asc') {
        query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
        query += ' ORDER BY price DESC';
    } else if (sort === 'discount') {
        query += ' ORDER BY (mrp - price) DESC, price ASC';
    } else if (sort === 'rating') {
        query += ' ORDER BY rating DESC';
    } else {
        query += ' ORDER BY bestseller DESC, is_new DESC, name ASC';
    }

    const products = db.prepare(query).all(...params);

    // Get available subcategories for this category
    const subcategories = db.prepare(`
        SELECT subcategory, COUNT(*) as count, MIN(image_url) as sample_image
        FROM products
        WHERE category = ? OR category LIKE ?
        GROUP BY subcategory
        ORDER BY count DESC
    `).all(name, `%${name}%`);

    res.json({
        category: name,
        subcategories: subcategories.filter(s => s.subcategory),
        products
    });
});

module.exports = router;

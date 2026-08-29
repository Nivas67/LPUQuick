const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

// GET /api/categories
router.get('/', async (req, res) => {
    try {
        const payload = await cache.wrap('categories:list', async () => {
            const categories = await supabaseDb.products.getCategories();

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
                name: c.name,
                product_count: c.product_count,
                in_stock_count: c.in_stock_count,
                ...(categoryMeta[c.name] || { icon: 'category', color: 'surface', description: '' })
            }));

            return { categories: result };
        }, 60000);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/categories/:name
router.get('/:name', async (req, res) => {
    const { name } = req.params;
    const { subcategory, sort } = req.query;
    const cacheKey = `categories:${name}:${subcategory || 'all'}:${sort || 'default'}`;

    try {
        const payload = await cache.wrap(cacheKey, async () => {
            const products = await supabaseDb.products.getAll({
                includeInactive: true,
                category: name,
                subcategory,
                sort
            });

            // Extract subcategories
            const subcategoryMap = {};
            products.forEach(p => {
                if (p.subcategory) {
                    if (!subcategoryMap[p.subcategory]) {
                        subcategoryMap[p.subcategory] = { subcategory: p.subcategory, count: 0, sample_image: p.image_url };
                    }
                    subcategoryMap[p.subcategory].count++;
                }
            });

            return {
                category: name,
                subcategories: Object.values(subcategoryMap),
                products
            };
        }, 45000);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

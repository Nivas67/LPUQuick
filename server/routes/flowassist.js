const express = require('express');
const router = express.Router();

// Rule-based intent parser (simulates LLM extraction)
function parseIntent(query) {
    const lower = query.toLowerCase();
    const result = {
        intent: 'bundle',
        headcount: null,
        budget: null,
        categories: [],
        occasion: null,
        keywords: []
    };

    // Extract headcount
    const headcountMatch = lower.match(/(\d+)\s*(?:people|friends|persons|guests|guys)/);
    if (headcountMatch) result.headcount = parseInt(headcountMatch[1]);

    // Extract budget
    const budgetMatch = lower.match(/(?:under|below|within|max|budget|₹|rs\.?|inr)\s*(\d+)/i);
    if (budgetMatch) result.budget = parseInt(budgetMatch[1]);
    const budgetMatch2 = lower.match(/(\d+)\s*(?:rupees|rs|₹)/);
    if (!result.budget && budgetMatch2) result.budget = parseInt(budgetMatch2[1]);

    // Detect occasion
    const occasions = {
        'match': 'Game Day', 'cricket': 'Game Day', 'football': 'Game Day', 'game': 'Game Day',
        'movie': 'Movie Night', 'netflix': 'Movie Night', 'binge': 'Movie Night',
        'party': 'House Party', 'birthday': 'Birthday Bash', 'celebration': 'Celebration',
        'study': 'Study Session', 'exam': 'Study Session',
        'breakfast': 'Breakfast', 'brunch': 'Brunch',
        'dinner': 'Dinner Prep', 'lunch': 'Lunch Prep',
        'late night': 'Late Night', 'midnight': 'Midnight Munchies'
    };
    for (const [key, val] of Object.entries(occasions)) {
        if (lower.includes(key)) { result.occasion = val; break; }
    }

    // Detect categories
    const categoryKeywords = {
        'snack': 'Snacks & Beverages', 'snacks': 'Snacks & Beverages', 'chips': 'Snacks & Beverages',
        'drink': 'Snacks & Beverages', 'drinks': 'Snacks & Beverages', 'beverage': 'Snacks & Beverages',
        'cola': 'Snacks & Beverages', 'juice': 'Snacks & Beverages', 'soda': 'Snacks & Beverages',
        'cookie': 'Snacks & Beverages', 'cookies': 'Snacks & Beverages', 'biscuit': 'Snacks & Beverages',
        'noodle': 'Snacks & Beverages', 'maggi': 'Snacks & Beverages',
        'grocery': 'Grocery', 'milk': 'Grocery', 'bread': 'Grocery', 'egg': 'Grocery',
        'fruit': 'Grocery', 'vegetable': 'Grocery',
        'medicine': 'Pharmacy', 'pharmacy': 'Pharmacy',
        'stationery': 'Stationery', 'pen': 'Stationery', 'notebook': 'Stationery',
        'electronic': 'Electronics', 'cable': 'Electronics', 'charger': 'Electronics'
    };
    const cats = new Set();
    for (const [key, val] of Object.entries(categoryKeywords)) {
        if (lower.includes(key)) cats.add(val);
    }
    result.categories = [...cats];
    if (result.categories.length === 0) result.categories = ['Snacks & Beverages'];

    // Extract keywords for tag matching
    const stopWords = new Set(['for', 'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'is', 'are', 'we', 'i', 'me', 'my', 'need', 'want', 'get', 'some', 'under', 'below', 'within', 'people', 'friends', 'watching', 'having', 'tonight', 'today']);
    result.keywords = lower.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));

    return result;
}

const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

// POST /api/flow-assist
router.post('/', async (req, res) => {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const intent = parseIntent(query);

        // Fetch all in-stock products from cache / Supabase
        const allProducts = await cache.wrap('flowassist:products', async () => {
            return await supabaseDb.products.getAll({ includeInactive: false });
        }, 60000);

        // Filter by intent categories
        const catSet = new Set(intent.categories.map(c => c.toLowerCase()));
        let products = allProducts.filter(p => {
            const cat = (p.category || '').toLowerCase();
            return catSet.has(cat) || intent.categories.some(c => cat.includes(c.toLowerCase()));
        });

        if (products.length === 0) {
            products = allProducts;
        }

        // Score products by keyword relevance
        products = products.map(p => {
            let score = 0;
            const pName = p.name.toLowerCase();
            const pTags = (p.tags || '').toLowerCase();
            for (const kw of intent.keywords) {
                if (pName.includes(kw)) score += 10;
                if (pTags.includes(kw)) score += 5;
            }
            if (p.bestseller) score += 3;
            if (p.is_new) score += 2;
            return { ...p, _score: score };
        }).sort((a, b) => b._score - a._score);

        // Select items within budget
        let bundle = [];
        let total = 0;
        const maxItems = intent.headcount ? Math.min(intent.headcount, 6) : 4;
        const budget = intent.budget || 999999;

        for (const p of products) {
            if (bundle.length >= maxItems) break;
            if (total + p.price <= budget) {
                bundle.push(p);
                total += p.price;
            }
        }

        // Calculate savings
        const mrpTotal = bundle.reduce((sum, p) => sum + (p.mrp || p.price), 0);
        const savings = mrpTotal - total;

        // Generate bundle name
        const bundleName = intent.occasion
            ? `${intent.occasion} ${bundle.length > 2 ? 'Bundle' : 'Pack'}`
            : 'Custom Bundle';

        const response = {
            bundle_name: bundleName,
            tag: intent.occasion || 'Custom',
            items: bundle.map(({ _score, ...p }) => p),
            total_price: total,
            mrp_total: mrpTotal,
            savings: savings,
            headcount: intent.headcount,
            budget: intent.budget,
            intent: intent,
            ai_message: `I've put together a "${bundleName}" for you${intent.headcount ? ` that's perfect for ${intent.headcount} people` : ''}. ${bundle.length} items totaling ₹${total}${savings > 0 ? ` (saving ₹${savings})` : ''}.`
        };

        res.json(response);
    } catch (err) {
        console.error('[Flow Assist Error]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

// Levenshtein distance for typo tolerance
function levenshtein(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
        Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] = b[i - 1] === a[j - 1]
                ? matrix[i - 1][j - 1]
                : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

// GET /api/search?q=
router.get('/', async (req, res) => {
    const query = (req.query.q || '').trim().toLowerCase();

    if (!query) {
        return res.json({ results: [], suggestions: [] });
    }

    try {
        const payload = await cache.wrap(`search:q:${query}`, async () => {
            const allProducts = await supabaseDb.products.getAll({ includeInactive: false });

            // Score each product based on name + category + subcategory + tags + typo tolerance
            const scored = allProducts.map(p => {
                const name = (p.name || '').toLowerCase();
                const category = (p.category || '').toLowerCase();
                const subcategory = (p.subcategory || '').toLowerCase();
                const tags = (p.tags || '').toLowerCase();
                const words = query.split(/\s+/).filter(Boolean);

                let score = 0;

                // Exact category or subcategory match
                if (category === query || subcategory === query) score += 120;
                if (category.includes(query) || subcategory.includes(query)) score += 80;

                // Exact name substring match
                if (name.includes(query)) score += 100;
                if (tags.includes(query)) score += 60;

                // Word-level matching
                for (const word of words) {
                    if (name.includes(word)) score += 40;
                    if (category.includes(word)) score += 30;
                    if (subcategory.includes(word)) score += 25;
                    if (tags.includes(word)) score += 20;

                    // Typo tolerance: check Levenshtein distance
                    const nameWords = [...name.split(/\s+/), ...category.split(/\s+/)];
                    for (const nw of nameWords) {
                        if (nw.length >= 3 && Math.abs(nw.length - word.length) <= 2) {
                            const dist = levenshtein(word, nw);
                            if (dist === 1) score += 20;
                            else if (dist === 2 && word.length >= 5) score += 10;
                        }
                    }
                }

                return { ...p, score };
            });

            const results = scored
                .filter(p => p.score > 0)
                .sort((a, b) => b.score - a.score);

            const matchedCategories = [...new Set(results.map(r => r.category).filter(Boolean))];
            const suggestions = matchedCategories.slice(0, 4).map(cat => ({
                text: cat,
                type: 'category'
            }));

            return {
                query,
                total: results.length,
                results,
                suggestions
            };
        }, 60000);

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


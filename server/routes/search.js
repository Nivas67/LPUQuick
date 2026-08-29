const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');

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
        const allProducts = await supabaseDb.products.getAll({ includeInactive: true });

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
                    const dist = levenshtein(word, nw);
                    if (dist <= 2 && word.length > 2) score += Math.max(0, 25 - dist * 8);
                }
            }

            return { ...p, score };
        });

        // Filter and sort by score
        const results = scored
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        // Generate intelligent suggestions
        const suggestions = [];
        if (results.length > 0) {
            const cats = [...new Set(results.map(r => r.category).filter(Boolean))];
            const subcats = [...new Set(results.map(r => r.subcategory).filter(Boolean))];
            cats.slice(0, 2).forEach(c => suggestions.push({ text: c, type: 'category' }));
            subcats.slice(0, 2).forEach(s => suggestions.push({ text: s, type: 'subcategory' }));
            results.slice(0, 3).forEach(r => suggestions.push({ text: r.name, type: 'product' }));
        }

        res.json({
            query,
            total: results.length,
            results,
            suggestions: suggestions.slice(0, 5)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

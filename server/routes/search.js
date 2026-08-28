const express = require('express');
const router = express.Router();

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
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const query = (req.query.q || '').trim().toLowerCase();

    if (!query) {
        return res.json({ results: [], suggestions: [] });
    }

    // Batch fetch ALL products in one query (prevents N+1)
    const allProducts = db.prepare('SELECT * FROM products').all();

    // Score each product based on name match + tags + typo tolerance
    const scored = allProducts.map(p => {
        const name = p.name.toLowerCase();
        const tags = (p.tags || '').toLowerCase();
        const words = query.split(/\s+/);

        let score = 0;

        // Exact substring match (highest priority)
        if (name.includes(query)) score += 100;

        // Word-level matching
        for (const word of words) {
            if (name.includes(word)) score += 50;
            if (tags.includes(word)) score += 20;

            // Typo tolerance: check Levenshtein distance for each name word
            const nameWords = name.split(/\s+/);
            for (const nw of nameWords) {
                const dist = levenshtein(word, nw);
                if (dist <= 2 && word.length > 2) score += Math.max(0, 30 - dist * 10);
            }
        }

        return { ...p, _score: score };
    });

    // Filter and sort by score
    const results = scored
        .filter(p => p._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 20)
        .map(({ _score, ...p }) => p);

    // For out-of-stock results, find smart substitutions
    const resultsWithSubs = results.map(p => {
        if (!p.in_stock) {
            // Find top 2 alternatives: same category, similar price range, in stock
            const alternatives = allProducts
                .filter(alt =>
                    alt.in_stock &&
                    alt.id !== p.id &&
                    alt.category === p.category &&
                    Math.abs(alt.price - p.price) <= p.price * 0.5
                )
                .sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
                .slice(0, 2);
            return { ...p, alternatives };
        }
        return p;
    });

    res.json({ results: resultsWithSubs, query });
});

module.exports = router;

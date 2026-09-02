const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAdmin = require('../middleware/adminAuth');
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');
const { broadcastInventoryUpdate } = require('../realtime');

// POST /api/products/admin/upload-image (Save uploaded photo locally and return URL)
router.post('/admin/upload-image', requireAdmin, async (req, res) => {
    try {
        const { image_data, filename } = req.body;
        if (!image_data) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        // Handle Base64 Data URL
        const matches = image_data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            let ext = 'jpg';
            if (mimeType.includes('png')) ext = 'png';
            else if (mimeType.includes('webp')) ext = 'webp';
            else if (mimeType.includes('gif')) ext = 'gif';
            else if (mimeType.includes('svg')) ext = 'svg';

            const cleanFileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
            
            const publicUploads = path.join(__dirname, '..', '..', 'public', 'uploads');
            const clientUploads = path.join(__dirname, '..', '..', 'client', 'uploads');

            if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
            if (!fs.existsSync(clientUploads)) fs.mkdirSync(clientUploads, { recursive: true });

            fs.writeFileSync(path.join(publicUploads, cleanFileName), buffer);
            fs.writeFileSync(path.join(clientUploads, cleanFileName), buffer);

            const publicUrl = `/uploads/${cleanFileName}`;
            console.log(`[Product Photo Upload] ✅ Saved photo to: ${publicUrl}`);
            return res.json({ success: true, image_url: publicUrl });
        }

        // Already a valid URL
        return res.json({ success: true, image_url: image_data });
    } catch (err) {
        console.error('[Upload Image Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const details = await cache.wrap(`products:detail:${id}`, async () => {
            const product = await supabaseDb.products.getById(id);
            if (!product) return null;

            return {
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
        }, 60000);

        if (!details) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Persistent Snapshot Fallback for Catalog Resilience
let fallbackProductsCache = [];
try {
    const pSnapPath = path.join(__dirname, '..', 'data', 'products_snapshot.json');
    if (fs.existsSync(pSnapPath)) {
        fallbackProductsCache = JSON.parse(fs.readFileSync(pSnapPath, 'utf8'));
    }
} catch (e) {
    console.warn('[Products Snapshot Load Note]:', e.message);
}

// GET /api/products (Fetch all products with resilient cloud fallback)
router.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const category = req.query.category || '';
        const subcategory = req.query.subcategory || '';
        const sort = req.query.sort || '';
        const isFresh = req.query.fresh === 'true' || req.query._t || req.headers['cache-control']?.includes('no-cache') || req.headers['pragma'] === 'no-cache';
        const cacheKey = `products:list:${includeInactive}:${category}:${subcategory}:${sort}`;

        if (isFresh) {
            cache.delete(cacheKey);
        }

        const payload = await cache.wrap(cacheKey, async () => {
            const queryPromise = supabaseDb.products.getAll({ includeInactive, category, subcategory, sort });
            const products = await Promise.race([
                queryPromise,
                new Promise(resolve => setTimeout(() => resolve(null), 5000))
            ]);

            if (products && Array.isArray(products)) {
                fallbackProductsCache = products;
                return { products };
            }

            // Return snapshot fallback if Supabase is sleeping or timing out
            let list = Array.isArray(fallbackProductsCache) ? [...fallbackProductsCache] : [];
            if (category && category !== 'All') {
                list = list.filter(p => (p.category || '').toLowerCase().includes(category.toLowerCase()));
            }
            if (subcategory && subcategory !== 'all') {
                list = list.filter(p => (p.subcategory || '').toLowerCase() === subcategory.toLowerCase());
            }
            return { products: list, isFallback: true };
        }, isFresh ? 0 : 45000);

        res.json(payload || { products: fallbackProductsCache || [] });
    } catch (err) {
        console.warn('[Products Route Note]:', err.message);
        res.json({ products: fallbackProductsCache, isFallback: true });
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

        cache.invalidateProducts();
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
        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(updated.id, updated.stock_left, updated.in_stock);
        }
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
        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(updated.id, 0, false);
        }
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
        cache.invalidateProducts();
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
        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(productId, updated.stock_left, updated.in_stock);
        }
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

        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(productId, updated.stock_left, updated.in_stock);
        }

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

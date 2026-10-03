const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAdmin = require('../middleware/adminAuth');
const { verifyAdminToken, staffUserCache, KNOWN_STAFF_FALLBACKS, resolveAdminRoles } = require('../middleware/adminAuth');
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');
const { broadcastInventoryUpdate, broadcastCatalogUpdate } = require('../realtime');

function isPlatformOwnerToken(tokenString) {
    if (!tokenString || typeof tokenString !== 'string') return false;
    let cleanToken = tokenString.trim();
    if (cleanToken.startsWith('Bearer ')) cleanToken = cleanToken.slice(7).trim();
    const verified = verifyAdminToken(cleanToken);
    if (!verified) return false;
    if (verified.role === 'owner' || verified.sub === 'user_admin_bh13') return true;
    const user = (staffUserCache && staffUserCache.get(verified.sub)) || (KNOWN_STAFF_FALLBACKS && KNOWN_STAFF_FALLBACKS[verified.sub]);
    if (user && (user.role === 'owner' || user.id === 'user_admin_bh13' || user.email === 'admin@lpu.in')) return true;
    const roles = resolveAdminRoles ? resolveAdminRoles(user || { id: verified.sub, role: verified.role }) : [];
    return roles.includes('owner');
}

function isAdminToken(tokenString) {
    if (!tokenString || typeof tokenString !== 'string') return false;
    let cleanToken = tokenString.trim();
    if (cleanToken.startsWith('Bearer ')) cleanToken = cleanToken.slice(7).trim();
    const verified = verifyAdminToken(cleanToken);
    return Boolean(verified);
}

const { getSupabaseClient } = require('../supabase');

/**
 * Uploads a base64 image data URL directly to Supabase Object Storage ('products' bucket)
 * and returns the permanent public CDN URL.
 */
async function uploadBase64ToSupabaseStorage(base64Data, preferredName = null) {
    if (!base64Data || typeof base64Data !== 'string') return base64Data;
    if (!base64Data.startsWith('data:image/')) return base64Data;

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return base64Data;

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('svg')) ext = 'svg';

    const cleanFileName = preferredName ? `${preferredName}_${Date.now()}.${ext}` : `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    // 1. Mirror directly to local uploads directory for immediate zero-latency serving
    try {
        const publicUploads = path.join(__dirname, '..', '..', 'public', 'uploads');
        if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
        fs.writeFileSync(path.join(publicUploads, cleanFileName), buffer);

        const clientUploads = path.join(__dirname, '..', '..', 'client', 'uploads');
        if (fs.existsSync(clientUploads)) {
            fs.writeFileSync(path.join(clientUploads, cleanFileName), buffer);
        }
    } catch (fsErr) {
        console.warn('[Local Image Save Warning]:', fsErr.message);
    }

    const supabase = getSupabaseClient();
    if (!supabase) return `/uploads/${cleanFileName}`;

    try {
        await supabase.storage.createBucket('products', { public: true, fileSizeLimit: 5242880 });
    } catch (e) {}

    const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(cleanFileName, buffer, {
            contentType: mimeType,
            upsert: true
        });

    if (uploadErr) {
        console.warn('[Supabase Storage Upload Notice]:', uploadErr.message);
        return `/uploads/${cleanFileName}`;
    }

    const { data: pubData } = supabase.storage.from('products').getPublicUrl(cleanFileName);
    return pubData?.publicUrl || `/uploads/${cleanFileName}`;
}

// POST /api/products/admin/upload-image (Save uploaded photo directly to Supabase Storage CDN)
router.post('/admin/upload-image', requireAdmin, async (req, res) => {
    try {
        const { image_data, filename } = req.body;
        if (!image_data) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        if (image_data.startsWith('data:image/')) {
            const prefix = filename ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') : null;
            const publicUrl = await uploadBase64ToSupabaseStorage(image_data, prefix);
            console.log(`[Product Photo Upload] ✅ Saved photo to Supabase Storage: ${publicUrl}`);
            return res.json({ success: true, image_url: publicUrl });
        }

        return res.json({ success: true, image_url: image_data });
    } catch (err) {
        console.error('[Upload Image Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products/admin/invalidate-cache (Admin manual refresh cache burst)
router.post('/admin/invalidate-cache', requireAdmin, (req, res) => {
    cache.invalidateProducts();
    if (supabaseDb.inventory && supabaseDb.inventory._memoryHostelInventory) {
        supabaseDb.inventory._memoryHostelInventory.clear();
    }
    res.json({ success: true, message: 'Products and inventory cache cleared' });
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const hostelId = req.query.hostel_id || req.query.hostel;
        const cleanHostel = (hostelId && hostelId !== 'all' && hostelId !== 'ALL') ? String(hostelId).trim().toUpperCase() : null;

        const authHeader = req.headers['x-admin-token'] || req.headers.authorization || '';
        const isOwner = isPlatformOwnerToken(authHeader);
        const isAdmin = isAdminToken(authHeader);
        const forceFresh = req.query.force === 'true' || isAdmin;

        const cacheKey = `products:detail:${id}:${cleanHostel || 'all'}`;
        if (forceFresh) {
            cache.delete(cacheKey);
        }

        const details = await cache.wrap(cacheKey, async () => {
            const product = await supabaseDb.products.getById(id, cleanHostel);
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
                delivery_eta: `3 mins to ${cleanHostel || 'Campus'} (LPU Hostels)`
            };
        }, forceFresh ? 0 : 300000);

        if (!details) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Security: Only Platform Owner can view cost to estimate profits.
        // Store Managers, delivery partners, and public storefront customers MUST NOT see admin cost
        if (!isOwner) {
            res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
            const sanitized = { ...details };
            delete sanitized.cost_price;
            delete sanitized.cost;
            return res.json(sanitized);
        }

        res.setHeader('Cache-Control', 'private, no-cache, no-store');
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
        const adminToken = req.headers['x-admin-token'] || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
        const verifiedAdmin = adminToken ? verifyAdminToken(adminToken) : null;
        const isAdmin = Boolean(verifiedAdmin);

        let hostelId = req.query.hostel_id || req.query.hostel || '';
        
        // If an authenticated admin has an assigned hostel (Store Manager / Staff), lock to their hostel
        if (verifiedAdmin && verifiedAdmin.role !== 'owner' && verifiedAdmin.sub !== 'user_admin_bh13') {
            let user = (staffUserCache && staffUserCache.get(verifiedAdmin.sub)) || (KNOWN_STAFF_FALLBACKS && KNOWN_STAFF_FALLBACKS[verifiedAdmin.sub]);
            if (!user) {
                try {
                    user = await supabaseDb.users.getUserById(verifiedAdmin.sub);
                    if (user) staffUserCache.set(user.id, user);
                } catch (e) {}
            }
            if (user?.dob && typeof user.dob === 'string' && user.dob.startsWith('{')) {
                try {
                    const parsed = JSON.parse(user.dob);
                    if (parsed.assigned_hostel_id) hostelId = parsed.assigned_hostel_id;
                } catch (e) {}
            }
            if (!hostelId && user?.assigned_hostel_id) {
                hostelId = user.assigned_hostel_id;
            }
        }

        const includeInactive = req.query.includeInactive === 'true';
        const category = req.query.category || '';
        const subcategory = req.query.subcategory || '';
        const sort = req.query.sort || '';
        const forceFresh = req.query.force === 'true' || isAdmin || includeInactive;

        if (!isAdmin && !includeInactive && !forceFresh) {
            res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=60, stale-while-revalidate=120');
        } else {
            res.setHeader('Cache-Control', 'no-cache, no-store');
        }
        const cacheKey = `products:list:${hostelId || 'all'}:${includeInactive}:${category}:${subcategory}:${sort}`;

        if (forceFresh) {
            cache.delete(cacheKey);
        }

        const payload = await cache.wrap(cacheKey, async () => {
            const queryPromise = supabaseDb.products.getAll({ hostel_id: hostelId, includeInactive, category, subcategory, sort, force: forceFresh });
            const products = await Promise.race([
                queryPromise,
                new Promise(resolve => setTimeout(() => resolve(null), 10000))
            ]);

            if (products && Array.isArray(products)) {
                fallbackProductsCache = products;
                return { products };
            }

            // Return snapshot fallback if Supabase is sleeping or timing out
            let list = Array.isArray(fallbackProductsCache) ? [...fallbackProductsCache] : [];
            if (hostelId && hostelId !== 'all') {
                list = list.map(p => ({ ...p, hostel_id: hostelId }));
            }
            if (category && category !== 'All') {
                list = list.filter(p => (p.category || '').toLowerCase().includes(category.toLowerCase()));
            }
            if (subcategory && subcategory !== 'all') {
                list = list.filter(p => (p.subcategory || '').toLowerCase() === subcategory.toLowerCase());
            }
            return { products: list, isFallback: true };
        }, forceFresh ? 0 : 300000);

        const rawList = payload?.products || fallbackProductsCache || [];
        
        // Security: Verified Admins (Owner & Store Managers) can view cost to estimate profits.
        // Public storefront customers MUST NOT see admin cost or profit margins
        const authHeader = req.headers['x-admin-token'] || req.headers.authorization || '';
        const isOwner = isPlatformOwnerToken(authHeader);

        // Filter out deleted items for hostel stores and store managers
        let sanitizedList = rawList;
        if (!isOwner || (hostelId && hostelId !== 'all' && hostelId !== 'ALL')) {
            sanitizedList = sanitizedList.filter(p => !p.deleted);
        }

        const filteredList = isOwner
            ? sanitizedList
            : sanitizedList.map(p => {
                const copy = { ...p };
                delete copy.cost_price;
                delete copy.cost;
                return copy;
            });

        res.json({ products: filteredList, isFallback: Boolean(payload?.isFallback), hostel_id: hostelId || 'all' });
    } catch (err) {
        console.warn('[Products Route Note]:', err.message);
        res.json({ products: fallbackProductsCache, isFallback: true });
    }
});

// POST /api/products/admin/create (Add new product to Supabase)
router.post('/admin/create', requireAdmin, async (req, res) => {
    const { name, category, subcategory, price, mrp, cost_price, cost, unit, size, image_url, description, tags, bestseller, is_new, stock_left, hostel_id } = req.body;

    if (!name || !category || price === undefined) {
        return res.status(400).json({ error: 'Name, category, and price are required' });
    }

    try {
        let finalImageUrl = image_url;
        if (finalImageUrl && finalImageUrl.startsWith('data:image/')) {
            finalImageUrl = await uploadBase64ToSupabaseStorage(finalImageUrl, `prod_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`);
        }

        const isOwner = Boolean(req.admin && req.admin.is_owner);
        let targetHostel = hostel_id || 'BH-13';
        if (!isOwner && req.admin?.assigned_hostel_id) {
            targetHostel = req.admin.assigned_hostel_id;
        }

        const normTarget = targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const targetStock = stock_left !== undefined ? Math.max(0, Number(stock_left)) : 0;
        const targetInStock = targetStock > 0;

        // When creating a product for targetHostel, pass actual stock and in_stock so tags encode stock:<num>, hostel:<hostel>
        const created = await supabaseDb.products.create({
            name,
            hostel_id: targetHostel,
            category,
            subcategory,
            price: Number(price),
            mrp: mrp ? Number(mrp) : Number(price),
            cost_price: Number(cost_price !== undefined ? cost_price : (cost !== undefined ? cost : 0)) || 0,
            stock_left: targetStock,
            unit,
            size,
            image_url: finalImageUrl,
            description,
            tags,
            bestseller,
            is_new,
            in_stock: targetInStock
        });

        // Always save isolated inventory for targetHostel
        if (supabaseDb.inventory) {
            await supabaseDb.inventory.setProductStock(targetHostel, created.id, {
                stock_left: targetStock,
                in_stock: targetInStock,
                deleted: false
            });
        }

        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(created.id, targetStock, targetInStock, targetHostel);
        }
        if (typeof broadcastCatalogUpdate === 'function') {
            broadcastCatalogUpdate(created.id, targetHostel, 'create');
        }

        const freshProduct = await supabaseDb.products.getById(created.id, targetHostel);

        res.json({
            success: true,
            message: `Product created for ${targetHostel}`,
            product: freshProduct || { ...created, stock_left: targetStock, in_stock: targetInStock, hostel_id: targetHostel, origin_hostel: targetHostel }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/products/admin/update/:id (Edit existing product in Supabase)
router.put('/admin/update/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = { ...req.body };
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostel = req.admin?.assigned_hostel_id || null;

        // Target hostel: Store Manager is strictly locked to assigned_hostel_id.
        // Platform owner uses req.body.hostel_id if specified, or assignedHostel, or 'BH-13'.
        const targetHostel = (!isOwner && assignedHostel)
            ? assignedHostel
            : (req.body.hostel_id || req.body.hostel || assignedHostel || 'BH-13');

        const normTarget = targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Verify existing product exists
        const existing = await supabaseDb.products.getById(id, targetHostel);
        if (!existing) return res.status(404).json({ error: 'Product not found' });

        const rawOrigin = existing.origin_hostel || existing.hostel_id || 'BH-13';
        const normOrigin = rawOrigin.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const isCustomForThisHostel = (normOrigin === normTarget && normTarget !== 'BH13');
        const isCampusBaseline = (normOrigin === 'BH13' || normOrigin === 'ALL' || normOrigin === 'CAMPUS');

        // Check if Store Manager is attempting to manage a hostel other than their assigned hostel
        if (!isOwner && assignedHostel) {
            const normAssigned = assignedHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (normTarget !== normAssigned) {
                return res.status(403).json({ error: 'Forbidden: You only have access to manage products in your assigned hostel.' });
            }
        }

        // Handle image upload if a base64 data URL was supplied
        if (updateData.image_url && updateData.image_url.startsWith('data:image/')) {
            updateData.image_url = await uploadBase64ToSupabaseStorage(updateData.image_url, `prod_${id}`);
        }

        // Determine stock updates if provided
        let targetStock = undefined;
        let targetInStock = undefined;
        if (updateData.stock_left !== undefined || updateData.in_stock !== undefined) {
            targetStock = updateData.stock_left !== undefined 
                ? Math.max(0, Number(updateData.stock_left)) 
                : (updateData.in_stock ? (existing.stock_left > 0 ? existing.stock_left : 0) : 0);
            targetInStock = updateData.in_stock !== undefined ? Boolean(updateData.in_stock && targetStock > 0) : targetStock > 0;
        }

        if (!isOwner) {
            // Store Manager:
            if (isCustomForThisHostel) {
                // Store manager completely owns this custom hostel product!
                // Full editing rights: name, category, subcategory, price, mrp, unit, size, image_url, description, tags, stock
                const productUpdates = { ...updateData };
                delete productUpdates.id;
                delete productUpdates.hostel_id;
                if (targetStock !== undefined) {
                    productUpdates.stock_left = targetStock;
                    productUpdates.in_stock = targetInStock;
                }
                if (Object.keys(productUpdates).length > 0) {
                    await supabaseDb.products.update(id, productUpdates);
                }

                if (targetStock !== undefined) {
                    await supabaseDb.inventory.setProductStock(targetHostel, id, {
                        stock_left: targetStock,
                        in_stock: targetInStock,
                        deleted: false
                    });
                }
            } else {
                // Baseline product: Store manager can only adjust stock/in_stock in their local store
                if (targetStock === undefined && targetInStock === undefined) {
                    return res.status(403).json({ error: 'Forbidden: Only the platform owner can edit global campus product catalog details.' });
                }
                await supabaseDb.inventory.setProductStock(targetHostel, id, {
                    stock_left: targetStock,
                    in_stock: targetInStock,
                    deleted: false
                });
            }

            cache.invalidateProducts();
            if (targetStock !== undefined && typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, targetStock, targetInStock, targetHostel);
            }
            if (typeof broadcastCatalogUpdate === 'function') {
                broadcastCatalogUpdate(id, targetHostel, 'update');
            }

            const fresh = await supabaseDb.products.getById(id, targetHostel);
            return res.json({
                success: true,
                message: `Product updated successfully for ${targetHostel}`,
                product: fresh || { ...existing, ...(targetStock !== undefined ? { stock_left: targetStock, in_stock: targetInStock } : {}), hostel_id: targetHostel }
            });
        }

        // Platform Owner:
        if (targetStock !== undefined) {
            await supabaseDb.inventory.setProductStock(targetHostel, id, {
                stock_left: targetStock,
                in_stock: targetInStock,
                deleted: false
            });
            if (typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, targetStock, targetInStock, targetHostel);
            }
        }

        // Update catalog details on the master record
        const catalogUpdates = { ...updateData };
        delete catalogUpdates.id;
        delete catalogUpdates.hostel_id;
        if (targetStock !== undefined && (normTarget === 'BH13' || isCustomForThisHostel)) {
            catalogUpdates.stock_left = targetStock;
            catalogUpdates.in_stock = targetInStock;
        } else {
            delete catalogUpdates.stock_left;
            delete catalogUpdates.in_stock;
        }

        if (Object.keys(catalogUpdates).length > 0) {
            await supabaseDb.products.update(id, catalogUpdates);
        }

        cache.invalidateProducts();
        if (typeof broadcastCatalogUpdate === 'function') {
            broadcastCatalogUpdate(id, targetHostel, 'update');
        }
        const fresh = await supabaseDb.products.getById(id, targetHostel);
        res.json({
            success: true,
            message: `Product updated successfully for ${targetHostel}`,
            product: fresh || {
                ...existing,
                ...(targetStock !== undefined ? { stock_left: targetStock, in_stock: targetInStock } : {}),
                hostel_id: targetHostel
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/admin/deactivate/:id (Deactivate product in Supabase)
router.delete('/admin/deactivate/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostel = req.admin?.assigned_hostel_id || null;
        const targetHostel = (!isOwner && assignedHostel) ? assignedHostel : (req.query.hostel_id || req.body?.hostel_id || 'BH-13');

        if (!isOwner && assignedHostel) {
            // Store manager deactivates (marks out of stock) in their assigned dark-store only
            const updatedStock = await supabaseDb.inventory.setProductStock(assignedHostel, id, {
                in_stock: false,
                stock_left: 0
            });
            cache.invalidateProducts();
            if (typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, 0, false, assignedHostel);
            }
            if (typeof broadcastCatalogUpdate === 'function') {
                broadcastCatalogUpdate(id, assignedHostel, 'deactivate');
            }
            return res.json({ success: true, message: `Product marked out of stock in ${assignedHostel}`, product: updatedStock });
        }

        if (targetHostel && targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '') !== 'BH13') {
            const updatedStock = await supabaseDb.inventory.setProductStock(targetHostel, id, {
                in_stock: false,
                stock_left: 0
            });
            cache.invalidateProducts();
            if (typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, 0, false, targetHostel);
            }
            if (typeof broadcastCatalogUpdate === 'function') {
                broadcastCatalogUpdate(id, targetHostel, 'deactivate');
            }
            return res.json({ success: true, message: `Product marked out of stock in ${targetHostel}`, product: updatedStock });
        }

        const updated = await supabaseDb.products.update(id, { in_stock: false, stock_left: 0 });
        if (supabaseDb.inventory) {
            await supabaseDb.inventory.setProductStock('BH-13', id, { in_stock: false, stock_left: 0 }).catch(() => {});
        }
        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(updated.id, 0, false, 'BH-13');
        }
        if (typeof broadcastCatalogUpdate === 'function') {
            broadcastCatalogUpdate(updated.id, 'BH-13', 'deactivate');
        }
        res.json({ success: true, message: `Product deactivated successfully`, product: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/products/admin/delete/:id (Delete from hostel store for store manager; permanent deletion for owner)
router.delete('/admin/delete/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        const assignedHostel = req.admin?.assigned_hostel_id || null;
        const targetHostel = (!isOwner && assignedHostel)
            ? assignedHostel
            : (req.query.hostel_id || req.body?.hostel_id || null);

        if (!isOwner) {
            if (!assignedHostel) {
                return res.status(403).json({ error: 'Forbidden: No assigned hostel store found.' });
            }

            // Store Manager deletes product for their assigned hostel only
            const existing = await supabaseDb.products.getById(id, assignedHostel);
            const originHostel = (existing?.origin_hostel || existing?.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const assignedNorm = assignedHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');

            // If product was created solely by/for this hostel, remove master record
            if (originHostel === assignedNorm && originHostel !== 'BH13') {
                await supabaseDb.products.delete(id).catch(() => {});
            }

            await supabaseDb.inventory.setProductStock(assignedHostel, id, {
                stock_left: 0,
                in_stock: false,
                deleted: true
            });

            cache.invalidateProducts();
            if (typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, 0, false, assignedHostel);
            }
            if (typeof broadcastCatalogUpdate === 'function') {
                broadcastCatalogUpdate(id, assignedHostel, 'delete');
            }
            return res.json({
                success: true,
                message: `Product removed from ${assignedHostel} store successfully`,
                hostel_id: assignedHostel
            });
        }

        // Platform Owner:
        if (targetHostel && targetHostel !== 'ALL' && targetHostel !== 'all') {
            const existing = await supabaseDb.products.getById(id, targetHostel);
            const targetNorm = targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const originHostel = (existing?.origin_hostel || existing?.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');

            if (originHostel === targetNorm && targetNorm !== 'BH13') {
                await supabaseDb.products.delete(id).catch(() => {});
            }

            await supabaseDb.inventory.setProductStock(targetHostel, id, {
                stock_left: 0,
                in_stock: false,
                deleted: true
            });
            cache.invalidateProducts();
            if (typeof broadcastInventoryUpdate === 'function') {
                broadcastInventoryUpdate(id, 0, false, targetHostel);
            }
            if (typeof broadcastCatalogUpdate === 'function') {
                broadcastCatalogUpdate(id, targetHostel, 'delete');
            }
            return res.json({
                success: true,
                message: `Product removed from ${targetHostel} store`,
                hostel_id: targetHostel
            });
        }

        await supabaseDb.products.delete(id);
        cache.invalidateProducts();
        if (typeof broadcastCatalogUpdate === 'function') {
            broadcastCatalogUpdate(id, 'ALL', 'delete');
        }
        res.json({ success: true, message: 'Product permanently deleted from Supabase Cloud' });
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
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        let targetHostel = 'BH-13';
        if (!isOwner && req.admin?.assigned_hostel_id) {
            targetHostel = req.admin.assigned_hostel_id;
        } else if (req.body.hostel_id || req.body.hostel) {
            targetHostel = req.body.hostel_id || req.body.hostel;
        }

        if (!isOwner && req.admin?.assigned_hostel_id && req.body.hostel_id) {
            const normReq = req.body.hostel_id.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normAssigned = req.admin.assigned_hostel_id.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normReq !== normAssigned) {
                return res.status(403).json({ error: 'Forbidden: You only have access to manage stock in your assigned hostel.' });
            }
        }

        const existing = await supabaseDb.products.getById(productId, targetHostel);
        if (!existing) return res.status(404).json({ error: 'Product not found' });

        const targetInStock = Boolean(inStock);
        let newStock = targetInStock 
            ? (req.body.stock !== undefined ? Math.max(0, Number(req.body.stock)) : (existing.stock_left > 0 ? existing.stock_left : 0)) 
            : 0;

        const updated = await supabaseDb.inventory.setProductStock(targetHostel, productId, {
            stock_left: newStock,
            in_stock: targetInStock && newStock > 0,
            deleted: false
        });

        const normTarget = targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const normOrigin = (existing.origin_hostel || existing.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normTarget === 'BH13' || normOrigin === normTarget) {
            await supabaseDb.products.update(productId, {
                stock_left: newStock,
                in_stock: targetInStock && newStock > 0
            }).catch(() => {});
        }

        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(productId, updated.stock_left, updated.in_stock, targetHostel);
        }
        res.json({ success: true, message: `Stock updated for ${targetHostel}`, in_stock: updated.in_stock, stock_left: updated.stock_left, hostel_id: targetHostel });
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
        const isOwner = Boolean(req.admin && req.admin.is_owner);
        let targetHostel = 'BH-13';
        if (!isOwner && req.admin?.assigned_hostel_id) {
            targetHostel = req.admin.assigned_hostel_id;
        } else if (req.body.hostel_id || req.body.hostel) {
            targetHostel = req.body.hostel_id || req.body.hostel;
        }

        if (!isOwner && req.admin?.assigned_hostel_id && req.body.hostel_id) {
            const normReq = req.body.hostel_id.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normAssigned = req.admin.assigned_hostel_id.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (normReq !== normAssigned) {
                return res.status(403).json({ error: 'Forbidden: You only have access to manage stock in your assigned hostel.' });
            }
        }

        const product = await supabaseDb.products.getById(productId, targetHostel);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        let newStock = product.stock_left || 0;
        if (stock !== undefined) {
            newStock = Math.max(0, Number(stock));
        } else if (delta !== undefined) {
            newStock = Math.max(0, newStock + Number(delta));
        }

        const updated = await supabaseDb.inventory.setProductStock(targetHostel, productId, {
            stock_left: newStock,
            in_stock: newStock > 0,
            deleted: false
        });

        const normTarget = targetHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const normOrigin = (product.origin_hostel || product.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normTarget === 'BH13' || normOrigin === normTarget) {
            await supabaseDb.products.update(productId, {
                stock_left: newStock,
                in_stock: newStock > 0
            }).catch(() => {});
        }

        cache.invalidateProducts();
        if (typeof broadcastInventoryUpdate === 'function') {
            broadcastInventoryUpdate(productId, updated.stock_left, updated.in_stock, targetHostel);
        }

        res.json({
            success: true,
            productId,
            stock_left: updated.stock_left,
            in_stock: updated.in_stock,
            hostel_id: targetHostel,
            status: updated.in_stock ? 'In Stock' : 'Out of Stock'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.isPlatformOwnerToken = isPlatformOwnerToken;
module.exports = router;

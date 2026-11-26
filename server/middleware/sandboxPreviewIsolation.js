const { isSandboxRuntime, isProductionSupabaseUrl } = require('../supabase');
const { createSupabaseSandboxStore, isSandboxDatabaseConfigured, SandboxStoreError } = require('../services/sandboxPaymentStore');
const { SANDBOX_PRICING_POLICY } = require('../services/sandboxPaymentService');

const SANDBOX_HOSTELS = [
    {
        id: 'BH-13',
        name: 'Boys Hostel 13 (Sandbox)',
        status: 'ACTIVE',
        blocks: ['Block A', 'Block B', 'Hostel Main Gate'],
        pickup_details: {
            store_name: 'LPUQuick BH-13 Sandbox Dark Store',
            pickup_address: 'Sandbox Test Pickup Counter, BH-13, LPU Campus',
            pickup_contact: '+91 00000 00000',
            pickup_hours: 'Sandbox 24x7 Testing',
            pickup_maps_url: 'https://maps.google.com/?q=Lovely+Professional+University'
        }
    },
    {
        id: 'GH-12',
        name: 'Girls Hostel 12 (Sandbox)',
        status: 'ACTIVE',
        blocks: ['Block A', 'Block B', 'Hostel Main Gate'],
        pickup_details: {
            store_name: 'LPUQuick GH-12 Sandbox Dark Store',
            pickup_address: 'Sandbox Test Pickup Counter, GH-12, LPU Campus',
            pickup_contact: '+91 00000 00000',
            pickup_hours: 'Sandbox 24x7 Testing',
            pickup_maps_url: 'https://maps.google.com/?q=Lovely+Professional+University'
        }
    }
];

function computeSandboxCartPricing(items = []) {
    const totalQuantity = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalMrp = items.reduce((s, it) => s + ((Number(it.mrp) || Number(it.price) || 0) * (Number(it.quantity) || 0)), 0);
    const subtotal = Math.round(items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 0)), 0) * 100) / 100;
    const mrpDiscount = Math.max(0, Math.round((totalMrp - subtotal) * 100) / 100);
    const handling = items.length > 0 ? SANDBOX_PRICING_POLICY.handling_fee : 0;
    const delivery = 0;
    const minOrderValue = SANDBOX_PRICING_POLICY.min_cart_value;
    const total = Math.max(0, subtotal + delivery + handling);
    const deliverySavings = items.length > 0 ? 25 : 0;

    return {
        subtotal,
        total_mrp: totalMrp,
        mrp_discount: mrpDiscount,
        discount5: 0,
        bulk_discount: 0,
        global_discount: 0,
        delivery_fee: delivery,
        platform_fee: handling,
        handling_fee: handling,
        tax: 0,
        total,
        total_savings: mrpDiscount + deliverySavings,
        min_order_value: minOrderValue,
        is_min_order_met: subtotal >= minOrderValue,
        min_order_shortfall: Math.max(0, minOrderValue - subtotal),
        item_count: totalQuantity,
        total_items: totalQuantity
    };
}

function normalizeHostelParam(raw) {
    const m = String(raw || '').match(/(BH|GH)[-\s]?(\d+)/i);
    if (m) return `${m[1].toUpperCase()}-${m[2]}`;
    return 'BH-13';
}

function getEffectiveSandboxUserId(req) {
    return String(
        req.params?.userId ||
        req.query?.userId ||
        req.query?.user_id ||
        req.body?.userId ||
        req.body?.user_id ||
        req.headers?.['x-user-id'] ||
        ''
    ).trim();
}

function formatCatalogProduct(item, hostelId = 'BH-13') {
    return {
        ...item,
        hostel_id: hostelId,
        deleted: false
    };
}

function handleSandboxError(res, err) {
    if (err instanceof SandboxStoreError) {
        return res.status(err.statusCode || 503).json({
            success: false,
            sandbox: true,
            code: err.code,
            error: err.message
        });
    }
    return res.status(503).json({
        success: false,
        sandbox: true,
        code: 'SANDBOX_ISOLATION_ERROR',
        error: err && err.message ? err.message : 'Sandbox database unavailable.'
    });
}

/**
 * Full Preview / Sandbox isolation middleware.
 * Ensures zero reads or writes touch the production Supabase database, real customer records,
 * real inventory, notifications, or delivery workflows during Preview testing.
 */
function createSandboxPreviewIsolationMiddleware(options = {}) {
    const store = options.store || createSupabaseSandboxStore();
    const checkSandboxMode = options.isSandboxRuntime || isSandboxRuntime;

    return async function sandboxPreviewIsolation(req, res, next) {
        if (!checkSandboxMode()) {
            return next();
        }

        const rawPath = (req.path || '').replace(/\/+$/, '') || '/';
        const p = rawPath.toLowerCase();
        const method = req.method.toUpperCase();

        // Always allow isolated sandbox payment endpoints
        if (p === '/api/payments' || p.startsWith('/api/payments/')) {
            return next();
        }

        // Health & Realtime endpoints (never leak production Supabase URL/key or ping prod DB)
        if (p === '/api/health' && method === 'GET') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            const dbReady = isSandboxDatabaseConfigured() && !isProductionSupabaseUrl(process.env.SANDBOX_SUPABASE_URL || '');
            return res.json({
                status: 'healthy',
                platform: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
                environment: 'sandbox-preview',
                database: dbReady ? 'sandbox-isolated' : 'sandbox-unconfigured',
                timestamp: new Date().toISOString()
            });
        }

        if (p === '/api/realtime/config' && method === 'GET') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.json({
                supabaseUrl: '',
                supabaseAnonKey: '',
                sandboxIsolated: true
            });
        }

        // Block live production checkout immediately in Sandbox/Preview
        if (p === '/api/checkout' || p === '/api/checkout/place') {
            return res.status(403).json({
                success: false,
                sandbox: true,
                code: 'LIVE_CHECKOUT_DISABLED_IN_SANDBOX',
                error: 'Live Cash/Pay-on-Delivery order placement is disabled in Sandbox Preview mode. Select UPI / QR (Sandbox Test) to place an isolated test payment.'
            });
        }

        if (p === '/api/checkout/settings' && method === 'GET') {
            return res.json({
                success: true,
                sandbox: true,
                settings: {
                    offers_enabled: false,
                    offer_type: 'percentage',
                    offer_value: 0,
                    minimum_order_value: 249,
                    maximum_discount: 0,
                    free_delivery_enabled: true,
                    free_delivery_threshold: 0,
                    delivery_fee: SANDBOX_PRICING_POLICY.delivery_fee,
                    handling_fee: SANDBOX_PRICING_POLICY.handling_fee,
                    handling_fee_enabled: true,
                    min_cart_value: SANDBOX_PRICING_POLICY.min_cart_value
                }
            });
        }

        // Sandbox Hostel & Order-Mode Settings (zero prod DB queries)
        if (p === '/api/hostels/active' && method === 'GET') {
            return res.json({ success: true, sandbox: true, hostels: SANDBOX_HOSTELS });
        }

        if (p === '/api/client/status' && method === 'GET') {
            return res.json({ is_locked: false, lock_status: 'AVAILABLE', sandbox: true });
        }

        if (p === '/api/order-mode/status' && method === 'GET') {
            const hid = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
            const hObj = SANDBOX_HOSTELS.find(h => h.id === hid) || SANDBOX_HOSTELS[0];
            return res.json({
                success: true,
                sandbox: true,
                data: {
                    hostel_id: hObj.id,
                    delivery_enabled: true,
                    takeaway_enabled: true,
                    maintenance_fee_enabled: true,
                    maintenance_fee_type: 'fixed',
                    maintenance_fee: SANDBOX_PRICING_POLICY.takeaway_fee,
                    pickup_details: hObj.pickup_details
                }
            });
        }

        // Isolated Sandbox Storefront Catalog Read Endpoints (strictly from sandbox_catalog_items in sandbox DB)
        try {
            if ((p === '/api/home/banners' || p === '/api/banners') && method === 'GET') {
                return res.json({
                    success: true,
                    sandbox: true,
                    posters: [
                        {
                            id: 'sbx_banner_1',
                            title: 'Sandbox Test Storefront Active',
                            subtitle: 'Isolated UPI testing only — no real inventory or delivery side-effects',
                            cta: 'Explore Test Items',
                            targetUrl: '#shop-catalog-section',
                            is_active: true
                        }
                    ],
                    settings: { autoplay_delay: 5000, autoplay_enabled: true }
                });
            }

            if (p === '/api/home' && method === 'GET') {
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
                const rows = await store.listCatalogItems({});
                const products = rows.map(r => formatCatalogProduct(r, hostelId));
                const categories = Array.from(new Set(products.map(pr => pr.category))).map(name => ({ name, count: products.filter(x => x.category === name).length }));
                return res.json({
                    success: true,
                    sandbox: true,
                    hostel_id: hostelId,
                    section: { title: 'Sandbox Test Essentials', greeting: 'Sandbox Preview Mode', icon: 'science' },
                    categories,
                    bestsellers: products.filter(pr => pr.bestseller),
                    trending: products.filter(pr => pr.is_new),
                    all_products: products,
                    products,
                    buy_again: [],
                    promos: []
                });
            }

            if (p === '/api/categories' && method === 'GET') {
                const rows = await store.listCatalogItems({});
                const counts = new Map();
                rows.forEach(r => counts.set(r.category, (counts.get(r.category) || 0) + 1));
                const categories = Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
                return res.json({ success: true, sandbox: true, categories });
            }

            if (p.startsWith('/api/categories/') && method === 'GET') {
                const catName = decodeURIComponent(rawPath.slice('/api/categories/'.length));
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
                const rows = await store.listCatalogItems({ category: catName });
                return res.json({ success: true, sandbox: true, products: rows.map(r => formatCatalogProduct(r, hostelId)) });
            }

            if (p === '/api/products' && method === 'GET') {
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
                const rows = await store.listCatalogItems({ category: req.query.category });
                return res.json({ success: true, sandbox: true, products: rows.map(r => formatCatalogProduct(r, hostelId)) });
            }

            if (p.startsWith('/api/products/') && method === 'GET') {
                const pid = decodeURIComponent(rawPath.slice('/api/products/'.length));
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
                const rows = await store.getCatalogItemsByIds([pid]);
                if (!rows.length) {
                    return res.status(404).json({ success: false, sandbox: true, error: 'Sandbox product not found.' });
                }
                const prod = formatCatalogProduct(rows[0], hostelId);
                return res.json({ success: true, sandbox: true, product: prod, ...prod });
            }

            if (p === '/api/search' && method === 'GET') {
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.query.hostel);
                const q = String(req.query.q || '').trim();
                const rows = await store.listCatalogItems({ search: q });
                const results = rows.map(r => formatCatalogProduct(r, hostelId));
                return res.json({ success: true, sandbox: true, results, suggestions: results.slice(0, 3).map(r => r.name) });
            }

            // Isolated Sandbox Cart Endpoints (backed strictly by sandbox_cart_items in sandbox DB)
            if (p === '/api/cart' || p.startsWith('/api/cart/')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
                const hostelId = normalizeHostelParam(req.query.hostel_id || req.body?.hostel_id || req.headers['x-hostel-id']);

                if (p === '/api/cart/check-conflict' && method === 'POST') {
                    return res.json({ conflict: false, sandbox: true });
                }

                if (p === '/api/cart/merge' && method === 'POST') {
                    const targetUserId = req.body?.targetUserId;
                    const items = targetUserId ? await store.getCartItems(targetUserId, hostelId) : [];
                    const pricing = computeSandboxCartPricing(items);
                    return res.json({ items, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                }

                if ((p === '/api/cart/set-quantity' || p === '/api/cart') && method === 'POST') {
                    const uid = getEffectiveSandboxUserId(req);
                    const pid = req.body?.productId || req.body?.product_id;
                    const qty = req.body?.quantity !== undefined ? Number(req.body.quantity) : 1;
                    const items = await store.setCartItemQuantity(uid, pid, qty, hostelId);
                    const pricing = computeSandboxCartPricing(items);
                    return res.json({ items, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                }

                if (p.startsWith('/api/cart/user/') && method === 'DELETE') {
                    const uid = decodeURIComponent(rawPath.slice('/api/cart/user/'.length));
                    await store.clearCart(uid);
                    const pricing = computeSandboxCartPricing([]);
                    return res.json({ success: true, items: [], item_count: 0, total_items: 0, pricing, sandbox: true });
                }

                if (method === 'PUT' && p.startsWith('/api/cart/')) {
                    const cartId = decodeURIComponent(rawPath.slice('/api/cart/'.length));
                    const uid = getEffectiveSandboxUserId(req);
                    const curItems = await store.getCartItems(uid, hostelId);
                    const target = curItems.find(it => it.cart_id === cartId || it.product_id === cartId);
                    if (!target) {
                        const pricing = computeSandboxCartPricing(curItems);
                        return res.json({ items: curItems, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                    }
                    const items = await store.setCartItemQuantity(uid, target.product_id, Number(req.body?.quantity) || 0, hostelId);
                    const pricing = computeSandboxCartPricing(items);
                    return res.json({ items, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                }

                if (method === 'DELETE' && p.startsWith('/api/cart/')) {
                    const cartId = decodeURIComponent(rawPath.slice('/api/cart/'.length));
                    const uid = getEffectiveSandboxUserId(req);
                    const curItems = await store.getCartItems(uid, hostelId);
                    const target = curItems.find(it => it.cart_id === cartId || it.product_id === cartId);
                    const items = target ? await store.setCartItemQuantity(uid, target.product_id, 0, hostelId) : curItems;
                    const pricing = computeSandboxCartPricing(items);
                    return res.json({ items, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                }

                if (method === 'GET') {
                    const parts = rawPath.split('/').filter(Boolean);
                    const uid = parts.length >= 3 ? decodeURIComponent(parts[2]) : getEffectiveSandboxUserId(req);
                    const items = uid ? await store.getCartItems(uid, hostelId) : [];
                    const pricing = computeSandboxCartPricing(items);
                    return res.json({ items, item_count: pricing.item_count, total_items: pricing.total_items, pricing, sandbox: true });
                }
            }
        } catch (err) {
            return handleSandboxError(res, err);
        }

        // Safe isolated stubs for customer SPA background checks (never touches real users or real orders)
        if (p.startsWith('/api/auth/check-status/') && method === 'GET') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            return res.json({
                userId: decodeURIComponent(rawPath.slice('/api/auth/check-status/'.length)),
                isBlocked: false,
                account_status: 'ACTIVE',
                sandbox: true
            });
        }

        if (p === '/api/auth/update-address' && method === 'POST') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            return res.json({ success: true, sandbox: true });
        }

        if (method === 'GET' && /^\/api\/orders\/[^/]+(\/active)?$/.test(p) && !p.startsWith('/api/orders/admin')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
            return res.json({ active: null, past: [], orders: [], sandbox: true });
        }

        // Block all other API routes in Sandbox/Preview so no route can read/write production tables
        if (p.startsWith('/api/')) {
            return res.status(403).json({
                success: false,
                sandbox: true,
                code: 'SANDBOX_ISOLATION_ACTIVE',
                error: 'Route is disabled in Sandbox Preview isolation mode to protect production data.'
            });
        }

        return next();
    };
}

module.exports = {
    SANDBOX_HOSTELS,
    computeSandboxCartPricing,
    createSandboxPreviewIsolationMiddleware
};

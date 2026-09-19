// LPUQuick High-Speed API Client with Intelligent Request Caching & Low-Signal Offline Engine
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? `${window.location.origin}/api` : '/api';

// Persistent LocalStorage Keys for Low-Signal Resilience
const STORAGE_KEYS = {
    HOME: 'lpuquick_cached_home_feed',
    CATEGORIES: 'lpuquick_cached_categories',
    PRODUCTS_ALL: 'lpuquick_cached_products_all',
    CART_STATE: 'lpuquick_cached_cart_state',
    CART_MEM: 'lpuquick_cached_cart_memory'
};

function readStorageJson(key, defaultVal = null) {
    if (typeof localStorage === 'undefined') return defaultVal;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
}

function writeStorageJson(key, val) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
        // Safe fail on quota or private browsing
    }
}

// Low-Signal Resilient Fetch with AbortController Timeout (Avoids infinite hanging on 2G/3G)
async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const opts = { ...options, signal: controller.signal };
        const res = await fetch(url, opts);
        clearTimeout(timer);
        return res;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

const searchCache = new Map();
let categoriesCache = null;
let categoriesCacheTime = 0;
let homeFeedCache = null;
let homeFeedCacheTime = 0;
let homeFeedCacheUserId = null;

let cartMemoryCache = null;
let cartMemoryCacheTime = 0;
let ordersMemoryCache = null;
let ordersMemoryCacheTime = 0;
let activeOrderMemoryCache = null;
let activeOrderMemoryCacheTime = 0;

let productsMemoryCache = new Map();
let productsMemoryCacheTime = new Map();

window.__cachedProducts = window.__cachedProducts || new Map();

function indexProducts(items) {
    if (!Array.isArray(items)) return;
    items.forEach(p => {
        if (p && p.id) {
            window.__cachedProducts.set(p.id, p);
        }
    });
}

// Synchronous Startup Hydration (0ms Instant First Render even offline or on 2G)
try {
    const cachedHome = readStorageJson(STORAGE_KEYS.HOME);
    if (cachedHome && typeof cachedHome === 'object') {
        homeFeedCache = cachedHome;
        homeFeedCacheTime = Date.now() - 30000;
        if (cachedHome.deals) indexProducts(cachedHome.deals);
        if (cachedHome.bestSellers) indexProducts(cachedHome.bestSellers);
        if (cachedHome.recommended) indexProducts(cachedHome.recommended);
        if (cachedHome.all_products) indexProducts(cachedHome.all_products);
    }
    const cachedCats = readStorageJson(STORAGE_KEYS.CATEGORIES);
    if (cachedCats && Array.isArray(cachedCats)) {
        categoriesCache = cachedCats;
        categoriesCacheTime = Date.now() - 30000;
    }
    const cachedProds = readStorageJson(STORAGE_KEYS.PRODUCTS_ALL);
    if (cachedProds && Array.isArray(cachedProds.products)) {
        productsMemoryCache.set('__all__', cachedProds);
        productsMemoryCacheTime.set('__all__', Date.now() - 30000);
        indexProducts(cachedProds.products);
    }
    const cachedCartState = readStorageJson(STORAGE_KEYS.CART_STATE);
    if (cachedCartState && typeof cachedCartState === 'object') {
        window.cartState = cachedCartState;
    }
    const cachedCartMem = readStorageJson(STORAGE_KEYS.CART_MEM);
    if (cachedCartMem && typeof cachedCartMem === 'object') {
        cartMemoryCache = cachedCartMem;
        cartMemoryCacheTime = Date.now() - 30000;
    }
} catch (e) {
    console.warn('[LPUQuick Hydration Warning]', e);
}

window.__pendingCartSync = window.__pendingCartSync || {};
window.__cartSyncDebounceTimers = window.__cartSyncDebounceTimers || {};

function updateLocalCartState(cartData) {
    window.cartState = window.cartState || {};
    window.__pendingCartSync = window.__pendingCartSync || {};
    if (cartData && Array.isArray(cartData.items)) {
        const nextState = {};
        cartData.items.forEach(i => {
            if (i.product_id) {
                const isPending = window.__pendingCartSync[i.product_id];
                const finalQty = isPending !== undefined ? isPending.targetQty : (Number(i.quantity) || 0);
                if (finalQty > 0) {
                    nextState[i.product_id] = {
                        cart_id: i.cart_id || i.id,
                        quantity: finalQty,
                        price: Number(i.price) || 0,
                        name: i.name || '',
                        image_url: i.image_url || ''
                    };
                }
            }
        });
        // Also preserve any pending items with targetQty > 0
        Object.entries(window.__pendingCartSync).forEach(([pid, syncInfo]) => {
            if (syncInfo && syncInfo.targetQty > 0 && !nextState[pid]) {
                const cachedProd = window.__cachedProducts?.get(pid);
                nextState[pid] = {
                    cart_id: syncInfo.cartId || `temp_${pid}`,
                    quantity: syncInfo.targetQty,
                    price: Number(cachedProd?.price) || 0,
                    name: cachedProd?.name || '',
                    image_url: cachedProd?.image_url || ''
                };
            }
        });
        window.cartState = nextState;
        writeStorageJson(STORAGE_KEYS.CART_STATE, window.cartState);
    }
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }
}

// Atomic Optimistic Cart State & Fast-Tap Debounced Syncer (< 1ms UI response, 100% accurate count)
window.setOptimisticCartQuantity = function(productId, targetQty, maxStock = 50, onSynced = null) {
    if (!productId) return;
    if (window.__isUserBlocked) {
        alert(`⛔ Account Suspended:\n\nYou are blocked due to ${(window.__userBlockReason || 'fake orders').toLowerCase()}.\n\nPlease contact BH13 Central Campus Hub.`);
        if (typeof window.syncUserBlockStatus === 'function') window.syncUserBlockStatus();
        return;
    }
    const uid = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID;
    window.cartState = window.cartState || {};
    window.__pendingCartSync = window.__pendingCartSync || {};
    window.__cartSyncDebounceTimers = window.__cartSyncDebounceTimers || {};

    // 1. Clamp target quantity to [0, maxStock]
    const clampedQty = Math.max(0, Math.min(Number(targetQty), Number(maxStock)));
    
    // Track original confirmed quantity for rollback on network failure
    if (!window.__pendingCartSync[productId]) {
        let existingConfirmed = window.cartState[productId]?.quantity;
        if (existingConfirmed === undefined && typeof document !== 'undefined') {
            const domCartRow = document.querySelector(`.cart-row[data-product-id="${productId}"]`);
            if (domCartRow) {
                const domQty = parseInt(domCartRow.querySelector('.qty-num')?.textContent || '0');
                if (domQty > 0) existingConfirmed = domQty;
            }
        }
        window.__pendingCartSync[productId] = {
            confirmedQty: existingConfirmed !== undefined ? existingConfirmed : 0,
            cartId: window.cartState[productId]?.cart_id || null,
            targetQty: clampedQty
        };
    } else {
        window.__pendingCartSync[productId].targetQty = clampedQty;
    }

    // 2. Synchronous Instant State & DOM update (0ms UI lag)
    if (clampedQty > 0) {
        window.cartState[productId] = {
            quantity: clampedQty,
            cart_id: window.cartState[productId]?.cart_id || window.__pendingCartSync[productId]?.cartId || `temp_${productId}`
        };
    } else {
        delete window.cartState[productId];
    }
    writeStorageJson(STORAGE_KEYS.CART_STATE, window.cartState);

    // 3. Synchronously update cartMemoryCache so getCart() and page renders are always 100% accurate
    if (cartMemoryCache && Array.isArray(cartMemoryCache.items)) {
        if (clampedQty <= 0) {
            cartMemoryCache.items = cartMemoryCache.items.filter(it => it.product_id !== productId);
        } else {
            const existing = cartMemoryCache.items.find(it => it.product_id === productId);
            if (existing) {
                existing.quantity = clampedQty;
            } else {
                const cachedProd = window.__cachedProducts?.get(productId);
                cartMemoryCache.items.push({
                    id: `temp_${productId}`,
                    cart_id: `temp_${productId}`,
                    product_id: productId,
                    quantity: clampedQty,
                    name: cachedProd?.name || 'Item',
                    price: Number(cachedProd?.price) || 0,
                    mrp: Number(cachedProd?.mrp) || Number(cachedProd?.price) || 0,
                    image_url: cachedProd?.image_url || '',
                    in_stock: true,
                    stock_left: maxStock
                });
            }
        }

        // Clean deduplication
        const unique = new Map();
        for (const it of cartMemoryCache.items) {
            if (it.product_id && !unique.has(it.product_id)) {
                unique.set(it.product_id, it);
            }
        }
        cartMemoryCache.items = Array.from(unique.values());

        // Recompute pricing
        const list = cartMemoryCache.items;
        const totalQuantity = list.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
        const totalMrp = list.reduce((sum, it) => sum + ((Number(it.mrp) || Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
        const subtotal = list.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
        const mrpDiscount = Math.max(0, totalMrp - subtotal);
        const hasDiscount = subtotal >= 350;
        const discount5 = hasDiscount ? Math.round(subtotal * 0.05) : 0;
        const platform_fee = list.length > 0 ? 3 : 0;
        const total = Math.max(0, subtotal - discount5 + platform_fee);
        cartMemoryCache.item_count = totalQuantity;
        cartMemoryCache.total_items = totalQuantity;
        cartMemoryCache.pricing = {
            subtotal,
            total_mrp: totalMrp,
            mrp_discount: mrpDiscount,
            discount5,
            bulk_discount: discount5,
            delivery_fee: 0,
            platform_fee,
            tax: 0,
            total,
            total_savings: mrpDiscount + discount5 + (subtotal > 0 ? 25 : 0),
            min_order_value: 35,
            is_min_order_met: subtotal >= 35,
            min_order_shortfall: Math.max(0, 35 - subtotal),
            item_count: totalQuantity,
            total_items: totalQuantity
        };
        cartMemoryCacheTime = Date.now();
        writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
    }
    
    if (typeof window.updateSingleProductSlot === 'function') {
        window.updateSingleProductSlot(productId);
    }
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }

    // 4. Clear existing debounce timer for this product
    if (window.__cartSyncDebounceTimers[productId]) {
        clearTimeout(window.__cartSyncDebounceTimers[productId]);
    }

    // 5. Debounce network dispatch (150ms) via authoritative atomic set-quantity route
    window.__cartSyncDebounceTimers[productId] = setTimeout(async () => {
        delete window.__cartSyncDebounceTimers[productId];
        const syncInfo = window.__pendingCartSync[productId];
        if (!syncInfo) return;

        const finalQty = syncInfo.targetQty;
        delete window.__pendingCartSync[productId];

        try {
            const res = await window.api.setCartQuantity(uid, productId, finalQty);
            if (res && Array.isArray(res.items)) {
                cartMemoryCache = res;
                cartMemoryCacheTime = Date.now();
                writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
                updateLocalCartState(res);
            }
            if (typeof onSynced === 'function') onSynced(finalQty);
        } catch (err) {
            console.error('[Cart Sync Error]', err);
            // Rollback on server error
            if (syncInfo.confirmedQty > 0) {
                window.cartState[productId] = { quantity: syncInfo.confirmedQty, cart_id: syncInfo.cartId };
            } else {
                delete window.cartState[productId];
            }
            if (typeof window.updateSingleProductSlot === 'function') {
                window.updateSingleProductSlot(productId);
            }
            if (typeof window.updateGlobalCartBadges === 'function') {
                window.updateGlobalCartBadges();
            }
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(err.message || 'Cart sync error', 'warning', 'inventory_2');
            }
            if (typeof onSynced === 'function') onSynced(syncInfo.confirmedQty);
        }
    }, 150);
};

const api = {
    // Auth
    async signin(email, password) {
        const res = await fetch(`${API_BASE}/auth/signin`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    async signup(data) {
        const res = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    async googleAuth(payload = {}) {
        const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return res.json();
    },
    async sendOtp(phone, userId = null) {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, userId })
        });
        return res.json();
    },
    async verifyOtp(phone, otp, userId = null) {
        const res = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp, userId })
        });
        return res.json();
    },

    // Home with Intelligent SWR Memory Cache & Offline Local Storage (0ms instant page loads)
    async fetchHome(userId = null) {
        const uid = userId || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID) || '';
        const tz = new Date().getTimezoneOffset();
        const url = uid ? `${API_BASE}/home?tz=${tz}&userId=${encodeURIComponent(uid)}` : `${API_BASE}/home?tz=${tz}`;
        const now = Date.now();

        const processHomeData = (data) => {
            if (!data) return;
            indexProducts(data.deals);
            indexProducts(data.bestSellers);
            indexProducts(data.recommended);
            indexProducts(data.quickBreakfast);
            indexProducts(data.midnightSnacks);
            indexProducts(data.studyEssentials);
            indexProducts(data.dormBeverages);
            indexProducts(data.buy_again);
            if (Array.isArray(data.all_products) && data.all_products.length > 0) {
                indexProducts(data.all_products);
                productsMemoryCache.set('__all__', { products: data.all_products });
                productsMemoryCacheTime.set('__all__', Date.now());
                writeStorageJson(STORAGE_KEYS.PRODUCTS_ALL, { products: data.all_products });
            }
            homeFeedCache = data;
            homeFeedCacheTime = Date.now();
            homeFeedCacheUserId = uid;
            writeStorageJson(STORAGE_KEYS.HOME, data);
        };

        // 1. Instant 0ms Memory Cache if fresh (< 30s)
        if (homeFeedCache && homeFeedCacheUserId === uid && (now - homeFeedCacheTime < 30000)) {
            return homeFeedCache;
        }

        // 2. If stale cache exists, return it immediately (0ms) and revalidate silently in background
        if (homeFeedCache) {
            fetchWithTimeout(url, {}, 3500)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        processHomeData(data);
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('lpuquick:home-updated', { detail: data }));
                        }
                    }
                })
                .catch(() => {});
            return homeFeedCache;
        }

        // 3. No memory cache: fast network fetch with 3.5s timeout (prevents hanging on low signal)
        try {
            const res = await fetchWithTimeout(url, {}, 3500);
            const data = await res.json();
            if (data && !data.error) {
                processHomeData(data);
                return data;
            }
        } catch (err) {
            console.warn('[Home Feed Network Fallback]', err.message);
        }

        // 4. If network failed or timed out, load from localStorage snapshot
        const stored = readStorageJson(STORAGE_KEYS.HOME);
        if (stored) {
            processHomeData(stored);
            return stored;
        }

        return { deals: [], bestSellers: [], recommended: [], categories: [] };
    },

    // Search with 0ms In-Memory Fast-Path + Resilient Network Timeout
    async searchProducts(query) {
        const q = (query || '').trim().toLowerCase();
        if (!q) return { results: [], suggestions: [] };

        // Fast-path: Search local memory cache instantly
        if (window.__cachedProducts && window.__cachedProducts.size > 0) {
            const localMatches = [];
            for (const product of window.__cachedProducts.values()) {
                const name = (product.name || '').toLowerCase();
                const cat = (product.category || '').toLowerCase();
                const brand = (product.brand || '').toLowerCase();
                if (name.includes(q) || cat.includes(q) || brand.includes(q)) {
                    localMatches.push(product);
                    if (localMatches.length >= 8) break;
                }
            }
            if (localMatches.length > 0) {
                return {
                    results: localMatches,
                    suggestions: localMatches.slice(0, 3).map(p => p.name),
                    fromMemory: true
                };
            }
        }

        const cached = searchCache.get(q);
        if (cached && (Date.now() - cached.time < 60000)) {
            return cached.data;
        }

        try {
            const res = await fetchWithTimeout(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {}, 3000);
            const data = await res.json();
            if (data && Array.isArray(data.results)) {
                indexProducts(data.results);
            }
            searchCache.set(q, { time: Date.now(), data });
            if (searchCache.size > 50) {
                searchCache.delete(searchCache.keys().next().value);
            }
            return data;
        } catch (err) {
            console.warn('[Search Network Fallback]', err.message);
            if (window.__cachedProducts && window.__cachedProducts.size > 0) {
                const localMatches = [];
                for (const product of window.__cachedProducts.values()) {
                    const name = (product.name || '').toLowerCase();
                    const cat = (product.category || '').toLowerCase();
                    const brand = (product.brand || '').toLowerCase();
                    if (name.includes(q) || cat.includes(q) || brand.includes(q)) {
                        localMatches.push(product);
                    }
                }
                return { results: localMatches, suggestions: [], fromMemory: true };
            }
            return { results: [], suggestions: [] };
        }
    },

    // Products List with 0ms SWR Memory Cache & Offline Fallback
    async getProducts(category = null) {
        const cacheKey = category || '__all__';
        const now = Date.now();
        const cached = productsMemoryCache.get(cacheKey);
        const cachedTime = productsMemoryCacheTime.get(cacheKey) || 0;

        const processProductsData = (data) => {
            if (data && Array.isArray(data.products)) {
                indexProducts(data.products);
                productsMemoryCache.set(cacheKey, data);
                productsMemoryCacheTime.set(cacheKey, Date.now());
                if (cacheKey === '__all__') {
                    writeStorageJson(STORAGE_KEYS.PRODUCTS_ALL, data);
                }
            }
        };

        // Return immediately if fresh (< 30s)
        if (cached && (now - cachedTime < 30000)) {
            return cached;
        }

        const url = category ? `${API_BASE}/products?category=${encodeURIComponent(category)}` : `${API_BASE}/products`;

        // If stale cache exists, return it immediately (0ms) and revalidate in background
        if (cached) {
            fetchWithTimeout(url, {}, 3500)
                .then(res => res.json())
                .then(data => processProductsData(data))
                .catch(() => {});
            return cached;
        }

        try {
            const res = await fetchWithTimeout(url, {}, 3500);
            const data = await res.json();
            processProductsData(data);
            return data;
        } catch (err) {
            console.warn('[Products Network Fallback]', err.message);
        }

        // Local storage or memory fallback for offline/low-signal
        if (cacheKey === '__all__') {
            const stored = readStorageJson(STORAGE_KEYS.PRODUCTS_ALL);
            if (stored && Array.isArray(stored.products)) {
                processProductsData(stored);
                return stored;
            }
        }

        if (window.__cachedProducts && window.__cachedProducts.size > 0) {
            let list = Array.from(window.__cachedProducts.values());
            if (category) {
                list = list.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
            }
            return { products: list, count: list.length };
        }

        return { products: [], count: 0 };
    },
    async fetchProducts(category = null) {
        return this.getProducts(category);
    },

    // Single Product Details (0ms in-memory fast path with timeout)
    async getProduct(id) {
        if (window.__cachedProducts && window.__cachedProducts.has(id)) {
            const cached = window.__cachedProducts.get(id);
            return { product: cached, ...cached };
        }
        try {
            const res = await fetchWithTimeout(`${API_BASE}/products/${id}`, {}, 3000);
            const data = await res.json();
            if (data && data.product) {
                indexProducts([data.product]);
                return { product: data.product, ...data.product };
            } else if (data && data.id) {
                indexProducts([data]);
                return { product: data, ...data };
            }
            return data;
        } catch(e) {
            const fallback = window.__cachedProducts?.get(id);
            if (fallback) return { product: fallback, ...fallback };
            throw e;
        }
    },

    // Flow Assist
    async flowAssist(query) {
        const res = await fetch(`${API_BASE}/flow-assist`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        return res.json();
    },

    // Cart (Instant 0ms SWR Memory Cache & Persistent Offline Storage)
    async getCart(userId) {
        const now = Date.now();
        if (cartMemoryCache && Array.isArray(cartMemoryCache.items) && (now - cartMemoryCacheTime < 4000)) {
            return cartMemoryCache;
        }
        try {
            const res = await fetchWithTimeout(`${API_BASE}/cart/${userId}`, {}, 3000);
            if (!res.ok) {
                if (cartMemoryCache && Array.isArray(cartMemoryCache.items)) return cartMemoryCache;
                const storedMem = readStorageJson(STORAGE_KEYS.CART_MEM);
                if (storedMem && Array.isArray(storedMem.items)) return storedMem;
                return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
            }
            const data = await res.json();
            if (data && Array.isArray(data.items)) {
                // Deduplicate items authoritatively
                const uniqueMap = new Map();
                data.items.forEach(it => {
                    if (it.product_id && !uniqueMap.has(it.product_id)) {
                        uniqueMap.set(it.product_id, it);
                    }
                });
                data.items = Array.from(uniqueMap.values());

                // Filter out any items that the user optimistically removed (quantity <= 0)
                if (window.cartState) {
                    data.items = data.items.filter(it => {
                        if (!it.product_id) return false;
                        if (window.__pendingCartSync && window.__pendingCartSync[it.product_id] !== undefined) {
                            return window.__pendingCartSync[it.product_id].targetQty > 0;
                        }
                        return true;
                    });
                }

                cartMemoryCache = data;
                cartMemoryCacheTime = Date.now();
                writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);

                data.items.forEach(item => {
                    if (item.product_id && item.stock_left !== undefined) {
                        if (window.__cachedProducts && window.__cachedProducts.has(item.product_id)) {
                            const cp = window.__cachedProducts.get(item.product_id);
                            cp.stock_left = item.stock_left;
                        }
                    }
                });
                updateLocalCartState(data);
            }
            return data && Array.isArray(data.items) ? data : { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
        } catch (err) {
            console.warn('[getCart Network Fallback]', err.message);
            if (cartMemoryCache && Array.isArray(cartMemoryCache.items)) return cartMemoryCache;
            const storedMem = readStorageJson(STORAGE_KEYS.CART_MEM);
            if (storedMem && Array.isArray(storedMem.items)) return storedMem;
            return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
        }
    },
    async setCartQuantity(userId, productId, quantity) {
        const uid = userId || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID);
        const res = await fetchWithTimeout(`${API_BASE}/cart/set-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: uid, productId, quantity })
        }, 5000);
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to update item quantity');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
            updateLocalCartState(result);
        }
        return result;
    },
    async addToCart(userId, productId, quantity = 1) {
        const res = await fetchWithTimeout(`${API_BASE}/cart`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity })
        }, 5000);
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to add item to cart');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
            updateLocalCartState(result);
        }
        return result;
    },
    async updateCartItem(cartId, quantity, userId) {
        const res = await fetchWithTimeout(`${API_BASE}/cart/${cartId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, userId })
        }, 5000);
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to update item quantity');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
            updateLocalCartState(result);
        }
        return result;
    },
    async removeCartItem(cartId) {
        const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID;
        const res = await fetchWithTimeout(`${API_BASE}/cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        }, 5000);
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to remove item from cart');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
            updateLocalCartState(result);
        }
        return result;
    },
    async clearCart(userId) {
        const uid = userId || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID);
        const res = await fetchWithTimeout(`${API_BASE}/cart/user/${uid}`, {
            method: 'DELETE'
        }, 5000);
        const result = await res.json();
        cartMemoryCache = { items: [], item_count: 0, total_items: 0, pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
        window.cartState = {};
        writeStorageJson(STORAGE_KEYS.CART_STATE, {});
        writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
        if (typeof window.updateGlobalCartBadges === 'function') {
            window.updateGlobalCartBadges();
        }
        return result;
    },
    async mergeCart(guestUserId, targetUserId) {
        if (!guestUserId || !targetUserId || guestUserId === targetUserId) return;
        try {
            const res = await fetchWithTimeout(`${API_BASE}/cart/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestUserId, targetUserId })
            }, 5000);
            const result = await res.json();
            if (result && Array.isArray(result.items)) {
                cartMemoryCache = result;
                cartMemoryCacheTime = Date.now();
                writeStorageJson(STORAGE_KEYS.CART_MEM, cartMemoryCache);
                updateLocalCartState(result);
            }
            return result;
        } catch (e) {
            console.error('[Merge Cart Error]', e);
        }
    },

    // Checkout with resilient timeout to prevent UI hang on weak campus networks
    async checkout(userId, paymentMethod = 'Cash on Delivery', deliveryAddress = '', extraData = {}) {
        const savedPhone = extraData.phone || localStorage.getItem('lpuquick_phone') || '';
        const savedName = extraData.name || window.CURRENT_USER_NAME || (JSON.parse(localStorage.getItem('lpuquick_user') || '{}').name) || 'LPU Student';
        const savedEmail = extraData.email || window.CURRENT_USER_EMAIL || (JSON.parse(localStorage.getItem('lpuquick_user') || '{}').email) || '';
        const guestUserId = extraData.guestUserId || localStorage.getItem('lpuquick_guest_cart_id') || '';
        const items = extraData.items || (window.cartState && window.cartState.items) || [];

        // Stable client-generated orderId for 100% idempotent retries across flaky campus networks
        const orderId = extraData.orderId || window.__currentCheckoutOrderId || (`order_${Math.random().toString(36).slice(2, 10)}`);
        window.__currentCheckoutOrderId = orderId;

        // Resilient 2-attempt fetch execution for flaky campus cellular networks
        for (let attempt = 1; attempt <= 2; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second per attempt

            try {
                const res = await fetch(`${API_BASE}/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        orderId,
                        order_id: orderId,
                        userId,
                        guestUserId,
                        paymentMethod,
                        deliveryAddress,
                        customerPhone: savedPhone,
                        customerName: savedName,
                        customerEmail: savedEmail,
                        items
                    })
                });
                clearTimeout(timeoutId);
                cartMemoryCache = null;
                ordersMemoryCache = null;
                activeOrderMemoryCache = null;

                const text = await res.text();
                try {
                    const parsed = JSON.parse(text);
                    if (parsed && (parsed.success || parsed.order)) {
                        window.__currentCheckoutOrderId = null;
                    }
                    return parsed;
                } catch (parseErr) {
                    if (attempt < 2) continue;
                    return { 
                        error: 'SERVER_RESPONSE_ERROR', 
                        message: res.status >= 500 ? 'Server is busy. Please tap retry.' : 'Unexpected server response. Please retry.' 
                    };
                }
            } catch (fetchErr) {
                clearTimeout(timeoutId);
                if (attempt < 2 && fetchErr.name !== 'AbortError') {
                    await new Promise(r => setTimeout(r, 400));
                    continue;
                }
                if (fetchErr.name === 'AbortError') {
                    return { error: 'NETWORK_TIMEOUT', message: 'Connection timed out. Please tap retry to place order.' };
                }
                if (attempt >= 2) throw fetchErr;
            }
        }
    },
    async paymentCallback(orderId, status) {
        const res = await fetch(`${API_BASE}/checkout/payment-callback`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status })
        });
        return res.json();
    },

    // Orders (Instant 0ms SWR Memory Cache with Timeout Fallback)
    async getOrders(userId) {
        if (ordersMemoryCache && (Date.now() - ordersMemoryCacheTime < 8000)) {
            return ordersMemoryCache;
        }
        try {
            const res = await fetchWithTimeout(`${API_BASE}/orders/${userId}`, {}, 4000);
            const data = await res.json();
            ordersMemoryCache = data;
            ordersMemoryCacheTime = Date.now();
            return data;
        } catch (err) {
            if (ordersMemoryCache) return ordersMemoryCache;
            return [];
        }
    },
    async getActiveOrder(userId) {
        if (activeOrderMemoryCache && (Date.now() - activeOrderMemoryCacheTime < 8000)) {
            return activeOrderMemoryCache;
        }
        try {
            const res = await fetchWithTimeout(`${API_BASE}/orders/${userId}/active`, {}, 4000);
            const data = await res.json();
            activeOrderMemoryCache = data;
            activeOrderMemoryCacheTime = Date.now();
            return data;
        } catch (err) {
            if (activeOrderMemoryCache) return activeOrderMemoryCache;
            return { activeOrder: null };
        }
    },
    async getOrderDetail(orderId) {
        try {
            const res = await fetchWithTimeout(`${API_BASE}/orders/detail/${orderId}`, {}, 4000);
            return await res.json();
        } catch (err) {
            return { error: 'TIMEOUT_OR_NETWORK_ERROR' };
        }
    },
    async reorder(orderId, userId = (window.isUserLoggedIn() ? window.CURRENT_USER_ID : window.getEffectiveUserId())) {
        const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        }, 5000);
        const result = await res.json();
        if (result && result.cart) {
            updateLocalCartState(result.cart);
        }
        return result;
    },

    async cancelOrder(orderId, reason = '') {
        const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        }, 5000);
        return res.json();
    },
    async changeOrderAddress(orderId, newAddress) {
        const res = await fetchWithTimeout(`${API_BASE}/orders/${orderId}/change-address`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newAddress })
        }, 5000);
        return res.json();
    },

    // Categories with SWR Memory Caching & Offline Storage
    async getCategories() {
        const now = Date.now();
        if (categoriesCache && (now - categoriesCacheTime < 45000)) {
            return categoriesCache;
        }
        if (categoriesCache) {
            fetchWithTimeout(`${API_BASE}/categories`, {}, 3000)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        categoriesCache = data;
                        categoriesCacheTime = Date.now();
                        writeStorageJson(STORAGE_KEYS.CATEGORIES, data);
                    }
                })
                .catch(() => {});
            return categoriesCache;
        }

        try {
            const res = await fetchWithTimeout(`${API_BASE}/categories`, {}, 3000);
            const data = await res.json();
            if (Array.isArray(data)) {
                categoriesCache = data;
                categoriesCacheTime = Date.now();
                writeStorageJson(STORAGE_KEYS.CATEGORIES, data);
                return data;
            }
        } catch (e) {
            console.warn('[Categories Network Fallback]', e.message);
        }

        const stored = readStorageJson(STORAGE_KEYS.CATEGORIES);
        if (stored) {
            categoriesCache = stored;
            return stored;
        }
        return [];
    },
    async getCategoryProducts(name) {
        try {
            const res = await fetchWithTimeout(`${API_BASE}/categories/${encodeURIComponent(name)}`, {}, 3500);
            return await res.json();
        } catch (e) {
            if (window.__cachedProducts && window.__cachedProducts.size > 0) {
                const list = Array.from(window.__cachedProducts.values())
                    .filter(p => (p.category || '').toLowerCase() === (name || '').toLowerCase());
                return { products: list, category: name };
            }
            return { products: [], category: name };
        }
    },

    // Store Availability Status
    async getClientStatus() {
        try {
            const res = await fetchWithTimeout(`${API_BASE}/client/status?_t=${Date.now()}`, {}, 2500);
            return await res.json();
        } catch (e) {
            return { is_locked: false, lock_status: 'AVAILABLE' };
        }
    },

    // User Blacklist & Account Block Check
    async checkUserStatus(userId) {
        if (!userId) return { isBlocked: false };
        try {
            const res = await fetchWithTimeout(`${API_BASE}/auth/check-status/${userId}?_t=${Date.now()}`, {}, 2500);
            return await res.json();
        } catch (e) {
            return { isBlocked: false };
        }
    },

    // User Address
    async updateAddress(userId, hostel, block, room, phone) {
        try {
            const res = await fetch(`${API_BASE}/auth/update-address`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hostel, block, room, phone })
            });
            return await res.json();
        } catch (e) {
            console.warn('[Address Update Warning]:', e.message);
            return { success: false };
        }
    },

    // Authentication & Verification Endpoints
    async googleAuth(userData) {
        try {
            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (err) {
            console.error('[API googleAuth Error]:', err);
            return { error: err.message };
        }
    },

    async signIn(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        } catch (err) {
            console.error('[API signIn Error]:', err);
            return { error: err.message };
        }
    },

    async sendOtp(phone, userId) {
        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, userId })
            });
            return await res.json();
        } catch (err) {
            return { error: err.message };
        }
    },

    async verifyOtp(phone, otp, userId) {
        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, userId })
            });
            return await res.json();
        } catch (err) {
            return { error: err.message };
        }
    },

    async getUserProfile(userId) {
        try {
            const res = await fetchWithTimeout(`${API_BASE}/auth/profile/${userId}`, {}, 3000);
            return await res.json();
        } catch (err) {
            return null;
        }
    },

    // Soft Background Revalidation Engine (Parallel, Non-Blocking, 0ms Screen Freeze)
    async revalidateAll() {
        homeFeedCacheTime = 0;
        categoriesCacheTime = 0;
        productsMemoryCacheTime.clear();
        cartMemoryCacheTime = 0;
        const uid = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID;
        const tasks = [
            this.fetchHome(uid).catch(() => null),
            this.getCategories().catch(() => null),
            this.getProducts().catch(() => null)
        ];
        if (uid) {
            tasks.push(this.getCart(uid).catch(() => null));
        }
        await Promise.allSettled(tasks);
        if (typeof window.updateGlobalCartBadges === 'function') {
            window.updateGlobalCartBadges();
        }
        return true;
    },

    clearCartCache() {
        cartMemoryCacheTime = 0;
    }
};

window.cartState = window.cartState || {};
window.api = api;

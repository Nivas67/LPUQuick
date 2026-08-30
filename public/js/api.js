// LPUQuick High-Speed API Client with Intelligent Request Caching
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? `${window.location.origin}/api` : '/api';

const searchCache = new Map();
let categoriesCache = null;
let categoriesCacheTime = 0;
let homeFeedCache = null;
let homeFeedCacheTime = 0;
let homeFeedCacheUserId = null;

window.__cachedProducts = window.__cachedProducts || new Map();

function indexProducts(items) {
    if (!Array.isArray(items)) return;
    items.forEach(p => {
        if (p && p.id) {
            window.__cachedProducts.set(p.id, p);
        }
    });
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
                nextState[i.product_id] = {
                    cart_id: i.cart_id,
                    quantity: isPending ? isPending.targetQty : i.quantity
                };
            }
        });
        window.cartState = nextState;
    }
}

// Atomic Optimistic Cart State & Fast-Tap Debounced Syncer (< 1ms UI response, 100% accurate count)
window.setOptimisticCartQuantity = function(productId, targetQty, maxStock = 50, onSynced = null) {
    if (!productId) return;
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
    
    if (typeof window.updateSingleProductSlot === 'function') {
        window.updateSingleProductSlot(productId);
    }

    // 3. Clear existing debounce timer for this product
    if (window.__cartSyncDebounceTimers[productId]) {
        clearTimeout(window.__cartSyncDebounceTimers[productId]);
    }

    // 4. Debounce network dispatch by 250ms (batches rapid multi-taps into a single accurate request)
    window.__cartSyncDebounceTimers[productId] = setTimeout(async () => {
        delete window.__cartSyncDebounceTimers[productId];
        const syncInfo = window.__pendingCartSync[productId];
        if (!syncInfo) return;

        const finalQty = syncInfo.targetQty;
        const knownCartId = syncInfo.cartId || window.cartState[productId]?.cart_id;
        delete window.__pendingCartSync[productId];

        try {
            if (finalQty <= 0) {
                if (knownCartId && !knownCartId.startsWith('temp_')) {
                    await window.api.removeCartItem(knownCartId);
                }
            } else if (!knownCartId || knownCartId.startsWith('temp_')) {
                const res = await window.api.addToCart(uid, productId, finalQty);
                if (res && res.cart_id && window.cartState[productId]) {
                    window.cartState[productId].cart_id = res.cart_id;
                }
            } else {
                await window.api.updateCartItem(knownCartId, finalQty, uid);
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
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(err.message || 'Cart sync error', 'warning', 'inventory_2');
            }
            if (typeof onSynced === 'function') onSynced(syncInfo.confirmedQty);
        }
    }, 250);
};

let cartMemoryCache = null;
let cartMemoryCacheTime = 0;
let ordersMemoryCache = null;
let ordersMemoryCacheTime = 0;
let activeOrderMemoryCache = null;
let activeOrderMemoryCacheTime = 0;

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

    // Home with Intelligent SWR Memory Cache (0ms instant page loads)
    async fetchHome(userId = null) {
        const uid = userId || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID) || '';
        const tz = new Date().getTimezoneOffset();
        const url = uid ? `${API_BASE}/home?tz=${tz}&userId=${encodeURIComponent(uid)}` : `${API_BASE}/home?tz=${tz}`;

        // Return cached home feed in 0ms if recent (< 15s)
        if (homeFeedCache && homeFeedCacheUserId === uid && (Date.now() - homeFeedCacheTime < 15000)) {
            return homeFeedCache;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        // Index all loaded products for instant modal & search lookups
        if (data) {
            indexProducts(data.deals);
            indexProducts(data.bestSellers);
            indexProducts(data.recommended);
            indexProducts(data.quickBreakfast);
            indexProducts(data.midnightSnacks);
            indexProducts(data.studyEssentials);
            indexProducts(data.dormBeverages);
            indexProducts(data.buy_again);
            homeFeedCache = data;
            homeFeedCacheTime = Date.now();
            homeFeedCacheUserId = uid;
        }
        return data;
    },

    // Search with 0ms In-Memory Fast-Path + 60s Query Cache
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

        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
            indexProducts(data.results);
        }
        searchCache.set(q, { time: Date.now(), data });
        if (searchCache.size > 50) {
            searchCache.delete(searchCache.keys().next().value);
        }
        return data;
    },

    // Products List
    async getProducts(category = null) {
        const url = category ? `${API_BASE}/products?category=${encodeURIComponent(category)}` : `${API_BASE}/products`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && Array.isArray(data.products)) {
            indexProducts(data.products);
        }
        return data;
    },
    async fetchProducts(category = null) {
        return this.getProducts(category);
    },

    // Single Product Details (0ms in-memory fast path)
    async getProduct(id) {
        if (window.__cachedProducts && window.__cachedProducts.has(id)) {
            const cached = window.__cachedProducts.get(id);
            return { product: cached, ...cached };
        }
        try {
            const res = await fetch(`${API_BASE}/products/${id}`);
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

    // Cart (Instant 0ms SWR Memory Cache)
    async getCart(userId) {
        if (cartMemoryCache && Array.isArray(cartMemoryCache.items) && (Date.now() - cartMemoryCacheTime < 8000)) {
            return cartMemoryCache;
        }
        try {
            const res = await fetch(`${API_BASE}/cart/${userId}`);
            if (!res.ok) {
                if (cartMemoryCache && Array.isArray(cartMemoryCache.items)) return cartMemoryCache;
                return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
            }
            const data = await res.json();
            if (data && Array.isArray(data.items)) {
                cartMemoryCache = data;
                cartMemoryCacheTime = Date.now();
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
            console.error('[getCart Error]', err);
            if (cartMemoryCache && Array.isArray(cartMemoryCache.items)) return cartMemoryCache;
            return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
        }
    },
    async addToCart(userId, productId, quantity = 1) {
        const res = await fetch(`${API_BASE}/cart`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity })
        });
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to add item to cart');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            updateLocalCartState(result);
        }
        return result;
    },
    async updateCartItem(cartId, quantity, userId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, userId })
        });
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to update item quantity');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            updateLocalCartState(result);
        }
        return result;
    },
    async removeCartItem(cartId) {
        const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID;
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const result = await res.json();
        if (!res.ok || result.error) {
            throw new Error(result.error || 'Failed to remove item from cart');
        }
        if (result && Array.isArray(result.items)) {
            cartMemoryCache = result;
            cartMemoryCacheTime = Date.now();
            updateLocalCartState(result);
        }
        return result;
    },
    async mergeCart(guestUserId, targetUserId) {
        if (!guestUserId || !targetUserId || guestUserId === targetUserId) return;
        try {
            const res = await fetch(`${API_BASE}/cart/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestUserId, targetUserId })
            });
            const result = await res.json();
            if (result && Array.isArray(result.items)) {
                cartMemoryCache = result;
                cartMemoryCacheTime = Date.now();
                updateLocalCartState(result);
            }
            return result;
        } catch (e) {
            console.error('[Merge Cart Error]', e);
        }
    },

    // Checkout
    async checkout(userId, paymentMethod = 'Cash on Delivery', deliveryAddress = '') {
        const res = await fetch(`${API_BASE}/checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, paymentMethod, deliveryAddress })
        });
        cartMemoryCache = null;
        ordersMemoryCache = null;
        activeOrderMemoryCache = null;
        return res.json();
    },
    async paymentCallback(orderId, status) {
        const res = await fetch(`${API_BASE}/checkout/payment-callback`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status })
        });
        return res.json();
    },

    // Orders (Instant 0ms SWR Memory Cache)
    async getOrders(userId) {
        if (ordersMemoryCache && (Date.now() - ordersMemoryCacheTime < 8000)) {
            return ordersMemoryCache;
        }
        const res = await fetch(`${API_BASE}/orders/${userId}`);
        const data = await res.json();
        ordersMemoryCache = data;
        ordersMemoryCacheTime = Date.now();
        return data;
    },
    async getActiveOrder(userId) {
        if (activeOrderMemoryCache && (Date.now() - activeOrderMemoryCacheTime < 8000)) {
            return activeOrderMemoryCache;
        }
        const res = await fetch(`${API_BASE}/orders/${userId}/active`);
        const data = await res.json();
        activeOrderMemoryCache = data;
        activeOrderMemoryCacheTime = Date.now();
        return data;
    },
    async getOrderDetail(orderId) {
        const res = await fetch(`${API_BASE}/orders/detail/${orderId}`);
        return res.json();
    },
    async reorder(orderId, userId = (window.isUserLoggedIn() ? window.CURRENT_USER_ID : window.getEffectiveUserId())) {
        const res = await fetch(`${API_BASE}/orders/${orderId}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const result = await res.json();
        if (result && result.cart) {
            updateLocalCartState(result.cart);
        }
        return result;
    },

    async cancelOrder(orderId, reason = '') {
        const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        return res.json();
    },
    async changeOrderAddress(orderId, newAddress) {
        const res = await fetch(`${API_BASE}/orders/${orderId}/change-address`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newAddress })
        });
        return res.json();
    },

    // Categories with 60s memory caching
    async getCategories() {
        if (categoriesCache && (Date.now() - categoriesCacheTime < 60000)) {
            return categoriesCache;
        }
        const res = await fetch(`${API_BASE}/categories`);
        categoriesCache = await res.json();
        categoriesCacheTime = Date.now();
        return categoriesCache;
    },
    async getCategoryProducts(name) {
        const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`);
        return res.json();
    },

    // Store Availability Status
    async getClientStatus() {
        try {
            const res = await fetch(`${API_BASE}/client/status?_t=${Date.now()}`);
            return await res.json();
        } catch (e) {
            return { is_locked: false, lock_status: 'AVAILABLE' };
        }
    },

    // User Blacklist & Account Block Check
    async checkUserStatus(userId) {
        if (!userId) return { isBlocked: false };
        try {
            const res = await fetch(`${API_BASE}/auth/check-status/${userId}?_t=${Date.now()}`);
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
    }
};

window.cartState = window.cartState || {};
window.api = api;

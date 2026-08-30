// LPUQuick High-Speed API Client with Intelligent Request Caching
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? `${window.location.origin}/api` : '/api';

const searchCache = new Map();
let categoriesCache = null;
let categoriesCacheTime = 0;

function updateLocalCartState(cartData) {
    window.cartState = window.cartState || {};
    if (cartData && Array.isArray(cartData.items)) {
        const nextState = {};
        cartData.items.forEach(i => {
            if (i.product_id) {
                nextState[i.product_id] = {
                    cart_id: i.cart_id,
                    quantity: i.quantity
                };
            }
        });
        window.cartState = nextState;
    }
}

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

    // Home
    async fetchHome(userId = null) {
        const uid = userId || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID) || '';
        const tz = new Date().getTimezoneOffset();
        const url = uid ? `${API_BASE}/home?tz=${tz}&userId=${encodeURIComponent(uid)}` : `${API_BASE}/home?tz=${tz}`;
        const res = await fetch(url);
        return res.json();
    },

    // Search with client-side 60s memory caching
    async searchProducts(query) {
        const q = (query || '').trim().toLowerCase();
        if (!q) return { results: [], suggestions: [] };
        
        const cached = searchCache.get(q);
        if (cached && (Date.now() - cached.time < 60000)) {
            return cached.data;
        }

        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
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
        return res.json();
    },
    async fetchProducts(category = null) {
        return this.getProducts(category);
    },

    // Single Product Details
    async getProduct(id) {
        const res = await fetch(`${API_BASE}/products/${id}`);
        return res.json();
    },

    // Flow Assist
    async flowAssist(query) {
        const res = await fetch(`${API_BASE}/flow-assist`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        return res.json();
    },

    // Cart (Single Roundtrip with Direct State Sync)
    async getCart(userId) {
        const res = await fetch(`${API_BASE}/cart/${userId}`);
        const data = await res.json();
        updateLocalCartState(data);
        return data;
    },
    async addToCart(userId, productId, quantity = 1) {
        const res = await fetch(`${API_BASE}/cart`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity })
        });
        const result = await res.json();
        updateLocalCartState(result);
        return result;
    },
    async updateCartItem(cartId, quantity, userId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, userId })
        });
        const result = await res.json();
        updateLocalCartState(result);
        return result;
    },
    async removeCartItem(cartId) {
        const userId = window.getEffectiveUserId();
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const result = await res.json();
        updateLocalCartState(result);
        return result;
    },

    // Checkout
    async checkout(userId, paymentMethod = 'Cash on Delivery', deliveryAddress = '') {
        const res = await fetch(`${API_BASE}/checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, paymentMethod, deliveryAddress })
        });
        return res.json();
    },
    async paymentCallback(orderId, status) {
        const res = await fetch(`${API_BASE}/checkout/payment-callback`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status })
        });
        return res.json();
    },

    // Orders
    async getOrders(userId) {
        const res = await fetch(`${API_BASE}/orders/${userId}`);
        return res.json();
    },
    async getActiveOrder(userId) {
        const res = await fetch(`${API_BASE}/orders/${userId}/active`);
        return res.json();
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

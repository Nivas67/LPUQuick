// LPUQuick API Client
const API_BASE = '/api';

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

    // Home
    async fetchHome() {
        const tz = new Date().getTimezoneOffset();
        const res = await fetch(`${API_BASE}/home?tz=${tz}`);
        return res.json();
    },

    // Search
    async searchProducts(query) {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
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

    // Cart
    async getCart(userId) {
        const res = await fetch(`${API_BASE}/cart/${userId}`);
        return res.json();
    },
    async addToCart(userId, productId, quantity = 1) {
        const res = await fetch(`${API_BASE}/cart`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity })
        });
        return res.json();
    },
    async updateCartItem(cartId, quantity, userId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, userId })
        });
        return res.json();
    },
    async removeCartItem(cartId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, { method: 'DELETE' });
        return res.json();
    },

    // Checkout
    async checkout(userId, paymentMethod = 'upi') {
        const res = await fetch(`${API_BASE}/checkout`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, paymentMethod })
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

    // Categories
    async getCategories() {
        const res = await fetch(`${API_BASE}/categories`);
        return res.json();
    },
    async getCategoryProducts(name) {
        const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`);
        return res.json();
    }
};

window.api = api;

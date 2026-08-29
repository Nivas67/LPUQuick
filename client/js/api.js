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
    async googleAuth(payload = {}) {
        const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

    // Cart
    async getCart(userId) {
        const res = await fetch(`${API_BASE}/cart/${userId}`);
        const data = await res.json();
        // Update global cart state for instant card steppers
        window.cartState = {};
        if (data && data.items) {
            data.items.forEach(i => {
                window.cartState[i.product_id] = {
                    cart_id: i.cart_id,
                    quantity: i.quantity
                };
            });
        }
        return data;
    },
    async addToCart(userId, productId, quantity = 1) {
        const res = await fetch(`${API_BASE}/cart`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId, quantity })
        });
        const result = await res.json();
        await this.getCart(userId); // Refresh cart state
        return result;
    },
    async updateCartItem(cartId, quantity, userId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity, userId })
        });
        const result = await res.json();
        await this.getCart(userId); // Refresh cart state
        return result;
    },
    async removeCartItem(cartId) {
        const res = await fetch(`${API_BASE}/cart/${cartId}`, { method: 'DELETE' });
        const result = await res.json();
        const userId = window.CURRENT_USER_ID || 'user_001';
        await this.getCart(userId); // Refresh cart state
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
    async reorder(orderId, userId = window.CURRENT_USER_ID || 'user_001') {
        const res = await fetch(`${API_BASE}/orders/${orderId}/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const result = await res.json();
        await this.getCart(userId);
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

    // Categories
    async getCategories() {
        const res = await fetch(`${API_BASE}/categories`);
        return res.json();
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

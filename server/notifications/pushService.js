const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const { isRiderOnline } = require('../services/riderAvailability');

// Directory paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const DATA_DIR = path.join(__dirname, '..', 'data');
const VAPID_FILE = path.join(CONFIG_DIR, 'vapid.json');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Ensure directories exist safely without throwing on read-only serverless filesystems
try {
    if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
} catch (e) {}
try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

// Stable fallback VAPID keys for zero-config and read-only serverless environments
const DEFAULT_VAPID_KEYS = {
    publicKey: 'BIbDYL9eYQn5V-yONZGWuMURDwAvuG8liBT7SNmQxeVHA62Qo4I2LgGSZdYRrVfW5UGAeGAjoZE5ThGTXdITl0E',
    privateKey: '4aBeU8au19rwlm_aTMDoNQieTg6fLFHR1OYI6QpIdss'
};

// Load or generate stable VAPID keys
let vapidKeys = DEFAULT_VAPID_KEYS;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
    };
} else {
    try {
        if (fs.existsSync(VAPID_FILE)) {
            vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
        } else {
            vapidKeys = DEFAULT_VAPID_KEYS;
            try {
                fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
            } catch (wErr) {}
        }
    } catch (e) {
        vapidKeys = DEFAULT_VAPID_KEYS;
    }
}

// Configure web-push with VAPID details
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@lpu.in';
try {
    webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);
} catch (vErr) {
    console.warn('[Push Service] VAPID configuration note:', vErr.message);
}

// In-memory subscription cache synced to disk
let subscriptions = [];
try {
    if (fs.existsSync(SUBS_FILE)) {
        subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
    }
} catch (e) {
    subscriptions = [];
}

function persistSubscriptions() {
    try {
        fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2));
    } catch (e) {
        try {
            const tmpFile = path.join(require('os').tmpdir(), 'push_subscriptions.json');
            fs.writeFileSync(tmpFile, JSON.stringify(subscriptions, null, 2));
        } catch (tmpErr) {}
    }
}

class PushNotificationService {
    getPublicKey() {
        return vapidKeys.publicKey;
    }

    saveSubscription(subscription, adminInfo = {}) {
        if (!subscription || !subscription.endpoint) return false;

        const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
        const assignedHostels = Array.isArray(adminInfo.assigned_hostels) && adminInfo.assigned_hostels.length > 0
            ? adminInfo.assigned_hostels
            : (adminInfo.hostelId ? [adminInfo.hostelId] : []);

        const entry = {
            endpoint: subscription.endpoint,
            keys: subscription.keys || {},
            adminId: adminInfo.adminId || null,
            adminName: adminInfo.adminName || 'Admin',
            hostelId: adminInfo.hostelId ? String(adminInfo.hostelId).toUpperCase().trim() : null,
            assigned_hostels: assignedHostels,
            is_owner: Boolean(adminInfo.is_owner),
            roles: Array.isArray(adminInfo.roles) ? adminInfo.roles : ['delivery_person'],
            userType: adminInfo.userType || 'admin',
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            subscriptions[existingIndex] = {
                ...subscriptions[existingIndex],
                ...entry
            };
        } else {
            entry.createdAt = new Date().toISOString();
            subscriptions.push(entry);
        }

        persistSubscriptions();
        console.log(`[Push Service] Subscription registered for admin: ${entry.adminName} (${entry.adminId}) | Total subs: ${subscriptions.length}`);
        return true;
    }

    saveCustomerSubscription(subscription, customerInfo = {}) {
        if (!subscription || !subscription.endpoint) return false;

        const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
        const entry = {
            endpoint: subscription.endpoint,
            keys: subscription.keys || {},
            userId: customerInfo.userId || null,
            userName: customerInfo.userName || 'Student',
            hostelId: customerInfo.hostelId ? String(customerInfo.hostelId).toUpperCase().trim() : 'BH-13',
            userType: 'customer',
            roles: ['customer'],
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            subscriptions[existingIndex] = {
                ...subscriptions[existingIndex],
                ...entry
            };
        } else {
            entry.createdAt = new Date().toISOString();
            subscriptions.push(entry);
        }

        persistSubscriptions();
        console.log(`[Push Service] Customer subscription registered: ${entry.userName} (${entry.hostelId}) | Total subs: ${subscriptions.length}`);
        return true;
    }

    getSubscriptions() {
        return [...subscriptions];
    }

    async broadcastToAudience({ targetHostel = 'all', payload }) {
        const cleanTarget = (targetHostel || 'all').toUpperCase().replace(/[\s-]/g, '');
        const targets = subscriptions.filter(s => {
            if (cleanTarget === 'ALL') return true;
            if (s.hostelId) {
                const subHostel = String(s.hostelId).toUpperCase().replace(/[\s-]/g, '');
                if (subHostel === cleanTarget) return true;
            }
            if (s.roles && (s.roles.includes('owner') || s.roles.includes('store_manager'))) {
                return true;
            }
            return false;
        });

        if (targets.length === 0) return { delivered: 0, failed: 0, total: 0 };

        let delivered = 0;
        let failed = 0;

        await Promise.all(targets.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
            else failed++;
        }));

        return { delivered, failed, total: targets.length };
    }

    removeSubscription(endpoint) {
        const initialCount = subscriptions.length;
        subscriptions = subscriptions.filter(s => s.endpoint !== endpoint);
        if (subscriptions.length !== initialCount) {
            persistSubscriptions();
            console.log(`[Push Service] Removed stale push subscription. Remaining: ${subscriptions.length}`);
        }
    }

    async sendPush(subEntry, payload) {
        try {
            const pushSubscription = {
                endpoint: subEntry.endpoint,
                keys: subEntry.keys
            };
            const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
            await webpush.sendNotification(pushSubscription, payloadString);
            return true;
        } catch (err) {
            // If subscription has expired or unsubscribed on client, remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`[Push Service] Subscription expired (HTTP ${err.statusCode}). Cleaning up: ${subEntry.endpoint.slice(-20)}`);
                this.removeSubscription(subEntry.endpoint);
            } else {
                console.warn('[Push Service] Push delivery warning:', err.statusCode || err.message);
            }
            return false;
        }
    }

    async sendToAdmin(adminId, payload) {
        const targets = subscriptions.filter(s => s.adminId === adminId);
        if (targets.length === 0) return { delivered: 0, total: 0 };

        let delivered = 0;
        await Promise.all(targets.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
        }));
        return { delivered, total: targets.length };
    }

    async sendToRoles(roles, payload) {
        const targetRoles = Array.isArray(roles) ? roles : [roles];
        const isNewOrder = payload?.data?.action === 'new_order';
        const targets = subscriptions.filter(s => {
            if (!s.roles || !Array.isArray(s.roles)) return false;
            // If this is a new delivery order, skip delivery runners who are OFFLINE
            if (isNewOrder && s.adminId && !isRiderOnline(s.adminId)) {
                const isOnlyRider = s.roles.includes('delivery_person') && !s.roles.includes('owner') && !s.roles.includes('store_manager');
                if (isOnlyRider) return false;
            }
            return targetRoles.some(r => s.roles.includes(r) || s.roles.includes('owner'));
        });

        if (targets.length === 0) return { delivered: 0, total: 0 };

        let delivered = 0;
        await Promise.all(targets.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
        }));
        return { delivered, total: targets.length };
    }

    async broadcastAll(payload) {
        if (subscriptions.length === 0) return { delivered: 0, total: 0 };

        let delivered = 0;
        await Promise.all(subscriptions.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
        }));
        return { delivered, total: subscriptions.length };
    }

    // High-level operational triggers:

    async notifyNewOrder(order) {
        if (!order || !order.id) return { delivered: 0, total: 0 };
        const orderShortId = (order.id || '').replace('order_', '').slice(0, 8).toUpperCase();
        const rawHostel = order.hostel_id || (order.delivery_address && (order.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || order.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i))?.[0]) || 'BH-13';
        const normHostel = String(rawHostel).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const displayHostel = rawHostel.toUpperCase().trim();

        const roomStr = order.room ? `Room ${order.room}` : ((order.delivery_address && order.delivery_address.match(/Room\s*([A-Za-z0-9\-]+)/i)?.[0]) || '');
        const custStr = order.customer_name || 'Customer';
        let itemsStr = '';
        if (Array.isArray(order.items) && order.items.length > 0) {
            itemsStr = order.items.map(i => `${i.name || i.product_name || 'Item'} × ${i.quantity || 1}`).join(', ');
        } else if (order.item_summary) {
            itemsStr = order.item_summary;
        }

        const payload = {
            title: `🛍️ New Order #${orderShortId} • ${displayHostel}`,
            body: `₹${order.total || 0} • ${custStr}${roomStr ? ' • ' + roomStr : ''}${itemsStr ? '\n' + itemsStr : ''}`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `order-new-${order.id}`,
            requireInteraction: true,
            renotify: true,
            vibrate: [300, 100, 300, 100, 400],
            data: {
                url: `/ad-new/#orders?orderId=${encodeURIComponent(order.id)}`,
                orderId: order.id,
                hostel: displayHostel,
                action: 'new_order'
            },
            actions: [
                { action: 'view', title: '👀 View Order' }
            ]
        };

        // Filter push recipients: strictly respect dark store hostel assignments for all admin roles
        const targetRoles = ['delivery_person', 'store_manager', 'owner', 'admin', 'inventory_manager', 'food_department', 'cook'];
        const targets = subscriptions.filter(s => {
            if (s.userType !== 'admin') return false;
            if (!s.roles || !Array.isArray(s.roles)) return false;
            const hasRole = targetRoles.some(r => s.roles.includes(r) || s.roles.includes('owner'));
            if (!hasRole) return false;

            // Platform Owner / Super Admin receives push for ALL hostels
            if (s.is_owner || s.roles.includes('owner')) return true;

            // Store Managers / Delivery Partners only receive push for their assigned hostels
            const myHostels = Array.isArray(s.assigned_hostels) && s.assigned_hostels.length > 0
                ? s.assigned_hostels
                : (s.hostelId ? [s.hostelId] : []);
            if (myHostels.length === 0) return false;

            const myHostelsNorm = myHostels.map(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, ''));
            return myHostelsNorm.includes(normHostel) || myHostelsNorm.includes('ALL');
        });

        if (targets.length === 0) return { delivered: 0, total: 0 };

        let delivered = 0;
        await Promise.all(targets.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
        }));
        return { delivered, total: targets.length };
    }

    async notifyOrderClaimed(orderId, adminName, excludeAdminId = null) {
        const orderShortId = (orderId || '').replace('order_', '').slice(0, 8).toUpperCase();
        const payload = {
            title: `✅ Order #${orderShortId} Accepted`,
            body: `${adminName} has accepted delivery of this order.`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `order-claimed-${orderId}`,
            data: {
                url: '/admin#orders',
                orderId: orderId,
                action: 'order_claimed'
            }
        };

        const targets = subscriptions.filter(s => s.adminId !== excludeAdminId);
        let delivered = 0;
        await Promise.all(targets.map(async sub => {
            const ok = await this.sendPush(sub, payload);
            if (ok) delivered++;
        }));
        return { delivered, total: targets.length };
    }

    async notifyTransferRequest(transfer) {
        if (!isRiderOnline(transfer.toId)) {
            console.log(`[Push] Suppressed transfer alert: Recipient ${transfer.toId} is OFFLINE.`);
            return { delivered: 0, total: 0 };
        }

        const orderShortId = (transfer.orderId || '').replace('order_', '').slice(0, 8).toUpperCase();
        const payload = {
            title: `🔄 Order Transfer Request!`,
            body: `${transfer.fromName} wants to transfer Order #${orderShortId} to you. Reason: ${transfer.reason || 'Assistance requested'}`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `order-transfer-${transfer.orderId}`,
            data: {
                url: '/admin#orders',
                orderId: transfer.orderId,
                action: 'transfer_request',
                transfer
            },
            actions: [
                { action: 'accept_transfer', title: '✅ Accept Transfer' },
                { action: 'decline_transfer', title: '❌ Decline' }
            ]
        };

        return this.sendToAdmin(transfer.toId, payload);
    }

    async notifyTransferResolved(orderId, resolvedByName, accepted, originalSenderId) {
        const orderShortId = (orderId || '').replace('order_', '').slice(0, 8).toUpperCase();
        const payload = {
            title: accepted ? `✅ Transfer Accepted!` : `❌ Transfer Declined`,
            body: accepted 
                ? `${resolvedByName} accepted Order #${orderShortId}. They are now delivering.`
                : `${resolvedByName} declined the transfer for Order #${orderShortId}.`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `transfer-resolved-${orderId}`,
            data: {
                url: '/admin#orders',
                orderId: orderId,
                action: 'transfer_resolved'
            }
        };

        return this.sendToAdmin(originalSenderId, payload);
    }
}

module.exports = new PushNotificationService();

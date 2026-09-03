const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

// Directory paths
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const DATA_DIR = path.join(__dirname, '..', 'data');
const VAPID_FILE = path.join(CONFIG_DIR, 'vapid.json');
const SUBS_FILE = path.join(DATA_DIR, 'push_subscriptions.json');

// Ensure directories exist
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Load or generate stable VAPID keys
let vapidKeys;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY
    };
} else if (fs.existsSync(VAPID_FILE)) {
    try {
        vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
    } catch (e) {
        vapidKeys = webpush.generateVAPIDKeys();
        fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
    }
} else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
}

// Configure web-push with VAPID details
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@lpu.in';
webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

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
        console.warn('[Push Service] Could not write subscriptions file:', e.message);
    }
}

class PushNotificationService {
    getPublicKey() {
        return vapidKeys.publicKey;
    }

    saveSubscription(subscription, adminInfo = {}) {
        if (!subscription || !subscription.endpoint) return false;

        const existingIndex = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
        const entry = {
            endpoint: subscription.endpoint,
            keys: subscription.keys || {},
            adminId: adminInfo.adminId || null,
            adminName: adminInfo.adminName || 'Admin',
            roles: Array.isArray(adminInfo.roles) ? adminInfo.roles : ['delivery_person'],
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
        const targets = subscriptions.filter(s => {
            if (!s.roles || !Array.isArray(s.roles)) return false;
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
        const orderShortId = (order.id || '').replace('order_', '').slice(0, 8).toUpperCase();
        const payload = {
            title: `🛵 New Order #${orderShortId} Placed!`,
            body: `₹${order.total || 0} • ${order.delivery_address || 'Campus Hostels'} • Tap to accept delivery!`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            tag: `order-new-${order.id}`,
            data: {
                url: '/admin#orders',
                orderId: order.id,
                action: 'new_order'
            },
            actions: [
                { action: 'claim', title: '⚡ Accept Delivery' },
                { action: 'view', title: 'View Order' }
            ]
        };

        // Send to all delivery runners, store managers, and owner
        return this.sendToRoles(['delivery_person', 'store_manager', 'owner'], payload);
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

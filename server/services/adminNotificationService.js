const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const NOTIFS_FILE = path.join(DATA_DIR, 'admin_order_notifications.json');

// Ensure data directory exists
try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

let memoryNotifs = [];
let lastMtime = 0;

function loadNotifications() {
    try {
        if (fs.existsSync(NOTIFS_FILE)) {
            const stat = fs.statSync(NOTIFS_FILE);
            if (stat.mtimeMs !== lastMtime) {
                const raw = fs.readFileSync(NOTIFS_FILE, 'utf8');
                memoryNotifs = JSON.parse(raw);
                if (!Array.isArray(memoryNotifs)) memoryNotifs = [];
                lastMtime = stat.mtimeMs;
            }
        } else {
            memoryNotifs = [];
        }
    } catch (e) {
        memoryNotifs = [];
    }
}
loadNotifications();

function persistNotifications() {
    try {
        fs.writeFileSync(NOTIFS_FILE, JSON.stringify(memoryNotifs.slice(0, 150), null, 2));
        if (fs.existsSync(NOTIFS_FILE)) {
            lastMtime = fs.statSync(NOTIFS_FILE).mtimeMs;
        }
    } catch (e) {
        console.warn('[AdminNotifService] Write error:', e.message);
    }
}

class AdminNotificationService {
    saveOrderNotification(order, items = []) {
        if (!order || !order.id) return null;
        loadNotifications();

        const orderId = order.id;
        const orderShortNumber = String(orderId).replace('order_', '').slice(0, 8).toUpperCase();
        const rawHostel = order.hostel_id || (order.delivery_address && (order.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || order.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i))?.[0]) || 'BH-13';
        const normHostel = String(rawHostel).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const displayHostel = rawHostel.toUpperCase().trim();

        const rawRoom = order.room || (order.delivery_address && order.delivery_address.match(/Room\s*([A-Za-z0-9\-]+)/i)?.[1]) || '';
        const customerName = order.customer_name || 'Student Customer';
        const total = parseFloat(order.total || 0).toFixed(2);

        let itemSummary = '';
        if (Array.isArray(items) && items.length > 0) {
            itemSummary = items.map(i => `${i.name || i.product_name || 'Item'} × ${i.quantity || 1}`).join(', ');
        } else if (order.item_summary) {
            itemSummary = order.item_summary;
        } else {
            itemSummary = 'Items in record';
        }

        const notifEntry = {
            id: `notif_${orderId}_${Date.now()}`,
            order_id: orderId,
            order_number: orderShortNumber,
            hostel: displayHostel,
            norm_hostel: normHostel,
            customer_name: customerName,
            room: rawRoom,
            total: total,
            item_summary: itemSummary,
            item_count: Array.isArray(items) ? items.length : 1,
            timestamp: Date.now(),
            read_by: [] // List of admin IDs who have marked this notification read
        };

        // Remove any prior entry for the same orderId to prevent duplicates
        memoryNotifs = memoryNotifs.filter(n => n.order_id !== orderId);
        memoryNotifs.unshift(notifEntry);

        persistNotifications();
        console.log(`[AdminNotificationService] Saved notification for Order #${orderShortNumber} (${displayHostel})`);
        return notifEntry;
    }

    getNotificationsForAdmin(adminUser) {
        if (!adminUser) return [];
        loadNotifications();

        const isOwner = Boolean(
            adminUser.is_owner === true ||
            adminUser.role === 'owner' ||
            adminUser.role === 'super_admin' ||
            (Array.isArray(adminUser.roles) && (adminUser.roles.includes('owner') || adminUser.roles.includes('super_admin'))) ||
            adminUser.id === 'nivas_naidu_ad'
        );

        let myHostelsNorm = new Set();
        if (!isOwner) {
            const rawList = Array.isArray(adminUser.assigned_hostels) && adminUser.assigned_hostels.length > 0
                ? adminUser.assigned_hostels
                : (adminUser.assigned_hostel_id ? [adminUser.assigned_hostel_id] : []);
            myHostelsNorm = new Set(rawList.map(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '')));
        }

        return memoryNotifs
            .filter(n => {
                if (isOwner) return true;
                if (myHostelsNorm.size === 0) return true; // If admin has no specific hostel restriction, allow all notifications
                const notifHostelNorm = String(n.norm_hostel || n.hostel || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                return myHostelsNorm.has(notifHostelNorm);
            })
            .map(n => ({
                id: n.id,
                order_id: n.order_id,
                order_number: n.order_number,
                hostel: n.hostel,
                customer_name: n.customer_name,
                room: n.room,
                total: n.total,
                item_summary: n.item_summary,
                item_count: n.item_count,
                timestamp: n.timestamp,
                read: Array.isArray(n.read_by) && n.read_by.includes(adminUser.id)
            }))
            .slice(0, 50);
    }

    markAllRead(adminId) {
        if (!adminId) return false;
        loadNotifications();
        let changed = false;
        memoryNotifs.forEach(n => {
            if (!Array.isArray(n.read_by)) n.read_by = [];
            if (!n.read_by.includes(adminId)) {
                n.read_by.push(adminId);
                changed = true;
            }
        });
        if (changed) persistNotifications();
        return true;
    }

    markOneRead(adminId, orderIdOrNotifId) {
        if (!adminId || !orderIdOrNotifId) return false;
        loadNotifications();
        let changed = false;
        memoryNotifs.forEach(n => {
            if (n.id === orderIdOrNotifId || n.order_id === orderIdOrNotifId) {
                if (!Array.isArray(n.read_by)) n.read_by = [];
                if (!n.read_by.includes(adminId)) {
                    n.read_by.push(adminId);
                    changed = true;
                }
            }
        });
        if (changed) persistNotifications();
        return true;
    }
}

module.exports = new AdminNotificationService();

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const db = new DatabaseSync('server/db/lpuquick.db');

const orders = db.prepare('SELECT * FROM orders').all();
const orderItems = db.prepare('SELECT * FROM order_items').all();
const allHostels = JSON.parse(fs.readFileSync('server/data/hostels.json', 'utf8'));
const hostelLocks = JSON.parse(fs.readFileSync('server/data/hostel_lock_meta.json', 'utf8') || '{}');

function _normalizeHostelId(hostelId) {
    if (!hostelId || hostelId === 'all' || hostelId === 'ALL') return 'BH-13';
    let str = String(hostelId).trim().toUpperCase();
    const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i) || str.match(/(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
    if (match) {
        return `${match[1].toUpperCase()}-${match[2]}`;
    }
    return str || 'BH-13';
}

const isHostelMatch = (orderHostelId, targetHostelId) => {
    const h1 = _normalizeHostelId(orderHostelId || '');
    const h2 = _normalizeHostelId(targetHostelId || '');
    return h1 === h2;
};

// Check delivery address extraction if hostel_id is default BH-13
orders.forEach(o => {
    if ((!o.hostel_id || o.hostel_id === 'BH-13') && o.delivery_address) {
        const m = o.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || o.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i);
        if (m) {
            o.hostel_id = `${m[1].toUpperCase()}-${m[2]}`;
        }
    }
});

const hostelsBreakdown = allHostels.map(h => {
    const hOrders = orders.filter(o => isHostelMatch(o.hostel_id, h.id));
    const hDelivered = hOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'delivered' || s === 'completed';
    });
    const hCancelled = hOrders.filter(o => {
        const s = (o.status || '').toLowerCase();
        return s === 'cancelled' || s === 'rejected';
    });
    const hPending = hOrders.length - hDelivered.length - hCancelled.length;
    const hRevenue = hDelivered.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const hProfit = Math.round(hRevenue * 0.28);
    const lockRecord = hostelLocks[h.id] || hostelLocks[_normalizeHostelId(h.id)] || null;
    const isLocked = lockRecord ? (lockRecord.lock_type === 'CLOSED' || lockRecord.lock_type === 'EMERGENCY_LOCK' || lockRecord.lock_type === 'SCHEDULED') : false;

    // Check orders sample
    return {
        id: h.id,
        name: h.name,
        status: h.status,
        is_locked: isLocked,
        total_orders: hOrders.length,
        delivered_orders: hDelivered.length,
        pending_orders: hPending,
        cancelled_orders: hCancelled.length,
        revenue: hRevenue,
        formatted_revenue: '₹' + Math.round(hRevenue).toLocaleString('en-IN'),
        estimated_profit: hProfit,
        formatted_profit: '₹' + Math.round(hProfit).toLocaleString('en-IN'),
        sample_customers: Array.from(new Set(hOrders.map(o => o.customer_name).filter(Boolean))).slice(0, 4),
        sample_rooms: Array.from(new Set(hOrders.map(o => o.delivery_address).filter(Boolean))).slice(0, 3)
    };
}).sort((a, b) => b.total_orders - a.total_orders);

console.log(JSON.stringify(hostelsBreakdown, null, 2));

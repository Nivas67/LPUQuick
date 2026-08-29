const WebSocket = require('ws');

// Central Realtime Hub for LPUQuick
const adminSockets = new Set();
const orderTrackingSockets = new Map(); // orderId -> Set of ws

function setupRealtime(server, db) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/ws/admin') || pathname.startsWith('/ws/track')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws, request) => {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // 1. Admin Dashboard Real-time connection
        if (pathname.startsWith('/ws/admin')) {
            adminSockets.add(ws);
            console.log(`[WS] Admin connected. Total active admin sockets: ${adminSockets.size}`);

            ws.send(JSON.stringify({
                type: 'CONNECTED',
                message: 'Admin real-time operations channel connected',
                timestamp: new Date().toISOString()
            }));

            ws.on('close', () => {
                adminSockets.delete(ws);
                console.log(`[WS] Admin disconnected. Remaining admin sockets: ${adminSockets.size}`);
            });

            ws.on('error', (err) => {
                adminSockets.delete(ws);
                console.error('[WS Admin Error]:', err.message);
            });
            return;
        }

        // 2. Student Order Tracking connection (/ws/track/:orderId)
        if (pathname.startsWith('/ws/track')) {
            const parts = pathname.split('/').filter(Boolean);
            const orderId = parts.length > 2 ? parts[2] : (parts[1] !== 'track' ? parts[1] : null);

            let targetOrderId = orderId;
            let order = null;
            if (targetOrderId) {
                order = db.prepare('SELECT * FROM orders WHERE id = ?').get(targetOrderId);
            }
            if (!order) {
                order = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').get();
                if (order) targetOrderId = order.id;
            }

            if (!targetOrderId) {
                ws.send(JSON.stringify({ type: 'ERROR', message: 'No active orders found' }));
                ws.close();
                return;
            }

            if (!orderTrackingSockets.has(targetOrderId)) {
                orderTrackingSockets.set(targetOrderId, new Set());
            }
            orderTrackingSockets.get(targetOrderId).add(ws);
            console.log(`[WS] Student tracking connected for order: ${targetOrderId}`);

            // Send initial order state
            const now = new Date();
            ws.send(JSON.stringify({
                type: 'INITIAL_STATE',
                order_id: targetOrderId,
                status: order.status || 'Order Placed',
                rider_name: order.rider_name || 'Alex',
                total: order.total,
                delivery_address: order.delivery_address || 'BH13 (Block A), Room 304',
                timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            }));

            ws.on('close', () => {
                const group = orderTrackingSockets.get(targetOrderId);
                if (group) {
                    group.delete(ws);
                    if (group.size === 0) orderTrackingSockets.delete(targetOrderId);
                }
                console.log(`[WS] Student tracking disconnected for order: ${targetOrderId}`);
            });
        }
    });
}

// Broadcast new order to all Admin Dashboards
function notifyAdminNewOrder(orderData) {
    console.log(`[WS] Broadcasting NEW_ORDER to ${adminSockets.size} admin clients:`, orderData.id);
    const payload = JSON.stringify({
        type: 'NEW_ORDER',
        order: orderData,
        timestamp: new Date().toISOString()
    });

    for (const ws of adminSockets) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }
}

// Broadcast status update to Admin Dashboards and Student Tracking
function notifyOrderStatusUpdate(orderId, statusData) {
    console.log(`[WS] Broadcasting ORDER_STATUS_UPDATE for ${orderId} -> ${statusData.status}`);
    const adminPayload = JSON.stringify({
        type: 'ORDER_STATUS_UPDATE',
        orderId,
        status: statusData.status,
        riderName: statusData.riderName,
        timestamp: new Date().toISOString()
    });

    for (const ws of adminSockets) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(adminPayload);
        }
    }

    // Notify student tracking clients
    const studentGroup = orderTrackingSockets.get(orderId);
    if (studentGroup) {
        const studentPayload = JSON.stringify({
            type: 'STATUS_UPDATE',
            order_id: orderId,
            status: statusData.status,
            rider_name: statusData.riderName || 'Alex',
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            message: getStatusMessage(statusData.status)
        });

        for (const ws of studentGroup) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(studentPayload);
            }
        }
    }
}

function getStatusMessage(status) {
    if (status === 'Order Confirmed') return 'Dark Store confirmed your items are in stock.';
    if (status === 'Preparing') return 'Dark Store staff is packing your items in an express bag.';
    if (status === 'Out for Delivery') return 'Rider Alex is on the way to your hostel room.';
    if (status === 'Delivered') return 'Order delivered to your hostel gate/room!';
    if (status === 'Cancelled') return 'Order has been cancelled.';
    return 'Your order has been placed and received.';
}

module.exports = {
    setupRealtime,
    notifyAdminNewOrder,
    notifyOrderStatusUpdate
};

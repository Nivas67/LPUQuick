const WebSocket = require('ws');
const supabaseDb = require('./db/supabaseDb');

// Central Realtime Hub for LPUQuick (Powered by Supabase Cloud)
const adminSockets = new Set();
const orderTrackingSockets = new Map(); // orderId -> Set of ws

function setupRealtime(server) {
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

    wss.on('connection', async (ws, request) => {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        // 1. Admin Dashboard Real-time connection
        if (pathname.startsWith('/ws/admin')) {
            adminSockets.add(ws);
            console.log(`[WS] Admin connected. Total active admin sockets: ${adminSockets.size}`);

            ws.send(JSON.stringify({
                type: 'CONNECTED',
                message: 'Admin real-time operations channel connected (Supabase Cloud)',
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
                try { order = await supabaseDb.orders.getOrderById(targetOrderId); } catch (e) {}
            }

            if (!order) {
                try {
                    const all = await supabaseDb.orders.getAllOrders();
                    if (all && all.length > 0) {
                        order = all[0];
                        targetOrderId = order.id;
                    }
                } catch (e) {}
            }

            if (!targetOrderId || !order) {
                ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Ready for live orders' }));
                return;
            }

            if (!orderTrackingSockets.has(targetOrderId)) {
                orderTrackingSockets.set(targetOrderId, new Set());
            }
            orderTrackingSockets.get(targetOrderId).add(ws);
            console.log(`[WS] Student tracking connected for order: ${targetOrderId}`);

            // Send initial order state
            const now = new Date();
            const initialStatus = order.status || 'Order Placed';
            ws.send(JSON.stringify({
                type: 'INITIAL_STATE',
                order_id: targetOrderId,
                status: initialStatus,
                step: getStepNumber(initialStatus),
                message: getStatusMessage(initialStatus, order.rider_name || 'Alex'),
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

function notifyAdminNewOrder(orderData) {
    console.log(`[WS] Broadcasting NEW_ORDER to ${adminSockets.size} admin clients:`, orderData.id);
    const payload = JSON.stringify({
        type: 'NEW_ORDER',
        order: orderData,
        timestamp: new Date().toISOString()
    });

    adminSockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

function broadcastStatusUpdate(orderId, newStatus) {
    console.log(`[WS] Broadcasting ORDER_STATUS_UPDATE for ${orderId} -> ${newStatus}`);

    const now = new Date();
    const payload = JSON.stringify({
        type: 'STATUS_UPDATE',
        order_id: orderId,
        status: newStatus,
        step: getStepNumber(newStatus),
        message: getStatusMessage(newStatus, 'Alex'),
        timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    });

    const trackingClients = orderTrackingSockets.get(orderId);
    if (trackingClients) {
        trackingClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) ws.send(payload);
        });
    }

    adminSockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
}

function getStepNumber(status) {
    switch (status) {
        case 'Order Placed': case 'pending': return 1;
        case 'Order Confirmed': case 'confirmed': case 'accepted': return 2;
        case 'Preparing': case 'packed': return 3;
        case 'Out for Delivery': case 'en_route': return 4;
        case 'Delivered': case 'delivered': return 5;
        default: return 1;
    }
}

function getStatusMessage(status, riderName) {
    switch (status) {
        case 'Order Placed': return 'Order placed! Dark Store BH13 receiving items...';
        case 'Order Confirmed': return 'Order accepted by BH13 Store Manager.';
        case 'Preparing': return 'Items packed and sealed in tamper-proof bag.';
        case 'Out for Delivery': return `Rider ${riderName} is speeding towards your hostel!`;
        case 'Delivered': return 'Delivered to your room door! Enjoy your snack.';
        case 'Cancelled': return 'Order was cancelled.';
        default: return `Status: ${status}`;
    }
}

module.exports = {
    setupRealtime,
    broadcastOrderPlaced: notifyAdminNewOrder,
    broadcastStatusUpdate
};

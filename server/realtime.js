const WebSocket = require('ws');
const supabaseDb = require('./db/supabaseDb');
const { getSupabaseClient } = require('./supabase');

// Central Realtime Coordination Hub for LPUQuick (Powered by Supabase Cloud)
const adminSockets = new Set();
const clientSockets = new Set();
const orderTrackingSockets = new Map(); // orderId -> Set of ws

function setupRealtime(server) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/ws/admin') || pathname.startsWith('/ws/track') || pathname.startsWith('/ws/client') || pathname.startsWith('/ws/store')) {
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

        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });

        // 1. Admin Dashboard Real-time connection (/ws/admin)
        if (pathname.startsWith('/ws/admin')) {
            adminSockets.add(ws);
            console.log(`[WS Hub] 🛡️ Admin connected. Total admin sockets: ${adminSockets.size}`);

            ws.send(JSON.stringify({
                type: 'CONNECTED',
                role: 'admin',
                message: 'Admin real-time operations channel connected (Supabase Cloud)',
                adminCount: adminSockets.size,
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw);
                    if (msg.type === 'PING') {
                        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
                    }
                } catch (e) {}
            });

            ws.on('close', () => {
                adminSockets.delete(ws);
                console.log(`[WS Hub] Admin disconnected. Remaining admin sockets: ${adminSockets.size}`);
            });

            ws.on('error', (err) => {
                adminSockets.delete(ws);
                console.error('[WS Admin Error]:', err.message);
            });
            return;
        }

        // 2. Global Storefront Client Connection (/ws/client or /ws/store)
        if (pathname.startsWith('/ws/client') || pathname.startsWith('/ws/store')) {
            clientSockets.add(ws);
            console.log(`[WS Hub] 🛍️ Client storefront connected. Total client sockets: ${clientSockets.size}`);

            ws.send(JSON.stringify({
                type: 'CONNECTED',
                role: 'client',
                message: 'LPUQuick Campus Live Sync connected',
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw);
                    if (msg.type === 'PING') {
                        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
                    } else if (msg.type === 'REGISTER_USER' && msg.userId) {
                        ws.userId = msg.userId;
                    }
                } catch (e) {}
            });

            ws.on('close', () => {
                clientSockets.delete(ws);
                console.log(`[WS Hub] Client disconnected. Remaining client sockets: ${clientSockets.size}`);
            });

            ws.on('error', (err) => {
                clientSockets.delete(ws);
            });
            return;
        }

        // 3. Student Dedicated Order Tracking connection (/ws/track/:orderId)
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
            console.log(`[WS Hub] 📡 Student tracking connected for order: ${targetOrderId}`);

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
                console.log(`[WS Hub] Student tracking disconnected for order: ${targetOrderId}`);
            });
        }
    });

    // Heartbeat: keep all connections alive & prune dead sockets every 25s
    setInterval(() => {
        const pruneDead = (socketSet) => {
            socketSet.forEach(ws => {
                if (ws.isAlive === false) {
                    socketSet.delete(ws);
                    return ws.terminate();
                }
                ws.isAlive = false;
                try { ws.ping(); } catch(e) {}
            });
        };

        pruneDead(adminSockets);
        pruneDead(clientSockets);
    }, 25000);
}

// High-Throughput Non-Blocking Chunked Dispatcher for 6,000+ Concurrent WebSockets
function chunkedBroadcast(socketSet, payloadString, batchSize = 300) {
    if (!socketSet || socketSet.size === 0) return;
    const sockets = Array.from(socketSet);
    let index = 0;

    function dispatchBatch() {
        const end = Math.min(index + batchSize, sockets.length);
        for (let i = index; i < end; i++) {
            const ws = sockets[i];
            if (ws && ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 65536) {
                try {
                    ws.send(payloadString);
                } catch (err) {
                    socketSet.delete(ws);
                }
            }
        }
        index = end;
        if (index < sockets.length) {
            setImmediate(dispatchBatch);
        }
    }

    dispatchBatch();
}

// Broadcast new order to ALL admin sockets AND client sockets
async function notifyAdminNewOrder(orderData) {
    // Enrich with customer info from Supabase
    let customerName = orderData.customer_name || 'Campus Student';
    let customerPhone = orderData.customer_phone || '';
    let customerEmail = orderData.customer_email || '';

    if (orderData.user_id && customerName === 'Campus Resident') {
        try {
            const supabase = getSupabaseClient();
            const { data: user } = await supabase
                .from('users')
                .select('name, phone, email')
                .eq('id', orderData.user_id)
                .single();
            if (user) {
                customerName = user.name || customerName;
                customerPhone = user.phone || customerPhone;
                customerEmail = user.email || customerEmail;
            }
        } catch (e) {}
    }

    const payload = JSON.stringify({
        type: 'NEW_ORDER',
        order: {
            ...orderData,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            item_summary: orderData.item_summary || orderData.items_summary || 'Campus items'
        },
        timestamp: new Date().toISOString()
    });

    chunkedBroadcast(adminSockets, payload);
    chunkedBroadcast(clientSockets, payload);
}

// Broadcast status update to tracking clients, admin sockets, AND client sockets
function broadcastStatusUpdate(orderId, newStatus) {
    const now = new Date();

    // Payload for student tracking clients
    const trackingPayload = JSON.stringify({
        type: 'STATUS_UPDATE',
        order_id: orderId,
        orderId: orderId,
        status: newStatus,
        step: getStepNumber(newStatus),
        message: getStatusMessage(newStatus, 'Alex'),
        timestamp: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    });

    const trackingClients = orderTrackingSockets.get(orderId);
    if (trackingClients) {
        chunkedBroadcast(trackingClients, trackingPayload);
    }

    // Payload for admin dashboard clients
    const adminPayload = JSON.stringify({
        type: 'ORDER_STATUS_UPDATE',
        orderId: orderId,
        order_id: orderId,
        status: newStatus,
        step: getStepNumber(newStatus),
        message: getStatusMessage(newStatus, 'Alex'),
        timestamp: now.toISOString()
    });

    chunkedBroadcast(adminSockets, adminPayload);
    chunkedBroadcast(clientSockets, trackingPayload);
}

// Broadcast product/inventory update to all admin sockets AND client sockets
function broadcastInventoryUpdate(productId, stockLeft, inStock) {
    const payload = JSON.stringify({
        type: 'INVENTORY_UPDATE',
        productId,
        product_id: productId,
        stock_left: stockLeft,
        in_stock: inStock,
        timestamp: new Date().toISOString()
    });

    chunkedBroadcast(adminSockets, payload);
    chunkedBroadcast(clientSockets, payload);
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

// Broadcast client lock status update to all connected storefront clients & admin sockets
function broadcastClientLockUpdate(lockState) {
    const payload = JSON.stringify({
        type: 'CLIENT_LOCK_UPDATE',
        availability: lockState,
        timestamp: new Date().toISOString()
    });

    chunkedBroadcast(clientSockets, payload);
    chunkedBroadcast(adminSockets, payload);
}

// Broadcast user block signal
function broadcastUserBlocked(userId, reason = 'Fake Orders') {
    const payload = JSON.stringify({
        type: 'USER_BLOCKED',
        userId,
        reason,
        timestamp: new Date().toISOString()
    });

    chunkedBroadcast(clientSockets, payload);
    chunkedBroadcast(adminSockets, payload);
}

function broadcastUserUnblocked(userId) {
    const payload = JSON.stringify({
        type: 'USER_UNBLOCKED',
        userId,
        timestamp: new Date().toISOString()
    });

    chunkedBroadcast(clientSockets, payload);
    chunkedBroadcast(adminSockets, payload);
}

module.exports = {
    setupRealtime,
    broadcastOrderPlaced: notifyAdminNewOrder,
    broadcastStatusUpdate,
    broadcastInventoryUpdate,
    broadcastClientLockUpdate,
    broadcastUserBlocked,
    broadcastUserUnblocked
};




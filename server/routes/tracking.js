const WebSocket = require('ws');

function setupTracking(server, db) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const pathname = parsedUrl.pathname;

        if (pathname.startsWith('/ws/track')) {
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
        const parts = pathname.split('/').filter(Boolean);
        const orderId = parts.length > 2 ? parts[2] : (parts[1] !== 'track' ? parts[1] : null);

        console.log(`[WS] Tracking connection for order: ${orderId || 'latest'}`);

        let order = null;
        if (orderId) {
            order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        }
        if (!order) {
            order = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1').get();
        }

        if (!order) {
            ws.send(JSON.stringify({ error: 'No active orders' }));
            ws.close();
            return;
        }

        // Timeline Stages
        const stages = [
            { status: 'Order Placed', step: 1, delay: 0, msg: 'Your order has been received and logged.' },
            { status: 'Order Confirmed', step: 2, delay: 4000, msg: 'Dark Store confirmed items are in stock.' },
            { status: 'Preparing', step: 3, delay: 8000, msg: 'Staff is packing your snacks into express bag.' },
            { status: 'Out for Delivery', step: 4, delay: 13000, msg: `${order.rider_name || 'Alex'} picked up your order and is riding to ${order.delivery_address || 'BH13'}.` },
            { status: 'Delivered', step: 5, delay: 20000, msg: `Order delivered to ${order.delivery_address || 'BH13'} hostel gate!` }
        ];

        // Send current immediate status first
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        ws.send(JSON.stringify({
            order_id: order.id,
            status: order.status || 'Order Placed',
            step: 1,
            timestamp: timeStr,
            rider_name: order.rider_name || 'Alex',
            total: order.total,
            delivery_address: order.delivery_address || 'BH13 (Block A), Room 304',
            message: 'Your order has been placed successfully.'
        }));

        // Progressive progression timer
        const timeouts = [];
        stages.forEach(st => {
            if (st.delay > 0) {
                const to = setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const stepTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        // Update DB record
                        try {
                            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(st.status, order.id);
                        } catch (e) {
                            console.error('Failed to update order status in DB:', e);
                        }

                        ws.send(JSON.stringify({
                            order_id: order.id,
                            status: st.status,
                            step: st.step,
                            timestamp: stepTime,
                            rider_name: order.rider_name || 'Alex',
                            total: order.total,
                            delivery_address: order.delivery_address || 'BH13 (Block A), Room 304',
                            message: st.msg
                        }));
                    }
                }, st.delay);
                timeouts.push(to);
            }
        });

        ws.on('close', () => {
            timeouts.forEach(t => clearTimeout(t));
            console.log(`[WS] Tracking closed for: ${order.id}`);
        });
    });
}

module.exports = { setupTracking };

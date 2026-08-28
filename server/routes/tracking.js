const WebSocket = require('ws');
const url = require('url');

function setupTracking(server, db) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const pathname = url.parse(request.url).pathname;

        if (pathname.startsWith('/ws/track')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', (ws, request) => {
        const pathname = url.parse(request.url).pathname;
        const orderId = pathname.split('/').pop();

        console.log(`[WS] Tracking started for order: ${orderId}`);

        // Get order info
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        if (!order) {
            ws.send(JSON.stringify({ error: 'Order not found' }));
            ws.close();
            return;
        }

        // Simulate rider movement
        const startLat = 31.2560;
        const startLng = 75.7030;
        const endLat = 31.2540;
        const endLng = 75.7050;
        
        const statuses = ['accepted', 'packed', 'en_route', 'en_route', 'en_route', 'en_route', 'delivered'];
        let step = 0;
        const totalSteps = statuses.length;

        const interval = setInterval(() => {
            if (step >= totalSteps || ws.readyState !== WebSocket.OPEN) {
                clearInterval(interval);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        status: 'delivered',
                        rider_lat: endLat,
                        rider_lng: endLng,
                        eta_minutes: 0,
                        rider_name: order.rider_name || 'Alex',
                        message: 'Your order has been delivered!'
                    }));
                }
                return;
            }

            const progress = step / (totalSteps - 1);
            const currentLat = startLat + (endLat - startLat) * progress;
            const currentLng = startLng + (endLng - startLng) * progress;
            const eta = Math.max(0, Math.ceil((1 - progress) * 12));

            const data = {
                status: statuses[step],
                rider_lat: Math.round(currentLat * 10000) / 10000,
                rider_lng: Math.round(currentLng * 10000) / 10000,
                eta_minutes: eta,
                rider_name: order.rider_name || 'Alex',
                progress: Math.round(progress * 100),
                message: getStatusMessage(statuses[step], order.rider_name || 'Alex')
            };

            ws.send(JSON.stringify(data));
            step++;
        }, 3000); // Broadcast every 3 seconds

        ws.on('close', () => {
            clearInterval(interval);
            console.log(`[WS] Tracking ended for order: ${orderId}`);
        });
    });
}

function getStatusMessage(status, riderName) {
    switch (status) {
        case 'accepted': return `${riderName} accepted your order!`;
        case 'packed': return `Your order is packed and ready!`;
        case 'en_route': return `${riderName} is on the way with your groceries.`;
        case 'delivered': return `Your order has been delivered!`;
        default: return 'Processing your order...';
    }
}

module.exports = { setupTracking };

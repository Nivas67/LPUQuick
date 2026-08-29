require('dotenv').config();
const http = require('http');
const app = require('./app');
const { setupRealtime } = require('./realtime');

const server = http.createServer(app);

// Realtime WebSocket setup for Admin Dashboard & Student Live Tracking
setupRealtime(server);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] LPUQuick running at http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
    console.log(`[Server] WebSocket tracking at ws://localhost:${PORT}/ws/track`);
});

module.exports = { app, server };

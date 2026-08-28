const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initDB } = require('./db/init');

const app = express();
const server = http.createServer(app);

// Initialize database
const db = initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Make db accessible to routes
app.locals.db = db;

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/home', require('./routes/home'));
app.use('/api/search', require('./routes/search'));
app.use('/api/flow-assist', require('./routes/flowassist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));

// WebSocket setup for order tracking
const { setupTracking } = require('./routes/tracking');
setupTracking(server, db);

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] LPUQuick running at http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
    console.log(`[Server] WebSocket tracking at ws://localhost:${PORT}/ws/track`);
});

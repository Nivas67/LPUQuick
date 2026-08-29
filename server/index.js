require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { getSupabaseClient } = require('./supabase');

const app = express();
const server = http.createServer(app);

// Initialize Supabase Client
const supabase = getSupabaseClient();
console.log('[Database] 100% Supabase Cloud PostgreSQL Active (Single Database Mode)');

// Middleware
app.use(cors());
app.use(express.json());

// Static files (Client and Admin portals)
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use(express.static(path.join(__dirname, '..', 'client')));

// API Routes (All backed 100% by Supabase Cloud)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/home', require('./routes/home'));
app.use('/api/search', require('./routes/search'));
app.use('/api/flow-assist', require('./routes/flowassist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/test-supabase', require('./routes/test-supabase'));

// Realtime WebSocket setup for Admin Dashboard & Student Live Tracking
const { setupRealtime } = require('./realtime');
setupRealtime(server);

// Admin portal route
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Client Storefront SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] LPUQuick running at http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
    console.log(`[Server] WebSocket tracking at ws://localhost:${PORT}/ws/track`);
});

module.exports = { app, server };

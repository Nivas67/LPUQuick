require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSupabaseClient } = require('./supabase');

const app = express();

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

// Admin portal route
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Client Storefront SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

module.exports = app;

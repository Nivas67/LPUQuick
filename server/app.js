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
const compression = require('compression');
app.use(compression({
    level: 6,
    threshold: 1024, // only compress responses above 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files (Client and Admin portals) with ETag and Cache-Control headers
const staticOptions = {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // HTML files should revalidate quickly for SPA route updates
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else if (filePath.match(/\.(css|js|png|jpg|jpeg|svg|webp|woff2?)$/)) {
            // Static assets cached with stale revalidation
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        }
    }
};

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, '..', 'client', 'uploads'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin'), staticOptions));
app.use(express.static(path.join(__dirname, '..', 'client'), staticOptions));
app.use(express.static(path.join(__dirname, '..', 'public'), staticOptions));

// API Routes (All backed 100% by Supabase Cloud)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/client/status', require('./routes/client-status'));
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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSupabaseClient } = require('./supabase');

const app = express();

// Initialize Supabase Client
const supabase = getSupabaseClient();
console.log('[Database] 100% Supabase Cloud PostgreSQL Active (Single Database Mode)');

// Security Middleware & Response Headers
app.disable('x-powered-by');

app.use((req, res, next) => {
    // High-Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    if (process.env.NODE_ENV === 'production' || req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // High-Resolution Response Time Measurement
    const start = process.hrtime();
    const origWriteHead = res.writeHead;
    res.writeHead = function (...args) {
        const diff = process.hrtime(start);
        const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
        res.setHeader('X-Response-Time', `${timeInMs}ms`);
        return origWriteHead.apply(this, args);
    };

    next();
});

// Middleware: Compression with optimal chunk threshold
const compression = require('compression');
app.use(compression({
    level: 6,
    threshold: 512, // compress responses above 512 bytes for faster mobile loading
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Input Sanitization & Anti-Injection Guard
function sanitizeInput(data) {
    if (!data || typeof data !== 'object') return;
    for (const key of Object.keys(data)) {
        if (typeof data[key] === 'string') {
            data[key] = data[key].replace(/\0/g, '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitizeInput(data[key]);
        }
    }
}

app.use((req, res, next) => {
    if (req.body) sanitizeInput(req.body);
    if (req.query) sanitizeInput(req.query);
    next();
});

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

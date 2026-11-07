require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getSupabaseClient } = require('./supabase');

const app = express();
app.set('trust proxy', 1);

// Initialize Supabase Client
const supabase = getSupabaseClient();
console.log('[Database] 100% Supabase Cloud PostgreSQL Active (Single Database Mode)');

// Initialize Hostel Groups & Shared Inventory Registry
try {
    const hostelGroupService = require('./services/hostelGroupService');
    hostelGroupService.init().catch(err => console.warn('[HostelGroupService init note]:', err.message));
} catch (e) {}

// Security Middleware & Response Headers
app.disable('x-powered-by');

app.use((req, res, next) => {
    // High-Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

    // Content Security Policy (Anti-XSS, anti-clickjacking & injection protection)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://accounts.google.com https://apis.google.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' data: blob: https:; " +
        "connect-src 'self' https: wss:; " +
        "frame-src 'self' https://accounts.google.com; " +
        "frame-ancestors 'self'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
    );

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

// Strict CORS: Allow recognized origins, mobile webviews, server-to-server, and local development
const allowedOrigins = [
    process.env.APP_URL,
    process.env.PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'https://lpuquick.com',
    'https://www.lpuquick.com'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin === o || origin.endsWith('.lpuquick.com') || origin.endsWith('.vercel.app'))) {
            return callback(null, true);
        }
        if (/^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'x-admin-key', 'x-user-id', 'x-user-phone', 'x-hostel-id', 'x-gateway-signature', 'x-gateway-event', 'x-financial-token']
}));

app.use(express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input Sanitization & Anti-Injection Guard (SEC-08 + Anti-Prototype Pollution)
function sanitizeInput(data) {
    if (!data || typeof data !== 'object') return;
    for (const key of Object.keys(data)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            delete data[key];
            continue;
        }
        if (typeof data[key] === 'string') {
            data[key] = data[key]
                .replace(/\0/g, '')
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<\s*(?:iframe|object|embed|applet|meta|link|style)\b[^>]*>/gi, '')
                .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
                .replace(/javascript:[^"'\s]*/gi, '');
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

const ipBlockService = require('./services/ipBlockService');
const { auditMiddleware } = require('./middleware/auditLogger');

// IP Blacklist Enforcement Guard: If IP is blocked, return custom message (or blank if empty)
app.use((req, res, next) => {
    const clientIp = ipBlockService.extractClientIp(req);
    const blockInfo = ipBlockService.isBlocked(clientIp);
    if (blockInfo && blockInfo.blocked) {
        const customMsg = blockInfo.message !== undefined && blockInfo.message !== null ? String(blockInfo.message) : '';
        return res.status(403).type('text/plain').send(customMsg);
    }
    next();
});

// Full Audit Logging Middleware
app.use(auditMiddleware);

const { apiSecurityShield, record404AttackProbe } = require('./middleware/securityShield');
app.use(apiSecurityShield);

// Static files (Client and Admin portals) with ETag and Cache-Control headers
const staticOptions = {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.match(/\.(css|js)$/)) {
            // HTML, JS, and CSS files revalidate immediately for SPA code updates
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.match(/\.(png|jpg|jpeg|svg|webp|woff2?)$/)) {
            // Static media assets cached with stale revalidation
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        }
    }
};

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads'), staticOptions));
app.use('/uploads', express.static(path.join(__dirname, '..', 'client', 'uploads'), staticOptions));
app.use('/ad-new', express.static(path.join(__dirname, '..', 'admin'), staticOptions));

// Explicitly block legacy /admin path (changed to /ad-new)
app.all(['/admin', '/admin/*'], (req, res) => {
    res.status(404).send('Not Found');
});
app.use(express.static(path.join(__dirname, '..', 'client'), staticOptions));
app.use(express.static(path.join(__dirname, '..', 'public'), staticOptions));

// API Routes (All backed 100% by Supabase Cloud)
// Health Check & Supabase Keep-Alive Endpoint (100% Free Monitoring)
app.get('/api/health', async (req, res) => {
    try {
        const client = getSupabaseClient();
        let dbOk = false;
        if (client) {
            const { error } = await client.from('app_availability').select('id').limit(1);
            dbOk = !error;
        }
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json({
            status: 'healthy',
            platform: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
            database: dbOk ? 'connected' : 'standby',
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        res.status(200).json({ status: 'healthy', database: 'standby', note: e.message });
    }
});

// Public Realtime Configuration for Supabase Channel Subscriptions
app.get('/api/realtime/config', (req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/broadcast-notifications', require('./routes/broadcastNotifications'));
app.use('/api/admin/hostel-groups', require('./routes/hostelGroups'));
app.use('/api/admin/backup', require('./routes/backup'));
app.use('/api/admin/financial', require('./routes/financial'));
app.use('/api/client/status', require('./routes/client-status'));
app.use('/api/home', require('./routes/home'));
app.get('/api/banners', (req, res) => res.redirect('/api/home/banners'));
app.use('/api/search', require('./routes/search'));
app.use('/api/flow-assist', require('./routes/flowassist'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/hostels', require('./routes/hostels'));
app.use('/api/admin/sync', require('./routes/sync'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/food', require('./routes/food'));
app.get(['/food', '/cook'], (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'food.html')));

// Native Android APK Download Endpoints
app.get(['/download/apk', '/download/LPUQuick.apk', '/downloads/LPUQuick.apk', '/api/app/download-apk', '/api/download/apk', '/api/download/LPUQuick.apk'], (req, res) => {
    const fs = require('fs');
    const localApkPath = path.join(__dirname, '..', 'public', 'downloads', 'LPUQuick.apk');
    const clientApkPath = path.join(__dirname, '..', 'client', 'downloads', 'LPUQuick.apk');
    const rootApkPath = path.join(__dirname, '..', 'public', 'LPUQuick.apk');
    const targetApk = fs.existsSync(localApkPath) ? localApkPath : (fs.existsSync(clientApkPath) ? clientApkPath : (fs.existsSync(rootApkPath) ? rootApkPath : null));

    if (targetApk) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', 'attachment; filename="LPUQuick.apk"');
        return res.sendFile(targetApk);
    }

    // Direct fallback to GitHub Release download URL
    return res.redirect('https://github.com/Nivas67/LPUQuick/releases/latest/download/LPUQuick.apk');
});

// Dedicated 404 Shield for all unhandled /api/* endpoints
// Returns ultra-light JSON (<60 bytes), caches 404 at edge CDN, and records 404 probe against attacker IP
app.all('/api/*', (req, res) => {
    record404AttackProbe(req);
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        code: 'NOT_FOUND'
    });
});

// Mobile phone simulator for Admin Dashboard
// Mobile phone simulator for Customer Storefront
app.get(['/mobile', '/mobile-preview', '/phone', '/preview'], (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, '..', 'public', 'mobile-preview.html'));
});

// Mobile phone simulator for Admin Dashboard
app.get(['/admin-preview', '/admin/preview', '/preview-admin', '/mobile-admin'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin-preview.html'));
});

// Admin portal route
app.get('/admin*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

// Client Storefront SPA fallback (Non-API requests only)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Global Error Handler — catches unhandled exceptions and returns sanitized JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[Unhandled Error]:', err.message);
    res.status(err.status || 500).json({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR'
    });
});

module.exports = app;


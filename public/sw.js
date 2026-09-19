// LPUQuick High-Performance Ultra-Fast Service Worker (V2026.09.19-LowSignalV10)
const CACHE_NAME = 'lpuquick-pwa-v10-ultra';
const API_CACHE_NAME = 'lpuquick-api-cache-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png',
    '/logo.png',
    '/logo.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
    '/css/styles.css',
    '/js/api.js',
    '/js/app.js',
    '/js/pages/home.js',
    '/js/pages/categories.js',
    '/js/pages/cart.js',
    '/js/pages/checkout.js',
    '/js/pages/orders.js',
    '/js/pages/settings.js'
];

// Helper: Fast timeout wrapper for network requests (avoids hanging on spotty 2G/3G signals)
function fetchWithTimeout(request, timeoutMs = 1800) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error('Network timeout (low signal fallback)'));
        }, timeoutMs);

        fetch(request, { signal: controller.signal })
            .then(res => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

// Install: Pre-cache core shell
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Core shell cache note:', err);
            });
        })
    );
});

// Activate: Immediately purge outdated caches (preserve API cache) and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
                            console.log('[SW] Purging outdated cache:', key);
                            return caches.delete(key);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch Strategy:
// 1. Catalog & Home GET APIs -> Fast Network with Instant Cache Fallback for Low Signal
// 2. JavaScript, CSS & HTML -> Fast Network (1.5s) with Instant Stale Cache Fallback
// 3. Static Media / Images / Fonts -> Cache-First for maximum mobile scrolling speed
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests, Supabase direct websocket/REST, and Admin routes
    if (event.request.method !== 'GET' ||
        url.pathname.startsWith('/admin') ||
        url.hostname.includes('supabase.co')) {
        return;
    }

    // 1. Catalog & Home APIs: Fast Network (2.2s timeout) with Instant Cache Fallback for Low Signal
    const isCatalogApi = url.pathname.startsWith('/api/home') ||
        url.pathname.startsWith('/api/products') ||
        url.pathname.startsWith('/api/categories') ||
        url.pathname.startsWith('/api/banners') ||
        url.pathname.startsWith('/api/client/status');

    if (isCatalogApi) {
        event.respondWith(
            fetchWithTimeout(event.request, 2200)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(API_CACHE_NAME).then(c => c.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cached = await caches.match(event.request);
                    if (cached) return cached;
                    return new Response(JSON.stringify({ offline: true, products: [], categories: [] }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                })
        );
        return;
    }

    // Other /api/ routes: Skip caching
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 2. Application JavaScript, CSS & HTML: Fast Network (1.5s) with Instant Cache Fallback
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetchWithTimeout(event.request, 1500)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cached = await caches.match(event.request);
                    if (cached) return cached;
                    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
                        return caches.match('/index.html');
                    }
                    return new Response('/* Offline fallback */', { headers: { 'Content-Type': 'text/javascript' } });
                })
        );
        return;
    }

    // 3. Static Media, Images, Fonts, Icons: Cache-First for instant 60fps mobile scrolling
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.destination === 'image') {
                    return caches.match('/favicon.png');
                }
            });
        })
    );
});

// ============================================================
// WEB PUSH NOTIFICATIONS: Background alerts even when closed
// ============================================================
self.addEventListener('push', (event) => {
    let payload = {
        title: '🛵 LPUQuick Delivery Alert',
        body: 'New order update available.',
        icon: '/icon-192.png',
        badge: '/favicon.png',
        tag: 'lpuquick-alert-' + Date.now(),
        data: { url: '/admin#orders' }
    };

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/favicon.png',
        tag: payload.tag || 'lpuquick-notification',
        renotify: true,
        data: payload.data || { url: '/admin#orders' },
        vibrate: [200, 100, 200, 100, 200],
        actions: payload.actions || [
            { action: 'open', title: 'Open Hub' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const notificationData = event.notification.data || {};
    const targetUrl = notificationData.url || '/admin#orders';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes('/admin') && 'focus' in client) {
                    if (notificationData.orderId) {
                        client.postMessage({
                            type: 'NAVIGATE_ORDER',
                            orderId: notificationData.orderId,
                            action: notificationData.action || 'open'
                        });
                    }
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

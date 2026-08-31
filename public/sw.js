// LPUQuick High-Performance PWA Service Worker (V2026.09.01)
const CACHE_NAME = 'lpuquick-pwa-v1';
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
    '/js/app.js',
    '/js/api.js',
    '/js/pwa-install.js',
    '/js/pages/home.js',
    '/js/pages/categories.js',
    '/js/pages/cart.js',
    '/js/pages/checkout.js',
    '/js/pages/orders.js',
    '/js/pages/settings.js',
    '/js/pages/signin.js',
    '/js/pages/flowassist.js'
];

// Install: Cache critical shell assets
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Pre-cache non-fatal note:', err);
            });
        })
    );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch: Stale-While-Revalidate for UI assets; Network-Only for dynamic APIs
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests and API / WebSocket calls
    if (event.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co')) {
        return;
    }

    // Static Assets & Navigation: Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});

// LPUQuick High-Performance Ultra-Fast Service Worker (V2026.09.01-TurboV5)
const CACHE_NAME = 'lpuquick-pwa-v5-turbo';
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
    '/css/styles.css'
];

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

// Activate: Immediately purge all legacy caches and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
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
// 1. Dynamic APIs, WebSockets, Supabase, and Admin -> Direct Network Only (Never cached)
// 2. JavaScript Application Code & HTML -> Network-First (Always loads fresh code, offline fallback)
// 3. Static Media / Images / Fonts -> Cache-First for maximum mobile scrolling speed
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests, dynamic APIs, WebSocket, Supabase, and Admin routes
    if (event.request.method !== 'GET' ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/admin') ||
        url.hostname.includes('supabase.co')) {
        return;
    }

    // 1. Application JavaScript & HTML: NETWORK-FIRST (Guarantees zero stale code on mobile)
    if (url.pathname.endsWith('.js') || url.pathname === '/' || url.pathname.endsWith('.html')) {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' })
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. Static Media, Images, Fonts, Icons: Cache-First for instant 60fps mobile scrolling
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            });
        })
    );
});

// LPUQuick High-Performance Ultra-Fast Service Worker (V2026.09.19-OfflineResilienceV10)
const CACHE_NAME = 'lpuquick-pwa-v10-shell';
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
    '/css/styles.css'
];

// Helper: Fetch with timeout for low-signal / spotty network fallback
function fetchWithTimeout(request, timeoutMs = 2500) {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error('NETWORK_TIMEOUT'));
        }, timeoutMs);

        fetch(request, { signal: controller.signal })
            .then((res) => {
                clearTimeout(timer);
                resolve(res);
            })
            .catch((err) => {
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

// Activate: Immediately purge outdated legacy caches and claim clients
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

// Fetch Strategy with Low-Signal & Offline Resilience:
// 1. Read-only Public Catalog GET APIs -> Network-First with 2.2s timeout fallback to API cache
// 2. JavaScript Application Code & HTML -> Network-First with 1.8s timeout fallback to core shell cache
// 3. Static Media / Images / Fonts -> Cache-First for instant mobile rendering
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests, WebSocket, Supabase direct calls, and Admin routes
    if (event.request.method !== 'GET' ||
        url.pathname.startsWith('/admin') ||
        url.hostname.includes('supabase.co')) {
        return;
    }

    // 1. Read-Only Public Catalog GET APIs: Network-First with 2.2s Low-Signal Timeout Fallback to Cache
    const isPublicCatalogApi = (
        url.pathname === '/api/home' ||
        url.pathname === '/api/banners' ||
        url.pathname.startsWith('/api/products') ||
        url.pathname.startsWith('/api/categories') ||
        url.pathname === '/api/client/status'
    );

    if (isPublicCatalogApi) {
        event.respondWith(
            fetchWithTimeout(event.request, 2200)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(API_CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Spotty / weak connection timeout or offline: serve cached snapshot
                    return caches.open(API_CACHE_NAME).then((cache) => {
                        return cache.match(event.request).then((cached) => {
                            if (cached) return cached;
                            // If no cache, return clean JSON fallback
                            return new Response(JSON.stringify({ offline: true }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                    });
                })
        );
        return;
    }

    // Skip other dynamic APIs (auth, cart mutations, checkout, notifications)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 2. Application Core Shell (HTML, JS, CSS): Network-First with 1.8s Timeout Fallback to Cache
    if (url.pathname.endsWith('.js') || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetchWithTimeout(event.request, 1800)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        if (cached) return cached;
                        if (url.pathname === '/' || url.pathname.endsWith('.html')) {
                            return caches.match('/index.html');
                        }
                        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                    });
                })
        );
        return;
    }

    // 3. Static Media, Images, Fonts, Icons: Cache-First for instant scrolling and low-data consumption
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                return new Response('', { status: 408, statusText: 'Request Timeout' });
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
            // If admin window already open, focus it and notify of order
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
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

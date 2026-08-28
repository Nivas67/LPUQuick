// LPUQuick SPA Router & App Controller
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};
window.CURRENT_USER_ID = window.CURRENT_USER_ID || 'user_001';

const routes = {
    '/': 'home',
    '/signin': 'signin',
    '/categories': 'categories',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/flow-assist': 'flowassist',
    '/orders': 'orders',
    '/settings': 'settings'
};

function navigate(path) {
    window.location.hash = '#' + path;
}

function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
}

function getPageName(path) {
    return routes[path] || 'home';
}

// Router
async function router() {
    const path = getCurrentRoute();
    const pageName = getPageName(path);
    const appRoot = document.getElementById('app');
    
    if (!appRoot) return;

    try {
        const renderFn = window.pages[pageName];
        if (renderFn) {
            const html = await renderFn();
            appRoot.innerHTML = html;
            appRoot.classList.add('page-enter');
            setTimeout(() => appRoot.classList.remove('page-enter'), 200);

            // Initialize page-specific JS
            const initFn = window.pageInits[pageName];
            if (initFn) initFn();

            // Scroll to top on route change
            window.scrollTo(0, 0);
        } else {
            appRoot.innerHTML = `
                <div class="text-center pt-32 px-4">
                    <h1 class="font-headline-md text-2xl font-bold text-on-surface">Page not found</h1>
                    <p class="text-on-surface-variant text-sm mt-2">The requested screen does not exist.</p>
                    <a href="#/" class="mt-4 inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
                </div>
            `;
        }
    } catch (err) {
        console.error('Router error:', err);
        appRoot.innerHTML = `
            <div class="text-center pt-32 px-4">
                <h1 class="font-headline-md text-xl font-bold text-error">Error loading page</h1>
                <p class="text-on-surface-variant text-xs mt-2">${err.message}</p>
                <a href="#/" class="mt-4 inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
            </div>
        `;
    }
}

window.router = router;
window.navigate = navigate;

// Listen for hash changes and load events
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// Trigger initial route if DOM already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    router();
}

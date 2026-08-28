// LPUQuick SPA Router & App Controller
const CURRENT_USER_ID = 'user_001'; // Demo user

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

    // Clear previous page
    appRoot.innerHTML = '<div class="flex items-center justify-center min-h-screen"><span class="material-symbols-outlined text-emerald text-4xl animate-spin">progress_activity</span></div>';

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
        } else {
            appRoot.innerHTML = '<div class="text-center pt-32"><h1 class="font-headline-lg text-on-surface">Page not found</h1></div>';
        }
    } catch (err) {
        console.error('Router error:', err);
        appRoot.innerHTML = `<div class="text-center pt-32"><h1 class="font-headline-lg text-error">Error loading page</h1><p class="text-on-surface-variant mt-4">${err.message}</p></div>`;
    }
}

// Global page registries
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};
window.CURRENT_USER_ID = window.CURRENT_USER_ID || CURRENT_USER_ID;
window.navigate = navigate;

// Listen for hash changes
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// LPUQuick SPA Router & Global Controller
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

if (typeof window.renderBottomNav !== 'function') {
    window.renderBottomNav = function (activeTab = 'home') {
        const norm = String(activeTab || '').toLowerCase().trim();
        if (norm === 'checkout') {
            return '';
        }

        const isHome = norm === 'home' || norm === '/' || norm === '';
        const isCategories = norm === 'categories' || norm === 'category';
        const isCart = norm === 'cart';
        const isOrders = norm === 'orders' || norm === 'order';
        const isProfile = norm === 'profile' || norm === 'settings';

        return `
    <!-- Floating Liquid Glass Bottom Navigation Dock -->
    <div class="fixed bottom-3 inset-x-0 z-40 px-4 sm:hidden pointer-events-none flex justify-center" id="global-bottom-nav-dock">
        <nav class="pointer-events-auto liquid-dock-pill h-14 max-w-md w-full px-3 flex justify-around items-center rounded-full shadow-2xl">
            <a class="${isHome ? 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold bottom-nav-item active' : 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer bottom-nav-item'}" href="#/" title="Home" data-route="home">
                <span class="material-symbols-outlined text-xl"${isHome ? ' style="font-variation-settings: \'FILL\' 1;"' : ''}>home</span>
                <span class="text-[10px] ${isHome ? 'mt-0.5 font-bold' : 'font-semibold mt-0.5'}">Home</span>
            </a>
            <a class="${isCategories ? 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold bottom-nav-item active' : 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer bottom-nav-item'}" href="#/categories" title="Categories" data-route="categories">
                <span class="material-symbols-outlined text-xl"${isCategories ? ' style="font-variation-settings: \'FILL\' 1;"' : ''}>category</span>
                <span class="text-[10px] ${isCategories ? 'mt-0.5 font-bold' : 'font-semibold mt-0.5'}">Categories</span>
            </a>
            <a class="${isCart ? 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold relative bottom-nav-item active' : 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative bottom-nav-item'}" href="#/cart" title="Cart" id="bottom-nav-cart-btn" data-route="cart">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl"${isCart ? ' style="font-variation-settings: \'FILL\' 1;"' : ''}>shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] ${isCart ? 'mt-0.5 font-bold' : 'font-semibold mt-0.5'}">Cart</span>
            </a>
            <a class="${isOrders ? 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold bottom-nav-item active' : 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer bottom-nav-item'}" href="#/orders" title="Orders" data-route="orders">
                <span class="material-symbols-outlined text-xl"${isOrders ? ' style="font-variation-settings: \'FILL\' 1;"' : ''}>receipt_long</span>
                <span class="text-[10px] ${isOrders ? 'mt-0.5 font-bold' : 'font-semibold mt-0.5'}">Orders</span>
            </a>
            <a class="${isProfile ? 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold bottom-nav-item active' : 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer bottom-nav-item'}" href="#/settings" title="Profile" data-route="settings">
                <span class="material-symbols-outlined text-xl"${isProfile ? ' style="font-variation-settings: \'FILL\' 1;"' : ''}>account_circle</span>
                <span class="text-[10px] ${isProfile ? 'mt-0.5 font-bold' : 'font-semibold mt-0.5'}">Profile</span>
            </a>
        </nav>
    </div>`;
    };
}

// Instant 0ms Visual Synchronizer for Bottom Nav Dock
window.syncBottomNavVisualActive = function (activeTab) {
    const norm = String(activeTab || '').toLowerCase().trim();
    const dock = document.getElementById('global-bottom-nav-dock');
    if (norm === 'checkout' || norm.includes('checkout')) {
        if (dock) dock.classList.add('hidden');
        return;
    } else {
        if (dock) dock.classList.remove('hidden');
    }

    const tabName = (norm === '/' || norm === 'home' || !norm) ? 'home'
        : (norm.includes('categor') ? 'categories'
        : (norm.includes('cart') ? 'cart'
        : (norm.includes('order') ? 'orders'
        : (norm.includes('setting') || norm.includes('profile') ? 'settings' : norm))));

    document.querySelectorAll('nav.liquid-dock-pill').forEach(nav => {
        nav.querySelectorAll('a.bottom-nav-item').forEach(a => {
            const route = (a.getAttribute('data-route') || '').toLowerCase();
            const isMatch = (route === tabName) || (tabName === 'home' && (!route || route === 'home')) || (tabName === 'settings' && (route === 'settings' || route === 'profile'));
            const icon = a.querySelector('.material-symbols-outlined');
            const label = a.querySelector('span:not(.material-symbols-outlined):not(.global-cart-count-badge)');

            if (isMatch) {
                if (a.id === 'bottom-nav-cart-btn') {
                    a.className = 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold relative bottom-nav-item active';
                } else {
                    a.className = 'clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold bottom-nav-item active';
                }
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
                if (label) {
                    label.classList.remove('font-semibold');
                    label.classList.add('font-bold');
                }
            } else {
                if (a.id === 'bottom-nav-cart-btn') {
                    a.className = 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative bottom-nav-item';
                } else {
                    a.className = 'flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer bottom-nav-item';
                }
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
                if (label) {
                    label.classList.remove('font-bold');
                    label.classList.add('font-semibold');
                }
            }
        });
    });
};

// Persistent Student Session Management (Permanent Login — Never auto-logout once logged in)
// The student will remain securely logged in until they explicitly click "Log Out"

window.refreshUserActivity = function () {
    if (window.isUserLoggedIn()) {
        try {
            localStorage.setItem('lpuquick_last_active', Date.now().toString());
        } catch (e) { }
    }
};

window.logoutUser = function () {
    try {
        localStorage.removeItem('lpuquick_user');
        localStorage.removeItem('lpuquick_last_active');
        localStorage.removeItem('lpuquick_address_configured');
        localStorage.removeItem('lpuquick_room');
        localStorage.removeItem('lpuquick_phone');
        localStorage.removeItem('lpuquick_address_detail');
    } catch (e) { }
    window.CURRENT_USER_ID = null;
    window.CURRENT_USER_NAME = null;
    window.CURRENT_USER_EMAIL = null;
    window.CURRENT_USER_PICTURE = null;
    window.currentRoom = '';
    window.currentAddressDetail = '';
    window.location.hash = '#/signin';
};

// Initialize User Session from localStorage (Persistent across restarts/days)
(function initUserSession() {
    try {
        const savedUserStr = localStorage.getItem('lpuquick_user');

        if (savedUserStr) {
            const savedUser = JSON.parse(savedUserStr);
            const uid = savedUser?.id || savedUser?.user_id || savedUser?.uid;
            if (uid) {
                // Session is VALID & PERMANENT - User stays logged in on all visits!
                window.CURRENT_USER_ID = uid;
                window.CURRENT_USER_NAME = savedUser.name || 'LPU Student';
                window.CURRENT_USER_EMAIL = savedUser.email || '';
                window.CURRENT_USER_PICTURE = savedUser.picture || '';
                window.currentRoom = localStorage.getItem('lpuquick_room') || '';
                window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || '';
                localStorage.setItem('lpuquick_last_active', Date.now().toString());

                // Respect student's theme preference (default to light)
                if (localStorage.getItem('lpuquick_theme') === 'dark') {
                    document.documentElement.classList.add('dark');
                    if (document.body) document.body.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    if (document.body) document.body.classList.remove('dark');
                }
            }
        }
    } catch (e) {
        console.warn('[Auth Init Error]:', e);
    }
})();

// Attach throttled global user activity listener
let lastActivityTouch = 0;
function handleUserInteraction() {
    const now = Date.now();
    if (now - lastActivityTouch > 15000) { // Throttle writes to localStorage to once every 15s
        lastActivityTouch = now;
        window.refreshUserActivity();
    }
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
        window.addEventListener(evt, handleUserInteraction, { passive: true });
    });
}

window.isUserLoggedIn = function () {
    if (Boolean(window.CURRENT_USER_ID)) return true;
    try {
        const savedUserStr = localStorage.getItem('lpuquick_user');
        if (!savedUserStr) return false;
        const savedUser = JSON.parse(savedUserStr);
        const uid = savedUser?.id || savedUser?.user_id || savedUser?.uid;
        if (uid) {
            window.CURRENT_USER_ID = uid;
            window.CURRENT_USER_NAME = savedUser.name || 'LPU Student';
            window.CURRENT_USER_EMAIL = savedUser.email || '';
            window.CURRENT_USER_PICTURE = savedUser.picture || '';
            return true;
        }
    } catch (e) { }
    return false;
};

window.getEffectiveUserId = function () {
    if (window.isUserLoggedIn()) return window.CURRENT_USER_ID;
    let guestId = localStorage.getItem('lpuquick_guest_cart_id');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('lpuquick_guest_cart_id', guestId);
    }
    return guestId;
};

window.cartState = window.cartState || {};

// Address state (Unconfigured until user signs in and sets room)
window.currentHostelId = localStorage.getItem('lpuquick_hostel_id');
if (!window.currentHostelId) {
    const addrDetail = localStorage.getItem('lpuquick_address_detail') || '';
    const match = addrDetail.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
    if (match) {
        window.currentHostelId = match[1].toUpperCase().replace(/\s+/g, '-');
        if (/^[BG]H\d+$/.test(window.currentHostelId)) {
            window.currentHostelId = window.currentHostelId.replace(/^([A-Z]+)(\d+)/, '$1-$2');
        }
    }
}
if (!window.currentHostelId) {
    const addr = localStorage.getItem('lpuquick_address') || '';
    const match = addr.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
    if (match) {
        window.currentHostelId = match[1].toUpperCase().replace(/\s+/g, '-');
        if (/^[BG]H\d+$/.test(window.currentHostelId)) {
            window.currentHostelId = window.currentHostelId.replace(/^([A-Z]+)(\d+)/, '$1-$2');
        }
    }
}
window.currentHostelId = window.currentHostelId || 'BH-13';
window.currentAddress = localStorage.getItem('lpuquick_address') || window.currentHostelId.replace('-', '');
window.currentBlock = localStorage.getItem('lpuquick_block') || 'Block A';
window.currentRoom = localStorage.getItem('lpuquick_room') || '';
window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || '';

// Theme state & global theme toggle manager
window.setNightMode = function () {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
    localStorage.setItem('lpuquick_theme', 'dark');
    window.syncAllThemeToggles();
};

window.setLightMode = function () {
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
    localStorage.setItem('lpuquick_theme', 'light');
    window.syncAllThemeToggles();
};

window.toggleTheme = function () {
    const isCurrentlyDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
    if (isCurrentlyDark) {
        window.setLightMode();
    } else {
        window.setNightMode();
    }
};

window.syncAllThemeToggles = function () {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
    document.querySelectorAll('.theme-toggle-switch').forEach(toggle => {
        toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
        toggle.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        const thumb = toggle.querySelector('.theme-toggle-thumb');
        const sunIcon = toggle.querySelector('.theme-sun-icon');
        const moonIcon = toggle.querySelector('.theme-moon-icon');
        const isMobile = toggle.classList.contains('w-[54px]');
        const translateDist = isMobile ? '26px' : '30px';

        if (thumb) {
            thumb.style.transform = isDark ? `translateX(${translateDist})` : 'translateX(0px)';
        }
        if (sunIcon && moonIcon) {
            if (isDark) {
                sunIcon.classList.add('opacity-40', 'text-slate-400');
                sunIcon.classList.remove('opacity-100', 'text-slate-800');
                moonIcon.classList.add('opacity-100', 'text-slate-100');
                moonIcon.classList.remove('opacity-40', 'text-slate-400');
            } else {
                sunIcon.classList.add('opacity-100', 'text-slate-800');
                sunIcon.classList.remove('opacity-40', 'text-slate-400');
                moonIcon.classList.add('opacity-40', 'text-slate-400');
                moonIcon.classList.remove('opacity-100', 'text-slate-100');
            }
        }
    });

    const settingsToggle = document.getElementById('toggle-darkmode');
    if (settingsToggle) {
        settingsToggle.checked = isDark;
    }
};

// Respect user theme preference (light by default)
if (localStorage.getItem('lpuquick_theme') === 'dark') {
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
}

const routes = {
    '/': 'home',
    '/signin': 'signin',
    '/categories': 'categories',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/flow-assist': 'flowassist',
    '/orders': 'orders',
    '/settings': 'settings',
    '/rider-earnings': 'rider_earnings',
    '/blocked': 'blocked'
};

function navigate(path) {
    const cleanPath = (path || '/').startsWith('#') ? (path || '/').slice(1) : (path || '/');
    const targetHash = '#' + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
    if (window.location.hash === targetHash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof router === 'function') router();
    } else {
        window.location.hash = targetHash;
    }
}
window.navigate = navigate;

// Global fallback for banner target navigation
window.handleBannerTargetClick = window.handleBannerTargetClick || function (targetUrl, event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    let url = (targetUrl || '').trim() || '#shop-catalog-section';
    const isTelOrMail = /^(tel:|mailto:|whatsapp:)/i.test(url);
    const isWhatsAppShort = /^wa\.me\//i.test(url) || /^api\.whatsapp\.com\//i.test(url);
    const isExternalHttp = /^(https?:|\/\/)/i.test(url) || isWhatsAppShort;

    if (isWhatsAppShort) url = 'https://' + url;
    if (isTelOrMail) { window.location.href = url; return; }
    if (isExternalHttp) {
        try {
            const win = window.open(url, '_blank', 'noopener,noreferrer');
            if (!win || win.closed || typeof win.closed === 'undefined') window.location.href = url;
        } catch (e) { window.location.href = url; }
        return;
    }

    const cleanAnchorId = url.replace(/^[#/]+/, '');
    const isAnchorRequest = url.startsWith('#') && !url.startsWith('#/');
    const targetEl = document.getElementById(cleanAnchorId) || (isAnchorRequest ? document.querySelector(url) : null);
    if (targetEl) {
        const headerOffset = 76;
        const offsetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, offsetPos), behavior: 'smooth' });
        targetEl.classList.add('ring-2', 'ring-emerald-500/60', 'transition-all');
        setTimeout(() => targetEl.classList.remove('ring-2', 'ring-emerald-500/60'), 1500);
        return;
    }

    if (cleanAnchorId === 'shop-catalog-section' || cleanAnchorId === 'home-main-products-grid') {
        sessionStorage.setItem('lpuquick_pending_scroll', cleanAnchorId);
        window.location.hash = '#/';
        return;
    }

    let routePath = url.replace(/^[#/]+/, '');
    window.location.hash = '#/' + (routePath || '');
};

function getCurrentRoute() {
    let hash = window.location.hash.slice(1) || '/';
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
        hash = hash.substring(0, queryIndex);
    }
    if (!hash.startsWith('/')) {
        hash = '/' + hash;
    }
    if (hash.length > 1 && hash.endsWith('/')) {
        hash = hash.slice(0, -1);
    }
    return hash;
}

function getPageName(path) {
    return routes[path] || 'home';
}

// Address Configuration State Helper (Accepts both room drops and designated Gate drop points)
window.hasUserConfiguredAddress = function () {
    const isConfigured = localStorage.getItem('lpuquick_address_configured') === 'true';
    const block = (localStorage.getItem('lpuquick_block') || window.currentBlock || '').toLowerCase();
    const isGate = block.includes('gate');
    const room = (localStorage.getItem('lpuquick_room') || '').replace(/\D/g, '');
    const phone = (localStorage.getItem('lpuquick_phone') || '').replace(/\D/g, '');
    const hasValidLocation = isGate || room.length > 0;
    return isConfigured && hasValidLocation && phone.length === 10;
};

// Global Address Selection Modal (Multi-Hostel Live Selection, Dynamic Blocks from Admin, Room No, Phone)
window.openAddressModal = function (isMandatorySetup = false, onComplete = null) {
    let resendInterval = null;
    let onHostelsLiveUpdateHandler = null;

    const existing = document.getElementById('address-modal');
    if (existing) existing.remove();

    function parseBlocks(raw) {
        if (Array.isArray(raw) && raw.length > 0) {
            return raw.map(b => String(b).trim()).filter(Boolean);
        }
        if (typeof raw === 'string' && raw.trim().length > 0) {
            try {
                const p = JSON.parse(raw);
                if (Array.isArray(p) && p.length > 0) return p.map(b => String(b).trim()).filter(Boolean);
            } catch (e) {}
            return raw.split(',').map(b => b.trim()).filter(Boolean);
        }
        return ['Block A', 'Block B'];
    }

    // Instant 0ms Synchronous Active Hostels Lookup from in-memory cache or local storage
    let liveHostels = window.__activeHostelsCache;
    if (!Array.isArray(liveHostels) || liveHostels.length === 0) {
        try {
            const stored = localStorage.getItem('lpuquick_active_hostels');
            if (stored) liveHostels = JSON.parse(stored);
        } catch (e) { }
    }
    if (!Array.isArray(liveHostels) || liveHostels.length === 0) {
        liveHostels = [
            { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE', blocks: ['Block A', 'Block B', 'Hostel Main Gate'] },
            { id: 'GH12', name: 'Girls Hostel 12', status: 'ACTIVE', blocks: ['Block A', 'Block B', 'Block C', 'Hostel Main Gate'] },
            { id: 'GH 11', name: 'Girls Hostel 11', status: 'ACTIVE', blocks: ['Block A', 'Block B', 'Hostel Main Gate'] },
            { id: 'BH-12', name: 'Boys Hostel 12', status: 'ACTIVE', blocks: ['Block A', 'Block B'] },
            { id: 'GH-1', name: 'Girls Hostel 1', status: 'ACTIVE', blocks: ['Block A'] },
            { id: 'GH-2', name: 'Girls Hostel 2', status: 'ACTIVE', blocks: ['Block A'] },
            { id: 'GH-3', name: 'Girls Hostel 3', status: 'ACTIVE', blocks: ['Block A'] },
            { id: 'GH-4', name: 'Girls Hostel 4', status: 'ACTIVE', blocks: ['Block A'] }
        ];
    }

    // Robust hostel normalization helper: strips spaces, hyphens, underscores and handles prefixes
    function normalizeHostelKey(str) {
        if (!str) return '';
        let s = String(str).toUpperCase().replace(/[\s\-_]/g, '');
        s = s.replace(/^BOYSHOSTEL/, 'BH').replace(/^GIRLSHOSTEL/, 'GH');
        return s;
    }

    const activeKeySet = new Set();
    const liveHostelMap = new Map();
    let allLocations = [];

    function populateLocations() {
        activeKeySet.clear();
        liveHostelMap.clear();

        (liveHostels || []).forEach(h => {
            if (!h || h.status === 'OFF') return;
            const idClean = normalizeHostelKey(h.id);
            const nameClean = normalizeHostelKey(h.name);
            if (idClean) {
                activeKeySet.add(idClean);
                liveHostelMap.set(idClean, h);
            }
            if (nameClean) {
                activeKeySet.add(nameClean);
                if (!liveHostelMap.has(nameClean)) liveHostelMap.set(nameClean, h);
            }
            const numMatch = (h.id || '').match(/\d+/);
            if (numMatch) {
                const num = numMatch[0];
                const isBH = (h.id || '').toUpperCase().includes('BH') || (h.name || '').toUpperCase().includes('BOYS');
                const isGH = (h.id || '').toUpperCase().includes('GH') || (h.name || '').toUpperCase().includes('GIRLS');
                if (isBH) {
                    activeKeySet.add('BH' + num);
                    if (!liveHostelMap.has('BH' + num)) liveHostelMap.set('BH' + num, h);
                }
                if (isGH) {
                    activeKeySet.add('GH' + num);
                    if (!liveHostelMap.has('GH' + num)) liveHostelMap.set('GH' + num, h);
                }
            }
            const nameNumMatch = (h.name || '').match(/\d+/);
            if (nameNumMatch) {
                const num = nameNumMatch[0];
                const isBH = (h.name || '').toUpperCase().includes('BOYS') || (h.name || '').toUpperCase().includes('BH');
                const isGH = (h.name || '').toUpperCase().includes('GIRLS') || (h.name || '').toUpperCase().includes('GH');
                if (isBH) {
                    activeKeySet.add('BH' + num);
                    if (!liveHostelMap.has('BH' + num)) liveHostelMap.set('BH' + num, h);
                }
                if (isGH) {
                    activeKeySet.add('GH' + num);
                    if (!liveHostelMap.has('GH' + num)) liveHostelMap.set('GH' + num, h);
                }
            }
        });

        // Fallback: If no active hostels found, default BH-13 & GH-12 as live
        if (activeKeySet.size === 0) {
            activeKeySet.add('BH13');
            liveHostelMap.set('BH13', { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE', blocks: ['Block A', 'Block B', 'Hostel Main Gate'] });
            activeKeySet.add('GH12');
            liveHostelMap.set('GH12', { id: 'GH12', name: 'Girls Hostel 12', status: 'ACTIVE', blocks: ['Block A', 'Block B', 'Block C', 'Hostel Main Gate'] });
        }

        // Complete standard campus hostels across all LPU corridors
        const defaultHostels = [
            'BH13', 'BH12', 'GH12', 'GH11', 'GH1', 'GH2', 'GH3', 'GH4',
            'BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'BH7', 'BH8', 'BH9', 'BH10', 'BH14', 'BH15', 'BH16',
            'GH5', 'GH6', 'GH7', 'GH8', 'GH9', 'GH10', 'GH13', 'GH14',
            'UniMall'
        ];

        // Combine custom active hostels from admin with default locations
        const knownKeys = new Set(defaultHostels.map(normalizeHostelKey));
        (liveHostels || []).forEach(h => {
            if (!h || h.status === 'OFF') return;
            const k = normalizeHostelKey(h.id);
            if (k && !knownKeys.has(k)) {
                defaultHostels.push(h.id);
                knownKeys.add(k);
            }
        });

        allLocations = defaultHostels.map(loc => {
            const cleanKey = normalizeHostelKey(loc);
            const isActive = activeKeySet.has(cleanKey);
            const matchedLive = liveHostelMap.get(cleanKey);
            const canonId = matchedLive ? matchedLive.id : (loc.startsWith('BH') || loc.startsWith('GH') ? loc.replace(/^([A-Z]+)(\d+)/, '$1-$2') : loc);
            const blocks = (matchedLive && matchedLive.blocks)
                ? parseBlocks(matchedLive.blocks)
                : ['Block A', 'Block B'];
            return {
                id: canonId,
                name: loc,
                displayName: matchedLive?.name || loc,
                active: isActive,
                blocks: blocks,
                tag: isActive ? 'Live 3m' : 'Coming Soon'
            };
        });

        // Active hostels go to the top ("GOES UP ON THE IMAGE")
        allLocations.sort((a, b) => {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return 0;
        });
    }

    populateLocations();

    function getHostelBlocks(hostelKeyOrId) {
        if (!hostelKeyOrId) return ['Block A', 'Block B'];
        const clean = normalizeHostelKey(hostelKeyOrId);
        const found = allLocations.find(h => normalizeHostelKey(h.id) === clean || normalizeHostelKey(h.name) === clean);
        if (found && found.blocks && found.blocks.length > 0) {
            return parseBlocks(found.blocks);
        }
        const matched = liveHostelMap.get(clean);
        if (matched && matched.blocks && matched.blocks.length > 0) {
            return parseBlocks(matched.blocks);
        }
        return ['Block A', 'Block B'];
    }

    let selectedHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id');
    if (!selectedHostel) {
        const addrDetail = localStorage.getItem('lpuquick_address_detail') || '';
        const match = addrDetail.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
        if (match) {
            selectedHostel = match[1].toUpperCase().replace(/\s+/g, '-');
            if (/^[BG]H\d+$/.test(selectedHostel)) {
                selectedHostel = selectedHostel.replace(/^([A-Z]+)(\d+)/, '$1-$2');
            }
        }
    }
    selectedHostel = selectedHostel || 'BH-13';

    // If currently selected hostel is inactive, switch to the first active hostel
    const isSelectedActive = allLocations.some(h => (normalizeHostelKey(h.id) === normalizeHostelKey(selectedHostel) || normalizeHostelKey(h.name) === normalizeHostelKey(selectedHostel)) && h.active);
    if (!isSelectedActive) {
        const firstActive = allLocations.find(h => h.active);
        if (firstActive) {
            selectedHostel = firstActive.id;
        }
    }

    let currentHostelBlocks = getHostelBlocks(selectedHostel);
    let selectedBlock = window.currentBlock || localStorage.getItem('lpuquick_block') || currentHostelBlocks[0] || 'Block A';
    if (!currentHostelBlocks.includes(selectedBlock)) {
        selectedBlock = currentHostelBlocks[0] || 'Block A';
    }
    const savedRoom = window.currentRoom || localStorage.getItem('lpuquick_room') || '';
    let savedPhone = localStorage.getItem('lpuquick_phone') || '';
    if (savedPhone === '7671836211' || savedPhone === '7671836211') savedPhone = '';

    const liveDisplayNames = allLocations.filter(h => h.active).map(h => h.name).join(', ') || 'BH13';

    const modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md';
    modal.innerHTML = `
        <div class="glass-panel p-6 space-y-4 max-w-sm w-full rounded-3xl max-h-[88vh] overflow-y-auto border border-[var(--glass-border)] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <!-- Screen 1: Address Details Form -->
            <div id="address-form-screen" class="space-y-4">
                <!-- Header -->
                <div class="flex justify-between items-center pb-3 border-b border-[var(--glass-border)]">
                    <div class="flex items-center gap-2.5">
                        <div class="clay-pill w-9 h-9 rounded-xl text-emerald-500 flex items-center justify-center">
                            <span class="material-symbols-outlined text-base">location_on</span>
                        </div>
                        <div>
                            <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">${isMandatorySetup ? 'Delivery Address Required' : 'Select Delivery Location'}</h3>
                            <p class="text-[10px] text-slate-400 font-medium">LPU Campus 3-Min Delivery</p>
                        </div>
                    </div>
                    ${isMandatorySetup ? `
                    <span class="liquid-badge text-[10px] font-bold px-2.5 py-0.5">Step 2</span>
                    ` : `
                    <button type="button" id="close-address-modal-btn" class="clay-pill w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                    `}
                </div>

                <!-- Notice Banner -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    <span class="material-symbols-outlined text-base text-emerald">bolt</span>
                    <span>Express 3-min delivery live at <b>${liveDisplayNames}</b>! Direct room drop.</span>
                </div>

                <!-- Hostel Selector Grid -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center text-xs">
                        <label class="font-bold text-slate-700 dark:text-slate-300">Hostel</label>
                        <span class="text-[10px] text-emerald-500 font-bold" id="selected-hostel-active-label">${selectedHostel} Selected</span>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-0.5 no-scrollbar" id="hostels-container">
                        ${allLocations.map(h => {
            const isSelected = h.active && (normalizeHostelKey(h.id) === normalizeHostelKey(selectedHostel) || normalizeHostelKey(h.name) === normalizeHostelKey(selectedHostel));
            const activeClass = h.active
                ? (isSelected ? 'clay-pill text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 bg-emerald-500/15' : 'clay-card text-slate-700 dark:text-slate-300 hover:border-emerald')
                : 'clay-card text-slate-400 dark:text-slate-500 opacity-60 hover:border-amber-400/50';
            return `
                            <button type="button" class="p-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1 hostel-pick-btn cursor-pointer ${activeClass}" data-hostel="${h.name}" data-hostel-id="${h.id}" data-active="${h.active ? 'true' : 'false'}">
                                <span>${h.name}</span>
                                <span class="${h.active ? 'bg-emerald text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} text-[8px] px-1.5 py-0.2 rounded-full font-black">${h.active ? 'Live' : 'Soon'}</span>
                            </button>
                            `;
        }).join('')}
                    </div>
                </div>

                <!-- Block Selector -->
                <div class="space-y-2">
                    <div class="flex justify-between items-center text-xs">
                        <label class="block font-bold text-slate-700 dark:text-slate-300">Block / Drop Point</label>
                        <span class="text-[10px] text-slate-400 font-medium" id="block-count-badge">${currentHostelBlocks.length} Options</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2.5" id="block-selector">
                        <!-- Populated dynamically by renderBlockButtons -->
                    </div>
                </div>

                <!-- Room Number Input -->
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300" for="room-input">Room Number (Digits only) *</label>
                    <input type="tel" inputmode="numeric" pattern="[0-9]*" id="room-input" required class="w-full px-3.5 py-2.5 rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="e.g. 304" value="${savedRoom.replace(/\D/g, '')}">
                </div>

                <!-- Contact Phone Number -->
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center">
                        <label class="block text-xs font-bold text-slate-700 dark:text-slate-300" for="phone-input">Mobile Phone Number <span class="text-rose-500">*</span></label>
                        <span class="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                            <span class="material-symbols-outlined text-xs">phone</span> Delivery Updates
                        </span>
                    </div>
                    <div class="relative">
                        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
                        <input type="tel" inputmode="numeric" pattern="[0-9]*" id="phone-input" maxlength="10" required class="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="10-digit mobile" value="${savedPhone.replace(/\D/g, '')}">
                    </div>
                </div>

                <!-- Inline Validation Alert -->
                <div id="address-validation-alert" class="hidden p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">error</span>
                    <span id="address-validation-msg">Please enter your room number.</span>
                </div>

                <!-- Inline Alert for Blocked Hostels -->
                <div id="blocked-hostel-alert" class="hidden p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">info</span>
                    <span id="blocked-hostel-msg">This hostel is opening soon. Delivering to ${liveDisplayNames} right now.</span>
                </div>

                <!-- Save / Verify Button -->
                <button type="button" id="save-address-btn" class="clay-btn clay-btn-primary w-full py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-transform cursor-pointer">
                    Confirm Address & Deliver to ${selectedHostel} (<span id="btn-block-label">${selectedBlock}</span>)
                </button>
            </div>

            <!-- Screen 2: WhatsApp OTP Verification Screen -->
            <div id="address-otp-screen" class="hidden space-y-4">
                <!-- Header with Back Button -->
                <div class="flex items-center gap-3 pb-3 border-b border-[var(--glass-border)]">
                    <button type="button" id="back-to-form-btn" class="clay-pill w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer">
                        <span class="material-symbols-outlined text-base">arrow_back</span>
                    </button>
                    <div>
                        <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">WhatsApp Verification</h3>
                        <p class="text-[10px] text-slate-400 font-medium">OTP sent to +91 <span id="otp-phone-display" class="font-bold text-emerald-500"></span></p>
                    </div>
                </div>

                <!-- WhatsApp Delivery Notice -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    <span class="material-symbols-outlined text-base text-emerald-500 shrink-0">mark_chat_read</span>
                    <span>Please enter the 6-digit verification code sent to your WhatsApp:</span>
                </div>

                <!-- OTP Error Box -->
                <div id="otp-error-box" class="hidden p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">error</span>
                    <span id="otp-error-text">Invalid verification code.</span>
                </div>

                <!-- 6-Digit Auto-Advancing Input Matrix -->
                <div class="space-y-2 text-center pt-1">
                    <div class="flex justify-center gap-1.5 sm:gap-2" id="otp-boxes-wrapper">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="0">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="1">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="2">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="3">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="4">
                        <input type="tel" inputmode="numeric" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all" data-idx="5">
                    </div>
                </div>

                <!-- Verify Button -->
                <button type="button" id="submit-otp-verify-btn" class="clay-btn clay-btn-primary w-full py-3 rounded-2xl text-xs font-black shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">verified</span>
                    <span>Verify Code & Confirm Address</span>
                </button>

                <!-- Resend Timer -->
                <div class="text-center pt-1">
                    <p class="text-xs text-slate-400 font-medium">
                        Didn't receive WhatsApp message? <button type="button" id="resend-otp-link" class="text-emerald-500 font-bold underline cursor-pointer disabled:opacity-50" disabled>Resend Code (<span id="resend-timer-sec">30</span>s)</button>
                    </p>
                </div>
            </div>
        </div>
    `;

    const closeModal = () => {
        if (onHostelsLiveUpdateHandler) {
            window.removeEventListener('lpuquick:hostels_updated', onHostelsLiveUpdateHandler);
        }
        if (resendInterval) clearInterval(resendInterval);
        modal.remove();
        if (typeof onComplete === 'function') {
            onComplete();
        }
    };

    if (!isMandatorySetup) {
        modal.onclick = closeModal;
    }
    const closeBtn = modal.querySelector('#close-address-modal-btn');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    document.body.appendChild(modal);

    // Enforce strictly numeric input in real-time
    const roomInput = modal.querySelector('#room-input');
    if (roomInput) {
        roomInput.oninput = () => {
            roomInput.value = roomInput.value.replace(/\D/g, '');
        };
    }

    const phoneInput = modal.querySelector('#phone-input');
    if (phoneInput) {
        phoneInput.oninput = () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '');
        };
    }

    // Active hostel click handler
    function bindHostelClickHandlers() {
        modal.querySelectorAll('.hostel-pick-btn').forEach(btn => {
            btn.onclick = () => {
                const isActive = btn.dataset.active === 'true';
                const chosenName = btn.dataset.hostel;
                const chosenId = btn.dataset.hostelId || chosenName;

                if (!isActive) {
                    const alertBox = modal.querySelector('#blocked-hostel-alert');
                    const alertMsg = modal.querySelector('#blocked-hostel-msg');
                    if (alertBox && alertMsg) {
                        alertBox.classList.remove('hidden');
                        alertMsg.textContent = `${chosenName} is opening soon! Express delivery is currently active at ${allLocations.filter(h => h.active).map(h => h.name).join(', ') || 'BH13'}.`;
                    }
                    return;
                }

                const alertBox = modal.querySelector('#blocked-hostel-alert');
                if (alertBox) alertBox.classList.add('hidden');

                if (chosenId) {
                    selectedHostel = chosenId;

                    modal.querySelectorAll('.hostel-pick-btn').forEach(b => {
                        b.classList.remove('clay-pill', 'text-emerald-600', 'dark:text-emerald-400', 'border-emerald-500/40', 'bg-emerald-500/15');
                        if (b.dataset.active === 'true') {
                            b.classList.add('clay-card', 'text-slate-700', 'dark:text-slate-300');
                        } else {
                            b.classList.add('clay-card', 'text-slate-400', 'dark:text-slate-500', 'opacity-60');
                        }
                    });
                    btn.classList.add('clay-pill', 'text-emerald-600', 'dark:text-emerald-400', 'border-emerald-500/40', 'bg-emerald-500/15');
                    btn.classList.remove('clay-card');

                    const hLabel = modal.querySelector('#selected-hostel-active-label');
                    if (hLabel) hLabel.textContent = `${selectedHostel} Selected`;

                    // Update blocks dynamically for newly picked hostel
                    renderBlockButtons(selectedHostel);

                    // INSTANT PERSISTENCE: Save immediately to state and storage
                    window.currentHostelId = selectedHostel;
                    window.currentAddress = selectedHostel.replace('-', '');
                    localStorage.setItem('lpuquick_hostel_id', selectedHostel);
                    localStorage.setItem('lpuquick_address', window.currentAddress);

                    const currentRoomVal = (modal.querySelector('#room-input')?.value || savedRoom || '').trim().replace(/\D/g, '');
                    if (currentRoomVal) {
                        window.currentRoom = currentRoomVal;
                        localStorage.setItem('lpuquick_room', currentRoomVal);
                        window.currentAddressDetail = `${selectedHostel} (${selectedBlock}), Room ${currentRoomVal}`;
                        localStorage.setItem('lpuquick_address_detail', window.currentAddressDetail);
                    }
                    localStorage.setItem('lpuquick_address_configured', 'true');

                    if (window.api && typeof window.api.clearProductsCache === 'function') {
                        window.api.clearProductsCache();
                    }

                    if (typeof window.syncStoreAvailability === 'function') {
                        window.syncStoreAvailability(selectedHostel);
                    }
                }
            };
        });
    }

    function renderHostelsGrid() {
        const grid = modal.querySelector('#hostels-container');
        if (!grid) return;
        grid.innerHTML = allLocations.map(h => {
            const isSelected = h.active && (normalizeHostelKey(h.id) === normalizeHostelKey(selectedHostel) || normalizeHostelKey(h.name) === normalizeHostelKey(selectedHostel));
            const activeClass = h.active
                ? (isSelected ? 'clay-pill text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 bg-emerald-500/15' : 'clay-card text-slate-700 dark:text-slate-300 hover:border-emerald')
                : 'clay-card text-slate-400 dark:text-slate-500 opacity-60 hover:border-amber-400/50';
            return `
                <button type="button" class="p-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-1 hostel-pick-btn cursor-pointer ${activeClass}" data-hostel="${h.name}" data-hostel-id="${h.id}" data-active="${h.active ? 'true' : 'false'}">
                    <span>${h.name}</span>
                    <span class="${h.active ? 'bg-emerald text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'} text-[8px] px-1.5 py-0.2 rounded-full font-black">${h.active ? 'Live' : 'Soon'}</span>
                </button>
            `;
        }).join('');
        bindHostelClickHandlers();
    }

    bindHostelClickHandlers();

    // Dynamic Block Renderer for Selected Hostel
    function renderBlockButtons(hostelId) {
        const blockContainer = modal.querySelector('#block-selector');
        if (!blockContainer) return;

        const blocks = getHostelBlocks(hostelId);
        const countBadge = modal.querySelector('#block-count-badge');
        if (countBadge) countBadge.textContent = `${blocks.length} Option${blocks.length === 1 ? '' : 's'}`;

        // If currently selected block is not in this hostel's blocks, default to first block
        if (!blocks.includes(selectedBlock)) {
            selectedBlock = blocks[0] || 'Block A';
        }

        // Responsive grid layout based on number of blocks
        if (blocks.length <= 2) {
            blockContainer.className = 'grid grid-cols-2 gap-2.5';
        } else if (blocks.length === 3) {
            blockContainer.className = 'grid grid-cols-3 gap-2';
        } else if (blocks.length === 4) {
            blockContainer.className = 'grid grid-cols-2 sm:grid-cols-4 gap-2';
        } else {
            blockContainer.className = 'grid grid-cols-2 sm:grid-cols-3 gap-2';
        }

        blockContainer.innerHTML = blocks.map((block, idx) => {
            const isSelected = selectedBlock === block;
            const blockStr = String(block || '').trim();
            const isGate = blockStr.toLowerCase().includes('gate');
            const icon = isGate ? 'sensor_door' : 'apartment';
            const isOddLast = (blocks.length % 2 === 1) && (idx === blocks.length - 1) && blocks.length > 2;
            const colSpanClass = isOddLast ? 'col-span-2 sm:col-span-1' : '';
            const activeClass = isSelected
                ? 'clay-btn-primary text-white shadow-sm'
                : 'clay-card text-slate-700 dark:text-slate-300 hover:border-emerald-500/50';

            return `
                <button type="button" class="py-2.5 px-3 rounded-xl text-xs font-bold transition-transform active:scale-95 block-btn flex items-center justify-center gap-1.5 cursor-pointer ${colSpanClass} ${activeClass}" data-block="${blockStr}">
                    <span class="material-symbols-outlined text-sm pointer-events-none">${icon}</span>
                    <span class="pointer-events-none">${blockStr}</span>
                </button>
            `;
        }).join('');

        blockContainer.querySelectorAll('.block-btn').forEach(btn => {
            btn.onclick = () => {
                blockContainer.querySelectorAll('.block-btn').forEach(b => {
                    b.classList.remove('clay-btn-primary', 'text-white', 'shadow-sm');
                    b.classList.add('clay-card', 'text-slate-700', 'dark:text-slate-300');
                });
                btn.classList.remove('clay-card', 'text-slate-700', 'dark:text-slate-300');
                btn.classList.add('clay-btn-primary', 'text-white', 'shadow-sm');

                selectedBlock = btn.dataset.block;
                const label = modal.querySelector('#btn-block-label');
                if (label) label.textContent = selectedBlock;
                const btnSave = modal.querySelector('#save-address-btn');
                if (btnSave) {
                    btnSave.innerHTML = `Confirm Address & Deliver to ${selectedHostel} (<span id="btn-block-label">${selectedBlock}</span>)`;
                }

                // Adjust room number label and placeholder if Hostel Main Gate
                const isGate = selectedBlock.toLowerCase().includes('gate');
                const roomLabel = modal.querySelector('label[for="room-input"]');
                const roomInp = modal.querySelector('#room-input');
                if (isGate) {
                    if (roomLabel) roomLabel.innerHTML = 'Room Number / Meeting Point (Optional for Hostel Main Gate)';
                    if (roomInp) roomInp.placeholder = 'Optional (e.g. Gate 1, Security Desk)';
                } else {
                    if (roomLabel) roomLabel.innerHTML = 'Room Number (Digits only) *';
                    if (roomInp) roomInp.placeholder = 'e.g. 304';
                }
            };
        });

        const label = modal.querySelector('#btn-block-label');
        if (label) label.textContent = selectedBlock;
        const btnSave = modal.querySelector('#save-address-btn');
        if (btnSave) {
            btnSave.innerHTML = `Confirm Address & Deliver to ${selectedHostel} (<span id="btn-block-label">${selectedBlock}</span>)`;
        }

        const isGate = selectedBlock.toLowerCase().includes('gate');
        const roomLabel = modal.querySelector('label[for="room-input"]');
        const roomInp = modal.querySelector('#room-input');
        if (isGate) {
            if (roomLabel) roomLabel.innerHTML = 'Room Number / Meeting Point (Optional for Hostel Main Gate)';
            if (roomInp) roomInp.placeholder = 'Optional (e.g. Gate 1, Security Desk)';
        } else {
            if (roomLabel) roomLabel.innerHTML = 'Room Number (Digits only) *';
            if (roomInp) roomInp.placeholder = 'e.g. 304';
        }
    }

    // Initial render of blocks
    renderBlockButtons(selectedHostel);

    // Live SWR Revalidation to sync updated blocks & hostels from Admin immediately
    const onHostelsSync = (incomingList) => {
        if (!Array.isArray(incomingList) || incomingList.length === 0) return;
        if (!document.getElementById('address-modal')) return;
        liveHostels = incomingList;
        populateLocations();
        renderHostelsGrid();
        renderBlockButtons(selectedHostel);
    };

    if (window.api && typeof window.api.getActiveHostels === 'function') {
        window.api.getActiveHostels(true).then(list => {
            onHostelsSync(list);
        }).catch(() => {});
    }

    onHostelsLiveUpdateHandler = (e) => {
        if (e.detail) onHostelsSync(e.detail);
    };
    window.addEventListener('lpuquick:hostels_updated', onHostelsLiveUpdateHandler);

    // Disabled hostels click handler
    modal.querySelectorAll('.hostel-disabled-btn').forEach(btn => {
        btn.onclick = () => {
            const hName = btn.dataset.hostel;
            const alertBox = document.getElementById('blocked-hostel-alert');
            const alertMsg = document.getElementById('blocked-hostel-msg');
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = `${hName} is opening soon! Select an active hostel for now.`;
            }
        };
    });

    // Helper to finalize address saving
    function finalizeAddressSave(room, phone) {
        window.currentHostelId = selectedHostel;
        window.currentAddress = selectedHostel.replace('-', '');
        window.currentBlock = selectedBlock;
        window.currentRoom = room || '';

        const isMainGate = selectedBlock && selectedBlock.toLowerCase().includes('gate');
        if (isMainGate && !room) {
            window.currentAddressDetail = `${selectedHostel} (${selectedBlock})`;
        } else {
            window.currentAddressDetail = `${selectedHostel} (${selectedBlock})${room ? `, Room ${room}` : ''}`;
        }

        localStorage.setItem('lpuquick_hostel_id', window.currentHostelId);
        localStorage.setItem('lpuquick_address', window.currentAddress);
        localStorage.setItem('lpuquick_block', window.currentBlock);
        localStorage.setItem('lpuquick_room', window.currentRoom);
        if (phone) {
            localStorage.setItem('lpuquick_phone', phone);
            localStorage.setItem('lpuquick_phone_verified_' + phone, 'true');
        }
        localStorage.setItem('lpuquick_address_configured', 'true');
        localStorage.setItem('lpuquick_address_detail', window.currentAddressDetail);

        // Update home address display pill if on home page
        const headerAddr = document.querySelector('#btn-header-address strong');
        if (headerAddr) {
            const shortBlock = selectedBlock.replace(/^Hostel\s*/i, '');
            headerAddr.textContent = `${window.currentAddress} • ${shortBlock}`;
        }

        // Sync with backend profile
        if (window.isUserLoggedIn() && window.api?.updateAddress) {
            window.api.updateAddress(window.CURRENT_USER_ID, selectedHostel, selectedBlock, room, phone);
        }

        if (typeof window.syncStoreAvailability === 'function') {
            window.syncStoreAvailability(selectedHostel);
        }

        if (window.api && typeof window.api.clearProductsCache === 'function') {
            window.api.clearProductsCache();
        }

        if (onHostelsLiveUpdateHandler) {
            window.removeEventListener('lpuquick:hostels_updated', onHostelsLiveUpdateHandler);
        }
        if (resendInterval) clearInterval(resendInterval);
        modal.remove();

        if (typeof window.showClientToast === 'function') {
            window.showClientToast(`✓ Delivery address verified & set to ${selectedHostel}!`, 'success', 'check_circle');
        }

        if (typeof onComplete === 'function') {
            onComplete();
        } else {
            router();
        }
    }

    // OTP Timer & Screen Flow
    function startResendTimer() {
        if (resendInterval) clearInterval(resendInterval);
        let left = 30;
        const timerSec = modal.querySelector('#resend-timer-sec');
        const resendBtn = modal.querySelector('#resend-otp-link');
        if (resendBtn) resendBtn.disabled = true;
        if (timerSec) timerSec.textContent = left;

        resendInterval = setInterval(() => {
            left -= 1;
            if (timerSec) timerSec.textContent = left;
            if (left <= 0) {
                clearInterval(resendInterval);
                if (resendBtn) {
                    resendBtn.disabled = false;
                    resendBtn.textContent = 'Resend WhatsApp Code';
                }
            }
        }, 1000);
    }

    async function launchOtpFlow(phoneToVerify) {
        const userId = window.getEffectiveUserId();
        const addressFormScreen = modal.querySelector('#address-form-screen');
        const otpScreen = modal.querySelector('#address-otp-screen');
        const errBox = modal.querySelector('#otp-error-box');
        const alertBox = modal.querySelector('#address-validation-alert');
        const alertMsg = modal.querySelector('#address-validation-msg');

        if (alertBox) alertBox.classList.add('hidden');
        if (errBox) errBox.classList.add('hidden');

        const btnSave = modal.querySelector('#save-address-btn');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin mr-1">sync</span> Sending WhatsApp Code...`;
        }

        try {
            const sendRes = await window.api.sendOtp(phoneToVerify, userId);
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `Confirm Address & Deliver to ${selectedHostel} (<span id="btn-block-label">${selectedBlock}</span>)`;
            }

            if (!sendRes || !sendRes.success) {
                throw new Error(sendRes?.error || 'Unable to send WhatsApp OTP. Please try again.');
            }

            // Switch screen to OTP
            if (addressFormScreen) addressFormScreen.classList.add('hidden');
            if (otpScreen) otpScreen.classList.remove('hidden');

            const phoneDisp = modal.querySelector('#otp-phone-display');
            if (phoneDisp) phoneDisp.textContent = phoneToVerify;

            // Clear inputs and focus first box
            const boxes = modal.querySelectorAll('.otp-box');
            boxes.forEach(b => b.value = '');
            if (boxes[0]) boxes[0].focus();

            startResendTimer();
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`💬 Verification code sent to WhatsApp on +91 ${phoneToVerify}`, 'success', 'chat');
            }
        } catch (err) {
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = `Confirm Address & Deliver to ${selectedHostel} (<span id="btn-block-label">${selectedBlock}</span>)`;
            }
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = err.message || 'Could not send WhatsApp verification code.';
            } else if (typeof window.showClientToast === 'function') {
                window.showClientToast(err.message || 'Could not send WhatsApp OTP', 'error', 'error');
            }
        }
    }

    // OTP Boxes Auto-Advancing & Keyboard Management
    const otpBoxes = modal.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, idx) => {
        box.oninput = () => {
            const val = box.value.replace(/\D/g, '');
            box.value = val ? val[0] : '';
            if (val && idx < otpBoxes.length - 1) {
                otpBoxes[idx + 1].focus();
            }
        };

        box.onkeydown = (e) => {
            if (e.key === 'Backspace' && !box.value && idx > 0) {
                otpBoxes[idx - 1].focus();
            }
        };

        box.onpaste = (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted) {
                pasted.split('').forEach((char, i) => {
                    if (otpBoxes[i]) otpBoxes[i].value = char;
                });
                const focusIdx = Math.min(pasted.length, 5);
                if (otpBoxes[focusIdx]) otpBoxes[focusIdx].focus();
            }
        };
    });

    // Back button in OTP screen
    const backBtn = modal.querySelector('#back-to-form-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            const addressFormScreen = modal.querySelector('#address-form-screen');
            const otpScreen = modal.querySelector('#address-otp-screen');
            if (otpScreen) otpScreen.classList.add('hidden');
            if (addressFormScreen) addressFormScreen.classList.remove('hidden');
            if (resendInterval) clearInterval(resendInterval);
        };
    }

    // Resend OTP Link
    const resendBtn = modal.querySelector('#resend-otp-link');
    if (resendBtn) {
        resendBtn.onclick = async () => {
            const phone = modal.querySelector('#phone-input')?.value?.trim().replace(/\D/g, '');
            if (phone) await launchOtpFlow(phone);
        };
    }

    // Submit OTP Verification Button
    const submitOtpBtn = modal.querySelector('#submit-otp-verify-btn');
    if (submitOtpBtn) {
        submitOtpBtn.onclick = async () => {
            const boxes = modal.querySelectorAll('.otp-box');
            const enteredOtp = Array.from(boxes).map(b => b.value).join('');
            const phone = modal.querySelector('#phone-input')?.value?.trim().replace(/\D/g, '');
            const room = modal.querySelector('#room-input')?.value?.trim().replace(/\D/g, '');
            const errBox = modal.querySelector('#otp-error-box');
            const errText = modal.querySelector('#otp-error-text');

            if (enteredOtp.length < 6) {
                if (errBox && errText) {
                    errBox.classList.remove('hidden');
                    errText.textContent = 'Please enter all 6 digits of the OTP code.';
                }
                return;
            }

            submitOtpBtn.disabled = true;
            submitOtpBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Verifying...</span>';

            try {
                const uid = window.getEffectiveUserId();
                const verifyRes = await window.api.verifyOtp(phone, enteredOtp, uid);
                if (verifyRes && verifyRes.success) {
                    localStorage.setItem('lpuquick_phone_verified_' + phone, 'true');
                    if (resendInterval) clearInterval(resendInterval);
                    finalizeAddressSave(room, phone);
                } else {
                    throw new Error(verifyRes?.error || 'Invalid OTP code.');
                }
            } catch (err) {
                submitOtpBtn.disabled = false;
                submitOtpBtn.innerHTML = '<span class="material-symbols-outlined text-sm">verified</span><span>Verify Code & Confirm Address</span>';
                if (errBox && errText) {
                    errBox.classList.remove('hidden');
                    errText.textContent = err.message || 'Invalid or expired OTP code. Please try again.';
                }
            }
        };
    }

    // Save Address button on Main Form
    const saveAddressBtn = modal.querySelector('#save-address-btn');
    if (saveAddressBtn) {
        saveAddressBtn.onclick = async () => {
            // Prevent saving if selected hostel is inactive
            const isTargetActive = allLocations.some(h => (normalizeHostelKey(h.id) === normalizeHostelKey(selectedHostel) || normalizeHostelKey(h.name) === normalizeHostelKey(selectedHostel)) && h.active);
            if (!isTargetActive) {
                const blockedBox = modal.querySelector('#blocked-hostel-alert');
                const blockedMsg = modal.querySelector('#blocked-hostel-msg');
                if (blockedBox && blockedMsg) {
                    blockedBox.classList.remove('hidden');
                    blockedMsg.textContent = `${selectedHostel} is opening soon! Please select an active hostel to proceed.`;
                }
                return;
            }

            const room = modal.querySelector('#room-input')?.value?.trim();
            const phone = modal.querySelector('#phone-input')?.value?.trim();
            const alertBox = modal.querySelector('#address-validation-alert');
            const alertMsg = modal.querySelector('#address-validation-msg');

            const isMainGate = selectedBlock && selectedBlock.toLowerCase().includes('gate');
            const cleanRoom = (room || '').replace(/\D/g, '');
            if (!cleanRoom && !isMainGate) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Please enter a valid numeric Room Number (e.g. 304).';
                }
                modal.querySelector('#room-input')?.focus();
                return;
            }

            const cleanPhone = (phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length !== 10) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Mobile Number is strictly mandatory! Please enter a valid 10-digit phone number (e.g. 9876543210).';
                }
                modal.querySelector('#phone-input')?.focus();
                return;
            }

            if (alertBox) alertBox.classList.add('hidden');

            // Direct confirmation: OTP disabled for instant campus ordering
            finalizeAddressSave(cleanRoom, cleanPhone);
        };
    }
};
window.openLocationModal = window.openAddressModal;

// Global Campus & Order Help Modal (24/7 WhatsApp, Phone Call, Room Change, & Live Dispatch Query)
window.openCampusHelpModal = function (orderId = null) {
    const existing = document.getElementById('campus-help-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'campus-help-modal';
    modal.className = 'modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md';
    modal.innerHTML = `
        <div class="glass-panel p-5 sm:p-6 space-y-4 max-w-md w-full rounded-3xl max-h-[90vh] overflow-y-auto border border-[var(--glass-border)] shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white mx-3 sm:mx-auto" onclick="event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex justify-between items-center pb-3 border-b border-[var(--glass-border)]">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
                        <span class="material-symbols-outlined text-2xl">support_agent</span>
                    </div>
                    <div>
                        <h3 class="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">Campus Help & Support</h3>
                        <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} Ground Hub · Active 24/7
                        </p>
                    </div>
                </div>
                <button type="button" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-transform active:scale-95 cursor-pointer" onclick="document.getElementById('campus-help-modal').remove()">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Instant Contact Buttons (WhatsApp & Phone) -->
            <div class="grid grid-cols-2 gap-3">
                <a href="https://wa.me/917671836211?text=Hi%20LPUQuick%20Helpdesk%2C%20I%20am%20a%20hostel%20student%20and%20need%20assistance." target="_blank" rel="noopener noreferrer" class="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 flex flex-col items-center text-center group transition-all shadow-xs cursor-pointer">
                    <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-lg">chat</span>
                    </div>
                    <span class="text-xs font-black">WhatsApp Help</span>
                    <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Instant Reply (~1 min)</span>
                </a>

                <a href="tel:+917671836211" class="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 flex flex-col items-center text-center group transition-all shadow-xs cursor-pointer">
                    <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-lg">call</span>
                    </div>
                    <span class="text-xs font-black">Call Helpline</span>
                    <span class="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">+91 76718 36211</span>
                </a>
            </div>

            <!-- Quick Assistance Cards -->
            <div class="space-y-2">
                <h4 class="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Quick Resolutions</h4>
                
                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span class="material-symbols-outlined text-sm text-emerald-500">timer</span>
                        <span>Where is my order? (3-Min Delivery Guarantee)</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                        All orders are dispatched immediately from the ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} Dark Store. Delivery runners walk directly to your room door within 3 to 5 minutes.
                    </p>
                </div>

                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span class="material-symbols-outlined text-sm text-amber-500">cached</span>
                        <span>Wrong or damaged item?</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-300 pl-6 leading-relaxed">
                        Instant replacement or full refund is guaranteed. Simply message our WhatsApp helpline with your order number.
                    </p>
                </div>

                <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                    <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span class="material-symbols-outlined text-sm text-blue-500">pin_drop</span>
                        <span>Need to change room or phone number?</span>
                    </div>
                    <div class="pl-6 flex items-center justify-between gap-2 pt-0.5">
                        <p class="text-[11px] text-slate-600 dark:text-slate-300">Update hostel block or room instantly.</p>
                        <button type="button" class="clay-btn px-2.5 py-1 rounded-lg text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 cursor-pointer" onclick="document.getElementById('campus-help-modal').remove(); window.openAddressModal();">Change Room</button>
                    </div>
                </div>
            </div>

            <!-- Direct Desk Query Box -->
            <div class="space-y-2 pt-2 border-t border-[var(--glass-border)]">
                <label for="help-query-text" class="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-purple-500">edit_note</span>
                    <span>Send Message to ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} Dispatcher</span>
                </label>
                <textarea id="help-query-text" rows="2" class="w-full rounded-2xl p-3 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="e.g., Leave package near room door, or runner please call before coming up..."></textarea>
                <button type="button" id="help-send-btn" class="clay-btn clay-btn-primary w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 text-white shadow-md cursor-pointer transition-all active:scale-98">
                    <span class="material-symbols-outlined text-sm">send</span>
                    <span>Send Message to Dispatch Hub</span>
                </button>
            </div>
        </div>
    `;

    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    const sendBtn = modal.querySelector('#help-send-btn');
    const textArea = modal.querySelector('#help-query-text');
    if (sendBtn && textArea) {
        sendBtn.onclick = () => {
            const val = textArea.value.trim();
            if (!val) {
                textArea.focus();
                return;
            }
            sendBtn.disabled = true;
            sendBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Sending...</span>';
            setTimeout(() => {
                modal.remove();
                const hubName = window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus');
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`Message sent to ${hubName} Ground Hub dispatcher! Our runner has been notified.`, 'success', 'support_agent');
                } else {
                    alert(`Message dispatched to ${hubName} Hub!`);
                }
            }, 600);
        };
    }
};

// Alias for Order Help
window.openOrderHelpModal = window.openCampusHelpModal;

// Global Coupons Modal (Active Campus Offers)
window.openCouponsModal = function () {
    const existing = document.getElementById('coupons-modal');
    if (existing) existing.remove();

    const coupons = [
        {
            code: 'LPUWELCOME',
            title: 'Flat ₹25 OFF on Orders Above ₹99',
            minOrder: 'Valid on snacks, beverages & groceries',
            badge: 'Student Special',
            tagColor: 'bg-emerald-500 text-white',
            expires: 'Active today'
        },
        {
            code: 'BH13NIGHT',
            title: 'Free Express Corridor Delivery',
            minOrder: 'Valid on late night hostel study orders (10 PM - 3 AM)',
            badge: 'Midnight Express',
            tagColor: 'bg-purple-500 text-white',
            expires: 'Daily 10 PM to 3 AM'
        },
        {
            code: 'EXPRESSFREE',
            title: '100% Free Packaging & Priority Dispatch',
            minOrder: 'No minimum order required',
            badge: 'Campus Deal',
            tagColor: 'bg-amber-500 text-white',
            expires: 'Active'
        }
    ];

    const modal = document.createElement('div');
    modal.id = 'coupons-modal';
    modal.className = 'modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md';
    modal.innerHTML = `
        <div class="glass-panel p-5 sm:p-6 space-y-4 max-w-md w-full rounded-3xl max-h-[90vh] overflow-y-auto border border-[var(--glass-border)] shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white mx-3 sm:mx-auto" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-[var(--glass-border)]">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                        <span class="material-symbols-outlined text-2xl">local_offer</span>
                    </div>
                    <div>
                        <h3 class="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">Active Promo Coupons</h3>
                        <p class="text-[11px] text-amber-600 dark:text-amber-400 font-bold">2 Active Campus Student Offers</p>
                    </div>
                </div>
                <button type="button" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-transform active:scale-95 cursor-pointer" onclick="document.getElementById('coupons-modal').remove()">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Coupons List -->
            <div class="space-y-3">
                ${coupons.map(c => `
                <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 shadow-sm space-y-2 relative overflow-hidden group">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 tracking-wider">
                                ${c.code}
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${c.tagColor}">
                                ${c.badge}
                            </span>
                        </div>
                        <button type="button" class="copy-coupon-btn px-3 py-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black active:scale-95 transition-transform hover:opacity-90 cursor-pointer flex items-center gap-1 shadow-xs" data-code="${c.code}">
                            <span class="material-symbols-outlined text-xs">content_copy</span>
                            <span>Copy</span>
                        </button>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">${c.title}</h4>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">${c.minOrder}</p>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    modal.querySelectorAll('.copy-coupon-btn').forEach(btn => {
        btn.onclick = () => {
            const code = btn.getAttribute('data-code');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code);
            }
            btn.innerHTML = '<span class="material-symbols-outlined text-xs">done</span><span>Copied!</span>';
            btn.classList.add('bg-emerald-600', 'text-white');
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`Coupon code ${code} copied!`, 'success', 'local_offer');
            }
        };
    });
};

// Global Product Details Modal
window.openProductModal = async function (productId) {
    if (!productId) return;
    const existing = document.getElementById('product-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.dataset.productId = productId;
    modal.className = 'modal-overlay fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md';
    modal.innerHTML = `
        <div class="modal-content p-6 flex items-center justify-center min-h-[300px]" onclick="event.stopPropagation()">
            <span class="material-symbols-outlined text-emerald text-3xl animate-spin">progress_activity</span>
        </div>
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    try {
        const activeHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        const res = await window.api.getProduct(productId, activeHostel, true);
        const p = (res && res.product) ? res.product : (res && res.id ? res : (window.__cachedProducts && window.__cachedProducts.get(productId)) || {});

        const pid = p.id || productId;
        const pName = p.name || 'Campus Essential';
        const pCategory = p.category || 'Snacks & Drinks';
        const pSubcategory = p.subcategory || 'Hostel Favorite';
        const pImg = p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
        const pPrice = Number(p.price) || 0;
        const pMrp = Number(p.mrp) || pPrice;
        const pDiscount = p.discount_percent || (pMrp > pPrice ? Math.round(((pMrp - pPrice) / pMrp) * 100) : 0);
        const pSize = p.size || p.unit || '1 Pack';
        const pDesc = p.description || `${pName} is available for express 3-minute delivery right to your hostel room.`;
        const pShelfLife = p.shelf_life || '12 Months';
        const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? Number(p.stock_left) : 0;
        const isOutOfStock = p.in_stock === false || stockLeft <= 0;
        const isLowStock = !isOutOfStock && stockLeft <= 4;

        const cartInfo = window.cartState ? window.cartState[pid] : null;
        const qty = cartInfo ? cartInfo.quantity : 0;

        modal.innerHTML = `
            <div class="glass-panel p-6 space-y-4 max-w-sm w-full rounded-3xl border border-[var(--glass-border)] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
                <!-- Modal Top -->
                <div class="flex justify-between items-center pb-2.5 border-b border-[var(--glass-border)]">
                    <span class="clay-pill text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-3 py-0.5 border border-emerald-500/25">
                        ${pCategory}
                    </span>
                    <button type="button" class="clay-pill w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer" onclick="document.getElementById('product-modal').remove()">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <!-- Product Image Frame -->
                <div class="h-48 clay-card rounded-2xl overflow-hidden flex items-center justify-center p-3 relative border border-[var(--glass-border)]">
                    <img class="max-h-full max-w-full object-contain" src="${pImg}" alt="${pName}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'">
                    ${pDiscount > 0 ? `
                    <div class="liquid-badge absolute top-3 left-3 text-[10px] font-black px-2.5 py-0.5 shadow-sm">
                        ${pDiscount}% OFF
                    </div>
                    ` : ''}
                    ${isLowStock ? `
                    <div class="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        Only ${stockLeft} left
                    </div>
                    ` : (isOutOfStock ? `
                    <div class="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                        Out of Stock
                    </div>
                    ` : '')}
                </div>

                <!-- Title & Price -->
                <div class="space-y-1">
                    <h2 class="text-base font-black text-slate-900 dark:text-white leading-snug tracking-tight">${pName}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold">${pSize}</p>
                    <div class="flex items-baseline gap-2 pt-1">
                        <span class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹${pPrice}</span>
                        ${pMrp > pPrice ? `<span class="text-xs text-slate-400 font-medium line-through">₹${pMrp}</span>` : ''}
                    </div>
                </div>

                <!-- Highlights & Description -->
                <div class="space-y-2.5 border-t border-[var(--glass-border)] pt-3 text-xs">
                    <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] font-medium">${pDesc}</p>
                    <div class="grid grid-cols-2 gap-2.5 text-[11px]">
                        <div class="clay-card p-2.5 rounded-xl">
                            <span class="text-slate-400 block text-[10px] font-medium">Shelf Life</span>
                            <span class="font-bold text-slate-800 dark:text-slate-200">${pShelfLife}</span>
                        </div>
                        <div class="clay-card p-2.5 rounded-xl">
                            <span class="text-slate-400 block text-[10px] font-medium">Campus Delivery</span>
                            <span class="font-bold text-emerald-500">3 mins to ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button inside Modal -->
                <div class="pt-1.5" id="modal-action-container"></div>
            </div>
        `;
        modal.dataset.productId = pid;
        renderModalActionContainer(pid, pPrice, stockLeft, isOutOfStock);

    } catch (e) {
        console.error('[Product Modal Error]:', e);
        modal.innerHTML = `
            <div class="modal-content p-6 text-center space-y-3">
                <p class="text-error text-xs">Could not load product details.</p>
                <button type="button" class="bg-surface-container-high text-xs px-4 py-1.5 rounded-full" onclick="document.getElementById('product-modal').remove()">Close</button>
            </div>
        `;
    }
};

// Render modal action container in-place (Zero modal unmounting / zero off-screen jumps)
function renderModalActionContainer(productId, pPrice, stockLeft, isOutOfStock) {
    const container = document.getElementById('modal-action-container');
    if (!container) return;
    const cartInfo = window.cartState ? window.cartState[productId] : null;
    const qty = cartInfo ? cartInfo.quantity : 0;

    if (isOutOfStock || stockLeft <= 0) {
        container.innerHTML = `
            <button type="button" class="w-full clay-pill text-slate-400 rounded-2xl py-3 text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5 opacity-60" disabled>
                Out of Stock
            </button>
        `;
        return;
    }

    if (qty === 0) {
        container.innerHTML = `
            <button type="button" class="clay-btn clay-btn-primary w-full rounded-2xl py-3 text-xs font-black shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer" id="modal-add-btn">
                <span class="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>Add to Cart · ₹${pPrice}</span>
            </button>
        `;
        const modalAddBtn = document.getElementById('modal-add-btn');
        if (modalAddBtn) {
            modalAddBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.setOptimisticCartQuantity(productId, 1, stockLeft);
                renderModalActionContainer(productId, pPrice, stockLeft, isOutOfStock);
            };
        }
    } else {
        const isMaxReached = qty >= stockLeft;
        container.innerHTML = `
            <div class="flex items-center justify-between clay-card rounded-2xl p-2 px-4 shadow-sm">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Quantity in Cart:</span>
                <div class="card-qty-stepper flex items-center">
                    <button type="button" class="card-qty-btn card-dec-btn" id="modal-dec-btn" title="Decrease">
                        <span class="material-symbols-outlined text-[13px] font-bold">remove</span>
                    </button>
                    <span class="card-qty-val select-none">${qty}</span>
                    <button type="button" class="card-qty-btn card-inc-btn ${isMaxReached ? 'opacity-40 cursor-not-allowed' : ''}" id="modal-inc-btn" ${isMaxReached ? 'disabled' : ''} title="${isMaxReached ? `Only ${stockLeft} left` : 'Add one more'}">
                        <span class="material-symbols-outlined text-[13px] font-bold">add</span>
                    </button>
                </div>
            </div>
        `;
        const modalDecBtn = document.getElementById('modal-dec-btn');
        if (modalDecBtn) {
            modalDecBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentQty = window.cartState?.[productId]?.quantity || 0;
                window.setOptimisticCartQuantity(productId, Math.max(0, currentQty - 1), stockLeft);
                renderModalActionContainer(productId, pPrice, stockLeft, isOutOfStock);
            };
        }
        const modalIncBtn = document.getElementById('modal-inc-btn');
        if (modalIncBtn) {
            modalIncBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const currentQty = window.cartState?.[productId]?.quantity || 0;
                if (currentQty >= stockLeft) {
                    if (typeof window.showClientToast === 'function') {
                        window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in stock!`, 'warning', 'inventory_2');
                    }
                    return;
                }
                window.setOptimisticCartQuantity(productId, currentQty + 1, stockLeft);
                renderModalActionContainer(productId, pPrice, stockLeft, isOutOfStock);
            };
        }
    }
}

// Render slot markup for a single product without rebuilding everything
function renderSlotContent(productId, slotEl) {
    if (!slotEl) return;
    const cached = window.__cachedProducts?.get(productId);
    const stockAttr = slotEl.dataset.stockLeft || slotEl.getAttribute('data-stock-left');
    const isOutOfStock = slotEl.dataset.outOfStock === 'true' || slotEl.getAttribute('data-out-of-stock') === 'true' || (cached && !cached.in_stock);
    const stockLeft = cached?.stock_left !== undefined && cached?.stock_left !== null ? Number(cached.stock_left) : (stockAttr !== undefined && stockAttr !== '' && stockAttr !== null ? Number(stockAttr) : 0);

    if (isOutOfStock || stockLeft <= 0) {
        slotEl.innerHTML = `
            <span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md cursor-not-allowed select-none">
                Out
            </span>
        `;
        return;
    }

    const cartInfo = window.cartState[productId];
    const qty = cartInfo ? cartInfo.quantity : 0;

    if (qty > 0) {
        const isMaxReached = qty >= stockLeft;
        slotEl.innerHTML = `
            <div class="card-qty-stepper">
                <button type="button" class="card-qty-btn card-dec-btn" data-id="${productId}" data-stock-left="${stockLeft}" title="Decrease">
                    <span class="material-symbols-outlined text-[13px] font-bold">remove</span>
                </button>
                <span class="card-qty-val select-none">${qty}</span>
                <button type="button" class="card-qty-btn card-inc-btn ${isMaxReached ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${productId}" data-stock-left="${stockLeft}" title="${isMaxReached ? `Only ${stockLeft} left in stock` : 'Add one more'}">
                    <span class="material-symbols-outlined text-[13px] font-bold">add</span>
                </button>
            </div>
        `;
    } else {
        slotEl.innerHTML = `
            <button type="button" class="add-to-cart-btn uppercase" data-id="${productId}" data-stock-left="${stockLeft}">ADD</button>
        `;
    }
}

// Targeted Instant Update for a Single Product (< 1ms DOM execution)
window.updateSingleProductSlot = function (productId) {
    document.querySelectorAll(`.product-action-slot[data-id="${productId}"]`).forEach(slot => {
        renderSlotContent(productId, slot);
    });
    // In-place update for open modal if present
    const modalEl = document.getElementById('product-modal');
    if (modalEl && modalEl.dataset.productId === productId) {
        const cached = window.__cachedProducts?.get(productId);
        const pPrice = Number(cached?.price) || 0;
        const stockLeft = cached?.stock_left !== undefined ? Number(cached.stock_left) : 0;
        const isOutOfStock = cached ? !cached.in_stock : false;
        renderModalActionContainer(productId, pPrice, stockLeft, isOutOfStock);
    }
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }
};

// Global Card Stepper Synchronizer (Fast batch render)
window.syncCardSteppers = function () {
    document.querySelectorAll('.product-action-slot').forEach(slot => {
        const id = slot.dataset.id;
        if (id) renderSlotContent(id, slot);
    });
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }
};

// Global Floating "View cart" Bar Synchronizer (Zepto / Blinkit Quick-Commerce Pill)
window.updateFloatingCartBar = function () {
    const floatingBar = document.getElementById('global-floating-cart-bar');
    if (!floatingBar) return;

    // Check route: Hide on cart, checkout, signin, or blocked pages
    const currentHash = (window.location.hash || '#/').toLowerCase();
    if (currentHash.startsWith('#/cart') ||
        currentHash.startsWith('#/checkout') ||
        currentHash.startsWith('#/signin') ||
        currentHash.startsWith('#/blocked')) {
        floatingBar.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
        setTimeout(() => {
            const h = (window.location.hash || '#/').toLowerCase();
            if (h.startsWith('#/cart') || h.startsWith('#/checkout') || h.startsWith('#/signin') || h.startsWith('#/blocked')) {
                floatingBar.classList.add('hidden');
            }
        }, 250);
        return;
    }

    let totalItems = 0;
    let totalPrice = 0;
    const distinctProductIds = [];

    if (window.cartState && typeof window.cartState === 'object') {
        Object.entries(window.cartState).forEach(([productId, item]) => {
            if (item && item.quantity > 0) {
                const qty = Number(item.quantity);
                totalItems += qty;
                distinctProductIds.push(productId);

                const cachedProd = window.__cachedProducts?.get(productId);
                const itemPrice = (cachedProd && cachedProd.price) ? Number(cachedProd.price) : (Number(item.price) || 0);
                totalPrice += itemPrice * qty;
            }
        });
    }

    if (totalItems === 0) {
        floatingBar.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
        setTimeout(() => {
            let curTotal = 0;
            if (window.cartState) {
                Object.values(window.cartState).forEach(i => { if (i?.quantity) curTotal += Number(i.quantity); });
            }
            if (curTotal === 0 && floatingBar) floatingBar.classList.add('hidden');
        }, 250);
        return;
    }

    // Render up to 3 overlapping product thumbnails (Zepto / Blinkit style)
    const thumbnailsContainer = document.getElementById('floating-cart-thumbnails');
    if (thumbnailsContainer) {
        const topProducts = distinctProductIds.slice(-3).reverse();
        let thumbsHTML = '';
        topProducts.forEach((pid, index) => {
            const p = window.__cachedProducts?.get(pid);
            const cartItem = window.cartState ? window.cartState[pid] : null;
            let imgUrl = p?.image_url || cartItem?.image_url;
            if (!imgUrl) imgUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120';
            const pName = p?.name || cartItem?.name || 'Item';
            thumbsHTML += `
                <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-slate-800 bg-white shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center relative transition-transform" style="z-index: ${10 - index};">
                    <img src="${imgUrl}" alt="${pName}" class="w-full h-full object-contain p-0.5" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'">
                </div>
            `;
        });
        thumbnailsContainer.innerHTML = thumbsHTML;
    }

    // Update subtitle text
    const subtitleEl = document.getElementById('floating-cart-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}${totalPrice > 0 ? ` • ₹${totalPrice}` : ''}`;
    }

    // Position above bottom navigation bar if present
    const liveDeliveryBar = document.getElementById('global-live-delivery-bar');
    const isLiveDeliveryActive = liveDeliveryBar && !liveDeliveryBar.classList.contains('hidden');
    if (isLiveDeliveryActive) {
        floatingBar.style.bottom = '9.5rem';
    } else {
        floatingBar.style.bottom = '6rem';
    }

    // Smooth reveal without layout jumps
    if (floatingBar.classList.contains('hidden')) {
        floatingBar.classList.remove('hidden');
        requestAnimationFrame(() => {
            floatingBar.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
        });
    } else {
        floatingBar.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
    }
};

// Global Cart Count Badges Synchronizer (Bottom Nav, Header Badges & Floating Cart Bar)
window.updateGlobalCartBadges = function () {
    let totalItems = 0;
    if (window.cartState && typeof window.cartState === 'object') {
        Object.values(window.cartState).forEach(item => {
            if (item && item.quantity) {
                totalItems += Number(item.quantity);
            }
        });
    }

    const badgeEls = document.querySelectorAll('#bottom-nav-cart-count, #desktop-header-cart-count, #mobile-header-cart-count, .global-cart-count-badge');
    badgeEls.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '0';
            badge.classList.add('hidden');
        }
    });

    // Also synchronize the floating quick-commerce View Cart bar
    if (typeof window.updateFloatingCartBar === 'function') {
        window.updateFloatingCartBar();
    }
};

// Setup Single Global Event Delegation for all Cart Actions & Product Modals (0ms rebind overhead)
let isGlobalCartDelegationBound = false;
function initGlobalEventDelegation() {
    if (isGlobalCartDelegationBound) return;
    isGlobalCartDelegationBound = true;

    document.addEventListener('click', (e) => {
        // 1. Add to Cart Button Click
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = addBtn.dataset.id;
            if (!id) return;

            const slot = addBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : (addBtn.dataset.stockLeft !== undefined ? Number(addBtn.dataset.stockLeft) : 0));

            if (stockLeft <= 0) {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('⚠️ This item is out of stock', 'warning', 'inventory_2');
                }
                return;
            }

            // Instant Atomic Sync
            window.setOptimisticCartQuantity(id, 1, stockLeft);
            return;
        }

        // 2. Increment Quantity (+) Click
        const incBtn = e.target.closest('.card-inc-btn');
        if (incBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = incBtn.dataset.id;
            if (!id) return;

            const slot = incBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : (incBtn.dataset.stockLeft !== undefined ? Number(incBtn.dataset.stockLeft) : 0));
            const currentQty = window.cartState?.[id]?.quantity || 0;

            if (currentQty >= stockLeft) {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in stock!`, 'warning', 'inventory_2');
                }
                return;
            }

            // Instant Atomic Sync (batches fast multi-taps into 1 exact sync)
            window.setOptimisticCartQuantity(id, currentQty + 1, stockLeft);
            return;
        }

        // 3. Decrement Quantity (-) Click
        const decBtn = e.target.closest('.card-dec-btn');
        if (decBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = decBtn.dataset.id;
            if (!id) return;

            const slot = decBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : 0);
            const currentQty = window.cartState?.[id]?.quantity || 0;

            // Instant Atomic Sync
            window.setOptimisticCartQuantity(id, Math.max(0, currentQty - 1), stockLeft);
            return;
        }

        // 4. Product Card Click (Open Modal)
        const productCard = e.target.closest('.product-detail-trigger');
        if (productCard && !e.target.closest('.product-action-slot') && !e.target.closest('button')) {
            const id = productCard.dataset.productId;
            if (id && typeof window.openProductModal === 'function') {
                window.openProductModal(id);
            }
            return;
        }

        // 5. Address Selector Modal Trigger (0ms immediate response)
        const addrTrigger = e.target.closest('.address-selector-trigger, #btn-header-address');
        if (addrTrigger) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.openAddressModal === 'function') {
                window.openAddressModal();
            }
            return;
        }

        // 6. Bottom Navigation Dock Click — 0ms Visual Pill Feedback
        const navItem = e.target.closest('nav.liquid-dock-pill a');
        if (navItem) {
            const route = (navItem.getAttribute('data-route') || navItem.getAttribute('href') || '').replace(/^#\/?/, '') || 'home';
            if (typeof window.syncBottomNavVisualActive === 'function') {
                window.syncBottomNavVisualActive(route);
            }
            return;
        }

        // 7. 1-Tap Place Order Button Global Delegated Handler
        const tapToPayBtn = e.target.closest('#tap-to-pay-btn');
        if (tapToPayBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.executeOrderPlacement === 'function') {
                window.executeOrderPlacement();
            }
            return;
        }
    });

    // Instant Mobile Touch Response for Place Order Button and Bottom Navigation
    document.addEventListener('touchstart', (e) => {
        const tapToPayBtn = e.target.closest('#tap-to-pay-btn');
        if (tapToPayBtn) {
            tapToPayBtn.classList.add('scale-95');
        }
        const navItem = e.target.closest('nav.liquid-dock-pill a');
        if (navItem) {
            const route = (navItem.getAttribute('data-route') || navItem.getAttribute('href') || '').replace(/^#\/?/, '') || 'home';
            if (typeof window.syncBottomNavVisualActive === 'function') {
                window.syncBottomNavVisualActive(route);
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const tapToPayBtn = e.target.closest('#tap-to-pay-btn');
        if (tapToPayBtn) {
            tapToPayBtn.classList.remove('scale-95');
        }
    }, { passive: true });
}
initGlobalEventDelegation();

// Router Main Function
// Router Main Function - Instant Zero-Blocking Navigation
// ================= CLIENT STORE AVAILABILITY & LOCK CONTROLLER =================
window.__storeAvailability = null;
window.__isUserBlocked = false;
window.__userBlockReason = null;
window.__clientLockTicker = null;

window.syncStoreAvailability = async function (hostelId) {
    try {
        const targetHostel = hostelId || window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        const data = await window.api.getClientStatus(targetHostel);
        const wasLocked = window.__storeAvailability ? Boolean(window.__storeAvailability.is_locked) : (localStorage.getItem('lpuquick_was_store_locked') === 'true');
        const nowLocked = Boolean(data && data.is_locked);

        window.__storeAvailability = data;
        renderStoreClosedBannerOrOverlay();

        if (wasLocked && !nowLocked) {
            localStorage.removeItem('lpuquick_was_store_locked');
            if (typeof window.showStoreOpenedNotification === 'function') {
                window.showStoreOpenedNotification(targetHostel);
            }
        } else if (nowLocked) {
            localStorage.setItem('lpuquick_was_store_locked', 'true');
        }

        return data;
    } catch (e) {
        console.warn('[Store Availability Sync Error]:', e);
        return { is_locked: false, lock_status: 'AVAILABLE' };
    }
};

function formatClientReopenHeadline(avail) {
    if (!avail) return "We'll reopen soon";
    const targetEnd = avail.end_at || avail.reopen_at;
    if (targetEnd) {
        const end = new Date(targetEnd);
        if (!isNaN(end.getTime())) {
            const now = new Date();
            const isToday = end.toDateString() === now.toDateString();
            const tomorrow = new Date(now.getTime() + 86400000);
            const isTomorrow = end.toDateString() === tomorrow.toDateString();

            let hours = end.getHours();
            const minutes = end.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            const minStr = String(minutes).padStart(2, '0');
            const timeStr = `${hours}:${minStr} ${ampm}`;

            let dayWording = 'today';
            if (isToday) dayWording = 'today';
            else if (isTomorrow) dayWording = 'tomorrow';
            else dayWording = `on ${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;

            return `We'll reopen at ${timeStr}, ${dayWording}`;
        }
    }
    return avail.display_reopen?.fullHeadline || (avail.message ? avail.message : "We'll reopen soon");
}

window.renderStoreClosedBannerOrOverlay = function () {
    const avail = window.__storeAvailability;
    const isUserBlocked = Boolean(window.__isUserBlocked);
    const homeHeroContainer = document.getElementById('store-closed-banner-slot');

    if (isUserBlocked) {
        const blockReason = window.__userBlockReason || 'Fake Orders';
        if (homeHeroContainer) {
            homeHeroContainer.innerHTML = `
                <div id="blocked-user-hero-card" class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ba1a1a] to-[#93000a] text-white p-6 sm:p-8 shadow-2xl border-2 border-[#ff8a80] my-4 animate-fade-in">
                    <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div class="flex items-center gap-4 text-left">
                            <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                                <span class="material-symbols-outlined text-4xl text-white">gavel</span>
                            </div>
                            <div class="space-y-1">
                                <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                                    <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                    <span>Account Suspended</span>
                                </div>
                                <h2 class="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                    You are blocked due to ${(blockReason).toLowerCase()}.
                                </h2>
                                <p class="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
                                    Your student account is restricted from placing orders on LPUQuick. Please contact Campus Operations to appeal or resolve this restriction.
                                </p>
                            </div>
                        </div>
                        <a href="#/blocked" class="shrink-0 bg-white text-[#ba1a1a] hover:bg-white/90 px-6 py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95">
                            View Details
                        </a>
                    </div>
                </div>
            `;
            homeHeroContainer.classList.remove('hidden');
        }
        updateBlockedUI(true, blockReason);
        updateCheckoutButtonsForLock(true, 'Account Suspended');
        return;
    }

    if (!avail) return;

    const isLocked = Boolean(avail.is_locked);

    // 1. Manage Global Sticky Announcement Bar (Visible across ALL pages)
    let globalBar = document.getElementById('global-store-lock-bar');

    if (isLocked) {
        const reopenHeadline = formatClientReopenHeadline(avail);
        let secondaryText = avail.message;
        if (!secondaryText || secondaryText.trim() === reopenHeadline.trim()) {
            secondaryText = "You can still add items to your cart and place your order when the store re-opens.";
        }

        document.body.classList.add('store-locked-active');
        document.body.style.paddingTop = '36px';

        const fixedHeaders = document.querySelectorAll('header.fixed, header[class*="fixed"]');
        fixedHeaders.forEach(h => { h.style.top = '36px'; });

        if (!globalBar) {
            globalBar = document.createElement('div');
            globalBar.id = 'global-store-lock-bar';
            globalBar.className = 'fixed top-0 left-0 right-0 z-[100] bg-[#1a1d20] text-white py-2 px-3 sm:px-4 text-xs font-semibold flex items-center justify-between shadow-lg border-b border-red-500/30 animate-fade-in';
            document.body.prepend(globalBar);
        }

        globalBar.innerHTML = `
            <div class="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#ea4335] animate-ping"></span>
                    <span class="font-bold text-[#ea4335] uppercase text-[10px] tracking-wider">Store Closed:</span>
                    <span class="font-medium truncate max-w-[200px] sm:max-w-md">${reopenHeadline}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-[#ea4335]">timer</span>
                    <span class="font-mono font-bold text-white text-xs" id="global-lock-timer-display">--:--:--</span>
                </div>
            </div>
        `;
        globalBar.classList.remove('hidden');

        // 2. Render Reference Design Card on Homepage
        const targetEnd = avail.end_at || avail.reopen_at;
        if (homeHeroContainer) {
            const hasCountdown = Boolean(avail.remaining_seconds || targetEnd);
            const closedCardHtml = `
                <div id="store-closed-hero-card" class="diwali-store-closed-card relative overflow-hidden rounded-3xl p-5 sm:p-8 shadow-2xl my-3 sm:my-4 animate-fade-in text-white text-center">
                    <!-- Indian Golden Filigree Toran Arches in all 4 Corners -->
                    <div class="diwali-filigree diwali-filigree-tl" aria-hidden="true"></div>
                    <div class="diwali-filigree diwali-filigree-tr" aria-hidden="true"></div>
                    <div class="diwali-filigree diwali-filigree-bl" aria-hidden="true"></div>
                    <div class="diwali-filigree diwali-filigree-br" aria-hidden="true"></div>

                    <!-- Golden Fireworks Sparkles left and right -->
                    <div class="closed-firework closed-fw-left" aria-hidden="true"></div>
                    <div class="closed-firework closed-fw-right" aria-hidden="true"></div>

                    <div class="relative z-10 flex flex-col items-center max-w-lg mx-auto space-y-3">
                        <!-- Badge -->
                        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10.5px] sm:text-xs font-black uppercase tracking-wider bg-black/50 text-amber-300 border border-amber-500/60 shadow-md">
                            <span class="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span>TEMPORARY STORE RESTOCK</span>
                        </div>

                        <!-- Reopen Headline -->
                        <h1 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight" id="client-closed-headline">
                            ${reopenHeadline}
                        </h1>

                        <!-- Subtitle -->
                        <p class="text-xs sm:text-sm text-amber-200/90 font-bold uppercase tracking-wider" id="client-closed-subtitle">
                            ${secondaryText || 'RESTOCKING MY LOVELY CUSTOMER'}
                        </p>

                        <!-- Live Ticking Countdown Capsule with Neon Amber Border -->
                        <div id="client-countdown-wrapper" class="pt-0.5">
                            <div class="inline-flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-2xl bg-black/60 border-2 border-amber-500/75 text-white font-mono text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                                <span class="material-symbols-outlined text-base text-amber-400 animate-pulse">timer</span>
                                <span class="text-xs font-bold text-amber-200">Time remaining:</span>
                                <span class="font-black text-white font-mono text-sm sm:text-base tracking-widest" id="client-countdown-display">00:00:00</span>
                            </div>
                        </div>

                        <!-- Hanging Red Signboard on Golden Chains (Visual Match to Screen 1) -->
                        <div class="pt-2 select-none flex flex-col items-center">
                            <!-- Top Golden Chains -->
                            <div class="flex justify-between w-28 px-3 mb-[-3px] relative z-0">
                                <div class="w-[3px] h-8 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md"></div>
                                <div class="w-[3px] h-8 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-md"></div>
                            </div>

                            <!-- Red & Gold Board -->
                            <div class="relative z-10 w-44 sm:w-52 bg-gradient-to-b from-[#dc2626] to-[#991b1b] border-2 border-amber-400 rounded-3xl p-3.5 text-center shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(239,68,68,0.4)] transform hover:rotate-1 transition-transform duration-300">
                                <div class="absolute top-2 left-3 w-2 h-2 rounded-full bg-amber-300 shadow-inner"></div>
                                <div class="absolute top-2 right-3 w-2 h-2 rounded-full bg-amber-300 shadow-inner"></div>
                                <p class="text-[9.5px] font-black uppercase tracking-widest text-amber-200">SORRY, WE ARE</p>
                                <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] mt-0.5">CLOSED</h2>
                            </div>
                        </div>

                        <!-- Notify Me When Store Opens Button -->
                        <div class="pt-2">
                            <button id="btn-notify-store-open" onclick="handleNotifyStoreOpenTap(this)" class="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg border border-emerald-400/60 active:scale-95 transition-all cursor-pointer">
                                <span class="material-symbols-outlined text-sm text-emerald-200">notifications_active</span>
                                <span>Notify Me When Store Opens</span>
                            </button>
                        </div>

                        <!-- Bottom Traditional Glowing Diyas on Rangoli Base (Left & Right) -->
                        <div class="w-full flex justify-between items-end pt-2 px-3 sm:px-6">
                            <!-- Left Diya -->
                            <div class="diwali-bottom-diya flex flex-col items-center">
                                <svg viewBox="0 0 36 36" class="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]">
                                    <ellipse cx="18" cy="27" rx="14" ry="4" fill="url(#baseRangoliGrad)"/>
                                    <path d="M6 21 C6 27, 11 29, 18 29 C25 29, 30 27, 30 21 C30 20, 28 19, 25 19 C18 19, 11 19, 6 21 Z" fill="url(#diyaPotGrad)"/>
                                    <ellipse cx="18" cy="20" rx="10" ry="3" fill="url(#diyaRimGrad)"/>
                                    <ellipse cx="18" cy="20" rx="7" ry="1.6" fill="#451a03"/>
                                    <path class="diya-flame-flicker" d="M18 5 C16 9, 14 11.5, 15.5 14.5 C16.5 16.5, 19.5 16.5, 20.5 14.5 C22 11.5, 20 9, 18 5 Z" fill="url(#diyaFlameGrad)"/>
                                    <ellipse class="diya-flame-core" cx="18" cy="14" rx="1.5" ry="2.5" fill="#ffffff" opacity="0.95"/>
                                </svg>
                            </div>

                            <!-- Right Diya -->
                            <div class="diwali-bottom-diya flex flex-col items-center">
                                <svg viewBox="0 0 36 36" class="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-[0_0_14px_rgba(245,158,11,0.9)]">
                                    <ellipse cx="18" cy="27" rx="14" ry="4" fill="url(#baseRangoliGrad)"/>
                                    <path d="M6 21 C6 27, 11 29, 18 29 C25 29, 30 27, 30 21 C30 20, 28 19, 25 19 C18 19, 11 19, 6 21 Z" fill="url(#diyaPotGrad)"/>
                                    <ellipse cx="18" cy="20" rx="10" ry="3" fill="url(#diyaRimGrad)"/>
                                    <ellipse cx="18" cy="20" rx="7" ry="1.6" fill="#451a03"/>
                                    <path class="diya-flame-flicker" d="M18 5 C16 9, 14 11.5, 15.5 14.5 C16.5 16.5, 19.5 16.5, 20.5 14.5 C22 11.5, 20 9, 18 5 Z" fill="url(#diyaFlameGrad)"/>
                                    <ellipse class="diya-flame-core" cx="18" cy="14" rx="1.5" ry="2.5" fill="#ffffff" opacity="0.95"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            homeHeroContainer.innerHTML = closedCardHtml;
            homeHeroContainer.classList.remove('hidden');
        }

        // Start live ticker
        let countdownSecs = (typeof avail.remaining_seconds === 'number' && !isNaN(avail.remaining_seconds)) ? avail.remaining_seconds : null;
        if ((countdownSecs === null || countdownSecs <= 0) && targetEnd) {
            countdownSecs = Math.max(0, Math.floor((new Date(targetEnd).getTime() - Date.now()) / 1000));
        }

        if (countdownSecs && countdownSecs > 0) {
            startClientCountdown(countdownSecs, targetEnd);
        } else {
            if (window.__clientLockTicker) {
                clearInterval(window.__clientLockTicker);
                window.__clientLockTicker = null;
            }
            const globalDisplayEl = document.getElementById('global-lock-timer-display');
            if (globalDisplayEl) {
                globalDisplayEl.innerHTML = '<span class="text-[11px] font-bold text-amber-300">Until Unlocked</span>';
            }
            const clientDisplayEl = document.getElementById('client-countdown-display');
            if (clientDisplayEl) {
                clientDisplayEl.textContent = 'Until Reopened';
            }
        }

        // Update any checkout submit button if visible
        updateCheckoutButtonsForLock(true, reopenHeadline);
    } else {
        document.body.classList.remove('store-locked-active');
        document.body.style.paddingTop = '0px';

        const fixedHeaders = document.querySelectorAll('header.fixed, header[class*="fixed"]');
        fixedHeaders.forEach(h => { h.style.top = '0px'; });

        if (globalBar) {
            globalBar.classList.add('hidden');
        }

        if (homeHeroContainer) {
            homeHeroContainer.innerHTML = '';
            homeHeroContainer.classList.add('hidden');
        }
        if (window.__clientLockTicker) {
            clearInterval(window.__clientLockTicker);
            window.__clientLockTicker = null;
        }
        updateCheckoutButtonsForLock(false);
    }
};

function startClientCountdown(seconds, endAt) {
    if (window.__clientLockTicker) clearInterval(window.__clientLockTicker);

    const endTimestamp = endAt ? new Date(endAt).getTime() : Date.now() + (seconds * 1000);

    const update = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTimestamp - now) / 1000));

        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        const timeStr = `${h}:${m}:${s}`;

        const displayEl = document.getElementById('client-countdown-display');
        if (displayEl) {
            displayEl.textContent = timeStr;
        }

        const globalDisplayEl = document.getElementById('global-lock-timer-display');
        if (globalDisplayEl) {
            globalDisplayEl.textContent = timeStr;
        }

        if (diff <= 0) {
            clearInterval(window.__clientLockTicker);
            window.__clientLockTicker = null;
            if (typeof window.showStoreOpenedNotification === 'function') {
                window.showStoreOpenedNotification(window.currentHostelId);
            }
            if (typeof window.syncStoreAvailability === 'function') {
                window.syncStoreAvailability();
            }
        }
    };

    update();
    window.__clientLockTicker = setInterval(update, 1000);
}

function updateCheckoutButtonsForLock(isLocked, reopenText = 'Soon') {

    const checkoutBtns = document.querySelectorAll('#proceed-to-checkout-btn, #btn-place-order, .btn-checkout-submit, #checkout-submit-btn');
    checkoutBtns.forEach(btn => {
        if (isLocked) {
            btn.dataset.locked = 'true';
            btn.classList.add('opacity-75', 'cursor-not-allowed', 'bg-gray-600');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showClientToast(`🏪 Store is temporarily closed (${reopenText}). Your cart is safely preserved!`, 'warning', 'lock');
            };
        } else {
            btn.dataset.locked = 'false';
            btn.classList.remove('opacity-75', 'cursor-not-allowed', 'bg-gray-600');
            btn.onclick = null;
        }
    });
}

// Blocked Account Page Route & Real-Time Client Synchronization
window.syncUserBlockStatus = async function () {
    const uid = window.isUserLoggedIn() ? window.CURRENT_USER_ID : (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
    if (!uid) {
        window.__isUserBlocked = false;
        window.__userBlockReason = null;
        updateBlockedUI(false);
        return { isBlocked: false };
    }

    try {
        const res = await window.api.checkUserStatus(uid);
        if (res && (res.isBlocked || res.account_status === 'BLOCKED')) {
            window.__isUserBlocked = true;
            window.__userBlockReason = res.reason || 'Fake Orders';
            if (typeof window.renderStoreClosedBannerOrOverlay === 'function') {
                window.renderStoreClosedBannerOrOverlay();
            }
            updateBlockedUI(true, window.__userBlockReason);

            const currentRoute = getCurrentRoute();
            if (currentRoute === '/checkout' || currentRoute === '/cart') {
                window.location.hash = '#/blocked';
            }
            return { isBlocked: true, reason: window.__userBlockReason };
        } else {
            const wasBlocked = window.__isUserBlocked;
            window.__isUserBlocked = false;
            window.__userBlockReason = null;
            updateBlockedUI(false);
            if (wasBlocked && typeof window.renderStoreClosedBannerOrOverlay === 'function') {
                window.renderStoreClosedBannerOrOverlay();
            }
            return { isBlocked: false };
        }

    } catch (e) {
        return { isBlocked: false };
    }
};

function updateBlockedUI(isBlocked, reason = 'Fake Orders') {
    let bar = document.getElementById('global-user-blocked-bar');
    if (isBlocked) {
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'global-user-blocked-bar';
            bar.className = 'fixed top-0 left-0 right-0 z-[110] bg-[#ba1a1a] text-white py-2.5 px-4 text-xs font-bold flex items-center justify-between shadow-2xl border-b border-red-300 animate-fade-in';
            document.body.prepend(bar);
        }
        bar.innerHTML = `
            <div class="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base animate-pulse">block</span>
                    <span>Account Suspended: You are blocked due to ${(reason).toLowerCase()}.</span>
                </div>
                <a href="#/blocked" class="bg-white text-[#ba1a1a] px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-white/90">Details</a>
            </div>
        `;
        bar.classList.remove('hidden');
        document.body.style.paddingTop = '40px';
    } else {
        if (bar) {
            bar.classList.add('hidden');
        }
        if (!window.__storeAvailability?.is_locked) {
            document.body.style.paddingTop = '0px';
        }
    }
}

window.pages = window.pages || {};
window.pages.blocked = async function () {
    const reason = window.__userBlockReason || 'Fake Orders';
    return `
    <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div class="glass-panel rounded-3xl p-8 max-w-md w-full shadow-2xl border border-rose-500/30 text-center space-y-5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div class="clay-card w-20 h-20 mx-auto rounded-3xl text-rose-600 flex items-center justify-center shadow-lg">
                <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">gavel</span>
            </div>
            <div>
                <span class="clay-pill px-3.5 py-1 text-xs font-black uppercase tracking-widest bg-rose-500/15 text-rose-600 border border-rose-500/30">
                    Account Suspended
                </span>
                <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-3">Account Blocked</h1>
                <p class="text-sm font-bold text-rose-600 mt-1">
                    "You are blocked due to ${(reason).toLowerCase()}."
                </p>
            </div>
            <div class="clay-card p-4 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left space-y-2">
                <p>
                    Your student account has been restricted from placing orders on <b>LPU Quick</b> due to flagged policy violations (e.g. fake or cancelled orders).
                </p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                    If you believe this restriction is in error, please visit the <b>Central Campus Operations Hub</b> or reach out to campus operations.
                </p>
            </div>
            <a href="#/" class="clay-btn clay-btn-primary inline-block w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs tracking-wide shadow-md active:scale-95 transition-transform">
                Back to Store Catalog
            </a>
        </div>
    </div>
    `;
};

// Router Main Function - Instant Zero-Blocking Navigation & Race-Proof Transitions
let cartSyncInProgress = false;
let currentNavGeneration = 0;
let currentNavAbortController = null;
let lastActiveRoute = null;
const routeScrollPositions = new Map();

async function router() {
    const rawHash = window.location.hash || '';

    // Handle in-page anchor links on currently loaded page (e.g. #shop-catalog-section)
    if (rawHash && !rawHash.startsWith('#/')) {
        const cleanAnchor = rawHash.replace(/^#/, '');
        const anchorEl = document.getElementById(cleanAnchor);
        if (anchorEl) {
            const headerOffset = 76;
            const elementPosition = anchorEl.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: 'smooth'
            });
            anchorEl.classList.add('ring-2', 'ring-emerald-500/60', 'transition-all');
            setTimeout(() => anchorEl.classList.remove('ring-2', 'ring-emerald-500/60'), 1500);
            return;
        }
    }

    const path = getCurrentRoute();

    // Save previous scroll position before transition
    if (lastActiveRoute) {
        routeScrollPositions.set(lastActiveRoute, window.scrollY || 0);
    }
    lastActiveRoute = path;

    // Track navigation generation & abort obsolete in-flight requests
    const thisNavGen = ++currentNavGeneration;
    if (currentNavAbortController) {
        try { currentNavAbortController.abort(); } catch (e) { }
    }
    currentNavAbortController = new AbortController();

    // Only prompt login on checkout if unauthenticated; allow free store browsing
    if (!window.isUserLoggedIn()) {
        if (path === '/checkout') {
            localStorage.setItem('lpuquick_redirect', '#/checkout');
            window.location.hash = '#/signin';
            return;
        }
    } else if (path === '/signin') {
        // Once logged in, student never needs to see sign-in page again
        const target = localStorage.getItem('lpuquick_redirect') || '#/';
        localStorage.removeItem('lpuquick_redirect');
        window.location.hash = target;
        return;
    }

    // Check user block status on route change
    if (window.isUserLoggedIn()) {
        window.syncUserBlockStatus();
    }

    // Blocked user guard: Prevent checkout navigation
    if (window.__isUserBlocked && (path === '/checkout' || path === '/cart')) {
        window.location.hash = '#/blocked';
        return;
    }

    // Clean up active orders tracking timer when navigating away from /orders
    if (path !== '/orders' && window.__ordersTrackingTimer) {
        clearInterval(window.__ordersTrackingTimer);
        window.__ordersTrackingTimer = null;
    }

    const pageName = getPageName(path);
    if (typeof window.syncBottomNavVisualActive === 'function') {
        window.syncBottomNavVisualActive(pageName);
    }
    const appRoot = document.getElementById('app');

    if (!appRoot) return;

    try {
        // Non-blocking background cart revalidation with SWR
        const effectiveUid = window.getEffectiveUserId();
        if (!cartSyncInProgress) {
            cartSyncInProgress = true;
            window.api.getCart(effectiveUid)
                .then(() => {
                    cartSyncInProgress = false;
                    if (typeof window.syncCardSteppers === 'function') window.syncCardSteppers();
                    if (typeof window.updateGlobalCartBadges === 'function') window.updateGlobalCartBadges();
                })
                .catch(() => { cartSyncInProgress = false; });
        }

        const renderFn = window.pages[pageName];
        if (renderFn) {
            let html;
            try {
                html = await renderFn();
            } catch (renderErr) {
                console.error(`[Router Render Error] Failed rendering page "${pageName}":`, renderErr);
                appRoot.innerHTML = `
                    <div class="text-center pt-32 px-4">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                            <span class="material-symbols-outlined text-2xl">refresh</span>
                        </div>
                        <h1 class="font-headline-md text-xl font-bold text-on-surface">Unable to load page</h1>
                        <p class="text-xs text-slate-500 mt-1 mb-4">A temporary error occurred while opening this page.</p>
                        <div class="flex items-center justify-center gap-3">
                            <button type="button" onclick="if (typeof router === 'function') router();" class="inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-bold cursor-pointer active:scale-95 transition-transform shadow-md">Retry</button>
                            <a href="#/" class="inline-block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
                        </div>
                    </div>
                    ${typeof window.renderBottomNav === 'function' ? window.renderBottomNav(pageName) : ''}
                `;
                return;
            }

            // 🛡️ RACE CONDITION GUARD: Discard response if user navigated away while loading
            if (thisNavGen !== currentNavGeneration) {
                return;
            }

            appRoot.innerHTML = html;
            appRoot.classList.add('page-enter');
            setTimeout(() => appRoot.classList.remove('page-enter'), 200);

            // Initialize page-specific JS
            const initFn = window.pageInits[pageName];
            if (initFn) {
                try {
                    initFn();
                } catch (initErr) {
                    console.error(`[Router Init Error] Error initializing page "${pageName}":`, initErr);
                }
            }

            // Synchronize theme toggles
            if (typeof window.syncAllThemeToggles === 'function') {
                window.syncAllThemeToggles();
            }

            // Synchronize steppers & cart badges
            window.syncCardSteppers();
            if (typeof window.updateGlobalCartBadges === 'function') {
                window.updateGlobalCartBadges();
            }

            // Check and sync store availability banner
            window.syncStoreAvailability();

            // Bind global address modal trigger
            document.querySelectorAll('.address-selector-trigger').forEach(el => {
                if (!el.getAttribute('onclick')) {
                    el.onclick = (e) => {
                        e.preventDefault();
                        window.openAddressModal();
                    };
                }
            });

            // Intelligent Scroll Restoration
            const savedScroll = routeScrollPositions.get(path);
            if (savedScroll !== undefined && path !== '/checkout' && path !== '/orders') {
                window.scrollTo({ top: savedScroll, behavior: 'instant' });
            } else {
                window.scrollTo({ top: 0, behavior: 'instant' });
            }

            // Check active order delivery bar
            checkAndConnectGlobalOrderTracking();
        } else {
            appRoot.innerHTML = `
                <div class="text-center pt-32 px-4">
                    <h1 class="font-headline-md text-xl font-bold text-on-surface">Page not found</h1>
                    <a href="#/" class="mt-4 inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
                </div>
            `;
        }
    } catch (err) {
        console.error('Router error:', err);
    }
}

// Listen for tab focus to instantly refresh store availability
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            window.syncStoreAvailability();
        }
    });
}

// Periodic background availability sync (every 60s when active)
setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    window.syncStoreAvailability();
}, 60000);

// ================= GLOBAL REAL-TIME CLIENT-ADMIN COORDINATION HUB =================
let globalClientWs = null;
let clientWsReconnectTimer = null;
let clientWsReconnectAttempts = 0;
let clientWsPingInterval = null;
let currentTrackedOrderId = null;

// Fast Polling Fallback Engine (activates ONLY when WebSocket is disconnected)
let _clientPollTimer = null;
let _clientPollActive = false;
let _lastPollOrderStatus = null;
let _lastPollStoreAvail = null;
const CLIENT_POLL_FAST_MS = 1500;   // 1.5s for active in-progress order tracking (1-2s instant updates)
const CLIENT_POLL_IDLE_MS = 45000;  // 45s when user has no active order (saves 90%+ Vercel invocations)
const CLIENT_POLL_STORE_MS = 10000; // 10s for store availability updates
let _storePollTimer = null;

function startClientPollingFallback() {
    if (_clientPollActive) return;
    _clientPollActive = true;
    console.log('[LPUQuick Poll] ⚡ Smart polling fallback ACTIVATED (WS down)');
    scheduleNextClientPoll();
    scheduleNextStorePoll();
}

function stopClientPollingFallback() {
    if (!_clientPollActive) return;
    _clientPollActive = false;
    if (_clientPollTimer) { clearTimeout(_clientPollTimer); _clientPollTimer = null; }
    if (_storePollTimer) { clearTimeout(_storePollTimer); _storePollTimer = null; }
    console.log('[LPUQuick Poll] 🔌 Polling fallback STOPPED (WS reconnected)');
}

function scheduleNextClientPoll(customDelay = null) {
    if (!_clientPollActive) return;
    if (_clientPollTimer) clearTimeout(_clientPollTimer);

    if (customDelay !== null && customDelay <= 0) {
        _executeClientPoll();
        return;
    }

    const defaultDelay = (_lastPollOrderStatus && !_lastPollOrderStatus.includes('|Delivered') && !_lastPollOrderStatus.includes('|Cancelled'))
        ? CLIENT_POLL_FAST_MS
        : CLIENT_POLL_IDLE_MS;
    const delay = typeof customDelay === 'number' ? customDelay : defaultDelay;

    _clientPollTimer = setTimeout(_executeClientPoll, delay);
}

async function _executeClientPoll() {
    if (!_clientPollActive) return;
    let nextDelay = CLIENT_POLL_IDLE_MS;

    // Only poll if user is logged in and tab is visible
    if (!document.hidden && window.isUserLoggedIn()) {
        try {
            const userId = window.CURRENT_USER_ID;
            const activeRes = await window.api.getActiveOrder(userId, true);
            const active = activeRes?.active;
            if (active && !['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(active.status)) {
                nextDelay = CLIENT_POLL_FAST_MS; // Active in-flight order -> fast 5s poll
                const newSig = `${active.id}|${active.status}|${active.payment_status || ''}|${active.rider_name || ''}`;
                if (newSig !== _lastPollOrderStatus) {
                    _lastPollOrderStatus = newSig;
                    const riderName = active.rider_name || 'Alex';
                    console.log(`[Poll Sync] Order ${active.id} -> ${active.status} (${riderName}) [Pay: ${active.payment_status}]`);
                    handleLiveOrderStatusChange({
                        type: 'STATUS_UPDATE',
                        order_id: active.id,
                        orderId: active.id,
                        status: active.status,
                        payment_status: active.payment_status,
                        payment_method: active.payment_method,
                        rider_name: riderName
                    });
                }
            } else if (active && ['Delivered', 'delivered'].includes(active.status)) {
                const newSig = `${active.id}|${active.status}|${active.payment_status || ''}`;
                if (newSig !== _lastPollOrderStatus) {
                    _lastPollOrderStatus = newSig;
                    handleLiveOrderStatusChange({
                        type: 'STATUS_UPDATE',
                        order_id: active.id,
                        orderId: active.id,
                        status: active.status,
                        payment_status: active.payment_status,
                        payment_method: active.payment_method,
                        rider_name: active.rider_name || 'Alex'
                    });
                }
            } else if (!active && _lastPollOrderStatus && !_lastPollOrderStatus.includes('|Delivered') && !_lastPollOrderStatus.includes('|Cancelled')) {
                // Active order is now null! Check recent past orders to detect Delivered:
                try {
                    const allOrdersRes = await window.api.getOrders(userId, true);
                    const past = allOrdersRes?.past || [];
                    const lastOrder = past[0];
                    if (lastOrder && ['Delivered', 'delivered', 'Cancelled', 'cancelled'].includes(lastOrder.status)) {
                        const newSig = `${lastOrder.id}|${lastOrder.status}`;
                        if (newSig !== _lastPollOrderStatus) {
                            _lastPollOrderStatus = newSig;
                            handleLiveOrderStatusChange({
                                type: 'STATUS_UPDATE',
                                order_id: lastOrder.id,
                                orderId: lastOrder.id,
                                status: lastOrder.status,
                                rider_name: lastOrder.rider_name || 'Alex'
                            });
                        }
                    }
                } catch (e2) { }
            }
        } catch (e) {
            // Silently retry next cycle
        }
    }
    scheduleNextClientPoll(nextDelay);
}

window.triggerActiveOrderPoll = function () {
    scheduleNextClientPoll(0);
    if (typeof scheduleBackgroundOrderSync === 'function') {
        scheduleBackgroundOrderSync(true);
    }
};

function scheduleNextStorePoll() {
    if (!_clientPollActive) return;
    if (_storePollTimer) clearTimeout(_storePollTimer);
    _storePollTimer = setTimeout(async () => {
        if (!_clientPollActive) return;
        if (!document.hidden) {
            try {
                if (typeof window.syncStoreAvailability === 'function') {
                    await window.syncStoreAvailability();
                }
            } catch (e) { }
        }
        scheduleNextStorePoll();
    }, CLIENT_POLL_STORE_MS);
}

// Client Toast Notification Helper
function showClientToast(message, type = 'info', icon = 'bolt') {
    const container = document.getElementById('client-toast-container');
    if (!container) return;

    const id = `client-toast-${Date.now()}`;
    const styles = {
        success: 'border-emerald-500 bg-white/95 dark:bg-slate-900/95 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10',
        info: 'border-sky-500 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-sky-500/10',
        warning: 'border-amber-500 bg-white/95 dark:bg-slate-900/95 text-amber-800 dark:text-amber-300 shadow-amber-500/10',
        error: 'border-rose-500 bg-white/95 dark:bg-slate-900/95 text-rose-800 dark:text-rose-300 shadow-rose-500/10'
    };

    const toastHtml = `
        <div id="${id}" class="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border-l-4 ${styles[type] || styles.info} shadow-xl backdrop-blur-xl transition-all duration-300 transform translate-y-2 opacity-0">
            <div class="flex items-center gap-2.5 min-w-0">
                <span class="material-symbols-outlined text-lg shrink-0 text-emerald">${icon}</span>
                <p class="text-xs font-bold leading-tight truncate">${message}</p>
            </div>
            <button onclick="dismissClientToast('${id}')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs shrink-0 p-1">✕</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const el = document.getElementById(id);
    setTimeout(() => {
        if (el) {
            el.classList.remove('translate-y-2', 'opacity-0');
            el.classList.add('translate-y-0', 'opacity-100');
        }
    }, 20);

    setTimeout(() => { dismissClientToast(id); }, 5000);
}

function dismissClientToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => { el.remove(); }, 350);
}

// Global Client Realtime Dispatch & Supabase Integration
let clientSupabaseClient = null;
let clientSupabaseChannel = null;
const recentClientProcessedPackets = new Map();

function dispatchClientRealtimeEvent(data) {
    if (!data || !data.type) return;

    // Deduplication check across dual transports (WebSocket + Supabase broadcast)
    const sig = `${data.type}:${data.orderId || data.order?.id || data.productId || ''}:${data.status || data.stock_left || ''}`;
    const now = Date.now();
    const lastSeen = recentClientProcessedPackets.get(sig);
    if (lastSeen && (now - lastSeen < 1200)) {
        return;
    }
    recentClientProcessedPackets.set(sig, now);
    if (recentClientProcessedPackets.size > 200) {
        for (const [k, ts] of recentClientProcessedPackets.entries()) {
            if (now - ts > 10000) recentClientProcessedPackets.delete(k);
        }
    }

    // 1. Live Inventory & Stock Updates from Admin
    if (data.type === 'INVENTORY_UPDATE') {
        handleLiveInventoryChange(data);
    }
    // 2. Live Order Status Updates from Admin
    else if (data.type === 'STATUS_UPDATE' || data.type === 'ORDER_STATUS_UPDATE') {
        handleLiveOrderStatusChange(data);
    }
    // 3. New Order Confirmation
    else if (data.type === 'NEW_ORDER' && data.order) {
        if (window.CURRENT_USER_ID && data.order.user_id === window.CURRENT_USER_ID) {
            checkAndConnectGlobalOrderTracking();
            if (window.location.hash.includes('orders') && typeof window.renderPage === 'function') {
                window.renderPage();
            }
        }
    }
    // Live Order Deletion Handler
    else if (data.type === 'ORDER_DELETED') {
        if (window.CURRENT_ACTIVE_ORDER_ID === data.orderId) {
            window.CURRENT_ACTIVE_ORDER_ID = null;
            if (typeof window.api?.clearOrdersCache === 'function') {
                window.api.clearOrdersCache();
            }
            if (window.location.hash.includes('orders') && typeof window.renderPage === 'function') {
                window.renderPage();
            }
        }
    }
    // 4. Live Store Lock / Availability Updates from Admin
    else if (data.type === 'CLIENT_LOCK_UPDATE' && data.availability) {
        const clientHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        const targetHostel = data.availability.target_hostel || 'ALL';

        // Check if this update applies to this client (ALL or exact hostel match)
        const normClient = String(clientHostel).replace(/[\s\-_]/g, '').toLowerCase();
        const normTarget = String(targetHostel).replace(/[\s\-_]/g, '').toLowerCase();
        const isForMe = targetHostel === 'ALL' || normClient === normTarget;

        if (isForMe) {
            window.__storeAvailability = data.availability;
            if (typeof window.renderStoreClosedBannerOrOverlay === 'function') {
                window.renderStoreClosedBannerOrOverlay();
            }
            if (data.availability.is_locked) {
                showClientToast('🏪 Storefront is currently closed for restock.', 'warning', 'lock');
            } else {
                showClientToast('🚀 Storefront is now OPEN for orders!', 'success', 'bolt');
            }
            if (typeof window.syncStoreAvailability === 'function') {
                window.syncStoreAvailability(clientHostel);
            }
        }
    }
    // 5. Account Blocked Real-Time Notification
    else if (data.type === 'USER_BLOCKED') {
        const myUid = window.CURRENT_USER_ID || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
        if (data.userId && (data.userId === myUid || data.userId === window.CURRENT_USER_ID)) {
            window.__isUserBlocked = true;
            window.__userBlockReason = data.reason || 'Fake Orders';
            if (typeof updateBlockedUI === 'function') updateBlockedUI(true, window.__userBlockReason);
            window.location.hash = '#/blocked';
            alert(`⚠️ Account Suspended:\n\nYou are blocked due to ${(data.reason || 'fake orders').toLowerCase()}.\n\nPlease contact Central Campus Operations Hub.`);
        }
    }
    // 6. Account Unblocked Real-Time Notification
    else if (data.type === 'USER_UNBLOCKED') {
        const myUid = window.CURRENT_USER_ID || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
        if (data.userId && (data.userId === myUid || data.userId === window.CURRENT_USER_ID)) {
            window.__isUserBlocked = false;
            window.__userBlockReason = null;
            if (typeof updateBlockedUI === 'function') updateBlockedUI(false);
            window.location.hash = '#/';
            showClientToast('🎉 Your account access has been restored!', 'success', 'bolt');
        }
    }
    // 7. Live Promotional Banner Carousel Updates from Admin
    else if (data.type === 'ADVERTISEMENTS_UPDATED') {
        if (window.api?.clearHomeCache) window.api.clearHomeCache();
        const banners = data.posters || data.banners;
        try {
            if (Array.isArray(banners)) {
                localStorage.setItem('lpuquick_active_banners', JSON.stringify(banners));
            }
            if (data.settings) {
                localStorage.setItem('lpuquick_carousel_settings', JSON.stringify(data.settings));
            }
        } catch (e) { }
        window.dispatchEvent(new CustomEvent('advertisementsUpdated', { detail: data }));
        if (typeof window.refreshHomeCarousel === 'function') {
            window.refreshHomeCarousel(data);
        }
    }
    // 8. Live Delivery Person Assignment (Order Claimed by Delivery Boy)
    else if (data.type === 'ORDER_CLAIMED') {
        const riderName = data.adminName || data.rider_name || data.riderName || 'Delivery Rider';
        const riderPhone = data.adminPhone || data.riderPhone || '7671836211';
        const claimedOrderId = data.orderId || data.order_id;
        console.log(`[Realtime Delivery Sync] Order ${claimedOrderId} claimed by ${riderName} (${riderPhone})`);

        // Update rider name display on active tracking card
        const riderNameDisplay = document.getElementById('rider-name-display');
        if (riderNameDisplay) riderNameDisplay.textContent = riderName;
        const riderAvatar = document.getElementById('rider-avatar');
        if (riderAvatar) riderAvatar.textContent = riderName[0].toUpperCase();
        const riderCallBtn = document.getElementById('rider-call-btn');
        if (riderCallBtn && riderPhone) riderCallBtn.href = `tel:${riderPhone}`;

        // Update the global delivery bar rider name
        const barRiderName = document.getElementById('global-delivery-rider-name');
        if (barRiderName) barRiderName.textContent = riderName;

        // If user is on orders/tracking page, apply full UI update
        if (typeof window.applyOrderStatusUI === 'function') {
            const currentStatus = window.CURRENT_ACTIVE_ORDER_STATUS || 'Order Confirmed';
            window.applyOrderStatusUI(currentStatus, riderName, claimedOrderId, riderPhone);
        }

        // Show toast to student
        showClientToast(`🏃 ${riderName} accepted your delivery!`, 'success', 'directions_run');
    }
    // 9. Live Hostel Availability Updates from Admin Console
    else if (data.type === 'HOSTEL_STATUS_CHANGED') {
        window.__activeHostelsCache = null;
        if (window.api?.getActiveHostels) {
            window.api.getActiveHostels(true).catch(() => { });
        }
        const activeModal = document.getElementById('address-modal');
        if (activeModal && typeof window.openLocationModal === 'function') {
            window.openLocationModal(false);
        }
    }
}

async function initClientSupabaseRealtime() {
    try {
        if (typeof window === 'undefined') return;
        const createClientFn = window.supabase?.createClient || (typeof supabase !== 'undefined' ? supabase.createClient : null);
        if (!createClientFn) return;

        let cfg = window.__REALTIME_CONFIG__;
        if (!cfg) {
            const res = await fetch('/api/realtime/config');
            if (res.ok) {
                cfg = await res.json();
                window.__REALTIME_CONFIG__ = cfg;
            }
        }
        if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return;

        if (clientSupabaseChannel) {
            try { clientSupabaseChannel.unsubscribe(); } catch(e) {}
            clientSupabaseChannel = null;
        }

        if (!clientSupabaseClient) {
            clientSupabaseClient = createClientFn(cfg.supabaseUrl, cfg.supabaseAnonKey, {
                realtime: {
                    params: {
                        eventsPerSecond: 20
                    }
                }
            });
        }

        clientSupabaseChannel = clientSupabaseClient.channel('lpuquick_global_realtime');

        const events = [
            'INVENTORY_UPDATE', 'STATUS_UPDATE', 'ORDER_STATUS_UPDATE', 'NEW_ORDER',
            'ORDER_DELETED', 'CLIENT_LOCK_UPDATE', 'USER_BLOCKED', 'USER_UNBLOCKED',
            'ADVERTISEMENTS_UPDATED', 'ORDER_CLAIMED', 'HOSTEL_STATUS_CHANGED'
        ];

        events.forEach(ev => {
            clientSupabaseChannel.on('broadcast', { event: ev }, (payload) => {
                const data = payload?.payload;
                if (data) {
                    dispatchClientRealtimeEvent(data);
                }
            });
        });

        // Postgres changes on orders table for real-time order status updates
        clientSupabaseChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            try {
                const row = payload.new;
                if (!row) return;
                const myUid = window.CURRENT_USER_ID || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
                if (myUid && row.user_id && row.user_id !== myUid) {
                    return; // Strict Isolation: Only process for the logged-in customer's own order
                }
                if (payload.eventType === 'UPDATE') {
                    dispatchClientRealtimeEvent({
                        type: 'ORDER_STATUS_UPDATE',
                        orderId: row.id,
                        order_id: row.id,
                        status: row.status,
                        rider_name: row.rider_name || 'Alex'
                    });
                }
            } catch(e) {
                console.warn('[Client Supabase PG Changes Error]:', e);
            }
        });

        clientSupabaseChannel.subscribe((status) => {
            console.log(`[LPUQuick Client Supabase Realtime] Channel status: ${status}`);
        });
    } catch(err) {
        console.warn('[LPUQuick Client Supabase Realtime Error]:', err.message);
    }
}

// Global Client WebSocket Connection
function initGlobalClientWebSocket() {
    // Also proactively initialize Supabase Cloud Channel
    initClientSupabaseRealtime();

    if (globalClientWs && (globalClientWs.readyState === WebSocket.OPEN || globalClientWs.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (clientWsReconnectTimer) {
        clearTimeout(clientWsReconnectTimer);
        clientWsReconnectTimer = null;
    }

    if (clientWsPingInterval) {
        clearInterval(clientWsPingInterval);
        clientWsPingInterval = null;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/client`;

    try {
        globalClientWs = new WebSocket(wsUrl);

        globalClientWs.onopen = () => {
            console.log('[LPUQuick WS] ⚡ Connected to campus live stream.');
            clientWsReconnectAttempts = 0;

            // WS is live — kill the polling fallback (zero duplicate work)
            stopClientPollingFallback();

            // Register user if signed in
            if (window.CURRENT_USER_ID) {
                globalClientWs.send(JSON.stringify({
                    type: 'REGISTER_USER',
                    userId: window.CURRENT_USER_ID
                }));
            }

            // Keepalive ping every 20s
            clientWsPingInterval = setInterval(() => {
                if (globalClientWs && globalClientWs.readyState === WebSocket.OPEN) {
                    globalClientWs.send(JSON.stringify({ type: 'PING' }));
                }
            }, 20000);
        };

        globalClientWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                dispatchClientRealtimeEvent(data);
            } catch (err) {
                console.error('[LPUQuick WS Parse Error]:', err);
            }
        };

        globalClientWs.onclose = () => {
            globalClientWs = null;
            if (clientWsPingInterval) { clearInterval(clientWsPingInterval); clientWsPingInterval = null; }

            // Activate fast polling fallback immediately when WS drops
            startClientPollingFallback();

            // Continuous resilient reconnect with short exponential backoff (1.5s - 10s max)
            const delay = Math.min(1500 * Math.max(1, clientWsReconnectAttempts), 10000);
            clientWsReconnectAttempts = (clientWsReconnectAttempts + 1) % 20;
            if (clientWsReconnectTimer) clearTimeout(clientWsReconnectTimer);
            clientWsReconnectTimer = setTimeout(() => {
                clientWsReconnectTimer = null;
                initGlobalClientWebSocket();
            }, delay);
        };

        globalClientWs.onerror = () => {
            try { globalClientWs.close(); } catch (e) { }
        };

    } catch (e) {
        // Activate polling fallback on connection failure
        startClientPollingFallback();
        if (!clientWsReconnectTimer) {
            clientWsReconnectTimer = setTimeout(initGlobalClientWebSocket, 3000);
        }
    }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
        console.log('[Client Network] 🌐 Reconnected to internet. Re-syncing live state...');
        initGlobalClientWebSocket();
        initClientSupabaseRealtime();
        checkAndConnectGlobalOrderTracking();
        const activeHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        if (typeof window.syncStoreAvailability === 'function') {
            window.syncStoreAvailability(activeHostel);
        }
        if (typeof window.api?.clearOrdersCache === 'function') {
            window.api.clearOrdersCache();
        }
        if (window.location.hash.includes('orders') && typeof window.renderPage === 'function') {
            window.renderPage();
        }
    });

    window.addEventListener('offline', () => {
        console.warn('[Client Network] ⚠️ Connection dropped.');
    });
}

// Multi-Tab Instant Ads Synchronization
try {
    if (typeof BroadcastChannel !== 'undefined') {
        const clientAdsChannel = new BroadcastChannel('lpuquick_ads_sync');
        clientAdsChannel.onmessage = (event) => {
            if (event.data && (event.data.type === 'ADVERTISEMENTS_UPDATED' || event.data.posters || event.data.banners)) {
                if (window.api?.clearHomeCache) window.api.clearHomeCache();
                const banners = event.data.posters || event.data.banners;
                try {
                    if (Array.isArray(banners)) {
                        localStorage.setItem('lpuquick_active_banners', JSON.stringify(banners));
                    }
                    if (event.data.settings) {
                        localStorage.setItem('lpuquick_carousel_settings', JSON.stringify(event.data.settings));
                    }
                } catch (e) { }
                window.dispatchEvent(new CustomEvent('advertisementsUpdated', { detail: event.data }));
                if (typeof window.refreshHomeCarousel === 'function') {
                    window.refreshHomeCarousel(event.data);
                }
            }
        };
    }
} catch (e) { }


// In-place Real-Time Stock Updates across DOM
function handleLiveInventoryChange(data) {
    if (!data) return;
    // Strict Dark-Store Hostel Isolation: Only apply update if it matches current client hostel
    if (data.hostel_id) {
        const clientHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        const normClient = clientHostel.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normData = String(data.hostel_id).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normClient !== normData) {
            return; // Stock update belongs to another hostel dark-store
        }
    }

    const { productId, stock_left, in_stock } = data;
    console.log(`[Realtime Stock Sync] Product ${productId}: Stock=${stock_left}, InStock=${in_stock}`);

    const isOut = !in_stock || stock_left <= 0;

    // 0. Update authoritative in-memory product cache immediately
    if (window.__cachedProducts) {
        let cached = window.__cachedProducts.get(productId);
        if (cached) {
            cached.stock_left = stock_left;
            cached.in_stock = Boolean(in_stock && stock_left > 0);
        } else {
            window.__cachedProducts.set(productId, {
                id: productId,
                stock_left: stock_left,
                in_stock: Boolean(in_stock && stock_left > 0)
            });
        }
    }

    // 1. Update all product action slots and cards on screen
    const slots = document.querySelectorAll(`.product-action-slot[data-id="${productId}"]`);
    slots.forEach(slot => {
        slot.dataset.outOfStock = isOut ? 'true' : 'false';
        slot.dataset.stockLeft = String(stock_left);
        const card = slot.closest('.product-detail-trigger, .product-card-container, .product-card-item');
        if (card) {
            if (isOut) {
                card.classList.add('opacity-75');
                card.dataset.outOfStock = 'true';
            } else {
                card.classList.remove('opacity-75');
                card.dataset.outOfStock = 'false';
            }
        }
        renderSlotContent(productId, slot);
    });

    window.syncCardSteppers();

    // 2. Update single product detail modal/page if open
    const modalAddBtn = document.querySelector(`#modal-add-btn[data-id="${productId}"]`);
    if (modalAddBtn) {
        if (isOut) {
            modalAddBtn.disabled = true;
            modalAddBtn.className = 'w-full bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full py-3 text-xs font-bold cursor-not-allowed';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">block</span> Out of Stock';
        } else {
            modalAddBtn.disabled = false;
            modalAddBtn.className = 'w-full bg-emerald hover:bg-primary text-white py-3 rounded-full font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart';
        }
    }

    const modalEl = document.getElementById('product-modal');
    if (modalEl && modalEl.dataset.productId === productId && typeof renderModalActionContainer === 'function') {
        const cached = window.__cachedProducts?.get(productId);
        const pPrice = Number(cached?.price) || 0;
        renderModalActionContainer(productId, pPrice, stock_left, isOut);
    }

    // 3. Dynamically update stock badges across all card images and headers
    const badges = document.querySelectorAll(`.stock-badge[data-id="${productId}"]`);
    badges.forEach(b => {
        if (isOut) {
            b.className = 'stock-badge absolute top-2 left-2 z-10 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm block';
            b.textContent = 'Out of Stock';
            b.style.display = 'block';
        } else if (stock_left > 0 && stock_left <= 4) {
            b.className = 'stock-badge absolute top-2 left-2 z-10 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5';
            b.textContent = `Only ${stock_left} left`;
            b.style.display = 'flex';
        } else {
            b.className = 'stock-badge absolute top-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm hidden';
            b.style.display = 'none';
        }
    });

    // In case card pedestals did not render the badge markup initially, dynamically inject it
    if (badges.length === 0) {
        document.querySelectorAll(`.product-card-item[data-product-id="${productId}"] .card-pedestal`).forEach(ped => {
            let b = ped.querySelector(`.stock-badge[data-id="${productId}"]`);
            if (!b) {
                b = document.createElement('div');
                b.className = `stock-badge absolute top-2 left-2 z-10 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm ${isOut ? 'bg-rose-600 text-white block' : (stock_left > 0 && stock_left <= 4 ? 'bg-amber-500 text-white flex items-center gap-0.5' : 'hidden')}`;
                b.dataset.id = productId;
                b.style.display = isOut ? 'block' : (stock_left > 0 && stock_left <= 4 ? 'flex' : 'none');
                b.textContent = isOut ? 'Out of Stock' : (stock_left > 0 && stock_left <= 4 ? `Only ${stock_left} left` : '');
                ped.insertBefore(b, ped.firstChild);
            }
        });
    }

    const badgeTexts = document.querySelectorAll(`.stock-badge-text[data-id="${productId}"]`);
    badgeTexts.forEach(bt => {
        if (stock_left > 0 && stock_left <= 4) {
            bt.textContent = `⚡ Only ${stock_left} left`;
            bt.style.display = 'inline-block';
        } else {
            bt.style.display = 'none';
        }
    });
}

// In-place Real-Time Order Status Updates
function handleLiveOrderStatusChange(data) {
    const status = data.status;
    const riderName = data.rider_name || data.riderName || 'Alex';
    const riderPhone = data.rider_phone || data.riderPhone || data.adminPhone || '7671836211';
    const orderId = data.order_id || data.orderId;

    console.log(`[Realtime Order Sync] Order ${orderId} -> ${status} (${riderName})`);

    // Invalidate orders cache immediately so subsequent reads are fresh
    if (window.api && typeof window.api.clearOrdersCache === 'function') {
        window.api.clearOrdersCache();
    }

    // 1. Update Global Floating Bar
    updateGlobalDeliveryBar(status, riderName);

    // 2. If user is currently viewing the Live Orders page, update the interactive HUD/map in real-time
    if (typeof window.applyOrderStatusUI === 'function') {
        window.applyOrderStatusUI(status, riderName, orderId, riderPhone, {
            payment_status: data.payment_status,
            payment_method: data.payment_method,
            utr: data.utr
        });
    } else {
        // Play status chime on any page
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659.25, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) { }
    }

    // 3. Show dynamic client status toast
    const activeHub = window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Store');
    const statusMessages = {
        'Order Confirmed': `👍 ${activeHub} accepted your order!`,
        'Preparing': `📦 Items packed & sealed at ${activeHub} Dark Store!`,
        'Out for Delivery': `🚶‍♂️ ${riderName} is speeding towards your room!`,
        'Delivered': '🎉 Order delivered to your room door!',
        'Cancelled': '❌ Order was cancelled by Admin.'
    };

    if (statusMessages[status]) {
        showClientToast(statusMessages[status], status === 'Cancelled' ? 'error' : 'success', status === 'Delivered' ? 'task_alt' : 'bolt');
    }
}

async function checkAndConnectGlobalOrderTracking() {
    try {
        const bar = document.getElementById('global-live-delivery-bar');
        if (!window.isUserLoggedIn()) {
            if (bar) bar.classList.add('hidden');
            return;
        }
        const userId = window.CURRENT_USER_ID;
        const activeRes = await window.api.getActiveOrder(userId);
        const active = activeRes?.active;

        if (!active || ['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(active.status)) {
            currentTrackedOrderId = null;
            if (bar) bar.classList.add('hidden');
            return;
        }

        currentTrackedOrderId = active.id;
        updateGlobalDeliveryBar(active.status, active.rider_name || 'Nivas Naidu', active.delivery_address);

        // Only show floating bar when not already on dedicated tracking pages
        const currentPath = getCurrentRoute();
        if (bar) {
            if (currentPath === '/orders' || currentPath === '/checkout') {
                bar.classList.add('hidden');
            } else {
                bar.classList.remove('hidden');
            }
        }

    } catch (e) {
        console.warn('[Global Tracking Sync]:', e);
    }
}

function getNotificationStageDetails(status, riderName, addressStr) {
    const s = (status || '').toLowerCase().trim();
    const rider = riderName || 'Nivas Naidu';

    // Extract clean hostel & room for badge and notification text
    let roomBadge = 'ROOM BH13';
    let hostelShort = 'BH13';
    try {
        const fullAddr = addressStr || window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'BH13');
        const matchRoom = fullAddr.match(/room\s*[:#-]?\s*([a-zA-Z0-9_-]+)/i);
        const matchHostel = fullAddr.match(/(?:BH|GH)[\s-]*\d+/i);
        if (matchHostel) hostelShort = matchHostel[0].replace(/[\s-]/g, '').toUpperCase();
        if (matchRoom) {
            roomBadge = `${hostelShort} · Room ${matchRoom[1]}`;
        } else {
            roomBadge = `ROOM ${hostelShort}`;
        }
    } catch (e) {
        roomBadge = 'ROOM BH13';
    }

    // Stage 1: 🟢 ORDER CONFIRMED
    if (s.includes('place') || s === 'pending') {
        return {
            stageIndex: 0,
            stageName: 'ORDER CONFIRMED',
            title: 'Order Confirmed • Arriving in 8-10 mins',
            subtitle: "Your order is confirmed! We're getting it ready.",
            cardSubtitle: `${hostelShort} Hub verified your order · Preparing soon`,
            gif: '/img/notif_confirmed.gif',
            progress: 25,
            eta: 'Arriving in 8-10 mins',
            roomBadge: roomBadge
        };
    }
    if (s.includes('confirm') || s === 'accepted') {
        return {
            stageIndex: 0,
            stageName: 'ORDER CONFIRMED',
            title: 'Order Confirmed • Arriving in 8-10 mins',
            subtitle: "Your order is confirmed! We're getting it ready.",
            cardSubtitle: `Order Confirmed · Runner ${rider} assigned`,
            gif: '/img/notif_confirmed.gif',
            progress: 35,
            eta: 'Arriving in 8-10 mins',
            roomBadge: roomBadge
        };
    }

    // Stage 2: 🟡 PREPARING
    if (s.includes('prepar') || s.includes('pack')) {
        return {
            stageIndex: 1,
            stageName: 'PREPARING',
            title: 'Preparing • Arriving in 5-6 mins',
            subtitle: "Your favourites are getting ready!",
            cardSubtitle: `Staff packing your bag at ${hostelShort} Hub`,
            gif: '/img/notif_preparing.gif',
            progress: 55,
            eta: 'Arriving in 5-6 mins',
            roomBadge: roomBadge
        };
    }

    // Stage 4: 🏃 NEAR YOUR ROOM (Reference Image exact match: Arriving in 1-2 minutes! 🚀)
    if (s.includes('near') || s.includes('reach') || s.includes('arriving')) {
        return {
            stageIndex: 3,
            stageName: 'NEAR YOUR ROOM',
            title: 'Arriving in 1-2 minutes! 🚀',
            subtitle: "Almost there! Your order will reach you shortly.",
            cardSubtitle: `🏃 ${rider} is running to your room (${hostelShort})!`,
            gif: '/img/notif_near_room.gif',
            progress: 88,
            eta: 'Arriving in 1-2 minutes! 🚀',
            roomBadge: roomBadge
        };
    }

    // Stage 3: 🛵 OUT FOR DELIVERY
    if (s.includes('out') || s.includes('route') || s.includes('dispatch')) {
        return {
            stageIndex: 2,
            stageName: 'OUT FOR DELIVERY',
            title: 'Out for Delivery • Arriving in 3-4 mins 🛵',
            subtitle: "Your LPUQuick delivery partner is on the way!",
            cardSubtitle: `🛵 ${rider} is on the way to ${hostelShort}!`,
            gif: '/img/notif_out_for_delivery.gif',
            progress: 75,
            eta: 'Arriving in 3-4 mins 🛵',
            roomBadge: roomBadge
        };
    }

    // Stage 5: 🎉 ARRIVED AT YOUR ROOM
    if (s.includes('deliver') || s.includes('arrived')) {
        return {
            stageIndex: 4,
            stageName: 'ARRIVED AT YOUR ROOM',
            title: 'Your LPUQuick delivery has arrived! 🎉',
            subtitle: "Your LPUQuick delivery has arrived! Enjoy!",
            cardSubtitle: `🎉 Delivered to ${roomBadge}! Enjoy your order.`,
            gif: '/img/notif_arrived.gif',
            progress: 100,
            eta: 'Arrived at your Room! ✓',
            roomBadge: roomBadge
        };
    }

    if (s.includes('cancel')) {
        return {
            stageIndex: -1,
            stageName: 'CANCELLED',
            title: 'Order Cancelled ✕',
            subtitle: "Order was cancelled",
            cardSubtitle: '❌ Order was cancelled by Admin',
            gif: '/img/notif_confirmed.gif',
            progress: 0,
            eta: 'Order Cancelled ✕',
            roomBadge: roomBadge
        };
    }

    return {
        stageIndex: 0,
        stageName: 'ORDER CONFIRMED',
        title: 'Order Confirmed • Arriving in 8-10 mins',
        subtitle: "Your order is confirmed! We're getting it ready.",
        cardSubtitle: `${hostelShort} Hub verified your order`,
        gif: '/img/notif_confirmed.gif',
        progress: 25,
        eta: 'Arriving in 8-10 mins',
        roomBadge: roomBadge
    };
}

function updateLiveSystemNotification(orderId, stageInfo) {
    try {
        if (!('Notification' in window)) return;
        
        // Ask permission non-intrusively if not already decided
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }

        if (Notification.permission === 'granted' && stageInfo && stageInfo.stageIndex >= 0) {
            const isDelivered = stageInfo.stageIndex === 4;
            const isNearRoom = stageInfo.stageIndex === 3;
            const bannerUrl = (window.location.origin || '') + stageInfo.gif + '?v=' + stageInfo.stageIndex;

            const payload = {
                title: stageInfo.title,
                body: `${stageInfo.subtitle} • Delivering to ${stageInfo.roomBadge}`,
                icon: '/icon-192.png',
                badge: '/favicon.png',
                image: bannerUrl,
                tag: 'lpuquick-live-order',
                renotify: isDelivered || isNearRoom,
                silent: !isDelivered && !isNearRoom,
                data: {
                    url: '/#/orders',
                    orderId: orderId || '',
                    stageIndex: stageInfo.stageIndex
                },
                actions: [
                    { action: 'track', title: '📍 Track Live' },
                    { action: 'help', title: '💬 Delivery Help' }
                ]
            };

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(reg => {
                    if (reg && reg.showNotification) {
                        reg.showNotification(payload.title, payload).catch(() => {});
                    }
                }).catch(() => {});
            } else {
                try {
                    new Notification(payload.title, payload);
                } catch (e) {}
            }
        }
    } catch (err) {
        console.warn('[Live Notification Sync Warning]:', err);
    }
}

function updateGlobalDeliveryBar(status, riderName, addressStr) {
    const bar = document.getElementById('global-live-delivery-bar');
    const etaEl = document.getElementById('global-delivery-eta');
    const subEl = document.getElementById('global-delivery-subtitle');
    const fillEl = document.getElementById('global-delivery-progress-fill');
    const pinEl = document.getElementById('global-delivery-runner-pin');
    const runnerImg = document.getElementById('global-delivery-runner-img');
    const roomTextEl = document.getElementById('global-delivery-room-text');

    if (!bar) return;

    const stage = getNotificationStageDetails(status, riderName, addressStr);

    if (stage.stageIndex === -1) {
        if (etaEl) etaEl.textContent = stage.eta;
        if (subEl) subEl.textContent = stage.cardSubtitle;
        if (fillEl) fillEl.style.width = '0%';
        setTimeout(() => { bar.classList.add('hidden'); }, 5000);
        return;
    }

    if (stage.stageIndex === 4) {
        setTimeout(() => { bar.classList.add('hidden'); }, 12000);
    }

    if (etaEl) etaEl.textContent = stage.eta;
    if (subEl) subEl.textContent = stage.cardSubtitle;
    if (roomTextEl) roomTextEl.textContent = stage.roomBadge;
    if (fillEl) fillEl.style.width = `${stage.progress}%`;
    if (pinEl) pinEl.style.left = `calc(${stage.progress}% - 10px)`;

    if (runnerImg && runnerImg.getAttribute('data-src') !== stage.gif) {
        runnerImg.setAttribute('data-src', stage.gif);
        runnerImg.src = stage.gif;
    }

    // Live Device Notification Sync (Tray Notification with Animated Banner)
    updateLiveSystemNotification(currentTrackedOrderId, stage);
}

function showStoreOpenedNotification(hostelName) {
    try {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
            return;
        }

        if (Notification.permission !== 'granted') return;

        const rawHostel = hostelName || window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH13';
        const cleanHostel = rawHostel.replace('-', '').toUpperCase();
        const bannerUrl = (window.location.origin || '') + '/img/notif_store_open.gif?v=' + Date.now();

        const payload = {
            title: "🟢 We're Open! Order Your Campus Favourites 🛒",
            body: `LPUQuick is now open for ${cleanHostel}! Fast 10-minute delivery to your room.`,
            icon: '/icon-192.png',
            badge: '/favicon.png',
            image: bannerUrl,
            tag: 'lpuquick-store-open',
            renotify: true,
            silent: false,
            data: {
                url: '/#/',
                type: 'STORE_OPEN'
            },
            actions: [
                { action: 'order', title: '🛒 Order Now' },
                { action: 'view', title: 'View Menu' }
            ]
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                if (reg && reg.showNotification) {
                    reg.showNotification(payload.title, payload).catch(() => {});
                }
            }).catch(() => {});
        } else {
            try {
                new Notification(payload.title, payload);
            } catch (e) {}
        }

        if (typeof window.showClientToast === 'function') {
            window.showClientToast(`🎉 Store is now open for ${cleanHostel}! Order snacks & essentials now.`, 'success', 'store');
        }
    } catch (e) {
        console.warn('[Store Open Notification Error]:', e);
    }
}

window.handleNotifyStoreOpenTap = async function (btn) {
    try {
        if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                localStorage.setItem('lpuquick_notify_store_open', 'true');
                if (btn) {
                    btn.innerHTML = `<span class="material-symbols-outlined text-sm text-white">check_circle</span><span>We'll Notify You When Open!</span>`;
                    btn.classList.add('bg-emerald-700', 'cursor-default');
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast("🔔 You'll receive a live notification the moment the store opens!", "success", "notifications");
                }
                return;
            }
        }
        if (typeof window.showClientToast === 'function') {
            window.showClientToast("Please allow notifications in browser settings to get store alerts.", "warning", "notifications_off");
        }
    } catch (e) {
        console.warn(e);
    }
};

window.showStoreOpenedNotification = showStoreOpenedNotification;
window.getNotificationStageDetails = getNotificationStageDetails;
window.updateLiveSystemNotification = updateLiveSystemNotification;
window.updateGlobalDeliveryBar = updateGlobalDeliveryBar;

window.router = router;
window.navigate = navigate;

// ============================================================
// Mobile Pull-to-Refresh & Live Page Reload Engine
// ============================================================
window.refreshLiveApp = async function (isFullReload = false) {
    if (window.__cachedProducts) {
        window.__cachedProducts.clear();
    }
    if (typeof window.api?.clearCartCache === 'function') {
        window.api.clearCartCache();
    }

    if (isFullReload) {
        try {
            sessionStorage.setItem('lpuquick_just_reloaded', 'true');
        } catch (e) { }
        window.location.reload();
        return;
    }

    try {
        if (typeof window.router === 'function') {
            await window.router();
        } else if (typeof router === 'function') {
            await router();
        }
        if (typeof window.syncCardSteppers === 'function') {
            window.syncCardSteppers();
        }
        if (typeof window.showClientToast === 'function') {
            window.showClientToast('✓ Live campus feed updated!', 'success', 'sync');
        }
    } catch (err) {
        console.warn('Live refresh error:', err);
    }
};

function initPullToRefresh() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.__ptrInitialized) return;
    window.__ptrInitialized = true;

    let indicator = document.getElementById('pull-to-refresh-indicator');
    if (!indicator && document.body) {
        indicator = document.createElement('div');
        indicator.id = 'pull-to-refresh-indicator';
        indicator.innerHTML = `
            <span class="material-symbols-outlined ptr-icon">arrow_downward</span>
            <span class="ptr-text">Pull down to refresh</span>
        `;
        document.body.appendChild(indicator);
    }

    const iconEl = indicator?.querySelector('.ptr-icon');
    const textEl = indicator?.querySelector('.ptr-text');

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let hasVibrated = false;
    const PULL_THRESHOLD = 68;
    const MAX_PULL = 110;

    window.addEventListener('touchstart', (e) => {
        if ((window.scrollY || document.documentElement.scrollTop || 0) <= 2 && e.touches.length === 1) {
            startY = e.touches[0].clientY;
            isDragging = true;
            hasVibrated = false;
        } else {
            isDragging = false;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1 || !indicator) return;
        currentY = e.touches[0].clientY;
        const delta = currentY - startY;

        if (delta > 0 && (window.scrollY || document.documentElement.scrollTop || 0) <= 2) {
            const pullDistance = Math.min(MAX_PULL, delta * 0.45);

            indicator.classList.add('dragging');
            indicator.style.opacity = `${Math.min(1, pullDistance / 40)}`;
            indicator.style.transform = `translate3d(-50%, ${pullDistance - 45}px, 0)`;

            if (pullDistance >= PULL_THRESHOLD) {
                if (!indicator.classList.contains('can-release')) {
                    indicator.classList.add('can-release');
                    if (textEl) textEl.textContent = 'Release to reload';
                    if (!hasVibrated) {
                        try {
                            if (navigator.vibrate) navigator.vibrate(25);
                        } catch (vErr) { }
                        hasVibrated = true;
                    }
                }
            } else {
                if (indicator.classList.contains('can-release')) {
                    indicator.classList.remove('can-release');
                    if (textEl) textEl.textContent = 'Pull down to refresh';
                }
            }
        } else {
            resetIndicator();
        }
    }, { passive: true });

    window.addEventListener('touchend', async () => {
        if (!isDragging || !indicator) return;
        isDragging = false;

        const delta = currentY - startY;
        const pullDistance = delta * 0.45;

        if (pullDistance >= PULL_THRESHOLD && (window.scrollY || document.documentElement.scrollTop || 0) <= 2) {
            indicator.classList.remove('dragging', 'can-release');
            indicator.classList.add('refreshing');
            if (iconEl) iconEl.textContent = 'sync';
            if (textEl) textEl.textContent = 'Reloading campus feed...';
            indicator.style.transform = `translate3d(-50%, 20px, 0)`;
            indicator.style.opacity = '1';

            try {
                if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
            } catch (e) { }

            setTimeout(async () => {
                await window.refreshLiveApp(true);
                setTimeout(resetIndicator, 400);
            }, 450);
        } else {
            resetIndicator();
        }
        startY = 0;
        currentY = 0;
    }, { passive: true });

    function resetIndicator() {
        if (!indicator) return;
        indicator.classList.remove('dragging', 'can-release', 'refreshing');
        if (iconEl) iconEl.textContent = 'arrow_downward';
        if (textEl) textEl.textContent = 'Pull down to refresh';
        indicator.style.transform = 'translate3d(-50%, -120%, 0)';
        indicator.style.opacity = '0';
    }
}

function handlePostReloadToast() {
    try {
        if (sessionStorage.getItem('lpuquick_just_reloaded') === 'true') {
            sessionStorage.removeItem('lpuquick_just_reloaded');
            setTimeout(() => {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('✓ Refreshed with latest campus updates!', 'success', 'check_circle');
                }
            }, 350);
        }
    } catch (e) { }
}

window.addEventListener('hashchange', router);

let isAppInitialized = false;
function bootstrapApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;
    router();
    initGlobalClientWebSocket();
    checkAndConnectGlobalOrderTracking();
    initPullToRefresh();
    handlePostReloadToast();

    // Instant proactive sync of live hostels & admin-configured blocks
    if (window.api && typeof window.api.getActiveHostels === 'function') {
        window.api.getActiveHostels(true).catch(() => {});
    }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrapApp();
} else {
    window.addEventListener('DOMContentLoaded', bootstrapApp);
}

// Smart Background Sync (8s when an active order is being tracked, 45s when idle/no active order)
let backgroundOrderSyncTimer = null;
function scheduleBackgroundOrderSync(immediate = false) {
    if (backgroundOrderSyncTimer) clearTimeout(backgroundOrderSyncTimer);
    if (immediate) {
        _runBackgroundOrderSync();
        return;
    }
    const delay = currentTrackedOrderId ? 8000 : 45000;
    backgroundOrderSyncTimer = setTimeout(_runBackgroundOrderSync, delay);
}

async function _runBackgroundOrderSync() {
    if (!document.hidden && window.isUserLoggedIn()) {
        await checkAndConnectGlobalOrderTracking();
    }
    scheduleBackgroundOrderSync();
}
scheduleBackgroundOrderSync();

// Aggressive Visibility & Network Reconnect Hooks
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Tab became active — immediately check WS health and reconnect if dead
        if (!globalClientWs || globalClientWs.readyState !== WebSocket.OPEN) {
            console.log('[LPUQuick WS] 🔄 Tab active — reconnecting WS...');
            clientWsReconnectAttempts = 0; // Reset backoff on user return
            if (clientWsReconnectTimer) { clearTimeout(clientWsReconnectTimer); clientWsReconnectTimer = null; }
            initGlobalClientWebSocket();
        }
        if (window.isUserLoggedIn()) {
            checkAndConnectGlobalOrderTracking();
        }
        if (typeof window.syncStoreAvailability === 'function') {
            window.syncStoreAvailability();
        }
    }
});

// Network restored — immediately reconnect WS
window.addEventListener('online', () => {
    console.log('[LPUQuick WS] 🌐 Network restored — reconnecting...');
    clientWsReconnectAttempts = 0;
    if (clientWsReconnectTimer) { clearTimeout(clientWsReconnectTimer); clientWsReconnectTimer = null; }
    initGlobalClientWebSocket();
    if (window.isUserLoggedIn()) {
        checkAndConnectGlobalOrderTracking();
    }
});

// ============================================================
// Interactive Magnetic Cursor Torch & Dynamic Ambient Parallax (Desktop Only)
// ============================================================
(function initInteractiveAtmosphere() {
    // Only run cursor torch & mouse parallax on desktop screens with fine pointer to avoid mobile scroll lag
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia('(pointer: coarse)').matches || (window.innerWidth && window.innerWidth < 768)) {
        return;
    }


    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isTicking = false;
    let lastScrollY = window.scrollY || 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY || 0;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    function renderFrame() {
        // Smooth lerp (dampening)
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        const torch = document.getElementById('ambient-cursor-torch');
        if (torch) {
            torch.style.transform = `translate3d(${currentX - 240}px, ${currentY - 240}px, 0)`;
        }

        // Parallax reaction on floating leaves and lineart
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (mouseX - centerX) / centerX;
        const deltaY = (mouseY - centerY) / centerY;
        const scrollOffset = lastScrollY * 0.05;

        const leaves = document.querySelectorAll('.ambient-leaf');
        leaves.forEach((leaf, idx) => {
            const factor = (idx + 1) * 2.2;
            leaf.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * (idx % 2 === 0 ? 1 : 0.6)}px, 0)`;
        });

        const lineart = document.querySelectorAll('.ambient-lineart');
        lineart.forEach((art, idx) => {
            const factor = (idx + 1) * 3;
            art.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * 0.8}px, 0)`;
        });

        if (Math.abs(mouseX - currentX) > 0.3 || Math.abs(mouseY - currentY) > 0.3) {
            requestAnimationFrame(renderFrame);
        } else {
            isTicking = false;
        }
    }
})();




// ============================================================
// Customer In-App Notification Center & Push Registration
// ============================================================
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function registerCustomerPushSubscription() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
            const res = await fetch('/api/notifications/vapid-public-key');
            const data = await res.json();
            if (!data.success || !data.publicKey) return;

            const convertedKey = urlBase64ToUint8Array(data.publicKey);
            sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            });
        }

        if (sub) {
            const userId = window.CURRENT_USER_ID || localStorage.getItem('lpuquick_user_id') || 'guest_student';
            const userName = window.CURRENT_USER_NAME || 'Student';
            const hostelId = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';

            await fetch('/api/notifications/customer-subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscription: sub,
                    userId,
                    userName,
                    hostelId
                })
            });
        }
    } catch (e) {
        console.warn('[Customer Push Registration Note]:', e);
    }
}

window.openCustomerNotificationsModal = async function () {
    const modal = document.getElementById('modal-customer-notifications');
    const listEl = document.getElementById('customer-announcements-list');
    if (modal) modal.classList.remove('hidden');

    try {
        const targetHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
        const res = await fetch(`/api/notifications/customer-feed?hostelId=${encodeURIComponent(targetHostel)}`);
        const data = await res.json();
        const items = data.announcements || [];

        if (!listEl) return;

        if (items.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <span class="material-symbols-outlined text-3xl mb-1 text-slate-300">notifications_none</span>
                    <p class="text-xs">No new notifications right now. Check back soon!</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = items.map(item => {
            const timeAgo = formatTimeAgo(item.sentAt || item.createdAt);
            const imageHtml = item.imageUrl ? `
                <div class="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 aspect-[2.4/1]">
                    <img src="${item.imageUrl}" class="w-full h-full object-cover" alt="Announcement" />
                </div>
            ` : '';
            const actionHtml = item.actionText ? `
                <div class="mt-2.5 pt-1">
                    <a href="${item.actionUrl || '/#/'}" onclick="window.closeCustomerNotificationsModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-xs">
                        <span>${item.actionText}</span>
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </a>
                </div>
            ` : '';

            return `
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 text-left space-y-1">
                    <div class="flex items-center justify-between text-[10.5px]">
                        <span class="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">${item.category ? item.category.replace('_', ' ') : 'Announcement'}</span>
                        <span class="text-slate-400">${timeAgo}</span>
                    </div>
                    <h4 class="text-xs font-black text-slate-900 dark:text-white">${escapeHtml(item.title)}</h4>
                    <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">${escapeHtml(item.body)}</p>
                    ${imageHtml}
                    ${actionHtml}
                </div>
            `;
        }).join('');

        // Clear badge
        const badge = document.getElementById('header-notif-badge');
        if (badge) badge.classList.add('hidden');

    } catch (err) {
        if (listEl) {
            listEl.innerHTML = `
                <div class="text-center py-6 text-slate-400">
                    <p class="text-xs">Failed to load campus feed. Please try again.</p>
                </div>
            `;
        }
    }
};

window.closeCustomerNotificationsModal = function () {
    const modal = document.getElementById('modal-customer-notifications');
    if (modal) modal.classList.add('hidden');
};

window.requestNotificationPermissionFromCenter = async function () {
    try {
        if ('Notification' in window) {
            const perm = await Notification.requestPermission();
            if (perm === 'granted') {
                await registerCustomerPushSubscription();
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast("🔔 Device push enabled! You'll receive real-time campus alerts.", "success", "notifications");
                }
            } else {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast("Please allow notifications in browser permissions.", "warning", "notifications_off");
                }
            }
        }
    } catch (e) {
        console.warn(e);
    }
};

function formatTimeAgo(dateStr) {
    if (!dateStr) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// Automatically check and register device push on app startup if permitted
if (typeof window !== 'undefined') {
    setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
            registerCustomerPushSubscription().catch(() => {});
        }
    }, 3000);
}

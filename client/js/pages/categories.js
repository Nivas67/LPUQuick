// Categories Page — Blinkit / Instamart Style Vertical Rail & Catalog Explorer
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

const RAIL_CATEGORIES = [
    {
        id: 'biscuits',
        name: 'Cookies',
        headerTitle: 'Bakery & Biscuits',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('biscuit') || sub.includes('cake') || sub.includes('choco pie') || 
                   name.includes('biscuit') || name.includes('cookie') || name.includes('oreo') || 
                   name.includes('bourbon') || name.includes('treat') || name.includes('good day') || 
                   name.includes('hide & seek') || name.includes('parle') || name.includes('unibic') ||
                   name.includes('marie') || name.includes('rusk') || name.includes('creme');
        }
    },
    {
        id: 'chips',
        name: 'Chips & Crisps',
        headerTitle: 'Chips & Crisps',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('chips') || name.includes('chip') || name.includes('lays') || 
                   name.includes("lay's") || name.includes('doritos') || name.includes('crax') || 
                   name.includes('bingo') || name.includes('kurkure') || name.includes('nachos') || 
                   name.includes('tedhe medhe') || name.includes('crisp');
        }
    },
    {
        id: 'chocolates',
        name: 'Chocolates',
        headerTitle: 'Chocolates & Candies',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('chocolate') || name.includes('chocolate') || name.includes('cadbury') || 
                   name.includes('silk') || name.includes('kitkat') || name.includes('perk') || 
                   name.includes('munch') || name.includes('dark fantasy') || name.includes('snickers') ||
                   name.includes('dairymilk') || name.includes('dairy milk');
        }
    },
    {
        id: 'noodles',
        name: 'Instant Food',
        headerTitle: 'Instant Food & Noodles',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('noodle') || name.includes('noodle') || name.includes('maggi') || 
                   name.includes('cup') || name.includes('pasta') || name.includes('yippee') || 
                   name.includes('manchow') || name.includes('soup') || name.includes('chowmein');
        }
    },
    {
        id: 'namkeen',
        name: 'Namkeen',
        headerTitle: 'Namkeen & Bhujia',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('namkeen') || name.includes('namkeen') || name.includes('bhujia') || 
                   name.includes('bhelpuri') || name.includes('sev') || name.includes('haldiram') || 
                   name.includes('bikaji') || name.includes('peanut') || name.includes('mixture') ||
                   name.includes('all in one') || name.includes('snac lite');
        }
    },
    {
        id: 'snacks',
        name: 'Munchies',
        headerTitle: 'Snacks & Munchies',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('snack') || sub.includes('popcorn') || name.includes('popcorn') || 
                   name.includes('act ii') || name.includes('snac') || name.includes('munchies');
        }
    },
    {
        id: 'sweets',
        name: 'Sweets',
        headerTitle: 'Indian Sweets',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120',
        match: (p) => {
            const name = (p.name || '').toLowerCase();
            const sub = (p.subcategory || '').toLowerCase();
            return sub.includes('sweet') || name.includes('sweet') || name.includes('gulab jamun') || 
                   name.includes('rasgulla') || name.includes('soan papdi') || name.includes('barfi') || 
                   name.includes('ladoo') || name.includes('haldiram');
        }
    },
    {
        id: 'all',
        name: 'All Snacks',
        headerTitle: 'All Snacks & Munchies',
        status: 'live',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120',
        match: () => true
    },
    // Upper Categories placed in Left Rail & blocked as Coming Soon
    {
        id: 'drinks',
        name: 'Drinks & Juices',
        headerTitle: 'Drinks & Juices',
        status: 'blocked',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120',
        desc: 'Packaged fruit juices, chilled sodas, iced teas, and cold brews are launching next!'
    },
    {
        id: 'spreads',
        name: 'Spreads',
        headerTitle: 'Spreads & Sauces',
        status: 'blocked',
        image: 'https://images.unsplash.com/photo-1585238341710-4d3ff484184d?w=120',
        desc: 'Peanut butter, chocolate hazelnut spreads, cheese spreads, and sauces are coming soon!'
    },
    {
        id: 'beauty',
        name: 'Beauty & Care',
        headerTitle: 'Beauty & Personal Care',
        status: 'blocked',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120',
        desc: 'Daily hostel grooming essentials, soaps, facewash, and personal care products are onboarding soon!'
    }
];

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    return `
<div class="bg-background text-on-background min-h-screen flex flex-col selection:bg-emerald/20 selection:text-primary relative overflow-hidden" style="height: 100dvh; max-height: 100dvh;">
    <!-- Top Header Bar (Full-Width Clean Instamart/Blinkit app style) -->
    <header class="categories-app-bar w-full flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-6 py-2.5 shrink-0 z-30 select-none border-b border-[var(--glass-border)] bg-white/80 dark:bg-slate-950/85 backdrop-blur-2xl">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95 shrink-0" aria-label="Back to Home" title="Back to Home">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
            </a>
            <div class="min-w-0">
                <h1 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight" id="cat-header-title">
                    Bakery & Biscuits
                </h1>
                <button type="button" class="address-selector-trigger flex items-center text-[10px] text-slate-500 dark:text-slate-400 hover:text-emerald transition-colors text-left truncate cursor-pointer">
                    <span>Delivering to Home: <strong class="text-slate-800 dark:text-slate-200 font-bold">${address}</strong></span>
                    <span class="material-symbols-outlined text-[13px] text-emerald ml-0.5">expand_more</span>
                </button>
            </div>
        </div>

        <!-- Search Bar (Desktop / Tablet) -->
        <div class="relative flex-1 max-w-md hidden md:block mx-2">
            <input class="w-full pl-9 pr-4 py-1.5 rounded-full border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium" 
                   placeholder="Search biscuits, chips, chocolates, maggi..." 
                   type="text" 
                   id="desktop-cat-search" 
                   autocomplete="off">
            <span class="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
        </div>

        <!-- Right Controls: Install, Theme Toggle & Cart -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <!-- Install Shortcut -->
            <button type="button" 
                    onclick="window.showInstallPrompt()" 
                    class="btn-install-app clay-pill px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 shadow-xs" 
                    title="Install LPUQuick App">
                <span class="material-symbols-outlined text-sm">download</span>
                <span class="text-[11px] font-black">Install</span>
            </button>
            <!-- Theme Toggle Switch -->
            <button type="button" 
                    class="theme-toggle-switch relative inline-flex items-center w-[46px] h-[24px] rounded-full p-[2px] transition-all cursor-pointer select-none clay-pill shrink-0 shadow-xs" 
                    role="switch" 
                    aria-checked="false" 
                    title="Toggle Light / Dark Mode"
                    onclick="window.toggleTheme()">
                <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform pointer-events-none"></div>
                <div class="relative w-full flex items-center justify-between px-1 z-10 pointer-events-none">
                    <span class="theme-sun-icon material-symbols-outlined text-[10px] text-amber-500 font-bold">wb_sunny</span>
                    <span class="theme-moon-icon material-symbols-outlined text-[10px] text-slate-400 dark:text-sky-300 font-bold">dark_mode</span>
                </div>
            </button>

            <!-- Cart Shortcut -->
            <a href="#/cart" class="clay-pill w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-95 relative shrink-0" title="Cart">
                <span class="material-symbols-outlined text-base">shopping_cart</span>
                <span id="mobile-header-cart-count" class="global-cart-count-badge absolute -top-1 -right-1 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white dark:border-slate-900">0</span>
            </a>
        </div>
    </header>

    <!-- Main 2-Column Split Area (Category Rail on Left stretching to the bottom) -->
    <div class="flex flex-1 overflow-hidden w-full relative" style="height: calc(100dvh - 58px);">
        
        <!-- LEFT VERTICAL CATEGORY RAIL (Long until end, exactly like Blinkit/Instamart) -->
        <aside id="category-sidebar-rail" class="w-[78px] sm:w-[86px] md:w-[96px] shrink-0 h-full overflow-y-auto no-scrollbar flex flex-col py-1.5 border-r border-[var(--glass-border)] bg-slate-50/80 dark:bg-slate-950/85 backdrop-blur-2xl z-20 select-none pb-36 sm:pb-16">
            <!-- Categories injected in pageInit -->
        </aside>

        <!-- RIGHT MAIN PRODUCT & PROMO AREA -->
        <main id="category-main-pane" class="flex-1 h-full overflow-y-auto no-scrollbar flex flex-col p-2.5 sm:p-4 pb-36 sm:pb-16 space-y-3">
            
            <!-- Mobile Search Bar (Quick In-Category Search) -->
            <div class="relative md:hidden w-full">
                <input class="w-full pl-9 pr-8 py-2 rounded-2xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs text-slate-800 dark:text-slate-200 shadow-xs font-medium" 
                       placeholder="Search snacks, biscuits, chips, chocolates..." 
                       type="text" 
                       id="mobile-cat-search" 
                       autocomplete="off">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-sm">search</span>
                <button type="button" id="mobile-cat-search-clear" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 hidden text-xs">✕</button>
            </div>

            <!-- LIVE CATEGORY CONTAINER -->
            <div id="live-cat-container" class="space-y-3">
                <!-- Top Filter & Sort Chips Bar -->
                <div class="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5" id="cat-filters-bar">
                    <!-- Filters Chip -->
                    <button type="button" id="cat-filter-chip-btn" class="filter-chip-btn clay-pill px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 cursor-pointer">
                        <span class="material-symbols-outlined text-xs text-slate-500 dark:text-slate-400">tune</span>
                        <span>Filters</span>
                        <span class="text-[10px] text-slate-400">▾</span>
                    </button>

                    <!-- Sort Chip -->
                    <div class="relative shrink-0">
                        <select id="cat-sort-select" class="filter-chip-btn clay-pill pl-2.5 pr-6 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer appearance-none">
                            <option value="popular">⇅ Sort: Popular</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                        </select>
                        <span class="material-symbols-outlined text-[12px] text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                    </div>

                    <!-- Diet Preference / Veg Only Toggle -->
                    <button type="button" id="cat-veg-toggle" class="filter-chip-btn clay-pill px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform">
                        <span class="w-3 h-3 border border-emerald-600 rounded-xs flex items-center justify-center p-[1px]">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </span>
                        <span>Veg Only</span>
                    </button>

                    <!-- Items Count Badge -->
                    <span class="liquid-badge text-[10px] font-bold px-2.5 py-1 shrink-0 ml-auto" id="cat-item-count">
                        Loading...
                    </span>
                </div>

                <!-- Promo Banner (Cadbury Brownie Style from Reference Screenshot) -->
                <div id="cat-promo-banner" class="category-promo-banner relative w-full rounded-2xl overflow-hidden p-3.5 sm:p-4 text-white shadow-lg flex items-center justify-between gap-3 border border-white/10" style="background: linear-gradient(135deg, #3b0764 0%, #581c87 55%, #1e1b4b 100%);">
                    <div class="relative z-10 max-w-[65%] space-y-1">
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-200 bg-purple-900/60 px-2 py-0.5 rounded-md border border-purple-400/30">Cadbury Special</span>
                        </div>
                        <h3 class="text-sm sm:text-base font-black text-white leading-tight tracking-tight">Cadbury Brownie</h3>
                        <p class="text-[11px] sm:text-xs text-purple-200 font-medium line-clamp-1">Gooey, Fudgy, Chocolatey.</p>
                        <div class="pt-1">
                            <button type="button" id="promo-shop-now-btn" class="bg-white hover:bg-purple-50 text-purple-950 font-black text-[11px] px-3.5 py-1 rounded-full shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1">
                                <span>Shop now</span>
                                <span class="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                    <div class="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"></div>
                        <img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=160" alt="Cadbury Brownie" class="relative z-10 w-full h-full object-contain rounded-xl drop-shadow-md">
                    </div>
                </div>

                <!-- 2-Column Product Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5" id="cat-products-grid">
                    <div class="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <div class="w-7 h-7 rounded-full border-2 border-emerald border-t-transparent animate-spin"></div>
                        <p class="font-bold text-slate-600 dark:text-slate-400">Loading catalog items...</p>
                    </div>
                </div>
            </div>

            <!-- BLOCKED / COMING SOON VIEW (When Drinks & Juices, Spreads, Beauty are selected) -->
            <div id="blocked-cat-container" class="hidden py-12 px-4 text-center max-w-md mx-auto space-y-4 glass-card rounded-3xl p-6 shadow-xl my-auto">
                <div class="clay-card w-16 h-16 rounded-2xl text-amber-500 flex items-center justify-center mx-auto shadow-md">
                    <span class="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <div class="space-y-1.5">
                    <span class="clay-pill px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30">
                        Coming Soon to LPU
                    </span>
                    <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight" id="blocked-cat-title">Coming Soon</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium" id="blocked-cat-desc">
                        We are currently onboarding top campus vendors for this category. In the meantime, order from our full range of Snacks, Biscuits & Chocolates with 3-minute delivery to your hostel!
                    </p>
                </div>
                <div class="pt-2">
                    <button type="button" id="switch-to-live-btn" class="clay-btn clay-btn-primary inline-flex items-center gap-2 text-white text-xs font-black px-5 py-2.5 rounded-2xl active:scale-95 transition-transform shadow-md cursor-pointer">
                        <span class="material-symbols-outlined text-sm">fastfood</span>
                        <span>Browse Live Snacks & Biscuits</span>
                    </button>
                </div>
            </div>

        </main>
    </div>

    <!-- Bottom Toast Alert for Blocked Categories -->
    <div id="coming-soon-toast" class="fixed top-16 left-1/2 -translate-x-1/2 glass-panel text-slate-900 dark:text-white px-5 py-2.5 rounded-2xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none -translate-y-2 border border-[var(--glass-border)]">
        <span class="material-symbols-outlined text-amber-400 text-base">info</span>
        <span id="coming-soon-toast-text">Category opening soon! Delivering Snacks & Biscuits right now.</span>
    </div>

    <!-- Floating Liquid Glass Bottom Navigation Dock -->
    <div class="fixed bottom-3 inset-x-0 z-40 px-4 sm:hidden pointer-events-none flex justify-center">
        <nav class="pointer-events-auto liquid-dock-pill h-14 max-w-md w-full px-3 flex justify-around items-center rounded-full shadow-2xl">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-semibold mt-0.5">Home</span>
            </a>
            <a class="clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="text-[10px] mt-0.5 font-bold">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-semibold mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-semibold mt-0.5">Orders</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/settings" title="Profile">
                <span class="material-symbols-outlined text-xl">account_circle</span>
                <span class="text-[10px] font-semibold mt-0.5">Profile</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.categories = async function() {
    const railContainer = document.getElementById('category-sidebar-rail');
    const headerTitle = document.getElementById('cat-header-title');
    const liveContainer = document.getElementById('live-cat-container');
    const blockedContainer = document.getElementById('blocked-cat-container');
    const blockedTitle = document.getElementById('blocked-cat-title');
    const blockedDesc = document.getElementById('blocked-cat-desc');
    const switchToLiveBtn = document.getElementById('switch-to-live-btn');
    const productsGrid = document.getElementById('cat-products-grid');
    const itemCountBadge = document.getElementById('cat-item-count');
    const vegToggleBtn = document.getElementById('cat-veg-toggle');
    const sortSelect = document.getElementById('cat-sort-select');
    const desktopSearch = document.getElementById('desktop-cat-search');
    const mobileSearch = document.getElementById('mobile-cat-search');
    const mobileSearchClear = document.getElementById('mobile-cat-search-clear');
    const promoBanner = document.getElementById('cat-promo-banner');
    const promoShopNowBtn = document.getElementById('promo-shop-now-btn');
    const toastEl = document.getElementById('coming-soon-toast');
    const toastText = document.getElementById('coming-soon-toast-text');

    let activeCatId = 'biscuits'; // Default matches reference screenshot
    let isVegOnly = false;
    let currentSort = 'popular';
    let allProducts = [];
    let wishlistItems = new Set(JSON.parse(localStorage.getItem('lpuquick_wishlist') || '[]'));

    function showComingSoonToast(msg) {
        if (!toastEl || !toastText) return;
        toastText.textContent = msg;
        toastEl.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
        toastEl.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            toastEl.classList.remove('opacity-100', 'translate-y-0');
            toastEl.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        }, 2500);
    }

    // Render Category Sidebar Rail
    function renderRail() {
        if (!railContainer) return;
        railContainer.innerHTML = RAIL_CATEGORIES.map(cat => {
            const isActive = cat.id === activeCatId;
            const isBlocked = cat.status === 'blocked';
            return `
            <button type="button" 
                    class="category-rail-item category-sidebar-item relative w-full flex flex-col items-center py-2 sm:py-2.5 px-1 text-center transition-all ${isBlocked ? 'coming-soon' : ''} ${isActive ? 'active' : ''}" 
                    data-cat-id="${cat.id}" 
                    data-category-id="${cat.id}"
                    data-status="${cat.status}"
                    data-name="${cat.headerTitle || cat.name}">
                <!-- Instamart / Blinkit Green Indicator Pill on Right Edge -->
                <span class="category-rail-indicator"></span>

                <!-- Squircle Packshot Thumbnail Box -->
                <div class="category-rail-icon-box w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center p-1 relative overflow-hidden transition-transform shadow-xs">
                    <img src="${cat.image}" alt="${cat.name}" class="category-rail-img w-full h-full object-cover rounded-xl" loading="eager" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120'">
                </div>

                <!-- Category Label -->
                <span class="category-rail-label text-[10px] leading-tight font-bold mt-1 px-0.5 line-clamp-2">
                    ${cat.name}
                </span>

                ${isBlocked ? `
                <span class="coming-soon-badge text-[7px] font-extrabold uppercase mt-0.5">Soon</span>
                ` : ''}
            </button>`;
        }).join('');

        // Attach Click Listeners to Rail Items
        railContainer.querySelectorAll('.category-rail-item').forEach(btn => {
            btn.onclick = () => {
                const catId = btn.dataset.catId;
                const status = btn.dataset.status;
                const catConfig = RAIL_CATEGORIES.find(c => c.id === catId);
                if (!catConfig) return;

                activeCatId = catId;
                renderRail();

                if (headerTitle) {
                    headerTitle.textContent = catConfig.headerTitle || catConfig.name;
                }

                if (status === 'blocked') {
                    if (liveContainer) liveContainer.classList.add('hidden');
                    if (blockedContainer) blockedContainer.classList.remove('hidden');
                    if (blockedTitle) blockedTitle.textContent = `${catConfig.name} — Coming Soon`;
                    if (blockedDesc) blockedDesc.textContent = catConfig.desc || `${catConfig.name} is currently onboarding top campus vendors. Order our live snacks & biscuits now!`;
                    showComingSoonToast(`${catConfig.name} is opening soon! Delivering Snacks & Biscuits right now.`);
                } else {
                    if (blockedContainer) blockedContainer.classList.add('hidden');
                    if (liveContainer) liveContainer.classList.remove('hidden');
                    filterAndRenderProducts();
                }
            };
        });
    }

    // Filter & Render Products in the 2-Column Grid
    function filterAndRenderProducts() {
        if (!productsGrid) return;

        const currentCat = RAIL_CATEGORIES.find(c => c.id === activeCatId) || RAIL_CATEGORIES[0];
        let filtered = allProducts.filter(p => currentCat.match(p));

        if (isVegOnly) {
            filtered = filtered.filter(p => p.is_veg !== 0);
        }

        const q = (desktopSearch?.value || mobileSearch?.value || '').trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(p => 
                (p.name || '').toLowerCase().includes(q) || 
                (p.tags || '').toLowerCase().includes(q)
            );
        }

        if (currentSort === 'price_asc') {
            filtered.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (currentSort === 'price_desc') {
            filtered.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (currentSort === 'name') {
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        if (itemCountBadge) {
            itemCountBadge.textContent = `${filtered.length} Items`;
        }

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2 glass-card rounded-3xl p-6">
                    <span class="material-symbols-outlined text-4xl text-slate-400">search_off</span>
                    <p class="font-bold text-slate-700 dark:text-slate-300">No items match your selection.</p>
                    <p class="text-[11px] text-slate-400">Try turning off Veg Only or picking another category.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = filtered.map(p => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
            const isOutOfStock = !p.in_stock || stockLeft <= 0;
            const isLowStock = stockLeft > 0 && stockLeft <= 4;
            const isWishlisted = wishlistItems.has(String(p.id));

            return `
            <div class="product-card-item product-detail-trigger rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer group bg-white/75 dark:bg-slate-900/70 border border-[var(--glass-border)] shadow-xs transition-all hover:shadow-md ${isOutOfStock ? 'opacity-75' : ''}" data-product-id="${p.id}" data-id="${p.id}" data-category="${activeCatId}" data-out-of-stock="${isOutOfStock}">
                <div>
                    <!-- Image Pedestal Container -->
                    <div class="card-pedestal h-32 sm:h-36 rounded-xl relative overflow-hidden flex items-center justify-center p-2 mb-2 bg-slate-100/60 dark:bg-slate-800/50 border border-[var(--glass-border)]">
                        <!-- Top Badges Row -->
                        <div class="absolute top-2 left-2 z-10 flex flex-col gap-1">
                            ${discountPercent > 0 ? `
                            <span class="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                                ${discountPercent}% OFF
                            </span>
                            ` : ''}
                            ${isLowStock ? `
                            <span class="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                                Only ${stockLeft} left
                            </span>
                            ` : (isOutOfStock ? `
                            <span class="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                                Out of Stock
                            </span>
                            ` : '')}
                        </div>

                        <!-- Wishlist Heart Button -->
                        <button type="button" class="wishlist-btn absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-xs cursor-pointer ${isWishlisted ? 'text-rose-500' : ''}" data-wishlist-id="${p.id}" title="Save to wishlist">
                            <span class="material-symbols-outlined text-xs" style="${isWishlisted ? "font-variation-settings: 'FILL' 1;" : ''}">favorite</span>
                        </button>

                        <!-- Veg Indicator at Bottom-Right of Image -->
                        <div class="absolute bottom-2 right-2 z-10 bg-white/95 dark:bg-slate-900/90 p-0.5 rounded-md shadow-xs border border-slate-200 dark:border-slate-700">
                            <span class="w-3 h-3 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-rose-600'} rounded-xs flex items-center justify-center p-[1px] block">
                                <span class="w-1.5 h-1.5 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-rose-600'} block"></span>
                            </span>
                        </div>

                        <!-- Product Packshot Image -->
                        <img class="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300" 
                             src="${p.image_url}" 
                             alt="${p.name}" 
                             loading="lazy" 
                             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
                    </div>

                    <!-- Pack Size Tag -->
                    <span class="clay-pill text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md inline-block mb-1">
                        ${p.size || p.unit || 'piece'}
                    </span>

                    <!-- Product Title -->
                    <h3 class="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug min-h-[32px] group-hover:text-emerald transition-colors">
                        ${p.name}
                    </h3>

                    <!-- Rating & Delivery ETA Row -->
                    <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        <span class="flex items-center gap-0.5 font-bold text-amber-500">
                            <span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span>4.8</span>
                            <span class="text-slate-400 font-medium">(40k+)</span>
                        </span>
                        <span class="flex items-center gap-0.5 text-emerald font-bold">
                            <span class="material-symbols-outlined text-[11px]">schedule</span>
                            <span>8m</span>
                        </span>
                    </div>
                </div>

                <!-- Price & ADD Stepper Action Row -->
                <div class="mt-2.5 pt-2 border-t border-[var(--glass-border)] flex items-center justify-between gap-1.5">
                    <div class="flex flex-col min-w-0">
                        <div class="flex items-baseline gap-1">
                            <span class="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">₹${p.price}</span>
                            ${p.mrp && p.mrp > p.price ? `<span class="text-[9px] text-slate-400 font-medium line-through">₹${p.mrp}</span>` : ''}
                        </div>
                        ${discountPercent > 0 ? `
                        <span class="text-[8px] sm:text-[9px] text-sky-500 dark:text-sky-400 font-bold block truncate leading-tight">
                            ${discountPercent}% OFF on MRP
                        </span>
                        ` : ''}
                    </div>

                    <div class="product-action-slot shrink-0" data-id="${p.id}" data-out-of-stock="${isOutOfStock}" data-stock-left="${stockLeft}">
                        ${isOutOfStock ? `
                        <span class="clay-pill text-[9px] font-bold text-slate-400 px-2.5 py-1 cursor-not-allowed select-none">
                            Out
                        </span>
                        ` : `
                        <button type="button" class="add-to-cart-btn uppercase" data-id="${p.id}" data-stock-left="${stockLeft}">ADD</button>
                        `}
                    </div>
                </div>
            </div>`;
        }).join('');

        // Wishlist Buttons Click Handler
        productsGrid.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const pid = btn.dataset.wishlistId;
                if (wishlistItems.has(pid)) {
                    wishlistItems.delete(pid);
                    btn.classList.remove('text-rose-500');
                    btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = '';
                } else {
                    wishlistItems.add(pid);
                    btn.classList.add('text-rose-500');
                    btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
                }
                localStorage.setItem('lpuquick_wishlist', JSON.stringify(Array.from(wishlistItems)));
            };
        });

        // Sync Add/Stepper Buttons with Global Cart State
        if (typeof window.syncCardSteppers === 'function') {
            window.syncCardSteppers();
        }
    }

    // Load Products from API
    async function loadProductsData() {
        try {
            const res = await window.api.fetchProducts();
            allProducts = res?.products || [];
            renderRail();
            filterAndRenderProducts();
        } catch(e) {
            console.error('[Categories Page] Failed to fetch products:', e);
            if (productsGrid) {
                productsGrid.innerHTML = `
                    <div class="col-span-full py-16 text-center text-slate-500 text-xs">
                        <p class="font-bold text-rose-500">Failed to load catalog.</p>
                        <button type="button" onclick="location.reload()" class="mt-2 text-emerald font-bold underline">Retry</button>
                    </div>
                `;
            }
        }
    }

    // Veg Toggle
    vegToggleBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegToggleBtn.classList.add('clay-btn-primary', 'text-white');
            vegToggleBtn.classList.remove('text-slate-700', 'dark:text-slate-200');
        } else {
            vegToggleBtn.classList.remove('clay-btn-primary', 'text-white');
            vegToggleBtn.classList.add('text-slate-700', 'dark:text-slate-200');
        }
        filterAndRenderProducts();
    });

    // Sort Dropdown
    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
    });

    // Search Handlers
    const handleSearch = () => {
        const val = (desktopSearch?.value || mobileSearch?.value || '').trim();
        if (mobileSearchClear) {
            if (val) mobileSearchClear.classList.remove('hidden');
            else mobileSearchClear.classList.add('hidden');
        }
        filterAndRenderProducts();
    };

    desktopSearch?.addEventListener('input', handleSearch);
    mobileSearch?.addEventListener('input', handleSearch);
    mobileSearchClear?.addEventListener('click', () => {
        if (mobileSearch) mobileSearch.value = '';
        if (desktopSearch) desktopSearch.value = '';
        mobileSearchClear.classList.add('hidden');
        filterAndRenderProducts();
    });

    // Promo "Shop now" button
    promoShopNowBtn?.addEventListener('click', () => {
        const targetCat = document.querySelector('.category-rail-item[data-cat-id="chocolates"]') || 
                          document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
        if (targetCat) targetCat.click();
    });

    // Switch to Live from Blocked screen
    switchToLiveBtn?.addEventListener('click', () => {
        const biscuitBtn = document.querySelector('.category-rail-item[data-cat-id="biscuits"]') ||
                           document.querySelector('.category-rail-item[data-cat-id="all"]');
        if (biscuitBtn) biscuitBtn.click();
    });

    // Address selector modal trigger
    document.querySelectorAll('.address-selector-trigger').forEach(trigger => {
        trigger.onclick = () => {
            if (typeof window.openAddressModal === 'function') {
                window.openAddressModal();
            }
        };
    });

    // Initialize
    await loadProductsData();

    // Sync PWA Install State
    if (typeof window.updateInstallUIState === 'function') {
        window.updateInstallUIState();
    }
};

// Home Page — Next-Gen Campus Storefront with Instamart/Blinkit-Style Category Navigation & Dynamic Island
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

const STORE_CATEGORIES = [
    { id: 'all', name: 'All', emoji: '🛒' },
    { id: 'biscuits', name: 'Biscuits', emoji: '🍪' },
    { id: 'chips', name: 'Chips', emoji: '🥔' },
    { id: 'chocolates', name: 'Chocolates', emoji: '🍫' },
    { id: 'candies', name: 'Candies', emoji: '🍬' },
    { id: 'drinks', name: 'Drinks', emoji: '🥤' },
    { id: 'instant', name: 'Instant Food', emoji: '🍜' },
    { id: 'snacks', name: 'Snacks', emoji: '🍿' },
    { id: 'juices', name: 'Juices', emoji: '🧃' },
    { id: 'sweets', name: 'Sweets', emoji: '🍭' },
    { id: 'others', name: 'Others', emoji: '📦' }
];

function classifyProductCategory(p) {
    const subcat = (p.subcategory || '').trim().toLowerCase();
    const cat = (p.category || '').trim().toLowerCase();
    const text = (p.name || '').toLowerCase();

    // 1. Ground Truth Priority: Check existing database subcategory first
    if (subcat === 'biscuits' || subcat === 'biscuit') return 'biscuits';
    if (subcat === 'chips' || subcat === 'wafers') return 'chips';
    if (subcat === 'chocolates' || subcat === 'chocolate' || subcat === 'choco pie') return 'chocolates';
    if (subcat === 'noodles' || subcat === 'instant food' || subcat === 'instant') return 'instant';
    if (subcat === 'snacks' || subcat === 'namkeen' || subcat === 'popcorn') return 'snacks';
    if (subcat === 'cake' || subcat === 'sweets' || subcat === 'dessert') return 'sweets';
    if (subcat === 'candies' || subcat === 'candy') return 'candies';
    if (subcat === 'drinks' || subcat === 'beverages' || subcat === 'cold drinks') return 'drinks';
    if (subcat === 'juices' || subcat === 'juice') return 'juices';

    // 2. Existing Database category field fallback
    if (cat === 'biscuits') return 'biscuits';
    if (cat === 'chips') return 'chips';
    if (cat === 'chocolates') return 'chocolates';
    if (cat === 'instant' || cat === 'instant food') return 'instant';
    if (cat === 'drinks' || cat === 'beverages') return 'drinks';
    if (cat === 'juices') return 'juices';
    if (cat === 'sweets') return 'sweets';
    if (cat === 'candies') return 'candies';

    // 3. Fallback classification for legacy items without DB subcategory
    if (/noodle|pasta|maggi|cup noodles|soup|macroni|penne/i.test(text)) return 'instant';
    if (/cadbury|dairy milk|silk|snickers/i.test(text)) return 'chocolates';
    if (/biscuit|cookie|cookies|wafer|bourbon|bikis|mom's magic|jimjam|hide & seek|hide and seek|milk shakti|treat rich creme|oreo|milano|fab bourbon|dark fantasy/i.test(text)) return 'biscuits';
    if (/chips|tedhe medhe|mad angles|doritos|lay's|lays|uncle chips/i.test(text)) return 'chips';
    if (/popcorn|snac lite|bhelpuri|munchy|kurkure/i.test(text)) return 'snacks';
    if (/cake|gobbles|sweet|dessert|mithai/i.test(text)) return 'sweets';
    if (/candy|candies|toffee|lollipop|eclairs|mint|chew|pulse|mentos|alpenliebe/i.test(text)) return 'candies';
    if (/\b(drink|drinks|coke|pepsi|sprite|thums up|fanta|sting|red bull|monster|water|soda|redbull|beverage|cola|dew)\b/i.test(text)) return 'drinks';
    if (/\b(juice|juices|frooti|maaza|real|tropicana|appy|fizz)\b/i.test(text)) return 'juices';

    return 'others';
}

function buildProductCardsHTML(items, isAboveFold = false) {
    if (!items || items.length === 0) return '';
    return items.map((p, idx) => {
        const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        const isLcpCandidate = isAboveFold && idx === 0;
        const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
        const isLowStock = stockLeft > 0 && stockLeft <= 4;
        const isOutOfStock = !p.in_stock || stockLeft === 0;
        const catTag = classifyProductCategory(p);

        return `
        <div class="product-card-item product-detail-trigger p-2.5 sm:p-3.5 flex flex-col justify-between cursor-pointer group ${isOutOfStock ? 'opacity-75' : ''}" data-product-id="${p.id}" data-category="${catTag}" data-out-of-stock="${isOutOfStock}">
            <div>
                <!-- 3D Recessed Pedestal with Category Ambient Glow -->
                <div class="card-pedestal h-36 sm:h-40 rounded-2xl relative overflow-hidden flex items-center justify-center p-3 mb-3 border border-[var(--glass-border)]">
                    <!-- Veg indicator -->
                    <div class="absolute top-2.5 left-2.5 z-10 bg-white/95 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm border border-[var(--glass-border)]">
                        <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-rose-600'} rounded-xs flex items-center justify-center p-[1px]">
                            <span class="w-1.5 h-1.5 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
                        </span>
                    </div>

                    <!-- Floating Specular Discount Badge -->
                    ${discountPercent > 0 ? `
                    <div class="liquid-badge absolute top-2.5 right-2.5 z-10 text-[10px] font-black px-2.5 py-0.5 shadow-sm">
                        ${discountPercent}% OFF
                    </div>
                    ` : ''}

                    <!-- Stock Status Badge -->
                    ${isLowStock ? `
                    <div class="absolute bottom-2.5 left-2.5 z-10 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Only ${stockLeft} left
                    </div>
                    ` : (isOutOfStock ? `
                    <div class="absolute bottom-2.5 left-2.5 z-10 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Out of Stock
                    </div>
                    ` : '')}

                    <img class="object-contain w-full h-full group-hover:scale-110 transition-transform duration-300" 
                         src="${p.image_url}" 
                         alt="${p.name}" 
                         width="150" 
                         height="150" 
                         ${isLcpCandidate ? 'fetchpriority="high"' : 'loading="lazy"'} 
                         decoding="async" 
                         onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&q=75'">
                </div>

                <!-- Pack Size Pill -->
                <span class="clay-pill text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 inline-block mb-1.5">
                    ${p.size || p.unit || '1 unit'}
                </span>

                <!-- Title -->
                <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug min-h-[34px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    ${p.name}
                </h3>
            </div>

            <!-- Bottom Price & Tactile Action Slot -->
            <div class="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between gap-1.5 sm:gap-2">
                <div class="flex flex-col min-w-0">
                    <span class="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">₹${p.price}</span>
                    ${p.mrp && p.mrp > p.price ? `<span class="text-[9px] sm:text-[10px] text-slate-400 font-medium line-through">₹${p.mrp}</span>` : ''}
                </div>

                <div class="product-action-slot" data-id="${p.id}" data-out-of-stock="${isOutOfStock}" data-stock-left="${stockLeft}">
                    ${isOutOfStock ? `
                    <span class="clay-pill text-[9px] sm:text-[10px] font-bold text-slate-400 px-2 sm:px-3 py-1 cursor-not-allowed select-none">
                        Out
                    </span>
                    ` : `
                    <button type="button" class="add-to-cart-btn uppercase" data-id="${p.id}" data-stock-left="${stockLeft}">ADD</button>
                    `}
                </div>
            </div>
        </div>`;
    }).join('');
}

window.pages.home = async function() {
    const effectiveUserId = (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : window.CURRENT_USER_ID) || null;
    let data = null;
    let productsRes = null;
    try {
        [data, productsRes] = await Promise.all([
            window.api.fetchHome(effectiveUserId),
            window.api.fetchProducts()
        ]);
    } catch(e) {
        console.warn('Home data load warning:', e);
    }

    const allProductsFromApi = (productsRes?.products && productsRes.products.length > 0) ? productsRes.products : (data?.all_products || data?.products || []);

    const inStockProducts = allProductsFromApi.filter(p => {
        return p.in_stock !== false && (p.stock_left === undefined || p.stock_left === null || p.stock_left > 0);
    });

    const buyAgain = (data?.buy_again || []).filter(p => p.in_stock !== false && (p.stock_left === undefined || p.stock_left > 0));
    const isPersonalizedBuyAgain = Boolean(data?.is_personalized_buy_again);
    
    // Compute category product counts
    const categoryCounts = {};
    STORE_CATEGORIES.forEach(c => { categoryCounts[c.id] = 0; });
    inStockProducts.forEach(p => {
        const cat = classifyProductCategory(p);
        if (categoryCounts[cat] !== undefined) {
            categoryCounts[cat]++;
        } else {
            categoryCounts['others']++;
        }
    });
    categoryCounts['all'] = inStockProducts.length;

    // In-Stock Category collections for secondary shelves when 'all' is selected
    const biscuits = inStockProducts.filter(p => classifyProductCategory(p) === 'biscuits');
    const chips = inStockProducts.filter(p => classifyProductCategory(p) === 'chips');
    const chocolates = inStockProducts.filter(p => classifyProductCategory(p) === 'chocolates');
    const instantFood = inStockProducts.filter(p => classifyProductCategory(p) === 'instant');
    const snacks = inStockProducts.filter(p => classifyProductCategory(p) === 'snacks');
    
    const address = window.currentAddress || 'BH13';

    const inStockProductCards = buildProductCardsHTML(inStockProducts, true);
    const biscuitCards = buildProductCardsHTML(biscuits);
    const chipCards = buildProductCardsHTML(chips);
    const chocolateCards = buildProductCardsHTML(chocolates);
    const instantFoodCards = buildProductCardsHTML(instantFood);
    const snackCards = buildProductCardsHTML(snacks);

    const buyAgainCards = buyAgain.map(p => {
        const isOutOfStock = !p.in_stock || (p.stock_left !== undefined && p.stock_left <= 0);
        return `
        <div class="flex-none w-40 sm:w-48 snap-start product-card-item p-3.5 product-detail-trigger cursor-pointer flex flex-col justify-between" data-product-id="${p.id}">
            <div>
                <div class="card-pedestal h-28 sm:h-32 rounded-xl mb-2.5 relative overflow-hidden flex items-center justify-center p-2.5">
                    ${isOutOfStock ? `
                    <div class="absolute top-2 left-2 z-10 bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        Out
                    </div>
                    ` : ''}
                    <img class="object-contain w-full h-full" 
                         src="${p.image_url}" 
                         alt="${p.name}" 
                         width="110" 
                         height="110" 
                         loading="lazy" 
                         decoding="async" 
                         onerror="this.src='https://images.unsplash.com/photo-1568651316335-714a806283db?w=300&auto=format&q=75'">
                </div>
                <p class="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">${p.name}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${p.size || p.unit || '1 unit'}</p>
            </div>
            <div class="flex justify-between items-center mt-2.5 pt-2 border-t border-[var(--glass-border)]">
                <p class="text-xs font-black text-slate-900 dark:text-white">₹${p.price}</p>
                <div class="product-action-slot" data-id="${p.id}">
                    ${isOutOfStock ? `
                    <span class="clay-pill text-[9px] font-bold text-slate-400 px-2.5 py-0.5 rounded-full">
                        Out
                    </span>
                    ` : `
                    <button type="button" class="add-to-cart-btn uppercase text-[10px] px-3 py-1" data-id="${p.id}">ADD</button>
                    `}
                </div>
            </div>
        </div>
    `;}).join('');

    return `
<div class="min-h-screen pb-32">
    <!-- Floating Dynamic Island Header (Next-Gen Translucent Capsule) -->
    <header class="dynamic-island-nav flex items-center justify-between gap-3 sm:gap-4 select-none">
        <!-- Brand + Location Capsule -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
            <a href="#/" class="flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
                <div class="w-8 h-8 rounded-xl clay-btn-primary flex items-center justify-center shadow-sm">
                    <img src="/logo.png" alt="LPUQuick" class="w-5 h-5 object-contain">
                </div>
                <div class="hidden sm:flex flex-col">
                    <span class="brand-title text-base font-black tracking-tight leading-none text-emerald-700 dark:text-emerald-400">LPUQuick</span>
                    <span class="text-[9px] text-slate-400 font-bold tracking-widest uppercase">Campus Hub</span>
                </div>
            </a>

            <!-- Address Trigger Pill -->
            <button type="button" class="address-selector-trigger clay-pill px-3 py-1 text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform" id="btn-header-address">
                <span class="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                <span class="text-slate-800 dark:text-slate-200">Deliver to <strong>${address}</strong></span>
                <span class="liquid-badge text-[9px] font-black px-1.5 py-0.2">3m</span>
                <span class="material-symbols-outlined text-xs text-slate-400">expand_more</span>
            </button>
        </div>

        <!-- Search Capsule (Desktop) -->
        <div class="hidden md:flex flex-1 max-w-md relative mx-2">
            <input class="w-full pl-9 pr-12 py-1.5 rounded-full border border-[var(--glass-border)] bg-slate-100/60 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all" 
                   placeholder="Search snacks, drinks, maggi, chocolates..." 
                   type="text" 
                   id="desktop-search" 
                   autocomplete="off">
            <span class="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-sm">search</span>
            <span class="absolute right-3 top-1.5 text-[10px] font-bold text-slate-400 clay-pill px-1.5 py-0.2">/</span>
            <div id="desktop-search-dropdown" class="hidden absolute top-10 left-0 w-full glass-panel rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2"></div>
        </div>

        <!-- Quick Actions (Theme, Orders, Cart, Profile) -->
        <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <!-- Sleek Theme Toggle -->
            <button type="button" 
                    class="theme-toggle-switch relative inline-flex items-center w-[48px] h-[26px] rounded-full p-[2px] transition-all cursor-pointer select-none clay-pill shrink-0 shadow-xs" 
                    role="switch" 
                    aria-checked="false" 
                    title="Toggle Light / Dark Mode"
                    onclick="window.toggleTheme()">
                <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white dark:bg-slate-950 shadow-md transition-transform pointer-events-none"></div>
                <div class="relative w-full flex items-center justify-between px-1.5 z-10 pointer-events-none">
                    <span class="theme-sun-icon material-symbols-outlined text-[11px] text-amber-500">wb_sunny</span>
                    <span class="theme-moon-icon material-symbols-outlined text-[11px] text-slate-400 dark:text-slate-200">dark_mode</span>
                </div>
            </button>

            <!-- Orders Shortcut -->
            <a href="#/orders" class="clay-pill w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-95" title="My Orders">
                <span class="material-symbols-outlined text-base">receipt_long</span>
            </a>

            <!-- Cart Shortcut with Live Badge -->
            <a href="#/cart" class="clay-pill w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-95 relative" title="Cart">
                <span class="material-symbols-outlined text-base">shopping_cart</span>
                <span id="desktop-header-cart-count" class="global-cart-count-badge absolute -top-1 -right-1 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white dark:border-slate-900">0</span>
            </a>

            <!-- Profile Shortcut -->
            <a href="#/settings" class="clay-pill w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-95" title="Settings">
                <span class="material-symbols-outlined text-base">account_circle</span>
            </a>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="pt-4 sm:pt-5 px-2.5 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-5 sm:space-y-6">
        <!-- Store Closed / Reopening Hero Alert Slot -->
        <div id="store-closed-banner-slot" class="hidden"></div>

        <!-- Mobile Search Capsule (Visible on mobile only) -->
        <section class="md:hidden relative w-full pt-1">
            <div class="relative">
                <input class="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-md text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-xs font-medium" 
                       placeholder="Search snacks, drinks, maggi, chips..." 
                       type="text" 
                       id="mobile-search" 
                       autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">search</span>
            </div>
            <div id="mobile-search-dropdown" class="hidden absolute top-12 left-0 w-full glass-panel rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2"></div>
        </section>

        <!-- ============================================================
             NEXT-GEN PROMOTIONAL BANNER CAROUSEL (SWIPEABLE & AUTO-SLIDING)
             ============================================================ -->
        <section class="hero-carousel-container relative overflow-hidden w-full rounded-3xl" id="hero-banner-carousel" style="position: relative; overflow: hidden; width: 100%; border-radius: 1.5rem; user-select: none; box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06); touch-action: pan-y pinch-zoom;">
            <!-- Left & Right Arrow Navigation (Visible on laptop / desktop hover) -->
            <button type="button" class="hero-carousel-arrow hero-carousel-prev hidden sm:flex" id="carousel-prev-btn" aria-label="Previous Slide" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 9999px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.35); color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 25; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <button type="button" class="hero-carousel-arrow hero-carousel-next hidden sm:flex" id="carousel-next-btn" aria-label="Next Slide" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 40px; height: 40px; border-radius: 9999px; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.35); color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 25; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </button>

            <!-- Carousel Slides Track (Strict horizontal flex-row) -->
            <div class="hero-carousel-track flex flex-row flex-nowrap w-full" id="carousel-track" style="display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; width: 100% !important; transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important; will-change: transform !important;">
                <!-- Slide 1: 3-Min Lightning Delivery -->
                <div class="hero-carousel-slide flex-shrink-0" style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; padding: 1.75rem 1.5rem; min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; cursor: pointer; background: linear-gradient(135deg, rgba(6, 78, 59, 0.96) 0%, rgba(4, 120, 87, 0.92) 50%, rgba(16, 185, 129, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(52, 211, 153, 0.35), transparent 65%);">
                    <div class="space-y-2 max-w-lg z-10">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="clay-pill px-3 py-0.5 text-[10px] font-black text-emerald-300 bg-black/35 border border-emerald-400/35 flex items-center gap-1.5 backdrop-blur-md">
                                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                                <span>BH13 GROUND HUB</span>
                            </span>
                            <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm bg-emerald-400/25 text-white border border-emerald-300/30 backdrop-blur-md">
                                ⚡ 3-MIN ROOM DROP
                            </span>
                        </div>
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                            Corridor Express Snacks & Munchies
                        </h2>
                        <p class="text-xs sm:text-sm text-emerald-100/95 font-medium leading-relaxed max-w-md">
                            Instant noodles, chilled drinks, and snacks delivered right to your hostel room door in 3 minutes.
                        </p>
                    </div>
                    <div class="pt-3 z-10 flex items-center gap-2.5">
                        <a href="#/categories" class="clay-btn text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all" style="background: #ffffff !important; color: #047857 !important; font-weight: 800 !important;">
                            <span style="color: #047857 !important; font-weight: 800 !important;">Browse Snacks</span>
                            <svg class="w-3.5 h-3.5" style="color: #047857 !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                        <a href="#/flow-assist" class="clay-pill bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 hover:bg-white/30 backdrop-blur-md border border-white/25 transition-all">
                            <span class="text-amber-300 font-bold">✨</span>
                            <span>AI Assistant</span>
                        </a>
                    </div>
                </div>

                <!-- Slide 2: Midnight Cravings & Combos -->
                <div class="hero-carousel-slide flex-shrink-0" style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; padding: 1.75rem 1.5rem; min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; cursor: pointer; background: linear-gradient(135deg, rgba(59, 7, 100, 0.96) 0%, rgba(88, 28, 135, 0.92) 50%, rgba(126, 34, 206, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(192, 132, 252, 0.4), transparent 65%);">
                    <div class="space-y-2 max-w-lg z-10">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="clay-pill px-3 py-0.5 text-[10px] font-black text-purple-200 bg-black/35 border border-purple-400/35 flex items-center gap-1.5 backdrop-blur-md">
                                <span class="text-purple-300">🌙</span>
                                <span>MIDNIGHT FUEL</span>
                            </span>
                            <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm bg-purple-400/25 text-white border border-purple-300/30 backdrop-blur-md">
                                🌙 TILL 3 AM
                            </span>
                        </div>
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                            Late Night Study & Gaming Fuel
                        </h2>
                        <p class="text-xs sm:text-sm text-purple-100/95 font-medium leading-relaxed max-w-md">
                            Hot Maggi, cold drinks, chocolate bars, and crunchy chips ready for your midnight grind.
                        </p>
                    </div>
                    <div class="pt-3 z-10 flex items-center gap-2.5">
                        <a href="#/categories" class="clay-btn text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all" style="background: #ffffff !important; color: #581c87 !important; font-weight: 800 !important;">
                            <span style="color: #581c87 !important; font-weight: 800 !important;">Explore Combos</span>
                            <svg class="w-3.5 h-3.5" style="color: #581c87 !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>

                <!-- Slide 3: 100% Free Campus Delivery -->
                <div class="hero-carousel-slide flex-shrink-0" style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; padding: 1.75rem 1.5rem; min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; cursor: pointer; background: linear-gradient(135deg, rgba(120, 53, 15, 0.96) 0%, rgba(180, 83, 9, 0.92) 50%, rgba(217, 119, 6, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(251, 191, 36, 0.4), transparent 65%);">
                    <div class="space-y-2 max-w-lg z-10">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="clay-pill px-3 py-0.5 text-[10px] font-black text-amber-200 bg-black/35 border border-amber-400/35 flex items-center gap-1.5 backdrop-blur-md">
                                <span class="text-amber-300">⚡</span>
                                <span>CAMPUS PERK</span>
                            </span>
                            <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm bg-amber-400/25 text-white border border-amber-300/30 backdrop-blur-md">
                                🎉 ₹0 DELIVERY FEE
                            </span>
                        </div>
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                            Zero Delivery Fees On Every Order
                        </h2>
                        <p class="text-xs sm:text-sm text-amber-100/95 font-medium leading-relaxed max-w-md">
                            No convenience charges, no minimum order traps. 100% calm commerce delivery.
                        </p>
                    </div>
                    <div class="pt-3 z-10 flex items-center gap-2.5">
                        <a href="#shop-catalog-section" class="clay-btn text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all" style="background: #ffffff !important; color: #b45309 !important; font-weight: 800 !important;">
                            <span style="color: #b45309 !important; font-weight: 800 !important;">Shop Now</span>
                            <svg class="w-3.5 h-3.5" style="color: #b45309 !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>

                <!-- Slide 4: 100% Private & Discreet Packaging -->
                <div class="hero-carousel-slide flex-shrink-0" style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; padding: 1.75rem 1.5rem; min-height: 200px; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; cursor: pointer; background: linear-gradient(135deg, rgba(8, 51, 68, 0.96) 0%, rgba(14, 116, 144, 0.92) 50%, rgba(6, 182, 212, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(103, 232, 249, 0.4), transparent 65%);">
                    <div class="space-y-2 max-w-lg z-10">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="clay-pill px-3 py-0.5 text-[10px] font-black text-cyan-200 bg-black/35 border border-cyan-400/35 flex items-center gap-1.5 backdrop-blur-md">
                                <span class="text-cyan-300">🛡️</span>
                                <span>100% PRIVATE</span>
                            </span>
                            <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm bg-cyan-400/25 text-white border border-cyan-300/30 backdrop-blur-md">
                                🔒 HOSTEL SAFE
                            </span>
                        </div>
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                            Discreet Tamper-Proof Room Drop
                        </h2>
                        <p class="text-xs sm:text-sm text-cyan-100/95 font-medium leading-relaxed max-w-md">
                            All hostel orders sealed in opaque bags for privacy and peace of mind.
                        </p>
                    </div>
                    <div class="pt-3 z-10 flex items-center gap-2.5">
                        <a href="#shop-catalog-section" class="clay-btn text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all" style="background: #ffffff !important; color: #0e7490 !important; font-weight: 800 !important;">
                            <span style="color: #0e7490 !important; font-weight: 800 !important;">Order Confidentially</span>
                            <svg class="w-3.5 h-3.5" style="color: #0e7490 !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Bottom Pagination Dots -->
            <div class="hero-carousel-dots" id="carousel-dots" style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; z-index: 25;">
                <button type="button" class="hero-carousel-dot active" data-slide-index="0" aria-label="Slide 1"></button>
                <button type="button" class="hero-carousel-dot" data-slide-index="1" aria-label="Slide 2"></button>
                <button type="button" class="hero-carousel-dot" data-slide-index="2" aria-label="Slide 3"></button>
                <button type="button" class="hero-carousel-dot" data-slide-index="3" aria-label="Slide 4"></button>
            </div>
        </section>

        <!-- Bento Highlights Row (Flat ₹0 & Discreet Packaging) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div class="bento-tile p-4 sm:p-5 flex items-center justify-between gap-3" style="background: radial-gradient(circle at 10% 50%, rgba(245, 158, 11, 0.18), transparent 70%), var(--glass-bg);">
                <div class="space-y-1">
                    <span class="liquid-badge text-[9px] font-black px-2 py-0.5">CAMPUS PERK</span>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white tracking-tight">Zero Delivery Fees Forever</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Free 3-minute delivery to any room.</p>
                </div>
                <div class="w-10 h-10 rounded-2xl clay-card text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
                    <span class="material-symbols-outlined text-xl">local_shipping</span>
                </div>
            </div>
            <div class="bento-tile p-4 sm:p-5 flex items-center justify-between gap-3" style="background: radial-gradient(circle at 90% 50%, rgba(6, 182, 212, 0.18), transparent 70%), var(--glass-bg);">
                <div class="space-y-1">
                    <span class="clay-pill px-2.5 py-0.5 text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/25">100% PRIVATE</span>
                    <h3 class="text-sm font-black text-slate-900 dark:text-white tracking-tight">Discreet Opaque Packaging</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Sealed bags for complete privacy.</p>
                </div>
                <div class="w-10 h-10 rounded-2xl clay-card text-cyan-500 flex items-center justify-center shrink-0 shadow-xs">
                    <span class="material-symbols-outlined text-xl">shield</span>
                </div>
            </div>
        </section>

        <!-- ============================================================
             INSTAMART / BLINKIT-STYLE CATEGORY NAVIGATION & PRODUCT LAYOUT
             ============================================================ -->
        <!-- ============================================================
             MODERN VERTICAL CATEGORY RAIL & PRODUCT BROWSING SECTION
             ============================================================ -->
        <section class="pt-1 space-y-3" id="shop-catalog-section">
            <div class="flex items-start gap-2 sm:gap-4 lg:gap-6 pt-1">
                <!-- Unified Modern Left Vertical Category Rail (Mobile & Desktop) -->
                <aside class="w-[68px] sm:w-20 md:w-24 shrink-0 sticky top-16 md:top-20 z-10" id="category-rail-container">
                    <nav class="vertical-category-rail max-h-[calc(100dvh-5rem)] overflow-y-auto no-scrollbar py-1 space-y-1" id="vertical-category-rail">
                        ${STORE_CATEGORIES.map(c => `
                        <button type="button" 
                                class="category-rail-item category-sidebar-item category-mobile-pill ${c.id === 'all' ? 'active' : ''}" 
                                data-cat-id="${c.id}"
                                title="${c.name}">
                            <!-- Active Indicator Strip on the right edge -->
                            <span class="category-rail-indicator"></span>

                            <!-- Circular Category Icon -->
                            <div class="category-rail-icon-box">
                                <span class="category-rail-emoji select-none">${c.emoji}</span>
                            </div>

                            <!-- Category Name Beneath -->
                            <span class="category-rail-label">${c.name}</span>
                        </button>
                        `).join('')}
                    </nav>
                </aside>

                <!-- Right: Products Catalog Grid & Category Active View -->
                <div class="flex-1 w-full min-w-0 space-y-3 sm:space-y-4">
                    <!-- Active Category Header Card -->
                    <div class="glass-panel rounded-2xl p-2.5 sm:p-3.5 px-3 sm:px-4.5 border border-[var(--glass-border)] flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-2.5 sm:gap-3">
                            <span class="text-xl sm:text-2xl select-none" id="active-category-emoji">🛒</span>
                            <div>
                                <h2 class="text-xs sm:text-base font-black text-slate-900 dark:text-white tracking-tight" id="active-category-title">All Products</h2>
                                <p class="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium" id="active-category-subtitle">Showing all available products in BH13 Campus Hub</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="liquid-badge text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1" id="active-category-badge">${inStockProducts.length} Items</span>
                        </div>
                    </div>

                    <!-- In-Stock Product Grid -->
                    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4" id="home-main-products-grid">
                        ${inStockProductCards || `
                        <div class="col-span-full py-12 text-center flex flex-col items-center justify-center glass-card rounded-3xl p-6">
                            <span class="material-symbols-outlined text-4xl text-emerald mb-2">storefront</span>
                            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">Catalog Restocking</h3>
                            <p class="text-xs text-slate-500 mt-1 max-w-sm">Products are currently being refreshed. Please check back shortly!</p>
                        </div>
                        `}
                    </div>

                    <!-- Clean Empty Category State (Instamart/Blinkit Pattern) -->
                    <div id="category-empty-state" class="hidden col-span-full py-16 px-4 text-center flex flex-col items-center justify-center glass-panel card-pedestal rounded-3xl border border-[var(--glass-border)] shadow-xl space-y-3">
                        <div class="text-5xl select-none" id="empty-state-emoji">🍪</div>
                        <div class="space-y-1">
                            <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight" id="empty-state-title">No biscuits available right now.</h3>
                            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium" id="empty-state-desc">Check another category.</p>
                        </div>
                        <div class="pt-2">
                            <button type="button" class="clay-btn clay-btn-primary px-5 py-2 rounded-full text-xs font-black uppercase tracking-wide cursor-pointer" id="empty-state-reset-btn">
                                Browse All Items
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Past Items Shelf (Buy Again) -->
        ${buyAgainCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-emerald">replay</span>
                        <span>Buy Again</span>
                        ${isPersonalizedBuyAgain ? `<span class="liquid-badge text-[10px] font-bold px-2.5 py-0.5">Your Favorites</span>` : `<span class="clay-pill text-[10px] font-bold px-2 py-0.5">Popular</span>`}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">1-tap re-add to cart</p>
                <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="text-xs text-slate-400 font-semibold hidden sm:inline">Scroll →</span>
                    <button type="button" class="shelf-scroll-btn shelf-scroll-left w-7 h-7 rounded-full clay-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-90 shadow-xs cursor-pointer" title="Scroll left">
                        <span class="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button type="button" class="shelf-scroll-btn shelf-scroll-right w-7 h-7 rounded-full clay-card flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-90 shadow-xs cursor-pointer" title="Scroll right">
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
            <div class="flex overflow-x-auto gap-3 sm:gap-4 no-scrollbar pb-2 snap-x shelf-scroll-track horizontal-slider">${buyAgainCards}</div>
        </section>
        ` : ''}

        <!-- Secondary Category Shelf 1: Biscuits -->
        ${biscuitCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍪 Crunchy Biscuits & Cookies</span>
                </h2>
                <button type="button" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer home-shelf-link" data-target-cat="biscuits">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${biscuitCards}</div>
        </section>
        ` : ''}

        <!-- Secondary Category Shelf 2: Chips -->
        ${chipCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🥔 Crispy Chips & Wafers</span>
                </h2>
                <button type="button" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer home-shelf-link" data-target-cat="chips">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${chipCards}</div>
        </section>
        ` : ''}

        <!-- Secondary Category Shelf 3: Chocolates -->
        ${chocolateCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍫 Chocolates & Sweet Treats</span>
                </h2>
                <button type="button" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer home-shelf-link" data-target-cat="chocolates">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${chocolateCards}</div>
        </section>
        ` : ''}

        <!-- Secondary Category Shelf 4: Instant Meals -->
        ${instantFoodCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍜 Instant Meals & Maggi</span>
                </h2>
                <button type="button" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer home-shelf-link" data-target-cat="instant">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${instantFoodCards}</div>
        </section>
        ` : ''}

        <!-- Secondary Category Shelf 5: Munchies & Snacks -->
        ${snackCards ? `
        <section class="category-secondary-shelf space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍿 Campus Munchies & Namkeen</span>
                </h2>
                <button type="button" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer home-shelf-link" data-target-cat="snacks">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${snackCards}</div>
        </section>
        ` : ''}
    </main>

    <!-- Floating Liquid Glass Bottom Navigation Dock -->
    <div class="fixed bottom-3 inset-x-0 z-40 px-4 sm:hidden pointer-events-none flex justify-center">
        <nav class="pointer-events-auto liquid-dock-pill h-14 max-w-md w-full px-3 flex justify-around items-center rounded-full shadow-2xl">
            <a class="clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">home</span>
                <span class="text-[10px] mt-0.5 font-bold">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-semibold mt-0.5">Categories</span>
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

window.pageInits.home = function() {
    const mainGrid = document.getElementById('home-main-products-grid');
    let currentCategory = 'all';
    let currentSearchQuery = '';

    function applyFilters() {
        if (!mainGrid) return;
        const query = currentSearchQuery.trim().toLowerCase();
        const cards = mainGrid.querySelectorAll('.product-card-item');
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCat = card.dataset.category;
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            
            const matchesCategory = (currentCategory === 'all' || cardCat === currentCategory);
            const matchesSearch = (!query || title.includes(query));

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        const emptyState = document.getElementById('category-empty-state');
        const emptyEmoji = document.getElementById('empty-state-emoji');
        const emptyTitle = document.getElementById('empty-state-title');
        const emptyDesc = document.getElementById('empty-state-desc');
        const catBadge = document.getElementById('active-cat-count-badge');
        const activeCatBadge = document.getElementById('active-category-badge');
        const catObj = STORE_CATEGORIES.find(c => c.id === currentCategory) || STORE_CATEGORIES[0];

        if (catBadge) {
            catBadge.textContent = `${visibleCount} Items`;
        }
        if (activeCatBadge) {
            activeCatBadge.textContent = `${visibleCount} Items`;
        }

        if (visibleCount === 0) {
            if (emptyState) {
                emptyState.classList.remove('hidden');
                if (emptyEmoji) emptyEmoji.textContent = catObj.emoji;
                if (emptyTitle) {
                    if (query) {
                        emptyTitle.textContent = `No items matching "${query}" in ${catObj.name}`;
                    } else {
                        emptyTitle.textContent = `No ${catObj.name.toLowerCase()} available right now.`;
                    }
                }
                if (emptyDesc) emptyDesc.textContent = 'Check another category.';
            }
        } else {
            if (emptyState) emptyState.classList.add('hidden');
        }

        // Toggle secondary shelves: only visible when 'all' and no search
        const shelves = document.querySelectorAll('.category-secondary-shelf');
        shelves.forEach(s => {
            if (currentCategory === 'all' && !query) {
                s.classList.remove('hidden');
            } else {
                s.classList.add('hidden');
            }
        });
    }

    function selectCategory(catId) {
        currentCategory = catId;

        // Update active class on vertical category rail & compatibility aliases
        document.querySelectorAll('.category-rail-item, .category-sidebar-item, .category-mobile-pill').forEach(item => {
            if (item.dataset.catId === catId) {
                item.classList.add('active');
                try {
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } catch(e) {}
            } else {
                item.classList.remove('active');
            }
        });

        // Update active category header
        const catObj = STORE_CATEGORIES.find(c => c.id === catId) || STORE_CATEGORIES[0];
        const emojiEl = document.getElementById('active-category-emoji');
        const titleEl = document.getElementById('active-category-title');
        const subtitleEl = document.getElementById('active-category-subtitle');
        if (emojiEl) emojiEl.textContent = catObj.emoji;
        if (titleEl) titleEl.textContent = catObj.id === 'all' ? 'All Products' : catObj.name;
        if (subtitleEl) {
            subtitleEl.textContent = catObj.id === 'all' 
                ? 'Showing all available products in BH13 Campus Hub' 
                : `Showing ${catObj.name} in BH13 Campus Hub`;
        }

        applyFilters();

        // On mobile, scroll to catalog section if user tapped category
        const catalogSec = document.getElementById('shop-catalog-section');
        if (catalogSec && window.innerWidth < 1024) {
            const rect = catalogSec.getBoundingClientRect();
            if (rect.top < 0 || rect.top > 300) {
                window.scrollTo({ top: window.scrollY + rect.top - 65, behavior: 'smooth' });
            }
        }
    }

    // Bind category click on vertical category rail & aliases
    document.querySelectorAll('.category-rail-item, .category-sidebar-item, .category-mobile-pill').forEach(btn => {
        btn.onclick = () => {
            const catId = btn.dataset.catId;
            if (catId) selectCategory(catId);
        };
    });

    // Shelf "See all" click triggers
    document.querySelectorAll('.home-shelf-link').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const cat = link.dataset.targetCat;
            if (cat) selectCategory(cat);
        };
    });

    // Reset button inside empty state
    const resetBtn = document.getElementById('empty-state-reset-btn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            currentSearchQuery = '';
            const searchDesktop = document.getElementById('desktop-search');
            const searchMobile = document.getElementById('mobile-search');
            if (searchDesktop) searchDesktop.value = '';
            if (searchMobile) searchMobile.value = '';
            selectCategory('all');
        };
    }

    // Global Address Selector Trigger
    document.querySelectorAll('.address-selector-trigger').forEach(trigger => {
        trigger.onclick = () => {
            if (typeof window.openAddressModal === 'function') {
                window.openAddressModal();
            }
        };
    });

    // Search inputs handler (works seamlessly together with category filter)
    const searchInputs = [document.getElementById('desktop-search'), document.getElementById('mobile-search')].filter(Boolean);
    searchInputs.forEach(input => {
        input.oninput = (e) => {
            currentSearchQuery = e.target.value;
            // Sync both search inputs
            searchInputs.forEach(other => {
                if (other !== input) other.value = currentSearchQuery;
            });
            applyFilters();
        };
    });

    // Keyboard shortcut '/' to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            const searchInput = document.getElementById('desktop-search') || document.getElementById('mobile-search');
            if (searchInput) searchInput.focus();
        }
    });

    // ============================================================
    // HERO PROMOTIONAL BANNER CAROUSEL CONTROLLER (SWIPE, ARROWS, AUTO-PLAY)
    // ============================================================
    const carouselTrack = document.getElementById('carousel-track');
    const carouselContainer = document.getElementById('hero-banner-carousel');
    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');
    const dots = document.querySelectorAll('.hero-carousel-dot');
    const totalSlides = 4;
    let currentSlide = 0;
    let autoSlideInterval = null;

    function updateCarouselView() {
        if (!carouselTrack) return;
        carouselTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
        dots.forEach((d, idx) => {
            if (idx === currentSlide) {
                d.classList.add('active');
            } else {
                d.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateCarouselView();
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateCarouselView();
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 4500);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    if (carouselContainer && carouselTrack) {
        startAutoSlide();

        // Pause on mouseenter, resume on mouseleave (laptop / desktop)
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);

        // Arrow buttons
        if (prevBtn) {
            prevBtn.onclick = (e) => {
                e.preventDefault();
                prevSlide();
                startAutoSlide();
            };
        }
        if (nextBtn) {
            nextBtn.onclick = (e) => {
                e.preventDefault();
                nextSlide();
                startAutoSlide();
            };
        }

        // Dot buttons
        dots.forEach(dot => {
            dot.onclick = () => {
                const targetIdx = Number(dot.dataset.slideIndex);
                if (!isNaN(targetIdx)) {
                    currentSlide = targetIdx;
                    updateCarouselView();
                    startAutoSlide();
                }
            };
        });

        // Touch & Swipe Support (Mobile & Touch Laptops)
        let touchStartX = 0;
        let touchEndX = 0;
        carouselContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            stopAutoSlide();
        }, { passive: true });

        carouselContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const diffX = touchEndX - touchStartX;
            if (Math.abs(diffX) > 40) {
                if (diffX < 0) nextSlide();
                else prevSlide();
            }
            startAutoSlide();
        }, { passive: true });

        // Mouse Drag Support (Laptops & Desktops)
        let isMouseDown = false;
        let mouseStartX = 0;
        carouselContainer.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
        });

        window.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;
            const mouseDiffX = e.clientX - mouseStartX;
            if (Math.abs(mouseDiffX) > 50) {
                if (mouseDiffX < 0) nextSlide();
                else prevSlide();
                startAutoSlide();
            }
        });
    }

    // ============================================================
    // SHELF SCROLL CONTROLS (LAPTOP & DESKTOP SMOOTH SCROLL)
    // ============================================================
    document.querySelectorAll('.shelf-scroll-btn').forEach(btn => {
        btn.onclick = () => {
            const shelf = btn.closest('.category-secondary-shelf');
            if (!shelf) return;
            const track = shelf.querySelector('.shelf-scroll-track') || shelf.querySelector('.overflow-x-auto');
            if (!track) return;
            const isLeft = btn.classList.contains('shelf-scroll-left');
            track.scrollBy({
                left: isLeft ? -260 : 260,
                behavior: 'smooth'
            });
        };
    });

    // Initial filter apply
    applyFilters();
};

// Home Page — Clean Classical Campus Quick-Commerce Storefront
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

function buildProductCardsHTML(items, isAboveFold = false) {
    if (!items || items.length === 0) return '';
    return items.map((p, idx) => {
        const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        const ratingVal = p.rating || 4.8;
        const isLcpCandidate = isAboveFold && idx === 0;
        const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
        const isLowStock = stockLeft > 0 && stockLeft <= 4;
        const isOutOfStock = !p.in_stock || stockLeft === 0;

        // Determine data-category tags for live filtering
        const textToMatch = `${p.name || ''} ${p.category || ''} ${p.tags || ''}`.toLowerCase();
        let catTag = 'other';
        if (/biscuit|cookie|wafer|pie|bikis|bourbon|creme|shakti|magic|treat/i.test(textToMatch)) {
            catTag = 'biscuits';
        } else if (/chips|snack|kurkure|lays|crax|bingo|tedhe|namkeen|curls/i.test(textToMatch)) {
            catTag = 'snacks';
        } else if (/choco|dark fantasy|pie|sweet|dessert/i.test(textToMatch)) {
            catTag = 'chocolates';
        } else if (/instant|maggi|noodle|pasta|soup|cup/i.test(textToMatch)) {
            catTag = 'instant';
        } else if (/beverage|drink|shake|juice|coke|pepsi|water|soda|tea|coffee/i.test(textToMatch)) {
            catTag = 'drinks';
        }

        return `
        <div class="product-card-item product-detail-trigger p-3 flex flex-col justify-between cursor-pointer group ${isOutOfStock ? 'opacity-85' : ''}" data-product-id="${p.id}" data-category="${catTag}" data-out-of-stock="${isOutOfStock}">
            <div>
                <!-- Claymorphic Image Frame with Soft Inset Lighting -->
                <div class="h-32 sm:h-36 bg-gradient-to-b from-white/90 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl relative overflow-hidden flex items-center justify-center p-2.5 mb-2.5 border border-white/80 dark:border-white/10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]">
                    <!-- Veg indicator -->
                    <div class="absolute top-2 left-2 z-10 bg-white/90 dark:bg-slate-900/90 p-0.5 rounded-md shadow-xs border border-white/60 dark:border-white/10">
                        <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-rose-600'} rounded-xs flex items-center justify-center p-[1px]">
                            <span class="w-1.5 h-1.5 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
                        </span>
                    </div>

                    <!-- Liquid Glass Discount Badge -->
                    ${discountPercent > 0 ? `
                    <div class="liquid-badge absolute top-2 right-2 z-10 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 shadow-xs">
                        ${discountPercent}% OFF
                    </div>
                    ` : ''}

                    <!-- Stock Status Badge -->
                    ${isLowStock ? `
                    <div class="absolute bottom-2 left-2 z-10 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Only ${stockLeft} left
                    </div>
                    ` : (isOutOfStock ? `
                    <div class="absolute bottom-2 left-2 z-10 bg-rose-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Out of Stock
                    </div>
                    ` : '')}

                    <img class="object-contain w-full h-full group-hover:scale-108 transition-transform duration-300" 
                         src="${p.image_url}" 
                         alt="${p.name}" 
                         width="140" 
                         height="140" 
                         ${isLcpCandidate ? 'fetchpriority="high"' : 'loading="lazy"'} 
                         decoding="async" 
                         onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&q=75'">
                </div>

                <!-- Pack Size -->
                <p class="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mb-1">${p.size || p.unit || '1 unit'}</p>

                <!-- Title -->
                <h3 class="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug min-h-[32px]">${p.name}</h3>
            </div>

            <!-- Bottom Price & ADD Button Slot -->
            <div class="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                <div class="flex flex-col">
                    <span class="text-sm font-extrabold text-slate-900 dark:text-white">₹${p.price}</span>
                    ${p.mrp && p.mrp > p.price ? `<span class="text-[10px] text-slate-400 line-through">₹${p.mrp}</span>` : ''}
                </div>

                <div class="product-action-slot" data-id="${p.id}" data-out-of-stock="${isOutOfStock}" data-stock-left="${stockLeft}">
                    ${isOutOfStock ? `
                    <span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full cursor-not-allowed select-none">
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

    const sectionTitle = data?.section_title || 'Campus Express Catalog';
    const allProductsFromApi = (productsRes?.products && productsRes.products.length > 0) ? productsRes.products : (data?.all_products || data?.products || []);

    const inStockProducts = allProductsFromApi.filter(p => {
        return p.in_stock !== false && (p.stock_left === undefined || p.stock_left === null || p.stock_left > 0);
    });

    const outOfStockProducts = allProductsFromApi.filter(p => {
        return p.in_stock === false || (p.stock_left !== undefined && p.stock_left <= 0);
    });

    const buyAgain = (data?.buy_again || []).filter(p => p.in_stock !== false && (p.stock_left === undefined || p.stock_left > 0));
    const isPersonalizedBuyAgain = Boolean(data?.is_personalized_buy_again);
    
    // In-Stock Category collections
    const biscuits = inStockProducts.filter(p => /biscuit|cookie|wafer|pie|bikis|bourbon|creme|shakti|magic|treat/i.test((p.name || '') + ' ' + (p.category || '')));
    const trendingSnacks = inStockProducts.filter(p => /chips|snack|kurkure|lays|crax|bingo|tedhe|namkeen|curls/i.test((p.name || '') + ' ' + (p.category || '')));
    const chocolates = inStockProducts.filter(p => /choco|dark fantasy|pie|sweet|dessert/i.test((p.name || '') + ' ' + (p.category || '')));
    const instantFood = inStockProducts.filter(p => /instant|maggi|noodle|pasta|soup|cup/i.test((p.name || '') + ' ' + (p.category || '')));
    const drinks = inStockProducts.filter(p => /beverage|drink|shake|juice|coke|pepsi|water|soda/i.test((p.name || '') + ' ' + (p.category || '')));
    
    const address = window.currentAddress || 'BH13';

    const inStockProductCards = buildProductCardsHTML(inStockProducts, true);
    const biscuitCards = buildProductCardsHTML(biscuits);
    const trendingSnackCards = buildProductCardsHTML(trendingSnacks);
    const chocolateCards = buildProductCardsHTML(chocolates);
    const instantFoodCards = buildProductCardsHTML(instantFood);
    const drinkCards = buildProductCardsHTML(drinks);
    const outOfStockCards = buildProductCardsHTML(outOfStockProducts);

    const buyAgainCards = buyAgain.map(p => {
        const isOutOfStock = !p.in_stock || (p.stock_left !== undefined && p.stock_left <= 0);
        return `
        <div class="flex-none w-36 sm:w-44 snap-start product-card-item p-3 product-detail-trigger cursor-pointer flex flex-col justify-between" data-product-id="${p.id}">
            <div>
                <div class="h-24 sm:h-28 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-2 relative overflow-hidden flex items-center justify-center p-2">
                    ${isOutOfStock ? `
                    <div class="absolute top-1.5 left-1.5 z-10 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        Out
                    </div>
                    ` : ''}
                    <img class="object-contain w-full h-full" 
                         src="${p.image_url}" 
                         alt="${p.name}" 
                         width="100" 
                         height="100" 
                         loading="lazy" 
                         decoding="async" 
                         onerror="this.src='https://images.unsplash.com/photo-1568651316335-714a806283db?w=300&auto=format&q=75'">
                </div>
                <p class="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">${p.name}</p>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">${p.size || p.unit || '1 unit'}</p>
            </div>
            <div class="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <p class="text-xs font-extrabold text-slate-900 dark:text-white">₹${p.price}</p>
                <div class="product-action-slot" data-id="${p.id}">
                    ${isOutOfStock ? `
                    <span class="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        Out
                    </span>
                    ` : `
                    <button type="button" class="add-to-cart-btn uppercase text-[10px] px-2.5 py-1" data-id="${p.id}">ADD</button>
                    `}
                </div>
            </div>
        </div>
    `;}).join('');

    return `
<div class="min-h-screen pb-32">
    <!-- TopAppBar (Web) — Frosted Liquid Glass -->
    <header class="hidden md:flex justify-between items-center px-6 lg:px-10 py-3 w-full z-50 fixed top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/70 dark:border-white/10 shadow-sm">
        <div class="flex items-center gap-6">
            <a href="#/" class="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                <img src="/logo.png" alt="LPUQuick" class="w-8 h-8 rounded-full shadow-xs shrink-0 object-contain">
                <div class="flex flex-col">
                    <span class="brand-title text-xl tracking-tight leading-none font-bold text-emerald-700 dark:text-emerald-400">LPUQuick</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide uppercase">BH13 Express</span>
                </div>
            </a>

            <!-- Address Selector Trigger (Tactile Clay Pill) -->
            <button type="button" class="address-selector-trigger clay-pill flex items-center px-4 py-1.5 text-slate-800 dark:text-slate-200 text-xs cursor-pointer">
                <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-sm mr-1.5" style="font-variation-settings: 'FILL' 1;">location_on</span>
                <span>Deliver to <strong>${address}</strong></span>
                <span class="text-slate-400 dark:text-slate-500 ml-1">· 3 mins</span>
                <span class="material-symbols-outlined text-xs ml-1 text-slate-400">expand_more</span>
            </button>
        </div>

        <div class="flex items-center gap-3">
            <!-- Dedicated Fast Product Search -->
            <div class="relative w-80">
                <input class="w-full pl-9 pr-8 py-2 rounded-full border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all shadow-xs" placeholder="Search snacks, drinks, maggi, chips..." type="text" id="desktop-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                <div id="desktop-search-dropdown" class="hidden absolute top-11 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2"></div>
            </div>

            <!-- Install App Quick Pill -->
            <button type="button" onclick="window.showInstallPrompt()" class="btn-install-app clay-pill bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs" title="Install App">
                <span class="material-symbols-outlined text-sm">install_mobile</span>
                <span>Install</span>
            </button>

            <!-- Sleek Day/Night Theme Pill Switch -->
            <button type="button" 
                    class="theme-toggle-switch relative inline-flex items-center w-[54px] h-[28px] rounded-full p-[2px] transition-all duration-200 ease-in-out cursor-pointer select-none bg-slate-200/80 dark:bg-slate-800/80 border border-white/70 dark:border-white/10 hover:opacity-90 active:scale-95 shrink-0 shadow-xs" 
                    role="switch" 
                    aria-checked="false" 
                    aria-label="Toggle dark mode" 
                    title="Toggle Light / Dark Mode"
                    onclick="window.toggleTheme()">
                <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full bg-white dark:bg-slate-950 shadow transition-transform duration-200 ease-in-out pointer-events-none border border-slate-300 dark:border-slate-700"></div>
                <div class="relative w-full flex items-center justify-between px-1.5 z-10 pointer-events-none">
                    <span class="theme-sun-icon material-symbols-outlined text-[13px] text-amber-500">wb_sunny</span>
                    <span class="theme-moon-icon material-symbols-outlined text-[13px] text-slate-400 dark:text-slate-200">dark_mode</span>
                </div>
            </button>

            <a href="#/orders" class="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="My Orders"><span class="material-symbols-outlined">receipt_long</span></a>
            <a href="#/cart" class="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors relative flex items-center justify-center" title="Cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span id="desktop-header-cart-count" class="global-cart-count-badge absolute -top-0.5 -right-0.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white/50">0</span>
            </a>
            <a href="#/settings" class="p-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Settings"><span class="material-symbols-outlined">account_circle</span></a>
        </div>
    </header>

    <!-- TopAppBar (Mobile) — Frosted Liquid Glass -->
    <header class="md:hidden flex justify-between items-center px-4 py-2.5 w-full z-50 fixed top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/70 dark:border-white/10 shadow-sm">
        <div class="flex items-center gap-2.5 min-w-0">
            <a href="#/" class="shrink-0">
                <img src="/logo.png" alt="LPUQuick" class="w-8 h-8 rounded-full shadow-xs shrink-0 object-contain">
            </a>
            <button type="button" class="address-selector-trigger flex flex-col text-left cursor-pointer truncate">
                <div class="flex items-center text-slate-900 dark:text-white font-bold text-xs truncate">
                    <span class="truncate">Deliver to <strong>${address}</strong></span>
                    <span class="material-symbols-outlined ml-0.5 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">expand_more</span>
                </div>
                <span class="text-slate-500 dark:text-slate-400 text-[10px]">⚡ 3 mins · Tap to change</span>
            </button>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
            <!-- Mobile Install App Button -->
            <button type="button" onclick="window.showInstallPrompt()" class="btn-install-app p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center cursor-pointer" title="Install App">
                <span class="material-symbols-outlined text-lg">install_mobile</span>
            </button>

            <!-- Mobile Day/Night Theme Pill Switch -->
            <button type="button" 
                    class="theme-toggle-switch relative inline-flex items-center w-[50px] h-[26px] rounded-full p-[2px] transition-all duration-200 ease-in-out cursor-pointer select-none bg-slate-200/80 dark:bg-slate-800/80 border border-white/70 dark:border-white/10 hover:opacity-90 active:scale-95 shrink-0 shadow-xs" 
                    role="switch" 
                    aria-checked="false" 
                    aria-label="Toggle dark mode" 
                    title="Toggle Light / Dark Mode"
                    onclick="window.toggleTheme()">
                <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white dark:bg-slate-950 shadow transition-transform duration-200 ease-in-out pointer-events-none border border-slate-300 dark:border-slate-700"></div>
                <div class="relative w-full flex items-center justify-between px-1.5 z-10 pointer-events-none">
                    <span class="theme-sun-icon material-symbols-outlined text-[12px] text-amber-500">wb_sunny</span>
                    <span class="theme-moon-icon material-symbols-outlined text-[12px] text-slate-400 dark:text-slate-200">dark_mode</span>
                </div>
            </button>

            <a href="#/cart" class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors relative flex items-center justify-center" title="Cart">
                <span class="material-symbols-outlined text-xl">shopping_cart</span>
                <span id="mobile-header-cart-count" class="global-cart-count-badge absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white/50">0</span>
            </a>
            <a href="#/settings" class="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors" title="Settings">
                <span class="material-symbols-outlined text-xl">account_circle</span>
            </a>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="pt-18 md:pt-24 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
        <!-- Store Closed / Reopening Hero Alert Slot -->
        <div id="store-closed-banner-slot" class="hidden"></div>

        <!-- Mobile Product Search Bar -->
        <section class="md:hidden relative w-full pt-1">
            <div class="relative">
                <input class="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs" placeholder="Search snacks, drinks, maggi, chips..." type="text" id="mobile-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-base">search</span>
            </div>
            <div id="mobile-search-dropdown" class="hidden absolute top-12 left-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/70 dark:border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2"></div>
        </section>

        <!-- Liquid Glass Hero Promotional Showcase -->
        <section class="rounded-3xl bg-gradient-to-r from-emerald-800/90 via-emerald-750/90 to-teal-900/90 text-white p-6 sm:p-8 shadow-2xl backdrop-blur-xl border border-white/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
            <div class="absolute -right-16 -top-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="z-10 max-w-xl">
                <div class="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-emerald-100 text-[10px] font-extrabold px-3 py-1 rounded-full mb-3 uppercase tracking-wider backdrop-blur-md shadow-xs">
                    <span>⚡ BH13 Ground Floor Express Hub</span>
                </div>
                <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                    Instant 3-Minute Campus Delivery
                </h1>
                <p class="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
                    Fresh munchies, iced beverages, noodles & exam study essentials delivered right to your hostel door.
                </p>
                <div class="mt-5 flex items-center gap-3">
                    <a href="#/categories" class="clay-btn bg-white hover:bg-white/95 text-emerald-900 font-extrabold text-xs px-5 py-2.5 rounded-full transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5 border border-white/80">
                        <span>Browse Catalog</span>
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                    <a href="#/flow-assist" class="clay-pill bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-full border border-emerald-400/40 transition-all inline-flex items-center gap-1.5 backdrop-blur-md">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span>
                        <span>AI Combos</span>
                    </a>
                </div>
            </div>
            <div class="hidden sm:flex items-center justify-center w-32 h-32 rounded-3xl bg-white/10 border border-white/20 text-white/90 backdrop-blur-md shadow-inner">
                <span class="material-symbols-outlined text-6xl">timer</span>
            </div>
        </section>

        <!-- 1. Explore All Available In-Stock Products & Live Filter Chips -->
        <section>
            <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-2 mb-3.5">
                <div>
                    <h2 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>${sectionTitle}</span>
                        <span class="text-[10px] liquid-badge text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-0.5">Available Now</span>
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quick delivery across all BH13 rooms</p>
                </div>
                <a class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 shrink-0" href="#/categories">
                    <span>View All Categories</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>

            <!-- Tactile Clay Category Filter Chips -->
            <div class="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-3 pt-1" id="home-category-filters">
                <button type="button" class="home-filter-btn clay-btn-primary px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md shrink-0 active:scale-95 cursor-pointer" data-filter="all">
                    All Items
                </button>
                ${biscuits.length > 0 ? `
                <button type="button" class="home-filter-btn clay-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-slate-700 dark:text-slate-200 shrink-0 active:scale-95 cursor-pointer" data-filter="biscuits">
                    Biscuits
                </button>
                ` : ''}
                ${trendingSnacks.length > 0 ? `
                <button type="button" class="home-filter-btn clay-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-slate-700 dark:text-slate-200 shrink-0 active:scale-95 cursor-pointer" data-filter="snacks">
                    Chips & Munchies
                </button>
                ` : ''}
                ${chocolates.length > 0 ? `
                <button type="button" class="home-filter-btn clay-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-slate-700 dark:text-slate-200 shrink-0 active:scale-95 cursor-pointer" data-filter="chocolates">
                    Chocolates
                </button>
                ` : ''}
                ${instantFood.length > 0 ? `
                <button type="button" class="home-filter-btn clay-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-slate-700 dark:text-slate-200 shrink-0 active:scale-95 cursor-pointer" data-filter="instant">
                    Instant Food
                </button>
                ` : ''}
                ${drinks.length > 0 ? `
                <button type="button" class="home-filter-btn clay-pill px-4 py-1.5 rounded-full text-xs font-semibold transition-all text-slate-700 dark:text-slate-200 shrink-0 active:scale-95 cursor-pointer" data-filter="drinks">
                    Cold Drinks
                </button>
                ` : ''}
            </div>

            <!-- In-Stock Product Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4" id="home-main-products-grid">
                ${inStockProductCards || `
                <div class="col-span-full py-12 text-center flex flex-col items-center justify-center glass-card rounded-3xl p-6">
                    <span class="material-symbols-outlined text-4xl text-emerald-600 mb-2">storefront</span>
                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">Catalog Restocking</h3>
                    <p class="text-xs text-slate-500 mt-1 max-w-sm">Products are currently being refreshed. Please check back shortly!</p>
                </div>
                `}
            </div>
        </section>

        <!-- 2. Buy Again Horizontal Snap Carousel -->
        ${buyAgainCards ? `
        <section class="pt-2">
            <div class="flex justify-between items-center mb-2.5">
                <div>
                    <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Buy Again</span>
                        ${isPersonalizedBuyAgain ? `<span class="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">Your Past Items</span>` : `<span class="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">Student Picks</span>`}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400">${isPersonalizedBuyAgain ? 'Quick 1-tap reorder' : 'Popular campus favorites'}</p>
                </div>
                <span class="text-xs text-slate-400 font-medium">Swipe →</span>
            </div>
            <div class="flex overflow-x-auto gap-3 sm:gap-4 no-scrollbar pb-2 snap-x">${buyAgainCards}</div>
        </section>
        ` : ''}

        <!-- 3. Crunchy Biscuits & Cookies -->
        ${biscuitCards ? `
        <section class="pt-2">
            <div class="flex justify-between items-end mb-3">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    🍪 Biscuits & Cookies
                </h2>
                <a class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">${biscuitCards}</div>
        </section>
        ` : ''}

        <!-- 4. Trending Hostel Munchies & Chips -->
        ${trendingSnackCards ? `
        <section class="pt-2">
            <div class="flex justify-between items-end mb-3">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    🍿 Chips & Snacks
                </h2>
                <a class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">${trendingSnackCards}</div>
        </section>
        ` : ''}

        <!-- 5. Chocolates & Sweet Delights -->
        ${chocolateCards ? `
        <section class="pt-2">
            <div class="flex justify-between items-end mb-3">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    🍫 Chocolates & Sweets
                </h2>
                <a class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">${chocolateCards}</div>
        </section>
        ` : ''}

        <!-- 6. Instant Noodles & Late Night Fuel -->
        ${instantFoodCards ? `
        <section class="pt-2">
            <div class="flex justify-between items-end mb-3">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    🍜 Instant Noodles & Maggi
                </h2>
                <a class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">${instantFoodCards}</div>
        </section>
        ` : ''}

        <!-- 7. Promotional Service Highlights -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <a href="#/flow-assist" class="glass-card rounded-3xl p-5 hover:border-emerald-500/50 transition-all shadow-md flex items-start justify-between gap-4 cursor-pointer group border border-white/70 dark:border-white/10">
                <div class="space-y-1">
                    <span class="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-200 dark:border-purple-800">AI Assistant</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">Need snack bundle ideas?</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Ask Flow Assist to build custom combos for exam study sessions or match watch parties.</p>
                    <div class="pt-2">
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Try Flow Assist →
                        </span>
                    </div>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-purple-100/60 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200/50 dark:border-purple-800/50 shadow-xs">
                    <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
            </a>

            <a href="#/categories" class="glass-card rounded-3xl p-5 hover:border-emerald-500/50 transition-all shadow-md flex items-start justify-between gap-4 cursor-pointer group border border-white/70 dark:border-white/10">
                <div class="space-y-1">
                    <span class="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200 dark:border-emerald-800">BH13 Delivery</span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">Late Night Deliveries</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">Serving all blocks in BH13. Order directly to your room with cash or UPI on delivery.</p>
                    <div class="pt-2">
                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Explore Categories →
                        </span>
                    </div>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/50 shadow-xs">
                    <span class="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
            </a>
        </section>

        <!-- 8. Out of Stock Items (Segregated at bottom if any) -->
        ${outOfStockProducts.length > 0 ? `
        <section class="opacity-80 pt-4 border-t border-slate-200/60 dark:border-slate-800">
            <div class="flex justify-between items-center mb-3">
                <div>
                    <h3 class="font-bold text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base">inventory_2</span>
                        <span>Temporarily Out of Stock (${outOfStockProducts.length})</span>
                    </h3>
                    <p class="text-[11px] text-slate-400">Restocking in the next delivery batch</p>
                </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${outOfStockCards}</div>
        </section>
        ` : ''}
    </main>

    <!-- Bottom Navigation Bar (Liquid Glass Dock) -->
    <div class="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center py-2 px-3 mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-2xl border border-white/70 dark:border-white/10 rounded-full">
            <a class="flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold px-4 py-1.5 rounded-full transition-all bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30" href="#/">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">home</span>
                <span class="text-[10px] font-bold mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-1.5 rounded-full transition-all" href="#/categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-medium mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-1.5 rounded-full transition-all relative" href="#/cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white/40">0</span>
                </div>
                <span class="text-[10px] font-medium mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-1.5 rounded-full transition-all" href="#/orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-medium mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.home = function() {
    // Setup dedicated live product search dropdown on Home screen
    ['desktop-search', 'mobile-search'].forEach(inputId => {
        const input = document.getElementById(inputId);
        const dropdownId = inputId === 'desktop-search' ? 'desktop-search-dropdown' : 'mobile-search-dropdown';
        const dropdown = document.getElementById(dropdownId);

        let debounce;
        input?.addEventListener('input', () => {
            clearTimeout(debounce);
            const q = input.value.trim();
            if (!q || !dropdown) {
                dropdown?.classList.add('hidden');
                return;
            }
            debounce = setTimeout(async () => {
                const res = await window.api.searchProducts(q);
                const items = res.results || [];
                dropdown.classList.remove('hidden');
                if (items.length === 0) {
                    dropdown.innerHTML = `<div class="p-3 text-xs text-slate-500 text-center">No products matching "${q}"</div>`;
                    return;
                }
                dropdown.innerHTML = items.slice(0, 6).map(p => {
                    const isOutOfStock = !p.in_stock || (p.stock_left !== undefined && p.stock_left <= 0);
                    return `
                    <div class="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer search-item-row ${isOutOfStock ? 'opacity-75' : ''}" data-id="${p.id}">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <img class="w-9 h-9 object-contain rounded-lg bg-slate-50 dark:bg-slate-800 p-1" src="${p.image_url}" alt="${p.name}" width="36" height="36" loading="lazy" decoding="async">
                            <div class="min-w-0">
                                <p class="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">${p.name}</p>
                                <p class="text-[10px] text-slate-500">₹${p.price} · ${p.size || p.unit || '1 unit'}</p>
                            </div>
                        </div>
                        ${isOutOfStock ? `
                        <span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            Out
                        </span>
                        ` : `
                        <button type="button" class="add-to-cart-btn uppercase text-[10px] px-2.5 py-1 quick-add-btn" data-id="${p.id}">ADD</button>
                        `}
                    </div>
                `;}).join('');

                dropdown.querySelectorAll('.search-item-row').forEach(row => {
                    row.onclick = (e) => {
                        if (e.target.closest('.quick-add-btn')) return;
                        window.openProductModal(row.dataset.id);
                        dropdown.classList.add('hidden');
                    };
                });

                dropdown.querySelectorAll('.quick-add-btn').forEach(btn => {
                    btn.onclick = async (e) => {
                        e.stopPropagation();
                        const pid = btn.dataset.id;
                        btn.textContent = '✓';
                        window.cartState = window.cartState || {};
                        window.cartState[pid] = { quantity: 1, cart_id: window.cartState[pid]?.cart_id || `temp_${pid}` };
                        if (typeof window.updateSingleProductSlot === 'function') window.updateSingleProductSlot(pid);
                        const uid = window.getEffectiveUserId();
                        await window.api.addToCart(uid, pid, 1);
                    };
                });
            }, 40);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input?.contains(e.target) && !dropdown?.contains(e.target)) {
                dropdown?.classList.add('hidden');
            }
        });
    });

    // Real-time Category Filter Chips on Home Screen
    const filterContainer = document.getElementById('home-category-filters');
    const mainGrid = document.getElementById('home-main-products-grid');
    if (filterContainer && mainGrid) {
        filterContainer.querySelectorAll('.home-filter-btn').forEach(btn => {
            btn.onclick = () => {
                const filter = btn.dataset.filter;
                // Update active button styling
                filterContainer.querySelectorAll('.home-filter-btn').forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white', 'shadow-sm', 'font-bold');
                    b.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200', 'border', 'border-slate-200', 'dark:border-slate-700', 'font-semibold');
                });
                btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-200', 'border', 'border-slate-200', 'dark:border-slate-700', 'font-semibold');
                btn.classList.add('bg-emerald-600', 'text-white', 'shadow-sm', 'font-bold');

                // Filter cards in real-time
                const cards = mainGrid.querySelectorAll('.product-card-item');
                cards.forEach(card => {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            };
        });
    }
};

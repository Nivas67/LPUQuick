// Home Page — Next-Gen Campus Storefront with Dynamic Island & Bento Grid Architecture
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

function buildProductCardsHTML(items, isAboveFold = false) {
    if (!items || items.length === 0) return '';
    return items.map((p, idx) => {
        const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
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
        <div class="product-card-item product-detail-trigger p-3.5 flex flex-col justify-between cursor-pointer group ${isOutOfStock ? 'opacity-75' : ''}" data-product-id="${p.id}" data-category="${catTag}" data-out-of-stock="${isOutOfStock}">
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
            <div class="mt-3 pt-2.5 border-t border-[var(--glass-border)] flex items-center justify-between gap-2">
                <div class="flex flex-col">
                    <span class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">₹${p.price}</span>
                    ${p.mrp && p.mrp > p.price ? `<span class="text-[10px] text-slate-400 font-medium line-through">₹${p.mrp}</span>` : ''}
                </div>

                <div class="product-action-slot" data-id="${p.id}" data-out-of-stock="${isOutOfStock}" data-stock-left="${stockLeft}">
                    ${isOutOfStock ? `
                    <span class="clay-pill text-[10px] font-bold text-slate-400 px-3 py-1 cursor-not-allowed select-none">
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
    <main class="pt-5 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
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
             NEXT-GEN HERO BENTO GRID (4 Distinct Interactive Campus Tiles)
             ============================================================ -->
        <section class="bento-grid">
            <!-- Bento Tile 1: Primary Campus Express Corridor (8 Cols Desktop, 12 Mobile) -->
            <div class="bento-tile col-span-12 lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group" style="background: radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.25), transparent 60%), linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(4, 120, 87, 0.85)); color: #fff;">
                <div class="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
                
                <div class="space-y-3 z-10">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="clay-pill px-3 py-0.5 text-[10px] font-black text-emerald-300 bg-black/30 border border-emerald-400/30 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>BH13 GROUND FLOOR DISPATCH HUB</span>
                        </span>
                        <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm">
                            ⚡ 3-MIN ROOM DROP
                        </span>
                    </div>

                    <h1 class="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight max-w-lg">
                        Corridor Express Snacks, Iced Drinks & Study Munchies
                    </h1>
                    <p class="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-md leading-relaxed">
                        Order instant noodles, chilled Red Bull, crunchy chips and essentials delivered right to your hostel door in 3 minutes.
                    </p>
                </div>

                <div class="mt-6 flex items-center gap-3 z-10 flex-wrap">
                    <a href="#/categories" class="clay-btn bg-white hover:bg-white/95 text-emerald-900 font-black text-xs px-5 py-2.5 rounded-full transition-transform active:scale-95 inline-flex items-center gap-1.5 shadow-lg">
                        <span>Browse Catalog</span>
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                    <a href="#/flow-assist" class="clay-pill bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-full border border-white/25 transition-all inline-flex items-center gap-1.5 backdrop-blur-md active:scale-95">
                        <span class="material-symbols-outlined text-sm text-amber-300">auto_awesome</span>
                        <span>AI Munchies Assistant</span>
                    </a>
                </div>
            </div>

            <!-- Bento Tile 2: Midnight Cravings & Combos (4 Cols Desktop, 6 Mobile) -->
            <div class="bento-tile col-span-12 sm:col-span-6 lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden" style="background: radial-gradient(circle at 90% 10%, rgba(168, 85, 247, 0.25), transparent 70%), var(--glass-bg);">
                <div class="space-y-2">
                    <div class="clay-pill px-2.5 py-0.5 text-[9px] font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/25 inline-flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">dark_mode</span>
                        <span>MIDNIGHT FUEL</span>
                    </div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        Late Night Study & Gaming Combos
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Maggi + Cold Drink combos ready for your night grind.
                    </p>
                </div>
                <div class="pt-4">
                    <a href="#/categories" class="clay-btn text-purple-700 dark:text-purple-300 text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-1 active:scale-95 transition-transform shadow-xs">
                        <span>View Combos</span>
                        <span class="material-symbols-outlined text-xs">arrow_forward</span>
                    </a>
                </div>
            </div>

            <!-- Bento Tile 3: Flat ₹0 Delivery Fee Guarantee (6 Cols Desktop, 6 Mobile) -->
            <div class="bento-tile col-span-12 sm:col-span-6 lg:col-span-6 p-5 sm:p-6 flex items-center justify-between gap-4" style="background: radial-gradient(circle at 10% 50%, rgba(245, 158, 11, 0.18), transparent 70%), var(--glass-bg);">
                <div class="space-y-1">
                    <span class="liquid-badge text-[9px] font-black px-2 py-0.5">CAMPUS EXCLUSIVE</span>
                    <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        Zero Delivery Fees Forever
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        No convenience charges, no minimum order traps.
                    </p>
                </div>
                <div class="w-12 h-12 rounded-2xl clay-card text-amber-500 flex items-center justify-center shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
            </div>

            <!-- Bento Tile 4: Discreet Hostel Packaging (6 Cols Desktop, 12 Mobile) -->
            <div class="bento-tile col-span-12 lg:col-span-6 p-5 sm:p-6 flex items-center justify-between gap-4" style="background: radial-gradient(circle at 90% 50%, rgba(6, 182, 212, 0.18), transparent 70%), var(--glass-bg);">
                <div class="space-y-1">
                    <span class="clay-pill px-2.5 py-0.5 text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/25">100% PRIVATE</span>
                    <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        Discreet Tamper-Proof Bags
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        All hostel orders sealed in opaque bags for privacy.
                    </p>
                </div>
                <div class="w-12 h-12 rounded-2xl clay-card text-cyan-500 flex items-center justify-center shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-2xl">shield</span>
                </div>
            </div>
        </section>

        <!-- ============================================================
             3D TACTILE CATEGORY DECK (Visual Shelf Navigation)
             ============================================================ -->
        <section class="space-y-3 pt-2">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-emerald">grid_view</span>
                        <span>Shop by Category</span>
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant campus inventory</p>
                </div>
                <a href="#/categories" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                    <span>Full Hub</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>

            <!-- Horizontal Category Deck -->
            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1" id="home-category-filters">
                <button type="button" class="home-filter-btn category-deck-card active p-3 px-4 flex items-center gap-2.5 shrink-0" data-filter="all">
                    <span class="material-symbols-outlined text-lg">apps</span>
                    <span class="text-xs font-bold">All Items</span>
                </button>
                <button type="button" class="home-filter-btn category-deck-card p-3 px-4 flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-200" data-filter="biscuits">
                    <span class="material-symbols-outlined text-lg text-amber-500">cookie</span>
                    <span class="text-xs font-bold">Biscuits</span>
                </button>
                <button type="button" class="home-filter-btn category-deck-card p-3 px-4 flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-200" data-filter="snacks">
                    <span class="material-symbols-outlined text-lg text-orange-500">lunch_dining</span>
                    <span class="text-xs font-bold">Chips & Snacks</span>
                </button>
                <button type="button" class="home-filter-btn category-deck-card p-3 px-4 flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-200" data-filter="chocolates">
                    <span class="material-symbols-outlined text-lg text-pink-500">cake</span>
                    <span class="text-xs font-bold">Chocolates</span>
                </button>
                <button type="button" class="home-filter-btn category-deck-card p-3 px-4 flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-200" data-filter="instant">
                    <span class="material-symbols-outlined text-lg text-red-500">ramen_dining</span>
                    <span class="text-xs font-bold">Instant Meals</span>
                </button>
                <button type="button" class="home-filter-btn category-deck-card p-3 px-4 flex items-center gap-2.5 shrink-0 text-slate-700 dark:text-slate-200" data-filter="drinks">
                    <span class="material-symbols-outlined text-lg text-cyan-500">local_bar</span>
                    <span class="text-xs font-bold">Cold Drinks</span>
                </button>
            </div>
        </section>

        <!-- ============================================================
             MAIN CATALOG SHOWCASE (Floating Pedestal 3D Cards)
             ============================================================ -->
        <section class="space-y-3.5 pt-2">
            <div class="flex justify-between items-end">
                <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span>${sectionTitle}</span>
                        <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5">Live Stock</span>
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">3-minute corridor delivery directly to your room</p>
                </div>
            </div>

            <!-- In-Stock Product Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4" id="home-main-products-grid">
                ${inStockProductCards || `
                <div class="col-span-full py-12 text-center flex flex-col items-center justify-center glass-card rounded-3xl p-6">
                    <span class="material-symbols-outlined text-4xl text-emerald mb-2">storefront</span>
                    <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">Catalog Restocking</h3>
                    <p class="text-xs text-slate-500 mt-1 max-w-sm">Products are currently being refreshed. Please check back shortly!</p>
                </div>
                `}
            </div>
        </section>

        <!-- Past Items Shelf (Buy Again) -->
        ${buyAgainCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-emerald">replay</span>
                        <span>Buy Again</span>
                        ${isPersonalizedBuyAgain ? `<span class="liquid-badge text-[10px] font-bold px-2.5 py-0.5">Your Favorites</span>` : `<span class="clay-pill text-[10px] font-bold px-2 py-0.5">Popular</span>`}
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">1-tap re-add to cart</p>
                </div>
                <span class="text-xs text-slate-400 font-semibold">Swipe →</span>
            </div>
            <div class="flex overflow-x-auto gap-3 sm:gap-4 no-scrollbar pb-2 snap-x">${buyAgainCards}</div>
        </section>
        ` : ''}

        <!-- Category Shelf 1: Biscuits -->
        ${biscuitCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍪 Crunchy Biscuits & Cookies</span>
                </h2>
                <a class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${biscuitCards}</div>
        </section>
        ` : ''}

        <!-- Category Shelf 2: Chips & Snacks -->
        ${trendingSnackCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍿 Trending Munchies & Chips</span>
                </h2>
                <a class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${trendingSnackCards}</div>
        </section>
        ` : ''}

        <!-- Category Shelf 3: Chocolates -->
        ${chocolateCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍫 Chocolates & Sweet Treats</span>
                </h2>
                <a class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${chocolateCards}</div>
        </section>
        ` : ''}

        <!-- Category Shelf 4: Instant Meals -->
        ${instantFoodCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🍜 Instant Meals & Maggi</span>
                </h2>
                <a class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${instantFoodCards}</div>
        </section>
        ` : ''}

        <!-- Category Shelf 5: Cold Drinks -->
        ${drinkCards ? `
        <section class="space-y-3 pt-4">
            <div class="flex justify-between items-end">
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>🥤 Iced Drinks & Energy Fuel</span>
                </h2>
                <a class="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">${drinkCards}</div>
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
    // 1. Category Filter Switching
    const filterBtns = document.querySelectorAll('.home-filter-btn');
    const mainGrid = document.getElementById('home-main-products-grid');
    
    if (filterBtns && mainGrid) {
        filterBtns.forEach(btn => {
            btn.onclick = () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active', 'clay-btn-primary');
                    b.classList.add('clay-pill', 'text-slate-700', 'dark:text-slate-200');
                });
                btn.classList.add('active');
                btn.classList.remove('clay-pill', 'text-slate-700', 'dark:text-slate-200');

                const filter = btn.dataset.filter;
                const cards = mainGrid.querySelectorAll('.product-card-item');

                cards.forEach(card => {
                    const cardCat = card.dataset.category;
                    if (filter === 'all' || cardCat === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            };
        });
    }

    // 2. Global Address Selector Trigger
    document.querySelectorAll('.address-selector-trigger').forEach(trigger => {
        trigger.onclick = () => {
            if (typeof window.openAddressModal === 'function') {
                window.openAddressModal();
            }
        };
    });

    // 3. Search inputs handler with debounced instant lookup
    const searchInputs = [document.getElementById('desktop-search'), document.getElementById('mobile-search')].filter(Boolean);
    searchInputs.forEach(input => {
        input.oninput = (e) => {
            const query = e.target.value.trim().toLowerCase();
            const cards = document.querySelectorAll('#home-main-products-grid .product-card-item');
            cards.forEach(card => {
                const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
                if (!query || title.includes(query)) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            });
        };
    });

    // Keyboard shortcut '/' to focus search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            const searchInput = document.getElementById('desktop-search') || document.getElementById('mobile-search');
            if (searchInput) searchInput.focus();
        }
    });
};

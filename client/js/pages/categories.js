// Categories Page — Left Categories Column Rail with Blocked "Coming Soon" State & Active Snacks
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-24 flex flex-col">
    <!-- Top Sticky Search & Header -->
    <header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-2xl border-b border-glass-border shadow-sm">
        <div class="px-margin-mobile md:px-margin-desktop py-2.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
                <a href="#/" class="w-10 h-10 flex items-center justify-center hover:bg-surface-variant/60 active:scale-90 rounded-full transition-all shrink-0 cursor-pointer text-on-surface" aria-label="Back to Home" title="Back to Home">
                    <span class="material-symbols-outlined text-2xl">arrow_back</span>
                </a>
                <div class="min-w-0">
                    <h1 class="font-headline-md text-base sm:text-lg font-black text-on-surface truncate">
                        Campus Categories
                    </h1>
                    <!-- Clickable Delivery Location -->
                    <button type="button" class="address-selector-trigger flex items-center text-[11px] text-on-surface-variant hover:text-emerald transition-colors text-left truncate">
                        <span>Delivery to: <strong class="text-on-surface font-semibold">${address}</strong></span>
                        <span class="material-symbols-outlined text-[10px] ml-0.5 text-emerald">arrow_drop_down</span>
                    </button>
                </div>
            </div>

            <!-- Top Search Input -->
            <div class="relative flex-1 max-w-md hidden sm:block">
                <input class="w-full pl-9 pr-4 py-2 rounded-full border border-surface-variant bg-surface focus:outline-none focus:border-emerald text-xs shadow-inner" placeholder="Search snacks, drinks, chips, noodles..." type="text" id="desktop-cat-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-sm">search</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <!-- Theme Toggle Switch -->
                <button type="button" 
                        class="theme-toggle-switch relative inline-flex items-center w-[54px] sm:w-[60px] h-[28px] sm:h-[30px] rounded-full p-[2px] sm:p-[3px] transition-all duration-300 ease-in-out cursor-pointer select-none bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 shadow-inner hover:scale-105 active:scale-95 shrink-0" 
                        role="switch" 
                        aria-checked="false" 
                        aria-label="Toggle dark mode" 
                        title="Toggle Light / Dark Mode"
                        onclick="window.toggleTheme()">
                    <div class="theme-toggle-thumb absolute top-[2px] sm:top-[3px] left-[2px] sm:left-[3px] w-[22px] sm:w-[24px] h-[22px] sm:h-[24px] rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform duration-300 ease-in-out pointer-events-none border border-slate-200/60 dark:border-slate-700/60"></div>
                    <div class="relative w-full flex items-center justify-between px-1 z-10 pointer-events-none">
                        <span class="theme-sun-icon material-symbols-outlined text-[14px] sm:text-[15px] transition-colors duration-200 text-slate-800 dark:text-slate-400 font-bold">wb_sunny</span>
                        <span class="theme-moon-icon material-symbols-outlined text-[14px] sm:text-[15px] transition-colors duration-200 text-slate-400 dark:text-slate-100 font-bold">dark_mode</span>
                    </div>
                </button>

                <a href="#/cart" class="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-emerald hover:bg-surface-variant/40 active:scale-90 rounded-full transition-all relative shrink-0 cursor-pointer" title="Cart">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="mobile-header-cart-count" class="global-cart-count-badge absolute -top-0.5 -right-0.5 bg-emerald text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </a>
            </div>
        </div>

        <!-- Mobile Search Bar (Always Visible on Mobile) -->
        <div class="px-margin-mobile pb-2.5 sm:hidden">
            <div class="relative">
                <input class="w-full pl-9 pr-8 py-2 rounded-xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald text-xs shadow-inner" placeholder="Search snacks, drinks, maggi, chips..." type="text" id="mobile-cat-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-sm">search</span>
            </div>
        </div>
    </header>

    <!-- Main Dual-Pane Layout: Left Categories Column Rail + Right Products/Coming Soon Content -->
    <div class="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        <!-- Left Vertical Category Column Rail (Full list of all categories in a column) -->
        <aside class="w-[96px] sm:w-36 shrink-0 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-surface-variant/40 shadow-sm overflow-y-auto max-h-[calc(100vh-120px)] sticky top-[70px] py-3 no-scrollbar z-20" id="left-categories-rail">
            <div class="flex flex-col gap-2 items-center px-1.5" id="category-sidebar-list">
                
                <!-- 1. Snacks & Drinks (LIVE & ACTIVE) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn active-cat bg-emerald/10 dark:bg-emerald-950/40 border border-emerald/30 shadow-sm" data-category-id="snacks" data-status="live">
                    <div class="absolute left-0 top-2 bottom-2 w-1.5 bg-emerald rounded-r-full indicator-bar"></div>
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border-2 border-emerald shadow-md bg-emerald/10 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120" alt="Snacks & Drinks" class="w-full h-full object-cover rounded-xl">
                        <span class="absolute bottom-0 inset-x-0 bg-emerald text-white text-[8px] font-black text-center py-[1px] tracking-wider uppercase">Live ⚡</span>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-emerald dark:text-emerald-400 font-extrabold cat-label">Snacks & Drinks</span>
                </button>

                <!-- 2. Bakery & Biscuits (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="bakery" data-status="blocked" data-name="Bakery & Biscuits">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120" alt="Bakery & Biscuits" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Bakery & Biscuits</span>
                </button>

                <!-- 3. Grocery & Kitchen (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="grocery" data-status="blocked" data-name="Grocery & Kitchen">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=120" alt="Grocery & Kitchen" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Grocery & Kitchen</span>
                </button>

                <!-- 4. Beauty & Personal Care (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="beauty" data-status="blocked" data-name="Beauty & Personal Care">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120" alt="Beauty & Personal Care" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Beauty & Care</span>
                </button>

                <!-- 5. Stationery & Study (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="stationery" data-status="blocked" data-name="Stationery & Study">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=120" alt="Stationery" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Stationery</span>
                </button>

                <!-- 6. Electronics & Mobile Accessories (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="electronics" data-status="blocked" data-name="Electronics & Accessories">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120" alt="Electronics" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Electronics</span>
                </button>

                <!-- 7. Pharmacy & First Aid (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="pharmacy" data-status="blocked" data-name="Campus Pharmacy & Wellness">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120" alt="Pharmacy" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Pharmacy</span>
                </button>

                <!-- 8. Fashion & Apparel (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn opacity-85 hover:opacity-100 hover:bg-surface-variant/30 border border-transparent" data-category-id="fashion" data-status="blocked" data-name="Fashion & Essentials">
                    <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden p-1 border border-surface-variant/60 shadow-sm bg-surface-container-high relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=120" alt="Fashion" class="w-full h-full object-cover rounded-xl grayscale-[40%] group-hover:grayscale-0 transition-all">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                            <span class="text-[9px] font-black text-amber-300 bg-black/60 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Soon 🔒</span>
                        </div>
                    </div>
                    <span class="font-bold text-[11px] sm:text-xs mt-1.5 text-center leading-tight text-on-surface dark:text-slate-100 cat-label">Apparel</span>
                </button>
            </div>
        </aside>

        <!-- Right Content Pane -->
        <main class="flex-1 min-w-0 overflow-y-auto px-3 sm:px-6 py-4 pb-28">
            
            <!-- LIVE SNACKS & DRINKS VIEW (Default Active) -->
            <div id="live-snacks-container" class="space-y-4">
                
                <!-- Subcategory Horizontal Filter Chips -->
                <div class="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar" id="snacks-subcat-chips">
                    <!-- Injected dynamically in pageInit -->
                </div>

                <!-- Snacks Header & Filters Bar -->
                <div class="flex items-center justify-between gap-2 border-b border-surface-variant/30 pb-2.5">
                    <div class="flex items-center gap-2">
                        <h2 class="font-headline-md text-sm sm:text-base font-black text-on-surface" id="snacks-active-heading">All Snacks & Drinks</h2>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald/15 text-emerald" id="snacks-item-count">Loading...</span>
                    </div>

                    <!-- Sort & Veg Toggle Controls -->
                    <div class="flex items-center gap-2 shrink-0">
                        <!-- Veg Only Toggle -->
                        <button type="button" id="snacks-veg-toggle" class="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border border-surface-variant bg-surface hover:border-emerald transition-all cursor-pointer">
                            <span class="w-2.5 h-2.5 rounded-sm border border-emerald-600 flex items-center justify-center p-[1px]">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            </span>
                            <span class="text-on-surface-variant text-[10px]">Veg Only</span>
                        </button>

                        <!-- Sort dropdown -->
                        <select id="snacks-sort-select" class="text-[11px] font-medium bg-surface border border-surface-variant text-on-surface rounded-xl px-2 py-1 focus:outline-none focus:border-emerald cursor-pointer">
                            <option value="relevance">Sort: Popular</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                        </select>
                    </div>
                </div>

                <!-- Snacks Products Grid (Dual-column on mobile, up to 4 columns on desktop) -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" id="snacks-products-grid">
                    <!-- Loaded via client JS -->
                    <div class="col-span-full py-16 text-center text-on-surface-variant text-xs flex flex-col items-center gap-2">
                        <div class="w-8 h-8 rounded-full border-2 border-emerald border-t-transparent animate-spin"></div>
                        <p class="font-semibold">Loading fresh snacks & drinks...</p>
                    </div>
                </div>

            </div>

            <!-- BLOCKED CATEGORY SPLASH VIEW (Shows when clicking a coming soon category) -->
            <div id="blocked-category-splash" class="hidden py-12 sm:py-20 px-4 text-center max-w-md mx-auto space-y-5">
                <div class="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                    <span class="material-symbols-outlined text-4xl">lock_clock</span>
                </div>
                <div class="space-y-1.5">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Expansion in Progress
                    </span>
                    <h3 class="font-headline-md text-xl sm:text-2xl font-black text-on-surface" id="blocked-cat-title">Coming Soon</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto" id="blocked-cat-desc">
                        This category is undergoing vendor onboarding and quality cataloging. We currently deliver <b>Snacks & Drinks</b> within 3 mins to your campus room!
                    </p>
                </div>
                <button type="button" id="switch-to-snacks-btn" class="inline-flex items-center gap-2 bg-emerald hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-sm">fastfood</span>
                    Browse Live Snacks & Drinks
                </button>
            </div>

        </main>
    </div>

    <!-- Bottom Toast Alert for Blocked Categories -->
    <div id="coming-soon-toast" class="fixed top-20 left-1/2 -translate-x-1/2 bg-surface-container-lowest/95 backdrop-blur-xl border border-amber-500/40 text-on-surface px-4 py-2.5 rounded-full shadow-2xl z-50 text-xs font-semibold flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none -translate-y-4">
        <span class="material-symbols-outlined text-amber-500 text-sm">info</span>
        <span id="coming-soon-toast-text">Category is opening soon! Delivering Snacks & Drinks right now.</span>
    </div>

    <!-- BottomNavBar -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/85 dark:bg-[#0e1813]/85 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-90 duration-200 cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="font-label-sm text-[11px] mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-90 duration-200 cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2 bg-emerald text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-90 duration-200 cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.categories = async function() {
    const sidebarBtns = document.querySelectorAll('.cat-sidebar-btn');
    const liveSnacksContainer = document.getElementById('live-snacks-container');
    const blockedSplash = document.getElementById('blocked-category-splash');
    const blockedTitle = document.getElementById('blocked-cat-title');
    const blockedDesc = document.getElementById('blocked-cat-desc');
    const switchToSnacksBtn = document.getElementById('switch-to-snacks-btn');
    const subcatChipsContainer = document.getElementById('snacks-subcat-chips');
    const productsGrid = document.getElementById('snacks-products-grid');
    const activeHeading = document.getElementById('snacks-active-heading');
    const itemCountBadge = document.getElementById('snacks-item-count');
    const vegToggleBtn = document.getElementById('snacks-veg-toggle');
    const sortSelect = document.getElementById('snacks-sort-select');
    const desktopSearch = document.getElementById('desktop-cat-search');
    const mobileSearch = document.getElementById('mobile-cat-search');
    const toastEl = document.getElementById('coming-soon-toast');
    const toastText = document.getElementById('coming-soon-toast-text');

    let isVegOnly = false;
    let currentSort = 'relevance';
    let currentSubcategory = 'All';
    let allSnackProducts = [];

    // Snacks Subcategories List with Emojis
    const snackSubcats = [
        { id: 'All', name: '🔥 All Snacks' },
        { id: 'Potato Chips', name: '🥔 Chips & Crisps' },
        { id: 'Namkeen & Bhujia', name: '🥨 Namkeen' },
        { id: 'Chocolates', name: '🍫 Chocolates' },
        { id: 'Indian Sweets', name: '🍮 Sweets' },
        { id: 'Soft Drinks & Sodas', name: '🥤 Cold Drinks' },
        { id: 'Fruit Juices', name: '🧃 Juices' },
        { id: 'Coffee', name: '☕ Coffee' },
        { id: 'Tea', name: '🫖 Chai & Tea' },
        { id: 'Noodles & Pasta', name: '🍜 Maggi & Noodles' },
        { id: 'Cup Noodles', name: '🥣 Cup Noodles' },
        { id: 'Sweet Spreads', name: '🍫 Nutella & Spreads' },
        { id: 'Paan Corner', name: '🌿 Mints & Gum' },
        { id: 'Ice Cream Tubs', name: '🍨 Ice Cream' },
        { id: 'Cookies', name: '🍪 Biscuits' }
    ];

    // Show Coming Soon Toast Helper
    function showComingSoonToast(msg) {
        if (!toastEl || !toastText) return;
        toastText.textContent = msg;
        toastEl.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
        toastEl.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            toastEl.classList.remove('opacity-100', 'translate-y-0');
            toastEl.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
        }, 3000);
    }

    // Left Sidebar Click Handler
    sidebarBtns.forEach(btn => {
        btn.onclick = () => {
            const status = btn.dataset.status;
            const catName = btn.dataset.name || 'Category';

            sidebarBtns.forEach(b => {
                b.classList.remove('active-cat', 'bg-emerald/10', 'dark:bg-emerald-950/40', 'border-emerald/30', 'shadow-sm');
                b.classList.add('border-transparent');
                const bar = b.querySelector('.indicator-bar');
                if (bar) bar.remove();
                const label = b.querySelector('.cat-label');
                if (label) {
                    label.classList.remove('text-emerald', 'dark:text-emerald-400', 'font-extrabold');
                    label.classList.add('text-on-surface', 'dark:text-slate-100', 'font-bold');
                }
            });

            btn.classList.add('active-cat', 'bg-emerald/10', 'dark:bg-emerald-950/40', 'border-emerald/30', 'shadow-sm');
            btn.classList.remove('border-transparent');
            
            // Add left indicator
            const bar = document.createElement('div');
            bar.className = 'absolute left-0 top-2 bottom-2 w-1.5 bg-emerald rounded-r-full indicator-bar';
            btn.prepend(bar);

            const label = btn.querySelector('.cat-label');
            if (label) {
                label.classList.add('text-emerald', 'dark:text-emerald-400', 'font-extrabold');
                label.classList.remove('text-on-surface', 'dark:text-slate-100');
            }

            if (status === 'blocked') {
                // Show Blocked Splash
                liveSnacksContainer.classList.add('hidden');
                blockedSplash.classList.remove('hidden');
                if (blockedTitle) blockedTitle.textContent = `${catName} — Coming Soon`;
                if (blockedDesc) blockedDesc.textContent = `${catName} is being prepared for upcoming delivery expansion. All Snacks & Drinks are currently 100% live!`;
                showComingSoonToast(`${catName} is opening soon! Delivering Snacks & Drinks right now.`);
            } else {
                // Show Live Snacks
                blockedSplash.classList.add('hidden');
                liveSnacksContainer.classList.remove('hidden');
            }
        };
    });

    // Switch back to Snacks button
    switchToSnacksBtn?.addEventListener('click', () => {
        const snacksBtn = document.querySelector('.cat-sidebar-btn[data-category-id="snacks"]');
        if (snacksBtn) snacksBtn.click();
    });

    // Load Live Snacks & Drinks Products
    async function loadSnacksData() {
        try {
            // Single consolidated cached fetch for all active campus products
            const res = await window.api.fetchProducts();
            const all = res?.products || [];

            // Filter for snacks & drinks categories/tags
            allSnackProducts = all.filter(p => {
                const cat = (p.category || '').toLowerCase();
                const tags = (p.tags || '').toLowerCase();
                return cat.includes('snack') || cat.includes('beverage') || cat.includes('drink') || 
                       cat.includes('biscuit') || cat.includes('instant') || cat.includes('sweet') ||
                       tags.includes('snack') || tags.includes('chip') || tags.includes('drink') ||
                       tags.includes('noodle') || tags.includes('chocolate') || tags.includes('biscuit');
            });

            // Fallback if empty
            if (allSnackProducts.length === 0) {
                allSnackProducts = all;
            }

            renderSubcatChips();
            filterAndRenderProducts();
        } catch(e) {
            console.error('Failed to load snacks:', e);
        }
    }

    function renderSubcatChips() {
        if (!subcatChipsContainer) return;
        subcatChipsContainer.innerHTML = snackSubcats.map((sc, idx) => `
            <button type="button" class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all subcat-chip cursor-pointer ${sc.id === currentSubcategory ? 'bg-emerald text-white shadow-sm' : 'bg-surface-container-high text-on-surface hover:bg-emerald/10'}" data-subcat-id="${sc.id}">
                ${sc.name}
            </button>
        `).join('');

        subcatChipsContainer.querySelectorAll('.subcat-chip').forEach(chip => {
            chip.onclick = () => {
                currentSubcategory = chip.dataset.subcatId;
                renderSubcatChips();
                filterAndRenderProducts();
            };
        });
    }

    function filterAndRenderProducts() {
        if (!productsGrid) return;

        let filtered = allSnackProducts;

        // Subcategory filter
        if (currentSubcategory !== 'All') {
            filtered = filtered.filter(p => p.subcategory === currentSubcategory || p.tags?.includes(currentSubcategory.toLowerCase()));
        }

        // Veg filter
        if (isVegOnly) {
            filtered = filtered.filter(p => p.is_veg === 1);
        }

        // Search filter
        const q = (desktopSearch?.value || mobileSearch?.value || '').trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.tags && p.tags.toLowerCase().includes(q)));
        }

        // Sort filter
        if (currentSort === 'price_asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price_desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'discount') {
            filtered.sort((a, b) => ((b.mrp || b.price) - b.price) - ((a.mrp || a.price) - a.price));
        } else if (currentSort === 'rating') {
            filtered.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
        }

        if (activeHeading) activeHeading.textContent = q ? `Search: "${q}"` : (currentSubcategory === 'All' ? 'All Snacks & Drinks' : currentSubcategory);
        if (itemCountBadge) itemCountBadge.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant/60">inventory_2</span>
                    <p class="text-xs font-semibold text-on-surface-variant mt-2">No snacks matching your filter</p>
                </div>
            `;
            return;
        }

        // Render Cards matching screenshot
        productsGrid.innerHTML = filtered.map((p, idx) => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const ratingVal = p.rating || 4.8;
            const reviewCount = p.review_count || '1.2 lac';
            const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
            const isLowStock = stockLeft > 0 && stockLeft <= 4;
            const isOutOfStock = !p.in_stock || stockLeft === 0;

            return `
                <div class="bg-surface rounded-2xl overflow-hidden border border-surface-variant/40 shadow-sm hover:shadow-md transition-all p-2.5 flex flex-col justify-between group product-card-container product-detail-trigger cursor-pointer ${isOutOfStock ? 'opacity-85' : ''}" data-product-id="${p.id}" data-out-of-stock="${isOutOfStock}">
                    <div>
                        <div class="relative bg-surface-container-high rounded-xl overflow-hidden h-36 flex items-center justify-center p-2">
                            <!-- Stock / Urgency Badge -->
                            ${isLowStock ? `
                            <div class="absolute top-2 left-2 z-10 stock-badge bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5" data-id="${p.id}">
                                <span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">bolt</span> Only ${stockLeft} left!
                            </div>
                            ` : (isOutOfStock ? `
                            <div class="absolute top-2 left-2 z-10 stock-badge bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm" data-id="${p.id}">
                                Out of Stock
                            </div>
                            ` : '')}

                            <!-- Wishlist Heart Button -->
                            <button type="button" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/70 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-rose-500 hover:bg-surface transition-all z-10 wishlist-btn" data-id="${p.id}">
                                <span class="material-symbols-outlined text-base">favorite_border</span>
                            </button>

                            <!-- Veg / Non-Veg Icon -->
                            <div class="absolute bottom-2 right-2 z-10 bg-surface/80 backdrop-blur-md p-0.5 rounded shadow-sm">
                                <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-red-600'} rounded-sm flex items-center justify-center p-[1px]">
                                    <span class="w-2 h-2 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-red-600'}"></span>
                                </span>
                            </div>

                            <!-- Product Image -->
                            <img class="object-contain w-full h-full group-hover:scale-105 transition-transform duration-200" 
                                 src="${p.image_url}" 
                                 alt="${p.name}" 
                                 width="160" 
                                 height="160" 
                                 ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} 
                                 decoding="async" 
                                 onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&q=75'">

                            <!-- Image Carousel Dots -->
                            <div class="absolute bottom-2 left-3 flex items-center gap-1 opacity-70">
                                <span class="w-1.5 h-1.5 rounded-full bg-on-surface"></span>
                                <span class="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                                <span class="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                            </div>
                        </div>

                        <!-- Pack Size / Weight + ADD Button Row -->
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-xs font-bold text-on-surface">${p.size || p.unit}</span>
                            <div class="product-action-slot" data-id="${p.id}" data-out-of-stock="${isOutOfStock}" data-stock-left="${stockLeft}">
                                ${isOutOfStock ? `
                                <span class="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 cursor-not-allowed select-none">
                                    Out of Stock
                                </span>
                                ` : `
                                <button type="button" class="add-to-cart-btn bg-emerald-950/20 dark:bg-emerald-950/40 border border-emerald-600 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-3.5 py-1 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white active:scale-95 transition-all tracking-wider uppercase" data-id="${p.id}" data-stock-left="${stockLeft}">
                                    ADD
                                </button>
                                `}
                            </div>
                        </div>

                        <!-- Pricing & Discount Row -->
                        <div class="mt-1.5">
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-sm font-extrabold text-on-surface">₹${p.price}</span>
                                ${p.mrp && p.mrp > p.price ? `<span class="text-[11px] text-on-surface-variant line-through">₹${p.mrp}</span>` : ''}
                            </div>
                            ${discountPercent > 0 ? `
                                <p class="text-[10px] font-bold text-sky-600 dark:text-sky-400 leading-tight">
                                    ${discountPercent}% OFF on MRP
                                </p>
                            ` : ''}
                        </div>

                        <!-- Product Title -->
                        <h3 class="font-bold text-xs text-on-surface mt-1 line-clamp-2 leading-snug">
                            ${p.name}
                        </h3>
                    </div>

                    <!-- Bottom Rating, ETA & Stock Info -->
                    <div class="mt-2 pt-1.5 border-t border-surface-variant/30 flex flex-col gap-0.5">
                        <div class="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                            <span class="material-symbols-outlined text-xs text-amber-500" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="font-bold text-on-surface">${ratingVal}</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-on-surface-variant mt-0.5">
                            <span class="flex items-center gap-0.5 text-emerald font-semibold">
                                <span class="material-symbols-outlined text-[11px]">bolt</span> 3 mins
                            </span>
                            ${isLowStock ? `
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded" data-id="${p.id}">
                                    ⚡ Only ${stockLeft} left
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        window.syncCardSteppers();
    }

    // Veg Only Handler
    vegToggleBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegToggleBtn.classList.add('bg-emerald/15', 'border-emerald', 'text-emerald');
        } else {
            vegToggleBtn.classList.remove('bg-emerald/15', 'border-emerald', 'text-emerald');
        }
        filterAndRenderProducts();
    });

    // Sort Handler
    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
    });

    // Search Handlers
    let searchTimer;
    [desktopSearch, mobileSearch].forEach(inp => {
        inp?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                filterAndRenderProducts();
            }, 150);
        });
    });

    // Initial load
    await loadSnacksData();
};

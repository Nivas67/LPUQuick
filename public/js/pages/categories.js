// Categories Page — Classical Campus Quick-Commerce Category Explorer
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    return `
<div class="bg-background text-on-background min-h-screen pb-24 flex flex-col">
    <!-- Top Sticky Search & Header (Frosted Liquid Glass) -->
    <header class="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/70 dark:border-white/10 shadow-sm">
        <div class="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
            <div class="flex items-center gap-2 min-w-0">
                <a href="#/" class="w-9 h-9 flex items-center justify-center hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors shrink-0 text-slate-700 dark:text-slate-200" aria-label="Back to Home" title="Back to Home">
                    <span class="material-symbols-outlined text-xl">arrow_back</span>
                </a>
                <div class="min-w-0">
                    <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate leading-tight">
                        Campus Categories
                    </h1>
                    <!-- Clickable Delivery Location -->
                    <button type="button" class="address-selector-trigger flex items-center text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald transition-colors text-left truncate">
                        <span>Delivery to: <strong class="text-slate-800 dark:text-slate-200 font-semibold">${address}</strong></span>
                        <span class="material-symbols-outlined text-[14px] text-emerald ml-0.5">expand_more</span>
                    </button>
                </div>
            </div>

            <!-- Top Search Input -->
            <div class="relative flex-1 max-w-md hidden sm:block">
                <input class="w-full pl-9 pr-4 py-2 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald text-xs text-slate-800 dark:text-slate-200 transition-colors shadow-xs" placeholder="Search snacks, drinks, chips, noodles..." type="text" id="desktop-cat-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-sm">search</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
                <!-- Theme Toggle Switch -->
                <button type="button" 
                        class="theme-toggle-switch relative inline-flex items-center w-[52px] sm:w-[56px] h-[26px] sm:h-[28px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer select-none bg-slate-200/80 dark:bg-slate-800/80 border border-white/70 dark:border-white/10 shrink-0 shadow-xs" 
                        role="switch" 
                        aria-checked="false" 
                        aria-label="Toggle dark mode" 
                        title="Toggle Light / Dark Mode"
                        onclick="window.toggleTheme()">
                    <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[20px] sm:w-[22px] h-[20px] sm:h-[22px] rounded-full bg-white dark:bg-slate-900 shadow-sm transition-transform duration-200 pointer-events-none border border-slate-200 dark:border-slate-700"></div>
                    <div class="relative w-full flex items-center justify-between px-1 z-10 pointer-events-none">
                        <span class="theme-sun-icon material-symbols-outlined text-[13px] text-amber-500 font-bold">wb_sunny</span>
                        <span class="theme-moon-icon material-symbols-outlined text-[13px] text-slate-400 dark:text-sky-300 font-bold">dark_mode</span>
                    </div>
                </button>

                <a href="#/cart" class="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors relative shrink-0" title="Cart">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="mobile-header-cart-count" class="global-cart-count-badge absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </a>
            </div>
        </div>

        <!-- Mobile Search Bar -->
        <div class="px-3 pb-2.5 sm:hidden">
            <div class="relative">
                <input class="w-full pl-9 pr-8 py-2 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald text-xs text-slate-800 dark:text-slate-200 shadow-xs" placeholder="Search snacks, drinks, maggi, chips..." type="text" id="mobile-cat-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-sm">search</span>
            </div>
        </div>
    </header>

    <!-- Main Dual-Pane Layout: Left Categories Rail + Right Products/Coming Soon Content -->
    <div class="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        <!-- Left Vertical Category Column Rail -->
        <aside class="w-[88px] sm:w-38 shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-white/70 dark:border-white/10 overflow-y-auto max-h-[calc(100vh-120px)] sticky top-[60px] py-2 no-scrollbar z-20" id="left-categories-rail">
            <div class="flex flex-col gap-1.5 px-2" id="category-sidebar-list">
                
                <!-- 1. Snacks & Drinks (LIVE & ACTIVE) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn active-cat bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/40 shadow-xs" data-category-id="snacks" data-status="live">
                    <div class="absolute left-0 top-2 bottom-2 w-1 bg-emerald rounded-r indicator-bar"></div>
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-emerald-300/50 dark:border-emerald-600/50 bg-white/90 dark:bg-slate-800 relative shrink-0 shadow-xs">
                        <img src="https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120" alt="Snacks & Drinks" class="w-full h-full object-cover rounded-lg">
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-bold cat-label">Snacks & Drinks</span>
                </button>

                <!-- 2. Bakery & Biscuits (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="bakery" data-status="blocked" data-name="Bakery & Biscuits">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120" alt="Bakery & Biscuits" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Bakery & Biscuits</span>
                </button>

                <!-- 3. Grocery & Kitchen (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="grocery" data-status="blocked" data-name="Grocery & Kitchen">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=120" alt="Grocery & Kitchen" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Grocery & Kitchen</span>
                </button>

                <!-- 4. Beauty & Personal Care (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="beauty" data-status="blocked" data-name="Beauty & Personal Care">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120" alt="Beauty & Personal Care" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Beauty & Care</span>
                </button>

                <!-- 5. Stationery & Study (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="stationery" data-status="blocked" data-name="Stationery & Study">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=120" alt="Stationery" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Stationery</span>
                </button>

                <!-- 6. Electronics & Accessories (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="electronics" data-status="blocked" data-name="Electronics & Accessories">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120" alt="Electronics" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Electronics</span>
                </button>

                <!-- 7. Pharmacy (Coming Soon) -->
                <button type="button" class="w-full flex flex-col items-center py-2 px-1 rounded-2xl relative transition-all group cursor-pointer cat-sidebar-btn text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent" data-category-id="pharmacy" data-status="blocked" data-name="Campus Pharmacy & Wellness">
                    <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden p-1 border border-white/60 dark:border-white/10 bg-white/60 dark:bg-slate-800 relative shrink-0">
                        <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120" alt="Pharmacy" class="w-full h-full object-cover rounded-lg opacity-70 group-hover:opacity-100 transition-opacity">
                        <span class="absolute top-0.5 right-0.5 bg-slate-800/80 text-white text-[8px] px-1 rounded font-medium">Soon</span>
                    </div>
                    <span class="text-[11px] sm:text-xs mt-1.5 text-center leading-tight font-medium cat-label">Pharmacy</span>
                </button>
            </div>
        </aside>

        <!-- Right Content Pane -->
        <main class="flex-1 min-w-0 overflow-y-auto px-3 sm:px-6 py-4 pb-28">
            
            <!-- LIVE SNACKS & DRINKS VIEW (Default Active) -->
            <div id="live-snacks-container" class="space-y-4">
                
                <!-- Subcategory Horizontal Filter Chips -->
                <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" id="snacks-subcat-chips">
                    <!-- Injected dynamically in pageInit -->
                </div>

                <!-- Snacks Header & Filters Bar -->
                <div class="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div class="flex items-center gap-2">
                        <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white" id="snacks-active-heading">All Snacks & Drinks</h2>
                        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50" id="snacks-item-count">Loading...</span>
                    </div>

                    <!-- Sort & Veg Toggle Controls -->
                    <div class="flex items-center gap-2 shrink-0">
                        <!-- Veg Only Toggle -->
                        <button type="button" id="snacks-veg-toggle" class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald transition-colors cursor-pointer">
                            <span class="w-3 h-3 rounded-xs border border-emerald-600 flex items-center justify-center p-[1px]">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            </span>
                            <span class="text-[11px]">Veg Only</span>
                        </button>

                        <!-- Sort dropdown -->
                        <select id="snacks-sort-select" class="text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald cursor-pointer">
                            <option value="relevance">Sort: Popular</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="name">Name: A to Z</option>
                        </select>
                    </div>
                </div>

                <!-- Snacks Products Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3" id="snacks-products-grid">
                    <div class="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <div class="w-6 h-6 rounded-full border-2 border-emerald border-t-transparent animate-spin"></div>
                        <p class="font-medium">Loading products...</p>
                    </div>
                </div>

            </div>

            <!-- BLOCKED CATEGORY SPLASH VIEW -->
            <div id="blocked-category-splash" class="hidden py-16 px-4 text-center max-w-md mx-auto space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                    <span class="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <div class="space-y-1.5">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                        Coming Soon to LPU
                    </span>
                    <h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white" id="blocked-cat-title">Coming Soon</h3>
                    <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto" id="blocked-cat-desc">
                        We are currently onboarding top campus vendors for this category. In the meantime, order from our full range of Snacks & Drinks with 3-minute delivery to your hostel!
                    </p>
                </div>
                <div>
                    <button type="button" id="switch-to-snacks-btn" class="inline-flex items-center gap-1.5 bg-emerald text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-xs cursor-pointer">
                        <span class="material-symbols-outlined text-sm">fastfood</span>
                        Browse Live Snacks & Drinks
                    </button>
                </div>
            </div>

        </main>
    </div>

    <!-- Bottom Toast Alert for Blocked Categories -->
    <div id="coming-soon-toast" class="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg z-50 text-xs font-medium flex items-center gap-2 transition-all duration-200 opacity-0 pointer-events-none -translate-y-2">
        <span class="material-symbols-outlined text-amber-400 text-sm">info</span>
        <span id="coming-soon-toast-text">Category opening soon! Delivering Snacks & Drinks right now.</span>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-xs sm:hidden">
        <nav class="flex justify-around items-center h-14 max-w-md mx-auto px-2">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-medium mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3 py-1 cursor-pointer font-bold" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="text-[10px] mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-medium mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-medium mt-0.5">Orders</span>
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

    // Snacks Subcategories
    const snackSubcats = [
        { id: 'All', name: 'All Snacks' },
        { id: 'Potato Chips', name: 'Chips & Crisps' },
        { id: 'Namkeen & Bhujia', name: 'Namkeen' },
        { id: 'Chocolates', name: 'Chocolates' },
        { id: 'Indian Sweets', name: 'Sweets' },
        { id: 'Soft Drinks & Sodas', name: 'Cold Drinks' },
        { id: 'Fruit Juices', name: 'Juices' },
        { id: 'Coffee', name: 'Coffee' },
        { id: 'Tea', name: 'Chai & Tea' },
        { id: 'Noodles & Pasta', name: 'Maggi & Noodles' },
        { id: 'Cup Noodles', name: 'Cup Noodles' },
        { id: 'Cookies', name: 'Biscuits' }
    ];

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

    // Left Sidebar Click Handler
    sidebarBtns.forEach(btn => {
        btn.onclick = () => {
            const status = btn.dataset.status;
            const catName = btn.dataset.name || 'Category';

            sidebarBtns.forEach(b => {
                b.classList.remove('active-cat', 'bg-emerald-50', 'dark:bg-emerald-950/30', 'text-emerald-700', 'dark:text-emerald-400', 'font-bold', 'border-emerald-200/60', 'dark:border-emerald-800/40');
                b.classList.add('border-transparent', 'text-slate-600', 'dark:text-slate-400');
                const bar = b.querySelector('.indicator-bar');
                if (bar) bar.remove();
            });

            btn.classList.add('active-cat', 'bg-emerald-50', 'dark:bg-emerald-950/30', 'text-emerald-700', 'dark:text-emerald-400', 'font-bold', 'border-emerald-200/60', 'dark:border-emerald-800/40');
            btn.classList.remove('border-transparent', 'text-slate-600', 'dark:text-slate-400');
            
            const bar = document.createElement('div');
            bar.className = 'absolute left-0 top-2 bottom-2 w-1 bg-emerald rounded-r indicator-bar';
            btn.prepend(bar);

            if (status === 'blocked') {
                liveSnacksContainer.classList.add('hidden');
                blockedSplash.classList.remove('hidden');
                if (blockedTitle) blockedTitle.textContent = `${catName} — Coming Soon`;
                if (blockedDesc) blockedDesc.textContent = `${catName} is being cataloged for delivery. All Snacks & Drinks are currently 100% live!`;
                showComingSoonToast(`${catName} is opening soon! Delivering Snacks & Drinks right now.`);
            } else {
                blockedSplash.classList.add('hidden');
                liveSnacksContainer.classList.remove('hidden');
            }
        };
    });

    switchToSnacksBtn?.addEventListener('click', () => {
        const snacksBtn = document.querySelector('.cat-sidebar-btn[data-category-id="snacks"]');
        if (snacksBtn) snacksBtn.click();
    });

    async function loadSnacksData() {
        try {
            const res = await window.api.fetchProducts();
            const all = res?.products || [];

            allSnackProducts = all.filter(p => {
                const cat = (p.category || '').toLowerCase();
                const tags = (p.tags || '').toLowerCase();
                return cat.includes('snack') || cat.includes('beverage') || cat.includes('drink') || 
                       cat.includes('biscuit') || cat.includes('instant') || cat.includes('sweet') ||
                       tags.includes('snack') || tags.includes('chip') || tags.includes('drink') ||
                       tags.includes('noodle') || tags.includes('chocolate') || tags.includes('biscuit');
            });

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
        subcatChipsContainer.innerHTML = snackSubcats.map((sc) => `
            <button type="button" class="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all subcat-chip cursor-pointer ${sc.id === currentSubcategory ? 'clay-btn-primary text-white shadow-md' : 'clay-pill text-slate-700 dark:text-slate-200 hover:text-emerald'}" data-subcat-id="${sc.id}">
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

        let filtered = [...allSnackProducts];

        if (currentSubcategory !== 'All') {
            filtered = filtered.filter(p => p.subcategory === currentSubcategory || p.tags?.includes(currentSubcategory.toLowerCase()));
        }

        if (isVegOnly) {
            filtered = filtered.filter(p => p.is_veg === 1);
        }

        const q = (desktopSearch?.value || mobileSearch?.value || '').trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.tags && p.tags.toLowerCase().includes(q)));
        }

        if (currentSort === 'price_asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price_desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (activeHeading) activeHeading.textContent = q ? `Search: "${q}"` : (currentSubcategory === 'All' ? 'All Snacks & Drinks' : currentSubcategory);
        if (itemCountBadge) itemCountBadge.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full py-16 text-center glass-card rounded-3xl p-6">
                    <span class="material-symbols-outlined text-4xl text-slate-400">inventory_2</span>
                    <p class="text-xs font-semibold text-slate-500 mt-2">No items found matching your selection</p>
                </div>
            `;
            return;
        }

        // Render Frosted Glass & Claymorphic Product Cards
        productsGrid.innerHTML = filtered.map((p, idx) => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
            const isLowStock = stockLeft > 0 && stockLeft <= 4;
            const isOutOfStock = !p.in_stock || stockLeft === 0;

            return `
                <div class="product-card-item product-detail-trigger p-3 flex flex-col justify-between cursor-pointer group ${isOutOfStock ? 'opacity-85' : ''}" data-product-id="${p.id}" data-out-of-stock="${isOutOfStock}">
                    <div>
                        <!-- Claymorphic Image Well -->
                        <div class="h-32 sm:h-36 bg-gradient-to-b from-white/90 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl relative overflow-hidden flex items-center justify-center p-2 mb-2.5 border border-white/80 dark:border-white/10 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(0,0,0,0.04)]">
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
                                 ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} 
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
                </div>
            `;
        }).join('');

        window.syncCardSteppers();
    }

    vegToggleBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegToggleBtn.classList.add('border-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/30', 'text-emerald-700', 'dark:text-emerald-400');
        } else {
            vegToggleBtn.classList.remove('border-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-950/30', 'text-emerald-700', 'dark:text-emerald-400');
        }
        filterAndRenderProducts();
    });

    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
    });

    let searchTimer;
    [desktopSearch, mobileSearch].forEach(inp => {
        inp?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                filterAndRenderProducts();
            }, 150);
        });
    });

    await loadSnacksData();
};

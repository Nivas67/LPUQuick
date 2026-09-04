// Categories Page — Next-Gen Interactive Category Hub & Catalog Explorer
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    return `
<div class="bg-background text-on-background min-h-screen pb-28 flex flex-col">
    <!-- Floating Dynamic Island Header (Frosted Glass Capsule) -->
    <header class="dynamic-island-nav flex items-center justify-between gap-3 sm:gap-4 select-none">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95 shrink-0" aria-label="Back to Home" title="Back to Home">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
            </a>
            <div class="min-w-0">
                <h1 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                    Campus Categories
                </h1>
                <button type="button" class="address-selector-trigger flex items-center text-[10px] text-slate-500 dark:text-slate-400 hover:text-emerald transition-colors text-left truncate">
                    <span>Deliver to: <strong class="text-slate-800 dark:text-slate-200 font-bold">${address}</strong></span>
                    <span class="material-symbols-outlined text-[13px] text-emerald ml-0.5">expand_more</span>
                </button>
            </div>
        </div>

        <!-- Search Input (Desktop) -->
        <div class="relative flex-1 max-w-md hidden sm:block mx-2">
            <input class="w-full pl-9 pr-4 py-1.5 rounded-full border border-[var(--glass-border)] bg-slate-100/60 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all" 
                   placeholder="Search snacks, drinks, chips, noodles..." 
                   type="text" 
                   id="desktop-cat-search" 
                   autocomplete="off">
            <span class="material-symbols-outlined absolute left-2.5 top-2 text-slate-400 text-sm">search</span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
            <!-- Theme Toggle Switch -->
            <button type="button" 
                    class="theme-toggle-switch relative inline-flex items-center w-[48px] h-[26px] rounded-full p-[2px] transition-all cursor-pointer select-none clay-pill shrink-0 shadow-xs" 
                    role="switch" 
                    aria-checked="false" 
                    title="Toggle Light / Dark Mode"
                    onclick="window.toggleTheme()">
                <div class="theme-toggle-thumb absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform pointer-events-none"></div>
                <div class="relative w-full flex items-center justify-between px-1.5 z-10 pointer-events-none">
                    <span class="theme-sun-icon material-symbols-outlined text-[11px] text-amber-500 font-bold">wb_sunny</span>
                    <span class="theme-moon-icon material-symbols-outlined text-[11px] text-slate-400 dark:text-sky-300 font-bold">dark_mode</span>
                </div>
            </button>

            <!-- Cart Shortcut -->
            <a href="#/cart" class="clay-pill w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-emerald transition-transform active:scale-95 relative shrink-0" title="Cart">
                <span class="material-symbols-outlined text-base">shopping_cart</span>
                <span id="mobile-header-cart-count" class="global-cart-count-badge absolute -top-1 -right-1 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs hidden border border-white dark:border-slate-900">0</span>
            </a>
        </div>
    </header>

    <!-- Mobile Search Bar -->
    <div class="px-4 pt-3 pb-1 sm:hidden max-w-md mx-auto w-full">
        <div class="relative">
            <input class="w-full pl-9 pr-8 py-2 rounded-2xl border border-[var(--glass-border)] bg-slate-100/70 dark:bg-slate-800/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs text-slate-800 dark:text-slate-200 shadow-xs font-medium" 
                   placeholder="Search snacks, drinks, maggi, chips..." 
                   type="text" 
                   id="mobile-cat-search" 
                   autocomplete="off">
            <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-sm">search</span>
        </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-4 space-y-5">
        <!-- Interactive Category Hub Header & Deck -->
        <section class="space-y-3">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-emerald">category</span>
                        <span>Explore Campus Shelves</span>
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Select a category to view live items or upcoming expansions</p>
                </div>
            </div>

            <!-- Horizontal Visual Category Cards Deck -->
            <div class="flex items-center gap-3 overflow-x-auto no-scrollbar py-1" id="category-sidebar-list">
                <!-- 1. Snacks & Drinks (LIVE & ACTIVE) -->
                <button type="button" class="category-deck-card active p-3 px-4 flex items-center gap-3 shrink-0 cat-sidebar-btn active-cat" data-category-id="snacks" data-status="live">
                    <div class="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-white/20 shrink-0 shadow-xs">
                        <img src="https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120" alt="Snacks & Drinks" class="w-full h-full object-cover rounded-lg">
                    </div>
                    <div class="text-left">
                        <span class="text-xs font-black block leading-none">Snacks & Drinks</span>
                        <span class="text-[9px] text-emerald-200 font-bold uppercase tracking-wider mt-1 block">Live 3m Delivery</span>
                    </div>
                </button>

                <!-- 2. Bakery & Biscuits (Coming Soon) -->
                <button type="button" class="category-deck-card p-3 px-4 flex items-center gap-3 shrink-0 cat-sidebar-btn text-slate-700 dark:text-slate-300" data-category-id="bakery" data-status="blocked" data-name="Bakery & Biscuits">
                    <div class="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120" alt="Bakery & Biscuits" class="w-full h-full object-cover rounded-lg opacity-80">
                    </div>
                    <div class="text-left">
                        <span class="text-xs font-bold block leading-none">Bakery & Biscuits</span>
                        <span class="text-[9px] text-slate-400 font-medium mt-1 block">Opening Next</span>
                    </div>
                </button>

                <!-- 3. Grocery & Kitchen (Coming Soon) -->
                <button type="button" class="category-deck-card p-3 px-4 flex items-center gap-3 shrink-0 cat-sidebar-btn text-slate-700 dark:text-slate-300" data-category-id="grocery" data-status="blocked" data-name="Grocery & Kitchen">
                    <div class="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=120" alt="Grocery & Kitchen" class="w-full h-full object-cover rounded-lg opacity-80">
                    </div>
                    <div class="text-left">
                        <span class="text-xs font-bold block leading-none">Grocery & Kitchen</span>
                        <span class="text-[9px] text-slate-400 font-medium mt-1 block">Opening Soon</span>
                    </div>
                </button>

                <!-- 4. Beauty & Care (Coming Soon) -->
                <button type="button" class="category-deck-card p-3 px-4 flex items-center gap-3 shrink-0 cat-sidebar-btn text-slate-700 dark:text-slate-300" data-category-id="beauty" data-status="blocked" data-name="Beauty & Personal Care">
                    <div class="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120" alt="Beauty & Personal Care" class="w-full h-full object-cover rounded-lg opacity-80">
                    </div>
                    <div class="text-left">
                        <span class="text-xs font-bold block leading-none">Beauty & Care</span>
                        <span class="text-[9px] text-slate-400 font-medium mt-1 block">Opening Soon</span>
                    </div>
                </button>

                <!-- 5. Stationery (Coming Soon) -->
                <button type="button" class="category-deck-card p-3 px-4 flex items-center gap-3 shrink-0 cat-sidebar-btn text-slate-700 dark:text-slate-300" data-category-id="stationery" data-status="blocked" data-name="Stationery & Study">
                    <div class="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                        <img src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=120" alt="Stationery" class="w-full h-full object-cover rounded-lg opacity-80">
                    </div>
                    <div class="text-left">
                        <span class="text-xs font-bold block leading-none">Stationery & Notes</span>
                        <span class="text-[9px] text-slate-400 font-medium mt-1 block">Opening Soon</span>
                    </div>
                </button>
            </div>
        </section>

        <!-- LIVE SNACKS & DRINKS VIEW -->
        <main id="live-snacks-container" class="space-y-4">
            <!-- Subcategory Horizontal Filter Chips -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1" id="snacks-subcat-chips">
                <!-- Injected dynamically in pageInit -->
            </div>

            <!-- Filters & Sorting Bar -->
            <div class="glass-card rounded-2xl p-3 px-4 flex items-center justify-between gap-3 flex-wrap shadow-xs">
                <div class="flex items-center gap-2">
                    <h3 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white" id="snacks-active-heading">All Snacks & Drinks</h3>
                    <span class="liquid-badge text-[10px] font-bold px-2.5 py-0.5" id="snacks-item-count">Loading...</span>
                </div>

                <!-- Sort & Veg Controls -->
                <div class="flex items-center gap-2 shrink-0">
                    <!-- Veg Only Toggle -->
                    <button type="button" id="snacks-veg-toggle" class="clay-pill px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95 transition-transform">
                        <span class="w-3.5 h-3.5 border border-emerald-600 rounded-xs flex items-center justify-center p-[1px]">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </span>
                        <span>Veg Only</span>
                    </button>

                    <!-- Sort Dropdown -->
                    <select id="snacks-sort-select" class="clay-pill px-3 py-1.5 text-xs font-bold bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer">
                        <option value="relevance">Sort: Popular</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                    </select>
                </div>
            </div>

            <!-- Products Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4" id="snacks-products-grid">
                <div class="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                    <div class="w-7 h-7 rounded-full border-2 border-emerald border-t-transparent animate-spin"></div>
                    <p class="font-bold text-slate-600 dark:text-slate-400">Loading catalog items...</p>
                </div>
            </div>
        </main>

        <!-- BLOCKED CATEGORY SPLASH VIEW -->
        <div id="blocked-category-splash" class="hidden py-16 px-4 text-center max-w-md mx-auto space-y-4 glass-card rounded-3xl p-8 shadow-xl">
            <div class="clay-card w-16 h-16 rounded-2xl text-amber-500 flex items-center justify-center mx-auto shadow-md">
                <span class="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <div class="space-y-1.5">
                <span class="clay-pill px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30">
                    Coming Soon to LPU
                </span>
                <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight" id="blocked-cat-title">Coming Soon</h3>
                <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto font-medium" id="blocked-cat-desc">
                    We are currently onboarding top campus vendors for this category. In the meantime, order from our full range of Snacks & Drinks with 3-minute delivery to your hostel!
                </p>
            </div>
            <div>
                <button type="button" id="switch-to-snacks-btn" class="clay-btn clay-btn-primary inline-flex items-center gap-2 text-white text-xs font-black px-6 py-2.5 rounded-2xl active:scale-95 transition-transform shadow-md cursor-pointer">
                    <span class="material-symbols-outlined text-sm">fastfood</span>
                    <span>Browse Live Snacks & Drinks</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Bottom Toast Alert for Blocked Categories -->
    <div id="coming-soon-toast" class="fixed top-16 left-1/2 -translate-x-1/2 glass-panel text-slate-900 dark:text-white px-5 py-2.5 rounded-2xl shadow-2xl z-50 text-xs font-bold flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none -translate-y-2 border border-[var(--glass-border)]">
        <span class="material-symbols-outlined text-amber-400 text-base">info</span>
        <span id="coming-soon-toast-text">Category opening soon! Delivering Snacks & Drinks right now.</span>
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

    // Category Buttons Click Handler
    sidebarBtns.forEach(btn => {
        btn.onclick = () => {
            const status = btn.dataset.status;
            const catName = btn.dataset.name || 'Category';

            sidebarBtns.forEach(b => {
                b.classList.remove('active', 'active-cat');
            });
            btn.classList.add('active', 'active-cat');

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
            <button type="button" class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-transform active:scale-95 subcat-chip cursor-pointer ${sc.id === currentSubcategory ? 'clay-btn-primary text-white shadow-md' : 'clay-pill text-slate-700 dark:text-slate-200 hover:text-emerald'}" data-subcat-id="${sc.id}">
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
            filtered = filtered.filter(p => p.is_veg !== 0);
        }

        const q = (desktopSearch?.value || mobileSearch?.value || '').trim().toLowerCase();
        if (q) {
            filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q));
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

        if (activeHeading) {
            activeHeading.textContent = currentSubcategory === 'All' ? 'All Snacks & Drinks' : currentSubcategory;
        }

        if (filtered.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2 glass-card rounded-3xl p-6">
                    <span class="material-symbols-outlined text-4xl text-slate-400">search_off</span>
                    <p class="font-bold text-slate-700 dark:text-slate-300">No products match your filter.</p>
                    <p class="text-[11px] text-slate-400">Try changing your search term or subcategory.</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = filtered.map(p => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? p.stock_left : (p.in_stock ? 50 : 0);
            const isOutOfStock = !p.in_stock || stockLeft <= 0;
            const isLowStock = stockLeft > 0 && stockLeft <= 4;

            return `
            <div class="product-card-item product-detail-trigger p-3.5 flex flex-col justify-between cursor-pointer group ${isOutOfStock ? 'opacity-75' : ''}" data-product-id="${p.id}" data-category="snacks" data-out-of-stock="${isOutOfStock}">
                <div>
                    <!-- 3D Pedestal Frame -->
                    <div class="card-pedestal h-36 sm:h-40 rounded-2xl relative overflow-hidden flex items-center justify-center p-3 mb-2.5 border border-[var(--glass-border)]">
                        <div class="absolute top-2.5 left-2.5 z-10 bg-white/95 dark:bg-slate-900/90 p-1 rounded-lg shadow-sm border border-[var(--glass-border)]">
                            <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-rose-600'} rounded-xs flex items-center justify-center p-[1px]">
                                <span class="w-1.5 h-1.5 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-rose-600'}"></span>
                            </span>
                        </div>

                        ${discountPercent > 0 ? `
                        <div class="liquid-badge absolute top-2.5 right-2.5 z-10 text-[10px] font-black px-2.5 py-0.5 shadow-sm">
                            ${discountPercent}% OFF
                        </div>
                        ` : ''}

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
                             loading="lazy" 
                             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
                    </div>

                    <span class="clay-pill text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 inline-block mb-1.5">
                        ${p.size || p.unit || '1 unit'}
                    </span>
                    <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug min-h-[34px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        ${p.name}
                    </h3>
                </div>

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

        if (typeof window.syncCardSteppers === 'function') {
            window.syncCardSteppers();
        }
    }

    // Veg Toggle
    vegToggleBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegToggleBtn.classList.add('clay-btn-primary', 'text-white');
            vegToggleBtn.classList.remove('text-slate-700', 'dark:text-slate-300');
        } else {
            vegToggleBtn.classList.remove('clay-btn-primary', 'text-white');
            vegToggleBtn.classList.add('text-slate-700', 'dark:text-slate-300');
        }
        filterAndRenderProducts();
    });

    // Sort Dropdown
    sortSelect?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndRenderProducts();
    });

    // Search inputs
    const handleSearchInput = (e) => {
        filterAndRenderProducts();
    };
    desktopSearch?.addEventListener('input', handleSearchInput);
    mobileSearch?.addEventListener('input', handleSearchInput);

    // Address selector modal trigger
    document.querySelectorAll('.address-selector-trigger').forEach(trigger => {
        trigger.onclick = () => {
            if (typeof window.openAddressModal === 'function') {
                window.openAddressModal();
            }
        };
    });

    // Initial load
    await loadSnacksData();
};

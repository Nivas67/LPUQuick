// Categories & Products Explorer — Exact Quick-Commerce (Blinkit / Zepto) Dual-Pane Layout
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
    
    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-24 flex flex-col">
    <!-- Top Header (Blinkit / Zepto Style) -->
    <header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-2xl border-b border-glass-border shadow-sm">
        <div class="px-margin-mobile md:px-margin-desktop py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
                <a href="#/" class="p-1.5 hover:bg-surface-variant/50 rounded-full transition-colors shrink-0">
                    <span class="material-symbols-outlined text-on-surface text-xl">arrow_back</span>
                </a>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5 cursor-pointer" id="category-picker-trigger">
                        <h1 class="font-headline-md text-base sm:text-lg font-extrabold text-on-surface truncate" id="current-category-name">
                            Bakery & Biscuits
                        </h1>
                        <span class="material-symbols-outlined text-xs text-emerald shrink-0">expand_more</span>
                    </div>
                    <!-- Clickable Delivery Location -->
                    <button type="button" class="address-selector-trigger flex items-center text-[11px] text-on-surface-variant hover:text-emerald transition-colors text-left truncate">
                        <span>Delivering to Home: <strong class="text-on-surface font-semibold">${address}</strong></span>
                        <span class="material-symbols-outlined text-[10px] ml-0.5 text-emerald">arrow_drop_down</span>
                    </button>
                </div>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-1">
                <button type="button" class="p-2 text-on-surface-variant hover:text-emerald rounded-full transition-colors" id="toggle-search-btn" title="Search Category">
                    <span class="material-symbols-outlined text-xl">search</span>
                </button>
                <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald rounded-full transition-colors relative" title="Cart">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                </a>
            </div>
        </div>

        <!-- Search Bar (Collapsible / Toggleable) -->
        <div id="category-search-container" class="hidden px-margin-mobile md:px-margin-desktop pb-2.5">
            <div class="relative">
                <input class="w-full pl-9 pr-8 py-2 rounded-xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald text-xs shadow-inner" placeholder="Search in this category (dark fantasy, good day, oreo...)" type="text" id="category-search-input">
                <span class="material-symbols-outlined absolute left-2.5 top-2.5 text-on-surface-variant text-sm">search</span>
                <button type="button" class="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface text-xs hidden" id="clear-category-search">✕</button>
            </div>
        </div>

        <!-- Top Filter & Sorting Pills Bar -->
        <div class="px-margin-mobile md:px-margin-desktop py-2 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-glass-border/40 text-xs">
            <!-- Filter Dropdown Trigger -->
            <button type="button" class="flex items-center gap-1 px-3 py-1.5 rounded-full border border-surface-variant bg-surface hover:bg-surface-container-high font-medium text-on-surface shrink-0 filter-btn" data-filter="all">
                <span class="material-symbols-outlined text-sm">tune</span>
                <span>Filters</span>
                <span class="material-symbols-outlined text-xs">arrow_drop_down</span>
            </button>

            <!-- Sort Dropdown Trigger -->
            <div class="relative shrink-0">
                <select id="sort-select" class="appearance-none pl-3 pr-6 py-1.5 rounded-full border border-surface-variant bg-surface hover:bg-surface-container-high font-medium text-on-surface text-xs cursor-pointer focus:outline-none focus:border-emerald">
                    <option value="relevance">⇅ Sort</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="discount">% Discount</option>
                    <option value="rating">Top Rated (★)</option>
                </select>
                <span class="material-symbols-outlined text-xs absolute right-2 top-2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
            </div>

            <!-- Diet Preference Pill (Veg Only Toggle) -->
            <button type="button" id="veg-toggle-btn" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-surface-variant bg-surface hover:bg-surface-container-high font-medium text-on-surface shrink-0 transition-all">
                <span class="w-3.5 h-3.5 border border-emerald-600 rounded-sm flex items-center justify-center p-[1px]">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
                </span>
                <span>Veg Only</span>
            </button>

            <!-- 3 Mins Express Tag -->
            <span class="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald/10 text-emerald font-semibold shrink-0 text-[11px]">
                <span class="material-symbols-outlined text-xs">bolt</span> 3 Mins
            </span>
        </div>
    </header>

    <!-- Main Dual-Pane Section: Left Subcategory Rail + Right Product Grid -->
    <div class="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
        <!-- Left Vertical Subcategory Rail -->
        <aside class="w-[78px] sm:w-24 shrink-0 bg-surface/60 border-r border-glass-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[108px] py-2 no-scrollbar" id="subcategory-rail">
            <!-- Dynamically Populated Subcategory Items -->
            <div class="flex flex-col gap-1 items-center" id="subcategory-list">
                <div class="py-8 text-center text-xs text-on-surface-variant animate-pulse">Loading...</div>
            </div>
        </aside>

        <!-- Right Product Listing Grid -->
        <main class="flex-1 p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-140px)]" id="products-content-pane">
            <div class="flex justify-between items-center mb-2.5 px-1">
                <span class="text-xs font-bold text-on-surface-variant" id="active-subcat-heading">Showing Cookies</span>
                <span class="text-[11px] text-on-surface-variant" id="product-count-badge">12 items</span>
            </div>

            <!-- 2-Column Mobile / 3-4 Column Desktop Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5" id="category-products-grid">
                <!-- Product cards injected here -->
            </div>
        </main>
    </div>

    <!-- Category Selector Dropdown Modal (Bottom Sheet / Dialog) -->
    <div id="category-picker-modal" class="hidden modal-overlay">
        <div class="modal-content p-5">
            <div class="flex justify-between items-center pb-3 border-b border-surface-variant/40">
                <h3 class="font-bold text-base text-on-surface">Select Campus Category</h3>
                <button type="button" class="p-1 text-on-surface-variant hover:text-on-surface close-modal-btn">✕</button>
            </div>
            <div class="grid grid-cols-2 gap-2.5 mt-4" id="category-picker-grid">
                <!-- Categories list -->
            </div>
        </div>
    </div>

    <!-- BottomNavBar -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/85 dark:bg-[#0e1813]/85 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/categories">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="font-label-sm text-[11px] mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.categories = async function() {
    let currentCategory = 'Bakery & Biscuits';
    let currentSubcategory = 'Cookies';
    let currentSort = 'relevance';
    let isVegOnly = false;
    let categoryData = null;
    let allProducts = [];

    const categoryTitleEl = document.getElementById('current-category-name');
    const subcatListEl = document.getElementById('subcategory-list');
    const productsGridEl = document.getElementById('category-products-grid');
    const activeSubcatHeading = document.getElementById('active-subcat-heading');
    const productCountBadge = document.getElementById('product-count-badge');
    const sortSelect = document.getElementById('sort-select');
    const vegToggleBtn = document.getElementById('veg-toggle-btn');
    const searchToggleBtn = document.getElementById('toggle-search-btn');
    const searchContainer = document.getElementById('category-search-container');
    const searchInput = document.getElementById('category-search-input');
    const clearSearchBtn = document.getElementById('clear-category-search');
    const categoryPickerTrigger = document.getElementById('category-picker-trigger');
    const categoryPickerModal = document.getElementById('category-picker-modal');
    const categoryPickerGrid = document.getElementById('category-picker-grid');

    // Preset Icons for Subcategories
    const subcatIcons = {
        'Cookies': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100',
        'Cream Biscuits': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=100',
        'Healthy & Digestive': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Sweet & Salty': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100',
        'Glucose & Marie': 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=100',
        'Rusks & Wafers': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Cakes & Rolls': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100',
        'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100',
        'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Snacks': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100',
        'Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=100',
        'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100',
        'Oral Care': 'https://images.unsplash.com/photo-1559591937-e10f135b91b9?w=100',
        'Medicine': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100',
        'First Aid': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=100',
        'Notebooks': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100',
        'Pens': 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=100',
        'Cables': 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=100',
        'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'
    };

    // Load Category Data
    async function loadCategory(catName) {
        currentCategory = catName;
        if (categoryTitleEl) categoryTitleEl.textContent = catName;

        try {
            const url = `/api/categories/${encodeURIComponent(catName)}?sort=${currentSort}&veg=${isVegOnly ? '1' : '0'}`;
            const res = await (await fetch(url)).json();
            categoryData = res;
            allProducts = res.products || [];

            // Populate Subcategories Rail
            const subcats = res.subcategories || [];
            if (subcats.length > 0) {
                currentSubcategory = subcats[0].subcategory;
            } else {
                currentSubcategory = 'All';
            }

            renderSubcategoryRail(subcats);
            filterAndRenderProducts();
        } catch(e) {
            console.error('Failed to load category products:', e);
        }
    }

    function renderSubcategoryRail(subcats) {
        if (!subcatListEl) return;
        
        let railItems = subcats.map((sc) => {
            const isActive = sc.subcategory === currentSubcategory;
            const iconImg = subcatIcons[sc.subcategory] || sc.sample_image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100';
            
            return `
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 relative transition-all group cursor-pointer subcat-rail-item ${isActive ? 'active-subcat' : 'opacity-70 hover:opacity-100'}" data-subcat="${sc.subcategory}">
                    <!-- Green Active Indicator Bar -->
                    ${isActive ? '<div class="absolute left-0 top-1 bottom-1 w-1 bg-emerald rounded-r-full"></div>' : ''}
                    
                    <!-- Circular Thumbnail Container -->
                    <div class="w-12 h-12 rounded-full overflow-hidden p-0.5 border-2 transition-all ${isActive ? 'border-emerald shadow-sm scale-105 bg-emerald/10' : 'border-transparent bg-surface-container-high group-hover:border-surface-variant'}">
                        <img src="${iconImg}" alt="${sc.subcategory}" class="w-full h-full object-cover rounded-full">
                    </div>
                    
                    <!-- Label -->
                    <span class="text-[10px] sm:text-[11px] font-semibold text-center mt-1.5 leading-tight px-1 ${isActive ? 'text-emerald font-bold' : 'text-on-surface'}">
                        ${sc.subcategory}
                    </span>
                </button>
            `;
        }).join('');

        subcatListEl.innerHTML = railItems || `<div class="p-2 text-[10px] text-on-surface-variant text-center">No subcategories</div>`;

        // Subcategory click handlers
        subcatListEl.querySelectorAll('.subcat-rail-item').forEach(item => {
            item.onclick = () => {
                currentSubcategory = item.dataset.subcat;
                renderSubcategoryRail(categoryData?.subcategories || []);
                filterAndRenderProducts();
            };
        });
    }

    function filterAndRenderProducts() {
        if (!productsGridEl) return;

        let filtered = allProducts;

        // Subcategory filter
        if (currentSubcategory && currentSubcategory !== 'All') {
            filtered = filtered.filter(p => p.subcategory === currentSubcategory);
        }

        // Search query filter
        const query = searchInput?.value.trim().toLowerCase();
        if (query) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || (p.tags && p.tags.toLowerCase().includes(query)));
        }

        // Veg filter
        if (isVegOnly) {
            filtered = filtered.filter(p => p.is_veg === 1);
        }

        if (activeSubcatHeading) activeSubcatHeading.textContent = query ? `Search: "${query}"` : currentSubcategory;
        if (productCountBadge) productCountBadge.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            productsGridEl.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant/60">inventory_2</span>
                    <p class="text-xs font-semibold text-on-surface-variant mt-2">No items in this section</p>
                    <p class="text-[10px] text-on-surface-variant/80">Try toggling filters or checking another subcategory</p>
                </div>
            `;
            return;
        }

        // Render Cards matching user screenshot exactly
        productsGridEl.innerHTML = filtered.map(p => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const ratingVal = p.rating || 4.8;
            const reviewCount = p.review_count || '1.2 lac';
            const stockLeft = p.stock_left || 0;

            return `
                <div class="bg-surface rounded-2xl overflow-hidden border border-surface-variant/40 shadow-sm hover:shadow-md transition-all p-2.5 flex flex-col justify-between group product-card-container product-detail-trigger cursor-pointer" data-product-id="${p.id}">
                    <!-- Card Top Image Section -->
                    <div>
                        <div class="relative bg-surface-container-high rounded-xl overflow-hidden h-36 flex items-center justify-center p-2">
                            <!-- Wishlist Heart Button -->
                            <button type="button" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/70 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-rose-500 hover:bg-surface transition-all z-10 wishlist-btn" data-id="${p.id}">
                                <span class="material-symbols-outlined text-base">favorite_border</span>
                            </button>

                            <!-- Veg / Non-Veg Icon at bottom right of image -->
                            <div class="absolute bottom-2 right-2 z-10 bg-surface/80 backdrop-blur-md p-0.5 rounded shadow-sm">
                                <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-red-600'} rounded-sm flex items-center justify-center p-[1px]">
                                    <span class="w-2 h-2 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-red-600'}"></span>
                                </span>
                            </div>

                            <!-- Product Image -->
                            <img class="object-contain w-full h-full group-hover:scale-105 transition-transform duration-200" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">

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
                            <div class="product-action-slot" data-id="${p.id}">
                                <button type="button" class="bg-emerald text-white text-xs px-4 py-1.5 rounded-xl font-bold hover:bg-primary active:scale-95 shadow-sm transition-all add-to-cart-btn" data-id="${p.id}">
                                    ADD
                                </button>
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

                        <!-- Product Title (2-line clamp) -->
                        <h3 class="font-bold text-xs text-on-surface mt-1 line-clamp-2 leading-snug">
                            ${p.name}
                        </h3>
                    </div>

                    <!-- Bottom Rating, ETA & Stock Info -->
                    <div class="mt-2 pt-1.5 border-t border-surface-variant/30 flex flex-col gap-0.5">
                        <div class="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                            <div class="flex text-amber-500 text-xs">
                                <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">star</span>
                            </div>
                            <span class="font-bold text-on-surface">${ratingVal}</span>
                            <span class="text-on-surface-variant/80">(${reviewCount})</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-on-surface-variant mt-0.5">
                            <span class="flex items-center gap-0.5 text-emerald font-semibold">
                                <span class="material-symbols-outlined text-[11px]">bolt</span> 3 mins
                            </span>
                            ${stockLeft > 0 ? `
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                                    🪫 ${stockLeft} left
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Wishlist button clicks
        productsGridEl.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const icon = btn.querySelector('.material-symbols-outlined');
                if (icon.textContent === 'favorite_border') {
                    icon.textContent = 'favorite';
                    icon.classList.add('text-rose-500');
                    icon.style.fontVariationSettings = "'FILL' 1";
                } else {
                    icon.textContent = 'favorite_border';
                    icon.classList.remove('text-rose-500');
                    icon.style.fontVariationSettings = "'FILL' 0";
                }
            };
        });

        window.syncCardSteppers();
    }

    // Category Picker Modal
    categoryPickerTrigger?.addEventListener('click', async () => {
        if (!categoryPickerModal || !categoryPickerGrid) return;
        try {
            const res = await window.api.getCategories();
            const cats = res.categories || [];
            categoryPickerGrid.innerHTML = cats.map(c => `
                <button type="button" class="flex items-center gap-2.5 p-3 rounded-2xl border ${c.name === currentCategory ? 'border-emerald bg-emerald/10' : 'border-surface-variant bg-surface'} hover:bg-surface-container-high text-left transition-all cat-picker-item" data-name="${c.name}">
                    <span class="material-symbols-outlined text-emerald text-xl">${c.icon || 'category'}</span>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-on-surface truncate">${c.name}</p>
                        <p class="text-[10px] text-on-surface-variant">${c.product_count} items</p>
                    </div>
                </button>
            `).join('');

            categoryPickerGrid.querySelectorAll('.cat-picker-item').forEach(item => {
                item.onclick = async () => {
                    categoryPickerModal.classList.add('hidden');
                    await loadCategory(item.dataset.name);
                };
            });

            categoryPickerModal.classList.remove('hidden');
        } catch(e) {}
    });

    categoryPickerModal?.querySelector('.close-modal-btn')?.addEventListener('click', () => {
        categoryPickerModal.classList.add('hidden');
    });

    categoryPickerModal?.addEventListener('click', (e) => {
        if (e.target === categoryPickerModal) categoryPickerModal.classList.add('hidden');
    });

    // Sorting Dropdown
    sortSelect?.addEventListener('change', async (e) => {
        currentSort = e.target.value;
        await loadCategory(currentCategory);
    });

    // Veg Only Toggle
    vegToggleBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegToggleBtn.classList.add('bg-emerald/15', 'border-emerald', 'text-emerald');
        } else {
            vegToggleBtn.classList.remove('bg-emerald/15', 'border-emerald', 'text-emerald');
        }
        filterAndRenderProducts();
    });

    // Search Toggle
    searchToggleBtn?.addEventListener('click', () => {
        searchContainer?.classList.toggle('hidden');
        if (!searchContainer?.classList.contains('hidden')) {
            searchInput?.focus();
        }
    });

    let searchDebounce;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        clearSearchBtn?.classList.toggle('hidden', !searchInput.value);
        searchDebounce = setTimeout(() => {
            filterAndRenderProducts();
        }, 150);
    });

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        filterAndRenderProducts();
    });

    // Initial load
    await loadCategory('Bakery & Biscuits');
};

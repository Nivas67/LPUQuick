// Categories Page — exact Stitch UI with Category Explorer & Product Modal
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    let catData;
    try { catData = await window.api.getCategories(); } catch(e) { catData = { categories: [] }; }

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Campus Categories</h1>
        </div>
        <div class="flex items-center gap-2">
            <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors relative">
                <span class="material-symbols-outlined text-on-surface">shopping_cart</span>
            </a>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto pt-6 space-y-6">
        <!-- Search bar -->
        <div class="relative w-full">
            <input class="w-full pl-11 pr-4 py-3 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-xs sm:text-sm shadow-sm" placeholder="Search products (milk, chips, noodles, medicine, notebook)..." type="text" id="categories-search">
            <span class="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant text-base sm:text-lg">search</span>
        </div>

        <!-- Dynamic Category Explorer View (Shown when category clicked or search active) -->
        <div id="category-explorer-view" class="hidden space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-surface-variant/40">
                <div>
                    <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2" id="explorer-title">
                        Category Products
                    </h2>
                    <p class="text-xs text-on-surface-variant" id="explorer-subtitle">All products delivered in 3 mins to your hostel</p>
                </div>
                <button type="button" class="text-xs text-emerald font-bold px-3 py-1.5 rounded-full bg-emerald/10 hover:bg-emerald/20 transition-all cursor-pointer" id="back-to-all-categories-btn">
                    ← All Categories
                </button>
            </div>

            <!-- Subcategory Filter Pills -->
            <div id="subcategory-pills" class="flex gap-2 overflow-x-auto no-scrollbar py-1"></div>

            <!-- Products Grid -->
            <div id="explorer-products-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"></div>
        </div>

        <!-- Bento Grid Categories (Default Overview) -->
        <div id="categories-bento-section" class="space-y-6">
            <section class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <!-- Grocery Hero Bento -->
                <div class="md:col-span-2 bg-gradient-to-br from-emerald/20 via-surface to-surface border border-emerald/30 rounded-3xl p-5 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-bento-card" data-category="Grocery">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald/20 text-emerald rounded-full font-label-sm font-semibold text-[11px] mb-2">
                                <span class="material-symbols-outlined text-xs">local_mall</span> 3 Mins Express
                            </span>
                            <h2 class="font-headline-md text-xl sm:text-2xl text-on-surface font-bold">Grocery & Daily Dairy</h2>
                            <p class="text-on-surface-variant mt-1.5 max-w-md text-xs sm:text-sm">Fresh milk, whole wheat bread, farm eggs, juices & staples for your room.</p>
                        </div>
                        <div class="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-emerald text-white flex items-center justify-center shadow-md flex-shrink-0">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl">shopping_cart</span>
                        </div>
                    </div>
                    <div class="mt-6 flex items-center justify-between">
                        <span class="text-emerald font-semibold text-xs sm:text-sm flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-xs">arrow_forward</span></span>
                        <span class="text-on-surface-variant text-xs">Delivered to Hostel Gate</span>
                    </div>
                </div>

                <!-- Snacks & Beverages Bento -->
                <div class="bg-gradient-to-br from-royal-purple/20 via-surface to-surface border border-royal-purple/30 rounded-3xl p-5 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-bento-card" data-category="Snacks & Beverages">
                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-royal-purple text-white flex items-center justify-center mb-3 shadow-md">
                            <span class="material-symbols-outlined text-2xl">fastfood</span>
                        </div>
                        <h2 class="font-headline-md text-lg sm:text-xl text-on-surface font-bold">Snacks & Beverages</h2>
                        <p class="text-on-surface-variant mt-1 text-xs sm:text-sm">Instant noodles, spicy chips, cold drinks, party dips & chocolate cookies.</p>
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <span class="text-royal-purple font-semibold text-xs flex items-center gap-1">Browse Munchies <span class="material-symbols-outlined text-xs">arrow_forward</span></span>
                    </div>
                </div>

                <!-- Personal Care -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-bento-card" data-category="Personal Care">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">clean_hands</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Personal Care</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">Facewash, shampoos, soaps, oral hygiene & grooming.</p>
                    </div>
                    <span class="text-teal-600 font-semibold text-xs mt-3 flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>

                <!-- Pharmacy -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-bento-card" data-category="Pharmacy">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">medication</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Pharmacy & First Aid</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">Paracetamol, pain relief, band-aids, ORS & wellness.</p>
                    </div>
                    <span class="text-rose-500 font-semibold text-xs mt-3 flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>

                <!-- Stationery -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-bento-card" data-category="Stationery">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">edit_document</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Stationery & Notebooks</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">A4 registers, gel pens, exam supplies & notebooks.</p>
                    </div>
                    <span class="text-amber-600 font-semibold text-xs mt-3 flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>

                <!-- Electronics -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-bento-card" data-category="Electronics">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">devices</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Electronics & Cables</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">USB-C fast cables, earphones, chargers & adapters.</p>
                    </div>
                    <span class="text-indigo-600 font-semibold text-xs mt-3 flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>
            </section>
        </div>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
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
    const searchInput = document.getElementById('categories-search');
    const explorerView = document.getElementById('category-explorer-view');
    const bentoSection = document.getElementById('categories-bento-section');
    const explorerTitle = document.getElementById('explorer-title');
    const explorerSubtitle = document.getElementById('explorer-subtitle');
    const explorerGrid = document.getElementById('explorer-products-grid');
    const subcategoryPills = document.getElementById('subcategory-pills');
    const backBtn = document.getElementById('back-to-all-categories-btn');

    backBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        explorerView?.classList.add('hidden');
        bentoSection?.classList.remove('hidden');
    });

    // Category bento cards click
    document.querySelectorAll('.category-bento-card').forEach(card => {
        card.onclick = async () => {
            const catName = card.dataset.category;
            await loadCategoryExplorer(catName);
        };
    });

    async function loadCategoryExplorer(categoryName) {
        if (!explorerView || !bentoSection || !explorerGrid) return;
        bentoSection.classList.add('hidden');
        explorerView.classList.remove('hidden');

        explorerTitle.textContent = `${categoryName}`;
        explorerSubtitle.textContent = `All items in ${categoryName} · Delivered in 3 mins`;

        try {
            const res = await window.api.getCategoryProducts(categoryName);
            const products = res.products || [];

            // Extract unique subcategories for filter pills
            const subcats = ['All', ...new Set(products.map(p => p.subcategory).filter(Boolean))];
            if (subcategoryPills) {
                subcategoryPills.innerHTML = subcats.map((sc, idx) => `
                    <button type="button" class="px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all subcat-pill ${idx === 0 ? 'bg-emerald text-white shadow-sm' : 'bg-surface-container-high text-on-surface hover:bg-emerald/10'}" data-subcat="${sc}">
                        ${sc}
                    </button>
                `).join('');

                subcategoryPills.querySelectorAll('.subcat-pill').forEach(pill => {
                    pill.onclick = () => {
                        subcategoryPills.querySelectorAll('.subcat-pill').forEach(p => {
                            p.classList.remove('bg-emerald', 'text-white', 'shadow-sm');
                            p.classList.add('bg-surface-container-high', 'text-on-surface');
                        });
                        pill.classList.remove('bg-surface-container-high', 'text-on-surface');
                        pill.classList.add('bg-emerald', 'text-white', 'shadow-sm');

                        const filter = pill.dataset.subcat;
                        const filtered = filter === 'All' ? products : products.filter(p => p.subcategory === filter);
                        renderProducts(filtered);
                    };
                });
            }

            renderProducts(products);
        } catch(e) {
            explorerGrid.innerHTML = `<p class="text-error text-xs col-span-full">Could not load products.</p>`;
        }
    }

    function renderProducts(items) {
        if (!explorerGrid) return;
        if (items.length === 0) {
            explorerGrid.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant">inventory_2</span>
                    <p class="text-on-surface-variant text-xs mt-2">No items found in this section.</p>
                </div>
            `;
            return;
        }

        explorerGrid.innerHTML = items.map(p => `
            <div class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-surface-variant/40 p-3 flex flex-col justify-between product-detail-trigger cursor-pointer" data-product-id="${p.id}">
                <div>
                    <div class="h-32 bg-surface-container-high rounded-xl overflow-hidden mb-2 flex items-center justify-center p-2">
                        <img class="object-contain w-full h-full" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
                    </div>
                    <h4 class="font-semibold text-xs text-on-surface truncate">${p.name}</h4>
                    <p class="text-[10px] text-on-surface-variant">${p.size || p.unit}</p>
                </div>
                <div class="flex justify-between items-center mt-2.5">
                    <span class="font-bold text-xs text-on-surface">₹${p.price}</span>
                    <div class="product-action-slot" data-id="${p.id}">
                        <button type="button" class="bg-emerald text-white text-[11px] px-3 py-1 rounded-full font-semibold hover:opacity-90 active:scale-90 transition-all add-to-cart-btn" data-id="${p.id}">Add</button>
                    </div>
                </div>
            </div>
        `).join('');

        window.syncCardSteppers();
    }

    // Top search in categories page
    let debounce;
    searchInput?.addEventListener('input', () => {
        clearTimeout(debounce);
        const q = searchInput.value.trim();
        if (!q) {
            explorerView?.classList.add('hidden');
            bentoSection?.classList.remove('hidden');
            return;
        }

        debounce = setTimeout(async () => {
            bentoSection?.classList.add('hidden');
            explorerView?.classList.remove('hidden');
            if (explorerTitle) explorerTitle.textContent = `Search: "${q}"`;
            if (explorerSubtitle) explorerSubtitle.textContent = `Matching campus products`;
            if (subcategoryPills) subcategoryPills.innerHTML = '';

            const res = await window.api.searchProducts(q);
            renderProducts(res.results || []);
        }, 180);
    });
};

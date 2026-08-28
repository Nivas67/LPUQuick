// Categories Page — exact Stitch UI reproduction
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

    <main class="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto pt-6 space-y-6 sm:space-y-8">
        <!-- Search bar -->
        <div class="relative w-full">
            <input class="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-xs sm:text-sm shadow-sm" placeholder="Search across all categories (e.g. chips, milk, noodles, eggs)..." type="text" id="categories-search">
            <span class="material-symbols-outlined absolute left-3.5 top-3 sm:top-3.5 text-on-surface-variant text-base sm:text-lg">search</span>
        </div>

        <div id="search-results-container" class="hidden space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface" id="search-title">Search Results</h2>
                <button type="button" class="text-xs text-emerald font-semibold" id="clear-search-btn">Back to Categories</button>
            </div>
            <div id="search-results-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"></div>
        </div>

        <!-- Bento Grid Categories -->
        <div id="categories-main-section" class="space-y-6 sm:space-y-8">
            <section class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <!-- Grocery Hero Bento -->
                <div class="md:col-span-2 bg-gradient-to-br from-emerald/20 via-surface to-surface border border-emerald/30 rounded-3xl p-5 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-card" data-category="Grocery">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-3 py-0.5 bg-emerald/20 text-emerald rounded-full font-label-sm font-semibold text-[11px] mb-2">
                                <span class="material-symbols-outlined text-xs">local_mall</span> 7 Mins Express
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
                <div class="bg-gradient-to-br from-royal-purple/20 via-surface to-surface border border-royal-purple/30 rounded-3xl p-5 sm:p-7 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-card" data-category="Snacks & Beverages">
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
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Personal Care">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">clean_hands</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Personal Care</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">Facewash, shampoos, soaps, oral hygiene & grooming.</p>
                    </div>
                    <span class="text-teal-600 font-semibold text-xs mt-3 flex items-center gap-1">View items <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>

                <!-- Pharmacy -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Pharmacy">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">medication</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Pharmacy & First Aid</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">Paracetamol, pain relief, band-aids, ORS & wellness.</p>
                    </div>
                    <span class="text-rose-500 font-semibold text-xs mt-3 flex items-center gap-1">View items <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>

                <!-- Stationery & Electronics -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Stationery">
                    <div>
                        <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2.5">
                            <span class="material-symbols-outlined text-xl">edit_document</span>
                        </div>
                        <h3 class="font-headline-md text-base text-on-surface font-bold">Stationery & Tech</h3>
                        <p class="text-on-surface-variant mt-0.5 text-xs">A4 registers, gel pens, USB-C fast charging cables, earphones.</p>
                    </div>
                    <span class="text-amber-600 font-semibold text-xs mt-3 flex items-center gap-1">View items <span class="material-symbols-outlined text-xs">chevron_right</span></span>
                </div>
            </section>

            <!-- Trending Promo Scroll -->
            <section>
                <h2 class="font-headline-md text-base sm:text-lg font-bold mb-3 text-on-surface">Trending on Campus</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" id="category-featured-products"></div>
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
    const userId = window.CURRENT_USER_ID || 'user_001';

    // Load trending items
    try {
        const res = await window.api.searchProducts('milk noodles chips cola');
        const prods = (res.results || []).slice(0, 4);
        const container = document.getElementById('category-featured-products');
        if (container && prods.length > 0) {
            container.innerHTML = prods.map(p => `
                <div class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface-variant/30 group flex flex-col justify-between">
                    <div class="h-32 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                        <img class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                    </div>
                    <div class="p-3">
                        <p class="font-label-lg font-semibold truncate mb-0.5 text-xs text-on-surface">${p.name}</p>
                        <p class="text-[10px] text-on-surface-variant mb-1.5">${p.size || p.unit}</p>
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-xs text-on-surface">₹${p.price}</span>
                            <button type="button" class="bg-emerald text-white rounded-full px-3 py-1 text-[11px] font-semibold hover:opacity-90 active:scale-90 transition-all add-to-cart-btn" data-id="${p.id}">Add</button>
                        </div>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();
                    const id = btn.dataset.id;
                    btn.textContent = '✓';
                    await window.api.addToCart(userId, id, 1);
                    setTimeout(() => { btn.textContent = 'Add'; }, 800);
                };
            });
        }
    } catch(e) {
        console.error(e);
    }

    const searchInput = document.getElementById('categories-search');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('search-results-grid');
    const mainSection = document.getElementById('categories-main-section');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        resultsContainer?.classList.add('hidden');
        mainSection?.classList.remove('hidden');
    });

    document.querySelectorAll('.category-card').forEach(card => {
        card.onclick = () => {
            const cat = card.dataset.category;
            if (searchInput) {
                searchInput.value = cat;
                performSearch(cat);
            }
        };
    });

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = searchInput.value.trim();
        if (!q) {
            resultsContainer?.classList.add('hidden');
            mainSection?.classList.remove('hidden');
            return;
        }
        debounceTimer = setTimeout(() => performSearch(q), 200);
    });

    async function performSearch(q) {
        if (!resultsContainer || !resultsGrid || !mainSection) return;
        const res = await window.api.searchProducts(q);
        const items = res.results || [];

        mainSection.classList.add('hidden');
        resultsContainer.classList.remove('hidden');

        const titleEl = document.getElementById('search-title');
        if (titleEl) titleEl.textContent = `Results for "${q}" (${items.length})`;

        if (items.length === 0) {
            resultsGrid.innerHTML = `
                <div class="col-span-full py-10 text-center">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
                    <p class="text-on-surface-variant text-xs mt-2">No items found for "${q}". Try another term.</p>
                </div>
            `;
            return;
        }

        resultsGrid.innerHTML = items.map(p => {
            const subHtml = (!p.in_stock && p.alternatives && p.alternatives.length > 0)
                ? `<div class="mt-1.5 text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded-lg">
                     <span class="font-bold">Out of Stock.</span> Suggested: ${p.alternatives[0].name} (₹${p.alternatives[0].price})
                   </div>`
                : '';
            return `
            <div class="bg-surface rounded-2xl overflow-hidden shadow-sm border border-surface-variant/40 p-2.5 flex flex-col justify-between">
                <div>
                    <div class="h-28 bg-surface-container-high rounded-xl overflow-hidden mb-1.5 flex items-center justify-center">
                        <img class="object-cover w-full h-full" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                    </div>
                    <h4 class="font-semibold text-xs text-on-surface truncate">${p.name}</h4>
                    <p class="text-[10px] text-on-surface-variant">${p.size || p.unit}</p>
                    ${subHtml}
                </div>
                <div class="flex justify-between items-center mt-2.5">
                    <span class="font-bold text-xs text-on-surface">₹${p.price}</span>
                    ${p.in_stock ? `
                    <button type="button" class="bg-emerald text-white text-[11px] px-3 py-0.5 rounded-full font-semibold hover:opacity-90 active:scale-90 transition-all add-to-cart-btn" data-id="${p.id}">Add</button>
                    ` : `
                    <span class="text-[10px] text-error font-semibold">Unavailable</span>
                    `}
                </div>
            </div>`;
        }).join('');

        resultsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                btn.textContent = '✓';
                await window.api.addToCart(userId, id, 1);
                setTimeout(() => { btn.textContent = 'Add'; }, 800);
            };
        });
    }
};

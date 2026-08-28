// Categories Page — exact Stitch UI reproduction
window.pages.categories = async function() {
    let catData;
    try { catData = await api.getCategories(); } catch(e) { catData = { categories: [] }; }
    const categories = catData.categories || [];

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-headline-md text-on-surface">Categories</h1>
        </div>
        <div class="flex items-center gap-2">
            <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors relative">
                <span class="material-symbols-outlined text-on-surface">shopping_cart</span>
            </a>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto pt-6 space-y-8">
        <!-- Search bar -->
        <div class="relative w-full">
            <input class="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md shadow-sm" placeholder="Search across all categories..." type="text" id="categories-search">
            <span class="material-symbols-outlined absolute left-4 top-3.5 text-on-surface-variant">search</span>
        </div>

        <div id="search-results-container" class="hidden space-y-4">
            <h2 class="font-headline-md text-headline-md text-on-surface">Search Results</h2>
            <div id="search-results-grid" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>
        </div>

        <!-- Bento Grid Categories -->
        <div id="categories-main-section" class="space-y-8">
            <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Grocery Hero Bento -->
                <div class="md:col-span-2 bg-gradient-to-br from-emerald/20 via-surface to-surface border border-emerald/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-card" data-category="Grocery">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald/20 text-emerald rounded-full font-label-sm font-semibold mb-3">
                                <span class="material-symbols-outlined text-sm">local_mall</span> Most Popular
                            </span>
                            <h2 class="font-headline-md text-2xl sm:text-3xl text-on-surface font-bold">Grocery & Staples</h2>
                            <p class="text-on-surface-variant mt-2 max-w-md">Fresh produce, farm eggs, whole milk, bakery bread and daily campus kitchen essentials.</p>
                        </div>
                        <div class="w-16 h-16 rounded-2xl bg-emerald text-white flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-3xl">shopping_cart</span>
                        </div>
                    </div>
                    <div class="mt-8 flex items-center justify-between">
                        <span class="text-emerald font-semibold font-label-lg flex items-center gap-1">Explore Products <span class="material-symbols-outlined text-sm">arrow_forward</span></span>
                        <span class="text-on-surface-variant text-sm font-medium">Delivered in 7 mins</span>
                    </div>
                </div>

                <!-- Snacks & Beverages Bento -->
                <div class="bg-gradient-to-br from-royal-purple/20 via-surface to-surface border border-royal-purple/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all cursor-pointer category-card" data-category="Snacks & Beverages">
                    <div>
                        <div class="w-14 h-14 rounded-2xl bg-royal-purple text-white flex items-center justify-center mb-4 shadow-md">
                            <span class="material-symbols-outlined text-3xl">fastfood</span>
                        </div>
                        <h2 class="font-headline-md text-2xl text-on-surface font-bold">Snacks & Drinks</h2>
                        <p class="text-on-surface-variant mt-2 text-sm">Instant noodles, spicy chips, cold drinks, party dips and chocolate cookies.</p>
                    </div>
                    <div class="mt-6 flex items-center justify-between">
                        <span class="text-royal-purple font-semibold font-label-lg flex items-center gap-1">Browse <span class="material-symbols-outlined text-sm">arrow_forward</span></span>
                    </div>
                </div>

                <!-- Personal Care -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Personal Care">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center mb-3">
                            <span class="material-symbols-outlined text-2xl">clean_hands</span>
                        </div>
                        <h3 class="font-headline-md text-xl text-on-surface font-bold">Personal Care</h3>
                        <p class="text-on-surface-variant mt-1 text-sm">Facewash, shampoos, soaps, oral hygiene & grooming.</p>
                    </div>
                    <span class="text-teal-600 font-medium font-label-md mt-4 flex items-center gap-1">View items <span class="material-symbols-outlined text-sm">chevron_right</span></span>
                </div>

                <!-- Pharmacy -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Pharmacy">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                            <span class="material-symbols-outlined text-2xl">medication</span>
                        </div>
                        <h3 class="font-headline-md text-xl text-on-surface font-bold">Pharmacy & First Aid</h3>
                        <p class="text-on-surface-variant mt-1 text-sm">Paracetamol, pain relief, band-aids, ORS & wellness.</p>
                    </div>
                    <span class="text-rose-500 font-medium font-label-md mt-4 flex items-center gap-1">View items <span class="material-symbols-outlined text-sm">chevron_right</span></span>
                </div>

                <!-- Stationery & Electronics -->
                <div class="bg-surface border border-surface-variant/50 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer category-card" data-category="Stationery">
                    <div>
                        <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                            <span class="material-symbols-outlined text-2xl">edit_document</span>
                        </div>
                        <h3 class="font-headline-md text-xl text-on-surface font-bold">Stationery & Tech</h3>
                        <p class="text-on-surface-variant mt-1 text-sm">A4 registers, gel pens, USB-C fast charging cables, earphones.</p>
                    </div>
                    <span class="text-amber-600 font-medium font-label-md mt-4 flex items-center gap-1">View items <span class="material-symbols-outlined text-sm">chevron_right</span></span>
                </div>
            </section>

            <!-- Trending Promo Scroll -->
            <section>
                <h2 class="font-headline-md text-xl mb-4 text-on-surface">Trending on Campus</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="category-featured-products"></div>
            </section>
        </div>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/70 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/categories">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="font-label-sm text-label-sm mt-1">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.categories = async function() {
    // Load trending products into the bottom scroll
    try {
        const res = await api.searchProducts('chips noodles milk coffee');
        const prods = (res.results || []).slice(0, 4);
        const container = document.getElementById('category-featured-products');
        if (container && prods.length > 0) {
            container.innerHTML = prods.map(p => `
                <div class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface-variant/30 group">
                    <div class="h-32 bg-surface-container-high relative overflow-hidden">
                        <img class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.name}">
                    </div>
                    <div class="p-3.5">
                        <p class="font-label-lg truncate mb-1 text-sm font-semibold">${p.name}</p>
                        <p class="text-xs text-on-surface-variant mb-2">${p.size || p.unit}</p>
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-sm">₹${p.price}</span>
                            <button class="bg-emerald text-white rounded-full px-3 py-1 text-xs font-semibold hover:opacity-90 transition-opacity add-to-cart-btn" data-id="${p.id}">Add</button>
                        </div>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    btn.textContent = '✓';
                    await api.addToCart(CURRENT_USER_ID, id);
                    setTimeout(() => { btn.textContent = 'Add'; }, 1000);
                });
            });
        }
    } catch(e) {
        console.error('Error loading trending:', e);
    }

    // Category click filters
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', async () => {
            const catName = card.dataset.category;
            const searchInput = document.getElementById('categories-search');
            if (searchInput) {
                searchInput.value = catName;
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    });

    // Search input handler
    const searchInput = document.getElementById('categories-search');
    const resultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('search-results-grid');
    const mainSection = document.getElementById('categories-main-section');

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const q = searchInput.value.trim();
        if (!q) {
            resultsContainer.classList.add('hidden');
            mainSection.classList.remove('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            const res = await api.searchProducts(q);
            const items = res.results || [];
            mainSection.classList.add('hidden');
            resultsContainer.classList.remove('hidden');

            if (items.length === 0) {
                resultsGrid.innerHTML = `
                    <div class="col-span-full py-12 text-center">
                        <span class="material-symbols-outlined text-4xl text-on-surface-variant">search_off</span>
                        <p class="text-on-surface-variant mt-2">No items found for "${q}". Try another term.</p>
                    </div>
                `;
                return;
            }

            resultsGrid.innerHTML = items.map(p => {
                const subHtml = (!p.in_stock && p.alternatives && p.alternatives.length > 0)
                    ? `<div class="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                         <span class="font-semibold">Out of Stock.</span> Suggested: ${p.alternatives[0].name} (₹${p.alternatives[0].price})
                       </div>`
                    : '';
                return `
                <div class="bg-surface rounded-2xl overflow-hidden shadow-sm border border-surface-variant/40 p-3 flex flex-col justify-between">
                    <div>
                        <div class="h-32 bg-surface-container-high rounded-xl overflow-hidden mb-2">
                            <img class="object-cover w-full h-full" src="${p.image_url}" alt="${p.name}">
                        </div>
                        <h4 class="font-label-lg text-sm font-semibold truncate">${p.name}</h4>
                        <p class="text-xs text-on-surface-variant">${p.size || p.unit}</p>
                        ${subHtml}
                    </div>
                    <div class="flex justify-between items-center mt-3">
                        <span class="font-bold text-sm">₹${p.price}</span>
                        ${p.in_stock ? `
                        <button class="bg-emerald text-white text-xs px-3 py-1 rounded-full font-semibold hover:opacity-90 add-to-cart-btn" data-id="${p.id}">Add</button>
                        ` : `
                        <span class="text-xs text-error font-medium">Unavailable</span>
                        `}
                    </div>
                </div>`;
            }).join('');

            resultsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    btn.textContent = '✓';
                    await api.addToCart(CURRENT_USER_ID, id);
                    setTimeout(() => { btn.textContent = 'Add'; }, 1000);
                });
            });
        }, 250);
    });
};

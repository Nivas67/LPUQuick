// Home Page — exact Stitch UI with Address selector, Product modal & live stepper
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.home = async function() {
    let data;
    try { data = await window.api.fetchHome(); } catch(e) { data = null; }

    const sectionTitle = data?.section_title || 'Evening Snacks';
    const products = data?.products || [];
    const buyAgain = data?.buy_again || [];
    const address = window.currentAddress || 'BH13';

    const productCards = products.slice(0, 4).map((p) => {
        const badge = p.bestseller
            ? `<div class="absolute top-3 left-3 bg-vibrant-yellow text-on-surface font-label-sm px-2.5 py-0.5 rounded-md shadow-sm font-bold text-[10px]">Bestseller</div>`
            : p.is_new
            ? `<div class="absolute top-3 left-3 bg-royal-purple/20 text-royal-purple font-label-sm px-2.5 py-0.5 rounded-md font-bold text-[10px] backdrop-blur-sm">New</div>`
            : '';
        return `
        <div class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative border border-surface-variant/30 flex flex-col justify-between product-detail-trigger cursor-pointer" data-product-id="${p.id}">
            <div class="h-36 sm:h-40 bg-surface-container-high relative overflow-hidden flex items-center justify-center p-2">
                <img class="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
                ${badge}
            </div>
            <div class="p-3 sm:p-3.5">
                <p class="font-label-lg font-semibold text-xs sm:text-sm truncate mb-0.5 text-on-surface">${p.name}</p>
                <p class="text-[10px] sm:text-xs text-on-surface-variant mb-2">${p.size || p.unit}</p>
                <div class="flex justify-between items-center">
                    <p class="font-bold text-xs sm:text-sm text-on-surface">₹${p.price}</p>
                    <div class="product-action-slot" data-id="${p.id}">
                        <button type="button" class="bg-emerald text-white rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all add-to-cart-btn" data-id="${p.id}">Add</button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    const buyAgainCards = buyAgain.map(p => `
        <div class="flex-none w-36 sm:w-44 snap-start bg-surface rounded-[2rem] p-3 sm:p-4 shadow-sm border border-surface-variant/30 hover:border-emerald transition-all product-detail-trigger cursor-pointer" data-product-id="${p.id}">
            <div class="h-24 sm:h-28 bg-surface-container-high rounded-[1.5rem] mb-2.5 relative overflow-hidden flex items-center justify-center p-2">
                <img class="object-contain w-full h-full" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1568651316335-714a806283db?w=300'">
            </div>
            <p class="font-label-lg font-semibold text-xs truncate text-on-surface">${p.name}</p>
            <div class="flex justify-between items-center mt-1">
                <p class="text-xs text-on-surface-variant font-bold">₹${p.price}</p>
                <div class="product-action-slot" data-id="${p.id}">
                    <button type="button" class="bg-emerald text-white rounded-full p-1 shadow-sm hover:opacity-90 active:scale-90 transition-all add-to-cart-btn" data-id="${p.id}">
                        <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">add</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar (Web) -->
    <header class="hidden md:flex justify-between items-center px-margin-desktop py-sm w-full z-50 fixed top-0 bg-surface/80 backdrop-blur-3xl border-b border-glass-border">
        <div class="flex items-center gap-md">
            <a href="#/" class="font-display text-display text-primary tracking-tighter text-2xl font-bold flex items-center gap-2">
                <img src="/logo.png" alt="LPUQuick" class="w-8 h-8 rounded-xl shadow-sm object-cover">
                <span>LPUQuick</span>
            </a>
            <!-- Address Selector Trigger -->
            <button type="button" class="address-selector-trigger flex items-center bg-surface-container-high hover:bg-emerald/10 border border-surface-variant/40 rounded-full px-4 py-1.5 text-on-surface font-label-sm text-xs transition-all cursor-pointer">
                <span class="material-symbols-outlined text-emerald text-sm mr-1.5" style="font-variation-settings: 'FILL' 1;">location_on</span>
                <span class="font-bold">Delivery to ${address}</span>
                <span class="text-on-surface-variant ml-1">· 3 mins</span>
                <span class="material-symbols-outlined text-xs ml-1 text-emerald">expand_more</span>
            </button>
        </div>
        <div class="flex items-center gap-4">
            <!-- Dedicated Fast Product Search -->
            <div class="relative w-80">
                <input class="w-full pl-9 pr-8 py-2 rounded-full border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-xs shadow-sm" placeholder="Search products (milk, noodles, chips...)" type="text" id="desktop-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
                <div id="desktop-search-dropdown" class="hidden absolute top-11 left-0 w-full bg-surface border border-surface-variant rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto p-2"></div>
            </div>
            <a href="#/orders" class="p-2 text-on-surface-variant hover:text-emerald transition-colors" title="My Orders"><span class="material-symbols-outlined">receipt_long</span></a>
            <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald transition-colors relative" title="Cart">
                <span class="material-symbols-outlined">shopping_cart</span>
            </a>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors" title="Settings"><span class="material-symbols-outlined">settings</span></a>
        </div>
    </header>

    <!-- TopAppBar (Mobile) -->
    <header class="md:hidden flex justify-between items-center px-margin-mobile py-2.5 w-full z-50 fixed top-0 bg-surface/80 backdrop-blur-3xl border-b border-glass-border">
        <!-- Address Selector Trigger Mobile -->
        <button type="button" class="address-selector-trigger flex flex-col text-left cursor-pointer">
            <div class="flex items-center text-primary font-bold text-sm">
                <span>Delivery to ${address}</span>
                <span class="material-symbols-outlined ml-0.5 text-xs text-emerald">expand_more</span>
            </div>
            <span class="text-on-surface-variant text-[10px]">3 mins ETA · Click to Change</span>
        </button>
        <div class="flex items-center gap-1.5">
            <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald transition-colors relative">
                <span class="material-symbols-outlined text-xl">shopping_cart</span>
            </a>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined text-xl">account_circle</span></a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="pt-20 md:pt-28 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-7">
        <!-- Mobile Product Search -->
        <section class="md:hidden relative w-full">
            <div class="relative">
                <input class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-xs shadow-sm" placeholder="Search products (chips, milk, noodles...)" type="text" id="mobile-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
            </div>
            <div id="mobile-search-dropdown" class="hidden absolute top-12 left-0 w-full bg-surface border border-surface-variant rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto p-2"></div>
        </section>

        <!-- Dynamic Time Section -->
        <section>
            <div class="flex justify-between items-end mb-3.5">
                <div>
                    <h2 class="font-headline-md text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
                        <span>${sectionTitle}</span>
                        <span class="text-[10px] bg-emerald/10 text-emerald font-bold px-2 py-0.5 rounded-full">Live Campus Menu</span>
                    </h2>
                </div>
                <a class="text-xs font-semibold text-emerald hover:text-primary transition-colors flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">${productCards}</div>
        </section>

        <!-- Buy Again -->
        <section>
            <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface mb-2.5">Buy Again</h2>
            <div class="flex overflow-x-auto gap-3 sm:gap-4 no-scrollbar pb-2 snap-x">${buyAgainCards}</div>
        </section>

        <!-- Promotional Bento -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            <a href="#/flow-assist" class="bg-royal-purple/10 border border-royal-purple/20 rounded-[2rem] p-5 sm:p-7 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:bg-royal-purple/15 transition-all shadow-sm">
                <div class="z-10 w-3/4">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-royal-purple bg-white/70 px-2.5 py-0.5 rounded-full mb-1.5">AI ASSISTANT</span>
                    <h3 class="font-headline-md text-lg sm:text-xl font-bold text-royal-purple mb-1.5">Need ideas?</h3>
                    <p class="text-xs text-on-surface-variant mb-4">Ask Flow Assist to build your custom snack combo for group studies or matches.</p>
                    <span class="bg-royal-purple text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-md hover:opacity-90 flex items-center gap-1.5 transition-opacity inline-flex">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span> Try Flow Assist
                    </span>
                </div>
                <div class="absolute -right-6 -bottom-6 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                    <span class="material-symbols-outlined text-[130px] text-royal-purple" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                </div>
            </a>

            <a href="#/categories" class="bg-emerald/10 border border-emerald/20 rounded-[2rem] p-5 sm:p-7 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:bg-emerald/15 transition-all shadow-sm">
                <div class="z-10 w-full">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald bg-white/70 px-2.5 py-0.5 rounded-full mb-1.5">3-MIN DELIVERY</span>
                            <h3 class="font-headline-md text-lg sm:text-xl font-bold text-emerald">Campus Night Cravings</h3>
                        </div>
                        <span class="material-symbols-outlined text-emerald bg-emerald/20 p-2 rounded-2xl text-lg" style="font-variation-settings: 'FILL' 1;">local_pizza</span>
                    </div>
                    <p class="text-xs text-on-surface-variant mb-3">Open till 2 AM across all LPU Hostels. Get hot noodles, iced beverages & munchies delivered.</p>
                    <span class="text-xs font-semibold text-emerald flex items-center gap-1">Browse 6 Categories <span class="material-symbols-outlined text-xs">arrow_forward</span></span>
                </div>
            </a>
        </section>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home</span>
                <span class="font-label-sm text-[11px] mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Categories</span>
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
                    dropdown.innerHTML = `<div class="p-3 text-xs text-on-surface-variant text-center">No products matching "${q}"</div>`;
                    return;
                }
                dropdown.innerHTML = items.slice(0, 6).map(p => `
                    <div class="flex items-center justify-between p-2 hover:bg-surface-container-high rounded-xl cursor-pointer search-item-row" data-id="${p.id}">
                        <div class="flex items-center gap-2.5 min-w-0">
                            <img class="w-9 h-9 object-contain rounded-lg bg-surface-container-high" src="${p.image_url}" alt="${p.name}">
                            <div class="min-w-0">
                                <p class="text-xs font-semibold text-on-surface truncate">${p.name}</p>
                                <p class="text-[10px] text-on-surface-variant">₹${p.price} · ${p.size || p.unit}</p>
                            </div>
                        </div>
                        <button type="button" class="bg-emerald text-white text-[11px] px-3 py-1 rounded-full font-semibold quick-add-btn" data-id="${p.id}">Add</button>
                    </div>
                `).join('');

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
                        await window.api.addToCart(window.CURRENT_USER_ID, btn.dataset.id, 1);
                        btn.textContent = '✓';
                        window.syncCardSteppers();
                    };
                });
            }, 180);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input?.contains(e.target) && !dropdown?.contains(e.target)) {
                dropdown?.classList.add('hidden');
            }
        });
    });
};

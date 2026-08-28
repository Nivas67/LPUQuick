// Home Page — exact Stitch UI reproduction with dynamic time-based content
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.home = async function() {
    let data;
    try { data = await window.api.fetchHome(); } catch(e) { data = null; }

    const sectionTitle = data?.section_title || 'Evening Snacks';
    const products = data?.products || [];
    const buyAgain = data?.buy_again || [];

    const productCards = products.slice(0, 4).map((p) => {
        const badge = p.bestseller
            ? `<div class="absolute top-3 left-3 bg-vibrant-yellow text-on-surface font-label-sm px-3 py-1 rounded-md shadow-sm font-semibold text-xs">Bestseller</div>`
            : p.is_new
            ? `<div class="absolute top-3 left-3 bg-royal-purple/20 text-royal-purple font-label-sm px-3 py-1 rounded-md font-semibold text-xs backdrop-blur-sm">New</div>`
            : '';
        return `
        <div class="bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative border border-surface-variant/30 flex flex-col justify-between">
            <div class="h-36 sm:h-40 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
                <img class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.image_alt || p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">
                ${badge}
            </div>
            <div class="p-3.5 sm:p-4">
                <p class="font-label-lg font-semibold text-sm truncate mb-1 text-on-surface">${p.name}</p>
                <p class="text-xs text-on-surface-variant mb-2">${p.size || p.unit}</p>
                <div class="flex justify-between items-center">
                    <p class="font-bold text-sm text-on-surface">₹${p.price}</p>
                    <button class="bg-emerald text-white rounded-full px-4 py-1 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all add-to-cart-btn" data-id="${p.id}">Add</button>
                </div>
            </div>
        </div>`;
    }).join('');

    const buyAgainCards = buyAgain.map(p => `
        <div class="flex-none w-40 sm:w-44 snap-start bg-surface rounded-[2rem] p-3.5 sm:p-4 shadow-sm border border-surface-variant/30 hover:border-emerald transition-all">
            <div class="h-28 bg-surface-container-high rounded-[1.5rem] mb-3 relative overflow-hidden flex items-center justify-center">
                <img class="object-cover w-full h-full mix-blend-multiply" src="${p.image_url}" alt="${p.image_alt || p.name}" onerror="this.src='https://images.unsplash.com/photo-1568651316335-714a806283db?w=300'">
                <button class="absolute bottom-2 right-2 bg-emerald text-white rounded-full p-1.5 shadow-lg hover:opacity-90 active:scale-90 transition-all add-to-cart-btn" data-id="${p.id}">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">add</span>
                </button>
            </div>
            <p class="font-label-lg font-semibold text-xs truncate text-on-surface">${p.name}</p>
            <p class="text-xs text-on-surface-variant font-bold mt-0.5">₹${p.price}</p>
        </div>
    `).join('');

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar (Web) -->
    <header class="hidden md:flex justify-between items-center px-margin-desktop py-sm w-full z-50 fixed top-0 bg-surface/80 backdrop-blur-3xl border-b border-glass-border">
        <div class="flex items-center gap-md">
            <a href="#/" class="font-display text-display text-primary tracking-tighter text-2xl font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-emerald text-3xl" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                LPUQuick
            </a>
            <div class="flex items-center bg-surface-container-high rounded-full px-4 py-1.5 text-on-surface-variant font-label-sm text-xs">
                <span class="material-symbols-outlined text-emerald text-sm mr-1.5" style="font-variation-settings: 'FILL' 1;">location_on</span>
                <span>Delivery to BH2 · 7 mins</span>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="relative w-72">
                <input class="w-full pl-10 pr-4 py-2 rounded-full border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-xs shadow-sm" placeholder="Search snacks, groceries or ask AI..." type="text" id="desktop-search">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-sm">search</span>
            </div>
            <a href="#/orders" class="p-2 text-on-surface-variant hover:text-emerald transition-colors" title="My Orders"><span class="material-symbols-outlined">receipt_long</span></a>
            <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald transition-colors relative" title="Cart">
                <span class="material-symbols-outlined">shopping_cart</span>
            </a>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors" title="Settings"><span class="material-symbols-outlined">settings</span></a>
        </div>
    </header>

    <!-- TopAppBar (Mobile) -->
    <header class="md:hidden flex justify-between items-center px-margin-mobile py-3 w-full z-50 fixed top-0 bg-surface/80 backdrop-blur-3xl border-b border-glass-border">
        <div class="flex flex-col">
            <div class="flex items-center text-primary font-bold text-sm">
                <span>Delivery to BH2</span>
                <span class="material-symbols-outlined ml-0.5 text-xs text-emerald">expand_more</span>
            </div>
            <span class="text-on-surface-variant text-[11px]">7 mins ETA · LPU Campus</span>
        </div>
        <div class="flex items-center gap-1.5">
            <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald transition-colors relative">
                <span class="material-symbols-outlined text-xl">shopping_cart</span>
            </a>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined text-xl">account_circle</span></a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="pt-20 md:pt-28 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-8">
        <!-- Search (Mobile) -->
        <section class="md:hidden relative w-full">
            <input class="w-full pl-11 pr-4 py-3 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md text-sm shadow-sm" placeholder="Search or ask Flow Assist..." type="text" id="mobile-search">
            <span class="material-symbols-outlined absolute left-3.5 top-3 text-royal-purple text-lg" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        </section>

        <!-- Dynamic Time Section -->
        <section>
            <div class="flex justify-between items-end mb-4">
                <div>
                    <h2 class="font-headline-md text-xl sm:text-2xl font-bold text-on-surface flex items-center gap-2">
                        <span>${sectionTitle}</span>
                        <span class="text-xs bg-emerald/10 text-emerald font-semibold px-2.5 py-0.5 rounded-full">Live Menu</span>
                    </h2>
                </div>
                <a class="text-xs font-semibold text-emerald hover:text-primary transition-colors flex items-center gap-0.5" href="#/categories">
                    See all <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">${productCards || '<p class="text-sm text-on-surface-variant">Loading live catalog...</p>'}</div>
        </section>

        <!-- Buy Again -->
        <section>
            <h2 class="font-headline-md text-lg sm:text-xl font-bold text-on-surface mb-3">Buy Again</h2>
            <div class="flex overflow-x-auto gap-3 sm:gap-4 no-scrollbar pb-3 snap-x">${buyAgainCards || ''}</div>
        </section>

        <!-- Promotional Bento -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            <a href="#/flow-assist" class="bg-royal-purple/10 border border-royal-purple/20 rounded-[2rem] p-6 sm:p-8 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:bg-royal-purple/15 transition-all shadow-sm">
                <div class="z-10 w-3/4">
                    <span class="inline-flex items-center gap-1 text-[11px] font-bold text-royal-purple bg-white/70 px-2.5 py-0.5 rounded-full mb-2">AI ASSISTANT</span>
                    <h3 class="font-headline-md text-xl sm:text-2xl font-bold text-royal-purple mb-2">Need ideas?</h3>
                    <p class="text-xs sm:text-sm text-on-surface-variant mb-5">Ask Flow Assist to build your custom snack combo for group studies or matches.</p>
                    <span class="bg-royal-purple text-white rounded-full px-5 py-2 text-xs font-semibold shadow-md hover:opacity-90 flex items-center gap-1.5 transition-opacity inline-flex">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span> Try Flow Assist
                    </span>
                </div>
                <div class="absolute -right-6 -bottom-6 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                    <span class="material-symbols-outlined text-[140px] text-royal-purple" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                </div>
            </a>

            <a href="#/categories" class="bg-emerald/10 border border-emerald/20 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative cursor-pointer hover:bg-emerald/15 transition-all shadow-sm">
                <div class="z-10 w-full">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald bg-white/70 px-2.5 py-0.5 rounded-full mb-2">7-MIN DELIVERY</span>
                            <h3 class="font-headline-md text-xl sm:text-2xl font-bold text-emerald">Campus Night Cravings</h3>
                        </div>
                        <span class="material-symbols-outlined text-emerald bg-emerald/20 p-2.5 rounded-2xl" style="font-variation-settings: 'FILL' 1;">local_pizza</span>
                    </div>
                    <p class="text-xs sm:text-sm text-on-surface-variant mb-4">Open till 2 AM across all LPU Hostels. Get hot noodles, iced beverages & munchies delivered.</p>
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
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = btn.dataset.id;
            const origHtml = btn.innerHTML;
            btn.innerHTML = '<span class="material-symbols-outlined text-xs">check</span>';
            btn.classList.add('bg-primary');
            try {
                await window.api.addToCart(window.CURRENT_USER_ID || 'user_001', productId, 1);
            } catch(err) {
                console.error(err);
            }
            setTimeout(() => {
                btn.innerHTML = origHtml;
                btn.classList.remove('bg-primary');
            }, 800);
        };
    });

    // Search redirect
    ['desktop-search', 'mobile-search'].forEach(id => {
        const input = document.getElementById(id);
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                window.location.hash = '#/categories';
            }
        });
    });
};

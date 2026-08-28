// Home Page — exact Stitch UI reproduction with dynamic content
window.pages.home = async function() {
    let data;
    try { data = await api.fetchHome(); } catch(e) { data = null; }

    const sectionTitle = data?.section_title || 'Evening Snacks';
    const products = data?.products || [];
    const buyAgain = data?.buy_again || [];

    const productCards = products.slice(0, 4).map((p, i) => {
        const badge = p.bestseller
            ? `<div class="absolute top-3 left-3 bg-vibrant-yellow text-on-surface font-label-sm px-3 py-1 rounded-md shadow-sm font-semibold">Bestseller</div>`
            : p.is_new
            ? `<div class="absolute top-3 left-3 bg-royal-purple/20 text-royal-purple font-label-sm px-3 py-1 rounded-md font-semibold backdrop-blur-sm">New</div>`
            : '';
        return `
        <div class="bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
            <div class="h-40 bg-surface-container-high relative overflow-hidden">
                <img class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" src="${p.image_url}" alt="${p.image_alt || p.name}">
                ${badge}
            </div>
            <div class="p-4">
                <p class="font-label-lg truncate mb-2">${p.name}</p>
                <div class="flex justify-between items-center">
                    <p class="font-body-md font-semibold">₹${p.price}</p>
                    <button class="bg-emerald text-on-primary rounded-full px-4 py-1.5 font-label-sm shadow-md hover:opacity-90 transition-opacity add-to-cart-btn" data-id="${p.id}">Add</button>
                </div>
            </div>
        </div>`;
    }).join('');

    const buyAgainCards = buyAgain.map(p => `
        <div class="flex-none w-44 snap-start bg-surface rounded-[2rem] p-4 shadow-sm border border-transparent hover:border-emerald transition-all">
            <div class="h-28 bg-surface-container-high rounded-[1.5rem] mb-4 relative overflow-hidden flex items-center justify-center">
                <img class="object-cover w-full h-full mix-blend-multiply" src="${p.image_url}" alt="${p.image_alt || p.name}">
                <button class="absolute bottom-2 right-2 bg-emerald text-on-primary rounded-full p-1.5 shadow-lg hover:opacity-90 transition-opacity add-to-cart-btn" data-id="${p.id}">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">add</span>
                </button>
            </div>
            <p class="font-label-lg truncate">${p.name}</p>
            <p class="font-body-md text-on-surface-variant font-semibold">₹${p.price}</p>
        </div>
    `).join('');

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar (Web) -->
    <header class="hidden md:flex justify-between items-center px-margin-desktop py-sm w-full z-50 fixed top-0 bg-surface/70 backdrop-blur-3xl border-b border-glass-border">
        <div class="flex items-center gap-md">
            <h1 class="font-display text-display text-primary tracking-tighter">LPUQuick</h1>
            <div class="flex items-center bg-surface-container-high rounded-full px-4 py-2 text-on-surface-variant font-label-sm">
                <span class="material-symbols-outlined mr-2" style="font-variation-settings: 'FILL' 1;">location_on</span>
                <span>Delivery to BH2 · 7 mins</span>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <div class="relative w-64">
                <input class="w-full pl-10 pr-4 py-2 rounded-full border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md shadow-sm" placeholder="Search or ask Flow Assist..." type="text" id="desktop-search">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">search</span>
            </div>
            <button class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">notifications</span></button>
            <button class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">account_circle</span></button>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">settings</span></a>
        </div>
    </header>
    <!-- TopAppBar (Mobile) -->
    <header class="md:hidden flex justify-between items-center px-margin-mobile py-sm w-full z-50 fixed top-0 bg-surface/70 backdrop-blur-3xl border-b border-glass-border">
        <div class="flex flex-col">
            <div class="flex items-center text-primary font-bold font-label-lg">
                <span>Delivery to BH2</span>
                <span class="material-symbols-outlined ml-1 text-sm">expand_more</span>
            </div>
            <span class="text-on-surface-variant font-label-sm">7 mins</span>
        </div>
        <div class="flex items-center gap-2">
            <button class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">notifications</span></button>
            <button class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">account_circle</span></button>
            <a href="#/settings" class="p-2 text-on-surface-variant hover:text-emerald transition-colors"><span class="material-symbols-outlined">settings</span></a>
        </div>
    </header>
    <!-- Main Content -->
    <main class="pt-24 md:pt-32 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto space-y-xl">
        <!-- Search (Mobile) -->
        <section class="md:hidden relative w-full">
            <input class="w-full pl-12 pr-4 py-3 rounded-xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald focus:ring-1 focus:ring-emerald transition-all font-body-md shadow-sm" placeholder="Search or ask Flow Assist..." type="text" id="mobile-search">
            <span class="material-symbols-outlined absolute left-4 top-3.5 text-royal-purple" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
        </section>
        <!-- Dynamic Section -->
        <section>
            <div class="flex justify-between items-end mb-lg">
                <h2 class="font-headline-md text-headline-md">${sectionTitle}</h2>
                <a class="font-label-lg text-emerald hover:text-primary transition-colors" href="#/categories">See all</a>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-gutter">${productCards}</div>
        </section>
        <!-- Buy Again -->
        <section>
            <h2 class="font-headline-md text-headline-md mb-lg">Buy Again</h2>
            <div class="flex overflow-x-auto gap-md no-scrollbar pb-6 snap-x">${buyAgainCards}</div>
        </section>
        <!-- Promotional Bento -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-2xl">
            <a href="#/flow-assist" class="bg-royal-purple/10 border border-royal-purple/20 rounded-[2rem] p-8 flex items-center justify-between overflow-hidden relative group cursor-pointer hover:bg-royal-purple/15 transition-colors">
                <div class="z-10 w-2/3">
                    <h3 class="font-headline-md text-royal-purple mb-2">Need ideas?</h3>
                    <p class="font-body-md text-on-surface-variant mb-6">Ask Flow Assist to build your perfect snack combo.</p>
                    <span class="bg-royal-purple text-on-primary rounded-full px-6 py-2.5 font-label-lg shadow-lg hover:opacity-90 flex items-center gap-2 transition-opacity inline-flex">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span> Try Now
                    </span>
                </div>
                <div class="absolute -right-8 -bottom-8 opacity-20 group-hover:opacity-30 transition-opacity">
                    <span class="material-symbols-outlined text-[160px] text-royal-purple" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
                </div>
            </a>
            <div class="bg-emerald/10 border border-emerald/20 rounded-[2rem] p-8 flex flex-col justify-center items-start overflow-hidden relative cursor-pointer hover:bg-emerald/15 transition-colors">
                <div class="z-10 w-full">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="font-headline-md text-emerald">Late Night Cravings</h3>
                        <span class="material-symbols-outlined text-emerald bg-emerald/20 p-2 rounded-full" style="font-variation-settings: 'FILL' 1;">local_pizza</span>
                    </div>
                    <p class="font-body-md text-on-surface-variant mb-4">Open till 2 AM. Get it hot and fast.</p>
                </div>
            </div>
        </section>
    </main>
    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/70 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home</span>
                <span class="font-label-sm text-label-sm mt-1">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Categories</span>
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

window.pageInits.home = function() {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const productId = btn.dataset.id;
            btn.textContent = '✓';
            btn.classList.add('bg-primary');
            await api.addToCart(CURRENT_USER_ID, productId);
            setTimeout(() => { btn.textContent = 'Add'; btn.classList.remove('bg-primary'); }, 1000);
        });
    });

    // Search handlers
    ['desktop-search', 'mobile-search'].forEach(id => {
        const input = document.getElementById(id);
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                navigate('/flow-assist');
            }
        });
    });
};

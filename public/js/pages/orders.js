// Orders Page — exact Stitch UI with WebSocket live tracking & order history
window.pages.orders = async function() {
    let ordersData;
    try { ordersData = await api.getOrders(CURRENT_USER_ID); } catch(e) { ordersData = { active: [], past: [] }; }
    
    let activeData;
    try { activeData = await api.getActiveOrder(CURRENT_USER_ID); } catch(e) { activeData = { active: null }; }

    const activeOrder = activeData.active || (ordersData.active && ordersData.active[0]);
    const pastOrders = ordersData.past || [];

    const pastRows = pastOrders.map(o => `
        <div class="glass-card rounded-2xl p-4 border border-glass-border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-on-surface">Order #${o.id.replace('order_', '')}</span>
                    <span class="text-[11px] bg-emerald/10 text-emerald font-semibold px-2 py-0.5 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-on-surface-variant line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-on-surface-variant">${new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-variant/30">
                <span class="font-bold text-sm text-on-surface">₹${o.total}</span>
                <button class="bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 text-on-surface text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all reorder-btn">
                    Reorder
                </button>
            </div>
        </div>
    `).join('');

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-headline-md text-on-surface">Orders & Tracking</h1>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto pt-6 space-y-8">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-4">
            <div class="flex justify-between items-center">
                <h2 class="font-headline-md text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse"></span>
                    Live Delivery
                </h2>
                <span class="text-xs bg-emerald/10 text-emerald font-bold px-3 py-1 rounded-full" id="tracking-eta">
                    Arriving in 5 mins
                </span>
            </div>

            <div class="glass-card rounded-3xl overflow-hidden border border-glass-border shadow-md">
                <!-- Map Simulation Canvas/Pattern -->
                <div class="h-48 relative bg-surface-container-high map-pattern overflow-hidden flex items-center justify-center p-4">
                    <!-- Simulated Road Path SVG -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 50 120 Q 200 60 400 130 T 700 90" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-dasharray="6,6" style="animation: dash 1s linear infinite;"/>
                    </svg>

                    <!-- Rider Pin -->
                    <div class="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-10" id="rider-pin" style="left: 45%; top: 40%;">
                        <div class="relative">
                            <div class="w-10 h-10 rounded-full bg-emerald text-white flex items-center justify-center shadow-lg border-2 border-white">
                                <span class="material-symbols-outlined text-xl">two_wheeler</span>
                            </div>
                            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap" id="rider-badge">
                                ${activeOrder.rider_name || 'Alex'} · On the way
                            </div>
                        </div>
                    </div>

                    <!-- Destination Pin (BH2) -->
                    <div class="absolute right-12 top-16 transform translate-x-1/2 -translate-y-1/2 z-10">
                        <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                            <span class="material-symbols-outlined text-lg">home</span>
                        </div>
                        <span class="block bg-surface text-on-surface text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-1 text-center">BH2</span>
                    </div>
                </div>

                <!-- Order Details & Progress -->
                <div class="p-6 space-y-5">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p class="text-xs text-on-surface-variant" id="tracking-status-msg">
                                ${activeOrder.rider_name || 'Alex'} is on the way with your groceries.
                            </p>
                            <h3 class="font-bold text-base text-on-surface mt-0.5">Order #${activeOrder.id.replace('order_', '')}</h3>
                        </div>
                        <div class="flex items-center gap-3 bg-surface-container-high rounded-2xl p-2.5 px-4">
                            <div class="w-9 h-9 rounded-full bg-emerald/20 text-emerald flex items-center justify-center font-bold text-sm">
                                ${(activeOrder.rider_name || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-semibold text-xs text-on-surface">${activeOrder.rider_name || 'Alex'}</p>
                                <p class="text-[11px] text-on-surface-variant">LPU Quick Rider</p>
                            </div>
                            <a href="tel:7671836211" class="ml-2 w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center hover:opacity-90">
                                <span class="material-symbols-outlined text-sm">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Progress Step Indicator -->
                    <div class="space-y-2">
                        <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div class="bg-emerald h-full rounded-full transition-all duration-700" id="order-progress-bar" style="width: 65%;"></div>
                        </div>
                        <div class="flex justify-between text-[11px] font-medium text-on-surface-variant">
                            <span class="text-emerald font-semibold">Accepted</span>
                            <span class="text-emerald font-semibold">Packed</span>
                            <span class="text-emerald font-semibold" id="step-enroute">On the way</span>
                            <span id="step-delivered">Delivered</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : `
        <section class="glass-card rounded-3xl p-8 text-center border border-glass-border">
            <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-2">local_shipping</span>
            <p class="font-semibold text-on-surface">No active deliveries right now</p>
            <p class="text-xs text-on-surface-variant mt-1">Place an order to see live real-time GPS tracking.</p>
        </section>
        `}

        <!-- Past Orders History -->
        <section class="space-y-4">
            <h2 class="font-headline-md text-lg font-bold text-on-surface">Past Orders</h2>
            <div class="space-y-3">
                ${pastRows || '<p class="text-sm text-on-surface-variant">No past orders yet.</p>'}
            </div>
        </section>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/70 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-label-sm mt-1 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/orders">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="font-label-sm text-label-sm mt-1">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.orders = function() {
    // Reorder button click
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            btn.textContent = 'Adding...';
            await api.addToCart(CURRENT_USER_ID, 'prod_s01', 2);
            await api.addToCart(CURRENT_USER_ID, 'prod_b01', 1);
            navigate('/cart');
        });
    });

    // WebSocket connection for live rider tracking simulation
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/track/order_active01`;

    try {
        const ws = new WebSocket(wsUrl);
        const pin = document.getElementById('rider-pin');
        const etaEl = document.getElementById('tracking-eta');
        const msgEl = document.getElementById('tracking-status-msg');
        const progressBar = document.getElementById('order-progress-bar');
        const stepDelivered = document.getElementById('step-delivered');

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.status) {
                if (etaEl) etaEl.textContent = data.eta_minutes > 0 ? `Arriving in ${data.eta_minutes} mins` : 'Arrived!';
                if (msgEl && data.message) msgEl.textContent = data.message;
                if (progressBar && data.progress !== undefined) progressBar.style.width = `${Math.max(25, data.progress)}%`;

                // Move pin smoothly across canvas
                if (pin && data.progress !== undefined) {
                    const leftPct = 25 + (data.progress * 0.55);
                    const topPct = 50 - Math.sin((data.progress / 100) * Math.PI) * 20;
                    pin.style.left = `${leftPct}%`;
                    pin.style.top = `${topPct}%`;
                }

                if (data.status === 'delivered' && stepDelivered) {
                    stepDelivered.classList.add('text-emerald', 'font-semibold');
                }
            }
        };

        ws.onerror = (err) => console.log('WS tracking connection info:', err);
    } catch(e) {
        console.log('WS tracking init note:', e);
    }
};

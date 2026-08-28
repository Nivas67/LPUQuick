// Orders Page — exact Stitch UI with WebSocket live tracking & order history
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.orders = async function() {
    const userId = window.CURRENT_USER_ID || 'user_001';
    let ordersData;
    try { ordersData = await window.api.getOrders(userId); } catch(e) { ordersData = { active: [], past: [] }; }
    
    let activeData;
    try { activeData = await window.api.getActiveOrder(userId); } catch(e) { activeData = { active: null }; }

    const activeOrder = activeData?.active || (ordersData?.active && ordersData.active[0]) || null;
    const pastOrders = ordersData?.past || [];

    const pastRows = pastOrders.map(o => `
        <div class="glass-card rounded-2xl p-4 border border-glass-border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xs sm:text-sm text-on-surface">Order #${o.id.replace('order_', '')}</span>
                    <span class="text-[10px] bg-emerald/10 text-emerald font-bold px-2 py-0.5 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-on-surface-variant line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-on-surface-variant">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-variant/30">
                <span class="font-bold text-sm text-on-surface">₹${o.total}</span>
                <button class="bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 text-on-surface text-xs font-semibold px-3 py-1 rounded-full transition-all reorder-btn active:scale-95 cursor-pointer">
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
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Orders & Tracking</h1>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto pt-6 space-y-6">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-3">
            <div class="flex justify-between items-center">
                <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse"></span>
                    Active Delivery
                </h2>
                <span class="text-xs bg-emerald/10 text-emerald font-bold px-3 py-1 rounded-full" id="tracking-eta">
                    Arriving in 5 mins
                </span>
            </div>

            <div class="glass-card rounded-3xl overflow-hidden border border-glass-border shadow-md">
                <!-- Map Simulation Canvas/Pattern -->
                <div class="h-44 sm:h-48 relative bg-surface-container-high map-pattern overflow-hidden flex items-center justify-center p-4">
                    <!-- Road Path SVG -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 40 120 Q 180 50 360 110 T 650 80" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-dasharray="6,6" style="animation: dash 1s linear infinite;"/>
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
                    <div class="absolute right-8 sm:right-12 top-14 transform translate-x-1/2 -translate-y-1/2 z-10">
                        <div class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                            <span class="material-symbols-outlined text-lg">home</span>
                        </div>
                        <span class="block bg-surface text-on-surface text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-0.5 text-center">BH2</span>
                    </div>
                </div>

                <!-- Order Details & Progress -->
                <div class="p-5 sm:p-6 space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p class="text-xs text-on-surface-variant" id="tracking-status-msg">
                                ${activeOrder.rider_name || 'Alex'} is on the way with your order.
                            </p>
                            <h3 class="font-bold text-sm sm:text-base text-on-surface mt-0.5">Order #${activeOrder.id.replace('order_', '')} · Total ₹${activeOrder.total}</h3>
                        </div>
                        <div class="flex items-center gap-3 bg-surface-container-high rounded-2xl p-2 px-3.5">
                            <div class="w-8 h-8 rounded-full bg-emerald/20 text-emerald flex items-center justify-center font-bold text-xs">
                                ${(activeOrder.rider_name || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-semibold text-xs text-on-surface">${activeOrder.rider_name || 'Alex'}</p>
                                <p class="text-[10px] text-on-surface-variant">LPU Delivery Partner</p>
                            </div>
                            <a href="tel:7671836211" class="ml-2 w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center hover:opacity-90">
                                <span class="material-symbols-outlined text-xs">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Progress Step Indicator -->
                    <div class="space-y-2">
                        <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                            <div class="bg-emerald h-full rounded-full transition-all duration-700" id="order-progress-bar" style="width: 65%;"></div>
                        </div>
                        <div class="flex justify-between text-[10px] sm:text-xs font-medium text-on-surface-variant">
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
            <div class="w-14 h-14 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant">local_shipping</span>
            </div>
            <p class="font-bold text-sm text-on-surface">No active deliveries right now</p>
            <p class="text-xs text-on-surface-variant mt-1">Place an order to see live real-time GPS tracking.</p>
            <a href="#/" class="mt-4 inline-block bg-emerald text-white text-xs font-semibold px-4 py-2 rounded-full">Explore Store</a>
        </section>
        `}

        <!-- Past Orders History -->
        <section class="space-y-3">
            <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Past Orders</h2>
            <div class="space-y-2.5">
                ${pastRows || '<p class="text-xs text-on-surface-variant py-2">No past orders yet.</p>'}
            </div>
        </section>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/orders">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.orders = function() {
    const userId = window.CURRENT_USER_ID || 'user_001';

    // Reorder button click
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            btn.textContent = 'Adding...';
            await window.api.addToCart(userId, 'prod_s01', 2);
            await window.api.addToCart(userId, 'prod_b01', 1);
            window.location.hash = '#/cart';
        };
    });

    // Tracking simulation animation
    const pin = document.getElementById('rider-pin');
    const etaEl = document.getElementById('tracking-eta');
    const msgEl = document.getElementById('tracking-status-msg');
    const progressBar = document.getElementById('order-progress-bar');
    const stepDelivered = document.getElementById('step-delivered');

    let currentProgress = 50;
    const trackerInterval = setInterval(() => {
        if (!pin) { clearInterval(trackerInterval); return; }
        currentProgress += 5;
        if (currentProgress > 100) currentProgress = 100;

        const leftPct = 25 + (currentProgress * 0.55);
        const topPct = 50 - Math.sin((currentProgress / 100) * Math.PI) * 15;
        pin.style.left = `${leftPct}%`;
        pin.style.top = `${topPct}%`;

        if (progressBar) progressBar.style.width = `${currentProgress}%`;

        const remainingMins = Math.max(0, Math.ceil((100 - currentProgress) / 15));
        if (etaEl) {
            etaEl.textContent = remainingMins > 0 ? `Arriving in ${remainingMins} mins` : 'Arrived at BH2!';
        }

        if (currentProgress >= 100) {
            if (msgEl) msgEl.textContent = 'Order has been delivered at Hostel Gate!';
            if (stepDelivered) stepDelivered.classList.add('text-emerald', 'font-semibold');
            clearInterval(trackerInterval);
        }
    }, 2500);
};

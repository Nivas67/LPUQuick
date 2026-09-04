// Orders Page — Classical Campus Quick-Commerce Tracking & Order History
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.orders = async function() {
    if (!window.isUserLoggedIn()) {
        return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <header class="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-40 border-b border-border shadow-xs">
        <div class="flex items-center gap-3">
            <a href="#/" class="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Orders & Tracking</h1>
        </div>
    </header>

    <main class="px-4 sm:px-6 max-w-md mx-auto pt-16 text-center space-y-4">
        <div class="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-center mx-auto shadow-xs">
            <span class="material-symbols-outlined text-3xl">receipt_long</span>
        </div>
        <div class="space-y-1.5">
            <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Sign In to View Orders</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Sign in with your student account to view real-time delivery tracking and your past campus orders.
            </p>
        </div>
        <div class="pt-2">
            <a href="#/signin" onclick="localStorage.setItem('lpuquick_redirect', '#/orders')" class="inline-flex items-center justify-center gap-1.5 bg-emerald text-white px-6 py-2.5 rounded-lg font-semibold text-xs shadow-xs hover:bg-emerald-600 transition-colors">
                <span>Continue with Google</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    </main>

    <!-- Bottom Navigation Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-xs sm:hidden">
        <nav class="flex justify-around items-center h-14 max-w-md mx-auto px-2">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-medium mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-medium mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-medium mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3 py-1 cursor-pointer font-bold" href="#/orders">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="text-[10px] mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
    }

    const userId = window.CURRENT_USER_ID;
    const [ordersDataRes, activeDataRes] = await Promise.allSettled([
        window.api.getOrders(userId),
        window.api.getActiveOrder(userId)
    ]);

    const ordersData = ordersDataRes.status === 'fulfilled' ? ordersDataRes.value : { active: [], past: [] };
    const activeData = activeDataRes.status === 'fulfilled' ? activeDataRes.value : { active: null };

    function formatClientRiderName(raw) {
        if (!raw || raw === 'unassigned') return 'Alex';
        if (typeof raw === 'string' && raw.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                return parsed.name || parsed.assigned_to_name || 'Alex';
            } catch (e) {}
        }
        return raw;
    }

    const activeOrder = activeData?.active || (ordersData?.active && ordersData.active[0]) || null;
    const activeRiderName = activeOrder ? formatClientRiderName(activeOrder.rider_name) : 'Alex';
    const activeEdit = activeOrder?.delivery_assignment?.latest_edit || null;
    const pastOrders = ordersData?.past || [];
    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const hostelAddress = savedRoom ? `BH13 (${savedBlock}), Room ${savedRoom}` : 'BH13 (Block A)';
    const hostelShort = window.currentAddress || 'BH13';

    const pastRows = pastOrders.map(o => {
        const isCancelled = ['Cancelled', 'cancelled'].includes(o.status);
        const statusBadgeClass = isCancelled 
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50';
        return `
        <div class="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Order #${o.id.replace('order_', '').toUpperCase()}</span>
                    <span class="text-[10px] ${statusBadgeClass} font-semibold px-2 py-0.2 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-slate-400">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                <span class="font-bold text-sm text-slate-900 dark:text-white">₹${o.total}</span>
                <button data-order-id="${o.id}" class="bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 border border-border text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1 rounded-lg transition-colors reorder-btn cursor-pointer">
                    Reorder
                </button>
            </div>
        </div>
        `;
    }).join('');

    window.CURRENT_ACTIVE_ORDER_ID = activeOrder ? activeOrder.id : null;
    window.CURRENT_ACTIVE_ORDER_STATUS = activeOrder ? activeOrder.status : 'Order Placed';

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-40 border-b border-border shadow-xs">
        <div class="flex items-center gap-3">
            <a href="#/" class="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Live Tracking & Orders</h1>
        </div>
        <div class="flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-full font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
            <span id="orders-live-indicator">Live Connected</span>
        </div>
    </header>

    <main class="px-4 sm:px-6 max-w-4xl mx-auto pt-5 space-y-5">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-3" id="active-order-tracking-card" data-order-id="${activeOrder.id}">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald"></span>
                    Live Campus Delivery (3 Mins)
                </h2>
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1" id="tracking-eta">
                        <span class="material-symbols-outlined text-xs">bolt</span>
                        <span id="tracking-eta-time">Status: ${activeOrder.status}</span>
                    </span>
                    <button type="button" id="btn-order-help" onclick="window.openOrderHelpModal()" class="text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-0.5 rounded-lg border border-border flex items-center gap-1 transition-colors cursor-pointer" title="Order Help">
                        <span class="material-symbols-outlined text-sm text-emerald">help</span>
                        <span>Help</span>
                    </button>
                </div>
            </div>

            <div class="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
                <!-- Clean Schematic Campus Delivery Canvas -->
                <div class="h-44 sm:h-52 relative bg-slate-900 overflow-hidden flex items-center justify-center p-4 select-none border-b border-border">
                    
                    <!-- HUD Status Header -->
                    <div class="absolute top-2.5 inset-x-3 flex justify-between items-center z-30 pointer-events-none">
                        <div class="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>BH13 Corridor Runner</span>
                        </div>
                        <div class="flex items-center gap-1 bg-slate-900/90 border border-slate-700 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
                            <span class="text-emerald-400 font-bold">1.4 m/s</span>
                            <span>• Express 3m</span>
                        </div>
                    </div>

                    <!-- Clean Walking Corridor SVG -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 240">
                        <!-- Path base line -->
                        <path d="M 80 120 C 220 70, 340 170, 480 100 S 620 160, 720 120" fill="none" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
                        <!-- Emerald active dashed path -->
                        <path d="M 80 120 C 220 70, 340 170, 480 100 S 620 160, 720 120" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-dasharray="6,8"/>
                    </svg>

                    <!-- Origin: BH13 Hub Pin -->
                    <div class="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-xs">
                            <span class="material-symbols-outlined text-lg">storefront</span>
                        </div>
                        <span class="mt-1 bg-slate-900 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700">
                            BH13 Hub
                        </span>
                    </div>

                    <!-- Active Runner Pin -->
                    <div class="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500" id="rider-pin" style="left: 60%; top: 46%;">
                        <div class="relative flex flex-col items-center">
                            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald text-white flex items-center justify-center shadow-md border-2 border-white">
                                <span class="material-symbols-outlined text-xl">directions_walk</span>
                            </div>
                            <div class="mt-1 bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/50 whitespace-nowrap" id="rider-badge">
                                ${activeRiderName} · Walking
                            </div>
                        </div>
                    </div>

                    <!-- Destination: Hostel Room Pin -->
                    <div class="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-xs">
                            <span class="material-symbols-outlined text-lg text-emerald-400">apartment</span>
                        </div>
                        <span class="mt-1 bg-slate-900 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700 max-w-[90px] truncate" id="tracking-dest-label">
                            ${activeOrder.delivery_address || `${hostelShort} Room`}
                        </span>
                    </div>
                </div>

                <!-- Order Details & Progress -->
                <div class="p-4 sm:p-5 space-y-3.5">
                    <!-- Modified Order Notice -->
                    <div id="tracking-order-edited-banner" class="${activeEdit ? '' : 'hidden '}p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-slate-800 dark:text-slate-200 space-y-1 text-xs">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                                <span class="material-symbols-outlined text-base">edit_notifications</span>
                                <span id="tracking-order-edited-title">Dark Store Notice: ${activeEdit?.reason ? activeEdit.reason : 'Item Unavailable'}</span>
                            </div>
                            <span id="tracking-order-edited-total" class="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded">
                                Total: ₹<span id="tracking-order-edited-total-val">${activeOrder.total}</span>
                            </span>
                        </div>
                        <p id="tracking-order-edited-desc" class="text-[11px] text-slate-600 dark:text-slate-400">
                            ${activeEdit?.notes ? activeEdit.notes : 'Unavailable items were adjusted by the Dark Store.'}
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p class="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5" id="tracking-status-msg">
                                <span class="material-symbols-outlined text-base text-emerald">directions_walk</span>
                                <span>${activeRiderName} picked up your snacks from BH13 Hub and is walking to ${activeOrder.delivery_address || hostelAddress}.</span>
                            </p>
                            <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1" id="tracking-order-title">Order #${activeOrder.id.replace('order_', '').toUpperCase()} · Total ₹<span id="tracking-active-total">${activeOrder.total}</span> (${activeOrder.payment_method || 'Cash on Delivery'})</h3>
                        </div>
                        <div class="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 px-3 border border-border shadow-xs">
                            <div class="w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center font-bold text-xs" id="rider-avatar">
                                ${(activeRiderName || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-bold text-xs text-slate-900 dark:text-white" id="rider-name-display">${activeRiderName}</p>
                                <p class="text-[10px] text-emerald font-semibold">Campus Runner</p>
                            </div>
                            <a href="tel:7671836211" class="ml-1.5 w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center hover:bg-emerald-600 transition-colors" title="Call Runner">
                                <span class="material-symbols-outlined text-xs">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Progress Step Indicator -->
                    <div class="space-y-1.5 pt-1">
                        <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-border">
                            <div class="h-full bg-emerald rounded-full transition-all duration-500" id="order-progress-bar" style="width: 25%;"></div>
                        </div>
                        <div class="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 px-0.5">
                            <span class="text-emerald font-bold" id="step-placed">Accepted ✓</span>
                            <span id="step-packed">Packed 📦</span>
                            <span id="step-enroute">En Route 🚶</span>
                            <span id="step-delivered">Delivered 🏁</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : `
        <section class="bg-surface border border-border rounded-xl p-8 text-center shadow-xs">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
                <span class="material-symbols-outlined text-2xl">directions_walk</span>
            </div>
            <p class="font-bold text-sm text-slate-900 dark:text-white">No active deliveries</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Place an order to see live real-time campus tracking.</p>
            <a href="#/" class="mt-3.5 inline-block bg-emerald text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-xs">Explore Campus Store</a>
        </section>
        `}

        <!-- Past Orders History -->
        <section class="space-y-2.5">
            <h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Past Orders</h2>
            <div class="space-y-2">
                ${pastRows || '<p class="text-xs text-slate-500 py-2">No past orders yet.</p>'}
            </div>
        </section>
    </main>

    <!-- Order Help Modal -->
    <div id="order-help-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs hidden flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl max-w-sm w-full p-5 shadow-xl border border-border space-y-3.5">
            <div class="flex items-center justify-between border-b border-border pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                        <span class="material-symbols-outlined text-base">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Order Support</h3>
                        <p class="text-[10px] text-slate-500">Order #${activeOrder ? activeOrder.id.replace('order_', '').toUpperCase() : ''}</p>
                    </div>
                </div>
                <button type="button" id="btn-close-help-modal" onclick="window.closeOrderHelpModal()" class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2">
                <!-- Option 1: Call Delivery Agent -->
                <a href="tel:7671836211" class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border transition-colors">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-emerald text-white flex items-center justify-center">
                            <span class="material-symbols-outlined text-base">call</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-xs text-slate-900 dark:text-white">1. Call Delivery Agent</h4>
                            <p class="text-[10px] text-slate-500">${activeOrder?.rider_name || 'Alex'} · 7671836211</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                </a>

                <!-- Option 2: Change Address -->
                <button type="button" id="btn-help-change-address" onclick="window.changeHelpOrderAddress()" class="w-full text-left flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border transition-colors cursor-pointer">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center">
                            <span class="material-symbols-outlined text-base">location_on</span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-xs text-slate-900 dark:text-white">2. Change Address</h4>
                            <p class="text-[10px] text-slate-500 truncate max-w-[180px]" id="help-current-address-label">${activeOrder?.delivery_address || hostelAddress}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                </button>

                <!-- Option 3: Cancel Order -->
                ${(() => {
                    const isFrozen = activeOrder && ['Out for Delivery', 'out for delivery', 'Delivered', 'delivered'].includes(activeOrder.status);
                    return `
                    <button type="button" id="btn-help-cancel-order" onclick="window.cancelHelpOrder()" ${isFrozen ? 'disabled' : ''} class="w-full text-left flex items-center justify-between p-3 rounded-xl ${isFrozen ? 'bg-slate-50 dark:bg-slate-800/40 opacity-50 border border-border cursor-not-allowed' : 'bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 cursor-pointer'} transition-colors">
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-lg ${isFrozen ? 'bg-slate-300 text-slate-600' : 'bg-rose-600 text-white'} flex items-center justify-center">
                                <span class="material-symbols-outlined text-base">${isFrozen ? 'lock' : 'cancel'}</span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-xs ${isFrozen ? 'text-slate-400' : 'text-rose-700 dark:text-rose-400'}">
                                    3. Cancel Order ${isFrozen ? '<span class="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded ml-1">Locked</span>' : ''}
                                </h4>
                                <p class="text-[10px] text-slate-500" id="help-cancel-desc">
                                    ${isFrozen ? 'Order packed and out for delivery.' : 'Cancel delivery and receive refund'}
                                </p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined ${isFrozen ? 'text-slate-400' : 'text-rose-600'} text-sm">${isFrozen ? 'lock' : 'chevron_right'}</span>
                    </button>
                    `;
                })()}
            </div>
        </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-xs sm:hidden">
        <nav class="flex justify-around items-center h-14 max-w-md mx-auto px-2">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-medium mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-medium mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-medium mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3 py-1 cursor-pointer font-bold" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="text-[10px] mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.orders = function() {
    const effectiveUserId = (window.isUserLoggedIn() ? window.CURRENT_USER_ID : (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : 'user_guest'));
    const hostelShort = window.currentAddress || 'BH13';
    const hostelAddress = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
    const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;

    // Reorder button click
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            if (!orderId) return;

            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-xs animate-spin">sync</span><span>Adding...</span>';
            try {
                const res = await window.api.reorder(orderId, effectiveUserId);
                btn.innerHTML = '<span class="material-symbols-outlined text-xs">check</span><span>Added!</span>';
                if (typeof showClientToast === 'function') {
                    showClientToast('✓ Items added to cart!', 'success', 'shopping_cart');
                }
                setTimeout(() => {
                    window.location.hash = '#/cart';
                }, 350);
            } catch (err) {
                btn.textContent = 'Reorder';
                btn.disabled = false;
                console.error('[Reorder Error]:', err);
                if (typeof showClientToast === 'function') {
                    showClientToast('Could not reorder items: ' + err.message, 'error', 'error');
                } else {
                    alert('Could not reorder items: ' + err.message);
                }
            }
        };
    });

    const pin = document.getElementById('rider-pin');
    const etaTimeEl = document.getElementById('tracking-eta-time');
    const msgEl = document.getElementById('tracking-status-msg');
    const progressBar = document.getElementById('order-progress-bar');
    const stepPlaced = document.getElementById('step-placed');
    const stepPacked = document.getElementById('step-packed');
    const stepEnroute = document.getElementById('step-enroute');
    const stepDelivered = document.getElementById('step-delivered');
    const liveIndicator = document.getElementById('orders-live-indicator');
    const riderNameDisplay = document.getElementById('rider-name-display');
    const riderAvatar = document.getElementById('rider-avatar');
    const riderBadge = document.getElementById('rider-badge');

    let currentOrderStatus = window.CURRENT_ACTIVE_ORDER_STATUS || 'Order Placed';

    window.updateHelpModalCancelState = function(status) {
        currentOrderStatus = status;
        window.CURRENT_ACTIVE_ORDER_STATUS = status;
        const cancelBtn = document.getElementById('btn-help-cancel-order');
        if (!cancelBtn) return;

        const s = (status || '').toLowerCase();
        const isFrozen = ['out for delivery', 'delivered'].includes(s);

        if (isFrozen) {
            cancelBtn.disabled = true;
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 opacity-50 border border-border cursor-not-allowed transition-colors select-none';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-slate-300 text-slate-600 flex items-center justify-center">
                        <span class="material-symbols-outlined text-base">lock</span>
                    </div>
                    <div>
                        <h4 class="font-semibold text-xs text-slate-400 flex items-center gap-1">
                            <span>3. Cancel Order</span>
                            <span class="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">Locked</span>
                        </h4>
                        <p class="text-[10px] text-slate-500" id="help-cancel-desc">
                            Order packed and out for delivery.
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-slate-400 text-sm">lock</span>
            `;
        } else {
            cancelBtn.disabled = false;
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/50 cursor-pointer transition-colors';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                        <span class="material-symbols-outlined text-base">cancel</span>
                    </div>
                    <div>
                        <h4 class="font-semibold text-xs text-rose-700 dark:text-rose-400">3. Cancel Order</h4>
                        <p class="text-[10px] text-slate-500" id="help-cancel-desc">
                            Cancel delivery and receive refund
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-rose-600 text-sm">chevron_right</span>
            `;
        }
    };

    window.openOrderHelpModal = function() {
        const modal = document.getElementById('order-help-modal');
        if (modal) {
            window.updateHelpModalCancelState(window.CURRENT_ACTIVE_ORDER_STATUS || currentOrderStatus || 'Order Placed');
            modal.classList.remove('hidden');
        }
    };

    window.closeOrderHelpModal = function() {
        const modal = document.getElementById('order-help-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.changeHelpOrderAddress = async function() {
        const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;
        if (!activeOrderId) return alert('No active order found.');

        const currentLabel = document.getElementById('help-current-address-label');
        const current = currentLabel ? currentLabel.textContent : (window.currentAddressDetail?.label || 'BH13 (Block A), Room 304');
        const newRoom = prompt('Enter updated hostel block & room number for fast delivery:', current);
        if (newRoom && newRoom.trim() && newRoom.trim() !== current) {
            const trimmed = newRoom.trim();
            try {
                await window.api.changeOrderAddress(activeOrderId, trimmed);
                if (currentLabel) currentLabel.textContent = trimmed;
                const destLabel = document.getElementById('tracking-dest-label');
                if (destLabel) destLabel.textContent = trimmed;
                if (msgEl) {
                    msgEl.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald">directions_walk</span><span>Delivery address updated to <b>${trimmed}</b>. Runner notified!</span>`;
                }
                alert(`✓ Delivery address updated to: ${trimmed}`);
                window.closeOrderHelpModal();
            } catch (err) {
                alert('Could not update address: ' + err.message);
            }
        }
    };

    window.cancelHelpOrder = async function() {
        const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;
        if (!activeOrderId) return alert('No active order found.');

        const s = (window.CURRENT_ACTIVE_ORDER_STATUS || currentOrderStatus || '').toLowerCase();
        if (['out for delivery', 'delivered'].includes(s)) {
            alert('⚠️ Order is already packed and out for delivery with the campus runner. It can no longer be cancelled.');
            return;
        }

        const confirmed = confirm('Are you sure you want to cancel this order? Instant refund will be initiated.');
        if (!confirmed) return;

        try {
            const cancelBtn = document.getElementById('btn-help-cancel-order');
            if (cancelBtn) {
                cancelBtn.disabled = true;
                cancelBtn.textContent = 'Cancelling...';
            }
            await window.api.cancelOrder(activeOrderId, 'Cancelled by student via Help Menu');
            window.applyOrderStatusUI('Cancelled');
            window.closeOrderHelpModal();
        } catch (err) {
            alert('Could not cancel order: ' + err.message);
            const cancelBtn = document.getElementById('btn-help-cancel-order');
            if (cancelBtn) cancelBtn.disabled = false;
        }
    };

    function formatClientRiderName(raw) {
        if (!raw || raw === 'unassigned') return 'Alex';
        if (typeof raw === 'string' && raw.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                return parsed.name || parsed.assigned_to_name || 'Alex';
            } catch (e) {}
        }
        return raw;
    }

    // Live status UI updater
    window.applyOrderStatusUI = function(status, riderName) {
        if (!status) return;
        currentOrderStatus = status;
        window.CURRENT_ACTIVE_ORDER_STATUS = status;
        if (typeof window.updateHelpModalCancelState === 'function') {
            window.updateHelpModalCancelState(status);
        }
        
        const rider = formatClientRiderName(riderName);
        const rName = document.getElementById('rider-name-display');
        const rAvatar = document.getElementById('rider-avatar');
        const rBadge = document.getElementById('rider-badge');
        const pBar = document.getElementById('order-progress-bar');
        const etaText = document.getElementById('tracking-eta-time');
        const statusMsg = document.getElementById('tracking-status-msg');
        const riderPin = document.getElementById('rider-pin');
        
        const sPlaced = document.getElementById('step-placed');
        const sPacked = document.getElementById('step-packed');
        const sEnroute = document.getElementById('step-enroute');
        const sDelivered = document.getElementById('step-delivered');

        if (rName) rName.textContent = rider;
        if (rAvatar) rAvatar.textContent = rider[0];
        if (rBadge) rBadge.textContent = `${rider} · Walking`;

        const s = status.trim().toLowerCase();

        if (pBar) {
            pBar.style.height = '100%';
            pBar.style.transition = 'width 0.5s ease';
        }

        if (s === 'order placed' || s === 'pending') {
            if (pBar) {
                pBar.style.width = '25%';
                pBar.className = 'h-full bg-emerald rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Order Placed';
            if (statusMsg) statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-emerald">storefront</span><span>BH13 Dark Store received your order and is verifying items.</span>';
            if (riderPin) {
                riderPin.style.left = '20%';
                riderPin.style.top = '48%';
            }
            if (sPlaced) sPlaced.className = 'text-emerald font-bold';
            if (sPacked) sPacked.className = 'text-slate-500 font-medium';
            if (sEnroute) sEnroute.className = 'text-slate-500 font-medium';
            if (sDelivered) sDelivered.className = 'text-slate-500 font-medium';
        } else if (s === 'order confirmed' || s === 'confirmed' || s === 'accepted') {
            if (pBar) {
                pBar.style.width = '45%';
                pBar.className = 'h-full bg-emerald rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Confirmed (3 mins)';
            if (statusMsg) statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-emerald">check_circle</span><span>BH13 Dark Store confirmed your order. Bag packing started!</span>';
            if (riderPin) {
                riderPin.style.left = '36%';
                riderPin.style.top = '44%';
            }
            if (sPlaced) sPlaced.className = 'text-emerald font-bold';
            if (sPacked) sPacked.className = 'text-emerald font-bold';
            if (sEnroute) sEnroute.className = 'text-slate-500 font-medium';
            if (sDelivered) sDelivered.className = 'text-slate-500 font-medium';
        } else if (s === 'preparing' || s === 'packed') {
            if (pBar) {
                pBar.style.width = '65%';
                pBar.className = 'h-full bg-emerald rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Packed & Ready (2 mins)';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">inventory_2</span><span>Snacks sealed in bag. Runner ${rider} at dispatch counter.</span>`;
            if (riderPin) {
                riderPin.style.left = '52%';
                riderPin.style.top = '50%';
            }
            if (sPlaced) sPlaced.className = 'text-emerald font-bold';
            if (sPacked) sPacked.className = 'text-emerald font-bold';
            if (sEnroute) sEnroute.className = 'text-slate-500 font-medium';
            if (sDelivered) sDelivered.className = 'text-slate-500 font-medium';
        } else if (s === 'out for delivery' || s === 'en_route') {
            if (pBar) {
                pBar.style.width = '85%';
                pBar.className = 'h-full bg-emerald rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Out for Delivery (1 min)';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">directions_walk</span><span>${rider} picked up your snacks and is walking to ${hostelAddress}!</span>`;
            if (riderPin) {
                riderPin.style.left = '68%';
                riderPin.style.top = '45%';
            }
            if (sPlaced) sPlaced.className = 'text-emerald font-bold';
            if (sPacked) sPacked.className = 'text-emerald font-bold';
            if (sEnroute) sEnroute.className = 'text-emerald font-bold';
            if (sDelivered) sDelivered.className = 'text-slate-500 font-medium';
        } else if (s === 'delivered') {
            if (pBar) {
                pBar.style.width = '100%';
                pBar.className = 'h-full bg-emerald rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Delivered ✓';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">task_alt</span><span>Arrived at ${hostelAddress}! Please collect your items.</span>`;
            if (riderPin) {
                riderPin.style.left = '80%';
                riderPin.style.top = '50%';
            }
            if (sPlaced) sPlaced.className = 'text-emerald font-bold';
            if (sPacked) sPacked.className = 'text-emerald font-bold';
            if (sEnroute) sEnroute.className = 'text-emerald font-bold';
            if (sDelivered) sDelivered.className = 'text-emerald font-bold';

            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3500);
        } else if (s === 'cancelled') {
            if (pBar) {
                pBar.style.width = '100%';
                pBar.className = 'h-full bg-rose-600 rounded-full';
            }
            if (etaText) etaText.textContent = 'Status: Cancelled ✕';
            if (statusMsg) {
                statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-rose-600">cancel</span><span class="text-rose-600 font-medium">Order cancelled. Refund initiated.</span>';
            }
            if (riderPin) {
                riderPin.style.left = '50%';
                riderPin.style.top = '50%';
            }
            if (sPlaced) sPlaced.className = 'text-rose-600 font-bold';
            if (sPacked) sPacked.className = 'text-slate-500 font-medium';
            if (sEnroute) sEnroute.className = 'text-slate-500 font-medium';
            if (sDelivered) sDelivered.className = 'text-slate-500 font-medium';

            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3000);
        }
    };

    window.applyOrderStatusUI(currentOrderStatus, 'Alex');

    if (!activeOrderId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/track/${activeOrderId}`;
    let ws = null;
    let ordersPoll = null;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (liveIndicator) liveIndicator.textContent = 'Live GPS Sync';
        };

        function handleClientOrderEdited(data) {
            if (!data) return;
            const banner = document.getElementById('tracking-order-edited-banner');
            const titleEl = document.getElementById('tracking-order-edited-title');
            const totalEl = document.getElementById('tracking-order-edited-total-val');
            const descEl = document.getElementById('tracking-order-edited-desc');
            const totalText = document.getElementById('tracking-active-total');

            const edit = data.edit || data.order?.delivery_assignment?.latest_edit || {};
            const newTotal = data.order?.total !== undefined ? data.order.total : edit.new_total;

            if (totalText && newTotal !== undefined) {
                totalText.textContent = newTotal;
            }
            if (totalEl && newTotal !== undefined) {
                totalEl.textContent = newTotal;
            }
            if (titleEl && edit.reason) {
                titleEl.textContent = `Dark Store Notice: ${edit.reason}`;
            }
            if (descEl && (edit.notes || edit.reason)) {
                descEl.textContent = edit.notes || 'One or more unavailable items were removed or adjusted by the Dark Store. Your bill has been updated.';
            }
            if (banner) {
                banner.classList.remove('hidden');
            }
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.status) {
                    window.applyOrderStatusUI(data.status, data.rider_name || data.riderName || 'Alex');
                }
                if (data && (data.type === 'ORDER_EDITED' || data.type === 'ORDER_MODIFIED')) {
                    handleClientOrderEdited(data);
                }
            } catch (e) {
                console.error('[Orders WS parse error]:', e);
            }
        };

        ws.onerror = () => {
            if (liveIndicator) liveIndicator.textContent = 'Syncing';
            startPollingStatus();
        };

        ws.onclose = () => {
            startPollingStatus();
        };
    } catch (e) {
        startPollingStatus();
    }

    function startPollingStatus() {
        if (ordersPoll) clearInterval(ordersPoll);
        const pollFn = async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            try {
                const res = await window.api.getOrderDetail(activeOrderId);
                const orderData = res?.order || res;
                if (orderData && orderData.status) {
                    if (orderData.status !== currentOrderStatus) {
                        window.applyOrderStatusUI(orderData.status, orderData.rider_name || 'Alex');
                    }
                    if (orderData.delivery_assignment?.latest_edit) {
                        handleClientOrderEdited({ order: orderData, edit: orderData.delivery_assignment.latest_edit });
                    }
                    if (['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(orderData.status)) {
                        clearInterval(ordersPoll);
                    }
                }
            } catch (err) {}
        };

        ordersPoll = setInterval(pollFn, 6000);
    }

    const handleVisibilityChange = () => {
        if (!document.hidden && activeOrderId) {
            window.api.getOrderDetail(activeOrderId).then(res => {
                const orderData = res?.order || res;
                if (orderData && orderData.status && orderData.status !== currentOrderStatus) {
                    window.applyOrderStatusUI(orderData.status, orderData.rider_name || 'Alex');
                }
            }).catch(() => {});
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('focus', handleVisibilityChange, { passive: true });

    startPollingStatus();
};

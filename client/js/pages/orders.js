// Orders Page — Campus Radar Flight-Tracker HUD & Real-Time Dynamic Sync
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

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

function isOrderCancellable(status) {
    if (!status) return false;
    const s = String(status).toLowerCase().trim();
    // Stop working if order is out for delivery, en route, dispatched, transit, delivered, or already cancelled
    if (s.includes('out') || s.includes('route') || s.includes('dispatch') || s.includes('transit') || s.includes('deliver') || s.includes('cancel')) {
        return false;
    }
    return true;
}

// Compute exact corridor positioning and HUD attributes for each admin order status
function getOrderTrackingDetails(status, riderName = 'Alex', address = 'BH13') {
    const s = (status || '').toLowerCase().trim();
    
    // Default fallback (Order Placed / Incoming)
    let percent = 25;
    let pinLeft = '14%';
    let pinTop = '50%';
    let step = 1;
    let icon = 'inventory_2';
    let badge = `${riderName} · Order Placed`;
    let msg = `Order placed! BH13 Dark Store received your items.`;
    let eta = '3 Mins';

    if (s.includes('confirm') || s === 'accepted') {
        percent = 40;
        pinLeft = '20%';
        pinTop = '45%';
        step = 2;
        icon = 'thumb_up';
        badge = `${riderName} · Confirmed`;
        msg = `Order confirmed by BH13 Dark Store. Runner ${riderName} assigned.`;
        eta = '2.5 Mins';
    } else if (s.includes('prepar') || s.includes('pack')) {
        percent = 60;
        pinLeft = '32%';
        pinTop = '42%';
        step = 3;
        icon = 'package_2';
        badge = `${riderName} · Packing Items`;
        msg = `${riderName} is packing your items in a tamper-proof bag at BH13 Hub.`;
        eta = '2 Mins';
    } else if (s.includes('out') || s.includes('route') || s.includes('dispatch')) {
        percent = 80;
        pinLeft = '62%';
        pinTop = '46%';
        step = 4;
        icon = 'directions_walk';
        badge = `${riderName} · Walking to Room`;
        msg = `${riderName} picked up your snacks from BH13 Hub and is walking to ${address}.`;
        eta = '1 Min';
    } else if (s.includes('deliver')) {
        percent = 100;
        pinLeft = '86%';
        pinTop = '50%';
        step = 5;
        icon = 'task_alt';
        badge = `Delivered to Door 🏁`;
        msg = `🎉 Order delivered to your hostel room door! Enjoy your snacks.`;
        eta = 'Delivered';
    } else if (s.includes('cancel')) {
        percent = 0;
        pinLeft = '14%';
        pinTop = '50%';
        step = 0;
        icon = 'cancel';
        badge = `Order Cancelled`;
        msg = `❌ This order was cancelled.`;
        eta = 'Cancelled';
    }

    return { percent, pinLeft, pinTop, step, icon, badge, msg, eta };
}

// Global In-Place UI Updater called immediately via WebSocket when Admin changes status
window.applyOrderStatusUI = function(newStatus, riderName, targetOrderId) {
    console.log(`[Orders Page UI] ⚡ Applying admin status update in real-time: ${newStatus} (${riderName})`);

    const card = document.getElementById('active-order-tracking-card');
    if (!card) return;

    const currentOrderId = card.dataset.orderId || window.CURRENT_ACTIVE_ORDER_ID;
    if (targetOrderId && currentOrderId && targetOrderId !== currentOrderId) {
        if (typeof window.renderPage === 'function') window.renderPage();
        return;
    }

    window.CURRENT_ACTIVE_ORDER_STATUS = newStatus;
    window.__lastWsStatusTime = Date.now();
    const effectiveRider = riderName || 'Alex';
    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const address = savedRoom ? `BH13 (${savedBlock}), Room ${savedRoom}` : 'BH13';

    const details = getOrderTrackingDetails(newStatus, effectiveRider, address);

    // 1. Status Badge & ETA Display
    const etaTime = document.getElementById('tracking-eta-time');
    if (etaTime) etaTime.textContent = `Status: ${newStatus}`;

    // Update Cancel Option at top of the map
    const cancelContainer = document.getElementById('tracking-cancel-container');
    if (cancelContainer) {
        const orderIdToCancel = targetOrderId || currentOrderId;
        if (isOrderCancellable(newStatus)) {
            cancelContainer.innerHTML = `
                <button type="button" id="btn-cancel-active-order" onclick="window.promptCancelActiveOrder('${orderIdToCancel}')" class="clay-pill px-2.5 sm:px-3 py-1 flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-xs" title="Cancel this order">
                    <span class="material-symbols-outlined text-xs text-rose-500">cancel</span>
                    <span>Cancel</span>
                </button>
            `;
        } else {
            const reason = newStatus.toLowerCase().includes('cancel') 
                ? 'Order is cancelled' 
                : (newStatus.toLowerCase().includes('deliver') ? 'Order is delivered' : 'Order is out for delivery');
            cancelContainer.innerHTML = `
                <button type="button" id="btn-cancel-active-order" disabled class="clay-pill px-2 sm:px-2.5 py-1 flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 cursor-not-allowed opacity-60 select-none" title="Cancellation unavailable: ${reason}">
                    <span class="material-symbols-outlined text-xs">block</span>
                    <span>Cancel Unavailable</span>
                </button>
            `;
        }
    }

    // 2. Progress Bar
    const progressBar = document.getElementById('order-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${details.percent}%`;
        if (newStatus.toLowerCase().includes('cancel')) {
            progressBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-700';
        } else {
            progressBar.className = 'h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_12px_#10b981]';
        }
    }

    // 3. Step Indicators
    const stepPlaced = document.getElementById('step-placed');
    const stepPacked = document.getElementById('step-packed');
    const stepEnroute = document.getElementById('step-enroute');
    const stepDelivered = document.getElementById('step-delivered');

    const updateStep = (el, active) => {
        if (!el) return;
        if (active) {
            el.className = 'text-emerald-500 dark:text-emerald-400 font-black transition-colors';
        } else {
            el.className = 'text-slate-400 dark:text-slate-500 font-medium transition-colors';
        }
    };

    updateStep(stepPlaced, details.step >= 1);
    updateStep(stepPacked, details.step >= 3);
    updateStep(stepEnroute, details.step >= 4);
    updateStep(stepDelivered, details.step >= 5);

    // 4. Map Runner Pin Position, Icon & Badge
    const pin = document.getElementById('rider-pin');
    if (pin) {
        pin.style.left = details.pinLeft;
        pin.style.top = details.pinTop;
    }
    const pinIcon = document.getElementById('rider-pin-icon');
    if (pinIcon) pinIcon.textContent = details.icon;
    const pinBox = document.getElementById('rider-icon-box');
    if (pinBox) {
        if (details.step === 4) pinBox.classList.add('animate-bounce');
        else pinBox.classList.remove('animate-bounce');
    }
    const pinBadge = document.getElementById('rider-badge');
    if (pinBadge) pinBadge.textContent = details.badge;

    // 5. Status Description Message
    const statusMsg = document.getElementById('tracking-status-msg');
    if (statusMsg) {
        statusMsg.innerHTML = `
            <span class="material-symbols-outlined text-base text-emerald">${details.icon}</span>
            <span>${details.msg}</span>
        `;
    }

    // 6. Runner Profile Info
    const riderNameDisplay = document.getElementById('rider-name-display');
    if (riderNameDisplay && effectiveRider) riderNameDisplay.textContent = effectiveRider;
    const riderAvatar = document.getElementById('rider-avatar');
    if (riderAvatar && effectiveRider) riderAvatar.textContent = effectiveRider[0].toUpperCase();

    // 7. Soft Arrival Audio Chime
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(details.step === 5 ? 880 : 659.25, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {}

    // 8. If order delivered or cancelled, refresh past orders list after 2.5s
    if (details.step === 5 || details.step === 0) {
        setTimeout(() => {
            if (typeof window.renderPage === 'function' && window.location.hash.includes('orders')) {
                window.renderPage();
            }
        }, 2800);
    }
};

window.pages.orders = async function() {
    if (!window.isUserLoggedIn()) {
        return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-md mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Orders & Tracking</h1>
                    <p class="text-[10px] text-slate-500 font-medium">Campus corridor updates</p>
                </div>
            </div>
        </div>
    </header>

    <main class="px-4 sm:px-6 max-w-md mx-auto pt-16 text-center space-y-5">
        <div class="glass-panel card-pedestal w-20 h-20 rounded-3xl text-emerald-500 flex items-center justify-center mx-auto shadow-2xl relative overflow-hidden">
            <div class="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse pointer-events-none"></div>
            <span class="material-symbols-outlined text-4xl">receipt_long</span>
        </div>
        <div class="space-y-2">
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sign In to View Orders</h2>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed font-medium">
                Connect your campus account to access real-time runner tracking, order receipts, and 1-tap reordering.
            </p>
        </div>
        <div class="pt-2">
            <a href="#/signin" onclick="localStorage.setItem('lpuquick_redirect', '#/orders')" class="clay-btn clay-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-transform tracking-wide uppercase">
                <span>Continue with Google</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    </main>

    <!-- Floating Liquid Glass Bottom Navigation Dock -->
    <div class="fixed bottom-3 inset-x-0 z-40 px-4 sm:hidden pointer-events-none flex justify-center">
        <nav class="pointer-events-auto liquid-dock-pill h-14 max-w-md w-full px-3 flex justify-around items-center rounded-full shadow-2xl">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-semibold mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-semibold mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-semibold mt-0.5">Cart</span>
            </a>
            <a class="clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="text-[10px] mt-0.5 font-bold">Orders</span>
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

    const activeOrder = activeData?.active || (ordersData?.active && ordersData.active[0]) || null;
    const activeRiderName = activeOrder ? formatClientRiderName(activeOrder.rider_name) : 'Alex';
    const activeEdit = activeOrder?.delivery_assignment?.latest_edit || null;
    const pastOrders = ordersData?.past || [];
    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const hostelAddress = savedRoom ? `BH13 (${savedBlock}), Room ${savedRoom}` : 'BH13 (Block A)';
    const hostelShort = window.currentAddress || 'BH13';

    window.CURRENT_ACTIVE_ORDER_ID = activeOrder ? activeOrder.id : null;
    window.CURRENT_ACTIVE_ORDER_STATUS = activeOrder ? activeOrder.status : 'Order Placed';

    // Accurate calculation for initial screen render based on real activeOrder status
    const initialTracking = getOrderTrackingDetails(
        activeOrder ? activeOrder.status : 'Order Placed', 
        activeRiderName, 
        activeOrder?.delivery_address || hostelAddress
    );

    const pastRows = pastOrders.map(o => {
        const isCancelled = ['Cancelled', 'cancelled'].includes(o.status);
        const statusBadgeClass = isCancelled 
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/25' 
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
        return `
        <div class="glass-panel card-pedestal rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 hover:translate-y-[-2px] transition-all shadow-md">
            <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                    <span class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Order #${o.id.replace('order_', '').toUpperCase()}</span>
                    <span class="text-[10px] ${statusBadgeClass} font-bold px-2.5 py-0.5 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-slate-400 font-medium">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3.5 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[var(--glass-border)]">
                <div class="text-right">
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Total Paid</span>
                    <span class="font-black text-sm sm:text-base text-slate-900 dark:text-white">₹${o.total}</span>
                </div>
                <button data-order-id="${o.id}" class="clay-btn text-xs font-bold px-4 py-2 rounded-xl text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-transform active:scale-95 reorder-btn cursor-pointer flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-xs">replay</span>
                    <span>Reorder</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Live Tracking & Orders</h1>
                    <p class="text-[10px] text-slate-500 font-semibold">LPU BH13 corridor hyper-fast dispatch</p>
                </div>
            </div>
            <div class="clay-pill px-3 py-1 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                <span id="orders-live-indicator">Live Connected</span>
            </div>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-4xl mx-auto pt-6 space-y-6">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-3.5" id="active-order-tracking-card" data-order-id="${activeOrder.id}">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald shadow-[0_0_8px_#10b981]"></span>
                    <span>Live Campus Delivery (3 Mins)</span>
                </h2>
                <div class="flex items-center gap-2">
                    <!-- High-Contrast Status Pill (Vibrant in both Dark and Light mode) -->
                    <span class="clay-pill px-3 py-1 flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-slate-900/90 border border-emerald-500/40 shadow-sm" id="tracking-eta">
                        <span class="material-symbols-outlined text-xs text-emerald-500 animate-pulse">bolt</span>
                        <span id="tracking-eta-time">Status: ${activeOrder.status}</span>
                    </span>
                    <!-- Cancel Order Option at top of the map -->
                    <div id="tracking-cancel-container">
                        ${isOrderCancellable(activeOrder.status) ? `
                        <button type="button" id="btn-cancel-active-order" onclick="window.promptCancelActiveOrder('${activeOrder.id}')" class="clay-pill px-2.5 sm:px-3 py-1 flex items-center gap-1 text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer active:scale-95 shadow-xs" title="Cancel this order">
                            <span class="material-symbols-outlined text-xs text-rose-500">cancel</span>
                            <span>Cancel</span>
                        </button>
                        ` : `
                        <button type="button" id="btn-cancel-active-order" disabled class="clay-pill px-2 sm:px-2.5 py-1 flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 cursor-not-allowed opacity-60 select-none" title="Cancellation unavailable: Order is out for delivery">
                            <span class="material-symbols-outlined text-xs">block</span>
                            <span>Cancel Unavailable</span>
                        </button>
                        `}
                    </div>
                    <button type="button" id="btn-order-help" onclick="window.openOrderHelpModal()" class="clay-pill text-xs text-slate-700 dark:text-slate-200 font-bold px-3 py-1 flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer" title="Order Help">
                        <span class="material-symbols-outlined text-sm text-emerald">support_agent</span>
                        <span>Help</span>
                    </button>
                </div>
            </div>

            <div class="glass-panel card-pedestal rounded-3xl overflow-hidden p-0 border border-[var(--glass-border)] shadow-2xl">
                <!-- Sleek Liquid Campus Delivery Radar Canvas -->
                <div class="h-48 sm:h-56 relative overflow-hidden flex items-center justify-center p-4 select-none border-b border-[var(--glass-border)]" style="background: radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.15), transparent 70%), #090e17;">
                    
                    <!-- HUD Status Header -->
                    <div class="absolute top-3 inset-x-3 sm:inset-x-4 flex justify-between items-center z-30 pointer-events-none">
                        <div class="clay-pill px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-slate-900/80 border border-emerald-500/30 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>BH13 Corridor Express</span>
                        </div>
                        <div class="clay-pill px-2.5 py-1 text-[10px] font-bold text-slate-300 bg-slate-900/80 border border-slate-700 flex items-center gap-1">
                            <span class="text-emerald-400">1.4 m/s</span>
                            <span>• 3 Min Delivery</span>
                        </div>
                    </div>

                    <!-- Glowing Dynamic Corridor SVG -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 240">
                        <path d="M 80 120 C 220 70, 340 170, 480 100 S 620 160, 720 120" fill="none" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>
                        <path d="M 80 120 C 220 70, 340 170, 480 100 S 620 160, 720 120" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-dasharray="8,10" style="filter: drop-shadow(0 0 6px #10b981);"/>
                    </svg>

                    <!-- Origin: BH13 Hub Pin -->
                    <div class="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                        <div class="clay-card w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-emerald-400 flex items-center justify-center border border-emerald-500/40 bg-slate-900/90 shadow-lg">
                            <span class="material-symbols-outlined text-xl">storefront</span>
                        </div>
                        <span class="mt-1.5 clay-pill px-2 py-0.5 text-[9px] font-black text-emerald-400 bg-slate-950/90 border border-emerald-500/30">
                            BH13 Hub
                        </span>
                    </div>

                    <!-- Active Runner Pin (Positioned according to real order status) -->
                    <div class="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-700 ease-out" id="rider-pin" style="left: ${initialTracking.pinLeft}; top: ${initialTracking.pinTop};">
                        <div class="relative flex flex-col items-center">
                            <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-full clay-btn-primary flex items-center justify-center shadow-2xl border-2 border-white/80 ring-4 ring-emerald-500/30 ${initialTracking.step === 4 ? 'animate-bounce' : ''}" id="rider-icon-box">
                                <span class="material-symbols-outlined text-2xl text-white" id="rider-pin-icon">${initialTracking.icon}</span>
                            </div>
                            <div class="mt-1.5 clay-pill px-2.5 py-0.5 text-[10px] font-black text-white bg-slate-950/90 border border-emerald-500/50 whitespace-nowrap shadow-md" id="rider-badge">
                                ${initialTracking.badge}
                            </div>
                        </div>
                    </div>

                    <!-- Destination: Hostel Room Pin -->
                    <div class="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                        <div class="clay-card w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center border border-slate-700 bg-slate-900/90 shadow-lg">
                            <span class="material-symbols-outlined text-xl text-emerald-400">apartment</span>
                        </div>
                        <span class="mt-1.5 clay-pill px-2 py-0.5 text-[9px] font-black text-slate-300 bg-slate-950/90 border border-slate-700 max-w-[100px] truncate" id="tracking-dest-label">
                            ${activeOrder.delivery_address || `${hostelShort} Room`}
                        </span>
                    </div>
                </div>

                <!-- Order Details & Tactile Progress -->
                <div class="p-5 sm:p-6 space-y-4">
                    <!-- Modified Order Notice -->
                    <div id="tracking-order-edited-banner" class="${activeEdit ? '' : 'hidden '}p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-200 space-y-1 text-xs">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black">
                                <span class="material-symbols-outlined text-base">edit_notifications</span>
                                <span id="tracking-order-edited-title">Dark Store Notice: ${activeEdit?.reason ? activeEdit.reason : 'Item Unavailable'}</span>
                            </div>
                            <span id="tracking-order-edited-total" class="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black px-2.5 py-0.5 rounded-full">
                                Total: ₹<span id="tracking-order-edited-total-val">${activeOrder.total}</span>
                            </span>
                        </div>
                        <p id="tracking-order-edited-desc" class="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            ${activeEdit?.notes ? activeEdit.notes : 'Unavailable items were adjusted by the Dark Store.'}
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div class="space-y-1">
                            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center gap-2" id="tracking-status-msg">
                                <span class="material-symbols-outlined text-base text-emerald">${initialTracking.icon}</span>
                                <span>${initialTracking.msg}</span>
                            </p>
                            <h3 class="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight" id="tracking-order-title">Order #${activeOrder.id.replace('order_', '').toUpperCase()} · Total ₹<span id="tracking-active-total">${activeOrder.total}</span> (${activeOrder.payment_method || 'Cash on Delivery'})</h3>
                        </div>
                        <div class="flex items-center gap-3 clay-card p-2.5 px-3.5 rounded-2xl shadow-sm">
                            <div class="w-9 h-9 rounded-xl bg-emerald text-white flex items-center justify-center font-black text-sm shadow-md" id="rider-avatar">
                                ${(activeRiderName || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-black text-xs text-slate-900 dark:text-white" id="rider-name-display">${activeRiderName}</p>
                                <p class="text-[10px] text-emerald font-bold">Campus Runner</p>
                            </div>
                            <a href="tel:7671836211" class="ml-1 w-8 h-8 rounded-xl clay-btn-primary flex items-center justify-center text-white active:scale-95 transition-transform" title="Call Runner">
                                <span class="material-symbols-outlined text-xs">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Fluid Liquid Progress Step Indicator (Filled according to real status) -->
                    <div class="space-y-2 pt-2">
                        <div class="w-full bg-slate-200/50 dark:bg-slate-800/60 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner border border-[var(--glass-border)]">
                            <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_12px_#10b981]" id="order-progress-bar" style="width: ${initialTracking.percent}%;"></div>
                        </div>
                        <div class="flex justify-between text-[11px] font-bold px-1 select-none">
                            <span class="${initialTracking.step >= 1 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-slate-500 font-medium'}" id="step-placed">Accepted ✓</span>
                            <span class="${initialTracking.step >= 3 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-slate-500 font-medium'}" id="step-packed">Packed 📦</span>
                            <span class="${initialTracking.step >= 4 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-slate-500 font-medium'}" id="step-enroute">En Route 🚶</span>
                            <span class="${initialTracking.step >= 5 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-slate-500 font-medium'}" id="step-delivered">Delivered 🏁</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : `
        <section class="glass-panel card-pedestal rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-4 border border-[var(--glass-border)]">
            <div class="clay-card w-16 h-16 rounded-2xl text-slate-400 mx-auto flex items-center justify-center">
                <span class="material-symbols-outlined text-3xl">directions_walk</span>
            </div>
            <div class="space-y-1">
                <p class="font-black text-base text-slate-900 dark:text-white tracking-tight">No active deliveries</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Place an order to see live real-time campus runner tracking.</p>
            </div>
            <a href="#/" class="clay-btn clay-btn-primary inline-block text-xs font-black px-6 py-3 rounded-2xl active:scale-95 transition-transform shadow-xl tracking-wide uppercase">Explore Campus Store</a>
        </section>
        `}

        <!-- Past Orders History -->
        <section class="space-y-3.5 pt-2">
            <div class="flex items-center justify-between">
                <h2 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span class="material-symbols-outlined text-base text-emerald">history</span>
                    <span>Past Orders</span>
                </h2>
                <span class="clay-pill text-xs text-slate-400 font-bold px-3 py-1">${pastOrders.length} Completed</span>
            </div>
            <div class="space-y-3" id="past-orders-list">
                ${pastRows || `
                <div class="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                    No past orders yet. Your completed hostel orders will appear here.
                </div>
                `}
            </div>
        </section>
    </main>

    <!-- Floating Liquid Glass Bottom Navigation Dock -->
    <div class="fixed bottom-3 inset-x-0 z-40 px-4 sm:hidden pointer-events-none flex justify-center">
        <nav class="pointer-events-auto liquid-dock-pill h-14 max-w-md w-full px-3 flex justify-around items-center rounded-full shadow-2xl">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-semibold mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-semibold mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-semibold mt-0.5">Cart</span>
            </a>
            <a class="clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="text-[10px] mt-0.5 font-bold">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.orders = function() {
    const userId = window.CURRENT_USER_ID;

    // Clean up any existing tracking timer
    if (window.__ordersTrackingTimer) {
        clearInterval(window.__ordersTrackingTimer);
        window.__ordersTrackingTimer = null;
    }

    // Reorder button click handlers
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            if (!orderId) return;

            btn.disabled = true;
            btn.innerHTML = `<span class="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mr-1"></span> Adding...`;

            try {
                const res = await window.api.reorder(orderId, userId);
                if (res && res.success) {
                    if (typeof window.showClientToast === 'function') {
                        window.showClientToast('Items added to cart! Redirecting...', 'success', 'shopping_cart');
                    }
                    setTimeout(() => {
                        window.location.hash = '#/cart';
                    }, 500);
                } else {
                    throw new Error(res?.error || 'Reorder failed');
                }
            } catch (err) {
                console.error('[Reorder Error]:', err);
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-outlined text-xs">replay</span> <span>Reorder</span>`;
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Could not reorder: ' + err.message, 'warning', 'error');
                }
            }
        };
    });

    // Real-time tracking telemetry and admin synchronization loop (optimized 7s with visibility guard)
    if (window.CURRENT_ACTIVE_ORDER_ID) {
        let runnerWalkStep = 0;
        const trackingTimer = setInterval(async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            try {
                // If order is actively "Out for Delivery", add gentle live walking motion along corridor
                const curStatus = (window.CURRENT_ACTIVE_ORDER_STATUS || '').toLowerCase();
                if (curStatus.includes('out') || curStatus.includes('route')) {
                    runnerWalkStep++;
                    const pin = document.getElementById('rider-pin');
                    if (pin) {
                        const walkOffset = 62 + Math.sin(runnerWalkStep * 0.4) * 3;
                        pin.style.left = `${walkOffset}%`;
                    }
                }

                // Poll active order from database as a failsafe to WebSocket
                if (userId && window.api && window.api.getActiveOrder) {
                    const activeRes = await window.api.getActiveOrder(userId);
                    const currentActive = activeRes?.active;
                    if (currentActive) {
                        const newStatus = currentActive.status;
                        const rName = formatClientRiderName(currentActive.rider_name);
                        if (newStatus !== window.CURRENT_ACTIVE_ORDER_STATUS && (Date.now() - (window.__lastWsStatusTime || 0) > 4000)) {
                            window.applyOrderStatusUI(newStatus, rName, currentActive.id);
                        }
                    } else if (window.CURRENT_ACTIVE_ORDER_STATUS && 
                              !['Delivered', 'Cancelled', 'delivered', 'cancelled'].includes(window.CURRENT_ACTIVE_ORDER_STATUS)) {
                        // Order completed or cleared - refresh orders page
                        if (typeof window.renderPage === 'function' && window.location.hash.includes('orders')) {
                            window.renderPage();
                        }
                    }
                }
            } catch(e) {
                // Silent catch for polling
            }
        }, 7000);

        window.__ordersTrackingTimer = trackingTimer;
    }
};

// Cancel Order Modal Handlers & Actions
window.promptCancelActiveOrder = function(orderId) {
    if (!orderId) orderId = window.CURRENT_ACTIVE_ORDER_ID;
    if (!orderId) return;

    if (!isOrderCancellable(window.CURRENT_ACTIVE_ORDER_STATUS)) {
        if (typeof window.showClientToast === 'function') {
            window.showClientToast('Cannot cancel order: Your order is already out for delivery.', 'warning', 'block');
        } else {
            alert('Cannot cancel order: Your order is already out for delivery.');
        }
        return;
    }

    const shortId = String(orderId).replace('order_', '').slice(0, 8).toUpperCase();
    let modal = document.getElementById('cancel-order-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'cancel-order-modal';
    modal.onclick = function(e) {
        if (e.target === modal) window.closeCancelOrderModal();
    };
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150';
    modal.innerHTML = `
        <div class="glass-panel card-pedestal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-2xl">cancel</span>
                </div>
                <div>
                    <h3 class="font-black text-base text-slate-900 dark:text-white tracking-tight">Cancel Order #${shortId}?</h3>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">BH13 Campus Express Delivery</p>
                </div>
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Are you sure you want to cancel this order? It will not be prepared or delivered to your room.
            </p>

            <div class="space-y-1.5">
                <label for="cancel-order-reason-select" class="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Reason (Optional)</label>
                <select id="cancel-order-reason-select" class="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50">
                    <option value="Changed mind">Changed mind</option>
                    <option value="Placed order by mistake">Placed order by mistake</option>
                    <option value="Taking too long">Taking too long</option>
                    <option value="Need to change hostel room / items">Need to change hostel room / items</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="flex items-center gap-2 pt-2">
                <button type="button" onclick="window.closeCancelOrderModal()" class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    Keep Order
                </button>
                <button type="button" id="btn-confirm-cancel-order" onclick="window.executeCancelActiveOrder('${orderId}')" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer">
                    <span>Yes, Cancel</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

window.closeCancelOrderModal = function() {
    const modal = document.getElementById('cancel-order-modal');
    if (modal) modal.remove();
};

window.executeCancelActiveOrder = async function(orderId) {
    const confirmBtn = document.getElementById('btn-confirm-cancel-order');
    const reasonSelect = document.getElementById('cancel-order-reason-select');
    const reason = reasonSelect ? reasonSelect.value : 'User requested cancellation';

    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> <span>Cancelling...</span>`;
    }

    try {
        const res = await window.api.cancelOrder(orderId, reason);
        window.closeCancelOrderModal();

        if (res && res.success) {
            if (typeof window.showClientToast === 'function') {
                window.showClientToast('Order cancelled successfully', 'info', 'cancel');
            }
            window.applyOrderStatusUI('Cancelled', 'Alex', orderId);
            setTimeout(() => {
                if (typeof window.renderPage === 'function' && window.location.hash.includes('orders')) {
                    window.renderPage();
                }
            }, 1200);
        } else {
            const errMsg = res?.error || 'Failed to cancel order';
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(errMsg, 'warning', 'error');
            } else {
                alert(errMsg);
            }
            // If error indicates out for delivery, update UI to disabled state
            if (errMsg.toLowerCase().includes('out for delivery') || errMsg.toLowerCase().includes('delivered')) {
                window.applyOrderStatusUI(errMsg.includes('delivered') ? 'Delivered' : 'Out for Delivery', 'Alex', orderId);
            }
        }
    } catch (err) {
        console.error('[Cancel Order Error]:', err);
        window.closeCancelOrderModal();
        if (typeof window.showClientToast === 'function') {
            window.showClientToast('Error: ' + err.message, 'warning', 'error');
        } else {
            alert('Error: ' + err.message);
        }
    }
};


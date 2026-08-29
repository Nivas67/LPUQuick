// Orders Page — Live 3-Minute GPS Tracking & Order History
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
    const hostelAddress = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
    const hostelShort = window.currentAddress || 'BH13';

    const pastRows = pastOrders.map(o => {
        const isCancelled = ['Cancelled', 'cancelled'].includes(o.status);
        const statusBadgeClass = isCancelled 
            ? 'bg-error/15 text-error border border-error/30' 
            : 'bg-emerald/10 text-emerald';
        return `
        <div class="glass-card rounded-2xl p-4 border border-glass-border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xs sm:text-sm text-on-surface">Order #${o.id.replace('order_', '')}</span>
                    <span class="text-[10px] ${statusBadgeClass} font-bold px-2 py-0.5 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-on-surface-variant line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-on-surface-variant">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-variant/30">
                <span class="font-bold text-sm text-on-surface">₹${o.total}</span>
                <button data-order-id="${o.id}" class="bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 text-on-surface text-xs font-semibold px-3 py-1 rounded-full transition-all reorder-btn active:scale-95 cursor-pointer">
                    Reorder
                </button>
            </div>
        </div>
        `;
    }).join('');

    window.CURRENT_ACTIVE_ORDER_ID = activeOrder ? activeOrder.id : null;
    window.CURRENT_ACTIVE_ORDER_STATUS = activeOrder ? activeOrder.status : 'Order Placed';

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Live Tracking & Orders</h1>
        </div>
        <div class="flex items-center gap-1 text-xs bg-emerald/10 text-emerald px-3 py-1 rounded-full font-bold">
            <span class="material-symbols-outlined text-sm animate-spin">sync</span>
            <span id="orders-live-indicator">Live Connected</span>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto pt-6 space-y-6">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-3" id="active-order-tracking-card" data-order-id="${activeOrder.id}">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse"></span>
                    Live 3-Minute BH13 Campus Delivery
                </h2>
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-emerald/15 text-emerald font-extrabold px-3 py-1 rounded-full flex items-center gap-1" id="tracking-eta">
                        <span class="material-symbols-outlined text-xs">bolt</span>
                        <span id="tracking-eta-time">Status: ${activeOrder.status}</span>
                    </span>
                    <!-- Help Option Button (Visible ONLY when order is active) -->
                    <button type="button" id="btn-order-help" onclick="window.openOrderHelpModal()" class="text-xs bg-surface-container-high hover:bg-emerald/15 hover:text-emerald text-on-surface font-bold px-3 py-1 rounded-full border border-outline-variant/40 flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer z-30" title="Order Help & Support">
                        <span class="material-symbols-outlined text-sm text-emerald">help</span>
                        <span>Help</span>
                    </button>
                </div>
            </div>
            <div class="glass-card rounded-3xl overflow-hidden border border-emerald/30 shadow-lg bg-surface">
                <!-- BH13 Campus Floor / Corridor Live Map Canvas -->
                <div class="h-64 sm:h-72 relative bg-[#f1f5f9] dark:bg-slate-900/90 overflow-hidden flex items-center justify-center p-4 select-none">
                    
                    <!-- Campus Map Grid Lines & Footpath -->
                    <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#10B981 1px, transparent 1px); background-size: 20px 20px;"></div>

                    <!-- Walking Footpath Path SVG -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 280">
                        <!-- Shadow Track -->
                        <path d="M 60 140 C 200 90, 320 200, 480 110 S 640 170, 740 140" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
                        <!-- Animated Green Walking Dash Track -->
                        <path d="M 60 140 C 200 90, 320 200, 480 110 S 640 170, 740 140" fill="none" stroke="#10B981" stroke-width="5" stroke-linecap="round" stroke-dasharray="10,10" style="animation: dash 1s linear infinite;"/>
                    </svg>

                    <!-- Origin: BH13 Dark Store Hub Pin (Left) -->
                    <div class="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 z-10 flex flex-col items-center">
                        <div class="w-10 h-10 rounded-2xl bg-[#3c4043] text-white flex items-center justify-center shadow-lg border-2 border-white">
                            <span class="material-symbols-outlined text-xl">storefront</span>
                        </div>
                        <span class="bg-surface text-on-surface text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap border border-outline-variant/30">BH13 Hub</span>
                    </div>

                    <!-- Active Walking Runner Pin (Dynamic Movement) -->
                    <div class="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 z-20" id="rider-pin" style="left: 48%; top: 50%;">
                        <div class="relative flex flex-col items-center">
                            <!-- Pulsing Radar Ring -->
                            <div class="absolute -inset-2 rounded-full bg-emerald/30 animate-ping"></div>
                            
                            <!-- Walking Runner Icon -->
                            <div class="w-12 h-12 rounded-full bg-emerald text-white flex items-center justify-center shadow-2xl border-2 border-white relative z-10 animate-bounce">
                                <span class="material-symbols-outlined text-2xl font-black">directions_walk</span>
                            </div>
                            
                            <!-- Runner Status Badge -->
                            <div class="mt-1.5 bg-white dark:bg-slate-800 text-on-surface text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-lg border border-emerald/40 whitespace-nowrap flex items-center gap-1" id="rider-badge">
                                <span class="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
                                <span>${activeOrder.rider_name || 'Alex'} · Walking to ${hostelShort}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Destination: Student Hostel Room Pin (Right) -->
                    <div class="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-10 flex flex-col items-center">
                        <div class="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white">
                            <span class="material-symbols-outlined text-xl">apartment</span>
                        </div>
                        <span class="bg-surface text-on-surface text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap border border-outline-variant/30" id="tracking-dest-label">${hostelShort} (Block A)</span>
                    </div>
                </div>

                <!-- Order Details & Progress -->
                <div class="p-5 sm:p-6 space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p class="text-xs text-on-surface-variant font-medium flex items-center gap-1" id="tracking-status-msg">
                                <span class="material-symbols-outlined text-sm text-emerald">directions_walk</span>
                                <span>${activeOrder.rider_name || 'Alex'} picked up your snacks from BH13 Dark Store and is walking to ${activeOrder.delivery_address || hostelAddress}.</span>
                            </p>
                            <h3 class="font-bold text-sm sm:text-base text-on-surface mt-0.5">Order #${activeOrder.id.replace('order_', '')} · Total ₹${activeOrder.total} (${activeOrder.payment_method || 'Cash on Delivery'})</h3>
                        </div>
                        <div class="flex items-center gap-3 bg-surface-container-high rounded-2xl p-2 px-3.5 border border-surface-variant/40">
                            <div class="w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center font-bold text-xs" id="rider-avatar">
                                ${(activeOrder.rider_name || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-semibold text-xs text-on-surface" id="rider-name-display">${activeOrder.rider_name || 'Alex'}</p>
                                <p class="text-[10px] text-emerald font-semibold flex items-center gap-0.5">
                                    <span class="material-symbols-outlined text-[12px]">directions_walk</span>
                                    <span>BH13 Express Walker</span>
                                </p>
                            </div>
                            <a href="tel:7671836211" class="ml-2 w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center hover:opacity-90 shadow-sm" title="Call Runner">
                                <span class="material-symbols-outlined text-xs">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Progress Step Indicator -->
                    <div class="space-y-2">
                        <div class="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                            <div class="bg-emerald h-full rounded-full transition-all duration-700 shadow-sm" id="order-progress-bar" style="width: 55%;"></div>
                        </div>
                        <div class="flex justify-between text-[10px] sm:text-xs font-semibold text-on-surface-variant">
                            <span class="text-emerald" id="step-placed">Accepted</span>
                            <span id="step-packed">Packed</span>
                            <span id="step-enroute">Walking to Room</span>
                            <span id="step-delivered">Delivered</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : `
        <section class="glass-card rounded-3xl p-8 text-center border border-glass-border">
            <div class="w-14 h-14 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant">directions_walk</span>
            </div>
            <p class="font-bold text-sm text-on-surface">No active deliveries right now</p>
            <p class="text-xs text-on-surface-variant mt-1">Place an order to see live real-time GPS walking tracking.</p>
            <a href="#/" class="mt-4 inline-block bg-emerald text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md">Explore Campus Store</a>
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

    <!-- Order Help Modal (Shown only for active orders) -->
    <div id="order-help-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="glass-card bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-glass-border space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-surface-variant/40 pb-3">
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-emerald/15 text-emerald flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Order Help & Support</h3>
                        <p class="text-[11px] text-on-surface-variant">Order #${activeOrder ? activeOrder.id.replace('order_', '') : ''}</p>
                    </div>
                </div>
                <button type="button" id="btn-close-help-modal" onclick="window.closeOrderHelpModal()" class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2.5">
                <!-- Option 1: Call Delivery Agent -->
                <a href="tel:7671836211" class="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high hover:bg-emerald/10 border border-outline-variant/30 hover:border-emerald transition-all group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald text-white flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-xl">call</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs sm:text-sm text-on-surface">1. Call Delivery Agent</h4>
                            <p class="text-[11px] text-on-surface-variant">${activeOrder?.rider_name || 'Alex'} (BH13 Express Walker) · 7671836211</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-emerald group-hover:translate-x-1 transition-transform">chevron_right</span>
                </a>

                <!-- Option 2: Change Address -->
                <button type="button" id="btn-help-change-address" onclick="window.changeHelpOrderAddress()" class="w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high hover:bg-emerald/10 border border-outline-variant/30 hover:border-emerald transition-all group cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-xl">location_on</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs sm:text-sm text-on-surface">2. Change Delivery Address</h4>
                            <p class="text-[11px] text-on-surface-variant truncate max-w-[220px]" id="help-current-address-label">${activeOrder?.delivery_address || hostelAddress}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>

                <!-- Option 3: Cancel Order (Frozen after order is packed / walker en route) -->
                ${(() => {
                    const isFrozen = activeOrder && ['Out for Delivery', 'out for delivery', 'Delivered', 'delivered'].includes(activeOrder.status);
                    return `
                    <button type="button" id="btn-help-cancel-order" onclick="window.cancelHelpOrder()" ${isFrozen ? 'disabled' : ''} class="w-full text-left flex items-center justify-between p-3.5 rounded-2xl ${isFrozen ? 'bg-surface-container-high opacity-50 border border-outline-variant/30 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer'} transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl ${isFrozen ? 'bg-surface-variant text-on-surface-variant' : 'bg-error text-white'} flex items-center justify-center shadow-md">
                                <span class="material-symbols-outlined text-xl">${isFrozen ? 'lock' : 'cancel'}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-xs sm:text-sm ${isFrozen ? 'text-on-surface-variant' : 'text-error'}">
                                    3. Cancel Order ${isFrozen ? '<span class="text-[10px] bg-surface-variant text-on-surface-variant font-bold px-2 py-0.5 rounded-full ml-1">Locked</span>' : ''}
                                </h4>
                                <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                                    ${isFrozen ? '🔒 Order packed & walker en route. Cannot cancel now.' : 'Cancel active delivery & request immediate refund'}
                                </p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined ${isFrozen ? 'text-on-surface-variant' : 'text-error'} group-hover:translate-x-1 transition-transform">${isFrozen ? 'lock' : 'chevron_right'}</span>
                    </button>
                    `;
                })()}
            </div>
        </div>
    </div>

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
    const hostelShort = window.currentAddress || 'BH13';
    const hostelAddress = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
    const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;

    // Reorder button click (Genuine items from order)
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            const orderId = btn.dataset.orderId;
            if (!orderId) return;

            btn.disabled = true;
            btn.textContent = 'Adding...';
            try {
                await window.api.reorder(orderId, userId);
                btn.textContent = 'Added ✓';
                setTimeout(() => {
                    window.location.hash = '#/cart';
                }, 300);
            } catch (err) {
                btn.textContent = 'Reorder';
                btn.disabled = false;
                console.error('[Reorder Error]:', err);
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
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high opacity-50 border border-outline-variant/30 cursor-not-allowed transition-all select-none';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center shadow-md">
                        <span class="material-symbols-outlined text-xl">lock</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5">
                            <span>3. Cancel Order</span>
                            <span class="text-[10px] bg-surface-variant text-on-surface-variant font-bold px-2 py-0.5 rounded-full">Locked 🔒</span>
                        </h4>
                        <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                            🔒 Order packed & walker en route. Cannot cancel now.
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">lock</span>
            `;
        } else {
            cancelBtn.disabled = false;
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-all group';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-error text-white flex items-center justify-center shadow-md">
                        <span class="material-symbols-outlined text-xl">cancel</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs sm:text-sm text-error">3. Cancel Order</h4>
                        <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                            Cancel active delivery & request immediate refund
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-error group-hover:translate-x-1 transition-transform">chevron_right</span>
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

    // Live status UI updater
    window.applyOrderStatusUI = function(status, riderName) {
        currentOrderStatus = status;
        window.CURRENT_ACTIVE_ORDER_STATUS = status;
        window.updateHelpModalCancelState(status);
        const rider = riderName || 'Alex';
        if (riderNameDisplay) riderNameDisplay.textContent = rider;
        if (riderAvatar) riderAvatar.textContent = rider[0];
        if (riderBadge) riderBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald animate-pulse"></span><span>${rider} · Walking to ${hostelShort}</span>`;

        if (status === 'Order Placed') {
            if (progressBar) progressBar.style.width = '20%';
            if (etaTimeEl) etaTimeEl.textContent = 'Order Placed (Verifying Stock)';
            if (msgEl) msgEl.innerHTML = '<span class="material-symbols-outlined text-sm text-emerald">storefront</span><span>BH13 Dark Store received your order and is preparing items.</span>';
            if (pin) { pin.style.left = '18%'; pin.style.top = '50%'; }
            if (stepPlaced) stepPlaced.classList.add('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.remove('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.remove('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.remove('text-emerald', 'font-bold');
        } else if (status === 'Order Confirmed') {
            if (progressBar) progressBar.style.width = '40%';
            if (etaTimeEl) etaTimeEl.textContent = 'Confirmed · Walking in 3 mins';
            if (msgEl) msgEl.innerHTML = '<span class="material-symbols-outlined text-sm text-emerald">check_circle</span><span>BH13 Dark Store confirmed all snacks are packed.</span>';
            if (pin) { pin.style.left = '32%'; pin.style.top = '46%'; }
            if (stepPlaced) stepPlaced.classList.add('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.add('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.remove('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.remove('text-emerald', 'font-bold');
        } else if (status === 'Preparing') {
            if (progressBar) progressBar.style.width = '60%';
            if (etaTimeEl) etaTimeEl.textContent = 'Packing at BH13 Hub (2 mins)';
            if (msgEl) msgEl.innerHTML = '<span class="material-symbols-outlined text-sm text-emerald">inventory_2</span><span>Campus runner is picking up your bag at BH13 Hub.</span>';
            if (pin) { pin.style.left = '48%'; pin.style.top = '54%'; }
            if (stepPlaced) stepPlaced.classList.add('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.add('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.remove('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.remove('text-emerald', 'font-bold');
        } else if (status === 'Out for Delivery') {
            if (progressBar) progressBar.style.width = '85%';
            if (etaTimeEl) etaTimeEl.textContent = 'Walking to Room · 1 min (00:59)';
            if (msgEl) msgEl.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald">directions_walk</span><span>${rider} picked up your snacks from BH13 Hub and is walking to ${hostelAddress}.</span>`;
            if (pin) { pin.style.left = '68%'; pin.style.top = '48%'; }
            if (stepPlaced) stepPlaced.classList.add('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.add('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.add('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.remove('text-emerald', 'font-bold');
        } else if (status === 'Delivered') {
            if (progressBar) progressBar.style.width = '100%';
            if (etaTimeEl) etaTimeEl.textContent = 'Delivered ✓';
            if (msgEl) msgEl.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald">task_alt</span><span>🎉 Arrived at ${hostelShort} hostel room/gate! Please collect your items.</span>`;
            if (pin) { pin.style.left = '86%'; pin.style.top = '50%'; }
            if (stepPlaced) stepPlaced.classList.add('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.add('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.add('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.add('text-emerald', 'font-bold');

            // Soft auto-refresh after delivery completion so past orders update cleanly
            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3500);
        } else if (status === 'Cancelled' || status === 'cancelled') {
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.className = 'bg-error h-full rounded-full transition-all duration-700 shadow-sm';
            }
            if (etaTimeEl) {
                etaTimeEl.textContent = 'Cancelled ✕';
                const parentBadge = etaTimeEl.closest('#tracking-eta');
                if (parentBadge) parentBadge.className = 'text-xs bg-error/15 text-error font-extrabold px-3 py-1 rounded-full flex items-center gap-1';
            }
            if (msgEl) {
                msgEl.innerHTML = '<span class="material-symbols-outlined text-sm text-error">cancel</span><span class="text-error font-semibold">Order cancelled by Admin / Dark Store. Refund initiated.</span>';
            }
            if (pin) {
                pin.style.left = '50%';
                pin.style.top = '50%';
                pin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shadow-2xl border-2 border-white relative z-10">
                            <span class="material-symbols-outlined text-2xl font-black">close</span>
                        </div>
                        <div class="mt-1.5 bg-white dark:bg-slate-800 text-error text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-lg border border-error/40 whitespace-nowrap flex items-center gap-1">
                            <span>Order Cancelled</span>
                        </div>
                    </div>
                `;
            }
            if (stepPlaced) stepPlaced.classList.remove('text-emerald', 'font-bold');
            if (stepPacked) stepPacked.classList.remove('text-emerald', 'font-bold');
            if (stepEnroute) stepEnroute.classList.remove('text-emerald', 'font-bold');
            if (stepDelivered) stepDelivered.classList.remove('text-emerald', 'font-bold');

            // Soft auto-refresh after cancellation so the active card moves to Past Orders
            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3000);
        }
    };

    if (!activeOrderId) return;

    // Connect Live Tracking WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/track/${activeOrderId}`;
    let ws = null;
    let ordersPoll = null;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (liveIndicator) liveIndicator.textContent = 'Live GPS Sync';
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.status) {
                    window.applyOrderStatusUI(data.status, data.rider_name || data.riderName);
                }
            } catch (e) {
                console.error('[Orders WS parse error]:', e);
            }
        };

        ws.onerror = () => {
            if (liveIndicator) liveIndicator.textContent = 'Syncing (Fallback)';
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
        ordersPoll = setInterval(async () => {
            try {
                const res = await window.api.getOrderDetail(activeOrderId);
                if (res && res.order && res.order.status) {
                    window.applyOrderStatusUI(res.order.status, res.order.rider_name);
                    if (res.order.status === 'Delivered') clearInterval(ordersPoll);
                }
            } catch (err) {}
        }, 3000);
    }
};



// Checkout Page — Complete Ground-Up Refreshing Redesign (1-Page Luxury Liquid Glass Checkout)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.checkout = async function() {
    let cartData;
    const userId = window.getEffectiveUserId();
    try { 
        cartData = await window.api.getCart(userId); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } }; 
    }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 };
    
    // Accurate MRP & Subtotal calculations
    const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * item.quantity), 0);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);
    
    // 5% Campus Bulk Offer for orders above ₹350
    const hasDiscount = subtotal >= 350;
    const discount5 = hasDiscount ? Math.round(subtotal * 0.05) : 0;
    const exactTotal = Math.max(0, subtotal - discount5);
    window.cartTotalCache = exactTotal;

    // Total Real Savings: MRP discount + 5% offer + ₹25 delivery + ₹5 handling
    const deliverySavings = subtotal > 0 ? 25 : 0;
    const handlingSavings = subtotal > 0 ? 5 : 0;
    const totalSavings = mrpDiscount + discount5 + deliverySavings + handlingSavings;

    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const savedPhone = (localStorage.getItem('lpuquick_phone') || window.currentPhone || '').replace(/\D/g, '');
    const address = (savedRoom && savedPhone.length === 10) 
        ? `BH13 (${savedBlock}), Room ${savedRoom} • 📞 +91 ${savedPhone}` 
        : (savedRoom ? `BH13 (${savedBlock}), Room ${savedRoom} • ⚠️ Mobile Number Mandatory` : 'Please set your hostel room & mobile number');

    const itemRows = items.map(item => {
        const itemMrp = Number(item.mrp) || Number(item.price) || 0;
        const itemPrice = Number(item.price) || 0;
        const hasItemDiscount = itemMrp > itemPrice;
        const discPercent = hasItemDiscount ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;

        return `
        <div class="flex items-center justify-between py-3 border-b border-[var(--glass-border)] text-xs cart-checkout-row" data-cart-id="${item.cart_id}">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 p-1 shrink-0 flex items-center justify-center border border-[var(--glass-border)] shadow-inner">
                    <img class="w-full h-full object-contain" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'">
                </div>
                <div class="min-w-0">
                    <p class="font-black text-slate-900 dark:text-white truncate tracking-tight">${item.name}</p>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">₹${itemPrice}</span>
                        ${hasItemDiscount ? `<span class="line-through text-[10px] text-slate-400">₹${itemMrp}</span> <span class="text-[9px] text-emerald-700 dark:text-emerald-400 font-black liquid-badge px-1 rounded">${discPercent}% OFF</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3 shrink-0 ml-2">
                <div class="card-qty-stepper flex items-center shrink-0">
                    <button class="checkout-qty-dec" data-id="${item.cart_id}" data-qty="${item.quantity}">
                        <span class="material-symbols-outlined text-xs">remove</span>
                    </button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="checkout-qty-inc" data-id="${item.cart_id}" data-qty="${item.quantity}">
                        <span class="material-symbols-outlined text-xs">add</span>
                    </button>
                </div>
                <span class="font-black text-slate-900 dark:text-white text-xs w-12 text-right">₹${item.quantity * itemPrice}</span>
            </div>
        </div>
    `}).join('');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/cart" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95" id="checkout-back-link">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight" id="checkout-header-title">Checkout</h1>
            </div>
            <div class="clay-pill px-3 py-1 flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                <span>3 mins delivery</span>
            </div>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-2xl mx-auto pt-5 space-y-4" id="checkout-main-container">
        <!-- Pre-Order Section -->
        <div id="checkout-form-section" class="space-y-4 transition-all duration-200">
            
            ${!window.isUserLoggedIn() ? `
            <!-- Sign In Required Banner -->
            <div class="glass-panel rounded-2xl p-4 flex items-center justify-between text-xs border border-amber-500/40 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">account_circle</span>
                    </div>
                    <div>
                        <p class="font-black text-slate-900 dark:text-white">Sign In Required</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Sign in to confirm delivery to your campus hostel room.</p>
                    </div>
                </div>
                <a href="#/signin" onclick="localStorage.setItem('lpuquick_redirect', '#/checkout')" class="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1">
                    <span>Sign In</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            ` : !window.hasUserConfiguredAddress() ? `
            <!-- Room Address & Mobile Required Banner -->
            <div class="glass-panel rounded-2xl p-4 flex items-center justify-between text-xs border border-rose-500/40 bg-rose-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">contact_phone</span>
                    </div>
                    <div>
                        <p class="font-black text-slate-900 dark:text-white">Address & Mobile Required</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Hostel room and 10-digit mobile are mandatory for delivery runner.</p>
                    </div>
                </div>
                <button type="button" onclick="window.openAddressModal(true, () => window.router())" class="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer">
                    <span>Add Now</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            ` : ''}

            <!-- Delivery Address Card (Tactile Clay & Liquid Pedestal) -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)]">
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3.5">
                        <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-lg border border-white/30">
                            <span class="material-symbols-outlined text-xl">location_on</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-tight">Hostel Delivery Destination</h3>
                                <span class="liquid-badge text-[10px] text-emerald-800 dark:text-emerald-300 px-2 py-0.5 font-black">3 mins</span>
                            </div>
                            <p class="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium" id="checkout-address-text">${address}</p>
                            ${(!savedPhone || savedPhone.length !== 10) ? `
                            <p class="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">warning</span> Mobile number missing! Required for runner.
                            </p>
                            ` : `
                            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Verified Contact for Runner Delivery
                            </p>
                            `}
                        </div>
                    </div>
                    <button type="button" class="clay-pill px-3.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 address-selector-trigger hover:scale-105 active:scale-95 transition-transform cursor-pointer" onclick="window.openAddressModal(true)">Change</button>
                </div>
            </div>

            <!-- Order Items Summary -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)]">
                <div class="flex items-center justify-between mb-2 pb-2.5 border-b border-[var(--glass-border)]">
                    <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span class="material-symbols-outlined text-base text-emerald">shopping_bag</span>
                        Order Items (${cartData.item_count || 0})
                    </h3>
                    <span class="text-[11px] text-slate-400 font-semibold">Corridor Dispatch</span>
                </div>
                <div class="divide-y divide-[var(--glass-border)]">
                    ${itemRows || '<p class="text-xs text-slate-500 py-2">No items in cart.</p>'}
                </div>
            </div>

            <!-- Bill Breakdown Card -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)] space-y-3">
                <div class="flex items-center justify-between pb-2.5 border-b border-[var(--glass-border)]">
                    <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                        <span class="material-symbols-outlined text-base text-emerald">receipt</span>
                        Bill Breakdown
                    </h3>
                    <span class="text-[11px] text-slate-400 font-semibold">Zero hidden fees</span>
                </div>

                <div class="space-y-2 text-xs">
                    ${mrpDiscount > 0 ? `
                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Total MRP Value</span>
                        <span class="line-through text-slate-400">₹${totalMrp}</span>
                    </div>

                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>Product Discount</span>
                        <span>-₹${mrpDiscount}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <span>Item Subtotal</span>
                        <span class="font-black text-slate-900 dark:text-white" id="checkout-subtotal-val">₹${subtotal}</span>
                    </div>

                    ${hasDiscount ? `
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>5% Bulk Offer</span>
                        <span>-₹${discount5}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹25</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Handling & Bag</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹5</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-[var(--glass-border)] pt-3.5 mt-2 flex justify-between items-center text-sm font-black">
                        <div>
                            <span class="text-slate-900 dark:text-white tracking-tight">Total to Pay</span>
                            <p class="text-[10px] text-emerald font-bold">Free campus delivery</p>
                        </div>
                        <span class="text-2xl font-black text-slate-900 dark:text-white tracking-tight" id="checkout-total-val">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold backdrop-blur-md shadow-xs">
                    <span class="material-symbols-outlined text-base text-emerald">savings</span>
                    <span>Total Savings: ₹${totalSavings} applied</span>
                </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)] space-y-3.5">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Payment Method</h3>
                    <span class="liquid-badge text-[10px] text-emerald-800 dark:text-emerald-300 font-black px-2.5 py-0.5">Cash on Delivery Active</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="payment-options">
                    <!-- 1. Cash on Delivery (ACTIVE) -->
                    <label class="flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 cursor-pointer payment-option-label relative shadow-md" data-method="cod">
                        <input type="radio" name="paymentMethod" value="cod" checked class="text-emerald focus:ring-emerald">
                        <div>
                            <p class="font-black text-xs text-slate-900 dark:text-white">Cash on Delivery</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pay at BH13 room door</p>
                        </div>
                    </label>

                    <!-- 2. UPI / GPay / QR (Soon) -->
                    <div class="flex items-center gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-white/40 dark:bg-slate-800/40 opacity-60 cursor-pointer payment-blocked-trigger relative" data-title="Online UPI Payments">
                        <input type="radio" name="paymentMethod" value="upi" disabled class="text-slate-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-bold text-xs text-slate-600 dark:text-slate-400 truncate">UPI / QR</p>
                                <span class="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black px-1.5 py-0.5 rounded-full">Soon</span>
                            </div>
                            <p class="text-[10px] text-slate-400">Instant UPI</p>
                        </div>
                    </div>

                    <!-- 3. Cards / NetBanking (Soon) -->
                    <div class="flex items-center gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-white/40 dark:bg-slate-800/40 opacity-60 cursor-pointer payment-blocked-trigger relative" data-title="Card & NetBanking">
                        <input type="radio" name="paymentMethod" value="card" disabled class="text-slate-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-bold text-xs text-slate-600 dark:text-slate-400 truncate">Cards</p>
                                <span class="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black px-1.5 py-0.5 rounded-full">Soon</span>
                            </div>
                            <p class="text-[10px] text-slate-400">Visa / Master</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Banner -->
            <div id="checkout-error-banner" class="hidden p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-600 dark:text-rose-400 shadow-sm">
                <span class="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <div class="flex-1">
                    <p class="font-black">Couldn't place order</p>
                    <p class="text-slate-600 dark:text-slate-400 mt-0.5" id="checkout-error-msg">Please check your connection and try again.</p>
                    <button type="button" id="checkout-retry-btn" class="mt-2.5 bg-rose-600 text-white font-bold px-4 py-1.5 rounded-full text-xs hover:bg-rose-700 transition-colors cursor-pointer shadow-xs">
                        Try Again
                    </button>
                </div>
            </div>

            <!-- Slide or Tap to Place Order (Liquid Glass Track & Tactile Button) -->
            <div class="pt-2">
                ${!window.hasUserConfiguredAddress() ? `
                <button type="button" onclick="window.openAddressModal(true, () => { if (typeof window.router === 'function') window.router(); })" class="clay-btn clay-btn-primary w-full py-4 px-5 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
                    <span class="material-symbols-outlined text-base">home_pin</span>
                    <span>Set Hostel Room Address to Complete Order (₹${exactTotal})</span>
                </button>
                ` : `
                <div class="slider-track select-none" id="pay-slider-track">
                    <div class="slider-progress" id="pay-slider-progress"></div>
                    <div class="slider-thumb flex items-center justify-center select-none" id="pay-slider-thumb">
                        <span class="material-symbols-outlined text-base" id="thumb-icon">arrow_forward</span>
                    </div>
                    <div class="slider-text text-xs sm:text-sm select-none" id="pay-slider-text">
                        Slide to Confirm Order ₹${exactTotal}
                    </div>
                </div>
                
                <div class="mt-3.5 flex flex-col gap-2">
                    <button type="button" class="clay-btn clay-btn-primary w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 transition-all tracking-wide uppercase" id="tap-to-pay-btn">
                        <span class="material-symbols-outlined text-base">bolt</span>
                        <span>⚡ 1-Tap Quick Place (₹${exactTotal})</span>
                    </button>
                    <div class="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span class="material-symbols-outlined text-xs text-emerald">verified</span>
                        <span>3-Min Corridor Dispatch • Pay cash on room delivery</span>
                    </div>
                </div>
                `}
            </div>
        </div>

        <!-- POST-ORDER SUCCESS SCREEN & REAL-TIME TIMELINE -->
        <div id="order-success-section" class="hidden space-y-4 transition-all duration-300">
            <!-- Success Hero Card -->
            <div class="glass-panel card-pedestal rounded-3xl p-8 text-center shadow-2xl border border-emerald-500/40 space-y-4">
                <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl flex items-center justify-center mx-auto border border-white/50 animate-bounce">
                    <span class="material-symbols-outlined text-4xl">check</span>
                </div>

                <div class="space-y-1">
                    <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Order Placed Successfully!
                    </h2>
                    <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                        Your order is confirmed and received at the campus dark store.
                    </p>
                </div>

                <!-- Order Details Snapshot Card -->
                <div class="clay-card rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div class="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Order ID</span>
                        <span class="font-black text-slate-900 dark:text-white font-mono" id="success-order-id">#ORDER_PENDING</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Total Amount</span>
                        <span class="font-black text-emerald text-sm" id="success-order-total">₹${exactTotal}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Payment</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200" id="success-order-payment">Cash on Delivery</span>
                    </div>
                    <div class="flex justify-between items-start pt-2 border-t border-[var(--glass-border)]">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Destination</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200 text-right max-w-[200px]" id="success-order-dest">${address}</span>
                    </div>
                </div>

                <div class="pt-2 flex flex-col sm:flex-row gap-3">
                    <a href="#/orders" class="clay-btn clay-btn-primary flex-1 py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                        <span class="material-symbols-outlined text-sm">directions_walk</span>
                        <span>Track Live Delivery</span>
                    </a>
                    <a href="#/" class="clay-card flex-1 py-3.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span>Continue Shopping</span>
                    </a>
                </div>
            </div>
        </div>
    </main>
</div>`;
};

window.pageInits.checkout = function() {
    const userId = window.getEffectiveUserId();

    // Quantity buttons inside checkout summary
    document.querySelectorAll('.checkout-qty-inc').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-checkout-row');
            const cartId = btn.dataset.id || row?.dataset?.cartId;
            const curQty = parseInt(btn.dataset.qty) || 1;
            const nextQty = curQty + 1;
            if (cartId) {
                await window.api.updateCartItem(cartId, nextQty, userId);
                if (window.router) window.router();
            }
        };
    });

    document.querySelectorAll('.checkout-qty-dec').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-checkout-row');
            const cartId = btn.dataset.id || row?.dataset?.cartId;
            const curQty = parseInt(btn.dataset.qty) || 1;
            if (cartId) {
                if (curQty <= 1) {
                    await window.api.removeCartItem(cartId);
                } else {
                    await window.api.updateCartItem(cartId, curQty - 1, userId);
                }
                if (window.router) window.router();
            }
        };
    });

    // Blocked payment method alerts
    document.querySelectorAll('.payment-blocked-trigger').forEach(trigger => {
        trigger.onclick = () => {
            const title = trigger.dataset.title || 'Online Payment';
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`⏳ ${title} is onboarding. Please use Cash on Delivery.`, 'info', 'account_balance_wallet');
            }
        };
    });

    let isSubmitting = false;

    async function executeOrderPlacement() {
        if (isSubmitting) return;
        isSubmitting = true;

        const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
        const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
        const savedPhone = (localStorage.getItem('lpuquick_phone') || window.currentPhone || '').replace(/\D/g, '');
        
        if (!savedRoom || savedPhone.length !== 10) {
            isSubmitting = false;
            window.openAddressModal(true, () => {
                if (window.router) window.router();
            });
            return;
        }

        const fullAddress = `BH13 (${savedBlock}), Room ${savedRoom}`;
        const selectedMethod = 'Cash on Delivery';

        const tapBtn = document.getElementById('tap-to-pay-btn');
        if (tapBtn) {
            tapBtn.disabled = true;
            tapBtn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> Placing Order...`;
        }

        try {
            const orderRes = await window.api.checkout(userId, selectedMethod, fullAddress, {
                phone: savedPhone,
                name: window.CURRENT_USER_NAME || 'LPU Student',
                email: window.CURRENT_USER_EMAIL || ''
            });

            if (orderRes && orderRes.success && orderRes.order) {
                const order = orderRes.order;
                // Reveal order success view
                const formSec = document.getElementById('checkout-form-section');
                const successSec = document.getElementById('order-success-section');
                if (formSec) formSec.classList.add('hidden');
                if (successSec) {
                    successSec.classList.remove('hidden');
                    const idEl = document.getElementById('success-order-id');
                    if (idEl) idEl.textContent = `#${order.id.replace('order_', '').toUpperCase()}`;
                    const totalEl = document.getElementById('success-order-total');
                    if (totalEl) totalEl.textContent = `₹${order.total}`;
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('🎉 Order placed successfully! Runner dispatched.', 'success', 'check_circle');
                }
            } else {
                throw new Error(orderRes?.error || 'Order placement failed');
            }
        } catch (err) {
            console.error('[Checkout Error]:', err);
            const errBanner = document.getElementById('checkout-error-banner');
            const errMsg = document.getElementById('checkout-error-msg');
            if (errBanner) {
                errBanner.classList.remove('hidden');
                if (errMsg) errMsg.textContent = err.message || 'Please check your connection and try again.';
            }
            if (tapBtn) {
                tapBtn.disabled = false;
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base">bolt</span> <span>⚡ 1-Tap Quick Place (₹${window.cartTotalCache || 0})</span>`;
            }
            isSubmitting = false;
        }
    }

    const tapToPayBtn = document.getElementById('tap-to-pay-btn');
    if (tapToPayBtn) {
        tapToPayBtn.onclick = () => {
            executeOrderPlacement();
        };
    }

    // Interactive Slider Logic
    const sliderTrack = document.getElementById('pay-slider-track');
    const sliderThumb = document.getElementById('pay-slider-thumb');
    const sliderProgress = document.getElementById('pay-slider-progress');
    const sliderText = document.getElementById('pay-slider-text');

    if (sliderTrack && sliderThumb) {
        let isDragging = false;
        let startX = 0;
        let maxDrag = 0;

        function updateMaxDrag() {
            maxDrag = sliderTrack.clientWidth - sliderThumb.clientWidth - 8;
        }

        updateMaxDrag();
        window.addEventListener('resize', updateMaxDrag);

        function onStart(e) {
            if (isSubmitting) return;
            isDragging = true;
            startX = (e.touches ? e.touches[0].clientX : e.clientX) - sliderThumb.offsetLeft;
            sliderThumb.style.transition = 'none';
            if (sliderProgress) sliderProgress.style.transition = 'none';
        }

        function onMove(e) {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let left = clientX - startX;
            if (left < 4) left = 4;
            if (left > maxDrag) left = maxDrag;

            sliderThumb.style.transform = `translateX(${left}px)`;
            if (sliderProgress) sliderProgress.style.width = `${left + sliderThumb.clientWidth / 2}px`;

            if (left >= maxDrag - 5) {
                isDragging = false;
                sliderThumb.style.transform = `translateX(${maxDrag}px)`;
                if (sliderText) sliderText.textContent = 'Order Confirmed!';
                executeOrderPlacement();
            }
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            sliderThumb.style.transition = 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
            sliderThumb.style.transform = 'translateX(4px)';
            if (sliderProgress) {
                sliderProgress.style.transition = 'width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)';
                sliderProgress.style.width = '0px';
            }
        }

        sliderThumb.addEventListener('mousedown', onStart);
        sliderThumb.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    }
};

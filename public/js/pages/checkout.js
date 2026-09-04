// Checkout Page — Classical Campus Quick-Commerce Checkout & Order Confirmation
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
        <div class="flex items-center justify-between py-2.5 border-b border-border text-xs cart-checkout-row" data-cart-id="${item.cart_id}">
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-0.5 shrink-0 flex items-center justify-center border border-border">
                    <img class="w-full h-full object-contain" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'">
                </div>
                <div class="min-w-0">
                    <p class="font-semibold text-slate-900 dark:text-white truncate">${item.name}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                        <span class="text-[11px] text-slate-500 dark:text-slate-400">₹${itemPrice}</span>
                        ${hasItemDiscount ? `<span class="line-through text-[10px] text-slate-400">₹${itemMrp}</span> <span class="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">${discPercent}% OFF</span>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-2 shrink-0 ml-2">
                <div class="card-qty-stepper flex items-center shrink-0">
                    <button class="checkout-qty-dec" data-id="${item.cart_id}" data-qty="${item.quantity}">
                        <span class="material-symbols-outlined text-xs">remove</span>
                    </button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="checkout-qty-inc" data-id="${item.cart_id}" data-qty="${item.quantity}">
                        <span class="material-symbols-outlined text-xs">add</span>
                    </button>
                </div>
                <span class="font-bold text-slate-900 dark:text-white text-xs w-12 text-right">₹${item.quantity * itemPrice}</span>
            </div>
        </div>
    `}).join('');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-40 border-b border-border shadow-xs">
        <div class="flex items-center gap-3">
            <a href="#/cart" class="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200" id="checkout-back-link">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight" id="checkout-header-title">Checkout</h1>
        </div>
        <div class="flex items-center gap-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-1 rounded-full font-semibold">
            <span class="material-symbols-outlined text-sm">electric_bolt</span>
            <span>3 mins delivery</span>
        </div>
    </header>

    <main class="px-4 sm:px-6 max-w-2xl mx-auto pt-5 space-y-4" id="checkout-main-container">
        <!-- Pre-Order Section -->
        <div id="checkout-form-section" class="space-y-4 transition-all duration-200">
            
            ${!window.isUserLoggedIn() ? `
            <!-- Sign In Required Banner -->
            <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">account_circle</span>
                    </div>
                    <div>
                        <p class="font-bold text-slate-900 dark:text-white">Sign In Required</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Sign in to confirm delivery to your campus hostel room.</p>
                    </div>
                </div>
                <a href="#/signin" onclick="localStorage.setItem('lpuquick_redirect', '#/checkout')" class="bg-emerald text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1">
                    <span>Sign In</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
            </div>
            ` : !window.hasUserConfiguredAddress() ? `
            <!-- Room Address & Mobile Required Banner -->
            <div class="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-lg">contact_phone</span>
                    </div>
                    <div>
                        <p class="font-bold text-slate-900 dark:text-white">Address & Mobile Required</p>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400">Hostel room and 10-digit mobile are mandatory for delivery runner.</p>
                    </div>
                </div>
                <button type="button" onclick="window.openAddressModal(true, () => window.router())" class="bg-emerald text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1 cursor-pointer">
                    <span>Add Now</span>
                    <span class="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
            </div>
            ` : ''}

            <!-- Delivery Address Card -->
            <div class="bg-surface border border-border rounded-xl p-4 shadow-xs">
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/50 dark:border-emerald-800/50">
                            <span class="material-symbols-outlined text-base">location_on</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Hostel Delivery Destination</h3>
                                <span class="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold">3 mins</span>
                            </div>
                            <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5" id="checkout-address-text">${address}</p>
                            ${(!savedPhone || savedPhone.length !== 10) ? `
                            <p class="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">warning</span> Mobile number missing! Required for runner.
                            </p>
                            ` : `
                            <p class="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald"></span> Verified Contact for Runner Delivery
                            </p>
                            `}
                        </div>
                    </div>
                    <button type="button" class="text-xs font-semibold text-emerald hover:underline address-selector-trigger" onclick="window.openAddressModal(true)">Change</button>
                </div>
            </div>

            <!-- Order Items Summary -->
            <div class="bg-surface border border-border rounded-xl p-4 shadow-xs">
                <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base text-emerald">shopping_bag</span>
                    Order Items (${cartData.item_count || 0})
                </h3>
                <div class="divide-y divide-border">
                    ${itemRows || '<p class="text-xs text-slate-500 py-2">No items in cart.</p>'}
                </div>
            </div>

            <!-- Bill Breakdown Card -->
            <div class="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-border">
                    <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base text-emerald">receipt</span>
                        Bill Breakdown
                    </h3>
                    <span class="text-[11px] text-slate-500">Zero hidden fees</span>
                </div>

                <div class="space-y-2 text-xs">
                    ${mrpDiscount > 0 ? `
                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Total MRP Value</span>
                        <span class="line-through text-slate-400">₹${totalMrp}</span>
                    </div>

                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>Product Discount</span>
                        <span>-₹${mrpDiscount}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>Item Subtotal</span>
                        <span class="font-bold text-slate-900 dark:text-white" id="checkout-subtotal-val">₹${subtotal}</span>
                    </div>

                    ${hasDiscount ? `
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>5% Bulk Offer</span>
                        <span>-₹${discount5}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹25</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Handling & Bag</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹5</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-border pt-2.5 mt-2 flex justify-between items-center text-sm font-bold">
                        <div>
                            <span class="text-slate-900 dark:text-white">Total to Pay</span>
                            <p class="text-[10px] text-emerald font-medium">Free campus delivery</p>
                        </div>
                        <span class="text-xl font-extrabold text-slate-900 dark:text-white" id="checkout-total-val">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    <span class="material-symbols-outlined text-base text-emerald">savings</span>
                    <span>Total Savings: ₹${totalSavings} applied</span>
                </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Payment Method</h3>
                    <span class="text-[10px] text-emerald font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">Cash on Delivery Active</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="payment-options">
                    <!-- 1. Cash on Delivery (ACTIVE) -->
                    <label class="flex items-center gap-2.5 p-3 rounded-lg border-2 border-emerald bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer payment-option-label relative" data-method="cod">
                        <input type="radio" name="paymentMethod" value="cod" checked class="text-emerald focus:ring-emerald">
                        <div>
                            <div class="flex items-center gap-1.5">
                                <p class="font-bold text-xs text-slate-900 dark:text-white">Cash on Delivery</p>
                            </div>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pay at BH13 room/gate</p>
                        </div>
                    </label>

                    <!-- 2. UPI / GPay / QR (Soon) -->
                    <div class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/40 opacity-60 cursor-pointer payment-blocked-trigger relative" data-title="Online UPI Payments">
                        <input type="radio" name="paymentMethod" value="upi" disabled class="text-slate-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-medium text-xs text-slate-600 dark:text-slate-400 truncate">UPI / QR</p>
                                <span class="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1 rounded">Soon</span>
                            </div>
                            <p class="text-[10px] text-slate-400">KYC onboarding</p>
                        </div>
                    </div>

                    <!-- 3. Cards / NetBanking (Soon) -->
                    <div class="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-slate-50 dark:bg-slate-800/40 opacity-60 cursor-pointer payment-blocked-trigger relative" data-title="Card & NetBanking">
                        <input type="radio" name="paymentMethod" value="card" disabled class="text-slate-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-medium text-xs text-slate-600 dark:text-slate-400 truncate">Cards</p>
                                <span class="text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1 rounded">Soon</span>
                            </div>
                            <p class="text-[10px] text-slate-400">Visa / Master</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Banner -->
            <div id="checkout-error-banner" class="hidden p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
                <span class="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <div class="flex-1">
                    <p class="font-bold">Couldn't place order</p>
                    <p class="text-slate-600 dark:text-slate-400 mt-0.5" id="checkout-error-msg">Please check your connection and try again.</p>
                    <button type="button" id="checkout-retry-btn" class="mt-2 bg-rose-600 text-white font-semibold px-3 py-1 rounded-md text-xs hover:bg-rose-700 transition-colors cursor-pointer">
                        Try Again
                    </button>
                </div>
            </div>

            <!-- Slide or Tap to Place Order -->
            <div class="pt-1">
                ${!window.hasUserConfiguredAddress() ? `
                <button type="button" onclick="window.openAddressModal(true, () => { if (typeof window.router === 'function') window.router(); })" class="w-full py-3.5 px-5 rounded-xl bg-emerald hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
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
                
                <div class="mt-3 flex flex-col gap-1.5">
                    <button type="button" class="w-full py-3 px-4 rounded-xl bg-emerald text-white hover:bg-emerald-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors" id="tap-to-pay-btn">
                        <span class="material-symbols-outlined text-base">bolt</span>
                        <span>Place Cash on Delivery Order (₹${exactTotal})</span>
                    </button>
                    <div class="flex items-center justify-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
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
            <div class="bg-surface border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 text-center shadow-xs space-y-3">
                <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-3xl">check</span>
                </div>

                <div class="space-y-0.5">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white">
                        Order Placed!
                    </h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Your order is confirmed and received at the campus dark store.
                    </p>
                </div>

                <!-- Order Details Snapshot Card -->
                <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-border text-left space-y-2 text-xs">
                    <div class="flex justify-between items-center pb-2 border-b border-border">
                        <span class="text-slate-500 dark:text-slate-400">Order ID</span>
                        <span class="font-bold text-slate-900 dark:text-white font-mono" id="success-order-id">#ORDER_PENDING</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400">Total Amount</span>
                        <span class="font-bold text-emerald text-sm" id="success-order-total">₹${exactTotal}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400">Payment</span>
                        <span class="font-medium text-slate-800 dark:text-slate-200" id="success-order-payment">Cash on Delivery</span>
                    </div>
                    <div class="flex justify-between items-start pt-2 border-t border-border">
                        <span class="text-slate-500 dark:text-slate-400">Destination</span>
                        <span class="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[200px]" id="success-order-address">${address}</span>
                    </div>
                    <div class="p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40 rounded-lg flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium mt-1">
                        <span class="material-symbols-outlined text-sm">electric_bolt</span>
                        <span id="success-order-dispatch-msg">Estimated delivery: 3 mins to ${address}</span>
                    </div>
                </div>
            </div>

            <!-- Real-Time Order Status Timeline Card -->
            <div class="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
                <div class="flex justify-between items-center pb-2 border-b border-border">
                    <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full bg-emerald"></span>
                        Live Order Status
                    </h3>
                    <span class="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50 font-semibold px-2 py-0.5 rounded-full" id="live-connection-badge">
                        ● Live
                    </span>
                </div>

                <!-- 5-Step Progression Timeline -->
                <div class="space-y-3.5 pl-1" id="order-timeline-container">
                    
                    <!-- Step 1: Order Placed -->
                    <div class="flex items-start gap-3" id="timeline-step-1">
                        <div class="w-6 h-6 rounded-full bg-emerald text-white flex items-center justify-center shrink-0 timeline-dot">
                            <span class="material-symbols-outlined text-xs">check</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-bold text-xs text-slate-900 dark:text-white">Order Placed</h4>
                                <span class="text-[10px] text-slate-400 font-mono" id="timeline-time-1">Just now</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Order logged in database</p>
                        </div>
                    </div>

                    <!-- Step 2: Order Confirmed -->
                    <div class="flex items-start gap-3 opacity-50 transition-opacity" id="timeline-step-2">
                        <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-border text-slate-400 flex items-center justify-center shrink-0 timeline-dot">
                            <span class="material-symbols-outlined text-xs">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs text-slate-800 dark:text-slate-200" id="timeline-title-2">Order Confirmed</h4>
                                <span class="text-[10px] text-slate-400 font-mono" id="timeline-time-2">--</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Dark store verifying items</p>
                        </div>
                    </div>

                    <!-- Step 3: Preparing -->
                    <div class="flex items-start gap-3 opacity-50 transition-opacity" id="timeline-step-3">
                        <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-border text-slate-400 flex items-center justify-center shrink-0 timeline-dot">
                            <span class="material-symbols-outlined text-xs">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs text-slate-800 dark:text-slate-200" id="timeline-title-3">Preparing</h4>
                                <span class="text-[10px] text-slate-400 font-mono" id="timeline-time-3">--</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Packing at campus fulfillment hub</p>
                        </div>
                    </div>

                    <!-- Step 4: Out for Delivery -->
                    <div class="flex items-start gap-3 opacity-50 transition-opacity" id="timeline-step-4">
                        <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-border text-slate-400 flex items-center justify-center shrink-0 timeline-dot">
                            <span class="material-symbols-outlined text-xs">directions_walk</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs text-slate-800 dark:text-slate-200" id="timeline-title-4">Out for Delivery</h4>
                                <span class="text-[10px] text-slate-400 font-mono" id="timeline-time-4">--</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400" id="timeline-desc-4">Campus runner walking from BH13 Hub to your room</p>
                        </div>
                    </div>

                    <!-- Step 5: Delivered -->
                    <div class="flex items-start gap-3 opacity-50 transition-opacity" id="timeline-step-5">
                        <div class="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-border text-slate-400 flex items-center justify-center shrink-0 timeline-dot">
                            <span class="material-symbols-outlined text-xs">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs text-slate-800 dark:text-slate-200" id="timeline-title-5">Delivered</h4>
                                <span class="text-[10px] text-slate-400 font-mono" id="timeline-time-5">--</span>
                            </div>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Package handed over at hostel room/gate</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="space-y-2 pt-1">
                <button type="button" id="success-track-btn" class="w-full bg-emerald text-white font-semibold text-xs sm:text-sm py-3 rounded-lg shadow-xs hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    Track Order on Live Map
                </button>
                <a href="#/" id="success-continue-btn" class="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm py-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center block">
                    Continue Shopping
                </a>
            </div>
        </div>
    </main>

    <!-- Payment Blocked Toast Alert -->
    <div id="payment-toast" class="fixed top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 rounded-lg shadow-lg z-50 text-xs font-medium flex items-center gap-2 transition-all duration-200 opacity-0 pointer-events-none -translate-y-2">
        <span class="material-symbols-outlined text-amber-400 text-sm">lock</span>
        <span id="payment-toast-text">Online payment coming soon! Delivering with Cash on Delivery right now.</span>
    </div>
</div>`;
};

window.pageInits.checkout = function() {
    const userId = window.CURRENT_USER_ID;
    const formSection = document.getElementById('checkout-form-section');
    const successSection = document.getElementById('order-success-section');
    const headerTitle = document.getElementById('checkout-header-title');
    const backLink = document.getElementById('checkout-back-link');

    const track = document.getElementById('pay-slider-track');
    const thumb = document.getElementById('pay-slider-thumb');
    const progress = document.getElementById('pay-slider-progress');
    const text = document.getElementById('pay-slider-text');
    const thumbIcon = document.getElementById('thumb-icon');
    const tapToPayBtn = document.getElementById('tap-to-pay-btn');

    const errorBanner = document.getElementById('checkout-error-banner');
    const errorMsg = document.getElementById('checkout-error-msg');
    const retryBtn = document.getElementById('checkout-retry-btn');

    const paymentToast = document.getElementById('payment-toast');
    const paymentToastText = document.getElementById('payment-toast-text');

    const successOrderId = document.getElementById('success-order-id');
    const successOrderTotal = document.getElementById('success-order-total');
    const successOrderPayment = document.getElementById('success-order-payment');
    const successOrderAddress = document.getElementById('success-order-address');
    const successOrderDispatchMsg = document.getElementById('success-order-dispatch-msg');
    const successTrackBtn = document.getElementById('success-track-btn');

    let isSubmitting = false;
    let wsConnection = null;
    let pollInterval = null;

    function showPaymentToast(msg) {
        if (!paymentToast || !paymentToastText) return;
        paymentToastText.textContent = msg;
        paymentToast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
        paymentToast.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            paymentToast.classList.remove('opacity-100', 'translate-y-0');
            paymentToast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');
        }, 2800);
    }

    document.querySelectorAll('.payment-blocked-trigger').forEach(trigger => {
        trigger.onclick = () => {
            const title = trigger.dataset.title || 'Online Payment';
            showPaymentToast(`${title} is coming soon! All orders currently deliver via Cash on Delivery.`);
        };
    });

    document.querySelectorAll('.checkout-qty-inc').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const currentQty = parseInt(btn.dataset.qty) || 1;
            btn.disabled = true;
            try {
                await window.api.updateCartItem(id, currentQty + 1, userId);
                if (window.router) await window.router();
            } catch (err) {
                console.error(err);
            } finally {
                btn.disabled = false;
            }
        };
    });

    document.querySelectorAll('.checkout-qty-dec').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const currentQty = parseInt(btn.dataset.qty) || 1;
            btn.disabled = true;
            try {
                await window.api.updateCartItem(id, currentQty - 1, userId);
                if (window.router) await window.router();
            } catch (err) {
                console.error(err);
            } finally {
                btn.disabled = false;
            }
        };
    });

    document.querySelectorAll('.payment-option-label').forEach(label => {
        label.onclick = () => {
            document.querySelectorAll('.payment-option-label').forEach(l => {
                l.classList.remove('border-emerald', 'bg-emerald-50/50', 'dark:bg-emerald-950/20', 'border-2');
                l.classList.add('border-border');
            });
            label.classList.remove('border-border');
            label.classList.add('border-emerald', 'bg-emerald-50/50', 'dark:bg-emerald-950/20', 'border-2');
        };
    });

    // Slider Interaction
    if (track && thumb) {
        let isDragging = false;
        let startClientX = 0;
        let currentPos = 0;

        function getMaxSlide() {
            const trackWidth = track.clientWidth || track.offsetWidth || 320;
            const thumbWidth = thumb.clientWidth || thumb.offsetWidth || 48;
            return Math.max(20, trackWidth - thumbWidth - 8);
        }

        function updateSliderUI(x) {
            const maxSlide = getMaxSlide();
            const clamped = Math.max(0, Math.min(x, maxSlide));
            currentPos = clamped;
            thumb.style.transform = `translateX(${clamped}px)`;
            if (progress) progress.style.width = `${clamped + 24}px`;
            if (text) {
                const ratio = clamped / maxSlide;
                text.style.opacity = `${Math.max(0, 1 - (ratio * 1.3))}`;
            }
            return { clamped, maxSlide };
        }

        function onDragStart(clientX) {
            if (isSubmitting) return;
            isDragging = true;
            startClientX = clientX;
            thumb.style.transition = 'none';
            if (progress) progress.style.transition = 'none';
            if (text) text.style.transition = 'none';
        }

        function onDragMove(clientX) {
            if (!isDragging || isSubmitting) return;
            const delta = clientX - startClientX;
            const { clamped, maxSlide } = updateSliderUI(delta);

            if (clamped >= maxSlide * 0.70) {
                isDragging = false;
                if (navigator.vibrate) {
                    try { navigator.vibrate(25); } catch(e) {}
                }
                handleOrderPlacement();
            }
        }

        function onDragEnd() {
            if (!isDragging || isSubmitting) return;
            isDragging = false;
            resetSlider();
        }

        thumb.ontouchstart = (e) => {
            if (isSubmitting || !e.touches || !e.touches[0]) return;
            onDragStart(e.touches[0].clientX);

            function onTouchMove(moveEvent) {
                if (!moveEvent.touches || !moveEvent.touches[0]) return;
                onDragMove(moveEvent.touches[0].clientX);
            }

            function onTouchEnd() {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                document.removeEventListener('touchcancel', onTouchEnd);
                onDragEnd();
            }

            document.addEventListener('touchmove', onTouchMove, { passive: true });
            document.addEventListener('touchend', onTouchEnd);
            document.addEventListener('touchcancel', onTouchEnd);
        };

        thumb.onmousedown = (e) => {
            if (isSubmitting) return;
            e.preventDefault();
            onDragStart(e.clientX);

            function onMouseMove(moveEvent) {
                onDragMove(moveEvent.clientX);
            }

            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                onDragEnd();
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        track.onclick = (e) => {
            if (isSubmitting) return;
            const trackRect = track.getBoundingClientRect();
            const clickOffset = e.clientX - trackRect.left;
            const maxSlide = getMaxSlide();
            if (clickOffset > maxSlide * 0.35) {
                thumb.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
                if (progress) progress.style.transition = 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
                updateSliderUI(maxSlide);
                setTimeout(() => {
                    handleOrderPlacement();
                }, 200);
            }
        };
    }

    tapToPayBtn?.addEventListener('click', () => {
        if (!isSubmitting) handleOrderPlacement();
    });

    retryBtn?.addEventListener('click', () => {
        if (errorBanner) errorBanner.classList.add('hidden');
        if (!isSubmitting) handleOrderPlacement();
    });

    function resetSlider() {
        if (thumb && track) {
            thumb.style.transition = 'transform 0.25s ease';
            thumb.style.transform = 'translateX(0px)';
        }
        if (progress) {
            progress.style.transition = 'width 0.25s ease';
            progress.style.width = '0px';
        }
        if (text) {
            text.style.transition = 'opacity 0.2s ease';
            text.style.opacity = '1';
            text.textContent = `Slide to Confirm Order ₹${window.cartTotalCache || 40}`;
        }
        if (thumbIcon) {
            thumbIcon.textContent = 'arrow_forward';
            thumbIcon.classList.remove('animate-spin');
        }
        if (tapToPayBtn) {
            tapToPayBtn.classList.remove('opacity-75', 'pointer-events-none');
            const amt = window.cartTotalCache ? ` (₹${window.cartTotalCache})` : '';
            tapToPayBtn.innerHTML = `
                <span class="material-symbols-outlined text-base">bolt</span>
                <span>Place Cash on Delivery Order${amt}</span>
            `;
        }
    }

    async function handleOrderPlacement() {
        if (isSubmitting) return;

        const savedRoom = (localStorage.getItem('lpuquick_room') || '').trim();
        const savedBlock = (localStorage.getItem('lpuquick_block') || 'Block A').trim();
        const cleanPhone = (localStorage.getItem('lpuquick_phone') || '').replace(/\D/g, '');

        if (!window.hasUserConfiguredAddress() || !savedRoom || savedRoom === 'null' || savedRoom === 'undefined') {
            resetSlider();
            showPaymentToast('Room Address Required: Please set your hostel room number.');
            window.openAddressModal(true, () => {
                if (typeof window.router === 'function') window.router();
            });
            return;
        }

        if (!cleanPhone || cleanPhone.length !== 10) {
            resetSlider();
            showPaymentToast('Mobile Number Mandatory: 10-digit mobile is required for runner.');
            window.openAddressModal(true, () => {
                if (typeof window.router === 'function') window.router();
            });
            return;
        }

        isSubmitting = true;
        if (errorBanner) errorBanner.classList.add('hidden');

        if (thumb && track) {
            const finalX = track.offsetWidth - thumb.offsetWidth - 12;
            thumb.style.transition = 'transform 0.2s ease';
            thumb.style.transform = `translateX(${finalX}px)`;
            if (progress) {
                progress.style.transition = 'width 0.2s ease';
                progress.style.width = '100%';
            }
        }
        if (text) {
            text.style.opacity = '1';
            text.textContent = 'Placing your order...';
        }
        if (thumbIcon) {
            thumbIcon.textContent = 'hourglass_empty';
            thumbIcon.classList.add('animate-spin');
        }

        if (tapToPayBtn) {
            tapToPayBtn.classList.add('opacity-75', 'pointer-events-none');
            tapToPayBtn.innerHTML = `
                <span class="material-symbols-outlined text-base animate-spin">progress_activity</span>
                <span>Placing your order...</span>
            `;
        }

        const deliveryAddress = `BH13 (${savedBlock}), Room ${savedRoom}`;
        const selectedPaymentMethod = 'Cash on Delivery';

        let currentUserName = window.CURRENT_USER_NAME;
        let currentUserEmail = window.CURRENT_USER_EMAIL;
        let currentUserPhone = cleanPhone;

        if (!currentUserName || !currentUserEmail) {
            try {
                const savedUser = JSON.parse(localStorage.getItem('lpuquick_user') || '{}');
                if (savedUser) {
                    currentUserName = currentUserName || savedUser.name;
                    currentUserEmail = currentUserEmail || savedUser.email;
                    currentUserPhone = cleanPhone || savedUser.phone;
                }
            } catch(e) {}
        }

        const effectiveUserId = window.CURRENT_USER_ID || 
            (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null) || 
            (`user_phone_${cleanPhone}`);
        const guestCartId = localStorage.getItem('lpuquick_guest_cart_id') || '';
        const clientCartItems = (window.cartState && Array.isArray(window.cartState.items)) ? window.cartState.items : [];

        let safetyTimeout = setTimeout(() => {
            if (isSubmitting) {
                console.warn('[Checkout Safety Timeout Triggered]');
                isSubmitting = false;
                resetSlider();
                const timeoutMsg = 'Network is slow. Please tap retry to confirm.';
                showPaymentToast(timeoutMsg);
                if (errorBanner) {
                    errorBanner.classList.remove('hidden');
                    if (errorMsg) errorMsg.textContent = timeoutMsg;
                }
            }
        }, 12000);

        let progressTimer = setTimeout(() => {
            if (isSubmitting && text) {
                text.textContent = 'Connecting store...';
            }
        }, 2200);

        try {
            const res = await window.api.checkout(effectiveUserId, selectedPaymentMethod, deliveryAddress, {
                phone: currentUserPhone,
                name: currentUserName || 'LPU Student',
                email: currentUserEmail || '',
                guestUserId: guestCartId,
                items: clientCartItems
            });

            if (res && res.success && res.order) {
                clearTimeout(safetyTimeout);
                clearTimeout(progressTimer);

                try {
                    const existingUser = JSON.parse(localStorage.getItem('lpuquick_user') || '{}');
                    if (!existingUser.id) {
                        const newSession = {
                            id: res.order.user_id,
                            name: res.order.customer_name || currentUserName || 'LPU Student',
                            phone: cleanPhone,
                            email: currentUserEmail || ''
                        };
                        localStorage.setItem('lpuquick_user', JSON.stringify(newSession));
                        window.CURRENT_USER_ID = res.order.user_id;
                        window.CURRENT_USER_NAME = newSession.name;
                    }
                } catch(e) {}

                if (text) text.textContent = 'Order Placed! ✓';
                if (thumbIcon) {
                    thumbIcon.classList.remove('animate-spin');
                    thumbIcon.textContent = 'check';
                }

                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Order Placed! Campus delivery runner dispatched.', 'success', 'bolt');
                }

                setTimeout(() => {
                    renderSuccessScreen(res.order);
                }, 200);
            } else if (res && res.error === 'STORE_CLOSED') {
                clearTimeout(safetyTimeout);
                clearTimeout(progressTimer);
                isSubmitting = false;
                resetSlider();
                if (typeof window.syncStoreAvailability === 'function') {
                    window.syncStoreAvailability();
                }
                const msg = res.message || 'Dark store is temporarily closed for orders.';
                showPaymentToast(msg);
                if (errorBanner) {
                    errorBanner.classList.remove('hidden');
                    if (errorMsg) errorMsg.textContent = msg;
                }
                return;
            } else if (res && res.error === 'ACCOUNT_BLOCKED') {
                clearTimeout(safetyTimeout);
                clearTimeout(progressTimer);
                isSubmitting = false;
                resetSlider();
                window.__isUserBlocked = true;
                window.__userBlockReason = res.reason || 'Fake Orders';
                showPaymentToast(res.message || 'Account restricted.');
                if (typeof window.renderBlockedPage === 'function') {
                    window.location.hash = '#/blocked';
                }
                return;
            } else {
                throw new Error(res?.message || res?.error || 'Failed to place order. Please retry.');
            }
        } catch (err) {
            clearTimeout(safetyTimeout);
            clearTimeout(progressTimer);
            console.error('Order placement failed:', err);
            isSubmitting = false;
            resetSlider();

            const displayErr = err.message || 'Please check your connection and tap to retry.';
            showPaymentToast(displayErr);
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(displayErr, 'error', 'error');
            }
            if (errorBanner) {
                errorBanner.classList.remove('hidden');
                if (errorMsg) errorMsg.textContent = displayErr;
            }
        } finally {
            clearTimeout(safetyTimeout);
            clearTimeout(progressTimer);
        }
    }

    function renderSuccessScreen(order) {
        if (formSection) formSection.classList.add('hidden');
        if (successSection) {
            successSection.classList.remove('hidden');
        }
        if (headerTitle) headerTitle.textContent = 'Order Status';
        if (backLink) backLink.href = '#/';

        const formattedId = (order.id || '').replace('order_', '').toUpperCase();
        if (successOrderId) successOrderId.textContent = `#${formattedId}`;
        if (successOrderTotal) successOrderTotal.textContent = `₹${order.total}`;
        if (successOrderPayment) successOrderPayment.textContent = order.payment_method || 'Cash on Delivery';
        if (successOrderAddress) successOrderAddress.textContent = order.delivery_address || 'BH13 (Block A), Room 304';
        if (successOrderDispatchMsg) {
            successOrderDispatchMsg.textContent = `Estimated delivery: ${order.estimated_minutes || 3} mins to ${order.delivery_address || 'BH13'}`;
        }

        const timeEl1 = document.getElementById('timeline-time-1');
        if (timeEl1) {
            timeEl1.textContent = new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }

        successTrackBtn?.addEventListener('click', () => {
            window.location.hash = '#/orders';
        });

        connectRealTimeOrderTracking(order.id);
    }

    function updateTimelineStep(stepNumber, timestamp, riderName) {
        for (let i = 1; i <= stepNumber; i++) {
            const stepEl = document.getElementById(`timeline-step-${i}`);
            const timeEl = document.getElementById(`timeline-time-${i}`);
            if (stepEl) {
                stepEl.classList.remove('opacity-50');
                const dot = stepEl.querySelector('.timeline-dot');
                if (dot) {
                    dot.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'border', 'border-border', 'text-slate-400');
                    dot.classList.add('bg-emerald', 'text-white');
                    dot.innerHTML = '<span class="material-symbols-outlined text-xs">check</span>';
                }
            }
            if (timeEl && i === stepNumber && timestamp) {
                timeEl.textContent = timestamp;
            }
        }

        if (stepNumber >= 4 && riderName) {
            const desc4 = document.getElementById('timeline-desc-4');
            if (desc4) desc4.textContent = `Campus runner ${riderName} is walking from BH13 Hub to your room`;
        }
    }

    function connectRealTimeOrderTracking(orderId) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/track/${orderId}`;

        try {
            wsConnection = new WebSocket(wsUrl);

            wsConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const stepMap = { 'Order Placed': 1, 'Order Confirmed': 2, 'Preparing': 3, 'Out for Delivery': 4, 'Delivered': 5 };
                    const step = data.step || stepMap[data.status] || 1;
                    const timestamp = data.timestamp || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    updateTimelineStep(step, timestamp, data.rider_name || data.riderName);
                } catch (e) {
                    console.error('Error parsing WS message:', e);
                }
            };

            wsConnection.onerror = () => {
                console.warn('WebSocket error, switching to fallback polling.');
                startPollingFallback(orderId);
            };

            wsConnection.onclose = () => {
                console.log('WS tracking connection closed.');
            };
        } catch (err) {
            console.warn('WebSocket unavailable, using polling fallback.');
            startPollingFallback(orderId);
        }
    }

    function startPollingFallback(orderId) {
        if (pollInterval) clearInterval(pollInterval);
        const checkOrder = async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            try {
                const res = await window.api.getOrderDetail(orderId);
                if (res && res.order) {
                    const status = res.order.status;
                    const stepMap = { 'Order Placed': 1, 'Order Confirmed': 2, 'Preparing': 3, 'Out for Delivery': 4, 'Delivered': 5 };
                    const currentStep = stepMap[status] || 1;
                    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    updateTimelineStep(currentStep, timeStr, res.order.rider_name);
                    if (currentStep >= 5 || status === 'cancelled') clearInterval(pollInterval);
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        };

        pollInterval = setInterval(checkOrder, 6000);
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && orderId) checkOrder();
            }, { passive: true });
        }
    }
};

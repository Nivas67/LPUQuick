// Checkout Page — Complete Ground-Up Refreshing Redesign (1-Page Luxury Liquid Glass Checkout)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.checkout = async function() {
    let savedHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id');
    if (!savedHostel) {
        const addrDetail = localStorage.getItem('lpuquick_address_detail') || '';
        const match = addrDetail.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
        if (match) {
            savedHostel = match[1].toUpperCase().replace(/\s+/g, '-');
            if (/^[BG]H\d+$/.test(savedHostel)) {
                savedHostel = savedHostel.replace(/^([A-Z]+)(\d+)/, '$1-$2');
            }
        }
    }
    if (!savedHostel) {
        const addr = localStorage.getItem('lpuquick_address') || '';
        const match = addr.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
        if (match) {
            savedHostel = match[1].toUpperCase().replace(/\s+/g, '-');
            if (/^[BG]H\d+$/.test(savedHostel)) {
                savedHostel = savedHostel.replace(/^([A-Z]+)(\d+)/, '$1-$2');
            }
        }
    }
    savedHostel = savedHostel || 'BH-13';

    let cartData;
    const userId = window.getEffectiveUserId();
    try { 
        cartData = await window.api.getCart(userId, savedHostel); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } }; 
    }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 };
    
    // Accurate MRP, Subtotal & Quantity calculations
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);
    
    // Dynamic Settings from Owner
    let checkoutSettings = window.latestCheckoutSettings || null;
    try {
        const settingsRes = await fetch('/api/checkout/settings', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
        if (settingsRes && settingsRes.success && settingsRes.settings) {
            checkoutSettings = settingsRes.settings;
            window.latestCheckoutSettings = checkoutSettings;
        }
    } catch(e) {}

    checkoutSettings = checkoutSettings || {
        offers_enabled: false,
        offer_type: 'percentage',
        offer_value: 0,
        minimum_order_value: 35,
        maximum_discount: 0,
        free_delivery_enabled: true,
        free_delivery_threshold: 0,
        delivery_fee: 0,
        handling_fee: 3,
        handling_fee_enabled: true,
        min_cart_value: 35
    };

    // Calculate Eligible Global Offer
    let globalDiscount = 0;
    let offerLabel = '';
    let isOfferActive = Boolean(checkoutSettings.offers_enabled);
    if (isOfferActive && (checkoutSettings.start_date || checkoutSettings.end_date)) {
        const now = Date.now();
        if (checkoutSettings.start_date && now < new Date(checkoutSettings.start_date).getTime()) isOfferActive = false;
        if (checkoutSettings.end_date && now > new Date(checkoutSettings.end_date).getTime()) isOfferActive = false;
    }
    const meetsOfferMin = subtotal >= (Number(checkoutSettings.minimum_order_value) || 0);

    if (isOfferActive && meetsOfferMin && subtotal > 0) {
        if (checkoutSettings.offer_type === 'percentage') {
            const raw = Math.round(subtotal * (Number(checkoutSettings.offer_value || 0) / 100));
            const maxD = Number(checkoutSettings.maximum_discount) || 0;
            globalDiscount = maxD > 0 ? Math.min(raw, maxD) : raw;
            offerLabel = `${checkoutSettings.offer_value}% OFF`;
        } else if (checkoutSettings.offer_type === 'fixed') {
            globalDiscount = Math.min(subtotal, Number(checkoutSettings.offer_value) || 0);
            offerLabel = `₹${checkoutSettings.offer_value} OFF`;
        } else if (checkoutSettings.offer_type === 'free_delivery') {
            globalDiscount = 0;
            offerLabel = 'Free Delivery';
        }
    }

    // Delivery Fee calculation
    const deliveryFeeBase = Math.max(0, Number(checkoutSettings.delivery_fee) || 0);
    let deliveryFee = 0;
    let isFreeDelivery = false;
    if (items.length > 0) {
        if (deliveryFeeBase <= 0) {
            deliveryFee = 0;
            isFreeDelivery = true;
        } else {
            const meetsFreeThreshold = checkoutSettings.free_delivery_enabled && subtotal >= (Number(checkoutSettings.free_delivery_threshold) || 0);
            const meetsFreeOffer = isOfferActive && checkoutSettings.offer_type === 'free_delivery' && meetsOfferMin;
            if (meetsFreeThreshold || meetsFreeOffer) {
                deliveryFee = 0;
                isFreeDelivery = true;
            } else {
                deliveryFee = deliveryFeeBase;
                isFreeDelivery = false;
            }
        }
    }

    // Handling Fee calculation
    const handlingFee = (items.length > 0 && checkoutSettings.handling_fee_enabled) ? (Number(checkoutSettings.handling_fee) || 0) : 0;

    // Minimum Order Value
    const MIN_ORDER_VALUE = Number(checkoutSettings.min_cart_value) || 35;
    const isMinOrderMet = subtotal >= MIN_ORDER_VALUE;
    const minOrderShortfall = Math.max(0, MIN_ORDER_VALUE - subtotal);

    // Exact Total
    const exactTotal = Math.max(0, subtotal - globalDiscount + deliveryFee + handlingFee);
    window.cartTotalCache = exactTotal;
    window.cartSubtotalCache = subtotal;
    window.cartMinOrderCache = MIN_ORDER_VALUE;

    // Total Real Savings: MRP discount + offer + delivery savings
    const deliverySavings = isFreeDelivery ? (deliveryFeeBase > 0 ? deliveryFeeBase : 25) : 0;
    const totalSavings = mrpDiscount + globalDiscount + deliverySavings;


    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const savedPhone = (localStorage.getItem('lpuquick_phone') || window.currentPhone || '').replace(/\D/g, '');
    const address = (savedRoom && savedPhone.length === 10) 
        ? `${savedHostel} (${savedBlock}), Room ${savedRoom} • +91${savedPhone}` 
        : (savedRoom ? `${savedHostel} (${savedBlock}), Room ${savedRoom} • ⚠️ Mobile Number Mandatory` : `Please set your ${savedHostel} room & mobile number`);

    const itemRows = items.map(item => {
        const itemMrp = Number(item.mrp) || Number(item.price) || 0;
        const itemPrice = Number(item.price) || 0;
        const hasItemDiscount = itemMrp > itemPrice;
        const discPercent = hasItemDiscount ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;

        const cachedProd = window.__cachedProducts?.get(item.product_id);
        const stockLeft = (item.stock_left !== undefined && item.stock_left !== null)
            ? Number(item.stock_left)
            : ((cachedProd && cachedProd.stock_left !== undefined && cachedProd.stock_left !== null)
                ? Number(cachedProd.stock_left)
                : (item.in_stock === false ? 0 : 10));
        const isMaxStockReached = (Number(item.quantity) || 1) >= stockLeft && stockLeft > 0;

        return `
        <div class="flex items-center justify-between py-3 border-b border-[var(--glass-border)] text-xs cart-checkout-row" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}" data-stock-left="${stockLeft}">
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
                    <button class="checkout-qty-dec" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" title="Decrease or remove">
                        <span class="material-symbols-outlined text-xs">remove</span>
                    </button>
                    <span class="qty-num">${item.quantity}</span>
                    <button class="checkout-qty-inc ${isMaxStockReached ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" ${isMaxStockReached ? 'disabled' : ''} title="${isMaxStockReached ? `Max stock limit (${stockLeft})` : 'Add one more'}">
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
                                <span class="clay-pill text-[10px] text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5">${savedHostel}</span>
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
                    <button type="button" class="clay-pill px-3.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:scale-105 active:scale-95 transition-transform cursor-pointer" onclick="window.openAddressModal(false, () => { if (typeof window.router === 'function') window.router(); })">Change</button>
                </div>
            </div>

            <!-- Order Items Summary -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)]">
                <div class="flex items-center justify-between mb-2 pb-2.5 border-b border-[var(--glass-border)]">
                    <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span class="material-symbols-outlined text-base text-emerald">shopping_bag</span>
                        Order Items (${totalQuantity})
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

                    ${globalDiscount > 0 ? `
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>Offer (${offerLabel})</span>
                        <span>-₹${globalDiscount}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            ${isFreeDelivery ? `
                                ${deliveryFeeBase > 0 ? `<span class="line-through text-[11px] text-slate-400">₹${deliveryFeeBase}</span>` : ''}
                                <span class="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                            ` : `
                                <span class="font-bold text-slate-900 dark:text-white">₹${deliveryFee}</span>
                            `}
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <div class="flex items-center gap-1">
                            <span>Handling Fee</span>
                            <span class="text-[10px] text-slate-400" title="Corridor pack & dispatch fee">ℹ️</span>
                        </div>
                        <span class="font-black text-slate-900 dark:text-white" id="checkout-handling-val">₹${handlingFee}</span>
                    </div>
                    
                    <div class="border-t border-[var(--glass-border)] pt-3.5 mt-2 flex justify-between items-center text-sm font-black">
                        <div>
                            <span class="text-slate-900 dark:text-white tracking-tight">Total to Pay</span>
                            <p class="text-[10px] text-emerald font-bold">${isFreeDelivery ? 'Free campus delivery' : `Delivery ₹${deliveryFee}`}</p>
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
                    <span class="liquid-badge text-[10px] text-emerald-800 dark:text-emerald-300 font-black px-2.5 py-0.5" id="active-payment-badge">Cash on Delivery Active</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="payment-options">
                    <!-- 1. Cash on Delivery (ACTIVE) -->
                    <label class="flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 cursor-pointer payment-option-label relative shadow-md transition-all select-none" data-method="cod" id="option-cod">
                        <input type="radio" name="paymentMethod" value="cod" checked class="text-emerald focus:ring-emerald">
                        <div>
                            <p class="font-black text-xs text-slate-900 dark:text-white">Cash on Delivery</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pay at ${savedHostel} room door</p>
                        </div>
                    </label>

                    <!-- 2. UPI / GPay / QR (Powered by YouPI-PG) -->
                    <label class="flex items-center gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-white/40 dark:bg-slate-800/40 cursor-pointer payment-option-label relative shadow-md transition-all select-none hover:border-emerald-500/50" data-method="upi" id="option-upi">
                        <input type="radio" name="paymentMethod" value="upi" class="text-emerald focus:ring-emerald">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-black text-xs text-slate-900 dark:text-white truncate">UPI / QR</p>
                                <span class="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30">YouPI</span>
                            </div>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">GPay • PhonePe • Paytm • CRED</p>
                        </div>
                    </label>

                    <!-- 3. Cards / NetBanking (Soon) -->
                    <div class="flex items-center gap-3 p-4 rounded-2xl border border-[var(--glass-border)] bg-white/40 dark:bg-slate-800/40 opacity-60 cursor-pointer payment-blocked-trigger relative select-none" data-title="Card & NetBanking">
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

                <!-- Online Payment Trust & Guidance Note -->
                <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs shadow-xs">
                    <span class="material-symbols-outlined text-base text-emerald-500 shrink-0 mt-0.5">verified_user</span>
                    <div class="space-y-0.5 min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <p class="font-black text-[11px] text-emerald-700 dark:text-emerald-300">⚡ Online Payment via UPI / QR Powered by YouPI</p>
                            <span class="liquid-badge text-[8.5px] font-black px-1.5 py-0.2">ZERO EXTRA FEES</span>
                        </div>
                        <p class="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            Scan dynamic QR or launch 1-tap Google Pay, PhonePe, Paytm, CRED or any UPI app. Instant confirmation with zero surcharge.
                        </p>
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
                ${!isMinOrderMet ? `
                <div class="space-y-3">
                    <div class="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 backdrop-blur-md">
                        <div class="flex items-center gap-2.5">
                            <span class="material-symbols-outlined text-2xl text-amber-500 animate-bounce">shopping_bag</span>
                            <div>
                                <p class="font-black text-xs sm:text-sm">Minimum Order Value is ₹${MIN_ORDER_VALUE}</p>
                                <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Your current subtotal is ₹${subtotal}. Add ₹${minOrderShortfall} more to place this order.</p>
                            </div>
                        </div>
                    </div>
                    <a href="#/" class="clay-btn clay-btn-primary w-full py-4 px-5 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <span class="material-symbols-outlined text-base">add_shopping_cart</span>
                        <span>Add Items Worth ₹${minOrderShortfall} More</span>
                    </a>
                </div>
                ` : (!window.hasUserConfiguredAddress() ? `
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
                `)}
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
            const rawStock = btn.dataset.stockLeft ?? row?.dataset?.stockLeft;
            const stockLeft = (rawStock !== undefined && rawStock !== '' && rawStock !== null) ? Number(rawStock) : 0;
            const curQty = parseInt(btn.dataset.qty) || 1;

            if (curQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in store!`, 'warning', 'inventory_2');
                }
                return;
            }

            const nextQty = curQty + 1;
            if (productId) {
                window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
                if (window.router) window.router();
            } else if (cartId) {
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
            const rawStock = btn.dataset.stockLeft ?? row?.dataset?.stockLeft;
            const stockLeft = (rawStock !== undefined && rawStock !== '' && rawStock !== null) ? Number(rawStock) : 0;
            const curQty = parseInt(btn.dataset.qty) || 1;

            if (curQty <= 1) {
                if (productId) {
                    window.setOptimisticCartQuantity(productId, 0, stockLeft);
                } else if (cartId) {
                    await window.api.removeCartItem(cartId);
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Item removed from cart', 'info', 'delete');
                }
                if (window.router) window.router();
            } else {
                const nextQty = curQty - 1;
                if (productId) {
                    window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
                    if (window.router) window.router();
                } else if (cartId) {
                    await window.api.updateCartItem(cartId, nextQty, userId);
                    if (window.router) window.router();
                }
            }
        };
    });

    // Blocked payment method alerts
    document.querySelectorAll('.payment-blocked-trigger').forEach(trigger => {
        trigger.onclick = () => {
            const title = trigger.dataset.title || 'Online Payment';
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`⏳ ${title} is onboarding. Please use Cash on Delivery or UPI.`, 'info', 'account_balance_wallet');
            }
        };
    });

    // Payment method toggle handlers (COD vs UPI YouPI-PG)
    const optionCod = document.getElementById('option-cod');
    const optionUpi = document.getElementById('option-upi');
    const badgeEl = document.getElementById('active-payment-badge');
    const paySliderText = document.getElementById('pay-slider-text');
    const tapToPayBtn = document.getElementById('tap-to-pay-btn');

    function updatePaymentMethodUI(method) {
        const total = window.cartTotalCache || 0;
        if (method === 'upi') {
            if (optionCod) {
                optionCod.classList.remove('border-2', 'border-emerald-500', 'bg-emerald-500/10');
                optionCod.classList.add('border', 'border-[var(--glass-border)]', 'bg-white/40', 'dark:bg-slate-800/40');
            }
            if (optionUpi) {
                optionUpi.classList.remove('border', 'border-[var(--glass-border)]', 'bg-white/40', 'dark:bg-slate-800/40');
                optionUpi.classList.add('border-2', 'border-emerald-500', 'bg-emerald-500/10');
            }
            if (badgeEl) badgeEl.textContent = 'UPI / QR (YouPI) Selected';
            if (paySliderText) paySliderText.textContent = `Slide to Pay ₹${total} via UPI`;
            if (tapToPayBtn) {
                tapToPayBtn.innerHTML = `<span class="material-symbols-outlined text-base">qr_code_2</span> <span>⚡ Pay ₹${total} via UPI (YouPI)</span>`;
            }
        } else {
            if (optionUpi) {
                optionUpi.classList.remove('border-2', 'border-emerald-500', 'bg-emerald-500/10');
                optionUpi.classList.add('border', 'border-[var(--glass-border)]', 'bg-white/40', 'dark:bg-slate-800/40');
            }
            if (optionCod) {
                optionCod.classList.remove('border', 'border-[var(--glass-border)]', 'bg-white/40', 'dark:bg-slate-800/40');
                optionCod.classList.add('border-2', 'border-emerald-500', 'bg-emerald-500/10');
            }
            if (badgeEl) badgeEl.textContent = 'Cash on Delivery Active';
            if (paySliderText) paySliderText.textContent = `Slide to Confirm Order ₹${total}`;
            if (tapToPayBtn) {
                tapToPayBtn.innerHTML = `<span class="material-symbols-outlined text-base">bolt</span> <span>⚡ 1-Tap Quick Place (₹${total})</span>`;
            }
        }
    }

    if (optionCod) {
        optionCod.onclick = (e) => {
            const radio = optionCod.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            updatePaymentMethodUI('cod');
        };
    }

    if (optionUpi) {
        optionUpi.onclick = (e) => {
            const radio = optionUpi.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
            updatePaymentMethodUI('upi');
        };
    }

    let isSubmitting = false;

    function resetTapBtn() {
        const tapBtn = document.getElementById('tap-to-pay-btn');
        if (tapBtn) {
            tapBtn.disabled = false;
            const total = window.cartTotalCache || 0;
            const isUpi = document.querySelector('input[name="paymentMethod"]:checked')?.value === 'upi';
            if (isUpi) {
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base">qr_code_2</span> <span>⚡ Pay ₹${total} via UPI (YouPI)</span>`;
            } else {
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base">bolt</span> <span>⚡ 1-Tap Quick Place (₹${total})</span>`;
            }
        }
    }

    function openCampusUpiFallbackModal(opts) {
        const orderId = opts.orderId;
        const amount = Number(opts.amount || window.cartTotalCache || 0).toFixed(2);
        const upiId = opts.upiId || 'lpuquick@upi';
        const payeeName = 'LPUQuick Campus Store';
        const note = `LPUQuick ${opts.savedHostel} Order ${orderId}`;
        const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUri)}`;

        const existing = document.getElementById('campus-upi-modal-root');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'campus-upi-modal-root';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none';
        modal.innerHTML = `
            <div class="relative w-full max-w-sm rounded-3xl p-5 sm:p-6 bg-slate-900 border border-emerald-500/40 text-white shadow-2xl space-y-4">
                <!-- Close Button -->
                <button type="button" id="close-campus-upi-modal" class="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>

                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xl">qr_code_2</span>
                    </div>
                    <div>
                        <h3 class="font-black text-sm tracking-tight">Instant UPI Payment</h3>
                        <p class="text-[10px] text-slate-400">Order #${orderId.replace('order_', '').toUpperCase()}</p>
                    </div>
                </div>

                <div class="text-center py-1">
                    <span class="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Amount to Pay</span>
                    <p class="text-3xl font-black text-emerald-400 tracking-tight">₹${amount}</p>
                </div>

                <!-- Dynamic QR Code Card -->
                <div class="p-3 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[210px]">
                    <img src="${qrUrl}" alt="Scan to pay via UPI" class="w-44 h-44 object-contain rounded-lg" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi'">
                    <span class="text-[9px] font-black text-slate-700 mt-1 uppercase tracking-wider flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Scan with any UPI App
                    </span>
                </div>

                <!-- UPI VPA & Copy Button -->
                <div class="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                    <div class="truncate mr-2">
                        <span class="text-[9px] text-slate-400 uppercase font-bold block">Campus UPI ID</span>
                        <span class="font-mono text-emerald-300 font-bold text-xs" id="campus-upi-vpa-val">${upiId}</span>
                    </div>
                    <button type="button" id="copy-upi-vpa-btn" class="bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shrink-0 transition-colors">
                        Copy
                    </button>
                </div>

                <!-- 1-Tap Mobile Intent Buttons -->
                <div>
                    <span class="text-[10px] text-slate-400 font-bold block mb-1.5 text-center">Tap to Open App on Mobile</span>
                    <div class="grid grid-cols-4 gap-1.5">
                        <a href="${upiIntentUri}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center flex flex-col items-center gap-1 text-[9px] font-bold text-white border border-slate-700/60 transition-transform active:scale-95">
                            <span class="text-emerald-400 text-xs">🟢</span> GPay
                        </a>
                        <a href="${upiIntentUri}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center flex flex-col items-center gap-1 text-[9px] font-bold text-white border border-slate-700/60 transition-transform active:scale-95">
                            <span class="text-purple-400 text-xs">🟣</span> PhonePe
                        </a>
                        <a href="${upiIntentUri}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center flex flex-col items-center gap-1 text-[9px] font-bold text-white border border-slate-700/60 transition-transform active:scale-95">
                            <span class="text-sky-400 text-xs">🔷</span> Paytm
                        </a>
                        <a href="${upiIntentUri}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-center flex flex-col items-center gap-1 text-[9px] font-bold text-white border border-slate-700/60 transition-transform active:scale-95">
                            <span class="text-amber-400 text-xs">⚡</span> UPI
                        </a>
                    </div>
                </div>

                <!-- UTR Input & Submit Confirmation -->
                <div class="space-y-2 pt-1 border-t border-slate-800">
                    <input type="text" id="campus-upi-utr-input" placeholder="12-digit UTR / Ref No. (Optional)" maxlength="16" class="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-center">
                    <button type="button" id="confirm-campus-upi-btn" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">verified</span>
                        <span>I Have Completed Payment</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#close-campus-upi-modal').onclick = () => {
            modal.remove();
            if (typeof opts.onCancel === 'function') opts.onCancel();
        };

        const copyBtn = modal.querySelector('#copy-upi-vpa-btn');
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(upiId).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
            });
        };

        modal.querySelector('#confirm-campus-upi-btn').onclick = () => {
            const utr = modal.querySelector('#campus-upi-utr-input').value.trim();
            modal.remove();
            if (typeof opts.onSuccess === 'function') opts.onSuccess(utr || `UPI_${Date.now().toString().slice(-6)}`);
        };
    }

    async function finalizeOrderPlacement(orderId, paymentMethod, paymentStatus = 'pending', utr = '', paymentId = '', savedPhone = '', savedHostel = '', fullAddress = '') {
        const userId = window.getEffectiveUserId();
        try {
            const orderRes = await window.api.checkout(userId, paymentMethod, fullAddress, {
                orderId,
                phone: savedPhone,
                name: window.CURRENT_USER_NAME || 'LPU Student',
                email: window.CURRENT_USER_EMAIL || '',
                hostel_id: savedHostel,
                paymentStatus,
                utr,
                paymentId
            });

            if (orderRes && orderRes.success && orderRes.order) {
                const order = orderRes.order;
                if (typeof window.triggerActiveOrderPoll === 'function') {
                    window.triggerActiveOrderPoll();
                }
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
                    const payEl = document.getElementById('success-order-payment');
                    if (payEl) {
                        payEl.innerHTML = paymentStatus === 'PAID'
                            ? `<span class="text-emerald-600 dark:text-emerald-400 font-black">Paid via UPI (YouPI) ${utr ? `• UTR: ${utr}` : ''}</span>`
                            : paymentMethod;
                    }
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(
                        paymentStatus === 'PAID' ? '🎉 Payment verified! Order confirmed & dispatched.' : '🎉 Order placed successfully! Runner dispatched.',
                        'success',
                        'check_circle'
                    );
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
            resetTapBtn();
            if (typeof window.__resetCheckoutSlider === 'function') {
                window.__resetCheckoutSlider();
            }
            isSubmitting = false;
        }
    }

    async function executeOrderPlacement() {
        if (isSubmitting) return;
        isSubmitting = true;

        const minOrderLimit = window.cartMinOrderCache || 35;
        if ((window.cartSubtotalCache !== undefined) && window.cartSubtotalCache < minOrderLimit) {
            isSubmitting = false;
            const shortfall = minOrderLimit - (window.cartSubtotalCache || 0);
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`⚠️ Minimum order value is ₹${minOrderLimit}. Please add items worth ₹${shortfall} more.`, 'warning', 'shopping_bag');
            }
            window.location.hash = '#/cart';
            return;
        }

        let savedHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id');
        if (!savedHostel) {
            const addrDetail = localStorage.getItem('lpuquick_address_detail') || '';
            const match = addrDetail.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
            if (match) {
                savedHostel = match[1].toUpperCase().replace(/\s+/g, '-');
                if (/^[BG]H\d+$/.test(savedHostel)) {
                    savedHostel = savedHostel.replace(/^([A-Z]+)(\d+)/, '$1-$2');
                }
            }
        }
        if (!savedHostel) {
            const addr = localStorage.getItem('lpuquick_address') || '';
            const match = addr.match(/([B|G]H[\s\-]?\d+|UniMall)/i);
            if (match) {
                savedHostel = match[1].toUpperCase().replace(/\s+/g, '-');
                if (/^[BG]H\d+$/.test(savedHostel)) {
                    savedHostel = savedHostel.replace(/^([A-Z]+)(\d+)/, '$1-$2');
                }
            }
        }
        savedHostel = savedHostel || 'BH-13';

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

        try {
            const activeHostels = await window.api?.getActiveHostels?.() || [];
            if (activeHostels && activeHostels.length > 0) {
                const normSelected = (savedHostel || '').toUpperCase().replace(/[\s\-_]/g, '');
                const isHostelLive = activeHostels.some(h => {
                    const normH = (h.id || h.name || '').toUpperCase().replace(/[\s\-_]/g, '');
                    return normH === normSelected;
                });
                if (!isHostelLive) {
                    isSubmitting = false;
                    const errBanner = document.getElementById('checkout-error-banner');
                    const errMsg = document.getElementById('checkout-error-msg');
                    if (errBanner) errBanner.classList.remove('hidden');
                    if (errMsg) errMsg.textContent = `${savedHostel} is currently closed / opening soon. Please select an active hostel to order.`;
                    window.openAddressModal(true, () => {
                        if (window.router) window.router();
                    });
                    return;
                }
            }
        } catch (e) {}

        const fullAddress = `[${savedHostel}] ${savedHostel} (${savedBlock}), Room ${savedRoom}`;
        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        const selectedMethodType = paymentRadio ? paymentRadio.value : 'cod';
        const isUpiPayment = selectedMethodType === 'upi';

        const tapBtn = document.getElementById('tap-to-pay-btn');
        if (tapBtn) {
            tapBtn.disabled = true;
            tapBtn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> ${isUpiPayment ? 'Opening YouPI Gateway...' : 'Placing Order...'}`;
        }

        // UPI via YouPI-PG Gateway Pathway
        if (isUpiPayment) {
            const orderId = window.__currentCheckoutOrderId || `order_${Math.random().toString(36).slice(2, 10)}`;
            window.__currentCheckoutOrderId = orderId;

            try {
                const youpiRes = await window.api.initYoupiPayment({
                    orderId,
                    userId,
                    hostel_id: savedHostel,
                    deliveryAddress: fullAddress,
                    phone: savedPhone,
                    name: window.CURRENT_USER_NAME || 'LPU Student',
                    email: window.CURRENT_USER_EMAIL || ''
                });

                if (youpiRes && youpiRes.success && youpiRes.checkoutUrl) {
                    const { paymentId, checkoutUrl, amount } = youpiRes;

                    // Launch YouPI Modal
                    if (window.Youpi && typeof window.Youpi.pay === 'function') {
                        window.Youpi.pay({
                            paymentId,
                            checkoutUrl,
                            order_id: orderId,
                            amount: amount || window.cartTotalCache || 0,
                            currency: 'INR',
                            name: 'LPUQuick',
                            description: `Campus Delivery - ${savedHostel}`,
                            customer: {
                                name: window.CURRENT_USER_NAME || 'LPU Student',
                                phone: savedPhone,
                                email: window.CURRENT_USER_EMAIL || ''
                            },
                            handler: async function(response) {
                                console.log('[YouPI Payment Handler Received]:', response);
                                const utr = response?.utr || response?.bankRef || '';
                                await finalizeOrderPlacement(orderId, 'UPI (YouPI)', 'PAID', utr, paymentId, savedPhone, savedHostel, fullAddress);
                            },
                            onSuccess: async function(response) {
                                console.log('[YouPI Payment onSuccess]:', response);
                                const utr = response?.utr || response?.bankRef || '';
                                await finalizeOrderPlacement(orderId, 'UPI (YouPI)', 'PAID', utr, paymentId, savedPhone, savedHostel, fullAddress);
                            },
                            onFailed: function(response) {
                                console.warn('[YouPI Payment Failed]:', response);
                                isSubmitting = false;
                                resetTapBtn();
                                if (typeof window.__resetCheckoutSlider === 'function') {
                                    window.__resetCheckoutSlider();
                                }
                                if (typeof window.showClientToast === 'function') {
                                    window.showClientToast(`❌ Payment failed: ${response?.reason || 'Could not complete UPI transaction'}`, 'error', 'error');
                                }
                            },
                            onClose: function() {
                                console.log('[YouPI Checkout Modal Dismissed]');
                                isSubmitting = false;
                                resetTapBtn();
                                if (typeof window.__resetCheckoutSlider === 'function') {
                                    window.__resetCheckoutSlider();
                                }
                            }
                        });
                        return;
                    } else if (checkoutUrl) {
                        window.location.href = checkoutUrl;
                        return;
                    }
                }

                // If gateway service is offline or in direct UPI mode: Fallback to built-in Campus UPI QR modal
                openCampusUpiFallbackModal({
                    orderId,
                    amount: window.cartTotalCache || youpiRes?.total || 0,
                    savedHostel,
                    savedPhone,
                    fullAddress,
                    upiId: youpiRes?.upiId || 'lpuquick@upi',
                    onSuccess: async (utr) => {
                        await finalizeOrderPlacement(orderId, 'UPI (Direct QR)', 'PAID', utr, `upi_${Date.now()}`, savedPhone, savedHostel, fullAddress);
                    },
                    onCancel: () => {
                        isSubmitting = false;
                        resetTapBtn();
                        if (typeof window.__resetCheckoutSlider === 'function') {
                            window.__resetCheckoutSlider();
                        }
                    }
                });
            } catch (err) {
                console.error('[YouPI Checkout Error]:', err);
                openCampusUpiFallbackModal({
                    orderId,
                    amount: window.cartTotalCache || 0,
                    savedHostel,
                    savedPhone,
                    fullAddress,
                    upiId: 'lpuquick@upi',
                    onSuccess: async (utr) => {
                        await finalizeOrderPlacement(orderId, 'UPI (Direct QR)', 'PAID', utr, `upi_${Date.now()}`, savedPhone, savedHostel, fullAddress);
                    },
                    onCancel: () => {
                        isSubmitting = false;
                        resetTapBtn();
                        if (typeof window.__resetCheckoutSlider === 'function') {
                            window.__resetCheckoutSlider();
                        }
                    }
                });
            }
            return;
        }

        // Standard Cash on Delivery Pathway
        const orderId = window.__currentCheckoutOrderId || `order_${Math.random().toString(36).slice(2, 10)}`;
        window.__currentCheckoutOrderId = orderId;
        await finalizeOrderPlacement(orderId, 'Cash on Delivery', 'pending', '', '', savedPhone, savedHostel, fullAddress);
    }

    if (tapToPayBtn) {
        tapToPayBtn.onclick = () => {
            executeOrderPlacement();
        };
    }

    // Interactive Slider Logic with Robust Pointer Events (100% Laptop & Mobile Support)
    const sliderTrack = document.getElementById('pay-slider-track');
    const sliderThumb = document.getElementById('pay-slider-thumb');
    const sliderProgress = document.getElementById('pay-slider-progress');
    const sliderText = document.getElementById('pay-slider-text');

    if (sliderTrack && sliderThumb) {
        let isDragging = false;
        let startPointerX = 0;
        let startOffset = 0;
        let currentOffset = 0;
        let confirmed = false;

        function getMaxDrag() {
            const trackRect = sliderTrack.getBoundingClientRect();
            const thumbRect = sliderThumb.getBoundingClientRect();
            const trackWidth = trackRect.width || sliderTrack.clientWidth;
            const thumbWidth = thumbRect.width || sliderThumb.clientWidth || 50;
            return Math.max(0, trackWidth - thumbWidth - 8);
        }

        function setSliderPosition(offset, smooth = false) {
            const maxDrag = getMaxDrag();
            currentOffset = Math.max(0, Math.min(maxDrag, offset));
            
            sliderThumb.style.transition = smooth ? 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
            sliderThumb.style.transform = `translateX(${currentOffset}px)`;
            
            if (sliderProgress) {
                sliderProgress.style.transition = smooth ? 'width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
                sliderProgress.style.width = `${currentOffset + 25}px`;
            }
        }

        window.__resetCheckoutSlider = function() {
            confirmed = false;
            setSliderPosition(0, true);
            sliderThumb.style.cursor = 'grab';
            const icon = sliderThumb.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = 'arrow_forward';
            if (sliderText) {
                const total = window.cartTotalCache || 0;
                const isUpi = document.querySelector('input[name="paymentMethod"]:checked')?.value === 'upi';
                sliderText.textContent = isUpi ? `Slide to Pay ₹${total} via UPI` : `Slide to Confirm Order ₹${total}`;
                sliderText.style.color = '';
            }
        };

        function triggerConfirmation() {
            if (confirmed || isSubmitting) return;
            confirmed = true;
            isDragging = false;
            
            const maxDrag = getMaxDrag();
            setSliderPosition(maxDrag, true);
            
            if (sliderText) {
                sliderText.textContent = '✓ Order Confirmed!';
                sliderText.style.color = '#10b981';
            }
            if (sliderThumb) {
                sliderThumb.style.cursor = 'default';
                const icon = sliderThumb.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = 'check';
            }
            
            executeOrderPlacement();
        }

        function onPointerDown(e) {
            if (confirmed || isSubmitting) return;
            if (e.button !== undefined && e.button !== 0) return; // Only left mouse click or touch
            
            isDragging = true;
            e.preventDefault();
            
            const maxDrag = getMaxDrag();
            const trackRect = sliderTrack.getBoundingClientRect();
            const thumbRect = sliderThumb.getBoundingClientRect();
            
            // If user clicked directly on track ahead of thumb (common on laptop trackpads)
            const clickPosOnTrack = e.clientX - trackRect.left - (thumbRect.width / 2);
            if (e.target !== sliderThumb && !sliderThumb.contains(e.target)) {
                if (clickPosOnTrack >= maxDrag * 0.75) {
                    // Clicked near end on laptop -> confirm immediately!
                    triggerConfirmation();
                    return;
                } else {
                    setSliderPosition(clickPosOnTrack, true);
                }
            }
            
            startPointerX = e.clientX;
            startOffset = currentOffset;
            
            try {
                sliderThumb.setPointerCapture(e.pointerId);
            } catch (err) {}
            
            sliderThumb.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }

        function onPointerMove(e) {
            if (!isDragging || confirmed || isSubmitting) return;
            e.preventDefault();
            
            const deltaX = e.clientX - startPointerX;
            const targetOffset = startOffset + deltaX;
            setSliderPosition(targetOffset, false);
            
            const maxDrag = getMaxDrag();
            if (maxDrag > 0 && currentOffset >= maxDrag * 0.85) {
                triggerConfirmation();
            }
        }

        function onPointerUp(e) {
            if (!isDragging || confirmed) return;
            isDragging = false;
            document.body.style.userSelect = '';
            sliderThumb.style.cursor = 'grab';
            
            try {
                sliderThumb.releasePointerCapture(e.pointerId);
            } catch (err) {}
            
            const maxDrag = getMaxDrag();
            if (maxDrag > 0 && currentOffset >= maxDrag * 0.65) {
                // If dragged at least 65% across on laptop trackpad/mouse, snap to finish!
                triggerConfirmation();
            } else {
                // Return smoothly to start
                setSliderPosition(0, true);
            }
        }

        // Unified event listeners supporting Pointer Events, Mouse Events, Touch, and Clicks
        let lastInputTime = 0;
        function handleStart(e) {
            const now = Date.now();
            if (e.type === 'mousedown' && (now - lastInputTime < 100)) return; // Avoid duplicate pointer+mouse
            lastInputTime = now;
            onPointerDown(e);
        }

        // Pointer event listeners (Modern laptops, trackpads, touchscreens)
        sliderThumb.addEventListener('pointerdown', handleStart);
        sliderTrack.addEventListener('pointerdown', handleStart);
        sliderThumb.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointermove', onPointerMove);
        sliderThumb.addEventListener('pointerup', onPointerUp);
        sliderThumb.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('pointerup', onPointerUp);

        // Standard Mouse event listeners (Laptops, trackpads & desktops fallback)
        sliderThumb.addEventListener('mousedown', handleStart);
        sliderTrack.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', (e) => {
            if (isDragging) onPointerMove(e);
        });
        window.addEventListener('mouseup', (e) => {
            if (isDragging) onPointerUp(e);
        });

        // Direct track click for easy 1-click confirmation on laptops
        sliderTrack.addEventListener('click', (e) => {
            if (confirmed || isSubmitting) return;
            const trackRect = sliderTrack.getBoundingClientRect();
            const clickX = e.clientX - trackRect.left;
            if (clickX >= trackRect.width * 0.5) {
                triggerConfirmation();
            }
        });

        // Fallback touch listeners for mobile WebKit
        sliderThumb.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) handleStart(e.touches[0]);
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches && e.touches[0]) onPointerMove(e.touches[0]);
        }, { passive: true });
        window.addEventListener('touchend', (e) => {
            if (isDragging) onPointerUp(e.changedTouches ? e.changedTouches[0] : e);
        });

        // Keyboard accessibility for laptop / desktop users
        sliderTrack.setAttribute('tabindex', '0');
        sliderTrack.setAttribute('role', 'slider');
        sliderTrack.setAttribute('aria-label', 'Slide to confirm order');
        sliderTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerConfirmation();
            }
        });
    }
};

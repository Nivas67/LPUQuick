// Checkout Page — Complete Ground-Up Refreshing Redesign (1-Page Luxury Liquid Glass Checkout)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

function isQuickInstantFoodProduct(p) {
    if (!p) return false;
    const cat = (p.category || p.product_category || '').trim().toLowerCase();
    const sub = (p.subcategory || p.product_subcategory || '').trim().toLowerCase();
    const name = (p.name || p.product_name || '').toLowerCase();
    if (cat.includes('instant snacks') || sub.includes('instant snacks') || cat.includes('snacks & munchies')) return false;
    if (cat === "quick's instant food" || cat === "quicks instant food") return true;
    if (sub === "quick's instant food" || sub === "quicks instant food" || sub === 'cook') return true;
    if ((cat === 'instant food' || cat === 'instant' || sub === 'instant food') && !sub.includes('namkeen') && !/bhelpuri|namkeen|chips|wafer|biscuit/i.test(name)) return true;
    if (sub.includes('magiee & noodles') || sub.includes('cooked meals') || sub.includes('sandwiches & burgers') || sub.includes('pasta & macaroni') || sub.includes('hot snacks & fries') || sub.includes('soups & bowls')) return true;
    if (/magiee|cooked meal|hot meal|thali|paratha|sandwich|fresh pasta|fresh burger|chai|coffee|soup|chowmein|macroni/i.test(name)) return true;
    return false;
}

function checkCartHasFood(items) {
    if (!Array.isArray(items) || items.length === 0) return false;
    return items.some(item => {
        if (isQuickInstantFoodProduct(item)) return true;
        const cached = (typeof window !== 'undefined' && window.__cachedProducts) ? window.__cachedProducts.get(item.product_id || item.id) : null;
        if (cached && isQuickInstantFoodProduct(cached)) return true;
        return false;
    });
}


window.pages.checkout = async function () {
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
    } catch (e) {
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
    }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 };

    // Real-time synchronization with local cartState & cached products
    if (window.cartState && typeof window.cartState === 'object') {
        items.forEach(it => {
            if (it.product_id && window.cartState[it.product_id] && window.cartState[it.product_id].quantity !== undefined) {
                it.quantity = Number(window.cartState[it.product_id].quantity);
            }
        });
        // Add any optimistic items present in cartState but not yet in backend response
        Object.entries(window.cartState).forEach(([pid, cItem]) => {
            if (cItem && cItem.quantity > 0 && !items.some(it => it.product_id === pid)) {
                const cached = window.__cachedProducts?.get(pid);
                if (cached) {
                    items.push({
                        id: cItem.cart_id || `temp_${pid}`,
                        cart_id: cItem.cart_id || `temp_${pid}`,
                        product_id: pid,
                        quantity: cItem.quantity,
                        name: cached.name || 'Item',
                        price: Number(cached.price) || 0,
                        mrp: Number(cached.mrp) || Number(cached.price) || 0,
                        image_url: cached.image_url || '',
                        in_stock: cached.in_stock !== false,
                        stock_left: cached.stock_left !== undefined ? Number(cached.stock_left) : 10,
                        unit: cached.unit || 'piece',
                        size: cached.size || ''
                    });
                }
            }
        });
    }

    // Accurate MRP, Subtotal & Quantity calculations
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const hasFoodOrder = checkCartHasFood(items);
    const deliveryEtaText = hasFoodOrder ? '11 mins delivery' : '5 mins delivery';
    const deliveryEtaBadge = hasFoodOrder ? '11 mins' : '5 mins';
    const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);

    // Dynamic Settings from Owner (Instant 0ms with background revalidation)
    let checkoutSettings = window.latestCheckoutSettings;
    if (!checkoutSettings) {
        try {
            const stored = localStorage.getItem('lpuquick_checkout_settings');
            if (stored) checkoutSettings = JSON.parse(stored);
        } catch (e) { }
    }
    // Revalidate in background without blocking UI
    fetch('/api/checkout/settings').then(r => r.json()).then(res => {
        if (res && res.success && res.settings) {
            window.latestCheckoutSettings = res.settings;
            try { localStorage.setItem('lpuquick_checkout_settings', JSON.stringify(res.settings)); } catch (e) { }
        }
    }).catch(() => { });

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
    const isMainGate = savedBlock && savedBlock.toLowerCase().includes('gate');
    const hasValidContact = savedPhone.length === 10;
    const hasValidLocation = isMainGate || Boolean(savedRoom);
    const address = (hasValidLocation && hasValidContact)
        ? `${savedHostel} (${savedBlock})${savedRoom ? `, Room ${savedRoom}` : ''} • +91${savedPhone}`
        : (hasValidLocation ? `${savedHostel} (${savedBlock})${savedRoom ? `, Room ${savedRoom}` : ''} • ⚠️ Mobile Number Mandatory` : `Please set your ${savedHostel} room & mobile number`);

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
        <div class="flex items-center justify-between py-3 border-b border-[var(--glass-border)] text-xs cart-checkout-row" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}" data-price="${itemPrice}" data-mrp="${itemMrp}" data-stock-left="${stockLeft}">
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
                <span class="font-black text-slate-900 dark:text-white text-xs w-12 text-right checkout-item-total-price">₹${item.quantity * itemPrice}</span>
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
                <span>${deliveryEtaText}</span>
            </div>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-2xl mx-auto pt-5 space-y-4 pb-44 sm:pb-24" id="checkout-main-container">
        <!-- Pre-Order Section -->
        <div id="checkout-form-section" class="space-y-4 transition-all duration-200">
            
            ${!window.isUserLoggedIn() ? `
            <!-- Google Auth First Order Verification Card (Step 6) -->
            <div id="checkout-google-auth-card" class="glass-panel card-pedestal rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent space-y-3">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                        </div>
                        <div>
                            <p class="font-black text-sm text-slate-900 dark:text-white">Verify Account with Google</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">1-tap Google verification for 1st order. Future orders place in 1 tap!</p>
                        </div>
                    </div>
                </div>
                <button type="button" id="btn-checkout-google-signin" class="clay-btn w-full py-3 rounded-2xl flex items-center justify-center gap-2.5 text-slate-900 dark:text-white font-black text-xs active:scale-95 transition-transform shadow-md cursor-pointer">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span id="btn-checkout-google-text">Continue with Google</span>
                </button>
            </div>
            ` : !(typeof window.hasUserConfiguredAddress === 'function' ? window.hasUserConfiguredAddress() : Boolean(localStorage.getItem('lpuquick_room'))) ? `
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
                                <span class="liquid-badge text-[10px] text-emerald-800 dark:text-emerald-300 px-2 py-0.5 font-black">${deliveryEtaBadge}</span>
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

            
            <!-- Cooking & Delivery Special Instructions -->
            <div class="glass-panel card-pedestal rounded-3xl p-4 sm:p-5 shadow-xl border border-[var(--glass-border)] space-y-2">
                <div class="flex items-center gap-2">
                    <span class="text-base">📝</span>
                    <label for="checkout-special-instructions" class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Special Cooking & Delivery Instructions</label>
                    <span class="text-[10px] text-slate-400 font-semibold">(Optional)</span>
                </div>
                <input type="text" id="checkout-special-instructions" maxlength="200" placeholder="e.g. Extra spicy, less oil, call when outside room..." class="w-full text-xs p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-[var(--glass-border)] text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500 transition-all font-medium">
            </div>

            <!-- Payment Method Selection -->
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 shadow-xl border border-[var(--glass-border)] space-y-3.5">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Payment Method</h3>
                    <span class="liquid-badge text-[10px] text-emerald-800 dark:text-emerald-300 font-black px-2.5 py-0.5">Pay on Delivery Active</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="payment-options">
                    <!-- 1. Pay on Delivery (ACTIVE) -->
                    <label class="flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 cursor-pointer payment-option-label relative shadow-md" data-method="cod">
                        <input type="radio" name="paymentMethod" value="cod" checked class="text-emerald focus:ring-emerald">
                        <div>
                            <p class="font-black text-xs text-slate-900 dark:text-white">Pay on Delivery</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pay at ${savedHostel} room door (Cash / UPI)</p>
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
                ` : (!(typeof window.hasUserConfiguredAddress === 'function' ? window.hasUserConfiguredAddress() : Boolean(localStorage.getItem('lpuquick_room'))) ? `
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
                    <button type="button" class="clay-btn clay-btn-primary w-full py-4 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-95 transition-all tracking-wide uppercase select-none" id="tap-to-pay-btn" style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                        <span class="material-symbols-outlined text-base pointer-events-none">bolt</span>
                        <span class="pointer-events-none">⚡ 1-Tap Quick Place (₹${exactTotal})</span>
                    </button>
                    <div class="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        <span class="material-symbols-outlined text-xs text-emerald">verified</span>
                        <span>${hasFoodOrder ? '11-Min Kitchen Corridor Dispatch' : '5-Min Corridor Dispatch'} • Pay cash on room delivery</span>
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
                        <span class="font-bold text-slate-800 dark:text-slate-200" id="success-order-payment">Pay on Delivery</span>
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

window.pageInits.checkout = function () {
    const userId = window.getEffectiveUserId();
    let isSubmitting = false;
    let confirmed = false;
    let resetSliderUI = null;

    function updateCheckoutDOMBill() {
        try {
            const rows = document.querySelectorAll('.cart-checkout-row');
            if (rows.length === 0) {
                window.location.hash = '#/cart';
                return;
            }

            let subtotal = 0;
            let totalMrp = 0;
            let totalQty = 0;
            const currentItems = [];

            rows.forEach(r => {
                const pid = r.dataset.productId;
                const qtyNum = r.querySelector('.qty-num');
                const qty = parseInt(qtyNum?.textContent || '0') || 0;
                if (qty <= 0) return;
                totalQty += qty;

                const cached = window.__cachedProducts?.get(pid);
                const price = Number(r.dataset.price) || Number(cached?.price) || 0;
                const mrp = Number(r.dataset.mrp) || Number(cached?.mrp) || price;

                subtotal += price * qty;
                totalMrp += mrp * qty;

                currentItems.push({
                    product_id: pid,
                    quantity: qty,
                    price,
                    mrp,
                    category: cached?.category || '',
                    subcategory: cached?.subcategory || '',
                    is_food_product: cached?.is_food_product || false
                });

                const priceEl = r.querySelector('.checkout-item-total-price');
                if (priceEl) priceEl.textContent = `₹${price * qty}`;
            });

            if (totalQty === 0) {
                window.location.hash = '#/cart';
                return;
            }

            const mrpDiscount = Math.max(0, totalMrp - subtotal);
            const cfg = window.latestCheckoutSettings || {};
            let isOfferActive = Boolean(cfg.offers_enabled !== false);
            const minOfferVal = Number(cfg.minimum_order_value) || 250;
            const meetsOfferMin = subtotal >= minOfferVal;

            let globalDiscount = 0;
            let offerLabel = '';
            if (isOfferActive && meetsOfferMin && subtotal > 0) {
                if (cfg.offer_type === 'percentage') {
                    const raw = Math.round(subtotal * (Number(cfg.offer_value || 0) / 100));
                    const maxD = Number(cfg.maximum_discount) || 0;
                    globalDiscount = maxD > 0 ? Math.min(raw, maxD) : raw;
                    offerLabel = `${cfg.offer_value}% OFF`;
                } else if (cfg.offer_type === 'fixed') {
                    globalDiscount = Math.min(subtotal, Number(cfg.offer_value) || 0);
                    offerLabel = `₹${cfg.offer_value} OFF`;
                }
            }

            const baseDelivery = Math.max(0, Number(cfg.delivery_fee) || 0);
            let deliveryFee = 0;
            let isFreeDelivery = false;
            if (rows.length > 0) {
                if (baseDelivery <= 0) {
                    deliveryFee = 0;
                    isFreeDelivery = true;
                } else {
                    const meetsFreeThreshold = cfg.free_delivery_enabled && subtotal >= (Number(cfg.free_delivery_threshold) || 0);
                    const meetsFreeOffer = isOfferActive && cfg.offer_type === 'free_delivery' && meetsOfferMin;
                    if (meetsFreeThreshold || meetsFreeOffer) {
                        deliveryFee = 0;
                        isFreeDelivery = true;
                    } else {
                        deliveryFee = baseDelivery;
                        isFreeDelivery = false;
                    }
                }
            }

            const handlingFee = (rows.length > 0 && cfg.handling_fee_enabled !== false) ? (Number(cfg.handling_fee) !== undefined && !isNaN(Number(cfg.handling_fee)) ? Number(cfg.handling_fee) : 3) : 0;
            const minCartVal = Number(cfg.min_cart_value) || 35;
            const isMinMet = subtotal >= minCartVal;
            const minShortfall = Math.max(0, minCartVal - subtotal);
            const exactTotal = Math.max(0, subtotal - globalDiscount + deliveryFee + handlingFee);
            const deliverySavings = isFreeDelivery ? (baseDelivery > 0 ? baseDelivery : 25) : 0;
            const totalSavings = mrpDiscount + globalDiscount + deliverySavings;

            window.cartTotalCache = exactTotal;
            window.cartSubtotalCache = subtotal;
            window.cartMinOrderCache = minCartVal;

            // DOM Updates
            const totalMrpRow = document.getElementById('checkout-total-mrp-row');
            const totalMrpVal = document.getElementById('checkout-total-mrp-val');
            if (totalMrpRow && totalMrpVal) {
                if (mrpDiscount > 0) {
                    totalMrpRow.classList.remove('hidden');
                    totalMrpVal.textContent = `₹${totalMrp}`;
                } else {
                    totalMrpRow.classList.add('hidden');
                }
            }

            const mrpDiscRow = document.getElementById('checkout-mrp-discount-row');
            const mrpDiscVal = document.getElementById('checkout-mrp-discount-val');
            if (mrpDiscRow && mrpDiscVal) {
                if (mrpDiscount > 0) {
                    mrpDiscRow.classList.remove('hidden');
                    mrpDiscVal.textContent = `-₹${mrpDiscount}`;
                } else {
                    mrpDiscRow.classList.add('hidden');
                }
            }

            const subtotalEl = document.getElementById('checkout-subtotal-val');
            if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;

            const offerRow = document.getElementById('checkout-offer-row');
            const offerVal = document.getElementById('checkout-offer-val');
            const offerLabelEl = document.getElementById('checkout-offer-label');
            if (offerRow && offerVal) {
                if (globalDiscount > 0) {
                    offerRow.classList.remove('hidden');
                    if (offerLabelEl) offerLabelEl.textContent = `Offer (${offerLabel})`;
                    offerVal.textContent = `-₹${globalDiscount}`;
                } else {
                    offerRow.classList.add('hidden');
                }
            }

            const handlingEl = document.getElementById('checkout-handling-val');
            if (handlingEl) handlingEl.textContent = `₹${handlingFee}`;

            const totalEl = document.getElementById('checkout-total-val');
            if (totalEl) totalEl.textContent = `₹${exactTotal}`;

            const tapBtn = document.getElementById('tap-to-pay-btn');
            if (tapBtn && !tapBtn.disabled) {
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base">bolt</span> <span>⚡ 1-Tap Quick Place (₹${exactTotal})</span>`;
            }

            const sliderText = document.getElementById('pay-slider-text');
            if (sliderText) sliderText.textContent = `Slide to Pay ₹${exactTotal}`;

            const savingsVal = document.getElementById('checkout-savings-val');
            if (savingsVal) savingsVal.textContent = `Total Savings: ₹${totalSavings} applied`;

        } catch (err) {
            console.error('[Checkout DOM Update Error]:', err);
        }
    }

    // Instant Responsive Quantity Steppers (0ms UI Response)
    document.querySelectorAll('.checkout-qty-inc').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-checkout-row');
            const cartId = btn.dataset.id || row?.dataset?.cartId;
            const productId = btn.dataset.productId || row?.dataset?.productId;
            const rawStock = btn.dataset.stockLeft ?? row?.dataset?.stockLeft;
            const stockLeft = (rawStock !== undefined && rawStock !== '' && rawStock !== null) ? Number(rawStock) : 10;
            const qtyNum = row?.querySelector('.qty-num');
            const curQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

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
            if (qtyNum) qtyNum.textContent = nextQty;
            btn.dataset.qty = nextQty;
            const decBtn = row?.querySelector('.checkout-qty-dec');
            if (decBtn) decBtn.dataset.qty = nextQty;

            if (nextQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
            }

            updateCheckoutDOMBill();
            if (productId) {
                window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
            } else if (cartId) {
                window.api.updateCartItem(cartId, nextQty, userId).catch(console.warn);
            }
        };
    });

    document.querySelectorAll('.checkout-qty-dec').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-checkout-row');
            const cartId = btn.dataset.id || row?.dataset?.cartId;
            const productId = btn.dataset.productId || row?.dataset?.productId;
            const rawStock = btn.dataset.stockLeft ?? row?.dataset?.stockLeft;
            const stockLeft = (rawStock !== undefined && rawStock !== '' && rawStock !== null) ? Number(rawStock) : 10;
            const qtyNum = row?.querySelector('.qty-num');
            const curQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

            if (curQty <= 1) {
                if (row) row.remove();
                updateCheckoutDOMBill();
                if (productId) {
                    window.setOptimisticCartQuantity(productId, 0, stockLeft);
                } else if (cartId) {
                    window.api.removeCartItem(cartId).catch(console.warn);
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Item removed from order', 'info', 'delete');
                }
            } else {
                const nextQty = curQty - 1;
                if (qtyNum) qtyNum.textContent = nextQty;
                btn.dataset.qty = nextQty;
                const incBtn = row?.querySelector('.checkout-qty-inc');
                if (incBtn) {
                    incBtn.dataset.qty = nextQty;
                    if (nextQty < stockLeft) {
                        incBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                        incBtn.setAttribute('title', 'Add one more');
                        incBtn.disabled = false;
                    }
                }
                updateCheckoutDOMBill();
                if (productId) {
                    window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
                } else if (cartId) {
                    window.api.updateCartItem(cartId, nextQty, userId).catch(console.warn);
                }
            }
        };
    });

    // Blocked payment method alerts
    document.querySelectorAll('.payment-blocked-trigger').forEach(trigger => {
        trigger.onclick = () => {
            const title = trigger.dataset.title || 'Online Payment';
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`⏳ ${title} is onboarding. Please use Pay on Delivery.`, 'info', 'account_balance_wallet');
            }
        };
    });

    async function executeOrderPlacement() {

        if (isSubmitting) return;
        isSubmitting = true;

        // Step 6: Google Auth verification for first-time order
        if (!window.isUserLoggedIn()) {
            isSubmitting = false;
            if (typeof resetSliderUI === 'function') resetSliderUI();
            const tapBtn = document.getElementById('tap-to-pay-btn');
            if (tapBtn) {
                tapBtn.disabled = false;
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base">bolt</span> <span>⚡ 1-Tap Quick Place (₹${window.cartTotalCache || 0})</span>`;
            }

            if (typeof window.showClientToast === 'function') {
                window.showClientToast('Please sign in with Google to place your first order.', 'info', 'account_circle');
            }

            if (typeof window.promptGoogleAuth === 'function') {
                window.promptGoogleAuth(
                    async (user) => {
                        if (typeof window.showClientToast === 'function') {
                            window.showClientToast(`✓ Verified as ${user.name || 'Student'}! Placing your order...`, 'success', 'verified');
                        }
                        const authCard = document.getElementById('checkout-google-auth-card');
                        if (authCard) authCard.remove();
                        executeOrderPlacement();
                    },
                    (err) => {
                        console.warn('[Checkout Google Auth Error]:', err);
                        if (typeof window.showClientToast === 'function') {
                            window.showClientToast('Google sign-in is required to place your first order.', 'warning', 'lock');
                        }
                    }
                );
            } else {
                localStorage.setItem('lpuquick_redirect', '#/checkout');
                window.location.hash = '#/signin';
            }
            return;
        }

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

        const isMainGate = savedBlock && savedBlock.toLowerCase().includes('gate');
        if ((!savedRoom && !isMainGate) || savedPhone.length !== 10) {
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
        } catch (e) { }

        const roomPart = (!savedRoom && isMainGate) ? '' : `, Room ${savedRoom || 'Main Gate'}`;
        const fullAddress = `[${savedHostel}] ${savedHostel} (${savedBlock})${roomPart}`;
        const selectedMethod = 'Pay on Delivery';

        const tapBtn = document.getElementById('tap-to-pay-btn');
        if (tapBtn) {
            tapBtn.disabled = true;
            tapBtn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> Placing Order...`;
        }

        try {
            const activeUserId = window.CURRENT_USER_ID || userId;
            const orderRes = await window.api.checkout(activeUserId, selectedMethod, fullAddress, {
                phone: savedPhone,
                name: window.CURRENT_USER_NAME || 'LPU Student',
                email: window.CURRENT_USER_EMAIL || '',
                hostel_id: savedHostel,
                instructions: document.getElementById('checkout-special-instructions')?.value?.trim() || '',
                special_instructions: document.getElementById('checkout-special-instructions')?.value?.trim() || ''
            });

            if (orderRes && orderRes.success && orderRes.order) {
                const order = orderRes.order;
                if (typeof window.triggerActiveOrderPoll === 'function') {
                    window.triggerActiveOrderPoll();
                }
                if (typeof window.updateLiveSystemNotification === 'function') {
                    window.updateLiveSystemNotification(order.id, 'Order Placed', 'Arriving in 5 minutes', 'Runner dispatched · Running to your room');
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
                tapBtn.innerHTML = `<span class="material-symbols-outlined text-base pointer-events-none">bolt</span> <span class="pointer-events-none">⚡ 1-Tap Quick Place (₹${window.cartTotalCache || 0})</span>`;
            }
            if (typeof resetSliderUI === 'function') {
                resetSliderUI();
            } else {
                const sliderTextEl = document.getElementById('pay-slider-text');
                if (sliderTextEl) {
                    sliderTextEl.textContent = `Slide to Confirm Order ₹${window.cartTotalCache || ''}`;
                    sliderTextEl.style.color = '';
                }
                const sliderThumbEl = document.getElementById('pay-slider-thumb');
                if (sliderThumbEl) {
                    sliderThumbEl.style.cursor = 'grab';
                    const icon = sliderThumbEl.querySelector('.material-symbols-outlined');
                    if (icon) icon.textContent = 'arrow_forward';
                }
            }
            confirmed = false;
            isSubmitting = false;
        }
    }

    // Expose globally for instant zero-latency touch and delegated triggers
    window.executeOrderPlacement = executeOrderPlacement;

    // Step 6: Google Sign-In button on Checkout
    document.getElementById('btn-checkout-google-signin')?.addEventListener('click', () => {
        if (typeof window.promptGoogleAuth === 'function') {
            window.promptGoogleAuth(
                async (user) => {
                    if (typeof window.showClientToast === 'function') {
                        window.showClientToast(`✓ Verified as ${user.name || 'Student'}!`, 'success', 'verified');
                    }
                    if (typeof window.router === 'function') window.router();
                },
                (err) => {
                    console.warn('[Checkout Google Auth]:', err);
                }
            );
        } else {
            localStorage.setItem('lpuquick_redirect', '#/checkout');
            window.location.hash = '#/signin';
        }
    });

    const tapToPayBtn = document.getElementById('tap-to-pay-btn');
    if (tapToPayBtn) {
        const handleTap = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            executeOrderPlacement();
        };
        tapToPayBtn.onclick = handleTap;
        tapToPayBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleTap(e);
        }, { passive: false });
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
        confirmed = false;

        resetSliderUI = function () {
            confirmed = false;
            isDragging = false;
            setSliderPosition(0, true);
            if (sliderText) {
                sliderText.textContent = `Slide to Confirm Order ₹${window.cartTotalCache || ''}`;
                sliderText.style.color = '';
            }
            if (sliderThumb) {
                sliderThumb.style.cursor = 'grab';
                const icon = sliderThumb.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = 'arrow_forward';
            }
        };

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
            } catch (err) { }

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
            } catch (err) { }

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

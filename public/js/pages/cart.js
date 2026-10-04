// Cart Page — Complete Ground-Up Refreshing Redesign (Split-View Liquid Glass & Claymorphic Cart)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

function calculateCartCharges(cartSubtotal, settings) {
    const s = settings || window.latestCheckoutSettings || {
        offers_enabled: true,
        offer_type: 'percentage',
        offer_value: 5,
        minimum_order_value: 350,
        maximum_discount: 50,
        free_delivery_enabled: true,
        free_delivery_threshold: 0,
        delivery_fee: 0,
        handling_fee: 3,
        handling_fee_enabled: true,
        min_cart_value: 35
    };

    const minCart = Number(s.min_cart_value) || 35;
    const isMinMet = cartSubtotal >= minCart;
    const minShortfall = Math.max(0, minCart - cartSubtotal);

    let isOfferActive = Boolean(s.offers_enabled);
    if (isOfferActive && (s.start_date || s.end_date)) {
        const now = Date.now();
        if (s.start_date && now < new Date(s.start_date).getTime()) isOfferActive = false;
        if (s.end_date && now > new Date(s.end_date).getTime()) isOfferActive = false;
    }

    const minOrderVal = Number(s.minimum_order_value) || 0;
    const meetsMinOrder = cartSubtotal >= minOrderVal;

    let discount = 0;
    let offerLabel = '';
    if (isOfferActive && meetsMinOrder && cartSubtotal > 0) {
        if (s.offer_type === 'percentage') {
            const raw = Math.round(cartSubtotal * (Number(s.offer_value || 0) / 100));
            const maxD = Number(s.maximum_discount) || 0;
            discount = maxD > 0 ? Math.min(raw, maxD) : raw;
            offerLabel = `${s.offer_value}% Bulk Offer`;
        } else if (s.offer_type === 'fixed') {
            discount = Math.min(cartSubtotal, Number(s.offer_value) || 0);
            offerLabel = `₹${s.offer_value} Flat Offer`;
        } else if (s.offer_type === 'free_delivery') {
            discount = 0;
            offerLabel = 'Free Delivery';
        }
    }

    const baseDelivery = Math.max(0, Number(s.delivery_fee) || 0);
    let delivery = 0;
    let isFreeDel = false;
    if (cartSubtotal > 0) {
        if (baseDelivery <= 0) {
            delivery = 0;
            isFreeDel = true;
        } else {
            const meetsFreeThreshold = s.free_delivery_enabled && cartSubtotal >= (Number(s.free_delivery_threshold) || 0);
            const meetsFreeOffer = isOfferActive && s.offer_type === 'free_delivery' && meetsMinOrder;
            if (meetsFreeThreshold || meetsFreeOffer) {
                delivery = 0;
                isFreeDel = true;
            } else {
                delivery = baseDelivery;
                isFreeDel = false;
            }
        }
    }

    const handling = (s.handling_fee_enabled !== false && cartSubtotal > 0) ? (Number(s.handling_fee) || 0) : 0;
    const total = Math.max(0, cartSubtotal - discount + delivery + handling);

    return {
        minCart,
        isMinMet,
        minShortfall,
        isOfferActive,
        minOrderVal,
        meetsMinOrder,
        discount,
        offerLabel: offerLabel || (s.offer_type === 'percentage' ? `${s.offer_value}% Bulk Offer` : (s.offer_type === 'fixed' ? `₹${s.offer_value} Flat Offer` : 'Special Offer')),
        baseDelivery,
        delivery,
        isFreeDel,
        handling,
        total
    };
}

window.pages.cart = async function() {
    let cartData;
    const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : (window.CURRENT_USER_ID || 'guest');
    const currentHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
    try { 
        cartData = await window.api.getCart(userId, currentHostel); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0, free_delivery_remaining: 199 } }; 
    }

    const items = cartData.items || [];
    
    // Dynamic Settings from Owner/Admin
    let checkoutSettings = window.latestCheckoutSettings || null;
    try {
        const settingsRes = await fetch('/api/checkout/settings', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
        if (settingsRes && settingsRes.success && settingsRes.settings) {
            checkoutSettings = settingsRes.settings;
            window.latestCheckoutSettings = checkoutSettings;
        }
    } catch(e) {}

    checkoutSettings = checkoutSettings || {
        offers_enabled: true,
        offer_type: 'percentage',
        offer_value: 5,
        minimum_order_value: 350,
        maximum_discount: 50,
        free_delivery_enabled: true,
        free_delivery_threshold: 0,
        delivery_fee: 0,
        handling_fee: 3,
        handling_fee_enabled: true,
        min_cart_value: 35
    };

    // Accurate MRP, Subtotal & Quantity calculations
    const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const subtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);
    
    // Dynamic charges calculation
    const charges = calculateCartCharges(subtotal, checkoutSettings);
    const exactTotal = charges.total;
    const totalSavings = mrpDiscount + charges.discount + (charges.isFreeDel ? (charges.baseDelivery > 0 ? charges.baseDelivery : 25) : 0);

    const itemCards = items.length === 0 ? `
        <div class="glass-panel card-pedestal rounded-3xl p-8 sm:p-14 text-center my-6 shadow-2xl border border-[var(--glass-border)]">
            <div class="w-20 h-20 rounded-3xl clay-card text-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl relative overflow-hidden">
                <div class="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse pointer-events-none"></div>
                <span class="material-symbols-outlined text-4xl">shopping_bag</span>
            </div>
            <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Your Cart is Empty</h3>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                Add midnight snacks, cold energy drinks, Maggi, or study supplies from ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} Hub.
            </p>
            <a href="#/" class="clay-btn clay-btn-primary inline-flex items-center gap-2 px-7 py-3 rounded-2xl text-xs font-black shadow-xl tracking-wide uppercase">
                <span>Explore Store</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    ` : items.map(item => {
        const itemMrp = Number(item.mrp) || Number(item.price) || 0;
        const itemPrice = Number(item.price) || 0;
        const hasItemDiscount = itemMrp > itemPrice;
        const discPercent = hasItemDiscount ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;
        const cachedProd = window.__cachedProducts?.get(item.product_id);
        
        // Authoritative Store Stock Determination
        let stockLeft = 50;
        if (item.stock_left !== undefined && item.stock_left !== null) {
            stockLeft = Number(item.stock_left);
        } else if (cachedProd && cachedProd.stock_left !== undefined) {
            stockLeft = Number(cachedProd.stock_left);
        }
        
        const isOutOfStock = (item.in_stock === false) || stockLeft <= 0;
        const isMaxStockReached = (Number(item.quantity) || 1) >= stockLeft && stockLeft > 0;

        return `
        <div class="glass-panel card-pedestal rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3.5 shadow-md mb-3 border border-[var(--glass-border)] cart-row transition-all hover:translate-y-[-1px] ${isOutOfStock ? 'border-rose-500/30 bg-rose-500/5' : ''}" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}" data-price="${itemPrice}" data-mrp="${itemMrp}" data-stock-left="${stockLeft}" data-in-stock="${!isOutOfStock}">
            <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/90 dark:to-slate-900/90 p-2 shrink-0 flex items-center justify-center border border-[var(--glass-border)] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <img class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                </div>
                <div class="min-w-0">
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate tracking-tight">${item.name}</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">${item.size || item.unit || '1 unit'}</p>
                    ${isOutOfStock ? `
                    <p class="text-[10px] font-black text-rose-500 mt-0.5 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Out of stock in ${currentHostel.replace('-', '')} store
                    </p>
                    ` : (stockLeft > 0 && stockLeft <= 5 ? `
                    <p class="text-[10px] font-black text-amber-500 mt-0.5 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Only ${stockLeft} left in stock
                    </p>
                    ` : '')}
                    <div class="flex items-baseline gap-1.5 mt-1">
                        <span class="font-black text-sm text-slate-900 dark:text-white tracking-tight item-price-total">₹${itemPrice * item.quantity}</span>
                        <span class="text-[10px] text-slate-400 font-medium item-price-multi">${item.quantity > 1 ? `(₹${itemPrice} × ${item.quantity})` : ''}</span>
                        ${hasItemDiscount ? `
                        <span class="line-through text-slate-400 text-[11px] item-mrp-total">₹${itemMrp * item.quantity}</span>
                        <span class="liquid-badge text-[9px] text-emerald-800 dark:text-emerald-300 font-black px-1.5 py-0.5">${discPercent}% OFF</span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="card-qty-stepper flex items-center shrink-0">
                <button class="qty-dec-btn" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" title="Decrease quantity or remove">
                    <span class="material-symbols-outlined text-sm">remove</span>
                </button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-inc-btn ${(isMaxStockReached || isOutOfStock) ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" title="${isOutOfStock ? 'Out of stock in this store' : (isMaxStockReached ? `Max stock limit (${stockLeft})` : 'Add one more')}" ${(isMaxStockReached || isOutOfStock) ? 'disabled' : ''}>
                    <span class="material-symbols-outlined text-sm">add</span>
                </button>
            </div>
        </div>
    `}).join('');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95" title="Go Back">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Your Cart</h1>
                    <p class="text-[10px] sm:text-[11px] text-slate-500 font-semibold" id="cart-header-subtitle">${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'} · Delivering to ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} (3 mins)</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${items.length > 0 ? `
                <button class="clay-pill px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors" id="clear-cart-btn">Clear All</button>
                ` : ''}
                <div class="clay-pill px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
                    <span>3m Express</span>
                </div>
            </div>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-5xl mx-auto pt-5 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <!-- Left: Cart Items & Campus Perks -->
        <div class="lg:col-span-2 space-y-3.5">
            <!-- Dynamic Minimum Order Value Alert -->
            <div id="cart-min-order-banner-wrap">
            ${!charges.isMinMet && subtotal > 0 ? `
            <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-amber-500/40 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-2.5 font-bold text-amber-700 dark:text-amber-300">
                    <span class="material-symbols-outlined text-lg text-amber-500 animate-bounce">shopping_bag</span>
                    <div>
                        <p class="font-black text-xs">Minimum Order Value is ₹${charges.minCart}</p>
                        <p class="text-[11px] text-amber-600/90 dark:text-amber-400 font-medium">Add items worth ₹${charges.minShortfall} more to place your hostel order.</p>
                    </div>
                </div>
                <a href="#/" class="clay-btn clay-btn-primary px-3 py-1.5 text-[11px] font-black rounded-xl text-white shrink-0 shadow-sm">
                    + Add Items
                </a>
            </div>
            ` : ''}
            </div>

            <!-- Dynamic Campus Offer Banner -->
            <div id="cart-offer-banner-wrap">
            ${charges.isOfferActive && charges.meetsMinOrder && charges.discount > 0 ? `
            <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-emerald-500/30 bg-emerald-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>${charges.offerLabel} Applied</span>
                </div>
                <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-300 liquid-badge px-2.5 py-0.5">Extra ₹${charges.discount} OFF</span>
            </div>
            ` : (charges.isOfferActive && !charges.meetsMinOrder && subtotal > 0 ? `
            <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-amber-500/30 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                    <span class="material-symbols-outlined text-base">local_offer</span>
                    <span>Add ₹${charges.minOrderVal - subtotal} more to get ${charges.offerLabel} on your order</span>
                </div>
                <a href="#/" class="text-[11px] font-black text-amber-700 dark:text-amber-400 underline">Add Items</a>
            </div>
            ` : '')}
            </div>

            <!-- Dynamic Delivery Banner -->
            <div id="cart-delivery-banner-wrap">
            ${charges.isFreeDel ? `
            <div class="glass-panel card-pedestal rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs border border-[var(--glass-border)]">
                <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <span class="material-symbols-outlined text-base text-emerald">electric_bolt</span>
                    <span>Free 3-Min Campus Room Delivery Guaranteed</span>
                </div>
                <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-400 liquid-badge px-2 py-0.5">Saved ₹${charges.baseDelivery > 0 ? charges.baseDelivery : 25}</span>
            </div>
            ` : `
            <div class="glass-panel card-pedestal rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs border border-[var(--glass-border)]">
                <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <span class="material-symbols-outlined text-base text-emerald">electric_bolt</span>
                    <span>3-Min Campus Room Delivery: ₹${charges.delivery}</span>
                </div>
            </div>
            `}
            </div>

            <!-- Items Container -->
            <div id="cart-items-container">
                ${itemCards}
            </div>

            <!-- Campus Delivery Perks Drawer -->
            ${items.length > 0 ? `
            <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="clay-card rounded-2xl p-3 flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-base text-emerald">shield</span>
                    <div>
                        <p class="text-[11px] font-black text-slate-900 dark:text-white">Discreet Packing</p>
                        <p class="text-[9px] text-slate-400">Opaque tamper-proof bags</p>
                    </div>
                </div>
                <div class="clay-card rounded-2xl p-3 flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-base text-emerald">room_service</span>
                    <div>
                        <p class="text-[11px] font-black text-slate-900 dark:text-white">Room Delivery</p>
                        <p class="text-[9px] text-slate-400">${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} hostel door drop</p>
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Right: Digital Receipt Bill Summary -->
        <div class="lg:col-span-1" id="bill-details-section">
            <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 sticky top-20 shadow-2xl border border-[var(--glass-border)] space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-[var(--glass-border)]">
                    <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span class="material-symbols-outlined text-base text-emerald">receipt</span>
                        Bill Details
                    </h3>
                    <span class="liquid-badge text-[9px] font-black text-emerald-800 dark:text-emerald-300 px-2 py-0.5">Verified Pricing</span>
                </div>
                
                <div class="space-y-2.5 text-xs">
                    ${mrpDiscount > 0 ? `
                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Total MRP Value</span>
                        <span class="line-through text-slate-400">₹${totalMrp}</span>
                    </div>
                    ` : ''}

                    <div id="bill-mrp-discount-row" class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold ${mrpDiscount > 0 ? '' : 'hidden'}">
                        <span>Product Discount</span>
                        <span id="bill-mrp-discount-val">-₹${mrpDiscount}</span>
                    </div>

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <span>Item Subtotal</span>
                        <span class="font-black text-slate-900 dark:text-white" id="bill-subtotal-val">₹${subtotal}</span>
                    </div>

                    <div id="bill-discount-row" class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold ${charges.discount > 0 ? '' : 'hidden'}">
                        <span id="bill-discount-label">${charges.offerLabel || 'Offer Discount'}</span>
                        <span id="bill-discount-val">-₹${charges.discount}</span>
                    </div>

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5" id="bill-delivery-val-wrap">
                            ${charges.isFreeDel ? `
                            <span class="line-through text-[11px] text-slate-400" id="bill-delivery-strike">₹${charges.baseDelivery > 0 ? charges.baseDelivery : 25}</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400" id="bill-delivery-val">FREE</span>
                            ` : `
                            <span class="font-black text-slate-900 dark:text-white" id="bill-delivery-val">₹${charges.delivery}</span>
                            `}
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <div class="flex items-center gap-1">
                            <span>Handling Fee</span>
                            <span class="text-[10px] text-slate-400" title="Pack & handling fee">ℹ️</span>
                        </div>
                        <span class="font-black text-slate-900 dark:text-white" id="bill-handling-val">${charges.handling > 0 ? `₹${charges.handling}` : '<span class="text-emerald-600 font-bold">FREE</span>'}</span>
                    </div>
                    
                    <div class="border-t border-[var(--glass-border)] pt-3.5 mt-2 flex justify-between items-center text-sm font-black">
                        <div>
                            <span class="text-slate-900 dark:text-white tracking-tight">To Pay</span>
                            <p class="text-[10px] text-emerald font-bold" id="bill-topay-subtitle">${charges.isFreeDel ? 'Free campus delivery included' : 'Fast room delivery'}</p>
                        </div>
                        <span class="text-2xl font-black text-slate-900 dark:text-white tracking-tight" id="bill-total-val">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Total Savings Highlight Pill -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold backdrop-blur-md shadow-xs">
                    <span class="material-symbols-outlined text-base text-emerald">savings</span>
                    <span id="bill-savings-val">Total Real Savings: ₹${totalSavings}</span>
                </div>

                <div id="cart-checkout-action-container">
                ${window.__isUserBlocked ? `
                <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-1">
                    <p class="font-black text-xs text-rose-600 dark:text-rose-400">Account Restricted</p>
                    <p class="text-[11px] text-slate-500">Contact ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} Campus Hub for assistance.</p>
                </div>
                <button disabled class="w-full clay-card text-slate-400 rounded-2xl py-3.5 font-bold text-xs cursor-not-allowed">
                    Checkout Disabled
                </button>
                ` : (items.length > 0 ? (
                    !charges.isMinMet ? `
                    <button disabled class="w-full clay-card text-slate-400 dark:text-slate-500 rounded-2xl py-4 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 opacity-90 shadow-none" id="proceed-to-checkout-btn">
                        <span class="material-symbols-outlined text-sm">lock</span>
                        <span>Min Order Value ₹${charges.minCart} (Add ₹${charges.minShortfall} more)</span>
                    </button>
                    ` : `
                    <a href="#/checkout" id="proceed-to-checkout-btn" class="clay-btn clay-btn-primary w-full py-4 rounded-2xl font-black text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-2xl tracking-wide uppercase active:scale-95 transition-transform">
                        <span>Proceed to Checkout (₹${exactTotal})</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </a>
                    `
                ) : `
                <button disabled class="w-full clay-card text-slate-400 rounded-2xl py-4 font-bold text-xs text-center cursor-not-allowed">
                    Cart is Empty
                </button>
                `)}
                </div>
            </div>
        </div>
    </main>

    <!-- Mobile Sticky Checkout Capsule (Liquid Glass) -->
    <div id="cart-mobile-checkout-container">
    ${items.length > 0 && !window.__isUserBlocked ? (
        !charges.isMinMet ? `
        <div class="lg:hidden fixed bottom-16 inset-x-3 z-30 pointer-events-none flex justify-center">
            <div class="pointer-events-auto liquid-dock-pill max-w-md w-full p-3 px-4 flex items-center justify-between gap-3 rounded-3xl shadow-2xl border border-amber-500/40">
                <div>
                    <span class="text-[10px] font-bold text-amber-500">Min Order ₹${charges.minCart}</span>
                    <p class="text-xs font-black text-slate-900 dark:text-white leading-tight mt-0.5" id="mobile-min-order-val">Add ₹${charges.minShortfall} more</p>
                </div>
                <a href="#/" class="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                    <span>Add Items</span>
                    <span class="material-symbols-outlined text-sm">add</span>
                </a>
            </div>
        </div>
        ` : `
        <div class="lg:hidden fixed bottom-16 inset-x-3 z-30 pointer-events-none flex justify-center">
            <div class="pointer-events-auto liquid-dock-pill max-w-md w-full p-3.5 px-4 flex items-center justify-between gap-3 rounded-3xl shadow-2xl">
                <div>
                    <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400" id="mobile-cart-qty-val">${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}</span>
                    <p class="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5" id="mobile-cart-total-val">₹${exactTotal}</p>
                </div>
                <a href="#/checkout" class="clay-btn clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                    <span>Proceed</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
            </div>
        </div>
        `
    ) : ''}
    </div>

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
            <a class="clay-pill flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3.5 py-1 cursor-pointer font-bold relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] mt-0.5 font-bold">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-semibold mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.cart = function() {
    const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : (window.CURRENT_USER_ID || 'guest');

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.onclick = async (e) => {
            e.preventDefault();
            try {
                if (window.api?.clearCart) {
                    await window.api.clearCart(userId);
                }
                window.cartState = {};
                if (typeof window.updateGlobalCartBadges === 'function') {
                    window.updateGlobalCartBadges();
                }
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('🗑️ Cart cleared successfully', 'info', 'delete');
                }
                if (window.router) window.router();
            } catch (err) {
                console.error('Failed to clear cart:', err);
            }
        };
    }

    const proceedBtn = document.getElementById('proceed-to-checkout-btn');
    if (proceedBtn) {
        proceedBtn.onclick = (e) => {
            if (!window.isUserLoggedIn()) {
                e.preventDefault();
                localStorage.setItem('lpuquick_redirect', '#/checkout');
                window.location.hash = '#/signin';
            }
        };
    }

    function updateCartDOMBill() {
        const rows = document.querySelectorAll('.cart-row');
        if (rows.length === 0) {
            if (window.router) window.router();
            return;
        }

        let totalQty = 0;
        let subtotal = 0;
        let totalMrp = 0;

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

            const itemPriceTotalEl = r.querySelector('.item-price-total');
            if (itemPriceTotalEl) itemPriceTotalEl.textContent = `₹${price * qty}`;
            const itemPriceMultiEl = r.querySelector('.item-price-multi');
            if (itemPriceMultiEl) {
                itemPriceMultiEl.textContent = qty > 1 ? `(₹${price} × ${qty})` : '';
            }
            const itemMrpTotalEl = r.querySelector('.item-mrp-total');
            if (itemMrpTotalEl) itemMrpTotalEl.textContent = `₹${mrp * qty}`;
        });

        if (totalQty === 0) {
            if (window.router) window.router();
            return;
        }

        const mrpDiscount = Math.max(0, totalMrp - subtotal);
        const charges = calculateCartCharges(subtotal, window.latestCheckoutSettings);
        const exactTotal = charges.total;
        const totalSavings = mrpDiscount + charges.discount + (charges.isFreeDel ? (charges.baseDelivery > 0 ? charges.baseDelivery : 25) : 0);
        const isMinOrderMet = charges.isMinMet;
        const minOrderShortfall = charges.minShortfall;

        // Header subtitle
        const cartSubtitle = document.getElementById('cart-header-subtitle');
        if (cartSubtitle) {
            cartSubtitle.textContent = `${totalQty} ${totalQty === 1 ? 'item' : 'items'} · Delivering to ${window.currentAddress || (window.currentHostelId ? window.currentHostelId.replace('-', '') : 'Campus')} (3 mins)`;
        }

        // Dynamic Banners
        const minOrderWrap = document.getElementById('cart-min-order-banner-wrap');
        if (minOrderWrap) {
            if (!isMinOrderMet && subtotal > 0) {
                minOrderWrap.innerHTML = `
                <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-amber-500/40 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                    <div class="flex items-center gap-2.5 font-bold text-amber-700 dark:text-amber-300">
                        <span class="material-symbols-outlined text-lg text-amber-500 animate-bounce">shopping_bag</span>
                        <div>
                            <p class="font-black text-xs">Minimum Order Value is ₹${charges.minCart}</p>
                            <p class="text-[11px] text-amber-600/90 dark:text-amber-400 font-medium">Add items worth ₹${minOrderShortfall} more to place your hostel order.</p>
                        </div>
                    </div>
                    <a href="#/" class="clay-btn clay-btn-primary px-3 py-1.5 text-[11px] font-black rounded-xl text-white shrink-0 shadow-sm">
                        + Add Items
                    </a>
                </div>`;
            } else {
                minOrderWrap.innerHTML = '';
            }
        }

        const offerWrap = document.getElementById('cart-offer-banner-wrap');
        if (offerWrap) {
            if (charges.isOfferActive && charges.meetsMinOrder && charges.discount > 0) {
                offerWrap.innerHTML = `
                <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-emerald-500/30 bg-emerald-500/10 shadow-sm backdrop-blur-xl">
                    <div class="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                        <span class="material-symbols-outlined text-base">verified</span>
                        <span>${charges.offerLabel} Applied</span>
                    </div>
                    <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-300 liquid-badge px-2.5 py-0.5">Extra ₹${charges.discount} OFF</span>
                </div>`;
            } else if (charges.isOfferActive && !charges.meetsMinOrder && subtotal > 0) {
                offerWrap.innerHTML = `
                <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-amber-500/30 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                    <div class="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                        <span class="material-symbols-outlined text-base">local_offer</span>
                        <span>Add ₹${charges.minOrderVal - subtotal} more to get ${charges.offerLabel} on your order</span>
                    </div>
                    <a href="#/" class="text-[11px] font-black text-amber-700 dark:text-amber-400 underline">Add Items</a>
                </div>`;
            } else {
                offerWrap.innerHTML = '';
            }
        }

        const deliveryWrap = document.getElementById('cart-delivery-banner-wrap');
        if (deliveryWrap) {
            if (charges.isFreeDel) {
                deliveryWrap.innerHTML = `
                <div class="glass-panel card-pedestal rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs border border-[var(--glass-border)]">
                    <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        <span class="material-symbols-outlined text-base text-emerald">electric_bolt</span>
                        <span>Free 3-Min Campus Room Delivery Guaranteed</span>
                    </div>
                    <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-400 liquid-badge px-2 py-0.5">Saved ₹${charges.baseDelivery > 0 ? charges.baseDelivery : 25}</span>
                </div>`;
            } else {
                deliveryWrap.innerHTML = `
                <div class="glass-panel card-pedestal rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs border border-[var(--glass-border)]">
                    <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                        <span class="material-symbols-outlined text-base text-emerald">electric_bolt</span>
                        <span>3-Min Campus Room Delivery: ₹${charges.delivery}</span>
                    </div>
                </div>`;
            }
        }

        // Bill details
        const mrpRow = document.getElementById('bill-mrp-discount-row');
        const mrpVal = document.getElementById('bill-mrp-discount-val');
        if (mrpRow && mrpVal) {
            if (mrpDiscount > 0) {
                mrpRow.classList.remove('hidden');
                mrpVal.textContent = `-₹${mrpDiscount}`;
            } else {
                mrpRow.classList.add('hidden');
            }
        }

        const billSubtotal = document.getElementById('bill-subtotal-val');
        if (billSubtotal) billSubtotal.textContent = `₹${subtotal}`;
        
        const discountRow = document.getElementById('bill-discount-row');
        const billDiscount = document.getElementById('bill-discount-val');
        const billDiscountLabel = document.getElementById('bill-discount-label');
        if (discountRow && billDiscount) {
            if (charges.discount > 0) {
                discountRow.classList.remove('hidden');
                if (billDiscountLabel) billDiscountLabel.textContent = charges.offerLabel;
                billDiscount.textContent = `-₹${charges.discount}`;
            } else {
                discountRow.classList.add('hidden');
            }
        }

        const deliveryValWrap = document.getElementById('bill-delivery-val-wrap');
        if (deliveryValWrap) {
            if (charges.isFreeDel) {
                deliveryValWrap.innerHTML = `
                    <span class="line-through text-[11px] text-slate-400" id="bill-delivery-strike">₹${charges.baseDelivery > 0 ? charges.baseDelivery : 25}</span>
                    <span class="font-black text-emerald-600 dark:text-emerald-400" id="bill-delivery-val">FREE</span>
                `;
            } else {
                deliveryValWrap.innerHTML = `
                    <span class="font-black text-slate-900 dark:text-white" id="bill-delivery-val">₹${charges.delivery}</span>
                `;
            }
        }

        const handlingVal = document.getElementById('bill-handling-val');
        if (handlingVal) {
            handlingVal.innerHTML = charges.handling > 0 ? `₹${charges.handling}` : '<span class="text-emerald-600 font-bold">FREE</span>';
        }

        const billTopaySubtitle = document.getElementById('bill-topay-subtitle');
        if (billTopaySubtitle) {
            billTopaySubtitle.textContent = charges.isFreeDel ? 'Free campus delivery included' : 'Fast room delivery';
        }

        const billTotal = document.getElementById('bill-total-val');
        if (billTotal) billTotal.textContent = `₹${exactTotal}`;
        const billSavings = document.getElementById('bill-savings-val');
        if (billSavings) billSavings.textContent = `Total Real Savings: ₹${totalSavings}`;

        // Proceed buttons in Action Container
        const actionContainer = document.getElementById('cart-checkout-action-container');
        if (actionContainer && !window.__isUserBlocked) {
            if (!isMinOrderMet) {
                actionContainer.innerHTML = `
                    <button disabled class="w-full clay-card text-slate-400 dark:text-slate-500 rounded-2xl py-4 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 opacity-90 shadow-none" id="proceed-to-checkout-btn">
                        <span class="material-symbols-outlined text-sm">lock</span>
                        <span>Min Order Value ₹${charges.minCart} (Add ₹${minOrderShortfall} more)</span>
                    </button>
                `;
            } else {
                actionContainer.innerHTML = `
                    <a href="#/checkout" id="proceed-to-checkout-btn" class="clay-btn clay-btn-primary w-full py-4 rounded-2xl font-black text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-2xl tracking-wide uppercase active:scale-95 transition-transform">
                        <span>Proceed to Checkout (₹${exactTotal})</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </a>
                `;
                const btn = document.getElementById('proceed-to-checkout-btn');
                if (btn) {
                    btn.onclick = (e) => {
                        if (!window.isUserLoggedIn()) {
                            e.preventDefault();
                            localStorage.setItem('lpuquick_redirect', '#/checkout');
                            window.location.hash = '#/signin';
                        }
                    };
                }
            }
        }

        // Mobile Checkout Capsule Container
        const mobileContainer = document.getElementById('cart-mobile-checkout-container');
        if (mobileContainer && !window.__isUserBlocked) {
            if (!isMinOrderMet) {
                mobileContainer.innerHTML = `
                    <div class="lg:hidden fixed bottom-16 inset-x-3 z-30 pointer-events-none flex justify-center">
                        <div class="pointer-events-auto liquid-dock-pill max-w-md w-full p-3 px-4 flex items-center justify-between gap-3 rounded-3xl shadow-2xl border border-amber-500/40">
                            <div>
                                <span class="text-[10px] font-bold text-amber-500">Min Order ₹${charges.minCart}</span>
                                <p class="text-xs font-black text-slate-900 dark:text-white leading-tight mt-0.5" id="mobile-min-order-val">Add ₹${minOrderShortfall} more</p>
                            </div>
                            <a href="#/" class="clay-btn clay-btn-primary px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                                <span>Add Items</span>
                                <span class="material-symbols-outlined text-sm">add</span>
                            </a>
                        </div>
                    </div>
                `;
            } else {
                mobileContainer.innerHTML = `
                    <div class="lg:hidden fixed bottom-16 inset-x-3 z-30 pointer-events-none flex justify-center">
                        <div class="pointer-events-auto liquid-dock-pill max-w-md w-full p-3.5 px-4 flex items-center justify-between gap-3 rounded-3xl shadow-2xl">
                            <div>
                                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400" id="mobile-cart-qty-val">${totalQty} ${totalQty === 1 ? 'item' : 'items'}</span>
                                <p class="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5" id="mobile-cart-total-val">₹${exactTotal}</p>
                            </div>
                            <a href="#/checkout" class="clay-btn clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                                <span>Proceed</span>
                                <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </a>
                        </div>
                    </div>
                `;
            }
        }
    }

    document.querySelectorAll('.qty-inc-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-row');
            const productId = btn.dataset.productId || row?.dataset?.productId;
            if (!productId) return;

            const activeHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
            const cachedProd = window.__cachedProducts?.get(productId);
            const stockLeftAttr = btn.dataset.stockLeft || row?.dataset?.stockLeft;
            
            // Accurate Dark Store Stock Determination
            let stockLeft = 50;
            if (stockLeftAttr !== undefined && stockLeftAttr !== '' && stockLeftAttr !== null) {
                stockLeft = Number(stockLeftAttr);
            } else if (cachedProd && cachedProd.stock_left !== undefined) {
                stockLeft = Number(cachedProd.stock_left);
            }

            const qtyNum = row?.querySelector('.qty-num');
            const currentQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

            if (currentQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in ${activeHostel.replace('-', '')} store!`, 'warning', 'inventory_2');
                }
                return;
            }

            const nextQty = currentQty + 1;
            if (qtyNum) qtyNum.textContent = nextQty;
            btn.dataset.qty = nextQty;
            btn.dataset.stockLeft = stockLeft;
            const decBtn = row?.querySelector('.qty-dec-btn');
            if (decBtn) {
                decBtn.dataset.qty = nextQty;
                decBtn.dataset.stockLeft = stockLeft;
            }

            if (nextQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
            }

            updateCartDOMBill();
            window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
        };
    });

    document.querySelectorAll('.qty-dec-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-row');
            const productId = btn.dataset.productId || row?.dataset?.productId;
            if (!productId) return;

            const activeHostel = window.currentHostelId || localStorage.getItem('lpuquick_hostel_id') || 'BH-13';
            const cachedProd = window.__cachedProducts?.get(productId);
            const stockLeftAttr = btn.dataset.stockLeft || row?.dataset?.stockLeft;
            let stockLeft = 50;
            if (stockLeftAttr !== undefined && stockLeftAttr !== '' && stockLeftAttr !== null) {
                stockLeft = Number(stockLeftAttr);
            } else if (cachedProd && cachedProd.stock_left !== undefined) {
                stockLeft = Number(cachedProd.stock_left);
            }

            const qtyNum = row?.querySelector('.qty-num');
            const currentQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

            if (currentQty <= 1) {
                // Remove product completely from cart!
                if (row) {
                    row.style.opacity = '0.3';
                    row.style.transform = 'scale(0.95)';
                    row.remove();
                }
                updateCartDOMBill();
                window.setOptimisticCartQuantity(productId, 0, stockLeft);
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Item removed from cart', 'info', 'delete');
                }
                const remaining = document.querySelectorAll('.cart-row');
                if (remaining.length === 0) {
                    if (window.router) window.router();
                }
            } else {
                const nextQty = currentQty - 1;
                if (qtyNum) qtyNum.textContent = nextQty;
                btn.dataset.qty = nextQty;
                btn.dataset.stockLeft = stockLeft;
                const incBtn = row?.querySelector('.qty-inc-btn');
                if (incBtn) {
                    incBtn.dataset.qty = nextQty;
                    incBtn.dataset.stockLeft = stockLeft;
                    if (nextQty < stockLeft) {
                        incBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                        incBtn.setAttribute('title', 'Add one more');
                        incBtn.disabled = false;
                    }
                }

                updateCartDOMBill();
                window.setOptimisticCartQuantity(productId, nextQty, stockLeft);
            }
        };
    });
};

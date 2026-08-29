// Checkout Page — Real Backend Order Placement + Interactive Slide Confirmation + Real-Time Live Status Timeline
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.checkout = async function() {
    let cartData;
    const userId = window.CURRENT_USER_ID || 'user_001';
    try { 
        cartData = await window.api.getCart(userId); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } }; 
    }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 };
    const subtotal = p.subtotal || 0;
    const exactTotal = subtotal; // Total to Pay is exactly the item subtotal!
    window.cartTotalCache = exactTotal;
    const totalSavings = subtotal > 0 ? 30 : 0; // ₹25 delivery + ₹5 handling savings
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    const itemRows = items.map(item => `
        <div class="flex items-center justify-between py-3 border-b border-surface-variant/30 text-xs sm:text-sm">
            <div class="flex items-center gap-3">
                <img class="w-10 h-10 rounded-xl object-cover bg-surface-container-high" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'">
                <div>
                    <p class="font-semibold text-on-surface truncate max-w-[160px] sm:max-w-xs">${item.name}</p>
                    <p class="text-[11px] text-on-surface-variant">${item.quantity} × ₹${item.price}</p>
                </div>
            </div>
            <span class="font-bold text-on-surface">₹${item.quantity * item.price}</span>
        </div>
    `).join('');

    return `
<style>
@keyframes pulseGlow {
    0% { transform: scale(0.9); opacity: 0.8; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { transform: scale(1.15); opacity: 0.15; box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
    100% { transform: scale(0.9); opacity: 0; }
}
.success-ripple-ring {
    animation: pulseGlow 2.2s infinite cubic-bezier(0.25, 1, 0.5, 1);
}
@keyframes successBadgePop {
    0% { transform: scale(0.4); opacity: 0; }
    60% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
}
.success-badge-anim {
    animation: successBadgePop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.timeline-dot {
    transition: all 0.35s ease;
}
</style>

<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors" id="checkout-back-link">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface" id="checkout-header-title">Checkout</h1>
        </div>
        <div class="flex items-center gap-1 text-xs bg-emerald/10 text-emerald px-3 py-1.5 rounded-full font-semibold">
            <span class="material-symbols-outlined text-sm">bolt</span>
            <span>3 mins ETA</span>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto pt-6 space-y-5" id="checkout-main-container">
        <!-- Pre-Order Section (Visible Before Order Placement) -->
        <div id="checkout-form-section" class="space-y-5 transition-all duration-300">
            
            <!-- Delivery Address Card -->
            <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm">
                <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span class="material-symbols-outlined text-xl">location_on</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-bold text-on-surface text-sm sm:text-base">Hostel Delivery Destination</h3>
                                <span class="text-[10px] bg-emerald/20 text-emerald px-2 py-0.5 rounded font-bold">Express 3m</span>
                            </div>
                            <p class="text-xs text-on-surface-variant mt-0.5" id="checkout-address-text">${address}</p>
                            <p class="text-[11px] text-emerald font-semibold mt-1 flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald"></span> Priority Campus Express Dispatch (3 Mins)
                            </p>
                        </div>
                    </div>
                    <button type="button" class="text-xs font-semibold text-emerald hover:underline address-selector-trigger" onclick="window.openAddressModal()">Change</button>
                </div>
            </div>

            <!-- Order Items Summary -->
            <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm">
                <h3 class="font-bold text-sm sm:text-base text-on-surface mb-2 flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-lg">shopping_bag</span>
                    Order Items (${cartData.item_count || 0})
                </h3>
                <div class="divide-y divide-surface-variant/30">
                    ${itemRows || '<p class="text-xs text-on-surface-variant py-2">No items in cart.</p>'}
                </div>
            </div>

            <!-- Honest Breakdown Card (100% Free Delivery & Free Handling Offer) -->
            <div class="glass-card rounded-3xl p-5 sm:p-6 border border-glass-border shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-base text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald text-xl">receipt</span>
                        Honest Breakdown
                    </h3>
                    <span class="text-xs text-on-surface-variant">Zero hidden charges</span>
                </div>

                <div class="space-y-3 text-xs sm:text-sm">
                    <!-- 1. Item Subtotal -->
                    <div class="flex justify-between text-on-surface-variant">
                        <span>Item Subtotal</span>
                        <span class="font-semibold text-on-surface" id="checkout-subtotal-val">₹${subtotal}</span>
                    </div>

                    <!-- 2. Delivery Partner Fee -->
                    <div class="flex justify-between text-on-surface-variant">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-on-surface-variant/60 text-xs">₹25</span>
                            <span class="font-bold text-emerald">FREE (Offer Applied)</span>
                        </div>
                    </div>

                    <!-- 3. Handling Fee (Minused with Offer) -->
                    <div class="flex justify-between text-on-surface-variant">
                        <span>Handling Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-on-surface-variant/60 text-xs">₹5</span>
                            <span class="font-bold text-emerald">FREE (Offer Applied)</span>
                        </div>
                    </div>

                    <!-- 4. Total to Pay -->
                    <div class="border-t border-outline-variant/40 pt-3 flex justify-between items-center text-base sm:text-lg font-bold text-on-surface">
                        <div>
                            <span>Total to Pay</span>
                            <p class="text-[10px] text-emerald font-semibold">100% Free Campus Delivery & Handling</p>
                        </div>
                        <span class="text-2xl text-emerald font-display font-black" id="checkout-total-val">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-3 bg-emerald/10 border border-emerald/20 rounded-xl flex items-center gap-2 text-xs text-emerald font-semibold">
                    <span class="material-symbols-outlined text-base">savings</span>
                    <span>🎉 Campus Offer Applied: You saved ₹${totalSavings} on delivery & handling!</span>
                </div>
            </div>

            <!-- Payment Method Selection (Online Transactions Blocked / Coming Soon, COD Active) -->
            <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-bold text-sm text-on-surface">Select Payment Method</h3>
                    <span class="text-[10px] text-emerald font-semibold bg-emerald/10 px-2 py-0.5 rounded-full">COD Active</span>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="payment-options">
                    <!-- 1. Cash on Delivery (ACTIVE & DEFAULT) -->
                    <label class="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-emerald bg-emerald/5 cursor-pointer payment-option-label relative" data-method="cod">
                        <input type="radio" name="paymentMethod" value="cod" checked class="text-emerald focus:ring-emerald">
                        <div>
                            <div class="flex items-center gap-1.5">
                                <p class="font-bold text-xs text-on-surface">Cash on Delivery</p>
                                <span class="text-[9px] bg-emerald text-white font-extrabold px-1.5 py-0.2 rounded-full">Active</span>
                            </div>
                            <p class="text-[10px] text-on-surface-variant mt-0.5">Pay at BH13 room/gate</p>
                        </div>
                    </label>

                    <!-- 2. UPI / GPay / QR (BLOCKED - COMING SOON) -->
                    <div class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/40 bg-surface-container-high/40 opacity-60 cursor-pointer payment-blocked-trigger relative group hover:opacity-80 transition-opacity" data-title="Online UPI Payments">
                        <input type="radio" name="paymentMethod" value="upi" disabled class="text-neutral-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-semibold text-xs text-on-surface-variant truncate">UPI / GPay / QR</p>
                                <span class="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">Soon 🔒</span>
                            </div>
                            <p class="text-[10px] text-on-surface-variant">Merchant KYC in progress</p>
                        </div>
                    </div>

                    <!-- 3. Cards / NetBanking (BLOCKED - COMING SOON) -->
                    <div class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/40 bg-surface-container-high/40 opacity-60 cursor-pointer payment-blocked-trigger relative group hover:opacity-80 transition-opacity" data-title="Card & NetBanking">
                        <input type="radio" name="paymentMethod" value="card" disabled class="text-neutral-400">
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5">
                                <p class="font-semibold text-xs text-on-surface-variant truncate">Cards / NetBanking</p>
                                <span class="text-[8px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">Soon 🔒</span>
                            </div>
                            <p class="text-[10px] text-on-surface-variant">Visa, Master, Rupay</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error Banner (Hidden by default) -->
            <div id="checkout-error-banner" class="hidden p-4 bg-error/10 border border-error/30 rounded-2xl flex items-start gap-3 text-xs text-error">
                <span class="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">error</span>
                <div class="flex-1">
                    <p class="font-bold text-sm">Couldn't place your order</p>
                    <p class="text-on-surface-variant mt-0.5" id="checkout-error-msg">Please check your connection and try again.</p>
                    <button type="button" id="checkout-retry-btn" class="mt-2 bg-error text-white font-bold px-3 py-1 rounded-full text-xs hover:opacity-90 active:scale-95 transition-all">
                        Try Again
                    </button>
                </div>
            </div>

            <!-- Slide to Pay Interaction Component -->
            <div class="pt-2">
                <div class="slider-track select-none" id="pay-slider-track">
                    <div class="slider-progress" id="pay-slider-progress"></div>
                    <div class="slider-thumb flex items-center justify-center select-none" id="pay-slider-thumb">
                        <span class="material-symbols-outlined" id="thumb-icon">arrow_forward</span>
                    </div>
                    <div class="slider-text text-sm sm:text-base select-none" id="pay-slider-text">
                        Slide to Confirm Order ₹${exactTotal}
                    </div>
                </div>
                
                <div class="flex items-center justify-between mt-3 text-xs text-on-surface-variant">
                    <button type="button" class="text-primary font-semibold hover:underline cursor-pointer" id="tap-to-pay-btn">
                        Or Click Here to Place COD Order (₹${exactTotal})
                    </button>
                    <span class="flex items-center gap-1 text-emerald font-medium">
                        <span class="material-symbols-outlined text-sm">verified</span> Verified Campus Dispatch
                    </span>
                </div>
            </div>
        </div>

        <!-- POST-ORDER SUCCESS SCREEN & REAL-TIME TIMELINE (Revealed on Real Backend Confirmation) -->
        <div id="order-success-section" class="hidden space-y-5 transition-all duration-500">
            
            <!-- Success Hero Card -->
            <div class="glass-card rounded-3xl p-6 sm:p-8 text-center border-2 border-emerald/40 shadow-xl space-y-4 relative overflow-hidden">
                
                <!-- Animated Success Badge with Ripple Rings -->
                <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full bg-emerald/20 success-ripple-ring"></div>
                    <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-emerald text-white flex items-center justify-center shadow-lg shadow-emerald/40 relative z-10 success-badge-anim">
                        <span class="material-symbols-outlined text-4xl sm:text-5xl">check</span>
                    </div>
                </div>

                <div class="space-y-1">
                    <h2 class="font-headline-md text-2xl sm:text-3xl font-black text-on-surface">
                        Order Placed!
                    </h2>
                    <p class="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto font-medium">
                        Your order has been successfully placed and logged with the Dark Store.
                    </p>
                </div>

                <!-- Order Details Snapshot Card -->
                <div class="bg-surface-container-high/80 rounded-2xl p-4 sm:p-5 border border-surface-variant/40 text-left space-y-2.5 text-xs sm:text-sm shadow-inner">
                    <div class="flex justify-between items-center pb-2 border-b border-surface-variant/40">
                        <span class="text-on-surface-variant font-medium">Order ID</span>
                        <span class="font-black text-on-surface font-mono" id="success-order-id">#ORDER_PENDING</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-on-surface-variant font-medium">Total Amount</span>
                        <span class="font-black text-emerald text-base" id="success-order-total">₹${exactTotal}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-on-surface-variant font-medium">Payment Method</span>
                        <span class="font-semibold text-on-surface" id="success-order-payment">Cash on Delivery</span>
                    </div>
                    <div class="flex justify-between items-start pt-2 border-t border-surface-variant/40">
                        <span class="text-on-surface-variant font-medium">Delivery Destination</span>
                        <span class="font-semibold text-on-surface text-right max-w-[200px]" id="success-order-address">${address}</span>
                    </div>
                    <div class="p-2.5 bg-emerald/10 border border-emerald/20 rounded-xl flex items-center gap-2 text-xs text-emerald font-semibold mt-2">
                        <span class="material-symbols-outlined text-sm">electric_bolt</span>
                        <span id="success-order-dispatch-msg">⚡ Estimated delivery: 3 mins to ${address}</span>
                    </div>
                </div>
            </div>

            <!-- Real-Time Order Status Timeline Card -->
            <div class="glass-card rounded-3xl p-6 border border-glass-border shadow-sm space-y-4">
                <div class="flex justify-between items-center pb-2 border-b border-surface-variant/30">
                    <h3 class="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse"></span>
                        Live Real-Time Order Status
                    </h3>
                    <span class="text-[10px] bg-emerald/15 text-emerald font-bold px-2.5 py-0.5 rounded-full" id="live-connection-badge">
                        ● Live Backend
                    </span>
                </div>

                <!-- 5-Step Order Progression Timeline -->
                <div class="space-y-4 relative pl-2" id="order-timeline-container">
                    
                    <!-- Step 1: Order Placed -->
                    <div class="flex items-start gap-3.5 relative group" id="timeline-step-1">
                        <div class="w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center flex-shrink-0 z-10 timeline-dot shadow-sm">
                            <span class="material-symbols-outlined text-sm">check</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-bold text-xs sm:text-sm text-on-surface">Order Placed</h4>
                                <span class="text-[10px] text-on-surface-variant font-mono" id="timeline-time-1">Just now</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant">Order received and logged in database</p>
                        </div>
                    </div>

                    <!-- Step 2: Order Confirmed -->
                    <div class="flex items-start gap-3.5 relative group opacity-50 transition-opacity" id="timeline-step-2">
                        <div class="w-7 h-7 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface-variant flex items-center justify-center flex-shrink-0 z-10 timeline-dot">
                            <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs sm:text-sm text-on-surface" id="timeline-title-2">Order Confirmed</h4>
                                <span class="text-[10px] text-on-surface-variant font-mono" id="timeline-time-2">--</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant">Dark Store verifying stock and items</p>
                        </div>
                    </div>

                    <!-- Step 3: Preparing -->
                    <div class="flex items-start gap-3.5 relative group opacity-50 transition-opacity" id="timeline-step-3">
                        <div class="w-7 h-7 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface-variant flex items-center justify-center flex-shrink-0 z-10 timeline-dot">
                            <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs sm:text-sm text-on-surface" id="timeline-title-3">Preparing</h4>
                                <span class="text-[10px] text-on-surface-variant font-mono" id="timeline-time-3">--</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant">Express packing at campus fulfillment dark store</p>
                        </div>
                    </div>

                    <!-- Step 4: Ready for Pickup / Out for Delivery -->
                    <div class="flex items-start gap-3.5 relative group opacity-50 transition-opacity" id="timeline-step-4">
                        <div class="w-7 h-7 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface-variant flex items-center justify-center flex-shrink-0 z-10 timeline-dot">
                            <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs sm:text-sm text-on-surface" id="timeline-title-4">Out for Delivery</h4>
                                <span class="text-[10px] text-on-surface-variant font-mono" id="timeline-time-4">--</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant" id="timeline-desc-4">Campus rider dispatched on electric scooter</p>
                        </div>
                    </div>

                    <!-- Step 5: Delivered -->
                    <div class="flex items-start gap-3.5 relative group opacity-50 transition-opacity" id="timeline-step-5">
                        <div class="w-7 h-7 rounded-full bg-surface-container-high border-2 border-outline-variant text-on-surface-variant flex items-center justify-center flex-shrink-0 z-10 timeline-dot">
                            <span class="material-symbols-outlined text-sm">radio_button_unchecked</span>
                        </div>
                        <div class="flex-1 pt-0.5">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-xs sm:text-sm text-on-surface" id="timeline-title-5">Delivered</h4>
                                <span class="text-[10px] text-on-surface-variant font-mono" id="timeline-time-5">--</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant">Package handed over at hostel room/gate</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Actions (Visible & Stable - Never automatically navigates away immediately) -->
            <div class="space-y-3 pt-2">
                <button type="button" id="success-track-btn" class="w-full bg-emerald text-white font-bold text-xs sm:text-sm py-3.5 rounded-full shadow-lg shadow-emerald/30 hover:bg-primary active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    Track Order on Live Map
                </button>
                <a href="#/" id="success-continue-btn" class="w-full bg-surface-container-high border border-surface-variant/40 text-on-surface font-semibold text-xs sm:text-sm py-3 rounded-full hover:bg-surface-variant/50 active:scale-95 transition-all text-center block">
                    Continue Shopping
                </a>
            </div>
        </div>
    </main>

    <!-- Payment Blocked Toast Alert -->
    <div id="payment-toast" class="fixed top-20 left-1/2 -translate-x-1/2 bg-surface-container-lowest/95 backdrop-blur-xl border border-amber-500/40 text-on-surface px-4 py-2.5 rounded-full shadow-2xl z-50 text-xs font-semibold flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none -translate-y-4">
        <span class="material-symbols-outlined text-amber-500 text-sm">lock</span>
        <span id="payment-toast-text">Online payment is launching soon! Delivering with Cash on Delivery right now.</span>
    </div>
</div>`;
};

window.pageInits.checkout = function() {
    const userId = window.CURRENT_USER_ID || 'user_001';
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
        paymentToast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-4');
        paymentToast.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            paymentToast.classList.remove('opacity-100', 'translate-y-0');
            paymentToast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-4');
        }, 3200);
    }

    // Blocked Payment Triggers Handler (UPI & Cards)
    document.querySelectorAll('.payment-blocked-trigger').forEach(trigger => {
        trigger.onclick = () => {
            const title = trigger.dataset.title || 'Online Payment';
            showPaymentToast(`${title} is coming soon! All orders currently deliver via Cash on Delivery.`);
        };
    });

    // Payment Option Selectors (COD)
    document.querySelectorAll('.payment-option-label').forEach(label => {
        label.onclick = () => {
            document.querySelectorAll('.payment-option-label').forEach(l => {
                l.classList.remove('border-emerald', 'bg-emerald/5', 'border-2');
                l.classList.add('border-surface-variant/60');
            });
            label.classList.remove('border-surface-variant/60');
            label.classList.add('border-emerald', 'bg-emerald/5', 'border-2');
        };
    });

    // 1. ROCK-SOLID SLIDER INTERACTION WITH MULTI-EVENT WINDOW TRACKING
    if (track && thumb) {
        let isDragging = false;
        let startClientX = 0;
        let currentPos = 0;

        function getMaxSlide() {
            const trackWidth = track.clientWidth || track.offsetWidth || 320;
            const thumbWidth = thumb.clientWidth || thumb.offsetWidth || 48;
            return Math.max(20, trackWidth - thumbWidth - 12);
        }

        function updateSliderUI(x) {
            const maxSlide = getMaxSlide();
            const clamped = Math.max(0, Math.min(x, maxSlide));
            currentPos = clamped;
            thumb.style.transform = `translateX(${clamped}px)`;
            if (progress) progress.style.width = `${clamped + 28}px`;
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

            // Threshold: reached 70% of slider distance
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

        // --- Touch Events (Scoped Document Listeners) ---
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

        // --- Mouse Events (Scoped Document Listeners) ---
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

        // --- Direct Track Click / Tap Support ---
        track.onclick = (e) => {
            if (isSubmitting) return;
            const trackRect = track.getBoundingClientRect();
            const clickOffset = e.clientX - trackRect.left;
            const maxSlide = getMaxSlide();
            if (clickOffset > maxSlide * 0.35) {
                // Animate thumb smoothly to the end and submit
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
        if (!thumb || !track) return;
        thumb.style.transition = 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        thumb.style.transform = 'translateX(0px)';
        if (progress) {
            progress.style.transition = 'width 0.35s ease';
            progress.style.width = '0px';
        }
        if (text) {
            text.style.transition = 'opacity 0.3s ease';
            text.style.opacity = '1';
            text.textContent = `Slide to Confirm Order ₹${window.cartTotalCache || 65}`;
        }
        if (thumbIcon) {
            thumbIcon.textContent = 'arrow_forward';
            thumbIcon.classList.remove('animate-spin');
        }
    }

    // 2. REAL ORDER PLACEMENT TO BACKEND
    async function handleOrderPlacement() {
        if (isSubmitting) return;
        isSubmitting = true;

        if (errorBanner) errorBanner.classList.add('hidden');

        // Loading State on Slider
        if (thumb && track) {
            const finalX = track.offsetWidth - thumb.offsetWidth - 16;
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

        const deliveryAddress = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
        const selectedPaymentMethod = 'Cash on Delivery';

        try {
            const res = await window.api.checkout(userId, selectedPaymentMethod, deliveryAddress);

            if (res && res.success && res.order) {
                // Successful confirmation state on slider
                if (text) text.textContent = 'Order Placed! ✓';
                if (thumbIcon) {
                    thumbIcon.classList.remove('animate-spin');
                    thumbIcon.textContent = 'check';
                }

                // Render in-place Success Screen with real data
                setTimeout(() => {
                    renderSuccessScreen(res.order);
                }, 300);
            } else {
                throw new Error(res?.error || 'Failed to place order.');
            }
        } catch (err) {
            console.error('Order placement failed:', err);
            isSubmitting = false;
            resetSlider();

            if (errorBanner) {
                errorBanner.classList.remove('hidden');
                if (errorMsg) errorMsg.textContent = err.message || 'Please check your connection and try again.';
            }
        }
    }

    // 3. RENDER POLISHED SUCCESS SCREEN & CONNECT REAL-TIME STATUS
    function renderSuccessScreen(order) {
        if (formSection) formSection.classList.add('hidden');
        if (successSection) {
            successSection.classList.remove('hidden');
            successSection.classList.add('page-enter');
        }
        if (headerTitle) headerTitle.textContent = 'Order Status';
        if (backLink) backLink.href = '#/';

        // Populate real order data
        const formattedId = (order.id || '').replace('order_', '').toUpperCase();
        if (successOrderId) successOrderId.textContent = `#${formattedId}`;
        if (successOrderTotal) successOrderTotal.textContent = `₹${order.total}`;
        if (successOrderPayment) successOrderPayment.textContent = order.payment_method || 'Cash on Delivery';
        if (successOrderAddress) successOrderAddress.textContent = order.delivery_address || 'BH13 (Block A), Room 304';
        if (successOrderDispatchMsg) {
            successOrderDispatchMsg.textContent = `⚡ Estimated delivery: ${order.estimated_minutes || 3} mins to ${order.delivery_address || 'BH13'}`;
        }

        // Set initial timestamp for Step 1
        const timeEl1 = document.getElementById('timeline-time-1');
        if (timeEl1) {
            timeEl1.textContent = new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }

        // Track Order Navigation Button
        successTrackBtn?.addEventListener('click', () => {
            window.location.hash = '#/orders';
        });

        // 4. REAL-TIME WEBSOCKET LISTENER FOR TIMELINE STATUS UPDATES
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
                    dot.classList.remove('bg-surface-container-high', 'border-2', 'border-outline-variant', 'text-on-surface-variant');
                    dot.classList.add('bg-emerald', 'text-white', 'shadow-sm');
                    dot.innerHTML = '<span class="material-symbols-outlined text-sm">check</span>';
                }
            }
            if (timeEl && i === stepNumber && timestamp) {
                timeEl.textContent = timestamp;
            }
        }

        if (stepNumber >= 4 && riderName) {
            const desc4 = document.getElementById('timeline-desc-4');
            if (desc4) desc4.textContent = `Rider ${riderName} is on the way to your hostel`;
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
                    if (data && data.step) {
                        updateTimelineStep(data.step, data.timestamp, data.rider_name);
                    }
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
        pollInterval = setInterval(async () => {
            try {
                const res = await window.api.getOrderDetail(orderId);
                if (res && res.order) {
                    const status = res.order.status;
                    const stepMap = { 'Order Placed': 1, 'Order Confirmed': 2, 'Preparing': 3, 'Out for Delivery': 4, 'Delivered': 5 };
                    const currentStep = stepMap[status] || 1;
                    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    updateTimelineStep(currentStep, timeStr, res.order.rider_name);
                    if (currentStep >= 5) clearInterval(pollInterval);
                }
            } catch (e) {
                console.error('Polling error:', e);
            }
        }, 3500);
    }
};

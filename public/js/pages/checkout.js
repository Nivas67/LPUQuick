// Checkout Page — Exact Transparent Pricing + Swipe Animation + Celebratory 3-Min Order Placed Overlay
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
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Checkout</h1>
        </div>
        <div class="flex items-center gap-1 text-xs bg-emerald/10 text-emerald px-3 py-1.5 rounded-full font-semibold">
            <span class="material-symbols-outlined text-sm">bolt</span>
            <span>3 mins ETA</span>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto pt-6 space-y-5" id="checkout-container">
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
                    <span class="font-semibold text-on-surface">₹${subtotal}</span>
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
                    <span class="text-2xl text-emerald font-display font-black">₹${exactTotal}</span>
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

        <!-- Slide to Pay Interaction Component -->
        <div class="pt-2">
            <div class="slider-track" id="pay-slider-track">
                <div class="slider-progress" id="pay-slider-progress"></div>
                <div class="slider-thumb" id="pay-slider-thumb">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </div>
                <div class="slider-text text-sm sm:text-base" id="pay-slider-text">
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
    </main>

    <!-- Payment Blocked Toast Alert -->
    <div id="payment-toast" class="fixed top-20 left-1/2 -translate-x-1/2 bg-surface-container-lowest/95 backdrop-blur-xl border border-amber-500/40 text-on-surface px-4 py-2.5 rounded-full shadow-2xl z-50 text-xs font-semibold flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none -translate-y-4">
        <span class="material-symbols-outlined text-amber-500 text-sm">lock</span>
        <span id="payment-toast-text">Online payment is launching soon! Delivering with Cash on Delivery right now.</span>
    </div>

    <!-- CELEBRATORY ORDER PLACED (3-MIN COUNTDOWN) OVERLAY -->
    <div id="order-placed-overlay" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-300">
        <div class="bg-surface rounded-3xl border border-emerald/40 shadow-2xl max-w-sm w-full p-6 text-center space-y-5 transform scale-90 transition-transform duration-300 relative overflow-hidden" id="order-placed-card">
            
            <!-- Confetti & Celebration Ring -->
            <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div class="absolute inset-0 rounded-full bg-emerald/20 animate-ping"></div>
                <div class="w-20 h-20 rounded-full bg-emerald text-white flex items-center justify-center shadow-lg shadow-emerald/40 relative z-10 animate-bounce">
                    <span class="material-symbols-outlined text-4xl">check_circle</span>
                </div>
            </div>

            <div class="space-y-1">
                <span class="text-[11px] font-black uppercase tracking-widest text-emerald bg-emerald/10 px-3 py-1 rounded-full inline-block">
                    Order Placed Successfully! 🎉
                </span>
                <h3 class="font-headline-md text-xl sm:text-2xl font-black text-on-surface mt-2">
                    Arriving in 3 Minutes!
                </h3>
                <p class="text-xs text-on-surface-variant" id="placed-dest-text">
                    Delivering to ${address}
                </p>
            </div>

            <!-- 3-Min Express Timer Live Badge -->
            <div class="p-3.5 bg-surface-container-high rounded-2xl border border-surface-variant/40 flex items-center justify-between">
                <div class="flex items-center gap-2 text-left">
                    <span class="w-3 h-3 rounded-full bg-emerald animate-pulse"></span>
                    <div>
                        <p class="font-bold text-xs text-on-surface" id="placed-order-num">Order #confirmed</p>
                        <p class="text-[10px] text-on-surface-variant">Rider Alex is packing your snacks</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-black text-emerald font-mono bg-emerald/15 px-2 py-0.5 rounded-lg inline-block">
                        ⚡ 3:00
                    </span>
                </div>
            </div>

            <!-- Auto-redirect Progress Bar -->
            <div class="space-y-1.5 pt-1">
                <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                    <div class="bg-emerald h-full rounded-full transition-all duration-[2200ms]" id="placed-auto-progress" style="width: 0%;"></div>
                </div>
                <p class="text-[10px] text-on-surface-variant">Opening Live GPS Tracking Map...</p>
            </div>

            <!-- 1-Tap Jump to Live Tracking -->
            <button type="button" id="jump-to-tracking-btn" class="w-full bg-emerald text-white font-bold text-xs sm:text-sm py-3 rounded-full shadow-md hover:bg-primary active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-sm">location_on</span>
                Track Delivery on Live Map
            </button>
        </div>
    </div>
</div>`;
};

window.pageInits.checkout = function() {
    const userId = window.CURRENT_USER_ID || 'user_001';
    const track = document.getElementById('pay-slider-track');
    const thumb = document.getElementById('pay-slider-thumb');
    const progress = document.getElementById('pay-slider-progress');
    const text = document.getElementById('pay-slider-text');
    const tapToPayBtn = document.getElementById('tap-to-pay-btn');
    const paymentToast = document.getElementById('payment-toast');
    const paymentToastText = document.getElementById('payment-toast-text');
    const orderOverlay = document.getElementById('order-placed-overlay');
    const orderCard = document.getElementById('order-placed-card');
    const placedOrderNum = document.getElementById('placed-order-num');
    const placedAutoProgress = document.getElementById('placed-auto-progress');
    const jumpToTrackingBtn = document.getElementById('jump-to-tracking-btn');

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

    // Slider Drag Logic
    if (track && thumb) {
        let isDragging = false;
        let startX = 0;
        let maxSlide = track.offsetWidth - thumb.offsetWidth - 16;

        window.addEventListener('resize', () => {
            if (track && thumb) maxSlide = track.offsetWidth - thumb.offsetWidth - 16;
        });

        function onStart(clientX) {
            isDragging = true;
            startX = clientX;
            thumb.style.transition = 'none';
            progress.style.transition = 'none';
        }

        function onMove(clientX) {
            if (!isDragging) return;
            let delta = clientX - startX;
            delta = Math.max(0, Math.min(delta, maxSlide));
            thumb.style.transform = `translateX(${delta}px)`;
            progress.style.width = `${delta + 24}px`;
            if (text) text.style.opacity = `${1 - (delta / maxSlide)}`;

            if (delta >= maxSlide * 0.85) {
                isDragging = false;
                triggerOrderPlacement();
            }
        }

        function onEnd() {
            if (!isDragging) return;
            isDragging = false;
            thumb.style.transition = 'transform 0.3s ease';
            progress.style.transition = 'width 0.3s ease';
            thumb.style.transform = 'translateX(0px)';
            progress.style.width = '0px';
            if (text) text.style.opacity = '1';
        }

        thumb.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX));
        window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX));
        window.addEventListener('touchend', onEnd);

        thumb.addEventListener('mousedown', (e) => onStart(e.clientX));
        window.addEventListener('mousemove', (e) => onMove(e.clientX));
        window.addEventListener('mouseup', onEnd);
    }

    tapToPayBtn?.addEventListener('click', () => triggerOrderPlacement());

    async function triggerOrderPlacement() {
        if (text) {
            text.textContent = 'Verifying Order... ⚡';
            text.style.opacity = '1';
        }
        if (thumb && track) {
            thumb.style.transform = `translateX(${track.offsetWidth - thumb.offsetWidth - 16}px)`;
            progress.style.width = '100%';
        }

        try {
            const res = await window.api.checkout(userId, 'cod');
            if (res.success && res.order) {
                // Confirm payment callback
                await window.api.paymentCallback(res.order.id, 'success');
                
                // Show Animated Celebratory Order Placed Overlay
                showOrderPlacedOverlay(res.order);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Could not place order: ' + (err.message || 'Server error'));
        }
    }

    function showOrderPlacedOverlay(order) {
        if (!orderOverlay) {
            window.location.hash = '#/orders';
            return;
        }

        if (placedOrderNum) {
            placedOrderNum.textContent = `Order #${order.id.replace('order_', '')}`;
        }

        orderOverlay.classList.remove('hidden');
        setTimeout(() => {
            orderOverlay.classList.remove('opacity-0');
            if (orderCard) {
                orderCard.classList.remove('scale-90');
                orderCard.classList.add('scale-100');
            }
            if (placedAutoProgress) {
                placedAutoProgress.style.width = '100%';
            }
        }, 15);

        // Auto transition after 2.3s
        const navTimer = setTimeout(() => {
            window.location.hash = '#/orders';
        }, 2400);

        // 1-Tap Manual Jump
        jumpToTrackingBtn?.addEventListener('click', () => {
            clearTimeout(navTimer);
            window.location.hash = '#/orders';
        });
    }
};

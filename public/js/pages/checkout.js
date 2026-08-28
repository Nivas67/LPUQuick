// Checkout Page — exact Stitch UI with Honest Breakdown and Slide-to-Pay
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.checkout = async function() {
    let cartData;
    const userId = window.CURRENT_USER_ID || 'user_001';
    try { cartData = await window.api.getCart(userId); } catch(e) { cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 } }; }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 };

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
            <span>7 mins ETA</span>
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
                            <h3 class="font-bold text-on-surface text-sm sm:text-base">Boys Hostel 13 (BH13)</h3>
                            <span class="text-[10px] bg-emerald/20 text-emerald px-2 py-0.5 rounded font-bold">Express Live</span>
                        </div>
                        <p class="text-xs text-on-surface-variant mt-0.5" id="checkout-address-text">${window.currentAddressDetail || 'Room 304, 3rd Floor, Block A, BH13'}</p>
                        <p class="text-[11px] text-emerald font-semibold mt-1 flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald"></span> Priority Campus Express Dispatch (7 Mins)
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

        <!-- Honest Breakdown Card -->
        <div class="glass-card rounded-3xl p-5 sm:p-6 border border-glass-border shadow-sm space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-base text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald text-xl">receipt</span>
                    Honest Breakdown
                </h3>
                <span class="text-xs text-on-surface-variant">No surprises</span>
            </div>

            <div class="space-y-2.5 text-xs sm:text-sm">
                <div class="flex justify-between text-on-surface-variant">
                    <span>Item Subtotal</span>
                    <span class="font-semibold text-on-surface">₹${p.subtotal}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span class="flex items-center gap-1">Delivery Partner Fee</span>
                    <span class="font-semibold ${p.delivery_fee === 0 ? 'text-emerald' : 'text-on-surface'}">${p.delivery_fee === 0 ? 'FREE (Campus Promo)' : `₹${p.delivery_fee}`}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span>Handling & Campus Logistics</span>
                    <span class="font-semibold text-on-surface">₹${p.platform_fee}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span>Applicable GST (5%)</span>
                    <span class="font-semibold text-on-surface">₹${p.tax}</span>
                </div>
                <div class="border-t border-outline-variant/40 pt-3 flex justify-between items-center text-base sm:text-lg font-bold text-on-surface">
                    <span>Total to Pay</span>
                    <span class="text-2xl text-emerald font-display">₹${p.total}</span>
                </div>
            </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm space-y-3">
            <h3 class="font-bold text-sm text-on-surface">Select Payment Method</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="payment-options">
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-emerald bg-emerald/5 cursor-pointer payment-option-label" data-method="upi">
                    <input type="radio" name="paymentMethod" value="upi" checked class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">UPI / GPay</p>
                        <p class="text-[10px] text-on-surface-variant">1-Tap Fast Pay</p>
                    </div>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="card">
                    <input type="radio" name="paymentMethod" value="card" class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">Debit / Credit</p>
                        <p class="text-[10px] text-on-surface-variant">Visa / Master</p>
                    </div>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="cod">
                    <input type="radio" name="paymentMethod" value="cod" class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">Cash on Delivery</p>
                        <p class="text-[10px] text-on-surface-variant">Pay at Hostel Gate</p>
                    </div>
                </label>
            </div>
        </div>

        <!-- Payment Failure Banner -->
        <div id="payment-failure-banner" class="hidden glass-card border border-error/40 bg-error/10 rounded-2xl p-4 text-error space-y-1">
            <div class="flex items-center gap-2 font-bold text-xs">
                <span class="material-symbols-outlined text-sm">error</span>
                <span>Payment Authorization Failed</span>
            </div>
            <p class="text-xs text-on-surface-variant" id="payment-failure-msg">Please choose another payment method or try Cash on Delivery.</p>
        </div>

        <!-- Slide to Pay Interaction Component -->
        <div class="pt-2">
            <div class="slider-track" id="pay-slider-track">
                <div class="slider-progress" id="pay-slider-progress"></div>
                <div class="slider-thumb" id="pay-slider-thumb">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </div>
                <div class="slider-text text-sm sm:text-base" id="pay-slider-text">
                    Slide to Pay ₹${p.total}
                </div>
            </div>
            
            <div class="flex items-center justify-between mt-3 text-xs text-on-surface-variant">
                <button type="button" class="text-primary font-semibold hover:underline" id="tap-to-pay-btn">
                    Or Click Here to Place Order
                </button>
                <span class="flex items-center gap-1 text-emerald font-medium">
                    <span class="material-symbols-outlined text-sm">lock</span> 100% Secure
                </span>
            </div>
        </div>
    </main>
</div>`;
};

window.pageInits.checkout = function() {
    const userId = window.CURRENT_USER_ID || 'user_001';
    const track = document.getElementById('pay-slider-track');
    const thumb = document.getElementById('pay-slider-thumb');
    const progress = document.getElementById('pay-slider-progress');
    const text = document.getElementById('pay-slider-text');
    const failureBanner = document.getElementById('payment-failure-banner');
    const container = document.getElementById('checkout-container');
    const tapToPayBtn = document.getElementById('tap-to-pay-btn');

    if (!track || !thumb) return;

    let isDragging = false;
    let startX = 0;
    let maxSlide = 0;

    function updateMaxSlide() {
        if (track && thumb) maxSlide = track.offsetWidth - thumb.offsetWidth - 16;
    }
    updateMaxSlide();
    window.addEventListener('resize', updateMaxSlide);

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
            triggerCheckout();
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

    tapToPayBtn?.addEventListener('click', () => triggerCheckout());

    async function triggerCheckout() {
        if (text) {
            text.textContent = 'Placing Order...';
            text.style.opacity = '1';
        }
        thumb.style.transform = `translateX(${maxSlide}px)`;
        progress.style.width = '100%';

        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';

        try {
            const res = await window.api.checkout(userId, selectedMethod);
            if (res.success && res.order) {
                // Confirm payment callback
                await window.api.paymentCallback(res.order.id, 'success');
                window.location.hash = '#/orders';
            } else {
                handleFailure(res.message || 'Payment could not be completed');
            }
        } catch (err) {
            handleFailure(err.message || 'Network error during checkout');
        }
    }

    function handleFailure(msg) {
        container?.classList.add('shake');
        setTimeout(() => container?.classList.remove('shake'), 250);

        if (failureBanner) {
            failureBanner.classList.remove('hidden');
            const msgEl = document.getElementById('payment-failure-msg');
            if (msgEl) msgEl.textContent = msg;
        }

        thumb.style.transition = 'transform 0.3s ease';
        progress.style.transition = 'width 0.3s ease';
        thumb.style.transform = 'translateX(0px)';
        progress.style.width = '0px';
        if (text) {
            text.textContent = 'Slide to Pay';
            text.style.opacity = '1';
        }
    }

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
};

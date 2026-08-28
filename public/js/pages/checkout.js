// Checkout Page — exact Stitch UI with Honest Breakdown and Slide-to-Pay
window.pages.checkout = async function() {
    let cartData;
    try { cartData = await api.getCart(CURRENT_USER_ID); } catch(e) { cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 } }; }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 };

    const itemRows = items.map(item => `
        <div class="flex items-center justify-between py-3 border-b border-surface-variant/30 text-sm">
            <div class="flex items-center gap-3">
                <img class="w-10 h-10 rounded-lg object-cover bg-surface-container-high" src="${item.image_url}" alt="${item.name}">
                <div>
                    <p class="font-medium text-on-surface truncate max-w-[180px] sm:max-w-xs">${item.name}</p>
                    <p class="text-xs text-on-surface-variant">${item.quantity} × ₹${item.price}</p>
                </div>
            </div>
            <span class="font-semibold text-on-surface">₹${item.quantity * item.price}</span>
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
            <h1 class="font-headline-md text-headline-md text-on-surface">Checkout</h1>
        </div>
        <div class="flex items-center gap-1.5 text-xs bg-emerald/10 text-emerald px-3 py-1.5 rounded-full font-semibold">
            <span class="material-symbols-outlined text-sm">bolt</span>
            <span>7 mins ETA</span>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto pt-6 space-y-6" id="checkout-container">
        <!-- Delivery Address Card -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm">
            <div class="flex justify-between items-start">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald/10 text-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span class="material-symbols-outlined text-xl">location_on</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-on-surface text-base">Boys Hostel 2 (BH2)</h3>
                            <span class="text-xs bg-surface-container-high px-2 py-0.5 rounded font-medium text-on-surface-variant">Default</span>
                        </div>
                        <p class="text-xs text-on-surface-variant mt-1">Room 304, 3rd Floor, LPU Campus, Phagwara</p>
                        <p class="text-xs text-emerald font-semibold mt-1">Delivery Partner assigned immediately</p>
                    </div>
                </div>
                <button class="text-xs font-semibold text-emerald hover:underline">Change</button>
            </div>
        </div>

        <!-- Order Items Summary -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm">
            <h3 class="font-bold text-base text-on-surface mb-3 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-xl">shopping_bag</span>
                Order Items (${cartData.item_count || 0})
            </h3>
            <div class="divide-y divide-surface-variant/30">
                ${itemRows || '<p class="text-sm text-on-surface-variant">No items in cart.</p>'}
            </div>
        </div>

        <!-- Honest Breakdown Card -->
        <div class="glass-card rounded-3xl p-6 border border-glass-border shadow-sm space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-lg text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald text-xl">receipt</span>
                    Honest Breakdown
                </h3>
                <span class="text-xs text-on-surface-variant">All taxes included</span>
            </div>

            <div class="space-y-2.5 text-sm">
                <div class="flex justify-between text-on-surface-variant">
                    <span>Item Subtotal</span>
                    <span class="font-medium text-on-surface">₹${p.subtotal}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span class="flex items-center gap-1">Delivery Partner Fee</span>
                    <span class="font-medium ${p.delivery_fee === 0 ? 'text-emerald font-semibold' : 'text-on-surface'}">${p.delivery_fee === 0 ? 'FREE (Promotional)' : `₹${p.delivery_fee}`}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span>Handling & Campus Logistics</span>
                    <span class="font-medium text-on-surface">₹${p.platform_fee}</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                    <span>Applicable GST (5%)</span>
                    <span class="font-medium text-on-surface">₹${p.tax}</span>
                </div>
                <div class="border-t border-outline-variant/40 pt-3 flex justify-between items-center text-lg font-bold text-on-surface">
                    <span>Total Amount</span>
                    <span class="text-2xl text-emerald font-display">₹${p.total}</span>
                </div>
            </div>
        </div>

        <!-- Payment Method Selection -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm space-y-3">
            <h3 class="font-bold text-base text-on-surface mb-2">Payment Method</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="payment-options">
                <label class="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald bg-emerald/5 cursor-pointer payment-option-label" data-method="upi">
                    <input type="radio" name="paymentMethod" value="upi" checked class="text-emerald focus:ring-emerald">
                    <span class="font-semibold text-sm">UPI (GPay / PhonePe)</span>
                </label>
                <label class="flex items-center gap-3 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="card">
                    <input type="radio" name="paymentMethod" value="card" class="text-emerald focus:ring-emerald">
                    <span class="font-medium text-sm">Card</span>
                </label>
                <label class="flex items-center gap-3 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="cod">
                    <input type="radio" name="paymentMethod" value="cod" class="text-emerald focus:ring-emerald">
                    <span class="font-medium text-sm">Cash on Delivery</span>
                </label>
            </div>
        </div>

        <!-- Payment Failure Banner (Hidden initially) -->
        <div id="payment-failure-banner" class="hidden glass-card border border-error/30 bg-error/10 rounded-2xl p-4 text-error space-y-2">
            <div class="flex items-center gap-2 font-bold text-sm">
                <span class="material-symbols-outlined">error</span>
                <span>Payment authorization failed</span>
            </div>
            <p class="text-xs text-on-surface-variant" id="payment-failure-msg">Please select an alternative payment method to complete your order.</p>
        </div>

        <!-- Slide to Pay Interaction Component -->
        <div class="pt-4">
            <div class="slider-track" id="pay-slider-track">
                <div class="slider-progress" id="pay-slider-progress"></div>
                <div class="slider-thumb" id="pay-slider-thumb">
                    <span class="material-symbols-outlined">arrow_forward</span>
                </div>
                <div class="slider-text" id="pay-slider-text">
                    Slide to Pay ₹${p.total}
                </div>
            </div>
            <p class="text-center text-xs text-on-surface-variant mt-3 flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-sm text-emerald">lock</span>
                100% Secure 1-Tap Campus Checkout
            </p>
        </div>
    </main>
</div>`;
};

window.pageInits.checkout = function() {
    const track = document.getElementById('pay-slider-track');
    const thumb = document.getElementById('pay-slider-thumb');
    const progress = document.getElementById('pay-slider-progress');
    const text = document.getElementById('pay-slider-text');
    const failureBanner = document.getElementById('payment-failure-banner');
    const container = document.getElementById('checkout-container');

    if (!track || !thumb) return;

    let isDragging = false;
    let startX = 0;
    let maxSlide = 0;

    function updateMaxSlide() {
        maxSlide = track.offsetWidth - thumb.offsetWidth - 16;
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
        text.style.opacity = `${1 - (delta / maxSlide)}`;

        // Trigger when 90% reached
        if (delta >= maxSlide * 0.9) {
            isDragging = false;
            triggerCheckout();
        }
    }

    function onEnd() {
        if (!isDragging) return;
        isDragging = false;
        // Snap back
        thumb.style.transition = 'transform 0.3s ease';
        progress.style.transition = 'width 0.3s ease';
        thumb.style.transform = 'translateX(0px)';
        progress.style.width = '0px';
        text.style.opacity = '1';
    }

    // Touch events
    thumb.addEventListener('touchstart', (e) => onStart(e.touches[0].clientX));
    window.addEventListener('touchmove', (e) => onMove(e.touches[0].clientX));
    window.addEventListener('touchend', onEnd);

    // Mouse events
    thumb.addEventListener('mousedown', (e) => onStart(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    // Click track shortcut
    track.addEventListener('dblclick', () => triggerCheckout());

    async function triggerCheckout() {
        text.textContent = 'Processing Order...';
        text.style.opacity = '1';
        thumb.style.transform = `translateX(${maxSlide}px)`;
        progress.style.width = '100%';

        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';

        try {
            const res = await api.checkout(CURRENT_USER_ID, selectedMethod);
            if (res.success && res.order) {
                // If UPI intent generated, simulate payment callback acceptance
                await api.paymentCallback(res.order.id, 'success');
                navigate('/orders');
            } else {
                handleFailure(res.message || 'Payment could not be completed');
            }
        } catch (err) {
            handleFailure(err.message || 'Network error during checkout');
        }
    }

    function handleFailure(msg) {
        // Trigger 200ms screen shake
        container?.classList.add('shake');
        setTimeout(() => container?.classList.remove('shake'), 250);

        // Show failure banner
        if (failureBanner) {
            failureBanner.classList.remove('hidden');
            const msgEl = document.getElementById('payment-failure-msg');
            if (msgEl) msgEl.textContent = msg + ' — Please choose another method or retry.';
        }

        // Reset slider
        thumb.style.transition = 'transform 0.3s ease';
        progress.style.transition = 'width 0.3s ease';
        thumb.style.transform = 'translateX(0px)';
        progress.style.width = '0px';
        text.textContent = 'Slide to Pay';
        text.style.opacity = '1';
    }

    // Payment method radio styling
    document.querySelectorAll('.payment-option-label').forEach(label => {
        label.addEventListener('click', () => {
            document.querySelectorAll('.payment-option-label').forEach(l => {
                l.classList.remove('border-emerald', 'bg-emerald/5', 'border-2');
                l.classList.add('border-surface-variant/60');
            });
            label.classList.remove('border-surface-variant/60');
            label.classList.add('border-emerald', 'bg-emerald/5', 'border-2');
        });
    });
};

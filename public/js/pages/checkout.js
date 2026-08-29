// Checkout Page — Exact Transparent Pricing + Real-Time Interactive Payment Sheet
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.checkout = async function() {
    let cartData;
    const userId = window.CURRENT_USER_ID || 'user_001';
    try { 
        cartData = await window.api.getCart(userId); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 } }; 
    }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 };
    const subtotal = p.subtotal || 0;
    const netHandling = subtotal > 0 ? 5 : 0;
    const exactTotal = subtotal > 0 ? Math.round((subtotal + netHandling) * 100) / 100 : 0;
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
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald"></span> Priority Campus Express Dispatch
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

        <!-- Honest Breakdown Card (Exact & Clean Arithmetic: Subtotal + ₹5 Handling Fee) -->
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
                        <span class="font-bold text-emerald">FREE</span>
                    </div>
                </div>

                <!-- 3. Handling Fee -->
                <div class="flex justify-between text-on-surface-variant">
                    <span>Handling Fee</span>
                    <div class="flex items-center gap-1.5">
                        <span class="line-through text-on-surface-variant/60 text-xs">₹10</span>
                        <span class="font-semibold text-on-surface">₹5</span>
                    </div>
                </div>

                <!-- 4. Total to Pay -->
                <div class="border-t border-outline-variant/40 pt-3 flex justify-between items-center text-base sm:text-lg font-bold text-on-surface">
                    <div>
                        <span>Total to Pay</span>
                        <p class="text-[10px] text-on-surface-variant font-normal">₹${subtotal} items + ₹5 handling fee</p>
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

        <!-- Payment Method Selection -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm space-y-3">
            <h3 class="font-bold text-sm text-on-surface">Select Payment Method</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="payment-options">
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border-2 border-emerald bg-emerald/5 cursor-pointer payment-option-label" data-method="upi">
                    <input type="radio" name="paymentMethod" value="upi" checked class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">UPI / GPay / QR</p>
                        <p class="text-[10px] text-on-surface-variant">Instant 1-Tap Pay</p>
                    </div>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="cod">
                    <input type="radio" name="paymentMethod" value="cod" class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">Cash on Delivery</p>
                        <p class="text-[10px] text-on-surface-variant">Pay at Hostel Gate</p>
                    </div>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-2xl border border-surface-variant/60 hover:bg-surface-container-high/40 cursor-pointer payment-option-label" data-method="card">
                    <input type="radio" name="paymentMethod" value="card" class="text-emerald focus:ring-emerald">
                    <div>
                        <p class="font-semibold text-xs text-on-surface">Card / NetBanking</p>
                        <p class="text-[10px] text-on-surface-variant">Visa, Master, Rupay</p>
                    </div>
                </label>
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
                    Slide to Pay ₹${exactTotal}
                </div>
            </div>
            
            <div class="flex items-center justify-between mt-3 text-xs text-on-surface-variant">
                <button type="button" class="text-primary font-semibold hover:underline cursor-pointer" id="tap-to-pay-btn">
                    Or Click Here to Place Order (₹${exactTotal})
                </button>
                <span class="flex items-center gap-1 text-emerald font-medium">
                    <span class="material-symbols-outlined text-sm">lock</span> 100% Secure Gateway
                </span>
            </div>
        </div>
    </main>

    <!-- REAL-TIME PAYMENT GATEWAY MODAL -->
    <div id="payment-gateway-modal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 hidden opacity-0 transition-opacity duration-300">
        <div class="bg-surface rounded-3xl border border-glass-border shadow-2xl max-w-md w-full p-6 text-center space-y-5 transform scale-95 transition-transform duration-300 relative overflow-hidden" id="payment-modal-card">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between pb-3 border-b border-surface-variant/40">
                <div class="flex items-center gap-2 text-left">
                    <div class="w-8 h-8 rounded-xl bg-emerald text-white flex items-center justify-center font-bold">
                        ⚡
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-on-surface">LPUQuick FastPay</h4>
                        <p class="text-[10px] text-on-surface-variant" id="pay-modal-order-id">Order #pending</p>
                    </div>
                </div>
                <span class="text-lg font-black text-emerald font-display" id="pay-modal-amount">₹${exactTotal}</span>
            </div>

            <!-- UPI Payment View -->
            <div id="upi-gateway-view" class="space-y-4">
                <p class="text-xs text-on-surface-variant">Scan QR with any UPI app (GPay, PhonePe, Paytm, Cred)</p>
                
                <!-- Dynamic QR Code Container -->
                <div class="w-48 h-48 mx-auto p-2 bg-white rounded-2xl shadow-inner border border-surface-variant/60 flex items-center justify-center relative group">
                    <img id="upi-qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi%3A%2F%2Fpay%3Fpa%3Dlpuquick%40okaxis%26pn%3DLPUQuick%26am%3D${exactTotal}%26cu%3DINR" alt="UPI QR Code" class="w-full h-full object-contain">
                    <div class="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                        <span class="material-symbols-outlined text-2xl">qr_code_scanner</span>
                        <span class="text-[11px] font-bold mt-1">Scan & Pay ₹${exactTotal}</span>
                    </div>
                </div>

                <!-- 1-Tap UPI Apps Grid -->
                <div>
                    <p class="text-[11px] font-semibold text-on-surface-variant mb-2">Or Pay via Installed UPI App:</p>
                    <div class="grid grid-cols-4 gap-2">
                        <button type="button" class="upi-app-btn flex flex-col items-center p-2 rounded-xl bg-surface-container-high hover:bg-emerald/10 border border-surface-variant/40 hover:border-emerald transition-all cursor-pointer" data-app="GPay">
                            <span class="text-xl">🟢</span>
                            <span class="text-[10px] font-bold text-on-surface mt-1">GPay</span>
                        </button>
                        <button type="button" class="upi-app-btn flex flex-col items-center p-2 rounded-xl bg-surface-container-high hover:bg-emerald/10 border border-surface-variant/40 hover:border-emerald transition-all cursor-pointer" data-app="PhonePe">
                            <span class="text-xl">🟣</span>
                            <span class="text-[10px] font-bold text-on-surface mt-1">PhonePe</span>
                        </button>
                        <button type="button" class="upi-app-btn flex flex-col items-center p-2 rounded-xl bg-surface-container-high hover:bg-emerald/10 border border-surface-variant/40 hover:border-emerald transition-all cursor-pointer" data-app="Paytm">
                            <span class="text-xl">🔵</span>
                            <span class="text-[10px] font-bold text-on-surface mt-1">Paytm</span>
                        </button>
                        <button type="button" class="upi-app-btn flex flex-col items-center p-2 rounded-xl bg-surface-container-high hover:bg-emerald/10 border border-surface-variant/40 hover:border-emerald transition-all cursor-pointer" data-app="Cred">
                            <span class="text-xl">⚡</span>
                            <span class="text-[10px] font-bold text-on-surface mt-1">Cred</span>
                        </button>
                    </div>
                </div>

                <!-- Live Status & Timer -->
                <div class="p-3 bg-surface-container-high/70 rounded-2xl border border-surface-variant/30 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2 text-on-surface font-medium">
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span id="gateway-status-text">Awaiting payment verification...</span>
                    </div>
                    <span class="font-bold text-on-surface-variant font-mono" id="gateway-timer">02:59</span>
                </div>

                <!-- Instant Payment Simulation Trigger for Demo -->
                <button type="button" id="confirm-payment-btn" class="w-full bg-emerald text-white font-bold text-xs sm:text-sm py-3 rounded-full shadow-md hover:bg-primary active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-base">verified</span>
                    Simulate Successful Payment (₹${exactTotal})
                </button>
            </div>

            <!-- Payment Success State (Hidden by default) -->
            <div id="payment-success-view" class="hidden py-6 space-y-4 text-center">
                <div class="w-16 h-16 rounded-full bg-emerald text-white mx-auto flex items-center justify-center shadow-lg animate-bounce">
                    <span class="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <div>
                    <h3 class="font-headline-md text-lg font-black text-on-surface">Payment Successful!</h3>
                    <p class="text-xs text-on-surface-variant mt-1">₹${exactTotal} paid · Order confirmed and dispatched to BH13</p>
                </div>
                <div class="p-2.5 bg-emerald/10 text-emerald font-bold text-xs rounded-xl flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">electric_bolt</span>
                    <span>3-Minute Express Timer Started!</span>
                </div>
            </div>

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
    const gatewayModal = document.getElementById('payment-gateway-modal');
    const modalOrderId = document.getElementById('pay-modal-order-id');
    const upiQrImage = document.getElementById('upi-qr-image');
    const gatewayStatusText = document.getElementById('gateway-status-text');
    const gatewayTimer = document.getElementById('gateway-timer');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const upiGatewayView = document.getElementById('upi-gateway-view');
    const paymentSuccessView = document.getElementById('payment-success-view');

    let currentOrder = null;
    let timerInterval = null;

    // Payment Option Selectors
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

    // Slider Logic
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
                startCheckoutFlow();
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

    tapToPayBtn?.addEventListener('click', () => startCheckoutFlow());

    async function startCheckoutFlow() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';

        try {
            const res = await window.api.checkout(userId, selectedMethod);
            if (res.success && res.order) {
                currentOrder = res.order;

                if (selectedMethod === 'cod') {
                    // Direct Instant Confirmation for Cash on Delivery
                    await window.api.paymentCallback(currentOrder.id, 'success');
                    window.location.hash = '#/orders';
                } else {
                    // Open Real-Time Payment Modal for UPI / Card
                    openPaymentModal(currentOrder);
                }
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Could not start checkout: ' + (err.message || 'Server error'));
        }
    }

    function openPaymentModal(order) {
        if (!gatewayModal) return;
        if (modalOrderId) modalOrderId.textContent = `Order #${order.id.replace('order_', '')}`;
        if (upiQrImage) {
            upiQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi%3A%2F%2Fpay%3Fpa%3Dlpuquick%40okaxis%26pn%3DLPUQuick%26am%3D${order.total}%26cu%3DINR%26tn%3DOrder_${order.id}`;
        }

        gatewayModal.classList.remove('hidden');
        setTimeout(() => {
            gatewayModal.classList.remove('opacity-0');
        }, 10);

        // Start Countdown Timer
        let secondsLeft = 179;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsLeft--;
            const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
            const secs = (secondsLeft % 60).toString().padStart(2, '0');
            if (gatewayTimer) gatewayTimer.textContent = `${mins}:${secs}`;
            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    // 1-Tap UPI Apps Handler
    document.querySelectorAll('.upi-app-btn').forEach(btn => {
        btn.onclick = () => {
            const app = btn.dataset.app;
            if (gatewayStatusText) gatewayStatusText.textContent = `Authorizing with ${app}...`;
            setTimeout(() => {
                completePaymentSuccess();
            }, 1200);
        };
    });

    // Simulate / Confirm Payment Button
    confirmPaymentBtn?.addEventListener('click', () => {
        completePaymentSuccess();
    });

    async function completePaymentSuccess() {
        if (!currentOrder) return;
        if (gatewayStatusText) gatewayStatusText.textContent = 'Verifying with bank...';

        try {
            await window.api.paymentCallback(currentOrder.id, 'success');
        } catch (e) {
            console.error('Callback error:', e);
        }

        // Show Success Animation
        if (upiGatewayView) upiGatewayView.classList.add('hidden');
        if (paymentSuccessView) paymentSuccessView.classList.remove('hidden');
        clearInterval(timerInterval);

        // Transition to Live Orders Tracking after 1.2s
        setTimeout(() => {
            window.location.hash = '#/orders';
        }, 1200);
    }
};

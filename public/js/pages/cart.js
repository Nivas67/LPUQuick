// Cart Page — exact Stitch UI reproduction with transparent pricing breakdown
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.cart = async function() {
    let cartData;
    const userId = window.getEffectiveUserId();
    try { cartData = await window.api.getCart(userId); } catch(e) { cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0, free_delivery_remaining: 199 } }; }

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
    
    // Total Real Savings: MRP discount + 5% offer + ₹25 delivery + ₹5 handling
    const deliverySavings = subtotal > 0 ? 25 : 0;
    const handlingSavings = subtotal > 0 ? 5 : 0;
    const totalSavings = mrpDiscount + discount5 + deliverySavings + handlingSavings;

    const itemCards = items.length === 0 ? `
        <div class="glass-card rounded-3xl p-10 sm:p-12 text-center my-6 border border-glass-border">
            <div class="w-16 h-16 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant">shopping_bag</span>
            </div>
            <h3 class="font-headline-md text-lg sm:text-xl font-bold text-on-surface">Your cart is empty</h3>
            <p class="text-xs sm:text-sm text-on-surface-variant mt-1.5 mb-6 max-w-sm mx-auto">Explore fresh snacks, noodles, dairy and drinks to start your order.</p>
            <a href="#/" class="inline-flex items-center gap-2 bg-emerald text-white px-6 py-3 rounded-full text-xs sm:text-sm font-semibold shadow-md hover:bg-primary transition-all active:scale-95">
                Browse Campus Store <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    ` : items.map(item => {
        const itemMrp = Number(item.mrp) || Number(item.price) || 0;
        const itemPrice = Number(item.price) || 0;
        const hasItemDiscount = itemMrp > itemPrice;
        const discPercent = hasItemDiscount ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;

        return `
        <div class="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 border border-glass-border shadow-sm mb-3 cart-row" data-cart-id="${item.cart_id}">
            <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img class="w-full h-full object-cover" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                </div>
                <div class="min-w-0">
                    <h4 class="font-label-lg font-semibold text-sm text-on-surface truncate">${item.name}</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">${item.size || item.unit || ''}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="font-bold text-sm text-on-surface">₹${itemPrice}</span>
                        ${hasItemDiscount ? `
                        <span class="line-through text-on-surface-variant/60 text-xs">₹${itemMrp}</span>
                        <span class="text-[10px] text-emerald font-bold bg-emerald/15 px-1.5 py-0.2 rounded">${discPercent}% OFF</span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="cart-qty-stepper flex items-center gap-2.5 rounded-full px-2.5 py-1 flex-shrink-0">
                <button class="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-all qty-dec-btn" data-id="${item.cart_id}" data-qty="${item.quantity}">
                    <span class="material-symbols-outlined text-base">remove</span>
                </button>
                <span class="font-bold text-xs w-4 text-center qty-num">${item.quantity}</span>
                <button class="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-all qty-inc-btn" data-id="${item.cart_id}" data-qty="${item.quantity}">
                    <span class="material-symbols-outlined text-base">add</span>
                </button>
            </div>
        </div>
    `}).join('');

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <div>
                <h1 class="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">Your Cart</h1>
                <p class="text-xs text-on-surface-variant">${cartData.item_count || 0} items · Delivering to ${window.currentAddress || 'BH13'} (3 mins)</p>
            </div>
        </div>
        ${items.length > 0 ? `
        <button class="text-xs font-semibold text-error hover:opacity-80 p-2" id="clear-cart-btn">Clear All</button>
        ` : ''}
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Left: Cart Items -->
        <div class="lg:col-span-2 space-y-4">
            <!-- 5% Offer Status Banner -->
            ${hasDiscount ? `
            <div class="glass-card rounded-2xl p-3.5 border border-emerald/40 bg-emerald/15 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-2 text-xs font-bold text-emerald">
                    <span class="material-symbols-outlined text-base">celebration</span>
                    <span>5% Campus Bulk Offer Applied (Above ₹350)!</span>
                </div>
                <span class="text-[11px] font-extrabold text-emerald bg-emerald/25 px-2.5 py-0.5 rounded-full">Extra ₹${discount5} OFF</span>
            </div>
            ` : subtotal > 0 ? `
            <div class="glass-card rounded-2xl p-3.5 border border-amber-500/30 bg-amber-500/10 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-2 text-xs font-bold text-amber-500">
                    <span class="material-symbols-outlined text-base">local_offer</span>
                    <span>Add ₹${350 - subtotal} more to get 5% FLAT OFF on your order!</span>
                </div>
                <a href="#/" class="text-[11px] font-extrabold text-amber-500 underline">Add Items</a>
            </div>
            ` : ''}

            <!-- Free Delivery Promo Banner -->
            <div class="glass-card rounded-2xl p-3.5 border border-emerald/30 bg-emerald/10 flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs font-bold text-emerald">
                    <span class="material-symbols-outlined text-base">local_shipping</span>
                    <span>Free 3-Min Campus Delivery Applied!</span>
                </div>
                <span class="text-[11px] font-extrabold text-emerald bg-emerald/20 px-2 py-0.5 rounded-full">Saved ₹25</span>
            </div>

            <!-- Items List -->
            <div>
                ${itemCards}
            </div>
        </div>

        <!-- Right: Order Summary Panel -->
        <div class="lg:col-span-1">
            <div class="glass-card rounded-3xl p-6 border border-glass-border sticky top-24 shadow-sm space-y-4">
                <h3 class="font-headline-md text-base font-bold text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">receipt</span>
                    Bill Details
                </h3>
                
                <div class="space-y-3 text-xs sm:text-sm">
                    ${mrpDiscount > 0 ? `
                    <!-- Total MRP Value -->
                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-200">
                        <span class="font-medium">Total MRP Value</span>
                        <span class="line-through text-slate-400 dark:text-slate-400 font-semibold text-xs sm:text-sm">₹${totalMrp}</span>
                    </div>

                    <!-- Product MRP Discount -->
                    <div class="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Product Discount</span>
                        <span class="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold text-xs">-₹${mrpDiscount}</span>
                    </div>
                    ` : ''}

                    <!-- Item Total -->
                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-200">
                        <span class="font-medium">Item Subtotal</span>
                        <span class="font-bold text-slate-900 dark:text-white">₹${subtotal}</span>
                    </div>

                    ${hasDiscount ? `
                    <!-- 5% Bulk Offer -->
                    <div class="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>5% Bulk Offer (&gt;₹350)</span>
                        <span class="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold text-xs">-₹${discount5}</span>
                    </div>
                    ` : ''}

                    <!-- Delivery Partner Fee -->
                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-200">
                        <span class="font-medium">Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-slate-400 dark:text-slate-400 text-xs font-medium">₹25</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">FREE</span>
                        </div>
                    </div>

                    <!-- Handling Fee -->
                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-200">
                        <span class="font-medium">Handling & Bag Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-slate-400 dark:text-slate-400 text-xs font-medium">₹5</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xs">FREE</span>
                        </div>
                    </div>
                    
                    <!-- Grand Total To Pay -->
                    <div class="border-t border-glass-border pt-3.5 mt-2 flex justify-between items-center text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        <div>
                            <span>To Pay</span>
                            <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">100% Free Campus Delivery</p>
                        </div>
                        <span class="text-2xl text-emerald-600 dark:text-emerald-400 font-display font-black">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span class="material-symbols-outlined text-base">savings</span>
                    <span>🎉 Total Savings: ₹${totalSavings} applied!</span>
                </div>

                ${items.length > 0 ? `
                <a href="#/checkout" id="proceed-to-checkout-btn" class="w-full bg-emerald text-white rounded-full py-3.5 sm:py-4 font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-md active:scale-95">
                    Proceed to Checkout (₹${exactTotal})
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
                ` : `
                <button disabled class="w-full bg-surface-variant text-on-surface-variant rounded-full py-3.5 font-semibold text-xs sm:text-sm text-center cursor-not-allowed">
                    Cart is Empty
                </button>
                `}
            </div>
        </div>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/cart">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
                <span class="font-label-sm text-[11px] mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.cart = function() {
    const userId = window.getEffectiveUserId();

    async function reRenderCart() {
        if (window.router) {
            await window.router();
        } else {
            window.location.reload();
        }
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

    document.querySelectorAll('.qty-inc-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const currentQty = parseInt(btn.dataset.qty) || 1;
            await window.api.updateCartItem(id, currentQty + 1, userId);
            await reRenderCart();
        };
    });

    document.querySelectorAll('.qty-dec-btn').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.id;
            const currentQty = parseInt(btn.dataset.qty) || 1;
            if (currentQty <= 1) {
                await window.api.removeCartItem(id);
            } else {
                await window.api.updateCartItem(id, currentQty - 1, userId);
            }
            await reRenderCart();
        };
    });

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.onclick = async () => {
            const rows = document.querySelectorAll('.cart-row');
            for (const row of rows) {
                if (row.dataset.cartId) await window.api.removeCartItem(row.dataset.cartId);
            }
            await reRenderCart();
        };
    }
};

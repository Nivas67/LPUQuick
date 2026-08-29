// Cart Page — exact Stitch UI reproduction with transparent pricing breakdown
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.cart = async function() {
    let cartData;
    const userId = window.CURRENT_USER_ID || 'user_001';
    try { cartData = await window.api.getCart(userId); } catch(e) { cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0, free_delivery_remaining: 199 } }; }

    const items = cartData.items || [];
    const p = cartData.pricing || { subtotal: 0, delivery_fee: 0, platform_fee: 5, tax: 0, total: 0 };
    const subtotal = p.subtotal || 0;
    const netHandling = subtotal > 0 ? 5 : 0;
    const exactTotal = subtotal > 0 ? Math.round((subtotal + netHandling) * 100) / 100 : 0;
    const totalSavings = subtotal > 0 ? 30 : 0; // ₹25 delivery + ₹5 handling discount

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
    ` : items.map(item => `
        <div class="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 border border-glass-border shadow-sm mb-3 cart-row" data-cart-id="${item.cart_id}">
            <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img class="w-full h-full object-cover" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                </div>
                <div class="min-w-0">
                    <h4 class="font-label-lg font-semibold text-sm text-on-surface truncate">${item.name}</h4>
                    <p class="text-xs text-on-surface-variant mt-0.5">${item.size || item.unit}</p>
                    <p class="font-bold text-sm text-on-surface mt-1">₹${item.price}</p>
                </div>
            </div>
            <div class="flex items-center gap-2.5 bg-surface-container-high/80 rounded-full px-2.5 py-1 border border-outline-variant/30 flex-shrink-0">
                <button class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white active:scale-90 transition-all text-on-surface qty-dec-btn" data-id="${item.cart_id}" data-qty="${item.quantity}">
                    <span class="material-symbols-outlined text-base">remove</span>
                </button>
                <span class="font-bold text-xs w-4 text-center">${item.quantity}</span>
                <button class="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white active:scale-90 transition-all text-on-surface qty-inc-btn" data-id="${item.cart_id}" data-qty="${item.quantity}">
                    <span class="material-symbols-outlined text-base">add</span>
                </button>
            </div>
        </div>
    `).join('');

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
                    <!-- 1. Item Total -->
                    <div class="flex justify-between text-on-surface-variant">
                        <span>Item Total</span>
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
                            <span>To Pay</span>
                            <p class="text-[10px] text-on-surface-variant font-normal">₹${subtotal} items + ₹5 handling</p>
                        </div>
                        <span class="text-2xl text-emerald font-display font-black">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-3 bg-emerald/10 border border-emerald/20 rounded-xl flex items-center gap-2 text-xs text-emerald font-semibold">
                    <span class="material-symbols-outlined text-base">savings</span>
                    <span>🎉 Campus Offer Applied: You saved ₹${totalSavings} on delivery & handling!</span>
                </div>

                ${items.length > 0 ? `
                <a href="#/checkout" class="w-full bg-emerald text-white rounded-full py-3.5 sm:py-4 font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2 hover:bg-primary transition-all shadow-md active:scale-95">
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
    const userId = window.CURRENT_USER_ID || 'user_001';

    async function reRenderCart() {
        if (window.router) {
            await window.router();
        } else {
            window.location.reload();
        }
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

// Cart Page — Classical Campus Quick-Commerce Cart & Bill Summary
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
        <div class="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center my-6 shadow-xs">
            <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3 text-slate-400">
                <span class="material-symbols-outlined text-3xl">shopping_bag</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Your cart is empty</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-xs mx-auto">Add snacks, beverages, biscuits or study essentials to start your campus order.</p>
            <a href="#/" class="inline-flex items-center gap-1.5 bg-emerald text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-emerald-600 transition-colors">
                Browse Campus Store <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    ` : items.map(item => {
        const itemMrp = Number(item.mrp) || Number(item.price) || 0;
        const itemPrice = Number(item.price) || 0;
        const hasItemDiscount = itemMrp > itemPrice;
        const discPercent = hasItemDiscount ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100) : 0;
        const cachedProd = window.__cachedProducts?.get(item.product_id);
        const stockLeft = (item.stock_left !== undefined && item.stock_left !== null) 
            ? Number(item.stock_left) 
            : (cachedProd?.stock_left !== undefined && cachedProd?.stock_left !== null 
                ? Number(cachedProd.stock_left) 
                : (item.in_stock ? 50 : 0));
        const isMaxStockReached = item.quantity >= stockLeft;

        return `
        <div class="bg-surface border border-border rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs mb-2.5 cart-row" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}" data-stock-left="${stockLeft}">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-1 shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                    <img class="w-full h-full object-contain" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                </div>
                <div class="min-w-0">
                    <h4 class="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">${item.name}</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">${item.size || item.unit || '1 unit'}</p>
                    ${stockLeft > 0 && stockLeft <= 4 ? `
                    <p class="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        Only ${stockLeft} left
                    </p>
                    ` : ''}
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">₹${itemPrice}</span>
                        ${hasItemDiscount ? `
                        <span class="line-through text-slate-400 text-[11px]">₹${itemMrp}</span>
                        <span class="text-[9px] text-emerald font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1 py-0.5 rounded">${discPercent}% OFF</span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="card-qty-stepper flex items-center shrink-0">
                <button class="qty-dec-btn" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" title="Decrease quantity">
                    <span class="material-symbols-outlined text-sm">remove</span>
                </button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-inc-btn ${isMaxStockReached ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${item.cart_id}" data-product-id="${item.product_id}" data-qty="${item.quantity}" data-stock-left="${stockLeft}" title="${isMaxStockReached ? `Max stock limit (${stockLeft})` : 'Add one more'}" ${isMaxStockReached ? 'disabled' : ''}>
                    <span class="material-symbols-outlined text-sm">add</span>
                </button>
            </div>
        </div>
    `}).join('');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-40 border-b border-border shadow-xs">
        <div class="flex items-center gap-3">
            <a href="#/" class="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <div>
                <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Your Cart</h1>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">${cartData.item_count || 0} items · Delivering to ${window.currentAddress || 'BH13'} (3 mins)</p>
            </div>
        </div>
        ${items.length > 0 ? `
        <button class="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:opacity-80 p-1.5 cursor-pointer" id="clear-cart-btn">Clear All</button>
        ` : ''}
    </header>

    <main class="px-4 sm:px-6 max-w-5xl mx-auto pt-5 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <!-- Left: Cart Items -->
        <div class="lg:col-span-2 space-y-3">
            <!-- 5% Offer Status Banner -->
            ${hasDiscount ? `
            <div class="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>5% Campus Bulk Offer Applied (Above ₹350)</span>
                </div>
                <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">Extra ₹${discount5} OFF</span>
            </div>
            ` : subtotal > 0 ? `
            <div class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
                    <span class="material-symbols-outlined text-base">local_offer</span>
                    <span>Add ₹${350 - subtotal} more to get 5% FLAT OFF on your order</span>
                </div>
                <a href="#/" class="text-[11px] font-bold text-amber-700 dark:text-amber-400 underline">Add Items</a>
            </div>
            ` : ''}

            <!-- Free Delivery Promo Banner -->
            <div class="bg-slate-50 dark:bg-slate-800/60 border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <span class="material-symbols-outlined text-base text-emerald-600">electric_bolt</span>
                    <span>Free 3-Min Campus Room Delivery</span>
                </div>
                <span class="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Saved ₹25</span>
            </div>

            <!-- Items List -->
            <div>
                ${itemCards}
            </div>
        </div>

        <!-- Right: Order Summary Panel -->
        <div class="lg:col-span-1">
            <div class="bg-surface border border-border rounded-xl p-4 sm:p-5 sticky top-20 shadow-xs space-y-4">
                <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-border">
                    <span class="material-symbols-outlined text-base text-emerald">receipt</span>
                    Bill Details
                </h3>
                
                <div class="space-y-2.5 text-xs">
                    ${mrpDiscount > 0 ? `
                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Total MRP Value</span>
                        <span class="line-through text-slate-400">₹${totalMrp}</span>
                    </div>

                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>Product Discount</span>
                        <span>-₹${mrpDiscount}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>Item Subtotal</span>
                        <span class="font-bold text-slate-900 dark:text-white">₹${subtotal}</span>
                    </div>

                    ${hasDiscount ? `
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>5% Bulk Offer</span>
                        <span>-₹${discount5}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹25</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Handling & Bag</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹5</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-border pt-3 mt-2 flex justify-between items-center text-sm font-bold">
                        <div>
                            <span class="text-slate-900 dark:text-white">To Pay</span>
                            <p class="text-[10px] text-emerald font-medium">Free campus delivery included</p>
                        </div>
                        <span class="text-xl font-extrabold text-slate-900 dark:text-white">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Savings Banner -->
                <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    <span class="material-symbols-outlined text-base text-emerald">savings</span>
                    <span>Total Savings: ₹${totalSavings}</span>
                </div>

                ${window.__isUserBlocked ? `
                <div class="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 rounded-lg text-center space-y-1">
                    <p class="font-bold text-xs text-rose-700 dark:text-rose-400">Account Restricted</p>
                    <p class="text-[11px] text-slate-500">Contact BH13 Campus Hub for assistance.</p>
                </div>
                <button disabled class="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-lg py-3 font-semibold text-xs cursor-not-allowed">
                    Checkout Disabled
                </button>
                ` : (items.length > 0 ? `
                <a href="#/checkout" id="proceed-to-checkout-btn" class="w-full bg-emerald text-white rounded-lg py-3 font-semibold text-xs text-center flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors shadow-xs">
                    Proceed to Checkout (₹${exactTotal})
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
                ` : `
                <button disabled class="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg py-3 font-semibold text-xs text-center cursor-not-allowed">
                    Cart is Empty
                </button>
                `)}
            </div>
        </div>
    </main>

    <!-- Mobile Sticky Checkout Bar -->
    ${items.length > 0 && !window.__isUserBlocked ? `
    <div class="lg:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-border">
        <div class="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
                <span class="text-[11px] text-slate-500 dark:text-slate-400">${cartData.item_count || items.length} items</span>
                <p class="text-base font-bold text-slate-900 dark:text-white leading-none mt-0.5">₹${exactTotal}</p>
            </div>
            <a href="#/checkout" class="bg-emerald text-white px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-emerald-600 transition-colors shadow-xs">
                <span>Proceed to Checkout</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    </div>
    ` : ''}

    <!-- Bottom Navigation Bar -->
    <div class="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border shadow-xs sm:hidden">
        <nav class="flex justify-around items-center h-14 max-w-md mx-auto px-2">
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/" title="Home">
                <span class="material-symbols-outlined text-xl">home</span>
                <span class="text-[10px] font-medium mt-0.5">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/categories" title="Categories">
                <span class="material-symbols-outlined text-xl">category</span>
                <span class="text-[10px] font-medium mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-emerald dark:text-emerald-400 px-3 py-1 cursor-pointer font-bold relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-medium mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.cart = function() {
    const userId = window.getEffectiveUserId();

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

    function refreshCartBill() {
        if (window.router) {
            window.router();
        }
    }

    document.querySelectorAll('.qty-inc-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-row');
            const productId = btn.dataset.productId || row?.dataset?.productId;
            if (!productId) return;

            const cachedProd = window.__cachedProducts?.get(productId);
            const stockLeftAttr = btn.dataset.stockLeft || row?.dataset?.stockLeft;
            const stockLeft = (cachedProd?.stock_left !== undefined && cachedProd?.stock_left !== null)
                ? Number(cachedProd.stock_left)
                : (stockLeftAttr !== undefined && stockLeftAttr !== '' && stockLeftAttr !== null ? Number(stockLeftAttr) : 50);

            const qtyNum = row?.querySelector('.qty-num');
            const currentQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

            if (currentQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in stock!`, 'warning', 'inventory_2');
                }
                return;
            }

            const nextQty = currentQty + 1;
            if (qtyNum) qtyNum.textContent = nextQty;
            btn.dataset.qty = nextQty;
            const decBtn = row?.querySelector('.qty-dec-btn');
            if (decBtn) decBtn.dataset.qty = nextQty;

            if (nextQty >= stockLeft) {
                btn.classList.add('opacity-40', 'cursor-not-allowed');
                btn.setAttribute('title', `Max stock limit (${stockLeft})`);
                btn.disabled = true;
            }

            window.setOptimisticCartQuantity(productId, nextQty, stockLeft, () => {
                refreshCartBill();
            });
        };
    });

    document.querySelectorAll('.qty-dec-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const row = btn.closest('.cart-row');
            const productId = btn.dataset.productId || row?.dataset?.productId;
            if (!productId) return;

            const cachedProd = window.__cachedProducts?.get(productId);
            const stockLeftAttr = btn.dataset.stockLeft || row?.dataset?.stockLeft;
            const stockLeft = (cachedProd?.stock_left !== undefined && cachedProd?.stock_left !== null)
                ? Number(cachedProd.stock_left)
                : (stockLeftAttr !== undefined && stockLeftAttr !== '' && stockLeftAttr !== null ? Number(stockLeftAttr) : 50);

            const qtyNum = row?.querySelector('.qty-num');
            const currentQty = parseInt(qtyNum?.textContent || btn.dataset.qty) || 1;

            if (currentQty <= 1) {
                if (row) {
                    row.style.opacity = '0';
                    row.style.transform = 'scale(0.98)';
                    row.style.transition = 'all 0.15s ease-out';
                    setTimeout(() => {
                        row.remove();
                        refreshCartBill();
                    }, 150);
                }
                window.setOptimisticCartQuantity(productId, 0, stockLeft, () => {
                    refreshCartBill();
                });
            } else {
                const nextQty = currentQty - 1;
                if (qtyNum) qtyNum.textContent = nextQty;
                btn.dataset.qty = nextQty;
                const incBtn = row?.querySelector('.qty-inc-btn');
                if (incBtn) {
                    incBtn.dataset.qty = nextQty;
                    if (nextQty < stockLeft) {
                        incBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                        incBtn.setAttribute('title', 'Add one more');
                        incBtn.disabled = false;
                    }
                }

                window.setOptimisticCartQuantity(productId, nextQty, stockLeft, () => {
                    refreshCartBill();
                });
            }
        };
    });

    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
        clearBtn.onclick = async () => {
            const rows = document.querySelectorAll('.cart-row');
            rows.forEach(r => r.remove());
            refreshCartBill();
            for (const row of rows) {
                if (row.dataset.cartId) await window.api.removeCartItem(row.dataset.cartId);
            }
        };
    }
};

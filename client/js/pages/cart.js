// Cart Page — Complete Ground-Up Refreshing Redesign (Split-View Liquid Glass & Claymorphic Cart)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.cart = async function() {
    let cartData;
    const userId = window.getEffectiveUserId();
    try { 
        cartData = await window.api.getCart(userId); 
    } catch(e) { 
        cartData = { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0, free_delivery_remaining: 199 } }; 
    }

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
        <div class="glass-panel card-pedestal rounded-3xl p-8 sm:p-14 text-center my-6 shadow-2xl border border-[var(--glass-border)]">
            <div class="w-20 h-20 rounded-3xl clay-card text-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-xl relative overflow-hidden">
                <div class="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse pointer-events-none"></div>
                <span class="material-symbols-outlined text-4xl">shopping_bag</span>
            </div>
            <h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Your Cart is Empty</h3>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
                Add midnight snacks, cold energy drinks, Maggi, or study supplies from BH13 Campus Hub.
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
        const stockLeft = (item.stock_left !== undefined && item.stock_left !== null) 
            ? Number(item.stock_left) 
            : (cachedProd?.stock_left !== undefined && cachedProd?.stock_left !== null 
                ? Number(cachedProd.stock_left) 
                : (item.in_stock ? 50 : 0));
        const isMaxStockReached = item.quantity >= stockLeft;

        return `
        <div class="glass-panel card-pedestal rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3.5 shadow-md mb-3 border border-[var(--glass-border)] cart-row transition-all hover:translate-y-[-1px]" data-cart-id="${item.cart_id}" data-product-id="${item.product_id}" data-stock-left="${stockLeft}">
            <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/90 to-slate-100/90 dark:from-slate-800/90 dark:to-slate-900/90 p-2 shrink-0 flex items-center justify-center border border-[var(--glass-border)] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.8),inset_-1px_-1px_3px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <img class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
                </div>
                <div class="min-w-0">
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate tracking-tight">${item.name}</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">${item.size || item.unit || '1 unit'}</p>
                    ${stockLeft > 0 && stockLeft <= 4 ? `
                    <p class="text-[10px] font-black text-amber-500 mt-0.5 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        Only ${stockLeft} left in stock
                    </p>
                    ` : ''}
                    <div class="flex items-center gap-2 mt-1">
                        <span class="font-black text-sm text-slate-900 dark:text-white tracking-tight">₹${itemPrice}</span>
                        ${hasItemDiscount ? `
                        <span class="line-through text-slate-400 text-[11px]">₹${itemMrp}</span>
                        <span class="liquid-badge text-[9px] text-emerald-800 dark:text-emerald-300 font-black px-1.5 py-0.5">${discPercent}% OFF</span>
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
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95" title="Go Back">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Your Cart</h1>
                    <p class="text-[10px] sm:text-[11px] text-slate-500 font-semibold">${cartData.item_count || 0} items · Delivering to ${window.currentAddress || 'BH13'} (3 mins)</p>
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
            <!-- 5% Campus Bulk Banner -->
            ${hasDiscount ? `
            <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-emerald-500/30 bg-emerald-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <span class="material-symbols-outlined text-base">verified</span>
                    <span>5% Campus Bulk Offer Applied (Above ₹350)</span>
                </div>
                <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-300 liquid-badge px-2.5 py-0.5">Extra ₹${discount5} OFF</span>
            </div>
            ` : subtotal > 0 ? `
            <div class="glass-panel rounded-2xl p-3.5 flex items-center justify-between text-xs border border-amber-500/30 bg-amber-500/10 shadow-sm backdrop-blur-xl">
                <div class="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                    <span class="material-symbols-outlined text-base">local_offer</span>
                    <span>Add ₹${350 - subtotal} more to get 5% FLAT OFF on your order</span>
                </div>
                <a href="#/" class="text-[11px] font-black text-amber-700 dark:text-amber-400 underline">Add Items</a>
            </div>
            ` : ''}

            <!-- Free Delivery & Campus Shield Banner -->
            <div class="glass-panel card-pedestal rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xs border border-[var(--glass-border)]">
                <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                    <span class="material-symbols-outlined text-base text-emerald">electric_bolt</span>
                    <span>Free 3-Min Campus Room Delivery Guaranteed</span>
                </div>
                <span class="text-[11px] font-black text-emerald-700 dark:text-emerald-400 liquid-badge px-2 py-0.5">Saved ₹25</span>
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
                        <p class="text-[9px] text-slate-400">BH13 hostel door drop</p>
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

                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>Product Discount</span>
                        <span>-₹${mrpDiscount}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <span>Item Subtotal</span>
                        <span class="font-black text-slate-900 dark:text-white">₹${subtotal}</span>
                    </div>

                    ${hasDiscount ? `
                    <div class="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-bold">
                        <span>5% Bulk Offer</span>
                        <span>-₹${discount5}</span>
                    </div>
                    ` : ''}

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Delivery Fee</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹25</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-slate-600 dark:text-slate-400 font-medium">
                        <span>Handling & Bag</span>
                        <div class="flex items-center gap-1.5">
                            <span class="line-through text-[11px] text-slate-400">₹5</span>
                            <span class="font-black text-emerald-600 dark:text-emerald-400">FREE</span>
                        </div>
                    </div>
                    
                    <div class="border-t border-[var(--glass-border)] pt-3.5 mt-2 flex justify-between items-center text-sm font-black">
                        <div>
                            <span class="text-slate-900 dark:text-white tracking-tight">To Pay</span>
                            <p class="text-[10px] text-emerald font-bold">Free campus delivery included</p>
                        </div>
                        <span class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">₹${exactTotal}</span>
                    </div>
                </div>

                <!-- Total Savings Highlight Pill -->
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold backdrop-blur-md shadow-xs">
                    <span class="material-symbols-outlined text-base text-emerald">savings</span>
                    <span>Total Real Savings: ₹${totalSavings}</span>
                </div>

                ${window.__isUserBlocked ? `
                <div class="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-1">
                    <p class="font-black text-xs text-rose-600 dark:text-rose-400">Account Restricted</p>
                    <p class="text-[11px] text-slate-500">Contact BH13 Campus Hub for assistance.</p>
                </div>
                <button disabled class="w-full clay-card text-slate-400 rounded-2xl py-3.5 font-bold text-xs cursor-not-allowed">
                    Checkout Disabled
                </button>
                ` : (items.length > 0 ? `
                <a href="#/checkout" id="proceed-to-checkout-btn" class="clay-btn clay-btn-primary w-full py-4 rounded-2xl font-black text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-2xl tracking-wide uppercase active:scale-95 transition-transform">
                    <span>Proceed to Checkout (₹${exactTotal})</span>
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                </a>
                ` : `
                <button disabled class="w-full clay-card text-slate-400 rounded-2xl py-4 font-bold text-xs text-center cursor-not-allowed">
                    Cart is Empty
                </button>
                `)}
            </div>
        </div>
    </main>

    <!-- Mobile Sticky Checkout Capsule (Liquid Glass) -->
    ${items.length > 0 && !window.__isUserBlocked ? `
    <div class="lg:hidden fixed bottom-16 inset-x-3 z-30 pointer-events-none flex justify-center">
        <div class="pointer-events-auto liquid-dock-pill max-w-md w-full p-3.5 px-4 flex items-center justify-between gap-3 rounded-3xl shadow-2xl">
            <div>
                <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">${cartData.item_count || items.length} items</span>
                <p class="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">₹${exactTotal}</p>
            </div>
            <a href="#/checkout" class="clay-btn clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-transform">
                <span>Proceed</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    </div>
    ` : ''}

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
                    row.style.transform = 'scale(0.96)';
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

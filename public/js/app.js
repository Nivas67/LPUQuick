// LPUQuick SPA Router & Global Controller
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};
window.CURRENT_USER_ID = window.CURRENT_USER_ID || 'user_001';
window.cartState = window.cartState || {};

// Address state
window.currentAddress = localStorage.getItem('lpuquick_address') || 'BH2';
window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || 'Room 304, 3rd Floor, Boys Hostel 2';

// Theme state
if (localStorage.getItem('lpuquick_theme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
}

const routes = {
    '/': 'home',
    '/signin': 'signin',
    '/categories': 'categories',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/flow-assist': 'flowassist',
    '/orders': 'orders',
    '/settings': 'settings'
};

function navigate(path) {
    window.location.hash = '#' + path;
}

function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
}

function getPageName(path) {
    return routes[path] || 'home';
}

// Global Address Selection Modal
window.openAddressModal = function() {
    const existing = document.getElementById('address-modal');
    if (existing) existing.remove();

    const hostels = ['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'BH6', 'GH1', 'GH2', 'GH3', 'GH4', 'UniMall', 'Main Gate'];

    const modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content p-6 space-y-5" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center pb-3 border-b border-surface-variant/40">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald text-2xl">location_on</span>
                    <div>
                        <h3 class="font-bold text-base text-on-surface">Select Delivery Location</h3>
                        <p class="text-xs text-on-surface-variant">LPU Campus Express Delivery (7 mins)</p>
                    </div>
                </div>
                <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface" onclick="document.getElementById('address-modal').remove()">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-3">
                <label class="block text-xs font-semibold text-on-surface-variant">Choose Hostel / Building</label>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    ${hostels.map(h => `
                        <button type="button" class="py-2 px-2.5 rounded-xl border text-xs font-bold transition-all hostel-btn ${h === window.currentAddress ? 'border-emerald bg-emerald/10 text-emerald' : 'border-surface-variant/60 bg-surface hover:border-emerald'}" data-hostel="${h}">
                            ${h}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface-variant">Room / Flat / Landmark</label>
                <input type="text" id="address-room-input" class="w-full px-4 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface focus:outline-none focus:border-emerald" placeholder="e.g. Room 304, 3rd Floor" value="${window.currentAddressDetail}">
            </div>

            <button type="button" id="save-address-btn" class="w-full bg-emerald text-white rounded-full py-3 text-xs font-semibold shadow-md hover:bg-primary transition-all">
                Deliver Here
            </button>
        </div>
    `;

    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    let selectedHostel = window.currentAddress;
    modal.querySelectorAll('.hostel-btn').forEach(btn => {
        btn.onclick = () => {
            modal.querySelectorAll('.hostel-btn').forEach(b => {
                b.classList.remove('border-emerald', 'bg-emerald/10', 'text-emerald');
                b.classList.add('border-surface-variant/60', 'bg-surface');
            });
            btn.classList.remove('border-surface-variant/60', 'bg-surface');
            btn.classList.add('border-emerald', 'bg-emerald/10', 'text-emerald');
            selectedHostel = btn.dataset.hostel;
        };
    });

    document.getElementById('save-address-btn').onclick = () => {
        const room = document.getElementById('address-room-input').value.trim() || 'Room 304';
        window.currentAddress = selectedHostel;
        window.currentAddressDetail = `${room}, ${selectedHostel}`;
        localStorage.setItem('lpuquick_address', window.currentAddress);
        localStorage.setItem('lpuquick_address_detail', window.currentAddressDetail);
        modal.remove();
        router(); // Refresh header
    };
};

// Global Product Details Modal
window.openProductModal = async function(productId) {
    const existing = document.getElementById('product-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content p-6 flex items-center justify-center min-h-[300px]" onclick="event.stopPropagation()">
            <span class="material-symbols-outlined text-emerald text-3xl animate-spin">progress_activity</span>
        </div>
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    try {
        const p = await window.api.getProduct(productId);
        const cartInfo = window.cartState[p.id];
        const qty = cartInfo ? cartInfo.quantity : 0;

        modal.innerHTML = `
            <div class="modal-content p-6 space-y-5" onclick="event.stopPropagation()">
                <!-- Modal Top -->
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 px-2.5 py-0.5 rounded-full">
                        ${p.category} · ${p.subcategory || 'Essential'}
                    </span>
                    <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface" onclick="document.getElementById('product-modal').remove()">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <!-- Product Image Banner -->
                <div class="h-48 bg-surface-container-high rounded-2xl overflow-hidden flex items-center justify-center p-4 relative">
                    <img class="max-h-full max-w-full object-contain" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'">
                    ${p.discount_percent > 0 ? `
                    <div class="absolute top-3 left-3 bg-vibrant-yellow text-on-surface font-bold text-[11px] px-2.5 py-0.5 rounded-md shadow-sm">
                        ${p.discount_percent}% OFF
                    </div>
                    ` : ''}
                </div>

                <!-- Title & Price -->
                <div class="space-y-1">
                    <h2 class="font-headline-md text-lg font-bold text-on-surface">${p.name}</h2>
                    <p class="text-xs text-on-surface-variant font-medium">${p.size || p.unit}</p>
                    <div class="flex items-baseline gap-2 pt-1">
                        <span class="text-2xl font-bold text-emerald">₹${p.price}</span>
                        ${p.mrp > p.price ? `<span class="text-xs text-on-surface-variant line-through">₹${p.mrp}</span>` : ''}
                    </div>
                </div>

                <!-- Highlights & Description -->
                <div class="space-y-3 border-t border-surface-variant/40 pt-3 text-xs">
                    <p class="text-on-surface-variant leading-relaxed">${p.description}</p>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Shelf Life</span>
                            <span class="font-semibold text-on-surface">${p.shelf_life}</span>
                        </div>
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Campus Delivery</span>
                            <span class="font-semibold text-emerald">${p.delivery_eta}</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button inside Modal -->
                <div class="pt-2" id="modal-action-container">
                    ${qty === 0 ? `
                    <button type="button" class="w-full bg-emerald text-white rounded-full py-3 text-xs font-semibold shadow-md hover:bg-primary transition-all flex items-center justify-center gap-1.5" id="modal-add-btn">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart · ₹${p.price}
                    </button>
                    ` : `
                    <div class="flex items-center justify-between bg-surface-container-high rounded-full p-1.5 px-4 border border-outline-variant/30">
                        <span class="text-xs font-semibold text-on-surface">Quantity in Cart:</span>
                        <div class="flex items-center gap-3">
                            <button type="button" class="w-7 h-7 rounded-full bg-white dark:bg-surface flex items-center justify-center text-on-surface shadow-sm" id="modal-dec-btn">
                                <span class="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span class="font-bold text-xs w-4 text-center">${qty}</span>
                            <button type="button" class="w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center shadow-sm" id="modal-inc-btn">
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>
                    `}
                </div>
            </div>
        `;

        // Bind Modal Action Buttons
        const modalAddBtn = document.getElementById('modal-add-btn');
        if (modalAddBtn) {
            modalAddBtn.onclick = async () => {
                await window.api.addToCart(window.CURRENT_USER_ID, p.id, 1);
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
        const modalIncBtn = document.getElementById('modal-inc-btn');
        if (modalIncBtn) {
            modalIncBtn.onclick = async () => {
                const item = window.cartState[p.id];
                if (item) await window.api.updateCartItem(item.cart_id, item.quantity + 1, window.CURRENT_USER_ID);
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
        const modalDecBtn = document.getElementById('modal-dec-btn');
        if (modalDecBtn) {
            modalDecBtn.onclick = async () => {
                const item = window.cartState[p.id];
                if (item) {
                    if (item.quantity <= 1) await window.api.removeCartItem(item.cart_id);
                    else await window.api.updateCartItem(item.cart_id, item.quantity - 1, window.CURRENT_USER_ID);
                }
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
    } catch(e) {
        modal.innerHTML = `
            <div class="modal-content p-6 text-center space-y-3">
                <p class="text-error text-xs">Could not load product details.</p>
                <button type="button" class="bg-surface-container-high text-xs px-4 py-1.5 rounded-full" onclick="document.getElementById('product-modal').remove()">Close</button>
            </div>
        `;
    }
};

// Global Card Stepper Synchronizer (Turns Add button into [- qty +])
window.syncCardSteppers = function() {
    document.querySelectorAll('.product-action-slot').forEach(slot => {
        const productId = slot.dataset.id;
        const cartInfo = window.cartState[productId];
        const qty = cartInfo ? cartInfo.quantity : 0;

        if (qty > 0) {
            slot.innerHTML = `
                <div class="card-qty-stepper">
                    <button type="button" class="card-qty-btn card-dec-btn" data-id="${productId}">
                        <span class="material-symbols-outlined text-[13px]">remove</span>
                    </button>
                    <span class="card-qty-val">${qty}</span>
                    <button type="button" class="card-qty-btn card-inc-btn" data-id="${productId}">
                        <span class="material-symbols-outlined text-[13px]">add</span>
                    </button>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <button type="button" class="bg-emerald text-white rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all add-to-cart-btn" data-id="${productId}">Add</button>
            `;
        }
    });

    // Rebind newly created buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await window.api.addToCart(window.CURRENT_USER_ID, id, 1);
            window.syncCardSteppers();
        };
    });

    document.querySelectorAll('.card-inc-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = window.cartState[id];
            if (item) {
                await window.api.updateCartItem(item.cart_id, item.quantity + 1, window.CURRENT_USER_ID);
                window.syncCardSteppers();
            }
        };
    });

    document.querySelectorAll('.card-dec-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const item = window.cartState[id];
            if (item) {
                if (item.quantity <= 1) {
                    await window.api.removeCartItem(item.cart_id);
                } else {
                    await window.api.updateCartItem(item.cart_id, item.quantity - 1, window.CURRENT_USER_ID);
                }
                window.syncCardSteppers();
            }
        };
    });

    // Product card click to open details modal
    document.querySelectorAll('.product-detail-trigger').forEach(el => {
        el.onclick = (e) => {
            if (e.target.closest('.product-action-slot')) return;
            const id = el.dataset.productId;
            if (id) window.openProductModal(id);
        };
    });
};

// Router Main Function
async function router() {
    const path = getCurrentRoute();
    const pageName = getPageName(path);
    const appRoot = document.getElementById('app');
    
    if (!appRoot) return;

    try {
        // Pre-fetch cart so steppers have exact state immediately
        await window.api.getCart(window.CURRENT_USER_ID);

        const renderFn = window.pages[pageName];
        if (renderFn) {
            const html = await renderFn();
            appRoot.innerHTML = html;
            appRoot.classList.add('page-enter');
            setTimeout(() => appRoot.classList.remove('page-enter'), 200);

            // Initialize page-specific JS
            const initFn = window.pageInits[pageName];
            if (initFn) initFn();

            // Synchronize steppers
            window.syncCardSteppers();

            // Bind global address modal trigger
            document.querySelectorAll('.address-selector-trigger').forEach(el => {
                el.onclick = (e) => {
                    e.preventDefault();
                    window.openAddressModal();
                };
            });

            window.scrollTo(0, 0);
        } else {
            appRoot.innerHTML = `
                <div class="text-center pt-32 px-4">
                    <h1 class="font-headline-md text-xl font-bold text-on-surface">Page not found</h1>
                    <a href="#/" class="mt-4 inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
                </div>
            `;
        }
    } catch (err) {
        console.error('Router error:', err);
    }
}

window.router = router;
window.navigate = navigate;

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    router();
}

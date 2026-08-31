// LPUQuick SPA Router & Global Controller
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

// 1-Hour Inactivity Session Management (3,600,000 ms = 1 Hour)
const SESSION_INACTIVITY_LIMIT_MS = 60 * 60 * 1000; // 1 hour

window.refreshUserActivity = function() {
    if (window.isUserLoggedIn()) {
        try {
            localStorage.setItem('lpuquick_last_active', Date.now().toString());
        } catch(e) {}
    }
};

window.logoutUser = function() {
    try {
        localStorage.removeItem('lpuquick_user');
        localStorage.removeItem('lpuquick_last_active');
        localStorage.removeItem('lpuquick_address_configured');
        localStorage.removeItem('lpuquick_room');
        localStorage.removeItem('lpuquick_phone');
        localStorage.removeItem('lpuquick_address_detail');
    } catch(e) {}
    window.CURRENT_USER_ID = null;
    window.CURRENT_USER_NAME = null;
    window.CURRENT_USER_EMAIL = null;
    window.CURRENT_USER_PICTURE = null;
    window.currentRoom = '';
    window.currentAddressDetail = '';
    window.location.hash = '#/signin';
};

// Initialize User Session from localStorage with 1-Hour Inactivity Guard
(function initUserSession() {
    try {
        const savedUserStr = localStorage.getItem('lpuquick_user');
        const lastActiveStr = localStorage.getItem('lpuquick_last_active');
        
        if (savedUserStr) {
            const lastActive = Number(lastActiveStr) || 0;
            const now = Date.now();
            const elapsed = now - lastActive;

            // ONLY expire if user was inactive for more than 1 hour (3600000ms)
            if (lastActive > 0 && elapsed > SESSION_INACTIVITY_LIMIT_MS) {
                console.log(`[Auth] Session expired due to 1 hour of inactivity (${Math.round(elapsed / 60000)} mins inactive)`);
                localStorage.removeItem('lpuquick_user');
                localStorage.removeItem('lpuquick_last_active');
                window.CURRENT_USER_ID = null;
                window.CURRENT_USER_NAME = null;
                window.CURRENT_USER_EMAIL = null;
                window.CURRENT_USER_PICTURE = null;
                return;
            }

            const savedUser = JSON.parse(savedUserStr);
            const uid = savedUser?.id || savedUser?.user_id || savedUser?.uid;
            if (uid) {
                // Session is VALID & ACTIVE - Keep logged in on reload!
                window.CURRENT_USER_ID = uid;
                window.CURRENT_USER_NAME = savedUser.name || 'LPU Student';
                window.CURRENT_USER_EMAIL = savedUser.email || '';
                window.CURRENT_USER_PICTURE = savedUser.picture || '';
                window.currentRoom = localStorage.getItem('lpuquick_room') || '';
                window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || '';
                localStorage.setItem('lpuquick_last_active', now.toString());
            }
        }
    } catch (e) {
        console.warn('[Auth Init Error]:', e);
    }
})();

// Attach throttled global user activity listeners to continuously refresh the 1-hour session
let lastActivityTouch = 0;
function handleUserInteraction() {
    const now = Date.now();
    if (now - lastActivityTouch > 15000) { // Throttle writes to localStorage to once every 15s
        lastActivityTouch = now;
        window.refreshUserActivity();
    }
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
        window.addEventListener(evt, handleUserInteraction, { passive: true });
    });
}

window.isUserLoggedIn = function() {
    if (Boolean(window.CURRENT_USER_ID)) return true;
    try {
        const savedUserStr = localStorage.getItem('lpuquick_user');
        if (!savedUserStr) return false;
        const lastActive = Number(localStorage.getItem('lpuquick_last_active')) || 0;
        if (lastActive > 0 && (Date.now() - lastActive) > SESSION_INACTIVITY_LIMIT_MS) return false;
        const savedUser = JSON.parse(savedUserStr);
        const uid = savedUser?.id || savedUser?.user_id || savedUser?.uid;
        if (uid) {
            window.CURRENT_USER_ID = uid;
            window.CURRENT_USER_NAME = savedUser.name || 'LPU Student';
            window.CURRENT_USER_EMAIL = savedUser.email || '';
            window.CURRENT_USER_PICTURE = savedUser.picture || '';
            return true;
        }
    } catch(e) {}
    return false;
};

window.getEffectiveUserId = function() {
    if (window.isUserLoggedIn()) return window.CURRENT_USER_ID;
    let guestId = localStorage.getItem('lpuquick_guest_cart_id');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('lpuquick_guest_cart_id', guestId);
    }
    return guestId;
};

window.cartState = window.cartState || {};

// Address state (Unconfigured until user signs in and sets room)
window.currentAddress = localStorage.getItem('lpuquick_address') || 'BH13';
window.currentBlock = localStorage.getItem('lpuquick_block') || 'Block A';
window.currentRoom = localStorage.getItem('lpuquick_room') || '';
window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || '';

// Theme state & global theme toggle manager
window.toggleTheme = function() {
    const isCurrentlyDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
    const newTheme = isCurrentlyDark ? 'light' : 'dark';
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('lpuquick_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('lpuquick_theme', 'light');
    }
    window.syncAllThemeToggles();
};

window.syncAllThemeToggles = function() {
    const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
    document.querySelectorAll('.theme-toggle-switch').forEach(toggle => {
        toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
        toggle.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        const thumb = toggle.querySelector('.theme-toggle-thumb');
        const sunIcon = toggle.querySelector('.theme-sun-icon');
        const moonIcon = toggle.querySelector('.theme-moon-icon');
        const isMobile = toggle.classList.contains('w-[54px]');
        const translateDist = isMobile ? '26px' : '30px';

        if (thumb) {
            thumb.style.transform = isDark ? `translateX(${translateDist})` : 'translateX(0px)';
        }
        if (sunIcon && moonIcon) {
            if (isDark) {
                sunIcon.classList.add('opacity-40', 'text-slate-400');
                sunIcon.classList.remove('opacity-100', 'text-slate-800');
                moonIcon.classList.add('opacity-100', 'text-slate-100');
                moonIcon.classList.remove('opacity-40', 'text-slate-400');
            } else {
                sunIcon.classList.add('opacity-100', 'text-slate-800');
                sunIcon.classList.remove('opacity-40', 'text-slate-400');
                moonIcon.classList.add('opacity-40', 'text-slate-400');
                moonIcon.classList.remove('opacity-100', 'text-slate-100');
            }
        }
    });

    const settingsToggle = document.getElementById('toggle-darkmode');
    if (settingsToggle) {
        settingsToggle.checked = isDark;
    }
};

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
    const cleanPath = (path || '/').startsWith('#') ? (path || '/').slice(1) : (path || '/');
    const targetHash = '#' + (cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath);
    if (window.location.hash === targetHash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof router === 'function') router();
    } else {
        window.location.hash = targetHash;
    }
}
window.navigate = navigate;

function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
}

function getPageName(path) {
    return routes[path] || 'home';
}

// Address Configuration State Helper
window.hasUserConfiguredAddress = function() {
    const isConfigured = localStorage.getItem('lpuquick_address_configured') === 'true';
    const room = (localStorage.getItem('lpuquick_room') || '').replace(/\D/g, '');
    const phone = (localStorage.getItem('lpuquick_phone') || '').replace(/\D/g, '');
    return isConfigured && room.length > 0 && phone.length === 10;
};

// Global Address Selection Modal (BH13 Express Live, BH1-BH12 Coming Soon, Block A/B, Room No, Phone)
window.openAddressModal = function(isMandatorySetup = false, onComplete = null) {
    const existing = document.getElementById('address-modal');
    if (existing) existing.remove();

    // Hostels 1 to 13 + GHs + UniMall + Main Gate
    const allLocations = [
        { name: 'BH13', active: true, tag: 'Live 3m' },
        { name: 'BH1', active: false, tag: 'Coming Soon' },
        { name: 'BH2', active: false, tag: 'Coming Soon' },
        { name: 'BH3', active: false, tag: 'Coming Soon' },
        { name: 'BH4', active: false, tag: 'Coming Soon' },
        { name: 'BH5', active: false, tag: 'Coming Soon' },
        { name: 'BH6', active: false, tag: 'Coming Soon' },
        { name: 'BH7', active: false, tag: 'Coming Soon' },
        { name: 'BH8', active: false, tag: 'Coming Soon' },
        { name: 'BH9', active: false, tag: 'Coming Soon' },
        { name: 'BH10', active: false, tag: 'Coming Soon' },
        { name: 'BH11', active: false, tag: 'Coming Soon' },
        { name: 'BH12', active: false, tag: 'Coming Soon' },
        { name: 'GH1', active: false, tag: 'Coming Soon' },
        { name: 'GH2', active: false, tag: 'Coming Soon' },
        { name: 'GH3', active: false, tag: 'Coming Soon' },
        { name: 'GH4', active: false, tag: 'Coming Soon' },
        { name: 'UniMall', active: false, tag: 'Coming Soon' },
        { name: 'Main Gate', active: false, tag: 'Coming Soon' }
    ];

    let selectedHostel = 'BH13';
    let selectedBlock = window.currentBlock || localStorage.getItem('lpuquick_block') || 'Block A';
    const savedRoom = window.currentRoom || localStorage.getItem('lpuquick_room') || '';
    const savedFloor = localStorage.getItem('lpuquick_floor') || '';
    let savedPhone = localStorage.getItem('lpuquick_phone') || '';
    if (savedPhone === '7671836211' || savedPhone === '9877982857') savedPhone = '';

    const modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-surface-variant/40">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center">
                        <span class="material-symbols-outlined text-xl">location_on</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">${isMandatorySetup ? 'Delivery Address Required' : 'Select Delivery Location'}</h3>
                        <p class="text-[11px] text-on-surface-variant">LPU Campus Express Delivery (3 mins)</p>
                    </div>
                </div>
                ${isMandatorySetup ? `
                <span class="text-[10px] bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-bold">Step 2: Room Info</span>
                ` : `
                <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface" onclick="document.getElementById('address-modal').remove()">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
                `}
            </div>

            <!-- Notice Banner -->
            <div class="p-3 bg-emerald/10 border border-emerald/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald font-medium">
                <span class="material-symbols-outlined text-base">bolt</span>
                <span>Express 3-min delivery is exclusively live at <strong>BH13</strong>! Food delivered straight to your room.</span>
            </div>

            <!-- Hostel Selector Grid -->
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <label class="block text-xs font-semibold text-on-surface-variant">Choose Hostel / Building</label>
                    <span class="text-[10px] text-emerald font-bold">BH13 Active</span>
                </div>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 no-scrollbar" id="hostels-container">
                    ${allLocations.map(h => {
                        const isSelected = h.name === selectedHostel;
                        if (h.active) {
                            return `
                            <button type="button" class="p-2 rounded-2xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 hostel-pick-btn ${isSelected ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface hover:border-emerald text-on-surface'}" data-hostel="${h.name}">
                                <span>${h.name}</span>
                                <span class="bg-emerald text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">Live ⚡</span>
                            </button>
                            `;
                        } else {
                            return `
                            <button type="button" class="p-2 rounded-2xl border border-surface-variant/40 bg-surface/50 text-on-surface-variant/70 text-xs font-medium transition-all relative flex flex-col items-center justify-center gap-0.5 hostel-disabled-btn cursor-not-allowed opacity-60" data-hostel="${h.name}">
                                <span>${h.name}</span>
                                <span class="text-[8px] bg-surface-container-high px-1 py-0.2 rounded text-on-surface-variant font-medium">Soon</span>
                            </button>
                            `;
                        }
                    }).join('')}
                </div>
            </div>

            <!-- Block Selector (Block A or Block B) -->
            <div class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface-variant">Select Block</label>
                <div class="grid grid-cols-2 gap-2.5" id="block-selector">
                    <button type="button" class="py-2.5 px-4 rounded-xl border text-xs font-bold transition-all block-btn flex items-center justify-center gap-1.5 ${selectedBlock === 'Block A' ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface text-on-surface'}" data-block="Block A">
                        <span class="material-symbols-outlined text-sm">apartment</span>
                        Block A
                    </button>
                    <button type="button" class="py-2.5 px-4 rounded-xl border text-xs font-bold transition-all block-btn flex items-center justify-center gap-1.5 ${selectedBlock === 'Block B' ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface text-on-surface'}" data-block="Block B">
                        <span class="material-symbols-outlined text-sm">apartment</span>
                        Block B
                    </button>
                </div>
            </div>

            <!-- Room Number Input (Strictly Numeric) -->
            <div class="space-y-1">
                <label class="block text-xs font-semibold text-on-surface-variant" for="room-input">Room Number (Digits only) *</label>
                <div class="relative">
                    <input type="tel" inputmode="numeric" pattern="[0-9]*" id="room-input" required class="w-full px-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="e.g. 304" value="${savedRoom.replace(/\D/g, '')}">
                </div>
            </div>

            <!-- Contact Phone Number (Mandatory for Delivery Runner) -->
            <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-on-surface-variant" for="phone-input">Contact Phone Number (For delivery runner) *</label>
                <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">+91</span>
                    <input type="tel" inputmode="numeric" pattern="[0-9]*" id="phone-input" maxlength="10" required class="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="XXXXXXXXXX" value="${savedPhone.replace(/\D/g, '')}">
                </div>
                <p class="text-[10px] text-on-surface-variant/70">10-digit mobile number required so delivery runner can contact you upon arrival.</p>
            </div>

            <!-- Inline Validation Alert -->
            <div id="address-validation-alert" class="hidden p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">error</span>
                <span id="address-validation-msg">Please enter your room number.</span>
            </div>

            <!-- Inline Alert for Blocked Hostels (Initially hidden) -->
            <div id="blocked-hostel-alert" class="hidden p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">info</span>
                <span id="blocked-hostel-msg">This hostel is opening soon. Delivering to BH13 right now.</span>
            </div>

            <!-- Save Button -->
            <button type="button" id="save-address-btn" class="w-full bg-emerald text-white rounded-full py-3.5 text-xs sm:text-sm font-semibold shadow-md hover:bg-primary transition-all active:scale-95 cursor-pointer">
                Confirm Address & Deliver to BH13 (<span id="btn-block-label">${selectedBlock}</span>)
            </button>
        </div>
    `;

    if (!isMandatorySetup) {
        modal.onclick = () => modal.remove();
    }
    document.body.appendChild(modal);

    // Enforce strictly numeric input in real-time
    const roomInput = modal.querySelector('#room-input');
    if (roomInput) {
        roomInput.oninput = () => {
            roomInput.value = roomInput.value.replace(/\D/g, '');
        };
    }

    const phoneInput = modal.querySelector('#phone-input');
    if (phoneInput) {
        phoneInput.oninput = () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '');
        };
    }

    // Block selection handler
    modal.querySelectorAll('.block-btn').forEach(btn => {
        btn.onclick = () => {
            modal.querySelectorAll('.block-btn').forEach(b => {
                b.classList.remove('border-2', 'border-emerald', 'bg-emerald/10', 'text-emerald', 'shadow-sm');
                b.classList.add('border-surface-variant', 'bg-surface', 'text-on-surface');
            });
            btn.classList.remove('border-surface-variant', 'bg-surface', 'text-on-surface');
            btn.classList.add('border-2', 'border-emerald', 'bg-emerald/10', 'text-emerald', 'shadow-sm');
            selectedBlock = btn.dataset.block;
            const label = document.getElementById('btn-block-label');
            if (label) label.textContent = selectedBlock;
        };
    });

    // Disabled hostels click handler
    modal.querySelectorAll('.hostel-disabled-btn').forEach(btn => {
        btn.onclick = () => {
            const hName = btn.dataset.hostel;
            const alertBox = document.getElementById('blocked-hostel-alert');
            const alertMsg = document.getElementById('blocked-hostel-msg');
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = `${hName} is opening next week! Delivering to BH13 for now.`;
            }
        };
    });

    // Helper to finalize address saving
    function finalizeAddressSave(room, phone) {
        window.currentAddress = 'BH13';
        window.currentBlock = selectedBlock;
        window.currentRoom = room;
        window.currentAddressDetail = `BH13 (${selectedBlock}), Room ${room}`;

        localStorage.setItem('lpuquick_address', window.currentAddress);
        localStorage.setItem('lpuquick_block', window.currentBlock);
        localStorage.setItem('lpuquick_room', window.currentRoom);
        if (phone) {
            localStorage.setItem('lpuquick_phone', phone);
        }
        localStorage.setItem('lpuquick_address_configured', 'true');
        localStorage.setItem('lpuquick_address_detail', window.currentAddressDetail);

        // Sync with backend profile
        if (window.isUserLoggedIn() && window.api?.updateAddress) {
            window.api.updateAddress(window.CURRENT_USER_ID, 'BH13', selectedBlock, room, phone);
        }

        modal.remove();

        if (typeof window.showClientToast === 'function') {
            window.showClientToast('✓ Delivery address & contact number saved!', 'success', 'check_circle');
        }

        if (typeof onComplete === 'function') {
            onComplete();
        } else {
            router();
        }
    }

    // Save Address button on Main Form
    const saveAddressBtn = modal.querySelector('#save-address-btn');
    if (saveAddressBtn) {
        saveAddressBtn.onclick = async () => {
            const room = modal.querySelector('#room-input')?.value?.trim();
            const phone = modal.querySelector('#phone-input')?.value?.trim();
            const alertBox = modal.querySelector('#address-validation-alert');
            const alertMsg = modal.querySelector('#address-validation-msg');

            const cleanRoom = (room || '').replace(/\D/g, '');
            if (!cleanRoom) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Please enter a valid numeric Room Number (e.g. 304).';
                }
                modal.querySelector('#room-input')?.focus();
                return;
            }

            const cleanPhone = (phone || '').replace(/\D/g, '');
            if (!cleanPhone || cleanPhone.length !== 10) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Please enter a valid 10-digit mobile number (e.g. 9876543210).';
                }
                modal.querySelector('#phone-input')?.focus();
                return;
            }

            if (alertBox) alertBox.classList.add('hidden');

            // Finalize address and phone saving directly
            finalizeAddressSave(cleanRoom, cleanPhone);
        };
    }
};

// Global Product Details Modal
window.openProductModal = async function(productId) {
    if (!productId) return;
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
        const res = await window.api.getProduct(productId);
        const p = (res && res.product) ? res.product : (res && res.id ? res : (window.__cachedProducts && window.__cachedProducts.get(productId)) || {});
        
        const pid = p.id || productId;
        const pName = p.name || 'Campus Essential';
        const pCategory = p.category || 'Snacks & Drinks';
        const pSubcategory = p.subcategory || 'Hostel Favorite';
        const pImg = p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
        const pPrice = Number(p.price) || 0;
        const pMrp = Number(p.mrp) || pPrice;
        const pDiscount = p.discount_percent || (pMrp > pPrice ? Math.round(((pMrp - pPrice) / pMrp) * 100) : 0);
        const pSize = p.size || p.unit || '1 Pack';
        const pDesc = p.description || `${pName} is available for express 3-minute delivery right to your hostel room.`;
        const pShelfLife = p.shelf_life || '12 Months';
        const stockLeft = p.stock_left !== undefined && p.stock_left !== null ? Number(p.stock_left) : (p.in_stock !== false ? 50 : 0);
        const isOutOfStock = p.in_stock === false || stockLeft <= 0;
        const isLowStock = !isOutOfStock && stockLeft <= 4;

        const cartInfo = window.cartState ? window.cartState[pid] : null;
        const qty = cartInfo ? cartInfo.quantity : 0;

        modal.innerHTML = `
            <div class="modal-content p-6 space-y-5" onclick="event.stopPropagation()">
                <!-- Modal Top -->
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 px-2.5 py-0.5 rounded-full">
                        ${pCategory} · ${pSubcategory}
                    </span>
                    <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-colors" onclick="document.getElementById('product-modal').remove()">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <!-- Product Image Banner -->
                <div class="h-48 bg-surface-container-high rounded-2xl overflow-hidden flex items-center justify-center p-4 relative">
                    <img class="max-h-full max-w-full object-contain" src="${pImg}" alt="${pName}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'">
                    ${pDiscount > 0 ? `
                    <div class="absolute top-3 left-3 bg-vibrant-yellow text-slate-900 font-bold text-[11px] px-2.5 py-0.5 rounded-md shadow-sm">
                        ${pDiscount}% OFF
                    </div>
                    ` : ''}
                    ${isLowStock ? `
                    <div class="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">bolt</span> Only ${stockLeft} left!
                    </div>
                    ` : (isOutOfStock ? `
                    <div class="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                        Out of Stock
                    </div>
                    ` : '')}
                </div>

                <!-- Title & Price -->
                <div class="space-y-1">
                    <h2 class="font-headline-md text-lg font-bold text-on-surface">${pName}</h2>
                    <p class="text-xs text-on-surface-variant font-medium">${pSize}</p>
                    <div class="flex items-baseline gap-2 pt-1">
                        <span class="text-2xl font-bold text-emerald">₹${pPrice}</span>
                        ${pMrp > pPrice ? `<span class="text-xs text-on-surface-variant line-through">₹${pMrp}</span>` : ''}
                    </div>
                </div>

                <!-- Highlights & Description -->
                <div class="space-y-3 border-t border-surface-variant/40 pt-3 text-xs">
                    <p class="text-on-surface-variant leading-relaxed">${pDesc}</p>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Shelf Life</span>
                            <span class="font-semibold text-on-surface">${pShelfLife}</span>
                        </div>
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Campus Delivery</span>
                            <span class="font-semibold text-emerald">3 mins to BH13</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button inside Modal -->
                <div class="pt-2" id="modal-action-container">
                    ${isOutOfStock ? `
                    <button type="button" class="w-full bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full py-3 text-xs font-bold shadow-none cursor-not-allowed flex items-center justify-center gap-1.5" disabled>
                        <span class="material-symbols-outlined text-sm">block</span> Out of Stock
                    </button>
                    ` : (qty === 0 ? `
                    <button type="button" class="w-full bg-emerald text-white rounded-full py-3 text-xs font-semibold shadow-md hover:bg-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer" id="modal-add-btn">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart · ₹${pPrice}
                    </button>
                    ` : `
                    <div class="flex items-center justify-between bg-surface-container-high rounded-full p-1.5 px-4 border border-outline-variant/30">
                        <span class="text-xs font-semibold text-on-surface">Quantity in Cart:</span>
                        <div class="flex items-center gap-3">
                            <button type="button" class="w-7 h-7 rounded-full bg-white dark:bg-surface flex items-center justify-center text-on-surface shadow-sm cursor-pointer" id="modal-dec-btn">
                                <span class="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span class="font-bold text-xs w-4 text-center">${qty}</span>
                            <button type="button" class="w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center shadow-sm cursor-pointer ${qty >= stockLeft ? 'opacity-40 cursor-not-allowed' : ''}" id="modal-inc-btn" ${qty >= stockLeft ? 'disabled' : ''}>
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>
                    `)}
                </div>
            </div>
        `;

        // Bind Modal Action Buttons with Atomic Debounced Sync
        const modalAddBtn = document.getElementById('modal-add-btn');
        if (modalAddBtn) {
            modalAddBtn.onclick = () => {
                if (isOutOfStock) {
                    if (typeof window.showClientToast === 'function') window.showClientToast('This item is currently out of stock', 'warning', 'inventory_2');
                    return;
                }
                window.setOptimisticCartQuantity(pid, 1, stockLeft, () => {
                    if (document.getElementById('product-modal')) window.openProductModal(pid);
                });
                window.openProductModal(pid);
            };
        }
        const modalIncBtn = document.getElementById('modal-inc-btn');
        if (modalIncBtn) {
            modalIncBtn.onclick = () => {
                const currentQty = window.cartState?.[pid]?.quantity || 0;
                if (currentQty >= stockLeft) {
                    if (typeof window.showClientToast === 'function') {
                        window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in stock!`, 'warning', 'inventory_2');
                    }
                    return;
                }
                window.setOptimisticCartQuantity(pid, currentQty + 1, stockLeft, () => {
                    if (document.getElementById('product-modal')) window.openProductModal(pid);
                });
                window.openProductModal(pid);
            };
        }
        const modalDecBtn = document.getElementById('modal-dec-btn');
        if (modalDecBtn) {
            modalDecBtn.onclick = () => {
                const currentQty = window.cartState?.[pid]?.quantity || 0;
                window.setOptimisticCartQuantity(pid, Math.max(0, currentQty - 1), stockLeft, () => {
                    if (document.getElementById('product-modal')) window.openProductModal(pid);
                });
                window.openProductModal(pid);
            };
        }
    } catch(e) {
        console.error('[Product Modal Error]:', e);
        modal.innerHTML = `
            <div class="modal-content p-6 text-center space-y-3">
                <p class="text-error text-xs">Could not load product details.</p>
                <button type="button" class="bg-surface-container-high text-xs px-4 py-1.5 rounded-full" onclick="document.getElementById('product-modal').remove()">Close</button>
            </div>
        `;
    }
};

// Render slot markup for a single product without rebuilding everything
function renderSlotContent(productId, slotEl) {
    if (!slotEl) return;
    const cached = window.__cachedProducts?.get(productId);
    const stockAttr = slotEl.dataset.stockLeft || slotEl.getAttribute('data-stock-left');
    const isOutOfStock = slotEl.dataset.outOfStock === 'true' || slotEl.getAttribute('data-out-of-stock') === 'true' || (cached && !cached.in_stock);
    const stockLeft = cached?.stock_left !== undefined && cached?.stock_left !== null ? Number(cached.stock_left) : (stockAttr !== undefined && stockAttr !== '' && stockAttr !== null ? Number(stockAttr) : (isOutOfStock ? 0 : 50));

    if (isOutOfStock || stockLeft <= 0) {
        slotEl.innerHTML = `
            <span class="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 cursor-not-allowed select-none">
                Out of Stock
            </span>
        `;
        return;
    }

    const cartInfo = window.cartState[productId];
    const qty = cartInfo ? cartInfo.quantity : 0;

    if (qty > 0) {
        const isMaxReached = qty >= stockLeft;
        slotEl.innerHTML = `
            <div class="card-qty-stepper">
                <button type="button" class="card-qty-btn card-dec-btn" data-id="${productId}" data-stock-left="${stockLeft}">
                    <span class="material-symbols-outlined text-[13px]">remove</span>
                </button>
                <span class="card-qty-val">${qty}</span>
                <button type="button" class="card-qty-btn card-inc-btn ${isMaxReached ? 'opacity-40 cursor-not-allowed' : ''}" data-id="${productId}" data-stock-left="${stockLeft}" title="${isMaxReached ? `Only ${stockLeft} left in stock` : 'Add one more'}">
                    <span class="material-symbols-outlined text-[13px]">add</span>
                </button>
            </div>
        `;
    } else {
        slotEl.innerHTML = `
            <button type="button" class="bg-emerald text-white rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all add-to-cart-btn" data-id="${productId}" data-stock-left="${stockLeft}">Add</button>
        `;
    }
}

// Targeted Instant Update for a Single Product (< 1ms DOM execution)
window.updateSingleProductSlot = function(productId) {
    document.querySelectorAll(`.product-action-slot[data-id="${productId}"]`).forEach(slot => {
        renderSlotContent(productId, slot);
    });
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }
};

// Global Card Stepper Synchronizer (Fast batch render)
window.syncCardSteppers = function() {
    document.querySelectorAll('.product-action-slot').forEach(slot => {
        const id = slot.dataset.id;
        if (id) renderSlotContent(id, slot);
    });
    if (typeof window.updateGlobalCartBadges === 'function') {
        window.updateGlobalCartBadges();
    }
};

// Global Cart Count Badges Synchronizer (Bottom Nav & Header Badges)
window.updateGlobalCartBadges = function() {
    let totalItems = 0;
    if (window.cartState && typeof window.cartState === 'object') {
        Object.values(window.cartState).forEach(item => {
            if (item && item.quantity) {
                totalItems += Number(item.quantity);
            }
        });
    }

    const badgeEls = document.querySelectorAll('#bottom-nav-cart-count, #desktop-header-cart-count, #mobile-header-cart-count, .global-cart-count-badge');
    badgeEls.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems > 99 ? '99+' : totalItems;
            badge.classList.remove('hidden');
        } else {
            badge.textContent = '0';
            badge.classList.add('hidden');
        }
    });
};

// Setup Single Global Event Delegation for all Cart Actions & Product Modals (0ms rebind overhead)
let isGlobalCartDelegationBound = false;
function initGlobalEventDelegation() {
    if (isGlobalCartDelegationBound) return;
    isGlobalCartDelegationBound = true;

    document.addEventListener('click', (e) => {
        // 1. Add to Cart Button Click
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (addBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = addBtn.dataset.id;
            if (!id) return;

            const slot = addBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : (addBtn.dataset.stockLeft !== undefined ? Number(addBtn.dataset.stockLeft) : 50));

            if (stockLeft <= 0) {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('⚠️ This item is out of stock', 'warning', 'inventory_2');
                }
                return;
            }

            // Instant Atomic Sync
            window.setOptimisticCartQuantity(id, 1, stockLeft);
            return;
        }

        // 2. Increment Quantity (+) Click
        const incBtn = e.target.closest('.card-inc-btn');
        if (incBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = incBtn.dataset.id;
            if (!id) return;

            const slot = incBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : (incBtn.dataset.stockLeft !== undefined ? Number(incBtn.dataset.stockLeft) : 50));
            const currentQty = window.cartState?.[id]?.quantity || 0;

            if (currentQty >= stockLeft) {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast(`⚠️ Only ${stockLeft} unit${stockLeft === 1 ? '' : 's'} available in stock!`, 'warning', 'inventory_2');
                }
                return;
            }

            // Instant Atomic Sync (batches fast multi-taps into 1 exact sync)
            window.setOptimisticCartQuantity(id, currentQty + 1, stockLeft);
            return;
        }

        // 3. Decrement Quantity (-) Click
        const decBtn = e.target.closest('.card-dec-btn');
        if (decBtn) {
            e.preventDefault();
            e.stopPropagation();
            const id = decBtn.dataset.id;
            if (!id) return;

            const slot = decBtn.closest('.product-action-slot');
            const cachedProd = window.__cachedProducts?.get(id);
            const stockLeft = cachedProd?.stock_left !== undefined ? Number(cachedProd.stock_left) : (slot?.dataset?.stockLeft !== undefined ? Number(slot.dataset.stockLeft) : 50);
            const currentQty = window.cartState?.[id]?.quantity || 0;

            // Instant Atomic Sync
            window.setOptimisticCartQuantity(id, Math.max(0, currentQty - 1), stockLeft);
            return;
        }

        // 4. Product Card Click (Open Modal)
        const productCard = e.target.closest('.product-detail-trigger');
        if (productCard && !e.target.closest('.product-action-slot') && !e.target.closest('button')) {
            const id = productCard.dataset.productId;
            if (id && typeof window.openProductModal === 'function') {
                window.openProductModal(id);
            }
        }
    });
}
initGlobalEventDelegation();

// Router Main Function
// Router Main Function - Instant Zero-Blocking Navigation
// ================= CLIENT STORE AVAILABILITY & LOCK CONTROLLER =================
window.__storeAvailability = null;
window.__isUserBlocked = false;
window.__userBlockReason = null;
window.__clientLockTicker = null;

window.syncStoreAvailability = async function() {
    try {
        const data = await window.api.getClientStatus();
        window.__storeAvailability = data;
        renderStoreClosedBannerOrOverlay();
        return data;
    } catch (e) {
        console.warn('[Store Availability Sync Error]:', e);
        return { is_locked: false, lock_status: 'AVAILABLE' };
    }
};

function formatClientReopenHeadline(avail) {
    if (!avail) return "We'll reopen soon";
    if (avail.end_at) {
        const end = new Date(avail.end_at);
        if (!isNaN(end.getTime())) {
            const now = new Date();
            const isToday = end.toDateString() === now.toDateString();
            const tomorrow = new Date(now.getTime() + 86400000);
            const isTomorrow = end.toDateString() === tomorrow.toDateString();

            let hours = end.getHours();
            const minutes = end.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            const minStr = String(minutes).padStart(2, '0');
            const timeStr = `${hours}:${minStr} ${ampm}`;

            let dayWording = 'today';
            if (isToday) dayWording = 'today';
            else if (isTomorrow) dayWording = 'tomorrow';
            else dayWording = `on ${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;

            return `We'll reopen at ${timeStr}, ${dayWording}`;
        }
    }
    return avail.display_reopen?.fullHeadline || (avail.message ? avail.message : "We'll reopen soon");
}

window.renderStoreClosedBannerOrOverlay = function() {
    const avail = window.__storeAvailability;
    const isUserBlocked = Boolean(window.__isUserBlocked);
    const homeHeroContainer = document.getElementById('store-closed-banner-slot');

    if (isUserBlocked) {
        const blockReason = window.__userBlockReason || 'Fake Orders';
        if (homeHeroContainer) {
            homeHeroContainer.innerHTML = `
                <div id="blocked-user-hero-card" class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ba1a1a] to-[#93000a] text-white p-6 sm:p-8 shadow-2xl border-2 border-[#ff8a80] my-4 animate-fade-in">
                    <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div class="flex items-center gap-4 text-left">
                            <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                                <span class="material-symbols-outlined text-4xl text-white">gavel</span>
                            </div>
                            <div class="space-y-1">
                                <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
                                    <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                    <span>Account Suspended</span>
                                </div>
                                <h2 class="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                    You are blocked due to ${(blockReason).toLowerCase()}.
                                </h2>
                                <p class="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
                                    Your student account is restricted from placing orders on LPUQuick. Please contact BH13 Central Campus Hub to appeal or resolve this restriction.
                                </p>
                            </div>
                        </div>
                        <a href="#/blocked" class="shrink-0 bg-white text-[#ba1a1a] hover:bg-white/90 px-6 py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-lg transition-all active:scale-95">
                            View Details
                        </a>
                    </div>
                </div>
            `;
            homeHeroContainer.classList.remove('hidden');
        }
        updateBlockedUI(true, blockReason);
        updateCheckoutButtonsForLock(true, 'Account Suspended');
        return;
    }

    if (!avail) return;

    const isLocked = Boolean(avail.is_locked);
    
    // 1. Manage Global Sticky Announcement Bar (Visible across ALL pages)
    let globalBar = document.getElementById('global-store-lock-bar');

    if (isLocked) {
        const reopenHeadline = formatClientReopenHeadline(avail);
        const secondaryText = avail.message || "You can still add items and order when the store re-opens";

        document.body.classList.add('store-locked-active');
        document.body.style.paddingTop = '36px';

        const fixedHeaders = document.querySelectorAll('header.fixed, header[class*="fixed"]');
        fixedHeaders.forEach(h => { h.style.top = '36px'; });

        if (!globalBar) {
            globalBar = document.createElement('div');
            globalBar.id = 'global-store-lock-bar';
            globalBar.className = 'fixed top-0 left-0 right-0 z-[100] bg-[#1a1d20] text-white py-2 px-3 sm:px-4 text-xs font-semibold flex items-center justify-between shadow-lg border-b border-red-500/30 animate-fade-in';
            document.body.prepend(globalBar);
        }

        globalBar.innerHTML = `
            <div class="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-[#ea4335] animate-ping"></span>
                    <span class="font-bold text-[#ea4335] uppercase text-[10px] tracking-wider">Store Closed:</span>
                    <span class="font-medium truncate max-w-[200px] sm:max-w-md">${reopenHeadline}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-[#ea4335]">timer</span>
                    <span class="font-mono font-bold text-white text-xs" id="global-lock-timer-display">--:--:--</span>
                </div>
            </div>
        `;
        globalBar.classList.remove('hidden');

        // 2. Render Reference Design Card on Homepage
        if (homeHeroContainer) {
            const hasCountdown = Boolean(avail.remaining_seconds || avail.end_at);
            const closedCardHtml = `
                <div id="store-closed-hero-card" class="relative overflow-hidden rounded-3xl bg-[#1a1d20] text-white p-6 sm:p-8 shadow-2xl border border-white/10 my-4 animate-fade-in">
                    <!-- Ambient glow -->
                    <div class="absolute -top-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        
                        <!-- Left Column: Dynamic Typography & Live Countdown -->
                        <div class="flex-1 space-y-3 text-left">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 text-white/90 border border-white/10">
                                <span class="w-2 h-2 rounded-full bg-[#ea4335] animate-ping"></span>
                                <span>Temporary Store Restock</span>
                            </div>

                            <h1 class="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight" id="client-closed-headline">
                                ${reopenHeadline}
                            </h1>

                            <p class="text-sm sm:text-base text-[#a0a5aa] font-medium leading-relaxed max-w-xl">
                                ${secondaryText}
                            </p>

                            <!-- Live Ticking Countdown -->
                            <div id="client-countdown-wrapper" class="pt-2">
                                <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 border border-white/15 text-white font-mono text-sm shadow-inner">
                                    <span class="material-symbols-outlined text-base text-[#ea4335] animate-pulse">timer</span>
                                    <span class="text-xs font-semibold text-white/80">Time remaining:</span>
                                    <span class="font-bold text-white font-mono text-base tracking-widest" id="client-countdown-display">00:00:00</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Hanging Red CLOSED Sign (Visual Reference Match) -->
                        <div class="shrink-0 flex flex-col items-center select-none pt-2 sm:pt-0">
                            <!-- Top Chains / Strings -->
                            <div class="flex justify-between w-36 px-4 mb-[-2px] relative z-0">
                                <div class="w-[2px] h-8 bg-gradient-to-b from-[#80868b] to-[#5f6368] shadow-sm"></div>
                                <div class="w-[2px] h-8 bg-gradient-to-b from-[#80868b] to-[#5f6368] shadow-sm"></div>
                            </div>

                            <!-- Red Board -->
                            <div class="relative z-10 w-44 sm:w-48 bg-gradient-to-b from-[#d93025] to-[#b3261e] border-2 border-[#ff8a80] rounded-2xl p-4 text-center shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform hover:rotate-1 transition-transform duration-300">
                                <div class="absolute top-2 left-3 w-2.5 h-2.5 rounded-full bg-[#3c4043] border border-white/40 shadow-inner"></div>
                                <div class="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-[#3c4043] border border-white/40 shadow-inner"></div>
                                
                                <p class="text-[11px] font-extrabold uppercase tracking-widest text-white/90 drop-shadow-sm">Sorry, we are</p>
                                <h2 class="text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] mt-0.5">CLOSED</h2>
                            </div>
                        </div>

                    </div>
                </div>
            `;
            homeHeroContainer.innerHTML = closedCardHtml;
            homeHeroContainer.classList.remove('hidden');
        }

        // Start live ticker
        let countdownSecs = avail.remaining_seconds;
        if (!countdownSecs && avail.end_at) {
            countdownSecs = Math.max(0, Math.floor((new Date(avail.end_at).getTime() - Date.now()) / 1000));
        }

        if (countdownSecs && countdownSecs > 0) {
            startClientCountdown(countdownSecs, avail.end_at);
        } else {
            if (window.__clientLockTicker) {
                clearInterval(window.__clientLockTicker);
                window.__clientLockTicker = null;
            }
            const globalDisplayEl = document.getElementById('global-lock-timer-display');
            if (globalDisplayEl) {
                globalDisplayEl.innerHTML = '<span class="text-[11px] font-bold text-amber-300">Until Unlocked</span>';
            }
            const clientDisplayEl = document.getElementById('client-countdown-display');
            if (clientDisplayEl) {
                clientDisplayEl.textContent = 'Until Reopened';
            }
        }

        // Update any checkout submit button if visible
        updateCheckoutButtonsForLock(true, reopenHeadline);
    } else {
        document.body.classList.remove('store-locked-active');
        document.body.style.paddingTop = '0px';

        const fixedHeaders = document.querySelectorAll('header.fixed, header[class*="fixed"]');
        fixedHeaders.forEach(h => { h.style.top = '0px'; });

        if (globalBar) {
            globalBar.classList.add('hidden');
        }

        if (homeHeroContainer) {
            homeHeroContainer.innerHTML = '';
            homeHeroContainer.classList.add('hidden');
        }
        if (window.__clientLockTicker) {
            clearInterval(window.__clientLockTicker);
            window.__clientLockTicker = null;
        }
        updateCheckoutButtonsForLock(false);
    }
};

function startClientCountdown(seconds, endAt) {
    if (window.__clientLockTicker) clearInterval(window.__clientLockTicker);

    const endTimestamp = endAt ? new Date(endAt).getTime() : Date.now() + (seconds * 1000);

    const update = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTimestamp - now) / 1000));

        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        const timeStr = `${h}:${m}:${s}`;

        const displayEl = document.getElementById('client-countdown-display');
        if (displayEl) {
            displayEl.textContent = timeStr;
        }

        const globalDisplayEl = document.getElementById('global-lock-timer-display');
        if (globalDisplayEl) {
            globalDisplayEl.textContent = timeStr;
        }

        if (diff <= 0) {
            clearInterval(window.__clientLockTicker);
            window.__clientLockTicker = null;
            if (typeof window.syncStoreAvailability === 'function') {
                window.syncStoreAvailability();
            }
        }
    };

    update();
    window.__clientLockTicker = setInterval(update, 1000);
}

function updateCheckoutButtonsForLock(isLocked, reopenText = 'Soon') {

    const checkoutBtns = document.querySelectorAll('#proceed-to-checkout-btn, #btn-place-order, .btn-checkout-submit, #checkout-submit-btn');
    checkoutBtns.forEach(btn => {
        if (isLocked) {
            btn.dataset.locked = 'true';
            btn.classList.add('opacity-75', 'cursor-not-allowed', 'bg-gray-600');
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showClientToast(`🏪 Store is temporarily closed (${reopenText}). Your cart is safely preserved!`, 'warning', 'lock');
            };
        } else {
            btn.dataset.locked = 'false';
            btn.classList.remove('opacity-75', 'cursor-not-allowed', 'bg-gray-600');
            btn.onclick = null;
        }
    });
}

// Blocked Account Page Route & Real-Time Client Synchronization
window.syncUserBlockStatus = async function() {
    const uid = window.isUserLoggedIn() ? window.CURRENT_USER_ID : (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
    if (!uid) {
        window.__isUserBlocked = false;
        window.__userBlockReason = null;
        updateBlockedUI(false);
        return { isBlocked: false };
    }

    try {
        const res = await window.api.checkUserStatus(uid);
        if (res && (res.isBlocked || res.account_status === 'BLOCKED')) {
            window.__isUserBlocked = true;
            window.__userBlockReason = res.reason || 'Fake Orders';
            if (typeof window.renderStoreClosedBannerOrOverlay === 'function') {
                window.renderStoreClosedBannerOrOverlay();
            }
            updateBlockedUI(true, window.__userBlockReason);
            
            const currentRoute = getCurrentRoute();
            if (currentRoute === '/checkout' || currentRoute === '/cart') {
                window.location.hash = '#/blocked';
            }
            return { isBlocked: true, reason: window.__userBlockReason };
        } else {
            const wasBlocked = window.__isUserBlocked;
            window.__isUserBlocked = false;
            window.__userBlockReason = null;
            updateBlockedUI(false);
            if (wasBlocked && typeof window.renderStoreClosedBannerOrOverlay === 'function') {
                window.renderStoreClosedBannerOrOverlay();
            }
            return { isBlocked: false };
        }

    } catch (e) {
        return { isBlocked: false };
    }
};

function updateBlockedUI(isBlocked, reason = 'Fake Orders') {
    let bar = document.getElementById('global-user-blocked-bar');
    if (isBlocked) {
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'global-user-blocked-bar';
            bar.className = 'fixed top-0 left-0 right-0 z-[110] bg-[#ba1a1a] text-white py-2.5 px-4 text-xs font-bold flex items-center justify-between shadow-2xl border-b border-red-300 animate-fade-in';
            document.body.prepend(bar);
        }
        bar.innerHTML = `
            <div class="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-base animate-pulse">block</span>
                    <span>Account Suspended: You are blocked due to ${(reason).toLowerCase()}.</span>
                </div>
                <a href="#/blocked" class="bg-white text-[#ba1a1a] px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider hover:bg-white/90">Details</a>
            </div>
        `;
        bar.classList.remove('hidden');
        document.body.style.paddingTop = '40px';
    } else {
        if (bar) {
            bar.classList.add('hidden');
        }
        if (!window.__storeAvailability?.is_locked) {
            document.body.style.paddingTop = '0px';
        }
    }
}

window.pages = window.pages || {};
window.pages.blocked = async function() {
    const reason = window.__userBlockReason || 'Fake Orders';
    return `
    <div class="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md bg-surface rounded-3xl p-8 shadow-2xl border border-rose-500/20 text-center space-y-5">
            <div class="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">gavel</span>
            </div>
            <div>
                <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500/10 text-rose-600">
                    Account Suspended
                </span>
                <h1 class="text-2xl font-black text-on-surface tracking-tight mt-2">Account Blocked</h1>
                <p class="text-sm font-bold text-rose-600 mt-1">
                    "You are blocked due to ${(reason).toLowerCase()}."
                </p>
            </div>
            <div class="bg-surface-variant/40 border border-surface-variant/60 rounded-2xl p-4 text-xs text-on-surface-variant leading-relaxed text-left space-y-2">
                <p>
                    Your student account has been restricted from placing orders on <b>LPU Quick</b> due to flagged policy violations (e.g. fake or cancelled orders).
                </p>
                <p class="text-[11px] text-on-surface-variant/80">
                    If you believe this restriction is in error, please visit the <b>BH13 Central Campus Hub</b> or reach out to campus operations.
                </p>
            </div>
            <a href="#/" class="inline-block w-full py-3 px-4 rounded-2xl bg-emerald hover:bg-emerald-600 text-white font-bold text-xs tracking-wide shadow-md transition-all">
                Back to Store Catalog
            </a>
        </div>
    </div>
    `;
};

// Router Main Function - Instant Zero-Blocking Navigation
let cartSyncInProgress = false;
async function router() {
    const path = getCurrentRoute();
    
    // Mandatory unauthenticated check: Require sign in before entering store
    if (!window.isUserLoggedIn() && path !== '/signin') {
        if (path !== '/') {
            localStorage.setItem('lpuquick_redirect', '#' + path);
        }
        window.location.hash = '#/signin';
        return;
    }

    // Check user block status on route change
    if (window.isUserLoggedIn()) {
        window.syncUserBlockStatus();
    }

    // Blocked user guard: Prevent checkout navigation
    if (window.__isUserBlocked && (path === '/checkout' || path === '/cart')) {
        window.location.hash = '#/blocked';
        return;
    }


    const pageName = getPageName(path);
    const appRoot = document.getElementById('app');
    
    if (!appRoot) return;

    try {
        // Non-blocking background cart revalidation with SWR
        const effectiveUid = window.getEffectiveUserId();
        if (!cartSyncInProgress) {
            cartSyncInProgress = true;
            window.api.getCart(effectiveUid)
                .then(() => {
                    cartSyncInProgress = false;
                    if (typeof window.syncCardSteppers === 'function') window.syncCardSteppers();
                    if (typeof window.updateGlobalCartBadges === 'function') window.updateGlobalCartBadges();
                })
                .catch(() => { cartSyncInProgress = false; });
        }

        const renderFn = window.pages[pageName];
        if (renderFn) {
            const html = await renderFn();
            appRoot.innerHTML = html;
            appRoot.classList.add('page-enter');
            setTimeout(() => appRoot.classList.remove('page-enter'), 200);

            // Initialize page-specific JS
            const initFn = window.pageInits[pageName];
            if (initFn) initFn();

            // Synchronize theme toggles
            if (typeof window.syncAllThemeToggles === 'function') {
                window.syncAllThemeToggles();
            }

            // Synchronize steppers & cart badges
            window.syncCardSteppers();
            if (typeof window.updateGlobalCartBadges === 'function') {
                window.updateGlobalCartBadges();
            }

            // Check and sync store availability banner
            window.syncStoreAvailability();

            // Bind global address modal trigger
            document.querySelectorAll('.address-selector-trigger').forEach(el => {
                el.onclick = (e) => {
                    e.preventDefault();
                    window.openAddressModal();
                };
            });

            window.scrollTo(0, 0);

            // Check active order delivery bar
            checkAndConnectGlobalOrderTracking();
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

// Listen for tab focus to instantly refresh store availability
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            window.syncStoreAvailability();
        }
    });
}

// Periodic background availability sync (every 30s)
setInterval(() => {
    window.syncStoreAvailability();
}, 30000);

// ================= GLOBAL REAL-TIME CLIENT-ADMIN COORDINATION HUB =================
let globalClientWs = null;
let clientWsReconnectTimer = null;
let clientWsReconnectAttempts = 0;
let clientWsPingInterval = null;
let currentTrackedOrderId = null;

// Client Toast Notification Helper
function showClientToast(message, type = 'info', icon = 'bolt') {
    const container = document.getElementById('client-toast-container');
    if (!container) return;

    const id = `client-toast-${Date.now()}`;
    const styles = {
        success: 'border-emerald-500 bg-white/95 dark:bg-slate-900/95 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10',
        info: 'border-sky-500 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-sky-500/10',
        warning: 'border-amber-500 bg-white/95 dark:bg-slate-900/95 text-amber-800 dark:text-amber-300 shadow-amber-500/10',
        error: 'border-rose-500 bg-white/95 dark:bg-slate-900/95 text-rose-800 dark:text-rose-300 shadow-rose-500/10'
    };

    const toastHtml = `
        <div id="${id}" class="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border-l-4 ${styles[type] || styles.info} shadow-xl backdrop-blur-xl transition-all duration-300 transform translate-y-2 opacity-0">
            <div class="flex items-center gap-2.5 min-w-0">
                <span class="material-symbols-outlined text-lg shrink-0 text-emerald">${icon}</span>
                <p class="text-xs font-bold leading-tight truncate">${message}</p>
            </div>
            <button onclick="dismissClientToast('${id}')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs shrink-0 p-1">✕</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const el = document.getElementById(id);
    setTimeout(() => {
        if (el) {
            el.classList.remove('translate-y-2', 'opacity-0');
            el.classList.add('translate-y-0', 'opacity-100');
        }
    }, 20);

    setTimeout(() => { dismissClientToast(id); }, 5000);
}

function dismissClientToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => { el.remove(); }, 350);
}

// Global Client WebSocket Connection
function initGlobalClientWebSocket() {
    if (globalClientWs && (globalClientWs.readyState === WebSocket.OPEN || globalClientWs.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (clientWsReconnectTimer) {
        clearTimeout(clientWsReconnectTimer);
        clientWsReconnectTimer = null;
    }

    if (clientWsPingInterval) {
        clearInterval(clientWsPingInterval);
        clientWsPingInterval = null;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/client`;

    try {
        globalClientWs = new WebSocket(wsUrl);

        globalClientWs.onopen = () => {
            console.log('[LPUQuick WS] ⚡ Connected to campus live stream.');
            clientWsReconnectAttempts = 0;

            // Register user if signed in
            if (window.CURRENT_USER_ID) {
                globalClientWs.send(JSON.stringify({
                    type: 'REGISTER_USER',
                    userId: window.CURRENT_USER_ID
                }));
            }

            // Keepalive ping every 20s
            clientWsPingInterval = setInterval(() => {
                if (globalClientWs && globalClientWs.readyState === WebSocket.OPEN) {
                    globalClientWs.send(JSON.stringify({ type: 'PING' }));
                }
            }, 20000);
        };

        globalClientWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 1. Live Inventory & Stock Updates from Admin
                if (data.type === 'INVENTORY_UPDATE') {
                    handleLiveInventoryChange(data);
                }
                // 2. Live Order Status Updates from Admin
                else if (data.type === 'STATUS_UPDATE' || data.type === 'ORDER_STATUS_UPDATE') {
                    handleLiveOrderStatusChange(data);
                }
                // 3. New Order Confirmation
                else if (data.type === 'NEW_ORDER' && data.order) {
                    if (window.CURRENT_USER_ID && data.order.user_id === window.CURRENT_USER_ID) {
                        checkAndConnectGlobalOrderTracking();
                    }
                }
                // 4. Live Store Lock / Availability Updates from Admin
                else if (data.type === 'CLIENT_LOCK_UPDATE' && data.availability) {
                    window.__storeAvailability = data.availability;
                    window.renderStoreClosedBannerOrOverlay();
                    if (data.availability.is_locked) {
                        showClientToast('🏪 Storefront is currently closed for restock.', 'warning', 'lock');
                    } else {
                        showClientToast('🚀 Storefront is now OPEN for orders!', 'success', 'bolt');
                    }
                }
                // 5. Account Blocked Real-Time Notification
                else if (data.type === 'USER_BLOCKED') {
                    const myUid = window.CURRENT_USER_ID || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
                    if (data.userId && (data.userId === myUid || data.userId === window.CURRENT_USER_ID)) {
                        window.__isUserBlocked = true;
                        window.__userBlockReason = data.reason || 'Fake Orders';
                        if (typeof updateBlockedUI === 'function') updateBlockedUI(true, window.__userBlockReason);
                        window.location.hash = '#/blocked';
                        alert(`⚠️ Account Suspended:\n\nYou are blocked due to ${(data.reason || 'fake orders').toLowerCase()}.\n\nPlease contact BH13 Central Campus Hub.`);
                    }
                }
                // 6. Account Unblocked Real-Time Notification
                else if (data.type === 'USER_UNBLOCKED') {
                    const myUid = window.CURRENT_USER_ID || (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : null);
                    if (data.userId && (data.userId === myUid || data.userId === window.CURRENT_USER_ID)) {
                        window.__isUserBlocked = false;
                        window.__userBlockReason = null;
                        if (typeof updateBlockedUI === 'function') updateBlockedUI(false);
                        window.location.hash = '#/';
                        showClientToast('🎉 Your account access has been restored!', 'success', 'bolt');
                    }
                }

            } catch (err) {
                console.error('[LPUQuick WS Parse Error]:', err);
            }
        };

        globalClientWs.onclose = () => {
            globalClientWs = null;
            if (clientWsPingInterval) { clearInterval(clientWsPingInterval); clientWsPingInterval = null; }

            // Auto-reconnect with exponential backoff (1s, 2s, 4s... max 15s)
            const delay = Math.min(1000 * Math.pow(2, clientWsReconnectAttempts), 15000);
            clientWsReconnectAttempts++;
            clientWsReconnectTimer = setTimeout(initGlobalClientWebSocket, delay);
        };

        globalClientWs.onerror = () => {
            try { globalClientWs.close(); } catch(e) {}
        };

    } catch (e) {
        if (!clientWsReconnectTimer) {
            clientWsReconnectTimer = setTimeout(initGlobalClientWebSocket, 3000);
        }
    }
}


// In-place Real-Time Stock Updates across DOM
function handleLiveInventoryChange(data) {
    const { productId, stock_left, in_stock } = data;
    console.log(`[Realtime Stock Sync] Product ${productId}: Stock=${stock_left}, InStock=${in_stock}`);

    // 1. Update all product action slots and cards on screen
    const isOut = !in_stock || stock_left <= 0;
    const slots = document.querySelectorAll(`.product-action-slot[data-id="${productId}"]`);
    slots.forEach(slot => {
        slot.dataset.outOfStock = isOut ? 'true' : 'false';
        const card = slot.closest('.product-detail-trigger, .product-card-container');
        if (card) {
            if (isOut) card.classList.add('opacity-85');
            else card.classList.remove('opacity-85');
        }
    });

    window.syncCardSteppers();

    // 2. Update single product detail modal/page if open
    const modalAddBtn = document.querySelector(`#modal-add-btn[data-id="${productId}"]`);
    if (modalAddBtn) {
        if (isOut) {
            modalAddBtn.disabled = true;
            modalAddBtn.className = 'w-full bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full py-3 text-xs font-bold cursor-not-allowed';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">block</span> Out of Stock';
        } else {
            modalAddBtn.disabled = false;
            modalAddBtn.className = 'w-full bg-emerald hover:bg-primary text-white py-3 rounded-full font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart';
        }
    }

    // 3. Dynamically update stock badges across all card images and headers
    const badges = document.querySelectorAll(`.stock-badge[data-id="${productId}"]`);
    badges.forEach(b => {
        if (!in_stock || stock_left <= 0) {
            b.className = 'absolute top-2 left-2 z-10 stock-badge bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm';
            b.textContent = 'Out of Stock';
            b.style.display = 'block';
        } else if (stock_left > 0 && stock_left <= 4) {
            b.className = 'absolute top-2 left-2 z-10 stock-badge bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5';
            b.innerHTML = `<span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">bolt</span> Only ${stock_left} left!`;
            b.style.display = 'flex';
        } else {
            b.style.display = 'none';
        }
    });

    const badgeTexts = document.querySelectorAll(`.stock-badge-text[data-id="${productId}"]`);
    badgeTexts.forEach(bt => {
        if (stock_left > 0 && stock_left <= 4) {
            bt.textContent = `⚡ Only ${stock_left} left`;
            bt.style.display = 'inline-block';
        } else {
            bt.style.display = 'none';
        }
    });
}

// In-place Real-Time Order Status Updates
function handleLiveOrderStatusChange(data) {
    const status = data.status;
    const riderName = data.rider_name || data.riderName || 'Alex';
    const orderId = data.order_id || data.orderId;

    console.log(`[Realtime Order Sync] Order ${orderId} -> ${status}`);

    // 1. Update Global Floating Bar
    updateGlobalDeliveryBar(status, riderName);

    // 2. If user is currently viewing the Live Orders page, update the interactive HUD/map in real-time
    if (typeof window.applyOrderStatusUI === 'function') {
        window.applyOrderStatusUI(status, riderName);
    } else {
        // Play status chime on any page
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659.25, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            }
        } catch (e) {}
    }

    // 3. Show dynamic client status toast
    const statusMessages = {
        'Order Confirmed': '👍 BH13 Store accepted your order!',
        'Preparing': '📦 Items packed & sealed at BH13 Dark Store!',
        'Out for Delivery': `🚶‍♂️ ${riderName} is speeding towards your room!`,
        'Delivered': '🎉 Order delivered to your room door!',
        'Cancelled': '❌ Order was cancelled by Admin.'
    };

    if (statusMessages[status]) {
        showClientToast(statusMessages[status], status === 'Cancelled' ? 'error' : 'success', status === 'Delivered' ? 'task_alt' : 'bolt');
    }
}

async function checkAndConnectGlobalOrderTracking() {
    try {
        const bar = document.getElementById('global-live-delivery-bar');
        if (!window.isUserLoggedIn()) {
            if (bar) bar.classList.add('hidden');
            return;
        }
        const userId = window.CURRENT_USER_ID;
        const activeRes = await window.api.getActiveOrder(userId);
        const active = activeRes?.active;

        if (!active || ['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(active.status)) {
            if (bar) bar.classList.add('hidden');
            return;
        }

        currentTrackedOrderId = active.id;
        updateGlobalDeliveryBar(active.status, active.rider_name || 'Alex');

        // Only show floating bar when not already on dedicated tracking pages
        const currentPath = getCurrentRoute();
        if (bar) {
            if (currentPath === '/orders' || currentPath === '/checkout') {
                bar.classList.add('hidden');
            } else {
                bar.classList.remove('hidden');
            }
        }

    } catch (e) {
        console.warn('[Global Tracking Sync]:', e);
    }
}

function updateGlobalDeliveryBar(status, riderName) {
    const bar = document.getElementById('global-live-delivery-bar');
    const statusEl = document.getElementById('global-delivery-status');
    const etaEl = document.getElementById('global-delivery-eta');
    const subEl = document.getElementById('global-delivery-subtitle');
    const hostelShort = window.currentAddress || 'BH13';

    if (!bar || !statusEl || !etaEl || !subEl) return;

    statusEl.textContent = status;

    if (status === 'Order Placed') {
        etaEl.textContent = '3 mins';
        subEl.textContent = `BH13 Dark Store is verifying your snacks`;
    } else if (status === 'Order Confirmed') {
        etaEl.textContent = '3 mins';
        subEl.textContent = `Confirmed by BH13 Hub · Packing shortly`;
    } else if (status === 'Preparing') {
        etaEl.textContent = '2 mins';
        subEl.textContent = `Staff is packing your bag at BH13 Hub`;
    } else if (status === 'Out for Delivery') {
        etaEl.textContent = '1 min';
        subEl.textContent = `🚶‍♂️ ${riderName} is walking to ${hostelShort} (Block A)`;
    } else if (status === 'Delivered') {
        etaEl.textContent = 'Arrived ✓';
        subEl.textContent = `🎉 Delivered to ${hostelShort}! Enjoy your snacks!`;
        setTimeout(() => {
            bar.classList.add('hidden');
        }, 8000);
    } else if (status === 'Cancelled' || status === 'cancelled') {
        etaEl.textContent = 'Cancelled ✕';
        subEl.textContent = '❌ Order was cancelled by Admin';
        setTimeout(() => {
            bar.classList.add('hidden');
        }, 4000);
    }
}

window.router = router;
window.navigate = navigate;

// ============================================================
// Mobile Pull-to-Refresh & Live Page Reload Engine
// ============================================================
window.refreshLiveApp = async function(isFullReload = false) {
    if (window.__cachedProducts) {
        window.__cachedProducts.clear();
    }
    if (typeof window.api?.clearCartCache === 'function') {
        window.api.clearCartCache();
    }

    if (isFullReload) {
        try {
            sessionStorage.setItem('lpuquick_just_reloaded', 'true');
        } catch (e) {}
        window.location.reload();
        return;
    }

    try {
        if (typeof window.router === 'function') {
            await window.router();
        } else if (typeof router === 'function') {
            await router();
        }
        if (typeof window.syncCardSteppers === 'function') {
            window.syncCardSteppers();
        }
        if (typeof window.showClientToast === 'function') {
            window.showClientToast('✓ Live campus feed updated!', 'success', 'sync');
        }
    } catch (err) {
        console.warn('Live refresh error:', err);
    }
};

function initPullToRefresh() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let indicator = document.getElementById('pull-to-refresh-indicator');
    if (!indicator && document.body) {
        indicator = document.createElement('div');
        indicator.id = 'pull-to-refresh-indicator';
        indicator.innerHTML = `
            <span class="material-symbols-outlined ptr-icon">arrow_downward</span>
            <span class="ptr-text">Pull down to refresh</span>
        `;
        document.body.appendChild(indicator);
    }

    const iconEl = indicator?.querySelector('.ptr-icon');
    const textEl = indicator?.querySelector('.ptr-text');

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let hasVibrated = false;
    const PULL_THRESHOLD = 68;
    const MAX_PULL = 110;

    window.addEventListener('touchstart', (e) => {
        if ((window.scrollY || document.documentElement.scrollTop || 0) <= 2 && e.touches.length === 1) {
            startY = e.touches[0].clientY;
            isDragging = true;
            hasVibrated = false;
        } else {
            isDragging = false;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1 || !indicator) return;
        currentY = e.touches[0].clientY;
        const delta = currentY - startY;

        if (delta > 0 && (window.scrollY || document.documentElement.scrollTop || 0) <= 2) {
            const pullDistance = Math.min(MAX_PULL, delta * 0.45);
            
            indicator.classList.add('dragging');
            indicator.style.opacity = `${Math.min(1, pullDistance / 40)}`;
            indicator.style.transform = `translate3d(-50%, ${pullDistance - 45}px, 0)`;

            if (pullDistance >= PULL_THRESHOLD) {
                if (!indicator.classList.contains('can-release')) {
                    indicator.classList.add('can-release');
                    if (textEl) textEl.textContent = 'Release to reload';
                    if (!hasVibrated) {
                        try {
                            if (navigator.vibrate) navigator.vibrate(25);
                        } catch(vErr) {}
                        hasVibrated = true;
                    }
                }
            } else {
                if (indicator.classList.contains('can-release')) {
                    indicator.classList.remove('can-release');
                    if (textEl) textEl.textContent = 'Pull down to refresh';
                }
            }
        } else {
            resetIndicator();
        }
    }, { passive: true });

    window.addEventListener('touchend', async () => {
        if (!isDragging || !indicator) return;
        isDragging = false;

        const delta = currentY - startY;
        const pullDistance = delta * 0.45;

        if (pullDistance >= PULL_THRESHOLD && (window.scrollY || document.documentElement.scrollTop || 0) <= 2) {
            indicator.classList.remove('dragging', 'can-release');
            indicator.classList.add('refreshing');
            if (iconEl) iconEl.textContent = 'sync';
            if (textEl) textEl.textContent = 'Reloading campus feed...';
            indicator.style.transform = `translate3d(-50%, 20px, 0)`;
            indicator.style.opacity = '1';

            try {
                if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
            } catch(e) {}

            setTimeout(async () => {
                await window.refreshLiveApp(true);
                setTimeout(resetIndicator, 400);
            }, 450);
        } else {
            resetIndicator();
        }
        startY = 0;
        currentY = 0;
    }, { passive: true });

    function resetIndicator() {
        if (!indicator) return;
        indicator.classList.remove('dragging', 'can-release', 'refreshing');
        if (iconEl) iconEl.textContent = 'arrow_downward';
        if (textEl) textEl.textContent = 'Pull down to refresh';
        indicator.style.transform = 'translate3d(-50%, -120%, 0)';
        indicator.style.opacity = '0';
    }
}

function handlePostReloadToast() {
    try {
        if (sessionStorage.getItem('lpuquick_just_reloaded') === 'true') {
            sessionStorage.removeItem('lpuquick_just_reloaded');
            setTimeout(() => {
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('✓ Refreshed with latest campus updates!', 'success', 'check_circle');
                }
            }, 350);
        }
    } catch (e) {}
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    router();
    initGlobalClientWebSocket();
    checkAndConnectGlobalOrderTracking();
    initPullToRefresh();
    handlePostReloadToast();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    router();
    initGlobalClientWebSocket();
    checkAndConnectGlobalOrderTracking();
    initPullToRefresh();
    handlePostReloadToast();
}

// Background sync interval (every 10 seconds)
setInterval(checkAndConnectGlobalOrderTracking, 10000);

// ============================================================
// Interactive Magnetic Cursor Torch & Dynamic Ambient Parallax (Desktop Only)
// ============================================================
(function initInteractiveAtmosphere() {
    // Only run cursor torch & mouse parallax on desktop screens with fine pointer to avoid mobile scroll lag
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function' || window.matchMedia('(pointer: coarse)').matches || (window.innerWidth && window.innerWidth < 768)) {
        return;
    }


    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isTicking = false;
    let lastScrollY = window.scrollY || 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY || 0;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    function renderFrame() {
        // Smooth lerp (dampening)
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        const torch = document.getElementById('ambient-cursor-torch');
        if (torch) {
            torch.style.transform = `translate3d(${currentX - 240}px, ${currentY - 240}px, 0)`;
        }

        // Parallax reaction on floating leaves and lineart
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (mouseX - centerX) / centerX;
        const deltaY = (mouseY - centerY) / centerY;
        const scrollOffset = lastScrollY * 0.05;

        const leaves = document.querySelectorAll('.ambient-leaf');
        leaves.forEach((leaf, idx) => {
            const factor = (idx + 1) * 2.2;
            leaf.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * (idx % 2 === 0 ? 1 : 0.6)}px, 0)`;
        });

        const lineart = document.querySelectorAll('.ambient-lineart');
        lineart.forEach((art, idx) => {
            const factor = (idx + 1) * 3;
            art.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * 0.8}px, 0)`;
        });

        if (Math.abs(mouseX - currentX) > 0.3 || Math.abs(mouseY - currentY) > 0.3) {
            requestAnimationFrame(renderFrame);
        } else {
            isTicking = false;
        }
    }
})();



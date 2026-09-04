// Settings & Student Profile Page — Classical Campus Quick-Commerce Profile & Support
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.settings = async function() {
    const isLoggedIn = window.isUserLoggedIn();
    const userName = isLoggedIn ? (window.CURRENT_USER_NAME || 'LPU Student') : 'Guest Student';
    const userEmail = isLoggedIn ? (window.CURRENT_USER_EMAIL || '') : 'Sign in with Google to place campus orders';
    const userPicture = isLoggedIn ? (window.CURRENT_USER_PICTURE || '') : '';
    const initial = isLoggedIn && userName ? userName[0].toUpperCase() : 'G';

    const currentHostel = localStorage.getItem('lpuquick_address') || 'BH13';
    const currentBlock = localStorage.getItem('lpuquick_block') || 'Block A';
    const currentRoom = localStorage.getItem('lpuquick_room') || '';
    const currentPhone = (localStorage.getItem('lpuquick_phone') || '').replace(/\D/g, '');
    const currentDetail = (currentRoom && currentPhone.length === 10) 
        ? `BH13 (${currentBlock}), Room ${currentRoom} • 📞 +91 ${currentPhone}` 
        : (currentRoom ? `BH13 (${currentBlock}), Room ${currentRoom} (Mobile Mandatory)` : 'No address configured yet');

    return `
<div class="bg-background text-on-background min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-40 border-b border-border shadow-xs">
        <div class="flex items-center gap-3">
            <a href="#/" class="w-9 h-9 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-200">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">Profile & Settings</h1>
        </div>
        ${isLoggedIn ? `
        <button type="button" id="btn-sign-out" class="px-3 py-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1 text-xs font-semibold" title="Sign Out">
            <span class="material-symbols-outlined text-base">logout</span>
            <span class="hidden sm:inline">Sign Out</span>
        </button>
        ` : `
        <a href="#/signin" class="bg-emerald text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-1 shadow-xs">
            <span class="material-symbols-outlined text-xs">login</span>
            <span>Sign In</span>
        </a>
        `}
    </header>

    <main class="px-4 sm:px-6 max-w-3xl mx-auto pt-5 space-y-4">
        <!-- User Profile Card -->
        <div class="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            ${userPicture ? `
            <img src="${userPicture}" alt="${userName}" class="w-14 sm:w-16 h-14 sm:h-16 rounded-full object-cover border-2 border-emerald shadow-xs shrink-0">
            ` : `
            <div class="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-emerald text-white text-xl font-bold flex items-center justify-center shadow-xs shrink-0">
                ${initial}
            </div>
            `}
            <div class="flex-1 space-y-1">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">${userName}</h2>
                    ${isLoggedIn ? `
                    <span class="inline-flex items-center gap-1 text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.2 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 mx-auto sm:mx-0">
                        <span class="material-symbols-outlined text-xs">verified</span> LPU Student
                    </span>
                    ` : `
                    <a href="#/signin" class="inline-flex items-center gap-1 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.2 rounded-full border border-amber-200/50 mx-auto sm:mx-0 hover:underline">
                        <span>Sign In Now</span>
                    </a>
                    `}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-sm">mail</span> ${userEmail}
                </p>
                <p class="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center sm:justify-start gap-1" id="profile-address-line">
                    <span class="material-symbols-outlined text-sm text-emerald">location_on</span>
                    <span>${currentDetail}</span>
                </p>
            </div>
        </div>

        <!-- Campus Quick Actions -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- 1. My Orders -->
            <a href="#/orders" class="bg-surface border border-border rounded-xl p-3 shadow-xs text-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col items-center">
                <span class="material-symbols-outlined text-2xl text-emerald mb-1">receipt_long</span>
                <span class="font-semibold text-xs text-slate-900 dark:text-white">My Orders</span>
                <span class="text-[10px] text-slate-500">Live Tracking</span>
            </a>

            <!-- 2. Current Address -->
            <button type="button" onclick="window.openAddressModal()" class="bg-surface border border-border rounded-xl p-3 shadow-xs text-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col items-center cursor-pointer" title="Change Hostel Room">
                <span class="material-symbols-outlined text-2xl text-emerald mb-1">location_on</span>
                <span class="font-semibold text-xs text-slate-900 dark:text-white" id="settings-hostel-name">${currentHostel} (${currentBlock})</span>
                <span class="text-[10px] text-slate-500 truncate max-w-[120px]" id="settings-room-label">Room ${currentRoom || 'Not set'}</span>
            </button>

            <!-- 3. Coupons Modal -->
            <button type="button" onclick="window.openCouponsModal()" class="bg-surface border border-border rounded-xl p-3 shadow-xs text-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col items-center cursor-pointer" title="View Active Promo Codes">
                <span class="material-symbols-outlined text-2xl text-amber-500 mb-1">local_offer</span>
                <span class="font-semibold text-xs text-slate-900 dark:text-white">Coupons</span>
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">2 Active</span>
            </button>

            <!-- 4. Campus Help Modal -->
            <button type="button" onclick="window.openCampusHelpModal()" class="bg-surface border border-border rounded-xl p-3 shadow-xs text-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex flex-col items-center cursor-pointer" title="Campus Support">
                <span class="material-symbols-outlined text-2xl text-emerald mb-1">support_agent</span>
                <span class="font-semibold text-xs text-slate-900 dark:text-white">Campus Help</span>
                <span class="text-[10px] text-emerald font-semibold">24/7 Helpline</span>
            </button>
        </div>

        <!-- App Preferences -->
        <div class="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white pb-2 border-b border-border">Preferences</h3>
            
            <!-- Discreet Packaging -->
            <div class="flex items-center justify-between py-1">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base text-slate-500">visibility_off</span>
                        <span class="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Discreet Packaging</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Pack items in opaque tamper-proof bags for privacy.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer" id="toggle-discreet">
                    <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>

            <!-- Dark Theme -->
            <div class="flex items-center justify-between py-1 border-t border-border pt-3">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base text-slate-500">dark_mode</span>
                        <span class="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Night Shift Dark Mode</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Comfortable low-glare view for late night orders.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" id="toggle-darkmode">
                    <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>

            <!-- Notifications -->
            <div class="flex items-center justify-between py-1 border-t border-border pt-3">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-base text-slate-500">notifications_active</span>
                        <span class="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Hostel Arrival Notification</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Instant ping when runner reaches your hostel corridor.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer">
                    <div class="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>
        </div>

        <!-- About & Sign Out -->
        <div class="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
                <p class="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">LPUQuick v1.0.0</p>
                <p class="text-[11px] text-slate-500">Ultra-fast campus quick-commerce for LPU students.</p>
            </div>
            ${isLoggedIn ? `
            <button type="button" onclick="document.getElementById('btn-sign-out')?.click()" class="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-400 font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-sm">logout</span>
                Sign Out
            </button>
            ` : ''}
        </div>
    </main>

    <!-- Campus Help Modal -->
    <div id="campus-help-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs hidden flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl max-w-sm w-full p-5 shadow-xl border border-border space-y-3.5" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-border pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xl">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Campus Support</h3>
                        <p class="text-[10px] text-slate-500">BH13 Store Managers & Help</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCampusHelpModal()" class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2.5">
                <!-- Manager 1 -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border space-y-2">
                    <div>
                        <h4 class="font-semibold text-xs text-slate-900 dark:text-white">BH13 Store Manager (Desk 1)</h4>
                        <p class="text-[10px] text-slate-500">Order status & delivery queries</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="tel:7671836211" class="flex-1 bg-emerald text-white text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 hover:bg-emerald-600 transition-colors shadow-xs">
                            <span class="material-symbols-outlined text-xs">call</span>
                            <span>Call 7671836211</span>
                        </a>
                        <a href="https://wa.me/917671836211?text=Hi%20Store%20Manager%2C%20I%20need%20help%20with%20my%20LPUQuick%20order" target="_blank" class="bg-[#25D366] text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-opacity shadow-xs">
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                <!-- Manager 2 -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border space-y-2">
                    <div>
                        <h4 class="font-semibold text-xs text-slate-900 dark:text-white">BH13 Store Manager (Desk 2)</h4>
                        <p class="text-[10px] text-slate-500">Stock & runner dispatch</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="tel:9877982857" class="flex-1 bg-slate-800 text-white text-xs font-semibold py-2 px-2.5 rounded-lg flex items-center justify-center gap-1 hover:bg-slate-700 transition-colors shadow-xs">
                            <span class="material-symbols-outlined text-xs">call</span>
                            <span>Call 9877982857</span>
                        </a>
                        <a href="https://wa.me/919877982857?text=Hi%20Store%20Manager%2C%20I%20have%20an%20order%20query" target="_blank" class="bg-[#25D366] text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-opacity shadow-xs">
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Coupons Modal -->
    <div id="settings-coupons-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs hidden flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl max-w-sm w-full p-5 shadow-xl border border-border space-y-3.5" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-border pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                        <span class="material-symbols-outlined text-xl">local_offer</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Active Coupons</h3>
                        <p class="text-[10px] text-slate-500">Campus discounts for BH13</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCouponsModal()" class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2">
                <!-- Coupon 1 -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-emerald-500 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-bold text-emerald tracking-wider bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">LPUWELCOME</span>
                            <span class="text-[10px] font-semibold text-slate-800 dark:text-slate-200">5% FLAT OFF</span>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-0.5">Orders above ₹350</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('LPUWELCOME'); alert('✓ Coupon LPUWELCOME copied to clipboard!'); window.closeCouponsModal();" class="bg-emerald text-white text-xs font-semibold px-2.5 py-1 rounded-md hover:bg-emerald-600 transition-colors cursor-pointer">
                        Copy
                    </button>
                </div>

                <!-- Coupon 2 -->
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-amber-500 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-bold text-amber-600 tracking-wider bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">NIGHTMUNCH</span>
                            <span class="text-[10px] font-semibold text-slate-800 dark:text-slate-200">FREE DELIVERY</span>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-0.5">Free delivery after 10 PM</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('NIGHTMUNCH'); alert('✓ Coupon NIGHTMUNCH copied to clipboard!'); window.closeCouponsModal();" class="bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md hover:bg-amber-600 transition-colors cursor-pointer">
                        Copy
                    </button>
                </div>
            </div>
        </div>
    </div>

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
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-medium mt-0.5">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-medium mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.openCampusHelpModal = function() {
    const modal = document.getElementById('campus-help-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeCampusHelpModal = function() {
    const modal = document.getElementById('campus-help-modal');
    if (modal) modal.classList.add('hidden');
};

window.openCouponsModal = function() {
    const modal = document.getElementById('settings-coupons-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeCouponsModal = function() {
    const modal = document.getElementById('settings-coupons-modal');
    if (modal) modal.classList.add('hidden');
};

window.pageInits.settings = function() {
    const darkToggle = document.getElementById('toggle-darkmode');
    if (darkToggle) {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
        darkToggle.checked = isDark;
        darkToggle.onchange = () => {
            if (darkToggle.checked) {
                if (typeof window.setNightMode === 'function') window.setNightMode();
                else {
                    document.documentElement.classList.add('dark');
                    document.body?.classList.add('dark');
                    localStorage.setItem('lpuquick_theme', 'dark');
                }
            } else {
                if (typeof window.setLightMode === 'function') window.setLightMode();
                else {
                    document.documentElement.classList.remove('dark');
                    document.body?.classList.remove('dark');
                    localStorage.setItem('lpuquick_theme', 'light');
                }
            }
        };
    }

    document.getElementById('btn-sign-out')?.addEventListener('click', () => {
        if (typeof window.logoutUser === 'function') {
            window.logoutUser();
        } else {
            localStorage.clear();
            window.location.hash = '#/signin';
        }
    });
};

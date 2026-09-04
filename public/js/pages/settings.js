// Settings & Student Profile Page — Glassmorphism, Claymorphism & Liquid Glass Aesthetics
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
    <!-- TopAppBar with Specular Liquid Glass -->
    <header class="px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 glass-panel z-40 border-b border-[var(--glass-border)]">
        <div class="flex items-center gap-3">
            <a href="#/" class="clay-pill w-10 h-10 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95">
                <span class="material-symbols-outlined text-xl">arrow_back</span>
            </a>
            <div>
                <h1 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">Profile & Preferences</h1>
                <p class="text-[11px] text-slate-500 font-medium">Campus account & delivery settings</p>
            </div>
        </div>
        ${isLoggedIn ? `
        <button type="button" id="btn-sign-out" class="clay-pill px-3.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold" title="Sign Out">
            <span class="material-symbols-outlined text-base">logout</span>
            <span class="hidden sm:inline">Sign Out</span>
        </button>
        ` : `
        <a href="#/signin" class="clay-btn clay-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform">
            <span class="material-symbols-outlined text-xs">login</span>
            <span>Sign In</span>
        </a>
        `}
    </header>

    <main class="px-4 sm:px-6 max-w-3xl mx-auto pt-6 space-y-5">
        <!-- User Profile Claymorphic ID Card -->
        <div class="clay-card rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            ${userPicture ? `
            <div class="relative">
                <img src="${userPicture}" alt="${userName}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0">
                <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                    <span class="material-symbols-outlined text-[10px]">check</span>
                </div>
            </div>
            ` : `
            <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl clay-btn-primary text-white text-2xl font-black flex items-center justify-center shadow-lg shrink-0">
                ${initial}
            </div>
            `}
            <div class="flex-1 space-y-1.5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">${userName}</h2>
                    ${isLoggedIn ? `
                    <span class="liquid-badge text-[11px] font-bold px-3 py-0.5 shadow-sm inline-flex items-center gap-1 mx-auto sm:mx-0">
                        <span class="material-symbols-outlined text-xs">verified</span> Verified Student
                    </span>
                    ` : `
                    <a href="#/signin" class="clay-pill text-[11px] text-amber-600 dark:text-amber-400 font-bold px-3 py-0.5 mx-auto sm:mx-0 hover:scale-105 transition-transform">
                        <span>Sign In Now</span>
                    </a>
                    `}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                    <span class="material-symbols-outlined text-sm">mail</span> ${userEmail}
                </p>
                <p class="text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center sm:justify-start gap-1.5 font-semibold" id="profile-address-line">
                    <span class="material-symbols-outlined text-sm text-emerald">location_on</span>
                    <span>${currentDetail}</span>
                </p>
            </div>
        </div>

        <!-- Campus Quick Actions (Tactile Clay Cards) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <!-- 1. My Orders -->
            <a href="#/orders" class="clay-card rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center group">
                <div class="w-10 h-10 rounded-xl clay-pill text-emerald-500 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <span class="font-bold text-xs text-slate-900 dark:text-white">My Orders</span>
                <span class="text-[10px] text-slate-400 font-medium">Live Tracking</span>
            </a>

            <!-- 2. Current Address -->
            <button type="button" onclick="window.openAddressModal()" class="clay-card rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group" title="Change Hostel Room">
                <div class="w-10 h-10 rounded-xl clay-pill text-emerald-500 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-xl">location_on</span>
                </div>
                <span class="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[110px]" id="settings-hostel-name">${currentHostel} (${currentBlock})</span>
                <span class="text-[10px] text-slate-400 font-medium truncate max-w-[110px]" id="settings-room-label">Room ${currentRoom || 'Not set'}</span>
            </button>

            <!-- 3. Coupons Modal -->
            <button type="button" onclick="window.openCouponsModal()" class="clay-card rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group" title="View Active Promo Codes">
                <div class="w-10 h-10 rounded-xl clay-pill text-amber-500 flex items-center justify-center mb-2 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-xl">local_offer</span>
                </div>
                <span class="font-bold text-xs text-slate-900 dark:text-white">Coupons</span>
                <span class="text-[10px] text-amber-500 font-bold">2 Active</span>
            </button>

            <!-- 4. Campus Help Modal -->
            <button type="button" onclick="window.openCampusHelpModal()" class="clay-card rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group" title="Campus Support">
                <div class="w-10 h-10 rounded-xl clay-pill text-emerald-500 flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-xl">support_agent</span>
                </div>
                <span class="font-bold text-xs text-slate-900 dark:text-white">Campus Help</span>
                <span class="text-[10px] text-emerald-500 font-bold">24/7 Helpline</span>
            </button>
        </div>

        <!-- App Preferences (Frosted Glass Panel with Tactile Clay Switches) -->
        <div class="glass-panel rounded-3xl p-5 sm:p-6 border border-[var(--glass-border)] shadow-md space-y-4">
            <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white pb-2.5 border-b border-[var(--glass-border)] tracking-tight">Preferences</h3>
            
            <!-- Discreet Packaging -->
            <div class="flex items-center justify-between py-1">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-400">visibility_off</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Discreet Packaging</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Pack snacks & personal items in opaque tamper-proof bags for privacy.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer" id="toggle-discreet">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>

            <!-- Dark Theme -->
            <div class="flex items-center justify-between py-1 border-t border-[var(--glass-border)] pt-3.5">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-400">dark_mode</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Night Shift Dark Mode</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Comfortable deep liquid-glass theme for late night hostel studying.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" id="toggle-darkmode">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>

            <!-- Notifications -->
            <div class="flex items-center justify-between py-1 border-t border-[var(--glass-border)] pt-3.5">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-400">notifications_active</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Hostel Arrival Notification</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">Instant vibration ping when runner reaches your corridor floor.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer">
                    <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>
        </div>

        <!-- App Info Card -->
        <div class="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div>
                <p class="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">LPUQuick v2.0 Liquid Edition</p>
                <p class="text-[11px] text-slate-500">Ultra-fast campus quick-commerce with Glassmorphism & Claymorphism.</p>
            </div>
            ${isLoggedIn ? `
            <button type="button" onclick="document.getElementById('btn-sign-out')?.click()" class="clay-pill px-4 py-2 text-rose-600 dark:text-rose-400 font-bold text-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-sm">logout</span>
                Sign Out
            </button>
            ` : ''}
        </div>
    </main>

    <!-- Campus Help Modal -->
    <div id="campus-help-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex items-center justify-center p-4">
        <div class="glass-panel rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--glass-border)] space-y-4 animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <div class="flex items-center gap-2.5">
                    <span class="clay-pill w-9 h-9 rounded-xl text-emerald-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-black text-sm text-slate-900 dark:text-white tracking-tight">Campus Support</h3>
                        <p class="text-[10px] text-slate-400 font-medium">BH13 Store Managers & Help</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCampusHelpModal()" class="clay-pill w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-3">
                <!-- Manager 1 -->
                <div class="clay-card p-3.5 rounded-2xl space-y-2.5">
                    <div>
                        <h4 class="font-bold text-xs text-slate-900 dark:text-white">BH13 Store Manager (Desk 1)</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">Order status & delivery queries</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="tel:7671836211" class="flex-1 clay-btn clay-btn-primary text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm">
                            <span class="material-symbols-outlined text-xs">call</span>
                            <span>Call 7671836211</span>
                        </a>
                        <a href="https://wa.me/917671836211?text=Hi%20Store%20Manager%2C%20I%20need%20help%20with%20my%20LPUQuick%20order" target="_blank" class="clay-pill bg-[#25D366] text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-sm">
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                <!-- Manager 2 -->
                <div class="clay-card p-3.5 rounded-2xl space-y-2.5">
                    <div>
                        <h4 class="font-bold text-xs text-slate-900 dark:text-white">BH13 Store Manager (Desk 2)</h4>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400">Stock & runner dispatch</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="tel:9877982857" class="flex-1 clay-btn text-slate-800 dark:text-white bg-slate-800 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm">
                            <span class="material-symbols-outlined text-xs">call</span>
                            <span>Call 9877982857</span>
                        </a>
                        <a href="https://wa.me/919877982857?text=Hi%20Store%20Manager%2C%20I%20have%20an%20order%20query" target="_blank" class="clay-pill bg-[#25D366] text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-sm">
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Coupons Modal -->
    <div id="settings-coupons-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-md hidden flex items-center justify-center p-4">
        <div class="glass-panel rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[var(--glass-border)] space-y-4 animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-[var(--glass-border)] pb-3">
                <div class="flex items-center gap-2.5">
                    <span class="clay-pill w-9 h-9 rounded-xl text-amber-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg">local_offer</span>
                    </span>
                    <div>
                        <h3 class="font-black text-sm text-slate-900 dark:text-white tracking-tight">Active Coupons</h3>
                        <p class="text-[10px] text-slate-400 font-medium">Campus discounts for BH13</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCouponsModal()" class="clay-pill w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2.5">
                <!-- Coupon 1 -->
                <div class="clay-card p-3.5 rounded-2xl border border-dashed border-emerald-500/50 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-emerald tracking-wider clay-pill px-2 py-0.5">LPUWELCOME</span>
                            <span class="text-[10px] font-bold text-slate-800 dark:text-slate-200">5% FLAT OFF</span>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-1 font-medium">Orders above ₹350</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('LPUWELCOME'); alert('✓ Coupon LPUWELCOME copied to clipboard!'); window.closeCouponsModal();" class="clay-btn clay-btn-primary text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform cursor-pointer">
                        Copy
                    </button>
                </div>

                <!-- Coupon 2 -->
                <div class="clay-card p-3.5 rounded-2xl border border-dashed border-amber-500/50 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-amber-500 tracking-wider clay-pill px-2 py-0.5">NIGHTMUNCH</span>
                            <span class="text-[10px] font-bold text-slate-800 dark:text-slate-200">FREE DELIVERY</span>
                        </div>
                        <p class="text-[10px] text-slate-500 mt-1 font-medium">Free delivery after 10 PM</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('NIGHTMUNCH'); alert('✓ Coupon NIGHTMUNCH copied to clipboard!'); window.closeCouponsModal();" class="clay-btn bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform cursor-pointer">
                        Copy
                    </button>
                </div>
            </div>
        </div>
    </div>

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
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer relative" href="#/cart" title="Cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2.5 bg-emerald text-white text-[9px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="text-[10px] font-semibold mt-0.5">Cart</span>
            </a>
            <a class="clay-pill flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 px-3.5 py-1 cursor-pointer font-bold" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] mt-0.5 font-bold">Orders</span>
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

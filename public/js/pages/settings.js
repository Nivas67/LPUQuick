// Settings & Profile Page — Complete Ground-Up Refreshing Redesign (Digital Student Campus Pass & Tactile Preferences)
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
    <!-- Floating Dynamic Island Header -->
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Profile & Preferences</h1>
                    <p class="text-[10px] text-slate-500 font-semibold">Campus account & hostel settings</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button type="button" onclick="window.showInstallPrompt()" class="btn-install-app clay-pill px-3 py-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-transform active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-black shadow-xs" title="Install LPUQuick App">
                    <span class="material-symbols-outlined text-sm">download</span>
                    <span>Install App</span>
                </button>
                ${isLoggedIn ? `
                <button type="button" id="btn-sign-out" class="clay-pill px-3 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition-transform active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-black" title="Sign Out">
                    <span class="material-symbols-outlined text-sm">logout</span>
                    <span class="hidden sm:inline">Sign Out</span>
                </button>
                ` : `
                <a href="#/signin" class="clay-btn clay-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 active:scale-95 transition-transform">
                    <span class="material-symbols-outlined text-xs">login</span>
                    <span>Sign In</span>
                </a>
                `}
            </div>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-3xl mx-auto pt-5 space-y-5">
        <!-- Digital Student Campus Pass (Apple Wallet / VisionOS Depth) -->
        <div class="student-pass-card rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[200px]">
            <div class="holographic-strip"></div>

            <div class="flex items-start justify-between relative z-10">
                <div class="flex items-center gap-3.5">
                    ${userPicture ? `
                    <div class="relative">
                        <img src="${userPicture}" alt="${userName}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl">
                        <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                            <span class="material-symbols-outlined text-[10px]">check</span>
                        </div>
                    </div>
                    ` : `
                    <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-600 dark:bg-emerald-500/30 border border-emerald-500/40 text-white text-2xl font-black flex items-center justify-center shadow-xl">
                        ${initial}
                    </div>
                    `}
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">${userName}</h2>
                            ${isLoggedIn ? `
                            <span class="liquid-badge text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 border border-emerald-400/40">Verified</span>
                            ` : ''}
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-0.5 flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm text-emerald-600 dark:text-emerald-400">mail</span>
                            <span>${userEmail}</span>
                        </p>
                    </div>
                </div>

                <div class="text-right">
                    <span class="text-[9px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-black block">Campus Pass</span>
                    <span class="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">LPU-BH13</span>
                </div>
            </div>

            <div class="pt-4 mt-4 border-t border-slate-200/90 dark:border-white/15 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 font-bold" id="profile-address-line">
                    <span class="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">location_on</span>
                    <span>${currentDetail}</span>
                </div>
                <div class="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                    Corridor Dispatch · 3 Min Delivery
                </div>
            </div>
        </div>

        <!-- Campus Quick Action Pedestal Tiles -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <!-- 1. My Orders -->
            <a href="#/orders" class="glass-panel card-pedestal rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center group shadow-md border border-[var(--glass-border)]">
                <div class="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                    <span class="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <span class="font-black text-xs text-slate-900 dark:text-white tracking-tight">My Orders</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Live Tracking</span>
            </a>

            <!-- 2. Current Address -->
            <button type="button" onclick="window.openAddressModal()" class="glass-panel card-pedestal rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group shadow-md border border-[var(--glass-border)]" title="Change Hostel Room">
                <div class="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                    <span class="material-symbols-outlined text-2xl">location_on</span>
                </div>
                <span class="font-black text-xs text-slate-900 dark:text-white truncate max-w-[110px] tracking-tight" id="settings-hostel-name">${currentHostel} (${currentBlock})</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[110px]" id="settings-room-label">Room ${currentRoom || 'Not set'}</span>
            </button>

            <!-- 3. Coupons Modal -->
            <button type="button" onclick="window.openCouponsModal()" class="glass-panel card-pedestal rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group shadow-md border border-[var(--glass-border)]" title="View Active Promo Codes">
                <div class="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                    <span class="material-symbols-outlined text-2xl">local_offer</span>
                </div>
                <span class="font-black text-xs text-slate-900 dark:text-white tracking-tight">Coupons</span>
                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-black">2 Active Offers</span>
            </button>

            <!-- 4. Campus Help Modal -->
            <button type="button" onclick="window.openCampusHelpModal()" class="glass-panel card-pedestal rounded-2xl p-4 text-center hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center cursor-pointer group shadow-md border border-[var(--glass-border)]" title="Campus Support">
                <div class="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                    <span class="material-symbols-outlined text-2xl">support_agent</span>
                </div>
                <span class="font-black text-xs text-slate-900 dark:text-white tracking-tight">Campus Help</span>
                <span class="text-[10px] text-purple-600 dark:text-purple-400 font-black">24/7 Helpline</span>
            </button>
        </div>

        <!-- App Preferences (Frosted Glass Panel with Tactile Clay Switches) -->
        <div class="glass-panel card-pedestal rounded-3xl p-5 sm:p-6 border border-[var(--glass-border)] shadow-xl space-y-4">
            <h3 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white pb-3 border-b border-[var(--glass-border)] tracking-tight">Preferences</h3>
            
            <!-- Discreet Packaging -->
            <div class="flex items-center justify-between py-1">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">visibility_off</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Discreet Packaging</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Pack snacks & personal items in opaque tamper-proof bags for privacy.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer" id="toggle-discreet">
                    <div class="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>

            <!-- Dark Theme -->
            <div class="flex items-center justify-between py-1 border-t border-[var(--glass-border)] pt-3.5">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">dark_mode</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Night Shift Dark Mode</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Comfortable deep liquid-glass theme for late night hostel studying.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" id="toggle-darkmode">
                    <div class="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>

            <!-- Notifications -->
            <div class="flex items-center justify-between py-1 border-t border-[var(--glass-border)] pt-3.5">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-slate-500 dark:text-slate-400">notifications_active</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Runner Arrival Audio Ping</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Sound subtle notification bell when corridor runner reaches your floor.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer" id="toggle-notifications">
                    <div class="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald shadow-inner"></div>
                </label>
            </div>

            <!-- Install LPUQuick App Option -->
            <div class="flex items-center justify-between py-1 border-t border-[var(--glass-border)] pt-3.5" id="settings-install-row">
                <div class="space-y-0.5 max-w-[70%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-emerald-600 dark:text-emerald-400">install_mobile</span>
                        <span class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Install LPUQuick App</span>
                        <span class="liquid-badge text-[9px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-1.5 py-0.2 border border-emerald-400/40">PWA</span>
                    </div>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Add to phone home screen for 1-tap 3-min ordering & offline speed.</p>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="window.showInstallPrompt()" class="btn-install-app clay-btn clay-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-white cursor-pointer" title="Install LPUQuick App">
                        <span class="material-symbols-outlined text-sm">download</span>
                        <span>Install</span>
                    </button>
                    <span id="settings-install-status" class="hidden text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">Installed</span>
                </div>
            </div>
        </div>

        <!-- Campus Dark Store Status -->
        <div class="glass-panel card-pedestal rounded-3xl p-5 border border-[var(--glass-border)] flex items-center justify-between shadow-md">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">storefront</span>
                </div>
                <div>
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white">BH13 Campus Dark Store</h4>
                    <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Open & Dispatching (24/7)
                    </p>
                </div>
            </div>
            <span class="liquid-badge text-[10px] font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 border border-slate-200 dark:border-slate-700">v2.4 Pro</span>
        </div>

        <!-- Admin Management Portal Quick Link -->
        <div class="glass-panel card-pedestal rounded-3xl p-5 border border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-between shadow-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 hover:border-emerald-500/60 transition-all">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                    <span class="material-symbols-outlined text-xl">admin_panel_settings</span>
                </div>
                <div>
                    <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        Admin Portal
                        <span class="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md">Live Control</span>
                    </h4>
                    <p class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Manage inventory, monitor riders, orders & analytics</p>
                </div>
            </div>
            <a href="/admin" target="_blank" rel="noopener noreferrer" class="clay-btn clay-btn-primary px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer">
                <span>Open Admin</span>
                <span class="material-symbols-outlined text-sm">open_in_new</span>
            </a>
        </div>
    </main>

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
            <a class="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 px-3 py-1 hover:text-emerald transition-colors cursor-pointer" href="#/orders" title="Orders">
                <span class="material-symbols-outlined text-xl">receipt_long</span>
                <span class="text-[10px] font-semibold mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.settings = function() {
    // Theme toggle init
    const themeToggle = document.getElementById('toggle-darkmode');
    if (themeToggle) {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('lpuquick_theme') === 'dark';
        themeToggle.checked = isDark;
        themeToggle.onchange = () => {
            if (typeof window.toggleTheme === 'function') {
                window.toggleTheme();
            } else {
                if (themeToggle.checked) {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('lpuquick_theme', 'dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('lpuquick_theme', 'light');
                }
            }
        };
    }

    // Sign out button
    const signOutBtn = document.getElementById('btn-sign-out');
    if (signOutBtn) {
        signOutBtn.onclick = () => {
            if (typeof window.logoutUser === 'function') {
                window.logoutUser();
            } else {
                localStorage.removeItem('lpuquick_user');
                window.CURRENT_USER_ID = null;
                window.location.hash = '#/';
                if (window.router) window.router();
            }
        };
    }

    // Refresh PWA install status badge & button
    if (typeof window.updateInstallUIState === 'function') {
        window.updateInstallUIState();
    }
};

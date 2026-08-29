// Settings & Student Profile Page — Interactive Address & Campus Help
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.settings = async function() {
    const userName = window.CURRENT_USER_NAME || 'Nivas Naidu';
    const userEmail = window.CURRENT_USER_EMAIL || 'nivasnaidu07@gmail.com';
    const userPicture = window.CURRENT_USER_PICTURE || '';
    const initial = userName ? userName[0].toUpperCase() : 'N';

    const currentHostel = window.currentAddress || 'BH13';
    const currentBlock = window.currentBlock || 'Block A';
    const currentRoom = window.currentRoom || '304';
    const currentDetail = window.currentAddressDetail || `Room ${currentRoom}, ${currentBlock}, ${currentHostel}`;

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Profile & Settings</h1>
        </div>
        <button type="button" id="btn-sign-out" class="p-2 hover:bg-error/15 rounded-full transition-colors text-error cursor-pointer flex items-center gap-1 text-xs font-bold" title="Sign Out">
            <span class="material-symbols-outlined text-sm">logout</span>
            <span class="hidden sm:inline">Sign Out</span>
        </button>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto pt-6 space-y-5">
        <!-- User Profile Card -->
        <div class="glass-card rounded-3xl p-5 sm:p-6 border border-glass-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            ${userPicture ? `
            <img src="${userPicture}" alt="${userName}" class="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover border-2 border-emerald shadow-md flex-shrink-0">
            ` : `
            <div class="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-tr from-emerald to-royal-purple text-white font-display text-xl sm:text-2xl font-bold flex items-center justify-center shadow-md flex-shrink-0">
                ${initial}
            </div>
            `}
            <div class="flex-1 space-y-1">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h2 class="font-headline-md text-lg sm:text-xl font-bold text-on-surface">${userName}</h2>
                    <span class="inline-flex items-center gap-1 text-[11px] bg-emerald/10 text-emerald font-bold px-3 py-0.5 rounded-full mx-auto sm:mx-0 border border-emerald/20">
                        <span class="material-symbols-outlined text-xs">verified</span> LPU Verified Student
                    </span>
                </div>
                <p class="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-sm">mail</span> ${userEmail}
                </p>
                <p class="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1" id="profile-address-line">
                    <span class="material-symbols-outlined text-sm text-emerald">location_on</span>
                    <span>${currentDetail}</span>
                </p>
            </div>
        </div>

        <!-- Campus Quick Actions (Interactive Address & 2-Number Help) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- 1. My Orders -->
            <a href="#/orders" class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 hover:border-emerald transition-all flex flex-col items-center group active:scale-95">
                <span class="material-symbols-outlined text-2xl text-emerald group-hover:scale-110 transition-transform mb-1.5">receipt_long</span>
                <span class="font-semibold text-xs text-on-surface">My Orders</span>
                <span class="text-[10px] text-on-surface-variant">Live Tracking</span>
            </a>

            <!-- 2. Current Address (Click to Open Address Picker Modal) -->
            <button type="button" onclick="window.openAddressModal()" class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 hover:border-emerald transition-all flex flex-col items-center cursor-pointer group active:scale-95" title="Change Hostel Room">
                <span class="material-symbols-outlined text-2xl text-royal-purple group-hover:scale-110 transition-transform mb-1.5">location_on</span>
                <span class="font-semibold text-xs text-on-surface" id="settings-hostel-name">${currentHostel} (${currentBlock})</span>
                <span class="text-[10px] text-on-surface-variant truncate max-w-[120px]" id="settings-room-label">Room ${currentRoom}</span>
            </button>

            <!-- 3. Coupons Modal -->
            <button type="button" onclick="window.openCouponsModal()" class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 hover:border-emerald transition-all flex flex-col items-center cursor-pointer group active:scale-95" title="View Active Promo Codes">
                <span class="material-symbols-outlined text-2xl text-amber-500 group-hover:scale-110 transition-transform mb-1.5">local_offer</span>
                <span class="font-semibold text-xs text-on-surface">Coupons</span>
                <span class="text-[10px] text-amber-500 font-bold">2 Active Offers</span>
            </button>

            <!-- 4. Campus Help Modal (7671836211 & 9877982857) -->
            <button type="button" onclick="window.openCampusHelpModal()" class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 hover:border-emerald transition-all flex flex-col items-center cursor-pointer group active:scale-95" title="Call or WhatsApp Campus Support">
                <span class="material-symbols-outlined text-2xl text-teal-600 group-hover:scale-110 transition-transform mb-1.5">support_agent</span>
                <span class="font-semibold text-xs text-on-surface">Campus Help</span>
                <span class="text-[10px] text-emerald font-bold">24/7 Helpline</span>
            </button>
        </div>

        <!-- Privacy & App Preferences -->
        <div class="glass-card rounded-3xl p-5 sm:p-6 border border-glass-border shadow-sm space-y-4">
            <h3 class="font-bold text-sm sm:text-base text-on-surface">App Preferences</h3>
            
            <!-- Sensitive Items Privacy Toggle -->
            <div class="flex items-center justify-between py-2 border-b border-surface-variant/30">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-primary">visibility_off</span>
                        <span class="font-semibold text-xs sm:text-sm text-on-surface">Discreet Delivery & Packaging</span>
                    </div>
                    <p class="text-[11px] text-on-surface-variant">Conceal items in opaque tamper-proof bags for personal & pharmacy goods.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer" id="toggle-discreet">
                    <div class="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>

            <!-- Dark Mode Toggle -->
            <div class="flex items-center justify-between py-2 border-b border-surface-variant/30">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-primary">dark_mode</span>
                        <span class="font-semibold text-xs sm:text-sm text-on-surface">Night Shift Dark Theme</span>
                    </div>
                    <p class="text-[11px] text-on-surface-variant">Comfortable high contrast view for late night hostel orders.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" id="toggle-darkmode">
                    <div class="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>

            <!-- Instant Notifications -->
            <div class="flex items-center justify-between py-2">
                <div class="space-y-0.5 max-w-[80%]">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-base text-primary">notifications_active</span>
                        <span class="font-semibold text-xs sm:text-sm text-on-surface">Hostel Gate Arrival Ping</span>
                    </div>
                    <p class="text-[11px] text-on-surface-variant">Live notification as soon as walker reaches ${currentHostel} wing.</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked class="sr-only peer">
                    <div class="w-10 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald"></div>
                </label>
            </div>
        </div>

        <!-- About & Sign Out -->
        <div class="glass-card rounded-3xl p-5 border border-glass-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
                <p class="font-bold text-xs sm:text-sm text-on-surface">LPUQuick v1.0.0 (Production Release)</p>
                <p class="text-[11px] text-on-surface-variant">Crafted with Calm Commerce principles for LPU campus students.</p>
            </div>
            <button type="button" onclick="document.getElementById('btn-sign-out')?.click()" class="bg-error/10 hover:bg-error/20 text-error font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-sm">logout</span>
                Sign Out
            </button>
        </div>
    </main>

    <!-- Campus Help Modal (Contacts: 7671836211 & 9877982857) -->
    <div id="campus-help-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="glass-card bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-glass-border space-y-4 animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-surface-variant/40 pb-3">
                <div class="flex items-center gap-2.5">
                    <span class="w-10 h-10 rounded-2xl bg-teal-500/15 text-teal-600 flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Campus Help & Support</h3>
                        <p class="text-[11px] text-on-surface-variant">BH13 Store Managers & 24/7 Support</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCampusHelpModal()" class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-3">
                <!-- Helpline 1: Store Manager 1 -->
                <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2.5">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">Store Manager</span>
                            <h4 class="font-bold text-sm text-on-surface mt-1">BH13 Store Manager</h4>
                            <p class="text-[11px] text-on-surface-variant">Instant order tracking & room delivery assistance</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 pt-1">
                        <a href="tel:7671836211" class="flex-1 bg-emerald hover:bg-primary text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>Call 7671836211</span>
                        </a>
                        <a href="https://wa.me/917671836211?text=Hi%20Store%20Manager%2C%20I%20need%20help%20with%20my%20LPUQuick%20order" target="_blank" class="bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all active:scale-95">
                            <span class="material-symbols-outlined text-sm">chat</span>
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                <!-- Helpline 2: Store Manager 2 -->
                <div class="p-4 rounded-2xl bg-surface-container-high border border-outline-variant/30 space-y-2.5">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-full">Store Manager</span>
                            <h4 class="font-bold text-sm text-on-surface mt-1">BH13 Store Manager</h4>
                            <p class="text-[11px] text-on-surface-variant">Stock, item replacements & walker dispatch</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 pt-1">
                        <a href="tel:9877982857" class="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95">
                            <span class="material-symbols-outlined text-sm">call</span>
                            <span>Call 9877982857</span>
                        </a>
                        <a href="https://wa.me/919877982857?text=Hi%20Store%20Manager%2C%20I%20have%20an%20order%20query" target="_blank" class="bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all active:scale-95">
                            <span class="material-symbols-outlined text-sm">chat</span>
                            <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                <!-- Store Hub Info -->
                <div class="p-3 bg-emerald/10 rounded-xl border border-emerald/20 flex items-start gap-2.5 text-xs text-on-surface">
                    <span class="material-symbols-outlined text-emerald text-base mt-0.5">storefront</span>
                    <div>
                        <span class="font-bold text-emerald">BH13 Dark Store Hub</span>
                        <p class="text-[11px] text-on-surface-variant mt-0.5">Ground Floor Wing A, Boys Hostel 13. Open daily 8:00 AM - 2:00 AM.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Coupons Modal -->
    <div id="settings-coupons-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="glass-card bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-glass-border space-y-4 animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-surface-variant/40 pb-3">
                <div class="flex items-center gap-2.5">
                    <span class="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-2xl">local_offer</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Active Student Coupons</h3>
                        <p class="text-[11px] text-on-surface-variant">Exclusive campus discounts for BH13</p>
                    </div>
                </div>
                <button type="button" onclick="window.closeCouponsModal()" class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2.5">
                <!-- Coupon 1: LPUWELCOME (5% FLAT OFF Above 350) -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-dashed border-emerald/60 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-emerald tracking-wider bg-emerald/15 px-2 py-0.5 rounded-md">LPUWELCOME</span>
                            <span class="text-[10px] font-bold text-on-surface">5% FLAT OFF</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-1">Get 5% discount on all orders above ₹350</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('LPUWELCOME'); alert('✓ Coupon LPUWELCOME (5% OFF above ₹350) copied to clipboard!'); window.closeCouponsModal();" class="bg-emerald text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-primary transition-all active:scale-95 cursor-pointer">
                        Copy
                    </button>
                </div>

                <!-- Coupon 2: NIGHTMUNCH -->
                <div class="p-3.5 rounded-2xl bg-surface-container-high border border-dashed border-amber-500/60 flex items-center justify-between gap-2">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-amber-500 tracking-wider bg-amber-500/15 px-2 py-0.5 rounded-md">NIGHTMUNCH</span>
                            <span class="text-[10px] font-bold text-on-surface">FREE DELIVERY</span>
                        </div>
                        <p class="text-[11px] text-on-surface-variant mt-1">Free 3-min runner delivery after 10:00 PM</p>
                    </div>
                    <button type="button" onclick="navigator.clipboard.writeText('NIGHTMUNCH'); alert('✓ Coupon NIGHTMUNCH copied to clipboard!'); window.closeCouponsModal();" class="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-amber-600 transition-all active:scale-95 cursor-pointer">
                        Copy
                    </button>
                </div>
            </div>
        </div>
    </div>

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
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

// Global Modals Setup for Campus Help & Coupons
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
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
                document.body.style.filter = 'none';
                localStorage.setItem('lpuquick_theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                document.body.classList.remove('dark');
                document.body.style.filter = 'none';
                localStorage.setItem('lpuquick_theme', 'light');
            }
        };
    }

    // Sign Out Handler
    document.getElementById('btn-sign-out')?.addEventListener('click', () => {
        localStorage.removeItem('lpuquick_user');
        window.CURRENT_USER_ID = 'user_001';
        window.CURRENT_USER_NAME = null;
        window.CURRENT_USER_EMAIL = null;
        window.CURRENT_USER_PICTURE = null;
        window.location.hash = '#/signin';
    });
};

// Settings Page — exact Stitch UI reproduction with user profile & toggles
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.settings = async function() {
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
        <a href="#/signin" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors text-error" title="Sign Out">
            <span class="material-symbols-outlined">logout</span>
        </a>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto pt-6 space-y-5">
        <!-- User Profile Card -->
        <div class="glass-card rounded-3xl p-5 sm:p-6 border border-glass-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div class="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-gradient-to-tr from-emerald to-royal-purple text-white font-display text-xl sm:text-2xl font-bold flex items-center justify-center shadow-md flex-shrink-0">
                N
            </div>
            <div class="flex-1 space-y-1">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h2 class="font-headline-md text-lg sm:text-xl font-bold text-on-surface">Nivas</h2>
                    <span class="inline-flex items-center gap-1 text-[11px] bg-emerald/10 text-emerald font-bold px-3 py-0.5 rounded-full mx-auto sm:mx-0">
                        <span class="material-symbols-outlined text-xs">verified</span> LPU Verified Student
                    </span>
                </div>
                <p class="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-sm">call</span> +91 7671836211
                </p>
                <p class="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-sm">mail</span> nivas@lpu.in
                </p>
                <p class="text-xs text-on-surface-variant flex items-center justify-center sm:justify-start gap-1">
                    <span class="material-symbols-outlined text-sm">cake</span> DOB: 04 Aug 2006
                </p>
            </div>
        </div>

        <!-- Campus Quick Actions -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a href="#/orders" class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 transition-all flex flex-col items-center">
                <span class="material-symbols-outlined text-2xl text-emerald mb-1.5">receipt_long</span>
                <span class="font-semibold text-xs text-on-surface">My Orders</span>
            </a>
            <div class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 transition-all flex flex-col items-center cursor-pointer">
                <span class="material-symbols-outlined text-2xl text-royal-purple mb-1.5">location_on</span>
                <span class="font-semibold text-xs text-on-surface">Hostel (BH2)</span>
            </div>
            <div class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 transition-all flex flex-col items-center cursor-pointer">
                <span class="material-symbols-outlined text-2xl text-amber-500 mb-1.5">local_offer</span>
                <span class="font-semibold text-xs text-on-surface">Coupons</span>
            </div>
            <div class="glass-card rounded-2xl p-3.5 border border-glass-border shadow-sm text-center hover:bg-surface-container-high/40 transition-all flex flex-col items-center cursor-pointer">
                <span class="material-symbols-outlined text-2xl text-teal-600 mb-1.5">support_agent</span>
                <span class="font-semibold text-xs text-on-surface">Campus Help</span>
            </div>
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
                    <p class="text-[11px] text-on-surface-variant">Live SMS / notification as soon as rider reaches BH2 security.</p>
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
            <a href="#/signin" class="bg-error/10 hover:bg-error/20 text-error font-semibold text-xs px-4 py-2 rounded-full transition-all flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">logout</span>
                Sign Out
            </a>
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
};

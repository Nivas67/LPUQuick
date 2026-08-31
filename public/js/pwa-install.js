/**
 * LPUQuick Unified PWA Installation Engine
 * Flawless install support for Android, iOS (iPhone/iPad), and Desktop
 */

(function () {
    let deferredPrompt = null;
    const DISMISS_KEY = 'lpuquick_install_dismissed_at';
    const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

    // 1. Device and Standalone State Detection
    function isStandaloneMode() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: fullscreen)').matches ||
            window.navigator.standalone === true ||
            document.referrer.includes('android-app://')
        );
    }

    function isIOSDevice() {
        const ua = window.navigator.userAgent;
        const isIPhoneOrIPad = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const isIPadOS = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
        return isIPhoneOrIPad || isIPadOS;
    }

    function isSafariBrowser() {
        const ua = window.navigator.userAgent;
        return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
    }

    function isAndroidDevice() {
        return /Android/i.test(window.navigator.userAgent);
    }

    // 2. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => {
                    console.log('[PWA] Service Worker registered successfully, scope:', reg.scope);
                })
                .catch((err) => {
                    console.warn('[PWA] Service Worker registration note:', err.message);
                });
        });
    }

    // 3. Listen for Chromium/Android 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default mini-infobar
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] Capture beforeinstallprompt event ready');
        updateInstallUIState(false);
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        console.log('[PWA] App successfully installed!');
        hideInstallBanner();
        updateInstallUIState(true);
        if (typeof window.showToast === 'function') {
            window.showToast('🎉 LPUQuick is installed! You can launch it from your home screen.', 'success');
        }
    });

    // 4. Update UI Buttons across views
    function updateInstallUIState(isInstalled) {
        const installed = isInstalled || isStandaloneMode();
        document.querySelectorAll('.btn-install-app').forEach((btn) => {
            if (installed) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });

        const statusBadge = document.getElementById('settings-install-status');
        if (statusBadge) {
            if (installed) {
                statusBadge.textContent = 'Installed';
                statusBadge.className = 'text-[11px] bg-emerald/15 text-emerald font-bold px-2.5 py-0.5 rounded-full border border-emerald/30';
            } else {
                statusBadge.textContent = 'Tap to Install';
                statusBadge.className = 'text-[11px] bg-amber-500/15 text-amber-500 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30';
            }
        }
    }

    // 5. Global Install Trigger
    window.showInstallPrompt = async function () {
        if (isStandaloneMode()) {
            if (typeof window.showToast === 'function') {
                window.showToast('✓ LPUQuick is already installed and running as an app!', 'success');
            } else {
                alert('LPUQuick is already installed and running as an app!');
            }
            return;
        }

        // Case A: Chromium / Android native prompt is ready
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    console.log('[PWA] User accepted installation prompt');
                    hideInstallBanner();
                } else {
                    console.log('[PWA] User dismissed installation prompt');
                }
                deferredPrompt = null;
            } catch (err) {
                console.warn('[PWA] Prompt error:', err);
                openGenericInstallModal();
            }
            return;
        }

        // Case B: Apple iOS (iPhone / iPad)
        if (isIOSDevice()) {
            openIosInstallModal();
            return;
        }

        // Case C: Android fallback (when deferredPrompt was already consumed or browser needs manual tap)
        if (isAndroidDevice()) {
            openAndroidInstallModal();
            return;
        }

        // Case D: Desktop / Other
        openGenericInstallModal();
    };

    // 6. iOS Installation Modal (Custom Apple UI with visual walkthrough)
    function openIosInstallModal() {
        closeAllInstallModals();

        const isSafari = isSafariBrowser();
        const modalHtml = `
        <div id="ios-install-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald/30 relative space-y-4">
                <!-- Close Button -->
                <button type="button" onclick="window.closeInstallModal()" class="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>

                <!-- Header -->
                <div class="flex items-center gap-3">
                    <img src="/logo.png" alt="LPUQuick" class="w-12 h-12 rounded-2xl shadow-md border border-emerald/20 flex-shrink-0">
                    <div>
                        <h3 class="font-bold text-base text-slate-900 dark:text-white">Install LPUQuick on iPhone</h3>
                        <p class="text-xs text-emerald font-semibold">⚡ Instant 3-Min Campus Delivery App</p>
                    </div>
                </div>

                ${!isSafari ? `
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                    <span class="material-symbols-outlined text-base shrink-0 mt-0.5">info</span>
                    <span>For the best experience on iOS, open <b>lpuquick.vercel.app</b> in <b>Safari</b>.</span>
                </div>
                ` : ''}

                <!-- Step-by-Step Instructions -->
                <div class="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                    <!-- Step 1 -->
                    <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div class="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-lg">ios_share</span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-900 dark:text-white">1. Tap the Share Button</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">At the bottom toolbar of Safari</p>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div class="w-8 h-8 rounded-xl bg-emerald text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-lg">add_box</span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-900 dark:text-white">2. Select 'Add to Home Screen'</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Scroll down the share sheet menu</p>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div class="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-lg">done</span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-900 dark:text-white">3. Tap 'Add' in Top Right</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">LPUQuick icon will appear on your Home Screen</p>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="window.closeInstallModal()" class="w-full py-2.5 bg-emerald text-white font-bold rounded-2xl text-xs shadow-md hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer">
                    Got it!
                </button>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 7. Android Manual Walkthrough Modal
    function openAndroidInstallModal() {
        closeAllInstallModals();

        const modalHtml = `
        <div id="android-install-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald/30 relative space-y-4">
                <!-- Close Button -->
                <button type="button" onclick="window.closeInstallModal()" class="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>

                <!-- Header -->
                <div class="flex items-center gap-3">
                    <img src="/logo.png" alt="LPUQuick" class="w-12 h-12 rounded-2xl shadow-md border border-emerald/20 flex-shrink-0">
                    <div>
                        <h3 class="font-bold text-base text-slate-900 dark:text-white">Install LPUQuick on Android</h3>
                        <p class="text-xs text-emerald font-semibold">⚡ One-Tap Fast Ordering App</p>
                    </div>
                </div>

                <!-- Steps -->
                <div class="space-y-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
                    <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div class="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-lg">more_vert</span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-900 dark:text-white">1. Tap the 3 Dots Menu (⋮)</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">At the top right corner of Chrome</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div class="w-8 h-8 rounded-xl bg-emerald text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span class="material-symbols-outlined text-lg">install_mobile</span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-slate-900 dark:text-white">2. Tap 'Install App' or 'Add to Home screen'</p>
                            <p class="text-[11px] text-slate-500 dark:text-slate-400">Installs seamlessly like a native Android APK</p>
                        </div>
                    </div>
                </div>

                <button type="button" onclick="window.closeInstallModal()" class="w-full py-2.5 bg-emerald text-white font-bold rounded-2xl text-xs shadow-md hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer">
                    Got it!
                </button>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 8. Generic / Desktop Modal
    function openGenericInstallModal() {
        closeAllInstallModals();

        const modalHtml = `
        <div id="generic-install-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald/30 relative space-y-4">
                <button type="button" onclick="window.closeInstallModal()" class="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>

                <div class="flex items-center gap-3">
                    <img src="/logo.png" alt="LPUQuick" class="w-12 h-12 rounded-2xl shadow-md border border-emerald/20 flex-shrink-0">
                    <div>
                        <h3 class="font-bold text-base text-slate-900 dark:text-white">Install LPUQuick App</h3>
                        <p class="text-xs text-emerald font-semibold">Campus Quick Commerce</p>
                    </div>
                </div>

                <div class="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <p class="font-semibold text-slate-900 dark:text-white">Install directly from your browser:</p>
                    <p>• <b>Desktop Chrome/Edge:</b> Click the Install icon <span class="inline-block align-middle font-bold text-emerald">⊕</span> in the right of the address bar.</p>
                    <p>• <b>Mobile (Android/iOS):</b> Use 'Add to Home screen' from your browser menu.</p>
                </div>

                <button type="button" onclick="window.closeInstallModal()" class="w-full py-2.5 bg-emerald text-white font-bold rounded-2xl text-xs shadow-md hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer">
                    Close
                </button>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    window.closeInstallModal = function () {
        closeAllInstallModals();
    };

    function closeAllInstallModals() {
        ['ios-install-modal', 'android-install-modal', 'generic-install-modal'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    // 9. Smart Floating Bottom Install Banner
    function showInstallBanner() {
        if (isStandaloneMode()) return;

        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY)) || 0;
        if (Date.now() - dismissedAt < DISMISS_DURATION_MS) {
            return; // Snoozed for 7 days
        }

        if (document.getElementById('pwa-floating-install-banner')) return;

        const bannerHtml = `
        <div id="pwa-floating-install-banner" class="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40 animate-slide-up transition-all duration-300">
            <div class="glass-card p-3 sm:p-3.5 rounded-3xl border border-emerald/50 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="/logo.png" alt="LPUQuick" class="w-10 h-10 rounded-2xl shadow-md border border-emerald/20 flex-shrink-0 object-contain">
                    <div class="truncate">
                        <div class="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                            <span>Install LPUQuick</span>
                            <span class="text-[10px] bg-emerald/15 text-emerald font-extrabold px-1.5 py-0.2 rounded-full">App</span>
                        </div>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            ⚡ 3-min deliveries with 1 tap from home screen
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onclick="window.showInstallPrompt()" class="bg-emerald text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-sm">download</span>
                        <span>Install</span>
                    </button>
                    <button type="button" onclick="window.dismissInstallBanner()" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors" title="Dismiss">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', bannerHtml);
    }

    function hideInstallBanner() {
        const el = document.getElementById('pwa-floating-install-banner');
        if (el) {
            el.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => el.remove(), 300);
        }
    }

    window.dismissInstallBanner = function () {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        hideInstallBanner();
    };

    // Initialize Auto-Banner after 3.5s delay
    setTimeout(() => {
        showInstallBanner();
        updateInstallUIState(false);
    }, 3500);

    // Initial check
    document.addEventListener('DOMContentLoaded', () => {
        updateInstallUIState(false);
    });
})();

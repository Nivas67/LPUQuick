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
        // 1. Query parameter check (e.g. ?app=android or ?source=pwa)
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('app') === 'android' || params.get('source') === 'pwa' || params.get('standalone') === 'true') {
                return true;
            }
        } catch (e) {}

        // 2. Official Android Native App Bridge & User-Agent
        const ua = window.navigator.userAgent || '';
        if (
            typeof window.LPUQuickNativeApp !== 'undefined' ||
            typeof window.AndroidApp !== 'undefined' ||
            ua.includes('LPUQuickAndroidApp') ||
            ua.includes('LPUQuickApp') ||
            (/\bwv\b/.test(ua) && /Android/i.test(ua))
        ) {
            return true;
        }

        // 3. Web PWA Standalone / Fullscreen Display Modes
        try {
            if (
                (window.matchMedia && (
                    window.matchMedia('(display-mode: standalone)').matches ||
                    window.matchMedia('(display-mode: fullscreen)').matches ||
                    window.matchMedia('(display-mode: minimal-ui)').matches ||
                    window.matchMedia('(display-mode: window-controls-overlay)').matches
                )) ||
                window.navigator.standalone === true ||
                (document.referrer && document.referrer.includes('android-app://'))
            ) {
                return true;
            }
        } catch (e) {}

        // 4. Stored In-App state
        try {
            if (localStorage.getItem('lpuquick_is_installed_app') === 'true') {
                return true;
            }
        } catch (e) {}

        return false;
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
                    // Force immediate update check on launch
                    try { reg.update(); } catch(e) {}
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
        applyInAppInstalledMode();
        hideInstallBanner();
        updateInstallUIState(true);
        if (typeof window.showToast === 'function') {
            window.showToast('🎉 LPUQuick is installed! You can launch it from your home screen.', 'success');
        }
    });

    // 4. Update UI Buttons across views
    function applyInAppInstalledMode() {
        try {
            localStorage.setItem('lpuquick_is_installed_app', 'true');
            document.documentElement.classList.add('is-installed-app');
            if (document.body) {
                document.body.classList.add('is-installed-app');
            }
        } catch (e) {}
    }

    function updateInstallUIState(isInstalled) {
        const installed = isInstalled || isStandaloneMode();
        if (installed) {
            applyInAppInstalledMode();
        }

        document.querySelectorAll('.btn-install-app').forEach((btn) => {
            if (installed) {
                btn.classList.add('hidden');
                btn.style.setProperty('display', 'none', 'important');
            } else {
                btn.classList.remove('hidden');
                btn.style.removeProperty('display');
            }
        });

        // Hide top smart banner on home page if in app
        const smartBanner = document.getElementById('home-mobile-smart-banner');
        if (smartBanner && installed) {
            smartBanner.remove();
        }

        // Hide settings install row if in app
        const settingsInstallRow = document.getElementById('settings-install-row');
        if (settingsInstallRow) {
            if (installed) {
                settingsInstallRow.classList.add('hidden');
                settingsInstallRow.style.setProperty('display', 'none', 'important');
            } else {
                settingsInstallRow.classList.remove('hidden');
                settingsInstallRow.style.removeProperty('display');
            }
        }

        const statusBadge = document.getElementById('settings-install-status');
        if (statusBadge) {
            if (installed) {
                statusBadge.classList.remove('hidden');
                statusBadge.textContent = 'Installed';
                statusBadge.className = 'text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800';
            } else {
                statusBadge.classList.add('hidden');
            }
        }
    }
    window.updateInstallUIState = updateInstallUIState;

    // 5. Global Install Trigger
    window.showInstallPrompt = async function () {
        if (isStandaloneMode()) {
            applyInAppInstalledMode();
            if (typeof window.showToast === 'function') {
                window.showToast('✓ LPUQuick is already installed and running as an app!', 'success');
            }
            return;
        }

        // Case A: Android & Mobile phones — Always show Real App & APK Installation Hub
        if (isAndroidDevice() || (!isIOSDevice() && window.innerWidth <= 768)) {
            openAndroidInstallModal();
            return;
        }

        // Case B: Apple iOS (iPhone / iPad)
        if (isIOSDevice()) {
            openIosInstallModal();
            return;
        }

        // Case C: Desktop with native prompt ready
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
                    <img src="/logo.png" alt="LPUQuick" class="w-12 h-12 rounded-2xl shadow-md border border-emerald/20 flex-shrink-0 object-cover">
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

    // Native APK Downloader (Direct download of compiled 6.2 MB Android APK)
    window.downloadAndroidApk = function (event) {
        if (event) {
            try { event.stopPropagation(); } catch (e) {}
        }
        if (typeof window.showToast === 'function') {
            window.showToast('📥 Downloading LPUQuick.apk (6.2 MB)... Tap when finished to install!', 'success');
        }
        const a = document.createElement('a');
        a.href = '/download/LPUQuick.apk';
        a.download = 'LPUQuick.apk';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
    };

    // Open in external Google Chrome (Bypasses WhatsApp / Instagram in-app webview restriction)
    window.openInExternalChrome = function () {
        const fullUrl = window.location.href;
        const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}#Intent;scheme=https;package=com.android.chrome;end;`;
        window.location.href = chromeIntent;
        setTimeout(() => {
            window.location.href = fullUrl;
        }, 1500);
    };

    // Trigger direct Android WebAPK install prompt
    window.triggerNativeWebApk = async function () {
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    hideInstallBanner();
                    closeAllInstallModals();
                    if (typeof window.showToast === 'function') {
                        window.showToast('🎉 Installing LPUQuick App to your Android App Drawer...', 'success');
                    }
                }
                deferredPrompt = null;
                return;
            } catch (err) {
                console.warn('[PWA] Prompt execution note:', err);
            }
        }
        // If deferredPrompt is not yet ready, reveal the 1-Tap Chrome guide inside the modal
        const guideEl = document.getElementById('android-chrome-step-guide');
        if (guideEl) {
            guideEl.classList.remove('hidden');
            guideEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            window.downloadAndroidApk();
        }
    };

    // 7. Android Real Native App & APK Installation Hub
    function openAndroidInstallModal() {
        closeAllInstallModals();

        const ua = navigator.userAgent || '';
        const isInAppBrowser = /WhatsApp|Instagram|FBAN|FBAV|Line|Snapchat|Twitter/i.test(ua);

        const modalHtml = `
        <div id="android-install-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
            <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl border-2 border-emerald-500/40 relative space-y-4">
                <!-- Close Button -->
                <button type="button" onclick="window.closeInstallModal()" class="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Close">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <!-- Header Cluster -->
                <div class="flex items-center gap-3.5 pr-8">
                    <img src="/logo.png" alt="LPUQuick" style="width: 52px; height: 52px; min-width: 52px; min-height: 52px; object-fit: cover;" class="rounded-2xl shadow-lg border border-emerald-500/30 flex-shrink-0">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate">LPUQuick Mobile App</h3>
                            <span class="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full shrink-0">REAL APK</span>
                        </div>
                        <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 truncate">⚡ Official LPU 3-Min Campus App</p>
                        <div class="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                            <span>★ 4.9 Rating</span>
                            <span>•</span>
                            <span>~6.2 MB</span>
                            <span>•</span>
                            <span>v1.0.0 (Native)</span>
                        </div>
                    </div>
                </div>

                ${isInAppBrowser ? `
                <!-- WhatsApp / Instagram In-App Browser Warning & Bypass -->
                <div class="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                    <div class="flex items-start gap-2">
                        <span class="text-base shrink-0 mt-0.5">⚠️</span>
                        <span><b>In-App Browser Detected:</b> WhatsApp/Instagram blocks app installs and APK downloads.</span>
                    </div>
                    <button type="button" onclick="window.openInExternalChrome()" class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        <span>Open in Google Chrome</span>
                    </button>
                </div>
                ` : ''}

                <!-- Main Actions Grid -->
                <div class="space-y-2.5 pt-1">
                    <!-- Option 1: 1-Tap Native Install (WebAPK) -->
                    <button type="button" onclick="window.triggerNativeWebApk()" class="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 border border-emerald-400/40 group">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div class="min-w-0">
                                <div class="font-black text-sm flex items-center gap-1.5">
                                    <span>1-Tap Install (WebAPK)</span>
                                    <span class="text-[9px] bg-white text-emerald-700 font-extrabold px-1.5 py-0.2 rounded-full">FASTEST</span>
                                </div>
                                <p class="text-[11px] text-emerald-100 font-medium truncate mt-0.5">
                                    Installs to App Drawer • Zero file download
                                </p>
                            </div>
                        </div>
                        <svg class="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <!-- Chrome Direct 3-Step Walkthrough (Revealed if deferredPrompt isn't ready) -->
                    <div id="android-chrome-step-guide" class="hidden bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-200 space-y-2.5 animate-fade-in">
                        <div class="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-400">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                            <span>1-Tap Install in Google Chrome:</span>
                        </div>
                        <div class="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                            <div class="flex items-start gap-2">
                                <span class="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">1</span>
                                <span>Tap the <b>Chrome menu (⋮)</b> in top right corner.</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <span class="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">2</span>
                                <span>Tap <b>"Install app"</b> or <b>"Add to Home screen"</b>.</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <span class="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">3</span>
                                <span>Done! LPUQuick appears in your <b>App Drawer</b>.</span>
                            </div>
                        </div>
                    </div>

                    <!-- Option 2: Download Standalone Android APK File -->
                    <a href="/download/LPUQuick.apk" download="LPUQuick.apk" onclick="window.downloadAndroidApk(event)" class="w-full text-left p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-900 dark:text-white shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3 border border-slate-300 dark:border-slate-700 group block no-underline">
                        <div class="flex items-center gap-3 min-w-0">
                            <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0002 0-.5515.4482-.9997.9993-.9997.5516 0 .9998.4482.9998.9997 0 .5516-.4482 1.0002-.9998 1.0002m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0002 0-.5515.4482-.9997.9993-.9997.5516 0 .9998.4482.9998.9997 0 .5516-.4482 1.0002-.9998 1.0002m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.082 12 8.082s-3.5902.3296-5.1368.8677L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>
                            </div>
                            <div class="min-w-0">
                                <div class="font-black text-sm flex items-center gap-1.5">
                                    <span>Download Android APK</span>
                                    <span class="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-1.5 py-0.2 rounded-full border border-indigo-300 dark:border-indigo-800">~6.2 MB</span>
                                </div>
                                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                    Full native Android app package (Compiled & Signed)
                                </p>
                            </div>
                        </div>
                        <svg class="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>

                    <!-- Android Installation Guide Box -->
                    <div class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-slate-700 dark:text-slate-200 space-y-1.5">
                        <div class="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400">
                            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>How to Install on Android:</span>
                        </div>
                        <ol class="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-0.5 text-[10.5px]">
                            <li>If an earlier version is already on your phone, <b>uninstall it first</b>.</li>
                            <li>Tap <b>Download Android APK (~6.2 MB)</b> above.</li>
                            <li>Open the download, tap <b>Settings → Allow from this source</b> (if asked), then <b>Install</b>!</li>
                            <li>If Play Protect warns, tap <b>"More details" → "Install anyway"</b>.</li>
                        </ol>
                    </div>
                </div>

                <!-- 3-Step APK Installation Guide (Accordion / Help) -->
                <div class="pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        <span>100% Virus-Free & Verified for LPU</span>
                    </span>
                    <button type="button" onclick="window.closeInstallModal()" class="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer">
                        Close
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // 8. Generic / Desktop Modal
    function openGenericInstallModal() {
        closeAllInstallModals();

        const modalHtml = `
        <div id="generic-install-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
            <div class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl border-2 border-emerald-500/30 relative space-y-4">
                <button type="button" onclick="window.closeInstallModal()" class="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" title="Close">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div class="flex items-center gap-3 pr-8">
                    <img src="/logo.png" alt="LPUQuick" style="width: 52px; height: 52px; min-width: 52px; min-height: 52px; object-fit: cover;" class="rounded-2xl shadow-md border border-emerald-500/30 flex-shrink-0">
                    <div class="min-w-0">
                        <h3 class="font-black text-base text-slate-900 dark:text-white truncate">Install LPUQuick Real App</h3>
                        <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">⚡ Official Android & Desktop Application</p>
                    </div>
                </div>

                <div class="space-y-2.5 pt-1">
                    <button type="button" onclick="window.triggerNativeWebApk()" class="w-full text-left p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between gap-3 shadow-md active:scale-95 transition-all cursor-pointer">
                        <span class="flex items-center gap-2.5">
                            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>1-Tap Instant Installation</span>
                        </span>
                        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <a href="/download/LPUQuick.apk" onclick="window.downloadAndroidApk()" class="w-full text-left p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-between gap-3 border border-slate-300 dark:border-slate-700 active:scale-95 transition-all cursor-pointer block no-underline">
                        <span class="flex items-center gap-2.5">
                            <svg class="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0002 0-.5515.4482-.9997.9993-.9997.5516 0 .9998.4482.9998.9997 0 .5516-.4482 1.0002-.9998 1.0002m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0002 0-.5515.4482-.9997.9993-.9997.5516 0 .9998.4482.9998.9997 0 .5516-.4482 1.0002-.9998 1.0002m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.082 12 8.082s-3.5902.3296-5.1368.8677L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>
                            <span>Download Android APK (.apk file)</span>
                        </span>
                        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                </div>

                <div class="pt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Compatible with all Android phones & laptops</span>
                    <button type="button" onclick="window.closeInstallModal()" class="text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold cursor-pointer">
                        Dismiss
                    </button>
                </div>
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

    // 9. Smart Floating Mobile Install Banner
    function showInstallBanner() {
        if (isStandaloneMode()) return;

        // Check if user explicitly dismissed during this session
        if (sessionStorage.getItem('lpuquick_install_banner_dismissed') === 'true') {
            return;
        }

        if (document.getElementById('pwa-floating-install-banner')) return;

        const bannerHtml = `
        <div id="pwa-floating-install-banner" class="fixed bottom-[74px] sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-40 animate-slide-up transition-all duration-300">
            <div class="glass-card p-3 sm:p-3.5 rounded-2xl border-2 border-emerald-500/60 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl flex items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-2.5 min-w-0">
                    <img src="/logo.png" alt="LPUQuick" class="w-10 h-10 rounded-xl shadow-md border border-emerald-500/30 flex-shrink-0 object-cover">
                    <div class="truncate">
                        <div class="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                            <span class="text-xs">Install LPUQuick Real App</span>
                            <span class="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">REAL APK</span>
                        </div>
                        <p class="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                            ⚡ 1-Tap & APK Download for Mobiles
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                    <button type="button" onclick="window.showInstallPrompt()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
                        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>Install</span>
                    </button>
                    <button type="button" onclick="window.dismissInstallBanner()" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors" title="Dismiss">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', bannerHtml);
    }
    window.showInstallBanner = showInstallBanner;

    function hideInstallBanner() {
        const el = document.getElementById('pwa-floating-install-banner');
        if (el) {
            el.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => el.remove(), 300);
        }
    }

    window.dismissInstallBanner = function () {
        sessionStorage.setItem('lpuquick_install_banner_dismissed', 'true');
        hideInstallBanner();
    };

    // Initialize Auto-Banner promptly (400ms delay)
    setTimeout(() => {
        showInstallBanner();
        updateInstallUIState(false);
    }, 400);

    // Initial check
    document.addEventListener('DOMContentLoaded', () => {
        updateInstallUIState(false);
    });
})();

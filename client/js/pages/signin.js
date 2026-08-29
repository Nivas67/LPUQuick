// Sign In & Authentication Page — Dual Method: Real-Time Google & Direct Student Account
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.signin = async function() {
    return `
<div class="min-h-screen bg-background text-on-surface flex items-center justify-center font-display relative overflow-hidden py-10 px-4">
    
    <!-- Ambient Animated Background Lights -->
    <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald/20 blur-[120px] pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full bg-primary/20 blur-[140px] pointer-events-none animate-pulse" style="animation-duration: 4s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/10 blur-[100px] pointer-events-none"></div>

    <!-- Subtle Background Dot Grid -->
    <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#10B981 1.5px, transparent 1.5px); background-size: 24px 24px;"></div>

    <div class="relative z-10 w-full max-w-md mx-auto">
        
        <!-- Brand Header -->
        <div class="text-center mb-6 space-y-2">
            <a href="#/" class="inline-flex items-center justify-center gap-3 hover:scale-105 transition-transform duration-200 group">
                <div class="relative">
                    <div class="absolute -inset-1 rounded-full bg-emerald/30 blur-sm group-hover:bg-emerald/50 transition-all"></div>
                    <img src="/logo.png" alt="LPUQuick" class="relative w-14 h-14 rounded-full shadow-md object-contain bg-transparent">
                </div>
                <div class="text-left">
                    <span class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">LPUQuick</span>
                    <span class="block text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">Campus Express</span>
                </div>
            </a>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-xs font-bold shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald animate-ping"></span>
                <span>3-Minute BH13 Room Delivery</span>
            </div>
        </div>

        <!-- Glassmorphic Card -->
        <div class="glass-card bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/60 dark:border-slate-800 w-full transition-all duration-300 text-center space-y-5">
            
            <div class="space-y-1.5">
                <h2 class="text-2xl sm:text-3xl font-black text-on-surface">Welcome to LPUQuick</h2>
                <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
                    Sign in to order food, snacks & essentials delivered in 3 minutes.
                </p>
            </div>

            <!-- Cancellation / Status Banner (Hidden by default) -->
            <div id="auth-status-msg" class="hidden p-3 rounded-2xl text-xs font-medium border transition-all text-left"></div>

            <!-- Primary Method: Google Sign-In -->
            <div class="space-y-2 pt-1">
                <button class="w-full h-13 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/90 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald/60 rounded-2xl flex items-center justify-center gap-3 shadow-md hover:shadow-xl transition-all duration-200 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 active:scale-98 cursor-pointer group" type="button" id="btn-google">
                    <!-- Official Multi-Color Google G SVG -->
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span id="btn-google-text">Continue with Google</span>
                </button>
            </div>

            <!-- Visual Divider -->
            <div class="relative flex items-center justify-center my-3">
                <div class="border-t border-surface-variant/60 w-full"></div>
                <span class="bg-surface dark:bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/70 shrink-0">
                    or sign in with email
                </span>
                <div class="border-t border-surface-variant/60 w-full"></div>
            </div>

            <!-- Secondary Method: Direct Student Email & Password Form -->
            <form id="student-email-form" class="space-y-3 text-left">
                <div>
                    <label class="block text-[11px] font-bold text-on-surface mb-1" for="student-email">Student Email / ID</label>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">mail</span>
                        <input type="email" id="student-email" required placeholder="nivasnaidu07@gmail.com or student@lpu.in" class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface dark:bg-slate-800 text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald shadow-sm">
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-1">
                        <label class="block text-[11px] font-bold text-on-surface" for="student-password">Password</label>
                        <span class="text-[10px] text-emerald font-semibold">New student? Auto-registers</span>
                    </div>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">lock</span>
                        <input type="password" id="student-password" required value="student123" placeholder="••••••••" class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface dark:bg-slate-800 text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald shadow-sm">
                    </div>
                </div>

                <button type="submit" id="btn-student-submit" class="w-full bg-emerald text-white rounded-xl py-3 text-xs font-bold shadow-md hover:bg-primary transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 mt-2">
                    <span class="material-symbols-outlined text-sm">login</span>
                    <span>Sign In to Order</span>
                </button>
            </form>

            <!-- Single Sign-On Security Note -->
            <p class="text-[10px] text-on-surface-variant/70 pt-1">
                Secured exclusively for LPU Campus Students. Orders deliver directly to BH13 rooms.
            </p>

        </div>

        <!-- Campus Safety & Privacy Tagline -->
        <p class="text-center text-[11px] text-on-surface-variant/70 mt-6 flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-xs text-emerald">verified_user</span>
            <span>Secured exclusively for LPU Students & Faculty</span>
        </p>

    </div>
</div>
`;
};

window.pageInits.signin = function() {
    const clientId = window.GOOGLE_CLIENT_ID || '632433440395-jfth2leon5m6hntvgq217fkdnm2ch2ga.apps.googleusercontent.com';

    function resetGoogleButton() {
        const btn = document.getElementById('btn-google');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `
                <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
            `;
        }
    }

    function showStatusMessage(text, isError = false) {
        const box = document.getElementById('auth-status-msg');
        if (box) {
            box.classList.remove('hidden', 'bg-emerald/10', 'border-emerald/30', 'text-emerald', 'bg-amber-500/10', 'border-amber-500/30', 'text-amber-500', 'bg-error/10', 'border-error/30', 'text-error');
            if (isError) {
                box.classList.add('bg-error/10', 'border-error/30', 'text-error');
            } else {
                box.classList.add('bg-amber-500/10', 'border-amber-500/30', 'text-amber-500');
            }
            box.textContent = text;
        }
    }

    async function handleAuthenticatedUser(userData) {
        if (!userData || (!userData.credential && !userData.email)) {
            resetGoogleButton();
            return;
        }

        try {
            const res = await window.api.googleAuth(userData);
            if (res && res.user && res.user.id) {
                window.CURRENT_USER_ID = res.user.id;
                window.CURRENT_USER_NAME = res.user.name;
                window.CURRENT_USER_EMAIL = res.user.email;
                window.CURRENT_USER_PICTURE = res.user.picture || '';
                localStorage.setItem('lpuquick_user', JSON.stringify(res.user));
                const redirectTarget = window.postLoginRedirect || localStorage.getItem('lpuquick_redirect') || '#/';
                localStorage.removeItem('lpuquick_redirect');
                window.postLoginRedirect = null;

                // After sign-in, user MUST add / confirm their hostel room address to order food
                if (!window.hasUserConfiguredAddress()) {
                    window.openAddressModal(true, () => {
                        window.location.hash = redirectTarget;
                    });
                } else {
                    window.location.hash = redirectTarget;
                }
            } else {
                resetGoogleButton();
                showStatusMessage('Could not verify Google account. Please use Student Email sign-in below.', true);
            }
        } catch (err) {
            console.error('[Google Auth Error]:', err);
            resetGoogleButton();
            showStatusMessage('Google Sign-In origin blocked for this tunnel domain. Please use Student Email sign-in below.', true);
        }
    }

    // Student Email/Password Form Submission Handler
    const emailForm = document.getElementById('student-email-form');
    if (emailForm) {
        emailForm.onsubmit = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('student-email');
            const passwordInput = document.getElementById('student-password');
            const submitBtn = document.getElementById('btn-student-submit');

            const email = emailInput?.value?.trim();
            const password = passwordInput?.value || 'student123';

            if (!email) {
                showStatusMessage('Please enter your email address.', true);
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> Signing In...`;
            }

            try {
                const res = await window.api.signin(email, password);
                if (res && res.success && res.user) {
                    window.CURRENT_USER_ID = res.user.id;
                    window.CURRENT_USER_NAME = res.user.name;
                    window.CURRENT_USER_EMAIL = res.user.email;
                    window.CURRENT_USER_PICTURE = res.user.picture || '';
                    localStorage.setItem('lpuquick_user', JSON.stringify(res.user));

                    const redirectTarget = window.postLoginRedirect || localStorage.getItem('lpuquick_redirect') || '#/';
                    localStorage.removeItem('lpuquick_redirect');
                    window.postLoginRedirect = null;

                    // Trigger mandatory address setup if room is not yet configured
                    if (!window.hasUserConfiguredAddress()) {
                        window.openAddressModal(true, () => {
                            window.location.hash = redirectTarget;
                        });
                    } else {
                        window.location.hash = redirectTarget;
                    }
                } else {
                    showStatusMessage(res?.error || 'Sign-in failed. Please check your credentials.', true);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = `<span class="material-symbols-outlined text-sm">login</span><span>Sign In to Order</span>`;
                    }
                }
            } catch (err) {
                showStatusMessage('Sign-in error: ' + err.message, true);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<span class="material-symbols-outlined text-sm">login</span><span>Sign In to Order</span>`;
                }
            }
        };
    }

    // Initialize Google One Tap without auto-login fallbacks
    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    if (response && response.credential) {
                        handleAuthenticatedUser({ credential: response.credential });
                    } else {
                        resetGoogleButton();
                    }
                },
                auto_select: false,
                cancel_on_tap_outside: true
            });
        } catch (e) {}
    }

    // Google Sign-In Button Click Handler
    document.getElementById('btn-google')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-google');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="w-5 h-5 rounded-full border-2 border-emerald border-t-transparent animate-spin mr-2"></span> Connecting to Google...`;
        }

        // Method 1: Google OAuth 2.0 Token Client (Popup Account Picker)
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            try {
                const tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'email profile openid',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            try {
                                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                                });
                                const profile = await userInfoRes.json();
                                if (profile && profile.email) {
                                    await handleAuthenticatedUser({
                                        email: profile.email,
                                        name: profile.name,
                                        picture: profile.picture
                                    });
                                    return;
                                }
                            } catch (fetchErr) {
                                console.error('[Userinfo Fetch Error]:', fetchErr);
                                showStatusMessage('Failed to fetch Google profile details. Please use Student Email below.', true);
                            }
                        } else if (tokenResponse && tokenResponse.error) {
                            showStatusMessage('Google Sign-In was cancelled or origin mismatch. Use Student Email below.');
                        }
                        resetGoogleButton();
                    },
                    error_callback: (err) => {
                        console.warn('[Google OAuth Closed/Origin Error]:', err);
                        resetGoogleButton();
                        showStatusMessage('💡 Note: Google OAuth blocked this domain (origin_mismatch). Please sign in using your Student Email below!', false);
                    }
                });

                tokenClient.requestAccessToken({ prompt: 'select_account' });
                return;
            } catch (err) {
                console.warn('[TokenClient Init Error]:', err);
                resetGoogleButton();
            }
        }

        // Method 2: Google One Tap Prompt Fallback
        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment() || notification.isDismissedMoment()) {
                        resetGoogleButton();
                        showStatusMessage('💡 To sign in on this domain, use your Student Email below.');
                    }
                });
                return;
            } catch (e) {
                resetGoogleButton();
            }
        }

        resetGoogleButton();
        showStatusMessage('Please use your Student Email below to sign in.', false);
    });
};

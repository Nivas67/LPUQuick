// Sign In & Authentication Page — Pure Real-Time Google Authentication
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

// Sign In & Authentication Page — Google OAuth & Instant Student Access
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
        <div class="text-center mb-5 space-y-1.5">
            <a href="#/" class="inline-flex items-center justify-center gap-3 hover:scale-105 transition-transform duration-200 group">
                <div class="relative">
                    <div class="absolute -inset-1 rounded-full bg-emerald/30 blur-sm group-hover:bg-emerald/50 transition-all"></div>
                    <img src="/logo.png" alt="LPUQuick" class="relative w-12 h-12 rounded-full shadow-md object-contain bg-transparent">
                </div>
                <div class="text-left">
                    <span class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">LPUQuick</span>
                    <span class="block text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Campus Express</span>
                </div>
            </a>
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-[11px] font-bold shadow-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald animate-ping"></span>
                <span>3-Minute BH13 Room Delivery</span>
            </div>
        </div>

        <!-- Glassmorphic Authentication Card -->
        <div class="glass-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/60 dark:border-slate-800 w-full transition-all duration-300 text-center space-y-5">
            
            <div class="space-y-1">
                <h2 class="text-xl sm:text-2xl font-black text-on-surface">Sign In to LPUQuick</h2>
                <p class="text-xs text-on-surface-variant max-w-sm mx-auto">
                    Choose your preferred sign-in method to order food to your hostel room.
                </p>
            </div>

            <!-- Cancellation / Status Banner (Hidden by default) -->
            <div id="auth-status-msg" class="hidden p-3 rounded-2xl text-xs font-medium border transition-all text-left"></div>

            <!-- Method 1: Google Sign-In -->
            <div class="space-y-2.5">
                <button class="w-full h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/90 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald/60 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 active:scale-98 cursor-pointer group" type="button" id="btn-google">
                    <!-- Official Multi-Color Google G SVG -->
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span id="btn-google-text">Continue with Google</span>
                </button>
                <div id="google-native-btn-container" class="flex justify-center my-1"></div>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-surface-variant/40"></div>
                <span class="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">or Student Login</span>
                <div class="flex-1 h-px bg-surface-variant/40"></div>
            </div>

            <!-- Method 2: Instant Student Sign In (Email / Phone) -->
            <form id="student-login-form" class="space-y-3 text-left">
                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-on-surface-variant" for="student-email">LPU Student Email / Phone</label>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">school</span>
                        <input type="text" id="student-email" required class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="e.g. yourname@lpu.in or 9876543210">
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="block text-[11px] font-bold text-on-surface-variant" for="student-name">Your Full Name</label>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">badge</span>
                        <input type="text" id="student-name" required class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="e.g. Rahul Sharma">
                    </div>
                </div>

                <button type="submit" id="btn-student-submit" class="w-full bg-emerald hover:bg-primary text-white rounded-xl py-3 text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5">
                    <span>Instant Student Sign In</span>
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
            </form>

            <!-- Single Sign-On Security Note -->
            <p class="text-[10px] text-on-surface-variant/70">
                By signing in, you agree to LPUQuick Campus Commerce Guidelines.
            </p>

        </div>

        <!-- Campus Safety & Privacy Tagline -->
        <p class="text-center text-[11px] text-on-surface-variant/70 mt-4 flex items-center justify-center gap-1">
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
                <svg class="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                showStatusMessage('Could not verify Google account. Please try again.', true);
            }
        } catch (err) {
            console.error('[Google Auth Error]:', err);
            resetGoogleButton();
            showStatusMessage('Sign-in failed. Please check your network connection.', true);
        }
    }

    // Initialize Google One Tap & Native Render Button
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

            // Also render official Google Sign-In button in container
            const container = document.getElementById('google-native-btn-container');
            if (container) {
                window.google.accounts.id.renderButton(container, {
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'signin_with',
                    width: 280
                });
            }
        } catch (e) {}
    }

    // Student Form Login Handler (Direct Supabase Access)
    document.getElementById('student-login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('student-email');
        const nameInput = document.getElementById('student-name');
        const submitBtn = document.getElementById('btn-student-submit');

        const rawEmail = emailInput?.value?.trim();
        const rawName = nameInput?.value?.trim();

        if (!rawEmail) {
            showStatusMessage('Please enter your student email or phone number.', true);
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> Signing In...`;
        }

        try {
            // Support both student emails and phone numbers
            const formattedEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@lpu.in`;
            const formattedName = rawName || formattedEmail.split('@')[0];

            await handleAuthenticatedUser({
                email: formattedEmail,
                name: formattedName
            });
        } catch (err) {
            console.error('[Student Sign In Error]:', err);
            showStatusMessage('Sign-in failed. Please check your connection and try again.', true);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Instant Student Sign In</span><span class="material-symbols-outlined text-sm">arrow_forward</span>`;
            }
        }
    });

    // Google Sign-In Button Click Handler (Strict Real-Time Authentication Only)
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
                                showStatusMessage('Failed to fetch Google profile details.', true);
                            }
                        } else if (tokenResponse && tokenResponse.error) {
                            showStatusMessage('Google Sign-In was cancelled or origin unverified in Google Console.');
                        }
                        resetGoogleButton();
                    },
                    error_callback: (err) => {
                        console.warn('[Google OAuth Closed/Cancelled]:', err);
                        resetGoogleButton();
                        showStatusMessage('Google popup closed. You can also sign in instantly using the Student Login form below.');
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
                        showStatusMessage('Google One Tap dismissed. Use Student Login below or click Google button again.');
                    }
                });
                return;
            } catch (e) {
                resetGoogleButton();
            }
        }

        resetGoogleButton();
        showStatusMessage('Please ensure popups are enabled, or use Student Login below.', true);
    });
};

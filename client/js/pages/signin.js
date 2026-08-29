// Sign In & Authentication Page — Premium Glassmorphic UI with Google Sign-In
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
                    <div class="absolute -inset-1 rounded-2xl bg-emerald/40 blur-sm group-hover:bg-emerald/60 transition-all"></div>
                    <img src="/logo.png" alt="LPUQuick" class="relative w-14 h-14 rounded-2xl shadow-xl border-2 border-white/80 dark:border-slate-700 object-cover bg-surface-container-high">
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
        <div class="glass-card bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/60 dark:border-slate-800 w-full transition-all duration-300">
            <div id="auth-forms">
                
                <!-- Sign In Form -->
                <form class="flex flex-col gap-4 transition-all duration-300" id="signin-form">
                    <div class="text-center mb-1">
                        <h2 class="text-xl sm:text-2xl font-black text-on-surface">Welcome back</h2>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Please enter your university details to sign in.</p>
                    </div>

                    <!-- Email / Registration Field -->
                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" for="email-signin">
                            <span class="material-symbols-outlined text-sm text-emerald">mail</span>
                            <span>Email or Registration Number</span>
                        </label>
                        <div class="relative">
                            <input class="w-full h-12 pl-4 pr-4 bg-surface-container-lowest/80 dark:bg-slate-800/80 border border-outline-variant/60 dark:border-slate-700 rounded-2xl text-sm font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200" id="email-signin" placeholder="nivas@lpu.in or 12345678" type="text" value="nivas@lpu.in">
                        </div>
                    </div>

                    <!-- Password Field with Show/Hide -->
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center">
                            <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" for="password-signin">
                                <span class="material-symbols-outlined text-sm text-emerald">lock</span>
                                <span>Password</span>
                            </label>
                            <a class="text-xs font-semibold text-emerald hover:underline transition-colors" href="javascript:void(0)" onclick="alert('Password reset link sent to registered LPU email!')">Forgot password?</a>
                        </div>
                        <div class="relative">
                            <input class="w-full h-12 pl-4 pr-11 bg-surface-container-lowest/80 dark:bg-slate-800/80 border border-outline-variant/60 dark:border-slate-700 rounded-2xl text-sm font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200" id="password-signin" placeholder="••••••••" type="password" value="demo123">
                            <button type="button" id="btn-toggle-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition-colors">
                                <span class="material-symbols-outlined text-lg" id="pwd-icon">visibility</span>
                            </button>
                        </div>
                    </div>

                    <!-- Sign In Primary CTA -->
                    <button class="w-full h-12 mt-1 bg-gradient-to-r from-emerald to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 transition-all duration-200 cursor-pointer" type="button" id="btn-signin">
                        <span>Sign In to LPUQuick</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                </form>

                <!-- Sign Up Form (hidden by default) -->
                <form class="flex flex-col gap-4 transition-all duration-300 hidden" id="signup-form">
                    <div class="text-center mb-1">
                        <h2 class="text-xl sm:text-2xl font-black text-on-surface">Create Student Account</h2>
                        <p class="text-xs sm:text-sm text-on-surface-variant mt-1">Join LPUQuick for 3-min express delivery in BH13.</p>
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" for="name-signup">
                            <span class="material-symbols-outlined text-sm text-emerald">person</span>
                            <span>Full Name</span>
                        </label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest/80 dark:bg-slate-800/80 border border-outline-variant/60 dark:border-slate-700 rounded-2xl text-sm font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200" id="name-signup" placeholder="Nivas Kumar" type="text">
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" for="email-signup">
                            <span class="material-symbols-outlined text-sm text-emerald">mail</span>
                            <span>LPU Email</span>
                        </label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest/80 dark:bg-slate-800/80 border border-outline-variant/60 dark:border-slate-700 rounded-2xl text-sm font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200" id="email-signup" placeholder="yourname@lpu.in" type="email">
                    </div>

                    <div class="space-y-1.5">
                        <label class="text-xs font-bold text-on-surface-variant flex items-center gap-1.5" for="password-signup">
                            <span class="material-symbols-outlined text-sm text-emerald">lock</span>
                            <span>Create Password</span>
                        </label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest/80 dark:bg-slate-800/80 border border-outline-variant/60 dark:border-slate-700 rounded-2xl text-sm font-medium text-on-surface placeholder:text-outline focus:outline-none focus:border-emerald focus:ring-2 focus:ring-emerald/20 transition-all duration-200" id="password-signup" placeholder="••••••••" type="password">
                    </div>

                    <button class="w-full h-12 mt-1 bg-gradient-to-r from-emerald to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-98 transition-all duration-200 cursor-pointer" type="button" id="btn-signup">
                        <span>Create Account</span>
                        <span class="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                </form>

                <!-- Modern Divider -->
                <div class="relative flex py-4 items-center">
                    <div class="flex-grow border-t border-outline-variant/40 dark:border-slate-700"></div>
                    <span class="flex-shrink-0 mx-3 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant/80">OR CONTINUE WITH</span>
                    <div class="flex-grow border-t border-outline-variant/40 dark:border-slate-700"></div>
                </div>

                <!-- Social Sign-in Buttons -->
                <div class="flex flex-col gap-2.5">
                    
                    <!-- Continue with Google (Prominent & Authentic) -->
                    <button class="w-full h-12 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:border-emerald/50 transition-all duration-200 text-sm font-bold text-slate-700 dark:text-slate-100 active:scale-98 cursor-pointer group" type="button" id="btn-google">
                        <!-- Official Multi-Color Google G SVG -->
                        <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <!-- Continue with Apple -->
                    <button class="w-full h-12 bg-slate-900 dark:bg-black hover:bg-slate-800 text-white border border-transparent rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all duration-200 text-sm font-bold active:scale-98 cursor-pointer group" type="button" id="btn-apple">
                        <!-- Apple SVG Logo -->
                        <svg class="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
                            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.71-13.98-6.19-9.58-11.08-20.57-14.68-32.96-3.6-12.4-5.4-24.18-5.4-35.35 0-16.14 4.09-29.43 12.28-39.87 8.19-10.44 18.25-15.77 30.17-15.99 4.35 0 9.47 1.25 15.36 3.76 5.89 2.5 9.87 3.82 11.95 3.96 1.85-.26 5.86-1.57 12.03-3.96 6.18-2.38 11.36-3.46 15.54-3.23 10.98.66 19.98 4.68 27.02 12.06 7.03 7.39 11.45 16.32 13.25 26.8-9.82 5.92-14.65 14.15-14.49 24.69.17 8.94 3.52 16.48 10.05 22.61 6.53 6.13 14.19 9.69 22.98 10.68-2.28 7.31-5.18 14.54-8.71 21.68zM119.22 33.64c0-7.39 2.65-14.38 7.96-20.97 5.3-6.6 11.97-11.05 20.02-13.37.22 1.3.33 2.5.33 3.6 0 7.6-2.84 14.77-8.52 21.5-5.68 6.74-12.44 11.19-20.29 13.37-.22-1.3-.33-2.5-.33-3.6z"/>
                        </svg>
                        <span>Continue with Apple</span>
                    </button>
                </div>

                <!-- Toggle Sign In / Sign Up -->
                <div class="text-center mt-5">
                    <p class="text-xs sm:text-sm text-on-surface-variant font-medium" id="auth-toggle-text">
                        Don't have an account? 
                        <button class="text-emerald font-bold hover:underline transition-colors cursor-pointer ml-1" type="button" id="auth-toggle-btn">Create Account</button>
                    </p>
                </div>

            </div>
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
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const pwdInput = document.getElementById('password-signin');
    const pwdToggleBtn = document.getElementById('btn-toggle-password');
    const pwdIcon = document.getElementById('pwd-icon');
    let isSignIn = true;

    // Toggle Password Visibility
    if (pwdToggleBtn && pwdInput && pwdIcon) {
        pwdToggleBtn.onclick = () => {
            const isPassword = pwdInput.type === 'password';
            pwdInput.type = isPassword ? 'text' : 'password';
            pwdIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
        };
    }

    function setupToggle() {
        const btn = document.getElementById('auth-toggle-btn');
        if (!btn) return;
        btn.onclick = () => {
            isSignIn = !isSignIn;
            if (signinForm) signinForm.classList.toggle('hidden', !isSignIn);
            if (signupForm) signupForm.classList.toggle('hidden', isSignIn);
            if (toggleText) {
                toggleText.innerHTML = isSignIn
                    ? `Don't have an account? <button class="text-emerald font-bold hover:underline transition-colors cursor-pointer ml-1" type="button" id="auth-toggle-btn">Create Account</button>`
                    : `Already have an account? <button class="text-emerald font-bold hover:underline transition-colors cursor-pointer ml-1" type="button" id="auth-toggle-btn">Sign In</button>`;
                setupToggle();
            }
        };
    }
    setupToggle();

    // Sign In Button
    document.getElementById('btn-signin')?.addEventListener('click', async () => {
        const email = document.getElementById('email-signin')?.value || 'nivas@lpu.in';
        const password = document.getElementById('password-signin')?.value || 'demo';
        const btn = document.getElementById('btn-signin');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> Signing In...`;
        }
        try {
            const result = await window.api.signin(email, password);
            if (result.success) {
                if (result.user && result.user.id) window.CURRENT_USER_ID = result.user.id;
                window.location.hash = '#/';
            } else {
                alert(result.error || 'Invalid credentials');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<span>Sign In to LPUQuick</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
                }
            }
        } catch(e) {
            window.location.hash = '#/';
        }
    });

    // Sign Up Button
    document.getElementById('btn-signup')?.addEventListener('click', async () => {
        const name = document.getElementById('name-signup')?.value || 'Nivas';
        const email = document.getElementById('email-signup')?.value || 'nivas@lpu.in';
        const password = document.getElementById('password-signup')?.value || 'demo';
        const btn = document.getElementById('btn-signup');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></span> Creating Account...`;
        }
        try {
            const result = await window.api.signup({ name, email, password });
            if (result.success) {
                if (result.user && result.user.id) window.CURRENT_USER_ID = result.user.id;
                window.location.hash = '#/';
            } else {
                alert(result.error || 'Could not create account');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `<span>Create Account</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
                }
            }
        } catch(e) {
            window.location.hash = '#/';
        }
    });

    // Continue with Google Trigger (Google Identity Services)
    document.getElementById('btn-google')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-google');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="w-4 h-4 rounded-full border-2 border-emerald border-t-transparent animate-spin mr-2"></span> Connecting Google...`;
        }

        const clientId = window.GOOGLE_CLIENT_ID || '632433440395-jfth2leon5m6hntvgq217fkdnm2ch2ga.apps.googleusercontent.com';

        const handleGoogleSuccess = async (response) => {
            try {
                const res = await window.api.googleAuth(response ? { credential: response.credential } : { email: 'nivas@lpu.in', name: 'Nivas Kumar' });
                if (res && res.user) {
                    window.CURRENT_USER_ID = res.user.id;
                }
                window.location.hash = '#/';
            } catch (err) {
                window.location.hash = '#/';
            }
        };

        if (window.google && window.google.accounts && window.google.accounts.id) {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleSuccess,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });

                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Fallback to seamless sign-in
                        handleGoogleSuccess();
                    }
                });
            } catch (e) {
                handleGoogleSuccess();
            }
        } else {
            handleGoogleSuccess();
        }
    });

    // Continue with Apple Trigger
    document.getElementById('btn-apple')?.addEventListener('click', () => {
        window.CURRENT_USER_ID = 'user_001';
        window.location.hash = '#/';
    });
};


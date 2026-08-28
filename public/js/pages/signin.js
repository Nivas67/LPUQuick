// Sign In Page — exact Stitch UI reproduction
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.signin = async function() {
    return `
<div class="bg-background min-h-screen flex items-center justify-center font-display relative overflow-hidden text-on-surface">
    <!-- Background Decor -->
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary-fixed-dim/30 blur-[100px] z-0 pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary-fixed-dim/20 blur-[120px] z-0 pointer-events-none"></div>
    <div class="relative z-10 w-full max-w-md px-margin-mobile md:px-0">
        <!-- Brand Header -->
        <div class="text-center mb-xl">
            <a href="#/" class="text-display font-display text-emerald dark:text-white flex items-center justify-center gap-3 hover:opacity-90 transition-opacity">
                <img src="/logo.png" alt="LPUQuick" class="w-16 h-16 rounded-3xl shadow-lg border border-white/20 object-cover bg-surface-container-high">
                <span class="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald dark:text-white">LPUQuick</span>
            </a>
            <p class="text-body-lg font-body-lg text-on-surface-variant mt-sm text-xs sm:text-sm">Your Campus, One Tap Away · 3 Mins Express</p>
        </div>
        <!-- Glassmorphic Card -->
        <div class="glass-card rounded-xl p-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] w-full">
            <div id="auth-forms">
                <!-- Sign In Form -->
                <form class="flex flex-col gap-md transition-opacity duration-300" id="signin-form">
                    <div class="text-center mb-md">
                        <h2 class="text-headline-md font-headline-md text-on-surface">Welcome back</h2>
                        <p class="text-body-md font-body-md text-on-surface-variant">Please enter your details to sign in.</p>
                    </div>
                    <div class="flex flex-col gap-sm">
                        <label class="text-label-sm font-label-sm text-on-surface-variant" for="email-signin">Email or Mobile</label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all duration-200" id="email-signin" placeholder="Enter your email" type="text" value="nivas@lpu.in">
                    </div>
                    <div class="flex flex-col gap-sm">
                        <div class="flex justify-between items-center">
                            <label class="text-label-sm font-label-sm text-on-surface-variant" for="password-signin">Password</label>
                            <a class="text-label-sm font-label-sm text-primary hover:text-emerald transition-colors" href="#">Forgot password?</a>
                        </div>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all duration-200" id="password-signin" placeholder="••••••••" type="password" value="demo123">
                    </div>
                    <button class="w-full h-14 mt-sm bg-emerald text-white rounded-full text-label-lg font-label-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors duration-200 shadow-md active:scale-95" type="button" id="btn-signin">
                        Sign In
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </form>
                <!-- Sign Up Form (hidden by default) -->
                <form class="flex flex-col gap-md transition-opacity duration-300 hidden" id="signup-form">
                    <div class="text-center mb-md">
                        <h2 class="text-headline-md font-headline-md text-on-surface">Create Account</h2>
                        <p class="text-body-md font-body-md text-on-surface-variant">Join LPUQuick for calm commerce.</p>
                    </div>
                    <div class="flex flex-col gap-sm">
                        <label class="text-label-sm font-label-sm text-on-surface-variant" for="name-signup">Full Name</label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all duration-200" id="name-signup" placeholder="Your name" type="text">
                    </div>
                    <div class="flex flex-col gap-sm">
                        <label class="text-label-sm font-label-sm text-on-surface-variant" for="email-signup">Email</label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all duration-200" id="email-signup" placeholder="you@email.com" type="email">
                    </div>
                    <div class="flex flex-col gap-sm">
                        <label class="text-label-sm font-label-sm text-on-surface-variant" for="password-signup">Password</label>
                        <input class="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none input-glow transition-all duration-200" id="password-signup" placeholder="••••••••" type="password">
                    </div>
                    <button class="w-full h-14 mt-sm bg-emerald text-white rounded-full text-label-lg font-label-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors duration-200 shadow-md active:scale-95" type="button" id="btn-signup">
                        Create Account
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </form>
                <!-- Divider -->
                <div class="relative flex py-lg items-center">
                    <div class="flex-grow border-t border-outline-variant"></div>
                    <span class="flex-shrink-0 mx-4 text-label-sm font-label-sm text-on-surface-variant">OR CONTINUE WITH</span>
                    <div class="flex-grow border-t border-outline-variant"></div>
                </div>
                <!-- Social Logins -->
                <div class="flex flex-col gap-sm mb-lg">
                    <button class="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center gap-3 hover:border-emerald hover:bg-surface-container-low transition-all duration-200 text-label-lg font-label-lg text-on-surface" type="button" id="btn-google">
                        <img class="w-5 h-5 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsbgYu8tj_bKdVDjLrsWDxcztdWKVE6G2E-UGnuT98B4WfeRh9T3NzmxAwb02W5lGL-iuERJQcOHLwsoetaDG0blKmBWZyBakSI4yOguGo62FqxYlSSkOFn8XoanuAR2p_F8j4Zkx2dE10IEoM4aZp9w6sZLf0618ZHc3lSUi8IdsncFtG4INIDkSulNK5Smm3zXdV_R22h1p-tvjSTLVkB_I8dLWot-fexErcubXblkj706Y5oP8" alt="Google">
                        Google
                    </button>
                    <button class="w-full h-12 bg-inverse-surface border border-transparent rounded-full flex items-center justify-center gap-3 hover:opacity-90 transition-opacity duration-200 text-label-lg font-label-lg text-white" type="button" id="btn-apple">
                        <span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">file_download</span>
                        Apple
                    </button>
                </div>
                <!-- Toggle -->
                <div class="text-center mt-sm">
                    <p class="text-body-md font-body-md text-on-surface-variant" id="auth-toggle-text">
                        Don't have an account? 
                        <button class="text-primary font-semibold hover:text-emerald transition-colors" type="button" id="auth-toggle-btn">Create Account</button>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>`;
};

window.pageInits.signin = function() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    let isSignIn = true;

    function setupToggle() {
        const btn = document.getElementById('auth-toggle-btn');
        if (!btn) return;
        btn.onclick = () => {
            isSignIn = !isSignIn;
            if (signinForm) signinForm.classList.toggle('hidden', !isSignIn);
            if (signupForm) signupForm.classList.toggle('hidden', isSignIn);
            if (toggleText) {
                toggleText.innerHTML = isSignIn
                    ? `Don't have an account? <button class="text-primary font-semibold hover:text-emerald transition-colors" type="button" id="auth-toggle-btn">Create Account</button>`
                    : `Already have an account? <button class="text-primary font-semibold hover:text-emerald transition-colors" type="button" id="auth-toggle-btn">Sign In</button>`;
                setupToggle();
            }
        };
    }
    setupToggle();

    document.getElementById('btn-signin')?.addEventListener('click', async () => {
        const email = document.getElementById('email-signin')?.value || 'nivas@lpu.in';
        const password = document.getElementById('password-signin')?.value || 'demo';
        try {
            const result = await window.api.signin(email, password);
            if (result.success) {
                if (result.user && result.user.id) window.CURRENT_USER_ID = result.user.id;
                window.navigate('/');
            } else {
                alert(result.error || 'Invalid credentials');
            }
        } catch(e) {
            window.navigate('/');
        }
    });

    document.getElementById('btn-signup')?.addEventListener('click', async () => {
        const name = document.getElementById('name-signup')?.value || 'Nivas';
        const email = document.getElementById('email-signup')?.value || 'nivas@lpu.in';
        const password = document.getElementById('password-signup')?.value || 'demo';
        try {
            const result = await window.api.signup({ name, email, password });
            if (result.success) {
                if (result.user && result.user.id) window.CURRENT_USER_ID = result.user.id;
                window.navigate('/');
            } else {
                alert(result.error || 'Could not create account');
            }
        } catch(e) {
            window.navigate('/');
        }
    });

    document.getElementById('btn-google')?.addEventListener('click', () => window.navigate('/'));
    document.getElementById('btn-apple')?.addEventListener('click', () => window.navigate('/'));
};

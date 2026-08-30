// LPUQuick SPA Router & Global Controller
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

// Version-controlled session cache buster (Ensures new visits or deployments start completely clean)
const LPUQUICK_BUILD_VERSION = 'v2026.08.29.rel6';
if (localStorage.getItem('lpuquick_build_v') !== LPUQUICK_BUILD_VERSION) {
    localStorage.removeItem('lpuquick_user');
    localStorage.removeItem('lpuquick_address_configured');
    localStorage.removeItem('lpuquick_room');
    localStorage.removeItem('lpuquick_block');
    localStorage.removeItem('lpuquick_phone');
    localStorage.removeItem('lpuquick_address_detail');
    localStorage.removeItem('lpuquick_guest_cart_id');
    localStorage.setItem('lpuquick_build_v', LPUQUICK_BUILD_VERSION);
    window.CURRENT_USER_ID = null;
    window.CURRENT_USER_NAME = null;
    window.CURRENT_USER_EMAIL = null;
    window.CURRENT_USER_PICTURE = null;
}

// Auth User state (Strict real user session - no hardcoded fake fallback)
try {
    const savedUser = JSON.parse(localStorage.getItem('lpuquick_user') || 'null');
    if (savedUser && savedUser.id && savedUser.id !== 'user_001' && savedUser.id !== 'user_default' && savedUser.email) {
        window.CURRENT_USER_ID = savedUser.id;
        window.CURRENT_USER_NAME = savedUser.name;
        window.CURRENT_USER_EMAIL = savedUser.email;
        window.CURRENT_USER_PICTURE = savedUser.picture || '';
    } else {
        localStorage.removeItem('lpuquick_user');
        window.CURRENT_USER_ID = null;
        window.CURRENT_USER_NAME = null;
        window.CURRENT_USER_EMAIL = null;
        window.CURRENT_USER_PICTURE = null;
    }
} catch(e) {
    localStorage.removeItem('lpuquick_user');
    window.CURRENT_USER_ID = null;
    window.CURRENT_USER_NAME = null;
    window.CURRENT_USER_EMAIL = null;
    window.CURRENT_USER_PICTURE = null;
}

window.isUserLoggedIn = function() {
    return Boolean(window.CURRENT_USER_ID && window.CURRENT_USER_EMAIL);
};

window.getEffectiveUserId = function() {
    if (window.isUserLoggedIn()) return window.CURRENT_USER_ID;
    let guestId = localStorage.getItem('lpuquick_guest_cart_id');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('lpuquick_guest_cart_id', guestId);
    }
    return guestId;
};

window.cartState = window.cartState || {};

// Address state (Unconfigured until user signs in and sets room)
window.currentAddress = localStorage.getItem('lpuquick_address') || 'BH13';
window.currentBlock = localStorage.getItem('lpuquick_block') || 'Block A';
window.currentRoom = localStorage.getItem('lpuquick_room') || '';
window.currentAddressDetail = localStorage.getItem('lpuquick_address_detail') || '';

// Theme state
if (localStorage.getItem('lpuquick_theme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
}

const routes = {
    '/': 'home',
    '/signin': 'signin',
    '/categories': 'categories',
    '/cart': 'cart',
    '/checkout': 'checkout',
    '/flow-assist': 'flowassist',
    '/orders': 'orders',
    '/settings': 'settings'
};

function navigate(path) {
    window.location.hash = '#' + path;
}

function getCurrentRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
}

function getPageName(path) {
    return routes[path] || 'home';
}

// Address Configuration State Helper
window.hasUserConfiguredAddress = function() {
    return localStorage.getItem('lpuquick_address_configured') === 'true' && Boolean(localStorage.getItem('lpuquick_room'));
};

// Global Address Selection Modal (BH13 Express Live, BH1-BH12 Coming Soon, Block A/B, Room No, Phone)
window.openAddressModal = function(isMandatorySetup = false, onComplete = null) {
    const existing = document.getElementById('address-modal');
    if (existing) existing.remove();

    // Hostels 1 to 13 + GHs + UniMall + Main Gate
    const allLocations = [
        { name: 'BH13', active: true, tag: 'Live 3m' },
        { name: 'BH1', active: false, tag: 'Coming Soon' },
        { name: 'BH2', active: false, tag: 'Coming Soon' },
        { name: 'BH3', active: false, tag: 'Coming Soon' },
        { name: 'BH4', active: false, tag: 'Coming Soon' },
        { name: 'BH5', active: false, tag: 'Coming Soon' },
        { name: 'BH6', active: false, tag: 'Coming Soon' },
        { name: 'BH7', active: false, tag: 'Coming Soon' },
        { name: 'BH8', active: false, tag: 'Coming Soon' },
        { name: 'BH9', active: false, tag: 'Coming Soon' },
        { name: 'BH10', active: false, tag: 'Coming Soon' },
        { name: 'BH11', active: false, tag: 'Coming Soon' },
        { name: 'BH12', active: false, tag: 'Coming Soon' },
        { name: 'GH1', active: false, tag: 'Coming Soon' },
        { name: 'GH2', active: false, tag: 'Coming Soon' },
        { name: 'GH3', active: false, tag: 'Coming Soon' },
        { name: 'GH4', active: false, tag: 'Coming Soon' },
        { name: 'UniMall', active: false, tag: 'Coming Soon' },
        { name: 'Main Gate', active: false, tag: 'Coming Soon' }
    ];

    let selectedHostel = 'BH13';
    let selectedBlock = window.currentBlock || localStorage.getItem('lpuquick_block') || 'Block A';
    const savedRoom = window.currentRoom || localStorage.getItem('lpuquick_room') || '';
    const savedFloor = localStorage.getItem('lpuquick_floor') || '';
    let savedPhone = localStorage.getItem('lpuquick_phone') || '';
    if (savedPhone === '7671836211' || savedPhone === '9877982857') savedPhone = '';

    const modal = document.createElement('div');
    modal.id = 'address-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content p-5 sm:p-6 space-y-4 max-h-[88vh] overflow-y-auto" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-surface-variant/40">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center">
                        <span class="material-symbols-outlined text-xl">location_on</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">${isMandatorySetup ? 'Delivery Address Required' : 'Select Delivery Location'}</h3>
                        <p class="text-[11px] text-on-surface-variant">LPU Campus Express Delivery (3 mins)</p>
                    </div>
                </div>
                ${isMandatorySetup ? `
                <span class="text-[10px] bg-emerald/10 text-emerald px-2 py-0.5 rounded-full font-bold">Step 2: Room Info</span>
                ` : `
                <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface" onclick="document.getElementById('address-modal').remove()">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
                `}
            </div>

            <!-- Notice Banner -->
            <div class="p-3 bg-emerald/10 border border-emerald/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald font-medium">
                <span class="material-symbols-outlined text-base">bolt</span>
                <span>Express 3-min delivery is exclusively live at <strong>BH13</strong>! Food delivered straight to your room.</span>
            </div>

            <!-- Hostel Selector Grid -->
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <label class="block text-xs font-semibold text-on-surface-variant">Choose Hostel / Building</label>
                    <span class="text-[10px] text-emerald font-bold">BH13 Active</span>
                </div>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 no-scrollbar" id="hostels-container">
                    ${allLocations.map(h => {
                        const isSelected = h.name === selectedHostel;
                        if (h.active) {
                            return `
                            <button type="button" class="p-2 rounded-2xl border text-xs font-bold transition-all relative flex flex-col items-center justify-center gap-0.5 hostel-pick-btn ${isSelected ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface hover:border-emerald text-on-surface'}" data-hostel="${h.name}">
                                <span>${h.name}</span>
                                <span class="bg-emerald text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">Live ⚡</span>
                            </button>
                            `;
                        } else {
                            return `
                            <button type="button" class="p-2 rounded-2xl border border-surface-variant/40 bg-surface/50 text-on-surface-variant/70 text-xs font-medium transition-all relative flex flex-col items-center justify-center gap-0.5 hostel-disabled-btn cursor-not-allowed opacity-60" data-hostel="${h.name}">
                                <span>${h.name}</span>
                                <span class="text-[8px] bg-surface-container-high px-1 py-0.2 rounded text-on-surface-variant font-medium">Soon</span>
                            </button>
                            `;
                        }
                    }).join('')}
                </div>
            </div>

            <!-- Block Selector (Block A or Block B) -->
            <div class="space-y-2">
                <label class="block text-xs font-semibold text-on-surface-variant">Select Block</label>
                <div class="grid grid-cols-2 gap-2.5" id="block-selector">
                    <button type="button" class="py-2.5 px-4 rounded-xl border text-xs font-bold transition-all block-btn flex items-center justify-center gap-1.5 ${selectedBlock === 'Block A' ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface text-on-surface'}" data-block="Block A">
                        <span class="material-symbols-outlined text-sm">apartment</span>
                        Block A
                    </button>
                    <button type="button" class="py-2.5 px-4 rounded-xl border text-xs font-bold transition-all block-btn flex items-center justify-center gap-1.5 ${selectedBlock === 'Block B' ? 'border-2 border-emerald bg-emerald/10 text-emerald shadow-sm' : 'border-surface-variant bg-surface text-on-surface'}" data-block="Block B">
                        <span class="material-symbols-outlined text-sm">apartment</span>
                        Block B
                    </button>
                </div>
            </div>

            <!-- Room & Floor Input -->
            <div class="grid grid-cols-2 gap-2.5">
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-on-surface-variant" for="room-input">Room Number *</label>
                    <input type="text" id="room-input" required class="w-full px-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="e.g. 304" value="${savedRoom}">
                </div>
                <div class="space-y-1">
                    <label class="block text-xs font-semibold text-on-surface-variant" for="floor-input">Floor</label>
                    <input type="text" id="floor-input" class="w-full px-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface focus:outline-none focus:border-emerald" placeholder="e.g. 3rd Floor" value="${savedFloor}">
                </div>
            </div>

            <!-- Student Mobile Number for Delivery Rider Contact with OTP Verification -->
            <div class="space-y-2">
                <div class="flex justify-between items-center">
                    <label class="block text-xs font-semibold text-on-surface-variant" for="phone-input">Contact Phone Number (For delivery runner) *</label>
                    <span id="phone-verify-status-badge" class="${localStorage.getItem('lpuquick_phone_verified_' + savedPhone) === 'true' ? 'text-emerald font-bold text-[11px] flex items-center gap-1' : 'hidden'}">
                        <span class="material-symbols-outlined text-[13px]">verified</span> Verified
                    </span>
                </div>
                <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">+91</span>
                    <input type="tel" id="phone-input" maxlength="10" required class="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-surface-variant bg-surface text-xs text-on-surface font-semibold focus:outline-none focus:border-emerald" placeholder="XXXXXXXXXX" value="${savedPhone}">
                </div>
                <div class="grid grid-cols-2 gap-2 pt-0.5">
                    <button type="button" id="btn-trigger-wa-otp" class="py-2.5 px-3 bg-emerald/15 hover:bg-emerald/25 text-emerald border border-emerald/30 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <span class="material-symbols-outlined text-sm text-emerald">chat</span>
                        <span>WhatsApp OTP</span>
                    </button>
                    <button type="button" id="btn-trigger-sms-otp" class="py-2.5 px-3 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-surface-variant rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <span class="material-symbols-outlined text-sm">sms</span>
                        <span>SMS OTP</span>
                    </button>
                </div>
            </div>

            <!-- Inline Validation Alert -->
            <div id="address-validation-alert" class="hidden p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">error</span>
                <span id="address-validation-msg">Please enter your room number.</span>
            </div>

            <!-- Inline Alert for Blocked Hostels (Initially hidden) -->
            <div id="blocked-hostel-alert" class="hidden p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 text-xs flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">info</span>
                <span id="blocked-hostel-msg">This hostel is opening soon. Delivering to BH13 right now.</span>
            </div>

            <!-- Save Button -->
            <button type="button" id="save-address-btn" class="w-full bg-emerald text-white rounded-full py-3.5 text-xs sm:text-sm font-semibold shadow-md hover:bg-primary transition-all active:scale-95 cursor-pointer">
                Confirm Address & Deliver to BH13 (<span id="btn-block-label">${selectedBlock}</span>)
            </button>
        </div>

        <!-- Step 2: Interactive OTP Verification Screen (Hidden initially) -->
        <div id="otp-verification-screen" class="hidden modal-content p-5 sm:p-6 space-y-4" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-surface-variant/40">
                <div class="flex items-center gap-2.5">
                    <button type="button" id="back-to-form-btn" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-variant transition-all cursor-pointer">
                        <span class="material-symbols-outlined text-sm">arrow_back</span>
                    </button>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Verify Mobile Number</h3>
                        <p class="text-[11px] text-on-surface-variant">Dispatched to <strong>+91 <span id="otp-phone-display"></span></strong></p>
                    </div>
                </div>
                <span class="text-[10px] bg-emerald/15 text-emerald px-2 py-0.5 rounded-full font-bold">Step 2: OTP</span>
            </div>

            <!-- WhatsApp Direct Action Button -->
            <a id="wa-direct-launch-link" href="#" target="_blank" rel="noopener noreferrer" class="w-full py-3 px-4 bg-emerald hover:bg-primary text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer no-underline">
                <span class="material-symbols-outlined text-base">chat</span>
                <span>Open WhatsApp to Receive OTP Message</span>
            </a>

            <!-- Delivery Notice -->
            <div class="p-3 bg-surface-container-high border border-surface-variant/50 rounded-2xl flex items-center gap-2.5 text-xs text-on-surface font-medium">
                <span class="material-symbols-outlined text-base text-emerald shrink-0">mark_chat_read</span>
                <span>Enter the 6-digit code received on your mobile / WhatsApp below:</span>
            </div>

            <!-- 6 Digit Input Matrix -->
            <div class="space-y-2 text-center pt-1">
                <label class="block text-xs font-semibold text-on-surface-variant">Enter 6-Digit OTP</label>
                <div class="flex justify-center gap-2" id="otp-boxes-wrapper">
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="0" autofocus>
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="1">
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="2">
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="3">
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="4">
                    <input type="tel" maxlength="1" class="otp-box w-10 sm:w-11 h-12 text-center text-lg font-black rounded-xl border border-surface-variant bg-surface text-on-surface focus:border-emerald focus:ring-2 focus:ring-emerald/20 focus:outline-none" data-idx="5">
                </div>
            </div>

            <!-- OTP Error Alert -->
            <div id="otp-error-box" class="hidden p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-xs flex items-center justify-center gap-1.5 font-medium">
                <span class="material-symbols-outlined text-sm">error</span>
                <span id="otp-error-text">Invalid or expired OTP code.</span>
            </div>

            <!-- Verify & Continue Button -->
            <button type="button" id="submit-otp-verify-btn" class="w-full bg-emerald text-white rounded-full py-3.5 text-xs sm:text-sm font-semibold shadow-md hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                <span class="material-symbols-outlined text-sm">check_circle</span>
                <span>Verify OTP & Save Address</span>
            </button>

            <!-- Resend Timer -->
            <div class="text-center pt-1">
                <p class="text-xs text-on-surface-variant">
                    Didn't receive code? <button type="button" id="resend-otp-link" class="text-emerald font-bold underline cursor-pointer disabled:opacity-50" disabled>Resend Code (<span id="resend-timer-sec">30</span>s)</button>
                </p>
            </div>
        </div>
    `;

    if (!isMandatorySetup) {
        modal.onclick = () => modal.remove();
    }
    document.body.appendChild(modal);

    const addressFormScreen = modal.querySelector('#address-form-screen') || modal.children[0];
    const otpScreen = document.getElementById('otp-verification-screen');
    let resendInterval = null;

    // Start 30s resend timer
    function startResendTimer() {
        if (resendInterval) clearInterval(resendInterval);
        const resendBtn = document.getElementById('resend-otp-link');
        const timerSec = document.getElementById('resend-timer-sec');
        if (!resendBtn || !timerSec) return;

        let left = 30;
        resendBtn.disabled = true;
        timerSec.textContent = left;

        resendInterval = setInterval(() => {
            left -= 1;
            timerSec.textContent = left;
            if (left <= 0) {
                clearInterval(resendInterval);
                resendBtn.disabled = false;
                resendBtn.innerHTML = 'Resend Code Now';
            }
        }, 1000);
    }

    // Function to launch OTP verification screen
    async function launchOtpFlow(phoneToVerify, autoOpenWhatsApp = false) {
        const userId = window.getEffectiveUserId();
        try {
            const sendRes = await window.api.sendOtp(phoneToVerify, userId);
            
            // Switch screen
            if (addressFormScreen) addressFormScreen.classList.add('hidden');
            if (otpScreen) otpScreen.classList.remove('hidden');

            const phoneDisp = document.getElementById('otp-phone-display');
            if (phoneDisp) phoneDisp.textContent = phoneToVerify;

            const waLink = document.getElementById('wa-direct-launch-link');
            if (waLink && sendRes.whatsapp_url) {
                waLink.href = sendRes.whatsapp_url;
                if (autoOpenWhatsApp) {
                    window.open(sendRes.whatsapp_url, '_blank');
                }
            }

            // Clear previous inputs
            const boxes = document.querySelectorAll('.otp-box');
            boxes.forEach(b => b.value = '');
            if (boxes[0]) boxes[0].focus();

            startResendTimer();
            if (typeof window.showClientToast === 'function') {
                window.showClientToast(`📲 Verification code sent to +91 ${phoneToVerify}`, 'success', 'chat');
            }
        } catch (err) {
            alert('Could not send OTP: ' + (err.message || err));
        }
    }

    // OTP Boxes Keyboard Navigation & Auto Advance
    const otpBoxes = document.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, idx) => {
        box.oninput = (e) => {
            const val = box.value.replace(/\D/g, '');
            box.value = val ? val[0] : '';
            if (val && idx < otpBoxes.length - 1) {
                otpBoxes[idx + 1].focus();
            }
        };

        box.onkeydown = (e) => {
            if (e.key === 'Backspace' && !box.value && idx > 0) {
                otpBoxes[idx - 1].focus();
            }
        };

        box.onpaste = (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
            if (pasted) {
                pasted.split('').forEach((char, i) => {
                    if (otpBoxes[i]) otpBoxes[i].value = char;
                });
                if (otpBoxes[Math.min(pasted.length, 5)]) {
                    otpBoxes[Math.min(pasted.length, 5)].focus();
                }
            }
        };
    });

    // Back to address form button
    const backBtn = document.getElementById('back-to-form-btn');
    if (backBtn) {
        backBtn.onclick = () => {
            if (otpScreen) otpScreen.classList.add('hidden');
            if (addressFormScreen) addressFormScreen.classList.remove('hidden');
            if (resendInterval) clearInterval(resendInterval);
        };
    }

    // Resend OTP Link
    const resendBtn = document.getElementById('resend-otp-link');
    if (resendBtn) {
        resendBtn.onclick = async () => {
            const phone = document.getElementById('phone-input')?.value?.trim();
            if (phone) await launchOtpFlow(phone, false);
        };
    }

    // Trigger WhatsApp OTP button from form
    const triggerWaBtn = document.getElementById('btn-trigger-wa-otp');
    if (triggerWaBtn) {
        triggerWaBtn.onclick = () => {
            const phone = document.getElementById('phone-input')?.value?.trim();
            const alertBox = document.getElementById('address-validation-alert');
            const alertMsg = document.getElementById('address-validation-msg');

            if (!phone || phone.length < 10) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Please enter a valid 10-digit mobile number first.';
                }
                document.getElementById('phone-input')?.focus();
                return;
            }
            if (alertBox) alertBox.classList.add('hidden');
            launchOtpFlow(phone, true);
        };
    }

    // Trigger SMS OTP button from form
    const triggerSmsBtn = document.getElementById('btn-trigger-sms-otp');
    if (triggerSmsBtn) {
        triggerSmsBtn.onclick = () => {
            const phone = document.getElementById('phone-input')?.value?.trim();
            const alertBox = document.getElementById('address-validation-alert');
            const alertMsg = document.getElementById('address-validation-msg');

            if (!phone || phone.length < 10) {
                if (alertBox && alertMsg) {
                    alertBox.classList.remove('hidden');
                    alertMsg.textContent = 'Please enter a valid 10-digit mobile number first.';
                }
                document.getElementById('phone-input')?.focus();
                return;
            }
            if (alertBox) alertBox.classList.add('hidden');
            launchOtpFlow(phone, false);
        };
    }

    // Block selection handler
    modal.querySelectorAll('.block-btn').forEach(btn => {
        btn.onclick = () => {
            modal.querySelectorAll('.block-btn').forEach(b => {
                b.classList.remove('border-2', 'border-emerald', 'bg-emerald/10', 'text-emerald', 'shadow-sm');
                b.classList.add('border-surface-variant', 'bg-surface', 'text-on-surface');
            });
            btn.classList.remove('border-surface-variant', 'bg-surface', 'text-on-surface');
            btn.classList.add('border-2', 'border-emerald', 'bg-emerald/10', 'text-emerald', 'shadow-sm');
            selectedBlock = btn.dataset.block;
            const label = document.getElementById('btn-block-label');
            if (label) label.textContent = selectedBlock;
        };
    });

    // Disabled hostels click handler
    modal.querySelectorAll('.hostel-disabled-btn').forEach(btn => {
        btn.onclick = () => {
            const hName = btn.dataset.hostel;
            const alertBox = document.getElementById('blocked-hostel-alert');
            const alertMsg = document.getElementById('blocked-hostel-msg');
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = `${hName} is opening next week! Delivering to BH13 for now.`;
            }
        };
    });

    // Helper to finalize address saving
    function finalizeAddressSave(room, floor, phone) {
        window.currentAddress = 'BH13';
        window.currentBlock = selectedBlock;
        window.currentRoom = room;
        window.currentAddressDetail = `BH13 (${selectedBlock}), Room ${room}`;

        localStorage.setItem('lpuquick_address', window.currentAddress);
        localStorage.setItem('lpuquick_block', window.currentBlock);
        localStorage.setItem('lpuquick_room', window.currentRoom);
        localStorage.setItem('lpuquick_floor', floor);
        if (phone) {
            localStorage.setItem('lpuquick_phone', phone);
            localStorage.setItem('lpuquick_phone_verified_' + phone, 'true');
        }
        localStorage.setItem('lpuquick_address_configured', 'true');
        localStorage.setItem('lpuquick_address_detail', window.currentAddressDetail);

        // Sync with backend profile
        if (window.isUserLoggedIn() && window.api?.updateAddress) {
            window.api.updateAddress(window.CURRENT_USER_ID, 'BH13', selectedBlock, room, phone);
        }

        if (resendInterval) clearInterval(resendInterval);
        modal.remove();

        if (typeof window.showClientToast === 'function') {
            window.showClientToast('✓ Address & phone verified for BH13 delivery!', 'success', 'verified');
        }

        if (typeof onComplete === 'function') {
            onComplete();
        } else {
            router();
        }
    }

    // Submit OTP Verification Button
    const submitOtpBtn = document.getElementById('submit-otp-verify-btn');
    if (submitOtpBtn) {
        submitOtpBtn.onclick = async () => {
            const enteredOtp = Array.from(otpBoxes).map(b => b.value).join('');
            const phone = document.getElementById('phone-input')?.value?.trim();
            const room = document.getElementById('room-input')?.value?.trim() || '304';
            const floor = document.getElementById('floor-input')?.value?.trim() || '3rd Floor';
            const errBox = document.getElementById('otp-error-box');
            const errText = document.getElementById('otp-error-text');

            if (enteredOtp.length < 6) {
                if (errBox && errText) {
                    errBox.classList.remove('hidden');
                    errText.textContent = 'Please enter all 6 digits of the OTP code.';
                }
                return;
            }

            submitOtpBtn.disabled = true;
            submitOtpBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Verifying...</span>';

            try {
                const uid = window.getEffectiveUserId();
                const verifyRes = await window.api.verifyOtp(phone, enteredOtp, uid);
                if (verifyRes && verifyRes.success) {
                    finalizeAddressSave(room, floor, phone);
                } else {
                    throw new Error(verifyRes.error || 'Invalid OTP code.');
                }
            } catch (err) {
                submitOtpBtn.disabled = false;
                submitOtpBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span><span>Verify OTP & Save Address</span>';
                if (errBox && errText) {
                    errBox.classList.remove('hidden');
                    errText.textContent = err.message || 'Invalid or expired OTP code. Please try again.';
                }
            }
        };
    }

    // Save Address button on Main Form
    document.getElementById('save-address-btn').onclick = async () => {
        const room = document.getElementById('room-input')?.value?.trim();
        const floor = document.getElementById('floor-input')?.value?.trim() || '3rd Floor';
        const phone = document.getElementById('phone-input')?.value?.trim();
        const alertBox = document.getElementById('address-validation-alert');
        const alertMsg = document.getElementById('address-validation-msg');

        if (!room) {
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = 'Please enter your Room Number (e.g. 304).';
            }
            document.getElementById('room-input')?.focus();
            return;
        }

        if (!phone || phone.length < 10) {
            if (alertBox && alertMsg) {
                alertBox.classList.remove('hidden');
                alertMsg.textContent = 'Please enter a valid 10-digit mobile number.';
            }
            document.getElementById('phone-input')?.focus();
            return;
        }

        // Check if phone number is verified
        const isVerified = localStorage.getItem('lpuquick_phone_verified_' + phone) === 'true';
        if (!isVerified) {
            if (alertBox) alertBox.classList.add('hidden');
            await launchOtpFlow(phone, true);
            return;
        }

        // Already verified! Finalize directly
        finalizeAddressSave(room, floor, phone);
    };
};

// Global Product Details Modal
window.openProductModal = async function(productId) {
    const existing = document.getElementById('product-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content p-6 flex items-center justify-center min-h-[300px]" onclick="event.stopPropagation()">
            <span class="material-symbols-outlined text-emerald text-3xl animate-spin">progress_activity</span>
        </div>
    `;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);

    try {
        const p = await window.api.getProduct(productId);
        const cartInfo = window.cartState[p.id];
        const qty = cartInfo ? cartInfo.quantity : 0;

        modal.innerHTML = `
            <div class="modal-content p-6 space-y-5" onclick="event.stopPropagation()">
                <!-- Modal Top -->
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-emerald bg-emerald/10 px-2.5 py-0.5 rounded-full">
                        ${p.category} · ${p.subcategory || 'Essential'}
                    </span>
                    <button type="button" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface" onclick="document.getElementById('product-modal').remove()">
                        <span class="material-symbols-outlined text-base">close</span>
                    </button>
                </div>

                <!-- Product Image Banner -->
                <div class="h-48 bg-surface-container-high rounded-2xl overflow-hidden flex items-center justify-center p-4 relative">
                    <img class="max-h-full max-w-full object-contain" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'">
                    ${p.discount_percent > 0 ? `
                    <div class="absolute top-3 left-3 bg-vibrant-yellow text-on-surface font-bold text-[11px] px-2.5 py-0.5 rounded-md shadow-sm">
                        ${p.discount_percent}% OFF
                    </div>
                    ` : ''}
                    ${p.stock_left !== undefined && p.stock_left !== null && p.stock_left > 0 && p.stock_left <= 4 ? `
                    <div class="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">bolt</span> Only ${p.stock_left} left!
                    </div>
                    ` : (!p.in_stock || p.stock_left === 0 ? `
                    <div class="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                        Out of Stock
                    </div>
                    ` : '')}
                </div>

                <!-- Title & Price -->
                <div class="space-y-1">
                    <h2 class="font-headline-md text-lg font-bold text-on-surface">${p.name}</h2>
                    <p class="text-xs text-on-surface-variant font-medium">${p.size || p.unit}</p>
                    <div class="flex items-baseline gap-2 pt-1">
                        <span class="text-2xl font-bold text-emerald">₹${p.price}</span>
                        ${p.mrp > p.price ? `<span class="text-xs text-on-surface-variant line-through">₹${p.mrp}</span>` : ''}
                    </div>
                </div>

                <!-- Highlights & Description -->
                <div class="space-y-3 border-t border-surface-variant/40 pt-3 text-xs">
                    <p class="text-on-surface-variant leading-relaxed">${p.description}</p>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Shelf Life</span>
                            <span class="font-semibold text-on-surface">${p.shelf_life}</span>
                        </div>
                        <div class="bg-surface p-2 rounded-xl border border-surface-variant/40">
                            <span class="text-on-surface-variant block text-[10px]">Campus Delivery</span>
                            <span class="font-semibold text-emerald">3 mins to BH13</span>
                        </div>
                    </div>
                </div>

                <!-- Action Button inside Modal -->
                <div class="pt-2" id="modal-action-container">
                    ${(!p.in_stock || (p.stock_left !== undefined && p.stock_left <= 0)) ? `
                    <button type="button" class="w-full bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full py-3 text-xs font-bold shadow-none cursor-not-allowed flex items-center justify-center gap-1.5" disabled>
                        <span class="material-symbols-outlined text-sm">block</span> Out of Stock
                    </button>
                    ` : (qty === 0 ? `
                    <button type="button" class="w-full bg-emerald text-white rounded-full py-3 text-xs font-semibold shadow-md hover:bg-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer" id="modal-add-btn">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart · ₹${p.price}
                    </button>
                    ` : `
                    <div class="flex items-center justify-between bg-surface-container-high rounded-full p-1.5 px-4 border border-outline-variant/30">
                        <span class="text-xs font-semibold text-on-surface">Quantity in Cart:</span>
                        <div class="flex items-center gap-3">
                            <button type="button" class="w-7 h-7 rounded-full bg-white dark:bg-surface flex items-center justify-center text-on-surface shadow-sm cursor-pointer" id="modal-dec-btn">
                                <span class="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span class="font-bold text-xs w-4 text-center">${qty}</span>
                            <button type="button" class="w-7 h-7 rounded-full bg-emerald text-white flex items-center justify-center shadow-sm cursor-pointer" id="modal-inc-btn">
                                <span class="material-symbols-outlined text-sm">add</span>
                            </button>
                        </div>
                    </div>
                    `)}
                </div>
            </div>
        `;

        // Bind Modal Action Buttons
        const modalAddBtn = document.getElementById('modal-add-btn');
        if (modalAddBtn) {
            modalAddBtn.onclick = async () => {
                const uid = window.getEffectiveUserId();
                await window.api.addToCart(uid, p.id, 1);
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
        const modalIncBtn = document.getElementById('modal-inc-btn');
        if (modalIncBtn) {
            modalIncBtn.onclick = async () => {
                const uid = window.getEffectiveUserId();
                const item = window.cartState[p.id];
                if (item) await window.api.updateCartItem(item.cart_id, item.quantity + 1, uid);
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
        const modalDecBtn = document.getElementById('modal-dec-btn');
        if (modalDecBtn) {
            modalDecBtn.onclick = async () => {
                const uid = window.getEffectiveUserId();
                const item = window.cartState[p.id];
                if (item) {
                    if (item.quantity <= 1) await window.api.removeCartItem(item.cart_id);
                    else await window.api.updateCartItem(item.cart_id, item.quantity - 1, uid);
                }
                window.openProductModal(p.id);
                window.syncCardSteppers();
            };
        }
    } catch(e) {
        modal.innerHTML = `
            <div class="modal-content p-6 text-center space-y-3">
                <p class="text-error text-xs">Could not load product details.</p>
                <button type="button" class="bg-surface-container-high text-xs px-4 py-1.5 rounded-full" onclick="document.getElementById('product-modal').remove()">Close</button>
            </div>
        `;
    }
// Global Card Stepper Synchronizer (Turns Add button into [- qty +], and keeps Out of Stock blocked)
window.syncCardSteppers = function() {
    document.querySelectorAll('.product-action-slot').forEach(slot => {
        const productId = slot.dataset.id;
        const isOutOfStock = slot.dataset.outOfStock === 'true' || slot.getAttribute('data-out-of-stock') === 'true';

        // 1. If product is out of stock, block until stock is updated by admin
        if (isOutOfStock) {
            slot.innerHTML = `
                <span class="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800 cursor-not-allowed select-none">
                    Out of Stock
                </span>
            `;
            return;
        }

        const cartInfo = window.cartState[productId];
        const qty = cartInfo ? cartInfo.quantity : 0;

        if (qty > 0) {
            slot.innerHTML = `
                <div class="card-qty-stepper">
                    <button type="button" class="card-qty-btn card-dec-btn" data-id="${productId}">
                        <span class="material-symbols-outlined text-[13px]">remove</span>
                    </button>
                    <span class="card-qty-val">${qty}</span>
                    <button type="button" class="card-qty-btn card-inc-btn" data-id="${productId}">
                        <span class="material-symbols-outlined text-[13px]">add</span>
                    </button>
                </div>
            `;
        } else {
            slot.innerHTML = `
                <button type="button" class="bg-emerald text-white rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all add-to-cart-btn" data-id="${productId}">Add</button>
            `;
        }
    });

    // Rebind newly created buttons with Instant Optimistic UI
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const uid = window.getEffectiveUserId();

            // Optimistic instant state update
            window.cartState = window.cartState || {};
            window.cartState[id] = { quantity: 1, cart_id: window.cartState[id]?.cart_id || `temp_${id}` };
            window.syncCardSteppers();

            try {
                const res = await window.api.addToCart(uid, id, 1);
                if (res && res.cart_id) {
                    window.cartState[id].cart_id = res.cart_id;
                }
            } catch(err) {
                // Revert on error
                delete window.cartState[id];
                window.syncCardSteppers();
                if (typeof window.showClientToast === 'function') {
                    window.showClientToast('Could not update cart', 'error');
                }
            }
        };
    });

    document.querySelectorAll('.card-inc-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const uid = window.getEffectiveUserId();
            const item = window.cartState[id];
            if (item) {
                const prevQty = item.quantity;
                item.quantity += 1;
                window.syncCardSteppers();

                try {
                    await window.api.updateCartItem(item.cart_id, item.quantity, uid);
                } catch(err) {
                    item.quantity = prevQty;
                    window.syncCardSteppers();
                }
            }
        };
    });

    document.querySelectorAll('.card-dec-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const uid = window.getEffectiveUserId();
            const item = window.cartState[id];
            if (item) {
                const prevQty = item.quantity;
                if (item.quantity <= 1) {
                    delete window.cartState[id];
                    window.syncCardSteppers();
                    try {
                        await window.api.removeCartItem(item.cart_id);
                    } catch(err) {
                        window.cartState[id] = { quantity: prevQty, cart_id: item.cart_id };
                        window.syncCardSteppers();
                    }
                } else {
                    item.quantity -= 1;
                    window.syncCardSteppers();
                    try {
                        await window.api.updateCartItem(item.cart_id, item.quantity, uid);
                    } catch(err) {
                        item.quantity = prevQty;
                        window.syncCardSteppers();
                    }
                }
            }
        };
    });

    // Product card click to open details modal
    document.querySelectorAll('.product-detail-trigger').forEach(el => {
        el.onclick = (e) => {
            if (e.target.closest('.product-action-slot')) return;
            const id = el.dataset.productId;
            if (id) window.openProductModal(id);
        };
    });
};

// Router Main Function
// Router Main Function - Instant Zero-Blocking Navigation
let cartSyncInProgress = false;
async function router() {
    const path = getCurrentRoute();
    
    // Mandatory unauthenticated check: Require sign in before entering store
    if (!window.isUserLoggedIn() && path !== '/signin') {
        if (path !== '/') {
            localStorage.setItem('lpuquick_redirect', '#' + path);
        }
        window.location.hash = '#/signin';
        return;
    }

    const pageName = getPageName(path);
    const appRoot = document.getElementById('app');
    
    if (!appRoot) return;

    try {
        // Non-blocking background cart revalidation with SWR
        const effectiveUid = window.getEffectiveUserId();
        if (!cartSyncInProgress) {
            cartSyncInProgress = true;
            window.api.getCart(effectiveUid)
                .then(() => {
                    cartSyncInProgress = false;
                    if (typeof window.syncCardSteppers === 'function') window.syncCardSteppers();
                })
                .catch(() => { cartSyncInProgress = false; });
        }

        const renderFn = window.pages[pageName];
        if (renderFn) {
            const html = await renderFn();
            appRoot.innerHTML = html;
            appRoot.classList.add('page-enter');
            setTimeout(() => appRoot.classList.remove('page-enter'), 200);

            // Initialize page-specific JS
            const initFn = window.pageInits[pageName];
            if (initFn) initFn();

            // Synchronize steppers
            window.syncCardSteppers();

            // Bind global address modal trigger
            document.querySelectorAll('.address-selector-trigger').forEach(el => {
                el.onclick = (e) => {
                    e.preventDefault();
                    window.openAddressModal();
                };
            });

            window.scrollTo(0, 0);

            // Check active order delivery bar
            checkAndConnectGlobalOrderTracking();
        } else {
            appRoot.innerHTML = `
                <div class="text-center pt-32 px-4">
                    <h1 class="font-headline-md text-xl font-bold text-on-surface">Page not found</h1>
                    <a href="#/" class="mt-4 inline-block bg-emerald text-white px-5 py-2 rounded-full text-xs font-semibold">Back to Home</a>
                </div>
            `;
        }
    } catch (err) {
        console.error('Router error:', err);
    }
}

// ================= GLOBAL REAL-TIME CLIENT-ADMIN COORDINATION HUB =================
let globalClientWs = null;
let clientWsReconnectTimer = null;
let clientWsReconnectAttempts = 0;
let clientWsPingInterval = null;
let currentTrackedOrderId = null;

// Client Toast Notification Helper
function showClientToast(message, type = 'info', icon = 'bolt') {
    const container = document.getElementById('client-toast-container');
    if (!container) return;

    const id = `client-toast-${Date.now()}`;
    const styles = {
        success: 'border-emerald-500 bg-white/95 dark:bg-slate-900/95 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/10',
        info: 'border-sky-500 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 shadow-sky-500/10',
        warning: 'border-amber-500 bg-white/95 dark:bg-slate-900/95 text-amber-800 dark:text-amber-300 shadow-amber-500/10',
        error: 'border-rose-500 bg-white/95 dark:bg-slate-900/95 text-rose-800 dark:text-rose-300 shadow-rose-500/10'
    };

    const toastHtml = `
        <div id="${id}" class="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border-l-4 ${styles[type] || styles.info} shadow-xl backdrop-blur-xl transition-all duration-300 transform translate-y-2 opacity-0">
            <div class="flex items-center gap-2.5 min-w-0">
                <span class="material-symbols-outlined text-lg shrink-0 text-emerald">${icon}</span>
                <p class="text-xs font-bold leading-tight truncate">${message}</p>
            </div>
            <button onclick="dismissClientToast('${id}')" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs shrink-0 p-1">✕</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const el = document.getElementById(id);
    setTimeout(() => {
        if (el) {
            el.classList.remove('translate-y-2', 'opacity-0');
            el.classList.add('translate-y-0', 'opacity-100');
        }
    }, 20);

    setTimeout(() => { dismissClientToast(id); }, 5000);
}

function dismissClientToast(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('translate-y-0', 'opacity-100');
    el.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => { el.remove(); }, 350);
}

// Global Client WebSocket Connection
function initGlobalClientWebSocket() {
    if (globalClientWs && (globalClientWs.readyState === WebSocket.OPEN || globalClientWs.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (clientWsReconnectTimer) {
        clearTimeout(clientWsReconnectTimer);
        clientWsReconnectTimer = null;
    }

    if (clientWsPingInterval) {
        clearInterval(clientWsPingInterval);
        clientWsPingInterval = null;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/client`;

    try {
        globalClientWs = new WebSocket(wsUrl);

        globalClientWs.onopen = () => {
            console.log('[LPUQuick WS] ⚡ Connected to campus live stream.');
            clientWsReconnectAttempts = 0;

            // Register user if signed in
            if (window.CURRENT_USER_ID) {
                globalClientWs.send(JSON.stringify({
                    type: 'REGISTER_USER',
                    userId: window.CURRENT_USER_ID
                }));
            }

            // Keepalive ping every 20s
            clientWsPingInterval = setInterval(() => {
                if (globalClientWs && globalClientWs.readyState === WebSocket.OPEN) {
                    globalClientWs.send(JSON.stringify({ type: 'PING' }));
                }
            }, 20000);
        };

        globalClientWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // 1. Live Inventory & Stock Updates from Admin
                if (data.type === 'INVENTORY_UPDATE') {
                    handleLiveInventoryChange(data);
                }
                // 2. Live Order Status Updates from Admin
                else if (data.type === 'STATUS_UPDATE' || data.type === 'ORDER_STATUS_UPDATE') {
                    handleLiveOrderStatusChange(data);
                }
                // 3. New Order Confirmation
                else if (data.type === 'NEW_ORDER' && data.order) {
                    if (window.CURRENT_USER_ID && data.order.user_id === window.CURRENT_USER_ID) {
                        checkAndConnectGlobalOrderTracking();
                    }
                }
            } catch (err) {
                console.error('[LPUQuick WS Parse Error]:', err);
            }
        };

        globalClientWs.onclose = () => {
            globalClientWs = null;
            if (clientWsPingInterval) { clearInterval(clientWsPingInterval); clientWsPingInterval = null; }

            // Auto-reconnect with exponential backoff (1s, 2s, 4s... max 15s)
            const delay = Math.min(1000 * Math.pow(2, clientWsReconnectAttempts), 15000);
            clientWsReconnectAttempts++;
            clientWsReconnectTimer = setTimeout(initGlobalClientWebSocket, delay);
        };

        globalClientWs.onerror = () => {
            try { globalClientWs.close(); } catch(e) {}
        };

    } catch (e) {
        if (!clientWsReconnectTimer) {
            clientWsReconnectTimer = setTimeout(initGlobalClientWebSocket, 3000);
        }
    }
}

// In-place Real-Time Stock Updates across DOM
function handleLiveInventoryChange(data) {
    const { productId, stock_left, in_stock } = data;
    console.log(`[Realtime Stock Sync] Product ${productId}: Stock=${stock_left}, InStock=${in_stock}`);

    // 1. Update all product action slots and cards on screen
    const isOut = !in_stock || stock_left <= 0;
    const slots = document.querySelectorAll(`.product-action-slot[data-id="${productId}"]`);
    slots.forEach(slot => {
        slot.dataset.outOfStock = isOut ? 'true' : 'false';
        const card = slot.closest('.product-detail-trigger, .product-card-container');
        if (card) {
            if (isOut) card.classList.add('opacity-85');
            else card.classList.remove('opacity-85');
        }
    });

    window.syncCardSteppers();

    // 2. Update single product detail modal/page if open
    const modalAddBtn = document.querySelector(`#modal-add-btn[data-id="${productId}"]`);
    if (modalAddBtn) {
        if (isOut) {
            modalAddBtn.disabled = true;
            modalAddBtn.className = 'w-full bg-rose-500/10 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 rounded-full py-3 text-xs font-bold cursor-not-allowed';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">block</span> Out of Stock';
        } else {
            modalAddBtn.disabled = false;
            modalAddBtn.className = 'w-full bg-emerald hover:bg-primary text-white py-3 rounded-full font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer';
            modalAddBtn.innerHTML = '<span class="material-symbols-outlined text-sm">add_shopping_cart</span> Add to Cart';
        }
    }

    // 3. Dynamically update stock badges across all card images and headers
    const badges = document.querySelectorAll(`.stock-badge[data-id="${productId}"]`);
    badges.forEach(b => {
        if (!in_stock || stock_left <= 0) {
            b.className = 'absolute top-2 left-2 z-10 stock-badge bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm';
            b.textContent = 'Out of Stock';
            b.style.display = 'block';
        } else if (stock_left > 0 && stock_left <= 4) {
            b.className = 'absolute top-2 left-2 z-10 stock-badge bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5';
            b.innerHTML = `<span class="material-symbols-outlined text-[11px]" style="font-variation-settings: 'FILL' 1;">bolt</span> Only ${stock_left} left!`;
            b.style.display = 'flex';
        } else {
            b.style.display = 'none';
        }
    });

    const badgeTexts = document.querySelectorAll(`.stock-badge-text[data-id="${productId}"]`);
    badgeTexts.forEach(bt => {
        if (stock_left > 0 && stock_left <= 4) {
            bt.textContent = `⚡ Only ${stock_left} left`;
            bt.style.display = 'inline-block';
        } else {
            bt.style.display = 'none';
        }
    });
}

// In-place Real-Time Order Status Updates
function handleLiveOrderStatusChange(data) {
    const status = data.status;
    const riderName = data.rider_name || data.riderName || 'Alex';
    const orderId = data.order_id || data.orderId;

    console.log(`[Realtime Order Sync] Order ${orderId} -> ${status}`);

    // 1. Update Global Floating Bar
    updateGlobalDeliveryBar(status, riderName);

    // 2. If user is currently viewing the Live Orders page, update the interactive HUD/map in real-time
    if (typeof window.applyOrderStatusUI === 'function') {
        window.applyOrderStatusUI(status, riderName);
    }

    // 3. Show dynamic client status toast
    const statusMessages = {
        'Order Confirmed': '👍 BH13 Store accepted your order!',
        'Preparing': '📦 Items packed & sealed at BH13 Dark Store!',
        'Out for Delivery': `🚶‍♂️ ${riderName} is speeding towards your room!`,
        'Delivered': '🎉 Order delivered to your room door!',
        'Cancelled': '❌ Order was cancelled by Admin.'
    };

    if (statusMessages[status]) {
        showClientToast(statusMessages[status], status === 'Cancelled' ? 'error' : 'success', status === 'Delivered' ? 'task_alt' : 'bolt');
    }
}

async function checkAndConnectGlobalOrderTracking() {
    try {
        const bar = document.getElementById('global-live-delivery-bar');
        if (!window.isUserLoggedIn()) {
            if (bar) bar.classList.add('hidden');
            return;
        }
        const userId = window.CURRENT_USER_ID;
        const activeRes = await window.api.getActiveOrder(userId);
        const active = activeRes?.active;

        if (!active || ['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(active.status)) {
            if (bar) bar.classList.add('hidden');
            return;
        }

        currentTrackedOrderId = active.id;
        updateGlobalDeliveryBar(active.status, active.rider_name || 'Alex');

        // Only show floating bar when not already on dedicated tracking pages
        const currentPath = getCurrentRoute();
        if (bar) {
            if (currentPath === '/orders' || currentPath === '/checkout') {
                bar.classList.add('hidden');
            } else {
                bar.classList.remove('hidden');
            }
        }

    } catch (e) {
        console.warn('[Global Tracking Sync]:', e);
    }
}

function updateGlobalDeliveryBar(status, riderName) {
    const bar = document.getElementById('global-live-delivery-bar');
    const statusEl = document.getElementById('global-delivery-status');
    const etaEl = document.getElementById('global-delivery-eta');
    const subEl = document.getElementById('global-delivery-subtitle');
    const hostelShort = window.currentAddress || 'BH13';

    if (!bar || !statusEl || !etaEl || !subEl) return;

    statusEl.textContent = status;

    if (status === 'Order Placed') {
        etaEl.textContent = '3 mins';
        subEl.textContent = `BH13 Dark Store is verifying your snacks`;
    } else if (status === 'Order Confirmed') {
        etaEl.textContent = '3 mins';
        subEl.textContent = `Confirmed by BH13 Hub · Packing shortly`;
    } else if (status === 'Preparing') {
        etaEl.textContent = '2 mins';
        subEl.textContent = `Staff is packing your bag at BH13 Hub`;
    } else if (status === 'Out for Delivery') {
        etaEl.textContent = '1 min';
        subEl.textContent = `🚶‍♂️ ${riderName} is walking to ${hostelShort} (Block A)`;
    } else if (status === 'Delivered') {
        etaEl.textContent = 'Arrived ✓';
        subEl.textContent = `🎉 Delivered to ${hostelShort}! Enjoy your snacks!`;
        setTimeout(() => {
            bar.classList.add('hidden');
        }, 8000);
    } else if (status === 'Cancelled' || status === 'cancelled') {
        etaEl.textContent = 'Cancelled ✕';
        subEl.textContent = '❌ Order was cancelled by Admin';
        setTimeout(() => {
            bar.classList.add('hidden');
        }, 4000);
    }
}

window.router = router;
window.navigate = navigate;

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    router();
    initGlobalClientWebSocket();
    checkAndConnectGlobalOrderTracking();
});

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    router();
    initGlobalClientWebSocket();
    checkAndConnectGlobalOrderTracking();
}

// Background sync interval (every 10 seconds)
setInterval(checkAndConnectGlobalOrderTracking, 10000);

// ============================================================
// Interactive Magnetic Cursor Torch & Dynamic Ambient Parallax (Desktop Only)
// ============================================================
(function initInteractiveAtmosphere() {
    // Only run cursor torch & mouse parallax on desktop screens with fine pointer to avoid mobile scroll lag
    if (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768) {
        return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isTicking = false;
    let lastScrollY = window.scrollY || 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY || 0;
        if (!isTicking) {
            isTicking = true;
            requestAnimationFrame(renderFrame);
        }
    }, { passive: true });

    function renderFrame() {
        // Smooth lerp (dampening)
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;

        const torch = document.getElementById('ambient-cursor-torch');
        if (torch) {
            torch.style.transform = `translate3d(${currentX - 240}px, ${currentY - 240}px, 0)`;
        }

        // Parallax reaction on floating leaves and lineart
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const deltaX = (mouseX - centerX) / centerX;
        const deltaY = (mouseY - centerY) / centerY;
        const scrollOffset = lastScrollY * 0.05;

        const leaves = document.querySelectorAll('.ambient-leaf');
        leaves.forEach((leaf, idx) => {
            const factor = (idx + 1) * 2.2;
            leaf.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * (idx % 2 === 0 ? 1 : 0.6)}px, 0)`;
        });

        const lineart = document.querySelectorAll('.ambient-lineart');
        lineart.forEach((art, idx) => {
            const factor = (idx + 1) * 3;
            art.style.transform = `translate3d(${deltaX * factor}px, ${deltaY * factor - scrollOffset * 0.8}px, 0)`;
        });

        if (Math.abs(mouseX - currentX) > 0.3 || Math.abs(mouseY - currentY) > 0.3) {
            requestAnimationFrame(renderFrame);
        } else {
            isTicking = false;
        }
    }
})();



function formatAdminPaymentDisplay(method, status) {
    const s = method ? String(method).trim() : '';
    const st = status ? String(status).trim().toLowerCase() : '';
    const isDone = st === 'delivered' || st === 'completed';

    if (!s) return isDone ? 'Cash' : 'Pay on Delivery';
    if (/^cash$/i.test(s)) return 'Cash';
    if (/^upi$/i.test(s)) return 'UPI';
    if (/^both/i.test(s)) return s;
    if (/cash\s*on\s*delivery/i.test(s) || /^cod$/i.test(s) || /^pod$/i.test(s) || /pay\s*on\s*delivery/i.test(s)) {
        if (isDone) return 'Cash';
        return 'Pay on Delivery';
    }
    return s;
}
window.formatAdminPaymentDisplay = formatAdminPaymentDisplay;
// Universal Admin Authentication Token Resolver
function getAdminAuthToken() {
    return localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || (typeof adminToken !== 'undefined' ? adminToken : '');
}
window.getAdminAuthToken = getAdminAuthToken;

// Universal HTML Escaping Utility for XSS Prevention
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;
window.escapeHtmlStr = escapeHtml;

// Universal Authenticated Fetch Helper
function authFetch(url, options = {}) {
    let authHeaders = {};
    try {
        if (typeof getAuthHeaders === 'function') {
            authHeaders = getAuthHeaders();
        } else {
            const token = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
            authHeaders = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token, 'x-admin-token': token } : {})
            };
        }
    } catch (e) {
        authHeaders = { 'Content-Type': 'application/json' };
    }
    const headers = {
        ...authHeaders,
        ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
}
window.authFetch = authFetch;
window.adminFetch = authFetch;
var adminFetch = window.adminFetch;



// Multi-Theme High-Volume Web Audio Synthesizer Engine (Cha-Ching, QuickCommerce Pop, Courier Chirp, Arcade, Crystal Bell, Urgent Alarm)
let audioCtx = null;
let soundEnabled = localStorage.getItem('lpuquick_admin_sound') !== 'false';
let currentSoundTheme = localStorage.getItem('lpuquick_order_sound_theme') || 'cash_register';

// Generate 100% self-contained, offline base64 WAV chime data URI for HTML5 Audio fallback
function generateChimeWavDataUri() {
    const sampleRate = 22050;
    const duration = 0.8;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 4.5);
        const s1 = Math.sin(2 * Math.PI * 987.77 * t);
        const s2 = Math.sin(2 * Math.PI * 1318.51 * t);
        const s3 = Math.sin(2 * Math.PI * 1975.53 * t);
        const sample = Math.max(-1, Math.min(1, (s1 * 0.45 + s2 * 0.35 + s3 * 0.2) * decay));
        view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
}

// Initialize audio element with zero-latency synthesized sound source
try {
    const fallbackAudio = document.getElementById('order-chime');
    if (fallbackAudio && !fallbackAudio.src) {
        fallbackAudio.src = generateChimeWavDataUri();
    }
} catch (e) { }

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }
    return audioCtx;
}

// Full interactive audio unlocker to bypass strict browser autoplay policies
function unlockAudioEngine() {
    const ctx = getAudioContext();
    if (ctx) {
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => { });
        }
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001; // Micro inaudible burst to unlock browser policy
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);
            osc.stop(ctx.currentTime + 0.01);
        } catch (e) { }
    }
    const fallbackAudio = document.getElementById('order-chime');
    if (fallbackAudio) {
        try {
            if (!fallbackAudio.src) fallbackAudio.src = generateChimeWavDataUri();
            fallbackAudio.volume = 1.0;
        } catch (e) { }
    }
    const banner = document.getElementById('audio-unlock-banner');
    if (banner) banner.classList.add('hidden');
}

// Automatically unlock AudioContext on user's first interaction
['click', 'touchstart', 'keydown', 'mousedown', 'pointerdown'].forEach(evt => {
    document.addEventListener(evt, unlockAudioEngine, { passive: true });
});

// Master Sound Synthesizer (High Volume, Dual Oscillator)
function playCampusChime(theme = currentSoundTheme) {
    if (!soundEnabled) return;

    // Visual chime indicator on sound icon
    const icon = document.getElementById('sound-icon');
    if (icon) {
        icon.classList.add('animate-bounce', 'text-emerald-500');
        setTimeout(() => icon.classList.remove('animate-bounce', 'text-emerald-500'), 1500);
    }

    // Haptic vibration feedback on mobile/tablets
    try {
        if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
    } catch (e) { }

    // Trigger HTML5 Audio Element fallback
    try {
        let fallbackAudio = document.getElementById('order-chime');
        if (!fallbackAudio) {
            fallbackAudio = document.createElement('audio');
            fallbackAudio.id = 'order-chime';
            fallbackAudio.src = generateChimeWavDataUri();
            document.body.appendChild(fallbackAudio);
        } else if (!fallbackAudio.src) {
            fallbackAudio.src = generateChimeWavDataUri();
        }
        fallbackAudio.currentTime = 0;
        fallbackAudio.volume = 1.0;
        const playPromise = fallbackAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => { });
        }
    } catch (e) { }

    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const playSynthesized = () => {
            const now = ctx.currentTime;
            if (theme === 'cash_register') {
                // Theme 1: High Volume Cash Register "Cha-Ching" + Metallic Shimmer
                // Lever Click
                const osc0 = ctx.createOscillator();
                const gain0 = ctx.createGain();
                osc0.type = 'triangle';
                osc0.frequency.setValueAtTime(400, now);
                osc0.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
                gain0.gain.setValueAtTime(0.7, now);
                gain0.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc0.connect(gain0);
                gain0.connect(ctx.destination);
                osc0.start(now);
                osc0.stop(now + 0.06);

                // Cha-Ching Ring Note (B5 -> E6)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(987.77, now + 0.05);
                osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
                gain1.gain.setValueAtTime(0, now + 0.05);
                gain1.gain.linearRampToValueAtTime(0.9, now + 0.08);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now + 0.05);
                osc1.stop(now + 0.8);

                // High Coin Harmonic Ring (1975Hz - B6)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1975.53, now + 0.09);
                gain2.gain.setValueAtTime(0, now + 0.09);
                gain2.gain.linearRampToValueAtTime(0.75, now + 0.12);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.09);
                osc2.stop(now + 1.1);

            } else if (theme === 'swiggy_pop') {
                // Theme 2: QuickCommerce Pop (C5 -> E5 -> G5 -> C6)
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((f, idx) => {
                    const t = now + (idx * 0.07);
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, t);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.85, t + 0.015);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.28);
                });

            } else if (theme === 'express_beep') {
                // Theme 3: Courier Delivery Double-Chirp (1760Hz -> 2093Hz)
                [0, 0.12].forEach(offset => {
                    const t = now + offset;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(1760, t);
                    osc.frequency.exponentialRampToValueAtTime(2093, t + 0.06);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.8, t + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.1);
                });

            } else if (theme === 'arcade_ding') {
                // Theme 4: Arcade Level-Up Victory Ding (A4 -> C#5 -> E5 -> A5)
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((f, idx) => {
                    const t = now + (idx * 0.06);
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, t);
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(0.85, t + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.35);
                });

            } else if (theme === 'urgent_alarm') {
                // Theme 6: Urgent Delivery Triple Alert (High Siren Pulsing)
                [0, 0.15, 0.30].forEach(offset => {
                    const t = now + offset;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(880, t);
                    osc.frequency.setValueAtTime(1320, t + 0.06);
                    gain.gain.setValueAtTime(0.6, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.12);
                });

            } else {
                // Theme 5: Crystal Bell Dual Chime (E5 -> A5 -> C#6 -> E6)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(659.25, now);
                osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);
                gain1.gain.setValueAtTime(0, now);
                gain1.gain.linearRampToValueAtTime(0.8, now + 0.02);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(now);
                osc1.stop(now + 0.7);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1108.73, now + 0.1);
                osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2);
                gain2.gain.setValueAtTime(0, now + 0.1);
                gain2.gain.linearRampToValueAtTime(0.85, now + 0.13);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(now + 0.1);
                osc2.stop(now + 1.1);
            }
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(playSynthesized).catch(playSynthesized);
        } else {
            playSynthesized();
        }

    } catch (e) {
        console.warn('[Audio Synthesizer Error]:', e);
    }
}

function changeSoundTheme(newTheme) {
    currentSoundTheme = newTheme;
    localStorage.setItem('lpuquick_order_sound_theme', newTheme);
    getAudioContext();
    if (!soundEnabled) {
        soundEnabled = true;
        localStorage.setItem('lpuquick_admin_sound', 'true');
        updateSoundUI();
    }
    playCampusChime(newTheme);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('lpuquick_admin_sound', soundEnabled ? 'true' : 'false');
    updateSoundUI();
    if (soundEnabled) {
        getAudioContext();
        playCampusChime();
    }
}

function testCampusSound() {
    getAudioContext();
    if (!soundEnabled) {
        soundEnabled = true;
        localStorage.setItem('lpuquick_admin_sound', 'true');
        updateSoundUI();
    }
    playCampusChime(currentSoundTheme);
}

function updateSoundUI() {
    const btn = document.getElementById('btn-sound-toggle');
    const icon = document.getElementById('sound-icon');
    const text = document.getElementById('sound-status-text');
    const select = document.getElementById('sound-theme-select');

    if (select) {
        select.value = currentSoundTheme;
    }

    if (!btn || !icon || !text) return;

    if (soundEnabled) {
        btn.className = 'bg-[#e6f4ea] hover:bg-[#ceead6] text-[#137333] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm';
        icon.textContent = 'volume_up';
        text.textContent = 'Sound: ON';
    } else {
        btn.className = 'bg-[#fce8e6] hover:bg-[#fad2cf] text-[#c5221f] px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm';
        icon.textContent = 'volume_off';
        text.textContent = 'Sound: OFF';
    }
}

// State & Auth Token with LocalStorage Resilience
let activeView = 'dashboard';
let productsCache = [];
let ordersCache = [];
let customersCache = [];
let blacklistCache = [];

try {
    const savedOrders = localStorage.getItem('lpuquick_admin_orders_cache');
    if (savedOrders) ordersCache = JSON.parse(savedOrders);
    const savedProducts = localStorage.getItem('lpuquick_admin_products_cache');
    if (savedProducts) productsCache = JSON.parse(savedProducts);
} catch (e) { }

// Proactively calculate and display accurate real-time revenue and KPIs immediately on script execution
if (typeof window !== 'undefined') {
    const triggerInitialKpiSync = () => {
        try {
            if (typeof updateDailyRevenue === 'function') updateDailyRevenue();
            if (typeof updateKpiCountersFromCache === 'function') updateKpiCountersFromCache();
        } catch (e) { }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', triggerInitialKpiSync);
    } else {
        setTimeout(triggerInitialKpiSync, 0);
    }
}

let clientLockState = null;
let lockTickerInterval = null;
let profitLocked = true;
let currentDrawerOrderId = null;
let realtimeWs = null;

// Read token securely from localStorage or sessionStorage
let adminToken = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || '';
let currentAdminProfile = null;
try {
    const savedProf = localStorage.getItem('lpuquick_admin_profile');
    if (savedProf) currentAdminProfile = JSON.parse(savedProf);
} catch (e) { }

function isPlatformOwner(profile = currentAdminProfile) {
    if (!profile) return false;
    const roles = Array.isArray(profile.roles) ? profile.roles : [profile.role || ''];
    return Boolean(
        profile.is_owner === true ||
        profile.role === 'owner' ||
        roles.includes('owner') ||
        profile.id === 'nivas_naidu_ad' ||
        (profile.email && profile.email.toLowerCase() === 'nivasnaiduad@lpu-quick.com') ||
        profile.id === 'user_admin_bh13' ||
        (profile.email && profile.email.toLowerCase() === 'admin@lpu.in')
    );
}

function applyAdminRolePermissions(profile) {
    if (!profile) return 'dashboard';
    currentAdminProfile = profile;
    try {
        localStorage.setItem('lpuquick_admin_profile', JSON.stringify(profile));
    } catch (e) { }

    const roles = Array.isArray(profile.roles) ? profile.roles : ['store_manager'];
    const isOwner = isPlatformOwner(profile);

    // Strict Privacy & Role-Based Security: Financial Intelligence is strictly owner-only
    const finCard = document.getElementById('financial-security-card');
    if (finCard) {
        finCard.classList.toggle('hidden', !isOwner);
    }
    document.querySelectorAll('.owner-only-col').forEach(el => {
        el.classList.toggle('hidden', !isOwner);
    });

    // Update bottom left profile bar
    const nameEl = document.getElementById('admin-user-display');
    const roleEl = document.getElementById('admin-role-display');
    const avatarEl = document.getElementById('admin-user-avatar');

    if (nameEl) nameEl.textContent = profile.name || 'Admin';
    if (roleEl) {
        if (isOwner) {
            roleEl.textContent = 'Owner • Super Admin';
            roleEl.className = 'text-[10px] text-amber-700 font-bold truncate';
        } else {
            const roleLabels = [];
            if (roles.includes('store_manager')) roleLabels.push('Store Mgr');
            if (roles.includes('inventory_manager')) roleLabels.push('Inventory');
            if (roles.includes('delivery_person')) roleLabels.push('Delivery');
            const myHostels = (profile.assigned_hostels && profile.assigned_hostels.length > 0)
                ? profile.assigned_hostels
                : (profile.assigned_hostel_id ? [profile.assigned_hostel_id] : []);
            const hostelTag = myHostels.length > 0 ? ` • ${myHostels.join(', ')}` : '';
            roleEl.textContent = (roleLabels.join(' • ') || 'Staff Member') + hostelTag;
            roleEl.className = 'text-[10px] text-[#1a73e8] font-semibold truncate';
        }
    }
    if (avatarEl) {
        avatarEl.textContent = isOwner ? '👑' : (profile.name ? profile.name[0].toUpperCase() : 'A');
        avatarEl.className = `w-8 h-8 rounded-full ${isOwner ? 'bg-amber-500' : 'bg-[#1a73e8]'} text-white flex items-center justify-center text-xs font-bold shrink-0`;
    }

    // Top Bar Assigned Hostel Indicator
    const topBadge = document.getElementById('top-hostel-badge');
    const topName = document.getElementById('top-hostel-name');
    const mobHostel = document.getElementById('top-hostel-name-mobile');
    if (topBadge && topName) {
        const myHostels = (profile.assigned_hostels && profile.assigned_hostels.length > 0)
            ? profile.assigned_hostels
            : (profile.assigned_hostel_id ? [profile.assigned_hostel_id] : []);
        if (!isOwner && myHostels.length > 0) {
            const hLabel = myHostels.length > 2
                ? `${myHostels.slice(0, 2).join(', ')} +${myHostels.length - 2}`
                : myHostels.join(', ');
            topName.textContent = `${hLabel} Dark-Store`;
            if (mobHostel) mobHostel.textContent = hLabel;
            topBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066cc] border border-blue-200';
            topBadge.classList.remove('hidden');
        } else if (isOwner) {
            topName.textContent = 'All Campus Hostels (Owner)';
            if (mobHostel) mobHostel.textContent = 'All Hostels';
            topBadge.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300';
            topBadge.classList.remove('hidden');
        } else {
            topBadge.classList.add('hidden');
        }
    }

    // Filter sidebar navigation buttons based on data-required-role & owner restrictions
    document.querySelectorAll('#desktop-nav .nav-item, .nav-item, .owner-only-nav, [data-required-role]').forEach(btn => {
        const req = btn.dataset?.requiredRole || '';
        const view = btn.dataset?.view || '';
        const isOwnerOnly = (btn.classList.contains('owner-only-nav') || req === 'owner' || view === 'hostel-groups' || view === 'employees' || view === 'staff' || view === 'hostels' || view === 'daily-revenue' || view === 'backup' || view === 'advertisements' || view === 'offers-charges' || view === 'customer-notifications') && view !== 'food-dept';

        if (isOwnerOnly && !isOwner) {
            btn.classList.add('hidden');
            return;
        }

        if (req === 'all' || !req) {
            btn.classList.remove('hidden');
        } else if (isOwner) {
            btn.classList.remove('hidden');
        } else {
            const allowed = req.split(',').map(s => s.trim());
            const hasAccess = allowed.some(r => roles.includes(r));
            btn.classList.toggle('hidden', !hasAccess);
        }
    });

    // Multi-Hostel Restrictions: Populate and set appropriate filters for Store Managers
    if (typeof populateHostelDropdowns === 'function') {
        populateHostelDropdowns();
    }
    const myAssignedHostels = (profile.assigned_hostels && profile.assigned_hostels.length > 0)
        ? profile.assigned_hostels
        : (profile.assigned_hostel_id ? [profile.assigned_hostel_id] : []);
    if (!isOwner) {
        if (myAssignedHostels.length === 1) {
            const single = myAssignedHostels[0];
            ['products-hostel-filter', 'inventory-hostel-filter', 'orders-hostel-filter', 'dr-hostel-filter', 'lock-hostel-filter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = single;
                    el.disabled = true;
                }
            });
            if (typeof activeAdminHostelFilter !== 'undefined') {
                activeAdminHostelFilter.orders = single;
                activeAdminHostelFilter.products = single;
                activeAdminHostelFilter.inventory = single;
                activeAdminHostelFilter.clientLock = single;
            }
        } else if (myAssignedHostels.length > 1) {
            // Enable selector so admin can view all assigned hostels or pick a specific one
            ['products-hostel-filter', 'inventory-hostel-filter', 'orders-hostel-filter', 'dr-hostel-filter', 'lock-hostel-filter'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.disabled = false;
                    el.value = 'ALL';
                }
            });
            if (typeof activeAdminHostelFilter !== 'undefined') {
                activeAdminHostelFilter.orders = 'ALL';
                activeAdminHostelFilter.products = 'ALL';
                activeAdminHostelFilter.inventory = 'ALL';
                activeAdminHostelFilter.clientLock = 'ALL';
            }
        }
    }

    // Pick appropriate starting view if current activeView is disallowed
    let initialView = 'dashboard';
    if (!isOwner) {
        if (!roles.includes('store_manager')) {
            if (roles.includes('delivery_person')) {
                initialView = 'orders';
            } else if (roles.includes('inventory_manager')) {
                initialView = 'inventory';
            }
        }
    }
    return initialView;
}

function getAdminAuthToken() {
    return localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || (typeof adminToken !== 'undefined' ? adminToken : '');
}
window.getAdminAuthToken = getAdminAuthToken;

// Headers for protected API calls
function getAuthHeaders(extra = {}) {
    const token = getAdminAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...extra
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-admin-token'] = token;
        headers['x-admin-key'] = token;
    }
    return headers;
}

let isHandlingAuthError = false;
function handleAdminAuthError(res) {
    if (isHandlingAuthError) return;
    // CRITICAL: HTTP 403 Forbidden is a permission refusal for a sub-resource, NOT session death!
    // Never clear credentials or force logout on 403!
    if (res && res.status === 403) {
        console.warn('[Admin Auth] Access forbidden (403) for requested endpoint. Session preserved.');
        showToast('⚠️ You do not have permission to access this section.', 'warning');
        return;
    }
    isHandlingAuthError = true;
    console.warn('[Admin Auth] Session invalid or expired (401). Verifying session before action...');

    // Resilient verification: Check with server before wiping token to prevent logout on transient spikes
    const currentToken = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || adminToken;
    if (currentToken) {
        fetch('/api/admin/verify', {
            headers: { 'Authorization': `Bearer ${currentToken}`, 'x-admin-token': currentToken }
        }).then(vRes => {
            if (vRes.ok) {
                console.info('[Admin Auth] Session re-verified successfully. Token preserved.');
                isHandlingAuthError = false;
                return;
            }
            performLogout();
        }).catch(() => {
            console.warn('[Admin Auth] Transient network disconnect. Session preserved.');
            isHandlingAuthError = false;
        });
    } else {
        performLogout();
    }

    function performLogout() {
        try { localStorage.removeItem('lpuquick_admin_token'); sessionStorage.removeItem('lpuquick_admin_token'); adminToken = ''; } catch (e) {}
        updateConnectionStatus(false, 'Auth Required');
        showToast('⚠️ Admin session authorization required. Please sign in.', 'error');
        setTimeout(() => {
            showLoginModal();
            const errBox = document.getElementById('login-error-box');
            const errTxt = document.getElementById('login-error-text');
            if (errBox) errBox.classList.remove('hidden');
            if (errTxt) errTxt.textContent = 'Session authorization expired. Please enter password to reconnect live orders.';
            isHandlingAuthError = false;
        }, 400);
    }
}

// Resilient fetch wrapper with timeout prevention and auth error detection
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        if (res.status === 401) {
            handleAdminAuthError(res);
        }
        return res;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

// Global Customer Display Name Formatter (Extracts verified names or clean email prefixes)
function formatCustomerDisplayName(o) {
    if (!o) return 'Student';
    const rawName = o.customer_name;
    if (rawName && typeof rawName === 'string') {
        const trimmed = rawName.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed.length > 1 &&
            !lower.startsWith('user_') &&
            !lower.startsWith('order_') &&
            !lower.startsWith('guest_') &&
            lower !== 'customer' &&
            lower !== 'student' &&
            lower !== 'campus student' &&
            lower !== 'campus resident' &&
            lower !== 'lpu student' &&
            lower !== 'anonymous' &&
            lower !== 'legacy order') {
            return trimmed;
        }
    }

    const email = (o.customer_email && !o.customer_email.endsWith('@lpu.in')) ? o.customer_email : (o.customer_email || '');
    if (email && typeof email === 'string' && email.includes('@')) {
        const emailPrefix = email.split('@')[0].trim();
        if (emailPrefix && !emailPrefix.toLowerCase().startsWith('user_')) {
            const formatted = emailPrefix.replace(/[._-]/g, ' ').split(' ')
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            if (formatted.length > 0) return formatted;
        }
    }

    const phone = o.customer_phone;
    if (phone && typeof phone === 'string' && phone.replace(/\D/g, '').length >= 10) {
        return `Student (+91 ${phone.replace(/\D/g, '').slice(-10)})`;
    }

    if (email && typeof email === 'string' && email.includes('@')) {
        return email.split('@')[0];
    }

    const uid = o.user_id;
    if (uid && typeof uid === 'string') {
        return `Student (${uid.replace('user_', '').slice(0, 8).toUpperCase()})`;
    }

    return 'Student';
}

// Mobile Drawer & Off-Canvas Navigation Controller
window.toggleMobileMenu = function (forceState) {
    const aside = document.getElementById('admin-sidebar') || document.querySelector('aside');
    const backdrop = document.getElementById('mobile-sidebar-backdrop');
    if (!aside) return;

    const isCurrentlyOpen = !aside.classList.contains('-translate-x-full');
    const shouldOpen = (typeof forceState === 'boolean') ? forceState : !isCurrentlyOpen;

    if (shouldOpen) {
        aside.classList.remove('-translate-x-full');
        if (backdrop) {
            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
        }
        document.body.classList.add('overflow-hidden');
    } else {
        aside.classList.add('-translate-x-full');
        if (backdrop) {
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 250);
        }
        document.body.classList.remove('overflow-hidden');
    }
};

// Global helper to keep pending order badges in sync across desktop and mobile bottom bar
function updatePendingOrdersBadge(count) {
    const val = Number(count) || 0;
    const desktopBadge = document.getElementById('nav-pending-badge');
    const mobileBadge = document.getElementById('mobile-nav-orders-badge');
    [desktopBadge, mobileBadge].forEach(badge => {
        if (badge) {
            badge.textContent = val;
            badge.classList.toggle('hidden', val <= 0);
        }
    });
}
window.updatePendingOrdersBadge = updatePendingOrdersBadge;

// View Navigation
function switchView(viewName) {
    // Role-based view protection
    if (currentAdminProfile && !isPlatformOwner(currentAdminProfile)) {
        const roles = currentAdminProfile.roles || [];
        const viewRoles = {
            'client-lock': ['owner', 'store_manager'],
            'products': ['owner', 'store_manager', 'inventory_manager'],
            'inventory': ['owner', 'store_manager', 'inventory_manager'],
            'orders': ['owner', 'store_manager', 'delivery_person'],
            'earnings': ['owner', 'store_manager', 'delivery_person'],
            'daily-revenue': ['owner'],
            'customers': ['owner', 'store_manager'],
            'blacklist': ['owner', 'store_manager'],
            'analytics': ['owner', 'store_manager'],
            'staff': ['owner'],
            'employees': ['owner'],
            'advertisements': ['owner'],
            'backup': ['owner'],
            'settings': ['owner'],
            'hostels': ['owner'],
            'hostel-groups': ['owner'],
            'hostel-overview': ['owner', 'store_manager'],
            'offers-charges': ['owner'],
            'payment-management': ['owner'],
            'customer-notifications': ['owner'],
            'upi-config': ['owner'],
            'food-dept': ['owner', 'store_manager', 'cook', 'food_department', 'food'],
            'partners-overview': ['owner'],
            'partners-add': ['owner'],
            'partners-manage': ['owner'],
            'partners-hostels': ['owner'],
            'partners-investments': ['owner'],
            'partners-profits': ['owner'],
            'partners-payments': ['owner'],
            'partners-reports': ['owner'],
            'order-mode-management': ['owner'],
            'takeaway-fee-settings': ['owner']
        };

        const required = viewRoles[viewName];
        if (required && !required.some(r => roles.includes(r))) {
            showToast('Access restricted for your staff role', 'warning');
            const fallback = (roles.includes('cook') || roles.includes('food_department') || roles.includes('food')) ? 'food-dept' : (roles.includes('delivery_person') ? 'orders' : (roles.includes('inventory_manager') ? 'inventory' : 'dashboard'));
            if (viewName !== fallback) {
                switchView(fallback);
                return;
            }
        }
    }

    activeView = viewName;
    document.querySelectorAll('#main-content > div').forEach(el => el.classList.add('hidden'));

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Sync Mobile Bottom Navigation Active Highlight
    document.querySelectorAll('.mobile-nav-item').forEach(btn => {
        const isCurrent = btn.dataset.view === viewName;
        btn.classList.toggle('active', isCurrent);
        btn.classList.toggle('text-[#0066cc]', isCurrent);
        btn.classList.toggle('text-[#5c5f60]', !isCurrent);
        const label = btn.querySelector('span:last-child');
        if (label) {
            label.classList.toggle('font-bold', isCurrent);
            label.classList.toggle('font-medium', !isCurrent);
        }
    });

    const titles = {
        'dashboard': 'Dashboard Overview',
        'client-lock': 'Client Dashboard Control & Store Availability',
        'products': 'Product Catalog Management',
        'inventory': 'Real-Time Inventory & Stock',
        'orders': 'Campus Orders Queue',
        'earnings': 'Delivery Partner Earnings & Shift Statistics',
        'daily-revenue': 'Daily Revenue & Net Profit Intelligence (Owner Only)',
        'customers': 'Student Customer Directory',
        'blacklist': 'Blacklist & Fraud Prevention',
        'analytics': 'Business Analytics & Reports',
        'staff': 'Admin Team & Access Levels',
        'advertisements': 'Promotional Advertisements & Posters',
        'backup': 'Backup & Disaster Recovery (0 - 100)',
        'settings': 'Store Settings',
        'hostels': 'Campus Hostels & Dark Stores (Owner Only)',
        'hostel-groups': 'Hostel Group Management & Shared Inventory (Owner Only)',
        'hostel-overview': 'Selected Hostel Overview & 360° Intelligence',
        'employees': 'Employees & Dark Store Roster',
        'offers-charges': 'Offers & Charges — Global Pricing & Offer Rules (Owner Only)',
        'payment-management': 'Payment & Refund Management (Super Admin Only)',
        'customer-notifications': 'Customer Broadcast & Push Notifications (Super Admin Only)',
        'upi-config': 'UPI Gateway & Merchant Configuration (Super Admin Only)',
        'food-dept': 'Food Department & Kitchen Operations',
        'partners-overview': 'Partnership Management Hub — Executive Overview',
        'partners-add': 'Add New Business Partner',
        'partners-manage': 'Partner Directory & Management',
        'partners-hostels': 'Campus Hostel Assignment Matrix',
        'partners-investments': 'Partner Investment Management',
        'partners-profits': 'Profit Management & Operational Expense Ledger',
        'partners-payments': 'Partner Payments & Settlement History',
        'partners-reports': 'Partnership Financial Reports & Statements',
        'order-mode-management': 'Order Mode Management (Delivery & Takeaway Controls)',
        'takeaway-fee-settings': 'Takeaway Maintenance Fee Settings'
    };
    const currentTitle = titles[viewName] || 'Dashboard';
    const topTitle = document.getElementById('top-title');
    if (topTitle) topTitle.textContent = currentTitle;
    const topTitleMob = document.getElementById('top-title-mobile');
    if (topTitleMob) topTitleMob.textContent = currentTitle;

    // Automatically close off-canvas drawer on mobile navigation selection
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        toggleMobileMenu(false);
    }

    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'client-lock') loadClientLockState();
    else if (viewName === 'products') loadProducts();
    else if (viewName === 'inventory') loadInventory();
    else if (viewName === 'orders') loadOrders();
    else if (viewName === 'earnings') loadDeliveryEarnings();
    else if (viewName === 'daily-revenue') loadDailyRevenueView();
    else if (viewName === 'customers') loadCustomers();
    else if (viewName === 'blacklist') loadBlacklistData();
    else if (viewName === 'analytics') loadAnalytics();
    else if (viewName === 'staff') loadStaffList();
    else if (viewName === 'advertisements') loadAdvertisementsView();
    else if (viewName === 'backup') loadBackupDashboard();
    else if (viewName === 'hostels') loadHostels();
    else if (viewName === 'hostel-overview') {
        if (!isPlatformOwner()) {
            showToast('Access restricted: Selected Hostel Overview is owner-confidential', 'error');
            switchView('dashboard');
            return;
        }
        loadHostelOverview();
    }
    else if (viewName === 'hostel-groups') loadHostelGroups();
    else if (viewName === 'employees') loadEmployeesList();
    else if (viewName === 'offers-charges') loadOffersChargesView();
    else if (viewName === 'payment-management') loadPaymentManagementView();
    else if (viewName === 'customer-notifications') loadBroadcastNotificationsData();
    else if (viewName === 'upi-config') loadUpiConfigView();
    else if (viewName === 'food-dept') loadFoodDeptAdmin();
    else if (viewName === 'partners-overview') loadPartnerOverview();
    else if (viewName === 'partners-add') initAddPartnerView();
    else if (viewName === 'partners-manage') loadPartnersList();
    else if (viewName === 'partners-hostels') loadHostelsMatrix();
    else if (viewName === 'partners-investments') loadPartnerInvestments();
    else if (viewName === 'partners-profits') loadPartnerProfits();
    else if (viewName === 'partners-payments') loadPartnerPayments();
    else if (viewName === 'partners-reports') loadPartnerReports();
    else if (viewName === 'order-mode-management') loadOrderModeManagement();
    else if (viewName === 'takeaway-fee-settings') loadTakeawayFeeSettings();

    try {
        if (typeof window !== 'undefined' && window.location.hash.replace(/^#\/?/, '') !== viewName) {
            history.replaceState(null, '', `#${viewName}`);
        }
    } catch (e) { }
}

// Automatic Hash-Based View Router for Admin Portal (/admin#upi-config, /admin#payment-management)
if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace(/^#\/?/, '');
        if (hash && hash !== activeView && typeof switchView === 'function') switchView(hash);
    });
    const triggerHashRoute = () => {
        let route = window.location.hash.replace(/^#\/?/, '');
        if (!route && window.location.pathname) {
            const cleanPath = window.location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
            if (cleanPath && cleanPath !== 'index.html' && cleanPath !== 'admin') {
                route = cleanPath;
            }
        }
        if (route && typeof switchView === 'function') {
            setTimeout(() => switchView(route), 150);
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', triggerHashRoute);
    } else {
        setTimeout(triggerHashRoute, 150);
    }
}


// Master Live Real-Time Refresh Controller
async function refreshCurrentView() {
    const refreshBtn = document.getElementById('btn-header-refresh');
    const refreshIcon = document.getElementById('btn-header-refresh-icon') || refreshBtn?.querySelector('.material-symbols-outlined');
    const mainContent = document.getElementById('main-content');

    if (refreshIcon) refreshIcon.classList.add('animate-spin');
    if (refreshBtn) refreshBtn.disabled = true;
    if (mainContent) mainContent.style.opacity = '0.6';

    try {
        // Burst backend cache so fresh queries run against Supabase
        try {
            await Promise.allSettled([
                fetchWithTimeout(`/api/orders/admin/invalidate-cache?_t=${Date.now()}`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                }, 3000),
                fetchWithTimeout(`/api/products/admin/invalidate-cache?_t=${Date.now()}`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                }, 3000)
            ]);
        } catch (e) { }

        // Reload data based on active view and refresh global components
        const promises = [
            loadClientLockState(),
            syncOrdersLive()
        ];

        if (activeView === 'dashboard') {
            promises.push(loadDashboard());
        } else if (activeView === 'client-lock') {
            promises.push(loadClientLockState());
        } else if (activeView === 'products') {
            promises.push(loadProducts(true));
        } else if (activeView === 'inventory') {
            promises.push(loadInventory(true));
        } else if (activeView === 'orders') {
            promises.push(loadOrders());
        } else if (activeView === 'earnings') {
            promises.push(loadDeliveryEarnings());
        } else if (activeView === 'daily-revenue') {
            promises.push(loadDailyRevenueView(true));
        } else if (activeView === 'customers') {
            promises.push(loadCustomers());
        } else if (activeView === 'blacklist') {
            promises.push(loadBlacklistData());
        } else if (activeView === 'analytics') {
            promises.push(loadAnalytics());
        } else if (activeView === 'advertisements') {
            promises.push(loadAdvertisementsView());
        } else if (activeView === 'hostels') {
            promises.push(loadHostels());
        } else if (activeView === 'employees') {
            promises.push(loadEmployeesList());
        } else if (activeView === 'offers-charges') {
            promises.push(loadOffersChargesView());
        } else if (activeView === 'payment-management') {
            promises.push(loadPaymentManagementView(currentPaymentsPage));
        } else if (activeView === 'upi-config') {
            promises.push(loadUpiConfigView());
        }

        await Promise.allSettled(promises);
        const orderCount = ordersCache.length || 0;
        showToast(`✓ Synced ${orderCount} live orders from database`, 'success');
    } catch (err) {
        console.error('[Refresh Error]:', err);
        showToast('Failed to refresh data: ' + err.message, 'warning');
    } finally {
        if (mainContent) mainContent.style.opacity = '1';
        setTimeout(() => {
            if (refreshIcon) refreshIcon.classList.remove('animate-spin');
            if (refreshBtn) refreshBtn.disabled = false;
        }, 400);
    }
}


// ================= 1. DASHBOARD LOAD =================
async function loadDashboard() {
    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function') ? (getActiveAdminHostelFilter('orders') || getActiveAdminHostelFilter('products')) : null;
        const hostelParam = hostelId ? `?hostel_id=${encodeURIComponent(hostelId)}` : '';
        const [analyticsRes, ordersRes] = await Promise.allSettled([
            fetchWithTimeout(`/api/orders/admin/analytics${hostelParam}`, { headers: getAuthHeaders() }, 15000),
            fetchWithTimeout(`/api/orders/admin/all${hostelParam}`, { headers: getAuthHeaders() }, 15000)
        ]);

        let analyticsData = {};
        let ordersData = {};

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
            analyticsData = await analyticsRes.value.json().catch(() => ({}));
        } else if (analyticsRes.status === 'fulfilled' && analyticsRes.value.status === 401) {
            handleAdminAuthError(analyticsRes.value);
            return;
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
            ordersData = await ordersRes.value.json().catch(() => ({}));
        } else if (ordersRes.status === 'fulfilled' && ordersRes.value.status === 401) {
            handleAdminAuthError(ordersRes.value);
            return;
        }

        // Cache orders immediately
        if (ordersData.orders && Array.isArray(ordersData.orders)) {
            ordersCache = ordersData.orders;
            try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(ordersCache)); } catch (e) { }
        }

        // Ensure productsCache is populated cleanly (reuse cached catalog unless empty)
        try {
            const needForceProd = !Array.isArray(productsCache) || productsCache.length === 0;
            const prodRes = await fetchWithTimeout(`/api/products?includeInactive=true${hostelParam}${needForceProd ? '&force=true' : ''}`, { headers: getAuthHeaders() }, 8000);
            if (prodRes && prodRes.ok) {
                const prodJson = await prodRes.json();
                const list = Array.isArray(prodJson) ? prodJson : (prodJson.products || prodJson.data || []);
                if (list.length > 0) {
                    productsCache = list;
                    try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
                }
            }
        } catch (e) { }

        const m = analyticsData.metrics || {};

        // Compute metrics with instant fallback from cached orders & products (never display zeros when data is in cache)
        const totalOrdersVal = (m.totalOrdersCount !== undefined && m.totalOrdersCount > 0)
            ? m.totalOrdersCount
            : (ordersCache.length || (m.totalOrdersCount !== undefined ? m.totalOrdersCount : 0));
        const pendingCountVal = m.pendingOrdersCount !== undefined
            ? m.pendingOrdersCount
            : (ordersCache.filter(o => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(o.status)).length);
        const totalProdVal = (m.totalProducts !== undefined && m.totalProducts > 0)
            ? m.totalProducts
            : (productsCache.length || (m.totalProducts !== undefined ? m.totalProducts : 0));
        const totalStockVal = (m.totalStock !== undefined && m.totalStock > 0)
            ? m.totalStock
            : (productsCache.reduce((s, p) => s + (Number(p.stock_left) || 0), 0) || 0);
        const lowStockVal = m.lowStockCount !== undefined
            ? m.lowStockCount
            : (productsCache.filter(p => p.stock_left > 0 && p.stock_left <= 4).length || 0);

        const elTotalProd = document.getElementById('dash-total-products');
        const elTotalStock = document.getElementById('dash-total-stock');
        const elLowStock = document.getElementById('dash-low-stock');
        const elTotalOrders = document.getElementById('dash-total-orders');
        const elPendingOrders = document.getElementById('dash-pending-orders');

        if (elTotalProd) elTotalProd.textContent = totalProdVal;
        if (elTotalStock) elTotalStock.textContent = totalStockVal;
        if (elLowStock) elLowStock.textContent = lowStockVal;
        if (elTotalOrders) elTotalOrders.textContent = totalOrdersVal;
        if (elPendingOrders) elPendingOrders.textContent = pendingCountVal;

        updatePendingOrdersBadge(pendingCountVal);

        // Load and sync store lock state
        loadClientLockState();
        checkFinancialStatus();

        // Cache & Render Recent Orders (preserve if network had temporary hiccup)
        if (ordersData.orders && Array.isArray(ordersData.orders) && ordersData.orders.length > 0) {
            ordersCache = ordersData.orders;
        }
        renderRecentOrdersTable(ordersCache);
        updateDailyRevenue();
        renderDashboardHostelCards();
        if (typeof isFoodDeptAdmin === 'function' && isFoodDeptAdmin()) { loadDashboardFoodQueue(); } else { const fCard = document.getElementById('dash-food-dept-card'); if (fCard) fCard.classList.add('hidden'); }

        // Render Low Stock Containers
        const lowContainer = document.getElementById('dash-low-stock-container');
        const lowItems = analyticsData.lowStockItems || [];
        if (lowItems.length === 0) {
            lowContainer.innerHTML = `<div class="text-xs text-center text-[#137333] py-4 font-semibold">✓ All products have healthy inventory!</div>`;
        } else {
            lowContainer.innerHTML = lowItems.map(p => `
                <div class="flex justify-between items-center p-2.5 rounded-lg bg-[#f7fafd] border border-[#DADCE0]">
                    <div class="flex items-center gap-2.5">
                        <img src="${p.image_url}" class="w-8 h-8 rounded object-cover bg-[#ebeef2]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${p.name}</p>
                            <p class="text-[10px] text-[#5c5f60]">${p.category}</p>
                        </div>
                    </div>
                    <span class="text-xs font-bold text-[#ba1a1a]">${p.stock_left || 0} left</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
}


// ================= CLIENT DASHBOARD LOCK CONTROLS =================
let _lastLockResponse = null;

function getAdminAssignedHostels() {
    if (!currentAdminProfile) return [];
    if (Array.isArray(currentAdminProfile.assigned_hostels) && currentAdminProfile.assigned_hostels.length > 0) {
        return currentAdminProfile.assigned_hostels;
    }
    if (currentAdminProfile.assigned_hostel_id) {
        return [currentAdminProfile.assigned_hostel_id];
    }
    return [];
}

async function loadClientLockState() {
    try {
        const targetHostel = getActiveLockHostel();
        const hostelParam = (targetHostel && targetHostel !== 'ALL') ? `?hostel_id=${encodeURIComponent(targetHostel)}` : '';
        const res = await fetch(`/api/admin/client-lock${hostelParam}`, { headers: getAuthHeaders() });
        const data = await res.json();
        _lastLockResponse = data;
        if (data.success && data.availability) {
            updateClientLockUI(data.availability, data.target_hostel || targetHostel || 'ALL');
        }
        // Panoramic per-hostel lock overview grid:
        // Platform Owner sees all hostels + master lock; Store Managers see their assigned hostels
        const isOwner = Boolean(data.is_owner || (typeof isPlatformOwner === 'function' && isPlatformOwner(currentAdminProfile)));
        const overviewCard = document.getElementById('lock-hostel-overview-card');
        if (data.all_hostel_locks && (isOwner || (Array.isArray(data.all_hostel_locks.hostels) && data.all_hostel_locks.hostels.length > 0))) {
            renderLockHostelOverview(data.all_hostel_locks);
        } else {
            if (overviewCard) overviewCard.classList.add('hidden');
        }
    } catch (err) {
        console.error('Error loading client lock state:', err);
    }
}

function getActiveLockHostel() {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();

    if (!isOwner && myHostels.length > 0) {
        const active = activeAdminHostelFilter?.clientLock;
        if (active === 'ALL' || (!active && myHostels.length > 1)) {
            return 'ALL';
        }
        if (active) {
            const cleanActive = String(active).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const matched = myHostels.find(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanActive);
            if (matched) return matched;
        }
        return myHostels.length > 1 ? 'ALL' : myHostels[0];
    }
    return activeAdminHostelFilter?.clientLock || 'ALL';
}

function onLockHostelFilterChange(val) {
    activeAdminHostelFilter.clientLock = val;
    loadClientLockState();
}

function refreshClientLockState() {
    loadClientLockState();
}

function formatClientReopenHeadline(avail) {
    if (!avail) return "We'll reopen soon";
    const targetEnd = avail.end_at || avail.reopen_at;
    if (targetEnd) {
        const end = new Date(targetEnd);
        if (!isNaN(end.getTime())) {
            const now = new Date();
            const isToday = end.toDateString() === now.toDateString();
            const tomorrow = new Date(now.getTime() + 86400000);
            const isTomorrow = end.toDateString() === tomorrow.toDateString();

            let hours = end.getHours();
            const minutes = end.getMinutes();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12 || 12;
            const minStr = String(minutes).padStart(2, '0');
            const timeStr = `${hours}:${minStr} ${ampm}`;

            let dayWording = 'today';
            if (isToday) dayWording = 'today';
            else if (isTomorrow) dayWording = 'tomorrow';
            else dayWording = `on ${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;

            return `We'll reopen at ${timeStr}, ${dayWording}`;
        }
    }
    return avail.display_reopen?.fullHeadline || (avail.message ? avail.message : "Store is currently CLOSED for orders");
}

function updateClientLockUI(avail, targetHostelLabel) {
    clientLockState = avail;
    const isLocked = Boolean(avail.is_locked);
    const lockStatus = avail.lock_status || (isLocked ? 'LOCKED' : 'AVAILABLE');
    const hostelTag = targetHostelLabel && targetHostelLabel !== 'ALL' ? ` (${targetHostelLabel})` : '';

    // Update Dashboard Quick Banner
    const dashPill = document.getElementById('dash-store-status-pill');
    const dashText = document.getElementById('dash-store-status-text');
    const navBadge = document.getElementById('nav-lock-badge');

    if (dashPill && dashText) {
        if (isLocked) {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]';
            if (avail.locked_by_master) {
                dashText.textContent = 'STORE LOCKED (All Hostels - Closed by Platform Owner)';
            } else {
                dashText.textContent = 'STORE LOCKED' + hostelTag;
            }
        } else if (avail.partial_locked && avail.locked_hostel_names?.length) {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#ffeed9] text-[#b06000] border border-[#ffcc80]';
            dashText.textContent = `⚠️ ${avail.locked_hostel_names.length} HOSTEL CLOSED (${avail.locked_hostel_names.join(', ')})`;
        } else if (lockStatus === 'SCHEDULED') {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]';
            dashText.textContent = 'LOCK SCHEDULED' + hostelTag;
        } else {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]';
            dashText.textContent = 'STORE OPEN' + hostelTag;
        }
    }

    if (navBadge) {
        if (isLocked) {
            navBadge.textContent = 'LOCKED';
            navBadge.className = 'text-[10px] bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full font-bold';
            navBadge.classList.remove('hidden');
        } else if (avail.partial_locked && avail.locked_hostel_names?.length) {
            navBadge.textContent = 'PARTIAL';
            navBadge.className = 'text-[10px] bg-[#b06000] text-white px-2 py-0.5 rounded-full font-bold';
            navBadge.classList.remove('hidden');
        } else if (lockStatus === 'SCHEDULED') {
            navBadge.textContent = 'SCHED';
            navBadge.className = 'text-[10px] bg-[#b06000] text-white px-2 py-0.5 rounded-full font-bold';
            navBadge.classList.remove('hidden');
        } else {
            navBadge.classList.add('hidden');
        }
    }

    // Update Client Lock View elements
    const heroCard = document.getElementById('lock-hero-card');
    const stateBadge = document.getElementById('lock-state-badge');
    const headline = document.getElementById('lock-headline-display');
    const sub = document.getElementById('lock-sub-display');
    const timerBox = document.getElementById('lock-timer-box');
    const quickUnlockBtn = document.getElementById('btn-quick-unlock');

    if (!heroCard) return;

    if (isLocked) {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#ba1a1a] bg-[#ffdad6]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]';
        stateBadge.textContent = avail.locked_by_master ? 'STORE LOCKED (Global - Closed by Platform Owner)' : ('STORE LOCKED' + hostelTag);
        headline.textContent = formatClientReopenHeadline(avail);
        sub.textContent = avail.message
            ? `Admin message: "${avail.message}"`
            : (avail.locked_by_master
                ? "Platform Owner has closed all hostels for orders. Students cannot submit checkout orders."
                : "Students cannot submit checkout orders for this hostel. Cart building is preserved.");
        quickUnlockBtn?.classList.remove('hidden');

        const targetEnd = avail.end_at || avail.reopen_at;
        let countdownSecs = (typeof avail.remaining_seconds === 'number' && !isNaN(avail.remaining_seconds)) ? avail.remaining_seconds : null;
        if ((countdownSecs === null || countdownSecs <= 0) && targetEnd) {
            countdownSecs = Math.max(0, Math.floor((new Date(targetEnd).getTime() - Date.now()) / 1000));
        }

        if (countdownSecs && countdownSecs > 0) {
            timerBox?.classList.remove('hidden');
            startLockCountdown(countdownSecs, targetEnd);
        } else {
            timerBox?.classList.add('hidden');
            if (lockTickerInterval) clearInterval(lockTickerInterval);
        }
    } else if (avail.partial_locked && avail.locked_hostel_names?.length) {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#b06000] bg-[#ffeed9]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#ffeed9] text-[#b06000] border border-[#ffcc80]';
        stateBadge.textContent = `⚠️ PARTIAL LOCK (${avail.locked_hostel_names.join(', ')})`;
        headline.textContent = `${avail.locked_hostel_names.join(', ')} closed by store manager`;
        sub.textContent = 'Other hostels are open. You can click on the hostel card in the overview grid below to view details or unlock.';
        timerBox?.classList.add('hidden');
        quickUnlockBtn?.classList.add('hidden');
        if (lockTickerInterval) clearInterval(lockTickerInterval);
    } else if (lockStatus === 'SCHEDULED') {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#b06000] bg-[#fef7e0]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]';
        stateBadge.textContent = 'SCHEDULED LOCK' + hostelTag;
        headline.textContent = `Scheduled to lock at ${new Date(avail.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        sub.textContent = `Lock window: ${new Date(avail.start_at).toLocaleString()} until ${new Date(avail.end_at).toLocaleString()}`;
        timerBox?.classList.add('hidden');
        quickUnlockBtn?.classList.add('hidden');
        if (lockTickerInterval) clearInterval(lockTickerInterval);
    } else {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#137333] bg-[#e6f4ea]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#e6f4ea] text-[#137333] border border-[#ceead6]';
        stateBadge.textContent = 'AVAILABLE (OPEN)' + hostelTag;
        headline.textContent = 'Store is OPEN for student orders' + hostelTag;
        sub.textContent = 'Students can browse products, manage their cart, and place orders with 3-minute delivery.';
        timerBox?.classList.add('hidden');
        quickUnlockBtn?.classList.add('hidden');
        if (lockTickerInterval) clearInterval(lockTickerInterval);
    }

    // Synchronize the hostel dropdown filter
    const filterSelect = document.getElementById('lock-hostel-filter');
    const isOwnerUser = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();
    if (filterSelect) {
        if (!isOwnerUser && myHostels.length > 0) {
            if (myHostels.length === 1) {
                filterSelect.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = myHostels[0];
                opt.textContent = `🏢 ${myHostels[0]}`;
                filterSelect.appendChild(opt);
                filterSelect.value = myHostels[0];
                filterSelect.disabled = true;
            } else {
                filterSelect.innerHTML = '';
                const allOpt = document.createElement('option');
                allOpt.value = 'ALL';
                allOpt.textContent = `🏢 All My Assigned Hostels (${myHostels.length} Hostels)`;
                filterSelect.appendChild(allOpt);

                myHostels.forEach(hId => {
                    const matched = hostelsCache.find(h => h.id === hId || (h.id && hId && h.id.replace(/[^A-Z0-9]/g, '') === hId.replace(/[^A-Z0-9]/g, '')));
                    const opt = document.createElement('option');
                    opt.value = hId;
                    opt.textContent = `🏢 ${matched?.name || hId} (${hId})`;
                    filterSelect.appendChild(opt);
                });
                filterSelect.disabled = false;
                if (!targetHostelLabel || targetHostelLabel === 'ALL') {
                    filterSelect.value = 'ALL';
                } else {
                    const cleanTarget = String(targetHostelLabel || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
                    const matched = myHostels.find(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget);
                    filterSelect.value = matched || 'ALL';
                }
            }
        } else if (targetHostelLabel) {
            if (!Array.from(filterSelect.options).some(o => o.value === targetHostelLabel)) {
                const opt = document.createElement('option');
                opt.value = targetHostelLabel;
                opt.textContent = targetHostelLabel === 'ALL' ? '🏢 All Campus Hostels' : `🏢 ${targetHostelLabel}`;
                filterSelect.appendChild(opt);
            }
            filterSelect.value = targetHostelLabel;
            filterSelect.disabled = false;
        }
    }

    // Update target badge and button text in the Lock Configuration form
    const lockTargetLabel = document.getElementById('lock-target-hostel-label');
    if (lockTargetLabel) {
        if (targetHostelLabel && targetHostelLabel !== 'ALL') {
            lockTargetLabel.textContent = targetHostelLabel;
        } else {
            lockTargetLabel.textContent = isOwnerUser ? 'All Campus Hostels (Global Master Lock)' : `All My Assigned Hostels (${myHostels.join(', ')})`;
        }
    }

    const btnApplyText = document.getElementById('btn-apply-lock-text');
    if (btnApplyText) {
        if (targetHostelLabel && targetHostelLabel !== 'ALL') {
            btnApplyText.textContent = `Lock ${targetHostelLabel} Storefront Now`;
        } else {
            btnApplyText.textContent = isOwnerUser ? 'Lock All Hostels Now (Global)' : `Lock All My Hostels Now (${myHostels.length})`;
        }
    }

    const btnQuickUnlockText = document.getElementById('btn-quick-unlock-text');
    if (btnQuickUnlockText) {
        if (targetHostelLabel && targetHostelLabel !== 'ALL') {
            btnQuickUnlockText.textContent = `Unlock ${targetHostelLabel} Storefront Now`;
        } else {
            btnQuickUnlockText.textContent = isOwnerUser ? 'Unlock All Hostels Globally' : `Unlock All My Hostels Now (${myHostels.length})`;
        }
    }
}

function startLockCountdown(seconds, endAt) {
    if (lockTickerInterval) clearInterval(lockTickerInterval);

    const endTimestamp = endAt ? new Date(endAt).getTime() : Date.now() + (seconds * 1000);

    const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTimestamp - now) / 1000));

        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');

        const countdownEl = document.getElementById('lock-timer-countdown');
        if (countdownEl) {
            countdownEl.textContent = `${h}:${m}:${s}`;
        }

        if (diff <= 0) {
            clearInterval(lockTickerInterval);
            loadClientLockState(); // Auto refresh when expired!
        }
    };

    updateTimer();
    lockTickerInterval = setInterval(updateTimer, 1000);
}

function handleLockModeChange() {
    const selectedMode = document.querySelector('input[name="lock_mode"]:checked')?.value || 'IMMEDIATE';
    const durationSection = document.getElementById('section-duration-picker');
    const scheduleSection = document.getElementById('section-schedule-picker');
    const btnText = document.getElementById('btn-apply-lock-text');

    document.querySelectorAll('.lock-mode-card').forEach(card => {
        const radio = card.querySelector('input[type="radio"]');
        if (radio && radio.checked) {
            card.className = 'lock-mode-card border-2 border-[#3c4043] bg-[#3c4043]/5 p-4 rounded-xl cursor-pointer flex flex-col gap-2 transition-all';
        } else {
            card.className = 'lock-mode-card border border-[#DADCE0] p-4 rounded-xl cursor-pointer flex flex-col gap-2 hover:border-[#3c4043] transition-all';
        }
    });

    if (selectedMode === 'DURATION' || selectedMode === 'IMMEDIATE') {
        durationSection?.classList.remove('hidden');
        scheduleSection?.classList.add('hidden');
        if (btnText) btnText.textContent = selectedMode === 'DURATION' ? 'Start Duration Lock' : 'Lock Client Dashboard Now';
    } else if (selectedMode === 'SCHEDULED') {
        durationSection?.classList.add('hidden');
        scheduleSection?.classList.remove('hidden');
        if (btnText) btnText.textContent = 'Save Scheduled Lock';
    } else {
        durationSection?.classList.add('hidden');
        scheduleSection?.classList.add('hidden');
        if (btnText) btnText.textContent = 'Apply Manual Lock (Indefinite)';
    }

}

function setDurationMins(mins) {
    const input = document.getElementById('input-custom-duration');
    if (input) input.value = mins;

    document.querySelectorAll('.duration-chip').forEach(chip => {
        const match = chip.textContent.includes(`${mins} `) || (mins === 480 && chip.textContent.includes('8 Hours'));
        if (match) {
            chip.className = 'duration-chip active px-4 py-2 rounded-lg border-2 border-[#3c4043] bg-[#3c4043] text-white font-semibold';
        } else {
            chip.className = 'duration-chip px-4 py-2 rounded-lg border border-[#DADCE0] bg-white font-semibold hover:border-[#3c4043]';
        }
    });

    updateDurationPreview();
}

function setDurationUntil(targetHour) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(targetHour, 0, 0, 0);
    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1); // Tomorrow morning
    }
    const diffMins = Math.max(1, Math.round((target.getTime() - now.getTime()) / 60000));

    const input = document.getElementById('input-custom-duration');
    if (input) input.value = diffMins;

    document.querySelectorAll('.duration-chip').forEach(chip => {
        const match = chip.textContent.includes(`Until ${targetHour}:00`);
        if (match) {
            chip.className = 'duration-chip active px-4 py-2 rounded-lg border-2 border-[#3c4043] bg-[#3c4043] text-white font-semibold';
        } else {
            chip.className = 'duration-chip px-4 py-2 rounded-lg border border-[#DADCE0] bg-white font-semibold hover:border-[#3c4043]';
        }
    });

    updateDurationPreview();
}

function updateDurationPreview() {
    const mins = parseInt(document.getElementById('input-custom-duration')?.value, 10);
    const previewEl = document.getElementById('duration-reopen-preview');
    if (!mins || isNaN(mins) || mins <= 0) {
        if (previewEl) previewEl.textContent = '';
        return;
    }
    const end = new Date(Date.now() + (mins * 60000));
    let hours = end.getHours();
    const minutes = end.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const minStr = String(minutes).padStart(2, '0');
    const isToday = end.toDateString() === (new Date()).toDateString();
    const day = isToday ? 'today' : 'tomorrow';
    if (previewEl) {
        previewEl.textContent = `(Reopens at ${hours}:${minStr} ${ampm}, ${day})`;
    }
}


async function handleApplyLock(e) {
    if (e) e.preventDefault();
    const mode = document.querySelector('input[name="lock_mode"]:checked')?.value || 'IMMEDIATE';
    const message = document.getElementById('input-lock-message')?.value || '';
    const durationMins = document.getElementById('input-custom-duration')?.value || 30;
    let startAt = null;
    let endAt = null;
    if (mode === 'SCHEDULED') {
        const startRaw = document.getElementById('input-schedule-start')?.value;
        const endRaw = document.getElementById('input-schedule-end')?.value;
        if (startRaw) {
            const d = new Date(startRaw);
            if (!isNaN(d.getTime())) startAt = d.toISOString();
        }
        if (endRaw) {
            const d = new Date(endRaw);
            if (!isNaN(d.getTime())) endAt = d.toISOString();
        }
    }
    let targetHostel = getActiveLockHostel();
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();
    if (!isOwner && myHostels.length > 0) {
        const cleanTarget = String(targetHostel || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const matched = myHostels.find(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget);
        if (matched) {
            targetHostel = matched;
        } else {
            targetHostel = myHostels[0];
        }
    }

    const payload = {
        lock_type: mode,
        message: message,
        duration_minutes: durationMins,
        start_at: startAt,
        end_at: endAt,
        hostel_id: targetHostel
    };

    try {
        const res = await fetch('/api/admin/client-lock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || 'Client lock settings applied.', 'success');
            if (data.all_hostel_locks) {
                renderLockHostelOverview(data.all_hostel_locks);
            }
            if (data.availability) {
                updateClientLockUI(data.availability, data.target_hostel || targetHostel);
            }
            // Refresh panoramic overview after change
            loadClientLockState();
        } else {
            alert('Failed to apply lock: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error applying lock: ' + err.message);
    }
}

async function handleUnlockStore(overrideHostel) {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();
    let targetHostel = overrideHostel || getActiveLockHostel();
    if (!isOwner) {
        if (targetHostel !== 'ALL') {
            const cleanTarget = String(targetHostel).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const matched = myHostels.find(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget);
            if (!matched) {
                alert(`Access denied: You can only unlock your assigned stores (${myHostels.join(', ')}).`);
                return;
            }
            targetHostel = matched;
        }
    }
    const hostelLabel = (targetHostel && targetHostel !== 'ALL') ? ` for ${targetHostel}` : (isOwner ? ' globally for all hostels' : ' for all your assigned hostels');
    if (!confirm(`Are you sure you want to UNLOCK the client storefront${hostelLabel} and make orders available now?`)) {
        return;
    }
    try {
        const res = await authFetch('/api/admin/client-lock', {
            method: 'DELETE',
            body: JSON.stringify({ hostel_id: targetHostel })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || `Storefront${hostelLabel} is now AVAILABLE for orders.`, 'success');
            if (data.all_hostel_locks) {
                renderLockHostelOverview(data.all_hostel_locks);
            }
            if (data.availability) {
                updateClientLockUI(data.availability, data.target_hostel || targetHostel);
            }
            // Refresh panoramic overview after change
            loadClientLockState();
        } else {
            alert('Failed to unlock store: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Error unlocking store: ' + err.message);
    }
}

// Per-Hostel Lock Status Overview
function selectLockHostel(hostelId) {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();

    if (!isOwner) {
        if (hostelId && hostelId !== 'ALL') {
            const cleanTarget = String(hostelId).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const canAccess = myHostels.some(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget);
            if (!canAccess) {
                alert(`Access denied: You can only select and manage your assigned stores (${myHostels.join(', ')}).`);
                return;
            }
        }
    }

    if (!hostelId) hostelId = (isOwner || myHostels.length > 1) ? 'ALL' : (myHostels[0] || 'BH-13');
    activeAdminHostelFilter.clientLock = hostelId;
    const select = document.getElementById('lock-hostel-filter');
    if (select) {
        const cleanH = String(hostelId).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const found = Array.from(select.options).find(o => String(o.value).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanH || (hostelId === 'ALL' && o.value === 'ALL'));
        if (found) {
            select.value = found.value;
        } else {
            const opt = document.createElement('option');
            opt.value = hostelId;
            opt.textContent = hostelId === 'ALL' ? (isOwner ? '🏢 All Campus Hostels' : '🏢 All My Assigned Hostels') : `🏢 ${hostelId}`;
            select.appendChild(opt);
            select.value = hostelId;
        }
    }
    loadClientLockState();
}
window.selectLockHostel = selectLockHostel;

function renderLockHostelOverview(allHostelLocks) {
    const overviewCard = document.getElementById('lock-hostel-overview-card');
    const grid = document.getElementById('lock-hostel-overview-grid');
    const summary = document.getElementById('lock-hostel-overview-summary');
    if (!overviewCard || !grid) return;

    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();

    // Backend returns { master_lock, hostels: [...] }
    let hostels = [];
    let masterLock = null;
    if (allHostelLocks && typeof allHostelLocks === 'object') {
        if (Array.isArray(allHostelLocks)) {
            hostels = allHostelLocks;
        } else {
            masterLock = allHostelLocks.master_lock || null;
            hostels = allHostelLocks.hostels || [];
        }
    }

    if (!isOwner && myHostels.length > 0) {
        const allowedNorms = new Set(myHostels.map(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '')));
        hostels = hostels.filter(h => allowedNorms.has(String(h.hostel_id).toUpperCase().replace(/[^A-Z0-9]/g, '')));
    }

    if (hostels.length === 0) {
        overviewCard.classList.add('hidden');
        return;
    }

    overviewCard.classList.remove('hidden');

    let lockedCount = 0;
    let totalCount = hostels.length;
    let cardsHtml = '';
    const currentHostel = getActiveLockHostel() || (isOwner ? 'ALL' : (myHostels[0] || 'BH-13'));

    // Master Lock Card (Global Control - Only for Platform Owner)
    if (masterLock && isOwner) {
        const isSelected = (currentHostel === 'ALL');
        const mLocked = Boolean(masterLock.is_locked);
        const mClosedBy = masterLock.closed_by_name || 'Nivas Naidu (Main Admin)';
        const mOpenedBy = masterLock.opened_by_name || 'Nivas Naidu (Main Admin)';

        // RED if closed, GREEN if open
        const mBg = isSelected
            ? (mLocked ? 'bg-[#fff5f5]' : 'bg-[#f0fdf4]')
            : (mLocked ? 'bg-[#fff8f8]' : 'bg-[#f6fef9]');
        const mBorder = isSelected
            ? 'border-2 border-[#0066cc] ring-2 ring-[#0066cc]/40 shadow-md'
            : (mLocked ? 'border-[#fca5a5] hover:border-[#dc2626]' : 'border-[#86efac] hover:border-[#16a34a]');
        const mDot = mLocked ? 'bg-[#dc2626] ring-2 ring-[#dc2626]/30 animate-pulse' : 'bg-[#16a34a] ring-2 ring-[#16a34a]/30';
        const mBadge = mLocked
            ? `<span class="inline-flex items-center gap-1 text-[9.5px] font-black text-[#dc2626] bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fecaca]">🔴 GLOBAL CLOSED</span>`
            : `<span class="inline-flex items-center gap-1 text-[9.5px] font-black text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded border border-[#bbf7d0]">🟢 GLOBAL OPEN</span>`;
        const mAttribution = mLocked
            ? `<p class="text-[9.5px] font-semibold text-[#991b1b] truncate mt-0.5" title="Closed by ${escapeHtml(mClosedBy)}">🔴 Closed by: <span class="font-extrabold text-[#7f1d1d]">${escapeHtml(mClosedBy)}</span></p>`
            : `<p class="text-[9.5px] font-semibold text-[#166534] truncate mt-0.5" title="Opened by ${escapeHtml(mOpenedBy)}">🟢 Opened by: <span class="font-extrabold text-[#14532d]">${escapeHtml(mOpenedBy)}</span></p>`;
        const mAction = mLocked
            ? `<button type="button" onclick="event.stopPropagation(); handleUnlockStore('ALL')" class="text-[9px] font-bold text-[#16a34a] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔓 Unlock ALL</button>`
            : `<button type="button" onclick="event.stopPropagation(); quickLockSingleHostel('ALL')" class="text-[9px] font-bold text-[#dc2626] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔒 Lock ALL</button>`;

        cardsHtml += `
            <div onclick="selectLockHostel('ALL')"
                 class="${mBg} border ${mBorder} rounded-xl p-3 flex flex-col gap-1 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer col-span-full sm:col-span-1 relative ${isSelected ? 'scale-[1.02]' : ''}"
                 title="Click to select and configure Global Master Lock">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black ${mLocked ? 'text-[#7f1d1d]' : 'text-[#14532d]'} flex items-center gap-1.5">
                        <span>🏢 ALL</span>
                        ${isSelected ? '<span class="text-[9px] px-1.5 py-0.2 bg-[#0066cc] text-white rounded font-bold uppercase tracking-wider">Selected</span>' : ''}
                    </span>
                    <span class="w-2.5 h-2.5 rounded-full ${mDot} inline-block" title="${mLocked ? 'Closed' : 'Open'}"></span>
                </div>
                <p class="text-[10px] text-[#5c5f60] font-medium">Global Master Lock</p>
                <div class="mt-0.5">${mBadge}</div>
                ${mAttribution}
                ${mAction}
            </div>
        `;
    }

    hostels.forEach(h => {
        const isEffectiveLocked = Boolean(h.effective_locked);
        const isDirectLocked = Boolean(h.direct_lock && h.direct_lock.is_locked);
        const lockedByMaster = Boolean(h.locked_by_master);
        const isClosed = Boolean(isEffectiveLocked || isDirectLocked);

        if (isClosed) lockedCount++;

        const hostelName = h.hostel_name || h.hostel_id || '—';
        const hostelId = h.hostel_id || '';
        const hostelStatus = h.status === 'OFF' ? ' <span class="text-[8px] text-[#dc2626] font-bold bg-[#fee2e2] px-1 py-0.2 rounded border border-[#fecaca]">[OFF]</span>' : '';
        const isSelected = (currentHostel && String(currentHostel).toUpperCase().replace(/[^A-Z0-9]/g, '') === String(hostelId).toUpperCase().replace(/[^A-Z0-9]/g, ''));

        const managerName = h.manager_name || (h.status === 'OFF' ? 'Unassigned (Inactive)' : 'Unassigned (Main Admin)');
        const closedBy = h.closed_by_name || (lockedByMaster ? 'Nivas Naidu (Main Admin) (via Global Switch)' : (managerName && managerName !== 'Unassigned' ? `${managerName} (Store Manager)` : 'Main Admin'));
        const openedBy = h.opened_by_name || (managerName && managerName !== 'Unassigned' ? `${managerName} (Store Manager)` : 'Main Admin');

        let bgClass, borderClass, dotColor, badgeHtml, attributionHtml, actionBtn;

        if (isClosed) {
            // RED THEME for CLOSED STORE
            bgClass = isSelected ? 'bg-[#fff5f5]' : 'bg-[#fff8f8]';
            borderClass = isSelected
                ? 'border-2 border-[#0066cc] ring-2 ring-[#0066cc]/40 shadow-md'
                : 'border-[#fca5a5] hover:border-[#dc2626]';
            dotColor = 'bg-[#dc2626] ring-2 ring-[#dc2626]/30 animate-pulse';

            let badgeText = '🔴 CLOSED';
            if (lockedByMaster) {
                badgeText = '🔒 VIA GLOBAL';
            } else if (h.direct_lock?.lock_status === 'SCHEDULED') {
                badgeText = '⏳ SCHEDULED CLOSE';
            } else if (h.status === 'OFF') {
                badgeText = '🔴 CLOSED [OFF]';
            }

            badgeHtml = `<span class="inline-flex items-center gap-1 font-black text-[#dc2626] bg-[#fee2e2] px-1.5 py-0.5 rounded border border-[#fecaca] text-[9.5px]">${badgeText}</span>`;
            attributionHtml = `<p class="text-[9.5px] font-semibold text-[#991b1b] truncate mt-0.5" title="Closed by ${escapeHtml(closedBy)}">🔴 Closed by: <span class="font-extrabold text-[#7f1d1d]">${escapeHtml(closedBy)}</span></p>`;

            if (isDirectLocked) {
                actionBtn = `<button type="button" onclick="event.stopPropagation(); handleUnlockStore('${hostelId}')" class="text-[9px] font-bold text-[#16a34a] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔓 Unlock Hostel</button>`;
            } else {
                actionBtn = `<button type="button" onclick="event.stopPropagation(); quickLockSingleHostel('${hostelId}')" class="text-[9px] font-bold text-[#dc2626] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔒 Lock Hostel</button>`;
            }
            if (lockedByMaster) {
                actionBtn += `<span class="text-[8.5px] text-[#991b1b] font-medium block mt-0.5" title="Store is closed campus-wide by Platform Owner">(Global Master Lock Active)</span>`;
            }
        } else {
            // GREEN THEME for OPEN STORE
            bgClass = isSelected ? 'bg-[#f0fdf4]' : 'bg-[#f6fef9]';
            borderClass = isSelected
                ? 'border-2 border-[#0066cc] ring-2 ring-[#0066cc]/40 shadow-md'
                : 'border-[#86efac] hover:border-[#16a34a]';
            dotColor = 'bg-[#16a34a] ring-2 ring-[#16a34a]/30';

            badgeHtml = `<span class="inline-flex items-center gap-1 font-black text-[#16a34a] bg-[#dcfce7] px-1.5 py-0.5 rounded border border-[#bbf7d0] text-[9.5px]">🟢 OPEN</span>`;
            attributionHtml = `<p class="text-[9.5px] font-semibold text-[#166534] truncate mt-0.5" title="Opened by ${escapeHtml(openedBy)}">🟢 Opened by: <span class="font-extrabold text-[#14532d]">${escapeHtml(openedBy)}</span></p>`;

            actionBtn = `<button type="button" onclick="event.stopPropagation(); quickLockSingleHostel('${hostelId}')" class="text-[9px] font-bold text-[#dc2626] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔒 Lock Hostel</button>`;
        }

        cardsHtml += `
            <div onclick="selectLockHostel('${hostelId}')"
                 class="${bgClass} border ${borderClass} rounded-xl p-3 flex flex-col gap-1 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer relative ${isSelected ? 'scale-[1.02]' : ''}"
                 title="Click to select and configure lock settings for ${hostelId}">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black ${isClosed ? 'text-[#7f1d1d]' : 'text-[#14532d]'} flex items-center gap-1.5">
                        <span>${hostelId}</span>
                        ${isSelected ? '<span class="text-[9px] px-1.5 py-0.2 bg-[#0066cc] text-white rounded font-bold uppercase tracking-wider">Selected</span>' : ''}
                    </span>
                    <span class="w-2.5 h-2.5 rounded-full ${dotColor} inline-block" title="${isClosed ? 'Closed' : 'Open'}"></span>
                </div>
                <p class="text-[10px] text-[#5c5f60] font-medium truncate">${hostelName}${hostelStatus}</p>
                <p class="text-[9.5px] text-[#4b5563] truncate">👤 Mgr: <span class="font-bold text-[#1f2937]">${escapeHtml(managerName)}</span></p>
                <div class="mt-0.5">${badgeHtml}</div>
                ${attributionHtml}
                ${actionBtn}
            </div>
        `;
    });

    grid.innerHTML = cardsHtml;

    if (summary) {
        if (lockedCount === totalCount) {
            summary.innerHTML = `<span class="text-[#dc2626] font-extrabold bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fecaca]">${lockedCount}/${totalCount} locked</span>`;
        } else if (lockedCount === 0) {
            summary.innerHTML = `<span class="text-[#16a34a] font-extrabold bg-[#dcfce7] px-2 py-0.5 rounded border border-[#bbf7d0]">All ${totalCount} stores OPEN</span>`;
        } else {
            summary.innerHTML = `<span class="text-[#dc2626] font-bold">${lockedCount} locked</span> <span class="text-[#5c5f60]">/</span> <span class="text-[#16a34a] font-bold">${totalCount - lockedCount} open</span>`;
        }
    }
}

async function quickLockSingleHostel(hostelId) {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    const myHostels = getAdminAssignedHostels();

    if (!isOwner) {
        if (hostelId !== 'ALL') {
            const cleanTarget = String(hostelId).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const canAccess = myHostels.some(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanTarget);
            if (!canAccess) {
                alert(`Access denied: You can only lock or unlock your assigned stores (${myHostels.join(', ')}).`);
                return;
            }
        }
    }
    const label = hostelId === 'ALL' ? (isOwner ? 'all campus hostels globally' : 'all your assigned hostels') : hostelId;
    if (!confirm(`Lock storefront for ${label} immediately?`)) return;
    try {
        const res = await authFetch('/api/admin/client-lock', {
            method: 'POST',
            body: JSON.stringify({ lock_type: 'IMMEDIATE', duration_minutes: 30, hostel_id: hostelId })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || `${label} locked.`, 'success');
            if (data.all_hostel_locks) {
                renderLockHostelOverview(data.all_hostel_locks);
            }
            if (data.availability) {
                updateClientLockUI(data.availability, data.target_hostel || hostelId);
            }
            loadClientLockState();
        } else {
            alert('Failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}


// ================= ORDER STATUS RECONCILIATION GUARD =================
const recentOrderStatusUpdates = new Map(); // orderId -> { status, payment_method, payment_status, timestamp }

function registerRecentOrderStatusUpdate(orderId, status, paymentMethod = null, paymentStatus = null) {
    if (!orderId || !status) return;
    recentOrderStatusUpdates.set(orderId, {
        status,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        timestamp: Date.now()
    });
}

function reconcileWithRecentOrderUpdates(orders) {
    if (!Array.isArray(orders)) return orders;
    const now = Date.now();
    for (const [id, info] of recentOrderStatusUpdates.entries()) {
        if (now - info.timestamp > 30000) {
            recentOrderStatusUpdates.delete(id);
        }
    }
    return orders.map(o => {
        if (!o || !o.id) return o;
        const recent = recentOrderStatusUpdates.get(o.id);
        if (recent && (now - recent.timestamp <= 30000)) {
            return {
                ...o,
                status: recent.status,
                payment_method: recent.payment_method || o.payment_method,
                payment_status: recent.payment_status || o.payment_status
            };
        }
        return o;
    });
}

// ================= 2. PRODUCTS LOAD =================
const recentStockUpdates = new Map(); // `${hostelId}:${productId}` -> { stock_left, in_stock, timestamp }

function getRecentStockKey(productId, hostelId) {
    const h = (hostelId || (typeof getActiveAdminHostelFilter === 'function' ? getActiveAdminHostelFilter('products') : null) || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${h}:${productId}`;
}

function registerRecentStockUpdate(productId, stock_left, in_stock, hostelId = null) {
    if (!productId) return;
    const key = getRecentStockKey(productId, hostelId);
    recentStockUpdates.set(key, {
        stock_left: Math.max(0, Number(stock_left) || 0),
        in_stock: Boolean(in_stock && Number(stock_left) > 0),
        timestamp: Date.now()
    });
}

function reconcileWithRecentStockUpdates(products, hostelId = null) {
    if (!Array.isArray(products)) return products;
    const now = Date.now();
    // Retain updates within 30 seconds
    for (const [key, info] of recentStockUpdates.entries()) {
        if (now - info.timestamp > 30000) {
            recentStockUpdates.delete(key);
        }
    }
    return products.map(p => {
        const key = getRecentStockKey(p.id, hostelId || p.hostel_id);
        const recent = recentStockUpdates.get(key);
        if (recent && (now - recent.timestamp <= 30000)) {
            return {
                ...p,
                stock_left: recent.stock_left,
                in_stock: recent.in_stock
            };
        }
        return p;
    });
}

let currentProductRequestSeq = 0;
async function loadProducts(force = true) {
    const reqSeq = ++currentProductRequestSeq;
    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('products') : null;
        const hostelParam = hostelId ? `&hostel_id=${encodeURIComponent(hostelId)}` : '';
        const forceParam = `&force=true&_t=${Date.now()}`;
        const res = await fetchWithTimeout(`/api/products?includeInactive=true${hostelParam}${forceParam}`, { headers: getAuthHeaders() }, 8000);
        if (reqSeq !== currentProductRequestSeq) return; // Stale query finished late, discard
        if (res.ok) {
            const data = await res.json();
            if (reqSeq !== currentProductRequestSeq) return;
            if (data.products && Array.isArray(data.products)) {
                productsCache = reconcileWithRecentStockUpdates(data.products, hostelId);
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
            }
        }
        filterProducts();
    } catch (err) {
        if (reqSeq !== currentProductRequestSeq) return;
        console.warn('Network timeout loading products, rendering available cache:', err);
        filterProducts();
    }
}

let currentProductFilter = 'all';
function setProductStatusFilter(status) {
    currentProductFilter = status;
    document.querySelectorAll('.prod-filter-btn').forEach(btn => {
        const active = btn.dataset.status === status;
        btn.className = `prod-filter-btn px-4 py-1.5 rounded-full text-xs transition-all ${active ? 'bg-[#3c4043] text-white font-semibold' : 'border border-[#DADCE0] text-[#5c5f60] hover:bg-[#f1f4f7] font-medium'}`;
    });
    filterProducts();
}

function getAdminAssignedHostelsNormSet() {
    if (isPlatformOwner(currentAdminProfile)) return null;
    if (!currentAdminProfile) return new Set();
    const list = (currentAdminProfile.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
    if (list.length === 0) return new Set();
    return new Set(list.map(h => (h || '').toUpperCase().replace(/[^A-Z0-9]/g, '')));
}
window.getAdminAssignedHostelsNormSet = getAdminAssignedHostelsNormSet;

function filterProducts() {
    const isOwner = isPlatformOwner();
    document.querySelectorAll('.owner-only-col').forEach(el => {
        el.classList.toggle('hidden', !isOwner);
    });

    const query = (document.getElementById('product-search-input')?.value || '').toLowerCase();
    const prodHostel = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('products') : null;
    const allowedSet = getAdminAssignedHostelsNormSet();

    let filtered = productsCache.filter(p => {
        if (p.deleted) return false;
        const matchesQuery = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;

        const pHostelNorm = (p.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Non-owners must NEVER see products from unassigned hostels (e.g. BH-13)
        if (allowedSet && !allowedSet.has(pHostelNorm)) {
            return false;
        }

        if (prodHostel && prodHostel !== 'ALL') {
            return pHostelNorm === prodHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        return true;
    });

    if (currentProductFilter === 'active') {
        filtered = filtered.filter(p => p.in_stock && p.stock_left > 0);
    } else if (currentProductFilter === 'low') {
        filtered = filtered.filter(p => p.stock_left > 0 && p.stock_left <= 4);
    } else if (currentProductFilter === 'out') {
        filtered = filtered.filter(p => !p.in_stock || p.stock_left === 0);
    }

    const tbody = document.getElementById('products-table-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isOwner ? 10 : 7}" class="p-6 text-center text-[#5c5f60]">No matching products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : (p.in_stock ? (p.stock_left || 0) : 0);
        const statusBadge = stock > 4
            ? `<button onclick="toggleProductStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-in-stock cursor-pointer hover:opacity-80 transition-all" title="Click to mark Out of Stock">In Stock</button>`
            : (stock > 0
                ? `<button onclick="toggleProductStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-low-stock cursor-pointer hover:opacity-80 transition-all" title="Click to mark Out of Stock">Low Stock (${stock} left)</button>`
                : `<button onclick="toggleProductStock('${p.id}', true)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-out-of-stock cursor-pointer hover:opacity-80 transition-all" title="Click to set in-stock amount">Out of Stock</button>`);

        const costPrice = Number(p.cost_price !== undefined ? p.cost_price : (p.cost || 0)) || 0;
        const sellingPrice = Number(p.price) || 0;
        const mrp = Number(p.mrp || p.price) || sellingPrice;
        const profitPerUnit = Math.max(0, sellingPrice - costPrice);
        const marginPct = sellingPrice > 0 ? ((profitPerUnit / sellingPrice) * 100).toFixed(1) : '0.0';

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.image_url}" class="w-10 h-10 rounded-md object-cover border border-[#DADCE0] bg-[#f1f4f7]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${p.name}</p>
                            <p class="text-[10px] text-[#5c5f60] flex items-center gap-1.5 flex-wrap">
                                <span>${p.unit || 'piece'} • ${p.size || ''}</span>
                                <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0066cc] border border-blue-200">${p.hostel_id || 'BH-13'}</span>
                            </p>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-[#5c5f60]">${p.category}</td>
                ${isOwner ? `<td class="p-4 text-[#5c5f60] font-medium">₹${costPrice.toFixed(2)}</td>` : ''}
                <td class="p-4 font-bold text-[#181c1f]">₹${sellingPrice.toFixed(2)}</td>
                <td class="p-4 text-[#74777a] line-through">₹${mrp.toFixed(2)}</td>
                ${isOwner ? `<td class="p-4 font-bold text-emerald-600">₹${profitPerUnit.toFixed(2)}</td>` : ''}
                ${isOwner ? `
                <td class="p-4">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${marginPct > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'}">
                        ${marginPct}%
                    </span>
                </td>` : ''}
                <td class="p-4">
                    <button onclick="promptCustomStock('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${stock})" class="font-semibold text-xs text-[#181c1f] hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-all flex items-center gap-1 cursor-pointer border border-transparent hover:border-emerald-200" title="Click to change exact stock quantity">
                        <span>${stock}</span>
                        <span class="material-symbols-outlined text-[14px] text-[#74777a]">edit</span>
                    </button>
                </td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="editProduct('${p.id}')" class="p-1.5 text-[#5c5f60] hover:text-[#3c4043] hover:bg-[#ebeef2] rounded-md transition-all cursor-pointer" title="Edit Product">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deactivateProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#f59e0b] hover:bg-[#fef3c7] rounded-md transition-all cursor-pointer" title="Deactivate (Out of Stock)">
                            <span class="material-symbols-outlined text-[18px]">block</span>
                        </button>
                        ${isOwner ? `
                        <button onclick="deleteProductPermanently('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-all cursor-pointer" title="Delete Completely From Database">
                            <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================= 3. INVENTORY LOAD =================
let currentInventoryRequestSeq = 0;
async function loadInventory(force = true) {
    const reqSeq = ++currentInventoryRequestSeq;
    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('inventory') : null;
        const hostelParam = hostelId ? `&hostel_id=${encodeURIComponent(hostelId)}` : '';
        const forceParam = `&force=true&_t=${Date.now()}`;
        const res = await fetchWithTimeout(`/api/products?includeInactive=true${hostelParam}${forceParam}`, { headers: getAuthHeaders() }, 8000);
        if (reqSeq !== currentInventoryRequestSeq) return;
        if (res.ok) {
            const data = await res.json();
            if (reqSeq !== currentInventoryRequestSeq) return;
            if (data.products && Array.isArray(data.products)) {
                productsCache = reconcileWithRecentStockUpdates(data.products, hostelId);
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
            }
        }
        filterInventory();
    } catch (err) {
        if (reqSeq !== currentInventoryRequestSeq) return;
        console.warn('Network timeout loading inventory, rendering available cache:', err);
        filterInventory();
    }
}

function updateInventoryKpiTiles() {
    if (!Array.isArray(productsCache)) return;

    const allowedSet = getAdminAssignedHostelsNormSet();
    let totalVal = 0;
    let totalUnits = 0;
    let inStockSkus = 0;
    let stockAlerts = 0;
    let totalSkus = 0;

    for (const p of productsCache) {
        if (p.deleted) continue;
        const pHostelNorm = (p.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (allowedSet && !allowedSet.has(pHostelNorm)) continue;
        totalSkus++;
        const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : (p.in_stock ? (p.stock_left || 0) : 0);
        const price = Number(p.price) || 0;
        totalVal += (stock * price);
        totalUnits += stock;
        if (stock > 0) inStockSkus++;
        if (stock <= 4) stockAlerts++;
    }

    const valEl = document.getElementById('inventory-total-value');
    const unitsEl = document.getElementById('inventory-total-units');
    const skusEl = document.getElementById('inventory-active-skus');
    const alertsEl = document.getElementById('inventory-stock-alerts');

    if (valEl) valEl.textContent = '₹' + Math.round(totalVal).toLocaleString('en-IN');
    if (unitsEl) unitsEl.textContent = totalUnits.toLocaleString('en-IN');
    if (skusEl) skusEl.textContent = totalSkus.toLocaleString('en-IN');
    if (alertsEl) alertsEl.textContent = stockAlerts.toLocaleString('en-IN');
}

function filterInventory() {
    updateInventoryKpiTiles();
    const query = (document.getElementById('inventory-search-input')?.value || '').toLowerCase();
    const invHostel = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('inventory') : null;
    const allowedSet = getAdminAssignedHostelsNormSet();

    const filtered = productsCache.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;

        const pHostelNorm = (p.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Non-owners must NEVER see inventory from unassigned hostels (e.g. BH-13)
        if (allowedSet && !allowedSet.has(pHostelNorm)) {
            return false;
        }

        if (invHostel && invHostel !== 'ALL') {
            return pHostelNorm === invHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        return true;
    });
    const tbody = document.getElementById('inventory-table-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#5c5f60]">No items matching inventory search.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : (p.in_stock ? (p.stock_left || 0) : 0);
        const statusBadge = stock > 4
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-in-stock">In Stock</span>'
            : (stock > 0
                ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-low-stock">Low Stock (${stock} left)</span>`
                : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-out-of-stock">Out of Stock</span>');

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.image_url}" class="w-8 h-8 rounded object-cover bg-[#f1f4f7]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <span class="font-semibold text-xs text-[#181c1f] block">${p.name}</span>
                            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0066cc] border border-blue-200">${p.hostel_id || 'BH-13'}</span>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-[#5c5f60]">${p.category}</td>
                <td class="p-4 font-bold text-sm text-[#181c1f]">${stock}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-center">
                    <div class="inline-flex items-center gap-1.5 bg-[#f1f4f7] p-1 rounded-lg border border-[#DADCE0]">
                        <button onclick="adjustStock('${p.id}', -1)" class="w-6 h-6 rounded bg-white hover:bg-[#ebeef2] text-xs font-bold flex items-center justify-center text-[#181c1f] shadow-sm">-1</button>
                        <span class="px-2 font-mono font-bold text-xs">${stock}</span>
                        <button onclick="adjustStock('${p.id}', 1)" class="w-6 h-6 rounded bg-white hover:bg-[#ebeef2] text-xs font-bold flex items-center justify-center text-[#181c1f] shadow-sm">+1</button>
                        <button onclick="adjustStock('${p.id}', 10)" class="w-7 h-6 rounded bg-[#3c4043] hover:bg-[#262a2d] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">+10</button>
                    </div>
                </td>
                <td class="p-4 text-right">
                    <button onclick="promptCustomStock('${p.id}', ${stock})" class="text-xs px-3 py-1 rounded-full border border-[#DADCE0] hover:bg-[#ebeef2] font-semibold">
                        Set Exact
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function adjustStock(productId, delta) {
    const p = productsCache.find(x => x.id === productId);
    const prevStock = p ? (p.stock_left !== undefined ? p.stock_left : 0) : 0;
    const prevInStock = p ? Boolean(p.in_stock) : false;
    const newStock = Math.max(0, prevStock + Number(delta));

    const hostelId = (typeof getActiveAdminHostelFilter === 'function')
        ? (getActiveAdminHostelFilter('inventory') || getActiveAdminHostelFilter('products'))
        : null;
    const targetHostel = hostelId || (p && (p.origin_hostel || p.hostel_id)) || 'BH-13';

    // Optimistic UI update
    if (p) {
        p.stock_left = newStock;
        p.in_stock = newStock > 0;
        registerRecentStockUpdate(productId, newStock, newStock > 0, targetHostel);
        try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
    }
    filterProducts();
    if (typeof filterInventory === 'function') filterInventory();

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, delta, hostel_id: targetHostel })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            if (p) {
                p.stock_left = data.stock_left;
                p.in_stock = data.in_stock;
                registerRecentStockUpdate(productId, data.stock_left, data.in_stock, targetHostel);
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
                filterProducts();
                if (typeof filterInventory === 'function') filterInventory();
            }
        } else {
            throw new Error(data.error || 'Failed to adjust stock');
        }
    } catch (err) {
        // Rollback to confirmed previous values
        if (p) {
            p.stock_left = prevStock;
            p.in_stock = prevInStock;
            registerRecentStockUpdate(productId, prevStock, prevInStock, targetHostel);
            try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
            filterProducts();
            if (typeof filterInventory === 'function') filterInventory();
        }
        alert('Stock update failed: ' + err.message);
    }
}

async function promptCustomStock(productId, name, current) {
    const p = productsCache.find(x => x.id === productId);
    const prevStock = p ? (p.stock_left !== undefined ? p.stock_left : 0) : 0;
    const prevInStock = p ? Boolean(p.in_stock) : false;

    const input = prompt(`Enter exact stock quantity for "${name}":`, current !== undefined ? current : prevStock);
    if (input === null) return;
    const parsed = parseInt(input, 10);
    if (isNaN(parsed) || parsed < 0) {
        alert('Please enter a valid non-negative integer.');
        return;
    }

    const hostelId = (typeof getActiveAdminHostelFilter === 'function')
        ? (getActiveAdminHostelFilter(activeView === 'inventory' ? 'inventory' : 'products'))
        : null;
    const targetHostel = hostelId || (p && (p.origin_hostel || p.hostel_id)) || 'BH-13';

    // Optimistic UI update
    if (p) {
        p.stock_left = parsed;
        p.in_stock = parsed > 0;
        registerRecentStockUpdate(productId, parsed, parsed > 0, targetHostel);
        try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
    }
    filterProducts();
    if (typeof filterInventory === 'function') filterInventory();

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, stock: parsed, hostel_id: targetHostel })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            if (p) {
                p.stock_left = data.stock_left;
                p.in_stock = data.in_stock;
                registerRecentStockUpdate(productId, data.stock_left, data.in_stock, targetHostel);
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
                filterProducts();
                if (typeof filterInventory === 'function') filterInventory();
            }
            showToast(`Updated "${name}" stock to ${parsed}`, 'success');
        } else {
            throw new Error(data.error || 'Server error updating stock');
        }
    } catch (err) {
        // Rollback to confirmed previous values
        if (p) {
            p.stock_left = prevStock;
            p.in_stock = prevInStock;
            registerRecentStockUpdate(productId, prevStock, prevInStock, targetHostel);
            try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
            filterProducts();
            if (typeof filterInventory === 'function') filterInventory();
        }
        alert('Stock update failed: ' + err.message);
    }
}

async function toggleProductStock(productId, inStock) {
    const p = productsCache.find(x => x.id === productId);
    if (!p) return;
    const prevStock = p.stock_left !== undefined ? p.stock_left : 0;
    const prevInStock = Boolean(p.in_stock);

    const hostelId = (typeof getActiveAdminHostelFilter === 'function')
        ? (getActiveAdminHostelFilter(activeView === 'inventory' ? 'inventory' : 'products'))
        : null;
    const targetHostel = hostelId || (p.origin_hostel || p.hostel_id) || 'BH-13';

    let targetStock = 0;
    if (inStock) {
        const input = prompt(`Enter exact stock quantity for "${p.name}":`, p.stock_left > 0 ? p.stock_left : '1');
        if (input === null) return;
        targetStock = parseInt(input, 10);
        if (isNaN(targetStock) || targetStock < 0) {
            alert('Please enter a valid non-negative integer.');
            return;
        }
    } else {
        if (!confirm(`Mark "${p.name}" as Out of Stock?`)) return;
        targetStock = 0;
    }

    p.in_stock = targetStock > 0;
    p.stock_left = targetStock;
    registerRecentStockUpdate(productId, targetStock, targetStock > 0, targetHostel);
    try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
    filterProducts();
    if (typeof filterInventory === 'function') filterInventory();

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, stock: targetStock, hostel_id: targetHostel })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            p.stock_left = data.stock_left;
            p.in_stock = data.in_stock;
            registerRecentStockUpdate(productId, data.stock_left, data.in_stock, targetHostel);
            try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
            filterProducts();
            if (typeof filterInventory === 'function') filterInventory();
            showToast(targetStock > 0 ? `Set "${p.name}" stock to ${targetStock}` : `Marked "${p.name}" Out of Stock`, 'success');
        } else {
            throw new Error(data.error || 'Failed to update stock');
        }
    } catch (err) {
        // Rollback to confirmed previous values
        p.stock_left = prevStock;
        p.in_stock = prevInStock;
        registerRecentStockUpdate(productId, prevStock, prevInStock, targetHostel);
        try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
        filterProducts();
        if (typeof filterInventory === 'function') filterInventory();
        alert('Stock update failed: ' + err.message);
    }
}

// ================= 4. ORDERS LOAD =================
async function loadOrders() {
    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('orders') : null;
        const hostelParam = hostelId ? `?hostel_id=${encodeURIComponent(hostelId)}` : '';
        const res = await fetchWithTimeout(`/api/orders/admin/all${hostelParam}`, { headers: getAuthHeaders() }, 15000);
        if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
                ordersCache = data.orders;
                try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(ordersCache)); } catch (e) { }
                updateDailyRevenue();
                updateKpiCountersFromCache();
            }
        } else if (res.status === 401) {
            handleAdminAuthError(res);
            return;
        }
        filterOrders();
    } catch (err) {
        console.warn('Network timeout loading orders, rendering available cache:', err);
        filterOrders();
    }
}

// ============================================================
// WEB PUSH NOTIFICATION CLIENT ENGINE (RFC 8291)
// ============================================================
let pushSubscription = null;
let vapidPublicKey = null;

// Listen for background service worker notifications clicking
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NAVIGATE_ORDER') {
            switchView('orders');
            if (event.data.orderId) {
                setTimeout(() => openOrderDrawer(event.data.orderId), 350);
            }
        }
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function getVapidKey() {
    if (vapidPublicKey) return vapidPublicKey;
    try {
        const res = await fetch('/api/notifications/vapid-public-key');
        const data = await res.json();
        if (data.success && data.publicKey) {
            vapidPublicKey = data.publicKey;
            return vapidPublicKey;
        }
    } catch (e) {
        console.warn('Failed to fetch VAPID key:', e.message);
    }
    return null;
}

async function checkPushStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        updatePushUI(false, 'Unsupported');
        return false;
    }

    try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
            updatePushUI(false);
            const banner = document.getElementById('push-unlock-banner');
            if (banner) {
                if (Notification.permission !== 'denied' && localStorage.getItem('lpuquick_push_dismissed') !== 'true') {
                    banner.classList.remove('hidden');
                } else {
                    banner.classList.add('hidden');
                }
            }
            return false;
        }

        pushSubscription = await reg.pushManager.getSubscription();
        const isSubscribed = Boolean(pushSubscription);
        updatePushUI(isSubscribed);

        const banner = document.getElementById('push-unlock-banner');
        if (banner) {
            if (!isSubscribed && Notification.permission !== 'denied' && localStorage.getItem('lpuquick_push_dismissed') !== 'true') {
                banner.classList.remove('hidden');
            } else {
                banner.classList.add('hidden');
            }
        }
        return isSubscribed;
    } catch (e) {
        console.warn('Error checking push status:', e);
        return false;
    }
}

function updatePushUI(active, label) {
    const btn = document.getElementById('btn-push-toggle');
    const icon = document.getElementById('push-icon');
    const text = document.getElementById('push-status-text');

    if (!btn || !icon || !text) return;

    if (label === 'Unsupported') {
        btn.classList.add('hidden');
        return;
    }

    if (active) {
        btn.className = 'bg-emerald-50 hover:bg-emerald-100 text-[#137333] border border-emerald-300 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95';
        icon.textContent = 'notifications_active';
        text.textContent = 'Push Alerts: ON';
        text.className = 'hidden sm:inline text-emerald-800';
    } else {
        btn.className = 'bg-blue-50 hover:bg-blue-100 text-[#1a73e8] border border-blue-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95';
        icon.textContent = 'notifications';
        text.textContent = 'Push Alerts: OFF';
        text.className = 'hidden sm:inline text-[#1a73e8]';
    }
}

let isEnablingPush = false;

async function enablePushNotifications() {
    if (isEnablingPush) return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('Push notifications not supported on this browser', 'warning');
        return false;
    }

    isEnablingPush = true;
    const banner = document.getElementById('push-unlock-banner');
    const bannerBtn = banner ? (banner.querySelector('.turn-on-btn') || banner.querySelector('span.bg-white')) : null;
    const origBtnText = bannerBtn ? bannerBtn.textContent : '';
    if (bannerBtn) {
        bannerBtn.textContent = 'Enabling...';
        bannerBtn.classList.add('opacity-75', 'pointer-events-none');
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showToast('Push notification permission was denied in browser settings', 'warning');
            updatePushUI(false);
            return false;
        }

        const pubKey = await getVapidKey();
        if (!pubKey) {
            showToast('Unable to reach push server. Try again in a moment.', 'error');
            return false;
        }

        // 1. Ensure Service Worker is registered
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
            reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        await navigator.serviceWorker.ready;

        // 2. Fetch or create subscription with automatic retry/cleanup
        let sub = await reg.pushManager.getSubscription();
        const convertedVapidKey = urlBase64ToUint8Array(pubKey);

        if (!sub) {
            try {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            } catch (subscribeErr) {
                console.warn('[Push] Direct subscribe failed, attempting recovery:', subscribeErr.message);
                // Clear any stale or orphaned subscription state and retry once
                try {
                    const stale = await reg.pushManager.getSubscription();
                    if (stale) await stale.unsubscribe();
                } catch (_) { }

                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidKey
                });
            }
        }
        pushSubscription = sub;

        // 3. Register with server (with hostel permissions for targeted push)
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                subscription: sub.toJSON(),
                adminId: currentAdminProfile?.id || null,
                adminName: currentAdminProfile?.name || 'Admin',
                assigned_hostels: currentAdminProfile?.assigned_hostels || (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []),
                hostelId: currentAdminProfile?.assigned_hostel_id || null,
                is_owner: isPlatformOwner(currentAdminProfile),
                roles: currentAdminProfile?.roles || ['delivery_person']
            })
        });

        updatePushUI(true);
        if (banner) banner.classList.add('hidden');

        showToast('✅ Push Notifications Active! Alerts will wake your device even when closed.', 'success');

        // Trigger immediate confirmation alert
        fetch('/api/notifications/test', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                adminId: currentAdminProfile?.id || null,
                adminName: currentAdminProfile?.name || 'Admin'
            })
        }).catch(() => { });

        return true;
    } catch (e) {
        console.error('Error enabling push:', e);
        const errMsg = e.message || '';
        let userFriendlyMsg = 'Push setup error: ' + errMsg;

        const isBrave = (navigator.brave && typeof navigator.brave.isBrave === 'function');
        let braveDetected = false;
        if (isBrave) {
            try { braveDetected = await navigator.brave.isBrave(); } catch (_) { }
        }

        if (braveDetected) {
            userFriendlyMsg = 'Brave Browser blocked push. Enable "Use Google services for push messaging" in brave://settings/privacy, then reload.';
        } else if (errMsg.includes('push service error') || errMsg.includes('Registration failed')) {
            userFriendlyMsg = 'Push service unreachable. Campus Wi-Fi/firewall, VPN, or Incognito mode is blocking Google FCM. In-app chimes will still alert you!';
        }

        showToast(userFriendlyMsg, 'error');
        return false;
    } finally {
        isEnablingPush = false;
        if (bannerBtn) {
            bannerBtn.textContent = origBtnText;
            bannerBtn.classList.remove('opacity-75', 'pointer-events-none');
        }
    }
}

async function disablePushNotifications() {
    try {
        if (pushSubscription) {
            const endpoint = pushSubscription.endpoint;
            await pushSubscription.unsubscribe();
            pushSubscription = null;
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ endpoint })
            }).catch(() => { });
        }
        updatePushUI(false);
        showToast('Push notifications disabled for this device', 'info');
    } catch (e) {
        console.error('Disable push error:', e);
    }
}

function togglePushNotifications() {
    if (pushSubscription) {
        disablePushNotifications();
    } else {
        enablePushNotifications();
    }
}

function dismissPushBanner() {
    localStorage.setItem('lpuquick_push_dismissed', 'true');
    const banner = document.getElementById('push-unlock-banner');
    if (banner) banner.classList.add('hidden');
}

// ============================================================
// ORDER CLAIMING & DELIVERY TRANSFER HANDSHAKE LOGIC
// ============================================================

let currentPendingTransferOrder = null;
const inFlightOrderClaims = new Set();

async function claimOrder(orderId) {
    if (!orderId) return;
    if (inFlightOrderClaims.has(orderId)) return; // Prevent double-clicking / duplicate concurrent attempts from same UI
    inFlightOrderClaims.add(orderId);

    // Collect and disable any active claim buttons for this order
    const claimBtns = [];
    document.querySelectorAll(`button[onclick*="claimOrder('${orderId}')"]`).forEach(b => claimBtns.push(b));
    if (typeof currentDrawerOrderId !== 'undefined' && currentDrawerOrderId === orderId) {
        const drawerBtn = document.getElementById('btn-drawer-claim');
        if (drawerBtn) claimBtns.push(drawerBtn);
    }
    claimBtns.forEach(btn => {
        btn.disabled = true;
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Accepting...</span>';
    });

    try {
        const myId = currentAdminProfile?.id;
        const myName = currentAdminProfile?.name || 'Delivery Rider';
        const res = await fetchWithTimeout(`/api/orders/${orderId}/claim`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adminId: myId,
                adminName: myName
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(data.message || 'Delivery accepted successfully!', 'success');

            const returnedOrder = data.order || {};
            const assignedName = returnedOrder.delivery_assignment?.assigned_to_name || returnedOrder.rider_name || myName;
            const updatedDa = returnedOrder.delivery_assignment || {
                assigned_to: myId,
                assigned_to_name: assignedName,
                name: assignedName,
                is_claimed: true,
                claimed_at: new Date().toISOString()
            };
            if (!updatedDa.assigned_to && myId) updatedDa.assigned_to = myId;
            if (!updatedDa.assigned_to_name) updatedDa.assigned_to_name = assignedName;
            updatedDa.is_claimed = true;

            const idx = ordersCache.findIndex(o => o.id === orderId);
            const updatedOrder = {
                ...(idx >= 0 ? ordersCache[idx] : {}),
                ...returnedOrder,
                rider_name: assignedName,
                delivery_assignment: updatedDa
            };
            if (idx >= 0) {
                ordersCache[idx] = updatedOrder;
            } else {
                ordersCache.unshift(updatedOrder);
            }

            if (typeof getOrderSignature === 'function') {
                knownOrderMap.set(orderId, getOrderSignature(updatedOrder));
            }

            filterOrders();
            if (currentDrawerOrderId === orderId) {
                updateDrawerDispatchCard(updatedOrder);
                openOrderDrawer(orderId);
            }
        } else if (res.status === 409 || data.code === 'ALREADY_CLAIMED') {
            // First-Come-First-Served conflict: another courier accepted right before this request
            const winnerName = data.claimed_by || 'another delivery partner';
            showToast(`⚡ Order was just accepted by ${winnerName}. First to accept gets the order!`, 'warning');

            const idx = ordersCache.findIndex(o => o.id === orderId);
            if (idx >= 0) {
                const existingDa = ordersCache[idx].delivery_assignment || {};
                ordersCache[idx] = {
                    ...ordersCache[idx],
                    rider_name: winnerName,
                    delivery_assignment: {
                        ...existingDa,
                        assigned_to_name: winnerName,
                        name: winnerName,
                        is_claimed: true,
                        claimed_at: data.claimed_at || new Date().toISOString()
                    }
                };
                if (typeof getOrderSignature === 'function') {
                    knownOrderMap.set(orderId, getOrderSignature(ordersCache[idx]));
                }
                filterOrders();
                if (typeof currentDrawerOrderId !== 'undefined' && currentDrawerOrderId === orderId) {
                    updateDrawerDispatchCard(ordersCache[idx]);
                }
            } else {
                loadOrders();
            }
        } else {
            showToast(data.error || 'Failed to claim order. It may have already been accepted.', 'error');
            claimBtns.forEach(btn => {
                btn.disabled = false;
                if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
            });
            loadOrders();
        }
    } catch (err) {
        showToast('Error claiming order: ' + err.message, 'error');
        claimBtns.forEach(btn => {
            btn.disabled = false;
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
        });
    } finally {
        inFlightOrderClaims.delete(orderId);
    }
}

async function loadDeliveryStaffForTransfer(order = null) {
    const select = document.getElementById('transfer-target-admin');
    if (!select) return;
    select.innerHTML = '<option value="">Loading available staff...</option>';

    try {
        const res = await fetchWithTimeout('/api/orders/admin/delivery-staff', {
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (res.ok && data.staff) {
            const currentAssignedId = order?.delivery_assignment?.assigned_to || null;
            const currentAssignedName = (order?.delivery_assignment?.assigned_to_name || order?.rider_name || '').trim().toLowerCase();

            // Include all delivery staff so the logged-in admin can always see and select themselves.
            // Only the currently assigned runner for this specific order is marked disabled.
            const availableStaff = data.staff;
            if (availableStaff.length === 0) {
                select.innerHTML = '<option value="">No delivery staff found</option>';
                return;
            }

            let optionsHtml = '';
            let hasSelectableOnline = false;

            optionsHtml += availableStaff.map(s => {
                const isOffline = s.availability_status === 'Offline' || s.is_available === false;
                const isCurrentlyAssigned = Boolean(
                    (currentAssignedId && s.id === currentAssignedId) ||
                    (currentAssignedName && s.name && s.name.trim().toLowerCase() === currentAssignedName && currentAssignedName !== 'unassigned')
                );

                const isOwnerRole = s.is_owner || (Array.isArray(s.roles) && s.roles.includes('owner'));
                const isRiderRole = Array.isArray(s.roles) && s.roles.includes('delivery_person');
                const isStoreMgrRole = Array.isArray(s.roles) && s.roles.includes('store_manager');

                let roleBadge = ' [Delivery Partner]';
                if (isOwnerRole) {
                    roleBadge = ' [Owner & Delivery]';
                } else if (isStoreMgrRole && isRiderRole) {
                    roleBadge = ' [Store Mgr & Delivery Partner]';
                } else if (isStoreMgrRole) {
                    roleBadge = ' [Store Mgr]';
                }

                const isMe = (currentAdminProfile?.id && s.id === currentAdminProfile.id) ? ' (You)' : '';

                let statusBadge = '';
                let isDisabled = false;

                if (isCurrentlyAssigned) {
                    statusBadge = ' [Currently Assigned - Cannot transfer to current runner]';
                    isDisabled = true;
                } else if (isOffline) {
                    statusBadge = ' [OFFLINE - Cannot receive transfers]';
                    isDisabled = true;
                } else {
                    hasSelectableOnline = true;
                }

                const loadBadge = (isOffline || isCurrentlyAssigned) ? '' : (s.active_deliveries > 0 ? ` (${s.active_deliveries} active orders)` : ' (Available)');
                const disabledAttr = isDisabled ? ' disabled class="text-slate-400 bg-slate-100"' : '';

                return `<option value="${s.id}" data-name="${s.name}"${disabledAttr}>${s.name}${roleBadge}${isMe}${statusBadge}${loadBadge}</option>`;
            }).join('');

            if (!hasSelectableOnline) {
                optionsHtml = '<option value="" disabled selected>⚠️ All other delivery partners are currently OFFLINE</option>' + optionsHtml;
            }

            select.innerHTML = optionsHtml;

            // Auto-select the first non-disabled option
            const firstEnabled = select.querySelector('option:not([disabled])');
            if (firstEnabled) firstEnabled.selected = true;
        } else {
            select.innerHTML = '<option value="">Failed to load staff list</option>';
        }
    } catch (e) {
        select.innerHTML = `<option value="">Error: ${e.message}</option>`;
    }
}

function openTransferModal(orderId) {
    const order = ordersCache.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('transfer-order-id').value = orderId;
    document.getElementById('transfer-order-label').textContent = `#${(orderId || '').replace('order_', '').toUpperCase()}`;
    document.getElementById('transfer-order-room').textContent = order.delivery_address || 'Campus Hostel';

    const currRider = order.delivery_assignment?.assigned_to_name || order.rider_name || 'Unassigned';
    document.getElementById('transfer-order-curr-rider').textContent = currRider;

    const errorDiv = document.getElementById('transfer-form-error');
    if (errorDiv) errorDiv.classList.add('hidden');

    loadDeliveryStaffForTransfer(order);
    document.getElementById('modal-transfer-order').classList.remove('hidden');
}

function closeTransferModal() {
    document.getElementById('modal-transfer-order').classList.add('hidden');
}

function handleTransferReasonSelect(val) {
    const custom = document.getElementById('transfer-reason-custom');
    if (!custom) return;
    if (val === 'Other') {
        custom.classList.remove('hidden');
        custom.focus();
    } else {
        custom.classList.add('hidden');
    }
}

async function submitOrderTransfer(e) {
    e.preventDefault();
    const orderId = document.getElementById('transfer-order-id').value;
    const targetSelect = document.getElementById('transfer-target-admin');
    const toAdminId = targetSelect.value;
    const toAdminName = targetSelect.options[targetSelect.selectedIndex]?.dataset.name || 'Delivery Admin';

    if (!toAdminId) {
        alert('Please select a recipient admin for the transfer');
        return;
    }

    const reasonSelect = document.getElementById('transfer-reason-select').value;
    const customInput = document.getElementById('transfer-reason-custom').value;
    const reason = (reasonSelect === 'Other' && customInput) ? customInput : reasonSelect;

    const submitBtn = document.getElementById('btn-submit-transfer');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';
    }

    try {
        const res = await fetchWithTimeout(`/api/orders/${orderId}/transfer/request`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ toAdminId, toAdminName, reason })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            const isMe = toAdminId === currentAdminProfile?.id;
            const successMsg = isMe ? 'Order successfully assigned to you!' : (data.message || `Transfer request sent to ${toAdminName}!`);
            showToast(successMsg, 'success');
            closeTransferModal();
            const idx = ordersCache.findIndex(o => o.id === orderId);
            if (idx >= 0 && data.order) {
                ordersCache[idx] = { ...ordersCache[idx], ...data.order };
            }
            filterOrders();
        } else {
            const errBox = document.getElementById('transfer-form-error');
            if (errBox) {
                errBox.textContent = data.error || 'Failed to initiate transfer';
                errBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        alert('Transfer request failed: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Send Transfer Request</span><span class="material-symbols-outlined text-sm">send</span>';
        }
    }
}

async function respondToTransfer(orderId, accept) {
    if (!orderId) return;
    try {
        const res = await fetchWithTimeout(`/api/orders/${orderId}/transfer/respond`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ accept })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(data.message, accept ? 'success' : 'info');
            const banner = document.getElementById('incoming-transfer-banner');
            if (banner && currentPendingTransferOrder?.orderId === orderId) {
                banner.classList.add('hidden');
                currentPendingTransferOrder = null;
            }
            loadOrders();
        } else {
            showToast(data.error || 'Failed to respond to transfer', 'error');
        }
    } catch (err) {
        showToast('Error responding to transfer: ' + err.message, 'error');
    }
}

function handleBannerTransferResponse(accept) {
    if (currentPendingTransferOrder && currentPendingTransferOrder.orderId) {
        respondToTransfer(currentPendingTransferOrder.orderId, accept);
    }
}

function showIncomingTransferAlert(transferData) {
    currentPendingTransferOrder = transferData;
    const banner = document.getElementById('incoming-transfer-banner');
    const txt = document.getElementById('incoming-transfer-text');
    if (banner && txt) {
        const shortId = (transferData.orderId || '').replace('order_', '').slice(0, 8).toUpperCase();
        txt.innerHTML = `🛵 <strong>${transferData.fromName}</strong> requested to transfer Order <span class="font-mono underline">#${shortId}</span> to you! (${transferData.reason || 'Assistance requested'})`;
        banner.classList.remove('hidden');
        try { playCampusChime(); } catch (e) { }
    }
}

// ==========================================
// ORDER EDITING & UNAVAILABLE ITEMS
// ==========================================
let currentEditOrderData = null;
let currentEditOrderItems = [];

async function openEditOrderModal(orderId) {
    if (!orderId) {
        showToast('No active order selected to edit.', 'warning');
        return;
    }

    let order = ordersCache.find(o => o.id === orderId);
    if (!order || !order.items || order.items.length === 0) {
        try {
            const res = await fetchWithTimeout(`/api/orders/admin/detail/${orderId}`, { headers: getAuthHeaders() }, 6000);
            if (res.ok) {
                const d = await res.json();
                if (d.order) order = d.order;
            }
        } catch (e) { }
    }

    if (!order) {
        showToast('Unable to fetch order details for editing.', 'error');
        return;
    }

    if (['Delivered', 'Cancelled'].includes(order.status)) {
        alert(`Cannot edit an order that is already ${order.status}.`);
        return;
    }

    currentEditOrderData = order;
    currentEditOrderItems = (order.items || []).map(it => ({
        id: it.id,
        product_id: it.product_id,
        name: it.name || it.products?.name || 'Campus Item',
        image_url: it.image_url || it.products?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
        unit_price: Number(it.unit_price || it.price || it.products?.price) || 0,
        original_qty: Number(it.quantity) || 1,
        quantity: Number(it.quantity) || 1
    }));

    // Reset modal fields
    document.getElementById('edit-order-id').value = order.id;
    const subTitle = document.getElementById('modal-edit-order-subtitle');
    if (subTitle) {
        subTitle.textContent = `Order #${order.id.replace('order_', '').toUpperCase()} · ${order.customer_name || 'Student'} (${order.delivery_address || 'Room'})`;
    }

    const errBox = document.getElementById('edit-order-error');
    if (errBox) errBox.classList.add('hidden');

    const notesInput = document.getElementById('edit-order-notes');
    if (notesInput) notesInput.value = '';

    const reasonSelect = document.getElementById('edit-order-reason');
    if (reasonSelect) reasonSelect.selectedIndex = 0;

    const restockCheck = document.getElementById('edit-restock-checkbox');
    if (restockCheck) restockCheck.checked = true;

    renderEditOrderItems();
    calculateEditOrderPreview();

    document.getElementById('modal-edit-order').classList.remove('hidden');
}

function closeEditOrderModal() {
    document.getElementById('modal-edit-order').classList.add('hidden');
    currentEditOrderData = null;
    currentEditOrderItems = [];
}

function renderEditOrderItems() {
    const container = document.getElementById('edit-order-items-container');
    if (!container) return;

    if (currentEditOrderItems.length === 0) {
        container.innerHTML = '<p class="text-[#5c5f60] p-4 text-center">No items recorded in this order.</p>';
        return;
    }

    container.innerHTML = currentEditOrderItems.map(item => {
        const isRemoved = item.quantity === 0;
        const rowClass = isRemoved
            ? 'bg-rose-50/70 border-rose-200 opacity-75'
            : 'bg-[#f7fafd] border-[#DADCE0]';

        return `
            <div class="flex items-center justify-between p-2.5 rounded-xl border ${rowClass} transition-all">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <img src="${item.image_url}" class="w-9 h-9 rounded-lg object-cover bg-white shrink-0 border border-[#DADCE0]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                    <div class="min-w-0">
                        <p class="font-bold text-xs text-[#181c1f] truncate ${isRemoved ? 'line-through text-[#74777a]' : ''}">${escapeHtml(item.name)}</p>
                        <p class="text-[10px] text-[#5c5f60]">₹${item.unit_price} each · Orig: ${item.original_qty}x</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                    ${isRemoved ? `
                        <span class="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Unavailable</span>
                        <button type="button" onclick="restoreEditItem('${item.id || item.product_id}', ${item.original_qty})"
                            class="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-[#DADCE0] text-[10px] font-bold text-[#1a73e8] transition-colors shadow-xs">
                            Restore
                        </button>
                    ` : `
                        <div class="inline-flex items-center gap-1 bg-white border border-[#DADCE0] rounded-lg p-0.5 shadow-xs">
                            <button type="button" onclick="changeEditItemQty('${item.id || item.product_id}', -1)"
                                class="w-6 h-6 rounded bg-[#f1f4f7] hover:bg-slate-200 text-xs font-black flex items-center justify-center text-[#181c1f]">-</button>
                            <span class="px-2 font-mono font-bold text-xs text-[#181c1f]">${item.quantity}</span>
                            <button type="button" onclick="changeEditItemQty('${item.id || item.product_id}', 1)"
                                class="w-6 h-6 rounded bg-[#f1f4f7] hover:bg-slate-200 text-xs font-black flex items-center justify-center text-[#181c1f]">+</button>
                        </div>
                        <button type="button" onclick="markEditItemUnavailable('${item.id || item.product_id}')"
                            class="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors" title="Mark this item as unavailable / remove">
                            <span class="material-symbols-outlined text-[18px]">delete_outline</span>
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function changeEditItemQty(id, delta) {
    const it = currentEditOrderItems.find(x => (x.id === id || x.product_id === id));
    if (!it) return;
    const next = Math.max(0, it.quantity + delta);
    it.quantity = next;
    renderEditOrderItems();
    calculateEditOrderPreview();
}

function markEditItemUnavailable(id) {
    const it = currentEditOrderItems.find(x => (x.id === id || x.product_id === id));
    if (!it) return;
    it.quantity = 0;
    renderEditOrderItems();
    calculateEditOrderPreview();
}

function restoreEditItem(id, origQty) {
    const it = currentEditOrderItems.find(x => (x.id === id || x.product_id === id));
    if (!it) return;
    it.quantity = origQty || 1;
    renderEditOrderItems();
    calculateEditOrderPreview();
}

function calculateEditOrderPreview() {
    const remaining = currentEditOrderItems.filter(x => x.quantity > 0);
    const newSubtotal = remaining.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
    const deliveryFee = Number(currentEditOrderData?.delivery_fee) || 0;
    const platformFee = Number(currentEditOrderData?.platform_fee) || 0;
    const tax = Number(currentEditOrderData?.tax) || 0;
    const newTotal = newSubtotal + deliveryFee + platformFee + tax;
    const prevTotal = Number(currentEditOrderData?.total) || 0;
    const diff = newTotal - prevTotal;

    const prevEl = document.getElementById('edit-prev-total');
    const newEl = document.getElementById('edit-new-total');
    const diffBadge = document.getElementById('edit-diff-badge');
    const countEl = document.getElementById('edit-items-count');

    if (prevEl) prevEl.textContent = '₹' + prevTotal;
    if (newEl) newEl.textContent = '₹' + newTotal;
    if (diffBadge) {
        if (diff < 0) {
            diffBadge.textContent = `-₹${Math.abs(diff)}`;
            diffBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
        } else if (diff > 0) {
            diffBadge.textContent = `+₹${diff}`;
            diffBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
        } else {
            diffBadge.textContent = 'No change';
            diffBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700';
        }
    }
    if (countEl) {
        countEl.textContent = `${remaining.reduce((a, b) => a + b.quantity, 0)} units`;
    }
}

async function submitOrderEdit(event) {
    if (event) event.preventDefault();
    if (!currentEditOrderData) return;

    const remaining = currentEditOrderItems.filter(x => x.quantity > 0);
    const errBox = document.getElementById('edit-order-error');

    if (remaining.length === 0) {
        if (errBox) {
            errBox.textContent = 'Cannot remove all items from this order. If all items are unavailable, please Cancel the order instead.';
            errBox.classList.remove('hidden');
        }
        return;
    }

    const hasChanges = currentEditOrderItems.some(it => it.quantity !== it.original_qty);
    if (!hasChanges) {
        if (errBox) {
            errBox.textContent = 'No changes were detected in the item quantities.';
            errBox.classList.remove('hidden');
        }
        return;
    }

    const reason = document.getElementById('edit-order-reason')?.value || 'Item Out of Stock at Dark Store';
    const notes = document.getElementById('edit-order-notes')?.value || '';
    const restockRemoved = document.getElementById('edit-restock-checkbox')?.checked !== false;

    const submitBtn = document.getElementById('btn-submit-order-edit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Saving & Recalculating...</span>';
    }

    try {
        const res = await fetchWithTimeout(`/api/orders/admin/${currentEditOrderData.id}/edit`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                items: currentEditOrderItems.map(it => ({
                    id: it.id,
                    product_id: it.product_id,
                    quantity: it.quantity,
                    unit_price: it.unit_price,
                    name: it.name
                })),
                reason,
                notes,
                restockRemoved
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Order #${currentEditOrderData.id.replace('order_', '').toUpperCase()} updated! New Total: ₹${data.order.total}`, 'success');

            // Update local cache
            const idx = ordersCache.findIndex(o => o.id === currentEditOrderData.id);
            if (idx >= 0 && data.order) {
                ordersCache[idx] = { ...ordersCache[idx], ...data.order };
            }

            closeEditOrderModal();

            // Refresh drawer if open
            if (currentDrawerOrderId === currentEditOrderData.id) {
                viewOrderDetails(currentDrawerOrderId);
            }

            filterOrders();
            loadInventory();
        } else {
            if (errBox) {
                errBox.textContent = data.error || 'Failed to update order';
                errBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        alert('Failed to edit order: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Save & Recalculate Order</span><span class="material-symbols-outlined text-sm">check</span>';
        }
    }
}

function updateDrawerDispatchCard(order) {
    if (!order) return;
    const da = order.delivery_assignment || {};
    const s = (order.status || '').toLowerCase();
    const isDelivered = s === 'delivered';
    const isCancelled = s === 'cancelled';
    const rawRider = typeof order.rider_name === 'string' && !order.rider_name.startsWith('{') ? order.rider_name.trim() : null;
    const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
    const isClaimed = Boolean(
        (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
        da.assigned_to ||
        hasExplicitRider
    );
    const myId = currentAdminProfile?.id;
    const myName = (currentAdminProfile?.name || '').trim().toLowerCase();
    const assignedRiderName = da.assigned_to_name || da.name || (hasExplicitRider ? rawRider : null) || 'Delivery Rider';
    const isAssignedToMe = (da.assigned_to && myId && da.assigned_to === myId) ||
        (myName && assignedRiderName && assignedRiderName.toLowerCase() === myName);
    const isOwnerOrStoreMgr = currentAdminProfile?.is_owner || (currentAdminProfile?.roles || []).includes('owner') || (currentAdminProfile?.roles || []).includes('store_manager');

    const badge = document.getElementById('drawer-dispatch-status-badge');
    const nameEl = document.getElementById('drawer-dispatch-runner-name');
    const timeEl = document.getElementById('drawer-dispatch-claimed-time');
    const btnClaim = document.getElementById('btn-drawer-claim');
    const btnTransfer = document.getElementById('btn-drawer-transfer');
    const transferBanner = document.getElementById('drawer-transfer-banner');
    const transferTxt = document.getElementById('drawer-transfer-text');
    const transferActions = document.getElementById('drawer-transfer-actions');

    if (btnClaim) btnClaim.classList.add('hidden');
    if (btnTransfer) btnTransfer.classList.add('hidden');
    if (transferBanner) transferBanner.classList.add('hidden');

    if (isDelivered) {
        if (badge) {
            badge.textContent = 'Delivered ✓';
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
        if (nameEl) {
            nameEl.textContent = (assignedRiderName && assignedRiderName !== 'Delivery Rider')
                ? `Delivered by: ${assignedRiderName}`
                : 'Order completed & delivered to customer';
        }
        if (timeEl) {
            timeEl.textContent = da.claimed_at ? `Accepted at ${new Date(da.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Delivery completed';
        }
        return;
    }

    if (isCancelled) {
        if (badge) {
            badge.textContent = 'Cancelled ✕';
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200';
        }
        if (nameEl) nameEl.textContent = 'Order was cancelled. No delivery required.';
        if (timeEl) timeEl.textContent = 'Cancelled';
        return;
    }

    // Active order dispatch states
    if (isClaimed) {
        const riderName = assignedRiderName;
        if (badge) {
            badge.textContent = isAssignedToMe ? '🛵 Assigned to You' : 'Assigned';
            badge.className = isAssignedToMe
                ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300'
                : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
        }
        if (nameEl) nameEl.textContent = isAssignedToMe ? `You are delivering this order (${riderName})` : `Assigned Rider: ${riderName}`;
        if (timeEl) timeEl.textContent = da.claimed_at ? `Claimed at: ${new Date(da.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Accepted';

        if (btnTransfer) btnTransfer.classList.toggle('hidden', !isAssignedToMe && !isOwnerOrStoreMgr);

        if (da.transfer && da.transfer.status === 'PENDING') {
            if (transferBanner) {
                transferBanner.classList.remove('hidden');
                const isOfferedToMe = da.transfer.to_id === myId;
                if (isOfferedToMe) {
                    transferTxt.textContent = `🛵 ${da.transfer.from_name} wants to transfer this order to you! Reason: ${da.transfer.reason}`;
                    if (transferActions) transferActions.classList.remove('hidden');
                } else {
                    transferTxt.textContent = `⏳ Transfer pending to ${da.transfer.to_name} (Reason: ${da.transfer.reason})`;
                    if (transferActions) transferActions.classList.add('hidden');
                }
            }
        }
    } else {
        // Unassigned active order
        if (badge) {
            badge.textContent = '⚡ Unassigned Pool';
            badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300';
        }
        const canAcceptDelivery = Boolean(currentAdminProfile && (
            currentAdminProfile.is_owner ||
            (Array.isArray(currentAdminProfile.roles) && (currentAdminProfile.roles.includes('delivery_person') || currentAdminProfile.roles.includes('owner')))
        ));
        if (nameEl) nameEl.textContent = canAcceptDelivery ? 'No delivery person assigned. You can accept this delivery.' : 'No delivery person assigned. Waiting for active courier.';
        if (timeEl) timeEl.textContent = 'Waiting for runner acceptance';
        if (btnClaim) {
            if (canAcceptDelivery) {
                btnClaim.classList.remove('hidden');
                btnClaim.innerHTML = '<span class="material-symbols-outlined text-sm">electric_bolt</span><span>Accept Delivery</span>';
            } else {
                btnClaim.classList.add('hidden');
            }
        }
    }
}

function getISTDateStr(dateInput) {
    try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
    } catch (e) {
        return '';
    }
}

let currentOrderFilter = 'all';
function setOrderStatusFilter(status) {
    currentOrderFilter = status;
    const filterSelect = document.getElementById('orders-quick-filter');
    if (filterSelect) {
        const optionExists = Array.from(filterSelect.options).some(opt => opt.value === status);
        if (optionExists) {
            filterSelect.value = status;
        } else {
            filterSelect.value = 'all';
        }
    }
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
        const active = btn.dataset.status === status;
        if (active) {
            btn.className = 'order-tab-btn px-4 py-1.5 rounded-full text-xs transition-all bg-[#3c4043] text-white font-semibold flex items-center gap-1.5';
        } else {
            btn.className = 'order-tab-btn px-4 py-1.5 rounded-full text-xs transition-all border border-[#DADCE0] text-[#5c5f60] hover:bg-[#f1f4f7] font-medium flex items-center gap-1.5';
        }
    });
    filterOrders();
}

function filterOrders() {
    const myId = currentAdminProfile?.id;
    const myName = (currentAdminProfile?.name || '').trim().toLowerCase();
    const isOwnerOrStoreMgr = currentAdminProfile?.is_owner || (currentAdminProfile?.roles || []).includes('owner') || (currentAdminProfile?.roles || []).includes('store_manager');

    // Update dispatch tab badges
    const unassignedCount = ordersCache.filter(o => {
        const isDone = ['Delivered', 'delivered', 'cancelled', 'Cancelled', 'canceled', 'Canceled'].includes(o.status);
        const da = o.delivery_assignment || {};
        const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
        const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
        const isClaimed = Boolean(
            (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
            da.assigned_to ||
            hasExplicitRider
        );
        return !isDone && !isClaimed;
    }).length;

    const myDeliveriesCount = ordersCache.filter(o => {
        const isDone = ['Delivered', 'delivered', 'cancelled', 'Cancelled', 'canceled', 'Canceled'].includes(o.status);
        const da = o.delivery_assignment || {};
        const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
        const assignedName = da.assigned_to_name || da.name || (rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider) ? rawRider : null) || '';
        const isAssignedToMe = (da.assigned_to && myId && da.assigned_to === myId) ||
            (myName && assignedName && assignedName.toLowerCase() === myName);
        return !isDone && isAssignedToMe;
    }).length;

    const transfersCount = ordersCache.filter(o => {
        const da = o.delivery_assignment;
        return da && da.transfer && da.transfer.status === 'PENDING' && (da.transfer.to_id === myId || isOwnerOrStoreMgr || da.transfer.from_id === myId);
    }).length;

    const deliveredCount = ordersCache.filter(o =>
        ['Delivered', 'delivered', 'completed', 'Completed'].includes(o.status)
    ).length;

    const cancelledCount = ordersCache.filter(o =>
        ['Cancelled', 'cancelled', 'canceled', 'Canceled', 'rejected', 'Rejected'].includes(o.status)
    ).length;

    const notAcceptedCount = ordersCache.filter(o => {
        const s = (o.status || '').toLowerCase().trim();
        const isDone = ['delivered', 'completed', 'cancelled', 'canceled', 'rejected'].includes(s);
        const da = o.delivery_assignment || {};
        const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
        const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
        const isClaimed = Boolean(
            (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
            da.assigned_to ||
            hasExplicitRider
        );
        const isUnassigned = !isClaimed;
        return !isDone && (isUnassigned || s === 'order placed' || s === 'pending');
    }).length;

    const todayIST = getISTDateStr(new Date());
    const todayCount = ordersCache.filter(o => {
        if (!o || !o.created_at) return false;
        const ordDate = getISTDateStr(o.created_at);
        return ordDate ? (ordDate === todayIST) : (new Date(o.created_at).toDateString() === new Date().toDateString());
    }).length;

    const upiCount = ordersCache.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return pm.includes('upi') && !pm.includes('both');
    }).length;

    const cashCount = ordersCache.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return (pm.includes('cash') || pm.includes('cod') || pm.includes('pay on delivery') || pm.includes('pod')) && !pm.includes('both');
    }).length;

    const bothCount = ordersCache.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return pm.includes('both');
    }).length;

    const badgeUnassigned = document.getElementById('badge-unassigned-count');
    if (badgeUnassigned) badgeUnassigned.textContent = unassignedCount;

    const badgeMyDeliveries = document.getElementById('badge-my-deliveries-count');
    if (badgeMyDeliveries) badgeMyDeliveries.textContent = myDeliveriesCount;

    const badgeTransfers = document.getElementById('badge-transfers-count');
    if (badgeTransfers) {
        badgeTransfers.textContent = transfersCount;
        badgeTransfers.classList.toggle('hidden', transfersCount === 0);
    }

    const badgeDelivered = document.getElementById('badge-delivered-count');
    if (badgeDelivered) badgeDelivered.textContent = deliveredCount;

    const badgeCancelled = document.getElementById('badge-cancelled-count');
    if (badgeCancelled) badgeCancelled.textContent = cancelledCount;

    const badgeNotAccepted = document.getElementById('badge-not-accepted-count');
    if (badgeNotAccepted) badgeNotAccepted.textContent = notAcceptedCount;

    const badgeToday = document.getElementById('badge-today-count');
    if (badgeToday) badgeToday.textContent = todayCount;

    const badgeUpi = document.getElementById('badge-upi-count');
    if (badgeUpi) badgeUpi.textContent = upiCount;

    const badgeCash = document.getElementById('badge-cash-count');
    if (badgeCash) badgeCash.textContent = cashCount;

    const badgeBoth = document.getElementById('badge-both-count');
    if (badgeBoth) badgeBoth.textContent = bothCount;

        const deliveryOrdersCount = ordersCache.filter(o => (o.order_mode || 'DELIVERY').toUpperCase() === 'DELIVERY').length;
    const takeawayOrdersCount = ordersCache.filter(o => (o.order_mode || '').toUpperCase() === 'TAKEAWAY').length;

    const badgeDelivery = document.getElementById('badge-delivery-orders-count');
    if (badgeDelivery) badgeDelivery.textContent = deliveryOrdersCount;

    const badgeTakeaway = document.getElementById('badge-takeaway-orders-count');
    if (badgeTakeaway) badgeTakeaway.textContent = takeawayOrdersCount;

    const foodOrdersCount = ordersCache.filter(o => isOrderFoodDept(o)).length;
    const badgeFood = document.getElementById('badge-food-orders-count');
    if (badgeFood) badgeFood.textContent = foodOrdersCount;

    const query = (document.getElementById('orders-search-input')?.value || '').toLowerCase();
    const ordHostel = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('orders') : null;
    let filtered = ordersCache.filter(o => {
        const matchId = (o.id || '').toLowerCase().includes(query);
        const matchCust = (o.customer_name || '').toLowerCase().includes(query);
        const matchAddr = (o.delivery_address || '').toLowerCase().includes(query);
        if (!matchId && !matchCust && !matchAddr) return false;
        if (ordHostel && ordHostel !== 'ALL') {
            return (o.hostel_id || 'BH-13').toLowerCase().replace('-', '') === ordHostel.toLowerCase().replace('-', '');
        }
        return true;
    });

    if (currentOrderFilter === 'unassigned') {
        filtered = filtered.filter(o => {
            const isDone = ['Delivered', 'delivered', 'cancelled', 'Cancelled', 'canceled', 'Canceled'].includes(o.status);
            const da = o.delivery_assignment || {};
            const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
            const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
            const isClaimed = Boolean(
                (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
                da.assigned_to ||
                hasExplicitRider
            );
            return !isDone && !isClaimed;
        });
    } else if (currentOrderFilter === 'my_deliveries') {
        filtered = filtered.filter(o => {
            const isDone = ['Delivered', 'delivered', 'cancelled', 'Cancelled', 'canceled', 'Canceled'].includes(o.status);
            const da = o.delivery_assignment || {};
            const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
            const assignedName = da.assigned_to_name || da.name || (rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider) ? rawRider : null) || '';
            const isAssignedToMe = (da.assigned_to && myId && da.assigned_to === myId) ||
                (myName && assignedName && assignedName.toLowerCase() === myName);
            return !isDone && isAssignedToMe;
        });
    } else if (currentOrderFilter === 'transfers') {
        filtered = filtered.filter(o => {
            const da = o.delivery_assignment;
            return da && da.transfer && da.transfer.status === 'PENDING';
        });
    } else if (currentOrderFilter === 'delivery_orders') {
        filtered = filtered.filter(o => (o.order_mode || 'DELIVERY').toUpperCase() === 'DELIVERY');
    } else if (currentOrderFilter === 'takeaway_orders') {
        filtered = filtered.filter(o => (o.order_mode || '').toUpperCase() === 'TAKEAWAY');
    } else if (currentOrderFilter === 'food_orders') {
        filtered = filtered.filter(o => isOrderFoodDept(o));
    } else if (currentOrderFilter === 'active') {
        filtered = filtered.filter(o => !['Delivered', 'delivered', 'completed', 'Completed', 'cancelled', 'Cancelled', 'canceled', 'Canceled', 'rejected', 'Rejected'].includes(o.status));
    } else if (currentOrderFilter === 'delivered') {
        filtered = filtered.filter(o => ['Delivered', 'delivered', 'completed', 'Completed'].includes(o.status));
    } else if (currentOrderFilter === 'cancelled') {
        filtered = filtered.filter(o => ['Cancelled', 'cancelled', 'canceled', 'Canceled', 'rejected', 'Rejected'].includes(o.status));
    } else if (currentOrderFilter === 'not_accepted') {
        filtered = filtered.filter(o => {
            const s = (o.status || '').toLowerCase().trim();
            const isDone = ['delivered', 'completed', 'cancelled', 'canceled', 'rejected'].includes(s);
            const da = o.delivery_assignment || {};
            const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
            const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
            const isClaimed = Boolean(
                (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
                da.assigned_to ||
                hasExplicitRider
            );
            const isUnassigned = !isClaimed;
            return !isDone && (isUnassigned || s === 'order placed' || s === 'pending');
        });
    } else if (currentOrderFilter === 'today') {
        const todayISTStr = getISTDateStr(new Date());
        filtered = filtered.filter(o => {
            if (!o || !o.created_at) return false;
            const ordDate = getISTDateStr(o.created_at);
            return ordDate ? (ordDate === todayISTStr) : (new Date(o.created_at).toDateString() === new Date().toDateString());
        });
    } else if (currentOrderFilter === 'upi') {
        filtered = filtered.filter(o => {
            const pm = (o.payment_method || '').toLowerCase();
            return pm.includes('upi') && !pm.includes('both');
        });
    } else if (currentOrderFilter === 'cash') {
        filtered = filtered.filter(o => {
            const pm = (o.payment_method || '').toLowerCase();
            return (pm.includes('cash') || pm.includes('cod') || pm.includes('pay on delivery') || pm.includes('pod')) && !pm.includes('both');
        });
    } else if (currentOrderFilter === 'both') {
        filtered = filtered.filter(o => {
            const pm = (o.payment_method || '').toLowerCase();
            return pm.includes('both');
        });
    } else if (currentOrderFilter === 'high_to_low') {
        filtered.sort((a, b) => (parseFloat(b.total) || 0) - (parseFloat(a.total) || 0));
    }

    const tbody = document.getElementById('orders-table-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-[#5c5f60]">No orders found matching filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const isTakeawayOrder = (o.order_mode || '').toUpperCase() === 'TAKEAWAY';
        const orderModeBadgeHtml = isTakeawayOrder
            ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-wider">🛍️ Takeaway</span>'
            : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold uppercase tracking-wider">🛵 Delivery</span>';
        const contactHtml = o.customer_phone ? o.customer_phone : (o.customer_email || 'Not provided');
        const displayName = formatCustomerDisplayName(o);
        const da = o.delivery_assignment || {};
        const s = (o.status || '').toLowerCase();
        const isDelivered = s === 'delivered';
        const isCancelled = s === 'cancelled';
        const isDone = isDelivered || isCancelled;
        const rawRider = typeof o.rider_name === 'string' && !o.rider_name.startsWith('{') ? o.rider_name.trim() : null;
        const hasExplicitRider = rawRider && !['Alex', 'Campus Express', 'Unassigned', 'unassigned'].includes(rawRider);
        const assignedRiderName = da.assigned_to_name || da.name || (hasExplicitRider ? rawRider : null) || 'Rider';
        const isClaimed = Boolean(
            (da.is_claimed && (da.assigned_to || da.assigned_to_name || da.name)) ||
            da.assigned_to ||
            hasExplicitRider
        );
        const isUnassigned = !isClaimed;
        const isPendingTransfer = da.transfer && da.transfer.status === 'PENDING';
        const isOfferedToMe = isPendingTransfer && da.transfer.to_id === myId;
        const isAssignedToMe = (da.assigned_to && myId && da.assigned_to === myId) ||
            (myName && assignedRiderName && assignedRiderName.toLowerCase() === myName);

        // Delivery Dispatch badge column
        let dispatchBadgeHtml = '';
        if (isDelivered) {
            const label = (assignedRiderName && assignedRiderName !== 'Rider' && assignedRiderName !== 'Alex' && assignedRiderName !== 'Unassigned' && assignedRiderName !== 'Campus Express') ? `✓ ${assignedRiderName}` : '✓ Delivered';
            dispatchBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">${label}</span>`;
        } else if (isCancelled) {
            dispatchBadgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">✕ Closed</span>';
        } else if (isUnassigned) {
            dispatchBadgeHtml = '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">⚡ Unassigned</span>';
        } else if (isOfferedToMe) {
            dispatchBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 animate-pulse" title="From ${da.transfer.from_name}">🔄 Offered to You</span>`;
        } else if (isPendingTransfer) {
            dispatchBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">⏳ Transfer Pending (${da.transfer.to_name})</span>`;
        } else if (isAssignedToMe) {
            dispatchBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#1a73e8] border border-blue-300">🛵 You (${assignedRiderName !== 'Rider' ? assignedRiderName : 'Assigned'})</span>`;
        } else {
            dispatchBadgeHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">👤 ${assignedRiderName}</span>`;
        }

        // Action / Dispatch buttons column
        const canAcceptDelivery = Boolean(currentAdminProfile && (
            currentAdminProfile.is_owner ||
            (Array.isArray(currentAdminProfile.roles) && (currentAdminProfile.roles.includes('delivery_person') || currentAdminProfile.roles.includes('owner')))
        ));
        const isOwner = isPlatformOwner();
        const ownerDeleteBtnHtml = isOwner ? `
            <button onclick="event.stopPropagation(); deleteOrderPermanently('${o.id}')" 
                class="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-all ml-1 cursor-pointer shrink-0" 
                title="Delete Order Permanently (Owner Only)">
                <span class="material-symbols-outlined text-base">delete</span>
            </button>
        ` : '';
        let actionButtonsHtml = '';
        if (!isDone && isUnassigned) {
            actionButtonsHtml = `
                <div class="flex items-center gap-1.5 justify-end ml-auto">
                    ${canAcceptDelivery ? `
                    <button onclick="event.stopPropagation(); claimOrder('${o.id}')" 
                        class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">electric_bolt</span>
                        <span>Accept Delivery</span>
                    </button>
                    ` : `
                    <span class="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200">
                        Awaiting Courier
                    </span>
                    `}
                    ${ownerDeleteBtnHtml}
                </div>
            `;
        } else if (!isDone && isOfferedToMe) {
            actionButtonsHtml = `
                <div class="flex items-center gap-1.5 justify-end">
                    <button onclick="event.stopPropagation(); respondToTransfer('${o.id}', true)" 
                        class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs">
                        Accept
                    </button>
                    <button onclick="event.stopPropagation(); respondToTransfer('${o.id}', false)" 
                        class="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-semibold text-[11px] rounded-lg">
                        Decline
                    </button>
                    ${ownerDeleteBtnHtml}
                </div>
            `;
        } else if (!isDone && (isAssignedToMe || isOwnerOrStoreMgr)) {
            actionButtonsHtml = `
                <div class="flex items-center gap-1.5 justify-end">
                    <button onclick="event.stopPropagation(); openTransferModal('${o.id}')" 
                        class="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] flex items-center gap-1 shadow-xs transition-all"
                        title="Transfer this order to another delivery person">
                        <span>Transfer</span>
                        <span class="material-symbols-outlined text-sm">swap_horiz</span>
                    </button>
                    <button onclick="event.stopPropagation(); openOrderDrawer('${o.id}')" 
                        class="text-xs font-semibold text-[#3c4043] bg-[#ebeef2] hover:bg-[#e0e3e6] px-2.5 py-1 rounded-lg">
                        Manage
                    </button>
                    ${ownerDeleteBtnHtml}
                </div>
            `;
        } else {
            actionButtonsHtml = `
                <div class="flex items-center gap-1.5 justify-end">
                    <button onclick="event.stopPropagation(); openOrderDrawer('${o.id}')" 
                        class="text-xs font-semibold text-[#3c4043] bg-[#ebeef2] hover:bg-[#e0e3e6] px-3 py-1 rounded-full">
                        Manage
                    </button>
                    ${ownerDeleteBtnHtml}
                </div>
            `;
        }

        const isFoodOrder = isOrderFoodDept(o);
        const rowClass = isFoodOrder
            ? "bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-amber-50/30 hover:from-amber-100 hover:to-orange-100/90 border-l-4 border-l-amber-500 border-b border-amber-200 transition-colors cursor-pointer shadow-xs"
            : "hover:bg-[#f7fafd] transition-colors cursor-pointer";

        return `
        <tr class="${rowClass}" onclick="openOrderDrawer('${o.id}')" id="order-row-${o.id}">
            <td class="p-4 font-bold font-mono text-[#181c1f]">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span>#${(o.id || '').replace('order_', '').toUpperCase()}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0066cc] border border-blue-200">${escapeHtml(o.hostel_id || 'BH-13')}</span>
                    ${isFoodOrder ? `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                        <span class="material-symbols-outlined text-[10px]">restaurant</span>
                        <span>Quick's Instant Food (11m)</span>
                    </span>
                    ` : ''}
                </div>
                ${isFoodOrder && o.cook_name ? `
                <div class="mt-1 text-[10px] text-amber-900 font-bold flex items-center gap-1">
                    <span>👨‍🍳 Chef:</span> <span>${escapeHtml(o.cook_name)}</span>
                </div>
                ` : ''}
            </td>
            <td class="p-4">
                <p class="font-semibold text-[#181c1f]">${escapeHtml(displayName)}</p>
                <p class="text-[11px] text-[#5c5f60]">${escapeHtml(contactHtml)}</p>
            </td>
            <td class="p-4 text-[#5c5f60]">${escapeHtml(o.delivery_address || 'Not provided')}</td>
            <td class="p-4 font-bold text-[#137333]">₹${o.total}</td>
            <td class="p-4 text-[#5c5f60]">${formatAdminPaymentDisplay(o.payment_method, o.status)}</td>
            <td class="p-4" id="order-status-pill-${o.id}">${getStatusPill(o.status, isFoodOrder)}</td>
            <td class="p-4">${dispatchBadgeHtml}</td>
            <td class="p-4 text-right">${actionButtonsHtml}</td>
        </tr>
    `}).join('');
}

function getStatusPill(status, isFood = false) {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Delivered ✓</span>';
    if (s === 'cancelled' || s === 'rejected') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fce8e6] text-[#c5221f] border border-[#f5c6cb]">Cancelled ✕</span>';
    if (s === 'ready' || s === 'ready in kitchen') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">🍲 Ready in Kitchen</span>';
    if (s === 'out for delivery') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">En Route 🚶‍♂️</span>';
    if (s === 'preparing' || s === 'cooking') return isFood ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">🍳 Cooking / Prep (11m)</span>' : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Preparing 📦</span>';
    if (s === 'order confirmed') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Confirmed 👍</span>';
    return isFood ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">⚡ Food Placed (11m)</span>' : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] animate-pulse">Order Placed ⚡</span>';
}

// ================= 5. ORDER DETAILS DRAWER =================
let currentDrawerOrderUserId = null;

function viewCurrentDrawerCustomerHistory() {
    if (currentDrawerOrderUserId) {
        viewCustomerDetails(currentDrawerOrderUserId);
    } else {
        const cached = ordersCache.find(o => o.id === currentDrawerOrderId);
        const fallbackTarget = cached?.customer_email || cached?.customer_phone || cached?.user_id || null;
        if (fallbackTarget) {
            viewCustomerDetails(fallbackTarget);
        } else {
            showToast('No customer profile identifier found for this order', 'info');
        }
    }
}

async function openOrderDrawer(orderId) {
    currentDrawerOrderId = orderId;
    currentDrawerOrderUserId = null;
    document.getElementById('order-drawer').classList.remove('hidden');

    // Owner-only delete button in drawer
    const drawerDeleteBtn = document.getElementById('btn-drawer-delete-order');
    if (drawerDeleteBtn) {
        drawerDeleteBtn.classList.toggle('hidden', !isPlatformOwner());
    }

    // Make customer name clickable
    const custNameEl = document.getElementById('drawer-cust-name');
    if (custNameEl) {
        custNameEl.onclick = viewCurrentDrawerCustomerHistory;
        custNameEl.classList.add('cursor-pointer', 'hover:underline');
        custNameEl.title = 'Click to view complete order history & profile';
    }

    // 1. Instant 0ms memory render from local cache if present
    const cachedOrder = ordersCache.find(o => o.id === orderId);
    if (cachedOrder) {
        currentDrawerOrderUserId = cachedOrder.user_id || null;
        document.getElementById('drawer-order-id').textContent = `Order #${(cachedOrder.id || '').replace('order_', '').toUpperCase()}`;
        document.getElementById('drawer-order-time').textContent = `Placed: ${new Date(cachedOrder.created_at || Date.now()).toLocaleString()}`;
        document.getElementById('drawer-cust-name').textContent = formatCustomerDisplayName(cachedOrder);
        document.getElementById('drawer-cust-phone').textContent = cachedOrder.customer_phone && cachedOrder.customer_phone.trim() ? cachedOrder.customer_phone : 'Not provided';
        if (document.getElementById('drawer-cust-email')) {
            document.getElementById('drawer-cust-email').textContent = cachedOrder.customer_email && cachedOrder.customer_email.trim() ? cachedOrder.customer_email : 'Not provided';
        }
        document.getElementById('drawer-cust-address').textContent = cachedOrder.delivery_address && cachedOrder.delivery_address.trim() ? cachedOrder.delivery_address : 'Not provided';
        document.getElementById('drawer-payment-method').textContent = formatAdminPaymentDisplay(cachedOrder.payment_method, cachedOrder.status);
        document.getElementById('drawer-order-total').textContent = `₹${cachedOrder.total || 0}`;
        document.getElementById('drawer-status-select').value = cachedOrder.status;

        updateDrawerDispatchCard(cachedOrder);
        initDrawerPaymentMode(cachedOrder);

        const itemsList = document.getElementById('drawer-items-list');
        if (cachedOrder.items && cachedOrder.items.length > 0) {
            itemsList.innerHTML = cachedOrder.items.map(item => `
                <div class="flex justify-between items-center p-2 rounded-lg border border-[#DADCE0] bg-[#f7fafd]">
                    <div class="flex items-center gap-2">
                        <img src="${item.image_url || item.products?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'}" class="w-8 h-8 rounded object-cover bg-white shrink-0" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${item.name || item.products?.name || 'Item'}</p>
                            <p class="text-[10px] text-[#5c5f60]">Qty: ${item.quantity} × ₹${item.unit_price || item.price || 0}</p>
                        </div>
                    </div>
                    <span class="font-bold text-xs text-[#137333]">₹${(item.quantity || 1) * (item.unit_price || item.price || 0)}</span>
                </div>
            `).join('');
        } else {
            itemsList.innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Loading items breakdown...</p>';
        }
    } else {
        document.getElementById('drawer-order-id').textContent = `Order #${(orderId || '').replace('order_', '').toUpperCase()}`;
        document.getElementById('drawer-order-time').textContent = 'Fetching order details...';
        document.getElementById('drawer-cust-name').textContent = 'Loading...';
        document.getElementById('drawer-cust-phone').textContent = '--';
        if (document.getElementById('drawer-cust-email')) {
            document.getElementById('drawer-cust-email').textContent = '--';
        }
        document.getElementById('drawer-cust-address').textContent = '--';
        document.getElementById('drawer-payment-method').textContent = '--';
        document.getElementById('drawer-order-total').textContent = '--';
        document.getElementById('drawer-items-list').innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Loading items breakdown...</p>';
        updateDrawerDispatchCard({ id: orderId, status: 'Loading...', delivery_assignment: null });
        initDrawerPaymentMode(null);
    }

    try {
        const res = await fetchWithTimeout(`/api/orders/admin/detail/${orderId}`, { headers: getAuthHeaders() }, 6000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const o = data.order;
        if (!o || currentDrawerOrderId !== orderId) return;

        const idx = ordersCache.findIndex(x => x.id === orderId);
        if (idx >= 0) {
            ordersCache[idx] = { ...ordersCache[idx], ...o };
        }

        currentDrawerOrderUserId = o.user_id || cachedOrder?.user_id || null;
        document.getElementById('drawer-order-id').textContent = `Order #${(o.id || '').replace('order_', '').toUpperCase()}`;
        document.getElementById('drawer-order-time').textContent = `Placed: ${new Date(o.created_at || Date.now()).toLocaleString()}`;
        document.getElementById('drawer-cust-name').textContent = formatCustomerDisplayName(o);
        document.getElementById('drawer-cust-phone').textContent = o.customer_phone && o.customer_phone.trim() ? o.customer_phone : 'Not provided';
        if (document.getElementById('drawer-cust-email')) {
            document.getElementById('drawer-cust-email').textContent = o.customer_email && o.customer_email.trim() ? o.customer_email : 'Not provided';
        }
        document.getElementById('drawer-cust-address').textContent = o.delivery_address && o.delivery_address.trim() ? o.delivery_address : 'Not provided';
        document.getElementById('drawer-payment-method').textContent = formatAdminPaymentDisplay(o.payment_method, o.status);
        document.getElementById('drawer-order-total').textContent = `₹${o.total}`;
        document.getElementById('drawer-status-select').value = o.status;

        updateDrawerDispatchCard(o);
        initDrawerPaymentMode(o);

        // Update Order Modified Banner if modified by store
        const modBanner = document.getElementById('drawer-order-modified-banner');
        const modReason = document.getElementById('drawer-order-modified-reason');
        const modTime = document.getElementById('drawer-order-modified-time');
        const edit = o.delivery_assignment?.latest_edit;
        if (modBanner && edit) {
            modBanner.classList.remove('hidden');
            if (modReason) {
                modReason.innerHTML = `<strong>${escapeHtml(edit.reason)}:</strong> ${escapeHtml(edit.notes || 'Items adjusted')} (Prev: ₹${edit.old_total} → Now: ₹${edit.new_total})`;
            }
            if (modTime) {
                modTime.textContent = new Date(edit.edited_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } else if (modBanner) {
            modBanner.classList.add('hidden');
        }

        // Toggle Edit Order button visibility (hide if Delivered or Cancelled)
        const btnEditOrder = document.getElementById('btn-drawer-edit-order');
        if (btnEditOrder) {
            if (['Delivered', 'Cancelled'].includes(o.status)) {
                btnEditOrder.classList.add('hidden');
            } else {
                btnEditOrder.classList.remove('hidden');
            }
        }

        const itemsList = document.getElementById('drawer-items-list');
        const items = o.items || [];
        if (items.length === 0) {
            itemsList.innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Campus order items recorded</p>';
        } else {
            itemsList.innerHTML = items.map(item => `
                <div class="flex justify-between items-center p-2 rounded-lg border border-[#DADCE0] bg-[#f7fafd]">
                    <div class="flex items-center gap-2">
                        <img src="${item.image_url || item.products?.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'}" class="w-8 h-8 rounded object-cover bg-white shrink-0" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${item.name || item.products?.name || 'Item'}</p>
                            <p class="text-[10px] text-[#5c5f60]">Qty: ${item.quantity} × ₹${item.unit_price || item.price || 0}</p>
                        </div>
                    </div>
                    <span class="font-bold text-xs text-[#137333]">₹${(item.quantity || 1) * (item.unit_price || item.price || 0)}</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.warn('Order detail fetch deferred:', err.message);
        const itemsList = document.getElementById('drawer-items-list');
        if (itemsList && itemsList.innerHTML.includes('Loading items')) {
            itemsList.innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Order items saved in record.</p>';
        }
    }
}

function closeOrderDrawer() {
    currentDrawerOrderId = null;
    const drawer = document.getElementById('order-drawer');
    if (drawer) drawer.classList.add('hidden');
}

// ==========================================
// OWNER-ONLY ORDER PERMANENT DELETION
// ==========================================
async function deleteOrderPermanently(orderId) {
    if (!orderId) {
        orderId = currentDrawerOrderId;
    }
    if (!orderId) return;

    if (!isPlatformOwner()) {
        showToast('Access Denied: Only the platform owner can delete orders.', 'error');
        return;
    }

    const shortId = String(orderId).replace('order_', '').slice(0, 8).toUpperCase();
    const confirmed = window.confirm(`⚠️ PERMANENT DELETE ORDER #${shortId}?\n\nAre you sure you want to permanently delete this order and all its items from the database?\nThis action CANNOT be undone.`);
    if (!confirmed) return;

    try {
        showToast(`Deleting order #${shortId}...`, 'info');
        const res = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        showToast(`Order #${shortId} was permanently deleted.`, 'success');

        // Remove from local memory cache
        ordersCache = ordersCache.filter(o => o.id !== orderId);

        // Remove from DOM if exists
        const row = document.getElementById(`order-row-${orderId}`);
        if (row) {
            row.remove();
        }

        // Close drawer if it's open for this order
        if (currentDrawerOrderId === orderId) {
            closeOrderDrawer();
        }

        // Re-filter orders and update KPIs
        if (typeof filterOrders === 'function') filterOrders();
        if (typeof updateKpiCountersFromCache === 'function') updateKpiCountersFromCache();
        if (typeof loadDashboard === 'function') loadDashboard();
    } catch (err) {
        console.error('[Delete Order Error]:', err);
        showToast(err.message || 'Failed to delete order', 'error');
    }
}
window.deleteOrderPermanently = deleteOrderPermanently;

// ==========================================
// PAYMENT COLLECTION MODE HANDLERS (Cash, UPI, Both)
// ==========================================
let currentDrawerPaymentMode = null;

function selectDrawerPaymentMode(mode, isInit = false) {
    currentDrawerPaymentMode = mode;
    const btnCash = document.getElementById('drawer-pay-btn-cash');
    const btnUpi = document.getElementById('drawer-pay-btn-upi');
    const btnBoth = document.getElementById('drawer-pay-btn-both');
    const badge = document.getElementById('drawer-payment-badge');
    const splitWrap = document.getElementById('drawer-split-container');
    const alertBox = document.getElementById('drawer-payment-validation-alert');
    const statusBox = document.getElementById('drawer-status-action-box');

    if (alertBox) alertBox.classList.add('hidden');
    if (statusBox) statusBox.classList.remove('ring-2', 'ring-rose-500');

    // Default base classes
    const defaultBtnClass = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-slate-300 bg-white hover:border-slate-400 text-slate-700 transition-all active:scale-95 shadow-2xs cursor-pointer';

    if (btnCash) btnCash.className = defaultBtnClass;
    if (btnUpi) btnUpi.className = defaultBtnClass;
    if (btnBoth) btnBoth.className = defaultBtnClass;

    const targetOrder = ordersCache.find(x => x.id === currentDrawerOrderId);
    const orderTotal = targetOrder ? Number(targetOrder.total || 0) : 0;
    const drawerPayEl = document.getElementById('drawer-payment-method');

    if (mode === 'Cash') {
        if (btnCash) {
            btnCash.className = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/40 font-extrabold shadow-sm active:scale-95 cursor-pointer';
        }
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
            badge.textContent = `💵 Cash (₹${orderTotal})`;
        }
        if (splitWrap) splitWrap.classList.add('hidden');
        if (drawerPayEl) drawerPayEl.textContent = 'Cash';

        if (targetOrder) {
            targetOrder.payment_method = 'Cash';
            const rowPayCell = document.querySelector(`#order-row-${currentDrawerOrderId} td:nth-child(5)`);
            if (rowPayCell) rowPayCell.textContent = 'Cash';

            if (!isInit) {
                const s = (targetOrder.status || '').toLowerCase();
                if (s === 'delivered' || s === 'completed') {
                    targetOrder.payment_status = 'PAID';
                    fetchWithTimeout('/api/orders/admin/status', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            orderId: currentDrawerOrderId,
                            status: targetOrder.status,
                            paymentMethod: 'Cash',
                            paymentStatus: 'PAID'
                        })
                    }, 10000).catch(err => console.warn('[Auto-save cash mode error]:', err.message));
                }
                updateDailyRevenue();
                filterOrders();
            }
        }
    } else if (mode === 'UPI') {
        if (btnUpi) {
            btnUpi.className = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/40 font-extrabold shadow-sm active:scale-95 cursor-pointer';
        }
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800';
            badge.textContent = `📱 UPI (₹${orderTotal})`;
        }
        if (splitWrap) splitWrap.classList.add('hidden');
        if (drawerPayEl) drawerPayEl.textContent = 'UPI';

        if (targetOrder) {
            targetOrder.payment_method = 'UPI';
            const rowPayCell = document.querySelector(`#order-row-${currentDrawerOrderId} td:nth-child(5)`);
            if (rowPayCell) rowPayCell.textContent = 'UPI';

            if (!isInit) {
                const s = (targetOrder.status || '').toLowerCase();
                if (s === 'delivered' || s === 'completed') {
                    targetOrder.payment_status = 'PAID';
                    fetchWithTimeout('/api/orders/admin/status', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            orderId: currentDrawerOrderId,
                            status: targetOrder.status,
                            paymentMethod: 'UPI',
                            paymentStatus: 'PAID'
                        })
                    }, 10000).catch(err => console.warn('[Auto-save upi mode error]:', err.message));
                }
                updateDailyRevenue();
                filterOrders();
            }
        }
    } else if (mode === 'Both') {
        if (btnBoth) {
            btnBoth.className = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/40 font-extrabold shadow-sm active:scale-95 cursor-pointer';
        }
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800';
            badge.textContent = `🔄 Both (Split)`;
        }
        if (splitWrap) {
            splitWrap.classList.remove('hidden');
            const totalInfo = document.getElementById('drawer-split-total-info');
            if (totalInfo) totalInfo.textContent = `Total: ₹${orderTotal}`;

            const cashInput = document.getElementById('drawer-split-cash-input');
            const upiInput = document.getElementById('drawer-split-upi-input');

            let initialCash = Math.floor(orderTotal / 2);
            let initialUpi = orderTotal - initialCash;

            if (targetOrder?.payment_method && targetOrder.payment_method.includes('Cash:') && targetOrder.payment_method.includes('UPI:')) {
                const matchCash = targetOrder.payment_method.match(/Cash:\s*₹?(\d+(?:\.\d+)?)/i);
                const matchUpi = targetOrder.payment_method.match(/UPI:\s*₹?(\d+(?:\.\d+)?)/i);
                if (matchCash) initialCash = Number(matchCash[1]);
                if (matchUpi) initialUpi = Number(matchUpi[1]);
            }

            if (cashInput) cashInput.value = initialCash;
            if (upiInput) upiInput.value = initialUpi;
            updateDrawerSplitHint(initialCash, initialUpi, orderTotal);
        }
    } else {
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700';
            badge.textContent = 'Select Option';
        }
        if (splitWrap) splitWrap.classList.add('hidden');
    }
}

function handleDrawerSplitChange(changedSource) {
    const targetOrder = ordersCache.find(x => x.id === currentDrawerOrderId);
    const orderTotal = targetOrder ? Number(targetOrder.total || 0) : 0;
    const cashInput = document.getElementById('drawer-split-cash-input');
    const upiInput = document.getElementById('drawer-split-upi-input');

    let cash = parseFloat(cashInput?.value) || 0;
    let upi = parseFloat(upiInput?.value) || 0;

    if (changedSource === 'cash') {
        if (cash > orderTotal) cash = orderTotal;
        if (cash < 0) cash = 0;
        if (cashInput) cashInput.value = cash;
        upi = Math.max(0, orderTotal - cash);
        if (upiInput) upiInput.value = upi;
    } else if (changedSource === 'upi') {
        if (upi > orderTotal) upi = orderTotal;
        if (upi < 0) upi = 0;
        if (upiInput) upiInput.value = upi;
        cash = Math.max(0, orderTotal - upi);
        if (cashInput) cashInput.value = cash;
    }

    updateDrawerSplitHint(cash, upi, orderTotal);
}

function updateDrawerSplitHint(cash, upi, total) {
    const hint = document.getElementById('drawer-split-calc-hint');
    const badge = document.getElementById('drawer-payment-badge');
    const errorMsg = document.getElementById('drawer-split-error-msg');

    if (Math.abs((cash + upi) - total) > 0.01) {
        if (errorMsg) {
            errorMsg.textContent = `⚠️ Cash (₹${cash}) + UPI (₹${upi}) = ₹${cash + upi}, must equal Total ₹${total}`;
            errorMsg.classList.remove('hidden');
        }
    } else {
        if (errorMsg) errorMsg.classList.add('hidden');
        if (hint) hint.textContent = `✓ ₹${cash} Cash + ₹${upi} UPI = ₹${total} Total`;
        if (badge) badge.textContent = `🔄 ₹${cash} Cash + ₹${upi} UPI`;
    }
}

function handleDrawerStatusChange(val) {
    const alertBox = document.getElementById('drawer-payment-validation-alert');
    const statusBox = document.getElementById('drawer-status-action-box');
    if (alertBox) alertBox.classList.add('hidden');
    if (statusBox) statusBox.classList.remove('ring-2', 'ring-rose-500');

    if (val === 'Delivered') {
        if (!currentDrawerPaymentMode) {
            const badge = document.getElementById('drawer-payment-badge');
            if (badge) {
                badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 animate-pulse';
                badge.textContent = '* Please Select';
            }
        }
    }
}

function initDrawerPaymentMode(order) {
    currentDrawerPaymentMode = null;
    const alertBox = document.getElementById('drawer-payment-validation-alert');
    if (alertBox) alertBox.classList.add('hidden');
    const statusBox = document.getElementById('drawer-status-action-box');
    if (statusBox) statusBox.classList.remove('ring-2', 'ring-rose-500');

    const method = (order?.payment_method || '').toLowerCase();
    const isDelivered = ['delivered', 'completed'].includes((order?.status || '').toLowerCase());

    if (method.includes('both')) {
        selectDrawerPaymentMode('Both', true);
    } else if (method.includes('upi')) {
        selectDrawerPaymentMode('UPI', true);
    } else if (method.includes('cash') || method.includes('cod') || method.includes('pay on delivery') || method.includes('pod') || isDelivered) {
        selectDrawerPaymentMode('Cash', true);
        if (isDelivered) {
            const drawerPayEl = document.getElementById('drawer-payment-method');
            if (drawerPayEl) drawerPayEl.textContent = 'Cash';
        }
    } else {
        selectDrawerPaymentMode('Cash', true);
    }
}

async function applyDrawerStatusUpdate() {
    if (!currentDrawerOrderId) return;
    const newStatus = document.getElementById('drawer-status-select').value;
    const targetOrderId = currentDrawerOrderId;
    const o = ordersCache.find(x => x.id === targetOrderId);
    const orderTotal = o ? Number(o.total || 0) : 0;
    const previousStatus = o ? o.status : null;
    const previousPaymentMethod = o ? o.payment_method : null;
    const previousPaymentStatus = o ? o.payment_status : null;

    let finalPaymentMethod = formatAdminPaymentDisplay(o?.payment_method);
    let splitMeta = null;

    // Auto-resolve payment mode if marking as Delivered
    if (newStatus === 'Delivered') {
        if (!currentDrawerPaymentMode) {
            selectDrawerPaymentMode('Cash');
        }

        if (currentDrawerPaymentMode === 'Both') {
            let cashVal = parseFloat(document.getElementById('drawer-split-cash-input')?.value) || 0;
            let upiVal = parseFloat(document.getElementById('drawer-split-upi-input')?.value) || 0;
            if (Math.abs((cashVal + upiVal) - orderTotal) > 0.01) {
                if (cashVal === 0 && upiVal === 0 && orderTotal > 0) {
                    cashVal = Math.floor(orderTotal / 2);
                    upiVal = orderTotal - cashVal;
                } else {
                    const errorMsg = document.getElementById('drawer-split-error-msg');
                    if (errorMsg) {
                        errorMsg.textContent = `⚠️ Cash (₹${cashVal}) + UPI (₹${upiVal}) must equal total ₹${orderTotal}`;
                        errorMsg.classList.remove('hidden');
                    }
                    showToast(`⚠️ Cash (₹${cashVal}) + UPI (₹${upiVal}) must equal total ₹${orderTotal}`, 'error');
                    return;
                }
            }
            finalPaymentMethod = `Both (Cash: ₹${cashVal}, UPI: ₹${upiVal})`;
            splitMeta = { mode: 'Both', cash_amount: cashVal, upi_amount: upiVal, total: orderTotal };
        } else if (currentDrawerPaymentMode === 'UPI') {
            finalPaymentMethod = 'UPI';
            splitMeta = { mode: 'UPI', cash_amount: 0, upi_amount: orderTotal, total: orderTotal };
        } else {
            finalPaymentMethod = 'Cash';
            splitMeta = { mode: 'Cash', cash_amount: orderTotal, upi_amount: 0, total: orderTotal };
        }
    }

    // 1. Optimistic instant local update
    if (o) {
        o.status = newStatus;
        if (newStatus === 'Delivered') {
            o.payment_method = finalPaymentMethod;
            o.payment_status = 'PAID';
        }
        updateDrawerDispatchCard(o);
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(targetOrderId, getOrderSignature(o));
        }
    }

    // Update live pills in DOM
    const pill1 = document.getElementById(`order-status-pill-${targetOrderId}`);
    if (pill1) pill1.innerHTML = getStatusPill(newStatus);
    const pill2 = document.getElementById(`dash-status-pill-${targetOrderId}`);
    if (pill2) pill2.innerHTML = getStatusPill(newStatus);
    const drawerPayEl = document.getElementById('drawer-payment-method');
    if (drawerPayEl && newStatus === 'Delivered') {
        drawerPayEl.textContent = `${finalPaymentMethod} (Collected)`;
    }
    const rowPayCell = document.querySelector(`#order-row-${targetOrderId} td:nth-child(5)`);
    if (rowPayCell && newStatus === 'Delivered') {
        rowPayCell.textContent = finalPaymentMethod;
    }

    const shortId = targetOrderId.replace('order_', '').toUpperCase();
    const toastMsg = newStatus === 'Delivered'
        ? `✓ Order #${shortId} Delivered & Payment recorded via ${finalPaymentMethod}!`
        : `✓ Order #${shortId} status updated to: ${newStatus}`;
    showToast(toastMsg, 'success');

    updateDailyRevenue();

    if (activeView === 'orders') filterOrders();
    else if (activeView === 'dashboard') loadDashboard();

    closeOrderDrawer();

    registerRecentOrderStatusUpdate(targetOrderId, newStatus, newStatus === 'Delivered' ? finalPaymentMethod : undefined, newStatus === 'Delivered' ? 'PAID' : undefined);

    try {
        const res = await fetchWithTimeout('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                orderId: targetOrderId,
                status: newStatus,
                paymentMethod: newStatus === 'Delivered' ? finalPaymentMethod : undefined,
                paymentStatus: newStatus === 'Delivered' ? 'PAID' : undefined,
                paymentCollection: splitMeta
            })
        }, 15000);

        if (!res.ok) {
            recentOrderStatusUpdates.delete(targetOrderId);
            const errData = await res.json().catch(() => ({}));
            console.error('[Admin Status Update Error]:', res.status, errData);
            if (o && previousStatus) {
                o.status = previousStatus;
                o.payment_method = previousPaymentMethod;
                o.payment_status = previousPaymentStatus;
                updateDrawerDispatchCard(o);
                if (pill1) pill1.innerHTML = getStatusPill(previousStatus);
                if (pill2) pill2.innerHTML = getStatusPill(previousStatus);
                updateDailyRevenue();
                if (activeView === 'orders') filterOrders();
                else if (activeView === 'dashboard') loadDashboard();
            }
            showToast(`⚠️ Could not save status: ${errData.error || res.statusText || 'Server error'}`, 'error');
            return;
        }

        const data = await res.json().catch(() => ({}));
        if (data && data.order && o) {
            Object.assign(o, data.order);
            updateDailyRevenue();
            if (activeView === 'orders') filterOrders();
        }
    } catch (err) {
        recentOrderStatusUpdates.delete(targetOrderId);
        console.warn('Status synced in local cache, server ping returned:', err.message);
    }
}

async function quickSetOrderStatus(orderId, newStatus, e) {
    if (e) e.stopPropagation();

    // 1. Optimistic instant update
    const o = ordersCache.find(x => x.id === orderId);
    const prevStatus = o ? o.status : null;
    let paymentMethod = o?.payment_method || 'Cash';
    if (o) {
        o.status = newStatus;
        if (newStatus === 'Delivered') {
            o.payment_status = 'PAID';
            const pm = (o.payment_method || '').toLowerCase();
            if (!o.payment_method || pm.includes('cod') || pm.includes('pay on delivery') || pm.includes('pod') || pm.includes('cash on delivery')) {
                o.payment_method = 'Cash';
                paymentMethod = 'Cash';
            }
        }
    }

    const pill1 = document.getElementById(`order-status-pill-${orderId}`);
    if (pill1) pill1.innerHTML = getStatusPill(newStatus);
    const pill2 = document.getElementById(`dash-status-pill-${orderId}`);
    if (pill2) pill2.innerHTML = getStatusPill(newStatus);

    const shortId = orderId.replace('order_', '').toUpperCase();
    showToast(`✓ Order #${shortId} set to "${newStatus}"`, 'success');

    updateDailyRevenue();
    if (activeView === 'orders') filterOrders();
    else if (activeView === 'dashboard') loadDashboard();

    registerRecentOrderStatusUpdate(orderId, newStatus, newStatus === 'Delivered' ? paymentMethod : undefined, newStatus === 'Delivered' ? 'PAID' : undefined);

    try {
        const payload = { orderId, status: newStatus };
        if (newStatus === 'Delivered') {
            payload.paymentMethod = paymentMethod;
            payload.paymentStatus = 'PAID';
        }
        const res = await fetchWithTimeout('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        }, 15000);
        if (!res.ok) {
            recentOrderStatusUpdates.delete(orderId);
            const errData = await res.json().catch(() => ({}));
            console.error('[Quick Status Error]:', res.status, errData);
            if (o && prevStatus) {
                o.status = prevStatus;
                if (pill1) pill1.innerHTML = getStatusPill(prevStatus);
                if (pill2) pill2.innerHTML = getStatusPill(prevStatus);
                updateDailyRevenue();
                if (activeView === 'orders') filterOrders();
            }
            showToast(`⚠️ Status update failed: ${errData.error || res.statusText}`, 'error');
        }
    } catch (err) {
        recentOrderStatusUpdates.delete(orderId);
        console.warn('Quick status update synced in session, server ping returned:', err.message);
    }
}

// ================= 6. PRODUCT MODAL (ADD / EDIT & PHOTO UPLOAD) =================
function handleProductDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = document.getElementById('product-dropzone');
    if (zone) zone.classList.add('border-[#10B981]', 'bg-[#10B981]/10');
}

function handleProductDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = document.getElementById('product-dropzone');
    if (zone) zone.classList.remove('border-[#10B981]', 'bg-[#10B981]/10');
}

function handleProductDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = document.getElementById('product-dropzone');
    if (zone) zone.classList.remove('border-[#10B981]', 'bg-[#10B981]/10');
    const file = e.dataTransfer?.files?.[0];
    if (file) processProductImageFile(file);
}

function setProductImageUploadState(status) {
    let badge = document.getElementById('product-img-upload-badge');
    const previewBox = document.getElementById('product-img-preview-box');
    if (!badge && previewBox) {
        badge = document.createElement('div');
        badge.id = 'product-img-upload-badge';
        previewBox.appendChild(badge);
    }
    if (!badge) return;

    if (status === 'uploading') {
        badge.className = 'absolute bottom-1 left-1 right-1 text-[10px] font-bold text-center py-0.5 px-1 rounded bg-amber-500/90 text-white shadow-sm flex items-center justify-center gap-1 z-10';
        badge.innerHTML = '<span class="material-symbols-outlined text-[12px] animate-spin">sync</span> Uploading...';
    } else if (status === 'success') {
        badge.className = 'absolute bottom-1 left-1 right-1 text-[10px] font-bold text-center py-0.5 px-1 rounded bg-emerald-600/90 text-white shadow-sm flex items-center justify-center gap-1 z-10';
        badge.innerHTML = '<span class="material-symbols-outlined text-[12px]">cloud_done</span> Ready';
        setTimeout(() => { if (badge && badge.parentElement) badge.remove(); }, 3500);
    } else if (status === 'error') {
        badge.className = 'absolute bottom-1 left-1 right-1 text-[10px] font-bold text-center py-0.5 px-1 rounded bg-rose-600/90 text-white shadow-sm flex items-center justify-center gap-1 z-10';
        badge.innerHTML = '<span class="material-symbols-outlined text-[12px]">error</span> Failed';
    } else {
        badge.remove();
    }
}

function processProductImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, WEBP).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);

            const preview = document.getElementById('product-img-preview');
            const urlInput = document.getElementById('form-product-image');
            if (preview) preview.src = compressed;
            if (urlInput) urlInput.value = compressed;

            // Direct upload with instant visual indicator
            setProductImageUploadState('uploading');
            try {
                const prodName = document.getElementById('form-product-name')?.value?.trim() || file.name.replace(/\.[^/.]+$/, '');
                const uploadRes = await fetch('/api/products/admin/upload-image', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        image_data: compressed,
                        filename: prodName
                    })
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success && uploadData.image_url) {
                    if (urlInput) urlInput.value = uploadData.image_url;
                    setProductImageUploadState('success');
                } else {
                    setProductImageUploadState('error');
                    console.warn('[Image Upload Notice]:', uploadData.error);
                }
            } catch (upErr) {
                console.warn('[Image Upload Error]:', upErr);
                setProductImageUploadState('error');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handleProductFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    processProductImageFile(file);
}

function handleImageUrlInput(url) {
    const preview = document.getElementById('product-img-preview');
    if (preview) {
        preview.src = url.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
    }
}

function clearProductImage() {
    const preview = document.getElementById('product-img-preview');
    const urlInput = document.getElementById('form-product-image');
    const fileInput = document.getElementById('form-product-file');
    const badge = document.getElementById('product-img-upload-badge');
    if (preview) preview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (badge) badge.remove();
}

function updateModalProfitPreview() {
    const cost = Number(document.getElementById('form-product-cost')?.value) || 0;
    const price = Number(document.getElementById('form-product-price')?.value) || 0;
    const profit = Math.max(0, price - cost);
    const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0.0';
    const profitUnitEl = document.getElementById('modal-profit-unit');
    const profitMarginEl = document.getElementById('modal-profit-margin');
    if (profitUnitEl) profitUnitEl.textContent = `₹${profit.toFixed(2)}`;
    if (profitMarginEl) profitMarginEl.textContent = `${margin}% margin`;
}
window.updateModalProfitPreview = updateModalProfitPreview;

const DEFAULT_CATEGORY_SUBCATEGORIES = {
    "Quick's Instant Food": [
        'Maggi & Noodles',
        'magiee & Noodles',
        'Cooked Meals & Platters',
        'Sandwiches & Burgers',
        'Pasta & Macaroni',
        'Hot Snacks & Fries',
        'Soups & Bowls',
        'Chai, Coffee & Beverages'
    ],
    'Instant Food': [
        'Maggi & Noodles',
        'magiee & Noodles',
        'Cooked Meals & Platters',
        'Sandwiches & Burgers',
        'Pasta & Macaroni',
        'Hot Snacks & Fries',
        'Soups & Bowls',
        'Chai, Coffee & Beverages'
    ],
    'Snacks & Beverages': [
        'Biscuits',
        'Chips',
        'Chocolates',
        'Instant Food',
        'Namkeen',
        'Popcorn',
        'Snacks',
        'Sweets',
        'Bakery',
        'Drinks',
        'Juices',
        'Candies'
    ],
    'Grocery': [
        'Atta, Rice & Dal',
        'Cooking Oil & Ghee',
        'Dairy, Bread & Eggs',
        'Spices & Masalas',
        'Tea, Coffee & Beverages',
        'Sauces & Spreads'
    ],
    'Pharmacy': [
        'First Aid & Bandages',
        'Pain Relief & Balms',
        'Cold, Cough & Fever',
        'Digestive Care & Antacids',
        'Healthcare Essentials'
    ],
    'Personal Care': [
        'Soaps & Body Wash',
        'Hair Care & Shampoo',
        'Oral Care & Toothpaste',
        'Skin Care & Face Wash',
        'Hostel Grooming Essentials'
    ],
    'Stationery': [
        'Notebooks & Registers',
        'Pens, Pencils & Markers',
        'Files & Folders',
        'Adhesives, Scissors & Tape',
        'Exam & Study Supplies'
    ]
};

function getAvailableSubcategoriesForCategory(categoryName) {
    const list = [];
    const seen = new Set();
    const defaults = DEFAULT_CATEGORY_SUBCATEGORIES[categoryName] || [];
    defaults.forEach(s => {
        const trimmed = (s || '').trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
            seen.add(trimmed.toLowerCase());
            list.push(trimmed);
        }
    });

    if (Array.isArray(window.productsCache)) {
        window.productsCache.forEach(p => {
            if (p && p.category && (p.category.toLowerCase() === (categoryName || '').toLowerCase()) && p.subcategory) {
                const trimmed = p.subcategory.trim();
                if (trimmed && !seen.has(trimmed.toLowerCase())) {
                    seen.add(trimmed.toLowerCase());
                    list.push(trimmed);
                }
            }
        });
    }
    return list;
}

function populateSubcategoriesForCategory(categoryName, selectedSubcategory = '') {
    const subSelect = document.getElementById('form-product-subcategory');
    const customInput = document.getElementById('form-product-subcategory-custom');
    if (!subSelect) return;

    const available = getAvailableSubcategoriesForCategory(categoryName);
    let html = '<option value="">Select Subcategory</option>';
    let matched = false;

    available.forEach(s => {
        const isSel = selectedSubcategory && s.toLowerCase() === selectedSubcategory.toLowerCase();
        if (isSel) matched = true;
        html += `<option value="${s.replace(/"/g, '&quot;')}"${isSel ? ' selected' : ''}>${s}</option>`;
    });

    if (selectedSubcategory && !matched) {
        html += `<option value="${selectedSubcategory.replace(/"/g, '&quot;')}" selected>${selectedSubcategory}</option>`;
    }

    html += '<option value="__custom__">+ Add Custom Subcategory...</option>';
    subSelect.innerHTML = html;

    if (customInput) {
        customInput.classList.add('hidden');
        customInput.value = '';
    }
}

function onModalCategoryChange() {
    const cat = document.getElementById('form-product-category')?.value;
    populateSubcategoriesForCategory(cat, '');
}
window.onModalCategoryChange = onModalCategoryChange;

function onModalSubcategoryChange() {
    const subSelect = document.getElementById('form-product-subcategory');
    const customInput = document.getElementById('form-product-subcategory-custom');
    if (!subSelect || !customInput) return;

    if (subSelect.value === '__custom__') {
        customInput.classList.remove('hidden');
        customInput.focus();
    } else {
        customInput.classList.add('hidden');
    }
}
window.onModalSubcategoryChange = onModalSubcategoryChange;

function openProductModal(product = null) {
    document.getElementById('product-modal').classList.remove('hidden');
    const deleteBtn = document.getElementById('btn-modal-delete-product');
    const preview = document.getElementById('product-img-preview');
    const fileInput = document.getElementById('form-product-file');
    const badge = document.getElementById('product-img-upload-badge');
    if (fileInput) fileInput.value = '';
    if (badge) badge.remove();

    const isOwner = isPlatformOwner();
    const costContainer = document.getElementById('modal-cost-container');
    const profitPreview = document.getElementById('modal-profit-preview');
    const pricingGrid = document.getElementById('modal-pricing-grid');

    if (costContainer) costContainer.classList.remove('hidden');
    if (profitPreview) profitPreview.classList.remove('hidden');
    if (pricingGrid) {
        pricingGrid.className = 'grid grid-cols-2 sm:grid-cols-4 gap-3';
    }

    if (product) {
        window.modalInitialProductValues = {
            id: product.id,
            name: product.name || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            cost_price: product.cost_price !== undefined ? product.cost_price : (product.cost || 0),
            price: Number(product.price) || 0,
            mrp: Number(product.mrp) || Number(product.price) || 0,
            stock_left: product.stock_left !== undefined ? Number(product.stock_left) : 0,
            image_url: product.image_url || '',
            description: product.description || '',
            hostel_id: product.hostel_id || 'BH-13'
        };

        document.getElementById('modal-product-title').textContent = 'Edit Product';
        document.getElementById('form-product-id').value = product.id;
        document.getElementById('form-product-name').value = product.name;
        document.getElementById('form-product-category').value = product.category;
        populateSubcategoriesForCategory(product.category || 'Snacks & Beverages', product.subcategory || '');
        const costInput = document.getElementById('form-product-cost');
        if (costInput) {
            costInput.value = product.cost_price !== undefined ? product.cost_price : (product.cost || 0);
        }
        document.getElementById('form-product-price').value = product.price;
        document.getElementById('form-product-mrp').value = product.mrp || product.price;
        document.getElementById('form-product-stock').value = product.stock_left !== undefined ? product.stock_left : 0;
        document.getElementById('form-product-image').value = product.image_url || '';
        if (preview) preview.src = product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
        document.getElementById('form-product-desc').value = product.description || '';
        if (deleteBtn) {
            if (isOwner) {
                deleteBtn.classList.remove('hidden');
                deleteBtn.dataset.productId = product.id;
                deleteBtn.dataset.productName = product.name;
                const delLabel = deleteBtn.querySelector('span:last-child');
                if (delLabel) {
                    delLabel.textContent = 'Delete Product';
                }
            } else {
                deleteBtn.classList.add('hidden');
                deleteBtn.dataset.productId = '';
                deleteBtn.dataset.productName = '';
            }
        }
        updateModalProfitPreview();
    } else {
        window.modalInitialProductValues = null;
        document.getElementById('modal-product-title').textContent = 'Add New Product';
        document.getElementById('product-form').reset();
        document.getElementById('form-product-id').value = '';
        const defaultCat = document.getElementById('form-product-category')?.value || 'Snacks & Beverages';
        populateSubcategoriesForCategory(defaultCat, '');
        const costInput = document.getElementById('form-product-cost');
        if (costInput) costInput.value = '';
        document.getElementById('form-product-stock').value = '0';
        clearProductImage();
        if (deleteBtn) {
            deleteBtn.classList.add('hidden');
            deleteBtn.dataset.productId = '';
            deleteBtn.dataset.productName = '';
        }
        updateModalProfitPreview();
    }

    // Set and lock hostel selector based on product/role
    const hostelSelect = document.getElementById('form-product-hostel');
    if (hostelSelect) {
        if (product) {
            hostelSelect.value = product.hostel_id || 'BH-13';
        } else {
            const activeFilter = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('products') : null;
            hostelSelect.value = (currentAdminProfile && currentAdminProfile.assigned_hostel_id)
                || (activeFilter && activeFilter !== 'ALL' ? activeFilter : 'BH-13');
        }
        const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
            ? currentAdminProfile.assigned_hostels
            : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);

        if (!isOwner && myHostels.length === 1) {
            hostelSelect.value = myHostels[0];
            hostelSelect.disabled = true;
        } else if (!isOwner && myHostels.length > 1) {
            Array.from(hostelSelect.options).forEach(opt => {
                if (opt.value && !myHostels.includes(opt.value)) {
                    opt.disabled = true;
                    opt.style.display = 'none';
                } else {
                    opt.disabled = false;
                    opt.style.display = '';
                }
            });
            if (!myHostels.includes(hostelSelect.value)) {
                hostelSelect.value = myHostels[0];
            }
            hostelSelect.disabled = false;
        } else {
            hostelSelect.disabled = false;
        }
    }
}

async function onModalHostelChange() {
    const productId = document.getElementById('form-product-id')?.value;
    const hostelSelect = document.getElementById('form-product-hostel');
    const hostelVal = hostelSelect?.value;
    if (!productId || !hostelVal) return;

    try {
        const res = await fetch(`/api/products/${productId}?hostel_id=${encodeURIComponent(hostelVal)}&force=true&_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            const stockInput = document.getElementById('form-product-stock');
            if (stockInput && data && data.stock_left !== undefined) {
                stockInput.value = data.stock_left;
                if (window.modalInitialProductValues && window.modalInitialProductValues.id === productId) {
                    window.modalInitialProductValues.stock_left = Number(data.stock_left);
                    window.modalInitialProductValues.hostel_id = hostelVal;
                }
            }
        }
    } catch (e) {
        console.warn('Failed to load hostel product stock preview:', e);
    }
}
window.onModalHostelChange = onModalHostelChange;

function closeProductModal() {
    window.modalInitialProductValues = null;
    document.getElementById('product-modal').classList.add('hidden');
}

async function handleModalDeleteProduct() {
    const deleteBtn = document.getElementById('btn-modal-delete-product');
    const id = deleteBtn?.dataset.productId || document.getElementById('form-product-id').value;
    const name = deleteBtn?.dataset.productName || document.getElementById('form-product-name').value || 'this product';
    if (!id) return;
    closeProductModal();
    await deleteProductPermanently(id, name);
}

async function editProduct(id) {
    const isOwner = isPlatformOwner();
    const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
    const activeFilter = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('products') : null;
    const hostelId = (!isOwner && myHostels.length === 1)
        ? myHostels[0]
        : (activeFilter || currentAdminProfile?.assigned_hostel_id || null);
    const hostelParam = hostelId ? `?hostel_id=${encodeURIComponent(hostelId)}&force=true` : '?force=true';
    try {
        const res = await fetch(`/api/products/${id}${hostelParam}&_t=${Date.now()}`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const freshProd = await res.json();
            if (freshProd && freshProd.id) {
                openProductModal(freshProd);
                return;
            }
        }
    } catch (e) {
        console.warn('Could not fetch fresh product details for edit, falling back to cache:', e);
    }
    const p = productsCache.find(x => x.id === id);
    if (p) openProductModal(p);
}

async function handleProductSubmit(e) {
    e.preventDefault();
    if (window.__isSavingProduct) return;
    window.__isSavingProduct = true;

    const saveBtn = document.getElementById('btn-save-product');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Saving...';
    }

    try {
        const id = document.getElementById('form-product-id').value;
        const stockVal = Number(document.getElementById('form-product-stock').value) || 0;
        let imageUrl = document.getElementById('form-product-image').value.trim();

        // If a photo was selected as a local file (base64 Data URL), upload it to Supabase Storage
        if (imageUrl.startsWith('data:image/')) {
            setProductImageUploadState('uploading');
            try {
                const uploadRes = await fetch('/api/products/admin/upload-image', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        image_data: imageUrl,
                        filename: document.getElementById('form-product-name').value.trim()
                    })
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success && uploadData.image_url) {
                    imageUrl = uploadData.image_url;
                    document.getElementById('form-product-image').value = imageUrl;
                    setProductImageUploadState('success');
                } else {
                    setProductImageUploadState('error');
                }
            } catch (upErr) {
                console.warn('[Image Upload Notice]:', upErr);
                setProductImageUploadState('error');
            }
        }

        const isOwner = isPlatformOwner();
        const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
            ? currentAdminProfile.assigned_hostels
            : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
        const hostelSelect = document.getElementById('form-product-hostel');
        const hostelVal = (hostelSelect?.value && (!currentAdminProfile || isOwner || myHostels.includes(hostelSelect.value)))
            ? hostelSelect.value
            : (currentAdminProfile?.assigned_hostel_id || 'BH-13');

        const currentName = document.getElementById('form-product-name').value.trim();
        const currentCategory = document.getElementById('form-product-category').value;
        const subSelect = document.getElementById('form-product-subcategory');
        const customInput = document.getElementById('form-product-subcategory-custom');
        let currentSubcategory = subSelect ? subSelect.value.trim() : '';
        if (currentSubcategory === '__custom__' && customInput) {
            currentSubcategory = customInput.value.trim();
        }
        const currentPrice = Number(document.getElementById('form-product-price').value);
        const currentMrp = Number(document.getElementById('form-product-mrp').value) || currentPrice;
        const currentDesc = document.getElementById('form-product-desc').value.trim();
        const costVal = Number(document.getElementById('form-product-cost')?.value);
        const currentCost = !isNaN(costVal) ? costVal : 0;

        let payload;
        if (id && window.modalInitialProductValues && window.modalInitialProductValues.id === id) {
            const init = window.modalInitialProductValues;
            payload = { id, hostel_id: hostelVal };

            if (currentName !== init.name) payload.name = currentName;
            if (currentCategory !== init.category) payload.category = currentCategory;
            if (currentSubcategory !== (init.subcategory || '')) payload.subcategory = currentSubcategory;
            if (currentPrice !== init.price) payload.price = currentPrice;
            if (currentMrp !== init.mrp) payload.mrp = currentMrp;
            if (currentDesc !== (init.description || '')) payload.description = currentDesc;
            if (imageUrl && imageUrl !== (init.image_url || '')) payload.image_url = imageUrl;
            payload.cost_price = currentCost;

            // Only send stock if stock actually changed from what was loaded into modal
            if (stockVal !== init.stock_left) {
                payload.stock_left = stockVal;
                payload.in_stock = stockVal > 0;
            }
        } else {
            payload = {
                name: currentName,
                category: currentCategory,
                subcategory: currentSubcategory,
                price: currentPrice,
                mrp: currentMrp,
                stock_left: stockVal,
                in_stock: stockVal > 0,
                image_url: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                description: currentDesc,
                cost_price: currentCost,
                hostel_id: hostelVal
            };
        }

        const url = id ? `/api/products/admin/update/${id}` : '/api/products/admin/create';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeProductModal();
            await loadProducts(true);
            await loadInventory(true);
            await loadDashboard();
            if (typeof showToast === 'function') {
                showToast(`Product "${payload.name || currentName}" saved successfully!`, 'success');
            }
        } else {
            alert('Error saving product: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Save failed: ' + err.message);
    } finally {
        window.__isSavingProduct = false;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>Save Product</span>';
        }
    }
}

async function deactivateProduct(id, name) {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will become unavailable to students while preserving historical orders.`)) return;

    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function')
            ? (getActiveAdminHostelFilter('products') || getActiveAdminHostelFilter('inventory'))
            : null;
        const hostelParam = hostelId ? `?hostel_id=${encodeURIComponent(hostelId)}` : '';
        const res = await fetch(`/api/products/admin/deactivate/${id}${hostelParam}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            loadProducts(true);
            if (typeof loadInventory === 'function') loadInventory(true);
        }
    } catch (err) {
        alert('Deactivation failed: ' + err.message);
    }
}

async function deleteProductPermanently(id, name) {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    if (!isOwner) {
        alert('Permission Denied: Only the Main Admin (Owner) can delete products.');
        return;
    }

    const promptMsg = `⚠️ PERMANENT DELETE:\n\nAre you sure you want to permanently delete "${name}" from the product catalog?\n\nThis will completely remove the product from the database and cannot be undone.`;

    if (!confirm(promptMsg)) return;

    try {
        const res = await fetch(`/api/products/admin/delete/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (res.ok && data.success) {
            alert(`Product "${name}" was permanently deleted from the database.`);
            if (typeof closeProductModal === 'function') closeProductModal();
            loadProducts(true);
            if (typeof loadInventory === 'function') loadInventory(true);
        } else {
            alert('Failed to delete product: ' + (data.error || data.message || 'Operation failed'));
        }
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

// ================= 7. CUSTOMERS LOAD & FRAUD MANAGEMENT =================
async function loadCustomers() {
    try {
        const res = await fetch(`/api/admin/users`, { headers: getAuthHeaders() });
        let data = {};
        if (res.ok) {
            data = await res.json();
            customersCache = data.users || [];
        } else {
            // Fallback to orders customer endpoint
            const fallbackRes = await fetch(`/api/orders/admin/customers`, { headers: getAuthHeaders() });
            data = await fallbackRes.json();
            customersCache = data.customers || [];
        }

        renderCustomersTable(customersCache);
    } catch (err) {
        console.error('Failed to load customers:', err);
    }
}

let currentCustomerPage = 1;
const CUSTOMERS_PER_PAGE = 30;
let currentRenderedCustomers = [];

function renderCustomersTable(customers, page = 1) {
    const tbody = document.getElementById('customers-table-tbody');
    if (!tbody) return;

    currentRenderedCustomers = customers || [];
    currentCustomerPage = page;

    if (currentRenderedCustomers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-[#5c5f60]">No student customer records found.</td></tr>`;
        renderCustomerPaginationControls(0, 1);
        return;
    }

    const totalPages = Math.ceil(currentRenderedCustomers.length / CUSTOMERS_PER_PAGE);
    const validPage = Math.max(1, Math.min(page, totalPages));
    currentCustomerPage = validPage;

    const startIndex = (validPage - 1) * CUSTOMERS_PER_PAGE;
    const slice = currentRenderedCustomers.slice(startIndex, startIndex + CUSTOMERS_PER_PAGE);

    tbody.innerHTML = slice.map(c => {
        const isBlocked = c.account_status === 'BLOCKED';
        const phoneHtml = c.phone && c.phone.trim() ? `<span class="font-medium text-[#181c1f]">${c.phone}</span>` : `<span class="text-[#74777a] italic">Not provided</span>`;
        const emailHtml = c.email && c.email.trim() ? `<span class="font-medium text-[#181c1f]">${c.email}</span>` : `<span class="text-[#74777a] italic">Not provided</span>`;

        const statusHtml = isBlocked
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">BLOCKED (${c.block_reason || 'Fake Orders'})</span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">Active Student</span>`;

        const lastActiveTime = c.last_login
            ? new Date(c.last_login).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : (c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : '<span class="text-[#74777a] italic">Never</span>');

        const actionBtn = isBlocked
            ? `<button onclick="handleUnblockUser('${c.id}')" class="px-2.5 py-1.5 rounded-lg bg-[#137333]/10 hover:bg-[#137333]/20 text-[#137333] font-bold text-xs transition-colors flex items-center gap-1">
                 <span class="material-symbols-outlined text-[14px]">lock_open</span>
                 <span>Unblock</span>
               </button>`
            : `<button onclick="openBlockUserModal('${c.id}', '${encodeURIComponent(c.name || 'Student')}', '${encodeURIComponent(c.phone || '')}', '${encodeURIComponent(c.email || '')}')" class="px-2.5 py-1.5 rounded-lg bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] font-bold text-xs transition-colors flex items-center gap-1">
                 <span class="material-symbols-outlined text-[14px]">block</span>
                 <span>Block</span>
               </button>`;

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors ${isBlocked ? 'bg-[#fff8f7]' : ''}">
                <td class="p-4 font-bold text-xs text-[#181c1f]">
                    <div class="flex items-center gap-2.5 cursor-pointer group" onclick="viewCustomerDetails('${c.id}')" title="Click to view complete order history">
                        <div class="w-8 h-8 rounded-full ${isBlocked ? 'bg-[#ba1a1a]' : 'bg-[#3c4043] group-hover:bg-[#1a73e8]'} text-white flex items-center justify-center text-xs font-bold shrink-0 transition-colors">
                            ${(c.name || 'S')[0].toUpperCase()}
                        </div>
                        <div>
                            <p class="font-bold text-[#181c1f] group-hover:text-[#1a73e8] transition-colors flex items-center gap-1">
                                <span>${c.name || 'Student'}</span>
                                <span class="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity text-[#1a73e8]">open_in_new</span>
                            </p>
                            <p class="text-[10px] text-[#5c5f60] font-medium">${c.address ? `🏠 ${c.address}` : (c.id || '')}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-xs">${phoneHtml}</td>
                <td class="p-4 text-xs">${emailHtml}</td>
                <td class="p-4 font-bold text-[#181c1f]">${c.order_count || 0}</td>
                <td class="p-4 font-bold text-[#137333]">₹${c.total_spent || 0}</td>
                <td class="p-4 text-xs font-medium text-[#5c5f60]">${lastActiveTime}</td>
                <td class="p-4">${statusHtml}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="viewCustomerDetails('${c.id}')" class="px-2.5 py-1.5 rounded-lg bg-[#1a73e8]/10 hover:bg-[#1a73e8]/20 text-[#1a73e8] font-bold text-xs transition-colors flex items-center gap-1 shadow-sm" title="View Customer Orders & Profile">
                            <span class="material-symbols-outlined text-[14px]">receipt_long</span>
                            <span>History</span>
                        </button>
                        ${actionBtn}
                    </div>
                </td>
            </tr>
        `;

    }).join('');

    renderCustomerPaginationControls(currentRenderedCustomers.length, validPage);
}

function renderCustomerPaginationControls(totalItems, currentPage) {
    let paginationContainer = document.getElementById('customers-pagination-controls');
    const tableWrapper = document.getElementById('customers-table-tbody')?.closest('.bg-white') || document.getElementById('customers-table-tbody')?.parentElement;

    if (!paginationContainer && tableWrapper) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'customers-pagination-controls';
        paginationContainer.className = 'flex items-center justify-between px-6 py-4 border-t border-[#e1e3e4] bg-[#f7fafd] text-xs';
        tableWrapper.parentElement.appendChild(paginationContainer);
    }

    if (!paginationContainer) return;

    if (totalItems <= CUSTOMERS_PER_PAGE) {
        paginationContainer.innerHTML = `<span class="text-[#5c5f60]">Showing all ${totalItems} students</span>`;
        return;
    }

    const totalPages = Math.ceil(totalItems / CUSTOMERS_PER_PAGE);
    const startNum = (currentPage - 1) * CUSTOMERS_PER_PAGE + 1;
    const endNum = Math.min(currentPage * CUSTOMERS_PER_PAGE, totalItems);

    paginationContainer.innerHTML = `
        <span class="text-[#5c5f60] font-medium">Showing <strong class="text-[#181c1f]">${startNum}-${endNum}</strong> of <strong class="text-[#181c1f]">${totalItems}</strong> students</span>
        <div class="flex items-center gap-2">
            <button onclick="renderCustomersTable(currentRenderedCustomers, ${currentPage - 1})" ${currentPage <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-white shadow-sm"'} class="px-3 py-1.5 rounded-lg border border-[#e1e3e4] font-bold text-xs transition-all">Previous</button>
            <span class="font-bold text-[#181c1f] px-2">Page ${currentPage} of ${totalPages}</span>
            <button onclick="renderCustomersTable(currentRenderedCustomers, ${currentPage + 1})" ${currentPage >= totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-white shadow-sm"'} class="px-3 py-1.5 rounded-lg border border-[#e1e3e4] font-bold text-xs transition-all">Next</button>
        </div>
    `;
}

let customerSearchDebounceTimer = null;
function filterCustomerDirectory() {
    clearTimeout(customerSearchDebounceTimer);
    customerSearchDebounceTimer = setTimeout(() => {
        const q = (document.getElementById('customer-search-input')?.value || '').trim().toLowerCase();
        if (!q) {
            renderCustomersTable(customersCache, 1);
            return;
        }
        const filtered = customersCache.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phone || '').includes(q) ||
            (c.id || '').toLowerCase().includes(q)
        );
        renderCustomersTable(filtered, 1);
    }, 150);
}


// ================= CUSTOMER DETAILS & ORDER HISTORY MODAL =================
async function viewCustomerDetails(customerId) {
    const modal = document.getElementById('modal-customer-details');
    if (!modal) return;

    modal.classList.remove('hidden');
    const tbody = document.getElementById('cust-orders-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60] animate-pulse">Loading customer profile and complete order history...</td></tr>`;
    }

    try {
        const res = await fetch(`/api/admin/customers/${customerId}/orders`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (!data.success || !data.customer) {
            showToast(data.error || 'Failed to load customer profile', 'error');
            closeCustomerDetailsModal();
            return;
        }

        const c = data.customer;
        const orders = data.orders || [];

        // Header Card
        const avatarEl = document.getElementById('cust-modal-avatar');
        if (avatarEl) avatarEl.textContent = (c.name || 'S')[0].toUpperCase();

        const nameEl = document.getElementById('cust-modal-name');
        if (nameEl) nameEl.textContent = c.name || 'Student';

        const statusBadge = document.getElementById('cust-modal-status-badge');
        const isBlocked = c.account_status === 'BLOCKED';
        if (statusBadge) {
            statusBadge.textContent = isBlocked ? `BLOCKED (${c.block_reason || 'Fraud'})` : 'ACTIVE STUDENT';
            statusBadge.className = isBlocked
                ? 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]'
                : 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]';
        }

        const roomEl = document.getElementById('cust-modal-room');
        if (roomEl) roomEl.textContent = c.address ? `🏠 ${c.address}` : '🏠 Hostel room not provided';

        const phoneEl = document.getElementById('cust-modal-phone');
        if (phoneEl) {
            phoneEl.innerHTML = c.phone && c.phone !== 'Not provided'
                ? `<span class="material-symbols-outlined text-xs text-[#1a73e8]">phone</span><a href="tel:${c.phone}" class="hover:underline text-[#1a73e8]">${c.phone}</a>`
                : `<span class="text-[#74777a] italic">No phone</span>`;
        }

        const emailEl = document.getElementById('cust-modal-email');
        if (emailEl) {
            emailEl.innerHTML = c.email
                ? `<span class="material-symbols-outlined text-xs text-[#5c5f60]">mail</span><span class="text-[#5c5f60]">${c.email}</span>`
                : '';
        }

        // Action button (Block / Unblock toggle)
        const actionsEl = document.getElementById('cust-modal-actions');
        if (actionsEl) {
            actionsEl.innerHTML = isBlocked
                ? `<button onclick="handleUnblockUser('${c.id}'); closeCustomerDetailsModal();" class="px-3 py-1.5 rounded-xl bg-[#137333] hover:bg-[#0f5c29] text-white font-bold text-xs flex items-center gap-1 shadow-sm">
                     <span class="material-symbols-outlined text-sm">lock_open</span>
                     <span>Unblock Student</span>
                   </button>`
                : `<button onclick="openBlockUserModal('${c.id}', '${encodeURIComponent(c.name || 'Student')}', '${encodeURIComponent(c.phone || '')}', '${encodeURIComponent(c.email || '')}'); closeCustomerDetailsModal();" class="px-3 py-1.5 rounded-xl bg-[#ba1a1a] hover:bg-[#931515] text-white font-bold text-xs flex items-center gap-1 shadow-sm">
                     <span class="material-symbols-outlined text-sm">block</span>
                     <span>Block Student</span>
                   </button>`;
        }

        // Metrics Chips
        const totalOrdersEl = document.getElementById('cust-modal-total-orders');
        const deliveredOrdersEl = document.getElementById('cust-modal-delivered-orders');
        const totalSpentEl = document.getElementById('cust-modal-total-spent');
        const lastActiveEl = document.getElementById('cust-modal-last-active');

        if (totalOrdersEl) totalOrdersEl.textContent = c.total_orders || 0;
        if (deliveredOrdersEl) deliveredOrdersEl.textContent = c.delivered_orders || 0;
        if (totalSpentEl) totalSpentEl.textContent = `₹${c.total_spent || 0}`;

        const lastActiveDate = c.last_login ? new Date(c.last_login).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'N/A');
        if (lastActiveEl) lastActiveEl.textContent = lastActiveDate;

        // Render Order History Table
        if (!tbody) return;
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60]">This customer has not placed any orders yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = orders.map(o => {
            const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
            const statusColors = {
                'Delivered': 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
                'Out for Delivery': 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]',
                'Confirmed': 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
                'Preparing': 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
                'Cancelled': 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab]'
            };
            const statusClass = statusColors[o.status] || 'bg-slate-100 text-slate-700 border-slate-200';
            const itemsSummary = o.items_summary || (o.items && o.items.length ? o.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'Order items');

            return `
                <tr class="hover:bg-[#f7fafd] transition-colors">
                    <td class="p-3 font-mono font-bold text-[#1a73e8]">#${(o.id || '').replace('order_', '').slice(0, 8)}</td>
                    <td class="p-3 text-[#5c5f60] whitespace-nowrap">${dateStr}</td>
                    <td class="p-3 max-w-[220px] truncate text-[#181c1f]" title="${itemsSummary}">${itemsSummary}</td>
                    <td class="p-3 font-bold text-[#181c1f]">₹${o.total || 0}</td>
                    <td class="p-3">
                        <span class="inline-flex items-center text-[10px] font-semibold text-[#5c5f60]">
                            ${(o.payment_method || 'COD').toUpperCase()} • <span class="${o.payment_status === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'} ml-1">${o.payment_status || 'PENDING'}</span>
                        </span>
                    </td>
                    <td class="p-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">${o.status}</span>
                    </td>
                    <td class="p-3 text-right">
                        <button onclick="closeCustomerDetailsModal(); openOrderDrawer('${o.id}');" class="p-1.5 rounded-lg hover:bg-slate-100 text-[#1a73e8]" title="View Order Drawer">
                            <span class="material-symbols-outlined text-base">visibility</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        showToast('Network error loading customer details', 'error');
        closeCustomerDetailsModal();
    }
}

function closeCustomerDetailsModal() {
    const modal = document.getElementById('modal-customer-details');
    if (modal) modal.classList.add('hidden');
}

// ================= BLACKLIST & FRAUD PREVENTION =================
let currentBlacklistFilter = 'all';

async function loadBlacklistData() {
    try {
        const res = await fetch(`/api/admin/blacklist`, { headers: getAuthHeaders() });
        const data = await res.json();
        blacklistCache = data.blacklist || [];

        // Update nav badge
        const badge = document.getElementById('nav-blacklist-badge');
        if (badge) {
            const activeCount = blacklistCache.filter(b => b.status === 'BLOCKED').length;
            badge.textContent = activeCount;
            badge.classList.toggle('hidden', activeCount === 0);
        }

        filterBlacklistTable();
    } catch (err) {
        console.error('Error loading blacklist data:', err);
    }
}

function setBlacklistFilter(filter) {
    currentBlacklistFilter = filter;
    document.querySelectorAll('.bl-filter-pill').forEach(pill => {
        const match = (filter === 'all' && pill.textContent.includes('All')) ||
            (filter === 'fake' && pill.textContent.includes('Fake')) ||
            (filter === 'other' && pill.textContent.includes('Other'));
        if (match) {
            pill.className = 'bl-filter-pill active px-3 py-1.5 rounded-full border border-[#3c4043] bg-[#3c4043] text-white font-semibold';
        } else {
            pill.className = 'bl-filter-pill px-3 py-1.5 rounded-full border border-[#DADCE0] bg-white text-[#5c5f60] hover:border-[#3c4043] font-semibold';
        }
    });
    filterBlacklistTable();
}

function filterBlacklistTable() {
    const q = (document.getElementById('blacklist-search-input')?.value || '').trim().toLowerCase();
    let list = blacklistCache;

    if (currentBlacklistFilter === 'fake') {
        list = list.filter(b => (b.reason || '').toLowerCase().includes('fake'));
    } else if (currentBlacklistFilter === 'other') {
        list = list.filter(b => !(b.reason || '').toLowerCase().includes('fake'));
    }

    if (q) {
        list = list.filter(b =>
            (b.customer_name || '').toLowerCase().includes(q) ||
            (b.customer_email || '').toLowerCase().includes(q) ||
            (b.customer_phone || '').includes(q) ||
            (b.user_id || '').toLowerCase().includes(q) ||
            (b.reason || '').toLowerCase().includes(q)
        );
    }

    renderBlacklistTable(list);
}

function renderBlacklistTable(records) {
    const tbody = document.getElementById('blacklist-table-tbody');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-[#5c5f60]">No blacklist records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.map(b => {
        const isBlocked = b.status === 'BLOCKED';
        const phoneHtml = b.customer_phone ? `<span class="font-medium text-[#181c1f]">${b.customer_phone}</span>` : `<span class="text-[#74777a] italic">Not provided</span>`;
        const emailHtml = b.customer_email ? `<span class="font-medium text-[#181c1f]">${b.customer_email}</span>` : `<span class="text-[#74777a] italic">Not provided</span>`;

        const statusHtml = isBlocked
            ? `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">BLOCKED</span>`
            : `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">RESOLVED</span>`;

        const actionBtn = isBlocked
            ? `<button onclick="handleUnblockUser('${b.user_id}')" class="px-3 py-1.5 rounded-lg bg-[#137333]/10 hover:bg-[#137333]/20 text-[#137333] font-bold text-xs transition-colors flex items-center gap-1 ml-auto">
                 <span class="material-symbols-outlined text-[14px]">lock_open</span>
                 <span>Unblock</span>
               </button>`
            : `<span class="text-xs text-[#74777a] italic">Active</span>`;

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors ${isBlocked ? 'bg-[#fff8f7]' : ''}">
                <td class="p-4 font-bold text-xs text-[#181c1f]">
                    <p class="font-bold text-[#181c1f]">${b.customer_name || 'Student'}</p>
                    <p class="text-[10px] text-[#74777a] font-mono">${b.user_id || ''}</p>
                </td>
                <td class="p-4 text-xs">${phoneHtml}</td>
                <td class="p-4 text-xs">${emailHtml}</td>
                <td class="p-4 font-bold text-[#ba1a1a]">${b.reason || 'Fake Orders'}</td>
                <td class="p-4 text-[#5c5f60] text-xs">${b.blocked_at ? new Date(b.blocked_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</td>
                <td class="p-4 text-[#5c5f60] text-xs">${b.blocked_by || 'Admin'}</td>
                <td class="p-4">${statusHtml}</td>
                <td class="p-4 text-right">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

// Block User Modal Controls
function openManualBlockModal() {
    const selectContainer = document.getElementById('modal-block-select-container');
    const selectEl = document.getElementById('modal-block-customer-select');
    if (selectContainer) selectContainer.classList.remove('hidden');

    function populateSelect(list) {
        if (!selectEl) return;
        const activeList = (list || []).filter(c => c.account_status !== 'BLOCKED');
        selectEl.innerHTML = '<option value="">-- Choose a student to block --</option>' +
            activeList.map(c => `
                <option value="${c.id}" data-name="${encodeURIComponent(c.name || 'Student')}" data-phone="${encodeURIComponent(c.phone || '')}" data-email="${encodeURIComponent(c.email || '')}">
                    ${c.name || 'Student'} (${c.phone || c.email || c.id})
                </option>
            `).join('');
    }

    populateSelect(customersCache);

    document.getElementById('modal-block-user-id').value = '';
    document.getElementById('modal-block-user-name').textContent = 'Please choose a student above';
    document.getElementById('modal-block-user-phone').textContent = '--';
    document.getElementById('modal-block-user-email').textContent = '--';
    document.getElementById('modal-block-reason').value = 'Fake Orders';
    document.getElementById('modal-block-notes').value = '';
    updateBlockReasonPreview();

    document.getElementById('block-user-modal')?.classList.remove('hidden');

    if (!customersCache || customersCache.length === 0) {
        loadCustomers().then(() => {
            populateSelect(customersCache);
        }).catch(() => { });
    }
}

function onManualBlockCustomerSelected() {
    const selectEl = document.getElementById('modal-block-customer-select');
    if (!selectEl) return;
    const opt = selectEl.options[selectEl.selectedIndex];
    if (!opt || !opt.value) {
        document.getElementById('modal-block-user-id').value = '';
        document.getElementById('modal-block-user-name').textContent = 'Please choose a student above';
        document.getElementById('modal-block-user-phone').textContent = '--';
        document.getElementById('modal-block-user-email').textContent = '--';
        return;
    }

    const userId = opt.value;
    const name = decodeURIComponent(opt.getAttribute('data-name') || 'Student');
    const phone = decodeURIComponent(opt.getAttribute('data-phone') || '');
    const email = decodeURIComponent(opt.getAttribute('data-email') || '');

    document.getElementById('modal-block-user-id').value = userId;
    document.getElementById('modal-block-user-name').textContent = name;
    document.getElementById('modal-block-user-phone').textContent = phone || 'Not provided';
    document.getElementById('modal-block-user-email').textContent = email || 'Not provided';
}

function openBlockUserModal(userId, name, phone, email) {
    const selectContainer = document.getElementById('modal-block-select-container');
    if (selectContainer) selectContainer.classList.add('hidden');

    const decodedName = decodeURIComponent(name || 'Student');
    const decodedPhone = decodeURIComponent(phone || '');
    const decodedEmail = decodeURIComponent(email || '');

    document.getElementById('modal-block-user-id').value = userId;
    document.getElementById('modal-block-user-name').textContent = decodedName;
    document.getElementById('modal-block-user-phone').textContent = decodedPhone || 'Not provided';
    document.getElementById('modal-block-user-email').textContent = decodedEmail || 'Not provided';
    document.getElementById('modal-block-reason').value = 'Fake Orders';
    document.getElementById('modal-block-notes').value = '';
    updateBlockReasonPreview();

    document.getElementById('block-user-modal')?.classList.remove('hidden');
}

function closeBlockUserModal() {
    document.getElementById('block-user-modal')?.classList.add('hidden');
}

function updateBlockReasonPreview() {
    const reason = document.getElementById('modal-block-reason')?.value || 'Fake Orders';
    const previewEl = document.getElementById('modal-block-preview-text');
    if (previewEl) {
        if (reason === 'Fake Orders') {
            previewEl.textContent = '"You are blocked due to fake orders."';
        } else {
            previewEl.textContent = `"You are blocked due to ${reason.toLowerCase()}."`;
        }
    }
}

async function handleBlockUserSubmit(e) {
    if (e) e.preventDefault();
    const userId = document.getElementById('modal-block-user-id').value;
    const reason = document.getElementById('modal-block-reason').value;
    const notes = document.getElementById('modal-block-notes').value;
    const submitBtn = document.getElementById('btn-confirm-block');

    if (!userId) {
        alert('Please select a valid student to block.');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Blocking...</span>`;
    }

    try {
        const res = await fetch(`/api/admin/users/${userId}/block`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason, notes })
        });
        const data = await res.json();
        if (data.success) {
            closeBlockUserModal();
            showToast(data.message || 'User has been blocked.', 'success');
            loadCustomers();
            loadBlacklistData();
        } else {
            alert('Failed to block user: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error blocking user: ' + err.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span class="material-symbols-outlined text-[16px]">block</span>
                <span>Confirm Block User</span>
            `;
        }
    }
}

async function handleUnblockUser(userId) {
    if (!confirm('Are you sure you want to unblock this user and restore their checkout access?')) {
        return;
    }
    try {
        const res = await fetch(`/api/admin/users/${userId}/unblock`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || 'User unblocked successfully.', 'success');
            loadCustomers();
            loadBlacklistData();
        } else {
            alert('Failed to unblock user: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error unblocking user: ' + err.message);
    }
}


// ================= 8. ANALYTICS LOAD =================
async function loadAnalytics() {
    try {
        const res = await fetch(`/api/orders/admin/analytics`, { headers: getAuthHeaders() });
        const data = await res.json();
        const m = data.metrics || {};

        const ordersEl = document.getElementById('analytics-orders');
        const activeOrdersEl = document.getElementById('analytics-active-orders');
        const stockRateEl = document.getElementById('analytics-stock-rate');

        if (ordersEl) ordersEl.textContent = `${m.deliveredOrdersCount || m.totalOrdersCount || 0}`;
        if (activeOrdersEl) activeOrdersEl.textContent = `${m.pendingOrdersCount || 0}`;

        const rate = m.totalProducts > 0 ? Math.round(((m.totalProducts - (m.outOfStockCount || 0)) / m.totalProducts) * 100) : 100;
        if (stockRateEl) stockRateEl.textContent = `${rate}%`;

        const tbody = document.getElementById('analytics-top-products-tbody');
        const top = data.topProducts || [];
        if (top.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-[#5c5f60]">No sales data recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = top.map(p => `
            <tr class="hover:bg-[#f7fafd]">
                <td class="py-3 font-semibold text-xs text-[#181c1f] flex items-center gap-2">
                    <img src="${p.image_url}" class="w-8 h-8 rounded object-cover bg-white border border-[#DADCE0]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                    <span>${p.name}</span>
                </td>
                <td class="py-3 text-[#5c5f60]">${p.category}</td>
                <td class="py-3 text-right font-bold text-[#181c1f]">${p.total_sold || 0}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Failed to load analytics:', err);
    }
}

// ================= 9. REAL-TIME WEBSOCKET & TOAST NOTIFICATIONS =================
let wsReconnectTimer = null;
let wsReconnectAttempts = 0;
let wsPingInterval = null;
let liveOrderPollInterval = null;
const processedOrderNotificationIds = new Set();
const knownOrderMap = new Map();
let isInitialOrderPoll = true;

function updateConnectionStatus(connected, mode = 'Live') {
    const indicator = document.getElementById('ws-status-indicator');
    const text = document.getElementById('ws-status-text');
    if (indicator) {
        indicator.className = `w-2 h-2 rounded-full ${connected ? 'bg-[#10B981] animate-pulse' : 'bg-[#ba1a1a]'}`;
    }
    if (text) {
        text.textContent = connected ? mode : 'Offline';
        text.className = `text-[10px] font-bold ${connected ? 'text-[#10B981]' : 'text-[#ba1a1a]'}`;
    }
    const mobText = document.getElementById('ws-status-text-mobile');
    if (mobText) {
        mobText.textContent = connected ? mode : 'Offline';
        mobText.className = `font-semibold ${connected ? 'text-emerald-700' : 'text-rose-600'}`;
    }
}

// Render function for Recent Orders Table in Dashboard
function renderRecentOrdersTable(ordersList) {
    const list = (ordersList && ordersList.length > 0) ? ordersList : (ordersCache || []);
    const recentOrders = list.slice(0, 5);
    const tbody = document.getElementById('dash-recent-orders-tbody');
    if (!tbody) return;

    if (recentOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60]">No orders found in database.</td></tr>`;
    } else {
        tbody.innerHTML = recentOrders.map(o => `
            <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')" id="order-row-${o.id}">
                <td class="p-3.5 font-bold font-mono text-[#181c1f]">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span>#${(o.id || '').replace('order_', '').toUpperCase()}</span>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0066cc] border border-blue-200">${escapeHtml(o.hostel_id || 'BH-13')}</span>
                    </div>
                </td>
                <td class="p-3.5 font-medium text-[#181c1f]">${formatCustomerDisplayName(o)}</td>
                <td class="p-3.5 text-[#5c5f60] truncate max-w-[150px]">${o.item_summary || 'Campus items'}</td>
                <td class="p-3.5 font-bold text-[#137333]">₹${o.total}</td>
                <td class="p-3.5 text-[#5c5f60]">${o.payment_method || 'COD'}</td>
                <td class="p-3.5" id="dash-status-pill-${o.id}" data-status-pill-id="${o.id}">${getStatusPill(o.status)}</td>
                <td class="p-3.5">
                    <button onclick="event.stopPropagation(); openOrderDrawer('${o.id}')" class="text-xs font-semibold text-[#3c4043] hover:underline">View</button>
                </td>
            </tr>
        `).join('');
    }
}

// Update KPI counters dynamically from ordersCache
function updateKpiCountersFromCache() {
    const totalOrdersEl = document.getElementById('dash-total-orders');
    const pendingOrdersEl = document.getElementById('dash-pending-orders');
    const badgeEl = document.getElementById('nav-pending-badge');

    const totalOrdersVal = ordersCache.length || 0;
    const pendingCountVal = ordersCache.filter(o => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(o.status)).length;

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrdersVal;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCountVal;
    updatePendingOrdersBadge(pendingCountVal);
    updateDailyRevenue();
}

// Compute and display daily revenue from today's orders (strictly successful deliveries only)
function updateDailyRevenue() {
    const revenueEl = document.getElementById('dash-daily-revenue');
    const metaEl = document.getElementById('dash-daily-revenue-meta');
    if (!revenueEl) return;

    // Timezone-safe date string in IST (Asia/Kolkata)
    function getISTDateStr(dateInput) {
        if (!dateInput) return '';
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return '';
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
        } catch (e) {
            return '';
        }
    }

    const todayIST = getISTDateStr(new Date());

    const todaysOrders = (ordersCache || []).filter(o => {
        if (!o || !o.created_at) return false;
        return getISTDateStr(o.created_at) === todayIST;
    });

    const isDelivered = (st) => {
        const s = String(st || '').toLowerCase().trim();
        return s === 'delivered' || s === 'completed';
    };
    const isCancelled = (st) => {
        const s = String(st || '').toLowerCase().trim();
        return s === 'cancelled' || s === 'canceled' || s === 'rejected';
    };

    // STRICT ACCURACY RULE:
    // Only count money from successfully delivered orders.
    // CANCELLED ORDERS, REJECTED ORDERS, AND PENDING ORDERS ARE NEVER ADDED TO REVENUE!
    const deliveredOrdersToday = todaysOrders.filter(o => isDelivered(o.status));
    const totalRevenue = deliveredOrdersToday.reduce((sum, o) => {
        const amt = Number(o.total || o.final_amount || 0);
        return sum + (isNaN(amt) || amt < 0 ? 0 : amt);
    }, 0);

    const completedToday = deliveredOrdersToday.length;
    const cancelledToday = todaysOrders.filter(o => isCancelled(o.status)).length;
    const pendingToday = todaysOrders.filter(o => !isDelivered(o.status) && !isCancelled(o.status)).length;

    revenueEl.textContent = `₹${Math.round(totalRevenue).toLocaleString('en-IN')}`;
    if (metaEl) {
        const parts = [`${todaysOrders.length} order${todaysOrders.length !== 1 ? 's' : ''}`];
        if (completedToday > 0) parts.push(`${completedToday} delivered`);
        if (cancelledToday > 0) parts.push(`${cancelledToday} cancelled`);
        if (pendingToday > 0) parts.push(`${pendingToday} pending`);
        metaEl.textContent = parts.join(' • ');
    }

    const card = revenueEl.closest('.glass-panel');
    if (card) {
        card.setAttribute('title', `Real-time Revenue: ₹${totalRevenue.toLocaleString('en-IN')} strictly from ${completedToday} delivered orders. (${cancelledToday} cancelled orders excluded)`);
    }
}

// Render function alias so activeView === 'orders' never throws ReferenceError
function renderOrdersTable(orders) {
    if (orders && Array.isArray(orders)) {
        ordersCache = orders;
    }
    filterOrders();
}

// Force Direct Supabase Cloud DB Sync (Bypasses any stale laptop/mobile local cache)
async function forceLiveDbSync() {
    const btn = document.getElementById('btn-force-sync');
    const icon = btn?.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.add('animate-spin');
    showToast('⚡ Syncing live orders from Supabase Cloud...', 'info');

    try {
        localStorage.removeItem('lpuquick_admin_orders_cache');
        localStorage.removeItem('lpuquick_admin_products_cache');
        ordersCache = [];
        knownOrderMap.clear();
        isInitialOrderPoll = true;

        await fetch(`/api/orders/admin/invalidate-cache?_t=${Date.now()}`, {
            method: 'POST',
            headers: getAuthHeaders()
        }).catch(() => { });

        await loadDashboard();
        if (activeView === 'orders') await loadOrders();

        updateConnectionStatus(true, 'Live');
        showToast(`✓ Synced ${ordersCache.length} live orders from database!`, 'success');
    } catch (err) {
        console.error('[Force Sync Error]:', err);
        showToast('Sync error: ' + err.message, 'warning');
    } finally {
        if (icon) icon.classList.remove('animate-spin');
    }
}
window.forceLiveDbSync = forceLiveDbSync;

function getOrderSignature(o) {
    if (!o) return '';
    const da = o.delivery_assignment || {};
    const transferKey = da.transfer ? `${da.transfer.status}_${da.transfer.to_id}` : 'none';
    return `${o.status}|${da.assigned_to || 'none'}|${da.assigned_to_name || ''}|${da.is_claimed ? '1' : '0'}|${transferKey}|${o.rider_name || ''}`;
}

// Smart Continuous Live Order Sync (Adaptive Polling with Page Visibility API)
async function syncOrdersLive() {
    const token = adminToken || localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    if (!token) {
        updateConnectionStatus(false, 'Auth Required');
        return;
    }
    try {
        const hostelId = (typeof getActiveAdminHostelFilter === 'function') ? getActiveAdminHostelFilter('orders') : null;
        const hostelParam = hostelId ? `?hostel_id=${encodeURIComponent(hostelId)}` : '';
        const res = await fetch(`/api/orders/admin/all${hostelParam}`, {
            headers: getAuthHeaders()
        });
        if (res.status === 401) {
            handleAdminAuthError(res);
            return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const rawOrders = data.orders || [];
        const orders = reconcileWithRecentOrderUpdates(rawOrders);

        // Keep local cache fresh at all times
        ordersCache = orders;
        try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(orders)); } catch (e) { }
        updateDailyRevenue();
        updateKpiCountersFromCache();

        if (isInitialOrderPoll) {
            orders.forEach(o => {
                if (o && o.id) knownOrderMap.set(o.id, getOrderSignature(o));
            });
            isInitialOrderPoll = false;
            updateConnectionStatus(true, 'Live');
            if (activeView === 'dashboard') {
                renderRecentOrdersTable(orders);
                updateKpiCountersFromCache();
            } else if (activeView === 'orders') {
                renderOrdersTable(orders);
            }
            return;
        }

        let hasOrderChanges = false;
        if (orders.length !== knownOrderMap.size) {
            hasOrderChanges = true;
        }

        // Detect new orders, status updates, and dispatch/rider changes
        for (const order of orders) {
            if (!order || !order.id) continue;
            const currentSig = getOrderSignature(order);

            if (!knownOrderMap.has(order.id)) {
                hasOrderChanges = true;
                knownOrderMap.set(order.id, currentSig);
                handleRealtimeNewOrder(order);
            } else if (knownOrderMap.get(order.id) !== currentSig) {
                const prevSig = knownOrderMap.get(order.id);
                // Check if this change is an incoming stale revert of a recent local status update
                const recent = recentOrderStatusUpdates.get(order.id);
                if (recent && order.status !== recent.status && (Date.now() - recent.timestamp < 30000)) {
                    continue;
                }
                hasOrderChanges = true;
                knownOrderMap.set(order.id, currentSig);

                // If status itself changed, trigger status update notification & KPI refresh
                if (!prevSig || !prevSig.startsWith(order.status + '|')) {
                    handleRealtimeStatusUpdate({ orderId: order.id, status: order.status });
                }

                // If currently open in drawer, update drawer dispatch card immediately!
                if (currentDrawerOrderId === order.id) {
                    updateDrawerDispatchCard(order);
                }
            }
        }

        // Keep UI updated only when view needs it or real changes occurred
        if (hasOrderChanges) {
            if (activeView === 'dashboard') {
                renderRecentOrdersTable(orders);
                updateKpiCountersFromCache();
            } else if (activeView === 'orders') {
                renderOrdersTable(orders);
            }
            if (currentDrawerOrderId) {
                const currentOrder = ordersCache.find(x => x.id === currentDrawerOrderId);
                if (currentOrder) updateDrawerDispatchCard(currentOrder);
            }
        }

        updateConnectionStatus(true, 'Live');
    } catch (err) {
        console.warn('[Admin Live Sync Note]:', err.message);
    }
}

const ORDER_POLL_REALTIME_MS = 45000; // 45s safety-net when Realtime/WS is active (saves 96% Vercel Fluid CPU)
const ORDER_POLL_FALLBACK_MS = 8000;  // 8s when Realtime & WS are both unavailable
const ORDER_POLL_HIDDEN_MS = 120000;  // 120s fallback when hidden (paused completely if Realtime active)

let adminSupabaseClient = null;
let adminSupabaseChannel = null;
let adminSupabaseSubscribed = false;
let wsConsecutiveFailures = 0;
let wsUnavailableOnHost = false;

function isLocalWebSocketHost() {
    const h = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
    return /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i.test(h);
}

function scheduleNextOrderPoll() {
    if (liveOrderPollInterval) clearTimeout(liveOrderPollInterval);
    const hasRealtime = Boolean((realtimeWs && realtimeWs.readyState === WebSocket.OPEN) || adminSupabaseSubscribed);
    const isHidden = (typeof document !== 'undefined' && document.hidden);
    if (isHidden && hasRealtime) {
        return; // Pause polling completely while hidden; visibilitychange triggers instant sync on return
    }
    const delay = isHidden ? ORDER_POLL_HIDDEN_MS : (hasRealtime ? ORDER_POLL_REALTIME_MS : ORDER_POLL_FALLBACK_MS);
    liveOrderPollInterval = setTimeout(async () => {
        await syncOrdersLive();
        scheduleNextOrderPoll();
    }, delay);
}

function startLiveOrderPolling() {
    if (liveOrderPollInterval) clearTimeout(liveOrderPollInterval);
    syncOrdersLive();
    scheduleNextOrderPoll();
}

if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && adminToken) {
            syncOrdersLive();
            scheduleNextOrderPoll();
        }
    });
}

async function initSupabaseRealtime() {
    try {
        if (typeof window === 'undefined') return;
        // Do not tear down an already healthy or connecting Supabase Realtime channel!
        if (adminSupabaseChannel && (adminSupabaseChannel.state === 'joined' || adminSupabaseChannel.state === 'joining')) {
            return;
        }
        const createClientFn = window.supabase?.createClient || (typeof supabase !== 'undefined' ? supabase.createClient : null);
        if (!createClientFn) return;

        let cfg = window.__REALTIME_CONFIG__;
        if (!cfg) {
            const res = await fetch('/api/realtime/config');
            if (res.ok) {
                cfg = await res.json();
                window.__REALTIME_CONFIG__ = cfg;
            }
        }
        if (!cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return;

        if (adminSupabaseChannel) {
            try { adminSupabaseChannel.unsubscribe(); } catch (e) { }
            adminSupabaseChannel = null;
        }

        if (!adminSupabaseClient) {
            adminSupabaseClient = createClientFn(cfg.supabaseUrl, cfg.supabaseAnonKey, {
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });
        }

        adminSupabaseChannel = adminSupabaseClient.channel('lpuquick_global_realtime');

        const events = [
            'NEW_ORDER', 'ORDER_STATUS_UPDATE', 'INVENTORY_UPDATE', 'CATALOG_UPDATE',
            'CLIENT_LOCK_UPDATE', 'USER_BLOCKED', 'USER_UNBLOCKED', 'ORDER_CLAIMED',
            'TRANSFER_REQUESTED', 'TRANSFER_RESOLVED', 'ORDER_EDITED',
            'ADVERTISEMENTS_UPDATED', 'DUTY_STATUS_CHANGED', 'HOSTEL_STATUS_CHANGED',
            'ORDER_DELETED'
        ];

        events.forEach(ev => {
            adminSupabaseChannel.on('broadcast', { event: ev }, (payload) => {
                const data = payload?.payload;
                if (data) {
                    handleAdminRealtimePacket(data);
                }
            });
        });

        // Postgres changes for direct database updates
        adminSupabaseChannel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            try {
                if (payload.eventType === 'UPDATE' && payload.new) {
                    const row = payload.new;
                    handleAdminRealtimePacket({
                        type: 'ORDER_STATUS_UPDATE',
                        orderId: row.id,
                        status: row.status,
                        rider_name: row.rider_name || 'Alex'
                    });
                } else if (payload.eventType === 'INSERT' && payload.new) {
                    handleAdminRealtimePacket({
                        type: 'NEW_ORDER',
                        order: payload.new
                    });
                }
            } catch (e) {
                console.warn('[Admin Supabase PG Changes Note]:', e);
            }
        });

        adminSupabaseChannel.subscribe((status) => {
            console.log(`[Admin Supabase Realtime] Status: ${status}`);
            if (status === 'SUBSCRIBED') {
                adminSupabaseSubscribed = true;
                updateConnectionStatus(true, 'Live (Cloud)');
                scheduleNextOrderPoll();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                adminSupabaseSubscribed = false;
                scheduleNextOrderPoll();
            }
        });
    } catch (err) {
        console.warn('[Admin Supabase Init Note]:', err.message);
    }
}

function handleRealtimeOrderClaimed(data) {
    let o = ordersCache.find(x => x.id === data.orderId);
    if (o) {
        o.rider_name = data.adminName;
        o.delivery_assignment = {
            assigned_to: data.adminId,
            assigned_to_name: data.adminName,
            name: data.adminName,
            claimed_at: data.claimedAt,
            is_claimed: true,
            transfer: null
        };
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(data.orderId, getOrderSignature(o));
        }
    } else {
        o = {
            id: data.orderId,
            rider_name: data.adminName,
            delivery_assignment: {
                assigned_to: data.adminId,
                assigned_to_name: data.adminName,
                name: data.adminName,
                claimed_at: data.claimedAt,
                is_claimed: true,
                transfer: null
            }
        };
        ordersCache.unshift(o);
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(data.orderId, getOrderSignature(o));
        }
    }
    if (data.adminId !== currentAdminProfile?.id) {
        showToast(`🛵 ${data.adminName} accepted Order #${(data.orderId || '').replace('order_', '').slice(0, 8)}`, 'info');
    }
    filterOrders();
    if (currentDrawerOrderId === data.orderId) {
        updateDrawerDispatchCard(o);
    }
    // Trigger immediate server sync to ensure all admins see fresh delivery data
    syncOrdersLive();
    if (activeView === 'delivery' || activeView === 'earnings') {
        loadDeliveryEarnings();
    }
}

function handleRealtimeTransferRequested(data) {
    const o = ordersCache.find(x => x.id === data.orderId);
    if (o) {
        if (!o.delivery_assignment) o.delivery_assignment = {};
        o.delivery_assignment.transfer = {
            from_id: data.fromId,
            from_name: data.fromName,
            to_id: data.toId,
            to_name: data.toName,
            reason: data.reason,
            status: 'PENDING'
        };
    }
    if (data.toId === currentAdminProfile?.id) {
        showIncomingTransferAlert(data);
    }
    filterOrders();
    if (currentDrawerOrderId === data.orderId) openOrderDrawer(data.orderId);
}

function handleRealtimeTransferResolved(data) {
    const o = ordersCache.find(x => x.id === data.orderId);
    if (o) {
        if (data.accepted) {
            o.rider_name = data.toName;
            o.delivery_assignment = {
                assigned_to: data.toId,
                assigned_to_name: data.toName,
                is_claimed: true,
                transfer: null
            };
        } else if (o.delivery_assignment) {
            o.delivery_assignment.transfer = null;
        }
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(data.orderId, getOrderSignature(o));
        }
    }
    const shortId = (data.orderId || '').replace('order_', '').slice(0, 8).toUpperCase();
    showToast(`Order #${shortId} transfer ${data.accepted ? 'accepted by ' + data.toName : 'declined'}`, data.accepted ? 'success' : 'warning');
    filterOrders();
    if (currentDrawerOrderId === data.orderId) openOrderDrawer(data.orderId);
    if (data.accepted) {
        syncOrdersLive();
    }
    if (activeView === 'delivery' || activeView === 'earnings') {
        loadDeliveryEarnings();
    }
}

function handleRealtimeOrderEdited(data) {
    if (!data || !data.orderId) return;
    const idx = ordersCache.findIndex(o => o.id === data.orderId);
    if (idx >= 0 && data.order) {
        ordersCache[idx] = { ...ordersCache[idx], ...data.order };
    }
    if (currentDrawerOrderId === data.orderId) {
        viewOrderDetails(currentDrawerOrderId);
    }
    filterOrders();
    loadInventory();
    showToast(data.message || `Order #${data.orderId.replace('order_', '').toUpperCase()} was updated by dark store.`, 'info');
}

const recentAdminProcessedPackets = new Map(); // sig -> timestamp

function handleAdminRealtimePacket(data) {
    if (!data || !data.type) return;

    // Fast deduplication guard across dual transports (WebSocket + Supabase Broadcast)
    const sig = `${data.type}:${data.orderId || data.order?.id || data.productId || ''}:${data.status || data.stock_left || ''}`;
    const now = Date.now();
    const lastSeen = recentAdminProcessedPackets.get(sig);
    if (lastSeen && (now - lastSeen < 1200)) {
        return; // Skip duplicate packet already processed
    }
    recentAdminProcessedPackets.set(sig, now);
    if (recentAdminProcessedPackets.size > 200) {
        for (const [k, ts] of recentAdminProcessedPackets.entries()) {
            if (now - ts > 10000) recentAdminProcessedPackets.delete(k);
        }
    }

    if (activeView === 'payment-management' && (data.type === 'NEW_ORDER' || data.type === 'ORDER_STATUS_UPDATE' || data.type === 'PAYMENT_UPDATE')) {
        if (typeof loadPaymentManagementView === 'function') {
            loadPaymentManagementView(currentPaymentsPage);
        }
    }

    if (data.type === 'NEW_ORDER' && data.order) {
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(data.order.id, getOrderSignature(data.order));
        } else {
            knownOrderMap.set(data.order.id, data.order.status);
        }
        handleRealtimeNewOrder(data.order);
    } else if (data.type === 'ORDER_STATUS_UPDATE') {
        if (data.orderId && data.status) {
            // Guard: If this is an incoming stale revert for an order we recently updated locally, ignore
            const recent = recentOrderStatusUpdates.get(data.orderId);
            if (recent && data.status !== recent.status && (now - recent.timestamp < 30000)) {
                return;
            }
            const cachedOrder = ordersCache.find(x => x.id === data.orderId);
            if (cachedOrder) {
                cachedOrder.status = data.status;
                if (typeof getOrderSignature === 'function') {
                    knownOrderMap.set(data.orderId, getOrderSignature(cachedOrder));
                }
            } else {
                knownOrderMap.set(data.orderId, data.status);
            }
        }
        handleRealtimeStatusUpdate(data);
    } else if (data.type === 'INVENTORY_UPDATE') {
        handleRealtimeInventoryUpdate(data);
    } else if (data.type === 'CATALOG_UPDATE') {
        if (typeof loadProducts === 'function') loadProducts(true);
        if (typeof loadInventory === 'function') loadInventory(true);
    } else if (data.type === 'ORDER_CLAIMED') {
        handleRealtimeOrderClaimed(data);
    } else if (data.type === 'TRANSFER_REQUESTED') {
        handleRealtimeTransferRequested(data);
    } else if (data.type === 'TRANSFER_RESOLVED') {
        handleRealtimeTransferResolved(data);
    } else if (data.type === 'ORDER_EDITED') {
        handleRealtimeOrderEdited(data);
    } else if (data.type === 'CLIENT_LOCK_UPDATE' && data.availability) {
        const updatedHostel = data.availability.target_hostel || 'ALL';
        const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
        const myHostels = getAdminAssignedHostels();
        if (data.all_hostel_locks && typeof renderLockHostelOverview === 'function') {
            renderLockHostelOverview(data.all_hostel_locks);
        }
        if (typeof updateClientLockUI === 'function') {
            const currentActive = typeof getActiveLockHostel === 'function' ? getActiveLockHostel() : 'ALL';
            if (updatedHostel === 'ALL' || updatedHostel === currentActive) {
                updateClientLockUI(data.availability, updatedHostel);
            }
        }
        if (typeof loadClientLockState === 'function') {
            loadClientLockState();
        }
        const canSeeToast = isOwner || myHostels.length === 0 || updatedHostel === 'ALL' || myHostels.some(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === String(updatedHostel).toUpperCase().replace(/[^A-Z0-9]/g, ''));
        if (canSeeToast) {
            showToast(`Store availability updated for ${updatedHostel}: ${data.availability.lock_status || (data.availability.is_locked ? 'LOCKED' : 'AVAILABLE')}`, 'info');
        }
    } else if (data.type === 'USER_BLOCKED') {
        showToast(`User ${data.userId} blocked (${data.reason})`, 'warning');
        if (activeView === 'customers') loadCustomers();
        if (activeView === 'blacklist') loadBlacklistData();
    } else if (data.type === 'ADVERTISEMENTS_UPDATED') {
        handleRealtimeAdvertisementsUpdated(data);
    } else if (data.type === 'HOSTEL_STATUS_CHANGED') {
        if (typeof loadHostels === 'function') {
            loadHostels();
        }
    } else if (data.type === 'ORDER_DELETED') {
        if (data.orderId) {
            ordersCache = ordersCache.filter(x => x.id !== data.orderId);
            const row = document.getElementById(`order-row-${data.orderId}`);
            if (row) row.remove();
            if (currentDrawerOrderId === data.orderId && typeof closeOrderDrawer === 'function') {
                closeOrderDrawer();
            }
            if (typeof filterOrders === 'function') filterOrders();
            if (typeof updateKpiCountersFromCache === 'function') updateKpiCountersFromCache();
        }
    } else if (data.type === 'CONNECTED') {
        console.log('[Admin WS] Server confirmed connection:', data.message);
    }
}

function initRealtimeWebSocket() {
    // Start adaptive live poller (safety-net 45s when Cloud Realtime is up, 8s fallback if offline)
    if (!liveOrderPollInterval) {
        startLiveOrderPolling();
    }

    // Start Supabase Cloud Realtime Channel once cleanly for multi-dashboard cross-device live updates
    initSupabaseRealtime();

    // Skip native /ws/admin attempts on serverless hosts (e.g. Vercel) to prevent infinite reconnect storms
    if (!isLocalWebSocketHost() || wsUnavailableOnHost) {
        updateConnectionStatus(true, adminSupabaseSubscribed ? 'Live (Cloud)' : 'Live');
        return;
    }

    // If a connection is already open or in progress, do not open a duplicate!
    if (realtimeWs && (realtimeWs.readyState === WebSocket.OPEN || realtimeWs.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (wsReconnectTimer) {
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = null;
    }

    if (wsPingInterval) {
        clearInterval(wsPingInterval);
        wsPingInterval = null;
    }

    if (realtimeWs) {
        try { realtimeWs.close(); } catch (e) { }
        realtimeWs = null;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/admin?token=${encodeURIComponent(adminToken)}`;

    try {
        let opened = false;
        realtimeWs = new WebSocket(wsUrl);

        realtimeWs.onopen = () => {
            opened = true;
            wsConsecutiveFailures = 0;
            console.log('[Admin WS] ✅ Connected to live orders stream.');
            wsReconnectAttempts = 0;
            if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
            updateConnectionStatus(true, 'Live (WS)');
            scheduleNextOrderPoll();

            // Start heartbeat ping every 20s to keep connection alive
            wsPingInterval = setInterval(() => {
                if (realtimeWs && realtimeWs.readyState === WebSocket.OPEN) {
                    realtimeWs.send(JSON.stringify({ type: 'PING' }));
                }
            }, 20000);
        };

        realtimeWs.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleAdminRealtimePacket(data);
            } catch (err) {
                console.error('[Admin WS Parse Error]:', err);
            }
        };

        realtimeWs.onclose = () => {
            realtimeWs = null;
            if (wsPingInterval) { clearInterval(wsPingInterval); wsPingInterval = null; }
            if (!opened) {
                wsConsecutiveFailures++;
                if (wsConsecutiveFailures >= 2) {
                    wsUnavailableOnHost = true;
                }
            }

            // WebSocket unavailable — Cloud Realtime + Adaptive Poller handle live updates
            updateConnectionStatus(true, adminSupabaseSubscribed ? 'Live (Cloud)' : 'Live');
            scheduleNextOrderPoll();

            if (adminToken && !wsReconnectTimer && !wsUnavailableOnHost) {
                const delay = Math.min(2000 * Math.max(1, wsReconnectAttempts), 15000);
                wsReconnectAttempts = (wsReconnectAttempts + 1) % 20;
                wsReconnectTimer = setTimeout(() => {
                    wsReconnectTimer = null;
                    initRealtimeWebSocket();
                }, delay);
            }
        };

        realtimeWs.onerror = (err) => {
            try { realtimeWs.close(); } catch (e) { }
        };
    } catch (e) {
        updateConnectionStatus(true, 'Live');
    }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('online', () => {
        console.log('[Admin Network] 🌐 Reconnected to internet. Re-syncing live state...');
        showToast('🌐 Network reconnected! Syncing live data...', 'info');
        initRealtimeWebSocket();
        initSupabaseRealtime();
        syncOrdersLive();
        if (typeof loadInventory === 'function') loadInventory(true);
        if (typeof loadProducts === 'function') loadProducts(true);
    });

    window.addEventListener('offline', () => {
        console.warn('[Admin Network] ⚠️ Connection dropped.');
        updateConnectionStatus(false, 'Offline (Reconnecting...)');
        showToast('⚠️ Network connection lost. Reconnecting...', 'warning');
    });
}

// Handle real-time inventory update
function handleRealtimeInventoryUpdate(data) {
    if (!data) return;
    const { productId, stock_left, in_stock, hostel_id } = data;

    // Strict Dark-Store Hostel Isolation: Only update in-memory cache if viewing matching hostel (or ALL)
    const currentFilter = (typeof getActiveAdminHostelFilter === 'function')
        ? getActiveAdminHostelFilter(activeView === 'inventory' ? 'inventory' : 'products')
        : null;

    if (hostel_id && currentFilter) {
        const normEvent = String(hostel_id).toLowerCase().replace(/[^a-z0-9]/g, '');
        const normFilter = String(currentFilter).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normEvent !== normFilter) {
            // Event is for a different hostel dark-store; do not overwrite current view
            return;
        }
    }

    // Register recent update to guard against subsequent delayed in-flight queries
    registerRecentStockUpdate(productId, stock_left, in_stock, hostel_id);

    // Update products cache in-place
    const p = productsCache.find(x => x.id === productId);
    if (p) {
        p.stock_left = stock_left;
        p.in_stock = in_stock;
        try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) { }
    } else {
        if (typeof loadProducts === 'function') loadProducts(true);
        if (typeof loadInventory === 'function') loadInventory(true);
    }

    // Surgically recalculate total stock KPI without full network reload
    const elTotalStock = document.getElementById('dash-total-stock');
    if (elTotalStock && productsCache.length > 0) {
        const sumStock = productsCache.reduce((s, x) => s + (Number(x.stock_left) || 0), 0);
        elTotalStock.textContent = sumStock;
    }

    // Refresh current view in-place
    if (activeView === 'inventory') filterInventory();
    else if (activeView === 'products') filterProducts();
}

// Handle Incoming Order in Real-Time (Strict Single Alert Deduplication)
function handleRealtimeNewOrder(order) {
    if (!order || !order.id) return;

    // Strict Dark-Store Hostel Isolation: Store Managers ONLY receive orders for their assigned hostel(s)
    const isOwner = isPlatformOwner(currentAdminProfile);
    if (!isOwner) {
        const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
            ? currentAdminProfile.assigned_hostels
            : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
        if (myHostels.length > 0) {
            const orderHostel = order.hostel_id || (order.delivery_address && (order.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || order.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i))?.[0]) || 'BH-13';
            const normOrder = String(orderHostel).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const allowedSet = new Set(myHostels.map(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '')));
            if (!allowedSet.has(normOrder)) {
                // This order belongs to a different hostel store! Do not show to this store manager!
                return;
            }
        }
    }

    // 🛡️ DEDUPLICATION GUARD: Prevent duplicate toasts/sounds for the same order
    if (processedOrderNotificationIds.has(order.id)) {
        console.log(`[Admin WS] Skipping duplicate notification for order: ${order.id}`);
        return;
    }
    processedOrderNotificationIds.add(order.id);
    setTimeout(() => {
        processedOrderNotificationIds.delete(order.id);
    }, 30000);

    // 1. Play Synthesized Chime Audio (Single Trigger)
    playCampusChime();

    // 2. Show Animated Toast Notification
    showOrderToast(order);

    // 2b. Record Admin Order Notification in History & Native Browser Push
    recordAdminOrderNotification(order);

    // 3. Prepend to local orders cache
    ordersCache = ordersCache.filter(o => o.id !== order.id);
    ordersCache.unshift(order);

    // 4. Update KPI Metrics Dynamically
    const totalOrdersEl = document.getElementById('dash-total-orders');
    const pendingOrdersEl = document.getElementById('dash-pending-orders');
    const badgeEl = document.getElementById('nav-pending-badge');

    if (totalOrdersEl) {
        const cur = parseInt(totalOrdersEl.textContent, 10);
        totalOrdersEl.textContent = isNaN(cur) ? 1 : cur + 1;
    }
    if (pendingOrdersEl) {
        const cur = parseInt(pendingOrdersEl.textContent, 10);
        const pCount = (isNaN(cur) ? 0 : cur) + 1;
        pendingOrdersEl.textContent = pCount;
        updatePendingOrdersBadge(pCount);
    }

    // 4b. Update daily revenue for new order
    updateDailyRevenue();

    // 5. Update Current View
    if (activeView === 'dashboard') {
        const tbody = document.getElementById('dash-recent-orders-tbody');
        if (tbody) {
            const rowHtml = `
                <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer row-new-highlight" onclick="openOrderDrawer('${order.id}')" id="order-row-${order.id}">
                    <td class="p-3.5 font-bold font-mono text-[#181c1f]">#${(order.id || '').replace('order_', '').toUpperCase()}</td>
                    <td class="p-3.5 font-medium text-[#181c1f]">${formatCustomerDisplayName(order)}</td>
                    <td class="p-3.5 text-[#5c5f60] truncate max-w-[150px]">${order.item_summary || 'Campus items'}</td>
                    <td class="p-3.5 font-bold text-[#137333]">₹${order.total}</td>
                    <td class="p-3.5 text-[#5c5f60]">${order.payment_method || 'COD'}</td>
                    <td class="p-3.5">${getStatusPill(order.status)}</td>
                    <td class="p-3.5">
                        <button onclick="event.stopPropagation(); openOrderDrawer('${order.id}')" class="text-xs font-semibold text-[#3c4043] hover:underline">View</button>
                    </td>
                </tr>
            `;
            // Prepend new row
            const existingContent = tbody.innerHTML || '';
            if (existingContent.includes('No orders found') || existingContent.includes('Loading')) {
                tbody.innerHTML = rowHtml;
            } else if (typeof tbody.insertAdjacentHTML === 'function') {
                tbody.insertAdjacentHTML('afterbegin', rowHtml);
            } else {
                tbody.innerHTML = rowHtml + existingContent;
            }
        }
    } else if (activeView === 'orders') {
        filterOrders();
        const targetRow = document.getElementById(`order-row-${order.id}`);
        if (targetRow) targetRow.classList.add('row-new-highlight');
    }
}

// Handle Real-Time Status Update
function handleRealtimeStatusUpdate(data) {
    const { orderId, status } = data;
    const o = ordersCache.find(x => x.id === orderId);
    if (o) {
        o.status = status;
        if (data.payment_status) o.payment_status = data.payment_status;
        if (data.payment_method) o.payment_method = data.payment_method;
        if (typeof getOrderSignature === 'function') {
            knownOrderMap.set(orderId, getOrderSignature(o));
        }
    }

    // Update both dashboard table and orders queue table
    const pills = document.querySelectorAll(`[data-status-pill-id="${orderId}"], #order-status-pill-${orderId}, #dash-status-pill-${orderId}`);
    pills.forEach(p => { p.innerHTML = getStatusPill(status); });

    if (currentDrawerOrderId === orderId) {
        const select = document.getElementById('drawer-status-select');
        if (select) select.value = status;
        if (o) updateDrawerDispatchCard(o);
    }

    // Refresh KPI metrics in-place without jarring page reloads
    const pendingOrdersEl = document.getElementById('dash-pending-orders');
    const badgeEl = document.getElementById('nav-pending-badge');
    const pCount = ordersCache.filter(x => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(x.status)).length;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pCount;
    if (badgeEl) {
        badgeEl.textContent = pCount;
        if (pCount > 0) badgeEl.classList.remove('hidden');
        else badgeEl.classList.add('hidden');
    }
    updateDailyRevenue();

    if (activeView === 'orders') {
        filterOrders();
    }
    if (activeView === 'delivery' || activeView === 'earnings') {
        loadDeliveryEarnings();
    }
}

// Show Real-Time Toast (Single Toast per Order)
function showOrderToast(order) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastId = `toast-order-${order.id}`;
    if (document.getElementById(toastId)) {
        return; // Toast for this order is already active
    }

    const orderNumber = (order.id || '').replace('order_', '').toUpperCase();

    const toastHtml = `
        <div id="${toastId}" class="toast-card p-4 flex flex-col gap-2">
            <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5 text-xs font-extrabold text-[#10B981]">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
                    ⚡ NEW CAMPUS ORDER!
                </span>
                <span class="text-[11px] font-mono font-bold text-[#5c5f60]">#${orderNumber}</span>
            </div>
            <div class="text-xs text-[#181c1f]">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm text-[#181c1f]">${escapeHtml(order.customer_name || 'Customer')}</span>
                    <span class="font-black text-sm text-[#137333]">₹${order.total}</span>
                </div>
                <p class="text-[11px] text-[#5c5f60] mt-0.5">📍 ${escapeHtml(order.delivery_address || 'Not provided')}</p>
                <p class="text-[10px] text-[#74777a] italic mt-1 truncate">🛍️ ${escapeHtml(order.item_summary || 'Campus essentials')}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-[#DADCE0] mt-1">
                <button onclick="openOrderDrawer('${order.id}'); dismissToast('${toastId}')" class="text-xs bg-[#3c4043] hover:bg-[#262a2d] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm">
                    <span class="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Manage Order</span>
                </button>
                <button onclick="dismissToast('${toastId}')" class="text-xs font-semibold text-[#74777a] hover:text-[#181c1f] px-2 py-1">
                    Dismiss
                </button>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);

    // Trigger smooth enter animation
    setTimeout(() => {
        if (toastEl) toastEl.classList.add('show');
    }, 20);

    // Auto-dismiss after 9 seconds
    setTimeout(() => {
        dismissToast(toastId);
    }, 9000);
}

function dismissToast(toastId) {
    const toastEl = document.getElementById(toastId);
    if (!toastEl) return;
    toastEl.classList.remove('show');
    toastEl.classList.add('hide');
    setTimeout(() => {
        toastEl.remove();
    }, 400);
}

// ============================================================
// ADMIN INSTANT ORDER NOTIFICATIONS & HISTORY
// ============================================================
function getStoredAdminNotifications() {
    try {
        const raw = localStorage.getItem('lpuquick_admin_notifications');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveStoredAdminNotifications(list) {
    try {
        localStorage.setItem('lpuquick_admin_notifications', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
}

function recordAdminOrderNotification(order) {
    if (!order || !order.id) return;
    const notifs = getStoredAdminNotifications();
    const orderNumber = (order.id || '').replace('order_', '').toUpperCase();
    const orderHostel = order.hostel_id || (order.delivery_address && (order.delivery_address.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || order.delivery_address.match(/(BH|GH)[-\s]?(\d+)/i))?.[0]) || 'Campus';
    const roomMatch = order.delivery_address ? (order.delivery_address.match(/Room\s*([a-zA-Z0-9\-]+)/i) || order.delivery_address.match(/Flat\s*([a-zA-Z0-9\-]+)/i)) : null;
    const roomNumber = roomMatch ? roomMatch[1] : '';

    const newNotif = {
        id: `notif_${order.id}`,
        order_id: order.id,
        order_number: orderNumber,
        customer_name: order.customer_name || 'Student',
        customer_phone: order.customer_phone || '',
        hostel: orderHostel,
        room: roomNumber,
        total: order.total || 0,
        item_summary: order.item_summary || (Array.isArray(order.items) ? order.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : 'Campus items'),
        timestamp: Date.now(),
        read: false
    };

    // Prepend without duplicate order IDs
    const filtered = notifs.filter(n => n.order_id !== order.id);
    filtered.unshift(newNotif);
    saveStoredAdminNotifications(filtered);

    // Update UI badge and panel
    updateAdminNotificationsUI();

    // Trigger Native Browser Web Notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
            const notifTitle = `⚡ New Order #${orderNumber} (₹${order.total})`;
            const notifBody = `${order.customer_name || 'Student'} • ${orderHostel} ${roomNumber ? 'Rm ' + roomNumber : ''}\n${newNotif.item_summary}`;
            const n = new Notification(notifTitle, {
                body: notifBody,
                icon: '/img/logo.png',
                badge: '/img/logo.png',
                tag: order.id,
                renotify: true
            });
            n.onclick = () => {
                window.focus();
                switchView('orders');
                openOrderDrawer(order.id);
                n.close();
            };
        } catch (nErr) {
            console.warn('[Native Browser Notif Warning]:', nErr.message);
        }
    }
}

function updateAdminNotificationsUI() {
    const notifs = getStoredAdminNotifications();
    const unreadCount = notifs.filter(n => !n.read).length;

    const badgeEl = document.getElementById('admin-notifs-badge');
    if (badgeEl) {
        if (unreadCount > 0) {
            badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badgeEl.classList.remove('hidden');
            badgeEl.classList.add('flex');
        } else {
            badgeEl.classList.add('hidden');
            badgeEl.classList.remove('flex');
        }
    }

    const panelCountEl = document.getElementById('admin-notifs-panel-count');
    if (panelCountEl) {
        panelCountEl.textContent = `${unreadCount} new`;
    }

    renderAdminNotificationsList(notifs);
}

function renderAdminNotificationsList(notifs = getStoredAdminNotifications()) {
    const listEl = document.getElementById('admin-notifs-list');
    if (!listEl) return;

    if (!notifs || notifs.length === 0) {
        listEl.innerHTML = `
            <div class="p-6 text-center text-[#5c5f60] text-xs font-medium" id="admin-notifs-empty">
                🔔 No new order notifications. When students place orders in your assigned hostels, alerts will chime and display here instantly.
            </div>
        `;
        return;
    }

    listEl.innerHTML = notifs.map(n => {
        const timeAgo = formatTimeAgo(n.timestamp);
        const unreadClass = !n.read ? 'bg-emerald-50/60 border-l-4 border-l-emerald-600 font-semibold' : 'hover:bg-slate-50';
        return `
            <div onclick="openNotificationOrder('${n.order_id}')" class="p-3.5 transition-all cursor-pointer ${unreadClass} flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 rounded-full ${!n.read ? 'bg-emerald-600 animate-pulse' : 'bg-slate-300'}"></span>
                        <span class="font-bold text-xs text-[#181c1f]">#${n.order_number}</span>
                        <span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-50 text-[#0066cc] border border-blue-200">${escapeHtml(n.hostel)}</span>
                    </div>
                    <span class="font-black text-xs text-[#137333]">₹${n.total}</span>
                </div>
                <div class="text-[11px] text-[#5c5f60] flex items-center justify-between">
                    <span>${escapeHtml(n.customer_name)}${n.room ? ' • Room ' + escapeHtml(n.room) : ''}</span>
                    <span class="text-[10px] text-slate-400 font-medium">${timeAgo}</span>
                </div>
                <p class="text-[10px] text-slate-500 line-clamp-1 italic">🛍️ ${escapeHtml(n.item_summary)}</p>
            </div>
        `;
    }).join('');
}

function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function toggleAdminNotificationsPanel() {
    const panel = document.getElementById('admin-notifs-panel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !isHidden);
    if (isHidden) {
        updateAdminNotificationsUI();
    }
}
window.toggleAdminNotificationsPanel = toggleAdminNotificationsPanel;

// Close notifications panel on outside click
document.addEventListener('click', (e) => {
    const wrap = document.getElementById('admin-notifs-wrap');
    const panel = document.getElementById('admin-notifs-panel');
    if (wrap && panel && !wrap.contains(e.target) && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
    }
});

async function syncAdminNotificationsFromServer() {
    const token = getAdminAuthToken();
    if (!token) return;
    try {
        const res = await fetchWithTimeout('/api/admin/notifications', {
            headers: getAuthHeaders()
        }, 6000);
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.notifications)) {
                // Merge with existing local store
                const existing = getStoredAdminNotifications();
                const existingMap = new Map(existing.map(n => [n.order_id, n]));
                data.notifications.forEach(n => {
                    if (!existingMap.has(n.order_id)) {
                        existingMap.set(n.order_id, n);
                    } else {
                        // Keep read status synced
                        const item = existingMap.get(n.order_id);
                        if (n.read) item.read = true;
                    }
                });
                const merged = Array.from(existingMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                saveStoredAdminNotifications(merged);
                updateAdminNotificationsUI();
            }
        }
    } catch (e) {
        console.warn('[Sync Admin Notifications Note]:', e.message);
    }
}
window.syncAdminNotificationsFromServer = syncAdminNotificationsFromServer;

function markAllAdminNotificationsRead() {
    const notifs = getStoredAdminNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    saveStoredAdminNotifications(updated);
    updateAdminNotificationsUI();
    showToast('All notifications marked as read', 'info');

    fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ all: true })
    }).catch(() => {});
}
window.markAllAdminNotificationsRead = markAllAdminNotificationsRead;

function openNotificationOrder(orderId) {
    const notifs = getStoredAdminNotifications();
    const updated = notifs.map(n => n.order_id === orderId ? { ...n, read: true } : n);
    saveStoredAdminNotifications(updated);
    updateAdminNotificationsUI();

    const panel = document.getElementById('admin-notifs-panel');
    if (panel) panel.classList.add('hidden');

    fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ order_id: orderId })
    }).catch(() => {});

    switchView('orders');
    openOrderDrawer(orderId);
}
window.openNotificationOrder = openNotificationOrder;

function checkAutoOpenOrderFromUrl() {
    try {
        let orderId = null;
        if (window.location.search) {
            orderId = new URLSearchParams(window.location.search).get('orderId');
        }
        if (!orderId && window.location.hash.includes('orderId=')) {
            const queryPart = window.location.hash.split('?')[1];
            if (queryPart) {
                orderId = new URLSearchParams(queryPart).get('orderId');
            }
        }
        if (orderId) {
            switchView('orders');
            setTimeout(() => openOrderDrawer(orderId), 500);
        }
    } catch (e) {}
}
window.checkAutoOpenOrderFromUrl = checkAutoOpenOrderFromUrl;

// ================= 10. AUTHENTICATION (STITCH SIGN IN) =================
function showLoginModal() {
    const authScreen = document.getElementById('admin-auth-screen');
    if (authScreen) authScreen.classList.remove('hidden');
}

function hideLoginModal() {
    const authScreen = document.getElementById('admin-auth-screen');
    if (authScreen) authScreen.classList.add('hidden');
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('login-password');
    const toggleIcon = document.getElementById('password-toggle-icon');
    if (!passInput || !toggleIcon) return;

    if (passInput.type === 'password') {
        passInput.type = 'text';
        toggleIcon.textContent = 'visibility_off';
    } else {
        passInput.type = 'password';
        toggleIcon.textContent = 'visibility';
    }
}

async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const email = (document.getElementById('login-email')?.value || '').trim();
    const password = document.getElementById('login-password')?.value || '';
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    const errorBox = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const submitBtn = document.getElementById('btn-login-submit');

    if (!email || !password) {
        if (errorText) errorText.textContent = 'Please enter both administrator email and password.';
        if (errorBox) errorBox.classList.remove('hidden');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="inline-block animate-spin mr-2">⟳</span>
            <span>Verifying Admin...</span>
        `;
    }

    try {
        const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        let data;
        try {
            data = await res.json();
        } catch (jsonErr) {
            data = { success: false, error: 'Server error (' + res.status + '). Please try again.' };
        }

        if (data.success && data.token) {
            adminToken = data.token;
            localStorage.setItem('lpuquick_admin_token', adminToken);
            sessionStorage.setItem('lpuquick_admin_token', adminToken);

            // Clear any error states
            if (errorBox) errorBox.classList.add('hidden');
            if (errorText) errorText.textContent = '';

            // Welcome chime and UI unlock
            try {
                getAudioContext();
                playCampusChime();
            } catch (aErr) { }

            hideLoginModal();
            if (typeof loadHostels === 'function') {
                loadHostels().catch(() => { });
            }
            const initialView = applyAdminRolePermissions(data.admin);
            switchView(initialView);
            initRealtimeWebSocket();
            syncAdminNotificationsFromServer().catch(() => {});
            checkAutoOpenOrderFromUrl();
        } else {
            if (errorText) errorText.textContent = data.error || 'Invalid admin credentials';
            if (errorBox) errorBox.classList.remove('hidden');
        }
    } catch (err) {
        if (errorText) errorText.textContent = 'Network/Server connection error: ' + err.message;
        if (errorBox) errorBox.classList.remove('hidden');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <span>Sign In to Admin Hub</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
            `;
        }
    }
}


function logoutAdmin() {
    localStorage.removeItem('lpuquick_admin_token');
    sessionStorage.removeItem('lpuquick_admin_token');
    localStorage.removeItem('lpuquick_admin_profile');
    adminToken = '';
    currentAdminProfile = null;
    if (realtimeWs) {
        try { realtimeWs.close(); } catch (e) { }
    }
    showLoginModal();
}

// General purpose toast notification utility
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Prevent duplicate toast spam if exact message is already displayed
    const existingToasts = container.querySelectorAll('.toast-card span.text-xs');
    for (const t of existingToasts) {
        if (t.textContent === message) return;
    }

    const id = `toast-gen-${Date.now()}`;
    const colors = {
        success: 'border-[#10B981] bg-[#ecfdf5]',
        error: 'border-[#ba1a1a] bg-[#fce8e6]',
        info: 'border-[#3c4043] bg-[#f7fafd]',
        warning: 'border-[#f59e0b] bg-[#fef3c7]'
    };
    const iconMap = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning'
    };

    const html = `
        <div id="${id}" class="toast-card p-3 border-l-4 ${colors[type] || colors.info} flex items-center justify-between gap-3 shadow-md rounded-r-lg">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">${iconMap[type] || 'info'}</span>
                <span class="text-xs font-semibold text-[#181c1f]">${message}</span>
            </div>
            <button onclick="dismissToast('${id}')" class="text-[#74777a] hover:text-[#181c1f] text-xs font-bold p-1">✕</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    setTimeout(() => { if (el) el.classList.add('show'); }, 20);
    setTimeout(() => { dismissToast(id); }, 5000);
}

// ================= 9. STAFF & ADMIN TEAM MANAGEMENT (OWNER ONLY) =================
let staffCache = [];

async function loadStaffList() {
    const tbody = document.getElementById('staff-table-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#5c5f60] animate-pulse">Loading admin team members...</td></tr>`;
    }

    try {
        const res = await fetch('/api/admin/staff', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!data.success) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-rose-600">Access denied or failed to load staff: ${data.error || 'Unknown'}</td></tr>`;
            return;
        }

        staffCache = data.staff || [];

        // Update stats
        const total = staffCache.length;
        const storeCount = staffCache.filter(s => s.roles.includes('store_manager') || s.is_owner).length;
        const invCount = staffCache.filter(s => s.roles.includes('inventory_manager') || s.is_owner).length;
        const riderCount = staffCache.filter(s => s.roles.includes('delivery_person') || s.is_owner).length;

        const totalEl = document.getElementById('stat-staff-total');
        const storeEl = document.getElementById('stat-staff-store');
        const invEl = document.getElementById('stat-staff-inventory');
        const ridersEl = document.getElementById('stat-staff-riders');

        if (totalEl) totalEl.textContent = total;
        if (storeEl) storeEl.textContent = storeCount;
        if (invEl) invEl.textContent = invCount;
        if (ridersEl) ridersEl.textContent = riderCount;

        renderStaffTable(staffCache);
    } catch (err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-rose-600">Connection error loading staff members.</td></tr>`;
    }
}

function renderStaffTable(list) {
    const tbody = document.getElementById('staff-table-tbody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-[#5c5f60]">No admin members found.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(s => {
        const isOwner = s.is_owner;
        const isActive = s.account_status === 'ACTIVE';

        const roleBadges = [];
        if (isOwner) {
            roleBadges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">👑 Owner</span>`);
        }
        if (s.roles.includes('store_manager')) {
            roleBadges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🏢 Store Mgr</span>`);
        }
        if (s.roles.includes('inventory_manager')) {
            roleBadges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">📦 Inventory</span>`);
        }
        if (s.roles.includes('delivery_person')) {
            roleBadges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🛵 Delivery</span>`);
        }
        if (s.roles.includes('cook') || s.roles.includes('food_department') || s.roles.includes('food')) {
            roleBadges.push(`<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">👨‍🍳 Food Dept</span>`);
        }

        let hostelBadge = '';
        const assignedList = Array.isArray(s.assigned_hostels) && s.assigned_hostels.length > 0
            ? s.assigned_hostels
            : (s.assigned_hostel_id ? [s.assigned_hostel_id] : []);
        if (isOwner) {
            hostelBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">🌐 All Hostels (Master)</span>`;
        } else if (assignedList.length > 0) {
            hostelBadge = assignedList.map(h =>
                `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066cc] border border-blue-200">🏢 ${escapeHtml(h)}</span>`
            ).join(' ');
        } else {
            hostelBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">🌐 All Hostels</span>`;
        }

        const lastActiveStr = s.last_login
            ? new Date(s.last_login).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '<span class="text-[#74777a] italic">Never</span>';

        const isStaffDuty = Boolean(s.is_on_duty || s.duty_status === 'ON_DUTY');
        const dutyToggleBtn = `
            <button onclick="toggleEmployeeDuty('${s.id}', ${!isStaffDuty})" 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-xs cursor-pointer ${isStaffDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}" 
                title="Click to toggle On Duty (Online) / Off Duty (Offline)">
                <span class="w-1.5 h-1.5 rounded-full ${isStaffDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}"></span>
                <span>${isStaffDuty ? '🟢 On Duty' : '⚪ Off Duty'}</span>
            </button>`;
        const statusBadge = isActive
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Active</span>`
            : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Disabled</span>`;

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4 flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full ${isOwner ? 'bg-amber-500' : 'bg-[#1a73e8]'} text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ${isOwner ? '👑' : (s.name ? s.name[0].toUpperCase() : 'A')}
                    </div>
                    <div>
                        <p class="font-bold text-xs text-[#181c1f] flex items-center gap-1.5">
                            <span>${s.name}</span>
                            ${isOwner ? '<span class="text-[10px] font-extrabold text-amber-700">(Super Admin)</span>' : ''}
                        </p>
                        <p class="text-[11px] text-[#5c5f60] font-mono">${s.email}</p>
                    </div>
                </td>
                <td class="p-4 text-xs font-medium text-[#181c1f]">${s.phone || '<span class="text-[#74777a] italic">None</span>'}</td>
                <td class="p-4">
                    <div class="flex flex-wrap gap-1.5">
                        ${roleBadges.join('')}
                    </div>
                </td>
                <td class="p-4">${hostelBadge}</td>
                <td class="p-4">${dutyToggleBtn}</td>
                <td class="p-4 text-xs text-[#5c5f60]">${lastActiveStr}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="openStaffModal('${s.id}')" class="px-2.5 py-1.5 rounded-lg border border-[#DADCE0] hover:bg-[#f1f4f7] text-[#181c1f] font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm">
                            <span class="material-symbols-outlined text-sm">edit</span>
                            <span>Edit</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


function updateStaffHostelCountBadge() {
    const badge = document.getElementById('staff-hostel-count-badge');
    const checked = getSelectedStaffHostels();
    const legacySelect = document.getElementById('form-staff-hostel');
    if (legacySelect) {
        legacySelect.value = checked[0] || '';
    }
    if (!badge) return;
    if (checked.length === 0) {
        badge.textContent = 'All Hostels (General Admin)';
        badge.className = 'text-[10px] text-gray-600 font-bold bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200';
    } else if (checked.length === 1) {
        badge.textContent = `1 Hostel: ${checked[0]}`;
        badge.className = 'text-[10px] text-[#1a73e8] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200';
    } else {
        badge.textContent = `${checked.length} Hostels Assigned`;
        badge.className = 'text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200';
    }
}

function getSelectedStaffHostels() {
    const container = document.getElementById('staff-hostels-checklist');
    if (!container) {
        const legacy = document.getElementById('form-staff-hostel')?.value;
        return legacy ? [legacy] : [];
    }
    const checked = Array.from(container.querySelectorAll('input[name="staff-assigned-hostels"]:checked'))
        .map(cb => cb.value.trim().toUpperCase())
        .filter(Boolean);
    return checked;
}

function selectAllStaffHostels(selectAll = true) {
    const container = document.getElementById('staff-hostels-checklist');
    if (!container) return;
    container.querySelectorAll('input[name="staff-assigned-hostels"]').forEach(cb => {
        cb.checked = Boolean(selectAll);
    });
    updateStaffHostelCountBadge();
}

function populateStaffHostelsChecklist(selectedHostels = []) {
    const container = document.getElementById('staff-hostels-checklist');
    const legacySelect = document.getElementById('form-staff-hostel');

    let normalizedSelected = [];
    if (Array.isArray(selectedHostels)) {
        normalizedSelected = selectedHostels.map(h => String(h).trim().toUpperCase()).filter(Boolean);
    } else if (typeof selectedHostels === 'string' && selectedHostels.trim()) {
        normalizedSelected = [selectedHostels.trim().toUpperCase()];
    }

    if (legacySelect) {
        legacySelect.innerHTML = '<option value="">🏢 None / All Hostels (General Admin)</option>';
    }

    const activeHostels = (hostelsCache || []).slice().sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));

    normalizedSelected.forEach(sel => {
        if (sel && !activeHostels.some(h => h.id.toUpperCase() === sel)) {
            activeHostels.push({ id: sel, name: sel, status: 'INACTIVE' });
        }
    });

    if (legacySelect) {
        activeHostels.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.id;
            opt.textContent = `🏢 ${h.name || h.id} (${h.id})${h.status === 'INACTIVE' ? ' [Inactive]' : ''}`;
            legacySelect.appendChild(opt);
        });
        legacySelect.value = normalizedSelected[0] || '';
    }

    if (container) {
        container.innerHTML = activeHostels.map(h => {
            const isChecked = normalizedSelected.includes(h.id.toUpperCase());
            const isInactive = h.status === 'INACTIVE';
            return `
                <label class="flex items-center gap-2 p-2 rounded-lg border ${isChecked ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-white'} hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all text-xs">
                    <input type="checkbox" name="staff-assigned-hostels" value="${escapeHtml(h.id)}" ${isChecked ? 'checked' : ''} onchange="updateStaffHostelCountBadge()" class="rounded text-[#1a73e8] focus:ring-[#1a73e8] w-4 h-4 shrink-0">
                    <div class="min-w-0 flex-1 truncate">
                        <span class="font-bold text-slate-800">${escapeHtml(h.name || h.id)}</span>
                        ${isInactive ? '<span class="text-[9px] text-rose-500 font-bold ml-1">[Inactive]</span>' : ''}
                    </div>
                </label>
            `;
        }).join('');
    }

    updateStaffHostelCountBadge();
}

window.selectAllStaffHostels = selectAllStaffHostels;
window.updateStaffHostelCountBadge = updateStaffHostelCountBadge;
window.populateStaffHostelsChecklist = populateStaffHostelsChecklist;
window.getSelectedStaffHostels = getSelectedStaffHostels;

function openStaffModal(staffId = null) {
    const modal = document.getElementById('modal-staff');
    if (!modal) return;

    const titleEl = document.getElementById('modal-staff-title');
    const idInput = document.getElementById('form-staff-id');
    const nameInput = document.getElementById('form-staff-name');
    const emailInput = document.getElementById('form-staff-email');
    const phoneInput = document.getElementById('form-staff-phone');
    const passInput = document.getElementById('form-staff-password');
    const passHint = document.getElementById('hint-staff-password');
    const errBox = document.getElementById('staff-form-error');
    const delBtn = document.getElementById('btn-delete-staff');

    if (errBox) errBox.classList.add('hidden');

    if (staffId) {
        const staff = (staffCache || []).find(s => s.id === staffId) || (employeesCache || []).find(s => s.id === staffId);
        if (!staff) return;

        if (titleEl) titleEl.textContent = 'Edit Employee / Staff Member';
        if (idInput) idInput.value = staff.id;
        if (nameInput) nameInput.value = staff.name;
        if (emailInput) {
            emailInput.value = staff.email;
            emailInput.disabled = true; // Email is primary identifier
        }
        if (phoneInput) phoneInput.value = staff.phone || '';
        if (passInput) {
            passInput.value = '';
            passInput.required = false;
        }
        if (passHint) passHint.classList.remove('hidden');

        document.getElementById('role-store-manager').checked = (staff.roles || []).includes('store_manager');
        document.getElementById('role-inventory-manager').checked = (staff.roles || []).includes('inventory_manager');
        document.getElementById('role-delivery-person').checked = (staff.roles || []).includes('delivery_person') || Boolean(staff.is_delivery_boy);
        const cookCheckbox = document.getElementById('role-cook');
        if (cookCheckbox) cookCheckbox.checked = (staff.roles || []).includes('cook') || (staff.roles || []).includes('food_department');
        const permGroceryCheckbox = document.getElementById('perm-manage-grocery');
        if (permGroceryCheckbox) permGroceryCheckbox.checked = Boolean(staff.permissions && staff.permissions.can_manage_grocery_inventory);

        const isOnDuty = Boolean(staff.is_on_duty || staff.duty_status === 'ON_DUTY' || (staff.delivery_data && staff.delivery_data.duty_status === 'ON_DUTY'));
        const onRadio = document.getElementById('staff-duty-on');
        const offRadio = document.getElementById('staff-duty-off');
        if (onRadio) onRadio.checked = isOnDuty;
        if (offRadio) offRadio.checked = !isOnDuty;

        const assignedList = Array.isArray(staff.assigned_hostels) && staff.assigned_hostels.length > 0
            ? staff.assigned_hostels
            : (staff.assigned_hostel_id ? [staff.assigned_hostel_id] : []);
        populateStaffHostelsChecklist(assignedList);

        if (delBtn) {
            delBtn.classList.toggle('hidden', staff.is_owner);
        }
    } else {
        if (titleEl) titleEl.textContent = 'Add New Employee / Staff Member';
        if (idInput) idInput.value = '';
        if (nameInput) nameInput.value = '';
        if (emailInput) {
            emailInput.value = '';
            emailInput.disabled = false;
        }
        if (phoneInput) phoneInput.value = '';
        if (passInput) {
            passInput.value = '';
            passInput.required = true;
        }
        if (passHint) passHint.classList.add('hidden');

        document.getElementById('role-store-manager').checked = true;
        document.getElementById('role-inventory-manager').checked = false;
        document.getElementById('role-delivery-person').checked = false;
        if (document.getElementById('role-cook')) document.getElementById('role-cook').checked = false;
        if (document.getElementById('perm-manage-grocery')) document.getElementById('perm-manage-grocery').checked = false;

        const onRadioNew = document.getElementById('staff-duty-on');
        const offRadioNew = document.getElementById('staff-duty-off');
        if (onRadioNew) onRadioNew.checked = true;
        if (offRadioNew) offRadioNew.checked = false;

        populateStaffHostelsChecklist([]);

        if (delBtn) delBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function closeStaffModal() {
    const modal = document.getElementById('modal-staff');
    if (modal) modal.classList.add('hidden');
}

async function submitStaffForm(e) {
    e.preventDefault();
    const id = document.getElementById('form-staff-id').value;
    const name = document.getElementById('form-staff-name').value.trim();
    const email = document.getElementById('form-staff-email').value.trim();
    const phone = document.getElementById('form-staff-phone').value.trim();
    const password = document.getElementById('form-staff-password').value;
    const selectedHostels = typeof getSelectedStaffHostels === 'function' ? getSelectedStaffHostels() : [];
    const assignedHostelId = selectedHostels[0] || (document.getElementById('form-staff-hostel')?.value || null);
    const errBox = document.getElementById('staff-form-error');

    const roles = [];
    if (document.getElementById('role-store-manager').checked) roles.push('store_manager');
    if (document.getElementById('role-inventory-manager').checked) roles.push('inventory_manager');
    if (document.getElementById('role-delivery-person').checked) roles.push('delivery_person');
    if (document.getElementById('role-cook')?.checked) {
        roles.push('cook');
        roles.push('food_department');
    }
    const permissions = {
        can_manage_grocery_inventory: Boolean(document.getElementById('perm-manage-grocery')?.checked)
    };

    const isOnDuty = document.getElementById('staff-duty-on')?.checked ?? true;
    const dutyStatus = isOnDuty ? 'ON_DUTY' : 'OFF_DUTY';

    if (roles.length === 0) {
        if (errBox) {
            errBox.textContent = 'Please select at least one role/permission level.';
            errBox.classList.remove('hidden');
        }
        return;
    }

    const saveBtn = document.getElementById('btn-save-staff');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">sync</span> Saving...`;
    }

    try {
        let res;
        if (id) {
            const payload = {
                name,
                phone,
                roles,
                permissions,
                assigned_hostel_id: assignedHostelId,
                assigned_hostels: selectedHostels,
                is_on_duty: isOnDuty,
                duty_status: dutyStatus
            };
            if (password) payload.password = password;
            res = await fetch(`/api/admin/staff/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/admin/staff', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    roles,
                    permissions,
                    assigned_hostel_id: assignedHostelId,
                    assigned_hostels: selectedHostels,
                    is_on_duty: isOnDuty,
                    duty_status: dutyStatus
                })
            });
        }

        const data = await res.json();
        if (data.success) {
            closeStaffModal();
            showToast(id ? 'Employee / Admin updated successfully' : 'Employee / Admin created successfully', 'success');
            await loadStaffList();
            if (typeof loadEmployeesList === 'function') {
                await loadEmployeesList();
            }
        } else {
            if (errBox) {
                errBox.textContent = data.error || 'Failed to save staff member';
                errBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (errBox) {
            errBox.textContent = 'Network error: ' + err.message;
            errBox.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<span>Save Admin</span>`;
        }
    }
}

async function handleDeleteStaff() {
    const id = document.getElementById('form-staff-id').value;
    if (!id) return;

    if (!confirm('Are you sure you want to remove this employee / admin member? Their access will be revoked immediately.')) {
        return;
    }

    try {
        const res = await fetch(`/api/admin/staff/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            closeStaffModal();
            showToast('Employee / Admin removed successfully', 'info');
            await loadStaffList();
            if (typeof loadEmployeesList === 'function') {
                await loadEmployeesList();
            }
        } else {
            alert(data.error || 'Failed to delete staff member');
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}

// ================= 9b. EMPLOYEES & DARK STORE OPERATIONAL ROSTER =================
let employeesCache = [];
let employeesFullData = null;

async function loadEmployeesList() {
    const tbody = document.getElementById('employees-table-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-[#5c5f60] animate-pulse">Loading employees roster...</td></tr>`;
    }

    try {
        const res = await fetch('/api/admin/employees', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!data.success) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-rose-600">Failed to load employees: ${escapeHtml(data.error || 'Unknown error')}</td></tr>`;
            return;
        }

        employeesFullData = data;
        // ONLY show registered staff — NO auto-tracked campus runners
        employeesCache = data.registered_staff || [];

        // Also populate staffCache so Edit modal works from Employees view
        staffCache = employeesCache;

        // Always refresh hostelsCache so hostel status changes reflect immediately
        try {
            const hRes = await fetch('/api/admin/hostels', { headers: getAuthHeaders() });
            const hData = await hRes.json();
            if (hData.success && Array.isArray(hData.hostels)) {
                hostelsCache = hData.hostels;
            }
        } catch (e) { /* ignore */ }

        // Calculate stats from registered staff only
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('stat-emp-total', employeesCache.length);
        el('stat-emp-managers', employeesCache.filter(e => e.is_store_manager).length);
        el('stat-emp-riders', employeesCache.filter(e => e.is_delivery_boy).length);
        const coveredH = new Set();
        employeesCache.forEach(e => {
            if (Array.isArray(e.assigned_hostels) && e.assigned_hostels.length > 0) {
                e.assigned_hostels.forEach(h => { if (h) coveredH.add(h); });
            } else if (e.assigned_hostel_id) {
                coveredH.add(e.assigned_hostel_id);
            }
        });
        el('stat-emp-hostels', coveredH.size);
        el('stat-emp-onduty', employeesCache.filter(e => e.delivery_data?.duty_status === 'ON_DUTY').length);

        // Populate hostel filter dropdown with ONLY active hostels (active by me)
        const hostelSelect = document.getElementById('emp-filter-hostel');
        if (hostelSelect) {
            const currentVal = hostelSelect.value;
            hostelSelect.innerHTML = '<option value="">🏢 All Stores &amp; Active Hostels</option>';
            const activeHostels = (hostelsCache || []).filter(h => h.status === 'ACTIVE' || h.status === 'active');
            activeHostels.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h.id;
                opt.textContent = `🏢 ${h.name || h.id}`;
                hostelSelect.appendChild(opt);
            });
            if (currentVal && Array.from(hostelSelect.options).some(o => o.value === currentVal)) {
                hostelSelect.value = currentVal;
            }
        }

        renderEmployeesTable(employeesCache);
    } catch (err) {
        console.error('[Employees Load Error]:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-rose-600">Connection error loading employees data.</td></tr>`;
    }
}

function renderEmployeesTable(list) {
    const tbody = document.getElementById('employees-table-tbody');
    if (!tbody) return;

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-[#5c5f60]">No employees found matching your criteria.</td></tr>`;
        const cntEl = document.getElementById('emp-count-display');
        if (cntEl) cntEl.textContent = 'Showing 0 employees';
        return;
    }

    tbody.innerHTML = list.map(emp => {
        const isOwner = emp.is_owner;
        const isActive = emp.account_status === 'ACTIVE';

        // Avatar
        const avatarBg = isOwner ? 'bg-amber-500' : 'bg-indigo-600';
        const avatarIcon = isOwner ? '👑' : (emp.name ? emp.name[0].toUpperCase() : '?');

        // Type badge
        let typeBadge = '';
        if (isOwner) {
            typeBadge = '<span class="text-[10px] font-extrabold text-amber-700">(Owner)</span>';
        }

        // Role badges
        const roleBadges = [];
        if (isOwner) roleBadges.push('<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">👑 Owner</span>');
        if ((emp.roles || []).includes('store_manager')) roleBadges.push('<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🏢 Store Mgr</span>');
        if ((emp.roles || []).includes('inventory_manager')) roleBadges.push('<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">📦 Inventory</span>');
        if ((emp.roles || []).includes('delivery_person') || emp.is_delivery_boy) roleBadges.push('<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🛵 Delivery</span>');
        if ((emp.roles || []).includes('cook') || (emp.roles || []).includes('food_department') || (emp.roles || []).includes('food')) roleBadges.push('<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">👨‍🍳 Food Dept</span>');

        // Hostel badge
        let hostelBadge = '';
        const assignedList = Array.isArray(emp.assigned_hostels) && emp.assigned_hostels.length > 0
            ? emp.assigned_hostels
            : (emp.assigned_hostel_id ? [emp.assigned_hostel_id] : []);
        if (isOwner) {
            hostelBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">🌐 All Hostels (Master)</span>';
        } else if (assignedList.length > 0) {
            hostelBadge = assignedList.map(h =>
                `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0066cc] border border-blue-200">🏢 ${escapeHtml(h)}</span>`
            ).join(' ');
        } else {
            hostelBadge = '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">General Ops</span>';
        }

        // Delivery operations data
        let deliveryCell = '<span class="text-[#74777a] italic text-[11px]">N/A</span>';
        if (emp.is_delivery_boy && emp.delivery_data) {
            const dd = emp.delivery_data;
            const dutyIcon = dd.duty_status === 'ON_DUTY' ? '🟢' : '⚪';
            const dutyLabel = dd.duty_status === 'ON_DUTY' ? 'On Duty' : 'Off Duty';
            const dutyClass = dd.duty_status === 'ON_DUTY' ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 bg-gray-50';
            deliveryCell = `
                <div class="space-y-1.5">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${dutyClass} border">${dutyIcon} ${dutyLabel}</span>
                        ${dd.active_deliveries > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">🚀 ${dd.active_deliveries} Active</span>` : ''}
                    </div>
                    <div class="flex items-center gap-3 text-[11px]">
                        <span class="font-semibold text-[#181c1f]">✅ ${dd.total_deliveries} deliveries</span>
                        <span class="font-bold text-emerald-700">₹${(dd.total_earnings || 0).toFixed(0)}</span>
                    </div>
                    <div class="text-[10px] text-[#5c5f60]">
                        Today: ${dd.today_deliveries || 0} orders (₹${(dd.today_earnings || 0).toFixed(0)}) · Rate: ₹${dd.rate_per_order}/order
                    </div>
                </div>`;
        }

        // Status badge
        const isOnDuty = Boolean(emp.is_on_duty || emp.duty_status === 'ON_DUTY' || (emp.delivery_data && emp.delivery_data.duty_status === 'ON_DUTY'));
        const dutyToggleBtn = `
            <button onclick="toggleEmployeeDuty('${emp.id}', ${!isOnDuty})" 
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs cursor-pointer ${isOnDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}" 
                title="Click to toggle: currently ${isOnDuty ? 'ON DUTY (Online)' : 'OFF DUTY (Offline)'}">
                <span class="w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}"></span>
                <span>${isOnDuty ? '🟢 On Duty' : '⚪ Off Duty'}</span>
            </button>`;
        const statusBadge = isActive
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Active</span>'
            : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Disabled</span>';

        // Actions — Edit + History + Remove (no Remove for owner)
        const editBtn = `<button onclick="openStaffModal('${emp.id}')" class="px-2 py-1.5 rounded-lg border border-[#DADCE0] hover:bg-[#f1f4f7] text-[#181c1f] font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm" title="Edit Employee">
            <span class="material-symbols-outlined text-sm">edit</span><span>Edit</span>
        </button>`;

        const historyBtn = `<button onclick="viewEmployeeHistory('${emp.id}', '${escapeHtml(emp.name).replace(/'/g, "\\'")}')" class="px-2 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm" title="View History">
            <span class="material-symbols-outlined text-sm">history</span><span>History</span>
        </button>`;

        const removeBtn = isOwner ? '' : `<button onclick="removeEmployee('${emp.id}', '${escapeHtml(emp.name).replace(/'/g, "\\'")}')" class="px-2 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm" title="Remove Employee">
            <span class="material-symbols-outlined text-sm">person_remove</span><span>Remove</span>
        </button>`;

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full ${avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0">${avatarIcon}</div>
                        <div class="min-w-0">
                            <p class="font-bold text-xs text-[#181c1f] flex items-center gap-1.5 truncate">
                                <span>${escapeHtml(emp.name)}</span>
                                ${typeBadge}
                            </p>
                            <p class="text-[11px] text-[#5c5f60] font-mono truncate">${escapeHtml(emp.email || '')}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4">${hostelBadge}</td>
                <td class="p-4"><div class="flex flex-wrap gap-1">${roleBadges.join('')}</div></td>
                <td class="p-4">${dutyToggleBtn}</td>
                <td class="p-4 text-xs font-medium text-[#181c1f]">${emp.phone ? escapeHtml(emp.phone) : '<span class="text-[#74777a] italic">None</span>'}</td>
                <td class="p-4">${deliveryCell}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5 flex-wrap">
                        ${editBtn}
                        ${historyBtn}
                        ${removeBtn}
                    </div>
                </td>
            </tr>`;
    }).join('');

    const cntEl = document.getElementById('emp-count-display');
    if (cntEl) cntEl.textContent = `Showing ${list.length} employee${list.length !== 1 ? 's' : ''}`;
}

function filterEmployeesList() {
    if (!employeesCache || employeesCache.length === 0) return;

    const searchVal = (document.getElementById('emp-search-input')?.value || '').toLowerCase().trim();
    const hostelVal = document.getElementById('emp-filter-hostel')?.value || '';
    const positionVal = document.getElementById('emp-filter-position')?.value || '';
    const statusVal = document.getElementById('emp-filter-status')?.value || '';

    let filtered = employeesCache;

    // Search filter
    if (searchVal) {
        filtered = filtered.filter(e => {
            const name = (e.name || '').toLowerCase();
            const email = (e.email || '').toLowerCase();
            const phone = (e.phone || '').toLowerCase();
            const hostel = (e.assigned_hostel_name || e.assigned_hostel_id || '').toLowerCase();
            return name.includes(searchVal) || email.includes(searchVal) || phone.includes(searchVal) || hostel.includes(searchVal);
        });
    }

    // Hostel filter
    if (hostelVal) {
        filtered = filtered.filter(e => {
            if (!e) return false;
            const hVal = hostelVal.toUpperCase().trim();
            const assignedList = Array.isArray(e.assigned_hostels) && e.assigned_hostels.length > 0
                ? e.assigned_hostels.map(h => String(h).toUpperCase().trim())
                : (e.assigned_hostel_id ? [e.assigned_hostel_id.toUpperCase().trim()] : []);
            const hName = (e.assigned_hostel_name || '').toLowerCase().trim();
            return assignedList.some(h => h === hVal || h === hVal.replace(/\s+/g, '-') || h.replace(/\s+/g, '-') === hVal) ||
                (hName && hName.includes(hostelVal.toLowerCase()));
        });
    }

    // Position filter
    if (positionVal) {
        if (positionVal === 'owner') {
            filtered = filtered.filter(e => e.is_owner);
        } else if (positionVal === 'delivery_person') {
            filtered = filtered.filter(e => e.is_delivery_boy);
        } else {
            filtered = filtered.filter(e => (e.roles || []).includes(positionVal));
        }
    }

    // Status filter
    if (statusVal === 'ON_DUTY') {
        filtered = filtered.filter(e => e.duty_status === 'ON_DUTY' || e.is_on_duty === true || e.delivery_data?.duty_status === 'ON_DUTY');
    } else if (statusVal === 'OFF_DUTY') {
        filtered = filtered.filter(e => e.duty_status === 'OFF_DUTY' || e.is_on_duty === false || e.delivery_data?.duty_status === 'OFF_DUTY');
    } else if (statusVal === 'ACTIVE') {
        filtered = filtered.filter(e => e.account_status === 'ACTIVE');
    }

    renderEmployeesTable(filtered);
}

function resetEmployeeFilters() {
    const search = document.getElementById('emp-search-input');
    const hostel = document.getElementById('emp-filter-hostel');
    const position = document.getElementById('emp-filter-position');
    const status = document.getElementById('emp-filter-status');
    if (search) search.value = '';
    if (hostel) hostel.value = '';
    if (position) position.value = '';
    if (status) status.value = '';
    renderEmployeesTable(employeesCache);
}

async function removeEmployee(empId, empName) {
    if (!empId) return;
    const confirmed = confirm(`⚠️ Remove employee "${empName}"?\n\nThis will permanently revoke their admin access. This action cannot be undone.\n\nAre you sure?`);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/admin/staff/${empId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Employee "${empName}" removed successfully`, 'success');
            await loadEmployeesList();
            if (typeof loadStaffList === 'function') {
                await loadStaffList();
            }
        } else {
            showToast(data.error || 'Failed to remove employee', 'warning');
        }
    } catch (err) {
        showToast('Network error removing employee: ' + err.message, 'warning');
    }
}

async function viewEmployeeHistory(empId, empName) {
    const modal = document.getElementById('modal-emp-history');
    if (!modal) return;

    // Show modal
    modal.classList.remove('hidden');
    document.getElementById('emp-history-name').textContent = empName || 'Employee';
    const contentEl = document.getElementById('emp-history-content');
    contentEl.innerHTML = '<div class="p-8 text-center text-[#5c5f60] animate-pulse">Loading employee history...</div>';

    // Find employee in cache
    const emp = employeesCache.find(e => e.id === empId);

    // Build employee summary card
    let summaryHtml = '';
    if (emp) {
        const roles = (emp.roles || []).map(r => {
            if (r === 'owner') return '👑 Owner';
            if (r === 'store_manager') return '🏢 Store Manager';
            if (r === 'inventory_manager') return '📦 Inventory Manager';
            if (r === 'delivery_person') return '🛵 Delivery Boy';
            return r;
        }).join(', ');

        const hostel = emp.is_owner ? '🌐 All Hostels (Master)' : (emp.assigned_hostel_name || emp.assigned_hostel_id || 'General Operations');
        const joinDate = emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';
        const lastLogin = emp.last_login ? new Date(emp.last_login).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

        summaryHtml = `
            <div class="glass-panel p-5 mb-4">
                <h4 class="text-sm font-bold text-[#181c1f] mb-3 flex items-center gap-2">
                    <span class="material-symbols-outlined text-indigo-600 text-base">person</span> Employee Details
                </h4>
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div><span class="text-[#5c5f60] font-semibold">Name:</span> <span class="font-bold text-[#181c1f]">${escapeHtml(emp.name)}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Email:</span> <span class="font-mono text-[#181c1f]">${escapeHtml(emp.email || 'N/A')}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Phone:</span> <span class="font-bold text-[#181c1f]">${escapeHtml(emp.phone || 'None')}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Roles:</span> <span class="text-[#181c1f]">${roles}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Assigned Hostel:</span> <span class="font-bold text-[#0066cc]">${escapeHtml(hostel)}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Status:</span> <span class="font-bold ${emp.account_status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'}">${emp.account_status || 'ACTIVE'}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Joined:</span> <span class="text-[#181c1f]">${joinDate}</span></div>
                    <div><span class="text-[#5c5f60] font-semibold">Last Login:</span> <span class="text-[#181c1f]">${lastLogin}</span></div>
                </div>
            </div>`;

        // Delivery stats card (if delivery boy)
        if (emp.is_delivery_boy && emp.delivery_data) {
            const dd = emp.delivery_data;
            summaryHtml += `
                <div class="glass-panel p-5 mb-4 border-l-4 border-l-emerald-500">
                    <h4 class="text-sm font-bold text-[#181c1f] mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-600 text-base">two_wheeler</span> Delivery Performance Summary
                    </h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="bg-emerald-50 rounded-xl p-3 text-center">
                            <p class="text-[10px] font-semibold text-emerald-700 uppercase">Total Deliveries</p>
                            <p class="text-2xl font-bold text-emerald-800">${dd.total_deliveries}</p>
                        </div>
                        <div class="bg-blue-50 rounded-xl p-3 text-center">
                            <p class="text-[10px] font-semibold text-blue-700 uppercase">Total Earnings</p>
                            <p class="text-2xl font-bold text-blue-800">₹${(dd.total_earnings || 0).toFixed(0)}</p>
                        </div>
                        <div class="bg-amber-50 rounded-xl p-3 text-center">
                            <p class="text-[10px] font-semibold text-amber-700 uppercase">Today Deliveries</p>
                            <p class="text-2xl font-bold text-amber-800">${dd.today_deliveries || 0}</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-3 text-center">
                            <p class="text-[10px] font-semibold text-purple-700 uppercase">Duty Status</p>
                            <p class="text-lg font-bold ${dd.duty_status === 'ON_DUTY' ? 'text-emerald-700' : 'text-gray-500'}">${dd.duty_status === 'ON_DUTY' ? '🟢 On Duty' : '⚪ Off Duty'}</p>
                        </div>
                    </div>
                    <p class="text-[10px] text-[#5c5f60] mt-2">Rate: ₹${dd.rate_per_order}/order · Active in-transit: ${dd.active_deliveries || 0}</p>
                </div>`;
        }
    }

    // Now fetch order history for this employee
    try {
        const ordRes = await fetch('/api/admin/orders', { headers: getAuthHeaders() });
        const ordData = await ordRes.json();
        let orders = [];
        if (ordData.success && Array.isArray(ordData.orders)) {
            orders = ordData.orders;
        } else if (Array.isArray(ordData)) {
            orders = ordData;
        }

        // Filter orders where rider_name matches employee name
        const empNameLower = (empName || '').toLowerCase().trim();
        const matchedOrders = orders.filter(o => {
            const riderLower = (o.rider_name || '').toLowerCase().trim();
            return riderLower && empNameLower && (riderLower === empNameLower || riderLower.includes(empNameLower));
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        let historyTableHtml = '';
        if (matchedOrders.length > 0) {
            const rows = matchedOrders.slice(0, 50).map(o => {
                const dt = o.created_at ? new Date(o.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
                const st = String(o.status || '').toLowerCase();
                let statusBdg = '';
                if (['delivered', 'completed'].includes(st)) {
                    statusBdg = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">✅ Delivered</span>';
                } else if (['claimed', 'runner_assigned', 'picked_up', 'out_for_delivery'].includes(st)) {
                    statusBdg = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 animate-pulse">🚀 In Transit</span>';
                } else {
                    statusBdg = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">${escapeHtml(o.status || 'Unknown')}</span>`;
                }
                const total = o.total ? `₹${Number(o.total).toFixed(0)}` : '—';
                const customer = escapeHtml(o.customer_name || o.user_name || 'Unknown');
                const hostel = escapeHtml(o.hostel_id || o.delivery_hostel || '—');
                return `<tr class="hover:bg-gray-50 transition-colors">
                    <td class="p-3 text-[11px] text-[#5c5f60]">${dt}</td>
                    <td class="p-3 text-xs font-medium text-[#181c1f]">${customer}</td>
                    <td class="p-3 text-xs font-mono text-[#181c1f]">${total}</td>
                    <td class="p-3 text-xs">${hostel}</td>
                    <td class="p-3">${statusBdg}</td>
                </tr>`;
            }).join('');

            historyTableHtml = `
                <div class="glass-panel overflow-hidden">
                    <div class="p-4 border-b border-[#DADCE0] flex items-center justify-between">
                        <h4 class="text-sm font-bold text-[#181c1f] flex items-center gap-2">
                            <span class="material-symbols-outlined text-indigo-600 text-base">receipt_long</span>
                            Order Delivery History
                        </h4>
                        <span class="text-[11px] text-[#5c5f60] font-semibold">${matchedOrders.length} order${matchedOrders.length !== 1 ? 's' : ''} found</span>
                    </div>
                    <div class="overflow-x-auto max-h-[350px] overflow-y-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead class="sticky top-0 bg-[#f7fafd] z-10">
                                <tr class="border-b border-[#DADCE0] text-[#5c5f60] font-semibold uppercase text-[11px]">
                                    <th class="p-3">Date</th>
                                    <th class="p-3">Customer</th>
                                    <th class="p-3">Amount</th>
                                    <th class="p-3">Hostel</th>
                                    <th class="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#DADCE0]">${rows}</tbody>
                        </table>
                    </div>
                    ${matchedOrders.length > 50 ? `<div class="p-3 border-t border-[#DADCE0] bg-gray-50 text-center text-[11px] text-[#5c5f60]">Showing latest 50 of ${matchedOrders.length} orders</div>` : ''}
                </div>`;
        } else {
            historyTableHtml = `
                <div class="glass-panel p-6 text-center text-[#5c5f60]">
                    <span class="material-symbols-outlined text-3xl text-gray-300 mb-2 block">receipt_long</span>
                    <p class="text-xs">No delivery order history found for this employee.</p>
                </div>`;
        }

        contentEl.innerHTML = summaryHtml + historyTableHtml;
    } catch (err) {
        contentEl.innerHTML = summaryHtml + `<div class="glass-panel p-6 text-center text-rose-600 text-xs">Failed to load order history: ${err.message}</div>`;
    }
}

function closeEmployeeHistoryModal() {
    const modal = document.getElementById('modal-emp-history');
    if (modal) modal.classList.add('hidden');
}


// ==========================================
// CAMPUS MULTI-HOSTEL CONTROLLER
// ==========================================
let hostelsCache = [];
let activeAdminHostelFilter = {
    products: 'ALL',
    inventory: 'ALL',
    orders: 'ALL',
    dailyRevenue: 'ALL',
    clientLock: 'ALL'
};

function getActiveAdminHostelFilter(view = 'products') {
    const isOwner = isPlatformOwner(currentAdminProfile);
    const assignedHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);

    if (!isOwner && assignedHostels.length === 1) {
        return assignedHostels[0];
    }

    const val = activeAdminHostelFilter[view] || 'ALL';
    if (val && val !== 'ALL') {
        if (!isOwner && assignedHostels.length > 1) {
            return assignedHostels.includes(val) ? val : 'ALL';
        }
        return val;
    }
    return 'ALL';
}

function populateHostelDropdowns() {
    const isOwner = isPlatformOwner(currentAdminProfile);
    const assignedHostel = currentAdminProfile && currentAdminProfile.assigned_hostel_id;

    const targetSelects = [
        { id: 'products-hostel-filter', view: 'products', allowAll: true },
        { id: 'inventory-hostel-filter', view: 'inventory', allowAll: true },
        { id: 'orders-hostel-filter', view: 'orders', allowAll: true },
        { id: 'dr-hostel-filter', view: 'dailyRevenue', allowAll: true },
        { id: 'lock-hostel-filter', view: 'clientLock', allowAll: true },
        { id: 'form-product-hostel', view: null, allowAll: false }
    ];

    targetSelects.forEach(cfg => {
        const select = document.getElementById(cfg.id);
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '';

        if (cfg.allowAll) {
            const allOpt = document.createElement('option');
            allOpt.value = 'ALL';
            allOpt.textContent = '🏢 All Campus Hostels';
            select.appendChild(allOpt);
        }

        hostelsCache.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.id;
            const statusLabel = h.status === 'OFF' ? ' [OFF]' : '';
            opt.textContent = `${h.name || h.id} (${h.id})${statusLabel}`;
            select.appendChild(opt);
        });

        // If non-owner manager assigned to hostels or groups
        const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
            ? currentAdminProfile.assigned_hostels
            : (assignedHostel ? [assignedHostel] : []);

        if (!isOwner && myHostels.length > 0) {
            select.innerHTML = '';
            if (myHostels.length > 1) {
                if (cfg.allowAll) {
                    const allOpt = document.createElement('option');
                    allOpt.value = 'ALL';
                    allOpt.textContent = `🏢 All My Assigned Hostels (${myHostels.length})`;
                    select.appendChild(allOpt);
                }
                myHostels.forEach(hId => {
                    const matched = hostelsCache.find(h => h.id === hId || (h.id && hId && h.id.replace(/[^A-Z0-9]/g, '') === hId.replace(/[^A-Z0-9]/g, '')));
                    const opt = document.createElement('option');
                    opt.value = hId;
                    opt.textContent = `🏢 ${matched?.name || hId} (${hId})`;
                    select.appendChild(opt);
                });
                select.disabled = false;
                const cleanCurrent = currentVal ? String(currentVal).toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                const matchedCurrent = myHostels.find(h => String(h).toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCurrent);
                if (currentVal === 'ALL') {
                    select.value = 'ALL';
                } else if (matchedCurrent) {
                    select.value = matchedCurrent;
                } else {
                    select.value = cfg.allowAll ? 'ALL' : myHostels[0];
                }
            } else {
                const singleId = myHostels[0];
                const matched = hostelsCache.find(h => h.id === singleId || (h.id && singleId && h.id.replace(/[^A-Z0-9]/g, '') === singleId.replace(/[^A-Z0-9]/g, '')));
                const opt = document.createElement('option');
                opt.value = singleId;
                opt.textContent = `🏢 ${matched?.name || singleId} (${singleId})`;
                select.appendChild(opt);
                select.value = singleId;
                select.disabled = true;
            }
            if (cfg.view) activeAdminHostelFilter[cfg.view] = select.value;
        } else {
            select.disabled = false;
            if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
                select.value = currentVal;
            } else if (cfg.allowAll) {
                select.value = 'ALL';
            }
        }
    });

    // Keep Employees hostel filter in sync with ONLY active hostels (active by owner)
    const empHostelSelect = document.getElementById('emp-filter-hostel');
    if (empHostelSelect) {
        const curVal = empHostelSelect.value;
        empHostelSelect.innerHTML = '<option value="">🏢 All Stores &amp; Active Hostels</option>';
        const activeHostels = (hostelsCache || []).filter(h => h.status === 'ACTIVE' || h.status === 'active');
        activeHostels.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h.id;
            opt.textContent = `🏢 ${h.name || h.id}`;
            empHostelSelect.appendChild(opt);
        });
        if (curVal && Array.from(empHostelSelect.options).some(o => o.value === curVal)) {
            empHostelSelect.value = curVal;
        }
    }
}

function onProductsHostelFilterChange(val) {
    activeAdminHostelFilter.products = val;
    loadProducts(true);
}

function onInventoryHostelFilterChange(val) {
    activeAdminHostelFilter.inventory = val;
    loadInventory(true);
}

function onOrdersHostelFilterChange(val) {
    activeAdminHostelFilter.orders = val;
    loadOrders();
}

function onDailyRevenueHostelFilterChange(val) {
    activeAdminHostelFilter.dailyRevenue = val || 'ALL';
    if (typeof currentDailyRevenueFilter === 'object') {
        currentDailyRevenueFilter.hostel_id = val || 'ALL';
    }
    loadDailyRevenueView(true);
}

function selectDailyRevenueHostel(hostelId) {
    const current = (currentDailyRevenueFilter.hostel_id || 'ALL').toUpperCase();
    const nextVal = (current === hostelId.toUpperCase()) ? 'ALL' : hostelId;
    const sel = document.getElementById('dr-hostel-filter');
    if (sel) sel.value = nextVal;
    onDailyRevenueHostelFilterChange(nextVal);
}

function renderDashboardHostelCards() {
    const grid = document.getElementById('dash-hostel-cards-grid');
    if (!grid) return;

    if (!hostelsCache || hostelsCache.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-3 text-center text-xs text-[#5c5f60]">Loading campus dark stores...</div>';
        return;
    }

    const isOwner = isPlatformOwner(currentAdminProfile);
    const assignedHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);

    let list = hostelsCache;
    if (!isOwner && assignedHostels.length > 0) {
        const allowedSet = new Set(assignedHostels.map(x => x.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')));
        list = hostelsCache.filter(h => h.id && allowedSet.has(h.id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')));
    }

    grid.innerHTML = list.map(h => {
        const hid = h.id;
        const norm = hid.toLowerCase().replace('-', '');
        const hostelOrders = (ordersCache || []).filter(o => (o.hostel_id || 'BH-13').toLowerCase().replace('-', '') === norm);

        const activeOrdersCount = hostelOrders.filter(o => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(o.status)).length;
        const deliveredOrders = hostelOrders.filter(o => ['Delivered', 'delivered', 'completed', 'Completed'].includes(o.status));
        const deliveredRev = deliveredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

        const isActive = h.status === 'ACTIVE';

        return `
            <div class="p-3.5 rounded-xl border ${isActive ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-slate-50/70'} hover:shadow-sm transition-all flex flex-col justify-between space-y-2">
                <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-xs ${isActive ? 'text-[#0066cc]' : 'text-slate-600'}">${escapeHtml(h.id)}</span>
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
                        ${isActive ? 'LIVE' : 'OFF'}
                    </span>
                </div>
                <div>
                    <h4 class="font-bold text-xs text-[#181c1f] truncate">${escapeHtml(h.name || h.id)}</h4>
                    <p class="text-[10px] text-[#5c5f60] truncate">${h.manager_name ? 'Mgr: ' + escapeHtml(h.manager_name) : 'No manager assigned'}</p>
                </div>
                <div class="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-slate-200/60">
                    <div>
                        <span class="text-[9px] text-[#5c5f60] block">Active Orders</span>
                        <span class="font-bold text-[#181c1f]">${activeOrdersCount}</span>
                    </div>
                    <div>
                        <span class="text-[9px] text-[#5c5f60] block">Realized</span>
                        <span class="font-bold text-[#137333]">₹${Math.round(deliveredRev).toLocaleString('en-IN')}</span>
                    </div>
                </div>
                <div class="pt-1 flex items-center gap-1.5">
                    <button onclick="filterOrdersByHostel('${escapeHtml(h.id)}')"
                        class="flex-1 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-blue-50 border border-blue-200 text-[#0066cc] text-center transition-all cursor-pointer">
                        Orders (${hostelOrders.length})
                    </button>
                    <button onclick="filterProductsByHostel('${escapeHtml(h.id)}')"
                        class="flex-1 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-[#3c4043] text-center transition-all cursor-pointer">
                        Catalog
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterOrdersByHostel(hostelId) {
    switchView('orders');
    const sel = document.getElementById('orders-hostel-filter');
    if (sel) sel.value = hostelId;
    onOrdersHostelFilterChange(hostelId);
}

function filterProductsByHostel(hostelId) {
    switchView('products');
    const sel = document.getElementById('products-hostel-filter');
    if (sel) sel.value = hostelId;
    onProductsHostelFilterChange(hostelId);
}

async function loadHostels() {
    try {
        const res = await fetchWithTimeout('/api/admin/hostels', { headers: getAuthHeaders() }, 7000);
        if (res.status === 401) {
            handleAdminAuthError(res);
            return;
        }
        if (res.ok) {
            const data = await res.json();
            hostelsCache = data.hostels || [];
            populateHostelDropdowns();
            renderHostelsTable();
            updateHostelKpis();
            renderDashboardHostelCards();
        }
    } catch (err) {
        console.warn('[Hostels Load Error]:', err);
        showToast('Error loading campus hostels: ' + err.message, 'warning');
    }
}

function updateHostelKpis() {
    const total = hostelsCache.length;
    const active = hostelsCache.filter(h => h.status === 'ACTIVE').length;
    const off = hostelsCache.filter(h => h.status === 'OFF').length;
    const managers = hostelsCache.filter(h => h.store_manager_id).length;

    const elTotal = document.getElementById('stat-hostels-total');
    const elActive = document.getElementById('stat-hostels-active');
    const elOff = document.getElementById('stat-hostels-off');
    const elMgr = document.getElementById('stat-hostels-managers');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elOff) elOff.textContent = off;
    if (elMgr) elMgr.textContent = managers;
}

function renderHostelsTable() {
    const tbody = document.getElementById('hostels-table-tbody');
    if (!tbody) return;

    if (!hostelsCache || hostelsCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#5c5f60]">No campus hostels configured yet. Click "Add New Hostel" above.</td></tr>`;
        return;
    }

    const sortedHostels = [...hostelsCache].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
        if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
        return 0;
    });

    tbody.innerHTML = sortedHostels.map(h => {
        const isActive = h.status === 'ACTIVE';
        const statusBadge = isActive
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE (Ordering Live)
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-[#ba1a1a] border border-rose-300">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> OFF / PAUSED (Orders Blocked)
               </span>`;

        const managerDisplay = h.manager_name
            ? `<div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                    ${escapeHtml((h.manager_name[0] || 'M').toUpperCase())}
                </div>
                <div>
                    <p class="font-bold text-[#181c1f] text-[11px]">${escapeHtml(h.manager_name)}</p>
                    <p class="text-[10px] text-[#5c5f60]">${escapeHtml(h.manager_email || '')}</p>
                </div>
               </div>`
            : `<span class="text-[11px] text-[#5c5f60] italic">None Assigned</span>`;

        const createdDate = h.created_at ? new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Preset';

        const activeBlocks = Array.isArray(h.blocks) && h.blocks.length > 0 ? h.blocks : ['Block A', 'Block B'];
        const blocksPills = activeBlocks.map(b => `<span class="bg-blue-50 text-[#0066cc] border border-blue-200 px-1.5 py-0.2 rounded text-[10px] font-bold">${escapeHtml(b)}</span>`).join(' ');

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4 font-mono font-bold text-[#0066cc] text-xs">${escapeHtml(h.id)}</td>
                <td class="p-4">
                    <p class="font-semibold text-xs text-[#181c1f]">${escapeHtml(h.name)}</p>
                    <div class="flex items-center gap-1 flex-wrap mt-1">
                        <span class="text-[10px] text-slate-400 font-semibold">Active Blocks:</span>
                        ${blocksPills}
                    </div>
                </td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4">${managerDisplay}</td>
                <td class="p-4 text-[#5c5f60] text-[11px]">${createdDate}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="toggleHostelStatus('${escapeHtml(h.id)}', '${h.status}')"
                            class="px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${isActive ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}"
                            title="${isActive ? 'Pause Storefront (Turn OFF)' : 'Activate Storefront (Turn ON)'}">
                            ${isActive ? '⏸️ Turn OFF' : '▶️ Turn ACTIVE'}
                        </button>
                        <button onclick="openManageBlocksModal('${escapeHtml(h.id)}')"
                            class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Configure Active Blocks for ${escapeHtml(h.name)}">
                            <span class="material-symbols-outlined text-[14px]">apartment</span>
                            <span>Blocks</span>
                        </button>
                        <button onclick="openAssignManagerModal('${escapeHtml(h.id)}', '${escapeHtml(h.name)}', '${h.store_manager_id || ''}')"
                            class="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition-all cursor-pointer" title="Assign Store Manager">
                            <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
                        </button>
                        <button onclick="openHostelModal('${escapeHtml(h.id)}')"
                            class="p-1.5 text-[#5c5f60] hover:text-[#3c4043] hover:bg-[#ebeef2] rounded-lg transition-all cursor-pointer" title="Edit Hostel Details">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deleteHostel('${escapeHtml(h.id)}', '${escapeHtml(h.name)}')"
                            class="p-1.5 text-[#ba1a1a] hover:bg-rose-50 rounded-lg transition-all cursor-pointer" title="Remove Hostel">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

let editingHostelId = null;

function onPresetHostelSelected(val) {
    if (!val) return;
    const idInput = document.getElementById('form-hostel-id');
    const nameInput = document.getElementById('form-hostel-name');
    if (val === 'CUSTOM') {
        if (idInput && !editingHostelId) {
            idInput.value = '';
            idInput.focus();
        }
        if (nameInput && !editingHostelId) {
            nameInput.value = '';
        }
        return;
    }
    const parts = val.split('|');
    const hId = parts[0];
    const hName = parts[1];
    if (idInput && !editingHostelId) {
        idInput.value = hId || '';
    }
    if (nameInput) {
        nameInput.value = hName || '';
    }
}

function setPresetHostelBlocks(preset) {
    const input = document.getElementById('form-hostel-blocks');
    if (!input) return;
    if (preset === 'ABCD_GATE') {
        input.value = 'Block A, Block B, Block C, Block D, Hostel Main Gate';
    } else if (preset === 'AB_GATE') {
        input.value = 'Block A, Block B, Hostel Main Gate';
    }
}
window.setPresetHostelBlocks = setPresetHostelBlocks;

function openHostelModal(hostelId = null) {
    editingHostelId = hostelId;
    const modal = document.getElementById('modal-hostel');
    const titleEl = document.getElementById('modal-hostel-title');
    const presetSelect = document.getElementById('preset-hostel-select');
    const idInput = document.getElementById('form-hostel-id');
    const nameInput = document.getElementById('form-hostel-name');
    const statusSelect = document.getElementById('form-hostel-status');
    const blocksInput = document.getElementById('form-hostel-blocks');
    const errBox = document.getElementById('hostel-form-error');

    if (errBox) errBox.classList.add('hidden');

    if (hostelId) {
        const h = hostelsCache.find(x => x.id === hostelId);
        if (titleEl) titleEl.textContent = 'Edit Campus Hostel';
        if (idInput) {
            idInput.value = hostelId;
            idInput.disabled = true;
        }
        if (nameInput) nameInput.value = h ? h.name : hostelId;
        if (statusSelect) statusSelect.value = h ? h.status : 'ACTIVE';
        if (blocksInput) {
            blocksInput.value = (Array.isArray(h?.blocks) && h.blocks.length > 0)
                ? h.blocks.join(', ')
                : 'Block A, Block B, Block C, Block D, Hostel Main Gate';
        }

        if (presetSelect) {
            let matched = false;
            for (let opt of presetSelect.options) {
                if (opt.value && opt.value.split('|')[0] === hostelId) {
                    presetSelect.value = opt.value;
                    matched = true;
                    break;
                }
            }
            if (!matched) presetSelect.value = 'CUSTOM';
            presetSelect.disabled = true;
        }
    } else {
        if (titleEl) titleEl.textContent = 'Add Campus Hostel';
        if (presetSelect) {
            presetSelect.value = '';
            presetSelect.disabled = false;
        }
        if (idInput) {
            idInput.value = '';
            idInput.disabled = false;
        }
        if (nameInput) nameInput.value = '';
        if (statusSelect) statusSelect.value = 'ACTIVE';
        if (blocksInput) {
            blocksInput.value = 'Block A, Block B, Block C, Block D, Hostel Main Gate';
        }
    }

    if (modal) modal.classList.remove('hidden');
}

function closeHostelModal() {
    const modal = document.getElementById('modal-hostel');
    if (modal) modal.classList.add('hidden');
    editingHostelId = null;
}

async function submitHostelForm(e) {
    e.preventDefault();
    const idInput = document.getElementById('form-hostel-id');
    const nameInput = document.getElementById('form-hostel-name');
    const statusSelect = document.getElementById('form-hostel-status');
    const blocksInput = document.getElementById('form-hostel-blocks');
    const errBox = document.getElementById('hostel-form-error');
    const saveBtn = document.getElementById('btn-save-hostel');

    const id = (idInput?.value || '').trim().toUpperCase();
    const name = (nameInput?.value || '').trim();
    const status = statusSelect?.value || 'ACTIVE';
    const rawBlocks = (blocksInput?.value || '').trim();
    const blocks = rawBlocks.split(',').map(s => s.trim()).filter(Boolean);

    if (!id || !name) {
        if (errBox) {
            errBox.textContent = 'Hostel ID and Name are required.';
            errBox.classList.remove('hidden');
        }
        return;
    }

    if (saveBtn) saveBtn.disabled = true;

    try {
        const isEdit = Boolean(editingHostelId);
        const url = isEdit ? `/api/admin/hostels/${encodeURIComponent(editingHostelId)}` : '/api/admin/hostels';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify({ id, name, status, blocks })
        });
        const data = await res.json();
        if (data.success) {
            showToast(isEdit ? `Hostel ${id} updated` : `Hostel ${id} created`, 'success');
            closeHostelModal();
            await loadHostels();
        } else {
            if (errBox) {
                errBox.textContent = data.error || 'Failed to save hostel';
                errBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (errBox) {
            errBox.textContent = 'Network error: ' + err.message;
            errBox.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

async function toggleHostelStatus(id, currentStatus) {
    const newStatus = currentStatus === 'ACTIVE' ? 'OFF' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activate' : 'deactivate';

    if (newStatus === 'OFF') {
        const confirmPause = confirm(`Turn OFF ordering for ${id}?\n\nExisting product and order data will NOT be deleted, but students will not be able to place new orders from this hostel.`);
        if (!confirmPause) return;
    }

    try {
        const res = await fetch(`/api/admin/hostels/${encodeURIComponent(id)}/${action}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Hostel ${id} is now ${newStatus}`, 'success');
            await loadHostels();
        } else {
            showToast(data.error || 'Failed to update hostel status', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    }
}

async function deleteHostel(id, name) {
    if (!id) return;
    const displayName = name ? `${name} (${id})` : id;
    const confirmed = confirm(`Are you sure you want to remove hostel "${displayName}"?\n\nThis will remove it from the campus hostels list and storefront ordering.`);
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/admin/hostels/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Hostel ${id} removed successfully`, 'success');
            await loadHostels();
        } else {
            showToast(data.error || 'Failed to remove hostel', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    }
}

let assigningHostelId = null;

async function openAssignManagerModal(hostelId, hostelName, currentManagerId) {
    assigningHostelId = hostelId;
    const modal = document.getElementById('modal-assign-manager');
    const hostelIdInput = document.getElementById('assign-mgr-hostel-id');
    const hostelNameEl = document.getElementById('assign-mgr-hostel-name');
    const currNameEl = document.getElementById('assign-mgr-curr-name');
    const userSelect = document.getElementById('assign-mgr-user-select');
    const errBox = document.getElementById('assign-mgr-error');
    const removeBtn = document.getElementById('btn-remove-manager');

    if (errBox) errBox.classList.add('hidden');
    if (hostelIdInput) hostelIdInput.value = hostelId;
    if (hostelNameEl) hostelNameEl.textContent = `${hostelName} (${hostelId})`;

    const hostel = hostelsCache.find(x => x.id === hostelId);
    if (currNameEl) {
        currNameEl.textContent = (hostel && hostel.manager_name) ? `${hostel.manager_name} (${hostel.manager_email || ''})` : 'None';
    }

    if (removeBtn) {
        removeBtn.classList.toggle('hidden', !Boolean(currentManagerId || (hostel && hostel.store_manager_id)));
    }

    // Populate userSelect from staff list
    if (userSelect) {
        userSelect.innerHTML = '<option value="">Loading admin staff members...</option>';
        try {
            const res = await fetchWithTimeout('/api/admin/staff', { headers: getAuthHeaders() }, 5000);
            if (res.ok) {
                const data = await res.json();
                const staff = data.staff || [];
                userSelect.innerHTML = '<option value="">Select a Store Manager...</option>';
                staff.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    const roleLabel = (s.roles || []).join(', ');
                    opt.textContent = `${s.name || s.email} (${s.email}) - [${roleLabel}]`;
                    if (s.id === currentManagerId || (hostel && hostel.store_manager_id === s.id)) {
                        opt.selected = true;
                    }
                    userSelect.appendChild(opt);
                });
            } else {
                userSelect.innerHTML = '<option value="">Failed to load staff list</option>';
            }
        } catch (e) {
            userSelect.innerHTML = '<option value="">Failed to load staff list</option>';
        }
    }

    if (modal) modal.classList.remove('hidden');
}

function closeAssignManagerModal() {
    const modal = document.getElementById('modal-assign-manager');
    if (modal) modal.classList.add('hidden');
    assigningHostelId = null;
}

async function submitManagerAssignment(e) {
    e.preventDefault();
    const hostelId = assigningHostelId;
    const userSelect = document.getElementById('assign-mgr-user-select');
    const errBox = document.getElementById('assign-mgr-error');
    const saveBtn = document.getElementById('btn-save-assignment');

    const managerId = userSelect?.value;
    if (!hostelId || !managerId) {
        if (errBox) {
            errBox.textContent = 'Please select a staff member to assign.';
            errBox.classList.remove('hidden');
        }
        return;
    }

    if (saveBtn) saveBtn.disabled = true;

    try {
        const res = await fetch(`/api/admin/hostels/${encodeURIComponent(hostelId)}/assign-manager`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ store_manager_id: managerId })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Store Manager assigned successfully', 'success');
            closeAssignManagerModal();
            await loadHostels();
        } else {
            if (errBox) {
                errBox.textContent = data.error || 'Failed to assign manager';
                errBox.classList.remove('hidden');
            }
        }
    } catch (err) {
        if (errBox) {
            errBox.textContent = 'Network error: ' + err.message;
            errBox.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

async function handleRemoveManager() {
    const hostelId = assigningHostelId;
    if (!hostelId) return;

    if (!confirm(`Unassign the current store manager from hostel ${hostelId}?`)) return;

    try {
        const res = await fetch(`/api/admin/hostels/${encodeURIComponent(hostelId)}/remove-manager`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('Manager unassigned', 'info');
            closeAssignManagerModal();
            await loadHostels();
        } else {
            alert(data.error || 'Failed to remove manager');
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}

// Expose functions globally for HTML event handlers
window.populateHostelDropdowns = populateHostelDropdowns;
window.getActiveAdminHostelFilter = getActiveAdminHostelFilter;
window.onProductsHostelFilterChange = onProductsHostelFilterChange;
window.onInventoryHostelFilterChange = onInventoryHostelFilterChange;
window.onOrdersHostelFilterChange = onOrdersHostelFilterChange;
window.loadHostels = loadHostels;
window.openHostelModal = openHostelModal;
window.closeHostelModal = closeHostelModal;
window.submitHostelForm = submitHostelForm;
window.toggleHostelStatus = toggleHostelStatus;
window.openAssignManagerModal = openAssignManagerModal;
window.closeAssignManagerModal = closeAssignManagerModal;
window.submitManagerAssignment = submitManagerAssignment;
window.handleRemoveManager = handleRemoveManager;
window.onDailyRevenueHostelFilterChange = onDailyRevenueHostelFilterChange;
window.selectDailyRevenueHostel = selectDailyRevenueHostel;
window.renderDashboardHostelCards = renderDashboardHostelCards;
window.filterOrdersByHostel = filterOrdersByHostel;
window.filterProductsByHostel = filterProductsByHostel;

// Initial Boot Check: Verify token with server before unlocking UI
async function initAdminAuth() {
    const savedToken = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    if (!savedToken) {
        showLoginModal();
        return;
    }

    try {
        const res = await fetch('/api/admin/verify', {
            headers: {
                'Authorization': `Bearer ${savedToken}`,
                'x-admin-token': savedToken
            }
        });
        const data = await res.json();
        if (data.success && data.authenticated && data.admin) {
            adminToken = data.token || savedToken;
            try {
                localStorage.setItem('lpuquick_admin_token', adminToken);
                sessionStorage.setItem('lpuquick_admin_token', adminToken);
                localStorage.setItem('lpuquick_admin_profile', JSON.stringify(data.admin));
            } catch (e) {}
            currentAdminProfile = data.admin;
            hideLoginModal();
            if (typeof loadHostels === 'function') {
                loadHostels().catch(() => { });
            }
            const initialView = applyAdminRolePermissions(data.admin);
            switchView(initialView);
            initRealtimeWebSocket();
        } else if (res.status === 401) {
            logoutAdmin();
        }
    } catch (err) {
        console.warn('[Admin InitAuth Network Warning]:', err);
        // On network timeout / offline: maintain persistent login!
        adminToken = savedToken;
        hideLoginModal();
        let cachedProf = null;
        try { cachedProf = JSON.parse(localStorage.getItem('lpuquick_admin_profile')); } catch(e) {}
        if (cachedProf) {
            currentAdminProfile = cachedProf;
            applyAdminRolePermissions(cachedProf);
        }
    }
}
initAdminAuth();
updateSoundUI();
checkPushStatus();
updateAdminNotificationsUI();

// Periodic background sync fallback (every 120 seconds when authenticated & visible, preserving Vercel & Supabase free tier)
setInterval(() => {
    if (!adminToken || (typeof document !== 'undefined' && document.hidden)) return;
    if (activeView === 'dashboard' && !adminSupabaseSubscribed) loadDashboard();
    else if (activeView === 'inventory' && !adminSupabaseSubscribed) loadInventory(false);
    else if (activeView === 'products' && !adminSupabaseSubscribed) loadProducts(false);
    syncAdminNotificationsFromServer().catch(() => {});
}, 120000);

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && adminToken) {
            syncAdminNotificationsFromServer().catch(() => {});
        }
    });
}

// ==========================================
// FINANCIAL INTELLIGENCE & PIN SECURITY CONTROLLER
// ==========================================
let financialToken = null;
try {
    financialToken = sessionStorage.getItem('lpuquick_financial_token');
} catch (e) { }
let financialTimerInterval = null;
let isFinancialConfigured = false;

async function checkFinancialStatus() {
    const finCard = document.getElementById('financial-security-card');
    if (!adminToken || !isPlatformOwner()) {
        if (finCard) finCard.classList.add('hidden');
        return;
    }
    if (finCard) finCard.classList.remove('hidden');

    try {
        const res = await fetch('/api/admin/financial/status', {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-token': adminToken,
                ...(financialToken ? { 'X-Financial-Token': financialToken } : {})
            }
        });
        const data = await res.json();
        if (data.success) {
            isFinancialConfigured = data.configured;
            updateFinancialUI(data);
            if (data.is_unlocked && financialToken) {
                fetchFinancialData();
                if (activeView === 'daily-revenue') {
                    loadDailyRevenueView();
                }
            } else if (!data.is_unlocked) {
                financialToken = null;
                try { sessionStorage.removeItem('lpuquick_financial_token'); } catch (e) { }
                if (activeView === 'daily-revenue') {
                    loadDailyRevenueView();
                }
            }
        }
    } catch (e) {
        console.error('Error checking financial status:', e);
    }
}

function updateFinancialUI(status) {
    const badge = document.getElementById('fin-badge');
    const desc = document.getElementById('fin-status-desc');
    const icon = document.getElementById('fin-status-icon');
    const valRev = document.getElementById('fin-val-revenue');
    const valProf = document.getElementById('fin-val-profit');
    const timerLabel = document.getElementById('fin-timer-label');
    const btnRelock = document.getElementById('btn-manual-relock');
    const btnUnlock = document.getElementById('btn-unlock-fin');
    const btnUnlockText = document.getElementById('btn-unlock-fin-text');

    if (!badge || !valRev || !valProf) return;

    if (status.is_unlocked && financialToken) {
        badge.textContent = '🔓 UNLOCKED';
        badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20';
        if (icon) {
            icon.innerHTML = '<span class="material-symbols-outlined text-xl">lock_open</span>';
            icon.className = 'w-10 h-10 rounded-2xl bg-emerald/10 text-emerald flex items-center justify-center font-bold';
        }
        if (desc) desc.textContent = 'Revenue & Profit decrypted for authorized active session.';
        if (btnUnlock) btnUnlock.classList.add('hidden');
        if (btnRelock) btnRelock.classList.remove('hidden');

        startFinancialTimer(status.expires_in_seconds);
    } else {
        badge.textContent = '🔒 LOCKED';
        badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20';
        if (icon) {
            icon.innerHTML = '<span class="material-symbols-outlined text-xl">lock</span>';
            icon.className = 'w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold';
        }
        if (desc) {
            desc.textContent = isFinancialConfigured
                ? 'Revenue & Profit figures are encrypted with PIN security.'
                : 'Financial PIN not configured. Tap PIN Setup to create one.';
        }
        valRev.textContent = '🔒 ••••••';
        valProf.textContent = '🔒 ••••••';
        if (timerLabel) timerLabel.textContent = 'Auto-lock active (Locked)';
        if (btnRelock) btnRelock.classList.add('hidden');
        if (btnUnlock) {
            btnUnlock.classList.remove('hidden');
            if (btnUnlockText) btnUnlockText.textContent = isFinancialConfigured ? 'Unlock with PIN' : 'Set Up PIN';
        }
        stopFinancialTimer();
    }
}

async function fetchFinancialData() {
    if (!adminToken || !financialToken || !isPlatformOwner()) return;
    try {
        const res = await fetch('/api/admin/financial/data', {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-token': adminToken,
                'X-Financial-Token': financialToken
            }
        });
        const data = await res.json();
        if (data.success && data.metrics) {
            const valRev = document.getElementById('fin-val-revenue');
            const valProf = document.getElementById('fin-val-profit');
            const subRev = document.getElementById('fin-sub-revenue');
            const subProf = document.getElementById('fin-sub-profit');

            if (valRev) valRev.textContent = `₹${(data.metrics.total_revenue || 0).toLocaleString('en-IN')}`;
            if (valProf) valProf.textContent = `₹${(data.metrics.total_profit || 0).toLocaleString('en-IN')}`;
            if (subRev) {
                const count = data.metrics.delivered_orders_count !== undefined
                    ? data.metrics.delivered_orders_count
                    : (data.metrics.completed_orders_count || 0);
                subRev.textContent = `From ${count} delivered orders`;
                subRev.classList.remove('hidden');
            }
            if (subProf) {
                const margin = data.metrics.profit_margin || 0;
                subProf.textContent = `${margin}% Net platform margin`;
                subProf.classList.remove('hidden');
            }
        } else if (data.locked) {
            financialToken = null;
            checkFinancialStatus();
        }
    } catch (e) {
        console.error('Error fetching financial data:', e);
    }
}

function startFinancialTimer(seconds) {
    stopFinancialTimer();
    let remaining = seconds || 900;
    const timerLabel = document.getElementById('fin-timer-label');

    function updateLabel() {
        if (!timerLabel) return;
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerLabel.textContent = `Expires in ${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    updateLabel();
    financialTimerInterval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
            stopFinancialTimer();
            financialToken = null;
            showToast('Financial session expired. Data relocked.', 'warning');
            checkFinancialStatus();
        } else {
            updateLabel();
        }
    }, 1000);
}

function stopFinancialTimer() {
    if (financialTimerInterval) {
        clearInterval(financialTimerInterval);
        financialTimerInterval = null;
    }
}

// Modal open/close handlers
window.openFinancialUnlockModal = function () {
    if (!isFinancialConfigured) {
        openFinancialSetupModal();
        return;
    }
    const modal = document.getElementById('modal-fin-unlock');
    const input = document.getElementById('input-fin-pin');
    const err = document.getElementById('fin-unlock-error');
    if (err) err.classList.add('hidden');
    if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
    }
    if (modal) modal.classList.remove('hidden');
};

window.closeFinancialUnlockModal = function () {
    const modal = document.getElementById('modal-fin-unlock');
    if (modal) modal.classList.add('hidden');
};

window.openFinancialSetupModal = function () {
    const modal = document.getElementById('modal-fin-setup');
    const currentGroup = document.getElementById('fin-setup-current-group');
    const title = document.getElementById('fin-setup-modal-title');
    const err = document.getElementById('fin-setup-error');
    const succ = document.getElementById('fin-setup-success');

    if (err) err.classList.add('hidden');
    if (succ) succ.classList.add('hidden');

    if (currentGroup) {
        if (isFinancialConfigured) {
            currentGroup.classList.remove('hidden');
            if (title) title.textContent = 'Change Financial PIN';
        } else {
            currentGroup.classList.add('hidden');
            if (title) title.textContent = 'Set Up Financial PIN';
        }
    }

    const newPinEl = document.getElementById('input-fin-new-pin');
    const confPinEl = document.getElementById('input-fin-confirm-pin');
    const curPin = document.getElementById('input-fin-current-pin');

    if (newPinEl) newPinEl.value = '';
    if (confPinEl) confPinEl.value = '';
    if (curPin) curPin.value = '';

    if (modal) modal.classList.remove('hidden');
};

window.closeFinancialSetupModal = function () {
    const modal = document.getElementById('modal-fin-setup');
    if (modal) modal.classList.add('hidden');
};

window.submitFinancialUnlock = async function (e) {
    if (e) e.preventDefault();
    const pin = document.getElementById('input-fin-pin')?.value?.trim();
    const err = document.getElementById('fin-unlock-error');
    const btn = document.getElementById('btn-submit-fin-unlock');

    if (!pin) {
        if (err) {
            err.textContent = 'Please enter your 4-6 digit PIN';
            err.classList.remove('hidden');
        }
        return;
    }

    if (btn) btn.disabled = true;
    try {
        const res = await fetch('/api/admin/financial/unlock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-token': adminToken
            },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();
        if (data.success && data.financial_token) {
            financialToken = data.financial_token;
            try { sessionStorage.setItem('lpuquick_financial_token', financialToken); } catch (e) { }
            closeFinancialUnlockModal();
            showToast('✓ Financial metrics unlocked successfully', 'success');
            checkFinancialStatus();
            if (activeView === 'daily-revenue') {
                loadDailyRevenueView();
            }
        } else {
            if (err) {
                err.textContent = data.error || 'Incorrect PIN';
                err.classList.remove('hidden');
            }
        }
    } catch (err2) {
        if (err) {
            err.textContent = 'Failed to connect to security server';
            err.classList.remove('hidden');
        }
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.submitFinancialSetup = async function (e) {
    if (e) e.preventDefault();
    const curPin = document.getElementById('input-fin-current-pin')?.value?.trim();
    const newPin = document.getElementById('input-fin-new-pin')?.value?.trim();
    const confirmPin = document.getElementById('input-fin-confirm-pin')?.value?.trim();
    const err = document.getElementById('fin-setup-error');
    const succ = document.getElementById('fin-setup-success');
    const btn = document.getElementById('btn-submit-fin-setup');

    if (!newPin || !confirmPin) {
        if (err) {
            err.textContent = 'Both New PIN and Confirm PIN are required';
            err.classList.remove('hidden');
        }
        return;
    }

    if (newPin !== confirmPin) {
        if (err) {
            err.textContent = 'New PIN and Confirm PIN do not match';
            err.classList.remove('hidden');
        }
        return;
    }

    if (btn) btn.disabled = true;
    try {
        const res = await fetch('/api/admin/financial/setup-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-token': adminToken
            },
            body: JSON.stringify({
                current_pin: curPin,
                new_pin: newPin,
                confirm_pin: confirmPin
            })
        });
        const data = await res.json();
        if (data.success) {
            isFinancialConfigured = true;
            if (succ) {
                succ.textContent = 'PIN configured successfully!';
                succ.classList.remove('hidden');
            }
            setTimeout(() => {
                closeFinancialSetupModal();
                showToast('✓ Financial PIN updated and secured', 'success');
                checkFinancialStatus();
            }, 1000);
        } else {
            if (err) {
                err.textContent = data.error || 'Failed to update PIN';
                err.classList.remove('hidden');
            }
        }
    } catch (err2) {
        if (err) {
            err.textContent = 'Server connection error';
            err.classList.remove('hidden');
        }
    } finally {
        if (btn) btn.disabled = false;
    }
};

window.lockFinancialData = async function () {
    if (!adminToken) return;
    try {
        await fetch('/api/admin/financial/lock', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-admin-token': adminToken,
                ...(financialToken ? { 'X-Financial-Token': financialToken } : {})
            }
        });
    } catch (e) { }
    financialToken = null;
    try { sessionStorage.removeItem('lpuquick_financial_token'); } catch (e) { }
    showToast('Financial data locked', 'info');
    checkFinancialStatus();
    if (activeView === 'daily-revenue') {
        loadDailyRevenueView();
    }
};

// Event Listeners for Financial Controls
document.getElementById('btn-unlock-fin')?.addEventListener('click', () => window.openFinancialUnlockModal());
document.getElementById('btn-configure-fin-pin')?.addEventListener('click', () => window.openFinancialSetupModal());
document.getElementById('btn-manual-relock')?.addEventListener('click', () => window.lockFinancialData());

// ============================================================
// DAILY REVENUE & NET PROFIT INTELLIGENCE (OWNER ONLY)
// ============================================================
let currentDailyRevenueFilter = {
    range: 'all',
    startDate: null,
    endDate: null,
    hostel_id: 'ALL'
};
let cachedDailyRevenueData = null;

window.handleDailyRevenuePinAction = function () {
    if (financialToken) {
        if (confirm('Financial intelligence is currently unlocked. Do you want to relock financial metrics immediately?')) {
            window.lockFinancialData();
        }
    } else {
        window.openFinancialUnlockModal();
    }
};

window.setDailyRevenueFilter = function (range) {
    currentDailyRevenueFilter.range = range;
    currentDailyRevenueFilter.startDate = null;
    currentDailyRevenueFilter.endDate = null;

    const startInput = document.getElementById('dr-filter-start-date');
    const endInput = document.getElementById('dr-filter-end-date');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    document.querySelectorAll('#dr-filter-pills .dr-pill-btn').forEach(btn => {
        const isTarget = btn.dataset.drRange === range;
        btn.classList.toggle('active', isTarget);
        if (isTarget) {
            btn.className = 'dr-pill-btn active px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap bg-emerald-700 text-white border-emerald-700';
        } else {
            btn.className = 'dr-pill-btn px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap bg-[#f1f4f7] text-[#5c5f60] border-transparent hover:bg-[#e4e7eb]';
        }
    });

    loadDailyRevenueView();
};

window.applyCustomDailyRevenueFilter = function () {
    const startInput = document.getElementById('dr-filter-start-date');
    const endInput = document.getElementById('dr-filter-end-date');
    const start = startInput?.value?.trim();
    const end = endInput?.value?.trim();

    if (!start && !end) {
        showToast('Please select at least a start or end date', 'warning');
        return;
    }

    currentDailyRevenueFilter.range = 'custom';
    currentDailyRevenueFilter.startDate = start || null;
    currentDailyRevenueFilter.endDate = end || null;

    document.querySelectorAll('#dr-filter-pills .dr-pill-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.className = 'dr-pill-btn px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap bg-[#f1f4f7] text-[#5c5f60] border-transparent hover:bg-[#e4e7eb]';
    });

    loadDailyRevenueView();
};

window.filterDailyRevenueTable = function (query) {
    const q = (query || '').trim().toLowerCase();
    const rows = document.querySelectorAll('#dr-days-tbody > tr.dr-day-row');
    let visibleCount = 0;

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = !q || text.includes(q);
        row.style.display = matches ? '' : 'none';
        const dateKey = row.dataset.dateKey;
        const detailRow = document.getElementById(`dr-orders-row-${dateKey}`);
        if (detailRow && !matches) {
            detailRow.style.display = 'none';
        }
        if (matches) visibleCount++;
    });

    const countLabel = document.getElementById('dr-days-count-label');
    if (countLabel) {
        countLabel.textContent = q ? `Filtered to ${visibleCount} matching day(s)` : `Showing ${rows.length} recorded delivery date(s)`;
    }
};

window.toggleDailyOrdersDrawer = function (dateKey) {
    const detailRow = document.getElementById(`dr-orders-row-${dateKey}`);
    const toggleBtn = document.getElementById(`dr-toggle-btn-${dateKey}`);
    const icon = toggleBtn?.querySelector('.material-symbols-outlined');

    if (!detailRow) return;
    const isHidden = detailRow.classList.contains('hidden');

    if (isHidden) {
        detailRow.classList.remove('hidden');
        if (icon) icon.textContent = 'expand_less';
        if (toggleBtn) {
            toggleBtn.classList.add('bg-emerald-100', 'text-emerald-900');
        }
    } else {
        detailRow.classList.add('hidden');
        if (icon) icon.textContent = 'expand_more';
        if (toggleBtn) {
            toggleBtn.classList.remove('bg-emerald-100', 'text-emerald-900');
        }
    }
};

async function loadDailyRevenueView(forceRefresh = false) {
    if (!isPlatformOwner()) {
        showToast('Access restricted: Daily Revenue is owner-confidential', 'error');
        switchView('dashboard');
        return;
    }

    const lockedCard = document.getElementById('dr-locked-card');
    const unlockedContainer = document.getElementById('dr-unlocked-container');
    const pinBtn = document.getElementById('dr-btn-pin-toggle');
    const pinIcon = document.getElementById('dr-pin-icon');
    const pinText = document.getElementById('dr-pin-text');
    const tbody = document.getElementById('dr-days-tbody');

    // Update PIN status button display
    if (financialToken) {
        if (pinBtn) {
            pinBtn.className = 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full px-3.5 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-all shadow-xs';
        }
        if (pinIcon) pinIcon.textContent = 'lock_open';
        if (pinText) pinText.textContent = 'PIN Unlocked';
    } else {
        if (pinBtn) {
            pinBtn.className = 'bg-[#f1f4f7] hover:bg-[#e0e3e6] border border-[#DADCE0] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#3c4043] flex items-center gap-1.5 transition-all shadow-xs';
        }
        if (pinIcon) pinIcon.textContent = 'lock';
        if (pinText) pinText.textContent = 'PIN Locked';
    }

    // Build URL query parameters
    const params = new URLSearchParams();
    if (currentDailyRevenueFilter.range) params.set('range', currentDailyRevenueFilter.range);
    if (currentDailyRevenueFilter.startDate) params.set('startDate', currentDailyRevenueFilter.startDate);
    if (currentDailyRevenueFilter.endDate) params.set('endDate', currentDailyRevenueFilter.endDate);
    if (currentDailyRevenueFilter.hostel_id && currentDailyRevenueFilter.hostel_id !== 'ALL') {
        params.set('hostel_id', currentDailyRevenueFilter.hostel_id);
    }
    if (forceRefresh) params.set('_t', Date.now());

    try {
        const headers = {
            'Authorization': `Bearer ${adminToken}`,
            'x-admin-token': adminToken,
            ...(financialToken ? { 'X-Financial-Token': financialToken } : {})
        };

        const res = await fetchWithTimeout(`/api/admin/financial/daily-breakdown?${params.toString()}`, { headers }, 15000);
        const data = await res.json();

        if (data.locked) {
            // PIN authentication is required
            if (lockedCard) lockedCard.classList.remove('hidden');
            if (unlockedContainer) unlockedContainer.classList.add('hidden');
            return;
        }

        if (!data.success) {
            showToast(data.error || 'Failed to load daily revenue data', 'error');
            return;
        }

        // Successfully received daily revenue & profit data
        if (lockedCard) lockedCard.classList.add('hidden');
        if (unlockedContainer) unlockedContainer.classList.remove('hidden');
        cachedDailyRevenueData = data;

        const drSelect = document.getElementById('dr-hostel-filter');
        if (drSelect && currentDailyRevenueFilter.hostel_id) {
            drSelect.value = currentDailyRevenueFilter.hostel_id;
        }

        // Render Campus Hostels Revenue & Orders Comparison Bento Grid
        const hostelCompGrid = document.getElementById('dr-hostel-comparison-grid');
        if (hostelCompGrid && Array.isArray(data.hostel_comparison)) {
            const currentFilterHostel = (currentDailyRevenueFilter.hostel_id || 'ALL').toUpperCase();
            hostelCompGrid.innerHTML = data.hostel_comparison.map(hc => {
                const isSelected = (currentFilterHostel !== 'ALL' && currentFilterHostel === hc.hostel_id.toUpperCase());
                const isActive = hc.status === 'ACTIVE';
                return `
                    <div onclick="selectDailyRevenueHostel('${escapeHtml(hc.hostel_id)}')"
                        class="p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${isSelected ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-sm' : 'border-[#DADCE0] bg-white hover:border-emerald-300 hover:bg-[#f7fafd]'}">
                        <div class="flex items-center justify-between">
                            <span class="font-mono font-bold text-xs ${isSelected ? 'text-emerald-800' : 'text-[#0066cc]'}">${escapeHtml(hc.hostel_id)}</span>
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                                <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
                                ${isActive ? 'ACTIVE' : 'OFF'}
                            </span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs text-[#181c1f] truncate">${escapeHtml(hc.hostel_name || hc.hostel_id)}</h4>
                            <p class="text-[10px] text-[#5c5f60]">${hc.delivered_count} delivered (${hc.orders_count} total)</p>
                        </div>
                        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span class="text-[10px] text-[#5c5f60]">Realized:</span>
                            <span class="font-bold text-sm text-[#137333]">${hc.formatted_revenue}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Bento KPI Cards
        const summary = data.summary || {};
        const elRev = document.getElementById('dr-kpi-revenue');
        const elProf = document.getElementById('dr-kpi-profit');
        const elCost = document.getElementById('dr-kpi-cost');
        const elMargin = document.getElementById('dr-kpi-margin');
        const elDelivCount = document.getElementById('dr-kpi-delivered-count');
        const elExclCount = document.getElementById('dr-kpi-excluded-count');
        const elDailyAvg = document.getElementById('dr-kpi-daily-avg');
        const elAov = document.getElementById('dr-kpi-aov');

        if (elRev) elRev.textContent = summary.formatted_total_revenue || '₹0';
        if (elProf) elProf.textContent = summary.formatted_total_profit || '₹0';
        if (elCost) elCost.textContent = `Cost: ${summary.formatted_total_cost || '₹0'}`;
        if (elMargin) elMargin.textContent = `${summary.overall_profit_margin || 0}%`;
        if (elDelivCount) elDelivCount.textContent = `${summary.total_delivered_orders || 0} Delivered`;
        if (elExclCount) {
            const excl = summary.total_cancelled_orders || 0;
            elExclCount.textContent = `${excl} cancelled/non-delivered excluded (₹0)`;
        }
        if (elDailyAvg) elDailyAvg.textContent = `${summary.formatted_average_daily_revenue || '₹0'}/day`;
        if (elAov) elAov.textContent = `AOV: ${summary.formatted_average_order_value || '₹0'}`;

        // Render UPI vs Cash KPI Cards
        const elUpiRev = document.getElementById('dr-kpi-upi-revenue');
        const elUpiCount = document.getElementById('dr-kpi-upi-count');
        const elUpiPct = document.getElementById('dr-kpi-upi-pct');
        const elCashRev = document.getElementById('dr-kpi-cash-revenue');
        const elCashCount = document.getElementById('dr-kpi-cash-count');
        const elCashPct = document.getElementById('dr-kpi-cash-pct');

        if (elUpiRev) elUpiRev.textContent = summary.formatted_upi_revenue || '₹0';
        if (elUpiCount) elUpiCount.textContent = `${summary.upi_count || 0} orders`;
        if (elUpiPct) elUpiPct.textContent = `${summary.upi_pct || 0}%`;
        if (elCashRev) elCashRev.textContent = summary.formatted_cash_revenue || '₹0';
        if (elCashCount) elCashCount.textContent = `${summary.cash_count || 0} orders`;
        if (elCashPct) elCashPct.textContent = `${summary.cash_pct || 0}%`;

        // Render Day-wise breakdown table
        const days = data.days || [];
        const countLabel = document.getElementById('dr-days-count-label');
        if (countLabel) {
            countLabel.textContent = `Showing ${days.length} recorded delivery date(s)`;
        }

        if (!tbody) return;
        if (days.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="py-12 text-center text-[#5c5f60]">
                        <span class="material-symbols-outlined text-4xl text-slate-300 block mb-2">event_busy</span>
                        <p class="font-bold text-sm text-[#181c1f]">No successful deliveries in selected date range</p>
                        <p class="text-xs text-[#5c5f60] mt-1">Try selecting "All Time" or adjusting the date filters.</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        for (const d of days) {
            const isToday = d.is_today;
            const isYesterday = d.is_yesterday;
            const badgeHtml = isToday
                ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">TODAY</span>`
                : (isYesterday
                    ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">YESTERDAY</span>`
                    : '');

            const marginBadgeClass = d.profit_margin >= 30
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : (d.profit_margin >= 15 ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200');

            // Audit column showing delivered count and excluded non-delivered
            const auditBadge = `
                <div class="flex items-center justify-center gap-1.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ ${d.delivered_count} Delivered
                    </span>
                    ${d.cancelled_count > 0 ? `
                    <span class="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title="Strictly excluded from revenue and profit">
                        ✕ ${d.cancelled_count} Excluded
                    </span>` : ''}
                </div>
            `;

            // Render main day row
            html += `
                <tr class="dr-day-row hover:bg-[#f8fafd] transition-colors" data-date-key="${d.date}">
                    <td class="py-3 px-3">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-[#181c1f]">${d.display_date}</span>
                            ${badgeHtml}
                        </div>
                        <span class="text-[10px] text-[#5c5f60] font-mono">${d.date}</span>
                    </td>
                    <td class="py-3 px-3 text-center">${auditBadge}</td>
                    <td class="py-3 px-3 text-right font-bold text-[#181c1f] text-sm">${d.formatted_revenue}</td>
                    <td class="py-3 px-3 text-right text-[#5c5f60] font-medium text-xs">${d.formatted_cost}</td>
                    <td class="py-3 px-3 text-right font-black text-emerald-700 text-sm">${d.formatted_profit}</td>
                    <td class="py-3 px-3 text-center">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${marginBadgeClass}">
                            ${d.profit_margin}%
                        </span>
                    </td>
                    <td class="py-3 px-3 text-right text-[#5c5f60] font-medium text-xs">${d.formatted_aov}</td>
                    <td class="py-3 px-3 text-center">
                        <button onclick="toggleDailyOrdersDrawer('${d.date}')" id="dr-toggle-btn-${d.date}"
                            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#3c4043] hover:bg-[#ebeef2] border border-[#DADCE0] transition-all cursor-pointer active:scale-95"
                            title="Inspect itemized orders for this date">
                            <span>${d.delivered_count} order${d.delivered_count !== 1 ? 's' : ''}</span>
                            <span class="material-symbols-outlined text-[16px]">expand_more</span>
                        </button>
                    </td>
                </tr>
            `;

            // Render expandable order drilldown accordion row
            const orderList = d.orders || [];
            let orderRowsHtml = '';

            if (orderList.length === 0) {
                orderRowsHtml = `<div class="p-3 text-center text-xs text-[#5c5f60]">No individual order items recorded.</div>`;
            } else {
                for (const o of orderList) {
                    const itemsDesc = (o.items || []).map(it => `${it.quantity}x ${it.name} (Sell: ₹${it.unit_price} | Cost: ₹${it.cost_price} | Profit: ₹${it.profit})`).join(' • ');
                    orderRowsHtml += `
                        <div class="bg-white rounded-xl p-3 border border-[#DADCE0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-emerald-300 transition-colors">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-mono font-bold text-xs text-[#181c1f]">${o.id}</span>
                                    <span class="text-[10px] bg-slate-100 text-[#5c5f60] font-semibold px-2 py-0.5 rounded-full">${o.time_ist || ''}</span>
                                    <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold ${o.payment_type === 'Cash' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}">${o.payment_type === 'Cash' ? '💵 Cash' : '📱 UPI'}</span>
                                    <span class="text-xs font-bold text-[#181c1f] truncate">${escapeHtml(o.customer_name)}</span>
                                    <span class="text-[11px] text-[#5c5f60] truncate">${escapeHtml(o.delivery_address || '')}</span>
                                </div>
                                <p class="text-[11px] text-[#5c5f60] mt-1 line-clamp-2">${itemsDesc || 'Campus store package'}</p>
                            </div>
                            <div class="flex items-center gap-4 shrink-0 justify-end sm:text-right">
                                <div>
                                    <p class="text-[10px] text-[#5c5f60] uppercase font-bold">Revenue</p>
                                    <p class="text-xs font-bold text-[#181c1f]">₹${o.revenue}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-[#5c5f60] uppercase font-bold">Cost</p>
                                    <p class="text-xs font-medium text-[#5c5f60]">₹${o.cost}</p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-emerald-800 uppercase font-bold">Profit</p>
                                    <p class="text-xs font-black text-emerald-700">₹${o.profit}</p>
                                </div>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    ${o.margin_pct}%
                                </span>
                            </div>
                        </div>
                    `;
                }
            }

            html += `
                <tr id="dr-orders-row-${d.date}" class="hidden bg-[#f4f7fa] border-b border-[#DADCE0]">
                    <td colspan="8" class="p-4">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between mb-1 text-xs">
                                <span class="font-bold text-[#262a2d] flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-sm text-emerald-600">receipt</span>
                                    Delivered Orders for ${d.display_date} (${orderList.length})
                                </span>
                                <span class="text-[10px] text-[#5c5f60]">All amounts in Indian Rupee (INR)</span>
                            </div>
                            <div class="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                                ${orderRowsHtml}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = html;
    } catch (err) {
        console.error('Error loading daily revenue view:', err);
        showToast('Network error loading daily revenue', 'error');
    }
}

// ============================================================
// ADVERTISEMENTS & PROMOTIONAL POSTERS ENGINE (ADMIN PANEL)
// ============================================================
let adminPosters = [];
let adminCarouselDelay = 4500;
let adminCarouselAutoplay = true;
let adminCurrentSlide = 0;
let adminSlideInterval = null;
let isCarouselHovered = false;

const ADMIN_GRADIENT_THEMES = {
    emerald: {
        bg: 'linear-gradient(135deg, rgba(6, 78, 59, 0.96) 0%, rgba(4, 120, 87, 0.92) 50%, rgba(16, 185, 129, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(52, 211, 153, 0.35), transparent 65%)',
        pillClass: 'text-emerald-300 bg-black/35 border border-emerald-400/35',
        dot: '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>',
        badgeClass: 'bg-emerald-400/25 text-white border border-emerald-300/30',
        subtitleClass: 'text-emerald-100/95',
        btnColor: '#047857'
    },
    purple: {
        bg: 'linear-gradient(135deg, rgba(59, 7, 100, 0.96) 0%, rgba(88, 28, 135, 0.92) 50%, rgba(126, 34, 206, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(192, 132, 252, 0.4), transparent 65%)',
        pillClass: 'text-purple-200 bg-black/35 border border-purple-400/35',
        dot: '<span class="text-purple-300">🌙</span>',
        badgeClass: 'bg-purple-400/25 text-white border border-purple-300/30',
        subtitleClass: 'text-purple-100/95',
        btnColor: '#581c87'
    },
    amber: {
        bg: 'linear-gradient(135deg, rgba(120, 53, 15, 0.96) 0%, rgba(180, 83, 9, 0.92) 50%, rgba(217, 119, 6, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(251, 191, 36, 0.4), transparent 65%)',
        pillClass: 'text-amber-200 bg-black/35 border border-amber-400/35',
        dot: '<span class="text-amber-300">⚡</span>',
        badgeClass: 'bg-amber-400/25 text-white border border-amber-300/30',
        subtitleClass: 'text-amber-100/95',
        btnColor: '#b45309'
    },
    cyan: {
        bg: 'linear-gradient(135deg, rgba(8, 51, 68, 0.96) 0%, rgba(14, 116, 144, 0.92) 50%, rgba(6, 182, 212, 0.88) 100%), radial-gradient(ellipse at 85% 20%, rgba(103, 232, 249, 0.4), transparent 65%)',
        pillClass: 'text-cyan-200 bg-black/35 border border-cyan-400/35',
        dot: '<span class="text-cyan-300">🛡️</span>',
        badgeClass: 'bg-cyan-400/25 text-white border border-cyan-300/30',
        subtitleClass: 'text-cyan-100/95',
        btnColor: '#0e7490'
    }
};

function getAdminGradientTheme(poster, index) {
    const keys = ['emerald', 'purple', 'amber', 'cyan'];
    const key = (poster.gradient && ADMIN_GRADIENT_THEMES[poster.gradient])
        ? poster.gradient
        : keys[index % keys.length];
    return { key, ...(ADMIN_GRADIENT_THEMES[key] || ADMIN_GRADIENT_THEMES.emerald) };
}

const DEFAULT_ADMIN_POSTERS = [
    {
        id: 'banner_default_1',
        title: 'Corridor Express Snacks & Munchies',
        subtitle: 'Instant noodles, chilled drinks, and snacks delivered right to your hostel room door in 3 minutes.',
        badge: '⚡ 3-MIN ROOM DROP',
        pill: 'CAMPUS GROUND HUB',
        link_url: '#/categories',
        link_text: 'Browse Snacks',
        gradient: 'emerald',
        has_assistant_btn: true,
        image_url: '',
        is_active: true,
        display_order: 1
    },
    {
        id: 'banner_default_2',
        title: 'Late Night Study & Gaming Fuel',
        subtitle: 'Hot magiee, cold drinks, chocolate bars, and crunchy chips ready for your midnight grind.',
        badge: '🌙 TILL 3 AM',
        pill: 'MIDNIGHT FUEL',
        link_url: '#/categories',
        link_text: 'Explore Combos',
        gradient: 'purple',
        has_assistant_btn: false,
        image_url: '',
        is_active: true,
        display_order: 2
    },
    {
        id: 'banner_default_3',
        title: 'Zero Delivery Fees On Every Order',
        subtitle: 'No convenience charges, no minimum order traps. 100% calm commerce delivery.',
        badge: '🎉 ₹0 DELIVERY FEE',
        pill: 'CAMPUS PERK',
        link_url: '#shop-catalog-section',
        link_text: 'Shop Now',
        gradient: 'amber',
        has_assistant_btn: false,
        image_url: '',
        is_active: true,
        display_order: 3
    },
    {
        id: 'banner_default_4',
        title: 'Discreet Tamper-Proof Room Drop',
        subtitle: 'All hostel orders sealed in opaque bags for privacy and peace of mind.',
        badge: '🔒 HOSTEL SAFE',
        pill: '100% PRIVATE',
        link_url: '#shop-catalog-section',
        link_text: 'Order Confidentially',
        gradient: 'cyan',
        has_assistant_btn: false,
        image_url: '',
        is_active: true,
        display_order: 4
    }
];

function escapeHtmlStr(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function loadAdvertisementsView() {
    try {
        let loaded = false;
        try {
            const res = await fetch('/api/admin/advertisements', {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.posters)) {
                    adminPosters = data.posters;
                    if (data.settings) {
                        if (data.settings.autoplay_delay) {
                            adminCarouselDelay = Math.max(1000, Number(data.settings.autoplay_delay));
                        }
                        if (data.settings.autoplay_enabled !== undefined) {
                            adminCarouselAutoplay = Boolean(data.settings.autoplay_enabled);
                        }
                    }
                    loaded = true;
                }
            }
        } catch (netErr) {
            console.warn('[Advertisements] Network fetch failed, using local cache:', netErr);
        }

        if (!loaded) {
            const cachedPosters = localStorage.getItem('lpuquick_admin_posters');
            const cachedSettings = localStorage.getItem('lpuquick_admin_carousel_settings');
            if (cachedPosters) {
                try { adminPosters = JSON.parse(cachedPosters); } catch (e) { }
            }
            if (cachedSettings) {
                try {
                    const parsed = JSON.parse(cachedSettings);
                    if (parsed.autoplay_delay) adminCarouselDelay = Number(parsed.autoplay_delay);
                    if (parsed.autoplay_enabled !== undefined) adminCarouselAutoplay = Boolean(parsed.autoplay_enabled);
                } catch (e) { }
            }
            if (!adminPosters || adminPosters.length === 0) {
                adminPosters = JSON.parse(JSON.stringify(DEFAULT_ADMIN_POSTERS));
            }
        }

        // Keep sorted by display order
        adminPosters.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        // Update Slider & Delay Badges
        const slider = document.getElementById('admin-carousel-delay-slider');
        const delayBadge = document.getElementById('admin-delay-display-badge');
        const speedPill = document.getElementById('admin-carousel-speed-pill');
        const delaySeconds = (adminCarouselDelay / 1000).toFixed(1);

        if (slider) slider.value = delaySeconds;
        if (delayBadge) delayBadge.textContent = `${delaySeconds} seconds`;
        if (speedPill) speedPill.textContent = `⚡ ${delaySeconds}s delay`;

        // Update Play/Pause icon
        const playPauseIcon = document.getElementById('admin-carousel-playpause-icon');
        if (playPauseIcon) {
            playPauseIcon.textContent = adminCarouselAutoplay ? 'pause' : 'play_arrow';
        }

        // Update counts
        const navBadge = document.getElementById('nav-ads-badge');
        const countBadge = document.getElementById('admin-posters-count-badge');
        const activeCount = adminPosters.filter(p => p.is_active !== false).length;
        if (navBadge) navBadge.textContent = String(adminPosters.length);
        if (countBadge) countBadge.textContent = `${adminPosters.length} poster${adminPosters.length === 1 ? '' : 's'} (${activeCount} active)`;

        // Render Slides and Grid
        renderAdminCarouselSlides();
        renderAdminPostersGrid();

        // Start Auto-sliding
        adminCurrentSlide = 0;
        updateAdminCarouselView();
        startAdminCarouselAutoSlide();

        // Attach hover & touch listeners once
        initAdminCarouselGestures();
    } catch (err) {
        console.error('[Advertisements] Error loading advertisements view:', err);
        showToast('Error loading advertisements: ' + err.message, 'warning');
    }
}

function renderAdminCarouselSlides() {
    const track = document.getElementById('admin-carousel-track');
    const dotsContainer = document.getElementById('admin-carousel-dots');
    if (!track) return;

    const activePosters = adminPosters.filter(p => p.is_active !== false);

    if (activePosters.length === 0) {
        track.innerHTML = `
            <div class="hero-carousel-slide flex-shrink-0 flex items-center justify-center p-8 text-center text-white"
                style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; min-height: 220px; background: linear-gradient(135deg, #1e293b, #0f172a);">
                <div class="space-y-2">
                    <span class="material-symbols-outlined text-4xl text-emerald-400 animate-bounce">add_photo_alternate</span>
                    <h3 class="text-lg font-bold">No Active Posters In Carousel</h3>
                    <p class="text-xs text-slate-400 max-w-sm">Add or enable image posters below to display them here with live auto-sliding.</p>
                    <button type="button" onclick="openPosterModal()" class="mt-2 px-4 py-1.5 rounded-full bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md">
                        + Add Image Poster
                    </button>
                </div>
            </div>`;
        if (dotsContainer) dotsContainer.innerHTML = '';
        const counter = document.getElementById('admin-carousel-counter');
        if (counter) counter.textContent = '0 Slides Active';
        return;
    }

    // Render each slide exactly matching customer home page aesthetic
    track.innerHTML = activePosters.map((poster, index) => {
        const isStoreAnnounce = poster.type === 'store_announce' || poster.poster_type === 'store_announce' || (poster.image_url && (poster.is_full_poster || (!poster.subtitle && !poster.pill && !poster.badge)));
        const imageUrl = poster.image_url ? poster.image_url : '';
        const linkText = escapeHtmlStr(poster.link_text || 'Shop Now');
        const showButton = poster.show_button !== false && Boolean(poster.link_text && poster.link_text.trim() !== '');

        if (isStoreAnnounce && imageUrl) {
            return `
                <div class="hero-carousel-slide hero-carousel-slide-announce flex-shrink-0"
                    style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; overflow: hidden; border-radius: inherit; padding: 0 !important; display: block !important; min-height: 240px; height: 240px; cursor: pointer;">
                    
                    <!-- 100% Full Edge-to-Edge Poster Graphic (Full poster, completely fills slide) -->
                    <img src="${imageUrl}" alt="${escapeHtmlStr(poster.title || 'Store Announcement')}"
                        class="announce-img w-full h-full object-cover object-center transition-transform duration-500 hover:scale-[1.01]"
                        style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
                        onerror="this.style.display='none'">
                    
                    ${showButton ? `
                        <div class="absolute bottom-3.5 left-4 sm:bottom-4 sm:left-6 z-10 pointer-events-auto">
                            <span class="clay-btn text-xs sm:text-sm px-4 py-1.5 sm:px-5 sm:py-2 rounded-full inline-flex items-center gap-1.5 shadow-xl font-black"
                                style="background: #ffffff !important; color: #0f172a !important; font-weight: 900 !important; border: 1px solid rgba(255,255,255,0.7) !important;">
                                <span style="color: #0f172a !important; font-weight: 900 !important;">${linkText}</span>
                                <svg class="w-3.5 h-3.5" style="color: #0f172a !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </span>
                        </div>
                    ` : ''}

                    <div class="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-none">
                        <span class="text-[9px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                            📢 Full Poster
                        </span>
                        <span class="text-[10px] font-semibold text-white/90 bg-black/60 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                            Slide #${index + 1}
                        </span>
                    </div>
                </div>`;
        }

        // Campus Promotion (Picture 1 style)
        const title = escapeHtmlStr(poster.title || 'Campus Promotion');
        const pill = escapeHtmlStr(poster.pill || 'CAMPUS PERK');
        const badge = escapeHtmlStr(poster.badge || '⚡ INSTANT DELIVERY');
        const subtitle = escapeHtmlStr(poster.subtitle || '');
        const theme = getAdminGradientTheme(poster, index);

        return `
            <div class="hero-carousel-slide hero-carousel-slide-promo flex-shrink-0"
                style="min-width: 100% !important; max-width: 100% !important; flex-shrink: 0 !important; width: 100% !important; box-sizing: border-box !important; position: relative !important; padding: 1.5rem 1.5rem 2rem 1.5rem; min-height: 230px; height: 230px; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; cursor: pointer; overflow: hidden; background: ${theme.bg};">
                
                ${imageUrl ? `
                    <img src="${imageUrl}" alt="${title}" class="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 hover:scale-105" style="filter: brightness(0.72);" onerror="this.style.display='none'">
                    <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-[1]"></div>
                ` : ''}

                <div class="space-y-2 max-w-lg z-10 relative">
                    <div class="flex items-center gap-2 flex-wrap">
                        ${pill ? `
                            <span class="clay-pill px-3 py-0.5 text-[10px] font-black ${theme.pillClass} flex items-center gap-1.5 backdrop-blur-md rounded-full">
                                ${theme.dot || ''}
                                <span>${pill}</span>
                            </span>` : ''}
                        ${badge ? `
                            <span class="liquid-badge text-[10px] font-black px-2.5 py-0.5 shadow-sm ${theme.badgeClass} backdrop-blur-md rounded-full">
                                ${badge}
                            </span>` : ''}
                    </div>
                    <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                        ${title}
                    </h2>
                    ${subtitle ? `
                        <p class="text-xs sm:text-sm ${theme.subtitleClass} font-medium leading-relaxed max-w-md drop-shadow-sm">
                            ${subtitle}
                        </p>` : ''}
                </div>

                <div class="pt-3 z-10 relative flex items-center gap-2.5">
                    <span class="clay-btn text-xs px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-md"
                        style="background: #ffffff !important; color: ${theme.btnColor} !important; font-weight: 800 !important;">
                        <span style="color: ${theme.btnColor} !important; font-weight: 800 !important;">${linkText}</span>
                        <svg class="w-3.5 h-3.5" style="color: ${theme.btnColor} !important;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <span class="text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full ml-auto">
                        🏷️ Campus Promo
                    </span>
                    <span class="text-[10px] font-semibold text-white/80 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        Slide #${index + 1}
                    </span>
                </div>
            </div>`;
    }).join('');

    // Render dots
    if (dotsContainer) {
        dotsContainer.innerHTML = activePosters.map((_, idx) => `
            <button type="button" class="hero-carousel-dot ${idx === adminCurrentSlide ? 'active' : ''}"
                onclick="goToAdminSlide(${idx})"
                data-slide-index="${idx}"
                aria-label="Slide ${idx + 1}"
                style="width: ${idx === adminCurrentSlide ? '22px' : '8px'}; height: 8px; border-radius: 9999px; background: ${idx === adminCurrentSlide ? '#ffffff' : 'rgba(255,255,255,0.45)'}; transition: all 0.25s ease; border: none; cursor: pointer;"></button>
        `).join('');
    }
}

function updateAdminCarouselView() {
    const track = document.getElementById('admin-carousel-track');
    if (!track) return;

    const activePosters = adminPosters.filter(p => p.is_active !== false);
    const totalSlides = activePosters.length;

    if (totalSlides <= 1) {
        adminCurrentSlide = 0;
        track.style.transform = 'translateX(0%)';
    } else {
        if (adminCurrentSlide >= totalSlides) adminCurrentSlide = 0;
        if (adminCurrentSlide < 0) adminCurrentSlide = totalSlides - 1;
        track.style.transform = `translateX(-${adminCurrentSlide * 100}%)`;
    }

    // Update dots
    const dots = document.querySelectorAll('#admin-carousel-dots .hero-carousel-dot');
    dots.forEach((dot, idx) => {
        const isActive = idx === adminCurrentSlide;
        dot.classList.toggle('active', isActive);
        dot.style.width = isActive ? '22px' : '8px';
        dot.style.background = isActive ? '#ffffff' : 'rgba(255,255,255,0.45)';
    });

    // Update Counter
    const counter = document.getElementById('admin-carousel-counter');
    if (counter) {
        counter.textContent = totalSlides > 0 ? `Slide ${adminCurrentSlide + 1} of ${totalSlides}` : '0 Slides';
    }
}

function nextAdminSlide() {
    const activePosters = adminPosters.filter(p => p.is_active !== false);
    if (activePosters.length <= 1) return;
    adminCurrentSlide = (adminCurrentSlide + 1) % activePosters.length;
    updateAdminCarouselView();
}

function prevAdminSlide() {
    const activePosters = adminPosters.filter(p => p.is_active !== false);
    if (activePosters.length <= 1) return;
    adminCurrentSlide = (adminCurrentSlide - 1 + activePosters.length) % activePosters.length;
    updateAdminCarouselView();
}

function goToAdminSlide(idx) {
    adminCurrentSlide = idx;
    updateAdminCarouselView();
    if (adminCarouselAutoplay && !isCarouselHovered) {
        startAdminCarouselAutoSlide();
    }
}

function startAdminCarouselAutoSlide() {
    stopAdminCarouselAutoSlide();
    const activePosters = adminPosters.filter(p => p.is_active !== false);
    if (!adminCarouselAutoplay || activePosters.length <= 1 || isCarouselHovered) return;

    const delay = Math.max(1000, Number(adminCarouselDelay) || 4500);
    adminSlideInterval = setInterval(nextAdminSlide, delay);
}

function stopAdminCarouselAutoSlide() {
    if (adminSlideInterval) {
        clearInterval(adminSlideInterval);
        adminSlideInterval = null;
    }
}

function toggleAdminCarouselAutoplay() {
    adminCarouselAutoplay = !adminCarouselAutoplay;
    const icon = document.getElementById('admin-carousel-playpause-icon');
    if (icon) icon.textContent = adminCarouselAutoplay ? 'pause' : 'play_arrow';

    if (adminCarouselAutoplay) {
        startAdminCarouselAutoSlide();
        showToast('Auto-sliding resumed', 'info');
    } else {
        stopAdminCarouselAutoSlide();
        showToast('Auto-sliding paused for review', 'info');
    }
}

let adminDelaySaveTimer = null;

function handleAdminDelaySlider(val) {
    const sec = Math.max(1.0, Math.min(12.0, Number(val)));
    adminCarouselDelay = Math.round(sec * 1000);

    const delayBadge = document.getElementById('admin-delay-display-badge');
    const speedPill = document.getElementById('admin-carousel-speed-pill');

    if (delayBadge) delayBadge.textContent = `${sec.toFixed(1)} seconds`;
    if (speedPill) speedPill.textContent = `⚡ ${sec.toFixed(1)}s delay`;

    // Restart timer with new delay immediately
    if (adminCarouselAutoplay && !isCarouselHovered) {
        startAdminCarouselAutoSlide();
    }

    // Auto-save quietly after 700ms so changes sync in real-time even without clicking save
    clearTimeout(adminDelaySaveTimer);
    adminDelaySaveTimer = setTimeout(() => {
        saveAdminCarouselSettingsQuietly();
    }, 700);
}

function setAdminDelayPreset(sec) {
    const slider = document.getElementById('admin-carousel-delay-slider');
    if (slider) slider.value = sec;
    handleAdminDelaySlider(sec);
}

async function saveAdminCarouselSettingsQuietly() {
    try {
        const payload = {
            autoplay_delay: adminCarouselDelay,
            autoplay_enabled: adminCarouselAutoplay
        };
        localStorage.setItem('lpuquick_admin_carousel_settings', JSON.stringify(payload));
        notifyLocalAdsUpdated();

        await fetch('/api/admin/advertisements/settings', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (e) { }
}

async function saveAdminCarouselSettings() {
    clearTimeout(adminDelaySaveTimer);
    try {
        const payload = {
            autoplay_delay: adminCarouselDelay,
            autoplay_enabled: adminCarouselAutoplay
        };

        localStorage.setItem('lpuquick_admin_carousel_settings', JSON.stringify(payload));
        notifyLocalAdsUpdated();

        try {
            await fetch('/api/admin/advertisements/settings', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (netErr) {
            console.warn('[Advertisements] Server settings save offline fallback:', netErr);
        }

        const sec = (adminCarouselDelay / 1000).toFixed(1);
        showToast(`✓ Carousel sliding delay saved at ${sec} seconds!`, 'success');
    } catch (err) {
        showToast('Failed to save settings: ' + err.message, 'warning');
    }
}

let adminCarouselGesturesAttached = false;
function initAdminCarouselGestures() {
    if (adminCarouselGesturesAttached) return;
    const carouselEl = document.getElementById('admin-hero-banner-carousel');
    if (!carouselEl) return;

    adminCarouselGesturesAttached = true;

    carouselEl.addEventListener('mouseenter', () => {
        isCarouselHovered = true;
        stopAdminCarouselAutoSlide();
    });

    carouselEl.addEventListener('mouseleave', () => {
        isCarouselHovered = false;
        if (adminCarouselAutoplay) startAdminCarouselAutoSlide();
    });

    let touchStart = 0;
    carouselEl.addEventListener('touchstart', (e) => {
        touchStart = e.changedTouches[0].screenX;
        stopAdminCarouselAutoSlide();
    }, { passive: true });

    carouselEl.addEventListener('touchend', (e) => {
        const touchEnd = e.changedTouches[0].screenX;
        if (touchStart - touchEnd > 45) nextAdminSlide();
        else if (touchEnd - touchStart > 45) prevAdminSlide();
        if (adminCarouselAutoplay && !isCarouselHovered) startAdminCarouselAutoSlide();
    }, { passive: true });
}

function renderAdminPostersGrid() {
    const grid = document.getElementById('admin-posters-grid');
    if (!grid) return;

    if (adminPosters.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-dashed border-[#DADCE0]">
                <span class="material-symbols-outlined text-4xl text-slate-400">image_not_supported</span>
                <p class="font-bold text-sm text-[#181c1f] mt-1">No posters added yet</p>
                <p class="text-xs text-[#5c5f60] mb-3">Upload your first promotional banner poster image.</p>
                <button type="button" onclick="openPosterModal()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm">
                    + Upload First Poster
                </button>
            </div>`;
        return;
    }

    let cardsHtml = adminPosters.map((poster, index) => {
        const isStoreAnnounce = poster.type === 'store_announce' || poster.poster_type === 'store_announce' || (poster.image_url && (poster.is_full_poster || (!poster.subtitle && !poster.pill && !poster.badge)));
        const title = escapeHtmlStr(poster.title || (isStoreAnnounce ? 'Store Announcement' : 'Untitled Poster'));
        const badge = escapeHtmlStr(poster.badge || '');
        const pill = escapeHtmlStr(poster.pill || '');
        const subtitle = escapeHtmlStr(poster.subtitle || '');
        const imageUrl = poster.image_url ? poster.image_url : '';
        const isActive = poster.is_active !== false;
        const theme = getAdminGradientTheme(poster, index);

        return `
            <div class="bg-white rounded-2xl border ${isActive ? 'border-[#DADCE0]' : 'border-dashed border-slate-300 opacity-75'} shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md group">
                <!-- Thumbnail with Status Badges -->
                <div class="relative w-full h-36 overflow-hidden flex items-center justify-center p-2.5" style="background: ${isStoreAnnounce ? '#090d16' : theme.bg};">
                    ${(isStoreAnnounce && imageUrl) ? `
                        <img src="${imageUrl}" alt="${title}" class="absolute inset-0 w-full h-full object-cover blur-md opacity-35 pointer-events-none" aria-hidden="true" onerror="this.style.display='none'">
                        <img src="${imageUrl}" alt="${title}" class="relative z-[2] w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" onerror="this.style.display='none'">
                    ` : (imageUrl ? `
                        <img src="${imageUrl}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.style.display='none'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>
                    ` : `
                        <div class="space-y-1 text-center z-10">
                            <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${theme.badgeClass}">${badge || theme.key.toUpperCase()}</span>
                            <h5 class="text-xs font-bold text-white drop-shadow-sm">${title}</h5>
                        </div>
                    `)}
                    
                    <!-- Top Badges -->
                    <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                        <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-700 text-slate-300'}">
                            ${isActive ? '● ACTIVE' : '○ PAUSED'}
                        </span>
                        <div class="flex items-center gap-1">
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full ${isStoreAnnounce ? 'bg-amber-500 text-white' : 'bg-purple-600 text-white'} shadow-sm">
                                ${isStoreAnnounce ? '📢 ANNOUNCE' : '🏷️ PROMO'}
                            </span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                                #${poster.display_order || index + 1}
                            </span>
                        </div>
                    </div>

                    <!-- Bottom Overlay Text if Image is Present & Campus Promo -->
                    ${(!isStoreAnnounce && imageUrl) ? `
                        <div class="absolute bottom-2 left-2.5 right-2.5 z-10">
                            ${badge ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-xs">${badge}</span>` : ''}
                            <h4 class="font-bold text-white text-xs truncate drop-shadow-sm mt-0.5">${title}</h4>
                        </div>
                    ` : ''}
                </div>

                <!-- Body Details -->
                <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                        <div class="flex items-center justify-between text-[11px] text-[#5c5f60] mb-1">
                            <h4 class="font-bold text-[#181c1f] text-xs truncate max-w-[170px]" title="${title}">${title}</h4>
                            <span class="text-[9px] ${isStoreAnnounce ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-purple-50 text-purple-800 border border-purple-200'} px-1.5 py-0.5 rounded font-bold">
                                ${isStoreAnnounce ? '1-Button Image' : (pill || 'Campus Perk')}
                            </span>
                        </div>
                        <div class="text-[11px] text-[#74777a] truncate">
                            <span class="font-medium text-[#5c5f60]">Target:</span> ${escapeHtmlStr(poster.link_url || '#shop-catalog-section')}
                        </div>
                        ${(!isStoreAnnounce && subtitle) ? `<p class="text-[11px] text-[#5c5f60] line-clamp-2 mt-1">${subtitle}</p>` : ''}
                    </div>

                    <!-- Action Toolbar -->
                    <div class="pt-2 border-t border-[#f1f4f7] flex items-center justify-between gap-1">
                        <!-- Reorder buttons -->
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="movePosterOrder('${poster.id}', -1)" title="Move earlier in carousel"
                                class="p-1 rounded-lg border border-[#DADCE0] hover:bg-[#f1f4f7] text-[#5c5f60] text-xs flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm">arrow_upward</span>
                            </button>
                            <button type="button" onclick="movePosterOrder('${poster.id}', 1)" title="Move later in carousel"
                                class="p-1 rounded-lg border border-[#DADCE0] hover:bg-[#f1f4f7] text-[#5c5f60] text-xs flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm">arrow_downward</span>
                            </button>
                        </div>

                        <div class="flex items-center gap-1">
                            <!-- Toggle Active/Pause -->
                            <button type="button" onclick="togglePosterActive('${poster.id}')"
                                class="px-2.5 py-1 rounded-lg text-xs font-bold border ${isActive ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'} transition-all"
                                title="${isActive ? 'Pause poster from appearing in carousel' : 'Activate poster in carousel'}">
                                ${isActive ? 'Pause' : 'Activate'}
                            </button>

                            <!-- Edit Button -->
                            <button type="button" onclick="openPosterModal('${poster.id}')"
                                class="p-1.5 rounded-lg border border-[#DADCE0] hover:bg-[#f1f4f7] text-[#181c1f]" title="Edit poster">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>

                            <!-- Delete Button -->
                            <button type="button" onclick="quickDeletePoster('${poster.id}')"
                                class="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600" title="Delete poster">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');

    // Add New Poster Dropzone Card at end of grid
    cardsHtml += `
        <div onclick="openPosterModal()"
            class="rounded-2xl border-2 border-dashed border-[#DADCE0] hover:border-emerald-500 hover:bg-emerald-50/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[220px] group">
            <div class="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-2xl">add_photo_alternate</span>
            </div>
            <h4 class="font-bold text-xs sm:text-sm text-[#181c1f]">Upload Image Poster</h4>
            <p class="text-[11px] text-[#5c5f60] mt-1">Add new promotion to the carousel</p>
        </div>`;

    grid.innerHTML = cardsHtml;
}

// ================= POSTER MODAL (ADD / EDIT & IMAGE UPLOAD) =================
function handlePosterFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WEBP, GIF).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);

            const preview = document.getElementById('poster-img-preview');
            const placeholder = document.getElementById('poster-img-placeholder');
            const removeBtn = document.getElementById('btn-remove-poster-img');
            const urlInput = document.getElementById('form-poster-image-url');

            if (preview) {
                preview.src = compressed;
                preview.classList.remove('hidden');
            }
            if (placeholder) placeholder.classList.add('hidden');
            if (removeBtn) removeBtn.classList.remove('hidden');
            if (urlInput) urlInput.value = compressed;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handlePosterUrlInput(url) {
    const trimmed = (url || '').trim();
    const preview = document.getElementById('poster-img-preview');
    const placeholder = document.getElementById('poster-img-placeholder');
    const removeBtn = document.getElementById('btn-remove-poster-img');

    if (trimmed) {
        if (preview) {
            preview.src = trimmed;
            preview.classList.remove('hidden');
        }
        if (placeholder) placeholder.classList.add('hidden');
        if (removeBtn) removeBtn.classList.remove('hidden');
    }
}

function clearPosterImage() {
    const preview = document.getElementById('poster-img-preview');
    const placeholder = document.getElementById('poster-img-placeholder');
    const removeBtn = document.getElementById('btn-remove-poster-img');
    const urlInput = document.getElementById('form-poster-image-url');
    const fileInput = document.getElementById('form-poster-file');

    if (preview) {
        preview.src = '';
        preview.classList.add('hidden');
    }
    if (placeholder) placeholder.classList.remove('hidden');
    if (removeBtn) removeBtn.classList.add('hidden');
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
}

function initPosterDropzone() {
    const box = document.getElementById('poster-img-preview-box');
    if (!box || box.dataset.dropzoneAttached) return;
    box.dataset.dropzoneAttached = 'true';

    ['dragenter', 'dragover'].forEach(eventName => {
        box.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.add('border-emerald-500', 'bg-emerald-50/40');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        box.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            box.classList.remove('border-emerald-500', 'bg-emerald-50/40');
        }, false);
    });

    box.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt?.files;
        if (files && files.length > 0) {
            handlePosterFileSelect({ target: { files: [files[0]] } });
        }
    }, false);
}

function setPosterType(type) {
    const hiddenType = document.getElementById('form-poster-type');
    if (hiddenType) hiddenType.value = type;

    const btnAnnounce = document.getElementById('btn-type-store-announce');
    const btnPromo = document.getElementById('btn-type-campus-promotion');
    const descText = document.getElementById('type-description-text');
    const storeFields = document.getElementById('store-announce-fields');
    const promoFields = document.getElementById('campus-promotion-fields');
    const labelImage = document.getElementById('label-poster-image');
    const uploadHelp = document.getElementById('upload-help-text');
    const modalTitle = document.getElementById('modal-poster-title');

    if (type === 'store_announce') {
        if (btnAnnounce) {
            btnAnnounce.className = 'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm bg-white text-emerald-700';
        }
        if (btnPromo) {
            btnPromo.className = 'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all text-slate-600 hover:text-slate-900';
        }
        if (descText) {
            descText.textContent = "Full plain image announcement with 1 button (Picture 1). Shows the complete image with zero cropping or dark overlay.";
        }
        if (storeFields) storeFields.classList.remove('hidden');
        if (promoFields) promoFields.classList.add('hidden');
        if (labelImage) {
            labelImage.innerHTML = 'Announcement Graphic Image * <span class="text-emerald-700 font-bold">(Full Image)</span>';
        }
        if (uploadHelp) {
            uploadHelp.textContent = 'PNG, JPG, WEBP, GIF (widescreen 3:1 or 16:9 banner recommended)';
        }
        if (modalTitle) {
            modalTitle.textContent = editingPosterId ? 'Edit Store Announcement' : 'Add Store Announcement';
        }
    } else {
        if (btnPromo) {
            btnPromo.className = 'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all shadow-sm bg-white text-purple-700';
        }
        if (btnAnnounce) {
            btnAnnounce.className = 'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-bold text-xs transition-all text-slate-600 hover:text-slate-900';
        }
        if (descText) {
            descText.textContent = "Styled promotional card with gradient background, badges, title, description, and button (Picture 3).";
        }
        if (storeFields) storeFields.classList.add('hidden');
        if (promoFields) promoFields.classList.remove('hidden');
        if (labelImage) {
            labelImage.innerHTML = 'Background Image <span class="text-slate-500 font-normal">(Optional background for card)</span>';
        }
        if (uploadHelp) {
            uploadHelp.textContent = 'PNG, JPG, WEBP, GIF (optional background)';
        }
        if (modalTitle) {
            modalTitle.textContent = editingPosterId ? 'Edit Campus Promotion' : 'Add Campus Promotion';
        }
    }
}

function toggleAnnounceButtonInputs(show) {
    const inputs = document.getElementById('announce-button-inputs');
    if (inputs) {
        if (show) inputs.classList.remove('opacity-40', 'pointer-events-none');
        else inputs.classList.add('opacity-40', 'pointer-events-none');
    }
}

function openPosterModal(posterId = null) {
    editingPosterId = posterId;
    const modal = document.getElementById('poster-modal');
    const delBtn = document.getElementById('btn-modal-delete-poster');

    clearPosterImage();
    initPosterDropzone();

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closePosterModal();
        };
    }

    if (posterId) {
        const poster = adminPosters.find(p => p.id === posterId);
        if (poster) {
            const isAnnounce = poster.type === 'store_announce' || poster.poster_type === 'store_announce' || (poster.image_url && (poster.is_full_poster || (!poster.subtitle && !poster.pill && !poster.badge)));
            setPosterType(isAnnounce ? 'store_announce' : 'campus_promotion');

            document.getElementById('form-poster-id').value = poster.id;

            // Store Announce fields
            const announceTitle = document.getElementById('form-poster-title-announce');
            if (announceTitle) announceTitle.value = isAnnounce ? (poster.title || '') : '';
            const announceCtaText = document.getElementById('form-poster-cta-text-announce');
            if (announceCtaText) announceCtaText.value = poster.link_text || 'Shop Now';
            const announceCtaUrl = document.getElementById('form-poster-cta-url-announce');
            if (announceCtaUrl) announceCtaUrl.value = poster.link_url || '#shop-catalog-section';
            const showBtnEl = document.getElementById('form-poster-show-button');
            const hasButton = poster.show_button !== false && Boolean(poster.link_text && poster.link_text.trim() !== '');
            if (showBtnEl) {
                showBtnEl.checked = hasButton;
                toggleAnnounceButtonInputs(hasButton);
            }

            // Campus Promo fields
            document.getElementById('form-poster-title').value = poster.title || '';
            document.getElementById('form-poster-pill').value = poster.pill || '';
            document.getElementById('form-poster-badge').value = poster.badge || '';
            document.getElementById('form-poster-subtitle').value = poster.subtitle || '';
            document.getElementById('form-poster-cta-text').value = poster.link_text || 'Explore Combos';
            document.getElementById('form-poster-cta-url').value = poster.link_url || '#/categories';
            const gradEl = document.getElementById('form-poster-gradient');
            if (gradEl) gradEl.value = poster.gradient || 'purple';

            document.getElementById('form-poster-order').value = poster.display_order || 1;
            document.getElementById('form-poster-active').checked = poster.is_active !== false;

            if (poster.image_url) {
                handlePosterUrlInput(poster.image_url);
                document.getElementById('form-poster-image-url').value = poster.image_url;
            }

            if (delBtn) delBtn.classList.remove('hidden');
        }
    } else {
        setPosterType('store_announce');
        document.getElementById('form-poster-id').value = '';

        // Store Announce defaults
        const announceTitle = document.getElementById('form-poster-title-announce');
        if (announceTitle) announceTitle.value = '';
        const announceCtaText = document.getElementById('form-poster-cta-text-announce');
        if (announceCtaText) announceCtaText.value = 'Shop Now';
        const announceCtaUrl = document.getElementById('form-poster-cta-url-announce');
        if (announceCtaUrl) announceCtaUrl.value = '#shop-catalog-section';
        const showBtnEl = document.getElementById('form-poster-show-button');
        if (showBtnEl) {
            showBtnEl.checked = true;
            toggleAnnounceButtonInputs(true);
        }

        // Campus Promo defaults
        document.getElementById('form-poster-title').value = '';
        document.getElementById('form-poster-pill').value = 'MIDNIGHT FUEL';
        document.getElementById('form-poster-badge').value = '🌙 TILL 3 AM';
        document.getElementById('form-poster-subtitle').value = '';
        document.getElementById('form-poster-cta-text').value = 'Explore Combos';
        document.getElementById('form-poster-cta-url').value = '#/categories';
        const gradEl = document.getElementById('form-poster-gradient');
        if (gradEl) gradEl.value = 'purple';

        document.getElementById('form-poster-order').value = adminPosters.length + 1;
        document.getElementById('form-poster-active').checked = true;

        if (delBtn) delBtn.classList.add('hidden');
    }

    if (modal) modal.classList.remove('hidden');
}

function closePosterModal() {
    const modal = document.getElementById('poster-modal');
    if (modal) modal.classList.add('hidden');
    editingPosterId = null;
}

async function handlePosterSubmit(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    const type = document.getElementById('form-poster-type')?.value || 'store_announce';
    const id = document.getElementById('form-poster-id')?.value.trim() || '';
    const image_url = document.getElementById('form-poster-image-url')?.value.trim() || '';
    const display_order = parseInt(document.getElementById('form-poster-order')?.value, 10) || (adminPosters.length + 1);
    const is_active = document.getElementById('form-poster-active') ? document.getElementById('form-poster-active').checked : true;

    let title = '';
    let pill = '';
    let badge = '';
    let subtitle = '';
    let link_text = '';
    let link_url = '';
    let gradient = 'purple';
    let show_button = true;

    if (type === 'store_announce') {
        if (!image_url) {
            showToast('Please upload or provide an image for the store announcement', 'warning');
            return;
        }
        title = document.getElementById('form-poster-title-announce')?.value.trim() || 'Store Announcement';
        pill = '';
        badge = '';
        subtitle = '';
        show_button = document.getElementById('form-poster-show-button') ? document.getElementById('form-poster-show-button').checked : true;
        link_text = show_button ? (document.getElementById('form-poster-cta-text-announce')?.value.trim() || 'Shop Now') : '';
        link_url = document.getElementById('form-poster-cta-url-announce')?.value.trim() || '#shop-catalog-section';
        gradient = 'emerald';
    } else {
        title = document.getElementById('form-poster-title')?.value.trim() || '';
        if (!title && !image_url) {
            showToast('Please provide a promotion title', 'warning');
            return;
        }
        pill = document.getElementById('form-poster-pill')?.value.trim() || '';
        badge = document.getElementById('form-poster-badge')?.value.trim() || '';
        subtitle = document.getElementById('form-poster-subtitle')?.value.trim() || '';
        link_text = document.getElementById('form-poster-cta-text')?.value.trim() || 'Explore Combos';
        link_url = document.getElementById('form-poster-cta-url')?.value.trim() || '#/categories';
        gradient = document.getElementById('form-poster-gradient')?.value || 'purple';
        show_button = true;
    }

    if (/^wa\.me\//i.test(link_url) || /^api\.whatsapp\.com\//i.test(link_url)) {
        link_url = 'https://' + link_url;
    }

    const payload = {
        id: id || undefined,
        type,
        poster_type: type,
        title,
        pill,
        badge,
        subtitle,
        link_text,
        link_url,
        show_button,
        display_order,
        is_active,
        image_url,
        gradient,
        is_full_poster: type === 'store_announce'
    };

    const saveBtn = document.getElementById('btn-save-poster');
    const origBtnHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Saving...</span>';
    }

    try {
        let savedSuccessfully = false;
        try {
            const res = await fetch('/api/admin/advertisements', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
... [truncated for diff preview]
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
            'food-dept': ['owner', 'store_manager', 'cook', 'food_department', 'food']
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
        'food-dept': 'Food Department & Kitchen Operations'
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

        // Ensure productsCache is populated with authoritative live data from Supabase
        try {
            const prodRes = await fetchWithTimeout(`/api/products?includeInactive=true${hostelParam}&force=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 8000);
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
        // Strictly for Platform Owner / Main Admin ("show for mee only").
        // Store Managers and other admins must NEVER see the overview card of all stores.
        const isOwner = Boolean(data.is_owner || (typeof isPlatformOwner === 'function' && isPlatformOwner(currentAdminProfile)));
        const overviewCard = document.getElementById('lock-hostel-overview-card');
        if (isOwner && data.all_hostel_locks) {
            renderLockHostelOverview(data.all_hostel_locks);
        } else {
            if (overviewCard) overviewCard.classList.add('hidden');
        }
    } catch (err) {
        console.error('Error loading client lock state:', err);
    }
}

function getActiveLockHostel() {
    if (currentAdminProfile && !isPlatformOwner(currentAdminProfile) && currentAdminProfile.assigned_hostel_id) {
        return currentAdminProfile.assigned_hostel_id;
    }
    return activeAdminHostelFilter.clientLock || 'ALL';
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
    const assignedHostelId = currentAdminProfile?.assigned_hostel_id;
    if (filterSelect) {
        if (!isOwnerUser && assignedHostelId) {
            filterSelect.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = assignedHostelId;
            opt.textContent = `🏢 ${assignedHostelId}`;
            filterSelect.appendChild(opt);
            filterSelect.value = assignedHostelId;
            filterSelect.disabled = true;
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
        lockTargetLabel.textContent = (targetHostelLabel && targetHostelLabel !== 'ALL') ? targetHostelLabel : 'All Campus Hostels (Global)';
    }

    const btnApplyText = document.getElementById('btn-apply-lock-text');
    if (btnApplyText) {
        btnApplyText.textContent = (targetHostelLabel && targetHostelLabel !== 'ALL') ? `Lock ${targetHostelLabel} Storefront Now` : 'Lock All Hostels Now';
    }

    const btnQuickUnlockText = document.getElementById('btn-quick-unlock-text');
    if (btnQuickUnlockText) {
        btnQuickUnlockText.textContent = (targetHostelLabel && targetHostelLabel !== 'ALL') ? `Unlock ${targetHostelLabel} Storefront Now` : 'Unlock Storefront Now';
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
    const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
    if (!isOwner && myHostels.length > 0) {
        if (!myHostels.includes(targetHostel)) {
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
    const myHostels = (currentAdminProfile?.assigned_hostels && currentAdminProfile.assigned_hostels.length > 0)
        ? currentAdminProfile.assigned_hostels
        : (currentAdminProfile?.assigned_hostel_id ? [currentAdminProfile.assigned_hostel_id] : []);
    let targetHostel = overrideHostel || getActiveLockHostel();
    if (!isOwner && myHostels.length > 0) {
        if (!myHostels.includes(targetHostel)) {
            targetHostel = myHostels[0];
        }
    }
    const hostelLabel = (targetHostel && targetHostel !== 'ALL') ? ` for ${targetHostel}` : '';
    if (!confirm(`Are you sure you want to UNLOCK the client storefront${hostelLabel} and make orders available now?`)) {
        return;
    }
    try {
        const res = await fetch('/api/admin/client-lock', {
            method: 'DELETE',
            headers: getAuthHeaders(),
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
        }
    } catch (err) {
        alert('Error unlocking store: ' + err.message);
    }
}

// Per-Hostel Lock Status Overview (Owner Panoramic Grid)
function selectLockHostel(hostelId) {
    const isOwner = typeof isPlatformOwner === 'function' ? isPlatformOwner(currentAdminProfile) : Boolean(currentAdminProfile?.is_owner);
    if (!isOwner) return; // Strict boundary: Only platform owner ("mee only") can select other hostel cards
    if (!hostelId) hostelId = 'ALL';
    activeAdminHostelFilter.clientLock = hostelId;
    const select = document.getElementById('lock-hostel-filter');
    if (select) {
        if (!Array.from(select.options).some(o => o.value === hostelId)) {
            const opt = document.createElement('option');
            opt.value = hostelId;
            opt.textContent = hostelId === 'ALL' ? '🏢 All Campus Hostels' : `🏢 ${hostelId}`;
            select.appendChild(opt);
        }
        select.value = hostelId;
    }
    loadClientLockState();
}
window.selectLockHostel = selectLockHostel;

function renderLockHostelOverview(allHostelLocks) {
    const overviewCard = document.getElementById('lock-hostel-overview-card');
    const grid = document.getElementById('lock-hostel-overview-grid');
    const summary = document.getElementById('lock-hostel-overview-summary');
    if (!overviewCard || !grid) return;

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

    if (hostels.length === 0) {
        overviewCard.classList.add('hidden');
        return;
    }

    overviewCard.classList.remove('hidden');

    let lockedCount = 0;
    let totalCount = hostels.length;
    let cardsHtml = '';
    const currentHostel = getActiveLockHostel() || 'ALL';

    // Master Lock Card (Global Control)
    if (masterLock) {
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
        const isSelected = (currentHostel === hostelId);

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
                actionBtn = `<button type="button" onclick="event.stopPropagation(); handleUnlockStore('${hostelId}')" class="text-[9px] font-bold text-[#16a34a] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔓 Unlock</button>`;
            } else if (lockedByMaster) {
                actionBtn = `<span class="text-[9px] text-[#991b1b]/80 italic mt-1 flex items-center gap-1">🔒 Locked globally</span>`;
            } else {
                actionBtn = `<button type="button" onclick="event.stopPropagation(); handleUnlockStore('${hostelId}')" class="text-[9px] font-bold text-[#16a34a] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔓 Unlock</button>`;
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

            actionBtn = `<button type="button" onclick="event.stopPropagation(); quickLockSingleHostel('${hostelId}')" class="text-[9px] font-bold text-[#dc2626] hover:underline mt-1 cursor-pointer flex items-center gap-1">🔒 Lock</button>`;
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
    const assignedHostel = currentAdminProfile?.assigned_hostel_id;
    if (!isOwner && assignedHostel && hostelId !== assignedHostel) {
        alert(`Access denied: You can only lock or unlock your assigned store (${assignedHostel}).`);
        return;
    }
    if (!confirm(`Lock storefront for ${hostelId} immediately?`)) return;
    try {
        const res = await fetch('/api/admin/client-lock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ lock_type: 'IMMEDIATE', duration_minutes: 30, hostel_id: hostelId })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || `${hostelId} locked.`, 'success');
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

        // 3. Register with server
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                subscription: sub.toJSON(),
                adminId: currentAdminProfile?.id || null,
                adminName: currentAdminProfile?.name || 'Admin',
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
        return (pm.includes('cash') || pm.includes('cod')) && !pm.includes('both');
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
            return (pm.includes('cash') || pm.includes('cod')) && !pm.includes('both');
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
            <td class="p-4 text-[#5c5f60]">${o.payment_method || 'COD'}</td>
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
        document.getElementById('drawer-payment-method').textContent = cachedOrder.payment_method || 'Cash on Delivery';
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
        document.getElementById('drawer-payment-method').textContent = o.payment_method || 'Cash on Delivery';
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

function selectDrawerPaymentMode(mode) {
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

    if (mode === 'Cash') {
        if (btnCash) {
            btnCash.className = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/40 font-extrabold shadow-sm active:scale-95 cursor-pointer';
        }
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
            badge.textContent = `💵 Cash (₹${orderTotal})`;
        }
        if (splitWrap) splitWrap.classList.add('hidden');
    } else if (mode === 'UPI') {
        if (btnUpi) {
            btnUpi.className = 'drawer-pay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/40 font-extrabold shadow-sm active:scale-95 cursor-pointer';
        }
        if (badge) {
            badge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800';
            badge.textContent = `📱 UPI (₹${orderTotal})`;
        }
        if (splitWrap) splitWrap.classList.add('hidden');
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
    if (method.includes('both')) {
        selectDrawerPaymentMode('Both');
    } else if (method.includes('upi')) {
        selectDrawerPaymentMode('UPI');
    } else if (method.includes('cash') || method.includes('cod')) {
        selectDrawerPaymentMode('Cash');
    } else {
        selectDrawerPaymentMode('Cash');
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

    let finalPaymentMethod = o?.payment_method || 'Cash on Delivery';
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
            if (!o.payment_method || o.payment_method.toLowerCase().includes('cod')) {
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

const ORDER_POLL_ACTIVE_MS = 1500;   // 1.5s when tab is active and visible (instant 1-2s updates)
const ORDER_POLL_HIDDEN_MS = 30000;  // 30s when tab is in background / minimized

function scheduleNextOrderPoll() {
    if (liveOrderPollInterval) clearTimeout(liveOrderPollInterval);
    const delay = (typeof document !== 'undefined' && document.hidden) ? ORDER_POLL_HIDDEN_MS : ORDER_POLL_ACTIVE_MS;
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
        if (!document.hidden) {
            syncOrdersLive();
            scheduleNextOrderPoll();
        }
    });
}

let adminSupabaseClient = null;
let adminSupabaseChannel = null;

async function initSupabaseRealtime() {
    try {
        if (typeof window === 'undefined') return;
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
                        eventsPerSecond: 20
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
                updateConnectionStatus(true, 'Live (Cloud + WS)');
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
        if (isOwner && data.all_hostel_locks && typeof renderLockHostelOverview === 'function') {
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
        const myHostel = currentAdminProfile?.assigned_hostel_id;
        if (isOwner || !myHostel || updatedHostel === 'ALL' || updatedHostel === myHostel) {
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
    // Start continuous smart live poller immediately as bulletproof fallback
    startLiveOrderPolling();

    // Start Supabase Cloud Realtime Channel for multi-dashboard cross-device live updates
    initSupabaseRealtime();

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
        realtimeWs = new WebSocket(wsUrl);

        realtimeWs.onopen = () => {
            console.log('[Admin WS] ✅ Connected to live orders stream.');
            wsReconnectAttempts = 0;
            if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
            updateConnectionStatus(true, 'Live (WS)');

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

            // WebSocket unavailable (e.g. Vercel Serverless) — Live Poller keeps running seamlessly
            updateConnectionStatus(true, 'Live');

            // Continuous resilient reconnect with short exponential backoff (1.5s - 10s max)
            if (adminToken && !wsReconnectTimer) {
                const delay = Math.min(1500 * Math.max(1, wsReconnectAttempts), 10000);
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
        if (!wsReconnectTimer) {
            wsReconnectTimer = setTimeout(() => {
                wsReconnectTimer = null;
                initRealtimeWebSocket();
            }, 3000);
        }
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

function markAllAdminNotificationsRead() {
    const notifs = getStoredAdminNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    saveStoredAdminNotifications(updated);
    updateAdminNotificationsUI();
    showToast('All notifications marked as read', 'info');
}
window.markAllAdminNotificationsRead = markAllAdminNotificationsRead;

function openNotificationOrder(orderId) {
    const notifs = getStoredAdminNotifications();
    const updated = notifs.map(n => n.order_id === orderId ? { ...n, read: true } : n);
    saveStoredAdminNotifications(updated);
    updateAdminNotificationsUI();

    const panel = document.getElementById('admin-notifs-panel');
    if (panel) panel.classList.add('hidden');

    switchView('orders');
    openOrderDrawer(orderId);
}
window.openNotificationOrder = openNotificationOrder;

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
                    allOpt.textContent = '🏢 All My Assigned Hostels';
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
                if (currentVal && (currentVal === 'ALL' || myHostels.includes(currentVal))) {
                    select.value = currentVal;
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

// Periodic background sync fallback (every 10 seconds when authenticated & visible)
setInterval(() => {
    if (!adminToken || (typeof document !== 'undefined' && document.hidden)) return;
    if (activeView === 'dashboard') loadDashboard();
    else if (activeView === 'orders') syncOrdersLive();
    else if (activeView === 'inventory') loadInventory();
    else if (activeView === 'products') loadProducts();
}, 10000);

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
                if (data.success && Array.isArray(data.posters)) {
                    adminPosters = data.posters;
                    savedSuccessfully = true;
                }
            }
        } catch (netErr) {
            console.warn('[Advertisements] Network save failed, saving to local cache:', netErr);
        }

        if (!savedSuccessfully) {
            if (id) {
                const idx = adminPosters.findIndex(p => p.id === id);
                if (idx !== -1) {
                    adminPosters[idx] = { ...adminPosters[idx], ...payload, updated_at: new Date().toISOString() };
                } else {
                    adminPosters.push({ ...payload, id });
                }
            } else {
                const newId = `poster_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                adminPosters.push({ ...payload, id: newId, created_at: new Date().toISOString() });
            }
        }

        adminPosters.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        localStorage.setItem('lpuquick_admin_posters', JSON.stringify(adminPosters));
        notifyLocalAdsUpdated();

        closePosterModal();
        renderAdminCarouselSlides();
        renderAdminPostersGrid();
        updateAdminCarouselView();
        startAdminCarouselAutoSlide();

        const navBadge = document.getElementById('nav-ads-badge');
        const countBadge = document.getElementById('admin-posters-count-badge');
        const activeCount = adminPosters.filter(p => p.is_active !== false).length;
        if (navBadge) navBadge.textContent = String(adminPosters.length);
        if (countBadge) countBadge.textContent = `${adminPosters.length} advertisement${adminPosters.length === 1 ? '' : 's'} (${activeCount} active)`;

        showToast(id ? '✓ Advertisement updated successfully!' : '✓ New advertisement added to carousel!', 'success');
    } catch (err) {
        showToast('Error saving advertisement: ' + err.message, 'warning');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            if (origBtnHtml) saveBtn.innerHTML = origBtnHtml;
        }
    }
}

async function handleModalDeletePoster() {
    if (!editingPosterId) return;
    await quickDeletePoster(editingPosterId);
    closePosterModal();
}

async function quickDeletePoster(id) {
    if (!confirm('Are you sure you want to delete this promotional poster?')) return;

    try {
        try {
            await fetch(`/api/admin/advertisements/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        } catch (netErr) {
            console.warn('[Advertisements] Network delete failed, falling back to local:', netErr);
        }

        adminPosters = adminPosters.filter(p => p.id !== id);
        localStorage.setItem('lpuquick_admin_posters', JSON.stringify(adminPosters));
        notifyLocalAdsUpdated();

        renderAdminCarouselSlides();
        renderAdminPostersGrid();
        updateAdminCarouselView();
        startAdminCarouselAutoSlide();

        const navBadge = document.getElementById('nav-ads-badge');
        const countBadge = document.getElementById('admin-posters-count-badge');
        const activeCount = adminPosters.filter(p => p.is_active !== false).length;
        if (navBadge) navBadge.textContent = String(adminPosters.length);
        if (countBadge) countBadge.textContent = `${adminPosters.length} poster${adminPosters.length === 1 ? '' : 's'} (${activeCount} active)`;

        showToast('Poster deleted successfully', 'info');
    } catch (err) {
        showToast('Failed to delete poster: ' + err.message, 'warning');
    }
}

async function togglePosterActive(id) {
    const poster = adminPosters.find(p => p.id === id);
    if (!poster) return;

    poster.is_active = poster.is_active === false ? true : false;
    notifyLocalAdsUpdated();

    renderAdminCarouselSlides();
    renderAdminPostersGrid();
    updateAdminCarouselView();
    startAdminCarouselAutoSlide();

    try {
        const res = await fetch('/api/admin/advertisements', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(poster)
        });
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.posters)) {
                adminPosters = data.posters;
                notifyLocalAdsUpdated();
                renderAdminCarouselSlides();
                renderAdminPostersGrid();
            }
        }
    } catch (netErr) { }

    showToast(`Poster ${poster.is_active ? 'activated' : 'paused'} in carousel`, 'info');
}

async function movePosterOrder(id, delta) {
    const index = adminPosters.findIndex(p => p.id === id);
    if (index === -1) return;

    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= adminPosters.length) return;

    // Swap positions
    const temp = adminPosters[index];
    adminPosters[index] = adminPosters[targetIndex];
    adminPosters[targetIndex] = temp;

    // Re-index display_order
    adminPosters.forEach((p, i) => { p.display_order = i + 1; });
    localStorage.setItem('lpuquick_admin_posters', JSON.stringify(adminPosters));
    notifyLocalAdsUpdated();

    renderAdminCarouselSlides();
    renderAdminPostersGrid();
    updateAdminCarouselView();

    // Fast atomic reorder endpoint
    try {
        await fetch('/api/admin/advertisements/reorder', {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordered_ids: adminPosters.map(p => p.id) })
        });
    } catch (e) { }

    showToast('Poster order updated', 'info');
}

// ================= REAL-TIME SYNCHRONIZATION HANDLERS =================
function handleRealtimeAdvertisementsUpdated(data) {
    try {
        let changed = false;
        if (Array.isArray(data.posters)) {
            adminPosters = data.posters;
            adminPosters.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            localStorage.setItem('lpuquick_admin_posters', JSON.stringify(adminPosters));
            changed = true;
        }

        if (data.settings) {
            if (data.settings.autoplay_delay) {
                adminCarouselDelay = Math.max(1000, Number(data.settings.autoplay_delay));
            }
            if (data.settings.autoplay_enabled !== undefined) {
                adminCarouselAutoplay = Boolean(data.settings.autoplay_enabled);
            }
            localStorage.setItem('lpuquick_admin_carousel_settings', JSON.stringify(data.settings));
            changed = true;
        }

        if (changed) {
            const slider = document.getElementById('admin-carousel-delay-slider');
            const delayBadge = document.getElementById('admin-delay-display-badge');
            const speedPill = document.getElementById('admin-carousel-speed-pill');
            const delaySec = (adminCarouselDelay / 1000).toFixed(1);

            if (slider && document.activeElement !== slider) slider.value = delaySec;
            if (delayBadge) delayBadge.textContent = `${delaySec} seconds`;
            if (speedPill) speedPill.textContent = `⚡ ${delaySec}s delay`;

            const playPauseIcon = document.getElementById('admin-carousel-playpause-icon');
            if (playPauseIcon) {
                playPauseIcon.textContent = adminCarouselAutoplay ? 'pause' : 'play_arrow';
            }

            const navBadge = document.getElementById('nav-ads-badge');
            const countBadge = document.getElementById('admin-posters-count-badge');
            const activeCount = adminPosters.filter(p => p.is_active !== false).length;
            if (navBadge) navBadge.textContent = String(adminPosters.length);
            if (countBadge) countBadge.textContent = `${adminPosters.length} poster${adminPosters.length === 1 ? '' : 's'} (${activeCount} active)`;

            renderAdminCarouselSlides();
            renderAdminPostersGrid();
            updateAdminCarouselView();
            startAdminCarouselAutoSlide();

            if (activeView === 'advertisements') {
                showToast('⚡ Live promotional banner sync received', 'info');
            }
        }
    } catch (err) {
        console.error('[Advertisements Realtime] Error handling update:', err);
    }
}

// Multi-Tab Real-time Broadcast Channel
let adsBroadcastChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        adsBroadcastChannel = new BroadcastChannel('lpuquick_ads_sync');
        adsBroadcastChannel.onmessage = (event) => {
            if (event.data && event.data.type === 'ADVERTISEMENTS_UPDATED') {
                handleRealtimeAdvertisementsUpdated(event.data);
            }
        };
    }
} catch (e) { }

function notifyLocalAdsUpdated() {
    try {
        const payload = {
            type: 'ADVERTISEMENTS_UPDATED',
            posters: adminPosters,
            banners: adminPosters,
            settings: {
                autoplay_delay: adminCarouselDelay,
                autoplay_enabled: adminCarouselAutoplay
            }
        };
        try {
            localStorage.setItem('lpuquick_admin_posters', JSON.stringify(adminPosters));
            localStorage.setItem('lpuquick_active_banners', JSON.stringify(adminPosters));
            localStorage.setItem('lpuquick_carousel_settings', JSON.stringify(payload.settings));
        } catch (storageErr) { }

        adsBroadcastChannel?.postMessage(payload);
        window.dispatchEvent(new CustomEvent('advertisementsUpdated', { detail: payload }));
    } catch (e) { }
}

// Cross-tab storage event listener
window.addEventListener('storage', (e) => {
    if (e.key === 'lpuquick_admin_posters' || e.key === 'lpuquick_admin_carousel_settings') {
        try {
            const cachedPosters = localStorage.getItem('lpuquick_admin_posters');
            const cachedSettings = localStorage.getItem('lpuquick_admin_carousel_settings');
            handleRealtimeAdvertisementsUpdated({
                posters: cachedPosters ? JSON.parse(cachedPosters) : undefined,
                settings: cachedSettings ? JSON.parse(cachedSettings) : undefined
            });
        } catch (err) { }
    }
});

// =========================================================================
// DELIVERY PARTNER HUB, MY EARNINGS (₹3/ORDER) & PARTNER DRAWER CONTROLLER
// =========================================================================
let earningsPeriod = 'weekly';
let earningsWeekOffset = 0;
let earningsMonthOffset = 0;
let earningsSelectedRider = 'all';
let currentEarningsData = null;
let selectedDayFilter = null;
let partnerIsOnDuty = true;
let partnerDashboardSubTab = 'partner';
let fleetCustomStartDate = null;
let fleetCustomEndDate = null;
let earningsSelectedShift = 'all';

function updateFleetViewMetrics(data) {
    if (!data) return;
    const fleetDailyPayout = document.getElementById('fleet-metric-daily-payout');
    if (fleetDailyPayout) {
        fleetDailyPayout.textContent = `₹${(data.platform_metrics?.total_daily_payout || 0).toFixed(2)}`;
    }

    const fleetMonthlyExpense = document.getElementById('fleet-metric-monthly-expense');
    if (fleetMonthlyExpense) {
        fleetMonthlyExpense.textContent = `₹${(data.platform_metrics?.total_monthly_expense || 0).toFixed(2)}`;
    }

    const fleetTotalFleet = document.getElementById('fleet-metric-total-fleet');
    if (fleetTotalFleet) {
        fleetTotalFleet.textContent = String(data.platform_metrics?.total_active_fleet || 0);
    }

    const fleetTotalOrders = document.getElementById('fleet-metric-total-orders');
    if (fleetTotalOrders) {
        fleetTotalOrders.textContent = String(data.platform_metrics?.total_completed_all_time || 0);
    }

    renderFleetPartnersTable(data.partners_summary || []);
}

async function loadDeliveryEarnings(customStart, customEnd) {
    try {
        const queryParams = new URLSearchParams({
            period: earningsPeriod,
            weekOffset: earningsWeekOffset,
            monthOffset: earningsMonthOffset,
            riderId: earningsSelectedRider,
            shift: earningsSelectedShift,
            _t: Date.now()
        });

        if (currentAdminProfile?.id) queryParams.set('ownerId', currentAdminProfile.id);
        if (currentAdminProfile?.name) queryParams.set('ownerName', currentAdminProfile.name);

        if (customStart && customEnd) {
            queryParams.set('startDate', customStart);
            queryParams.set('endDate', customEnd);
        } else if (fleetCustomStartDate && fleetCustomEndDate) {
            queryParams.set('startDate', fleetCustomStartDate);
            queryParams.set('endDate', fleetCustomEndDate);
        }

        const res = await fetchWithTimeout(`/api/orders/delivery-earnings?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        }, 8000);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to fetch earnings');

        currentEarningsData = data;

        // Role-based visibility: Except owner, non-owner admins cannot see other admins' revenue or fleet aggregates
        const isOwner = Boolean(data.is_owner ?? (currentAdminProfile?.is_owner || currentAdminProfile?.roles?.includes('owner')));
        const fleetTabBtn = document.getElementById('subtab-fleet-btn');
        const pricingBtn = document.getElementById('btn-open-pricing-modal');
        const allFleetBtn = document.getElementById('btn-filter-all-fleet');
        const onlyMineBtn = document.getElementById('btn-filter-only-mine');
        const riderSelect = document.getElementById('earnings-rider-select');
        const headerRateBtn = document.getElementById('btn-header-pricing-pill');

        if (!isOwner) {
            if (fleetTabBtn) fleetTabBtn.classList.add('hidden');
            if (pricingBtn) pricingBtn.classList.add('hidden');
            if (allFleetBtn) allFleetBtn.classList.add('hidden');
            if (onlyMineBtn) onlyMineBtn.classList.add('hidden');
            if (riderSelect) riderSelect.classList.add('hidden');
            if (headerRateBtn) {
                headerRateBtn.onclick = null;
                headerRateBtn.style.cursor = 'default';
                headerRateBtn.title = 'Configured delivery fee per completed order';
            }
            if (partnerDashboardSubTab === 'fleet') {
                setPartnerDashboardSubTab('partner');
            }
        } else {
            if (fleetTabBtn) fleetTabBtn.classList.remove('hidden');
            if (pricingBtn) pricingBtn.classList.remove('hidden');
            if (allFleetBtn) allFleetBtn.classList.remove('hidden');
            if (onlyMineBtn) onlyMineBtn.classList.remove('hidden');
            if (riderSelect) riderSelect.classList.remove('hidden');
            if (headerRateBtn) {
                headerRateBtn.onclick = openDeliveryPricingModal;
                headerRateBtn.style.cursor = 'pointer';
                headerRateBtn.title = 'Click to open Delivery Pricing Engine';
            }
        }

        // Populate Rider Dropdown with All Fleet, Only Mine (Owner), and Individual Runners
        if (riderSelect) {
            const ownerName = data.owner_info?.name || currentAdminProfile?.name || 'Owner';
            let optionsHtml = isOwner ? `
                <option value="all" ${earningsSelectedRider === 'all' ? 'selected' : ''}>🌐 All Delivery Fleet</option>
                <option value="mine" ${earningsSelectedRider === 'mine' ? 'selected' : ''}>👤 Only Mine (${escapeHtml(ownerName)} - Deliveries)</option>
            ` : `
                <option value="${escapeHtml(currentAdminProfile?.id || data.selected_rider?.id || 'mine')}" selected>👤 My Deliveries (${escapeHtml(currentAdminProfile?.name || 'Rider')})</option>
            `;
            if (isOwner && Array.isArray(data.available_riders)) {
                // Auto-reset if previously selected rider was revoked or no longer in active delivery fleet
                const isValidSelection = earningsSelectedRider === 'all' || earningsSelectedRider === 'mine' || data.available_riders.some(r => r.id === earningsSelectedRider);
                if (!isValidSelection) {
                    earningsSelectedRider = 'all';
                }
                data.available_riders.forEach(r => {
                    let roleTag = '';
                    if (r.is_owner) {
                        roleTag = ' (Owner & Delivery)';
                    } else if (r.is_store_manager || (Array.isArray(r.roles) && r.roles.includes('store_manager'))) {
                        roleTag = ' (Store Mgr & Delivery)';
                    } else if (r.is_inventory_manager || (Array.isArray(r.roles) && r.roles.includes('inventory_manager'))) {
                        roleTag = ' (Inventory & Delivery)';
                    } else {
                        roleTag = ' (Delivery Partner)';
                    }
                    const runsTag = r.total_completed ? ` • ${r.total_completed} runs` : '';
                    const isSel = earningsSelectedRider === r.id ? 'selected' : '';
                    optionsHtml += `<option value="${escapeHtml(r.id)}" ${isSel}>🏃 ${escapeHtml(r.name)}${roleTag}${runsTag}</option>`;
                });
            }
            riderSelect.innerHTML = optionsHtml;
            riderSelect.value = earningsSelectedRider;
        }

        // Update Hub Header dynamic rate badge
        const headerRate = document.getElementById('hub-header-rate-display');
        if (headerRate) {
            headerRate.textContent = `₹${(data.rate_per_order || 3.00).toFixed(2)}`;
        }

        // Update Monthly Snapshot formula label
        const formulaEl = document.getElementById('partner-snapshot-formula');
        if (formulaEl) {
            formulaEl.textContent = `Monthly Revenue = Completed Deliveries × ₹${(data.rate_per_order || 3.00).toFixed(2)}`;
        }

        // Update Active Filter indicators and banner
        const btnAll = document.getElementById('btn-filter-all-fleet');
        const btnMine = document.getElementById('btn-filter-only-mine');
        const riderBadge = document.getElementById('active-rider-indicator-badge');
        const filterBanner = document.getElementById('partner-filter-alert-banner');
        const filterTitle = document.getElementById('partner-filter-banner-title');
        const filterType = document.getElementById('partner-filter-banner-type');

        if (earningsSelectedRider === 'mine') {
            if (btnAll) btnAll.className = 'flex-1 py-1 px-2 rounded-lg bg-[#F0F4F9] hover:bg-blue-50 text-[#5c5f60] font-bold text-[11px] border border-[#DADCE0] transition-all cursor-pointer text-center';
            if (btnMine) btnMine.className = 'flex-1 py-1 px-2 rounded-lg bg-indigo-600 text-white font-black text-[11px] border border-indigo-700 transition-all cursor-pointer text-center shadow-xs';
            if (riderBadge) {
                riderBadge.textContent = 'Only Mine';
                riderBadge.className = 'text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200';
            }
            if (filterBanner) {
                filterBanner.classList.remove('hidden');
                if (filterTitle) filterTitle.textContent = `Viewing Stats: ${data.selected_rider?.name || 'Owner (My Deliveries)'}`;
                if (filterType) {
                    filterType.textContent = 'Owner Only';
                    filterType.className = 'text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full';
                }
            }
        } else if (earningsSelectedRider && earningsSelectedRider !== 'all') {
            if (btnAll) btnAll.className = 'flex-1 py-1 px-2 rounded-lg bg-[#F0F4F9] hover:bg-blue-50 text-[#5c5f60] font-bold text-[11px] border border-[#DADCE0] transition-all cursor-pointer text-center';
            if (btnMine) btnMine.className = 'flex-1 py-1 px-2 rounded-lg bg-[#F0F4F9] hover:bg-indigo-50 text-[#5c5f60] font-bold text-[11px] border border-[#DADCE0] transition-all cursor-pointer text-center';
            if (riderBadge) {
                riderBadge.textContent = 'Individual Partner';
                riderBadge.className = 'text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200';
            }
            if (filterBanner) {
                filterBanner.classList.remove('hidden');
                if (filterTitle) filterTitle.textContent = `Viewing Stats: ${data.selected_rider?.name || 'Individual Runner'}`;
                if (filterType) {
                    filterType.textContent = 'Partner Filter Active';
                    filterType.className = 'text-[10px] bg-blue-100 text-[#0066cc] font-bold px-2 py-0.5 rounded-full';
                }
            }
        } else {
            if (btnAll) btnAll.className = 'flex-1 py-1 px-2 rounded-lg bg-[#0066cc] text-white font-black text-[11px] border border-blue-700 transition-all cursor-pointer text-center shadow-xs';
            if (btnMine) btnMine.className = 'flex-1 py-1 px-2 rounded-lg bg-[#F0F4F9] hover:bg-indigo-50 text-[#5c5f60] font-bold text-[11px] border border-[#DADCE0] transition-all cursor-pointer text-center';
            if (riderBadge) {
                riderBadge.textContent = 'All Fleet';
                riderBadge.className = 'text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200';
            }
            if (filterBanner) filterBanner.classList.add('hidden');
        }

        // Sync Rider Availability Duty Status with server
        if (typeof data.is_on_duty === 'boolean') {
            partnerIsOnDuty = data.is_on_duty;
            if (typeof updatePartnerDutyUI === 'function') {
                updatePartnerDutyUI(partnerIsOnDuty);
            }
        }

        // Update Partner Drawer details
        const drawerStore = document.getElementById('drawer-store-name');
        if (drawerStore && data.store_info) {
            drawerStore.textContent = `${data.store_info.store_id} • ${data.store_info.store_name}`;
        }
        const drawerEmp = document.getElementById('drawer-employee-id');
        if (drawerEmp && data.store_info) {
            const riderName = currentAdminProfile?.name || 'Rider';
            drawerEmp.textContent = `${data.store_info.employee_id} (${riderName})`;
        }

        // 1. Partner Dashboard: Top KPI Cards
        const kpiEarnings = document.getElementById('partner-kpi-today-earnings');
        if (kpiEarnings) {
            kpiEarnings.textContent = `₹${(data.today_stats?.today_earnings || 0).toFixed(2)}`;
        }

        const kpiCompleted = document.getElementById('partner-kpi-today-completed');
        if (kpiCompleted) {
            kpiCompleted.textContent = String(data.today_stats?.completed_today || 0);
        }

        const kpiBreakdown = document.getElementById('partner-kpi-today-breakdown');
        if (kpiBreakdown) {
            const pCount = data.today_stats?.pending_today || 0;
            const cCount = data.today_stats?.cancelled_today || 0;
            kpiBreakdown.textContent = `${pCount} Pending • ${cCount} Cancelled`;
        }

        // 2. Partner Dashboard: Monthly Snapshot Card
        const snapshotMonthName = document.getElementById('partner-snapshot-month-name');
        if (snapshotMonthName) {
            snapshotMonthName.textContent = data.monthly_stats?.month_name || 'September 2026';
        }

        const snapshotDeliveries = document.getElementById('partner-snapshot-deliveries');
        if (snapshotDeliveries) {
            snapshotDeliveries.textContent = String(data.monthly_stats?.completed_month || 0);
        }

        const snapshotPayout = document.getElementById('partner-snapshot-payout');
        if (snapshotPayout) {
            snapshotPayout.textContent = `₹${(data.monthly_stats?.monthly_payout || 0).toFixed(2)}`;
        }

        const snapshotAvg = document.getElementById('partner-snapshot-avg');
        if (snapshotAvg) {
            snapshotAvg.textContent = `${data.monthly_stats?.avg_deliveries_per_day || 0} / day`;
        }

        // 3. Visual Chart & Period Indicators
        const weeklyBtn = document.getElementById('tab-earnings-weekly');
        const monthlyBtn = document.getElementById('tab-earnings-monthly');
        if (weeklyBtn && monthlyBtn) {
            if (earningsPeriod === 'weekly') {
                weeklyBtn.className = 'px-3 py-1.5 rounded-xl bg-white text-[#0066cc] shadow-xs transition-all tracking-wider cursor-pointer font-black';
                monthlyBtn.className = 'px-3 py-1.5 rounded-xl text-[#5c5f60] hover:text-[#181c1f] transition-all tracking-wider cursor-pointer font-bold';
            } else {
                monthlyBtn.className = 'px-3 py-1.5 rounded-xl bg-white text-[#0066cc] shadow-xs transition-all tracking-wider cursor-pointer font-black';
                weeklyBtn.className = 'px-3 py-1.5 rounded-xl text-[#5c5f60] hover:text-[#181c1f] transition-all tracking-wider cursor-pointer font-bold';
            }
        }

        const rangeBadge = document.getElementById('earnings-range-badge');
        if (rangeBadge) rangeBadge.textContent = data.range_label || 'Current Period';

        const grandTotalEl = document.getElementById('earnings-grand-total');
        if (grandTotalEl) grandTotalEl.textContent = `₹${(data.grand_total || 0).toFixed(2)}`;

        const orderPayoutEl = document.getElementById('earnings-order-payout');
        if (orderPayoutEl) orderPayoutEl.textContent = `₹${(data.order_payout || 0).toFixed(2)}`;

        const incentivesEl = document.getElementById('earnings-incentives');
        if (incentivesEl) incentivesEl.textContent = `₹${(data.incentives || 0)}`;

        const statTotal = document.getElementById('stat-total-orders');
        if (statTotal) statTotal.textContent = data.total_orders || 0;

        const statSingle = document.getElementById('stat-single-runs');
        if (statSingle) statSingle.textContent = data.single_runs || 0;

        const statMulti = document.getElementById('stat-multi-runs');
        if (statMulti) statMulti.textContent = data.multi_runs || 0;

        // Render Bar Chart, Recent Ledger & Orders List
        renderEarningsBarChart(data.days || [], data.period);
        renderPartnerLedger(data.recent_ledger || []);
        renderEarningsOrders(data.all_orders || [], selectedDayFilter);

        // 4. Admin Fleet Overview: Platform Aggregated Metrics & Overview Table
        updateFleetViewMetrics(data);

    } catch (err) {
        console.error('[Delivery Earnings Error]:', err);
        showToast('Error loading delivery partner earnings: ' + err.message, 'error');
    }
}

function switchEarningsPeriod(period) {
    earningsPeriod = period;
    earningsWeekOffset = 0;
    earningsMonthOffset = 0;
    selectedDayFilter = null;
    loadDeliveryEarnings();
}

function shiftEarningsPeriod(delta) {
    if (earningsPeriod === 'weekly') {
        earningsWeekOffset += delta;
    } else {
        earningsMonthOffset += delta;
    }
    selectedDayFilter = null;
    loadDeliveryEarnings();
}

function filterEarningsByRider(riderId) {
    earningsSelectedRider = riderId;
    selectedDayFilter = null;
    loadDeliveryEarnings();
}

function renderEarningsBarChart(days, period) {
    const container = document.getElementById('earnings-chart-container');
    if (!container) return;

    if (!Array.isArray(days) || days.length === 0) {
        container.innerHTML = '<div class="w-full text-center text-xs text-[#5c5f60] py-12">No delivery data available for this range.</div>';
        return;
    }

    const maxPayout = Math.max(...days.map(d => d.payout), 1);
    const chartHeightPx = 130;

    let html = '';
    days.forEach(d => {
        const heightPct = Math.round((d.payout / maxPayout) * 100);
        const barHeightPx = Math.max(6, Math.round((d.payout / maxPayout) * chartHeightPx));
        const isSelected = selectedDayFilter === d.date;

        // Colors matching Screenshot 1: rounded pill light blue, highlighted if active/today
        let barBg = 'bg-[#8ec7f9] hover:bg-[#64b5f6]';
        let badgeColor = 'text-[#181c1f]';
        let labelColor = 'text-[#5c5f60]';
        let borderBottom = '';

        if (d.is_today) {
            barBg = 'bg-[#0066cc]';
            badgeColor = 'text-[#0066cc] font-black';
            labelColor = 'text-[#0066cc] font-black';
            borderBottom = '<div class="w-full h-1 bg-[#0066cc] rounded-full mt-1"></div>';
        }
        if (isSelected) {
            barBg = 'bg-[#0052a3] ring-2 ring-[#0066cc] ring-offset-2';
        }

        html += `
        <div class="flex-1 flex flex-col items-center justify-end h-full z-10 cursor-pointer group" onclick="toggleEarningsDayFilter('${d.date}')" title="${d.display_label}: ${d.order_count} Orders (₹${d.payout})">
            <!-- Payout Tag Badge above Bar -->
            <div class="text-[10px] sm:text-xs font-bold ${badgeColor} mb-1 transition-transform group-hover:scale-110">
                ₹${d.payout}
            </div>

            <!-- Vertical Bar -->
            <div class="w-5 sm:w-8 md:w-10 rounded-t-xl sm:rounded-t-2xl ${barBg} transition-all duration-300" style="height: ${barHeightPx}px;"></div>

            <!-- Day Label below baseline -->
            <div class="pt-2 text-center w-full">
                <div class="text-[10px] sm:text-[11px] font-bold ${labelColor} truncate">${d.display_label}</div>
                ${borderBottom}
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
}

function toggleEarningsDayFilter(dateStr) {
    if (selectedDayFilter === dateStr) {
        selectedDayFilter = null;
    } else {
        selectedDayFilter = dateStr;
    }
    if (currentEarningsData) {
        renderEarningsBarChart(currentEarningsData.days || [], currentEarningsData.period);
        renderEarningsOrders(currentEarningsData.all_orders || [], selectedDayFilter);
    }
}

function renderEarningsOrders(orders, dateFilter) {
    const listEl = document.getElementById('earnings-orders-list');
    const countEl = document.getElementById('orders-list-count');
    const headingEl = document.getElementById('orders-list-heading');
    if (!listEl) return;

    let filtered = orders;
    if (dateFilter) {
        filtered = orders.filter(o => o.date === dateFilter);
        if (headingEl) headingEl.textContent = `Orders on ${dateFilter}`;
    } else {
        if (headingEl) headingEl.textContent = 'Delivered Orders Breakdown';
    }

    const deliveredOrders = filtered.filter(o => o.delivery_state === 'Completed' || ['delivered', 'completed'].includes((o.status || '').toLowerCase()));
    const cancelledOrders = filtered.filter(o => o.delivery_state === 'Cancelled' || (o.status || '').toLowerCase() === 'cancelled');
    const activeRate = currentEarningsData?.pricing_config?.rate_per_order || 3.00;
    const totalEarned = deliveredOrders.reduce((sum, o) => sum + (typeof o.payout === 'number' ? o.payout : activeRate), 0).toFixed(2);

    if (countEl) {
        let badgeText = `${deliveredOrders.length} Delivered • ₹${totalEarned}`;
        if (cancelledOrders.length > 0) {
            badgeText += ` (${cancelledOrders.length} Cancelled)`;
        }
        countEl.textContent = badgeText;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="p-6 text-center text-[#5c5f60] bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7]">
                <span class="material-symbols-outlined text-3xl text-slate-400">receipt</span>
                <p class="text-xs font-bold mt-1">No orders on this selected day.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(o => {
        const isCancelled = o.delivery_state === 'Cancelled' || (o.status || '').toLowerCase() === 'cancelled';
        const isDelivered = o.delivery_state === 'Completed' || ['delivered', 'completed'].includes((o.status || '').toLowerCase());

        let iconBg = 'bg-blue-100 text-[#0066cc]';
        let iconName = 'check_circle';
        let badgeHtml = `<div class="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">+₹${(typeof o.payout === 'number' ? o.payout : activeRate).toFixed(2)}</div>`;
        let subtextHtml = `<div class="text-[10px] text-[#5c5f60] font-semibold mt-1">Order: ₹${o.total}</div>`;

        if (isCancelled) {
            iconBg = 'bg-rose-100 text-rose-600';
            iconName = 'cancel';
            badgeHtml = `<div class="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">Cancelled • ₹0.00</div>`;
            subtextHtml = `<div class="text-[10px] text-rose-600 font-semibold mt-1">Order: ₹${o.total} (₹0 payout)</div>`;
        } else if (!isDelivered) {
            iconBg = 'bg-amber-100 text-amber-600';
            iconName = 'schedule';
            badgeHtml = `<div class="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Pending • ₹0.00</div>`;
            subtextHtml = `<div class="text-[10px] text-[#5c5f60] font-semibold mt-1">Order: ₹${o.total} (Pending)</div>`;
        }

        html += `
        <div class="p-3 bg-[#F8FAFD] hover:bg-[#F0F4F9] rounded-2xl border border-[#EBF0F7] flex items-center justify-between gap-3 transition-colors">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center font-black text-xs shrink-0">
                    <span class="material-symbols-outlined text-lg">${iconName}</span>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-black text-xs text-[#181c1f]">#${escapeHtml((o.id || '').slice(-8))}</span>
                        <span class="text-[10px] text-[#5c5f60] font-semibold">${escapeHtml(o.time || '')}</span>
                    </div>
                    <p class="text-[11px] text-[#5c5f60] truncate font-medium mt-0.5">${escapeHtml(o.address || 'Campus Room')}</p>
                </div>
            </div>

            <div class="text-right shrink-0">
                ${badgeHtml}
                ${subtextHtml}
            </div>
        </div>
        `;
    });

    listEl.innerHTML = html;
}

// Sub-Tab Switcher between Partner Dashboard and Fleet Overview
function setPartnerDashboardSubTab(subTab) {
    partnerDashboardSubTab = subTab;
    const partnerView = document.getElementById('earnings-subview-partner');
    const fleetView = document.getElementById('earnings-subview-fleet');
    const partnerBtn = document.getElementById('subtab-partner-btn');
    const fleetBtn = document.getElementById('subtab-fleet-btn');

    if (subTab === 'partner') {
        if (partnerView) partnerView.classList.remove('hidden');
        if (fleetView) fleetView.classList.add('hidden');
        if (partnerBtn) partnerBtn.className = 'px-4 py-2 rounded-xl bg-white text-[#0066cc] font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer';
        if (fleetBtn) fleetBtn.className = 'px-4 py-2 rounded-xl text-[#5c5f60] hover:text-[#181c1f] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer';
    } else {
        if (fleetView) fleetView.classList.remove('hidden');
        if (partnerView) partnerView.classList.add('hidden');
        if (fleetBtn) fleetBtn.className = 'px-4 py-2 rounded-xl bg-white text-[#0066cc] font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer';
        if (partnerBtn) partnerBtn.className = 'px-4 py-2 rounded-xl text-[#5c5f60] hover:text-[#181c1f] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer';

        if (currentEarningsData) {
            updateFleetViewMetrics(currentEarningsData);
        } else {
            loadDeliveryEarnings();
        }
    }
}

// Render Itemized Recent Payout Ledger in Partner Dashboard
function renderPartnerLedger(ledger) {
    const tbody = document.getElementById('partner-ledger-tbody');
    if (!tbody) return;

    if (!Array.isArray(ledger) || ledger.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="py-6 text-center text-[#5c5f60]">
                    <span class="material-symbols-outlined text-2xl text-slate-400">receipt_long</span>
                    <p class="text-xs font-bold mt-1">No ledger entries recorded yet.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    ledger.forEach(entry => {
        const isSelected = selectedDayFilter === entry.date;
        const rowBg = isSelected ? 'bg-blue-50/70 font-bold' : (entry.is_today ? 'bg-blue-50/30' : 'hover:bg-[#F8FAFD]');
        const tag = entry.is_today ? '<span class="text-[9px] bg-[#0066cc] text-white px-1.5 py-0.5 rounded font-black ml-1">TODAY</span>' : '';
        const statusBadge = entry.completed_deliveries > 0
            ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">Credited</span>'
            : '<span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">Settled</span>';

        html += `
            <tr class="${rowBg} cursor-pointer transition-colors" onclick="toggleEarningsDayFilter('${entry.date}')" title="Click to view orders for ${escapeHtml(entry.display_date)}">
                <td class="py-2.5 pr-2">
                    <div class="font-bold text-xs text-[#181c1f] flex items-center">
                        <span>${escapeHtml(entry.display_date)}</span>
                        ${tag}
                    </div>
                    <div class="text-[10px] text-[#5c5f60] mt-0.5">
                        ${entry.pending_deliveries > 0 ? `<span class="text-amber-600 font-semibold">${entry.pending_deliveries} Pending</span> • ` : ''}
                        ${entry.cancelled_deliveries > 0 ? `<span class="text-rose-600 font-semibold">${entry.cancelled_deliveries} Cancelled</span>` : '0 Cancelled'}
                    </div>
                </td>
                <td class="py-2.5 text-center">
                    <span class="font-black text-xs text-[#181c1f]">${entry.completed_deliveries}</span>
                    <span class="text-[10px] text-[#5c5f60] block font-medium">runs</span>
                </td>
                <td class="py-2.5 text-right pl-2">
                    <div class="text-xs font-black text-emerald-700">+₹${(entry.amount_credited || 0).toFixed(2)}</div>
                    <div class="mt-0.5">${statusBadge}</div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Render Admin Fleet Overview Table
function renderFleetPartnersTable(partners) {
    const tbody = document.getElementById('fleet-partners-tbody');
    if (!tbody) return;

    if (!Array.isArray(partners) || partners.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-[#5c5f60]">
                    <span class="material-symbols-outlined text-3xl text-slate-400">group_off</span>
                    <p class="text-xs font-bold mt-1">No delivery partners found in fleet roster.</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    partners.forEach(p => {
        const isOnline = p.availability_status === 'Active';
        const statusPill = isOnline
            ? '<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active</span>'
            : '<span class="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Offline</span>';

        const shiftBadge = p.primary_shift
            ? `<div class="text-[10px] text-indigo-700 font-semibold mt-0.5 flex items-center gap-1"><span class="material-symbols-outlined text-xs">schedule</span><span>${escapeHtml(p.primary_shift)}</span></div>`
            : '';

        html += `
            <tr class="hover:bg-[#f9fafb] transition-colors border-b border-[#F0F4F9]">
                <td class="p-4 font-mono font-bold text-xs text-[#181c1f]">#${escapeHtml(String(p.partner_id).slice(-8))}</td>
                <td class="p-4">
                    <div class="font-bold text-xs text-[#181c1f]">${escapeHtml(p.partner_name || 'Delivery Partner')}</div>
                    <div class="text-[10px] text-[#5c5f60] font-medium">${escapeHtml(p.phone || '+91 98765 43210')}</div>
                    ${shiftBadge}
                </td>
                <td class="p-4">${statusPill}</td>
                <td class="p-4 text-center font-black text-xs text-[#181c1f]">${p.today_deliveries || 0}</td>
                <td class="p-4 text-center font-black text-xs text-emerald-700 bg-emerald-50/50">₹${(p.today_wage || 0).toFixed(2)}</td>
                <td class="p-4 text-center font-black text-xs text-[#181c1f]">${p.monthly_deliveries || 0}</td>
                <td class="p-4 text-center font-black text-xs text-[#0066cc] bg-blue-50/50">₹${(p.monthly_payout || 0).toFixed(2)}</td>
                <td class="p-4 text-right">
                    <button type="button" onclick="inspectPartnerFromFleet('${escapeHtml(p.partner_id)}')" class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066cc] font-black text-xs border border-blue-200 transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95" title="View Partner Dashboard">
                        <span class="material-symbols-outlined text-xs">visibility</span>
                        <span>Inspect</span>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function inspectPartnerFromFleet(partnerId) {
    const riderSelect = document.getElementById('earnings-rider-select');
    if (riderSelect) riderSelect.value = partnerId;
    earningsSelectedRider = partnerId;
    setPartnerDashboardSubTab('partner');
    loadDeliveryEarnings();
}

// Partner Duty Toggle in Dashboard
function updatePartnerDutyUI(isOnDuty) {
    const dot = document.getElementById('partner-status-dot');
    const txt = document.getElementById('partner-status-text');
    const btnLabel = document.getElementById('partner-duty-btn-label');
    const btn = document.getElementById('partner-duty-toggle-btn');

    if (isOnDuty) {
        if (dot) dot.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
        if (txt) txt.textContent = 'Active';
        if (btnLabel) btnLabel.textContent = 'Switch to Offline';
        if (btn) btn.className = 'w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer';
    } else {
        if (dot) dot.className = 'w-3 h-3 rounded-full bg-slate-400';
        if (txt) txt.textContent = 'Offline';
        if (btnLabel) btnLabel.textContent = 'Switch to Active';
        if (btn) btn.className = 'w-full py-1.5 px-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer';
    }
}

// Partner Duty Toggle in Dashboard
async function togglePartnerDutyStatus() {
    partnerIsOnDuty = !partnerIsOnDuty;
    const newStatus = partnerIsOnDuty ? 'Active' : 'Offline';
    updatePartnerDutyUI(partnerIsOnDuty);

    try {
        const res = await fetchWithTimeout('/api/orders/delivery-duty-status', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                riderId: currentAdminProfile?.id,
                status: newStatus
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.is_on_duty === 'boolean') {
                partnerIsOnDuty = data.is_on_duty;
                updatePartnerDutyUI(partnerIsOnDuty);
            }
        }
    } catch (e) {
        console.warn('[Duty Status POST error]:', e.message);
    }

    if (partnerIsOnDuty) {
        showToast('🟢 Delivery Partner status set to ACTIVE (Online & Taking Deliveries)', 'success');
    } else {
        showToast('⚪ Delivery Partner status set to OFFLINE (Shift Paused - No Orders)', 'info');
    }
}

// Fleet Preset & Custom Date & Shift Filtering
function setFleetPresetFilter(preset) {
    const todayBtn = document.getElementById('fleet-filter-today');
    const weekBtn = document.getElementById('fleet-filter-week');
    const monthBtn = document.getElementById('fleet-filter-month');

    [todayBtn, weekBtn, monthBtn].forEach(b => {
        if (b) b.className = 'fleet-preset-btn px-3 py-1.5 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] hover:bg-white text-[#181c1f] font-bold transition-all cursor-pointer';
    });

    fleetCustomStartDate = null;
    fleetCustomEndDate = null;
    const startInput = document.getElementById('fleet-start-date');
    const endInput = document.getElementById('fleet-end-date');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    if (preset === 'today') {
        if (todayBtn) todayBtn.className = 'fleet-preset-btn px-3 py-1.5 rounded-xl border border-[#0066cc] bg-[#0066cc] text-white font-black transition-all cursor-pointer shadow-xs';
        switchEarningsPeriod('daily');
    } else if (preset === 'month') {
        if (monthBtn) monthBtn.className = 'fleet-preset-btn px-3 py-1.5 rounded-xl border border-[#0066cc] bg-[#0066cc] text-white font-black transition-all cursor-pointer shadow-xs';
        switchEarningsPeriod('monthly');
    } else {
        if (weekBtn) weekBtn.className = 'fleet-preset-btn px-3 py-1.5 rounded-xl border border-[#0066cc] bg-[#0066cc] text-white font-black transition-all cursor-pointer shadow-xs';
        switchEarningsPeriod('weekly');
    }
}

function filterFleetByShift(shiftId) {
    earningsSelectedShift = shiftId || 'all';
    const shiftSelect = document.getElementById('fleet-shift-filter');
    if (shiftSelect && shiftSelect.value !== earningsSelectedShift) {
        shiftSelect.value = earningsSelectedShift;
    }
    loadDeliveryEarnings(fleetCustomStartDate, fleetCustomEndDate);
}

function applyFleetCustomDateRange() {
    const startInput = document.getElementById('fleet-start-date');
    const endInput = document.getElementById('fleet-end-date');
    if (!startInput || !endInput || !startInput.value || !endInput.value) {
        showToast('Please select both start date and end date', 'warning');
        return;
    }
    fleetCustomStartDate = startInput.value;
    fleetCustomEndDate = endInput.value;
    loadDeliveryEarnings(fleetCustomStartDate, fleetCustomEndDate);
}

// CSV/Excel Export for Delivery Partner Payouts
function exportPartnerPayoutCSV() {
    if (!currentEarningsData) {
        showToast('No delivery earnings data loaded to export', 'error');
        return;
    }

    const partners = currentEarningsData.partners_summary || [];
    const ledger = currentEarningsData.recent_ledger || [];
    const now = new Date();
    const timestampStr = now.toISOString().slice(0, 10);
    const activeRate = Number(currentEarningsData.rate_per_order) || 3.00;

    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csv += 'LPUQuick - Delivery Fleet Partner Payout Sheet\n';
    csv += `Generated On,${now.toLocaleString('en-IN')}\n`;
    csv += `Fixed Rate Per Delivered Order,INR ${activeRate.toFixed(2)}\n`;
    csv += `Total Daily Payout Platform-Wide,INR ${(currentEarningsData.platform_metrics?.total_daily_payout || 0).toFixed(2)}\n`;
    csv += `Total Monthly Partner Expense,INR ${(currentEarningsData.platform_metrics?.total_monthly_expense || 0).toFixed(2)}\n\n`;

    csv += 'SECTION 1: PARTNER PERFORMANCE & WAGE ROSTER\n';
    csv += 'Partner ID,Partner Name,Phone,Availability Status,Today Deliveries,Today Wage (INR),Month Deliveries,Month Payout (INR),Total Deliveries\n';

    if (partners.length === 0) {
        csv += 'No registered partners found\n';
    } else {
        partners.forEach(p => {
            const row = [
                `"${p.partner_id || ''}"`,
                `"${(p.partner_name || '').replace(/"/g, '""')}"`,
                `"${p.phone || 'N/A'}"`,
                `"${p.availability_status || 'Active'}"`,
                p.today_deliveries || 0,
                (p.today_wage || 0).toFixed(2),
                p.monthly_deliveries || 0,
                (p.monthly_payout || 0).toFixed(2),
                p.total_completed || 0
            ];
            csv += row.join(',') + '\n';
        });
    }

    csv += '\nSECTION 2: ITEMIZED RECENT PAYOUT LEDGER\n';
    csv += 'Date,Day,Completed Deliveries,Pending Deliveries,Cancelled Deliveries,Rate (INR),Amount Credited (INR),Settlement Status\n';

    ledger.forEach(l => {
        const row = [
            `"${l.date}"`,
            `"${(l.display_date || '').replace(/"/g, '""')}"`,
            l.completed_deliveries || 0,
            l.pending_deliveries || 0,
            l.cancelled_deliveries || 0,
            activeRate.toFixed(2),
            (l.amount_credited || 0).toFixed(2),
            `"${l.settlement_status || 'Credited'}"`
        ];
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LPUQuick_Delivery_Payout_Sheet_${timestampStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('📥 Delivery partner payout sheet exported to CSV successfully!', 'success');
}

// =========================================================================
// DELIVERY PRICING ENGINE MODAL & RATE CONFIGURATION
// =========================================================================
function openDeliveryPricingModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;

    const currentRate = Number(currentEarningsData?.rate_per_order) || 3.00;
    const currentThreshold = Number(currentEarningsData?.pricing_config?.daily_bonus_threshold) || 20;
    const currentBonus = Number(currentEarningsData?.pricing_config?.daily_bonus_amount) || 20.00;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
                <!-- Header -->
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2.5">
                        <span class="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                            <span class="material-symbols-outlined text-2xl">payments</span>
                        </span>
                        <div>
                            <h3 class="font-black text-base text-[#181c1f]">Delivery Pricing Engine</h3>
                            <p class="text-[11px] text-[#5c5f60]">Configure per-order payout rate & performance incentives</p>
                        </div>
                    </div>
                    <button type="button" onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold cursor-pointer">✕</button>
                </div>

                <!-- Rate per Order Form -->
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-black text-[#181c1f] mb-1.5">Delivery Payout Rate Per Order (₹)</label>
                        <div class="relative">
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-base">₹</span>
                            <input type="number" id="pricing-rate-input" step="0.5" min="0.5" max="200" value="${currentRate}" oninput="updatePricingPreview()" class="w-full pl-8 pr-4 py-2.5 bg-[#F8FAFD] border border-[#DADCE0] rounded-2xl font-black text-xl text-[#181c1f] focus:bg-white focus:border-[#0066cc] outline-none transition-all">
                        </div>
                    </div>

                    <!-- Quick Preset Rate Chips -->
                    <div>
                        <span class="text-[11px] text-[#5c5f60] font-bold block mb-1.5">Quick Presets:</span>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${[3.00, 4.00, 5.00, 7.00, 10.00, 15.00].map(r => `
                                <button type="button" onclick="setPricingPreset(${r})" class="px-3 py-1.5 rounded-xl border ${currentRate === r ? 'border-[#0066cc] bg-blue-50 text-[#0066cc] font-black' : 'border-[#DADCE0] bg-white text-[#181c1f] font-bold hover:bg-slate-50'} text-xs transition-all cursor-pointer active:scale-95">
                                    ₹${r.toFixed(2)}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Daily Incentive Tier Inputs -->
                    <div class="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label class="block text-[11px] font-bold text-[#5c5f60] mb-1">Daily Target Orders</label>
                            <input type="number" id="pricing-target-input" min="1" max="100" value="${currentThreshold}" oninput="updatePricingPreview()" class="w-full px-3 py-2 bg-[#F8FAFD] border border-[#DADCE0] rounded-xl font-bold text-xs text-[#181c1f] outline-none focus:bg-white focus:border-[#0066cc]">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-[#5c5f60] mb-1">Bonus Cash (₹)</label>
                            <input type="number" id="pricing-bonus-input" min="0" max="500" value="${currentBonus}" oninput="updatePricingPreview()" class="w-full px-3 py-2 bg-[#F8FAFD] border border-[#DADCE0] rounded-xl font-bold text-xs text-[#181c1f] outline-none focus:bg-white focus:border-[#0066cc]">
                        </div>
                    </div>

                    <!-- Live Real-Time Formula Preview Card -->
                    <div class="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-black text-emerald-950 flex items-center gap-1">
                                <span class="material-symbols-outlined text-sm text-emerald-700">calculate</span>
                                <span>Real-World Earnings Simulation</span>
                            </span>
                            <span id="pricing-preview-badge" class="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300">₹${currentRate.toFixed(2)} / order</span>
                        </div>
                        <p id="pricing-preview-desc" class="text-[11px] text-emerald-800 leading-relaxed font-medium">
                            A runner completing <strong>20 orders</strong> today will earn: <strong>₹${(20 * currentRate).toFixed(2)}</strong> direct wage + <strong>₹${currentBonus.toFixed(2)}</strong> daily bonus = <strong>₹${((20 * currentRate) + currentBonus).toFixed(2)}</strong> total.
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 pt-2">
                    <button type="button" onclick="closePartnerModal()" class="flex-1 py-2.5 rounded-xl border border-[#DADCE0] bg-[#F8FAFD] hover:bg-white text-[#181c1f] font-bold text-xs cursor-pointer transition-all">Cancel</button>
                    <button type="button" onclick="saveDeliveryPricingConfig()" class="flex-1 py-2.5 rounded-xl bg-[#0066cc] hover:bg-[#0052a3] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95">
                        <span class="material-symbols-outlined text-sm">save</span>
                        <span>Save & Apply Pricing</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setPricingPreset(rate) {
    const input = document.getElementById('pricing-rate-input');
    if (input) {
        input.value = rate;
        updatePricingPreview();
    }
}

function updatePricingPreview() {
    const input = document.getElementById('pricing-rate-input');
    const badge = document.getElementById('pricing-preview-badge');
    const desc = document.getElementById('pricing-preview-desc');
    const bonusInput = document.getElementById('pricing-bonus-input');

    const rate = Math.max(0.5, parseFloat(input?.value) || 3.00);
    const bonus = parseFloat(bonusInput?.value) || 20.00;

    if (badge) badge.textContent = `₹${rate.toFixed(2)} / order`;
    if (desc) {
        desc.innerHTML = `A runner completing <strong>20 orders</strong> today will earn: <strong>₹${(20 * rate).toFixed(2)}</strong> direct wage + <strong>₹${bonus.toFixed(2)}</strong> daily bonus = <strong>₹${((20 * rate) + bonus).toFixed(2)}</strong> total.`;
    }
}

async function saveDeliveryPricingConfig() {
    const rateInput = document.getElementById('pricing-rate-input');
    const targetInput = document.getElementById('pricing-target-input');
    const bonusInput = document.getElementById('pricing-bonus-input');

    const rate = parseFloat(rateInput?.value);
    const target = parseInt(targetInput?.value, 10);
    const bonus = parseFloat(bonusInput?.value);

    if (isNaN(rate) || rate < 0.50 || rate > 500) {
        showToast('Please enter a valid rate between ₹0.50 and ₹500.00', 'warning');
        return;
    }

    try {
        const res = await fetchWithTimeout('/api/orders/delivery-pricing-config', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                rate_per_order: rate,
                daily_bonus_threshold: isNaN(target) ? 20 : target,
                daily_bonus_amount: isNaN(bonus) ? 20.00 : bonus,
                updated_by: currentAdminProfile?.name || 'Owner'
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update pricing');

        closePartnerModal();
        showToast(`⚡ Delivery rate updated to ₹${rate.toFixed(2)} / order! Recalculating all metrics...`, 'success');
        await loadDeliveryEarnings();
    } catch (err) {
        console.error('[Save Delivery Pricing Error]:', err);
        showToast('Error saving delivery rate: ' + err.message, 'error');
    }
}

window.openDeliveryPricingModal = openDeliveryPricingModal;
window.setPricingPreset = setPricingPreset;
window.updatePricingPreview = updatePricingPreview;
window.saveDeliveryPricingConfig = saveDeliveryPricingConfig;

// Partner Drawer Slide-over Controls (Screenshot 2)
function openPartnerDrawer() {
    const drawer = document.getElementById('partner-drawer');
    const backdrop = document.getElementById('partner-drawer-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
    }
}

function closePartnerDrawer() {
    const drawer = document.getElementById('partner-drawer');
    const backdrop = document.getElementById('partner-drawer-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-x-full');
    }
}

function toggleDutyStatus() {
    partnerIsOnDuty = !partnerIsOnDuty;
    const btn = document.getElementById('drawer-duty-btn');
    const txt = document.getElementById('drawer-duty-text');
    if (btn && txt) {
        if (partnerIsOnDuty) {
            btn.className = 'w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer';
            txt.textContent = 'ON DUTY (Active)';
            showToast('🟢 You are now ON DUTY. Campus orders will be dispatched to you.', 'success');
        } else {
            btn.className = 'w-full py-2 px-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer';
            txt.textContent = 'OFF DUTY (Paused)';
            showToast('⚪ You are now OFF DUTY. New dispatch alerts paused.', 'info');
        }
    }
}

// Dialog Modals for Partner Drawer Actions
function openPartnerShiftModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;

    const shifts = currentEarningsData?.shifts_summary || [
        { id: 'morning', title: 'Morning Shift', hours: '08:00 AM – 02:00 PM', completed_today: 0, earned_wage: 0, is_current: false },
        { id: 'evening', title: 'Evening Rush', hours: '02:00 PM – 08:00 PM', completed_today: 0, earned_wage: 0, is_current: true },
        { id: 'night', title: 'Night Express', hours: '08:00 PM – 02:00 AM', completed_today: 0, earned_wage: 0, is_current: false },
        { id: 'late_night', title: 'Late Night Overtime', hours: '02:00 AM – 08:00 AM', completed_today: 0, earned_wage: 0, is_current: false }
    ];

    const totalDeliveriesToday = shifts.reduce((acc, s) => acc + (s.completed_today || 0), 0);
    const totalWageToday = shifts.reduce((acc, s) => acc + (s.earned_wage || 0), 0);

    let shiftsHtml = '';
    shifts.forEach(s => {
        const isCurrent = s.is_current;
        const borderClass = isCurrent ? 'border-2 border-[#0066cc] bg-blue-50/50' : 'border border-[#EBF0F7] bg-[#F8FAFD]';
        const activeBadge = isCurrent
            ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>ACTIVE NOW</span>'
            : '<span class="text-[10px] text-[#5c5f60] font-bold bg-slate-100 px-2 py-0.5 rounded-full">Scheduled</span>';

        shiftsHtml += `
            <div class="p-3.5 rounded-2xl ${borderClass} transition-all space-y-2">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-black text-xs text-[#181c1f] flex items-center gap-1.5">
                            <span>${escapeHtml(s.title)}</span>
                        </div>
                        <div class="text-[11px] text-[#5c5f60] font-semibold mt-0.5">🕒 ${escapeHtml(s.hours)}</div>
                    </div>
                    ${activeBadge}
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <div class="flex items-center gap-2">
                        <span class="text-[#5c5f60] font-medium">Deliveries Today:</span>
                        <span class="font-black text-[#181c1f] bg-white px-2 py-0.5 rounded-lg border border-slate-200">${s.completed_today} runs</span>
                    </div>
                    <div class="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        +₹${(s.earned_wage || 0).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    });

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center font-bold">
                            <span class="material-symbols-outlined text-lg">schedule</span>
                        </span>
                        <div>
                            <h3 class="font-black text-base text-[#181c1f]">Delivery Partner Shifts & Timings</h3>
                            <p class="text-[11px] text-[#5c5f60]">Real-world 24/7 campus shift breakdown with live delivery wage accrual</p>
                        </div>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold cursor-pointer">✕</button>
                </div>

                <!-- Shift Performance Summary Banner -->
                <div class="p-3.5 bg-gradient-to-r from-blue-900 to-[#0066cc] text-white rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <div class="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Today's Shift Wage Accrual</div>
                        <div class="text-xl font-black mt-0.5">₹${totalWageToday.toFixed(2)}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Total Shift Runs</div>
                        <div class="text-xl font-black mt-0.5">${totalDeliveriesToday} Orders</div>
                    </div>
                </div>

                <!-- Shift Cards List -->
                <div class="space-y-2.5">
                    ${shiftsHtml}
                </div>

                <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-700 text-lg">verified</span>
                        <div>
                            <div class="font-black text-emerald-900">₹3.00 Fixed Rate Guaranteed</div>
                            <div class="text-[11px] text-emerald-800">Direct credit per completed delivery across all shifts</div>
                        </div>
                    </div>
                </div>

                <button onclick="closePartnerModal()" class="w-full py-2.5 rounded-xl bg-[#181c1f] hover:bg-black text-white font-bold text-xs cursor-pointer transition-all">Close</button>
            </div>
        </div>
    `;
}

function openPartnerProfileModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    const name = currentAdminProfile?.name || 'LPU Delivery Runner';
    const email = currentAdminProfile?.email || 'runner@lpuquick.com';
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">person</span>
                        <h3 class="font-black text-base text-[#181c1f]">Partner Profile</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="flex items-center gap-4 p-4 bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7]">
                    <div class="w-14 h-14 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-xl font-black">
                        ${name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-black text-base text-[#181c1f]">${escapeHtml(name)}</div>
                        <div class="text-xs text-[#5c5f60] font-semibold">${escapeHtml(email)}</div>
                        <div class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">Verified Delivery Runner</div>
                    </div>
                </div>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between py-2 border-b border-slate-100">
                        <span class="text-slate-500">Partner ID</span>
                        <span class="font-bold text-[#181c1f]">2000516247_DPI66365</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-slate-100">
                        <span class="text-slate-500">Assigned Hub</span>
                        <span class="font-bold text-[#181c1f]">${escapeHtml(activeAdminHostelFilter?.deliveryEarnings || 'Campus')} Ground Station</span>
                    </div>
                    <div class="flex justify-between py-2 border-b border-slate-100">
                        <span class="text-slate-500">Delivery Rate</span>
                        <span class="font-bold text-emerald-700">₹3.00 / Order</span>
                    </div>
                </div>
                <button onclick="closePartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Done</button>
            </div>
        </div>
    `;
}

function openPartnerReferralModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-600">group</span>
                        <h3 class="font-black text-base text-[#181c1f]">Refer a Delivery Partner</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-2">
                    <div class="text-xs text-purple-900 font-bold">Your Unique Referral Code</div>
                    <div class="text-2xl font-black text-purple-700 tracking-widest bg-white p-2 rounded-xl border border-purple-200">RUNNER66365</div>
                    <p class="text-[11px] text-purple-800">Earn ₹100 direct cash bonus when a fellow LPU student signs up as a runner and completes their first 20 deliveries!</p>
                </div>
                <button onclick="navigator.clipboard.writeText('RUNNER66365'); showToast('Referral code copied to clipboard!', 'success'); closePartnerModal();" class="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">Copy Code</button>
            </div>
        </div>
    `;
}

function openEarningsNotificationModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-500">notifications</span>
                        <h3 class="font-black text-base text-[#181c1f]">Partner Announcements</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-2 text-xs">
                    <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                        <div class="font-bold text-blue-900">✨ Automatic ₹3.00 Delivery Payout Active</div>
                        <p class="text-blue-800 text-[11px] mt-0.5">Every successfully marked Delivered order automatically credits ₹3 to your ledger. Check your weekly bar chart for day-wise breakdown.</p>
                    </div>
                    <div class="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                        <div class="font-bold text-amber-900">⚡ Campus Express Rush Hours</div>
                        <p class="text-amber-800 text-[11px] mt-0.5">Peak midnight hunger hours (10:00 PM - 01:30 AM). Multi-run orders eligible for fastest corridor batching.</p>
                    </div>
                </div>
                <button onclick="closePartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
}

function openTaxRefundModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">receipt_long</span>
                        <h3 class="font-black text-base text-[#181c1f]">Tax Invoices & TDS Slips</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-2 text-xs">
                    <p class="text-slate-600 font-medium">As an LPU campus gig delivery partner, your payouts are exempt from Section 194C withholding under student freelance tier.</p>
                    <div class="p-3 bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7] space-y-1">
                        <div class="font-bold text-[#181c1f]">FY 2026-2027 Statement:</div>
                        <div class="text-slate-600">Total Orders Delivered: <span class="font-bold text-[#181c1f]">144 Orders</span></div>
                        <div class="text-slate-600">Calculated Payout: <span class="font-bold text-emerald-700">₹432.00</span></div>
                        <div class="text-slate-600">Tax Deducted: <span class="font-bold text-[#181c1f]">₹0.00</span></div>
                    </div>
                </div>
                <button onclick="showToast('Tax statement downloaded successfully', 'success'); closePartnerModal();" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Download PDF Statement</button>
            </div>
        </div>
    `;
}

function openPartnerHelpModal() {
    closePartnerDrawer();
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-600">support_agent</span>
                        <h3 class="font-black text-base text-[#181c1f]">Partner Support Helpline</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-3 text-xs">
                    <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div class="font-bold text-emerald-900">Campus Hub Central Dispatch Desk</div>
                        <div class="text-emerald-800 text-[11px] mt-0.5">Phone: +91 98765 43210 (Direct Campus extension)</div>
                        <div class="text-emerald-800 text-[11px]">Location: Ground Floor Dispatch Hub</div>
                    </div>
                    <div class="p-3 bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7]">
                        <div class="font-bold text-[#181c1f]">Emergency Assistance</div>
                        <p class="text-slate-600 text-[11px] mt-0.5">For hostel security gate clearance or student room entry queries, contact Hub supervisor on duty.</p>
                    </div>
                </div>
                <button onclick="closePartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
}

function showEarningsInfoModal() {
    const modalContainer = document.getElementById('partner-modal-container');
    if (!modalContainer) return;
    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">info</span>
                        <h3 class="font-black text-base text-[#181c1f]">How Your Earnings Are Calculated</h3>
                    </div>
                    <button onclick="closePartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-3 text-xs">
                    <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200 space-y-1">
                        <div class="font-black text-[#0066cc]">1. Order Payout (₹3.00 / Delivered Order)</div>
                        <p class="text-slate-600">Every single order marked Delivered generates a ₹3.00 delivery fee credited to the assigned delivery partner.</p>
                    </div>
                    <div class="p-3 bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7] space-y-1">
                        <div class="font-bold text-[#181c1f]">2. Single Runs vs Multi Runs</div>
                        <p class="text-slate-600">Orders delivered individually are Single Runs. Multiple deliveries carried in the same 15-minute window are batched as Multi Runs.</p>
                    </div>
                    <div class="p-3 bg-[#F8FAFD] rounded-2xl border border-[#EBF0F7] space-y-1">
                        <div class="font-bold text-[#181c1f]">3. Day-Wise Statistics</div>
                        <p class="text-slate-600">The bar chart aggregates orders by calendar date (Monday to Sunday in Weekly mode, and whole month in Monthly mode).</p>
                    </div>
                </div>
                <button onclick="closePartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Got it</button>
            </div>
        </div>
    `;
}

function closePartnerModal() {
    const modalContainer = document.getElementById('partner-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
}

// ============================================================
// BACKUP & DISASTER RECOVERY (0 - 100) CLIENT CONTROLLER
// ============================================================

let currentLoadedBackupZip = null;
let currentLoadedBackupManifest = null;
let currentBackupStatus = null;

/**
 * Fetch and display current live system snapshot metrics
 */
async function loadBackupDashboard() {
    const token = adminToken || localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    try {
        const res = await fetchWithTimeout('/api/admin/backup/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (!data.success) {
            showToast(data.error || 'Failed to fetch backup status', 'error');
            return;
        }

        currentBackupStatus = data;
        const tables = data.tables || {};

        // Update Snapshot Cards
        const elUsers = document.getElementById('backup-stat-users');
        if (elUsers) elUsers.textContent = (tables.users !== undefined && tables.users >= 0) ? tables.users.toLocaleString() : '0';

        const elProducts = document.getElementById('backup-stat-products');
        if (elProducts) elProducts.textContent = (tables.products !== undefined && tables.products >= 0) ? tables.products.toLocaleString() : '0';

        const elOrders = document.getElementById('backup-stat-orders');
        if (elOrders) {
            const oCount = tables.orders || 0;
            const iCount = tables.order_items || 0;
            elOrders.textContent = `${oCount.toLocaleString()} (${iCount} items)`;
        }

        const elUploads = document.getElementById('backup-stat-uploads');
        if (elUploads) {
            const up = data.uploads || { count: 0, size_mb: 0 };
            elUploads.textContent = `${up.count} files (${up.size_mb} MB)`;
        }
    } catch (err) {
        console.error('[Backup Dashboard Error]:', err);
        showToast('Error loading backup metrics: ' + err.message, 'error');
    }
}

/**
 * 1-Click System Export (0 - 100):
 * Queries DB + configs, downloads all images via CDN, and bundles into a standard .ZIP client-side.
 */
async function startFullSystemExport() {
    if (typeof JSZip === 'undefined') {
        showToast('Archive engine is initializing. Please try again in a few seconds.', 'warning');
        return;
    }

    const token = adminToken || localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    const btn = document.getElementById('btn-start-export');
    const progressWrap = document.getElementById('backup-export-progress-wrap');
    const progressBar = document.getElementById('backup-export-bar');
    const statusText = document.getElementById('backup-export-status-text');
    const percentText = document.getElementById('backup-export-percent-text');

    if (btn) btn.disabled = true;
    if (progressWrap) progressWrap.classList.remove('hidden');

    function updateExportProgress(percent, text) {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        if (statusText) statusText.textContent = text;
    }

    try {
        updateExportProgress(10, 'Extracting database tables & server configs...');
        const res = await fetchWithTimeout('/api/admin/backup/export-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        }, 60000);
        const payload = await res.json();

        if (!payload.success) {
            throw new Error(payload.error || 'Server rejected export request');
        }

        const { manifest, database, configs, uploads } = payload;
        const zip = new JSZip();

        // 1. Add Manifest
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));

        // 2. Add Database Tables
        const dbFolder = zip.folder('database');
        for (const [tableName, rows] of Object.entries(database)) {
            dbFolder.file(`${tableName}.json`, JSON.stringify(rows, null, 2));
        }

        // 3. Add Server Configs
        const configFolder = zip.folder('config');
        for (const [cfgKey, cfgData] of Object.entries(configs)) {
            if (cfgData !== null && cfgData !== undefined) {
                configFolder.file(`${cfgKey}.json`, JSON.stringify(cfgData, null, 2));
            }
        }

        // 4. Download and Add Images via CDN
        const uploadsFolder = zip.folder('uploads');
        const totalImages = (uploads || []).length;
        let downloadedCount = 0;

        for (const img of (uploads || [])) {
            try {
                const imgRes = await fetch(img.url);
                if (imgRes.ok) {
                    const blob = await imgRes.blob();
                    uploadsFolder.file(img.filename, blob);
                }
            } catch (imgErr) {
                console.warn(`[Export Warning] Failed to bundle image ${img.filename}:`, imgErr.message);
            }
            downloadedCount++;
            const pct = Math.min(80, 20 + Math.round((downloadedCount / Math.max(1, totalImages)) * 60));
            updateExportProgress(pct, `Packaging images (${downloadedCount}/${totalImages})...`);
        }

        // 5. Compress Archive
        updateExportProgress(85, 'Compressing 0-100 system archive...');
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        }, (meta) => {
            const pct = Math.min(99, 85 + Math.round(meta.percent * 0.14));
            updateExportProgress(pct, `Compressing archive (${Math.round(meta.percent)}%)...`);
        });

        updateExportProgress(100, 'Download starting...');

        // 6. Trigger Browser Download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `LPUQuick_Full_Backup_${timestamp}.zip`;
        const blobUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        showToast('🎉 Complete 0-100 system backup archive downloaded!', 'success');
    } catch (err) {
        console.error('[Export Error]:', err);
        showToast('Backup export failed: ' + err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
        setTimeout(() => {
            if (progressWrap) progressWrap.classList.add('hidden');
            updateExportProgress(0, '');
        }, 3000);
    }
}

/**
 * Handle selection / drop of backup ZIP file
 */
async function handleBackupFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (typeof JSZip === 'undefined') {
        showToast('Archive engine is initializing. Please wait.', 'warning');
        return;
    }

    try {
        showToast('Inspecting backup archive...', 'info');
        const zip = await JSZip.loadAsync(file);

        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
            showToast('Invalid backup: manifest.json not found in archive.', 'error');
            return;
        }

        const manifest = JSON.parse(await manifestFile.async('string'));
        currentLoadedBackupZip = zip;
        currentLoadedBackupManifest = manifest;

        // Populate inspection card
        const card = document.getElementById('backup-inspection-card');
        if (card) card.classList.remove('hidden');

        const elApp = document.getElementById('inspect-backup-app');
        if (elApp) elApp.textContent = `${manifest.app || 'LPUQuick'} Backup v${manifest.version || '1.0'}`;

        const elDate = document.getElementById('inspect-backup-date');
        if (elDate && manifest.created_at) {
            elDate.textContent = `Created: ${new Date(manifest.created_at).toLocaleString()}`;
        }

        const tables = manifest.tables || {};
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val !== undefined ? val.toLocaleString() : '0';
        };

        setVal('inspect-users-count', tables.users);
        setVal('inspect-products-count', tables.products);
        setVal('inspect-orders-count', tables.orders);
        setVal('inspect-items-count', tables.order_items);
        setVal('inspect-images-count', manifest.uploads?.count || 0);
        setVal('inspect-configs-count', (manifest.configs || []).length);

        showToast('Backup archive verified! Choose restore strategy below.', 'success');
    } catch (err) {
        console.error('[Inspect Backup Error]:', err);
        showToast('Failed to parse backup archive: ' + err.message, 'error');
    }
}

/**
 * Confirm and execute full disaster recovery restore with chunked image batches
 */
async function confirmAndExecuteRestore() {
    if (!currentLoadedBackupZip || !currentLoadedBackupManifest) {
        showToast('Please select a valid backup ZIP archive first.', 'warning');
        return;
    }

    const selectedRadio = document.querySelector('input[name="restore-mode"]:checked');
    const mode = selectedRadio?.value || 'clean';

    const promptMessage = mode === 'clean'
        ? 'Type "RESTORE" to execute Clean Ditto Mirror restore. All existing records will be replaced with the backup archive data:'
        : 'Type "RESTORE" to execute Safe Merge restore. Matching records will be updated and new ones inserted:';

    const confirmation = prompt(promptMessage);
    if (confirmation !== 'RESTORE') {
        showToast('Restore cancelled by user.', 'info');
        return;
    }

    const token = adminToken || localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    const btn = document.getElementById('btn-execute-restore');
    const progressWrap = document.getElementById('backup-restore-progress-wrap');
    const progressBar = document.getElementById('backup-restore-bar');
    const statusText = document.getElementById('backup-restore-status-text');
    const percentText = document.getElementById('backup-restore-percent-text');

    if (btn) btn.disabled = true;
    if (progressWrap) progressWrap.classList.remove('hidden');

    function updateRestoreProgress(percent, text) {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        if (statusText) statusText.textContent = text;
    }

    try {
        const zip = currentLoadedBackupZip;

        // 1. Extract Database Tables from ZIP
        updateRestoreProgress(10, 'Extracting database tables from archive...');
        const tables = {};
        const expectedTables = [
            'users',
            'products',
            'app_availability',
            'blacklisted_users',
            'orders',
            'order_items',
            'cart_items',
            'audit_logs'
        ];

        for (const tableName of expectedTables) {
            const tableFile = zip.file(`database/${tableName}.json`);
            if (tableFile) {
                tables[tableName] = JSON.parse(await tableFile.async('string'));
            } else {
                tables[tableName] = [];
            }
        }

        // 2. Extract Configs from ZIP
        updateRestoreProgress(20, 'Extracting server configuration settings...');
        const configs = {};
        const configFiles = ['banners', 'delivery_settings', 'rider_availability', 'push_subscriptions'];
        for (const cfg of configFiles) {
            const cfgFile = zip.file(`config/${cfg}.json`);
            if (cfgFile) {
                configs[cfg] = JSON.parse(await cfgFile.async('string'));
            }
        }

        // 3. Send Database + Configs to Server
        updateRestoreProgress(30, `Restoring database in [${mode.toUpperCase()}] mode...`);
        const dbRestoreRes = await fetchWithTimeout('/api/admin/backup/restore-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tables, configs, mode })
        }, 60000);
        const dbData = await dbRestoreRes.json();
        if (!dbData.success) {
            throw new Error(dbData.error || 'Database restoration failed on server');
        }

        // 4. Extract and Batch Upload Images (Vercel-Safe Chunks of 6 images)
        updateRestoreProgress(50, 'Extracting image assets from archive...');
        const imageEntries = [];
        for (const relPath of Object.keys(zip.files)) {
            if (relPath.startsWith('uploads/') && !relPath.endsWith('/')) {
                const filename = relPath.replace('uploads/', '');
                const base64Data = await zip.file(relPath).async('base64');
                imageEntries.push({ filename, data: base64Data });
            }
        }

        const totalImgs = imageEntries.length;
        const imgBatchSize = 6;
        let uploadedImgs = 0;

        for (let i = 0; i < totalImgs; i += imgBatchSize) {
            const batch = imageEntries.slice(i, i + imgBatchSize);
            const pct = Math.min(85, 50 + Math.round((uploadedImgs / Math.max(1, totalImgs)) * 35));
            updateRestoreProgress(pct, `Restoring images (${uploadedImgs}/${totalImgs})...`);

            const imgRes = await fetchWithTimeout('/api/admin/backup/restore-images', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ files: batch })
            }, 60000);
            const imgData = await imgRes.json();
            if (!imgData.success) {
                console.warn('[Restore Image Batch Warning]:', imgData.error);
            }
            uploadedImgs += batch.length;
        }

        // 5. Run Post-Restoration Integrity Verification
        updateRestoreProgress(90, 'Verifying system integrity against manifest...');
        const verifyRes = await fetchWithTimeout('/api/admin/backup/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ manifest: currentLoadedBackupManifest })
        }, 60000);
        const verifyData = await verifyRes.json();

        updateRestoreProgress(100, 'Restoration complete!');

        const isFullyVerified = verifyData.report?.verified;
        if (isFullyVerified) {
            showToast('🎉 100% COMPLETE SYSTEM RESTORE SUCCESSFUL & VERIFIED!', 'success');
        } else {
            showToast('System restored with minor count variations (check audit logs).', 'warning');
        }

        // Refresh live dashboard metrics
        await loadBackupDashboard();

        // Hide pre-restore inspection card
        const card = document.getElementById('backup-inspection-card');
        if (card) card.classList.add('hidden');
        currentLoadedBackupZip = null;
        currentLoadedBackupManifest = null;
    } catch (err) {
        console.error('[Full Restore Error]:', err);
        showToast('Restore failed: ' + err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
        setTimeout(() => {
            if (progressWrap) progressWrap.classList.add('hidden');
            updateRestoreProgress(0, '');
        }, 3500);
    }
}






// Toggle Employee / Staff Duty Status (On Duty / Off Duty) across Admin Console
window.toggleEmployeeDuty = async function (empId, setOnDuty) {
    if (!empId) return;
    try {
        const res = await fetch(`/api/admin/employees/${empId}/duty-status`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ is_on_duty: setOnDuty, duty_status: setOnDuty ? 'ON_DUTY' : 'OFF_DUTY', status: setOnDuty ? 'Active' : 'Offline' })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Duty status updated: ${setOnDuty ? '🟢 ON DUTY (Online)' : '⚪ OFF DUTY (Offline)'}`, 'success');

            // 1. Update in-memory employeesCache
            if (typeof employeesCache !== 'undefined' && Array.isArray(employeesCache)) {
                const found = employeesCache.find(e => e.id === empId);
                if (found) {
                    found.is_on_duty = setOnDuty;
                    found.duty_status = setOnDuty ? 'ON_DUTY' : 'OFF_DUTY';
                    if (found.delivery_data) {
                        found.delivery_data.duty_status = setOnDuty ? 'ON_DUTY' : 'OFF_DUTY';
                    }
                }
                const onDutyCount = employeesCache.filter(e => e.duty_status === 'ON_DUTY' || e.is_on_duty).length;
                const statOnDuty = document.getElementById('stat-emp-onduty');
                if (statOnDuty) statOnDuty.textContent = onDutyCount;
                filterEmployeesList();
            } else if (typeof loadEmployeesList === 'function') {
                loadEmployeesList();
            }

            // 2. Update in-memory staffCache
            if (typeof staffCache !== 'undefined' && Array.isArray(staffCache)) {
                const foundStaff = staffCache.find(s => s.id === empId);
                if (foundStaff) {
                    foundStaff.is_on_duty = setOnDuty;
                    foundStaff.duty_status = setOnDuty ? 'ON_DUTY' : 'OFF_DUTY';
                }
                renderStaffTable(staffCache);
            }

            // 3. If current logged-in user changed their own duty status, keep local state in sync
            if (currentAdminProfile && currentAdminProfile.id === empId) {
                partnerIsOnDuty = setOnDuty;
                if (typeof updatePartnerDutyUI === 'function') {
                    updatePartnerDutyUI(partnerIsOnDuty);
                }
            }
        } else {
            showToast(data.error || 'Failed to update duty status', 'error');
        }
    } catch (err) {
        console.error('[toggleEmployeeDuty Error]:', err);
        showToast('Network error updating duty status: ' + err.message, 'error');
    }
};

// =========================================================================
// OWNER-ONLY: OFFERS & CHARGES CONTROLLER
// =========================================================================

let currentOffersSettings = null;

/**
 * Loads the active Offers & Charges configuration from backend API
 */
async function loadOffersChargesView() {
    // 1. Role-check guard: Owner only
    if (currentAdminProfile && !currentAdminProfile.is_owner) {
        showToast('Access restricted: Owner/Super Admin only.', 'error');
        switchView('dashboard');
        return;
    }

    const alertEl = document.getElementById('offers-charges-alert');
    if (alertEl) alertEl.classList.add('hidden');

    const statusPill = document.getElementById('offers-status-pill');
    if (statusPill) {
        statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-spin"></span> Syncing...';
    }

    try {
        const res = await fetchWithTimeout('/api/admin/offers-charges', {
            headers: getAuthHeaders()
        }, 5000);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status} Error`);
        }

        const data = await res.json();
        if (data.success && data.settings) {
            currentOffersSettings = data.settings;
            populateOffersChargesForm(data.settings);
            updateOffersChargesLivePreview();

            if (statusPill) {
                statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced';
            }
        } else {
            throw new Error(data.error || 'Failed to load offers configuration');
        }
    } catch (err) {
        console.error('[loadOffersChargesView Error]:', err);
        showOffersChargesAlert('Could not load configuration: ' + err.message, 'error');
        if (statusPill) {
            statusPill.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Sync Failed';
        }
    }
}

/**
 * Populates all form fields with settings received from the server
 */
function populateOffersChargesForm(settings) {
    if (!settings) return;

    // Master Switch
    const offersActive = Boolean(settings.offers_enabled);
    updateMasterSwitchUI('offers-master-switch', 'offers-master-switch-knob', 'offers-master-switch-label', offersActive, 'ON', 'OFF');
    const fieldsContainer = document.getElementById('offers-config-fields');
    if (fieldsContainer) {
        fieldsContainer.style.opacity = offersActive ? '1' : '0.55';
    }

    // Offer Type
    const offerType = settings.offer_type || 'percentage';
    const radio = document.querySelector(`input[name="offer_type"][value="${offerType}"]`);
    if (radio) radio.checked = true;

    // Discount Value & Unit
    const discInput = document.getElementById('input-discount-val');
    if (discInput) discInput.value = settings.offer_value ?? 10;
    updateOfferUnitLabel(offerType);

    // Min Order & Max Discount
    const minOrderInput = document.getElementById('input-offer-min-order');
    if (minOrderInput) minOrderInput.value = settings.minimum_order_value ?? 199;

    const maxDiscInput = document.getElementById('input-offer-max-discount');
    if (maxDiscInput) maxDiscInput.value = settings.maximum_discount ?? 50;

    // Dates
    const startInput = document.getElementById('input-offer-start-date');
    if (startInput) {
        startInput.value = settings.start_date ? formatForDatetimeLocal(settings.start_date) : '';
    }
    const endInput = document.getElementById('input-offer-end-date');
    if (endInput) {
        endInput.value = settings.end_date ? formatForDatetimeLocal(settings.end_date) : '';
    }

    // Delivery Fee
    const delFeeInput = document.getElementById('input-delivery-fee');
    if (delFeeInput) delFeeInput.value = settings.delivery_fee ?? 0;

    const freeDelActive = Boolean(settings.free_delivery_enabled);
    updateMasterSwitchUI('free-delivery-switch', 'free-delivery-switch-knob', 'free-delivery-switch-label', freeDelActive, 'Free: ON', 'Free: OFF');

    const freeThreshInput = document.getElementById('input-free-delivery-threshold');
    if (freeThreshInput) freeThreshInput.value = settings.free_delivery_threshold ?? 199;

    // Handling Fee
    const handlingActive = Boolean(settings.handling_fee_enabled);
    updateMasterSwitchUI('handling-fee-switch', 'handling-fee-switch-knob', 'handling-fee-switch-label', handlingActive, 'ON', 'OFF');

    const handlingFeeInput = document.getElementById('input-handling-fee');
    if (handlingFeeInput) handlingFeeInput.value = settings.handling_fee ?? 3;

    const minCartInput = document.getElementById('input-min-cart-val');
    if (minCartInput) minCartInput.value = settings.min_cart_value ?? 35;

    // Audit Info
    const updatedByEl = document.getElementById('offers-last-updated-by');
    if (updatedByEl) updatedByEl.textContent = settings.updated_by || 'Owner';

    const updatedAtEl = document.getElementById('offers-last-updated-at');
    if (updatedAtEl) {
        if (settings.updated_at) {
            const dt = new Date(settings.updated_at);
            updatedAtEl.textContent = dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        } else {
            updatedAtEl.textContent = 'Never';
        }
    }
}

function updateMasterSwitchUI(btnId, knobId, labelId, isActive, activeText, inactiveText) {
    const btn = document.getElementById(btnId);
    const knob = document.getElementById(knobId);
    const label = document.getElementById(labelId);

    if (btn) {
        btn.dataset.active = isActive ? 'true' : 'false';
        btn.className = `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-emerald-600' : 'bg-slate-300'}`;
    }
    if (knob) {
        knob.className = `pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`;
    }
    if (label) {
        label.textContent = isActive ? activeText : inactiveText;
        label.className = `text-xs font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`;
    }
}

function toggleOffersMasterSwitch() {
    const btn = document.getElementById('offers-master-switch');
    if (!btn) return;
    const current = btn.dataset.active === 'true';
    const next = !current;
    updateMasterSwitchUI('offers-master-switch', 'offers-master-switch-knob', 'offers-master-switch-label', next, 'ON', 'OFF');

    const fieldsContainer = document.getElementById('offers-config-fields');
    if (fieldsContainer) {
        fieldsContainer.style.opacity = next ? '1' : '0.55';
    }
    updateOffersChargesLivePreview();
}

function toggleFreeDeliverySwitch() {
    const btn = document.getElementById('free-delivery-switch');
    if (!btn) return;
    const current = btn.dataset.active === 'true';
    const next = !current;
    updateMasterSwitchUI('free-delivery-switch', 'free-delivery-switch-knob', 'free-delivery-switch-label', next, 'Free: ON', 'Free: OFF');
    updateOffersChargesLivePreview();
}

function toggleHandlingFeeSwitch() {
    const btn = document.getElementById('handling-fee-switch');
    if (!btn) return;
    const current = btn.dataset.active === 'true';
    const next = !current;
    updateMasterSwitchUI('handling-fee-switch', 'handling-fee-switch-knob', 'handling-fee-switch-label', next, 'ON', 'OFF');
    updateOffersChargesLivePreview();
}

function updateOfferUnitLabel(offerType) {
    const lbl = document.getElementById('lbl-discount-val');
    const unit = document.getElementById('unit-discount-val');
    const discInput = document.getElementById('input-discount-val');

    if (offerType === 'percentage') {
        if (lbl) lbl.textContent = 'Discount Value (%)';
        if (unit) unit.textContent = '%';
        if (discInput) {
            discInput.max = '100';
            discInput.step = '1';
        }
    } else if (offerType === 'fixed') {
        if (lbl) lbl.textContent = 'Discount Amount (₹)';
        if (unit) unit.textContent = '₹';
        if (discInput) {
            discInput.removeAttribute('max');
            discInput.step = '1';
        }
    } else {
        if (lbl) lbl.textContent = 'Discount (N/A for Free Delivery)';
        if (unit) unit.textContent = '—';
    }
}

function handleOfferFieldChange() {
    const offerType = document.querySelector('input[name="offer_type"]:checked')?.value || 'percentage';
    updateOfferUnitLabel(offerType);
    updateOffersChargesLivePreview();
}

function setPreviewSubtotal(amount) {
    const input = document.getElementById('preview-sample-subtotal');
    if (input) {
        input.value = amount;
        updateOffersChargesLivePreview();
    }
}

/**
 * Live Interactive Preview Calculation (Section 16 Specification)
 */
function updateOffersChargesLivePreview() {
    const sampleSubtotal = Math.max(0, Number(document.getElementById('preview-sample-subtotal')?.value) || 0);
    const offersEnabled = document.getElementById('offers-master-switch')?.dataset.active === 'true';
    const offerType = document.querySelector('input[name="offer_type"]:checked')?.value || 'percentage';
    const offerValue = Math.max(0, Number(document.getElementById('input-discount-val')?.value) || 0);
    const minOrderValue = Math.max(0, Number(document.getElementById('input-offer-min-order')?.value) || 0);
    const maxDiscount = Math.max(0, Number(document.getElementById('input-offer-max-discount')?.value) || 0);

    const deliveryFeeBase = Math.max(0, Number(document.getElementById('input-delivery-fee')?.value) || 0);
    const freeDeliveryEnabled = document.getElementById('free-delivery-switch')?.dataset.active === 'true';
    const freeDeliveryThreshold = Math.max(0, Number(document.getElementById('input-free-delivery-threshold')?.value) || 0);

    const handlingFeeEnabled = document.getElementById('handling-fee-switch')?.dataset.active === 'true';
    const handlingFeeVal = Math.max(0, Number(document.getElementById('input-handling-fee')?.value) || 0);

    // 1. Subtotal
    const subtotal = sampleSubtotal;

    // 2. Global Offer Calculation
    let discount = 0;
    let offerNote = 'None';
    const meetsOfferMin = subtotal >= minOrderValue;

    if (offersEnabled && meetsOfferMin && subtotal > 0) {
        if (offerType === 'percentage') {
            const rawDisc = Math.round(subtotal * (offerValue / 100));
            discount = maxDiscount > 0 ? Math.min(rawDisc, maxDiscount) : rawDisc;
            offerNote = `${offerValue}% OFF`;
        } else if (offerType === 'fixed') {
            discount = Math.min(subtotal, offerValue);
            offerNote = `₹${offerValue} OFF`;
        } else if (offerType === 'free_delivery') {
            discount = 0;
            offerNote = 'Free Delivery';
        }
    }

    // 3. Delivery Fee
    let calculatedDelivery = deliveryFeeBase;
    let isFreeDelivery = false;

    if (subtotal === 0) {
        calculatedDelivery = 0;
        isFreeDelivery = true;
    } else if (deliveryFeeBase <= 0) {
        calculatedDelivery = 0;
        isFreeDelivery = true;
    } else {
        const meetsThreshold = freeDeliveryEnabled && subtotal >= freeDeliveryThreshold;
        const meetsFreeOffer = offersEnabled && offerType === 'free_delivery' && meetsOfferMin;
        if (meetsThreshold || meetsFreeOffer) {
            calculatedDelivery = 0;
            isFreeDelivery = true;
        } else {
            calculatedDelivery = deliveryFeeBase;
            isFreeDelivery = false;
        }
    }

    // 4. Handling Fee
    let calculatedHandling = 0;
    if (subtotal > 0 && handlingFeeEnabled) {
        calculatedHandling = handlingFeeVal;
    }

    // 5. Final Total
    const finalTotal = Math.max(0, subtotal - discount + calculatedDelivery + calculatedHandling);

    // Update DOM
    const simLabel = document.getElementById('preview-simulated-label');
    if (simLabel) simLabel.textContent = `₹${subtotal}`;

    const lineSubtotal = document.getElementById('preview-line-subtotal');
    if (lineSubtotal) lineSubtotal.textContent = `₹${subtotal}`;

    const offerRow = document.getElementById('preview-line-offer-row');
    const lineOffer = document.getElementById('preview-line-offer');
    const lineOfferName = document.getElementById('preview-line-offer-name');
    if (lineOffer && lineOfferName) {
        if (discount > 0) {
            lineOffer.textContent = `-₹${discount}`;
            lineOfferName.textContent = offerNote;
            if (offerRow) offerRow.style.display = 'flex';
        } else {
            lineOffer.textContent = '₹0';
            lineOfferName.textContent = offersEnabled ? (meetsOfferMin ? '₹0' : `Min ₹${minOrderValue}`) : 'OFF';
            if (offerRow) offerRow.style.display = offersEnabled ? 'flex' : 'none';
        }
    }

    const lineDelivery = document.getElementById('preview-line-delivery');
    const lineDeliveryWrap = document.getElementById('preview-line-delivery-wrap');
    if (lineDelivery) {
        if (isFreeDelivery) {
            lineDelivery.textContent = 'FREE';
            lineDelivery.className = 'text-emerald-600 font-black';
            if (deliveryFeeBase > 0 && lineDeliveryWrap) {
                lineDeliveryWrap.innerHTML = `<span class="line-through text-[11px] text-slate-400">₹${deliveryFeeBase}</span> <span class="text-emerald-600 font-black">FREE</span>`;
            } else if (lineDeliveryWrap) {
                lineDeliveryWrap.innerHTML = `<span class="text-emerald-600 font-black">FREE</span>`;
            }
        } else {
            if (lineDeliveryWrap) {
                lineDeliveryWrap.innerHTML = `<span class="text-slate-900 font-bold">₹${calculatedDelivery}</span>`;
            }
        }
    }

    const lineHandling = document.getElementById('preview-line-handling');
    if (lineHandling) {
        lineHandling.textContent = calculatedHandling > 0 ? `₹${calculatedHandling}` : '₹0';
    }

    const lineTotal = document.getElementById('preview-line-total');
    if (lineTotal) lineTotal.textContent = `₹${finalTotal}`;

    // Explanation banner
    const expText = document.getElementById('preview-explanation-text');
    if (expText) {
        let msg = `Subtotal ₹${subtotal}: `;
        if (offersEnabled) {
            if (meetsOfferMin) {
                msg += `Qualifies for ${offerNote}${discount > 0 ? ` (-₹${discount})` : ''}. `;
            } else {
                msg += `Order below offer min (₹${minOrderValue}) — no discount applied. `;
            }
        } else {
            msg += 'Global offers are turned OFF. ';
        }

        if (isFreeDelivery) {
            msg += 'Delivery is FREE. ';
        } else {
            msg += `Delivery fee is ₹${calculatedDelivery}. `;
        }

        if (calculatedHandling > 0) {
            msg += `Handling fee is ₹${calculatedHandling}.`;
        }
        expText.textContent = msg;
    }
}

/**
 * Saves all Offers & Charges settings to Supabase
 */
async function saveOffersCharges() {
    if (currentAdminProfile && !currentAdminProfile.is_owner) {
        showToast('Access restricted: Owner only.', 'error');
        return;
    }

    // 1. Gather & Validate Inputs
    const offersEnabled = document.getElementById('offers-master-switch')?.dataset.active === 'true';
    const offerType = document.querySelector('input[name="offer_type"]:checked')?.value || 'percentage';
    const offerValue = Number(document.getElementById('input-discount-val')?.value);
    const minOrderValue = Number(document.getElementById('input-offer-min-order')?.value);
    const maxDiscount = Number(document.getElementById('input-offer-max-discount')?.value);

    const startDateVal = document.getElementById('input-offer-start-date')?.value;
    const endDateVal = document.getElementById('input-offer-end-date')?.value;

    const deliveryFee = Number(document.getElementById('input-delivery-fee')?.value);
    const freeDeliveryEnabled = document.getElementById('free-delivery-switch')?.dataset.active === 'true';
    const freeDeliveryThreshold = Number(document.getElementById('input-free-delivery-threshold')?.value);

    const handlingFeeEnabled = document.getElementById('handling-fee-switch')?.dataset.active === 'true';
    const handlingFee = Number(document.getElementById('input-handling-fee')?.value);
    const minCartVal = Number(document.getElementById('input-min-cart-val')?.value);

    // Validation (Section 18)
    const errors = [];
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
        errors.push('Delivery Fee must be a valid number >= 0.');
    }
    if (!Number.isFinite(handlingFee) || handlingFee < 0) {
        errors.push('Handling Fee must be a valid number >= 0.');
    }
    if (!Number.isFinite(offerValue) || offerValue < 0) {
        errors.push('Discount Value must be a valid number >= 0.');
    } else if (offerType === 'percentage' && (offerValue < 0 || offerValue > 100)) {
        errors.push('Percentage discount must be between 0% and 100%.');
    }
    if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
        errors.push('Minimum Order Value must be a valid number >= 0.');
    }
    if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
        errors.push('Maximum Discount must be a valid number >= 0.');
    }
    if (!Number.isFinite(freeDeliveryThreshold) || freeDeliveryThreshold < 0) {
        errors.push('Free Delivery Threshold must be a valid number >= 0.');
    }
    if (!Number.isFinite(minCartVal) || minCartVal < 0) {
        errors.push('Minimum Cart Order must be a valid number >= 0.');
    }

    let startDateIso = null;
    if (startDateVal) {
        const d = new Date(startDateVal);
        if (isNaN(d.getTime())) errors.push('Start Date is invalid.');
        else startDateIso = d.toISOString();
    }

    let endDateIso = null;
    if (endDateVal) {
        const d = new Date(endDateVal);
        if (isNaN(d.getTime())) errors.push('End Date is invalid.');
        else endDateIso = d.toISOString();
    }

    if (startDateIso && endDateIso && new Date(startDateIso) > new Date(endDateIso)) {
        errors.push('End Date cannot be earlier than Start Date.');
    }

    if (errors.length > 0) {
        showOffersChargesAlert(errors.join('<br>'), 'error');
        showToast('Please fix validation errors before saving.', 'error');
        return;
    }

    // 2. Prepare payload
    const payload = {
        offers_enabled: offersEnabled,
        offer_type: offerType,
        offer_value: offerValue,
        minimum_order_value: minOrderValue,
        maximum_discount: maxDiscount,
        free_delivery_enabled: freeDeliveryEnabled,
        free_delivery_threshold: freeDeliveryThreshold,
        delivery_fee: deliveryFee,
        handling_fee: handlingFee,
        handling_fee_enabled: handlingFeeEnabled,
        min_cart_value: minCartVal,
        start_date: startDateIso,
        end_date: endDateIso,
        expected_updated_at: currentOffersSettings?.updated_at || null
    };

    // 3. UI Loading State (Prevent duplicate Save requests - Section 17)
    const btnSave = document.getElementById('btn-save-offers');
    const btnSaveTop = document.getElementById('btn-save-offers-top');
    const btnText = document.getElementById('btn-save-offers-text');

    if (btnSave) btnSave.disabled = true;
    if (btnSaveTop) btnSaveTop.disabled = true;
    if (btnText) btnText.textContent = 'Saving to Supabase Cloud...';

    try {
        const res = await fetchWithTimeout('/api/admin/offers-charges', {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }, 8000);

        const data = await res.json();
        if (res.ok && data.success && data.settings) {
            currentOffersSettings = data.settings;
            populateOffersChargesForm(data.settings);
            updateOffersChargesLivePreview();

            showOffersChargesAlert('✓ Saved successfully! The new offers, delivery fees, and handling charges are now live for all customer checkouts.', 'success');
            showToast('✓ Offers & charges saved successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to save settings.');
        }
    } catch (err) {
        console.error('[saveOffersCharges Error]:', err);
        showOffersChargesAlert('Database update failed: ' + err.message + '. Last confirmed configuration was kept.', 'error');
        showToast('Failed to save settings: ' + err.message, 'error');
    } finally {
        if (btnSave) btnSave.disabled = false;
        if (btnSaveTop) btnSaveTop.disabled = false;
        if (btnText) btnText.textContent = 'Save All Offers & Charges';
    }
}

function showOffersChargesAlert(htmlMessage, type = 'success') {
    const alertEl = document.getElementById('offers-charges-alert');
    if (!alertEl) return;

    alertEl.innerHTML = htmlMessage;
    alertEl.classList.remove('hidden', 'bg-emerald-50', 'border-emerald-300', 'text-emerald-900', 'bg-rose-50', 'border-rose-300', 'text-rose-900');

    if (type === 'success') {
        alertEl.classList.add('bg-emerald-50', 'border-emerald-300', 'text-emerald-900');
    } else {
        alertEl.classList.add('bg-rose-50', 'border-rose-300', 'text-rose-900');
    }
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatForDatetimeLocal(isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        const pad = n => String(n).padStart(2, '0');
        const YYYY = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const DD = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
    } catch (e) {
        return '';
    }
}

// ============================================================
// SUPER ADMIN PAYMENT & REFUND MANAGEMENT JAVASCRIPT CONTROLLERS
// ============================================================
let currentPaymentsPage = 1;
let currentPaymentsLimit = 25;
let activePaymentTxns = [];
let activePaymentSummary = null;

// 1. Load Payment Management View
async function loadPaymentManagementView(page = 1) {
    currentPaymentsPage = page;
    const tbody = document.getElementById('payment-transactions-tbody');
    if (!tbody) return;

    const statusFilter = document.getElementById('pay-filter-status')?.value || 'ALL';
    const searchVal = document.getElementById('pay-search-input')?.value?.trim() || '';

    try {
        const queryParams = new URLSearchParams({
            page: String(page),
            limit: String(currentPaymentsLimit)
        });
        if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
        if (searchVal) queryParams.append('search', searchVal);

        const res = await fetchWithTimeout(`/api/admin/payments?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error || 'Failed to fetch payment records');

        activePaymentTxns = data.transactions || [];
        activePaymentSummary = data.summary || {};

        // Update 4 Summary KPI Cards
        updatePaymentSummaryCards(activePaymentSummary);

        // Render table rows
        renderPaymentTransactionsTable(activePaymentTxns);

        // Update pagination
        updatePaymentPagination(data.totalCount || 0, page, currentPaymentsLimit);
    } catch (err) {
        console.error('[loadPaymentManagementView Error]:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-rose-500 font-bold">
                    <div class="flex flex-col items-center gap-2">
                        <span class="material-symbols-outlined text-2xl">error</span>
                        <span>Failed to load payment transactions: ${escapeHtml(err.message)}</span>
                        <button onclick="loadPaymentManagementView()" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-800">Retry</button>
                    </div>
                </td>
            </tr>
        `;
    }
}

function updatePaymentSummaryCards(summary = {}) {
    const elNet = document.getElementById('pay-stat-net');
    const elGross = document.getElementById('pay-stat-gross');
    const elRefunded = document.getElementById('pay-stat-refunded');
    const elPending = document.getElementById('pay-stat-pending');
    const elSuccessCount = document.getElementById('pay-stat-success-count');
    const elRefundCount = document.getElementById('pay-stat-refund-count');

    const net = Number(summary.netCollections || 0).toFixed(2);
    const gross = Number(summary.grossCollected || 0).toFixed(2);
    const refunded = Number(summary.totalRefunded || 0).toFixed(2);
    const pendingTotal = (summary.pendingCount || 0) + (summary.failedCount || 0);

    if (elNet) elNet.textContent = `₹${net}`;
    if (elGross) elGross.textContent = `₹${gross}`;
    if (elRefunded) elRefunded.textContent = `₹${refunded}`;
    if (elPending) elPending.textContent = `${pendingTotal} Orders`;
    if (elSuccessCount) elSuccessCount.textContent = summary.successfulCount || 0;
    if (elRefundCount) elRefundCount.textContent = summary.refundedCount || 0;
}

// 10 Status Badge Renderer
function getPaymentStatusBadge(status = '') {
    const s = String(status).trim();
    const map = {
        'Successful': { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'check_circle', label: 'Successful' },
        'PAID': { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: 'check_circle', label: 'Successful' },
        'Pending': { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: 'hourglass_top', label: 'Pending' },
        'Processing': { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'sync', label: 'Processing' },
        'Failed': { bg: 'bg-rose-100 text-rose-800 border-rose-300', icon: 'cancel', label: 'Failed' },
        'Cancelled': { bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: 'block', label: 'Cancelled' },
        'Partially Refunded': { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: 'call_split', label: 'Partially Refunded' },
        'Refund Successful': { bg: 'bg-teal-100 text-teal-800 border-teal-300', icon: 'replay', label: 'Refund Successful' },
        'Refund Pending': { bg: 'bg-purple-100 text-purple-800 border-purple-300', icon: 'hourglass_empty', label: 'Refund Pending' },
        'Refund Processing': { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: 'cached', label: 'Refund Processing' },
        'Refund Failed': { bg: 'bg-red-100 text-red-900 border-red-300', icon: 'error', label: 'Refund Failed' }
    };

    const cfg = map[s] || { bg: 'bg-slate-100 text-slate-800 border-slate-300', icon: 'info', label: s || 'Unknown' };
    return `<span class="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${cfg.bg}">
        <span class="material-symbols-outlined text-[11px]">${cfg.icon}</span> ${cfg.label}
    </span>`;
}

function renderPaymentTransactionsTable(transactions = []) {
    const tbody = document.getElementById('payment-transactions-tbody');
    if (!tbody) return;

    if (!transactions.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-slate-400">
                    <div class="flex flex-col items-center gap-1.5">
                        <span class="material-symbols-outlined text-3xl text-slate-300">payments</span>
                        <p class="font-bold text-slate-600">No payment transactions found</p>
                        <p class="text-[11px] text-slate-400">Transactions will automatically stream in real-time as campus orders are initiated.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const orderId = escapeHtml(t.order_id || '--');
        const txnId = escapeHtml(t.id || '--');
        const timeStr = t.created_at ? new Date(t.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '--';
        const custName = escapeHtml(t.customer_name || 'Campus Student');
        const custPhone = escapeHtml(t.customer_phone || '--');
        const method = escapeHtml(t.payment_method || 'UPI');
        const amount = Number(t.amount || 0).toFixed(2);
        const utr = t.upi_ref_utr ? escapeHtml(t.upi_ref_utr) : null;
        const status = t.status || 'Pending';
        const isRefundable = status === 'Successful' || status === 'PAID' || status === 'Partially Refunded';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 font-bold text-[#181c1f]">
                    <div class="flex items-center gap-1.5">
                        <span class="font-mono text-emerald-700 text-[11px]">${orderId}</span>
                        <button type="button" onclick="copyToClipboard('${orderId}', 'Order ID')" class="text-slate-400 hover:text-slate-600 cursor-pointer" title="Copy Order ID">
                            <span class="material-symbols-outlined text-[12px]">content_copy</span>
                        </button>
                    </div>
                    <span class="text-[10px] text-slate-400 block font-normal font-mono truncate max-w-[120px]">${txnId}</span>
                </td>
                <td class="p-4 text-slate-600 text-[11px] whitespace-nowrap">
                    ${timeStr}
                </td>
                <td class="p-4">
                    <span class="font-bold text-[#181c1f] block">${custName}</span>
                    <span class="text-[11px] text-slate-500 font-mono">${custPhone}</span>
                </td>
                <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px]">
                        <span class="material-symbols-outlined text-xs text-purple-600">qr_code</span> ${method}
                    </span>
                </td>
                <td class="p-4 font-black text-sm text-[#181c1f] whitespace-nowrap">
                    ₹${amount}
                </td>
                <td class="p-4">
                    ${utr ? `
                        <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                            <span>${utr}</span>
                            <button type="button" onclick="copyToClipboard('${utr}', 'Bank UTR')" class="text-emerald-600 hover:text-emerald-900 cursor-pointer" title="Copy UTR">
                                <span class="material-symbols-outlined text-[11px]">content_copy</span>
                            </button>
                        </div>
                    ` : `
                        <span class="text-slate-400 text-[11px] italic">Awaiting Bank</span>
                    `}
                </td>
                <td class="p-4 whitespace-nowrap">
                    ${getPaymentStatusBadge(status)}
                </td>
                <td class="p-4 text-right whitespace-nowrap">
                    ${isRefundable ? `
                        <button onclick="openRefundModal('${t.id}')"
                            class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ml-auto">
                            <span class="material-symbols-outlined text-xs">replay</span>
                            <span>Refund</span>
                        </button>
                    ` : `
                        <span class="text-slate-400 text-[10px]">—</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');
}

function updatePaymentPagination(totalCount, page, limit) {
    const info = document.getElementById('pay-pagination-info');
    const controls = document.getElementById('pay-pagination-controls');
    if (!info || !controls) return;

    const totalPages = Math.ceil(totalCount / limit) || 1;
    info.textContent = `Showing ${Math.min(totalCount, (page - 1) * limit + 1)}-${Math.min(totalCount, page * limit)} of ${totalCount} transactions`;

    controls.innerHTML = `
        <button onclick="loadPaymentManagementView(${page - 1})" ${page <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-slate-200 cursor-pointer"'} class="px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-700">Prev</button>
        <span class="px-2 text-xs font-bold text-slate-600">Page ${page} of ${totalPages}</span>
        <button onclick="loadPaymentManagementView(${page + 1})" ${page >= totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-slate-200 cursor-pointer"'} class="px-2 py-1 rounded bg-slate-100 text-xs font-bold text-slate-700">Next</button>
    `;
}

function filterPaymentsList() {
    loadPaymentManagementView(1);
}

function clearPaymentFilters() {
    const search = document.getElementById('pay-search-input');
    const status = document.getElementById('pay-filter-status');
    if (search) search.value = '';
    if (status) status.value = 'ALL';
    loadPaymentManagementView(1);
}

// 2. Refund Modal Handling
let targetRefundTxn = null;

function openRefundModal(txnId) {
    const txn = activePaymentTxns.find(t => t.id === txnId);
    if (!txn) return;
    targetRefundTxn = txn;

    const modal = document.getElementById('refund-modal');
    if (!modal) return;

    document.getElementById('refund-target-txn-id').value = txn.id;
    document.getElementById('refund-modal-order-label').textContent = `Order: ${txn.order_id || '--'}`;
    document.getElementById('refund-customer-name').textContent = txn.customer_name || 'Campus Student';
    document.getElementById('refund-original-amount').textContent = `₹${Number(txn.amount || 0).toFixed(2)}`;

    // Calculate max refundable
    const originalAmt = Number(txn.amount || 0);
    const alreadyRefunded = Number(txn.metadata?.total_refunded || 0);
    const maxRefundable = Math.max(0, originalAmt - alreadyRefunded);

    document.getElementById('refund-already-refunded').textContent = `₹${alreadyRefunded.toFixed(2)}`;
    document.getElementById('refund-max-refundable').textContent = `₹${maxRefundable.toFixed(2)}`;

    const amtInput = document.getElementById('refund-amount-input');
    amtInput.value = maxRefundable.toFixed(2);
    amtInput.max = maxRefundable;

    modal.classList.remove('hidden');
}

function closeRefundModal() {
    const modal = document.getElementById('refund-modal');
    if (modal) modal.classList.add('hidden');
    targetRefundTxn = null;
}

function setFullRefundAmount() {
    if (!targetRefundTxn) return;
    const originalAmt = Number(targetRefundTxn.amount || 0);
    const alreadyRefunded = Number(targetRefundTxn.metadata?.total_refunded || 0);
    const maxRefundable = Math.max(0, originalAmt - alreadyRefunded);
    const input = document.getElementById('refund-amount-input');
    if (input) input.value = maxRefundable.toFixed(2);
}

function setPartialRefundPercent(percent = 50) {
    if (!targetRefundTxn) return;
    const originalAmt = Number(targetRefundTxn.amount || 0);
    const alreadyRefunded = Number(targetRefundTxn.metadata?.total_refunded || 0);
    const maxRefundable = Math.max(0, originalAmt - alreadyRefunded);
    const val = (maxRefundable * (percent / 100)).toFixed(2);
    const input = document.getElementById('refund-amount-input');
    if (input) input.value = val;
}

async function submitRefundModal() {
    const txnId = document.getElementById('refund-target-txn-id')?.value;
    const amountVal = parseFloat(document.getElementById('refund-amount-input')?.value);
    const reasonVal = document.getElementById('refund-reason-select')?.value;
    const btnSubmit = document.getElementById('btn-submit-refund');

    if (!txnId || isNaN(amountVal) || amountVal <= 0) {
        showToast('Please enter a valid refund amount greater than ₹0', 'warning');
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">refresh</span> Processing...`;
    }

    try {
        const res = await fetchWithTimeout(`/api/admin/payments/${txnId}/refund`, {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                amount: amountVal,
                reason: reasonVal,
                refund_ref_id: `rfnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`
            })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Refund execution failed');
        }

        showToast(`✓ Refund of ₹${amountVal.toFixed(2)} processed successfully`, 'success');
        closeRefundModal();
        loadPaymentManagementView(currentPaymentsPage);
    } catch (err) {
        console.error('[submitRefundModal Error]:', err);
        showToast('Refund failed: ' + err.message, 'warning');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<span class="material-symbols-outlined text-sm">check</span> Confirm &amp; Process Refund`;
        }
    }
}

// 3. Super Admin UPI Configuration Controller
async function loadUpiConfigView() {
    try {
        const res = await fetchWithTimeout('/api/admin/payments/config', {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.success && data.config) {
            const c = data.config;
            const elVpa = document.getElementById('upi-config-vpa');
            const elName = document.getElementById('upi-config-name');
            const elProv = document.getElementById('upi-config-provider');
            const elEnv = document.getElementById('upi-config-env');

            if (elVpa) elVpa.value = c.merchantVpa || 'lpuquick@upi';
            if (elName) elName.value = c.merchantPayeeName || 'LPUQuick Campus Services';
            if (elProv) elProv.value = c.provider || 'YOUPI_V2';
            if (elEnv) elEnv.value = c.environment || 'SANDBOX';

            const methods = c.enabledPaymentMethods || {};
            const chkQr = document.getElementById('method-qr');
            const chkPhonepe = document.getElementById('method-phonepe');
            const chkGpay = document.getElementById('method-gpay');
            const chkPaytm = document.getElementById('method-paytm');

            if (chkQr) chkQr.checked = methods.upiQr !== false;
            if (chkPhonepe) chkPhonepe.checked = methods.phonepe !== false;
            if (chkGpay) chkGpay.checked = methods.gpay !== false;
            if (chkPaytm) chkPaytm.checked = methods.paytm !== false;
        }
    } catch (err) {
        console.warn('[loadUpiConfigView Warning]:', err.message);
    }
}

async function saveUpiConfig() {
    const elVpa = document.getElementById('upi-config-vpa');
    const elName = document.getElementById('upi-config-name');
    const elProv = document.getElementById('upi-config-provider');
    const elEnv = document.getElementById('upi-config-env');

    const vpa = elVpa?.value?.trim();
    const name = elName?.value?.trim();

    if (!vpa || !vpa.includes('@')) {
        showToast('Please enter a valid Merchant VPA (e.g. merchant@upi)', 'warning');
        return;
    }
    if (!name) {
        showToast('Please enter a Payee Display Name', 'warning');
        return;
    }

    const payload = {
        merchantVpa: vpa,
        merchantPayeeName: name,
        provider: elProv?.value || 'YOUPI_V2',
        environment: elEnv?.value || 'SANDBOX',
        enabledPaymentMethods: {
            upiQr: document.getElementById('method-qr')?.checked !== false,
            phonepe: document.getElementById('method-phonepe')?.checked !== false,
            gpay: document.getElementById('method-gpay')?.checked !== false,
            paytm: document.getElementById('method-paytm')?.checked !== false,
            anyUpiApp: true
        }
    };

    try {
        const res = await fetchWithTimeout('/api/admin/payments/config', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save configuration');

        showToast('✓ UPI & Merchant Configuration saved successfully', 'success');
    } catch (err) {
        console.error('[saveUpiConfig Error]:', err);
        showToast('Save failed: ' + err.message, 'warning');
    }
}

window.loadPaymentManagementView = loadPaymentManagementView;
window.filterPaymentsList = filterPaymentsList;
window.clearPaymentFilters = clearPaymentFilters;
window.openRefundModal = openRefundModal;
window.closeRefundModal = closeRefundModal;
window.setFullRefundAmount = setFullRefundAmount;
window.setPartialRefundPercent = setPartialRefundPercent;
window.submitRefundModal = submitRefundModal;
window.loadUpiConfigView = loadUpiConfigView;
window.saveUpiConfig = saveUpiConfig;



// =========================================================================
// FOOD DEPARTMENT & KITCHEN OPERATIONS CONTROLLER (ADMIN)
// =========================================================================

let foodConfigCache = null;
let foodCooksCache = [];
let foodOrdersCache = [];

function openStaffModalWithCookRole() {
    openStaffModal();
    setTimeout(() => {
        const cookCb = document.getElementById('role-cook');
        if (cookCb) cookCb.checked = true;
        const storeCb = document.getElementById('role-store-manager');
        if (storeCb) storeCb.checked = false;
    }, 50);
}
window.openStaffModalWithCookRole = openStaffModalWithCookRole;

async function loadFoodDeptAdmin() {
    try {
        const targetHostel = (typeof getActiveLockHostel === 'function' ? getActiveLockHostel() : null) || 'BH-13';
        const headers = getAuthHeaders();

        const fetchSafe = async (url) => {
            try {
                const res = await fetch(url, { headers });
                if (res.ok) return await res.json();
            } catch (e) {
                console.warn('[Admin Food Safe Fetch]: ' + url, e.message);
            }
            return null;
        };

        const [configData, cooksData, ordersData, metricsData, productsData] = await Promise.all([
            fetchSafe('/api/food/config'),
            fetchSafe('/api/food/cooks'),
            fetchSafe('/api/food/orders'),
            fetchSafe('/api/food/metrics'),
            fetchSafe('/api/food/products?hostel_id=' + encodeURIComponent(targetHostel))
        ]);

        if (configData && configData.success && configData.config) {
            foodConfigCache = configData.config;
            renderFoodConfig(configData.config);
        }

        if (cooksData && cooksData.success && Array.isArray(cooksData.cooks)) {
            foodCooksCache = cooksData.cooks;
            renderFoodCooks(cooksData.cooks);
            populateSpecificCookDropdown(cooksData.cooks);
        }

        if (ordersData && ordersData.success && Array.isArray(ordersData.orders)) {
            foodOrdersCache = ordersData.orders;
            renderFoodOrdersAdmin(ordersData.orders);
        }

        if (metricsData && metricsData.success && metricsData.metrics) {
            renderFoodDeptMetrics(metricsData.metrics);
        }

        if (productsData && productsData.success && Array.isArray(productsData.products) && productsData.products.length > 0) {
            foodProductsCache = productsData.products;
            renderFoodDeptProducts(foodProductsCache);
        } else if (typeof fetchFoodDeptProducts === 'function') {
            await fetchFoodDeptProducts();
        }
    } catch (err) {
        console.error('[Admin Food Dept Load Error]:', err);
        if (typeof fetchFoodDeptProducts === 'function') {
            fetchFoodDeptProducts();
        }
    }
}
window.loadFoodDeptAdmin = loadFoodDeptAdmin;

function renderFoodDeptMetrics(m) {
    const onDutyCooks = foodCooksCache.filter(c => c.duty_status === 'ON_DUTY' || c.is_on_duty !== false).length;
    const statDuty = document.getElementById('stat-food-cooks-duty');
    if (statDuty) statDuty.textContent = onDutyCooks;

    const statTotal = document.getElementById('stat-food-total-orders');
    if (statTotal) statTotal.textContent = m.total_food_orders || foodOrdersCache.length;

    const statPrep = document.getElementById('stat-food-active-prep');
    if (statPrep) statPrep.textContent = m.preparing_count || 0;

    const statReady = document.getElementById('stat-food-ready-comp');
    if (statReady) statReady.textContent = (m.ready_count || 0) + (m.completed_count || 0);
}

function renderFoodConfig(cfg) {
    const methodSelect = document.getElementById('food-config-method');
    const prepInput = document.getElementById('food-config-prep-time');
    const specificSelect = document.getElementById('food-config-specific-cook');

    if (methodSelect && cfg.assignment_method) {
        methodSelect.value = cfg.assignment_method;
    }
    if (prepInput && cfg.prep_time_minutes) {
        prepInput.value = cfg.prep_time_minutes;
    }
    if (specificSelect && cfg.specific_cook_id) {
        specificSelect.value = cfg.specific_cook_id;
    }

    toggleSpecificCookSelect();
}

window.toggleSpecificCookSelect = function () {
    const methodSelect = document.getElementById('food-config-method');
    const wrapper = document.getElementById('food-specific-cook-wrapper');
    if (!methodSelect || !wrapper) return;

    if (methodSelect.value === 'specific_cook') {
        wrapper.classList.remove('hidden');
    } else {
        wrapper.classList.add('hidden');
    }
};

function populateSpecificCookDropdown(cooks) {
    const select = document.getElementById('food-config-specific-cook');
    if (!select) return;

    const currentVal = foodConfigCache?.specific_cook_id || select.value;
    select.innerHTML = '<option value="">Select a designated cook...</option>';

    cooks.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `👨‍🍳 ${c.name} (${c.duty_status === 'ON_DUTY' ? 'On Duty' : 'Off Duty'})`;
        select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
}

window.saveFoodConfig = async function (e) {
    if (e) e.preventDefault();
    const method = document.getElementById('food-config-method')?.value || 'least_loaded';
    const specificCookId = document.getElementById('food-config-specific-cook')?.value || null;
    const prepTime = Number(document.getElementById('food-config-prep-time')?.value) || 15;
    const btn = document.getElementById('btn-save-food-config');

    if (method === 'specific_cook' && !specificCookId) {
        showToast('Please select a specific designated cook.', 'warning');
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Saving...';
        }

        const res = await fetch('/api/food/config', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                assignment_method: method,
                specific_cook_id: specificCookId,
                prep_time_minutes: prepTime
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            foodConfigCache = data.config;
            showToast('Food assignment rules saved successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to save configuration');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm">save</span> <span>Save Rules</span>';
        }
    }
};

function renderFoodCooks(cooks) {
    const tbody = document.getElementById('food-cooks-tbody');
    if (!tbody) return;

    if (cooks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-[#5c5f60]">
                    No kitchen staff found. Click "Add New Cook" above to designate employees to the Food Department.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cooks.map(cook => {
        const isOnDuty = cook.duty_status === 'ON_DUTY' || cook.is_on_duty !== false;
        const canGrocery = Boolean(cook.permissions && cook.permissions.can_manage_grocery_inventory);

        return `
            <tr class="hover:bg-slate-50/70 transition-colors">
                <td class="p-3.5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                            👨‍🍳
                        </div>
                        <div>
                            <p class="font-bold text-[#181c1f]">${escapeHtml(cook.name)}</p>
                            <p class="text-[11px] text-[#5c5f60]">${escapeHtml(cook.phone || cook.email)}</p>
                        </div>
                    </div>
                </td>
                <td class="p-3.5 font-medium text-[#181c1f]">
                    ${cook.assigned_hostel_id ? `🏢 ${cook.assigned_hostel_id}` : '<span class="text-gray-400">All Hostels</span>'}
                </td>
                <td class="p-3.5">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isOnDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-600 border border-gray-300'}">
                        <span class="w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-gray-400'}"></span>
                        ${isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                    </span>
                </td>
                <td class="p-3.5 font-bold text-sm text-[#181c1f]">
                    ${cook.active_orders_count || 0} active
                </td>
                <td class="p-3.5">
                    <button type="button" onclick="toggleCookGroceryPermission('${cook.id}', ${canGrocery})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${canGrocery ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'}" title="Click to toggle grocery inventory management">
                        <span class="material-symbols-outlined text-xs">${canGrocery ? 'check_circle' : 'remove_circle_outline'}</span>
                        <span>${canGrocery ? 'Authorized' : 'Restricted'}</span>
                    </button>
                </td>
                <td class="p-3.5 text-right">
                    <div class="inline-flex items-center gap-2">
                        <button type="button" onclick="toggleCookDutyStatus('${cook.id}', ${isOnDuty})" class="px-2.5 py-1 border border-[#DADCE0] hover:bg-gray-100 rounded-lg text-xs font-semibold text-[#5c5f60] transition-colors cursor-pointer">
                            ${isOnDuty ? 'Set Off Duty' : 'Set On Duty'}
                        </button>
                        <button type="button" onclick="openStaffModal('${cook.id}')" class="p-1 text-[#1a73e8] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit Staff Profile">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.toggleCookDutyStatus = async function (cookId, currentDuty) {
    try {
        const nextDuty = !currentDuty;
        const res = await fetch(`/api/admin/staff/${cookId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                is_on_duty: nextDuty,
                duty_status: nextDuty ? 'ON_DUTY' : 'OFF_DUTY'
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast(nextDuty ? 'Cook marked ON DUTY' : 'Cook marked OFF DUTY', 'info');
            loadFoodDeptAdmin();
        } else {
            throw new Error(data.error || 'Failed to update duty status');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.toggleCookGroceryPermission = async function (cookId, currentPerm) {
    try {
        const nextPerm = !currentPerm;
        const res = await fetch(`/api/admin/staff/${cookId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                permissions: { can_manage_grocery_inventory: nextPerm }
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast(nextPerm ? 'Authorized cook for grocery inventory!' : 'Restricted cook from grocery inventory', 'info');
            loadFoodDeptAdmin();
        } else {
            throw new Error(data.error || 'Failed to update grocery permission');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
};

function renderFoodOrdersAdmin(orders) {
    const tbody = document.getElementById('food-orders-admin-tbody');
    if (!tbody) return;

    const totalOrders = orders.length;
    const placedOrders = orders.filter(o => ['order placed', 'placed', 'pending'].includes((o.status || '').toLowerCase())).length;
    const preparingOrders = orders.filter(o => ['preparing', 'cooking', 'in progress'].includes((o.status || '').toLowerCase())).length;
    const readyOrders = orders.filter(o => ['ready', 'ready in kitchen', 'cooked'].includes((o.status || '').toLowerCase())).length;
    const completedOrders = orders.filter(o => ['completed', 'delivered', 'done'].includes((o.status || '').toLowerCase())).length;

    const cAll = document.getElementById('count-food-all'); if (cAll) cAll.textContent = totalOrders;
    const cPlaced = document.getElementById('count-food-placed'); if (cPlaced) cPlaced.textContent = placedOrders;
    const cPrep = document.getElementById('count-food-preparing'); if (cPrep) cPrep.textContent = preparingOrders;
    const cReady = document.getElementById('count-food-ready'); if (cReady) cReady.textContent = readyOrders;
    const cComp = document.getElementById('count-food-completed'); if (cComp) cComp.textContent = completedOrders;
    const badgeQueue = document.getElementById('food-orders-count-badge'); if (badgeQueue) badgeQueue.textContent = `${totalOrders} Total`;

    let filtered = orders;
    if (foodOrdersFilterActive === 'placed') {
        filtered = orders.filter(o => ['order placed', 'placed', 'pending'].includes((o.status || '').toLowerCase()));
    } else if (foodOrdersFilterActive === 'preparing') {
        filtered = orders.filter(o => ['preparing', 'cooking', 'in progress'].includes((o.status || '').toLowerCase()));
    } else if (foodOrdersFilterActive === 'ready') {
        filtered = orders.filter(o => ['ready', 'ready in kitchen', 'cooked'].includes((o.status || '').toLowerCase()));
    } else if (foodOrdersFilterActive === 'completed') {
        filtered = orders.filter(o => ['completed', 'delivered', 'done'].includes((o.status || '').toLowerCase()));
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-[#5c5f60]">
                    <div class="max-w-xs mx-auto space-y-1">
                        <span class="material-symbols-outlined text-3xl text-gray-300">receipt_long</span>
                        <p class="font-bold text-[#181c1f]">No food orders in this filter</p>
                        <p class="text-xs text-gray-500">Incoming Quick's Instant Food orders will appear here automatically.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        const shortId = order.order_id.replace(/^order_/, '').slice(0, 8);
        const s = (order.status || 'Order Placed').toLowerCase();

        let statusPill = '';
        let quickActionBtn = '';

        if (s === 'completed' || s === 'delivered') {
            statusPill = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Completed</span>';
            quickActionBtn = '<span class="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1"><span class="material-symbols-outlined text-sm">check_circle</span> Delivered</span>';
        } else if (s === 'ready' || s === 'ready in kitchen') {
            statusPill = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">🍲 Ready in Kitchen</span>';
            quickActionBtn = `<button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Completed')" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 ml-auto"><span>✓ Mark Completed</span></button>`;
        } else if (s === 'preparing' || s === 'cooking') {
            statusPill = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">🍳 Cooking / Preparing</span>';
            quickActionBtn = `<button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Ready')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 ml-auto"><span>🍲 Mark Ready</span></button>`;
        } else {
            statusPill = '<span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">⚡ Order Placed</span>';
            quickActionBtn = `<button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Preparing')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1 ml-auto"><span>🍳 Start Cooking</span></button>`;
        }

        const itemsHtml = (order.food_items || []).map(i => `
            <div class="inline-flex items-center gap-1 bg-amber-50 text-amber-950 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-bold mr-1 mb-1">
                <span>${escapeHtml(i.name)}</span>
                <span class="text-amber-800">×${i.quantity}</span>
                ${i.price ? `<span class="text-amber-600 font-semibold">(₹${i.price})</span>` : ''}
            </div>
        `).join('');

        return `
            <tr class="hover:bg-amber-50/40 transition-colors">
                <td class="p-3.5">
                    <p class="font-mono font-bold text-xs text-[#181c1f]">#${shortId.toUpperCase()}</p>
                    <p class="text-[10px] text-[#5c5f60]">${escapeHtml(order.order_time_formatted || '')}</p>
                    <span class="inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">11m Food Delivery</span>
                </td>
                <td class="p-3.5">
                    <p class="font-bold text-xs text-[#181c1f]">${escapeHtml(order.customer_name)}</p>
                    <p class="text-[11px] font-semibold text-amber-900">${escapeHtml(order.delivery_address || order.hostel_id || 'Hostel')}</p>
                    ${order.customer_phone ? `<p class="text-[10px] text-[#5c5f60]">📞 ${escapeHtml(order.customer_phone)}</p>` : ''}
                </td>
                <td class="p-3.5 max-w-xs">
                    <div class="flex flex-wrap">${itemsHtml || '<span class="text-gray-400">Food Item</span>'}</div>
                    ${order.special_instructions && order.special_instructions !== 'None' ? `<p class="text-[10px] text-amber-800 italic mt-0.5">Note: ${escapeHtml(order.special_instructions)}</p>` : ''}
                </td>
                <td class="p-3.5">
                    <p class="font-bold text-xs text-[#181c1f]">₹${Number(order.total_amount || order.total || 0).toFixed(2)}</p>
                    <span class="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 uppercase">${escapeHtml(order.payment_method || 'COD')}</span>
                </td>
                <td class="p-3.5 font-medium text-[#181c1f]">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm">👨‍🍳</span>
                        <div>
                            <p class="font-bold text-xs text-[#181c1f]">${escapeHtml(order.cook_name || 'Chef Assigned')}</p>
                            <button type="button" onclick="openReassignFoodModal('${order.order_id}')" class="text-[10px] text-amber-700 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer">
                                <span>Reassign</span> <span class="material-symbols-outlined text-[11px]">swap_horiz</span>
                            </button>
                        </div>
                    </div>
                </td>
                <td class="p-3.5">${statusPill}</td>
                <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        ${quickActionBtn}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openReassignFoodModal = function (orderId) {
    const modal = document.getElementById('modal-reassign-food-order');
    const orderIdInput = document.getElementById('reassign-order-id');
    const orderLabel = document.getElementById('reassign-order-label');
    const cookSelect = document.getElementById('reassign-cook-select');

    if (!modal || !orderIdInput || !orderLabel || !cookSelect) return;

    orderIdInput.value = orderId;
    orderLabel.textContent = '#' + orderId.replace(/^order_/, '').slice(0, 8);

    cookSelect.innerHTML = '<option value="">Select an active cook...</option>';
    foodCooksCache.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `👨‍🍳 ${c.name} (${c.duty_status === 'ON_DUTY' ? 'On Duty' : 'Off Duty'}) - ${c.active_orders_count || 0} active`;
        cookSelect.appendChild(opt);
    });

    modal.classList.remove('hidden');
};

window.closeReassignFoodModal = function () {
    const modal = document.getElementById('modal-reassign-food-order');
    if (modal) modal.classList.add('hidden');
};

window.submitReassignFoodOrder = async function (e) {
    if (e) e.preventDefault();
    const orderId = document.getElementById('reassign-order-id')?.value;
    const cookId = document.getElementById('reassign-cook-select')?.value;
    const reason = document.getElementById('reassign-reason-input')?.value || 'Reassigned by Admin';
    const btn = document.getElementById('btn-submit-reassign');

    if (!orderId || !cookId) {
        showToast('Please select a target cook.', 'warning');
        return;
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Reassigning...';
        }

        const res = await fetch(`/api/food/orders/${orderId}/reassign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ cook_id: cookId, reason: reason })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            closeReassignFoodModal();
            showToast('Order successfully reassigned to new cook!', 'success');
            loadFoodDeptAdmin();
        } else {
            throw new Error(data.error || 'Failed to reassign order');
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Reassign Now';
        }
    }
};


function openProductModalForFood() {
    openProductModal();
    const catSelect = document.getElementById('form-product-category');
    if (catSelect) {
        catSelect.value = "Quick's Instant Food"; if (!catSelect.value) catSelect.value = 'Instant Food';
        if (typeof onModalCategoryChange === 'function') {
            onModalCategoryChange();
        }
    }
}
window.openProductModalForFood = openProductModalForFood;


// ============================================================
// HOSTEL GROUP MANAGEMENT & SHARED INVENTORY (SUPER ADMIN)
// ============================================================
function authFetch(url, options = {}) {
    const headers = {
        ...getAuthHeaders(),
        ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
}
window.authFetch = authFetch;

let hostelGroupsCache = [];
let hostelGroupsStaffCache = [];
let hostelModalFullList = [];
let hostelModalFilterActive = 'all';

async function loadHostelGroups() {
    const tbody = document.getElementById('hostel-groups-tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-[#5c5f60]"><span class="material-symbols-outlined animate-spin text-lg inline-block align-middle mr-1 text-[#0066cc]">progress_activity</span> Loading hostel groups...</td></tr>';
    }

    try {
        const fetchFn = typeof window.authFetch === 'function' ? window.authFetch : (typeof authFetch === 'function' ? authFetch : (u, o = {}) => fetch(u, { ...o, headers: { ...(typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}), ...(o.headers || {}) } }));
        const res = await fetchFn('/api/admin/hostel-groups');
        const data = await res.json();

        if (data.success && Array.isArray(data.groups)) {
            hostelGroupsCache = data.groups;
            updateHostelGroupsStats();
            renderHostelGroups(hostelGroupsCache);
        } else {
            throw new Error(data.error || 'Failed to fetch hostel groups');
        }
    } catch (err) {
        console.error('[Load Hostel Groups Error]:', err.message);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#ba1a1a]">Failed to load hostel groups: ${escapeHtml(err.message)} <br><button onclick="loadHostelGroups()" class="mt-2 px-3 py-1 bg-white border border-[#ba1a1a] rounded-lg text-xs font-bold text-[#ba1a1a] hover:bg-rose-50">Retry</button></td></tr>`;
        }
    }
}

function updateHostelGroupsStats() {
    const total = hostelGroupsCache.length;
    const shared = hostelGroupsCache.filter(g => g.inventory_mode === 'shared').length;
    const independent = hostelGroupsCache.filter(g => g.inventory_mode === 'independent').length;

    const allHostelIds = new Set();
    hostelGroupsCache.forEach(g => {
        (g.hostel_ids || []).forEach(h => allHostelIds.add(h));
    });

    const elTotal = document.getElementById('stat-groups-total');
    if (elTotal) elTotal.textContent = total;

    const elShared = document.getElementById('stat-groups-shared');
    if (elShared) elShared.textContent = shared;

    const elInd = document.getElementById('stat-groups-independent');
    if (elInd) elInd.textContent = independent;

    const elHostels = document.getElementById('stat-groups-hostels');
    if (elHostels) elHostels.textContent = allHostelIds.size;

    const badge = document.getElementById('nav-hostel-groups-badge');
    if (badge) badge.textContent = total;
}

function renderHostelGroups(groups) {
    const tbody = document.getElementById('hostel-groups-tbody');
    if (!tbody) return;

    if (!groups || groups.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-[#5c5f60]">
                    <div class="max-w-xs mx-auto space-y-2">
                        <span class="material-symbols-outlined text-4xl text-gray-300">hub</span>
                        <p class="font-bold text-[#181c1f]">No Hostel Groups Found</p>
                        <p class="text-xs text-gray-500">Combine multiple hostels into operational groups with real-time shared inventory and assigned store managers.</p>
                        <button onclick="openHostelGroupModal()" class="mt-2 px-4 py-2 bg-[#0066cc] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#0052a3]">
                            + Create First Hostel Group
                        </button>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = groups.map(g => {
        const isShared = g.inventory_mode === 'shared';
        const isActive = g.status === 'active' || g.is_active === true;

        // Member Hostels chips
        const memberChips = (g.member_hostels && g.member_hostels.length > 0)
            ? g.member_hostels.map(m => {
                const isLive = m.status === 'ACTIVE' || m.status === 'active';
                return `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${isLive ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-slate-50 text-slate-600 border border-slate-200'}" title="${escapeHtml(m.name)} (${isLive ? 'Live Store' : 'OFF'})">
                    <span class="w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-gray-400'}"></span>
                    ${escapeHtml(m.id)}
                </span>`;
            }).join(' ')
            : '<span class="text-gray-400 italic text-[11px]">No hostels assigned</span>';

        // Assigned Admins chips
        const adminChips = (g.assigned_admins && g.assigned_admins.length > 0)
            ? g.assigned_admins.map(a => `
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200" title="${escapeHtml(a.email)}">
                    <span class="material-symbols-outlined text-[11px]">person</span>
                    ${escapeHtml(a.name || a.id)}
                </span>`).join(' ')
            : '<span class="text-gray-400 italic text-[11px]">No managers assigned</span>';

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors text-xs">
                <td class="p-4">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-xl ${isShared ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'} flex items-center justify-center font-bold shrink-0">
                            <span class="material-symbols-outlined text-base">${isShared ? 'sync_alt' : 'hub'}</span>
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-[#181c1f] text-[13px]">${escapeHtml(g.name)}</span>
                                <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-bold border border-slate-200">${escapeHtml(g.code)}</span>
                            </div>
                            <p class="text-[11px] text-[#5c5f60] line-clamp-1">${escapeHtml(g.description || 'No description')}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${isShared ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'}">
                            <span class="material-symbols-outlined text-xs">${isShared ? 'sync_alt' : 'domain_disabled'}</span>
                            ${isShared ? 'Shared Inventory' : 'Independent'}
                        </span>
                        <button onclick="toggleHostelGroupMode('${g.id}')"
                            title="Switch to ${isShared ? 'Independent' : 'Shared'} Inventory Mode"
                            class="p-1 text-gray-400 hover:text-[#0066cc] rounded-lg hover:bg-slate-100 transition-colors">
                            <span class="material-symbols-outlined text-sm">swap_horiz</span>
                        </button>
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex flex-wrap gap-1 max-w-xs">
                        ${memberChips}
                    </div>
                </td>
                <td class="p-4">
                    <div class="flex flex-wrap gap-1 max-w-xs">
                        ${adminChips}
                    </div>
                </td>
                <td class="p-4">
                    <button onclick="toggleHostelGroupStatus('${g.id}')"
                        class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all active:scale-95 ${isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' : 'bg-rose-100 text-[#ba1a1a] border border-rose-300 hover:bg-rose-200'}">
                        <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                        ${isActive ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="openHostelGroupModal('${g.id}')"
                            class="p-1.5 text-[#5c5f60] hover:text-[#0066cc] hover:bg-[#ebeef2] rounded-lg transition-colors"
                            title="Edit Group">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button onclick="deleteHostelGroup('${g.id}', '${escapeHtml(g.name)}')"
                            class="p-1.5 text-[#5c5f60] hover:text-[#ba1a1a] hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Group">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function filterHostelGroupsTable() {
    const q = (document.getElementById('filter-hostel-groups-search')?.value || '').toLowerCase().trim();
    const mode = document.getElementById('filter-hostel-groups-mode')?.value || 'all';
    const status = document.getElementById('filter-hostel-groups-status')?.value || 'all';

    let filtered = hostelGroupsCache.filter(g => {
        if (mode !== 'all' && g.inventory_mode !== mode) return false;
        if (status === 'active' && !(g.status === 'active' || g.is_active === true)) return false;
        if (status === 'inactive' && (g.status === 'active' || g.is_active === true)) return false;

        if (q) {
            const matchName = (g.name || '').toLowerCase().includes(q);
            const matchCode = (g.code || '').toLowerCase().includes(q);
            const matchHostel = (g.hostel_ids || []).some(h => String(h).toLowerCase().includes(q));
            if (!matchName && !matchCode && !matchHostel) return false;
        }
        return true;
    });

    renderHostelGroups(filtered);
}

function updateGroupModeCardStyles() {
    const sharedRadio = document.querySelector('input[name="group-inventory-mode"][value="shared"]');
    const sharedCard = document.getElementById('card-mode-shared');
    const indCard = document.getElementById('card-mode-independent');

    if (sharedRadio && sharedRadio.checked) {
        if (sharedCard) {
            sharedCard.className = 'border-2 border-emerald-500 bg-emerald-50/50 p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all group-mode-card';
        }
        if (indCard) {
            indCard.className = 'border border-[#DADCE0] bg-white p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all group-mode-card';
        }
    } else {
        if (sharedCard) {
            sharedCard.className = 'border border-[#DADCE0] bg-white p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all group-mode-card';
        }
        if (indCard) {
            indCard.className = 'border-2 border-indigo-500 bg-indigo-50/50 p-3 rounded-xl cursor-pointer flex items-start gap-2.5 transition-all group-mode-card';
        }
    }
}

function toggleAllGroupHostels(checked) {
    document.querySelectorAll('#group-hostels-checklist input[type="checkbox"]').forEach(cb => {
        cb.checked = Boolean(checked);
    });
    updateSelectedHostelsCount();
}

function toggleLiveGroupHostelsOnly() {
    document.querySelectorAll('#group-hostels-checklist input[type="checkbox"]').forEach(cb => {
        const isLive = cb.dataset.isLive === 'true';
        cb.checked = isLive;
    });
    updateSelectedHostelsCount();
}

function toggleAllGroupAdmins(checked) {
    document.querySelectorAll('#group-admins-checklist input[type="checkbox"]').forEach(cb => {
        cb.checked = Boolean(checked);
    });
}

function updateSelectedHostelsCount() {
    const count = document.querySelectorAll('#group-hostels-checklist input[type="checkbox"]:checked').length;
    const badge = document.getElementById('group-hostel-count-badge');
    if (badge) {
        badge.textContent = `${count} selected`;
        badge.className = count > 0 ? 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800' : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0066cc]';
    }
}

function filterModalHostelsList(filterType) {
    hostelModalFilterActive = filterType;
    ['all', 'live', 'bh', 'gh'].forEach(t => {
        const btn = document.getElementById(`btn-modal-filter-${t}`);
        if (btn) {
            if (t === filterType) {
                btn.className = 'px-2.5 py-1 rounded-lg font-bold bg-[#0066cc] text-white';
            } else {
                btn.className = 'px-2.5 py-1 rounded-lg font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
            }
        }
    });

    renderModalHostelChecklist();
}

function renderModalHostelChecklist(preSelected = null) {
    const checklist = document.getElementById('group-hostels-checklist');
    if (!checklist) return;

    // Retain checked state before re-render
    const currentlyChecked = preSelected || new Set(Array.from(document.querySelectorAll('#group-hostels-checklist input[type="checkbox"]:checked')).map(cb => cb.value));

    let list = [...hostelModalFullList];

    if (hostelModalFilterActive === 'live') {
        list = list.filter(h => h.is_live);
    } else if (hostelModalFilterActive === 'bh') {
        list = list.filter(h => h.id.toUpperCase().startsWith('BH'));
    } else if (hostelModalFilterActive === 'gh') {
        list = list.filter(h => h.id.toUpperCase().startsWith('GH'));
    }

    if (list.length === 0) {
        checklist.innerHTML = '<div class="col-span-full p-4 text-center text-gray-400 text-xs">No hostels found matching filter.</div>';
        return;
    }

    checklist.innerHTML = list.map(h => {
        const isChecked = currentlyChecked.has(h.id);
        const isLive = h.is_live;

        let managerHtml = '';
        if (h.manager_name && h.manager_name !== 'Unassigned') {
            managerHtml = `<span class="text-[10px] text-purple-700 font-semibold truncate block">👤 ${escapeHtml(h.manager_name)}</span>`;
        } else {
            managerHtml = `<span class="text-[10px] text-gray-400 truncate block">No Store Manager</span>`;
        }

        let groupTag = '';
        if (h.existing_group_name) {
            groupTag = `<span class="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 truncate block">In: ${escapeHtml(h.existing_group_name)}</span>`;
        }

        return `
            <label class="flex items-center justify-between p-2.5 bg-white border ${isChecked ? 'border-[#0066cc] bg-blue-50/30' : (isLive ? 'border-emerald-200' : 'border-[#DADCE0]')} rounded-xl cursor-pointer hover:border-[#0066cc] hover:bg-blue-50/40 transition-all text-xs shadow-2xs">
                <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <input type="checkbox" name="group-member-hostel" value="${escapeHtml(h.id)}" data-is-live="${isLive}" ${isChecked ? 'checked' : ''} onchange="updateSelectedHostelsCount()" class="rounded text-[#0066cc] focus:ring-[#0066cc] w-4 h-4 shrink-0">
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="font-bold text-slate-900 leading-tight truncate">${escapeHtml(h.name || h.id)}</span>
                            <span class="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">${escapeHtml(h.id)}</span>
                        </div>
                        <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                            ${managerHtml}
                            ${groupTag}
                        </div>
                    </div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${isLive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'} shrink-0">
                    ${isLive ? '🟢 LIVE STORE' : 'OFF'}
                </span>
            </label>`;
    }).join('');

    updateSelectedHostelsCount();
}

async function openHostelGroupModal(groupId = null) {
    const modal = document.getElementById('modal-hostel-group');
    if (!modal) return;

    const title = document.getElementById('modal-hostel-group-title');
    const errEl = document.getElementById('group-form-error');
    if (errEl) errEl.classList.add('hidden');

    document.getElementById('group-form-id').value = groupId || '';
    document.getElementById('group-form-name').value = '';
    document.getElementById('group-form-code').value = '';
    document.getElementById('group-form-desc').value = '';
    document.getElementById('group-form-status').value = 'active';

    const sharedRadio = document.querySelector('input[name="group-inventory-mode"][value="shared"]');
    if (sharedRadio) sharedRadio.checked = true;
    updateGroupModeCardStyles();

    title.textContent = groupId ? 'Edit Hostel Group' : 'Create Hostel Group';

    const hostelChecklist = document.getElementById('group-hostels-checklist');
    const adminChecklist = document.getElementById('group-admins-checklist');

    modal.classList.remove('hidden');

    function populateLists(hostelsList, staffList) {
        const hostelToGroupMap = new Map();
        (hostelGroupsCache || []).forEach(g => {
            if (g.id !== groupId) {
                (g.hostel_ids || []).forEach(hId => {
                    const clean = String(hId).toUpperCase().replace(/[^A-Z0-9]/g, '');
                    hostelToGroupMap.set(clean, g.name);
                });
            }
        });

        const fullList = (hostelsList || []).map(h => {
            const clean = String(h.id).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const isLive = h.status === 'ACTIVE' || h.status === 'active';
            return {
                id: h.id,
                name: h.name || h.id,
                status: h.status || 'ACTIVE',
                is_live: isLive,
                manager_name: h.manager_name || (h.manager_user_id ? 'Store Manager' : 'Unassigned'),
                existing_group_name: hostelToGroupMap.get(clean) || null
            };
        });

        fullList.sort((a, b) => {
            if (a.is_live && !b.is_live) return -1;
            if (!a.is_live && b.is_live) return 1;
            return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
        });

        hostelModalFullList = fullList;
        hostelModalFilterActive = 'all';

        let preSelectedHostels = new Set();
        let preSelectedAdmins = new Set();

        if (groupId) {
            const group = (hostelGroupsCache || []).find(g => g.id === groupId);
            if (group) {
                document.getElementById('group-form-name').value = group.name || '';
                document.getElementById('group-form-code').value = group.code || '';
                document.getElementById('group-form-desc').value = group.description || '';
                document.getElementById('group-form-status').value = group.status || (group.is_active ? 'active' : 'inactive');

                const modeRadio = document.querySelector(`input[name="group-inventory-mode"][value="${group.inventory_mode || 'shared'}"]`);
                if (modeRadio) modeRadio.checked = true;
                updateGroupModeCardStyles();

                (group.hostel_ids || []).forEach(h => {
                    preSelectedHostels.add(h);
                    const matched = fullList.find(x => x.id.toUpperCase().replace(/[^A-Z0-9]/g, '') === String(h).toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    if (matched) preSelectedHostels.add(matched.id);
                });

                (group.admin_ids || []).forEach(a => preSelectedAdmins.add(String(a)));
            }
        }

        renderModalHostelChecklist(preSelectedHostels);

        if (adminChecklist && staffList && staffList.length > 0) {
            hostelGroupsStaffCache = staffList;
            adminChecklist.innerHTML = staffList.map(s => {
                const isChecked = preSelectedAdmins.has(String(s.id));
                const rolesText = Array.isArray(s.roles) ? s.roles.join(', ') : (s.role || 'Staff');
                const isDuty = s.duty_status === 'ON_DUTY' || s.is_on_duty;
                const assignedH = s.assigned_hostel_id ? `🏢 Current: ${s.assigned_hostel_name || s.assigned_hostel_id}` : '🌐 General Admin';

                return `
                    <label class="flex items-center justify-between p-2.5 bg-white border ${isChecked ? 'border-purple-500 bg-purple-50/30' : 'border-[#DADCE0]'} rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/40 transition-all text-xs shadow-2xs">
                        <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                            <input type="checkbox" name="group-assigned-admin" value="${escapeHtml(s.id)}" ${isChecked ? 'checked' : ''} class="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 shrink-0">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-1.5 flex-wrap">
                                    <span class="font-bold text-slate-900 truncate leading-tight">${escapeHtml(s.name || s.id)}</span>
                                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 uppercase shrink-0">${escapeHtml(rolesText)}</span>
                                </div>
                                <div class="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span class="truncate">📧 ${escapeHtml(s.email || '')}</span>
                                    <span class="font-medium text-slate-700 truncate">${escapeHtml(assignedH)}</span>
                                </div>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${isDuty ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'} shrink-0">
                            ${isDuty ? '🟢 On Duty' : '⚪ Off'}
                        </span>
                    </label>`;
            }).join('');
        }
    }

    // Immediate fast render if hostelsCache is already available
    if (hostelsCache && hostelsCache.length > 0) {
        populateLists(hostelsCache, hostelGroupsStaffCache || []);
    } else {
        if (hostelChecklist) {
            hostelChecklist.innerHTML = '<div class="col-span-full p-4 text-center text-gray-400 text-xs"><span class="material-symbols-outlined animate-spin text-sm inline-block mr-1">progress_activity</span> Loading campus hostels...</div>';
        }
        if (adminChecklist) {
            adminChecklist.innerHTML = '<div class="p-4 text-center text-gray-400 text-xs"><span class="material-symbols-outlined animate-spin text-sm inline-block mr-1">progress_activity</span> Loading store manager roster...</div>';
        }
    }

    try {
        const fetchFn = typeof window.authFetch === 'function' ? window.authFetch : (typeof authFetch === 'function' ? authFetch : (u, o = {}) => fetch(u, { ...o, headers: { ...(typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}), ...(o.headers || {}) } }));

        const [hostelsRes, staffRes] = await Promise.allSettled([
            fetchFn('/api/admin/hostels'),
            fetchFn('/api/admin/staff')
        ]);

        let freshHostels = (hostelsCache && hostelsCache.length > 0) ? hostelsCache : [];
        if (hostelsRes.status === 'fulfilled' && hostelsRes.value.ok) {
            try {
                const hData = await hostelsRes.value.json();
                if (hData && Array.isArray(hData.hostels) && hData.hostels.length > 0) {
                    freshHostels = hData.hostels;
                    hostelsCache = hData.hostels;
                }
            } catch (e) { }
        }

        let freshStaff = hostelGroupsStaffCache || [];
        if (staffRes.status === 'fulfilled' && staffRes.value.ok) {
            try {
                const sData = await staffRes.value.json();
                if (sData && Array.isArray(sData.staff)) {
                    freshStaff = sData.staff;
                    hostelGroupsStaffCache = sData.staff;
                }
            } catch (e) { }
        }

        populateLists(freshHostels, freshStaff);

    } catch (err) {
        console.error('[Open Hostel Group Modal Error]:', err.message);
        if (!hostelsCache || hostelsCache.length === 0) {
            if (hostelChecklist) hostelChecklist.innerHTML = `<div class="col-span-full p-4 text-center text-rose-500 text-xs">Failed to load campus hostels: ${escapeHtml(err.message)}</div>`;
        }
    }
}

function closeHostelGroupModal() {
    const modal = document.getElementById('modal-hostel-group');
    if (modal) modal.classList.add('hidden');
}

async function submitHostelGroupForm(event) {
    if (event) event.preventDefault();

    const id = document.getElementById('group-form-id').value;
    const name = document.getElementById('group-form-name').value.trim();
    const code = document.getElementById('group-form-code').value.trim().toUpperCase();
    const description = document.getElementById('group-form-desc').value.trim();
    const status = document.getElementById('group-form-status').value;
    const inventory_mode = document.querySelector('input[name="group-inventory-mode"]:checked')?.value || 'shared';

    const selectedHostels = Array.from(document.querySelectorAll('#group-hostels-checklist input[type="checkbox"]:checked')).map(cb => cb.value);
    const selectedAdmins = Array.from(document.querySelectorAll('#group-admins-checklist input[type="checkbox"]:checked')).map(cb => cb.value);

    const errEl = document.getElementById('group-form-error');
    if (errEl) errEl.classList.add('hidden');

    if (!name) {
        showToast('Group name is required', 'warning');
        return;
    }
    if (selectedHostels.length === 0) {
        if (errEl) {
            errEl.textContent = 'Please select at least one hostel for this group.';
            errEl.classList.remove('hidden');
        }
        showToast('Please select at least one member hostel', 'warning');
        return;
    }

    const saveBtn = document.getElementById('btn-save-hostel-group');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm mr-1">progress_activity</span> Saving...';
    }

    try {
        const payload = {
            name,
            code,
            description,
            inventory_mode,
            status,
            hostel_ids: selectedHostels,
            admin_ids: selectedAdmins
        };

        const url = id ? `/api/admin/hostel-groups/${id}` : '/api/admin/hostel-groups';
        const method = id ? 'PUT' : 'POST';

        const res = await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            showToast(data.message || 'Hostel group saved successfully', 'success');
            closeHostelGroupModal();
            await loadHostelGroups();
            if (typeof populateHostelDropdowns === 'function') populateHostelDropdowns();
        } else {
            throw new Error(data.error || 'Failed to save group');
        }
    } catch (err) {
        console.error('[Submit Hostel Group Error]:', err.message);
        if (errEl) {
            errEl.textContent = err.message;
            errEl.classList.remove('hidden');
        }
        showToast(err.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-base">check</span><span>Save Hostel Group</span>';
        }
    }
}

async function toggleHostelGroupMode(groupId) {
    try {
        const res = await authFetch(`/api/admin/hostel-groups/${groupId}/toggle-mode`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadHostelGroups();
        } else {
            throw new Error(data.error || 'Failed to toggle inventory mode');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function toggleHostelGroupStatus(groupId) {
    try {
        const res = await authFetch(`/api/admin/hostel-groups/${groupId}/toggle-status`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadHostelGroups();
        } else {
            throw new Error(data.error || 'Failed to toggle status');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteHostelGroup(groupId, groupName) {
    if (!confirm(`Are you sure you want to delete hostel group "${groupName}"?\n\nMember hostels will immediately revert to independent inventory mode.`)) {
        return;
    }

    try {
        const res = await authFetch(`/api/admin/hostel-groups/${groupId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || 'Group deleted successfully', 'success');
            await loadHostelGroups();
            if (typeof populateHostelDropdowns === 'function') populateHostelDropdowns();
        } else {
            throw new Error(data.error || 'Failed to delete group');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.loadHostelGroups = loadHostelGroups;
window.renderHostelGroups = renderHostelGroups;
window.filterHostelGroupsTable = filterHostelGroupsTable;
window.openHostelGroupModal = openHostelGroupModal;
window.closeHostelGroupModal = closeHostelGroupModal;
window.updateGroupModeCardStyles = updateGroupModeCardStyles;
window.toggleAllGroupHostels = toggleAllGroupHostels;
window.toggleLiveGroupHostelsOnly = toggleLiveGroupHostelsOnly;
window.toggleAllGroupAdmins = toggleAllGroupAdmins;
window.updateSelectedHostelsCount = updateSelectedHostelsCount;
window.filterModalHostelsList = filterModalHostelsList;
window.submitHostelGroupForm = submitHostelGroupForm;
window.toggleHostelGroupMode = toggleHostelGroupMode;
window.toggleHostelGroupStatus = toggleHostelGroupStatus;
window.deleteHostelGroup = deleteHostelGroup;


// ================= HOSTEL DELIVERY BLOCKS MANAGEMENT MODAL =================
let currentManagingBlocksHostelId = null;

function openManageBlocksModal(hostelId = null) {
    const modal = document.getElementById('modal-hostel-blocks');
    if (!modal) return;

    const select = document.getElementById('manage-blocks-hostel-select');
    if (select && Array.isArray(hostelsCache) && hostelsCache.length > 0) {
        select.innerHTML = hostelsCache.map(h => `
            <option value="${escapeHtml(h.id)}">${escapeHtml(h.id)} - ${escapeHtml(h.name)} (${h.status === 'ACTIVE' ? 'LIVE' : 'OFF'})</option>
        `).join('');
    }

    currentManagingBlocksHostelId = hostelId || (hostelsCache && hostelsCache[0]?.id) || 'BH-13';
    if (select) {
        select.value = currentManagingBlocksHostelId;
    }

    const titleEl = document.getElementById('modal-blocks-title');
    if (titleEl) {
        const found = (hostelsCache || []).find(h => h.id === currentManagingBlocksHostelId);
        titleEl.textContent = `Manage Delivery Blocks: ${currentManagingBlocksHostelId} (${found?.name || ''})`;
    }

    renderHostelBlocksChecklist();
    modal.classList.remove('hidden');
}

function closeHostelBlocksModal() {
    const modal = document.getElementById('modal-hostel-blocks');
    if (modal) modal.classList.add('hidden');
}

function onManageBlocksHostelChange(hostelId) {
    currentManagingBlocksHostelId = hostelId;
    const titleEl = document.getElementById('modal-blocks-title');
    if (titleEl) {
        const found = (hostelsCache || []).find(h => h.id === currentManagingBlocksHostelId);
        titleEl.textContent = `Manage Delivery Blocks: ${currentManagingBlocksHostelId} (${found?.name || ''})`;
    }
    renderHostelBlocksChecklist();
}

function renderHostelBlocksChecklist() {
    const container = document.getElementById('blocks-checkboxes-container');
    if (!container) return;

    const hostel = (hostelsCache || []).find(h => h.id === currentManagingBlocksHostelId);
    const activeBlocks = Array.isArray(hostel?.blocks) && hostel.blocks.length > 0 ? hostel.blocks : ['Block A', 'Block B'];

    // Standard base blocks
    const standardBlocks = ['Block A', 'Block B', 'Block C', 'Block D', 'Hostel Main Gate'];
    const allKnownBlocks = [...standardBlocks];
    activeBlocks.forEach(b => {
        if (!allKnownBlocks.includes(b)) allKnownBlocks.push(b);
    });

    container.innerHTML = allKnownBlocks.map(b => {
        const isActive = activeBlocks.includes(b);
        const isGate = b.toLowerCase().includes('gate');
        return `
            <label class="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${isActive ? 'border-[#0066cc] bg-blue-50/40 text-[#0066cc]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}" id="label-block-${escapeHtml(b).replace(/[^a-zA-Z0-9]/g, '_')}">
                <input type="checkbox" value="${escapeHtml(b)}" ${isActive ? 'checked' : ''} onchange="onBlockCheckboxToggled(this)" class="rounded text-[#0066cc] focus:ring-[#0066cc] w-4 h-4 shrink-0">
                <span class="material-symbols-outlined text-base shrink-0 ${isActive ? 'text-[#0066cc]' : 'text-slate-400'}">${isGate ? 'sensor_door' : 'apartment'}</span>
                <span class="font-bold text-xs truncate flex-1">${escapeHtml(b)}</span>
            </label>
        `;
    }).join('');

    updateBlocksModalLivePreview();
}

function onBlockCheckboxToggled(cb) {
    const label = cb.closest('label');
    const isChecked = cb.checked;
    const icon = label ? label.querySelector('.material-symbols-outlined') : null;

    if (label) {
        if (isChecked) {
            label.className = 'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer border-[#0066cc] bg-blue-50/40 text-[#0066cc]';
            if (icon) icon.className = 'material-symbols-outlined text-base shrink-0 text-[#0066cc]';
        } else {
            label.className = 'flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-slate-300';
            if (icon) icon.className = 'material-symbols-outlined text-base shrink-0 text-slate-400';
        }
    }
    updateBlocksModalLivePreview();
}

function applyBlocksPreset(presetList) {
    const container = document.getElementById('blocks-checkboxes-container');
    if (!container) return;

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = presetList.includes(cb.value);
        onBlockCheckboxToggled(cb);
    });
}

function toggleMainGateBlock() {
    const container = document.getElementById('blocks-checkboxes-container');
    if (!container) return;

    let gateCheckbox = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(cb => cb.value.toLowerCase().includes('gate'));
    if (gateCheckbox) {
        gateCheckbox.checked = !gateCheckbox.checked;
        onBlockCheckboxToggled(gateCheckbox);
    } else {
        addNewCustomBlock('Hostel Main Gate');
    }
}

function addNewCustomBlock(predefinedName = null) {
    const input = document.getElementById('input-new-block-name');
    const rawVal = predefinedName || (input ? input.value : '');
    const blockName = (rawVal || '').trim();
    if (!blockName) return;

    const container = document.getElementById('blocks-checkboxes-container');
    if (!container) return;

    // Check if already exists
    const existing = Array.from(container.querySelectorAll('input[type="checkbox"]')).find(cb => cb.value.toLowerCase() === blockName.toLowerCase());
    if (existing) {
        existing.checked = true;
        onBlockCheckboxToggled(existing);
        if (input) input.value = '';
        return;
    }

    const isGate = blockName.toLowerCase().includes('gate');
    const newHtml = `
        <label class="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer border-[#0066cc] bg-blue-50/40 text-[#0066cc]" id="label-block-${escapeHtml(blockName).replace(/[^a-zA-Z0-9]/g, '_')}">
            <input type="checkbox" value="${escapeHtml(blockName)}" checked onchange="onBlockCheckboxToggled(this)" class="rounded text-[#0066cc] focus:ring-[#0066cc] w-4 h-4 shrink-0">
            <span class="material-symbols-outlined text-base shrink-0 text-[#0066cc]">${isGate ? 'sensor_door' : 'apartment'}</span>
            <span class="font-bold text-xs truncate flex-1">${escapeHtml(blockName)}</span>
        </label>
    `;
    container.insertAdjacentHTML('beforeend', newHtml);
    if (input) input.value = '';
    updateBlocksModalLivePreview();
}

function updateBlocksModalLivePreview() {
    const modal = document.getElementById('modal-hostel-blocks');
    if (!modal) return;

    const checkedBoxes = Array.from(modal.querySelectorAll('#blocks-checkboxes-container input[type="checkbox"]:checked'));
    const checkedBlocks = checkedBoxes.map(cb => cb.value);

    const countLabel = document.getElementById('blocks-active-count-label');
    if (countLabel) {
        countLabel.textContent = `${checkedBlocks.length} Block${checkedBlocks.length === 1 ? '' : 's'} Active on Storefront`;
    }

    const previewContainer = document.getElementById('blocks-live-preview-pills');
    if (previewContainer) {
        if (checkedBlocks.length === 0) {
            previewContainer.innerHTML = '<span class="text-rose-500 font-bold text-xs">⚠️ No blocks selected! At least one block must be active.</span>';
        } else {
            previewContainer.innerHTML = checkedBlocks.map(b => {
                const isGate = b.toLowerCase().includes('gate');
                return `
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                        <span class="material-symbols-outlined text-xs">${isGate ? 'sensor_door' : 'apartment'}</span>
                        <span>${escapeHtml(b)}</span>
                    </span>
                `;
            }).join('');
        }
    }
}

async function saveHostelBlocks() {
    if (!currentManagingBlocksHostelId) return;

    const modal = document.getElementById('modal-hostel-blocks');
    const checkedBoxes = Array.from(modal.querySelectorAll('#blocks-checkboxes-container input[type="checkbox"]:checked'));
    const checkedBlocks = checkedBoxes.map(cb => cb.value.trim()).filter(Boolean);

    const errBox = document.getElementById('blocks-modal-error');
    if (errBox) errBox.classList.add('hidden');

    if (checkedBlocks.length === 0) {
        if (errBox) {
            errBox.textContent = 'Please select at least one active block (e.g. Block A).';
            errBox.classList.remove('hidden');
        }
        return;
    }

    const saveBtn = document.getElementById('btn-save-hostel-blocks');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin mr-1">sync</span> Saving...';
    }

    try {
        const res = await fetch(`/api/admin/hostels/${encodeURIComponent(currentManagingBlocksHostelId)}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ blocks: checkedBlocks })
        });
        const data = await res.json();
        if (data && data.success) {
            // Update cache
            const targetHostel = (hostelsCache || []).find(h => h.id === currentManagingBlocksHostelId);
            if (targetHostel) {
                targetHostel.blocks = checkedBlocks;
            }
            renderHostelsTable();
            closeHostelBlocksModal();
            showToast(`✓ ${currentManagingBlocksHostelId} active blocks saved: ${checkedBlocks.join(', ')}`, 'success');
        } else {
            if (errBox) {
                errBox.textContent = data.error || 'Failed to update blocks';
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
            saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span><span>Save Active Blocks</span>';
        }
    }
}

window.openManageBlocksModal = openManageBlocksModal;
window.closeHostelBlocksModal = closeHostelBlocksModal;
window.onManageBlocksHostelChange = onManageBlocksHostelChange;
window.applyBlocksPreset = applyBlocksPreset;
window.toggleMainGateBlock = toggleMainGateBlock;
window.addNewCustomBlock = addNewCustomBlock;
window.onBlockCheckboxToggled = onBlockCheckboxToggled;
window.saveHostelBlocks = saveHostelBlocks;


// ============================================================
// FOOD DEPARTMENT & LIVE KITCHEN QUEUE FOR ADMIN DASHBOARD
// ============================================================
function isFoodDeptAdmin(profile = currentAdminProfile) {
    if (!profile) return false;
    if (typeof isPlatformOwner === 'function' && isPlatformOwner(profile)) return true;
    if (profile.is_owner) return true;
    const roles = Array.isArray(profile.roles) ? profile.roles : [];
    return roles.includes('cook') || roles.includes('food_department') || roles.includes('food') || profile.department === 'food';
}
window.isFoodDeptAdmin = isFoodDeptAdmin;

async function loadDashboardFoodQueue() {
    const card = document.getElementById('dash-food-dept-card');
    if (!card) return;
    card.classList.remove('hidden');

    const tbody = document.getElementById('dash-food-orders-tbody');
    try {
        const [ordersRes, metricsRes] = await Promise.all([
            fetch('/api/food/orders', { headers: getAuthHeaders() }),
            fetch('/api/food/metrics', { headers: getAuthHeaders() })
        ]);

        let orders = [];
        if (ordersRes.ok) {
            const oData = await ordersRes.json();
            if (oData.success && Array.isArray(oData.orders)) {
                orders = oData.orders;
            }
        }

        let metrics = {};
        if (metricsRes.ok) {
            const mData = await metricsRes.json();
            if (mData.success && mData.metrics) {
                metrics = mData.metrics;
            }
        }

        // Update Stats
        const statActive = document.getElementById('dash-food-stat-active');
        const statCooking = document.getElementById('dash-food-stat-cooking');
        const statReady = document.getElementById('dash-food-stat-ready');
        const statTotal = document.getElementById('dash-food-stat-total');

        const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
        const cookingOrders = orders.filter(o => o.status === 'Cooking' || o.status === 'Preparing');
        const readyOrders = orders.filter(o => o.status === 'Ready' || o.status === 'Ready for Pickup');

        if (statActive) statActive.textContent = activeOrders.length;
        if (statCooking) statCooking.textContent = metrics.preparing_count !== undefined ? metrics.preparing_count : cookingOrders.length;
        if (statReady) statReady.textContent = metrics.ready_count !== undefined ? metrics.ready_count : readyOrders.length;
        if (statTotal) statTotal.textContent = metrics.total_food_orders || orders.length;

        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-[#5c5f60]">
                        <span class="text-2xl block mb-1">🍳</span>
                        <p class="font-bold text-xs text-[#181c1f]">No active kitchen orders</p>
                        <p class="text-[11px] text-[#5c5f60]">All Quick's Instant Food orders are prepped & delivered!</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = orders.slice(0, 10).map(order => {
            const shortId = (order.order_id || '').replace(/^order_/, '').slice(0, 8);
            const itemsSummary = (order.food_items || []).map(i => `${i.name} (×${i.quantity})`).join(', ') || "Quick's Instant Food";
            const isCooking = order.status === 'Cooking' || order.status === 'Preparing';
            const isReady = order.status === 'Ready' || order.status === 'Ready for Pickup';

            let statusBadge = '';
            if (isReady) {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">READY</span>';
            } else if (isCooking) {
                statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-300 animate-pulse">COOKING</span>';
            } else {
                statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">${escapeHtml(order.status)}</span>`;
            }

            return `
                <tr class="hover:bg-amber-50/50 transition-colors">
                    <td class="p-3 font-mono font-bold text-[#181c1f]">#${shortId}</td>
                    <td class="p-3">
                        <p class="font-bold text-[#181c1f]">${escapeHtml(order.customer_name)}</p>
                        <p class="text-[10px] text-[#5c5f60]">${escapeHtml(order.delivery_address)}</p>
                    </td>
                    <td class="p-3 text-xs text-[#181c1f] max-w-xs truncate" title="${escapeHtml(itemsSummary)}">
                        🍜 ${escapeHtml(itemsSummary)}
                    </td>
                    <td class="p-3 font-medium text-xs text-amber-900">
                        👨‍🍳 ${escapeHtml(order.cook_name || 'Assigned Chef')}
                    </td>
                    <td class="p-3">${statusBadge}</td>
                    <td class="p-3 text-right">
                        <div class="inline-flex items-center gap-1.5 justify-end">
                            ${!isReady ? `
                                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Ready')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer" title="Mark order prepared & ready for delivery">
                                    <span>Mark Ready</span>
                                    <span class="material-symbols-outlined text-[13px]">check</span>
                                </button>
                            ` : `
                                <span class="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                                    <span class="material-symbols-outlined text-xs">done_all</span> Handed Over
                                </span>
                            `}
                            <button type="button" onclick="openReassignFoodModal('${order.order_id}')" class="p-1 rounded-lg border border-[#DADCE0] hover:bg-white text-[#5c5f60]" title="Reassign Cook">
                                <span class="material-symbols-outlined text-sm">swap_horiz</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.warn('[Dash Food Queue Load Note]:', err.message);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-xs text-amber-800">Kitchen queue updated.</td></tr>';
        }
    }
}
window.loadDashboardFoodQueue = loadDashboardFoodQueue;

async function updateFoodOrderStatus(orderId, status) {
    try {
        showToast(`Updating kitchen order status to ${status}...`, 'info');
        const res = await fetch(`/api/food/orders/${orderId}/status`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Order marked ${status}!`, 'success');
            loadDashboardFoodQueue();
            if (typeof loadFoodDeptAdmin === 'function') loadFoodDeptAdmin();
        } else {
            throw new Error(data.error || 'Failed to update order status');
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}
window.updateFoodOrderStatus = updateFoodOrderStatus;


// ============================================================
// COMPLETE FOOD DEPARTMENT ORDER DETAILS & MODAL (LPQ FOOD)
// ============================================================
let currentFoodOrdersCache = [];

function openFoodOrderDetailModal(orderId) {
    const modal = document.getElementById('modal-food-order-details');
    if (!modal) return;

    const order = currentFoodOrdersCache.find(o => o.order_id === orderId) ||
        (foodOrdersCache || []).find(o => o.order_id === orderId);
    if (!order) {
        showToast('Order details not found.', 'warning');
        return;
    }

    const shortId = (order.order_id || '').replace(/^order_/, '').slice(0, 8);
    document.getElementById('modal-fod-order-id').textContent = '#' + shortId.toUpperCase() + ' (' + order.order_id + ')';
    document.getElementById('modal-fod-customer-name').textContent = order.customer_name || 'Hostel Student';
    document.getElementById('modal-fod-customer-contact').textContent = '📱 ' + (order.customer_phone || 'No phone') + (order.customer_email ? ' • ' + order.customer_email : '');
    document.getElementById('modal-fod-hostel-room').textContent = '🏢 ' + (order.delivery_address || 'Hostel');
    document.getElementById('modal-fod-datetime').textContent = order.order_time_formatted || new Date(order.created_at || Date.now()).toLocaleString('en-IN');

    const payBadge = document.getElementById('modal-fod-payment-badge');
    if (payBadge) {
        const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
        payBadge.textContent = (order.payment_method || 'Cash on Delivery') + (isPaid ? ' (PAID)' : ' (Pending)');
        payBadge.className = isPaid ? 'font-black text-emerald-700' : 'font-bold text-amber-700';
    }

    const instrEl = document.getElementById('modal-fod-instructions');
    if (instrEl) {
        instrEl.textContent = (order.special_instructions && order.special_instructions !== 'None')
            ? '"' + order.special_instructions + '"'
            : 'None (Standard Preparation)';
    }

    const statusBadge = document.getElementById('modal-fod-status-badge');
    if (statusBadge) {
        statusBadge.textContent = order.status || 'Order Placed';
    }

    const cookEl = document.getElementById('modal-fod-assigned-cook');
    if (cookEl) {
        cookEl.textContent = '👨‍🍳 ' + (order.cook_name || 'Unassigned Chef');
    }

    // Render Items Table
    const tbody = document.getElementById('modal-fod-items-tbody');
    if (tbody) {
        const items = Array.isArray(order.food_items) ? order.food_items : [];
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-3 text-center text-gray-400">Fresh Food Item</td></tr>';
        } else {
            tbody.innerHTML = items.map(item => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price || 0);
                const lineTotal = item.line_total !== undefined ? item.line_total : (qty * price);
                return `
                    <tr class="hover:bg-gray-50/80">
                        <td class="p-2.5 font-bold text-[#181c1f]">${escapeHtml(item.name || "Quick's Instant Food")}</td>
                        <td class="p-2.5 text-center font-bold text-gray-700">×${qty}</td>
                        <td class="p-2.5 text-right font-medium text-gray-600">₹${price}</td>
                        <td class="p-2.5 text-right font-black text-[#181c1f]">₹${lineTotal}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    const totalEl = document.getElementById('modal-fod-total-amount');
    if (totalEl) totalEl.textContent = '₹' + (order.total_amount || order.total || 0);

    // Actions Bar
    const actionsBar = document.getElementById('modal-fod-actions-bar');
    if (actionsBar) {
        const st = (order.status || '').toLowerCase();
        let btns = '';

        if (st === 'order placed' || st === 'new') {
            btns += `
                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Accepted'); closeFoodOrderDetailModal();" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">check</span> Accept
                </button>
                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Rejected'); closeFoodOrderDetailModal();" class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">close</span> Reject
                </button>
            `;
        } else if (st === 'accepted') {
            btns += `
                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Preparing'); closeFoodOrderDetailModal();" class="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">cooking</span> Start Cooking
                </button>
            `;
        } else if (st.includes('prep') || st.includes('cook')) {
            btns += `
                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Ready'); closeFoodOrderDetailModal();" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">done_all</span> Mark Ready
                </button>
            `;
        } else if (st.includes('ready')) {
            btns += `
                <button type="button" onclick="updateFoodOrderStatus('${order.order_id}', 'Completed'); closeFoodOrderDetailModal();" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">verified</span> Mark Completed
                </button>
            `;
        }

        btns += `
            <button type="button" onclick="closeFoodOrderDetailModal(); openReassignFoodModal('${order.order_id}');" class="px-2.5 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-sm">swap_horiz</span> Reassign Cook
            </button>
        `;
        actionsBar.innerHTML = btns;
    }

    modal.classList.remove('hidden');
}
window.openFoodOrderDetailModal = openFoodOrderDetailModal;

function closeFoodOrderDetailModal() {
    const modal = document.getElementById('modal-food-order-details');
    if (modal) modal.classList.add('hidden');
}
window.closeFoodOrderDetailModal = closeFoodOrderDetailModal;

// Override renderFoodOrdersAdmin to show all 10 required items with receipt links
function renderFoodOrdersAdmin(orders) {
    const tbody = document.getElementById('food-orders-admin-tbody');
    if (!tbody) return;

    currentFoodOrdersCache = orders || [];

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-[#5c5f60]">
                    <span class="text-2xl block mb-1">🍳</span>
                    <p class="font-bold text-xs text-[#181c1f]">No food orders in the queue</p>
                    <p class="text-[11px] text-[#5c5f60]">Orders for Quick's Instant Food will automatically appear here with real-time assignment.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const shortId = (order.order_id || '').replace(/^order_/, '').slice(0, 8);
        const items = Array.isArray(order.food_items) ? order.food_items : [];
        const itemsDetail = items.map(i => `${i.name || "Quick's Instant Food"} (×${i.quantity || 1} @ ₹${i.price || 0})`).join(', ') || "Quick's Instant Food";
        const hasInstructions = order.special_instructions && order.special_instructions !== 'None';
        const formattedDate = order.order_time_formatted || (order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--');

        let statusClass = 'bg-amber-100 text-amber-800 border-amber-300';
        const st = (order.status || '').toLowerCase();
        if (st.includes('prep') || st.includes('cook')) statusClass = 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse';
        else if (st.includes('ready')) statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        else if (st.includes('complete') || st.includes('deliver')) statusClass = 'bg-blue-100 text-blue-800 border-blue-300';
        else if (st.includes('reject') || st.includes('cancel')) statusClass = 'bg-rose-100 text-rose-800 border-rose-300';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3 font-mono font-bold text-[#181c1f]">
                    <button type="button" onclick="openFoodOrderDetailModal('${order.order_id}')" class="text-blue-600 hover:underline flex items-center gap-1 font-mono cursor-pointer" title="Click to view full receipt details">
                        #${shortId}
                        <span class="material-symbols-outlined text-[13px]">receipt_long</span>
                    </button>
                    <span class="text-[10px] text-gray-500 block">${formattedDate}</span>
                </td>
                <td class="p-3">
                    <p class="font-bold text-[#181c1f] text-xs">${escapeHtml(order.customer_name || 'Student')}</p>
                    <p class="text-[11px] text-[#5c5f60] font-mono">${escapeHtml(order.customer_phone || '')}</p>
                </td>
                <td class="p-3 text-xs">
                    <span class="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                        🏢 ${escapeHtml(order.delivery_address || 'Hostel')}
                    </span>
                    ${order.room_number ? `<span class="text-[10px] text-gray-500 block mt-0.5">Room ${escapeHtml(order.room_number)}</span>` : ''}
                </td>
                <td class="p-3 text-xs max-w-xs">
                    <p class="font-bold text-[#181c1f] truncate" title="${escapeHtml(itemsDetail)}">🍲 ${escapeHtml(itemsDetail)}</p>
                    ${hasInstructions ? `<p class="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 truncate" title="Special Instructions: ${escapeHtml(order.special_instructions)}">📝 ${escapeHtml(order.special_instructions)}</p>` : ''}
                </td>
                <td class="p-3 font-mono text-xs">
                    <span class="font-black text-[#181c1f]">₹${order.total_amount || order.total || 0}</span>
                    <span class="text-[9px] block text-gray-500">${escapeHtml(order.payment_method || 'COD')}</span>
                </td>
                <td class="p-3 font-semibold text-xs text-amber-900">
                    👨‍🍳 ${escapeHtml(order.cook_name || 'Unassigned')}
                </td>
                <td class="p-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusClass}">
                        ${escapeHtml(order.status || 'Order Placed')}
                    </span>
                </td>
                <td class="p-3 text-right">
                    <div class="flex items-center gap-1 justify-end">
                        <button type="button" onclick="openFoodOrderDetailModal('${order.order_id}')" class="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1" title="View complete details">
                            <span>Details</span>
                        </button>
                        <button type="button" onclick="openReassignFoodModal('${order.order_id}')" class="p-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer" title="Reassign Cook">
                            <span class="material-symbols-outlined text-sm">swap_horiz</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
window.renderFoodOrdersAdmin = renderFoodOrdersAdmin;


// ============================================================
// FOOD DEPARTMENT & QUICK'S INSTANT FOOD ORDER DIFFERENTIATION
// ============================================================
function isOrderFoodDept(o) {
    if (!o) return false;
    if (o.is_food_order === true || o.is_food_order === 'true') return true;
    if (Number(o.estimated_delivery_mins) === 11) return true;
    if (o.cook_id || o.cook_name) return true;
    const rawAddr = (o.delivery_address || '').toLowerCase();
    if (rawAddr.includes('kitchen') || rawAddr.includes("quick's instant food")) return true;
    const summary = (o.item_summary || o.item_names || '').toLowerCase();
    if (/maggi|magiee|noodle|cooked meal|hot meal|pazzta|passta|thali|paratha|sandwich|fresh pasta|fresh burger|quick's instant food|quicks instant food/i.test(summary)) return true;
    const items = o.items || o.order_items || o.food_items || [];
    if (Array.isArray(items) && items.some(it => {
        const c = (it.category || '').toLowerCase();
        const sc = (it.subcategory || '').toLowerCase();
        const n = (it.name || it.product_name || '').toLowerCase();
        return c.includes('instant food') || sc.includes('instant food') || sc.includes('maggi') || sc.includes('magiee') || sc.includes('cook') || /maggi|magiee|cooked meal|pazzta|passta|thali/i.test(n) || c === "quick's instant food";
    })) return true;
    if (typeof foodOrdersCache !== 'undefined' && Array.isArray(foodOrdersCache)) {
        if (foodOrdersCache.some(fo => fo.order_id === o.id || fo.order_id === o.id?.replace(/^order_/, ''))) return true;
    }
    return false;
}
window.isOrderFoodDept = isOrderFoodDept;


let foodProductsCache = [];
let foodOrdersFilterActive = 'all';

async function fetchFoodDeptProducts() {
    try {
        const targetHostel = (typeof getActiveLockHostel === 'function' ? getActiveLockHostel() : null) || 'BH-13';
        const res = await fetch('/api/food/products?hostel_id=' + encodeURIComponent(targetHostel), { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.products) && data.products.length > 0) {
                foodProductsCache = data.products;
                renderFoodDeptProducts(foodProductsCache);
                return;
            }
        }
    } catch (e) {
        console.warn('[Fetch Food Products API Notice]:', e.message);
    }

    // Fallback: Filter from existing productsCache or fetch /api/products
    let list = Array.isArray(productsCache) ? productsCache : [];
    if (list.length === 0) {
        try {
            const pRes = await fetch('/api/products?includeInactive=true', { headers: getAuthHeaders() });
            if (pRes.ok) {
                const pData = await pRes.json();
                list = pData.products || [];
            }
        } catch (e) { }
    }

    if (list.length > 0) {
        foodProductsCache = list.filter(p => {
            if (p.deleted) return false;
            const c = (p.category || '').toLowerCase();
            const sc = (p.subcategory || '').toLowerCase();
            const n = (p.name || '').toLowerCase();
            if (c.includes('instant snacks') || sc.includes('instant snacks') || c.includes('snacks & munchies')) return false;
            return c.includes('food') || sc.includes('food') || sc.includes('maggi') || sc.includes('magiee') || sc.includes('cook') || /maggi|magiee|cooked meal|pazzta|passta|instant food/i.test(n) || c === "quick's instant food";
        });
        renderFoodDeptProducts(foodProductsCache);
    } else {
        renderFoodDeptProducts([]);
    }
}

function renderFoodDeptProducts(products) {
    const tbody = document.getElementById('food-products-tbody');
    const badge = document.getElementById('food-stock-total-badge');
    if (badge) badge.textContent = `${products.length} Products`;
    if (!tbody) return;

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-[#5c5f60]">
                    <div class="max-w-xs mx-auto space-y-2">
                        <span class="material-symbols-outlined text-4xl text-amber-300">ramen_dining</span>
                        <p class="font-bold text-[#181c1f]">No Quick's Instant Food items found</p>
                        <p class="text-xs text-gray-500">Add freshly prepared meals, noodles, or hot snacks to this category.</p>
                        <button type="button" onclick="openProductModalForFood()" class="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90">
                            + Add First Food Item
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : (p.in_stock ? (p.stock_left || 0) : 0);
        const isOutOfStock = !p.in_stock || stock <= 0;
        const isLowStock = stock > 0 && stock <= 4;

        let statusBadge = '';
        if (isOutOfStock) {
            statusBadge = `<button type="button" onclick="toggleFoodItemStock('${p.id}', true)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 cursor-pointer" title="Click to make In Stock">Out of Stock</button>`;
        } else if (isLowStock) {
            statusBadge = `<button type="button" onclick="toggleFoodItemStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 cursor-pointer" title="Click to mark Out of Stock">Low Stock (${stock} left)</button>`;
        } else {
            statusBadge = `<button type="button" onclick="toggleFoodItemStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 cursor-pointer" title="Click to mark Out of Stock">In Stock (${stock} left)</button>`;
        }

        const sellingPrice = Number(p.price) || 0;
        const mrp = Number(p.mrp || p.price) || sellingPrice;

        return `
            <tr class="hover:bg-amber-50/40 transition-colors">
                <td class="p-3.5">
                    <div class="flex items-center gap-3">
                        <img src="${p.image_url}" class="w-10 h-10 rounded-xl object-cover border border-[#DADCE0] bg-[#f1f4f7]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-bold text-xs text-[#181c1f]">${escapeHtml(p.name)}</p>
                            <p class="text-[10px] text-[#5c5f60] flex items-center gap-1.5 flex-wrap">
                                <span>${escapeHtml(p.unit || 'piece')} ${p.size ? '• ' + escapeHtml(p.size) : ''}</span>
                                <span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">${escapeHtml(p.hostel_id || 'BH-13')}</span>
                            </p>
                        </div>
                    </div>
                </td>
                <td class="p-3.5">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        ${escapeHtml(p.subcategory || "Quick's Instant Food")}
                    </span>
                </td>
                <td class="p-3.5 font-bold text-[#181c1f]">₹${sellingPrice.toFixed(2)}</td>
                <td class="p-3.5 text-[#74777a] line-through">₹${mrp.toFixed(2)}</td>
                <td class="p-3.5">
                    <div class="inline-flex items-center gap-1.5 bg-white border border-[#DADCE0] rounded-xl px-2 py-1 shadow-2xs">
                        <button type="button" onclick="updateFoodItemStock('${p.id}', ${stock - 1})" class="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs cursor-pointer active:scale-95">−</button>
                        <button type="button" onclick="promptCustomStock('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${stock})" class="font-bold text-xs text-[#181c1f] px-1 hover:text-amber-700 cursor-pointer" title="Click to enter exact stock">${stock}</button>
                        <button type="button" onclick="updateFoodItemStock('${p.id}', ${stock + 1})" class="w-6 h-6 flex items-center justify-center rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs cursor-pointer active:scale-95">+</button>
                    </div>
                </td>
                <td class="p-3.5">${statusBadge}</td>
                <td class="p-3.5 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button type="button" onclick="editProduct('${p.id}')" class="p-1.5 text-amber-800 hover:bg-amber-100 rounded-lg transition-all cursor-pointer" title="Edit Food Item">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}
window.renderFoodDeptProducts = renderFoodDeptProducts;

function filterFoodDeptProducts() {
    const q = (document.getElementById('food-products-search-input')?.value || '').toLowerCase().trim();
    const status = document.getElementById('food-products-filter-status')?.value || 'all';

    let filtered = foodProductsCache.filter(p => {
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchSub = (p.subcategory || '').toLowerCase().includes(q);
        if (q && !matchName && !matchSub) return false;

        const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : (p.in_stock ? (p.stock_left || 0) : 0);
        if (status === 'in_stock') return p.in_stock && stock > 0;
        if (status === 'low_stock') return stock > 0 && stock <= 4;
        if (status === 'out_of_stock') return !p.in_stock || stock === 0;
        return true;
    });

    renderFoodDeptProducts(filtered);
}
window.filterFoodDeptProducts = filterFoodDeptProducts;

async function updateFoodItemStock(productId, newStock) {
    const safeStock = Math.max(0, Number(newStock) || 0);
    try {
        const res = await fetch(`/api/food/products/${productId}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ stock_left: safeStock, in_stock: safeStock > 0 })
        });
        const data = await res.json();
        if (data.success) {
            const p = foodProductsCache.find(x => x.id === productId);
            if (p) {
                p.stock_left = safeStock;
                p.in_stock = safeStock > 0;
            }
            const pGlob = (typeof productsCache !== 'undefined') ? productsCache.find(x => x.id === productId) : null;
            if (pGlob) {
                pGlob.stock_left = safeStock;
                pGlob.in_stock = safeStock > 0;
            }
            renderFoodDeptProducts(foodProductsCache);
            showToast(`Stock updated to ${safeStock}`, 'success');
        } else {
            throw new Error(data.error || 'Failed to update stock');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}
window.updateFoodItemStock = updateFoodItemStock;

async function toggleFoodItemStock(productId, setInStock) {
    const targetStock = setInStock ? 5 : 0;
    await updateFoodItemStock(productId, targetStock);
}
window.toggleFoodItemStock = toggleFoodItemStock;

function filterFoodOrdersByStatus(status) {
    foodOrdersFilterActive = status;
    document.querySelectorAll('.food-order-filter-btn').forEach(btn => {
        const active = btn.dataset.status === status;
        if (active) {
            btn.className = 'food-order-filter-btn px-3 py-1 rounded-full text-xs font-bold bg-[#3c4043] text-white cursor-pointer';
        } else {
            btn.className = 'food-order-filter-btn px-3 py-1 rounded-full text-xs font-semibold border border-[#DADCE0] text-[#5c5f60] hover:bg-amber-50 hover:text-amber-900 cursor-pointer';
        }
    });
    renderFoodOrdersAdmin(foodOrdersCache);
}
window.filterFoodOrdersByStatus = filterFoodOrdersByStatus;

async function updateFoodOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/food/orders/${orderId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Order #${orderId.slice(0, 8)} status: ${newStatus}`, 'success');
            await loadFoodDeptAdmin();
            if (typeof filterOrders === 'function') filterOrders();
        } else {
            throw new Error(data.error || 'Failed to update status');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
}
window.updateFoodOrderStatus = updateFoodOrderStatus;


async function terminateAllAdminSessions() {
    if (!confirm('⚠️ FORCE LOGOUT: Are you sure you want to terminate ALL active admin sessions across all devices?\n\nAll logged-in staff members and managers will be immediately signed out and required to re-enter their passwords.')) {
        return;
    }

    try {
        const res = await fetchWithTimeout('/api/admin/terminate-all-sessions', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            if (data.new_token) {
                adminToken = data.new_token;
                localStorage.setItem('lpuquick_admin_token', adminToken);
                sessionStorage.setItem('lpuquick_admin_token', adminToken);
            }
            showToast('✅ All administrator sessions have been successfully terminated!', 'success');
        } else {
            alert('Failed to terminate sessions: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error terminating sessions: ' + err.message);
    }
}
window.terminateAllAdminSessions = terminateAllAdminSessions;


// ============================================================
// AUDIT LOGS & IP SECURITY LOGIC
// ============================================================
let _cachedAuditLogs = [];
let _cachedBlockedIps = [];

async function loadAuditLogs() {
    const tbody = document.getElementById('audit-logs-table-body');
    const totalStat = document.getElementById('audit-stat-total');
    if (!tbody) return;

    try {
        const res = await fetchWithTimeout('/api/admin/audit-logs?limit=250', {
            headers: getAuthHeaders()
        }, 12000);

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
            _cachedAuditLogs = data.logs;
            if (totalStat) totalStat.textContent = String(data.count || data.logs.length);
            renderAuditLogsTable(_cachedAuditLogs);
        }
    } catch (err) {
        console.warn('[loadAuditLogs Error]:', err);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-rose-500 font-bold">Failed to load live audit trail. ' + (err.message || '') + '</td></tr>';
        }
    }
}
window.loadAuditLogs = loadAuditLogs;

function renderAuditLogsTable(logs) {
    const tbody = document.getElementById('audit-logs-table-body');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-slate-400 font-medium">No audit events found matching criteria.</td></tr>';
        return;
    }

    const actionColors = {
        'HOSTEL_CLOSED': 'bg-rose-100 text-rose-800 border-rose-300',
        'HOSTEL_OPENED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
        'HOSTEL': 'bg-amber-100 text-amber-800 border-amber-300',
        'PRODUCT': 'bg-emerald-100 text-emerald-800 border-emerald-300',
        'STOCK': 'bg-amber-100 text-amber-800 border-amber-300',
        'ORDER': 'bg-blue-100 text-blue-800 border-blue-300',
        'LOGIN': 'bg-purple-100 text-purple-800 border-purple-300',
        'IP': 'bg-rose-100 text-rose-800 border-rose-300',
        'TERMINATE': 'bg-red-100 text-red-800 border-red-300',
        'LOCK': 'bg-orange-100 text-orange-800 border-orange-300',
        'STAFF': 'bg-indigo-100 text-indigo-800 border-indigo-300',
        'PAGE_VIEW': 'bg-slate-100 text-slate-700 border-slate-300'
    };

    function getActionClass(action) {
        const act = (action || '').toUpperCase();
        for (const [key, cls] of Object.entries(actionColors)) {
            if (act.includes(key)) return cls;
        }
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }

    tbody.innerHTML = logs.map(l => {
        const timeStr = l.created_at ? new Date(l.created_at).toLocaleString('en-IN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        }) : 'Recent';

        const meta = l.metadata || {};
        const ip = meta.ip || 'N/A';
        const adminName = meta.admin_name || l.admin_id || 'Admin';
        const adminEmail = meta.admin_email ? '(' + meta.admin_email + ')' : '';
        const badgeClass = getActionClass(l.action);
        const reason = l.reason || l.action || 'Administrative action';

        const targetHostel = meta.target_hostel || meta.hostel_id || (l.action && l.action.includes('HOSTEL') ? (reason.match(/hostel[:\s]+([A-Za-z0-9\-_]+)/i)?.[1] || null) : null);
        const isClosedHostel = l.action === 'HOSTEL_CLOSED' || reason.toLowerCase().includes('closed hostel');
        const isOpenedHostel = l.action === 'HOSTEL_OPENED' || reason.toLowerCase().includes('opened hostel');

        const hostelBadge = targetHostel ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${isClosedHostel ? 'bg-rose-50 text-rose-700 border border-rose-200' : (isOpenedHostel ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200')} shrink-0">
                <span class="material-symbols-outlined text-[11px]">${isClosedHostel ? 'lock' : (isOpenedHostel ? 'lock_open' : 'domain')}</span>
                <span>Hostel: ${escapeHtml(targetHostel)}</span>
            </span>
        ` : '';

        const blockButton = (ip && ip !== 'N/A' && ip !== '127.0.0.1' && ip !== 'localhost') ? `
            <button onclick="openIpBlockModal('${ip}')" class="px-2.5 py-1 text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer ml-auto" title="Block IP ${ip}">
                <span class="material-symbols-outlined text-[13px]">block</span>
                <span>Block IP</span>
            </button>
        ` : `
            <span class="text-[10px] text-slate-400 font-bold ml-auto">Local / Direct</span>
        `;

        return `
            <tr class="hover:bg-slate-50/70 transition-colors">
                <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${timeStr}</td>
                <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                            ${adminName.charAt(0).toUpperCase()}
                        </div>
                        <div class="min-w-0">
                            <span class="font-bold text-[#181c1f] block truncate">${escapeHtml(adminName)}</span>
                            <span class="text-[10px] text-slate-400 block truncate">${escapeHtml(adminEmail)}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass} whitespace-nowrap inline-flex items-center gap-1">
                        ${isClosedHostel ? '<span class="material-symbols-outlined text-[12px]">lock</span>' : (isOpenedHostel ? '<span class="material-symbols-outlined text-[12px]">lock_open</span>' : '')}
                        ${escapeHtml(l.action || 'ACTION')}
                    </span>
                </td>
                <td class="py-3 px-4 text-[#181c1f] max-w-sm">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        ${hostelBadge}
                        <span class="font-semibold text-xs text-[#181c1f] break-all">${escapeHtml(reason)}</span>
                    </div>
                </td>
                <td class="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                    ${escapeHtml(ip)}
                </td>
                <td class="py-3 px-4 text-right whitespace-nowrap">
                    ${blockButton}
                </td>
            </tr>
        `;
    }).join('');
}

function filterAuditLogs() {
    const search = (document.getElementById('audit-log-search')?.value || '').toLowerCase().trim();
    const filter = (document.getElementById('audit-action-filter')?.value || 'ALL').toUpperCase();

    let filtered = _cachedAuditLogs;
    if (filter !== 'ALL') {
        filtered = filtered.filter(l => (l.action || '').toUpperCase().includes(filter));
    }
    if (search) {
        filtered = filtered.filter(l => {
            const act = (l.action || '').toLowerCase();
            const reason = (l.reason || '').toLowerCase();
            const admin = (l.admin_id || '').toLowerCase();
            const metaStr = l.metadata ? JSON.stringify(l.metadata).toLowerCase() : '';
            return act.includes(search) || reason.includes(search) || admin.includes(search) || metaStr.includes(search);
        });
    }
    renderAuditLogsTable(filtered);
}
window.filterAuditLogs = filterAuditLogs;

async function loadBlockedIps() {
    const tbody = document.getElementById('blocked-ips-table-body');
    const badge = document.getElementById('blocked-ips-badge');
    const statBlocked = document.getElementById('audit-stat-blocked-ips');
    if (!tbody) return;

    try {
        const res = await fetchWithTimeout('/api/admin/ip-blocks', {
            headers: getAuthHeaders()
        }, 8000);

        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data.success && Array.isArray(data.blocked_ips)) {
            _cachedBlockedIps = data.blocked_ips;
            const count = data.count || data.blocked_ips.length;
            if (badge) badge.textContent = count + ' IPs';
            if (statBlocked) statStatBlocked(count);
            renderBlockedIpsTable(_cachedBlockedIps);
        }
    } catch (err) {
        console.warn('[loadBlockedIps Error]:', err);
    }
}
window.loadBlockedIps = loadBlockedIps;

function statStatBlocked(count) {
    const el = document.getElementById('audit-stat-blocked-ips');
    if (el) el.textContent = String(count);
}

function renderBlockedIpsTable(ips) {
    const tbody = document.getElementById('blocked-ips-table-body');
    if (!tbody) return;

    if (!ips || ips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400 font-medium">No IPs currently blocked. All campus network access open.</td></tr>';
        return;
    }

    tbody.innerHTML = ips.map(entry => {
        const dateStr = entry.blocked_at ? new Date(entry.blocked_at).toLocaleString('en-IN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Recent';

        const customMsg = entry.message ? `"${escapeHtml(entry.message)}"` : '<span class="italic text-slate-400">(Blank empty screen)</span>';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-4 font-mono font-bold text-rose-600">${escapeHtml(entry.ip)}</td>
                <td class="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">${dateStr}</td>
                <td class="py-3 px-4 font-medium text-slate-700">${escapeHtml(entry.reason || 'Manual block')}</td>
                <td class="py-3 px-4 text-slate-600 font-mono text-[11px]">${customMsg}</td>
                <td class="py-3 px-4 text-slate-500">${escapeHtml(entry.blocked_by || 'Admin')}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="unblockIpAddress('${entry.ip}')" class="px-3 py-1 text-xs font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition-all cursor-pointer">
                        Unblock
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openIpBlockModal(targetIp = '') {
    const modal = document.getElementById('modal-block-ip');
    const input = document.getElementById('block-ip-input');
    const reason = document.getElementById('block-ip-reason');
    const message = document.getElementById('block-ip-message');
    if (!modal) return;

    if (input) input.value = targetIp || '';
    if (reason) reason.value = '';
    if (message) message.value = '';

    modal.classList.remove('hidden');
    if (input) input.focus();
}
window.openIpBlockModal = openIpBlockModal;

function closeIpBlockModal() {
    const modal = document.getElementById('modal-block-ip');
    if (modal) modal.classList.add('hidden');
}
window.closeIpBlockModal = closeIpBlockModal;

async function handleBlockIpSubmit(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('block-ip-input');
    const reason = document.getElementById('block-ip-reason');
    const message = document.getElementById('block-ip-message');
    const submitBtn = document.getElementById('block-ip-submit-btn');

    const ip = (input?.value || '').trim();
    if (!ip) {
        showToast('Please enter a valid IP address to block', 'warning');
        return;
    }

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Blocking...';
        }

        const res = await fetchWithTimeout('/api/admin/ip-block', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                ip,
                reason: (reason?.value || '').trim() || 'Blocked by administrator',
                message: (message?.value || '').trim()
            })
        }, 10000);

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to block IP');
        }

        showToast(`IP ${ip} has been blocked successfully!`, 'success');
        closeIpBlockModal();
        await loadBlockedIps();
        await loadAuditLogs();
    } catch (err) {
        showToast('IP Block Error: ' + err.message, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">block</span><span>Confirm Block IP</span>';
        }
    }
}
window.handleBlockIpSubmit = handleBlockIpSubmit;

async function unblockIpAddress(ip) {
    if (!ip) return;
    if (!confirm(`Are you sure you want to UNBLOCK IP ${ip}?`)) return;

    try {
        const res = await fetchWithTimeout(`/api/admin/ip-block/${encodeURIComponent(ip)}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }, 8000);

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to unblock IP');
        }

        showToast(`IP ${ip} unblocked successfully!`, 'success');
        await loadBlockedIps();
        await loadAuditLogs();
    } catch (err) {
        showToast('Unblock Error: ' + err.message, 'error');
    }
}
window.unblockIpAddress = unblockIpAddress;


// ============================================================
// SELECTED HOSTEL OVERVIEW CONTROLLER (360° INTELLIGENCE)
// ============================================================
let _selectedHostelIds = ['ALL'];
let _hostelOverviewRange = 'all';
let _isMultiHostelMode = false;
let _cachedHostelOverview = null;

function populateHostelOverviewSelectors() {
    const select = document.getElementById('ho-hostel-select');
    const multiContainer = document.getElementById('ho-multi-checkboxes-container');
    const hostels = (typeof hostelsCache !== 'undefined' && Array.isArray(hostelsCache) && hostelsCache.length > 0)
        ? hostelsCache
        : [];

    if (select && select.children.length <= 1 && hostels.length > 0) {
        select.innerHTML = '<option value="ALL">🏢 All Hostels (All-Campus Aggregate)</option>' +
            hostels.map(h => `<option value="${h.id}">${escapeHtml(h.name || h.id)} (${h.id})</option>`).join('');
        if (_selectedHostelIds.length === 1 && _selectedHostelIds[0] !== 'ALL') {
            select.value = _selectedHostelIds[0];
        }
    }

    if (multiContainer && multiContainer.children.length === 0 && hostels.length > 0) {
        multiContainer.innerHTML = hostels.map(h => {
            const isChecked = _selectedHostelIds.includes(h.id);
            return `
                <label class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isChecked ? 'bg-blue-50 text-[#0066cc] border-blue-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}">
                    <input type="checkbox" value="${h.id}" ${isChecked ? 'checked' : ''} onchange="onMultiHostelCheckboxChange(this)" class="rounded text-[#0066cc] focus:ring-0 cursor-pointer">
                    <span>${escapeHtml(h.id)}</span>
                </label>
            `;
        }).join('');
    }
}
window.populateHostelOverviewSelectors = populateHostelOverviewSelectors;

async function loadHostelOverview(forceRefresh = false) {
    if (!isPlatformOwner()) {
        showToast('Access restricted: Selected Hostel Overview is restricted to Platform Owner', 'error');
        switchView('dashboard');
        return;
    }

    const lockedCard = document.getElementById('ho-locked-card');
    const contentContainer = document.getElementById('ho-content-container');
    const pinBtn = document.getElementById('ho-btn-pin-toggle');
    const pinIcon = document.getElementById('ho-pin-icon');
    const pinText = document.getElementById('ho-pin-text');
    const refreshIcon = document.getElementById('ho-refresh-icon');

    // Update PIN status button display
    if (financialToken) {
        if (pinBtn) pinBtn.className = 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full px-3.5 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer';
        if (pinIcon) pinIcon.textContent = 'lock_open';
        if (pinText) pinText.textContent = 'PIN Unlocked';
    } else {
        if (pinBtn) pinBtn.className = 'bg-[#f1f4f7] hover:bg-[#e0e3e6] border border-[#DADCE0] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#3c4043] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer';
        if (pinIcon) pinIcon.textContent = 'lock';
        if (pinText) pinText.textContent = 'PIN Locked';
        if (lockedCard) lockedCard.classList.remove('hidden');
        if (contentContainer) contentContainer.classList.add('hidden');
        const input = document.getElementById('input-ho-pin');
        if (input) setTimeout(() => input.focus(), 150);
        return;
    }

    if (refreshIcon) refreshIcon.classList.add('animate-spin');

    try {
        if (typeof loadHostels === 'function' && (!hostelsCache || hostelsCache.length === 0)) {
            await loadHostels();
        }
        populateHostelOverviewSelectors();

        const hostelParam = _isMultiHostelMode 
            ? (_selectedHostelIds.length > 0 ? _selectedHostelIds.join(',') : 'ALL') 
            : (_selectedHostelIds[0] || 'ALL');

        const params = new URLSearchParams({
            hostel_id: hostelParam,
            range: _hostelOverviewRange
        });

        if (_hostelOverviewRange === 'custom') {
            const start = document.getElementById('ho-start-date')?.value;
            const end = document.getElementById('ho-end-date')?.value;
            if (start) params.append('start_date', start);
            if (end) params.append('end_date', end);
        }
        if (forceRefresh) params.append('_t', Date.now());

        const res = await fetchWithTimeout(`/api/admin/hostel-overview?${params.toString()}`, {
            headers: {
                ...getAuthHeaders(),
                ...(financialToken ? { 'X-Financial-Token': financialToken } : {})
            }
        });
        const data = await res.json();

        if (data.locked) {
            // Token expired or invalid
            financialToken = null;
            try { sessionStorage.removeItem('lpuquick_financial_token'); } catch (e) {}
            if (lockedCard) lockedCard.classList.remove('hidden');
            if (contentContainer) contentContainer.classList.add('hidden');
            if (pinIcon) pinIcon.textContent = 'lock';
            if (pinText) pinText.textContent = 'PIN Locked';
            showToast(data.message || 'Hostel Overview is locked. Please enter your Financial PIN.', 'warning');
            return;
        }

        if (data.success && data.summary) {
            _cachedHostelOverview = data;
            if (lockedCard) lockedCard.classList.add('hidden');
            if (contentContainer) contentContainer.classList.remove('hidden');
            renderHostelOverviewUI(data);
        } else {
            showToast(data.error || 'Failed to load hostel overview', 'error');
        }
    } catch (err) {
        console.error('[loadHostelOverview Error]:', err);
        showToast('Error loading hostel overview: ' + err.message, 'error');
    } finally {
        if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    }
}
window.loadHostelOverview = loadHostelOverview;

function renderHostelOverviewUI(data) {
    if (!data || !data.summary) return;
    const s = data.summary;
    const isAll = data.is_all_hostels;
    const selectedHostels = data.selected_hostels || [];

    // 1. Update Header & Summary Banner
    const labelEl = document.getElementById('ho-active-hostel-label');
    const bannerTitle = document.getElementById('ho-banner-title');
    const bannerSubtitle = document.getElementById('ho-banner-subtitle');
    const bannerLockBadge = document.getElementById('ho-banner-lock-badge');

    if (isAll) {
        if (labelEl) labelEl.textContent = 'All Campus Hostels';
        if (bannerTitle) bannerTitle.textContent = 'All Campus Hostels (Consolidated Dark Stores)';
        if (bannerSubtitle) bannerSubtitle.textContent = `Aggregating operational intelligence across all ${data.summary.hostels_breakdown?.length || 14} campus dark stores`;
        if (bannerLockBadge) {
            bannerLockBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0066cc] border border-blue-300';
            bannerLockBadge.textContent = 'MULTI-STORE ACTIVE';
        }
    } else if (selectedHostels.length === 1) {
        const hId = selectedHostels[0];
        const hDetail = s.hostel_details?.find(h => h.id === hId);
        const name = hDetail?.name || hId;
        if (labelEl) labelEl.textContent = hId;
        if (bannerTitle) bannerTitle.textContent = `${name} (${hId})`;
        if (bannerSubtitle) bannerSubtitle.textContent = `Dedicated 360° analytics and kitchen management for ${name}`;
        if (bannerLockBadge) {
            const isLocked = hDetail?.is_locked;
            bannerLockBadge.className = isLocked 
                ? 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300'
                : 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300';
            bannerLockBadge.textContent = isLocked ? 'STORE LOCKED / CLOSED' : 'STORE OPEN (ACCEPTING ORDERS)';
        }
    } else {
        if (labelEl) labelEl.textContent = `${selectedHostels.length} Hostels`;
        if (bannerTitle) bannerTitle.textContent = `Combined Overview (${selectedHostels.join(', ')})`;
        if (bannerSubtitle) bannerSubtitle.textContent = `Multi-hostel aggregate for: ${selectedHostels.join(', ')}`;
        if (bannerLockBadge) {
            bannerLockBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300';
            bannerLockBadge.textContent = `${selectedHostels.length} STORES COMBINED`;
        }
    }

    // 2. Executive KPI Cards
    const revEl = document.getElementById('ho-kpi-revenue');
    if (revEl) revEl.textContent = s.formatted_revenue || '₹0';
    const subtotalEl = document.getElementById('ho-kpi-subtotal');
    if (subtotalEl) subtotalEl.textContent = `₹${Math.round(s.subtotal || 0).toLocaleString('en-IN')}`;

    const profitEl = document.getElementById('ho-kpi-profit');
    if (profitEl) profitEl.textContent = s.formatted_profit || '₹0';
    const marginEl = document.getElementById('ho-kpi-margin');
    if (marginEl) marginEl.textContent = `${s.profit_margin_pct || 0}%`;

    const ordersEl = document.getElementById('ho-kpi-orders');
    if (ordersEl) ordersEl.textContent = String(s.total_orders || 0);
    const deliveredEl = document.getElementById('ho-kpi-delivered');
    if (deliveredEl) deliveredEl.textContent = `${s.delivered_orders || 0} Delivered`;
    const successRateEl = document.getElementById('ho-kpi-success-rate');
    if (successRateEl) successRateEl.textContent = `${s.delivery_success_rate || 0}%`;
    const activeCancelledEl = document.getElementById('ho-kpi-active-cancelled');
    if (activeCancelledEl) activeCancelledEl.textContent = `${s.active_orders || 0} active • ${s.cancelled_orders || 0} cancelled`;

    const aovEl = document.getElementById('ho-kpi-aov');
    if (aovEl) aovEl.textContent = s.formatted_aov || '₹0';
    const repeatRateEl = document.getElementById('ho-kpi-repeat-rate');
    if (repeatRateEl) repeatRateEl.textContent = `${s.customers?.repeat_rate_pct || 0}%`;
    const uniqueCustEl = document.getElementById('ho-kpi-unique-customers');
    if (uniqueCustEl) uniqueCustEl.textContent = `${s.customers?.unique_customers_count || 0} unique students`;

    const foodRevEl = document.getElementById('ho-kpi-food-revenue');
    if (foodRevEl) foodRevEl.textContent = s.food?.formatted_revenue || '₹0';
    const foodOrdersEl = document.getElementById('ho-kpi-food-orders');
    if (foodOrdersEl) foodOrdersEl.textContent = `${s.food?.orders_count || 0} Orders`;
    const foodShareEl = document.getElementById('ho-kpi-food-share');
    if (foodShareEl) foodShareEl.textContent = `${s.food?.pct_of_total_revenue || 0}% sales`;

    const instockEl = document.getElementById('ho-kpi-instock');
    if (instockEl) instockEl.textContent = `${s.inventory?.in_stock_count || 0} In Stock`;
    const lowstockEl = document.getElementById('ho-kpi-lowstock');
    if (lowstockEl) lowstockEl.textContent = `${s.inventory?.low_stock_count || 0} Low`;
    const outstockEl = document.getElementById('ho-kpi-outstock');
    if (outstockEl) outstockEl.textContent = `${s.inventory?.out_of_stock_count || 0} Out`;
    const totalSkusEl = document.getElementById('ho-kpi-total-skus');
    if (totalSkusEl) totalSkusEl.textContent = `${s.inventory?.total_products || 0} Total Dark Store SKUs`;

    // 3. Food Department & Kitchen Breakdown
    const foodPct = s.food?.pct_of_total_revenue || 0;
    const groceryPct = Math.max(0, 100 - foodPct);
    const splitLabel = document.getElementById('ho-food-split-label');
    if (splitLabel) splitLabel.textContent = `${foodPct}% Cooked Food (₹${Math.round(s.food?.revenue || 0).toLocaleString('en-IN')}) • ${groceryPct}% Supermarket`;
    const foodBar = document.getElementById('ho-food-split-bar');
    if (foodBar) foodBar.style.width = `${foodPct}%`;
    const groceryBar = document.getElementById('ho-grocery-split-bar');
    if (groceryBar) groceryBar.style.width = `${groceryPct}%`;

    // Top Food Table
    const topFoodBody = document.getElementById('ho-top-food-table-body');
    if (topFoodBody) {
        const topFood = s.food?.top_items || [];
        if (topFood.length === 0) {
            topFoodBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">No cooked food orders recorded for this period.</td></tr>';
        } else {
            topFoodBody.innerHTML = topFood.map(item => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-2.5 flex items-center gap-2">
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">Cooked</span>
                        <span class="font-bold text-[#181c1f] truncate">${escapeHtml(item.name)}</span>
                    </td>
                    <td class="py-2.5 text-center font-bold text-[#181c1f]">${item.quantity}</td>
                    <td class="py-2.5 text-right font-mono text-slate-500">₹${item.price}</td>
                    <td class="py-2.5 text-right font-bold text-amber-700">₹${Math.round(item.revenue).toLocaleString('en-IN')}</td>
                </tr>
            `).join('');
        }
    }

    // Cooks List
    const cooksList = document.getElementById('ho-cooks-list');
    if (cooksList) {
        const cooks = s.food?.assigned_cooks || [];
        if (cooks.length === 0) {
            cooksList.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No cooks currently assigned to this hostel.</p>';
        } else {
            cooksList.innerHTML = cooks.map(c => `
                <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex items-center gap-2 min-w-0">
                        <div class="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            🍳
                        </div>
                        <div class="min-w-0">
                            <span class="font-bold text-xs text-[#181c1f] block truncate">${escapeHtml(c.name)}</span>
                            <span class="text-[10px] text-slate-400 block truncate">${escapeHtml(c.phone || c.email)}</span>
                        </div>
                    </div>
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                        ${c.status}
                    </span>
                </div>
            `).join('');
        }
    }

    // 4. Critical Stock Alerts Table
    const critStockBody = document.getElementById('ho-critical-stock-table-body');
    if (critStockBody) {
        const critItems = s.inventory?.critical_items || [];
        if (critItems.length === 0) {
            critStockBody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-emerald-600 font-bold">✓ All dark store items have healthy stock levels!</td></tr>';
        } else {
            critStockBody.innerHTML = critItems.map(item => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-2 flex items-center gap-1.5">
                        ${item.is_food ? '<span class="text-xs">🍳</span>' : '<span class="text-xs text-slate-400">📦</span>'}
                        <span class="font-semibold text-xs text-[#181c1f] truncate">${escapeHtml(item.name)}</span>
                    </td>
                    <td class="py-2 text-center text-[10px] font-bold text-slate-500">${escapeHtml(item.hostel_id)}</td>
                    <td class="py-2 text-center">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${item.stock === 0 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}">
                            ${item.stock === 0 ? 'OUT OF STOCK' : `Only ${item.stock} left`}
                        </span>
                    </td>
                    <td class="py-2 text-right font-bold text-[#181c1f]">₹${item.price}</td>
                </tr>
            `).join('');
        }
    }

    // 5. Top Ordering Rooms
    const roomsList = document.getElementById('ho-top-rooms-list');
    if (roomsList) {
        const topRooms = s.customers?.top_rooms || [];
        if (topRooms.length === 0) {
            roomsList.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">No room orders recorded yet.</p>';
        } else {
            const maxCount = topRooms[0]?.count || 1;
            roomsList.innerHTML = topRooms.map((r, idx) => {
                const pct = Math.round((r.count / maxCount) * 100);
                return `
                    <div class="flex items-center gap-2 text-xs">
                        <span class="w-6 text-[11px] font-bold text-slate-400">#${idx + 1}</span>
                        <span class="w-24 font-bold text-[#181c1f] truncate">Room ${escapeHtml(r.room)}</span>
                        <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div class="bg-purple-600 h-full rounded-full" style="width: ${pct}%"></div>
                        </div>
                        <span class="font-black text-purple-700 w-12 text-right">${r.count} ord</span>
                    </div>
                `;
            }).join('');
        }
    }

    // 6. Multi-Hostel Comparison Table
    const compBody = document.getElementById('ho-comparison-table-body');
    if (compBody) {
        const breakdown = s.hostels_breakdown || [];
        if (breakdown.length === 0) {
            compBody.innerHTML = '<tr><td colspan="9" class="py-6 text-center text-slate-400">No hostel comparison data available.</td></tr>';
        } else {
            compBody.innerHTML = breakdown.map(h => {
                const isSelected = selectedHostels.includes(h.id);
                return `
                    <tr class="hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/40 font-semibold' : ''}">
                        <td class="py-2.5 px-3">
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-xs text-[#181c1f]">${escapeHtml(h.name || h.id)}</span>
                                <span class="text-[10px] text-slate-400 font-mono">(${escapeHtml(h.id)})</span>
                            </div>
                        </td>
                        <td class="py-2.5 px-3 text-center">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${h.is_locked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
                                ${h.is_locked ? 'Locked' : 'Open'}
                            </span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-bold text-[#181c1f]">${h.total_orders}</td>
                        <td class="py-2.5 px-3 text-center text-emerald-700 font-bold">${h.delivered_orders}</td>
                        <td class="py-2.5 px-3 text-right font-black text-[#181c1f]">${h.formatted_revenue}</td>
                        <td class="py-2.5 px-3 text-right font-bold text-emerald-700">${h.formatted_profit}</td>
                        <td class="py-2.5 px-3 text-center font-bold text-amber-600">${h.food_orders}</td>
                        <td class="py-2.5 px-3 text-right font-bold text-amber-700">${h.formatted_food_revenue}</td>
                        <td class="py-2.5 px-3 text-center">
                            <button onclick="drillDownToSingleHostel('${h.id}')" class="px-2 py-0.5 text-[10px] font-bold text-[#0066cc] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-all cursor-pointer">
                                View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }
}
window.renderHostelOverviewUI = renderHostelOverviewUI;

function onHostelOverviewSelectorChange(val) {
    _selectedHostelIds = [val];
    loadHostelOverview();
}
window.onHostelOverviewSelectorChange = onHostelOverviewSelectorChange;

function setHostelOverviewRange(range) {
    _hostelOverviewRange = range;
    document.querySelectorAll('.ho-pill-btn').forEach(btn => {
        const isCurrent = btn.dataset.hoRange === range;
        btn.classList.toggle('active', isCurrent);
        btn.classList.toggle('bg-[#0066cc]', isCurrent);
        btn.classList.toggle('text-white', isCurrent);
        btn.classList.toggle('border-[#0066cc]', isCurrent);
        btn.classList.toggle('bg-[#f1f4f7]', !isCurrent);
        btn.classList.toggle('text-[#5c5f60]', !isCurrent);
        btn.classList.toggle('border-transparent', !isCurrent);
    });
    loadHostelOverview();
}
window.setHostelOverviewRange = setHostelOverviewRange;

function applyCustomHostelOverviewFilter() {
    _hostelOverviewRange = 'custom';
    loadHostelOverview();
}
window.applyCustomHostelOverviewFilter = applyCustomHostelOverviewFilter;

function toggleMultiHostelMode() {
    _isMultiHostelMode = !_isMultiHostelMode;
    const panel = document.getElementById('ho-multi-hostel-panel');
    const singleWrap = document.getElementById('ho-single-select-wrap');
    const toggleText = document.getElementById('ho-multi-toggle-text');
    if (panel) panel.classList.toggle('hidden', !_isMultiHostelMode);
    if (singleWrap) singleWrap.classList.toggle('hidden', _isMultiHostelMode);
    if (toggleText) toggleText.textContent = _isMultiHostelMode ? 'Single Hostel Mode' : 'Multi-Hostel Mode';

    if (_isMultiHostelMode) {
        populateHostelOverviewSelectors();
    } else {
        _selectedHostelIds = [document.getElementById('ho-hostel-select')?.value || 'ALL'];
    }
    loadHostelOverview();
}
window.toggleMultiHostelMode = toggleMultiHostelMode;

function onMultiHostelCheckboxChange(cb) {
    const checked = Array.from(document.querySelectorAll('#ho-multi-checkboxes-container input[type="checkbox"]:checked')).map(c => c.value);
    _selectedHostelIds = checked.length > 0 ? checked : ['ALL'];
    loadHostelOverview();
}
window.onMultiHostelCheckboxChange = onMultiHostelCheckboxChange;

function selectMultiHostelsPreset(preset) {
    const checkboxes = document.querySelectorAll('#ho-multi-checkboxes-container input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const val = cb.value.toUpperCase();
        if (preset === 'ALL') {
            cb.checked = true;
        } else if (preset === 'BH') {
            cb.checked = val.includes('BH') || val.startsWith('B');
        } else if (preset === 'GH') {
            cb.checked = val.includes('GH') || val.startsWith('G');
        } else if (preset === 'CLEAR') {
            cb.checked = false;
        }
    });
    const checked = Array.from(document.querySelectorAll('#ho-multi-checkboxes-container input[type="checkbox"]:checked')).map(c => c.value);
    _selectedHostelIds = checked.length > 0 ? checked : ['ALL'];
    loadHostelOverview();
}
window.selectMultiHostelsPreset = selectMultiHostelsPreset;

function drillDownToSingleHostel(hostelId) {
    if (_isMultiHostelMode) {
        toggleMultiHostelMode();
    }
    const sel = document.getElementById('ho-hostel-select');
    if (sel) sel.value = hostelId;
    _selectedHostelIds = [hostelId];
    loadHostelOverview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.drillDownToSingleHostel = drillDownToSingleHostel;


// PIN Security Handlers for Selected Hostel Overview
async function submitHostelOverviewPinUnlock(e) {
    if (e) e.preventDefault();
    const pinInput = document.getElementById('input-ho-pin');
    const pin = pinInput?.value?.trim();
    const err = document.getElementById('ho-pin-error');
    const btn = document.getElementById('btn-ho-unlock');

    if (!pin) {
        if (err) {
            err.textContent = 'Please enter your 4-6 digit Owner PIN';
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
            try { sessionStorage.setItem('lpuquick_financial_token', financialToken); } catch (e) {}
            if (err) err.classList.add('hidden');
            if (pinInput) pinInput.value = '';
            showToast('✓ Selected Hostel Overview unlocked successfully', 'success');
            checkFinancialStatus();
            loadHostelOverview(true);
        } else {
            if (err) {
                err.textContent = data.error || 'Incorrect PIN. Please try again.';
                err.classList.remove('hidden');
            }
        }
    } catch (err2) {
        if (err) {
            err.textContent = 'Connection error. Please try again.';
            err.classList.remove('hidden');
        }
    } finally {
        if (btn) btn.disabled = false;
    }
}
window.submitHostelOverviewPinUnlock = submitHostelOverviewPinUnlock;

function toggleHostelOverviewPinLock() {
    if (financialToken) {
        lockFinancialData();
        loadHostelOverview();
    } else {
        const input = document.getElementById('input-ho-pin');
        if (input) input.focus();
        else openFinancialUnlockModal();
    }
}
window.toggleHostelOverviewPinLock = toggleHostelOverviewPinLock;


// ============================================================
// CUSTOMER BROADCAST NOTIFICATION SYSTEM (SUPER ADMIN ONLY)
// ============================================================
window.broadcastState = {
    campaigns: [],
    stats: {},
    activeFilter: 'all',
    isLoading: false
};

const BROADCAST_TEMPLATES = {
    store_open: {
        title: "🟢 LPUQuick Store is Now Open! 🛒",
        body: "Your campus dark store is open for fast delivery. Order late-night snacks, chilled drinks & Maggi directly to your hostel room in 10 minutes!",
        category: "store_status",
        imageUrl: "/img/notif_store_open.gif",
        actionText: "ORDER NOW 🛒",
        actionUrl: "/#/"
    },
    store_close: {
        title: "🌙 Store Restocking · Reopening Soon",
        body: "LPUQuick dark store is currently restocking fresh snacks and daily essentials. You can still browse and add your favourites to cart!",
        category: "store_status",
        imageUrl: "/img/notif_store_open.gif",
        actionText: "BROWSE MENU",
        actionUrl: "/#/"
    },
    special_offer: {
        title: "⚡ Flash Sale: Flat 20% Off Tonight!",
        body: "Late night study hunger? Grab chips, beverages, chocolates & noodles at flat 20% off. Use promo code QUICK20 at checkout!",
        category: "special_offer",
        imageUrl: "/img/notif_near_room.gif",
        actionText: "CLAIM OFFER ⚡",
        actionUrl: "/#/"
    },
    festival: {
        title: "🪔 Happy Diwali! Special Festive Combos 🎉",
        body: "Wishing all campus hostellers joy, prosperity and good vibes! Special Diwali gift snack packs & festive treats now delivering in 10 mins.",
        category: "festival",
        imageUrl: "/img/notif_store_open.gif",
        actionText: "VIEW FESTIVE DROP",
        actionUrl: "/#/categories"
    },
    campus_notice: {
        title: "📢 Campus Hub Operational Update",
        body: "All delivery runner routes across campus hostels are running at peak speed today. Average delivery time: 8-10 minutes.",
        category: "announcement",
        imageUrl: "",
        actionText: "TRACK LIVE 📍",
        actionUrl: "/#/orders"
    }
};

async function loadBroadcastNotificationsData() {
    if (window.broadcastState.isLoading) return;
    window.broadcastState.isLoading = true;

    try {
        const token = getAdminAuthToken();
        const res = await fetch('/api/admin/broadcast-notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-admin-token': token
            }
        });

        if (res.status === 403) {
            showToast('Access Denied: Super Admin authorization required for broadcasts', 'error');
            switchView('dashboard');
            return;
        }

        const data = await res.json();
        if (!data.success) {
            showToast(data.error || 'Failed to fetch broadcast data', 'error');
            return;
        }

        window.broadcastState.campaigns = data.campaigns || [];
        window.broadcastState.stats = data.stats || {};

        renderBroadcastStats(data.stats);
        renderBroadcastHistoryTable();
        updateBroadcastLivePreview();

    } catch (err) {
        console.error('[Broadcast Load Error]:', err);
        showToast('Failed to connect to broadcast notification service', 'error');
    } finally {
        window.broadcastState.isLoading = false;
    }
}

function renderBroadcastStats(stats) {
    if (!stats) return;

    const subEl = document.getElementById('broadcast-stat-subscribers');
    const campEl = document.getElementById('broadcast-stat-total-campaigns');
    const delivEl = document.getElementById('broadcast-stat-delivered');
    const ctrEl = document.getElementById('broadcast-stat-ctr');
    const clicksEl = document.getElementById('broadcast-stat-clicks');

    if (subEl) subEl.textContent = Number(stats.totalSubscribers || 0).toLocaleString();
    if (campEl) campEl.textContent = Number(stats.totalCampaigns || 0).toLocaleString();
    if (delivEl) delivEl.textContent = Number(stats.totalDelivered || 0).toLocaleString();
    if (ctrEl) ctrEl.textContent = stats.clickThroughRate || '0.0%';
    if (clicksEl) clicksEl.textContent = Number(stats.totalClicks || 0).toLocaleString();

    // Update target count badge
    const hostelSelect = document.getElementById('broadcast-target-hostel');
    if (hostelSelect) onTargetHostelChange(hostelSelect);
}

function renderBroadcastHistoryTable() {
    const tbody = document.getElementById('broadcast-history-table-body');
    if (!tbody) return;

    const filter = window.broadcastState.activeFilter || 'all';
    let list = window.broadcastState.campaigns || [];

    if (filter !== 'all') {
        list = list.filter(c => c.category === filter);
    }

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-8 text-slate-400">
                    <span class="material-symbols-outlined text-3xl mb-1 text-slate-300">notifications_off</span>
                    <p class="text-xs">No broadcast campaigns found for this filter.</p>
                </td>
            </tr>
        `;
        return;
    }

    const categoryBadges = {
        store_status: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">🏪 Store Status</span>',
        special_offer: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">🏷️ Offer</span>',
        festival: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">🪔 Festive</span>',
        announcement: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">📣 Notice</span>',
        general: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">✨ General</span>'
    };

    const statusBadges = {
        sent: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Delivered</span>',
        scheduled: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🕒 Scheduled</span>',
        pending: '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">⏳ Sending</span>'
    };

    tbody.innerHTML = list.map(c => {
        const catBadge = categoryBadges[c.category] || categoryBadges.general;
        const statBadge = statusBadges[c.status] || statusBadges.sent;
        const targetLabel = c.targetHostelName || (c.targetHostel === 'all' ? 'All Hostels' : c.targetHostel);
        const timingStr = c.sentAt ? new Date(c.sentAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (c.scheduledAt ? `Scheduled: ${new Date(c.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Recent');

        const delivered = c.stats?.deliveredCount || 0;
        const total = c.stats?.sentCount || delivered;
        const clicks = c.stats?.clickedCount || 0;
        const ctr = delivered > 0 ? ((clicks / delivered) * 100).toFixed(1) + '%' : '0.0%';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3">
                    <div class="font-bold text-slate-900 line-clamp-1 max-w-[260px]">${escapeHtml(c.title)}</div>
                    <div class="text-[11px] text-slate-500 line-clamp-1 max-w-[280px]">${escapeHtml(c.body)}</div>
                </td>
                <td class="py-3 px-3 whitespace-nowrap">${catBadge}</td>
                <td class="py-3 px-3 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-800">
                        📍 ${escapeHtml(targetLabel)}
                    </span>
                </td>
                <td class="py-3 px-3 whitespace-nowrap text-slate-500 text-[11px]">${timingStr}</td>
                <td class="py-3 px-3 whitespace-nowrap">${statBadge}</td>
                <td class="py-3 px-3 whitespace-nowrap">
                    <div class="font-bold text-slate-800">${delivered} / ${total}</div>
                    <div class="text-[10px] text-emerald-600 font-semibold">devices</div>
                </td>
                <td class="py-3 px-3 whitespace-nowrap">
                    <div class="font-bold text-amber-700">${clicks} clicks</div>
                    <div class="text-[10px] text-slate-400 font-medium">${ctr} CTR</div>
                </td>
                <td class="py-3 px-3 whitespace-nowrap text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button type="button" onclick="resendBroadcastCampaign('${c.id}')"
                            class="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-all" title="Reuse / Resend Campaign">
                            <span class="material-symbols-outlined text-base">replay</span>
                        </button>
                        <button type="button" onclick="deleteBroadcastCampaign('${c.id}')"
                            class="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all" title="Delete Campaign">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function applyBroadcastTemplate(key) {
    const tmpl = BROADCAST_TEMPLATES[key];
    if (!tmpl) return;

    const titleEl = document.getElementById('broadcast-title');
    const bodyEl = document.getElementById('broadcast-body');
    const catEl = document.getElementById('broadcast-category');
    const imgEl = document.getElementById('broadcast-image-url');
    const actTextEl = document.getElementById('broadcast-action-text');
    const actUrlEl = document.getElementById('broadcast-action-url');

    if (titleEl) titleEl.value = tmpl.title;
    if (bodyEl) bodyEl.value = tmpl.body;
    if (catEl) catEl.value = tmpl.category;
    if (imgEl) imgEl.value = tmpl.imageUrl;
    if (actTextEl) actTextEl.value = tmpl.actionText;
    if (actUrlEl) actUrlEl.value = tmpl.actionUrl;

    updateBroadcastLivePreview();
    showToast(`✓ Applied ${key.replace('_', ' ')} template`, 'success');
}

function setBroadcastImage(url) {
    const imgEl = document.getElementById('broadcast-image-url');
    if (imgEl) {
        imgEl.value = url;
        updateBroadcastLivePreview();
    }
}

async function handleBroadcastBannerUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image (PNG, JPG, WEBP, or GIF)', 'error');
        return;
    }

    if (file.size > 8 * 1024 * 1024) {
        showToast('Image size must be less than 8MB', 'error');
        return;
    }

    const btn = document.getElementById('btn-upload-broadcast-banner');
    const originalContent = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="inline-block animate-spin mr-1">⟳</span><span>Uploading...</span>';
    }

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const base64Data = e.target.result;
                const token = getAdminAuthToken();

                const res = await fetch('/api/admin/broadcast-notifications/upload-banner', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'x-admin-token': token
                    },
                    body: JSON.stringify({
                        image_data: base64Data,
                        fileName: file.name
                    })
                });

                const data = await res.json();
                if (data.success && data.url) {
                    const urlInput = document.getElementById('broadcast-image-url');
                    if (urlInput) {
                        urlInput.value = data.url;
                    }
                    updateBroadcastLivePreview();
                    showToast('✓ Banner uploaded successfully!', 'success');
                } else {
                    throw new Error(data.error || 'Failed to upload image');
                }
            } catch (postErr) {
                console.error('[Banner Upload Error]:', postErr);
                showToast(postErr.message || 'Error uploading banner image', 'error');
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = originalContent;
                }
            }
        };
        reader.readAsDataURL(file);
    } catch (err) {
        console.error('[Upload Reader Error]:', err);
        showToast(err.message || 'Error reading banner image', 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}
window.handleBroadcastBannerUpload = handleBroadcastBannerUpload;

function updateBroadcastLivePreview() {
    const title = (document.getElementById('broadcast-title')?.value || '').trim();
    const body = (document.getElementById('broadcast-body')?.value || '').trim();
    const category = document.getElementById('broadcast-category')?.value || 'store_status';
    const imageUrl = (document.getElementById('broadcast-image-url')?.value || '').trim();
    const actionText = (document.getElementById('broadcast-action-text')?.value || '').trim();
    const targetHostel = document.getElementById('broadcast-target-hostel')?.value || 'all';

    // Character counters
    const titleCountEl = document.getElementById('title-char-count');
    const bodyCountEl = document.getElementById('body-char-count');
    if (titleCountEl) titleCountEl.textContent = `${title.length}/60`;
    if (bodyCountEl) bodyCountEl.textContent = `${body.length}/240`;

    // Preview elements
    const pTitle = document.getElementById('preview-title-display');
    const pBody = document.getElementById('preview-body-display');
    const pBannerBox = document.getElementById('preview-banner-container');
    const pBannerImg = document.getElementById('preview-banner-img');
    const pActionBtn = document.getElementById('preview-action-btn');
    const pCatBadge = document.getElementById('preview-category-badge');
    const pAudience = document.getElementById('preview-audience-tag');

    if (pTitle) {
        pTitle.textContent = title || '🟢 LPUQuick Store is Now Open! 🛒';
    }
    if (pBody) {
        pBody.textContent = body || 'Order late-night snacks, chilled drinks & Maggi to your room in 10 mins!';
    }

    if (pCatBadge) {
        const catMap = {
            store_status: 'STORE',
            special_offer: 'OFFER',
            festival: 'FESTIVE',
            announcement: 'NOTICE',
            general: 'LIVE'
        };
        pCatBadge.textContent = catMap[category] || 'LIVE';
    }

    if (pBannerBox && pBannerImg) {
        if (imageUrl) {
            pBannerImg.src = imageUrl;
            pBannerBox.classList.remove('hidden');
        } else {
            pBannerBox.classList.add('hidden');
        }
    }

    if (pActionBtn) {
        if (actionText) {
            pActionBtn.innerHTML = `<span>${escapeHtml(actionText)}</span>`;
            pActionBtn.classList.remove('hidden');
        } else {
            pActionBtn.classList.add('hidden');
        }
    }

    if (pAudience) {
        const targetName = targetHostel === 'all' ? 'All Hostels' : targetHostel;
        pAudience.textContent = `📍 Target: ${targetName}`;
    }

    // Update simulator clock
    const clockEl = document.getElementById('preview-clock-display');
    if (clockEl) {
        const d = new Date();
        const hrs = String(d.getHours() % 12 || 12);
        const mins = String(d.getMinutes()).padStart(2, '0');
        clockEl.textContent = `${hrs}:${mins}`;
    }
}

function onTargetHostelChange(selectEl) {
    const val = selectEl.value;
    const badge = document.getElementById('composer-target-count-badge');
    const counts = window.broadcastState.stats?.hostelCounts || {};

    if (badge) {
        if (val === 'all') {
            const total = window.broadcastState.stats?.totalSubscribers || 0;
            badge.textContent = `👥 ${total} Devices (All Hostels)`;
        } else {
            const hClean = val.toUpperCase().replace('-', '');
            const count = counts[hClean] || 0;
            badge.textContent = `📍 ${count} Devices in ${val}`;
        }
    }
    updateBroadcastLivePreview();
}

function toggleBroadcastSchedulePicker(show) {
    const container = document.getElementById('schedule-picker-container');
    if (container) {
        container.classList.toggle('hidden', !show);
        if (show) {
            const dtInput = document.getElementById('broadcast-schedule-datetime');
            if (dtInput && !dtInput.value) {
                // Default to 1 hour from now
                const d = new Date(Date.now() + 3600000);
                const isoStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                dtInput.value = isoStr;
            }
        }
    }
}

function clearBroadcastForm() {
    const titleEl = document.getElementById('broadcast-title');
    const bodyEl = document.getElementById('broadcast-body');
    const imgEl = document.getElementById('broadcast-image-url');
    const actTextEl = document.getElementById('broadcast-action-text');
    const actUrlEl = document.getElementById('broadcast-action-url');
    const catEl = document.getElementById('broadcast-category');

    if (titleEl) titleEl.value = '';
    if (bodyEl) bodyEl.value = '';
    if (imgEl) imgEl.value = '';
    if (actTextEl) actTextEl.value = '';
    if (actUrlEl) actUrlEl.value = '/#/';
    if (catEl) catEl.value = 'store_status';

    toggleBroadcastSchedulePicker(false);
    const radioNow = document.querySelector('input[name="broadcast_timing"][value="now"]');
    if (radioNow) radioNow.checked = true;

    updateBroadcastLivePreview();
}

function openBroadcastConfirmModal() {
    const title = (document.getElementById('broadcast-title')?.value || '').trim();
    const body = (document.getElementById('broadcast-body')?.value || '').trim();
    const targetHostel = document.getElementById('broadcast-target-hostel')?.value || 'all';
    const category = document.getElementById('broadcast-category')?.value || 'store_status';
    const isScheduled = document.querySelector('input[name="broadcast_timing"]:checked')?.value === 'schedule';

    if (!title || title.length < 3) {
        showToast('Please enter a notification title (minimum 3 characters)', 'warning');
        document.getElementById('broadcast-title')?.focus();
        return;
    }
    if (!body || body.length < 3) {
        showToast('Please enter a notification description', 'warning');
        document.getElementById('broadcast-body')?.focus();
        return;
    }

    if (isScheduled) {
        const dtVal = document.getElementById('broadcast-schedule-datetime')?.value;
        if (!dtVal || new Date(dtVal) <= new Date()) {
            showToast('Please select a valid future time for scheduling', 'warning');
            return;
        }
    }

    const modal = document.getElementById('modal-broadcast-confirm');
    const targetName = targetHostel === 'all' ? 'All Campus Hostels (Universal)' : targetHostel;

    document.getElementById('confirm-modal-target').textContent = targetName;
    document.getElementById('confirm-modal-category').textContent = category.replace('_', ' ').toUpperCase();
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-body').textContent = body;

    const timingEl = document.getElementById('confirm-modal-timing');
    if (timingEl) {
        if (isScheduled) {
            const dtVal = document.getElementById('broadcast-schedule-datetime')?.value;
            timingEl.textContent = `🕒 Scheduled for ${new Date(dtVal).toLocaleString()}`;
        } else {
            timingEl.textContent = '⚡ Immediately (Real-Time)';
        }
    }

    if (modal) modal.classList.remove('hidden');
}

function closeBroadcastConfirmModal() {
    const modal = document.getElementById('modal-broadcast-confirm');
    if (modal) modal.classList.add('hidden');
}

async function confirmAndDispatchBroadcast() {
    const submitBtn = document.getElementById('btn-confirm-broadcast-submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Dispatching...</span>';
    }

    try {
        const title = (document.getElementById('broadcast-title')?.value || '').trim();
        const body = (document.getElementById('broadcast-body')?.value || '').trim();
        const targetHostel = document.getElementById('broadcast-target-hostel')?.value || 'all';
        const targetHostelName = targetHostel === 'all' ? 'All Hostels' : targetHostel;
        const category = document.getElementById('broadcast-category')?.value || 'store_status';
        const imageUrl = (document.getElementById('broadcast-image-url')?.value || '').trim();
        const actionText = (document.getElementById('broadcast-action-text')?.value || '').trim();
        const actionUrl = (document.getElementById('broadcast-action-url')?.value || '/#/').trim();
        const isScheduled = document.querySelector('input[name="broadcast_timing"]:checked')?.value === 'schedule';

        const token = getAdminAuthToken();
        const endpoint = isScheduled ? '/api/admin/broadcast-notifications/schedule' : '/api/admin/broadcast-notifications/send';

        const payload = {
            title,
            body,
            targetHostel,
            targetHostelName,
            category,
            imageUrl,
            actionText,
            actionUrl
        };

        if (isScheduled) {
            payload.scheduledAt = document.getElementById('broadcast-schedule-datetime')?.value;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-admin-token': token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to dispatch broadcast');
        }

        closeBroadcastConfirmModal();
        clearBroadcastForm();

        const successMsg = isScheduled
            ? `🕒 Broadcast scheduled successfully!`
            : `🚀 Broadcast dispatched to ${data.campaign?.stats?.deliveredCount || 0} student device(s)!`;

        showToast(successMsg, 'success');
        await loadBroadcastNotificationsData();

    } catch (err) {
        console.error('[Dispatch Broadcast Error]:', err);
        showToast(err.message || 'Error broadcasting notification', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">send</span><span>Confirm & Broadcast</span>';
        }
    }
}

async function sendBroadcastTestPush() {
    try {
        const title = (document.getElementById('broadcast-title')?.value || '').trim() || '🟢 LPUQuick Store is Now Open! 🛒';
        const body = (document.getElementById('broadcast-body')?.value || '').trim() || 'Your campus dark store is open for fast delivery. Order late-night snacks directly to your hostel room in 10 minutes!';
        const imageUrl = (document.getElementById('broadcast-image-url')?.value || '').trim() || '/img/notif_store_open.gif';
        const actionText = (document.getElementById('broadcast-action-text')?.value || '').trim() || 'ORDER NOW 🛒';
        const actionUrl = (document.getElementById('broadcast-action-url')?.value || '/#/').trim();

        const token = getAdminAuthToken();
        showToast('📡 Sending test push to your phone...', 'info');

        const res = await fetch('/api/admin/broadcast-notifications/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-admin-token': token
            },
            body: JSON.stringify({
                title,
                body,
                imageUrl,
                actionText,
                actionUrl
            })
        });

        const data = await res.json();
        if (data.success) {
            showToast(`🔔 Test push received on your device (${data.result?.delivered || 1} delivered)!`, 'success');
        } else {
            showToast(data.error || 'Please ensure your browser has granted notification permission in admin portal', 'warning');
        }
    } catch (e) {
        console.error(e);
        showToast('Failed to dispatch test notification', 'error');
    }
}

async function deleteBroadcastCampaign(campaignId) {
    if (!confirm('Are you sure you want to remove this campaign record from history?')) return;

    try {
        const token = getAdminAuthToken();
        const res = await fetch(`/api/admin/broadcast-notifications/${campaignId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-admin-token': token
            }
        });

        const data = await res.json();
        if (data.success) {
            showToast('✓ Campaign removed from history', 'success');
            await loadBroadcastNotificationsData();
        } else {
            showToast(data.error || 'Failed to remove campaign', 'error');
        }
    } catch (err) {
        showToast('Error removing campaign', 'error');
    }
}

function resendBroadcastCampaign(campaignId) {
    const camp = window.broadcastState.campaigns.find(c => c.id === campaignId);
    if (!camp) return;

    const titleEl = document.getElementById('broadcast-title');
    const bodyEl = document.getElementById('broadcast-body');
    const catEl = document.getElementById('broadcast-category');
    const imgEl = document.getElementById('broadcast-image-url');
    const actTextEl = document.getElementById('broadcast-action-text');
    const actUrlEl = document.getElementById('broadcast-action-url');
    const targetEl = document.getElementById('broadcast-target-hostel');

    if (titleEl) titleEl.value = camp.title;
    if (bodyEl) bodyEl.value = camp.body;
    if (catEl) catEl.value = camp.category || 'general';
    if (imgEl) imgEl.value = camp.imageUrl || '';
    if (actTextEl) actTextEl.value = camp.actionText || '';
    if (actUrlEl) actUrlEl.value = camp.actionUrl || '/#/';
    if (targetEl && camp.targetHostel) targetEl.value = camp.targetHostel;

    updateBroadcastLivePreview();

    const composerSec = document.getElementById('broadcast-title');
    if (composerSec) {
        composerSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        composerSec.focus();
    }
    showToast('✓ Loaded campaign into composer. Review and tap Broadcast to send.', 'info');
}

function filterCampaignHistory(filterKey) {
    window.broadcastState.activeFilter = filterKey;
    document.querySelectorAll('.camp-filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filterKey;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-slate-900', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('bg-slate-100', !isActive);
        btn.classList.toggle('text-slate-700', !isActive);
    });
    renderBroadcastHistoryTable();
}

window.loadBroadcastNotificationsData = loadBroadcastNotificationsData;
window.applyBroadcastTemplate = applyBroadcastTemplate;
window.setBroadcastImage = setBroadcastImage;
window.updateBroadcastLivePreview = updateBroadcastLivePreview;
window.onTargetHostelChange = onTargetHostelChange;
window.toggleBroadcastSchedulePicker = toggleBroadcastSchedulePicker;
window.clearBroadcastForm = clearBroadcastForm;
window.openBroadcastConfirmModal = openBroadcastConfirmModal;
window.closeBroadcastConfirmModal = closeBroadcastConfirmModal;
window.confirmAndDispatchBroadcast = confirmAndDispatchBroadcast;
window.sendBroadcastTestPush = sendBroadcastTestPush;
window.deleteBroadcastCampaign = deleteBroadcastCampaign;
window.resendBroadcastCampaign = resendBroadcastCampaign;
window.filterCampaignHistory = filterCampaignHistory;

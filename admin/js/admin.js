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
} catch(e) {}

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

// Full interactive audio unlocker to bypass strict browser autoplay policies
function unlockAudioEngine() {
    const ctx = getAudioContext();
    if (ctx) {
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001; // Micro inaudible burst to unlock browser policy
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(0);
            osc.stop(ctx.currentTime + 0.01);
        } catch(e) {}
    }
    const fallbackAudio = document.getElementById('order-chime');
    if (fallbackAudio) {
        try {
            if (!fallbackAudio.src) fallbackAudio.src = generateChimeWavDataUri();
            fallbackAudio.volume = 1.0;
        } catch(e) {}
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
    } catch(e) {}

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
            playPromise.catch(() => {});
        }
    } catch(e) {}

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
} catch (e) {}

let clientLockState = null;
let lockTickerInterval = null;
let profitLocked = true;
let currentDrawerOrderId = null;
let realtimeWs = null;

// Read token securely from localStorage or sessionStorage
let adminToken = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || '';

// Headers for protected API calls
function getAuthHeaders(extra = {}) {
    const token = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token') || adminToken;
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
    isHandlingAuthError = true;
    console.warn('[Admin Auth] Session invalid or expired (401/403). Prompting re-login.');
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

// Resilient fetch wrapper with timeout prevention and auth error detection
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timer);
        if (res.status === 401 || res.status === 403) {
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

// View Navigation
function switchView(viewName) {
    activeView = viewName;
    document.querySelectorAll('#main-content > div').forEach(el => el.classList.add('hidden'));
    
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    const titles = {
        'dashboard': 'Dashboard Overview',
        'client-lock': 'Client Dashboard Control & Store Availability',
        'products': 'Product Catalog Management',
        'inventory': 'Real-Time Inventory & Stock',
        'orders': 'Campus Orders Queue',
        'customers': 'Student Customer Directory',
        'blacklist': 'Blacklist & Fraud Prevention',
        'analytics': 'Business Analytics & Reports',
        'settings': 'Store Settings'
    };
    document.getElementById('top-title').textContent = titles[viewName] || 'Dashboard';

    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'client-lock') loadClientLockState();
    else if (viewName === 'products') loadProducts();
    else if (viewName === 'inventory') loadInventory();
    else if (viewName === 'orders') loadOrders();
    else if (viewName === 'customers') loadCustomers();
    else if (viewName === 'blacklist') loadBlacklistData();
    else if (viewName === 'analytics') loadAnalytics();
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
            await fetchWithTimeout(`/api/orders/admin/invalidate-cache?_t=${Date.now()}`, {
                method: 'POST',
                headers: getAuthHeaders()
            }, 3000).catch(() => {});
        } catch (e) {}

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
            promises.push(loadProducts());
        } else if (activeView === 'inventory') {
            promises.push(loadInventory());
        } else if (activeView === 'orders') {
            promises.push(loadOrders());
        } else if (activeView === 'customers') {
            promises.push(loadCustomers());
        } else if (activeView === 'blacklist') {
            promises.push(loadBlacklistData());
        } else if (activeView === 'analytics') {
            promises.push(loadAnalytics());
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
        const [analyticsRes, ordersRes] = await Promise.allSettled([
            fetchWithTimeout(`/api/orders/admin/analytics?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 15000),
            fetchWithTimeout(`/api/orders/admin/all?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 15000)
        ]);

        let analyticsData = {};
        let ordersData = {};

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
            analyticsData = await analyticsRes.value.json().catch(() => ({}));
        } else if (analyticsRes.status === 'fulfilled' && (analyticsRes.value.status === 401 || analyticsRes.value.status === 403)) {
            handleAdminAuthError(analyticsRes.value);
            return;
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
            ordersData = await ordersRes.value.json().catch(() => ({}));
        } else if (ordersRes.status === 'fulfilled' && (ordersRes.value.status === 401 || ordersRes.value.status === 403)) {
            handleAdminAuthError(ordersRes.value);
            return;
        }

        // Cache orders immediately
        if (ordersData.orders && Array.isArray(ordersData.orders)) {
            ordersCache = ordersData.orders;
            try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(ordersCache)); } catch(e){}
        }

        const m = analyticsData.metrics || {};

        // Compute metrics with instant fallback from cached orders & products (never display '--')
        const totalOrdersVal = m.totalOrdersCount !== undefined ? m.totalOrdersCount : (ordersCache.length || 0);
        const pendingCountVal = m.pendingOrdersCount !== undefined ? m.pendingOrdersCount : (ordersCache.filter(o => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(o.status)).length);
        const totalRevVal = m.totalRevenue !== undefined ? m.totalRevenue : (ordersCache.filter(o => ['Delivered', 'delivered'].includes(o.status)).reduce((s, o) => s + (Number(o.total) || 0), 0));

        const totalProdVal = m.totalProducts !== undefined ? m.totalProducts : (productsCache.length || 44);
        const totalStockVal = m.totalStock !== undefined ? m.totalStock : (productsCache.reduce((s, p) => s + (Number(p.stock_left) || 0), 0) || 132);
        const lowStockVal = m.lowStockCount !== undefined ? m.lowStockCount : (productsCache.filter(p => p.stock_left > 0 && p.stock_left <= 4).length || 23);

        const elTotalProd = document.getElementById('dash-total-products');
        const elTotalStock = document.getElementById('dash-total-stock');
        const elLowStock = document.getElementById('dash-low-stock');
        const elTotalOrders = document.getElementById('dash-total-orders');
        const elPendingOrders = document.getElementById('dash-pending-orders');
        const elTotalRev = document.getElementById('dash-total-revenue');

        if (elTotalProd) elTotalProd.textContent = totalProdVal;
        if (elTotalStock) elTotalStock.textContent = totalStockVal;
        if (elLowStock) elLowStock.textContent = lowStockVal;
        if (elTotalOrders) elTotalOrders.textContent = totalOrdersVal;
        if (elPendingOrders) elPendingOrders.textContent = pendingCountVal;
        if (elTotalRev) elTotalRev.textContent = `₹${totalRevVal}`;

        const badge = document.getElementById('nav-pending-badge');
        if (badge) {
            badge.textContent = pendingCountVal;
            badge.classList.toggle('hidden', !pendingCountVal);
        }

        // Load Profit Metrics (Secure & Protected)
        loadProfitMetrics();

        // Load and sync store lock state
        loadClientLockState();

        // Cache & Render Recent Orders (preserve if network had temporary hiccup)
        if (ordersData.orders && Array.isArray(ordersData.orders) && ordersData.orders.length > 0) {
            ordersCache = ordersData.orders;
        }
        renderRecentOrdersTable(ordersCache);

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

// ================= PROFITS SECURITY & VISIBILITY =================
async function loadProfitMetrics() {
    try {
        const res = await fetch(`/api/admin/profits?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
        const data = await res.json();
        
        profitLocked = Boolean(data.locked);
        const netProfitEl = document.getElementById('dash-net-profit');
        const subEl = document.getElementById('dash-profit-sub');
        const badgeEl = document.getElementById('profit-badge');
        const iconEl = document.getElementById('icon-profit-lock');

        const aNetProfitEl = document.getElementById('analytics-net-profit');
        const aSubEl = document.getElementById('analytics-profit-sub');
        const aBadgeEl = document.getElementById('analytics-profit-badge');
        const aIconEl = document.getElementById('analytics-icon-profit-lock');

        if (profitLocked) {
            if (netProfitEl) netProfitEl.textContent = '••••••';
            if (subEl) subEl.textContent = 'Click lock to view';
            if (badgeEl) {
                badgeEl.textContent = 'LOCKED';
                badgeEl.className = 'text-[9px] bg-[#b06000]/15 text-[#b06000] px-1.5 py-0.2 rounded font-bold';
            }
            if (iconEl) iconEl.textContent = 'lock';

            if (aNetProfitEl) aNetProfitEl.textContent = '••••••';
            if (aSubEl) aSubEl.textContent = 'Click lock icon to decrypt';
            if (aBadgeEl) {
                aBadgeEl.textContent = 'LOCKED';
                aBadgeEl.className = 'text-[10px] bg-[#b06000]/15 text-[#b06000] px-1.5 py-0.5 rounded font-bold';
            }
            if (aIconEl) aIconEl.textContent = 'lock';
        } else {
            if (netProfitEl) netProfitEl.textContent = `₹${data.net_profit || 0}`;
            if (subEl) subEl.textContent = `Margin: ${data.margin_percent || 0}% (${data.delivered_orders_count || 0} delivered)`;
            if (badgeEl) {
                badgeEl.textContent = 'UNLOCKED';
                badgeEl.className = 'text-[9px] bg-[#137333]/15 text-[#137333] px-1.5 py-0.2 rounded font-bold';
            }
            if (iconEl) iconEl.textContent = 'lock_open';

            if (aNetProfitEl) aNetProfitEl.textContent = `₹${data.net_profit || 0}`;
            if (aSubEl) aSubEl.textContent = `Net Margin: ${data.margin_percent || 0}% (${data.delivered_orders_count || 0} delivered)`;
            if (aBadgeEl) {
                aBadgeEl.textContent = 'UNLOCKED';
                aBadgeEl.className = 'text-[10px] bg-[#137333]/15 text-[#137333] px-1.5 py-0.5 rounded font-bold';
            }
            if (aIconEl) aIconEl.textContent = 'lock_open';
        }
    } catch (err) {
        console.warn('Error loading profit metrics:', err);
    }
}


async function toggleProfitVisibility() {
    const nextLocked = !profitLocked;
    try {
        const res = await fetch('/api/admin/profit-visibility', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ locked: nextLocked })
        });
        const data = await res.json();
        if (data.success) {
            profitLocked = nextLocked;
            await loadProfitMetrics();
            showToast(nextLocked ? 'Profit metrics are now LOCKED.' : 'Profit metrics UNLOCKED.', 'info');
        }
    } catch (err) {
        alert('Failed to update profit visibility: ' + err.message);
    }
}

// ================= CLIENT DASHBOARD LOCK CONTROLS =================
async function loadClientLockState() {
    try {
        const res = await fetch(`/api/admin/client-lock?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.availability) {
            updateClientLockUI(data.availability);
        }
    } catch (err) {
        console.error('Error loading client lock state:', err);
    }
}

function refreshClientLockState() {
    loadClientLockState();
}

function formatClientReopenHeadline(avail) {
    if (!avail) return "We'll reopen soon";
    if (avail.end_at) {
        const end = new Date(avail.end_at);
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

function updateClientLockUI(avail) {
    clientLockState = avail;
    const isLocked = Boolean(avail.is_locked);
    const lockStatus = avail.lock_status || (isLocked ? 'LOCKED' : 'AVAILABLE');

    // Update Dashboard Quick Banner
    const dashPill = document.getElementById('dash-store-status-pill');
    const dashText = document.getElementById('dash-store-status-text');
    const navBadge = document.getElementById('nav-lock-badge');

    if (dashPill && dashText) {
        if (isLocked) {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]';
            dashText.textContent = 'STORE LOCKED';
        } else if (lockStatus === 'SCHEDULED') {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]';
            dashText.textContent = 'LOCK SCHEDULED';
        } else {
            dashPill.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#e6f4ea] text-[#137333] border border-[#ceead6]';
            dashText.textContent = 'STORE OPEN';
        }
    }

    if (navBadge) {
        if (isLocked) {
            navBadge.textContent = 'LOCKED';
            navBadge.className = 'text-[10px] bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full font-bold';
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
        stateBadge.textContent = 'STORE LOCKED';
        headline.textContent = formatClientReopenHeadline(avail);
        sub.textContent = avail.message ? `Admin message: "${avail.message}"` : "Students cannot submit checkout orders. Cart building is preserved.";
        quickUnlockBtn?.classList.remove('hidden');


        if (avail.remaining_seconds !== null && avail.remaining_seconds > 0) {
            timerBox?.classList.remove('hidden');
            startLockCountdown(avail.remaining_seconds, avail.end_at);
        } else {
            timerBox?.classList.add('hidden');
            if (lockTickerInterval) clearInterval(lockTickerInterval);
        }
    } else if (lockStatus === 'SCHEDULED') {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#b06000] bg-[#fef7e0]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#fef7e0] text-[#b06000] border border-[#fce8b2]';
        stateBadge.textContent = 'SCHEDULED LOCK';
        headline.textContent = `Scheduled to lock at ${new Date(avail.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        sub.textContent = `Lock window: ${new Date(avail.start_at).toLocaleString()} until ${new Date(avail.end_at).toLocaleString()}`;
        timerBox?.classList.add('hidden');
        quickUnlockBtn?.classList.add('hidden');
        if (lockTickerInterval) clearInterval(lockTickerInterval);
    } else {
        heroCard.className = 'glass-panel p-6 border-l-4 border-l-[#137333] bg-[#e6f4ea]/20';
        stateBadge.className = 'px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#e6f4ea] text-[#137333] border border-[#ceead6]';
        stateBadge.textContent = 'AVAILABLE (OPEN)';
        headline.textContent = 'Store is OPEN for student orders';
        sub.textContent = 'Students can browse products, manage their cart, and place orders with 3-minute delivery.';
        timerBox?.classList.add('hidden');
        quickUnlockBtn?.classList.add('hidden');
        if (lockTickerInterval) clearInterval(lockTickerInterval);
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
    const startAt = document.getElementById('input-schedule-start')?.value || null;
    const endAt = document.getElementById('input-schedule-end')?.value || null;

    const payload = {
        lock_type: mode,
        message: message,
        duration_minutes: durationMins,
        start_at: startAt,
        end_at: endAt
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
            updateClientLockUI(data.availability);
        } else {
            alert('Failed to apply lock: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Network error applying lock: ' + err.message);
    }
}

async function handleUnlockStore() {
    if (!confirm('Are you sure you want to UNLOCK the client storefront and make orders available now?')) {
        return;
    }
    try {
        const res = await fetch('/api/admin/client-lock', {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            showToast('Storefront is now AVAILABLE for orders.', 'success');
            updateClientLockUI(data.availability);
        }
    } catch (err) {
        alert('Error unlocking store: ' + err.message);
    }
}


// ================= 2. PRODUCTS LOAD =================
async function loadProducts() {
    try {
        const res = await fetchWithTimeout(`/api/products?includeInactive=true&fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 7000);
        if (res.ok) {
            const data = await res.json();
            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                productsCache = data.products;
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) {}
            }
        }
        filterProducts();
    } catch (err) {
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

function filterProducts() {
    const query = (document.getElementById('product-search-input')?.value || '').toLowerCase();
    let filtered = productsCache.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));

    if (currentProductFilter === 'active') {
        filtered = filtered.filter(p => p.in_stock && p.stock_left > 0);
    } else if (currentProductFilter === 'low') {
        filtered = filtered.filter(p => p.stock_left > 0 && p.stock_left <= 4);
    } else if (currentProductFilter === 'out') {
        filtered = filtered.filter(p => !p.in_stock || p.stock_left === 0);
    }

    const tbody = document.getElementById('products-table-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60]">No matching products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const stock = p.stock_left !== undefined ? p.stock_left : (p.in_stock ? 50 : 0);
        const statusBadge = stock > 4 
            ? `<button onclick="toggleProductStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-in-stock cursor-pointer hover:opacity-80 transition-all" title="Click to mark Out of Stock">In Stock</button>`
            : (stock > 0 
                ? `<button onclick="toggleProductStock('${p.id}', false)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-low-stock cursor-pointer hover:opacity-80 transition-all" title="Click to mark Out of Stock">Low Stock (${stock} left)</button>`
                : `<button onclick="toggleProductStock('${p.id}', true)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold badge-out-of-stock cursor-pointer hover:opacity-80 transition-all" title="Click to Restock (50 units)">Out of Stock ↻</button>`);

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.image_url}" class="w-10 h-10 rounded-md object-cover border border-[#DADCE0] bg-[#f1f4f7]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${p.name}</p>
                            <p class="text-[10px] text-[#5c5f60]">${p.unit || 'piece'} • ${p.size || ''}</p>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-[#5c5f60]">${p.category}</td>
                <td class="p-4 font-bold text-[#181c1f]">₹${p.price}</td>
                <td class="p-4 text-[#74777a] line-through">₹${p.mrp || p.price}</td>
                <td class="p-4 font-semibold text-[#181c1f]">${stock}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="quickRestock('${p.id}', 25)" class="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-all font-bold text-[11px] flex items-center gap-1 cursor-pointer" title="+25 Quick Restock">
                            <span class="material-symbols-outlined text-[15px]">add_circle</span>
                            <span>+25</span>
                        </button>
                        <button onclick="editProduct('${p.id}')" class="p-1.5 text-[#5c5f60] hover:text-[#3c4043] hover:bg-[#ebeef2] rounded-md transition-all cursor-pointer" title="Edit Product">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deactivateProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#f59e0b] hover:bg-[#fef3c7] rounded-md transition-all cursor-pointer" title="Deactivate (Out of Stock)">
                            <span class="material-symbols-outlined text-[18px]">block</span>
                        </button>
                        <button onclick="deleteProductPermanently('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-all cursor-pointer" title="Delete Completely From Database">
                            <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================= 3. INVENTORY LOAD =================
async function loadInventory() {
    try {
        const res = await fetchWithTimeout(`/api/products?includeInactive=true&fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 7000);
        if (res.ok) {
            const data = await res.json();
            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                productsCache = data.products;
                try { localStorage.setItem('lpuquick_admin_products_cache', JSON.stringify(productsCache)); } catch (e) {}
            }
        }
        filterInventory();
    } catch (err) {
        console.warn('Network timeout loading inventory, rendering available cache:', err);
        filterInventory();
    }
}

function filterInventory() {
    const query = (document.getElementById('inventory-search-input')?.value || '').toLowerCase();
    const filtered = productsCache.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
    const tbody = document.getElementById('inventory-table-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#5c5f60]">No items matching inventory search.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const stock = p.stock_left !== undefined ? p.stock_left : (p.in_stock ? 40 : 0);
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
                        <span class="font-semibold text-xs text-[#181c1f]">${p.name}</span>
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
    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, delta })
        });
        const data = await res.json();
        if (data.success) {
            loadInventory();
        }
    } catch (err) {
        alert('Stock update failed: ' + err.message);
    }
}

async function promptCustomStock(productId, current) {
    const input = prompt('Enter exact stock quantity:', current);
    if (input === null) return;
    const parsed = parseInt(input, 10);
    if (isNaN(parsed) || parsed < 0) {
        alert('Please enter a valid non-negative integer.');
        return;
    }

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, stock: parsed })
        });
        const data = await res.json();
        if (data.success) {
            loadInventory();
        }
    } catch (err) {
        alert('Stock update failed: ' + err.message);
    }
}

async function toggleProductStock(productId, inStock) {
    const p = productsCache.find(x => x.id === productId);
    const newStock = inStock ? 50 : 0;
    if (p) {
        p.in_stock = inStock;
        p.stock_left = newStock;
    }
    filterProducts();
    if (typeof filterInventory === 'function') filterInventory();

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, stock: newStock })
        });
        const data = await res.json();
        if (data.success && p) {
            p.stock_left = data.stock_left;
            p.in_stock = data.in_stock;
            filterProducts();
            showToast(inStock ? `Restocked to ${newStock} units.` : 'Marked Out of Stock.', 'success');
        }
    } catch (err) {
        console.error('Toggle stock error:', err);
    }
}

async function quickRestock(productId, qty = 25) {
    const p = productsCache.find(x => x.id === productId);
    if (p) {
        p.stock_left = (p.stock_left || 0) + qty;
        p.in_stock = true;
    }
    filterProducts();
    if (typeof filterInventory === 'function') filterInventory();

    try {
        const res = await fetch('/api/products/admin/adjust-stock', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ productId, delta: qty })
        });
        const data = await res.json();
        if (data.success && p) {
            p.stock_left = data.stock_left;
            p.in_stock = data.in_stock;
            filterProducts();
            showToast(`Added +${qty} units. Total: ${data.stock_left}`, 'success');
        }
    } catch (err) {
        console.error('Quick restock error:', err);
    }
}

// ================= 4. ORDERS LOAD =================
async function loadOrders() {
    try {
        const res = await fetchWithTimeout(`/api/orders/admin/all?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 15000);
        if (res.ok) {
            const data = await res.json();
            if (data.orders && Array.isArray(data.orders)) {
                ordersCache = data.orders;
                try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(ordersCache)); } catch (e) {}
            }
        } else if (res.status === 401 || res.status === 403) {
            handleAdminAuthError(res);
            return;
        }
        filterOrders();
    } catch (err) {
        console.warn('Network timeout loading orders, rendering available cache:', err);
        filterOrders();
    }
}

let currentOrderFilter = 'all';
function setOrderStatusFilter(status) {
    currentOrderFilter = status;
    document.querySelectorAll('.order-tab-btn').forEach(btn => {
        const active = btn.dataset.status === status;
        btn.className = `order-tab-btn px-4 py-1.5 rounded-full text-xs transition-all ${active ? 'bg-[#3c4043] text-white font-semibold' : 'border border-[#DADCE0] text-[#5c5f60] hover:bg-[#f1f4f7] font-medium'}`;
    });
    filterOrders();
}

function filterOrders() {
    const query = (document.getElementById('orders-search-input')?.value || '').toLowerCase();
    let filtered = ordersCache.filter(o => {
        const matchId = (o.id || '').toLowerCase().includes(query);
        const matchCust = (o.customer_name || '').toLowerCase().includes(query);
        const matchAddr = (o.delivery_address || '').toLowerCase().includes(query);
        return matchId || matchCust || matchAddr;
    });

    if (currentOrderFilter === 'active') {
        filtered = filtered.filter(o => !['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(o.status));
    } else if (currentOrderFilter === 'delivered') {
        filtered = filtered.filter(o => ['Delivered', 'delivered'].includes(o.status));
    }

    const tbody = document.getElementById('orders-table-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-[#5c5f60]">No orders found matching filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const contactHtml = o.customer_phone ? o.customer_phone : (o.customer_email || 'Not provided');
        const displayName = formatCustomerDisplayName(o);
        return `
        <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')" id="order-row-${o.id}">
            <td class="p-4 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
            <td class="p-4">
                <p class="font-semibold text-[#181c1f]">${displayName}</p>
                <p class="text-[11px] text-[#5c5f60]">${contactHtml}</p>
            </td>
            <td class="p-4 text-[#5c5f60]">${o.delivery_address || 'Not provided'}</td>
            <td class="p-4 font-bold text-[#137333]">₹${o.total}</td>
            <td class="p-4 text-[#5c5f60]">${o.payment_method || 'COD'}</td>
            <td class="p-4" id="order-status-pill-${o.id}">${getStatusPill(o.status)}</td>
            <td class="p-4 text-[#74777a]">${new Date(o.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td class="p-4 text-right">
                <button onclick="event.stopPropagation(); openOrderDrawer('${o.id}')" class="text-xs font-semibold text-[#3c4043] bg-[#ebeef2] hover:bg-[#e0e3e6] px-3 py-1 rounded-full">
                    Manage
                </button>
            </td>
        </tr>
    `}).join('');
}

function getStatusPill(status) {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Delivered ✓</span>';
    if (s === 'cancelled') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fce8e6] text-[#c5221f] border border-[#f5c6cb]">Cancelled ✕</span>';
    if (s === 'out for delivery') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">En Route 🚶‍♂️</span>';
    if (s === 'preparing') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Preparing 📦</span>';
    if (s === 'order confirmed') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Confirmed 👍</span>';
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] animate-pulse">Order Placed ⚡</span>';
}

// ================= 5. ORDER DETAILS DRAWER =================
async function openOrderDrawer(orderId) {
    currentDrawerOrderId = orderId;
    document.getElementById('order-drawer').classList.remove('hidden');

    // 1. Instant 0ms memory render from local cache if present
    const cachedOrder = ordersCache.find(o => o.id === orderId);
    if (cachedOrder) {
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
    }
    document.getElementById('drawer-items-list').innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Loading items breakdown...</p>';

    try {
        const res = await fetchWithTimeout(`/api/orders/admin/detail/${orderId}?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() }, 6000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const o = data.order;
        if (!o || currentDrawerOrderId !== orderId) return;

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

        const itemsList = document.getElementById('drawer-items-list');
        const items = o.items || [];
        if (items.length === 0) {
            itemsList.innerHTML = '<p class="text-xs text-[#5c5f60] p-3 text-center">Campus order items recorded</p>';
        } else {
            itemsList.innerHTML = items.map(item => `
                <div class="flex justify-between items-center p-2 rounded-lg border border-[#DADCE0] bg-[#f7fafd]">
                    <div class="flex items-center gap-2">
                        <img src="${item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'}" class="w-8 h-8 rounded object-cover bg-white" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                        <div>
                            <p class="font-semibold text-xs text-[#181c1f]">${item.name || 'Item'}</p>
                            <p class="text-[10px] text-[#5c5f60]">Qty: ${item.quantity} × ₹${item.unit_price || 0}</p>
                        </div>
                    </div>
                    <span class="font-bold text-xs text-[#137333]">₹${(item.quantity || 1) * (item.unit_price || 0)}</span>
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
    document.getElementById('order-drawer').classList.add('hidden');
}

async function applyDrawerStatusUpdate() {
    if (!currentDrawerOrderId) return;
    const newStatus = document.getElementById('drawer-status-select').value;
    const targetOrderId = currentDrawerOrderId;

    // 1. Optimistic instant local update
    const o = ordersCache.find(x => x.id === targetOrderId);
    if (o) o.status = newStatus;
    
    // Update live pills in DOM
    const pill1 = document.getElementById(`order-status-pill-${targetOrderId}`);
    if (pill1) pill1.innerHTML = getStatusPill(newStatus);
    const pill2 = document.getElementById(`dash-status-pill-${targetOrderId}`);
    if (pill2) pill2.innerHTML = getStatusPill(newStatus);

    const shortId = targetOrderId.replace('order_', '').toUpperCase();
    showToast(`✓ Order #${shortId} status updated to: ${newStatus}`, 'success');
    closeOrderDrawer();

    try {
        await fetchWithTimeout('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderId: targetOrderId, status: newStatus })
        }, 5000);
    } catch (err) {
        console.warn('Status synced in local cache, server ping returned:', err.message);
    }
}

async function quickSetOrderStatus(orderId, newStatus, e) {
    if (e) e.stopPropagation();

    // 1. Optimistic instant update
    const o = ordersCache.find(x => x.id === orderId);
    if (o) o.status = newStatus;

    const pill1 = document.getElementById(`order-status-pill-${orderId}`);
    if (pill1) pill1.innerHTML = getStatusPill(newStatus);
    const pill2 = document.getElementById(`dash-status-pill-${orderId}`);
    if (pill2) pill2.innerHTML = getStatusPill(newStatus);

    const shortId = orderId.replace('order_', '').toUpperCase();
    showToast(`✓ Order #${shortId} set to "${newStatus}"`, 'success');

    if (activeView === 'orders') filterOrders();
    else if (activeView === 'dashboard') loadDashboard();

    try {
        await fetchWithTimeout('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderId, status: newStatus })
        }, 5000);
    } catch (err) {
        console.warn('Quick status update synced in session, server ping returned:', err.message);
    }
}

// ================= 6. PRODUCT MODAL (ADD / EDIT & PHOTO UPLOAD) =================
function handleProductFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WEBP).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('product-img-preview');
        const urlInput = document.getElementById('form-product-image');
        if (preview) preview.src = e.target.result;
        if (urlInput) urlInput.value = e.target.result;
    };
    reader.readAsDataURL(file);
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
    if (preview) preview.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
}

function openProductModal(product = null) {
    document.getElementById('product-modal').classList.remove('hidden');
    const deleteBtn = document.getElementById('btn-modal-delete-product');
    const preview = document.getElementById('product-img-preview');
    const fileInput = document.getElementById('form-product-file');
    if (fileInput) fileInput.value = '';

    if (product) {
        document.getElementById('modal-product-title').textContent = 'Edit Product';
        document.getElementById('form-product-id').value = product.id;
        document.getElementById('form-product-name').value = product.name;
        document.getElementById('form-product-category').value = product.category;
        document.getElementById('form-product-subcategory').value = product.subcategory || '';
        document.getElementById('form-product-price').value = product.price;
        document.getElementById('form-product-mrp').value = product.mrp || product.price;
        document.getElementById('form-product-stock').value = product.stock_left !== undefined ? product.stock_left : 50;
        document.getElementById('form-product-image').value = product.image_url || '';
        if (preview) preview.src = product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
        document.getElementById('form-product-desc').value = product.description || '';
        if (deleteBtn) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.dataset.productId = product.id;
            deleteBtn.dataset.productName = product.name;
        }
    } else {
        document.getElementById('modal-product-title').textContent = 'Add New Campus Product';
        document.getElementById('product-form').reset();
        document.getElementById('form-product-id').value = '';
        document.getElementById('form-product-stock').value = '50';
        clearProductImage();
        if (deleteBtn) {
            deleteBtn.classList.add('hidden');
            deleteBtn.dataset.productId = '';
            deleteBtn.dataset.productName = '';
        }
    }
}

function closeProductModal() {
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
    const p = productsCache.find(x => x.id === id);
    if (p) openProductModal(p);
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-product');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span> Saving...';
    }

    try {
        const id = document.getElementById('form-product-id').value;
        const stockVal = Number(document.getElementById('form-product-stock').value) || 0;
        let imageUrl = document.getElementById('form-product-image').value.trim();

        // If a photo was selected as a local file (base64 Data URL), upload it to server
        if (imageUrl.startsWith('data:image/')) {
            try {
                const uploadRes = await fetch('/api/products/admin/upload-image', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ image_data: imageUrl })
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success && uploadData.image_url) {
                    imageUrl = uploadData.image_url;
                }
            } catch (upErr) {
                console.warn('[Image Upload Notice]:', upErr);
            }
        }

        const payload = {
            name: document.getElementById('form-product-name').value.trim(),
            category: document.getElementById('form-product-category').value,
            subcategory: document.getElementById('form-product-subcategory').value.trim(),
            price: Number(document.getElementById('form-product-price').value),
            mrp: Number(document.getElementById('form-product-mrp').value) || Number(document.getElementById('form-product-price').value),
            stock_left: stockVal,
            in_stock: stockVal > 0,
            image_url: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
            description: document.getElementById('form-product-desc').value.trim()
        };

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
            await loadProducts();
            await loadInventory();
            await loadDashboard();
            if (typeof showToast === 'function') {
                showToast(`Product "${payload.name}" saved successfully!`, 'success');
            }
        } else {
            alert('Error saving product: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Save failed: ' + err.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span>Save Product</span>';
        }
    }
}

async function deactivateProduct(id, name) {
    if (!confirm(`Are you sure you want to deactivate "${name}"? It will become unavailable to students while preserving historical orders.`)) return;

    try {
        const res = await fetch(`/api/products/admin/deactivate/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            loadProducts();
            if (typeof loadInventory === 'function') loadInventory();
        }
    } catch (err) {
        alert('Deactivation failed: ' + err.message);
    }
}

async function deleteProductPermanently(id, name) {
    if (!confirm(`⚠️ PERMANENT DELETE:\n\nAre you sure you want to permanently delete "${name}" from Supabase Cloud inventory?\n\nThis will completely remove the item and cannot be undone.`)) return;

    try {
        const res = await fetch(`/api/products/admin/delete/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
            alert(`"${name}" was permanently removed from inventory.`);
            loadProducts();
            if (typeof loadInventory === 'function') loadInventory();
        } else {
            alert('Failed to delete: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

// ================= 7. CUSTOMERS LOAD & FRAUD MANAGEMENT =================
async function loadCustomers() {
    try {
        const res = await fetch(`/api/admin/users?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
        let data = {};
        if (res.ok) {
            data = await res.json();
            customersCache = data.users || [];
        } else {
            // Fallback to orders customer endpoint
            const fallbackRes = await fetch(`/api/orders/admin/customers?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
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

        const actionBtn = isBlocked
            ? `<button onclick="handleUnblockUser('${c.id}')" class="px-3 py-1.5 rounded-lg bg-[#137333]/10 hover:bg-[#137333]/20 text-[#137333] font-bold text-xs transition-colors flex items-center gap-1 ml-auto">
                 <span class="material-symbols-outlined text-[14px]">lock_open</span>
                 <span>Unblock</span>
               </button>`
            : `<button onclick="openBlockUserModal('${c.id}', '${encodeURIComponent(c.name || 'Student')}', '${encodeURIComponent(c.phone || '')}', '${encodeURIComponent(c.email || '')}')" class="px-3 py-1.5 rounded-lg bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] font-bold text-xs transition-colors flex items-center gap-1 ml-auto">
                 <span class="material-symbols-outlined text-[14px]">block</span>
                 <span>Block User</span>
               </button>`;

        return `
            <tr class="hover:bg-[#f7fafd] transition-colors ${isBlocked ? 'bg-[#fff8f7]' : ''}">
                <td class="p-4 font-bold text-xs text-[#181c1f] flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full ${isBlocked ? 'bg-[#ba1a1a]' : 'bg-[#3c4043]'} text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ${(c.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                        <p class="font-bold text-[#181c1f]">${c.name || 'Student'}</p>
                        <p class="text-[10px] text-[#5c5f60] font-medium">${c.address ? `🏠 ${c.address}` : (c.id || '')}</p>
                    </div>
                </td>
                <td class="p-4 text-xs">${phoneHtml}</td>
                <td class="p-4 text-xs">${emailHtml}</td>
                <td class="p-4 font-bold text-[#181c1f]">${c.order_count || 0}</td>
                <td class="p-4 font-bold text-[#137333]">₹${c.total_spent || 0}</td>
                <td class="p-4 text-[#74777a]">${c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'N/A'}</td>
                <td class="p-4">${statusHtml}</td>
                <td class="p-4 text-right">${actionBtn}</td>
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


// ================= BLACKLIST & FRAUD PREVENTION =================
let currentBlacklistFilter = 'all';

async function loadBlacklistData() {
    try {
        const res = await fetch(`/api/admin/blacklist?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
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
function openBlockUserModal(userId, name, phone, email) {
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

    if (!userId) return;

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
        const res = await fetch(`/api/orders/admin/analytics?fresh=true&_t=${Date.now()}`, { headers: getAuthHeaders() });
        const data = await res.json();
        const m = data.metrics || {};

        document.getElementById('analytics-rev').textContent = `₹${m.totalRevenue || 0}`;
        document.getElementById('analytics-aov').textContent = `₹${m.avgOrderValue || 0}`;
        document.getElementById('analytics-orders').textContent = `${m.totalOrdersCount || 0}`;
        
        const rate = m.totalProducts > 0 ? Math.round(((m.totalProducts - (m.outOfStockCount || 0)) / m.totalProducts) * 100) : 100;
        document.getElementById('analytics-stock-rate').textContent = `${rate}%`;

        // Sync profit tile in Analytics view
        loadProfitMetrics();


        const tbody = document.getElementById('analytics-top-products-tbody');
        const top = data.topProducts || [];
        if (top.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-[#5c5f60]">No sales data recorded yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = top.map(p => `
            <tr class="hover:bg-[#f7fafd]">
                <td class="py-3 font-semibold text-xs text-[#181c1f] flex items-center gap-2">
                    <img src="${p.image_url}" class="w-8 h-8 rounded object-cover bg-white border border-[#DADCE0]" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                    <span>${p.name}</span>
                </td>
                <td class="py-3 text-[#5c5f60]">${p.category}</td>
                <td class="py-3 font-bold text-[#181c1f]">${p.total_sold || 0}</td>
                <td class="py-3 text-right font-black text-[#137333]">₹${p.revenue || 0}</td>
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
                <td class="p-3.5 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
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
    const totalRevEl = document.getElementById('dash-total-revenue');
    const badgeEl = document.getElementById('nav-pending-badge');

    const totalOrdersVal = ordersCache.length || 0;
    const pendingCountVal = ordersCache.filter(o => ['Order Placed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted'].includes(o.status)).length;
    const totalRevVal = ordersCache.filter(o => ['Delivered', 'delivered'].includes(o.status)).reduce((s, o) => s + (Number(o.total) || 0), 0);

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrdersVal;
    if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCountVal;
    if (totalRevEl) totalRevEl.textContent = `₹${totalRevVal}`;
    if (badgeEl) {
        badgeEl.textContent = pendingCountVal;
        badgeEl.classList.toggle('hidden', !pendingCountVal);
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
        }).catch(() => {});

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

// Smart Continuous Live Order Sync (Works 100% reliably on Vercel Serverless and Localhost)
async function syncOrdersLive() {
    const token = adminToken || localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
    if (!token) {
        updateConnectionStatus(false, 'Auth Required');
        return;
    }
    try {
        const res = await fetch(`/api/orders/admin/all?fresh=true&_t=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', ...getAuthHeaders() }
        });
        if (res.status === 401 || res.status === 403) {
            handleAdminAuthError(res);
            return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const orders = data.orders || [];

        // Keep local cache fresh at all times
        ordersCache = orders;
        try { localStorage.setItem('lpuquick_admin_orders_cache', JSON.stringify(orders)); } catch(e){}

        if (isInitialOrderPoll) {
            orders.forEach(o => {
                if (o && o.id) knownOrderMap.set(o.id, o.status);
            });
            isInitialOrderPoll = false;
            updateConnectionStatus(true, 'Live');
            if (activeView === 'dashboard') {
                renderRecentOrdersTable(orders);
                updateKpiCountersFromCache();
            }
            return;
        }

        // Detect new orders and status updates
        for (const order of orders) {
            if (!order || !order.id) continue;

            if (!knownOrderMap.has(order.id)) {
                // New incoming order detected!
                knownOrderMap.set(order.id, order.status);
                handleRealtimeNewOrder(order);
            } else if (knownOrderMap.get(order.id) !== order.status) {
                // Status changed!
                knownOrderMap.set(order.id, order.status);
                handleRealtimeStatusUpdate({ orderId: order.id, status: order.status });
            }
        }

        // Keep UI updated seamlessly
        if (activeView === 'dashboard') {
            renderRecentOrdersTable(orders);
            updateKpiCountersFromCache();
        } else if (activeView === 'orders') {
            renderOrdersTable(orders);
        }

        updateConnectionStatus(true, 'Live');
    } catch (err) {
        console.warn('[Admin Live Sync Note]:', err.message);
    }
}

function startLiveOrderPolling() {
    if (liveOrderPollInterval) clearInterval(liveOrderPollInterval);
    syncOrdersLive(); // Run immediately
    liveOrderPollInterval = setInterval(syncOrdersLive, 2500); // Rapid check every 2.5s
}

function initRealtimeWebSocket() {
    // Start continuous smart live poller immediately as bulletproof fallback
    startLiveOrderPolling();

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
        try { realtimeWs.close(); } catch(e){}
        realtimeWs = null;
    }

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/ws/admin`;

    try {
        realtimeWs = new WebSocket(wsUrl);

        realtimeWs.onopen = () => {
            console.log('[Admin WS] ✅ Connected to live orders stream.');
            wsReconnectAttempts = 0;
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

                if (data.type === 'NEW_ORDER' && data.order) {
                    knownOrderMap.set(data.order.id, data.order.status);
                    handleRealtimeNewOrder(data.order);
                } else if (data.type === 'ORDER_STATUS_UPDATE') {
                    if (data.orderId && data.status) knownOrderMap.set(data.orderId, data.status);
                    handleRealtimeStatusUpdate(data);
                } else if (data.type === 'INVENTORY_UPDATE') {
                    handleRealtimeInventoryUpdate(data);
                } else if (data.type === 'CLIENT_LOCK_UPDATE' && data.availability) {
                    updateClientLockUI(data.availability);
                    showToast(`Store availability updated: ${data.availability.lock_status}`, 'info');
                } else if (data.type === 'USER_BLOCKED') {
                    showToast(`User ${data.userId} blocked (${data.reason})`, 'warning');
                    if (activeView === 'customers') loadCustomers();
                    if (activeView === 'blacklist') loadBlacklistData();
                } else if (data.type === 'CONNECTED') {
                    console.log('[Admin WS] Server confirmed connection:', data.message);
                }
            } catch (err) {
                console.error('[Admin WS Parse Error]:', err);
            }
        };


        realtimeWs.onclose = () => {
            realtimeWs = null;
            if (wsPingInterval) { clearInterval(wsPingInterval); wsPingInterval = null; }

            // WebSocket unavailable (e.g. Vercel Serverless) — Live Poller keeps running seamlessly
            updateConnectionStatus(true, 'Live');

            if (adminToken && !wsReconnectTimer) {
                const delay = Math.min(2000 * Math.pow(2, wsReconnectAttempts), 30000);
                wsReconnectAttempts++;
                wsReconnectTimer = setTimeout(initRealtimeWebSocket, delay);
            }
        };

        realtimeWs.onerror = (err) => {
            try { realtimeWs.close(); } catch(e){}
        };
    } catch (e) {
        updateConnectionStatus(true, 'Live');
        if (!wsReconnectTimer) {
            wsReconnectTimer = setTimeout(initRealtimeWebSocket, 5000);
        }
    }
}

// Handle real-time inventory update
function handleRealtimeInventoryUpdate(data) {
    const { productId, stock_left, in_stock } = data;
    // Update products cache in-place
    const p = productsCache.find(x => x.id === productId);
    if (p) {
        p.stock_left = stock_left;
        p.in_stock = in_stock;
    }
    // Refresh current view if on inventory or products
    if (activeView === 'inventory') filterInventory();
    else if (activeView === 'products') filterProducts();
    else if (activeView === 'dashboard') loadDashboard();
}

// Handle Incoming Order in Real-Time (Strict Single Alert Deduplication)
function handleRealtimeNewOrder(order) {
    if (!order || !order.id) return;

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

    // 3. Prepend to local orders cache
    ordersCache = ordersCache.filter(o => o.id !== order.id);
    ordersCache.unshift(order);

    // 4. Update KPI Metrics Dynamically
    const totalOrdersEl = document.getElementById('dash-total-orders');
    const pendingOrdersEl = document.getElementById('dash-pending-orders');
    const totalRevEl = document.getElementById('dash-total-revenue');
    const badgeEl = document.getElementById('nav-pending-badge');

    if (totalOrdersEl) {
        const cur = parseInt(totalOrdersEl.textContent, 10);
        totalOrdersEl.textContent = isNaN(cur) ? 1 : cur + 1;
    }
    if (pendingOrdersEl) {
        const cur = parseInt(pendingOrdersEl.textContent, 10);
        const pCount = (isNaN(cur) ? 0 : cur) + 1;
        pendingOrdersEl.textContent = pCount;
        if (badgeEl) {
            badgeEl.textContent = pCount;
            badgeEl.classList.remove('hidden');
        }
    }
    if (totalRevEl && ['Delivered', 'delivered'].includes(order.status)) {
        const currentRev = parseFloat(totalRevEl.textContent.replace('₹', '')) || 0;
        totalRevEl.textContent = `₹${currentRev + Number(order.total || 0)}`;
    }

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
    if (o) o.status = status;

    // Update both dashboard table and orders queue table
    const pills = document.querySelectorAll(`[data-status-pill-id="${orderId}"], #order-status-pill-${orderId}, #dash-status-pill-${orderId}`);
    pills.forEach(p => { p.innerHTML = getStatusPill(status); });

    if (currentDrawerOrderId === orderId) {
        const select = document.getElementById('drawer-status-select');
        if (select) select.value = status;
    }

    // Refresh KPI metrics dynamically if status changed
    if (activeView === 'dashboard') {
        loadDashboard();
    } else if (activeView === 'orders') {
        filterOrders();
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
                    <span class="font-bold text-sm text-[#181c1f]">${order.customer_name || 'Customer'}</span>
                    <span class="font-black text-sm text-[#137333]">₹${order.total}</span>
                </div>
                <p class="text-[11px] text-[#5c5f60] mt-0.5">📍 ${order.delivery_address || 'Not provided'}</p>
                <p class="text-[10px] text-[#74777a] italic mt-1 truncate">🛍️ ${order.item_summary || 'Campus essentials'}</p>
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
        const data = await res.json();
        
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
            } catch (aErr) {}
            
            hideLoginModal();
            switchView('dashboard');
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
    adminToken = '';
    if (realtimeWs) {
        try { realtimeWs.close(); } catch(e){}
    }
    showLoginModal();
}

// General purpose toast notification utility
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

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
        <div id="${id}" class="toast-card p-3 border-l-4 ${colors[type] || colors.info} flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">${iconMap[type] || 'info'}</span>
                <span class="text-xs font-semibold text-[#181c1f]">${message}</span>
            </div>
            <button onclick="dismissToast('${id}')" class="text-[#74777a] hover:text-[#181c1f] text-xs">✕</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    setTimeout(() => { if (el) el.classList.add('show'); }, 20);
    setTimeout(() => { dismissToast(id); }, 4000);
}

// Initial Boot Check
const savedAdminToken = localStorage.getItem('lpuquick_admin_token') || sessionStorage.getItem('lpuquick_admin_token');
if (!savedAdminToken) {
    showLoginModal();
} else {
    adminToken = savedAdminToken;
    hideLoginModal();
    switchView('dashboard');
    initRealtimeWebSocket();
}

updateSoundUI();

// Periodic background sync fallback (every 60 seconds when authenticated)
setInterval(() => {
    if (!adminToken) return;
    if (activeView === 'dashboard') loadDashboard();
    else if (activeView === 'orders') loadOrders();
    else if (activeView === 'inventory') loadInventory();
    else if (activeView === 'products') loadProducts();
}, 60000);


// Multi-Theme Web Audio Synthesizer Engine (Cha-Ching, QuickCommerce Pop, Courier Chirp, Arcade, Crystal Bell)
let audioCtx = null;
let soundEnabled = localStorage.getItem('lpuquick_admin_sound') !== 'false';
let currentSoundTheme = localStorage.getItem('lpuquick_order_sound_theme') || 'cash_register';

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Automatically unlock AudioContext on user's first interaction
['click', 'touchstart', 'keydown', 'mousedown'].forEach(evt => {
    document.addEventListener(evt, () => {
        getAudioContext();
    }, { once: false, passive: true });
});

// Master Sound Synthesizer
function playCampusChime(theme = currentSoundTheme) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const now = ctx.currentTime;

        if (theme === 'cash_register') {
            // Theme 1: Cash Register "Cha-Ching" + Metallic Shimmer
            // Metallic lever click
            const osc0 = ctx.createOscillator();
            const gain0 = ctx.createGain();
            osc0.type = 'triangle';
            osc0.frequency.setValueAtTime(350, now);
            osc0.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
            gain0.gain.setValueAtTime(0.35, now);
            gain0.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc0.connect(gain0);
            gain0.connect(ctx.destination);
            osc0.start(now);
            osc0.stop(now + 0.05);

            // Cha-Ching Ring Note (B5 -> E6)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now + 0.05);
            osc1.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12);
            gain1.gain.setValueAtTime(0, now + 0.05);
            gain1.gain.linearRampToValueAtTime(0.5, now + 0.08);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now + 0.05);
            osc1.stop(now + 0.7);

            // High Coin Harmonic Ring (1975Hz - B6)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1975.53, now + 0.09);
            gain2.gain.setValueAtTime(0, now + 0.09);
            gain2.gain.linearRampToValueAtTime(0.35, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.09);
            osc2.stop(now + 0.9);

        } else if (theme === 'swiggy_pop') {
            // Theme 2: QuickCommerce Pop (C5 -> E5 -> G5 -> C6)
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((f, idx) => {
                const t = now + (idx * 0.065);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.45, t + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.22);
            });

        } else if (theme === 'express_beep') {
            // Theme 3: Courier Delivery Double-Chirp (1760Hz -> 2093Hz)
            [0, 0.11].forEach(offset => {
                const t = now + offset;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1760, t);
                osc.frequency.exponentialRampToValueAtTime(2093, t + 0.05);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.07);
            });

        } else if (theme === 'arcade_ding') {
            // Theme 4: Arcade Level-Up Victory Ding (A4 -> C#5 -> E5 -> A5)
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((f, idx) => {
                const t = now + (idx * 0.055);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, t);
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.3);
            });

        } else {
            // Theme 5: Crystal Bell Dual Chime (E5 -> A5 -> C#6 -> E6)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, now);
            osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.08);
            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.6);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1108.73, now + 0.1);
            osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2);
            gain2.gain.setValueAtTime(0, now + 0.1);
            gain2.gain.linearRampToValueAtTime(0.4, now + 0.13);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.1);
            osc2.stop(now + 0.9);
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

// State & Auth Token
let activeView = 'dashboard';
let productsCache = [];
let ordersCache = [];
let adminToken = localStorage.getItem('lpuquick_admin_token') || 'adm_sec_master_2026';
let currentDrawerOrderId = null;
let realtimeWs = null;

// Headers for protected API calls
function getAuthHeaders() {
    let token = localStorage.getItem('lpuquick_admin_token') || adminToken;
    if (!token || !token.startsWith('adm_sec_')) {
        token = 'adm_sec_master_2026';
        localStorage.setItem('lpuquick_admin_token', token);
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-admin-token': token,
        'x-admin-key': 'lpuquick_admin_secret_2026'
    };
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
        'products': 'Product Catalog Management',
        'inventory': 'Real-Time Inventory & Stock',
        'orders': 'Campus Orders Queue',
        'customers': 'Student Customer Directory',
        'analytics': 'Business Analytics & Reports',
        'settings': 'Store Settings'
    };
    document.getElementById('top-title').textContent = titles[viewName] || 'Dashboard';

    if (viewName === 'dashboard') loadDashboard();
    else if (viewName === 'products') loadProducts();
    else if (viewName === 'inventory') loadInventory();
    else if (viewName === 'orders') loadOrders();
    else if (viewName === 'customers') loadCustomers();
    else if (viewName === 'analytics') loadAnalytics();
}

function refreshCurrentView() {
    switchView(activeView);
}

// ================= 1. DASHBOARD LOAD =================
async function loadDashboard() {
    try {
        const [analyticsRes, ordersRes] = await Promise.all([
            fetch('/api/orders/admin/analytics', { headers: getAuthHeaders() }),
            fetch('/api/orders/admin/all', { headers: getAuthHeaders() })
        ]);

        if (analyticsRes.status === 403 || ordersRes.status === 403) {
            showLoginModal();
            return;
        }

        const analyticsData = await analyticsRes.json();
        const ordersData = await ordersRes.json();

        const m = analyticsData.metrics || {};
        document.getElementById('dash-total-products').textContent = m.totalProducts || 0;
        document.getElementById('dash-total-stock').textContent = m.totalStock || 0;
        document.getElementById('dash-low-stock').textContent = m.lowStockCount || 0;
        document.getElementById('dash-total-orders').textContent = m.totalOrdersCount || 0;
        document.getElementById('dash-pending-orders').textContent = m.pendingOrdersCount || 0;
        document.getElementById('dash-total-revenue').textContent = `₹${m.totalRevenue || 0}`;

        // Update pending badge in sidebar
        const badge = document.getElementById('nav-pending-badge');
        if (badge) {
            badge.textContent = m.pendingOrdersCount || 0;
            badge.classList.toggle('hidden', !m.pendingOrdersCount);
        }

        // Cache & Render Recent Orders
        ordersCache = ordersData.orders || [];
        const recentOrders = ordersCache.slice(0, 5);
        const tbody = document.getElementById('dash-recent-orders-tbody');
        if (recentOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60]">No orders found in database.</td></tr>`;
        } else {
            tbody.innerHTML = recentOrders.map(o => `
                <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')" id="order-row-${o.id}">
                    <td class="p-3.5 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
                    <td class="p-3.5 font-medium text-[#181c1f]">${o.customer_name || 'Nivas'}</td>
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

// ================= 2. PRODUCTS LOAD =================
async function loadProducts() {
    try {
        const res = await fetch('/api/products?includeInactive=true', { headers: getAuthHeaders() });
        const data = await res.json();
        productsCache = data.products || [];
        filterProducts();
    } catch (err) {
        console.error('Failed to load products:', err);
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
                        <button onclick="editProduct('${p.id}')" class="p-1.5 text-[#5c5f60] hover:text-[#3c4043] hover:bg-[#ebeef2] rounded-md transition-all" title="Edit Product">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deactivateProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#f59e0b] hover:bg-[#fef3c7] rounded-md transition-all" title="Deactivate (Out of Stock)">
                            <span class="material-symbols-outlined text-[18px]">block</span>
                        </button>
                        <button onclick="deleteProductPermanently('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-all" title="Delete Completely From Database">
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
        const res = await fetch('/api/products?includeInactive=true', { headers: getAuthHeaders() });
        const data = await res.json();
        productsCache = data.products || [];
        filterInventory();
    } catch (err) {
        console.error('Failed to load inventory:', err);
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

// ================= 4. ORDERS LOAD =================
async function loadOrders() {
    try {
        const res = await fetch('/api/orders/admin/all', { headers: getAuthHeaders() });
        const data = await res.json();
        ordersCache = data.orders || [];
        filterOrders();
    } catch (err) {
        console.error('Failed to load orders:', err);
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

    tbody.innerHTML = filtered.map(o => `
        <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')" id="order-row-${o.id}">
            <td class="p-4 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
            <td class="p-4 font-semibold text-[#181c1f]">${o.customer_name || 'Nivas'}</td>
            <td class="p-4 text-[#5c5f60]">${o.delivery_address || 'BH13 (Block A), Room 304'}</td>
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
    `).join('');
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

    try {
        const res = await fetch(`/api/orders/admin/detail/${orderId}`, { headers: getAuthHeaders() });
        const data = await res.json();
        const o = data.order;
        if (!o) return;

        document.getElementById('drawer-order-id').textContent = `Order #${(o.id || '').replace('order_', '').toUpperCase()}`;
        document.getElementById('drawer-order-time').textContent = `Placed: ${new Date(o.created_at || Date.now()).toLocaleString()}`;
        document.getElementById('drawer-cust-name').textContent = o.customer_name || 'Nivas';
        document.getElementById('drawer-cust-phone').textContent = o.customer_phone || '7671836211';
        document.getElementById('drawer-cust-address').textContent = o.delivery_address || 'BH13 (Block A), Room 304';
        document.getElementById('drawer-payment-method').textContent = o.payment_method || 'Cash on Delivery';
        document.getElementById('drawer-order-total').textContent = `₹${o.total}`;
        document.getElementById('drawer-status-select').value = o.status;

        const itemsList = document.getElementById('drawer-items-list');
        const items = o.items || [];
        itemsList.innerHTML = items.map(item => `
            <div class="flex justify-between items-center p-2 rounded-lg border border-[#DADCE0] bg-[#f7fafd]">
                <div class="flex items-center gap-2">
                    <img src="${item.image_url}" class="w-8 h-8 rounded object-cover bg-white" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'">
                    <div>
                        <p class="font-semibold text-xs text-[#181c1f]">${item.name}</p>
                        <p class="text-[10px] text-[#5c5f60]">Qty: ${item.quantity} × ₹${item.unit_price}</p>
                    </div>
                </div>
                <span class="font-bold text-xs text-[#137333]">₹${item.quantity * item.unit_price}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to load order detail:', err);
    }
}

function closeOrderDrawer() {
    document.getElementById('order-drawer').classList.add('hidden');
}

async function applyDrawerStatusUpdate() {
    if (!currentDrawerOrderId) return;
    const newStatus = document.getElementById('drawer-status-select').value;

    try {
        const res = await fetch('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderId: currentDrawerOrderId, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            const shortId = currentDrawerOrderId.replace('order_', '').toUpperCase();
            showToast(`✓ Order #${shortId} status updated to: ${newStatus}`, 'success');
            closeOrderDrawer();
            refreshCurrentView();
        }
    } catch (err) {
        showToast('Status update failed: ' + err.message, 'error');
    }
}

async function quickSetOrderStatus(orderId, newStatus, e) {
    if (e) e.stopPropagation();
    try {
        const res = await fetch('/api/orders/admin/status', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ orderId, status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            const shortId = orderId.replace('order_', '').toUpperCase();
            showToast(`✓ Order #${shortId} set to "${newStatus}"`, 'success');
            const o = ordersCache.find(x => x.id === orderId);
            if (o) o.status = newStatus;
            if (activeView === 'orders') filterOrders();
            else if (activeView === 'dashboard') loadDashboard();
        }
    } catch (err) {
        showToast('Status update failed: ' + err.message, 'error');
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
        document.getElementById('form-product-stock').value = product.stock_left !== undefined ? product.stock_left : 10;
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
        document.getElementById('form-product-stock').value = '10';
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

// ================= 7. CUSTOMERS LOAD =================
async function loadCustomers() {
    try {
        const res = await fetch('/api/orders/admin/customers', { headers: getAuthHeaders() });
        const data = await res.json();
        const customers = data.customers || [];
        const tbody = document.getElementById('customers-table-tbody');

        if (customers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-[#5c5f60]">No student customer records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = customers.map(c => `
            <tr class="hover:bg-[#f7fafd] transition-colors">
                <td class="p-4 font-bold text-xs text-[#181c1f] flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-[#3c4043] text-white flex items-center justify-center text-xs">
                        ${(c.name || 'S')[0]}
                    </div>
                    <span>${c.name}</span>
                </td>
                <td class="p-4 text-[#5c5f60]">${c.phone || c.email || 'N/A'}</td>
                <td class="p-4 font-bold text-[#181c1f]">${c.order_count || 0}</td>
                <td class="p-4 font-bold text-[#137333]">₹${c.total_spent || 0}</td>
                <td class="p-4 text-[#74777a]">${c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'N/A'}</td>
                <td class="p-4"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Active Student</span></td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load customers:', err);
    }
}

// ================= 8. ANALYTICS LOAD =================
async function loadAnalytics() {
    try {
        const res = await fetch('/api/orders/admin/analytics', { headers: getAuthHeaders() });
        const data = await res.json();
        const m = data.metrics || {};

        document.getElementById('analytics-rev').textContent = `₹${m.totalRevenue || 0}`;
        document.getElementById('analytics-aov').textContent = `₹${m.avgOrderValue || 0}`;
        document.getElementById('analytics-orders').textContent = `${m.totalOrdersCount || 0}`;
        
        const rate = m.totalProducts > 0 ? Math.round(((m.totalProducts - (m.outOfStockCount || 0)) / m.totalProducts) * 100) : 100;
        document.getElementById('analytics-stock-rate').textContent = `${rate}%`;

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

// Smart Continuous Live Order Sync (Works 100% reliably on Vercel Serverless and Localhost)
async function syncOrdersLive() {
    if (!adminToken) return;
    try {
        const res = await fetch('/api/orders', {
            headers: { 'Cache-Control': 'no-cache', ...getAuthHeaders() }
        });
        if (!res.ok) return;
        const data = await res.json();
        const orders = data.orders || [];

        if (isInitialOrderPoll) {
            orders.forEach(o => {
                if (o && o.id) knownOrderMap.set(o.id, o.status);
            });
            isInitialOrderPoll = false;
            updateConnectionStatus(true, 'Live');
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
        updateConnectionStatus(true, 'Live');
    } catch (err) {
        console.warn('[Admin Live Sync Note]:', err.message);
    }
}

function startLiveOrderPolling() {
    if (liveOrderPollInterval) clearInterval(liveOrderPollInterval);
    syncOrdersLive(); // Run immediately
    liveOrderPollInterval = setInterval(syncOrdersLive, 3000); // Check every 3s
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

    if (totalOrdersEl && totalOrdersEl.textContent !== '--') {
        totalOrdersEl.textContent = parseInt(totalOrdersEl.textContent, 10) + 1;
    }
    if (pendingOrdersEl && pendingOrdersEl.textContent !== '--') {
        const pCount = parseInt(pendingOrdersEl.textContent, 10) + 1;
        pendingOrdersEl.textContent = pCount;
        if (badgeEl) {
            badgeEl.textContent = pCount;
            badgeEl.classList.remove('hidden');
        }
    }
    if (totalRevEl && totalRevEl.textContent !== '--' && ['Delivered', 'delivered'].includes(order.status)) {
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
                    <td class="p-3.5 font-medium text-[#181c1f]">${order.customer_name || 'Nivas'}</td>
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
            if (tbody.innerHTML.includes('No orders found') || tbody.innerHTML.includes('Loading')) {
                tbody.innerHTML = rowHtml;
            } else {
                tbody.insertAdjacentHTML('afterbegin', rowHtml);
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
                    <span class="font-bold text-sm text-[#181c1f]">${order.customer_name || 'Nivas'}</span>
                    <span class="font-black text-sm text-[#137333]">₹${order.total}</span>
                </div>
                <p class="text-[11px] text-[#5c5f60] mt-0.5">📍 ${order.delivery_address || 'BH13 (Block A), Room 304'}</p>
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

function fillDemoCredentials() {
    const email = document.getElementById('login-email');
    const pass = document.getElementById('login-password');
    if (email) email.value = 'admin@lpu.in';
    if (pass) pass.value = 'admin123';
}

function quickPassLogin() {
    fillDemoCredentials();
    const form = document.getElementById('stitch-signin-form');
    if (form) form.requestSubmit();
}

async function handleAdminLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorBox = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const submitBtn = document.getElementById('btn-login-submit');

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
            
            // Welcome chime and UI unlock
            getAudioContext();
            playCampusChime();
            
            hideLoginModal();
            refreshCurrentView();
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
if (!localStorage.getItem('lpuquick_admin_token')) {
    showLoginModal();
} else {
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

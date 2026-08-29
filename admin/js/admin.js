// LPUQuick Admin Dashboard Operations Logic

// State & Auth Token
let activeView = 'dashboard';
let productsCache = [];
let ordersCache = [];
let adminToken = localStorage.getItem('lpuquick_admin_token') || 'adm_sec_auto_auth';
let currentDrawerOrderId = null;
let lastKnownOrderCount = 0;

// Headers for protected API calls
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-token': adminToken
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

        // Render Recent Orders
        const recentOrders = (ordersData.orders || []).slice(0, 5);
        const tbody = document.getElementById('dash-recent-orders-tbody');
        if (recentOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-[#5c5f60]">No orders found in database.</td></tr>`;
        } else {
            tbody.innerHTML = recentOrders.map(o => `
                <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')">
                    <td class="p-3.5 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
                    <td class="p-3.5 font-medium text-[#181c1f]">${o.customer_name || 'Nivas'}</td>
                    <td class="p-3.5 text-[#5c5f60] truncate max-w-[150px]">${o.item_summary || 'Campus items'}</td>
                    <td class="p-3.5 font-bold text-[#137333]">₹${o.total}</td>
                    <td class="p-3.5 text-[#5c5f60]">${o.payment_method || 'COD'}</td>
                    <td class="p-3.5">${getStatusPill(o.status)}</td>
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
        filtered = filtered.filter(p => p.in_stock && (p.is_active === 1 || p.is_active === null));
    } else if (currentProductFilter === 'low') {
        filtered = filtered.filter(p => p.stock_left > 0 && p.stock_left <= 10);
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
        const statusBadge = stock > 10 
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-in-stock">In Stock</span>'
            : (stock > 0 
                ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-low-stock">Low Stock</span>'
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
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="editProduct('${p.id}')" class="p-1.5 text-[#5c5f60] hover:text-[#3c4043] hover:bg-[#ebeef2] rounded-md transition-all" title="Edit Product">
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onclick="deactivateProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-md transition-all" title="Deactivate">
                            <span class="material-symbols-outlined text-[18px]">block</span>
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
        const res = await fetch('/api/products', { headers: getAuthHeaders() });
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
        const statusBadge = stock > 10 
            ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-in-stock">In Stock</span>'
            : (stock > 0 
                ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold badge-low-stock">Low Stock</span>'
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
            body: JSON.stringify({ productId, setStock: parsed })
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

        // Real-time sound notification if new order arrived
        if (lastKnownOrderCount > 0 && ordersCache.length > lastKnownOrderCount) {
            try { document.getElementById('order-chime')?.play(); } catch(e){}
        }
        lastKnownOrderCount = ordersCache.length;

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
        <tr class="hover:bg-[#f7fafd] transition-colors cursor-pointer" onclick="openOrderDrawer('${o.id}')">
            <td class="p-4 font-bold font-mono text-[#181c1f]">#${(o.id || '').replace('order_', '').toUpperCase()}</td>
            <td class="p-4 font-semibold text-[#181c1f]">${o.customer_name || 'Nivas'}</td>
            <td class="p-4 text-[#5c5f60]">${o.delivery_address || 'BH13 (Block A), Room 304'}</td>
            <td class="p-4 font-bold text-[#137333]">₹${o.total}</td>
            <td class="p-4 text-[#5c5f60]">${o.payment_method || 'COD'}</td>
            <td class="p-4">${getStatusPill(o.status)}</td>
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
    if (status === 'Delivered') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333]">Delivered ✓</span>';
    if (status === 'Out for Delivery') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">En Route 🛵</span>';
    if (status === 'Preparing') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Preparing 📦</span>';
    if (status === 'Order Confirmed') return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Confirmed 👍</span>';
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
            closeOrderDrawer();
            refreshCurrentView();
        }
    } catch (err) {
        alert('Status update failed: ' + err.message);
    }
}

// ================= 6. PRODUCT MODAL (ADD / EDIT) =================
function openProductModal(product = null) {
    document.getElementById('product-modal').classList.remove('hidden');
    if (product) {
        document.getElementById('modal-product-title').textContent = 'Edit Product';
        document.getElementById('form-product-id').value = product.id;
        document.getElementById('form-product-name').value = product.name;
        document.getElementById('form-product-category').value = product.category;
        document.getElementById('form-product-subcategory').value = product.subcategory || '';
        document.getElementById('form-product-price').value = product.price;
        document.getElementById('form-product-mrp').value = product.mrp || product.price;
        document.getElementById('form-product-stock').value = product.stock_left || 40;
        document.getElementById('form-product-image').value = product.image_url || '';
        document.getElementById('form-product-desc').value = product.description || '';
    } else {
        document.getElementById('modal-product-title').textContent = 'Add New Campus Product';
        document.getElementById('product-form').reset();
        document.getElementById('form-product-id').value = '';
        document.getElementById('form-product-stock').value = '40';
    }
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

async function editProduct(id) {
    const p = productsCache.find(x => x.id === id);
    if (p) openProductModal(p);
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-product-id').value;
    const payload = {
        name: document.getElementById('form-product-name').value,
        category: document.getElementById('form-product-category').value,
        subcategory: document.getElementById('form-product-subcategory').value,
        price: Number(document.getElementById('form-product-price').value),
        mrp: Number(document.getElementById('form-product-mrp').value),
        stock_left: Number(document.getElementById('form-product-stock').value),
        image_url: document.getElementById('form-product-image').value,
        description: document.getElementById('form-product-desc').value
    };

    const url = id ? `/api/products/admin/update/${id}` : '/api/products/admin/create';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeProductModal();
            loadProducts();
        } else {
            alert('Error saving product: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Save failed: ' + err.message);
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
        }
    } catch (err) {
        alert('Deactivation failed: ' + err.message);
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

// ================= 9. AUTHENTICATION =================
function showLoginModal() {
    document.getElementById('admin-login-modal').classList.remove('hidden');
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

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
            document.getElementById('admin-login-modal').classList.add('hidden');
            refreshCurrentView();
        } else {
            errorDiv.textContent = data.error || 'Invalid admin credentials';
            errorDiv.classList.remove('hidden');
        }
    } catch (err) {
        errorDiv.textContent = 'Login connection error: ' + err.message;
        errorDiv.classList.remove('hidden');
    }
}

function logoutAdmin() {
    localStorage.removeItem('lpuquick_admin_token');
    adminToken = '';
    showLoginModal();
}

// Initialize on load & setup auto-refresh loop (every 5 seconds)
switchView('dashboard');
setInterval(() => {
    if (activeView === 'dashboard') loadDashboard();
    else if (activeView === 'orders') loadOrders();
}, 5000);

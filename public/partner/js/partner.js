/**
 * LPUQuick Partner Portal Controller
 */

let currentPartner = null;
let currentHostelScope = 'ALL';
let currentDateFilter = 'today';
let dashboardState = null;

// =========================================================================
// INITIALIZATION & AUTHENTICATION
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('lpuquick_partner_token');
    if (token) {
        initPartnerSession();
    } else {
        showAuthView();
    }
});

function showAuthView() {
    document.getElementById('partner-auth-view').classList.remove('hidden');
    document.getElementById('partner-dashboard-view').classList.add('hidden');
    if (window.LpuQuickTurnstile) {
        window.LpuQuickTurnstile.mount('partner-turnstile-container', { action: 'partner_login', theme: 'light' }).catch(() => {});
    }
}

function showDashboardView() {
    document.getElementById('partner-auth-view').classList.add('hidden');
    document.getElementById('partner-dashboard-view').classList.remove('hidden');
}

function togglePasswordVisibility(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
}

function showPartnerToast(message, type = 'info') {
    const container = document.getElementById('partner-toast');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-rose-600 text-white' : (type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white');
    toast.className = `p-3.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 transform transition-all duration-300 pointer-events-auto ${bgClass}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-sm">${type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info')}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

async function partnerFetch(endpoint, options = {}) {
    const token = localStorage.getItem('lpuquick_partner_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-partner-token'] = token;
    }

    const res = await fetch(endpoint, { credentials: 'include', ...options, headers });
    if (res.status === 401) {
        handlePartnerLogout();
        throw new Error('Session expired. Please sign in again.');
    }
    return res;
}

async function handlePartnerLogin(e) {
    e.preventDefault();
    const email = document.getElementById('partner-email').value.trim();
    const password = document.getElementById('partner-password').value;
    const btn = document.getElementById('partner-login-btn');
    const errBox = document.getElementById('login-error-box');
    const errText = document.getElementById('login-error-text');

    errBox.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block animate-spin mr-2">◌</span> Verifying credentials...`;

    try {
        let turnstileToken = null;
        if (window.LpuQuickTurnstile) {
            const tsCheck = await window.LpuQuickTurnstile.ensureToken('partner-turnstile-container', { action: 'partner_login', theme: 'light' });
            turnstileToken = tsCheck.token;
        }

        const headers = { 'Content-Type': 'application/json' };
        if (turnstileToken) headers['x-turnstile-token'] = turnstileToken;

        const res = await fetch('/api/partner/login', {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, password, turnstileToken: turnstileToken || undefined })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Authentication failed');
        }

        localStorage.setItem('lpuquick_partner_token', data.token);
        currentPartner = data.partner;
        showPartnerToast(`Welcome back, ${data.partner.name}!`, 'success');
        initPartnerSession();
    } catch (err) {
        errText.textContent = err.message;
        errBox.classList.remove('hidden');
    } finally {
        if (window.LpuQuickTurnstile) {
            window.LpuQuickTurnstile.reset('partner-turnstile-container');
        }
        btn.disabled = false;
        btn.innerHTML = `<span>Sign In to Dashboard</span><span class="material-symbols-outlined text-sm">arrow_forward</span>`;
    }
}

function handlePartnerLogout() {
    localStorage.removeItem('lpuquick_partner_token');
    currentPartner = null;
    showAuthView();
    showPartnerToast('Signed out successfully');
}

// =========================================================================
// DASHBOARD CONTROLLER & DATA BINDING
// =========================================================================

async function initPartnerSession() {
    try {
        const res = await partnerFetch('/api/partner/profile');
        const data = await res.json();
        if (!data.success || !data.partner) {
            handlePartnerLogout();
            return;
        }

        currentPartner = data.partner;
        renderPartnerIdentity();
        populateHostelDropdown(currentPartner.assigned_hostels || []);
        showDashboardView();
        await refreshDashboard();
    } catch (e) {
        console.error('Session init error:', e);
        showAuthView();
    }
}

function renderPartnerIdentity() {
    if (!currentPartner) return;
    document.getElementById('partner-name-display').textContent = `${currentPartner.name} • ${currentPartner.email}`;
    document.getElementById('partner-code-badge').textContent = currentPartner.partner_id || 'LPU-PTR';

    const assigned = currentPartner.assigned_hostels || [];
    const text = assigned.length > 0 ? assigned.join(', ') : 'None';
    document.getElementById('header-hostels-text').textContent = `Assigned: ${text}`;
    document.getElementById('kpi-assigned-hostels').textContent = `${assigned.length} Hostel${assigned.length === 1 ? '' : 's'}`;
    document.getElementById('kpi-assigned-list').textContent = text;
}

function populateHostelDropdown(hostels) {
    const select = document.getElementById('partner-hostel-select');
    select.innerHTML = '<option value="ALL">🏢 All Assigned Hostels (Combined)</option>';

    hostels.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = `Hostel ${h}`;
        select.appendChild(opt);
    });

    select.value = currentHostelScope;
}

function onHostelScopeChange(val) {
    currentHostelScope = val;
    refreshDashboard();
}

function setDateRange(filterKey) {
    currentDateFilter = filterKey;
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === filterKey) {
            btn.className = 'date-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-xs';
        } else {
            btn.className = 'date-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 text-slate-700 hover:bg-slate-200';
        }
    });

    const labels = {
        today: 'Period: Today (Live IST)',
        yesterday: 'Period: Yesterday',
        last_7_days: 'Period: Last 7 Days',
        last_30_days: 'Period: Last 30 Days',
        this_month: 'Period: This Month',
        all_time: 'Period: All Time Records'
    };
    document.getElementById('kpi-period-label').textContent = labels[filterKey] || 'Period: Custom';

    refreshDashboard();
}

async function refreshDashboard() {
    try {
        let endpoint = `/api/partner/hostel-data?hostel_id=${encodeURIComponent(currentHostelScope)}&date_filter=${encodeURIComponent(currentDateFilter)}`;
        const res = await partnerFetch(endpoint);
        const json = await res.json();

        if (!res.ok || !json.success) {
            throw new Error(json.error || 'Failed to load hostel data');
        }

        dashboardState = json.data;

        // Also fetch global dashboard for today/monthly comparisons & investments
        const dashRes = await partnerFetch('/api/partner/dashboard');
        const dashJson = await dashRes.json();
        const globalData = dashJson.success ? dashJson.data : {};

        renderDashboardCards(dashboardState, globalData);
        renderReconciliationBreakdown(dashboardState);
        renderHostelMatrix(dashboardState.hostel_breakdown || {});
        renderStatementPreview(dashboardState, globalData);

        // Background fetch for other tabs
        loadInvestments();
        loadPayments();
    } catch (err) {
        console.error('refreshDashboard error:', err);
        showPartnerToast(err.message, 'error');
    }
}

function formatCurrency(val) {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function renderDashboardCards(data, globalData) {
    const kpis = globalData.kpis || {};

    // 12 KPI Cards:
    document.getElementById('kpi-today-orders').textContent = kpis.today_orders || 0;
    document.getElementById('kpi-total-orders').textContent = data.total_orders || 0;
    document.getElementById('kpi-completed-orders').textContent = data.completed_orders || 0;
    document.getElementById('kpi-today-revenue').textContent = formatCurrency(kpis.today_revenue || 0);
    document.getElementById('kpi-monthly-revenue').textContent = formatCurrency(kpis.monthly_revenue || 0);
    document.getElementById('kpi-total-revenue').textContent = formatCurrency(data.gross_revenue || 0);
    document.getElementById('kpi-total-expenses').textContent = formatCurrency(data.total_expenses || 0);
    document.getElementById('kpi-net-profit').textContent = formatCurrency(data.net_profit || 0);
    document.getElementById('kpi-partner-share').textContent = formatCurrency(data.partner_profit_share || 0);
    document.getElementById('kpi-total-investment').textContent = formatCurrency(kpis.total_investment || 0);
    document.getElementById('kpi-total-received').textContent = formatCurrency(kpis.total_amount_received || 0);
    document.getElementById('kpi-pending-payments').textContent = formatCurrency(kpis.pending_payments || 0);

    const sharePct = currentPartner?.profit_sharing_percentage || 50;
    document.getElementById('kpi-share-percentage-label').textContent = `Configured: ${sharePct}% Profit Share`;
}

function renderReconciliationBreakdown(data) {
    document.getElementById('breakdown-total-revenue').textContent = formatCurrency(data.gross_revenue || 0);
    document.getElementById('breakdown-cash-collection').textContent = formatCurrency(data.cash_collection || 0);
    document.getElementById('breakdown-online-collection').textContent = formatCurrency(data.online_collection || 0);

    document.getElementById('breakdown-product-costs').textContent = formatCurrency(data.product_costs || 0);
    document.getElementById('breakdown-delivery-expenses').textContent = formatCurrency(data.delivery_expenses || 0);
    document.getElementById('breakdown-packaging-expenses').textContent = formatCurrency(data.packaging_expenses || 0);
    document.getElementById('breakdown-payment-charges').textContent = formatCurrency(data.payment_charges || 0);
    document.getElementById('breakdown-other-expenses').textContent = formatCurrency(data.other_expenses || 0);
    document.getElementById('breakdown-total-expenses').textContent = formatCurrency(data.total_expenses || 0);
}

function renderHostelMatrix(breakdown) {
    const tbody = document.getElementById('hostel-matrix-tbody');
    const keys = Object.keys(breakdown);
    document.getElementById('matrix-count-badge').textContent = `${keys.length} Hostels`;

    if (keys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-6 text-xs text-slate-400">No hostel records available for selected scope</td></tr>`;
        return;
    }

    tbody.innerHTML = keys.map(k => {
        const item = breakdown[k];
        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="font-black text-slate-900 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>${item.hostel_id}</span>
                </td>
                <td class="font-bold text-slate-700">
                    ${item.completed_orders} / ${item.total_orders}
                    <span class="block text-[10px] text-slate-400 font-normal">🛵 ${item.delivery_orders || 0} Del • 🛍️ ${item.takeaway_orders || 0} Tak</span>
                </td>
                <td class="font-black text-[#0066cc]">${formatCurrency(item.revenue)}</td>
                <td class="text-emerald-700 font-bold">${formatCurrency(item.cash_collection)}</td>
                <td class="text-blue-700 font-bold">${formatCurrency(item.online_collection)}</td>
                <td class="text-rose-700 font-bold">${formatCurrency(item.total_expenses)}</td>
                <td class="font-black text-emerald-800">${formatCurrency(item.net_profit)}</td>
                <td><span class="badge-pill bg-blue-50 text-blue-700 font-black">${item.profit_sharing_percentage || 50}%</span></td>
                <td class="font-black text-amber-900">${formatCurrency(item.partner_share || 0)}</td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// TAB SWITCHING & SUB-PAGES
// =========================================================================

function switchPartnerTab(tabId) {
    document.querySelectorAll('.partner-tab-btn').forEach(btn => {
        btn.classList.remove('border-[#0066cc]', 'text-[#0066cc]');
        btn.classList.add('border-transparent', 'text-slate-500');
    });
    document.querySelectorAll('.partner-tab-pane').forEach(pane => pane.classList.add('hidden'));

    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('border-transparent', 'text-slate-500');
        activeBtn.classList.add('border-[#0066cc]', 'text-[#0066cc]');
    }

    const activePane = document.getElementById(`partner-tab-${tabId}`);
    if (activePane) activePane.classList.remove('hidden');

    if (tabId === 'investments') loadInvestments();
    if (tabId === 'payments') loadPayments();
}

async function loadInvestments() {
    try {
        const res = await partnerFetch('/api/partner/investments');
        const json = await res.json();
        if (!json.success) return;

        const investments = json.data || [];
        document.getElementById('tab-investment-total').textContent = `Total: ${formatCurrency(json.summary?.total_investment || 0)}`;

        const tbody = document.getElementById('investments-tbody');
        if (investments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-xs text-slate-400">No investment records registered yet</td></tr>`;
            return;
        }

        tbody.innerHTML = investments.map(i => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-slate-800">${i.investment_date || '--'}</td>
                <td><span class="badge-pill ${i.investment_type === 'INITIAL' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">${i.investment_type}</span></td>
                <td class="font-bold text-slate-700">${i.hostel_id}</td>
                <td class="font-black text-slate-900">${formatCurrency(i.amount)}</td>
                <td class="font-mono text-[11px] text-slate-500">${i.transaction_reference || 'N/A'}</td>
                <td class="text-slate-600 text-xs">${i.description || 'Capital contribution'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.warn('loadInvestments error:', e);
    }
}

async function loadPayments() {
    try {
        const res = await partnerFetch('/api/partner/payments');
        const json = await res.json();
        if (!json.success) return;

        const payments = json.data || [];
        document.getElementById('tab-paid-badge').textContent = `Paid: ${formatCurrency(json.summary?.total_paid || 0)}`;
        document.getElementById('tab-pending-badge').textContent = `Pending: ${formatCurrency(json.summary?.pending_payment || 0)}`;

        const tbody = document.getElementById('payments-tbody');
        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-xs text-slate-400">No payment settlements recorded yet</td></tr>`;
            return;
        }

        tbody.innerHTML = payments.map(p => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-slate-800">${p.payment_date || '--'}</td>
                <td class="font-black text-emerald-700">${formatCurrency(p.amount)}</td>
                <td><span class="badge-pill bg-slate-100 text-slate-800 border border-slate-200">${p.payment_method}</span></td>
                <td class="font-mono text-[11px] text-slate-600 font-semibold">${p.transaction_id || 'N/A'}</td>
                <td class="text-slate-600 text-xs">${p.remarks || 'Partner settlement payout'}</td>
                <td><span class="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">CONFIRMED</span></td>
            </tr>
        `).join('');
    } catch (e) {
        console.warn('loadPayments error:', e);
    }
}

function renderStatementPreview(data, globalData) {
    if (!currentPartner) return;
    document.getElementById('stmt-generated-at').textContent = new Date().toLocaleString('en-IN');
    document.getElementById('stmt-partner-name').textContent = currentPartner.name;
    document.getElementById('stmt-partner-id').textContent = currentPartner.partner_id || 'LPU-PTR';
    document.getElementById('stmt-hostels').textContent = (currentPartner.assigned_hostels || []).join(', ');
    document.getElementById('stmt-share-pct').textContent = `${currentPartner.profit_sharing_percentage || 50}%`;

    const kpis = globalData.kpis || {};
    document.getElementById('stmt-gross-rev').textContent = formatCurrency(data.gross_revenue || 0);
    document.getElementById('stmt-expenses').textContent = formatCurrency(data.total_expenses || 0);
    document.getElementById('stmt-net-profit').textContent = formatCurrency(data.net_profit || 0);
    document.getElementById('stmt-partner-share').textContent = formatCurrency(data.partner_profit_share || 0);
    document.getElementById('stmt-investment').textContent = formatCurrency(kpis.total_investment || 0);
    document.getElementById('stmt-paid').textContent = formatCurrency(kpis.total_amount_received || 0);
    document.getElementById('stmt-pending').textContent = formatCurrency(kpis.pending_payments || 0);
}

// =========================================================================
// EXPORTS & PRINTING
// =========================================================================

function exportPartnerCSV() {
    if (!dashboardState || !currentPartner) {
        showPartnerToast('No statement data loaded to export', 'error');
        return;
    }

    const rows = [
        ['LPUQuick Partner Financial Statement'],
        ['Partner Name', currentPartner.name],
        ['Partner ID', currentPartner.partner_id || ''],
        ['Assigned Hostels', (currentPartner.assigned_hostels || []).join('; ')],
        ['Export Date', new Date().toISOString()],
        ['Period Filter', currentDateFilter],
        ['Hostel Scope', currentHostelScope],
        [],
        ['Metric', 'Amount (INR)'],
        ['Gross Delivered Revenue', dashboardState.gross_revenue || 0],
        ['Cash Collections', dashboardState.cash_collection || 0],
        ['Online Collections', dashboardState.online_collection || 0],
        ['Product Wholesale Costs', dashboardState.product_costs || 0],
        ['Delivery Expenses', dashboardState.delivery_expenses || 0],
        ['Packaging Expenses', dashboardState.packaging_expenses || 0],
        ['Payment Gateway Charges', dashboardState.payment_charges || 0],
        ['Other Operating Expenses', dashboardState.other_expenses || 0],
        ['Total Operating Costs', dashboardState.total_expenses || 0],
        ['Campus Net Profit', dashboardState.net_profit || 0],
        ['Partner Profit Share', dashboardState.partner_profit_share || 0],
        ['Owner Profit Share', dashboardState.owner_profit_share || 0]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LPUQuick_${currentPartner.partner_id || 'Partner'}_Statement_${currentDateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showPartnerToast('Financial statement CSV exported', 'success');
}

function printPartnerStatement() {
    window.print();
}

// Auto-refresh financial statistics every 120 seconds when visible (optimizes Vercel & Supabase free tier)
setInterval(() => {
    if (localStorage.getItem('lpuquick_partner_token') && !document.hidden) {
        refreshDashboard();
    }
}, 120000);

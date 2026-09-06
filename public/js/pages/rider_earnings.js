// LPUQuick Delivery Partner Hub & Earnings (₹3/Delivered Order)
// Matching Mobile Layout from Screenshots 1 & 2
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.__riderEarningsState = {
    period: 'weekly',
    weekOffset: 0,
    monthOffset: 0,
    selectedDay: null,
    isOnDuty: true,
    data: null
};

window.pages.rider_earnings = function () {
    return `
    <div class="min-h-screen bg-[#F8FAFD] text-[#181c1f] pb-24 font-sans select-none antialiased">
        <!-- Sticky Top Mobile App Bar (Screenshot 1) -->
        <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EBF0F7] px-4 py-3 flex items-center justify-between shadow-xs">
            <button type="button" onclick="window.history.length > 1 ? window.history.back() : window.location.hash = '#/settings'" class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#181c1f] active:scale-95 transition-transform" title="Back">
                <span class="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h1 class="font-black text-lg text-[#181c1f] tracking-tight">My Earnings</h1>
            <div class="flex items-center gap-1">
                <button type="button" onclick="window.openClientEarningsNotifModal()" class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#5c5f60] active:scale-95 transition-transform relative" title="Notifications">
                    <span class="material-symbols-outlined text-2xl">notifications</span>
                    <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500"></span>
                </button>
                <button type="button" onclick="window.openClientPartnerDrawer()" class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#181c1f] active:scale-95 transition-transform" title="Partner Menu">
                    <span class="material-symbols-outlined text-2xl">menu</span>
                </button>
            </div>
        </header>

        <main class="max-w-md mx-auto px-4 py-4 space-y-4">
            <!-- 1. Top KPI Cards Row -->
            <div class="grid grid-cols-2 gap-3">
                <!-- KPI Card 1: Today's Earnings -->
                <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                    <div>
                        <span class="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Today's Earnings</span>
                        <div id="client-kpi-today-earnings" class="text-2xl font-black text-[#0066cc] mt-1">₹0.00</div>
                    </div>
                    <div class="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                        <span class="text-[9px] text-[#64748b]">Daily Revenue</span>
                        <span id="client-kpi-rate-badge" class="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">₹3/Ord</span>
                    </div>
                </div>

                <!-- KPI Card 2: Completed Deliveries Today -->
                <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
                    <div>
                        <span class="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Completed Today</span>
                        <div id="client-kpi-today-completed" class="text-2xl font-black text-[#181c1f] mt-1">0</div>
                    </div>
                    <div class="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                        <span id="client-kpi-today-breakdown" class="text-[9px] text-[#64748b] truncate">0 Pending • 0 Cancelled</span>
                    </div>
                </div>
            </div>

            <!-- Active / Offline Status Toggle Card -->
            <div class="bg-white rounded-2xl p-3 border border-[#E2E8F0] shadow-sm flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span id="client-status-dot" class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span id="client-status-text" class="text-xs font-black text-[#181c1f]">Active (Accepting Orders)</span>
                </div>
                <button type="button" id="client-status-toggle-btn" onclick="window.toggleClientDutyStatus()" class="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer">
                    <span id="client-status-toggle-label">Switch to Offline</span>
                </button>
            </div>

            <!-- 2. Monthly Snapshot Card -->
            <div class="bg-gradient-to-r from-[#0066cc] to-[#004c99] text-white rounded-3xl p-4 shadow-md space-y-2 relative overflow-hidden">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Monthly Snapshot</span>
                    <span id="client-snapshot-month-name" class="text-xs font-bold text-blue-100">September 2026</span>
                </div>
                <p class="text-[10px] text-blue-100">Formula: <strong id="client-snapshot-formula" class="text-white">Monthly Revenue = Completed Deliveries × ₹3</strong></p>

                <div class="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/20 text-center pt-2">
                    <div>
                        <div class="text-[9px] text-blue-100 uppercase">Month Orders</div>
                        <div id="client-snapshot-deliveries" class="text-lg font-black text-white mt-0.5">0</div>
                    </div>
                    <div class="border-x border-white/20 px-1">
                        <div class="text-[9px] text-blue-100 uppercase">Accumulated Payout</div>
                        <div id="client-snapshot-payout" class="text-lg font-black text-emerald-300 mt-0.5">₹0.00</div>
                    </div>
                    <div>
                        <div class="text-[9px] text-blue-100 uppercase">Avg / Day</div>
                        <div id="client-snapshot-avg" class="text-lg font-black text-white mt-0.5">0.0</div>
                    </div>
                </div>
            </div>

            <!-- Period Toggle Pills (WEEKLY / MONTHLY) (Screenshot 1) -->
            <div class="grid grid-cols-2 p-1 bg-[#EDF2F7] rounded-2xl border border-[#E2E8F0] text-center text-xs font-black shadow-inner">
                <button type="button" id="client-tab-weekly" onclick="window.setClientEarningsPeriod('weekly')" class="py-2.5 rounded-xl bg-white text-[#0066cc] shadow-xs tracking-wider transition-all cursor-pointer">
                    WEEKLY
                </button>
                <button type="button" id="client-tab-monthly" onclick="window.setClientEarningsPeriod('monthly')" class="py-2.5 rounded-xl text-[#5c5f60] hover:text-[#181c1f] tracking-wider transition-all cursor-pointer">
                    MONTHLY
                </button>
            </div>

            <!-- Hero Earnings Card (Screenshot 1) -->
            <div class="bg-white rounded-3xl p-5 border border-[#E2E8F0] shadow-md text-center space-y-3 relative overflow-hidden">
                <!-- Soft blue top glow -->
                <div class="absolute -top-16 inset-x-0 h-32 bg-gradient-to-b from-[#EBF5FF] to-transparent pointer-events-none"></div>

                <!-- Date Range Navigator Pill -->
                <div class="relative z-10 flex items-center justify-center gap-2">
                    <button type="button" onclick="window.shiftClientEarningsDate(-1)" class="w-8 h-8 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5c5f60] font-black flex items-center justify-center text-lg active:scale-90 transition-all shadow-xs" title="Previous Period">
                        ‹
                    </button>
                    <span id="client-earnings-range-badge" class="px-3.5 py-1 rounded-full bg-[#E1F0FF] text-[#0066cc] font-black text-xs tracking-wider uppercase shadow-xs">
                        AUG 31 - SEP 06
                    </span>
                    <button type="button" onclick="window.openClientEarningsInfoModal()" class="w-6 h-6 rounded-full text-[#94a3b8] hover:text-[#0066cc] text-xs font-bold flex items-center justify-center" title="How earnings are calculated">
                        ⓘ
                    </button>
                    <button type="button" onclick="window.shiftClientEarningsDate(1)" class="w-8 h-8 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#5c5f60] font-black flex items-center justify-center text-lg active:scale-90 transition-all shadow-xs" title="Next Period">
                        ›
                    </button>
                </div>

                <!-- Grand Total Payout -->
                <div class="relative z-10 pt-1">
                    <h2 id="client-earnings-total" class="text-4xl sm:text-5xl font-black text-[#0066cc] tracking-tight">₹432.00</h2>
                </div>

                <!-- 3 Columns Subtotals Row (Screenshot 1) -->
                <div class="relative z-10 grid grid-cols-3 pt-4 border-t border-[#F1F5F9] divide-x divide-[#E2E8F0] text-center">
                    <div>
                        <div id="client-order-payout-val" class="font-black text-base text-[#181c1f]">₹432.00</div>
                        <div class="text-[11px] font-semibold text-[#64748b]">Order Payout</div>
                    </div>
                    <div>
                        <div id="client-incentives-val" class="font-black text-base text-[#181c1f]">₹0</div>
                        <div class="text-[11px] font-semibold text-[#64748b]">Incentives</div>
                    </div>
                    <div>
                        <div class="font-black text-base text-[#64748b]">-</div>
                        <div class="text-[11px] font-semibold text-[#64748b]">Others</div>
                    </div>
                </div>
            </div>

            <!-- 7-Day Vertical Bar Chart Card (Screenshot 1) -->
            <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-md">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-black text-[#181c1f] uppercase tracking-wider">Day-Wise Delivery Payout</span>
                    <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">₹3.00/Delivered</span>
                </div>
                <div class="h-48 pt-6 pb-2 relative flex items-end justify-between gap-1" id="client-bar-chart-container">
                    <!-- Dotted baseline -->
                    <div class="absolute bottom-7 inset-x-0 border-b border-dashed border-[#CBD5E1] pointer-events-none"></div>
                    <!-- Dynamic Bars will appear here -->
                </div>
            </div>

            <!-- Card 1: Order Payout (Screenshot 1) -->
            <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-md space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-sm text-[#181c1f]">Order Payout</h3>
                    <span class="px-3 py-1 rounded-full bg-[#181c1f] text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
                        <span id="client-badge-payout">₹432.00</span>
                        <span>→</span>
                    </span>
                </div>

                <div class="grid grid-cols-3 items-center text-center p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div>
                        <div id="client-stat-orders" class="text-2xl font-black text-[#181c1f]">144</div>
                        <div class="text-[10px] text-[#64748b] font-bold mt-0.5">Orders</div>
                    </div>
                    <div>
                        <div id="client-stat-single" class="text-2xl font-black text-[#181c1f]">130</div>
                        <div class="text-[10px] text-[#64748b] font-bold mt-0.5">Single Runs</div>
                    </div>
                    <div class="relative">
                        <span class="absolute -left-2 top-1.5 text-slate-400 font-bold text-xs">+</span>
                        <div id="client-stat-multi" class="text-2xl font-black text-[#181c1f]">14</div>
                        <div class="text-[10px] text-[#64748b] font-bold mt-0.5">Multi Runs</div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Incentive (Screenshot 1) -->
            <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-md space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-sm text-[#181c1f]">Incentive</h3>
                    <span class="px-2.5 py-0.5 rounded-full bg-[#181c1f] text-white text-xs font-bold">₹0</span>
                </div>

                <div class="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030]">
                    <span class="material-symbols-outlined text-xl shrink-0 mt-0.5">warning</span>
                    <div>
                        <p class="font-bold text-xs">Incentive not available yet, or still loading...</p>
                        <p class="text-[10px] text-[#718096] mt-0.5 font-medium">Deliver 20+ orders in a single calendar day to unlock ₹20 daily incentive.</p>
                    </div>
                </div>
            </div>

            <!-- 4. Recent Payout Ledger (Itemized Dates & Credited Wages) -->
            <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-md space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-black text-sm text-[#181c1f]">Recent Payout Ledger</h3>
                        <p class="text-[10px] text-[#64748b]">Itemized dates showing completed runs & payout credited</p>
                    </div>
                    <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">₹3/Ord</span>
                </div>

                <div id="client-ledger-container" class="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <div class="p-4 text-center text-slate-400 text-xs font-bold">Loading ledger...</div>
                </div>
            </div>

            <!-- Detailed Day-Wise Delivered Orders Breakdown List -->
            <div class="bg-white rounded-3xl p-4 border border-[#E2E8F0] shadow-md space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-sm text-[#181c1f]" id="client-orders-header">Delivered Orders Breakdown</h3>
                    <span id="client-orders-count-badge" class="text-xs bg-blue-50 text-[#0066cc] font-black px-2.5 py-1 rounded-full border border-blue-200">
                        144 Orders • ₹432.00
                    </span>
                </div>

                <div id="client-orders-list" class="space-y-2 max-h-80 overflow-y-auto pr-1">
                    <div class="p-6 text-center text-slate-400 text-xs font-bold">Loading delivered orders...</div>
                </div>
            </div>
        </main>

        <!-- Slide-Over Partner Drawer (Screenshot 2) -->
        <div id="client-partner-backdrop" onclick="window.closeClientPartnerDrawer()" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity opacity-0 pointer-events-none duration-300"></div>

        <aside id="client-partner-drawer" class="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col overflow-y-auto no-scrollbar">
            <!-- Top Profile Blue Header (Screenshot 2) -->
            <div class="bg-[#0066cc] text-white p-6 pb-5 space-y-4 shadow-md">
                <div class="flex items-center justify-between">
                    <div class="w-16 h-16 rounded-full bg-white p-1 shadow-md flex items-center justify-center">
                        <div class="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-[#0066cc]">
                            <span class="material-symbols-outlined text-3xl">sports_motorsports</span>
                        </div>
                    </div>
                    <button type="button" onclick="window.closeClientPartnerDrawer()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                <div class="space-y-1">
                    <div class="text-xs font-semibold text-blue-100 uppercase tracking-wider">Store</div>
                    <div class="text-lg font-black tracking-tight" id="client-drawer-store">66365 • BH13 Ground Hub</div>
                </div>

                <div class="space-y-0.5 pt-1 border-t border-white/20">
                    <div class="text-xs font-semibold text-blue-100 uppercase tracking-wider">Employee ID</div>
                    <div class="text-sm font-bold tracking-wide text-white/95" id="client-drawer-empid">2000516247_DPI66365</div>
                </div>

                <!-- Duty Shift Toggle Button -->
                <div class="pt-2">
                    <button type="button" id="client-duty-toggle-btn" onclick="window.toggleClientDutyStatus()" class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        <span id="client-duty-toggle-text">ON DUTY (Active)</span>
                    </button>
                </div>
            </div>

            <!-- Menu Items List (Screenshot 2) -->
            <nav class="p-3 space-y-1 text-[#181c1f] font-semibold text-sm flex-1">
                <!-- 1. My Shifts -->
                <button type="button" onclick="window.openClientPartnerShiftModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">calendar_month</span>
                    <span>My Shifts</span>
                </button>

                <!-- 2. Order History -->
                <a href="#/orders" onclick="window.closeClientPartnerDrawer()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">history</span>
                    <span>Order History</span>
                </a>

                <!-- 3. Profile -->
                <button type="button" onclick="window.openClientPartnerProfileModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">person</span>
                    <span>Profile</span>
                </button>

                <!-- 4. EARNINGS (Active Highlighted) -->
                <button type="button" onclick="window.closeClientPartnerDrawer()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-blue-50 text-[#0066cc] font-black text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#0066cc]">currency_rupee</span>
                    <span class="flex-1">EARNINGS</span>
                    <span class="text-[10px] bg-[#0066cc] text-white px-2 py-0.5 rounded-full font-bold">₹3/Ord</span>
                </button>

                <!-- 5. Referrals -->
                <button type="button" onclick="window.openClientPartnerReferralModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">group</span>
                    <span>Referrals</span>
                </button>

                <!-- 6. Notification -->
                <button type="button" onclick="window.openClientEarningsNotifModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">notifications</span>
                    <span class="flex-1">Notification</span>
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                </button>

                <!-- 7. File for Tax Refunds -->
                <button type="button" onclick="window.openClientTaxRefundModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">receipt_long</span>
                    <span>File for Tax Refunds</span>
                </button>

                <!-- 8. Help -->
                <button type="button" onclick="window.openClientPartnerHelpModal()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#F0F4F9] text-left transition-colors cursor-pointer">
                    <span class="material-symbols-outlined text-xl text-[#5c5f60]">support_agent</span>
                    <span>Help</span>
                </button>

                <!-- 9. Logout -->
                <div class="pt-2 border-t border-[#F0F4F9] mt-2">
                    <button type="button" onclick="window.logoutUser()" class="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-xl text-rose-600">logout</span>
                        <span class="font-black">Logout</span>
                    </button>
                </div>
            </nav>
        </aside>

        <!-- Dynamic Modal Container -->
        <div id="client-partner-modals"></div>
    </div>
    `;
};

window.pageInits.rider_earnings = async function () {
    window.fetchClientDeliveryEarnings();

    // Auto-sync in real-time when orders are dispatched or delivered
    if (!window.__riderEarningsListenerAdded) {
        window.__riderEarningsListenerAdded = true;
        window.addEventListener('order_updated', () => {
            if (window.location.hash.includes('rider-earnings')) {
                window.fetchClientDeliveryEarnings();
            }
        });
        window.addEventListener('orders_changed', () => {
            if (window.location.hash.includes('rider-earnings')) {
                window.fetchClientDeliveryEarnings();
            }
        });
    }
};

// Global Helpers for Client-Side Delivery Earnings Page
window.fetchClientDeliveryEarnings = async function () {
    try {
        const state = window.__riderEarningsState;
        let currentRider = null;
        try {
            const rawUser = localStorage.getItem('lpuquick_user');
            if (rawUser) {
                currentRider = JSON.parse(rawUser);
            }
        } catch (e) {}

        const riderId = currentRider?.id || currentRider?.phone || currentRider?.name || 'all';

        const queryParams = new URLSearchParams({
            period: state.period,
            weekOffset: state.weekOffset,
            monthOffset: state.monthOffset,
            riderId: riderId,
            _t: Date.now()
        });

        const res = await fetch(`/api/orders/delivery-earnings?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load');

        state.data = data;

        // Sync Rider Availability Duty Status
        if (typeof data.is_on_duty === 'boolean') {
            state.isOnDuty = data.is_on_duty;
            if (typeof window.updateClientDutyUI === 'function') {
                window.updateClientDutyUI(state.isOnDuty);
            }
        }

        // Sync Delivery Partner Profile & Drawer Info
        const drawerName = document.getElementById('client-drawer-rider-name');
        if (drawerName) {
            drawerName.textContent = currentRider?.name || (data.partners_summary?.[0]?.partner_name) || 'Campus Delivery Partner';
        }
        const drawerEmp = document.getElementById('client-drawer-empid');
        if (drawerEmp) {
            const empId = currentRider?.id ? `ID_${String(currentRider.id).slice(-8)}` : (data.partners_summary?.[0]?.partner_id || '2000516247_DPI66365');
            drawerEmp.textContent = empId;
        }

        // Active Shift in Duty Button
        const dutyText = document.getElementById('client-duty-toggle-text');
        if (dutyText && data.shifts_summary) {
            const currentShift = data.shifts_summary.find(s => s.is_current);
            if (currentShift && state.isOnDuty) {
                dutyText.textContent = `ON DUTY (${currentShift.title})`;
            }
        }

        // 1. Update Top KPI Cards
        const kpiTodayEarnings = document.getElementById('client-kpi-today-earnings');
        if (kpiTodayEarnings) {
            kpiTodayEarnings.textContent = `₹${(data.today_stats?.today_earnings || 0).toFixed(2)}`;
        }

        const activeRate = Number(data.rate_per_order) || 3.00;
        const rateBadge = document.getElementById('client-kpi-rate-badge');
        if (rateBadge) rateBadge.textContent = `₹${activeRate.toFixed(0)}/Ord`;

        const kpiTodayCompleted = document.getElementById('client-kpi-today-completed');
        if (kpiTodayCompleted) {
            kpiTodayCompleted.textContent = String(data.today_stats?.completed_today || 0);
        }

        const kpiTodayBreakdown = document.getElementById('client-kpi-today-breakdown');
        if (kpiTodayBreakdown) {
            const p = data.today_stats?.pending_today || 0;
            const c = data.today_stats?.cancelled_today || 0;
            kpiTodayBreakdown.textContent = `${p} Pending • ${c} Cancelled`;
        }

        // 2. Update Monthly Snapshot Card
        const snapshotMonthName = document.getElementById('client-snapshot-month-name');
        if (snapshotMonthName) {
            snapshotMonthName.textContent = data.monthly_stats?.month_name || 'September 2026';
        }

        const snapshotFormula = document.getElementById('client-snapshot-formula');
        if (snapshotFormula) {
            snapshotFormula.textContent = `Monthly Revenue = Completed Deliveries × ₹${activeRate.toFixed(2)}`;
        }

        const snapshotDeliveries = document.getElementById('client-snapshot-deliveries');
        if (snapshotDeliveries) {
            snapshotDeliveries.textContent = String(data.monthly_stats?.completed_month || 0);
        }

        const snapshotPayout = document.getElementById('client-snapshot-payout');
        if (snapshotPayout) {
            snapshotPayout.textContent = `₹${(data.monthly_stats?.monthly_payout || 0).toFixed(2)}`;
        }

        const snapshotAvg = document.getElementById('client-snapshot-avg');
        if (snapshotAvg) {
            snapshotAvg.textContent = `${data.monthly_stats?.avg_deliveries_per_day || 0}`;
        }

        // 3. Update Period Range Badge & Big Totals
        const rangeBadge = document.getElementById('client-earnings-range-badge');
        if (rangeBadge) rangeBadge.textContent = data.range_label || 'Current Period';

        const totalEl = document.getElementById('client-earnings-total');
        if (totalEl) totalEl.textContent = `₹${(data.grand_total || 0).toFixed(2)}`;

        const orderPayoutEl = document.getElementById('client-order-payout-val');
        if (orderPayoutEl) orderPayoutEl.textContent = `₹${(data.order_payout || 0).toFixed(2)}`;

        const badgePayout = document.getElementById('client-badge-payout');
        if (badgePayout) badgePayout.textContent = `₹${(data.order_payout || 0).toFixed(2)}`;

        const statOrders = document.getElementById('client-stat-orders');
        if (statOrders) statOrders.textContent = data.total_orders || 0;

        const statSingle = document.getElementById('client-stat-single');
        if (statSingle) statSingle.textContent = data.single_runs || 0;

        const statMulti = document.getElementById('client-stat-multi');
        if (statMulti) statMulti.textContent = data.multi_runs || 0;

        // Render Bar Chart
        window.renderClientBarChart(data.days || []);

        // Render Recent Payout Ledger
        window.renderClientLedger(data.recent_ledger || []);

        // Render Orders List
        window.renderClientOrdersList(data.all_orders || [], state.selectedDay);

    } catch (err) {
        console.error('[Client Earnings Error]:', err);
    }
};

window.renderClientLedger = function (ledger) {
    const container = document.getElementById('client-ledger-container');
    if (!container) return;

    if (!Array.isArray(ledger) || ledger.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs font-bold">No payout ledger records found.</div>';
        return;
    }

    let html = '';
    ledger.forEach(entry => {
        const isToday = entry.is_today;
        const rowBg = isToday ? 'bg-blue-50/70 border-blue-200' : 'bg-[#F8FAFC] border-[#E2E8F0]';
        const tag = isToday ? '<span class="text-[9px] bg-[#0066cc] text-white px-1.5 py-0.5 rounded font-black ml-1">TODAY</span>' : '';

        html += `
        <div class="p-3 ${rowBg} rounded-2xl border flex items-center justify-between gap-3 cursor-pointer hover:bg-blue-50/50 transition-colors" onclick="window.filterClientOrdersByDate('${entry.date}')" title="Click to view orders for ${entry.display_date}">
            <div>
                <div class="font-bold text-xs text-[#181c1f] flex items-center">
                    <span>${entry.display_date}</span>
                    ${tag}
                </div>
                <div class="text-[10px] text-[#64748b] mt-0.5">
                    ${entry.pending_deliveries > 0 ? `<span class="text-amber-600 font-semibold">${entry.pending_deliveries} Pending</span> • ` : ''}
                    ${entry.cancelled_deliveries > 0 ? `<span class="text-rose-600 font-semibold">${entry.cancelled_deliveries} Cancelled</span>` : '0 Cancelled'}
                </div>
            </div>
            <div class="text-right">
                <div class="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    +₹${(entry.amount_credited || 0).toFixed(2)}
                </div>
                <div class="text-[10px] text-[#64748b] mt-1 font-bold">${entry.completed_deliveries} Runs • Credited</div>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
};

window.filterClientOrdersByDate = function (dateStr) {
    const state = window.__riderEarningsState;
    if (state.selectedDay === dateStr) {
        state.selectedDay = null;
    } else {
        state.selectedDay = dateStr;
    }
    if (state.data) {
        window.renderClientOrdersList(state.data.all_orders || [], state.selectedDay);
    }
};

window.updateClientDutyUI = function (isOnDuty) {
    const dot = document.getElementById('client-status-dot');
    const txt = document.getElementById('client-status-text');
    const btn = document.getElementById('client-status-toggle-btn');
    const label = document.getElementById('client-status-toggle-label');

    const drawerBtn = document.getElementById('client-duty-toggle-btn');
    const drawerTxt = document.getElementById('client-duty-toggle-text');

    if (isOnDuty) {
        if (dot) dot.className = 'w-3 h-3 rounded-full bg-emerald-500 animate-pulse';
        if (txt) txt.textContent = 'Active (Accepting Orders)';
        if (btn) btn.className = 'px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer';
        if (label) label.textContent = 'Switch to Offline';

        if (drawerBtn) drawerBtn.className = 'w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer';
        if (drawerTxt) drawerTxt.textContent = 'ON DUTY (Active)';
    } else {
        if (dot) dot.className = 'w-3 h-3 rounded-full bg-slate-400';
        if (txt) txt.textContent = 'Offline (On Break)';
        if (btn) btn.className = 'px-3 py-1 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer';
        if (label) label.textContent = 'Switch to Active';

        if (drawerBtn) drawerBtn.className = 'w-full py-2 px-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer';
        if (drawerTxt) drawerTxt.textContent = 'OFF DUTY (Paused)';
    }
};

window.toggleClientDutyStatus = async function () {
    const state = window.__riderEarningsState;
    state.isOnDuty = !state.isOnDuty;
    const newStatus = state.isOnDuty ? 'Active' : 'Offline';

    window.updateClientDutyUI(state.isOnDuty);

    let currentRider = null;
    try {
        const rawUser = localStorage.getItem('lpuquick_user');
        if (rawUser) currentRider = JSON.parse(rawUser);
    } catch (e) {}

    const riderId = currentRider?.id || currentRider?.phone || currentRider?.name;

    try {
        const headers = { 'Content-Type': 'application/json' };
        const adminToken = localStorage.getItem('lpuquick_admin_token');
        if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

        const res = await fetch('/api/orders/delivery-duty-status', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                riderId: riderId,
                status: newStatus
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (data && typeof data.is_on_duty === 'boolean') {
                state.isOnDuty = data.is_on_duty;
                window.updateClientDutyUI(state.isOnDuty);
            }
        }
    } catch (err) {
        console.warn('[Duty Status POST Error]:', err);
    }

    if (state.isOnDuty) {
        if (window.showToast) window.showToast('🟢 Partner duty status: ACTIVE (Receiving Orders)', 'success');
    } else {
        if (window.showToast) window.showToast('⚪ Partner duty status: OFFLINE (Shift Paused - No Orders)', 'info');
    }
};

window.setClientEarningsPeriod = function (period) {
    const state = window.__riderEarningsState;
    state.period = period;
    state.weekOffset = 0;
    state.monthOffset = 0;
    state.selectedDay = null;

    const wBtn = document.getElementById('client-tab-weekly');
    const mBtn = document.getElementById('client-tab-monthly');
    if (wBtn && mBtn) {
        if (period === 'weekly') {
            wBtn.className = 'py-2.5 rounded-xl bg-white text-[#0066cc] shadow-xs tracking-wider transition-all cursor-pointer font-black';
            mBtn.className = 'py-2.5 rounded-xl text-[#5c5f60] hover:text-[#181c1f] tracking-wider transition-all cursor-pointer font-bold';
        } else {
            mBtn.className = 'py-2.5 rounded-xl bg-white text-[#0066cc] shadow-xs tracking-wider transition-all cursor-pointer font-black';
            wBtn.className = 'py-2.5 rounded-xl text-[#5c5f60] hover:text-[#181c1f] tracking-wider transition-all cursor-pointer font-bold';
        }
    }

    window.fetchClientDeliveryEarnings();
};

window.shiftClientEarningsDate = function (delta) {
    const state = window.__riderEarningsState;
    if (state.period === 'weekly') {
        state.weekOffset += delta;
    } else {
        state.monthOffset += delta;
    }
    state.selectedDay = null;
    window.fetchClientDeliveryEarnings();
};

window.renderClientBarChart = function (days) {
    const container = document.getElementById('client-bar-chart-container');
    if (!container) return;

    if (!Array.isArray(days) || days.length === 0) {
        container.innerHTML = '<div class="w-full text-center text-xs text-slate-400 py-10">No delivery data.</div>';
        return;
    }

    const maxPayout = Math.max(...days.map(d => d.payout), 1);
    const chartHeightPx = 120;
    const selectedDay = window.__riderEarningsState.selectedDay;

    let html = '';
    days.forEach(d => {
        const barHeightPx = Math.max(6, Math.round((d.payout / maxPayout) * chartHeightPx));
        const isSelected = selectedDay === d.date;

        let barBg = 'bg-[#8ec7f9] active:scale-95';
        let badgeColor = 'text-[#181c1f]';
        let labelColor = 'text-[#64748b]';
        let underline = '';

        if (d.is_today) {
            barBg = 'bg-[#0066cc]';
            badgeColor = 'text-[#0066cc] font-black';
            labelColor = 'text-[#0066cc] font-black';
            underline = '<div class="w-full h-1 bg-[#0066cc] rounded-full mt-1"></div>';
        }
        if (isSelected) {
            barBg = 'bg-[#0052a3] ring-2 ring-[#0066cc]';
        }

        html += `
        <div class="flex-1 flex flex-col items-center justify-end h-full z-10 cursor-pointer group" onclick="window.filterClientOrdersByDay('${d.date}')" title="${d.display_label}: ₹${d.payout}">
            <div class="text-[10px] font-bold ${badgeColor} mb-1">
                ₹${d.payout}
            </div>
            <div class="w-6 sm:w-8 rounded-t-xl ${barBg} transition-all duration-300" style="height: ${barHeightPx}px;"></div>
            <div class="pt-2 text-center w-full">
                <div class="text-[9px] sm:text-[10px] font-bold ${labelColor} truncate">${d.display_label}</div>
                ${underline}
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
};

window.filterClientOrdersByDay = function (dateStr) {
    const state = window.__riderEarningsState;
    if (state.selectedDay === dateStr) {
        state.selectedDay = null;
    } else {
        state.selectedDay = dateStr;
    }
    if (state.data) {
        window.renderClientBarChart(state.data.days || []);
        window.renderClientOrdersList(state.data.all_orders || [], state.selectedDay);
    }
};

window.renderClientOrdersList = function (orders, dayFilter) {
    const listEl = document.getElementById('client-orders-list');
    const headerEl = document.getElementById('client-orders-header');
    const badgeEl = document.getElementById('client-orders-count-badge');
    if (!listEl) return;

    let filtered = orders;
    if (dayFilter) {
        filtered = orders.filter(o => o.date === dayFilter);
        if (headerEl) headerEl.textContent = `Orders on ${dayFilter}`;
    } else {
        if (headerEl) headerEl.textContent = 'Delivered Orders Breakdown';
    }

    const deliveredOrders = filtered.filter(o => o.delivery_state === 'Completed' || o.status === 'delivered' || o.status === 'completed');
    const cancelledOrders = filtered.filter(o => o.delivery_state === 'Cancelled' || o.status === 'cancelled');
    const activeRate = Number(window.__riderEarningsState?.data?.rate_per_order) || 3.00;
    const totalEarned = deliveredOrders.reduce((sum, o) => sum + (typeof o.payout === 'number' ? o.payout : activeRate), 0).toFixed(2);

    if (badgeEl) {
        let badgeText = `${deliveredOrders.length} Delivered • ₹${totalEarned}`;
        if (cancelledOrders.length > 0) {
            badgeText += ` (${cancelledOrders.length} Cancelled)`;
        }
        badgeEl.textContent = badgeText;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                <span class="material-symbols-outlined text-2xl">receipt_long</span>
                <p class="text-xs font-bold mt-1">No orders on this date.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach(o => {
        const isCancelled = o.delivery_state === 'Cancelled' || o.status === 'cancelled';
        const isDelivered = o.delivery_state === 'Completed' || o.status === 'delivered' || o.status === 'completed';

        let iconBg = 'bg-blue-100 text-[#0066cc]';
        let iconName = 'check_circle';
        let badgeHtml = `<div class="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">+₹${(typeof o.payout === 'number' ? o.payout : activeRate).toFixed(2)}</div>`;
        let subtextHtml = `<div class="text-[10px] text-slate-500 font-semibold mt-1">Order: ₹${o.total}</div>`;

        if (isCancelled) {
            iconBg = 'bg-rose-100 text-rose-600';
            iconName = 'cancel';
            badgeHtml = `<div class="text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">Cancelled • ₹0.00</div>`;
            subtextHtml = `<div class="text-[10px] text-rose-600 font-semibold mt-1">Order: ₹${o.total} (₹0 payout)</div>`;
        } else if (!isDelivered) {
            iconBg = 'bg-amber-100 text-amber-600';
            iconName = 'schedule';
            badgeHtml = `<div class="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">Pending • ₹0.00</div>`;
            subtextHtml = `<div class="text-[10px] text-slate-500 font-semibold mt-1">Order: ₹${o.total} (Pending)</div>`;
        }

        html += `
        <div class="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 transition-colors">
            <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center font-bold text-xs shrink-0">
                    <span class="material-symbols-outlined text-base">${iconName}</span>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                        <span class="font-black text-xs text-slate-900">#${(o.id || '').slice(-8)}</span>
                        <span class="text-[10px] text-slate-500 font-semibold">${o.time || ''}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 truncate font-medium mt-0.5">${o.address || 'BH13 Campus'}</p>
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
};

// Drawer Controls
window.openClientPartnerDrawer = function () {
    const drawer = document.getElementById('client-partner-drawer');
    const backdrop = document.getElementById('client-partner-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');
        drawer.classList.remove('translate-x-full');
    }
};

window.closeClientPartnerDrawer = function () {
    const drawer = document.getElementById('client-partner-drawer');
    const backdrop = document.getElementById('client-partner-backdrop');
    if (drawer && backdrop) {
        backdrop.classList.remove('opacity-100');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        drawer.classList.add('translate-x-full');
    }
};



// Modals
window.openClientPartnerShiftModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">calendar_month</span>
                        My Shift Schedule
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-3 text-xs">
                    <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                        <div class="font-black text-[#0066cc]">Night Express Shift</div>
                        <div class="text-slate-600 font-semibold mt-1">🕒 06:00 PM – 02:00 AM (7 Days)</div>
                        <div class="text-slate-600 font-semibold">📍 Hub: BH13 Ground Floor Hub</div>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 space-y-1">
                        <div>• Payout: Fixed ₹3.00 for every delivered order.</div>
                        <div>• Real-time day-wise aggregation on dashboard.</div>
                    </div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
};

window.openClientPartnerProfileModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    const name = window.CURRENT_USER_NAME || 'Campus Delivery Runner';
    const email = window.CURRENT_USER_EMAIL || 'runner@lpuquick.com';
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">person</span>
                        Partner Profile
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div class="w-12 h-12 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-lg font-black shrink-0">
                        ${name.charAt(0)}
                    </div>
                    <div class="min-w-0">
                        <div class="font-black text-sm text-slate-900 truncate">${name}</div>
                        <div class="text-xs text-slate-500 truncate">${email}</div>
                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">Active Runner</span>
                    </div>
                </div>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between py-1.5 border-b border-slate-100">
                        <span class="text-slate-500">Employee ID</span>
                        <span class="font-bold">2000516247_DPI66365</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-slate-100">
                        <span class="text-slate-500">Rate / Delivered</span>
                        <span class="font-bold text-emerald-700">₹3.00</span>
                    </div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Done</button>
            </div>
        </div>
    `;
};

window.openClientPartnerReferralModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-purple-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-purple-600">group</span>
                        Refer a Friend
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center space-y-2">
                    <div class="text-xs text-purple-900 font-bold">Your Referral Code</div>
                    <div class="text-2xl font-black text-purple-700 tracking-widest bg-white p-2 rounded-xl border border-purple-200">RUNNER66365</div>
                    <p class="text-[11px] text-purple-800">Earn ₹100 direct cash bonus when a peer joins as runner and completes 20 deliveries!</p>
                </div>
                <button onclick="navigator.clipboard.writeText('RUNNER66365'); alert('Referral code copied!'); window.closeClientPartnerModal();" class="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs">Copy Referral Code</button>
            </div>
        </div>
    `;
};

window.openClientEarningsNotifModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-500">notifications</span>
                        Partner Notifications
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-2 text-xs">
                    <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                        <div class="font-bold text-blue-900">✨ ₹3.00 / Order Calculation Live</div>
                        <p class="text-blue-800 text-[11px] mt-0.5">Your delivery fee is automatically calculated and shown in real time.</p>
                    </div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
};

window.openClientTaxRefundModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">receipt_long</span>
                        TDS & Tax Slips
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-2 text-xs">
                    <p class="text-slate-600 font-medium">Under LPU campus student contractor guidelines, no TDS withholding is deducted.</p>
                    <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                        <div>Completed Deliveries: <span class="font-bold">144</span></div>
                        <div>Total Net Payout: <span class="font-bold text-emerald-700">₹432.00</span></div>
                        <div>TDS Deducted: <span class="font-bold">₹0.00</span></div>
                    </div>
                </div>
                <button onclick="alert('Statement downloaded'); window.closeClientPartnerModal();" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Download Slip</button>
            </div>
        </div>
    `;
};

window.openClientPartnerHelpModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-emerald-600">support_agent</span>
                        Hub Support
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <div class="font-bold">BH13 Ground Station Supervisor</div>
                    <div class="text-[11px]">Phone: +91 98765 43210 (Extension 66365)</div>
                    <div class="text-[11px]">Dispatch Location: Ground Floor Room 002</div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
};

window.openClientEarningsInfoModal = function () {
    const container = document.getElementById('client-partner-modals');
    if (!container) return;
    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-slate-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">info</span>
                        Payout Calculation
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div class="space-y-2.5 text-xs text-slate-600">
                    <div class="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                        <div class="font-bold text-[#0066cc]">₹3.00 Fixed Rate / Order</div>
                        <p class="text-[11px] mt-0.5">Every successfully delivered order automatically adds ₹3.00 to your earnings balance.</p>
                    </div>
                    <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <div class="font-bold text-slate-800">Day-Wise Statistics</div>
                        <p class="text-[11px] mt-0.5">Tap any bar in the chart to inspect orders and earnings for that specific calendar day.</p>
                    </div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Understood</button>
            </div>
        </div>
    `;
};

window.openClientPartnerShiftModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;

    const data = window.__riderEarningsState?.data;
    const shifts = data?.shifts_summary || [
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
            <div class="p-3 rounded-2xl ${borderClass} space-y-1.5">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-black text-xs text-[#181c1f]">${s.title}</div>
                        <div class="text-[10px] text-[#5c5f60] font-semibold">🕒 ${s.hours}</div>
                    </div>
                    ${activeBadge}
                </div>
                <div class="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
                    <span class="text-[#5c5f60] text-[11px]">Today: <strong>${s.completed_today} runs</strong></span>
                    <span class="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">+₹${(s.earned_wage || 0).toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-[#181c1f] flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">schedule</span>
                        My Delivery Shifts
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold">✕</button>
                </div>

                <div class="p-3 bg-gradient-to-r from-blue-900 to-[#0066cc] text-white rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <div class="text-[9px] text-blue-200 uppercase font-bold">Shift Earnings Today</div>
                        <div class="text-xl font-black">₹${totalWageToday.toFixed(2)}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[9px] text-blue-200 uppercase font-bold">Total Runs</div>
                        <div class="text-xl font-black">${totalDeliveriesToday} Orders</div>
                    </div>
                </div>

                <div class="space-y-2">
                    ${shiftsHtml}
                </div>

                <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                    <span class="material-symbols-outlined text-emerald-700 text-base">verified</span>
                    <span>₹${(Number(window.__riderEarningsState?.data?.rate_per_order) || 3.00).toFixed(2)} auto-credited on each delivered order</span>
                </div>

                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#181c1f] text-white font-bold text-xs">Close</button>
            </div>
        </div>
    `;
};

window.openClientPartnerProfileModal = function () {
    window.closeClientPartnerDrawer();
    const container = document.getElementById('client-partner-modals');
    if (!container) return;

    let user = null;
    try {
        const raw = localStorage.getItem('lpuquick_user');
        if (raw) user = JSON.parse(raw);
    } catch(e) {}

    const name = user?.name || 'Campus Delivery Partner';
    const phone = user?.phone || '+91 98765 43210';
    const partnerId = user?.id ? `ID_${String(user.id).slice(-8)}` : '2000516247_DPI66365';
    const activeRate = Number(window.__riderEarningsState?.data?.rate_per_order) || 3.00;

    container.innerHTML = `
        <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
                <div class="flex items-center justify-between border-b pb-3">
                    <h3 class="font-black text-base text-[#181c1f] flex items-center gap-2">
                        <span class="material-symbols-outlined text-[#0066cc]">person</span>
                        Partner Profile
                    </h3>
                    <button onclick="window.closeClientPartnerModal()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold">✕</button>
                </div>
                <div class="flex items-center gap-3 p-3 bg-blue-50/60 rounded-2xl border border-blue-200">
                    <div class="w-12 h-12 rounded-full bg-[#0066cc] text-white flex items-center justify-center text-lg font-black">
                        ${name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-black text-sm text-[#181c1f]">${name}</div>
                        <div class="text-[11px] text-[#5c5f60] font-semibold">${phone}</div>
                        <span class="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">Active Runner</span>
                    </div>
                </div>
                <div class="space-y-2 text-xs">
                    <div class="flex justify-between py-1.5 border-b border-slate-100">
                        <span class="text-slate-500">Partner ID</span>
                        <span class="font-bold text-[#181c1f] font-mono">${partnerId}</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-slate-100">
                        <span class="text-slate-500">Assigned Hub</span>
                        <span class="font-bold text-[#181c1f]">BH13 Ground Station</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-slate-100">
                        <span class="text-slate-500">Delivery Wage</span>
                        <span class="font-bold text-emerald-700">₹${activeRate.toFixed(2)} / Delivered Order</span>
                    </div>
                </div>
                <button onclick="window.closeClientPartnerModal()" class="w-full py-2.5 rounded-xl bg-[#0066cc] text-white font-bold text-xs">Done</button>
            </div>
        </div>
    `;
};

window.closeClientPartnerModal = function () {
    const container = document.getElementById('client-partner-modals');
    if (container) container.innerHTML = '';
};

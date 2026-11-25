// Sandbox UPI Payment Verification & Status Page (Strictly Test Mode — Never triggers real fulfillment)
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

function escapeSandboxHtml(str) {
    return String(str === undefined || str === null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function resolveSandboxLookupOrderId() {
    try {
        const hash = window.location.hash || '';
        const qIdx = hash.indexOf('?');
        if (qIdx !== -1) {
            const hp = new URLSearchParams(hash.slice(qIdx + 1));
            const hId = hp.get('client_order_id') || hp.get('order_id');
            if (hId) return hId.trim();
        }
        if (window.location.search) {
            const sp = new URLSearchParams(window.location.search);
            const sId = sp.get('client_order_id') || sp.get('order_id');
            if (sId) return sId.trim();
        }
        const stored = localStorage.getItem('lpuquick_last_sandbox_order');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.client_order_id) return String(parsed.client_order_id).trim();
        }
    } catch (e) {}
    return '';
}

function getSandboxStatusMeta(status) {
    const s = String(status || 'Pending').trim();
    if (s === 'Paid') {
        return {
            label: 'Verified Paid (Sandbox)',
            badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
            heroBg: 'from-emerald-500 to-teal-600',
            icon: 'verified',
            note: 'Gateway API / signed webhook verified payment. Real inventory and delivery workflows remain isolated.'
        };
    }
    if (s === 'Under review') {
        return {
            label: 'Under Review (Sandbox)',
            badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
            heroBg: 'from-sky-500 to-indigo-600',
            icon: 'manage_search',
            note: 'Payment submitted on simulated gateway and awaiting merchant UTR verification.'
        };
    }
    if (s === 'Failed') {
        return {
            label: 'Payment Failed (Sandbox)',
            badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
            heroBg: 'from-rose-500 to-red-600',
            icon: 'cancel',
            note: 'Simulated transaction failed or was declined on gateway.'
        };
    }
    if (s === 'Expired') {
        return {
            label: 'Expired / Timed Out (Sandbox)',
            badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/40',
            heroBg: 'from-slate-500 to-slate-700',
            icon: 'timer_off',
            note: 'Simulated UPI session expired or timed out before confirmation.'
        };
    }
    return {
        label: 'Pending Verification (Sandbox)',
        badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40',
        heroBg: 'from-amber-500 to-orange-600',
        icon: 'hourglass_top',
        note: 'Waiting for gateway confirmation or webhook delivery. Browser redirects alone never confirm payment.'
    };
}

window.pages.sandbox_payment = async function () {
    const orderId = resolveSandboxLookupOrderId();
    const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : '';

    return `
<div class="bg-background text-on-background min-h-screen pb-28">
    <header class="sticky top-2 z-40 px-3 sm:px-6 pt-1">
        <div class="dynamic-island-nav max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between shadow-2xl">
            <div class="flex items-center gap-3">
                <a href="#/checkout" class="clay-pill w-9 h-9 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-emerald transition-transform active:scale-95">
                    <span class="material-symbols-outlined text-lg">arrow_back</span>
                </a>
                <div>
                    <h1 class="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-tight">Sandbox Payment Status</h1>
                    <p class="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">Test Mode Only • No Real Charge</p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                SANDBOX
            </span>
        </div>
    </header>

    <main class="px-3 sm:px-6 max-w-2xl mx-auto pt-5 space-y-4">
        <div class="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <span class="material-symbols-outlined text-base text-amber-600 shrink-0 mt-0.5">science</span>
            <div>
                <p class="font-black">Isolated Sandbox Environment</p>
                <p class="text-[11px] opacity-90 mt-0.5">Redirect returns are untrusted hints only. Status shown below is verified server-to-server via signed webhooks and gateway status checks. Real inventory, carts, and deliveries are untouched.</p>
            </div>
        </div>

        <div id="sandbox-status-card-container" class="glass-panel card-pedestal rounded-3xl p-6 shadow-xl border border-[var(--glass-border)]">
            ${orderId ? `
            <div class="py-8 text-center space-y-3" id="sandbox-status-loading">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl animate-spin">sync</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white">Verifying Sandbox Payment...</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-mono">${escapeSandboxHtml(orderId)}</p>
            </div>
            ` : `
            <div class="py-8 text-center space-y-3">
                <div class="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                    <span class="material-symbols-outlined text-3xl">receipt_long</span>
                </div>
                <p class="text-sm font-black text-slate-900 dark:text-white">No Sandbox Order Selected</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Start a test payment from Checkout using the UPI / QR (Sandbox Test) method.</p>
                <div class="pt-2">
                    <a href="#/checkout" class="clay-btn clay-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white">
                        <span>Go to Checkout</span>
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
            </div>
            `}
        </div>

        <div id="sandbox-recent-orders-card" class="glass-panel card-pedestal rounded-3xl p-5 shadow-xl border border-[var(--glass-border)] space-y-3 ${userId ? '' : 'hidden'}">
            <div class="flex items-center justify-between pb-2 border-b border-[var(--glass-border)]">
                <h2 class="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base text-emerald-600">history</span>
                    <span>Recent Sandbox Test Transactions</span>
                </h2>
                <button type="button" id="btn-refresh-sandbox-history" class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                    Refresh List
                </button>
            </div>
            <div id="sandbox-history-list" class="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <p>Loading recent test orders...</p>
            </div>
        </div>
    </main>
</div>`;
};

window.pageInits.sandbox_payment = function () {
    const orderId = resolveSandboxLookupOrderId();
    const userId = typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : '';
    let autoRefreshCount = 0;
    let pollTimer = null;

    function clearPoll() {
        if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
        }
    }

    function renderOrderCard(resData) {
        const container = document.getElementById('sandbox-status-card-container');
        if (!container) return;

        if (!resData || !resData.success || !resData.order) {
            const errMsg = resData?.error || 'Could not retrieve sandbox payment status.';
            const retryable = Boolean(resData?.retryable !== false);
            container.innerHTML = `
                <div class="py-6 text-center space-y-3">
                    <div class="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-600 mx-auto flex items-center justify-center">
                        <span class="material-symbols-outlined text-3xl">error</span>
                    </div>
                    <h2 class="text-base font-black text-slate-900 dark:text-white">Verification Unavailable</h2>
                    <p class="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">${escapeSandboxHtml(errMsg)}</p>
                    <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
                        ${retryable && orderId ? `
                        <button type="button" id="btn-retry-sandbox-verify" class="clay-btn clay-btn-primary px-5 py-2.5 rounded-xl text-xs font-black text-white cursor-pointer flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-sm">refresh</span>
                            <span>Retry Verification</span>
                        </button>` : ''}
                        <a href="#/checkout" class="clay-card px-5 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                            Back to Checkout
                        </a>
                    </div>
                </div>
            `;
            document.getElementById('btn-retry-sandbox-verify')?.addEventListener('click', () => loadStatus(true));
            return;
        }

        const order = resData.order;
        const meta = getSandboxStatusMeta(order.status);
        const gatewaySyncWarning = (resData.gatewaySync && resData.gatewaySync.ok === false) ? `
            <div class="p-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <span class="material-symbols-outlined text-sm shrink-0 mt-0.5">cloud_off</span>
                <div>
                    <p class="font-black">Gateway Temporarily Unreachable</p>
                    <p class="mt-0.5">${escapeSandboxHtml(resData.gatewaySync.error || 'Showing last durably recorded status. Click Refresh Verification to retry.')}</p>
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="space-y-5">
                <div class="text-center space-y-2.5">
                    <div class="w-16 h-16 rounded-3xl bg-gradient-to-br ${meta.heroBg} text-white shadow-xl flex items-center justify-center mx-auto border border-white/40">
                        <span class="material-symbols-outlined text-3xl">${meta.icon}</span>
                    </div>
                    <div>
                        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black border ${meta.badgeBg}">
                            ${escapeSandboxHtml(meta.label)}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">${escapeSandboxHtml(meta.note)}</p>
                </div>

                ${gatewaySyncWarning}

                <div class="clay-card rounded-2xl p-4 space-y-2.5 text-xs">
                    <div class="flex justify-between items-center pb-2 border-b border-[var(--glass-border)]">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Client Order ID</span>
                        <span class="font-black font-mono text-slate-900 dark:text-white">${escapeSandboxHtml(order.client_order_id)}</span>
                    </div>
                    ${order.gateway_order_id ? `
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Gateway Order ID</span>
                        <span class="font-bold font-mono text-slate-800 dark:text-slate-200">${escapeSandboxHtml(order.gateway_order_id)}</span>
                    </div>` : ''}
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Verified Amount</span>
                        <span class="font-black text-sm text-emerald-700 dark:text-emerald-400">₹${escapeSandboxHtml(order.amount)} ${escapeSandboxHtml(order.currency || 'INR')}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Environment</span>
                        <span class="font-black text-amber-700 dark:text-amber-300 uppercase">sandbox (test: true)</span>
                    </div>
                    ${order.utr ? `
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Simulated UTR</span>
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${escapeSandboxHtml(order.utr)}</span>
                    </div>` : ''}
                    <div class="flex justify-between items-center pt-2 border-t border-[var(--glass-border)]">
                        <span class="text-slate-500 dark:text-slate-400 font-medium">Sandbox Fulfillment</span>
                        <span class="font-bold ${order.fulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}">
                            ${order.fulfilled ? 'Recorded (Isolated Only)' : 'Not Fulfilled'}
                        </span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-2.5">
                    <button type="button" id="btn-refresh-sandbox-status" class="clay-btn clay-btn-primary flex-1 py-3 px-4 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform">
                        <span class="material-symbols-outlined text-sm">sync</span>
                        <span>Refresh Verification</span>
                    </button>
                    ${order.payment_url && ['Pending', 'Under review'].includes(order.status) ? `
                    <a href="${escapeSandboxHtml(order.payment_url)}" class="clay-card flex-1 py-3 px-4 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 hover:bg-emerald-500/10 transition-colors">
                        <span class="material-symbols-outlined text-sm">open_in_new</span>
                        <span>Open Simulated Checkout</span>
                    </a>` : `
                    <a href="#/checkout" class="clay-card flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span>Back to Checkout</span>
                    </a>`}
                </div>
            </div>
        `;

        document.getElementById('btn-refresh-sandbox-status')?.addEventListener('click', () => {
            autoRefreshCount = 0;
            loadStatus(true);
        });
    }

    async function loadStatus(forceRefresh = true) {
        if (!orderId) return;
        const btn = document.getElementById('btn-refresh-sandbox-status');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span><span>Checking Gateway...</span>';
        }
        try {
            const res = await window.api.getSandboxPaymentStatus(orderId, forceRefresh);
            renderOrderCard(res);

            if (res?.order && ['Pending', 'Under review'].includes(res.order.status) && autoRefreshCount < 6) {
                clearPoll();
                autoRefreshCount++;
                pollTimer = setTimeout(() => {
                    const hash = (window.location.hash || '').toLowerCase();
                    const onPage = hash.startsWith('#/sandbox-payment') || window.location.pathname === '/sandbox-payment-return';
                    if (onPage && !document.hidden) {
                        loadStatus(true);
                    }
                }, 6000);
            }
        } catch (err) {
            renderOrderCard({
                success: false,
                retryable: true,
                error: err.message || 'Unable to verify payment status right now.'
            });
        }
    }

    async function loadHistory() {
        const listEl = document.getElementById('sandbox-history-list');
        if (!listEl || !userId) return;
        try {
            const res = await window.api.getSandboxOrders(userId);
            const orders = res?.orders || [];
            if (orders.length === 0) {
                listEl.innerHTML = '<p class="text-slate-400">No sandbox test orders recorded for this session yet.</p>';
                return;
            }
            listEl.innerHTML = orders.map(o => {
                const meta = getSandboxStatusMeta(o.status);
                return `
                    <a href="#/sandbox-payment?client_order_id=${encodeURIComponent(o.client_order_id)}" class="flex items-center justify-between p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-[var(--glass-border)] hover:border-emerald-500/40 transition-colors">
                        <div class="min-w-0">
                            <p class="font-black font-mono text-slate-900 dark:text-white truncate">${escapeSandboxHtml(o.client_order_id)}</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400">${escapeSandboxHtml(o.hostel_id || '')} • ${escapeSandboxHtml(o.order_mode || '')} • ₹${escapeSandboxHtml(o.amount)}</p>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ml-2 ${meta.badgeBg}">${escapeSandboxHtml(o.status)}</span>
                    </a>
                `;
            }).join('');
        } catch {
            listEl.innerHTML = '<p class="text-slate-400">Unable to load sandbox order history.</p>';
        }
    }

    document.getElementById('btn-refresh-sandbox-history')?.addEventListener('click', loadHistory);
    window.addEventListener('hashchange', clearPoll, { once: true });

    if (orderId) loadStatus(true);
    if (userId) loadHistory();
};

// Orders Page — Live 3-Minute GPS Tracking & Order History
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.orders = async function() {
    if (!window.isUserLoggedIn()) {
        return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Live Tracking & Orders</h1>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-md mx-auto pt-16 text-center space-y-6">
        <div class="w-20 h-20 rounded-full bg-emerald/10 text-emerald flex items-center justify-center mx-auto shadow-sm">
            <span class="material-symbols-outlined text-4xl">receipt_long</span>
        </div>
        <div class="space-y-2">
            <h2 class="text-xl sm:text-2xl font-bold text-on-surface">Sign In to Track Orders</h2>
            <p class="text-xs text-on-surface-variant max-w-xs mx-auto">
                Sign in with your Google or student account to view live 3-minute delivery tracking and your campus order history.
            </p>
        </div>
        <a href="#/signin" onclick="localStorage.setItem('lpuquick_redirect', '#/orders')" class="inline-flex items-center justify-center gap-2 bg-emerald text-white px-7 py-3.5 rounded-full font-bold text-xs shadow-md hover:bg-primary transition-all active:scale-95">
            <span>Continue with Google</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
    </main>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200 relative" href="#/cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2 bg-emerald text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/orders">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
    }

    const userId = window.CURRENT_USER_ID;
    const [ordersDataRes, activeDataRes] = await Promise.allSettled([
        window.api.getOrders(userId),
        window.api.getActiveOrder(userId)
    ]);

    const ordersData = ordersDataRes.status === 'fulfilled' ? ordersDataRes.value : { active: [], past: [] };
    const activeData = activeDataRes.status === 'fulfilled' ? activeDataRes.value : { active: null };

    const activeOrder = activeData?.active || (ordersData?.active && ordersData.active[0]) || null;
    const pastOrders = ordersData?.past || [];
    const savedRoom = localStorage.getItem('lpuquick_room') || window.currentRoom;
    const savedBlock = localStorage.getItem('lpuquick_block') || window.currentBlock || 'Block A';
    const hostelAddress = savedRoom ? `BH13 (${savedBlock}), Room ${savedRoom}` : 'BH13 (Block A)';
    const hostelShort = window.currentAddress || 'BH13';

    const pastRows = pastOrders.map(o => {
        const isCancelled = ['Cancelled', 'cancelled'].includes(o.status);
        const statusBadgeClass = isCancelled 
            ? 'bg-error/15 text-error border border-error/30' 
            : 'bg-emerald/10 text-emerald';
        return `
        <div class="glass-card rounded-2xl p-4 border border-glass-border shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div class="space-y-1">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-xs sm:text-sm text-on-surface">Order #${o.id.replace('order_', '')}</span>
                    <span class="text-[10px] ${statusBadgeClass} font-bold px-2 py-0.5 rounded-full capitalize">${o.status}</span>
                </div>
                <p class="text-xs text-on-surface-variant line-clamp-1">${o.item_names || 'Campus Groceries & Essentials'}</p>
                <p class="text-[11px] text-on-surface-variant">${new Date(o.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-variant/30">
                <span class="font-bold text-sm text-on-surface">₹${o.total}</span>
                <button data-order-id="${o.id}" class="bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 text-on-surface text-xs font-semibold px-3 py-1 rounded-full transition-all reorder-btn active:scale-95 cursor-pointer">
                    Reorder
                </button>
            </div>
        </div>
        `;
    }).join('');

    window.CURRENT_ACTIVE_ORDER_ID = activeOrder ? activeOrder.id : null;
    window.CURRENT_ACTIVE_ORDER_STATUS = activeOrder ? activeOrder.status : 'Order Placed';

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-32">
    <!-- TopAppBar -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-md z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined text-on-surface">arrow_back</span>
            </a>
            <h1 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Live Tracking & Orders</h1>
        </div>
        <div class="flex items-center gap-1 text-xs bg-emerald/10 text-emerald px-3 py-1 rounded-full font-bold">
            <span class="material-symbols-outlined text-sm animate-spin">sync</span>
            <span id="orders-live-indicator">Live Connected</span>
        </div>
    </header>

    <main class="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto pt-6 space-y-6">
        <!-- Active Order Live Tracking Section -->
        ${activeOrder ? `
        <section class="space-y-3" id="active-order-tracking-card" data-order-id="${activeOrder.id}">
            <div class="flex justify-between items-center flex-wrap gap-2">
                <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald animate-pulse"></span>
                    Live 3-Minute BH13 Campus Delivery
                </h2>
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-emerald/15 text-emerald font-extrabold px-3 py-1 rounded-full flex items-center gap-1" id="tracking-eta">
                        <span class="material-symbols-outlined text-xs">bolt</span>
                        <span id="tracking-eta-time">Status: ${activeOrder.status}</span>
                    </span>
                    <!-- Help Option Button (Visible ONLY when order is active) -->
                    <button type="button" id="btn-order-help" onclick="window.openOrderHelpModal()" class="text-xs bg-surface-container-high hover:bg-emerald/15 hover:text-emerald text-on-surface font-bold px-3 py-1 rounded-full border border-outline-variant/40 flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer z-30" title="Order Help & Support">
                        <span class="material-symbols-outlined text-sm text-emerald">help</span>
                        <span>Help</span>
                    </button>
                </div>
            </div>
            <div class="glass-card rounded-3xl overflow-hidden border border-emerald-500/40 shadow-2xl bg-surface relative">
                <!-- BH13 Campus Floor / Corridor Live High-Tech Map Canvas -->
                <div class="h-80 sm:h-96 relative bg-gradient-to-b from-[#060e1a] via-[#091526] to-[#040912] overflow-hidden flex items-center justify-center p-4 select-none rounded-t-3xl border-b border-emerald-500/20">
                    
                    <!-- Futuristic Animated HUD Overlay (Top Bar) -->
                    <div class="absolute top-3 inset-x-2.5 sm:inset-x-4 flex justify-between items-center z-30 pointer-events-none">
                        <div class="flex items-center gap-1.5 sm:gap-2 bg-black/85 backdrop-blur-xl border border-emerald-500/40 text-emerald-400 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span class="tracking-wide hidden sm:inline">📡 BH13 LIVE CORRIDOR GPS</span>
                            <span class="tracking-wide sm:hidden">📡 BH13 GPS</span>
                        </div>
                        <div class="flex items-center gap-1.5 sm:gap-2 bg-black/85 backdrop-blur-xl border border-white/15 text-white/90 text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full shadow-lg">
                            <span class="text-emerald-400 font-extrabold flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[12px] sm:text-[13px]">bolt</span> 1.4 m/s
                            </span>
                            <span class="text-white/30 hidden sm:inline">•</span>
                            <span class="text-slate-300 hidden sm:inline">Floor 3 Express</span>
                        </div>
                    </div>

                    <!-- Ambient Floating Grid Lines -->
                    <div class="absolute inset-0 opacity-20 pointer-events-none map-grid-animated" style="background-image: radial-gradient(#10B981 1.5px, transparent 1.5px); background-size: 28px 28px;"></div>

                    <!-- Walking Footpath Path SVG with Gradients & Glow Filters -->
                    <svg class="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 800 280">
                        <defs>
                            <linearGradient id="emeraldPathGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#059669" stop-opacity="0.8"/>
                                <stop offset="50%" stop-color="#10B981" stop-opacity="1"/>
                                <stop offset="100%" stop-color="#34D399" stop-opacity="0.9"/>
                            </linearGradient>
                            <filter id="laserGlow" x="-30%" y="-30%" width="160%" height="160%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <!-- Outer Ambient Glow Track -->
                        <path d="M 70 140 C 200 70, 320 215, 490 95 S 640 185, 730 140" fill="none" stroke="url(#emeraldPathGlow)" stroke-width="16" stroke-linecap="round" opacity="0.35" filter="url(#laserGlow)"/>
                        
                        <!-- Base Solid Guideway -->
                        <path d="M 70 140 C 200 70, 320 215, 490 95 S 640 185, 730 140" fill="none" stroke="#1e293b" stroke-width="9" stroke-linecap="round"/>
                        
                        <!-- Animated Neon Laser Dash Track -->
                        <path class="path-dash-animated" d="M 70 140 C 200 70, 320 215, 490 95 S 640 185, 730 140" fill="none" stroke="#10B981" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="12,14"/>

                        <!-- Waypoints & Halos along corridor -->
                        <g class="waypoint-halo">
                            <circle cx="280" cy="150" r="5" fill="#10B981" />
                            <circle cx="280" cy="150" r="10" fill="none" stroke="#10B981" stroke-width="1.5" opacity="0.6"/>
                        </g>
                        <g class="waypoint-halo">
                            <circle cx="490" cy="95" r="5" fill="#34D399" />
                            <circle cx="490" cy="95" r="10" fill="none" stroke="#34D399" stroke-width="1.5" opacity="0.6"/>
                        </g>
                        <g class="waypoint-halo">
                            <circle cx="630" cy="160" r="5" fill="#10B981" />
                            <circle cx="630" cy="160" r="10" fill="none" stroke="#10B981" stroke-width="1.5" opacity="0.6"/>
                        </g>
                    </svg>

                    <!-- Origin: BH13 Dark Store Hub Pin (Left) -->
                    <div class="absolute left-2.5 sm:left-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer">
                        <div class="relative flex items-center justify-center">
                            <div class="absolute -inset-2 rounded-xl sm:rounded-2xl bg-emerald-500/25 animate-pulse"></div>
                            <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border-2 border-emerald-400 p-2">
                                <span class="material-symbols-outlined text-xl sm:text-2xl">storefront</span>
                            </div>
                        </div>
                        <div class="mt-1.5 bg-black/85 backdrop-blur-md text-emerald-400 text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-emerald-500/40 shadow-xl max-w-[80px] sm:max-w-[120px] truncate text-center">
                            BH13 Hub
                        </div>
                    </div>

                    <!-- Active Walking Runner Pin (Dynamic Movement & Triple Radar Waves) -->
                    <div class="absolute transform -translate-x-1/2 -translate-y-1/2 z-30" id="rider-pin" style="left: 68%; top: 40%;">
                        <div class="relative flex flex-col items-center">
                            
                            <!-- Triple Expanding Sonar Waves -->
                            <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 radar-wave-1 pointer-events-none"></div>
                            <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/25 radar-wave-2 pointer-events-none"></div>
                            <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 radar-wave-3 pointer-events-none"></div>
                            
                            <!-- 3D Emerald Gradient Runner Orb with Bobbing Animation -->
                            <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.9)] border-2 border-white relative z-10 walker-bob cursor-pointer">
                                <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">directions_walk</span>
                            </div>
                            
                            <!-- Floating Runner Status Badge -->
                            <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5" id="rider-badge">
                                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                                <span class="truncate">${activeOrder.rider_name || 'Alex'} · Walking</span>
                            </div>
                        </div>
                    </div>

                    <!-- Destination: Student Hostel Room Pin (Right) -->
                    <div class="absolute right-2.5 sm:right-6 top-1/2 transform -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer">
                        <div class="relative flex items-center justify-center">
                            <div class="absolute -inset-2 rounded-xl sm:rounded-2xl bg-teal-500/25 animate-pulse"></div>
                            <div class="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-950 text-white flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.4)] border-2 border-teal-400 p-2">
                                <span class="material-symbols-outlined text-xl sm:text-2xl">apartment</span>
                            </div>
                        </div>
                        <div class="mt-1.5 bg-black/85 backdrop-blur-md text-teal-300 text-[9px] sm:text-[10px] font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-teal-400/40 shadow-xl max-w-[85px] sm:max-w-[140px] truncate text-center" id="tracking-dest-label">
                            ${activeOrder.delivery_address || `${hostelShort} Room`}
                        </div>
                    </div>
                </div>

                <!-- Order Details & Progress -->
                <div class="p-5 sm:p-6 space-y-4">
                    <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                            <p class="text-xs text-on-surface-variant font-medium flex items-center gap-1.5" id="tracking-status-msg">
                                <span class="material-symbols-outlined text-base text-emerald">directions_walk</span>
                                <span>${activeOrder.rider_name || 'Alex'} picked up your snacks from BH13 Dark Store and is walking to ${activeOrder.delivery_address || hostelAddress}.</span>
                            </p>
                            <h3 class="font-bold text-sm sm:text-base text-on-surface mt-1">Order #${activeOrder.id.replace('order_', '').toUpperCase()} · Total ₹${activeOrder.total} (${activeOrder.payment_method || 'Cash on Delivery'})</h3>
                        </div>
                        <div class="flex items-center gap-3 bg-surface-container-high rounded-2xl p-2 px-3.5 border border-surface-variant/40 shadow-sm">
                            <div class="w-9 h-9 rounded-full bg-emerald text-white flex items-center justify-center font-black text-xs shadow-sm" id="rider-avatar">
                                ${(activeOrder.rider_name || 'A')[0]}
                            </div>
                            <div>
                                <p class="font-bold text-xs text-on-surface" id="rider-name-display">${activeOrder.rider_name || 'Alex'}</p>
                                <p class="text-[10px] text-emerald font-bold flex items-center gap-0.5">
                                    <span class="material-symbols-outlined text-[13px]">directions_walk</span>
                                    <span>BH13 Express Walker</span>
                                </p>
                            </div>
                            <a href="tel:7671836211" class="ml-2 w-8 h-8 rounded-full bg-emerald text-white flex items-center justify-center hover:opacity-90 shadow-md transition-all active:scale-95" title="Call Runner">
                                <span class="material-symbols-outlined text-sm">call</span>
                            </a>
                        </div>
                    </div>

                    <!-- Progress Step Indicator -->
                    <div class="space-y-2 pt-1">
                        <div class="w-full bg-surface-container-high h-3 rounded-full overflow-hidden p-0.5 border border-surface-variant/40">
                            <div class="h-full rounded-full transition-all duration-700 shadow-sm" id="order-progress-bar" style="width: 25%; background: linear-gradient(90deg, #059669 0%, #10B981 100%); box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);"></div>
                        </div>
                        <div class="flex justify-between text-[10px] sm:text-xs font-bold text-on-surface-variant px-1">
                            <span class="text-emerald font-extrabold" id="step-placed" style="color: #10B981;">Accepted ✓</span>
                            <span id="step-packed">Packed 📦</span>
                            <span id="step-enroute">Walking to Room 🚶‍♂️</span>
                            <span id="step-delivered">Delivered 🏁</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        ` : `
        <section class="glass-card rounded-3xl p-8 text-center border border-glass-border">
            <div class="w-14 h-14 rounded-full bg-surface-container-high mx-auto flex items-center justify-center mb-3">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant">directions_walk</span>
            </div>
            <p class="font-bold text-sm text-on-surface">No active deliveries right now</p>
            <p class="text-xs text-on-surface-variant mt-1">Place an order to see live real-time GPS walking tracking.</p>
            <a href="#/" class="mt-4 inline-block bg-emerald text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md">Explore Campus Store</a>
        </section>
        `}

        <!-- Past Orders History -->
        <section class="space-y-3">
            <h2 class="font-headline-md text-base sm:text-lg font-bold text-on-surface">Past Orders</h2>
            <div class="space-y-2.5">
                ${pastRows || '<p class="text-xs text-on-surface-variant py-2">No past orders yet.</p>'}
            </div>
        </section>
    </main>

    <!-- Order Help Modal (Shown only for active orders) -->
    <div id="order-help-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="glass-card bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl border border-glass-border space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div class="flex items-center justify-between border-b border-surface-variant/40 pb-3">
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-full bg-emerald/15 text-emerald flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg">support_agent</span>
                    </span>
                    <div>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Order Help & Support</h3>
                        <p class="text-[11px] text-on-surface-variant">Order #${activeOrder ? activeOrder.id.replace('order_', '') : ''}</p>
                    </div>
                </div>
                <button type="button" id="btn-close-help-modal" onclick="window.closeOrderHelpModal()" class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            <div class="space-y-2.5">
                <!-- Option 1: Call Delivery Agent -->
                <a href="tel:7671836211" class="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high hover:bg-emerald/10 border border-outline-variant/30 hover:border-emerald transition-all group">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald text-white flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-xl">call</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs sm:text-sm text-on-surface">1. Call Delivery Agent</h4>
                            <p class="text-[11px] text-on-surface-variant">${activeOrder?.rider_name || 'Alex'} (BH13 Express Walker) · 7671836211</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-emerald group-hover:translate-x-1 transition-transform">chevron_right</span>
                </a>

                <!-- Option 2: Change Address -->
                <button type="button" id="btn-help-change-address" onclick="window.changeHelpOrderAddress()" class="w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high hover:bg-emerald/10 border border-outline-variant/30 hover:border-emerald transition-all group cursor-pointer">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                            <span class="material-symbols-outlined text-xl">location_on</span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs sm:text-sm text-on-surface">2. Change Delivery Address</h4>
                            <p class="text-[11px] text-on-surface-variant truncate max-w-[220px]" id="help-current-address-label">${activeOrder?.delivery_address || hostelAddress}</p>
                        </div>
                    </div>
                    <span class="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>

                <!-- Option 3: Cancel Order (Frozen after order is packed / walker en route) -->
                ${(() => {
                    const isFrozen = activeOrder && ['Out for Delivery', 'out for delivery', 'Delivered', 'delivered'].includes(activeOrder.status);
                    return `
                    <button type="button" id="btn-help-cancel-order" onclick="window.cancelHelpOrder()" ${isFrozen ? 'disabled' : ''} class="w-full text-left flex items-center justify-between p-3.5 rounded-2xl ${isFrozen ? 'bg-surface-container-high opacity-50 border border-outline-variant/30 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer'} transition-all group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl ${isFrozen ? 'bg-surface-variant text-on-surface-variant' : 'bg-error text-white'} flex items-center justify-center shadow-md">
                                <span class="material-symbols-outlined text-xl">${isFrozen ? 'lock' : 'cancel'}</span>
                            </div>
                            <div>
                                <h4 class="font-bold text-xs sm:text-sm ${isFrozen ? 'text-on-surface-variant' : 'text-error'}">
                                    3. Cancel Order ${isFrozen ? '<span class="text-[10px] bg-surface-variant text-on-surface-variant font-bold px-2 py-0.5 rounded-full ml-1">Locked</span>' : ''}
                                </h4>
                                <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                                    ${isFrozen ? '🔒 Order packed & walker en route. Cannot cancel now.' : 'Cancel active delivery & request immediate refund'}
                                </p>
                            </div>
                        </div>
                        <span class="material-symbols-outlined ${isFrozen ? 'text-on-surface-variant' : 'text-error'} group-hover:translate-x-1 transition-transform">${isFrozen ? 'lock' : 'chevron_right'}</span>
                    </button>
                    `;
                })()}
            </div>
        </div>
    </div>

    <!-- BottomNavBar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/80 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/categories">
                <span class="material-symbols-outlined">category</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200 relative" href="#/cart" id="bottom-nav-cart-btn">
                <div class="relative flex items-center justify-center">
                    <span class="material-symbols-outlined">shopping_cart</span>
                    <span id="bottom-nav-cart-count" class="global-cart-count-badge absolute -top-1.5 -right-2 bg-emerald text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 hidden">0</span>
                </div>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/orders">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.orders = function() {
    const effectiveUserId = (window.isUserLoggedIn() ? window.CURRENT_USER_ID : (typeof window.getEffectiveUserId === 'function' ? window.getEffectiveUserId() : 'user_guest'));
    const hostelShort = window.currentAddress || 'BH13';
    const hostelAddress = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';
    const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;

    // Reorder button click (Genuine items from order)
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const orderId = btn.dataset.orderId;
            if (!orderId) return;

            btn.disabled = true;
            btn.innerHTML = '<span class="material-symbols-outlined text-xs animate-spin">sync</span><span>Adding...</span>';
            try {
                const res = await window.api.reorder(orderId, effectiveUserId);
                btn.innerHTML = '<span class="material-symbols-outlined text-xs">check</span><span>Added!</span>';
                if (typeof showClientToast === 'function') {
                    showClientToast('✓ Items added to cart!', 'success', 'shopping_cart');
                }
                setTimeout(() => {
                    window.location.hash = '#/cart';
                }, 350);
            } catch (err) {
                btn.textContent = 'Reorder';
                btn.disabled = false;
                console.error('[Reorder Error]:', err);
                if (typeof showClientToast === 'function') {
                    showClientToast('Could not reorder items: ' + err.message, 'error', 'error');
                } else {
                    alert('Could not reorder items: ' + err.message);
                }
            }
        };
    });

    const pin = document.getElementById('rider-pin');
    const etaTimeEl = document.getElementById('tracking-eta-time');
    const msgEl = document.getElementById('tracking-status-msg');
    const progressBar = document.getElementById('order-progress-bar');
    const stepPlaced = document.getElementById('step-placed');
    const stepPacked = document.getElementById('step-packed');
    const stepEnroute = document.getElementById('step-enroute');
    const stepDelivered = document.getElementById('step-delivered');
    const liveIndicator = document.getElementById('orders-live-indicator');
    const riderNameDisplay = document.getElementById('rider-name-display');
    const riderAvatar = document.getElementById('rider-avatar');
    const riderBadge = document.getElementById('rider-badge');

    let currentOrderStatus = window.CURRENT_ACTIVE_ORDER_STATUS || 'Order Placed';

    window.updateHelpModalCancelState = function(status) {
        currentOrderStatus = status;
        window.CURRENT_ACTIVE_ORDER_STATUS = status;
        const cancelBtn = document.getElementById('btn-help-cancel-order');
        if (!cancelBtn) return;

        const s = (status || '').toLowerCase();
        const isFrozen = ['out for delivery', 'delivered'].includes(s);

        if (isFrozen) {
            cancelBtn.disabled = true;
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-high opacity-50 border border-outline-variant/30 cursor-not-allowed transition-all select-none';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-surface-variant text-on-surface-variant flex items-center justify-center shadow-md">
                        <span class="material-symbols-outlined text-xl">lock</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs sm:text-sm text-on-surface-variant flex items-center gap-1.5">
                            <span>3. Cancel Order</span>
                            <span class="text-[10px] bg-surface-variant text-on-surface-variant font-bold px-2 py-0.5 rounded-full">Locked 🔒</span>
                        </h4>
                        <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                            🔒 Order packed & walker en route. Cannot cancel now.
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">lock</span>
            `;
        } else {
            cancelBtn.disabled = false;
            cancelBtn.className = 'w-full text-left flex items-center justify-between p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 cursor-pointer transition-all group';
            cancelBtn.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-error text-white flex items-center justify-center shadow-md">
                        <span class="material-symbols-outlined text-xl">cancel</span>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs sm:text-sm text-error">3. Cancel Order</h4>
                        <p class="text-[11px] text-on-surface-variant" id="help-cancel-desc">
                            Cancel active delivery & request immediate refund
                        </p>
                    </div>
                </div>
                <span class="material-symbols-outlined text-error group-hover:translate-x-1 transition-transform">chevron_right</span>
            `;
        }
    };

    window.openOrderHelpModal = function() {
        const modal = document.getElementById('order-help-modal');
        if (modal) {
            window.updateHelpModalCancelState(window.CURRENT_ACTIVE_ORDER_STATUS || currentOrderStatus || 'Order Placed');
            modal.classList.remove('hidden');
        }
    };

    window.closeOrderHelpModal = function() {
        const modal = document.getElementById('order-help-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.changeHelpOrderAddress = async function() {
        const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;
        if (!activeOrderId) return alert('No active order found.');

        const currentLabel = document.getElementById('help-current-address-label');
        const current = currentLabel ? currentLabel.textContent : (window.currentAddressDetail?.label || 'BH13 (Block A), Room 304');
        const newRoom = prompt('Enter updated hostel block & room number for fast delivery:', current);
        if (newRoom && newRoom.trim() && newRoom.trim() !== current) {
            const trimmed = newRoom.trim();
            try {
                await window.api.changeOrderAddress(activeOrderId, trimmed);
                if (currentLabel) currentLabel.textContent = trimmed;
                const destLabel = document.getElementById('tracking-dest-label');
                if (destLabel) destLabel.textContent = trimmed;
                if (msgEl) {
                    msgEl.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald">directions_walk</span><span>Delivery address updated to <b>${trimmed}</b>. Runner notified!</span>`;
                }
                alert(`✓ Delivery address updated to: ${trimmed}`);
                window.closeOrderHelpModal();
            } catch (err) {
                alert('Could not update address: ' + err.message);
            }
        }
    };

    window.cancelHelpOrder = async function() {
        const activeOrderId = window.CURRENT_ACTIVE_ORDER_ID;
        if (!activeOrderId) return alert('No active order found.');

        const s = (window.CURRENT_ACTIVE_ORDER_STATUS || currentOrderStatus || '').toLowerCase();
        if (['out for delivery', 'delivered'].includes(s)) {
            alert('⚠️ Order is already packed and out for delivery with the campus runner. It can no longer be cancelled.');
            return;
        }

        const confirmed = confirm('Are you sure you want to cancel this order? Instant refund will be initiated.');
        if (!confirmed) return;

        try {
            const cancelBtn = document.getElementById('btn-help-cancel-order');
            if (cancelBtn) {
                cancelBtn.disabled = true;
                cancelBtn.textContent = 'Cancelling...';
            }
            await window.api.cancelOrder(activeOrderId, 'Cancelled by student via Help Menu');
            window.applyOrderStatusUI('Cancelled');
            window.closeOrderHelpModal();
        } catch (err) {
            alert('Could not cancel order: ' + err.message);
            const cancelBtn = document.getElementById('btn-help-cancel-order');
            if (cancelBtn) cancelBtn.disabled = false;
        }
    };

    let lastPlayedSoundStatus = null;
    function playStatusChime(status) {
        if (!status || lastPlayedSoundStatus === status) return;
        lastPlayedSoundStatus = status;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();

            const s = (status || '').toLowerCase();
            if (s.includes('delivered')) {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.12);
                    osc.stop(ctx.currentTime + i * 0.12 + 0.45);
                });
            } else if (s.includes('out for delivery') || s.includes('en_route')) {
                const notes = [587.33, 739.99, 880.00];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.1);
                    osc.stop(ctx.currentTime + i * 0.1 + 0.35);
                });
            } else if (s.includes('confirmed') || s.includes('preparing') || s.includes('packed')) {
                [659.25, 880.00].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(ctx.currentTime + i * 0.15);
                    osc.stop(ctx.currentTime + i * 0.15 + 0.35);
                });
            }
        } catch (e) {}
    }

    // Live status UI updater
    window.applyOrderStatusUI = function(status, riderName) {
        if (!status) return;
        currentOrderStatus = status;
        window.CURRENT_ACTIVE_ORDER_STATUS = status;
        playStatusChime(status);
        if (typeof window.updateHelpModalCancelState === 'function') {
            window.updateHelpModalCancelState(status);
        }
        
        const rider = riderName || 'Alex';
        const rName = document.getElementById('rider-name-display');
        const rAvatar = document.getElementById('rider-avatar');
        const rBadge = document.getElementById('rider-badge');
        const pBar = document.getElementById('order-progress-bar');
        const etaText = document.getElementById('tracking-eta-time');
        const statusMsg = document.getElementById('tracking-status-msg');
        const riderPin = document.getElementById('rider-pin');
        
        const sPlaced = document.getElementById('step-placed');
        const sPacked = document.getElementById('step-packed');
        const sEnroute = document.getElementById('step-enroute');
        const sDelivered = document.getElementById('step-delivered');

        if (rName) rName.textContent = rider;
        if (rAvatar) rAvatar.textContent = rider[0];
        if (rBadge) rBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span><span class="truncate">${rider} · Walking</span>`;

        const s = status.trim().toLowerCase();

        if (pBar) {
            pBar.style.height = '100%';
            pBar.style.borderRadius = '9999px';
            pBar.style.transition = 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s ease';
        }

        if (s === 'order placed' || s === 'pending') {
            if (pBar) {
                pBar.style.width = '25%';
                pBar.style.background = 'linear-gradient(90deg, #059669 0%, #10B981 100%)';
                pBar.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.7)';
            }
            if (etaText) etaText.textContent = 'Status: Order Placed';
            if (statusMsg) statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-emerald">storefront</span><span>BH13 Dark Store received your order and is verifying items.</span>';
            if (riderPin) {
                riderPin.style.left = '20%';
                riderPin.style.top = '48%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 radar-wave-1 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/25 radar-wave-2 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 radar-wave-3 pointer-events-none"></div>
                        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.9)] border-2 border-white relative z-10 walker-bob cursor-pointer">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">directions_walk</span>
                        </div>
                        <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5" id="rider-badge">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                            <span class="truncate">${rider} · Assigned</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-emerald font-extrabold'; sPlaced.style.color = '#10B981'; }
            if (sPacked) { sPacked.className = 'text-on-surface-variant font-medium'; sPacked.style.color = ''; }
            if (sEnroute) { sEnroute.className = 'text-on-surface-variant font-medium'; sEnroute.style.color = ''; }
            if (sDelivered) { sDelivered.className = 'text-on-surface-variant font-medium'; sDelivered.style.color = ''; }
        } else if (s === 'order confirmed' || s === 'confirmed' || s === 'accepted') {
            if (pBar) {
                pBar.style.width = '45%';
                pBar.style.background = 'linear-gradient(90deg, #059669 0%, #10B981 60%, #34D399 100%)';
                pBar.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.8)';
            }
            if (etaText) etaText.textContent = 'Status: Confirmed (3 mins)';
            if (statusMsg) statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-emerald">check_circle</span><span>BH13 Dark Store confirmed your order. Bag packing started!</span>';
            if (riderPin) {
                riderPin.style.left = '36%';
                riderPin.style.top = '38%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 radar-wave-1 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/25 radar-wave-2 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 radar-wave-3 pointer-events-none"></div>
                        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.9)] border-2 border-white relative z-10 walker-bob cursor-pointer">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">directions_walk</span>
                        </div>
                        <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5" id="rider-badge">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                            <span class="truncate">${rider} · Packing</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-emerald font-extrabold'; sPlaced.style.color = '#10B981'; }
            if (sPacked) { sPacked.className = 'text-emerald font-extrabold'; sPacked.style.color = '#10B981'; }
            if (sEnroute) { sEnroute.className = 'text-on-surface-variant font-medium'; sEnroute.style.color = ''; }
            if (sDelivered) { sDelivered.className = 'text-on-surface-variant font-medium'; sDelivered.style.color = ''; }
        } else if (s === 'preparing' || s === 'packed') {
            if (pBar) {
                pBar.style.width = '65%';
                pBar.style.background = 'linear-gradient(90deg, #059669 0%, #10B981 50%, #34D399 100%)';
                pBar.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.85)';
            }
            if (etaText) etaText.textContent = 'Status: Packed & Ready (2 mins)';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">inventory_2</span><span>Snacks sealed in tamper-proof bag. Runner ${rider} at dispatch counter.</span>`;
            if (riderPin) {
                riderPin.style.left = '52%';
                riderPin.style.top = '58%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 radar-wave-1 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/25 radar-wave-2 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 radar-wave-3 pointer-events-none"></div>
                        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.9)] border-2 border-white relative z-10 walker-bob cursor-pointer">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">directions_walk</span>
                        </div>
                        <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5" id="rider-badge">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                            <span class="truncate">${rider} · Dispatching</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-emerald font-extrabold'; sPlaced.style.color = '#10B981'; }
            if (sPacked) { sPacked.className = 'text-emerald font-extrabold'; sPacked.style.color = '#10B981'; }
            if (sEnroute) { sEnroute.className = 'text-on-surface-variant font-medium'; sEnroute.style.color = ''; }
            if (sDelivered) { sDelivered.className = 'text-on-surface-variant font-medium'; sDelivered.style.color = ''; }
        } else if (s === 'out for delivery' || s === 'en_route') {
            if (pBar) {
                pBar.style.width = '85%';
                pBar.style.background = 'linear-gradient(90deg, #059669 0%, #10B981 40%, #34D399 100%)';
                pBar.style.boxShadow = '0 0 16px rgba(16, 185, 129, 0.9)';
            }
            if (etaText) etaText.textContent = 'Status: Out for Delivery (1 min)';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">directions_walk</span><span>${rider} picked up your snacks and is walking at 1.4 m/s to ${hostelAddress}!</span>`;
            if (riderPin) {
                riderPin.style.left = '68%';
                riderPin.style.top = '40%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/20 radar-wave-1 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/25 radar-wave-2 pointer-events-none"></div>
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 radar-wave-3 pointer-events-none"></div>
                        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.9)] border-2 border-white relative z-10 walker-bob cursor-pointer">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">directions_walk</span>
                        </div>
                        <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5" id="rider-badge">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                            <span class="truncate">${rider} · Walking to Room</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-emerald font-extrabold'; sPlaced.style.color = '#10B981'; }
            if (sPacked) { sPacked.className = 'text-emerald font-extrabold'; sPacked.style.color = '#10B981'; }
            if (sEnroute) { sEnroute.className = 'text-emerald font-extrabold'; sEnroute.style.color = '#10B981'; }
            if (sDelivered) { sDelivered.className = 'text-on-surface-variant font-medium'; sDelivered.style.color = ''; }
        } else if (s === 'delivered') {
            if (pBar) {
                pBar.style.width = '100%';
                pBar.style.background = '#10B981';
                pBar.style.boxShadow = '0 0 20px rgba(16, 185, 129, 1)';
            }
            if (etaText) etaText.textContent = 'Status: Delivered ✓';
            if (statusMsg) statusMsg.innerHTML = `<span class="material-symbols-outlined text-base text-emerald">task_alt</span><span>🎉 Arrived at ${hostelAddress}! Please collect your items.</span>`;
            if (riderPin) {
                riderPin.style.left = '80%';
                riderPin.style.top = '50%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/30 delivery-celebration-ring pointer-events-none"></div>
                        <div class="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-emerald text-white flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.95)] border-2 border-white relative z-10 animate-bounce">
                            <span class="material-symbols-outlined text-2xl sm:text-3xl font-black">task_alt</span>
                        </div>
                        <div class="mt-1.5 sm:mt-2.5 bg-black/90 backdrop-blur-xl text-emerald-400 text-[10px] sm:text-[11px] font-black px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full shadow-2xl border border-emerald-400/60 max-w-[130px] sm:max-w-[200px] truncate flex items-center gap-1.5">
                            <span class="truncate">Delivered to Room 🎉</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-emerald font-extrabold'; sPlaced.style.color = '#10B981'; }
            if (sPacked) { sPacked.className = 'text-emerald font-extrabold'; sPacked.style.color = '#10B981'; }
            if (sEnroute) { sEnroute.className = 'text-emerald font-extrabold'; sEnroute.style.color = '#10B981'; }
            if (sDelivered) { sDelivered.className = 'text-emerald font-extrabold'; sDelivered.style.color = '#10B981'; }

            // Auto-refresh softly to update past orders history
            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3500);
        } else if (s === 'cancelled') {
            if (pBar) {
                pBar.style.width = '100%';
                pBar.style.background = '#dc2626';
                pBar.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.8)';
            }
            if (etaText) etaText.textContent = 'Status: Cancelled ✕';
            if (statusMsg) {
                statusMsg.innerHTML = '<span class="material-symbols-outlined text-base text-rose-600">cancel</span><span class="text-rose-600 font-bold">Order cancelled by Admin / Dark Store. Refund initiated.</span>';
            }
            if (riderPin) {
                riderPin.style.left = '50%';
                riderPin.style.top = '50%';
                riderPin.innerHTML = `
                    <div class="relative flex flex-col items-center">
                        <div class="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-2xl border-2 border-white relative z-10">
                            <span class="material-symbols-outlined text-2xl font-black">close</span>
                        </div>
                        <div class="mt-2 bg-black/90 text-rose-400 text-[11px] font-black px-3.5 py-1 rounded-full shadow-lg border border-rose-500/40 whitespace-nowrap flex items-center gap-1">
                            <span>Order Cancelled</span>
                        </div>
                    </div>
                `;
            }
            if (sPlaced) { sPlaced.className = 'text-rose-600 font-bold'; sPlaced.style.color = '#dc2626'; }
            if (sPacked) { sPacked.className = 'text-on-surface-variant font-medium'; sPacked.style.color = ''; }
            if (sEnroute) { sEnroute.className = 'text-on-surface-variant font-medium'; sEnroute.style.color = ''; }
            if (sDelivered) { sDelivered.className = 'text-on-surface-variant font-medium'; sDelivered.style.color = ''; }

            setTimeout(() => {
                if (window.location.hash === '#/orders') {
                    window.router();
                }
            }, 3000);
        }
    };

    // Trigger initial UI setup immediately on page render
    window.applyOrderStatusUI(currentOrderStatus, 'Alex');

    if (!activeOrderId) return;

    // Connect Live Tracking WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/track/${activeOrderId}`;
    let ws = null;
    let ordersPoll = null;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            if (liveIndicator) liveIndicator.textContent = 'Live GPS Sync';
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.status) {
                    window.applyOrderStatusUI(data.status, data.rider_name || data.riderName || 'Alex');
                }
            } catch (e) {
                console.error('[Orders WS parse error]:', e);
            }
        };

        ws.onerror = () => {
            if (liveIndicator) liveIndicator.textContent = 'Syncing (Fallback)';
            startPollingStatus();
        };

        ws.onclose = () => {
            startPollingStatus();
        };
    } catch (e) {
        startPollingStatus();
    }

    function startPollingStatus() {
        if (ordersPoll) clearInterval(ordersPoll);
        const pollFn = async () => {
            if (typeof document !== 'undefined' && document.hidden) return; // Pause polling when tab is inactive
            try {
                const res = await window.api.getOrderDetail(activeOrderId);
                const orderData = res?.order || res;
                if (orderData && orderData.status) {
                    if (orderData.status !== currentOrderStatus) {
                        window.applyOrderStatusUI(orderData.status, orderData.rider_name || 'Alex');
                    }
                    if (['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(orderData.status)) {
                        clearInterval(ordersPoll);
                    }
                }
            } catch (err) {}
        };

        ordersPoll = setInterval(pollFn, 6000); // 6s interval with instant revalidation on tab focus
    }

    // Instant revalidation when student returns to browser tab
    const handleVisibilityChange = () => {
        if (!document.hidden && activeOrderId) {
            window.api.getOrderDetail(activeOrderId).then(res => {
                const orderData = res?.order || res;
                if (orderData && orderData.status && orderData.status !== currentOrderStatus) {
                    window.applyOrderStatusUI(orderData.status, orderData.rider_name || 'Alex');
                }
            }).catch(() => {});
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
    window.addEventListener('focus', handleVisibilityChange, { passive: true });

    // Always run active polling in background as dual-assurance for instant admin sync
    startPollingStatus();
};



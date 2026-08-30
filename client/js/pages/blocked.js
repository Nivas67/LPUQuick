// LPUQuick Account Blocked Page
window.renderBlockedPage = function(reason = 'Fake Orders') {
    const cleanReason = reason ? reason.trim() : 'Fake Orders';
    const main = document.getElementById('main-content');
    if (!main) return;

    main.innerHTML = `
        <div class="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center antialiased">
            <div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-[#ffdad6] space-y-6 animate-fade-in">
                
                <!-- Red Alert Icon Badge -->
                <div class="w-20 h-20 mx-auto rounded-3xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shadow-inner">
                    <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">gavel</span>
                </div>

                <!-- Headline -->
                <div class="space-y-2">
                    <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#ffdad6] text-[#ba1a1a]">
                        Account Suspended
                    </span>
                    <h1 class="text-2xl font-black text-[#181c1f] tracking-tight">Account Blocked</h1>
                    <p class="text-sm font-bold text-[#ba1a1a]">
                        "You are blocked due to ${cleanReason.toLowerCase()}."
                    </p>
                </div>

                <!-- Explanation Box -->
                <div class="bg-[#f8f9fa] border border-[#DADCE0] rounded-2xl p-4 text-xs text-[#5c5f60] leading-relaxed text-left space-y-2">
                    <p>
                        Your student account has been restricted from placing orders on <b>LPU Quick</b> due to flagged policy violations (such as fake orders, repeated non-acceptance, or fraud).
                    </p>
                    <p class="text-[11px] text-[#74777a]">
                        If you believe this restriction is in error, please visit the <b>BH13 Central Campus Hub</b> or reach out to campus operations.
                    </p>
                </div>

                <!-- Action Button -->
                <div class="pt-2">
                    <button onclick="window.location.href='/'" class="w-full py-3 px-4 rounded-2xl bg-[#3c4043] hover:bg-[#262a2d] text-white font-bold text-xs tracking-wide shadow-md transition-all">
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    `;
};

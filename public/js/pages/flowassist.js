// Flow Assist Page — exact Stitch UI with AI chat, bundle generator & dynamic intent parsing
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.flowassist = async function() {
    return `
<div class="animated-bg min-h-screen text-on-surface font-body-md flex flex-col justify-between pb-6">
    <!-- Header -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white shadow-sm">
                    <span class="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                    <h1 class="font-headline-md text-sm sm:text-base font-bold flex items-center gap-1.5">
                        <span class="ai-gradient-text font-display">Flow Assist</span>
                    </h1>
                    <p class="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald inline-block"></span> Smart Campus Bundle Assistant
                    </p>
                </div>
            </div>
        </div>
        <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors relative">
            <span class="material-symbols-outlined">shopping_cart</span>
        </a>
    </header>

    <!-- Chat Message Container -->
    <main class="flex-1 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto w-full py-6 space-y-5 overflow-y-auto" id="chat-messages">
        <!-- AI Welcome Message -->
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                <span class="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
            <div class="glass-card rounded-3xl rounded-tl-sm p-4.5 max-w-lg shadow-sm border border-glass-border">
                <p class="text-xs sm:text-sm leading-relaxed">
                    Hey Nivas! 👋 I'm Flow Assist. Tell me what you're planning, your budget, or group size:
                </p>
                <div class="flex flex-wrap gap-2 mt-3">
                    <button type="button" class="text-xs bg-surface-container-high hover:bg-emerald/15 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip cursor-pointer">
                        Snacks for 6 watching cricket under ₹1200
                    </button>
                    <button type="button" class="text-xs bg-surface-container-high hover:bg-emerald/15 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip cursor-pointer">
                        Study session munchies under ₹300
                    </button>
                    <button type="button" class="text-xs bg-surface-container-high hover:bg-emerald/15 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip cursor-pointer">
                        Late night noodles and cold drinks
                    </button>
                </div>
            </div>
        </div>

        <!-- Initial Match Night Munchies Bundle (Stitch Default Demonstration) -->
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                <span class="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
            <div class="glass-card rounded-3xl rounded-tl-sm p-4 sm:p-5 max-w-xl w-full shadow-md border border-glass-border space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold text-royal-purple bg-royal-purple/15 px-2.5 py-0.5 rounded-full mb-1">
                            MATCH NIGHT MUNCHIES
                        </span>
                        <h3 class="font-bold text-sm sm:text-base text-on-surface">Curated Cricket Watch Party Combo</h3>
                    </div>
                    <span class="text-xs bg-emerald/15 text-emerald font-semibold px-2.5 py-1 rounded-full">
                        Saves ₹45
                    </span>
                </div>

                <!-- Bundle Items Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div class="bg-surface/80 rounded-2xl p-2 border border-surface-variant/40 text-center">
                        <img class="w-12 h-12 object-cover mx-auto rounded-xl mb-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWj4GYR9sL5Ym5uemKw-AAMJVk5ynOLqQAOKi_vr6pN28uAjignjLtQBBj2N52p-h_uyf5gT7HPsMfiQgDn7upmFJSOBuunfU4JqCcWqeHc0lam_VIzSFozy8C6fYH-UbTqjXMNRnOAxidutsKCiMGk9T1v7_nfADhQZOgniIms8hyIrCrAbQ7dymIns-fdUxHBLfYmiP4C87Y9fy1F6aRZ7UT_snt4opJeM_1qWDvHoMYkB3dj9M" alt="Classic Cola">
                        <p class="text-xs font-semibold truncate">Classic Cola 2L</p>
                        <p class="text-[11px] text-on-surface-variant font-bold">₹60</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2 border border-surface-variant/40 text-center">
                        <img class="w-12 h-12 object-cover mx-auto rounded-xl mb-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_zIOslVn01xUBPTDi-riNyW-Xb6F5s6dedAauK-iDIrUNwGEAe3EK9AAIJv_TZNn9t1l99EagggCXZ6CTo_pngQytyUWt1TJG7BFZyLY3CAzXU0cZHHrePxc-wofVVInypti4XG4Cga-YjMnTdy4nvv5LoD4acBm_QN3LZDxr0fkGaBWO5BLSZfgSYh17d_P7lEhj9JU5YJsyj3qFvir1CObCTF3p6UZKkDSx6LbM8RJBbNcdSAM" alt="Spicy Nachos">
                        <p class="text-xs font-semibold truncate">Spicy Nachos</p>
                        <p class="text-[11px] text-on-surface-variant font-bold">₹85</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2 border border-surface-variant/40 text-center">
                        <img class="w-12 h-12 object-cover mx-auto rounded-xl mb-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8FwQOhwFWRh_QnLKtKoqFV1rhRTsc9RZNzjWQCa3Nwxjy5Kt6r0mb5p4U1Za0n0OInqOAtGqMUamP2XfIn8VS1y5LfmqTzGf2BG9nOa_pX4Q6Lf6KS2eV81LMRsqjK08xT9uE9-nfXzm5KfRggSmpzF-wnQ3z2lR2PwGUi4MjhK0Rlz1ldozeAHEnUuT8oL0w8uaCfslugw48uGUxWUdB-73c080SnbLg3VjMeBVKdvlycRF2LdU" alt="Chunky Salsa">
                        <p class="text-xs font-semibold truncate">Chunky Salsa</p>
                        <p class="text-[11px] text-on-surface-variant font-bold">₹75</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2 border border-surface-variant/40 text-center">
                        <img class="w-12 h-12 object-cover mx-auto rounded-xl mb-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhoDcdVeuZHn2N4ZEGd3ZwsuO4Jy-Gw4E66q8U3XucMgoSD33XrmPMYYJEAy2xDSuP3t_auiwWyQrY9b77M-CPFYC0hMlw8y4CsqIMoXO5LEHczCDqsAe7YFf2-h5x5kRRXiF9jpVVvKiIPFT-ZuH-Ecj4eZpToIg4ln-EQItVyFUnuSR-oe6zDRAiWOsOz8iy2BFipRe1V0tmTvLsuNyb9Tzmumh83svYHX9GJSFvk3flA-RlBrY" alt="Choc Cookies">
                        <p class="text-xs font-semibold truncate">Choc Cookies</p>
                        <p class="text-[11px] text-on-surface-variant font-bold">₹90</p>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-surface-variant/30">
                    <div>
                        <span class="text-xs text-on-surface-variant">Bundle:</span>
                        <span class="text-base sm:text-lg font-bold text-on-surface ml-1">₹310</span>
                        <span class="text-xs text-on-surface-variant line-through ml-1">₹355</span>
                    </div>
                    <button type="button" class="bg-emerald hover:bg-primary text-white text-xs font-semibold px-4 sm:px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all add-bundle-btn active:scale-95 cursor-pointer" data-items="prod_f01,prod_f02,prod_f03,prod_f04">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Chat Input Box -->
    <div class="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto w-full">
        <form class="glass-card rounded-full p-1.5 sm:p-2 flex items-center gap-2 border border-glass-border shadow-lg" id="chat-form">
            <input class="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-on-surface placeholder:text-outline focus:outline-none" placeholder="Ask Flow Assist (e.g. Snacks for 4 under ₹500)..." type="text" id="chat-input" autocomplete="off">
            <button class="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-emerald hover:bg-primary text-white flex items-center justify-center transition-all shadow-md flex-shrink-0 active:scale-95 cursor-pointer" type="submit" id="chat-submit">
                <span class="material-symbols-outlined text-base sm:text-lg">send</span>
            </button>
        </form>
    </div>
</div>`;
};

window.pageInits.flowassist = function() {
    const userId = window.getEffectiveUserId();
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    function bindBundleButtons() {
        document.querySelectorAll('.add-bundle-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.preventDefault();
                const itemIds = (btn.dataset.items || '').split(',').filter(Boolean);
                btn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> Adding...';
                for (const id of itemIds) {
                    try {
                        await window.api.addToCart(userId, id, 1);
                    } catch(err) {
                        console.error(err);
                    }
                }
                btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Added to Cart!';
                btn.classList.add('bg-primary');
                setTimeout(() => {
                    window.location.hash = '#/cart';
                }, 600);
            };
        });
    }
    bindBundleButtons();

    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.onclick = (e) => {
            e.preventDefault();
            if (chatInput) {
                chatInput.value = chip.textContent.trim();
                handleSend();
            }
        };
    });

    chatForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSend();
    });

    async function handleSend() {
        const text = chatInput?.value?.trim();
        if (!text || !chatMessages) return;

        // User bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'flex justify-end';
        userBubble.innerHTML = `
            <div class="bg-emerald text-white rounded-3xl rounded-tr-sm px-4 sm:px-5 py-2.5 sm:py-3 max-w-md shadow-sm text-xs sm:text-sm">
                ${text}
            </div>
        `;
        chatMessages.appendChild(userBubble);
        if (chatInput) chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Loading bubble
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'flex items-start gap-3';
        loadingBubble.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1">
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            </div>
            <div class="glass-card rounded-3xl rounded-tl-sm p-3.5 text-xs text-on-surface-variant">
                Analyzing campus menu & creating optimal combo...
            </div>
        `;
        chatMessages.appendChild(loadingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const data = await window.api.flowAssist(text);
            loadingBubble.remove();

            const items = data.items || [];
            const itemIds = items.map(i => i.id).join(',');

            const aiBubble = document.createElement('div');
            aiBubble.className = 'flex items-start gap-3';
            aiBubble.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                    <span class="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <div class="glass-card rounded-3xl rounded-tl-sm p-4 sm:p-5 max-w-xl w-full shadow-md border border-glass-border space-y-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-royal-purple bg-royal-purple/15 px-2.5 py-0.5 rounded-full mb-1">
                                ${(data.tag || 'CUSTOM').toUpperCase()}
                            </span>
                            <h3 class="font-bold text-sm sm:text-base text-on-surface">${data.bundle_name}</h3>
                        </div>
                        ${data.savings > 0 ? `<span class="text-xs bg-emerald/15 text-emerald font-semibold px-2.5 py-1 rounded-full">Saves ₹${data.savings}</span>` : ''}
                    </div>
                    <p class="text-xs text-on-surface-variant">${data.ai_message}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${items.map(i => `
                            <div class="bg-surface/80 rounded-2xl p-2 border border-surface-variant/40 text-center">
                                <img class="w-12 h-12 object-cover mx-auto rounded-xl mb-1" src="${i.image_url}" alt="${i.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'">
                                <p class="text-xs font-semibold truncate">${i.name}</p>
                                <p class="text-[11px] text-on-surface-variant font-bold">₹${i.price}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-surface-variant/30">
                        <div>
                            <span class="text-xs text-on-surface-variant">Total:</span>
                            <span class="text-base sm:text-lg font-bold text-on-surface ml-1">₹${data.total_price}</span>
                            ${data.mrp_total > data.total_price ? `<span class="text-xs text-on-surface-variant line-through ml-1">₹${data.mrp_total}</span>` : ''}
                        </div>
                        <button type="button" class="bg-emerald hover:bg-primary text-white text-xs font-semibold px-4 sm:px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all add-bundle-btn active:scale-95 cursor-pointer" data-items="${itemIds}">
                            <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                            Add Bundle to Cart
                        </button>
                    </div>
                </div>
            `;
            chatMessages.appendChild(aiBubble);
            bindBundleButtons();
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (err) {
            loadingBubble.remove();
            console.error(err);
        }
    }
};

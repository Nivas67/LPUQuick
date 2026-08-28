// Flow Assist Page — exact Stitch UI with AI chat, bundle generator & dynamic intent parsing
window.pages.flowassist = async function() {
    return `
<div class="animated-bg min-h-screen text-on-surface font-body-md flex flex-col justify-between pb-6">
    <!-- Header -->
    <header class="px-margin-mobile md:px-margin-desktop py-4 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-40 border-b border-glass-border">
        <div class="flex items-center gap-3">
            <a href="#/" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors">
                <span class="material-symbols-outlined">arrow_back</span>
            </a>
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white shadow-sm">
                    <span class="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                    <h1 class="font-headline-md text-base font-bold flex items-center gap-1.5">
                        <span class="ai-gradient-text">Flow Assist</span>
                    </h1>
                    <p class="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald inline-block"></span> AI Intent & Bundle Engine
                    </p>
                </div>
            </div>
        </div>
        <a href="#/cart" class="p-2 hover:bg-surface-variant/50 rounded-full transition-colors relative">
            <span class="material-symbols-outlined">shopping_cart</span>
        </a>
    </header>

    <!-- Chat Message Container -->
    <main class="flex-1 px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto w-full py-6 space-y-6 overflow-y-auto" id="chat-messages">
        <!-- AI Welcome Message -->
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                <span class="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
            <div class="glass-card rounded-3xl rounded-tl-sm p-4.5 max-w-lg shadow-sm border border-glass-border">
                <p class="text-sm leading-relaxed">
                    Hey Nivas! 👋 Tell me what you're craving or planning. Try things like:
                </p>
                <div class="flex flex-wrap gap-2 mt-3">
                    <button class="text-xs bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip">
                        Snacks for 6 watching cricket under ₹1200
                    </button>
                    <button class="text-xs bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip">
                        Study session munchies under ₹300
                    </button>
                    <button class="text-xs bg-surface-container-high hover:bg-emerald/10 hover:border-emerald border border-outline-variant/40 rounded-full px-3 py-1.5 transition-all text-on-surface prompt-chip">
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
            <div class="glass-card rounded-3xl rounded-tl-sm p-5 max-w-xl w-full shadow-md border border-glass-border space-y-4">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="inline-flex items-center gap-1 text-[11px] font-bold text-royal-purple bg-royal-purple/15 px-2.5 py-0.5 rounded-full mb-1.5">
                            MATCH NIGHT MUNCHIES
                        </span>
                        <h3 class="font-bold text-base text-on-surface">Curated Cricket Watch Party Combo</h3>
                    </div>
                    <span class="text-xs bg-emerald/15 text-emerald font-semibold px-2.5 py-1 rounded-full">
                        Saves ₹45
                    </span>
                </div>

                <!-- Bundle Items Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div class="bg-surface/80 rounded-2xl p-2.5 border border-surface-variant/40 text-center">
                        <img class="w-14 h-14 object-cover mx-auto rounded-xl mb-1.5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWj4GYR9sL5Ym5uemKw-AAMJVk5ynOLqQAOKi_vr6pN28uAjignjLtQBBj2N52p-h_uyf5gT7HPsMfiQgDn7upmFJSOBuunfU4JqCcWqeHc0lam_VIzSFozy8C6fYH-UbTqjXMNRnOAxidutsKCiMGk9T1v7_nfADhQZOgniIms8hyIrCrAbQ7dymIns-fdUxHBLfYmiP4C87Y9fy1F6aRZ7UT_snt4opJeM_1qWDvHoMYkB3dj9M" alt="Classic Cola">
                        <p class="text-xs font-semibold truncate">Classic Cola 2L</p>
                        <p class="text-[11px] text-on-surface-variant">₹60</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2.5 border border-surface-variant/40 text-center">
                        <img class="w-14 h-14 object-cover mx-auto rounded-xl mb-1.5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_zIOslVn01xUBPTDi-riNyW-Xb6F5s6dedAauK-iDIrUNwGEAe3EK9AAIJv_TZNn9t1l99EagggCXZ6CTo_pngQytyUWt1TJG7BFZyLY3CAzXU0cZHHrePxc-wofVVInypti4XG4Cga-YjMnTdy4nvv5LoD4acBm_QN3LZDxr0fkGaBWO5BLSZfgSYh17d_P7lEhj9JU5YJsyj3qFvir1CObCTF3p6UZKkDSx6LbM8RJBbNcdSAM" alt="Spicy Nachos">
                        <p class="text-xs font-semibold truncate">Spicy Nachos</p>
                        <p class="text-[11px] text-on-surface-variant">₹85</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2.5 border border-surface-variant/40 text-center">
                        <img class="w-14 h-14 object-cover mx-auto rounded-xl mb-1.5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8FwQOhwFWRh_QnLKtKoqFV1rhRTsc9RZNzjWQCa3Nwxjy5Kt6r0mb5p4U1Za0n0OInqOAtGqMUamP2XfIn8VS1y5LfmqTzGf2BG9nOa_pX4Q6Lf6KS2eV81LMRsqjK08xT9uE9-nfXzm5KfRggSmpzF-wnQ3z2lR2PwGUi4MjhK0Rlz1ldozeAHEnUuT8oL0w8uaCfslugw48uGUxWUdB-73c080SnbLg3VjMeBVKdvlycRF2LdU" alt="Chunky Salsa">
                        <p class="text-xs font-semibold truncate">Chunky Salsa</p>
                        <p class="text-[11px] text-on-surface-variant">₹75</p>
                    </div>
                    <div class="bg-surface/80 rounded-2xl p-2.5 border border-surface-variant/40 text-center">
                        <img class="w-14 h-14 object-cover mx-auto rounded-xl mb-1.5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhoDcdVeuZHn2N4ZEGd3ZwsuO4Jy-Gw4E66q8U3XucMgoSD33XrmPMYYJEAy2xDSuP3t_auiwWyQrY9b77M-CPFYC0hMlw8y4CsqIMoXO5LEHczCDqsAe7YFf2-h5x5kRRXiF9jpVVvKiIPFT-ZuH-Ecj4eZpToIg4ln-EQItVyFUnuSR-oe6zDRAiWOsOz8iy2BFipRe1V0tmTvLsuNyb9Tzmumh83svYHX9GJSFvk3flA-RlBrY" alt="Choc Cookies">
                        <p class="text-xs font-semibold truncate">Choc Cookies</p>
                        <p class="text-[11px] text-on-surface-variant">₹90</p>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-surface-variant/30">
                    <div>
                        <span class="text-xs text-on-surface-variant">Bundle Price:</span>
                        <span class="text-lg font-bold text-on-surface ml-1">₹310</span>
                        <span class="text-xs text-on-surface-variant line-through ml-1">₹355</span>
                    </div>
                    <button class="bg-emerald hover:bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all add-bundle-btn" data-items="prod_f01,prod_f02,prod_f03,prod_f04">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span>
                        Add Bundle to Cart
                    </button>
                </div>
            </div>
        </div>
    </main>

    <!-- Chat Input Box -->
    <div class="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto w-full">
        <form class="glass-card rounded-full p-2 flex items-center gap-2 border border-glass-border shadow-lg" id="chat-form">
            <input class="flex-1 bg-transparent px-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none" placeholder="Ask Flow Assist (e.g. Snacks for 4 under ₹500)..." type="text" id="chat-input">
            <button class="w-10 h-10 rounded-full bg-emerald hover:bg-primary text-white flex items-center justify-center transition-all shadow-md flex-shrink-0" type="submit" id="chat-submit">
                <span class="material-symbols-outlined text-lg">send</span>
            </button>
        </form>
    </div>
</div>`;
};

window.pageInits.flowassist = function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    // Prompt chip listeners
    document.querySelectorAll('.prompt-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (chatInput) {
                chatInput.value = chip.textContent.trim();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
    });

    // Bundle add listeners
    function bindBundleButtons() {
        document.querySelectorAll('.add-bundle-btn').forEach(btn => {
            btn.onclick = async () => {
                const itemIds = (btn.dataset.items || '').split(',');
                btn.textContent = 'Adding...';
                for (const id of itemIds) {
                    if (id) await api.addToCart(CURRENT_USER_ID, id, 1);
                }
                btn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span> Added to Cart!';
                btn.classList.add('bg-primary');
                setTimeout(() => navigate('/cart'), 800);
            };
        });
    }
    bindBundleButtons();

    // Form submit listener
    chatForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // Append user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'flex justify-end';
        userBubble.innerHTML = `
            <div class="bg-emerald text-white rounded-3xl rounded-tr-sm px-5 py-3 max-w-md shadow-sm text-sm">
                ${text}
            </div>
        `;
        chatMessages.appendChild(userBubble);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Loading bubble
        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'flex items-start gap-3';
        loadingBubble.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1">
                <span class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            </div>
            <div class="glass-card rounded-3xl rounded-tl-sm p-4 text-xs text-on-surface-variant">
                Crafting your tailored combo...
            </div>
        `;
        chatMessages.appendChild(loadingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const data = await api.flowAssist(text);
            loadingBubble.remove();

            const items = data.items || [];
            const itemIds = items.map(i => i.id).join(',');

            const aiBubble = document.createElement('div');
            aiBubble.className = 'flex items-start gap-3';
            aiBubble.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald to-royal-purple flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-sm">
                    <span class="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <div class="glass-card rounded-3xl rounded-tl-sm p-5 max-w-xl w-full shadow-md border border-glass-border space-y-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-royal-purple bg-royal-purple/15 px-2.5 py-0.5 rounded-full mb-1.5">
                                ${data.tag.toUpperCase()}
                            </span>
                            <h3 class="font-bold text-base text-on-surface">${data.bundle_name}</h3>
                        </div>
                        ${data.savings > 0 ? `<span class="text-xs bg-emerald/15 text-emerald font-semibold px-2.5 py-1 rounded-full">Saves ₹${data.savings}</span>` : ''}
                    </div>
                    <p class="text-xs text-on-surface-variant">${data.ai_message}</p>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        ${items.map(i => `
                            <div class="bg-surface/80 rounded-2xl p-2.5 border border-surface-variant/40 text-center">
                                <img class="w-14 h-14 object-cover mx-auto rounded-xl mb-1.5" src="${i.image_url}" alt="${i.name}">
                                <p class="text-xs font-semibold truncate">${i.name}</p>
                                <p class="text-[11px] text-on-surface-variant">₹${i.price}</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-surface-variant/30">
                        <div>
                            <span class="text-xs text-on-surface-variant">Total:</span>
                            <span class="text-lg font-bold text-on-surface ml-1">₹${data.total_price}</span>
                            ${data.mrp_total > data.total_price ? `<span class="text-xs text-on-surface-variant line-through ml-1">₹${data.mrp_total}</span>` : ''}
                        </div>
                        <button class="bg-emerald hover:bg-primary text-white text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all add-bundle-btn" data-items="${itemIds}">
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
    });
};

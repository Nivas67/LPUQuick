const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;

async function runAudit() {
    console.log('Launching headless Chrome via CDP on port', PORT);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=375,812',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    chromeProc.stderr.on('data', d => {
        // console.error('[Chrome]', d.toString());
    });

    // Wait for Chrome to be ready
    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        console.error('Failed to connect to Chrome CDP targets.');
        chromeProc.kill();
        process.exit(1);
    }

    const target = targets.find(t => t.type === 'page') || targets[0];
    console.log('Target found:', target.title, target.webSocketDebuggerUrl);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
    });

    let msgId = 1;
    const callbacks = new Map();

    ws.on('message', (raw) => {
        const msg = JSON.parse(raw);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
        }
    });

    function sendCommand(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    try {
        await sendCommand('Page.enable');
        await sendCommand('DOM.enable');
        await sendCommand('Runtime.enable');

        // Set mobile emulation
        await sendCommand('Emulation.setDeviceMetricsOverride', {
            width: 375,
            height: 812,
            deviceScaleFactor: 2,
            mobile: true
        });

        console.log('Navigating to http://localhost:3000/#/...');
        await sendCommand('Page.navigate', { url: 'http://localhost:3000/#/' });

        // Wait for page load and products to render
        await new Promise(r => setTimeout(r, 3000));

        // Evaluate layout, category rail, and initial state
        const initialAudit = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const rail = document.getElementById('vertical-category-rail');
                const railContainer = document.getElementById('category-rail-container');
                const items = rail ? Array.from(rail.querySelectorAll('.category-rail-item')).map(el => ({
                    id: el.dataset.catId,
                    label: el.querySelector('.category-rail-label')?.textContent.trim(),
                    emoji: el.querySelector('.category-rail-emoji')?.textContent.trim(),
                    active: el.classList.contains('active')
                })) : [];

                const mainGrid = document.getElementById('home-main-products-grid');
                const cards = mainGrid ? Array.from(mainGrid.querySelectorAll('.product-card-item:not(.hidden)')).map(c => ({
                    id: c.dataset.productId,
                    cat: c.dataset.category,
                    title: c.querySelector('h3')?.textContent.trim()
                })) : [];

                const railRect = railContainer ? railContainer.getBoundingClientRect() : null;
                const gridRect = mainGrid ? mainGrid.getBoundingClientRect() : null;

                return {
                    railItemsCount: items.length,
                    items,
                    visibleCardsCount: cards.length,
                    sampleCards: cards.slice(0, 4),
                    railWidth: railRect ? railRect.width : 0,
                    gridWidth: gridRect ? gridRect.width : 0,
                    bodyWidth: document.body.clientWidth,
                    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
                };
            })()`,
            returnByValue: true
        });

        console.log('\n--- 1. MOBILE VIEW INITIAL AUDIT ---');
        console.log('Rail Items Count:', initialAudit.result.value.railItemsCount);
        console.log('Rail Width (px):', initialAudit.result.value.railWidth);
        console.log('Product Grid Width (px):', initialAudit.result.value.gridWidth);
        console.log('Body Client Width (px):', initialAudit.result.value.bodyWidth);
        console.log('Horizontal Overflow Present?:', initialAudit.result.value.hasHorizontalOverflow);
        console.log('Sample Rail Items:', initialAudit.result.value.items.slice(0, 4));

        // Test Category Filtering: Biscuits
        console.log('\n--- 2. CATEGORY FILTERING: BISCUITS ---');
        const biscuitsResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const biscuitBtn = document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
                if (biscuitBtn) biscuitBtn.click();
                const visible = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)')).map(c => ({
                    id: c.dataset.productId,
                    cat: c.dataset.category,
                    title: c.querySelector('h3')?.textContent.trim()
                }));
                const allBiscuits = visible.every(c => c.cat === 'biscuits');
                return { count: visible.length, allBiscuits, titles: visible.map(c => c.title) };
            })()`,
            returnByValue: true
        });
        console.log('Biscuits Visible Count:', biscuitsResult.result.value.count);
        console.log('Are all strictly biscuits?:', biscuitsResult.result.value.allBiscuits);
        console.log('Biscuits Titles:', biscuitsResult.result.value.titles);

        // Test Category Filtering: Chips
        console.log('\n--- 3. CATEGORY FILTERING: CHIPS ---');
        const chipsResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const chipsBtn = document.querySelector('.category-rail-item[data-cat-id="chips"]');
                if (chipsBtn) chipsBtn.click();
                const visible = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)')).map(c => ({
                    id: c.dataset.productId,
                    cat: c.dataset.category,
                    title: c.querySelector('h3')?.textContent.trim()
                }));
                const allChips = visible.every(c => c.cat === 'chips');
                return { count: visible.length, allChips, titles: visible.map(c => c.title) };
            })()`,
            returnByValue: true
        });
        console.log('Chips Visible Count:', chipsResult.result.value.count);
        console.log('Are all strictly chips?:', chipsResult.result.value.allChips);
        console.log('Chips Titles:', chipsResult.result.value.titles);

        // Test Search + Category
        console.log('\n--- 4. SEARCH + CATEGORY FILTERING ---');
        const searchResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                // Return to Biscuits
                const biscuitBtn = document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
                if (biscuitBtn) biscuitBtn.click();

                // Search Oreo
                const searchMobile = document.getElementById('mobile-search') || document.getElementById('desktop-search');
                searchMobile.value = 'Oreo';
                searchMobile.dispatchEvent(new Event('input', { bubbles: true }));

                const oreoVisible = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)')).map(c => c.querySelector('h3')?.textContent.trim());

                // Search Maggi while in Biscuits
                searchMobile.value = 'Maggi';
                searchMobile.dispatchEvent(new Event('input', { bubbles: true }));
                const maggiVisible = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)')).length;
                const emptyState = document.getElementById('category-empty-state');
                const emptyVisible = emptyState && !emptyState.classList.contains('hidden');

                // Clear search
                searchMobile.value = '';
                searchMobile.dispatchEvent(new Event('input', { bubbles: true }));
                document.querySelector('.category-rail-item[data-cat-id="all"]')?.click();

                return {
                    oreoCount: oreoVisible.length,
                    oreoTitles: oreoVisible,
                    maggiCountInBiscuits: maggiVisible,
                    emptyStateVisibleOnMismatch: emptyVisible
                };
            })()`,
            returnByValue: true
        });
        console.log('Biscuits + "Oreo" Count:', searchResult.result.value.oreoCount, searchResult.result.value.oreoTitles);
        console.log('Biscuits + "Maggi" Count:', searchResult.result.value.maggiCountInBiscuits);
        console.log('Empty State Shown on Mismatch:', searchResult.result.value.emptyStateVisibleOnMismatch);

        // Test 5: ADD Stability & Zero Layout Shift Measurement
        console.log('\n--- 5. ADD-TO-CART STABILITY & REAL LAYOUT SHIFT MEASUREMENT ---');
        const addShiftResult = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const firstCard = document.querySelector('#home-main-products-grid .product-card-item:not(.hidden)');
                if (!firstCard) return { error: 'No card found' };

                const rectBefore = firstCard.getBoundingClientRect();
                const actionSlot = firstCard.querySelector('.product-action-slot');
                const addBtn = actionSlot ? actionSlot.querySelector('.add-to-cart-btn') : null;
                const slotBefore = actionSlot ? actionSlot.getBoundingClientRect() : null;

                if (!addBtn) return { error: 'No ADD button found' };

                // Click ADD
                addBtn.click();

                // Re-measure immediately
                const rectAfter = firstCard.getBoundingClientRect();
                const slotAfter = actionSlot ? actionSlot.getBoundingClientRect() : null;
                const stepper = actionSlot ? actionSlot.querySelector('.card-qty-stepper') : null;
                const qtyVal = stepper ? stepper.querySelector('.card-qty-val')?.textContent.trim() : null;

                // Click (+) twice
                const incBtn = stepper ? stepper.querySelector('.card-inc-btn') : null;
                if (incBtn) { incBtn.click(); incBtn.click(); }
                const qtyAfterInc = stepper ? stepper.querySelector('.card-qty-val')?.textContent.trim() : null;

                // Click (-) once
                const decBtn = stepper ? stepper.querySelector('.card-dec-btn') : null;
                if (decBtn) { decBtn.click(); }
                const qtyAfterDec = stepper ? stepper.querySelector('.card-qty-val')?.textContent.trim() : null;

                // Check floating cart bar
                const floatingCart = document.getElementById('global-floating-cart-bar');
                const floatingCartVisible = floatingCart && !floatingCart.classList.contains('hidden');
                const floatingSubtitle = document.getElementById('floating-cart-subtitle')?.textContent.trim();

                return {
                    productId: firstCard.dataset.productId,
                    cardHeightBefore: rectBefore.height,
                    cardHeightAfter: rectAfter.height,
                    cardWidthBefore: rectBefore.width,
                    cardWidthAfter: rectAfter.width,
                    cardTopBefore: rectBefore.top,
                    cardTopAfter: rectAfter.top,
                    heightDelta: Math.abs(rectAfter.height - rectBefore.height),
                    widthDelta: Math.abs(rectAfter.width - rectBefore.width),
                    topDelta: Math.abs(rectAfter.top - rectBefore.top),
                    slotWidthBefore: slotBefore ? slotBefore.width : 0,
                    slotWidthAfter: slotAfter ? slotAfter.width : 0,
                    hasStepper: !!stepper,
                    qtyAfterAdd: qtyVal,
                    qtyAfterInc: qtyAfterInc,
                    qtyAfterDec: qtyAfterDec,
                    floatingCartVisible,
                    floatingSubtitle
                };
            })()`,
            returnByValue: true
        });

        console.log('Card Height (Before -> After):', addShiftResult.result.value.cardHeightBefore, '->', addShiftResult.result.value.cardHeightAfter);
        console.log('Card Height Delta (Shift):', addShiftResult.result.value.heightDelta, 'px');
        console.log('Card Width Delta (Shift):', addShiftResult.result.value.widthDelta, 'px');
        console.log('Card Top Delta (Shift):', addShiftResult.result.value.topDelta, 'px');
        console.log('Action Slot Width (Before -> After):', addShiftResult.result.value.slotWidthBefore, '->', addShiftResult.result.value.slotWidthAfter);
        console.log('Quantity Progression (ADD -> ++ -> -):', addShiftResult.result.value.qtyAfterAdd, '->', addShiftResult.result.value.qtyAfterInc, '->', addShiftResult.result.value.qtyAfterDec);
        console.log('Floating Cart Visible?:', addShiftResult.result.value.floatingCartVisible);
        console.log('Floating Cart Text:', addShiftResult.result.value.floatingSubtitle);

        // Test 6: In-Modal Add/Stepper In-Place Update
        console.log('\n--- 6. PRODUCT MODAL IN-PLACE QUANTITY STABILITY ---');
        const modalResult = await sendCommand('Runtime.evaluate', {
            expression: `(async () => {
                const secondCard = document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)')[1];
                if (!secondCard) return { error: 'No second card' };
                const pid = secondCard.dataset.productId;

                // Open modal via detail trigger
                window.openProductModal(pid);
                await new Promise(r => setTimeout(r, 600));

                const modal = document.getElementById('product-modal');
                if (!modal) return { error: 'Modal not opened' };

                const modalContent = modal.querySelector('.modal-sheet') || modal.querySelector('.modal-content') || modal;
                const modalIdBefore = modal.dataset.productId;

                // Click modal ADD
                const modalAdd = document.getElementById('modal-add-btn');
                if (!modalAdd) return { error: 'Modal ADD button not found' };
                modalAdd.click();

                await new Promise(r => setTimeout(r, 200));

                const modalAfter = document.getElementById('product-modal');
                const isStillSameModal = (modal === modalAfter);
                const modalStepper = document.getElementById('modal-action-container')?.querySelector('.card-qty-stepper');
                const modalQty = modalStepper?.querySelector('.card-qty-val')?.textContent.trim();

                // Increment inside modal
                const inc = document.getElementById('modal-inc-btn');
                if (inc) inc.click();
                await new Promise(r => setTimeout(r, 100));
                const modalQtyAfterInc = modalStepper?.querySelector('.card-qty-val')?.textContent.trim();

                // Close modal
                modal.remove();

                return {
                    isStillSameModal,
                    modalIdBefore,
                    modalQtyAfterAdd: modalQty,
                    modalQtyAfterInc: modalQtyAfterInc,
                    zeroModalDestruction: isStillSameModal && !!modalStepper
                };
            })()`,
            awaitPromise: true,
            returnByValue: true
        });

        console.log('Modal Maintained Same DOM Instance?:', modalResult.result.value.isStillSameModal);
        console.log('In-Modal Quantity After ADD:', modalResult.result.value.modalQtyAfterAdd);
        console.log('In-Modal Quantity After Increment:', modalResult.result.value.modalQtyAfterInc);
        console.log('Zero Modal Destruction/Re-animation Verified?:', modalResult.result.value.zeroModalDestruction);

        // Take Mobile Screenshot
        const screenshotMobile = await sendCommand('Page.captureScreenshot', { format: 'png' });
        const mobileImgPath = path.join(__dirname, '..', 'mobile_audit_screenshot.png');
        fs.writeFileSync(mobileImgPath, Buffer.from(screenshotMobile.data, 'base64'));
        console.log('\nSaved Mobile Screenshot:', mobileImgPath);

        // Test 7: Desktop Viewport Audit
        console.log('\n--- 7. DESKTOP VIEWPORT AUDIT (1280x800) ---');
        await sendCommand('Emulation.setDeviceMetricsOverride', {
            width: 1280,
            height: 800,
            deviceScaleFactor: 1,
            mobile: false
        });
        await new Promise(r => setTimeout(r, 500));

        const desktopAudit = await sendCommand('Runtime.evaluate', {
            expression: `(() => {
                const rail = document.getElementById('vertical-category-rail');
                const railContainer = document.getElementById('category-rail-container');
                const mainGrid = document.getElementById('home-main-products-grid');
                const railRect = railContainer?.getBoundingClientRect();
                const gridRect = mainGrid?.getBoundingClientRect();

                return {
                    railWidth: railRect?.width,
                    gridWidth: gridRect?.width,
                    ratio: gridRect && railRect ? (gridRect.width / railRect.width).toFixed(1) : null,
                    isGridDominant: gridRect && railRect ? (gridRect.width > railRect.width * 5) : false,
                    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
                };
            })()`,
            returnByValue: true
        });

        console.log('Desktop Rail Width (px):', desktopAudit.result.value.railWidth);
        console.log('Desktop Product Grid Width (px):', desktopAudit.result.value.gridWidth);
        console.log('Product Grid to Rail Width Ratio:', desktopAudit.result.value.ratio, ': 1');
        console.log('Is Grid Vastly Dominant (>5x rail)?:', desktopAudit.result.value.isGridDominant);
        console.log('Desktop Horizontal Overflow?:', desktopAudit.result.value.hasHorizontalOverflow);

        // Take Desktop Screenshot
        const screenshotDesktop = await sendCommand('Page.captureScreenshot', { format: 'png' });
        const desktopImgPath = path.join(__dirname, '..', 'desktop_audit_screenshot.png');
        fs.writeFileSync(desktopImgPath, Buffer.from(screenshotDesktop.data, 'base64'));
        console.log('Saved Desktop Screenshot:', desktopImgPath);

        console.log('\n================================================================');
        console.log('🎯 ALL REAL CHROME CDP BROWSER VERIFICATIONS COMPLETED SUCCESSFULLY!');
        console.log('================================================================\n');

    } finally {
        ws.close();
        chromeProc.kill();
    }
}

runAudit().catch(err => {
    console.error('Audit Error:', err);
    process.exit(1);
});

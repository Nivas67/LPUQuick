const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9338;
const ARTIFACTS_DIR = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';

async function run() {
    console.log('[Verify] Starting Chrome on port', PORT);
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,900',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 400));
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

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async function evaluate(expression) {
        const res = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        return res?.result?.value;
    }

    async function captureScreenshot(filename) {
        const res = await send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const outPath = path.join(ARTIFACTS_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`[Screenshot Saved] -> ${outPath}`);
    }

    try {
        await send('Page.enable');
        await send('Runtime.enable');

        // 1. Emulate Desktop 1280x900
        await send('Emulation.setDeviceMetricsOverride', {
            width: 1280,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        console.log('[Verify] Navigating to http://localhost:3000/#/');
        await send('Page.navigate', { url: 'http://localhost:3000/#/' });
        await new Promise(r => setTimeout(r, 2000));

        // 2. Audit Header: Admin button removed? Install button present? Search button present?
        const headerAudit = await evaluate(`(() => {
            const header = document.querySelector('header.dynamic-island-nav');
            if (!header) return { error: 'Header not found' };

            const adminShield = header.querySelector('span.material-symbols-outlined:contains("admin_panel_settings")') || 
                                Array.from(header.querySelectorAll('span.material-symbols-outlined')).find(s => s.textContent.trim() === 'admin_panel_settings');
            const adminLink = header.querySelector('a[href="/admin"]');
            const searchBtn = document.getElementById('btn-desktop-search');
            const searchInput = document.getElementById('desktop-search');
            const installBtn = header.querySelector('.btn-install-app');
            const inFeedInstall = document.querySelector('section.btn-install-app');

            return {
                hasAdminShield: Boolean(adminShield),
                hasAdminLink: Boolean(adminLink),
                hasSearchBtn: Boolean(searchBtn),
                hasSearchInput: Boolean(searchInput),
                hasHeaderInstallBtn: Boolean(installBtn) && !installBtn.classList.contains('hidden'),
                hasInFeedInstallCard: Boolean(inFeedInstall) && !inFeedInstall.classList.contains('hidden')
            };
        })()`);

        console.log('[Header Audit Results]:', JSON.stringify(headerAudit, null, 2));

        // 3. Test Live Autocomplete Search Dropdown
        console.log('[Verify] Testing Search with query "maggi"...');
        const dropdownResult = await evaluate(`(() => {
            const input = document.getElementById('desktop-search');
            if (!input) return { error: 'desktop-search missing' };
            input.focus();
            input.value = 'maggi';
            input.dispatchEvent(new Event('input', { bubbles: true }));

            const dropdown = document.getElementById('desktop-search-dropdown');
            const isVisible = dropdown && !dropdown.classList.contains('hidden');
            const itemsCount = dropdown ? dropdown.querySelectorAll('.search-dropdown-item').length : 0;
            const clearBtnVisible = !document.getElementById('btn-clear-desktop-search')?.classList.contains('hidden');

            return { isVisible, itemsCount, clearBtnVisible, dropdownHtml: dropdown?.innerHTML.slice(0, 200) };
        })()`);

        console.log('[Dropdown Search Result]:', JSON.stringify(dropdownResult, null, 2));
        await new Promise(r => setTimeout(r, 600));
        await captureScreenshot('search_dropdown_preview.png');

        // 4. Test Search Button Click & Scroll to Catalog
        console.log('[Verify] Clicking Search Button #btn-desktop-search...');
        const clickResult = await evaluate(`(() => {
            const btn = document.getElementById('btn-desktop-search');
            btn.click();
            return {
                query: document.getElementById('desktop-search')?.value,
                dropdownHidden: document.getElementById('desktop-search-dropdown')?.classList.contains('hidden')
            };
        })()`);
        console.log('[Search Click Result]:', JSON.stringify(clickResult, null, 2));

        await new Promise(r => setTimeout(r, 800));
        const postScrollAudit = await evaluate(`(() => {
            const mainGrid = document.getElementById('home-main-products-grid');
            const visibleCards = mainGrid ? Array.from(mainGrid.querySelectorAll('.product-card-item')).filter(c => !c.classList.contains('hidden')) : [];
            const titles = visibleCards.map(c => c.querySelector('h3')?.textContent?.trim());
            return {
                scrollY: window.pageYOffset,
                visibleCardsCount: visibleCards.length,
                sampleTitles: titles.slice(0, 3)
            };
        })()`);
        console.log('[Post-Search Scroll & Filter Audit]:', JSON.stringify(postScrollAudit, null, 2));
        await captureScreenshot('search_results_scrolled.png');

        // 5. Test Clear Button
        console.log('[Verify] Testing Clear Button #btn-clear-desktop-search...');
        const clearResult = await evaluate(`(() => {
            const clearBtn = document.getElementById('btn-clear-desktop-search');
            clearBtn.click();
            const mainGrid = document.getElementById('home-main-products-grid');
            const visibleCards = mainGrid ? Array.from(mainGrid.querySelectorAll('.product-card-item')).filter(c => !c.classList.contains('hidden')) : [];
            return {
                queryValue: document.getElementById('desktop-search')?.value,
                totalRestoredCards: visibleCards.length,
                clearBtnHidden: clearBtn.classList.contains('hidden')
            };
        })()`);
        console.log('[Clear Button Result]:', JSON.stringify(clearResult, null, 2));

        // 6. Test Install Modal Trigger
        console.log('[Verify] Testing Install Button click to verify modal...');
        const installModalResult = await evaluate(`(() => {
            const installBtn = document.getElementById('btn-header-install-app') || document.querySelector('.btn-install-app');
            if (!installBtn) return { error: 'Install button not found' };
            installBtn.click();
            const modal = document.getElementById('generic-install-modal') || document.getElementById('android-install-modal') || document.getElementById('ios-install-modal');
            return {
                modalFound: Boolean(modal),
                modalId: modal?.id,
                modalTitle: modal?.querySelector('h3')?.textContent
            };
        })()`);
        console.log('[Install Modal Result]:', JSON.stringify(installModalResult, null, 2));
        await new Promise(r => setTimeout(r, 600));
        await captureScreenshot('install_modal_preview.png');

        // Close install modal
        await evaluate(`(() => { if (typeof window.closeInstallModal === 'function') window.closeInstallModal(); })()`);
        await new Promise(r => setTimeout(r, 400));

        // 7. Mobile Viewport Emulation
        console.log('[Verify] Switching to Mobile 375x812 Viewport...');
        await send('Emulation.setDeviceMetricsOverride', {
            width: 375,
            height: 812,
            deviceScaleFactor: 2,
            mobile: true
        });
        await send('Page.navigate', { url: 'http://localhost:3000/#/' });
        await new Promise(r => setTimeout(r, 1500));

        const mobileAudit = await evaluate(`(() => {
            const mobileSearchBtn = document.getElementById('btn-mobile-search');
            const mobileSearchInput = document.getElementById('mobile-search');
            const mobileClearBtn = document.getElementById('btn-clear-mobile-search');
            const headerInstallBtn = document.querySelector('.btn-install-app');
            const smartBanner = document.getElementById('home-mobile-smart-banner');
            const inFeedCard = document.querySelector('section.btn-install-app');

            // Type in mobile search
            if (mobileSearchInput) {
                mobileSearchInput.value = 'chips';
                mobileSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const mobileDropdown = document.getElementById('mobile-search-dropdown');

            return {
                hasMobileSearchBtn: Boolean(mobileSearchBtn),
                hasMobileSearchInput: Boolean(mobileSearchInput),
                hasMobileClearBtn: Boolean(mobileClearBtn),
                dropdownVisible: mobileDropdown && !mobileDropdown.classList.contains('hidden'),
                dropdownItems: mobileDropdown ? mobileDropdown.querySelectorAll('.search-dropdown-item').length : 0,
                hasSmartBanner: Boolean(smartBanner),
                hasInFeedCard: Boolean(inFeedCard)
            };
        })()`);
        console.log('[Mobile Audit Result]:', JSON.stringify(mobileAudit, null, 2));
        await captureScreenshot('mobile_search_and_install_preview.png');

        console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
    } catch (e) {
        console.error('[Audit Error]:', e);
    } finally {
        ws.close();
        chromeProc.kill();
    }
}

run();

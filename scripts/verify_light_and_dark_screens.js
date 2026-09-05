const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9448;

async function run() {
    console.log('🚀 Launching Chrome CDP for Light Screen & Carousel Verification...');
    const chromeProc = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--window-size=1280,900',
        '--disable-gpu',
        '--no-sandbox',
        'about:blank'
    ]);

    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json`);
            const targets = await res.json();
            const target = targets.find(t => t.type === 'page') || targets[0];
            if (target) {
                const ws = new WebSocket(target.webSocketDebuggerUrl);
                await new Promise(resolve => ws.on('open', resolve));

                let id = 1;
                function send(method, params = {}) {
                    return new Promise((resolve, reject) => {
                        const curId = id++;
                        const onMsg = (data) => {
                            const parsed = JSON.parse(data);
                            if (parsed.id === curId) {
                                ws.off('message', onMsg);
                                if (parsed.error) reject(parsed.error);
                                else resolve(parsed.result);
                            }
                        };
                        ws.on('message', onMsg);
                        ws.send(JSON.stringify({ id: curId, method, params }));
                    });
                }

                await send('Page.enable');
                await send('Runtime.enable');
                await send('Page.addScriptToEvaluateOnNewDocument', {
                    source: `
                        localStorage.setItem('lpuquick_user', JSON.stringify({ id: 'test_student', name: 'Nivas Student' }));
                        localStorage.setItem('lpuquick_room', '304');
                        localStorage.setItem('lpuquick_phone', '9876543210');
                        localStorage.setItem('lpuquick_address_configured', 'true');
                        localStorage.setItem('lpuquick_theme', 'light');
                    `
                });
                await send('Page.navigate', { url: 'http://localhost:3000/#/' });
                
                // Wait for carousel to be mounted in DOM
                for (let w = 0; w < 30; w++) {
                    await new Promise(r => setTimeout(r, 400));
                    const chk = await send('Runtime.evaluate', {
                        expression: 'Boolean(document.getElementById("hero-banner-carousel"))',
                        returnByValue: true
                    });
                    if (chk.result && chk.result.value) break;
                }
                // Extra tick for CSS render
                await new Promise(r => setTimeout(r, 800));

                // 1. Audit Carousel in Chrome
                const carouselAudit = await send('Runtime.evaluate', {
                    expression: `(() => {
                        const c = document.getElementById('hero-banner-carousel');
                        const t = document.getElementById('carousel-track');
                        const slides = document.querySelectorAll('.hero-carousel-slide');
                        const prev = document.getElementById('carousel-prev-btn');
                        const next = document.getElementById('carousel-next-btn');
                        const dots = document.querySelectorAll('.hero-carousel-dot');

                        return {
                            containerOverflow: c ? getComputedStyle(c).overflow : null,
                            containerRadius: c ? getComputedStyle(c).borderRadius : null,
                            trackDisplay: t ? getComputedStyle(t).display : null,
                            trackFlexDirection: t ? getComputedStyle(t).flexDirection : null,
                            trackFlexWrap: t ? getComputedStyle(t).flexWrap : null,
                            slideCount: slides.length,
                            slide1Width: slides[0] ? slides[0].getBoundingClientRect().width : null,
                            prevBtnDisplay: prev ? getComputedStyle(prev).display : null,
                            prevBtnPos: prev ? getComputedStyle(prev).position : null,
                            prevBtnBlur: prev ? getComputedStyle(prev).backdropFilter : null,
                            dotsCount: dots.length
                        };
                    })()`,
                    returnByValue: true
                });
                console.log('--- CAROUSEL AUDIT ---');
                console.log(JSON.stringify(carouselAudit.result.value, null, 2));

                // 2. Switch to Light Mode and verify Glassmorphism
                const lightModeAudit = await send('Runtime.evaluate', {
                    expression: `(() => {
                        if (window.setLightMode) window.setLightMode();
                        else {
                            document.documentElement.classList.remove('dark');
                            if (document.body) document.body.classList.remove('dark');
                        }

                        const header = document.querySelector('header');
                        const card = document.querySelector('.product-card-item');
                        const railItem = document.querySelector('.category-rail-item.active');
                        const input = document.querySelector('input[type="text"]');
                        const nav = document.querySelector('nav');

                        return {
                            isDark: document.documentElement.classList.contains('dark'),
                            headerBackdrop: header ? getComputedStyle(header).backdropFilter : null,
                            headerBg: header ? getComputedStyle(header).backgroundColor : null,
                            cardBackdrop: card ? getComputedStyle(card).backdropFilter : null,
                            cardBg: card ? getComputedStyle(card).backgroundColor : null,
                            cardBorder: card ? getComputedStyle(card).borderColor : null,
                            cardShadow: card ? getComputedStyle(card).boxShadow : null,
                            railActiveBg: railItem ? getComputedStyle(railItem).backgroundColor : null,
                            inputBackdrop: input ? getComputedStyle(input).backdropFilter : null,
                            navBackdrop: nav ? getComputedStyle(nav).backdropFilter : null
                        };
                    })()`,
                    returnByValue: true
                });
                console.log('\n--- LIGHT SCREEN GLASSMORPHISM AUDIT ---');
                console.log(JSON.stringify(lightModeAudit.result.value, null, 2));

                // Capture Light Screen Screenshot
                const lightSs = await send('Page.captureScreenshot', { format: 'png' });
                const artifactDir = 'C:\\Users\\Digvi\\.gemini\\antigravity-ide\\brain\\d5b40e4b-477d-4c15-bf71-c202ca6b4a11';
                fs.writeFileSync(path.join(artifactDir, 'light_screen_glassmorphism.png'), Buffer.from(lightSs.data, 'base64'));
                console.log('✓ Saved light_screen_glassmorphism.png');

                // 3. Switch back to Dark Mode and capture Dark Screen Screenshot
                await send('Runtime.evaluate', {
                    expression: `(() => {
                        if (window.setNightMode) window.setNightMode();
                        else {
                            document.documentElement.classList.add('dark');
                            if (document.body) document.body.classList.add('dark');
                        }
                    })()`
                });
                await new Promise(r => setTimeout(r, 600));

                const darkSs = await send('Page.captureScreenshot', { format: 'png' });
                fs.writeFileSync(path.join(artifactDir, 'dark_screen_overhaul.png'), Buffer.from(darkSs.data, 'base64'));
                console.log('✓ Saved dark_screen_overhaul.png');

                chromeProc.kill();
                process.exit(0);
            }
        } catch (e) {}
    }
    chromeProc.kill();
    process.exit(1);
}

run().catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
});

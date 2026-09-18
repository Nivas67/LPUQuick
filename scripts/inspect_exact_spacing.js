const { spawn } = require('child_process');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9345;

async function checkScreen(width, height) {
    const cp = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--window-size=${width},${height}`,
        '--disable-gpu',
        '--no-sandbox',
        'http://localhost:3000/#/'
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

    const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 1;
    function send(method, params = {}) {
        const id = msgId++;
        return new Promise(resolve => {
            const h = (raw) => {
                const d = JSON.parse(raw);
                if (d.id === id) {
                    ws.off('message', h);
                    resolve(d.result);
                }
            };
            ws.on('message', h);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await new Promise(r => setTimeout(r, 1500));

    const res = await send('Runtime.evaluate', {
        expression: `(() => {
            const aside = document.getElementById('category-rail-container');
            const parent = document.getElementById('shop-catalog-split-row');
            const nav = document.getElementById('vertical-category-rail');
            const tagBtn = document.getElementById('rail-tag-under20');
            const rightPane = parent ? parent.children[1] : null;
            const grid = document.getElementById('home-main-products-grid');
            const firstCard = grid ? grid.querySelector('.product-card-item') : null;

            const asideR = aside ? aside.getBoundingClientRect() : null;
            const tagR = tagBtn ? tagBtn.getBoundingClientRect() : null;
            const rightR = rightPane ? rightPane.getBoundingClientRect() : null;
            const cardR = firstCard ? firstCard.getBoundingClientRect() : null;

            return {
                windowWidth: window.innerWidth,
                parentGap: parent ? window.getComputedStyle(parent).gap : null,
                asideWidth: asideR ? asideR.width : null,
                asideRight: asideR ? asideR.right : null,
                tagBtnWidth: tagR ? tagR.width : null,
                tagBtnRight: tagR ? tagR.right : null,
                rightPaneLeft: rightR ? rightR.left : null,
                cardLeft: cardR ? cardR.left : null,
                gapBetweenAsideAndCard: cardR && asideR ? (cardR.left - asideR.right) : null,
                spaceFromTagBtnToCard: cardR && tagR ? (cardR.left - tagR.right) : null
            };
        })()`,
        returnByValue: true
    });

    ws.close();
    cp.kill();
    return res && res.result ? res.result.value : res;
}

async function runAll() {
    for (const [w, h] of [[390, 844], [768, 1024], [1024, 800], [1280, 900], [1440, 900]]) {
        const data = await checkScreen(w, h);
        console.log(`\n--- Screen: ${w}x${h} ---`);
        console.log(JSON.stringify(data, null, 2));
    }
}

runAll().catch(console.error);

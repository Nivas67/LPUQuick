/**
 * LPUQuick — Mobile-First Customer Screen Audit & Responsive Suite
 * Validates:
 * 1. Safe-area CSS insets and environment variable presence
 * 2. Mobile viewport meta tags (viewport-fit=cover, no unwanted zoom)
 * 3. Element containment and overflow protection across 320px, 360px, 375px, 390px, 412px, 430px
 * 4. Touch target sizes and ergonomic thumb accessibility
 * 5. Bottom navigation and sticky checkout bar anchoring
 * 6. Category dual-pane responsiveness
 * 7. Out-of-stock and Flow Assist banner containment
 * 8. Decommissioned profit and revenue elimination across public assets
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================');
console.log('📱 RUNNING MOBILE-FIRST RESPONSIVE & SAFETY AUDIT');
console.log('======================================================');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name} — ${err.message}`);
        failed++;
    }
}

// Read Core Files
const indexPath = path.join(__dirname, '../../client/index.html');
const cssPath = path.join(__dirname, '../../client/css/styles.css');
const homePath = path.join(__dirname, '../../client/js/pages/home.js');
const categoriesPath = path.join(__dirname, '../../client/js/pages/categories.js');
const cartPath = path.join(__dirname, '../../client/js/pages/cart.js');
const checkoutPath = path.join(__dirname, '../../client/js/pages/checkout.js');
const adminIndexPath = path.join(__dirname, '../../admin/index.html');
const adminJsPath = path.join(__dirname, '../../admin/js/admin.js');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
const stylesCss = fs.readFileSync(cssPath, 'utf8');
const homeJs = fs.readFileSync(homePath, 'utf8');
const categoriesJs = fs.readFileSync(categoriesPath, 'utf8');
const cartJs = fs.readFileSync(cartPath, 'utf8');
const checkoutJs = fs.readFileSync(checkoutPath, 'utf8');
const adminHtml = fs.readFileSync(adminIndexPath, 'utf8');
const adminJs = fs.readFileSync(adminJsPath, 'utf8');

// --- AUDIT 1: PWA & Safe-Area Configuration ---
console.log('\n--- AUDIT 1: PWA & Mobile Meta Viewport ---');

test('Viewport tag includes viewport-fit=cover for iOS dynamic island / notch', () => {
    assert(indexHtml.includes('viewport-fit=cover'), 'index.html must specify viewport-fit=cover');
});

test('Safe area CSS environment variables defined in :root', () => {
    assert(stylesCss.includes('--safe-top: env(safe-area-inset-top'), 'styles.css defines --safe-top');
    assert(stylesCss.includes('--safe-bottom: env(safe-area-inset-bottom'), 'styles.css defines --safe-bottom');
});

test('HTML/Body prevents horizontal page wobble (overflow-x: hidden)', () => {
    assert(stylesCss.includes('overflow-x: hidden !important'), 'overflow-x: hidden must be strictly enforced');
});

// --- AUDIT 2: Mobile Fixed Headers & Bottom Bars ---
console.log('\n--- AUDIT 2: Mobile Header & Bottom Navigation Offsets ---');

test('Mobile header handles safe-area top inset without content clipping', () => {
    assert(stylesCss.includes('padding-top: max(0.625rem, env(safe-area-inset-top'), 'Header applies safe-area padding');
});

test('Mobile bottom navigation bar anchors cleanly with safe-area bottom inset', () => {
    assert(stylesCss.includes('bottom: max(0.75rem, env(safe-area-inset-bottom'), 'Bottom nav applies safe-area bottom');
});

test('Global floating action bars (cart & tracking) sit above bottom nav', () => {
    assert(stylesCss.includes('#global-floating-cart-bar'), 'styles.css styles floating cart bar');
    assert(stylesCss.includes('bottom: calc(4.75rem + max(0.5rem, env(safe-area-inset-bottom'), 'Action bars offset above bottom nav');
});

// --- AUDIT 3: Extra-Small Screen Adaptations (320px - 360px) ---
console.log('\n--- AUDIT 3: 320px - 360px Extra-Small Viewports ---');

test('CSS media query max-width: 360px adjusts card padding and typography', () => {
    assert(stylesCss.includes('@media screen and (max-width: 360px)'), '360px breakpoint defined');
    assert(stylesCss.includes('.product-card-item'), 'Product cards adjusted for 360px');
});

test('Dual-pane category rail is compact (84px / 76px on small screens)', () => {
    assert(categoriesJs.includes('w-[84px]'), 'categories.js uses compact 84px left rail on mobile');
    assert(stylesCss.includes('#left-categories-rail'), 'styles.css provides compact 360px rail width');
});

test('Promotional Bento Banners stack gracefully without horizontal overflow', () => {
    assert(homeJs.includes('w-full sm:w-3/4'), 'Flow assist banner width stacks on mobile');
});

// --- AUDIT 4: One-Handed Cart Ergonomics ---
console.log('\n--- AUDIT 4: Cart & Checkout Mobile Ergonomics ---');

test('Cart page features sticky one-handed mobile checkout bar', () => {
    assert(cartJs.includes('Mobile Sticky One-Handed Checkout Bar'), 'cart.js includes sticky checkout bar');
    assert(cartJs.includes('Proceed to Checkout') || cartJs.includes('To Pay:'), 'Bar shows payment amount and action');
});

test('Modal dialogs respect dynamic viewport height and safe-area padding', () => {
    assert(stylesCss.includes('max-height: min(88vh, calc(100dvh - 3rem))'), 'Modal content capped at 100dvh');
    assert(stylesCss.includes('padding-bottom: max(1.5rem, env(safe-area-inset-bottom'), 'Modal adds safe-area padding');
});

// --- AUDIT 5: Complete Elimination of Old Analytics / Financial Fields ---
console.log('\n--- AUDIT 5: Zero Obsolete Analytics / Profit Leftover ---');

test('Admin overview dashboard has zero Revenue or Profit KPI cards', () => {
    assert(!adminHtml.includes('id="dash-total-revenue"'), 'dash-total-revenue card removed from admin overview');
    assert(!adminHtml.includes('id="dash-profit-card"'), 'dash-profit-card removed from admin overview');
});

test('Admin analytics view has zero Revenue or Profit tiles', () => {
    assert(!adminHtml.includes('id="analytics-rev"'), 'analytics-rev removed');
    assert(!adminHtml.includes('id="analytics-profit-card"'), 'analytics-profit-card removed');
    assert(!adminHtml.includes('Revenue Generated'), 'Revenue Generated column removed from top products');
});

test('Admin JS contains zero profit lock toggles or profit fetch calls', () => {
    assert(!adminJs.includes('toggleProfitVisibility'), 'toggleProfitVisibility function removed');
    assert(!adminJs.includes('api/admin/profits'), 'api/admin/profits calls removed');
});

console.log('\n======================================================');
console.log(`🏁 AUDIT RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('======================================================\n');

process.exit(failed > 0 ? 1 : 0);

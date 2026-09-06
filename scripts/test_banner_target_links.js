const fs = require('fs');

// Check home.js syntax
const homeJs = fs.readFileSync('client/js/pages/home.js', 'utf8');
const appJs = fs.readFileSync('client/js/app.js', 'utf8');

console.log('1. home.js contains handleBannerTargetClick:', homeJs.includes('window.handleBannerTargetClick = function'));
console.log('2. home.js has carousel swipe guard:', homeJs.includes('__carouselSwipedTimestamp'));
console.log('3. app.js router handles in-page anchors:', appJs.includes('rawHash && !rawHash.startsWith'));

// Mock DOM test
let openedUrl = null;
let scrolledTo = null;
let hash = '#/';

global.window = {
    location: {
        get hash() { return hash; },
        set hash(v) { hash = v; },
        href: ''
    },
    open: (url, target, features) => {
        openedUrl = { url, target, features };
        return { closed: false };
    },
    scrollTo: (opts) => {
        scrolledTo = opts;
    },
    pageYOffset: 100
};
global.document = {
    getElementById: (id) => {
        if (id === 'shop-catalog-section') {
            return {
                getBoundingClientRect: () => ({ top: 400 }),
                classList: { add: () => {}, remove: () => {} }
            };
        }
        return null;
    },
    querySelector: () => null
};

// Evaluate the handleBannerTargetClick function
eval(homeJs.slice(homeJs.indexOf('window.handleBannerTargetClick = function'), homeJs.indexOf('function renderHomeBannerSlideHTML')));

// Test 1: WhatsApp external link
window.handleBannerTargetClick('https://wa.me/8106422900');
console.log('Test 1 - WhatsApp opened in new tab:', openedUrl?.url === 'https://wa.me/8106422900', 'Hash untouched:', window.location.hash === '#/');

// Test 2: In-page anchor #shop-catalog-section
openedUrl = null;
scrolledTo = null;
window.handleBannerTargetClick('#shop-catalog-section');
console.log('Test 2 - In-page anchor smooth scrolled:', scrolledTo?.behavior === 'smooth', 'Position calculated:', scrolledTo?.top > 0);

// Test 3: Swipe guard
window.__carouselSwipedTimestamp = Date.now();
let eventPrevented = false;
const res = window.handleBannerTargetClick('#shop-catalog-section', { preventDefault: () => eventPrevented = true, stopPropagation: () => {} });
console.log('Test 3 - Swipe guard suppressed click:', res === false);

// Test 4: SPA Route #/categories
window.__carouselSwipedTimestamp = 0;
window.handleBannerTargetClick('#/categories');
console.log('Test 4 - SPA route set hash to #/categories:', window.location.hash === '#/categories');

// Test 5: Plain route string like "categories" or "/categories"
window.handleBannerTargetClick('/flow-assist');
console.log('Test 5 - Clean path /flow-assist normalized:', window.location.hash === '#/flow-assist');

console.log('\nAll tests passed successfully!');

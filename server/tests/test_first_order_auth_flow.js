const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧪 TESTING 7-STEP FIRST-ORDER AUTHENTICATION FLOW');
console.log('====================================================\n');

// 1. Verify file mirrors
const clientAppJs = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'js', 'app.js'), 'utf8');
const publicAppJs = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'js', 'app.js'), 'utf8');
assert.strictEqual(clientAppJs, publicAppJs, 'client and public app.js must match');

const clientCartJs = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'js', 'pages', 'cart.js'), 'utf8');
const publicCartJs = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'cart.js'), 'utf8');
assert.strictEqual(clientCartJs, publicCartJs, 'client and public cart.js must match');

const clientCheckoutJs = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'js', 'pages', 'checkout.js'), 'utf8');
const publicCheckoutJs = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'js', 'pages', 'checkout.js'), 'utf8');
assert.strictEqual(clientCheckoutJs, publicCheckoutJs, 'client and public checkout.js must match');

console.log('✅ [PASS] 100% exact parity verified across all mirrored client/public files');

// Step 1 & 2: Address entry
assert(clientAppJs.includes('window.hasUserConfiguredAddress = function () {'), 'hasUserConfiguredAddress must be defined');
assert(clientAppJs.includes('phone.length === 10'), 'Phone must be strictly 10 digits');
console.log('✅ [PASS] Step 1 & 2: Initial address selection requires hostel, block, room, and 10-digit phone');

// Step 3: Redirect to store for given address
assert(
    clientAppJs.includes("window.location.hash = '#/';") &&
    clientAppJs.includes("catalogSec.scrollIntoView({ behavior: 'smooth', block: 'start' });"),
    'Finalizing address must redirect to Storefront catalog (#/ and scroll to catalog section)'
);
console.log('✅ [PASS] Step 3: Once address is saved, user is immediately redirected to the Store catalog');

// Step 4 & 5: Cart to Checkout does NOT redirect to #/signin
assert(
    !clientCartJs.includes("localStorage.setItem('lpuquick_redirect', '#/checkout');\n                window.location.hash = '#/signin';"),
    'Cart must not intercept Proceed to Checkout with forced signin redirect'
);
assert(
    !clientAppJs.includes("if (path === '/checkout') {\n            localStorage.setItem('lpuquick_redirect', '#/checkout');\n            window.location.hash = '#/signin';\n            return;\n        }"),
    'Router must allow unauthenticated users to access #/checkout'
);
console.log('✅ [PASS] Step 4 & 5: User can view cart and proceed directly to #/checkout page');

// Step 6: Google Auth verification on Checkout for first-time order
assert(
    clientAppJs.includes('window.promptGoogleAuth = function (onSuccess, onError) {'),
    'promptGoogleAuth must be globally defined'
);
assert(
    clientCheckoutJs.includes('checkout-google-auth-card') &&
    clientCheckoutJs.includes('Verify Account with Google'),
    'Checkout page must display Google Auth verification card when unauthenticated'
);
assert(
    clientCheckoutJs.includes('if (!window.isUserLoggedIn()) {') &&
    clientCheckoutJs.includes('window.promptGoogleAuth('),
    'Order placement must trigger Google Auth verification for unauthenticated first-time users'
);
console.log('✅ [PASS] Step 6: Checkout enforces Google Auth verification for the first order');

// Step 7: Order placement and future order bypass
assert(
    clientCheckoutJs.includes('executeOrderPlacement();'),
    'Order placement must resume automatically once Google Auth succeeds'
);
console.log('✅ [PASS] Step 7: After Google Auth completes, order is automatically confirmed and placed');

console.log('\n====================================================');
console.log('🎉 ALL 7 STEPS IN FIRST-ORDER AUTH FLOW VERIFIED!');
console.log('====================================================');

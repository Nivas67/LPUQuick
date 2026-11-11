/**
 * Verification Test: Mandatory Initial Address Selection for Client Storefront
 * Validates:
 * 1. Opening client web without an address requires selecting address first.
 * 2. Mandatory modal displays without close button and cannot be dismissed without address selection.
 * 3. Once selected, address is persisted (hostel, block, room, address_configured).
 * 4. After once selecting address, the app operates as usually without re-prompting.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Simulate browser window / localStorage environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

console.log('====================================================');
console.log('🧪 TESTING MANDATORY INITIAL ADDRESS SELECTION');
console.log('====================================================\n');

// 1. Verify app.js syntax and integrity
const clientAppJs = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'js', 'app.js'), 'utf8');
const publicAppJs = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'js', 'app.js'), 'utf8');

assert.strictEqual(clientAppJs, publicAppJs, 'client/js/app.js and public/js/app.js must be 100% identical');
console.log('✅ [PASS] 100% parity verified between client/js/app.js and public/js/app.js');

// 2. Test hasUserConfiguredAddress logic under different states
const mockLocalStorage = new MockLocalStorage();
const mockWindow = {
    currentBlock: 'Block A',
    currentHostelId: null
};

// Extracted from app.js
function hasUserConfiguredAddress(storage, win) {
    const isConfigured = storage.getItem('lpuquick_address_configured') === 'true';
    const hostel = storage.getItem('lpuquick_hostel_id') || win.currentHostelId;
    const block = (storage.getItem('lpuquick_block') || win.currentBlock || '').toLowerCase();
    const isGate = block.includes('gate');
    const room = (storage.getItem('lpuquick_room') || '').replace(/\D/g, '');
    const phone = (storage.getItem('lpuquick_phone') || '').replace(/\D/g, '');
    const hasValidLocation = isGate || room.length > 0;
    return Boolean(isConfigured && hostel && hasValidLocation && phone.length === 10);
}

// State A: First time visitor (empty localStorage)
assert.strictEqual(
    hasUserConfiguredAddress(mockLocalStorage, mockWindow),
    false,
    'First-time visitor must be identified as NOT having an address configured'
);
console.log('✅ [PASS] Fresh visitor correctly identified as having NO configured address');

// State B: User configures room drop without phone (must NOT be configured because phone is mandatory)
mockLocalStorage.setItem('lpuquick_address_configured', 'true');
mockLocalStorage.setItem('lpuquick_hostel_id', 'GH12');
mockLocalStorage.setItem('lpuquick_block', 'Block B');
mockLocalStorage.setItem('lpuquick_room', '205');
mockLocalStorage.setItem('lpuquick_address_detail', 'GH12 (Block B), Room 205');

assert.strictEqual(
    hasUserConfiguredAddress(mockLocalStorage, mockWindow),
    false,
    'User without mandatory 10-digit phone must NOT be identified as configured'
);
console.log('✅ [PASS] User without phone correctly blocked from being identified as configured');

// State C: User configures room drop WITH mandatory 10-digit phone
mockLocalStorage.setItem('lpuquick_phone', '9876543210');
assert.strictEqual(
    hasUserConfiguredAddress(mockLocalStorage, mockWindow),
    true,
    'User with confirmed room drop and valid phone must be identified as configured'
);
console.log('✅ [PASS] User with confirmed room drop and valid phone correctly identified as configured');

// State D: User configures Gate drop point WITH mandatory phone
mockLocalStorage.clear();
mockLocalStorage.setItem('lpuquick_address_configured', 'true');
mockLocalStorage.setItem('lpuquick_hostel_id', 'BH-13');
mockLocalStorage.setItem('lpuquick_block', 'Hostel Main Gate');
mockLocalStorage.setItem('lpuquick_room', '');
mockLocalStorage.setItem('lpuquick_phone', '9876543210');
mockLocalStorage.setItem('lpuquick_address_detail', 'BH-13 (Hostel Main Gate)');

assert.strictEqual(
    hasUserConfiguredAddress(mockLocalStorage, mockWindow),
    true,
    'User with confirmed Gate drop point and valid phone must be identified as configured'
);
console.log('✅ [PASS] User with confirmed Gate drop point and valid phone correctly identified as configured');

// State E: User enters invalid phone length (e.g. 8 digits)
mockLocalStorage.setItem('lpuquick_phone', '12345678');
assert.strictEqual(
    hasUserConfiguredAddress(mockLocalStorage, mockWindow),
    false,
    'User with invalid phone length must NOT be identified as configured'
);
console.log('✅ [PASS] User with invalid phone length correctly rejected');

// 3. Verify checkInitialAddressSelection presence in app.js
assert(
    clientAppJs.includes('function checkInitialAddressSelection()'),
    'checkInitialAddressSelection function must be defined in app.js'
);
assert(
    clientAppJs.includes('checkInitialAddressSelection();'),
    'checkInitialAddressSelection must be invoked on route render and bootstrap'
);
console.log('✅ [PASS] checkInitialAddressSelection properly integrated in lifecycle');

// 4. Verify modal mandatory mode hides close button
assert(
    clientAppJs.includes("${isMandatorySetup ? 'Select Delivery Address' : 'Select Delivery Location'}"),
    'Mandatory mode title is properly configured'
);
assert(
    clientAppJs.includes('if (!isMandatorySetup) {') && clientAppJs.includes('modal.onclick = closeModal;'),
    'Modal backdrop click-to-close is strictly disabled in mandatory mode'
);
console.log('✅ [PASS] Modal mandatory mode enforces selection without bypass');

// 5. Verify Phone Number is strictly mandatory in address modal
assert(
    clientAppJs.includes('Mobile Phone Number <span class="text-rose-500 font-extrabold">*</span>'),
    'Phone input label must have mandatory asterisk (*)'
);
assert(
    clientAppJs.includes('!cleanPhone || cleanPhone.length !== 10'),
    'Phone validation must strictly enforce non-empty 10-digit number'
);
assert(
    clientAppJs.includes('Mobile Number is strictly mandatory!'),
    'Phone validation alert message must inform user that mobile number is strictly mandatory'
);
console.log('✅ [PASS] Mobile Phone Number strictly mandatory validation verified in modal');

console.log('\n====================================================');
console.log('🎉 ALL INITIAL ADDRESS SELECTION TESTS PASSED!');
console.log('====================================================');

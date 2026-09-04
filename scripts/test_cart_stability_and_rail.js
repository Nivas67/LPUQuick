/**
 * Comprehensive verification of Modern Vertical Category Rail and Cart UI Stability
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

async function testCartStabilityAndRail() {
    console.log('================================================================');
    console.log('🧪 TESTING VERTICAL CATEGORY RAIL & CART UI STABILITY');
    console.log('================================================================\n');

    const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    const dom = new JSDOM(html, { url: 'http://localhost:3000/#/', runScripts: 'outside-only', pretendToBeVisual: true });
    const { window } = dom;
    const { document } = window;

    window.scrollTo = (opts) => { window.__lastScrollTo = opts; };
    window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
    window.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });

    // Load scripts
    const basePath = path.join(__dirname, '..');
    ['public/js/api.js', 'public/js/pages/home.js', 'public/js/app.js'].forEach(f => {
        window.eval(fs.readFileSync(path.join(basePath, f), 'utf8'));
    });

    const mockProducts = [
        { id: 'p1', name: 'Britannia Bourbon - 150g', price: 38, in_stock: true, stock_left: 10, image_url: 'http://example.com/bourbon.png' },
        { id: 'p2', name: 'Oreo Vanila creme 98.5g', price: 20, in_stock: true, stock_left: 5, image_url: 'http://example.com/oreo.png' },
        { id: 'p3', name: "LAY'S Classic Salted", price: 20, in_stock: true, stock_left: 8, image_url: 'http://example.com/lays.png' },
        { id: 'p4', name: 'Bingo Tedhe Medhe', price: 20, in_stock: true, stock_left: 12, image_url: 'http://example.com/bingo.png' }
    ];

    window.api.fetchHome = async () => ({ products: mockProducts });
    window.api.fetchProducts = async () => ({ products: mockProducts });
    window.api.addToCart = async (uid, pid, qty) => ({ items: [{ product_id: pid, quantity: qty, cart_id: 'cart_' + pid }] });
    window.api.updateCartItem = async (cid, qty) => ({ items: [] });
    window.api.removeCartItem = async (cid) => ({ items: [] });

    // Render Home
    const appEl = document.getElementById('app');
    appEl.innerHTML = await window.pages.home();
    window.pageInits.home();

    console.log('--- 1. Testing Vertical Category Rail Layout ---');
    const rail = document.getElementById('vertical-category-rail');
    if (!rail) throw new Error('Missing #vertical-category-rail');
    console.log('✓ Found #vertical-category-rail');

    const railItems = document.querySelectorAll('.category-rail-item');
    console.log(`✓ Found ${railItems.length} vertical category rail items`);
    if (railItems.length !== 11) throw new Error(`Expected 11 categories, found ${railItems.length}`);

    // Check All is active initially
    const allItem = document.querySelector('.category-rail-item[data-cat-id="all"]');
    if (!allItem.classList.contains('active')) throw new Error('Category "all" should be active by default');
    console.log('✓ Category "all" is active initially');

    // Test Clicking Biscuits
    const biscuitsItem = document.querySelector('.category-rail-item[data-cat-id="biscuits"]');
    biscuitsItem.click();
    if (!biscuitsItem.classList.contains('active')) throw new Error('Biscuits should have active class after click');
    if (allItem.classList.contains('active')) throw new Error('All should not have active class after clicking biscuits');
    console.log('✓ Category "biscuits" activated cleanly with vertical indicator');

    const visibleAfterBiscuits = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item:not(.hidden)'));
    console.log(`✓ Visible cards under Biscuits: ${visibleAfterBiscuits.length} (both biscuits)`);
    if (visibleAfterBiscuits.length !== 2) throw new Error(`Expected 2 biscuits, found ${visibleAfterBiscuits.length}`);

    console.log('\n--- 2. Testing ADD Button Stability & Glitch Elimination ---');
    const firstSlot = visibleAfterBiscuits[0].querySelector('.product-action-slot');
    const addBtn = firstSlot.querySelector('.add-to-cart-btn');
    if (!addBtn) throw new Error('Missing .add-to-cart-btn in first card');

    // Save grid HTML before click to verify grid does NOT reload
    const gridBefore = document.getElementById('home-main-products-grid');
    const cardBefore = visibleAfterBiscuits[0];

    // Click ADD
    console.log('Clicking ADD on first product (p1)...');
    addBtn.click();

    // Verify product card is still the exact same DOM node (NO remount)
    const cardAfter = document.querySelector('.product-card-item[data-product-id="p1"]');
    if (cardBefore !== cardAfter) throw new Error('Product card was remounted or replaced!');
    console.log('✓ Product card maintained identical DOM identity (zero remount)');

    // Verify grid is still the exact same DOM node
    const gridAfter = document.getElementById('home-main-products-grid');
    if (gridBefore !== gridAfter) throw new Error('Product grid was reloaded!');
    console.log('✓ Product grid remained intact (zero grid reload)');

    // Verify slot content updated instantly to stepper
    const stepper = cardAfter.querySelector('.card-qty-stepper');
    if (!stepper) throw new Error('Action slot failed to show .card-qty-stepper!');
    const qtyVal = stepper.querySelector('.card-qty-val')?.textContent?.trim();
    if (qtyVal !== '1') throw new Error(`Expected quantity 1, found ${qtyVal}`);
    console.log('✓ Action slot instantly switched to stepper with qty = 1');

    // Verify increment (+)
    const incBtn = stepper.querySelector('.card-inc-btn');
    console.log('Clicking (+) on stepper...');
    incBtn.click();
    const qtyAfterInc = cardAfter.querySelector('.card-qty-val')?.textContent?.trim();
    if (qtyAfterInc !== '2') throw new Error(`Expected quantity 2, found ${qtyAfterInc}`);
    console.log('✓ Stepper incremented to qty = 2 smoothly');

    // Verify cart state retained when changing category
    console.log('\n--- 3. Testing Category Switch with Cart Retained ---');
    const chipsItem = document.querySelector('.category-rail-item[data-cat-id="chips"]');
    chipsItem.click();
    if (window.cartState['p1']?.quantity !== 2) throw new Error('Cart cleared or lost item on category switch!');
    console.log('✓ Cart items preserved across category switch (p1 qty = 2)');

    // Switch back to All
    allItem.click();
    const p1CardBack = document.querySelector('.product-card-item[data-product-id="p1"]');
    const p1QtyBack = p1CardBack.querySelector('.card-qty-val')?.textContent?.trim();
    if (p1QtyBack !== '2') throw new Error(`Expected p1 to still display qty = 2, found ${p1QtyBack}`);
    console.log('✓ Returning to All correctly displays stepper with qty = 2');

    console.log('\n--- 4. Testing In-Modal Quantity Stability ---');
    // Open product modal for p2
    await window.openProductModal('p2');
    const modal = document.getElementById('product-modal');
    if (!modal) throw new Error('Product modal failed to open');
    console.log('✓ Product modal opened cleanly');

    const modalAddBtn = document.getElementById('modal-add-btn');
    if (!modalAddBtn) throw new Error('Missing #modal-add-btn');

    // Click ADD inside modal
    modalAddBtn.click();
    // Modal must NOT be removed from DOM
    if (!document.getElementById('product-modal')) throw new Error('Modal was destroyed on ADD click!');
    const modalStepper = document.querySelector('#modal-action-container .card-qty-stepper');
    if (!modalStepper) throw new Error('Modal failed to update action container in-place');
    const modalQty = modalStepper.querySelector('.card-qty-val')?.textContent?.trim();
    if (modalQty !== '1') throw new Error(`Expected modal qty = 1, found ${modalQty}`);
    console.log('✓ In-modal ADD updated smoothly in-place with zero modal destruction or re-animation');

    modal.remove();

    console.log('\n================================================================');
    console.log('🎉 ALL VERTICAL CATEGORY RAIL & CART STABILITY TESTS PASSED 100%!');
    console.log('================================================================');
    process.exit(0);
}

testCartStabilityAndRail().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

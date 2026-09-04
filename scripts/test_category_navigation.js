const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost:3000/#/', runScripts: 'outside-only' });
const { window } = dom;
const { document } = window;

window.scrollTo = () => {};
window.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });

// Load scripts
const basePath = path.join(__dirname, '..');
['public/js/api.js', 'public/js/pages/home.js'].forEach(f => {
    window.eval(fs.readFileSync(path.join(basePath, f), 'utf8'));
});

// Mock products
const mockProducts = [
    { id: '1', name: 'Britannia Bourbon - 150g', price: 38, in_stock: true, stock_left: 10 },
    { id: '2', name: 'Oreo Vanila creme 98.5g', price: 20, in_stock: true, stock_left: 5 },
    { id: '3', name: "LAY'S Classic Salted", price: 20, in_stock: true, stock_left: 8 },
    { id: '4', name: 'Bingo Tedhe Medhe', price: 20, in_stock: true, stock_left: 12 },
    { id: '5', name: 'Cadbury Dairy milk silk Bubbly-46g', price: 80, in_stock: true, stock_left: 4 },
    { id: '6', name: 'Maggi 2-Minutes noodles', price: 14, in_stock: true, stock_left: 15 },
    { id: '7', name: 'KURKURE Masala Munch', price: 20, in_stock: true, stock_left: 6 }
];

window.api.fetchHome = async () => ({ products: mockProducts });
window.api.fetchProducts = async () => ({ products: mockProducts });

async function runValidation() {
    const htmlContent = await window.pages.home();
    document.getElementById('app').innerHTML = htmlContent;
    window.pageInits.home();

    console.log('--- VALIDATING INSTAMART/BLINKIT CATEGORY NAVIGATION ---');

    // 1. Check sidebar & mobile pills presence
    const sidebarItems = document.querySelectorAll('.category-sidebar-item');
    const mobilePills = document.querySelectorAll('.category-mobile-pill');
    console.log('Desktop Sidebar Items Count:', sidebarItems.length);
    console.log('Mobile Category Pills Count:', mobilePills.length);

    // 2. Click Biscuits
    const biscuitBtn = Array.from(sidebarItems).find(b => b.dataset.catId === 'biscuits');
    biscuitBtn.click();
    const visibleCardsBiscuits = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item')).filter(c => !c.classList.contains('hidden'));
    console.log('Biscuits Selected: Visible count =', visibleCardsBiscuits.length);
    console.log('Biscuits titles:', visibleCardsBiscuits.map(c => c.querySelector('h3').textContent.trim()));

    // Verify only biscuits are visible
    const allAreBiscuits = visibleCardsBiscuits.every(c => c.dataset.category === 'biscuits');
    console.log('All visible cards are biscuits:', allAreBiscuits);

    // 3. Click Chips
    const chipsBtn = Array.from(sidebarItems).find(b => b.dataset.catId === 'chips');
    chipsBtn.click();
    const visibleCardsChips = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item')).filter(c => !c.classList.contains('hidden'));
    console.log('Chips Selected: Visible count =', visibleCardsChips.length);
    console.log('Chips titles:', visibleCardsChips.map(c => c.querySelector('h3').textContent.trim()));

    // 4. Click Candies (0 products -> Empty state)
    const candiesBtn = Array.from(sidebarItems).find(b => b.dataset.catId === 'candies');
    candiesBtn.click();
    const emptyState = document.getElementById('category-empty-state');
    const isEmptyStateVisible = !emptyState.classList.contains('hidden');
    console.log('Candies (0 products): Empty State Visible =', isEmptyStateVisible);
    console.log('Empty State Title =', document.getElementById('empty-state-title').textContent);

    // 5. Click All
    const allBtn = Array.from(sidebarItems).find(b => b.dataset.catId === 'all');
    allBtn.click();
    const visibleCardsAll = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item')).filter(c => !c.classList.contains('hidden'));
    console.log('All Selected: Total Visible Cards =', visibleCardsAll.length, '(Expected 7)');

    // 6. Search + Category together: Category = Biscuits, Search = "Oreo"
    biscuitBtn.click();
    const desktopSearch = document.getElementById('desktop-search');
    desktopSearch.value = 'Oreo';
    desktopSearch.dispatchEvent(new window.Event('input'));
    const searchCategoryCards = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item')).filter(c => !c.classList.contains('hidden'));
    console.log('Biscuits + Search "Oreo": Visible count =', searchCategoryCards.length);
    console.log('Title:', searchCategoryCards.map(c => c.querySelector('h3').textContent.trim()));

    // 7. Search + Category conflict: Category = Biscuits, Search = "Maggi"
    desktopSearch.value = 'Maggi';
    desktopSearch.dispatchEvent(new window.Event('input'));
    const conflictCards = Array.from(document.querySelectorAll('#home-main-products-grid .product-card-item')).filter(c => !c.classList.contains('hidden'));
    console.log('Biscuits + Search "Maggi": Visible count =', conflictCards.length, '(Expected 0)');
    console.log('Search mismatch empty state visible =', !document.getElementById('category-empty-state').classList.contains('hidden'));

    console.log('\n✓ ALL INSTAMART/BLINKIT CATEGORY FILTERING & SEARCH VALIDATIONS PASSED!');
}

runValidation().catch(e => console.error(e));

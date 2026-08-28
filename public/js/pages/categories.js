// Categories Page — Visual Department Directory (Blinkit/Zepto Grid) + Dual-Pane Product Explorer
window.pages = window.pages || {};
window.pageInits = window.pageInits || {};

window.pages.categories = async function() {
    const address = window.currentAddressDetail?.label || 'BH13 (Block A), Room 304';

    return `
<div class="bg-background text-on-background font-body-md min-h-screen pb-28">
    <!-- Top Sticky Search & Department Tabs Header -->
    <header class="sticky top-0 z-40 bg-surface/90 backdrop-blur-2xl border-b border-glass-border shadow-sm">
        <!-- Search Bar Row -->
        <div class="px-margin-mobile md:px-margin-desktop pt-3 pb-2 flex items-center gap-3">
            <a href="#/" class="p-1.5 hover:bg-surface-variant/50 rounded-full transition-colors shrink-0 md:hidden">
                <span class="material-symbols-outlined text-on-surface text-xl">arrow_back</span>
            </a>
            <div class="relative flex-1">
                <input class="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-surface-variant bg-surface focus:outline-none focus:border-emerald text-xs sm:text-sm shadow-sm" placeholder="Search for atta, dal, coke, biscuits and more" type="text" id="main-category-search" autocomplete="off">
                <span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
                <button type="button" class="absolute right-3 top-2.5 text-on-surface-variant hover:text-emerald" title="Voice Search">
                    <span class="material-symbols-outlined text-base">mic</span>
                </button>
            </div>
            <a href="#/cart" class="p-2 text-on-surface-variant hover:text-emerald rounded-full transition-colors relative shrink-0" title="Cart">
                <span class="material-symbols-outlined text-xl">shopping_cart</span>
            </a>
        </div>

        <!-- Top Department Filter Tabs (All, Campus Fest, Electronics, Beauty, Gifting) -->
        <div class="px-margin-mobile md:px-margin-desktop flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar border-t border-glass-border/40 text-xs font-semibold pt-2 pb-1" id="dept-tabs-nav">
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-emerald text-emerald dept-tab-btn whitespace-nowrap cursor-pointer" data-dept="all">
                <span class="material-symbols-outlined text-lg">apps</span>
                <span class="text-[11px]">All</span>
            </button>
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface dept-tab-btn whitespace-nowrap cursor-pointer relative" data-dept="grocery">
                <span class="material-symbols-outlined text-lg">local_mall</span>
                <span class="text-[11px]">Grocery</span>
            </button>
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface dept-tab-btn whitespace-nowrap cursor-pointer relative" data-dept="snacks">
                <span class="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-extrabold px-1 rounded-full">New</span>
                <span class="material-symbols-outlined text-lg">fastfood</span>
                <span class="text-[11px]">Snacks</span>
            </button>
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface dept-tab-btn whitespace-nowrap cursor-pointer" data-dept="electronics">
                <span class="material-symbols-outlined text-lg">headphones</span>
                <span class="text-[11px]">Electronics</span>
            </button>
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface dept-tab-btn whitespace-nowrap cursor-pointer" data-dept="beauty">
                <span class="material-symbols-outlined text-lg">face_3</span>
                <span class="text-[11px]">Beauty</span>
            </button>
            <button type="button" class="flex flex-col items-center gap-1 pb-2 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface dept-tab-btn whitespace-nowrap cursor-pointer" data-dept="stationery">
                <span class="material-symbols-outlined text-lg">edit_note</span>
                <span class="text-[11px]">Stationery</span>
            </button>
        </div>
    </header>

    <!-- VIEW 1: Visual Categories Directory (Default View matching screenshot) -->
    <main id="categories-directory-view" class="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto pt-4 space-y-6">
        
        <!-- SECTION 1: Grocery & Kitchen -->
        <section class="dept-section" data-dept-group="grocery">
            <h2 class="font-headline-md text-base sm:text-lg font-black text-on-surface tracking-tight mb-3 flex items-center justify-between">
                <span>Grocery & Kitchen</span>
                <span class="text-[11px] font-bold text-emerald">8 Categories</span>
            </h2>
            <!-- 4-Column Grid on Mobile and Desktop -->
            <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
                <!-- Vegetables & Fruits -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Vegetables & Fruits">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200" alt="Vegetables & Fruits">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Vegetables & Fruits</span>
                </div>

                <!-- Atta, Rice & Dal -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Atta, Rice & Dal">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200" alt="Atta, Rice & Dal">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Atta, Rice & Dal</span>
                </div>

                <!-- Oil, Ghee & Masala -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Oil, Ghee & Masala">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200" alt="Oil, Ghee & Masala">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Oil, Ghee & Masala</span>
                </div>

                <!-- Dairy, Bread & Eggs -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Dairy, Bread & Eggs">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200" alt="Dairy, Bread & Eggs">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Dairy, Bread & Eggs</span>
                </div>

                <!-- Bakery & Biscuits -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Bakery & Biscuits">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200" alt="Bakery & Biscuits">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Bakery & Biscuits</span>
                </div>

                <!-- Dry Fruits & Cereals -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Atta, Rice & Dal">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=200" alt="Dry Fruits & Cereals">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Dry Fruits & Cereals</span>
                </div>

                <!-- Chicken, Meat & Fish -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Dairy, Bread & Eggs">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200" alt="Chicken, Meat & Fish">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Chicken, Meat & Fish</span>
                </div>

                <!-- Kitchenware & Appliances -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Electronics">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=200" alt="Kitchenware & Appliances">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Kitchenware & Appliances</span>
                </div>
            </div>
        </section>

        <!-- SECTION 2: Snacks & Drinks -->
        <section class="dept-section" data-dept-group="snacks">
            <h2 class="font-headline-md text-base sm:text-lg font-black text-on-surface tracking-tight mb-3 flex items-center justify-between">
                <span>Snacks & Drinks</span>
                <span class="text-[11px] font-bold text-emerald">8 Categories</span>
            </h2>
            <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
                <!-- Chips & Namkeen -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Chips & Namkeen">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200" alt="Chips & Namkeen">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Chips & Namkeen</span>
                </div>

                <!-- Sweets & Chocolates -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Sweets & Chocolates">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1548907040-4baa42d10919?w=200" alt="Sweets & Chocolates">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Sweets & Chocolates</span>
                </div>

                <!-- Drinks & Juices -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Drinks & Juices">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200" alt="Drinks & Juices">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Drinks & Juices</span>
                </div>

                <!-- Tea, Coffee & Milk Drinks -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Tea, Coffee & Milk Drinks">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200" alt="Tea, Coffee & Milk Drinks">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Tea, Coffee & Milk Drinks</span>
                </div>

                <!-- Instant Food -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Instant Food">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200" alt="Instant Food">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Instant Food</span>
                </div>

                <!-- Sauces & Spreads -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Sauces & Spreads">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200" alt="Sauces & Spreads">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Sauces & Spreads</span>
                </div>

                <!-- Paan Corner -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Chips & Namkeen">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200" alt="Paan Corner">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Paan Corner</span>
                </div>

                <!-- Ice Creams & More -->
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Ice Creams & More">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=200" alt="Ice Creams & More">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Ice Creams & More</span>
                </div>
            </div>
        </section>

        <!-- SECTION 3: Beauty & Personal Care -->
        <section class="dept-section" data-dept-group="beauty">
            <h2 class="font-headline-md text-base sm:text-lg font-black text-on-surface tracking-tight mb-3 flex items-center justify-between">
                <span>Beauty & Personal Care</span>
                <span class="text-[11px] font-bold text-emerald">4 Categories</span>
            </h2>
            <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Personal Care">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200" alt="Bath & Body">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Bath & Body</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Personal Care">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1559591937-e10f135b91b9?w=200" alt="Oral Care">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Oral Care</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Personal Care">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200" alt="Hair Care">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Hair Care</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Personal Care">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200" alt="Skin & Face">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Skin & Face</span>
                </div>
            </div>
        </section>

        <!-- SECTION 4: Stationery & Electronics -->
        <section class="dept-section" data-dept-group="stationery">
            <h2 class="font-headline-md text-base sm:text-lg font-black text-on-surface tracking-tight mb-3 flex items-center justify-between">
                <span>Stationery, Electronics & Campus Essentials</span>
                <span class="text-[11px] font-bold text-emerald">4 Categories</span>
            </h2>
            <div class="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Stationery">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200" alt="Notebooks">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Notebooks & Registers</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Stationery">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200" alt="Pens">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Pens & Exam Prep</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Electronics">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=200" alt="Cables & Chargers">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Cables & Chargers</span>
                </div>
                <div class="category-card flex flex-col items-center text-center cursor-pointer group" data-category="Electronics">
                    <div class="w-full aspect-square bg-surface-container-high rounded-2xl p-2 sm:p-3 flex items-center justify-center border border-surface-variant/40 group-hover:border-emerald group-hover:shadow-md transition-all relative overflow-hidden">
                        <img class="w-full h-full object-contain group-hover:scale-105 transition-transform" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200" alt="Earphones & Audio">
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-on-surface mt-1.5 line-clamp-2 leading-tight">Earphones & Audio</span>
                </div>
            </div>
        </section>
    </main>

    <!-- VIEW 2: Dual-Pane Product Listing (Shown when a category is tapped) -->
    <div id="dual-pane-explorer-view" class="hidden flex-1 flex flex-col">
        <!-- Dual Pane Header Sub-Bar -->
        <div class="px-margin-mobile md:px-margin-desktop py-2 bg-surface/70 border-b border-glass-border flex items-center justify-between">
            <button type="button" id="back-to-directory-btn" class="text-xs text-emerald font-bold flex items-center gap-1 hover:underline cursor-pointer">
                <span class="material-symbols-outlined text-sm">arrow_back</span> All Categories
            </button>
            <div class="flex items-center gap-2">
                <select id="dual-pane-sort-select" class="text-xs px-2.5 py-1 rounded-full border border-surface-variant bg-surface text-on-surface font-semibold focus:outline-none focus:border-emerald">
                    <option value="relevance">⇅ Sort</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="discount">% Discount</option>
                    <option value="rating">Top Rated (★)</option>
                </select>
                <button type="button" id="dual-pane-veg-btn" class="text-[11px] px-2.5 py-1 rounded-full border border-surface-variant bg-surface text-on-surface font-bold flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-600"></span> Veg
                </button>
            </div>
        </div>

        <!-- Left Rail + Right Product Grid -->
        <div class="flex flex-1 max-w-7xl mx-auto w-full overflow-hidden">
            <!-- Left Subcategory Rail -->
            <aside class="w-[78px] sm:w-24 shrink-0 bg-surface/60 border-r border-glass-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[108px] py-2 no-scrollbar" id="dual-pane-subcat-rail">
                <div class="flex flex-col gap-1 items-center" id="dual-pane-subcat-list"></div>
            </aside>

            <!-- Right Products Grid -->
            <main class="flex-1 p-2 sm:p-4 overflow-y-auto max-h-[calc(100vh-140px)]" id="dual-pane-products-pane">
                <div class="flex justify-between items-center mb-2.5 px-1">
                    <span class="text-xs font-bold text-on-surface-variant" id="dual-pane-subcat-heading">Showing Items</span>
                    <span class="text-[11px] text-on-surface-variant" id="dual-pane-count-badge">0 items</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5" id="dual-pane-products-grid"></div>
            </main>
        </div>
    </div>

    <!-- BottomNavBar -->
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <nav class="flex justify-around items-center p-2 mx-auto bg-white/85 dark:bg-[#0e1813]/85 backdrop-blur-2xl shadow-xl border border-glass-border rounded-full">
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/">
                <span class="material-symbols-outlined">home</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Home</span>
            </a>
            <a class="flex flex-col items-center justify-center bg-emerald text-on-primary rounded-full px-6 py-2 active:scale-95 duration-200 shadow-md" href="#/categories">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">category</span>
                <span class="font-label-sm text-[11px] mt-0.5">Categories</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/cart">
                <span class="material-symbols-outlined">shopping_cart</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Cart</span>
            </a>
            <a class="flex flex-col items-center justify-center text-on-surface-variant px-5 py-2 hover:bg-surface-variant/50 rounded-full transition-all active:scale-95 duration-200" href="#/orders">
                <span class="material-symbols-outlined">receipt_long</span>
                <span class="font-label-sm text-[11px] mt-0.5 hidden sm:block">Orders</span>
            </a>
        </nav>
    </div>
</div>`;
};

window.pageInits.categories = async function() {
    const directoryView = document.getElementById('categories-directory-view');
    const dualPaneView = document.getElementById('dual-pane-explorer-view');
    const backToDirBtn = document.getElementById('back-to-directory-btn');
    const mainSearchInput = document.getElementById('main-category-search');
    const deptTabs = document.querySelectorAll('.dept-tab-btn');
    const categoryCards = document.querySelectorAll('.category-card');
    
    // Dual Pane Elements
    const subcatListEl = document.getElementById('dual-pane-subcat-list');
    const productsGridEl = document.getElementById('dual-pane-products-grid');
    const subcatHeadingEl = document.getElementById('dual-pane-subcat-heading');
    const countBadgeEl = document.getElementById('dual-pane-count-badge');
    const sortSelect = document.getElementById('dual-pane-sort-select');
    const vegBtn = document.getElementById('dual-pane-veg-btn');

    let currentCategory = 'Bakery & Biscuits';
    let currentSubcategory = 'Cookies';
    let currentSort = 'relevance';
    let isVegOnly = false;
    let categoryData = null;
    let allProducts = [];

    // Preset Icons for Subcategories
    const subcatIcons = {
        'Cookies': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100',
        'Cream Biscuits': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=100',
        'Healthy & Digestive': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Sweet & Salty': 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100',
        'Glucose & Marie': 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=100',
        'Rusks & Wafers': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Cakes & Rolls': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100',
        'Fresh Fruits': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100',
        'Vegetables': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100',
        'Atta & Flour': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100',
        'Rice & Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100',
        'Dals & Pulses': 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=100',
        'Cooking Oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100',
        'Ghee & Butter': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=100',
        'Spices & Masalas': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100',
        'Milk': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100',
        'Bread & Buns': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100',
        'Eggs': 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=100',
        'Potato Chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100',
        'Namkeen & Bhujia': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=100',
        'Corn Puffs & Nachos': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100',
        'Chocolates': 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=100',
        'Indian Sweets': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100',
        'Soft Drinks & Sodas': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100',
        'Fruit Juices': 'https://images.unsplash.com/photo-1546173159-315724a31696?w=100',
        'Energy & Sports Drinks': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=100',
        'Coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100',
        'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100',
        'Noodles & Pasta': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=100',
        'Cup Noodles': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=100',
        'Sweet Spreads': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=100',
        'Ketchup & Dips': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=100',
        'Ice Cream Tubs': 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=100',
        'Chocobars & Cones': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100'
    };

    // Department Tab Filter Handler
    deptTabs.forEach(tab => {
        tab.onclick = () => {
            deptTabs.forEach(t => {
                t.classList.remove('border-emerald', 'text-emerald');
                t.classList.add('border-transparent', 'text-on-surface-variant');
            });
            tab.classList.remove('border-transparent', 'text-on-surface-variant');
            tab.classList.add('border-emerald', 'text-emerald');

            const dept = tab.dataset.dept;
            document.querySelectorAll('.dept-section').forEach(sec => {
                if (dept === 'all' || sec.dataset.deptGroup === dept) {
                    sec.classList.remove('hidden');
                } else {
                    sec.classList.add('hidden');
                }
            });
        };
    });

    // Back to Directory View Button
    backToDirBtn?.addEventListener('click', () => {
        dualPaneView.classList.add('hidden');
        directoryView.classList.remove('hidden');
        window.scrollTo(0, 0);
    });

    // Category Card Click -> Switch to Dual Pane Explorer
    categoryCards.forEach(card => {
        card.onclick = async () => {
            const catName = card.dataset.category;
            await openDualPaneCategory(catName);
        };
    });

    async function openDualPaneCategory(catName) {
        currentCategory = catName;
        directoryView.classList.add('hidden');
        dualPaneView.classList.remove('hidden');
        window.scrollTo(0, 0);

        try {
            const url = `/api/categories/${encodeURIComponent(catName)}?sort=${currentSort}&veg=${isVegOnly ? '1' : '0'}`;
            const res = await (await fetch(url)).json();
            categoryData = res;
            allProducts = res.products || [];

            const subcats = res.subcategories || [];
            if (subcats.length > 0) {
                currentSubcategory = subcats[0].subcategory;
            } else {
                currentSubcategory = 'All';
            }

            renderSubcatRail(subcats);
            renderProductsGrid();
        } catch(e) {
            console.error('Failed to load category:', e);
        }
    }

    function renderSubcatRail(subcats) {
        if (!subcatListEl) return;
        
        let railItems = subcats.map((sc) => {
            const isActive = sc.subcategory === currentSubcategory;
            const iconImg = subcatIcons[sc.subcategory] || sc.sample_image || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100';
            
            return `
                <button type="button" class="w-full flex flex-col items-center py-2.5 px-1 relative transition-all group cursor-pointer subcat-rail-item ${isActive ? 'active-subcat' : 'opacity-70 hover:opacity-100'}" data-subcat="${sc.subcategory}">
                    <!-- Green Active Indicator Bar -->
                    ${isActive ? '<div class="absolute left-0 top-1 bottom-1 w-1 bg-emerald rounded-r-full"></div>' : ''}
                    
                    <!-- Circular Thumbnail Container -->
                    <div class="w-12 h-12 rounded-full overflow-hidden p-0.5 border-2 transition-all ${isActive ? 'border-emerald shadow-sm scale-105 bg-emerald/10' : 'border-transparent bg-surface-container-high group-hover:border-surface-variant'}">
                        <img src="${iconImg}" alt="${sc.subcategory}" class="w-full h-full object-cover rounded-full">
                    </div>
                    
                    <!-- Label -->
                    <span class="text-[10px] sm:text-[11px] font-semibold text-center mt-1.5 leading-tight px-1 ${isActive ? 'text-emerald font-bold' : 'text-on-surface'}">
                        ${sc.subcategory}
                    </span>
                </button>
            `;
        }).join('');

        subcatListEl.innerHTML = railItems || `<div class="p-2 text-[10px] text-on-surface-variant text-center">No subcategories</div>`;

        subcatListEl.querySelectorAll('.subcat-rail-item').forEach(item => {
            item.onclick = () => {
                currentSubcategory = item.dataset.subcat;
                renderSubcatRail(categoryData?.subcategories || []);
                renderProductsGrid();
            };
        });
    }

    function renderProductsGrid() {
        if (!productsGridEl) return;

        let filtered = allProducts;

        if (currentSubcategory && currentSubcategory !== 'All') {
            filtered = filtered.filter(p => p.subcategory === currentSubcategory);
        }

        if (isVegOnly) {
            filtered = filtered.filter(p => p.is_veg === 1);
        }

        if (subcatHeadingEl) subcatHeadingEl.textContent = `Showing ${currentSubcategory}`;
        if (countBadgeEl) countBadgeEl.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            productsGridEl.innerHTML = `
                <div class="col-span-full py-12 text-center">
                    <span class="material-symbols-outlined text-4xl text-on-surface-variant/60">inventory_2</span>
                    <p class="text-xs font-semibold text-on-surface-variant mt-2">No items in this section</p>
                </div>
            `;
            return;
        }

        productsGridEl.innerHTML = filtered.map(p => {
            const discountPercent = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
            const ratingVal = p.rating || 4.8;
            const reviewCount = p.review_count || '1.2 lac';
            const stockLeft = p.stock_left || 0;

            return `
                <div class="bg-surface rounded-2xl overflow-hidden border border-surface-variant/40 shadow-sm hover:shadow-md transition-all p-2.5 flex flex-col justify-between group product-card-container product-detail-trigger cursor-pointer" data-product-id="${p.id}">
                    <!-- Card Top Image Section -->
                    <div>
                        <div class="relative bg-surface-container-high rounded-xl overflow-hidden h-36 flex items-center justify-center p-2">
                            <!-- Wishlist Heart Button -->
                            <button type="button" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-surface/70 backdrop-blur-md flex items-center justify-center text-on-surface-variant hover:text-rose-500 hover:bg-surface transition-all z-10 wishlist-btn" data-id="${p.id}">
                                <span class="material-symbols-outlined text-base">favorite_border</span>
                            </button>

                            <!-- Veg / Non-Veg Icon -->
                            <div class="absolute bottom-2 right-2 z-10 bg-surface/80 backdrop-blur-md p-0.5 rounded shadow-sm">
                                <span class="w-3.5 h-3.5 border ${p.is_veg !== 0 ? 'border-emerald-600' : 'border-red-600'} rounded-sm flex items-center justify-center p-[1px]">
                                    <span class="w-2 h-2 rounded-full ${p.is_veg !== 0 ? 'bg-emerald-600' : 'bg-red-600'}"></span>
                                </span>
                            </div>

                            <!-- Product Image -->
                            <img class="object-contain w-full h-full group-hover:scale-105 transition-transform duration-200" src="${p.image_url}" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300'">

                            <!-- Image Carousel Dots -->
                            <div class="absolute bottom-2 left-3 flex items-center gap-1 opacity-70">
                                <span class="w-1.5 h-1.5 rounded-full bg-on-surface"></span>
                                <span class="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                                <span class="w-1 h-1 rounded-full bg-on-surface-variant"></span>
                            </div>
                        </div>

                        <!-- Pack Size / Weight + ADD Button Row -->
                        <div class="flex justify-between items-center mt-2">
                            <span class="text-xs font-bold text-on-surface">${p.size || p.unit}</span>
                            <div class="product-action-slot" data-id="${p.id}">
                                <button type="button" class="bg-emerald text-white text-xs px-4 py-1.5 rounded-xl font-bold hover:bg-primary active:scale-95 shadow-sm transition-all add-to-cart-btn" data-id="${p.id}">
                                    ADD
                                </button>
                            </div>
                        </div>

                        <!-- Pricing & Discount Row -->
                        <div class="mt-1.5">
                            <div class="flex items-baseline gap-1.5">
                                <span class="text-sm font-extrabold text-on-surface">₹${p.price}</span>
                                ${p.mrp && p.mrp > p.price ? `<span class="text-[11px] text-on-surface-variant line-through">₹${p.mrp}</span>` : ''}
                            </div>
                            ${discountPercent > 0 ? `
                                <p class="text-[10px] font-bold text-sky-600 dark:text-sky-400 leading-tight">
                                    ${discountPercent}% OFF on MRP
                                </p>
                            ` : ''}
                        </div>

                        <!-- Product Title -->
                        <h3 class="font-bold text-xs text-on-surface mt-1 line-clamp-2 leading-snug">
                            ${p.name}
                        </h3>
                    </div>

                    <!-- Bottom Rating, ETA & Stock Info -->
                    <div class="mt-2 pt-1.5 border-t border-surface-variant/30 flex flex-col gap-0.5">
                        <div class="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
                            <span class="material-symbols-outlined text-xs text-amber-500" style="font-variation-settings: 'FILL' 1;">star</span>
                            <span class="font-bold text-on-surface">${ratingVal}</span>
                            <span class="text-on-surface-variant/80">(${reviewCount})</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-on-surface-variant mt-0.5">
                            <span class="flex items-center gap-0.5 text-emerald font-semibold">
                                <span class="material-symbols-outlined text-[11px]">bolt</span> 3 mins
                            </span>
                            ${stockLeft > 0 ? `
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded">
                                    🪫 ${stockLeft} left
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        window.syncCardSteppers();
    }

    // Sort Handler
    sortSelect?.addEventListener('change', async (e) => {
        currentSort = e.target.value;
        await openDualPaneCategory(currentCategory);
    });

    // Veg Only Handler
    vegBtn?.addEventListener('click', () => {
        isVegOnly = !isVegOnly;
        if (isVegOnly) {
            vegBtn.classList.add('bg-emerald/15', 'border-emerald', 'text-emerald');
        } else {
            vegBtn.classList.remove('bg-emerald/15', 'border-emerald', 'text-emerald');
        }
        renderProductsGrid();
    });

    // Main Top Search in Directory
    let searchDebounce;
    mainSearchInput?.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        const q = mainSearchInput.value.trim();
        if (!q) {
            directoryView.classList.remove('hidden');
            dualPaneView.classList.add('hidden');
            return;
        }

        searchDebounce = setTimeout(async () => {
            directoryView.classList.add('hidden');
            dualPaneView.classList.remove('hidden');
            if (subcatHeadingEl) subcatHeadingEl.textContent = `Search: "${q}"`;
            
            const res = await window.api.searchProducts(q);
            allProducts = res.results || [];
            currentSubcategory = 'All';
            if (subcatListEl) subcatListEl.innerHTML = `<div class="p-2 text-[10px] text-emerald font-bold text-center">Search Results</div>`;
            renderProductsGrid();
        }, 180);
    });
};

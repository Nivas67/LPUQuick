const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'lpuquick.db');
const db = new DatabaseSync(dbPath);

const allProducts = [
    // --- Grocery & Kitchen: Vegetables & Fruits ---
    {
        id: 'prod_veg_01',
        name: 'Fresh Cavendish Bananas',
        category: 'Vegetables & Fruits',
        subcategory: 'Fresh Fruits',
        price: 35,
        mrp: 40,
        unit: 'bunch',
        size: '500 g (4-5 pcs)',
        image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400',
        tags: 'banana,fruit,fresh,morning',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '42,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_veg_02',
        name: 'Fresh Shimla Red Apples',
        category: 'Vegetables & Fruits',
        subcategory: 'Fresh Fruits',
        price: 89,
        mrp: 110,
        unit: 'pack',
        size: '500 g (3 pcs)',
        image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        tags: 'apple,fruit,fresh,healthy',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.7, review_count: '18,500', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_veg_03',
        name: 'Fresh Hybrid Tomatoes',
        category: 'Vegetables & Fruits',
        subcategory: 'Vegetables',
        price: 24,
        mrp: 30,
        unit: 'pack',
        size: '500 g',
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        tags: 'tomato,vegetables,salad,cooking',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '65,000', is_veg: 1, stock_left: 0
    },

    // --- Grocery & Kitchen: Atta, Rice & Dal ---
    {
        id: 'prod_atta_01',
        name: 'Aashirvaad Shudh Chakki Atta',
        category: 'Atta, Rice & Dal',
        subcategory: 'Atta & Flour',
        price: 215,
        mrp: 245,
        unit: 'bag',
        size: '5 kg',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        tags: 'atta,wheat,flour,roti,aashirvaad',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '1.8 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_atta_02',
        name: 'India Gate Feast Rozzana Basmati Rice',
        category: 'Atta, Rice & Dal',
        subcategory: 'Rice & Grains',
        price: 85,
        mrp: 105,
        unit: 'bag',
        size: '1 kg',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        tags: 'rice,basmati,biryani,india gate',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '95,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_atta_03',
        name: 'Tata Sampann Unpolished Toor Dal',
        category: 'Atta, Rice & Dal',
        subcategory: 'Dals & Pulses',
        price: 88,
        mrp: 98,
        unit: 'pack',
        size: '500 g',
        image_url: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=400',
        tags: 'dal,toor dal,pulses,tata sampann',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.7, review_count: '34,000', is_veg: 1, stock_left: 0
    },

    // --- Grocery & Kitchen: Oil, Ghee & Masala ---
    {
        id: 'prod_oil_01',
        name: 'Fortune Sunlite Refined Sunflower Oil',
        category: 'Oil, Ghee & Masala',
        subcategory: 'Cooking Oil',
        price: 125,
        mrp: 145,
        unit: 'pouch',
        size: '1 L',
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
        tags: 'oil,fortune,sunflower,cooking',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '1.2 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_oil_02',
        name: 'Amul Pure Ghee',
        category: 'Oil, Ghee & Masala',
        subcategory: 'Ghee & Butter',
        price: 290,
        mrp: 310,
        unit: 'carton',
        size: '500 ml',
        image_url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
        tags: 'ghee,amul,pure ghee,cooking',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '76,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_oil_03',
        name: 'Everest Tikhalal Red Chilli Powder',
        category: 'Oil, Ghee & Masala',
        subcategory: 'Spices & Masalas',
        price: 48,
        mrp: 52,
        unit: 'box',
        size: '100 g',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        tags: 'spices,everest,chilli powder,tikhalal',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.7, review_count: '28,000', is_veg: 1, stock_left: 0
    },

    // --- Grocery & Kitchen: Dairy, Bread & Eggs ---
    {
        id: 'prod_dairy_01',
        name: 'Amul Taaza Homogenised Toned Milk',
        category: 'Dairy, Bread & Eggs',
        subcategory: 'Milk',
        price: 28,
        mrp: 30,
        unit: 'pouch',
        size: '500 ml',
        image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        tags: 'milk,amul,toned,fresh',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '3.1 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_dairy_02',
        name: 'Harvest Gold 100% Atta Whole Wheat Bread',
        category: 'Dairy, Bread & Eggs',
        subcategory: 'Bread & Buns',
        price: 45,
        mrp: 50,
        unit: 'pack',
        size: '400 g',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        tags: 'bread,brown bread,wheat,harvest gold',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '88,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_dairy_03',
        name: 'Eggoz Farm Fresh White Eggs',
        category: 'Dairy, Bread & Eggs',
        subcategory: 'Eggs',
        price: 54,
        mrp: 60,
        unit: 'box',
        size: '6 pcs',
        image_url: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400',
        tags: 'eggs,protein,farm fresh,breakfast',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '52,000', is_veg: 0, stock_left: 0
    },

    // --- Snacks & Drinks: Chips & Namkeen ---
    {
        id: 'prod_snk_01',
        name: "Lay's India's Magic Masala Potato Chips",
        category: 'Chips & Namkeen',
        subcategory: 'Potato Chips',
        price: 20,
        mrp: 20,
        unit: 'pack',
        size: '50 g',
        image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
        tags: 'lays,chips,magic masala,spicy',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '2.8 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_snk_02',
        name: "Haldiram's Nagpur Aloo Bhujia",
        category: 'Chips & Namkeen',
        subcategory: 'Namkeen & Bhujia',
        price: 48,
        mrp: 55,
        unit: 'pack',
        size: '200 g',
        image_url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400',
        tags: 'haldiram,namkeen,aloo bhujia,crispy',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '1.4 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_snk_03',
        name: 'Kurkure Masala Munch Crisps',
        category: 'Chips & Namkeen',
        subcategory: 'Corn Puffs & Nachos',
        price: 20,
        mrp: 20,
        unit: 'pack',
        size: '82 g',
        image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
        tags: 'kurkure,masala munch,spicy,crunchy',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '1.1 lac', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Sweets & Chocolates ---
    {
        id: 'prod_swt_01',
        name: 'Cadbury Dairy Milk Silk Chocolate',
        category: 'Sweets & Chocolates',
        subcategory: 'Chocolates',
        price: 80,
        mrp: 85,
        unit: 'bar',
        size: '60 g',
        image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400',
        tags: 'cadbury,dairy milk,silk,chocolate',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '3.4 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_swt_02',
        name: 'Bikano Gulab Jamun Soft & Juicy',
        category: 'Sweets & Chocolates',
        subcategory: 'Indian Sweets',
        price: 120,
        mrp: 140,
        unit: 'tin',
        size: '500 g',
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
        tags: 'gulab jamun,sweet,dessert,bikano',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.7, review_count: '32,000', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Drinks & Juices ---
    {
        id: 'prod_drk_01',
        name: 'Coca-Cola Original Taste Soft Drink',
        category: 'Drinks & Juices',
        subcategory: 'Soft Drinks & Sodas',
        price: 40,
        mrp: 40,
        unit: 'bottle',
        size: '750 ml',
        image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        tags: 'coca cola,coke,cold drink,party',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '4.2 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_drk_02',
        name: 'Real Fruit Power Alphonso Mango Juice',
        category: 'Drinks & Juices',
        subcategory: 'Fruit Juices',
        price: 110,
        mrp: 125,
        unit: 'tetra pack',
        size: '1 L',
        image_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400',
        tags: 'real,mango juice,fruit,alphonso',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '92,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_drk_03',
        name: 'Red Bull Energy Drink',
        category: 'Drinks & Juices',
        subcategory: 'Energy & Sports Drinks',
        price: 125,
        mrp: 125,
        unit: 'can',
        size: '250 ml',
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
        tags: 'red bull,energy drink,caffeine,focus',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '84,000', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Tea, Coffee & Milk Drinks ---
    {
        id: 'prod_tea_01',
        name: 'Nescafe Classic Instant Coffee Jar',
        category: 'Tea, Coffee & Milk Drinks',
        subcategory: 'Coffee',
        price: 165,
        mrp: 185,
        unit: 'jar',
        size: '50 g',
        image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
        tags: 'nescafe,coffee,instant coffee,hostel',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '1.6 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_tea_02',
        name: 'Tata Tea Premium Desh Ki Chai',
        category: 'Tea, Coffee & Milk Drinks',
        subcategory: 'Tea',
        price: 115,
        mrp: 130,
        unit: 'pouch',
        size: '250 g',
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
        tags: 'tea,chai,tata tea,morning',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.8, review_count: '64,000', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Instant Food ---
    {
        id: 'prod_inst_01',
        name: 'Maggi 2-Minute Masala Instant Noodles',
        category: 'Instant Food',
        subcategory: 'Noodles & Pasta',
        price: 56,
        mrp: 60,
        unit: 'pack',
        size: '4 x 70 g',
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400',
        tags: 'maggi,noodles,instant,hostel midnight',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '6.2 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_inst_02',
        name: 'Nissin Cup Noodles Veggie Masala',
        category: 'Instant Food',
        subcategory: 'Cup Noodles',
        price: 45,
        mrp: 50,
        unit: 'cup',
        size: '70 g',
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400',
        tags: 'cup noodles,nissin,quick,hot',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.7, review_count: '45,000', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Sauces & Spreads ---
    {
        id: 'prod_sauce_01',
        name: 'Nutella Hazelnut Spread with Cocoa',
        category: 'Sauces & Spreads',
        subcategory: 'Sweet Spreads',
        price: 320,
        mrp: 350,
        unit: 'jar',
        size: '350 g',
        image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
        tags: 'nutella,chocolate,hazelnut,bread spread',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '2.1 lac', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_sauce_02',
        name: 'Kissan Fresh Tomato Ketchup',
        category: 'Sauces & Spreads',
        subcategory: 'Ketchup & Dips',
        price: 95,
        mrp: 110,
        unit: 'pouch',
        size: '500 g',
        image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        tags: 'ketchup,kissan,tomato sauce,snacks',
        in_stock: 1, bestseller: 0, is_new: 0, rating: 4.8, review_count: '78,000', is_veg: 1, stock_left: 0
    },

    // --- Snacks & Drinks: Ice Creams & More ---
    {
        id: 'prod_ice_01',
        name: 'Amul Vanilla Gold Ice Cream Tub',
        category: 'Ice Creams & More',
        subcategory: 'Ice Cream Tubs',
        price: 130,
        mrp: 150,
        unit: 'tub',
        size: '500 ml',
        image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
        tags: 'ice cream,vanilla,amul,dessert',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.8, review_count: '89,000', is_veg: 1, stock_left: 0
    },
    {
        id: 'prod_ice_02',
        name: "Kwality Wall's Feast Chocolate Bar",
        category: 'Ice Creams & More',
        subcategory: 'Chocobars & Cones',
        price: 40,
        mrp: 40,
        unit: 'bar',
        size: '70 ml',
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
        tags: 'feast,chocolate,ice cream,kwality walls',
        in_stock: 1, bestseller: 1, is_new: 0, rating: 4.9, review_count: '1.2 lac', is_veg: 1, stock_left: 0
    }
];

const insertStmt = db.prepare(`
    INSERT INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, tags, in_stock, bestseller, is_new, rating, review_count, is_veg, stock_left)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        subcategory = excluded.subcategory,
        price = excluded.price,
        mrp = excluded.mrp,
        size = excluded.size,
        image_url = excluded.image_url,
        rating = excluded.rating,
        review_count = excluded.review_count,
        is_veg = excluded.is_veg,
        stock_left = excluded.stock_left
`);

for (const p of allProducts) {
    insertStmt.run(
        p.id, p.name, p.category, p.subcategory, p.price, p.mrp, p.unit, p.size,
        p.image_url, p.tags, p.in_stock, p.bestseller, p.is_new, p.rating, p.review_count, p.is_veg, p.stock_left
    );
}

console.log('Seeded all categories matching quick commerce directory!');

const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'lpuquick.db');
const db = new DatabaseSync(dbPath);

// Add extra columns if they don't exist
try { db.exec("ALTER TABLE products ADD COLUMN rating REAL DEFAULT 4.8;"); } catch(e){}
try { db.exec("ALTER TABLE products ADD COLUMN review_count TEXT DEFAULT '1.2 lac';"); } catch(e){}
try { db.exec("ALTER TABLE products ADD COLUMN is_veg INTEGER DEFAULT 1;"); } catch(e){}
try { db.exec("ALTER TABLE products ADD COLUMN stock_left INTEGER DEFAULT 0;"); } catch(e){}

// Insert/Update Bakery & Biscuits + other quick commerce products matching the screenshot
const productsToAdd = [
    // --- Bakery & Biscuits ---
    {
        id: 'prod_bisc_01',
        name: 'Sunfeast Dark Fantasy Choco Fill Cookies',
        category: 'Bakery & Biscuits',
        subcategory: 'Cookies',
        price: 39,
        mrp: 40,
        unit: 'pack',
        size: '69 g',
        image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
        tags: 'dark fantasy,biscuit,cookie,chocolate,snack',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.8,
        review_count: '1.3 lac',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_02',
        name: 'Britannia Good Day Butter Cookies',
        category: 'Bakery & Biscuits',
        subcategory: 'Cookies',
        price: 38,
        mrp: 40,
        unit: 'pack',
        size: '248 g',
        image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400',
        tags: 'good day,butter,biscuit,cookie,tea',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.6,
        review_count: '38,599',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_03',
        name: 'Britannia Good Day Cashew Biscuit',
        category: 'Bakery & Biscuits',
        subcategory: 'Cookies',
        price: 40,
        mrp: 45,
        unit: 'pack',
        size: '200 g',
        image_url: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400',
        tags: 'good day,cashew,biscuit,cookie',
        in_stock: 1,
        bestseller: 0,
        is_new: 0,
        rating: 4.8,
        review_count: '1.1 lac',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_04',
        name: 'Hide & Seek Choco Chip & Coffee Cookies',
        category: 'Bakery & Biscuits',
        subcategory: 'Cookies',
        price: 26,
        mrp: 30,
        unit: 'pack',
        size: '100 g',
        image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
        tags: 'hide and seek,choco chip,coffee,chocolate',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.7,
        review_count: '8,132',
        is_veg: 1,
        stock_left: 2
    },
    {
        id: 'prod_bisc_05',
        name: 'Unibic Fruit & Nut Cookies',
        category: 'Bakery & Biscuits',
        subcategory: 'Cookies',
        price: 45,
        mrp: 50,
        unit: 'pack',
        size: '150 g',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        tags: 'unibic,fruit and nut,cookies',
        in_stock: 1,
        bestseller: 0,
        is_new: 1,
        rating: 4.7,
        review_count: '12,400',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_06',
        name: 'Oreo Original Vanilla Creme Biscuit',
        category: 'Bakery & Biscuits',
        subcategory: 'Cream Biscuits',
        price: 35,
        mrp: 40,
        unit: 'pack',
        size: '120 g',
        image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400',
        tags: 'oreo,cream,vanilla,chocolate,biscuit',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.9,
        review_count: '2.5 lac',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_07',
        name: 'Britannia Bourbon Chocolate Cream',
        category: 'Bakery & Biscuits',
        subcategory: 'Cream Biscuits',
        price: 30,
        mrp: 35,
        unit: 'pack',
        size: '150 g',
        image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
        tags: 'bourbon,chocolate,cream,biscuit',
        in_stock: 1,
        bestseller: 0,
        is_new: 0,
        rating: 4.7,
        review_count: '54,000',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_08',
        name: 'Britannia NutriChoice Digestive Biscuit',
        category: 'Bakery & Biscuits',
        subcategory: 'Healthy & Digestive',
        price: 45,
        mrp: 50,
        unit: 'pack',
        size: '250 g',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        tags: 'nutrichoice,digestive,fibre,healthy',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.6,
        review_count: '42,100',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_09',
        name: 'Britannia Little Hearts Biscuits',
        category: 'Bakery & Biscuits',
        subcategory: 'Sweet & Salty',
        price: 20,
        mrp: 20,
        unit: 'pack',
        size: '75 g',
        image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400',
        tags: 'little hearts,sugar,biscuit,sweet',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.8,
        review_count: '88,000',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_10',
        name: 'Parle-G Gold Glucose Biscuit',
        category: 'Bakery & Biscuits',
        subcategory: 'Glucose & Marie',
        price: 10,
        mrp: 10,
        unit: 'pack',
        size: '100 g',
        image_url: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400',
        tags: 'parle g,glucose,chai,biscuit',
        in_stock: 1,
        bestseller: 1,
        is_new: 0,
        rating: 4.9,
        review_count: '5.2 lac',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_11',
        name: 'Britannia Premium Toastea Rusk',
        category: 'Bakery & Biscuits',
        subcategory: 'Rusks & Wafers',
        price: 40,
        mrp: 45,
        unit: 'pack',
        size: '200 g',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        tags: 'rusk,toastea,chai,crispy',
        in_stock: 1,
        bestseller: 0,
        is_new: 0,
        rating: 4.7,
        review_count: '21,000',
        is_veg: 1,
        stock_left: 0
    },
    {
        id: 'prod_bisc_12',
        name: 'Monginis Chocolate Swiss Roll Cake',
        category: 'Bakery & Biscuits',
        subcategory: 'Cakes & Rolls',
        price: 25,
        mrp: 30,
        unit: 'piece',
        size: '60 g',
        image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
        tags: 'cake,swiss roll,chocolate,dessert',
        in_stock: 1,
        bestseller: 0,
        is_new: 1,
        rating: 4.8,
        review_count: '6,400',
        is_veg: 1,
        stock_left: 3
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

for (const p of productsToAdd) {
    insertStmt.run(
        p.id, p.name, p.category, p.subcategory, p.price, p.mrp, p.unit, p.size,
        p.image_url, p.tags, p.in_stock, p.bestseller, p.is_new, p.rating, p.review_count, p.is_veg, p.stock_left
    );
}

// Update existing products with ratings & veg icons
db.exec(`
    UPDATE products SET rating = 4.8, review_count = '1.2 lac', is_veg = 1 WHERE rating IS NULL;
    UPDATE products SET is_veg = 0 WHERE name LIKE '%Egg%' OR name LIKE '%Chicken%';
`);

console.log('Database migrated & rich quick-commerce catalog populated!');

const express = require('express');
const router = express.Router();

// Time-based content mapping
const TIME_SECTIONS = [
    { start: 6, end: 10, title: 'Morning Essentials', greeting: 'Good Morning!', tag: 'morning', icon: 'wb_sunny' },
    { start: 10, end: 14, title: 'Lunch Prep & Refreshers', greeting: 'Time for Lunch!', tag: 'lunch', icon: 'lunch_dining' },
    { start: 14, end: 18, title: 'Afternoon Pick-Me-Up', greeting: 'Good Afternoon!', tag: 'afternoon', icon: 'coffee' },
    { start: 18, end: 22, title: 'Evening Snacks & Sips', greeting: 'Good Evening!', tag: 'evening', icon: 'fastfood' },
    { start: 22, end: 26, title: 'Midnight Cravings', greeting: 'Late Night Hunger?', tag: 'midnight', icon: 'local_pizza' },
    { start: 2, end: 6, title: 'Early Bird Express', greeting: 'Early Riser!', tag: 'morning', icon: 'wb_twilight' },
];

function getTimeSection(hour) {
    const adjustedHour = hour < 2 ? hour + 24 : hour;
    for (const section of TIME_SECTIONS) {
        if (adjustedHour >= section.start && adjustedHour < section.end) {
            return section;
        }
    }
    return TIME_SECTIONS[3];
}

// GET /api/home
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    // Get current hour in IST
    let hour;
    const tzOffset = req.query.tz;
    if (tzOffset !== undefined) {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const clientTime = new Date(utc - parseInt(tzOffset) * 60000);
        hour = clientTime.getHours();
    } else {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60000;
        const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
        hour = ist.getHours();
    }

    const section = getTimeSection(hour);

    // 1. Time-section Curated Products (8-12 products)
    let products = db.prepare(
        `SELECT * FROM products WHERE (tags LIKE ? OR bestseller = 1) AND in_stock = 1 ORDER BY bestseller DESC, rating DESC LIMIT 12`
    ).all(`%${section.tag}%`);
    if (!products || products.length < 8) {
        products = db.prepare(`SELECT * FROM products WHERE in_stock = 1 ORDER BY bestseller DESC, rating DESC LIMIT 12`).all();
    }

    // 2. Buy Again (Top Reorder Items)
    let buyAgain = db.prepare(
        `SELECT * FROM products WHERE in_stock = 1 ORDER BY rating DESC, price ASC LIMIT 10`
    ).all();

    // 3. Trending Snacks & Munchies
    const trendingSnacks = db.prepare(
        `SELECT * FROM products WHERE (category LIKE '%Snack%' OR category LIKE '%Munchies%' OR tags LIKE '%snack%' OR tags LIKE '%chips%' OR tags LIKE '%biscuit%') AND in_stock = 1 LIMIT 8`
    ).all();

    // 4. Cold Beverages & Shakes
    const drinks = db.prepare(
        `SELECT * FROM products WHERE (category LIKE '%Beverage%' OR category LIKE '%Drink%' OR category LIKE '%Dairy%' OR tags LIKE '%beverage%' OR tags LIKE '%coffee%' OR tags LIKE '%tea%') AND in_stock = 1 LIMIT 8`
    ).all();

    // 5. Late Night Maggi & Instant Food
    const instantFood = db.prepare(
        `SELECT * FROM products WHERE (category LIKE '%Instant%' OR tags LIKE '%noodle%' OR tags LIKE '%maggi%' OR tags LIKE '%instant%' OR tags LIKE '%sweet%') AND in_stock = 1 LIMIT 8`
    ).all();

    // Promotional banners
    const promos = [
        {
            id: 'promo_flow_assist',
            type: 'flow_assist',
            title: 'BH13 Express',
            description: 'Order snacks & essentials delivered in under 3 mins.',
            cta: 'Order Now',
            color: 'royal-purple'
        },
        {
            id: 'promo_late_night',
            type: 'time_based',
            title: section.title,
            description: 'Dark Store open till 2 AM. Delivered right to your hostel room.',
            icon: section.icon,
            color: 'emerald'
        }
    ];

    res.json({
        greeting: section.greeting,
        section_title: section.title,
        section_icon: section.icon,
        delivery_time: '3 mins',
        delivery_location: 'BH13',
        products,
        buy_again: buyAgain,
        trending_snacks: trendingSnacks,
        drinks: drinks,
        instant_food: instantFood,
        promos
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// Time-based content mapping
const TIME_SECTIONS = [
    { start: 6, end: 10, title: 'Morning Essentials', greeting: 'Good Morning!', tag: 'morning', icon: 'wb_sunny' },
    { start: 10, end: 14, title: 'Lunch Prep', greeting: 'Time for Lunch!', tag: 'lunch', icon: 'lunch_dining' },
    { start: 14, end: 18, title: 'Afternoon Pick-Me-Up', greeting: 'Good Afternoon!', tag: 'afternoon', icon: 'coffee' },
    { start: 18, end: 22, title: 'Evening Snacks', greeting: 'Good Evening!', tag: 'evening', icon: 'fastfood' },
    { start: 22, end: 26, title: 'Midnight Cravings', greeting: 'Late Night?', tag: 'midnight', icon: 'local_pizza' },
    { start: 2, end: 6, title: 'Early Bird', greeting: 'Early Riser!', tag: 'morning', icon: 'wb_twilight' },
];

function getTimeSection(hour) {
    // Handle midnight wrap (22-2AM → treat 0,1 as 24,25)
    const adjustedHour = hour < 2 ? hour + 24 : hour;
    for (const section of TIME_SECTIONS) {
        if (adjustedHour >= section.start && adjustedHour < section.end) {
            return section;
        }
    }
    return TIME_SECTIONS[3]; // Default: Evening Snacks
}

// GET /api/home
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    
    // Get current hour from client timezone or server
    let hour;
    const tzOffset = req.query.tz; // Client sends timezone offset in minutes
    if (tzOffset !== undefined) {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const clientTime = new Date(utc - parseInt(tzOffset) * 60000);
        hour = clientTime.getHours();
    } else {
        // Use IST by default (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60000;
        const ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset);
        hour = ist.getHours();
    }

    const section = getTimeSection(hour);

    // Batch fetch products for the time section (no N+1)
    const products = db.prepare(
        `SELECT * FROM products WHERE tags LIKE ? AND in_stock = 1 ORDER BY bestseller DESC, is_new DESC LIMIT 8`
    ).all(`%${section.tag}%`);

    // Buy Again items (tagged buyagain)
    const buyAgain = db.prepare(
        `SELECT * FROM products WHERE tags LIKE '%buyagain%' AND in_stock = 1 LIMIT 6`
    ).all();

    // Promotional content
    const promos = [
        {
            id: 'promo_flow_assist',
            type: 'flow_assist',
            title: 'Need ideas?',
            description: 'Ask Flow Assist to build your perfect snack combo.',
            cta: 'Try Now',
            color: 'royal-purple'
        },
        {
            id: 'promo_late_night',
            type: 'time_based',
            title: section.title === 'Midnight Cravings' ? 'Midnight Cravings' : 'Late Night Cravings',
            description: 'Open till 2 AM. Get it hot and fast.',
            icon: 'local_pizza',
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
        promos
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

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

const { getSupabaseClient } = require('../supabase');

// GET /api/home (High-Concurrency Scaled for 6,000+ Users)
router.get('/', async (req, res) => {
    try {
        const tzOffset = req.query.tz || 'default';
        const userId = req.query.userId || req.headers['x-user-id'] || null;

        // 1. Fetch or retrieve global catalog & section data from shared micro-cache (< 0.1ms)
        const baseFeed = await cache.wrap(`home:base:${tzOffset}`, async () => {
            let hour;
            if (tzOffset !== 'default') {
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
            const allProducts = await supabaseDb.products.getAll({ includeInactive: false });

            // Smart keyword categorization for curated trays
            const biscuits = allProducts.filter(p => /biscuit|cookie|wafer|pie|bikis|bourbon|creme|shakti|magic|treat/i.test((p.name || '') + ' ' + (p.category || '') + ' ' + (p.tags || '')));
            const trendingSnacks = allProducts.filter(p => /chips|snack|kurkure|lays|crax|bingo|tedhe|namkeen|curls/i.test((p.name || '') + ' ' + (p.category || '') + ' ' + (p.tags || '')));
            const chocolates = allProducts.filter(p => /choco|dark fantasy|pie|sweet|dessert|wafer/i.test((p.name || '') + ' ' + (p.category || '') + ' ' + (p.tags || '')));
            const instantFood = allProducts.filter(p => /instant|maggi|noodle|pasta|soup|cup/i.test((p.name || '') + ' ' + (p.category || '') + ' ' + (p.tags || '')));
            const drinks = allProducts.filter(p => /beverage|drink|shake|juice|coke|pepsi|water|soda|tea|coffee/i.test((p.name || '') + ' ' + (p.category || '') + ' ' + (p.tags || '')));

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

            return {
                greeting: section.greeting,
                section_title: section.title,
                section_icon: section.icon,
                delivery_time: '3 mins',
                delivery_location: 'BH13',
                total_products_count: allProducts.length,
                all_products: allProducts,
                products: allProducts,
                default_buy_again: allProducts.slice(0, 10),
                biscuits,
                trending_snacks: trendingSnacks,
                chocolates,
                drinks,
                instant_food: instantFood,
                promos,
                free_delivery_banner: {
                    active: true,
                    message: 'Free 3-Minute Campus Delivery on all hostel orders!',
                    tag: 'INSTANT_FREE'
                }
            };
        }, 60000);

        // 2. Compute personalized buy again with user-level caching
        let buyAgain = baseFeed.default_buy_again;
        let isPersonalizedBuyAgain = false;

        if (userId && !userId.startsWith('guest_') && userId !== 'null' && userId !== 'undefined') {
            const userPersonalized = await cache.wrap(`user_buy_again:${userId}`, async () => {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        const { data: userOrders } = await supabase
                            .from('orders')
                            .select('id, created_at, order_items(product_id, quantity, products(*))')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })
                            .limit(5);

                        if (userOrders && userOrders.length > 0) {
                            const productMap = new Map();
                            for (const ord of userOrders) {
                                if (ord.order_items) {
                                    for (const item of ord.order_items) {
                                        if (item.products && item.products.id && !productMap.has(item.products.id)) {
                                            productMap.set(item.products.id, item.products);
                                        }
                                    }
                                }
                            }
                            const orderedItems = Array.from(productMap.values());
                            if (orderedItems.length > 0) {
                                return { items: orderedItems, isPersonalized: true };
                            }
                        }
                    }
                } catch (userErr) {}
                return { items: null, isPersonalized: false };
            }, 60000);

            if (userPersonalized && userPersonalized.items) {
                buyAgain = userPersonalized.items;
                isPersonalizedBuyAgain = true;
            }
        }

        // 3. Fast shallow merge and send
        res.json({
            ...baseFeed,
            buy_again: buyAgain,
            is_personalized_buy_again: isPersonalizedBuyAgain
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;


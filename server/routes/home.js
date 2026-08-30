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

// GET /api/home
router.get('/', async (req, res) => {
    try {
        const tzOffset = req.query.tz || 'default';
        const userId = req.query.userId || req.headers['x-user-id'] || null;
        const cacheKey = `home:${tzOffset}:${userId || 'anon'}`;

        const payload = await cache.wrap(cacheKey, async () => {
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

            // Filter products for curated sections
            const products = allProducts.slice(0, 12);
            
            // Personalized Buy Again computation for this specific user
            let buyAgain = [];
            let isPersonalizedBuyAgain = false;

            if (userId && !userId.startsWith('guest_') && userId !== 'null' && userId !== 'undefined') {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        const { data: userOrders } = await supabase
                            .from('orders')
                            .select('id, created_at, order_items(product_id, quantity, products(*))')
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false });

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
                                buyAgain = orderedItems;
                                isPersonalizedBuyAgain = true;
                            }
                        }
                    }
                } catch (userErr) {
                    console.warn('[Home Feed Buy Again Warn]:', userErr.message);
                }
            }

            // Fallback to top student essentials if user has no past order history yet
            if (buyAgain.length === 0) {
                buyAgain = allProducts.slice(0, 10);
            }

            const trendingSnacks = allProducts.filter(p => (p.category || '').toLowerCase().includes('snack') || (p.tags || '').toLowerCase().includes('snack')).slice(0, 8);
            const drinks = allProducts.filter(p => (p.category || '').toLowerCase().includes('beverage') || (p.category || '').toLowerCase().includes('drink')).slice(0, 8);
            const instantFood = allProducts.filter(p => (p.category || '').toLowerCase().includes('instant') || (p.tags || '').toLowerCase().includes('noodle')).slice(0, 8);

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
                products,
                buy_again: buyAgain,
                is_personalized_buy_again: isPersonalizedBuyAgain,
                trending_snacks: trendingSnacks.length > 0 ? trendingSnacks : products.slice(0, 4),
                drinks: drinks.length > 0 ? drinks : products.slice(2, 6),
                instant_food: instantFood.length > 0 ? instantFood : products.slice(0, 4),
                promos,
                free_delivery_banner: {
                    active: true,
                    message: 'Free 3-Minute Campus Delivery on all hostel orders!',
                    tag: 'INSTANT_FREE'
                }
            };
        }, userId ? 10000 : 45000); // 10s TTL for personalized user feed, 45s for anonymous

        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

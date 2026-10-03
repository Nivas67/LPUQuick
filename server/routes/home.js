const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const supabaseDb = require('../db/supabaseDb');
const cache = require('../cache');

const BANNERS_FILE = path.join(__dirname, '..', 'data', 'banners.json');

function getActiveBannersData() {
    try {
        if (!fs.existsSync(BANNERS_FILE)) {
            return { posters: [], settings: { autoplay_delay: 4500, autoplay_enabled: true } };
        }
        const parsed = JSON.parse(fs.readFileSync(BANNERS_FILE, 'utf8'));
        const posters = (parsed.banners || [])
            .filter(b => b.is_active !== false)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        return {
            posters,
            settings: parsed.settings || { autoplay_delay: 4500, autoplay_enabled: true }
        };
    } catch (e) {
        return { posters: [], settings: { autoplay_delay: 4500, autoplay_enabled: true } };
    }
}

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
        const hostelId = req.query.hostel_id || req.query.hostel || 'BH-13';

        // 1. Fetch or retrieve global catalog & section data from shared micro-cache (< 0.1ms)
        const baseFeed = await cache.wrap(`home:base:${hostelId}:${tzOffset}`, async () => {
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
            const rawProducts = await supabaseDb.products.getAll({ hostel_id: hostelId, includeInactive: false });
            const allProducts = (rawProducts || []).filter(p => !p.deleted).map(p => {
                const clean = { ...p };
                delete clean.cost_price;
                delete clean.cost;
                return clean;
            });

            const promos = [
                {
                    id: 'promo_flow_assist',
                    type: 'flow_assist',
                    title: `${hostelId} Express`,
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
                delivery_location: hostelId,
                total_products_count: allProducts.length,
                all_products: allProducts,
                default_buy_again: allProducts.slice(0, 10),
                promos,
                free_delivery_banner: {
                    active: true,
                    message: `Free 3-Minute Campus Delivery on all ${hostelId} hostel orders!`,
                    tag: 'INSTANT_FREE'
                }
            };
        }, 300000);

        // 2. Compute personalized buy again with user-level caching
        let buyAgain = baseFeed.default_buy_again;
        let isPersonalizedBuyAgain = false;

        if (userId && !userId.startsWith('guest_') && userId !== 'null' && userId !== 'undefined') {
            const userPersonalized = await getUserPersonalizedBuyAgain(userId);
            if (userPersonalized && userPersonalized.items) {
                buyAgain = userPersonalized.items;
                isPersonalizedBuyAgain = true;
            }
        }

        const bannerData = getActiveBannersData();

        // 3. Fast shallow merge and send
        // Cache on Vercel Edge CDN for 60s for public catalog feed
        if (!isPersonalizedBuyAgain) {
            res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        } else {
            res.setHeader('Cache-Control', 'private, no-store');
        }

        res.json({
            ...baseFeed,
            buy_again: buyAgain,
            is_personalized_buy_again: isPersonalizedBuyAgain,
            banners: bannerData.posters,
            banner_settings: bannerData.settings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Helper to retrieve user's past purchased products for Buy Again shelf
 */
async function getUserPersonalizedBuyAgain(userId) {
    if (!userId || userId.startsWith('guest_') || userId === 'null' || userId === 'undefined') {
        return { items: null, isPersonalized: false };
    }
    return await cache.wrap(`user_buy_again:${userId}`, async () => {
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
    }, 300000);
}

// GET /api/home/user-buy-again - Ultra-lightweight endpoint (~1 KB) for personalized order history
// Prevents full 65 KB /api/home public catalog feed from being bypassed with no-store
router.get('/user-buy-again', async (req, res) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'] || null;
        res.setHeader('Cache-Control', 'private, no-cache');
        const userPersonalized = await getUserPersonalizedBuyAgain(userId);
        res.json({
            success: true,
            buy_again: userPersonalized?.items || [],
            is_personalized_buy_again: Boolean(userPersonalized?.isPersonalized)
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message, buy_again: [] });
    }
});

router.get('/buy-again', (req, res) => res.redirect(307, `/api/home/user-buy-again${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`));

// GET /api/home/banners - Public endpoint for active promotional posters & carousel settings
router.get('/banners', (req, res) => {
    try {
        // Banners are static JSON; cache aggressively on CDN edge
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        const bannerData = getActiveBannersData();
        res.json({
            success: true,
            posters: bannerData.posters,
            settings: bannerData.settings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;


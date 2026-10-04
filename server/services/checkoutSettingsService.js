const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');

const SETTINGS_FILE_PATH = path.join(__dirname, '..', 'data', 'global_checkout_settings.json');

const DEFAULT_SETTINGS = {
    offers_enabled: true,
    offer_type: 'percentage', // 'percentage' | 'fixed' | 'free_delivery'
    offer_value: 5,
    minimum_order_value: 350,
    maximum_discount: 50,
    free_delivery_enabled: true,
    free_delivery_threshold: 0,
    delivery_fee: 0,
    handling_fee: 3,
    handling_fee_enabled: true,
    min_cart_value: 35,
    start_date: null,
    end_date: null,
    updated_at: new Date().toISOString(),
    updated_by: 'Owner'
};

let cachedSettings = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

/**
 * Normalizes and sanitizes settings object ensuring all fields are valid, finite numbers or booleans.
 */
function sanitizeSettings(input = {}) {
    const raw = { ...DEFAULT_SETTINGS, ...input };

    const offers_enabled = Boolean(raw.offers_enabled);
    const validOfferTypes = ['percentage', 'fixed', 'free_delivery'];
    const offer_type = validOfferTypes.includes(raw.offer_type) ? raw.offer_type : 'percentage';

    let offer_value = Number(raw.offer_value);
    if (!Number.isFinite(offer_value) || offer_value < 0) offer_value = 0;
    if (offer_type === 'percentage') {
        offer_value = Math.min(100, Math.max(0, offer_value));
    }

    let minimum_order_value = Number(raw.minimum_order_value);
    if (!Number.isFinite(minimum_order_value) || minimum_order_value < 0) minimum_order_value = 0;

    let maximum_discount = Number(raw.maximum_discount);
    if (!Number.isFinite(maximum_discount) || maximum_discount < 0) maximum_discount = 0;

    const free_delivery_enabled = Boolean(raw.free_delivery_enabled);
    let free_delivery_threshold = Number(raw.free_delivery_threshold);
    if (!Number.isFinite(free_delivery_threshold) || free_delivery_threshold < 0) free_delivery_threshold = 0;

    let delivery_fee = Number(raw.delivery_fee);
    if (!Number.isFinite(delivery_fee) || delivery_fee < 0) delivery_fee = 0;

    let handling_fee = Number(raw.handling_fee);
    if (!Number.isFinite(handling_fee) || handling_fee < 0) handling_fee = 0;
    const handling_fee_enabled = Boolean(raw.handling_fee_enabled);

    let min_cart_value = Number(raw.min_cart_value);
    if (!Number.isFinite(min_cart_value) || min_cart_value < 0) min_cart_value = 35;

    let start_date = null;
    if (raw.start_date && !isNaN(new Date(raw.start_date).getTime())) {
        start_date = new Date(raw.start_date).toISOString();
    }

    let end_date = null;
    if (raw.end_date && !isNaN(new Date(raw.end_date).getTime())) {
        end_date = new Date(raw.end_date).toISOString();
    }

    return {
        offers_enabled,
        offer_type,
        offer_value,
        minimum_order_value,
        maximum_discount,
        free_delivery_enabled,
        free_delivery_threshold,
        delivery_fee,
        handling_fee,
        handling_fee_enabled,
        min_cart_value,
        start_date,
        end_date,
        updated_at: raw.updated_at || new Date().toISOString(),
        updated_by: String(raw.updated_by || 'Owner').trim()
    };
}

/**
 * Loads settings from disk backup
 */
function loadFromDisk() {
    try {
        if (fs.existsSync(SETTINGS_FILE_PATH)) {
            const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            return sanitizeSettings(parsed);
        }
    } catch (err) {
        console.warn('[checkoutSettingsService] Failed to load from disk:', err.message);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Saves settings to disk backup
 */
function saveToDisk(settings) {
    try {
        const dir = path.dirname(SETTINGS_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    } catch (err) {
        console.warn('[checkoutSettingsService] Failed to save to disk:', err.message);
    }
}

/**
 * Gets active settings (Supabase first with in-memory caching and disk fallback)
 */
async function getSettings(forceFresh = false) {
    const now = Date.now();
    if (!forceFresh && cachedSettings && (now - lastCacheTime < CACHE_TTL_MS)) {
        return cachedSettings;
    }

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { data, error } = await supabase
                .from('app_availability')
                .select('*')
                .eq('id', 'global_checkout_settings')
                .maybeSingle();

            if (!error && data && data.message) {
                try {
                    const parsed = JSON.parse(data.message);
                    const clean = sanitizeSettings({
                        ...parsed,
                        updated_at: data.updated_at || parsed.updated_at,
                        updated_by: data.created_by || parsed.updated_by
                    });
                    cachedSettings = clean;
                    lastCacheTime = now;
                    saveToDisk(clean);
                    return clean;
                } catch (parseErr) {
                    console.warn('[checkoutSettingsService] JSON parse error from Supabase:', parseErr.message);
                }
            }
        }
    } catch (supabaseErr) {
        console.warn('[checkoutSettingsService] Supabase read error, falling back to disk:', supabaseErr.message);
    }

    // Disk fallback
    const diskSettings = loadFromDisk();
    cachedSettings = diskSettings;
    lastCacheTime = now;
    return diskSettings;
}

/**
 * Updates settings permanently in Supabase and on disk.
 * Strictly validated before saving.
 */
async function updateSettings(newSettings, adminUser = {}) {
    // 1. Validate inputs
    const errors = [];

    const delivery_fee = Number(newSettings.delivery_fee);
    if (!Number.isFinite(delivery_fee) || delivery_fee < 0) {
        errors.push('Delivery fee must be a valid number >= 0.');
    }

    const handling_fee = Number(newSettings.handling_fee);
    if (!Number.isFinite(handling_fee) || handling_fee < 0) {
        errors.push('Handling fee must be a valid number >= 0.');
    }

    const offer_type = String(newSettings.offer_type || '').toLowerCase();
    if (!['percentage', 'fixed', 'free_delivery'].includes(offer_type)) {
        errors.push("Offer type must be 'percentage', 'fixed', or 'free_delivery'.");
    }

    const offer_value = Number(newSettings.offer_value);
    if (!Number.isFinite(offer_value) || offer_value < 0) {
        errors.push('Offer discount value must be a valid number >= 0.');
    } else if (offer_type === 'percentage' && (offer_value < 0 || offer_value > 100)) {
        errors.push('Percentage discount must be between 0% and 100%.');
    }

    const minimum_order_value = Number(newSettings.minimum_order_value);
    if (!Number.isFinite(minimum_order_value) || minimum_order_value < 0) {
        errors.push('Minimum order value must be a valid number >= 0.');
    }

    const maximum_discount = Number(newSettings.maximum_discount);
    if (!Number.isFinite(maximum_discount) || maximum_discount < 0) {
        errors.push('Maximum discount must be a valid number >= 0.');
    }

    const free_delivery_threshold = Number(newSettings.free_delivery_threshold);
    if (!Number.isFinite(free_delivery_threshold) || free_delivery_threshold < 0) {
        errors.push('Free delivery threshold must be a valid number >= 0.');
    }

    if (newSettings.start_date && isNaN(new Date(newSettings.start_date).getTime())) {
        errors.push('Start date must be a valid date.');
    }

    if (newSettings.end_date && isNaN(new Date(newSettings.end_date).getTime())) {
        errors.push('End date must be a valid date.');
    }

    if (newSettings.start_date && newSettings.end_date) {
        if (new Date(newSettings.start_date).getTime() > new Date(newSettings.end_date).getTime()) {
            errors.push('Offer end date cannot be earlier than start date.');
        }
    }

    if (errors.length > 0) {
        const err = new Error(errors.join(' '));
        err.validationErrors = errors;
        err.statusCode = 400;
        throw err;
    }

    // 2. Prepare clean sanitized payload
    const updatedBy = adminUser.name || adminUser.email || 'Owner';
    const nowIso = new Date().toISOString();

    const clean = sanitizeSettings({
        ...newSettings,
        updated_at: nowIso,
        updated_by: updatedBy
    });

    // 3. Save to Supabase app_availability
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            const { error: upsertErr } = await supabase
                .from('app_availability')
                .upsert({
                    id: 'global_checkout_settings',
                    is_locked: false,
                    lock_type: 'GLOBAL_SETTINGS',
                    message: JSON.stringify(clean),
                    created_by: adminUser.id || 'owner',
                    updated_at: nowIso
                });

            if (upsertErr) {
                console.error('[checkoutSettingsService] Supabase upsert failed:', upsertErr);
                throw new Error('Database update failed: ' + upsertErr.message);
            }
        }
    } catch (dbErr) {
        console.error('[checkoutSettingsService] Supabase save error:', dbErr.message);
        throw dbErr;
    }

    // 4. Update memory cache and disk backup
    cachedSettings = clean;
    lastCacheTime = Date.now();
    saveToDisk(clean);

    return clean;
}

/**
 * Deterministic Order & Checkout Calculation Engine
 * 1. Calculate product subtotal.
 * 2. Apply valid product-level discounts using the existing system.
 * 3. Calculate eligible global offer.
 * 4. Calculate delivery fee.
 * 5. Check free-delivery condition.
 * 6. Calculate handling fee.
 * 7. Calculate final total.
 */
function calculateCharges(items = [], settings = null) {
    const cfg = settings ? sanitizeSettings(settings) : (cachedSettings || loadFromDisk());
    const list = Array.isArray(items) ? items : [];

    const totalQuantity = list.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const totalMrp = list.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const subtotal = list.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
    const mrpDiscount = Math.max(0, totalMrp - subtotal);

    // 3. Calculate eligible global offer
    let globalDiscount = 0;
    let isOfferActive = Boolean(cfg.offers_enabled);

    // Check optional dates
    if (isOfferActive && (cfg.start_date || cfg.end_date)) {
        const now = Date.now();
        if (cfg.start_date && now < new Date(cfg.start_date).getTime()) {
            isOfferActive = false;
        }
        if (cfg.end_date && now > new Date(cfg.end_date).getTime()) {
            isOfferActive = false;
        }
    }

    const minOfferValue = Number(cfg.minimum_order_value) || 0;
    const meetsOfferMinOrder = subtotal >= minOfferValue;

    if (isOfferActive && meetsOfferMinOrder && subtotal > 0) {
        if (cfg.offer_type === 'percentage') {
            const rawDiscount = Math.round(subtotal * (cfg.offer_value / 100));
            if (cfg.maximum_discount > 0) {
                globalDiscount = Math.min(rawDiscount, cfg.maximum_discount);
            } else {
                globalDiscount = rawDiscount;
            }
        } else if (cfg.offer_type === 'fixed') {
            globalDiscount = Math.min(subtotal, cfg.offer_value);
        } else if (cfg.offer_type === 'free_delivery') {
            // Free delivery offer applies 0 direct subtotal discount, but waives delivery fee
            globalDiscount = 0;
        }
    }

    // 4 & 5. Delivery fee calculation & free-delivery condition
    let baseDeliveryFee = Number(cfg.delivery_fee) || 0;
    let delivery_fee = 0;
    let isFreeDelivery = false;

    if (list.length > 0) {
        if (baseDeliveryFee <= 0) {
            delivery_fee = 0;
            isFreeDelivery = true;
        } else {
            const freeDelThreshold = Number(cfg.free_delivery_threshold) || 0;
            const meetsFreeDelThreshold = cfg.free_delivery_enabled && subtotal >= freeDelThreshold;
            const hasFreeDeliveryOffer = isOfferActive && cfg.offer_type === 'free_delivery' && meetsOfferMinOrder;

            if (meetsFreeDelThreshold || hasFreeDeliveryOffer) {
                delivery_fee = 0;
                isFreeDelivery = true;
            } else {
                delivery_fee = baseDeliveryFee;
                isFreeDelivery = false;
            }
        }
    }

    // 6. Handling fee calculation
    let platform_fee = 0;
    if (list.length > 0 && cfg.handling_fee_enabled) {
        platform_fee = Number(cfg.handling_fee) || 0;
    }

    // 7. Calculate final total
    const total = Math.max(0, subtotal - globalDiscount + delivery_fee + platform_fee);

    // Savings summary
    const deliverySavings = isFreeDelivery ? (baseDeliveryFee > 0 ? baseDeliveryFee : 25) : 0;
    const total_savings = mrpDiscount + globalDiscount + deliverySavings;

    // Minimum order check
    const min_order_value = Number(cfg.min_cart_value) || 35;
    const is_min_order_met = subtotal >= min_order_value;
    const min_order_shortfall = Math.max(0, min_order_value - subtotal);

    return {
        subtotal,
        total_mrp: totalMrp,
        mrp_discount: mrpDiscount,
        global_discount: globalDiscount,
        discount5: globalDiscount, // Backward-compatibility
        bulk_discount: globalDiscount, // Backward-compatibility
        delivery_fee,
        deliveryFee: delivery_fee,
        base_delivery_fee: baseDeliveryFee,
        is_free_delivery: isFreeDelivery,
        platform_fee,
        platformFee: platform_fee,
        handling_fee: platform_fee,
        tax: 0,
        total,
        total_savings,
        min_order_value,
        is_min_order_met,
        min_order_shortfall,
        item_count: totalQuantity,
        total_items: totalQuantity,
        applied_offer: (isOfferActive && (globalDiscount > 0 || (cfg.offer_type === 'free_delivery' && meetsOfferMinOrder))) ? {
            type: cfg.offer_type,
            value: cfg.offer_value,
            discount: globalDiscount,
            is_free_delivery: cfg.offer_type === 'free_delivery'
        } : null
    };
}

module.exports = {
    getSettings,
    updateSettings,
    calculateCharges,
    sanitizeSettings,
    DEFAULT_SETTINGS
};

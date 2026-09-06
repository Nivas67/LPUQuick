const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BANNERS_FILE = path.join(DATA_DIR, 'banners.json');
const UPLOADS_DIR_PUBLIC = path.join(__dirname, '..', '..', 'public', 'uploads', 'banners');
const UPLOADS_DIR_CLIENT = path.join(__dirname, '..', '..', 'client', 'uploads', 'banners');

// Ensure storage directories exist
[DATA_DIR, UPLOADS_DIR_PUBLIC, UPLOADS_DIR_CLIENT].forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    } catch (e) {}
});

const DEFAULT_BANNERS = [
    {
        id: 'banner_default_1',
        title: 'Corridor Express Snacks & Munchies',
        subtitle: 'Instant noodles, chilled drinks, and snacks delivered right to your hostel room door in 3 minutes.',
        badge: '⚡ 3-MIN ROOM DROP',
        pill: 'BH13 GROUND HUB',
        link_url: '#/categories',
        link_text: 'Browse Snacks',
        gradient: 'emerald',
        image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        is_full_poster: false,
        is_active: true,
        display_order: 1,
        created_at: new Date().toISOString()
    },
    {
        id: 'banner_default_2',
        title: 'Late Night Study & Gaming Fuel',
        subtitle: 'Hot Maggi, cold drinks, chocolate bars, and crunchy chips ready for your midnight grind.',
        badge: '🌙 TILL 3 AM',
        pill: 'MIDNIGHT FUEL',
        link_url: '#/categories',
        link_text: 'Explore Combos',
        gradient: 'purple',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
        is_full_poster: false,
        is_active: true,
        display_order: 2,
        created_at: new Date().toISOString()
    },
    {
        id: 'banner_default_3',
        title: 'Zero Delivery Fees On Every Order',
        subtitle: 'No convenience charges, no minimum order traps. 100% calm commerce delivery.',
        badge: '🎉 ₹0 DELIVERY FEE',
        pill: 'CAMPUS PERK',
        link_url: '#shop-catalog-section',
        link_text: 'Shop Now',
        gradient: 'amber',
        image_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=800&auto=format&fit=crop&q=80',
        is_full_poster: false,
        is_active: true,
        display_order: 3,
        created_at: new Date().toISOString()
    },
    {
        id: 'banner_default_4',
        title: 'Discreet Tamper-Proof Room Drop',
        subtitle: 'All hostel orders sealed in opaque bags for privacy and peace of mind.',
        badge: '🔒 HOSTEL SAFE',
        pill: '100% PRIVATE',
        link_url: '#shop-catalog-section',
        link_text: 'Order Confidentially',
        gradient: 'cyan',
        image_url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&auto=format&fit=crop&q=80',
        is_full_poster: false,
        is_active: true,
        display_order: 4,
        created_at: new Date().toISOString()
    }
];

const DEFAULT_SETTINGS = {
    autoplay_delay: 4500, // default 4.5s
    autoplay_enabled: true
};

class BannersDb {
    constructor() {
        this.cache = null;
        this.lastLoaded = 0;
        this.cacheTtl = 5000; // 5s in-memory cache
    }

    /**
     * Load state from memory cache, local file, or Supabase
     */
    async getState(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && this.cache && (now - this.lastLoaded < this.cacheTtl)) {
            return this.cache;
        }

        // Try to load from Supabase Cloud first
        const supabase = getSupabaseClient();
        let remoteState = null;

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'banners_data')
                    .maybeSingle();

                if (!error && data && data.message) {
                    try {
                        const parsed = JSON.parse(data.message);
                        if (parsed && Array.isArray(parsed.banners)) {
                            remoteState = parsed;
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.warn('[BannersDb] Supabase read fallback:', err.message);
            }
        }

        if (remoteState) {
            this.cache = remoteState;
            this.lastLoaded = now;
            this.persistLocalFile(remoteState);
            return this.cache;
        }

        // Fallback to local JSON file
        if (fs.existsSync(BANNERS_FILE)) {
            try {
                const fileData = JSON.parse(fs.readFileSync(BANNERS_FILE, 'utf8'));
                if (fileData && Array.isArray(fileData.banners)) {
                    this.cache = fileData;
                    this.lastLoaded = now;
                    // Sync to Supabase in background
                    this.persistRemote(fileData).catch(() => {});
                    return this.cache;
                }
            } catch (e) {}
        }

        // Initialize default seed
        const initialState = {
            banners: DEFAULT_BANNERS,
            settings: DEFAULT_SETTINGS,
            updated_at: new Date().toISOString()
        };

        this.cache = initialState;
        this.lastLoaded = now;
        await this.persistState(initialState);
        return this.cache;
    }

    /**
     * Persist state to local file and Supabase
     */
    async persistState(state) {
        state.updated_at = new Date().toISOString();
        this.cache = state;
        this.lastLoaded = Date.now();

        this.persistLocalFile(state);
        await this.persistRemote(state);
    }

    persistLocalFile(state) {
        try {
            fs.writeFileSync(BANNERS_FILE, JSON.stringify(state, null, 2), 'utf8');
        } catch (e) {
            console.error('[BannersDb] Local file write error:', e.message);
        }
    }

    async persistRemote(state) {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        try {
            await supabase.from('app_availability').upsert({
                id: 'banners_data',
                is_locked: false,
                lock_type: 'BANNERS_CONFIG',
                message: JSON.stringify(state),
                updated_at: new Date().toISOString()
            });
        } catch (err) {
            console.warn('[BannersDb] Supabase write error:', err.message);
        }
    }

    /**
     * Get active banners sorted for client storefront
     */
    async getStorefrontBanners() {
        const state = await this.getState();
        const activeBanners = (state.banners || [])
            .filter(b => b.is_active !== false)
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        return {
            banners: activeBanners,
            settings: state.settings || DEFAULT_SETTINGS
        };
    }

    /**
     * Get all banners for admin console
     */
    async getAdminBanners() {
        const state = await this.getState(true);
        const sortedBanners = (state.banners || [])
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        return {
            banners: sortedBanners,
            settings: state.settings || DEFAULT_SETTINGS
        };
    }

    /**
     * Create a new banner poster
     */
    async createBanner(bannerData) {
        const state = await this.getState(true);
        const banners = state.banners || [];

        const newId = `banner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const maxOrder = banners.reduce((max, b) => Math.max(max, b.display_order || 0), 0);

        const newBanner = {
            id: newId,
            title: (bannerData.title || '').trim(),
            subtitle: (bannerData.subtitle || '').trim(),
            badge: (bannerData.badge || '').trim(),
            pill: (bannerData.pill || '').trim(),
            link_url: (bannerData.link_url || '#/categories').trim(),
            link_text: (bannerData.link_text || 'Order Now').trim(),
            gradient: bannerData.gradient || 'emerald',
            image_url: (bannerData.image_url || '').trim(),
            is_full_poster: Boolean(bannerData.is_full_poster),
            is_active: bannerData.is_active !== false,
            display_order: Number(bannerData.display_order) || (maxOrder + 1),
            created_at: new Date().toISOString()
        };

        banners.push(newBanner);
        state.banners = banners;
        await this.persistState(state);
        return newBanner;
    }

    /**
     * Update an existing banner
     */
    async updateBanner(id, bannerData) {
        const state = await this.getState(true);
        const banners = state.banners || [];
        const index = banners.findIndex(b => b.id === id);

        if (index === -1) {
            throw new Error(`Banner with ID ${id} not found`);
        }

        const existing = banners[index];
        banners[index] = {
            ...existing,
            title: bannerData.title !== undefined ? bannerData.title.trim() : existing.title,
            subtitle: bannerData.subtitle !== undefined ? bannerData.subtitle.trim() : existing.subtitle,
            badge: bannerData.badge !== undefined ? bannerData.badge.trim() : existing.badge,
            pill: bannerData.pill !== undefined ? bannerData.pill.trim() : existing.pill,
            link_url: bannerData.link_url !== undefined ? bannerData.link_url.trim() : existing.link_url,
            link_text: bannerData.link_text !== undefined ? bannerData.link_text.trim() : existing.link_text,
            gradient: bannerData.gradient !== undefined ? bannerData.gradient : existing.gradient,
            image_url: bannerData.image_url !== undefined ? bannerData.image_url.trim() : existing.image_url,
            is_full_poster: bannerData.is_full_poster !== undefined ? Boolean(bannerData.is_full_poster) : existing.is_full_poster,
            is_active: bannerData.is_active !== undefined ? Boolean(bannerData.is_active) : existing.is_active,
            display_order: bannerData.display_order !== undefined ? Number(bannerData.display_order) : existing.display_order,
            updated_at: new Date().toISOString()
        };

        state.banners = banners;
        await this.persistState(state);
        return banners[index];
    }

    /**
     * Delete a banner
     */
    async deleteBanner(id) {
        const state = await this.getState(true);
        const banners = state.banners || [];
        const filtered = banners.filter(b => b.id !== id);

        if (filtered.length === banners.length) {
            throw new Error(`Banner with ID ${id} not found`);
        }

        state.banners = filtered;
        await this.persistState(state);
        return { success: true, deletedId: id };
    }

    /**
     * Reorder banners based on an array of IDs
     */
    async reorderBanners(orderedIds) {
        if (!Array.isArray(orderedIds)) return [];
        const state = await this.getState(true);
        const banners = state.banners || [];

        orderedIds.forEach((id, index) => {
            const banner = banners.find(b => b.id === id);
            if (banner) {
                banner.display_order = index + 1;
            }
        });

        banners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        state.banners = banners;
        await this.persistState(state);
        return banners;
    }

    /**
     * Update carousel rotation delay and auto-slide settings
     */
    async updateSettings(newSettings) {
        const state = await this.getState(true);
        state.settings = {
            ...(state.settings || DEFAULT_SETTINGS),
            autoplay_delay: Math.max(1500, Math.min(30000, Number(newSettings.autoplay_delay) || 4500)),
            autoplay_enabled: newSettings.autoplay_enabled !== false
        };

        await this.persistState(state);
        return state.settings;
    }

    /**
     * Upload an image buffer or base64 to Supabase Storage CDN (with local /uploads fallback)
     */
    async uploadBannerImage(base64Data, preferredName = null) {
        if (!base64Data || typeof base64Data !== 'string') return base64Data;
        if (!base64Data.startsWith('data:image/')) return base64Data;

        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return base64Data;

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        let ext = 'jpg';
        if (mimeType.includes('png')) ext = 'png';
        else if (mimeType.includes('webp')) ext = 'webp';
        else if (mimeType.includes('gif')) ext = 'gif';
        else if (mimeType.includes('svg')) ext = 'svg';

        const cleanName = preferredName 
            ? `${preferredName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.${ext}`
            : `banner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

        // Try Supabase Storage CDN first
        const supabase = getSupabaseClient();
        if (supabase) {
            try {
                try {
                    await supabase.storage.createBucket('banners', { public: true, fileSizeLimit: 10485760 });
                } catch (e) {}

                const { error: uploadErr } = await supabase.storage
                    .from('banners')
                    .upload(cleanName, buffer, {
                        contentType: mimeType,
                        upsert: true
                    });

                if (!uploadErr) {
                    const { data: pubData } = supabase.storage.from('banners').getPublicUrl(cleanName);
                    if (pubData && pubData.publicUrl) {
                        return pubData.publicUrl;
                    }
                } else {
                    console.warn('[Banners Storage Notice]:', uploadErr.message);
                }
            } catch (err) {
                console.warn('[Banners Storage Error]:', err.message);
            }
        }

        // Fallback: save to local /uploads/banners directory
        try {
            const publicPath = path.join(UPLOADS_DIR_PUBLIC, cleanName);
            const clientPath = path.join(UPLOADS_DIR_CLIENT, cleanName);

            fs.writeFileSync(publicPath, buffer);
            try { fs.writeFileSync(clientPath, buffer); } catch(e) {}

            return `/uploads/banners/${cleanName}`;
        } catch (localErr) {
            console.error('[Banners Local Upload Error]:', localErr.message);
            return base64Data; // Return as data URL if file write fails
        }
    }
}

module.exports = new BannersDb();

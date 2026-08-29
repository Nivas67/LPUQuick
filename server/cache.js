/**
 * LPUQuick High-Speed In-Memory Cache Engine
 * Provides sub-millisecond data retrieval with auto-invalidation on database mutations.
 */

class MemoryCache {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.data;
    }

    set(key, data, ttlMs = 60000) {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
            cachedAt: Date.now()
        });
    }

    delete(key) {
        this.store.delete(key);
    }

    clearByPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    invalidateProducts() {
        this.clearByPrefix('home:');
        this.clearByPrefix('products:');
        this.clearByPrefix('categories:');
        this.clearByPrefix('search:');
        console.log('[Cache Engine] ⚡ Product, Home & Category cache invalidated.');
    }

    async wrap(key, fetcher, ttlMs = 60000) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const fresh = await fetcher();
        if (fresh !== undefined && fresh !== null) {
            this.set(key, fresh, ttlMs);
        }
        return fresh;
    }
}

const cache = new MemoryCache();
module.exports = cache;

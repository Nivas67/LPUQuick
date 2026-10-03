const fs = require('fs');
const path = require('path');
const { getSupabaseClient } = require('../supabase');
const { v4: uuidv4 } = require('uuid');
const cache = require('../cache');

let localUploadsSet = null;
let lastUploadsScan = 0;
function getLocalUploadsSet() {
    const now = Date.now();
    if (!localUploadsSet || (now - lastUploadsScan > 15000)) {
        try {
            const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
            if (fs.existsSync(uploadDir)) {
                localUploadsSet = new Set(fs.readdirSync(uploadDir));
            } else {
                localUploadsSet = new Set();
            }
        } catch (e) {
            localUploadsSet = new Set();
        }
        lastUploadsScan = now;
    }
    return localUploadsSet;
}

/**
 * Pure PostgreSQL Database Repository for LPUQuick
 * Backed 100% by PostgreSQL via Supabase PostgREST (Serverless-compatible, zero SQLite dependencies).
 */
const supabaseDb = {
    // ==========================================
    // HOSTELS (Multi-Hostel Operations)
    // ==========================================
    hostels: {
        _hostelsFilePath: path.join(__dirname, '..', 'data', 'hostels.json'),
        _memoryHostels: null,

        _loadHostelsFromDisk() {
            try {
                if (fs.existsSync(this._hostelsFilePath)) {
                    this._memoryHostels = JSON.parse(fs.readFileSync(this._hostelsFilePath, 'utf8'));
                } else {
                    this._memoryHostels = [
                        { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'BH-5', name: 'Boys Hostel 5', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'BH-14', name: 'Boys Hostel 12', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'GH-1', name: 'Girls Hostel 1', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'BH 11', name: 'Boys Hostel 11', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'BH 6', name: 'Boys Hostel 6', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                        { id: 'BH 4', name: 'Boys Hostel 4', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    ];
                    try {
                        const dir = path.dirname(this._hostelsFilePath);
                        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                        fs.writeFileSync(this._hostelsFilePath, JSON.stringify(this._memoryHostels, null, 2));
                    } catch (e) {}
                }
            } catch (e) {
                this._memoryHostels = [
                    { id: 'BH-13', name: 'Boys Hostel 13', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'BH-5', name: 'Boys Hostel 5', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'BH-14', name: 'Boys Hostel 12', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'GH-1', name: 'Girls Hostel 1', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'BH 11', name: 'Boys Hostel 11', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'BH 6', name: 'Boys Hostel 6', status: 'OFF', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                    { id: 'BH 4', name: 'Boys Hostel 4', status: 'ACTIVE', manager_user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ];
            }
            return this._memoryHostels;
        },

        _saveHostelsToDisk() {
            try {
                if (this._memoryHostels) {
                    const dir = path.dirname(this._hostelsFilePath);
                    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                    fs.writeFileSync(this._hostelsFilePath, JSON.stringify(this._memoryHostels, null, 2));
                }
            } catch (e) {}
        },

        async _saveHostelsToSupabase() {
            const supabase = getSupabaseClient();
            if (!supabase || !this._memoryHostels) return;
            try {
                await supabase.from('app_availability').upsert([{
                    id: 'hostels_registry',
                    is_locked: false,
                    lock_type: 'NONE',
                    message: JSON.stringify(this._memoryHostels),
                    updated_at: new Date().toISOString()
                }]);
            } catch (e) {
                console.warn('[Hostels Supabase sync notice]:', e.message);
            }
        },

        async getAll({ status, includeInactive = true } = {}) {
            const cacheKey = `hostels:all:${status || 'any'}:${includeInactive}`;
            return await cache.wrap(cacheKey, async () => {
                const supabase = getSupabaseClient();
                if (supabase) {
                    try {
                        const { data, error } = await supabase
                            .from('app_availability')
                            .select('message')
                            .eq('id', 'hostels_registry')
                            .maybeSingle();

                        if (!error && data && data.message) {
                            try {
                                const parsed = JSON.parse(data.message);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    this._memoryHostels = parsed;
                                    this._saveHostelsToDisk();
                                    let list = [...this._memoryHostels];
                                    if (status) {
                                        list = list.filter(h => h.status === status);
                                    } else if (!includeInactive) {
                                        list = list.filter(h => h.status === 'ACTIVE');
                                    }
                                    return list;
                                }
                            } catch (parseErr) {}
                        }
                    } catch (e) {
                        console.warn('[Hostels getAll app_availability notice]:', e.message);
                    }

                    // Optional fallback to legacy hostels table if it exists in DB
                    try {
                        let query = supabase.from('hostels').select('id, name, status, manager_user_id, created_at, updated_at');
                        if (status) {
                            query = query.eq('status', status);
                        } else if (!includeInactive) {
                            query = query.eq('status', 'ACTIVE');
                        }
                        query = query.order('id', { ascending: true });
                        const { data, error } = await query;
                        if (!error && Array.isArray(data) && data.length > 0) {
                            if (!status && includeInactive) {
                                this._memoryHostels = data;
                                this._saveHostelsToDisk();
                                this._saveHostelsToSupabase().catch(() => {});
                            }
                            return data;
                        }
                    } catch (e) {}
                }

                // Resilient local snapshot fallback
                let list = [...(this._memoryHostels || this._loadHostelsFromDisk())];
                if (status) {
                    list = list.filter(h => h.status === status);
                } else if (!includeInactive) {
                    list = list.filter(h => h.status === 'ACTIVE');
                }
                return list;
            }, 2000); // 2s TTL — hostel status must propagate fast across serverless instances
        },

        async getActiveHostels() {
            return this.getAll({ status: 'ACTIVE', includeInactive: false });
        },

        async getById(id) {
            if (!id) return null;
            const cleanId = id.trim();
            const all = await this.getAll({ includeInactive: true });
            const normClean = cleanId.toLowerCase().replace(/[\s\-_]/g, '');
            return all.find(h => {
                const normHId = (h.id || '').toLowerCase().replace(/[\s\-_]/g, '');
                const normHName = (h.name || '').toLowerCase().replace(/[\s\-_]/g, '').replace(/^(boys?hostel|bh)/, 'bh').replace(/^(girls?hostel|gh)/, 'gh');
                return normHId === normClean || normHName === normClean;
            }) || null;
        },

        async create({ id, name, status = 'ACTIVE', manager_user_id = null }) {
            if (!id || !name) throw new Error('Hostel ID and Name are required');
            const cleanId = id.trim().toUpperCase();
            const cleanName = name.trim();
            const cleanStatus = status === 'OFF' ? 'OFF' : 'ACTIVE';
            const now = new Date().toISOString();

            const record = {
                id: cleanId,
                name: cleanName,
                status: cleanStatus,
                manager_user_id: manager_user_id || null,
                created_at: now,
                updated_at: now
            };

            const current = this._memoryHostels || this._loadHostelsFromDisk();
            const normClean = cleanId.replace(/[\s\-_]/g, '').toLowerCase();
            const idx = current.findIndex(h => (h.id || '').replace(/[\s\-_]/g, '').toLowerCase() === normClean);
            if (idx >= 0) {
                current[idx] = { ...current[idx], ...record };
            } else {
                current.push(record);
            }
            this._memoryHostels = current;
            this._saveHostelsToDisk();
            await this._saveHostelsToSupabase();
            cache.invalidateHostels();
            return record;
        },

        async update(id, updates = {}) {
            if (!id) throw new Error('Hostel ID is required');
            const cleanId = id.trim();
            const existing = await this.getById(cleanId);
            if (!existing) throw new Error(`Hostel ${cleanId} not found`);

            const patch = { updated_at: new Date().toISOString() };
            if (updates.name !== undefined) patch.name = updates.name.trim();
            if (updates.status !== undefined) patch.status = updates.status === 'OFF' ? 'OFF' : 'ACTIVE';
            if (updates.manager_user_id !== undefined) patch.manager_user_id = updates.manager_user_id;

            const current = this._memoryHostels || this._loadHostelsFromDisk();
            const normClean = (existing.id || cleanId).replace(/[\s\-_]/g, '').toLowerCase();
            const idx = current.findIndex(h => (h.id || '').replace(/[\s\-_]/g, '').toLowerCase() === normClean);
            if (idx >= 0) {
                current[idx] = { ...current[idx], ...patch };
            }
            this._memoryHostels = current;
            this._saveHostelsToDisk();
            await this._saveHostelsToSupabase();
            cache.invalidateHostels();
            return { ...existing, ...patch };
        },

        async delete(id) {
            if (!id) throw new Error('Hostel ID is required');
            const cleanId = id.trim();
            const existing = await this.getById(cleanId);
            const targetId = existing?.id || cleanId;
            const normTarget = targetId.toLowerCase().replace(/[\s\-_]/g, '');

            const current = this._memoryHostels || this._loadHostelsFromDisk();
            this._memoryHostels = current.filter(h => {
                const normH = (h.id || '').toLowerCase().replace(/[\s\-_]/g, '');
                return normH !== normTarget && h.id !== targetId;
            });
            this._saveHostelsToDisk();
            await this._saveHostelsToSupabase();
            cache.invalidateHostels();
            return { success: true, deletedId: targetId };
        },

        async assignManager(hostelId, managerUserId) {
            return this.update(hostelId, { manager_user_id: managerUserId });
        },

        async removeManager(hostelId) {
            return this.update(hostelId, { manager_user_id: null });
        }
    },

    // ==========================================
    // PRODUCTS
    // ==========================================
    products: {
        _formatProduct(p) {
            if (!p) return null;
            const match = (p.tags || '').match(/stock:(\d+)/);
            const stock_left = match ? parseInt(match[1], 10) : 0;
            const in_stock = Boolean(stock_left > 0 && p.in_stock !== false);
            
            // Extract hostel_id from direct column or tag fallback (Defaulting cleanly to BH-13)
            const hostelMatch = (p.tags || '').match(/hostel:([A-Za-z0-9_-]+)/);
            const hostel_id = p.hostel_id || (hostelMatch ? hostelMatch[1] : 'BH-13');

            let image_url = p.image_url;
            const localUploads = getLocalUploadsSet();
            const supabaseBaseUrl = process.env.SUPABASE_URL || 'https://yojndzstlilzlkxonmvd.supabase.co';

            if (process.env.VERCEL) {
                // On Vercel: Offload 100% of product image data transfer to Supabase Storage CDN (Zero Vercel Origin/Data Transfer)
                if (image_url && image_url.startsWith('/uploads/')) {
                    const filename = image_url.replace('/uploads/', '').split('?')[0];
                    image_url = `${supabaseBaseUrl}/storage/v1/object/public/products/${filename}`;
                }
            } else {
                if (image_url && image_url.includes('supabase.co/storage/v1/object/public/products/')) {
                    const filename = image_url.split('/').pop().split('?')[0];
                    if (localUploads.has(filename)) {
                        image_url = `/uploads/${filename}`;
                    }
                } else if (image_url && image_url.startsWith('/uploads/')) {
                    const filename = image_url.replace('/uploads/', '').split('?')[0];
                    if (!localUploads.has(filename) && filename) {
                        image_url = `${supabaseBaseUrl}/storage/v1/object/public/products/${filename}`;
                    }
                }
            }
            return {
                ...p,
                hostel_id,
                image_url,
                cost_price: Number(p.cost_price) || 0,
                description: p.size || p.name,
                badge: p.bestseller ? 'Bestseller' : (p.is_new ? 'New' : ''),
                rating: 4.5,
                is_active: true,
                stock_left
            };
        },

        _applyHostelStockOverlay(prod, cleanHostel, hostelInventory = {}) {
            if (!prod || !cleanHostel) return prod;
            const originHostel = (prod.hostel_id || 'BH-13').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const targetHostelNorm = cleanHostel.toUpperCase().replace(/[^A-Z0-9]/g, '');
            prod.hostel_id = cleanHostel;
            const override = hostelInventory[prod.id];
            if (override !== undefined) {
                if (override.deleted) {
                    prod.deleted = true;
                    prod.stock_left = 0;
                    prod.in_stock = false;
                } else {
                    prod.deleted = false;
                    prod.stock_left = Math.max(0, Number(override.stock_left) || 0);
                    prod.in_stock = Boolean(override.in_stock && prod.stock_left > 0);
                }
            } else if (originHostel !== targetHostelNorm && originHostel !== 'BH13' && originHostel !== 'ALL' && originHostel !== 'CAMPUS') {
                // Isolated custom product created specifically for a different hostel -> not in this hostel
                prod.deleted = true;
                prod.stock_left = 0;
                prod.in_stock = false;
            } else {
                // Campus baseline catalog product: starts at ZERO stock for this hostel until the hostel store manager adds/updates stock!
                prod.deleted = false;
                prod.stock_left = 0;
                prod.in_stock = false;
            }
            return prod;
        },

        async getAll({ includeInactive = false, category, subcategory, sort, hostel_id } = {}) {
            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : null;
            const cacheKey = `products:${cleanHostel || 'all'}:${category || 'all'}:${subcategory || 'all'}:${sort || 'default'}:${includeInactive}`;
            return await cache.wrap(cacheKey, async () => {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error('PostgreSQL client unavailable. Verify SUPABASE_URL and credentials.');

                let data = null;
                let fetchError = null;

                try {
                    let query = supabase.from('products').select('id, name, category, subcategory, price, mrp, cost_price, unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new, created_at');

                    if (category && category !== 'All') {
                        query = query.ilike('category', `%${category}%`);
                    }
                    if (subcategory && subcategory !== 'all') {
                        query = query.eq('subcategory', subcategory);
                    }
                    if (sort === 'price_asc') {
                        query = query.order('price', { ascending: true });
                    } else if (sort === 'price_desc') {
                        query = query.order('price', { ascending: false });
                    } else {
                        query = query.order('name', { ascending: true });
                    }

                    const res = await query;
                    if (!res.error) {
                        data = res.data;
                    } else {
                        fetchError = res.error;
                    }
                } catch (e) {
                    fetchError = e;
                }

                if (fetchError) {
                    throw new Error(`PostgreSQL query error: ${fetchError.message}`);
                }

                // If specific hostel requested, overlay that hostel's dark-store inventory
                let hostelInventory = {};
                if (cleanHostel && supabaseDb.inventory) {
                    try {
                        hostelInventory = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                    } catch (invErr) {
                        console.warn('[Hostel Inventory Load Note]:', invErr.message);
                    }
                }

                // Format every product and overlay hostel stock:
                const formatted = (data || []).map(p => {
                    const prod = this._formatProduct(p);
                    if (cleanHostel) {
                        return this._applyHostelStockOverlay(prod, cleanHostel, hostelInventory);
                    }
                    return prod;
                });

                return formatted;
            }, 300000); // 5-minute single-flight micro-cache (drastically reduces DB egress)
        },

        async getById(id, hostel_id = null) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw new Error(`PostgreSQL product fetch error: ${error.message}`);
            if (!data) return null;

            const prod = this._formatProduct(data);
            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : null;
            if (cleanHostel && supabaseDb.inventory) {
                try {
                    const inv = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                    return this._applyHostelStockOverlay(prod, cleanHostel, inv);
                } catch (e) {}
            }
            return prod;
        },

        async getByIds(ids, hostel_id = null) {
            if (!ids || ids.length === 0) return [];
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('id', ids);

            if (error) return [];
            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : null;
            let inv = {};
            if (cleanHostel && supabaseDb.inventory) {
                try {
                    inv = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                } catch (e) {}
            }

            return (data || []).map(p => {
                const prod = this._formatProduct(p);
                if (cleanHostel) {
                    return this._applyHostelStockOverlay(prod, cleanHostel, inv);
                }
                return prod;
            });
        },

        async getCategories() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data, error } = await supabase
                .from('products')
                .select('category');

            if (error || !data) return [];
            return Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        },

        async search(queryText, hostel_id = null) {
            if (!queryText) return [];
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const clean = queryText.trim();
            let query = supabase
                .from('products')
                .select('*')
                .or(`name.ilike.%${clean}%,category.ilike.%${clean}%,tags.ilike.%${clean}%`)
                .limit(50);

            const { data, error } = await query;
            if (error || !data) return [];

            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : null;
            let inv = {};
            if (cleanHostel && supabaseDb.inventory) {
                try {
                    inv = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                } catch (e) {}
            }

            return (data || []).map(p => {
                const prod = this._formatProduct(p);
                if (cleanHostel) {
                    return this._applyHostelStockOverlay(prod, cleanHostel, inv);
                }
                return prod;
            });
        },

        async getRandom(limit = 10, hostel_id = null) {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            let query = supabase
                .from('products')
                .select('*')
                .limit(50);

            const { data, error } = await query;
            if (error || !data) return [];

            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : null;
            let inv = {};
            if (cleanHostel && supabaseDb.inventory) {
                try {
                    inv = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                } catch (e) {}
            }

            let formatted = (data || []).map(p => {
                const prod = this._formatProduct(p);
                if (cleanHostel) {
                    return this._applyHostelStockOverlay(prod, cleanHostel, inv);
                }
                return prod;
            }).filter(p => p.in_stock && !p.deleted);

            const shuffled = [...formatted].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, limit);
        },

        async create(productData) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const id = productData.id || `prod_${uuidv4().slice(0, 8)}`;
            const stockNum = productData.stock_left !== undefined ? parseInt(productData.stock_left, 10) : 50;
            const inStock = stockNum > 0 && productData.in_stock !== false;
            const hostelId = productData.hostel_id || 'BH-13';

            const existingTags = (productData.tags || '')
                .split(',')
                .map(t => t.trim())
                .filter(t => t && !t.startsWith('stock:') && !t.startsWith('hostel:'));
            existingTags.push(`stock:${stockNum}`);
            existingTags.push(`hostel:${hostelId}`);
            const finalTags = existingTags.join(', ');

            const record = {
                id,
                hostel_id: hostelId,
                name: productData.name,
                category: productData.category || 'Snacks & Drinks',
                subcategory: productData.subcategory || '',
                price: Number(productData.price) || 0,
                mrp: Number(productData.mrp || productData.price) || 0,
                cost_price: Number(productData.cost_price !== undefined ? productData.cost_price : (productData.cost !== undefined ? productData.cost : 0)) || 0,
                unit: productData.unit || 'piece',
                size: productData.size || productData.description || '',
                image_url: productData.image_url || '',
                image_alt: productData.image_alt || productData.name || '',
                in_stock: inStock,
                bestseller: Boolean(productData.bestseller),
                is_new: Boolean(productData.is_new),
                tags: finalTags
            };

            let data = null;
            let error = null;

            try {
                const res = await supabase
                    .from('products')
                    .insert([record])
                    .select()
                    .single();
                data = res.data;
                error = res.error;
            } catch (e) {
                error = e;
            }

            // Fallback if hostel_id column is not yet in Supabase schema
            if (error && error.message && (error.message.includes('hostel_id') || error.code === '42703')) {
                const fallbackRecord = { ...record };
                delete fallbackRecord.hostel_id;
                const res2 = await supabase
                    .from('products')
                    .insert([fallbackRecord])
                    .select()
                    .single();
                if (res2.error) throw new Error(`PostgreSQL product insert error: ${res2.error.message}`);
                data = res2.data;
                error = null;
            } else if (error) {
                throw new Error(`PostgreSQL product insert error: ${error.message}`);
            }

            cache.invalidateProducts();
            return this._formatProduct(data);
        },

        async update(id, updates) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const updateFields = {};
            if (updates.hostel_id !== undefined) updateFields.hostel_id = updates.hostel_id;
            if (updates.name !== undefined) updateFields.name = updates.name;
            if (updates.category !== undefined) updateFields.category = updates.category;
            if (updates.subcategory !== undefined) updateFields.subcategory = updates.subcategory;
            if (updates.price !== undefined) updateFields.price = Number(updates.price);
            if (updates.mrp !== undefined) updateFields.mrp = Number(updates.mrp);
            if (updates.cost_price !== undefined || updates.cost !== undefined) {
                updateFields.cost_price = Number(updates.cost_price !== undefined ? updates.cost_price : updates.cost) || 0;
            }
            if (updates.unit !== undefined) updateFields.unit = updates.unit;
            if (updates.size !== undefined) updateFields.size = updates.size;
            if (updates.image_url !== undefined) updateFields.image_url = updates.image_url;
            if (updates.image_alt !== undefined) updateFields.image_alt = updates.image_alt;
            if (updates.in_stock !== undefined) updateFields.in_stock = Boolean(updates.in_stock);
            if (updates.bestseller !== undefined) updateFields.bestseller = Boolean(updates.bestseller);
            if (updates.is_new !== undefined) updateFields.is_new = Boolean(updates.is_new);
            if (updates.tags !== undefined) updateFields.tags = updates.tags;

            if (updates.stock_left !== undefined || updates.hostel_id !== undefined) {
                const existing = await this.getById(id);
                const stockNum = updates.stock_left !== undefined ? (parseInt(updates.stock_left, 10) || 0) : (existing?.stock_left || 0);
                const hId = updates.hostel_id || existing?.hostel_id || 'BH-13';

                const currentTags = ((updates.tags !== undefined ? updates.tags : existing?.tags) || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t && !t.startsWith('stock:') && !t.startsWith('hostel:'));
                currentTags.push(`stock:${stockNum}`);
                currentTags.push(`hostel:${hId}`);
                updateFields.tags = currentTags.join(', ');
                if (updates.stock_left !== undefined) {
                    updateFields.in_stock = stockNum > 0;
                }
            }

            if (Object.keys(updateFields).length === 0) {
                return await this.getById(id);
            }

            let data = null;
            let error = null;

            try {
                const res = await supabase
                    .from('products')
                    .update(updateFields)
                    .eq('id', id)
                    .select()
                    .single();
                data = res.data;
                error = res.error;
            } catch (e) {
                error = e;
            }

            if (error && error.message && (error.message.includes('hostel_id') || error.code === '42703')) {
                const fallbackUpdates = { ...updateFields };
                delete fallbackUpdates.hostel_id;
                const res2 = await supabase
                    .from('products')
                    .update(fallbackUpdates)
                    .eq('id', id)
                    .select()
                    .single();
                if (res2.error) throw new Error(`PostgreSQL product update error: ${res2.error.message}`);
                data = res2.data;
                error = null;
            } else if (error) {
                throw new Error(`PostgreSQL product update error: ${error.message}`);
            }

            cache.invalidateProducts();
            return this._formatProduct(data);
        },

        async adjustStock(id, delta, hostel_id = null) {
            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : 'BH-13';
            if (cleanHostel !== 'BH-13' && supabaseDb.inventory) {
                const current = await this.getById(id, cleanHostel);
                if (!current) throw new Error('Product not found');
                const newStock = Math.max(0, (current.stock_left || 0) + delta);
                return await supabaseDb.inventory.setProductStock(cleanHostel, id, { stock_left: newStock, in_stock: newStock > 0 });
            }

            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const product = await this.getById(id, 'BH-13');
            if (!product) throw new Error('Product not found');

            const newStock = Math.max(0, (product.stock_left || 0) + delta);
            const updated = await this.update(id, { stock_left: newStock });
            if (supabaseDb.inventory) {
                await supabaseDb.inventory.setProductStock('BH-13', id, { stock_left: newStock, in_stock: newStock > 0 }).catch(() => {});
            }
            return updated;
        },

        async toggleStock(id, hostel_id = null) {
            const cleanHostel = (hostel_id && hostel_id !== 'all' && hostel_id !== 'ALL') ? String(hostel_id).trim().toUpperCase() : 'BH-13';
            if (cleanHostel !== 'BH-13' && supabaseDb.inventory) {
                const current = await this.getById(id, cleanHostel);
                if (!current) throw new Error('Product not found');
                const newInStock = !current.in_stock;
                const newStock = newInStock ? 50 : 0;
                return await supabaseDb.inventory.setProductStock(cleanHostel, id, { in_stock: newInStock, stock_left: newStock });
            }

            const product = await this.getById(id, 'BH-13');
            if (!product) throw new Error('Product not found');
            const newInStock = !product.in_stock;
            const newStock = newInStock ? 50 : 0;
            const updated = await this.update(id, { in_stock: newInStock, stock_left: newStock });
            if (supabaseDb.inventory) {
                await supabaseDb.inventory.setProductStock('BH-13', id, { in_stock: newInStock, stock_left: newStock }).catch(() => {});
            }
            return updated;
        },

        async deactivate(id) {
            return await this.update(id, { in_stock: false, stock_left: 0 });
        },

        async delete(id) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw new Error(`PostgreSQL product delete error: ${error.message}`);
            cache.invalidateProducts();
            return { success: true };
        }
    },

    // ==========================================
    // MULTI-HOSTEL DARK STORE INVENTORY
    // ==========================================
    inventory: {
        _memoryHostelInventory: new Map(),
        _localFilePath: path.join(__dirname, '..', 'data', 'hostel_inventory.json'),

        _normalizeHostelId(hostelId) {
            if (!hostelId || hostelId === 'all' || hostelId === 'ALL') return 'BH-13';
            let str = String(hostelId).trim().toUpperCase();
            const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i) || str.match(/(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
            if (match) {
                return `${match[1].toUpperCase()}-${match[2]}`;
            }
            return str.replace(/[^A-Z0-9]/g, '');
        },

        _getStorageKey(hostelId) {
            const clean = this._normalizeHostelId(hostelId);
            return `inventory_${clean.replace(/[^A-Z0-9]/g, '_')}`;
        },

        _loadLocalFile() {
            try {
                if (fs.existsSync(this._localFilePath)) {
                    return JSON.parse(fs.readFileSync(this._localFilePath, 'utf8'));
                }
            } catch (e) {
                console.warn('[Hostel Inventory Local Read Warning]:', e.message);
            }
            return {};
        },

        _saveLocalFile(data) {
            try {
                fs.writeFileSync(this._localFilePath, JSON.stringify(data, null, 2), 'utf8');
            } catch (e) {
                // Read-only filesystem on serverless environments
            }
        },

        async getHostelInventory(hostelId) {
            const normHostel = this._normalizeHostelId(hostelId);
            const key = this._getStorageKey(normHostel);

            return await cache.wrap(`inventory:hostel:${normHostel}`, async () => {
                // 1. Check memory cache first
                if (this._memoryHostelInventory.has(normHostel)) {
                    return this._memoryHostelInventory.get(normHostel);
                }

                // 2. Fetch from Supabase app_availability table
                const supabase = getSupabaseClient();
                if (supabase) {
                    try {
                        const { data, error } = await supabase
                            .from('app_availability')
                            .select('id, message')
                            .eq('id', key)
                            .maybeSingle();

                        if (!error && data && data.message) {
                            try {
                                const parsed = JSON.parse(data.message);
                                if (parsed && typeof parsed === 'object') {
                                    this._memoryHostelInventory.set(normHostel, parsed);
                                    return parsed;
                                }
                            } catch (parseErr) {}
                        }
                    } catch (dbErr) {
                        console.warn('[Hostel Inventory DB Fetch Note]:', dbErr.message);
                    }
                }

                // 3. Fallback to local file (with backward compatibility for un-hyphenated keys)
                const fileData = this._loadLocalFile();
                const hostelData = fileData[normHostel]
                    || fileData[normHostel.replace('-', ' ')]
                    || fileData[normHostel.replace('-', '')]
                    || {};
                this._memoryHostelInventory.set(normHostel, hostelData);
                return hostelData;
            }, 60000); // 1-minute TTL, invalidated immediately on write
        },

        async setProductStock(hostelId, productId, { stock_left, in_stock, deleted }) {
            const normHostel = this._normalizeHostelId(hostelId);
            const key = this._getStorageKey(normHostel);

            const inv = await this.getHostelInventory(normHostel);
            const isDeleted = Boolean(deleted);
            const finalStock = isDeleted ? 0 : Math.max(0, parseInt(stock_left !== undefined ? stock_left : (in_stock ? 10 : 0), 10));
            const finalInStock = isDeleted ? false : (in_stock !== undefined ? Boolean(in_stock) : finalStock > 0);

            inv[productId] = {
                stock_left: finalStock,
                in_stock: finalInStock,
                deleted: isDeleted,
                updated_at: new Date().toISOString()
            };

            this._memoryHostelInventory.set(normHostel, inv);

            // Persist to local file
            const fileData = this._loadLocalFile();
            fileData[normHostel] = inv;
            this._saveLocalFile(fileData);

            // Persist to Supabase app_availability
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase
                        .from('app_availability')
                        .upsert([{
                            id: key,
                            is_locked: false,
                            lock_type: 'NONE',
                            message: JSON.stringify(inv),
                            updated_at: new Date().toISOString()
                        }]);
                } catch (dbErr) {
                    console.warn('[Hostel Inventory DB Save Warning]:', dbErr.message);
                }
            }

            // Invalidate caches
            cache.delete(`inventory:hostel:${normHostel}`);
            cache.invalidateProducts();
            cache.clearByPrefix('home:base:');

            return {
                productId,
                stock_left: finalStock,
                in_stock: finalInStock,
                deleted: isDeleted,
                hostel_id: normHostel
            };
        },

        async batchUpdateStock(hostelId, updates = []) {
            if (!Array.isArray(updates) || updates.length === 0) return;
            const normHostel = this._normalizeHostelId(hostelId);
            const key = this._getStorageKey(normHostel);

            const inv = await this.getHostelInventory(normHostel);
            for (const u of updates) {
                if (u.productId) {
                    const finalStock = Math.max(0, parseInt(u.newStock, 10));
                    inv[u.productId] = {
                        stock_left: finalStock,
                        in_stock: u.newInStock !== undefined ? Boolean(u.newInStock) : finalStock > 0,
                        updated_at: new Date().toISOString()
                    };
                }
            }

            this._memoryHostelInventory.set(normHostel, inv);

            // Persist to local file
            const fileData = this._loadLocalFile();
            fileData[normHostel] = inv;
            this._saveLocalFile(fileData);

            // Persist to Supabase app_availability
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase
                        .from('app_availability')
                        .upsert([{
                            id: key,
                            is_locked: false,
                            lock_type: 'NONE',
                            message: JSON.stringify(inv),
                            updated_at: new Date().toISOString()
                        }]);
                } catch (dbErr) {
                    console.warn('[Hostel Inventory Batch Save Warning]:', dbErr.message);
                }
            }

            cache.delete(`inventory:hostel:${normHostel}`);
            cache.invalidateProducts();
            cache.clearByPrefix('home:base:');
        }
    },

    // ==========================================
    // CART
    // ==========================================
    cart: {
        async getCart(userId) {
            const supabase = getSupabaseClient();
            if (!supabase || !userId) return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0, total_savings: 0, deliveryFee: 0, platformFee: 0 } };

            const { data, error } = await supabase
                .from('cart_items')
                .select('id, user_id, product_id, quantity, products(*)')
                .eq('user_id', userId);

            if (error || !data) return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0, total_savings: 0, deliveryFee: 0, platformFee: 0 } };

            // 🛡️ Proactively deduplicate items by product_id to heal legacy duplicate rows
            const itemMap = new Map();
            const duplicateIdsToDelete = [];

            for (const item of data) {
                if (!item.product_id) continue;
                if (!itemMap.has(item.product_id)) {
                    itemMap.set(item.product_id, { ...item });
                } else {
                    const primary = itemMap.get(item.product_id);
                    primary.quantity = (Number(primary.quantity) || 1) + (Number(item.quantity) || 1);
                    if (item.id) duplicateIdsToDelete.push(item.id);
                }
            }

            // Asynchronously delete duplicate rows so PostgreSQL database stays perfectly clean
            if (duplicateIdsToDelete.length > 0) {
                supabase.from('cart_items').delete().in('id', duplicateIdsToDelete).then(() => {}).catch(err => {
                    console.warn('[Cart Deduplication Cleanup]:', err.message);
                });
            }

            const rawItems = Array.from(itemMap.values());

            const items = rawItems.map(item => {
                const prod = item.products || {};
                const match = (prod.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (prod.in_stock !== false ? 50 : 0);
                const clampedQty = Math.max(1, Math.min(Number(item.quantity) || 1, stock_left > 0 ? stock_left : 50));
                return {
                    id: item.id,
                    cart_id: item.id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    quantity: clampedQty,
                    name: prod.name || 'Campus Item',
                    price: Number(prod.price) || 0,
                    mrp: Number(prod.mrp) || Number(prod.price) || 0,
                    image_url: prod.image_url || '',
                    in_stock: prod.in_stock !== false,
                    stock_left,
                    unit: prod.unit || '',
                    size: prod.size || '',
                    category: prod.category || ''
                };
            });

            const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
            const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const mrpDiscount = Math.max(0, totalMrp - subtotal);
            const hasDiscount = subtotal >= 350;
            const discount5 = hasDiscount ? Math.round(subtotal * 0.05) : 0;
            const delivery_fee = 0;
            const platform_fee = items.length > 0 ? 3 : 0; // ₹3 standard handling fee
            const tax = 0;
            const total = Math.max(0, subtotal - discount5 + platform_fee + delivery_fee + tax);
            const deliverySavings = subtotal > 0 ? 25 : 0;
            const total_savings = mrpDiscount + discount5 + deliverySavings;
            const min_order_value = 35;
            const is_min_order_met = subtotal >= min_order_value;
            const min_order_shortfall = Math.max(0, min_order_value - subtotal);

            return {
                items,
                item_count: totalQuantity,
                total_items: totalQuantity,
                pricing: {
                    subtotal,
                    total_mrp: totalMrp,
                    mrp_discount: mrpDiscount,
                    discount5,
                    bulk_discount: discount5,
                    delivery_fee,
                    platform_fee,
                    tax,
                    total,
                    total_savings,
                    deliveryFee: delivery_fee,
                    platformFee: platform_fee,
                    min_order_value,
                    is_min_order_met,
                    min_order_shortfall,
                    item_count: totalQuantity,
                    total_items: totalQuantity
                }
            };
        },

        // 🛡️ Atomic Idempotent Quantity Setter (Eliminates all duplication & re-add glitches)
        async setQuantity(userId, productId, quantity) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');
            if (!userId || !productId) throw new Error('userId and productId are required');

            const targetQty = Number(quantity);

            // Fetch ALL existing rows for this user and product
            const { data: existingRows } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('product_id', productId);

            const rows = existingRows || [];

            if (targetQty <= 0) {
                // Permanently remove all matching rows for this product
                if (rows.length > 0) {
                    const idsToDelete = rows.map(r => r.id);
                    await supabase.from('cart_items').delete().in('id', idsToDelete);
                } else {
                    await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId);
                }
            } else {
                if (rows.length > 0) {
                    // Update primary row to exact targetQty
                    const primary = rows[0];
                    await supabase.from('cart_items').update({ quantity: targetQty }).eq('id', primary.id);
                    // Remove any redundant duplicate rows
                    if (rows.length > 1) {
                        const duplicateIds = rows.slice(1).map(r => r.id);
                        await supabase.from('cart_items').delete().in('id', duplicateIds);
                    }
                } else {
                    // Insert single canonical row
                    const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    await supabase.from('cart_items').insert([{
                        id,
                        user_id: userId,
                        product_id: productId,
                        quantity: targetQty
                    }]);
                }
            }

            return await this.getCart(userId);
        },

        async addItem(userId, productId, quantity = 1) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');
            if (!userId || !productId) throw new Error('userId and productId are required');

            const reqQty = Number(quantity) || 1;

            const { data: rows } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('product_id', productId);

            if (rows && rows.length > 0) {
                const currentTotal = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
                const nextQty = currentTotal + reqQty;
                return await this.setQuantity(userId, productId, nextQty);
            } else {
                return await this.setQuantity(userId, productId, reqQty);
            }
        },

        async updateItem(cartId, quantity, userId) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');
            if (!cartId) throw new Error('cartId is required');

            const targetQty = Number(quantity);

            const { data: item } = await supabase
                .from('cart_items')
                .select('user_id, product_id')
                .eq('id', cartId)
                .maybeSingle();

            const effectiveUserId = (userId && userId !== 'guest_cart') ? userId : item?.user_id;
            const productId = item?.product_id;

            if (effectiveUserId && productId) {
                return await this.setQuantity(effectiveUserId, productId, targetQty);
            }

            if (targetQty <= 0) {
                await supabase.from('cart_items').delete().eq('id', cartId);
            } else {
                await supabase.from('cart_items').update({ quantity: targetQty }).eq('id', cartId);
            }

            if (effectiveUserId && effectiveUserId !== 'guest_cart') {
                return await this.getCart(effectiveUserId);
            }
            return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };
        },

        async updateQuantity(cartId, quantity, userId) {
            return await this.updateItem(cartId, quantity, userId);
        },

        async removeItem(cartId, userId) {
            return await this.updateItem(cartId, 0, userId);
        },

        async removeProduct(userId, productId) {
            return await this.setQuantity(userId, productId, 0);
        },

        async clearCart(userId) {
            const supabase = getSupabaseClient();
            if (!supabase || !userId) return;
            await supabase.from('cart_items').delete().eq('user_id', userId);
        },

        async mergeCart(guestUserId, targetUserId) {
            return await this.mergeGuestCart(guestUserId, targetUserId);
        },

        async mergeGuestCart(guestUserId, targetUserId) {
            if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
                return await this.getCart(targetUserId || guestUserId);
            }
            const supabase = getSupabaseClient();
            if (!supabase) return { items: [], pricing: { subtotal: 0, delivery_fee: 0, platform_fee: 0, tax: 0, total: 0 } };

            const { data: guestItems } = await supabase
                .from('cart_items')
                .select('product_id, quantity')
                .eq('user_id', guestUserId);

            if (guestItems && guestItems.length > 0) {
                // Group guest items by product_id first to prevent multiple inserts
                const guestMap = new Map();
                for (const item of guestItems) {
                    if (!item.product_id) continue;
                    guestMap.set(item.product_id, (guestMap.get(item.product_id) || 0) + (Number(item.quantity) || 1));
                }

                for (const [productId, guestQty] of guestMap.entries()) {
                    await this.addItem(targetUserId, productId, guestQty);
                }
                await this.clearCart(guestUserId);
            }

            return await this.getCart(targetUserId);
        }
    },

    // ==========================================
    // ORDERS
    // ==========================================
    orders: {
        _normalizeHostelId(hostelId) {
            if (!hostelId || hostelId === 'all' || hostelId === 'ALL') return null;
            const str = String(hostelId).trim().toUpperCase();
            const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i) || str.match(/(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
            if (match) {
                return `${match[1].toUpperCase()}-${match[2]}`;
            }
            return str.replace(/[^A-Z0-9]/g, '');
        },

        _extractHostelId(order) {
            if (!order) return 'BH-13';
            if (order.hostel_id && order.hostel_id !== 'all') {
                const norm = this._normalizeHostelId(order.hostel_id);
                if (norm) return norm;
            }
            const addr = order.delivery_address || '';
            const match = addr.match(/\[(BH|GH)[-\s]?(\d+)\]/i) || addr.match(/(BH|GH)[-\s]?(\d+)/i);
            if (match) {
                return `${match[1].toUpperCase()}-${match[2]}`;
            }
            return 'BH-13';
        },

        _matchHostel(h1, h2) {
            if (!h1 || !h2) return false;
            const n1 = String(h1).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const n2 = String(h2).toUpperCase().replace(/[^A-Z0-9]/g, '');
            return n1 === n2;
        },

        async createOrder(orderPayload, items) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            if (!items || items.length === 0) {
                throw new Error('Cart is empty. Please add items before checking out.');
            }

            // 1. Authoritatively verify products & stock from PostgreSQL
            const productIds = items.map(i => i.product_id).filter(Boolean);
            const { data: dbProducts, error: prodFetchErr } = await supabase
                .from('products')
                .select('id, name, price, cost_price, mrp, tags, in_stock')
                .in('id', productIds);

            if (prodFetchErr) throw new Error(`Failed to verify products: ${prodFetchErr.message}`);
            const prodMap = new Map((dbProducts || []).map(p => [p.id, p]));

            const rawHostel = orderPayload.hostel_id || orderPayload.delivery_address || 'BH-13';
            const cleanHostel = this._normalizeHostelId(rawHostel) || 'BH-13';

            let hostelInv = {};
            if (cleanHostel && supabaseDb.inventory) {
                try {
                    hostelInv = await supabaseDb.inventory.getHostelInventory(cleanHostel);
                } catch (e) {}
            }

            const stockUpdates = [];
            for (const item of items) {
                const p = prodMap.get(item.product_id);
                if (!p) {
                    throw new Error(`Product "${item.name || item.product_id}" is no longer available in the campus store.`);
                }

                // Check hostel-isolated stock: ALL STOCK DEFAULTS TO 0 UNLESS OVERRIDDEN BY STORE MANAGER
                let currentStock = 0;
                let currentInStock = false;
                const override = hostelInv[p.id];
                if (override !== undefined && !override.deleted) {
                    currentStock = Math.max(0, Number(override.stock_left) || 0);
                    currentInStock = Boolean(override.in_stock && currentStock > 0);
                }

                const reqQty = Math.max(1, Number(item.quantity) || 1);

                if (!currentInStock || currentStock <= 0) {
                    throw new Error(`"${p.name}" is currently out of stock in ${cleanHostel}.`);
                }
                if (reqQty > currentStock) {
                    throw new Error(`Only ${currentStock} unit(s) of "${p.name}" available in ${cleanHostel}. Please adjust quantity.`);
                }

                const newStock = Math.max(0, currentStock - reqQty);
                const newInStock = newStock > 0;
                const currentTags = (p.tags || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t && !t.startsWith('stock:'));
                currentTags.push(`stock:${newStock}`);
                const updatedTags = currentTags.join(', ');

                stockUpdates.push({
                    productId: p.id,
                    name: p.name,
                    previousStock: currentStock,
                    originalTags: p.tags || '',
                    newStock,
                    newInStock,
                    updatedTags,
                    costPrice: Number(p.cost_price) || 0,
                    sellingPrice: Number(p.price) || 0,
                    mrp: Number(p.mrp || p.price) || 0,
                    quantity: reqQty,
                    hostel_id: cleanHostel
                });
            }
            const orderId = orderPayload.id || `order_${uuidv4().slice(0, 8)}`;
            let orderAddr = (orderPayload.delivery_address || `${cleanHostel} (Block A), Room 304`).trim();
            if (!orderAddr.toUpperCase().startsWith(`[${cleanHostel}]`)) {
                orderAddr = `[${cleanHostel}] ${orderAddr.replace(/^\[(BH|GH)[-\s]?\d+\]\s*/i, '')}`;
            }

            const coreOrderPayload = {
                id: orderId,
                hostel_id: cleanHostel,
                user_id: orderPayload.user_id,
                customer_name: orderPayload.customer_name || 'Student',
                customer_phone: orderPayload.customer_phone || '',
                customer_email: orderPayload.customer_email || '',
                status: orderPayload.status || 'Order Placed',
                subtotal: Number(orderPayload.subtotal) || 0,
                delivery_fee: Number(orderPayload.delivery_fee) || 0,
                platform_fee: Number(orderPayload.platform_fee) || 0,
                tax: Number(orderPayload.tax) || 0,
                total: Number(orderPayload.total) || 0,
                payment_method: orderPayload.payment_method || 'Cash on Delivery',
                payment_status: orderPayload.payment_status || 'pending',
                rider_name: orderPayload.rider_name || 'Alex',
                rider_lat: orderPayload.rider_lat || 31.2560,
                rider_lng: orderPayload.rider_lng || 75.7030,
                delivery_address: orderAddr
            };

            // 2. Insert core order record with automatic fallback if hostel_id column not yet present
            let orderData = null;
            let orderErr = null;
            try {
                const res = await supabase
                    .from('orders')
                    .insert([coreOrderPayload])
                    .select()
                    .single();
                orderData = res.data;
                orderErr = res.error;
            } catch (e) {
                orderErr = e;
            }

            if (orderErr && orderErr.message && (orderErr.message.includes('hostel_id') || orderErr.code === '42703')) {
                const fallbackPayload = { ...coreOrderPayload };
                delete fallbackPayload.hostel_id;
                const res2 = await supabase
                    .from('orders')
                    .insert([fallbackPayload])
                    .select()
                    .single();
                if (res2.error) {
                    if (res2.error.code === '23505') {
                        const existing = await this.getOrderById(orderId);
                        if (existing) return existing;
                    }
                    throw new Error(`PostgreSQL order creation failed: ${res2.error.message}`);
                }
                orderData = res2.data;
                orderErr = null;
            } else if (orderErr) {
                if (orderErr.code === '23505') {
                    const existing = await this.getOrderById(orderId);
                    if (existing) return existing;
                }
                throw new Error(`PostgreSQL order creation failed: ${orderErr.message}`);
            }

            // 3. Insert line items
            const formattedItems = items.map(item => {
                const matched = stockUpdates.find(s => s.productId === item.product_id);
                return {
                    id: `oi_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
                    order_id: orderId,
                    product_id: item.product_id || null,
                    quantity: matched ? matched.quantity : (Number(item.quantity) || 1),
                    unit_price: matched ? matched.sellingPrice : (Number(item.price || item.unit_price) || 0)
                };
            });

            if (formattedItems.length > 0) {
                const { error: itemsErr } = await supabase
                    .from('order_items')
                    .insert(formattedItems);

                if (itemsErr) {
                    // Rollback order
                    await supabase.from('orders').delete().eq('id', orderId);
                    throw new Error(`PostgreSQL order items creation failed: ${itemsErr.message}`);
                }
            }

            // 4. Atomically decrement stock according to hostel dark-store inventory
            const appliedStockUpdates = [];
            try {
                if (supabaseDb.inventory) {
                    await supabaseDb.inventory.batchUpdateStock(cleanHostel, stockUpdates);
                    appliedStockUpdates.push(...stockUpdates);
                }
            } catch (stockUpdateErr) {
                // Rollback order items & order
                await supabase.from('order_items').delete().eq('order_id', orderId);
                await supabase.from('orders').delete().eq('id', orderId);

                // Rollback any partially applied stock decrements
                for (const revert of appliedStockUpdates) {
                    if (supabaseDb.inventory) {
                        await supabaseDb.inventory.setProductStock(cleanHostel, revert.productId, {
                            stock_left: revert.previousStock,
                            in_stock: revert.previousStock > 0
                        }).catch(() => {});
                    }
                }

                throw new Error(stockUpdateErr.message);
            }

            // 3b. Record immutable financial pricing snapshot for future orders
            const itemSnapshots = items.map(item => {
                const matched = stockUpdates.find(s => s.productId === item.product_id);
                return {
                    product_id: item.product_id,
                    product_name: matched ? matched.name : (item.name || 'Campus Item'),
                    quantity: matched ? matched.quantity : (Number(item.quantity) || 1),
                    admin_cost: matched ? matched.costPrice : (Number(item.cost_price) || 0),
                    mrp: matched ? matched.mrp : (Number(item.mrp) || 0),
                    selling_price: matched ? matched.sellingPrice : (Number(item.price || item.unit_price) || 0)
                };
            });

            try {
                this.saveOrderSnapshot(orderId, itemSnapshots);
            } catch (snapErr) {
                console.warn('[Order Snapshot Save Warning]:', snapErr.message);
            }

            cache.invalidateOrders();
            cache.invalidateProducts();

            return {
                ...orderData,
                hostel_id: cleanHostel,
                delivery_address: orderAddr,
                items: formattedItems.map(it => ({ ...it, price: it.unit_price })),
                stockUpdates
            };
        },

        saveOrderSnapshot(orderId, itemSnapshots) {
            try {
                const snapshotsPath = path.join(__dirname, '..', 'data', 'order_snapshots.json');
                let existingSnapshots = {};
                if (fs.existsSync(snapshotsPath)) {
                    try {
                        existingSnapshots = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
                    } catch (e) {
                        existingSnapshots = {};
                    }
                }
                existingSnapshots[orderId] = {
                    order_id: orderId,
                    created_at: new Date().toISOString(),
                    items: itemSnapshots
                };
                const dir = path.dirname(snapshotsPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(snapshotsPath, JSON.stringify(existingSnapshots, null, 2), 'utf8');

                // Mirror into audit_logs asynchronously
                const supabase = getSupabaseClient();
                if (supabase) {
                    supabase.from('audit_logs').insert([{
                        id: `audit_snap_${uuidv4().slice(0, 8)}`,
                        admin_id: 'system',
                        action: 'ORDER_FINANCIAL_SNAPSHOT',
                        reason: orderId,
                        metadata: { items: itemSnapshots },
                        created_at: new Date().toISOString()
                    }]).then(() => {}).catch(() => {});
                }
            } catch (err) {
                console.warn('[Save Snapshot Error]:', err.message);
            }
        },

        getOrderSnapshot(orderId) {
            try {
                const snapshotsPath = path.join(__dirname, '..', 'data', 'order_snapshots.json');
                if (fs.existsSync(snapshotsPath)) {
                    const data = JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
                    return data[orderId]?.items || null;
                }
            } catch (e) {}
            return null;
        },

        getAllOrderSnapshots() {
            try {
                const snapshotsPath = path.join(__dirname, '..', 'data', 'order_snapshots.json');
                if (fs.existsSync(snapshotsPath)) {
                    return JSON.parse(fs.readFileSync(snapshotsPath, 'utf8'));
                }
            } catch (e) {}
            return {};
        },

        async getOrderById(orderId) {
            const supabase = getSupabaseClient();
            if (!supabase) return null;

            const { data: order, error: orderErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .maybeSingle();

            if (orderErr || !order) return null;

            const { data: items } = await supabase
                .from('order_items')
                .select('*, products(*)')
                .eq('order_id', orderId);

            const deliveryMeta = this.parseDeliveryMeta(order.rider_name);
            const humanRiderName = this.formatRiderDisplayName(order.rider_name, 'Alex');

            const hId = this._extractHostelId(order);
            return {
                ...order,
                hostel_id: hId,
                rider_name: humanRiderName,
                delivery_assignment: deliveryMeta,
                items: (items || []).map(it => ({
                    id: it.id,
                    order_id: it.order_id,
                    product_id: it.product_id,
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.unit_price || it.products?.price || 0),
                    unit_price: Number(it.unit_price || it.products?.price || 0),
                    name: it.products?.name || it.name || 'Campus Item',
                    image_url: it.products?.image_url || it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
                    products: it.products || null
                }))
            };
        },

        async getOrdersByUser(userId) {
            const supabase = getSupabaseClient();
            if (!supabase) return { active: [], past: [] };

            const { data: orders, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error || !orders) return { active: [], past: [] };

            const active = [];
            const past = [];

            for (const o of orders) {
                const deliveryMeta = this.parseDeliveryMeta(o.rider_name);
                const humanRiderName = this.formatRiderDisplayName(o.rider_name, 'Alex');

                const formattedItems = (o.order_items || []).map(it => ({
                    id: it.id,
                    order_id: it.order_id,
                    product_id: it.product_id,
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.unit_price || it.products?.price || 0),
                    unit_price: Number(it.unit_price || it.products?.price || 0),
                    name: it.products?.name || it.name || 'Campus Item',
                    image_url: it.products?.image_url || it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
                    products: it.products || null
                }));
                const itemNames = formattedItems.map(it => `${it.name} (x${it.quantity})`).join(', ');
                const hId = this._extractHostelId(o);
                const full = {
                    ...o,
                    hostel_id: hId,
                    rider_name: humanRiderName,
                    delivery_assignment: deliveryMeta,
                    items: formattedItems,
                    item_names: itemNames || o.item_names || 'Campus Groceries & Essentials'
                };
                if (['Delivered', 'Cancelled'].includes(o.status)) {
                    past.push(full);
                } else {
                    active.push(full);
                }
            }

            return { active, past };
        },

        async getCustomerOrderHistory(customerId) {
            const supabase = getSupabaseClient();
            if (!supabase || !customerId) return [];

            // 1. Fetch user record if exists to get associated email and phone
            const { data: userRecord } = await supabase
                .from('users')
                .select('id, email, phone')
                .eq('id', customerId)
                .maybeSingle();

            let query = supabase
                .from('orders')
                .select('*, order_items(*, products(*))');

            if (userRecord && (userRecord.email || userRecord.phone)) {
                const filters = [`user_id.eq.${customerId}`];
                if (userRecord.email && userRecord.email.length > 3) {
                    filters.push(`customer_email.eq.${userRecord.email}`);
                }
                if (userRecord.phone && userRecord.phone.length >= 10) {
                    filters.push(`customer_phone.eq.${userRecord.phone}`);
                }
                query = query.or(filters.join(','));
            } else {
                query = query.or(`user_id.eq.${customerId},customer_email.eq.${customerId},customer_phone.eq.${customerId}`);
            }

            const { data: orders, error } = await query.order('created_at', { ascending: false });

            if (error || !orders) return [];

            return orders.map(o => {
                const deliveryMeta = this.parseDeliveryMeta(o.rider_name);
                const humanRiderName = this.formatRiderDisplayName(o.rider_name, 'Alex');

                const formattedItems = (o.order_items || []).map(it => ({
                    id: it.id,
                    order_id: it.order_id,
                    product_id: it.product_id,
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.unit_price || it.products?.price || 0),
                    unit_price: Number(it.unit_price || it.products?.price || 0),
                    name: it.products?.name || it.name || 'Campus Item',
                    image_url: it.products?.image_url || it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'
                }));
                const itemSummary = formattedItems.map(it => `${it.name} (x${it.quantity})`).join(', ');
                return {
                    ...o,
                    rider_name: humanRiderName,
                    delivery_assignment: deliveryMeta,
                    items: formattedItems,
                    items_summary: itemSummary,
                    item_count: formattedItems.reduce((acc, i) => acc + i.quantity, 0),
                    item_names: itemSummary || 'Campus Groceries & Essentials'
                };
            });
        },

        async getAllOrders(filters = {}) {
            const hostelId = typeof filters === 'string' ? filters : (filters?.hostel_id || null);
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            let query = supabase.from('orders').select('*, order_items(*, products(*))');
            if (hostelId && hostelId !== 'all') {
                try {
                    query = query.eq('hostel_id', hostelId);
                } catch (e) {}
            }
            query = query.order('created_at', { ascending: false });

            let { data: orders, error } = await query;
            if (error) {
                // If column hostel_id does not exist, query without it and filter
                const { data: allOrders, error: fallbackErr } = await supabase.from('orders').select('*, order_items(*, products(*))').order('created_at', { ascending: false });
                if (fallbackErr || !allOrders) return [];
                orders = allOrders;
            }

            if (!orders) return [];

            let formatted = orders.map(o => {
                const deliveryMeta = this.parseDeliveryMeta(o.rider_name);
                const humanRiderName = this.formatRiderDisplayName(o.rider_name, 'Unassigned');
                const hId = this._extractHostelId(o);

                const formattedItems = (o.order_items || []).map(it => ({
                    id: it.id,
                    order_id: it.order_id,
                    product_id: it.product_id,
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.unit_price || it.products?.price || 0),
                    unit_price: Number(it.unit_price || it.products?.price || 0),
                    name: it.products?.name || it.name || 'Campus Item',
                    image_url: it.products?.image_url || it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60',
                    products: it.products || null
                }));
                const itemNames = formattedItems.map(it => `${it.name} (x${it.quantity})`).join(', ');
                return {
                    ...o,
                    hostel_id: hId,
                    rider_name: humanRiderName,
                    delivery_assignment: deliveryMeta,
                    items: formattedItems,
                    item_names: itemNames || o.item_names || 'Campus Groceries & Essentials'
                };
            });

            if (hostelId && hostelId !== 'all') {
                const normTarget = this._normalizeHostelId(hostelId);
                formatted = formatted.filter(o => this._matchHostel(o.hostel_id, normTarget));
            }

            return formatted;
        },

        async updateStatus(orderId, status, options = {}) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            // 1. Check previous status to prevent duplicate restocking
            const { data: prevOrder } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .maybeSingle();

            const wasNotCancelled = prevOrder && prevOrder.status !== 'Cancelled';

            const updatePayload = { status };
            if (options.payment_method) updatePayload.payment_method = options.payment_method;
            if (options.payment_status) updatePayload.payment_status = options.payment_status;

            const { data, error } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', orderId)
                .select()
                .maybeSingle();

            if (error) throw new Error(`PostgreSQL order status update failed: ${error.message}`);
            cache.invalidateOrders();

            // 2. Automatically restock inventory if order is transitioned to 'Cancelled'
            if (status === 'Cancelled' && wasNotCancelled) {
                try {
                    await this.restockOrderItems(orderId);
                } catch (restockErr) {
                    console.warn(`[Order Restock Warning] Failed to restock items for order #${orderId}:`, restockErr.message);
                }
            }

            return data;
        },

        async restockOrderItems(orderId) {
            const supabase = getSupabaseClient();
            if (!supabase || !orderId) return;

            const [orderRes, itemsRes] = await Promise.all([
                supabase.from('orders').select('hostel_id').eq('id', orderId).maybeSingle(),
                supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId)
            ]);

            const targetHostel = orderRes.data?.hostel_id || 'BH-13';
            const items = itemsRes.data || [];
            if (items.length === 0) return;

            let broadcastInventoryUpdate;
            try {
                const rt = require('../realtime');
                broadcastInventoryUpdate = rt.broadcastInventoryUpdate;
            } catch (e) {}

            for (const item of items) {
                if (item.product_id && Number(item.quantity) > 0) {
                    try {
                        const updated = await supabaseDb.products.adjustStock(item.product_id, Number(item.quantity), targetHostel);
                        if (typeof broadcastInventoryUpdate === 'function') {
                            broadcastInventoryUpdate(item.product_id, updated.stock_left, updated.in_stock, targetHostel);
                        }
                        console.log(`[Order Restock] Restocked +${item.quantity} units for product ${item.product_id} in ${targetHostel} (New stock: ${updated.stock_left})`);
                    } catch (pErr) {
                        console.warn(`[Order Restock Error] Product ${item.product_id}:`, pErr.message);
                    }
                }
            }
            cache.invalidateProducts();
        },

        formatRiderDisplayName(riderName, fallback = 'Alex') {
            if (!riderName || riderName === 'unassigned') return fallback;
            if (typeof riderName === 'string' && riderName.trim().startsWith('{')) {
                try {
                    const meta = JSON.parse(riderName);
                    return meta.name || meta.assigned_to_name || fallback;
                } catch (e) {
                    return fallback;
                }
            }
            return riderName;
        },

        parseDeliveryMeta(riderName) {
            if (!riderName) {
                return {
                    assigned_to: null,
                    assigned_to_name: null,
                    name: null,
                    claimed_at: null,
                    transfer: null,
                    is_claimed: false,
                    edits: [],
                    latest_edit: null
                };
            }
            if (typeof riderName === 'object' && riderName !== null) {
                const meta = riderName;
                const editsList = Array.isArray(meta.edits) ? meta.edits : [];
                const assignedId = meta.admin_id || meta.assigned_to || null;
                const assignedName = meta.name || meta.assigned_to_name || null;
                return {
                    assigned_to: assignedId,
                    assigned_to_name: assignedName,
                    name: assignedName,
                    phone: meta.phone || meta.assigned_to_phone || null,
                    claimed_at: meta.claimed_at || null,
                    transfer: meta.transfer || null,
                    is_claimed: Boolean(assignedId || meta.is_claimed),
                    edits: editsList,
                    latest_edit: meta.latest_edit || (editsList.length > 0 ? editsList[editsList.length - 1] : null)
                };
            }
            if (typeof riderName === 'string' && riderName.trim().startsWith('{')) {
                try {
                    const meta = JSON.parse(riderName.trim());
                    const editsList = Array.isArray(meta.edits) ? meta.edits : [];
                    const assignedId = meta.admin_id || meta.assigned_to || null;
                    const assignedName = meta.name || meta.assigned_to_name || null;
                    return {
                        assigned_to: assignedId,
                        assigned_to_name: assignedName,
                        name: assignedName,
                        phone: meta.phone || meta.assigned_to_phone || null,
                        claimed_at: meta.claimed_at || null,
                        transfer: meta.transfer || null,
                        is_claimed: Boolean(assignedId || meta.is_claimed),
                        edits: editsList,
                        latest_edit: meta.latest_edit || (editsList.length > 0 ? editsList[editsList.length - 1] : null)
                    };
                } catch (e) {}
            }
            if (riderName === 'Alex' || riderName === 'Campus Express' || riderName === 'unassigned' || riderName === 'Unassigned') {
                return {
                    assigned_to: null,
                    assigned_to_name: null,
                    name: null,
                    claimed_at: null,
                    transfer: null,
                    is_claimed: false,
                    edits: [],
                    latest_edit: null
                };
            }
            return {
                assigned_to: null,
                assigned_to_name: riderName,
                name: riderName,
                claimed_at: null,
                transfer: null,
                is_claimed: true,
                edits: [],
                latest_edit: null
            };
        },

        async claimOrder(orderId, adminId, adminName, adminPhone = null) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const { data: order, error: fetchErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (fetchErr || !order) throw new Error('Order not found');

            if (['Delivered', 'delivered', 'cancelled', 'Cancelled'].includes(order.status)) {
                throw new Error(`This order is already ${order.status.toLowerCase()} and cannot be claimed.`);
            }

            const currentInfo = this.parseDeliveryMeta(order.rider_name);
            if (currentInfo.is_claimed && currentInfo.assigned_to && currentInfo.assigned_to !== adminId) {
                const err = new Error(`Order was already accepted by ${currentInfo.assigned_to_name || 'another delivery partner'}. First to accept gets the delivery.`);
                err.code = 'ALREADY_CLAIMED';
                err.claimedBy = currentInfo.assigned_to_name || 'Another Delivery Partner';
                err.claimedAt = currentInfo.claimed_at;
                throw err;
            }

            const deliveryMeta = {
                admin_id: adminId,
                name: adminName || 'Delivery Rider',
                phone: adminPhone || null,
                claimed_at: new Date().toISOString(),
                transfer: null
            };

            const updates = {
                rider_name: JSON.stringify(deliveryMeta)
            };
            if (order.status === 'Order Placed' || order.status === 'pending') {
                updates.status = 'Order Confirmed';
            }

            // Atomic Optimistic Concurrency Control update:
            // Ensure rider_name matches what was read, preventing concurrent race overwrites
            let updateQuery = supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (order.rider_name !== null && order.rider_name !== undefined) {
                updateQuery = updateQuery.eq('rider_name', order.rider_name);
            } else {
                updateQuery = updateQuery.is('rider_name', null);
            }

            const { data, error } = await updateQuery
                .select()
                .single();

            if (error || !data) {
                // If update returned 0 rows, check if another courier claimed it concurrently
                const { data: latestOrder } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (latestOrder) {
                    const latestInfo = this.parseDeliveryMeta(latestOrder.rider_name);
                    if (latestInfo.is_claimed && latestInfo.assigned_to && latestInfo.assigned_to !== adminId) {
                        const err = new Error(`Order was already accepted by ${latestInfo.assigned_to_name || 'another delivery partner'}. First to accept gets the delivery.`);
                        err.code = 'ALREADY_CLAIMED';
                        err.claimedBy = latestInfo.assigned_to_name || 'Another Delivery Partner';
                        err.claimedAt = latestInfo.claimed_at;
                        throw err;
                    }
                }

                throw new Error(`Claim order failed: ${error?.message || 'Order state was modified concurrently'}`);
            }

            cache.invalidateOrders();

            return {
                ...data,
                rider_name: this.formatRiderDisplayName(data.rider_name, adminName),
                delivery_assignment: this.parseDeliveryMeta(data.rider_name)
            };
        },

        async requestTransfer(orderId, fromAdminId, fromAdminName, toAdminId, toAdminName, reason) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const { data: order, error: fetchErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (fetchErr || !order) throw new Error('Order not found');

            const currentInfo = this.parseDeliveryMeta(order.rider_name);
            const deliveryMeta = {
                admin_id: currentInfo.assigned_to || fromAdminId,
                name: currentInfo.assigned_to_name || fromAdminName,
                claimed_at: currentInfo.claimed_at || new Date().toISOString(),
                transfer: {
                    from_id: fromAdminId,
                    from_name: fromAdminName,
                    to_id: toAdminId,
                    to_name: toAdminName,
                    reason: reason || 'Delivery assistance needed',
                    status: 'PENDING',
                    requested_at: new Date().toISOString()
                }
            };

            const { data, error } = await supabase
                .from('orders')
                .update({ rider_name: JSON.stringify(deliveryMeta) })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw new Error(`Transfer request failed: ${error.message}`);
            cache.invalidateOrders();

            return {
                ...data,
                delivery_assignment: this.parseDeliveryMeta(data.rider_name)
            };
        },

        async respondTransfer(orderId, targetAdminId, accept, responderName) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const { data: order, error: fetchErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (fetchErr || !order) throw new Error('Order not found');

            const currentInfo = this.parseDeliveryMeta(order.rider_name);
            if (!currentInfo.transfer) {
                throw new Error('No pending transfer request found for this order');
            }

            let deliveryMeta;
            if (accept) {
                deliveryMeta = {
                    admin_id: targetAdminId,
                    name: responderName || currentInfo.transfer.to_name || 'Delivery Rider',
                    claimed_at: new Date().toISOString(),
                    transfer: null
                };
            } else {
                deliveryMeta = {
                    admin_id: currentInfo.assigned_to,
                    name: currentInfo.assigned_to_name,
                    claimed_at: currentInfo.claimed_at,
                    transfer: null
                };
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ rider_name: JSON.stringify(deliveryMeta) })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw new Error(`Respond transfer failed: ${error.message}`);
            cache.invalidateOrders();

            return {
                ...data,
                rider_name: this.formatRiderDisplayName(data.rider_name, deliveryMeta.name),
                delivery_assignment: this.parseDeliveryMeta(data.rider_name),
                previous_transfer: currentInfo.transfer
            };
        },

        async directAssign(orderId, targetAdminId, targetAdminName, assignedBy, targetAdminPhone = null) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const deliveryMeta = {
                admin_id: targetAdminId,
                name: targetAdminName || 'Delivery Rider',
                phone: targetAdminPhone || null,
                claimed_at: new Date().toISOString(),
                assigned_by: assignedBy,
                transfer: null
            };

            const { data, error } = await supabase
                .from('orders')
                .update({ rider_name: JSON.stringify(deliveryMeta) })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw new Error(`Direct assign failed: ${error.message}`);
            cache.invalidateOrders();

            return {
                ...data,
                rider_name: this.formatRiderDisplayName(data.rider_name, targetAdminName),
                delivery_assignment: this.parseDeliveryMeta(data.rider_name)
            };
        },

        async editOrderItems(orderId, { items, reason, notes, restockRemoved = true, editedBy = 'admin', editedByName = 'Store Manager' }) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            // 1. Fetch target order
            const { data: order, error: orderErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderErr || !order) throw new Error('Order not found');
            if (['Delivered', 'Cancelled'].includes(order.status)) {
                throw new Error(`Cannot edit an order that is already marked as ${order.status}.`);
            }

            // 2. Fetch current items with product details
            const { data: currentItems, error: itemsErr } = await supabase
                .from('order_items')
                .select('*, products(*)')
                .eq('order_id', orderId);

            if (itemsErr || !currentItems || currentItems.length === 0) {
                throw new Error('No items found for this order.');
            }

            const changes = [];
            const remainingOrderItems = [];
            const itemsToDelete = [];
            const itemsToUpdate = [];

            for (const curr of currentItems) {
                const req = (items || []).find(it => (it.id && it.id === curr.id) || (it.product_id && it.product_id === curr.product_id));
                const oldQty = Number(curr.quantity) || 1;
                const unitPrice = Number(curr.unit_price || curr.products?.price) || 0;
                const itemName = curr.products?.name || curr.name || 'Campus Item';
                const newQty = req ? Math.max(0, parseInt(req.quantity, 10) || 0) : oldQty;

                if (newQty === 0) {
                    itemsToDelete.push(curr.id);
                    const qtyDiff = oldQty;
                    changes.push({
                        item_id: curr.id,
                        product_id: curr.product_id,
                        name: itemName,
                        action: 'REMOVED',
                        old_qty: oldQty,
                        new_qty: 0,
                        unit_price: unitPrice,
                        qty_diff: qtyDiff
                    });
                    if (restockRemoved && curr.product_id && qtyDiff > 0) {
                        try {
                            const targetHostel = order.hostel_id || 'BH-13';
                            const updated = await supabaseDb.products.adjustStock(curr.product_id, qtyDiff, targetHostel);
                            if (typeof broadcastInventoryUpdate === 'function') {
                                broadcastInventoryUpdate(curr.product_id, updated.stock_left, updated.in_stock, targetHostel);
                            }
                        } catch (pErr) {
                            console.warn(`[EditOrder Restock Error]:`, pErr.message);
                        }
                    }
                } else if (newQty < oldQty) {
                    itemsToUpdate.push({ id: curr.id, quantity: newQty });
                    const qtyDiff = oldQty - newQty;
                    changes.push({
                        item_id: curr.id,
                        product_id: curr.product_id,
                        name: itemName,
                        action: 'REDUCED_QTY',
                        old_qty: oldQty,
                        new_qty: newQty,
                        unit_price: unitPrice,
                        qty_diff: qtyDiff
                    });
                    remainingOrderItems.push({
                        ...curr,
                        quantity: newQty,
                        unit_price: unitPrice
                    });
                    if (restockRemoved && curr.product_id && qtyDiff > 0) {
                        try {
                            const targetHostel = order.hostel_id || 'BH-13';
                            const updated = await supabaseDb.products.adjustStock(curr.product_id, qtyDiff, targetHostel);
                            if (typeof broadcastInventoryUpdate === 'function') {
                                broadcastInventoryUpdate(curr.product_id, updated.stock_left, updated.in_stock, targetHostel);
                            }
                        } catch (pErr) {
                            console.warn(`[EditOrder Restock Error]:`, pErr.message);
                        }
                    }
                } else {
                    remainingOrderItems.push({
                        ...curr,
                        quantity: oldQty,
                        unit_price: unitPrice
                    });
                }
            }

            if (changes.length === 0) {
                throw new Error('No modifications were made to the order items.');
            }

            if (remainingOrderItems.length === 0) {
                throw new Error('Cannot remove all items from the order. If all items are unavailable, please Cancel the order instead.');
            }

            // 3. Apply line item changes in PostgreSQL
            for (const delId of itemsToDelete) {
                await supabase.from('order_items').delete().eq('id', delId);
            }
            for (const upd of itemsToUpdate) {
                await supabase.from('order_items').update({ quantity: upd.quantity }).eq('id', upd.id);
            }

            // 4. Recalculate totals
            const newSubtotal = remainingOrderItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
            const deliveryFee = Number(order.delivery_fee) || 0;
            const platformFee = Number(order.platform_fee) || 0;
            const tax = Number(order.tax) || 0;
            const newTotal = newSubtotal + deliveryFee + platformFee + tax;

            // 5. Structure audit trail into order metadata
            let currentMeta = {};
            if (order.rider_name && typeof order.rider_name === 'string' && order.rider_name.trim().startsWith('{')) {
                try { currentMeta = JSON.parse(order.rider_name); } catch (e) {}
            } else if (order.rider_name && order.rider_name !== 'unassigned') {
                currentMeta = { name: order.rider_name, assigned_to_name: order.rider_name };
            }

            const editEntry = {
                edit_id: `edit_${uuidv4().replace(/-/g, '').slice(0, 8)}`,
                edited_at: new Date().toISOString(),
                edited_by_id: editedBy || 'admin',
                edited_by_name: editedByName || 'Store Manager',
                reason: reason || 'Item Out of Stock at BH13 Dark Store',
                notes: notes || '',
                old_total: Number(order.total) || 0,
                new_total: newTotal,
                restocked: Boolean(restockRemoved),
                changes
            };

            const existingEdits = Array.isArray(currentMeta.edits) ? currentMeta.edits : [];
            existingEdits.push(editEntry);
            currentMeta.edits = existingEdits;
            currentMeta.latest_edit = editEntry;

            const itemSummary = remainingOrderItems.map(it => `${it.products?.name || it.name || 'Campus Item'} (x${it.quantity})`).join(', ');

            // 6. Update orders record in Supabase
            const { data: updatedOrder, error: updateErr } = await supabase
                .from('orders')
                .update({
                    subtotal: newSubtotal,
                    total: newTotal,
                    rider_name: JSON.stringify(currentMeta)
                })
                .eq('id', orderId)
                .select()
                .single();

            if (updateErr) throw new Error(`Failed to update order total: ${updateErr.message}`);

            cache.invalidateOrders();
            cache.invalidateProducts();

            return {
                ...updatedOrder,
                rider_name: this.formatRiderDisplayName(updatedOrder.rider_name),
                delivery_assignment: this.parseDeliveryMeta(updatedOrder.rider_name),
                items: remainingOrderItems.map(it => ({
                    id: it.id,
                    order_id: it.order_id,
                    product_id: it.product_id,
                    quantity: Number(it.quantity) || 1,
                    price: Number(it.unit_price || it.products?.price || 0),
                    unit_price: Number(it.unit_price || it.products?.price || 0),
                    name: it.products?.name || it.name || 'Campus Item',
                    image_url: it.products?.image_url || it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60'
                })),
                item_names: itemSummary,
                latest_edit: editEntry
            };
        }
    },

    // ==========================================
    // USERS
    // ==========================================
    users: {
        async getById(id) {
            if (!id) return null;
            const cacheKey = `user:id:${id}`;
            return await cache.wrap(cacheKey, async () => {
                const supabase = getSupabaseClient();
                const ownerFallback = {
                    id: 'user_admin_bh13',
                    name: 'Nivas Naidu',
                    email: 'admin@lpu.in',
                    role: 'owner',
                    phone: '07671836211',
                    dob: JSON.stringify({ roles: ['owner', 'store_manager', 'delivery_person', 'inventory_manager', 'support_agent'] }),
                    account_status: 'ACTIVE'
                };

                const staffFallbacks = {
                    'user_admin_bh13': ownerFallback,
                    'admin_5dcb05eba7': {
                        id: 'admin_5dcb05eba7',
                        name: 'Flash Man',
                        email: 'jashwanth@lpuquick.in',
                        phone: '8125916637',
                        dob: JSON.stringify({ roles: ['inventory_manager', 'delivery_person'] }),
                        role: 'admin',
                        account_status: 'ACTIVE'
                    },
                    'user_2dae5b56': {
                        id: 'user_2dae5b56',
                        name: 'Caption America',
                        email: 'harsha@lpu.in',
                        phone: '8498895666',
                        dob: JSON.stringify({ roles: ['store_manager', 'delivery_person'] }),
                        role: 'admin',
                        account_status: 'ACTIVE'
                    },
                    'admin_214ff5d346': {
                        id: 'admin_214ff5d346',
                        name: 'Jhonysins',
                        email: 'yogesh@lpuquick.in',
                        phone: '9098724780',
                        dob: JSON.stringify({ roles: ['store_manager', 'inventory_manager', 'delivery_person'] }),
                        role: 'admin',
                        account_status: 'ACTIVE'
                    },
                    'user_94597f1f': {
                        id: 'user_94597f1f',
                        name: 'Rohith',
                        email: 'rohit@lpuquick.in',
                        phone: '6304238488',
                        dob: JSON.stringify({ roles: ['store_manager'] }),
                        role: 'admin',
                        account_status: 'ACTIVE'
                    }
                };

                if (!supabase) {
                    return staffFallbacks[id] || null;
                }

                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', id)
                        .maybeSingle();

                    if (error || !data) {
                        return staffFallbacks[id] || null;
                    }
                    return data;
                } catch (err) {
                    return staffFallbacks[id] || null;
                }
            }, 60000);
        },

        async getUserById(id) {
            return this.getById(id);
        },

        async getByIdentifier(identifier) {
            if (!identifier) return null;
            const supabase = getSupabaseClient();
            if (!supabase) return null;

            const clean = identifier.trim().toLowerCase();
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.ilike.${clean},phone.eq.${identifier.trim()}`)
                .limit(1);

            if (error || !data || data.length === 0) return null;
            return data[0];
        },

        async createUser(userData) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const record = {
                id: userData.id || `user_${uuidv4().slice(0, 8)}`,
                name: userData.name || 'LPU Student',
                email: userData.email ? userData.email.trim().toLowerCase() : null,
                phone: userData.phone ? userData.phone.trim() : null,
                password_hash: userData.password_hash || 'none',
                dob: userData.dob || null,
                role: userData.role || 'student',
                account_status: userData.account_status || 'ACTIVE'
            };

            const { data, error } = await supabase
                .from('users')
                .upsert([record])
                .select()
                .single();

            if (error) throw new Error(`PostgreSQL user upsert failed: ${error.message}`);
            if (data?.id) cache.delete(`user:id:${data.id}`);
            return data;
        },

        async updatePhone(userId, phone) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const { data, error } = await supabase
                .from('users')
                .update({ phone: phone.trim() })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw new Error(`PostgreSQL phone update failed: ${error.message}`);
            if (userId) cache.delete(`user:id:${userId}`);
            return data;
        },

        async getAllCustomersWithMetrics() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .neq('role', 'admin')
                .order('created_at', { ascending: false });

            if (error || !users) return [];

            const { data: allOrders } = await supabase
                .from('orders')
                .select('user_id, total, status, created_at');

            return users.map(u => {
                const userOrders = (allOrders || []).filter(o => o.user_id === u.id);
                const delivered = userOrders.filter(o => o.status === 'Delivered');
                const totalSpent = delivered.reduce((sum, o) => sum + Number(o.total || 0), 0);
                
                let lastOrderDate = null;
                if (userOrders.length > 0) {
                    const sortedOrders = [...userOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    lastOrderDate = sortedOrders[0]?.created_at || null;
                }

                let address = u.dob;
                let lastLogin = null;
                if (u.dob && typeof u.dob === 'string' && u.dob.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(u.dob);
                        address = parsed.address || null;
                        lastLogin = parsed.last_login || null;
                    } catch(e) {}
                }

                return {
                    ...u,
                    address: address || 'Campus Resident',
                    last_login: lastLogin || lastOrderDate || u.created_at,
                    last_order_date: lastOrderDate,
                    orders_count: userOrders.length,
                    order_count: userOrders.length,
                    total_spent: totalSpent
                };
            });
        },

        async recordCustomerLogin(userId) {
            const supabase = getSupabaseClient();
            if (!supabase || !userId) return;
            try {
                const { data: u } = await supabase.from('users').select('dob').eq('id', userId).single();
                let address = u?.dob || '';
                if (address.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(address);
                        address = parsed.address || '';
                    } catch(e) {}
                }
                const updatedMeta = JSON.stringify({
                    address: address,
                    last_login: new Date().toISOString()
                });
                await supabase.from('users').update({ dob: updatedMeta }).eq('id', userId);
            } catch (e) {}
        }
    },

    // ==========================================
    // STORE AVAILABILITY & LOCK CONTROLS
    // ==========================================
    availability: {
        _memoryAvailability: {
            id: 'store_main',
            is_locked: false,
            lock_type: 'NONE',
            message: null,
            start_at: null,
            end_at: null,
            created_by: null,
            updated_at: new Date().toISOString()
        },

        _enrichAvailability(raw) {
            if (!raw) return raw;
            const now = new Date();
            const nowMs = now.getTime();
            let isLocked = Boolean(raw.is_locked);
            let lockType = raw.lock_type || 'NONE';
            let lockStatus = isLocked ? 'LOCKED' : 'AVAILABLE';
            let remainingSeconds = null;

            // Handle SCHEDULED lock window
            if (lockType === 'SCHEDULED' && raw.start_at && raw.end_at) {
                const startMs = new Date(raw.start_at).getTime();
                const endMs = new Date(raw.end_at).getTime();
                if (nowMs < startMs) {
                    isLocked = false;
                    lockStatus = 'SCHEDULED';
                    remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
                } else if (nowMs >= startMs && nowMs < endMs) {
                    isLocked = true;
                    lockStatus = 'LOCKED';
                    remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
                } else {
                    isLocked = false;
                    lockStatus = 'AVAILABLE';
                    lockType = 'NONE';
                    remainingSeconds = 0;
                }
            } else if (isLocked) {
                if (raw.end_at) {
                    const endMs = new Date(raw.end_at).getTime();
                    if (nowMs >= endMs) {
                        isLocked = false;
                        lockStatus = 'AVAILABLE';
                        lockType = 'NONE';
                        remainingSeconds = 0;
                    } else {
                        remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
                    }
                } else {
                    remainingSeconds = null;
                }
            } else {
                remainingSeconds = null;
            }

            // Generate natural language reopening headline
            let displayReopen = null;
            const targetEnd = raw.end_at;
            if (targetEnd) {
                const end = new Date(targetEnd);
                if (!isNaN(end.getTime())) {
                    const isToday = end.toDateString() === now.toDateString();
                    const tomorrow = new Date(nowMs + 86400000);
                    const isTomorrow = end.toDateString() === tomorrow.toDateString();

                    let hours = end.getHours();
                    const minutes = end.getMinutes();
                    const ampm = hours >= 12 ? 'pm' : 'am';
                    hours = hours % 12 || 12;
                    const minStr = String(minutes).padStart(2, '0');
                    const timeStr = `${hours}:${minStr} ${ampm}`;

                    let dayWording = 'today';
                    if (isToday) dayWording = 'today';
                    else if (isTomorrow) dayWording = 'tomorrow';
                    else dayWording = `on ${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}`;

                    displayReopen = {
                        time: timeStr,
                        day: dayWording,
                        fullHeadline: `We'll reopen at ${timeStr}, ${dayWording}`
                    };
                }
            }
            if (!displayReopen) {
                displayReopen = {
                    fullHeadline: raw.message || (isLocked ? "Store is currently CLOSED for orders" : "Store is OPEN for orders")
                };
            }

            return {
                ...raw,
                is_locked: isLocked,
                lock_status: lockStatus,
                lock_type: lockType,
                start_at: raw.start_at || null,
                end_at: raw.end_at || null,
                reopen_at: raw.end_at || null,
                remaining_seconds: remainingSeconds,
                display_reopen: displayReopen,
                server_time: now.toISOString()
            };
        },

        _memoryHostelAvailability: new Map(),

        _normalizeHostelId(hostelId) {
            if (!hostelId || hostelId === 'ALL' || hostelId === 'store_main') return 'ALL';
            let s = String(hostelId).trim().toUpperCase();
            if (s.startsWith('STORE_')) s = s.slice(6);
            if (s === 'ALL' || s === 'MAIN' || s === 'STORE_MAIN') return 'ALL';

            // Match against loaded hostels in memory / disk
            const current = supabaseDb.hostels._memoryHostels || supabaseDb.hostels._loadHostelsFromDisk();
            if (Array.isArray(current) && current.length > 0) {
                const normInput = s.replace(/[\s\-_]/g, '').toLowerCase();
                const matched = current.find(h => {
                    const normHId = (h.id || '').replace(/[\s\-_]/g, '').toLowerCase();
                    const normHName = (h.name || '').replace(/[\s\-_]/g, '').toLowerCase();
                    return normHId === normInput || normHName === normInput;
                });
                if (matched) return matched.id;
            }

            return s;
        },

        _normalizeKey(hostelId) {
            if (!hostelId || hostelId === 'ALL' || hostelId === 'store_main') return 'store_main';
            let s = String(hostelId).trim().toUpperCase();
            if (s.startsWith('STORE_')) s = s.slice(6);
            if (s === 'ALL' || s === 'MAIN' || s === 'STORE_MAIN') return 'store_main';

            const canonical = this._normalizeHostelId(s);
            return `store_${canonical}`;
        },

        async _getRawRecord(key) {
            return await cache.wrap(`availability:record:${key}`, async () => {
                const supabase = getSupabaseClient();
                if (!supabase) return this._memoryHostelAvailability.get(key) || (key === 'store_main' ? this._memoryAvailability : {
                    id: key,
                    is_locked: false,
                    lock_type: 'NONE',
                    message: null,
                    start_at: null,
                    end_at: null,
                    created_by: 'system',
                    updated_at: new Date().toISOString()
                });

                let fetchedRecord = null;
                try {
                    const { data, error } = await supabase
                        .from('app_availability')
                        .select('id, is_locked, lock_type, message, start_at, end_at, created_by, updated_at')
                        .eq('id', key)
                        .maybeSingle();

                    if (!error && data) {
                        fetchedRecord = data;
                    }
                } catch (e) {}

                // If not found and key has space or hyphen, try alternate representation (e.g. store_BH 11 <-> store_BH-11)
                if (!fetchedRecord && key.startsWith('store_')) {
                    const sub = key.slice(6);
                    const altSub = sub.includes('-') ? sub.replace('-', ' ') : (sub.includes(' ') ? sub.replace(' ', '-') : null);
                    if (altSub) {
                        const altKey = `store_${altSub}`;
                        try {
                            const { data: altData } = await supabase
                                .from('app_availability')
                                .select('id, is_locked, lock_type, message, start_at, end_at, created_by, updated_at')
                                .eq('id', altKey)
                                .maybeSingle();
                            if (altData) {
                                fetchedRecord = altData;
                            }
                        } catch (e) {}
                    }
                }

                if (!fetchedRecord && key === 'store_main') {
                    // Fallback to reading from users table system record
                    try {
                        const { data: sysUser } = await supabase
                            .from('users')
                            .select('password_hash')
                            .eq('id', '__system_store_availability__')
                            .maybeSingle();
                        if (sysUser?.password_hash) {
                            fetchedRecord = JSON.parse(sysUser.password_hash);
                        }
                    } catch (e) {}
                }

                if (!fetchedRecord) {
                    fetchedRecord = this._memoryHostelAvailability.get(key) || {
                        id: key,
                        is_locked: false,
                        lock_type: 'NONE',
                        message: null,
                        start_at: null,
                        end_at: null,
                        created_by: 'system',
                        updated_at: new Date().toISOString()
                    };
                }

                this._memoryHostelAvailability.set(key, fetchedRecord);
                if (key === 'store_main') this._memoryAvailability = { ...this._memoryAvailability, ...fetchedRecord };
                return fetchedRecord;
            }, 3000);
        },

        async getStatus(hostelId = null) {
            // 1. Check Global Master Lock ('store_main')
            const masterRaw = await this._getRawRecord('store_main');
            const masterEnriched = this._enrichAvailability(masterRaw);
            
            // Check if duration lock has expired on master
            if (masterRaw.is_locked && masterRaw.end_at) {
                const now = new Date();
                const end = new Date(masterRaw.end_at);
                if (now > end) {
                    await this.unlock('SYSTEM_EXPIRY', 'store_main');
                    masterEnriched.is_locked = false;
                    masterEnriched.lock_type = 'NONE';
                    masterEnriched.message = null;
                    masterEnriched.end_at = null;
                }
            }

            if (masterEnriched.is_locked) {
                return {
                    ...masterEnriched,
                    is_global_lock: true,
                    target_hostel: 'ALL'
                };
            }

            // If no specific hostel requested or ALL, return master status
            if (!hostelId || hostelId === 'ALL') {
                return {
                    ...masterEnriched,
                    is_global_lock: false,
                    target_hostel: 'ALL'
                };
            }

            // 2. Check specific hostel's individual lock
            const canonicalHostel = this._normalizeHostelId(hostelId);
            const key = this._normalizeKey(canonicalHostel);
            const hostelRaw = await this._getRawRecord(key);
            if (hostelRaw.is_locked && hostelRaw.end_at) {
                const now = new Date();
                const end = new Date(hostelRaw.end_at);
                if (now > end) {
                    await this.unlock('SYSTEM_EXPIRY', canonicalHostel);
                    return this._enrichAvailability({
                        ...hostelRaw,
                        is_locked: false,
                        lock_type: 'NONE',
                        message: null,
                        end_at: null,
                        is_global_lock: false,
                        target_hostel: canonicalHostel
                    });
                }
            }

            const hostelEnriched = this._enrichAvailability(hostelRaw);
            return {
                ...hostelEnriched,
                is_global_lock: false,
                target_hostel: canonicalHostel
            };
        },

        async getHostelStatusDirect(hostelId = 'ALL') {
            const canonicalHostel = this._normalizeHostelId(hostelId);
            const key = this._normalizeKey(canonicalHostel);
            const raw = await this._getRawRecord(key);
            if (raw.is_locked && raw.end_at) {
                const now = new Date();
                const end = new Date(raw.end_at);
                if (now > end) {
                    await this.unlock('SYSTEM_EXPIRY', canonicalHostel);
                    return this._enrichAvailability({ ...raw, is_locked: false, lock_type: 'NONE', message: null, end_at: null });
                }
            }
            return this._enrichAvailability(raw);
        },

        async getAllHostelLocks() {
            let hostels = [];
            try {
                hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
            } catch (e) {}
            if (!hostels || hostels.length === 0) {
                hostels = [
                    { id: 'BH-13', name: 'Boys Hostel 13' },
                    { id: 'BH-5', name: 'Boys Hostel 5' },
                    { id: 'BH-14', name: 'Boys Hostel 14' },
                    { id: 'GH-1', name: 'Girls Hostel 1' }
                ];
            }

            const masterLock = await this.getHostelStatusDirect('ALL');
            const hostelLockList = await Promise.all(hostels.map(async h => {
                const direct = await this.getHostelStatusDirect(h.id);
                const isDirectLocked = Boolean(direct.is_locked);
                const effectiveLocked = Boolean(masterLock.is_locked || isDirectLocked);
                return {
                    hostel_id: h.id,
                    hostel_name: h.name || h.id,
                    status: h.status || 'ACTIVE',
                    manager_name: h.manager_name || null,
                    direct_lock: direct,
                    effective_locked: effectiveLocked,
                    locked_by_master: Boolean(masterLock.is_locked && !isDirectLocked)
                };
            }));

            return {
                master_lock: masterLock,
                hostels: hostelLockList
            };
        },

        async setLock(lockData, hostelId = 'ALL') {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const canonicalHostel = this._normalizeHostelId(hostelId);
            const key = this._normalizeKey(canonicalHostel);
            const isMaster = key === 'store_main';
            const defaultMsg = isMaster ? 'Store is temporarily unavailable.' : `${canonicalHostel} store is temporarily closed.`;

            const record = {
                id: key,
                is_locked: true,
                lock_type: lockData.lock_type || 'IMMEDIATE',
                message: lockData.message || defaultMsg,
                start_at: lockData.start_at || new Date().toISOString(),
                end_at: lockData.end_at || null,
                created_by: lockData.created_by || 'admin',
                updated_at: new Date().toISOString()
            };

            this._memoryHostelAvailability.set(key, record);
            if (isMaster) {
                this._memoryAvailability = { ...this._memoryAvailability, ...record };
            }

            let saved = false;
            try {
                const { data, error } = await supabase
                    .from('app_availability')
                    .upsert([record])
                    .select()
                    .single();

                if (!error && data) {
                    saved = true;
                    this._memoryHostelAvailability.set(key, data);
                    if (isMaster) this._memoryAvailability = { ...this._memoryAvailability, ...data };
                }
            } catch (err) {}

            if (!saved && isMaster) {
                // Resilient fallback: save state to system record in users table
                try {
                    await supabase.from('users').upsert([{
                        id: '__system_store_availability__',
                        name: 'System Store State',
                        email: 'system_availability@lpuquick.internal',
                        password_hash: JSON.stringify(record),
                        dob: 'System Config',
                        role: 'student'
                    }]);
                    saved = true;
                } catch (fallbackErr) {
                    console.warn('[Availability SetLock Fallback Warning]:', fallbackErr.message);
                }
            }

            cache.invalidateAvailability();
            cache.delete(`availability:record:${key}`);
            if (key.startsWith('store_')) {
                const sub = key.slice(6);
                const altSub = sub.includes('-') ? sub.replace('-', ' ') : (sub.includes(' ') ? sub.replace(' ', '-') : null);
                if (altSub) cache.delete(`availability:record:store_${altSub}`);
            }

            return {
                ...this._enrichAvailability(record),
                target_hostel: canonicalHostel
            };
        },

        async unlock(adminId = 'admin', hostelId = 'ALL') {
            const supabase = getSupabaseClient();
            const canonicalHostel = this._normalizeHostelId(hostelId);
            const key = this._normalizeKey(canonicalHostel);
            const isMaster = key === 'store_main';

            const record = {
                id: key,
                is_locked: false,
                lock_type: 'NONE',
                message: null,
                start_at: null,
                end_at: null,
                created_by: adminId,
                updated_at: new Date().toISOString()
            };

            this._memoryHostelAvailability.set(key, record);
            if (isMaster) {
                this._memoryAvailability = { ...this._memoryAvailability, ...record };
            }

            if (supabase) {
                try {
                    await supabase
                        .from('app_availability')
                        .upsert([record]);
                } catch (err) {}

                if (key.startsWith('store_')) {
                    const sub = key.slice(6);
                    const altSub = sub.includes('-') ? sub.replace('-', ' ') : (sub.includes(' ') ? sub.replace(' ', '-') : null);
                    if (altSub) {
                        try {
                            await supabase
                                .from('app_availability')
                                .upsert([{ ...record, id: `store_${altSub}` }]);
                        } catch (err) {}
                    }
                }

                if (isMaster) {
                    try {
                        await supabase.from('users').upsert([{
                            id: '__system_store_availability__',
                            name: 'System Store State',
                            email: 'system_availability@lpuquick.internal',
                            password_hash: JSON.stringify(record),
                            dob: 'System Config',
                            role: 'student'
                        }]);
                    } catch (userFallbackErr) {}
                }
            }

            cache.invalidateAvailability();
            cache.delete(`availability:record:${key}`);
            if (key.startsWith('store_')) {
                const sub = key.slice(6);
                const altSub = sub.includes('-') ? sub.replace('-', ' ') : (sub.includes(' ') ? sub.replace(' ', '-') : null);
                if (altSub) cache.delete(`availability:record:store_${altSub}`);
            }

            return {
                ...this._enrichAvailability(record),
                target_hostel: canonicalHostel
            };
        }
    },

    // ==========================================
    // SECURITY BLACKLIST
    // ==========================================
    blacklist: {
        _memoryBlacklist: new Map(),

        async isUserBlacklisted(userId) {
            if (!userId) return { isBlacklisted: false };

            // 1. In-memory check for zero-latency response
            if (this._memoryBlacklist.has(userId)) {
                return this._memoryBlacklist.get(userId);
            }

            const supabase = getSupabaseClient();
            if (!supabase) return { isBlacklisted: false };

            // 2. Check blacklisted_users table for active BLOCKED status
            try {
                const { data, error } = await supabase
                    .from('blacklisted_users')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'BLOCKED')
                    .maybeSingle();

                if (!error && data) {
                    const res = {
                        isBlacklisted: true,
                        reason: data.reason || 'Fake Orders',
                        blocked_at: data.blocked_at || data.created_at,
                        blocked_by: data.blocked_by || 'Admin',
                        record: data
                    };
                    this._memoryBlacklist.set(userId, res);
                    return res;
                }
            } catch (e) {
                console.warn('[Blacklist isUserBlacklisted DB error]:', e.message);
            }

            // 3. Fallback to users table
            try {
                const { data: u } = await supabase
                    .from('users')
                    .select('id, name, email, phone, account_status, block_reason, blocked_at, blocked_by')
                    .eq('id', userId)
                    .maybeSingle();

                if (u && u.account_status === 'BLOCKED') {
                    const res = {
                        isBlacklisted: true,
                        reason: u.block_reason || 'Fake Orders',
                        blocked_at: u.blocked_at || new Date().toISOString(),
                        blocked_by: u.blocked_by || 'Admin',
                        record: u
                    };
                    this._memoryBlacklist.set(userId, res);
                    return res;
                }
            } catch (e) {
                console.warn('[Blacklist users fallback error]:', e.message);
            }

            return { isBlacklisted: false };
        },

        async isBlacklisted(userId) {
            return this.isUserBlacklisted(userId);
        },

        async blockUser({ userId, reason = 'Fake Orders', notes = '', blockedBy = 'Admin' }) {
            if (!userId) throw new Error('userId is required');

            const cleanReason = reason ? reason.trim() : 'Fake Orders';
            const cleanNotes = notes ? notes.trim() : '';
            const now = new Date().toISOString();

            const record = {
                id: `bl_${userId}`,
                user_id: userId,
                reason: cleanReason,
                notes: cleanNotes,
                status: 'BLOCKED',
                blocked_by: blockedBy || 'Admin',
                blocked_at: now,
                unblocked_by: null,
                unblocked_at: null,
                updated_at: now
            };

            this._memoryBlacklist.set(userId, {
                isBlacklisted: true,
                reason: cleanReason,
                blocked_at: now,
                blocked_by: blockedBy || 'Admin',
                record
            });

            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    // Ensure user exists in users table to satisfy foreign key constraint
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('id')
                        .eq('id', userId)
                        .maybeSingle();

                    if (!existingUser) {
                        await supabase
                            .from('users')
                            .insert([{
                                id: userId,
                                name: 'Student',
                                role: 'student',
                                account_status: 'BLOCKED',
                                block_reason: cleanReason,
                                blocked_at: now,
                                blocked_by: blockedBy || 'Admin',
                                password_hash: 'none'
                            }]);
                    } else {
                        await supabase
                            .from('users')
                            .update({
                                account_status: 'BLOCKED',
                                block_reason: cleanReason,
                                blocked_at: now,
                                blocked_by: blockedBy || 'Admin'
                            })
                            .eq('id', userId);
                    }

                    await supabase
                        .from('blacklisted_users')
                        .upsert([record]);
                } catch (e) {
                    console.warn('[Blacklist blockUser DB warning]:', e.message);
                }
            }

            if (userId) {
                cache.delete(`user:id:${userId}`);
                cache.clearByPrefix('user:');
            }

            return {
                id: record.id,
                user_id: userId,
                reason: cleanReason,
                status: 'BLOCKED',
                blocked_by: blockedBy || 'Admin',
                blocked_at: now,
                notes: cleanNotes
            };
        },

        async blacklistUser(userId, reason = 'Fake Orders', adminId = 'Admin') {
            return this.blockUser({ userId, reason, blockedBy: adminId });
        },

        async unblockUser({ userId, unblockedBy = 'Admin' }) {
            if (!userId) throw new Error('userId is required');

            this._memoryBlacklist.delete(userId);
            const now = new Date().toISOString();
            const supabase = getSupabaseClient();

            if (supabase) {
                try {
                    await supabase
                        .from('blacklisted_users')
                        .update({
                            status: 'RESOLVED',
                            unblocked_by: unblockedBy || 'Admin',
                            unblocked_at: now,
                            updated_at: now
                        })
                        .eq('user_id', userId);
                } catch (e) {
                    console.warn('[Blacklist unblockUser DB warning]:', e.message);
                }

                try {
                    await supabase
                        .from('users')
                        .update({
                            account_status: 'ACTIVE',
                            block_reason: null,
                            blocked_at: null,
                            blocked_by: null
                        })
                        .eq('id', userId);
                } catch (e) {
                    console.warn('[Blacklist unblockUser user-update warning]:', e.message);
                }
            }

            if (userId) {
                cache.delete(`user:id:${userId}`);
                cache.clearByPrefix('user:');
            }

            return { success: true, userId, unblockedBy: unblockedBy || 'Admin' };
        },

        async unblacklistUser(userId) {
            return this.unblockUser({ userId });
        },

        async getAll() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const recordsMap = new Map();

            // 1. Fetch from blacklisted_users table with joined users relation
            try {
                const { data, error } = await supabase
                    .from('blacklisted_users')
                    .select('*, users(id, name, email, phone)')
                    .order('created_at', { ascending: false });

                if (!error && Array.isArray(data)) {
                    data.forEach(b => {
                        const u = b.users || {};
                        const item = {
                            id: b.id || `bl_${b.user_id}`,
                            user_id: b.user_id,
                            customer_name: u.name || 'Student',
                            customer_email: u.email || '',
                            customer_phone: u.phone || '',
                            reason: b.reason || 'Fake Orders',
                            status: b.status || 'BLOCKED',
                            blocked_by: b.blocked_by || 'Admin',
                            blocked_at: b.blocked_at || b.created_at || new Date().toISOString(),
                            unblocked_by: b.unblocked_by || null,
                            unblocked_at: b.unblocked_at || null,
                            notes: b.notes || '',
                            created_at: b.created_at,
                            // Aliases for compatibility
                            name: u.name || 'Student',
                            email: u.email || '',
                            phone: u.phone || ''
                        };
                        recordsMap.set(b.user_id, item);
                    });
                }
            } catch (e) {
                console.warn('[Blacklist getAll join query warning]:', e.message);
            }

            // 2. Also ensure any users with account_status = 'BLOCKED' in users table are included
            try {
                const { data: blockedUsers } = await supabase
                    .from('users')
                    .select('id, name, email, phone, account_status, block_reason, blocked_at, blocked_by, created_at')
                    .eq('account_status', 'BLOCKED');

                if (Array.isArray(blockedUsers)) {
                    blockedUsers.forEach(u => {
                        if (!recordsMap.has(u.id)) {
                            recordsMap.set(u.id, {
                                id: `bl_${u.id}`,
                                user_id: u.id,
                                customer_name: u.name || 'Student',
                                customer_email: u.email || '',
                                customer_phone: u.phone || '',
                                reason: u.block_reason || 'Fake Orders',
                                status: 'BLOCKED',
                                blocked_by: u.blocked_by || 'Admin',
                                blocked_at: u.blocked_at || u.created_at || new Date().toISOString(),
                                unblocked_by: null,
                                unblocked_at: null,
                                notes: '',
                                created_at: u.created_at,
                                name: u.name || 'Student',
                                email: u.email || '',
                                phone: u.phone || ''
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn('[Blacklist getAll fallback warning]:', e.message);
            }

            // 3. Merge any in-memory active blocked records
            this._memoryBlacklist.forEach((rec, uId) => {
                if (rec && (rec.status === 'BLOCKED' || rec.isBlacklisted) && !recordsMap.has(uId)) {
                    recordsMap.set(uId, {
                        id: `bl_${uId}`,
                        user_id: uId,
                        customer_name: rec.record?.customer_name || rec.record?.name || 'Student',
                        customer_email: rec.record?.customer_email || rec.record?.email || '',
                        customer_phone: rec.record?.customer_phone || rec.record?.phone || '',
                        reason: rec.reason || 'Fake Orders',
                        status: 'BLOCKED',
                        blocked_by: rec.blocked_by || 'Admin',
                        blocked_at: rec.blocked_at || new Date().toISOString(),
                        unblocked_by: null,
                        unblocked_at: null,
                        notes: rec.notes || '',
                        created_at: rec.blocked_at || new Date().toISOString(),
                        name: rec.record?.customer_name || rec.record?.name || 'Student',
                        email: rec.record?.customer_email || rec.record?.email || '',
                        phone: rec.record?.customer_phone || rec.record?.phone || ''
                    });
                }
            });

            const list = Array.from(recordsMap.values());
            // Sort by blocked_at descending
            list.sort((a, b) => new Date(b.blocked_at || b.created_at || 0) - new Date(a.blocked_at || a.created_at || 0));
            return list;
        },

        async getAllBlacklisted() {
            return this.getAll();
        }
    },

    // ==========================================
    // AUDIT LOGS
    // ==========================================
    audit: {
        _memoryLogs: [],

        async logAction({ adminId, targetUserId = null, action, reason = null, metadata = {} }) {
            const id = `audit_${uuidv4().slice(0, 8)}`;
            const payload = {
                id,
                admin_id: adminId || 'admin',
                target_user_id: targetUserId,
                action,
                reason,
                metadata: metadata ? (typeof metadata === 'object' ? metadata : { note: metadata }) : {},
                created_at: new Date().toISOString()
            };

            this._memoryLogs.unshift(payload);
            if (this._memoryLogs.length > 200) this._memoryLogs.pop();

            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase.from('audit_logs').insert([payload]);
                } catch (e) {
                    console.warn('[Audit Log Insert Warning]:', e.message);
                }
            }

            return payload;
        },

        async getLogs(limit = 50) {
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    const { data, error } = await supabase
                        .from('audit_logs')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(limit);

                    if (!error && data && data.length > 0) return data;
                } catch (e) {
                    console.warn('[Audit Log Fetch Warning]:', e.message);
                }
            }

            return this._memoryLogs.slice(0, limit);
        }
    },

    // ==========================================
    // STAFF & MULTI-LEVEL ADMIN MANAGEMENT
    // ==========================================
    staff: {
        async getAllStaff() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data: admins, error } = await supabase
                .from('users')
                .select('id, name, email, phone, role, dob, account_status, created_at')
                .or('role.eq.admin,role.eq.owner')
                .order('created_at', { ascending: true });

            if (error || !admins) return [];

            let hostels = [];
            try {
                hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
            } catch (hErr) {}

            return admins.map(a => {
                const isOwner = a.id === 'user_admin_bh13' || a.email === 'admin@lpu.in' || a.role === 'owner';
                let roles = [];
                let lastLogin = null;
                let assignedHostelId = null;

                if (a.dob && typeof a.dob === 'string' && a.dob.startsWith('{')) {
                    try {
                        const meta = JSON.parse(a.dob);
                        if (Array.isArray(meta.roles)) roles = meta.roles;
                        if (meta.assigned_hostel_id) assignedHostelId = meta.assigned_hostel_id;
                        lastLogin = meta.last_login || null;
                    } catch (e) {}
                }

                if (!assignedHostelId && hostels.length > 0) {
                    const matchedHostel = hostels.find(h => h.manager_user_id === a.id);
                    if (matchedHostel) assignedHostelId = matchedHostel.id;
                }

                if (isOwner) {
                    if (!roles.includes('owner')) roles.unshift('owner');
                    assignedHostelId = null;
                } else if (roles.length === 0) {
                    roles = ['store_manager'];
                }

                return {
                    id: a.id,
                    name: a.name || 'Staff Member',
                    email: a.email,
                    phone: a.phone || '',
                    roles,
                    is_owner: isOwner,
                    assigned_hostel_id: isOwner ? null : (assignedHostelId || null),
                    account_status: a.account_status || 'ACTIVE',
                    last_login: lastLogin,
                    created_at: a.created_at
                };
            });
        },

        async createStaff({ name, email, phone, password, roles, assigned_hostel_id }) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const cleanEmail = email.trim().toLowerCase();
            const cleanPhone = phone ? phone.trim() : null;
            const assignedRoles = Array.isArray(roles) && roles.length > 0 ? roles : ['store_manager'];
            const cleanHostel = (assigned_hostel_id && assigned_hostel_id !== 'ALL') ? assigned_hostel_id.trim().toUpperCase() : null;
            const dobMeta = JSON.stringify({
                roles: assignedRoles,
                assigned_hostel_id: cleanHostel,
                last_login: null
            });

            // 1. Check if a user with this email OR phone already exists in PostgreSQL
            let existingUser = null;
            const { data: byEmail } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
            if (byEmail) {
                existingUser = byEmail;
            } else if (cleanPhone) {
                const { data: byPhone } = await supabase.from('users').select('*').eq('phone', cleanPhone).maybeSingle();
                if (byPhone) {
                    existingUser = byPhone;
                }
            }

            if (existingUser) {
                // Protect primary owner account
                if (existingUser.role === 'owner' || existingUser.id === 'user_admin_bh13') {
                    throw new Error('Owner account credentials cannot be overwritten via staff creation.');
                }

                // Seamlessly promote student to admin or update existing staff permissions
                const updatePayload = {
                    name: name.trim(),
                    email: cleanEmail,
                    phone: cleanPhone,
                    password_hash: `hash_${password}`,
                    role: 'admin',
                    dob: dobMeta,
                    account_status: 'ACTIVE'
                };

                const { data, error } = await supabase
                    .from('users')
                    .update(updatePayload)
                    .eq('id', existingUser.id)
                    .select()
                    .single();

                if (error) throw new Error(`Staff profile promotion failed: ${error.message}`);

                if (cleanHostel && assignedRoles.includes('store_manager')) {
                    try { await supabaseDb.hostels.assignManager(cleanHostel, data.id); } catch (e) {}
                }

                return {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    roles: assignedRoles,
                    assigned_hostel_id: cleanHostel,
                    account_status: data.account_status,
                    created_at: data.created_at
                };
            }

            // 2. Fresh new administrator record
            const staffId = `admin_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
            const record = {
                id: staffId,
                name: name.trim(),
                email: cleanEmail,
                phone: cleanPhone,
                password_hash: `hash_${password}`,
                role: 'admin',
                dob: dobMeta,
                account_status: 'ACTIVE'
            };

            const { data, error } = await supabase
                .from('users')
                .insert([record])
                .select()
                .single();

            if (error) throw new Error(`Staff creation failed: ${error.message}`);
            if (data?.id) cache.delete(`user:id:${data.id}`);
            cache.clearByPrefix('staff:');

            if (cleanHostel && assignedRoles.includes('store_manager')) {
                try { await supabaseDb.hostels.assignManager(cleanHostel, data.id); } catch (e) {}
            }

            return {
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                roles: assignedRoles,
                assigned_hostel_id: cleanHostel,
                account_status: data.account_status,
                created_at: data.created_at
            };
        },

        async updateStaff(id, updates) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            const { data: current, error: fetchErr } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchErr || !current) throw new Error('Staff member not found');

            const isOwner = current.id === 'user_admin_bh13' || current.email === 'admin@lpu.in';
            const payload = {};

            if (updates.name) payload.name = updates.name.trim();
            if (updates.phone !== undefined) payload.phone = updates.phone ? updates.phone.trim() : null;
            if (updates.password) payload.password_hash = `hash_${updates.password}`;
            if (updates.account_status && !isOwner) payload.account_status = updates.account_status;

            let finalHostel = null;
            if (updates.roles && Array.isArray(updates.roles) || updates.assigned_hostel_id !== undefined) {
                let currentMeta = {};
                if (current.dob && current.dob.startsWith('{')) {
                    try { currentMeta = JSON.parse(current.dob); } catch (e) {}
                }
                const newRoles = updates.roles && Array.isArray(updates.roles) ? [...updates.roles] : (currentMeta.roles || []);
                if (isOwner && !newRoles.includes('owner')) newRoles.unshift('owner');
                
                finalHostel = currentMeta.assigned_hostel_id || null;
                if (updates.assigned_hostel_id !== undefined) {
                    finalHostel = (updates.assigned_hostel_id && updates.assigned_hostel_id !== 'ALL') ? updates.assigned_hostel_id.trim().toUpperCase() : null;
                }

                payload.dob = JSON.stringify({
                    ...currentMeta,
                    roles: newRoles,
                    assigned_hostel_id: isOwner ? null : finalHostel
                });

                if (finalHostel && newRoles.includes('store_manager')) {
                    try { await supabaseDb.hostels.assignManager(finalHostel, id); } catch (e) {}
                }
            }

            const { data, error } = await supabase
                .from('users')
                .update(payload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(`Staff update failed: ${error.message}`);
            if (id) cache.delete(`user:id:${id}`);
            cache.clearByPrefix('staff:');

            let roles = [];
            let assignedHostelId = null;
            if (data.dob && data.dob.startsWith('{')) {
                try {
                    const parsed = JSON.parse(data.dob);
                    roles = parsed.roles || [];
                    assignedHostelId = parsed.assigned_hostel_id || null;
                } catch (e) {}
            }
            if (isOwner && !roles.includes('owner')) {
                roles.unshift('owner');
            }

            return {
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                account_status: data.account_status,
                roles,
                assigned_hostel_id: isOwner ? null : assignedHostelId,
                is_owner: isOwner
            };
        },

        async deleteStaff(id) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Database client unavailable');

            if (id === 'user_admin_bh13') {
                throw new Error('Owner account cannot be deleted or deactivated.');
            }

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw new Error(`Staff deletion failed: ${error.message}`);
            if (id) cache.delete(`user:id:${id}`);
            cache.clearByPrefix('staff:');
            return { success: true };
        },

        async recordAdminLogin(id) {
            const supabase = getSupabaseClient();
            if (!supabase || !id) return;
            try {
                const { data: u } = await supabase.from('users').select('dob').eq('id', id).single();
                let meta = {};
                if (u?.dob && u.dob.startsWith('{')) {
                    try { meta = JSON.parse(u.dob); } catch (e) {}
                }
                meta.last_login = new Date().toISOString();
                await supabase.from('users').update({ dob: JSON.stringify(meta) }).eq('id', id);
            } catch (e) {}
        }
    }
};

module.exports = supabaseDb;

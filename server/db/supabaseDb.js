const { getSupabaseClient } = require('../supabase');
const { v4: uuidv4 } = require('uuid');
const cache = require('../cache');

/**
 * Single-Database Cloud Layer: Supabase (PostgreSQL)
 * Direct, centralized data access layer for all LPUQuick operations
 */

const supabaseDb = {
    // ==========================================
    // PRODUCTS
    // ==========================================
    products: {
        async getAll({ includeInactive = false, category, subcategory, sort } = {}) {
            const cacheKey = `products:${category || 'all'}:${subcategory || 'all'}:${sort || 'default'}:${includeInactive}`;
            return await cache.wrap(cacheKey, async () => {
                const supabase = getSupabaseClient();
                let query = supabase.from('products').select('*');

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

                const { data, error } = await query;
                if (error) {
                    console.error('[Supabase getAllProducts Error]:', error.message);
                    return [];
                }
                return (data || []).map(p => {
                    const match = (p.tags || '').match(/stock:(\d+)/);
                    const stock_left = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
                    return {
                        ...p,
                        stock_left
                    };
                });
            }, 60000);
        },

        async getById(id) {
            return await cache.wrap(`product:${id}`, async () => {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
                if (error || !data) return null;
                const match = (data.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (data.in_stock ? 50 : 0);
                return {
                    ...data,
                    stock_left
                };
            }, 60000);
        },

        async create(p) {
            const supabase = getSupabaseClient();
            const id = p.id || `prod_cust_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
            const price = Number(p.price);
            const mrp = p.mrp ? Number(p.mrp) : price;
            const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : 50;
            const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) : stock > 0;

            const baseTags = (p.tags || '').replace(/stock:\d+,?/g, '').trim();
            const finalTags = `stock:${stock}${baseTags ? ',' + baseTags : ''}`;

            const newProduct = {
                id,
                name: p.name,
                category: p.category,
                subcategory: p.subcategory || '',
                price,
                mrp,
                unit: p.unit || 'piece',
                size: p.size || 'Standard',
                image_url: p.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300',
                image_alt: p.image_alt || p.name,
                tags: finalTags,
                in_stock: inStock,
                bestseller: Boolean(p.bestseller),
                is_new: Boolean(p.is_new)
            };

            const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
            if (error) throw error;
            cache.invalidateProducts();
            return {
                ...data,
                stock_left: stock
            };
        },

        async update(id, updates) {
            const supabase = getSupabaseClient();
            const payload = {};

            if (updates.name !== undefined) payload.name = updates.name;
            if (updates.category !== undefined) payload.category = updates.category;
            if (updates.subcategory !== undefined) payload.subcategory = updates.subcategory;
            if (updates.price !== undefined) payload.price = Number(updates.price);
            if (updates.mrp !== undefined) payload.mrp = Number(updates.mrp);
            if (updates.unit !== undefined) payload.unit = updates.unit;
            if (updates.size !== undefined) payload.size = updates.size;
            if (updates.image_url !== undefined) payload.image_url = updates.image_url;
            if (updates.bestseller !== undefined) payload.bestseller = Boolean(updates.bestseller);

            if (updates.stock_left !== undefined) {
                const stock = Math.max(0, Number(updates.stock_left));
                const currentProduct = await this.getById(id);
                const baseTags = ((updates.tags !== undefined ? updates.tags : (currentProduct?.tags || ''))).replace(/stock:\d+,?/g, '').trim();
                payload.tags = `stock:${stock}${baseTags ? ',' + baseTags : ''}`;
                payload.in_stock = stock > 0;
            } else if (updates.tags !== undefined) {
                payload.tags = updates.tags;
            }

            if (updates.in_stock !== undefined && updates.stock_left === undefined) {
                payload.in_stock = Boolean(updates.in_stock);
            }

            const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
            if (error) throw error;
            cache.invalidateProducts();
            const match = (data.tags || '').match(/stock:(\d+)/);
            const stock_left = match ? parseInt(match[1], 10) : (data.in_stock ? 50 : 0);
            return {
                ...data,
                stock_left
            };
        },

        async delete(id) {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            cache.invalidateProducts();
            return true;
        },

        async getCategories() {
            return await cache.wrap('categories:all', async () => {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase.from('products').select('category, in_stock');
                if (error || !data) return [];

                const categoryMap = {};
                data.forEach(p => {
                    const cat = p.category || 'General';
                    if (!categoryMap[cat]) {
                        categoryMap[cat] = { name: cat, product_count: 0, in_stock_count: 0 };
                    }
                    categoryMap[cat].product_count++;
                    if (p.in_stock) categoryMap[cat].in_stock_count++;
                });

                return Object.values(categoryMap);
            }, 60000);
        }
    },


    // ==========================================
    // CART
    // ==========================================
    cart: {
        async getCart(userId) {
            const supabase = getSupabaseClient();
            const { data: cartItems, error } = await supabase
                .from('cart_items')
                .select(`
                    id, quantity, created_at,
                    products (
                        id, name, price, mrp, unit, size, image_url, image_alt, category, in_stock, tags
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error || !cartItems) {
                if (error) console.error('[Supabase getCart Error]:', error.message);
                return { items: [], pricing: this.calculatePricing([]) };
            }

            const items = cartItems.map(ci => {
                const match = (ci.products?.tags || '').match(/stock:(\d+)/);
                const stockLeft = match ? parseInt(match[1], 10) : (ci.products?.in_stock ? 50 : 0);
                return {
                    cart_id: ci.id,
                    product_id: ci.products?.id,
                    name: ci.products?.name,
                    price: ci.products?.price || 0,
                    mrp: ci.products?.mrp || ci.products?.price || 0,
                    unit: ci.products?.unit,
                    size: ci.products?.size,
                    image_url: ci.products?.image_url,
                    image_alt: ci.products?.image_alt,
                    category: ci.products?.category,
                    quantity: ci.quantity,
                    in_stock: ci.products?.in_stock ? 1 : 0,
                    stock_left: stockLeft
                };
            }).filter(i => i.product_id);

            const pricing = this.calculatePricing(items);
            return {
                items,
                pricing,
                item_count: items.reduce((sum, i) => sum + i.quantity, 0)
            };
        },

        calculatePricing(items) {
            const totalMrp = items.reduce((sum, item) => sum + ((Number(item.mrp) || Number(item.price) || 0) * item.quantity), 0);
            const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
            const mrpSavings = Math.max(0, totalMrp - subtotal);

            // 5% Extra Flat Offer for orders >= 350
            const has5PercentOffer = subtotal >= 350;
            const extraDiscount = has5PercentOffer ? Math.round(subtotal * 0.05) : 0;
            const finalToPay = Math.max(0, subtotal - extraDiscount);

            const deliverySavings = subtotal > 0 ? 25 : 0;
            const handlingSavings = subtotal > 0 ? 5 : 0;
            const totalSavings = mrpSavings + extraDiscount + deliverySavings + handlingSavings;

            return {
                total_mrp: totalMrp,
                mrp_savings: mrpSavings,
                subtotal,
                has_5_percent_offer: has5PercentOffer,
                extra_discount: extraDiscount,
                original_delivery_fee: subtotal > 0 ? 25 : 0,
                delivery_discount: deliverySavings,
                delivery_fee: 0,
                original_platform_fee: subtotal > 0 ? 5 : 0,
                platform_discount: handlingSavings,
                platform_fee: 0,
                tax: 0,
                total: finalToPay,
                total_savings: totalSavings,
                free_delivery_remaining: 0
            };
        },

        async addItem(userId, productId, quantity = 1) {
            const supabase = getSupabaseClient();

            // Validate product stock status and quantity limits before adding
            const product = await module.exports.products.getById(productId);
            if (!product) throw new Error('Product not found');

            const stockLimit = product.stock_left !== undefined && product.stock_left !== null ? Number(product.stock_left) : (product.in_stock ? 50 : 0);
            if (!product.in_stock || stockLimit <= 0) {
                throw new Error('This item is currently out of stock');
            }

            const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .single();

            if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty > stockLimit) {
                    throw new Error(`Only ${stockLimit} units available in stock`);
                }
                if (newQty <= 0) {
                    await supabase.from('cart_items').delete().eq('id', existing.id);
                } else {
                    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
                }
            } else if (quantity > 0) {
                if (quantity > stockLimit) {
                    throw new Error(`Only ${stockLimit} units available in stock`);
                }
                const id = `cart_${uuidv4().slice(0, 8)}`;
                await supabase.from('cart_items').insert([{
                    id,
                    user_id: userId,
                    product_id: productId,
                    quantity
                }]);
            }

            return this.getCart(userId);
        },

        async updateItem(cartId, quantity, userId) {
            const supabase = getSupabaseClient();
            if (quantity <= 0) {
                await supabase.from('cart_items').delete().eq('id', cartId);
            } else {
                // Enforce stock limit on quantity update
                const { data: cartItem } = await supabase.from('cart_items').select('product_id').eq('id', cartId).single();
                if (cartItem && cartItem.product_id) {
                    const product = await module.exports.products.getById(cartItem.product_id);
                    if (product) {
                        const stockLimit = product.stock_left !== undefined && product.stock_left !== null ? Number(product.stock_left) : (product.in_stock ? 50 : 0);
                        if (quantity > stockLimit) {
                            throw new Error(`Only ${stockLimit} units available in stock`);
                        }
                    }
                }
                await supabase.from('cart_items').update({ quantity }).eq('id', cartId);
            }
            return this.getCart(userId);
        },

        async clearCart(userId) {
            const supabase = getSupabaseClient();
            await supabase.from('cart_items').delete().eq('user_id', userId);
            return true;
        },

        async mergeCart(guestUserId, targetUserId) {
            if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
                return this.getCart(targetUserId);
            }
            const supabase = getSupabaseClient();
            const { data: guestItems } = await supabase
                .from('cart_items')
                .select('id, product_id, quantity')
                .eq('user_id', guestUserId);

            if (guestItems && guestItems.length > 0) {
                for (const gItem of guestItems) {
                    try {
                        await this.addItem(targetUserId, gItem.product_id, gItem.quantity);
                    } catch (e) {
                        // ignore stock overflow during merge
                    }
                }
                await supabase.from('cart_items').delete().eq('user_id', guestUserId);
            }
            return this.getCart(targetUserId);
        }
    },

    // ==========================================
    // ORDERS
    // ==========================================
    orders: {
        async createOrder(orderPayload, items) {
            const supabase = getSupabaseClient();
            
            // 1. Insert order with fallback if columns are still propagating in schema cache
            let createdOrder = null;
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .insert([orderPayload])
                    .select()
                    .single();

                if (!error && data) {
                    createdOrder = data;
                } else if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
                    // Fallback to core columns if optional snapshot columns are not yet in remote schema
                    console.warn('[Supabase createOrder fallback to core columns]:', error.message);
                    const coreOrderPayload = {
                        id: orderPayload.id,
                        user_id: orderPayload.user_id,
                        status: orderPayload.status || 'Order Placed',
                        subtotal: orderPayload.subtotal || 0,
                        delivery_fee: orderPayload.delivery_fee || 0,
                        platform_fee: orderPayload.platform_fee || 0,
                        tax: orderPayload.tax || 0,
                        total: orderPayload.total || 0,
                        payment_method: orderPayload.payment_method || 'Cash on Delivery',
                        payment_status: orderPayload.payment_status || 'pending',
                        rider_name: orderPayload.rider_name || 'Alex',
                        rider_lat: orderPayload.rider_lat || 31.2560,
                        rider_lng: orderPayload.rider_lng || 75.7030,
                        delivery_address: orderPayload.delivery_address || 'BH13 (Block A), Room 304'
                    };
                    const coreRes = await supabase.from('orders').insert([coreOrderPayload]).select().single();
                    if (coreRes.error) throw coreRes.error;
                    createdOrder = {
                        ...coreRes.data,
                        customer_name: orderPayload.customer_name,
                        customer_phone: orderPayload.customer_phone,
                        customer_email: orderPayload.customer_email
                    };
                } else if (error) {
                    throw error;
                }
            } catch (orderErr) {
                console.error('[Supabase createOrder Error]:', orderErr.message);
                throw orderErr;
            }

            // 2. Insert order items
            if (items && items.length > 0) {
                const orderItems = items.map(item => ({
                    id: `oi_${uuidv4().slice(0, 8)}`,
                    order_id: orderPayload.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price
                }));
                try {
                    await supabase.from('order_items').insert(orderItems);
                } catch (itemsErr) {
                    console.warn('[Supabase order_items insert warning]:', itemsErr.message);
                }
            }

            // 3. Clear cart
            try {
                await supabase.from('cart_items').delete().eq('user_id', orderPayload.user_id);
            } catch (cartErr) {}

            // 4. Automatically deduct stock from products table
            if (items && items.length > 0) {
                try {
                    const { broadcastInventoryUpdate } = require('../realtime');
                    for (const item of items) {
                        const pid = item.product_id;
                        if (!pid) continue;
                        const prod = await module.exports.products.getById(pid);

                        if (prod) {
                            const currentStock = Number(prod.stock_left !== undefined && prod.stock_left !== null ? prod.stock_left : 50);
                            const qty = Number(item.quantity || 1);
                            const newStock = Math.max(0, currentStock - qty);
                            const newInStock = newStock > 0;
                            await module.exports.products.update(pid, { stock_left: newStock, in_stock: newInStock });

                            cache.invalidateProducts();

                            try {
                                broadcastInventoryUpdate(pid, newStock, newInStock);
                            } catch (e) {}
                        }
                    }
                } catch (stockErr) {
                    console.error('[Stock Deduction Error]:', stockErr.message);
                }
            }

            return createdOrder;
        },

        async getOrdersByUser(userId) {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error || !data) return { active: [], past: [] };

            const activeStatuses = ['Order Placed', 'Order Confirmed', 'Preparing', 'Out for Delivery', 'pending', 'confirmed', 'accepted', 'packed', 'en_route'];
            const active = data.filter(o => activeStatuses.includes(o.status));
            const past = data.filter(o => !activeStatuses.includes(o.status));

            return { active, past };
        },

        async getOrderById(orderId) {
            const supabase = getSupabaseClient();
            const { data: order, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error || !order) return null;

            const { data: items } = await supabase
                .from('order_items')
                .select(`
                    id, quantity, unit_price,
                    products (id, name, image_url, image_alt)
                `)
                .eq('order_id', orderId);

            return {
                ...order,
                items: (items || []).map(i => ({
                    id: i.id,
                    product_id: i.products?.id,
                    name: i.products?.name,
                    image_url: i.products?.image_url,
                    image_alt: i.products?.image_alt,
                    unit_price: i.unit_price,
                    quantity: i.quantity
                }))
            };
        },

        async getAllOrders() {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            return data || [];
        },

        async updateStatus(orderId, status) {
            const supabase = getSupabaseClient();
            
            // Get previous status
            const { data: prevOrder } = await supabase
                .from('orders')
                .select('id, status')
                .eq('id', orderId)
                .single();

            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;

            // If transitioned to Cancelled, replenish stock back into inventory!
            if (status === 'Cancelled' && prevOrder && prevOrder.status !== 'Cancelled') {
                try {
                    const { broadcastInventoryUpdate } = require('../realtime');
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('product_id, quantity')
                        .eq('order_id', orderId);

                    if (items && items.length > 0) {
                        for (const item of items) {
                            const pid = item.product_id;
                            if (!pid) continue;
                            const prod = await supabaseDb.products.getById(pid);

                            if (prod) {
                                const currentStock = Number(prod.stock_left !== undefined && prod.stock_left !== null ? prod.stock_left : 0);
                                const qty = Number(item.quantity || 1);
                                const newStock = currentStock + qty;
                                const newInStock = true;
                                await supabaseDb.products.update(pid, { stock_left: newStock, in_stock: newInStock });

                                cache.invalidateProducts();

                                try {
                                    broadcastInventoryUpdate(pid, newStock, newInStock);
                                } catch (e) {}
                            }
                        }
                    }
                } catch (replenishErr) {
                    console.error('[Stock Replenish Error]:', replenishErr.message);
                }
            }

            return data;
        }
    },

    // ==========================================
    // USERS / AUTH
    // ==========================================
    users: {
        async getById(id) {
            const supabase = getSupabaseClient();
            if (!supabase || !id) return null;
            try {
                const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
                if (error || !data) return null;
                return {
                    ...data,
                    role: data.role || 'student',
                    account_status: data.account_status || 'ACTIVE'
                };
            } catch (e) {
                console.warn('[Supabase getById Warning]:', e.message);
                return null;
            }
        },

        async getByIdentifier(identifier) {
            const supabase = getSupabaseClient();
            if (!supabase || !identifier) return null;
            const trimmed = identifier.trim().toLowerCase();
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .or(`email.ilike.${trimmed},phone.eq.${identifier.trim()}`)
                    .limit(1);

                if (error || !data || data.length === 0) return null;
                const user = data[0];
                return {
                    ...user,
                    role: user.role || 'student',
                    account_status: user.account_status || 'ACTIVE'
                };
            } catch (e) {
                console.warn('[Supabase getByIdentifier Warning]:', e.message);
                return null;
            }
        },

        async createUser(userData) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('Supabase client not initialized');
            const payload = { ...userData };
            if (!payload.phone || payload.phone.trim() === '') {
                payload.phone = null;
            }

            // Always ensure standard role & status
            const targetRole = payload.role || 'student';
            const targetStatus = payload.account_status || 'ACTIVE';

            // 1. Build sanitized core payload that matches standard users table
            const corePayload = {
                id: payload.id,
                name: payload.name || 'LPU Student',
                email: payload.email ? payload.email.trim().toLowerCase() : null,
                phone: payload.phone || null,
                password_hash: payload.password_hash || 'google_oauth',
                role: targetRole
            };

            // Attempt 1: Standard core insert
            try {
                const { data, error } = await supabase.from('users').insert([corePayload]).select().single();
                if (!error && data) {
                    return {
                        ...data,
                        role: data.role || targetRole,
                        account_status: data.account_status || targetStatus
                    };
                }

                // If error is schema cache or missing column, fallback to minimal payload
                if (error && (error.message?.includes('column') || error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
                    console.warn('[Supabase createUser fallback to minimal columns]:', error.message);
                    const minimalPayload = {
                        id: payload.id,
                        name: payload.name || 'LPU Student',
                        email: payload.email ? payload.email.trim().toLowerCase() : null
                    };
                    if (payload.phone) minimalPayload.phone = payload.phone;
                    if (payload.password_hash) minimalPayload.password_hash = payload.password_hash;

                    const minRes = await supabase.from('users').insert([minimalPayload]).select().single();
                    if (!minRes.error && minRes.data) {
                        return {
                            ...minRes.data,
                            role: targetRole,
                            account_status: targetStatus
                        };
                    }

                    // Fallback to absolute base { id, name, email }
                    const ultraMin = { id: payload.id, name: payload.name || 'LPU Student', email: payload.email };
                    const ultraRes = await supabase.from('users').insert([ultraMin]).select().single();
                    if (!ultraRes.error && ultraRes.data) {
                        return {
                            ...ultraRes.data,
                            role: targetRole,
                            account_status: targetStatus
                        };
                    }
                    if (ultraRes.error) throw ultraRes.error;
                }

                if (error) throw error;
            } catch (err) {
                // Defensive fallback: check if user was already created during concurrent requests
                if (err.message?.includes('duplicate key') || err.message?.includes('users_pkey') || err.message?.includes('users_email_key') || err.message?.includes('users_phone_key')) {
                    const existing = await this.getByIdentifier(payload.email || payload.phone || payload.id);
                    if (existing) return existing;
                }
                console.error('[Supabase createUser Error]:', err.message);
                throw err;
            }
        },

        async updatePhone(userId, phone) {
            const supabase = getSupabaseClient();
            if (!supabase || !userId) return null;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .update({ phone: phone ? phone.trim() : null })
                    .eq('id', userId)
                    .select()
                    .single();
                if (error) {
                    console.warn('[Supabase updatePhone Warning]:', error.message);
                }
                return data;
            } catch (e) {
                console.warn('[Supabase updatePhone Error]:', e.message);
                return null;
            }
        },

        async updateAccountStatus(userId, status, blockedBy = null, reason = null) {
            const supabase = getSupabaseClient();
            if (!supabase || !userId) return null;
            const payload = {
                account_status: status,
                blocked_at: status === 'BLOCKED' ? new Date().toISOString() : null,
                blocked_by: status === 'BLOCKED' ? blockedBy : null,
                block_reason: status === 'BLOCKED' ? reason : null
            };
            try {
                const { data, error } = await supabase
                    .from('users')
                    .update(payload)
                    .eq('id', userId)
                    .select()
                    .single();
                if (!error && data) return data;

                // If column doesn't exist in users table, fallback via password_hash encoding
                if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
                    console.warn('[Supabase updateAccountStatus fallback via password_hash]:', error.message);
                    if (status === 'BLOCKED') {
                        const blockedHash = `BLOCKED:${reason || 'Fake Orders'}::google_oauth`;
                        await supabase.from('users').update({ password_hash: blockedHash }).eq('id', userId);
                    } else {
                        await supabase.from('users').update({ password_hash: 'google_oauth' }).eq('id', userId);
                    }
                    return { id: userId, account_status: status };
                }
            } catch (e) {
                console.warn('[Supabase updateAccountStatus Warning]:', e.message);
            }
            return { id: userId, account_status: status };
        },

        async getAllCustomersWithMetrics() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            let users = [];
            try {
                const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
                if (!error && data) {
                    users = data.filter(u => !u.id?.startsWith('__system_') && !u.email?.includes('@lpuquick.internal'));
                } else if (error) {
                    console.warn('[Supabase users fetch warning]:', error.message);
                }
            } catch (err) {

                console.warn('[Supabase Users Query Warning]:', err.message);
            }

            let orders = [];
            try {
                const { data, error } = await supabase.from('orders').select('user_id, total, created_at');
                if (!error && data) orders = data;
            } catch (err) {
                console.warn('[Supabase Orders Query Warning]:', err.message);
            }

            let blacklistMap = new Map();
            try {
                const { data, error } = await supabase.from('blacklisted_users').select('*').eq('status', 'BLOCKED');
                if (!error && data) {
                    data.forEach(b => blacklistMap.set(b.user_id, b));
                }
            } catch (err) {}

            // Also check memory blacklist fallback
            if (supabaseDb.blacklist && supabaseDb.blacklist._memoryBlacklist) {
                for (const [uid, b] of supabaseDb.blacklist._memoryBlacklist.entries()) {
                    if (b.status === 'BLOCKED' && !blacklistMap.has(uid)) {
                        blacklistMap.set(uid, b);
                    }
                }
            }

            const customerStats = {};
            orders.forEach(o => {
                if (!o.user_id) return;
                if (!customerStats[o.user_id]) {
                    customerStats[o.user_id] = { order_count: 0, total_spent: 0, last_order_date: null };
                }
                customerStats[o.user_id].order_count++;
                customerStats[o.user_id].total_spent += Number(o.total) || 0;
                const orderDate = new Date(o.created_at);
                if (!customerStats[o.user_id].last_order_date || orderDate > new Date(customerStats[o.user_id].last_order_date)) {
                    customerStats[o.user_id].last_order_date = o.created_at;
                }
            });

            return users.map(u => {
                const isBlocked = u.account_status === 'BLOCKED' || blacklistMap.has(u.id);
                const blRecord = blacklistMap.get(u.id);
                return {
                    id: u.id,
                    name: u.name || 'Student',
                    email: u.email || '',
                    phone: u.phone || '',
                    address: u.dob || '',
                    role: u.role || (u.email?.includes('admin') ? 'admin' : 'student'),
                    account_status: isBlocked ? 'BLOCKED' : 'ACTIVE',
                    blocked_at: u.blocked_at || blRecord?.blocked_at || null,
                    blocked_by: u.blocked_by || blRecord?.blocked_by || null,
                    block_reason: u.block_reason || blRecord?.reason || (isBlocked ? 'Fake Orders' : null),
                    order_count: customerStats[u.id]?.order_count || 0,
                    total_spent: Math.round(customerStats[u.id]?.total_spent || 0),
                    last_order_date: customerStats[u.id]?.last_order_date || null,
                    created_at: u.created_at
                };
            });
        }
    },

    // ==========================================
    // APP AVAILABILITY & STORE LOCK
    // ==========================================
    availability: {
        // In-memory persistent fallback if table being created
        _memoryState: {
            id: 'store_main',
            is_locked: false,
            lock_type: 'NONE',
            message: null,
            start_at: null,
            end_at: null,
            profit_locked: true,
            created_by: null,
            updated_at: new Date().toISOString()
        },

        formatReopeningTime(endAtDate, timeZone = 'Asia/Kolkata') {
            if (!endAtDate) return null;
            const end = new Date(endAtDate);
            if (isNaN(end.getTime())) return null;

            const now = new Date();

            // Date comparison in target campus timezone (Asia/Kolkata)
            const dateOpts = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
            const nowDateStr = new Intl.DateTimeFormat('en-CA', dateOpts).format(now);
            const endDateStr = new Intl.DateTimeFormat('en-CA', dateOpts).format(end);

            const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
            const tomorrowDateStr = new Intl.DateTimeFormat('en-CA', dateOpts).format(tomorrow);

            const isToday = (endDateStr === nowDateStr);
            const isTomorrow = (endDateStr === tomorrowDateStr);

            // Format 12-hour time in Asia/Kolkata (e.g. 6:00 pm, 6:11 pm, 6:00 am)
            const timeFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            const timeStr = timeFormatter.format(end).toLowerCase();

            let dayWording = 'today';
            if (isToday) {
                dayWording = 'today';
            } else if (isTomorrow) {
                dayWording = 'tomorrow';
            } else {
                const dayFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone,
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                dayWording = `on ${dayFormatter.format(end)}`;
            }

            return {
                timeStr,
                dayWording,
                fullHeadline: `We'll reopen at ${timeStr}, ${dayWording}`
            };
        },


        async getRawRecord() {
            return await cache.wrap('availability:raw', async () => {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        const { data, error } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', '__system_store_availability__')
                            .single();

                        if (!error && data && data.password_hash) {
                            try {
                                const parsed = JSON.parse(data.password_hash);
                                this._memoryState = { ...this._memoryState, ...parsed };
                                return this._memoryState;
                            } catch (parseErr) {}
                        }
                    }
                } catch (e) {
                    console.warn('[Availability Fetch Warning]:', e.message);
                }
                return this._memoryState;
            }, 3000);
        },

        async getStatus() {
            const raw = await this.getRawRecord();
            const now = Date.now();
            let effectiveLocked = Boolean(raw.is_locked);
            let lockStatus = effectiveLocked ? 'LOCKED' : 'AVAILABLE';
            let remainingSeconds = null;
            let reopenAt = raw.end_at || null;
            let displayReopen = null;

            if (raw.lock_type === 'SCHEDULED') {
                const startTime = raw.start_at ? new Date(raw.start_at).getTime() : 0;
                const endTime = raw.end_at ? new Date(raw.end_at).getTime() : 0;

                if (startTime > 0 && now < startTime) {
                    // Scheduled for the future, currently available
                    lockStatus = 'SCHEDULED';
                    effectiveLocked = false;
                } else if (startTime > 0 && endTime > 0 && now >= startTime && now < endTime) {
                    // Active scheduled lock
                    lockStatus = 'LOCKED';
                    effectiveLocked = true;
                    remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                    displayReopen = this.formatReopeningTime(raw.end_at);
                } else if (endTime > 0 && now >= endTime) {
                    // Schedule expired -> automatically available!
                    lockStatus = 'AVAILABLE';
                    effectiveLocked = false;
                } else {
                    lockStatus = raw.is_locked ? 'LOCKED' : 'AVAILABLE';
                    effectiveLocked = Boolean(raw.is_locked);
                }
            } else if (raw.lock_type === 'DURATION') {
                const endTime = raw.end_at ? new Date(raw.end_at).getTime() : 0;
                if (endTime > 0) {
                    if (now < endTime) {
                        lockStatus = 'LOCKED';
                        effectiveLocked = true;
                        remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                        displayReopen = this.formatReopeningTime(raw.end_at);
                    } else {
                        // Duration expired -> automatically available!
                        lockStatus = 'AVAILABLE';
                        effectiveLocked = false;
                    }
                } else {
                    lockStatus = raw.is_locked ? 'LOCKED' : 'AVAILABLE';
                    effectiveLocked = Boolean(raw.is_locked);
                }
            } else if (raw.lock_type === 'IMMEDIATE' || raw.lock_type === 'MANUAL') {
                if (raw.is_locked) {
                    lockStatus = 'LOCKED';
                    effectiveLocked = true;
                    if (raw.end_at) {
                        const endTime = new Date(raw.end_at).getTime();
                        if (endTime > now) {
                            remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
                            displayReopen = this.formatReopeningTime(raw.end_at);
                        } else {
                            // Expired
                            lockStatus = 'AVAILABLE';
                            effectiveLocked = false;
                        }
                    }
                } else {
                    lockStatus = 'AVAILABLE';
                    effectiveLocked = false;
                }
            } else {
                lockStatus = effectiveLocked ? 'LOCKED' : 'AVAILABLE';
            }


            return {
                is_locked: effectiveLocked,
                lock_status: lockStatus,
                lock_type: raw.lock_type || 'NONE',
                message: raw.message || null,
                start_at: raw.start_at || null,
                end_at: raw.end_at || null,
                reopen_at: reopenAt,
                remaining_seconds: remainingSeconds,
                display_reopen: displayReopen,
                profit_locked: raw.profit_locked !== undefined ? Boolean(raw.profit_locked) : true,
                server_time: new Date().toISOString()
            };
        },

        async setLock({ is_locked, lock_type = 'IMMEDIATE', message = null, start_at = null, end_at = null, created_by = null }) {
            const payload = {
                id: 'store_main',
                is_locked: Boolean(is_locked),
                lock_type,
                message: message ? message.trim() : null,
                start_at: start_at ? new Date(start_at).toISOString() : null,
                end_at: end_at ? new Date(end_at).toISOString() : null,
                created_by,
                profit_locked: this._memoryState.profit_locked !== undefined ? this._memoryState.profit_locked : true,
                updated_at: new Date().toISOString()
            };

            this._memoryState = { ...this._memoryState, ...payload };
            cache.invalidateAvailability();

            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('users').upsert({
                        id: '__system_store_availability__',
                        name: 'System Store State',
                        email: 'system_availability@lpuquick.internal',
                        password_hash: JSON.stringify(this._memoryState),
                        dob: 'System Config'
                    });
                }
            } catch (e) {
                console.warn('[Supabase setLock Upsert Warning]:', e.message);
            }

            return this.getStatus();
        },

        async unlock(adminId = null) {
            cache.invalidateAvailability();
            return this.setLock({
                is_locked: false,
                lock_type: 'NONE',
                message: null,
                start_at: null,
                end_at: null,
                created_by: adminId
            });
        },

        async getProfitVisibility() {
            const raw = await this.getRawRecord();
            return raw.profit_locked !== undefined ? Boolean(raw.profit_locked) : true;
        },

        async setProfitVisibility(locked, adminId = null) {
            const isLocked = Boolean(locked);
            this._memoryState.profit_locked = isLocked;
            this._memoryState.updated_at = new Date().toISOString();
            cache.invalidateAvailability();

            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('users').upsert({
                        id: '__system_store_availability__',
                        name: 'System Store State',
                        email: 'system_availability@lpuquick.internal',
                        password_hash: JSON.stringify(this._memoryState),
                        dob: 'System Config'
                    });
                }
            } catch (e) {
                console.warn('[Supabase setProfitVisibility Upsert Warning]:', e.message);
            }

            return { profit_locked: isLocked };
        }
    },


    // ==========================================
    // USER BLACKLIST & FRAUD PREVENTION
    // ==========================================
    blacklist: {
        _memoryBlacklist: new Map(),

        async isUserBlacklisted(userId) {
            if (!userId) return { isBlacklisted: false };
            
            // 1. Check memory cache
            if (this._memoryBlacklist.has(userId)) {
                const rec = this._memoryBlacklist.get(userId);
                return { isBlacklisted: true, record: rec, reason: rec.reason || 'Fake Orders' };
            }

            // 2. Check Supabase users table
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data: user } = await supabase.from('users').select('id, name, email, phone, password_hash').eq('id', userId).single();
                    if (user && user.password_hash && user.password_hash.startsWith('BLOCKED:')) {
                        const reason = user.password_hash.split('BLOCKED:')[1].split('::')[0] || 'Fake Orders';
                        const rec = { user_id: userId, reason, status: 'BLOCKED' };
                        this._memoryBlacklist.set(userId, rec);
                        return {
                            isBlacklisted: true,
                            reason,
                            record: rec
                        };
                    }
                }
            } catch (e) {
                console.warn('[Blacklist Check Warning]:', e.message);
            }

            return { isBlacklisted: false };
        },

        async getAll() {
            const memoryList = Array.from(this._memoryBlacklist.values());
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data: users } = await supabase.from('users').select('*');
                    if (users) {
                        const blockedUsers = users.filter(u => u.password_hash && u.password_hash.startsWith('BLOCKED:'));
                        const dbList = blockedUsers.map(u => {
                            const reason = u.password_hash.split('BLOCKED:')[1].split('::')[0] || 'Fake Orders';
                            return {
                                id: `bl_${u.id}`,
                                user_id: u.id,
                                customer_name: u.name || 'Student',
                                customer_email: u.email || '',
                                customer_phone: u.phone || '',
                                reason: reason,
                                status: 'BLOCKED',
                                blocked_by: 'Admin',
                                blocked_at: u.created_at,
                                notes: ''
                            };
                        });
                        const combinedMap = new Map();
                        dbList.forEach(b => combinedMap.set(b.user_id, b));
                        memoryList.forEach(b => {
                            if (b.status === 'BLOCKED') combinedMap.set(b.user_id, b);
                        });
                        return Array.from(combinedMap.values());
                    }
                }
            } catch (e) {
                console.warn('[Blacklist GetAll Warning]:', e.message);
            }

            return memoryList;
        },


        async blockUser({ userId, reason = 'Fake Orders', notes = '', blockedBy = 'Admin' }) {
            if (!userId) throw new Error('userId is required');

            const id = `bl_${uuidv4().slice(0, 8)}`;
            const blockedAt = new Date().toISOString();

            const record = {
                id,
                user_id: userId,
                reason,
                status: 'BLOCKED',
                blocked_by: blockedBy,
                blocked_at: blockedAt,
                notes,
                created_at: blockedAt,
                updated_at: blockedAt
            };

            this._memoryBlacklist.set(userId, record);

            // Update database permanently in PostgreSQL
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
                    if (user) {
                        const currentHash = user.password_hash || 'google_oauth';
                        const cleanHash = currentHash.startsWith('BLOCKED:') ? (currentHash.includes('::') ? currentHash.split('::')[1] : 'google_oauth') : currentHash;
                        const blockedHash = `BLOCKED:${reason}::${cleanHash}`;
                        await supabase.from('users').update({ password_hash: blockedHash }).eq('id', userId);
                    }
                }
            } catch (e) {
                console.warn('[Supabase Block User DB Warning]:', e.message);
            }

            return record;
        },

        async unblockUser({ userId, unblockedBy = 'Admin' }) {
            if (!userId) throw new Error('userId is required');

            this._memoryBlacklist.delete(userId);

            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
                    if (user && user.password_hash && user.password_hash.startsWith('BLOCKED:')) {
                        const restoredHash = user.password_hash.includes('::') ? user.password_hash.split('::')[1] : 'google_oauth';
                        await supabase.from('users').update({ password_hash: restoredHash }).eq('id', userId);
                    }
                }
            } catch (e) {
                console.warn('[Supabase Unblock User DB Warning]:', e.message);
            }

            return { success: true, userId, status: 'ACTIVE' };
        }

    },

    // ==========================================
    // AUDIT LOGS
    // ==========================================
    audit: {
        _memoryLogs: [],

        async logAction({ adminId, targetUserId = null, action, reason = null, metadata = null }) {
            const id = `audit_${uuidv4().slice(0, 8)}`;
            const payload = {
                id,
                admin_id: adminId || 'admin_system',
                target_user_id: targetUserId,
                action,
                reason,
                metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
                created_at: new Date().toISOString()
            };

            this._memoryLogs.unshift(payload);

            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('audit_logs').insert([payload]);
                }
            } catch (e) {
                console.warn('[Audit Log Insert Warning]:', e.message);
            }

            return payload;
        },

        async getLogs(limit = 50) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data, error } = await supabase
                        .from('audit_logs')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(limit);
                    if (!error && data && data.length > 0) return data;
                }
            } catch (e) {
                console.warn('[Audit Log Fetch Warning]:', e.message);
            }
            return this._memoryLogs.slice(0, limit);
        }
    },


    // ==========================================
    // PROFIT SECURITY & FINANCIAL CALCULATION
    // ==========================================
    profits: {
        async calculateDeliveredProfits() {
            const supabase = getSupabaseClient();
            if (!supabase) return { revenue: 0, total_costs: 0, net_profit: 0, margin_percent: 0, delivered_orders_count: 0 };

            // Fetch delivered orders and order items
            const [ordersRes, orderItemsRes, productsRes] = await Promise.all([
                supabase.from('orders').select('id, total, status').in('status', ['Delivered', 'delivered']),
                supabase.from('order_items').select('order_id, product_id, quantity, unit_price'),
                supabase.from('products').select('id, price, cost_price')
            ]);

            const deliveredOrders = ordersRes.data || [];
            const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));
            const products = productsRes.data || [];
            const productCostMap = new Map(products.map(p => [p.id, Number(p.cost_price || Math.round(Number(p.price || 0) * 0.70))]));

            const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

            let totalProductCosts = 0;
            (orderItemsRes.data || []).forEach(item => {
                if (deliveredOrderIds.has(item.order_id)) {
                    const unitCost = productCostMap.get(item.product_id) || Math.round(Number(item.unit_price || 0) * 0.70);
                    totalProductCosts += unitCost * (Number(item.quantity) || 1);
                }
            });

            // If no individual item breakdown, calculate standard retail cost
            if (totalProductCosts === 0 && totalRevenue > 0) {
                totalProductCosts = Math.round(totalRevenue * 0.70);
            }

            const netProfit = Math.max(0, Math.round(totalRevenue - totalProductCosts));
            const marginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

            return {
                revenue: Math.round(totalRevenue),
                total_costs: Math.round(totalProductCosts),
                net_profit: netProfit,
                margin_percent: marginPercent,
                delivered_orders_count: deliveredOrders.length
            };
        }
    }
};

module.exports = supabaseDb;


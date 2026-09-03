const { getSupabaseClient } = require('../supabase');
const { v4: uuidv4 } = require('uuid');
const cache = require('../cache');

/**
 * Pure PostgreSQL Database Repository for LPUQuick
 * Backed 100% by PostgreSQL via Supabase PostgREST (Serverless-compatible, zero SQLite dependencies).
 */
const supabaseDb = {
    // ==========================================
    // PRODUCTS
    // ==========================================
    products: {
        _formatProduct(p) {
            if (!p) return null;
            const match = (p.tags || '').match(/stock:(\d+)/);
            const stock_left = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
            return {
                ...p,
                description: p.size || p.name,
                badge: p.bestseller ? 'Bestseller' : (p.is_new ? 'New' : ''),
                rating: 4.5,
                is_active: true,
                stock_left
            };
        },

        async getAll({ includeInactive = false, category, subcategory, sort } = {}) {
            const cacheKey = `products:${category || 'all'}:${subcategory || 'all'}:${sort || 'default'}:${includeInactive}`;
            return await cache.wrap(cacheKey, async () => {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error('PostgreSQL client unavailable. Verify SUPABASE_URL and credentials.');

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

                const { data, error } = await query;
                if (error) throw new Error(`PostgreSQL query error: ${error.message}`);

                return (data || []).map(p => this._formatProduct(p));
            }, 300000); // 5-minute single-flight micro-cache (drastically reduces DB egress)
        },

        async getById(id) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error) throw new Error(`PostgreSQL product fetch error: ${error.message}`);
            if (!data) return null;

            return this._formatProduct(data);
        },

        async getByIds(ids) {
            if (!ids || ids.length === 0) return [];
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .in('id', ids);

            if (error) return [];
            return (data || []).map(p => this._formatProduct(p));
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

        async search(queryText) {
            if (!queryText) return [];
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const clean = queryText.trim();
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .or(`name.ilike.%${clean}%,category.ilike.%${clean}%,tags.ilike.%${clean}%`)
                .limit(50);

            if (error || !data) return [];
            return data.map(p => this._formatProduct(p));
        },

        async getRandom(limit = 10) {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('in_stock', true)
                .limit(50);

            if (error || !data) return [];
            const shuffled = [...data].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, limit).map(p => this._formatProduct(p));
        },

        async create(productData) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const id = productData.id || `prod_${uuidv4().slice(0, 8)}`;
            const stockNum = productData.stock_left !== undefined ? parseInt(productData.stock_left, 10) : 50;
            const inStock = stockNum > 0 && productData.in_stock !== false;

            const existingTags = (productData.tags || '')
                .split(',')
                .map(t => t.trim())
                .filter(t => t && !t.startsWith('stock:'));
            existingTags.push(`stock:${stockNum}`);
            const finalTags = existingTags.join(', ');

            const record = {
                id,
                name: productData.name,
                category: productData.category || 'Snacks & Drinks',
                subcategory: productData.subcategory || '',
                price: Number(productData.price) || 0,
                mrp: Number(productData.mrp || productData.price) || 0,
                unit: productData.unit || 'piece',
                size: productData.size || productData.description || '',
                image_url: productData.image_url || '',
                image_alt: productData.image_alt || productData.name || '',
                in_stock: inStock,
                bestseller: Boolean(productData.bestseller),
                is_new: Boolean(productData.is_new),
                tags: finalTags
            };

            const { data, error } = await supabase
                .from('products')
                .insert([record])
                .select()
                .single();

            if (error) throw new Error(`PostgreSQL product insert error: ${error.message}`);
            cache.invalidateProducts();
            return this._formatProduct(data);
        },

        async update(id, updates) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const updateFields = {};
            if (updates.name !== undefined) updateFields.name = updates.name;
            if (updates.category !== undefined) updateFields.category = updates.category;
            if (updates.subcategory !== undefined) updateFields.subcategory = updates.subcategory;
            if (updates.price !== undefined) updateFields.price = Number(updates.price);
            if (updates.mrp !== undefined) updateFields.mrp = Number(updates.mrp);
            if (updates.unit !== undefined) updateFields.unit = updates.unit;
            if (updates.size !== undefined) updateFields.size = updates.size;
            if (updates.image_url !== undefined) updateFields.image_url = updates.image_url;
            if (updates.image_alt !== undefined) updateFields.image_alt = updates.image_alt;
            if (updates.in_stock !== undefined) updateFields.in_stock = Boolean(updates.in_stock);
            if (updates.bestseller !== undefined) updateFields.bestseller = Boolean(updates.bestseller);
            if (updates.is_new !== undefined) updateFields.is_new = Boolean(updates.is_new);
            if (updates.tags !== undefined) updateFields.tags = updates.tags;

            if (updates.stock_left !== undefined) {
                const stockNum = parseInt(updates.stock_left, 10) || 0;
                const existing = await this.getById(id);
                const currentTags = (existing?.tags || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t && !t.startsWith('stock:'));
                currentTags.push(`stock:${stockNum}`);
                updateFields.tags = currentTags.join(', ');
                updateFields.in_stock = stockNum > 0;
            }

            const { data, error } = await supabase
                .from('products')
                .update(updateFields)
                .eq('id', id)
                .select()
                .single();

            if (error) throw new Error(`PostgreSQL product update error: ${error.message}`);
            cache.invalidateProducts();

            return this._formatProduct(data);
        },

        async adjustStock(id, delta) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const product = await this.getById(id);
            if (!product) throw new Error('Product not found');

            const newStock = Math.max(0, (product.stock_left || 0) + delta);
            return await this.update(id, { stock_left: newStock });
        },

        async toggleStock(id) {
            const product = await this.getById(id);
            if (!product) throw new Error('Product not found');
            const newInStock = !product.in_stock;
            const newStock = newInStock ? 50 : 0;
            return await this.update(id, { in_stock: newInStock, stock_left: newStock });
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

            const items = data.map(item => {
                const prod = item.products || {};
                const match = (prod.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (prod.in_stock !== false ? 50 : 0);
                return {
                    id: item.id,
                    cart_id: item.id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    quantity: Number(item.quantity) || 1,
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

            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const delivery_fee = 0;
            const platform_fee = 0;
            const tax = 0;
            const total = subtotal + delivery_fee + platform_fee + tax;
            const total_savings = subtotal > 0 ? 30 : 0;

            return {
                items,
                pricing: {
                    subtotal,
                    delivery_fee,
                    platform_fee,
                    tax,
                    total,
                    total_savings,
                    deliveryFee: delivery_fee,
                    platformFee: platform_fee
                }
            };
        },

        async addItem(userId, productId, quantity = 1) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');
            if (!userId || !productId) throw new Error('userId and productId are required');

            const reqQty = Number(quantity) || 1;

            const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .maybeSingle();

            if (existing) {
                const newQty = existing.quantity + reqQty;
                if (newQty <= 0) {
                    await supabase.from('cart_items').delete().eq('id', existing.id);
                } else {
                    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
                }
            } else if (reqQty > 0) {
                const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                await supabase.from('cart_items').insert([{
                    id,
                    user_id: userId,
                    product_id: productId,
                    quantity: reqQty
                }]);
            }

            return await this.getCart(userId);
        },

        async updateItem(cartId, quantity, userId) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');
            if (!cartId) throw new Error('cartId is required');

            const targetQty = Number(quantity);
            let effectiveUserId = userId;

            if (!effectiveUserId || effectiveUserId === 'guest_cart') {
                const { data: item } = await supabase
                    .from('cart_items')
                    .select('user_id')
                    .eq('id', cartId)
                    .maybeSingle();
                if (item?.user_id) effectiveUserId = item.user_id;
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
                for (const item of guestItems) {
                    await this.addItem(targetUserId, item.product_id, item.quantity);
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
                .select('id, name, price, cost_price, tags, in_stock')
                .in('id', productIds);

            if (prodFetchErr) throw new Error(`Failed to verify products: ${prodFetchErr.message}`);
            const prodMap = new Map((dbProducts || []).map(p => [p.id, p]));

            const stockUpdates = [];
            for (const item of items) {
                const p = prodMap.get(item.product_id);
                if (!p) {
                    throw new Error(`Product "${item.name || item.product_id}" is no longer available in the campus store.`);
                }
                const match = (p.tags || '').match(/stock:(\d+)/);
                const currentStock = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
                const reqQty = Math.max(1, Number(item.quantity) || 1);

                if (!p.in_stock || currentStock <= 0) {
                    throw new Error(`"${p.name}" is currently out of stock.`);
                }
                if (reqQty > currentStock) {
                    throw new Error(`Only ${currentStock} unit(s) of "${p.name}" available. Please adjust quantity.`);
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
                    quantity: reqQty
                });
            }

            const orderId = orderPayload.id || `order_${uuidv4().slice(0, 8)}`;
            const coreOrderPayload = {
                id: orderId,
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
                delivery_address: orderPayload.delivery_address || 'BH13 (Block A), Room 304'
            };

            // 2. Insert core order record
            const { data: orderData, error: orderErr } = await supabase
                .from('orders')
                .insert([coreOrderPayload])
                .select()
                .single();

            if (orderErr) throw new Error(`PostgreSQL order creation failed: ${orderErr.message}`);

            // 3. Insert line items
            const formattedItems = items.map(item => {
                const matched = stockUpdates.find(s => s.productId === item.product_id);
                return {
                    id: item.id || `item_${uuidv4().slice(0, 8)}`,
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

            // 4. Atomically decrement stock in PostgreSQL using Concurrent Compare-and-Swap (CAS) Guard
            const appliedStockUpdates = [];
            try {
                await Promise.all(stockUpdates.map(async su => {
                    let updateQuery = supabase
                        .from('products')
                        .update({
                            tags: su.updatedTags,
                            in_stock: su.newInStock
                        })
                        .eq('id', su.productId);

                    // If tags were previously defined, enforce optimistic concurrency check
                    if (su.originalTags) {
                        updateQuery = updateQuery.eq('tags', su.originalTags);
                    }

                    const { data: updatedRows, error: stockErr } = await updateQuery.select('id');

                    if (stockErr) throw stockErr;
                    if (su.originalTags && (!updatedRows || updatedRows.length === 0)) {
                        throw new Error(`Item "${su.name}" was just purchased by another student. Stock is no longer available.`);
                    }
                    appliedStockUpdates.push(su);
                }));
            } catch (stockUpdateErr) {
                // Rollback order items & order
                await supabase.from('order_items').delete().eq('order_id', orderId);
                await supabase.from('orders').delete().eq('id', orderId);

                // Rollback any partially applied stock decrements
                for (const revert of appliedStockUpdates) {
                    const revertTags = revert.updatedTags.replace(`stock:${revert.newStock}`, `stock:${revert.previousStock}`);
                    await supabase.from('products').update({
                        tags: revertTags,
                        in_stock: revert.previousStock > 0
                    }).eq('id', revert.productId).catch(() => {});
                }

                throw new Error(stockUpdateErr.message);
            }

            cache.invalidateOrders();
            cache.invalidateProducts();

            return {
                ...orderData,
                items: formattedItems.map(it => ({ ...it, price: it.unit_price })),
                stockUpdates
            };
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

            return {
                ...order,
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
                const full = {
                    ...o,
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

        async getAllOrders() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data: orders, error } = await supabase
                .from('orders')
                .select('*, order_items(*, products(*))')
                .order('created_at', { ascending: false });

            if (error || !orders) return [];
            return orders.map(o => {
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
                    items: formattedItems,
                    item_names: itemNames || o.item_names || 'Campus Groceries & Essentials'
                };
            });
        },

        async updateStatus(orderId, status) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw new Error(`PostgreSQL order status update failed: ${error.message}`);
            cache.invalidateOrders();
            return data;
        }
    },

    // ==========================================
    // USERS
    // ==========================================
    users: {
        async getById(id) {
            const supabase = getSupabaseClient();
            if (!supabase) return null;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (error || !data) return null;
            return data;
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
                .select('user_id, total, status');

            return users.map(u => {
                const userOrders = (allOrders || []).filter(o => o.user_id === u.id);
                const delivered = userOrders.filter(o => o.status === 'Delivered');
                const totalSpent = delivered.reduce((sum, o) => sum + Number(o.total || 0), 0);
                return {
                    ...u,
                    orders_count: userOrders.length,
                    total_spent: totalSpent
                };
            });
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

        async getStatus() {
            return await cache.wrap('availability:status:store_main', async () => {
                const supabase = getSupabaseClient();
                if (!supabase) return this._memoryAvailability;

                let fetched = false;
                try {
                    const { data, error } = await supabase
                        .from('app_availability')
                        .select('id, is_locked, lock_type, message, start_at, end_at, created_by, updated_at')
                        .eq('id', 'store_main')
                        .maybeSingle();

                    if (!error && data) {
                        this._memoryAvailability = { ...this._memoryAvailability, ...data };
                        fetched = true;
                    }
                } catch (e) {}

                if (!fetched) {
                    // Fallback to reading from users table system record
                    try {
                        const { data: sysUser } = await supabase
                            .from('users')
                            .select('password_hash')
                            .eq('id', '__system_store_availability__')
                            .maybeSingle();
                        if (sysUser?.password_hash) {
                            const parsed = JSON.parse(sysUser.password_hash);
                            this._memoryAvailability = { ...this._memoryAvailability, ...parsed };
                        }
                    } catch (e) {}
                }

                const state = this._memoryAvailability;
                // Check if duration lock has expired
                if (state.is_locked && state.end_at) {
                    const now = new Date();
                    const end = new Date(state.end_at);
                    if (now > end) {
                        await this.unlock('SYSTEM_EXPIRY');
                        return { ...state, is_locked: false, lock_type: 'NONE', message: null };
                    }
                }

                return state;
            }, 15000); // 15-second micro-cache
        },

        async setLock(lockData) {
            const supabase = getSupabaseClient();
            if (!supabase) throw new Error('PostgreSQL client unavailable');

            const record = {
                id: 'store_main',
                is_locked: true,
                lock_type: lockData.lock_type || 'IMMEDIATE',
                message: lockData.message || 'Store is temporarily unavailable.',
                start_at: lockData.start_at || new Date().toISOString(),
                end_at: lockData.end_at || null,
                created_by: lockData.created_by || 'admin',
                updated_at: new Date().toISOString()
            };

            this._memoryAvailability = { ...this._memoryAvailability, ...record };

            let saved = false;
            try {
                const { data, error } = await supabase
                    .from('app_availability')
                    .upsert([record])
                    .select()
                    .single();

                if (!error && data) {
                    saved = true;
                    this._memoryAvailability = { ...this._memoryAvailability, ...data };
                }
            } catch (err) {}

            if (!saved) {
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
            return this._memoryAvailability;
        },

        async unlock(adminId = 'admin') {
            const supabase = getSupabaseClient();
            const record = {
                id: 'store_main',
                is_locked: false,
                lock_type: 'NONE',
                message: null,
                start_at: null,
                end_at: null,
                created_by: adminId,
                updated_at: new Date().toISOString()
            };

            this._memoryAvailability = { ...this._memoryAvailability, ...record };

            if (supabase) {
                try {
                    await supabase
                        .from('app_availability')
                        .upsert([record]);
                } catch (err) {}

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

            cache.invalidateAvailability();
            return this._memoryAvailability;
        }
    },

    // ==========================================
    // SECURITY BLACKLIST
    // ==========================================
    blacklist: {
        _memoryBlacklist: new Set(),

        async isUserBlacklisted(userId) {
            const supabase = getSupabaseClient();
            if (this._memoryBlacklist.has(userId)) {
                return { isBlacklisted: true, reason: 'Administrative Action', blocked_at: new Date().toISOString() };
            }
            if (!supabase) return { isBlacklisted: false };

            try {
                const { data, error } = await supabase
                    .from('blacklisted_users')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'BLOCKED')
                    .maybeSingle();

                if (!error && data) {
                    return {
                        isBlacklisted: true,
                        reason: data.reason,
                        blocked_at: data.created_at
                    };
                }
            } catch (e) {}

            try {
                const { data: u } = await supabase.from('users').select('account_status, block_reason, blocked_at').eq('id', userId).maybeSingle();
                if (u && u.account_status === 'BLOCKED') {
                    return {
                        isBlacklisted: true,
                        reason: u.block_reason || 'Administrative Action',
                        blocked_at: u.blocked_at
                    };
                }
            } catch (e) {}

            return { isBlacklisted: false };
        },

        async blacklistUser(userId, reason = 'Administrative Action', adminId = 'admin') {
            this._memoryBlacklist.add(userId);
            const supabase = getSupabaseClient();
            if (!supabase) return { success: true };

            try {
                await supabase
                    .from('blacklisted_users')
                    .upsert([{
                        id: `bl_${userId}`,
                        user_id: userId,
                        reason,
                        status: 'BLOCKED',
                        blocked_by: adminId,
                        blocked_at: new Date().toISOString()
                    }]);
            } catch (e) {}

            try {
                await supabase
                    .from('users')
                    .update({
                        account_status: 'BLOCKED',
                        block_reason: reason,
                        blocked_at: new Date().toISOString(),
                        blocked_by: adminId
                    })
                    .eq('id', userId);
            } catch (e) {}

            return { success: true };
        },

        async unblacklistUser(userId) {
            this._memoryBlacklist.delete(userId);
            const supabase = getSupabaseClient();
            if (!supabase) return { success: true };

            try {
                await supabase
                    .from('blacklisted_users')
                    .delete()
                    .eq('user_id', userId);
            } catch (e) {}

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
            } catch (e) {}

            return { success: true };
        },

        async getAllBlacklisted() {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            try {
                const { data, error } = await supabase
                    .from('blacklisted_users')
                    .select('*, users(name, email, phone)')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data.map(b => ({
                        user_id: b.user_id,
                        reason: b.reason,
                        blocked_by: b.blocked_by,
                        created_at: b.created_at,
                        name: b.users?.name || 'Unknown',
                        email: b.users?.email || '',
                        phone: b.users?.phone || ''
                    }));
                }
            } catch (e) {}

            try {
                const { data: blockedUsers } = await supabase
                    .from('users')
                    .select('*')
                    .eq('account_status', 'BLOCKED');

                return (blockedUsers || []).map(u => ({
                    user_id: u.id,
                    reason: u.block_reason || 'Administrative Action',
                    blocked_by: u.blocked_by || 'Admin',
                    created_at: u.blocked_at || u.created_at,
                    name: u.name || 'Unknown',
                    email: u.email || '',
                    phone: u.phone || ''
                }));
            } catch (e) {
                return [];
            }
        }
    },

    // ==========================================
    // AUDIT LOGS
    // ==========================================
    audit: {
        async logAction({ adminId, action, metadata = {} }) {
            const supabase = getSupabaseClient();
            if (!supabase) return;

            try {
                await supabase.from('audit_logs').insert([{
                    id: `audit_${uuidv4().slice(0, 8)}`,
                    admin_id: adminId || 'admin',
                    action,
                    metadata
                }]);
            } catch (e) {}
        },

        async getLogs(limit = 50) {
            const supabase = getSupabaseClient();
            if (!supabase) return [];

            const { data } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            return data || [];
        }
    }
};

module.exports = supabaseDb;

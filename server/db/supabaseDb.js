const { getSupabaseClient } = require('../supabase');
const { v4: uuidv4 } = require('uuid');

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
            const supabase = getSupabaseClient();
            let query = supabase.from('products').select('*');

            if (!includeInactive) {
                query = query.eq('in_stock', true);
            }

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
            return data || [];
        },

        async getById(id) {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) return null;
            return data;
        },

        async create(p) {
            const supabase = getSupabaseClient();
            const id = p.id || `prod_cust_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
            const price = Number(p.price);
            const mrp = p.mrp ? Number(p.mrp) : price;
            const inStock = p.in_stock !== undefined ? Boolean(p.in_stock) : true;

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
                tags: p.tags || '',
                in_stock: inStock,
                bestseller: Boolean(p.bestseller),
                is_new: Boolean(p.is_new)
            };

            const { data, error } = await supabase.from('products').insert([newProduct]).select().single();
            if (error) throw error;
            return data;
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
            if (updates.tags !== undefined) payload.tags = updates.tags;
            if (updates.in_stock !== undefined) payload.in_stock = Boolean(updates.in_stock);
            if (updates.bestseller !== undefined) payload.bestseller = Boolean(updates.bestseller);

            const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
            return true;
        },

        async getCategories() {
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
                        id, name, price, mrp, unit, size, image_url, image_alt, category, in_stock
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error || !cartItems) {
                return { items: [], pricing: this.calculatePricing([]) };
            }

            const items = cartItems.map(ci => ({
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
                in_stock: ci.products?.in_stock ? 1 : 0
            })).filter(i => i.product_id);

            const pricing = this.calculatePricing(items);
            return {
                items,
                pricing,
                item_count: items.reduce((sum, i) => sum + i.quantity, 0)
            };
        },

        calculatePricing(items) {
            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            return {
                subtotal,
                original_delivery_fee: subtotal > 0 ? 25 : 0,
                delivery_discount: subtotal > 0 ? 25 : 0,
                delivery_fee: 0,
                original_platform_fee: subtotal > 0 ? 5 : 0,
                platform_discount: subtotal > 0 ? 5 : 0,
                platform_fee: 0,
                tax: 0,
                total: subtotal,
                total_savings: subtotal > 0 ? 30 : 0,
                free_delivery_remaining: 0
            };
        },

        async addItem(userId, productId, quantity = 1) {
            const supabase = getSupabaseClient();
            const { data: existing } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .single();

            if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty <= 0) {
                    await supabase.from('cart_items').delete().eq('id', existing.id);
                } else {
                    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id);
                }
            } else if (quantity > 0) {
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
                await supabase.from('cart_items').update({ quantity }).eq('id', cartId);
            }
            return this.getCart(userId);
        },

        async clearCart(userId) {
            const supabase = getSupabaseClient();
            await supabase.from('cart_items').delete().eq('user_id', userId);
            return true;
        }
    },

    // ==========================================
    // ORDERS
    // ==========================================
    orders: {
        async createOrder(orderPayload, items) {
            const supabase = getSupabaseClient();
            
            // 1. Insert order
            const { data: createdOrder, error: orderErr } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (orderErr) throw orderErr;

            // 2. Insert order items
            if (items && items.length > 0) {
                const orderItems = items.map(item => ({
                    id: `oi_${uuidv4().slice(0, 8)}`,
                    order_id: orderPayload.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.price
                }));
                await supabase.from('order_items').insert(orderItems);
            }

            // 3. Clear cart
            await supabase.from('cart_items').delete().eq('user_id', orderPayload.user_id);

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
                    quantity: i.quantity,
                    price: i.unit_price
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
            const { data, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return data;
        }
    },

    // ==========================================
    // USERS / AUTH
    // ==========================================
    users: {
        async getById(id) {
            const supabase = getSupabaseClient();
            const { data } = await supabase.from('users').select('*').eq('id', id).single();
            return data;
        },

        async getByIdentifier(identifier) {
            const supabase = getSupabaseClient();
            const trimmed = identifier.trim().toLowerCase();
            const { data } = await supabase
                .from('users')
                .select('*')
                .or(`email.ilike.${trimmed},phone.eq.${identifier.trim()}`)
                .limit(1);

            return data && data.length > 0 ? data[0] : null;
        },

        async createUser(userData) {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.from('users').insert([userData]).select().single();
            if (error) throw error;
            return data;
        }
    }
};

module.exports = supabaseDb;

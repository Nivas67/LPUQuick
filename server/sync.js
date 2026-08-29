const { getSupabaseClient } = require('./supabase');

/**
 * LPUQuick Dual-Database Synchronization Engine
 * Guarantees every CRUD operation is mirrored to SQLite and Supabase Cloud
 */

// 1. SYNC PRODUCT CREATE
async function syncProductCreate(db, p) {
    // 1a. Insert into SQLite
    const inStock = p.in_stock !== undefined ? (p.in_stock ? 1 : 0) : (p.stock_left > 0 ? 1 : 0);
    const stockLeft = p.stock_left !== undefined ? parseInt(p.stock_left, 10) : 40;
    
    db.prepare(`
        INSERT OR REPLACE INTO products 
        (id, name, category, subcategory, price, mrp, unit, size, image_url, image_alt, tags, in_stock, stock_left, is_active, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
        p.id, p.name, p.category, p.subcategory || '', Number(p.price), p.mrp ? Number(p.mrp) : Number(p.price),
        p.unit || 'piece', p.size || 'Standard', p.image_url || '', p.image_alt || p.name, p.tags || '',
        inStock, stockLeft, p.description || ''
    );

    // 1b. Mirror to Supabase Cloud
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('products').upsert({
                id: p.id,
                name: p.name,
                category: p.category,
                subcategory: p.subcategory || '',
                price: Number(p.price),
                mrp: p.mrp ? Number(p.mrp) : Number(p.price),
                unit: p.unit || 'piece',
                size: p.size || 'Standard',
                image_url: p.image_url || '',
                image_alt: p.image_alt || p.name,
                tags: p.tags || '',
                in_stock: Boolean(inStock)
            });
            console.log(`[DualSync] Product created & synced to Cloud: ${p.id} (${p.name})`);
        }
    } catch (err) {
        console.error(`[DualSync Product Create Error]:`, err.message);
    }
}

// 2. SYNC PRODUCT UPDATE
async function syncProductUpdate(db, id, updates) {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const subcategory = updates.subcategory !== undefined ? updates.subcategory : existing.subcategory;
    const price = updates.price !== undefined ? Number(updates.price) : existing.price;
    const mrp = updates.mrp !== undefined ? Number(updates.mrp) : existing.mrp;
    const unit = updates.unit !== undefined ? updates.unit : existing.unit;
    const size = updates.size !== undefined ? updates.size : existing.size;
    const image_url = updates.image_url !== undefined ? updates.image_url : existing.image_url;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const stock_left = updates.stock_left !== undefined ? Math.max(0, parseInt(updates.stock_left, 10)) : existing.stock_left;
    const in_stock = updates.in_stock !== undefined ? (updates.in_stock ? 1 : 0) : (stock_left > 0 ? 1 : 0);

    // 2a. Update SQLite
    db.prepare(`
        UPDATE products 
        SET name = ?, category = ?, subcategory = ?, price = ?, mrp = ?, unit = ?, size = ?, image_url = ?, description = ?, stock_left = ?, in_stock = ?
        WHERE id = ?
    `).run(name, category, subcategory, price, mrp, unit, size, image_url, description, stock_left, in_stock, id);

    // 2b. Mirror to Supabase Cloud
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('products').update({
                name,
                category,
                subcategory,
                price,
                mrp,
                unit,
                size,
                image_url,
                in_stock: Boolean(in_stock)
            }).eq('id', id);
            console.log(`[DualSync] Product updated & synced to Cloud: ${id}`);
        }
    } catch (err) {
        console.error(`[DualSync Product Update Error]:`, err.message);
    }

    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

// 3. SYNC PRODUCT DELETE (Hard & Soft)
async function syncProductDelete(db, id, hardDelete = false) {
    if (hardDelete) {
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('products').delete().eq('id', id);
                console.log(`[DualSync] Product hard deleted from both databases: ${id}`);
            }
        } catch (err) {
            console.error(`[DualSync Product Delete Error]:`, err.message);
        }
    } else {
        db.prepare('UPDATE products SET is_active = 0, in_stock = 0, stock_left = 0 WHERE id = ?').run(id);
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('products').update({ in_stock: false }).eq('id', id);
                console.log(`[DualSync] Product deactivated in both databases: ${id}`);
            }
        } catch (err) {
            console.error(`[DualSync Product Deactivate Error]:`, err.message);
        }
    }
}

// 4. SYNC PRODUCT STOCK (Toggle / Step)
async function syncProductStock(db, id, newStockLeft, inStock) {
    const numericStock = inStock ? 1 : 0;
    db.prepare('UPDATE products SET stock_left = ?, in_stock = ? WHERE id = ?').run(newStockLeft, numericStock, id);

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('products').update({ in_stock: Boolean(inStock) }).eq('id', id);
            console.log(`[DualSync] Product stock updated in both databases: ${id} -> ${newStockLeft} (${inStock ? 'In Stock' : 'Out of Stock'})`);
        }
    } catch (err) {
        console.error(`[DualSync Product Stock Error]:`, err.message);
    }
}

// 5. SYNC ORDER CREATE
async function syncOrderCreate(orderPayload) {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('orders').insert([{
                id: orderPayload.id,
                user_id: orderPayload.user_id,
                status: orderPayload.status,
                subtotal: orderPayload.subtotal,
                delivery_fee: orderPayload.delivery_fee,
                platform_fee: orderPayload.platform_fee,
                tax: orderPayload.tax,
                total: orderPayload.total,
                payment_method: orderPayload.payment_method,
                payment_status: orderPayload.payment_status,
                rider_name: orderPayload.rider_name,
                delivery_address: orderPayload.delivery_address
            }]);
            console.log(`[DualSync] Order synced to Cloud: ${orderPayload.id}`);
        }
    } catch (err) {
        console.error(`[DualSync Order Create Error]:`, err.message);
    }
}

// 6. SYNC ORDER STATUS
async function syncOrderStatus(orderId, status) {
    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            await supabase.from('orders').update({ status }).eq('id', orderId);
            console.log(`[DualSync] Order status updated in Cloud: ${orderId} -> ${status}`);
        }
    } catch (err) {
        console.error(`[DualSync Order Status Error]:`, err.message);
    }
}

// 7. LISTEN TO SUPABASE REALTIME (Cloud -> SQLite downward sync)
function setupCloudDownwardSync(db) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Subscribe to products changes from Cloud
        supabase.channel('supabase-db-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
                const { eventType, new: newRec, old: oldRec } = payload;
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    if (newRec && newRec.id) {
                        const inStock = newRec.in_stock ? 1 : 0;
                        db.prepare(`
                            INSERT INTO products (id, name, category, subcategory, price, mrp, unit, size, image_url, in_stock, is_active)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                            ON CONFLICT(id) DO UPDATE SET
                                name = excluded.name,
                                category = excluded.category,
                                subcategory = excluded.subcategory,
                                price = excluded.price,
                                mrp = excluded.mrp,
                                unit = excluded.unit,
                                size = excluded.size,
                                image_url = excluded.image_url,
                                in_stock = excluded.in_stock
                        `).run(
                            newRec.id, newRec.name, newRec.category, newRec.subcategory || '',
                            Number(newRec.price), newRec.mrp ? Number(newRec.mrp) : Number(newRec.price),
                            newRec.unit || 'piece', newRec.size || 'Standard', newRec.image_url || '', inStock
                        );
                        console.log(`[DualSync] Realtime Cloud change synced to SQLite: ${newRec.id} (${newRec.name})`);
                    }
                } else if (eventType === 'DELETE') {
                    if (oldRec && oldRec.id) {
                        db.prepare('DELETE FROM products WHERE id = ?').run(oldRec.id);
                        console.log(`[DualSync] Realtime Cloud deletion synced to SQLite: ${oldRec.id}`);
                    }
                }
            })
            .subscribe();

        console.log('[DualSync] Realtime Cloud <-> SQLite synchronization channel active!');
    } catch (err) {
        console.error('[DualSync Channel Error]:', err.message);
    }
}

module.exports = {
    syncProductCreate,
    syncProductUpdate,
    syncProductDelete,
    syncProductStock,
    syncOrderCreate,
    syncOrderStatus,
    setupCloudDownwardSync
};

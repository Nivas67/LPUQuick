const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_PATH = process.env.LOCAL_DB_PATH || path.join(DATA_DIR, 'lpuquick_local.db');

let _dbInstance = null;

/**
 * Get or initialize the persistent local SQLite database.
 * Runs in WAL mode with foreign keys and synchronous normal.
 */
function getLocalDb() {
    if (_dbInstance) return _dbInstance;

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const db = new DatabaseSync(LOCAL_DB_PATH);

    // High performance, crash-resilience PRAGMAs
    db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
    `);

    initSchema(db);
    _dbInstance = db;
    return db;
}

/**
 * Creates the exact complete LPUQuick schema and synchronization metadata tables
 */
function initSchema(db) {
    db.exec(`
        -- 1. USERS TABLE
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            dob TEXT,
            role TEXT NOT NULL DEFAULT 'student',
            account_status TEXT NOT NULL DEFAULT 'ACTIVE',
            blocked_at TEXT DEFAULT NULL,
            blocked_by TEXT DEFAULT NULL,
            block_reason TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. PRODUCTS TABLE
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            subcategory TEXT DEFAULT '',
            price NUMERIC NOT NULL,
            mrp NUMERIC,
            cost_price NUMERIC DEFAULT 0,
            unit TEXT DEFAULT 'piece',
            size TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            image_alt TEXT DEFAULT '',
            tags TEXT DEFAULT '',
            in_stock INTEGER DEFAULT 1,
            bestseller INTEGER DEFAULT 0,
            is_new INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. CART ITEMS TABLE
        CREATE TABLE IF NOT EXISTS cart_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. ORDERS TABLE
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            customer_name TEXT,
            customer_phone TEXT,
            customer_email TEXT,
            status TEXT NOT NULL DEFAULT 'Order Placed',
            subtotal NUMERIC NOT NULL DEFAULT 0,
            delivery_fee NUMERIC NOT NULL DEFAULT 0,
            platform_fee NUMERIC NOT NULL DEFAULT 0,
            tax NUMERIC NOT NULL DEFAULT 0,
            total NUMERIC NOT NULL DEFAULT 0,
            payment_method TEXT DEFAULT 'Cash on Delivery',
            payment_status TEXT DEFAULT 'pending',
            rider_name TEXT DEFAULT 'Alex',
            rider_lat NUMERIC DEFAULT 31.2560,
            rider_lng NUMERIC DEFAULT 75.7030,
            delivery_address TEXT DEFAULT 'BH13 (Block A), Room 304',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. ORDER ITEMS TABLE
        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price NUMERIC NOT NULL
        );

        -- 6. APP AVAILABILITY & STORE LOCK TABLE
        CREATE TABLE IF NOT EXISTS app_availability (
            id TEXT PRIMARY KEY DEFAULT 'store_main',
            is_locked INTEGER NOT NULL DEFAULT 0,
            lock_type TEXT NOT NULL DEFAULT 'NONE',
            message TEXT DEFAULT NULL,
            start_at TEXT DEFAULT NULL,
            end_at TEXT DEFAULT NULL,
            profit_locked INTEGER NOT NULL DEFAULT 1,
            created_by TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. USER BLACKLIST TABLE
        CREATE TABLE IF NOT EXISTS blacklisted_users (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT NOT NULL DEFAULT 'Fake Orders',
            status TEXT NOT NULL DEFAULT 'BLOCKED',
            blocked_by TEXT DEFAULT NULL,
            blocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
            unblocked_by TEXT DEFAULT NULL,
            unblocked_at TEXT DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- 8. AUDIT LOGS TABLE
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            admin_id TEXT NOT NULL,
            target_user_id TEXT DEFAULT NULL,
            action TEXT NOT NULL,
            reason TEXT DEFAULT NULL,
            metadata TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        -- ============================================================
        -- SYNCHRONIZATION & REPLICATION INFRASTRUCTURE
        -- ============================================================

        -- 9. DURABLE FIFO SYNC QUEUE (Atomic local write tracking)
        CREATE TABLE IF NOT EXISTS sync_queue (
            operation_id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            operation_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'STOCK_DELTA'
            payload TEXT,               -- JSON serialized record
            delta TEXT,                 -- JSON serialized delta (e.g. { delta: -1 })
            status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'SYNCED', 'FAILED'
            retry_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced_at TEXT DEFAULT NULL
        );

        -- 10. SYNC CHECKPOINTS TABLE
        CREATE TABLE IF NOT EXISTS sync_checkpoints (
            id TEXT PRIMARY KEY DEFAULT 'main',
            last_cloud_sync TEXT DEFAULT NULL,
            last_local_sync TEXT DEFAULT NULL,
            last_cloud_cursor TEXT DEFAULT NULL,
            status TEXT NOT NULL DEFAULT 'IDLE' -- 'IDLE', 'SYNCING', 'OFFLINE', 'ERROR'
        );

        -- 11. CONFLICT PRESERVATION TABLE (Never delete conflicting data)
        CREATE TABLE IF NOT EXISTS sync_conflicts (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            local_version TEXT NOT NULL, -- JSON
            cloud_version TEXT NOT NULL, -- JSON
            conflict_reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'UNRESOLVED', -- 'UNRESOLVED', 'RESOLVED'
            resolution_notes TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT DEFAULT NULL
        );

        -- 12. EXPLICIT TOMBSTONES (Prevents ghost re-insertions of deleted records)
        CREATE TABLE IF NOT EXISTS sync_tombstones (
            id TEXT PRIMARY KEY,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            deleted_at TEXT DEFAULT CURRENT_TIMESTAMP,
            synced INTEGER DEFAULT 0
        );

        -- Initialize main checkpoint if missing
        INSERT OR IGNORE INTO sync_checkpoints (id, status) VALUES ('main', 'IDLE');

        -- Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_local_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_local_products_in_stock ON products(in_stock);
        CREATE INDEX IF NOT EXISTS idx_local_cart_user ON cart_items(user_id);
        CREATE INDEX IF NOT EXISTS idx_local_orders_user ON orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_local_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_local_order_items_order ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_local_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_local_users_phone ON users(phone);
        CREATE INDEX IF NOT EXISTS idx_local_sync_queue_status ON sync_queue(status, created_at);
        CREATE INDEX IF NOT EXISTS idx_local_sync_conflicts_status ON sync_conflicts(status);
    `);
}

/**
 * Modular Local Repository Implementation
 * Provides 100% feature and signature parity with Supabase for local-first execution.
 */
const localDb = {
    getDb: getLocalDb,

    // ==========================================
    // PRODUCTS
    // ==========================================
    products: {
        getAll({ includeInactive = false, category, subcategory, sort } = {}) {
            const db = getLocalDb();
            let sql = 'SELECT * FROM products WHERE 1=1';
            const params = [];

            if (category && category !== 'All') {
                sql += ' AND category LIKE ?';
                params.push(`%${category}%`);
            }
            if (subcategory && subcategory !== 'all') {
                sql += ' AND subcategory = ?';
                params.push(subcategory);
            }
            if (sort === 'price_asc') {
                sql += ' ORDER BY price ASC';
            } else if (sort === 'price_desc') {
                sql += ' ORDER BY price DESC';
            } else {
                sql += ' ORDER BY name ASC';
            }

            const rows = db.prepare(sql).all(...params);
            return rows.map(p => {
                const match = (p.tags || '').match(/stock:(\d+)/);
                const stock_left = match ? parseInt(match[1], 10) : (p.in_stock ? 50 : 0);
                return {
                    ...p,
                    in_stock: Boolean(p.in_stock),
                    bestseller: Boolean(p.bestseller),
                    is_new: Boolean(p.is_new),
                    stock_left
                };
            });
        },

        getById(id) {
            const db = getLocalDb();
            const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
            if (!row) return null;
            const match = (row.tags || '').match(/stock:(\d+)/);
            const stock_left = match ? parseInt(match[1], 10) : (row.in_stock ? 50 : 0);
            return {
                ...row,
                in_stock: Boolean(row.in_stock),
                bestseller: Boolean(row.bestseller),
                is_new: Boolean(row.is_new),
                stock_left
            };
        },

        upsert(p) {
            const db = getLocalDb();
            const stock = p.stock_left !== undefined ? Math.max(0, Number(p.stock_left)) : 50;
            const baseTags = (p.tags || '').replace(/stock:\d+,?/g, '').trim();
            const finalTags = `stock:${stock}${baseTags ? ',' + baseTags : ''}`;
            const inStock = p.in_stock !== undefined ? (p.in_stock ? 1 : 0) : (stock > 0 ? 1 : 0);

            db.prepare(`
                INSERT INTO products (
                    id, name, category, subcategory, price, mrp, cost_price,
                    unit, size, image_url, image_alt, tags, in_stock, bestseller, is_new, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    category = excluded.category,
                    subcategory = excluded.subcategory,
                    price = excluded.price,
                    mrp = excluded.mrp,
                    cost_price = excluded.cost_price,
                    unit = excluded.unit,
                    size = excluded.size,
                    image_url = excluded.image_url,
                    image_alt = excluded.image_alt,
                    tags = excluded.tags,
                    in_stock = excluded.in_stock,
                    bestseller = excluded.bestseller,
                    is_new = excluded.is_new
            `).run(
                p.id,
                p.name,
                p.category,
                p.subcategory || '',
                Number(p.price) || 0,
                Number(p.mrp) || Number(p.price) || 0,
                Number(p.cost_price) || 0,
                p.unit || 'piece',
                p.size || 'Standard',
                p.image_url || '',
                p.image_alt || p.name,
                finalTags,
                inStock,
                p.bestseller ? 1 : 0,
                p.is_new ? 1 : 0,
                p.created_at || null
            );

            return this.getById(p.id);
        },

        update(id, updates) {
            const current = this.getById(id);
            if (!current) throw new Error('Product not found');
            const merged = { ...current, ...updates };
            return this.upsert(merged);
        },

        delete(id) {
            const db = getLocalDb();
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
        },

        getCategories() {
            const products = this.getAll();
            const map = {};
            products.forEach(p => {
                if (!map[p.category]) {
                    map[p.category] = { category: p.category, count: 0, subcategories: new Set() };
                }
                map[p.category].count++;
                if (p.subcategory) map[p.category].subcategories.add(p.subcategory);
            });
            return Object.values(map).map(c => ({
                ...c,
                subcategories: Array.from(c.subcategories)
            }));
        }
    },

    // ==========================================
    // CART
    // ==========================================
    cart: {
        getCart(userId) {
            const db = getLocalDb();
            const rows = db.prepare(`
                SELECT ci.id as cart_id, ci.product_id, ci.quantity, ci.created_at,
                       p.name, p.price, p.mrp, p.unit, p.size, p.image_url, p.image_alt, p.category, p.in_stock, p.tags
                FROM cart_items ci
                LEFT JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?
                ORDER BY ci.created_at DESC
            `).all(userId);

            const items = rows.map(r => {
                const match = (r.tags || '').match(/stock:(\d+)/);
                const stockLeft = match ? parseInt(match[1], 10) : (r.in_stock ? 50 : 0);
                return {
                    cart_id: r.cart_id,
                    product_id: r.product_id,
                    name: r.name,
                    price: Number(r.price) || 0,
                    mrp: Number(r.mrp) || Number(r.price) || 0,
                    unit: r.unit,
                    size: r.size,
                    image_url: r.image_url,
                    image_alt: r.image_alt,
                    category: r.category,
                    quantity: r.quantity,
                    in_stock: r.in_stock ? 1 : 0,
                    stock_left: stockLeft
                };
            }).filter(i => i.product_id);

            const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
            const deliveryFee = subtotal >= 99 || subtotal === 0 ? 0 : 15;
            const platformFee = subtotal > 0 ? 2 : 0;
            const tax = Math.round(subtotal * 0.05);
            const total = subtotal + deliveryFee + platformFee + tax;

            return {
                items,
                pricing: { subtotal, deliveryFee, platformFee, tax, total }
            };
        },

        addItem(userId, productId, quantity = 1) {
            const db = getLocalDb();
            const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?').get(userId, productId);
            if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty <= 0) {
                    db.prepare('DELETE FROM cart_items WHERE id = ?').run(existing.id);
                } else {
                    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
                }
            } else if (quantity > 0) {
                const id = `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                db.prepare('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)').run(id, userId, productId, quantity);
            }
            return this.getCart(userId);
        },

        updateQuantity(cartId, quantity) {
            const db = getLocalDb();
            if (quantity <= 0) {
                db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartId);
            } else {
                db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(quantity, cartId);
            }
        },

        removeItem(cartId) {
            const db = getLocalDb();
            db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartId);
        },

        clearCart(userId) {
            const db = getLocalDb();
            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
        },

        mergeGuestCart(guestUserId, targetUserId) {
            if (!guestUserId || !targetUserId || guestUserId === targetUserId) return;
            const db = getLocalDb();
            const guestItems = db.prepare('SELECT product_id, quantity FROM cart_items WHERE user_id = ?').all(guestUserId);
            for (const item of guestItems) {
                this.addItem(targetUserId, item.product_id, item.quantity);
            }
            this.clearCart(guestUserId);
        }
    },

    // ==========================================
    // ORDERS
    // ==========================================
    orders: {
        createOrder(orderPayload, items) {
            const db = getLocalDb();
            db.prepare(`
                INSERT INTO orders (
                    id, user_id, customer_name, customer_phone, customer_email,
                    status, subtotal, delivery_fee, platform_fee, tax, total,
                    payment_method, payment_status, rider_name, rider_lat, rider_lng,
                    delivery_address, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
            `).run(
                orderPayload.id,
                orderPayload.user_id,
                orderPayload.customer_name || 'Student',
                orderPayload.customer_phone || '',
                orderPayload.customer_email || '',
                orderPayload.status || 'Order Placed',
                Number(orderPayload.subtotal) || 0,
                Number(orderPayload.delivery_fee) || 0,
                Number(orderPayload.platform_fee) || 0,
                Number(orderPayload.tax) || 0,
                Number(orderPayload.total) || 0,
                orderPayload.payment_method || 'Cash on Delivery',
                orderPayload.payment_status || 'pending',
                orderPayload.rider_name || 'Alex',
                orderPayload.rider_lat || 31.2560,
                orderPayload.rider_lng || 75.7030,
                orderPayload.delivery_address || 'BH13 (Block A), Room 304',
                orderPayload.created_at || null
            );

            if (items && items.length > 0) {
                const insertItem = db.prepare(`
                    INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
                    VALUES (?, ?, ?, ?, ?)
                `);
                for (const item of items) {
                    const itemId = item.id || `oi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                    insertItem.run(
                        itemId,
                        orderPayload.id,
                        item.product_id || item.id,
                        Number(item.quantity) || 1,
                        Number(item.price || item.unit_price) || 0
                    );
                }
            }

            // Clear user's cart upon successful order
            db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(orderPayload.user_id);

            return this.getOrderById(orderPayload.id);
        },

        getOrderById(orderId) {
            const db = getLocalDb();
            const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
            if (!order) return null;

            const items = db.prepare(`
                SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
                       p.name, p.image_url, p.unit
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `).all(orderId);

            return {
                ...order,
                items: items.map(i => ({
                    id: i.id,
                    product_id: i.product_id,
                    name: i.name || 'Campus Item',
                    image_url: i.image_url || '',
                    quantity: i.quantity,
                    price: Number(i.unit_price),
                    unit_price: Number(i.unit_price)
                }))
            };
        },

        getOrdersByUser(userId) {
            const db = getLocalDb();
            const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
            const active = [];
            const past = [];

            for (const o of orders) {
                const full = this.getOrderById(o.id);
                if (['Delivered', 'Cancelled'].includes(o.status)) {
                    past.push(full);
                } else {
                    active.push(full);
                }
            }
            return { active, past };
        },

        getAllOrders() {
            const db = getLocalDb();
            const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
            return orders.map(o => this.getOrderById(o.id));
        },

        updateStatus(orderId, status) {
            const db = getLocalDb();
            db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
            return this.getOrderById(orderId);
        }
    },

    // ==========================================
    // USERS
    // ==========================================
    users: {
        getById(id) {
            const db = getLocalDb();
            return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
        },

        getUserById(id) {
            return this.getById(id);
        },

        getByIdentifier(identifier) {
            const db = getLocalDb();
            const clean = identifier.trim().toLowerCase();
            return db.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR phone = ?').get(clean, identifier.trim()) || null;
        },

        createUser(u) {
            const db = getLocalDb();
            db.prepare(`
                INSERT INTO users (id, name, email, phone, password_hash, dob, role, account_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    email = excluded.email,
                    phone = excluded.phone,
                    role = excluded.role,
                    account_status = excluded.account_status
            `).run(
                u.id,
                u.name,
                u.email ? u.email.trim().toLowerCase() : null,
                u.phone ? u.phone.trim() : null,
                u.password_hash,
                u.dob || null,
                u.role || 'student',
                u.account_status || 'ACTIVE',
                u.created_at || null
            );
            return this.getById(u.id);
        },

        updatePhone(userId, phone) {
            const db = getLocalDb();
            db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone.trim(), userId);
            return this.getById(userId);
        },

        getAllCustomersWithMetrics() {
            const db = getLocalDb();
            const users = db.prepare('SELECT * FROM users WHERE role != ? ORDER BY created_at DESC').all('admin');
            return users.map(u => {
                const orders = db.prepare('SELECT total FROM orders WHERE user_id = ?').all(u.id);
                const totalSpent = orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
                return {
                    ...u,
                    orders_count: orders.length,
                    total_spent: totalSpent,
                    is_blacklisted: u.account_status === 'BLOCKED'
                };
            });
        },

        updateAccountStatus(userId, status, reason = null, adminId = 'admin_001') {
            const db = getLocalDb();
            db.prepare(`
                UPDATE users
                SET account_status = ?, block_reason = ?, blocked_at = CURRENT_TIMESTAMP, blocked_by = ?
                WHERE id = ?
            `).run(status, reason, adminId, userId);
            return this.getById(userId);
        }
    },

    // ==========================================
    // APP AVAILABILITY
    // ==========================================
    availability: {
        getStatus() {
            const db = getLocalDb();
            const row = db.prepare('SELECT * FROM app_availability WHERE id = ?').get('store_main');
            if (!row) {
                return {
                    is_locked: false,
                    lock_type: 'NONE',
                    message: null,
                    start_at: null,
                    end_at: null,
                    profit_locked: true
                };
            }
            return {
                ...row,
                is_locked: Boolean(row.is_locked),
                profit_locked: Boolean(row.profit_locked)
            };
        },

        updateStatus(payload) {
            const db = getLocalDb();
            db.prepare(`
                INSERT INTO app_availability (id, is_locked, lock_type, message, start_at, end_at, profit_locked, updated_at)
                VALUES ('store_main', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                    is_locked = excluded.is_locked,
                    lock_type = excluded.lock_type,
                    message = excluded.message,
                    start_at = excluded.start_at,
                    end_at = excluded.end_at,
                    profit_locked = excluded.profit_locked,
                    updated_at = CURRENT_TIMESTAMP
            `).run(
                payload.is_locked ? 1 : 0,
                payload.lock_type || 'NONE',
                payload.message || null,
                payload.start_at || null,
                payload.end_at || null,
                payload.profit_locked !== undefined ? (payload.profit_locked ? 1 : 0) : 1
            );
            return this.getStatus();
        }
    },

    // ==========================================
    // BLACKLIST & AUDIT
    // ==========================================
    blacklist: {
        isUserBlacklisted(userId) {
            const db = getLocalDb();
            const row = db.prepare("SELECT * FROM blacklisted_users WHERE user_id = ? AND status = 'BLOCKED'").get(userId);
            return { isBlacklisted: Boolean(row), reason: row?.reason || null };
        },

        blacklistUser(userId, reason, adminId = 'admin_001') {
            const db = getLocalDb();
            const id = `bl_${Date.now()}`;
            db.prepare(`
                INSERT INTO blacklisted_users (id, user_id, reason, status, blocked_by, blocked_at)
                VALUES (?, ?, ?, 'BLOCKED', ?, CURRENT_TIMESTAMP)
            `).run(id, userId, reason, adminId);
            localDb.users.updateAccountStatus(userId, 'BLOCKED', reason, adminId);
        },

        unblacklistUser(userId, adminId = 'admin_001') {
            const db = getLocalDb();
            db.prepare(`
                UPDATE blacklisted_users
                SET status = 'RESOLVED', unblocked_by = ?, unblocked_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND status = 'BLOCKED'
            `).run(adminId, userId);
            localDb.users.updateAccountStatus(userId, 'ACTIVE', null, adminId);
        }
    },

    audit: {
        logAction(actionData) {
            const db = getLocalDb();
            const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            db.prepare(`
                INSERT INTO audit_logs (id, admin_id, target_user_id, action, reason, metadata, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(
                id,
                actionData.adminId || 'admin_001',
                actionData.targetUserId || null,
                actionData.action,
                actionData.reason || null,
                actionData.metadata ? JSON.stringify(actionData.metadata) : null
            );
        }
    }
};

module.exports = localDb;

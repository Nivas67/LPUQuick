-- ============================================================
-- LPUQuick Full Supabase Cloud Database Schema
-- 100% Aligned with LPUQuick Web App & Express.js Backend
-- ============================================================

-- 1. USERS TABLE (Matches Profile & Auth screen: Nivas, 7671836211)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    dob TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    account_status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'BLOCKED'
    blocked_at TIMESTAMPTZ DEFAULT NULL,
    blocked_by TEXT DEFAULT NULL,
    block_reason TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE (Matches Home, Categories, & Search screens)
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
    in_stock BOOLEAN DEFAULT TRUE,
    bestseller BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CART ITEMS TABLE (Matches Cart page & Card Steppers)
CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE (Matches Checkout, Real-Time Timeline & Live GPS Tracking)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE (Matches Order Receipts & Breakdown)
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
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    lock_type TEXT NOT NULL DEFAULT 'NONE', -- 'IMMEDIATE', 'SCHEDULED', 'DURATION', 'MANUAL', 'NONE'
    message TEXT DEFAULT NULL,
    start_at TIMESTAMPTZ DEFAULT NULL,
    end_at TIMESTAMPTZ DEFAULT NULL,
    profit_locked BOOLEAN NOT NULL DEFAULT TRUE,
    created_by TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER BLACKLIST TABLE
CREATE TABLE IF NOT EXISTS blacklisted_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT 'Fake Orders',
    status TEXT NOT NULL DEFAULT 'BLOCKED', -- 'BLOCKED', 'RESOLVED'
    blocked_by TEXT DEFAULT NULL,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    unblocked_by TEXT DEFAULT NULL,
    unblocked_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    target_user_id TEXT DEFAULT NULL,
    action TEXT NOT NULL,
    reason TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES (Instant queries for Campus Quick Commerce)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_supabase_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_supabase_products_in_stock ON products(in_stock);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_user_product ON cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supabase_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supabase_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supabase_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_supabase_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_supabase_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_supabase_blacklisted_users_user ON blacklisted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_blacklisted_users_status ON blacklisted_users(status);
CREATE INDEX IF NOT EXISTS idx_supabase_app_availability_locked ON app_availability(is_locked);
CREATE INDEX IF NOT EXISTS idx_supabase_audit_logs_created ON audit_logs(created_at DESC);


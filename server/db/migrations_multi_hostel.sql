-- ============================================================
-- LPUQuick Multi-Hostel Database Migration
-- Supports Unlimited Hostels, 1 Store Manager per Hostel,
-- Isolated Inventory, Independent Stock, and Zero-Leakage Security
-- ============================================================

-- 1. HOSTELS TABLE
CREATE TABLE IF NOT EXISTS hostels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'OFF'
    manager_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXTEND PRODUCTS TABLE (Add hostel_id column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='hostel_id') THEN
        ALTER TABLE products ADD COLUMN hostel_id TEXT DEFAULT 'BH-13';
    END IF;
END $$;

-- 3. EXTEND ORDERS TABLE (Add hostel_id column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='hostel_id') THEN
        ALTER TABLE orders ADD COLUMN hostel_id TEXT DEFAULT 'BH-13';
    END IF;
END $$;

-- 4. EXTEND CART_ITEMS TABLE (Add hostel_id column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='hostel_id') THEN
        ALTER TABLE cart_items ADD COLUMN hostel_id TEXT DEFAULT 'BH-13';
    END IF;
END $$;

-- 5. SEED DEFAULT HOSTELS (Preserve existing BH-13 and introduce BH-5)
INSERT INTO hostels (id, name, status, created_at, updated_at)
VALUES 
    ('BH-13', 'Boys Hostel 13', 'ACTIVE', NOW(), NOW()),
    ('BH-5', 'Boys Hostel 5', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 6. MIGRATE EXISTING PRODUCTS & ORDERS SAFELY TO DEFAULT HOSTEL (BH-13)
UPDATE products SET hostel_id = 'BH-13' WHERE hostel_id IS NULL;
UPDATE orders SET hostel_id = 'BH-13' WHERE hostel_id IS NULL;
UPDATE cart_items SET hostel_id = 'BH-13' WHERE hostel_id IS NULL;

-- 7. PERFORMANCE INDEXES (High-concurrency query speed & zero table scans)
CREATE INDEX IF NOT EXISTS idx_supabase_hostels_status ON hostels(status);
CREATE INDEX IF NOT EXISTS idx_supabase_hostels_manager ON hostels(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_products_hostel ON products(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_products_hostel_category ON products(hostel_id, category);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_hostel ON orders(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_hostel_status ON orders(hostel_id, status);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_hostel ON cart_items(hostel_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active hostels" ON hostels;
CREATE POLICY "Public can view active hostels" ON hostels 
    FOR SELECT USING (status = 'ACTIVE');

DROP POLICY IF EXISTS "Service role full access on hostels" ON hostels;
CREATE POLICY "Service role full access on hostels" ON hostels 
    USING (auth.role() = 'service_role');

-- Products RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products" ON products 
    FOR SELECT USING (in_stock = TRUE);

DROP POLICY IF EXISTS "Service role full access on products" ON products;
CREATE POLICY "Service role full access on products" ON products 
    USING (auth.role() = 'service_role');

-- Orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders 
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role full access on orders" ON orders;
CREATE POLICY "Service role full access on orders" ON orders 
    USING (auth.role() = 'service_role');

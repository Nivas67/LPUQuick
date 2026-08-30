-- ============================================================
-- LPUQuick Master Database Migration
-- Store Availability Lock, Blacklist, Profit Security & Audit
-- ============================================================

-- 1. APP AVAILABILITY & STORE LOCK TABLE
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

-- Insert default single record if not exists
INSERT INTO app_availability (id, is_locked, lock_type, profit_locked)
VALUES ('store_main', FALSE, 'NONE', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. USER BLACKLIST TABLE
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

-- 3. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    target_user_id TEXT DEFAULT NULL,
    action TEXT NOT NULL,
    reason TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EXTEND USERS TABLE (Add account_status, blocked fields)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_status') THEN
        ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocked_at') THEN
        ALTER TABLE users ADD COLUMN blocked_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blocked_by') THEN
        ALTER TABLE users ADD COLUMN blocked_by TEXT DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='block_reason') THEN
        ALTER TABLE users ADD COLUMN block_reason TEXT DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
    END IF;
END $$;

-- 5. EXTEND PRODUCTS TABLE (Add cost_price for profit calculations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cost_price') THEN
        ALTER TABLE products ADD COLUMN cost_price NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Set realistic cost prices for existing products if currently 0 (approx 70% of price for retail margins)
UPDATE products SET cost_price = ROUND(price * 0.70) WHERE cost_price IS NULL OR cost_price = 0;

-- 6. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_blacklisted_users_user ON blacklisted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blacklisted_users_status ON blacklisted_users(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_app_availability_locked ON app_availability(is_locked);

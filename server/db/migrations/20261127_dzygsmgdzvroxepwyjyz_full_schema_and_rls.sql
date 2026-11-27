-- ============================================================================
-- LPUQuick Production Schema, Turnstile Replay Guard, Indexes & RLS Hardening
-- Authorized Target Supabase Project: dzygsmgdzvroxepwyjyz
-- Project URL: https://dzygsmgdzvroxepwyjyz.supabase.co
-- Status: NON-DESTRUCTIVE & IDEMPOTENT. Review and apply by DB owner.
-- Note: Never connects to or imports rows from legacy/sandbox projects.
-- ============================================================================

BEGIN;

-- 1. Core Application Tables
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL DEFAULT 'none',
    dob TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    roles JSONB DEFAULT '[]'::jsonb,
    assigned_hostels JSONB DEFAULT '[]'::jsonb,
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    account_status TEXT NOT NULL DEFAULT 'ACTIVE',
    blocked_at TIMESTAMPTZ DEFAULT NULL,
    blocked_by TEXT DEFAULT NULL,
    block_reason TEXT DEFAULT NULL,
    hostel_id TEXT DEFAULT NULL,
    block TEXT DEFAULT NULL,
    room TEXT DEFAULT NULL,
    last_login_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_hostels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_by TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS block_reason TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS hostel_id TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS block TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS room TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.hostels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    blocks JSONB DEFAULT '["Block A", "Block B", "Hostel Main Gate"]'::jsonb,
    manager_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '["Block A", "Block B", "Hostel Main Gate"]'::jsonb;
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS manager_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL;

INSERT INTO public.hostels (id, name, status, blocks)
VALUES ('BH-13', 'Boys Hostel 13', 'ACTIVE', '["Block A", "Block B", "Hostel Main Gate"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    hostel_id TEXT DEFAULT 'BH-13' REFERENCES public.hostels(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT DEFAULT '',
    description TEXT DEFAULT '',
    price NUMERIC NOT NULL,
    mrp NUMERIC DEFAULT NULL,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'piece',
    size TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    image_alt TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    rating NUMERIC DEFAULT 4.8,
    review_count TEXT DEFAULT '1.2 lac',
    is_veg BOOLEAN DEFAULT TRUE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    stock_left INTEGER NOT NULL DEFAULT 0,
    bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_food_product BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hostel_id TEXT DEFAULT 'BH-13';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS review_count TEXT DEFAULT '1.2 lac';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_left INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_food_product BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
    hostel_id TEXT DEFAULT 'BH-13',
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS hostel_id TEXT DEFAULT 'BH-13';

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    hostel_id TEXT DEFAULT 'BH-13',
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
    payment_method TEXT DEFAULT 'Pay on Delivery',
    payment_status TEXT DEFAULT 'pending',
    order_mode TEXT DEFAULT 'DELIVERY',
    special_instructions TEXT DEFAULT '',
    rider_id TEXT DEFAULT NULL,
    rider_name TEXT DEFAULT 'Alex',
    rider_lat NUMERIC DEFAULT 31.2560,
    rider_lng NUMERIC DEFAULT 75.7030,
    delivery_address TEXT DEFAULT 'BH13 (Block A), Room 304',
    status_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hostel_id TEXT DEFAULT 'BH-13';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_mode TEXT DEFAULT 'DELIVERY';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_instructions TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rider_id TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.app_availability (
    id TEXT PRIMARY KEY DEFAULT 'store_main',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    lock_type TEXT NOT NULL DEFAULT 'NONE',
    message TEXT DEFAULT NULL,
    start_at TIMESTAMPTZ DEFAULT NULL,
    end_at TIMESTAMPTZ DEFAULT NULL,
    profit_locked BOOLEAN NOT NULL DEFAULT TRUE,
    created_by TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_availability (id, is_locked, lock_type, profit_locked)
VALUES ('store_main', FALSE, 'NONE', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.blacklisted_users (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT 'Fake Orders',
    status TEXT NOT NULL DEFAULT 'BLOCKED',
    blocked_by TEXT DEFAULT NULL,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    unblocked_by TEXT DEFAULT NULL,
    unblocked_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    target_user_id TEXT DEFAULT NULL,
    action TEXT NOT NULL,
    reason TEXT DEFAULT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cloudflare Turnstile Replay Prevention & Persistent Security Tables
CREATE TABLE IF NOT EXISTS public.turnstile_used_tokens (
    token_hash TEXT PRIMARY KEY,
    hostname TEXT DEFAULT NULL,
    action TEXT DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_rate_limits (
    rate_key TEXT PRIMARY KEY,
    hits INTEGER NOT NULL DEFAULT 1,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    phone TEXT PRIMARY KEY,
    otp_hash TEXT NOT NULL,
    user_id TEXT DEFAULT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    locked_until TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Performance & Foreign-Key Indexes
CREATE INDEX IF NOT EXISTS idx_supabase_hostels_status ON public.hostels(status);
CREATE INDEX IF NOT EXISTS idx_supabase_hostels_manager ON public.hostels(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_products_hostel ON public.products(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_supabase_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_hostel ON public.cart_items(hostel_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_user_product ON public.cart_items(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_hostel ON public.orders(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supabase_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supabase_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supabase_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_supabase_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_supabase_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_supabase_blacklisted_users_user ON public.blacklisted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_blacklisted_users_status ON public.blacklisted_users(status);
CREATE INDEX IF NOT EXISTS idx_supabase_app_availability_locked ON public.app_availability(is_locked);
CREATE INDEX IF NOT EXISTS idx_supabase_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_turnstile_used_tokens_expires_at ON public.turnstile_used_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_window ON public.security_rate_limits(window_started_at);
CREATE INDEX IF NOT EXISTS idx_auth_otp_challenges_expires ON public.auth_otp_challenges(expires_at);

-- 4. Row Level Security (RLS) & Strict Role Privileges
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'users',
        'hostels',
        'products',
        'cart_items',
        'orders',
        'order_items',
        'app_availability',
        'blacklisted_users',
        'audit_logs',
        'turnstile_used_tokens',
        'security_rate_limits',
        'auth_otp_challenges'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', tbl);
        EXECUTE format('DROP POLICY IF EXISTS deny_direct_client_access ON public.%I', tbl);
        EXECUTE format(
            'CREATE POLICY deny_direct_client_access ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
            tbl
        );
    END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO service_role;

-- 5. Safe Maintenance Function for Expired Turnstile Replay Entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_turnstile_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.turnstile_used_tokens
    WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_turnstile_tokens() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_turnstile_tokens() TO service_role;

-- 6. Atomic Cross-Invocation Rate Limiting RPC (Serverless Safe)
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_key TEXT,
    p_window_seconds INTEGER,
    p_max_hits INTEGER,
    p_lock_seconds INTEGER DEFAULT 0
)
RETURNS TABLE(allowed BOOLEAN, hits INTEGER, retry_after_seconds INTEGER, blocked_until TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_window INTERVAL := make_interval(secs => GREATEST(1, COALESCE(p_window_seconds, 60)));
    v_lock INTERVAL := make_interval(secs => GREATEST(0, COALESCE(p_lock_seconds, 0)));
    v_hits INTEGER;
    v_window_start TIMESTAMPTZ;
    v_blocked TIMESTAMPTZ;
BEGIN
    IF NULLIF(BTRIM(COALESCE(p_key, '')), '') IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 60, v_now + INTERVAL '60 seconds';
        RETURN;
    END IF;

    INSERT INTO public.security_rate_limits (rate_key, hits, window_started_at, blocked_until, updated_at)
    VALUES (
        p_key,
        1,
        v_now,
        CASE WHEN p_max_hits <= 1 AND p_lock_seconds > 0 THEN v_now + v_lock ELSE NULL END,
        v_now
    )
    ON CONFLICT (rate_key) DO UPDATE SET
        hits = CASE
            WHEN public.security_rate_limits.blocked_until IS NOT NULL AND public.security_rate_limits.blocked_until > v_now THEN public.security_rate_limits.hits
            WHEN public.security_rate_limits.window_started_at + v_window <= v_now THEN 1
            ELSE public.security_rate_limits.hits + 1
        END,
        window_started_at = CASE
            WHEN public.security_rate_limits.blocked_until IS NOT NULL AND public.security_rate_limits.blocked_until > v_now THEN public.security_rate_limits.window_started_at
            WHEN public.security_rate_limits.window_started_at + v_window <= v_now THEN v_now
            ELSE public.security_rate_limits.window_started_at
        END,
        blocked_until = CASE
            WHEN public.security_rate_limits.blocked_until IS NOT NULL AND public.security_rate_limits.blocked_until > v_now THEN public.security_rate_limits.blocked_until
            WHEN public.security_rate_limits.window_started_at + v_window <= v_now THEN
                CASE WHEN p_max_hits <= 1 AND p_lock_seconds > 0 THEN v_now + v_lock ELSE NULL END
            WHEN (public.security_rate_limits.hits + 1) >= p_max_hits AND p_lock_seconds > 0 THEN v_now + v_lock
            ELSE NULL
        END,
        updated_at = v_now
    RETURNING
        public.security_rate_limits.hits,
        public.security_rate_limits.window_started_at,
        public.security_rate_limits.blocked_until
    INTO v_hits, v_window_start, v_blocked;

    IF v_blocked IS NOT NULL AND v_blocked > v_now THEN
        RETURN QUERY SELECT
            FALSE,
            v_hits,
            GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_blocked - v_now)))::INTEGER),
            v_blocked;
        RETURN;
    END IF;

    IF v_hits > p_max_hits THEN
        RETURN QUERY SELECT
            FALSE,
            v_hits,
            GREATEST(1, CEIL(EXTRACT(EPOCH FROM ((v_window_start + v_window) - v_now)))::INTEGER),
            v_blocked;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, v_hits, 0, v_blocked;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

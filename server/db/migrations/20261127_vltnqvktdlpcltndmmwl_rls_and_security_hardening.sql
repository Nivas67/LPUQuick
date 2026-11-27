-- ============================================================================
-- LPUQuick Original Production Database Security & RLS Hardening
-- Authorized Target Supabase Project: vltnqvktdlpcltndmmwl
-- Project URL: https://vltnqvktdlpcltndmmwl.supabase.co
-- Status: NON-DESTRUCTIVE & IDEMPOTENT. Preserves ALL existing records.
-- Review and apply directly in Supabase SQL Editor by authorized DB owner.
-- ============================================================================

BEGIN;

-- 1. Non-Destructive Schema Additions (Preserves all existing rows & columns)
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

-- Ensure security/role columns exist without altering existing user rows
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS assigned_hostels JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS blocked_by TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS block_reason TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Performance & Foreign-Key Indexes (Idempotent)
CREATE INDEX IF NOT EXISTS idx_supabase_hostels_status ON public.hostels(status);
CREATE INDEX IF NOT EXISTS idx_supabase_products_hostel ON public.products(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_supabase_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_supabase_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_hostel ON public.orders(hostel_id);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_supabase_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_blocked_until ON public.security_rate_limits(blocked_until);
CREATE INDEX IF NOT EXISTS idx_auth_otp_challenges_expires_at ON public.auth_otp_challenges(expires_at);

-- 3. Strict Row-Level Security (Close Direct Anon/Authenticated PostgREST Exposure)
-- Note: Express server routes connect with SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS safely).
-- Existing Supabase Broadcast realtime channels remain unaffected without direct table reads.
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
        'security_rate_limits',
        'auth_otp_challenges'
    ]
    LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS deny_direct_client_access ON public.%I', tbl);
            EXECUTE format(
                'CREATE POLICY deny_direct_client_access ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
                tbl
            );
        END IF;
    END LOOP;
END $$;

-- 4. Atomic Rate-Limiting RPC Across Stateless Vercel Functions
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

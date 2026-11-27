-- ============================================================================
-- Non-Destructive Security Rollback for Project: vltnqvktdlpcltndmmwl
-- Removes ONLY newly introduced rate-limit/OTP helper tables and RPC while
-- KEEPING existing rows intact AND KEEPING strict RLS + privilege revocations
-- active so rolling back never reopens private customer, admin, or order data.
-- ============================================================================

BEGIN;

REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER);
DROP TABLE IF EXISTS public.auth_otp_challenges;
DROP TABLE IF EXISTS public.security_rate_limits;

-- Safety assertion on core tables: keep RLS enabled, direct client grants revoked,
-- and AS RESTRICTIVE deny policy intact so rollback cannot re-expose private rows.
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
        'audit_logs'
    ]
    LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', tbl);
            EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', tbl);
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('DROP POLICY IF EXISTS deny_direct_client_access ON public.%I', tbl);
            EXECUTE format(
                'CREATE POLICY deny_direct_client_access ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
                tbl
            );
        END IF;
    END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

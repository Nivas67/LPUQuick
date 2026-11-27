-- ============================================================================
-- Non-Destructive Security Policy Rollback for Project: vltnqvktdlpcltndmmwl
-- Preserves all application tables and rows while rolling back added
-- helper tables/functions and strict PostgREST deny policies if required.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER);
DROP TABLE IF EXISTS public.auth_otp_challenges;
DROP TABLE IF EXISTS public.security_rate_limits;

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
            EXECUTE format('DROP POLICY IF EXISTS deny_direct_client_access ON public.%I', tbl);
        END IF;
    END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

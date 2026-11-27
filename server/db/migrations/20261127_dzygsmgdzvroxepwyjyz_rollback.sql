-- ============================================================================
-- Non-Destructive Security Policy Rollback for Project: dzygsmgdzvroxepwyjyz
-- Preserves all application tables and rows while rolling back Turnstile
-- replay helper artifacts and strict PostgREST deny policies if ever required.
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.check_and_increment_rate_limit(TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.cleanup_expired_turnstile_tokens();
DROP TABLE IF EXISTS public.auth_otp_challenges;
DROP TABLE IF EXISTS public.security_rate_limits;
DROP TABLE IF EXISTS public.turnstile_used_tokens;

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

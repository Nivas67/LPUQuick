-- =============================================================================
-- LPUQuick Sandbox UPI Gateway Isolated Database Migration
-- Target Project: mgsxeguulxumfgehpphb (https://mgsxeguulxumfgehpphb.supabase.co)
-- CRITICAL: Apply ONLY to the dedicated Sandbox Supabase project.
-- Do NOT execute on the production Supabase project or use the shared-schema file.
-- =============================================================================

-- 1. Isolated Sandbox Catalog Fixtures (Zero dependency on production products/inventory)
CREATE TABLE IF NOT EXISTS sandbox_catalog_items (
    id TEXT PRIMARY KEY,
    hostel_id VARCHAR(32) NOT NULL DEFAULT 'BH-13',
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL DEFAULT '',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 1 AND price <= 100000),
    mrp NUMERIC(10, 2) CHECK (mrp IS NULL OR mrp >= price),
    unit TEXT NOT NULL DEFAULT 'pack',
    size TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    stock_left INTEGER NOT NULL DEFAULT 50 CHECK (stock_left >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_veg BOOLEAN NOT NULL DEFAULT TRUE,
    bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_new BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbx_catalog_active_category
    ON sandbox_catalog_items (is_active, category);

-- Seed safe dummy catalog fixtures for Preview storefront & checkout testing
INSERT INTO sandbox_catalog_items (
    id, hostel_id, name, category, subcategory, price, mrp, unit, size, image_url, in_stock, stock_left, is_active, is_veg, bestseller, is_new
) VALUES
    ('SBX_PROD_MAGGI', 'BH-13', '[Sandbox] Classic Masala Noodles', 'Snacks & Beverages', 'Instant Noodles', 55.00, 60.00, 'pack', '2-Pack', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300', TRUE, 50, TRUE, TRUE, TRUE, FALSE),
    ('SBX_PROD_CHAI', 'BH-13', '[Sandbox] Campus Masala Chai', 'Quick''s Instant Food', 'Hot Beverages', 25.00, 30.00, 'cup', '150ml', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300', TRUE, 50, TRUE, TRUE, TRUE, FALSE),
    ('SBX_PROD_COOKIE', 'BH-13', '[Sandbox] Chocochip Test Cookies', 'Snacks & Beverages', 'Biscuits', 37.00, 40.00, 'pack', '75g', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300', TRUE, 50, TRUE, TRUE, FALSE, TRUE),
    ('SBX_PROD_DRINK', 'BH-13', '[Sandbox] Sparkling Berry Cooler', 'Snacks & Beverages', 'Cold Drinks', 40.00, 45.00, 'can', '250ml', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300', TRUE, 50, TRUE, TRUE, FALSE, FALSE),
    ('SBX_PROD_MEAL', 'BH-13', '[Sandbox] Sandbox Express Meal Box', 'Quick''s Instant Food', 'Meals', 120.00, 140.00, 'box', 'Regular', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300', TRUE, 50, TRUE, TRUE, TRUE, TRUE),
    ('SBX_PROD_BAR', 'BH-13', '[Sandbox] Peanut Crunch Bar', 'Snacks & Beverages', 'Chocolates', 20.00, 25.00, 'piece', '40g', 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300', TRUE, 50, TRUE, TRUE, FALSE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. Isolated Sandbox Cart Storage (Zero dependency on production cart_items or users)
CREATE TABLE IF NOT EXISTS sandbox_cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL REFERENCES sandbox_catalog_items(id) ON DELETE CASCADE,
    hostel_id VARCHAR(32) NOT NULL DEFAULT 'BH-13',
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id, hostel_id)
);

CREATE INDEX IF NOT EXISTS idx_sbx_cart_user_hostel
    ON sandbox_cart_items (user_id, hostel_id);

-- 3. Isolated Sandbox Payment Orders
CREATE TABLE IF NOT EXISTS sandbox_payment_orders (
    id TEXT PRIMARY KEY,
    client_order_id VARCHAR(64) NOT NULL UNIQUE,
    gateway_order_id VARCHAR(128) UNIQUE,
    checkout_idempotency_key VARCHAR(128) UNIQUE,
    user_id TEXT NOT NULL,
    hostel_id VARCHAR(32) NOT NULL DEFAULT 'BH-13',
    order_mode VARCHAR(16) NOT NULL DEFAULT 'DELIVERY',
    customer_name VARCHAR(128),
    customer_email VARCHAR(160),
    customer_mobile VARCHAR(32),
    items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 1 AND amount <= 100000),
    currency VARCHAR(8) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    environment VARCHAR(16) NOT NULL DEFAULT 'sandbox' CHECK (environment = 'sandbox'),
    is_test BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_test = TRUE),
    status VARCHAR(32) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under review', 'Paid', 'Failed', 'Expired')),
    payment_url TEXT,
    utr VARCHAR(64),
    last_event_id VARCHAR(128),
    last_event_sequence BIGINT NOT NULL DEFAULT 0 CHECK (last_event_sequence >= 0),
    fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    sandbox_fulfilled_at TIMESTAMPTZ,
    gateway_raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbx_payment_orders_user_created
    ON sandbox_payment_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sbx_payment_orders_status
    ON sandbox_payment_orders (status);

-- 4. Durable Webhook Deduplication Table
CREATE TABLE IF NOT EXISTS sandbox_webhook_events (
    id TEXT PRIMARY KEY,
    event_id VARCHAR(128) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    event_sequence BIGINT NOT NULL CHECK (event_sequence >= 0),
    client_order_id VARCHAR(64),
    gateway_order_id VARCHAR(128),
    environment VARCHAR(16) NOT NULL CHECK (environment = 'sandbox'),
    is_test BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_test = TRUE),
    signature_timestamp BIGINT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    processing_result VARCHAR(32) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbx_webhook_events_client_order
    ON sandbox_webhook_events (client_order_id, event_sequence DESC);

-- 5. Append-Only Sandbox Payment Audit Trail
CREATE TABLE IF NOT EXISTS sandbox_payment_audit_logs (
    id TEXT PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    client_order_id VARCHAR(64),
    gateway_order_id VARCHAR(128),
    event_id VARCHAR(128),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbx_payment_audit_order
    ON sandbox_payment_audit_logs (client_order_id, created_at DESC);

-- 6. Default-Deny RLS on all sandbox tables (service_role bypasses RLS cleanly; blocks anon/authenticated)
ALTER TABLE sandbox_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Explicit least-privilege grants (works safely even when automatic API grants are disabled)
REVOKE ALL ON TABLE sandbox_catalog_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE sandbox_cart_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE sandbox_payment_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE sandbox_webhook_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE sandbox_payment_audit_logs FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE sandbox_catalog_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sandbox_cart_items TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE sandbox_payment_orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE sandbox_webhook_events TO service_role;
GRANT SELECT, INSERT ON TABLE sandbox_payment_audit_logs TO service_role;

-- 8. Table-level status-transition guard (never allow Paid or settled orders to be downgraded)
CREATE OR REPLACE FUNCTION public.enforce_sandbox_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF (OLD.fulfilled = TRUE OR OLD.status = 'Paid') THEN
            IF NEW.status <> 'Paid' OR (OLD.fulfilled = TRUE AND NEW.fulfilled IS DISTINCT FROM TRUE) THEN
                RAISE EXCEPTION 'Cannot downgrade settled sandbox payment order (%) from Paid to %', OLD.client_order_id, NEW.status
                    USING ERRCODE = 'check_violation';
            END IF;
        ELSIF OLD.status = 'Under review' AND NEW.status = 'Pending' THEN
            RAISE EXCEPTION 'Invalid sandbox payment transition from Under review to Pending for order %', OLD.client_order_id
                USING ERRCODE = 'check_violation';
        ELSIF OLD.status = 'Failed' AND NEW.status IN ('Pending', 'Under review') THEN
            RAISE EXCEPTION 'Invalid sandbox payment transition from Failed to % for order %', NEW.status, OLD.client_order_id
                USING ERRCODE = 'check_violation';
        ELSIF OLD.status = 'Expired' AND NEW.status IN ('Pending', 'Under review', 'Failed') THEN
            RAISE EXCEPTION 'Invalid sandbox payment transition from Expired to % for order %', NEW.status, OLD.client_order_id
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_sandbox_order_status_transition ON public.sandbox_payment_orders;
CREATE TRIGGER trg_enforce_sandbox_order_status_transition
    BEFORE UPDATE ON public.sandbox_payment_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_sandbox_order_status_transition();

-- 9. Atomic PostgreSQL transaction processor for signed webhook deduplication,
--    concurrent duplicate serialization, strict amount/currency checks, monotonic sequence,
--    state-transition enforcement, and single fulfilment.
CREATE OR REPLACE FUNCTION public.process_sandbox_webhook_atomic(
    p_event_id TEXT,
    p_event_type TEXT,
    p_event_sequence BIGINT,
    p_mapped_status TEXT,
    p_client_order_id TEXT,
    p_gateway_order_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_utr TEXT,
    p_signature_timestamp BIGINT,
    p_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
    v_existing_evt public.sandbox_webhook_events%ROWTYPE;
    v_order public.sandbox_payment_orders%ROWTYPE;
    v_should_fulfil BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := NOW();
    v_evt_row_id TEXT := 'sbx_evt_' || REPLACE(pg_catalog.gen_random_uuid()::TEXT, '-', '');
    v_aud_row_id TEXT := 'sbx_aud_' || REPLACE(pg_catalog.gen_random_uuid()::TEXT, '-', '');
    v_inserted_evt_id TEXT := NULL;
BEGIN
    -- 0. Strict fail-closed validation (reject NULL, missing, non-finite, invalid scale, or non-INR currency)
    IF NULLIF(BTRIM(COALESCE(p_event_id, '')), '') IS NULL OR pg_catalog.char_length(p_event_id) > 128 THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'MISSING_EVENT_ID'
        );
    END IF;

    IF NULLIF(BTRIM(COALESCE(p_event_type, '')), '') IS NULL THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'UNSUPPORTED_WEBHOOK_EVENT'
        );
    END IF;

    IF p_event_sequence IS NULL OR p_event_sequence < 0 THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'INVALID_EVENT_SEQUENCE'
        );
    END IF;

    IF p_mapped_status IS NULL OR p_mapped_status NOT IN ('Pending', 'Under review', 'Paid', 'Failed', 'Expired') THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'INVALID_WEBHOOK_STATUS'
        );
    END IF;

    IF p_signature_timestamp IS NULL OR p_signature_timestamp <= 0 THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'INVALID_SIGNATURE_TIMESTAMP'
        );
    END IF;

    IF NULLIF(BTRIM(COALESCE(p_currency, '')), '') IS NULL THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'INVALID_CURRENCY'
        );
    END IF;

    IF UPPER(BTRIM(p_currency)) <> 'INR' THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'CURRENCY_MISMATCH'
        );
    END IF;

    IF p_amount IS NULL
       OR pg_catalog.lower(p_amount::TEXT) IN ('nan', 'infinity', '-infinity')
       OR p_amount < 1
       OR p_amount > 100000
       OR ROUND(p_amount, 2) <> p_amount THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'INVALID_WEBHOOK_AMOUNT'
        );
    END IF;

    IF NULLIF(BTRIM(COALESCE(p_client_order_id, '')), '') IS NULL
       AND NULLIF(BTRIM(COALESCE(p_gateway_order_id, '')), '') IS NULL THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'MISSING_ORDER_IDENTIFIER'
        );
    END IF;

    -- 1. Serialize concurrent duplicate deliveries of the same event_id transactionally
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtext('sbx_wh_evt_v1'),
        pg_catalog.hashtext(p_event_id)
    );

    -- Check durable webhook deduplication first
    SELECT * INTO v_existing_evt
    FROM public.sandbox_webhook_events
    WHERE event_id = p_event_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'outcome', 'duplicate_event',
            'duplicate', TRUE,
            'event_id', v_existing_evt.event_id,
            'client_order_id', v_existing_evt.client_order_id
        );
    END IF;

    -- 2. Lock matching sandbox payment order row (isolated strictly to sandbox_payment_orders)
    IF NULLIF(BTRIM(COALESCE(p_client_order_id, '')), '') IS NOT NULL THEN
        SELECT * INTO v_order
        FROM public.sandbox_payment_orders
        WHERE client_order_id = p_client_order_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND AND NULLIF(BTRIM(COALESCE(p_gateway_order_id, '')), '') IS NOT NULL THEN
        SELECT * INTO v_order
        FROM public.sandbox_payment_orders
        WHERE gateway_order_id = p_gateway_order_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_order_not_found',
            'statusCode', 404,
            'code', 'SANDBOX_ORDER_NOT_FOUND'
        );
    END IF;

    -- 3. Order identity verification
    IF NULLIF(BTRIM(COALESCE(p_client_order_id, '')), '') IS NOT NULL
       AND v_order.client_order_id <> p_client_order_id THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'ORDER_IDENTITY_MISMATCH'
        );
    END IF;

    IF NULLIF(BTRIM(COALESCE(p_gateway_order_id, '')), '') IS NOT NULL
       AND v_order.gateway_order_id IS NOT NULL
       AND v_order.gateway_order_id <> p_gateway_order_id THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'ORDER_IDENTITY_MISMATCH'
        );
    END IF;

    -- 4. Exact stored order currency & paise-exact INR amount check (NULL-safe)
    IF v_order.currency IS NULL
       OR UPPER(BTRIM(v_order.currency)) <> 'INR'
       OR UPPER(BTRIM(v_order.currency)) <> UPPER(BTRIM(p_currency)) THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'CURRENCY_MISMATCH'
        );
    END IF;

    IF v_order.amount IS NULL
       OR pg_catalog.lower(v_order.amount::TEXT) IN ('nan', 'infinity', '-infinity')
       OR ROUND(v_order.amount * 100) <> ROUND(p_amount * 100) THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'AMOUNT_MISMATCH'
        );
    END IF;

    -- 5. Monotonic event_sequence guard (ignore older/out-of-order deliveries cleanly)
    IF p_event_sequence <= COALESCE(v_order.last_event_sequence, 0) THEN
        INSERT INTO public.sandbox_webhook_events (
            id, event_id, event_type, event_sequence,
            client_order_id, gateway_order_id, environment, is_test,
            signature_timestamp, payload, processing_result
        ) VALUES (
            v_evt_row_id, p_event_id, p_event_type, p_event_sequence,
            v_order.client_order_id, COALESCE(v_order.gateway_order_id, NULLIF(p_gateway_order_id, '')),
            'sandbox', TRUE, p_signature_timestamp, COALESCE(p_payload, '{}'::jsonb), 'stale_sequence_ignored'
        )
        ON CONFLICT (event_id) DO NOTHING
        RETURNING id INTO v_inserted_evt_id;

        IF v_inserted_evt_id IS NULL THEN
            RETURN jsonb_build_object(
                'outcome', 'duplicate_event',
                'duplicate', TRUE,
                'event_id', p_event_id,
                'client_order_id', v_order.client_order_id,
                'status', v_order.status,
                'fulfilled', v_order.fulfilled
            );
        END IF;

        RETURN jsonb_build_object(
            'outcome', 'stale_sequence_ignored',
            'ignoredOutOfOrder', TRUE,
            'event_id', p_event_id,
            'client_order_id', v_order.client_order_id,
            'status', v_order.status,
            'fulfilled', v_order.fulfilled
        );
    END IF;

    -- 6. Valid status-transition enforcement (already-Paid orders can never be downgraded)
    IF ((v_order.fulfilled = TRUE OR v_order.status = 'Paid') AND p_mapped_status <> 'Paid')
       OR (v_order.status = 'Under review' AND p_mapped_status = 'Pending')
       OR (v_order.status = 'Failed' AND p_mapped_status IN ('Pending', 'Under review'))
       OR (v_order.status = 'Expired' AND p_mapped_status IN ('Pending', 'Under review', 'Failed')) THEN
        INSERT INTO public.sandbox_payment_audit_logs (
            id, action, client_order_id, gateway_order_id, event_id, details
        ) VALUES (
            v_aud_row_id,
            'SANDBOX_WEBHOOK_INVALID_TRANSITION',
            v_order.client_order_id,
            v_order.gateway_order_id,
            p_event_id,
            jsonb_build_object(
                'from_status', v_order.status,
                'from_fulfilled', v_order.fulfilled,
                'attempted_status', p_mapped_status,
                'event_type', p_event_type,
                'event_sequence', p_event_sequence
            )
        );

        RETURN jsonb_build_object(
            'outcome', 'rejected_invalid_transition',
            'statusCode', 409,
            'code', 'INVALID_STATUS_TRANSITION',
            'client_order_id', v_order.client_order_id,
            'gateway_order_id', v_order.gateway_order_id,
            'status', v_order.status,
            'fulfilled', v_order.fulfilled
        );
    END IF;

    -- 7. Persist verified webhook event atomically (never fails with 23505 under concurrent duplicate delivery)
    INSERT INTO public.sandbox_webhook_events (
        id, event_id, event_type, event_sequence,
        client_order_id, gateway_order_id, environment, is_test,
        signature_timestamp, payload, processing_result
    ) VALUES (
        v_evt_row_id, p_event_id, p_event_type, p_event_sequence,
        v_order.client_order_id, COALESCE(v_order.gateway_order_id, NULLIF(p_gateway_order_id, '')),
        'sandbox', TRUE, p_signature_timestamp, COALESCE(p_payload, '{}'::jsonb), 'processed'
    )
    ON CONFLICT (event_id) DO NOTHING
    RETURNING id INTO v_inserted_evt_id;

    IF v_inserted_evt_id IS NULL THEN
        RETURN jsonb_build_object(
            'outcome', 'duplicate_event',
            'duplicate', TRUE,
            'event_id', p_event_id,
            'client_order_id', v_order.client_order_id,
            'status', v_order.status,
            'fulfilled', v_order.fulfilled
        );
    END IF;

    v_should_fulfil := (p_mapped_status = 'Paid' AND NOT v_order.fulfilled);

    UPDATE public.sandbox_payment_orders
    SET
        status = CASE
            WHEN public.sandbox_payment_orders.fulfilled = TRUE OR public.sandbox_payment_orders.status = 'Paid' THEN 'Paid'
            ELSE p_mapped_status
        END,
        gateway_order_id = COALESCE(public.sandbox_payment_orders.gateway_order_id, NULLIF(p_gateway_order_id, '')),
        utr = COALESCE(NULLIF(p_utr, ''), public.sandbox_payment_orders.utr),
        last_event_id = p_event_id,
        last_event_sequence = p_event_sequence,
        fulfilled = CASE WHEN v_should_fulfil THEN TRUE ELSE public.sandbox_payment_orders.fulfilled END,
        sandbox_fulfilled_at = CASE WHEN v_should_fulfil THEN v_now ELSE public.sandbox_payment_orders.sandbox_fulfilled_at END,
        gateway_raw_response = COALESCE(p_payload, public.sandbox_payment_orders.gateway_raw_response),
        updated_at = v_now
    WHERE public.sandbox_payment_orders.client_order_id = v_order.client_order_id
    RETURNING * INTO v_order;

    INSERT INTO public.sandbox_payment_audit_logs (
        id, action, client_order_id, gateway_order_id, event_id, details
    ) VALUES (
        v_aud_row_id,
        'SANDBOX_WEBHOOK_' || UPPER(REPLACE(p_mapped_status, ' ', '_')),
        v_order.client_order_id,
        v_order.gateway_order_id,
        p_event_id,
        jsonb_build_object(
            'event_type', p_event_type,
            'event_sequence', p_event_sequence,
            'fulfilled_now', v_should_fulfil
        )
    );

    RETURN jsonb_build_object(
        'outcome', 'processed',
        'duplicate', FALSE,
        'ignoredOutOfOrder', FALSE,
        'event_id', p_event_id,
        'client_order_id', v_order.client_order_id,
        'gateway_order_id', v_order.gateway_order_id,
        'status', v_order.status,
        'fulfilledNow', v_should_fulfil,
        'fulfilled', v_order.fulfilled
    );
END;
$$;

-- Restrict trigger & SECURITY DEFINER function execution strictly to server-side roles
REVOKE ALL ON FUNCTION public.enforce_sandbox_order_status_transition() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_sandbox_webhook_atomic(TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_sandbox_webhook_atomic(TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, BIGINT, JSONB) TO service_role;

-- Refresh PostgREST schema cache immediately when automatic API grants were disabled on project creation
NOTIFY pgrst, 'reload schema';

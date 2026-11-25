-- =============================================================================
-- LPUQuick Sandbox UPI Gateway Isolated Database Migration
-- Apply ONLY to a dedicated Sandbox/Preview Supabase project (recommended)
-- OR an isolated database instance.
-- ZERO foreign keys, triggers, or writes to production orders/inventory/carts.
-- =============================================================================

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

-- Enable Row Level Security (service_role bypasses RLS cleanly; blocks direct anon browser table access)
ALTER TABLE sandbox_payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sandbox_payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- Atomic PostgreSQL transaction processor for signed webhook deduplication,
-- monotonic event_sequence ordering, amount/identity verification, and single fulfilment.
CREATE OR REPLACE FUNCTION process_sandbox_webhook_atomic(
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
SET search_path = public, pg_temp
AS $$
DECLARE
    v_existing_evt sandbox_webhook_events%ROWTYPE;
    v_order sandbox_payment_orders%ROWTYPE;
    v_should_fulfil BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := NOW();
    v_evt_row_id TEXT := 'sbx_evt_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
    v_aud_row_id TEXT := 'sbx_aud_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
BEGIN
    IF UPPER(COALESCE(p_currency, 'INR')) <> 'INR' THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'CURRENCY_MISMATCH'
        );
    END IF;

    -- 1. Check durable webhook deduplication first
    SELECT * INTO v_existing_evt
    FROM sandbox_webhook_events
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
        FROM sandbox_payment_orders
        WHERE client_order_id = p_client_order_id
        FOR UPDATE;
    END IF;

    IF NOT FOUND AND NULLIF(BTRIM(COALESCE(p_gateway_order_id, '')), '') IS NOT NULL THEN
        SELECT * INTO v_order
        FROM sandbox_payment_orders
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

    -- 4. Exact INR amount check (paise equality)
    IF ROUND(v_order.amount * 100) <> ROUND(p_amount * 100) THEN
        RETURN jsonb_build_object(
            'outcome', 'rejected_mismatch',
            'statusCode', 400,
            'code', 'AMOUNT_MISMATCH'
        );
    END IF;

    -- 5. Monotonic event_sequence guard (ignore older/out-of-order deliveries)
    IF p_event_sequence <= COALESCE(v_order.last_event_sequence, 0) THEN
        INSERT INTO sandbox_webhook_events (
            id, event_id, event_type, event_sequence,
            client_order_id, gateway_order_id, environment, is_test,
            signature_timestamp, payload, processing_result
        ) VALUES (
            v_evt_row_id, p_event_id, p_event_type, p_event_sequence,
            v_order.client_order_id, COALESCE(v_order.gateway_order_id, NULLIF(p_gateway_order_id, '')),
            'sandbox', TRUE, p_signature_timestamp, COALESCE(p_payload, '{}'::jsonb), 'stale_sequence_ignored'
        )
        ON CONFLICT (event_id) DO NOTHING;

        RETURN jsonb_build_object(
            'outcome', 'stale_sequence_ignored',
            'ignoredOutOfOrder', TRUE,
            'event_id', p_event_id,
            'client_order_id', v_order.client_order_id,
            'status', v_order.status,
            'fulfilled', v_order.fulfilled
        );
    END IF;

    -- 6. Persist verified webhook event and advance order state atomically
    INSERT INTO sandbox_webhook_events (
        id, event_id, event_type, event_sequence,
        client_order_id, gateway_order_id, environment, is_test,
        signature_timestamp, payload, processing_result
    ) VALUES (
        v_evt_row_id, p_event_id, p_event_type, p_event_sequence,
        v_order.client_order_id, COALESCE(v_order.gateway_order_id, NULLIF(p_gateway_order_id, '')),
        'sandbox', TRUE, p_signature_timestamp, COALESCE(p_payload, '{}'::jsonb), 'processed'
    );

    v_should_fulfil := (p_mapped_status = 'Paid' AND NOT v_order.fulfilled);

    UPDATE sandbox_payment_orders
    SET
        status = p_mapped_status,
        gateway_order_id = COALESCE(sandbox_payment_orders.gateway_order_id, NULLIF(p_gateway_order_id, '')),
        utr = COALESCE(NULLIF(p_utr, ''), sandbox_payment_orders.utr),
        last_event_id = p_event_id,
        last_event_sequence = p_event_sequence,
        fulfilled = CASE WHEN v_should_fulfil THEN TRUE ELSE sandbox_payment_orders.fulfilled END,
        sandbox_fulfilled_at = CASE WHEN v_should_fulfil THEN v_now ELSE sandbox_payment_orders.sandbox_fulfilled_at END,
        gateway_raw_response = COALESCE(p_payload, sandbox_payment_orders.gateway_raw_response),
        updated_at = v_now
    WHERE sandbox_payment_orders.client_order_id = v_order.client_order_id
    RETURNING * INTO v_order;

    INSERT INTO sandbox_payment_audit_logs (
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

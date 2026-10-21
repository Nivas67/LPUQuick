-- ============================================================
-- LPUQuick UPI Payment Transactions & Refund Management Schema
-- ============================================================

-- 1. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL DEFAULT 'youpi',
    provider_payment_id VARCHAR(128),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI',
    upi_ref_utr VARCHAR(64),
    customer_id VARCHAR(64),
    customer_name VARCHAR(128),
    customer_phone VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_utr ON payment_transactions(upi_ref_utr);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_phone ON payment_transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- 2. PAYMENT REFUNDS TABLE
CREATE TABLE IF NOT EXISTS payment_refunds (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    refund_ref_id VARCHAR(64) NOT NULL UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'Refund Pending',
    reason TEXT,
    failure_reason TEXT,
    initiated_by VARCHAR(64),
    provider_refund_id VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction_id ON payment_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order_id ON payment_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_refund_ref_id ON payment_refunds(refund_ref_id);

-- 3. AUDIT LOGS FOR PAYMENT ACTIONS
CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_entity ON payment_audit_logs(entity_id);

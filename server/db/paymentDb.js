const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getSupabaseClient } = require('../supabase');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TXN_FILE = path.join(DATA_DIR, 'payment_transactions.json');
const REFUND_FILE = path.join(DATA_DIR, 'payment_refunds.json');
const AUDIT_FILE = path.join(DATA_DIR, 'payment_audit_logs.json');

// Ensure data directory exists
try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

function readJsonFile(filePath, defaultVal = []) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.warn(`[PaymentDb] Read error for ${path.basename(filePath)}:`, e.message);
    }
    return defaultVal;
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.warn(`[PaymentDb] Write error for ${path.basename(filePath)}:`, e.message);
    }
}

function getTxns() {
    return readJsonFile(TXN_FILE, []);
}

function saveTxns(list) {
    writeJsonFile(TXN_FILE, list || []);
}

function getRefundsList() {
    return readJsonFile(REFUND_FILE, []);
}

function saveRefunds(list) {
    writeJsonFile(REFUND_FILE, list || []);
}

function getAuditList() {
    return readJsonFile(AUDIT_FILE, []);
}

function saveAudit(list) {
    writeJsonFile(AUDIT_FILE, list || []);
}

const paymentDb = {
    // ==========================================
    // 1. PAYMENT TRANSACTIONS
    // ==========================================
    payments: {
        async createTransaction(payload) {
            const id = payload.id || `pay_txn_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
            const record = {
                id,
                order_id: payload.order_id || payload.orderId,
                provider: payload.provider || 'youpi',
                provider_payment_id: payload.provider_payment_id || payload.providerPaymentId || payload.paymentId || null,
                amount: Number(payload.amount || 0).toFixed(2),
                currency: payload.currency || 'INR',
                payment_method: payload.payment_method || payload.paymentMethod || 'UPI',
                upi_ref_utr: payload.upi_ref_utr || payload.utr || null,
                customer_id: payload.customer_id || payload.userId || null,
                customer_name: payload.customer_name || payload.customerName || 'Campus Student',
                customer_phone: payload.customer_phone || payload.customerPhone || null,
                status: payload.status || 'Pending',
                failure_reason: payload.failure_reason || null,
                metadata: payload.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Local fallback persistence
            const list = getTxns();
            const existingIdx = list.findIndex(t => t.id === id || (record.order_id && t.order_id === record.order_id));
            if (existingIdx >= 0) {
                list[existingIdx] = { ...list[existingIdx], ...record, updated_at: new Date().toISOString() };
            } else {
                list.unshift(record);
            }
            saveTxns(list);

            // Cloud PostgreSQL sync
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase.from('payment_transactions').upsert([record]);
                } catch (err) {
                    console.warn('[PaymentDb] Supabase txn insert note:', err.message);
                }
            }

            return record;
        },

        async updateTransactionStatus(idOrOrderId, updates) {
            const list = getTxns();
            const txn = list.find(t => t.id === idOrOrderId || t.order_id === idOrOrderId || t.provider_payment_id === idOrOrderId);
            if (!txn) return null;

            if (updates.status) txn.status = updates.status;
            if (updates.upi_ref_utr !== undefined) txn.upi_ref_utr = updates.upi_ref_utr;
            if (updates.failure_reason !== undefined) txn.failure_reason = updates.failure_reason;
            if (updates.payment_method) txn.payment_method = updates.payment_method;
            if (updates.metadata) txn.metadata = { ...(txn.metadata || {}), ...updates.metadata };
            txn.updated_at = new Date().toISOString();

            saveTxns(list);

            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase.from('payment_transactions').update({
                        status: txn.status,
                        upi_ref_utr: txn.upi_ref_utr,
                        failure_reason: txn.failure_reason,
                        metadata: txn.metadata,
                        updated_at: txn.updated_at
                    }).eq('id', txn.id);
                } catch (err) {
                    console.warn('[PaymentDb] Supabase txn update note:', err.message);
                }
            }

            return txn;
        },

        async getTransactionById(id) {
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    const { data, error } = await supabase.from('payment_transactions').select('*').eq('id', id).single();
                    if (!error && data) return data;
                } catch (e) {}
            }
            const list = getTxns();
            return list.find(t => t.id === id) || null;
        },

        async getTransactionByOrderId(orderId) {
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    const { data, error } = await supabase.from('payment_transactions').select('*').eq('order_id', orderId).maybeSingle();
                    if (!error && data) return data;
                } catch (e) {}
            }
            const list = getTxns();
            return list.find(t => t.order_id === orderId) || null;
        },

        async getTransactionByProviderPaymentId(pid) {
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    const { data, error } = await supabase.from('payment_transactions').select('*').eq('provider_payment_id', pid).maybeSingle();
                    if (!error && data) return data;
                } catch (e) {}
            }
            const list = getTxns();
            return list.find(t => t.provider_payment_id === pid) || null;
        },

        async getTransactions({ status, search, limit = 50, offset = 0, startDate, endDate } = {}) {
            let records = [];
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    let query = supabase.from('payment_transactions').select('*', { count: 'exact' });
                    if (status && status !== 'ALL') query = query.eq('status', status);
                    if (startDate) query = query.gte('created_at', startDate);
                    if (endDate) query = query.lte('created_at', endDate);
                    if (search) {
                        query = query.or(`order_id.ilike.%${search}%,upi_ref_utr.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_name.ilike.%${search}%`);
                    }
                    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
                    const { data, count, error } = await query;
                    if (!error && data) {
                        records = data;
                        return { transactions: records, totalCount: count || records.length };
                    }
                } catch (e) {}
            }

            // Fallback from local JSON
            let list = [...getTxns()];
            if (status && status !== 'ALL') {
                list = list.filter(t => (t.status || '').toLowerCase() === status.toLowerCase());
            }
            if (startDate) {
                const start = new Date(startDate).getTime();
                list = list.filter(t => new Date(t.created_at).getTime() >= start);
            }
            if (endDate) {
                const end = new Date(endDate).getTime();
                list = list.filter(t => new Date(t.created_at).getTime() <= end);
            }
            if (search) {
                const s = search.toLowerCase();
                list = list.filter(t => 
                    (t.order_id && t.order_id.toLowerCase().includes(s)) ||
                    (t.upi_ref_utr && t.upi_ref_utr.toLowerCase().includes(s)) ||
                    (t.customer_phone && t.customer_phone.includes(s)) ||
                    (t.customer_name && t.customer_name.toLowerCase().includes(s))
                );
            }

            const totalCount = list.length;
            const paged = list.slice(offset, offset + limit);
            return { transactions: paged, totalCount };
        },

        async getSummary() {
            const list = getTxns();
            const refunds = getRefundsList();

            let grossCollected = 0;
            let totalRefunded = 0;
            let successfulCount = 0;
            let pendingCount = 0;
            let failedCount = 0;
            let refundedCount = 0;

            for (const t of list) {
                const amt = Number(t.amount || 0);
                if (t.status === 'Successful' || t.status === 'PAID') {
                    grossCollected += amt;
                    successfulCount++;
                } else if (t.status === 'Pending' || t.status === 'Processing') {
                    pendingCount++;
                } else if (t.status === 'Failed' || t.status === 'Cancelled') {
                    failedCount++;
                } else if (t.status === 'Partially Refunded') {
                    grossCollected += amt;
                    refundedCount++;
                } else if (t.status === 'Refund Successful') {
                    refundedCount++;
                }
            }

            for (const r of refunds) {
                if (r.status === 'Refund Successful' || r.status === 'Completed') {
                    totalRefunded += Number(r.amount || 0);
                }
            }

            const netCollections = Math.max(0, grossCollected - totalRefunded);

            return {
                grossCollected: Number(grossCollected.toFixed(2)),
                totalRefunded: Number(totalRefunded.toFixed(2)),
                netCollections: Number(netCollections.toFixed(2)),
                totalTransactions: list.length,
                successfulCount,
                pendingCount,
                failedCount,
                refundedCount
            };
        }
    },

    // ==========================================
    // 2. PAYMENT REFUNDS
    // ==========================================
    refunds: {
        async createRefund(payload) {
            const id = payload.id || `ref_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
            const refundRefId = payload.refund_ref_id || payload.refundRefId || `rfnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            // Prevent duplicate refund with same idempotency key
            const existingList = getRefundsList();
            const dup = existingList.find(r => r.refund_ref_id === refundRefId);
            if (dup) {
                return { duplicate: true, refund: dup };
            }

            const record = {
                id,
                transaction_id: payload.transaction_id || payload.transactionId,
                order_id: payload.order_id || payload.orderId,
                refund_ref_id: refundRefId,
                amount: Number(payload.amount || 0).toFixed(2),
                currency: payload.currency || 'INR',
                status: payload.status || 'Refund Successful', // Confirmed authorized refund
                reason: payload.reason || 'Customer requested cancellation / item unavailable',
                failure_reason: payload.failure_reason || null,
                initiated_by: payload.initiated_by || payload.initiatedBy || 'Super Admin',
                provider_refund_id: payload.provider_refund_id || `prov_ref_${uuidv4().slice(0, 8)}`,
                metadata: payload.metadata || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            existingList.unshift(record);
            saveRefunds(existingList);

            // Update parent transaction status
            if (record.transaction_id) {
                const txn = await paymentDb.payments.getTransactionById(record.transaction_id);
                if (txn) {
                    const originalAmt = Number(txn.amount || 0);
                    const allRefundsForTxn = existingList.filter(r => r.transaction_id === txn.id && (r.status === 'Refund Successful' || r.status === 'Completed'));
                    const totalRefundedOnTxn = allRefundsForTxn.reduce((sum, r) => sum + Number(r.amount || 0), 0);

                    const newTxnStatus = totalRefundedOnTxn >= originalAmt ? 'Refund Successful' : 'Partially Refunded';
                    await paymentDb.payments.updateTransactionStatus(txn.id, {
                        status: newTxnStatus,
                        metadata: {
                            ...(txn.metadata || {}),
                            last_refund_id: record.id,
                            total_refunded: totalRefundedOnTxn
                        }
                    });
                }
            }

            // Sync to Supabase PostgreSQL
            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase.from('payment_refunds').upsert([record]);
                } catch (e) {
                    console.warn('[PaymentDb] Supabase refund insert note:', e.message);
                }
            }

            // Audit log
            await paymentDb.audit.logAction({
                action: 'REFUND_ISSUED',
                entityId: record.id,
                actorId: record.initiated_by,
                details: {
                    amount: record.amount,
                    orderId: record.order_id,
                    transactionId: record.transaction_id,
                    reason: record.reason
                }
            });

            return { success: true, refund: record };
        },

        async getRefundsByTransactionId(transactionId) {
            const list = getRefundsList();
            return list.filter(r => r.transaction_id === transactionId);
        },

        async getRefundsByOrderId(orderId) {
            const list = getRefundsList();
            return list.filter(r => r.order_id === orderId);
        },

        async getAllRefunds() {
            return [...getRefundsList()];
        }
    },

    // ==========================================
    // 3. AUDIT LOGS
    // ==========================================
    audit: {
        async logAction({ action, entityId, actorId, details = {} }) {
            const record = {
                id: `log_${uuidv4().replace(/-/g, '').slice(0, 16)}`,
                action,
                entity_id: entityId,
                actor_id: actorId,
                details,
                created_at: new Date().toISOString()
            };

            const list = getAuditList();
            list.unshift(record);
            if (list.length > 500) list.length = 500; // Cap at 500 recent audit events
            saveAudit(list);

            const supabase = getSupabaseClient();
            if (supabase) {
                try {
                    await supabase.from('payment_audit_logs').insert([record]);
                } catch (e) {}
            }
            return record;
        }
    }
};

module.exports = paymentDb;

const localDb = require('./localDb');
const { v4: uuidv4 } = require('uuid');

/**
 * Durable FIFO Synchronization Queue
 * Guarantees zero data loss by recording every local mutation in SQLite.
 */
class SyncQueue {
    /**
     * Executes workFn inside an atomic SQLite transaction.
     * Guarantees that local database updates and sync queue entries commit together.
     *
     * @param {Function} workFn - (db) => result
     * @returns {*} result of workFn
     */
    runAtomic(workFn) {
        const db = localDb.getDb();
        db.exec('BEGIN IMMEDIATE TRANSACTION;');
        try {
            const result = workFn(db);
            db.exec('COMMIT;');
            return result;
        } catch (err) {
            db.exec('ROLLBACK;');
            throw err;
        }
    }

    /**
     * Enqueues an operation into sync_queue with unique operation_id.
     */
    enqueue({
        operationId = null,
        tableName,
        recordId,
        operationType, // 'INSERT', 'UPDATE', 'DELETE', 'STOCK_DELTA'
        payload = null,
        delta = null
    }) {
        const db = localDb.getDb();
        const opId = operationId || `op_${Date.now()}_${uuidv4().slice(0, 8)}`;

        const stmt = db.prepare(`
            INSERT INTO sync_queue (
                operation_id, table_name, record_id, operation_type,
                payload, delta, status, retry_count, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, CURRENT_TIMESTAMP)
            ON CONFLICT(operation_id) DO NOTHING
        `);

        stmt.run(
            opId,
            tableName,
            String(recordId),
            operationType,
            payload ? JSON.stringify(payload) : null,
            delta ? JSON.stringify(delta) : null
        );

        return opId;
    }

    /**
     * Retrieves up to `limit` pending or retryable operations in strict FIFO order.
     */
    getPending(limit = 50) {
        const db = localDb.getDb();
        const rows = db.prepare(`
            SELECT * FROM sync_queue
            WHERE status IN ('PENDING', 'FAILED') AND retry_count < 10
            ORDER BY created_at ASC
            LIMIT ?
        `).all(limit);

        return rows.map(r => ({
            ...r,
            payload: r.payload ? JSON.parse(r.payload) : null,
            delta: r.delta ? JSON.parse(r.delta) : null
        }));
    }

    /**
     * Marks an operation as successfully synchronized to Supabase Cloud.
     */
    markSynced(operationId) {
        const db = localDb.getDb();
        db.prepare(`
            UPDATE sync_queue
            SET status = 'SYNCED', synced_at = CURRENT_TIMESTAMP, error_message = NULL
            WHERE operation_id = ?
        `).run(operationId);
    }

    /**
     * Records a failed synchronization attempt and increments the retry count.
     */
    markFailed(operationId, errorMessage) {
        const db = localDb.getDb();
        db.prepare(`
            UPDATE sync_queue
            SET status = 'FAILED', retry_count = retry_count + 1, error_message = ?
            WHERE operation_id = ?
        `).run(errorMessage, operationId);
    }

    /**
     * Retrieves queue statistics for monitoring and dashboards.
     */
    getStats() {
        const db = localDb.getDb();
        const rows = db.prepare(`
            SELECT status, COUNT(*) as count
            FROM sync_queue
            GROUP BY status
        `).all();

        const stats = { PENDING: 0, PROCESSING: 0, SYNCED: 0, FAILED: 0, total: 0 };
        rows.forEach(r => {
            stats[r.status] = r.count;
            stats.total += r.count;
        });
        return stats;
    }

    /**
     * Records a tombstone to prevent deleted records from reappearing.
     */
    recordTombstone(tableName, recordId) {
        const db = localDb.getDb();
        const id = `tomb_${Date.now()}_${uuidv4().slice(0, 6)}`;
        db.prepare(`
            INSERT INTO sync_tombstones (id, table_name, record_id, deleted_at, synced)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)
        `).run(id, tableName, String(recordId));
    }

    /**
     * Checks if a record has been explicitly deleted.
     */
    isDeleted(tableName, recordId) {
        const db = localDb.getDb();
        const row = db.prepare(`
            SELECT id FROM sync_tombstones
            WHERE table_name = ? AND record_id = ?
        `).get(tableName, String(recordId));
        return Boolean(row);
    }
}

module.exports = new SyncQueue();

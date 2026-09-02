const localDb = require('./localDb');
const { v4: uuidv4 } = require('uuid');

/**
 * Domain-Aware Conflict Resolution Engine
 * Implements fine-grained reconciliation policies for stock deltas,
 * monotonic order states, and customer data preservation.
 */
class ConflictResolver {
    constructor() {
        // Monotonic progression map for order statuses
        this.orderStatusRanks = {
            'Order Placed': 1,
            'Order Confirmed': 2,
            'Confirmed': 2,
            'Preparing': 3,
            'Out for Delivery': 4,
            'Delivered': 5,
            'Cancelled': -1
        };
    }

    /**
     * Resolves product stock synchronization using delta operations.
     * Prevents offline stock counts from erasing concurrent cloud restocks or sales.
     *
     * @param {Object} cloudProduct - Existing product in Supabase
     * @param {Object} localOperation - Local sync queue operation containing delta or payload
     * @returns {Object} Reconciled product update payload
     */
    resolveStock(cloudProduct, localOperation) {
        const cloudStock = Number(cloudProduct?.stock_left ?? 0);

        // If local operation has an explicit delta (+N or -N)
        if (localOperation.delta && typeof localOperation.delta.delta === 'number') {
            const adjustedStock = Math.max(0, cloudStock + localOperation.delta.delta);
            return {
                stock_left: adjustedStock,
                in_stock: adjustedStock > 0
            };
        }

        // Fallback: If absolute stock was supplied, check timestamps
        const localStock = Number(localOperation.payload?.stock_left ?? 0);
        const localTime = new Date(localOperation.created_at || Date.now()).getTime();
        const cloudTime = new Date(cloudProduct?.updated_at || cloudProduct?.created_at || 0).getTime();

        if (localTime >= cloudTime) {
            return {
                stock_left: localStock,
                in_stock: localStock > 0
            };
        }

        return {
            stock_left: cloudStock,
            in_stock: cloudStock > 0
        };
    }

    /**
     * Resolves order status transitions using monotonic lifecycle rules.
     * Ensures an advanced status (e.g. Delivered) is NEVER downgraded to an earlier status.
     *
     * @param {string} localStatus - Status from local database
     * @param {string} cloudStatus - Status from Supabase cloud
     * @returns {string} The authoritative reconciled status
     */
    resolveOrderStatus(localStatus, cloudStatus) {
        if (!cloudStatus) return localStatus;
        if (!localStatus) return cloudStatus;

        // If either side marked it as Cancelled, Cancellation takes precedence
        if (localStatus === 'Cancelled' || cloudStatus === 'Cancelled') {
            return 'Cancelled';
        }

        const localRank = this.orderStatusRanks[localStatus] || 0;
        const cloudRank = this.orderStatusRanks[cloudStatus] || 0;

        // Choose whichever status is further along the delivery pipeline
        return localRank >= cloudRank ? localStatus : cloudStatus;
    }

    /**
     * Reconciles customer profile changes without data loss.
     * Merges non-conflicting fields; logs conflicts for admin inspection.
     *
     * @param {Object} localUser - User profile from SQLite
     * @param {Object} cloudUser - User profile from Supabase
     * @returns {Object} Reconciled user profile
     */
    resolveUserProfile(localUser, cloudUser) {
        if (!cloudUser) return localUser;
        if (!localUser) return cloudUser;

        const merged = { ...cloudUser, ...localUser };

        // Check if sensitive identifiers conflict
        const emailConflict = localUser.email && cloudUser.email && localUser.email.toLowerCase() !== cloudUser.email.toLowerCase();
        const phoneConflict = localUser.phone && cloudUser.phone && localUser.phone !== cloudUser.phone;

        if (emailConflict || phoneConflict) {
            this.recordConflict({
                tableName: 'users',
                recordId: localUser.id,
                localData: localUser,
                cloudData: cloudUser,
                reason: `Profile divergence: ${emailConflict ? 'email mismatch' : ''} ${phoneConflict ? 'phone mismatch' : ''}`.trim()
            });
        }

        return merged;
    }

    /**
     * Preserves conflicting records in sync_conflicts table without deleting either version.
     */
    recordConflict({ tableName, recordId, localData, cloudData, reason }) {
        const db = localDb.getDb();
        const id = `conf_${Date.now()}_${uuidv4().slice(0, 6)}`;

        try {
            db.prepare(`
                INSERT INTO sync_conflicts (
                    id, table_name, record_id, local_version,
                    cloud_version, conflict_reason, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'UNRESOLVED', CURRENT_TIMESTAMP)
            `).run(
                id,
                tableName,
                String(recordId),
                JSON.stringify(localData || {}),
                JSON.stringify(cloudData || {}),
                reason || 'Concurrent divergence'
            );
            console.warn(`[Sync Conflict Recorded]: ${tableName} ID ${recordId} - ${reason}`);
        } catch (err) {
            console.error('[Failed to record conflict]:', err.message);
        }
        return id;
    }

    /**
     * Retrieves all unresolved conflicts for admin dashboard inspection.
     */
    getUnresolvedConflicts() {
        const db = localDb.getDb();
        const rows = db.prepare(`
            SELECT * FROM sync_conflicts
            WHERE status = 'UNRESOLVED'
            ORDER BY created_at DESC
        `).all();

        return rows.map(r => ({
            ...r,
            local_version: JSON.parse(r.local_version || '{}'),
            cloud_version: JSON.parse(r.cloud_version || '{}')
        }));
    }

    /**
     * Marks a conflict as resolved by an administrator.
     */
    resolveConflict(conflictId, resolutionNotes = 'Manually resolved by admin') {
        const db = localDb.getDb();
        db.prepare(`
            UPDATE sync_conflicts
            SET status = 'RESOLVED', resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(resolutionNotes, conflictId);
    }
}

module.exports = new ConflictResolver();

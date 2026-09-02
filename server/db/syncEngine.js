const { getSupabaseClient } = require('../supabase');
const localDb = require('./localDb');
const syncQueue = require('./syncQueue');
const conflictResolver = require('./conflictResolver');
const backupManager = require('./backupManager');

/**
 * Robust Bidirectional Synchronization Engine
 * Bridges Supabase Cloud PostgreSQL and Local SQLite with offline resilience,
 * atomic queue draining, conflict reconciliation, and integrity verification.
 */
class SyncEngine {
    constructor() {
        this.status = 'ONLINE'; // 'ONLINE', 'OFFLINE', 'SYNCING'
        this.lastSuccessfulSync = null;
        this.failureCount = 0;
        this.syncInProgress = false;
        this.timer = null;

        // Exponential backoff intervals in milliseconds
        this.backoffIntervals = [5000, 10000, 30000, 60000, 300000];
    }

    /**
     * Start background connectivity monitor and auto-synchronization
     */
    start(intervalMs = 15000) {
        if (this.timer) clearInterval(this.timer);

        console.log(`[SyncEngine] Started background synchronization monitor (interval: ${intervalMs}ms)`);
        this.timer = setInterval(async () => {
            await this.checkConnectivityAndSync();
        }, intervalMs);

        // Run initial health check immediately
        this.checkConnectivityAndSync().catch(err => {
            console.warn('[SyncEngine Initial Check]:', err.message);
        });
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Periodic monitor: Tests Supabase reachability, handles circuit breaking,
     * and triggers synchronization upon recovery or pending local writes.
     */
    async checkConnectivityAndSync() {
        const isOnline = await this.pingCloud();

        if (!isOnline) {
            if (this.status !== 'OFFLINE') {
                this.status = 'OFFLINE';
                this.updateCheckpointStatus('OFFLINE');
                console.warn('[SyncEngine] ⚠️ Cloud connection lost! Switched to OFFLINE / LOCAL MODE.');
            }
            this.failureCount++;
            return;
        }

        // Connection restored or healthy
        if (this.status === 'OFFLINE') {
            console.log('[SyncEngine] 🟢 Cloud connection restored! Resuming synchronization...');
            this.status = 'ONLINE';
            this.failureCount = 0;
            this.updateCheckpointStatus('ONLINE');
        }

        const pendingCount = syncQueue.getStats().PENDING;
        if (pendingCount > 0 && !this.syncInProgress) {
            await this.syncNow();
        }
    }

    /**
     * Low-latency ping to test Supabase PostgREST availability with timeout
     */
    async pingCloud() {
        try {
            const supabase = getSupabaseClient();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Cloud ping timeout')), 4000)
            );

            const queryPromise = supabase.from('products').select('id').limit(1);
            await Promise.race([queryPromise, timeoutPromise]);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * Executes the complete bidirectional synchronization sequence.
     * Safe, idempotent, non-destructive, and resumable.
     */
    async syncNow() {
        if (this.syncInProgress) {
            console.log('[SyncEngine] Sync already in progress, skipping duplicate call.');
            return { success: false, reason: 'Sync already in progress' };
        }

        this.syncInProgress = true;
        this.status = 'SYNCING';
        this.updateCheckpointStatus('SYNCING');

        try {
            console.log('[SyncEngine] Starting synchronization cycle...');

            // Step 1: Pre-sync safety snapshot
            try { backupManager.createPreSyncSnapshot(); } catch (e) {}

            // Step 2: Push local pending changes (LOCAL -> SUPABASE)
            const pushResult = await this.pushLocalPendingChanges();

            // Step 3: Pull cloud updates (SUPABASE -> LOCAL)
            const pullResult = await this.pullCloudChanges();

            // Step 4: Verify database integrity
            const verification = await this.verifyIntegrity();

            // Step 5: Mark successful synchronization checkpoint
            this.lastSuccessfulSync = new Date().toISOString();
            this.status = 'ONLINE';
            this.updateCheckpointStatus('ONLINE', this.lastSuccessfulSync);

            console.log(`[SyncEngine] ✅ Synchronization cycle completed! Pushed: ${pushResult.syncedCount}, Pulled: ${pullResult.pulledCount}`);

            return {
                success: true,
                pushed: pushResult.syncedCount,
                pulled: pullResult.pulledCount,
                verification,
                lastSync: this.lastSuccessfulSync
            };
        } catch (syncErr) {
            console.error('[SyncEngine] ❌ Sync cycle failed:', syncErr.message);
            this.status = 'ONLINE';
            this.updateCheckpointStatus('ERROR');
            return { success: false, error: syncErr.message };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Pushes pending operations from SQLite sync_queue to Supabase Cloud
     */
    async pushLocalPendingChanges() {
        const supabase = getSupabaseClient();
        const pending = syncQueue.getPending(50);
        let syncedCount = 0;

        for (const op of pending) {
            try {
                if (op.operation_type === 'UPDATE') {
                    if (op.table_name === 'products') {
                        if (op.delta) {
                            const { data: cloudP } = await supabase.from('products').select('*').eq('id', op.record_id).single();
                            const resolved = conflictResolver.resolveStock(cloudP, op);
                            await supabase.from('products').update(resolved).eq('id', op.record_id);
                        } else {
                            // Extract valid table columns from payload
                            const updateFields = { ...op.payload };
                            delete updateFields.stock_left; // Virtual tag-based column
                            await supabase.from('products').update(updateFields).eq('id', op.record_id);
                        }
                    } else if (op.table_name === 'orders') {
                        const { data: cloudO } = await supabase.from('orders').select('status').eq('id', op.record_id).single();
                        const resolvedStatus = conflictResolver.resolveOrderStatus(op.payload?.status, cloudO?.status);
                        await supabase.from('orders').update({ ...op.payload, status: resolvedStatus }).eq('id', op.record_id);
                    } else {
                        await supabase.from(op.table_name).update(op.payload).eq('id', op.record_id);
                    }
                } else if (op.operation_type === 'INSERT') {
                    if (op.table_name === 'products') {
                        const insertData = { ...op.payload };
                        delete insertData.stock_left;
                        await supabase.from('products').upsert([insertData]);
                    } else {
                        await supabase.from(op.table_name).upsert([op.payload]);
                    }
                } else if (op.operation_type === 'STOCK_DELTA') {
                    const { data: cloudP } = await supabase.from('products').select('*').eq('id', op.record_id).single();
                    const resolved = conflictResolver.resolveStock(cloudP, op);
                    await supabase.from('products').update(resolved).eq('id', op.record_id);
                } else if (op.operation_type === 'DELETE') {
                    // Explicit tombstone deletion
                    await supabase.from(op.table_name).delete().eq('id', op.record_id);
                }

                syncQueue.markSynced(op.operation_id);
                syncedCount++;
            } catch (err) {
                console.error(`[SyncEngine Push Error] Op ${op.operation_id} on ${op.table_name}:`, err.message);
                syncQueue.markFailed(op.operation_id, err.message);
            }
        }

        return { syncedCount };
    }

    /**
     * Pulls latest changes from Supabase Cloud to Local SQLite
     */
    async pullCloudChanges() {
        const supabase = getSupabaseClient();
        let pulledCount = 0;

        // Pull active products
        const { data: cloudProducts } = await supabase.from('products').select('*');
        if (cloudProducts && cloudProducts.length > 0) {
            for (const p of cloudProducts) {
                if (!syncQueue.isDeleted('products', p.id)) {
                    localDb.products.upsert(p);
                    pulledCount++;
                }
            }
        }

        // Pull users
        const { data: cloudUsers } = await supabase.from('users').select('*');
        if (cloudUsers && cloudUsers.length > 0) {
            for (const u of cloudUsers) {
                localDb.users.createUser(u);
                pulledCount++;
            }
        }

        // Pull orders
        const { data: cloudOrders } = await supabase.from('orders').select('*');
        if (cloudOrders && cloudOrders.length > 0) {
            for (const o of cloudOrders) {
                const existing = localDb.orders.getOrderById(o.id);
                if (!existing) {
                    // Fetch order items for new cloud orders
                    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);
                    localDb.orders.createOrder(o, items || []);
                    pulledCount++;
                } else {
                    // Monotonic status resolution
                    const resolved = conflictResolver.resolveOrderStatus(existing.status, o.status);
                    if (resolved !== existing.status) {
                        localDb.orders.updateStatus(o.id, resolved);
                        pulledCount++;
                    }
                }
            }
        }

        // Pull availability
        const { data: cloudAvail } = await supabase.from('app_availability').select('*').eq('id', 'store_main').single();
        if (cloudAvail) {
            localDb.availability.updateStatus(cloudAvail);
        }

        return { pulledCount };
    }

    /**
     * Initial Bootstrap: Downloads complete dataset from Supabase into empty SQLite database.
     * SUPABASE -> LOCAL ONLY. Never deletes anything from Supabase.
     */
    async bootstrapFromCloud() {
        console.log('[SyncEngine] 📦 Initiating Initial Database Bootstrap (Supabase -> Local)...');
        const supabase = getSupabaseClient();
        const counts = { users: 0, products: 0, orders: 0, order_items: 0 };

        // 1. Users
        const { data: users, error: uErr } = await supabase.from('users').select('*');
        if (!uErr && users) {
            users.forEach(u => localDb.users.createUser(u));
            counts.users = users.length;
        }

        // 2. Products
        const { data: products, error: pErr } = await supabase.from('products').select('*');
        if (!pErr && products) {
            products.forEach(p => localDb.products.upsert(p));
            counts.products = products.length;
        }

        // 3. Orders & Order Items
        const { data: orders, error: oErr } = await supabase.from('orders').select('*');
        if (!oErr && orders) {
            for (const o of orders) {
                const { data: items } = await supabase.from('order_items').select('*').eq('order_id', o.id);
                localDb.orders.createOrder(o, items || []);
                counts.order_items += (items ? items.length : 0);
            }
            counts.orders = orders.length;
        }

        // 4. Availability
        const { data: avail } = await supabase.from('app_availability').select('*').eq('id', 'store_main').single();
        if (avail) localDb.availability.updateStatus(avail);

        this.lastSuccessfulSync = new Date().toISOString();
        this.updateCheckpointStatus('ONLINE', this.lastSuccessfulSync);
        console.log(`[SyncEngine] 🎉 Bootstrap complete! Initialized local SQLite: Users=${counts.users}, Products=${counts.products}, Orders=${counts.orders}`);
        return counts;
    }

    /**
     * Verifies row counts, foreign key integrity, and queue status
     */
    async verifyIntegrity() {
        const db = localDb.getDb();
        const fkViolations = db.prepare('PRAGMA foreign_key_check;').all();

        const localProductsCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
        const localOrdersCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
        const localUsersCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
        const queueStats = syncQueue.getStats();

        return {
            foreignKeysValid: fkViolations.length === 0,
            violations: fkViolations,
            localCounts: {
                products: localProductsCount,
                orders: localOrdersCount,
                users: localUsersCount
            },
            queueStats
        };
    }

    updateCheckpointStatus(status, timestamp = null) {
        const db = localDb.getDb();
        db.prepare(`
            UPDATE sync_checkpoints
            SET status = ?, last_local_sync = CURRENT_TIMESTAMP,
                last_cloud_sync = COALESCE(?, last_cloud_sync)
            WHERE id = 'main'
        `).run(status, timestamp);
    }

    getSyncStatus() {
        const db = localDb.getDb();
        const checkpoint = db.prepare('SELECT * FROM sync_checkpoints WHERE id = \'main\'').get() || {};
        const queueStats = syncQueue.getStats();
        const conflictsCount = db.prepare('SELECT COUNT(*) as c FROM sync_conflicts WHERE status = \'UNRESOLVED\'').get().c;

        return {
            mode: this.status,
            syncInProgress: this.syncInProgress,
            lastSuccessfulSync: checkpoint.last_cloud_sync || this.lastSuccessfulSync,
            lastLocalSync: checkpoint.last_local_sync,
            queue: queueStats,
            unresolvedConflicts: conflictsCount
        };
    }
}

module.exports = new SyncEngine();

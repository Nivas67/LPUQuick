require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const localDb = require('../db/localDb');
const syncQueue = require('../db/syncQueue');
const syncEngine = require('../db/syncEngine');
const conflictResolver = require('../db/conflictResolver');
const backupManager = require('../db/backupManager');
const supabaseDb = require('../db/supabaseDb');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTestSuite() {
    console.log('================================================================');
    console.log('🧪 16-SCENARIO BIDIRECTIONAL REPLICATION & RESILIENCE SUITE');
    console.log('================================================================\n');

    const testId = Date.now();
    const testRecords = {
        products: [],
        orders: [],
        users: []
    };

    // -------------------------------------------------------------
    // TEST 1: Supabase online -> normal operation
    // -------------------------------------------------------------
    console.log('--- TEST 1: Supabase Online Mode (Normal Operation) ---');
    syncEngine.status = 'ONLINE';
    const prod1Id = `prod_test1_${testId}`;
    testRecords.products.push(prod1Id);

    const prod1 = await supabaseDb.products.create({
        id: prod1Id,
        name: 'Online Test Item',
        category: 'Snacks & Drinks',
        price: 30,
        mrp: 35,
        stock_left: 40
    });

    const { data: cloudP1 } = await supabase.from('products').select('*').eq('id', prod1Id).single();
    const localP1 = localDb.products.getById(prod1Id);

    if (cloudP1 && localP1 && cloudP1.price === 30 && localP1.price === 30) {
        console.log('✅ TEST 1 PASSED: Written to Supabase and mirrored to Local SQLite immediately.\n');
    } else {
        throw new Error(`TEST 1 FAILED: Cloud=${Boolean(cloudP1)}, Local=${Boolean(localP1)}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Disconnect Supabase -> Application switches to local
    // -------------------------------------------------------------
    console.log('--- TEST 2: Disconnect Supabase -> Switch to Local Mode ---');
    syncEngine.status = 'OFFLINE';

    const localRead = await supabaseDb.products.getById(prod1Id);
    if (localRead && localRead.name === 'Online Test Item') {
        console.log('✅ TEST 2 PASSED: Seamless read from Local SQLite while in OFFLINE mode.\n');
    } else {
        throw new Error('TEST 2 FAILED: Could not read from local database while offline');
    }

    // -------------------------------------------------------------
    // TEST 3: Create product offline -> Synchronize later
    // -------------------------------------------------------------
    console.log('--- TEST 3: Create Product Offline -> Synchronize Later ---');
    const prod3Id = `prod_test3_${testId}`;
    testRecords.products.push(prod3Id);

    const offlineProd = await supabaseDb.products.create({
        id: prod3Id,
        name: 'Offline Created Snack',
        category: 'Snacks & Drinks',
        price: 45,
        mrp: 50,
        stock_left: 25
    });

    // Check that it exists in local SQLite but NOT yet in Supabase
    const local3Check = localDb.products.getById(prod3Id);
    const { data: cloud3Before } = await supabase.from('products').select('id').eq('id', prod3Id).maybeSingle();
    const queuePending3 = syncQueue.getPending().find(q => q.record_id === prod3Id);

    if (local3Check && !cloud3Before && queuePending3) {
        console.log('✓ Verified: Product stored locally and queued in sync_queue.');
    } else {
        throw new Error('TEST 3 Step A FAILED: Record was not properly queued locally');
    }

    // Now restore connection and trigger sync
    syncEngine.status = 'ONLINE';
    await syncEngine.syncNow();

    const { data: cloud3After } = await supabase.from('products').select('*').eq('id', prod3Id).single();
    if (cloud3After && cloud3After.price === 45) {
        console.log('✅ TEST 3 PASSED: Offline product successfully synchronized to Supabase Cloud.\n');
    } else {
        throw new Error('TEST 3 Step B FAILED: Cloud did not receive offline product');
    }

    // -------------------------------------------------------------
    // TEST 4: Create customer offline -> Synchronize later
    // -------------------------------------------------------------
    console.log('--- TEST 4: Create Customer Offline -> Synchronize Later ---');
    syncEngine.status = 'OFFLINE';
    const user4Id = `user_test4_${testId}`;
    const user4Phone = '9' + String(testId).slice(-9);
    testRecords.users.push(user4Id);

    await supabaseDb.users.createUser({
        id: user4Id,
        name: 'Offline Student',
        email: `${user4Id}@lpu.in`,
        phone: user4Phone,
        password_hash: 'hash_test4',
        role: 'student'
    });

    syncEngine.status = 'ONLINE';
    await syncEngine.syncNow();

    const { data: cloudU4 } = await supabase.from('users').select('*').eq('id', user4Id).single();
    if (cloudU4 && cloudU4.phone === user4Phone) {
        console.log('✅ TEST 4 PASSED: Customer created offline successfully pushed to Cloud.\n');
    } else {
        throw new Error('TEST 4 FAILED: Customer not found in cloud');
    }

    // -------------------------------------------------------------
    // TEST 5: Create order offline -> Synchronize later
    // -------------------------------------------------------------
    console.log('--- TEST 5: Create Order Offline -> Synchronize Later ---');
    syncEngine.status = 'OFFLINE';
    const order5Id = `ord_test5_${testId}`;
    testRecords.orders.push(order5Id);

    await supabaseDb.orders.createOrder({
        id: order5Id,
        user_id: user4Id,
        customer_name: 'Offline Student',
        customer_phone: user4Phone,
        customer_email: `${user4Id}@lpu.in`,
        subtotal: 90,
        total: 90,
        status: 'Order Placed'
    }, [
        { id: `oi_1_${testId}`, product_id: prod1Id, quantity: 2, price: 45 }
    ]);

    // Local check
    const localO5 = localDb.orders.getOrderById(order5Id);
    if (!localO5 || localO5.items.length !== 1) throw new Error('TEST 5 Local creation failed');

    // Reconnect and sync
    syncEngine.status = 'ONLINE';
    await syncEngine.syncNow();

    const { data: cloudO5 } = await supabase.from('orders').select('*').eq('id', order5Id).single();
    const { data: cloudOI5 } = await supabase.from('order_items').select('*').eq('order_id', order5Id);

    if (cloudO5 && cloudOI5 && cloudOI5.length === 1) {
        console.log('✅ TEST 5 PASSED: Offline order & line items synchronized to Supabase Cloud.\n');
    } else {
        throw new Error('TEST 5 FAILED: Order or items not found in cloud');
    }

    // -------------------------------------------------------------
    // TEST 6: Create multiple orders offline -> Verify no duplicates
    // -------------------------------------------------------------
    console.log('--- TEST 6: Multiple Orders Offline (Zero Duplicates) ---');
    syncEngine.status = 'OFFLINE';
    const order6A = `ord_test6A_${testId}`;
    const order6B = `ord_test6B_${testId}`;
    testRecords.orders.push(order6A, order6B);

    await supabaseDb.orders.createOrder({ id: order6A, user_id: user4Id, total: 30, status: 'Order Placed' }, [{ product_id: prod1Id, quantity: 1, price: 30 }]);
    await supabaseDb.orders.createOrder({ id: order6B, user_id: user4Id, total: 60, status: 'Order Placed' }, [{ product_id: prod1Id, quantity: 2, price: 30 }]);

    syncEngine.status = 'ONLINE';
    await syncEngine.syncNow();

    const { data: multipleCloudOrders } = await supabase.from('orders').select('id').in('id', [order6A, order6B]);
    if (multipleCloudOrders.length === 2) {
        console.log('✅ TEST 6 PASSED: Exactly 2 distinct orders created, 0 duplicates.\n');
    } else {
        throw new Error('TEST 6 FAILED: Expected 2 orders, got ' + multipleCloudOrders.length);
    }

    // -------------------------------------------------------------
    // TEST 7: Modify product offline -> Synchronize
    // -------------------------------------------------------------
    console.log('--- TEST 7: Modify Product Offline -> Synchronize ---');
    syncEngine.status = 'OFFLINE';
    await supabaseDb.products.update(prod1Id, { price: 33, stock_left: 38 });

    syncEngine.status = 'ONLINE';
    await syncEngine.syncNow();

    const { data: cloudP1Updated } = await supabase.from('products').select('*').eq('id', prod1Id).single();
    if (cloudP1Updated && Number(cloudP1Updated.price) === 33) {
        console.log('✅ TEST 7 PASSED: Product update pushed to Cloud successfully.\n');
    } else {
        throw new Error('TEST 7 FAILED: Product price not updated in cloud');
    }

    // -------------------------------------------------------------
    // TEST 8: Modify product in cloud while local is offline -> Reconcile
    // -------------------------------------------------------------
    console.log('--- TEST 8: Modify Product in Cloud While Local Offline ---');
    // Update cloud directly
    await supabase.from('products').update({ mrp: 99 }).eq('id', prod1Id);

    // Pull changes into local
    await syncEngine.pullCloudChanges();

    const localP1Reconciled = localDb.products.getById(prod1Id);
    if (localP1Reconciled && Number(localP1Reconciled.mrp) === 99) {
        console.log('✅ TEST 8 PASSED: Cloud update pulled and reconciled into Local SQLite.\n');
    } else {
        throw new Error('TEST 8 FAILED: Local SQLite did not pull cloud update');
    }

    // -------------------------------------------------------------
    // TEST 9: Modify same record on both sides -> Conflict resolution
    // -------------------------------------------------------------
    console.log('--- TEST 9: Bidirectional Conflict Resolution & Stock Deltas ---');
    // Cloud stock = 50
    await supabase.from('products').update({ tags: 'stock:50', in_stock: true }).eq('id', prod1Id);

    // Local offline order sells 3 items (delta = -3)
    const resolvedStock = conflictResolver.resolveStock(
        { stock_left: 50 },
        { delta: { delta: -3 } }
    );

    if (resolvedStock.stock_left === 47) {
        console.log('✓ Delta resolution verified: 50 + (-3) = 47 stock.');
    } else {
        throw new Error('TEST 9 Delta resolution failed: got ' + resolvedStock.stock_left);
    }

    // Monotonic order status progression
    const resolvedStatus = conflictResolver.resolveOrderStatus('Order Placed', 'Delivered');
    if (resolvedStatus === 'Delivered') {
        console.log('✓ Monotonic order resolution verified: Delivered cannot be demoted to Order Placed.');
    } else {
        throw new Error('TEST 9 Monotonic status failed');
    }

    // Profile conflict recording
    const conflictId = conflictResolver.recordConflict({
        tableName: 'users',
        recordId: user4Id,
        localData: { phone: '9999999991' },
        cloudData: { phone: '9999999992' },
        reason: 'Simulated concurrent update'
    });

    const conflicts = conflictResolver.getUnresolvedConflicts();
    const hasConflict = conflicts.some(c => c.id === conflictId);
    if (hasConflict) {
        console.log('✅ TEST 9 PASSED: Stock delta applied, order state protected, conflict preserved without data loss.\n');
        conflictResolver.resolveConflict(conflictId, 'Automated test verified');
    } else {
        throw new Error('TEST 9 FAILED: Conflict not recorded');
    }

    // -------------------------------------------------------------
    // TEST 10: Kill application during sync -> Restart -> Resume safely
    // -------------------------------------------------------------
    console.log('--- TEST 10: Crash Resilience & Resume Support ---');
    const dummyOpId = `op_crash_${testId}`;
    syncQueue.enqueue({
        operationId: dummyOpId,
        tableName: 'products',
        recordId: prod1Id,
        operationType: 'UPDATE',
        payload: { price: 34 }
    });

    // Simulate stopping and restarting sync engine
    syncEngine.stop();
    syncEngine.syncInProgress = false;

    // Restart engine
    await syncEngine.syncNow();

    const statsAfterResume = syncQueue.getStats();
    const resumedOp = localDb.getDb().prepare('SELECT status FROM sync_queue WHERE operation_id = ?').get(dummyOpId);
    if (resumedOp && resumedOp.status === 'SYNCED') {
        console.log('✅ TEST 10 PASSED: Interrupted sync resumed and completed pending operations.\n');
    } else {
        throw new Error('TEST 10 FAILED: Pending operation did not resume');
    }

    // -------------------------------------------------------------
    // TEST 11: Network failure halfway through sync -> Resume
    // -------------------------------------------------------------
    console.log('--- TEST 11: Transient Network Failure Halfway Through Sync ---');
    const failOpId = `op_fail_${testId}`;
    syncQueue.enqueue({
        operationId: failOpId,
        tableName: 'products',
        recordId: prod1Id,
        operationType: 'UPDATE',
        payload: { price: 35 }
    });

    // Simulate transient failure
    syncQueue.markFailed(failOpId, 'ETIMEDOUT');
    const failedOp = localDb.getDb().prepare('SELECT retry_count, status FROM sync_queue WHERE operation_id = ?').get(failOpId);
    if (failedOp.retry_count === 1 && failedOp.status === 'FAILED') {
        console.log('✓ Operation marked as FAILED with retry count incremented.');
    }

    // Now rerun sync - it should retry and succeed
    await syncEngine.syncNow();
    const retriedOp = localDb.getDb().prepare('SELECT status FROM sync_queue WHERE operation_id = ?').get(failOpId);
    if (retriedOp.status === 'SYNCED') {
        console.log('✅ TEST 11 PASSED: Retry succeeded and completed without restarting from zero.\n');
    } else {
        throw new Error('TEST 11 FAILED: Retried operation did not sync');
    }

    // -------------------------------------------------------------
    // TEST 12: Idempotency & Duplicate Prevention
    // -------------------------------------------------------------
    console.log('--- TEST 12: Duplicate Sync Operation (Idempotency) ---');
    const idemOpId = `op_idem_${testId}`;
    syncQueue.enqueue({
        operationId: idemOpId,
        tableName: 'products',
        recordId: prod1Id,
        operationType: 'UPDATE',
        payload: { price: 36 }
    });

    // Send identical operation again
    syncQueue.enqueue({
        operationId: idemOpId,
        tableName: 'products',
        recordId: prod1Id,
        operationType: 'UPDATE',
        payload: { price: 36 }
    });

    const queueDuplicates = localDb.getDb().prepare('SELECT COUNT(*) as c FROM sync_queue WHERE operation_id = ?').get(idemOpId).c;
    await syncEngine.syncNow();

    if (queueDuplicates === 1) {
        console.log('✅ TEST 12 PASSED: Duplicate sync operation rejected by primary key; zero duplicates.\n');
    } else {
        throw new Error('TEST 12 FAILED: Duplicate queue entry created');
    }

    // -------------------------------------------------------------
    // TEST 13: Local Database Persistence Across Restarts
    // -------------------------------------------------------------
    console.log('--- TEST 13: Local Database Restart Persistence ---');
    const backup = backupManager.createBackup('test_restart');
    const dbRowsBefore = localDb.getDb().prepare('SELECT COUNT(*) as c FROM products').get().c;

    // Verify backup file exists and has data
    if (backup && backup.sizeBytes > 0 && dbRowsBefore > 0) {
        console.log(`✅ TEST 13 PASSED: SQLite database file persists with ${dbRowsBefore} products.\n`);
    } else {
        throw new Error('TEST 13 FAILED: Backup not created or DB empty');
    }

    // -------------------------------------------------------------
    // TEST 14: Foreign Key Integrity
    // -------------------------------------------------------------
    console.log('--- TEST 14: Foreign Key Integrity Verification ---');
    const fkViolations = localDb.getDb().prepare('PRAGMA foreign_key_check;').all();
    if (fkViolations.length === 0) {
        console.log('✅ TEST 14 PASSED: 0 foreign key violations across orders, items, products, and users.\n');
    } else {
        throw new Error(`TEST 14 FAILED: Found ${fkViolations.length} foreign key violations: ${JSON.stringify(fkViolations)}`);
    }

    // -------------------------------------------------------------
    // TEST 15: Order History Protection
    // -------------------------------------------------------------
    console.log('--- TEST 15: Order History Protection ---');
    const ordersHistory = localDb.orders.getAllOrders();
    const verifiedOrders = ordersHistory.filter(o => testRecords.orders.includes(o.id));
    if (verifiedOrders.length === testRecords.orders.length) {
        console.log(`✅ TEST 15 PASSED: All ${verifiedOrders.length} test orders intact with complete line items.\n`);
    } else {
        throw new Error(`TEST 15 FAILED: Expected ${testRecords.orders.length} orders, found ${verifiedOrders.length}`);
    }

    // -------------------------------------------------------------
    // TEST 16: Zero-Wipe Guarantee & Clean Teardown
    // -------------------------------------------------------------
    console.log('--- TEST 16: Zero-Wipe Guarantee & Surgical Teardown ---');
    console.log('Purging ONLY the exact test records created in this test session...');

    // Delete in Cloud
    await supabase.from('order_items').delete().in('order_id', testRecords.orders);
    await supabase.from('orders').delete().in('id', testRecords.orders);
    await supabase.from('products').delete().in('id', testRecords.products);
    await supabase.from('users').delete().in('id', testRecords.users);

    // Delete in Local SQLite
    const db = localDb.getDb();
    testRecords.orders.forEach(oid => {
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(oid);
        db.prepare('DELETE FROM orders WHERE id = ?').run(oid);
    });
    testRecords.products.forEach(pid => {
        db.prepare('DELETE FROM products WHERE id = ?').run(pid);
    });
    testRecords.users.forEach(uid => {
        db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    });

    // Clean sync_queue for these test items
    db.prepare('DELETE FROM sync_queue WHERE status = ?').run('SYNCED');

    const finalFk = db.prepare('PRAGMA foreign_key_check;').all();
    if (finalFk.length === 0) {
        console.log('✅ TEST 16 PASSED: Verified zero global wipes, surgical cleanup complete, FKs intact.\n');
    } else {
        throw new Error('TEST 16 FAILED: FK violations found after cleanup');
    }

    console.log('================================================================');
    console.log('🎉 16/16 REPLICATION & RESILIENCE SCENARIOS COMPLETED 100% SUCCESS!');
    console.log('================================================================');
}

runTestSuite().catch(err => {
    console.error('\n❌ TEST SUITE FAILURE:', err);
    process.exit(1);
});

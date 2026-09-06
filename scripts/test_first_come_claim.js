const { generateAdminToken } = require('../server/middleware/adminAuth');
require('dotenv').config();
const { supabaseDb } = require('../server/db/supabaseDb');

const BASE_URL = 'http://127.0.0.1:3000';

const rider1Id = 'admin_5dcb05eba7';
const rider1Name = 'Flash Man';
const rider1Token = generateAdminToken(rider1Id, 'admin');

const rider2Id = 'user_2dae5b56';
const rider2Name = 'Caption America';
const rider2Token = generateAdminToken(rider2Id, 'admin');

const rider3Id = 'admin_214ff5d346';
const rider3Name = 'Jhonysins';
const rider3Token = generateAdminToken(rider3Id, 'admin');

async function api(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, ok: res.ok, data };
}

async function run() {
    console.log('====================================================');
    console.log('TEST: First-Come-First-Served (FCFS) Order Acceptance');
    console.log('====================================================\n');

    // 1. Ensure riders are online
    console.log('1. Setting riders to Active (Online)...');
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider1Id, status: 'Active' })
    });
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider2Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider2Id, status: 'Active' })
    });
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider3Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider3Id, status: 'Active' })
    });
    console.log('   All test riders are ON DUTY.\n');

    // 2. Create or reset a test order for race condition testing
    const testOrderId = `test_fcfs_${Date.now()}`;
    console.log(`2. Creating unassigned test order: ${testOrderId}...`);
    
    // We can use supabase directly to insert the clean test order
    const { getSupabaseClient } = require('../server/supabase');
    const supabase = getSupabaseClient();
    
    const { error: insertErr } = await supabase
        .from('orders')
        .insert({
            id: testOrderId,
            user_id: 'user_cff3667f',
            customer_name: 'FCFS Concurrency Test User',
            customer_phone: '9999999999',
            customer_email: 'fcfstest@example.com',
            status: 'Order Placed',
            total: 199,
            subtotal: 199,
            delivery_fee: 0,
            platform_fee: 0,
            tax: 0,
            payment_method: 'cod',
            payment_status: 'pending',
            delivery_address: 'BH1 Room 101',
            created_at: new Date().toISOString(),
            rider_name: null
        });

    if (insertErr) {
        console.error('Failed to insert test order:', insertErr);
        process.exit(1);
    }
    console.log('   Test order created successfully.\n');

    // 3. Fire simultaneous concurrent claims via Promise.all
    console.log('3. Simulating concurrent click on "Accept Delivery" by 2 riders...');
    console.log(`   Rider 1: ${rider1Name} (${rider1Id})`);
    console.log(`   Rider 2: ${rider2Name} (${rider2Id})`);

    const t0 = Date.now();
    const [res1, res2] = await Promise.all([
        api(`/api/orders/${testOrderId}/claim`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${rider1Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId: rider1Id, adminName: rider1Name })
        }),
        api(`/api/orders/${testOrderId}/claim`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${rider2Token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adminId: rider2Id, adminName: rider2Name })
        })
    ]);
    const duration = Date.now() - t0;
    console.log(`   Both requests finished in ${duration}ms.\n`);

    console.log('4. Analyzing results:');
    console.log(`   Rider 1 (${rider1Name}) Response: HTTP ${res1.status} ->`, res1.data);
    console.log(`   Rider 2 (${rider2Name}) Response: HTTP ${res2.status} ->`, res2.data);

    let winner = null;
    let loser = null;
    let loserRes = null;

    if (res1.status === 200 && res2.status === 409) {
        winner = { id: rider1Id, name: rider1Name };
        loser = { id: rider2Id, name: rider2Name };
        loserRes = res2;
    } else if (res2.status === 200 && res1.status === 409) {
        winner = { id: rider2Id, name: rider2Name };
        loser = { id: rider1Id, name: rider1Name };
        loserRes = res1;
    } else {
        console.error('❌ RACE CONDITION FAILED: Expected exactly one 200 and one 409!');
        console.error('res1 status:', res1.status, 'res2 status:', res2.status);
        process.exit(1);
    }

    console.log(`\n   🏆 WINNER (First Accepted): ${winner.name}`);
    console.log(`   ⛔ REJECTED (Second Attempt): ${loser.name}`);
    console.log(`   Conflict message sent to ${loser.name}: "${loserRes.data.error}"`);
    console.log(`   Conflict error code: "${loserRes.data.code}"`);
    console.log(`   Winner reported in conflict payload: "${loserRes.data.claimed_by}"`);

    if (loserRes.data.code !== 'ALREADY_CLAIMED') {
        console.error('❌ Expected loser error code to be ALREADY_CLAIMED, got:', loserRes.data.code);
        process.exit(1);
    }
    if (loserRes.data.claimed_by !== winner.name) {
        console.error(`❌ Expected loser payload claimed_by to match winner "${winner.name}", got:`, loserRes.data.claimed_by);
        process.exit(1);
    }
    console.log('   ✅ PASS: Winner successfully claimed, loser correctly received 409 Conflict with winner attribution.\n');

    // 5. Verify database integrity
    console.log('5. Verifying database row in Supabase...');
    const { data: dbOrder, error: dbErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', testOrderId)
        .single();

    if (dbErr || !dbOrder) {
        console.error('❌ Failed to fetch order from DB:', dbErr);
        process.exit(1);
    }

    const deliveryMeta = typeof dbOrder.rider_name === 'string' && dbOrder.rider_name.startsWith('{')
        ? JSON.parse(dbOrder.rider_name)
        : { name: dbOrder.rider_name };

    console.log('   DB rider_name meta:', deliveryMeta);
    if (deliveryMeta.admin_id !== winner.id || deliveryMeta.name !== winner.name) {
        console.error(`❌ DB corruption! Assigned rider in DB is not winner:`, deliveryMeta);
        process.exit(1);
    }
    console.log('   ✅ PASS: Database row preserved winner without being overwritten by second attempt.\n');

    // 6. Test subsequent claim attempt by a third rider
    console.log(`6. Testing subsequent claim by 3rd rider (${rider3Name})...`);
    const res3 = await api(`/api/orders/${testOrderId}/claim`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider3Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminId: rider3Id, adminName: rider3Name })
    });
    console.log(`   Rider 3 (${rider3Name}) Response: HTTP ${res3.status} ->`, res3.data);
    if (res3.status !== 409 || res3.data.code !== 'ALREADY_CLAIMED' || res3.data.claimed_by !== winner.name) {
        console.error('❌ Rider 3 should have received 409 ALREADY_CLAIMED with winner name!');
        process.exit(1);
    }
    console.log('   ✅ PASS: 3rd rider immediately blocked with 409 ALREADY_CLAIMED.\n');

    // 7. Cleanup test order
    console.log('7. Cleaning up test order...');
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('   Test order deleted.');

    console.log('\n====================================================');
    console.log('🎉 ALL FIRST-COME-FIRST-SERVED CONCURRENCY TESTS PASSED!');
    console.log('====================================================');
    process.exit(0);
}

run().catch(err => {
    console.error('Unhandled error in test runner:', err);
    process.exit(1);
});

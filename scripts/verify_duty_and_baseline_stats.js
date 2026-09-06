const fs = require('fs');
const path = require('path');
const { generateAdminToken } = require('../server/middleware/adminAuth');

const BASE_URL = 'http://127.0.0.1:3000';

const ownerToken = generateAdminToken('user_admin_bh13', 'admin');
const rider1Token = generateAdminToken('user_94597f1f', 'admin');
const rider2Token = generateAdminToken('admin_214ff5d346', 'admin');

const rider1Id = 'user_94597f1f';
const rider2Id = 'admin_214ff5d346';

async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    const text = await res.text();
    try {
        return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch {
        return { status: res.status, ok: res.ok, raw: text };
    }
}

async function runTests() {
    console.log('=== STEP 1: Verify Delivery Partner Stats Baseline ===');
    const earningsRes = await api('/api/orders/delivery-earnings', {
        headers: { 'Authorization': `Bearer ${rider1Token}` }
    });
    console.log('Earnings response status:', earningsRes.status);
    console.log('Stats start timestamp:', earningsRes.data?.stats_start_timestamp);
    console.log('Today earnings:', earningsRes.data?.today_stats?.today_earnings);
    console.log('Completed today:', earningsRes.data?.today_stats?.completed_today);
    console.log('Grand total:', earningsRes.data?.grand_total);
    console.log('My duty status:', earningsRes.data?.my_duty_status);

    if (earningsRes.data?.today_stats?.today_earnings === 0 && earningsRes.data?.stats_start_timestamp) {
        console.log('✅ PASS: Earnings properly baseline from current timestamp starting at ₹0.00 without deleting any database records.');
    } else {
        console.warn('⚠️ Warning: Earnings did not start from 0 or missing stats_start_timestamp.');
    }

    console.log('\n=== STEP 2: Duty Status API Tests ===');
    // Set rider 1 to Online first
    let dutyRes = await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider1Id, status: 'Active' })
    });
    console.log(`Set ${rider1Id} to Active:`, dutyRes.data);

    // Set rider 2 to Offline
    dutyRes = await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider2Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider2Id, status: 'Offline' })
    });
    console.log(`Set ${rider2Id} to Offline:`, dutyRes.data);

    // Check delivery staff list
    const staffRes = await api('/api/orders/admin/delivery-staff', {
        headers: { 'Authorization': `Bearer ${rider1Token}` }
    });
    const rider2Staff = staffRes.data?.staff?.find(s => s.id === rider2Id);
    console.log('Rider 2 in delivery-staff list:', rider2Staff?.name, 'status:', rider2Staff?.availability_status, 'is_available:', rider2Staff?.is_available);
    if (rider2Staff && rider2Staff.availability_status === 'Offline' && rider2Staff.is_available === false) {
        console.log('✅ PASS: Delivery staff endpoint properly reports Offline status and is_available=false');
    }

    console.log('\n=== STEP 3: Transfer To Offline Rider Check ===');
    // Try to transfer an order to rider2 (who is offline)
    const transferToOffline = await api('/api/orders/order_e1113636/transfer/request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            toAdminId: rider2Id,
            toAdminName: 'Jhonysins',
            reason: 'High load'
        })
    });
    console.log('Transfer to offline rider status:', transferToOffline.status, 'error:', transferToOffline.data?.error);
    if (transferToOffline.status === 400 && transferToOffline.data?.error?.includes('OFFLINE')) {
        console.log('✅ PASS: Cannot transfer delivery to offline rider!');
    } else {
        console.error('❌ FAIL: Expected 400 rejection for transfer to offline rider');
    }

    console.log('\n=== STEP 4: Offline Rider Trying To Transfer Check ===');
    // Set rider 1 to Offline
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider1Id, status: 'Offline' })
    });

    // Make rider 2 Active
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider2Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider2Id, status: 'Active' })
    });

    const offlineSenderTransfer = await api('/api/orders/order_e1113636/transfer/request', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            toAdminId: rider2Id,
            toAdminName: 'Jhonysins',
            reason: 'High load'
        })
    });
    console.log('Offline sender transfer status:', offlineSenderTransfer.status, 'error:', offlineSenderTransfer.data?.error);
    if (offlineSenderTransfer.status === 400 && offlineSenderTransfer.data?.error?.includes('OFFLINE')) {
        console.log('✅ PASS: Offline rider cannot initiate transfer!');
    } else {
        console.error('❌ FAIL: Expected 400 rejection for offline sender');
    }

    console.log('\n=== STEP 5: Offline Rider Trying To Claim Order Check ===');
    const offlineClaim = await api('/api/orders/order_e1113636/claim', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider1Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminName: 'Rohith' })
    });
    console.log('Offline claim status:', offlineClaim.status, 'error:', offlineClaim.data?.error);
    if (offlineClaim.status === 400 && offlineClaim.data?.error?.includes('OFFLINE')) {
        console.log('✅ PASS: Offline rider cannot claim order!');
    } else {
        console.error('❌ FAIL: Expected 400 rejection for offline claim');
    }

    console.log('\n=== STEP 6: Direct Assign To Offline Rider Check ===');
    // Set rider 2 to Offline again
    await api('/api/orders/delivery-duty-status', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${rider2Token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ riderId: rider2Id, status: 'Offline' })
    });

    const directAssignOffline = await api('/api/orders/order_e1113636/transfer/direct', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ownerToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            targetAdminId: rider2Id,
            targetAdminName: 'Jhonysins'
        })
    });
    console.log('Direct assign to offline rider status:', directAssignOffline.status, 'error:', directAssignOffline.data?.error);
    if (directAssignOffline.status === 400 && directAssignOffline.data?.error?.includes('OFFLINE')) {
        console.log('✅ PASS: Direct assign to offline rider blocked with 400!');
    } else {
        console.error('❌ FAIL: Expected 400 rejection for direct assign to offline rider');
    }

    console.log('\n=== Cleanup: Reset test riders to Active ===');
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
    console.log('Cleanup completed successfully.');
}

runTests().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});

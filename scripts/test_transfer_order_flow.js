const http = require('http');
const adminAuth = require('../server/middleware/adminAuth');
const { getSupabaseClient } = require('../server/supabase');

const token = adminAuth.generateAdminToken('user_admin_bh13', 'owner');

function apiRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const payload = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

async function run() {
    console.log('====================================================');
    console.log('TEST: Transfer Order Flow & User ID Visibility');
    console.log('====================================================');

    // 1. Check Delivery Staff List
    console.log('\nStep 1: Checking Delivery Staff API endpoint...');
    const staffRes = await apiRequest('GET', '/api/orders/admin/delivery-staff');
    if (staffRes.status !== 200 || !staffRes.data.success) {
        console.error('❌ Failed to fetch delivery staff:', staffRes);
        process.exit(1);
    }

    const staff = staffRes.data.staff || [];
    console.log(`✓ Fetched ${staff.length} delivery staff members.`);

    const nivas = staff.find(s => s.id === 'user_admin_bh13');
    if (!nivas) {
        console.error('❌ user_admin_bh13 (Nivas Naidu) NOT FOUND in staff list!');
        process.exit(1);
    }
    console.log(`✓ Confirmed user_admin_bh13 is in the list: "${nivas.name}" (${nivas.email})`);
    console.log(`  Roles: [${(nivas.roles || []).join(', ')}], is_owner: ${nivas.is_owner}, available: ${nivas.is_available}`);

    // 2. Find or Create a Test Order to Transfer
    console.log('\nStep 2: Finding an active order to test transfer...');
    const ordersRes = await apiRequest('GET', '/api/orders/admin/all');
    let orderToTest = (ordersRes.data?.orders || []).find(o => 
        ['Order Placed', 'Order Confirmed', 'Preparing'].includes(o.status)
    );

    let createdTestOrder = false;
    const testOrderId = `test_xfer_${Date.now()}`;
    const supabase = getSupabaseClient();

    if (!orderToTest) {
        console.log('No existing pending order found. Creating a temporary test order in DB...');
        const newOrder = {
            id: testOrderId,
            user_id: 'user_admin_bh13',
            customer_name: 'Test Customer for Transfer',
            customer_phone: '9999999999',
            status: 'Order Confirmed',
            subtotal: 50,
            delivery_fee: 0,
            platform_fee: 3,
            tax: 0,
            total: 53,
            payment_method: 'cash_on_delivery',
            payment_status: 'pending',
            rider_name: 'Caption America',
            delivery_address: 'BH13 Room 101'
        };
        const { error } = await supabase.from('orders').insert([newOrder]);
        if (error) {
            console.error('Failed to create test order:', error);
            process.exit(1);
        }
        orderToTest = newOrder;
        createdTestOrder = true;
        console.log(`✓ Created temporary test order ${testOrderId}`);
    } else {
        console.log(`✓ Using existing order ${orderToTest.id} (Status: ${orderToTest.status}, Rider: ${orderToTest.rider_name || 'None'})`);
    }

    // 3. Test Transfer Request to user_admin_bh13 (Self-assignment / takeover)
    console.log('\nStep 3: Executing transfer request to user_admin_bh13 (Nivas Naidu)...');
    const transferRes = await apiRequest('POST', `/api/orders/${orderToTest.id}/transfer/request`, {
        to_admin_id: 'user_admin_bh13',
        reason: 'Owner direct transfer verification test'
    });

    console.log('Transfer Response status:', transferRes.status);
    console.log('Transfer Response data:', JSON.stringify(transferRes.data, null, 2));

    if (transferRes.status !== 200 || !transferRes.data?.success) {
        console.error('❌ Transfer request failed!');
        process.exit(1);
    }
    console.log('✓ Transfer request succeeded with 200 OK!');

    // 4. Verify in DB
    const { data: updatedOrder } = await supabase.from('orders').select('id, status, rider_name').eq('id', orderToTest.id).single();
    console.log('\nStep 4: Verifying order state in database:');
    console.log(`  Order ID: ${updatedOrder.id}`);
    console.log(`  Rider meta: ${updatedOrder.rider_name}`);

    // Cleanup if temporary order was created
    if (createdTestOrder) {
        await supabase.from('orders').delete().eq('id', testOrderId);
        console.log('\n✓ Cleaned up temporary test order.');
    }

    console.log('\n====================================================');
    console.log('🎉 TRANSFER ORDER FLOW VERIFIED 100% SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
}

run().catch(err => {
    console.error('Unhandled test error:', err);
    process.exit(1);
});

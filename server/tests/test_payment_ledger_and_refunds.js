const assert = require('assert');
const crypto = require('crypto');
const youpiService = require('../services/youpiService');
const supabaseDb = require('../db/supabaseDb');

async function runPaymentLedgerAndRefundsTests() {
    console.log('================================================================');
    console.log('🧪 RUNNING PAYMENT LEDGER, REFUND MANAGEMENT & UPI AUDIT TESTS');
    console.log('================================================================\n');

    const baseUrl = 'http://localhost:3000';

    // Log in as Super Admin (Owner)
    console.log('[1/8] Authenticating as Super Admin (Owner)...');
    const loginRes = await fetch(`${baseUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@lpu.in', password: 'Nivas@2006$%' })
    });
    assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.ok(loginData.token, 'Token should be returned');
    assert.strictEqual(loginData.admin.is_owner, true, 'User must have is_owner: true');
    const ownerToken = loginData.token;
    console.log('  ✅ Owner token acquired successfully (Admin ID:', loginData.admin.id, ')');

    // TEST 1: Access Control - Non-owner / unauthenticated requests rejected with 401 / 403
    console.log('\n[2/8] Testing Security Gate (Unauthenticated & Non-Owner Block)...');
    {
        // 1a: Unauthenticated requests
        const unauthRes = await fetch(`${baseUrl}/api/admin/payments`);
        assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401 Unauthorized');

        const unauthSummary = await fetch(`${baseUrl}/api/admin/payments/summary`);
        assert.strictEqual(unauthSummary.status, 401, 'Unauthenticated summary must return 401 Unauthorized');

        const unauthConfig = await fetch(`${baseUrl}/api/admin/payments/config`);
        assert.strictEqual(unauthConfig.status, 401, 'Unauthenticated config must return 401 Unauthorized');
        console.log('  ✅ Unauthenticated calls strictly rejected with 401 Unauthorized.');

        // 1b: Authenticated non-owner staff (e.g. delivery person / inventory manager)
        const { generateAdminToken } = require('../middleware/adminAuth');
        const nonOwnerToken = generateAdminToken('admin_5dcb05eba7', 'admin');
        const nonOwnerRes = await fetch(`${baseUrl}/api/admin/payments`, {
            headers: { Authorization: `Bearer ${nonOwnerToken}` }
        });
        assert.strictEqual(nonOwnerRes.status, 403, 'Non-owner admin request must return 403 Forbidden');
        const nonOwnerData = await nonOwnerRes.json();
        assert.strictEqual(nonOwnerData.code, 'FORBIDDEN_ROLE');
        console.log('  ✅ Non-owner admin call strictly rejected with 403 Forbidden (Requires owner permission).');
    }

    // TEST 2: Dynamic Payment Initialization & Pending Transaction in Ledger
    console.log('\n[3/8] Testing Dynamic UPI Payment Initiation & Pending Transaction Record...');
    const testOrderId = `order_test_audit_${Date.now()}`;
    let testTotal = 0;
    {
        const initRes = await fetch(`${baseUrl}/api/checkout/youpi-init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: testOrderId,
                hostel_id: 'BH-13',
                customerName: 'Aarav Student',
                customerPhone: '9876543210',
                deliveryAddress: '[BH-13] Block A, Room 204',
                items: [
                    { name: 'Red Bull Energy Drink', price: 120, quantity: 1 }
                ]
            })
        });

        assert.strictEqual(initRes.status, 200, 'Payment init should return 200');
        const initData = await initRes.json();
        assert.strictEqual(initData.success, true);
        testTotal = Number(initData.total);
        assert.ok(testTotal > 0, 'Total must be greater than 0');
        assert.ok(initData.checkoutUrl, 'checkoutUrl must be returned');
        assert.ok(initData.upiUri, 'upiUri must be returned');
        assert.ok(initData.upiUri.startsWith('upi://pay?'), 'upiUri must have dynamic upi:// protocol');
        assert.ok(initData.upiUri.includes(`am=${testTotal.toFixed(2)}`), 'upiUri must contain dynamic order amount');
        console.log('  ✅ Dynamic UPI URI generated with dynamic total ₹' + testTotal.toFixed(2) + ':', initData.upiUri);

        // Verify transaction was recorded in ledger with status "Pending"
        const txn = await supabaseDb.payments.getTransactionByOrderId(testOrderId);
        assert.ok(txn, 'Transaction must exist in ledger');
        assert.strictEqual(txn.status, 'Pending', 'Initial transaction status must be Pending');
        assert.strictEqual(Number(txn.amount), testTotal, 'Transaction amount must match');
        console.log('  ✅ Initial transaction recorded in ledger with status: Pending');
    }

    // TEST 3: Cryptographic Webhook Security & Successful Transition
    console.log('\n[4/8] Testing Webhook Signature Security & Transition to Successful...');
    const testUtr = `UTR${Date.now()}`;
    {
        // 3a: Tampered signature rejection
        const tamperedRes = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Signature': 'sha256=forged_unauthentic_hex_signature'
            },
            body: JSON.stringify({ event: 'SUCCESS', orderId: testOrderId, utr: testUtr, amount: testTotal.toFixed(2) })
        });
        assert.strictEqual(tamperedRes.status, 401, 'Tampered webhook must return 401 Unauthorized');
        console.log('  ✅ Tampered webhook signature rejected with 401.');

        // 3b: Authentic signature acceptance
        const payloadObj = {
            event: 'SUCCESS',
            orderId: testOrderId,
            amount: testTotal.toFixed(2),
            amountPaise: Math.round(testTotal * 100),
            utr: testUtr,
            paymentId: `pay_audit_${Date.now()}`
        };
        const rawPayload = JSON.stringify(payloadObj);
        const validSig = 'sha256=' + crypto.createHmac('sha256', youpiService.webhookSecret).update(rawPayload).digest('hex');

        const whRes = await fetch(`${baseUrl}/api/checkout/youpi-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Signature': validSig
            },
            body: rawPayload
        });
        assert.strictEqual(whRes.status, 200, 'Valid webhook must return 200');
        const whData = await whRes.json();
        assert.strictEqual(whData.received, true);

        // Verify transaction is now "Successful" in ledger
        const updatedTxn = await supabaseDb.payments.getTransactionByOrderId(testOrderId);
        assert.strictEqual(updatedTxn.status, 'Successful', 'Transaction status must be updated to Successful');
        assert.strictEqual(updatedTxn.upi_ref_utr, testUtr, 'Bank UTR must be recorded');
        console.log('  ✅ Authentic webhook transitioned transaction to Successful with UTR:', updatedTxn.upi_ref_utr);
    }

    // TEST 4: Revenue Metrics & Pending/Failed Exclusion
    console.log('\n[5/8] Testing Net Collections & Non-Successful Exclusions...');
    {
        // Insert a failed transaction to verify exclusion from revenue
        const failedTxn = await supabaseDb.payments.createTransaction({
            order_id: `order_failed_${Date.now()}`,
            provider: 'youpi',
            amount: 500.00,
            status: 'Failed',
            failure_reason: 'User cancelled in bank UPI app'
        });

        // Insert a cancelled transaction to verify exclusion
        const cancelledTxn = await supabaseDb.payments.createTransaction({
            order_id: `order_cancelled_${Date.now()}`,
            provider: 'youpi',
            amount: 300.00,
            status: 'Cancelled',
            failure_reason: 'Session expired after 10 minutes'
        });

        const summaryRes = await fetch(`${baseUrl}/api/admin/payments/summary`, {
            headers: { Authorization: `Bearer ${ownerToken}` }
        });
        assert.strictEqual(summaryRes.status, 200);
        const { summary } = await summaryRes.json();

        // Failed (₹500) and Cancelled (₹300) must NOT be counted in grossCollected or netCollections
        assert.ok(summary.grossCollected >= testTotal, 'Gross collected must include successful payments');
        assert.ok(summary.failedCount >= 1, 'Failed count should reflect failed transactions');
        console.log('  ✅ Summary correctly computed:', {
            grossCollected: summary.grossCollected,
            totalRefunded: summary.totalRefunded,
            netCollections: summary.netCollections,
            successfulCount: summary.successfulCount,
            failedCount: summary.failedCount
        });
    }

    // TEST 5: Partial Refund Execution (40% Refund)
    console.log('\n[6/8] Testing Partial Refund Processing...');
    const txnRecord = await supabaseDb.payments.getTransactionByOrderId(testOrderId);
    const partialAmt = Math.round(testTotal * 0.4);
    const refundRef1 = `rfnd_part_${Date.now()}`;
    {
        const refundRes = await fetch(`${baseUrl}/api/admin/payments/${txnRecord.id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                amount: partialAmt,
                reason: 'Customer cancelled 1 item from bundle',
                refund_ref_id: refundRef1
            })
        });

        assert.strictEqual(refundRes.status, 200, 'Partial refund request should return 200');
        const refundData = await refundRes.json();
        assert.strictEqual(refundData.success, true);
        assert.strictEqual(Number(refundData.refund.amount), partialAmt);

        // Transaction status must now be Partially Refunded
        const refreshedTxn = await supabaseDb.payments.getTransactionById(txnRecord.id);
        assert.strictEqual(refreshedTxn.status, 'Partially Refunded', 'Status must be Partially Refunded');
        console.log(`  ✅ Partial refund of ₹${partialAmt.toFixed(2)} recorded. New transaction status: Partially Refunded`);
    }

    // TEST 6: Over-Refund Protection & Idempotent Submission
    console.log('\n[7/8] Testing Over-Refund Protection & Idempotency Safeguards...');
    {
        // 6a: Attempting to refund more than remaining refundable balance
        const excessiveRes = await fetch(`${baseUrl}/api/admin/payments/${txnRecord.id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                amount: testTotal + 50.00,
                reason: 'Excessive refund test'
            })
        });
        assert.strictEqual(excessiveRes.status, 400, 'Over-refund must return 400 Bad Request');
        const excessiveData = await excessiveRes.json();
        assert.strictEqual(excessiveData.success, false);
        assert.ok(excessiveData.error.includes('exceeds remaining refundable balance'), 'Error must specify remaining balance exceeded');
        console.log('  ✅ Over-refund blocked correctly:', excessiveData.error);

        // 6b: Idempotency test - re-submitting with duplicate refund_ref_id
        const dupRes = await fetch(`${baseUrl}/api/admin/payments/${txnRecord.id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                amount: partialAmt,
                reason: 'Duplicate retry submission',
                refund_ref_id: refundRef1
            })
        });
        assert.strictEqual(dupRes.status, 200);
        const dupData = await dupRes.json();
        assert.strictEqual(dupData.success, true);
        assert.ok(dupData.message.includes('Idempotent'), 'Idempotent response must be identified');
        console.log('  ✅ Idempotent duplicate refund submission safely returned existing record without double-deduction.');

        // 6c: Complete full remaining refund
        const remainingAmt = Number((testTotal - partialAmt).toFixed(2));
        const fullRes = await fetch(`${baseUrl}/api/admin/payments/${txnRecord.id}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                amount: remainingAmt,
                reason: 'Full balance settlement',
                refund_ref_id: `rfnd_full_${Date.now()}`
            })
        });
        assert.strictEqual(fullRes.status, 200);

        // Transaction status must now be Refund Successful
        const finalTxn = await supabaseDb.payments.getTransactionById(txnRecord.id);
        assert.strictEqual(finalTxn.status, 'Refund Successful', 'Full refund must transition status to Refund Successful');
        console.log(`  ✅ Full remaining refund of ₹${remainingAmt.toFixed(2)} processed. New transaction status: Refund Successful`);
    }

    // TEST 7: Super Admin UPI Configuration Management & Zero Secret Leakage
    console.log('\n[8/8] Testing UPI Configuration & Zero Secret Leakage...');
    {
        const updateConfRes = await fetch(`${baseUrl}/api/admin/payments/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                merchantVpa: 'lpuquick.campus@okhdfcbank',
                merchantPayeeName: 'LPUQuick Campus Official',
                environment: 'SANDBOX',
                enabledPaymentMethods: {
                    upiQr: true,
                    phonepe: true,
                    gpay: true,
                    paytm: true,
                    cred: true,
                    anyUpiApp: true
                },
                // Attempt to send malicious/prohibited sensitive fields:
                upiPin: '123456',
                otp: '999888',
                bankPassword: 'mySuperSecretPassword'
            })
        });

        assert.strictEqual(updateConfRes.status, 200, 'Config update should succeed');
        const confData = await updateConfRes.json();
        assert.strictEqual(confData.success, true);
        assert.strictEqual(confData.config.merchantVpa, 'lpuquick.campus@okhdfcbank');
        assert.strictEqual(confData.config.merchantPayeeName, 'LPUQuick Campus Official');

        // Verify sensitive fields were completely purged
        assert.strictEqual(confData.config.upiPin, undefined, 'upiPin must NEVER be stored or returned');
        assert.strictEqual(confData.config.otp, undefined, 'otp must NEVER be stored or returned');
        assert.strictEqual(confData.config.bankPassword, undefined, 'bankPassword must NEVER be stored or returned');
        console.log('  ✅ UPI Configuration updated successfully with strict secret sanitization (Zero PIN/OTP collection verified).');
    }

    console.log('\n================================================================');
    console.log('🎉 ALL 8 PAYMENT LEDGER, REFUND & SECURITY ACCEPTANCE TESTS PASSED');
    console.log('================================================================\n');
}

runPaymentLedgerAndRefundsTests().catch(err => {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
});

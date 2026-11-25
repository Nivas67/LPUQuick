const assert = require('assert');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const { createUpiGatewayClient } = require('../services/upiGatewayClient');
const { createSandboxPaymentService } = require('../services/sandboxPaymentService');
const { createPaymentsRouter } = require('../routes/payments');

/**
 * Isolated in-memory transactional mock store mirroring 20261125_upi_sandbox_gateway.sql semantics.
 * Zero writes or reads against live Supabase production tables.
 */
function createMockSandboxStore() {
    const ordersByClientId = new Map();
    const ordersByGatewayId = new Map();
    const ordersByIdemKey = new Map();
    const eventsById = new Map();
    const auditLogs = [];

    return {
        _ordersByClientId: ordersByClientId,
        _eventsById: eventsById,
        _auditLogs: auditLogs,

        async appendAuditLog(entry) {
            auditLogs.push({ ...entry, created_at: new Date().toISOString() });
        },

        async findOrderByIdempotencyKey(key) {
            return ordersByIdemKey.get(key) || null;
        },

        async findOrderByClientOrGatewayId(orderId) {
            return ordersByClientId.get(orderId) || ordersByGatewayId.get(orderId) || null;
        },

        async listOrdersByUser(userId) {
            return Array.from(ordersByClientId.values()).filter(o => o.user_id === userId);
        },

        async createOrderRecord(orderRecord) {
            if (orderRecord.checkout_idempotency_key && ordersByIdemKey.has(orderRecord.checkout_idempotency_key)) {
                return { record: ordersByIdemKey.get(orderRecord.checkout_idempotency_key), created: false };
            }
            if (ordersByClientId.has(orderRecord.client_order_id)) {
                return { record: ordersByClientId.get(orderRecord.client_order_id), created: false };
            }
            const nowIso = new Date().toISOString();
            const row = {
                id: `sbx_pay_${crypto.randomUUID()}`,
                client_order_id: orderRecord.client_order_id,
                gateway_order_id: orderRecord.gateway_order_id || null,
                checkout_idempotency_key: orderRecord.checkout_idempotency_key || null,
                user_id: orderRecord.user_id,
                hostel_id: orderRecord.hostel_id || 'BH-13',
                order_mode: orderRecord.order_mode || 'DELIVERY',
                customer_name: orderRecord.customer_name || null,
                customer_email: orderRecord.customer_email || null,
                customer_mobile: orderRecord.customer_mobile || null,
                items_snapshot: orderRecord.items_snapshot || [],
                pricing_snapshot: orderRecord.pricing_snapshot || {},
                amount: Number(orderRecord.amount),
                currency: 'INR',
                environment: 'sandbox',
                is_test: true,
                status: orderRecord.status || 'Pending',
                payment_url: orderRecord.payment_url || null,
                utr: null,
                last_event_id: null,
                last_event_sequence: 0,
                fulfilled: false,
                sandbox_fulfilled_at: null,
                gateway_raw_response: orderRecord.gateway_raw_response || {},
                expires_at: orderRecord.expires_at || null,
                created_at: nowIso,
                updated_at: nowIso
            };
            ordersByClientId.set(row.client_order_id, row);
            if (row.gateway_order_id) ordersByGatewayId.set(row.gateway_order_id, row);
            if (row.checkout_idempotency_key) ordersByIdemKey.set(row.checkout_idempotency_key, row);
            return { record: { ...row }, created: true };
        },

        async updateOrderFromStatusCheck(clientOrderId, { status, gatewayOrderId, utr, rawResponse }) {
            const row = ordersByClientId.get(clientOrderId);
            if (!row) {
                const err = new Error('Sandbox payment order not found.');
                err.statusCode = 404;
                throw err;
            }
            const nextStatus = row.status === 'Paid' ? 'Paid' : status;
            const newlyFulfilled = nextStatus === 'Paid' && !row.fulfilled;
            row.status = nextStatus;
            if (gatewayOrderId && !row.gateway_order_id) {
                row.gateway_order_id = gatewayOrderId;
                ordersByGatewayId.set(gatewayOrderId, row);
            }
            if (utr && !row.utr) row.utr = utr;
            if (rawResponse) row.gateway_raw_response = rawResponse;
            if (newlyFulfilled) {
                row.fulfilled = true;
                row.sandbox_fulfilled_at = new Date().toISOString();
            }
            row.updated_at = new Date().toISOString();
            return { record: { ...row }, newlyFulfilled };
        },

        async processWebhookAtomically({
            eventId,
            eventType,
            eventSequence,
            mappedStatus,
            clientOrderId,
            gatewayOrderId,
            amount,
            currency,
            utr
        }) {
            if (String(currency || 'INR').toUpperCase() !== 'INR') {
                return { outcome: 'rejected_mismatch', statusCode: 400, code: 'CURRENCY_MISMATCH' };
            }
            if (eventsById.has(eventId)) {
                return {
                    outcome: 'duplicate_event',
                    duplicate: true,
                    event_id: eventId,
                    client_order_id: eventsById.get(eventId).client_order_id
                };
            }
            const order = (clientOrderId && ordersByClientId.get(clientOrderId)) ||
                (gatewayOrderId && ordersByGatewayId.get(gatewayOrderId)) ||
                null;
            if (!order) {
                return { outcome: 'rejected_order_not_found', statusCode: 404, code: 'SANDBOX_ORDER_NOT_FOUND' };
            }
            if (clientOrderId && order.client_order_id !== clientOrderId) {
                return { outcome: 'rejected_mismatch', statusCode: 400, code: 'ORDER_IDENTITY_MISMATCH' };
            }
            if (gatewayOrderId && order.gateway_order_id && order.gateway_order_id !== gatewayOrderId) {
                return { outcome: 'rejected_mismatch', statusCode: 400, code: 'ORDER_IDENTITY_MISMATCH' };
            }
            if (Math.round(Number(order.amount) * 100) !== Math.round(Number(amount) * 100)) {
                return { outcome: 'rejected_mismatch', statusCode: 400, code: 'AMOUNT_MISMATCH' };
            }

            if (eventSequence <= order.last_event_sequence) {
                eventsById.set(eventId, {
                    event_id: eventId,
                    event_type: eventType,
                    event_sequence: eventSequence,
                    client_order_id: order.client_order_id,
                    processing_result: 'stale_sequence_ignored'
                });
                return {
                    outcome: 'stale_sequence_ignored',
                    ignoredOutOfOrder: true,
                    event_id: eventId,
                    client_order_id: order.client_order_id,
                    status: order.status,
                    fulfilled: order.fulfilled
                };
            }

            eventsById.set(eventId, {
                event_id: eventId,
                event_type: eventType,
                event_sequence: eventSequence,
                client_order_id: order.client_order_id,
                processing_result: 'processed'
            });

            const fulfilledNow = mappedStatus === 'Paid' && !order.fulfilled;
            order.status = mappedStatus;
            order.last_event_id = eventId;
            order.last_event_sequence = eventSequence;
            if (utr) order.utr = utr;
            if (fulfilledNow) {
                order.fulfilled = true;
                order.sandbox_fulfilled_at = new Date().toISOString();
            }
            order.updated_at = new Date().toISOString();

            return {
                outcome: 'processed',
                duplicate: false,
                ignoredOutOfOrder: false,
                event_id: eventId,
                client_order_id: order.client_order_id,
                gateway_order_id: order.gateway_order_id,
                status: order.status,
                fulfilledNow,
                fulfilled: order.fulfilled,
                order: { ...order }
            };
        }
    };
}

function signWebhookPayload(rawJson, secret, timestampSec = Math.floor(Date.now() / 1000)) {
    const hmac = crypto
        .createHmac('sha256', secret)
        .update(`${timestampSec}.${rawJson}`, 'utf8')
        .digest('hex');
    return `t=${timestampSec},v1=${hmac}`;
}

async function runTests() {
    console.log('===================================================================');
    console.log('🧪 LPUQuick Sandbox UPI Gateway Security & Integration Test Suite');
    console.log('===================================================================');

    const TEST_API_KEY = 'test_key_sandbox_unit_12345';
    const TEST_API_SECRET = 'test_sec_sandbox_unit_67890';
    const TEST_WEBHOOK_SECRET = 'whsec_sandbox_unit_secret_9988776655';

    // Track real-world side effects to assert ZERO production leakage
    let prodOrdersCreated = 0;
    let prodCartCleared = 0;
    let prodInventoryModified = 0;

    // Mock catalog DB (returns authoritative ₹55 for prod_maggi, ₹120 for prod_redbull)
    const mockDb = {
        products: {
            async getByIds(ids) {
                const catalog = {
                    prod_maggi: { id: 'prod_maggi', name: 'Maggi Noodles', price: 55, mrp: 60 },
                    prod_redbull: { id: 'prod_redbull', name: 'Red Bull', price: 120, mrp: 125 }
                };
                return ids.map(id => catalog[id]).filter(Boolean);
            }
        },
        cart: {
            async getCart() {
                return { items: [] };
            },
            async clearCart() {
                prodCartCleared++;
            }
        },
        orders: {
            async createOrder() {
                prodOrdersCreated++;
                throw new Error('Production orders must NEVER be called from sandbox!');
            }
        },
        inventory: {
            async deduct() {
                prodInventoryModified++;
            }
        }
    };

    const mockSettingsSvc = {
        async getSettings() {
            return {
                offers_enabled: false,
                handling_fee_enabled: true,
                handling_fee: 3,
                delivery_fee: 0,
                free_delivery_enabled: true,
                min_cart_value: 35
            };
        },
        calculateCharges(items) {
            const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
            const platform_fee = 3;
            return {
                subtotal,
                global_discount: 0,
                delivery_fee: 0,
                platform_fee,
                total: subtotal + platform_fee
            };
        }
    };

    const mockModeSvc = {
        async getStoreSettings() {
            return { delivery_enabled: true, takeaway_enabled: true };
        },
        async calculateTakeawayFee() {
            return 2;
        }
    };

    // Mock Laravel UPI Gateway HTTP server
    const gatewayOrders = new Map();
    let gatewayCreateCalls = 0;
    let gatewayMode = 'normal'; // 'normal' | 'slow' | '522' | 'bad_url' | 'tampered_status_amount' | 'wrong_status_order_id'

    const mockGatewayServer = http.createServer((req, res) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
            // Assert server-to-server auth headers
            if (req.headers['x-api-key'] !== TEST_API_KEY || req.headers['x-api-secret'] !== TEST_API_SECRET) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: 'Invalid API credentials' }));
            }

            if (gatewayMode === '522') {
                res.writeHead(522, { 'Content-Type': 'text/html' });
                return res.end('<html><body>Error 522 Connection timed out</body></html>');
            }
            if (gatewayMode === 'slow') {
                setTimeout(() => {
                    if (!res.writableEnded) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'Pending' }));
                    }
                }, 400);
                return;
            }

            if (req.method === 'POST' && req.url === '/api/v1/orders') {
                gatewayCreateCalls++;
                const body = JSON.parse(raw || '{}');
                assert.strictEqual(body.payment_account_id, undefined, 'Must NEVER send payment_account_id in sandbox');

                const gwOrderId = `GW_SBX_${gatewayCreateCalls}`;
                const payUrl = gatewayMode === 'bad_url'
                    ? 'https://evil-phishing.example.com/pay/123'
                    : `/sandbox/pay/${gwOrderId}`;

                const record = {
                    order_id: gwOrderId,
                    client_order_id: body.client_order_id,
                    amount: Number(body.amount),
                    currency: 'INR',
                    status: 'Pending',
                    environment: 'sandbox',
                    test: true,
                    utr: null,
                    payment_url: payUrl
                };
                gatewayOrders.set(gwOrderId, record);
                gatewayOrders.set(body.client_order_id, record);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(record));
            }

            if (req.method === 'GET' && req.url.startsWith('/api/v1/orders/')) {
                const lookupId = decodeURIComponent(req.url.replace('/api/v1/orders/', ''));
                const record = gatewayOrders.get(lookupId);
                if (!record) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'Order not found' }));
                }
                const responseCopy = { ...record };
                if (gatewayMode === 'tampered_status_amount') {
                    responseCopy.amount = 1;
                    responseCopy.status = 'Paid';
                }
                if (gatewayMode === 'wrong_status_order_id') {
                    responseCopy.order_id = 'GW_WRONG_999';
                    responseCopy.status = 'Paid';
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(responseCopy));
            }

            res.writeHead(404);
            res.end();
        });
    });

    await new Promise(resolve => mockGatewayServer.listen(0, '127.0.0.1', resolve));
    const gwPort = mockGatewayServer.address().port;
    const gwBaseUrl = `http://127.0.0.1:${gwPort}/api/v1`;

    const store = createMockSandboxStore();
    const gatewayClient = createUpiGatewayClient({
        baseUrl: gwBaseUrl,
        apiKey: TEST_API_KEY,
        apiSecret: TEST_API_SECRET,
        webhookSecret: TEST_WEBHOOK_SECRET,
        environment: 'sandbox',
        timeoutMs: 250,
        allowInsecureLocalTestUrl: true
    });

    const service = createSandboxPaymentService({
        store,
        gatewayClient,
        db: mockDb,
        checkoutSettingsService: mockSettingsSvc,
        orderModeService: mockModeSvc,
        getWebhookSecret: () => TEST_WEBHOOK_SECRET
    });

    const app = express();
    app.use(express.json({
        verify: (req, res, buf) => { req.rawBody = buf; }
    }));
    app.use('/api/payments', createPaymentsRouter(service));
    app.use((err, req, res, next) => {
        if (err && err.type === 'entity.parse.failed') {
            return res.status(400).json({ success: false, code: 'MALFORMED_PAYLOAD' });
        }
        res.status(500).json({ success: false });
    });

    const appServer = http.createServer(app);
    await new Promise(resolve => appServer.listen(0, '127.0.0.1', resolve));
    const appBase = `http://127.0.0.1:${appServer.address().port}`;

    try {
        // 1. Frontend price manipulation test & Authoritative calculation
        console.log('[1/15] Testing attempted frontend price manipulation...');
        const idemSuccess = 'IDEM_TEST_SUCCESS_01';
        const createRes = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_1',
                hostel_id: 'BH-13',
                order_mode: 'DELIVERY',
                customerName: 'Test Student',
                idempotencyKey: idemSuccess,
                amount: 1,
                total: 1,
                items: [{ product_id: 'prod_maggi', quantity: 2, price: 1 }] // catalog: 55*2 + 3 = 113
            })
        });
        const createJson = await createRes.json();
        assert.strictEqual(createRes.status, 200);
        assert.strictEqual(createJson.amount, 113, 'Backend must ignore tampered price=1 and compute 113');
        assert.ok(createJson.payment_url.includes('/sandbox/pay/'), 'payment_url must start with /sandbox/pay/');
        const clientOrderId1 = createJson.client_order_id;
        const gwOrderId1 = createJson.gateway_order_id;

        // 2. Pending initial state (Redirect alone never confirms)
        console.log('[2/15] Testing Pending payment status before completion...');
        const pendingRes = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`);
        const pendingJson = await pendingRes.json();
        assert.strictEqual(pendingJson.order.status, 'Pending');
        assert.strictEqual(pendingJson.order.fulfilled, false);

        // 3. Invalid webhook signature (wrong hmac, missing header, legacy body-only sha256)
        console.log('[3/15] Testing invalid / missing / legacy webhook signature rejection...');
        const paidPayloadObj = {
            event: 'order.paid',
            event_id: 'evt_paid_001',
            event_sequence: 3,
            order_id: gwOrderId1,
            client_order_id: clientOrderId1,
            amount: 113,
            currency: 'INR',
            status: 'Paid',
            environment: 'sandbox',
            test: true,
            utr: '429900112233'
        };
        const paidRaw = JSON.stringify(paidPayloadObj);

        const badSigRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(paidRaw, 'wrong_secret_key'),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_paid_001'
            },
            body: paidRaw
        });
        assert.strictEqual(badSigRes.status, 401);

        const legacySigHex = crypto.createHmac('sha256', TEST_WEBHOOK_SECRET).update(paidRaw).digest('hex');
        const legacyRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': `sha256=${legacySigHex}`,
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_paid_001'
            },
            body: paidRaw
        });
        assert.strictEqual(legacyRes.status, 401, 'Legacy body-only signatures must be rejected');

        // 4. Expired webhook timestamp (>300s)
        console.log('[4/15] Testing expired webhook timestamp rejection (>300s)...');
        const oldTs = Math.floor(Date.now() / 1000) - 360;
        const expiredTsRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(paidRaw, TEST_WEBHOOK_SECRET, oldTs),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_paid_001'
            },
            body: paidRaw
        });
        assert.strictEqual(expiredTsRes.status, 401);

        // 5. Successful simulated payment via signed webhook
        console.log('[5/15] Testing successful simulated payment webhook...');
        gatewayOrders.get(clientOrderId1).status = 'Paid';
        gatewayOrders.get(clientOrderId1).utr = '429900112233';
        const paidWhRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(paidRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_paid_001'
            },
            body: paidRaw
        });
        const paidWhJson = await paidWhRes.json();
        assert.strictEqual(paidWhRes.status, 200);
        assert.strictEqual(paidWhJson.status, 'Paid');
        assert.strictEqual(paidWhJson.fulfilled, true);

        // 6. Duplicate webhook event deduplication
        console.log('[6/15] Testing duplicate webhook event deduplication...');
        const dupRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(paidRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_paid_001'
            },
            body: paidRaw
        });
        const dupJson = await dupRes.json();
        assert.strictEqual(dupRes.status, 200);
        assert.strictEqual(dupJson.duplicate, true);
        assert.strictEqual(store._eventsById.size, 1);

        // 7. Out-of-order webhook event (older event_sequence=1 arrives after sequence=3)
        console.log('[7/15] Testing out-of-order webhook sequence protection...');
        const olderObj = {
            ...paidPayloadObj,
            event: 'order.failed',
            event_id: 'evt_old_fail_002',
            event_sequence: 1,
            status: 'Failed'
        };
        const olderRaw = JSON.stringify(olderObj);
        const olderRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(olderRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.failed',
                'X-Event-Id': 'evt_old_fail_002'
            },
            body: olderRaw
        });
        const olderJson = await olderRes.json();
        assert.strictEqual(olderRes.status, 200);
        assert.strictEqual(olderJson.ignored_out_of_order, true);
        assert.strictEqual(store._ordersByClientId.get(clientOrderId1).status, 'Paid', 'Paid must not downgrade to older Failed');

        // 8. Multiple checkout clicks concurrency + idempotency
        console.log('[8/15] Testing multiple concurrent checkout clicks deduplication...');
        const callsBefore = gatewayCreateCalls;
        const clickPayload = JSON.stringify({
            userId: 'user_sbx_multi',
            hostel_id: 'BH-13',
            order_mode: 'TAKEAWAY',
            idempotencyKey: 'IDEM_CONCURRENT_MULTI_99',
            items: [{ product_id: 'prod_redbull', quantity: 1 }] // Takeaway: 120 + 2 = 122
        });
        const clickResults = await Promise.all([1, 2, 3].map(() =>
            fetch(`${appBase}/api/payments/sandbox/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: clickPayload
            }).then(r => r.json())
        ));
        assert.strictEqual(gatewayCreateCalls, callsBefore + 1, 'Gateway must only be called once for multi-click');
        const multiOrderId = clickResults[0].client_order_id;
        assert.ok(clickResults.every(r => r.client_order_id === multiOrderId && r.amount === 122));

        // 9. Incorrect payment amount in webhook & status check
        console.log('[9/15] Testing incorrect payment amount rejection...');
        const wrongAmtRaw = JSON.stringify({
            event: 'order.paid',
            event_id: 'evt_wrong_amt_1',
            event_sequence: 1,
            order_id: clickResults[0].gateway_order_id,
            client_order_id: multiOrderId,
            amount: 5,
            currency: 'INR',
            environment: 'sandbox',
            test: true
        });
        const wrongAmtWh = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(wrongAmtRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_wrong_amt_1'
            },
            body: wrongAmtRaw
        });
        assert.strictEqual(wrongAmtWh.status, 400);
        assert.strictEqual(store._ordersByClientId.get(multiOrderId).status, 'Pending');

        gatewayMode = 'tampered_status_amount';
        const statusTamperRes = await fetch(`${appBase}/api/payments/sandbox/status/${multiOrderId}`);
        assert.strictEqual(statusTamperRes.status, 400);
        gatewayMode = 'normal';

        // 10. Incorrect order ID in webhook & status check
        console.log('[10/15] Testing incorrect order ID rejection...');
        const wrongIdRaw = JSON.stringify({
            event: 'order.paid',
            event_id: 'evt_wrong_id_1',
            event_sequence: 1,
            order_id: 'GW_OTHER_ORDER',
            client_order_id: multiOrderId,
            amount: 122,
            currency: 'INR',
            environment: 'sandbox',
            test: true
        });
        const wrongIdWh = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(wrongIdRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_wrong_id_1'
            },
            body: wrongIdRaw
        });
        assert.strictEqual(wrongIdWh.status, 400);

        gatewayMode = 'wrong_status_order_id';
        const statusWrongIdRes = await fetch(`${appBase}/api/payments/sandbox/status/${multiOrderId}`);
        assert.strictEqual(statusWrongIdRes.status, 400);
        gatewayMode = 'normal';

        // 11. Failed, Expired, Under review, Pending, Timeout webhook events
        console.log('[11/15] Testing Pending, Under review, Failed, Expired, and Timeout webhook states...');
        const seqEvents = [
            { evt: 'order.pending', seq: 1, expect: 'Pending' },
            { evt: 'order.under_review', seq: 2, expect: 'Under review' },
            { evt: 'order.failed', seq: 3, expect: 'Failed' },
            { evt: 'order.expired', seq: 4, expect: 'Expired' },
            { evt: 'order.timeout', seq: 5, expect: 'Expired' }
        ];
        for (const item of seqEvents) {
            const rawEvt = JSON.stringify({
                event: item.evt,
                event_id: `evt_seq_${item.seq}_${item.evt}`,
                event_sequence: item.seq,
                order_id: clickResults[0].gateway_order_id,
                client_order_id: multiOrderId,
                amount: 122,
                currency: 'INR',
                environment: 'sandbox',
                test: true
            });
            const r = await fetch(`${appBase}/api/payments/webhook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Signature': signWebhookPayload(rawEvt, TEST_WEBHOOK_SECRET),
                    'X-Event': item.evt,
                    'X-Event-Id': `evt_seq_${item.seq}_${item.evt}`
                },
                body: rawEvt
            });
            const j = await r.json();
            assert.strictEqual(r.status, 200);
            assert.strictEqual(j.status, item.expect);
        }

        // 12. Gateway unavailable (Cloudflare 522) & Provider HTTP timeout
        console.log('[12/15] Testing Cloudflare 522 & provider timeout resilience...');
        gatewayMode = '522';
        const res522 = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_522',
                idempotencyKey: 'IDEM_522_TEST',
                items: [{ product_id: 'prod_maggi', quantity: 1 }]
            })
        });
        const j522 = await res522.json();
        assert.strictEqual(res522.status, 503);
        assert.strictEqual(j522.code, 'GATEWAY_CLOUDFLARE_522');
        assert.strictEqual(j522.retryable, true);

        // Status check during gateway 522 still returns durable stored state cleanly
        const fallbackStatusRes = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`);
        const fallbackStatusJson = await fallbackStatusRes.json();
        assert.strictEqual(fallbackStatusRes.status, 200);
        assert.strictEqual(fallbackStatusJson.gatewaySync.ok, false);
        assert.strictEqual(fallbackStatusJson.order.status, 'Paid');

        gatewayMode = 'slow';
        const resTimeout = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_to',
                idempotencyKey: 'IDEM_TIMEOUT_TEST',
                items: [{ product_id: 'prod_maggi', quantity: 1 }]
            })
        });
        const jTimeout = await resTimeout.json();
        assert.strictEqual(resTimeout.status, 504);
        assert.strictEqual(jTimeout.code, 'GATEWAY_TIMEOUT');

        // 13. Non-sandbox payment_url open-redirect protection
        console.log('[13/15] Testing gateway untrusted payment_url rejection...');
        gatewayMode = 'bad_url';
        const resBadUrl = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_url',
                idempotencyKey: 'IDEM_BAD_URL',
                items: [{ product_id: 'prod_maggi', quantity: 1 }]
            })
        });
        assert.strictEqual(resBadUrl.status, 502);
        gatewayMode = 'normal';

        // 14. Sandbox webhook targeting a production order ID or non-sandbox event
        console.log('[14/15] Testing isolation: sandbox event cannot affect production orders...');
        const prodTargetRaw = JSON.stringify({
            event: 'order.paid',
            event_id: 'evt_prod_cross_1',
            event_sequence: 1,
            order_id: 'order_prod_991122',
            client_order_id: 'order_prod_991122',
            amount: 113,
            currency: 'INR',
            environment: 'sandbox',
            test: true
        });
        const prodTargetRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(prodTargetRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_prod_cross_1'
            },
            body: prodTargetRaw
        });
        assert.strictEqual(prodTargetRes.status, 404);

        const nonSandboxRaw = JSON.stringify({
            event: 'order.paid',
            event_id: 'evt_live_leak_1',
            event_sequence: 4,
            order_id: gwOrderId1,
            client_order_id: clientOrderId1,
            amount: 113,
            currency: 'INR',
            environment: 'production',
            test: false
        });
        const nonSandboxRes = await fetch(`${appBase}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signWebhookPayload(nonSandboxRaw, TEST_WEBHOOK_SECRET),
                'X-Event': 'order.paid',
                'X-Event-Id': 'evt_live_leak_1'
            },
            body: nonSandboxRaw
        });
        assert.strictEqual(nonSandboxRes.status, 403);

        // 15. Verify zero production side-effects & zero secret leakage on public config
        console.log('[15/15] Verifying zero production mutations and no secret leaks...');
        const cfgRes = await fetch(`${appBase}/api/payments/sandbox/config`);
        const cfgText = await cfgRes.text();
        assert.strictEqual(cfgRes.status, 200);
        assert.ok(!cfgText.includes('test_key_') && !cfgText.includes('test_sec_') && !cfgText.includes(TEST_WEBHOOK_SECRET));
        assert.strictEqual(prodOrdersCreated, 0, 'Zero production orders created');
        assert.strictEqual(prodCartCleared, 0, 'Zero carts cleared');
        assert.strictEqual(prodInventoryModified, 0, 'Zero inventory mutations');

        console.log('\n✅ ALL 15 SANDBOX UPI PAYMENT & SECURITY TESTS PASSED!');
    } finally {
        appServer.close();
        mockGatewayServer.close();
    }
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

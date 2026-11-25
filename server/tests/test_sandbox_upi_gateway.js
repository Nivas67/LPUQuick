const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { createUpiGatewayClient } = require('../services/upiGatewayClient');
const { createSandboxPaymentService } = require('../services/sandboxPaymentService');
const { createPaymentsRouter } = require('../routes/payments');
const { issueSandboxSessionToken } = require('../services/sandboxAuth');
const { resolveSandboxDbHandle, isSandboxDatabaseConfigured } = require('../services/sandboxPaymentStore');
const { createSandboxPreviewIsolationMiddleware } = require('../middleware/sandboxPreviewIsolation');

/**
 * Isolated in-memory transactional mock store mirroring 20261125_upi_sandbox_gateway.sql semantics.
 * Zero writes or reads against live Supabase production tables.
 */
function createMockSandboxStore() {
    const ordersByClientId = new Map();
    const ordersByGatewayId = new Map();
    const ordersByIdemKey = new Map();
    const eventsById = new Map();
    const cartByUserProd = new Map();
    const auditLogs = [];

    const catalogItems = [
        { id: 'SBX_PROD_MAGGI', hostel_id: 'BH-13', name: '[Sandbox] Masala Noodles', category: 'Snacks & Beverages', subcategory: 'Noodles', price: 55, mrp: 60, unit: 'pack', size: '2-Pack', image_url: '', in_stock: true, stock_left: 50, is_active: true, is_veg: true, bestseller: true, is_new: false },
        { id: 'SBX_PROD_MEAL', hostel_id: 'BH-13', name: '[Sandbox] Express Meal Box', category: "Quick's Instant Food", subcategory: 'Meals', price: 120, mrp: 140, unit: 'box', size: 'Regular', image_url: '', in_stock: true, stock_left: 50, is_active: true, is_veg: true, bestseller: true, is_new: true }
    ];

    return {
        _ordersByClientId: ordersByClientId,
        _eventsById: eventsById,
        _auditLogs: auditLogs,

        isConfigured: () => true,

        async listCatalogItems({ category, search } = {}) {
            let list = catalogItems.filter(c => c.is_active);
            if (category && category !== 'All') {
                const lc = String(category).toLowerCase();
                list = list.filter(c => c.category.toLowerCase().includes(lc));
            }
            if (search) {
                const lq = String(search).toLowerCase();
                list = list.filter(c => c.name.toLowerCase().includes(lq));
            }
            return list;
        },

        async getCatalogItemsByIds(ids = []) {
            return catalogItems.filter(c => ids.includes(c.id));
        },

        async getCartItems(userId, hostelId = 'BH-13') {
            const out = [];
            for (const row of cartByUserProd.values()) {
                if (row.user_id !== userId) continue;
                const prod = catalogItems.find(c => c.id === row.product_id);
                if (prod) {
                    out.push({
                        id: row.id,
                        cart_id: row.id,
                        product_id: row.product_id,
                        hostel_id: row.hostel_id || hostelId,
                        quantity: row.quantity,
                        name: prod.name,
                        price: prod.price,
                        mrp: prod.mrp,
                        in_stock: true,
                        stock_left: prod.stock_left
                    });
                }
            }
            return out;
        },

        async setCartItemQuantity(userId, productId, quantity, hostelId = 'BH-13') {
            const key = `${userId}::${productId}`;
            if (quantity <= 0) {
                cartByUserProd.delete(key);
            } else {
                cartByUserProd.set(key, {
                    id: `sbx_cart_${productId}`,
                    user_id: userId,
                    product_id: productId,
                    hostel_id: hostelId,
                    quantity
                });
            }
            return this.getCartItems(userId, hostelId);
        },

        async clearCart(userId) {
            for (const [k, v] of cartByUserProd.entries()) {
                if (v.user_id === userId) cartByUserProd.delete(k);
            }
        },

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
    console.log('🧪 LPUQuick Sandbox UPI Gateway Security & Isolation Test Suite');
    console.log('===================================================================');

    const TEST_API_KEY = 'test_key_sandbox_unit_12345';
    const TEST_API_SECRET = 'test_sec_sandbox_unit_67890';
    const TEST_WEBHOOK_SECRET = 'whsec_sandbox_unit_secret_9988776655';

    // Ensure auth signing in unit test process uses isolated test secret
    const prevWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    process.env.PAYMENT_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;

    let prodCheckoutHit = 0;

    // Mock Laravel UPI Gateway HTTP server
    const gatewayOrders = new Map();
    let gatewayCreateCalls = 0;
    let gatewayMode = 'normal';

    const mockGatewayServer = http.createServer((req, res) => {
        let raw = '';
        req.on('data', chunk => { raw += chunk; });
        req.on('end', () => {
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
        getWebhookSecret: () => TEST_WEBHOOK_SECRET
    });

    const app = express();
    app.use(express.json({
        verify: (req, res, buf) => { req.rawBody = buf; }
    }));
    app.use(createSandboxPreviewIsolationMiddleware({
        store,
        isSandboxRuntime: () => true
    }));
    app.use('/api/payments', createPaymentsRouter(service));
    app.post('/api/checkout', (req, res) => {
        prodCheckoutHit++;
        res.status(200).json({ ok: true });
    });
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
        // 1. Frontend price manipulation test & Authoritative calculation using isolated sandbox catalog
        console.log('[1/18] Testing attempted frontend price manipulation...');
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
                items: [{ product_id: 'SBX_PROD_MAGGI', quantity: 2, price: 1 }] // sandbox catalog: 55*2 + 3 = 113
            })
        });
        const createJson = await createRes.json();
        assert.strictEqual(createRes.status, 200);
        assert.strictEqual(createJson.amount, 113, 'Backend must ignore tampered price=1 and compute 113');
        assert.ok(createJson.payment_url.includes('/sandbox/pay/'), 'payment_url must start with /sandbox/pay/');
        assert.ok(createJson.status_token, 'Signed order status token must be issued');
        assert.ok(createJson.session_token, 'Signed session token must be issued');
        const clientOrderId1 = createJson.client_order_id;
        const gwOrderId1 = createJson.gateway_order_id;
        const order1StatusToken = createJson.status_token;

        // 2. Unauthorized order status & orders-list requests (Authentication + Ownership)
        console.log('[2/18] Testing unauthorized and cross-user order status requests...');
        const unauthStatus = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`);
        assert.strictEqual(unauthStatus.status, 401, 'Unauthenticated status request must return 401');

        const forgedStatus = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`, {
            headers: { Authorization: 'Bearer sbx_ord_forged.invalid' }
        });
        assert.strictEqual(forgedStatus.status, 401, 'Forged token must return 401');

        const otherUserTok = issueSandboxSessionToken('user_attacker_other');
        const crossUserStatus = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`, {
            headers: { Authorization: `Bearer ${otherUserTok}` }
        });
        assert.strictEqual(crossUserStatus.status, 403, 'Different user token must return 403 Forbidden');

        const unauthList = await fetch(`${appBase}/api/payments/sandbox/orders?userId=user_sbx_1`);
        assert.strictEqual(unauthList.status, 401, 'Unauthenticated orders list must return 401');

        const crossUserList = await fetch(`${appBase}/api/payments/sandbox/orders?userId=user_sbx_1`, {
            headers: { Authorization: `Bearer ${otherUserTok}` }
        });
        assert.strictEqual(crossUserList.status, 403, 'Cross-user orders list must return 403');

        // 3. Pending initial state with valid owner token
        console.log('[3/18] Testing authorized Pending payment status before completion...');
        const pendingRes = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`, {
            headers: { Authorization: `Bearer ${order1StatusToken}` }
        });
        const pendingJson = await pendingRes.json();
        assert.strictEqual(pendingRes.status, 200);
        assert.strictEqual(pendingJson.order.status, 'Pending');
        assert.strictEqual(pendingJson.order.fulfilled, false);

        // 4. Invalid webhook signature (wrong hmac, legacy body-only sha256)
        console.log('[4/18] Testing invalid / legacy webhook signature rejection...');
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
        assert.strictEqual(legacyRes.status, 401);

        // 5. Expired webhook timestamp (>300s)
        console.log('[5/18] Testing expired webhook timestamp rejection (>300s)...');
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

        // 6. Successful simulated payment via signed webhook
        console.log('[6/18] Testing successful simulated payment webhook...');
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

        // 7. Duplicate webhook event deduplication
        console.log('[7/18] Testing duplicate webhook event deduplication...');
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

        // 8. Out-of-order webhook event
        console.log('[8/18] Testing out-of-order webhook sequence protection...');
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
        assert.strictEqual(store._ordersByClientId.get(clientOrderId1).status, 'Paid');

        // 9. Multiple checkout clicks concurrency + idempotency
        console.log('[9/18] Testing multiple concurrent checkout clicks deduplication...');
        const callsBefore = gatewayCreateCalls;
        const clickPayload = JSON.stringify({
            userId: 'user_sbx_multi',
            hostel_id: 'BH-13',
            order_mode: 'TAKEAWAY',
            idempotencyKey: 'IDEM_CONCURRENT_MULTI_99',
            items: [{ product_id: 'SBX_PROD_MEAL', quantity: 1 }] // Takeaway: 120 + 2 = 122
        });
        const clickResults = await Promise.all([1, 2, 3].map(() =>
            fetch(`${appBase}/api/payments/sandbox/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: clickPayload
            }).then(r => r.json())
        ));
        assert.strictEqual(gatewayCreateCalls, callsBefore + 1);
        const multiOrderId = clickResults[0].client_order_id;
        const multiToken = clickResults[0].status_token;
        assert.ok(clickResults.every(r => r.client_order_id === multiOrderId && r.amount === 122));

        // 10. Incorrect payment amount in webhook & status check
        console.log('[10/18] Testing incorrect payment amount rejection...');
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

        gatewayMode = 'tampered_status_amount';
        const statusTamperRes = await fetch(`${appBase}/api/payments/sandbox/status/${multiOrderId}`, {
            headers: { Authorization: `Bearer ${multiToken}` }
        });
        assert.strictEqual(statusTamperRes.status, 400);
        gatewayMode = 'normal';

        // 11. Incorrect order ID in webhook & status check
        console.log('[11/18] Testing incorrect order ID rejection...');
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
        const statusWrongIdRes = await fetch(`${appBase}/api/payments/sandbox/status/${multiOrderId}`, {
            headers: { Authorization: `Bearer ${multiToken}` }
        });
        assert.strictEqual(statusWrongIdRes.status, 400);
        gatewayMode = 'normal';

        // 12. Failed, Expired, Under review, Pending, Timeout webhook events
        console.log('[12/18] Testing Pending, Under review, Failed, Expired, and Timeout webhook states...');
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

        // 13. Gateway unavailable (Cloudflare 522) & Provider HTTP timeout
        console.log('[13/18] Testing Cloudflare 522 & provider timeout resilience...');
        gatewayMode = '522';
        const res522 = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_522',
                idempotencyKey: 'IDEM_522_TEST',
                items: [{ product_id: 'SBX_PROD_MAGGI', quantity: 1 }]
            })
        });
        const j522 = await res522.json();
        assert.strictEqual(res522.status, 503);
        assert.strictEqual(j522.code, 'GATEWAY_CLOUDFLARE_522');
        assert.strictEqual(j522.retryable, true);

        const fallbackStatusRes = await fetch(`${appBase}/api/payments/sandbox/status/${clientOrderId1}`, {
            headers: { Authorization: `Bearer ${order1StatusToken}` }
        });
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
                items: [{ product_id: 'SBX_PROD_MAGGI', quantity: 1 }]
            })
        });
        const jTimeout = await resTimeout.json();
        assert.strictEqual(resTimeout.status, 504);
        assert.strictEqual(jTimeout.code, 'GATEWAY_TIMEOUT');

        // 14. Non-sandbox payment_url open-redirect protection
        console.log('[14/18] Testing gateway untrusted payment_url rejection...');
        gatewayMode = 'bad_url';
        const resBadUrl = await fetch(`${appBase}/api/payments/sandbox/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_sbx_url',
                idempotencyKey: 'IDEM_BAD_URL',
                items: [{ product_id: 'SBX_PROD_MAGGI', quantity: 1 }]
            })
        });
        assert.strictEqual(resBadUrl.status, 502);
        gatewayMode = 'normal';

        // 15. Sandbox webhook targeting a production order ID or non-sandbox event
        console.log('[15/18] Testing isolation: sandbox event cannot affect production orders...');
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

        // 16. Preview isolation middleware blocks live checkout/admin & isolates cart/catalog
        console.log('[16/18] Testing Preview isolation middleware and sandbox cart/catalog...');
        const liveCheckoutBlocked = await fetch(`${appBase}/api/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'u1' })
        });
        assert.strictEqual(liveCheckoutBlocked.status, 403);
        assert.strictEqual(prodCheckoutHit, 0, 'Live checkout route must never execute in Sandbox Preview');

        const adminBlocked = await fetch(`${appBase}/api/orders/admin/all`);
        assert.strictEqual(adminBlocked.status, 403);

        const cartAddRes = await fetch(`${appBase}/api/cart/set-quantity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'sbx_cart_u1', productId: 'SBX_PROD_MAGGI', quantity: 2, hostel_id: 'BH-13' })
        });
        assert.strictEqual(cartAddRes.status, 200);
        const cartAddJson = await cartAddRes.json();
        assert.strictEqual(cartAddJson.sandbox, true);
        assert.strictEqual(cartAddJson.pricing.subtotal, 110);

        // 17. Fail-closed Sandbox DB configuration guards (never falls back to production)
        console.log('[17/18] Testing fail-closed sandbox database guards...');
        assert.strictEqual(isSandboxDatabaseConfigured({ sandboxUrl: '', sandboxKey: '' }), false);
        assert.strictEqual(isSandboxDatabaseConfigured({ sandboxUrl: 'https://vltnqvktdlpcltndmmwl.supabase.co', sandboxKey: 'sb_secret_dummy' }), false);
        assert.throws(() => resolveSandboxDbHandle({ sandboxUrl: '', sandboxKey: '' }), /not configured/i);
        assert.throws(() => resolveSandboxDbHandle({ sandboxUrl: 'https://vltnqvktdlpcltndmmwl.supabase.co', sandboxKey: 'sb_secret_dummy' }), /production/i);

        // 18. Audit SQL migration file permissions & zero secret leaks
        console.log('[18/18] Auditing sandbox SQL migration grants and config response...');
        const sql = fs.readFileSync(path.join(__dirname, '../db/migrations/20261125_upi_sandbox_gateway.sql'), 'utf8');
        assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'), 'All sandbox tables must enable RLS');
        assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.process_sandbox_webhook_atomic'), 'Function execute must be revoked from PUBLIC/anon/authenticated');
        assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.process_sandbox_webhook_atomic'), 'Function execute must be explicitly granted to service_role');
        assert.ok(sql.includes('SET search_path = pg_catalog, public, pg_temp'), 'SECURITY DEFINER must pin safe search_path');
        assert.ok(!sql.includes('vltnqvktdlpcltndmmwl'), 'Migration must never reference production project ref');

        const cfgRes = await fetch(`${appBase}/api/payments/sandbox/config`);
        const cfgText = await cfgRes.text();
        assert.strictEqual(cfgRes.status, 200);
        assert.ok(!cfgText.includes('test_key_') && !cfgText.includes('test_sec_') && !cfgText.includes(TEST_WEBHOOK_SECRET));

        console.log('\n✅ ALL 18 SANDBOX UPI GATEWAY, AUTH, ISOLATION & MIGRATION AUDIT TESTS PASSED!');
    } finally {
        if (prevWebhookSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
        else process.env.PAYMENT_WEBHOOK_SECRET = prevWebhookSecret;
        appServer.close();
        mockGatewayServer.close();
    }
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});

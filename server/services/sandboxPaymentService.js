const crypto = require('crypto');
const { isSandboxRuntime, isProductionSupabaseUrl, isAllowedSandboxSupabaseUrl } = require('../supabase');
const {
    GatewayError,
    createUpiGatewayClient,
    getSafeSandboxDiagnostics,
    normalizeGatewayAmount,
    validateClientOrderId
} = require('./upiGatewayClient');
const {
    WebhookSecurityError,
    verifyWebhookSignature,
    validateWebhookEnvelope
} = require('./sandboxWebhookSecurity');
const {
    SandboxAuthError,
    assertAuthorizedOrderAccess,
    assertAuthorizedUserListAccess
} = require('./sandboxAuth');
const {
    createSupabaseSandboxStore,
    isSandboxDatabaseConfigured,
    SandboxStoreError
} = require('./sandboxPaymentStore');

const TERMINAL_STATUSES = new Set(['Paid', 'Failed', 'Expired']);

const SANDBOX_PRICING_POLICY = Object.freeze({
    min_cart_value: 35,
    delivery_fee: 0,
    handling_fee: 3,
    takeaway_fee: 2
});

function normalizeHostelId(input) {
    if (!input || input === 'all' || input === 'ALL') return 'BH-13';
    const str = String(input).trim().toUpperCase();
    const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i) || str.match(/(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
    if (match) return `${match[1].toUpperCase()}-${match[2]}`;
    return str.replace(/[^A-Z0-9-]/g, '') || 'BH-13';
}

function generateSandboxClientOrderId() {
    const stamp = Date.now().toString(36).toUpperCase();
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `LPUQ_SBX_${stamp}_${suffix}`;
}

function sanitizePublicOrderSummary(order) {
    if (!order) return null;
    return {
        client_order_id: order.client_order_id,
        gateway_order_id: order.gateway_order_id || null,
        amount: Number(order.amount),
        currency: order.currency || 'INR',
        status: order.status || 'Pending',
        environment: 'sandbox',
        test: true,
        payment_url: order.payment_url || null,
        utr: order.utr || null,
        fulfilled: Boolean(order.fulfilled),
        sandbox_fulfilled_at: order.sandbox_fulfilled_at || null,
        hostel_id: order.hostel_id || 'BH-13',
        order_mode: order.order_mode || 'DELIVERY',
        pricing: order.pricing_snapshot || null,
        expires_at: order.expires_at || null,
        created_at: order.created_at || null,
        updated_at: order.updated_at || null
    };
}

function createSandboxPaymentService(deps = {}) {
    const store = deps.store || createSupabaseSandboxStore();
    const gatewayClient = deps.gatewayClient || createUpiGatewayClient(deps.gatewayOverrides || {});
    // Only use injected test doubles when explicitly supplied; runtime strictly uses isolated sandbox DB
    const testDb = deps.db || null;
    const testSettingsSvc = deps.checkoutSettingsService || null;
    const testModeSvc = deps.orderModeService || null;
    const getWebhookSecret = deps.getWebhookSecret || (() => String(process.env.PAYMENT_WEBHOOK_SECRET || '').trim());
    const checkDbConfigured = deps.isDbConfigured || (() => {
        if (typeof store.isConfigured === 'function') return store.isConfigured();
        return isSandboxDatabaseConfigured();
    });
    const authOverrides = deps.authOverrides || {};
    const inFlightLocks = new Map();

    async function withLock(lockKey, fn) {
        const prev = inFlightLocks.get(lockKey) || Promise.resolve();
        let release;
        const cur = new Promise(resolve => { release = resolve; });
        inFlightLocks.set(lockKey, cur);
        await prev.catch(() => {});
        try {
            return await fn();
        } finally {
            release();
            if (inFlightLocks.get(lockKey) === cur) {
                inFlightLocks.delete(lockKey);
            }
        }
    }

    function getSafeSandboxConfig(overrides = {}) {
        const gwDiag = getSafeSandboxDiagnostics(overrides);
        const dbConfigured = Boolean(checkDbConfigured());
        const sbxUrl = String(process.env.SANDBOX_SUPABASE_URL || '').trim();
        const pointsToProd = isProductionSupabaseUrl(sbxUrl);
        const allowlisted = isAllowedSandboxSupabaseUrl(sbxUrl);

        return {
            ...gwDiag,
            dbConfigured,
            dbIsolated: Boolean(dbConfigured && allowlisted && !pointsToProd),
            previewIsolation: isSandboxRuntime(),
            ready: Boolean(gwDiag.ready && dbConfigured && allowlisted && !pointsToProd)
        };
    }

    /**
     * Authoritatively recomputes simulated cart totals from isolated sandbox catalog prices.
     * Never falls back to production database tables or client-submitted prices.
     */
    async function computeAuthoritativeSandboxPricing({ userId, hostelId, orderMode, rawItems }) {
        const cleanHostel = normalizeHostelId(hostelId);
        const normalizedMode = String(orderMode || 'DELIVERY').trim().toUpperCase() === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY';

        let cartItems = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : null;
        if (!cartItems) {
            if (testDb && testDb.cart) {
                const cart = await testDb.cart.getCart(userId, cleanHostel);
                cartItems = cart?.items || [];
            } else {
                cartItems = await store.getCartItems(userId, cleanHostel);
            }
        }

        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            throw new GatewayError('Cart is empty. Add items before starting a sandbox payment.', {
                code: 'EMPTY_CART',
                statusCode: 400
            });
        }

        const sanitizedInputItems = cartItems.map(item => ({
            product_id: String(item.product_id || item.productId || item.id || '').trim(),
            quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)))
        })).filter(it => Boolean(it.product_id));

        if (sanitizedInputItems.length === 0) {
            throw new GatewayError('No valid product IDs found in cart.', {
                code: 'INVALID_CART_ITEMS',
                statusCode: 400
            });
        }

        const productIds = Array.from(new Set(sanitizedInputItems.map(i => i.product_id)));
        const dbProducts = (testDb && testDb.products)
            ? await testDb.products.getByIds(productIds, cleanHostel)
            : await store.getCatalogItemsByIds(productIds);
        const productMap = new Map((dbProducts || []).map(p => [p.id, p]));

        // Merge quantities per product_id and strictly reject any unknown product or price override
        const mergedByProduct = new Map();
        for (const item of sanitizedInputItems) {
            const dbProd = productMap.get(item.product_id);
            if (!dbProd || dbProd.deleted) {
                throw new GatewayError(`Product "${item.product_id}" could not be verified in sandbox catalog.`, {
                    code: 'UNKNOWN_PRODUCT',
                    statusCode: 400
                });
            }
            const existing = mergedByProduct.get(item.product_id);
            const authoritativePrice = Number(dbProd.price);
            if (!Number.isFinite(authoritativePrice) || authoritativePrice <= 0) {
                throw new GatewayError(`Product "${dbProd.name}" has an invalid catalog price.`, {
                    code: 'INVALID_PRODUCT_PRICE',
                    statusCode: 400
                });
            }
            if (existing) {
                existing.quantity = Math.min(99, existing.quantity + item.quantity);
            } else {
                mergedByProduct.set(item.product_id, {
                    product_id: dbProd.id,
                    name: dbProd.name,
                    price: authoritativePrice,
                    mrp: Number(dbProd.mrp) || authoritativePrice,
                    quantity: item.quantity,
                    hostel_id: cleanHostel
                });
            }
        }

        const verifiedItems = Array.from(mergedByProduct.values());
        const subtotal = Math.round(verifiedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0) * 100) / 100;

        let globalDiscount = 0;
        let deliveryFee = SANDBOX_PRICING_POLICY.delivery_fee;
        let handlingFee = SANDBOX_PRICING_POLICY.handling_fee;
        let takeawayFee = 0;
        let total = 0;

        if (testSettingsSvc && testModeSvc) {
            const [checkoutSettings, storeModeSettings] = await Promise.all([
                testSettingsSvc.getSettings(),
                testModeSvc.getStoreSettings(cleanHostel)
            ]);
            if (normalizedMode === 'DELIVERY' && storeModeSettings && storeModeSettings.delivery_enabled === false) {
                throw new GatewayError(`Home Delivery is currently disabled for ${cleanHostel}.`, {
                    code: 'DELIVERY_DISABLED',
                    statusCode: 400
                });
            }
            if (normalizedMode === 'TAKEAWAY' && storeModeSettings && storeModeSettings.takeaway_enabled === false) {
                throw new GatewayError(`Takeaway from Store is currently disabled for ${cleanHostel}.`, {
                    code: 'TAKEAWAY_DISABLED',
                    statusCode: 400
                });
            }
            const minCartVal = Number(checkoutSettings.min_cart_value) || SANDBOX_PRICING_POLICY.min_cart_value;
            if (subtotal < minCartVal) {
                throw new GatewayError(`Minimum order value is ₹${minCartVal}.`, {
                    code: 'MIN_ORDER_VALUE',
                    statusCode: 400
                });
            }
            const breakdown = testSettingsSvc.calculateCharges(verifiedItems, checkoutSettings);
            globalDiscount = Number(breakdown.global_discount) || 0;
            deliveryFee = Number(breakdown.delivery_fee) || 0;
            handlingFee = Number(breakdown.platform_fee) || 0;
            total = Number(breakdown.total) || 0;
            if (normalizedMode === 'TAKEAWAY') {
                deliveryFee = 0;
                handlingFee = 0;
                takeawayFee = await testModeSvc.calculateTakeawayFee(subtotal - globalDiscount, cleanHostel);
                total = Math.max(0, (subtotal - globalDiscount) + takeawayFee);
            }
        } else {
            if (subtotal < SANDBOX_PRICING_POLICY.min_cart_value) {
                throw new GatewayError(`Minimum order value is ₹${SANDBOX_PRICING_POLICY.min_cart_value}. Please add ₹${Math.round((SANDBOX_PRICING_POLICY.min_cart_value - subtotal) * 100) / 100} more.`, {
                    code: 'MIN_ORDER_VALUE',
                    statusCode: 400
                });
            }
            if (normalizedMode === 'TAKEAWAY') {
                deliveryFee = 0;
                handlingFee = 0;
                takeawayFee = SANDBOX_PRICING_POLICY.takeaway_fee;
                total = subtotal + takeawayFee;
            } else {
                takeawayFee = 0;
                total = subtotal + deliveryFee + handlingFee;
            }
        }

        const cleanTotal = normalizeGatewayAmount(total);

        return {
            hostelId: cleanHostel,
            orderMode: normalizedMode,
            items: verifiedItems,
            pricing: {
                subtotal,
                global_discount: globalDiscount,
                delivery_fee: deliveryFee,
                platform_fee: handlingFee,
                takeaway_fee: takeawayFee,
                tax: 0,
                total: cleanTotal,
                currency: 'INR'
            }
        };
    }

    /**
     * Create an isolated sandbox payment order in the dedicated sandbox DB without touching production systems.
     */
    async function createSandboxCheckoutOrder(input = {}) {
        const rawUserId = String(input.userId || input.user_id || '').trim();
        const phoneDigits = String(input.customerPhone || input.phone || '').replace(/\D/g, '');
        const userId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined')
            ? rawUserId
            : (phoneDigits.length === 10 ? `sbx_phone_${phoneDigits}` : `sbx_guest_${crypto.randomBytes(4).toString('hex')}`);

        const idempotencyKey = input.idempotencyKey
            ? String(input.idempotencyKey).trim().slice(0, 128)
            : null;

        const lockKey = idempotencyKey
            ? `sbx_idem:${userId}:${idempotencyKey}`
            : `sbx_user:${userId}`;

        return withLock(lockKey, async () => {
            const computed = await computeAuthoritativeSandboxPricing({
                userId,
                hostelId: input.hostel_id || input.hostel,
                orderMode: input.order_mode || input.orderMode,
                rawItems: input.items
            });

            if (idempotencyKey) {
                const existing = await store.findOrderByIdempotencyKey(idempotencyKey);
                if (existing) {
                    const sameUser = existing.user_id === userId;
                    const sameAmount = Math.round(Number(existing.amount) * 100) === Math.round(computed.pricing.total * 100);
                    if (sameUser && sameAmount && existing.payment_url && !['Failed', 'Expired'].includes(existing.status)) {
                        return {
                            success: true,
                            idempotent: true,
                            sandbox: true,
                            environment: 'sandbox',
                            user_id: existing.user_id,
                            ...sanitizePublicOrderSummary(existing)
                        };
                    }
                    if (!sameUser || !sameAmount) {
                        throw new GatewayError('Idempotency key conflict with a different amount or user. Please start a fresh checkout.', {
                            code: 'IDEMPOTENCY_CONFLICT',
                            statusCode: 409
                        });
                    }
                }
            }

            const clientOrderId = validateClientOrderId(generateSandboxClientOrderId());

            const gatewayRes = await gatewayClient.createOrder({
                amount: computed.pricing.total,
                client_order_id: clientOrderId,
                redirect_url: input.redirectUrl,
                customer_name: input.customerName || input.name,
                customer_email: input.customerEmail || input.email,
                customer_mobile: phoneDigits || input.customerPhone || input.phone
            });

            if (Math.round(Number(gatewayRes.amount) * 100) !== Math.round(computed.pricing.total * 100)) {
                throw new GatewayError('Gateway order amount did not match backend calculation.', {
                    code: 'AMOUNT_MISMATCH',
                    statusCode: 502
                });
            }
            if (gatewayRes.client_order_id !== clientOrderId) {
                throw new GatewayError('Gateway client_order_id did not match generated identifier.', {
                    code: 'ORDER_IDENTITY_MISMATCH',
                    statusCode: 502
                });
            }

            const persisted = await store.createOrderRecord({
                client_order_id: clientOrderId,
                gateway_order_id: gatewayRes.order_id || null,
                checkout_idempotency_key: idempotencyKey || clientOrderId,
                user_id: userId,
                hostel_id: computed.hostelId,
                order_mode: computed.orderMode,
                customer_name: input.customerName || input.name || 'Sandbox Student',
                customer_email: input.customerEmail || input.email || null,
                customer_mobile: phoneDigits || null,
                items_snapshot: computed.items,
                pricing_snapshot: computed.pricing,
                amount: computed.pricing.total,
                status: gatewayRes.status || 'Pending',
                payment_url: gatewayRes.payment_url,
                expires_at: gatewayRes.expires_at,
                gateway_raw_response: gatewayRes.raw || {}
            });

            return {
                success: true,
                idempotent: !persisted.created,
                sandbox: true,
                environment: 'sandbox',
                user_id: persisted.record.user_id,
                ...sanitizePublicOrderSummary(persisted.record)
            };
        });
    }

    /**
     * Authorize ownership and authoritatively verify sandbox payment status via gateway API.
     */
    async function verifyAndSyncSandboxOrderStatus(orderIdOrClientOrderId, { refresh = true, req = null, bypassOwnershipCheck = false } = {}) {
        const cleanId = String(orderIdOrClientOrderId || '').trim();
        if (!cleanId) {
            throw new GatewayError('Order ID is required.', { code: 'INVALID_ORDER_ID', statusCode: 400 });
        }

        // Reject completely unauthenticated callers before touching DB or gateway
        if (!bypassOwnershipCheck) {
            if (!req) {
                throw new SandboxAuthError('Authentication required to inspect sandbox order status.', {
                    code: 'UNAUTHORIZED_STATUS_REQUEST',
                    statusCode: 401
                });
            }
        }

        const stored = await store.findOrderByClientOrGatewayId(cleanId);

        if (!bypassOwnershipCheck) {
            assertAuthorizedOrderAccess(req, stored, authOverrides);
        } else if (!stored) {
            throw new GatewayError('Sandbox payment order not found.', {
                code: 'SANDBOX_ORDER_NOT_FOUND',
                statusCode: 404
            });
        }

        if (!refresh && TERMINAL_STATUSES.has(stored.status)) {
            return {
                success: true,
                sandbox: true,
                verified: true,
                gatewaySync: { ok: true, skippedTerminal: true },
                order: sanitizePublicOrderSummary(stored)
            };
        }

        let gatewayStatus;
        try {
            const lookupKey = stored.gateway_order_id || stored.client_order_id;
            gatewayStatus = await gatewayClient.getOrderStatus(lookupKey);
        } catch (gwErr) {
            if (gwErr instanceof GatewayError && gwErr.retryable) {
                return {
                    success: true,
                    sandbox: true,
                    verified: false,
                    gatewaySync: {
                        ok: false,
                        retryable: true,
                        code: gwErr.code,
                        error: gwErr.message
                    },
                    order: sanitizePublicOrderSummary(stored)
                };
            }
            throw gwErr;
        }

        if (gatewayStatus.environment !== 'sandbox' || gatewayStatus.test !== true) {
            throw new GatewayError('Rejected non-sandbox gateway status response.', {
                code: 'ENVIRONMENT_MISMATCH',
                statusCode: 403
            });
        }
        if (!gatewayStatus.currency || gatewayStatus.currency !== 'INR') {
            throw new GatewayError('Gateway currency missing or mismatch (expected INR).', {
                code: 'CURRENCY_MISMATCH',
                statusCode: 400
            });
        }
        if (gatewayStatus.client_order_id && gatewayStatus.client_order_id !== stored.client_order_id) {
            throw new GatewayError('Gateway client_order_id mismatch.', {
                code: 'ORDER_IDENTITY_MISMATCH',
                statusCode: 400
            });
        }
        if (stored.gateway_order_id && gatewayStatus.order_id && gatewayStatus.order_id !== stored.gateway_order_id) {
            throw new GatewayError('Gateway order_id mismatch.', {
                code: 'ORDER_IDENTITY_MISMATCH',
                statusCode: 400
            });
        }
        if (!Number.isFinite(Number(gatewayStatus.amount)) || Math.round(Number(gatewayStatus.amount) * 100) !== Math.round(Number(stored.amount) * 100)) {
            throw new GatewayError('Gateway payment amount mismatch against stored order total.', {
                code: 'AMOUNT_MISMATCH',
                statusCode: 400
            });
        }

        const synced = await store.updateOrderFromStatusCheck(stored.client_order_id, {
            status: gatewayStatus.status,
            gatewayOrderId: gatewayStatus.order_id,
            utr: gatewayStatus.utr,
            rawResponse: gatewayStatus.raw
        });

        return {
            success: true,
            sandbox: true,
            verified: true,
            gatewaySync: { ok: true },
            newlyFulfilled: synced.newlyFulfilled,
            order: sanitizePublicOrderSummary(synced.record)
        };
    }

    async function listSandboxOrdersForUser(userId, { req = null, bypassOwnershipCheck = false } = {}) {
        if (!bypassOwnershipCheck) {
            assertAuthorizedUserListAccess(req, userId, authOverrides);
        }
        const rows = await store.listOrdersByUser(userId);
        return rows.map(sanitizePublicOrderSummary);
    }

    /**
     * Handle incoming signed webhook events from the Laravel UPI gateway.
     */
    async function handleWebhook({ headers = {}, rawBody, parsedBody, nowSeconds }) {
        const webhookSecret = getWebhookSecret();
        const sig = headers['x-signature'] || headers['X-Signature'];

        const { timestamp } = verifyWebhookSignature({
            signatureHeader: sig,
            rawBody,
            webhookSecret,
            nowSeconds
        });

        let bodyObj = null;
        if (rawBody) {
            try {
                const rawStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
                bodyObj = JSON.parse(rawStr);
            } catch {
                throw new WebhookSecurityError('Malformed JSON webhook body.', {
                    code: 'MALFORMED_WEBHOOK_PAYLOAD',
                    statusCode: 400
                });
            }
        } else {
            bodyObj = parsedBody;
        }

        const validated = validateWebhookEnvelope({ headers, body: bodyObj });

        const result = await store.processWebhookAtomically({
            eventId: validated.eventId,
            eventType: validated.eventType,
            eventSequence: validated.eventSequence,
            mappedStatus: validated.mappedStatus,
            clientOrderId: validated.clientOrderId,
            gatewayOrderId: validated.gatewayOrderId,
            amount: validated.amount,
            currency: validated.currency,
            utr: validated.utr,
            signatureTimestamp: timestamp,
            rawPayload: bodyObj
        });

        if (
            result.outcome === 'rejected_order_not_found' ||
            result.outcome === 'rejected_mismatch' ||
            result.outcome === 'rejected_invalid_transition'
        ) {
            const errorMsg = result.outcome === 'rejected_order_not_found'
                ? 'Sandbox order not found (production orders cannot be modified by sandbox webhooks).'
                : result.outcome === 'rejected_invalid_transition'
                    ? 'Invalid payment status transition (already-paid orders cannot be downgraded).'
                    : 'Webhook verification failed against stored sandbox order.';
            return {
                statusCode: result.statusCode || (result.outcome === 'rejected_invalid_transition' ? 409 : 400),
                body: {
                    success: false,
                    code: result.code || 'WEBHOOK_REJECTED',
                    error: errorMsg
                }
            };
        }

        return {
            statusCode: 200,
            body: {
                success: true,
                received: true,
                environment: 'sandbox',
                test: true,
                duplicate: Boolean(result.duplicate),
                ignored_out_of_order: Boolean(result.ignoredOutOfOrder),
                event_id: result.event_id || validated.eventId,
                client_order_id: result.client_order_id || validated.clientOrderId,
                status: result.status || validated.mappedStatus,
                fulfilled: Boolean(result.fulfilled)
            }
        };
    }

    return {
        getSafeSandboxConfig,
        computeAuthoritativeSandboxPricing,
        createSandboxCheckoutOrder,
        verifyAndSyncSandboxOrderStatus,
        listSandboxOrdersForUser,
        handleWebhook
    };
}

module.exports = {
    SANDBOX_PRICING_POLICY,
    GatewayError,
    WebhookSecurityError,
    SandboxStoreError,
    SandboxAuthError,
    normalizeHostelId,
    generateSandboxClientOrderId,
    sanitizePublicOrderSummary,
    createSandboxPaymentService
};

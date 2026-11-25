const crypto = require('crypto');
const supabaseDb = require('../db/supabaseDb');
const checkoutSettingsService = require('./checkoutSettingsService');
const orderModeService = require('./orderModeService');
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
const { createSupabaseSandboxStore, SandboxStoreError } = require('./sandboxPaymentStore');

const TERMINAL_STATUSES = new Set(['Paid', 'Failed', 'Expired']);

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
    const db = deps.db || supabaseDb;
    const settingsSvc = deps.checkoutSettingsService || checkoutSettingsService;
    const modeSvc = deps.orderModeService || orderModeService;
    const getWebhookSecret = deps.getWebhookSecret || (() => String(process.env.PAYMENT_WEBHOOK_SECRET || '').trim());
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

    /**
     * Authoritatively recomputes simulated cart totals on the backend from catalog prices & owner rules.
     * Never trusts client-submitted prices, discounts, fees, or totals.
     */
    async function computeAuthoritativeSandboxPricing({ userId, guestUserId, hostelId, orderMode, rawItems }) {
        const cleanHostel = normalizeHostelId(hostelId);
        const normalizedMode = String(orderMode || 'DELIVERY').trim().toUpperCase() === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY';

        let cartItems = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : null;
        if (!cartItems) {
            let cart = await db.cart.getCart(userId, cleanHostel);
            if ((!cart.items || cart.items.length === 0) && guestUserId) {
                cart = await db.cart.getCart(guestUserId, cleanHostel);
            }
            cartItems = cart?.items || [];
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
        const dbProducts = await db.products.getByIds(productIds, cleanHostel);
        const productMap = new Map((dbProducts || []).map(p => [p.id, p]));

        // Merge quantities per product_id and discard any client-submitted price values
        const mergedByProduct = new Map();
        for (const item of sanitizedInputItems) {
            const dbProd = productMap.get(item.product_id);
            if (!dbProd || dbProd.deleted) {
                throw new GatewayError(`Product "${item.product_id}" could not be verified in catalog.`, {
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
        const [checkoutSettings, storeModeSettings] = await Promise.all([
            settingsSvc.getSettings(),
            modeSvc.getStoreSettings(cleanHostel)
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

        const subtotal = Math.round(verifiedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0) * 100) / 100;
        const minCartValue = Number(checkoutSettings.min_cart_value) || 35;
        if (subtotal < minCartValue) {
            throw new GatewayError(`Minimum order value is ₹${minCartValue}. Please add ₹${Math.round((minCartValue - subtotal) * 100) / 100} more.`, {
                code: 'MIN_ORDER_VALUE',
                statusCode: 400
            });
        }

        const breakdown = settingsSvc.calculateCharges(verifiedItems, checkoutSettings);
        const globalDiscount = Number(breakdown.global_discount) || 0;
        let deliveryFee = Number(breakdown.delivery_fee) || 0;
        let handlingFee = Number(breakdown.platform_fee) || 0;
        let takeawayFee = 0;
        let total = Number(breakdown.total) || 0;

        if (normalizedMode === 'TAKEAWAY') {
            deliveryFee = 0;
            handlingFee = 0;
            takeawayFee = await modeSvc.calculateTakeawayFee(subtotal - globalDiscount, cleanHostel);
            total = Math.max(0, (subtotal - globalDiscount) + takeawayFee);
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
     * Create an isolated sandbox payment order without touching production orders, carts, inventory, or deliveries.
     */
    async function createSandboxCheckoutOrder(input = {}) {
        const rawUserId = String(input.userId || input.user_id || '').trim();
        const phoneDigits = String(input.customerPhone || input.phone || '').replace(/\D/g, '');
        const userId = (rawUserId && rawUserId !== 'null' && rawUserId !== 'undefined')
            ? rawUserId
            : (phoneDigits.length === 10 ? `user_phone_${phoneDigits}` : 'sandbox_guest');

        const idempotencyKey = input.idempotencyKey
            ? String(input.idempotencyKey).trim().slice(0, 128)
            : null;

        const lockKey = idempotencyKey
            ? `sbx_idem:${userId}:${idempotencyKey}`
            : `sbx_user:${userId}`;

        return withLock(lockKey, async () => {
            // Authoritative calculation happens before idempotency return so price tampering cannot reuse mismatched attempt keys
            const computed = await computeAuthoritativeSandboxPricing({
                userId,
                guestUserId: input.guestUserId || input.guest_id,
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

            // Double-check gateway echoed values match server-calculated amount & client_order_id
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
                ...sanitizePublicOrderSummary(persisted.record)
            };
        });
    }

    /**
     * Authoritatively verify a sandbox payment status with the gateway API (never trust redirects).
     */
    async function verifyAndSyncSandboxOrderStatus(orderIdOrClientOrderId, { refresh = true } = {}) {
        const cleanId = String(orderIdOrClientOrderId || '').trim();
        if (!cleanId) {
            throw new GatewayError('Order ID is required.', { code: 'INVALID_ORDER_ID', statusCode: 400 });
        }

        const stored = await store.findOrderByClientOrGatewayId(cleanId);
        if (!stored) {
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

        // Strict verification checks on gateway status payload
        if (gatewayStatus.environment !== 'sandbox' || gatewayStatus.test !== true) {
            throw new GatewayError('Rejected non-sandbox gateway status response.', {
                code: 'ENVIRONMENT_MISMATCH',
                statusCode: 403
            });
        }
        if (gatewayStatus.currency && gatewayStatus.currency !== 'INR') {
            throw new GatewayError('Gateway currency mismatch (expected INR).', {
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
        if (Math.round(Number(gatewayStatus.amount) * 100) !== Math.round(Number(stored.amount) * 100)) {
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

    async function listSandboxOrdersForUser(userId) {
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

        if (result.outcome === 'rejected_order_not_found' || result.outcome === 'rejected_mismatch') {
            return {
                statusCode: result.statusCode || 400,
                body: {
                    success: false,
                    code: result.code || 'WEBHOOK_REJECTED',
                    error: result.outcome === 'rejected_order_not_found'
                        ? 'Sandbox order not found (production orders cannot be modified by sandbox webhooks).'
                        : 'Webhook verification failed against stored sandbox order.'
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
        getSafeSandboxConfig: (overrides = {}) => getSafeSandboxDiagnostics(overrides),
        computeAuthoritativeSandboxPricing,
        createSandboxCheckoutOrder,
        verifyAndSyncSandboxOrderStatus,
        listSandboxOrdersForUser,
        handleWebhook
    };
}

module.exports = {
    GatewayError,
    WebhookSecurityError,
    SandboxStoreError,
    normalizeHostelId,
    generateSandboxClientOrderId,
    sanitizePublicOrderSummary,
    createSandboxPaymentService
};

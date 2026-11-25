const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { isProductionSupabaseUrl, isAllowedSandboxSupabaseUrl } = require('../supabase');

class SandboxStoreError extends Error {
    constructor(message, { code = 'SANDBOX_STORE_ERROR', statusCode = 500 } = {}) {
        super(message);
        this.name = 'SandboxStoreError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

let _dedicatedSandboxClient = null;
let _dedicatedSandboxSignature = null;

function isSandboxDatabaseConfigured(overrides = {}) {
    const customUrl = String((overrides.sandboxUrl !== undefined ? overrides.sandboxUrl : process.env.SANDBOX_SUPABASE_URL) || '').trim();
    const customKey = String((overrides.sandboxKey !== undefined ? overrides.sandboxKey : process.env.SANDBOX_SUPABASE_SERVICE_ROLE_KEY) || '').trim();

    if (!customUrl || !customKey || customKey.includes('your-') || customKey.includes('<')) {
        return false;
    }
    if (isProductionSupabaseUrl(customUrl)) {
        return false;
    }
    return isAllowedSandboxSupabaseUrl(customUrl);
}

/**
 * Resolve the Supabase client strictly from SANDBOX_SUPABASE_URL + SANDBOX_SUPABASE_SERVICE_ROLE_KEY.
 * Fails closed whenever missing, pointing to production, or outside the explicit sandbox project allowlist.
 */
function resolveSandboxDbHandle(overrides = {}) {
    const customUrl = String((overrides.sandboxUrl !== undefined ? overrides.sandboxUrl : process.env.SANDBOX_SUPABASE_URL) || '').trim();
    const customKey = String((overrides.sandboxKey !== undefined ? overrides.sandboxKey : process.env.SANDBOX_SUPABASE_SERVICE_ROLE_KEY) || '').trim();
    const schemaName = String((overrides.schemaName !== undefined ? overrides.schemaName : process.env.SANDBOX_SUPABASE_SCHEMA) || '').trim() || 'public';

    if (!customUrl || !customKey || customKey.includes('your-') || customKey.includes('<')) {
        throw new SandboxStoreError(
            'Isolated sandbox Supabase credentials (SANDBOX_SUPABASE_URL and SANDBOX_SUPABASE_SERVICE_ROLE_KEY) are not configured.',
            { code: 'SANDBOX_DB_NOT_CONFIGURED', statusCode: 503 }
        );
    }

    if (isProductionSupabaseUrl(customUrl)) {
        throw new SandboxStoreError(
            'Refusing to connect sandbox payment storage to a production Supabase project.',
            { code: 'PRODUCTION_DB_FORBIDDEN_IN_SANDBOX', statusCode: 503 }
        );
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(customUrl);
    } catch {
        throw new SandboxStoreError('Invalid SANDBOX_SUPABASE_URL format.', {
            code: 'INVALID_SANDBOX_DB_URL',
            statusCode: 503
        });
    }
    if (parsedUrl.protocol !== 'https:') {
        throw new SandboxStoreError('SANDBOX_SUPABASE_URL must use HTTPS.', {
            code: 'INSECURE_SANDBOX_DB_URL',
            statusCode: 503
        });
    }
    if (!isAllowedSandboxSupabaseUrl(customUrl)) {
        throw new SandboxStoreError('SANDBOX_SUPABASE_URL does not match an explicitly allowlisted sandbox Supabase project.', {
            code: 'SANDBOX_DB_UNTRUSTED_HOST',
            statusCode: 503
        });
    }

    const sig = `${customUrl}::${customKey.slice(-6)}::${schemaName}`;
    if (!_dedicatedSandboxClient || _dedicatedSandboxSignature !== sig) {
        _dedicatedSandboxClient = createClient(customUrl, customKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: schemaName }
        });
        _dedicatedSandboxSignature = sig;
    }

    const scopedClient = (schemaName && schemaName !== 'public' && typeof _dedicatedSandboxClient.schema === 'function')
        ? _dedicatedSandboxClient.schema(schemaName)
        : _dedicatedSandboxClient;

    return {
        client: scopedClient,
        baseClient: _dedicatedSandboxClient,
        schemaName,
        usesDedicatedProject: true
    };
}

function mapSupabaseTableError(error, fallbackMsg = 'Sandbox storage operation failed.') {
    if (!error) return null;
    const msg = String(error.message || '');
    if (error.code === '42P01' || error.status === 404 || msg.includes('Could not find the table') || msg.includes('does not exist')) {
        return new SandboxStoreError(
            'Sandbox payment database tables have not been migrated yet. Apply server/db/migrations/20261125_upi_sandbox_gateway.sql first.',
            { code: 'SANDBOX_SCHEMA_NOT_MIGRATED', statusCode: 503 }
        );
    }
    if (error.code === '42501' || msg.includes('permission denied')) {
        return new SandboxStoreError(
            'Database permission denied for service_role. Ensure explicit grants in the sandbox migration SQL have been applied.',
            { code: 'SANDBOX_DB_PERMISSION_DENIED', statusCode: 503 }
        );
    }
    return new SandboxStoreError(fallbackMsg, {
        code: 'SANDBOX_DB_ERROR',
        statusCode: 500
    });
}

function createSupabaseSandboxStore(options = {}) {
    const getHandle = options.getHandle || resolveSandboxDbHandle;

    async function appendAuditLog({ action, client_order_id = null, gateway_order_id = null, event_id = null, details = {} }) {
        try {
            const { client } = getHandle();
            await client.from('sandbox_payment_audit_logs').insert([{
                id: `sbx_aud_${crypto.randomUUID()}`,
                action,
                client_order_id,
                gateway_order_id,
                event_id,
                details
            }]);
        } catch (err) {
            console.warn('[Sandbox Audit Log Note]:', err.message);
        }
    }

    async function listCatalogItems({ category = null, search = null } = {}) {
        const { client } = getHandle();
        let query = client
            .from('sandbox_catalog_items')
            .select('id, hostel_id, name, category, subcategory, price, mrp, unit, size, image_url, in_stock, stock_left, is_active, is_veg, bestseller, is_new')
            .eq('is_active', true);

        if (category && category !== 'All' && category !== '__all__') {
            query = query.ilike('category', `%${String(category).trim()}%`);
        }

        const { data, error } = await query.order('bestseller', { ascending: false }).order('name', { ascending: true });
        if (error) throw mapSupabaseTableError(error, 'Failed to read sandbox catalog fixtures.');

        let rows = data || [];
        if (search) {
            const q = String(search).trim().toLowerCase();
            rows = rows.filter(r =>
                (r.name && r.name.toLowerCase().includes(q)) ||
                (r.category && r.category.toLowerCase().includes(q)) ||
                (r.subcategory && r.subcategory.toLowerCase().includes(q))
            );
        }
        return rows;
    }

    async function getCatalogItemsByIds(productIds = []) {
        const ids = Array.from(new Set((productIds || []).filter(Boolean)));
        if (ids.length === 0) return [];
        const { client } = getHandle();
        const { data, error } = await client
            .from('sandbox_catalog_items')
            .select('id, hostel_id, name, category, subcategory, price, mrp, unit, size, image_url, in_stock, stock_left, is_active')
            .in('id', ids)
            .eq('is_active', true);
        if (error) throw mapSupabaseTableError(error, 'Failed to load sandbox catalog products.');
        return data || [];
    }

    async function getCartItems(userId, hostelId = 'BH-13') {
        const cleanUser = String(userId || '').trim();
        if (!cleanUser) return [];
        const { client } = getHandle();

        const { data: rows, error } = await client
            .from('sandbox_cart_items')
            .select('id, user_id, product_id, hostel_id, quantity')
            .eq('user_id', cleanUser);

        if (error) throw mapSupabaseTableError(error, 'Failed to read sandbox cart.');
        if (!rows || rows.length === 0) return [];

        const catalogRows = await getCatalogItemsByIds(rows.map(r => r.product_id));
        const catalogMap = new Map(catalogRows.map(c => [c.id, c]));

        return rows
            .map(row => {
                const prod = catalogMap.get(row.product_id);
                if (!prod) return null;
                return {
                    id: row.id,
                    cart_id: row.id,
                    product_id: row.product_id,
                    hostel_id: row.hostel_id || hostelId || 'BH-13',
                    quantity: Math.max(1, Number(row.quantity) || 1),
                    name: prod.name,
                    category: prod.category,
                    subcategory: prod.subcategory,
                    price: Number(prod.price),
                    mrp: Number(prod.mrp) || Number(prod.price),
                    unit: prod.unit,
                    size: prod.size,
                    image_url: prod.image_url,
                    in_stock: Boolean(prod.in_stock),
                    stock_left: Math.max(0, Number(prod.stock_left) || 0)
                };
            })
            .filter(Boolean);
    }

    async function setCartItemQuantity(userId, productId, quantity, hostelId = 'BH-13') {
        const cleanUser = String(userId || '').trim();
        const cleanProd = String(productId || '').trim();
        const cleanHostel = String(hostelId || 'BH-13').trim() || 'BH-13';
        const qty = Math.floor(Number(quantity) || 0);
        const { client } = getHandle();

        if (!cleanUser || !cleanProd) {
            throw new SandboxStoreError('userId and productId are required.', {
                code: 'INVALID_SANDBOX_CART_INPUT',
                statusCode: 400
            });
        }

        if (qty <= 0) {
            const { error } = await client
                .from('sandbox_cart_items')
                .delete()
                .eq('user_id', cleanUser)
                .eq('product_id', cleanProd);
            if (error) throw mapSupabaseTableError(error, 'Failed to remove sandbox cart item.');
            return getCartItems(cleanUser, cleanHostel);
        }

        const prods = await getCatalogItemsByIds([cleanProd]);
        if (prods.length === 0) {
            throw new SandboxStoreError('Product not found in isolated sandbox catalog.', {
                code: 'UNKNOWN_SANDBOX_PRODUCT',
                statusCode: 400
            });
        }

        const cappedQty = Math.min(99, Math.max(1, qty));
        const { error } = await client
            .from('sandbox_cart_items')
            .upsert([{
                id: `sbx_cart_${crypto.createHash('sha256').update(`${cleanUser}::${cleanProd}::${cleanHostel}`).digest('hex').slice(0, 20)}`,
                user_id: cleanUser,
                product_id: cleanProd,
                hostel_id: cleanHostel,
                quantity: cappedQty,
                updated_at: new Date().toISOString()
            }], { onConflict: 'user_id,product_id,hostel_id' });

        if (error) throw mapSupabaseTableError(error, 'Failed to save sandbox cart item.');
        return getCartItems(cleanUser, cleanHostel);
    }

    async function clearCart(userId) {
        const cleanUser = String(userId || '').trim();
        if (!cleanUser) return;
        const { client } = getHandle();
        const { error } = await client
            .from('sandbox_cart_items')
            .delete()
            .eq('user_id', cleanUser);
        if (error) throw mapSupabaseTableError(error, 'Failed to clear sandbox cart.');
    }

    async function findOrderByIdempotencyKey(idempotencyKey) {
        if (!idempotencyKey) return null;
        const { client } = getHandle();
        const { data, error } = await client
            .from('sandbox_payment_orders')
            .select('*')
            .eq('checkout_idempotency_key', idempotencyKey)
            .maybeSingle();

        if (error) throw mapSupabaseTableError(error);
        return data || null;
    }

    async function findOrderByClientOrGatewayId(orderId) {
        const cleanId = String(orderId || '').trim();
        if (!cleanId) return null;
        const { client } = getHandle();

        const { data, error } = await client
            .from('sandbox_payment_orders')
            .select('*')
            .eq('client_order_id', cleanId)
            .maybeSingle();
        if (error) throw mapSupabaseTableError(error);
        if (data) return data;

        const byGateway = await client
            .from('sandbox_payment_orders')
            .select('*')
            .eq('gateway_order_id', cleanId)
            .maybeSingle();
        if (byGateway.error) throw mapSupabaseTableError(byGateway.error);
        return byGateway.data || null;
    }

    async function listOrdersByUser(userId, limit = 15) {
        const cleanUser = String(userId || '').trim();
        if (!cleanUser) return [];
        const { client } = getHandle();
        const { data, error } = await client
            .from('sandbox_payment_orders')
            .select('id, client_order_id, gateway_order_id, user_id, hostel_id, order_mode, amount, currency, environment, is_test, status, payment_url, utr, fulfilled, sandbox_fulfilled_at, created_at, updated_at')
            .eq('user_id', cleanUser)
            .order('created_at', { ascending: false })
            .limit(Math.min(50, Math.max(1, Number(limit) || 15)));
        if (error) throw mapSupabaseTableError(error);
        return data || [];
    }

    async function createOrderRecord(orderRecord) {
        const { client } = getHandle();
        const row = {
            id: orderRecord.id || `sbx_pay_${crypto.randomUUID()}`,
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
            utr: orderRecord.utr || null,
            last_event_id: null,
            last_event_sequence: 0,
            fulfilled: false,
            sandbox_fulfilled_at: null,
            gateway_raw_response: orderRecord.gateway_raw_response || {},
            expires_at: orderRecord.expires_at || null
        };

        const { data, error } = await client
            .from('sandbox_payment_orders')
            .insert([row])
            .select('*')
            .single();

        if (error) {
            if (error.code === '23505') {
                const existing = row.checkout_idempotency_key
                    ? await findOrderByIdempotencyKey(row.checkout_idempotency_key)
                    : await findOrderByClientOrGatewayId(row.client_order_id);
                if (existing) {
                    return { record: existing, created: false };
                }
            }
            throw mapSupabaseTableError(error, 'Failed to store sandbox payment order.');
        }

        await appendAuditLog({
            action: 'SANDBOX_ORDER_CREATED',
            client_order_id: data.client_order_id,
            gateway_order_id: data.gateway_order_id,
            details: {
                amount: data.amount,
                currency: data.currency,
                hostel_id: data.hostel_id,
                order_mode: data.order_mode
            }
        });

        return { record: data, created: true };
    }

    async function updateOrderFromStatusCheck(clientOrderId, { status, gatewayOrderId, utr, rawResponse }) {
        const { client } = getHandle();
        const nowIso = new Date().toISOString();
        const existing = await findOrderByClientOrGatewayId(clientOrderId);
        if (!existing) {
            throw new SandboxStoreError('Sandbox payment order not found.', {
                code: 'SANDBOX_ORDER_NOT_FOUND',
                statusCode: 404
            });
        }

        const nextStatus = existing.status === 'Paid' ? 'Paid' : status;
        const shouldMarkFulfilled = nextStatus === 'Paid' && !existing.fulfilled;

        const updatePayload = {
            status: nextStatus,
            updated_at: nowIso
        };
        if (gatewayOrderId && !existing.gateway_order_id) {
            updatePayload.gateway_order_id = gatewayOrderId;
        }
        if (utr && !existing.utr) {
            updatePayload.utr = utr;
        }
        if (rawResponse) {
            updatePayload.gateway_raw_response = rawResponse;
        }
        if (shouldMarkFulfilled) {
            updatePayload.fulfilled = true;
            updatePayload.sandbox_fulfilled_at = nowIso;
        }

        let query = client
            .from('sandbox_payment_orders')
            .update(updatePayload)
            .eq('client_order_id', existing.client_order_id);

        if (shouldMarkFulfilled) {
            query = query.eq('fulfilled', false);
        }

        const { data, error } = await query.select('*').maybeSingle();
        if (error) throw mapSupabaseTableError(error);

        const refreshed = data || await findOrderByClientOrGatewayId(existing.client_order_id);
        await appendAuditLog({
            action: 'SANDBOX_STATUS_SYNCED',
            client_order_id: existing.client_order_id,
            gateway_order_id: refreshed?.gateway_order_id || gatewayOrderId || null,
            details: {
                previous_status: existing.status,
                new_status: refreshed?.status || nextStatus,
                newly_fulfilled: Boolean(shouldMarkFulfilled && data)
            }
        });

        return {
            record: refreshed,
            newlyFulfilled: Boolean(shouldMarkFulfilled && data)
        };
    }

    /**
     * Atomically deduplicate event_id, enforce monotonic event_sequence, verify order identity + amount,
     * and record at most one sandbox fulfilment inside Postgres (via RPC or atomic fallback).
     */
    async function processWebhookAtomically({
        eventId,
        eventType,
        eventSequence,
        mappedStatus,
        clientOrderId,
        gatewayOrderId,
        amount,
        currency,
        utr,
        signatureTimestamp,
        rawPayload
    }) {
        const { client } = getHandle();

        try {
            const { data: rpcData, error: rpcError } = await client.rpc('process_sandbox_webhook_atomic', {
                p_event_id: eventId,
                p_event_type: eventType,
                p_event_sequence: eventSequence,
                p_mapped_status: mappedStatus,
                p_client_order_id: clientOrderId || null,
                p_gateway_order_id: gatewayOrderId || null,
                p_amount: amount,
                p_currency: currency || 'INR',
                p_utr: utr || null,
                p_signature_timestamp: signatureTimestamp,
                p_payload: rawPayload
            });

            if (!rpcError && rpcData) {
                return rpcData;
            }

            if (rpcError && !String(rpcError.message || '').includes('function') && rpcError.code !== '42883' && rpcError.code !== 'PGRST202') {
                throw mapSupabaseTableError(rpcError, 'Atomic webhook RPC failed.');
            }
        } catch (err) {
            if (err instanceof SandboxStoreError) throw err;
        }

        const existingEvent = await client
            .from('sandbox_webhook_events')
            .select('event_id, processing_result, client_order_id, gateway_order_id')
            .eq('event_id', eventId)
            .maybeSingle();
        if (existingEvent.error) throw mapSupabaseTableError(existingEvent.error);
        if (existingEvent.data) {
            return {
                outcome: 'duplicate_event',
                duplicate: true,
                event_id: eventId,
                client_order_id: existingEvent.data.client_order_id
            };
        }

        let order = null;
        if (clientOrderId) {
            order = await findOrderByClientOrGatewayId(clientOrderId);
        }
        if (!order && gatewayOrderId) {
            order = await findOrderByClientOrGatewayId(gatewayOrderId);
        }
        if (!order) {
            return {
                outcome: 'rejected_order_not_found',
                statusCode: 404,
                code: 'SANDBOX_ORDER_NOT_FOUND'
            };
        }

        if (clientOrderId && order.client_order_id !== clientOrderId) {
            return {
                outcome: 'rejected_mismatch',
                statusCode: 400,
                code: 'ORDER_IDENTITY_MISMATCH'
            };
        }
        if (gatewayOrderId && order.gateway_order_id && order.gateway_order_id !== gatewayOrderId) {
            return {
                outcome: 'rejected_mismatch',
                statusCode: 400,
                code: 'ORDER_IDENTITY_MISMATCH'
            };
        }
        if (Math.round(Number(order.amount) * 100) !== Math.round(Number(amount) * 100)) {
            return {
                outcome: 'rejected_mismatch',
                statusCode: 400,
                code: 'AMOUNT_MISMATCH'
            };
        }

        const isOutOfOrder = Number(eventSequence) <= Number(order.last_event_sequence || 0);
        const processingResult = isOutOfOrder ? 'stale_sequence_ignored' : 'processed';

        const insertEvt = await client
            .from('sandbox_webhook_events')
            .insert([{
                id: `sbx_evt_${crypto.randomUUID()}`,
                event_id: eventId,
                event_type: eventType,
                event_sequence: eventSequence,
                client_order_id: order.client_order_id,
                gateway_order_id: order.gateway_order_id || gatewayOrderId || null,
                environment: 'sandbox',
                is_test: true,
                signature_timestamp: signatureTimestamp,
                payload: rawPayload,
                processing_result: processingResult
            }]);

        if (insertEvt.error) {
            if (insertEvt.error.code === '23505') {
                return {
                    outcome: 'duplicate_event',
                    duplicate: true,
                    event_id: eventId,
                    client_order_id: order.client_order_id
                };
            }
            throw mapSupabaseTableError(insertEvt.error, 'Failed to persist webhook event.');
        }

        if (isOutOfOrder) {
            await appendAuditLog({
                action: 'SANDBOX_WEBHOOK_STALE_IGNORED',
                client_order_id: order.client_order_id,
                gateway_order_id: order.gateway_order_id,
                event_id: eventId,
                details: {
                    incoming_sequence: eventSequence,
                    current_sequence: order.last_event_sequence,
                    event_type: eventType
                }
            });
            return {
                outcome: 'stale_sequence_ignored',
                ignoredOutOfOrder: true,
                event_id: eventId,
                client_order_id: order.client_order_id,
                status: order.status
            };
        }

        const nowIso = new Date().toISOString();
        const shouldFulfilNow = mappedStatus === 'Paid' && !order.fulfilled;
        const orderUpdate = {
            status: mappedStatus,
            last_event_id: eventId,
            last_event_sequence: eventSequence,
            gateway_raw_response: rawPayload,
            updated_at: nowIso
        };
        if (gatewayOrderId && !order.gateway_order_id) {
            orderUpdate.gateway_order_id = gatewayOrderId;
        }
        if (utr) {
            orderUpdate.utr = utr;
        }
        if (shouldFulfilNow) {
            orderUpdate.fulfilled = true;
            orderUpdate.sandbox_fulfilled_at = nowIso;
        }

        const updatedRes = await client
            .from('sandbox_payment_orders')
            .update(orderUpdate)
            .eq('client_order_id', order.client_order_id)
            .lt('last_event_sequence', eventSequence)
            .select('*')
            .maybeSingle();

        if (updatedRes.error) {
            throw mapSupabaseTableError(updatedRes.error, 'Failed updating sandbox payment order.');
        }

        if (!updatedRes.data) {
            await client
                .from('sandbox_webhook_events')
                .update({ processing_result: 'stale_sequence_ignored' })
                .eq('event_id', eventId);

            return {
                outcome: 'stale_sequence_ignored',
                ignoredOutOfOrder: true,
                event_id: eventId,
                client_order_id: order.client_order_id,
                status: order.status
            };
        }

        await appendAuditLog({
            action: `SANDBOX_WEBHOOK_${mappedStatus.toUpperCase().replace(/\s+/g, '_')}`,
            client_order_id: order.client_order_id,
            gateway_order_id: updatedRes.data.gateway_order_id,
            event_id: eventId,
            details: {
                event_type: eventType,
                event_sequence: eventSequence,
                fulfilled_now: shouldFulfilNow
            }
        });

        return {
            outcome: 'processed',
            duplicate: false,
            ignoredOutOfOrder: false,
            event_id: eventId,
            client_order_id: order.client_order_id,
            gateway_order_id: updatedRes.data.gateway_order_id,
            status: updatedRes.data.status,
            fulfilledNow: shouldFulfilNow,
            fulfilled: Boolean(updatedRes.data.fulfilled),
            order: updatedRes.data
        };
    }

    return {
        isConfigured: () => isSandboxDatabaseConfigured(),
        listCatalogItems,
        getCatalogItemsByIds,
        getCartItems,
        setCartItemQuantity,
        clearCart,
        appendAuditLog,
        findOrderByIdempotencyKey,
        findOrderByClientOrGatewayId,
        listOrdersByUser,
        createOrderRecord,
        updateOrderFromStatusCheck,
        processWebhookAtomically
    };
}

module.exports = {
    SandboxStoreError,
    isSandboxDatabaseConfigured,
    resolveSandboxDbHandle,
    createSupabaseSandboxStore
};

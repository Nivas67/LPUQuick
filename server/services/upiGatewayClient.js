const GATEWAY_STATUS_MAP = Object.freeze({
    pending: 'Pending',
    created: 'Pending',
    initiated: 'Pending',
    paid: 'Paid',
    success: 'Paid',
    succeeded: 'Paid',
    completed: 'Paid',
    'under review': 'Under review',
    under_review: 'Under review',
    'under-review': 'Under review',
    in_review: 'Under review',
    review: 'Under review',
    failed: 'Failed',
    failure: 'Failed',
    declined: 'Failed',
    cancelled: 'Failed',
    canceled: 'Failed',
    expired: 'Expired',
    timeout: 'Expired',
    timed_out: 'Expired'
});

const DEFAULT_GATEWAY_TIMEOUT_MS = 8000;

class GatewayError extends Error {
    constructor(message, { code = 'GATEWAY_ERROR', statusCode = 502, retryable = false, cause = null } = {}) {
        super(message);
        this.name = 'GatewayError';
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = Boolean(retryable);
        if (cause) this.cause = cause;
    }
}

/**
 * Resolve sanitized sandbox gateway configuration exclusively from environment variables.
 * Never logs or exposes API keys or secrets.
 */
function resolveGatewayConfig(overrides = {}) {
    const rawBaseUrl = (overrides.baseUrl !== undefined ? overrides.baseUrl : process.env.UPI_GATEWAY_BASE_URL) || '';
    const baseUrl = String(rawBaseUrl).trim().replace(/\/+$/, '');
    const apiKey = String((overrides.apiKey !== undefined ? overrides.apiKey : process.env.UPI_GATEWAY_API_KEY) || '').trim();
    const apiSecret = String((overrides.apiSecret !== undefined ? overrides.apiSecret : process.env.UPI_GATEWAY_API_SECRET) || '').trim();
    const webhookSecret = String((overrides.webhookSecret !== undefined ? overrides.webhookSecret : process.env.PAYMENT_WEBHOOK_SECRET) || '').trim();
    const environment = String((overrides.environment !== undefined ? overrides.environment : process.env.PAYMENT_ENVIRONMENT) || '').trim().toLowerCase();
    const timeoutMs = Number(overrides.timeoutMs) > 0 ? Number(overrides.timeoutMs) : DEFAULT_GATEWAY_TIMEOUT_MS;
    const allowInsecureLocalTestUrl = Boolean(overrides.allowInsecureLocalTestUrl);

    return {
        baseUrl,
        apiKey,
        apiSecret,
        webhookSecret,
        environment,
        timeoutMs,
        allowInsecureLocalTestUrl
    };
}

/**
 * Return safe non-sensitive status flags describing sandbox readiness.
 */
function getSafeSandboxDiagnostics(overrides = {}) {
    const cfg = resolveGatewayConfig(overrides);
    const hasBaseUrl = Boolean(cfg.baseUrl);
    const isSandboxEnv = cfg.environment === 'sandbox';
    const hasSandboxKey = cfg.apiKey.startsWith('test_key_');
    const hasSandboxSecret = cfg.apiSecret.startsWith('test_sec_');
    const hasWebhookSecret = cfg.webhookSecret.length >= 16;

    return {
        environment: isSandboxEnv ? 'sandbox' : (cfg.environment || 'unconfigured'),
        sandboxOnly: true,
        gatewayConfigured: Boolean(hasBaseUrl && isSandboxEnv && hasSandboxKey && hasSandboxSecret),
        webhookConfigured: hasWebhookSecret,
        ready: Boolean(hasBaseUrl && isSandboxEnv && hasSandboxKey && hasSandboxSecret)
    };
}

function assertValidSandboxConfig(overrides = {}) {
    const cfg = resolveGatewayConfig(overrides);

    if (cfg.environment !== 'sandbox') {
        throw new GatewayError('Only sandbox payment mode is enabled in this build.', {
            code: 'SANDBOX_ENVIRONMENT_REQUIRED',
            statusCode: 503
        });
    }
    if (!cfg.baseUrl) {
        throw new GatewayError('Sandbox payment gateway base URL is not configured.', {
            code: 'GATEWAY_NOT_CONFIGURED',
            statusCode: 503
        });
    }

    let parsedBase;
    try {
        parsedBase = new URL(cfg.baseUrl);
    } catch {
        throw new GatewayError('Invalid payment gateway base URL configuration.', {
            code: 'GATEWAY_NOT_CONFIGURED',
            statusCode: 503
        });
    }

    const isLocalTestHost = parsedBase.hostname === '127.0.0.1' || parsedBase.hostname === 'localhost';
    if (parsedBase.protocol !== 'https:' && !(cfg.allowInsecureLocalTestUrl && isLocalTestHost)) {
        throw new GatewayError('Gateway base URL must use HTTPS.', {
            code: 'INSECURE_GATEWAY_URL',
            statusCode: 503
        });
    }

    if (!cfg.apiKey.startsWith('test_key_') || !cfg.apiSecret.startsWith('test_sec_')) {
        throw new GatewayError('Invalid sandbox gateway credentials (expected test_key_ and test_sec_).', {
            code: 'INVALID_SANDBOX_CREDENTIALS',
            statusCode: 503
        });
    }

    return { cfg, parsedBase };
}

function validateClientOrderId(clientOrderId) {
    const val = String(clientOrderId || '').trim();
    if (!/^[A-Z0-9_-]{1,64}$/.test(val)) {
        throw new GatewayError('Invalid client_order_id format (allowed: A-Z, 0-9, _, -, max 64 chars).', {
            code: 'INVALID_CLIENT_ORDER_ID',
            statusCode: 400
        });
    }
    return val;
}

function normalizeGatewayAmount(rawAmount) {
    const num = Number(rawAmount);
    if (!Number.isFinite(num)) {
        throw new GatewayError('Payment amount must be a valid finite number.', {
            code: 'INVALID_AMOUNT',
            statusCode: 400
        });
    }
    const rounded = Math.round(num * 100) / 100;
    if (rounded < 1 || rounded > 100000) {
        throw new GatewayError('Payment amount must be between ₹1 and ₹100,000.', {
            code: 'AMOUNT_OUT_OF_RANGE',
            statusCode: 400
        });
    }
    return rounded;
}

function validateRedirectUrl(rawRedirectUrl) {
    if (!rawRedirectUrl) return undefined;
    try {
        const parsed = new URL(String(rawRedirectUrl).trim());
        if (parsed.protocol !== 'https:') {
            return undefined;
        }
        return parsed.toString();
    } catch {
        return undefined;
    }
}

/**
 * Ensure payment URL stays on the gateway origin and under /sandbox/pay/.
 */
function validateSandboxPaymentUrl(rawPaymentUrl, gatewayBaseUrl, allowInsecureLocalTestUrl = false) {
    if (!rawPaymentUrl || typeof rawPaymentUrl !== 'string') {
        throw new GatewayError('Gateway did not return a payment URL.', {
            code: 'INVALID_PAYMENT_URL',
            statusCode: 502,
            retryable: true
        });
    }

    let gatewayOrigin;
    try {
        gatewayOrigin = new URL(gatewayBaseUrl).origin;
    } catch {
        throw new GatewayError('Invalid gateway origin configuration.', {
            code: 'GATEWAY_NOT_CONFIGURED',
            statusCode: 503
        });
    }

    let resolved;
    try {
        resolved = new URL(rawPaymentUrl.trim(), gatewayOrigin);
    } catch {
        throw new GatewayError('Malformed payment URL returned by gateway.', {
            code: 'INVALID_PAYMENT_URL',
            statusCode: 502
        });
    }

    const isLocalTestHost = resolved.hostname === '127.0.0.1' || resolved.hostname === 'localhost';
    if (resolved.protocol !== 'https:' && !(allowInsecureLocalTestUrl && isLocalTestHost)) {
        throw new GatewayError('Payment URL must use HTTPS.', {
            code: 'INVALID_PAYMENT_URL',
            statusCode: 502
        });
    }
    if (resolved.origin !== gatewayOrigin) {
        throw new GatewayError('Payment URL origin does not match configured sandbox gateway.', {
            code: 'INVALID_PAYMENT_URL',
            statusCode: 502
        });
    }
    if (!resolved.pathname.startsWith('/sandbox/pay/')) {
        throw new GatewayError('Returned payment URL is not a valid sandbox checkout path.', {
            code: 'NON_SANDBOX_PAYMENT_URL',
            statusCode: 502
        });
    }

    return resolved.toString();
}

function normalizeGatewayStatus(rawStatus) {
    if (rawStatus === null || rawStatus === undefined) return null;
    const key = String(rawStatus).trim().toLowerCase();
    return GATEWAY_STATUS_MAP[key] || null;
}

function createUpiGatewayClient(defaultOverrides = {}) {
    const fetchImpl = defaultOverrides.fetch || global.fetch;

    async function requestGateway(method, pathSuffix, bodyPayload = null, callOverrides = {}) {
        const merged = { ...defaultOverrides, ...callOverrides };
        const { cfg } = assertValidSandboxConfig(merged);

        if (typeof fetchImpl !== 'function') {
            throw new GatewayError('HTTP fetch implementation unavailable.', {
                code: 'GATEWAY_CLIENT_UNAVAILABLE',
                statusCode: 500
            });
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

        const targetUrl = `${cfg.baseUrl}${pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`}`;
        const options = {
            method,
            headers: {
                'X-Api-Key': cfg.apiKey,
                'X-Api-Secret': cfg.apiSecret,
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        };

        if (bodyPayload !== null && method !== 'GET') {
            options.body = JSON.stringify(bodyPayload);
        }

        try {
            const response = await fetchImpl(targetUrl, options);
            const rawText = await response.text();
            let parsed = null;
            try {
                parsed = rawText ? JSON.parse(rawText) : {};
            } catch {
                parsed = null;
            }

            if (response.status === 522 || response.status === 502 || response.status === 503 || response.status === 504) {
                throw new GatewayError(
                    response.status === 522
                        ? 'Payment gateway connection timed out (Cloudflare 522). Please try again shortly.'
                        : `Payment gateway temporarily unavailable (HTTP ${response.status}).`,
                    {
                        code: response.status === 522 ? 'GATEWAY_CLOUDFLARE_522' : 'GATEWAY_UNAVAILABLE',
                        statusCode: 503,
                        retryable: true
                    }
                );
            }

            if (!parsed || typeof parsed !== 'object') {
                throw new GatewayError('Payment gateway returned an invalid response format.', {
                    code: 'GATEWAY_BAD_RESPONSE',
                    statusCode: 502,
                    retryable: response.status >= 500
                });
            }

            if (!response.ok) {
                const msg = parsed.message || parsed.error || `Gateway rejected request (${response.status}).`;
                throw new GatewayError(msg, {
                    code: parsed.code || 'GATEWAY_REJECTED',
                    statusCode: response.status >= 500 ? 502 : 400,
                    retryable: response.status >= 500 || response.status === 429
                });
            }

            return { cfg, raw: parsed, payload: parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed };
        } catch (err) {
            if (err instanceof GatewayError) throw err;
            if (err && err.name === 'AbortError') {
                throw new GatewayError('Payment gateway request timed out. Please retry.', {
                    code: 'GATEWAY_TIMEOUT',
                    statusCode: 504,
                    retryable: true,
                    cause: err
                });
            }
            throw new GatewayError('Unable to reach sandbox payment gateway. Please retry.', {
                code: 'GATEWAY_UNAVAILABLE',
                statusCode: 503,
                retryable: true,
                cause: err
            });
        } finally {
            clearTimeout(timer);
        }
    }

    async function createOrder({
        amount,
        client_order_id,
        redirect_url,
        customer_name,
        customer_email,
        customer_mobile
    }, callOverrides = {}) {
        const cleanAmount = normalizeGatewayAmount(amount);
        const cleanClientOrderId = validateClientOrderId(client_order_id);
        const cleanRedirectUrl = validateRedirectUrl(redirect_url);

        // Strictly omit payment_account_id in sandbox orders
        const requestBody = {
            amount: cleanAmount,
            client_order_id: cleanClientOrderId
        };
        if (cleanRedirectUrl) requestBody.redirect_url = cleanRedirectUrl;
        if (customer_name) requestBody.customer_name = String(customer_name).trim().slice(0, 120);
        if (customer_email) requestBody.customer_email = String(customer_email).trim().slice(0, 160);
        if (customer_mobile) requestBody.customer_mobile = String(customer_mobile).trim().slice(0, 20);

        const { cfg, raw, payload } = await requestGateway('POST', '/orders', requestBody, callOverrides);

        const returnedUrl = payload.payment_url || raw.payment_url;
        const validatedPaymentUrl = validateSandboxPaymentUrl(
            returnedUrl,
            cfg.baseUrl,
            cfg.allowInsecureLocalTestUrl
        );

        const returnedEnv = payload.environment || raw.environment;
        if (returnedEnv && String(returnedEnv).toLowerCase() !== 'sandbox') {
            throw new GatewayError('Gateway returned non-sandbox order environment.', {
                code: 'ENVIRONMENT_MISMATCH',
                statusCode: 502
            });
        }

        return {
            order_id: String(payload.order_id || payload.id || raw.order_id || ''),
            client_order_id: String(payload.client_order_id || raw.client_order_id || cleanClientOrderId),
            amount: normalizeGatewayAmount(payload.amount !== undefined ? payload.amount : cleanAmount),
            currency: String(payload.currency || raw.currency || 'INR').toUpperCase(),
            status: normalizeGatewayStatus(payload.status || raw.status) || 'Pending',
            environment: 'sandbox',
            test: payload.test !== undefined ? Boolean(payload.test === true || payload.test === 'true') : true,
            payment_url: validatedPaymentUrl,
            expires_at: payload.expires_at || raw.expires_at || null,
            raw: payload
        };
    }

    async function getOrderStatus(orderIdOrClientOrderId, callOverrides = {}) {
        const lookupId = String(orderIdOrClientOrderId || '').trim();
        if (!lookupId || lookupId.length > 128) {
            throw new GatewayError('Order identifier is required for status verification.', {
                code: 'INVALID_ORDER_ID',
                statusCode: 400
            });
        }

        const { raw, payload } = await requestGateway('GET', `/orders/${encodeURIComponent(lookupId)}`, null, callOverrides);
        const normalizedStatus = normalizeGatewayStatus(payload.status || raw.status);
        if (!normalizedStatus) {
            throw new GatewayError('Gateway returned an unrecognized payment status.', {
                code: 'UNRECOGNIZED_GATEWAY_STATUS',
                statusCode: 502
            });
        }

        return {
            order_id: String(payload.order_id || payload.id || raw.order_id || ''),
            client_order_id: String(payload.client_order_id || raw.client_order_id || ''),
            amount: payload.amount !== undefined ? Number(payload.amount) : Number(raw.amount),
            currency: payload.currency !== undefined ? String(payload.currency).toUpperCase() : (raw.currency ? String(raw.currency).toUpperCase() : ''),
            status: normalizedStatus,
            environment: String(payload.environment || raw.environment || '').toLowerCase(),
            test: payload.test !== undefined ? payload.test : raw.test,
            utr: payload.utr || raw.utr || null,
            raw: payload
        };
    }

    return {
        createOrder,
        getOrderStatus
    };
}

module.exports = {
    GatewayError,
    resolveGatewayConfig,
    getSafeSandboxDiagnostics,
    validateClientOrderId,
    normalizeGatewayAmount,
    validateRedirectUrl,
    validateSandboxPaymentUrl,
    normalizeGatewayStatus,
    createUpiGatewayClient
};

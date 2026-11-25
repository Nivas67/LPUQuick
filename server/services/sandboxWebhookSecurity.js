const crypto = require('crypto');

const MAX_WEBHOOK_TOLERANCE_SECONDS = 300;

const SUPPORTED_WEBHOOK_EVENTS = Object.freeze({
    'order.paid': 'Paid',
    'order.expired': 'Expired',
    'order.under_review': 'Under review',
    'order.failed': 'Failed',
    'order.pending': 'Pending',
    'order.timeout': 'Expired'
});

class WebhookSecurityError extends Error {
    constructor(message, { code = 'WEBHOOK_UNAUTHORIZED', statusCode = 401 } = {}) {
        super(message);
        this.name = 'WebhookSecurityError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

/**
 * Strictly parse X-Signature in format: t={timestamp},v1={hex_hmac}
 * Rejects legacy body-only signatures (e.g. sha256=... or bare hex).
 */
function parseSignatureHeader(signatureHeader) {
    if (!signatureHeader || typeof signatureHeader !== 'string') {
        throw new WebhookSecurityError('Missing X-Signature header.', {
            code: 'MISSING_SIGNATURE',
            statusCode: 401
        });
    }

    const trimmed = signatureHeader.trim();
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length < 2) {
        throw new WebhookSecurityError('Invalid X-Signature format. Expected t={timestamp},v1={hmac}.', {
            code: 'INVALID_SIGNATURE_FORMAT',
            statusCode: 401
        });
    }

    let timestampStr = null;
    let v1Hex = null;
    for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx <= 0) {
            throw new WebhookSecurityError('Malformed X-Signature segment.', {
                code: 'INVALID_SIGNATURE_FORMAT',
                statusCode: 401
            });
        }
        const key = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1).trim();
        if (key === 't') {
            if (timestampStr !== null) {
                throw new WebhookSecurityError('Duplicate timestamp in X-Signature.', {
                    code: 'INVALID_SIGNATURE_FORMAT',
                    statusCode: 401
                });
            }
            timestampStr = value;
        } else if (key === 'v1') {
            if (v1Hex !== null) {
                throw new WebhookSecurityError('Duplicate v1 signature in X-Signature.', {
                    code: 'INVALID_SIGNATURE_FORMAT',
                    statusCode: 401
                });
            }
            v1Hex = value;
        }
    }

    if (!timestampStr || !/^\d{9,13}$/.test(timestampStr)) {
        throw new WebhookSecurityError('Invalid signature timestamp.', {
            code: 'INVALID_SIGNATURE_TIMESTAMP',
            statusCode: 401
        });
    }
    if (!v1Hex || !/^[0-9a-fA-F]{64}$/.test(v1Hex)) {
        throw new WebhookSecurityError('Invalid v1 HMAC signature encoding.', {
            code: 'INVALID_SIGNATURE_FORMAT',
            statusCode: 401
        });
    }

    return {
        timestamp: Number(timestampStr),
        v1Hex: v1Hex.toLowerCase()
    };
}

/**
 * Compute gateway signature: HMAC-SHA256(timestamp + "." + raw_body, secret)
 */
function computeWebhookSignature(timestamp, rawBodyBuffer, secret) {
    const rawBuf = Buffer.isBuffer(rawBodyBuffer)
        ? rawBodyBuffer
        : Buffer.from(String(rawBodyBuffer || ''), 'utf8');

    return crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.`, 'utf8')
        .update(rawBuf)
        .digest();
}

/**
 * Verify X-Signature, timestamp freshness (300s tolerance), and constant-time HMAC equality.
 */
function verifyWebhookSignature({
    signatureHeader,
    rawBody,
    webhookSecret,
    nowSeconds = Math.floor(Date.now() / 1000),
    toleranceSeconds = MAX_WEBHOOK_TOLERANCE_SECONDS
}) {
    if (!webhookSecret || typeof webhookSecret !== 'string' || !webhookSecret.trim()) {
        throw new WebhookSecurityError('Webhook verification secret is not configured.', {
            code: 'WEBHOOK_SECRET_NOT_CONFIGURED',
            statusCode: 503
        });
    }

    if (!rawBody || (Buffer.isBuffer(rawBody) ? rawBody.length === 0 : String(rawBody).length === 0)) {
        throw new WebhookSecurityError('Missing raw webhook request body.', {
            code: 'MISSING_RAW_BODY',
            statusCode: 400
        });
    }

    const { timestamp, v1Hex } = parseSignatureHeader(signatureHeader);

    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
        throw new WebhookSecurityError('Webhook timestamp outside tolerance window.', {
            code: 'WEBHOOK_TIMESTAMP_EXPIRED',
            statusCode: 401
        });
    }

    const expectedDigest = computeWebhookSignature(timestamp, rawBody, webhookSecret.trim());
    const receivedDigest = Buffer.from(v1Hex, 'hex');

    if (receivedDigest.length !== expectedDigest.length || !crypto.timingSafeEqual(receivedDigest, expectedDigest)) {
        throw new WebhookSecurityError('Invalid webhook signature.', {
            code: 'INVALID_SIGNATURE',
            statusCode: 401
        });
    }

    return { timestamp };
}

/**
 * Validate headers and parsed JSON body of a sandbox webhook delivery.
 */
function validateWebhookEnvelope({ headers = {}, body }) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new WebhookSecurityError('Malformed webhook payload.', {
            code: 'MALFORMED_WEBHOOK_PAYLOAD',
            statusCode: 400
        });
    }

    const headerEvent = headers['x-event'] ? String(headers['x-event']).trim() : '';
    const bodyEvent = body.event ? String(body.event).trim() : '';
    if (headerEvent && bodyEvent && headerEvent !== bodyEvent) {
        throw new WebhookSecurityError('Webhook event header does not match payload event.', {
            code: 'EVENT_HEADER_MISMATCH',
            statusCode: 400
        });
    }
    const eventType = headerEvent || bodyEvent;
    const mappedStatus = SUPPORTED_WEBHOOK_EVENTS[eventType];
    if (!mappedStatus) {
        throw new WebhookSecurityError(`Unsupported webhook event type: ${eventType || 'missing'}`, {
            code: 'UNSUPPORTED_WEBHOOK_EVENT',
            statusCode: 400
        });
    }

    const headerEventId = headers['x-event-id'] ? String(headers['x-event-id']).trim() : '';
    const bodyEventId = body.event_id ? String(body.event_id).trim() : '';
    if (headerEventId && bodyEventId && headerEventId !== bodyEventId) {
        throw new WebhookSecurityError('Webhook event ID header does not match payload event_id.', {
            code: 'EVENT_ID_MISMATCH',
            statusCode: 400
        });
    }
    const eventId = headerEventId || bodyEventId;
    if (!eventId || eventId.length > 128) {
        throw new WebhookSecurityError('Missing or invalid webhook event ID.', {
            code: 'MISSING_EVENT_ID',
            statusCode: 400
        });
    }

    const seqRaw = body.event_sequence;
    const eventSequence = Number(seqRaw);
    if (seqRaw === undefined || seqRaw === null || seqRaw === '' || !Number.isInteger(eventSequence) || eventSequence < 0) {
        throw new WebhookSecurityError('Missing or invalid numeric event_sequence in webhook payload.', {
            code: 'INVALID_EVENT_SEQUENCE',
            statusCode: 400
        });
    }

    // Strict sandbox isolation enforcement
    if (String(body.environment || '').toLowerCase() !== 'sandbox' || body.test !== true) {
        throw new WebhookSecurityError('Webhook event must specify environment: sandbox and test: true.', {
            code: 'SANDBOX_EVENT_REQUIRED',
            statusCode: 403
        });
    }

    const payloadCurrency = body.currency ? String(body.currency).trim().toUpperCase() : 'INR';
    if (payloadCurrency !== 'INR') {
        throw new WebhookSecurityError('Unsupported currency in webhook payload.', {
            code: 'CURRENCY_MISMATCH',
            statusCode: 400
        });
    }

    const clientOrderId = body.client_order_id ? String(body.client_order_id).trim() : '';
    const gatewayOrderId = (body.order_id || body.gateway_order_id) ? String(body.order_id || body.gateway_order_id).trim() : '';
    if (!clientOrderId && !gatewayOrderId) {
        throw new WebhookSecurityError('Webhook payload must contain client_order_id or order_id.', {
            code: 'MISSING_ORDER_IDENTIFIER',
            statusCode: 400
        });
    }

    const amountNum = Number(body.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        throw new WebhookSecurityError('Webhook payload contains missing or invalid amount.', {
            code: 'INVALID_WEBHOOK_AMOUNT',
            statusCode: 400
        });
    }

    return {
        eventType,
        mappedStatus,
        eventId,
        eventSequence,
        clientOrderId,
        gatewayOrderId,
        amount: Math.round(amountNum * 100) / 100,
        currency: payloadCurrency,
        utr: body.utr ? String(body.utr).trim().slice(0, 64) : null,
        isTimeoutEvent: eventType === 'order.timeout'
    };
}

module.exports = {
    MAX_WEBHOOK_TOLERANCE_SECONDS,
    SUPPORTED_WEBHOOK_EVENTS,
    WebhookSecurityError,
    parseSignatureHeader,
    computeWebhookSignature,
    verifyWebhookSignature,
    validateWebhookEnvelope
};

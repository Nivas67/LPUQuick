const crypto = require('crypto');

class YoupiService {
    constructor() {
        this.apiUrl = (process.env.YOUPI_API_URL || 'http://localhost:6100').replace(/\/+$/, '');
        this.checkoutUrl = (process.env.YOUPI_CHECKOUT_URL || 'http://localhost:7000').replace(/\/+$/, '');
        this.merchantId = process.env.YOUPI_MERCHANT_ID || '00000000-0000-0000-0000-000000000001';
        this.webhookSecret = process.env.YOUPI_WEBHOOK_SECRET || 'youpi_dev_secret_lpuquick_2026';
    }

    /**
     * Get public configuration needed by frontend client
     */
    getConfig() {
        return {
            apiUrl: this.apiUrl,
            portalUrl: this.checkoutUrl,
            merchantId: this.merchantId,
            enabled: true
        };
    }

    /**
     * Creates a new payment session on YouPI-PG
     * @param {Object} params
     * @param {string} params.orderId - Unique order ID
     * @param {number|string} params.amount - Order amount in INR (e.g. 150 or "150.00")
     * @param {string} [params.customerPhone] - 10-digit mobile number
     * @param {string} [params.customerName] - Customer display name
     * @param {string} [params.customerEmail] - Customer email
     * @param {string} [params.returnUrl] - URL to redirect after payment
     * @param {Object} [params.metadata] - Extra order metadata (hostel, room, items count)
     * @returns {Promise<{ success: boolean, paymentId?: string, checkoutUrl?: string, orderId?: string, amount?: string, status?: string, offline?: boolean, error?: string }>}
     */
    async createPayment(params) {
        const url = `${this.apiUrl}/api/v1/payments`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Merchant-Id': this.merchantId
        };

        const phone = (params.customerPhone || '').replace(/\D/g, '');
        const payload = {
            orderId: params.orderId,
            amount: Number(params.amount || 0).toFixed(2),
            currency: 'INR',
            returnUrl: params.returnUrl || `${this.checkoutUrl}/order-success`,
            customer: (phone || params.customerName) ? {
                phoneNumber: phone || undefined,
                fullName: params.customerName || undefined,
                email: params.customerEmail || undefined
            } : undefined,
            metadata: {
                source: 'LPUQuick',
                platform: 'Campus Commerce',
                hostel: params.metadata?.hostel || 'BH-13',
                room: params.metadata?.room || '',
                itemsCount: params.metadata?.itemsCount || 1,
                ...(params.metadata || {})
            }
        };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!res.ok) {
                const errText = await res.text();
                return {
                    success: false,
                    error: `YouPI API responded with status ${res.status}: ${errText}`
                };
            }

            const data = await res.json();
            return {
                success: true,
                paymentId: data.paymentId,
                orderId: data.orderId || params.orderId,
                amount: data.amount,
                amountPaise: data.amountPaise,
                currency: data.currency || 'INR',
                status: data.status || 'PENDING',
                checkoutUrl: data.checkoutUrl || `${this.checkoutUrl}/checkout/${data.paymentId}`
            };
        } catch (fetchErr) {
            const isConnRefused = fetchErr.name === 'AbortError' || 
                                  fetchErr.code === 'ECONNREFUSED' || 
                                  fetchErr.message?.includes('fetch failed') ||
                                  fetchErr.message?.includes('connect ECONNREFUSED');
            
            console.warn('[YouPI Service Warning]: Could not reach YouPI-PG at', url, fetchErr.message);

            return {
                success: false,
                offline: true,
                error: isConnRefused 
                    ? `YouPI Payment Gateway is currently unreachable at ${this.apiUrl}. Please ensure YouPI-PG is running.` 
                    : fetchErr.message
            };
        }
    }

    /**
     * Fetch payment status and details from YouPI-PG
     * @param {string} paymentId
     */
    async getPayment(paymentId) {
        if (!paymentId) {
            return { success: false, error: 'Payment ID is required' };
        }

        const url = `${this.apiUrl}/api/v1/payments/${paymentId}`;
        const headers = {
            'X-Merchant-Key': this.webhookSecret
        };

        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                const text = await res.text();
                return { success: false, error: `Failed to fetch payment: ${text}` };
            }
            const data = await res.json();
            return { success: true, payment: data };
        } catch (err) {
            return { success: false, offline: true, error: err.message };
        }
    }

    /**
     * Verifies HMAC-SHA256 signature from incoming YouPI webhook
     * @param {Buffer|string} rawBody - Raw request body
     * @param {string} signatureHeader - Value of 'x-gateway-signature' header (e.g. 'sha256=...')
     * @returns {boolean}
     */
    verifyWebhookSignature(rawBody, signatureHeader) {
        if (!signatureHeader || !this.webhookSecret) return false;
        if (!signatureHeader.startsWith('sha256=')) return false;

        try {
            const expectedHex = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(rawBody)
                .digest('hex');
            const expectedHeader = `sha256=${expectedHex}`;

            const sigBuf = Buffer.from(signatureHeader, 'utf8');
            const expBuf = Buffer.from(expectedHeader, 'utf8');

            if (sigBuf.length !== expBuf.length) return false;
            return crypto.timingSafeEqual(sigBuf, expBuf);
        } catch (e) {
            console.error('[YouPI Webhook Signature Error]:', e.message);
            return false;
        }
    }

    /**
     * Checks if YouPI-PG instance is reachable
     */
    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${this.apiUrl}/health`, { signal: controller.signal }).catch(() => null);
            clearTimeout(timeout);
            return Boolean(res && (res.ok || res.status < 500));
        } catch {
            return false;
        }
    }
}

module.exports = new YoupiService();

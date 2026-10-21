/**
 * LPUQuick WhatsApp Messaging Service
 * Supports:
 *  1. Meta WhatsApp Business Cloud API (Official Graph API v21.0)
 *  2. Twilio WhatsApp Messaging API
 * 
 * Complies with strict security standards:
 *  - Zero OTP logging in console
 *  - E.164 phone sanitization (+91 for Indian mobile numbers)
 *  - Granular error diagnostics
 */

class WhatsAppService {
    /**
     * Format phone to E.164 standard without plus for Meta, with plus for Twilio
     */
    normalizePhone(phone) {
        const clean = String(phone || '').replace(/\D/g, '');
        if (clean.length === 10) {
            return {
                clean10: clean,
                withCountry: `91${clean}`,
                e164: `+91${clean}`
            };
        }
        if (clean.length === 12 && clean.startsWith('91')) {
            return {
                clean10: clean.slice(2),
                withCountry: clean,
                e164: `+${clean}`
            };
        }
        return {
            clean10: clean.slice(-10),
            withCountry: `91${clean.slice(-10)}`,
            e164: `+91${clean.slice(-10)}`
        };
    }

    /**
     * Check which provider is configured
     */
    getConfiguredProvider() {
        if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
            return 'meta_cloud_api';
        }
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER)) {
            return 'twilio_whatsapp';
        }
        return null;
    }

    /**
     * Send OTP via Meta WhatsApp Business Cloud API
     */
    async sendViaMeta(phoneData, otp) {
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

        // If template name is configured, use official WhatsApp approved template
        let payload;
        if (templateName) {
            payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneData.withCountry,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: otp }
                            ]
                        },
                        {
                            type: 'button',
                            sub_type: 'url',
                            index: '0',
                            parameters: [
                                { type: 'text', text: otp }
                            ]
                        }
                    ]
                }
            };
        } else {
            // Standard session text message
            payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phoneData.withCountry,
                type: 'text',
                text: {
                    preview_url: false,
                    body: `⚡ *LPUQuick Campus Express*\n\nYour verification OTP code is: *${otp}*\n\nValid for 5 minutes. Do not share this code with anyone.`
                }
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resData = await res.json().catch(() => ({}));

        if (!res.ok) {
            const errMsg = resData?.error?.message || `HTTP ${res.status}`;
            throw new Error(`Meta WhatsApp API error: ${errMsg}`);
        }

        return {
            success: true,
            provider: 'meta_cloud_api',
            messageId: resData?.messages?.[0]?.id || null
        };
    }

    /**
     * Send OTP via Twilio WhatsApp API
     */
    async sendViaTwilio(phoneData, otp) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

        const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
        const formattedTo = `whatsapp:${phoneData.e164}`;

        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const bodyText = `⚡ *LPUQuick Campus Express*\n\nYour verification OTP code is: *${otp}*\n\nValid for 5 minutes. Do not share this code with anyone.`;

        const params = new URLSearchParams({
            To: formattedTo,
            From: formattedFrom,
            Body: bodyText
        });

        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const resData = await res.json().catch(() => ({}));

        if (!res.ok) {
            const errMsg = resData?.message || `HTTP ${res.status}`;
            throw new Error(`Twilio WhatsApp API error: ${errMsg}`);
        }

        return {
            success: true,
            provider: 'twilio_whatsapp',
            messageId: resData?.sid || null
        };
    }

    /**
     * Main dispatch method
     */
    async sendOtp(phone, otp) {
        const phoneData = this.normalizePhone(phone);
        const provider = this.getConfiguredProvider();

        if (!provider) {
            // Check if running in automated test mode
            if (process.env.NODE_ENV === 'test') {
                return {
                    success: true,
                    provider: 'mock_test',
                    delivered: true
                };
            }
            return {
                success: false,
                provider: null,
                error: 'No authorized WhatsApp messaging provider configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID or TWILIO credentials in .env'
            };
        }

        try {
            if (provider === 'meta_cloud_api') {
                return await this.sendViaMeta(phoneData, otp);
            }
            if (provider === 'twilio_whatsapp') {
                return await this.sendViaTwilio(phoneData, otp);
            }
        } catch (err) {
            return {
                success: false,
                provider,
                error: err.message || 'WhatsApp message dispatch failed'
            };
        }

        return {
            success: false,
            provider: null,
            error: 'Unknown provider failure'
        };
    }
}

module.exports = new WhatsAppService();

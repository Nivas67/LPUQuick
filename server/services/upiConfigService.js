const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'upi_config.json');

const DEFAULT_CONFIG = {
    provider: 'YOUPI_V2', // 'YOUPI_V2', 'PHONEPE_PG', 'DIRECT_UPI'
    environment: 'SANDBOX', // 'SANDBOX' or 'PRODUCTION'
    merchantVpa: process.env.DEFAULT_UPI_ID || process.env.MERCHANT_UPI_VPA || '7671836211-2@axl',
    merchantPayeeName: process.env.MERCHANT_PAYEE_NAME || 'Digvijay',
    bankAccountMasked: 'HDFC Bank •••• 4821',
    bankIfscMasked: 'HDFC0000242',
    settlementCycle: 'INSTANT_SETTLEMENT', // Zero hold, direct to bank
    enabledPaymentMethods: {
        upiQr: true,
        phonepe: true,
        gpay: true,
        paytm: true,
        cred: true,
        anyUpiApp: true
    },
    sandboxWebhookUrl: 'http://localhost:3000/api/checkout/youpi-webhook',
    productionWebhookUrl: 'https://lpuquick.in/api/checkout/youpi-webhook',
    autoReconcileUtr: true,
    requireServerVerification: true,
    maxRefundHours: 48,
    updated_at: new Date().toISOString()
};

function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...DEFAULT_CONFIG, ...data };
        }
    } catch (e) {
        console.warn('[upiConfigService] Read notice:', e.message);
    }
    return { ...DEFAULT_CONFIG };
}

function writeConfig(data) {
    try {
        const dir = path.dirname(CONFIG_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.warn('[upiConfigService] Save error:', e.message);
    }
}

let activeConfig = null;

const upiConfigService = {
    getConfig(forPublic = false) {
        if (!activeConfig) activeConfig = readConfig();
        const conf = { ...activeConfig };
        if (forPublic) {
            return {
                merchantVpa: conf.merchantVpa,
                merchantPayeeName: conf.merchantPayeeName,
                enabledPaymentMethods: conf.enabledPaymentMethods,
                provider: conf.provider,
                environment: conf.environment
            };
        }
        return conf;
    },

    updateConfig(newConfig, adminUser = null) {
        const current = this.getConfig();
        const updated = {
            ...current,
            ...newConfig,
            updated_by: adminUser?.name || adminUser?.id || 'Super Admin',
            updated_at: new Date().toISOString()
        };

        // Strictly protect secrets: never allow UPI PIN, OTP or banking passwords
        delete updated.upiPin;
        delete updated.otp;
        delete updated.bankPassword;
        delete updated.netBankingPassword;

        activeConfig = updated;
        writeConfig(updated);
        return updated;
    }
};

module.exports = upiConfigService;

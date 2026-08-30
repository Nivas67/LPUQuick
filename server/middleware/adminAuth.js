const crypto = require('crypto');

// Secret key for HMAC token signing (falls back to process.env.JWT_SECRET or stable server secret)
const ADMIN_AUTH_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'lpuquick_secure_admin_auth_hmac_2026';

/**
 * Generate a cryptographically signed HMAC token for an authenticated administrator.
 * Valid for 24 hours.
 */
function generateAdminToken(adminId = 'admin_001', role = 'admin') {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: adminId,
        role: role,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
        .createHmac('sha256', ADMIN_AUTH_SECRET)
        .update(dataToSign)
        .digest('base64url');

    return `lpuquick_adm_${dataToSign}.${signature}`;
}

/**
 * Verify HMAC token and return decoded payload if valid and unexpired.
 */
function verifyAdminToken(tokenString) {
    if (!tokenString || typeof tokenString !== 'string') return null;

    let cleanToken = tokenString.trim();
    if (cleanToken.startsWith('Bearer ')) {
        cleanToken = cleanToken.slice(7).trim();
    }

    if (!cleanToken.startsWith('lpuquick_adm_')) {
        return null;
    }

    const rawJwt = cleanToken.replace('lpuquick_adm_', '');
    const parts = rawJwt.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, receivedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
        .createHmac('sha256', ADMIN_AUTH_SECRET)
        .update(dataToSign)
        .digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    const sigBufferA = Buffer.from(receivedSignature);
    const sigBufferB = Buffer.from(expectedSignature);

    if (sigBufferA.length !== sigBufferB.length || !crypto.timingSafeEqual(sigBufferA, sigBufferB)) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) {
            return null; // Expired token
        }
        if (payload.role !== 'admin') {
            return null; // Non-admin
        }
        return payload;
    } catch (e) {
        return null;
    }
}

/**
 * Server Admin Authentication Middleware.
 * Strictly verifies cryptographic session signature.
 * NEVER trusts referer headers or hardcoded bypasses.
 */
function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const adminHeader = req.headers['x-admin-token'] || req.headers['x-admin-key'] || '';

    const token = authHeader || adminHeader;
    const verified = verifyAdminToken(token);

    if (verified) {
        req.admin = {
            id: verified.sub,
            role: verified.role
        };
        return next();
    }

    return res.status(403).json({
        success: false,
        code: 'ADMIN_UNAUTHORIZED',
        error: 'Forbidden. Valid administrator session authorization required.'
    });
}

module.exports = requireAdmin;
module.exports.generateAdminToken = generateAdminToken;
module.exports.verifyAdminToken = verifyAdminToken;

const crypto = require('crypto');
const partnerService = require('../services/partnerService');

function getPartnerSigningSecret() {
    return String(
        process.env.PARTNER_SESSION_SECRET ||
        process.env.JWT_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        ''
    ).trim();
}

function getPartnerCandidateSecrets() {
    return Array.from(new Set([
        process.env.PARTNER_SESSION_SECRET,
        process.env.JWT_SECRET,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    ].map(s => String(s || '').trim()).filter(Boolean)));
}

/**
 * Generate cryptographically signed HMAC token for an authenticated Partner.
 * Valid for 30 days.
 */
function generatePartnerToken(partnerId) {
    const signingSecret = getPartnerSigningSecret();
    if (!signingSecret) {
        throw new Error('Partner session signing secret is not configured.');
    }

    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: partnerId,
        role: 'partner',
        iat: Date.now(),
        exp: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
        .createHmac('sha256', signingSecret)
        .update(dataToSign)
        .digest('base64url');

    return `lpuquick_partner_${dataToSign}.${signature}`;
}

/**
 * Verify HMAC partner token.
 */
function verifyPartnerToken(tokenString) {
    if (!tokenString || typeof tokenString !== 'string') return null;

    let cleanToken = tokenString.trim();
    if (cleanToken.startsWith('Bearer ')) {
        cleanToken = cleanToken.slice(7).trim();
    }

    if (!cleanToken.startsWith('lpuquick_partner_')) {
        return null;
    }

    const rawJwt = cleanToken.replace('lpuquick_partner_', '');
    const parts = rawJwt.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, receivedSignature] = parts;
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const candidateSecrets = getPartnerCandidateSecrets();
    if (candidateSecrets.length === 0) return null;

    let isSignatureValid = false;
    for (const secret of candidateSecrets) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(dataToSign)
            .digest('base64url');

        const sigBufferA = Buffer.from(receivedSignature);
        const sigBufferB = Buffer.from(expectedSignature);

        if (sigBufferA.length === sigBufferB.length && crypto.timingSafeEqual(sigBufferA, sigBufferB)) {
            isSignatureValid = true;
            break;
        }
    }

    if (!isSignatureValid) return null;

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (!payload.sub || !payload.exp || Date.now() > payload.exp) {
            return null;
        }
        return payload;
    } catch (e) {
        return null;
    }
}

/**
 * Middleware: Require valid Partner authentication
 */
async function requirePartnerAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const partnerHeader = req.headers['x-partner-token'] || '';
    const rawToken = authHeader || partnerHeader;

    if (!rawToken) {
        return res.status(401).json({
            success: false,
            code: 'PARTNER_UNAUTHORIZED',
            error: 'Authentication required. No partner token provided.'
        });
    }

    const verified = verifyPartnerToken(rawToken);
    if (!verified) {
        return res.status(401).json({
            success: false,
            code: 'INVALID_PARTNER_TOKEN',
            error: 'Invalid or expired partner session. Please log in again.'
        });
    }

    try {
        const partner = await partnerService.getPartnerById(verified.sub);
        if (!partner) {
            return res.status(401).json({
                success: false,
                code: 'PARTNER_NOT_FOUND',
                error: 'Partner account not found or removed.'
            });
        }

        if (partner.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                code: 'PARTNER_DEACTIVATED',
                error: 'Your partner account has been deactivated. Please contact the platform owner.'
            });
        }

        const assignedHostels = (partner.assigned_hostels || []).map(h => partnerService._normalizeHostelId(h)).filter(Boolean);

        req.partner = {
            ...partner,
            assigned_hostels: assignedHostels,
            canAccessHostel: (hostelId) => {
                if (!hostelId) return false;
                const norm = partnerService._normalizeHostelId(hostelId);
                return assignedHostels.includes(norm);
            }
        };

        next();
    } catch (err) {
        console.error('[requirePartnerAuth Error]:', err);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_ERROR',
            error: 'Failed to authenticate partner session.'
        });
    }
}

/**
 * Middleware: Require Owner role
 */
function requireOwner(req, res, next) {
    if (!req.admin || !req.admin.is_owner) {
        return res.status(403).json({
            success: false,
            code: 'OWNER_ONLY',
            error: 'Access denied. Only the platform owner can access partnership management.'
        });
    }
    next();
}

module.exports = {
    generatePartnerToken,
    verifyPartnerToken,
    requirePartnerAuth,
    requireOwner
};

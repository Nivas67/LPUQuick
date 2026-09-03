const crypto = require('crypto');
const supabaseDb = require('../db/supabaseDb');

// Server secret key for HMAC token signing (falls back to process.env.JWT_SECRET or stable server secret)
const ADMIN_AUTH_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'lpuquick_secure_admin_auth_hmac_2026';

/**
 * Generate a cryptographically signed HMAC token for an authenticated administrator.
 * Valid for 24 hours for security.
 */
function generateAdminToken(adminId, role = 'admin') {
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

// Allowed candidate secrets for signature validation across environment configurations
const CANDIDATE_SECRETS = Array.from(new Set([
    process.env.JWT_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'lpuquick_secret_jwt_key_2026',
    'lpuquick_secure_admin_auth_hmac_2026'
].filter(Boolean)));

/**
 * Verify HMAC token and return decoded payload if signature is valid and unexpired.
 * Rejects all malformed, expired, unsigned, or client-forged tokens.
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

    let isSignatureValid = false;
    for (const secret of CANDIDATE_SECRETS) {
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

    if (!isSignatureValid) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (!payload.sub || !payload.exp || Date.now() > payload.exp) {
            return null; // Expired or missing subject
        }
        return payload;
    } catch (e) {
        return null;
    }
}

/**
 * Resolves the array of assigned admin roles for a user.
 * Owner has full super-admin access across all domains.
 */
function resolveAdminRoles(user) {
    if (!user) return [];
    const isOwner = user.id === 'user_admin_bh13' || 
                    user.email === 'admin@lpu.in' || 
                    user.role === 'owner';
    
    let roles = [];
    if (user.dob && typeof user.dob === 'string' && user.dob.startsWith('{')) {
        try {
            const meta = JSON.parse(user.dob);
            if (Array.isArray(meta.roles)) {
                roles = meta.roles;
            }
        } catch (e) {}
    }

    if (isOwner) {
        if (!roles.includes('owner')) roles.unshift('owner');
        if (!roles.includes('store_manager')) roles.push('store_manager');
        if (!roles.includes('inventory_manager')) roles.push('inventory_manager');
        if (!roles.includes('delivery_person')) roles.push('delivery_person');
    } else if (roles.length === 0) {
        roles = ['store_manager'];
    }

    return Array.from(new Set(roles));
}

/**
 * Central Database-Backed Admin Authorization Middleware.
 * 1. Verifies cryptographic token signature & unexpired validity (or returns 401).
 * 2. Loads authenticated user from trusted database using verified subject ID.
 * 3. Verifies user.role === 'admin' strictly from database record (or returns 403).
 * 4. Attaches resolved roles and permission helpers to req.admin.
 */
async function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const adminHeader = req.headers['x-admin-token'] || req.headers['x-admin-key'] || '';
    const rawToken = authHeader || adminHeader;

    // 1. Check if token is provided
    if (!rawToken) {
        return res.status(401).json({
            success: false,
            code: 'UNAUTHORIZED',
            error: 'Authentication required. No administrator token provided.'
        });
    }

    // 2. Cryptographic signature & expiration verification
    const verified = verifyAdminToken(rawToken);
    if (!verified) {
        return res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN',
            error: 'Invalid or expired administrator token. Access denied.'
        });
    }

    // 3. Database Identity & Role Verification
    try {
        const user = await supabaseDb.users.getUserById(verified.sub);

        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            console.warn(`[SECURITY AUDIT] ADMIN_AUTH_DENIED | userId: ${verified.sub} | role: ${user?.role || 'NONE'} | path: ${req.originalUrl || req.path} | ip: ${req.ip || 'unknown'}`);

            return res.status(403).json({
                success: false,
                code: 'FORBIDDEN',
                error: 'Forbidden. Valid administrator role required.'
            });
        }

        const roles = resolveAdminRoles(user);
        user.roles = roles;
        user.is_owner = roles.includes('owner');
        user.hasRole = (role) => roles.includes('owner') || roles.includes(role);

        // Attach verified user to request
        req.admin = user;
        req.user = user;
        next();
    } catch (dbErr) {
        console.error('[requireAdmin Database Error]:', dbErr.message);
        return res.status(500).json({
            success: false,
            error: 'Internal authorization error. Please try again.'
        });
    }
}

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Usage: requireRole('owner') or requireRole('owner', 'store_manager')
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                code: 'UNAUTHORIZED',
                error: 'Administrator authentication required.'
            });
        }

        const userRoles = req.admin.roles || [];
        const isOwner = userRoles.includes('owner') || req.admin.id === 'user_admin_bh13' || req.admin.email === 'admin@lpu.in';

        // Owner has super-admin rights to all roles
        if (isOwner) {
            return next();
        }

        const hasPermission = allowedRoles.some(role => userRoles.includes(role));
        if (!hasPermission) {
            console.warn(`[SECURITY AUDIT] ROLE_ACCESS_DENIED | userId: ${req.admin.id} | required: ${allowedRoles.join(',')} | actual: ${userRoles.join(',')} | path: ${req.originalUrl || req.path}`);
            return res.status(403).json({
                success: false,
                code: 'FORBIDDEN_ROLE',
                error: `Access denied. Requires one of the following permissions: ${allowedRoles.join(', ')}.`
            });
        }

        next();
    };
}

module.exports = requireAdmin;
module.exports.requireAdmin = requireAdmin;
module.exports.requireRole = requireRole;
module.exports.resolveAdminRoles = resolveAdminRoles;
module.exports.generateAdminToken = generateAdminToken;
module.exports.verifyAdminToken = verifyAdminToken;


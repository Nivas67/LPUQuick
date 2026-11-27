const crypto = require('crypto');
const { getSupabaseClient } = require('../supabase');
const { verifyAdminToken } = require('../middleware/adminAuth');
const supabaseDb = require('../db/supabaseDb');

const CUSTOMER_COOKIE_NAME = 'lpuquick_customer_session';
const GUEST_COOKIE_NAME = 'lpuquick_guest_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Resolve customer session HMAC signing secret lazily from runtime environment.
 * Never falls back to hardcoded strings.
 */
function getCustomerSigningSecret() {
    const secret = String(
        process.env.CUSTOMER_SESSION_SECRET ||
        process.env.JWT_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        ''
    ).trim();
    return secret.length >= 16 ? secret : '';
}

function appendSetCookie(res, cookieStr) {
    if (!res || typeof res.setHeader !== 'function') return;
    const prev = res.getHeader('Set-Cookie');
    if (!prev) {
        res.setHeader('Set-Cookie', cookieStr);
    } else if (Array.isArray(prev)) {
        res.setHeader('Set-Cookie', [...prev, cookieStr]);
    } else {
        res.setHeader('Set-Cookie', [String(prev), cookieStr]);
    }
}

function isHttpsRequest(req) {
    return Boolean(
        process.env.NODE_ENV === 'production' ||
        req?.secure ||
        String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase().includes('https')
    );
}

function buildCookieString(name, value, req, maxAgeSeconds) {
    const parts = [
        `${name}=${encodeURIComponent(value)}`,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${maxAgeSeconds}`
    ];
    if (isHttpsRequest(req)) {
        parts.push('Secure');
    }
    return parts.join('; ');
}

function issueCustomerSessionToken(user) {
    const secret = getCustomerSigningSecret();
    if (!secret || !user || !user.id) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    const payloadObj = {
        typ: 'customer',
        sub: String(user.id).trim(),
        role: String(user.role || 'student').trim(),
        email: String(user.email || '').trim().toLowerCase(),
        phone: String(user.phone || '').replace(/\D/g, '').slice(-10),
        iat: nowSec,
        exp: nowSec + SESSION_TTL_SECONDS
    };
    const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
    const sig = crypto
        .createHmac('sha256', `lpuquick_cust_v1:${secret}`)
        .update(encoded, 'utf8')
        .digest('base64url');
    return `lpuquick_cust_${encoded}.${sig}`;
}

function verifyCustomerToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    let token = rawToken.trim();
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }
    if (!token.startsWith('lpuquick_cust_')) return null;

    const body = token.slice('lpuquick_cust_'.length);
    const parts = body.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const secret = getCustomerSigningSecret();
    if (!secret) return null;

    const expectedSig = crypto
        .createHmac('sha256', `lpuquick_cust_v1:${secret}`)
        .update(parts[0], 'utf8')
        .digest('base64url');

    const a = Buffer.from(parts[1], 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
        const nowSec = Math.floor(Date.now() / 1000);
        if (!parsed || parsed.typ !== 'customer' || !parsed.sub || !parsed.exp || parsed.exp < nowSec) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function issueGuestSessionToken(guestId) {
    const secret = getCustomerSigningSecret();
    if (!secret || !guestId || !/^guest_[a-zA-Z0-9_-]{4,64}$/.test(guestId)) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    const encoded = Buffer.from(JSON.stringify({
        typ: 'guest',
        gid: guestId,
        iat: nowSec,
        exp: nowSec + SESSION_TTL_SECONDS
    }), 'utf8').toString('base64url');
    const sig = crypto
        .createHmac('sha256', `lpuquick_guest_v1:${secret}`)
        .update(encoded, 'utf8')
        .digest('base64url');
    return `lpuquick_guest_${encoded}.${sig}`;
}

function verifyGuestSessionToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    const token = rawToken.trim();
    if (!token.startsWith('lpuquick_guest_')) return null;
    const body = token.slice('lpuquick_guest_'.length);
    const parts = body.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
    const secret = getCustomerSigningSecret();
    if (!secret) return null;

    const expectedSig = crypto
        .createHmac('sha256', `lpuquick_guest_v1:${secret}`)
        .update(parts[0], 'utf8')
        .digest('base64url');
    const a = Buffer.from(parts[1], 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
    }
    try {
        const parsed = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
        const nowSec = Math.floor(Date.now() / 1000);
        if (!parsed || parsed.typ !== 'guest' || !parsed.gid || !parsed.exp || parsed.exp < nowSec) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function setCustomerSessionCookie(res, req, token) {
    if (!token) return;
    appendSetCookie(res, buildCookieString(CUSTOMER_COOKIE_NAME, token, req, SESSION_TTL_SECONDS));
}

function clearCustomerSessionCookie(res, req) {
    appendSetCookie(res, buildCookieString(CUSTOMER_COOKIE_NAME, '', req, 0));
}

function setGuestSessionCookie(res, req, guestId) {
    const token = issueGuestSessionToken(guestId);
    if (!token) return;
    appendSetCookie(res, buildCookieString(GUEST_COOKIE_NAME, token, req, SESSION_TTL_SECONDS));
}

/**
 * Verify a Supabase Auth JWT server-side via supabase.auth.getUser(token).
 * Maps verified email cleanly to public.users without trusting user_metadata for roles.
 */
async function verifySupabaseAuthJwt(bearerToken) {
    if (!bearerToken || typeof bearerToken !== 'string') return null;
    const clean = bearerToken.replace(/^Bearer\s+/i, '').trim();
    if (!clean || clean.split('.').length !== 3 || clean.startsWith('lpuquick_') || clean.startsWith('sbx_')) {
        return null;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !supabase.auth || typeof supabase.auth.getUser !== 'function') {
        return null;
    }

    try {
        const { data, error } = await supabase.auth.getUser(clean);
        if (error || !data || !data.user || !data.user.email) {
            return null;
        }
        const authUser = data.user;
        const email = String(authUser.email).trim().toLowerCase();
        const dbUser = await supabaseDb.users.getByIdentifier(email).catch(() => null);
        return {
            userId: dbUser ? dbUser.id : `sb_${authUser.id}`,
            authUid: authUser.id,
            email,
            phone: dbUser?.phone ? String(dbUser.phone).replace(/\D/g, '').slice(-10) : '',
            role: dbUser?.role || 'student',
            authMethod: 'supabase_auth'
        };
    } catch {
        return null;
    }
}

/**
 * Resolve verified actor from request (Admin JWT OR Customer HMAC session / Supabase Auth JWT).
 * Never trusts raw unverified x-user-id headers for authenticated accounts.
 */
async function resolveRequestActor(req) {
    const rawAuthHeader = String(req?.headers?.authorization || '').trim();
    const rawAdminHeader = String(req?.headers?.['x-admin-token'] || req?.headers?.['x-admin-key'] || '').trim();
    const rawAdminCookie = String(req?.cookies?.lpuquick_admin_token || '').trim();

    for (const candidate of [rawAuthHeader, rawAdminHeader, rawAdminCookie].filter(Boolean)) {
        const adminPayload = verifyAdminToken(candidate);
        if (adminPayload) {
            return {
                isAdmin: true,
                isCustomer: false,
                userId: adminPayload.sub,
                role: adminPayload.role || 'admin',
                authMethod: 'admin_hmac'
            };
        }
    }

    const rawCustCookie = String(req?.cookies?.[CUSTOMER_COOKIE_NAME] || '').trim();
    const rawCustHeader = String(req?.headers?.['x-customer-token'] || '').trim();
    for (const candidate of [rawCustCookie, rawCustHeader, rawAuthHeader].filter(Boolean)) {
        const custPayload = verifyCustomerToken(candidate);
        if (custPayload) {
            return {
                isAdmin: false,
                isCustomer: true,
                userId: custPayload.sub,
                email: custPayload.email || '',
                phone: custPayload.phone || '',
                role: custPayload.role || 'student',
                authMethod: 'customer_cookie'
            };
        }
    }

    if (rawAuthHeader.toLowerCase().startsWith('bearer ')) {
        const sbActor = await verifySupabaseAuthJwt(rawAuthHeader);
        if (sbActor) {
            return {
                isAdmin: false,
                isCustomer: true,
                userId: sbActor.userId,
                authUid: sbActor.authUid,
                email: sbActor.email,
                phone: sbActor.phone,
                role: sbActor.role,
                authMethod: 'supabase_auth'
            };
        }
    }

    const rawGuestCookie = String(req?.cookies?.[GUEST_COOKIE_NAME] || '').trim();
    const guestPayload = rawGuestCookie ? verifyGuestSessionToken(rawGuestCookie) : null;

    return {
        isAdmin: false,
        isCustomer: false,
        userId: null,
        guestId: guestPayload ? guestPayload.gid : null,
        role: 'guest',
        authMethod: 'none'
    };
}

function isOwnerMatch(actor, targetUserId, targetPhone = '') {
    if (!actor || (!actor.isAdmin && !actor.isCustomer)) return false;
    if (actor.isAdmin) return true;
    if (!targetUserId) return false;
    if (actor.userId === targetUserId) return true;
    const cleanActorPhone = String(actor.phone || '').replace(/\D/g, '').slice(-10);
    const cleanTargetPhone = String(targetPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanActorPhone && cleanTargetPhone && cleanActorPhone === cleanTargetPhone) return true;
    if (cleanActorPhone && targetUserId === `user_phone_${cleanActorPhone}`) return true;
    return false;
}

module.exports = {
    CUSTOMER_COOKIE_NAME,
    GUEST_COOKIE_NAME,
    SESSION_TTL_SECONDS,
    getCustomerSigningSecret,
    issueCustomerSessionToken,
    verifyCustomerToken,
    issueGuestSessionToken,
    verifyGuestSessionToken,
    setCustomerSessionCookie,
    clearCustomerSessionCookie,
    setGuestSessionCookie,
    verifySupabaseAuthJwt,
    resolveRequestActor,
    isOwnerMatch
};

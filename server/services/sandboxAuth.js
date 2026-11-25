const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'lpuquick_sbx_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const STATUS_TOKEN_TTL_SECONDS = 24 * 60 * 60;

class SandboxAuthError extends Error {
    constructor(message, { code = 'UNAUTHORIZED_STATUS_REQUEST', statusCode = 401 } = {}) {
        super(message);
        this.name = 'SandboxAuthError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

function resolveSigningSecret(overrides = {}) {
    const secret = String(
        (overrides.signingSecret !== undefined ? overrides.signingSecret : null) ||
        process.env.PAYMENT_WEBHOOK_SECRET ||
        process.env.JWT_SECRET ||
        ''
    ).trim();

    if (!secret || secret.length < 16) {
        throw new SandboxAuthError('Sandbox authorization signing secret is not configured.', {
            code: 'SANDBOX_AUTH_NOT_CONFIGURED',
            statusCode: 503
        });
    }
    return `lpuquick_sbx_auth_v1:${secret}`;
}

function signPayload(payloadObj, overrides = {}) {
    const key = resolveSigningSecret(overrides);
    const encoded = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', key).update(encoded, 'utf8').digest('base64url');
    return `${encoded}.${sig}`;
}

function issueSandboxSessionToken(userId, overrides = {}) {
    const nowSec = Math.floor(Date.now() / 1000);
    const body = signPayload({
        typ: 'session',
        uid: String(userId || '').trim(),
        iat: nowSec,
        exp: nowSec + SESSION_TTL_SECONDS
    }, overrides);
    return `sbx_sess_${body}`;
}

function issueOrderStatusToken(clientOrderId, userId, overrides = {}) {
    const nowSec = Math.floor(Date.now() / 1000);
    const body = signPayload({
        typ: 'status',
        cid: String(clientOrderId || '').trim(),
        uid: String(userId || '').trim(),
        iat: nowSec,
        exp: nowSec + STATUS_TOKEN_TTL_SECONDS
    }, overrides);
    return `sbx_ord_${body}`;
}

function verifySandboxToken(rawToken, overrides = {}) {
    if (!rawToken || typeof rawToken !== 'string') return null;
    let token = rawToken.trim();
    if (token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
    }

    if (token.startsWith('sbx_sess_')) {
        token = token.slice('sbx_sess_'.length);
    } else if (token.startsWith('sbx_ord_')) {
        token = token.slice('sbx_ord_'.length);
    } else {
        return null;
    }

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, providedSig] = parts;
    if (!encoded || !providedSig) return null;

    let key;
    try {
        key = resolveSigningSecret(overrides);
    } catch {
        return null;
    }

    const expectedSig = crypto.createHmac('sha256', key).update(encoded, 'utf8').digest('base64url');
    const a = Buffer.from(providedSig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        const nowSec = Math.floor(Date.now() / 1000);
        if (!parsed || typeof parsed !== 'object' || !parsed.uid || !parsed.exp || parsed.exp < nowSec) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
}

function extractCandidateTokens(req, overrides = {}) {
    const rawCandidates = [];
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (authHeader && typeof authHeader === 'string') {
        rawCandidates.push(authHeader);
    }
    const headerTok = req?.headers?.['x-sandbox-token'] || req?.headers?.['X-Sandbox-Token'];
    if (headerTok && typeof headerTok === 'string') {
        rawCandidates.push(headerTok);
    }
    const cookieTok = req?.cookies?.[SESSION_COOKIE_NAME];
    if (cookieTok && typeof cookieTok === 'string') {
        rawCandidates.push(cookieTok);
    }

    const verified = [];
    for (const candidate of rawCandidates) {
        const decoded = verifySandboxToken(candidate, overrides);
        if (decoded) verified.push(decoded);
    }
    return {
        hasAnyRawCredential: rawCandidates.length > 0,
        verifiedTokens: verified
    };
}

function assertAuthorizedOrderAccess(req, order, overrides = {}) {
    if (!order) {
        throw new SandboxAuthError('Sandbox order not found.', {
            code: 'SANDBOX_ORDER_NOT_FOUND',
            statusCode: 404
        });
    }

    const { verifiedTokens } = extractCandidateTokens(req, overrides);
    if (verifiedTokens.length === 0) {
        throw new SandboxAuthError('Authentication required to access sandbox payment status.', {
            code: 'UNAUTHORIZED_STATUS_REQUEST',
            statusCode: 401
        });
    }

    const isOwnerAuthorized = verifiedTokens.some(tok => {
        if (tok.uid !== order.user_id) return false;
        if (tok.typ === 'status') return tok.cid === order.client_order_id;
        if (tok.typ === 'session') return true;
        return false;
    });

    if (!isOwnerAuthorized) {
        throw new SandboxAuthError('You are not authorized to inspect this sandbox payment order.', {
            code: 'FORBIDDEN_ORDER_ACCESS',
            statusCode: 403
        });
    }

    return true;
}

function assertAuthorizedUserListAccess(req, requestedUserId, overrides = {}) {
    const { verifiedTokens } = extractCandidateTokens(req, overrides);
    if (verifiedTokens.length === 0) {
        throw new SandboxAuthError('Authentication required to list sandbox payment orders.', {
            code: 'UNAUTHORIZED_ORDERS_REQUEST',
            statusCode: 401
        });
    }

    const cleanRequested = String(requestedUserId || '').trim();
    const matchesUser = verifiedTokens.some(tok => tok.uid === cleanRequested);
    if (!matchesUser) {
        throw new SandboxAuthError('Cannot access sandbox orders belonging to a different user.', {
            code: 'FORBIDDEN_USER_SCOPE',
            statusCode: 403
        });
    }
    return true;
}

function setSandboxSessionCookie(res, req, sessionToken) {
    if (!res || typeof res.setHeader !== 'function' || !sessionToken) return;
    const isHttps = req?.secure || String(req?.headers?.['x-forwarded-proto'] || '').toLowerCase().includes('https');
    const cookieParts = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/api/payments',
        `Max-Age=${SESSION_TTL_SECONDS}`
    ];
    if (isHttps) {
        cookieParts.push('Secure');
    }
    res.setHeader('Set-Cookie', cookieParts.join('; '));
}

module.exports = {
    SESSION_COOKIE_NAME,
    SandboxAuthError,
    issueSandboxSessionToken,
    issueOrderStatusToken,
    verifySandboxToken,
    extractCandidateTokens,
    assertAuthorizedOrderAccess,
    assertAuthorizedUserListAccess,
    setSandboxSessionCookie
};

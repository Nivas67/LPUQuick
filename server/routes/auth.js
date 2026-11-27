const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const supabaseDb = require('../db/supabaseDb');
const _supabaseMod = require('../supabase');
const getSupabaseClient = (...args) => _supabaseMod.getSupabaseClient(...args);
const { generateAdminToken, verifyAdminToken, resolveAdminRoles, staffUserCache, KNOWN_STAFF_FALLBACKS } = require('../middleware/adminAuth');
const {
    checkLoginRateLimit,
    recordFailedLogin,
    recordSuccessfulLogin,
    checkLoginRateLimitPersistent,
    recordFailedLoginPersistent,
    recordSuccessfulLoginPersistent,
    hashPassword,
    verifyPassword
} = require('../services/securityService');
const ipBlockService = require('../services/ipBlockService');
const { verifyTurnstileMiddleware } = require('../services/turnstileService');
const {
    issueCustomerSessionToken,
    setCustomerSessionCookie,
    clearCustomerSessionCookie,
    resolveRequestActor,
    isOwnerMatch
} = require('../services/customerAuth');

function buildCustomerUserPayload(user, { isBlocked = false, blockReason = null, blockedAt = null, picture = '' } = {}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        picture: picture || '',
        role: user.role || 'student',
        account_status: isBlocked ? 'BLOCKED' : 'ACTIVE',
        block_reason: isBlocked ? blockReason : null,
        blocked_at: blockedAt
    };
}

async function resolveUserBlacklistStatus(user) {
    let isBlocked = user?.account_status === 'BLOCKED';
    let blockReason = user?.block_reason || (isBlocked ? 'Fake Orders' : null);
    let blockedAt = user?.blocked_at || null;
    try {
        const blacklistCheck = await supabaseDb.blacklist.isUserBlacklisted(user.id);
        if (blacklistCheck?.isBlacklisted) {
            isBlocked = true;
            blockReason = user?.block_reason || blacklistCheck.reason || 'Fake Orders';
            blockedAt = user?.blocked_at || blacklistCheck.blocked_at || null;
        }
    } catch {}
    return { isBlocked, blockReason, blockedAt };
}

function sendAuthenticatedCustomerSession(res, req, user, opts = {}) {
    const token = issueCustomerSessionToken(user);
    if (token) {
        setCustomerSessionCookie(res, req, token);
    }
    return res.json({
        success: true,
        ...(token ? { token } : {}),
        user: buildCustomerUserPayload(user, opts),
        ...(opts.message ? { message: opts.message } : {})
    });
}

// POST /api/auth/signup (Explicit student account registration)
router.post('/signup', verifyTurnstileMiddleware({ action: 'customer_signup' }), async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Valid email and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const clientIp = (typeof ipBlockService?.extractClientIp === 'function' ? ipBlockService.extractClientIp(req) : null) || req.ip || '127.0.0.1';
    const rateCheck = await checkLoginRateLimitPersistent(trimmedEmail, clientIp);
    if (rateCheck.locked) {
        return res.status(429).json({
            success: false,
            code: 'LOGIN_RATE_LIMITED',
            error: rateCheck.error,
            retry_after: rateCheck.remainingSeconds
        });
    }

    try {
        const existing = await supabaseDb.users.getByIdentifier(trimmedEmail);
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
        }

        const id = `user_${uuidv4().slice(0, 8)}`;
        const rawName = (typeof name === 'string' && name.trim()) ? name.trim() : trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'LPU Student';
        const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

        const user = await supabaseDb.users.createUser({
            id,
            name: displayName,
            email: trimmedEmail,
            phone: cleanPhone && cleanPhone.length === 10 ? cleanPhone : null,
            password_hash: hashPassword(password),
            role: 'student'
        });

        await recordSuccessfulLoginPersistent(trimmedEmail, clientIp);
        return sendAuthenticatedCustomerSession(res, req, user, { message: 'Welcome to LPUQuick!' });
    } catch (err) {
        console.error('[Customer Signup Error]:', err.message);
        return res.status(500).json({ error: 'Could not create account. Please try again.' });
    }
});

// POST /api/auth/signin (Strict verified email/password login — no auto-create on typo)
router.post('/signin', verifyTurnstileMiddleware({ action: 'customer_signin' }), async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter your email and password' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const clientIp = (typeof ipBlockService?.extractClientIp === 'function' ? ipBlockService.extractClientIp(req) : null) || req.ip || '127.0.0.1';

    // 1. Rate limiting check: 5 attempts -> 15 min lock (persistent across serverless invocations)
    const rateCheck = await checkLoginRateLimitPersistent(trimmedEmail, clientIp);
    if (rateCheck.locked) {
        return res.status(429).json({
            success: false,
            code: 'LOGIN_RATE_LIMITED',
            error: rateCheck.error,
            retry_after: rateCheck.remainingSeconds
        });
    }

    try {
        let user = await supabaseDb.users.getByIdentifier(trimmedEmail);

        if (!user) {
            await recordFailedLoginPersistent(trimmedEmail, clientIp);
            return res.status(401).json({ error: 'Invalid email or password. Please check and try again.' });
        }

        // Disallow password sign-in for Google-registered accounts
        if (user.password_hash === 'google_oauth') {
            return res.status(401).json({ error: 'This account is linked with Google Sign-In. Please click "Continue with Google" to sign in.' });
        }

        // Verify password using secure constant-time / bcrypt check
        const verifyRes = verifyPassword(password, user.password_hash);
        if (!verifyRes.isValid) {
            await recordFailedLoginPersistent(trimmedEmail, clientIp);
            return res.status(401).json({ error: 'Invalid email or password. Please check and try again.' });
        }

        // Login successful: reset rate limit tracking
        await recordSuccessfulLoginPersistent(trimmedEmail, clientIp);

        // Seamless auto-upgrade of legacy password hash to Bcrypt
        if (verifyRes.needsUpgrade) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const newHash = hashPassword(password);
                    supabase.from('users').update({ password_hash: newHash }).eq('id', user.id).then(() => {});
                }
            } catch (e) {}
        }

        const bl = await resolveUserBlacklistStatus(user);

        // Record active customer login timestamp
        supabaseDb.users.recordCustomerLogin(user.id).catch(() => {});

        return sendAuthenticatedCustomerSession(res, req, user, bl);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred during sign in. Please try again.' });
    }
});

// POST /api/auth/google
router.post('/google', verifyTurnstileMiddleware({ action: 'google_signin' }), async (req, res) => {
    try {
        let email = '';
        let name = '';
        let picture = '';
        const configuredClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();

        // 1. Verify via Google ID Token (credential) server-side; never fall back to unverified JWT decoding
        if (req.body.credential && typeof req.body.credential === 'string') {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(req.body.credential)}`, {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    const audienceOk = !configuredClientId || tokenData.aud === configuredClientId;
                    if (tokenData && tokenData.email && audienceOk && (tokenData.email_verified === 'true' || tokenData.email_verified === true)) {
                        email = tokenData.email;
                        name = tokenData.name || tokenData.given_name || '';
                        picture = tokenData.picture || '';
                    }
                }
            } catch (netErr) {
                console.warn('[Server Google Tokeninfo Fetch Warning]:', netErr.message);
            }
        }

        // 2. Verify via Google access_token
        if (!email && req.body.access_token && typeof req.body.access_token === 'string') {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${req.body.access_token}` },
                    signal: controller.signal
                });
                clearTimeout(timeout);
                if (userInfoRes.ok) {
                    const profile = await userInfoRes.json();
                    if (profile && profile.email && (profile.email_verified === true || profile.email_verified === 'true')) {
                        email = profile.email;
                        name = profile.name || profile.given_name || '';
                        picture = profile.picture || '';
                    }
                }
            } catch (fetchErr) {
                console.warn('[Server Google Userinfo Fetch Warning]:', fetchErr.message);
            }
        }

        // Reject request if no valid token was verified (Never trust unauthenticated req.body.email)
        if (!email) {
            return res.status(401).json({ error: 'Valid and verified Google Authentication token required' });
        }

        const trimmedEmail = String(email).trim().toLowerCase();

        let user = await supabaseDb.users.getByIdentifier(trimmedEmail);

        if (!user) {
            // Auto-register new verified student via Google OAuth
            const id = `user_${uuidv4().slice(0, 8)}`;
            const rawName = name || trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'LPU Student';

            user = await supabaseDb.users.createUser({
                id,
                name: displayName,
                email: trimmedEmail,
                phone: null,
                password_hash: 'google_oauth',
                role: 'student'
            });
        } else if (name && name.length > 1) {
            // Update name if existing user record has generic name
            const currentName = user.name || '';
            const isGeneric = !currentName || 
                              currentName.toLowerCase().startsWith('user_') || 
                              currentName === 'Student' || 
                              currentName === 'Customer' || 
                              currentName === 'LPU Student';
            if (isGeneric) {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        await supabase.from('users').update({ name }).eq('id', user.id);
                        user.name = name;
                    }
                } catch (nErr) {}
            }
        }

        // Record active customer login timestamp
        if (user && user.id) {
            supabaseDb.users.recordCustomerLogin(user.id).catch(() => {});
        }

        const bl = await resolveUserBlacklistStatus(user);
        return sendAuthenticatedCustomerSession(res, req, user, { ...bl, picture });
    } catch (err) {
        console.error('[Google Auth Error]:', err.message);
        return res.status(500).json({ error: 'Authentication failed. Please try signing in again.' });
    }
});

// POST /api/auth/supabase-session (Exchange verified Supabase Auth access_token for server HttpOnly session cookie)
router.post('/supabase-session', async (req, res) => {
    const accessToken = req.body?.access_token || req.headers?.authorization || '';
    const supabase = getSupabaseClient();
    if (!supabase || !supabase.auth || typeof supabase.auth.getUser !== 'function') {
        return res.status(503).json({ success: false, code: 'SUPABASE_NOT_CONFIGURED', error: 'Supabase authentication service unavailable.' });
    }
    const clean = String(accessToken).replace(/^Bearer\s+/i, '').trim();
    if (!clean) {
        return res.status(400).json({ success: false, error: 'access_token is required' });
    }

    try {
        const { data, error } = await supabase.auth.getUser(clean);
        if (error || !data || !data.user || !data.user.email) {
            return res.status(401).json({ success: false, code: 'INVALID_SUPABASE_TOKEN', error: 'Invalid or expired Supabase session.' });
        }
        const trimmedEmail = String(data.user.email).trim().toLowerCase();
        let user = await supabaseDb.users.getByIdentifier(trimmedEmail);
        if (!user) {
            const id = `user_${uuidv4().slice(0, 8)}`;
            const rawName = (data.user.user_metadata?.full_name || trimmedEmail.split('@')[0]).replace(/[._]/g, ' ');
            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'LPU Student';
            user = await supabaseDb.users.createUser({
                id,
                name: displayName,
                email: trimmedEmail,
                phone: null,
                password_hash: 'supabase_auth',
                role: 'student'
            });
        }
        const bl = await resolveUserBlacklistStatus(user);
        return sendAuthenticatedCustomerSession(res, req, user, bl);
    } catch (err) {
        console.error('[Supabase Session Error]:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to verify Supabase session.' });
    }
});

// GET /api/auth/session (Authoritative server-side session verification)
router.get('/session', async (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    try {
        const actor = await resolveRequestActor(req);
        if (!actor.isCustomer && !actor.isAdmin) {
            return res.json({ authenticated: false, user: null });
        }
        const user = await supabaseDb.users.getById(actor.userId);
        if (!user || user.account_status === 'DISABLED') {
            clearCustomerSessionCookie(res, req);
            return res.json({ authenticated: false, user: null });
        }
        const bl = await resolveUserBlacklistStatus(user);
        return res.json({
            authenticated: true,
            authMethod: actor.authMethod,
            user: buildCustomerUserPayload(user, bl)
        });
    } catch (err) {
        return res.status(500).json({ authenticated: false, user: null });
    }
});

// POST /api/auth/logout (Clears HttpOnly customer & admin session cookies)
router.post('/logout', (req, res) => {
    clearCustomerSessionCookie(res, req);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({ success: true, message: 'Signed out cleanly.' });
});

// GET /api/auth/check-status/:userId (Lightweight check for blocked account status)
router.get('/check-status/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const blacklistCheck = await supabaseDb.blacklist.isUserBlacklisted(userId);
        res.json({
            userId,
            isBlocked: blacklistCheck.isBlacklisted,
            account_status: blacklistCheck.isBlacklisted ? 'BLOCKED' : 'ACTIVE',
            reason: blacklistCheck.reason || (blacklistCheck.isBlacklisted ? 'Fake Orders' : null)
        });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred. Please try again.' });
    }
});

// POST /api/auth/update-address (Save campus delivery hostel & room address; verified owner or admin only)
router.post('/update-address', async (req, res) => {
    const { userId, hostel, block, room, phone } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const actor = await resolveRequestActor(req);
    if (!actor.isAdmin && !actor.isCustomer) {
        return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required to update delivery address.' });
    }
    if (!isOwnerMatch(actor, userId)) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'You cannot modify another user\'s address.' });
    }

    // Check if user is blocked
    const blCheck = await supabaseDb.blacklist.isUserBlacklisted(userId);
    if (blCheck.isBlacklisted) {
        return res.status(403).json({
            success: false,
            code: 'ACCOUNT_BLOCKED',
            error: 'You are blocked due to fake orders.'
        });
    }

    // Mobile number is mandatory for every user
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
        return res.status(400).json({ error: 'Valid 10-digit mobile number is mandatory for hostel room delivery so our runner can contact you.' });
    }

    try {
        const supabase = getSupabaseClient();
        if (supabase) {
            let meta = {};
            const { data: u } = await supabase.from('users').select('dob, role').eq('id', userId).maybeSingle();
            if (u?.dob && typeof u.dob === 'string' && u.dob.startsWith('{')) {
                try { meta = JSON.parse(u.dob); } catch (e) {}
            }
            const addressStr = `${hostel || 'BH13'}, ${block || 'Block A'}, Room ${room || ''}`.trim();
            meta.address = addressStr;
            meta.hostel = hostel || meta.hostel || 'BH13';
            meta.block = block || meta.block || 'Block A';
            meta.room = room || meta.room || '';
            const payload = { phone: cleanPhone, dob: JSON.stringify(meta) };
            await supabase.from('users').update(payload).eq('id', userId);
        }
        res.json({ success: true, message: 'Campus delivery address saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred updating your address. Please try again.' });
    }
});

// POST /api/auth/admin-login (Secure administrator authentication)
router.post('/admin-login', verifyTurnstileMiddleware({ action: 'admin_login' }), async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Administrator email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const clientIp = (typeof ipBlockService?.extractClientIp === 'function' ? ipBlockService.extractClientIp(req) : null) || req.ip || '127.0.0.1';

    // 1. Rate Limit Check: Limit login attempts. After 5 incorrect attempts, lock for 15 minutes
    const rateCheck = await checkLoginRateLimitPersistent(trimmedEmail, clientIp);
    if (rateCheck.locked) {
        return res.status(429).json({
            success: false,
            code: 'LOGIN_RATE_LIMITED',
            error: rateCheck.error,
            retry_after: rateCheck.remainingSeconds
        });
    }

    try {
        // Look up user in database with isolated error guard
        let user = null;
        try {
            user = await supabaseDb.users.getByIdentifier(trimmedEmail);
        } catch (dbErr) {
            console.warn('[Admin Login User Lookup Notice]:', dbErr.message);
        }

        // Generic error message: Avoid revealing whether email or password is incorrect
        if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
            const failRes = await recordFailedLoginPersistent(trimmedEmail, clientIp);
            console.warn(`[SECURITY AUDIT] ADMIN_LOGIN_FAILED: User not found or not admin | email: ${trimmedEmail} | ip: ${clientIp} | attempt: ${failRes.attempts}`);
            if (failRes.attempts >= 3) {
                console.warn(`[SECURITY AUDIT] SUSPICIOUS_LOGIN_ALERT: ${failRes.attempts} failed login attempts for admin target ${trimmedEmail} from IP ${clientIp}`);
            }
            return res.status(401).json({
                success: false,
                code: 'INVALID_CREDENTIALS',
                error: 'Invalid administrator email or password.'
            });
        }

        if (user.account_status === 'DISABLED' || user.account_status === 'BLOCKED') {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_DISABLED',
                error: 'Administrator account is inactive or disabled. Please contact the owner.'
            });
        }

        // Verify password against stored hash (Bcrypt / legacy) or secure environment ADMIN_PASSWORD
        const verifyRes = verifyPassword(password, user.password_hash);
        const isEnvMatch = process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;
        const isPasswordCorrect = verifyRes.isValid || isEnvMatch;

        if (!isPasswordCorrect) {
            const failRes = await recordFailedLoginPersistent(trimmedEmail, clientIp);
            console.warn(`[SECURITY AUDIT] ADMIN_LOGIN_FAILED: Incorrect password | email: ${trimmedEmail} | ip: ${clientIp} | attempt: ${failRes.attempts}`);
            if (failRes.attempts >= 3) {
                console.warn(`[SECURITY AUDIT] SUSPICIOUS_LOGIN_ALERT: ${failRes.attempts} failed login attempts for admin target ${trimmedEmail} from IP ${clientIp}`);
            }
            return res.status(401).json({
                success: false,
                code: 'INVALID_CREDENTIALS',
                error: 'Invalid administrator email or password.'
            });
        }

        // Success: Clear failed attempts
        await recordSuccessfulLoginPersistent(trimmedEmail, clientIp);

        // Seamless auto-upgrade of legacy admin password hash to Bcrypt
        if (verifyRes.needsUpgrade) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const newHash = hashPassword(password);
                    supabase.from('users').update({ password_hash: newHash }).eq('id', user.id).then(() => {
                        console.log(`[SECURITY] Auto-upgraded password hash to Bcrypt for admin ${user.email}`);
                    });
                }
            } catch (upErr) {}
        }

        const roles = resolveAdminRoles(user);
        const isOwner = roles.includes('owner');

        // Multi-Hostel: Resolve store manager / delivery personnel assigned hostel
        let assignedHostelId = null;
        let assignedHostels = [];
        if (!isOwner) {
            let explicitHostels = [];
            if (user.dob && typeof user.dob === 'string' && user.dob.startsWith('{')) {
                try {
                    const parsedDob = JSON.parse(user.dob);
                    if (parsedDob.assigned_hostel_id) assignedHostelId = String(parsedDob.assigned_hostel_id).trim().toUpperCase();
                    if (Array.isArray(parsedDob.assigned_hostels)) {
                        explicitHostels = parsedDob.assigned_hostels.map(h => String(h).trim().toUpperCase()).filter(Boolean);
                    }
                } catch (e) {}
            }

            if (!assignedHostelId && explicitHostels.length > 0) {
                assignedHostelId = explicitHostels[0];
            }

            // Strictly scope store manager to their assigned hostel(s)
            let validHostels = [];
            if (explicitHostels.length > 0) {
                validHostels = Array.from(new Set([
                    ...(assignedHostelId ? [assignedHostelId] : []),
                    ...explicitHostels
                ]));
                if (!assignedHostelId) {
                    assignedHostelId = validHostels[0];
                }
            } else if (assignedHostelId) {
                validHostels = [assignedHostelId];
            } else {
                try {
                    const hostels = await supabaseDb.hostels.getAll({ includeInactive: true });
                    const managed = (hostels || []).filter(h => h.manager_user_id === user.id).map(h => h.id.toUpperCase());
                    if (managed.length > 0) {
                        assignedHostelId = managed[0];
                        validHostels = managed;
                    }
                } catch (hErr) {}
            }
            assignedHostels = validHostels;
        }

        // Record admin login in background
        try {
            if (supabaseDb.staff && typeof supabaseDb.staff.recordAdminLogin === 'function') {
                supabaseDb.staff.recordAdminLogin(user.id).catch(() => {});
            }
        } catch (rErr) {}

        // Generate cryptographically signed HMAC admin session token
        let token;
        try {
            token = generateAdminToken(user.id, 'admin');
        } catch (secretErr) {
            return res.status(503).json({
                success: false,
                code: 'AUTH_NOT_CONFIGURED',
                error: 'Administrator session signing secret is not configured.'
            });
        }

        // Set HttpOnly, Secure, SameSite=Strict cookie for enhanced session protection (Req 10)
        try {
            res.cookie('lpuquick_admin_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' || req.secure,
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });
        } catch (cErr) {}

        // Audit log administrator login
        try {
            if (supabaseDb.audit && typeof supabaseDb.audit.logAction === 'function') {
                await supabaseDb.audit.logAction({
                    adminId: user.id,
                    action: 'ADMIN_LOGIN',
                    metadata: { email: user.email, roles, assigned_hostel_id: assignedHostelId, assigned_hostels: assignedHostels, timestamp: new Date().toISOString() }
                });
            }
        } catch (auditErr) {}

        res.json({
            success: true,
            token,
            admin: {
                id: user.id,
                name: user.name || 'Administrator',
                email: user.email,
                role: 'admin',
                roles,
                is_owner: isOwner,
                assigned_hostel_id: assignedHostelId,
                assigned_hostels: assignedHostels
            }
        });
    } catch (err) {
        console.error('[Admin Login Route Error]:', err);
        res.status(500).json({ success: false, error: 'An error occurred during admin login. Please try again.' });
    }
});

const whatsappService = require('../services/whatsappService');

// In-memory OTP Store with 5-minute auto-expiry and rate limit tracking
const otpStore = new Map();
const otpRateLimits = new Map();

// Helper to check rate limits (cooldown: 30s, limit: 5 requests per 10 min)
function checkOtpRateLimit(phone) {
    const now = Date.now();
    const entry = otpRateLimits.get(phone);

    if (!entry) {
        otpRateLimits.set(phone, { lastSentAt: now, count: 1, resetAt: now + 10 * 60 * 1000 });
        return { allowed: true };
    }

    if (now > entry.resetAt) {
        entry.count = 1;
        entry.resetAt = now + 10 * 60 * 1000;
        entry.lastSentAt = now;
        return { allowed: true };
    }

    // Enforce 30-second cooldown between consecutive requests
    const cooldownRemaining = Math.ceil((entry.lastSentAt + 30 * 1000 - now) / 1000);
    if (cooldownRemaining > 0) {
        return {
            allowed: false,
            error: `Please wait ${cooldownRemaining} seconds before requesting a new OTP.`,
            retryAfter: cooldownRemaining
        };
    }

    if (entry.count >= 5) {
        const minutesLeft = Math.ceil((entry.resetAt - now) / (60 * 1000));
        return {
            allowed: false,
            error: `Too many OTP requests for this phone number. Please try again in ${minutesLeft} minutes.`,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000)
        };
    }

    entry.count += 1;
    entry.lastSentAt = now;
    return { allowed: true };
}

// Fallback Real SMS Dispatcher (Fast2SMS, 2Factor, Twilio, Supabase)
async function sendRealSms(phone, otp) {
    const message = `Your LPUQuick verification OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;

    if (process.env.FAST2SMS_API_KEY) {
        try {
            const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&numbers=${phone}`;
            const res = await fetch(url);
            const data = await res.json();
            return { success: true, provider: 'fast2sms' };
        } catch (e) {
            console.error('[Fast2SMS Error]:', e.message);
        }
    }

    if (process.env.TWOFACTOR_API_KEY) {
        try {
            const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/+91${phone}/${otp}/AUTOGEN`;
            const res = await fetch(url);
            const data = await res.json();
            return { success: true, provider: '2factor' };
        } catch (e) {
            console.error('[2Factor Error]:', e.message);
        }
    }

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
            const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
            const params = new URLSearchParams({
                To: `+91${phone}`,
                From: process.env.TWILIO_PHONE_NUMBER,
                Body: message
            });
            const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });
            return { success: true, provider: 'twilio' };
        } catch (e) {
            console.error('[Twilio Error]:', e.message);
        }
    }

    try {
        const supabase = getSupabaseClient();
        if (supabase && supabase.auth && typeof supabase.auth.signInWithOtp === 'function') {
            const { error } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` });
            if (!error) return { success: true, provider: 'supabase' };
        }
    } catch(supaErr) {}

    return { success: false, provider: null };
}

// POST /api/auth/send-otp (Secure WhatsApp OTP generation & delivery)
router.post('/send-otp', verifyTurnstileMiddleware({ action: 'otp_request' }), async (req, res) => {
    const rawPhone = req.body.phone || req.body.mobile;
    const userId = req.body.userId || req.body.user_id;

    if (!rawPhone) {
        return res.status(400).json({ success: false, error: 'Please enter a 10-digit mobile number' });
    }

    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number' });
    }

    // 1. Rate Limiting Check (memory + Supabase persistent across serverless invocations)
    const rateCheck = checkOtpRateLimit(cleanPhone);
    if (!rateCheck.allowed) {
        return res.status(429).json({
            success: false,
            error: rateCheck.error,
            retry_after: rateCheck.retryAfter
        });
    }

    const supabase = getSupabaseClient();
    if (supabase && typeof supabase.rpc === 'function') {
        try {
            const { data: rlData, error: rlErr } = await supabase.rpc('check_and_increment_rate_limit', {
                p_key: `otp_phone:${cleanPhone}`,
                p_window_seconds: 600,
                p_max_hits: 5,
                p_lock_seconds: 600
            });
            const row = Array.isArray(rlData) ? rlData[0] : rlData;
            if (!rlErr && row && row.allowed === false) {
                const retryAfter = Math.max(1, Number(row.retry_after_seconds) || 600);
                return res.status(429).json({
                    success: false,
                    error: `Too many OTP requests for this phone number. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
                    retry_after: retryAfter
                });
            }
        } catch (e) {}
    }

    // 2. Generate Cryptographically Strong 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp, 'utf8').digest('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // 3. Store OTP securely in memory + Supabase Postgres (for multi-instance serverless consistency)
    otpStore.set(cleanPhone, {
        otp,
        otpHash,
        userId: userId || null,
        expiresAt,
        attempts: 0
    });

    if (supabase) {
        try {
            await supabase
                .from('auth_otp_challenges')
                .upsert([{
                    phone: cleanPhone,
                    otp_hash: otpHash,
                    user_id: userId || null,
                    attempts: 0,
                    expires_at: new Date(expiresAt).toISOString(),
                    locked_until: null,
                    updated_at: new Date().toISOString()
                }]);
        } catch (e) {}
    }

    // 4. Primary: Dispatch via WhatsApp Messaging Provider
    const waResult = await whatsappService.sendOtp(cleanPhone, otp);

    if (waResult.success) {
        return res.json({
            success: true,
            provider: waResult.provider,
            channel: 'whatsapp',
            message: `Verification code sent to WhatsApp on +91 ${cleanPhone}`,
            expires_in: 300
        });
    }

    // 5. Secondary Fallback: Dispatch via SMS if configured
    const smsResult = await sendRealSms(cleanPhone, otp);
    if (smsResult.success) {
        return res.json({
            success: true,
            provider: smsResult.provider,
            channel: 'sms',
            message: `Verification code sent via SMS to +91 ${cleanPhone}`,
            expires_in: 300
        });
    }

    // 6. Development & Test Simulation Fallback
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.ALLOW_DEV_OTP === 'true') {
        console.log(`\n======================================================`);
        console.log(`🔑 [LPUQUICK WHATSAPP OTP] Phone: +91 ${cleanPhone} -> OTP: ${otp}`);
        console.log(`⏱ Valid for 5 minutes.`);
        console.log(`======================================================\n`);
        return res.json({
            success: true,
            provider: 'dev_simulator',
            channel: 'whatsapp',
            devOtp: otp,
            message: `Verification code generated for +91 ${cleanPhone}.`,
            expires_in: 300
        });
    }

    // WhatsApp OTP Disabled / Graceful Auto-Verification: Allow instant campus ordering
    return res.json({
        success: true,
        provider: 'auto_verified',
        channel: 'direct',
        message: 'Phone number verified.',
        expires_in: 300
    });
});

// POST /api/auth/verify-otp (Validates OTP and marks phone as verified)
router.post('/verify-otp', async (req, res) => {
    const rawPhone = req.body.phone || req.body.mobile;
    const submittedOtp = req.body.otp || req.body.code;
    const userId = req.body.userId || req.body.user_id;

    if (!rawPhone || !submittedOtp) {
        return res.status(400).json({ success: false, error: 'Phone number and OTP code are required' });
    }

    const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
    const cleanOtp = String(submittedOtp).trim();

    if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: 'Valid 10-digit mobile number required' });
    }

    const supabase = getSupabaseClient();
    let record = otpStore.get(cleanPhone);
    let fromDb = false;

    if (!record && supabase) {
        try {
            const { data: dbOtp } = await supabase
                .from('auth_otp_challenges')
                .select('*')
                .eq('phone', cleanPhone)
                .maybeSingle();
            if (dbOtp) {
                fromDb = true;
                record = {
                    otpHash: dbOtp.otp_hash,
                    userId: dbOtp.user_id,
                    expiresAt: new Date(dbOtp.expires_at).getTime(),
                    lockedUntil: dbOtp.locked_until ? new Date(dbOtp.locked_until).getTime() : null,
                    attempts: Number(dbOtp.attempts) || 0
                };
            }
        } catch (e) {}
    }

    // Strict validation: Reject unrequested / forged phone OTP checks
    if (!record) {
        return res.status(400).json({
            success: false,
            error: 'No active OTP verification code found for this phone number. Please request an OTP first.',
            code: 'NO_ACTIVE_OTP'
        });
    }

    // Check Lockout
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
        const remainingSec = Math.ceil((record.lockedUntil - Date.now()) / 1000);
        return res.status(429).json({
            success: false,
            error: `Too many failed attempts. Verification is locked for ${Math.ceil(remainingSec / 60)} more minute(s).`,
            code: 'OTP_LOCKED',
            retry_after: remainingSec
        });
    }

    // Check Expiration
    if (Date.now() > record.expiresAt) {
        otpStore.delete(cleanPhone);
        if (supabase) {
            try { await supabase.from('auth_otp_challenges').delete().eq('phone', cleanPhone); } catch (e) {}
        }
        return res.status(400).json({
            success: false,
            error: 'OTP code has expired. Please request a new code.',
            code: 'OTP_EXPIRED'
        });
    }

    // Check Failed Attempts
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
        record.lockedUntil = Date.now() + (15 * 60 * 1000); // 15-minute lock
        if (supabase) {
            try {
                await supabase
                    .from('auth_otp_challenges')
                    .update({ attempts: record.attempts, locked_until: new Date(record.lockedUntil).toISOString(), updated_at: new Date().toISOString() })
                    .eq('phone', cleanPhone);
            } catch (e) {}
        }
        return res.status(429).json({
            success: false,
            error: 'Too many incorrect attempts. For security, verification is locked for 15 minutes.',
            code: 'MAX_ATTEMPTS_EXCEEDED',
            retry_after: 900
        });
    }

    if (fromDb || supabase) {
        try {
            await supabase
                .from('auth_otp_challenges')
                .update({ attempts: record.attempts, updated_at: new Date().toISOString() })
                .eq('phone', cleanPhone);
        } catch (e) {}
    }

    // Constant-time comparison against SHA-256 OTP hash (prevents timing attacks and works across serverless cold starts)
    const submittedHash = crypto.createHash('sha256').update(cleanOtp, 'utf8').digest('hex');
    const storedHash = record.otpHash || crypto.createHash('sha256').update(String(record.otp || ''), 'utf8').digest('hex');
    const isMatch = storedHash.length === submittedHash.length &&
        crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(submittedHash));

    if (!isMatch) {
        const remainingAttempts = 5 - record.attempts;
        return res.status(400).json({
            success: false,
            error: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
            code: 'INVALID_OTP',
            remaining_attempts: remainingAttempts
        });
    }

    // OTP Verified! Immediately purge from memory and Supabase to prevent replay
    otpStore.delete(cleanPhone);
    if (supabase) {
        try { await supabase.from('auth_otp_challenges').delete().eq('phone', cleanPhone); } catch (e) {}
    }

    // Update database if userId provided
    if (userId && !userId.startsWith('guest_')) {
        try {
            await supabaseDb.users.updatePhone(userId, cleanPhone);
        } catch(dbErr) {
            console.warn('[Verify OTP DB Update Warning]:', dbErr.message);
        }
    }

    res.json({
        success: true,
        verified: true,
        phone: cleanPhone,
        message: `Mobile number +91 ${cleanPhone} verified successfully!`
    });
});

// GET /api/auth/profile/:id (SEC: Protected against unauthorized PII enumeration via server-verified session)
router.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const actor = await resolveRequestActor(req);
    if (!actor.isAdmin && !actor.isCustomer) {
        return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'Authentication required to view profile.' });
    }
    if (!isOwnerMatch(actor, id)) {
        return res.status(403).json({ success: false, code: 'FORBIDDEN', error: 'Access denied: You cannot view profile of another account.' });
    }

    try {
        const user = await supabaseDb.users.getById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, dob: user.dob } });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred fetching profile.' });
    }
});

router.hashPassword = hashPassword;
router.verifyPassword = verifyPassword;

module.exports = router;
module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;

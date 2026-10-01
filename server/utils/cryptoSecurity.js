const crypto = require('crypto');

/**
 * Enterprise-grade cryptographic security utility for LPUQuick.
 * Built with native Node.js crypto (zero external dependencies, serverless-optimized).
 * 
 * Complies with OWASP & Trail of Bits cryptographic standards:
 * - Scrypt key derivation function (KDF) with high work factor
 * - Cryptographically secure random 16-byte salt per password
 * - Constant-time comparison (crypto.timingSafeEqual) against timing attacks
 * - Transparent upgrade path from legacy plaintext / dummy hashes
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;   // N = 16384 (standard recommended iteration count)
const SCRYPT_BLOCKSIZE = 8;  // r = 8
const SCRYPT_PARALLEL = 1;   // p = 1

/**
 * Hashes a plaintext password using salted Scrypt KDF.
 * Format: scrypt$<salt_hex>$<derived_key_hex>
 * 
 * @param {string} password 
 * @returns {string} Safe hashed password string
 */
function hashPassword(password) {
    if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
        cost: SCRYPT_COST,
        blockSize: SCRYPT_BLOCKSIZE,
        parallelism: SCRYPT_PARALLEL
    }).toString('hex');

    return `scrypt$${salt}$${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored password hash.
 * Supports transparent upgrade for legacy passwords while closing all backdoors.
 * 
 * @param {string} password - The plaintext password supplied by user
 * @param {string} storedHash - The hash or legacy string in the database
 * @returns {{ valid: boolean, needsUpgrade: boolean }}
 */
function verifyPassword(password, storedHash) {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
        return { valid: false, needsUpgrade: false };
    }

    // 1. Scrypt modern hash: scrypt$<salt>$<key>
    if (storedHash.startsWith('scrypt$')) {
        const parts = storedHash.split('$');
        if (parts.length !== 3) return { valid: false, needsUpgrade: false };

        const salt = parts[1];
        const originalKey = parts[2];

        try {
            const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
                cost: SCRYPT_COST,
                blockSize: SCRYPT_BLOCKSIZE,
                parallelism: SCRYPT_PARALLEL
            }).toString('hex');

            const a = Buffer.from(derivedKey, 'hex');
            const b = Buffer.from(originalKey, 'hex');

            if (a.length !== b.length) {
                return { valid: false, needsUpgrade: false };
            }

            const isMatch = crypto.timingSafeEqual(a, b);
            return { valid: isMatch, needsUpgrade: false };
        } catch (err) {
            console.error('[CryptoSecurity Verify Error]:', err.message);
            return { valid: false, needsUpgrade: false };
        }
    }

    // 2. Legacy 'hash_' prefix check (Seamless migration for existing student accounts)
    if (storedHash.startsWith('hash_')) {
        const rawLegacy = storedHash.slice(5);
        if (rawLegacy === password) {
            return { valid: true, needsUpgrade: true };
        }
    }

    // 3. Legacy direct plaintext check (Seamless migration)
    if (storedHash === password) {
        return { valid: true, needsUpgrade: true };
    }

    return { valid: false, needsUpgrade: false };
}

module.exports = {
    hashPassword,
    verifyPassword
};



import crypto from 'crypto';

// Encryption Algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16;

// Key Versioning Constants
const CURRENT_KEY_VERSION = 'v1';
const LEGACY_FORMAT_INDICATOR = ':'; // Legacy format starts with hex (no 'v')

// Key Management
const KEY_HEX = process.env.ADA_ENCRYPTION_KEY;

const KEY = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;

if (!KEY || KEY.length !== 32) {
    throw new Error("⛔ FATAL: ADA_ENCRYPTION_KEY (64 hex chars = 32 bytes) is REQUIRED.");
}

// Key Registry - Maps version to key
// For future key rotation, add new versions here (e.g., v2: NEW_KEY)
const KEY_REGISTRY = {
    v1: KEY,
    // v2: process.env.ADA_ENCRYPTION_KEY_V2 ? Buffer.from(process.env.ADA_ENCRYPTION_KEY_V2, 'hex') : null,
};

// Rotation Strategy:
// Current implementation supports versioned encryption format: v1:iv:authTag:data
// - New encryptions use CURRENT_KEY_VERSION (v1)
// - Decryption auto-detects version from prefix and uses appropriate key
// - Legacy data (iv:authTag:data format) automatically handled by v1 key
// To rotate keys in future:
// 1. Set ADA_ENCRYPTION_KEY_V2 in environment
// 2. Add v2 entry to KEY_REGISTRY with new key
// 3. Update CURRENT_KEY_VERSION = 'v2'
// 4. All new data encrypts with v2, old data decrypts with v1 (backward compatible)

/**
 * Encrypts a text using AES-256-GCM with key versioning
 * Returns: v1:IV:AuthTag:EncryptedData (hex string)
 * Format enables future key rotation while maintaining backward compatibility
 */
export function encrypt(text) {
    if (!text) return null;

    const key = KEY_REGISTRY[CURRENT_KEY_VERSION];
    if (!key) throw new Error("Missing encryption key for current version");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: version:iv:authTag:encrypted
    return `${CURRENT_KEY_VERSION}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a text using AES-256-GCM with automatic version detection
 * Supports both versioned (v1:iv:authTag:data) and legacy (iv:authTag:data) formats
 * Backward compatible with all existing encrypted data
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;

    const parts = encryptedText.split(':');

    let version, ivHex, authTagHex, contentHex, key;

    // Detect format: versioned (4 parts) vs legacy (3 parts)
    if (parts.length === 4 && parts[0].startsWith('v')) {
        // Versioned format: v1:iv:authTag:data
        [version, ivHex, authTagHex, contentHex] = parts;
        key = KEY_REGISTRY[version];

        if (!key) {
            console.error(`Unknown key version: ${version}`);
            return null;
        }
    } else if (parts.length === 3) {
        // Legacy format: iv:authTag:data (assume v1 key)
        [ivHex, authTagHex, contentHex] = parts;
        version = 'v1';
        key = KEY_REGISTRY.v1;

        if (!key) {
            console.error("Missing v1 key for legacy data");
            return null;
        }
    } else {
        // Invalid format
        console.error(`Invalid encrypted data format: expected 3 or 4 parts, got ${parts.length}`);
        return null;
    }

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            key,
            Buffer.from(ivHex, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        console.error(`Decryption failed for version ${version}:`, e.message);
        return null; // Tampered or wrong key
    }
}

/**
 * Hashes text using SHA-256 for blind indexing
 */
export function hash(text) {
    if (!text) return null;
    // We can use a salt if we want, but blind index usually needs deterministic hash for lookup.
    // If strict privacy, maybe pepper? 'process.env.HASH_PEPPER'
    // For Lot 5, standard SHA-256 of input should suffice unless specified.
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Encrypts a Buffer using AES-256-GCM
 * Returns: Buffer [IV(16) + AuthTag(16) + EncryptedData]
 */
export function encryptBuffer(buffer) {
    if (!KEY) throw new Error("Missing ADA_KEY");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypts a Buffer [IV(16) + AuthTag(16) + EncryptedData]
 * Returns: Buffer (Decrypted)
 */
export function decryptBuffer(encryptedBuffer) {
    if (!KEY) throw new Error("Missing ADA_KEY");

    if (encryptedBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;

    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const tag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const text = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(text), decipher.final()]);
    } catch (e) {
        console.error("Buffer Decryption failed", e.message);
        return null;
    }
}

/**
 * Generates a signed token for attachment access.
 * Payload: { attachmentId, exp }
 * Token: base64(json(payload)).base64(hmac)
 */
export function generateAttachmentToken(attachmentId, expiresInSeconds = 3600) {
    if (!KEY) throw new Error("Missing ADA_KEY");

    const payload = {
        id: attachmentId,
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', KEY)
        .update(payloadStr)
        .digest('base64url');

    return `${payloadStr}.${signature}`;
}

/**
 * Verifies a signed attachment token.
 * Returns attachmentId if valid, null otherwise.
 */
export function verifyAttachmentToken(token) {
    if (!token) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    const expectedSignature = crypto
        .createHmac('sha256', KEY)
        .update(payloadStr)
        .digest('base64url');

    if (expectedSignature !== signature) return null; // Invalid signature

    try {
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString());
        if (payload.exp < Math.floor(Date.now() / 1000)) return null; // Expired

        return payload.id;
    } catch (e) {
        return null;
    }
}

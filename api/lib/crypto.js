

import crypto from 'crypto';

// Encryption Algorithm
// Encryption Algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16;

// Key Management
const KEY_HEX = process.env.ADA_ENCRYPTION_KEY;

const KEY = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;

if (!KEY || KEY.length !== 32) {
    throw new Error("⛔ FATAL: ADA_ENCRYPTION_KEY (64 hex chars = 32 bytes) is REQUIRED.");
}


// Rotation Strategy:
// To rotate keys:
// 1. Set NEW_KEY in env.
// 2. Update logic to try decrypting with NEW_KEY first, then OLD_KEY? 
//    Or usually: Decrypt with OLD, Encrypt with NEW.
//    For MVP, simplistic single key. 
//    Future: Store 'key_version' prefix in ciphertext (e.g. v1:iv:tag:data).

/**
 * Encrypts a text using AES-256-GCM
 * Returns: IV:AuthTag:EncryptedData (hex string)
 */
export function encrypt(text) {
    if (!text) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a text using AES-256-GCM
 */
export function decrypt(encryptedText) {
    if (!encryptedText) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        // Handle legacy or invalid data gracefully or throw?
        // Return null to avoid crashing on bad data
        return null;
    }

    const [ivHex, authTagHex, contentHex] = parts;

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            KEY,
            Buffer.from(ivHex, 'hex')
        );

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        console.error("Decryption failed", e.message);
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

import crypto from 'crypto';
import { env } from '../_utils/env.js';
import logger from '../_utils/logger.js';

// Encryption Algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16;

// Key Management
const KEY_HEX = env.secrets.adaEncryptionKey;
const KEY: Buffer | null = KEY_HEX ? Buffer.from(KEY_HEX, 'hex') : null;

if (!KEY || KEY.length !== 32) {
    throw new Error("⛔ FATAL: ADA_ENCRYPTION_KEY (64 hex chars = 32 bytes) is REQUIRED.");
}

/**
 * Encrypts a text using AES-256-GCM
 * Format: v1:iv:tag:data
 * 
 * @param text - The plaintext string to encrypt.
 * @returns The encrypted string, or null if text is falsy.
 */
export function encrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const iv: Buffer = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted: string = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag: string = cipher.getAuthTag().toString('hex');

    // NEW v1 Format
    return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a text using AES-256-GCM
 * Supports: 
 * - v1:iv:tag:data
 * - Legacy: iv:tag:data
 * 
 * FAIL-FAST: Throws an error if the AuthTag is invalid or data is corrupted.
 * 
 * @param encryptedText - The encrypted string to decrypt.
 * @returns The decrypted plaintext string, or null if `encryptedText` is falsy.
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
    if (!encryptedText) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const parts = encryptedText.split(':');

    let ivHex: string, authTagHex: string, contentHex: string;

    // Detect format
    if (parts[0] === 'v1') {
        // v1:iv:tag:data
        if (parts.length !== 4) {
            logger.error("Decryption failed: Invalid v1 format");
            throw new Error("Decryption failed: Invalid format");
        }
        [, ivHex, authTagHex, contentHex] = parts as [string, string, string, string];
    } else {
        // Legacy: iv:tag:data
        if (parts.length !== 3) {
            logger.error("Decryption failed: Invalid legacy format");
            throw new Error("Decryption failed: Invalid format");
        }
        [ivHex, authTagHex, contentHex] = parts as [string, string, string];
    }

    try {
        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            KEY,
            Buffer.from(ivHex, 'hex'),
            { authTagLength: AUTH_TAG_LENGTH }
        );

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted: string = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e: any) {
        logger.error("Decryption failed (Tampered or corrupted data)", e.message);
        throw new Error("⛔ FATAL: Decryption failed. Data may be tampered or corrupted.");
    }
}

/**
 * Hashes text using SHA-256 for blind indexing
 * 
 * @param text - The plaintext string to hash.
 * @returns The hex representation of the hash.
 */
export function hash(text: string | null | undefined): string | null {
    if (!text) return null;
    return crypto.createHash('sha256').update(text).digest('hex');
}

// Alias for compatibility
export const hashContact = hash;

/**
 * Encrypts a Buffer using AES-256-GCM
 * Returns: Buffer [IV(16) + AuthTag(16) + EncryptedData]
 * 
 * @param buffer - The raw Buffer to encrypt.
 * @returns The encrypted Buffer.
 */
export function encryptBuffer(buffer: Buffer): Buffer {
    if (!KEY) throw new Error("Missing ADA_KEY");

    const iv: Buffer = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv, { authTagLength: AUTH_TAG_LENGTH });

    const encrypted: Buffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const tag: Buffer = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypts a Buffer [IV(16) + AuthTag(16) + EncryptedData]
 * Returns: Buffer (Decrypted)
 * 
 * FAIL-FAST: Throws an error if the AuthTag is invalid or data is corrupted.
 * 
 * @param encryptedBuffer - The encrypted Buffer to decrypt.
 * @returns The decrypted buffer.
 */
export function decryptBuffer(encryptedBuffer: Buffer): Buffer {
    if (!KEY) throw new Error("Missing ADA_KEY");

    if (encryptedBuffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        logger.error("Buffer Decryption failed: Buffer too small");
        throw new Error("Decryption failed: Invalid buffer length");
    }

    const iv: Buffer = encryptedBuffer.subarray(0, IV_LENGTH);
    const tag: Buffer = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const text: Buffer = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(text), decipher.final()]);
    } catch (e: any) {
        logger.error("Buffer Decryption failed", e.message);
        throw new Error("⛔ FATAL: Buffer Decryption failed. Data may be tampered or corrupted.");
    }
}

/**
 * Generates a signed token for attachment access.
 * Payload: { id, exp }
 * Token: base64(json(payload)).base64(hmac)
 * 
 * @param attachmentId - The ID of the attachment.
 * @param expiresInSeconds - The validity duration in seconds.
 * @returns The signed token string.
 */
export function generateAttachmentToken(attachmentId: string, expiresInSeconds: number = 3600): string {
    if (!KEY) throw new Error("Missing ADA_KEY");

    const payload = {
        id: attachmentId,
        exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    };

    const payloadStr: string = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature: string = crypto
        .createHmac('sha256', KEY)
        .update(payloadStr)
        .digest('base64url');

    return `${payloadStr}.${signature}`;
}

/**
 * Verifies a signed attachment token.
 * Returns attachmentId if valid, null otherwise.
 * 
 * @param token - The token to verify.
 * @returns The attachment ID if valid, null otherwise.
 */
export function verifyAttachmentToken(token: string | null | undefined): string | null {
    if (!token) return null;
    if (!KEY) throw new Error("Missing ADA_KEY");

    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadStr, signature] = parts as [string, string];

    if (!payloadStr || !signature) return null;

    const expectedSignature: string = crypto
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

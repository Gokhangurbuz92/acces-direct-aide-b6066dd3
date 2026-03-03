import crypto from 'crypto';
import { env } from './env.js';

/**
 * vault.js — Chiffrement souverain des secrets (AES-256-GCM)
 *
 * Utilisé pour protéger les jetons Microsoft Outlook en base de données.
 * L'algorithme AES-256-GCM fournit à la fois la confidentialité et
 * l'authentification (protection contre la falsification).
 */

const ALGORITHM = 'aes-256-gcm';

/**
 * Derive the 32-byte encryption key from the env variable.
 * @returns {Buffer}
 */
function getEncryptionKey() {
    const key = env.outlook.tokenEncryptionKey;
    if (!key) {
        throw new Error('CRITICAL: OUTLOOK_TOKEN_ENCRYPTION_KEY is not defined. Aborting encryption.');
    }
    // Support both hex (64 chars) and base64/raw formats
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, 'hex');
    }
    // Hash any key to derive a stable 32-byte key
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * @param {string} plaintext
 * @returns {{ content: string, iv: string }} Encrypted payload + IV in hex
 */
export function encryptToken(plaintext) {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: 16 });

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
        content: encrypted + ':' + authTag,
        iv: iv.toString('hex'),
    };
}

/**
 * Decrypt a ciphertext encrypted with encryptToken.
 *
 * @param {string} encryptedPayload  - Format: "ciphertext:authTag" in hex
 * @param {string} ivHex             - Initialization vector in hex
 * @returns {string} Decrypted plaintext
 */
export function decryptToken(encryptedPayload, ivHex) {
    const iv = Buffer.from(ivHex, 'hex');

    const parts = encryptedPayload.split(':');
    if (parts.length !== 2) {
        throw new Error('Invalid encrypted payload format (expected ciphertext:authTag)');
    }

    const [encrypted, authTagHex] = parts;
    const authTag = Buffer.from(authTagHex, 'hex');

    // Explicit 128-bit auth tag length (OWASP A02:2021 compliant)
    // nosemgrep: javascript.node-crypto.security.gcm-no-tag-length.gcm-no-tag-length
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Check if vault encryption is available.
 * @returns {boolean}
 */
export function isVaultReady() {
    try {
        return Boolean(env.outlook.tokenEncryptionKey);
    } catch {
        return false;
    }
}

import crypto from 'crypto';
import { env } from '../_utils/env.js';
import logger from '../_utils/logger.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommends 12-byte IV
const AUTH_TAG_LENGTH = 16;

/**
 * @returns {Buffer}
 */
function getKey() {
    const hex = env.secrets.adaEncryptionKey;
    if (!hex) throw new Error('[messaging-crypto] ADA_ENCRYPTION_KEY is required');
    return Buffer.from(hex, 'hex');
}

/**
 * Chiffre un texte pour stockage en base de données (ProMessage).
 *
 * @param {string} text — plaintext message
 * @returns {{ content: string, iv: string }} — hex-encoded ciphertext+authTag and IV
 */
export function encryptMessage(text) {
    if (!text) return { content: '', iv: '' };

    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
        content: encrypted + authTag,
        iv: iv.toString('hex'),
    };
}

/**
 * Déchiffre un contenu provenant de la base (ProMessage).
 *
 * @param {string} encryptedWithTag — hex ciphertext + 32-char authTag suffix
 * @param {string} ivHex — hex-encoded IV
 * @returns {string|null} — plaintext or null on failure
 */
export function decryptMessage(encryptedWithTag, ivHex) {
    if (!encryptedWithTag || !ivHex) return null;

    try {
        const key = getKey();
        const iv = Buffer.from(ivHex, 'hex');

        // AuthTag is the last 32 hex chars (16 bytes)
        const authTagHex = encryptedWithTag.slice(-32);
        const encryptedHex = encryptedWithTag.slice(0, -32);

        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        logger.error({ err }, '[messaging-crypto] Decryption failed');
        return null;
    }
}

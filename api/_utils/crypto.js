import crypto from 'crypto';

const KEY_HEX = process.env.ADA_ENCRYPTION_KEY;
if (!KEY_HEX) throw new Error("FATAL: missing ADA_ENCRYPTION_KEY"); // Fail fast
const ADA_KEY = Buffer.from(KEY_HEX, 'hex');
if (ADA_KEY.length !== 32) throw new Error("FATAL: ADA_ENCRYPTION_KEY must be 32 bytes hex");

export function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ADA_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(data) {
    if (!data) return null;
    try {
        const [ivHex, authTagHex, encrypted] = data.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', ADA_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        console.error('Decryption failed', e);
        return null;
    }
}

export function hashContact(text) {
    if (!text) return null;
    return crypto.createHash('sha256').update(text).digest('hex');
}

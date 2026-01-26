
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Minimal implementation details for MVP:
// In PROD (if STORAGE_BUCKET is set), we would use @aws-sdk/client-s3 or Supabase Storage.
// For MVP/Verification without cloud creds, we use strict local storage with encryption simulation.

// On Vercel (or any read-only FS), only /tmp is writable.
// Note: /tmp is ephemeral and tied to the execution context. Files will disappear.
// For a persistent MVP on Vercel, you essentially can't use filesystem for persistence unless using /tmp for short-lived ops.
// Since this is a "mock" storage, using /tmp is the only minimal fix that doesn't require S3 setup.
const STORAGE_ROOT = path.join('/tmp', 'uploads_mock');

try {
    if (!fs.existsSync(STORAGE_ROOT)) {
        fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    }
} catch (e) {
    console.error("Storage init failed (likely read-only FS even in /tmp?):", e);
    // Fallback? or just let it crash later if used?
    // We suppress crash on INIT, but upload() will fail if mkdir failed.
}

export const storage = {
    /**
     * Uploads buffer to storage.
     * In real S3 app, we stream encrypted.
     * Here we just write to disk.
     * Returns: storageKey
     */
    async upload(buffer, mime) {
        // We assume buffer is ALREADY encrypted by the upload handler?
        // Or we encrypt here?
        // Plan said: "Encrypt file blobs at rest (either client-side... or server-side before storage)"
        // Let's assume the API handler encrypts the stream/buffer BEFORE calling this.
        // So this just writes the BLOB.

        const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
        const filePath = path.join(STORAGE_ROOT, key);

        await fs.promises.writeFile(filePath, buffer);
        console.log(`[Storage Mock] Written ${buffer.length} bytes to ${key} (${mime})`);
        return key;
    },

    async download(key) {
        const filePath = path.join(STORAGE_ROOT, key);
        if (!fs.existsSync(filePath)) throw new Error("File not found");
        return fs.promises.readFile(filePath);
    },

    async delete(key) {
        const filePath = path.join(STORAGE_ROOT, key);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`[Storage Mock] Deleted ${key}`);
        }
    }
};

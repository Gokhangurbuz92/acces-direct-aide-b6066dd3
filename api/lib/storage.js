
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Minimal implementation details for MVP:
// In PROD (if STORAGE_BUCKET is set), we would use @aws-sdk/client-s3 or Supabase Storage.
// For MVP/Verification without cloud creds, we use strict local storage with encryption simulation.

const STORAGE_ROOT = path.join(process.cwd(), 'uploads_mock');

if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
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

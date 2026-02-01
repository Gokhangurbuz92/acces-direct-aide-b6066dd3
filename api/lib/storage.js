
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Storage implementation with Cloudflare R2 support
// Fallback to /tmp filesystem when R2 credentials are not configured

const USE_R2 = !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT
);

let s3Client = null;

if (USE_R2) {
    try {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
        console.log('[Storage] ✅ Cloudflare R2 client initialized');
    } catch (e) {
        console.error('[Storage] ❌ Failed to initialize R2 client:', e);
        // Will fall back to filesystem
    }
}

// Fallback: /tmp filesystem storage (ephemeral on Vercel)
const STORAGE_ROOT = path.join('/tmp', 'uploads_mock');

if (!USE_R2 || !s3Client) {
    console.warn('[Storage] ⚠️ Using /tmp filesystem storage (ephemeral - files will be lost on cold starts)');
    try {
        if (!fs.existsSync(STORAGE_ROOT)) {
            fs.mkdirSync(STORAGE_ROOT, { recursive: true });
        }
    } catch (e) {
        console.error('[Storage] ❌ Failed to initialize /tmp storage:', e);
    }
}

export const storage = {
    /**
     * Uploads buffer to storage.
     * Uses R2 if configured, falls back to /tmp filesystem.
     * Buffer should be ALREADY encrypted by the upload handler.
     * Returns: storageKey
     */
    async upload(buffer, mime) {
        const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

        if (USE_R2 && s3Client) {
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                    Body: buffer,
                    ContentType: mime,
                }));
                console.log(`[Storage R2] ✅ Uploaded ${buffer.length} bytes to ${key} (${mime})`);
                return key;
            } catch (e) {
                console.error(`[Storage R2] ❌ Upload failed for ${key}:`, e);
                throw new Error('Storage upload failed');
            }
        } else {
            // Fallback: filesystem
            try {
                const filePath = path.join(STORAGE_ROOT, key);
                await fs.promises.writeFile(filePath, buffer);
                console.log(`[Storage FS] ⚠️ Written ${buffer.length} bytes to ${key} (${mime}) - ephemeral storage`);
                return key;
            } catch (e) {
                console.error(`[Storage FS] ❌ Write failed for ${key}:`, e);
                throw new Error('Storage upload failed');
            }
        }
    },

    async download(key) {
        if (USE_R2 && s3Client) {
            try {
                const response = await s3Client.send(new GetObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                }));

                // Convert stream to buffer
                const chunks = [];
                for await (const chunk of response.Body) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);

                console.log(`[Storage R2] ✅ Downloaded ${buffer.length} bytes from ${key}`);
                return buffer;
            } catch (e) {
                if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
                    console.error(`[Storage R2] ❌ File not found: ${key}`);
                    throw new Error('File not found');
                }
                console.error(`[Storage R2] ❌ Download failed for ${key}:`, e);
                throw new Error('Storage download failed');
            }
        } else {
            // Fallback: filesystem
            try {
                const filePath = path.join(STORAGE_ROOT, key);
                if (!fs.existsSync(filePath)) {
                    console.error(`[Storage FS] ❌ File not found: ${key}`);
                    throw new Error('File not found');
                }
                const buffer = await fs.promises.readFile(filePath);
                console.log(`[Storage FS] ✅ Read ${buffer.length} bytes from ${key}`);
                return buffer;
            } catch (e) {
                if (e.message === 'File not found') throw e;
                console.error(`[Storage FS] ❌ Read failed for ${key}:`, e);
                throw new Error('Storage download failed');
            }
        }
    },

    async delete(key) {
        if (USE_R2 && s3Client) {
            try {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME,
                    Key: key,
                }));
                console.log(`[Storage R2] ✅ Deleted ${key}`);
            } catch (e) {
                // Don't throw on delete failures - log and continue
                console.error(`[Storage R2] ⚠️ Delete failed for ${key}:`, e);
            }
        } else {
            // Fallback: filesystem
            try {
                const filePath = path.join(STORAGE_ROOT, key);
                if (fs.existsSync(filePath)) {
                    await fs.promises.unlink(filePath);
                    console.log(`[Storage FS] ✅ Deleted ${key}`);
                }
            } catch (e) {
                console.error(`[Storage FS] ⚠️ Delete failed for ${key}:`, e);
            }
        }
    }
};

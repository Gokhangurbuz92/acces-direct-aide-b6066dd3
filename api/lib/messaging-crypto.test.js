import { describe, it, expect, vi } from 'vitest';

// Mock env.js first (Vitest hoists this automatically)
vi.mock('../_utils/env.js', () => ({
    env: {
        secrets: {
            adaEncryptionKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        },
        runtime: {
            vercelEnv: 'test',
            logLevel: 'silent'
        },
        sentry: {
            release: 'test-release'
        }
    }
}));

import { encryptMessage, decryptMessage } from './messaging-crypto.js';
import crypto from 'crypto';

describe('Messaging Cryptography (`api/lib/messaging-crypto.js`)', () => {
    
    it('should encrypt generic ProMessages into the split IV/Content format required by Prisma schema', () => {
        const messageBody = "Bonjour, j'ai bien reçu votre dossier de surendettement complet.";
        const encryptedObj = encryptMessage(messageBody);
        
        expect(encryptedObj).toHaveProperty('content');
        expect(encryptedObj).toHaveProperty('iv');
        
        expect(typeof encryptedObj.content).toBe('string');
        expect(typeof encryptedObj.iv).toBe('string');
        
        // Ensure GCM IV config is preserved (12 bytes = 24 hex characters)
        expect(encryptedObj.iv.length).toBe(24);
        
        // Ensure AuthTag exists inside the content (last 32 hex chars)
        expect(encryptedObj.content.length).toBeGreaterThan(32); 
    });

    it('should successfully reverse the exact ciphertext back into plaintext given correct IV', () => {
        const messageBody = "Test ProMessage Payload 42";
        const encryptedObj = encryptMessage(messageBody);
        
        const decrypted = decryptMessage(encryptedObj.content, encryptedObj.iv);
        expect(decrypted).toBe(messageBody);
    });

    it('should fail cleanly if the IV does not perfectly match the ciphertext', () => {
        const messageBody = "Strict IV Matching Requirement";
        const encryptedObj = encryptMessage(messageBody);
        
        // Generate a random but identically-sized IV (12 bytes/24 hex chars)
        const fakeIv = crypto.randomBytes(12).toString('hex');
        
        const decrypted = decryptMessage(encryptedObj.content, fakeIv);
        expect(decrypted).toBeNull();
    });

    it('should fail cleanly if the AuthTag embedded in the ciphertext is altered', () => {
        const messageBody = "Do not trust altered ciphertexts.";
        const encryptedObj = encryptMessage(messageBody);
        
        // AuthTag is the last 32 chars of the content string. Mutate a byte safely.
        const originalContent = encryptedObj.content;
        const tamperedContent = originalContent.slice(0, -1) + (originalContent.endsWith('a') ? 'b' : 'a');
        
        const decrypted = decryptMessage(tamperedContent, encryptedObj.iv);
        expect(decrypted).toBeNull();
    });
});

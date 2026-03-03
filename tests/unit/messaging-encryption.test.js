import { describe, it, expect, beforeAll } from 'vitest';

describe('Messaging Encryption (AES-256-GCM)', () => {
    let messagingCrypto;

    beforeAll(async () => {
        // Setup environment BEFORE importing the module
        process.env.ADA_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes hex = 64 hex chars
        messagingCrypto = await import('../../api/lib/messaging-crypto.js');
    });

    it('should encrypt and decrypt a simple message without data loss', () => {
        const text = 'Bonjour, comment puis-je vous aider ?';
        const { content, iv } = messagingCrypto.encryptMessage(text);

        expect(content).toBeTruthy();
        expect(iv).toBeTruthy();
        expect(content).not.toBe(text); // Must be different from plaintext

        const decrypted = messagingCrypto.decryptMessage(content, iv);
        expect(decrypted).toBe(text);
    });

    it('should handle UTF-8 and emoji without data loss', () => {
        const text = 'Rendez-vous à 14h30 🏥 — Dossier n°42 (urgence)';
        const { content, iv } = messagingCrypto.encryptMessage(text);
        const decrypted = messagingCrypto.decryptMessage(content, iv);
        expect(decrypted).toBe(text);
    });

    it('should handle long messages (>1000 chars)', () => {
        const text = 'A'.repeat(2000);
        const { content, iv } = messagingCrypto.encryptMessage(text);
        const decrypted = messagingCrypto.decryptMessage(content, iv);
        expect(decrypted).toBe(text);
    });

    it('should produce different ciphertexts for the same message (random IV)', () => {
        const text = 'Message identique';
        const result1 = messagingCrypto.encryptMessage(text);
        const result2 = messagingCrypto.encryptMessage(text);

        // IVs must be different (random)
        expect(result1.iv).not.toBe(result2.iv);
        // Ciphertexts must be different
        expect(result1.content).not.toBe(result2.content);

        // But both must decrypt to the same plaintext
        expect(messagingCrypto.decryptMessage(result1.content, result1.iv)).toBe(text);
        expect(messagingCrypto.decryptMessage(result2.content, result2.iv)).toBe(text);
    });

    it('should return null for tampered ciphertext', () => {
        const text = 'Données sensibles';
        const { content, iv } = messagingCrypto.encryptMessage(text);

        // Tamper with the ciphertext (flip first char)
        const tampered = (content[0] === 'a' ? 'b' : 'a') + content.slice(1);
        const result = messagingCrypto.decryptMessage(tampered, iv);
        expect(result).toBeNull();
    });

    it('should return null for wrong IV', () => {
        const text = 'Test IV mismatch';
        const { content } = messagingCrypto.encryptMessage(text);
        const wrongIv = 'ff'.repeat(12); // 12 bytes = 24 hex chars

        const result = messagingCrypto.decryptMessage(content, wrongIv);
        expect(result).toBeNull();
    });

    it('should handle empty/null input gracefully', () => {
        const { content, iv } = messagingCrypto.encryptMessage('');
        expect(content).toBe('');
        expect(iv).toBe('');

        expect(messagingCrypto.decryptMessage(null, null)).toBeNull();
        expect(messagingCrypto.decryptMessage('', '')).toBeNull();
    });

    it('should handle multiline messages', () => {
        const text = 'Ligne 1\nLigne 2\nLigne 3\n\n--- Fin ---';
        const { content, iv } = messagingCrypto.encryptMessage(text);
        const decrypted = messagingCrypto.decryptMessage(content, iv);
        expect(decrypted).toBe(text);
    });
});

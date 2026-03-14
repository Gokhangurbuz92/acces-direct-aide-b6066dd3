import { vi } from "vitest";
vi.stubEnv("KV_REST_API_URL", "http://localhost");
vi.stubEnv("KV_REST_API_TOKEN", "mock-token");

import { describe, it, expect } from 'vitest';
import { encryptMessage, decryptMessage } from '../../api/lib/messaging-crypto.js';

/**
 * Vault Check — AES-256-GCM Integrity Tests
 *
 * Validates that the encryption/decryption pipeline
 * preserves integrity for all edge cases that a production
 * messaging system will encounter.
 */
describe('Vault Check — AES-256-GCM Coffre-fort', () => {
    // ── Long Messages ──
    it('should handle messages up to 10KB without corruption', () => {
        const longMessage = 'A'.repeat(10 * 1024);
        const { content, iv } = encryptMessage(longMessage);
        const decrypted = decryptMessage(content, iv);
        expect(decrypted).toBe(longMessage);
        expect(decrypted.length).toBe(10240);
    });

    it('should handle messages up to 100KB', () => {
        const veryLong = 'Bonjour le monde! '.repeat(5000); // ~90KB
        const { content, iv } = encryptMessage(veryLong);
        const decrypted = decryptMessage(content, iv);
        expect(decrypted).toBe(veryLong);
    });

    // ── Special Characters ──
    it('should preserve French accented characters', () => {
        const french = 'àâäéèêëïîôùûüÿçœæ ÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ';
        const { content, iv } = encryptMessage(french);
        expect(decryptMessage(content, iv)).toBe(french);
    });

    it('should preserve emojis and unicode symbols', () => {
        const emojis = '🇫🇷 AccesDirect 🏛️ aide 💬 message 🔐 chiffré ✅';
        const { content, iv } = encryptMessage(emojis);
        expect(decryptMessage(content, iv)).toBe(emojis);
    });

    it('should preserve Arabic, Chinese, and Cyrillic characters', () => {
        const multilingual = 'مرحبا 你好 Здравствуйте こんにちは 안녕하세요';
        const { content, iv } = encryptMessage(multilingual);
        expect(decryptMessage(content, iv)).toBe(multilingual);
    });

    it('should handle HTML content without corruption', () => {
        const html = '<p class="msg">Bonjour <strong>M. Dupont</strong> &amp; famille</p>';
        const { content, iv } = encryptMessage(html);
        expect(decryptMessage(content, iv)).toBe(html);
    });

    it('should handle JSON-like content', () => {
        const json = '{"name":"Jean","âge":35,"adresse":"12 rue de l\'Église"}';
        const { content, iv } = encryptMessage(json);
        expect(decryptMessage(content, iv)).toBe(json);
    });

    // ── Edge Cases ──
    it('should handle multiline messages with CRLF', () => {
        const multiline = 'Ligne 1\r\nLigne 2\nLigne 3\r\nFin.';
        const { content, iv } = encryptMessage(multiline);
        expect(decryptMessage(content, iv)).toBe(multiline);
    });

    it('should handle messages with null bytes', () => {
        const withNull = 'before\x00after';
        const { content, iv } = encryptMessage(withNull);
        expect(decryptMessage(content, iv)).toBe(withNull);
    });

    it('should handle single character', () => {
        const single = 'A';
        const { content, iv } = encryptMessage(single);
        expect(decryptMessage(content, iv)).toBe(single);
    });

    // ── Tamper Detection ──
    it('should reject tampered ciphertext (returns null)', () => {
        const { content, iv } = encryptMessage('Message confidentiel');
        // Flip a byte in the ciphertext
        const tampered = content.slice(0, 5) + 'X' + content.slice(6);
        expect(decryptMessage(tampered, iv)).toBeNull();
    });

    it('should reject completely wrong IV (returns null)', () => {
        const { content, iv } = encryptMessage('Message confidentiel');
        // Use a completely different IV (all zeros) — guarantees auth tag mismatch
        const wrongIv = '0'.repeat(iv.length);
        expect(decryptMessage(content, wrongIv)).toBeNull();
    });

    // ── Unique Ciphertexts ──
    it('should produce unique ciphertexts for the same plaintext (unique IVs)', () => {
        const msg = 'Rendez-vous demain à 14h';
        const result1 = encryptMessage(msg);
        const result2 = encryptMessage(msg);
        expect(result1.content).not.toBe(result2.content);
        expect(result1.iv).not.toBe(result2.iv);
        // But both decrypt to the same message
        expect(decryptMessage(result1.content, result1.iv)).toBe(msg);
        expect(decryptMessage(result2.content, result2.iv)).toBe(msg);
    });

    // ── Stress: Rapid encrypt/decrypt cycles ──
    it('should handle 100 rapid encrypt/decrypt cycles', () => {
        for (let i = 0; i < 100; i++) {
            const msg = `Message n°${i} — ${Date.now()}`;
            const { content, iv } = encryptMessage(msg);
            expect(decryptMessage(content, iv)).toBe(msg);
        }
    });
});

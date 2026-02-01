import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto.js';

describe('Crypto Library - Key Versioning', () => {
    describe('encrypt()', () => {
        it('should encrypt text with v1 version prefix', () => {
            const plaintext = 'Hello World';
            const encrypted = encrypt(plaintext);

            expect(encrypted).toBeTruthy();
            expect(encrypted.startsWith('v1:')).toBe(true);

            // Format: v1:iv:authTag:data
            const parts = encrypted.split(':');
            expect(parts.length).toBe(4);
            expect(parts[0]).toBe('v1');
        });

        it('should return null for empty input', () => {
            expect(encrypt('')).toBe(null);
            expect(encrypt(null)).toBe(null);
            expect(encrypt(undefined)).toBe(null);
        });

        it('should produce different ciphertexts for same input (random IV)', () => {
            const plaintext = 'Same text';
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);

            expect(encrypted1).not.toBe(encrypted2);
        });
    });

    describe('decrypt()', () => {
        it('should decrypt v1 versioned format', () => {
            const plaintext = 'Test message with versioning';
            const encrypted = encrypt(plaintext);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should decrypt legacy format (backward compatibility)', () => {
            // Simulate legacy encrypted data (iv:authTag:data format)
            // We encrypt with current version then strip the version prefix to simulate legacy
            const plaintext = 'Legacy data test';
            const versionedEncrypted = encrypt(plaintext);

            // Remove 'v1:' prefix to simulate legacy format
            const legacyEncrypted = versionedEncrypted.substring(3); // Remove 'v1:'

            const decrypted = decrypt(legacyEncrypted);
            expect(decrypted).toBe(plaintext);
        });

        it('should return null for empty input', () => {
            expect(decrypt('')).toBe(null);
            expect(decrypt(null)).toBe(null);
            expect(decrypt(undefined)).toBe(null);
        });

        it('should return null for invalid format', () => {
            expect(decrypt('invalid')).toBe(null);
            expect(decrypt('one:two')).toBe(null);
            expect(decrypt('too:many:colons:here:extra')).toBe(null);
        });

        it('should return null for tampered data', () => {
            const encrypted = encrypt('Original text');
            // Tamper with the data
            const parts = encrypted.split(':');
            parts[3] = parts[3].substring(0, parts[3].length - 2) + 'XX';
            const tampered = parts.join(':');

            expect(decrypt(tampered)).toBe(null);
        });

        it('should handle special characters and unicode', () => {
            const specialText = 'Special: éàü 中文 🚀 "quotes" & symbols!';
            const encrypted = encrypt(specialText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(specialText);
        });

        it('should handle long text', () => {
            const longText = 'A'.repeat(10000);
            const encrypted = encrypt(longText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(longText);
        });
    });

    describe('Backward Compatibility', () => {
        it('should decrypt both legacy and versioned formats in same session', () => {
            const plaintext1 = 'Modern versioned data';
            const plaintext2 = 'Legacy format data';

            // New versioned format
            const versioned = encrypt(plaintext1);

            // Simulate legacy format
            const versionedTemp = encrypt(plaintext2);
            const legacy = versionedTemp.substring(3); // Remove 'v1:'

            // Both should decrypt correctly
            expect(decrypt(versioned)).toBe(plaintext1);
            expect(decrypt(legacy)).toBe(plaintext2);
        });

        it('should maintain data integrity across format transitions', () => {
            const originalData = [
                'User data 1',
                'User data 2',
                'User data 3',
            ];

            // Encrypt with new versioned format
            const encryptedData = originalData.map(encrypt);

            // All should decrypt correctly
            const decryptedData = encryptedData.map(decrypt);
            expect(decryptedData).toEqual(originalData);
        });
    });

    describe('Format Validation', () => {
        it('should correctly identify versioned format (4 parts)', () => {
            const encrypted = encrypt('Test');
            const parts = encrypted.split(':');

            expect(parts.length).toBe(4);
            expect(parts[0]).toMatch(/^v\d+$/); // Matches v1, v2, etc.
        });

        it('should handle version detection for unknown versions gracefully', () => {
            // Simulate future version that doesn't exist yet
            const futureVersion = 'v99:aabbccdd:eeff0011:1234567890';
            expect(decrypt(futureVersion)).toBe(null);
        });
    });
});

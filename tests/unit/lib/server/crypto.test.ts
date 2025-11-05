import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '$lib/server/crypto';

describe('crypto', () => {
	const testSecret = 'test-secret-key-with-at-least-32-characters-for-security';

	describe('encrypt and decrypt', () => {
		it('should encrypt and decrypt simple objects', () => {
			const data = { foo: 'bar', num: 123 };
			const syncCode = '123456';

			const encrypted = encrypt(data, syncCode, testSecret);
			expect(encrypted).toBeInstanceOf(Buffer);
			expect(encrypted.length).toBeGreaterThan(0);

			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should encrypt and decrypt complex settings objects', () => {
			const data = {
				'kurosearch:localstorage-enabled': true,
				'kurosearch:theme': 'dark',
				'kurosearch:blocked-content': { tags: ['example'] },
				'kurosearch:result-columns': 4,
				'kurosearch:supertags': {
					items: [
						{
							name: 'Test Supertag',
							description: 'A test',
							tags: [{ modifier: '+', name: 'test' }]
						}
					]
				},
				'kurosearch:saved-posts': {
					posts: [{ id: 123 }, { id: 456 }]
				}
			};
			const syncCode = '999888';

			const encrypted = encrypt(data, syncCode, testSecret);
			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should produce different ciphertext for the same data with different codes', () => {
			const data = { test: 'data' };
			const code1 = '111111';
			const code2 = '222222';

			const encrypted1 = encrypt(data, code1, testSecret);
			const encrypted2 = encrypt(data, code2, testSecret);

			// Different codes should produce different ciphertext
			expect(encrypted1.equals(encrypted2)).toBe(false);
		});

		it('should produce different ciphertext on each encryption (due to random IV)', () => {
			const data = { test: 'data' };
			const syncCode = '333333';

			const encrypted1 = encrypt(data, syncCode, testSecret);
			const encrypted2 = encrypt(data, syncCode, testSecret);

			// Even with the same code, different IVs mean different ciphertext
			expect(encrypted1.equals(encrypted2)).toBe(false);

			// But both should decrypt to the same data
			expect(decrypt(encrypted1, syncCode, testSecret)).toEqual(data);
			expect(decrypt(encrypted2, syncCode, testSecret)).toEqual(data);
		});

		it('should fail to decrypt with wrong sync code', () => {
			const data = { test: 'data' };
			const correctCode = '444444';
			const wrongCode = '555555';

			const encrypted = encrypt(data, correctCode, testSecret);

			// Attempting to decrypt with wrong code should throw
			expect(() => decrypt(encrypted, wrongCode, testSecret)).toThrow();
		});

		it('should fail to decrypt tampered data', () => {
			const data = { test: 'data' };
			const syncCode = '666666';

			const encrypted = encrypt(data, syncCode, testSecret);

			// Tamper with the ciphertext (change a byte in the middle)
			const tampered = Buffer.from(encrypted);
			tampered[30] = tampered[30] ^ 0xff;

			// Attempting to decrypt tampered data should throw (auth tag verification fails)
			expect(() => decrypt(tampered, syncCode, testSecret)).toThrow();
		});

		it('should handle empty objects', () => {
			const data = {};
			const syncCode = '777777';

			const encrypted = encrypt(data, syncCode, testSecret);
			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should handle arrays', () => {
			const data = [1, 2, 3, { nested: 'value' }];
			const syncCode = '888888';

			const encrypted = encrypt(data, syncCode, testSecret);
			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should handle null values', () => {
			const data = { value: null };
			const syncCode = '999999';

			const encrypted = encrypt(data, syncCode, testSecret);
			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should handle unicode strings', () => {
			const data = {
				emoji: '🔒🔐',
				chinese: '加密',
				arabic: 'تشفير'
			};
			const syncCode = '101010';

			const encrypted = encrypt(data, syncCode, testSecret);
			const decrypted = decrypt(encrypted, syncCode, testSecret);
			expect(decrypted).toEqual(data);
		});

		it('should use temporary session secret when SYNC_ENCRYPTION_SECRET is not set', () => {
			const data = { test: 'data' };
			const syncCode = '121212';

			// Don't provide the secret parameter - should use temporary session secret
			const encrypted = encrypt(data, syncCode);
			expect(encrypted).toBeInstanceOf(Buffer);
			expect(encrypted.length).toBeGreaterThan(0);

			// Should be able to decrypt with the same session secret
			const decrypted = decrypt(encrypted, syncCode);
			expect(decrypted).toEqual(data);
		});
	});

	describe('buffer structure', () => {
		it('should have IV (12 bytes) + authTag (16 bytes) + ciphertext', () => {
			const data = { test: 'data' };
			const syncCode = '131313';

			const encrypted = encrypt(data, syncCode, testSecret);

			// Buffer should be at least 28 bytes (12 IV + 16 authTag) + some ciphertext
			expect(encrypted.length).toBeGreaterThanOrEqual(28);

			// First 12 bytes are IV
			const iv = encrypted.subarray(0, 12);
			expect(iv.length).toBe(12);

			// Next 16 bytes are authTag
			const authTag = encrypted.subarray(12, 28);
			expect(authTag.length).toBe(16);

			// Rest is ciphertext
			const ciphertext = encrypted.subarray(28);
			expect(ciphertext.length).toBeGreaterThan(0);
		});
	});
});

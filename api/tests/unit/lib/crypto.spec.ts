import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../../../src/lib/crypto.js';

describe('crypto', () => {
	const testCode = '123456';
	const testSecret = 'test-secret-must-be-at-least-32-characters-long';

	describe('encrypt', () => {
		it('should encrypt data with a code', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
			expect(encrypted.length).toBeGreaterThan(0);
		});

		it('should produce different ciphertext for same data (random IV)', () => {
			const data = { test: 'data' };
			const encrypted1 = encrypt(data, testCode, testSecret);
			const encrypted2 = encrypt(data, testCode, testSecret);

			expect(encrypted1.toString('hex')).not.toBe(encrypted2.toString('hex'));
		});

		it('should encrypt strings', () => {
			const data = 'test string';
			const encrypted = encrypt(data, testCode, testSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
		});

		it('should encrypt arrays', () => {
			const data = [1, 2, 3, 'four'];
			const encrypted = encrypt(data, testCode, testSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
		});

		it('should encrypt nested objects', () => {
			const data = {
				level1: {
					level2: {
						value: 'deep'
					}
				}
			};
			const encrypted = encrypt(data, testCode, testSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
		});

		it('should encrypt empty data', () => {
			const data = {};
			const encrypted = encrypt(data, testCode, testSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
		});

		it('should produce buffer with correct structure', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			// Buffer should contain: [IV 12 bytes][AuthTag 16 bytes][Encrypted data]
			expect(encrypted.length).toBeGreaterThanOrEqual(28); // 12 + 16 minimum
		});
	});

	describe('decrypt', () => {
		it('should decrypt encrypted data', () => {
			const original = { test: 'data', number: 42 };
			const encrypted = encrypt(original, testCode, testSecret);
			const decrypted = decrypt(encrypted, testCode, testSecret);

			expect(decrypted).toEqual(original);
		});

		it('should decrypt string data', () => {
			const original = 'test string';
			const encrypted = encrypt(original, testCode, testSecret);
			const decrypted = decrypt(encrypted, testCode, testSecret);

			expect(decrypted).toBe(original);
		});

		it('should decrypt array data', () => {
			const original = [1, 2, 3, 'four', { nested: true }];
			const encrypted = encrypt(original, testCode, testSecret);
			const decrypted = decrypt(encrypted, testCode, testSecret);

			expect(decrypted).toEqual(original);
		});

		it('should fail with wrong code', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			expect(() => decrypt(encrypted, '654321', testSecret)).toThrow();
		});

		it('should fail with tampered ciphertext', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			// Tamper with the encrypted data
			encrypted[encrypted.length - 1] ^= 0xff;

			expect(() => decrypt(encrypted, testCode, testSecret)).toThrow();
		});

		it('should fail with tampered IV', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			// Tamper with the IV (first 12 bytes)
			encrypted[0] ^= 0xff;

			expect(() => decrypt(encrypted, testCode, testSecret)).toThrow();
		});

		it('should fail with tampered auth tag', () => {
			const data = { test: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			// Tamper with the auth tag (bytes 12-27)
			encrypted[15] ^= 0xff;

			expect(() => decrypt(encrypted, testCode, testSecret)).toThrow();
		});

		it('should fail with invalid buffer (too short)', () => {
			const tooShort = Buffer.alloc(27); // Less than minimum 28 bytes

			expect(() => decrypt(tooShort, testCode, testSecret)).toThrow();
		});

		it('should decrypt empty object', () => {
			const original = {};
			const encrypted = encrypt(original, testCode, testSecret);
			const decrypted = decrypt(encrypted, testCode, testSecret);

			expect(decrypted).toEqual(original);
		});
	});

	describe('round-trip', () => {
		it('should handle encrypt -> decrypt round-trip', () => {
			const testCases = [
				{ simple: 'object' },
				{ number: 42, string: 'test', boolean: true },
				{ nested: { deep: { value: 'here' } } },
				[1, 2, 3],
				['string', 'array'],
				'plain string',
				42,
				true,
				null,
				{ empty: {} },
				{ array: [{ nested: 'value' }] }
			];

			for (const testCase of testCases) {
				const encrypted = encrypt(testCase, testCode, testSecret);
				const decrypted = decrypt(encrypted, testCode, testSecret);
				expect(decrypted).toEqual(testCase);
			}
		});

		it('should handle multiple encryptions with same code', () => {
			const data = { test: 'data' };
			const code = '999999';

			const encrypted1 = encrypt(data, code, testSecret);
			const encrypted2 = encrypt(data, code, testSecret);

			const decrypted1 = decrypt(encrypted1, code, testSecret);
			const decrypted2 = decrypt(encrypted2, code, testSecret);

			expect(decrypted1).toEqual(data);
			expect(decrypted2).toEqual(data);
		});

		it('should handle different codes for same data', () => {
			const data = { test: 'data' };
			const code1 = '111111';
			const code2 = '222222';

			const encrypted1 = encrypt(data, code1, testSecret);
			const encrypted2 = encrypt(data, code2, testSecret);

			const decrypted1 = decrypt(encrypted1, code1, testSecret);
			const decrypted2 = decrypt(encrypted2, code2, testSecret);

			expect(decrypted1).toEqual(data);
			expect(decrypted2).toEqual(data);

			// Should fail with wrong code
			expect(() => decrypt(encrypted1, code2, testSecret)).toThrow();
			expect(() => decrypt(encrypted2, code1, testSecret)).toThrow();
		});

		it('should maintain data integrity with large objects', () => {
			const largeData = {
				posts: Array.from({ length: 100 }, (_, i) => ({
					id: i,
					title: `Post ${i}`,
					content: 'A'.repeat(100),
					tags: ['tag1', 'tag2', 'tag3']
				}))
			};

			const encrypted = encrypt(largeData, testCode, testSecret);
			const decrypted = decrypt(encrypted, testCode, testSecret);

			expect(decrypted).toEqual(largeData);
		});
	});

	describe('security', () => {
		it('should use different IVs for each encryption', () => {
			const data = { test: 'data' };
			const code = '123456';

			const encrypted1 = encrypt(data, code, testSecret);
			const encrypted2 = encrypt(data, code, testSecret);

			// Extract IVs (first 12 bytes)
			const iv1 = encrypted1.subarray(0, 12);
			const iv2 = encrypted2.subarray(0, 12);

			expect(iv1.toString('hex')).not.toBe(iv2.toString('hex'));
		});

		it('should produce different auth tags for different data', () => {
			const data1 = { test: 'data1' };
			const data2 = { test: 'data2' };
			const code = '123456';

			const encrypted1 = encrypt(data1, code, testSecret);
			const encrypted2 = encrypt(data2, code, testSecret);

			// Extract auth tags (bytes 12-27)
			const tag1 = encrypted1.subarray(12, 28);
			const tag2 = encrypted2.subarray(12, 28);

			expect(tag1.toString('hex')).not.toBe(tag2.toString('hex'));
		});

		it('should validate auth tag during decryption', () => {
			const data = { secret: 'data' };
			const encrypted = encrypt(data, testCode, testSecret);

			// Modify encrypted data but not auth tag
			const dataStart = 28;
			encrypted[dataStart] ^= 0xff;

			// Should fail because auth tag won't match
			expect(() => decrypt(encrypted, testCode, testSecret)).toThrow();
		});
	});
});

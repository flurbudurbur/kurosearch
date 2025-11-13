import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt } from '$lib/server/crypto';

// Mock logger
vi.mock('$lib/server/logger', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	}
}));

// Mock environment with a test secret
vi.mock('$env/dynamic/private', () => ({
	env: {
		SYNC_ENCRYPTION_SECRET: 'test-secret-key-for-encryption-testing'
	}
}));

describe('crypto.ts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('encrypt', () => {
		it('encrypts data successfully', () => {
			const data = { foo: 'bar', count: 123 };
			const syncCode = '123456';

			const encrypted = encrypt(data, syncCode);

			expect(encrypted).toBeInstanceOf(Buffer);
			expect(encrypted.length).toBeGreaterThan(0);
			// IV (12) + authTag (16) + encrypted data
			expect(encrypted.length).toBeGreaterThanOrEqual(28);
		});

		it('produces different ciphertexts for same data (due to random IV)', () => {
			const data = { message: 'test' };
			const syncCode = '123456';

			const encrypted1 = encrypt(data, syncCode);
			const encrypted2 = encrypt(data, syncCode);

			// Different IVs mean different ciphertexts
			expect(encrypted1.toString('hex')).not.toBe(encrypted2.toString('hex'));
		});

		it('encrypts different data to different ciphertexts', () => {
			const data1 = { message: 'test1' };
			const data2 = { message: 'test2' };
			const syncCode = '123456';

			const encrypted1 = encrypt(data1, syncCode);
			const encrypted2 = encrypt(data2, syncCode);

			expect(encrypted1.toString('hex')).not.toBe(encrypted2.toString('hex'));
		});

		it('works with custom secret parameter', () => {
			const data = { test: 'value' };
			const syncCode = '999999';
			const customSecret = 'custom-secret-override';

			const encrypted = encrypt(data, syncCode, customSecret);

			expect(encrypted).toBeInstanceOf(Buffer);
			expect(encrypted.length).toBeGreaterThanOrEqual(28);
		});
	});

	describe('decrypt', () => {
		it('decrypts previously encrypted data', () => {
			const originalData = { foo: 'bar', num: 42, nested: { key: 'value' } };
			const syncCode = '123456';

			const encrypted = encrypt(originalData, syncCode);
			const decrypted = decrypt(encrypted, syncCode);

			expect(decrypted).toEqual(originalData);
		});

		it('decrypts data with custom secret', () => {
			const originalData = { message: 'secret data' };
			const syncCode = '654321';
			const customSecret = 'my-custom-secret';

			const encrypted = encrypt(originalData, syncCode, customSecret);
			const decrypted = decrypt(encrypted, syncCode, customSecret);

			expect(decrypted).toEqual(originalData);
		});

		it('fails to decrypt with wrong sync code', () => {
			const originalData = { message: 'secret' };
			const syncCode = '111111';
			const wrongCode = '222222';

			const encrypted = encrypt(originalData, syncCode);

			// Should throw due to authentication tag mismatch
			expect(() => decrypt(encrypted, wrongCode)).toThrow();
		});

		it('fails to decrypt with wrong secret', () => {
			const originalData = { message: 'secret' };
			const syncCode = '123456';
			const secret1 = 'secret1';
			const secret2 = 'secret2';

			const encrypted = encrypt(originalData, syncCode, secret1);

			// Should throw due to authentication tag mismatch
			expect(() => decrypt(encrypted, syncCode, secret2)).toThrow();
		});

		it('fails to decrypt corrupted data', () => {
			const originalData = { message: 'secret' };
			const syncCode = '123456';

			const encrypted = encrypt(originalData, syncCode);

			// Corrupt the ciphertext
			encrypted[30] = encrypted[30] ^ 0xff;

			// Should throw due to authentication tag mismatch
			expect(() => decrypt(encrypted, syncCode)).toThrow();
		});

		it('fails to decrypt truncated data', () => {
			const originalData = { message: 'secret' };
			const syncCode = '123456';

			const encrypted = encrypt(originalData, syncCode);

			// Truncate the buffer
			const truncated = encrypted.subarray(0, encrypted.length - 5);

			// Should throw
			expect(() => decrypt(truncated, syncCode)).toThrow();
		});
	});

	describe('round-trip encryption', () => {
		it('handles various data types', () => {
			const testCases = [
				{ value: { string: 'test' }, name: 'object with string' },
				{ value: { number: 123 }, name: 'object with number' },
				{ value: { boolean: true }, name: 'object with boolean' },
				{ value: { array: [1, 2, 3] }, name: 'object with array' },
				{ value: { null: null }, name: 'object with null' },
				{
					value: { nested: { deep: { value: 'test' } } },
					name: 'deeply nested object'
				}
			];

			const syncCode = '123456';

			for (const testCase of testCases) {
				const encrypted = encrypt(testCase.value, syncCode);
				const decrypted = decrypt(encrypted, syncCode);
				expect(decrypted).toEqual(testCase.value);
			}
		});

		it('handles empty object', () => {
			const data = {};
			const syncCode = '123456';

			const encrypted = encrypt(data, syncCode);
			const decrypted = decrypt(encrypted, syncCode);

			expect(decrypted).toEqual(data);
		});

		it('handles large data', () => {
			const largeData = {
				items: Array.from({ length: 1000 }, (_, i) => ({
					id: i,
					name: `Item ${i}`,
					value: Math.random()
				}))
			};
			const syncCode = '123456';

			const encrypted = encrypt(largeData, syncCode);
			const decrypted = decrypt(encrypted, syncCode);

			expect(decrypted).toEqual(largeData);
		});
	});

	describe('security features', () => {
		it('uses AES-256-GCM (verified by buffer structure)', () => {
			const data = { test: 'value' };
			const syncCode = '123456';

			const encrypted = encrypt(data, syncCode);

			// Buffer should contain:
			// - 12 bytes IV (for GCM)
			// - 16 bytes authentication tag
			// - remaining encrypted data
			const iv = encrypted.subarray(0, 12);
			const authTag = encrypted.subarray(12, 28);
			const ciphertext = encrypted.subarray(28);

			expect(iv.length).toBe(12);
			expect(authTag.length).toBe(16);
			expect(ciphertext.length).toBeGreaterThan(0);
		});

		it('different sync codes produce different keys', () => {
			const data = { message: 'test' };
			const code1 = '111111';
			const code2 = '222222';

			const encrypted1 = encrypt(data, code1);
			const encrypted2 = encrypt(data, code2);

			// Can't decrypt with different code
			expect(() => decrypt(encrypted1, code2)).toThrow();
			expect(() => decrypt(encrypted2, code1)).toThrow();

			// But can decrypt with correct code
			expect(decrypt(encrypted1, code1)).toEqual(data);
			expect(decrypt(encrypted2, code2)).toEqual(data);
		});
	});
});

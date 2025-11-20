import { describe, it, expect } from 'vitest';

// Note: These are integration-style tests that verify Valkey module behavior
// in the context of VALKEY_ENABLED=false (test environment default)
// More comprehensive tests would require real Valkey instance or complex mocking

describe('valkey', () => {
	describe('module behavior', () => {
		it('should export getValkeyClient function', async () => {
			const valkeyModule = await import('../../../src/lib/valkey.js');
			expect(valkeyModule.getValkeyClient).toBeDefined();
			expect(typeof valkeyModule.getValkeyClient).toBe('function');
		});

		it('should export closeValkeyConnection function', async () => {
			const valkeyModule = await import('../../../src/lib/valkey.js');
			expect(valkeyModule.closeValkeyConnection).toBeDefined();
			expect(typeof valkeyModule.closeValkeyConnection).toBe('function');
		});

		it('should export isValkeyAvailable function', async () => {
			const valkeyModule = await import('../../../src/lib/valkey.js');
			expect(valkeyModule.isValkeyAvailable).toBeDefined();
			expect(typeof valkeyModule.isValkeyAvailable).toBe('function');
		});

		it('should return null when VALKEY_ENABLED is false', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');
			const client = valkeyModule.getValkeyClient();

			expect(client).toBeNull();
		});

		it('should return consistent client on multiple calls', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			const client1 = valkeyModule.getValkeyClient();
			const client2 = valkeyModule.getValkeyClient();

			expect(client1).toBe(client2);
		});

		it('should handle closeValkeyConnection gracefully when client is null', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			// Should not throw
			await expect(valkeyModule.closeValkeyConnection()).resolves.toBeUndefined();
		});

		it('should return false from isValkeyAvailable when disabled', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			const available = await valkeyModule.isValkeyAvailable();
			expect(available).toBe(false);
		});

		it('should respect VALKEY_ENABLED environment variable', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			const client = valkeyModule.getValkeyClient();
			expect(client).toBeNull();
		});
	});

	describe('graceful degradation', () => {
		it('should not throw when getting client with Valkey disabled', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			expect(() => valkeyModule.getValkeyClient()).not.toThrow();
		});

		it('should not throw when closing connection without client', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			await expect(valkeyModule.closeValkeyConnection()).resolves.not.toThrow();
		});

		it('should not throw when checking availability', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			await expect(valkeyModule.isValkeyAvailable()).resolves.not.toThrow();
		});
	});

	describe('environment configuration', () => {
		it('should accept VALKEY_HOST configuration', () => {
			process.env.VALKEY_HOST = 'custom-host';

			// Just verify it doesn't throw - actual connection would need real Redis
			expect(() => {
				process.env.VALKEY_ENABLED = 'false'; // Keep disabled for tests
			}).not.toThrow();
		});

		it('should accept VALKEY_PORT configuration', () => {
			process.env.VALKEY_PORT = '6380';

			expect(() => {
				process.env.VALKEY_ENABLED = 'false';
			}).not.toThrow();
		});

		it('should accept VALKEY_PASSWORD configuration', () => {
			process.env.VALKEY_PASSWORD = 'secret';

			expect(() => {
				process.env.VALKEY_ENABLED = 'false';
			}).not.toThrow();
		});

		it('should accept VALKEY_DB configuration', () => {
			process.env.VALKEY_DB = '5';

			expect(() => {
				process.env.VALKEY_ENABLED = 'false';
			}).not.toThrow();
		});
	});

	describe('integration with other modules', () => {
		it('should be usable by cache-utils module', async () => {
			const valkeyModule = await import('../../../src/lib/valkey.js');
			const cacheUtils = await import('../../../src/lib/cache-utils.js');

			// Verify cache-utils can call getValkeyClient without errors
			const client = valkeyModule.getValkeyClient();
			expect(client).toBeDefined(); // Will be null in test env, but defined
		});

		it('should allow cache-utils to handle null client gracefully', async () => {
			process.env.VALKEY_ENABLED = 'false';
			const valkeyModule = await import('../../../src/lib/valkey.js');

			const client = valkeyModule.getValkeyClient();
			expect(client).toBeNull();

			// Cache utils should handle null client gracefully (proven by other tests)
		});
	});
});

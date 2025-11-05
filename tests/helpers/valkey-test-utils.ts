/**
 * Valkey Test Utilities
 *
 * Helpers for testing with Valkey cache in unit and integration tests
 */

import { getValkeyClient } from '$lib/server/valkey';
import { compress } from '$lib/server/compression';

/**
 * Clear all keys matching a pattern from Valkey
 * Useful for cleaning up between tests
 *
 * @param pattern - Glob pattern for keys to delete (default: 'kurosearch:*')
 * @returns Number of keys deleted
 */
export async function clearValkeyCache(pattern: string = 'kurosearch:*'): Promise<number> {
	const client = getValkeyClient();

	if (!client) {
		console.warn('[Test] Valkey client not available, skipping cache clear');
		return 0;
	}

	try {
		const keys = await client.keys(pattern);

		if (keys.length === 0) {
			return 0;
		}

		await client.del(...keys);
		return keys.length;
	} catch (error) {
		console.error('[Test] Error clearing Valkey cache:', error);
		return 0;
	}
}

/**
 * Seed cache with test data
 * Useful for testing cache hit scenarios
 *
 * @param key - Cache key
 * @param data - Data to store (will be JSON stringified and compressed)
 * @param ttl - Time to live in seconds
 */
export async function seedCache(key: string, data: any, ttl: number): Promise<boolean> {
	const client = getValkeyClient();

	if (!client) {
		console.warn('[Test] Valkey client not available, skipping cache seed');
		return false;
	}

	try {
		const json = JSON.stringify(data);
		const compressed = compress(json);
		const base64 = compressed.toString('base64');

		await client.setex(key, ttl, base64);
		return true;
	} catch (error) {
		console.error('[Test] Error seeding cache:', error);
		return false;
	}
}

/**
 * Get cached data from Valkey
 * Useful for verifying cache contents
 *
 * @param key - Cache key
 * @returns Cached data or null if not found
 */
export async function getCacheContents(key: string): Promise<any | null> {
	const client = getValkeyClient();

	if (!client) {
		console.warn('[Test] Valkey client not available');
		return null;
	}

	try {
		const cached = await client.get(key);

		if (!cached) {
			return null;
		}

		// Data is stored as compressed base64
		const { decompress } = await import('$lib/server/compression');
		const buffer = Buffer.from(cached, 'base64');
		const decompressed = decompress(buffer);

		return JSON.parse(decompressed);
	} catch (error) {
		console.error('[Test] Error getting cache contents:', error);
		return null;
	}
}

/**
 * Wait for cache to expire
 * Useful for testing TTL behavior
 *
 * @param ms - Milliseconds to wait
 */
export async function waitForCacheExpiry(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a key exists in cache
 *
 * @param key - Cache key
 * @returns true if key exists
 */
export async function cacheKeyExists(key: string): Promise<boolean> {
	const client = getValkeyClient();

	if (!client) {
		return false;
	}

	try {
		const exists = await client.exists(key);
		return exists === 1;
	} catch (error) {
		console.error('[Test] Error checking key existence:', error);
		return false;
	}
}

/**
 * Get TTL (time to live) for a cache key
 *
 * @param key - Cache key
 * @returns TTL in seconds, or -1 if key doesn't exist, -2 if key has no expiry
 */
export async function getCacheTTL(key: string): Promise<number> {
	const client = getValkeyClient();

	if (!client) {
		return -1;
	}

	try {
		return await client.ttl(key);
	} catch (error) {
		console.error('[Test] Error getting TTL:', error);
		return -1;
	}
}

/**
 * Mock Valkey client for unit tests
 * Returns a simple in-memory mock that implements basic Redis commands
 */
export function createMockValkeyClient() {
	const store = new Map<string, { value: string; expiresAt?: number }>();

	const mockClient = {
		get: async (key: string) => {
			const item = store.get(key);
			if (!item) return null;

			// Check if expired
			if (item.expiresAt && Date.now() > item.expiresAt) {
				store.delete(key);
				return null;
			}

			return item.value;
		},

		setex: async (key: string, ttl: number, value: string) => {
			store.set(key, {
				value,
				expiresAt: Date.now() + ttl * 1000
			});
			return 'OK';
		},

		del: async (...keys: string[]) => {
			let deleted = 0;
			for (const key of keys) {
				if (store.delete(key)) deleted++;
			}
			return deleted;
		},

		keys: async (pattern: string) => {
			// Simple pattern matching (only supports * wildcard)
			const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
			return Array.from(store.keys()).filter((key) => regex.test(key));
		},

		exists: async (key: string) => {
			return store.has(key) ? 1 : 0;
		},

		ttl: async (key: string) => {
			const item = store.get(key);
			if (!item) return -2;
			if (!item.expiresAt) return -1;

			const ttl = Math.floor((item.expiresAt - Date.now()) / 1000);
			return ttl > 0 ? ttl : -2;
		},

		getdel: async (key: string) => {
			const value = await mockClient.get(key);
			if (value) {
				store.delete(key);
			}
			return value;
		},

		ping: async () => 'PONG',

		disconnect: async () => {},

		on: () => mockClient,

		// Helper for tests
		__clear: () => store.clear(),
		__size: () => store.size
	};

	return mockClient;
}

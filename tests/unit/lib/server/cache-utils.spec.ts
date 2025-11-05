import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getCacheKey,
	getFromCache,
	setInCache,
	withCache,
	invalidateCache,
	invalidateCachePattern,
	CacheKeys,
	CACHE_TTL
} from '$lib/server/cache-utils';
import * as valkeyModule from '$lib/server/valkey';
import * as compressionModule from '$lib/server/compression';
import { createMockValkeyClient } from '../../../helpers/valkey-test-utils';

// Mock modules
vi.mock('$lib/server/valkey');
vi.mock('$lib/server/compression');

describe('cache-utils', () => {
	let mockClient: ReturnType<typeof createMockValkeyClient>;

	beforeEach(() => {
		mockClient = createMockValkeyClient();
		vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(mockClient as any);

		// Mock compression functions
		vi.spyOn(compressionModule, 'compress').mockImplementation((data: string) => {
			return Buffer.from(data, 'utf-8');
		});
		vi.spyOn(compressionModule, 'decompress').mockImplementation((buffer: Buffer) => {
			return buffer.toString('utf-8');
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
		mockClient.__clear();
	});

	describe('getCacheKey', () => {
		it('should generate cache key with prefix', () => {
			const key = getCacheKey('test:', 'foo', 'bar');
			expect(key).toBe('test:foo:bar');
		});

		it('should handle numbers in key parts', () => {
			const key = getCacheKey('test:', 123, 'bar', 456);
			expect(key).toBe('test:123:bar:456');
		});

		it('should handle single part', () => {
			const key = getCacheKey('test:', 'single');
			expect(key).toBe('test:single');
		});
	});

	describe('Cache Keys convenience generators', () => {
		it('should generate posts cache key', () => {
			const key = CacheKeys.posts('page=1', 'limit=10');
			expect(key).toBe('kurosearch:posts:page=1:limit=10');
		});

		it('should generate tags cache key', () => {
			const key = CacheKeys.tags('autocomplete', 'cat');
			expect(key).toBe('kurosearch:tags:autocomplete:cat');
		});
	});

	describe('getFromCache', () => {
		it('should return cache hit with data', async () => {
			const testData = { foo: 'bar' };
			const compressed = Buffer.from(JSON.stringify(testData), 'utf-8');
			const base64 = compressed.toString('base64');

			await mockClient.setex('test:key', 60, base64);

			const result = await getFromCache('test:key');

			expect(result.hit).toBe(true);
			expect(result.data).toEqual(testData);
		});

		it('should return cache miss when key does not exist', async () => {
			const result = await getFromCache('nonexistent:key');

			expect(result.hit).toBe(false);
			expect(result.data).toBeUndefined();
		});

		it('should return cache miss when client is null', async () => {
			vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(null);

			const result = await getFromCache('test:key');

			expect(result.hit).toBe(false);
			expect(result.data).toBeUndefined();
		});

		it('should handle errors gracefully', async () => {
			vi.spyOn(mockClient, 'get').mockRejectedValue(new Error('Redis error'));

			const result = await getFromCache('test:key');

			expect(result.hit).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should decompress cached data', async () => {
			const testData = { foo: 'bar', nested: { value: 123 } };
			const json = JSON.stringify(testData);
			const compressed = Buffer.from(json, 'utf-8');
			const base64 = compressed.toString('base64');

			await mockClient.setex('test:key', 60, base64);

			const result = await getFromCache('test:key');

			expect(result.hit).toBe(true);
			expect(result.data).toEqual(testData);
			expect(compressionModule.decompress).toHaveBeenCalled();
		});
	});

	describe('setInCache', () => {
		it('should store data with TTL', async () => {
			const testData = { foo: 'bar' };

			const result = await setInCache('test:key', testData, 300);

			expect(result.success).toBe(true);
			expect(mockClient.__size()).toBe(1);

			const cached = await mockClient.get('test:key');
			expect(cached).toBeDefined();
		});

		it('should compress data before storing', async () => {
			const testData = { foo: 'bar', large: 'x'.repeat(1000) };

			await setInCache('test:key', testData, 300);

			expect(compressionModule.compress).toHaveBeenCalledWith(JSON.stringify(testData));
		});

		it('should return failure when client is null', async () => {
			vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(null);

			const result = await setInCache('test:key', { foo: 'bar' }, 300);

			expect(result.success).toBe(false);
		});

		it('should handle errors gracefully', async () => {
			vi.spyOn(mockClient, 'setex').mockRejectedValue(new Error('Redis error'));

			const result = await setInCache('test:key', { foo: 'bar' }, 300);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it('should store data as base64 encoded string', async () => {
			const testData = { foo: 'bar' };

			await setInCache('test:key', testData, 300);

			const cached = await mockClient.get('test:key');
			expect(cached).toBeTruthy();
			// Should be base64 encoded
			expect(cached).toMatch(/^[A-Za-z0-9+/=]+$/);
		});
	});

	describe('withCache', () => {
		it('should return cached data on cache hit', async () => {
			const testData = { foo: 'bar' };
			const compressed = Buffer.from(JSON.stringify(testData), 'utf-8');
			const base64 = compressed.toString('base64');

			await mockClient.setex('test:key', 60, base64);

			const fetchFn = vi.fn().mockResolvedValue({ baz: 'qux' });

			const result = await withCache('test:key', { ttl: 300, prefix: 'test:' }, fetchFn);

			expect(result.data).toEqual(testData);
			expect(result.cached).toBe(true);
			expect(fetchFn).not.toHaveBeenCalled();
		});

		it('should fetch and cache on cache miss', async () => {
			const testData = { foo: 'bar' };
			const fetchFn = vi.fn().mockResolvedValue(testData);

			const result = await withCache('test:key', { ttl: 300, prefix: 'test:' }, fetchFn);

			expect(result.data).toEqual(testData);
			expect(result.cached).toBe(false);
			expect(fetchFn).toHaveBeenCalledOnce();

			// Verify data was stored
			const cached = await mockClient.get('test:key');
			expect(cached).toBeDefined();
		});

		it('should not block response if cache storage fails', async () => {
			const testData = { foo: 'bar' };
			const fetchFn = vi.fn().mockResolvedValue(testData);

			// Make setInCache fail
			vi.spyOn(mockClient, 'setex').mockRejectedValue(new Error('Storage error'));

			const result = await withCache('test:key', { ttl: 300, prefix: 'test:' }, fetchFn);

			// Should still return data despite storage failure
			expect(result.data).toEqual(testData);
			expect(result.cached).toBe(false);
		});
	});

	describe('invalidateCache', () => {
		it('should delete a single key', async () => {
			await mockClient.setex('test:key', 60, 'value');

			const result = await invalidateCache('test:key');

			expect(result).toBe(true);
			expect(await mockClient.exists('test:key')).toBe(0);
		});

		it('should return false when client is null', async () => {
			vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(null);

			const result = await invalidateCache('test:key');

			expect(result).toBe(false);
		});

		it('should handle errors gracefully', async () => {
			vi.spyOn(mockClient, 'del').mockRejectedValue(new Error('Delete error'));

			const result = await invalidateCache('test:key');

			expect(result).toBe(false);
		});
	});

	describe('invalidateCachePattern', () => {
		it('should delete multiple keys matching pattern', async () => {
			// Start fresh
			mockClient.__clear();

			await mockClient.setex('test:key1', 60, 'value1');
			await mockClient.setex('test:key2', 60, 'value2');
			await mockClient.setex('other:key', 60, 'value3');

			expect(mockClient.__size()).toBe(3); // Verify we have 3 keys

			const result = await invalidateCachePattern('test:*');

			expect(result).toBe(2); // Should delete exactly 2 keys

			// Verify specific keys were deleted
			expect(await mockClient.get('test:key1')).toBeNull();
			expect(await mockClient.get('test:key2')).toBeNull();
			expect(await mockClient.get('other:key')).toBeTruthy();
		});

		it('should return 0 when no keys match', async () => {
			const result = await invalidateCachePattern('nonexistent:*');

			expect(result).toBe(0);
		});

		it('should return 0 when client is null', async () => {
			vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(null);

			const result = await invalidateCachePattern('test:*');

			expect(result).toBe(0);
		});

		it('should handle errors gracefully', async () => {
			vi.spyOn(mockClient, 'keys').mockRejectedValue(new Error('Keys error'));

			const result = await invalidateCachePattern('test:*');

			expect(result).toBe(0);
		});
	});

	describe('CACHE_TTL constants', () => {
		it('should have correct TTL values', () => {
			expect(CACHE_TTL.POSTS).toBe(300); // 5 minutes
			expect(CACHE_TTL.TAGS).toBe(3600); // 1 hour
		});
	});

	describe('Edge cases', () => {
		it('should handle empty data', async () => {
			const result = await setInCache('test:key', {}, 300);
			expect(result.success).toBe(true);

			const cached = await getFromCache('test:key');
			expect(cached.hit).toBe(true);
			expect(cached.data).toEqual({});
		});

		it('should handle null data', async () => {
			const result = await setInCache('test:key', null, 300);
			expect(result.success).toBe(true);

			const cached = await getFromCache('test:key');
			expect(cached.hit).toBe(true);
			expect(cached.data).toBeNull();
		});

		it('should handle arrays', async () => {
			const testData = [1, 2, 3, 4, 5];
			const result = await setInCache('test:key', testData, 300);
			expect(result.success).toBe(true);

			const cached = await getFromCache('test:key');
			expect(cached.hit).toBe(true);
			expect(cached.data).toEqual(testData);
		});

		it('should handle complex nested objects', async () => {
			const testData = {
				user: {
					id: 1,
					name: 'Test',
					tags: ['a', 'b', 'c'],
					metadata: {
						created: '2025-01-01',
						nested: {
							deep: true
						}
					}
				}
			};

			await setInCache('test:key', testData, 300);
			const cached = await getFromCache('test:key');

			expect(cached.data).toEqual(testData);
		});
	});
});

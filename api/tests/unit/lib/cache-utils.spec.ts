import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockValkey, mockValkeyModule } from '../../fixtures/valkey-mock.js';

describe('cache-utils', () => {
	let mockValkey: ReturnType<typeof createMockValkey>;
	let cacheUtils: any;
	let mockLogger: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		// Create fresh mock Valkey
		mockValkey = createMockValkey();
		mockValkeyModule(mockValkey);

		// Import cache-utils with mocked Valkey
		cacheUtils = await import('../../../src/lib/cache-utils.js');

		// Create mock logger
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		};
	});

	afterEach(() => {
		mockValkey._clear();
	});

	describe('getCacheKey', () => {
		it('should generate cache key with prefix and parts', () => {
			const key = cacheUtils.getCacheKey('kurosearch:posts:', 'tags', 'test', 'limit', 10);

			expect(key).toBe('kurosearch:posts:tags:test:limit:10');
		});

		it('should handle single part', () => {
			const key = cacheUtils.getCacheKey('prefix:', 'single');

			expect(key).toBe('prefix:single');
		});

		it('should handle no parts', () => {
			const key = cacheUtils.getCacheKey('prefix:');

			expect(key).toBe('prefix:');
		});

		it('should handle numeric parts', () => {
			const key = cacheUtils.getCacheKey('prefix:', 123, 456);

			expect(key).toBe('prefix:123:456');
		});

		it('should handle mixed types', () => {
			const key = cacheUtils.getCacheKey('prefix:', 'str', 42, 'another');

			expect(key).toBe('prefix:str:42:another');
		});
	});

	describe('CacheKeys', () => {
		it('should generate posts cache key', () => {
			const key = cacheUtils.CacheKeys.posts('tags', 'test');

			expect(key).toBe('kurosearch:posts:tags:test');
		});

		it('should generate comments cache key', () => {
			const key = cacheUtils.CacheKeys.comments('post_id', 123456);

			expect(key).toBe('kurosearch:comments:post_id:123456');
		});

		it('should generate tags cache key', () => {
			const key = cacheUtils.CacheKeys.tags('autocomplete', 'query');

			expect(key).toBe('kurosearch:tags:autocomplete:query');
		});
	});

	describe('getFromCache', () => {
		it('should return cache miss when key does not exist', async () => {
			const result = await cacheUtils.getFromCache('nonexistent-key');

			expect(result.hit).toBe(false);
			expect(result.data).toBeUndefined();
		});

		it('should return cached data on hit', async () => {
			const testData = { test: 'value', number: 42 };
			const key = 'test-key';

			// Manually store compressed data
			const compressed = (await import('../../../src/lib/compression.js')).compress(
				JSON.stringify(testData)
			);
			await mockValkey.set(key, compressed.toString('base64'));

			const result = await cacheUtils.getFromCache(key);

			expect(result.hit).toBe(true);
			expect(result.data).toEqual(testData);
		});

		it('should handle JSON objects', async () => {
			const testData = { nested: { value: 'deep' }, array: [1, 2, 3] };
			const key = 'json-key';

			const compressed = (await import('../../../src/lib/compression.js')).compress(
				JSON.stringify(testData)
			);
			await mockValkey.set(key, compressed.toString('base64'));

			const result = await cacheUtils.getFromCache(key);

			expect(result.hit).toBe(true);
			expect(result.data).toEqual(testData);
		});

		it('should handle arrays', async () => {
			const testData = [1, 2, 3, 'four'];
			const key = 'array-key';

			const compressed = (await import('../../../src/lib/compression.js')).compress(
				JSON.stringify(testData)
			);
			await mockValkey.set(key, compressed.toString('base64'));

			const result = await cacheUtils.getFromCache(key);

			expect(result.hit).toBe(true);
			expect(result.data).toEqual(testData);
		});

		it('should log error on cache get failure', async () => {
			mockValkey.get.mockRejectedValueOnce(new Error('Connection error'));

			const result = await cacheUtils.getFromCache('test-key', mockLogger);

			expect(result.hit).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should handle expired keys', async () => {
			const testData = { test: 'value' };
			const key = 'expired-key';

			const compressed = (await import('../../../src/lib/compression.js')).compress(
				JSON.stringify(testData)
			);
			await mockValkey.setex(key, -1, compressed.toString('base64')); // Already expired

			const result = await cacheUtils.getFromCache(key);

			expect(result.hit).toBe(false);
		});
	});

	describe('setInCache', () => {
		it('should store data in cache with TTL', async () => {
			const testData = { test: 'value', number: 42 };
			const key = 'test-key';
			const ttl = 300;

			const result = await cacheUtils.setInCache(key, testData, ttl);

			expect(result.success).toBe(true);
			expect(mockValkey.setex).toHaveBeenCalledWith(key, ttl, expect.any(String));
		});

		it('should compress data before storing', async () => {
			const testData = { large: 'A'.repeat(1000) };
			const key = 'compressed-key';

			await cacheUtils.setInCache(key, testData, 300);

			expect(mockValkey.setex).toHaveBeenCalled();
			const storedValue = (mockValkey.setex.mock.calls[0] as any)[2];
			expect(storedValue.length).toBeLessThan(JSON.stringify(testData).length);
		});

		it('should handle objects', async () => {
			const testData = { nested: { deep: { value: 'here' } } };
			const key = 'object-key';

			const result = await cacheUtils.setInCache(key, testData, 600);

			expect(result.success).toBe(true);
		});

		it('should handle arrays', async () => {
			const testData = [1, 2, 3, { nested: true }];
			const key = 'array-key';

			const result = await cacheUtils.setInCache(key, testData, 600);

			expect(result.success).toBe(true);
		});

		it('should log error on cache set failure', async () => {
			mockValkey.setex.mockRejectedValueOnce(new Error('Write error'));

			const result = await cacheUtils.setInCache('key', { test: 'data' }, 300, mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it('should use specified TTL', async () => {
			const testData = { test: 'data' };
			const key = 'ttl-key';
			const ttl = 1800; // 30 minutes

			await cacheUtils.setInCache(key, testData, ttl);

			expect(mockValkey.setex).toHaveBeenCalledWith(key, ttl, expect.any(String));
		});
	});

	describe('withCache', () => {
		it('should return cached data on hit', async () => {
			const testData = { test: 'cached' };
			const key = 'test-key';
			const fetchFn = vi.fn().mockResolvedValue({ test: 'fresh' });

			const compressed = (await import('../../../src/lib/compression.js')).compress(
				JSON.stringify(testData)
			);
			await mockValkey.set(key, compressed.toString('base64'));

			const result = await cacheUtils.withCache(
				key,
				{ ttl: 300, prefix: 'kurosearch:posts:' },
				fetchFn,
				mockLogger
			);

			expect(result.data).toEqual(testData);
			expect(result.cached).toBe(true);
			expect(fetchFn).not.toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith({ key }, 'Cache HIT');
		});

		it('should fetch and cache on miss', async () => {
			const freshData = { test: 'fresh' };
			const key = 'miss-key';
			const fetchFn = vi.fn().mockResolvedValue(freshData);

			const result = await cacheUtils.withCache(
				key,
				{ ttl: 300, prefix: 'kurosearch:posts:' },
				fetchFn,
				mockLogger
			);

			expect(result.data).toEqual(freshData);
			expect(result.cached).toBe(false);
			expect(fetchFn).toHaveBeenCalledOnce();
			expect(mockLogger.info).toHaveBeenCalledWith({ key }, 'Cache MISS');

			// Wait a bit for fire-and-forget cache write
			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(mockValkey.setex).toHaveBeenCalled();
		});

		it('should handle fetch function errors', async () => {
			const key = 'error-key';
			const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'));

			await expect(
				cacheUtils.withCache(key, { ttl: 300, prefix: 'kurosearch:posts:' }, fetchFn, mockLogger)
			).rejects.toThrow('Fetch failed');
		});

		it('should use specified TTL', async () => {
			const freshData = { test: 'fresh' };
			const key = 'ttl-key';
			const ttl = 1800;
			const fetchFn = vi.fn().mockResolvedValue(freshData);

			await cacheUtils.withCache(key, { ttl, prefix: 'kurosearch:posts:' }, fetchFn);

			await new Promise((resolve) => setTimeout(resolve, 50));
			expect(mockValkey.setex).toHaveBeenCalledWith(key, ttl, expect.any(String));
		});

		it('should not block on cache write failure', async () => {
			const freshData = { test: 'fresh' };
			const key = 'fail-write-key';
			const fetchFn = vi.fn().mockResolvedValue(freshData);

			mockValkey.setex.mockRejectedValueOnce(new Error('Write failed'));

			const result = await cacheUtils.withCache(
				key,
				{ ttl: 300, prefix: 'kurosearch:posts:' },
				fetchFn,
				mockLogger
			);

			expect(result.data).toEqual(freshData);
			expect(result.cached).toBe(false);
		});
	});

	describe('invalidateCache', () => {
		it('should delete cache key', async () => {
			const key = 'delete-key';
			await mockValkey.set(key, 'value');

			const result = await cacheUtils.invalidateCache(key, false, mockLogger);

			expect(result).toBe(true);
			expect(mockValkey.del).toHaveBeenCalledWith(key);
			expect(mockLogger.info).toHaveBeenCalledWith({ key }, 'Cache invalidated');
		});

		it('should handle delete errors gracefully', async () => {
			mockValkey.del.mockRejectedValueOnce(new Error('Delete failed'));

			const result = await cacheUtils.invalidateCache('key', false, mockLogger);

			expect(result).toBe(false);
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('invalidateCachePattern', () => {
		it('should delete multiple keys matching pattern', async () => {
			await mockValkey.set('kurosearch:posts:1', 'value1');
			await mockValkey.set('kurosearch:posts:2', 'value2');
			await mockValkey.set('kurosearch:comments:1', 'value3');

			const result = await cacheUtils.invalidateCachePattern(
				'kurosearch:posts:*',
				false,
				mockLogger
			);

			expect(result).toBe(2);
			expect(mockValkey.keys).toHaveBeenCalledWith('kurosearch:posts:*');
			expect(mockLogger.info).toHaveBeenCalled();
		});

		it('should return 0 when no keys match', async () => {
			const result = await cacheUtils.invalidateCachePattern('nonexistent:*', false, mockLogger);

			expect(result).toBe(0);
		});

		it('should handle errors gracefully', async () => {
			mockValkey.keys.mockRejectedValueOnce(new Error('Keys failed'));

			const result = await cacheUtils.invalidateCachePattern('pattern:*', false, mockLogger);

			expect(result).toBe(0);
			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe('CACHE_TTL', () => {
		it('should export correct TTL constants', () => {
			expect(cacheUtils.CACHE_TTL.POSTS).toBe(300);
			expect(cacheUtils.CACHE_TTL.COMMENTS).toBe(600);
			expect(cacheUtils.CACHE_TTL.TAGS).toBe(3600);
		});
	});
});

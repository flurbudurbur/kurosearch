import { getValkeyClient } from './valkey';
import { compress, decompress } from './compression';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
	POSTS: 300, // 5 minutes
	TAGS: 3600 // 1 hour
} as const;

/**
 * Cache key prefixes for namespacing
 */
const CACHE_PREFIX = {
	POSTS: 'kurosearch:posts:',
	TAGS: 'kurosearch:tags:'
} as const;

/**
 * Options for caching operations
 */
export interface CacheOptions {
	/** Time to live in seconds */
	ttl: number;
	/** Cache key prefix */
	prefix: string;
	/** Whether to compress the data (default: true) */
	compress?: boolean;
}

/**
 * Result of a cache get operation
 */
export interface CacheGetResult<T> {
	/** Whether the cache hit occurred */
	hit: boolean;
	/** The cached data (if hit) */
	data?: T;
	/** Error that occurred (if any) */
	error?: unknown;
}

/**
 * Generates a cache key with prefix
 */
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
	return prefix + parts.join(':');
}

/**
 * Attempts to get data from Valkey cache
 * Returns null on miss or error (graceful degradation)
 */
export async function getFromCache<T = string>(key: string): Promise<CacheGetResult<T>> {
	const client = getValkeyClient();

	// Valkey not available - graceful degradation
	if (!client) {
		return { hit: false };
	}

	try {
		const cached = await client.get(key);

		if (!cached) {
			return { hit: false };
		}

		// Data is stored as compressed buffer, decompress it
		const buffer = Buffer.from(cached, 'base64');
		const decompressed = decompress(buffer);

		return {
			hit: true,
			data: JSON.parse(decompressed) as T
		};
	} catch (error) {
		console.error(`[Cache] Error getting key "${key}":`, error);
		return { hit: false, error };
	}
}

/**
 * Stores data in Valkey cache with compression
 * Fails gracefully if Valkey is unavailable
 */
export async function setInCache<T>(
	key: string,
	data: T,
	ttl: number
): Promise<{ success: boolean; error?: unknown }> {
	const client = getValkeyClient();

	// Valkey not available - graceful degradation
	if (!client) {
		return { success: false };
	}

	try {
		// Compress data before storing
		const json = JSON.stringify(data);
		const compressed = compress(json);
		const base64 = compressed.toString('base64');

		await client.setex(key, ttl, base64);

		return { success: true };
	} catch (error) {
		console.error(`[Cache] Error setting key "${key}":`, error);
		return { success: false, error };
	}
}

/**
 * Higher-level cache wrapper for API endpoints
 * Handles the full cache-aside pattern with graceful fallback
 */
export async function withCache<T>(
	key: string,
	options: CacheOptions,
	fetchFn: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
	// Try to get from cache
	const cacheResult = await getFromCache<T>(key);

	if (cacheResult.hit && cacheResult.data !== undefined) {
		console.log(`[Cache] HIT: ${key}`);
		return { data: cacheResult.data, cached: true };
	}

	console.log(`[Cache] MISS: ${key}`);

	// Cache miss - fetch from upstream
	const data = await fetchFn();

	// Store in cache (fire-and-forget, don't block response)
	setInCache(key, data, options.ttl).catch((error) => {
		console.error(`[Cache] Failed to store key "${key}":`, error);
	});

	return { data, cached: false };
}

/**
 * Invalidates a cache key (for future use)
 */
export async function invalidateCache(key: string): Promise<boolean> {
	const client = getValkeyClient();

	if (!client) {
		return false;
	}

	try {
		await client.del(key);
		console.log(`[Cache] Invalidated: ${key}`);
		return true;
	} catch (error) {
		console.error(`[Cache] Error invalidating key "${key}":`, error);
		return false;
	}
}

/**
 * Invalidates multiple cache keys matching a pattern (for future use)
 * WARNING: KEYS command can be slow on large datasets - use with caution
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
	const client = getValkeyClient();

	if (!client) {
		return 0;
	}

	try {
		const keys = await client.keys(pattern);

		if (keys.length === 0) {
			return 0;
		}

		await client.del(...keys);
		console.log(`[Cache] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
		return keys.length;
	} catch (error) {
		console.error(`[Cache] Error invalidating pattern "${pattern}":`, error);
		return 0;
	}
}

/**
 * Export cache key generators for convenience
 */
export const CacheKeys = {
	posts: (...parts: (string | number)[]) => getCacheKey(CACHE_PREFIX.POSTS, ...parts),
	tags: (...parts: (string | number)[]) => getCacheKey(CACHE_PREFIX.TAGS, ...parts)
} as const;

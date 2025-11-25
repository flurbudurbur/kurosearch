import type { FastifyBaseLogger } from 'fastify';
import { getValkeyClient } from './valkey.js';
import { compress, decompress } from './compression.js';
import { getEventBus } from './event-bus.js';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
	POSTS: 300, // 5 minutes
	COMMENTS: 600, // 10 minutes
	TAGS: 3600 // 1 hour
} as const;

/**
 * Cache key prefixes for namespacing
 */
const CACHE_PREFIX = {
	POSTS: 'kurosearch:posts:',
	COMMENTS: 'kurosearch:comments:',
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
export async function getFromCache<T = string>(
	key: string,
	logger?: FastifyBaseLogger
): Promise<CacheGetResult<T>> {
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
		const decompressed = decompress(buffer, logger);

		return {
			hit: true,
			data: JSON.parse(decompressed) as T
		};
	} catch (err) {
		logger?.error({ err, key }, `Cache error getting key "${key}"`);
		return { hit: false, error: err };
	}
}

/**
 * Stores data in Valkey cache with compression
 * Fails gracefully if Valkey is unavailable
 * Emits cache:write event for subscribers
 */
export async function setInCache<T>(
	key: string,
	data: T,
	ttl: number,
	logger?: FastifyBaseLogger
): Promise<{ success: boolean; error?: unknown }> {
	const client = getValkeyClient();

	// Valkey not available - graceful degradation
	if (!client) {
		return { success: false };
	}

	try {
		// Compress data before storing
		const json = JSON.stringify(data);
		const compressed = compress(json, logger);
		const base64 = compressed.toString('base64');

		await client.setex(key, ttl, base64);

		// Emit cache:write event for subscribers (e.g., WebSocket manager)
		const eventBus = getEventBus(logger);
		await eventBus.emit('cache:write', {
			key,
			ttl,
			size: base64.length
		});

		return { success: true };
	} catch (err) {
		logger?.error({ err, key }, `Cache error setting key "${key}"`);
		return { success: false, error: err };
	}
}

/**
 * Higher-level cache wrapper for API endpoints
 * Handles the full cache-aside pattern with graceful fallback
 */
export async function withCache<T>(
	key: string,
	options: CacheOptions,
	fetchFn: () => Promise<T>,
	logger?: FastifyBaseLogger
): Promise<{ data: T; cached: boolean }> {
	// Try to get from cache
	const cacheResult = await getFromCache<T>(key, logger);

	if (cacheResult.hit && cacheResult.data !== undefined) {
		logger?.info({ key }, 'Cache HIT');
		return { data: cacheResult.data, cached: true };
	}

	logger?.info({ key }, 'Cache MISS');

	// Cache miss - fetch from upstream
	const data = await fetchFn();

	// Store in cache (fire-and-forget, don't block response)
	setInCache(key, data, options.ttl, logger).catch((err) => {
		logger?.error({ err, key }, `Failed to store key in cache`);
	});

	return { data, cached: false };
}

/**
 * Invalidates a cache key and optionally notifies WebSocket clients
 * Emits cache:invalidate event for subscribers
 */
export async function invalidateCache(
	key: string,
	notifyClients = false,
	logger?: FastifyBaseLogger
): Promise<boolean> {
	const client = getValkeyClient();

	if (!client) {
		return false;
	}

	try {
		await client.del(key);
		logger?.info({ key }, 'Cache invalidated');

		// Emit cache:invalidate event if requested
		if (notifyClients) {
			const eventBus = getEventBus(logger);
			await eventBus.emit('cache:invalidate', {
				pattern: key,
				count: 1
			});
		}

		return true;
	} catch (err) {
		logger?.error({ err, key }, `Cache error invalidating key "${key}"`);
		return false;
	}
}

/**
 * Invalidates multiple cache keys matching a pattern and notifies WebSocket clients
 * WARNING: KEYS command can be slow on large datasets - use with caution
 * Emits cache:invalidate event for subscribers
 */
export async function invalidateCachePattern(
	pattern: string,
	notifyClients = false,
	logger?: FastifyBaseLogger
): Promise<number> {
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
		logger?.info(
			{ pattern, count: keys.length },
			`Cache invalidated ${keys.length} keys matching pattern`
		);

		// Emit cache:invalidate event if requested
		if (notifyClients) {
			const eventBus = getEventBus(logger);
			await eventBus.emit('cache:invalidate', {
				pattern,
				count: keys.length
			});
		}

		return keys.length;
	} catch (err) {
		logger?.error({ err, pattern }, `Cache error invalidating pattern "${pattern}"`);
		return 0;
	}
}

/**
 * Export cache key generators for convenience
 */
export const CacheKeys = {
	posts: (...parts: (string | number)[]) => getCacheKey(CACHE_PREFIX.POSTS, ...parts),
	comments: (...parts: (string | number)[]) => getCacheKey(CACHE_PREFIX.COMMENTS, ...parts),
	tags: (...parts: (string | number)[]) => getCacheKey(CACHE_PREFIX.TAGS, ...parts)
} as const;

import type { FastifyRequest, FastifyReply } from 'fastify';
import {
	R34_API_URL,
	appendAuthParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../../lib/rule34-client.js';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '../../lib/cache-utils.js';

/**
 * HTTP handler for GET /tags
 * Handles both autocomplete and tag details requests
 */
export async function getTags(
	request: FastifyRequest<{ Querystring: Record<string, string> }>,
	reply: FastifyReply
): Promise<string> {
	const queryParams = request.query;
	const isAutocomplete = 'autocomplete' in queryParams;

	if (isAutocomplete) {
		// Autocomplete endpoint (JSON)
		const q = queryParams.q || '';
		const cacheKey = CacheKeys.tags('autocomplete', q);

		// Try to get from Valkey cache
		const cached = await getFromCache<string>(cacheKey, request.log);

		if (cached.hit && cached.data) {
			request.log.info(`[Cache] HIT: ${cacheKey}`);

			reply
				.header('content-type', 'application/json; charset=utf-8')
				.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
				.header('x-cache', 'HIT');

			return cached.data;
		}

		request.log.info(`[Cache] MISS: ${cacheKey}`);

		// Cache miss - fetch from upstream
		const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);

		const responseText = await upstream.text();

		// Only cache successful responses
		if (upstream.ok) {
			// Store in Valkey cache (fire-and-forget)
			// Note: setInCache already emits cache:write event via event bus
			setInCache(cacheKey, responseText, CACHE_TTL.TAGS, request.log).catch((error) => {
				request.log.error({ error }, 'Failed to store tags autocomplete cache');
			});

			reply
				.header('content-type', 'application/json; charset=utf-8')
				.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
				.header('x-cache', 'MISS');

			return responseText;
		}

		// Error response - throw error
		const err = new Error('Upstream API error');
		(err as any).statusCode = upstream.status;
		throw err;
	}

	// Tag details via dapi (XML)
	const params = new URLSearchParams({
		page: 'dapi',
		s: 'tag',
		q: 'index',
		limit: '1'
	});

	const requestParams = new URLSearchParams(queryParams);
	createOptionalParamAppender(requestParams, params)('name');
	appendAuthParams(params);

	// Generate cache key from query parameters
	const sortedParams = generateCacheKey(params);
	const cacheKey = CacheKeys.tags('details', sortedParams);

	// Try to get from Valkey cache
	const cached = await getFromCache<string>(cacheKey, request.log);

	if (cached.hit && cached.data) {
		request.log.info(`[Cache] HIT: ${cacheKey}`);

		reply
			.header('content-type', 'text/xml; charset=utf-8')
			.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
			.header('x-cache', 'HIT');

		return cached.data;
	}

	request.log.info(`[Cache] MISS: ${cacheKey}`);

	// Cache miss - fetch from upstream
	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);
	const responseText = await upstream.text();

	// Only cache successful responses
	if (upstream.ok) {
		// Store in Valkey cache (fire-and-forget)
		// Note: setInCache already emits cache:write event via event bus
		setInCache(cacheKey, responseText, CACHE_TTL.TAGS, request.log).catch((error) => {
			request.log.error({ error }, 'Failed to store tags details cache');
		});

		reply
			.header('content-type', 'text/xml; charset=utf-8')
			.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
			.header('x-cache', 'MISS');

		return responseText;
	}

	// Error response - throw error
	const err = new Error('Upstream API error');
	(err as any).statusCode = upstream.status;
	throw err;
}

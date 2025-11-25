import type { FastifyRequest, FastifyReply } from 'fastify';
import {
	R34_API_URL,
	appendAuthParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../../lib/rule34-client.js';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '../../lib/cache-utils.js';

/**
 * HTTP handler for GET /posts
 */
export async function getPosts(
	request: FastifyRequest<{ Querystring: Record<string, string> }>,
	reply: FastifyReply
): Promise<string> {
	const queryParams = request.query;
	const requestParams = new URLSearchParams(queryParams);

	const params = new URLSearchParams({
		page: 'dapi',
		s: 'post',
		q: 'index'
	});

	const append = createOptionalParamAppender(requestParams, params);
	append('fields', 'pid', 'id', 'tags');

	appendAuthParams(params);

	const limit = requestParams.get('limit');
	if (limit) params.append('limit', limit);

	// If this is NOT a count request (limit=0 or no limit for single post ID), request JSON
	const isCount = limit === '0';
	if (!isCount) {
		params.append('json', '1');
	}

	// Generate cache key from query parameters
	// Sort params for consistent cache keys
	const sortedParams = generateCacheKey(params);
	const cacheKey = CacheKeys.posts(sortedParams);

	// Try to get from Valkey cache
	const cached = await getFromCache<string>(cacheKey, request.log);
	const contentType = isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8';

	if (cached.hit && cached.data) {
		request.log.info(`[Cache] HIT: ${cacheKey}`);

		reply
			.header('content-type', contentType)
			.header('cache-control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300')
			.header('x-cache', 'HIT');

		return cached.data;
	}

	request.log.info(`[Cache] MISS: ${cacheKey}`);

	// Cache miss - fetch from upstream API
	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

	// Pass through the upstream response with a sane content-type
	const upstreamContentType = upstream.headers.get('content-type') || contentType;

	const responseText = await upstream.text();

	// Only cache successful responses
	if (upstream.ok) {
		// Store in Valkey cache (fire-and-forget)
		// Note: setInCache already emits cache:write event via event bus
		setInCache(cacheKey, responseText, CACHE_TTL.POSTS, request.log).catch((error) => {
			request.log.error({ error }, 'Failed to store posts cache');
		});

		reply
			.header('content-type', upstreamContentType)
			.header('cache-control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300')
			.header('x-cache', 'MISS');

		return responseText;
	}

	// Error response - don't cache, throw error
	const err = new Error('Upstream API error');
	(err as any).statusCode = upstream.status;
	throw err;
}

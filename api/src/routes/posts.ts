import type { FastifyPluginAsync } from 'fastify';
import {
	R34_API_URL,
	appendAuthParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../lib/rule34-client.js';
import {
	CacheKeys,
	CACHE_TTL,
	getFromCache,
	setInCache,
	broadcastCacheWrite,
	broadcastError
} from '../lib/cache-utils.js';

/**
 * Posts route - fetches posts from Rule34 API with caching
 * GET /api/posts?tags=tag1+tag2&limit=100&pid=0
 */
export const postsRoute: FastifyPluginAsync = async (fastify) => {
	fastify.get('/posts', async (request, reply) => {
		const queryParams = request.query as Record<string, string>;
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

		if (cached.hit && cached.data) {
			request.log.info(`[Cache] HIT: ${cacheKey}`);
			const contentType = isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8';

			return reply
				.code(200)
				.header('content-type', contentType)
				.header('cache-control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300')
				.header('x-cache', 'HIT')
				.send(cached.data);
		}

		request.log.info(`[Cache] MISS: ${cacheKey}`);

		// Cache miss - fetch from upstream API
		try {
			const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

			// Pass through the upstream response with a sane content-type
			const contentType =
				upstream.headers.get('content-type') ||
				(isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8');

			const responseText = await upstream.text();

			// Only cache successful responses
			if (upstream.ok) {
				// Store in Valkey cache (fire-and-forget)
				setInCache(cacheKey, responseText, CACHE_TTL.POSTS, request.log)
					.then((result) => {
						if (result.success) {
							// Broadcast cache-write event to WebSocket clients
							broadcastCacheWrite(cacheKey, 'posts', request.log);
						}
					})
					.catch((error) => {
						request.log.error({ error }, 'Failed to store posts cache');
					});

				return reply
					.code(upstream.status)
					.header('content-type', contentType)
					.header('cache-control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300')
					.header('x-cache', 'MISS')
					.send(responseText);
			}

			// Error response - don't cache, just pass through
			return reply
				.code(upstream.status)
				.header('content-type', contentType)
				.header('cache-control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=300')
				.header('x-cache', 'BYPASS')
				.send(responseText);
		} catch (error) {
			request.log.error({ error }, 'Error fetching posts');

			// Broadcast error event to WebSocket clients
			broadcastError('Failed to fetch posts from Rule34 API', 'FETCH_ERROR', 'posts', request.log);

			return reply.code(500).send({ error: 'Failed to fetch posts' });
		}
	});
};

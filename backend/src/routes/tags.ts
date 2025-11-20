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
 * Tags route - handles both autocomplete and tag details
 * GET /api/tags?autocomplete=true&q=search_term - Autocomplete (JSON)
 * GET /api/tags?name=tag_name - Tag details (XML)
 */
export const tagsRoute: FastifyPluginAsync = async (fastify) => {
	fastify.get('/tags', async (request, reply) => {
		const queryParams = request.query as Record<string, string>;
		const isAutocomplete = 'autocomplete' in queryParams;

		if (isAutocomplete) {
			// Autocomplete endpoint (JSON)
			const q = queryParams.q || '';
			const cacheKey = CacheKeys.tags('autocomplete', q);

			// Try to get from Valkey cache
			const cached = await getFromCache<string>(cacheKey, request.log);

			if (cached.hit && cached.data) {
				request.log.info(`[Cache] HIT: ${cacheKey}`);
				return reply
					.code(200)
					.header('content-type', 'application/json; charset=utf-8')
					.header(
						'cache-control',
						'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
					)
					.header('x-cache', 'HIT')
					.send(cached.data);
			}

			request.log.info(`[Cache] MISS: ${cacheKey}`);

			// Cache miss - fetch from upstream
			try {
				const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);

				const responseText = await upstream.text();

				// Only cache successful responses
				if (upstream.ok) {
					// Store in Valkey cache (fire-and-forget)
					setInCache(cacheKey, responseText, CACHE_TTL.TAGS, request.log)
						.then((result) => {
							if (result.success) {
								// Broadcast cache-write event to WebSocket clients
								broadcastCacheWrite(cacheKey, 'tags', request.log);
							}
						})
						.catch((error) => {
							request.log.error({ error }, 'Failed to store tags autocomplete cache');
						});

					return reply
						.code(upstream.status)
						.header('content-type', 'application/json; charset=utf-8')
						.header(
							'cache-control',
							'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
						)
						.header('x-cache', 'MISS')
						.send(responseText);
				}

				// Error response - don't cache, just pass through
				return reply
					.code(upstream.status)
					.header('content-type', 'application/json; charset=utf-8')
					.header(
						'cache-control',
						'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
					)
					.header('x-cache', 'BYPASS')
					.send(responseText);
			} catch (error) {
				request.log.error({ error }, 'Error fetching autocomplete');

				// Broadcast error event to WebSocket clients
				broadcastError(
					'Failed to fetch tag autocomplete from Rule34 API',
					'FETCH_ERROR',
					'tags',
					request.log
				);

				return reply.code(500).send({ error: 'Failed to fetch autocomplete suggestions' });
			}
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
			return reply
				.code(200)
				.header('content-type', 'text/xml; charset=utf-8')
				.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
				.header('x-cache', 'HIT')
				.send(cached.data);
		}

		request.log.info(`[Cache] MISS: ${cacheKey}`);

		// Cache miss - fetch from upstream
		try {
			const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);
			const responseText = await upstream.text();

			// Only cache successful responses
			if (upstream.ok) {
				// Store in Valkey cache (fire-and-forget)
				setInCache(cacheKey, responseText, CACHE_TTL.TAGS, request.log)
					.then((result) => {
						if (result.success) {
							// Broadcast cache-write event to WebSocket clients
							broadcastCacheWrite(cacheKey, 'tags', request.log);
						}
					})
					.catch((error) => {
						request.log.error({ error }, 'Failed to store tags details cache');
					});

				return reply
					.code(upstream.status)
					.header('content-type', 'text/xml; charset=utf-8')
					.header(
						'cache-control',
						'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
					)
					.header('x-cache', 'MISS')
					.send(responseText);
			}

			// Error response - don't cache, just pass through
			return reply
				.code(upstream.status)
				.header('content-type', 'text/xml; charset=utf-8')
				.header('cache-control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800')
				.header('x-cache', 'BYPASS')
				.send(responseText);
		} catch (error) {
			request.log.error({ error }, 'Error fetching tag details');

			// Broadcast error event to WebSocket clients
			broadcastError(
				'Failed to fetch tag details from Rule34 API',
				'FETCH_ERROR',
				'tags',
				request.log
			);

			return reply.code(500).send({ error: 'Failed to fetch tag details' });
		}
	});
};

import type { FastifyPluginAsync } from 'fastify';
import { R34_API_URL, appendAuthParams, requireParams } from '../lib/rule34-client.js';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '../lib/cache-utils.js';

/**
 * Comments route - fetches comments for a specific post with Valkey caching
 * GET /api/comments?post_id=12345
 */
export const commentsRoute: FastifyPluginAsync = async (fastify) => {
	fastify.get('/comments', async (request, reply) => {
		const queryParams = request.query as Record<string, string>;
		const requestParams = new URLSearchParams(queryParams);

		// Require post_id parameter
		const { values, missing } = requireParams(requestParams, 'post_id');

		if (missing.length) {
			return reply.code(400).send({
				error: `Missing required query param: ${missing.join(', ')}`
			});
		}

		const postId = values['post_id'];
		const cacheKey = CacheKeys.comments(postId);

		// Try to get from cache first
		const cacheResult = await getFromCache<string>(cacheKey, request.log);

		if (cacheResult.hit && cacheResult.data !== undefined) {
			request.log.info({ cacheKey }, 'Cache HIT for comments');
			return reply
				.code(200)
				.header('content-type', 'text/xml; charset=utf-8')
				.header('cache-control', 'public, max-age=600, s-maxage=1200, stale-while-revalidate=600')
				.header('x-cache', 'HIT')
				.send(cacheResult.data);
		}

		request.log.info({ cacheKey }, 'Cache MISS for comments');

		// Cache miss - fetch from Rule34 API
		const params = new URLSearchParams({
			page: 'dapi',
			s: 'comment',
			q: 'index',
			post_id: postId
		});

		appendAuthParams(params);

		try {
			const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);
			const responseText = await upstream.text();

			// Store in cache if successful (fire-and-forget)
			// Note: setInCache already emits cache:write event via event bus
			if (upstream.ok) {
				setInCache(cacheKey, responseText, CACHE_TTL.COMMENTS, request.log).catch((error) => {
					request.log.error({ error, cacheKey }, 'Failed to store comments in cache');
				});
			}

			return reply
				.code(upstream.status)
				.header('content-type', upstream.headers.get('content-type') || 'text/xml; charset=utf-8')
				.header('cache-control', 'public, max-age=600, s-maxage=1200, stale-while-revalidate=600')
				.header('x-cache', 'MISS')
				.send(responseText);
		} catch (error) {
			request.log.error({ error }, 'Error fetching comments');
			return reply.code(500).send({ error: 'Failed to fetch comments' });
		}
	});
};

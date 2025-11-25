import type { FastifyRequest, FastifyReply } from 'fastify';
import { R34_API_URL, appendAuthParams } from '../../lib/rule34-client.js';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '../../lib/cache-utils.js';

/**
 * HTTP handler for GET /comments
 */
export async function getComments(
	request: FastifyRequest<{ Querystring: { post_id: string } }>,
	reply: FastifyReply
): Promise<string> {
	const { post_id: postId } = request.query;
	const cacheKey = CacheKeys.comments(postId);

	// Try to get from cache first
	const cacheResult = await getFromCache<string>(cacheKey, request.log);

	if (cacheResult.hit && cacheResult.data !== undefined) {
		request.log.info({ cacheKey }, 'Cache HIT for comments');

		reply
			.header('content-type', 'text/xml; charset=utf-8')
			.header('cache-control', 'public, max-age=600, s-maxage=1200, stale-while-revalidate=600')
			.header('x-cache', 'HIT');

		return cacheResult.data;
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

	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);
	const responseText = await upstream.text();

	// Store in cache if successful (fire-and-forget)
	// Note: setInCache already emits cache:write event via event bus
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.COMMENTS, request.log).catch((error) => {
			request.log.error({ error, cacheKey }, 'Failed to store comments in cache');
		});
	}

	if (!upstream.ok) {
		const err = new Error('Upstream API error');
		(err as any).statusCode = upstream.status;
		throw err;
	}

	reply
		.header('content-type', upstream.headers.get('content-type') || 'text/xml; charset=utf-8')
		.header('cache-control', 'public, max-age=600, s-maxage=1200, stale-while-revalidate=600')
		.header('x-cache', 'MISS');

	return responseText;
}

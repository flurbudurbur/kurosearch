import { getFromCache, setInCache, CACHE_TTL, CacheKeys } from '../../lib/cache-utils.js';
import { R34_API_URL, appendAuthParams, requireParams } from '../../lib/rule34-client.js';

/**
 * Handle comments request via WebSocket API proxy
 */
export async function handleCommentsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const { values, missing } = requireParams(requestParams, 'post_id');

	if (missing.length) {
		throw new Error(`Missing required param: ${missing.join(', ')}`);
	}

	const postId = values['post_id'];
	const cacheKey = CacheKeys.comments(postId);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for comments');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for comments');

	// Fetch from Rule34
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'comment',
		q: 'index',
		post_id: postId
	});
	appendAuthParams(apiParams);

	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	// Note: setInCache already emits cache:write event via event bus
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.COMMENTS, logger).catch((err) => {
			logger.error({ err, cacheKey }, 'Failed to cache comments');
		});
	}

	return responseText;
}

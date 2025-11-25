import { getFromCache, setInCache, CACHE_TTL, CacheKeys } from '../../lib/cache-utils.js';
import {
	R34_API_URL,
	appendAuthParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../../lib/rule34-client.js';

/**
 * Handle posts request via WebSocket API proxy
 */
export async function handlePostsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'post',
		q: 'index'
	});

	const append = createOptionalParamAppender(requestParams, apiParams);
	append('fields', 'pid', 'id', 'tags');
	appendAuthParams(apiParams);

	const limit = requestParams.get('limit');
	if (limit) apiParams.append('limit', limit);

	const isCount = limit === '0';
	if (!isCount) {
		apiParams.append('json', '1');
	}

	// Generate cache key
	const sortedParams = generateCacheKey(apiParams);
	const cacheKey = CacheKeys.posts(sortedParams);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for posts');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for posts');

	// Fetch from Rule34
	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	// Note: setInCache already emits cache:write event via event bus
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.POSTS, logger).catch((err) => {
			logger.error({ err, cacheKey }, 'Failed to cache posts');
		});
	}

	return responseText;
}

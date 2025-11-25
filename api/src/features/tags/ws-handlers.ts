import { getFromCache, setInCache, CACHE_TTL, CacheKeys } from '../../lib/cache-utils.js';
import {
	R34_API_URL,
	appendAuthParams,
	createOptionalParamAppender,
	generateCacheKey
} from '../../lib/rule34-client.js';

/**
 * Handle tags request via WebSocket API proxy
 */
export async function handleTagsRequest(
	params: Record<string, string>,
	logger: any
): Promise<string> {
	const requestParams = new URLSearchParams(params);
	const isAutocomplete = requestParams.has('autocomplete');

	if (isAutocomplete) {
		const q = requestParams.get('q') || '';
		const cacheKey = CacheKeys.tags('autocomplete', q);

		// Try cache
		const cached = await getFromCache<string>(cacheKey, logger);
		if (cached.hit && cached.data) {
			logger.info({ cacheKey }, '[WS] Cache HIT for tags autocomplete');
			return cached.data;
		}

		logger.info({ cacheKey }, '[WS] Cache MISS for tags autocomplete');

		// Fetch from Rule34
		const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);
		const responseText = await upstream.text();

		// Cache if successful
		// Note: setInCache already emits cache:write event via event bus
		if (upstream.ok) {
			setInCache(cacheKey, responseText, CACHE_TTL.TAGS, logger).catch((err) => {
				logger.error({ err, cacheKey }, 'Failed to cache tags autocomplete');
			});
		}

		return responseText;
	}

	// Tag details
	const apiParams = new URLSearchParams({
		page: 'dapi',
		s: 'tag',
		q: 'index',
		limit: '1'
	});

	createOptionalParamAppender(requestParams, apiParams)('name');
	appendAuthParams(apiParams);

	const sortedParams = generateCacheKey(apiParams);
	const cacheKey = CacheKeys.tags('details', sortedParams);

	// Try cache
	const cached = await getFromCache<string>(cacheKey, logger);
	if (cached.hit && cached.data) {
		logger.info({ cacheKey }, '[WS] Cache HIT for tags details');
		return cached.data;
	}

	logger.info({ cacheKey }, '[WS] Cache MISS for tags details');

	// Fetch from Rule34
	const upstream = await fetch(`${R34_API_URL}?${apiParams.toString()}`);
	const responseText = await upstream.text();

	// Cache if successful
	// Note: setInCache already emits cache:write event via event bus
	if (upstream.ok) {
		setInCache(cacheKey, responseText, CACHE_TTL.TAGS, logger).catch((err) => {
			logger.error({ err, cacheKey }, 'Failed to cache tags details');
		});
	}

	return responseText;
}

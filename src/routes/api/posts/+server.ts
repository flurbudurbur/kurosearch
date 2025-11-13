import { type RequestHandler } from '@sveltejs/kit';
import { R34_API_URL } from '$lib/logic/api-client/url';
import { appendAuthParams, createOptionalParamAppender } from '$lib/logic/api-client/param-utils';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '$lib/server/cache-utils';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const params = new URLSearchParams({
		page: 'dapi',
		s: 'post',
		q: 'index'
	});

	const append = createOptionalParamAppender(url, params);
	append('fields', 'pid', 'id', 'tags');

	appendAuthParams(url, params);

	const limit = url.searchParams.get('limit');
	if (limit) params.append('limit', limit);
	// If this is NOT a count request (limit=0 or no limit for single post ID), request JSON
	const isCount = limit === '0';
	if (!isCount) {
		params.append('json', '1');
	}

	// Generate cache key from query parameters
	// Sort params for consistent cache keys
	const sortedParams = Array.from(params.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join('&');
	const cacheKey = CacheKeys.posts(sortedParams);

	// Try to get from Valkey cache
	const cached = await getFromCache<string>(cacheKey);

	if (cached.hit && cached.data) {
		logger.debug({ cacheKey }, 'Cache HIT');
		const contentType = isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8';

		return new Response(cached.data, {
			status: 200,
			headers: {
				'content-type': contentType,
				'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=300',
				'x-cache': 'HIT'
			}
		});
	}

	logger.debug({ cacheKey }, 'Cache MISS');

	// Cache miss - fetch from upstream API
	let upstream: Response;
	try {
		upstream = await fetch(`${R34_API_URL}?${params.toString()}`);
	} catch (error) {
		// Handle network errors: timeout, connection refused, DNS failures, etc.
		logger.error({ error, url: R34_API_URL }, 'Upstream fetch failed');

		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(
			JSON.stringify({
				error: 'Upstream service unavailable',
				message: errorMessage
			}),
			{
				status: 502,
				statusText: 'Bad Gateway',
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'cache-control': 'no-cache, no-store, must-revalidate'
				}
			}
		);
	}

	// Pass through the upstream response with a sane content-type
	const contentType =
		upstream.headers.get('content-type') ||
		(isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8');

	// Only cache successful responses
	if (upstream.ok && upstream.body) {
		const responseText = await upstream.text();

		// Store in Valkey cache (fire-and-forget)
		setInCache(cacheKey, responseText, CACHE_TTL.POSTS).catch((error) => {
			logger.error({ error, cacheKey }, 'Failed to store posts cache');
		});

		return new Response(responseText, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				'content-type': contentType,
				'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=300',
				'x-cache': 'MISS'
			}
		});
	}

	// Error response - don't cache, just pass through
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=300',
			'x-cache': 'BYPASS'
		}
	});
};

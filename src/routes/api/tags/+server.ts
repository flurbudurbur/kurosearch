import type { RequestHandler } from '@sveltejs/kit';
import { R34_API_URL } from '$lib/logic/api-client/url';
import { appendAuthParams, createOptionalParamAppender } from '$lib/logic/api-client/param-utils';
import { CacheKeys, CACHE_TTL, getFromCache, setInCache } from '$lib/server/cache-utils';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const isAutocomplete = url.searchParams.has('autocomplete');
	if (isAutocomplete) {
		// Proxy to autocomplete endpoint (JSON)
		const q = url.searchParams.get('q') ?? '';
		const cacheKey = CacheKeys.tags('autocomplete', q);

		// Try to get from Valkey cache
		const cached = await getFromCache<string>(cacheKey);

		if (cached.hit && cached.data) {
			console.log(`[Cache] HIT: ${cacheKey}`);
			return new Response(cached.data, {
				status: 200,
				headers: {
					'content-type': 'application/json; charset=utf-8',
					'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
					'x-cache': 'HIT'
				}
			});
		}

		console.log(`[Cache] MISS: ${cacheKey}`);

		// Cache miss - fetch from upstream
		const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);

		// Only cache successful responses
		if (upstream.ok && upstream.body) {
			const responseText = await upstream.text();

			// Store in Valkey cache (fire-and-forget)
			setInCache(cacheKey, responseText, CACHE_TTL.TAGS).catch((error) => {
				console.error(`[Cache] Failed to store tags autocomplete cache:`, error);
			});

			return new Response(responseText, {
				status: upstream.status,
				statusText: upstream.statusText,
				headers: {
					'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
					'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
					'x-cache': 'MISS'
				}
			});
		}

		// Error response - don't cache, just pass through
		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
				'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
				'x-cache': 'BYPASS'
			}
		});
	}

	// Tag details via dapi (XML)
	const params = new URLSearchParams({
		page: 'dapi',
		s: 'tag',
		q: 'index',
		limit: '1'
	});

	createOptionalParamAppender(url, params)('name');
	appendAuthParams(url, params);

	// Generate cache key from query parameters
	const sortedParams = Array.from(params.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([k, v]) => `${k}=${v}`)
		.join('&');
	const cacheKey = CacheKeys.tags('details', sortedParams);

	// Try to get from Valkey cache
	const cached = await getFromCache<string>(cacheKey);

	if (cached.hit && cached.data) {
		console.log(`[Cache] HIT: ${cacheKey}`);
		return new Response(cached.data, {
			status: 200,
			headers: {
				'content-type': 'text/xml; charset=utf-8',
				'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
				'x-cache': 'HIT'
			}
		});
	}

	console.log(`[Cache] MISS: ${cacheKey}`);

	// Cache miss - fetch from upstream
	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

	// Only cache successful responses
	if (upstream.ok && upstream.body) {
		const responseText = await upstream.text();

		// Store in Valkey cache (fire-and-forget)
		setInCache(cacheKey, responseText, CACHE_TTL.TAGS).catch((error) => {
			console.error(`[Cache] Failed to store tags details cache:`, error);
		});

		return new Response(responseText, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				'content-type': upstream.headers.get('content-type') ?? 'text/xml; charset=utf-8',
				'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
				'x-cache': 'MISS'
			}
		});
	}

	// Error response - don't cache, just pass through
	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'text/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800',
			'x-cache': 'BYPASS'
		}
	});
};

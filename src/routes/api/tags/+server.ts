import type { RequestHandler } from '@sveltejs/kit';
import { R34_API_URL } from '$lib/logic/api-client/url';
import { appendAuthParams, createOptionalParamAppender } from '$lib/logic/api-client/param-utils';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const isAutocomplete = url.searchParams.has('autocomplete');
	if (isAutocomplete) {
		// Proxy to autocomplete endpoint (JSON)
		const q = url.searchParams.get('q') ?? '';
		const upstream = await fetch(`${R34_API_URL}/autocomplete.php?q=${encodeURIComponent(q)}`);
		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers: {
				'content-type': upstream.headers.get('content-type') ?? 'application/json; charset=utf-8',
				// Cache autocomplete results for 1 hour (tag names are relatively stable)
				'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
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

	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'text/xml; charset=utf-8',
			// Cache tag details for 1 hour (tag metadata is relatively stable)
			'cache-control': 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=1800'
		}
	});
};

import { type RequestHandler } from '@sveltejs/kit';
import { R34_API_URL } from '$lib/logic/api-client/url';
import { appendAuthParams, createOptionalParamAppender } from '$lib/logic/api-client/param-utils';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const params = new URLSearchParams({
		page: 'dapi',
		s: 'post',
		q: 'index'
	});

	const append = createOptionalParamAppender(url, params);
	append('field', 'pid', 'id', 'tags', 'field');

	appendAuthParams(url, params);

	const limit = url.searchParams.get('limit');
	if (limit) params.append('limit', limit);
	// If this is NOT a count request (limit=0), request JSON
	const isCount = limit === '0';
	if (!isCount) {
		params.append('json', '1');
	}

	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

	// Pass through the upstream response with a sane content-type
	const contentType =
		upstream.headers.get('content-type') ||
		(isCount ? 'text/xml; charset=utf-8' : 'application/json; charset=utf-8');

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: {
			'content-type': contentType,
			// Cache post data for 5 minutes on client, 10 minutes on CDN
			'cache-control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=300'
		}
	});
};

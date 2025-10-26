import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { R34_API_URL } from '$lib/logic/api-client/url';
import { appendAuthParams, createRequiredParamGetter } from '$lib/logic/api-client/param-utils';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const require = createRequiredParamGetter(url);
	const { values, missing } = require('post_id');
	if (missing.length) {
		return json({ error: `Missing required query param: ${missing.join(', ')}` }, { status: 400 });
	}

	const params = new URLSearchParams({
		page: 'dapi',
		s: 'comment',
		q: 'index'
	});

	params.append('id', values['post_id']);

	appendAuthParams(url, params);

	const upstream = await fetch(`${R34_API_URL}?${params.toString()}`);

	return new Response(upstream.body, {
		status: upstream.status,
		statusText: upstream.statusText,
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'text/xml; charset=utf-8',
			'cache-control': upstream.headers.get('cache-control') ?? 'no-store'
		}
	});
};

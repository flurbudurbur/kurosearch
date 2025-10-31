import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Consider both "/api" and "/api/..."
	if (path.startsWith('/api')) {
		const req = event.request;

		// Allow preflight and HEAD to pass through
		if (req.method === 'OPTIONS' || req.method === 'HEAD') {
			return resolve(event);
		}

		const secFetchDest = req.headers.get('sec-fetch-dest');
		if (secFetchDest === 'document') {
			return new Response('ohmygosh STAAAAPP1!! >w<', { status: 403 });
		}

		const secFetchSite = req.headers.get('sec-fetch-site');
		const hasFetchMetadata = secFetchSite !== null;
		const isSameOrigin = secFetchSite === 'same-origin';

		const xSKLoad = req.headers.get('x-sveltekit-load') === '1';

		const origin = req.headers.get('origin');
		const expectedOrigin = (env.FRONTEND_ORIGIN ?? event.url.origin).replace(/\/$/, '');

		const referer = req.headers.get('referer') ?? '';
		const originOk = !origin || origin.replace(/\/$/, '') === expectedOrigin;
		const refererOk =
			!referer || referer === `${expectedOrigin}/` || referer.startsWith(`${expectedOrigin}/`);

		// Only allow requests from the frontend (not external or direct browser navigation)
		const allowed =
			xSKLoad || // SvelteKit's own internal loads
			(hasFetchMetadata && isSameOrigin && originOk && refererOk); // Same-origin fetch with correct origin/referer

		if (!allowed) {
			return new Response('ohmygosh STAAAAPP1!! >w<', { status: 403 });
		}
	}

	return resolve(event);
};

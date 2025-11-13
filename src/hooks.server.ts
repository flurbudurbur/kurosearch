import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/logger';

// Cache environment variables at server startup
const FRONTEND_ORIGIN = env.FRONTEND_ORIGIN;

// Validate recommended environment variables at startup
if (!env.SYNC_ENCRYPTION_SECRET) {
	logger.warn('SYNC_ENCRYPTION_SECRET not set - using temporary session secret');
	logger.warn('Recommended for production: openssl rand -base64 32');
} else if (env.SYNC_ENCRYPTION_SECRET.length < 32) {
	throw new Error('SYNC_ENCRYPTION_SECRET must be at least 32 characters long');
}

export const handle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();
	const path = event.url.pathname;
	const method = event.request.method;

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
		const expectedOrigin = (FRONTEND_ORIGIN ?? event.url.origin).replace(/\/$/, '');

		const referer = req.headers.get('referer') ?? '';

		// For same-origin requests with fetch metadata, require BOTH origin and referer to be present and valid
		const originOk = origin && origin.replace(/\/$/, '') === expectedOrigin;
		const refererOk =
			referer && (referer === `${expectedOrigin}/` || referer.startsWith(`${expectedOrigin}/`));

		// Detect server-side internal fetches (no browser metadata, origin, or referer)
		const isInternalServerFetch = !hasFetchMetadata && !origin && !referer;

		// Only allow requests from the frontend (not external or direct browser navigation)
		const allowed =
			xSKLoad || // SvelteKit's own internal loads
			isInternalServerFetch || // Server-side internal fetches from load functions
			(hasFetchMetadata && isSameOrigin && originOk && refererOk); // Same-origin fetch with correct origin/referer

		if (!allowed) {
			logger.warn({ method, path, origin, referer }, 'Request blocked by security check');
			return new Response('ohmygosh STAAAAPP1!! >w<', { status: 403 });
		}
	}

	const response = await resolve(event);
	const duration = Date.now() - startTime;

	// Log all requests with timing information
	logger.info(
		{
			method,
			path,
			status: response.status,
			duration,
			userAgent: event.request.headers.get('user-agent')?.slice(0, 100)
		},
		'HTTP request'
	);

	return response;
};

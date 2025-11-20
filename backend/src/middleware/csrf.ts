import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * CSRF Protection Middleware
 * Validates origin and referer headers to prevent CSRF attacks
 *
 * Based on hooks.server.ts logic from SvelteKit
 */
export async function csrfProtection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { method, headers, url } = request;

	// Allow preflight and HEAD requests
	if (method === 'OPTIONS' || method === 'HEAD') {
		return;
	}

	// Skip CSRF for WebSocket upgrade requests (handled by WebSocket plugin)
	if (url === '/ws' && method === 'GET' && headers.upgrade?.toLowerCase() === 'websocket') {
		request.log.debug({ url, headers }, 'Skipping CSRF for WebSocket upgrade');
		return;
	}

	// Also check connection header for WebSocket
	if (url === '/ws' && method === 'GET' && headers.connection?.toLowerCase().includes('upgrade')) {
		request.log.debug({ url, headers }, 'Skipping CSRF for WebSocket connection upgrade');
		return;
	}

	// Check for direct browser navigation (should be blocked)
	const secFetchDest = headers['sec-fetch-dest'];
	if (secFetchDest === 'document') {
		reply.code(403).send('ohmygosh STAAAAPP1!! >w<');
		return;
	}

	// Validate origin and referer
	const origin = headers.origin;
	const referer = headers.referer || '';
	const expectedOrigin = request.server.config.FRONTEND_ORIGIN.replace(/\/$/, '');

	// Check origin header
	const originOk = !origin || origin.replace(/\/$/, '') === expectedOrigin;

	// Check referer header
	const refererOk =
		!referer || referer === `${expectedOrigin}/` || referer.startsWith(`${expectedOrigin}/`);

	// Validate request origin
	const secFetchSite = headers['sec-fetch-site'];
	const hasFetchMetadata = secFetchSite !== null;
	const isSameOrigin = secFetchSite === 'same-origin';
	const isCrossSite = secFetchSite === 'cross-site' || secFetchSite === 'same-site';

	// Allow requests from the frontend:
	// - Same-origin requests (monolithic deployment)
	// - Cross-site/same-site requests from the configured FRONTEND_ORIGIN (separate frontend/backend)
	//   Note: localhost:5173 -> localhost:3001 is considered "same-site" by browsers
	// Block direct browser navigation and requests without proper origin/referer
	const allowed = hasFetchMetadata && (isSameOrigin || (isCrossSite && originOk && refererOk));

	if (!allowed) {
		request.log.warn(
			{
				method,
				url: url,
				origin,
				referer,
				secFetchSite,
				secFetchDest
			},
			'CSRF validation failed'
		);

		reply.code(403).send('ohmygosh STAAAAPP1!! >w<');
		return;
	}
}

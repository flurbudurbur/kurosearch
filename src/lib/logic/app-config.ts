import { env } from '$env/dynamic/public';
import type { RequestEvent } from '@sveltejs/kit';

export const APP_NAME: string = env?.['PUBLIC_APP_NAME'] ?? 'flur34';
export const SOURCE_CODE_URL: string =
	env?.['PUBLIC_SOURCE_URL'] ?? 'https://github.com/flur34/flur34';
export const DISCORD_URL: string = env?.['PUBLIC_DISCORD_URL'] ?? 'https://discord.gg/AxUnC7n9ZP';
export const SPONSOR_URL: string = env?.['PUBLIC_SPONSOR_URL'] ?? 'https://ko-fi.com/flurbudurbur';

/**
 * Gets the canonical URL for the application.
 * Fallback hierarchy:
 * 1. KUROSEARCH_CANONICAL_URL (explicit env var) - cached at startup
 * 2. FRONTEND_ORIGIN (existing CSRF protection env var) - cached at startup
 * 3. event.url.origin (dynamic from request)
 * 4. https://flur34.com (hardcoded default)
 *
 * @param event - SvelteKit RequestEvent
 * @param privateEnv - Private environment variables
 * @returns Canonical URL without trailing slash
 */

// Cache env vars at module level (loaded once at server startup)
// Note: We still need to pass privateEnv for runtime flexibility, but cache the lookups
let cachedCanonicalUrl: string | undefined;
let cachedFrontendOrigin: string | undefined;

export function getCanonicalUrl(
	event: RequestEvent,
	privateEnv: Record<string, string | undefined>
): string {
	// Initialize cache on first call (can't do top-level because privateEnv is passed at runtime)
	if (cachedCanonicalUrl === undefined) {
		cachedCanonicalUrl = privateEnv.KUROSEARCH_CANONICAL_URL;
	}
	if (cachedFrontendOrigin === undefined) {
		cachedFrontendOrigin = privateEnv.FRONTEND_ORIGIN;
	}

	const canonicalUrl = cachedCanonicalUrl ?? cachedFrontendOrigin ?? event.url.origin;

	// Fallback to hardcoded default if all else fails
	const finalUrl = canonicalUrl || 'https://flur34.com';

	// Remove trailing slash
	const normalizedUrl = finalUrl.replace(/\/$/, '');

	// Validate URL format
	try {
		const parsed = new URL(normalizedUrl);
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			// Skip logging to avoid client/server import issues
			// This function is used by both client and server code
			return 'https://flur34.com';
		}
	} catch {
		// Skip logging to avoid client/server import issues
		// This function is used by both client and server code
		return 'https://flur34.com';
	}

	return normalizedUrl;
}

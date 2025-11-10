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
 * 1. KUROSEARCH_CANONICAL_URL (explicit env var)
 * 2. FRONTEND_ORIGIN (existing CSRF protection env var)
 * 3. event.url.origin (dynamic from request)
 * 4. https://flur34.com (hardcoded default)
 *
 * @param event - SvelteKit RequestEvent
 * @param privateEnv - Private environment variables
 * @returns Canonical URL without trailing slash
 */
export function getCanonicalUrl(
	event: RequestEvent,
	privateEnv: Record<string, string | undefined>
): string {
	const canonicalUrl =
		privateEnv.KUROSEARCH_CANONICAL_URL ?? privateEnv.FRONTEND_ORIGIN ?? event.url.origin;

	// Fallback to hardcoded default if all else fails
	const finalUrl = canonicalUrl || 'https://flur34.com';

	// Remove trailing slash
	const normalizedUrl = finalUrl.replace(/\/$/, '');

	// Validate URL format
	try {
		const parsed = new URL(normalizedUrl);
		if (!['http:', 'https:'].includes(parsed.protocol)) {
			console.warn(
				`[getCanonicalUrl] Invalid protocol in canonical URL: ${normalizedUrl}. Using https://flur34.com`
			);
			return 'https://flur34.com';
		}
	} catch (error) {
		console.warn(
			`[getCanonicalUrl] Invalid canonical URL format: ${normalizedUrl}. Using https://flur34.com`,
			error
		);
		return 'https://flur34.com';
	}

	// Log configuration for debugging
	if (privateEnv.KUROSEARCH_CANONICAL_URL) {
		console.log(`[getCanonicalUrl] Using KUROSEARCH_CANONICAL_URL: ${normalizedUrl}`);
	} else if (privateEnv.FRONTEND_ORIGIN) {
		console.log(`[getCanonicalUrl] Using FRONTEND_ORIGIN fallback: ${normalizedUrl}`);
	} else {
		console.log(`[getCanonicalUrl] Using request origin: ${normalizedUrl}`);
	}

	return normalizedUrl;
}

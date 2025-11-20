import { env } from '$env/dynamic/public';

export const APP_NAME: string = env?.['PUBLIC_APP_NAME'] ?? 'flur34';
export const SOURCE_CODE_URL: string =
	env?.['PUBLIC_SOURCE_URL'] ?? 'https://github.com/flur34/flur34';
export const DISCORD_URL: string = env?.['PUBLIC_DISCORD_URL'] ?? 'https://discord.gg/AxUnC7n9ZP';
export const SPONSOR_URL: string = env?.['PUBLIC_SPONSOR_URL'] ?? 'https://ko-fi.com/flurbudurbur';

// GitHub API URLs for version checking and release information
export const SOURCE_API_URL: string = 'https://api.github.com/repos/flur34/flur34';
export const RELEASES_URL: string = `${SOURCE_API_URL}/releases`;
export const LATEST_RELEASE_URL: string = `${RELEASES_URL}/latest`;

/**
 * Gets the canonical URL for the application.
 * Fallback hierarchy:
 * 1. PUBLIC_CANONICAL_URL (public env var, baked at build time)
 * 2. https://flur34.com (hardcoded default)
 *
 * @returns Canonical URL without trailing slash
 */
export function getCanonicalUrl(): string {
	const canonicalUrl = env?.['PUBLIC_CANONICAL_URL'];

	// Fallback to hardcoded default if not set
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

	return normalizedUrl;
}

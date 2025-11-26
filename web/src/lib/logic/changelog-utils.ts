import { RELEASES_URL } from './app-config';

export interface Changelog {
	version: string;
	name: string;
	body: string; // Pre-parsed HTML from backend
	publishedAt: string;
	url: string;
}

/**
 * Fetch changelog from backend API
 * @returns Changelog object or null if unavailable
 */
export async function fetchChangelog(): Promise<Changelog | null> {
	try {
		const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3001';
		const response = await fetch(`${backendUrl}/api/changelog`);

		if (!response.ok) {
			return null;
		}

		return response.json();
	} catch {
		return null;
	}
}

/**
 * Normalize version string by removing 'v' prefix
 * @param version - Version string (e.g., "v2.0.0" or "2.0.0")
 * @returns Normalized version without 'v' prefix
 */
export function normalizeVersion(version: string): string {
	return version.replace(/^v/i, '').trim();
}

/**
 * Check if changelog should be shown
 * @param storedVersion - Version stored in localStorage
 * @param currentVersion - Current app version
 * @returns true if changelog should be shown
 */
export function shouldShowChangelog(storedVersion: string, currentVersion: string): boolean {
	// First visit - no stored version
	if (!storedVersion) return true;

	// Compare normalized versions
	return normalizeVersion(storedVersion) !== normalizeVersion(currentVersion);
}

/**
 * Get the GitHub releases URL for fallback
 */
export function getReleasesUrl(): string {
	return RELEASES_URL;
}

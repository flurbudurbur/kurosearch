/**
 * Changelog service
 * Fetches and caches the latest GitHub release changelog at startup
 */

import snarkdown from 'snarkdown';

export interface Changelog {
	version: string;
	name: string;
	body: string; // Pre-parsed HTML
	publishedAt: string;
	url: string;
}

let cachedChangelog: Changelog | null = null;

/**
 * Fetch the latest release changelog from GitHub
 * @param repo - GitHub repository in format "owner/repo"
 * @param retries - Number of retry attempts (default: 3)
 * @returns Changelog object or null on failure
 */
async function fetchLatestChangelog(repo: string, retries = 3): Promise<Changelog | null> {
	const url = `https://api.github.com/repos/${repo}/releases/latest`;

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, {
				headers: {
					Accept: 'application/vnd.github+json',
					'User-Agent': 'Kurosearch-Backend'
				}
			});

			if (response.ok) {
				const data = (await response.json()) as {
					tag_name?: string;
					name?: string;
					body?: string;
					published_at?: string;
					html_url?: string;
				};

				return {
					version: (data.tag_name || '').replace(/^v/i, ''),
					name: data.name || '',
					body: snarkdown(data.body || ''),
					publishedAt: data.published_at || '',
					url: data.html_url || ''
				};
			}

			// If rate limited or server error, retry
			if (response.status === 403 || response.status >= 500) {
				if (attempt < retries) {
					const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
					await new Promise((resolve) => setTimeout(resolve, delay));
					continue;
				}
			}

			// Client error (404, etc.) - don't retry
			return null;
		} catch {
			if (attempt < retries) {
				const delay = Math.pow(2, attempt - 1) * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}
			return null;
		}
	}

	return null;
}

/**
 * Initialize changelog by fetching from GitHub
 * Should be called once at application startup
 * @param repo - GitHub repository in format "owner/repo"
 */
export async function initializeChangelog(repo: string): Promise<void> {
	// Skip if placeholder repo
	if (repo === 'owner/repo') {
		cachedChangelog = null;
		return;
	}

	cachedChangelog = await fetchLatestChangelog(repo);
}

/**
 * Get the cached changelog
 * @returns Cached changelog object or null if unavailable
 */
export function getChangelog(): Changelog | null {
	return cachedChangelog;
}

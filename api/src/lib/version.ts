/**
 * Version service
 * Fetches and caches the latest GitHub release version at startup
 */

let cachedVersion: string = 'Unavailable';

/**
 * Fetch the latest release from GitHub
 * @param repo - GitHub repository in format "owner/repo"
 * @param retries - Number of retry attempts (default: 3)
 * @returns Latest release tag name or 'Unavailable' on failure
 */
async function fetchLatestRelease(repo: string, retries = 3): Promise<string> {
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
				const data = (await response.json()) as { tag_name?: string };
				return data.tag_name || 'Unavailable';
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
			return 'Unavailable';
		} catch {
			if (attempt < retries) {
				const delay = Math.pow(2, attempt - 1) * 1000;
				await new Promise((resolve) => setTimeout(resolve, delay));
				continue;
			}
			return 'Unavailable';
		}
	}

	return 'Unavailable';
}

/**
 * Initialize version by fetching from GitHub
 * Should be called once at application startup
 * @param repo - GitHub repository in format "owner/repo"
 */
export async function initializeVersion(repo: string): Promise<void> {
	// Skip if placeholder repo
	if (repo === 'owner/repo') {
		cachedVersion = 'Unavailable (no repo configured)';
		return;
	}

	cachedVersion = await fetchLatestRelease(repo);
}

/**
 * Get the cached version
 * @returns Cached version string
 */
export function getVersion(): string {
	return cachedVersion;
}

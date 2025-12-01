/**
 * Instances cache service
 * Fetches and caches instances data from a GitHub-hosted JSON file with TTL-based refresh
 */

export interface InstanceDetails {
	version: string;
	last_check: number; // Epoch milliseconds
	uptime: number;
}

export interface Instance {
	name: string;
	url: string;
	country: string;
	description: string;
	source_url: string;
	status: number;
	details: InstanceDetails;
}

export interface InstancesData {
	version: string;
	instances: Instance[];
}

interface CacheEntry {
	data: InstancesData;
	fetchedAt: number;
	expiresAt: number;
}

let cache: CacheEntry | null = null;
let instancesUrl: string = '';
let cacheTtlMs: number = 300000; // Default 5 minutes
let refreshInProgress = false;

/**
 * Fetch instances data from the configured URL
 * @param retries - Number of retry attempts (default: 3)
 * @returns InstancesData or null on failure
 */
async function fetchInstances(retries = 3): Promise<InstancesData | null> {
	if (!instancesUrl) {
		return null;
	}

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const response = await fetch(instancesUrl, {
				headers: {
					Accept: 'application/json',
					'User-Agent': 'Flur34-Backend'
				}
			});

			if (response.ok) {
				const data = (await response.json()) as InstancesData;

				// Validate the response structure
				if (!data.instances || !Array.isArray(data.instances)) {
					return null;
				}

				return {
					version: data.version || '1.0.0',
					instances: data.instances.map((instance) => ({
						name: instance.name || '',
						url: instance.url || '',
						country: instance.country || '',
						description: instance.description || '',
						source_url: instance.source_url || '',
						status: instance.status ?? 0,
						details: {
							version: instance.details?.version || 'N/A',
							last_check: instance.details?.last_check ?? 0,
							uptime: instance.details?.uptime ?? 0
						}
					}))
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
 * Refresh the cache in the background (stale-while-revalidate pattern)
 */
async function backgroundRefresh(): Promise<void> {
	if (refreshInProgress) {
		return;
	}

	refreshInProgress = true;
	try {
		const data = await fetchInstances();
		if (data) {
			const now = Date.now();
			cache = {
				data,
				fetchedAt: now,
				expiresAt: now + cacheTtlMs
			};
		}
	} finally {
		refreshInProgress = false;
	}
}

/**
 * Initialize the instances cache
 * @param url - URL to fetch instances JSON from (GitHub raw URL)
 * @param ttlMs - Cache TTL in milliseconds (default: 300000 = 5 minutes)
 */
export async function initializeInstances(url: string, ttlMs = 300000): Promise<void> {
	instancesUrl = url;
	cacheTtlMs = ttlMs;

	// Skip if no URL configured
	if (!url) {
		cache = null;
		return;
	}

	// Initial fetch
	const data = await fetchInstances();
	if (data) {
		const now = Date.now();
		cache = {
			data,
			fetchedAt: now,
			expiresAt: now + cacheTtlMs
		};
	}
}

/**
 * Get the cached instances data
 * If cache is stale, triggers a background refresh but still returns cached data
 * @returns Cached InstancesData or null if unavailable
 */
export function getInstances(): InstancesData | null {
	if (!cache) {
		return null;
	}

	const now = Date.now();

	// If expired, trigger background refresh but still return stale data
	if (now >= cache.expiresAt) {
		backgroundRefresh();
	}

	return cache.data;
}

/**
 * Force refresh the instances cache
 * Useful for manual cache invalidation
 */
export async function refreshInstances(): Promise<void> {
	await backgroundRefresh();
}

/**
 * Check if the instances cache is configured
 * @returns true if URL is configured
 */
export function isInstancesCacheConfigured(): boolean {
	return instancesUrl.length > 0;
}

/**
 * Get cache statistics (useful for debugging/monitoring)
 */
export function getCacheStats(): {
	configured: boolean;
	hasData: boolean;
	fetchedAt: number | null;
	expiresAt: number | null;
	isStale: boolean;
} {
	const now = Date.now();
	return {
		configured: instancesUrl.length > 0,
		hasData: cache !== null,
		fetchedAt: cache?.fetchedAt ?? null,
		expiresAt: cache?.expiresAt ?? null,
		isStale: cache ? now >= cache.expiresAt : false
	};
}

/**
 * Reset the cache (for testing purposes only)
 * @internal
 */
export function _resetCache(): void {
	cache = null;
	instancesUrl = '';
	cacheTtlMs = 300000;
	refreshInProgress = false;
}

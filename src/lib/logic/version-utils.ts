import { LATEST_RELEASE_URL, RELEASES_URL } from '$lib/logic/app-config';

export const LATEST_KUROSEARCH_VERSION = (): Promise<string> => {
	return fetch(LATEST_RELEASE_URL)
		.then((r) => {
			if (r.status === 404) {
				return { tag_name: 'Unavailable' } as { tag_name?: string; name?: string };
			}
			if (!r.ok) {
				throw new Error(`Failed to fetch latest release: ${r.status} ${r.statusText}`);
			}
			return r.json();
		})
		.then(
			(
				data:
					| {
							tag_name?: string;
							name?: string;
							prerelease?: boolean;
							draft?: boolean;
					  }
					| string
			) => {
				// If previous step returned a string, it's already the version
				if (typeof data === 'string') {
					return data;
				}

				// Prefer tag_name (e.g., "v1.1.4"); fallback to name if needed
				const raw = data?.tag_name ?? data?.name ?? 'Unavailable';

				// Normalize common "v" prefix
				const normalized = raw.replace(/^v/i, '');

				return normalized || 'Unavailable';
			}
		)
		.catch(() => 'Unavailable');
};

export const ISLATESTVERSION = async (): Promise<boolean> => {
	try {
		const [latestVersion, releases] = await Promise.all([
			LATEST_KUROSEARCH_VERSION(),
			fetch(RELEASES_URL).then((r) => {
				if (!r.ok) {
					throw new Error(`Failed to fetch releases: ${r.status} ${r.statusText}`);
				}
				return r.json();
			}) as Promise<{ tag_name: string }[]>
		]);

		// Normalize 'v' prefix and handle unavailable state
		const normalizedLatest = latestVersion.replace(/^v/i, '');
		if (!normalizedLatest || normalizedLatest === 'Unavailable') return false;

		// Newest is at index 0
		const newestTag = (releases?.[0]?.tag_name ?? '').replace(/^v/i, '');
		if (!newestTag) return false;

		return newestTag === normalizedLatest;
	} catch {
		return false;
	}
};

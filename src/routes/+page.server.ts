import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/logic/app-config';
import { logger } from '$lib/server/logger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const canonicalUrl = getCanonicalUrl(event, env);
	const { fetch } = event;

	// Fetch initial posts with default settings (sort by newest)
	// Using default page size of 100 for multi-column layouts
	try {
		const postsUrl = new URL('/api/posts', canonicalUrl);
		postsUrl.searchParams.set('fields', 'tag_info');
		postsUrl.searchParams.set('limit', '100');
		postsUrl.searchParams.set('tags', 'sort:id:desc');
		postsUrl.searchParams.set('pid', '0');

		const countUrl = new URL('/api/posts', canonicalUrl);
		countUrl.searchParams.set('limit', '0');
		countUrl.searchParams.set('tags', 'sort:id:desc');

		const [postsResponse, countResponse] = await Promise.all([
			fetch(postsUrl.toString()),
			fetch(countUrl.toString())
		]);

		const initialPosts = postsResponse.ok ? await postsResponse.json() : null;

		// Parse count from XML response
		let totalCount = 0;
		if (countResponse.ok) {
			const countXml = await countResponse.text();
			const match = countXml.match(/count="(\d+)"/);
			if (match) {
				totalCount = parseInt(match[1], 10);
			}
		}

		return {
			canonicalUrl,
			initialPosts,
			totalCount
		};
	} catch (error) {
		logger.error({ error, canonicalUrl }, 'Error fetching initial posts');
		if (error instanceof Error) {
			logger.error({ message: error.message, stack: error.stack }, 'Error details');
		}
		// Return without initial data if fetch fails
		return {
			canonicalUrl,
			initialPosts: null,
			totalCount: 0
		};
	}
};

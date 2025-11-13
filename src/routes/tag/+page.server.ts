import type { PageServerLoad } from './$types';
import { parseXml } from '$lib/logic/parse-utils';
import { withCache, CACHE_TTL } from '$lib/server/cache-utils';

export const load: PageServerLoad = async ({ url }) => {
	const name = url.searchParams.get('name');

	if (!name) {
		return { name: null, tagData: null };
	}

	// Cache tag data for 1 hour (tags don't change frequently)
	const cacheKey = `kurosearch:tag:${name}`;
	const { data: tagData } = await withCache(
		cacheKey,
		{ ttl: CACHE_TTL.TAGS, prefix: 'kurosearch:tag:' },
		async () => {
			const response = await fetch(
				`https://rule34.xxx/index.php?page=tags&s=list&tags=${name}&sort=asc&order_by=index_count`
			);
			const text = await response.text();
			const xml = parseXml(text);
			const tds = xml?.querySelectorAll('#content tr td')?.values();

			return JSON.stringify(tds);
		}
	);

	return {
		name,
		tagData
	};
};

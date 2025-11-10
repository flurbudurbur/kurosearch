import { env } from '$env/dynamic/private';
import { getCanonicalUrl } from '$lib/logic/app-config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url, ...event }) => {
	const canonicalUrl = getCanonicalUrl({ url, ...event }, env);

	return {
		canonicalUrl
	};
};

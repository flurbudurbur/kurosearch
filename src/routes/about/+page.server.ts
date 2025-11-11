import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async (): Promise<{
	containerVersion: string;
	githubSha: string | undefined;
}> => {
	return {
		containerVersion: env.CONTAINER_VERSION ?? 'Unavailable',
		githubSha: env.GITHUB_SHA
	};
};

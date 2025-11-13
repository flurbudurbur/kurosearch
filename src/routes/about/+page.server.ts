import type { PageServerLoad } from './$types';
import { getLatestVersion, getGithubSha, getContainerVersion } from '$lib/server/version';

export const load: PageServerLoad = (): {
	containerVersion: string;
	githubSha: string | undefined;
	latestVersion: string;
} => {
	return {
		containerVersion: getContainerVersion(),
		githubSha: getGithubSha(),
		latestVersion: getLatestVersion()
	};
};

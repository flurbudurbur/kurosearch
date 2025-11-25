import { getVersion } from '../../lib/version.js';

interface VersionResponse {
	containerVersion: string;
}

/**
 * HTTP handler for GET /version
 */
export async function getVersionInfo(): Promise<VersionResponse> {
	return {
		containerVersion: getVersion()
	};
}

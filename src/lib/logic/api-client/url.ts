import { env } from '$env/dynamic/public';

// Use mock server during E2E tests, otherwise use production API
// Note: URL must NOT have trailing slash to match production behavior
export const R34_API_URL =
	env?.PUBLIC_MOCK_R34_API === 'true' ? 'http://localhost:3334' : 'https://api.rule34.xxx';

export const SOURCE_API_URL = `https://api.github.com/repos/flur34/flur34`;
export const RELEASES_URL = `${SOURCE_API_URL}/releases`;
export const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;

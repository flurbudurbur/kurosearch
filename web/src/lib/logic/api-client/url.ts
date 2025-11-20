import { env } from '$env/dynamic/public';

/**
 * @deprecated This file is deprecated. For application configuration constants,
 * use `$lib/logic/app-config` instead.
 *
 * This file only exports R34_API_URL for test infrastructure support.
 * All other constants have been migrated to app-config.ts:
 * - SOURCE_API_URL → app-config.ts
 * - RELEASES_URL → app-config.ts
 * - LATEST_RELEASE_URL → app-config.ts
 */

// Use mock server during E2E tests, otherwise use production API
// Note: URL must NOT have trailing slash to match production behavior
export const R34_API_URL =
	env?.PUBLIC_MOCK_R34_API === 'true' ? 'http://localhost:3334' : 'https://api.rule34.xxx';

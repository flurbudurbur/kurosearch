/**
 * Playwright Global Teardown for E2E Tests
 *
 * Stops the mock Rule34 API server after all E2E tests complete.
 */

import { stopMockServer } from './mock-server';

export default async function globalTeardown() {
	await stopMockServer();
	console.log('E2E global teardown complete - mock server stopped');
}

/**
 * Playwright Global Setup for E2E Tests
 *
 * Starts the mock Rule34 API server before running E2E tests.
 * This allows E2E tests to run without hitting the production API.
 */

import { startMockServer } from './mock-server';

export default async function globalSetup() {
	// Set environment variable to use mock API
	process.env.PUBLIC_MOCK_R34_API = 'true';

	// Start the mock server
	await startMockServer();

	console.log('E2E global setup complete - mock server running');
}

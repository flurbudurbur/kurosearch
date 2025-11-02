/**
 * E2E Test Helpers
 *
 * Utilities for setting up mocked API responses in E2E tests.
 * Reuses the ApiMocker from integration tests to ensure consistent mock data.
 */

import type { Browser, APIRequestContext } from '@playwright/test';
import { ApiMocker } from '../integration/mocks/mocker';

/**
 * Sets up API mocking for E2E tests using the same mock data as integration tests.
 *
 * This creates a browser context with route interception configured, allowing
 * E2E tests to use the request fixture while having mocked API responses.
 *
 * @param browser - Playwright browser instance
 * @returns Cleanup function to close the browser context
 *
 * @example
 * ```ts
 * test('should fetch posts', async ({ browser, request }) => {
 *   const cleanup = await setupMockedE2E(browser);
 *
 *   const response = await request.get('/api/posts?tags=sfw');
 *   expect(response.status()).toBe(200);
 *
 *   await cleanup();
 * });
 * ```
 */
export async function setupMockedE2E(browser: Browser): Promise<() => Promise<void>> {
	// Create a browser context for setting up route mocks
	const context = await browser.newContext();
	const page = await context.newPage();

	// Use ApiMocker to set up all the mock routes
	const mocker = new ApiMocker(page);
	await mocker.mockAll();

	// Return cleanup function
	return async () => {
		await page.close();
		await context.close();
	};
}

/**
 * Sets up specific API endpoint mocks for E2E tests.
 * Useful when you only need to mock certain endpoints.
 *
 * @param browser - Playwright browser instance
 * @param setup - Function that receives ApiMocker instance to configure specific mocks
 * @returns Cleanup function to close the browser context
 *
 * @example
 * ```ts
 * test('should handle post errors', async ({ browser, request }) => {
 *   const cleanup = await setupCustomMockedE2E(browser, async (mocker) => {
 *     await mocker.mockPostsServerError();
 *     await mocker.mockTags();
 *   });
 *
 *   const response = await request.get('/api/posts');
 *   expect(response.status()).toBe(500);
 *
 *   await cleanup();
 * });
 * ```
 */
export async function setupCustomMockedE2E(
	browser: Browser,
	setup: (mocker: ApiMocker) => Promise<void>
): Promise<() => Promise<void>> {
	const context = await browser.newContext();
	const page = await context.newPage();

	const mocker = new ApiMocker(page);
	await setup(mocker);

	return async () => {
		await page.close();
		await context.close();
	};
}

/**
 * Creates a configured APIRequestContext with base URL.
 * Useful for E2E tests that need a custom request context.
 *
 * @param request - Playwright APIRequestContext
 * @returns Configured request context
 */
export function createE2ERequest(request: APIRequestContext): APIRequestContext {
	return request;
}

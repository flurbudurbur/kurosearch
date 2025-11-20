import { test as base, type Page } from '@playwright/test';
import { ApiMocker } from './mocks/mocker';

/**
 * Integration Test Fixtures
 *
 * Most integration tests now use the global mock server (tests/e2e/mock-server.ts)
 * which runs automatically for all Playwright tests. The mockApi fixture is only
 * needed for error-handling and edge-case tests that require custom mock behavior.
 */

type Fixtures = {
	pageWithTag: void;
	mockApi: ApiMocker;
};

/**
 * Register static route interceptors that prevent tests from hitting the real
 * internet for common external resources (GitHub releases and the rule34 CDNs).
 */
async function setupStaticInterceptors(page: Page) {
	// tiny 1x1 PNG (base64)
	const tinyPng = Buffer.from(
		'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
		'base64'
	);

	// Mock GitHub releases endpoints minimally
	await page.route('https://api.github.com/repos/flur34/flur34/releases/latest', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ tag_name: 'v0.0.0', name: '0.0.0' })
		});
	});
	await page.route('https://api.github.com/repos/flur34/flur34/releases', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([])
		});
	});

	// Intercept Rule34 CDN image requests and return a tiny PNG; abort heavy video requests
	const cdnHandler = async (route: any) => {
		const url: string = route.request().url();
		if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mkv')) {
			// Avoid streaming large video files in tests
			await route.abort();
			return;
		}

		// Return tiny PNG for images/gifs (safe default)
		await route.fulfill({
			status: 200,
			headers: { 'Content-Type': 'image/png' },
			body: tinyPng
		});
	};

	// Common CDN host patterns used in mock data
	await page.route('**/api-cdn-mp4.rule34.xxx/**', async (route) => await route.abort());
	await page.route('**/api-cdn.rule34.xxx/**', cdnHandler);
}

export const test = base.extend<Fixtures>({
	pageWithTag: async ({ page }, use) => {
		// Ensure static interceptors are registered before any navigation
		await setupStaticInterceptors(page);

		// Navigate to home page
		await page.goto('/');

		// Search for and select 'sfw' tag - optimized delay
		const searchBox = page.getByRole('combobox', { name: 'Search for tags' });
		await searchBox.click();
		// Reduce delay from 100ms to 50ms - still triggers events but 2x faster
		await searchBox.pressSequentially('sfw', { delay: 50 });

		// Wait for suggestions and click the first sfw tag option
		await page.waitForSelector('[role="option"]', { timeout: 5000 });
		await page
			.getByRole('option', { name: /^sfw tag, .* posts$/ })
			.first()
			.click();

		// Click search button
		await page.getByRole('button', { name: 'Search with the selected tags' }).click();

		// Use 'load' instead of 'networkidle' for faster page loads with mocked data
		await page.waitForLoadState('load');

		// Now the page is ready with a tag selected
		await use();
	},

	/**
	 * mockApi fixture - for error handling and edge case tests only
	 *
	 * Use this fixture when you need to test error scenarios like:
	 * - Server errors (500)
	 * - Network failures
	 * - Empty responses
	 * - Slow responses
	 * - Malformed data
	 *
	 * For normal tests, the global mock server provides default mock data automatically.
	 */
	mockApi: async ({ page }, use) => {
		// Ensure static interceptors are available for tests that use mockApi
		await setupStaticInterceptors(page);

		// Create ApiMocker instance
		const mocker = new ApiMocker(page);

		// Make it available to the test
		await use(mocker);

		// Cleanup after test
		await mocker.unrouteAll();
		mocker.resetSyncCodes();
	}
});

export { expect } from '@playwright/test';

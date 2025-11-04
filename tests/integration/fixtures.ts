import { test as base } from '@playwright/test';
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

export const test = base.extend<Fixtures>({
	pageWithTag: async ({ page }, use) => {
		// Navigate to home page
		await page.goto('http://localhost:5173/');

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

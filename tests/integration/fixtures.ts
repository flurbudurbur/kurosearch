import { test as base } from '@playwright/test';

type Fixtures = {
	pageWithTag: void;
};

export const test = base.extend<Fixtures>({
	pageWithTag: async ({ page }, use) => {
		// Navigate to home page
		await page.goto('http://localhost:5173/');

		// Search for and select 'sfw' tag
		const searchBox = page.getByRole('combobox', { name: 'Search for tags' });
		await searchBox.click();
		await searchBox.pressSequentially('sfw', { delay: 100 });

		// Wait for suggestions and click the first sfw tag option
		await page.waitForSelector('[role="option"]', { timeout: 5000 });
		await page
			.getByRole('option', { name: /^sfw tag, .* posts$/ })
			.first()
			.click();

		// Click search button
		await page.getByRole('button', { name: 'Search with the selected tags' }).click();

		// Wait for results to load
		await page.waitForLoadState('networkidle');

		// Now the page is ready with a tag selected
		await use();
	}
});

export { expect } from '@playwright/test';

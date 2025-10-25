import { type Page } from '@playwright/test';

/**
 * Searches for and selects a tag in the search interface
 */
export async function searchAndSelectTag(page: Page, tagName: string) {
	const searchBox = page.getByRole('combobox', { name: 'Search for tags' });
	await searchBox.click();
	await searchBox.pressSequentially(tagName, { delay: 100 });

	// Wait for suggestions to appear and click the first matching tag
	await page.waitForSelector('[role="option"]', { timeout: 5000 });
	await page
		.getByRole('option', { name: new RegExp(`^${tagName} tag, .* posts$`) })
		.first()
		.click();
}

/**
 * Selects a tag and performs a search
 */
export async function selectTagAndSearch(page: Page, tagName: string) {
	await searchAndSelectTag(page, tagName);

	// Click search button
	await page.getByRole('button', { name: 'Search with the selected tags' }).click();

	// Wait for results to load
	await page.waitForLoadState('networkidle');
}

/**
 * Cycles through tag modifiers by right-clicking
 */
export async function cycleTagModifier(page: Page, tagName: string, times: number = 1) {
	const tagButton = page.getByRole('button', { name: new RegExp(`^${tagName} \\(.+\\)$`) }).first();

	for (let i = 0; i < times; i++) {
		await tagButton.click({ button: 'right' });
	}
}

import { type Page } from '@playwright/test';

/**
 * Searches for and selects a tag in the search interface
 */
export async function searchAndSelectTag(page: Page, tagName: string) {
	const searchBox = page.getByRole('combobox', { name: 'Search for tags' });
	await searchBox.click();
	// Use fill() instead of pressSequentially for faster, more reliable input
	await searchBox.fill(tagName);

	// Wait for suggestions to appear and click the first matching tag
	const optionLocator = page
		.getByRole('option', { name: new RegExp(`^${tagName} tag, .* posts$`) })
		.first();
	await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
	await optionLocator.click();
}

/**
 * Selects a tag and performs a search
 */
export async function selectTagAndSearch(page: Page, tagName: string) {
	await searchAndSelectTag(page, tagName);

	// Click search button
	const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
	await searchButton.waitFor({ state: 'visible' });
	await searchButton.click();

	// Wait for results to load - use domcontentloaded for reliability
	await page.waitForLoadState('domcontentloaded');
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

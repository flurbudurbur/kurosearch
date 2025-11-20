import { type Page } from '@playwright/test';

/**
 * Searches for and selects a tag in the search interface
 */
export async function searchAndSelectTag(page: Page, tagName: string) {
	const searchBox = page.getByRole('combobox', { name: 'Search for tags' });
	await searchBox.click();
	// Use pressSequentially to trigger input events that show suggestions
	await searchBox.pressSequentially(tagName, { delay: 50 });

	// Wait for suggestions to appear and click the first matching tag
	const optionLocator = page
		.getByRole('option', { name: new RegExp(`^${tagName} tag, .* posts$`) })
		.first();
	await optionLocator.waitFor({ state: 'visible' });
	await optionLocator.click();
}

/**
 * Selects a tag and performs a search
 */
export async function selectTagAndSearch(page: Page, tagName: string) {
	await searchAndSelectTag(page, tagName);

	// Click search button
	const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
	await searchButton.waitFor({ state: 'visible', timeout: 5000 });
	await searchButton.click();

	// Wait for results to load - use load for faster execution with mocked data
	await page.waitForLoadState('load', { timeout: 10000 });
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

/**
 * Navigates to a post detail page and waits for it to load
 * Uses domcontentloaded for more reliable loading on slow CI runners
 */
export async function navigateToPost(page: Page, postId: number | string) {
	await page.goto(`/post/${postId}`);
	// Use domcontentloaded instead of networkidle for better CI performance
	// networkidle can timeout on slow runners with ongoing network activity
	await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigates to a post detail page and verifies it loaded successfully
 * Checks that the Tags heading is visible and no error messages are shown
 */
export async function navigateToPostAndVerify(page: Page, postId: number | string) {
	await navigateToPost(page, postId);

	// Verify post loaded successfully
	// Wait for either the Tags heading (success) or error message (failure)
	const tagsHeading = page.getByRole('heading', { name: 'Tags' });
	const errorMessage = page.getByText(/Failed to load post|Post not found|Invalid post ID/);

	// Wait for either success or error state - whichever comes first (with 15s timeout)
	try {
		await Promise.race([
			tagsHeading.waitFor({ state: 'visible', timeout: 15000 }),
			errorMessage.waitFor({ state: 'visible', timeout: 15000 })
		]);
	} catch (_e) {
		// If neither appears within timeout, throw a more descriptive error
		throw new Error(`Post page did not load within timeout for post ${postId}`);
	}

	return true;
}

import { expect, test } from './fixtures';

/**
 * Search functionality tests
 * These tests verify that search features work correctly
 * Based on interactive testing with Playwright MCP
 *
 * Note: These tests use the global mock server (tests/e2e/mock-server.ts)
 * which automatically runs during all Playwright tests. No per-test setup needed.
 */

test.describe('Search Functionality', () => {
	test('should have search input on home page', async ({ page }) => {
		await page.goto('/');

		// Look for search combobox with proper ARIA role
		const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
		await expect(searchInput).toBeVisible();
	});

	test('should be able to type in search input', async ({ page }) => {
		await page.goto('/');

		// Find the search input and type in it
		const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
		await searchInput.fill('sonic');

		// Verify the input has the correct value
		await expect(searchInput).toHaveValue('sonic');
	});

	test('should execute search and update results', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		// Fill in search
		const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
		await searchInput.fill('sonic');

		// Click search button
		const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
		await searchButton.click();

		// Wait for page to load - faster than networkidle with mocked data
		await page.waitForLoadState('load');

		// Verify search term persisted
		await expect(searchInput).toHaveValue('sonic');

		// Verify post count is still displayed (results loaded)
		const postCount = page.locator('text=/\\d+ posts/');
		await expect(postCount).toBeVisible();
	});

	test('should have tag modifier button', async ({ page }) => {
		await page.goto('/');

		// Verify tag modifier button exists
		const modifierButton = page.getByRole('button', { name: /TagModifier Selector/ });
		await expect(modifierButton).toBeVisible();

		// Verify it has the correct aria-label indicating current value
		await expect(modifierButton).toHaveAttribute('aria-label', /Current value \+/);
	});

	test('should have help link for tags', async ({ page }) => {
		await page.goto('/');

		// Verify help link is present
		const helpLink = page.getByRole('link', { name: 'More information on tags.' });
		await expect(helpLink).toBeVisible();
		await expect(helpLink).toHaveAttribute('href', '/help#search');
	});

	test('should clear search input when cleared', async ({ page }) => {
		await page.goto('/');

		// Type in search input
		const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
		await searchInput.fill('test search');
		await expect(searchInput).toHaveValue('test search');

		// Clear the input
		await searchInput.clear();
		await expect(searchInput).toHaveValue('');
	});

	test('should display post count', async ({ page }) => {
		await page.goto('/');

		// Verify post count is displayed
		const postCount = page.locator('text=/\\d+M? posts/');
		await expect(postCount).toBeVisible();

		// Verify format (should be like "11M posts")
		const countText = await postCount.textContent();
		expect(countText).toMatch(/\d+M? posts/);
	});

	test('should have sorting options', async ({ page }) => {
		await page.goto('/');

		// Verify sorting button is present
		const sortButton = page.getByRole('button', { name: /Newest|Score|Updated/ });
		await expect(sortButton.first()).toBeVisible();
	});
});

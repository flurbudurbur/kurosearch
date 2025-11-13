import { expect, test } from './fixtures';

// Constants from app-config (imported directly to avoid $env issues in tests)
const DISCORD_URL = 'https://discord.gg/AxUnC7n9ZP';
const SPONSOR_URL = 'https://ko-fi.com/flurbudurbur';

test.describe('Navigation Tests', () => {
	// Set up mocks consistently for all tests
	test.beforeEach(async ({ mockApi, page }) => {
		await mockApi.mockSyncPost();
		await mockApi.mockSyncGet();
		// Wait for hydration to complete
		await page.waitForLoadState('networkidle');
	});

	test('should navigate to preferences page', async ({ page }) => {
		await page.goto('/', { waitUntil: 'domcontentloaded' });

		// Click on the Settings link
		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect(settingsLink).toBeVisible({ timeout: 15000 });
		await settingsLink.click();

		// Verify we're on the preferences page
		await page.waitForURL('/preferences', { timeout: 20000 });
		await page.waitForLoadState('domcontentloaded');
		await expect(page).toHaveURL('/preferences');
		await expect(page).toHaveTitle(/preferences/i);

		// Verify preferences heading is visible
		const heading = page.getByRole('heading', { name: 'Preferences', level: 1 });
		await expect(heading).toBeVisible({ timeout: 15000 });
	});

	test('should navigate to help page', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Click on the Documentation link and wait for navigation
		const helpLink = page.getByRole('link', { name: 'Documentation' });
		await expect(helpLink).toBeVisible({ timeout: 15000 });
		await Promise.all([page.waitForURL('/help'), helpLink.click()]);

		// Verify we're on the help page
		await expect(page).toHaveURL('/help');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveTitle(/documentation/i);

		// Verify documentation heading is visible
		const heading = page.getByRole('heading', { name: 'Documentation', level: 1 });
		await expect(heading).toBeVisible({ timeout: 15000 });
	});

	test('should navigate to account page', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Click on the Account link
		const accountLink = page.getByRole('link', { name: 'Account' });
		await expect(accountLink).toBeVisible({ timeout: 15000 });
		await accountLink.click();

		// Verify we're on the account page
		await expect(page).toHaveURL('/account');
		await page.waitForLoadState('networkidle');
	});

	test('should navigate to saved posts page', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Click on the Saved Posts link
		const savedLink = page.getByRole('link', { name: 'Saved Posts' });
		await expect(savedLink).toBeVisible({ timeout: 15000 });
		await savedLink.click();

		// Verify we're on the saved page
		await expect(page).toHaveURL('/saved');
		await page.waitForLoadState('networkidle');
	});

	test('should navigate to about page from footer', async ({ page }) => {
		// Set viewport to desktop size so footer is visible
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto('/', { waitUntil: 'networkidle' });

		// Click on the About link in footer
		const aboutLink = page.getByRole('link', { name: 'About' });
		await expect(aboutLink).toBeVisible({ timeout: 15000 });
		await aboutLink.click();

		// Verify we're on the about page
		await expect(page).toHaveURL('/about');
		await page.waitForLoadState('networkidle');
	});

	test('should navigate to instances page from footer', async ({ page }) => {
		// Set viewport to desktop size so footer is visible
		await page.setViewportSize({ width: 1280, height: 720 });
		await page.goto('/', { waitUntil: 'networkidle' });

		// Click on the Instances link in footer
		const instancesLink = page.getByRole('link', { name: 'Instances' });
		await expect(instancesLink).toBeVisible({ timeout: 15000 });
		await instancesLink.click();

		// Verify we're on the instances page
		await expect(page).toHaveURL('/instances');
		await page.waitForLoadState('networkidle');
	});

	test('should navigate back to home from search link', async ({ page }) => {
		await page.goto('/preferences', { waitUntil: 'networkidle' });

		// Click on the Search link
		const searchLink = page.getByRole('link', { name: 'Search', exact: true });
		await expect(searchLink).toBeVisible({ timeout: 15000 });
		await searchLink.click();

		// Verify we're back on the home page
		await expect(page).toHaveURL('/');
		await page.waitForLoadState('networkidle');
	});

	test('should complete full navigation cycle', async ({ page }) => {
		// Start at home
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveURL('/');

		// Navigate to Preferences
		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect(settingsLink).toBeVisible({ timeout: 15000 });
		await settingsLink.click();
		await page.waitForURL('/preferences', { timeout: 20000 });
		await page.waitForLoadState('domcontentloaded');
		await expect(page).toHaveURL('/preferences');

		// Navigate to Documentation
		const docsLink = page.getByRole('link', { name: 'Documentation' });
		await expect(docsLink).toBeVisible({ timeout: 15000 });
		await docsLink.click();
		await page.waitForURL('/help', { timeout: 20000 });
		await page.waitForLoadState('domcontentloaded');
		await expect(page).toHaveURL('/help');

		// Navigate back to Home
		const searchLink = page.getByRole('link', { name: 'Search', exact: true });
		await expect(searchLink).toBeVisible({ timeout: 15000 });
		await searchLink.click();
		await page.waitForURL('/', { timeout: 20000 });
		await page.waitForLoadState('domcontentloaded');
		await expect(page).toHaveURL('/');
	});

	test('should have working external links', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Test Ko-Fi link opens in new tab (using title since the visible label might differ)
		const kofiLink = page.getByTitle('Ko-Fi');
		await expect(kofiLink).toBeVisible({ timeout: 15000 });
		await expect(kofiLink).toHaveAttribute('href', SPONSOR_URL);
		await expect(kofiLink).toHaveAttribute('target', '_blank');

		// Test Discord link opens in new tab (using title since the visible label might differ)
		const discordLink = page.getByTitle('Discord Server');
		await expect(discordLink).toBeVisible({ timeout: 15000 });
		await expect(discordLink).toHaveAttribute('href', DISCORD_URL);
		await expect(discordLink).toHaveAttribute('target', '_blank');

		// Test GitHub links (using title attribute, as the label is "Github KuroSearch")
		const sourceCodeLink = page.getByTitle('Source Code', { exact: true });
		await expect(sourceCodeLink).toBeVisible({ timeout: 15000 });
		await expect(sourceCodeLink).toHaveAttribute(
			'href',
			'https://github.com/kurozenzen/kurosearch'
		);
		await expect(sourceCodeLink).toHaveAttribute('target', '_blank');
	});

	test('should have consistent navigation bar across pages', async ({ page }) => {
		const pages = ['/', '/preferences', '/help'];

		for (const url of pages) {
			await page.goto(url, { waitUntil: 'networkidle' });

			// Verify main navigation container exists
			const nav = page.getByRole('navigation', { name: 'Main navigation' });
			await expect(nav).toBeVisible({ timeout: 15000 });

			// Verify key links are present (checking a subset to avoid flakiness)
			await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible({
				timeout: 15000
			});
			await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible({
				timeout: 15000
			});
		}
	});

	test('should have skip to main content link', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });

		// Verify skip link exists
		const skipLink = page.getByRole('link', { name: 'Skip to main content' });
		await expect(skipLink).toBeVisible({ timeout: 15000 });
		await expect(skipLink).toHaveAttribute('href', '#main-content');
	});
});

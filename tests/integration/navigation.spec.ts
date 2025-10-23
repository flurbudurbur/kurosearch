import { expect, test } from '@playwright/test';

/**
 * Navigation tests using Playwright MCP
 * These tests verify that the main navigation flows work correctly
 * Based on interactive testing with Playwright MCP
 */

test.describe('Navigation Tests', () => {
	test('should navigate to preferences page', async ({ page }) => {
		await page.goto('/');

		// Click on the Settings link
		const settingsLink = page.getByRole('link', { name: 'Settings' });
		await expect(settingsLink).toBeVisible();
		await settingsLink.click();

		// Verify we're on the preferences page
		await expect(page).toHaveURL('/preferences');
		await expect(page).toHaveTitle(/preferences/i);

		// Verify preferences heading is visible
		const heading = page.getByRole('heading', { name: 'Preferences', level: 1 });
		await expect(heading).toBeVisible();
	});

	test('should navigate to help page', async ({ page }) => {
		await page.goto('/');

		// Click on the Documentation link
		const helpLink = page.getByRole('link', { name: 'Documentation' });
		await expect(helpLink).toBeVisible();
		await helpLink.click();

		// Verify we're on the help page
		await expect(page).toHaveURL('/help');
		await expect(page).toHaveTitle(/documentation/i);

		// Verify documentation heading is visible
		const heading = page.getByRole('heading', { name: 'Documentation', level: 1 });
		await expect(heading).toBeVisible();
	});

	test('should navigate to account page', async ({ page }) => {
		await page.goto('/');

		// Click on the Account link
		const accountLink = page.getByRole('link', { name: 'Account' });
		await expect(accountLink).toBeVisible();
		await accountLink.click();

		// Verify we're on the account page
		await expect(page).toHaveURL('/account');
	});

	test('should navigate to saved posts page', async ({ page }) => {
		await page.goto('/');

		// Click on the Saved Posts link
		const savedLink = page.getByRole('link', { name: 'Saved Posts' });
		await expect(savedLink).toBeVisible();
		await savedLink.click();

		// Verify we're on the saved page
		await expect(page).toHaveURL('/saved');
	});

	test('should navigate to about page from footer', async ({ page }) => {
		await page.goto('/');

		// Click on the About link in footer
		const aboutLink = page.getByRole('link', { name: 'About' });
		await expect(aboutLink).toBeVisible();
		await aboutLink.click();

		// Verify we're on the about page
		await expect(page).toHaveURL('/about');
	});

	test('should navigate to instances page from footer', async ({ page }) => {
		await page.goto('/');

		// Click on the Instances link in footer
		const instancesLink = page.getByRole('link', { name: 'Instances' });
		await expect(instancesLink).toBeVisible();
		await instancesLink.click();

		// Verify we're on the instances page
		await expect(page).toHaveURL('/instances');
	});

	test('should navigate back to home from search link', async ({ page }) => {
		await page.goto('/preferences');

		// Click on the Search link
		const searchLink = page.getByRole('link', { name: 'Search', exact: true });
		await expect(searchLink).toBeVisible();
		await searchLink.click();

		// Verify we're back on the home page
		await expect(page).toHaveURL('/');
	});

	test('should complete full navigation cycle', async ({ page }) => {
		// Start at home
		await page.goto('/');
		await expect(page).toHaveURL('/');

		// Navigate to Preferences
		await page.getByRole('link', { name: 'Settings' }).click();
		await expect(page).toHaveURL('/preferences');

		// Navigate to Documentation
		await page.getByRole('link', { name: 'Documentation' }).click();
		await expect(page).toHaveURL('/help');

		// Navigate back to Home
		await page.getByRole('link', { name: 'Search', exact: true }).click();
		await expect(page).toHaveURL('/');
	});

	test('should have working external links', async ({ page }) => {
		await page.goto('/');

		// Test Ko-Fi link opens in new tab
		const kofiLink = page.getByRole('link', { name: 'Ko-Fi' });
		await expect(kofiLink).toHaveAttribute('href', 'https://ko-fi.com/flurbudurbur');
		await expect(kofiLink).toHaveAttribute('target', '_blank');

		// Test Discord link opens in new tab
		const discordLink = page.getByRole('link', { name: 'Discord Server' });
		await expect(discordLink).toHaveAttribute('href', 'https://discord.gg/AxUnC7n9ZP');
		await expect(discordLink).toHaveAttribute('target', '_blank');

		// Test GitHub links
		const sourceCodeLink = page.getByRole('link', { name: 'Source Code', exact: true });
		await expect(sourceCodeLink).toHaveAttribute(
			'href',
			'https://github.com/kurozenzen/kurosearch'
		);
		await expect(sourceCodeLink).toHaveAttribute('target', '_blank');
	});

	test('should have consistent navigation bar across pages', async ({ page }) => {
		const pages = ['/', '/preferences', '/help'];

		for (const url of pages) {
			await page.goto(url);

			// Verify main navigation container exists
			const nav = page.getByRole('navigation', { name: 'Main navigation' });
			await expect(nav).toBeVisible();

			// Verify key links are present (checking a subset to avoid flakiness)
			await expect(page.getByRole('link', { name: 'Documentation' })).toBeVisible();
			await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
		}
	});

	test('should have skip to main content link', async ({ page }) => {
		await page.goto('/');

		// Verify skip link exists
		const skipLink = page.getByRole('link', { name: 'Skip to main content' });
		await expect(skipLink).toBeVisible();
		await expect(skipLink).toHaveAttribute('href', '#main-content');
	});
});

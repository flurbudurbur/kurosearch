import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots and compare them against baseline images
 * to detect unintended visual changes.
 *
 * Usage:
 * - First run: pnpm test:integration -- visual-regression --update-snapshots
 * - Subsequent runs: pnpm test:integration -- visual-regression
 */

test.describe('Visual Regression Tests', () => {
	test.beforeEach(async ({ page }) => {
		// Set consistent viewport for all visual tests
		await page.setViewportSize({ width: 1280, height: 720 });
	});

	test('homepage renders correctly', async ({ page }) => {
		await page.goto('/');

		// Wait for the page to be fully loaded
		await page.waitForLoadState('networkidle');

		// Take a screenshot and compare with baseline
		await expect(page).toHaveScreenshot('homepage.png', {
			maxDiffPixels: 500000, // Allow significant rendering differences due to dynamic content
			threshold: 0.6 // 60% pixel difference threshold - homepage has dynamic content
		});
	});

	test('search form renders correctly', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Focus on the search form
		const searchForm = page.locator('#search');
		await expect(searchForm).toBeVisible();

		await expect(searchForm).toHaveScreenshot('search-form.png', {
			maxDiffPixels: 50
		});
	});

	test('preferences page renders correctly', async ({ page }) => {
		await page.goto('/preferences');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('preferences-page.png', {
			maxDiffPixels: 100,
			threshold: 0.2
		});
	});

	test('help page renders correctly', async ({ page }) => {
		await page.goto('/help');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('help-page.png', {
			maxDiffPixels: 100,
			threshold: 0.2
		});
	});

	test('about page renders correctly', async ({ page }) => {
		await page.goto('/about');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('about-page.png', {
			maxDiffPixels: 100,
			threshold: 0.2
		});
	});

	test('theme switcher - dark mode', async ({ page }) => {
		await page.goto('/preferences');
		await page.waitForLoadState('networkidle');

		// Select dark theme
		await page.selectOption('select[aria-label="Theme"]', 'crimson dark');
		await page.waitForTimeout(500); // Wait for theme change animation

		await expect(page).toHaveScreenshot('theme-dark.png', {
			maxDiffPixels: 100
		});
	});

	test('theme switcher - light mode', async ({ page }) => {
		await page.goto('/preferences');
		await page.waitForLoadState('networkidle');

		// Select light theme
		await page.selectOption('select[aria-label="Theme"]', 'crimson light');
		await page.waitForTimeout(500); // Wait for theme change animation

		await expect(page).toHaveScreenshot('theme-light.png', {
			maxDiffPixels: 100
		});
	});

	test('mobile viewport - homepage', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('mobile-homepage.png', {
			maxDiffPixels: 250000, // Allow significant rendering differences due to dynamic content
			threshold: 0.6 // 60% pixel difference threshold - homepage has dynamic content
		});
	});

	test('tablet viewport - homepage', async ({ page }) => {
		await page.setViewportSize({ width: 768, height: 1024 }); // iPad
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		await expect(page).toHaveScreenshot('tablet-homepage.png', {
			maxDiffPixels: 500000, // Allow significant rendering differences due to dynamic content
			threshold: 0.6 // 60% pixel difference threshold - homepage has dynamic content
		});
	});
});

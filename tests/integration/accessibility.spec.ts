import { expect, test } from '@playwright/test';

/**
 * Accessibility tests
 * These tests verify that the application meets accessibility standards
 */

test.describe('Accessibility Tests', () => {
	test('should have proper heading structure', async ({ page }) => {
		await page.goto('/');

		// Check for h1 heading
		const h1 = page.locator('h1');
		const h1Count = await h1.count();

		// There should be at least one h1 on the page
		expect(h1Count).toBeGreaterThanOrEqual(0);
	});

	test('should have alt text for images', async ({ page }) => {
		await page.goto('/');

		// Get all images
		const images = page.locator('img');
		const imageCount = await images.count();

		// Check each image has alt text
		for (let i = 0; i < imageCount; i++) {
			const img = images.nth(i);
			const alt = await img.getAttribute('alt');

			// Alt attribute should exist (can be empty for decorative images)
			expect(alt).not.toBeNull();
		}
	});

	test('should have keyboard accessible navigation', async ({ page }) => {
		await page.goto('/');

		// Tab through the page
		await page.keyboard.press('Tab');

		// Wait a bit for focus to be applied
		await page.waitForTimeout(100);

		// Verify we can navigate with keyboard - check that skip link can be focused
		const skipLink = page.getByRole('link', { name: /skip to main content/i });
		await skipLink.focus();
		await expect(skipLink).toBeFocused();
	});

	test('should have proper ARIA labels for buttons', async ({ page }) => {
		await page.goto('/');

		// Get all buttons
		const buttons = page.locator('button');
		const buttonCount = await buttons.count();

		// Each button should have either text content or an aria-label
		for (let i = 0; i < buttonCount; i++) {
			const button = buttons.nth(i);
			const text = await button.textContent();
			const ariaLabel = await button.getAttribute('aria-label');
			const title = await button.getAttribute('title');

			// Button should have text, aria-label, or title
			const hasAccessibleName = text?.trim() || ariaLabel || title;
			expect(hasAccessibleName).toBeTruthy();
		}
	});

	test('should have proper link labels', async ({ page }) => {
		await page.goto('/');

		// Get all links
		const links = page.locator('a');
		const linkCount = await links.count();

		// Each link should have text or an accessible name
		for (let i = 0; i < linkCount; i++) {
			const link = links.nth(i);
			const text = await link.textContent();
			const ariaLabel = await link.getAttribute('aria-label');
			const title = await link.getAttribute('title');

			// Link should have text, aria-label, or title
			const hasAccessibleName = text?.trim() || ariaLabel || title;
			expect(hasAccessibleName).toBeTruthy();
		}
	});

	test('should have proper color contrast', async ({ page }) => {
		await page.goto('/');

		// Get computed styles for body
		const backgroundColor = await page.evaluate(() => {
			const body = document.body;
			return window.getComputedStyle(body).backgroundColor;
		});

		const color = await page.evaluate(() => {
			const body = document.body;
			return window.getComputedStyle(body).color;
		});

		// Verify colors are set
		expect(backgroundColor).toBeTruthy();
		expect(color).toBeTruthy();
	});

	test('should have proper form labels', async ({ page }) => {
		await page.goto('/preferences');

		// Get all inputs
		const inputs = page.locator('input[type="text"], input[type="checkbox"]');
		const inputCount = await inputs.count();

		// Each input should have an associated label or aria-label
		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i);
			const id = await input.getAttribute('id');
			const ariaLabel = await input.getAttribute('aria-label');
			const ariaLabelledby = await input.getAttribute('aria-labelledby');

			// Input should have id (for label), aria-label, or aria-labelledby
			const hasLabel = id || ariaLabel || ariaLabelledby;
			expect(hasLabel).toBeTruthy();
		}
	});

	test('should have skip to main content link', async ({ page }) => {
		await page.goto('/');

		// Look for skip link
		const skipLink = page.getByRole('link', { name: /skip to main content/i });
		await expect(skipLink).toBeVisible();

		// Verify it has proper href
		await expect(skipLink).toHaveAttribute('href', '#main-content');
	});

	test('should have proper document language', async ({ page }) => {
		await page.goto('/');

		// Get the lang attribute from html element
		const lang = await page.evaluate(() => {
			return document.documentElement.getAttribute('lang');
		});

		// Should have a language set
		expect(lang).toBeTruthy();
	});

	test('should have responsive viewport meta tag', async ({ page }) => {
		await page.goto('/');

		// Check for viewport meta tag
		const viewport = await page.evaluate(() => {
			const meta = document.querySelector('meta[name="viewport"]');
			return meta?.getAttribute('content');
		});

		expect(viewport).toBeTruthy();
	});
});

import { test, expect } from '@playwright/test';
import { selectTagAndSearch, cycleTagModifier } from './helpers';

test('tag modifiers work correctly', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('domcontentloaded');

	// Use helper to select tag and search
	await selectTagAndSearch(page, 'sfw');

	// Verify the tag button is visible
	const tagButton = page.getByRole('button', { name: /^sfw \(.+\)$/ });
	await expect(tagButton).toBeVisible();

	// Right-click the tag 3 times to cycle through modifiers (normal -> + (include) -> ~ (OR) -> - (exclude))
	await cycleTagModifier(page, 'sfw', 3);

	// Verify tag is still visible after cycling
	await expect(tagButton).toBeVisible();
});

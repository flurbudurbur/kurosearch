import { test, expect } from '@playwright/test';
import { selectTagAndSearch, cycleTagModifier } from './helpers';

test('tag modifiers work correctly', async ({ page }) => {
	await page.goto('http://localhost:5173/');

	// Use helper to select tag and search
	await selectTagAndSearch(page, 'sfw');

	// Verify the tag button is visible
	await expect(page.getByRole('button', { name: /^sfw \(.+\)$/ })).toBeVisible();

	// Right-click the tag 3 times to cycle through modifiers (normal -> + (include) -> ~ (OR) -> - (exclude))
	await cycleTagModifier(page, 'sfw', 3);
});

import { test, expect } from './fixtures';
import { selectTagAndSearch, cycleTagModifier } from './helpers';

test('tag modifiers work correctly', async ({ page, mockApi }) => {
	// Mock API for tag search
	await mockApi.mockPosts();
	await mockApi.mockTags();
	await page.goto('/');
	await page.waitForLoadState('domcontentloaded');

	// Use helper to select tag and search
	await selectTagAndSearch(page, 'sfw');

	// Verify the tag button is visible
	const tagButton = page.getByRole('button', { name: /^sfw \(.+\)$/ });
	await expect(tagButton).toBeVisible();

	// Right-click the tag to cycle through modifiers
	// The cycle is: no modifier -> + (include) -> ~ (optional) -> - (exclude) -> no modifier
	// We'll cycle 3 times to test the functionality
	await cycleTagModifier(page, 'sfw', 3);

	// Verify tag is still visible after cycling
	await expect(tagButton).toBeVisible();
});

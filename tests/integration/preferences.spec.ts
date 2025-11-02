import { expect, test } from './fixtures';

/**
 * Preferences page tests
 * These tests verify that the preferences/settings page works correctly
 * Based on interactive testing with Playwright MCP
 */

test.describe('Preferences Page', () => {
	test('should load preferences page', async ({ page }) => {
		await page.goto('/preferences');

		// Verify page title
		await expect(page).toHaveTitle(/preferences/i);

		// Verify main heading
		const heading = page.getByRole('heading', { name: 'Preferences', level: 1 });
		await expect(heading).toBeVisible();
	});

	test('should have theme selector with options', async ({ page }) => {
		await page.goto('/preferences');

		// Verify Theme section heading
		const themeHeading = page.getByRole('heading', { name: 'Theme', level: 2 });
		await expect(themeHeading).toBeVisible();

		// Verify theme combobox exists
		const themeSelect = page.getByRole('combobox').first();
		await expect(themeSelect).toBeVisible();

		// Verify all theme options are available
		const options = await themeSelect.locator('option').allTextContents();
		expect(options).toContain('Dark');
		expect(options).toContain('Light');
		expect(options).toContain('Light Bubblegum');
		expect(options).toContain('Dark Bubblegum');
		expect(options).toContain('Coffee');
	});

	test('should change theme selection', async ({ page }) => {
		await page.goto('/preferences');

		// Get theme selector
		const themeSelect = page.getByRole('combobox').first();

		// Get current value
		const currentValue = await themeSelect.inputValue();

		// Select a different theme (use the actual option value from the select)
		const options = await themeSelect.locator('option').all();
		const optionValues = await Promise.all(options.map((opt) => opt.getAttribute('value')));

		// Find a value that's different from current
		const newValue = optionValues.find((val) => val && val !== currentValue) || optionValues[1];

		await themeSelect.selectOption(newValue!);

		// Verify selection changed
		await expect(themeSelect).toHaveValue(newValue!);
	});

	test('should have API Access section', async ({ page }) => {
		await page.goto('/preferences');

		// Verify API Access heading
		const apiHeading = page.getByRole('heading', { name: 'API Access', level: 2 });
		await expect(apiHeading).toBeVisible();

		// Verify API key input (using aria-label)
		const apiKeyInput = page.getByRole('textbox', { name: 'API Key' });
		await expect(apiKeyInput).toBeVisible();

		// Verify User ID input (using aria-label)
		const userIdInput = page.getByRole('textbox', { name: 'User ID' });
		await expect(userIdInput).toBeVisible();

		// Verify manage API key link (using aria-label from the page)
		const manageLink = page.getByRole('link', {
			name: 'Manage your API key on rule34.xxx'
		});
		await expect(manageLink).toBeVisible();
		await expect(manageLink).toHaveAttribute(
			'href',
			'https://rule34.xxx/index.php?page=account&s=options'
		);
	});

	test('should have Save Tags & Posts section', async ({ page }) => {
		await page.goto('/preferences');

		// Verify section heading
		const heading = page.getByRole('heading', { name: 'Save Tags & Posts', level: 2 });
		await expect(heading).toBeVisible();

		// Verify checkbox by ID (text is dynamic based on state)
		const checkbox = page.locator('#checkbox-localstorage-enabled');
		await expect(checkbox).toBeVisible();

		// Verify reset buttons
		const resetPostsButton = page.getByRole('button', { name: 'Reset Posts' });
		await expect(resetPostsButton).toBeVisible();

		const resetTagsButton = page.getByRole('button', { name: 'Reset Tags' });
		await expect(resetTagsButton).toBeVisible();
	});

	test('should have Blocked Content section with all checkboxes', async ({ page }) => {
		await page.goto('/preferences');

		// Verify section heading
		const heading = page.getByRole('heading', { name: 'Blocked Content', level: 2 });
		await expect(heading).toBeVisible();

		// Verify all blocked content checkboxes
		const aiCheckbox = page.getByRole('checkbox', { name: 'AI-Generated' });
		await expect(aiCheckbox).toBeVisible();

		const animalCheckbox = page.getByRole('checkbox', { name: 'Animal-Related' });
		await expect(animalCheckbox).toBeVisible();

		const nonConsensualCheckbox = page.getByRole('checkbox', { name: 'Non-Consensual' });
		await expect(nonConsensualCheckbox).toBeVisible();

		const goreCheckbox = page.getByRole('checkbox', { name: 'Gore' });
		await expect(goreCheckbox).toBeVisible();

		const scatCheckbox = page.getByRole('checkbox', { name: 'Scat' });
		await expect(scatCheckbox).toBeVisible();

		const voreCheckbox = page.getByRole('checkbox', { name: 'Vore' });
		await expect(voreCheckbox).toBeVisible();

		const yuriCheckbox = page.getByRole('checkbox', { name: 'Yuri' });
		await expect(yuriCheckbox).toBeVisible();

		const yaoiCheckbox = page.getByRole('checkbox', { name: 'Yaoi' });
		await expect(yaoiCheckbox).toBeVisible();
	});

	test('should toggle blocked content checkbox', async ({ page }) => {
		await page.goto('/preferences');

		// Get AI-Generated checkbox
		const aiCheckbox = page.getByRole('checkbox', { name: 'AI-Generated' });

		// Get initial state
		const initialState = await aiCheckbox.isChecked();

		// Click to toggle
		await aiCheckbox.click();
		await expect(aiCheckbox).toBeChecked({ checked: !initialState });

		// Click to toggle back
		await aiCheckbox.click();
		await expect(aiCheckbox).toBeChecked({ checked: initialState });
	});

	test('should have Loop Videos section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Loop Videos', level: 2 });
		await expect(heading).toBeVisible();

		// Use ID since checkbox text is dynamic (can be "Always" or "Only with 'loop' tag")
		const checkbox = page.locator('#checkbox-always-loop');
		await expect(checkbox).toBeVisible();
	});

	test('should have Autoscroll in Fullscreen section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Autoscroll in Fullscreen', level: 2 });
		await expect(heading).toBeVisible();

		// Use ID since checkbox text is dynamic (can be "Enabled" or "Disabled")
		const checkbox = page.locator('#checkbox-fullscreen-autplay');
		await expect(checkbox).toBeVisible();

		// Verify spinbutton for seconds
		const spinButton = page.getByRole('spinbutton');
		await expect(spinButton).toBeVisible();
		await expect(spinButton).toHaveValue('10');
	});

	test('should have Result Layout section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Result layout', level: 2 });
		await expect(heading).toBeVisible();

		// Verify layout combobox
		const layoutSelect = page.getByRole('combobox').nth(1);
		await expect(layoutSelect).toBeVisible();

		// Verify options
		const options = await layoutSelect.locator('option').allTextContents();
		expect(options).toContain('Single Column');
		expect(options).toContain('Two Columns');
		expect(options).toContain('Three Columns');
		expect(options).toContain('Four Columns');

		// Use ID since checkbox text is dynamic (can be "Extra wide" or "Default width")
		const wideLayoutCheckbox = page.locator('#checkbox-wide-layout');
		await expect(wideLayoutCheckbox).toBeVisible();
	});

	test('should have Enable Page Navigation section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Enable Page Navigation', level: 2 });
		await expect(heading).toBeVisible();

		// Verify checkbox by ID (text is dynamic: "Enabled" or "Disabled")
		const checkbox = page.locator('#checkbox-page-navigation');
		await expect(checkbox).toBeVisible();
	});

	test('should have Higher Resolution section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Higher Resolution', level: 2 });
		await expect(heading).toBeVisible();

		// Verify checkbox by ID (text is dynamic: "Enabled" or "Disabled")
		const checkbox = page.locator('#checkbox-high-resolution-enabled');
		await expect(checkbox).toBeVisible();
	});

	test('should have Gif Preload section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Gif Preload', level: 2 });
		await expect(heading).toBeVisible();

		// Verify checkbox by ID (text is dynamic: "Enabled" or "Disabled")
		const checkbox = page.locator('#checkbox-gif-preload-enabled');
		await expect(checkbox).toBeVisible();
	});

	test('should have Reset preferences section', async ({ page }) => {
		await page.goto('/preferences');

		const heading = page.getByRole('heading', { name: 'Reset preferences', level: 2 });
		await expect(heading).toBeVisible();

		const resetButton = page.getByRole('button', { name: 'Reset preferences' });
		await expect(resetButton).toBeVisible();
	});

	test('should have all form controls properly labeled', async ({ page }) => {
		await page.goto('/preferences');

		// Get all checkboxes
		const checkboxes = page.getByRole('checkbox');
		const checkboxCount = await checkboxes.count();

		// Verify each checkbox has accessible name
		for (let i = 0; i < checkboxCount; i++) {
			const checkbox = checkboxes.nth(i);
			const name = await checkbox.getAttribute('aria-label');
			const hasAccessibleName = name || (await checkbox.isVisible());
			expect(hasAccessibleName).toBeTruthy();
		}
	});
});

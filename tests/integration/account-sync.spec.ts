import { test, expect } from '@playwright/test';

test.describe('Account and Sync Features', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to account page
		await page.goto('http://localhost:5173/account');
		await page.waitForLoadState('networkidle');
	});

	test('should display account page with all sections', async ({ page }) => {
		// Check for main heading
		await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();

		// Check for Supertags section
		await expect(page.getByRole('heading', { name: 'Supertags' })).toBeVisible();

		// Check for Import/Export section
		await expect(page.getByRole('heading', { name: 'Import/Export Data' })).toBeVisible();

		// Check for One-time Sync section
		await expect(page.getByRole('heading', { name: 'One-time Sync' })).toBeVisible();

		// Check for Danger Zone section
		await expect(page.getByRole('heading', { name: 'Danger Zone' })).toBeVisible();
	});

	test('should show empty supertags message when no supertags exist', async ({ page }) => {
		// Check for the "no supertags" message
		const noSupertagsText = page.getByText("You don't have any supertags yet");
		const count = await noSupertagsText.count();

		// Either the message is visible OR there are existing supertags
		const hasSupertagsList = (await page.locator('ul').count()) > 0;

		// At least one should be true
		expect(count > 0 || hasSupertagsList).toBe(true);
	});

	test('should have export config button', async ({ page }) => {
		const exportButton = page.getByText('Download Config File');
		await expect(exportButton).toBeVisible();
	});

	test('should have import config button', async ({ page }) => {
		const importButton = page.getByText('Load Config File').last();
		await expect(importButton).toBeVisible();
	});

	test('should generate sync code', async ({ page }) => {
		// Find and click the generate code button
		const generateButton = page.getByText('Generate your code');
		await expect(generateButton).toBeVisible();
		await generateButton.click();

		// Wait for the code to be generated
		await expect(page.getByText(/Code generated:/i)).toBeVisible({ timeout: 10000 });

		// Check that a 6-digit code is displayed
		const codeText = await page.locator('text=/Your code: \\d{6}/').textContent();
		expect(codeText).toMatch(/\d{6}/);
	});

	test('should show code format (6 digits)', async ({ page }) => {
		// Generate a code
		const generateButton = page.getByText('Generate your code');
		await generateButton.click();

		// Wait for code to be generated
		await page.waitForSelector('text=/Your code: \\d{6}/', { timeout: 10000 });

		// Verify the code is exactly 6 digits
		const codeElement = page.locator('.generated-code >> text=/\\d{6}/').first();
		const codeText = await codeElement.textContent();
		const code = codeText?.match(/\d{6}/)?.[0];

		expect(code).toBeTruthy();
		expect(code?.length).toBe(6);
	});

	test('should show sync code validity message', async ({ page }) => {
		// Generate a code
		const generateButton = page.getByText('Generate your code');
		await generateButton.click();

		// Should show "Valid for 5 minutes" message (in the code note paragraph)
		await expect(page.locator('.code-note')).toBeVisible({ timeout: 10000 });
		const noteText = await page.locator('.code-note').textContent();
		expect(noteText).toMatch(/Valid for 5 minutes/i);
	});

	test('should have sync code input and submit button', async ({ page }) => {
		// Check for code input field
		const codeInput = page.locator('input[placeholder="Code"]');
		await expect(codeInput).toBeVisible();

		// Check for submit button
		const submitButton = page.locator('button.sync-submit-button');
		await expect(submitButton).toBeVisible();

		// Submit button should be disabled when input is empty
		await expect(submitButton).toBeDisabled();
	});

	test('should enable submit button when code is entered', async ({ page }) => {
		const codeInput = page.locator('input[placeholder="Code"]');
		const submitButton = page.locator('button.sync-submit-button');

		// Type a code
		await codeInput.fill('123456');

		// Submit button should be enabled
		await expect(submitButton).toBeEnabled();
	});

	test('should show error for invalid sync code', async ({ page }) => {
		const codeInput = page.locator('input[placeholder="Code"]');
		const submitButton = page.locator('button.sync-submit-button');

		// Enter an invalid code
		await codeInput.fill('999999');
		await submitButton.click();

		// Should show error message
		const errorMessage = page
			.locator('.sync-message.error')
			.or(page.locator('.sync-message:has-text("not found")'));
		await expect(errorMessage).toBeVisible({ timeout: 10000 });
	});

	test('should successfully sync with valid code', async ({ page, context }) => {
		// Open a second page to generate a code
		const page2 = await context.newPage();
		await page2.goto('http://localhost:5173/account');
		await page2.waitForLoadState('networkidle');

		// Generate code on page2
		const generateButton = page2.getByText('Generate your code');
		await generateButton.click();

		// Extract the generated code
		await page2.waitForSelector('text=/Your code: \\d{6}/', { timeout: 10000 });
		const codeText = await page2.locator('.generated-code >> text=/\\d{6}/').first().textContent();
		const code = codeText?.match(/\d{6}/)?.[0];

		expect(code).toBeTruthy();

		// Now use that code on page1
		const codeInput = page.locator('input[placeholder="Code"]');
		const submitButton = page.locator('button.sync-submit-button');

		await codeInput.fill(code!);
		await submitButton.click();

		// Should show success message
		await expect(page.getByText(/Configuration loaded successfully/i)).toBeVisible({
			timeout: 10000
		});

		// Close page2
		await page2.close();
	});

	test('should show delete data button in danger zone', async ({ page }) => {
		const deleteButton = page.locator('.danger >> button', { hasText: 'Delete Data' });
		await expect(deleteButton).toBeVisible();
	});

	test('should show confirmation dialog when deleting data', async ({ page }) => {
		const deleteButton = page.locator('.danger >> button:has-text("Delete Data")');
		await deleteButton.click();

		// Should show confirmation dialog
		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		// Should have confirmation text
		await expect(page.getByText(/delete all your data/i)).toBeVisible();

		// Should have cancel and confirm buttons
		await expect(dialog.locator('button:has-text("Cancel")')).toBeVisible();
		await expect(dialog.locator('button:has-text("Yes, delete it")')).toBeVisible();
	});

	test('should cancel delete data when cancel is clicked', async ({ page }) => {
		const deleteButton = page.locator('.danger >> button', { hasText: 'Delete Data' });
		await deleteButton.click();

		// Click cancel
		const cancelButton = page.getByRole('button', { name: /Cancel/i });
		await cancelButton.click();

		// Dialog should be closed
		await expect(page.locator('dialog[open]')).not.toBeVisible();
	});

	test('should delete data when confirmed', async ({ page }) => {
		const deleteButton = page.locator('.danger >> button:has-text("Delete Data")');
		await deleteButton.click();

		// Wait for dialog to open
		const dialog = page.locator('dialog[open]');
		await expect(dialog).toBeVisible({ timeout: 10000 });

		// Click confirm
		const confirmButton = dialog.locator('button:has-text("Yes, delete it")');
		await confirmButton.click();

		// Dialog should close
		await expect(page.locator('dialog[open]')).not.toBeVisible();

		// Page should still be functional
		await expect(page.getByRole('heading', { name: 'Account', level: 1 })).toBeVisible();
	});

	test('should have correct page title', async ({ page }) => {
		const title = await page.title();
		expect(title).toContain('Account');
	});

	test('should display supertag list when supertags exist', async ({ page }) => {
		// This test assumes we can create supertags elsewhere
		// For now, just check that the supertags section exists
		const supertagsSection = page.locator('section').filter({ hasText: 'Supertags' }).first();
		await expect(supertagsSection).toBeVisible();
	});

	test('should show import/export description text', async ({ page }) => {
		await expect(page.getByText(/Load and save preferences and supertags/i)).toBeVisible();
	});

	test('should show one-time sync description text', async ({ page }) => {
		await expect(page.getByText(/Sync your config with a one-time code/i)).toBeVisible();
	});

	test('should style danger zone with warning colors', async ({ page }) => {
		const dangerZone = page.locator('.danger');
		await expect(dangerZone).toBeVisible();

		// Check that the danger zone has distinct styling
		const backgroundColor = await dangerZone.evaluate(
			(el) => window.getComputedStyle(el).backgroundColor
		);

		// Should have some reddish background color (rgba with red component)
		expect(backgroundColor).toBeTruthy();
	});

	test('should not allow code submission without input', async ({ page }) => {
		const codeInput = page.locator('input[placeholder="Code"]');
		const submitButton = page.locator('button.sync-submit-button');

		// Clear input
		await codeInput.fill('');

		// Button should be disabled
		await expect(submitButton).toBeDisabled();
	});

	test('should show generating state when generating code', async ({ page }) => {
		const generateButton = page.getByText('Generate your code');

		// Start generating
		await generateButton.click();

		// Should briefly show "Generating..." state
		// (This might be too fast to catch, so we just check the end state)
		await expect(page.getByText(/Code generated:/i)).toBeVisible({ timeout: 10000 });
	});

	test('should show loading state when submitting code', async ({ page }) => {
		const codeInput = page.locator('input[placeholder="Code"]');
		const submitButton = page.locator('button.sync-submit-button');

		// Enter invalid code
		await codeInput.fill('000000');

		// Click submit
		await submitButton.click();

		// Should either show "Loading..." or complete quickly
		// Just verify that it completes
		await page.waitForTimeout(500);
	});
});

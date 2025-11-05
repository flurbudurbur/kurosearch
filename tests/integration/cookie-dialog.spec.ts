import { expect, test } from './fixtures';

test.describe('Cookie Dialog Tests', () => {
	test('should show cookie dialog on first visit', async ({ page, context }) => {
		// Clear cookies and localStorage before navigating
		await context.clearCookies();

		// Set up localStorage to simulate first visit BEFORE page loads
		await page.addInitScript(() => {
			localStorage.removeItem('kurosearch:cookies-accepted');
		});

		await page.goto('/');
		await page.waitForLoadState('load');

		// Verify the cookie dialog is visible
		const cookieDialog = page.locator('#cookie-dialog');
		await expect(cookieDialog).toBeVisible();

		// Verify the heading and content
		await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
		await expect(page.getByText('This website contains mature content')).toBeVisible();
		await expect(page.getByText('this website uses cookies')).toBeVisible();

		// Verify Accept and Leave buttons are present
		const acceptButton = page.getByRole('button', { name: 'Accept terms of use' });
		const leaveButton = page.getByRole('button', { name: 'Leave website' });
		await expect(acceptButton).toBeVisible();
		await expect(leaveButton).toBeVisible();
	});

	test('should hide cookie dialog after accepting', async ({ page, context }) => {
		// Clear cookies and localStorage before navigating
		await context.clearCookies();

		// Set up localStorage to simulate first visit BEFORE page loads
		await page.addInitScript(() => {
			localStorage.removeItem('kurosearch:cookies-accepted');
		});

		await page.goto('/');
		await page.waitForLoadState('load');

		// Verify the cookie dialog is visible
		const cookieDialog = page.locator('#cookie-dialog');
		await expect(cookieDialog).toBeVisible();

		// Click Accept button
		const acceptButton = page.getByRole('button', { name: 'Accept terms of use' });
		await acceptButton.click();

		// Verify the cookie dialog is hidden
		await expect(cookieDialog).not.toBeVisible();

		// Verify localStorage was updated
		const cookieAccepted = await page.evaluate(() => {
			return localStorage.getItem('kurosearch:cookies-accepted');
		});
		expect(cookieAccepted).toBe('true');

		// Verify data-cookies attribute was set
		const dataCookies = await page.evaluate(() => {
			return document.documentElement.dataset.cookies;
		});
		expect(dataCookies).toBe('true');
	});

	test('should not show cookie dialog on subsequent visits', async ({ page }) => {
		// Set localStorage to simulate accepted cookies BEFORE page loads
		await page.addInitScript(() => {
			localStorage.setItem('kurosearch:cookies-accepted', 'true');
		});

		await page.goto('/');
		await page.waitForLoadState('load');

		// Verify the cookie dialog is not visible
		const cookieDialog = page.locator('#cookie-dialog');
		await expect(cookieDialog).not.toBeVisible();
	});
});

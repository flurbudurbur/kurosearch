import { expect, test } from '@playwright/test';

test('index page has expected title', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveTitle('flur34 - Rule34 browser');
});

test('header has expected links', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByTitle('Ko-Fi')).toHaveAttribute('href', 'https://ko-fi.com/flurbudurbur');
	await expect(page.getByTitle('Discord Server')).toHaveAttribute(
		'href',
		'https://discord.gg/AxUnC7n9ZP'
	);
	await expect(page.getByTitle('Documentation')).toHaveAttribute('href', '/help');
	await expect(page.getByTitle('Search', { exact: true })).toHaveAttribute('href', '/');
	await expect(page.getByTitle('Settings')).toHaveAttribute('href', '/preferences');
	await expect(page.getByTitle('Account')).toHaveAttribute('href', '/account');
});

test('footer has expected links and texts', async ({ page }) => {
	await page.goto('/');

	// Footer links
	const sourceCode = page.getByTitle('Source Code', { exact: true });
	const sourceCodeDocker = page.getByTitle('Source Code Docker', { exact: true });
	const about = page.getByTitle('About');

	await expect(sourceCode).toHaveAttribute('href', 'https://github.com/kurozenzen/kurosearch');
	await expect(sourceCode).toHaveAttribute('target', '_blank');

	await expect(sourceCodeDocker).toHaveAttribute('href', 'https://github.com/flur34/flur34');
	await expect(sourceCodeDocker).toHaveAttribute('target', '_blank');

	await expect(about).toHaveAttribute('href', '/about');

	// Copyright year
	const currentYear = new Date().getFullYear();
	await expect(page.getByText(`© ${currentYear} kurozenzen`)).toBeVisible();

	// Disclaimer text
	await expect(
		page.getByText('I do not own the rights to Helheim Lynx', { exact: false })
	).toBeVisible();
});

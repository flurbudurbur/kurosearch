import { test, expect } from '@playwright/test';

//todo: improve test so it's not depentent on the amount of posts with that tag.
test('test', async ({ page }) => {
	await page.goto('http://localhost:5173/');
	await page.getByRole('combobox', { name: 'Search for tags' }).click();
	await page.getByRole('combobox', { name: 'Search for tags' }).fill('sfw');
	await page.getByRole('option', { name: 'sfw tag, 7.5K posts' }).click();
	await page.getByRole('button', { name: 'Search with the selected tags' }).click();
	await page.getByRole('button', { name: 'sfw (7.5K)' }).click({
		button: 'right'
	});
	await page.getByRole('button', { name: 'sfw (7.5K)' }).click({
		button: 'right'
	});
	await page.getByRole('button', { name: 'sfw (7.5K)' }).click({
		button: 'right'
	});
	await page.getByRole('button', { name: 'Share current search' }).click();
	await page.getByRole('button', { name: 'Clear the current selection.' }).click();
	await page.getByRole('combobox', { name: 'Search for tags' }).click();
	await page.getByRole('combobox', { name: 'Search for tags' }).fill('sfw');
	await page.getByRole('option', { name: 'sfw tag, 7.5K posts' }).click();
	await page.getByRole('option', { name: 'sfw tag, 7.5K posts' }).click();
	await page.getByRole('combobox', { name: 'Search for tags' }).fill('sfw');
	await page.getByRole('combobox', { name: 'Search for tags' }).click();
	await page.getByRole('combobox', { name: 'Search for tags' }).fill('sfw');
	await page.getByRole('option', { name: 'sfw version tag, 529 posts' }).click();
});

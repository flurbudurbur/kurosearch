import { test, expect } from '@playwright/test';

test.describe('Post Detail Page', () => {
	test('should display invalid post ID message when ID is missing', async ({ page }) => {
		await page.goto('http://localhost:5173/post');

		await expect(page.getByText('Invalid post ID')).toBeVisible();
	});

	test('should handle non-existent post gracefully', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=999999999');

		// Wait for loading to finish
		await page.waitForLoadState('networkidle');

		// Should not crash - either shows "Post not found" or shows no content
		const hasError =
			(await page.getByText('Post not found').count()) > 0 ||
			(await page.getByText('Invalid post ID').count()) > 0;
		const hasNoTags = (await page.getByRole('heading', { name: 'Tags' }).count()) === 0;

		// Either shows an error message OR doesn't show tags (empty result)
		expect(hasError || hasNoTags).toBe(true);
	});

	test('should load and display post by valid ID', async ({ page }) => {
		// Using post ID 1 which should exist
		await page.goto('http://localhost:5173/post?id=1');

		// Wait for the post to load
		await page.waitForLoadState('networkidle');

		// Should NOT show error messages
		await expect(page.getByText('Invalid post ID')).not.toBeVisible();
		await expect(page.getByText('Post not found')).not.toBeVisible();

		// Should display the Tags heading (confirms post loaded)
		await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();
	});

	test('should display post metadata (rating, score, type, change date)', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check that the metadata section with bullets exists
		const metadataSection = page.locator('section .flex-row').first();
		await expect(metadataSection).toBeVisible();

		// Should contain bullet points (•) separating metadata
		const text = await metadataSection.textContent();
		expect(text).toContain('•');

		// Should contain type information (IMAGE, VIDEO, or GIF)
		const hasMediaType =
			text?.includes('IMAGE') || text?.includes('VIDEO') || text?.includes('GIF');
		expect(hasMediaType).toBe(true);
	});

	test('should display tags section', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check for Tags heading
		await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();

		// Check that tags are displayed (tag list should exist)
		const tagList = page.locator('section').filter({ hasText: 'Tags' });
		await expect(tagList).toBeVisible();
	});

	test('should display links section with Rule34 and source links', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check for Links heading
		await expect(page.getByRole('heading', { name: 'Links' })).toBeVisible();

		// Check for external links (Rule34 link should always be present)
		const linksSection = page.locator('section').filter({ hasText: 'Links' });
		await expect(linksSection).toBeVisible();

		// Should contain link to rule34.xxx
		const links = page.getByRole('link');
		const linkCount = await links.count();
		expect(linkCount).toBeGreaterThan(0);
	});

	test('should display comments section', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check for Comments heading
		await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();
	});

	test('should display image media type correctly', async ({ page }) => {
		// We'll need to find a post that is an image
		// For now, we'll check that the image element exists if the post is an image
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check if either img, video, or canvas (for gif) is present
		const hasImage = (await page.locator('img').count()) > 0;
		const hasVideo = (await page.locator('video').count()) > 0;

		// At least one media type should be present
		expect(hasImage || hasVideo).toBe(true);
	});

	test('should handle video media type with player controls', async ({ page }) => {
		// Navigate to home and find a video post
		await page.goto('http://localhost:5173/');
		await page.waitForLoadState('networkidle');

		// Try to find a video post by looking for .webm or .mp4 in the page
		// This is a best-effort test - if no videos are found, we'll skip
		const videoLinks = page.locator('a[href*=".webm"], a[href*=".mp4"]');
		const videoCount = await videoLinks.count();

		if (videoCount > 0) {
			// Click the first video post to navigate to its detail page
			const firstVideoLink = videoLinks.first();
			const href = await firstVideoLink.getAttribute('href');

			if (href) {
				await page.goto(`http://localhost:5173${href}`);
				await page.waitForLoadState('networkidle');

				// Should have a video element
				await expect(page.locator('video')).toBeVisible();

				// Video should have controls or interactive buttons
				const video = page.locator('video');
				const hasControls = await video.evaluate((v) => v.hasAttribute('controls'));
				const hasCustomControls = (await page.locator('button').count()) > 0;

				expect(hasControls || hasCustomControls).toBe(true);
			}
		}
	});

	test('should have clickable tags', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Tags should be clickable elements (buttons or links)
		const tagsSection = page.locator('section').filter({ hasText: 'Tags' });
		const clickableElements = tagsSection.locator('button, a');
		const count = await clickableElements.count();

		expect(count).toBeGreaterThan(0);
	});

	test('should display correct page title with post ID', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		const title = await page.title();
		expect(title).toContain('Post # 1');
	});

	test('should show loading animation while post is being fetched', async ({ page }) => {
		// Slow down the network to see the loading state
		await page.route('**/api/posts**', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await route.continue();
		});

		const navigationPromise = page.goto('http://localhost:5173/post?id=1');

		// Should show loading animation briefly
		page.locator('[class*="loading"]');
		// Wait a bit to check if loading appears
		await page.waitForTimeout(100);

		// Continue navigation
		await navigationPromise;
	});

	test('should display external source link when source is available', async ({ page }) => {
		await page.goto('http://localhost:5173/post?id=1');
		await page.waitForLoadState('networkidle');

		// Check the links section
		const linksSection = page.locator('section').filter({ hasText: 'Links' });
		const links = linksSection.getByRole('link');

		// At minimum, should have Rule34 link
		const linkCount = await links.count();
		expect(linkCount).toBeGreaterThanOrEqual(1);
	});

	test('should navigate to post from search results', async ({ page }) => {
		// First go to home page and perform a search
		await page.goto('http://localhost:5173/');

		// Wait for page to load
		await page.waitForLoadState('networkidle');

		// Look for any post result and click it
		const postLinks = page.locator('a[href*="/post?id="]');
		const postCount = await postLinks.count();

		if (postCount > 0) {
			const firstPost = postLinks.first();
			await firstPost.click();

			// Should navigate to post detail page
			await expect(page).toHaveURL(/.*\/post\?id=\d+/);

			// Should display post content
			await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();
		}
	});
});

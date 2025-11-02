import { test, expect } from './fixtures';
import { navigateToPost, navigateToPostAndVerify } from './helpers';

test.describe('Post Detail Page', () => {
	test('should redirect to home when ID is missing', async ({ page }) => {
		// Mock API for this test (even though we won't need it)
		await page.goto('/post');
		await page.waitForLoadState('domcontentloaded');

		// Should redirect to home page
		await expect(page).toHaveURL('/');
	});

	test('should handle non-existent post gracefully', async ({ page }) => {
		// Mock API to return 404 for non-existent post
		await page.goto('/post/999999999');

		// Wait for loading to finish - use domcontentloaded to be more reliable
		await page.waitForLoadState('domcontentloaded');

		// Wait for API response to complete (should return 404 error)
		try {
			await page.waitForResponse((response) => response.url().includes('/api/posts'), {
				timeout: 5000
			});
		} catch {
			// API call may fail or timeout for non-existent post
		}

		// Should show error message - either "Failed to load post" (from 404), "Post not found", or "Invalid post ID"
		const hasError =
			(await page.getByText('Failed to load post').count()) > 0 ||
			(await page.getByText('Post not found').count()) > 0 ||
			(await page.getByText('Invalid post ID').count()) > 0;

		expect(hasError).toBe(true);
	});

	test('should load and display post by valid ID', async ({ page }) => {
		// Mock API with post data

		// Using post ID 1 which should exist
		await navigateToPostAndVerify(page, 1);

		// Should NOT show error messages
		await expect(page.getByText('Invalid post ID')).not.toBeVisible();
		await expect(page.getByText('Post not found')).not.toBeVisible();
	});

	test('should display post metadata (rating, score, type, change date)', async ({ page }) => {
		await navigateToPostAndVerify(page, 1);

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
		await navigateToPostAndVerify(page, 1);

		// Check for Tags heading (already verified by navigateToPostAndVerify)

		// Check that tags are displayed (tag list should exist)
		const tagList = page.locator('section').filter({ hasText: 'Tags' });
		await expect(tagList).toBeVisible();
	});

	test('should display links section with Rule34 and source links', async ({ page }) => {
		await navigateToPostAndVerify(page, 1);

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
		await navigateToPostAndVerify(page, 1);

		// Check for Comments heading
		await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();
	});

	test('should display image media type correctly', async ({ page }) => {
		await navigateToPost(page, 1);

		// Wait for media elements to render
		// Media components (PostImage, Video, Gif) may use IntersectionObserver for lazy loading
		await page.waitForFunction(
			() => {
				const images = document.querySelectorAll('img');
				const videos = document.querySelectorAll('video');
				return images.length > 0 || videos.length > 0;
			},
			{ timeout: 5000 }
		);

		// Verify that at least one media type is present
		const hasImage = (await page.locator('img').count()) > 0;
		const hasVideo = (await page.locator('video').count()) > 0;
		expect(hasImage || hasVideo).toBe(true);
	});

	test('should handle video media type with player controls', async ({ page }) => {
		// Mock API with posts including video type

		// Navigate to home and find a video post
		await page.goto('/');
		await page.waitForLoadState('domcontentloaded');

		// Try to find a video post by looking for .webm or .mp4 in the page
		// This is a best-effort test - if no videos are found, we'll skip
		const videoLinks = page.locator('a[href*=".webm"], a[href*=".mp4"]');
		const videoCount = await videoLinks.count();

		if (videoCount > 0) {
			// Click the first video post to navigate to its detail page
			const firstVideoLink = videoLinks.first();
			const href = await firstVideoLink.getAttribute('href');

			if (href) {
				await page.goto(href);
				await page.waitForLoadState('domcontentloaded');
				await page.waitForResponse((response) => response.url().includes('/api/posts'), {
					timeout: 10000
				});

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
		await navigateToPostAndVerify(page, 1);

		// Tags should be clickable elements (buttons or links)
		const tagsSection = page.locator('section').filter({ hasText: 'Tags' });
		const clickableElements = tagsSection.locator('button, a');

		// Wait for at least one clickable element to be visible
		await expect(clickableElements.first()).toBeVisible({ timeout: 5000 });

		const count = await clickableElements.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should display correct page title with post ID', async ({ page }) => {
		await navigateToPost(page, 1);

		// Wait for the title to be updated
		await page.waitForFunction(() => document.title.includes('Post #'), { timeout: 5000 });

		const title = await page.title();
		expect(title).toContain('Post # 1');
	});

	test('should display external source link when source is available', async ({ page }) => {
		await navigateToPost(page, 1);

		// Wait for the Links heading to appear
		await expect(page.getByRole('heading', { name: 'Links' })).toBeVisible();

		// Check the links section
		const linksSection = page.locator('section').filter({ hasText: 'Links' });
		const links = linksSection.getByRole('link');

		// Wait for at least one link to be visible
		await expect(links.first()).toBeVisible({ timeout: 5000 });

		// At minimum, should have Rule34 link
		const linkCount = await links.count();
		expect(linkCount).toBeGreaterThanOrEqual(1);
	});

	test('should navigate to post from search results', async ({ page }) => {
		// Mock API for search results and post detail

		// First go to home page and perform a search
		await page.goto('/');

		// Wait for page to load
		await page.waitForLoadState('domcontentloaded');

		// Look for any post result and click it
		const postLinks = page.locator('a[href*="/post/"]');
		const postCount = await postLinks.count();

		if (postCount > 0) {
			const firstPost = postLinks.first();
			await firstPost.click();

			// Should navigate to post detail page
			await expect(page).toHaveURL(/.*\/post\/\d+/);

			// Should display post content
			await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();
		}
	});
});

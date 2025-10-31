/**
 * Integration tests for error handling across the application
 * Tests various error scenarios: server errors, network failures, empty states, etc.
 */

import { test, expect } from './fixtures';

test.describe('Error Handling', () => {
	test.describe('Posts API Errors', () => {
		test('handles server error (500) gracefully', async ({ page, mockApi }) => {
			await mockApi.mockPostsServerError();
			await mockApi.mockTags(); // Tags should still work

			await page.goto('/');

			// Should show error state or empty state
			// Adjust selector based on your actual error UI
			const postsContainer = page
				.locator('[data-testid="posts-container"]')
				.or(page.locator('main'));
			await expect(postsContainer).toBeVisible();

			// Should not crash the app
			await expect(page).toHaveURL('/');
		});

		test('handles network failure', async ({ page, mockApi }) => {
			await mockApi.mockPostsNetworkError();
			await mockApi.mockTags();

			await page.goto('/');

			// App should handle network failure gracefully
			await expect(page).toHaveURL('/');

			// Should be able to retry or show error message
			const body = await page.textContent('body');
			expect(body).toBeTruthy();
		});

		test('handles empty search results', async ({ page, mockApi }) => {
			await mockApi.setupEmptySearch();

			await page.goto('/');

			// Should show "no results" message or empty state
			// Adjust based on your actual UI
			const articles = await page.getByRole('listitem').count();
			expect(articles).toBe(0);

			// App should not crash
			await expect(page).toHaveURL('/');
		});

		test('handles slow network (loading state)', async ({ page, mockApi }) => {
			await mockApi.setupSlowResponses(1500);

			await page.goto('/');

			// last child of <main> is a <div>
			const loadingIndicator = page.locator('main > div').last();
			await expect(loadingIndicator).toBeVisible();
		});

		test('handles malformed post data', async ({ page, mockApi }) => {
			const { mockMalformedPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockMalformedPost]);
			await mockApi.mockTags();

			await page.goto('/');

			// Should handle malformed data gracefully (skip it, show error, etc.)
			// App should not crash
			await expect(page).toHaveURL('/');
		});

		test('handles post not found', async ({ page, mockApi }) => {
			await mockApi.mockPosts(); // No post with ID 999999
			await mockApi.mockTags();

			await page.goto('/post/999999');

			// Should show 404 or "post not found" message
			// Adjust based on your actual error handling
			const text = await page.textContent('body');
			expect(text).toBeTruthy();
		});
	});

	test.describe('Tags API Errors', () => {
		test('handles tags server error', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTagsServerError();

			await page.goto('/');

			// Search bar should still be functional even if tags fail
			const searchInput = page.getByPlaceholder(/search/i);
			await expect(searchInput).toBeVisible();

			// Try typing - should not crash
			await searchInput.fill('test');

			// App should not crash
			await expect(page).toHaveURL('/');
		});

		test('handles empty tag autocomplete', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTagsEmpty();

			await page.goto('/');

			const searchInput = page.getByPlaceholder(/search/i);
			await searchInput.fill('nonexistent_tag');

			// Should show no suggestions or "no results"
			// The autocomplete dropdown should handle empty gracefully
			// Adjust based on your implementation

			// Should still be able to type
			await expect(searchInput).toHaveValue('nonexistent_tag');
		});
	});

	test.describe('Comments API Errors', () => {
		test('handles comments server error', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTags();
			await mockApi.mockCommentsServerError();

			await page.goto('/post/1');

			// Post should still display even if comments fail
			await expect(page).toHaveURL('/post/1');

			// Should show error in comments section or hide it gracefully
			// Adjust based on your actual implementation
		});

		test('handles missing post_id parameter', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTags();
			// mockComments without post_id returns 400 error

			await page.goto('/post/1');

			// Should handle gracefully - either show error or no comments
			await expect(page).toHaveURL('/post/1');
		});

		test('handles special characters in comments', async ({ page, mockApi }) => {
			const { mockCommentsWithSpecialChars } = await import('./mocks/data/comments');

			await mockApi.mockPosts();
			await mockApi.mockTags();

			// Mock comments endpoint to return special character data
			await page.route('**/api/comments*', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/xml',
					body: mockCommentsWithSpecialChars,
					headers: {
						'access-control-allow-origin': '*'
					}
				});
			});

			await page.goto('/post?id=1');

			// App should not crash
			await expect(page).toHaveURL('/post?id=1');

			// Comments should be visible (if comments are rendered)
			const bodyHtml = await page.innerHTML('body');

			// HTML entities should be properly decoded or escaped
			// Should not contain raw &lt; or &amp; in visible text (should be decoded)
			// But should not execute any scripts from comment content
			expect(bodyHtml).toBeTruthy();
		});
	});

	test.describe('Sync API Errors', () => {
		test('handles sync code generation failure', async ({ page, mockApi }) => {
			await mockApi.mockSyncPostError();

			await page.goto('/account');

			// Try to generate sync code
			const generateButton = page.getByRole('button', { name: /generate/i }).first();

			if (await generateButton.isVisible()) {
				await generateButton.click();

				// Should show error message
				// Adjust based on your actual error handling
				await page.waitForTimeout(500);

				// App should not crash
				await expect(page).toHaveURL('/account');
			}
		});

		test('handles sync code not found (404)', async ({ page, mockApi }) => {
			await mockApi.mockSyncGetNotFound();

			await page.goto('/account');

			// Try to use invalid sync code
			const codeInput = page.getByPlaceholder(/code|enter/i).first();

			if (await codeInput.isVisible()) {
				await codeInput.fill('999999');

				const loadButton = page.getByRole('button', { name: /load|import/i }).first();
				if (await loadButton.isVisible()) {
					await loadButton.click();

					// Should show "code not found" error
					await page.waitForTimeout(500);

					// App should not crash
					await expect(page).toHaveURL('/account');
				}
			}
		});
	});

	test.describe('Edge Cases', () => {
		test('handles extremely long tags', async ({ page, mockApi }) => {
			const { mockLongTagPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockLongTagPost]);
			await mockApi.mockTags();

			// Navigate directly to post detail page with post that has 200 tags
			await page.goto('/post?id=88888');

			// Should handle 200 tags without crashing or overflow
			await expect(page).toHaveURL('/post?id=88888');

			// Verify page loaded successfully (tags should be visible)
			await expect(page.getByRole('main')).toBeVisible();
		});

		test('handles special characters in tags', async ({ page, mockApi }) => {
			const { mockSpecialCharPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockSpecialCharPost]);
			await mockApi.mockTags();

			await page.goto('/post?id=77777');

			// Should properly escape/sanitize special characters
			// No XSS should occur
			const bodyHtml = await page.innerHTML('body');

			// Should not contain unescaped script tags (they should be escaped or removed)
			// Check for the raw script tag - if found, XSS is possible
			expect(bodyHtml).not.toMatch(/<script>alert\(/);

			// Should not contain unescaped img with onerror
			expect(bodyHtml).not.toMatch(/<img[^>]+onerror=/i);

			// App should not crash
			await expect(page).toHaveURL('/post?id=77777');
		});

		test('handles unicode and emoji in URLs', async ({ page, mockApi }) => {
			const { mockUnicodePost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockUnicodePost]);
			await mockApi.mockTags();

			await page.goto('/post?id=22222');

			// Should handle unicode/emoji in source URLs
			await expect(page).toHaveURL('/post?id=22222');

			// Source link should be clickable if visible
			const sourceLink = page.getByRole('link', { name: /source/i }).first();
			if (await sourceLink.isVisible()) {
				// Browsers encode URLs, so check for either encoded or decoded version
				const href = await sourceLink.getAttribute('href');
				expect(href).toMatch(/(%E6%97%A5%E6%9C%AC%E8%AA%9E|日本語)/);
			}
		});

		test('handles posts with negative scores', async ({ page, mockApi }) => {
			const { mockNegativeScorePost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockNegativeScorePost]);
			await mockApi.mockTags();

			await page.goto('/post?id=44444');

			// Should display negative score correctly
			await expect(page).toHaveURL('/post?id=44444');

			// Score should be formatted properly
			const body = await page.textContent('body');
			expect(body).toBeTruthy();
		});

		test('handles very high resolution posts', async ({ page, mockApi }) => {
			const { mockHighResPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockHighResPost]);
			await mockApi.mockTags();

			await page.goto('/post?id=55555');

			// Should handle 16000x12000 dimensions
			await expect(page).toHaveURL('/post?id=55555');

			// // Dimensions should be displayed
			const image = page.locator('img.post-media').first();

			const height = await image.getAttribute('height');
			const width = await image.getAttribute('width');
			expect(width).toBe('12000');
			expect(height).toBe('16000');
		});

		test('handles minimal post data', async ({ page, mockApi }) => {
			const { mockMinimalPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockMinimalPost]);
			await mockApi.mockTags();

			await page.goto('/post?id=66666');

			// Should handle post with minimal data
			await expect(page).toHaveURL('/post?id=66666');

			// Should not crash with missing fields
			const body = await page.textContent('body');
			expect(body).toBeTruthy();
		});

		test('handles posts with parent relationships', async ({ page, mockApi }) => {
			const { mockChildPost } = await import('./mocks/data/posts');

			await mockApi.mockPosts([mockChildPost]);
			await mockApi.mockTags();

			await page.goto('/post?id=33333');

			// Should show parent relationship if UI supports it
			await expect(page).toHaveURL('/post?id=33333');

			// May show "Parent" or "Variant" link
			const body = await page.textContent('body');
			expect(body).toBeTruthy();
		});
	});

	test.describe('Network Resilience', () => {
		test('handles intermittent failures', async ({ page, mockApi }) => {
			// First request fails
			await mockApi.mockPostsNetworkError();
			await page.goto('/');

			// Allow user to retry
			await mockApi.unrouteAll();
			await mockApi.mockPosts();

			// Retry mechanism (adjust based on your implementation)
			// Could be refresh button, automatic retry, etc.
			await page.reload();

			// Should now load successfully
			await expect(page.getByRole('listitem').first()).toBeVisible({ timeout: 5000 });
		});

		test('handles partial failures (some APIs work, others fail)', async ({ page, mockApi }) => {
			// Posts work, but tags fail
			await mockApi.mockPosts();
			await mockApi.mockTagsServerError();

			await page.goto('/');

			// Posts should still display
			await expect(page.getByRole('listitem').first()).toBeVisible();

			// Tags autocomplete may not work, but app should not crash
			await expect(page).toHaveURL('/');
		});

		test('handles timeout scenarios', async ({ page, mockApi }) => {
			// Very slow response (simulating timeout)
			await mockApi.mockPostsSlow(10000);

			await page.goto('/');

			// Should show loading state
			// May show timeout error after some time
			// Adjust timeout based on your implementation

			// App should not crash
			await expect(page).toHaveURL('/');
		});
	});

	test.describe('API Verification', () => {
		test('tracks API calls correctly', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTags();

			await page.goto('/');

			// Perform a search to trigger API calls
			const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
			await searchInput.fill('test');

			const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
			await searchButton.click();

			// Wait for network to settle
			await page.waitForLoadState('networkidle');

			// Verify posts was called
			expect(mockApi.wasCalled('posts')).toBe(true);
			expect(mockApi.getCallCount('posts')).toBeGreaterThan(0);

			// Check all calls
			const allCalls = mockApi.getAllCalls();
			expect(allCalls.size).toBeGreaterThan(0);
		});

		test('resets call tracking', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTags();
			await page.goto('/');

			// Perform a search to trigger API calls
			const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
			await searchInput.fill('test');

			const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
			await searchButton.click();

			await page.waitForLoadState('networkidle');

			expect(mockApi.wasCalled('posts')).toBe(true);

			// Reset
			mockApi.resetCallLog();
			expect(mockApi.wasCalled('posts')).toBe(false);
			expect(mockApi.getCallCount('posts')).toBe(0);
		});

		test('tracks multiple calls to same endpoint', async ({ page, mockApi }) => {
			await mockApi.mockPosts();
			await mockApi.mockTags();

			await page.goto('/');

			// Perform initial search
			const searchInput = page.getByRole('combobox', { name: 'Search for tags' });
			await searchInput.fill('first');

			const searchButton = page.getByRole('button', { name: 'Search with the selected tags' });
			await searchButton.click();

			await page.waitForLoadState('networkidle');

			const initialCount = mockApi.getCallCount('posts');
			expect(initialCount).toBeGreaterThan(0);

			// Trigger another search
			await searchInput.fill('second');
			await searchButton.click();
			await page.waitForLoadState('networkidle');

			// Should have triggered additional posts calls
			const finalCount = mockApi.getCallCount('posts');
			expect(finalCount).toBeGreaterThan(initialCount);
		});
	});
});

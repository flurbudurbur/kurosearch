/**
 * ApiMocker - Utility class for mocking API responses in Playwright tests
 */

import type { Page } from '@playwright/test';
import { mockPosts } from './data/posts';
import { mockTagSuggestions, createMockTagXml } from './data/tags';
import { mockCommentsXml, createMockCommentsXml, mockEmptyCommentsXml } from './data/comments';
import { mockSyncCodeResponse, mockSyncConfigData } from './data/sync';

export class ApiMocker {
	private syncCodes: Map<string, any> = new Map();
	private usedSyncCodes: Set<string> = new Set();
	private callLog: Map<string, number> = new Map();

	constructor(private page: Page) {}

	/**
	 * Mock GET /api/posts endpoint
	 * Handles various query parameters: tags, limit, pid, field
	 */
	async mockPosts(customPosts?: r34.Post[]) {
		const posts = customPosts || mockPosts;

		await this.page.route('**/api/posts*', async (route) => {
			const url = new URL(route.request().url());
			const limit = url.searchParams.get('limit');
			const pid = url.searchParams.get('pid');
			const id = url.searchParams.get('id');
			const tags = url.searchParams.get('tags');

			this.logApiCall('posts', route.request().url());

			// Handle limit=0 (count only, returns XML)
			// Count needs to consider tag filtering to be accurate
			if (limit === '0') {
				let count = 0;

				// If no tags specified, return full database count
				if (!tags) {
					count = posts.length > 0 ? 11000000 : 0;
				} else {
					// Apply tag filtering to get accurate count
					const actualTags = tags
						.split(/\s+/)
						.filter(
							(tag) =>
								tag &&
								!tag.startsWith('sort:') &&
								!tag.startsWith('score:') &&
								!tag.startsWith('rating:')
						);

					if (actualTags.length > 0) {
						const filteredPosts = posts.filter((p) => {
							const postTags = p.tags.split(' ');
							return actualTags.every((tag) => {
								if (tag.startsWith('-')) {
									const tagName = tag.substring(1);
									return !postTags.includes(tagName);
								}
								if (tag.startsWith('(') && tag.endsWith(')') && tag.includes('~')) {
									const orTags = tag
										.slice(1, -1)
										.split('~')
										.map((t) => t.trim());
									return orTags.some((orTag) => postTags.includes(orTag));
								}
								return postTags.includes(tag);
							});
						});
						count = filteredPosts.length;
					} else {
						// Only special parameters, return full count
						count = posts.length > 0 ? 11000000 : 0;
					}
				}

				await route.fulfill({
					status: 200,
					contentType: 'application/xml',
					body: `<?xml version="1.0" encoding="UTF-8"?>
<posts count="${count}" offset="0"/>`,
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Handle specific post ID (only 'id' parameter, not 'pid')
			// Note: 'pid' is the page number for pagination, not a post ID
			if (id) {
				const post = posts.find((p) => p.id === id);
				if (post) {
					await route.fulfill({
						status: 200,
						contentType: 'application/json',
						body: JSON.stringify([post]),
						headers: {
							'access-control-allow-origin': '*'
						}
					});
				} else {
					// Return 404 for non-existent posts
					await route.fulfill({
						status: 404,
						contentType: 'application/json',
						body: JSON.stringify({ error: 'Post not found' }),
						headers: {
							'access-control-allow-origin': '*'
						}
					});
				}
				return;
			}

			// Handle tag filtering
			let filteredPosts = posts;
			if (tags) {
				// Filter out special Rule34 API parameters (sort, score, rating)
				// These are search modifiers, not actual tags
				// Note: tags parameter is already URL-decoded, so + becomes space
				const actualTags = tags
					.split(/\s+/)
					.filter(
						(tag) =>
							tag &&
							!tag.startsWith('sort:') &&
							!tag.startsWith('score:') &&
							!tag.startsWith('rating:')
					);

				// If there are actual tags to filter by, filter the posts
				if (actualTags.length > 0) {
					filteredPosts = posts.filter((p) => {
						const postTags = p.tags.split(' ');
						return actualTags.every((tag) => {
							// Handle negative tags (exclude)
							if (tag.startsWith('-')) {
								const tagName = tag.substring(1);
								return !postTags.includes(tagName);
							}
							// Handle OR tags (must be in parentheses with ~)
							// Validates format: (tag1~tag2~tag3)
							if (tag.startsWith('(') && tag.endsWith(')') && tag.includes('~')) {
								const orTags = tag
									.slice(1, -1)
									.split('~')
									.map((t) => t.trim());
								return orTags.some((orTag) => postTags.includes(orTag));
							}
							// Regular tag (include)
							return postTags.includes(tag);
						});
					});
				}
			}

			// Handle pagination via pid parameter
			// Rule34 API uses pid for page number (0-indexed)
			// Default limit is 42 posts per page (Rule34 default)
			const pageSize = parseInt(limit || '42');
			const pageNum = parseInt(pid || '0');
			const startIndex = pageNum * pageSize;
			const endIndex = startIndex + pageSize;
			const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

			// Return paginated results
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(paginatedPosts),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock GET /api/tags endpoint
	 * Handles both autocomplete and tag details
	 */
	async mockTags(customSuggestions?: r34.Suggestion[]) {
		const suggestions = customSuggestions || mockTagSuggestions;

		await this.page.route('**/api/tags*', async (route) => {
			const url = new URL(route.request().url());
			const autocomplete = url.searchParams.get('autocomplete');
			const query = url.searchParams.get('q');
			const name = url.searchParams.get('name');

			this.logApiCall('tags', route.request().url());

			// Handle autocomplete
			if (autocomplete === 'true' && query) {
				const filtered = suggestions.filter((s) =>
					s.value.toLowerCase().includes(query.toLowerCase())
				);

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(filtered),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Handle tag details (returns XML)
			if (name) {
				await route.fulfill({
					status: 200,
					contentType: 'application/xml',
					body: createMockTagXml(name),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Default: return all suggestions
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(suggestions),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock GET /api/comments endpoint
	 * Requires post_id parameter
	 */
	async mockComments(postId?: string, commentCount?: number) {
		await this.page.route('**/api/comments*', async (route) => {
			const url = new URL(route.request().url());
			const requestPostId = url.searchParams.get('post_id');

			this.logApiCall('comments', route.request().url());

			// Error: missing post_id
			if (!requestPostId) {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Missing required query param: post_id' }),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Return comments for the requested post
			const xml =
				postId && requestPostId === postId && commentCount !== undefined
					? createMockCommentsXml(requestPostId, commentCount)
					: requestPostId === '1'
						? mockCommentsXml
						: mockEmptyCommentsXml;

			await route.fulfill({
				status: 200,
				contentType: 'application/xml',
				body: xml,
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock POST /api/sync endpoint
	 * Generates a sync code and stores the config
	 */
	async mockSyncPost(codeOverride?: string) {
		await this.page.route('**/api/sync', async (route) => {
			if (route.request().method() !== 'POST') {
				await route.continue();
				return;
			}

			this.logApiCall('sync-post', route.request().url());

			const code = codeOverride || mockSyncCodeResponse.code;
			const body = route.request().postDataJSON();

			// Store the config with the code
			this.syncCodes.set(code, body);

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ code }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock GET /api/sync/[code] endpoint
	 * Retrieves config by code (one-time use)
	 */
	async mockSyncGet(code?: string, config?: any) {
		await this.page.route('**/api/sync/*', async (route) => {
			if (route.request().method() !== 'GET') {
				await route.continue();
				return;
			}

			this.logApiCall('sync-get', route.request().url());

			const url = new URL(route.request().url());
			const requestCode = url.pathname.split('/').pop();

			if (!requestCode) {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Missing code' }),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Check if code was already used
			if (this.usedSyncCodes.has(requestCode)) {
				await route.fulfill({
					status: 404,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Code not found or already used' }),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Get config from stored codes or use provided config
			const storedConfig = this.syncCodes.get(requestCode);
			const responseConfig = config || storedConfig || mockSyncConfigData;

			if (!storedConfig && !config && code !== requestCode) {
				await route.fulfill({
					status: 404,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Code not found' }),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Mark code as used
			this.usedSyncCodes.add(requestCode);

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(responseConfig),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock all common API endpoints with default data
	 */
	async mockAll() {
		await this.mockPosts();
		await this.mockTags();
		await this.mockComments();
		await this.mockSyncPost();
		await this.mockSyncGet();
	}

	/**
	 * Clear all mocked routes
	 */
	async unrouteAll() {
		await this.page.unroute('**/api/posts*');
		await this.page.unroute('**/api/tags*');
		await this.page.unroute('**/api/comments*');
		await this.page.unroute('**/api/sync');
		await this.page.unroute('**/api/sync/*');
	}

	/**
	 * Reset sync code tracking
	 */
	resetSyncCodes() {
		this.syncCodes.clear();
		this.usedSyncCodes.clear();
	}

	// ==========================================
	// ERROR STATE MOCKING
	// ==========================================

	/**
	 * Mock /api/posts to return a 500 server error
	 */
	async mockPostsServerError() {
		await this.page.route('**/api/posts*', async (route) => {
			this.logApiCall('posts', route.request().url());
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal server error' }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/posts to return empty results
	 */
	async mockPostsEmpty() {
		await this.page.route('**/api/posts*', async (route) => {
			const url = new URL(route.request().url());
			const limit = url.searchParams.get('limit');

			this.logApiCall('posts', route.request().url());

			// Handle limit=0 (count query)
			if (limit === '0') {
				await route.fulfill({
					status: 200,
					contentType: 'application/xml',
					body: `<?xml version="1.0" encoding="UTF-8"?>
<posts count="0" offset="0"/>`,
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Return empty array for regular requests
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/posts with delayed response (for testing loading states)
	 */
	async mockPostsSlow(delayMs: number = 2000) {
		await this.page.route('**/api/posts*', async (route) => {
			this.logApiCall('posts', route.request().url());
			await new Promise((resolve) => setTimeout(resolve, delayMs));
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockPosts),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/posts to simulate network failure
	 */
	async mockPostsNetworkError() {
		await this.page.route('**/api/posts*', async (route) => {
			this.logApiCall('posts', route.request().url());
			await route.abort('failed');
		});
	}

	/**
	 * Mock /api/tags to return a 500 server error
	 */
	async mockTagsServerError() {
		await this.page.route('**/api/tags*', async (route) => {
			this.logApiCall('tags', route.request().url());
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal server error' }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/tags to return empty autocomplete results
	 */
	async mockTagsEmpty() {
		await this.page.route('**/api/tags*', async (route) => {
			const url = new URL(route.request().url());
			const autocomplete = url.searchParams.get('autocomplete');

			this.logApiCall('tags', route.request().url());

			if (autocomplete === 'true') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([]),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// For tag details, return a "not found" XML
			await route.fulfill({
				status: 404,
				contentType: 'application/xml',
				body: `<?xml version="1.0" encoding="UTF-8"?>
<tags/>`,
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/comments to return a 500 server error
	 */
	async mockCommentsServerError() {
		await this.page.route('**/api/comments*', async (route) => {
			this.logApiCall('comments', route.request().url());
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal server error' }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/sync POST to return a 500 server error
	 */
	async mockSyncPostError() {
		await this.page.route('**/api/sync', async (route) => {
			if (route.request().method() !== 'POST') {
				await route.continue();
				return;
			}

			this.logApiCall('sync-post', route.request().url());
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Failed to generate sync code' }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Mock /api/sync GET to return 404 (code not found)
	 */
	async mockSyncGetNotFound() {
		await this.page.route('**/api/sync/*', async (route) => {
			if (route.request().method() !== 'GET') {
				await route.continue();
				return;
			}

			this.logApiCall('sync-get', route.request().url());
			await route.fulfill({
				status: 404,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Code not found or expired' }),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	// ==========================================
	// CONVENIENCE PRESETS
	// ==========================================

	/**
	 * Preset: Mock a successful search with results
	 */
	async setupSuccessfulSearch() {
		await this.mockPosts();
		await this.mockTags();
	}

	/**
	 * Preset: Mock an empty search (no results found)
	 */
	async setupEmptySearch() {
		await this.mockPostsEmpty();
		await this.mockTags();
	}

	/**
	 * Preset: Mock network errors across all endpoints
	 */
	async setupNetworkError() {
		await this.mockPostsNetworkError();
		await this.page.route('**/api/tags*', async (route) => {
			this.logApiCall('tags', route.request().url());
			await route.abort('failed');
		});
		await this.page.route('**/api/comments*', async (route) => {
			this.logApiCall('comments', route.request().url());
			await route.abort('failed');
		});
	}

	/**
	 * Preset: Mock server errors (500) across all endpoints
	 */
	async setupServerError() {
		await this.mockPostsServerError();
		await this.mockTagsServerError();
		await this.mockCommentsServerError();
	}

	/**
	 * Preset: Mock slow responses for testing loading states
	 */
	async setupSlowResponses(delayMs: number = 2000) {
		await this.mockPostsSlow(delayMs);
		await this.page.route('**/api/tags*', async (route) => {
			this.logApiCall('tags', route.request().url());
			await new Promise((resolve) => setTimeout(resolve, delayMs));
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockTagSuggestions),
				headers: {
					'access-control-allow-origin': '*'
				}
			});
		});
	}

	/**
	 * Preset: Mock successful sync flow
	 */
	async setupSuccessfulSync() {
		await this.mockSyncPost();
		await this.mockSyncGet();
	}

	// ==========================================
	// MOCK VERIFICATION UTILITIES
	// ==========================================

	/**
	 * Log an API call for verification
	 */
	private logApiCall(endpoint: string, url: string) {
		const count = this.callLog.get(endpoint) || 0;
		this.callLog.set(endpoint + ': ' + url, count + 1);
	}

	/**
	 * Get the number of times an endpoint was called
	 */
	getCallCount(endpoint: string): number {
		return this.callLog.get(endpoint) || 0;
	}

	/**
	 * Check if an endpoint was called at least once
	 */
	wasCalled(endpoint: string): boolean {
		return this.getCallCount(endpoint) > 0;
	}

	/**
	 * Reset call tracking
	 */
	resetCallLog() {
		this.callLog.clear();
	}

	/**
	 * Get all logged calls
	 */
	getAllCalls(): Map<string, number> {
		return new Map(this.callLog);
	}
}

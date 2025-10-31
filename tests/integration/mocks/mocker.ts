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

			// Handle limit=0 (count only, returns XML)
			if (limit === '0') {
				await route.fulfill({
					status: 200,
					contentType: 'application/xml',
					body: `<?xml version="1.0" encoding="UTF-8"?>
<posts count="${posts.length}" offset="0"/>`,
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Handle specific post ID (both 'id' and 'pid' parameters)
			const postId = id || pid;
			if (postId) {
				const post = posts.find((p) => p.id === postId);
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
			if (tags) {
				const filteredPosts = posts.filter((p) => {
					const postTags = p.tags.split(' ');
					const requestedTags = tags.split(' ');
					return requestedTags.every((tag) => postTags.includes(tag));
				});

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(filteredPosts),
					headers: {
						'access-control-allow-origin': '*'
					}
				});
				return;
			}

			// Default: return all posts
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(posts),
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
}

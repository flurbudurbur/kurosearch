/**
 * E2E API Routes Tests
 *
 * These tests verify that the API routes are working correctly by making actual HTTP requests
 * to the server endpoints. They test server-side logic, security headers, and API contracts.
 *
 * Note: These are E2E tests, not integration tests, because they:
 * - Test the server API directly using the request fixture
 * - Don't involve browser UI or user workflows
 * - Verify API contracts and server-side behavior
 */

import { test, expect } from '@playwright/test';

test.describe('API Routes', () => {
	test.describe('GET /api/posts', () => {
		test('should fetch posts with basic query params', async ({ request }) => {
			const response = await request.get('/api/posts', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('application/json');

			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch posts with tags filter', async ({ request }) => {
			const response = await request.get('/api/posts?tags=sfw', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch posts with limit param', async ({ request }) => {
			const response = await request.get('/api/posts?limit=10', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeLessThanOrEqual(10);
		});

		test('should fetch post by pid', async ({ request }) => {
			const response = await request.get('/api/posts?pid=1', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should return XML for count request (limit=0)', async ({ request }) => {
			const response = await request.get('/api/posts?limit=0', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should accept field parameter', async ({ request }) => {
			const response = await request.get('/api/posts?field=id', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
		});

		test('should reject requests without x-requested-by header', async ({ request }) => {
			const response = await request.get('/api/posts');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/tags', () => {
		test('should fetch tag autocomplete', async ({ request }) => {
			const response = await request.get('/api/tags?autocomplete=true&q=s', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			// Note: The content-type from the upstream API may vary
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch tag details by name', async ({ request }) => {
			const response = await request.get('/api/tags?name=sfw', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should reject requests without x-requested-by header', async ({ request }) => {
			const response = await request.get('/api/tags?autocomplete=true&q=s');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/comments', () => {
		test('should fetch comments for a post', async ({ request }) => {
			const response = await request.get('/api/comments?post_id=1', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should return 400 when post_id is missing', async ({ request }) => {
			const response = await request.get('/api/comments', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(400);
			const data = await response.json();
			expect(data).toHaveProperty('error');
			expect(data.error).toContain('post_id');
		});

		test('should reject requests without x-requested-by header', async ({ request }) => {
			const response = await request.get('/api/comments?post_id=1');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('POST /api/sync', () => {
		test('should generate sync code with config', async ({ request }) => {
			const config = {
				theme: 'dark',
				blocked: [],
				supertags: []
			};

			const response = await request.post('/api/sync', {
				headers: {
					'x-sveltekit-load': '1',
					'content-type': 'application/json'
				},
				data: config
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty('code');
			expect(data.code).toMatch(/^\d{6}$/);
		});

		test('should reject requests without x-requested-by header', async ({ request }) => {
			const config = { theme: 'dark' };

			const response = await request.post('/api/sync', {
				data: config
			});

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/sync/[code]', () => {
		test('should retrieve config with valid code (one-time use)', async ({ request }) => {
			// First generate a sync code
			const config = {
				theme: 'light',
				blocked: ['ai'],
				supertags: []
			};

			const createResponse = await request.post('/api/sync', {
				headers: {
					'x-sveltekit-load': '1',
					'content-type': 'application/json'
				},
				data: config
			});

			expect(createResponse.status()).toBe(200);
			const { code } = await createResponse.json();

			// Retrieve the config with the code
			const getResponse = await request.get(`/api/sync/${code}`, {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(getResponse.status()).toBe(200);
			const retrievedConfig = await getResponse.json();
			expect(retrievedConfig).toEqual(config);

			// Try to use the same code again (should fail - one-time use)
			const secondGetResponse = await request.get(`/api/sync/${code}`, {
				headers: { 'x-sveltekit-load': '1' }
			});

			// Should return 404 or 500 for expired/used code
			expect([404, 500]).toContain(secondGetResponse.status());
		});

		test('should return error for invalid code', async ({ request }) => {
			const response = await request.get('/api/sync/999999', {
				headers: { 'x-sveltekit-load': '1' }
			});

			// Should return 404 or 500 for invalid code
			expect([404, 500]).toContain(response.status());
		});

		test('should return error when code is missing', async ({ request }) => {
			const response = await request.get('/api/sync/', {
				headers: { 'x-sveltekit-load': '1' }
			});

			// This should either be 404 (no route), 308 (redirect), or 405 (method not allowed)
			expect([404, 308, 405]).toContain(response.status());
		});

		test('should reject requests without x-requested-by header', async ({ request }) => {
			const response = await request.get('/api/sync/123456');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('Header validation', () => {
		test("should accept requests with 'x-sveltekit-load: 1'", async ({ request }) => {
			const response = await request.get('/api/posts', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.status()).toBe(200);
		});

		test('should reject requests with invalid x-requested-by value', async ({ request }) => {
			const response = await request.get('/api/posts', {
				headers: { 'x-requested-by': 'invalid' }
			});

			expect(response.status()).toBe(403);
		});

		test('should handle content-type correctly for JSON responses', async ({ request }) => {
			const response = await request.get('/api/posts', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.headers()['content-type']).toContain('application/json');
		});

		test('should handle content-type correctly for XML responses', async ({ request }) => {
			const response = await request.get('/api/posts?limit=0', {
				headers: { 'x-sveltekit-load': '1' }
			});

			expect(response.headers()['content-type']).toContain('text/xml');
		});
	});
});

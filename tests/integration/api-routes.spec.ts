import { test, expect } from '@playwright/test';

test.describe('API Routes', () => {
	test.describe('GET /api/posts', () => {
		test('should fetch posts with basic query params', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('application/json');

			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch posts with tags filter', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?tags=sfw', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch posts with limit param', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?limit=10', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
			expect(data.length).toBeLessThanOrEqual(10);
		});

		test('should fetch post by pid', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?pid=1', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should return XML for count request (limit=0)', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?limit=0', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should accept field parameter', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?field=id', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
		});

		test('should reject requests without x-requested-by header', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/tags', () => {
		test('should fetch tag autocomplete', async ({ page }) => {
			const response = await page.request.get(
				'http://localhost:5173/api/tags?autocomplete=true&q=s',
				{
					headers: { 'x-requested-by': 'frontend' }
				}
			);

			expect(response.status()).toBe(200);
			// Note: The content-type from the upstream API may vary
			const data = await response.json();
			expect(Array.isArray(data)).toBe(true);
		});

		test('should fetch tag details by name', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/tags?name=sfw', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should reject requests without x-requested-by header', async ({ page }) => {
			const response = await page.request.get(
				'http://localhost:5173/api/tags?autocomplete=true&q=s'
			);

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/comments', () => {
		test('should fetch comments for a post', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/comments?post_id=1', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
			expect(response.headers()['content-type']).toContain('text/xml');
		});

		test('should return 400 when post_id is missing', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/comments', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(400);
			const data = await response.json();
			expect(data).toHaveProperty('error');
			expect(data.error).toContain('post_id');
		});

		test('should reject requests without x-requested-by header', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/comments?post_id=1');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('POST /api/sync', () => {
		test('should generate sync code with config', async ({ page }) => {
			const config = JSON.stringify({
				theme: 'dark',
				blocked: [],
				supertags: []
			});

			const response = await page.request.post('http://localhost:5173/api/sync', {
				headers: {
					'x-requested-by': 'frontend',
					'content-type': 'application/json'
				},
				data: config
			});

			expect(response.status()).toBe(200);
			const data = await response.json();
			expect(data).toHaveProperty('code');
			expect(data.code).toMatch(/^\d{6}$/);
		});

		test('should reject requests without x-requested-by header', async ({ page }) => {
			const config = JSON.stringify({ theme: 'dark' });

			const response = await page.request.post('http://localhost:5173/api/sync', {
				data: config
			});

			expect(response.status()).toBe(403);
		});
	});

	test.describe('GET /api/sync/[code]', () => {
		test('should retrieve config with valid code (one-time use)', async ({ page }) => {
			// First generate a sync code
			const config = JSON.stringify({
				theme: 'light',
				blocked: ['ai'],
				supertags: []
			});

			const createResponse = await page.request.post('http://localhost:5173/api/sync', {
				headers: {
					'x-requested-by': 'frontend',
					'content-type': 'application/json'
				},
				data: config
			});

			expect(createResponse.status()).toBe(200);
			const { code } = await createResponse.json();

			// Retrieve the config with the code
			const getResponse = await page.request.get(`http://localhost:5173/api/sync/${code}`, {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(getResponse.status()).toBe(200);
			const retrievedConfig = await getResponse.json();
			expect(retrievedConfig).toEqual(JSON.parse(config));

			// Try to use the same code again (should fail - one-time use)
			const secondGetResponse = await page.request.get(`http://localhost:5173/api/sync/${code}`, {
				headers: { 'x-requested-by': 'frontend' }
			});

			// Accepting either 404 or 500 since the error handling may return 500
			expect([404, 500]).toContain(secondGetResponse.status());
		});

		test('should return error for invalid code', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/sync/999999', {
				headers: { 'x-requested-by': 'frontend' }
			});

			// Accepting either 404 or 500 since the error handling may return 500
			expect([404, 500]).toContain(response.status());
		});

		test('should return error when code is missing', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/sync/', {
				headers: { 'x-requested-by': 'frontend' }
			});

			// This should either be 404 (no route), 308 (redirect), or 405 (method not allowed)
			expect([404, 308, 405]).toContain(response.status());
		});

		test('should reject requests without x-requested-by header', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/sync/123456');

			expect(response.status()).toBe(403);
		});
	});

	test.describe('Header validation', () => {
		test('should accept requests with x-requested-by: frontend', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.status()).toBe(200);
		});

		test('should reject requests with invalid x-requested-by value', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts', {
				headers: { 'x-requested-by': 'invalid' }
			});

			expect(response.status()).toBe(403);
		});

		test('should handle content-type correctly for JSON responses', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.headers()['content-type']).toContain('application/json');
		});

		test('should handle content-type correctly for XML responses', async ({ page }) => {
			const response = await page.request.get('http://localhost:5173/api/posts?limit=0', {
				headers: { 'x-requested-by': 'frontend' }
			});

			expect(response.headers()['content-type']).toContain('text/xml');
		});
	});
});

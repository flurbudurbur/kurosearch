import { afterEach, describe, expect, it } from 'vitest';
import { getPage, getPostsUrl } from '$lib/logic/api-client/posts/posts';
import { mockFetch, makeResponse } from '../../../../../setup/mocks/fetch';

const originalFetch = global.fetch as any;

describe('posts', () => {
	afterEach(() => {
		global.fetch = originalFetch;
	});

	describe('getPage', () => {
		it('response not ok throws Error', async () => {
			mockFetch(async () => new Response('nope', { status: 500 }));
			await expect(getPage(0, '')).rejects.toBeInstanceOf(Error);
		});

		it('empty/invalid json response yields [] (handled with warning)', async () => {
			// Return invalid JSON that will cause parseJson to fall back/throw path, which getPage catches and returns []
			mockFetch(async () => makeResponse({ text: 'not-json' }));
			const res = await getPage(0, '');
			expect(res).toEqual([]);
		});
	});

	describe('getPostsUrl', () => {
		it('does not include tags when they are empty', () => {
			expect(getPostsUrl(0, '', '', '')).toBe(
				`http://localhost:3000/api/posts?fields=tag_info&limit=100&pid=0`
			);
		});

		it('includes tags when they are not empty', () => {
			expect(getPostsUrl(0, 'example', '', '')).toBe(
				`http://localhost:3000/api/posts?fields=tag_info&limit=100&pid=0&tags=example`
			);
		});
	});
});

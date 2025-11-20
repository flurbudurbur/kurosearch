import { describe, it, expect } from 'vitest';
import * as Api from '$lib/logic/api-client/ApiClient';

describe('ApiClient barrel exports', () => {
	it('re-exports posts, comments, and tags APIs', () => {
		// posts
		expect(typeof (Api as any).getPage).toBe('function');
		expect(typeof (Api as any).getPost).toBe('function');
		expect(typeof (Api as any).getCount).toBe('function');
		expect(typeof (Api as any).getPostsUrl).toBe('function');
		expect(typeof (Api as any).getCountUrl).toBe('function');
		expect(typeof (Api as any).PAGE_SIZE).toBe('number');

		// comments
		expect(typeof (Api as any).getComments).toBe('function');

		// tags
		expect(typeof (Api as any).getTagSuggestions).toBe('function');
		expect(typeof (Api as any).getTagDetails).toBe('function');
	});
});

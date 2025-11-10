import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules exactly as search-builder.ts imports them (relative paths)
vi.mock('$lib/logic/tag-serialization', () => ({
	serializeSearch: vi.fn(() => 'SERIALIZED_TAGS')
}));

vi.mock('$lib/logic/api-client/ApiClient', () => ({
	getPage: vi.fn(async () => ['post-1']),
	getCount: vi.fn(async () => 123),
	getPostsUrl: vi.fn(
		() => 'http://example.com/api/posts?pid=0&fields=tag_info&limit=100&tags=SERIALIZED_TAGS'
	)
}));

import { SearchBuilder } from '$lib/logic/search-builder';
import * as TagSerialization from '$lib/logic/tag-serialization';
import * as ApiClient from '$lib/logic/api-client/ApiClient';

const mockedSerialize = vi.mocked(TagSerialization.serializeSearch);
const mockedGetPage = vi.mocked(ApiClient.getPage);
const mockedGetCount = vi.mocked(ApiClient.getCount);
const mockedGetPostsUrl = vi.mocked(ApiClient.getPostsUrl);

describe('SearchBuilder', () => {
	beforeEach(() => {
		mockedSerialize.mockClear();
		mockedGetPage.mockClear();
		mockedGetCount.mockClear();
		mockedGetPostsUrl.mockClear();
	});

	it('supports chaining setters and coalesces apiKey/userId', async () => {
		const b = new SearchBuilder()
			.withPid(5)
			.withTags([{ name: 'tagA' } as any])
			.withSupertags([{ name: 'superA', weight: 1 } as any])
			.withSortProperty('score' as any)
			.withSortDirection('asc' as any)
			.withScoreValue(10)
			.withScoreComparator('<=' as any)
			.withRating('safe' as any)
			.withBlockedContent({ nsfw: true, gore: false } as any)
			.withApiKey('secret')
			.withUserId('user');

		// First call computes serialization and forwards to getPage/getCount
		const [page, count] = await b.getPageAndCount();

		expect(page).toEqual(['post-1']);
		expect(count).toBe(123);

		// serializeSearch called with current state
		expect(mockedSerialize).toHaveBeenCalledTimes(1);
		const args = mockedSerialize.mock.calls[0];
		expect(args[0]).toEqual([{ name: 'tagA' }]);
		expect(args[1]).toBe('score');
		expect(args[2]).toBe('asc');
		expect(args[3]).toBe(10);
		expect(args[4]).toBe('safe');
		expect(args[5]).toBe('<=');
		// blockedContent should keep only truthy keys
		expect(args[6]).toContain('nsfw');
		expect(args[6]).not.toContain('gore');
		// supertags passed through
		expect(args[7]).toEqual([{ name: 'superA', weight: 1 }]);

		// getPage/getCount forwarded proper args
		expect(mockedGetPage).toHaveBeenCalledWith(5, 'SERIALIZED_TAGS', 'secret', 'user', undefined);
		expect(mockedGetCount).toHaveBeenCalledWith('SERIALIZED_TAGS', 'secret', 'user');

		// Coalescing of falsy values
		b.withApiKey(undefined as any).withUserId(undefined as any);
		await b.getPage();
		expect(mockedGetPage).toHaveBeenLastCalledWith(5, 'SERIALIZED_TAGS', '', '', undefined);
	});

	it('caches the serialized tagString across getPage/getCount/getQuery', async () => {
		const b = new SearchBuilder().withPid(2);

		// First call should compute serialization
		await b.getPage();
		expect(mockedSerialize).toHaveBeenCalledTimes(1);

		// Subsequent calls reuse cached tagString (no additional serializeSearch calls)
		await b.getCount();
		await b.getQuery();
		expect(mockedSerialize).toHaveBeenCalledTimes(1);

		// Ensure ApiClient functions were called with cached tagString
		expect(mockedGetPage).toHaveBeenCalledWith(2, 'SERIALIZED_TAGS', '', '', undefined);
		expect(mockedGetCount).toHaveBeenCalledWith('SERIALIZED_TAGS', '', '');
		// getQuery uses page 0 by design
		expect(mockedGetPostsUrl).toHaveBeenCalledWith(0, 'SERIALIZED_TAGS', '', '', undefined);
	});

	it('uses defaults when not explicitly set', async () => {
		const b = new SearchBuilder();
		await b.getPageAndCount();

		expect(mockedSerialize).toHaveBeenCalledTimes(1);
		const args = mockedSerialize.mock.calls[0];
		// defaults from constructor
		expect(args[0]).toEqual([]); // tags
		expect(args[1]).toBe('id');
		expect(args[2]).toBe('desc');
		expect(args[3]).toBe(0);
		expect(args[4]).toBe('all');
		expect(args[5]).toBe('>=');
		expect(args[6]).toEqual([]); // blockedContent
		expect(args[7]).toEqual([]); // supertags
	});
});

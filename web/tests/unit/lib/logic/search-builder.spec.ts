import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules exactly as search-builder.ts imports them (relative paths)
vi.mock('$lib/logic/tag-serialization', () => ({
	serializeSearch: vi.fn(() => 'SERIALIZED_TAGS')
}));

const { mockPostsClient } = vi.hoisted(() => ({
	mockPostsClient: {
		getPage: vi.fn(async () => ['post-1']),
		getCount: vi.fn(async () => 123),
		setAuth: vi.fn()
	}
}));

vi.mock('$lib/logic/api-client', () => ({
	postsClient: mockPostsClient
}));

import { SearchBuilder } from '$lib/logic/search-builder';
import * as TagSerialization from '$lib/logic/tag-serialization';

const mockedSerialize = vi.mocked(TagSerialization.serializeSearch);

describe('SearchBuilder', () => {
	beforeEach(() => {
		mockedSerialize.mockClear();
		mockPostsClient.getPage.mockClear();
		mockPostsClient.getCount.mockClear();
		mockPostsClient.setAuth.mockClear();
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

		// Client methods called with serialized tags and page size
		expect(mockPostsClient.setAuth).toHaveBeenCalledWith('secret', 'user');
		expect(mockPostsClient.getPage).toHaveBeenCalledWith(5, 'SERIALIZED_TAGS', undefined);
		expect(mockPostsClient.getCount).toHaveBeenCalledWith('SERIALIZED_TAGS');

		// Coalescing of falsy values - setAuth should not be called with empty values
		mockPostsClient.setAuth.mockClear();
		b.withApiKey(undefined as any).withUserId(undefined as any);
		await b.getPage();
		expect(mockPostsClient.setAuth).not.toHaveBeenCalled();
		expect(mockPostsClient.getPage).toHaveBeenLastCalledWith(5, 'SERIALIZED_TAGS', undefined);
	});

	it('caches the serialized tagString across getPage/getCount', async () => {
		const b = new SearchBuilder().withPid(2);

		// First call should compute serialization
		await b.getPage();
		expect(mockedSerialize).toHaveBeenCalledTimes(1);

		// Subsequent calls reuse cached tagString (no additional serializeSearch calls)
		await b.getCount();
		expect(mockedSerialize).toHaveBeenCalledTimes(1);

		// Ensure client methods were called with cached tagString
		expect(mockPostsClient.getPage).toHaveBeenCalledWith(2, 'SERIALIZED_TAGS', undefined);
		expect(mockPostsClient.getCount).toHaveBeenCalledWith('SERIALIZED_TAGS');
	});

	it('getQuery throws error since deprecated', () => {
		const b = new SearchBuilder().withPid(2);

		// getQuery is no longer supported with WebSocket-only API
		expect(() => b.getQuery()).toThrow('no longer supported');
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

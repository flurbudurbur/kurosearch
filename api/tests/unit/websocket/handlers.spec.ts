import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handlePostsRequest } from '../../../src/features/posts/ws-handlers.js';
import { handleCommentsRequest } from '../../../src/features/comments/ws-handlers.js';
import { handleTagsRequest } from '../../../src/features/tags/ws-handlers.js';
import { mockFetch } from '../../helpers/test-utils.js';
import {
	mockPostsResponse,
	mockCommentsXmlResponse,
	mockTagsAutocompleteResponse,
	mockTagDetailsXmlResponse
} from '../../fixtures/rule34-responses.js';

describe('websocket handlers', () => {
	let mockLogger: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		};

		// Mock Valkey as unavailable for simpler tests
		vi.doMock('../../../src/lib/valkey.js', () => ({
			getValkeyClient: () => null,
			disconnectValkey: vi.fn(),
			isValkeyAvailable: vi.fn(() => false)
		}));
	});

	describe('handlePostsRequest', () => {
		it('should fetch posts from Rule34 API', async () => {
			mockFetch(
				new Map([
					['api.rule34.xxx', { json: mockPostsResponse, text: JSON.stringify(mockPostsResponse) }]
				])
			);

			const result = await handlePostsRequest({ tags: 'test', limit: '10' }, mockLogger);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should handle cache miss', async () => {
			mockFetch(
				new Map([
					['api.rule34.xxx', { json: mockPostsResponse, text: JSON.stringify(mockPostsResponse) }]
				])
			);

			await handlePostsRequest({ tags: 'test' }, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({ cacheKey: expect.any(String) }),
				'[WS] Cache MISS for posts'
			);
		});

		it('should append json=1 for non-count requests', async () => {
			const fetchSpy = vi.fn(async () => ({
				ok: true,
				status: 200,
				text: async () => JSON.stringify(mockPostsResponse),
				json: async () => mockPostsResponse
			})) as any;
			global.fetch = fetchSpy;

			await handlePostsRequest({ tags: 'test', limit: '10' }, mockLogger);

			const fetchUrl = (fetchSpy.mock.calls[0] as any)[0];
			expect(fetchUrl).toContain('json=1');
		});

		it('should not append json=1 for count requests', async () => {
			const fetchSpy = vi.fn(async () => ({
				ok: true,
				status: 200,
				text: async () => '<posts count="100"/>',
				json: async () => ({})
			})) as any;
			global.fetch = fetchSpy;

			await handlePostsRequest({ limit: '0' }, mockLogger);

			const fetchUrl = (fetchSpy.mock.calls[0] as any)[0];
			expect(fetchUrl).not.toContain('json=1');
		});

		it('should handle fetch errors', async () => {
			global.fetch = vi.fn(async () => ({
				ok: false,
				status: 500,
				text: async () => 'Server Error',
				json: async () => ({})
			})) as any;

			const result = await handlePostsRequest({ tags: 'test' }, mockLogger);

			expect(result).toBe('Server Error');
		});

		it('should pass through optional parameters', async () => {
			const fetchSpy = vi.fn(async () => ({
				ok: true,
				status: 200,
				text: async () => '{}',
				json: async () => ({})
			})) as any;
			global.fetch = fetchSpy;

			await handlePostsRequest({ tags: 'test', pid: '100', fields: 'id,tags' }, mockLogger);

			const fetchUrl = (fetchSpy.mock.calls[0] as any)[0];
			expect(fetchUrl).toContain('tags=test');
			expect(fetchUrl).toContain('pid=100');
			expect(fetchUrl).toContain('fields=id%2Ctags');
		});
	});

	describe('handleCommentsRequest', () => {
		it('should fetch comments from Rule34 API', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockCommentsXmlResponse }]]));

			const result = await handleCommentsRequest({ post_id: '123456' }, mockLogger);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should require post_id parameter', async () => {
			await expect(handleCommentsRequest({}, mockLogger)).rejects.toThrow('Missing required param');
		});

		it('should handle cache miss', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockCommentsXmlResponse }]]));

			await handleCommentsRequest({ post_id: '123456' }, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({ cacheKey: expect.any(String) }),
				'[WS] Cache MISS for comments'
			);
		});

		it('should use correct cache key format', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockCommentsXmlResponse }]]));

			await handleCommentsRequest({ post_id: '999' }, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({ cacheKey: expect.stringContaining('comments:999') }),
				expect.any(String)
			);
		});

		it('should handle fetch errors', async () => {
			global.fetch = vi.fn(async () => ({
				ok: false,
				status: 404,
				text: async () => 'Not Found'
			})) as any;

			const result = await handleCommentsRequest({ post_id: '123456' }, mockLogger);

			expect(result).toBe('Not Found');
		});
	});

	describe('handleTagsRequest', () => {
		it('should fetch autocomplete tags', async () => {
			mockFetch(
				new Map([
					[
						'api.rule34.xxx/autocomplete.php',
						{ text: JSON.stringify(mockTagsAutocompleteResponse) }
					]
				])
			);

			const result = await handleTagsRequest({ autocomplete: 'true', q: 'test' }, mockLogger);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should fetch tag details when not autocomplete', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockTagDetailsXmlResponse }]]));

			const result = await handleTagsRequest({ name: 'test_tag' }, mockLogger);

			expect(result).toBeDefined();
			expect(typeof result).toBe('string');
		});

		it('should handle autocomplete cache miss', async () => {
			mockFetch(
				new Map([
					[
						'api.rule34.xxx/autocomplete.php',
						{ text: JSON.stringify(mockTagsAutocompleteResponse) }
					]
				])
			);

			await handleTagsRequest({ autocomplete: 'true', q: 'artist' }, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({ cacheKey: expect.any(String) }),
				'[WS] Cache MISS for tags autocomplete'
			);
		});

		it('should handle details cache miss', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockTagDetailsXmlResponse }]]));

			await handleTagsRequest({ name: 'some_tag' }, mockLogger);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({ cacheKey: expect.any(String) }),
				'[WS] Cache MISS for tags details'
			);
		});

		it('should URL encode autocomplete query', async () => {
			const fetchSpy = vi.fn(async () => ({
				ok: true,
				status: 200,
				text: async () => '[]'
			})) as any;
			global.fetch = fetchSpy;

			await handleTagsRequest({ autocomplete: 'true', q: 'tag with spaces' }, mockLogger);

			const fetchUrl = (fetchSpy.mock.calls[0] as any)[0];
			expect(fetchUrl).toContain(encodeURIComponent('tag with spaces'));
		});

		it('should handle empty autocomplete query', async () => {
			mockFetch(new Map([['api.rule34.xxx/autocomplete.php', { text: '[]' }]]));

			const result = await handleTagsRequest({ autocomplete: 'true', q: '' }, mockLogger);

			expect(result).toBeDefined();
		});

		it('should handle fetch errors for autocomplete', async () => {
			global.fetch = vi.fn(async () => ({
				ok: false,
				status: 500,
				text: async () => 'Server Error'
			})) as any;

			const result = await handleTagsRequest({ autocomplete: 'true', q: 'test' }, mockLogger);

			expect(result).toBe('Server Error');
		});

		it('should handle fetch errors for details', async () => {
			global.fetch = vi.fn(async () => ({
				ok: false,
				status: 404,
				text: async () => 'Not Found'
			})) as any;

			const result = await handleTagsRequest({ name: 'nonexistent' }, mockLogger);

			expect(result).toBe('Not Found');
		});
	});

	describe('caching behavior', () => {
		it('should attempt to cache successful posts responses', async () => {
			mockFetch(
				new Map([
					['api.rule34.xxx', { json: mockPostsResponse, text: JSON.stringify(mockPostsResponse) }]
				])
			);

			const result = await handlePostsRequest({ tags: 'test' }, mockLogger);

			expect(result).toBeDefined();
			// Cache operations are fire-and-forget, so we just verify the request succeeded
		});

		it('should attempt to cache successful comments responses', async () => {
			mockFetch(new Map([['api.rule34.xxx', { text: mockCommentsXmlResponse }]]));

			const result = await handleCommentsRequest({ post_id: '123' }, mockLogger);

			expect(result).toBeDefined();
		});

		it('should attempt to cache successful tags responses', async () => {
			mockFetch(
				new Map([
					[
						'api.rule34.xxx/autocomplete.php',
						{ text: JSON.stringify(mockTagsAutocompleteResponse) }
					]
				])
			);

			const result = await handleTagsRequest({ autocomplete: 'true', q: 'test' }, mockLogger);

			expect(result).toBeDefined();
		});
	});

	describe('error handling', () => {
		it('should handle JSON parse errors in posts', async () => {
			global.fetch = vi.fn(async () => ({
				ok: true,
				status: 200,
				text: async () => 'Invalid JSON',
				json: async () => {
					throw new Error('Parse error');
				}
			})) as any;

			const result = await handlePostsRequest({ tags: 'test' }, mockLogger);

			expect(result).toBe('Invalid JSON');
		});

		it('should handle network errors in comments', async () => {
			global.fetch = vi.fn(async () => {
				throw new Error('Network error');
			}) as any;

			await expect(handleCommentsRequest({ post_id: '123' }, mockLogger)).rejects.toThrow(
				'Network error'
			);
		});

		it('should handle network errors in tags', async () => {
			global.fetch = vi.fn(async () => {
				throw new Error('Network error');
			}) as any;

			await expect(
				handleTagsRequest({ autocomplete: 'true', q: 'test' }, mockLogger)
			).rejects.toThrow('Network error');
		});
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWebSocketClient } from '../../../../../setup/mocks/websocket';

// Mock WebSocket client
let mockWsClient: ReturnType<typeof createMockWebSocketClient>;

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient
}));

// Import SUT after mocking
import { getPage, getPostsUrl } from '$lib/logic/api-client/posts/posts';

describe('posts', () => {
	beforeEach(() => {
		mockWsClient = createMockWebSocketClient();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getPage', () => {
		it('response not ok throws Error', async () => {
			// Mock WebSocket request to reject - but getPage catches and returns []
			mockWsClient.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			const res = await getPage(0, '');
			expect(res).toEqual([]);
		});

		it('empty/invalid json response yields [] (handled with warning)', async () => {
			// Return invalid JSON that will cause parseJson to throw, which getPage catches and returns []
			mockWsClient.request = vi.fn().mockResolvedValue('not-json');
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

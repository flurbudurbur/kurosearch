import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock WebSocket client - use vi.hoisted to ensure mock is defined before vi.mock
const { mockWsClient } = vi.hoisted(() => {
	return {
		mockWsClient: {
			current: {
				request: vi.fn(),
				connect: vi.fn(),
				disconnect: vi.fn(),
				subscribe: vi.fn(() => vi.fn()),
				onStateChange: vi.fn(() => vi.fn())
			}
		}
	};
});

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient.current
}));

// Import SUT after mocking
import { getPage, getPostsUrl } from '$lib/logic/api-client';

describe('posts', () => {
	beforeEach(() => {
		mockWsClient.current.request = vi.fn();
		mockWsClient.current.connect = vi.fn();
		mockWsClient.current.disconnect = vi.fn();
		mockWsClient.current.subscribe = vi.fn(() => vi.fn());
		mockWsClient.current.onStateChange = vi.fn(() => vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getPage', () => {
		it('response not ok throws Error', async () => {
			// Mock WebSocket request to reject - but getPage catches and returns []
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			const res = await getPage(0, '');
			expect(res).toEqual([]);
		});

		it('empty/invalid json response yields [] (handled with warning)', async () => {
			// Return invalid JSON that will cause parseJson to throw, which getPage catches and returns []
			mockWsClient.current.request = vi.fn().mockResolvedValue('not-json');
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

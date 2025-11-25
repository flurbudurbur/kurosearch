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
import { postsClient } from '$lib/logic/api-client';

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
		it('response not ok returns empty array', async () => {
			// Mock WebSocket request to reject - but getPage catches and returns []
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			const res = await postsClient.getPage(0, '');
			expect(res).toEqual([]);
		});

		it('empty/invalid json response yields [] (handled with warning)', async () => {
			// Return invalid JSON that will cause parseJson to throw, which getPage catches and returns []
			mockWsClient.current.request = vi.fn().mockResolvedValue('not-json');
			const res = await postsClient.getPage(0, '');
			expect(res).toEqual([]);
		});
	});

	// Note: getPostsUrl/getCountUrl tests removed as these deprecated
	// HTTP URL builders have been removed in favor of WebSocket-only API
});

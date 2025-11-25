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
import { commentsClient } from '$lib/logic/api-client';

describe('pages', () => {
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

	describe('getComments', () => {
		it('invalid postId throws TypeError', () => {
			// @ts-expect-error
			return commentsClient.getComments('a').catch((e) => expect(e).toBeInstanceOf(TypeError));
		});

		it('response not ok throws Error', () => {
			// Mock WebSocket request to reject
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			commentsClient.getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing created_at throws error', async () => {
			// Mock WebSocket request to return XML without created_at
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);
			commentsClient.getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing body throws error', async () => {
			// Mock WebSocket request to return XML without body
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			commentsClient.getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing creator throws error', async () => {
			// Mock WebSocket request to return XML without creator
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" id="2" creator_id="1"/></comments>'
				);

			commentsClient.getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('parses comments with postId', async () => {
			// Mock WebSocket request to return valid XML
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			const comments = await commentsClient.getComments(0);
			expect(comments.length).toBe(1);
			expect(comments[0]).toEqual({
				author: 'kurozenzen',
				createdAt: '2023-01-01 10:20',
				content: 'comment'
			});
		});

		it('parses comments without postId', async () => {
			// Mock WebSocket request to return valid XML
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			const comments = await commentsClient.getComments(3);
			expect(comments.length).toBe(1);
			expect(comments[0]).toEqual({
				author: 'kurozenzen',
				createdAt: '2023-01-01 10:20',
				content: 'comment'
			});
		});
	});
});

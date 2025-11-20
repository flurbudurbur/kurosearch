import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockWebSocketClient } from '../../../../../setup/mocks/websocket';

// Mock WebSocket client
let mockWsClient: ReturnType<typeof createMockWebSocketClient>;

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient
}));

// Import SUT after mocking
import { getComments } from '$lib/logic/api-client/comments/comments';

describe('pages', () => {
	beforeEach(() => {
		mockWsClient = createMockWebSocketClient();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getComments', () => {
		it('invalid postId throws TypeError', () => {
			// @ts-expect-error
			return getComments('a').catch((e) => expect(e).toBeInstanceOf(TypeError));
		});

		it('response not ok throws Error', () => {
			// Mock WebSocket request to reject
			mockWsClient.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing created_at throws error', async () => {
			// Mock WebSocket request to return XML without created_at
			mockWsClient.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);
			getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing body throws error', async () => {
			// Mock WebSocket request to return XML without body
			mockWsClient.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('missing creator throws error', async () => {
			// Mock WebSocket request to return XML without creator
			mockWsClient.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" id="2" creator_id="1"/></comments>'
				);

			getComments(0).catch((e) => expect(e).toBeInstanceOf(Error));
		});

		it('parses comments with postId', async () => {
			// Mock WebSocket request to return valid XML
			mockWsClient.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			const comments = await getComments(0);
			expect(comments.length).toBe(1);
			expect(comments[0]).toEqual({
				author: 'kurozenzen',
				createdAt: '2023-01-01 10:20',
				content: 'comment'
			});
		});

		it('parses comments without postId', async () => {
			// Mock WebSocket request to return valid XML
			mockWsClient.request = vi
				.fn()
				.mockResolvedValue(
					'<comments type="array"><comment created_at="2023-01-01 10:20" post_id="3" body="comment" creator="kurozenzen" id="2" creator_id="1"/></comments>'
				);

			const comments = await getComments(3);
			expect(comments.length).toBe(1);
			expect(comments[0]).toEqual({
				author: 'kurozenzen',
				createdAt: '2023-01-01 10:20',
				content: 'comment'
			});
		});
	});
});

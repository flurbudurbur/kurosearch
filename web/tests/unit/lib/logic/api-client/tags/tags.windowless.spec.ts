import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockWebSocketClient } from '../../../../../setup/mocks/websocket';

// Mock WebSocket client
let mockWsClient: ReturnType<typeof createMockWebSocketClient>;

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient
}));

// Import SUT after mocking
import { getTagSuggestions, getTagDetails } from '$lib/logic/api-client/tags/tags';

describe('api-client/tags (window undefined paths)', () => {
	let savedWindow: any;

	beforeEach(() => {
		// Remove window so URL builder uses localhost origin
		savedWindow = (global as any).window;
		// @ts-ignore
		delete (global as any).window;
		// Reset mock client
		mockWsClient = createMockWebSocketClient();
	});

	afterEach(() => {
		// restore window
		(global as any).window = savedWindow;
		vi.restoreAllMocks();
	});

	it('getTagDetails uses localhost origin when window is undefined', async () => {
		const xml = '<tags count="1"><tag name="anon" count="1" type="0" /></tags>';
		const requestSpy = vi.fn().mockImplementation((endpoint, params) => {
			// Verify the endpoint is correct (WebSocket uses short resource names)
			expect(endpoint).toBe('tags');
			expect(params.name).toBe('anon');
			return Promise.resolve(xml);
		});
		mockWsClient.request = requestSpy;

		const out = await getTagDetails('anon', '', '');
		expect(out).toEqual({ name: 'anon', count: 1, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});

	it('getTagSuggestions uses localhost origin when window is undefined', async () => {
		const payload = [{ value: 'tag_one', label: 'tag_one (123)' }];
		const requestSpy = vi.fn().mockImplementation((endpoint, params) => {
			// Verify the endpoint and params (WebSocket uses short resource names)
			expect(endpoint).toBe('tags');
			expect(params.autocomplete).toBe('1');
			expect(params.q).toBe('tag_one');
			return Promise.resolve(JSON.stringify(payload));
		});
		mockWsClient.request = requestSpy;

		const suggestions = await getTagSuggestions('tag one');
		expect(suggestions).toEqual([{ label: 'tag_one', count: 123, type: 'tag' }]);
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});
});

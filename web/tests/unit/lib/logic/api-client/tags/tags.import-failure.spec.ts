import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockWebSocketClient } from '../../../../../setup/mocks/websocket';

// Force the dynamic import of idb module to fail to exercise the catch branch
vi.mock('$lib/indexeddb/idb', () => {
	throw new Error('idb import failed');
});

// Mock WebSocket client
let mockWsClient: ReturnType<typeof createMockWebSocketClient>;

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient
}));

// Import SUT after mocking
import { getTagDetails } from '$lib/logic/api-client/tags/tags';

// Helper to set window.location.origin deterministically for URL building
const setOrigin = (origin: string) => {
	Object.defineProperty(window, 'location', {
		value: new URL(origin),
		writable: true
	});
};

describe('api-client/tags (idb import failure path)', () => {
	beforeEach(() => {
		setOrigin('http://localhost:3000/');
		// Simulate browser indexedDB presence to enter the try/catch block
		// @ts-ignore
		(window as any).indexedDB = {};
		// Reset mock client
		mockWsClient = createMockWebSocketClient();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		// @ts-ignore
		delete (window as any).indexedDB;
	});

	it('falls back to network when idb module import fails', async () => {
		const xml = '<tags count="1"><tag name="wolf" count="7" type="0" /></tags>';
		const requestSpy = vi.fn().mockResolvedValue(xml);
		mockWsClient.request = requestSpy;

		const out = await getTagDetails('wolf', '', '');
		expect(out).toEqual({ name: 'wolf', count: 7, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});
});

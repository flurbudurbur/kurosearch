import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Force the dynamic import of idb module to fail to exercise the catch branch
vi.mock('$lib/indexeddb/idb', () => {
	throw new Error('idb import failed');
});

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
import { tagsClient } from '$lib/logic/api-client';

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
		mockWsClient.current.request = vi.fn();
		mockWsClient.current.connect = vi.fn();
		mockWsClient.current.disconnect = vi.fn();
		mockWsClient.current.subscribe = vi.fn(() => vi.fn());
		mockWsClient.current.onStateChange = vi.fn(() => vi.fn());
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
		mockWsClient.current.request = requestSpy;

		const out = await tagsClient.getTagDetails('wolf');
		expect(out).toEqual({ name: 'wolf', count: 7, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as idb from '$lib/indexeddb/idb';

const delay = (ms = 10) => new Promise((r) => setTimeout(r, ms));

// Helper to set window.location.origin deterministically for URL building
const setOrigin = (origin: string) => {
	Object.defineProperty(window, 'location', {
		value: new URL(origin),
		writable: true
	});
};

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

describe('api-client/tags (cache hit path)', () => {
	beforeEach(async () => {
		setOrigin('http://localhost:3000/');
		// Ensure cache path is taken in SUT
		// @ts-ignore
		(window as any).indexedDB = (window as any).indexedDB ?? {};
		// wait for idb module to initialize and then seed
		await delay(20);
		idb.addIndexedTag({ name: 'bird', count: 10, type: 'general' } as any);
		await delay(10);
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

	it('returns cached tag without calling WebSocket', async () => {
		const requestSpy = vi.fn();
		mockWsClient.current.request = requestSpy;

		const res = await tagsClient.getTagDetails('bird');
		expect(res).toEqual({ name: 'bird', count: 10, type: 'general' });
		expect(requestSpy).not.toHaveBeenCalled();
	});
});

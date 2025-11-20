import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockWebSocketClient } from '../../../../../setup/mocks/websocket';
import * as idb from '$lib/indexeddb/idb';

const delay = (ms = 10) => new Promise((r) => setTimeout(r, ms));

// Helper to set window.location.origin deterministically for URL building
const setOrigin = (origin: string) => {
	Object.defineProperty(window, 'location', {
		value: new URL(origin),
		writable: true
	});
};

// Mock WebSocket client
let mockWsClient: ReturnType<typeof createMockWebSocketClient>;

vi.mock('$lib/websocket/client', () => ({
	initWebSocketClient: () => mockWsClient
}));

// Import SUT after mocking
import { getTagDetails } from '$lib/logic/api-client/tags/tags';

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
		mockWsClient = createMockWebSocketClient();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		// @ts-ignore
		delete (window as any).indexedDB;
	});

	it('returns cached tag without calling WebSocket', async () => {
		const requestSpy = vi.fn();
		mockWsClient.request = requestSpy;

		const res = await getTagDetails('bird', '', '');
		expect(res).toEqual({ name: 'bird', count: 10, type: 'general' });
		expect(requestSpy).not.toHaveBeenCalled();
	});
});

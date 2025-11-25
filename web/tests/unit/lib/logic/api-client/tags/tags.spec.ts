import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
import { tagsClient, resetAllClients } from '$lib/logic/api-client';

describe('api-client/tags', () => {
	beforeEach(() => {
		setOrigin('http://localhost:3000/');
		// Reset clients to get fresh instances
		resetAllClients();
		// Reset mock client before each test
		mockWsClient.current.request = vi.fn();
		mockWsClient.current.connect = vi.fn();
		mockWsClient.current.disconnect = vi.fn();
		mockWsClient.current.subscribe = vi.fn(() => vi.fn());
		mockWsClient.current.onStateChange = vi.fn(() => vi.fn());
	});

	afterEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
		// cleanup potential window.indexedDB flag
		// @ts-ignore
		delete (window as any).indexedDB;
	});

	describe('getTagSuggestions', () => {
		it('maps array responses into suggestions', async () => {
			const payload = [
				{ value: 'tag_one', label: 'tag_one (123)' },
				{ value: 'tag&amp;two', label: 'tag&amp;two (2)' }
			];
			// Mock WebSocket request to return JSON string
			mockWsClient.current.request = vi.fn().mockResolvedValue(JSON.stringify(payload));

			const res = await tagsClient.getTagSuggestions('tag');
			expect(res).toEqual([
				{ label: 'tag_one', count: 123, type: 'tag' },
				{ label: 'tag&amp;two', count: 2, type: 'tag' }
			]);
		});

		it('returns empty array when array is empty', async () => {
			// Mock WebSocket request to return empty array
			mockWsClient.current.request = vi.fn().mockResolvedValue(JSON.stringify([]));
			// With new error handling, it returns [] instead of throwing
			const result = await tagsClient.getTagSuggestions('x');
			expect(result).toEqual([]);
		});

		it('returns empty array on upstream message object error', async () => {
			// Mock WebSocket request to return error message
			mockWsClient.current.request = vi
				.fn()
				.mockResolvedValue(JSON.stringify({ message: 'rate limited' }));
			// With new error handling, it returns [] instead of throwing
			const result = await tagsClient.getTagSuggestions('x');
			expect(result).toEqual([]);
		});

		it('returns empty array on invalid JSON shape', async () => {
			// Mock WebSocket request to return invalid shape
			mockWsClient.current.request = vi.fn().mockResolvedValue(JSON.stringify({ not: 'array' }));
			// With new error handling, it returns [] instead of throwing
			const result = await tagsClient.getTagSuggestions('x');
			expect(result).toEqual([]);
		});

		it('returns empty array on non-OK response', async () => {
			// Mock WebSocket request to reject
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			// With new error handling, it returns [] instead of throwing
			const result = await tagsClient.getTagSuggestions('x');
			expect(result).toEqual([]);
		});
	});

	describe('getTagDetails', () => {
		it('returns undefined when no tag in xml', async () => {
			// Mock WebSocket request to return XML string
			mockWsClient.current.request = vi.fn().mockResolvedValue('<tags count="0"></tags>');
			const tag = await tagsClient.getTagDetails('');
			expect(tag).toBeUndefined();
		});

		it('parses xml and maps types and entities', async () => {
			const xml = '<tags count="1"><tag name="caf&amp;eacute;" count="42" type="1" /></tags>';
			// Mock WebSocket request to return XML string
			mockWsClient.current.request = vi.fn().mockResolvedValue(xml);
			const tag = await tagsClient.getTagDetails('');
			expect(tag).toEqual({ name: 'café', count: 42, type: 'artist' });
		});
	});
});

describe('getTagDetails (auth and cache branches)', () => {
	beforeEach(() => {
		setOrigin('http://localhost:3000/');
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

	it('appends api_key and user_id to request URL when both are provided', async () => {
		const xml = '<tags count="1"><tag name="bird" count="10" type="0" /></tags>';
		const requestSpy = vi.fn().mockImplementation((endpoint, params) => {
			expect(params.name).toBe('bird');
			expect(params.api_key).toBe('KEY');
			expect(params.user_id).toBe('USER');
			return Promise.resolve(xml);
		});
		mockWsClient.current.request = requestSpy;

		tagsClient.setAuth('KEY', 'USER');
		const tag = await tagsClient.getTagDetails('bird');
		expect(tag).toEqual({ name: 'bird', count: 10, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});

	it('ignores cache READ errors and proceeds to fetch', async () => {
		// Simulate browser indexedDB presence
		// @ts-ignore
		(window as any).indexedDB = {};

		// Mock idb where getIndexedTag throws
		vi.mock('$lib/indexeddb/idb', () => ({
			getIndexedTag: () => {
				throw new Error('read fail');
			}
		}));

		const xml = '<tags count="1"><tag name="lion" count="5" type="0" /></tags>';
		const requestSpy = vi.fn().mockResolvedValue(xml);
		mockWsClient.current.request = requestSpy;

		const tag = await tagsClient.getTagDetails('');
		expect(tag).toEqual({ name: 'lion', count: 5, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});

	it('ignores cache WRITE errors after successful fetch', async () => {
		// Simulate browser indexedDB presence
		// @ts-ignore
		(window as any).indexedDB = {};

		// Mock idb where addIndexedTag throws
		vi.mock('$lib/indexeddb/idb', () => ({
			getIndexedTag: async () => undefined,
			addIndexedTag: () => {
				throw new Error('write fail');
			}
		}));

		const xml = '<tags count="1"><tag name="tiger" count="3" type="0" /></tags>';
		const requestSpy = vi.fn().mockResolvedValue(xml);
		mockWsClient.current.request = requestSpy;

		const tag = await tagsClient.getTagDetails('');
		expect(tag).toEqual({ name: 'tiger', count: 3, type: 'general' });
		expect(requestSpy).toHaveBeenCalledTimes(1);
	});

	it('returns undefined when tag element is present but missing required attributes', async () => {
		const xml = '<tags count="1"><tag count="1" type="0" /></tags>'; // missing name
		mockWsClient.current.request = vi.fn().mockResolvedValue(xml);
		const tag = await tagsClient.getTagDetails('');
		expect(tag).toBeUndefined();
	});
});

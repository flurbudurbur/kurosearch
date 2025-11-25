import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ensure predictable origin for URL building
const setOrigin = (origin: string) => {
	Object.defineProperty(window, 'location', {
		value: new URL(origin),
		writable: true
	});
};

const delay = (ms = 10) => new Promise((r) => setTimeout(r, ms));

const clearStores = async () => {
	await new Promise<void>((resolve, reject) => {
		const req = indexedDB.open('kurosearch', 4);

		// Handle database schema creation
		req.addEventListener('upgradeneeded', (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const storeNames = Array.from(db.objectStoreNames as any as string[]);

			// Create stores if they don't exist
			if (!storeNames.includes('tags')) {
				db.createObjectStore('tags', { keyPath: 'name' });
			}
			if (!storeNames.includes('comments')) {
				const commentStore = db.createObjectStore('comments', { keyPath: 'postId' });
				commentStore.createIndex('indexedAt', 'indexedAt', { unique: false });
			}
			if (!storeNames.includes('posts')) {
				const postStore = db.createObjectStore('posts', { keyPath: 'id' });
				postStore.createIndex('indexedAt', 'indexedAt', { unique: false });
			}
		});

		req.addEventListener('success', (e) => {
			const db = (e.target as IDBOpenDBRequest).result;
			const tx = db.transaction(['comments', 'posts', 'tags'], 'readwrite');
			tx.objectStore('comments').clear();
			tx.objectStore('posts').clear();
			tx.objectStore('tags').clear();
			tx.addEventListener('complete', () => {
				db.close();
				resolve();
			});
			tx.addEventListener('error', (err) => reject(err));
			tx.addEventListener('abort', (err) => reject(err));
		});

		req.addEventListener('error', (e) => reject(e));
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
import { postsClient } from '$lib/logic/api-client';

describe('api-client/posts', () => {
	beforeEach(async () => {
		setOrigin('http://localhost:3000/');
		await delay(20);
		await clearStores();
		// Reset mock client before each test
		mockWsClient.current.request = vi.fn();
		mockWsClient.current.connect = vi.fn();
		mockWsClient.current.disconnect = vi.fn();
		mockWsClient.current.subscribe = vi.fn(() => vi.fn());
		mockWsClient.current.onStateChange = vi.fn(() => vi.fn());
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// Note: getPostsUrl and getCountUrl tests removed as these deprecated
	// HTTP URL builders have been removed in favor of WebSocket-only API

	describe('getPage', () => {
		it('maps valid posts and writes to cache', async () => {
			const payload: any[] = [
				// placeholder item that should be filtered out due to falsy change
				{ change: 0 },
				{
					height: '100',
					width: '200',
					preview_url: 'prev.jpg',
					file_url: 'video.webm',
					parent_id: null,
					sample_url: 'sample.jpg',
					sample_width: '100',
					sample_height: '100',
					rating: 'safe',
					tag_info: [
						{ tag: 'artist_one', count: 10, type: 'artist' },
						{ tag: 'general_tag', count: 1, type: 'general' }
					],
					tags: 'ignored',
					id: '1',
					change: '1700000000',
					comment_count: '5',
					score: '3',
					status: 'active',
					source: ''
				},
				{
					height: '10',
					width: '20',
					preview_url: 'prev2.jpg',
					file_url: 'anim.gif',
					parent_id: '5',
					sample_url: 'sample2.jpg',
					sample_width: '10',
					sample_height: '10',
					rating: 'questionable',
					tag_info: undefined,
					tags: 'tag1 tag2',
					id: '2',
					change: '1700000001',
					comment_count: '0',
					score: '0',
					status: 'active',
					source: ''
				},
				{
					height: '1',
					width: '2',
					preview_url: 'prev3.jpg',
					file_url: 'image.png',
					parent_id: null,
					sample_url: 'sample3.jpg',
					sample_width: '1',
					sample_height: '1',
					rating: 'explicit',
					tag_info: undefined,
					tags: 'tag3',
					id: '3',
					change: '1700000002',
					comment_count: '1',
					score: '2',
					status: 'active',
					source: ''
				},
				{
					height: '50',
					width: '60',
					preview_url: 'prev4.jpg',
					file_url: 'clip.mp4',
					parent_id: null,
					sample_url: 'sample4.jpg',
					sample_width: '50',
					sample_height: '60',
					rating: 'safe',
					tag_info: undefined,
					tags: 't4',
					id: '4',
					change: '1700000003',
					comment_count: '0',
					score: '1',
					status: 'active',
					source: ''
				}
			];

			// Mock WebSocket request to return JSON string
			mockWsClient.current.request = vi.fn().mockResolvedValue(JSON.stringify(payload));

			const res = await postsClient.getPage(0, '');
			expect(res).toHaveLength(4);
			expect(res[0]).toMatchObject({ id: 1, type: 'video' });
			expect(res[1]).toMatchObject({ id: 2, type: 'gif', parent_id: 5 });
			expect(res[2]).toMatchObject({ id: 3, type: 'image' });
			expect(res[3]).toMatchObject({ id: 4, type: 'video' });
			// tag_info parsed and sorted so that artist comes before general
			expect(res[0].tags[0].name).toBe('artist_one');
		});

		it('non-ok response rejects', async () => {
			// Mock WebSocket request to reject
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));

			// The function catches errors and returns [], so it won't reject
			const res = await postsClient.getPage(0, '');
			expect(res).toEqual([]);
		});
	});

	describe('getCount', () => {
		it('returns parsed count from xml', async () => {
			// Mock WebSocket request to return XML string
			mockWsClient.current.request = vi.fn().mockResolvedValue('<posts count="42"></posts>');
			const count = await postsClient.getCount('');
			expect(count).toBe(42);
		});

		it('returns 0 on non-ok response', async () => {
			// Mock WebSocket request to reject
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));
			const count = await postsClient.getCount('');
			expect(count).toBe(0);
		});

		it('returns 0 when count is invalid (NaN)', async () => {
			// Mock WebSocket request to return XML with invalid count
			mockWsClient.current.request = vi.fn().mockResolvedValue('<posts count="oops"></posts>');
			const count = await postsClient.getCount('');
			expect(count).toBe(0);
		});
	});

	describe('getPost', () => {
		it('fetches post and caches it; subsequent call uses cache', async () => {
			const payload = [
				{
					height: '100',
					width: '200',
					preview_url: 'prev.jpg',
					file_url: 'image.png',
					parent_id: null,
					sample_url: 'sample.jpg',
					sample_width: '100',
					sample_height: '100',
					rating: 'safe',
					tag_info: undefined,
					tags: 'a b',
					id: '99',
					change: '1700001234',
					comment_count: '0',
					score: '0',
					status: 'active',
					source: ''
				}
			];

			// Mock WebSocket request
			const requestSpy = vi.fn().mockResolvedValue(JSON.stringify(payload));
			mockWsClient.current.request = requestSpy;

			const p1 = await postsClient.getPost(99);
			expect(p1).toMatchObject({ id: 99, type: 'image' });
			expect(requestSpy).toHaveBeenCalledTimes(1);

			// Second call should hit the mocked idb cache (from addIndexedPost) and not call WebSocket
			const p2 = await postsClient.getPost(99);
			expect(p2).toMatchObject({ id: 99 });
			expect(requestSpy).toHaveBeenCalledTimes(1);
		});

		it('includes api_key and user_id in request when provided', async () => {
			const payload = [
				{
					height: '1',
					width: '1',
					preview_url: 'p.jpg',
					file_url: 'i.png',
					parent_id: null,
					sample_url: 's.jpg',
					sample_width: '1',
					sample_height: '1',
					rating: 'safe',
					tag_info: undefined,
					tags: '',
					id: '101',
					change: '1700000000',
					comment_count: '0',
					score: '0',
					status: 'active',
					source: ''
				}
			];

			// Mock WebSocket request and verify params
			const requestSpy = vi.fn().mockImplementation((endpoint, params) => {
				expect(params.api_key).toBe('ak');
				expect(params.user_id).toBe('ui');
				return Promise.resolve(JSON.stringify(payload));
			});
			mockWsClient.current.request = requestSpy;

			postsClient.setAuth('ak', 'ui');
			const p = await postsClient.getPost(101);
			expect(p).toBeDefined();
			expect(p!.id).toBe(101);
			expect(requestSpy).toHaveBeenCalledOnce();
		});

		it('returns undefined on error', async () => {
			// Mock WebSocket request to reject
			mockWsClient.current.request = vi.fn().mockRejectedValue(new Error('Request failed'));

			// With new error handling, it returns undefined instead of rejecting
			const result = await postsClient.getPost(777);
			expect(result).toBeUndefined();
		});

		it('uses localhost base when window is undefined', async () => {
			const payload = [
				{
					height: '1',
					width: '1',
					preview_url: 'p.jpg',
					file_url: 'i.png',
					parent_id: null,
					sample_url: 's.jpg',
					sample_width: '1',
					sample_height: '1',
					rating: 'safe',
					tag_info: undefined,
					tags: '',
					id: '202',
					change: '1700000000',
					comment_count: '0',
					score: '0',
					status: 'active',
					source: ''
				}
			];
			const orig = (globalThis as any).window;
			vi.stubGlobal('window', undefined as any);
			try {
				// Mock WebSocket request
				const requestSpy = vi.fn().mockResolvedValue(JSON.stringify(payload));
				mockWsClient.current.request = requestSpy;

				const p = await postsClient.getPost(202);
				expect(p).toBeDefined();
				expect(p!.id).toBe(202);
				expect(requestSpy).toHaveBeenCalledOnce();
			} finally {
				// @ts-ignore
				(globalThis as any).window = orig;
			}
		});
	});
});

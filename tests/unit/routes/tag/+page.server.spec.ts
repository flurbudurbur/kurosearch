import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Create controllable mocks
let mockParseXml: Mock;
let mockWithCache: Mock;
let mockFetch: Mock;

// Mock modules at top level
vi.mock('$lib/logic/parse-utils', () => ({
	get parseXml() {
		return mockParseXml;
	}
}));

vi.mock('$lib/server/cache-utils', () => ({
	get withCache() {
		return mockWithCache;
	},
	CACHE_TTL: {
		POSTS: 300,
		TAGS: 3600
	}
}));

describe('tag/+page.server.ts', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		// Setup default mocks
		mockParseXml = vi.fn();
		mockWithCache = vi.fn();
		mockFetch = vi.fn();

		// Setup global fetch
		global.fetch = mockFetch as any;
	});

	it('returns null when name parameter is not provided', async () => {
		const { load } = await import('$lib/../../src/routes/tag/+page.server');

		const result = await load({ url: new URL('http://localhost/tag') } as any);

		expect(result).toEqual({ name: null, tagData: null });
	});

	it('fetches and caches tag data when name is provided', async () => {
		// Setup mocks
		const mockParsedDom = {
			querySelectorAll: vi.fn(() => ({
				values: () => ['tag1', 'tag2', 'tag3']
			}))
		};

		mockParseXml = vi.fn(() => mockParsedDom);
		mockFetch = vi.fn(async () => ({
			text: async () => '<html><tag>data</tag></html>'
		})) as any;

		// Mock withCache to execute the fetch function
		mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
			const result = await fetchFn();
			return { data: result, cached: false };
		});

		global.fetch = mockFetch as any;

		const { load } = await import('$lib/../../src/routes/tag/+page.server');

		const result = await load({
			url: new URL('http://localhost/tag?name=test')
		} as any);

		expect(result).toBeDefined();
		expect(result?.name).toBe('test');
		expect(result?.tagData).toBe('["tag1","tag2","tag3"]');

		// Verify fetch was called with correct URL
		expect(mockFetch).toHaveBeenCalledWith(
			'https://rule34.xxx/index.php?page=tags&s=list&tags=test&sort=asc&order_by=index_count'
		);
	});

	it('returns cached data when available', async () => {
		const cachedData = '["cached1","cached2"]';

		// Mock withCache to return cached data
		mockWithCache = vi.fn(async (_key: string, _options: any, _fetchFn: () => Promise<any>) => {
			return { data: cachedData, cached: true };
		});

		mockFetch = vi.fn() as any;
		global.fetch = mockFetch as any;

		const { load } = await import('$lib/../../src/routes/tag/+page.server');

		const result = await load({
			url: new URL('http://localhost/tag?name=cached')
		} as any);

		expect(result).toBeDefined();
		expect(result?.name).toBe('cached');
		expect(result?.tagData).toBe(cachedData);

		// Verify fetch was NOT called (cache hit)
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('handles parseXml returning null', async () => {
		mockParseXml = vi.fn(() => null);
		mockFetch = vi.fn(async () => ({
			text: async () => 'invalid xml'
		})) as any;

		// Mock withCache to execute the fetch function
		mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
			const result = await fetchFn();
			return { data: result, cached: false };
		});

		global.fetch = mockFetch as any;

		const { load } = await import('$lib/../../src/routes/tag/+page.server');

		const result = await load({
			url: new URL('http://localhost/tag?name=invalid')
		} as any);

		expect(result).toBeDefined();
		expect(result?.name).toBe('invalid');
		// When parseXml returns null, querySelectorAll will fail and tagData will be undefined stringified
		expect(result).toHaveProperty('name');
		expect(result).toHaveProperty('tagData');
	});

	it('uses correct cache key and TTL', async () => {
		// Setup parse mock
		mockParseXml = vi.fn(() => ({
			querySelectorAll: vi.fn(() => ({
				values: () => []
			}))
		}));

		mockFetch = vi.fn(async () => ({
			text: async () => '<html></html>'
		})) as any;

		// Track withCache calls
		const withCacheSpy = vi.fn(async (key: string, options: any, fetchFn: any) => {
			expect(key).toBe('kurosearch:tag:example');
			expect(options.ttl).toBe(3600); // CACHE_TTL.TAGS
			expect(options.prefix).toBe('kurosearch:tag:');

			const result = await fetchFn();
			return { data: result, cached: false };
		});

		mockWithCache = withCacheSpy;
		global.fetch = mockFetch as any;

		const { load } = await import('$lib/../../src/routes/tag/+page.server');

		await load({
			url: new URL('http://localhost/tag?name=example')
		} as any);

		expect(withCacheSpy).toHaveBeenCalledWith(
			'kurosearch:tag:example',
			{ ttl: 3600, prefix: 'kurosearch:tag:' },
			expect.any(Function)
		);
	});

	// Error path testing
	describe('Error Handling', () => {
		it('handles network timeout gracefully', async () => {
			mockFetch = vi.fn(async () => {
				throw new Error('Network timeout');
			}) as any;

			mockWithCache = vi.fn(async (_key: string, _options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			await expect(
				load({
					url: new URL('http://localhost/tag?name=timeout')
				} as any)
			).rejects.toThrow('Network timeout');
		});

		it('handles fetch returning non-ok response', async () => {
			mockFetch = vi.fn(async () => ({
				ok: false,
				status: 503,
				text: async () => 'Service Unavailable'
			})) as any;

			mockParseXml = vi.fn(() => null);

			mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL('http://localhost/tag?name=error')
			} as any);

			expect(result).toBeDefined();
			expect(result?.name).toBe('error');
			expect(mockFetch).toHaveBeenCalled();
		});

		it('handles malformed XML response', async () => {
			mockParseXml = vi.fn(() => null);
			mockFetch = vi.fn(async () => ({
				text: async () => 'This is not XML at all!!!'
			})) as any;

			mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL('http://localhost/tag?name=malformed')
			} as any);

			expect(result).toBeDefined();
			expect(result?.name).toBe('malformed');
			expect(mockParseXml).toHaveBeenCalledWith('This is not XML at all!!!');
		});

		it('handles empty XML response', async () => {
			mockParseXml = vi.fn(() => ({
				querySelectorAll: vi.fn(() => ({
					values: () => []
				}))
			}));

			mockFetch = vi.fn(async () => ({
				text: async () => ''
			})) as any;

			mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL('http://localhost/tag?name=empty')
			} as any);

			expect(result).toBeDefined();
			expect(result?.name).toBe('empty');
			expect(result?.tagData).toBe('[]');
		});

		it('handles missing querySelectorAll results', async () => {
			mockParseXml = vi.fn(() => ({
				querySelectorAll: vi.fn(() => null)
			}));

			mockFetch = vi.fn(async () => ({
				text: async () => '<html><body></body></html>'
			})) as any;

			mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL('http://localhost/tag?name=noresults')
			} as any);

			expect(result).toBeDefined();
			expect(result?.name).toBe('noresults');
			expect(result).toHaveProperty('tagData');
		});

		it('handles special characters in tag name', async () => {
			const specialName = 'tag%20with%20spaces%26special%3Dchars';

			mockParseXml = vi.fn(() => ({
				querySelectorAll: vi.fn(() => ({
					values: () => ['tag1']
				}))
			}));

			mockFetch = vi.fn(async () => ({
				text: async () => '<html></html>'
			})) as any;

			mockWithCache = vi.fn(async (key: string, options: any, fetchFn: () => Promise<any>) => {
				const result = await fetchFn();
				return { data: result, cached: false };
			});

			global.fetch = mockFetch as any;

			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL(`http://localhost/tag?name=${specialName}`)
			} as any);

			// URL decoding should happen automatically
			expect(result).toBeDefined();
			expect(result?.name).toBe(decodeURIComponent(specialName));
			expect(mockFetch).toHaveBeenCalled();
		});

		it('handles empty tag name parameter', async () => {
			const { load } = await import('$lib/../../src/routes/tag/+page.server');

			const result = await load({
				url: new URL('http://localhost/tag?name=')
			} as any);

			// Empty string should be treated as no name
			expect(result).toEqual({ name: null, tagData: null });
		});
	});
});

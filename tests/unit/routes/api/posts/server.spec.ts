import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '$routes/api/posts/+server';
import { R34_API_URL } from '$lib/logic/api-client/url';
import * as valkeyModule from '$lib/server/valkey';

// Mock Valkey to bypass caching in these tests
vi.mock('$lib/server/valkey');

const makeUrl = (search: string) => new URL(`http://localhost/api/posts${search}`);

describe('routes/api/posts +server', () => {
	beforeEach(() => {
		// Mock Valkey client as unavailable to bypass caching
		vi.spyOn(valkeyModule, 'getValkeyClient').mockReturnValue(null);
	});
	it('appends json=1 when limit is not 0 and sets default JSON content-type', async () => {
		const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
			const url = input instanceof URL ? input : new URL(String(input));
			// Should include json=1 when not count
			expect(url.toString()).toContain(`${R34_API_URL}/?`);
			expect(url.searchParams.get('json')).toBe('1');
			// Respond with no explicit content-type and null body to avoid auto header
			return new Response(null, { status: 200 });
		});

		const res = await GET({ url: makeUrl('?limit=5&pid=0'), fetch: fetchSpy } as any);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
	});

	it('does not append json when limit=0 (count request) and sets default XML content-type', async () => {
		const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
			const url = input instanceof URL ? input : new URL(String(input));
			expect(url.searchParams.get('json')).toBeNull();
			return new Response(null, { status: 200 });
		});

		const res = await GET({ url: makeUrl('?limit=0'), fetch: fetchSpy } as any);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/xml; charset=utf-8');
	});

	it('passes through upstream content-type if present', async () => {
		const fetchSpy = vi.fn(async () => {
			return new Response('{}', {
				status: 200,
				headers: { 'content-type': 'application/json; charset=utf-8' }
			});
		});

		const res = await GET({ url: makeUrl('?limit=1'), fetch: fetchSpy } as any);
		expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
	});

	// Error path testing
	describe('Error Handling', () => {
		it('handles network timeout errors', async () => {
			const fetchSpy = vi.fn(async () => {
				throw new Error('Network timeout');
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			expect(res.status).toBeGreaterThanOrEqual(500);
		});

		it('handles upstream 500 errors gracefully', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('Internal Server Error', { status: 500 });
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			expect(res.status).toBe(500);
		});

		it('handles upstream 404 errors', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('Not Found', { status: 404 });
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			expect(res.status).toBe(404);
		});

		it('handles malformed JSON response', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('This is not valid JSON{{{', {
					status: 200,
					headers: { 'content-type': 'application/json' }
				});
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			// Should still return response even if content is malformed
			expect(res.status).toBe(200);
		});

		it('handles empty response body', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('', { status: 200 });
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			expect(res.status).toBe(200);
		});

		it('handles invalid limit parameter', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('{}', { status: 200 });
			});

			await GET({ url: makeUrl('?limit=invalid'), fetch: fetchSpy } as any);
			// Should still make request even with invalid limit
			expect(fetchSpy).toHaveBeenCalled();
		});

		it('handles negative limit parameter', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('{}', { status: 200 });
			});

			await GET({ url: makeUrl('?limit=-1'), fetch: fetchSpy } as any);
			expect(fetchSpy).toHaveBeenCalled();
		});

		it('handles missing required parameters', async () => {
			const fetchSpy = vi.fn(async () => {
				return new Response('{}', { status: 200 });
			});

			// Request without any parameters
			await GET({ url: makeUrl(''), fetch: fetchSpy } as any);
			expect(fetchSpy).toHaveBeenCalled();
		});

		it('handles upstream connection refused', async () => {
			const fetchSpy = vi.fn(async () => {
				throw new Error('ECONNREFUSED');
			});

			const res = await GET({ url: makeUrl('?limit=5'), fetch: fetchSpy } as any);
			expect(res.status).toBeGreaterThanOrEqual(500);
		});

		it('handles upstream timeout with custom timeout header', async () => {
			const fetchSpy = vi.fn(async () => {
				throw new Error('Request timeout');
			});

			const res = await GET({ url: makeUrl('?limit=5&tags=test'), fetch: fetchSpy } as any);
			expect(res.status).toBeGreaterThanOrEqual(500);
		});
	});
});

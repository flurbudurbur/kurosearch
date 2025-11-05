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
});

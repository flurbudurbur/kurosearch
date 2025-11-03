import { describe, it, expect, vi } from 'vitest';
import { GET } from '$routes/api/tags/+server';
import { R34_API_URL } from '$lib/logic/api-client/url';

const makeUrl = (search: string) => new URL(`http://localhost/api/tags${search}`);

describe('routes/api/tags +server', () => {
	it('autocomplete: proxies to autocomplete endpoint and defaults JSON content-type', async () => {
		const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
			const url = input instanceof URL ? input : new URL(String(input));
			expect(url.toString()).toBe(`${R34_API_URL}/autocomplete.php?q=my%20tag`);
			return new Response(null, { status: 200 });
		});

		const res = await GET({ url: makeUrl('?autocomplete=1&q=my tag'), fetch: fetchSpy } as any);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
	});

	it('tag details: proxies to dapi tag index and sets XML content-type by default', async () => {
		const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
			const url = input instanceof URL ? input : new URL(String(input));
			expect(url.toString()).toContain(`${R34_API_URL}/?`);
			expect(url.searchParams.get('page')).toBe('dapi');
			expect(url.searchParams.get('s')).toBe('tag');
			expect(url.searchParams.get('q')).toBe('index');
			expect(url.searchParams.get('limit')).toBe('1');
			expect(url.searchParams.get('name')).toBe('bird');
			return new Response(null, { status: 200 });
		});

		const res = await GET({ url: makeUrl('?name=bird'), fetch: fetchSpy } as any);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/xml; charset=utf-8');
	});
});

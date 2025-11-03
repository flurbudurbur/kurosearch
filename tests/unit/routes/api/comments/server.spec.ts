import { describe, it, expect, vi } from 'vitest';
import { GET } from '$routes/api/comments/+server';
import { R34_API_URL } from '$lib/logic/api-client/url';

const makeUrl = (search: string) => new URL(`http://localhost/api/comments${search}`);

describe('routes/api/comments +server', () => {
	it('returns 400 when missing required post_id', async () => {
		const fetchSpy = vi.fn();
		const res = await GET({ url: makeUrl(''), fetch: fetchSpy } as any);
		expect(fetchSpy).not.toHaveBeenCalled();
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toContain('Missing required query param');
	});

	it('proxies to dapi with id param and sets XML content-type by default', async () => {
		const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
			const url = input instanceof URL ? input : new URL(String(input));
			expect(url.toString()).toContain(`${R34_API_URL}/?`);
			expect(url.searchParams.get('page')).toBe('dapi');
			expect(url.searchParams.get('s')).toBe('comment');
			expect(url.searchParams.get('q')).toBe('index');
			expect(url.searchParams.get('id')).toBe('123');
			return new Response(null, { status: 200 });
		});

		const res = await GET({ url: makeUrl('?post_id=123'), fetch: fetchSpy } as any);
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('text/xml; charset=utf-8');
	});
});

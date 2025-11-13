import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type MakeReqOpts = {
	method?: string;
	path?: string;
	headers?: Record<string, string>;
	origin?: string;
	frontendOrigin?: string | null;
};

// Helper to dynamically import handle with specific env values
const importHandleWithEnv = async (envValues: Record<string, string | undefined>) => {
	vi.resetModules();
	vi.doMock('$env/dynamic/private', () => ({ env: envValues }));
	const module = await import('../../src/hooks.server');
	return module.handle;
};

const makeEvent = ({
	method = 'GET',
	path = '/api/test',
	headers = {},
	origin
}: Omit<MakeReqOpts, 'frontendOrigin'> = {}) => {
	const url = new URL(`http://localhost${path}`);
	const req = new Request(url, { method, headers: { ...headers, ...(origin ? { origin } : {}) } });
	const resolve = vi.fn(async () => new Response('ok', { status: 200 }));
	return { event: { url, request: req } as any, resolve };
};

describe('hooks.server handle', () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('allows OPTIONS and HEAD passthrough on /api', async () => {
		const handle = await importHandleWithEnv({});

		for (const method of ['OPTIONS', 'HEAD']) {
			const { event, resolve } = makeEvent({ method });
			const res = await handle({ event, resolve } as any);
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.status).toBe(200);
		}
	});

	it('blocks navigation requests to /api (sec-fetch-dest=document)', async () => {
		const handle = await importHandleWithEnv({});
		const { event, resolve } = makeEvent({ headers: { 'sec-fetch-dest': 'document' } });
		const res = await handle({ event, resolve } as any);
		expect(resolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
	});

	it('allows when x-sveltekit-load=1 is set', async () => {
		const handle = await importHandleWithEnv({});
		const { event, resolve } = makeEvent({ headers: { 'x-sveltekit-load': '1' } });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('allows same-origin fetch with correct origin and referer', async () => {
		const handle = await importHandleWithEnv({});
		const headers = {
			'sec-fetch-site': 'same-origin',
			origin: 'http://localhost',
			referer: 'http://localhost/some/page'
		};
		const { event, resolve } = makeEvent({ headers });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('allows when x-sveltekit-load header is present', async () => {
		const handle = await importHandleWithEnv({});
		const headers = {
			'x-sveltekit-load': '1',
			origin: 'http://localhost'
		};
		const { event, resolve } = makeEvent({ headers });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('respects FRONTEND_ORIGIN override for origin checks', async () => {
		// Import handle with FRONTEND_ORIGIN set to example.com
		const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com' });

		const headers = {
			'sec-fetch-site': 'same-origin',
			origin: 'https://example.com',
			referer: 'https://example.com/'
		};
		const { event, resolve } = makeEvent({ headers });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('non-/api paths are not filtered and pass through', async () => {
		const handle = await importHandleWithEnv({});
		const { event, resolve } = makeEvent({ path: '/home' });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	// Security-focused tests
	describe('Security Tests', () => {
		it('blocks mismatched origin and referer', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost',
				referer: 'http://evil.com/attack'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks requests with wrong origin when FRONTEND_ORIGIN is set', async () => {
			const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com' });
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost',
				referer: 'http://localhost/'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks subdomain attack attempts', async () => {
			const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com' });
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'https://evil.example.com',
				referer: 'https://evil.example.com/'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks cross-origin requests without proper headers', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'cross-site',
				origin: 'http://evil.com',
				referer: 'http://evil.com/page'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks missing referer with origin present', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost'
				// No referer
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks origin with trailing slash mismatch', async () => {
			const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com/' });
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'https://different.com/',
				referer: 'https://different.com/'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('allows origin and referer with trailing slashes', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost/',
				referer: 'http://localhost/'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.status).toBe(200);
		});

		it('blocks protocol mismatch in origin and referer', async () => {
			const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com' });
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://example.com', // http instead of https
				referer: 'https://example.com/'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('blocks referer from different path but same origin', async () => {
			const handle = await importHandleWithEnv({ FRONTEND_ORIGIN: 'https://example.com' });
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'https://example.com',
				referer: 'https://different.com/test'
			};
			const { event, resolve } = makeEvent({ headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('allows POST requests with correct security headers', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost',
				referer: 'http://localhost/'
			};
			const { event, resolve } = makeEvent({ method: 'POST', headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.status).toBe(200);
		});

		it('blocks PUT requests with missing security headers', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin'
				// Missing origin and referer
			};
			const { event, resolve } = makeEvent({ method: 'PUT', headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).not.toHaveBeenCalled();
			expect(res.status).toBe(403);
		});

		it('allows DELETE requests with correct security headers', async () => {
			const handle = await importHandleWithEnv({});
			const headers = {
				'sec-fetch-site': 'same-origin',
				origin: 'http://localhost',
				referer: 'http://localhost/some/page'
			};
			const { event, resolve } = makeEvent({ method: 'DELETE', headers });
			const res = await handle({ event, resolve } as any);
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.status).toBe(200);
		});
	});
});

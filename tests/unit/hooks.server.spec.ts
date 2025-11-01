import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We'll mock env before importing the module
vi.mock('$env/dynamic/private', () => ({ env: {} as Record<string, any> }));

import { env as mockedEnv } from '$env/dynamic/private';
import { handle } from '../../src/hooks.server';

type MakeReqOpts = {
	method?: string;
	path?: string;
	headers?: Record<string, string>;
	origin?: string;
	frontendOrigin?: string | null;
};

const makeEvent = ({
	method = 'GET',
	path = '/api/test',
	headers = {},
	origin,
	frontendOrigin = null
}: MakeReqOpts = {}) => {
	// Update mocked env in-place so imported handle sees changes
	for (const k of Object.keys(mockedEnv)) delete (mockedEnv as any)[k];
	if (frontendOrigin !== null) {
		(mockedEnv as any).FRONTEND_ORIGIN = frontendOrigin ?? '';
	}

	const url = new URL(`http://localhost${path}`);
	const req = new Request(url, { method, headers: { ...headers, ...(origin ? { origin } : {}) } });
	const resolve = vi.fn(async () => new Response('ok', { status: 200 }));
	return { event: { url, request: req } as any, resolve };
};

describe('hooks.server handle', () => {
	beforeEach(() => {
		// Ensure clean env before each
		for (const k of Object.keys(mockedEnv)) delete (mockedEnv as any)[k];
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('allows OPTIONS and HEAD passthrough on /api', async () => {
		for (const method of ['OPTIONS', 'HEAD']) {
			const { event, resolve } = makeEvent({ method });
			const res = await handle({ event, resolve } as any);
			expect(resolve).toHaveBeenCalledOnce();
			expect(res.status).toBe(200);
		}
	});

	it('blocks navigation requests to /api (sec-fetch-dest=document)', async () => {
		const { event, resolve } = makeEvent({ headers: { 'sec-fetch-dest': 'document' } });
		const res = await handle({ event, resolve } as any);
		expect(resolve).not.toHaveBeenCalled();
		expect(res.status).toBe(403);
	});

	it('allows when x-sveltekit-load=1 is set', async () => {
		const { event, resolve } = makeEvent({ headers: { 'x-sveltekit-load': '1' } });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('allows same-origin fetch with correct origin and referer', async () => {
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
		// expected origin overridden to example.com
		const headers = {
			'sec-fetch-site': 'same-origin',
			origin: 'https://example.com',
			referer: 'https://example.com/'
		};
		const { event, resolve } = makeEvent({ headers, frontendOrigin: 'https://example.com' });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});

	it('non-/api paths are not filtered and pass through', async () => {
		const { event, resolve } = makeEvent({ path: '/home' });
		const res = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});
});

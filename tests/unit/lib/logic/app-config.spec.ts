import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock environment
let mockPublicEnv: Record<string, string | undefined>;

vi.mock('$env/dynamic/public', () => ({
	get env() {
		return mockPublicEnv;
	}
}));

describe('app-config.ts', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		mockPublicEnv = {};
	});

	describe('APP_NAME', () => {
		it('returns PUBLIC_APP_NAME from env when set', async () => {
			mockPublicEnv = { PUBLIC_APP_NAME: 'CustomApp' };
			const { APP_NAME } = await import('$lib/logic/app-config');
			expect(APP_NAME).toBe('CustomApp');
		});

		it('returns default "flur34" when env not set', async () => {
			mockPublicEnv = {};
			const { APP_NAME } = await import('$lib/logic/app-config');
			expect(APP_NAME).toBe('flur34');
		});
	});

	describe('SOURCE_CODE_URL', () => {
		it('returns PUBLIC_SOURCE_URL from env when set', async () => {
			mockPublicEnv = { PUBLIC_SOURCE_URL: 'https://github.com/custom/repo' };
			const { SOURCE_CODE_URL } = await import('$lib/logic/app-config');
			expect(SOURCE_CODE_URL).toBe('https://github.com/custom/repo');
		});

		it('returns default URL when env not set', async () => {
			mockPublicEnv = {};
			const { SOURCE_CODE_URL } = await import('$lib/logic/app-config');
			expect(SOURCE_CODE_URL).toBe('https://github.com/flur34/flur34');
		});
	});

	describe('DISCORD_URL', () => {
		it('returns PUBLIC_DISCORD_URL from env when set', async () => {
			mockPublicEnv = { PUBLIC_DISCORD_URL: 'https://discord.gg/custom' };
			const { DISCORD_URL } = await import('$lib/logic/app-config');
			expect(DISCORD_URL).toBe('https://discord.gg/custom');
		});

		it('returns default Discord URL when env not set', async () => {
			mockPublicEnv = {};
			const { DISCORD_URL } = await import('$lib/logic/app-config');
			expect(DISCORD_URL).toBe('https://discord.gg/AxUnC7n9ZP');
		});
	});

	describe('SPONSOR_URL', () => {
		it('returns PUBLIC_SPONSOR_URL from env when set', async () => {
			mockPublicEnv = { PUBLIC_SPONSOR_URL: 'https://patreon.com/custom' };
			const { SPONSOR_URL } = await import('$lib/logic/app-config');
			expect(SPONSOR_URL).toBe('https://patreon.com/custom');
		});

		it('returns default Ko-fi URL when env not set', async () => {
			mockPublicEnv = {};
			const { SPONSOR_URL } = await import('$lib/logic/app-config');
			expect(SPONSOR_URL).toBe('https://ko-fi.com/flurbudurbur');
		});
	});

	describe('getCanonicalUrl', () => {
		const createMockEvent = (origin: string): RequestEvent => {
			return {
				url: new URL(`${origin}/test`),
				request: {} as Request,
				params: {},
				route: { id: null },
				locals: {},
				platform: undefined,
				isDataRequest: false,
				isSubRequest: false,
				cookies: {} as any,
				fetch: global.fetch,
				getClientAddress: () => '',
				setHeaders: () => {},
				tracing: {} as any,
				isRemoteRequest: false
			};
		};

		beforeEach(() => {
			mockPublicEnv = {};
		});

		it('returns KUROSEARCH_CANONICAL_URL when set', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { KUROSEARCH_CANONICAL_URL: 'https://canonical.example.com' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://canonical.example.com');
		});

		it('falls back to FRONTEND_ORIGIN when KUROSEARCH_CANONICAL_URL not set', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { FRONTEND_ORIGIN: 'https://frontend.example.com' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://frontend.example.com');
		});

		it('falls back to event.url.origin when no env vars set', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('https://dynamic.example.com');
			const privateEnv = {};

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://dynamic.example.com');
		});

		it('removes trailing slash from URL', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { KUROSEARCH_CANONICAL_URL: 'https://example.com/' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://example.com');
		});

		it('caches env vars after first call', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv1 = { KUROSEARCH_CANONICAL_URL: 'https://first.example.com' };

			// First call
			const result1 = getCanonicalUrl(event, privateEnv1);
			expect(result1).toBe('https://first.example.com');

			// Second call with different env (should use cached value)
			const privateEnv2 = { KUROSEARCH_CANONICAL_URL: 'https://second.example.com' };
			const result2 = getCanonicalUrl(event, privateEnv2);
			expect(result2).toBe('https://first.example.com'); // Still uses first value
		});

		it('returns default https://flur34.com for invalid URL protocol', async () => {
			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { KUROSEARCH_CANONICAL_URL: 'ftp://invalid.example.com' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://flur34.com');
		});

		it('returns default https://flur34.com for malformed URL', async () => {
			vi.resetModules(); // Reset cache for this test

			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { KUROSEARCH_CANONICAL_URL: 'not-a-url' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://flur34.com');
		});

		it('accepts http protocol in development', async () => {
			vi.resetModules(); // Reset cache for this test

			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			const event = createMockEvent('http://localhost:3000');
			const privateEnv = { KUROSEARCH_CANONICAL_URL: 'http://localhost:5000' };

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('http://localhost:5000');
		});

		it('falls back to hardcoded default when all else fails', async () => {
			vi.resetModules(); // Reset cache for this test

			const { getCanonicalUrl } = await import('$lib/logic/app-config');

			// Create a mock event with empty origin
			const event = {
				url: { origin: '' }
			} as any;
			const privateEnv = {};

			const result = getCanonicalUrl(event, privateEnv);
			expect(result).toBe('https://flur34.com');
		});
	});
});

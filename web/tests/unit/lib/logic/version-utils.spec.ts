import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LATEST_RELEASE_URL, RELEASES_URL } from '$lib/logic/app-config';

// Helper to build a minimal fetch-like response
const resp = (opts: { ok?: boolean; status?: number; statusText?: string; json?: any }) => ({
	ok: opts.ok ?? true,
	status: opts.status ?? 200,
	statusText: opts.statusText ?? 'OK',
	json: async () => opts.json
});

describe('version-utils', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
	});

	describe('LATEST_KUROSEARCH_VERSION', () => {
		it('returns "Unavailable" when latest endpoint returns 404', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ ok: false, status: 404 });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('Unavailable');
		});

		it('returns "Unavailable" on non-ok error (caught)', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL)
						return resp({ ok: false, status: 500, statusText: 'Server Error' });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('Unavailable');
		});

		it('returns raw string version when JSON is a string', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: '1.2.3' });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('1.2.3');
		});

		it('normalizes tag_name with leading v/V', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: 'v2.0.0' } });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('2.0.0');
		});

		it('falls back to name when tag_name missing', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { name: '3.1.4' } });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('3.1.4');
		});

		it('returns "Unavailable" when tag_name is empty string', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: '' } });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('Unavailable');
		});

		it('returns "Unavailable" when neither tag_name nor name are present', async () => {
			const { LATEST_KUROSEARCH_VERSION } = await import('$lib/logic/version-utils');
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: {} });
					return resp({});
				}) as any
			);

			await expect(LATEST_KUROSEARCH_VERSION()).resolves.toBe('Unavailable');
		});
	});

	describe('ISLATESTVERSION', () => {
		it('returns true when latest matches newest release (v prefix normalized)', async () => {
			// Mock both endpoints used inside
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: 'v1.0.0' } });
					if (url === RELEASES_URL) return resp({ json: [{ tag_name: 'v1.0.0' }] });
					return resp({});
				}) as any
			);
			const { ISLATESTVERSION } = await import('$lib/logic/version-utils');
			await expect(ISLATESTVERSION()).resolves.toBe(true);
		});

		it('returns false when latest is "Unavailable"', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL)
						return resp({ ok: false, status: 500, statusText: 'err' });
					if (url === RELEASES_URL) return resp({ json: [{ tag_name: '1.0.0' }] });
					return resp({});
				}) as any
			);
			const { ISLATESTVERSION } = await import('$lib/logic/version-utils');
			await expect(ISLATESTVERSION()).resolves.toBe(false);
		});

		it('returns false when releases endpoint fails', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: '1.0.0' } });
					if (url === RELEASES_URL) return resp({ ok: false, status: 500, statusText: 'err' });
					return resp({});
				}) as any
			);
			const { ISLATESTVERSION } = await import('$lib/logic/version-utils');
			await expect(ISLATESTVERSION()).resolves.toBe(false);
		});

		it('returns false when releases list is empty', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: '1.0.0' } });
					if (url === RELEASES_URL) return resp({ json: [] });
					return resp({});
				}) as any
			);
			const { ISLATESTVERSION } = await import('$lib/logic/version-utils');
			await expect(ISLATESTVERSION()).resolves.toBe(false);
		});

		it('returns false when latest does not match newest release', async () => {
			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url === LATEST_RELEASE_URL) return resp({ json: { tag_name: 'v1.0.0' } });
					if (url === RELEASES_URL) return resp({ json: [{ tag_name: 'v1.0.1' }] });
					return resp({});
				}) as any
			);
			const { ISLATESTVERSION } = await import('$lib/logic/version-utils');
			await expect(ISLATESTVERSION()).resolves.toBe(false);
		});
	});
});

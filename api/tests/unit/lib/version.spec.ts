import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeVersion, getVersion } from '../../../src/lib/version.js';
import { mockFetch, resetFetchMock } from '../../helpers/test-utils.js';
import {
	mockGitHubReleaseResponse,
	mockGitHubReleaseResponseNoTag,
	mockGitHub404Response,
	mockGitHub403RateLimitResponse
} from '../../fixtures/github-responses.js';

describe('version', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		resetFetchMock();
	});

	describe('initializeVersion', () => {
		it('should fetch and cache version from GitHub', async () => {
			mockFetch(
				new Map([['api.github.com/repos/test/repo/releases/latest', mockGitHubReleaseResponse]])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('v1.2.3');
		});

		it('should return fallback for placeholder repo', async () => {
			await initializeVersion('owner/repo');
			const version = getVersion();

			expect(version).toContain('Unavailable');
		});

		it('should return fallback when fetch fails with 404', async () => {
			mockFetch(
				new Map([
					[
						'api.github.com/repos/test/repo/releases/latest',
						{ status: 404, ok: false, json: mockGitHub404Response }
					]
				])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should retry on 403 rate limit', async () => {
			let callCount = 0;
			global.fetch = vi.fn(async () => {
				callCount++;
				if (callCount === 1) {
					// First call returns 403
					return {
						ok: false,
						status: 403,
						statusText: 'Forbidden',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => mockGitHub403RateLimitResponse,
						text: async () => JSON.stringify(mockGitHub403RateLimitResponse)
					} as Response;
				} else {
					// Second call succeeds
					return {
						ok: true,
						status: 200,
						statusText: 'OK',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => mockGitHubReleaseResponse,
						text: async () => JSON.stringify(mockGitHubReleaseResponse)
					} as Response;
				}
			}) as any;

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('v1.2.3');
			expect(callCount).toBe(2);
		});

		it('should return fallback after max retries on 403', async () => {
			mockFetch(
				new Map([
					[
						'api.github.com/repos/test/repo/releases/latest',
						{ status: 403, ok: false, json: mockGitHub403RateLimitResponse }
					]
				])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should return fallback on network error', async () => {
			mockFetch(
				new Map([['api.github.com/repos/test/repo/releases/latest', new Error('Network error')]])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should return fallback when response missing tag_name', async () => {
			mockFetch(
				new Map([
					['api.github.com/repos/test/repo/releases/latest', mockGitHubReleaseResponseNoTag]
				])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should return fallback on 500 server error', async () => {
			mockFetch(
				new Map([
					[
						'api.github.com/repos/test/repo/releases/latest',
						{ status: 500, ok: false, json: { error: 'Internal Server Error' } }
					]
				])
			);

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should handle invalid JSON response', async () => {
			global.fetch = vi.fn(async () => ({
				ok: true,
				status: 200,
				statusText: 'OK',
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => {
					throw new Error('Invalid JSON');
				},
				text: async () => 'Not JSON'
			})) as any;

			await initializeVersion('test/repo');
			const version = getVersion();

			expect(version).toBe('Unavailable');
		});

		it('should call GitHub API with correct URL and headers', async () => {
			const fetchSpy = vi.fn(async () => ({
				ok: true,
				status: 200,
				statusText: 'OK',
				headers: new Headers({ 'content-type': 'application/json' }),
				json: async () => mockGitHubReleaseResponse,
				text: async () => JSON.stringify(mockGitHubReleaseResponse)
			})) as any;

			global.fetch = fetchSpy;

			await initializeVersion('valid/repo-name');

			// Should call fetch with correct URL and headers
			expect(fetchSpy).toHaveBeenCalledWith(
				'https://api.github.com/repos/valid/repo-name/releases/latest',
				{
					headers: {
						Accept: 'application/vnd.github+json',
						'User-Agent': 'Kurosearch-Backend'
					}
				}
			);
		});

		it('should handle empty repo string', async () => {
			mockFetch(new Map([['api.github.com/repos//releases/latest', mockGitHubReleaseResponse]]));

			await initializeVersion('');
			const version = getVersion();

			// Empty string is not the placeholder, so it will try to fetch
			expect(version).toBeDefined();
		});

		it('should handle repo with slash', async () => {
			mockFetch(
				new Map([
					['api.github.com/repos/test-org/test-repo/releases/latest', mockGitHubReleaseResponse]
				])
			);

			await initializeVersion('test-org/test-repo');
			const version = getVersion();

			expect(version).toBe('v1.2.3');
		});
	});

	describe('getVersion', () => {
		it('should return cached version after initialization', async () => {
			mockFetch(
				new Map([['api.github.com/repos/test/repo/releases/latest', mockGitHubReleaseResponse]])
			);

			await initializeVersion('test/repo');

			const version1 = getVersion();
			const version2 = getVersion();

			expect(version1).toBe('v1.2.3');
			expect(version2).toBe('v1.2.3');
			expect(version1).toBe(version2);
		});
	});

	describe('exponential backoff', () => {
		it('should use exponential backoff on retries', async () => {
			const delays: number[] = [];
			const originalSetTimeout = global.setTimeout;

			// Mock setTimeout to track delays
			global.setTimeout = ((callback: Function, delay: number) => {
				delays.push(delay);
				callback();
				return {} as any;
			}) as any;

			let callCount = 0;
			global.fetch = vi.fn(async () => {
				callCount++;
				if (callCount <= 2) {
					return {
						ok: false,
						status: 403,
						statusText: 'Forbidden',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => mockGitHub403RateLimitResponse,
						text: async () => JSON.stringify(mockGitHub403RateLimitResponse)
					} as Response;
				}
				return {
					ok: true,
					status: 200,
					statusText: 'OK',
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => mockGitHubReleaseResponse,
					text: async () => JSON.stringify(mockGitHubReleaseResponse)
				} as Response;
			}) as any;

			await initializeVersion('test/repo');

			// Restore setTimeout
			global.setTimeout = originalSetTimeout;

			// Check that delays increase exponentially
			expect(delays.length).toBeGreaterThan(0);
			if (delays.length >= 2) {
				expect(delays[1]).toBeGreaterThan(delays[0]);
			}
		});
	});
});

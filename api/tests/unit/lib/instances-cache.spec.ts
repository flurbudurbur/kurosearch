import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	initializeInstances,
	getInstances,
	refreshInstances,
	isInstancesCacheConfigured,
	getCacheStats,
	_resetCache
} from '../../../src/lib/instances-cache.js';
import { mockFetch, resetFetchMock } from '../../helpers/test-utils.js';
import {
	mockInstancesResponse,
	mockInstancesResponseEmpty,
	mockInstancesResponseInvalid
} from '../../fixtures/instances-responses.js';

describe('instances-cache', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		_resetCache(); // Reset cache state between tests
	});

	afterEach(() => {
		resetFetchMock();
		_resetCache(); // Clean up after tests
	});

	describe('initializeInstances', () => {
		it('should fetch and cache instances from URL', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).not.toBeNull();
			expect(instances?.version).toBe('1.0.0');
			expect(instances?.instances).toHaveLength(2);
			expect(instances?.instances[0].name).toBe('kurosearch');
			expect(instances?.instances[0].details.version).toBe('1.2.0');
		});

		it('should return null when URL is empty', async () => {
			await initializeInstances('', 300000);
			const instances = getInstances();

			expect(instances).toBeNull();
		});

		it('should return null when fetch fails with 404', async () => {
			mockFetch(
				new Map([
					[
						'raw.githubusercontent.com/test/repo/main/instances.json',
						{ status: 404, ok: false, json: { error: 'Not Found' } }
					]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).toBeNull();
		});

		it('should retry on 403 rate limit', async () => {
			let callCount = 0;
			global.fetch = vi.fn(async () => {
				callCount++;
				if (callCount === 1) {
					return {
						ok: false,
						status: 403,
						statusText: 'Forbidden',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({ message: 'API rate limit exceeded' }),
						text: async () => JSON.stringify({ message: 'API rate limit exceeded' })
					} as Response;
				} else {
					return {
						ok: true,
						status: 200,
						statusText: 'OK',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => mockInstancesResponse,
						text: async () => JSON.stringify(mockInstancesResponse)
					} as Response;
				}
			}) as any;

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).not.toBeNull();
			expect(instances?.instances).toHaveLength(2);
			expect(callCount).toBe(2);
		});

		it('should return null after max retries on 403', async () => {
			mockFetch(
				new Map([
					[
						'raw.githubusercontent.com/test/repo/main/instances.json',
						{ status: 403, ok: false, json: { message: 'API rate limit exceeded' } }
					]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).toBeNull();
		});

		it('should return null on network error', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', new Error('Network error')]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).toBeNull();
		});

		it('should return null when response is missing instances array', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponseInvalid]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).toBeNull();
		});

		it('should handle empty instances array', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponseEmpty]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).not.toBeNull();
			expect(instances?.instances).toHaveLength(0);
		});

		it('should provide default values for missing instance fields', async () => {
			const partialResponse = {
				version: '1.0.0',
				instances: [
					{
						name: 'test-instance'
						// Missing other fields
					}
				]
			};

			mockFetch(
				new Map([['raw.githubusercontent.com/test/repo/main/instances.json', partialResponse]])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);
			const instances = getInstances();

			expect(instances).not.toBeNull();
			expect(instances?.instances[0]).toEqual({
				name: 'test-instance',
				url: '',
				country: '',
				description: '',
				source_url: '',
				status: 0,
				details: {
					version: 'N/A',
					last_check: 0,
					uptime: 0
				}
			});
		});
	});

	describe('getInstances', () => {
		it('should return cached instances after initialization', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);

			const instances1 = getInstances();
			const instances2 = getInstances();

			expect(instances1).toEqual(instances2);
			expect(instances1?.instances).toHaveLength(2);
		});
	});

	describe('isInstancesCacheConfigured', () => {
		it('should return true when URL is configured', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);

			expect(isInstancesCacheConfigured()).toBe(true);
		});

		it('should return false when URL is empty', async () => {
			await initializeInstances('', 300000);

			expect(isInstancesCacheConfigured()).toBe(false);
		});
	});

	describe('getCacheStats', () => {
		it('should return stats for configured cache', async () => {
			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);

			const stats = getCacheStats();

			expect(stats.configured).toBe(true);
			expect(stats.hasData).toBe(true);
			expect(stats.fetchedAt).toBeGreaterThan(0);
			expect(stats.expiresAt).toBeGreaterThan(stats.fetchedAt!);
			expect(stats.isStale).toBe(false);
		});

		it('should return stats for unconfigured cache', async () => {
			await initializeInstances('', 300000);

			const stats = getCacheStats();

			expect(stats.configured).toBe(false);
			expect(stats.hasData).toBe(false);
			expect(stats.fetchedAt).toBeNull();
			expect(stats.expiresAt).toBeNull();
		});
	});

	describe('refreshInstances', () => {
		it('should refresh cached data', async () => {
			let callCount = 0;
			global.fetch = vi.fn(async () => {
				callCount++;
				const response =
					callCount === 1
						? mockInstancesResponse
						: {
								version: '2.0.0',
								instances: [{ name: 'updated-instance', url: 'https://updated.example.com' }]
							};

				return {
					ok: true,
					status: 200,
					statusText: 'OK',
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => response,
					text: async () => JSON.stringify(response)
				} as Response;
			}) as any;

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);

			const instancesBefore = getInstances();
			expect(instancesBefore?.version).toBe('1.0.0');

			await refreshInstances();

			const instancesAfter = getInstances();
			expect(instancesAfter?.version).toBe('2.0.0');
			expect(instancesAfter?.instances[0].name).toBe('updated-instance');
		});
	});

	describe('TTL expiration', () => {
		it('should mark cache as stale after TTL expires', async () => {
			const originalDateNow = Date.now;
			let currentTime = 1000000;

			Date.now = vi.fn(() => currentTime);

			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				1000 // 1 second TTL
			);

			let stats = getCacheStats();
			expect(stats.isStale).toBe(false);

			// Advance time past TTL
			currentTime += 2000;

			stats = getCacheStats();
			expect(stats.isStale).toBe(true);

			// Restore Date.now
			Date.now = originalDateNow;
		});

		it('should still return cached data when stale', async () => {
			const originalDateNow = Date.now;
			let currentTime = 1000000;

			Date.now = vi.fn(() => currentTime);

			mockFetch(
				new Map([
					['raw.githubusercontent.com/test/repo/main/instances.json', mockInstancesResponse]
				])
			);

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				1000 // 1 second TTL
			);

			// Advance time past TTL
			currentTime += 2000;

			// Should still return cached data (stale-while-revalidate)
			const instances = getInstances();
			expect(instances).not.toBeNull();
			expect(instances?.instances).toHaveLength(2);

			// Restore Date.now
			Date.now = originalDateNow;
		});
	});

	describe('exponential backoff', () => {
		it('should use exponential backoff on retries', async () => {
			const delays: number[] = [];
			const originalSetTimeout = global.setTimeout;

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
						status: 500,
						statusText: 'Internal Server Error',
						headers: new Headers({ 'content-type': 'application/json' }),
						json: async () => ({ error: 'Internal Server Error' }),
						text: async () => JSON.stringify({ error: 'Internal Server Error' })
					} as Response;
				}
				return {
					ok: true,
					status: 200,
					statusText: 'OK',
					headers: new Headers({ 'content-type': 'application/json' }),
					json: async () => mockInstancesResponse,
					text: async () => JSON.stringify(mockInstancesResponse)
				} as Response;
			}) as any;

			await initializeInstances(
				'https://raw.githubusercontent.com/test/repo/main/instances.json',
				300000
			);

			global.setTimeout = originalSetTimeout;

			expect(delays.length).toBeGreaterThan(0);
			if (delays.length >= 2) {
				expect(delays[1]).toBeGreaterThan(delays[0]);
			}
		});
	});
});

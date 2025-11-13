import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';
import { VersionService } from '$lib/server/version';
import type { VersionServiceDeps } from '$lib/server/version';

describe('version.ts', () => {
	let mockFetchLatestVersion: ReturnType<typeof vi.fn>;
	let mockReadFile: ReturnType<typeof vi.fn>;
	let mockEnv: Record<string, string | undefined>;
	let mockLogger: VersionServiceDeps['logger'];
	let mockCwd: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset mocks to default implementations
		mockEnv = {};
		mockFetchLatestVersion = vi.fn(async () => 'Unavailable');
		mockReadFile = vi.fn(async () => {
			throw new Error('File not found');
		});
		mockLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		} as any;
		mockCwd = vi.fn(() => '/test');
	});

	it('getLatestVersion returns cached latest version', async () => {
		mockFetchLatestVersion = vi.fn(async () => 'v1.2.3');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const version = service.getLatestVersion();
		expect(version).toBe('v1.2.3');
		expect(mockFetchLatestVersion).toHaveBeenCalledOnce();
	});

	it('getLatestVersion returns "Unavailable" on fetch failure', async () => {
		mockFetchLatestVersion = vi.fn(async () => {
			throw new Error('Fetch failed');
		});

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const version = service.getLatestVersion();
		expect(version).toBe('Unavailable');
		expect(mockLogger.warn).toHaveBeenCalled();
	});

	it('getGithubSha returns value from file', async () => {
		mockReadFile = vi.fn(async () => 'abc123def456  \n');
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const sha = service.getGithubSha();
		expect(sha).toBe('abc123def456');
		expect(mockReadFile).toHaveBeenCalledWith(join('/test', '.github_sha'), 'utf-8');
	});

	it('getGithubSha falls back to env var when file not found', async () => {
		mockEnv = { GITHUB_SHA: 'env-sha-value' };
		mockReadFile = vi.fn(async () => {
			throw new Error('File not found');
		});
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const sha = service.getGithubSha();
		expect(sha).toBe('env-sha-value');
	});

	it('getGithubSha returns undefined when neither file nor env available', async () => {
		mockEnv = {};
		mockReadFile = vi.fn(async () => {
			throw new Error('File not found');
		});
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const sha = service.getGithubSha();
		expect(sha).toBeUndefined();
	});

	it('getContainerVersion returns value from env', async () => {
		mockEnv = { CONTAINER_VERSION: '2.5.1' };
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const version = service.getContainerVersion();
		expect(version).toBe('2.5.1');
	});

	it('getContainerVersion returns "Unavailable" when env not set', async () => {
		mockEnv = {};
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		const version = service.getContainerVersion();
		expect(version).toBe('Unavailable');
	});

	it('all getters return cached values after initialization', async () => {
		mockEnv = {
			CONTAINER_VERSION: '3.0.0',
			GITHUB_SHA: 'xyz789'
		};
		mockReadFile = vi.fn(async () => 'file-sha');
		mockFetchLatestVersion = vi.fn(async () => 'v5.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		await service.initialize();

		// Call multiple times - should return same cached values
		expect(service.getLatestVersion()).toBe('v5.0.0');
		expect(service.getLatestVersion()).toBe('v5.0.0');

		// File SHA should take precedence over env var
		expect(service.getGithubSha()).toBe('file-sha');
		expect(service.getGithubSha()).toBe('file-sha');

		expect(service.getContainerVersion()).toBe('3.0.0');
		expect(service.getContainerVersion()).toBe('3.0.0');

		// Verify initialization only happened once
		expect(mockFetchLatestVersion).toHaveBeenCalledOnce();
		expect(mockReadFile).toHaveBeenCalledOnce();
	});

	it('initialize can be called multiple times safely', async () => {
		mockFetchLatestVersion = vi.fn(async () => 'v1.0.0');

		const service = new VersionService({
			fetchLatestVersion: mockFetchLatestVersion,
			readFile: mockReadFile,
			env: mockEnv,
			logger: mockLogger,
			cwd: mockCwd
		});

		// Call initialize multiple times
		await Promise.all([service.initialize(), service.initialize(), service.initialize()]);

		// Should only fetch once
		expect(mockFetchLatestVersion).toHaveBeenCalledOnce();
		expect(service.getLatestVersion()).toBe('v1.0.0');
	});
});

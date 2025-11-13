import { LATEST_KUROSEARCH_VERSION } from '$lib/logic/version-utils';
import { logger } from './logger';
import { env } from '$env/dynamic/private';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Dependencies for VersionService to enable testing
 */
export interface VersionServiceDeps {
	fetchLatestVersion: () => Promise<string>;
	readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
	env: Record<string, string | undefined>;
	logger: typeof logger;
	cwd: () => string;
}

/**
 * Service class for managing version information.
 * Uses dependency injection for testability.
 */
export class VersionService {
	private cachedLatestVersion = 'checking...';
	private cachedGithubSha: string | undefined = undefined;
	private cachedContainerVersion = 'Unavailable';
	private initialized = false;
	private initPromise: Promise<void> | null = null;

	constructor(private deps: VersionServiceDeps) {}

	/**
	 * Initialize version cache asynchronously.
	 * Safe to call multiple times - subsequent calls wait for first init to complete.
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = this._doInitialize();
		await this.initPromise;
		this.initialized = true;
		return;
	}

	private async _doInitialize(): Promise<void> {
		// Fetch the latest version
		try {
			this.cachedLatestVersion = await this.deps.fetchLatestVersion();
			this.deps.logger.info(
				{ version: this.cachedLatestVersion },
				'Latest Kurosearch version fetched'
			);
		} catch (error) {
			this.cachedLatestVersion = 'Unavailable';
			this.deps.logger.warn({ error }, 'Failed to fetch latest Kurosearch version');
		}

		// Load GitHub SHA
		try {
			const shaPath = join(this.deps.cwd(), '.github_sha');
			const sha = await this.deps.readFile(shaPath, 'utf-8');
			this.cachedGithubSha = sha.trim();
			this.deps.logger.info({ sha: this.cachedGithubSha }, 'GitHub SHA loaded from file');
		} catch {
			// Fallback to env var for local development
			this.cachedGithubSha = this.deps.env.GITHUB_SHA;
			if (this.cachedGithubSha) {
				this.deps.logger.info('GitHub SHA loaded from environment variable');
			} else {
				this.deps.logger.info('GitHub SHA not available');
			}
		}

		// Load container version
		this.cachedContainerVersion = this.deps.env.CONTAINER_VERSION ?? 'Unavailable';
		this.deps.logger.info({ version: this.cachedContainerVersion }, 'Container version loaded');
	}

	/**
	 * Get the latest Kurosearch version (cached from initialization)
	 */
	getLatestVersion(): string {
		return this.cachedLatestVersion;
	}

	/**
	 * Get the GitHub SHA (cached from initialization)
	 */
	getGithubSha(): string | undefined {
		return this.cachedGithubSha;
	}

	/**
	 * Get the container version (cached from initialization)
	 */
	getContainerVersion(): string {
		return this.cachedContainerVersion;
	}
}

// Create default instance with production dependencies
const defaultService = new VersionService({
	fetchLatestVersion: LATEST_KUROSEARCH_VERSION,
	readFile,
	env,
	logger,
	cwd: () => process.cwd()
});

// Initialize on module load
defaultService.initialize();

/**
 * Get the latest Kurosearch version (cached from server startup)
 * @deprecated Use defaultService.getLatestVersion() for testing
 */
export function getLatestVersion(): string {
	return defaultService.getLatestVersion();
}

/**
 * Get the GitHub SHA (cached from server startup)
 * @deprecated Use defaultService.getGithubSha() for testing
 */
export function getGithubSha(): string | undefined {
	return defaultService.getGithubSha();
}

/**
 * Get the container version (cached from server startup)
 * @deprecated Use defaultService.getContainerVersion() for testing
 */
export function getContainerVersion(): string {
	return defaultService.getContainerVersion();
}

// Export default service for testing
export { defaultService };

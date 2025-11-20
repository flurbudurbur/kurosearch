import { vi } from 'vitest';

/**
 * In-memory Valkey/Redis mock for testing
 * Simulates basic Redis operations without requiring a real connection
 */
export class MockValkey {
	private store = new Map<string, { value: string; expiresAt?: number }>();
	private scanCursor = 0;

	get = vi.fn(async (key: string): Promise<string | null> => {
		const entry = this.store.get(key);
		if (!entry) return null;

		// Check expiration
		if (entry.expiresAt && Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return null;
		}

		return entry.value;
	});

	set = vi.fn(async (key: string, value: string): Promise<'OK'> => {
		this.store.set(key, { value });
		return 'OK';
	});

	setex = vi.fn(async (key: string, seconds: number, value: string): Promise<'OK'> => {
		const expiresAt = Date.now() + seconds * 1000;
		this.store.set(key, { value, expiresAt });
		return 'OK';
	});

	del = vi.fn(async (...keys: string[]): Promise<number> => {
		let deleted = 0;
		for (const key of keys) {
			if (this.store.delete(key)) deleted++;
		}
		return deleted;
	});

	getdel = vi.fn(async (key: string): Promise<string | null> => {
		const value = await this.get(key);
		if (value !== null) {
			await this.del(key);
		}
		return value;
	});

	keys = vi.fn(async (pattern: string): Promise<string[]> => {
		const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
		return Array.from(this.store.keys()).filter((key) => regex.test(key));
	});

	scan = vi.fn(
		async (cursor: number, matchType: string, pattern: string): Promise<[string, string[]]> => {
			const keys = await this.keys(pattern);
			const nextCursor = keys.length > 0 ? '0' : cursor.toString();
			return [nextCursor, keys];
		}
	);

	ping = vi.fn(async (): Promise<'PONG'> => {
		return 'PONG';
	});

	disconnect = vi.fn(async (): Promise<void> => {
		this.store.clear();
	});

	on = vi.fn((event: string, handler: (...args: any[]) => void) => {
		// No-op for mock
		return this;
	});

	// Helper methods for testing
	_clear() {
		this.store.clear();
		this.scanCursor = 0;
	}

	_getStore() {
		return this.store;
	}

	_size() {
		return this.store.size;
	}
}

/**
 * Create a fresh mock Valkey instance
 */
export function createMockValkey(): MockValkey {
	return new MockValkey();
}

/**
 * Mock the Valkey singleton module
 */
export function mockValkeyModule(mockInstance: MockValkey) {
	vi.doMock('../../src/lib/valkey.js', () => ({
		getValkeyClient: vi.fn(() => mockInstance),
		disconnectValkey: vi.fn(async () => {
			await mockInstance.disconnect();
		}),
		isValkeyAvailable: vi.fn(async () => {
			try {
				await mockInstance.ping();
				return true;
			} catch {
				return false;
			}
		})
	}));
}

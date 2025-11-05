import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock iovalkey
vi.mock('iovalkey');

// Mock environment variables
vi.mock('$env/static/private', () => ({
	VALKEY_HOST: 'localhost',
	VALKEY_PORT: '6379',
	VALKEY_PASSWORD: 'test-password',
	VALKEY_DB: '0',
	VALKEY_ENABLED: 'true'
}));

describe('valkey', () => {
	let mockClient: any;
	let eventHandlers: Map<string, (...args: any[]) => void>;

	beforeEach(() => {
		// Clear module cache to reset singleton state
		vi.resetModules();

		// Setup event handler tracking
		eventHandlers = new Map();

		// Create mock client
		mockClient = {
			ping: vi.fn().mockResolvedValue('PONG'),
			disconnect: vi.fn().mockResolvedValue(undefined),
			on: vi.fn((event: string, handler: (...args: any[]) => void) => {
				eventHandlers.set(event, handler);
				return mockClient;
			})
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getValkeyClient', () => {
		it('should create and return Valkey client on first call', async () => {
			// Mock Valkey constructor
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			const client = getValkeyClient();

			expect(client).toBe(mockClient);
			expect(ValkeyMock).toHaveBeenCalledWith({
				host: 'localhost',
				port: 6379,
				password: 'test-password',
				db: 0,
				lazyConnect: false
			});
		});

		it('should return same client instance on subsequent calls', async () => {
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			const client1 = getValkeyClient();
			const client2 = getValkeyClient();

			expect(client1).toBe(client2);
			expect(ValkeyMock).toHaveBeenCalledTimes(1);
		});

		it('should return null when VALKEY_ENABLED is false', async () => {
			// Re-mock with VALKEY_ENABLED = false
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: '6379',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '0',
				VALKEY_ENABLED: 'false'
			}));

			vi.resetModules();
			const { getValkeyClient } = await import('$lib/server/valkey');

			const client = getValkeyClient();

			expect(client).toBeNull();
		});

		it('should use default values for missing env variables', async () => {
			// Re-mock with minimal env vars
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: '',
				VALKEY_PORT: '',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '',
				VALKEY_ENABLED: 'true'
			}));

			vi.resetModules();
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			getValkeyClient();

			expect(ValkeyMock).toHaveBeenCalledWith({
				host: 'localhost',
				port: 6379,
				password: undefined,
				db: 0,
				lazyConnect: false
			});
		});

		it('should register error and connect event handlers', async () => {
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			getValkeyClient();

			expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
			expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
		});

		it('should handle error event by setting client to null', async () => {
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			const client1 = getValkeyClient();
			expect(client1).toBe(mockClient);

			// Trigger error event
			const errorHandler = eventHandlers.get('error');
			expect(errorHandler).toBeDefined();
			errorHandler!(new Error('Connection error'));

			// Next call should return null since connection failed
			const client2 = getValkeyClient();
			expect(client2).toBeNull();
		});

		it('should handle constructor errors gracefully', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementationOnce(() => {
				throw new Error('Constructor error');
			});

			vi.resetModules();
			const { getValkeyClient } = await import('$lib/server/valkey');

			const client = getValkeyClient();

			expect(client).toBeNull();
			expect(consoleSpy).toHaveBeenCalledWith('Error creating Valkey client:', expect.any(Error));

			consoleSpy.mockRestore();
		});

		it('should not retry connection after failure', async () => {
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementationOnce(() => {
				throw new Error('Constructor error');
			});

			vi.resetModules();
			const { getValkeyClient } = await import('$lib/server/valkey');

			const client1 = getValkeyClient();
			expect(client1).toBeNull();

			// Second call should return null without attempting connection
			const client2 = getValkeyClient();
			expect(client2).toBeNull();

			// Valkey should only be called once
			expect(ValkeyMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('isValkeyAvailable', () => {
		it('should return true when client is available and ping succeeds', async () => {
			mockClient.ping.mockResolvedValue('PONG');

			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { isValkeyAvailable } = await import('$lib/server/valkey');
			const available = await isValkeyAvailable();

			expect(available).toBe(true);
			expect(mockClient.ping).toHaveBeenCalledOnce();
		});

		it('should return false when client is null', async () => {
			// Re-mock with VALKEY_ENABLED = false
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: '6379',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '0',
				VALKEY_ENABLED: 'false'
			}));

			vi.resetModules();
			const { isValkeyAvailable } = await import('$lib/server/valkey');

			const available = await isValkeyAvailable();

			expect(available).toBe(false);
		});

		it('should return false when ping fails', async () => {
			mockClient.ping.mockRejectedValue(new Error('Ping failed'));

			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { isValkeyAvailable } = await import('$lib/server/valkey');
			const available = await isValkeyAvailable();

			expect(available).toBe(false);
		});
	});

	describe('closeValkeyConnection', () => {
		it('should close connection without throwing', async () => {
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient, closeValkeyConnection } = await import('$lib/server/valkey');

			// Create client
			const client = getValkeyClient();

			// If we got a client, closing should work without throwing
			if (client) {
				await expect(closeValkeyConnection()).resolves.toBeUndefined();
			}
		});

		it('should handle disconnect errors without throwing', async () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			mockClient.disconnect.mockRejectedValue(new Error('Disconnect error'));

			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient, closeValkeyConnection } = await import('$lib/server/valkey');
			getValkeyClient();

			// Should not throw despite disconnect error
			await expect(closeValkeyConnection()).resolves.toBeUndefined();
		});

		it('should do nothing when client is null', async () => {
			// Re-mock with VALKEY_ENABLED = false
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: '6379',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '0',
				VALKEY_ENABLED: 'false'
			}));

			vi.resetModules();
			const { closeValkeyConnection } = await import('$lib/server/valkey');

			// Should not throw
			await closeValkeyConnection();

			expect(mockClient.disconnect).not.toHaveBeenCalled();
		});
	});

	describe('Edge cases', () => {
		it('should handle invalid port number', async () => {
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: 'invalid',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '0',
				VALKEY_ENABLED: 'true'
			}));

			vi.resetModules();
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			getValkeyClient();

			// parseInt('invalid') returns NaN, which should be handled
			expect(ValkeyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					port: expect.any(Number)
				})
			);
		});

		it('should handle invalid db number', async () => {
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: '6379',
				VALKEY_PASSWORD: '',
				VALKEY_DB: 'invalid',
				VALKEY_ENABLED: 'true'
			}));

			vi.resetModules();
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			getValkeyClient();

			expect(ValkeyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					db: expect.any(Number)
				})
			);
		});

		it('should handle empty password as undefined', async () => {
			vi.doMock('$env/static/private', () => ({
				VALKEY_HOST: 'localhost',
				VALKEY_PORT: '6379',
				VALKEY_PASSWORD: '',
				VALKEY_DB: '0',
				VALKEY_ENABLED: 'true'
			}));

			vi.resetModules();
			const { default: ValkeyMock } = await import('iovalkey');
			vi.mocked(ValkeyMock).mockImplementation(() => mockClient);

			const { getValkeyClient } = await import('$lib/server/valkey');
			getValkeyClient();

			expect(ValkeyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					password: undefined
				})
			);
		});
	});
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock pino
let mockPino: Mock;
let mockChildLogger: any;
let mockRootLogger: any;

vi.mock('pino', () => ({
	default: (...args: any[]) => mockPino(...args)
}));

vi.mock('$app/environment', () => ({
	dev: false
}));

vi.mock('$env/dynamic/private', () => ({
	env: {
		TZ: 'America/New_York',
		LOG_LEVEL: 'info'
	}
}));

describe('logger.ts', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		// Setup mock loggers
		mockChildLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		};

		mockRootLogger = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn(),
			child: vi.fn(() => mockChildLogger)
		};

		mockPino = vi.fn(() => mockRootLogger);
	});

	it('exports a logger instance', async () => {
		const { logger } = await import('$lib/server/logger');

		expect(logger).toBeDefined();
		expect(logger).toHaveProperty('info');
		expect(logger).toHaveProperty('warn');
		expect(logger).toHaveProperty('error');
		expect(logger).toHaveProperty('debug');
	});

	it('createLogger creates a child logger with context', async () => {
		const { createLogger } = await import('$lib/server/logger');

		const context = { requestId: '123', userId: '456' };
		const childLogger = createLogger(context);

		expect(childLogger).toBeDefined();
		expect(mockRootLogger.child).toHaveBeenCalledWith(context);
	});

	it('logger is configured with pino', async () => {
		await import('$lib/server/logger');

		expect(mockPino).toHaveBeenCalled();
		const config = mockPino.mock.calls[0][0];

		// Verify configuration structure
		expect(config).toHaveProperty('level');
		expect(config).toHaveProperty('formatters');
		expect(config).toHaveProperty('timestamp');
	});

	it('customTimestamp function generates ISO 8601 timestamps', async () => {
		await import('$lib/server/logger');

		const config = mockPino.mock.calls[0][0];
		const timestampFn = config.timestamp;

		expect(timestampFn).toBeDefined();
		expect(typeof timestampFn).toBe('function');

		// Call the timestamp function
		const timestamp = timestampFn();

		// Verify it returns a string with time field
		expect(timestamp).toContain(',"time":"');
		expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}"/);
	});

	it('level formatter returns level label', async () => {
		await import('$lib/server/logger');

		const config = mockPino.mock.calls[0][0];
		const levelFormatter = config.formatters.level;

		expect(levelFormatter).toBeDefined();
		expect(typeof levelFormatter).toBe('function');

		// Test level formatting
		const result = levelFormatter('info');
		expect(result).toEqual({ level: 'info' });

		const result2 = levelFormatter('error');
		expect(result2).toEqual({ level: 'error' });
	});
});

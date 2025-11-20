import { beforeAll, vi } from 'vitest';

// Set up environment variables for all tests
beforeAll(() => {
	process.env.RULE34_API_KEY = 'test-api-key';
	process.env.RULE34_API_USER = 'test-user';
	process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
	process.env.SYNC_ENCRYPTION_SECRET = 'test-secret-must-be-at-least-32-characters-long';
	process.env.VALKEY_ENABLED = 'false'; // Mock Valkey by default
	process.env.NODE_ENV = 'test';
	process.env.BACKEND_HOST = '0.0.0.0';
	process.env.BACKEND_PORT = '3001';
});

// Mock console methods to reduce noise in test output
global.console = {
	...console,
	log: vi.fn(),
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	// Keep error for debugging
	error: console.error
};

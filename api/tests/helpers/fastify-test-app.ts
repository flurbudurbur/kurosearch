import Fastify, { FastifyInstance } from 'fastify';
import { vi } from 'vitest';

/**
 * Create a Fastify test app with minimal configuration
 */
export async function createTestApp(options?: {
	withValkey?: boolean;
	withWebSocket?: boolean;
}): Promise<FastifyInstance> {
	const app = Fastify({
		logger: false, // Disable logging in tests
		disableRequestLogging: true
	});

	// Register plugins based on options
	if (options?.withValkey) {
		// Mock Valkey plugin
		await app.register(async (fastify) => {
			fastify.decorate('valkey', null);
		});
	}

	if (options?.withWebSocket) {
		// Mock WebSocket plugin
		const fastifyWebsocket = await import('@fastify/websocket');
		await app.register(fastifyWebsocket.default);
	}

	return app;
}

/**
 * Close the test app and clean up
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
	try {
		await app.close();
	} catch (error) {
		// Ignore errors during cleanup
	}
}

/**
 * Create a mock Fastify request object
 */
export function createMockRequest(overrides?: Partial<any>) {
	return {
		headers: {},
		query: {},
		params: {},
		body: {},
		log: {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			debug: vi.fn()
		},
		...overrides
	};
}

/**
 * Create a mock Fastify reply object
 */
export function createMockReply() {
	const reply = {
		code: vi.fn().mockReturnThis(),
		status: vi.fn().mockReturnThis(),
		header: vi.fn().mockReturnThis(),
		headers: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		type: vi.fn().mockReturnThis(),
		sent: false
	};

	return reply;
}

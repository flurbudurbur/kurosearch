import { vi } from 'vitest';

/**
 * Mock fetch globally for tests
 */
export function mockFetch(responses: Map<string, any>) {
	global.fetch = vi.fn(async (url: string | URL, options?: RequestInit) => {
		const urlStr = url.toString();

		// Find matching response
		for (const [pattern, response] of responses.entries()) {
			if (urlStr.includes(pattern)) {
				if (response instanceof Error) {
					throw response;
				}

				return {
					ok: response.ok ?? true,
					status: response.status ?? 200,
					statusText: response.statusText ?? 'OK',
					headers: new Headers(response.headers ?? { 'content-type': 'application/json' }),
					json: async () => response.json ?? response,
					text: async () => response.text ?? JSON.stringify(response.json ?? response)
				} as Response;
			}
		}

		// Default 404 response
		return {
			ok: false,
			status: 404,
			statusText: 'Not Found',
			headers: new Headers({ 'content-type': 'application/json' }),
			json: async () => ({ error: 'Not Found' }),
			text: async () => JSON.stringify({ error: 'Not Found' })
		} as Response;
	}) as any;
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
	vi.restoreAllMocks();
}

/**
 * Create a mock WebSocket for testing
 */
export function createMockWebSocket() {
	const listeners = new Map<string, Set<Function>>();

	return {
		send: vi.fn(),
		close: vi.fn(),
		on: vi.fn((event: string, handler: Function) => {
			if (!listeners.has(event)) {
				listeners.set(event, new Set());
			}
			listeners.get(event)!.add(handler);
		}),
		addEventListener: vi.fn((event: string, handler: Function) => {
			if (!listeners.has(event)) {
				listeners.set(event, new Set());
			}
			listeners.get(event)!.add(handler);
		}),
		removeEventListener: vi.fn((event: string, handler: Function) => {
			listeners.get(event)?.delete(handler);
		}),
		_trigger: (event: string, data?: any) => {
			const handlers = listeners.get(event);
			if (handlers) {
				handlers.forEach((handler) => handler(data));
			}
		},
		_getListeners: () => listeners,
		readyState: 1, // OPEN
		CONNECTING: 0,
		OPEN: 1,
		CLOSING: 2,
		CLOSED: 3
	};
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
	condition: () => boolean | Promise<boolean>,
	timeout = 5000,
	interval = 50
): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		if (await condition()) {
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a deferred promise for manual resolution
 */
export function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: any) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

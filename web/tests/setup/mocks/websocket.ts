import { vi } from 'vitest';

export type MockWebSocketResponse = {
	success?: boolean;
	data?: any;
	error?: string;
	text?: string;
};

// Type that matches the WebSocket client interface
type MockWebSocketClient = {
	request: (endpoint: string, params: Record<string, string>) => Promise<any>;
	connect: () => void;
	disconnect: () => void;
	subscribe: (channels: string[]) => () => void;
	onStateChange: (listener: (state: string) => void) => () => void;
};

/**
 * Creates a mock WebSocket client that can be used in tests
 */
export const createMockWebSocketClient = (
	requestHandler?: (endpoint: string, _params: Record<string, string>) => Promise<any>
): Partial<MockWebSocketClient> => {
	const defaultHandler = async (endpoint: string, _params: Record<string, string>) => {
		throw new Error(`No mock handler provided for ${endpoint}`);
	};

	const handler = requestHandler || defaultHandler;

	return {
		request: vi.fn(async (endpoint: string, params: Record<string, string>) => {
			return handler(endpoint, params);
		}) as any,
		connect: vi.fn(),
		disconnect: vi.fn(),
		subscribe: vi.fn(() => vi.fn()),
		onStateChange: vi.fn(() => vi.fn())
	};
};

/**
 * Creates a response that simulates successful WebSocket API response
 */
export const makeWebSocketResponse = (data: any): string => {
	if (typeof data === 'string') {
		return data;
	}
	return JSON.stringify(data);
};

/**
 * Creates an error response for WebSocket
 */
export const makeWebSocketError = (message: string): Error => {
	return new Error(message);
};

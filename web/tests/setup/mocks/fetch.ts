import { vi } from 'vitest';

export type MockResponseInit = {
	ok?: boolean;
	status?: number;
	statusText?: string;
	headers?: Record<string, string>;
	json?: any;
	text?: string;
	body?: string;
};

export const makeResponse = (init: MockResponseInit = {}) => {
	const { status = 200, statusText = 'OK', headers = {}, json, text, body } = init;

	const h = new Headers(headers as any);

	return new Response(body ?? (json != null ? JSON.stringify(json) : (text ?? '')), {
		status,
		statusText,
		headers: h
	});
};

export const mockFetch = (
	factory: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
) => {
	const spy = vi.fn(factory);
	// @ts-ignore
	global.fetch = spy as any;
	return spy;
};

import { describe, expect, it, vi, beforeEach } from 'vitest';

// We will mock $env/dynamic/private before importing the module to control env values

const importWithEnv = async (envValues: Record<string, string | undefined>) => {
	vi.resetModules();
	vi.doMock('$env/dynamic/private', () => ({ env: envValues }));
	return await import('$lib/logic/api-client/param-utils');
};

describe('param-utils', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('appendAuthParams prefers values from URL over env', async () => {
		const { appendAuthParams } = await importWithEnv({
			RULE34_API_KEY: 'env-key',
			RULE34_API_USER: 'env-user'
		});

		const url = new URL('https://x.test/?api_key=url-key&user_id=url-user');
		const params = new URLSearchParams();

		appendAuthParams(url, params);

		expect(params.get('api_key')).toBe('url-key');
		expect(params.get('user_id')).toBe('url-user');
	});

	it('appendAuthParams uses env values when URL does not contain them', async () => {
		const { appendAuthParams } = await importWithEnv({
			RULE34_API_KEY: 'env-key',
			RULE34_API_USER: 'env-user'
		});

		const url = new URL('https://x.test/');
		const params = new URLSearchParams();

		appendAuthParams(url, params);

		expect(params.get('api_key')).toBe('env-key');
		expect(params.get('user_id')).toBe('env-user');
	});

	it('appendAuthParams appends nothing when neither URL nor env provide values', async () => {
		const { appendAuthParams } = await importWithEnv({});

		const url = new URL('https://x.test/');
		const params = new URLSearchParams();

		appendAuthParams(url, params);

		expect(params.has('api_key')).toBe(false);
		expect(params.has('user_id')).toBe(false);
	});

	it('createOptionalParamAppender appends only present params', async () => {
		const { createOptionalParamAppender } = await import('$lib/logic/api-client/param-utils');

		const url = new URL('https://x.test/?alpha=1');
		const params = new URLSearchParams();

		const appendOptional = createOptionalParamAppender(url, params);
		appendOptional('alpha', 'beta');

		expect(params.get('alpha')).toBe('1');
		expect(params.has('beta')).toBe(false);
	});

	it('requireParams and createRequiredParamGetter return values and missing lists', async () => {
		const { requireParams, createRequiredParamGetter } = await import(
			'$lib/logic/api-client/param-utils'
		);

		const url = new URL('https://x.test/?x=1&y=2');

		const r = requireParams(url, 'x', 'z');
		expect(r.values).toEqual({ x: '1' });
		expect(r.missing).toEqual(['z']);

		const getRequired = createRequiredParamGetter(url);
		const r2 = getRequired('y', 'a');
		expect(r2.values).toEqual({ y: '2' });
		expect(r2.missing).toEqual(['a']);
	});
});

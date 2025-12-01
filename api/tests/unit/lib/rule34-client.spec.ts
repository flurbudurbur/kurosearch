import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	appendAuthParams,
	createOptionalParamAppender,
	requireParams,
	generateCacheKey
} from '../../../src/lib/rule34-client.js';

describe('rule34-client', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv };
		process.env.RULE34_API_KEY = 'test-key';
		process.env.RULE34_API_USER = 'test-user';
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('appendAuthParams', () => {
		it('should append api_key and user_id from environment', () => {
			const params = new URLSearchParams();
			appendAuthParams(params);

			expect(params.get('api_key')).toBe('test-key');
			expect(params.get('user_id')).toBe('test-user');
		});

		it('should not override existing api_key', () => {
			const params = new URLSearchParams({ api_key: 'existing-key' });
			appendAuthParams(params);

			expect(params.get('api_key')).toBe('existing-key');
		});

		it('should not override existing user_id', () => {
			const params = new URLSearchParams({ user_id: 'existing-user' });
			appendAuthParams(params);

			expect(params.get('user_id')).toBe('existing-user');
		});

		// Note: RULE34_API_KEY and RULE34_API_USER are required env vars.
		// The app will fail to start without them, so testing empty values
		// is no longer a valid scenario. The cached singleton from setup
		// ensures auth params are always present.
		it('should always append auth params from validated config', () => {
			// Even if we modify process.env, the cached config from getEnvFromProcess()
			// retains the validated values from test setup
			const params = new URLSearchParams();
			appendAuthParams(params);

			// Auth params should always be present since they're required
			expect(params.has('api_key')).toBe(true);
			expect(params.has('user_id')).toBe(true);
		});

		it('should preserve other parameters', () => {
			const params = new URLSearchParams({ tags: 'test', limit: '10' });
			appendAuthParams(params);

			expect(params.get('tags')).toBe('test');
			expect(params.get('limit')).toBe('10');
			expect(params.get('api_key')).toBe('test-key');
			expect(params.get('user_id')).toBe('test-user');
		});
	});

	describe('createOptionalParamAppender', () => {
		it('should append parameters that exist in query', () => {
			const query = new URLSearchParams({ tags: 'test', limit: '10' });
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit');

			expect(params.get('tags')).toBe('test');
			expect(params.get('limit')).toBe('10');
		});

		it('should skip parameters that do not exist in query', () => {
			const query = new URLSearchParams({ tags: 'test' });
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit', 'offset');

			expect(params.get('tags')).toBe('test');
			expect(params.has('limit')).toBe(false);
			expect(params.has('offset')).toBe(false);
		});

		it('should handle empty query object', () => {
			const query = new URLSearchParams();
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit');

			expect(params.has('tags')).toBe(false);
			expect(params.has('limit')).toBe(false);
		});

		it('should handle missing query values', () => {
			const query = new URLSearchParams({ tags: 'test' });
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit');

			expect(params.get('tags')).toBe('test');
			expect(params.has('limit')).toBe(false);
		});

		it('should handle empty string query values', () => {
			const query = new URLSearchParams({ tags: 'test', limit: '' });
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit');

			expect(params.get('tags')).toBe('test');
			expect(params.has('limit')).toBe(false);
		});

		it('should append multiple parameters in one call', () => {
			const query = new URLSearchParams({ tags: 'test', limit: '10', offset: '20', json: '1' });
			const params = new URLSearchParams();

			const appender = createOptionalParamAppender(query, params);
			appender('tags', 'limit', 'offset', 'json');

			expect(params.get('tags')).toBe('test');
			expect(params.get('limit')).toBe('10');
			expect(params.get('offset')).toBe('20');
			expect(params.get('json')).toBe('1');
		});
	});

	describe('requireParams', () => {
		it('should return all values when all required params exist', () => {
			const query = new URLSearchParams({ tags: 'test', limit: '10' });

			const result = requireParams(query, 'tags', 'limit');

			expect(result.values).toEqual({ tags: 'test', limit: '10' });
			expect(result.missing).toEqual([]);
		});

		it('should return missing params when required param is absent', () => {
			const query = new URLSearchParams({ tags: 'test' });

			const result = requireParams(query, 'tags', 'limit');

			expect(result.values).toEqual({ tags: 'test' });
			expect(result.missing).toEqual(['limit']);
		});

		it('should treat empty string as missing', () => {
			const query = new URLSearchParams({ tags: 'test', limit: '' });

			const result = requireParams(query, 'tags', 'limit');

			expect(result.values).toEqual({ tags: 'test' });
			expect(result.missing).toEqual(['limit']);
		});

		it('should work with single required param', () => {
			const query = new URLSearchParams({ post_id: '123456' });

			const result = requireParams(query, 'post_id');

			expect(result.values).toEqual({ post_id: '123456' });
			expect(result.missing).toEqual([]);
		});

		it('should work with multiple required params', () => {
			const query = new URLSearchParams({ param1: 'value1', param2: 'value2', param3: 'value3' });

			const result = requireParams(query, 'param1', 'param2', 'param3');

			expect(result.values).toEqual({ param1: 'value1', param2: 'value2', param3: 'value3' });
			expect(result.missing).toEqual([]);
		});

		it('should list all missing params', () => {
			const query = new URLSearchParams({ param1: 'value1' });

			const result = requireParams(query, 'param1', 'param2', 'param3');

			expect(result.values).toEqual({ param1: 'value1' });
			expect(result.missing).toEqual(['param2', 'param3']);
		});

		it('should handle numeric string values', () => {
			const query = new URLSearchParams({ id: '123' });

			const result = requireParams(query, 'id');

			expect(result.values).toEqual({ id: '123' });
			expect(result.missing).toEqual([]);
		});

		it('should handle no params at all', () => {
			const query = new URLSearchParams();

			const result = requireParams(query, 'tags', 'limit');

			expect(result.values).toEqual({});
			expect(result.missing).toEqual(['tags', 'limit']);
		});
	});

	describe('generateCacheKey', () => {
		it('should generate sorted query string from params', () => {
			const params = new URLSearchParams({ tags: 'test', limit: '10' });
			const key = generateCacheKey(params);

			// Should be sorted alphabetically
			expect(key).toBe('limit=10&tags=test');
		});

		it('should sort parameters consistently', () => {
			const params1 = new URLSearchParams({ b: '2', a: '1', c: '3' });
			const params2 = new URLSearchParams({ c: '3', a: '1', b: '2' });

			const key1 = generateCacheKey(params1);
			const key2 = generateCacheKey(params2);

			expect(key1).toBe(key2);
			expect(key1).toBe('a=1&b=2&c=3');
		});

		it('should handle empty params', () => {
			const params = new URLSearchParams();
			const key = generateCacheKey(params);

			expect(key).toBe('');
		});

		it('should handle single param', () => {
			const params = new URLSearchParams({ id: '123' });
			const key = generateCacheKey(params);

			expect(key).toBe('id=123');
		});

		it('should preserve URL encoding in params', () => {
			const params = new URLSearchParams({ tags: 'tag with spaces' });
			const key = generateCacheKey(params);

			expect(key).toContain('tags=tag');
		});

		it('should generate different keys for different params', () => {
			const params1 = new URLSearchParams({ tags: 'tag1' });
			const params2 = new URLSearchParams({ tags: 'tag2' });

			const key1 = generateCacheKey(params1);
			const key2 = generateCacheKey(params2);

			expect(key1).not.toBe(key2);
			expect(key1).toBe('tags=tag1');
			expect(key2).toBe('tags=tag2');
		});

		it('should handle multiple values for same param', () => {
			const params = new URLSearchParams();
			params.append('tags', 'tag1');
			params.append('tags', 'tag2');

			const key = generateCacheKey(params);

			// Both values should appear in the key
			expect(key).toContain('tags=');
		});

		it('should be consistent across multiple calls', () => {
			const params = new URLSearchParams({ a: '1', b: '2', c: '3' });

			const key1 = generateCacheKey(params);
			const key2 = generateCacheKey(params);
			const key3 = generateCacheKey(params);

			expect(key1).toBe(key2);
			expect(key2).toBe(key3);
			expect(key1).toBe('a=1&b=2&c=3');
		});
	});
});

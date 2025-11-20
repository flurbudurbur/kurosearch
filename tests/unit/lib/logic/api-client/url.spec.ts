import { describe, it, expect } from 'vitest';
import { R34_API_URL } from '$lib/logic/api-client/url';

describe('api-client/url constants', () => {
	it('R34_API_URL returns production API in non-test environment', () => {
		expect(R34_API_URL).toBe('https://api.rule34.xxx');
	});
});

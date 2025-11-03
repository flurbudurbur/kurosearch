import { describe, it, expect } from 'vitest';
import {
	R34_API_URL,
	SOURCE_API_URL,
	RELEASES_URL,
	LATEST_RELEASE_URL
} from '$lib/logic/api-client/url';

describe('api-client/url constants', () => {
	it('R34_API_URL', () => {
		expect(R34_API_URL).toBe('https://api.rule34.xxx');
	});
	it('SOURCE_API_URL', () => {
		expect(SOURCE_API_URL).toBe('https://api.github.com/repos/flur34/flur34');
	});
	it('RELEASES_URL', () => {
		expect(RELEASES_URL).toBe('https://api.github.com/repos/flur34/flur34/releases');
	});
	it('LATEST_RELEASE_URL', () => {
		expect(LATEST_RELEASE_URL).toBe('https://api.github.com/repos/flur34/flur34/releases/latest');
	});
});

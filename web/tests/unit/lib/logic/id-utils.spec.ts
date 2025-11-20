import { describe, it, expect } from 'vitest';
import { getPostId } from '$lib/logic/id-utils';

// Simple, deterministic helper: "post_<id>"
describe('id-utils', () => {
	it('formats positive integers', () => {
		expect(getPostId(1)).toBe('post_1');
		expect(getPostId(42)).toBe('post_42');
	});

	it('formats zero and negative numbers', () => {
		expect(getPostId(0)).toBe('post_0');
		expect(getPostId(-7)).toBe('post_-7');
	});

	it('formats non-integer numbers as given', () => {
		expect(getPostId(3.14 as unknown as number)).toBe('post_3.14');
	});
});

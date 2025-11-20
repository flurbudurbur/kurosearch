import { describe, expect, it } from 'vitest';
import { formatActiveTag } from '$lib/logic/format-tag';

describe('format-tag', () => {
	it('tag with only name renders correctly', () => {
		expect(formatActiveTag({ name: 'my_tag' })).toBe('my tag');
	});

	it('tag with name and count renders correctly', () => {
		expect(formatActiveTag({ name: 'my_tag', count: 1000 })).toBe('my tag (1K)');
	});

	const invalidNameCases = [undefined, null, 0, {}, []];
	invalidNameCases.forEach((name) => {
		it(`tag with invalid name (${name}) renders error`, () => {
			expect(formatActiveTag({ name, count: 1000 })).toBe('error');
		});
	});

	const invalidCountCases = [undefined, null, 'a', {}, []];
	invalidCountCases.forEach((count) => {
		it(`tag with invalid count (${count}) renders only name`, () => {
			expect(formatActiveTag({ name: 'tag', count })).toBe('tag');
		});
	});
});

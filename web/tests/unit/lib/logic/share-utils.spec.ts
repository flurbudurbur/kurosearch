import { describe, expect, it } from 'vitest';
import { parseShareTags, serializeShareTags } from '$lib/logic/share-utils';

describe('Parsing', () => {
	describe('search', () => {
		it('full', () => {
			const expectedTags: kurosearch.SearchableTag[] = [
				{
					name: 'samus_aran',
					modifier: '+'
				},
				{
					name: 'animated',
					modifier: '+'
				},
				{
					name: 'cum_in_pussy',
					modifier: '-'
				},
				{
					name: 'cum_in_ass',
					modifier: '~'
				},
				{
					name: 'cum_in_mouth',
					modifier: '~'
				}
			];

			expect(
				parseShareTags('+samus_aran;+animated;-cum_in_pussy;~cum_in_ass;~cum_in_mouth')
			).toEqual(expectedTags);
		});
	});
});

describe('Serialize', () => {
	it('joins tags with semicolons and serializes spaces to underscores', () => {
		const tags: kurosearch.SearchableTag[] = [
			{ name: 'mega man', modifier: '+' },
			{ name: 'zero suit', modifier: '-' },
			{ name: 'roll caskett', modifier: '~' }
		];

		expect(serializeShareTags(tags)).toBe('+mega_man;-zero_suit;~roll_caskett');
	});
});

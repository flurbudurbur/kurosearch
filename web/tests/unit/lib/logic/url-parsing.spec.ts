import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createSearchableTag } from '$lib/logic/tag-utils';
import { parseShareTags } from '$lib/logic/share-utils';
import type { FilterStoreData } from '$lib/store/filter-store';

const makeSort = (property: kurosearch.SortProperty, direction: kurosearch.SortDirection) => ({
	property,
	direction
});

const makeFilter = (overrides: Partial<FilterStoreData> = {}): Partial<FilterStoreData> => ({
	rating: 'all',
	scoreComparator: '>=',
	scoreValue: 0,
	...overrides
});

describe('url-parsing', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.restoreAllMocks();
	});

	it('serializeUrlSettings omits defaults (no tags, default sort, default filter)', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const params = mod.serializeUrlSettings({
			tags: [],
			sort: makeSort('id', 'desc') as any,
			filter: makeFilter()
		});
		expect(params.has('tags')).toBe(false);
		expect(params.has('sort')).toBe(false);
		expect(params.has('filter')).toBe(false);
		expect(params.toString()).toBe('');
	});

	it('serializeUrlSettings includes non-defaults and parseUrlSettings round-trips', async () => {
		const mod = await import('$lib/logic/url-parsing');

		const tags = [createSearchableTag('+' as any, 'cat'), createSearchableTag('-' as any, 'dog')];
		const sort = makeSort('id', 'asc'); // non-default direction triggers inclusion
		// @ts-expect-error - Not assignable by design
		const filter = makeFilter({ rating: 'general', scoreComparator: '<=', scoreValue: 10 });

		const params = mod.serializeUrlSettings({ tags, sort: sort as any, filter });

		expect(params.has('tags')).toBe(true);
		expect(params.has('sort')).toBe(true);
		expect(params.get('sort')).toBe('id:asc');
		expect(params.has('filter')).toBe(true);
		expect(params.get('filter')).toBe('rating:general;score<=10');

		const parsed = mod.parseUrlSettings(params);
		expect(parsed.sort).toEqual(sort);
		expect(parsed.filter).toEqual({ rating: 'general', scoreComparator: '<=', scoreValue: 10 });
		expect(parsed.tags).toEqual(parseShareTags(params.get('tags') || ''));
	});

	it('serializeUrlSettings includes only rating when comparator/value are defaults', async () => {
		const mod = await import('$lib/logic/url-parsing');

		const tags = [createSearchableTag('+' as any, 'cat')];
		const sort = makeSort('id', 'desc'); // default
		// @ts-expect-error - Not assignable by design
		const filter = makeFilter({ rating: 'general', scoreComparator: '>=', scoreValue: 0 });

		const params = mod.serializeUrlSettings({ tags, sort: sort as any, filter });

		expect(params.get('filter')).toBe('rating:general');
	});

	it('serializeUrlSettings includes score when comparator!=default and value==0 (left true, right false)', async () => {
		const mod = await import('$lib/logic/url-parsing');

		const tags = [createSearchableTag('+' as any, 'cat')];
		const sort = makeSort('id', 'desc'); // default
		const filter = makeFilter({ rating: 'all', scoreComparator: '<=', scoreValue: 0 });

		const params = mod.serializeUrlSettings({ tags, sort: sort as any, filter });

		expect(params.get('filter')).toBe('score<=0');
	});

	it('serializeUrlSettings includes only score when rating=all and value>0 (right side of OR)', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const tags = [createSearchableTag('+' as any, 'cat')];
		const sort = makeSort('id', 'desc'); // default sort, should be omitted
		const filter = makeFilter({ rating: 'all', scoreComparator: '>=', scoreValue: 5 });

		const params = mod.serializeUrlSettings({ tags, sort: sort as any, filter });

		expect(params.get('filter')).toBe('score>=5');
		expect(params.has('sort')).toBe(false);
	});

	it('parseUrlFilter handles score with zero by setting comparator but not value', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const params = new URLSearchParams('filter=score>=0');
		const parsed = mod.parseUrlSettings(params);
		expect(parsed.filter).toEqual({ scoreComparator: '>=' });
	});

	it('parseUrlFilter ignores rating:all', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const params = new URLSearchParams('filter=rating:all');
		const parsed = mod.parseUrlSettings(params);
		expect(parsed.filter).toEqual({});
	});

	it('parseUrlSort returns undefined when sort missing', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const params = new URLSearchParams('filter=rating:general');
		const parsed = mod.parseUrlSettings(params);
		expect(parsed.sort).toBeUndefined();
	});

	it('parseUrlSort handles present sort with missing colon yielding empty property', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const params = new URLSearchParams('sort=id');
		const parsed = mod.parseUrlSettings(params);
		expect(parsed.sort).toEqual({ property: 'id', direction: undefined });
	});

	it('parseUrlSort gracefully handles internal errors (catch branch)', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const bad: any = {
			has: (key: string) => key === 'sort' || key === 'tags',
			get: (key: string) => {
				if (key === 'tags') return '';
				if (key === 'sort') throw new Error('boom');
				return null;
			}
		};

		const parsed = mod.parseUrlSettings(bad as unknown as URLSearchParams);
		expect(parsed.sort).toBeUndefined();
	});

	it('parseUrlFilter gracefully handles internal errors (catch branch)', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const bad: any = {
			has: (key: string) => key === 'filter' || key === 'tags',
			get: (key: string) => {
				if (key === 'tags') return '';
				if (key === 'filter') throw new Error('boom');
				return null;
			}
		};

		const parsed = mod.parseUrlSettings(bad as unknown as URLSearchParams);
		expect(parsed.filter).toBeUndefined();
	});

	it('parseUrlSort uses nullish fallback when get returns null', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const weird: any = {
			has: (key: string) => key === 'sort' || key === 'tags',
			get: (key: string) => (key === 'tags' ? '' : null)
		};
		const parsed = mod.parseUrlSettings(weird as unknown as URLSearchParams);
		expect(parsed.sort).toEqual({ property: '', direction: undefined });
	});

	it('parseUrlFilter uses nullish fallback when get returns null', async () => {
		const mod = await import('$lib/logic/url-parsing');
		const weird: any = {
			has: (key: string) => key === 'filter' || key === 'tags',
			get: (key: string) => (key === 'tags' ? '' : null)
		};
		const parsed = mod.parseUrlSettings(weird as unknown as URLSearchParams);
		expect(parsed.filter).toEqual({});
	});

	it('getShareUrl returns empty string when browser=false', async () => {
		await vi.doMock('$app/environment', () => ({ browser: false }));
		const mod = await import('$lib/logic/url-parsing');
		const url = mod.getShareUrl(
			[],
			{ property: 'id', direction: 'asc' } as any,
			{
				rating: 'general',
				scoreComparator: '<=',
				scoreValue: 1
			} as any
		);
		expect(url).toBe('');
	});

	it('getShareUrl builds URL with expected params when browser=true', async () => {
		await vi.doMock('$app/environment', () => ({ browser: true }));
		vi.stubGlobal('location', new URL('https://example.com'));
		const mod = await import('$lib/logic/url-parsing');

		const tags = [createSearchableTag('+' as any, 'cat')];
		const sort = { property: 'id', direction: 'asc' } as any; // non-default
		const filter = { rating: 'general', scoreComparator: '<=', scoreValue: 5 } as any; // non-default

		const url = mod.getShareUrl(tags as any, sort, filter) as URL;
		expect(url).toBeInstanceOf(URL);
		expect(url.pathname).toBe('/share');
		expect(url.searchParams.get('sort')).toBe('id:asc');
		expect(url.searchParams.get('filter')).toBe('rating:general;score<=5');
		// tags param should exist
		expect(url.searchParams.has('tags')).toBe(true);
	});
});

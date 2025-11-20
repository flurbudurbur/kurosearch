import { describe, it, expect } from 'vitest';
import {
	LABELS_SORT,
	LABELS_SCORE_COMPARATOR,
	LABELS_RATING,
	LABELS_SORT_PROPERTY,
	LABELS_SORT_DIRECTION,
	getScoreLabel,
	getRatingLabel,
	getFilterLabel,
	getSortLabel
} from '$lib/components/kurosearch/sort-filter-config/sortfilter';

describe('components/kurosearch/sort-filter-config/sortfilter', () => {
	it('exposes constant label maps', () => {
		expect(LABELS_SCORE_COMPARATOR).toEqual({ '>=': '≥', '<=': '≤' });
		expect(LABELS_RATING.explicit).toBe('Explicit');
		expect(LABELS_SORT_PROPERTY.score).toBe('Score');
		expect(LABELS_SORT_DIRECTION.asc).toContain('arrow-up');
		expect(LABELS_SORT.id.asc).toBe('Oldest');
		expect(LABELS_SORT.id.desc).toBe('Newest');
	});

	it("getScoreLabel returns undefined for 0 with '>='", () => {
		expect(getScoreLabel(0, '>=' as any)).toBeUndefined();
	});

	it('getScoreLabel formats value and uses comparator symbol otherwise', () => {
		expect(getScoreLabel(0, '<=' as any)).toBe('Score ≤ 0');
		expect(getScoreLabel(1500, '>=' as any)).toBe('Score ≥ 1.5K');
	});

	it('getRatingLabel returns undefined for "all" and mapped value for others', () => {
		expect(getRatingLabel('all' as any)).toBeUndefined();
		expect(getRatingLabel('safe' as any)).toBe('Safe');
		expect(getRatingLabel('explicit' as any)).toBe('Explicit');
	});

	it('getFilterLabel combines rating and score labels or returns "All" if both empty', () => {
		expect(getFilterLabel('all' as any, 0, '>=' as any)).toBe('All');
		expect(getFilterLabel('safe' as any, 0, '>=' as any)).toBe('Safe');
		expect(getFilterLabel('all' as any, 1234, '<=' as any)).toBe('Score ≤ 1.2K');
		expect(getFilterLabel('explicit' as any, 500, '>=' as any)).toBe('Explicit,Score ≥ 500');
	});

	it('getSortLabel picks correct label for property and direction', () => {
		expect(getSortLabel('id' as any, 'asc' as any)).toBe('Oldest');
		expect(getSortLabel('score' as any, 'desc' as any)).toBe('Best');
	});
});

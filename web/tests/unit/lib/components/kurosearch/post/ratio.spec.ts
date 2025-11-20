import { describe, it, expect } from 'vitest';
import {
	calculateAspectRatio,
	calculateAspectRatioCss
} from '$lib/components/kurosearch/post/ratio';

describe('components/kurosearch/post/ratio', () => {
	it('calculateAspectRatio returns width/height when both provided', () => {
		expect(calculateAspectRatio(1920, 1080)).toBeCloseTo(1920 / 1080);
	});

	it('calculateAspectRatio falls back to 1 when width or height is falsy', () => {
		expect(calculateAspectRatio(0, 1080)).toBe(1);
		expect(calculateAspectRatio(1920, 0)).toBe(1);
		expect(calculateAspectRatio(0, 0)).toBe(1);
	});

	it('calculateAspectRatioCss returns "w / h" when both provided', () => {
		expect(calculateAspectRatioCss(16, 9)).toBe('16 / 9');
	});

	it('calculateAspectRatioCss falls back to "1 / 1" when width or height is falsy', () => {
		expect(calculateAspectRatioCss(0, 9)).toBe('1 / 1');
		expect(calculateAspectRatioCss(16, 0)).toBe('1 / 1');
		expect(calculateAspectRatioCss(0, 0)).toBe('1 / 1');
	});
});

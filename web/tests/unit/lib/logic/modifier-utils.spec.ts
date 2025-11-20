import { describe, it, expect } from 'vitest';
import {
	getNextModifier,
	getNextModifierNullable,
	getIndexOfModifier
} from '$lib/logic/modifier-utils';

// Runtime uses simple string comparison; types enforce TagModifier at compile time
// We still assert behavior for valid and invalid inputs.

describe('modifier-utils nextModifier', () => {
	it("cycles '+' -> '~'", () => {
		expect(getNextModifier('+')).toBe('~');
	});

	it("cycles '~' -> '-'", () => {
		expect(getNextModifier('~')).toBe('-');
	});

	it("cycles '-' -> '+' (wrap-around)", () => {
		expect(getNextModifier('-')).toBe('+');
	});

	it('unknown modifier falls back to start "+"', () => {
		// @ts-expect-error intentionally providing invalid modifier to test runtime
		expect(getNextModifier('x')).toBe('+');
	});
});

describe('modifier-utils getNextModifierNullable', () => {
	it("cycles '+' -> '~'", () => {
		expect(getNextModifierNullable('+')).toBe('~');
	});

	it("cycles '~' -> '-'", () => {
		expect(getNextModifierNullable('~')).toBe('-');
	});

	it("cycles '-' -> undefined (wrap to nullable)", () => {
		expect(getNextModifierNullable('-')).toBe(undefined);
	});

	it("cycles undefined -> '+' (complete cycle)", () => {
		expect(getNextModifierNullable(undefined)).toBe('+');
	});

	it('unknown modifier falls back to start "+"', () => {
		// @ts-expect-error intentionally providing invalid modifier to test runtime
		expect(getNextModifierNullable('x')).toBe('+');
	});
});

describe('modifier-utils getIndexOfModifier', () => {
	it('returns correct index for "+"', () => {
		expect(getIndexOfModifier('+')).toBe(0);
	});

	it('returns correct index for "~"', () => {
		expect(getIndexOfModifier('~')).toBe(1);
	});

	it('returns correct index for "-"', () => {
		expect(getIndexOfModifier('-')).toBe(2);
	});

	it('returns 0 for undefined', () => {
		expect(getIndexOfModifier(undefined)).toBe(0);
	});
});

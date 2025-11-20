import { describe, it, expect, vi } from 'vitest';
import { isSpace, isEnter, clickOnEnter } from '$lib/logic/keyboard-utils';

// Helper to create a KeyboardEvent with a given key
const makeKeyEvent = (key: string, opts: KeyboardEventInit = {}) =>
	new KeyboardEvent('keydown', { key, bubbles: true, ...opts });

describe('keyboard-utils', () => {
	describe('isSpace', () => {
		it('returns true when key is a single space', () => {
			const e = makeKeyEvent(' ');
			expect(isSpace(e as any)).toBe(true);
		});

		it('returns false for other keys', () => {
			const e = makeKeyEvent('Space');
			expect(isSpace(e as any)).toBe(false);
		});

		it('returns false when event is undefined/null', () => {
			expect(isSpace(undefined as any)).toBe(false);
			expect(isSpace(null as any)).toBe(false);
		});
	});

	describe('isEnter', () => {
		it('returns true when key is Enter', () => {
			const e = makeKeyEvent('Enter');
			expect(isEnter(e as any)).toBe(true);
		});

		it('returns false for non-Enter keys', () => {
			const e = makeKeyEvent(' ');
			expect(isEnter(e as any)).toBe(false);
		});
	});

	describe('clickOnEnter', () => {
		it('invokes target.click when key is Enter', () => {
			const button = document.createElement('button');
			const spy = vi.spyOn(button, 'click');

			// Listen on the element to ensure event.target is set properly
			button.addEventListener('keydown', (ev) => clickOnEnter(ev as KeyboardEvent));
			button.dispatchEvent(makeKeyEvent('Enter'));

			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('does nothing when key is not Enter', () => {
			const button = document.createElement('button');
			const spy = vi.spyOn(button, 'click');

			button.addEventListener('keydown', (ev) => clickOnEnter(ev as KeyboardEvent));
			button.dispatchEvent(makeKeyEvent(' '));

			expect(spy).not.toHaveBeenCalled();
		});

		it('does not throw when target or click is missing', () => {
			expect(() => clickOnEnter({ key: 'Enter', target: {} } as any)).not.toThrow();
		});
	});
});

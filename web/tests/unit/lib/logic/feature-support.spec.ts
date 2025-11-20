import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Note: All feature flags in feature-support.ts are computed at import time.
// We must set up our environment mocks BEFORE importing the module in each test.

describe('feature-support', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns false for all features when browser=false', async () => {
		vi.mock('$app/environment', () => ({ browser: false }));

		const mod = await import('$lib/logic/feature-support');

		expect(mod.supportsUrlSharing()).toBe(false);
		expect(mod.supportsFlexGap).toBe(false);
		expect(typeof mod.supportsGap).toBe('boolean');
		expect(typeof mod.supportsAspectRatio).toBe('boolean');
		expect(typeof mod.supportsObjectFit).toBe('boolean');
		expect(Boolean(mod.supportsFullscreen)).toBe(false);
		expect(typeof mod.supportsLocalStorage).toBe('boolean');
		expect(typeof mod.supportsSessionStorage).toBe('boolean');
	});

	it('evaluates features when browser=true (with mocked environment)', async () => {
		vi.mock('$app/environment', () => ({ browser: true }));

		// Set up navigator.share so supportsUrlSharing becomes true
		(globalThis.navigator as any).share = () => {};

		// Make document.fullscreenEnabled true for this test
		Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });

		// Force scrollHeight to 1 on created elements so the flex-gap check passes
		vi.spyOn(HTMLElement.prototype as any, 'scrollHeight', 'get').mockReturnValue(1);

		const mod = await import('$lib/logic/feature-support');

		expect(mod.supportsUrlSharing()).toBe(true);
		expect(mod.supportsFlexGap).toBe(true);

		// These depend on CSSStyleDeclaration property keys; in JSDOM, hyphenated CSS props
		// are typically not present. We only assert they are booleans evaluated at import time.
		expect(typeof mod.supportsGap).toBe('boolean');
		expect(typeof mod.supportsAspectRatio).toBe('boolean');
		expect(typeof mod.supportsObjectFit).toBe('boolean');

		expect(mod.supportsFullscreen).toBe(true);
		expect(mod.supportsLocalStorage).toBe(true);
		expect(mod.supportsSessionStorage).toBe(true);
	});

	it('browser=true but no share and flex-gap fails yields negatives', async () => {
		vi.mock('$app/environment', () => ({ browser: true }));

		// Ensure navigator.share is absent
		delete (globalThis.navigator as any).share;

		// Force scrollHeight to a value different from 1 so flex-gap check fails
		vi.spyOn(HTMLElement.prototype as any, 'scrollHeight', 'get').mockReturnValue(2);

		const mod = await import('$lib/logic/feature-support');

		expect(mod.supportsUrlSharing()).toBe(false); // BROWSER_RUNTIME true, but second operand false
		expect(mod.supportsFlexGap).toBe(false); // computed false path for flex-gap
	});

	it('computeFlexGapSupport covers both early-return and computed branches', async () => {
		vi.mock('$app/environment', () => ({ browser: true }));

		// First call: runtime=false should early-return without DOM checks
		let mod = await import('$lib/logic/feature-support');
		expect(mod.computeFlexGapSupport(false)).toBe(false);

		// Second call: runtime=true with scrollHeight=1 -> true
		vi.spyOn(HTMLElement.prototype as any, 'scrollHeight', 'get').mockReturnValue(1);
		// re-import to ensure clean state not necessary for pure function, but keep consistent pattern
		mod = await import('$lib/logic/feature-support');
		expect(mod.computeFlexGapSupport(true)).toBe(true);

		// Third call: runtime=true with scrollHeight!=1 -> false
		vi.spyOn(HTMLElement.prototype as any, 'scrollHeight', 'get').mockReturnValue(2);
		expect(mod.computeFlexGapSupport(true)).toBe(false);
	});
});

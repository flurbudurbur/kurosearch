import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

class IO implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin: string = '0px';
	readonly thresholds: ReadonlyArray<number> = [0];
	private _cb: IntersectionObserverCallback;
	constructor(cb: IntersectionObserverCallback) {
		this._cb = cb;
	}
	disconnect(): void {}
	observe(_: Element): void {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
	unobserve(_: Element): void {}
	// helper to trigger
	_trigger(entries: Partial<IntersectionObserverEntry>[]) {
		// @ts-ignore
		this._cb(entries as IntersectionObserverEntry[], this);
	}
}

// Provide a default mock IntersectionObserver for client-side tests.
// Individual tests can override/delete as needed using vi.stubGlobal.
if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
	// @ts-ignore
	(globalThis as any).IntersectionObserver = IO;
}

// Ensure clean mocks between tests
afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

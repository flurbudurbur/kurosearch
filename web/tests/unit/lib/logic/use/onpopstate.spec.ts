import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { onpopstate, addHistory } from '$lib/logic/use/onpopstate';

// Mock SvelteKit's navigation module
vi.mock('$app/navigation', () => ({
	pushState: vi.fn()
}));

describe('use/onpopstate', () => {
	let el: HTMLDivElement;
	let handler: ReturnType<typeof onpopstate>;
	let cb: Mock<() => void>;

	beforeEach(() => {
		el = document.createElement('div');
		cb = vi.fn();
		handler = onpopstate(el, cb);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		// ensure cleanup if a test failed before calling destroy
		if (handler && typeof handler.destroy === 'function') {
			handler.destroy();
		}
	});

	it('registers popstate listener and cleans up on destroy', () => {
		// trigger event -> should call cb
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(cb).toHaveBeenCalledTimes(1);

		// destroy should remove listener
		handler.destroy();
		window.dispatchEvent(new PopStateEvent('popstate'));
		expect(cb).toHaveBeenCalledTimes(1);
	});

	it('addHistory pushes a new history state with provided value', async () => {
		const { pushState } = await import('$app/navigation');
		addHistory('state-123');
		expect(pushState).toHaveBeenCalledTimes(1);
		expect(pushState).toHaveBeenCalledWith('', { state: 'state-123' });
	});
});

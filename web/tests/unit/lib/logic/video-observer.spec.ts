import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const importWithIO = async (hasIO: boolean) => {
	vi.resetModules();
	if (hasIO) {
		class IO {
			static cb: IntersectionObserverCallback | null = null;
			constructor(cb: IntersectionObserverCallback) {
				IO.cb = cb;
			}
			observe(_el: Element) {}
			unobserve(_el: Element) {}
		}
		// @ts-ignore attach to global
		globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
	} else {
		// Ensure no IO present so module takes SSR path
		// @ts-ignore
		delete (globalThis as any).IntersectionObserver;
	}
	const mod = await import('$lib/logic/video-observer');
	return { mod };
};

describe('video-observer', () => {
	beforeEach(() => vi.restoreAllMocks());
	afterEach(() => {
		// Cleanup any global IO we created
		// @ts-ignore
		delete (globalThis as any).IntersectionObserver;
	});

	it('plays on intersect (autoplay & paused) and pauses on non-intersect', async () => {
		const { mod } = await importWithIO(true);
		const { videoObserver } = mod as typeof import('$lib/logic/video-observer');

		// Create a fake HTMLVideoElement with controllable state
		const video = document.createElement('video') as HTMLVideoElement;
		let paused = true;
		Object.defineProperty(video, 'autoplay', { value: true, configurable: true });
		Object.defineProperty(video, 'paused', { get: () => paused, configurable: true });
		const play = vi.fn(() => {
			paused = false;
		});
		const pause = vi.fn(() => {
			paused = true;
		});
		// @ts-ignore override methods for jsdom
		video.play = play;
		// @ts-ignore override methods for jsdom
		video.pause = pause;

		// Observe (no real effect, but mirrors usage)
		videoObserver.observe(video);

		// Trigger IO callback for intersecting
		const IOCls: any = globalThis.IntersectionObserver as any;
		IOCls.cb?.([{ target: video, isIntersecting: true } as any], {} as any);
		expect(play).toHaveBeenCalledTimes(1);

		// Now out of view, should call pause when not paused
		IOCls.cb?.([{ target: video, isIntersecting: false } as any], {} as any);
		expect(pause).toHaveBeenCalledTimes(1);

		// cleanup
		videoObserver.unobserve(video);
	});

	it('SSR no-op observe/unobserve do not throw when IntersectionObserver is undefined', async () => {
		const { mod } = await importWithIO(false);
		const { videoObserver } = mod as typeof import('$lib/logic/video-observer');
		const el = document.createElement('div');
		expect(() => videoObserver.observe(el)).not.toThrow();
		expect(() => videoObserver.unobserve(el)).not.toThrow();
	});
});

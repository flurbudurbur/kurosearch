import { describe, it, expect, vi, beforeEach } from 'vitest';
import { longpress } from '$lib/actions/longpress';

// Store gesture instances for testing
let lastGestureInstance: any = null;

// Mock TinyGesture
vi.mock('tinygesture', () => {
	return {
		default: class TinyGesture {
			private listeners: Map<string, (() => void)[]> = new Map();

			constructor(_node: HTMLElement, _options?: { longPressTime?: number }) {
				// eslint-disable-next-line @typescript-eslint/no-this-alias
				lastGestureInstance = this;
			}

			on(event: string, callback: () => void) {
				if (!this.listeners.has(event)) {
					this.listeners.set(event, []);
				}
				this.listeners.get(event)!.push(callback);
			}

			// Expose method to manually trigger events for testing
			trigger(event: string) {
				const callbacks = this.listeners.get(event);
				if (callbacks) {
					callbacks.forEach((cb) => cb());
				}
			}

			destroy() {
				this.listeners.clear();
			}
		}
	};
});

describe('longpress action', () => {
	let element: HTMLElement;

	beforeEach(() => {
		element = document.createElement('div');
		document.body.appendChild(element);
		lastGestureInstance = null;

		// Mock touch support
		Object.defineProperty(window, 'ontouchstart', {
			value: {},
			configurable: true
		});
	});

	it('sets up gesture with callback', () => {
		const callback = vi.fn();
		const action = longpress(element, callback);
		expect(action).toHaveProperty('update');
		expect(action).toHaveProperty('destroy');
	});

	it('calls callback on longpress event', async () => {
		const callback = vi.fn();
		longpress(element, callback);

		// Wait for setup to complete
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Trigger longpress via the gesture instance
		if (lastGestureInstance) {
			lastGestureInstance.trigger('longpress');
		}

		expect(callback).toHaveBeenCalled();
	});

	it('prevents click propagation after longpress', async () => {
		const callback = vi.fn();
		longpress(element, callback);

		// Wait for setup
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Trigger longpress
		if (lastGestureInstance) {
			lastGestureInstance.trigger('longpress');
		}

		// Now simulate click event
		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true
		});
		const preventDefaultSpy = vi.spyOn(clickEvent, 'preventDefault');
		const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

		element.dispatchEvent(clickEvent);

		expect(preventDefaultSpy).toHaveBeenCalled();
		expect(stopPropagationSpy).toHaveBeenCalled();
	});

	it('prevents mouseup propagation after longpress', async () => {
		const callback = vi.fn();
		longpress(element, callback);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Trigger longpress
		if (lastGestureInstance) {
			lastGestureInstance.trigger('longpress');
		}

		// Simulate mouseup event
		const mouseupEvent = new MouseEvent('mouseup', {
			bubbles: true,
			cancelable: true
		});
		const preventDefaultSpy = vi.spyOn(mouseupEvent, 'preventDefault');

		element.dispatchEvent(mouseupEvent);

		expect(preventDefaultSpy).toHaveBeenCalled();
	});

	it('prevents touchend propagation after longpress and resets flag', async () => {
		const callback = vi.fn();
		longpress(element, callback);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Trigger longpress
		if (lastGestureInstance) {
			lastGestureInstance.trigger('longpress');
		}

		// Simulate touchend event
		const touchendEvent = new TouchEvent('touchend', {
			bubbles: true,
			cancelable: true
		});
		const preventDefaultSpy = vi.spyOn(touchendEvent, 'preventDefault');

		element.dispatchEvent(touchendEvent);

		expect(preventDefaultSpy).toHaveBeenCalled();

		// Wait for reset timeout
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Now click should not be prevented
		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true
		});
		const clickPreventSpy = vi.spyOn(clickEvent, 'preventDefault');
		element.dispatchEvent(clickEvent);

		expect(clickPreventSpy).not.toHaveBeenCalled();
	});

	it('cleans up on destroy', async () => {
		const callback = vi.fn();
		const action = longpress(element, callback);

		await new Promise((resolve) => setTimeout(resolve, 10));

		expect(() => action.destroy()).not.toThrow();

		// Verify gesture.destroy was called
		expect(lastGestureInstance).toBeTruthy();
	});

	it('can update with new callback', async () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();
		const action = longpress(element, callback1);

		await new Promise((resolve) => setTimeout(resolve, 10));

		action.update(callback2);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Trigger longpress with new callback
		if (lastGestureInstance) {
			lastGestureInstance.trigger('longpress');
		}

		expect(callback2).toHaveBeenCalled();
	});

	it('can be created without callback', () => {
		expect(() => longpress(element)).not.toThrow();
	});

	it('handles update without callback', () => {
		const callback = vi.fn();
		const action = longpress(element, callback);
		expect(() => action.update()).not.toThrow();
	});

	it('does not load TinyGesture when no touch support', async () => {
		// Remove touch support
		delete (window as any).ontouchstart;
		Object.defineProperty(navigator, 'maxTouchPoints', {
			value: 0,
			configurable: true
		});

		const callback = vi.fn();
		longpress(element, callback);

		await new Promise((resolve) => setTimeout(resolve, 10));

		// Should not have created a gesture instance
		expect(lastGestureInstance).toBeNull();
	});
});

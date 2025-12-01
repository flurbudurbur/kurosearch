import { browser } from '$app/environment';

// Lazy-load TinyGesture only on touch-enabled devices
let TinyGestureClass: typeof import('tinygesture').default | null = null;
let isLoadingGesture = false;

async function loadTinyGesture() {
	if (TinyGestureClass) return TinyGestureClass;
	if (isLoadingGesture) {
		// Wait for the current load to complete
		while (!TinyGestureClass) {
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
		return TinyGestureClass;
	}

	isLoadingGesture = true;
	const module = await import('tinygesture');
	TinyGestureClass = module.default;
	isLoadingGesture = false;
	return TinyGestureClass;
}

export function longpress(node: HTMLElement, callback?: () => void) {
	// Skip setup during SSR - actions only run on client anyway but this provides safety
	if (!browser) {
		return {
			update() {},
			destroy() {}
		};
	}
	let gesture: InstanceType<typeof import('tinygesture').default> | null = null;
	let longPressTriggered = false;
	let resetTimeout: ReturnType<typeof setTimeout>;

	const handleClick = (e: MouseEvent) => {
		// Prevent click from firing after a long press
		if (longPressTriggered) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			// Reset after handling the click
			longPressTriggered = false;
		}
	};

	const handleMouseUp = (e: MouseEvent) => {
		// Prevent mouseup from propagating after a long press
		if (longPressTriggered) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	};

	const handleTouchEnd = (e: TouchEvent) => {
		// Prevent touchend from propagating after a long press
		if (longPressTriggered) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			// Schedule reset after click event has had chance to fire
			clearTimeout(resetTimeout);
			resetTimeout = setTimeout(() => {
				longPressTriggered = false;
			}, 400);
		}
	};

	const setup = async (cb?: () => void) => {
		if (cb) {
			// Only load TinyGesture if touch is supported
			// Check for touch support before loading the library
			const hasTouch =
				'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.maxTouchPoints > 0;

			if (hasTouch) {
				const TinyGesture = await loadTinyGesture();
				gesture = new TinyGesture(node, {
					longPressTime: 300
				});
				gesture.on('longpress', () => {
					longPressTriggered = true;
					cb();
					// Don't reset here - wait until touchend/click
				});
				// Use capture phase to intercept events before they reach the component handlers
				node.addEventListener('touchend', handleTouchEnd, { capture: true, passive: false });
			}

			// Always add click and mouseup handlers for right-click fallback
			node.addEventListener('click', handleClick, { capture: true });
			node.addEventListener('mouseup', handleMouseUp, { capture: true });
		}
	};

	const teardown = () => {
		if (gesture) {
			gesture.destroy();
		}
		clearTimeout(resetTimeout);
		node.removeEventListener('click', handleClick, { capture: true } as any);
		node.removeEventListener('mouseup', handleMouseUp, { capture: true } as any);
		node.removeEventListener('touchend', handleTouchEnd, { capture: true } as any);
	};

	setup(callback);

	return {
		update(newCallback?: () => void) {
			teardown();
			setup(newCallback);
		},
		destroy: teardown
	};
}

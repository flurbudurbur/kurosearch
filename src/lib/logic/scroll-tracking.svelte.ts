import { browser } from '$app/environment';

export interface ScrollTrackingOptions {
	/** Minimum scroll distance in pixels before hiding (default: 10) */
	hideThreshold?: number;
	/** Optional callback when scroll position changes */
	onScroll?: (state: ScrollTrackingState) => void;
}

export interface ScrollTrackingState {
	/** Current scroll position in pixels */
	currentScrollY: number;
	/** Previous scroll position in pixels */
	previousScrollY: number;
	/** Scroll direction: 'up' | 'down' | undefined */
	direction: 'up' | 'down' | undefined;
	/** Whether user is near top of page (within hideThreshold) */
	isNearTop: boolean;
	/** Whether scrolling down past threshold */
	shouldHide: boolean;
}

/**
 * Composable scroll tracking utility using Svelte 5 runes
 *
 * @example
 * ```ts
 * const scroll = useScrollTracking({ hideThreshold: 10 });
 *
 * // In component:
 * {#if scroll.shouldHide}
 *   // Hide element
 * {/if}
 * ```
 */
export function useScrollTracking(options: ScrollTrackingOptions = {}) {
	const { hideThreshold = 10, onScroll } = options;

	const state = $state<ScrollTrackingState>({
		currentScrollY: 0,
		previousScrollY: 0,
		direction: undefined,
		isNearTop: true,
		shouldHide: false
	});

	$effect(() => {
		if (browser) {
			const handleScroll = () => {
				const currentScrollY = window.scrollY;

				// Determine scroll direction (compare with current, not previous)
				if (currentScrollY > state.currentScrollY) {
					state.direction = 'down';
				} else if (currentScrollY < state.currentScrollY) {
					state.direction = 'up';
				}

				// Check if near top
				state.isNearTop = currentScrollY < hideThreshold;

				// Determine if should hide (scrolling down and not near top)
				state.shouldHide = state.direction === 'down' && !state.isNearTop;

				// Update positions
				state.previousScrollY = state.currentScrollY;
				state.currentScrollY = currentScrollY;

				// Call optional callback
				if (onScroll) {
					onScroll(state);
				}
			};

			window.addEventListener('scroll', handleScroll, { passive: true });

			return () => {
				window.removeEventListener('scroll', handleScroll);
			};
		}
	});

	return state;
}

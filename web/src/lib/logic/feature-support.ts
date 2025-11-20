import { browser } from '$app/environment';

// Allow tests to override browser detection at runtime without changing production behavior.
// In production, __TEST_BROWSER__ is undefined and we fall back to SvelteKit's `browser`.
const BROWSER_RUNTIME: boolean = (globalThis as any).__TEST_BROWSER__ ?? browser;

export const supportsUrlSharing = () => BROWSER_RUNTIME && 'share' in window.navigator;
export const computeFlexGapSupport = (runtime: boolean = BROWSER_RUNTIME): boolean => {
	if (!runtime) return false;

	// create flex container with row-gap set
	const flex = document.createElement('div');
	flex.style.display = 'flex';
	flex.style.flexDirection = 'column';
	flex.style.rowGap = '1px';

	// create two elements inside it
	flex.appendChild(document.createElement('div'));
	flex.appendChild(document.createElement('div'));

	// append to the DOM (needed to obtain scrollHeight)
	document.body.appendChild(flex);
	const isSupported = flex.scrollHeight === 1; // flex container should be 1px high from the row-gap
	flex.remove();

	return isSupported;
};

export const supportsFlexGap = computeFlexGapSupport();

export const supportsGap = BROWSER_RUNTIME && 'gap' in document.body.style;
export const supportsAspectRatio = BROWSER_RUNTIME && 'aspect-ratio' in document.body.style;
export const supportsObjectFit = BROWSER_RUNTIME && 'object-fit' in document.body.style;
export const supportsFullscreen = BROWSER_RUNTIME && document.fullscreenEnabled;
export const supportsLocalStorage = BROWSER_RUNTIME && Boolean(localStorage);
export const supportsSessionStorage = BROWSER_RUNTIME && Boolean(sessionStorage);

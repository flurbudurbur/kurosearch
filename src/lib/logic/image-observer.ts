import { browser } from '$app/environment';

// Determine optimal rootMargin based on network conditions
const getAdaptiveRootMargin = (): string => {
	if (!browser) return '500px';

	// Check if Network Information API is available
	const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

	if (!connection) return '500px'; // Default for browsers without Network Information API

	const effectiveType = connection.effectiveType;

	// Adjust preload distance based on connection speed
	switch (effectiveType) {
		case 'slow-2g':
		case '2g':
			return '200px'; // Slow connections: load closer to viewport
		case '3g':
			return '350px'; // Medium connections: moderate preload
		case '4g':
		default:
			return '500px'; // Fast connections: aggressive preload
	}
};

const observer = browser
	? new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const dataSrc = entry.target.getAttribute('data-src') ?? '';
						const currentSrc = entry.target.getAttribute('src') ?? '';
						if (currentSrc === dataSrc) {
							return;
						}
						entry?.target?.setAttribute('src', dataSrc);
					}
					// Removed unload behavior - keep images loaded for better UX and less bandwidth waste
				}
			},
			{ rootMargin: getAdaptiveRootMargin() }
		)
	: null;

export const observeImage = (node: HTMLElement) => {
	observer?.observe(node);

	return {
		destroy() {
			observer?.unobserve(node);
		}
	};
};

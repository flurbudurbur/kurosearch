<script lang="ts">
	import { browser } from '$app/environment';
	import { observeImage } from '$lib/logic/image-observer';
	import { blurEnabled } from '$lib/store/blur-enabled-store';

	interface Props {
		src: string;
		previewSrc?: string;
		sampleSrc?: string;
		alt: string;
		width?: number;
		height?: number;
		onclick?: () => void;
		priority?: boolean;
		index?: number;
		dominantColor?: string;
	}

	let {
		src,
		previewSrc,
		sampleSrc,
		alt,
		width,
		height,
		onclick,
		priority = false,
		index = 0,
		dominantColor = '#151520'
	}: Props = $props();

	// Calculate aspect ratio for layout stability
	const aspectRatio = width && height ? `${width} / ${height}` : 'auto';

	// Connection-aware source selection
	const getOptimalSrc = () => {
		if (!browser) return src;

		const connection = (navigator as any).connection;
		if (!connection) return src;

		switch (connection.effectiveType) {
			case 'slow-2g':
			case '2g':
				return previewSrc || sampleSrc || src;
			case '3g':
				return sampleSrc || src;
			default:
				return src;
		}
	};

	const optimalSrc = getOptimalSrc();

	// Build srcset for responsive images
	const srcset =
		previewSrc && sampleSrc && width
			? `${previewSrc} 150w, ${sampleSrc} 850w, ${src} ${width}w`
			: undefined;

	const sizes = srcset ? '(max-width: 600px) 150px, (max-width: 1200px) 850px, 100vw' : undefined;

	// Colored placeholder for better perceived performance
	const placeholder =
		width && height
			? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='${encodeURIComponent(dominantColor)}'/%3E%3C/svg%3E`
			: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

	// Priority for above-fold images
	const isHighPriority = priority || index < 3;
</script>

<button
	class="post-media"
	class:blurred={$blurEnabled}
	type="button"
	{onclick}
	style="aspect-ratio: {aspectRatio};"
>
	<img
		class="post-media"
		class:blurred={$blurEnabled}
		loading={isHighPriority ? 'eager' : 'lazy'}
		decoding="async"
		fetchpriority={isHighPriority ? 'high' : 'auto'}
		srcset={srcset}
		sizes={sizes}
		data-src={optimalSrc}
		{alt}
		{width}
		{height}
		src={placeholder}
		use:observeImage
		style="aspect-ratio: {aspectRatio};"
	/>
</button>

<style lang="scss">
	button {
		position: absolute;
		top: 0;
		left: 0;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 100%;
		height: 100%;
		z-index: var(--z-media);
	}

	img {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
		width: 100%;
		height: auto;
		object-fit: contain;
		contain: strict;
		pointer-events: none;

		border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;

		&.blurred {
			filter: blur(20px);
		}
	}

	@container (min-width: 800px) {
		button {
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
			overflow: hidden;
		}

		img {
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
		}
	}
</style>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MosaicPost from '../post/MosaicPost.svelte';
	import SingleColumnPost from '../post/SingleColumnPost.svelte';
	import columnWidthStore from '$lib/store/column-width-store';
	import type { Snippet } from 'svelte';

	interface Props {
		posts: kurosearch.Post[];
		columns: string;
		onfullscreen: (index: number, currentTime?: number) => void;
		intersectionDetector?: Snippet;
		onscrollprogress?: () => void;
	}

	let { posts, columns, onfullscreen, intersectionDetector, onscrollprogress }: Props = $props();

	// Virtual scrolling configuration
	const RENDER_BUFFER = 30; // Number of posts to render above/below viewport
	const SINGLE_COLUMN_HEIGHT = 700; // Estimated average height for single column posts
	const MOSAIC_ROW_HEIGHT = 180; // Height of one row in mosaic grid (matches grid-auto-rows calc)
	const SCROLL_PROGRESS_THRESHOLD = 0.6; // Trigger loading at 60% scroll progress

	let visibleRange = $state({ start: 0, end: 60 }); // Initial render range (2 screens worth)
	let hasTriggeredScrollProgress = $state(false); // Track if we've triggered at this threshold

	// Determine if we're in single column mode
	let isSingleColumn = $derived(columns === '1');

	// Calculate visible range based on scroll position
	const updateVisibleRange = () => {
		const scrollTop = window.scrollY;
		const viewportHeight = window.innerHeight;

		if (isSingleColumn) {
			// Simple calculation for single column
			const start = Math.max(0, Math.floor(scrollTop / SINGLE_COLUMN_HEIGHT) - RENDER_BUFFER);
			const end = Math.min(
				posts.length,
				Math.ceil((scrollTop + viewportHeight) / SINGLE_COLUMN_HEIGHT) + RENDER_BUFFER
			);
			visibleRange = { start, end };
		} else {
			// For mosaic, calculate based on rows
			const columnsNum = parseInt(columns) || 1;
			const rowHeight = MOSAIC_ROW_HEIGHT;
			const currentRow = Math.floor(scrollTop / rowHeight);
			const visibleRows = Math.ceil(viewportHeight / rowHeight);

			const startRow = Math.max(0, currentRow - Math.ceil(RENDER_BUFFER / columnsNum));
			const endRow = currentRow + visibleRows + Math.ceil(RENDER_BUFFER / columnsNum);

			const start = Math.max(0, startRow * columnsNum);
			const end = Math.min(posts.length, endRow * columnsNum);

			visibleRange = { start, end };
		}

		// Check scroll progress and trigger callback
		checkScrollProgress();
	};

	// Check if we've reached the scroll progress threshold
	const checkScrollProgress = () => {
		if (!onscrollprogress || hasTriggeredScrollProgress) return;

		const scrollTop = window.scrollY;
		const viewportHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;

		// Calculate how far through the content we've scrolled
		const scrollProgress = (scrollTop + viewportHeight) / documentHeight;

		// Trigger callback when reaching threshold
		if (scrollProgress >= SCROLL_PROGRESS_THRESHOLD) {
			hasTriggeredScrollProgress = true;
			onscrollprogress();
		}
	};

	// Handle scroll events with throttling
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
	let rafId: number | undefined;

	const handleScroll = () => {
		if (scrollTimeout) clearTimeout(scrollTimeout);
		if (rafId) cancelAnimationFrame(rafId);

		isScrolling = true;

		// Throttle updates to avoid double-rendering
		scrollTimeout = setTimeout(() => {
			rafId = requestAnimationFrame(() => {
				updateVisibleRange();
				isScrolling = false;
			});
		}, 100);
	};

	// Set up scroll listener
	onMount(() => {
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', updateVisibleRange, { passive: true });

		// Initial calculation
		updateVisibleRange();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', updateVisibleRange);
			if (scrollTimeout) clearTimeout(scrollTimeout);
			if (rafId) cancelAnimationFrame(rafId);
		};
	});

	// Track if we're currently scrolling to avoid effect conflicts
	let isScrolling = $state(false);

	// Update visible range when posts or columns change
	$effect(() => {
		if (posts.length && !isScrolling) {
			tick().then(updateVisibleRange);
		}
	});

	// Reset scroll progress trigger when posts array changes (new page loaded)
	$effect(() => {
		// Watch posts.length to detect new pages
		void posts.length;
		// Reset the flag so we can trigger again for the next page
		hasTriggeredScrollProgress = false;
	});

	// Get visible posts slice
	let visiblePosts = $derived(posts.slice(visibleRange.start, visibleRange.end));

	// Only enable virtual scrolling if we have enough posts AND in single column mode
	// Mosaic mode has variable row heights, making virtual scrolling position calculations unreliable
	let shouldVirtualize = $derived(posts.length > 100 && isSingleColumn);
	let displayPosts = $derived(shouldVirtualize ? visiblePosts : posts);
	let indexOffset = $derived(shouldVirtualize ? visibleRange.start : 0);
</script>

{#if isSingleColumn}
	<!-- Single column layout -->
	<section class="single-column" class:virtualized={shouldVirtualize}>
		{#if shouldVirtualize}
			<!-- Spacer for scrolled-past content -->
			{#if visibleRange.start > 0}
				<div
					class="spacer"
					style="height: {visibleRange.start * SINGLE_COLUMN_HEIGHT}px;"
					aria-hidden="true"
				></div>
			{/if}
		{/if}

		{#each displayPosts as post, visualIndex}
			{@const actualIndex = indexOffset + visualIndex}
			<SingleColumnPost
				{post}
				index={actualIndex}
				onfullscreen={(currentTime) => onfullscreen(actualIndex, currentTime)}
			/>
			{#if intersectionDetector && (actualIndex + 1) % 10 === 0 && actualIndex >= posts.length - 15}
				{@render intersectionDetector()}
			{/if}
		{/each}

		{#if shouldVirtualize && visibleRange.end < posts.length}
			<!-- Spacer for remaining content -->
			<div
				class="spacer"
				style="height: {(posts.length - visibleRange.end) * SINGLE_COLUMN_HEIGHT}px;"
				aria-hidden="true"
			></div>
		{/if}
	</section>
{:else}
	<!-- Multi-column mosaic layout -->
	<section
		class="multi-column"
		style="--nr-columns: {columns}; --layout-width-percent: {$columnWidthStore};"
		class:virtualized={shouldVirtualize}
	>
		{#if shouldVirtualize}
			<!-- Spacer for scrolled-past content -->
			{#if visibleRange.start > 0}
				{@const columnsNum = parseInt(columns) || 1}
				{@const rows = Math.ceil(visibleRange.start / columnsNum)}
				<div
					class="spacer"
					style="grid-column: 1 / -1; height: {rows * MOSAIC_ROW_HEIGHT}px;"
					aria-hidden="true"
				></div>
			{/if}
		{/if}

		{#each displayPosts as post, visualIndex}
			{@const actualIndex = indexOffset + visualIndex}
			<MosaicPost {post} index={actualIndex} onclick={() => onfullscreen(actualIndex)} />
			{#if intersectionDetector && (actualIndex + 1) % 10 === 0 && actualIndex >= posts.length - 15}
				{@render intersectionDetector()}
			{/if}
		{/each}

		{#if shouldVirtualize && visibleRange.end < posts.length}
			<!-- Spacer for remaining content -->
			{@const columnsNum = parseInt(columns) || 1}
			{@const remainingPosts = posts.length - visibleRange.end}
			{@const rows = Math.ceil(remainingPosts / columnsNum)}
			<div
				class="spacer"
				style="grid-column: 1 / -1; height: {rows * MOSAIC_ROW_HEIGHT}px;"
				aria-hidden="true"
			></div>
		{/if}
	</section>
{/if}

<style lang="scss">
	.single-column {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
	}

	.multi-column {
		--nr-columns: 1;
		--layout-width-percent: 100;
		max-width: calc(var(--layout-width-percent) * 1vw - 4rem);
		width: 100%;
		margin-inline: auto;
		display: grid;
		gap: var(--small-gap);
		grid-template-columns: repeat(var(--nr-columns), minmax(auto, 800px));
		grid-auto-rows: calc(min(var(--body-width), 100vw) / 5 / var(--nr-columns));
		justify-content: center;
	}

	.virtualized {
		contain: layout style paint;
	}

	.spacer {
		pointer-events: none;
		user-select: none;
	}

	.single-column .spacer {
		width: 100%;
	}
</style>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import MosaicPost from '../post/MosaicPost.svelte';
	import SingleColumnPost from '../post/SingleColumnPost.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		posts: kurosearch.Post[];
		columns: string;
		onfullscreen: (index: number, currentTime?: number) => void;
		intersectionDetector?: Snippet;
	}

	let { posts, columns, onfullscreen, intersectionDetector }: Props = $props();

	// Virtual scrolling configuration
	const RENDER_BUFFER = 30; // Number of posts to render above/below viewport
	const SINGLE_COLUMN_HEIGHT = 800; // Estimated height for single column posts
	const MOSAIC_ROW_HEIGHT = 150; // Height of one row in mosaic grid

	let visibleRange = $state({ start: 0, end: 60 }); // Initial render range (2 screens worth)

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
	};

	// Handle scroll events with throttling
	let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

	const handleScroll = () => {
		if (scrollTimeout) clearTimeout(scrollTimeout);

		// Update immediately for responsive feel
		requestAnimationFrame(updateVisibleRange);

		// Debounce final update
		scrollTimeout = setTimeout(() => {
			updateVisibleRange();
		}, 150);
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
		};
	});

	// Update visible range when posts or columns change
	$effect(() => {
		if (posts.length) {
			tick().then(updateVisibleRange);
		}
	});

	// Get visible posts slice
	let visiblePosts = $derived(posts.slice(visibleRange.start, visibleRange.end));

	// Only enable virtual scrolling if we have enough posts
	let shouldVirtualize = $derived(posts.length > 100);
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
		style="--nr-columns: {columns};"
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
		width: 100%;
		display: grid;
		gap: var(--small-gap);
		grid-template-columns: repeat(var(--nr-columns), 1fr);
		grid-auto-rows: calc(min(var(--body-width), 100vw) / 5 / var(--nr-columns));
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

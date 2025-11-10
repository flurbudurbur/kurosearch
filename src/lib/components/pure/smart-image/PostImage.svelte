<script lang="ts">
	import PostOverlay from '$lib/components/kurosearch/post-overlay/PostOverlay.svelte';
	import {
		calculateAspectRatio,
		calculateAspectRatioCss
	} from '$lib/components/kurosearch/post/ratio';
	import { getOptimalImageUrl } from '$lib/logic/media-utils';
	import highResolutionEnabled from '$lib/store/high-resolution-enabled';
	import ObservedImage from './ObservedImage.svelte';

	interface Props {
		post: kurosearch.Post;
		onclick?: () => void;
		onfullscreen?: () => void;
		index?: number;
		priority?: boolean;
	}

	let { post, onclick, onfullscreen, index = 0, priority = false }: Props = $props();

	const onclickinternal = () => {
		open = !open;
		onclick?.();
	};

	let open: boolean = $state(false);
	let overlayHidden = $state(true);

	const ontoggleoverlay = (e: Event) => {
		e.stopPropagation();
		overlayHidden = !overlayHidden;
	};

	let previewSrc = $derived(post.preview_url);
	let actualSrc = $derived(
		getOptimalImageUrl(post.width, post.file_url, post.sample_url, $highResolutionEnabled)
	);
	let alt = $derived(post.id.toString());
	let ratio = $derived(calculateAspectRatio(post.width, post.height));
	let canOpen = $derived(ratio < 0.4);
	let cssRation = $derived(calculateAspectRatioCss(post.width, post.height));
</script>

<button
	class:can-open={canOpen}
	class:open
	onclick={onclickinternal}
	style="aspect-ratio: {cssRation};"
	aria-label={open ? 'Show less of image' : 'Show full image'}
	aria-expanded={open}
>
	<ObservedImage
		src={previewSrc}
		previewSrc={post.preview_url}
		sampleSrc={post.sample_url}
		{alt}
		width={post.width}
		height={post.height}
		onclick={ontoggleoverlay}
		{priority}
		{index}
	/>
	<ObservedImage
		src={actualSrc}
		previewSrc={post.preview_url}
		sampleSrc={post.sample_url}
		{alt}
		width={post.width}
		height={post.height}
		onclick={ontoggleoverlay}
		{priority}
		{index}
	/>
	<PostOverlay mediaType="img" {onfullscreen} hidden={overlayHidden} />
</button>

<style lang="scss">
	button {
		position: relative;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		width: 100%;
		border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
	}

	.can-open:not(.open) {
		width: 100%;
		max-height: 100vh;
		overflow: hidden;
	}

	.can-open:not(.open)::before {
		position: absolute;
		left: 0;
		bottom: 0;
		z-index: 100;
		text-align: center;
		width: 100%;
		content: 'Show more';
		padding: var(--grid-gap);
		background: linear-gradient(0deg, var(--background-0) 0%, transparent 100%);
		user-select: none;
		color: var(--text-highlight);
	}

	@container (min-width: 800px) {
		button {
			border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
			overflow: hidden;
		}
	}
</style>

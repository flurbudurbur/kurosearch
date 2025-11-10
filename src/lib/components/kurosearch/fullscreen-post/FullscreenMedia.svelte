<script lang="ts">
	import { setContext } from 'svelte';
	import type { Component } from 'svelte';

	interface Props {
		post: kurosearch.Post;
		ondetails: () => void;
		onended?: () => void;
		startAt?: number;
	}

	let { post, onended, ondetails, startAt }: Props = $props();

	// Provide callbacks via context to avoid prop drilling through media type components
	setContext('fullscreen-callbacks', { ondetails, onended });

	// Lazy-load media type components based on post type
	let FullscreenVideo: Component<{ post: kurosearch.Post; startAt?: number }> | undefined =
		$state(undefined);
	let FullscreenGif: Component<{ post: kurosearch.Post }> | undefined = $state(undefined);
	let FullscreenComic: Component<{ post: kurosearch.Post }> | undefined = $state(undefined);
	let FullscreenImage: Component<{ post: kurosearch.Post }> | undefined = $state(undefined);

	// Load the appropriate component based on post type
	$effect(() => {
		if (post.type === 'video' && !FullscreenVideo) {
			(async () => {
				const module = await import('./FullscreenVideo.svelte');
				FullscreenVideo = module.default;
			})();
		} else if (post.type === 'gif' && !FullscreenGif) {
			(async () => {
				const module = await import('./FullscreenGif.svelte');
				FullscreenGif = module.default;
			})();
		} else if (post.width / post.height < 0.4 && !FullscreenComic) {
			(async () => {
				const module = await import('./FullscreenComic.svelte');
				FullscreenComic = module.default;
			})();
		} else if (post.type === 'image' && !FullscreenImage) {
			(async () => {
				const module = await import('./FullscreenImage.svelte');
				FullscreenImage = module.default;
			})();
		}
	});
</script>

<div>
	{#if post.type === 'video' && FullscreenVideo}
		<FullscreenVideo {post} {startAt} />
	{:else if post.type === 'gif' && FullscreenGif}
		<FullscreenGif {post} />
	{:else if post.width / post.height < 0.4 && FullscreenComic}
		<FullscreenComic {post} />
	{:else if FullscreenImage}
		<FullscreenImage {post} />
	{/if}
</div>

<style lang="scss">
	div {
		height: 100vh;
		width: 100vw;
		contain: strict;
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}
</style>

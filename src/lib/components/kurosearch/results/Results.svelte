<script lang="ts">
	import { pushState } from '$app/navigation';
	import { getPostId } from '$lib/logic/id-utils';
	import resultColumns from '$lib/store/result-columns-store';
	import results from '$lib/store/results-store';
	import { pausePlayingVideo } from '../media-video/Video.svelte';
	import VirtualPostGrid from './VirtualPostGrid.svelte';
	import type { Component, Snippet } from 'svelte';

	interface Props {
		onendreached: () => void;
		intersectionDetector?: Snippet;
	}

	let { onendreached, intersectionDetector }: Props = $props();

	let fullscreenIndex: undefined | number = $state(undefined);
	let fullscreenCurrentTime: undefined | number = $state(undefined);
	let FullscreenPost:
		| Component<{
				index: number;
				onendreached: () => void;
				onclose: (index: number) => void;
				startAt?: number;
		  }>
		| undefined = $state(undefined);

	const exitFullscreen = (postIndex: number) => {
		const post = $results.posts[postIndex];
		const id = getPostId(post.id);
		document.getElementById(id)?.scrollIntoView();
		fullscreenIndex = undefined;
	};

	const onfullscreen = async (index: number, currentTime?: number) => {
		pausePlayingVideo();
		fullscreenIndex = index;
		fullscreenCurrentTime = currentTime;

		// Lazy load FullscreenPost component only when needed
		if (!FullscreenPost) {
			const module = await import('../fullscreen-post/FullscreenPost.svelte');
			FullscreenPost = module.default;
		}
	};

	$effect(() => {
		if (fullscreenIndex !== undefined) {
			pushState('', { fullscreen: true });
		} else {
			if (history.state?.fullscreen) {
				history.back();
			}
		}
	});
</script>

<VirtualPostGrid
	posts={$results.posts}
	columns={$resultColumns}
	{onfullscreen}
	{intersectionDetector}
/>

{#if fullscreenIndex !== undefined && FullscreenPost}
	<FullscreenPost
		index={fullscreenIndex}
		onclose={exitFullscreen}
		{onendreached}
		startAt={fullscreenCurrentTime}
	/>
{/if}

<script lang="ts">
	import { isValidUrl } from '$lib/logic/url-utils';
	import Comments from '../post-comment/Comments.svelte';
	import Summary from '../post-summary/Summary.svelte';
	import Sources from '../post/Sources.svelte';
	import PostDetailsTagList from '../tag-list/PostDetailsTagList.svelte';
	import SummaryOverflow from '$lib/components/kurosearch/post-summary/SummaryOverflow.svelte';
	import { setPostDetailsContext } from './post-details-context.svelte';

	interface Props {
		post: kurosearch.Post;
	}

	let { post }: Props = $props();

	let activeTab = $state<string | undefined>(undefined);
	let overflowOpen = $state(false);

	const links = [
		new URL(`${window.location.origin}/post?id=${post.id}`),
		new URL(`https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`),
		new URL(post.file_url),
		...(post.source
			? post.source
					.split(' ')
					.filter((x) => isValidUrl(x))
					.map((x) => new URL(x))
			: [])
	];

	// Set context for child components
	setPostDetailsContext({
		post,
		links: links.length,
		get activeTab() {
			return activeTab;
		},
		get overflowOpen() {
			return overflowOpen;
		},
		selectTab: (tab: string) => {
			const newTab = activeTab === tab ? undefined : tab;
			activeTab = newTab;

			// Close overflow menu when deselecting links/comments, or when selecting tags
			if (overflowOpen) {
				if (!newTab && (tab === 'links' || tab === 'comments')) {
					// Deselecting links or comments closes the menu
					overflowOpen = false;
				} else if (newTab === 'tags') {
					// Selecting tags closes the menu
					overflowOpen = false;
				}
			}
		},
		toggleOverflow: () => {
			overflowOpen = !overflowOpen;
			if (overflowOpen) {
				// Always switch to links when opening overflow menu
				activeTab = 'links';
			} else if (!overflowOpen && (activeTab === 'links' || activeTab === 'comments')) {
				// Clear active tab when closing if it's links or comments
				activeTab = undefined;
			}
		}
	});
</script>

<div class="details">
	<Summary />
	{#if overflowOpen}
		<SummaryOverflow />
	{/if}
	{#if activeTab === 'tags'}
		<PostDetailsTagList tags={post.tags} />
	{:else if activeTab === 'comments'}
		<Comments {post} />
	{:else if activeTab === 'links'}
		<Sources {post} />
	{/if}

	<!-- Preload comments in background when overflow is open -->
	{#if overflowOpen && post.comment_count && activeTab !== 'comments'}
		<div style="display: none;">
			<Comments {post} />
		</div>
	{/if}
</div>

<style>
	.details {
		display: flex;
		flex-direction: column;
		gap: var(--small-gap);
		padding: var(--small-gap);
		background-color: var(--background-1);
		border-radius: 0 0 var(--border-radius-large) var(--border-radius-large);
	}

	@container (min-width: 800px) {
		.details {
			border-radius: 0 0 var(--border-radius-large) var(--border-radius-large);
		}
	}

	@keyframes slide-down {
		from {
			transform: translateY(-100px);
		}

		to {
			transform: translateY(0px);
		}
	}
</style>

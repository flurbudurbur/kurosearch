<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';
	import RelativeTime from '../relative-time/RelativeTime.svelte';
	import Score from '../score/Score.svelte';
	import BookmarkButton from '$lib/components/kurosearch/button-bookmark/BookmarkButton.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { getPostDetailsContext } from '../post-details/post-details-context.svelte';

	const ctx = getPostDetailsContext();
</script>

<div class="summary">
	<RelativeTime value={ctx.post.change} />
	<span>•</span>
	<Score value={ctx.post.score} />
	<span class="divider"></span>

	{#if ctx.post.comment_count}
		<button
			type="button"
			class:active={ctx.overflowOpen || ctx.activeTab === 'links' || ctx.activeTab === 'comments'}
			onclick={(e) => {
				e.stopPropagation();
				ctx.toggleOverflow();
			}}
		>
			<Icon icon="dots" />
			<span class="count-text">
				{formatCount((ctx.post.comment_count || 0) + ctx.links)}
			</span>
		</button>
	{:else}
		<button
			type="button"
			class:active={ctx.activeTab === 'links'}
			onclick={(e) => {
				e.stopPropagation();
				ctx.selectTab('links');
			}}
			aria-label="Show links"
		>
			<Icon icon="link" />
		</button>
	{/if}

	<BookmarkButton post={ctx.post} ontabselected={ctx.selectTab} />
	<button
		type="button"
		class:active={ctx.activeTab === 'tags'}
		onclick={(e) => {
			e.stopPropagation();
			ctx.selectTab('tags');
		}}
	>
		<Icon icon="tag" />
		<span class="count-text">{formatCount(ctx.post.tags.length)}</span>
	</button>
</div>

<style lang="scss">
	.summary {
		display: flex;
		align-items: center;
		overflow-x: auto;
		gap: var(--small-gap);
		background-color: var(--background-1);
	}

	span.divider {
		flex-grow: 1;
	}

	button {
		white-space: nowrap;
		display: inline-flex;
		gap: var(--tiny-gap);
		align-items: center;
		background-color: var(--background-2);
		padding: var(--small-gap);
		border-radius: var(--border-radius);
		border: 2px solid transparent;
		position: relative;
		overflow: hidden;
		transition: border-color 100ms ease-out;
	}

	button.active {
		background-color: var(--background-3);
	}

	// Hide count text on mobile
	@media (max-width: 640px) {
		.count-text {
			display: none;
		}
	}
</style>

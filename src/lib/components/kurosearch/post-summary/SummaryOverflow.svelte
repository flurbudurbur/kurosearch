<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { getPostDetailsContext } from '../post-details/post-details-context.svelte';

	const ctx = getPostDetailsContext();
</script>

<div class="menu">
	<button
		type="button"
		class:active={ctx.activeTab === 'links'}
		onclick={(e) => {
			e.stopPropagation();
			ctx.selectTab('links');
		}}
	>
		<Icon icon="link" />
		<span class="count-text">{formatCount(ctx.links)}</span>
		Links
	</button>
	<button
		type="button"
		class:active={ctx.activeTab === 'comments'}
		onclick={(e) => {
			e.stopPropagation();
			ctx.selectTab('comments');
		}}
	>
		<Icon icon="message" />
		<span class="count-text">{formatCount(ctx.post.comment_count)}</span>
		Comments
	</button>
</div>

<style lang="scss">
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

	.menu {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--small-gap);
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

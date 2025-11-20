<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import SavedPostsStore from '$lib/store/saved-posts-store';

	interface Props {
		post: kurosearch.Post;
		ontabselected: (tab: string) => void;
	}

	let { post, ontabselected }: Props = $props();

	let saved = $derived($SavedPostsStore.posts.some((p) => p.id === post.id));
	let justSaved = $state(false);

	const toggleSaved = () => {
		if (saved) {
			SavedPostsStore.remove({ id: post.id });
		} else {
			SavedPostsStore.add({ id: post.id });
			// Trigger fill animation when saving
			justSaved = true;
			setTimeout(() => {
				justSaved = false;
			}, 400);
		}
	};
</script>

<button
	type="button"
	class="bookmark-button"
	onclick={(e) => {
		e.stopPropagation();
		toggleSaved();
		ontabselected('saved');
	}}
	aria-label="{saved ? 'Remove from' : 'Add to'} saved posts"
>
	<span class="icon-wrapper" class:filling={justSaved}>
		<span class="icon-outline">
			<Icon icon="bookmark" />
		</span>
		<span class="icon-filled" class:show={saved}>
			<Icon icon="bookmark-filled" color="gold" />
		</span>
	</span>
</button>

<style lang="scss">
	button {
		white-space: nowrap;
		display: inline-flex;
		gap: var(--tiny-gap);
		align-items: center;
		background-color: var(--background-2);
		padding: var(--small-gap);
		border-radius: var(--border-radius);
		position: relative;
		overflow: hidden;
	}

	.icon-wrapper {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.icon-outline,
	.icon-filled {
		transition: opacity 200ms ease-out;
	}

	.icon-filled {
		position: absolute;
		opacity: 0;
		clip-path: inset(100% 0 0 0);
	}

	.icon-filled.show {
		opacity: 1;
		clip-path: inset(0 0 0 0);
	}

	.icon-wrapper.filling .icon-filled {
		animation: fill-bookmark 400ms ease-out forwards;
	}

	@keyframes fill-bookmark {
		from {
			opacity: 1;
			clip-path: inset(100% 0 0 0);
		}
		to {
			opacity: 1;
			clip-path: inset(0 0 0 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-wrapper.filling .icon-filled {
			animation: none;
		}
	}
</style>

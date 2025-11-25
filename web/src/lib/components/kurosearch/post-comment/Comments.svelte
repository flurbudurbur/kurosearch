<script lang="ts">
	import { commentsClient } from '$lib/logic/api-client';
	import LoadingAnimation from '$lib/components/pure/loading-animation/LoadingAnimation.svelte';
	import Comment from '$lib/components/kurosearch/post-comment/Comment.svelte';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';

	interface Props {
		post: kurosearch.Post;
	}

	let { post }: Props = $props();

	const loadComments = async (postId: number, key: string, user: string) => {
		if (key && user) {
			commentsClient.setAuth(key, user);
		}
		return commentsClient.getComments(postId);
	};
</script>

{#await loadComments(post.id, $apiKey, $userId)}
	<LoadingAnimation />
{:then comments}
	{#if comments.length > 0}
		<ul class="comments">
			{#each comments as comment}
				<Comment {comment} />
			{/each}
		</ul>
	{:else}
		<p class="no-comments">
			Comments for this post are not available. <br />This can happen if comments have been deleted.
		</p>
	{/if}
{/await}

<style lang="scss">
	.comments {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		animation: slide-down 0.2s cubic-bezier(0.23, 1, 0.32, 1);
	}

	.no-comments {
		text-align: center;
	}
</style>

<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		paused: boolean;
		loading: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
	}

	let { paused, loading, onclick, ...rest }: Props = $props();
</script>

<button type="button" {onclick} class={rest.class}>
	{#if loading}
		<Icon icon="loader" color="white" class="loading" />
	{:else if paused}
		<Icon icon="play" color="white" class="visual-cohesion" />
	{:else}
		<Icon icon="pause" color="white" />
	{/if}
</button>

<style lang="scss">
	button {
		--size: 48px;

		border-radius: var(--size);
		width: var(--size);
		height: var(--size);
		padding: 8px 6px 6px;

		color: #000;
		background-color: #fff;

		user-select: none;
	}

	:global(.loading) {
		animation: spin 1s ease-in-out infinite;
	}

	:global(.visual-cohesion) {
		transform: translateX(1px);
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

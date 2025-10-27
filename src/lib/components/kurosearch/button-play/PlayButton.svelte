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
		<Icon icon="loader" color="white" class="player-loading" />
	{:else if paused}
		<Icon icon="player-play" color="white" class="visual-cohesion" />
	{:else}
		<Icon icon="player-pause" color="white" />
	{/if}
</button>

<style lang="scss">
	button {
		--size: 48px;

		border-radius: var(--size);
		width: var(--size);
		height: var(--size);
		padding: 8px 6px 6px;

		background-color: #0008;

		user-select: none;
	}

	:global(.player-loading) {
		animation: player-spin 1s ease-in-out infinite;
	}

	:global(.visual-cohesion) {
		transform: translateX(1px);
	}

	@keyframes player-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

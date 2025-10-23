<script module lang="ts">
	let volume: number = $state(1);

	export const getVolume = () => volume;
</script>

<script lang="ts">
	import IconButton from '$lib/components/pure/button/IconButton.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		class?: string;
	}

	let props: Props = $props();

	let isVolumeVisible = $state(false);
</script>

<div class="volume-control-wrapper">
	<IconButton
		id="volume-button"
		class={props.class}
		variant="transparent"
		onclick={() => {
			isVolumeVisible = !isVolumeVisible;
		}}
		aria-label="Volume control"
		title="Adjust volume"
		aria-expanded={isVolumeVisible}
	>
		<Icon icon="volume" />
	</IconButton>
	{#if isVolumeVisible}
		<input
			class="volume-slider"
			type="range"
			min="0"
			max="1"
			step="0.01"
			bind:value={volume}
			aria-label="Volume slider"
			aria-valuemin={0}
			aria-valuemax={1}
			aria-valuenow={volume}
			aria-valuetext="{Math.round(volume * 100)}%"
			onclick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
		/>
	{/if}
</div>

<style>
    .volume-control-wrapper {
        display: inline-flex;
        flex-direction: column-reverse;
        align-items: center;
        gap: 0.5rem;
				position: relative;
    }

    .volume-slider {
				top: -7.5em;
				position: absolute;
				rotate: -90deg;
				appearance: progress-bar; /* Modern browsers */
        -webkit-appearance: progress-bar; /* WebKit */
    }
</style>

<script module lang="ts">
	let volume: number = $state(1);
	let muted: boolean = $state(false);
	let previousVolume: number = 1;

	export const getVolume = () => volume;
	export const getMuted = () => muted;

	export const toggleMute = () => {
		if (muted) {
			// Unmute: restore previous volume
			volume = previousVolume;
			muted = false;
		} else {
			// Mute: save current volume and set muted
			previousVolume = volume;
			muted = true;
		}
	};
</script>

<script lang="ts">
	import IconButton from '$lib/components/pure/button/IconButton.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { onMount } from 'svelte';

	interface Props {
		class?: string;
	}

	let props: Props = $props();

	let isVolumeVisible = $state(false);
	let isTouchDevice = $state(false);

	onMount(() => {
		// Detect if device uses touch as primary input
		isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
	});

	const handleButtonClick = () => {
		if (isTouchDevice) {
			// Mobile: toggle mute
			toggleMute();
		} else {
			// Desktop: show slider
			isVolumeVisible = !isVolumeVisible;
		}
	};

	const handleVolumeChange = () => {
		// If user adjusts slider, automatically unmute
		if (muted) {
			muted = false;
		}
	};

	// Determine which icon to show based on mute state and volume level
	const getVolumeIcon = () => {
		if (muted) {
			return 'volume-off';
		} else if (volume < 0.33) {
			return 'volume-2';
		} else {
			return 'volume-3';
		}
	};
</script>

<div class="volume-control-wrapper">
	<IconButton
		id="volume-button"
		class={props.class}
		variant="transparent"
		onclick={handleButtonClick}
		aria-label={isTouchDevice ? (muted ? 'Unmute' : 'Mute') : 'Volume control'}
		title={isTouchDevice ? (muted ? 'Unmute' : 'Mute') : 'Adjust volume'}
		aria-expanded={isVolumeVisible}
	>
		<Icon icon={getVolumeIcon()} />
	</IconButton>
	{#if isVolumeVisible}
		<input
			class="volume-slider"
			type="range"
			min="0"
			max="1"
			step="0.01"
			bind:value={volume}
			oninput={handleVolumeChange}
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

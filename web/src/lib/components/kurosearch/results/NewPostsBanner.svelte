<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { useScrollTracking } from '$lib/logic/scroll-tracking.svelte';

	interface Props {
		count: number;
		onload: () => void;
		ondismiss: () => void;
	}

	let { count, onload, ondismiss }: Props = $props();

	// Track scroll position for visibility logic
	const scroll = useScrollTracking({ hideThreshold: 320 });

	// Hide banner when scrolling down and far from top (same logic as header)
	const hide = $derived(scroll.direction === 'down' && !scroll.isNearTop);

	const handleLoad = () => {
		onload();
	};

	const handleDismiss = (event: MouseEvent) => {
		event.stopPropagation();
		ondismiss();
	};
</script>

<div class="container">
	<div class="banner" class:hide role="status" aria-live="polite">
		<button class="banner-content" onclick={handleLoad} title="Load {count} new posts">
			<Icon icon="info-circle" size="1.5rem" />
			<span class="text">{formatCount(count)} new {count === 1 ? 'post' : 'posts'} available</span>
		</button>
		<button
			class="dismiss"
			onclick={handleDismiss}
			title="Dismiss"
			aria-label="Dismiss notification"
		>
			<Icon icon="x" size="1.25rem" />
		</button>
	</div>
</div>

<style lang="scss">
	.container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: -100;
	}

	.banner {
		position: sticky;
		top: calc(var(--line-height) * 2 + var(--small-gap));
		left: 50%;
		transform: translateX(-50%);
		z-index: 99;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--tag-gap);
		padding: var(--tag-gap);
		width: fit-content;
		max-width: calc(100vw - 4rem);
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark, var(--accent)) 100%);
		color: white;
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		transition:
			transform 0.3s ease-in-out,
			opacity 0.3s ease-in-out;
		will-change: transform, opacity;
		contain: layout style paint;
		opacity: 1;

		// Hide banner by shifting it up and fading out
		&.hide {
			transform: translateX(-50%) translateY(-300%);
			//opacity: 0;
			//pointer-events: none;
		}
	}

	.banner-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--small-gap);
		background: none;
		border: none;
		padding: 0;
		color: inherit;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: transform 0.2s ease;
		will-change: transform;

		&:hover {
			transform: translateY(-2px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.text {
		flex: 1;
		text-align: left;
	}

	.dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		background: rgba(255, 255, 255, 0.2);
		border: none;
		border-radius: 50%;
		color: inherit;
		font-size: 1.5rem;
		line-height: 1;
		cursor: pointer;
		transition: all 0.2s ease;
		will-change: transform, background;
		flex-shrink: 0;

		&:hover {
			background: rgba(255, 255, 255, 0.3);
			transform: rotate(90deg);
		}

		&:active {
			transform: rotate(90deg) scale(0.9);
		}
	}

	@media (max-width: 600px) {
		.banner {
			padding: var(--small-gap);
			max-width: calc(100vw - 2rem);
		}

		.text {
			font-size: 0.9rem;
		}
	}
</style>

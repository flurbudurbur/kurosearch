<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';

	interface Props {
		count: number;
		onload: () => void;
		ondismiss: () => void;
	}

	let { count, onload, ondismiss }: Props = $props();

	const handleLoad = () => {
		onload();
	};

	const handleDismiss = (event: MouseEvent) => {
		event.stopPropagation();
		ondismiss();
	};
</script>

<div class="banner" role="status" aria-live="polite">
	<button class="banner-content" onclick={handleLoad} title="Load {count} new posts">
		<span class="icon">↑</span>
		<span class="text">{formatCount(count)} new {count === 1 ? 'post' : 'posts'} available</span>
	</button>
	<button class="dismiss" onclick={handleDismiss} title="Dismiss" aria-label="Dismiss notification">
		×
	</button>
</div>

<style lang="scss">
	.banner {
		position: sticky;
		top: calc(var(--header-height) + var(--default-gap));
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--small-gap);
		margin-bottom: var(--default-gap);
		padding: var(--default-gap);
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark, var(--accent)) 100%);
		color: white;
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		animation: slideDown 0.3s ease-out;
		contain: layout style paint;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
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

		&:hover {
			transform: translateY(-2px);
		}

		&:active {
			transform: translateY(0);
		}
	}

	.icon {
		font-size: 1.5rem;
		line-height: 1;
		animation: bounce 1s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
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
			top: calc(var(--header-height) + var(--small-gap));
			margin-bottom: var(--small-gap);
			padding: var(--small-gap);
		}

		.text {
			font-size: 0.9rem;
		}
	}
</style>

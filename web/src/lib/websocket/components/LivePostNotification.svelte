<script lang="ts">
	import { lastNewPost } from '$lib/websocket';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { formatCount } from '$lib/logic/format-count';

	interface Props {
		onclick?: () => void;
	}

	let { onclick }: Props = $props();

	// Track new posts
	let newPostIds = $state<Set<number>>(new Set());
	let visible = $state(false);
	let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

	// Watch for new posts
	$effect(() => {
		const lastPost = $lastNewPost;
		if (lastPost && lastPost.data) {
			// Add new post ID to the set
			newPostIds.add(lastPost.data.id);
			// eslint-disable-next-line no-self-assign
			newPostIds = newPostIds; // Trigger reactivity

			// Show notification
			visible = true;

			// Clear existing timeout
			if (dismissTimeout) {
				clearTimeout(dismissTimeout);
			}

			// Auto-dismiss after 5 seconds
			dismissTimeout = setTimeout(() => {
				visible = false;
			}, 5000);
		}
	});

	const count = $derived(newPostIds.size);

	const handleClick = () => {
		if (onclick) {
			onclick();
		}
		// Clear new posts and hide notification
		newPostIds.clear();
		// eslint-disable-next-line no-self-assign
		newPostIds = newPostIds; // Trigger reactivity
		visible = false;

		if (dismissTimeout) {
			clearTimeout(dismissTimeout);
		}
	};

	const handleDismiss = (event: MouseEvent) => {
		event.stopPropagation();
		visible = false;
		newPostIds.clear();
		// eslint-disable-next-line no-self-assign
		newPostIds = newPostIds; // Trigger reactivity

		if (dismissTimeout) {
			clearTimeout(dismissTimeout);
		}
	};
</script>

{#if visible && count > 0}
	<div class="notification" role="status" aria-live="polite" aria-label="New posts notification">
		<button
			class="notification-content"
			onclick={handleClick}
			title="View {count} new {count === 1 ? 'post' : 'posts'}"
			aria-label="View {count} new {count === 1 ? 'post' : 'posts'}"
		>
			<span class="icon-wrapper">
				<Icon icon="info-circle" size="1.25rem" />
			</span>
			<span class="text">
				{formatCount(count)} new {count === 1 ? 'post' : 'posts'}
			</span>
		</button>
		<button
			class="dismiss"
			onclick={handleDismiss}
			title="Dismiss notification"
			aria-label="Dismiss notification"
		>
			<Icon icon="x" size="1.25rem" />
		</button>
	</div>
{/if}

<style lang="scss">
	// Variables
	$transition-speed: 0.2s;
	$transition-ease: ease;
	$animation-speed: 0.3s;
	$white-overlay-light: rgba(255, 255, 255, 0.1);
	$white-overlay-medium: rgba(255, 255, 255, 0.2);
	$white-overlay-heavy: rgba(255, 255, 255, 0.3);
	$white-semi-transparent: rgba(255, 255, 255, 0.5);
	$shadow-default: 0 4px 12px rgba(0, 0, 0, 0.2);
	$outline-width: 2px;
	$outline-offset: 2px;
	$dismiss-size: 2rem;
	$mobile-breakpoint: 600px;

	// Mixins
	@mixin flex-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	@mixin button-reset {
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
	}

	@mixin focus-visible-outline($color: $white-semi-transparent) {
		&:focus-visible {
			outline: $outline-width solid $color;
			outline-offset: $outline-offset;
		}
	}

	@mixin hover-scale($scale: 0.98) {
		&:active {
			transform: scale($scale);
		}
	}

	// Keyframes
	@keyframes slideDown {
		from {
			transform: translateX(-50%) translateY(-120%);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) translateY(0);
			opacity: 1;
		}
	}

	// Notification container
	.notification {
		position: fixed;
		top: calc(var(--header-height, 60px) + var(--default-gap, 1rem));
		left: 50%;
		transform: translateX(-50%);
		z-index: 200;
		@include flex-center;
		gap: var(--small-gap, 0.5rem);
		padding: var(--small-gap, 0.5rem);
		background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark, var(--accent)) 100%);
		color: white;
		border-radius: var(--border-radius, 8px);
		box-shadow: $shadow-default;
		animation: slideDown $animation-speed ease-out;
		contain: layout style paint;
		max-width: min(90vw, 400px);
	}

	// Notification content button
	.notification-content {
		flex: 1;
		@include flex-center;
		gap: var(--small-gap, 0.5rem);
		@include button-reset;
		padding: var(--small-gap, 0.5rem);
		font-size: 0.95rem;
		font-weight: 500;
		border-radius: var(--border-radius, 8px);
		transition:
			transform $transition-speed $transition-ease,
			background-color $transition-speed $transition-ease;

		&:hover {
			background-color: $white-overlay-light;
		}

		@include hover-scale;
		@include focus-visible-outline;
	}

	// Icon wrapper
	.icon-wrapper {
		@include flex-center;
	}

	// Text content
	.text {
		flex: 1;
		text-align: left;
		white-space: nowrap;
	}

	// Dismiss button
	.dismiss {
		@include flex-center;
		@include button-reset;
		width: $dismiss-size;
		height: $dismiss-size;
		background: $white-overlay-medium;
		border-radius: 50%;
		flex-shrink: 0;
		transition: all $transition-speed $transition-ease;

		&:hover {
			background: $white-overlay-heavy;
			transform: rotate(90deg);
		}

		&:active {
			transform: rotate(90deg) scale(0.9);
		}

		@include focus-visible-outline;
	}

	// Mobile styles
	@media (max-width: $mobile-breakpoint) {
		.notification {
			top: calc(var(--header-height, 60px) + var(--small-gap, 0.5rem));
			padding: var(--small-gap, 0.5rem);
		}

		.notification-content {
			padding: 0.25rem;
		}

		.text {
			font-size: 0.875rem;
		}
	}

	// Reduced motion
	@media (prefers-reduced-motion: reduce) {
		.notification {
			animation: none;
		}

		.icon-wrapper {
			animation: none;
		}

		.dismiss {
			&:hover {
				transform: none;
			}
		}
	}
</style>

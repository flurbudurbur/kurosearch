<script lang="ts">
	import { isConnected, isConnecting, isDisconnected, hasError, connect } from '$lib/websocket';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		showLabel?: boolean;
		allowReconnect?: boolean;
	}

	let { showLabel = false, allowReconnect = true }: Props = $props();

	// Determine status display properties
	const statusConfig = $derived.by(() => {
		if ($isConnected) {
			return {
				label: 'Connected',
				color: 'var(--status-success, #4caf50)',
				icon: 'star-filled',
				ariaLabel: 'WebSocket connected'
			};
		} else if ($isConnecting) {
			return {
				label: 'Connecting',
				color: 'var(--status-warning, #ff9800)',
				icon: 'loader',
				ariaLabel: 'WebSocket connecting'
			};
		} else if ($hasError) {
			return {
				label: 'Error',
				color: 'var(--status-error, #f44336)',
				icon: 'alert-circle',
				ariaLabel: 'WebSocket connection error'
			};
		} else {
			return {
				label: 'Disconnected',
				color: 'var(--status-inactive, #9e9e9e)',
				icon: 'x',
				ariaLabel: 'WebSocket disconnected'
			};
		}
	});

	const handleClick = () => {
		if (allowReconnect && ($isDisconnected || $hasError)) {
			connect();
		}
	};

	const clickable = $derived(allowReconnect && ($isDisconnected || $hasError));
</script>

{#if clickable}
	<button
		class="connection-status clickable"
		type="button"
		aria-label="{statusConfig.ariaLabel}. Click to reconnect"
		title={statusConfig.label}
		onclick={handleClick}
		style="--status-color: {statusConfig.color}"
	>
		<div class="indicator" class:connected={$isConnected} class:connecting={$isConnecting}>
			<Icon icon={statusConfig.icon} size="1rem" />
		</div>
		{#if showLabel}
			<span class="label">{statusConfig.label}</span>
		{/if}
		<span class="reconnect-hint">Click to reconnect</span>
	</button>
{:else}
	<div
		class="connection-status"
		role="status"
		aria-live="polite"
		aria-label={statusConfig.ariaLabel}
		title={statusConfig.label}
		style="--status-color: {statusConfig.color}"
	>
		<div class="indicator" class:connected={$isConnected} class:connecting={$isConnecting}>
			<Icon icon={statusConfig.icon} size="1rem" />
		</div>
		{#if showLabel}
			<span class="label">{statusConfig.label}</span>
		{/if}
	</div>
{/if}

<style lang="scss">
	.connection-status {
		display: inline-flex;
		align-items: center;
		gap: var(--small-gap, 0.5rem);
		padding: var(--small-gap, 0.5rem);
		border-radius: var(--border-radius, 8px);
		background-color: var(--background-1);
		transition: all 0.2s ease;
		position: relative;
		border: none;
		font: inherit;

		&.clickable {
			cursor: pointer;

			&:hover {
				background-color: var(--background-2);
				transform: scale(1.05);
			}

			&:active {
				transform: scale(0.98);
			}

			&:focus-visible {
				outline: 2px solid var(--accent);
				outline-offset: 2px;
			}
		}

		// Tooltip on hover
		&:hover .reconnect-hint {
			opacity: 1;
			visibility: visible;
		}
	}

	.indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		background-color: var(--status-color);
		color: white;
		position: relative;
		transition: all 0.3s ease;

		&::before {
			content: '';
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 50%;
			background-color: var(--status-color);
			opacity: 0.3;
			animation: pulse 2s ease-in-out infinite;
		}

		&.connected::before {
			animation: pulse 2s ease-in-out infinite;
		}

		&.connecting {
			animation: spin 1s linear infinite;

			&::before {
				animation: none;
			}
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.3;
		}
		50% {
			transform: scale(1.2);
			opacity: 0;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text);
		white-space: nowrap;
	}

	.reconnect-hint {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		padding: var(--small-gap, 0.5rem) var(--default-gap, 1rem);
		background-color: var(--background-0);
		border: 1px solid var(--background-2);
		border-radius: var(--border-radius, 8px);
		font-size: 0.75rem;
		color: var(--text);
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.2s ease;
		z-index: 100;
		pointer-events: none;

		// Tooltip arrow
		&::after {
			content: '';
			position: absolute;
			top: 100%;
			left: 50%;
			transform: translateX(-50%);
			border: 6px solid transparent;
			border-top-color: var(--background-2);
		}
	}

	@media (max-width: 600px) {
		.connection-status {
			padding: 0.375rem;
		}

		.indicator {
			width: 1.5rem;
			height: 1.5rem;
		}

		.label {
			font-size: 0.8rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.connection-status {
			transition: none;

			&.clickable:hover {
				transform: none;
			}

			&.clickable:active {
				transform: none;
			}
		}

		.indicator {
			transition: none;
			animation: none;

			&::before {
				animation: none;
			}

			&.connecting {
				animation: none;
			}
		}

		.reconnect-hint {
			transition: none;
		}
	}

	// High contrast mode support
	@media (prefers-contrast: more) {
		.connection-status {
			border: 2px solid var(--status-color);
		}

		.indicator {
			border: 2px solid white;
		}
	}
</style>

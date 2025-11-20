<script lang="ts">
	import { lastSyncNotification, hasError, useSyncCode } from '$lib/websocket';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { onMount } from 'svelte';

	interface Props {
		syncCode: string;
		onsynced?: () => void;
	}

	let { syncCode, onsynced }: Props = $props();

	let status = $state<'waiting' | 'synced' | 'error'>('waiting');
	let showSuccessMessage = $state(false);

	onMount(() => {
		// Subscribe to sync code
		const syncCodeHook = useSyncCode(syncCode);

		// Clean up on unmount
		return () => {
			syncCodeHook.unsubscribe();
		};
	});

	// Watch for sync notifications
	$effect(() => {
		const notification = $lastSyncNotification;
		if (notification && notification.data.code === syncCode) {
			if (notification.data.consumed) {
				status = 'synced';
				showSuccessMessage = true;

				// Auto-hide success message after 3 seconds
				setTimeout(() => {
					showSuccessMessage = false;
					onsynced?.();
				}, 3000);
			}
		}
	});

	// Watch for errors
	$effect(() => {
		if ($hasError) {
			status = 'error';
		}
	});

	const copyCode = async () => {
		try {
			await navigator.clipboard.writeText(syncCode);
		} catch (error) {
			console.error('Failed to copy sync code:', error);
		}
	};
</script>

<div class="sync-status" class:synced={status === 'synced'} role="status" aria-live="polite">
	{#if status === 'waiting'}
		<div class="status-content">
			<div class="icon-wrapper">
				<Icon icon="loader" size="1.5rem" />
			</div>
			<div class="info">
				<p class="title">Waiting for sync...</p>
				<p class="description">Share this code on your other device:</p>
				<div class="code-container">
					<code class="sync-code" aria-label="Sync code">{syncCode}</code>
					<button
						class="copy-button"
						onclick={copyCode}
						title="Copy sync code"
						aria-label="Copy sync code to clipboard"
					>
						<Icon icon="file-upload" size="1.25rem" />
					</button>
				</div>
			</div>
		</div>
	{:else if status === 'synced' && showSuccessMessage}
		<div class="status-content success">
			<div class="icon-wrapper success">
				<Icon icon="star-filled" size="2rem" />
			</div>
			<div class="info">
				<p class="title success">Synced!</p>
				<p class="description">Your data has been synchronized successfully.</p>
			</div>
		</div>
	{:else if status === 'error'}
		<div class="status-content error">
			<div class="icon-wrapper error">
				<Icon icon="alert-circle" size="1.5rem" />
			</div>
			<div class="info">
				<p class="title error">Connection Error</p>
				<p class="description">Failed to connect to sync server.</p>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.sync-status {
		display: flex;
		flex-direction: column;
		padding: var(--default-gap, 1rem);
		background-color: var(--background-1);
		border-radius: var(--border-radius, 8px);
		border: 2px solid var(--background-2);
		transition: all 0.3s ease;

		&.synced {
			background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark, var(--accent)) 100%);
			border-color: var(--accent);
		}
	}

	.status-content {
		display: flex;
		align-items: flex-start;
		gap: var(--default-gap, 1rem);

		&.success {
			color: white;
		}

		&.error {
			color: var(--text);
		}
	}

	.icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		background-color: var(--background-2);
		flex-shrink: 0;
		animation: spin 2s linear infinite;

		&.success {
			background-color: rgba(255, 255, 255, 0.2);
			animation: pulse 0.6s ease-out;
		}

		&.error {
			background-color: var(--background-2);
			animation: shake 0.5s ease-in-out;
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

	@keyframes pulse {
		0% {
			transform: scale(0.8);
			opacity: 0.5;
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--small-gap, 0.5rem);
	}

	.title {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0;

		&.success {
			color: white;
		}

		&.error {
			color: var(--text);
		}
	}

	.description {
		font-size: 0.875rem;
		color: var(--text-secondary, rgba(255, 255, 255, 0.7));
		margin: 0;
	}

	.code-container {
		display: flex;
		align-items: center;
		gap: var(--small-gap, 0.5rem);
		margin-top: var(--small-gap, 0.5rem);
	}

	.sync-code {
		flex: 1;
		padding: var(--small-gap, 0.5rem) var(--default-gap, 1rem);
		background-color: var(--background-0);
		border: 1px solid var(--background-2);
		border-radius: var(--border-radius, 8px);
		font-family: 'Courier New', monospace;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--accent);
		text-align: center;
		letter-spacing: 0.1em;
		user-select: all;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background-color: var(--background-2);
		border: none;
		border-radius: var(--border-radius, 8px);
		color: var(--text);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background-color: var(--accent);
			color: white;
		}

		&:active {
			transform: scale(0.95);
		}

		&:focus-visible {
			outline: 2px solid var(--accent);
			outline-offset: 2px;
		}
	}

	@media (max-width: 600px) {
		.sync-status {
			padding: var(--small-gap, 0.5rem);
		}

		.status-content {
			gap: var(--small-gap, 0.5rem);
		}

		.icon-wrapper {
			width: 2.5rem;
			height: 2.5rem;
		}

		.title {
			font-size: 1rem;
		}

		.description {
			font-size: 0.8rem;
		}

		.sync-code {
			font-size: 1rem;
			padding: var(--small-gap, 0.5rem);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-wrapper {
			animation: none;
		}

		.sync-status {
			transition: none;
		}

		.copy-button:active {
			transform: none;
		}
	}
</style>

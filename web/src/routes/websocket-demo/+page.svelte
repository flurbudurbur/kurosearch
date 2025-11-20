<script lang="ts">
	import { onMount } from 'svelte';
	import LivePostNotification from '$lib/websocket/components/LivePostNotification.svelte';
	import SyncStatus from '$lib/websocket/components/SyncStatus.svelte';
	import ConnectionStatus from '$lib/websocket/components/ConnectionStatus.svelte';
	import {
		connect,
		disconnect,
		subscribe,
		unsubscribe,
		lastNewPost,
		connectionState,
		subscribedChannels,
		lastMessage
	} from '$lib/websocket';
	import Button from '$lib/components/pure/button/Button.svelte';

	let showSyncStatus = $state(false);
	let syncCode = $state('');
	let postCount = $state(0);

	onMount(() => {
		// Connect to WebSocket
		connect();

		// Subscribe to channels
		subscribe(['live-posts', 'sync-notifications', 'cache-invalidation']);

		return () => {
			unsubscribe(['live-posts', 'sync-notifications', 'cache-invalidation']);
			disconnect();
		};
	});

	// Watch for new posts
	$effect(() => {
		if ($lastNewPost) {
			postCount++;
		}
	});

	function handleLoadNewPosts() {
		console.log('Loading new posts...');
		// In a real app, you would reload posts here
		postCount = 0;
	}

	async function handleGenerateSyncCode() {
		try {
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: 'sample sync data' })
			});

			if (response.ok) {
				const data = await response.json();
				syncCode = data.code;
				showSyncStatus = true;
			} else {
				console.error('Failed to generate sync code');
			}
		} catch (error) {
			console.error('Error generating sync code:', error);
		}
	}

	function handleSyncComplete() {
		console.log('Sync completed successfully!');
		showSyncStatus = false;
		syncCode = '';
	}
</script>

<svelte:head>
	<title>WebSocket Demo</title>
</svelte:head>

<div class="container">
	<header>
		<h1>WebSocket Components Demo</h1>
		<ConnectionStatus showLabel={true} />
	</header>

	<main>
		<!-- Live post notifications -->
		<LivePostNotification onclick={handleLoadNewPosts} />

		<section class="demo-section">
			<h2>Connection Status</h2>
			<p>The connection indicator shows the current WebSocket state:</p>
			<div class="examples">
				<div class="example">
					<ConnectionStatus showLabel={true} />
					<span class="description">With label</span>
				</div>
				<div class="example">
					<ConnectionStatus />
					<span class="description">Without label</span>
				</div>
			</div>
		</section>

		<section class="demo-section">
			<h2>Live Post Notifications</h2>
			<p>When new posts arrive via WebSocket, a notification will appear at the top of the page.</p>
			<p class="info">Posts received: <strong>{postCount}</strong></p>
		</section>

		<section class="demo-section">
			<h2>Sync Status</h2>
			<p>Generate a sync code to test the sync status component:</p>
			<Button onclick={handleGenerateSyncCode} disabled={showSyncStatus}>Generate Sync Code</Button>

			{#if showSyncStatus && syncCode}
				<div class="sync-container">
					<SyncStatus {syncCode} onsynced={handleSyncComplete} />
				</div>
			{/if}
		</section>

		<section class="demo-section">
			<h2>WebSocket Store State</h2>
			<div class="state-display">
				<div class="state-item">
					<span class="label">Connection State:</span>
					<code>{$connectionState}</code>
				</div>
				<div class="state-item">
					<span class="label">Subscribed Channels:</span>
					<code>{JSON.stringify($subscribedChannels)}</code>
				</div>
				<div class="state-item">
					<span class="label">Last Message Type:</span>
					<code>{$lastMessage?.type || 'none'}</code>
				</div>
			</div>
		</section>
	</main>
</div>

<style lang="scss">
	.container {
		min-height: 100vh;
		background-color: var(--background-0);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--default-gap, 1rem);
		background-color: var(--background-1);
		border-bottom: 2px solid var(--background-2);
		position: sticky;
		top: 0;
		z-index: 100;

		h1 {
			margin: 0;
			font-size: 1.5rem;
			color: var(--text);
		}
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--default-gap, 1rem);
	}

	.demo-section {
		margin-bottom: calc(var(--default-gap, 1rem) * 2);
		padding: var(--default-gap, 1rem);
		background-color: var(--background-1);
		border-radius: var(--border-radius, 8px);

		h2 {
			margin-top: 0;
			margin-bottom: var(--default-gap, 1rem);
			color: var(--accent);
		}

		p {
			margin-bottom: var(--default-gap, 1rem);
			color: var(--text);
			line-height: 1.6;
		}

		.info {
			padding: var(--small-gap, 0.5rem) var(--default-gap, 1rem);
			background-color: var(--background-2);
			border-radius: var(--border-radius, 8px);
			border-left: 4px solid var(--accent);

			strong {
				color: var(--accent);
			}
		}
	}

	.examples {
		display: flex;
		gap: var(--default-gap, 1rem);
		flex-wrap: wrap;
		margin-top: var(--default-gap, 1rem);
	}

	.example {
		display: flex;
		flex-direction: column;
		gap: var(--small-gap, 0.5rem);
		padding: var(--default-gap, 1rem);
		background-color: var(--background-2);
		border-radius: var(--border-radius, 8px);

		.description {
			font-size: 0.875rem;
			color: var(--text-secondary, rgba(255, 255, 255, 0.7));
			text-align: center;
		}
	}

	.sync-container {
		margin-top: var(--default-gap, 1rem);
	}

	.state-display {
		display: flex;
		flex-direction: column;
		gap: var(--small-gap, 0.5rem);
		margin-top: var(--default-gap, 1rem);
	}

	.state-item {
		display: flex;
		gap: var(--default-gap, 1rem);
		padding: var(--small-gap, 0.5rem) var(--default-gap, 1rem);
		background-color: var(--background-2);
		border-radius: var(--border-radius, 8px);

		.label {
			font-weight: 600;
			color: var(--text);
		}

		code {
			flex: 1;
			padding: 0.25rem 0.5rem;
			background-color: var(--background-0);
			border-radius: calc(var(--border-radius, 8px) / 2);
			font-family: 'Courier New', monospace;
			font-size: 0.875rem;
			color: var(--accent);
		}
	}

	@media (max-width: 600px) {
		header {
			h1 {
				font-size: 1.25rem;
			}
		}

		.demo-section {
			padding: var(--small-gap, 0.5rem);
		}

		.examples {
			flex-direction: column;
		}

		.state-item {
			flex-direction: column;
			gap: var(--small-gap, 0.5rem);
		}
	}
</style>

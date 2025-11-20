<script lang="ts">
	import { page } from '$app/stores';
	import { APP_NAME } from '$lib/logic/app-config';
</script>

<svelte:head>
	<title>{APP_NAME} - Error {$page.status}</title>
</svelte:head>

<div class="error-page">
	<div class="error-content">
		<h1>{$page.status}</h1>
		<h2>{$page.error?.message || 'An unexpected error occurred'}</h2>
		<p>
			{#if $page.status === 404}
				The page you're looking for doesn't exist.
			{:else if $page.status === 500}
				Something went wrong on our end. Please try again later.
			{:else}
				An error occurred while loading this page.
			{/if}
		</p>
		<div class="actions">
			<a href="/" class="button">Go to Home</a>
			<button onclick={() => window.history.back()} class="button secondary">Go Back</button>
		</div>
	</div>
</div>

<style lang="scss">
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: var(--grid-gap);
		background-color: var(--background-0);
	}

	.error-content {
		text-align: center;
		max-width: 600px;
	}

	h1 {
		font-size: 6rem;
		font-weight: bold;
		color: var(--text-highlight);
		margin: 0;
		line-height: 1;
	}

	h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text);
		margin: var(--grid-gap) 0;
	}

	p {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: var(--grid-gap) 0;
	}

	.actions {
		display: flex;
		gap: var(--grid-gap);
		justify-content: center;
		margin-top: calc(var(--grid-gap) * 2);
	}

	.button {
		padding: var(--grid-gap) calc(var(--grid-gap) * 2);
		border-radius: var(--border-radius);
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: var(--accent);
		color: var(--background-0);
	}

	.button:hover {
		opacity: 0.9;
		transform: translateY(-2px);
	}

	.button.secondary {
		background-color: var(--background-2);
		color: var(--text);
	}

	.button.secondary:hover {
		background-color: var(--background-3);
	}
</style>

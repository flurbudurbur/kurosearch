<script lang="ts">
	import Dialog from '$lib/components/pure/dialog/Dialog.svelte';
	import TextButton from '$lib/components/pure/button/TextButton.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';
	import { getReleasesUrl, type Changelog } from '$lib/logic/changelog-utils';

	interface Props {
		dialog: HTMLDialogElement | undefined;
		changelog: Changelog | null;
		currentVersion: string;
		onclose?: () => void;
		onacknowledge?: () => void;
	}

	let { dialog = $bindable(), changelog, currentVersion, onclose, onacknowledge }: Props = $props();

	const handleClose = () => {
		onacknowledge?.();
		dialog?.close();
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return '';
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};
</script>

<Dialog {onclose} bind:dialog aria-label="Changelog">
	<div class="changelog-content">
		<header>
			<Icon icon="notebook" size="1.5rem" />
			<h2>What's New</h2>
		</header>

		{#if changelog}
			<div class="version-info">
				<span class="version-tag">v{currentVersion}</span>
				{#if changelog.publishedAt}
					<span class="date">{formatDate(changelog.publishedAt)}</span>
				{/if}
			</div>

			<div class="changelog-body">
				{@html changelog.body}
			</div>
		{:else}
			<div class="error-state">
				<p>Unable to load changelog.</p>
				<a href={getReleasesUrl()} target="_blank" rel="noopener noreferrer">
					<Icon icon="brand-github" size="1rem" />
					View Releases on GitHub
				</a>
			</div>
		{/if}

		<footer>
			<TextButton title="Close changelog" onclick={handleClose}>Got it</TextButton>
		</footer>
	</div>
</Dialog>

<style lang="scss">
	.changelog-content {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		padding: 0.5rem;
		max-width: 600px;
		width: calc(100vw - 4rem);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--small-gap);

		h2 {
			color: var(--text-highlight);
			font-size: var(--text-size-h3);
			margin: 0;
		}
	}

	.version-info {
		display: flex;
		align-items: center;
		gap: var(--small-gap);

		.version-tag {
			background-color: var(--accent);
			color: var(--text-accent);
			padding: 0.25rem 0.5rem;
			border-radius: var(--border-radius);
			font-size: var(--text-size-small);
			font-weight: 600;
		}

		.date {
			color: var(--text-muted);
			font-size: var(--text-size-small);
		}
	}

	.changelog-body {
		background-color: var(--background-1);
		border-radius: var(--border-radius);
		padding: var(--grid-gap);
		max-height: 400px;
		overflow-y: auto;

		:global(h1),
		:global(h2),
		:global(h3) {
			color: var(--text-highlight);
			margin-top: 1em;
			margin-bottom: 0.5em;

			&:first-child {
				margin-top: 0;
			}
		}

		:global(ul),
		:global(ol) {
			padding-left: 1.5em;
			margin: 0.5em 0;
		}

		:global(li) {
			margin: 0.25em 0;
		}

		:global(code) {
			background-color: var(--background-2);
			padding: 0.1em 0.3em;
			border-radius: 3px;
			font-family: monospace;
		}

		:global(a) {
			color: var(--text-link);
		}

		:global(p) {
			margin: 0.5em 0;
		}
	}

	.error-state {
		text-align: center;
		padding: var(--grid-gap);

		p {
			margin-bottom: var(--grid-gap);
			color: var(--text-muted);
		}

		a {
			display: inline-flex;
			align-items: center;
			gap: var(--small-gap);
			color: var(--text-link);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	footer {
		display: flex;
		justify-content: center;
		padding-top: var(--grid-gap);
		border-top: 1px solid var(--background-2);
	}
</style>

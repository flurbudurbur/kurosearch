<script lang="ts">
	import Dialog from '$lib/components/pure/dialog/Dialog.svelte';
	import TextButton from '$lib/components/pure/button/TextButton.svelte';
	import NumberInput from '$lib/components/kurosearch/dialog-sort-filter/NumberInput.svelte';
	import resultColumns, { type ResultColumns } from '$lib/store/result-columns-store';
	import columnWidthStore from '$lib/store/column-width-store';
	import { browser } from '$app/environment';

	interface Props {
		dialog: HTMLDialogElement;
		onclose?: () => void;
	}

	let { dialog = $bindable(), onclose: _onclose }: Props = $props();

	// Local state for the dialog
	let localColumns = $state(parseInt($resultColumns));
	let localWidth = $state($columnWidthStore);

	// Auto-enable wide layout when more than 1 column
	$effect(() => {
		if (localColumns > 1) {
			localWidth = 100;
		}
	});

	// Screen width detection and recommendation
	let screenWidth = $state(browser ? window.innerWidth : 1024);
	let recommendedColumns = $derived.by(() => {
		if (screenWidth < 768) return 1;
		if (screenWidth < 1024) return 2;
		if (screenWidth < 1440) return 3;
		return 4;
	});

	const resetToRecommended = () => {
		localColumns = recommendedColumns;
		localWidth = 100;
	};

	const saveAndClose = () => {
		resultColumns.set(String(localColumns) as ResultColumns);
		columnWidthStore.set(localWidth);
		dialog?.close();
	};

	const cancel = () => {
		// Reset local state to current store values
		localColumns = parseInt($resultColumns);
		localWidth = $columnWidthStore;
		closeWithAnimation();
	};

	const closeWithAnimation = () => {
		// Add closing class to trigger fade-out animation
		dialog?.classList.add('closing');
		setTimeout(() => {
			dialog?.close();
			dialog?.classList.remove('closing');
		}, 200); // Match animation duration
	};

	// Update screen width on resize
	$effect(() => {
		if (!browser) return;

		const handleResize = () => {
			screenWidth = window.innerWidth;
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<Dialog onclose={closeWithAnimation} bind:dialog aria-label="Configure layout settings">
	<div class="dialog-content">
		<h2>Layout Configuration</h2>

		<div class="controls">
			<div class="control-group">
				<label for="columns-input">Number of Columns</label>
				<NumberInput
					bind:value={localColumns}
					min={1}
					max={20}
					step={1}
					aria-label="Number of columns"
				/>
				<span class="value-display">{localColumns} column{localColumns !== 1 ? 's' : ''}</span>
			</div>

			<div class="control-group">
				<label for="width-input">Maximum Width</label>
				<NumberInput
					bind:value={localWidth}
					min={50}
					max={100}
					step={5}
					aria-label="Maximum width percentage"
				/>
				<span class="value-display">{localWidth}% of screen</span>
			</div>
		</div>

		<div class="info-box">
			<p class="screen-info">
				Current screen width: <strong>{screenWidth}px</strong>
			</p>
			<p class="recommendation">
				Recommended columns: <strong>{recommendedColumns}</strong>
			</p>
		</div>

		<div class="preview-section">
			<h3>Preview</h3>
			<div class="preview-container" style="max-width: {localWidth}%;">
				<div class="preview-grid" style="--preview-columns: {localColumns};">
					{#each Array(localColumns) as _}
						<div class="preview-column"></div>
					{/each}
				</div>
			</div>
		</div>

		<div class="actions">
			<TextButton
				type="secondary"
				title="Reset to recommended settings"
				onclick={resetToRecommended}
			>
				Reset to Recommended
			</TextButton>
			<div class="action-group">
				<TextButton title="Cancel" onclick={cancel}>Cancel</TextButton>
				<TextButton type="primary" title="Save layout configuration" onclick={saveAndClose}>
					Save
				</TextButton>
			</div>
		</div>
	</div>
</Dialog>

<style lang="scss">
	:global(dialog[open]) {
		animation: fadeIn 0.2s ease-out;
	}

	:global(dialog[open].closing) {
		animation: fadeOut 0.2s ease-out forwards;
	}

	:global(dialog::backdrop) {
		animation: fadeIn 0.2s ease-out;
	}

	:global(dialog.closing::backdrop) {
		animation: fadeOut 0.2s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.dialog-content {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		padding: 1rem;
		width: calc(100vw - 4rem);
		max-width: 1400px;
	}

	h2 {
		color: var(--text-highlight);
		font-size: var(--text-size-h3);
		margin: 0;
		padding-block-end: var(--grid-gap);
	}

	h3 {
		color: var(--text-secondary);
		font-size: var(--text-size-h4);
		margin: 0;
		margin-block-end: 0.5rem;
	}

	.info-box {
		background-color: var(--background-1);
		border-radius: var(--border-radius);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.screen-info,
	.recommendation {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.recommendation {
		color: var(--text-highlight);
	}

	strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.controls {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		padding-block: 0.5rem;
		justify-content: center;
		align-items: center;
		flex-wrap: wrap;
	}

	.control-group {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		align-items: center;
	}

	label {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.value-display {
		font-size: 0.875rem;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.preview-section {
		margin-block-start: 1rem;
	}

	.preview-container {
		width: 100%;
		margin-inline: auto;
		padding: 1rem;
		background-color: var(--background-1);
		border-radius: var(--border-radius);
		overflow-x: auto;
	}

	.preview-grid {
		display: grid;
		grid-template-columns: repeat(var(--preview-columns), minmax(auto, 800px));
		gap: var(--small-gap);
		width: 100%;
		min-height: 120px;
		justify-content: center;
	}

	.preview-column {
		background: var(--background-2);
		border-radius: var(--border-radius);
		border: 2px solid var(--background-1);
		min-height: 120px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
		padding-block-start: 1rem;
		border-top: 1px solid var(--background-2);
	}

	.action-group {
		display: flex;
		gap: var(--grid-gap);
		flex-wrap: wrap;
	}

	@media (min-width: 768px) {
		.dialog-content {
			min-width: 600px;
		}

		.actions {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.control-group {
			flex-direction: row;
			align-items: center;
		}

		.value-display {
			margin-inline-start: auto;
		}
	}
</style>

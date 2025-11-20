<script lang="ts">
	import sort, { type SortStoreData } from '$lib/store/sort-store';
	import filter, { type FilterStoreData } from '$lib/store/filter-store';
	import type { Component } from 'svelte';
	import { addHistory } from '$lib/logic/use/onpopstate';
	import { getFilterLabel, getSortLabel } from './sortfilter';
	import { searchActions } from '$lib/store/search-actions-store';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	const serializeSortFilter = (sort: SortStoreData, filter: FilterStoreData) =>
		JSON.stringify(Object.assign({}, sort, filter));

	let dialog: HTMLDialogElement = $state<HTMLDialogElement>() as HTMLDialogElement;
	let sortFilterBefore = '';
	let SortFilterDialog:
		| Component<{
				dialog: HTMLDialogElement;
				onclose: () => void;
		  }>
		| undefined = $state(undefined);

	let filterLabel = $derived(
		getFilterLabel($filter.rating, $filter.scoreValue, $filter.scoreComparator)
	);
	let sortLabel = $derived(getSortLabel($sort.property, $sort.direction));
</script>

<button
	type="button"
	onclick={async () => {
		// Lazy-load SortFilterDialog only when user opens it
		if (!SortFilterDialog) {
			const module = await import('../dialog-sort-filter/SortFilterDialog.svelte');
			SortFilterDialog = module.default;
		}
		sortFilterBefore = serializeSortFilter($sort, $filter);
		dialog?.showModal();
		addHistory('dialog');
	}}
>
	<Icon icon="filter" />
	<span>{filterLabel}</span>
	<Icon icon="arrows-exchange" class="arrow-swap" />
	<span>{sortLabel}</span>
</button>

{#if SortFilterDialog}
	<SortFilterDialog
		bind:dialog
		onclose={() => {
			const sortFilterAfter = serializeSortFilter($sort, $filter);
			if (sortFilterAfter !== sortFilterBefore) {
				$searchActions.refreshSearch();
			}
		}}
	/>
{/if}

<style lang="scss">
	button {
		display: flex;
		align-items: center;
		align-self: stretch;
		background-color: transparent;
		color: var(--text);
	}

	span,
	:global(.icon) {
		user-select: none;
	}

	:global(.icon) {
		display: inline-block;
		margin-inline-end: var(--tiny-gap);
	}

	:global(.arrow-swap) {
		margin-inline-start: var(--grid-gap);
		transform: rotate(90deg);
	}

	@media (hover: hover) {
		button {
			padding-inline: var(--grid-gap);
			border-radius: var(--border-radius);
			transition: all var(--default-transition-behaviour);
		}
		button:hover {
			color: var(--text-highlight);
			background-color: var(--background-1);
		}
	}
</style>

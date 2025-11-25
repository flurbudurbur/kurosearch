<script lang="ts">
	import { browser } from '$app/environment';
	import type { Component } from 'svelte';
	import Searchbar from '$lib/components/kurosearch/searchbar/Searchbar.svelte';
	import ActiveTagList from '$lib/components/kurosearch/tag-list/ActiveTagList.svelte';
	import { tagsClient } from '$lib/logic/api-client';
	import { addHistory } from '$lib/logic/use/onpopstate';

	const getTagSuggestions = (term: string) => tagsClient.getTagSuggestions(term);
	const getTagDetails = (name: string, key: string, user: string) => {
		if (key && user) {
			tagsClient.setAuth(key, user);
		}
		return tagsClient.getTagDetails(name);
	};
	import activeSupertags from '$lib/store/active-supertags-store';
	import activeTags from '$lib/store/active-tags-store';
	import { allActiveTags, flattenedActiveTags } from '$lib/store/all-active-tags-store';
	import results from '$lib/store/results-store';
	import supertags from '$lib/store/supertags-store';
	import userId from '$lib/store/user-id-store';
	import apiKey from '$lib/store/api-key-store';
	import { onDestroy, onMount } from 'svelte';

	interface Props {
		loading: boolean;
		onsubmit: () => void;
	}

	let { loading, onsubmit }: Props = $props();

	let createSupertagDialog: HTMLDialogElement = $state<HTMLDialogElement>() as HTMLDialogElement;
	let CreateSupertagDialog:
		| Component<{
				dialog: HTMLDialogElement;
				tags: kurosearch.ModifiedTag[];
				onsubmit: (supertag: kurosearch.Supertag) => void;
		  }>
		| undefined = $state(undefined);

	const fetchSuggestions = async (term: string) => {
		const matchingTags = await getTagSuggestions(term);
		const matchingSupertags = $supertags.items
			.filter(({ name }) => name.toLowerCase().includes(term.toLowerCase()))
			.map((supertag) => ({
				label: supertag.name,
				count: supertag.tags.length,
				type: 'supertag' as kurosearch.TagType
			}));

		return [...matchingSupertags, ...matchingTags];
	};

	const keybinds = (event: KeyboardEvent) => {
		if (
			(event.key === '/' || event.key === 's') &&
			(!document.activeElement || document.activeElement === document.body)
		) {
			event.preventDefault();
			event.stopPropagation();
			document.getElementById('searchbar')?.focus();
		}

		if (event.ctrlKey && event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			onsubmit();
		}

		if (event.ctrlKey && event.key === 'm') {
			event.preventDefault();
			event.stopPropagation();
			document.getElementById('select-modifier')?.click();
		}
	};

	onMount(async () => {
		if (browser) {
			document.addEventListener('keydown', keybinds);
			if ($results.postCount === 0) {
				onsubmit();
			}
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', keybinds);
		}
	});
</script>

<section id="search">
	<Searchbar
		placeholder="Search for tags"
		{loading}
		{onsubmit}
		{fetchSuggestions}
		onpick={async (suggestion) => {
			if (suggestion.type === 'supertag') {
				const supertag = $supertags.items.find((x) => x.name === suggestion.label);
				if (!supertag) {
					console.warn('Supertag not present.');
					return;
				}
				activeSupertags.addOrReplace(supertag);
			} else {
				let tag = await getTagDetails(suggestion.label, $apiKey, $userId);

				activeTags.addOrReplace({
					name: suggestion.label,
					modifier: suggestion.modifier,
					count: suggestion.count,
					type: tag?.type ?? 'tag'
				});
			}
		}}
	/>
	<ActiveTagList
		tags={$allActiveTags}
		oncreateSupertag={async () => {
			// Lazy-load CreateSupertagDialog only when user wants to create a supertag
			if (!CreateSupertagDialog) {
				const module = await import(
					'$lib/components/kurosearch/dialog-create-supertag/CreateSupertagDialog.svelte'
				);
				CreateSupertagDialog = module.default;
			}
			createSupertagDialog?.showModal();
			addHistory('dialog');
		}}
	/>
</section>

{#if CreateSupertagDialog}
	<CreateSupertagDialog
		bind:dialog={createSupertagDialog}
		tags={$flattenedActiveTags}
		onsubmit={(supertag) => supertags.add(supertag)}
	/>
{/if}

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--grid-gap);
		padding-inline: var(--small-gap);
	}
</style>

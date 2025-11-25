<script lang="ts">
	import Searchbar from '$lib/components/kurosearch/searchbar/Searchbar.svelte';
	import ActiveTagList from '$lib/components/kurosearch/tag-list/ActiveTagList.svelte';
	import { tagsClient } from '$lib/logic/api-client';
	import activeTags from '$lib/store/active-tags-store';
	import supertags from '$lib/store/supertags-store';
	import activeSupertags from '$lib/store/active-supertags-store';
	import { allActiveTags } from '$lib/store/all-active-tags-store';
	import apiKey from '$lib/store/api-key-store';
	import userId from '$lib/store/user-id-store';
	import { APP_NAME } from '$lib/logic/app-config';

	const fetchSuggestions = async (term: string) => {
		const matchingTags = await tagsClient.getTagSuggestions(term);
		const matchingSupertags = $supertags.items
			.filter(({ name }) => name.toLowerCase().includes(term.toLowerCase()))
			.map((supertag) => ({
				label: supertag.name,
				count: supertag.tags.length,
				type: 'supertag' as kurosearch.TagType
			}));

		return [...matchingSupertags, ...matchingTags];
	};
</script>

<svelte:head>
	<title>{APP_NAME} - Query Builder</title>
	<meta
		name="description"
		content="Test your kurosearch queries. Useful if you already know how to use rule34.xxx"
	/>
</svelte:head>

<section>
	<Searchbar
		placeholder="Search for tags"
		onsubmit={() => {}}
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
				if ($apiKey && $userId) {
					tagsClient.setAuth($apiKey, $userId);
				}
				const tag = await tagsClient.getTagDetails(suggestion.label);
				activeTags.addOrReplace({
					name: suggestion.label,
					modifier: suggestion.modifier,
					count: suggestion.count,
					type: tag?.type ?? 'tag'
				});
			}
		}}
	/>
	<ActiveTagList tags={$allActiveTags} />
</section>

<style lang="scss">
	:global(main) {
		display: flex;
		flex-direction: column;
		gap: var(--grid-gap);
	}

	section {
		margin-block: 20vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--grid-gap);
	}
</style>

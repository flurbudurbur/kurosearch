<script lang="ts">
	import Searchbar from '$lib/components/kurosearch/searchbar/Searchbar.svelte';
	import { getTagSuggestions } from '$lib/logic/api-client/ApiClient';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.name ?? 'Tags'} - kurosearch</title>
	<meta
		name="description"
		content="Simple and powerful Rule34 browsing site with a focus on simplicity and user experience."
	/>
</svelte:head>

{#if data.name && data.tagData}
	<p>{data.tagData}</p>
{:else}
	<h1>Tags</h1>
	<Searchbar
		placeholder="Search for a tag..."
		fetchSuggestions={getTagSuggestions}
		onpick={(suggestion) => {
			window.location.href = '/tag?name=' + suggestion.label;
		}}
	/>
{/if}

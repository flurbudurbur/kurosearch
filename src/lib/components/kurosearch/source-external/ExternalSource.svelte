<script lang="ts">
	import { isValidUrl } from '$lib/logic/url-utils';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		source: string;
	}

	let { source }: Props = $props();

	let url = $derived(isValidUrl(source) ? new URL(source) : null);
	let label = $derived(url?.hostname?.replace(/^www./, ''));
</script>

{#if url}
	<a href={url.toString()} target="_newtab">
		<Icon icon="link" />
		{label}
	</a>
{/if}

<style lang="scss">
	a {
		color: var(--text-link);
		font-size: var(--text-size);
		text-decoration: none;
		white-space: nowrap;
		display: inline-flex;
		gap: var(--tiny-gap);
		align-items: center;
	}
</style>

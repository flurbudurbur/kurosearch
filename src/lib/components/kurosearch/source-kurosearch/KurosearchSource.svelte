<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		id: number;
	}

	let { id }: Props = $props();

	let url = $derived(`${resolve('/post')}/${id}`);
</script>

<a href={url} target="_newtab">
	<Icon icon="external-link" />
	Open
</a>

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

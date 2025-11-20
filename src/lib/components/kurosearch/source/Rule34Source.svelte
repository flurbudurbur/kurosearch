<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		url: string;
	}

	let { url }: Props = $props();
</script>

<a href={url} target="_newtab">
	<Icon icon="file" />
	File
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

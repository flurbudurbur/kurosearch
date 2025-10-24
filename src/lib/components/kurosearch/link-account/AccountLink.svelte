<script lang="ts">
	import { resolve } from '$app/paths';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		src?: string;
		preload?: boolean;
	}

	let { src, preload = false }: Props = $props();
</script>

<IconLink title="Account" href={resolve('/account')} {preload}>
	{#if src}
		<img class="profile-picture" {src} alt="Account" />
	{:else}
		<Icon icon="user-circle" />
	{/if}
</IconLink>

<style lang="scss">
	img,
	:global(.icon) {
		width: 16px;
		height: 16px;
		border-radius: 8px;
	}
</style>

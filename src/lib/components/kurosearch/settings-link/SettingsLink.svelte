<script lang="ts">
	import { resolve } from '$app/paths';
	import IconLink from '$lib/components/pure/icon-link/IconLink.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		preload?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let { preload = false, onclick }: Props = $props();
</script>

<IconLink title="Settings" href={resolve('/preferences')} class="gear" {preload} {onclick}>
	<Icon icon="settings" />
</IconLink>

<style lang="scss">
	:global(.icon) {
		height: 16px;
	}

	@media not (prefers-reduced-motion) {
		:global(.icon) {
			transition: transform 0.5s ease-out;
		}
	}
</style>

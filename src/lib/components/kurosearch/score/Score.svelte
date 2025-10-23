<script lang="ts">
	import { formatCount } from '$lib/logic/format-count';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		value: number;
	}

	let { value }: Props = $props();
</script>

<span data-testid="score">
	<Icon icon="heart" />
	{formatCount(value)}
</span>

<style lang="scss">
	span {
		white-space: nowrap;
		display: inline-flex;
		gap: var(--tiny-gap);
		align-items: center;
	}
</style>

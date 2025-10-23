<script lang="ts">
	import RotatingIconSelect from '$lib/components/pure/rotating-select/RotatingIconSelect.svelte';
	import { MODIFIERS_ICONS } from '$lib/logic/tag-modifier-data';

	interface Props {
		modifier: kurosearch.TagModifier;
	}

	let { modifier = $bindable() }: Props = $props();
</script>

<span class="container">
	<RotatingIconSelect
		id="select-modifier"
		bind:value={modifier}
		options={MODIFIERS_ICONS}
		aria-label="TagModifier Selector. Current value {modifier}."
	/>
</span>

<style lang="scss">
	.container {
		display: inline-block;
		will-change: background, scale;
		background: transparent;
		transition: background-color 200ms ease-in-out, scale 50ms ease-in-out;
		border-radius: 9999px;

		&:hover {
			cursor: pointer;
			background: var(--background-2);
		}

		&:active {
			background: var(--background-3);
			scale: 0.95;
		}
	}
</style>
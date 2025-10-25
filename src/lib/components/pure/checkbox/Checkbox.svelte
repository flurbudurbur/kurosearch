<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		checked: boolean;
		id: string;
		children?: Snippet;
	}

	let { checked = $bindable(), id, children }: Props = $props();
</script>

<label for={id}>
	<input type="checkbox" {id} bind:checked />
	{@render children?.()}
</label>

<style lang="scss">
	label {
		display: flex;
		align-items: center;
		gap: var(--grid-gap);
		cursor: pointer;
	}

	@media (max-width: 1024px) {
		label {
			min-height: 48px;
		}
	}

	input[type='checkbox'] {
		min-width: 24px;
		min-height: 24px;
		cursor: pointer;
	}
</style>

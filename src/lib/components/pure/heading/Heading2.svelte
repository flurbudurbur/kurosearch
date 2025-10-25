<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export interface Heading2Props extends HTMLAttributes<HTMLHeadingElement> {
		children: Snippet;
	}

	let { children, ...restProps }: Heading2Props = $props();
</script>

<h2 {...restProps}>{@render children()}</h2>

<style lang="scss">
	h2 {
		color: var(--text-highlight);
		font-size: var(--text-size-h2);
		padding-block-start: 4rem;
		padding-block-end: var(--grid-gap);
	}
</style>

<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export interface Heading3Props extends HTMLAttributes<HTMLHeadingElement> {
		children: Snippet;
	}

	let { children, ...restProps }: Heading3Props = $props();
</script>

<h3 {...restProps}>{@render children()}</h3>

<style lang="scss">
	h3 {
		color: var(--text-highlight);
		font-size: var(--text-size-h3);
		padding-block-start: 4rem;
		padding-block-end: var(--grid-gap);
	}
</style>

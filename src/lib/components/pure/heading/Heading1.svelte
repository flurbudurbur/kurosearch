<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export interface Heading1Props extends HTMLAttributes<HTMLHeadingElement> {
		children: Snippet;
	}

	let { children, ...restProps }: Heading1Props = $props();
</script>

<h1 {...restProps}>{@render children()}</h1>

<style lang="scss">
	h1 {
		color: var(--text-highlight);
		font-size: var(--text-size-h1);
		padding-block: 4rem;
		text-transform: capitalize;
	}

	@media (max-width: 768px) {
		h1 {
			font-size: 12.6vw;
			text-align: center;
		}
	}
</style>

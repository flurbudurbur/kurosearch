<script lang="ts">
	import type { Snippet } from 'svelte';
	import Heading2 from '../heading/Heading2.svelte';

	interface Props {
		title: string;
		description: string;
		children?: Snippet;
	}

	let { title, description, children }: Props = $props();
</script>

<div>
	<Heading2>{title}</Heading2>
	<p>{description}</p>
	{@render children?.()}
</div>

<style lang="scss">
	p {
		margin-block-end: var(--grid-gap);
	}
</style>

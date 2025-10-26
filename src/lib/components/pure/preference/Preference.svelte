<script lang="ts">
	import type { Snippet } from 'svelte';
	import Heading2 from '../heading/Heading2.svelte';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		title: string;
		description: string;
		children?: Snippet;
		icon?: string;
	}

	let { title, description, children, icon = undefined }: Props = $props();
</script>

<section>
	<div>
		{#if icon}
			<Icon {icon} size="32" />
		{/if}
		<Heading2>{title}</Heading2>
	</div>
	<p>{description}</p>
	{@render children?.()}
</section>

<style lang="scss">
	section {
		margin-block: 1rem 2rem;
	}

	p {
		margin-block-end: var(--grid-gap);
	}

	div {
		display: grid;
		grid-template-columns: auto 1fr;
		place-content: center;
		gap: var(--grid-gap);
		margin-bottom: 0.2em;
	}

	div :global(h2) {
		padding: 0;
		font-size: 1.5em;
		align-self: center;
	}
</style>

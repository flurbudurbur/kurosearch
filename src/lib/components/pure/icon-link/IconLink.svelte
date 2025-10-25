<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export interface IconLinkProps extends HTMLAnchorAttributes {
		title: string;
		href: string;
		newtab?: boolean;
		preload?: boolean;
		children?: Snippet;
	}

	let {
		title,
		href,
		newtab = false,
		class: className = '',
		preload = false,
		children,
		...restProps
	}: IconLinkProps = $props();

	let target = $derived(newtab ? '_blank' : restProps.target || '_self');
	let rel = $derived(newtab ? 'noopener noreferrer' : restProps.rel);
	let preloadData = $derived(preload ? 'hover' : undefined);
</script>

<a
	{title}
	{href}
	{target}
	{rel}
	aria-label={title}
	class={className}
	data-sveltekit-preload-data={preloadData}
	{...restProps}
>
	{@render children?.()}
</a>

<style lang="scss">
	a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--line-height);
		height: var(--line-height);
		border-radius: var(--border-radius-full);
		color: var(--text);
		background-color: transparent;
		font-size: var(--text-size-large);
		text-align: center;

		&:hover {
			background-color: var(--background-1);
			color: var(--text-highlight);
		}

		&:active {
			background-color: var(--background-2);
			scale: 0.95;
		}
	}

	@media (hover: hover) {
		a {
			transition: background-color var(--default-transition-behaviour);

			&:hover {
				background-color: var(--background-1);
				color: var(--text-highlight);
			}

			&:active {
				background-color: var(--background-2);
				scale: 0.95;
			}
		}
	}
</style>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	export interface IconTextLinkProps extends HTMLAnchorAttributes {
		title: string;
		href: string;
		icon: string;
		label: string;
		newtab?: boolean;
	}

	let {
		title,
		href,
		icon,
		label,
		newtab = false,
		class: className = '',
		...restProps
	}: IconTextLinkProps = $props();

	let target = $derived(newtab ? '_blank' : restProps.target || '_self');
	let rel = $derived(newtab ? 'noopener noreferrer' : restProps.rel);
</script>

<a {title} {href} {target} {rel} class={className} {...restProps}>
	<Icon {icon} />
	{label}
</a>

<style lang="scss">
	a {
		display: inline-flex;
		align-items: center;
		gap: var(--tiny-gap);
		color: currentColor;
		font-size: var(--text-size-small);
		vertical-align: middle;
		text-transform: capitalize;
		padding: 4px 8px;
		min-height: 24px;
		border-radius: var(--border-radius);
	}

	@media (hover: hover) {
		a {
			transition: color var(--default-transition-behaviour);
		}

		a:hover {
			color: var(--text-highlight);
		}
	}
</style>

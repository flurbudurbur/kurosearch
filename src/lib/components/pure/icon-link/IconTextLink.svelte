<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		title: string;
		href: string;
		icon: string;
		label: string;
		newtab?: boolean;
	}

	let { title, href, icon, label, newtab = false }: Props = $props();
</script>

<a
	{title}
	{href}
	target={newtab ? '_blank' : '_self'}
	rel={newtab ? 'noopener noreferrer' : undefined}
>
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

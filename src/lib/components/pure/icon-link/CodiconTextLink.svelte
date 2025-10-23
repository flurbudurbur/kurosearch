<script lang="ts">
	import Icon from '$lib/components/pure/icon/Icon.svelte';

	interface Props {
		title: string;
		href: string;
		icon: string;
		label: string;
		target?: string;
	}

	let { title, href, icon, label, target = '_self' }: Props = $props();
</script>

<a {title} {href} {target}>
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
